'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Force on the stem against travel x (0 to 4 mm), in centinewtons (1 cN is about 1 gram-force):
   *   spring: F0 + k x, with F0 and k scaled from the force wanted at the 2 mm actuation point (30 + 7.5 x for 45 cN);
   *   tactile bump: a leg on the stem rides over a bent metal leaf, adding force before the actuation point and removing
   *   a little just after; clicky switches have a sharper bump that collapses suddenly;
   *   friction of 3 cN opposes motion, so the release curve lies below the press curve.
   * Work per keystroke is the area under the press curve; 1 cN mm = 0.01 mJ.
   * Contact bounce: the moving contact lands, rebounds and lands again; each open interval is e times the last, so the
   * contact settles after T0 / (1 - e). A debouncer either reports the first edge and ignores further edges for N ms
   * (eager) or waits until the signal has been steady for N ms (deferred).
   * Matrix ghosting: without diodes, a pressed key joins its row wire to its column wire; any key whose row and column
   * are joined through other pressed keys also reads as pressed.
   */
  const TYPES = ['linear', 'tactile', 'clicky'], FRIC = 3, XMAX = 4;
  const spring = (x, fa = 45) => (fa / 45) * (30 + 7.5 * x);
  const bump = (x, type, xa = 2) => { const u = x - (xa - 2); if (type === 0) return 0; if (type === 1) return 18 * (Math.exp(-(((u - 1.25) / 0.38) ** 2)) - 0.3 * Math.exp(-(((u - 1.95) / 0.22) ** 2))); return u < 1.85 ? 22 * Math.exp(-(((u - 1.5) / 0.42) ** 2)) : 22 * Math.exp(-(((1.85 - 1.5) / 0.42) ** 2)) * Math.exp(-(u - 1.85) / 0.05) - 2 * Math.exp(-(((u - 2.0) / 0.18) ** 2)); };
  const fPress = (x, type, fa = 45, xa = 2) => spring(x, fa) + bump(x, type, xa) + FRIC;
  const fRelease = (x, type, fa = 45, xa = 2) => spring(x, fa) + (type === 2 ? 0.25 : 0.7) * bump(x + 0.25, type === 2 ? 1 : type, xa) - FRIC;
  function work(type, fa = 45, xa = 2) { let wp = 0, wr = 0; const N = 800; for (let i = 0; i < N; i++) { const x = ((i + 0.5) / N) * XMAX; wp += fPress(x, type, fa, xa) * (XMAX / N); wr += fRelease(x, type, fa, xa) * (XMAX / N); } return { press: wp * 0.01, back: wr * 0.01, lost: (wp - wr) * 0.01 }; }
  function peakBefore(type, fa = 45, xa = 2) { let m = 0, xm = 0; for (let x = 0; x <= xa; x += 0.005) { const f = fPress(x, type, fa, xa); if (f > m) { m = f; xm = x; } } return { f: m, x: xm }; }
  // bounce: returns the edge times (ms) of the raw contact after first touch at t = 0: closed, open, closed, ...
  function bounceEdges(T0, e, tmax = 40) { const ed = [0]; let t = 0.6, gap = T0, closed = 0.6; for (let k = 0; k < 40 && gap > 0.02; k++) { ed.push(t); t += gap; if (t > tmax) break; ed.push(t); closed = Math.max(0.05, closed * 0.9); t += closed + 0.05; gap *= e; } return ed; }
  const rawAt = (ed, t) => { let n = 0; for (const q of ed) if (t >= q) n++; return n % 2 === 1; };
  const settleTime = (ed) => ed[ed.length - 1];
  function debounce(ed, N, scanHz, mode, tmax = 60) {
    const dt = 1000 / scanHz, ev = []; let state = false, lock = -Infinity, last = false, since = 0, first = null;
    for (let t = dt * 0.37; t <= tmax; t += dt) {
      const r = rawAt(ed, t);
      if (mode === 0) { if (r !== state && t - lock >= N) { state = r; lock = t; ev.push([t, state]); } }
      else { if (r !== last) { last = r; since = t; } if (r !== state && t - since >= N) { state = r; ev.push([t, state]); } }
      if (first === null && state) first = t;
    }
    return { ev, first, presses: ev.filter((q) => q[1]).length, dt };
  }
  // matrix: rows x cols, pressed = array of [r, c]
  function matrixRead(rows, cols, pressed, diodes) {
    const key = (r, c) => r * cols + c, real = new Set(pressed.map(([r, c]) => key(r, c)));
    if (diodes) return { real, read: new Set(real), ghosts: [] };
    const par = Array.from({ length: rows + cols }, (_, i) => i), find = (i) => (par[i] === i ? i : (par[i] = find(par[i])));
    for (const [r, c] of pressed) par[find(r)] = find(rows + c);
    const read = new Set(), ghosts = [], used = new Set(pressed.map(([r]) => r)), usedC = new Set(pressed.map(([, c]) => c));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (used.has(r) && usedC.has(c) && find(r) === find(rows + c)) { read.add(key(r, c)); if (!real.has(key(r, c))) ghosts.push([r, c]); }
    return { real, read, ghosts };
  }
  const matrixPins = (n) => { const r = Math.ceil(Math.sqrt(n) - 1e-9); return r + Math.ceil(n / r - 1e-9); };
  const charliePins = (n) => Math.ceil((1 + Math.sqrt(1 + 4 * n)) / 2 - 1e-9);
  const M = { matrixPins, charliePins, TYPES, FRIC, XMAX, spring, bump, fPress, fRelease, work, peakBefore, bounceEdges, rawAt, settleTime, debounce, matrixRead };
  (window.LabModels = window.LabModels || {})['keyboard-switches'] = M;

  const TNAME = [['linear', 'リニア'], ['tactile', 'タクタイル'], ['clicky', 'クリッキー']], STEMCOL = ['#c8372d', '#7a5236', '#2f63c9'];

  /* ================= 1. the switch and its force curve (3D) ================= */
  function buildSwitch(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.25;                       // 1 unit = 4 mm; z up, PCB top at z = 0
    const box = (w, d, h, x, y, z, mat, parent = g) => { const m = new TH.Mesh(new TH.BoxGeometry(w * K, d * K, h * K), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
    const cyl = (r, h, x, y, z, mat, parent = g, seg = 28) => { const m = new TH.Mesh(new TH.CylinderGeometry(r * K, r * K, h * K, seg).rotateX(PI / 2), mat); m.position.set(x * K, y * K, z * K); m.castShadow = true; parent.add(m); return m; };
    const pcb = S.mat('#1f6a40', { rough: 0.5, coat: 0.6 }), plate = S.mat('#b9bdc4', { metal: 0.9, rough: 0.4 }), house = S.mat('#1b1c1f', { rough: 0.5, coat: 0.3 }), clear = S.mat('#dfe6ea', { rough: 0.15, coat: 1, opacity: 0.28 });
    const gold = S.mat('#d0a53c', { metal: 1, rough: 0.28 }), steel = S.mat('#d7dade', { metal: 1, rough: 0.22 }), stemMat = S.mat(STEMCOL[0], { rough: 0.4, coat: 0.4 }), cap = S.mat('#3a3d44', { rough: 0.55, coat: 0.2, opacity: 0.45 });
    // circuit board and mounting plate (the plate is cut away at the front so the switch can be seen)
    box(26, 26, 1.6, 0, 0, -0.8, pcb); box(26, 6, 1.5, 0, 10, 4.25, plate); box(6, 14, 1.5, -10, 0, 4.25, plate); box(6, 14, 1.5, 10, 0, 4.25, plate);
    // lower housing: floor, back and side walls, centre post, locating pin; the front wall is removed
    box(14, 14, 1, 0, 0, 0.5, house); box(14, 1, 5, 0, 6.5, 3, house); box(1, 13, 5, -6.5, -0.5, 3, house); box(1, 13, 5, 6.5, -0.5, 3, house);
    cyl(1.5, 3.2, 1.2, 0, 2.4, house); cyl(2, 3, 1.2, 0, -1.5, house); cyl(0.85, 2.6, -5, 0, -1.3, house, g, 16);
    // upper housing in clear plastic: back and sides, with the guide rails for the stem
    box(14, 1, 5.6, 0, 6.5, 8.3, clear); box(1, 13, 5.6, -6.5, -0.5, 8.3, clear); box(1, 13, 5.6, 6.5, -0.5, 8.3, clear); box(3, 13, 0.8, -5, -0.5, 10.7, clear); box(3, 13, 0.8, 5.4, -0.5, 10.7, clear); box(7, 3, 0.8, 0.4, 5, 10.7, clear);
    // contacts: a fixed gold plate and a sprung leaf, each with a pin through the board
    box(0.3, 3.2, 5.6, -5.4, -1, 3.8, gold); cyl(0.45, 4, -5.4, -1, -1, gold, g, 14);
    const leaf = new TH.Group(); leaf.position.set(-3.4 * K, -1 * K, 1 * K); g.add(leaf);
    box(0.25, 3.2, 6.4, 0, 0, 3.2, gold, leaf); box(0.9, 1.2, 0.5, 0.45, 0, 5.6, gold, leaf);
    cyl(0.45, 4, -3.4, -4.2, -1, gold, g, 14); box(0.25, 3.4, 0.4, -3.4, -2.6, 1.1, gold);
    // stem: slider with rails, the cross that holds the keycap, the pole inside the spring and the leg that works the leaf
    const stem = new TH.Group(); g.add(stem);
    box(7.4, 5.6, 4.6, 1.2, 0, 8.3, stemMat, stem); box(1, 5.6, 3, -3, 0, 7.5, stemMat, stem); box(1.3, 4.1, 3.8, 1.2, 0, 12.4, stemMat, stem); box(4.1, 1.3, 3.8, 1.2, 0, 12.4, stemMat, stem); cyl(1, 4.4, 1.2, 0, 4.2, stemMat, stem, 18);
    const leg = new TH.Mesh(new TH.CylinderGeometry(0.01, 0.9 * K, 1.6 * K, 4).rotateZ(PI / 2), stemMat); leg.position.set(-3.9 * K, -1 * K, 6.4 * K); stem.add(leg);
    // keycap: a hollow truncated pyramid, translucent here so the stem shows through
    const kc = new TH.Mesh(new TH.CylinderGeometry(9.3 * K, 12.6 * K, 8 * K, 4, 1, true).rotateX(PI / 2).rotateZ(PI / 4), cap); kc.position.set(1.2 * K, 0, 14.6 * K); stem.add(kc);
    const kt = new TH.Mesh(new TH.BoxGeometry(13.1 * K, 13.1 * K, 0.6 * K), cap); kt.position.set(1.2 * K, 0, 18.4 * K); stem.add(kt);
    // spring: rebuilt as it is compressed
    const helix = (zTop) => { const p = [], z0 = 1.1, n = 7.5; for (let i = 0; i <= 150; i++) { const u = i / 150, a = u * n * TAU; p.push([(1.2 + 2.25 * Math.cos(a)) * K, 2.25 * Math.sin(a) * K, (z0 + (zTop - z0) * u) * K]); } return p; };
    const coil = S.tube(helix(6), { r: 0.2 * K, add: false, radial: 8, segments: 300 }); coil.material = steel; g.add(coil);
    S.add(g);
    const set = (x, type, xa) => {
      stem.position.z = -x * K; coil.update(helix(6 - x)); stemMat.color.set(STEMCOL[type]);
      const closed = clamp((x - (xa - 0.15)) / 0.15, 0, 1); leaf.rotation.y = -0.085 * (1 - closed) + (type === 0 ? 0 : 0.03 * Math.exp(-(((x - (xa - 0.7)) / 0.4) ** 2)) * (1 - closed));
      S.invalidate(); return closed >= 1;
    };
    return { g, set, K };
  }
  D['switch-force-curve'] = {
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
      const type = v.type, fa = v.fa, xa = v.xa, x = v.x, w = work(type, fa, xa), pk = peakBefore(type, fa, xa), on = x >= xa;
      L.setText(st.cap1, T(tx`A keyboard switch with its front wall and part of the plate removed, under a keycap. Pressing the cap pushes the coloured stem down against the spring. A leg on the stem holds a sprung gold leaf away from a fixed contact; when the stem has gone down \(${fmt(xa, 1)}\) mm the leg lets go, the leaf snaps across and the circuit closes, well before the stem reaches the bottom at 4 mm.`, tx`キーキャップの下にあるキーボードスイッチを、前の壁とプレートの一部を取り除いて描いています。キャップを押すと、色の付いた軸がばねに逆らって下がります。軸の脚は、ばね性のある金色の接点板を固定接点から離しています。軸が \(${fmt(xa, 1)}\) mm 下がると脚が接点板を放し、接点板がはじけて回路が閉じます。軸が 4 mm の底に着くよりずっと手前です。`));
      L.setText(st.cap2, T(tx`Force on the finger against how far the key has gone down, for a ${TNAME[type][0]} switch: going down (blue) and coming back (red). The gap between them is friction, and the area between them is the energy lost in one keystroke. Drag the gold point to press the key.`, tx`${TNAME[type][1]}スイッチで、キーが下がった距離に対する指にかかる力です。押し下げるとき（青）と戻るとき（赤）を示します。二つの間の差は摩擦によるもので、間の面積が 1 回の打鍵で失われるエネルギーです。金色の点をドラッグしてキーを押してください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 4], y: [0, 110], aspect: 0.82, maxH: 420, xlabel: T('travel (mm)', '押し下げた距離（mm）'), ylabel: T('force (cN)', '力（cN）') });
      const P = L.sample(0, 4, 400, (q) => fPress(q, type, fa, xa)), R = L.sample(0, 4, 400, (q) => Math.max(0, fRelease(q, type, fa, xa)));
      g.poly([...P, ...R.slice().reverse()], { c: 'c2', fill: 'c2', fo: 0.14, w: 0.3 });
      g.line(R, { c: 'c2', w: 2 }); g.line(P, { c: 'c1', w: 2.8 });
      g.vline(xa, { c: 'c3', dash: '5 3', w: 1.6 }); g.text(xa, 104, T('contacts close', '接点が閉じる'), { small: true, anchor: 'start', dx: 5 });
      g.vline(xa - 0.2, { c: 'c3', dash: '2 4' }); g.text(xa - 0.2, 96, T('open again', '再び開く'), { small: true, anchor: 'end', dx: -5 });
      g.handle(x, fPress(x, type, fa, xa), { c: 'hl', axis: 'x', bounds: [0, 4, 0, 110], label: T('key travel', 'キーの押し下げ'), onDrag: (q) => ctx.set('x', clamp(Math.round(q * 20) / 20, 0, 4)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('pressing', '押すとき') }, { c: 'c2', label: T('releasing', '戻るとき') }, { c: 'c3', dash: true, label: T('actuation and reset points', '作動点と復帰点') }]);
      ctx.readout([
        { k: T('force now, circuit', '今の力、回路'), v: tx`\(${fmt(fPress(x, type, fa, xa), 0)}\ \mathrm{cN}\)` + ' · ' + (on ? T('closed', '閉') : T('open', '開')), tone: on ? 'good' : undefined },
        { k: T('force at the actuation point, at the bottom', '作動点での力、底での力'), v: tx`\(${fmt(fPress(xa, type, fa, xa), 0)},\ ${fmt(fPress(4, type, fa, xa), 0)}\ \mathrm{cN}\)`, tone: 'key' },
        { k: T('largest force before actuation', '作動までの最大の力'), v: tx`\(${fmt(pk.f, 0)}\ \mathrm{cN}\ \text{at}\ ${fmt(pk.x, 2)}\ \mathrm{mm}\)` },
        { k: T('work to press, returned, lost', '押す仕事、戻る分、失われる分'), v: tx`\(${fmt(w.press, 2)},\ ${fmt(w.back, 2)},\ ${fmt(w.lost, 2)}\ \mathrm{mJ}\)` },
        { k: T('ten thousand keystrokes', '1 万回の打鍵'), v: tx`\(${fmt(w.press * 10, 0)}\ \mathrm{J}\)` },
      ], T('One centinewton is close to the weight of one gram, which is why switch makers quote forces in grams. A tactile switch tells the finger that the key has registered so that it need not go on to the bottom; a linear switch gives no such signal and suits rapid repeated presses.', '1 センチニュートンは、ほぼ 1 グラムの重さに当たります。スイッチのメーカーが力をグラムで示すのはそのためです。タクタイルスイッチは、キーが入力されたことを指に伝えるので、底まで押し込む必要がありません。リニアスイッチにはその合図がなく、すばやい連打に向いています。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.9, maxH: 560, camera: [-5.3, -13.2, 7.4], target: [0.2, 0, 2.5], fov: 30,
        label: T('3D cutaway of a mechanical keyboard switch. Drag to rotate.', 'メカニカルキーボードのスイッチの 3D 断面。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.sw = buildSwitch(S);
          S.label(T('keycap', 'キーキャップ'), [2.9, -1, 4.5], { small: true }); S.label(T('stem', '軸'), [2.6, -1.4, 2.6], { small: true }); S.label(T('spring', 'ばね'), [2.4, -2, 1.1], { small: true });
          S.label(T('contact leaf', '接点板'), [-2.9, -2, 1.9], { small: true }); S.label(T('plate', 'プレート'), [-3.3, 0, 1.3], { small: true }); S.label(T('circuit board', '基板'), [-3.0, -3.3, -0.2], { small: true });
        },
        update() { st.sw.set(x, type, xa); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-10, 10], y: [-3, 20], equal: true, maxH: 380, axes: false, grid: false });
          f2.rect(-7, 0, 14, 11, { c: 'ink', fill: 'grid', fo: 0.4 }); f2.rect(-3.5, 6 - x, 7, 9, { c: 'c2', fill: 'c2', fo: 0.5 }); f2.rect(-8.5, 12 - x, 17, 7, { c: 'ink', fill: 'ink', fo: 0.25 });
          f2.line(L.sample(0, 1, 120, (u) => [2.2 * Math.sin(u * 7 * TAU), 1 + (5 - x) * u]), { c: 'ink', w: 1.4 });
        },
      });
    },
  };

  /* ================= 2. contact bounce and debouncing ================= */
  const SCAN = [125, 500, 1000, 4000, 8000];
  D['contact-bounce'] = {
    render(ctx, v) {
      const ed = bounceEdges(v.t0, v.e), hz = SCAN[v.scan], N = v.n, eager = debounce(ed, N, hz, 0), defer = debounce(ed, N, hz, 1), settle = settleTime(ed), tmax = Math.max(12, Math.ceil((settle + N) * 1.25));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The first \(${tmax}\) ms after the leaf first touches. Top: the raw contact, which rebounds \(${(ed.length - 1) / 2}\) times before it rests. The ticks are the moments the controller looks. Middle: what an eager debouncer reports, taking the first edge and ignoring the next \(${N}\) ms. Bottom: a deferred debouncer, which waits until the contact has been steady for \(${N}\) ms.`, tx`接点板が最初に触れてから \(${tmax}\) ms の間です。上は生の接点の信号で、落ち着くまでに \(${(ed.length - 1) / 2}\) 回はね返ります。目盛りは、コントローラーが信号を読む瞬間です。中は、最初の変化を採用してその後 \(${N}\) ms を無視する、先行型のデバウンスが報告する状態です。下は、接点が \(${N}\) ms の間安定するまで待つ、遅延型のデバウンスです。`));
      const a = L.fig(c1, { x: [-1, tmax], y: [0, 3.4], aspect: 0.62, maxH: 320, xlabel: T('time after first contact (ms)', '最初の接触からの時間（ms）'), ticksY: [], grid: false });
      a.text(tmax * 0.985, 3.05, T('raw contact', '生の信号'), { small: true, anchor: 'end' }); a.text(tmax * 0.985, 1.08, T('eager', '先行型'), { small: true, anchor: 'end' }); a.text(tmax * 0.985, 0.48, T('deferred', '遅延型'), { small: true, anchor: 'end' });
      const sq = (edges, y0, h, c, w0) => { const p = [[-1, y0]]; let s = 0; for (const t of edges) { if (t > tmax) break; p.push([t, y0 + s * h]); s = 1 - s; p.push([t, y0 + s * h]); } p.push([tmax, y0 + s * h]); a.line(p, { c, w: w0 }); };
      sq(ed, 2.5, 0.75, 'c2', 2.2);
      const dt = 1000 / hz; if (tmax / dt <= 140) for (let t = dt * 0.37; t <= tmax; t += dt) a.line([[t, 2.36], [t, 2.46]], { c: 'muted', w: 1 });
      sq(eager.ev.map((q) => q[0]), 1.3, 0.75, eager.presses > 1 ? 'c2' : 'c1', 2.6); sq(defer.ev.map((q) => q[0]), 0.1, 0.75, defer.presses > 1 ? 'c2' : 'c3', 2.6);
      a.vline(settle, { c: 'muted', dash: '3 4' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Delay between the first touch and the reported key press against the debounce time, for the two methods at this scan rate, with the region where the key would be reported twice shaded. Eager debouncing adds no delay but trusts the first edge, so electrical noise can trigger it; deferred debouncing is safe against noise and always late. Drag the gold point.`, tx`この走査周波数での二つの方式について、最初の接触からキーの押下が報告されるまでの遅れを、デバウンス時間に対して描いています。キーが 2 回報告される領域に色を付けています。先行型は遅れを加えませんが、最初の変化を信用するので、電気的ノイズで誤作動することがあります。遅延型はノイズに強い代わりに、必ず遅れます。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0, 20], y: [0, 30], aspect: 0.62, maxH: 320, xlabel: T('debounce time (ms)', 'デバウンス時間（ms）'), ylabel: T('delay (ms)', '遅れ（ms）') });
      let bad = 0; for (let n = 0; n <= 20; n += 0.25) if (debounce(ed, n, hz, 0).presses > 1 || debounce(ed, n, hz, 1).presses > 1) bad = n + 0.25;
      if (bad > 0) { b.rect(0, 0, bad, 30, { c: 'c2', fill: 'c2', fo: 0.12, nostroke: true, layer: 'under' }); b.text(bad / 2, 22, T('double', '二重入力'), { small: true }); }
      b.line(L.sample(0, 20, 80, (n) => debounce(ed, n, hz, 0).first ?? 30), { c: 'c1', w: 2.4 }); b.line(L.sample(0, 20, 80, (n) => Math.min(30, debounce(ed, n, hz, 1).first ?? 30)), { c: 'c3', w: 2.4 });
      b.handle(N, Math.min(30, defer.first ?? 30), { c: 'hl', axis: 'x', bounds: [0, 20, 0, 30], label: T('debounce time', 'デバウンス時間'), onDrag: (q) => ctx.set('n', clamp(Math.round(q * 2) / 2, 0, 20)) });
      L.legend(ctx.host, [{ c: 'c2', label: T('raw contact; reported twice', '生の接点、二重に報告') }, { c: 'c1', label: T('eager', '先行型') }, { c: 'c3', label: T('deferred', '遅延型') }]);
      ctx.readout([
        { k: T('contact settles after', '接点が落ち着くまで'), v: tx`\(${fmt(settle, 1)}\ \mathrm{ms}\)` },
        { k: T('scan interval', '走査の間隔'), v: tx`\(${fmt(dt, 2)}\ \mathrm{ms}\)` },
        { k: T('eager: delay, presses reported', '先行型：遅れ、報告された押下'), v: tx`\(${fmt(eager.first ?? 0, 1)}\ \mathrm{ms},\ ${eager.presses}\)`, tone: eager.presses > 1 ? 'bad' : 'good' },
        { k: T('deferred: delay, presses reported', '遅延型：遅れ、報告された押下'), v: tx`\(${fmt(defer.first ?? 0, 1)}\ \mathrm{ms},\ ${defer.presses}\)`, tone: defer.presses > 1 ? 'bad' : 'good' },
      ], T('A worn switch bounces for longer, which is why an old keyboard starts typing double letters: the debounce time that was enough when new no longer covers the bounce. Optical and magnetic switches have no contacts and need no debouncing at all.', '摩耗したスイッチは長くはね返ります。古いキーボードで文字が二重に入力されるようになるのはそのためで、新品のときには足りていたデバウンス時間が、はね返りを覆いきれなくなります。光学式や磁気式のスイッチには接点がなく、デバウンスはまったく必要ありません。'));
    },
  };

  /* ================= 3. the key matrix and ghosting ================= */
  const ROWS = 4, COLS = 5, LABELS = ['1', '2', '3', '4', '5', 'Q', 'W', 'E', 'R', 'T', 'A', 'S', 'D', 'F', 'G', 'Z', 'X', 'C', 'V', 'B'];
  D['key-matrix'] = {
    render(ctx, v) {
      const st = ctx.state, keys = [...new Set([v.k1, v.k2, v.k3].filter((k) => k >= 0))], pressed = keys.map((k) => [Math.floor(k / COLS), k % COLS]), res = matrixRead(ROWS, COLS, pressed, v.di === 1);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Twenty keys wired as 4 rows and 5 columns, so the controller needs 9 pins instead of 20. It drives one column at a time and reads the rows: a pressed key joins its column to its row. Click a key to press or release it (up to three). ${v.di === 1 ? 'Each switch has a diode in series, so current can only flow from column to row.' : 'With no diodes, current can also flow backwards through a pressed key, and three keys at the corners of a rectangle make the fourth corner read as pressed.'}`, tx`20 個のキーを 4 行 5 列に配線しているので、コントローラーに必要な端子は 20 本ではなく 9 本です。コントローラーは列を 1 本ずつ駆動し、行を読みます。押されたキーは、その列と行をつなぎます。キーをクリックすると、押したり離したりできます（3 個まで）。${v.di === 1 ? '各スイッチにダイオードが直列に入っているので、電流は列から行へしか流れません。' : 'ダイオードがないと、電流は押されたキーを逆向きにも流れます。長方形の三つの角にあるキーを押すと、四つ目の角も押されたと読まれます。'}`));
      const f = L.fig(c1, { x: [-0.9, COLS + 0.1], y: [-0.4, ROWS + 0.7], equal: true, aspect: (ROWS + 1.1) / (COLS + 1), maxH: 400, axes: false, grid: false });
      for (let c = 0; c < COLS; c++) { f.line([[c + 0.3, -0.25], [c + 0.3, ROWS + 0.05]], { c: 'c1', w: 1.6 }); f.text(c + 0.3, ROWS + 0.32, T(`col ${c + 1}`, `列 ${c + 1}`), { small: true }); }
      for (let r = 0; r < ROWS; r++) { const y = ROWS - 1 - r + 0.22; f.line([[-0.35, y], [COLS - 0.1, y]], { c: 'c3', w: 1.6 }); f.text(-0.62, y, T(`row ${r + 1}`, `行 ${r + 1}`), { small: true }); }
      const toggle = (k) => { const cur = [v.k1, v.k2, v.k3], i = cur.indexOf(k); if (i >= 0) { ctx.set(['k1', 'k2', 'k3'][i], -1); return; } const free = cur.indexOf(-1); st.slot = free >= 0 ? free : ((st.slot ?? 0) + 1) % 3; ctx.set(['k1', 'k2', 'k3'][st.slot], k); };
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const k = r * COLS + c, y = ROWS - 1 - r, real = res.real.has(k), ghost = res.read.has(k) && !real;
        const el = f.rect(c + 0.42, y + 0.34, 0.5, 0.5, { c: real ? 'hl' : ghost ? 'c2' : 'ink', fill: real ? 'hl' : ghost ? 'c2' : 'grid', fo: real ? 0.85 : ghost ? 0.55 : 0.5, rx: 5, w: 1.4, layer: 'over' });
        el.style.cursor = 'pointer'; el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', LABELS[k]); el.addEventListener('click', () => toggle(k)); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(k); } });
        const tt = f.text(c + 0.67, y + 0.59, LABELS[k], { small: true }); if (tt && tt.style) { tt.style.pointerEvents = 'none'; tt.style.stroke = 'none'; }
        f.line([[c + 0.3, y + 0.59], [c + 0.42, y + 0.59]], { c: 'c1', w: 1.2 }); f.line([[c + 0.67, y + 0.34], [c + 0.67, y + 0.22]], { c: 'c3', w: 1.2 });
      }
      // the sneak path for the first ghost: column of the ghost -> a real key in that column -> its row -> another real key -> its column -> ... -> ghost row
      if (res.ghosts.length) { const [gr, gc] = res.ghosts[0], inCol = pressed.filter(([, c]) => c === gc), inRow = pressed.filter(([r]) => r === gr); for (const [r1] of inCol) for (const [, c2] of inRow) if (res.real.has(r1 * COLS + c2)) { const Y = (r) => ROWS - 1 - r + 0.22, X = (c) => c + 0.3; f.line([[X(gc), ROWS + 0.05], [X(gc), Y(r1)], [X(c2), Y(r1)], [X(c2), Y(gr)], [-0.35, Y(gr)]], { c: 'c2', w: 3.4, dash: '6 4' }); } }
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Pins needed against the number of keys: one pin per key, a square matrix, and the scheme that uses each pair of pins twice with opposed diodes. A full-size keyboard of about 104 keys needs 21 pins as a matrix. The price of sharing wires is that keys are read one column at a time, and that keys can interfere unless each has a diode.`, tx`キーの数に対する必要な端子の数です。キー 1 個に端子 1 本の場合、正方形のマトリクスの場合、そして向かい合わせのダイオードで端子の組を二度使う方式の場合を示します。約 104 キーのフルサイズキーボードは、マトリクスなら 21 本の端子で済みます。配線を共有する代償として、キーは 1 列ずつ読むことになり、各キーにダイオードがなければキーどうしが干渉します。`));
      const g = L.fig(c2, { x: [0, 120], y: [0, 40], aspect: 0.72, maxH: 330, xlabel: T('number of keys', 'キーの数'), ylabel: T('controller pins', 'コントローラーの端子') });
      g.line([[0, 0], [40, 40]], { c: 'muted', w: 1.6, dash: '5 4' }); g.line(L.sample(1, 120, 120, (n) => matrixPins(n)), { c: 'c1', w: 2.6 }); g.line(L.sample(1, 120, 120, (n) => charliePins(n)), { c: 'c3', w: 2.2 });
      g.dot(ROWS * COLS, ROWS + COLS, { c: 'hl', r: 5.5 }); g.dot(104, 21, { c: 'c1', r: 4.5 });
      L.legend(ctx.host, [{ c: 'hl', kind: 'fill', label: T('pressed', '押されたキー') }, { c: 'c2', kind: 'fill', label: T('ghost: read as pressed; sneak path', 'ゴースト：押されたと読まれる、回り込みの経路') }, { c: 'c1', label: T('columns; square matrix', '列、正方形のマトリクス') }, { c: 'c3', label: T('rows; paired-pin scheme', '行、端子の組を使う方式') }, { c: 'muted', dash: true, label: T('one pin per key', 'キー 1 個に端子 1 本') }]);
      ctx.readout([
        { k: T('keys pressed', '押されたキー'), v: keys.length ? keys.map((k) => LABELS[k]).join(' ') : '—' },
        { k: T('keys the controller reads', 'コントローラーが読むキー'), v: [...res.read].sort((p, q) => p - q).map((k) => LABELS[k]).join(' ') || '—', tone: res.ghosts.length ? 'bad' : 'good' },
        { k: T('ghost keys', 'ゴーストキー'), v: res.ghosts.length ? res.ghosts.map(([r, c]) => LABELS[r * COLS + c]).join(' ') : T('none', 'なし'), tone: res.ghosts.length ? 'bad' : 'good' },
        { k: T('pins: this matrix, one per key', '端子：このマトリクス、キー 1 個に 1 本'), v: tx`\(${ROWS + COLS},\ ${ROWS * COLS}\)` },
        { k: T('time to read all columns at 20 µs each', '1 列 20 µs として全列を読む時間'), v: tx`\(${fmt(COLS * 0.02, 2)}\ \mathrm{ms}\)` },
      ], T('Keyboards without diodes avoid typing a ghost by refusing to report any key in an ambiguous rectangle, which is why some cheap keyboards ignore certain three-key combinations. With a diode on every switch any number of keys can be held at once.', 'ダイオードのないキーボードは、あいまいな長方形の中のキーをどれも報告しないことで、ゴーストの入力を避けます。安価なキーボードが特定の 3 キーの同時押しを無視するのはそのためです。すべてのスイッチにダイオードがあれば、いくつのキーでも同時に押せます。'));
    },
  };
})();
