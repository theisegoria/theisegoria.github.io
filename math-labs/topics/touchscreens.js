'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Projected mutual capacitance: transparent drive rows and sense columns cross under the cover glass; each crossing
   * (node) has a small mutual capacitance C0. A grounded finger above a node takes some of the field and lowers that
   * capacitance by dC. The reduction falls off with distance from the centre of the contact as a bell-shaped profile
   * whose width grows with the contact radius a and the glass thickness t, and whose height falls with t.
   * Position is found from the weighted mean (centroid) of the node signals around the peak.
   * Measurement by charge transfer: the node capacitance Cx is charged to Vdd and emptied into a much larger capacitor Cs,
   * again and again; after n transfers V_n = Vdd (1 - (Cs/(Cs+Cx))^n), and the count needed to reach a threshold is the
   * reading.
   */
  const GRID = { nx: 8, ny: 12, p: 5 };                          // nodes and pitch in mm: a 40 x 60 mm panel
  const C0 = 2.0, DC0 = 0.42;                                    // pF: node capacitance and largest change (thin glass, large contact)
  const sigma = (a, t) => Math.sqrt((a / 1.5) ** 2 + (1.2 * t) ** 2 + (GRID.p / 3) ** 2);
  const peak = (a, t) => DC0 * (a * a) / (a * a + 4 * t * t);
  const dC = (d, a, t) => peak(a, t) * Math.exp(-(d * d) / (2 * sigma(a, t) ** 2));
  const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };   // fixed pseudo-noise in [-1, 1]
  const nodePos = (i, j) => [(i + 0.5) * GRID.p, (j + 0.5) * GRID.p];
  function frame(fx, fy, a, t, noise = 0) { const z = []; for (let j = 0; j < GRID.ny; j++) for (let i = 0; i < GRID.nx; i++) { const [x, y] = nodePos(i, j); z.push(dC(Math.hypot(x - fx, y - fy), a, t) + noise * hash(i, j)); } return z; }
  function locate(z) {
    let k = 0; for (let q = 1; q < z.length; q++) if (z[q] > z[k]) k = q;
    const pi = k % GRID.nx, pj = Math.floor(k / GRID.nx); let sw = 0, sx = 0, sy = 0;
    for (let j = Math.max(0, pj - 1); j <= Math.min(GRID.ny - 1, pj + 1); j++) for (let i = Math.max(0, pi - 1); i <= Math.min(GRID.nx - 1, pi + 1); i++) { const w = Math.max(0, z[j * GRID.nx + i]), [x, y] = nodePos(i, j); sw += w; sx += w * x; sy += w * y; }
    return { peak: z[k], node: nodePos(pi, pj), x: sx / sw, y: sy / sw };
  }
  const vAfter = (n, cx, cs, vdd = 3.3) => vdd * (1 - (cs / (cs + cx)) ** n);
  const transfers = (cx, cs, frac = 0.5) => Math.ceil(Math.log(1 - frac) / Math.log(cs / (cs + cx)));
  const transfersExact = (cx, cs, frac = 0.5) => Math.log(1 - frac) / Math.log(cs / (cs + cx));
  const M = { GRID, C0, DC0, sigma, peak, dC, hash, nodePos, frame, locate, vAfter, transfers, transfersExact };
  (window.LabModels = window.LabModels || {})['touchscreens'] = M;

  const W = GRID.nx * GRID.p, H = GRID.ny * GRID.p;

  /* ================= 1. finding the finger ================= */
  D['touch-centroid'] = {
    render(ctx, v) {
      const a = v.a, t = 0.7, noise = (v.nz / 100) * DC0, z = frame(v.fx, v.fy, a, t, noise), loc = locate(z), err = Math.hypot(loc.x - v.fx, loc.y - v.fy), errN = Math.hypot(loc.node[0] - v.fx, loc.node[1] - v.fy), pk = peak(a, t);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A \(40\times60\) mm panel seen from above. Every square is one crossing of a drive row and a sense column, 5 mm apart, shaded by how much its capacitance has fallen. The ring is the finger’s contact patch: drag it. The cross is where the controller places the touch, from the weighted average of the readings around the strongest one.`, tx`\(40\times60\) mm のパネルを上から見た図です。それぞれの四角は、駆動行と検出列の交点一つを表し、間隔は 5 mm です。静電容量がどれだけ下がったかで濃淡を付けています。輪は指の接触面です。ドラッグしてください。十字は、最も強い読み取り値の周りの加重平均から、コントローラーがタッチの位置と判断した点です。`));
      const f = L.fig(c1, { x: [0, W], y: [0, H], equal: true, aspect: H / W, maxH: 470, xlabel: T('mm', 'mm'), grid: false });
      z.forEach((q, k) => { const i = k % GRID.nx, j = Math.floor(k / GRID.nx); f.rect(i * GRID.p + 0.25, j * GRID.p + 0.25, GRID.p - 0.5, GRID.p - 0.5, { c: 'c1', fill: 'c1', fo: clamp(q / DC0, 0, 1) * 0.95 + 0.04, w: 0.4 }); });
      f.circle(v.fx, v.fy, a, { c: 'hl', w: 2.2 });
      f.line([[loc.x - 1.6, loc.y], [loc.x + 1.6, loc.y]], { c: 'ink', w: 2 }); f.line([[loc.x, loc.y - 1.6], [loc.x, loc.y + 1.6]], { c: 'ink', w: 2 });
      f.handle(v.fx, v.fy, { c: 'hl', bounds: [2.5, W - 2.5, 2.5, H - 2.5], label: T('finger position', '指の位置'), onDrag: (x, y) => { ctx.set('fx', Math.round(x * 10) / 10, true); ctx.set('fy', Math.round(y * 10) / 10); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The readings along the row of nodes nearest the finger (bars), the smooth profile they sample (line), the true centre (gold) and the estimate (black). The profile is wider than the spacing of the nodes, so several nodes respond at once and their balance gives the position far more finely than the 5 mm grid.`, tx`指に最も近い行のノードの読み取り値（棒）、それらが標本化している滑らかな分布（線）、真の中心（金色）、推定値（黒）です。分布はノードの間隔より広いので、複数のノードが同時に反応し、その釣り合いから 5 mm の格子よりはるかに細かく位置が分かります。`));
      const jr = clamp(Math.round(v.fy / GRID.p - 0.5), 0, GRID.ny - 1), yr = (jr + 0.5) * GRID.p;
      const g = L.fig(c2, { x: [0, W], y: [-0.06, 0.48], aspect: 0.62, maxH: 300, xlabel: T('position along the row (mm)', '行に沿った位置（mm）'), ylabel: T('fall in capacitance (pF)', '静電容量の低下（pF）') });
      for (let i = 0; i < GRID.nx; i++) { const q = z[jr * GRID.nx + i]; g.rect((i + 0.5) * GRID.p - 1.2, Math.min(0, q), 2.4, Math.abs(q), { c: 'c1', fill: 'c1', fo: 0.55, w: 0.6 }); }
      g.line(L.sample(0, W, 200, (x) => dC(Math.hypot(x - v.fx, yr - v.fy), a, t)), { c: 'c3', w: 2 });
      g.hline(0, { c: 'ink' }); if (noise > 0) { g.hline(noise, { c: 'c2', dash: '3 4' }); g.hline(-noise, { c: 'c2', dash: '3 4' }); }
      g.vline(v.fx, { c: 'hl', dash: '5 3', w: 1.8 }); g.vline(loc.x, { c: 'ink', w: 1.6, dash: '' });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('node readings', 'ノードの読み取り値') }, { c: 'c3', label: T('underlying profile', 'もとの分布') }, { c: 'hl', dash: true, label: T('true centre', '真の中心') }, { c: 'ink', label: T('estimate', '推定値') }, { c: 'c2', dash: true, label: T('noise level', 'ノイズの大きさ') }]);
      ctx.readout([
        { k: T('estimated position', '推定した位置'), v: tx`\((${fmt(loc.x, 2)},\ ${fmt(loc.y, 2)})\ \mathrm{mm}\)` },
        { k: T('error of the estimate', '推定の誤差'), v: tx`\(${fmt(err, 2)}\ \mathrm{mm}\)`, tone: err < 0.5 ? 'good' : err < 1.5 ? 'key' : 'warn' },
        { k: T('error if only the strongest node were used', '最も強いノードだけを使った場合の誤差'), v: tx`\(${fmt(errN, 2)}\ \mathrm{mm}\)` },
        { k: T('largest fall, as a share of the node’s 2 pF', '最大の低下、ノードの 2 pF に対する割合'), v: tx`\(${fmt(pk, 2)}\ \mathrm{pF},\ ${fmt((100 * pk) / C0, 0)}\,\%\)` },
        { k: T('signal against noise', '信号とノイズの比'), v: noise > 0 ? tx`\(${fmt(pk / noise, 0)} : 1\)` : '∞', tone: noise > 0 && pk / noise < 5 ? 'warn' : undefined },
      ], T('A small contact, such as a stylus tip or a child’s finger, lowers fewer nodes by less, so the same electrical noise moves its estimate further. This is why a cheap charger that injects noise makes a touchscreen jittery.', 'スタイラスの先や子供の指のような小さな接触は、少ない数のノードをわずかにしか下げないので、同じ電気的ノイズでも推定値が大きく動きます。ノイズを注入する安価な充電器を使うとタッチスクリーンの反応が不安定になるのは、そのためです。'));
    },
  };

  /* ================= 2. measuring a picofarad ================= */
  D['charge-transfer'] = {
    render(ctx, v) {
      const cx = v.cx, dc = v.dc, cs = v.cs * 1000, vdd = 3.3, n0 = transfersExact(cx, cs), n1 = transfersExact(cx - dc, cs), N0 = Math.ceil(n0), N1 = Math.ceil(n1), nmax = Math.max(40, Math.ceil(n1 * 1.25));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`The node’s capacitance is far too small to measure directly, so the chip uses it as a bucket. It fills the bucket from the supply and tips it into a capacitor \(${fmt(cs / cx, 0)}\) times larger, over and over, and counts how many tips raise that capacitor to half the supply. A finger makes the bucket smaller, so more tips are needed.`, tx`ノードの静電容量は直接測るには小さすぎるので、チップはそれをバケツとして使います。電源からバケツを満たし、\(${fmt(cs / cx, 0)}\) 倍大きいコンデンサーに何度も空けて、そのコンデンサーの電圧が電源の半分に達するまでの回数を数えます。指があるとバケツが小さくなるので、必要な回数が増えます。`));
      const a = L.fig(c1, { x: [0, nmax], y: [0, vdd * 0.72], aspect: 0.66, maxH: 330, xlabel: T('number of transfers', '転送の回数'), ylabel: T('voltage on the large capacitor (V)', '大きいコンデンサーの電圧（V）') });
      a.hline(vdd / 2, { c: 'muted', dash: '5 4' }); a.text(nmax * 0.02, vdd / 2, T('threshold: half the supply', 'しきい値：電源の半分'), { small: true, anchor: 'start', dy: -5 });
      const stair = (c) => { const p = []; const step = Math.max(1, Math.floor(nmax / 400)); for (let n = 0; n <= nmax; n += step) { p.push([n, vAfter(n, c, cs, vdd)]); if (nmax <= 160) p.push([n + 1, vAfter(n, c, cs, vdd)]); } return p; };
      a.line(stair(cx), { c: 'c1', w: 2.4 }); a.line(stair(cx - dc), { c: 'c2', w: 2.4 });
      a.vline(n0, { c: 'c1', dash: '3 3' }); a.vline(n1, { c: 'c2', dash: '3 3' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The count against the size of the large capacitor, untouched and touched. A bigger capacitor needs more transfers, so each reading takes longer, but the difference a finger makes grows in proportion: resolution is bought with time. Drag the gold point.`, tx`大きいコンデンサーの容量に対する、触れていないときと触れているときの回数です。コンデンサーが大きいほど転送の回数が増えて 1 回の読み取りに時間がかかりますが、指による差も比例して大きくなります。分解能は時間で買うものです。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0.5, 20], y: [0, 9000], aspect: 0.66, maxH: 330, xlabel: T('large capacitor (nF)', '大きいコンデンサー（nF）'), ylabel: T('transfers to threshold', 'しきい値までの転送回数') });
      b.line(L.sample(0.5, 20, 80, (c) => Math.min(9000, transfersExact(cx, c * 1000))), { c: 'c1', w: 2.4 }); b.line(L.sample(0.5, 20, 80, (c) => Math.min(9000, transfersExact(cx - dc, c * 1000))), { c: 'c2', w: 2.4 });
      b.handle(v.cs, clamp(n1, 0, 9000), { c: 'hl', axis: 'x', bounds: [1, 20, 0, 9000], label: T('large capacitor', '大きいコンデンサー'), onDrag: (x) => ctx.set('cs', clamp(Math.round(x * 2) / 2, 1, 20)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('untouched', '触れていないとき') }, { c: 'c2', label: T('touched', '触れているとき') }]);
      const tscan = N1 * 2e-6 * 1000;
      ctx.readout([
        { k: T('count: untouched, touched', '回数：触れていないとき、触れているとき'), v: tx`\(${N0},\ ${N1}\)`, tone: 'key' },
        { k: T('difference', '差'), v: tx`\(${N1 - N0}\ \text{counts}\)`, tone: N1 - N0 >= 20 ? 'good' : 'warn' },
        { k: T('smallest change it can see (one count)', '見分けられる最小の変化（1 カウント）'), v: tx`\(${fmt((1000 * cx) / n0, 1)}\ \mathrm{fF}\)` },
        { k: T('time for one reading at 2 µs per transfer', '1 回の転送を 2 µs としたときの読み取り時間'), v: tx`\(${fmt(tscan, 2)}\ \mathrm{ms}\)` },
        { k: T('whole panel of 96 nodes, 8 columns read at once', '96 ノードのパネル全体、8 列を同時に読む場合'), v: tx`\(${fmt(tscan * 12, 1)}\ \mathrm{ms},\ ${fmt(1000 / (tscan * 12), 0)}\ \mathrm{Hz}\)`, tone: 1000 / (tscan * 12) < 60 ? 'warn' : 'good' },
      ], T('The count depends on a ratio of capacitors, not on the supply voltage or any resistor, which is why the method is steady enough to see a change of a few femtofarads. Modern controllers do the same job with an amplifier that integrates the charge, but the trade between time and resolution is unchanged.', '回数はコンデンサーの比だけで決まり、電源電圧や抵抗にはよりません。そのため、この方法は数フェムトファラドの変化が見えるほど安定しています。最近のコントローラーは、電荷を積分するアンプで同じ仕事をしますが、時間と分解能の折り合いは変わりません。'));
    },
  };

  /* ================= 3. the stack under the glass (3D) ================= */
  function screenTexture(TH) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 480; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 320, 480); g.addColorStop(0, '#22406f'); g.addColorStop(0.55, '#5a3f86'); g.addColorStop(1, '#b85c5c'); x.fillStyle = g; x.fillRect(0, 0, 320, 480);
    const cols = ['#f2c14e', '#4fb286', '#e8684a', '#5aa9e6', '#f7f7f2', '#9b6bd0', '#58c4c6', '#f08fa2'];
    for (let r = 0; r < 5; r++) for (let q = 0; q < 4; q++) { x.fillStyle = cols[(r * 4 + q) % 8]; const X = 28 + q * 72, Y = 44 + r * 78; x.beginPath(); x.roundRect(X, Y, 48, 48, 12); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.roundRect(20, 418, 280, 50, 18); x.fill();
    const t = new TH.CanvasTexture(c); t.colorSpace = TH.SRGBColorSpace; return t;
  }
  function buildStack(S) {
    const TH = S.THREE, g = new TH.Group(), K = 0.1;                    // 1 unit = 10 mm
    const w = W * K, h = H * K, plate = (z, th, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w + 0.12, h + 0.12, th), mat); m.position.z = z; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    plate(0.1, 0.1, S.mat('#2a2c31', { metal: 0.6, rough: 0.5 }));                                                            // frame and battery side
    const oled = new TH.Mesh(new TH.PlaneGeometry(w, h), S.mat('#ffffff', { map: screenTexture(TH), rough: 0.25, coat: 1, glow: 0.35, glowColour: '#ffffff' })); oled.position.z = 0.56; g.add(oled);
    plate(0.5, 0.1, S.mat('#16171a', { rough: 0.4, coat: 0.8 }));                                                             // display panel
    // the two electrode layers: chains of diamonds, sense columns below and drive rows above, on thin clear film
    const diamonds = (rows, mat, z) => { const pos = [], d = (GRID.p / 2 - 0.22) * K; for (let j = 0; j < (rows ? GRID.ny : GRID.ny + 1); j++) for (let i = 0; i < (rows ? GRID.nx + 1 : GRID.nx); i++) { const cx = (rows ? i : i + 0.5) * GRID.p * K - w / 2, cy = (rows ? j + 0.5 : j) * GRID.p * K - h / 2; const P = [[cx - d, cy], [cx, cy - d], [cx + d, cy], [cx, cy + d]].map(([px, py]) => [clamp(px, -w / 2, w / 2), clamp(py, -h / 2, h / 2)]); pos.push(...P[0], 0, ...P[1], 0, ...P[2], 0, ...P[0], 0, ...P[2], 0, ...P[3], 0); }
      // narrow bridges joining each chain
      const br = 0.24 * K; for (let j = 0; j < GRID.ny; j++) for (let i = 0; i < GRID.nx; i++) { const cx = (i + 0.5) * GRID.p * K - w / 2, cy = (j + 0.5) * GRID.p * K - h / 2, a = rows ? [GRID.p * K / 2, br] : [br, GRID.p * K / 2]; pos.push(cx - a[0], cy - a[1], 0, cx + a[0], cy - a[1], 0, cx + a[0], cy + a[1], 0, cx - a[0], cy - a[1], 0, cx + a[0], cy + a[1], 0, cx - a[0], cy + a[1], 0); }
      const geo = new TH.BufferGeometry(); geo.setAttribute('position', new TH.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); const m = new TH.Mesh(geo, mat); m.position.z = z; g.add(m); return m; };
    const film = S.mat('#dfe8ee', { rough: 0.15, coat: 1, opacity: 0.16 });
    plate(1.2, 0.02, film); diamonds(false, S.mat('#3aa7a0', { rough: 0.3, coat: 0.8, opacity: 0.6 }), 1.215);
    plate(1.75, 0.02, film); diamonds(true, S.mat('#d3973a', { rough: 0.3, coat: 0.8, opacity: 0.6 }), 1.765);
    // cover glass: thickness follows the control
    const glass = new TH.Mesh(new TH.BoxGeometry(w + 0.12, h + 0.12, 1), S.mat('#cfe6f2', { glass: true, thickness: 0.3, ior: 1.5, rough: 0.03, opacity: 0.22 })); g.add(glass);
    // signal bars: one per node, rising from the drive layer
    const bars = [], barMat = S.mat('#3b6fd4', { rough: 0.4, coat: 0.5, glow: 0.25, glowColour: '#6fa0ff' });
    for (let j = 0; j < GRID.ny; j++) for (let i = 0; i < GRID.nx; i++) { const m = new TH.Mesh(new TH.BoxGeometry(0.2, 0.2, 1), barMat); m.position.set((i + 0.5) * GRID.p * K - w / 2, (j + 0.5) * GRID.p * K - h / 2, 1.8); g.add(m); bars.push(m); }
    // finger: fingertip and first joint, tilted as when tapping
    const skin = S.mat('#dba98a', { rough: 0.65, coat: 0.15 }), fg = new TH.Group();
    const tip = new TH.Mesh(new TH.CapsuleGeometry(0.75, 2.3, 10, 28), skin); tip.rotation.x = 0.75; tip.position.set(0, 0.841, 1.534); tip.castShadow = true; fg.add(tip);
    const nail = new TH.Mesh(new TH.SphereGeometry(0.52, 24, 16), S.mat('#f0cdbb', { rough: 0.25, coat: 1 })); nail.scale.set(1, 1.25, 0.25); nail.position.set(0, -0.08, 1.63); nail.rotation.x = 0.75; fg.add(nail);
    g.add(fg);
    S.add(g);
    return { g, glass, bars, fg, K, w, h };
  }
  D['touch-stack'] = {
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
      const a = v.a, t = v.t + v.gap, pk = peak(a, t), sg = sigma(a, t);
      L.setText(st.cap1, T(tx`The layers of a phone screen, pulled apart. Under the cover glass are two films carrying rows and columns of diamond-shaped electrodes made of a transparent conductor, then the display. The blue columns show how much each crossing’s capacitance has fallen under the finger. Drag the gold marker to move the finger.`, tx`スマートフォンの画面の層を、引き離して描いています。カバーガラスの下には、透明な導電体でできた菱形の電極が行と列に並ぶ 2 枚のフィルムがあり、その下がディスプレイです。青い柱は、指の下でそれぞれの交点の静電容量がどれだけ下がったかを示します。金色の印をドラッグして指を動かしてください。`));
      L.setText(st.cap2, T(tx`Fall in capacitance against distance from the centre of the contact, for this glass and contact size (blue), and for bare 0.4 mm glass (dashed). Thicker glass, a screen protector or a glove moves the finger away from the electrodes: the signal is both weaker and more spread out.`, tx`このガラスと接触の大きさでの、接触の中心からの距離に対する静電容量の低下（青）と、0.4 mm のガラスだけの場合（破線）です。厚いガラス、保護フィルム、手袋は指を電極から遠ざけます。信号は弱くなり、同時に広がります。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [-15, 15], y: [0, 0.45], aspect: 0.8, maxH: 400, xlabel: T('distance from the centre of the contact (mm)', '接触の中心からの距離（mm）'), ylabel: T('fall in capacitance (pF)', '静電容量の低下（pF）') });
      for (let k = -3; k <= 3; k++) g.vline(k * GRID.p, { c: 'grid', dash: '' });
      g.line(L.sample(-15, 15, 200, (x) => dC(Math.abs(x), a, 0.4)), { c: 'muted', w: 1.6, dash: '5 4' });
      const cur = L.sample(-15, 15, 200, (x) => dC(Math.abs(x), a, t)); g.area(cur, { c: 'c1', fo: 0.16, base: 0 }); g.line(cur, { c: 'c1', w: 2.8 });
      g.hline(0.02, { c: 'c2', dash: '3 4' }); g.text(14.5, 0.02, T('typical noise', '典型的なノイズ'), { small: true, anchor: 'end', dy: -5 });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('this stack', 'この構成') }, { c: 'muted', dash: true, label: T('0.4 mm glass, bare finger', '0.4 mm のガラス、素手') }, { c: 'c2', dash: true, label: T('noise', 'ノイズ') }]);
      ctx.readout([
        { k: T('finger to electrodes', '指から電極までの距離'), v: tx`\(${fmt(t, 2)}\ \mathrm{mm}\)` },
        { k: T('largest fall in capacitance', '静電容量の最大の低下'), v: tx`\(${fmt(pk, 3)}\ \mathrm{pF}\ (${fmt((100 * pk) / C0, 1)}\,\%)\)`, tone: 'key' },
        { k: T('signal against typical noise', '典型的なノイズに対する信号'), v: tx`\(${fmt(pk / 0.02, 0)} : 1\)`, tone: pk / 0.02 < 5 ? 'bad' : pk / 0.02 < 10 ? 'warn' : 'good' },
        { k: T('width of the response (standard deviation)', '応答の幅（標準偏差）'), v: tx`\(${fmt(sg, 1)}\ \mathrm{mm}\)` },
      ], T('A glove mode works by raising the gain and lowering the threshold, accepting more noise. Water is the opposite problem: a drop bridges neighbouring electrodes and raises their capacitance, which the controller must tell apart from a finger lowering it.', '手袋モードは、利得を上げてしきい値を下げ、ノイズが増えるのを受け入れることで働きます。水は逆の問題です。水滴は隣り合う電極をつないで静電容量を上げるので、コントローラーはそれを、静電容量を下げる指と区別しなければなりません。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.86, maxH: 600, camera: [7.6, -11.6, 10.0], target: [0.5, 0.2, 1.8], fov: 30,
        label: T('3D exploded view of a touchscreen stack with a finger. Drag to rotate.', '指とタッチスクリーンの層の 3D 分解図。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.stk = buildStack(S);
          st.hdl = S.handle([0, 0, 3], { c: 'hl', r: 0.14, plane: [[0, 0, 1], [0, 0, 3]], onDrag: (p) => { const c = st.ctx; c.set('fx', clamp(Math.round((p[0] / st.stk.K + W / 2) * 10) / 10, 2.5, W - 2.5), true); c.set('fy', clamp(Math.round(((p[1] + 1.0) / st.stk.K + H / 2) * 10) / 10, 2.5, H - 2.5)); } });
          S.label(T('cover glass', 'カバーガラス'), [3.0, -2.2, 2.9], { small: true }); S.label(T('drive rows', '駆動行'), [3.0, -2.2, 1.85], { small: true }); S.label(T('sense columns', '検出列'), [3.0, -2.2, 1.25], { small: true }); S.label(T('display', 'ディスプレイ'), [3.0, -2.2, 0.5], { small: true });
        },
        update(S) {
          const k = st.stk, th = v.t * k.K * 2.2, zg = 2.6 + th / 2, top = zg + th / 2 + v.gap * k.K * 2.2;
          k.glass.scale.z = th; k.glass.position.z = zg;
          const fx = (v.fx - W / 2) * k.K, fy = (v.fy - H / 2) * k.K; k.fg.position.set(fx, fy, top - 0.04);
          const z = frame(v.fx, v.fy, a, t, 0);
          k.bars.forEach((m, q) => { const hh = Math.max(0.004, (z[q] / DC0) * 0.78); m.scale.z = hh; m.position.z = 1.775 + hh / 2; m.visible = z[q] / DC0 > 0.01; });
          st.hdl.setPlane([0, 0, 1], [0, 0, top + 0.06]); st.hdl.at([fx, fy - 1.0, top + 0.06]); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [0, W], y: [0, H], equal: true, aspect: H / W, maxH: 420, grid: false });
          frame(v.fx, v.fy, a, t, 0).forEach((q, k2) => { const i = k2 % GRID.nx, j = Math.floor(k2 / GRID.nx); f2.rect(i * GRID.p + 0.25, j * GRID.p + 0.25, GRID.p - 0.5, GRID.p - 0.5, { c: 'c1', fill: 'c1', fo: clamp(q / DC0, 0, 1) * 0.95 + 0.04, w: 0.4 }); });
          f2.circle(v.fx, v.fy, a, { c: 'hl', w: 2.2 });
        },
      });
    },
  };
})();
