'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), mod = (x, m) => ((x % m) + m) % m;

  /* ---------------- models (no DOM) ----------------
   * Helmholtz motion of a bowed string of length L and frequency f, bowed a fraction beta of its length from the
   * bridge at speed vb: the string is two straight pieces meeting at a corner that runs round a parabolic envelope
   * y = 4 ym x (L - x) / L^2 once per period, with ym = vb / (8 f beta). Under the bow the string moves with the
   * hair for a fraction 1 - beta of the period and flies back for beta. The sideways force on the bridge is a
   * sawtooth of amplitude Z vb / beta, Z = sqrt(T mu).
   * Schelleng: Fmax = 2 Z vb / (beta dmu), Fmin = Z^2 vb / (2 R beta^2 dmu).
   * Body: a sum of resonances (air, two body modes, plate modes, the bridge hill).
   */
  const STR = [{ name: 'G', f: 196, T: 44 }, { name: 'D', f: 293.66, T: 43 }, { name: 'A', f: 440, T: 54 }, { name: 'E', f: 659.26, T: 76 }], LEN = 0.325, DMU = 0.5, RB = 15;
  const mu = (s) => STR[s].T / (2 * LEN * STR[s].f) ** 2;
  const Zc = (s) => Math.sqrt(STR[s].T * mu(s));
  const yMax = (vb, f, beta) => vb / (8 * f * beta);
  const envelope = (x, ym) => 4 * ym * x * (1 - x);                                                    // x as a fraction of the length from the bridge
  function kink(phase) { const p = mod(phase, 1); return p < 0.5 ? { x: 2 * p, sign: 1 } : { x: 2 - 2 * p, sign: -1 }; }
  function stringShape(x, phase, ym) { const k = kink(phase), yk = k.sign * envelope(k.x, ym); if (k.x <= 1e-9) return 0; if (k.x >= 1 - 1e-9) return 0; return x <= k.x ? (yk * x) / k.x : (yk * (1 - x)) / (1 - k.x); }
  const bowVelocity = (phase, vb, beta) => { const p = mod(phase, 1); return p < beta / 2 || p > 1 - beta / 2 ? (-vb * (1 - beta)) / beta : vb; };   // slip centred on phase 0
  const bridgeForce = (phase, vb, beta, Z) => { const p = mod(phase, 1); return ((Z * vb) / beta) * (1 - 2 * p); };
  const fMax = (vb, beta, Z) => (2 * Z * vb) / (beta * DMU);
  const fMin = (vb, beta, Z) => (Z * Z * vb) / (2 * RB * beta * beta * DMU);
  const regime = (F, vb, beta, Z) => (F > fMax(vb, beta, Z) ? 2 : F < fMin(vb, beta, Z) ? 0 : 1);
  const MODES = [[275, 14, 0.55], [460, 24, 1.0], [550, 24, 0.95], [800, 18, 0.5], [1050, 16, 0.5], [1350, 14, 0.45], [2500, 2.2, 1.1]];
  const body = (f) => { let s = 0.0009; for (const [f0, Q, A] of MODES) s += (A * A) / (1 + Q * Q * (f / f0 - f0 / f) ** 2); return Math.sqrt(s) / (1 + (f / 5200) ** 4); };
  const partial = (n, f0) => body(n * f0) / n;
  const airResonance = (areaCm2, volL, leffMm) => (343 / TAU) * Math.sqrt((areaCm2 * 1e-4) / (volL * 1e-3 * leffMm * 1e-3));
  const M = { STR, LEN, DMU, RB, mu, Zc, yMax, envelope, kink, stringShape, bowVelocity, bridgeForce, fMax, fMin, regime, MODES, body, partial, airResonance };
  (window.LabModels = window.LabModels || {}).violins = M;

  /* ================= 1. Helmholtz motion ================= */
  D['helmholtz-motion'] = {
    render(ctx, v) {
      const s = 2, f = STR[s].f, Z = Zc(s), beta = v.beta / 100, vb = v.vb / 100, ym = yMax(vb, f, beta), ph = v.ph / 100, k = kink(ph);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A bowed string at one instant, with its sideways movement enlarged. It does not swing as a smooth curve. It is two straight pieces joined at a sharp corner, and the corner races round the dashed outline, bridge to nut and back, once for every vibration. The bow (gold bar) is \(${fmt(v.beta, 0)}\) per cent of the way from the bridge. Drag the gold point to move the corner.`, tx`弓で弾いた弦のある瞬間の形で、横への動きを拡大しています。弦は、滑らかな曲線として振れるのではありません。鋭い角でつながった 2 本のまっすぐな部分からなり、その角が、破線の輪郭に沿って、ブリッジからナットへ、そして戻るまでを、1 回の振動ごとに一周します。弓（金色の棒）は、ブリッジから \(${fmt(v.beta, 0)}\) % の位置にあります。金色の点をドラッグして、角を動かしてください。`));
      const a = L.fig(c1, { x: [0, 1], y: [-1.3, 1.3], aspect: 0.6, maxH: 320, xlabel: T('along the string (bridge to nut)', '弦に沿った位置（ブリッジからナットまで）'), ylabel: T('sideways (1 = most at the middle)', '横への変位（1 = 中央での最大）'), ticksX: [[0, T('bridge', 'ブリッジ')], [0.5, '½'], [1, T('nut', 'ナット')]] });
      a.line(L.sample(0, 1, 80, (x) => envelope(x, 1)), { c: 'muted', w: 1.2, dash: '4 3' }); a.line(L.sample(0, 1, 80, (x) => -envelope(x, 1)), { c: 'muted', w: 1.2, dash: '4 3' }); a.rect(beta - 0.012, -1.3, 0.024, 2.6, { c: 'hl', fill: 'hl', fo: 0.35, w: 0 });
      a.line([[0, 0], [k.x, k.sign * envelope(k.x, 1)], [1, 0]], { c: 'c1', w: 2.8 });
      a.handle(k.x, k.sign * envelope(k.x, 1), { c: 'hl', bounds: [0.01, 0.99, -1.3, 1.3], label: T('the corner', '角'), onDrag: (x, y) => ctx.set('ph', clamp(Math.round((y >= 0 ? x / 2 : 1 - x / 2) * 50) * 2, 0, 98)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Speed of the string where the bow touches it (blue) and the sideways push of the string on the bridge (red), through two vibrations. While the corner is on the far side of the bow the string sticks to the hair and travels with it. When the corner passes under the bow it tears the string free, and the string slips back fast until the corner returns. The bridge feels a steady ramp and a sudden reversal: a sawtooth.`, tx`弓が触れている位置での弦の速さ（青）と、弦がブリッジを横に押す力（赤）を、2 回の振動にわたって描いています。角が弓の向こう側にある間、弦は弓の毛に張り付いて、一緒に動きます。角が弓の下を通ると、弦は引きはがされ、角が戻るまで速く滑り戻ります。ブリッジは、一定の傾きで増える力と、突然の反転を感じます。のこぎり波です。`));
      const b = L.fig(c2, { x: [0, 2], y: [-1.25, 1.25], aspect: 0.6, maxH: 320, xlabel: T('time (vibrations)', '時間（振動の回数）'), ylabel: T('scaled', '相対値') });
      const vs = (vb * (1 - beta)) / beta; b.hline(0, { c: 'muted' }); const pv = []; for (let i = 0; i < 2; i++) { pv.push([i, -1], [i + beta / 2, -1], [i + beta / 2, vb / vs], [i + 1 - beta / 2, vb / vs], [i + 1 - beta / 2, -1], [i + 1, -1]); } b.line(pv, { c: 'c1', w: 2.4 }); b.line([[0, 1], [1, -1], [1, 1], [2, -1]], { c: 'c2', w: 2.4 }); b.vline(ph, { c: 'muted', dash: '4 3' });
      L.legend(ctx.host, [{ c: 'c1', label: T('string; its speed under the bow', '弦、弓の下での速さ') }, { c: 'c2', label: T('force on the bridge', 'ブリッジにかかる力') }, { c: 'muted', dash: true, label: T('outline the corner follows', '角がたどる輪郭') }]);
      ctx.readout([
        { k: T('string sticks to the bow for', '弦が弓に張り付いている時間'), v: tx`\(${fmt(100 - v.beta, 0)}\ \%\ \text{${T('of each vibration', '（1 回の振動のうち）')}}\)` },
        { k: T('speed while sticking, while slipping', '張り付いているとき、滑っているときの速さ'), v: tx`\(${fmt(vb * 100, 0)},\ ${fmt(vs * 100, 0)}\ \mathrm{cm/s}\)`, tone: 'key' },
        { k: T('widest swing, at the middle', '中央での最大の振れ幅'), v: tx`\(\pm${fmt(ym * 1000, 2)}\ \mathrm{mm}\)` },
        { k: T('force on the bridge swings by', 'ブリッジにかかる力の振れ幅'), v: tx`\(\pm${fmt((Z * vb) / beta, 2)}\ \mathrm{N}\)` },
        { k: T('the corner travels at', '角が進む速さ'), v: tx`\(${fmt(2 * LEN * f, 0)}\ \mathrm{m/s}\)` },
      ], T('Bow faster, or nearer the bridge, and the swing and the force both grow: that is how a violinist plays louder. The pitch does not change, because the corner still takes the same time to go round.', '弓を速く動かすか、ブリッジに近づけると、振れ幅も力も大きくなります。バイオリニストは、こうして音を大きくします。角が一周する時間は変わらないので、音の高さは変わりません。'));
    },
  };

  /* ================= 2. bowing a violin (3D) ================= */
  const halfW = (x) => { const e = (c, a, b) => { const u = (x - c) / a; return Math.abs(u) < 1 ? b * Math.sqrt(1 - u * u) : 0; }, cb = x > 1.25 && x < 2.3 ? 0.56 + 0.3 * ((x - 1.75) / 0.5) ** 2 : 0; return Math.max(e(0.82, 0.84, 1.04), e(2.85, 0.72, 0.84), cb); };
  function buildViolin(S) {
    const TH = S.THREE, g = new TH.Group();                                                           // 1 unit = 100 mm; x from the bottom of the body toward the scroll
    const varnish = S.mat('#9a4a1c', { rough: 0.25, coat: 1 }), top = S.mat('#c27a36', { rough: 0.25, coat: 1, opacity: 0.55 }), ebony = S.mat('#17140f', { rough: 0.35, coat: 0.6 }), maple = S.mat('#e3c898', { rough: 0.5 }), spruce = S.mat('#e7d3a1', { rough: 0.6 }), steel = S.mat('#d8dce1', { metal: 1, rough: 0.25 }), hair = S.mat('#f1ede2', { rough: 0.8 }), stick = S.mat('#5a2d16', { rough: 0.35, coat: 0.8 });
    const out = []; for (let i = 0; i <= 140; i++) { const x = (3.57 * i) / 140; out.push(new TH.Vector2(x, halfW(x))); } for (let i = 140; i >= 0; i--) { const x = (3.57 * i) / 140; out.push(new TH.Vector2(x, -halfW(x))); }
    const ext = (depth, z, mat) => { const m = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape(out), { depth, bevelEnabled: false }), mat); m.position.z = z; m.castShadow = true; g.add(m); return m; };
    ext(0.035, -0.335, varnish); { const ribs = ext(0.3, -0.3, varnish); ribs.material = S.mat('#8a3f16', { rough: 0.3, coat: 1, opacity: 0.5, side: 2 }); } ext(0.03, 0, top);
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    box(2.5, 0.05, 0.11, 1.8, 0.2, -0.06, spruce); { const sp = new TH.Mesh(new TH.CylinderGeometry(0.03, 0.03, 0.3, 12).rotateX(PI / 2), spruce); sp.position.set(1.5, -0.2, -0.15); g.add(sp); }
    for (const sy of [-1, 1]) { const fh = new TH.Mesh(new TH.BoxGeometry(0.72, 0.045, 0.004), ebony); fh.position.set(1.62, sy * 0.4, 0.033); fh.rotation.z = sy * 0.12; g.add(fh); for (const ex of [-0.38, 0.38]) { const d = new TH.Mesh(new TH.CylinderGeometry(0.045, 0.045, 0.004, 14).rotateX(PI / 2), ebony); d.position.set(1.62 + ex, sy * (0.4 + ex * 0.12 * 1) + (ex > 0 ? -sy * 0.03 : sy * 0.03), 0.033); g.add(d); } }
    box(1.35, 0.26, 0.16, 4.22, 0, 0.05, varnish); { const fb = box(2.7, 0.3, 0.05, 3.5, 0, 0.3, ebony); fb.rotation.y = 0.045; } box(0.03, 0.25, 0.06, 4.86, 0, 0.22, ebony);
    { const pb = box(0.6, 0.22, 0.2, 5.15, 0, 0.02, varnish); const sc = new TH.Mesh(new TH.TorusGeometry(0.13, 0.07, 10, 24).rotateX(PI / 2), varnish); sc.position.set(5.55, 0, -0.02); g.add(sc); for (let k = 0; k < 4; k++) { const pg = new TH.Mesh(new TH.CylinderGeometry(0.03, 0.045, 0.75, 10), ebony); pg.position.set(4.98 + 0.13 * k, k % 2 ? 0.2 : -0.2, 0.03); g.add(pg); } }
    { const bs = new TH.Shape([[-0.21, 0], [0.21, 0], [0.19, 0.2], [0.12, 0.33], [0, 0.36], [-0.12, 0.33], [-0.19, 0.2]].map((q) => new TH.Vector2(q[0], q[1]))); const br = new TH.Mesh(new TH.ExtrudeGeometry(bs, { depth: 0.03, bevelEnabled: false }).rotateX(PI / 2).rotateZ(PI / 2), maple); br.position.set(1.615, 0, 0.03); br.castShadow = true; g.add(br); }
    { const tp = new TH.Mesh(new TH.ExtrudeGeometry(new TH.Shape([[0.2, -0.1], [1.25, -0.22], [1.25, 0.22], [0.2, 0.1]].map((q) => new TH.Vector2(q[0], q[1]))), { depth: 0.04, bevelEnabled: false }), ebony); tp.position.z = 0.2; g.add(tp); }
    const sy = (k, x) => { const yb = -0.165 + 0.11 * k, yn = -0.085 + 0.057 * k; return yb + ((yn - yb) * (x - 1.6)) / 3.26; }, sz = (k, x) => { const zb = 0.36 + (k === 1 || k === 2 ? 0.035 : 0), zn = 0.255; return zb + ((zn - zb) * (x - 1.6)) / 3.26; };
    const strings = []; for (let k = 0; k < 4; k++) { const ln = S.lines([[[1.2, -0.12 + 0.08 * k, 0.26], [1.6, sy(k, 1.6), sz(k, 1.6)]], [[1.6, sy(k, 1.6), sz(k, 1.6)], [4.86, sy(k, 4.86), sz(k, 4.86)]]], { c: 'ink', opacity: 0.85, w: 1.2 + 0.25 * (3 - k) }); strings.push(ln); }
    const live = S.lines([], { c: 'hl', opacity: 1, w: 2.8 });
    const bow = new TH.Group(); g.add(bow); { const st = new TH.Mesh(new TH.CylinderGeometry(0.03, 0.022, 7.3, 10), stick); st.position.z = 0.16; bow.add(st); const hr = new TH.Mesh(new TH.BoxGeometry(0.1, 6.5, 0.012), hair); bow.add(hr); const frog = new TH.Mesh(new TH.BoxGeometry(0.14, 0.45, 0.2), ebony); frog.position.set(0, -3.1, 0.08); bow.add(frog); const tipB = new TH.Mesh(new TH.BoxGeometry(0.08, 0.22, 0.2), stick); tipB.position.set(0, 3.45, 0.08); bow.add(tipB); }
    S.add(g);
    return { strings, live, bow, sy, sz };
  }
  D['violin-bowing'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const s = v.s, Z = Zc(s), beta = v.beta / 100, vb = v.vb / 100, F = v.F, hi = fMax(vb, beta, Z), lo = fMin(vb, beta, Z), rg = regime(F, vb, beta, Z); st.p = { s, beta, rg };
      L.setText(st.cap1, T(tx`A violin being bowed on its \(\text{${STR[s].name}}\) string, with the top made see-through. The bow hair, sticky with rosin, drags the string sideways until it snaps back, \(${fmt(STR[s].f, 0)}\) times a second. The string cannot move air by itself; it rocks the bridge, whose two feet press on the thin spruce top. Under one foot a post links top and back; under the other a bar runs along the top. The corner on the gold string is slowed down and enlarged.`, tx`\(\text{${STR[s].name}}\) 線を弓で弾いているバイオリンで、表板を透明にしています。松やにでべたつく弓の毛が、弦を横に引きずり、弦が元へ跳ね戻ることを、毎秒 \(${fmt(STR[s].f, 0)}\) 回繰り返します。弦は、それだけでは空気を動かせません。弦は駒を揺らし、駒の二本の足が、薄いスプルースの表板を押します。一方の足の下には、表板と裏板をつなぐ魂柱があり、もう一方の足の下には、表板に沿って力木が走っています。金色の弦の角は、遅くし、拡大して描いています。`));
      L.setText(st.cap2, T(tx`How hard the bow must press for a clean note, against where it meets the string, on logarithmic scales, at a bow speed of \(${fmt(v.vb, 0)}\) cm/s. Press harder than the upper line and the string cannot break free on time: the note cracks into a growl. Press more lightly than the lower line and the string breaks free too often, giving a thin whistle. The usable wedge between them narrows toward the bridge. Drag the gold point.`, tx`きれいな音を出すために、弓をどれだけ強く押さなければならないかを、弓が弦に当たる位置に対して、両対数で描いています。弓の速さは毎秒 \(${fmt(v.vb, 0)}\) cm です。上の線より強く押すと、弦が決まった時刻に離れられず、音はつぶれてうなり声になります。下の線より弱く押すと、弦が何度も離れてしまい、細い笛のような音になります。その間の使えるくさび形の範囲は、駒に近づくほど狭くなります。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const lx = Math.log10, g = L.fig(st.g2, { x: [lx(2), lx(30)], y: [lx(0.01), lx(20)], aspect: 0.8, maxH: 400, xlabel: T('bow from the bridge (% of the string)', '駒から弓までの距離（弦の長さに対する %）'), ylabel: T('bow force (N)', '弓の圧力（N）'), ticksX: [2, 5, 10, 20, 30].map((q) => [lx(q), String(q)]), ticksY: [0.01, 0.1, 1, 10].map((q) => [lx(q), String(q)]) });
      const up = L.sample(lx(2), lx(30), 40, (q) => lx(fMax(vb, 10 ** q / 100, Z))), dn = L.sample(lx(2), lx(30), 40, (q) => lx(fMin(vb, 10 ** q / 100, Z)));
      g.poly(up.concat(dn.slice().reverse()), { c: 'c3', fill: 'c3', fo: 0.16, w: 0 }); g.line(up.map((q) => [q[0], Math.min(lx(20), q[1])]), { c: 'c2', w: 2.4 }); g.line(dn.map((q) => [q[0], clamp(q[1], lx(0.01), lx(20))]), { c: 'c1', w: 2.4 });
      g.text(lx(14), lx(6), T('growl', 'うなり'), { small: true, anchor: 'middle' }); g.text(lx(4.5), lx(0.03), T('whistle', '笛のような音'), { small: true, anchor: 'middle' });
      g.handle(lx(v.beta), lx(F), { c: 'hl', bounds: [lx(2), lx(30), lx(0.01), lx(20)], label: T('bow position and force', '弓の位置と圧力'), onDrag: (x, y) => { ctx.set('beta', clamp(Math.round(10 ** x), 2, 30), true); ctx.set('F', clamp(Math.round(10 ** y * 100) / 100, 0.02, 10)); } });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('most force', '最大の圧力') }, { c: 'c1', label: T('least force', '最小の圧力') }, { c: 'c3', label: T('clean note', 'きれいな音') }]);
      ctx.readout([
        { k: T('bow is from the bridge', '駒から弓までの距離'), v: tx`\(${fmt(beta * LEN * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('least and most force for a clean note', 'きれいな音になる最小、最大の圧力'), v: tx`\(${fmt(lo, 2)},\ ${fmt(hi, 2)}\ \mathrm{N}\)`, tone: 'key' },
        { k: T('this bow stroke', 'この弓使い'), v: T(['whistles: too light', 'gives a clean note', 'growls: too heavy'][rg], ['笛のような音：弱すぎる', 'きれいな音になる', 'うなる：強すぎる'][rg]), tone: rg === 1 ? 'good' : 'warn' },
        { k: T('string swings at its middle by', '弦の中央での振れ幅'), v: tx`\(\pm${fmt(yMax(vb, STR[s].f, beta) * 1000, 2)}\ \mathrm{mm}\)` },
        { k: T('push on the bridge', '駒を押す力'), v: tx`\(\pm${fmt((Z * vb) / beta, 2)}\ \mathrm{N}\)` },
      ], T('Near the bridge the note is loud and brilliant but the bow must be heavy and exact. Over the fingerboard almost any pressure works and the sound is soft. Much of a violinist’s right-hand skill is steering through this wedge.', '駒の近くでは、音は大きく輝かしくなりますが、弓は重く、正確でなければなりません。指板の上では、ほとんどどんな圧力でも音が出て、音は柔らかくなります。バイオリニストの右手の技術の多くは、このくさび形の範囲の中で弓を操ることです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.9 : 0.75, maxH: 520, camera: [-0.6, -7.2, 5.0], target: [2.2, 0, 0.1], fov: 30,
        label: T('3D violin with a see-through top being bowed. Drag to rotate.', '表板を透明にしたバイオリンを弓で弾く 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.vn = buildViolin(S); st.t = 0;
          S.label(T('bridge', '駒'), [1.6, -1.05, 0.75], { small: true }); S.label(T('sound post', '魂柱'), [1.5, -1.25, -0.25], { small: true }); S.label(T('bass bar', '力木'), [2.6, 1.3, 0.2], { small: true }); S.label(T('bow', '弓'), [2.3, -3.6, 0.9], { small: true });
          const draw = (dt) => { const m = st.vn, q = st.p; st.t += dt; const k = q.s, xb = 1.6 + q.beta * 3.26, tilt = [0.42, 0.14, -0.14, -0.42][k]; m.bow.position.set(xb, m.sy(k, xb) + 1.6 * Math.sin(st.t * 0.9), m.sz(k, xb) + 0.012); m.bow.rotation.x = 0; m.bow.rotation.y = 0; m.bow.rotation.set(tilt, 0, 0); m.bow.position.z += Math.sin(tilt) * (m.bow.position.y - m.sy(k, xb));
            const ph = st.t * 0.55, kk = kink(ph), amp = q.rg === 1 ? 0.13 : q.rg === 0 ? 0.03 : 0.09, jit = q.rg === 2 ? 0.03 * Math.sin(st.t * 37) : 0, xk = 1.6 + kk.x * 3.26, yk = kk.sign * envelope(kk.x, amp) + jit; const P = (x, dy) => [x, m.sy(k, x) + dy, m.sz(k, x)]; m.live.update([[P(1.6, 0), P(xk, yk)], [P(xk, yk), P(4.86, 0)]]); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-0.3, 6], y: [-1.6, 1.6], equal: true, maxH: 280, axes: false, grid: false }); const o = []; for (let i = 0; i <= 80; i++) { const x = (3.57 * i) / 80; o.push([x, halfW(x)]); } for (let i = 80; i >= 0; i--) { const x = (3.57 * i) / 80; o.push([x, -halfW(x)]); } f2.poly(o, { c: 'ink', fill: 'c2', fo: 0.3, w: 1.6 }); f2.rect(3.57, -0.13, 1.3, 0.26, { c: 'ink', fill: 'ink', fo: 0.6 }); f2.seg([1.6, -0.2], [1.6, 0.2], { c: 'ink', w: 3 }); },
      });
    },
  };

  /* ================= 3. what the body adds ================= */
  D['body-modes'] = {
    render(ctx, v) {
      const semis = v.note, f0 = 196 * 2 ** (semis / 12), lx = Math.log10, names = ['G', 'G^\\sharp', 'A', 'A^\\sharp', 'B', 'C', 'C^\\sharp', 'D', 'D^\\sharp', 'E', 'F', 'F^\\sharp'], nm = names[semis % 12] + (3 + Math.floor((semis + 7) / 12)), N = 14;
      const parts = Array.from({ length: N }, (_, i) => partial(i + 1, f0)), mx = Math.max(...parts), best = parts.indexOf(mx) + 1, air = airResonance(v.area, v.vol, 22);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How strongly the body of a violin turns a push on its bridge into sound, against frequency. The peak near 275 Hz is the air inside sloshing in and out of the f-holes. The pair near 500 Hz are the whole body flexing. The broad hump round 2.5 kHz comes from the bridge itself rocking on its waist. The vertical lines are the harmonics of the note \(\text{${nm}}\); each is heard in proportion to the curve where it falls. Drag the gold point to change the note.`, tx`バイオリンのボディが、駒への押す力をどれだけ強く音に変えるかを、周波数に対して描いています。275 Hz 付近の山は、中の空気が f 字孔を出入りして揺れる共鳴です。500 Hz 付近の二つの山は、ボディ全体がたわむ共鳴です。2.5 kHz 付近の幅広い盛り上がりは、駒そのものが腰の部分で揺れることから生じます。縦線は、音 \(\text{${nm}}\) の倍音です。それぞれの倍音は、その位置での曲線の高さに比例して聞こえます。金色の点をドラッグして、音を変えてください。`));
      const a = L.fig(c1, { x: [lx(150), lx(8000)], y: [0, 1.3], aspect: 0.7, maxH: 350, xlabel: T('frequency (Hz)', '周波数（Hz）'), ylabel: T('sound per unit push', '押す力あたりの音'), ticksX: [200, 500, 1000, 2000, 5000].map((q) => [lx(q), String(q)]) });
      a.line(L.sample(lx(150), lx(8000), 400, (q) => Math.min(1.3, body(10 ** q))), { c: 'c1', w: 2.4 }); for (let n = 1; n <= N; n++) { const f = n * f0; if (f < 8000) a.line([[lx(f), 0], [lx(f), Math.min(1.3, body(f))]], { c: 'c2', w: n === 1 ? 2.6 : 1.4 }); }
      a.handle(lx(f0), Math.min(1.3, body(f0)), { c: 'hl', axis: 'x', bounds: [lx(196), lx(196 * 2 ** (36 / 12)), 0, 1.3], label: T('note', '音'), onDrag: (x) => ctx.set('note', clamp(Math.round(12 * Math.log2(10 ** x / 196)), 0, 36)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The strength of each harmonic as it leaves the violin. The string offers them in the proportions 1, ½, ⅓ and so on (grey). The body reshapes that: here the loudest is harmonic \(${best}\), at \(${fmt(best * f0, 0)}\) Hz. Because the peaks stay put while the harmonics move with the note, every note on a violin has a slightly different colour.`, tx`バイオリンから出るときの、それぞれの倍音の強さです。弦は、1、½、⅓ という割合で倍音を与えます（灰色）。ボディは、それを作り変えます。ここで最も強いのは第 \(${best}\) 倍音で、\(${fmt(best * f0, 0)}\) Hz です。山の位置は変わらず、倍音は音とともに動くので、バイオリンのどの音も、少しずつ異なる音色を持ちます。`));
      const b = L.fig(c2, { x: [0, N + 1], y: [0, 1.1], aspect: 0.7, maxH: 350, xlabel: T('harmonic', '倍音の番号'), ylabel: T('strength (largest = 1)', '強さ（最大 = 1）'), ticksX: [1, 2, 4, 6, 8, 10, 12, 14].map((q) => [q, String(q)]) });
      for (let n = 1; n <= N; n++) { b.rect(n - 0.36, 0, 0.3, 1 / n, { c: 'muted', fill: 'muted', fo: 0.45 }); b.rect(n + 0.02, 0, 0.34, parts[n - 1] / mx, { c: 'c2', fill: 'c2', fo: 0.6 }); }
      L.legend(ctx.host, [{ c: 'c1', label: T('response of the body', 'ボディの応答') }, { c: 'c2', label: T('harmonics of the note, as heard', '音の倍音（聞こえる強さ）') }, { c: 'muted', label: T('as the string supplies them', '弦が与える強さ') }]);
      ctx.readout([
        { k: T('note', '音'), v: tx`\(\mathrm{${nm}},\ ${fmt(f0, 1)}\ \mathrm{Hz}\)`, tone: 'key' },
        { k: T('loudest harmonic', '最も強い倍音'), v: tx`\(${best}\ (${fmt(best * f0, 0)}\ \mathrm{Hz})\)` },
        { k: T('fundamental, of the loudest', '基音の強さ（最も強い倍音に対する割合）'), v: tx`\(${fmt((100 * parts[0]) / mx, 0)}\ \%\)`, tone: parts[0] / mx < 0.3 ? 'warn' : 'good' },
        { k: T('air resonance from these f-holes and volume', 'この f 字孔と容積による空気の共鳴'), v: tx`\(${fmt(air, 0)}\ \mathrm{Hz}\)` },
        { k: T('nearest note to that', 'それに最も近い音'), v: tx`\(\text{${names[((Math.round(12 * Math.log2(air / 196)) % 12) + 12) % 12]}}\)` },
      ], T(parts[0] / mx < 0.3 ? 'The fundamental of this note falls where the body responds weakly. The ear still hears the right pitch, rebuilt from the spacing of the harmonics above it.' : 'The fundamental sits on or near a resonance and the note sounds full. When a body resonance and a played note coincide too exactly the string and body fight, and the note stutters: the wolf.', parts[0] / mx < 0.3 ? 'この音の基音は、ボディの応答が弱いところにあります。それでも耳は、その上の倍音の間隔から基音を補って、正しい高さを聞き取ります。' : '基音が共鳴の上か近くにあり、音は豊かに響きます。ボディの共鳴と弾いた音があまりに正確に重なると、弦とボディが争い、音が震えます。これがウルフ音です。'));
    },
  };
})();
