'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * A key cut of depth c (0 = shallowest) leaves the blade at height Z0 - STEP c under its pin. The key pin for code k
   * has length P0 + STEP k, with Z0 + P0 = plug radius, so its top sits STEP (k - c) from the shear line.
   * The plug turns only if every stack has a gap at the shear line: c equals the code, or the code plus a master wafer.
   * differs(n, d, macs): keys of n cuts, d depths, adjacent cuts differing by at most macs.
   * Picking: each pin hole is off the centre line by a small error. Under a light turning force the hole furthest
   * forward binds first; once that pin is set the plug turns to the next. Rotation = (clearance + lead) / radius.
   */
  const STEP = 0.381, RPLUG = 6.35, CODE = [3, 6, 2, 7, 4];
  const pinError = (code, cut) => STEP * (code - cut);                                                // mm above the shear line
  const opens = (cuts, code = CODE, wafers = []) => cuts.every((c, i) => c === code[i] || (wafers[i] > 0 && c === code[i] + wafers[i]));
  function differs(n, d, macs = d) { let row = new Array(d).fill(1); for (let i = 1; i < n; i++) { const nx = new Array(d).fill(0); for (let a = 0; a < d; a++) for (let b = Math.max(0, a - macs); b <= Math.min(d - 1, a + macs); b++) nx[a] += row[b]; row = nx; } return row.reduce((s, x) => s + x, 0); }
  const masterOpens = (k) => 2 ** k;
  function rng(seed) { let s = (seed * 2654435761) >>> 0; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function holes(n, tol, seed) { const r = rng(seed + 1), e = []; for (let i = 0; i < n; i++) e.push(tol * (2 * r() - 1)); const order = e.map((x, i) => i).sort((a, b) => e[b] - e[a]); return { e, order }; }
  function binding(n, tol, seed, clear = 20) { const h = holes(n, tol, seed), emax = h.e[h.order[0]], rot = []; for (let k = 0; k < n; k++) rot.push((clear + emax - h.e[h.order[k]]) / (RPLUG * 1000)); return { ...h, rot }; }   // rot in radians after k pins are set
  const M = { STEP, RPLUG, CODE, pinError, opens, differs, masterOpens, holes, binding };
  (window.LabModels = window.LabModels || {})['pin-tumbler-locks'] = M;

  /* ================= 1. the lock cut open (3D) ================= */
  const YP = (i) => 0.6 + 0.5 * i, zc = (c) => 0.36 - 0.0381 * c, lk = (k) => 0.275 + 0.0381 * k;
  function buildLock(S) {
    const TH = S.THREE, g = new TH.Group(), rot = new TH.Group(); g.add(rot);                        // 1 unit = 10 mm; key along +y, pins along +z
    const brass = S.mat('#c9a04a', { metal: 1, rough: 0.32 }), brassD = S.mat('#a8833a', { metal: 1, rough: 0.45 }), steel = S.mat('#d4d8dd', { metal: 1, rough: 0.22 }), nickel = S.mat('#b9bec5', { metal: 1, rough: 0.3 }), red = S.mat('#b8432a', { metal: 0.6, rough: 0.4 });
    const box = (y0, y1, z0, z1, mat, parent, x0 = -0.03, x1 = 0) => { const m = new TH.Mesh(new TH.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); parent.add(m); return m; };
    // shell: back half of the outer cylinder and of the bible, with the cut face built from slabs
    { const m = new TH.Mesh(new TH.CylinderGeometry(0.9, 0.9, 3, 48, 1, false, PI, PI), brassD); m.material.side = 2; m.position.y = 1.5; m.castShadow = true; g.add(m); }
    box(0, 3, 0.6, 1.9, brassD, g, -0.32, -0.16); box(0, 3, -0.9, -0.64, brass, g); box(0, 3, 1.75, 1.9, brass, g);
    const edges = [0, ...[0, 1, 2, 3, 4].flatMap((i) => [YP(i) - 0.15, YP(i) + 0.15]), 3];
    for (let j = 0; j < edges.length; j += 2) box(edges[j], edges[j + 1], 0.64, 1.75, brass, g);
    // plug: back half cylinder plus cut-face slabs; it turns with the key
    { const m = new TH.Mesh(new TH.CylinderGeometry(0.635, 0.635, 3, 48, 1, false, PI, PI), nickel); m.material.side = 2; m.position.y = 1.5; rot.add(m); }
    box(0, 3, -0.632, -0.45, nickel, rot); box(2.92, 3, -0.45, 0.632, nickel, rot); for (let j = 0; j < edges.length; j += 2) box(edges[j], Math.min(edges[j + 1], 2.92), 0.44, 0.632, nickel, rot);
    { const cam = new TH.Mesh(new TH.BoxGeometry(0.3, 0.12, 1.3), steel); cam.position.set(-0.15, 3.07, -0.45); cam.castShadow = true; rot.add(cam); }
    // pins and springs
    const keyPins = [], drivers = [], springs = [];
    for (let i = 0; i < 5; i++) { const L0 = lk(CODE[i]), kp = new TH.Group(); const body = new TH.Mesh(new TH.CylinderGeometry(0.13, 0.13, L0 - 0.1, 20).rotateX(PI / 2), brass); body.position.z = 0.1 + (L0 - 0.1) / 2; const tip = new TH.Mesh(new TH.ConeGeometry(0.13, 0.1, 20).rotateX(-PI / 2), brass); tip.position.z = 0.05; kp.add(body, tip); kp.position.set(0, YP(i), 0); rot.add(kp); keyPins.push(kp);
      const dp = new TH.Mesh(new TH.CylinderGeometry(0.13, 0.13, 0.5, 20).rotateX(PI / 2), red); dp.position.set(0, YP(i), 1); dp.castShadow = true; g.add(dp); drivers.push(dp);
      const pts = []; for (let k = 0; k <= 80; k++) { const u = k / 80, a = u * TAU * 5; pts.push([0.09 * Math.cos(a), 0.09 * Math.sin(a), u]); } const sp = S.tube(pts, { r: 0.016, add: false, radial: 6, segments: 160 }); sp.material = steel; const sg = new TH.Group(); sg.add(sp); sg.position.set(0, YP(i), 1.3); g.add(sg); springs.push(sg); }
    // key: bow, and a blade rebuilt whenever the cuts change
    const key = new TH.Group(); rot.add(key);
    { const bow = new TH.Mesh(new TH.CylinderGeometry(0.95, 0.95, 0.2, 40).rotateZ(PI / 2), steel); bow.position.set(0, -1.1, 0); bow.castShadow = true; key.add(bow); const hole = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.22, 20).rotateZ(PI / 2), S.mat('#1c1d20', { rough: 0.6 })); hole.position.set(0, -1.55, 0.2); key.add(hole); }
    let blade = null; const setKey = (cuts) => { if (blade) { key.remove(blade); blade.geometry.dispose(); } const p = [[-0.3, -0.43], [2.95, -0.43], [2.95, -0.1]]; p.push([YP(4) + 0.3, zc(cuts[4])]); for (let i = 4; i >= 0; i--) { p.push([YP(i) + 0.05, zc(cuts[i])], [YP(i) - 0.05, zc(cuts[i])]); if (i > 0) p.push([(YP(i) + YP(i - 1)) / 2, Math.min(0.42, (zc(cuts[i]) + zc(cuts[i - 1])) / 2 + 0.17)]); } p.push([YP(0) - 0.28, 0.42], [-0.3, 0.42]);
      const sh = new TH.Shape(p.map((q) => new TH.Vector2(q[0], q[1]))); blade = new TH.Mesh(new TH.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false }), steel); blade.rotation.set(PI / 2, PI / 2, 0); blade.position.x = -0.1; blade.castShadow = true; key.add(blade); };
    const shear = S.lines([[[0.02, 0, 0.636], [0.02, 3, 0.636]]], { c: 'c2', opacity: 0.95, w: 2 });
    S.add(g);
    return { rot, keyPins, drivers, springs, setKey };
  }
  D['lock-cutaway'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const cuts = [v.c1, v.c2, v.c3, v.c4, v.c5], ok = opens(cuts), wrong = cuts.filter((c, i) => c !== CODE[i]).length; st.cuts = cuts; st.ok = ok;
      L.setText(st.cap1, T(tx`A pin-tumbler cylinder sawn in half along the key. The inner plug turns inside the fixed shell, except that five spring-loaded stacks of pins cross the line between them (red). Each stack is two pins, a brass key pin resting on the key and a red driver pin above it. The key lifts every stack by the depth of its cut; the plug is free only when all five joins lie exactly on the line.`, tx`鍵に沿って半分に切った、ピンタンブラー錠のシリンダーです。内側のプラグは、固定された外筒の中で回りますが、ばねで押された 5 組のピンが、その境目（赤い線）をまたいでいます。それぞれの組は 2 本のピンで、鍵の上に載る真鍮のキーピンと、その上の赤いドライバーピンです。鍵は、刻みの深さに応じてそれぞれの組を持ち上げます。5 組の継ぎ目がすべて、ちょうど線の上に来たときだけ、プラグは自由に回ります。`));
      L.setText(st.cap2, T(tx`Where the top of each key pin sits, measured from the line between plug and shell. A cut that is too shallow lifts the pin too far and the key pin itself blocks the line; too deep and the driver pin drops across it. Each step of depth is \(${STEP}\) mm. Drag the five points onto the line.`, tx`それぞれのキーピンの上端の位置を、プラグと外筒の境目を基準にして示しています。刻みが浅すぎるとピンが上がりすぎて、キーピン自身が境目をふさぎます。深すぎると、ドライバーピンが境目をまたいで下がります。深さの 1 段は \(${STEP}\) mm です。5 つの点を線の上までドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0.4, 5.6], y: [-3, 3], aspect: 0.8, maxH: 400, xlabel: T('pin, counted from the front of the lock', '錠の手前から数えたピンの番号'), ylabel: T('join above the line (mm)', '継ぎ目の高さ（mm）'), ticksX: [1, 2, 3, 4, 5].map((q) => [q, String(q)]) });
      g.hline(0, { c: 'c2', w: 2 });
      cuts.forEach((c, i) => { const e = pinError(CODE[i], c); g.seg([i + 1, 0], [i + 1, clamp(e, -3, 3)], { c: e === 0 ? 'c3' : 'c1', w: 5 });
        g.handle(i + 1, clamp(e, -3, 3), { c: e === 0 ? 'c3' : 'hl', axis: 'y', bounds: [0.4, 5.6, -3, 3], label: T('cut ' + (i + 1), '刻み ' + (i + 1)), onDrag: (x, y) => ctx.set('c' + (i + 1), clamp(CODE[i] - Math.round(y / STEP), 0, 9)) }); });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('shear line', '境目（シアライン）') }, { c: 'c1', label: T('pin blocking the line', '境目をふさぐピン') }, { c: 'c3', label: T('pin clear', '通れるピン') }]);
      ctx.readout([
        { k: T('this key is cut', 'この鍵の刻み'), v: tx`\(${cuts.join('\\,')}\)` },
        { k: T('the lock is pinned for', 'この錠の設定'), v: tx`\(${CODE.join('\\,')}\)` },
        { k: T('stacks blocking the plug', 'プラグをふさいでいる組'), v: tx`\(${wrong}\)`, tone: wrong ? 'warn' : 'good' },
        { k: T('the plug', 'プラグ'), v: T(ok ? 'turns' : 'is held', ok ? '回る' : '回らない'), tone: 'key' },
        { k: T('keys this lock design could have', 'この設計で作れる鍵の数'), v: tx`\(10^{5}=100\,000\)` },
      ], T(ok ? 'Every join is on the line. The key pins turn with the plug and the driver pins stay behind in the shell.' : 'One wrong cut is enough. A stack off by a single step, 0.38 mm, holds the plug as firmly as one off by nine.', ok ? 'すべての継ぎ目が線の上にあります。キーピンはプラグと一緒に回り、ドライバーピンは外筒に残ります。' : '刻みが一つ違うだけで十分です。1 段、つまり 0.38 mm ずれた組は、9 段ずれた組と同じ強さでプラグを止めます。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.8, maxH: 540, camera: [9.5, -6.5, 4], target: [0, 0.75, 0.3], fov: 28,
        label: T('3D pin-tumbler lock cut in half with its key. Drag to rotate.', '鍵を差した、半分に切ったピンタンブラー錠の 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.lk = buildLock(S); st.t = 0; st.last = '';
          S.label(T('driver pins', 'ドライバーピン'), [0, 3.5, 1.2], { small: true }); S.label(T('key pins', 'キーピン'), [0, 3.5, 0.3], { small: true }); S.label(T('plug', 'プラグ'), [0, 1.6, -0.55], { small: true }); S.label(T('shell', '外筒'), [0, 1.6, -1.05], { small: true }); S.label(T('springs', 'ばね'), [0, -0.35, 1.5], { small: true });
          const draw = (dt) => { const m = st.lk, c = st.cuts; st.t += dt; const key = c.join(''); if (key !== st.last) { m.setKey(c); st.last = key; st.t = 0; }
            for (let i = 0; i < 5; i++) { const base = zc(c[i]), top = base + lk(CODE[i]); m.keyPins[i].position.z = base; m.drivers[i].position.z = top + 0.25; const s0 = top + 0.5; m.springs[i].position.z = s0; m.springs[i].scale.z = Math.max(0.05, 1.75 - s0); }
            const ph = (st.t % 5) / 5, ang = st.ok ? (ph < 0.2 ? 0 : ph < 0.5 ? ((ph - 0.2) / 0.3) * 1.2 : ph < 0.7 ? 1.2 : (1 - (ph - 0.7) / 0.3) * 1.2) : 0.035 * Math.sin(st.t * 7) * (ph < 0.5 ? 1 : 0); m.rot.rotation.y = ang; };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-0.5, 3.5], y: [-1.1, 2.1], equal: true, maxH: 320, axes: false, grid: false }); f2.rect(0, -0.9, 3, 2.8, { c: 'ink', fill: 'grid', fo: 0.3, w: 1.4 }); f2.seg([0, 0.635], [3, 0.635], { c: 'c2', w: 2 }); cuts.forEach((c, i) => { const b = zc(c), t = b + lk(CODE[i]); f2.rect(YP(i) - 0.13, b, 0.26, t - b, { c: 'c1', fill: 'c1', fo: 0.5 }); f2.rect(YP(i) - 0.13, t, 0.26, 0.5, { c: 'c2', fill: 'c2', fo: 0.5 }); }); },
      });
    },
  };

  /* ================= 2. how many keys ================= */
  D['key-space'] = {
    render(ctx, v) {
      const all = v.d ** v.n, ok = differs(v.n, v.d, v.macs), mk = masterOpens(Math.min(v.mk, v.n));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Number of different keys against number of pins, on a logarithmic scale, for \(${v.d}\) depths of cut. The grey line counts every combination. The blue one leaves out keys that cannot be cut, because a deep cut next to a shallow one would need a slope so steep that it cuts into its neighbour: here adjacent cuts may differ by at most \(${v.macs}\) steps. Drag the gold point.`, tx`ピンの数に対する、異なる鍵の数を、対数目盛りで描いています。刻みの深さは \(${v.d}\) 段です。灰色の線は、すべての組み合わせを数えています。青い線は、作れない鍵を除いたものです。深い刻みの隣に浅い刻みがあると、斜面が急になりすぎて、隣の刻みを削ってしまいます。ここでは、隣り合う刻みの差は最大 \(${v.macs}\) 段までです。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [2.5, 7.5], y: [1, 8], aspect: 0.7, maxH: 350, xlabel: T('number of pins', 'ピンの数'), ylabel: T('keys (power of ten)', '鍵の数（10 の何乗か）'), ticksX: [3, 4, 5, 6, 7].map((q) => [q, String(q)]) });
      a.line([3, 4, 5, 6, 7].map((n) => [n, Math.min(8, Math.log10(v.d ** n))]), { c: 'muted', w: 1.6 }); a.line([3, 4, 5, 6, 7].map((n) => [n, Math.min(8, Math.log10(differs(n, v.d, v.macs)))]), { c: 'c1', w: 2.8 });
      [3, 4, 5, 6, 7].forEach((n) => a.dot(n, Math.min(8, Math.log10(differs(n, v.d, v.macs))), { c: 'c1', r: 3.5 }));
      a.handle(v.n, Math.min(8, Math.log10(ok)), { c: 'hl', axis: 'x', bounds: [3, 7, 1, 8], label: T('number of pins', 'ピンの数'), onDrag: (x) => ctx.set('n', clamp(Math.round(x), 3, 7)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Master keying. To let a second key open the lock, a thin extra wafer is added to a stack, giving it two joins. Every stack treated this way doubles the number of different keys that open the door, whether or not anyone meant them to. The bars show how many keys open one lock with 0 to \(${v.n}\) stacks mastered.`, tx`マスターキーの仕組みです。別の鍵でも開くようにするには、ピンの組に薄い板を 1 枚足して、継ぎ目を二つにします。こうした組が一つ増えるたびに、意図したかどうかにかかわらず、その扉を開ける鍵の種類は 2 倍になります。棒は、0 組から \(${v.n}\) 組までをマスター化したときに、一つの錠を開ける鍵の数を示します。`));
      const b = L.fig(c2, { x: [0.3, v.n + 1.7], y: [0, 2 ** v.n * 1.1], aspect: 0.7, maxH: 350, xlabel: T('stacks with a master wafer', 'マスター用の板を入れた組の数'), ylabel: T('keys that open the lock', '錠を開ける鍵の数'), ticksX: Array.from({ length: v.n + 1 }, (_, i) => [i + 1, String(i)]) });
      for (let k = 0; k <= v.n; k++) b.rect(k + 0.65, 0, 0.7, 2 ** k, { c: k === Math.min(v.mk, v.n) ? 'hl' : 'c2', fill: k === Math.min(v.mk, v.n) ? 'hl' : 'c2', fo: 0.55 });
      L.legend(ctx.host, [{ c: 'muted', label: T('every combination', 'すべての組み合わせ') }, { c: 'c1', label: T('keys that can be cut', '実際に作れる鍵') }, { c: 'c2', label: T('keys that open one lock', '一つの錠を開ける鍵') }]);
      ctx.readout([
        { k: T('every combination', 'すべての組み合わせ'), v: tx`\(${v.d}^{${v.n}}=${fmt(all, 0)}\)` },
        { k: T('keys that can be cut', '実際に作れる鍵'), v: tx`\(${fmt(ok, 0)}\ (${fmt((100 * ok) / all, 0)}\ \%)\)`, tone: 'key' },
        { k: T('keys that open this lock', 'この錠を開ける鍵'), v: tx`\(2^{${Math.min(v.mk, v.n)}}=${mk}\)`, tone: mk > 1 ? 'warn' : 'good' },
        { k: T('chance that a random key opens it', 'でたらめな鍵で開く確率'), v: tx`\(1\ \text{${T('in', '/')}}\ ${fmt(ok / mk, 0)}\)` },
        { k: T('trying one key every 5 s, half of them take', '5 秒に 1 本試すと、半数を試すのにかかる時間'), v: tx`\(${fmt((ok / mk / 2 * 5) / 3600, 1)}\ \mathrm{h}\)` },
      ], T('The count is large enough that nobody opens a lock by trying keys. Locks are defeated by going round the count, one pin at a time.', 'この数は十分大きく、鍵を次々に試して錠を開ける人はいません。錠は、この数を避けて、ピンを 1 本ずつ攻めることで破られます。'));
    },
  };

  /* ================= 3. why locks can be picked ================= */
  D['lock-picking'] = {
    render(ctx, v) {
      const n = 5, b = binding(n, v.tol, v.seed), k = Math.min(v.set, n), cur = k < n ? b.order[k] : -1;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How far each pin hole in this particular lock sits ahead of or behind the centre line, in thousandths of a millimetre. No drill puts five holes exactly in a row. Turn the plug gently and only the hole furthest ahead pinches its pin (gold); the others stay loose. Push that pin up until its join reaches the line and the plug gives a little, moving on to pinch the next.`, tx`この錠のそれぞれのピン穴が、中心線よりどれだけ前または後ろにあるかを、1000 分の 1 ミリメートルで示しています。どんなドリルでも、5 つの穴を正確に一列には開けられません。プラグをそっと回すと、最も前にある穴だけがピンを挟み（金色）、ほかのピンは緩いままです。そのピンを継ぎ目が線に届くまで押し上げると、プラグが少し回り、次のピンを挟みます。`));
      const a = L.fig(c1, { x: [0, 6], y: [-v.tol * 1.2 - 5, v.tol * 1.2 + 5], aspect: 0.7, maxH: 350, xlabel: T('pin, counted from the front of the lock', '錠の手前から数えたピンの番号'), ylabel: T('hole ahead of centre (μm)', '中心より前にある量（μm）'), ticksX: [1, 2, 3, 4, 5].map((q) => [q, String(q)]) });
      a.hline(0, { c: 'muted', dash: '4 4' }); b.e.forEach((e, i) => { const done = b.order.indexOf(i) < k; a.rect(i + 0.65, Math.min(0, e), 0.7, Math.abs(e), { c: i === cur ? 'hl' : done ? 'c3' : 'c1', fill: i === cur ? 'hl' : done ? 'c3' : 'c1', fo: 0.6 }); a.text(i + 1, e + (e >= 0 ? 1 : -1) * (v.tol * 0.12 + 2), String(b.order.indexOf(i) + 1), { small: true, anchor: 'middle' }); });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the plug has turned after each pin is set, in degrees. The staircase is what the picker feels. Each step is a click. After the fifth the plug turns freely. The numbers above the bars on the left give the order in which this lock's pins must be set.`, tx`それぞれのピンを合わせた後に、プラグがどれだけ回ったかを示します。この階段が、ピッキングをする人の指に伝わる感触です。1 段ごとに、かちりと手応えがあります。5 本目の後、プラグは自由に回ります。左の棒の上の数字は、この錠のピンを合わせる順番です。`));
      const deg = b.rot.map((r) => (r * 180) / PI), ymax = Math.max(0.6, deg[n - 1] * 1.25), f = L.fig(c2, { x: [0, 5.6], y: [0, ymax], aspect: 0.7, maxH: 350, xlabel: T('pins set', '合わせたピンの数'), ylabel: T('plug has turned (degrees)', 'プラグの回転（度）'), ticksX: [0, 1, 2, 3, 4, 5].map((q) => [q, String(q)]) });
      const pts = []; for (let i = 0; i < n; i++) { pts.push([i, deg[i]], [i + 1, deg[i]]); } f.line(pts, { c: 'c1', w: 2.8 }); f.seg([5, deg[n - 1]], [5, ymax], { c: 'c3', w: 2.8 });
      f.handle(k, k < n ? deg[k] : ymax * 0.96, { c: 'hl', axis: 'x', bounds: [0, 5, 0, ymax], label: T('pins set', '合わせたピンの数'), onDrag: (x) => ctx.set('set', clamp(Math.round(x), 0, 5)) });
      L.legend(ctx.host, [{ c: 'hl', kind: 'dot', label: T('pin binding now', 'いま挟まれているピン') }, { c: 'c3', label: T('set; plug free', '合わせ済み、プラグが自由') }, { c: 'c1', label: T('still loose; rotation', 'まだ緩い、回転') }]);
      ctx.readout([
        { k: T('order in which the pins bind', 'ピンが挟まれる順番'), v: tx`\(${b.order.map((i) => i + 1).join('\\to')}\)`, tone: 'key' },
        { k: T('binding now', 'いま挟まれているピン'), v: cur >= 0 ? tx`\(${cur + 1}\)` : T('none: the lock is open', 'なし：錠は開いた'), tone: cur >= 0 ? undefined : 'good' },
        { k: T('plug has turned', 'プラグの回転'), v: k < n ? tx`\(${fmt(deg[k], 2)}^\circ\)` : T('freely', '自由に回る') },
        { k: T('keys to try if guessing', '当てずっぽうで試す鍵の数'), v: tx`\(10^{5}\)` },
        { k: T('pin positions to try when picking', 'ピッキングで試すピンの位置の数'), v: tx`\(\le 5\times10=50\)`, tone: 'warn' },
      ], T('Tolerances turn one hard problem into five easy ones. Tighter machining makes the steps smaller and harder to feel, and oddly shaped security pins give false steps, but neither removes them.', '加工の誤差が、一つの難しい問題を、五つの易しい問題に変えます。加工の精度を上げると段は小さく、感じ取りにくくなり、変わった形のセキュリティピンは偽の段を作りますが、どちらも段そのものはなくせません。'));
    },
  };
})();
