'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180, deg = (r) => (r * 180) / PI;

  /* ---------------- models (no DOM) ----------------
   * Four-bar linkage: fixed pivots O = (0,0) and Q = (d,0); crank OA of length a at angle th; coupler AB of length b;
   * rocker QB of length c. B is the intersection of the circle of radius b about A with the circle of radius c about Q
   * (the branch on the left of the line from A to Q). A point carried on the coupler sits p along AB and q to its left.
   * Grashof: the shortest link can turn fully relative to the others when shortest + longest <= sum of the other two.
   * Cam with a rise of h over an angle beta: displacement, and its first two derivatives with respect to cam angle,
   * for simple harmonic, cycloidal and constant-acceleration (parabolic) laws. Follower acceleration = s'' * omega^2.
   */
  function solve(a, b, c, d, th, br = 1) {
    const A = [a * Math.cos(th), a * Math.sin(th)], ex = d - A[0], ey = -A[1], Dq = Math.hypot(ex, ey); if (Dq > b + c + 1e-12 || Dq < Math.abs(b - c) - 1e-12 || Dq < 1e-12) return null;
    const al = Math.atan2(ey, ex), be = Math.acos(clamp((b * b + Dq * Dq - c * c) / (2 * b * Dq), -1, 1)), B = [A[0] + b * Math.cos(al + br * be), A[1] + b * Math.sin(al + br * be)];
    const mu = Math.acos(clamp((b * b + c * c - Dq * Dq) / (2 * b * c), -1, 1));
    return { A, B, phi: Math.atan2(B[1], B[0] - d), mu };
  }
  const couplerPoint = (s, p, q) => { const ux = s.B[0] - s.A[0], uy = s.B[1] - s.A[1], n = Math.hypot(ux, uy); return [s.A[0] + (p * ux - q * uy) / n, s.A[1] + (p * uy + q * ux) / n]; };
  function grashof(a, b, c, d) { const l = [a, b, c, d], s = Math.min(...l), g = Math.max(...l), ok = s + g <= l.reduce((x, y) => x + y, 0) - s - g + 1e-9; return { ok, type: !ok ? 3 : s === a ? 0 : s === d ? 1 : s === b ? 2 : 4 }; }
  function validRun(a, b, c, d, n = 720) { const v = []; for (let i = 0; i < n; i++) v.push(!!solve(a, b, c, d, (2 * PI * i) / n)); if (v.every(Boolean)) return { lo: 0, hi: 2 * PI, full: true }; let best = [0, 0], i0 = v.indexOf(false); for (let k = 0, run = 0, start = 0; k <= n; k++) { const i = (i0 + k) % n; if (v[i] && k < n) { if (!run) start = i0 + k; run++; } else { if (run - 1 > best[1] - best[0]) best = [start, start + run - 1]; run = 0; } }
    let lo = (2 * PI * best[0]) / n, hi = (2 * PI * best[1]) / n; const edge = (inside, outside) => { for (let k = 0; k < 40; k++) { const m = (inside + outside) / 2; if (solve(a, b, c, d, m)) inside = m; else outside = m; } return inside; }; lo = edge(lo, lo - (2 * PI) / n); hi = edge(hi, hi + (2 * PI) / n); return { lo, hi, full: false }; }
  const SL = [
    { en: 'Watt', ja: 'ワット', a: 2, b: 1, c: 2, d: Math.hypot(4, 1), p: 0.5, q: 0 },
    { en: 'Chebyshev', ja: 'チェビシェフ', a: 2.5, b: 1, c: 2.5, d: 2, p: 0.5, q: 0, br: -1 },
    { en: 'Hoeken', ja: 'ヘッケン', a: 1, b: 2.5, c: 2.5, d: 2, p: 5, q: 0 },
  ];
  function couplerCurve(m, n = 720) { const r = validRun(m.a, m.b, m.c, m.d), pts = []; for (let i = 0; i <= n; i++) { const th = r.lo + ((r.hi - r.lo) * i) / n, s = solve(m.a, m.b, m.c, m.d, th, m.br || 1); if (s) pts.push({ th, P: couplerPoint(s, m.p, m.q) }); } return { run: r, pts }; }
  function straightest(m, share = 1 / 3, n = 720) { const cc = couplerCurve(m, n).pts, w = Math.round(n * share); let best = null; const lim = cc.length - w - 1, closed = Math.hypot(cc[0].P[0] - cc[cc.length - 1].P[0], cc[0].P[1] - cc[cc.length - 1].P[1]) < 1e-6;
    for (let i = 0; i <= (closed ? cc.length - 2 : lim); i += 2) { const at = (k) => cc[closed ? (i + k) % (cc.length - 1) : i + k].P, p0 = at(0), p1 = at(w), ch = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); if (ch < 1e-6) continue; let dev = 0; for (let k = 1; k < w; k++) { const q = at(k); dev = Math.max(dev, Math.abs((q[0] - p0[0]) * (p1[1] - p0[1]) - (q[1] - p0[1]) * (p1[0] - p0[0])) / ch); } if (!best || dev / ch < best.ratio) best = { i, w, ratio: dev / ch, dev, chord: ch, p0, p1, closed }; }
    return best; }
  const LAWS = [
    { en: 'simple harmonic', ja: '単弦運動', s: (u) => (1 - Math.cos(PI * u)) / 2, v: (u) => (PI / 2) * Math.sin(PI * u), a: (u) => ((PI * PI) / 2) * Math.cos(PI * u), peak: (PI * PI) / 2 },
    { en: 'cycloidal', ja: 'サイクロイド運動', s: (u) => u - Math.sin(2 * PI * u) / (2 * PI), v: (u) => 1 - Math.cos(2 * PI * u), a: (u) => 2 * PI * Math.sin(2 * PI * u), peak: 2 * PI },
    { en: 'constant acceleration', ja: '等加速度運動', s: (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) ** 2), v: (u) => (u < 0.5 ? 4 * u : 4 * (1 - u)), a: (u) => (u < 0.5 ? 4 : -4), peak: 4 },
  ];
  function cam(thDeg, h, betaDeg, law) { const t = ((thDeg % 360) + 360) % 360, f = LAWS[law], b = rad(betaDeg); if (t < betaDeg) { const u = t / betaDeg; return { s: h * f.s(u), v: (h * f.v(u)) / b, a: (h * f.a(u)) / (b * b) }; } if (t <= 180) return { s: h, v: 0, a: 0 }; if (t < 180 + betaDeg) { const u = 1 - (t - 180) / betaDeg; return { s: h * f.s(u), v: (-h * f.v(u)) / b, a: (h * f.a(u)) / (b * b) }; } return { s: 0, v: 0, a: 0 }; }
  const peakAccel = (hMm, betaDeg, law, rpm) => ((LAWS[law].peak * hMm) / 1000 / rad(betaDeg) ** 2) * ((2 * PI * rpm) / 60) ** 2;
  const peakSpeed = (hMm, betaDeg, law, rpm) => (([PI / 2, 2, 2][law] * hMm) / 1000 / rad(betaDeg)) * ((2 * PI * rpm) / 60);
  const M = { solve, couplerPoint, grashof, validRun, SL, couplerCurve, straightest, LAWS, cam, peakAccel, peakSpeed };
  (window.LabModels = window.LabModels || {}).linkages = M;
  const TYPES = [['crank-rocker: the input turns fully, the output swings', 'てこクランク機構：入力は一回転し、出力は揺動する'], ['double crank: both turn fully', '両クランク機構：どちらも一回転する'], ['double rocker: only the coupler turns fully', '両てこ機構：一回転するのは連結棒だけ'], ['no link can turn fully', '一回転できるリンクはない'], ['rocker-crank: the input swings, the output can turn fully', 'てこクランク機構：入力は揺動し、出力は一回転できる']];

  /* ================= 1. the four-bar linkage (3D) ================= */
  const U = 20;                                                                                        // mm per scene unit
  function buildBars(S) {
    const TH = S.THREE, g = new TH.Group(), steel = S.mat('#c4c8ce', { metal: 0.7, rough: 0.38 }), blue = S.mat('#3f6fb0', { metal: 0.6, rough: 0.4 }), red = S.mat('#b6492f', { metal: 0.6, rough: 0.4 }), brass = S.mat('#c9a04a', { metal: 1, rough: 0.3 }), plateM = S.mat('#e4e1d8', { rough: 0.85, coat: 0 }), dark = S.mat('#33373d', { metal: 0.8, rough: 0.5 });
    const plate = new TH.Mesh(new TH.BoxGeometry(14, 10, 0.3), plateM); plate.position.set(3, 1.6, -0.15); plate.receiveShadow = true; g.add(plate);
    const bar = (len, mat, w = 0.34) => { const sh = new TH.Shape(); sh.moveTo(0, -w); sh.lineTo(len, -w); sh.absarc(len, 0, w, -PI / 2, PI / 2, false); sh.lineTo(0, w); sh.absarc(0, 0, w, PI / 2, (3 * PI) / 2, false); for (const x of [0, len]) { const h = new TH.Path(); h.absarc(x, 0, 0.13, 0, 2 * PI, true); sh.holes.push(h); } const m = new TH.Mesh(new TH.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, curveSegments: 20 }), mat); m.castShadow = true; return m; };
    const pin = (h) => { const p = new TH.Group(), sh = new TH.Mesh(new TH.CylinderGeometry(0.125, 0.125, h, 20).rotateX(PI / 2), steel), hd = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.06, 20).rotateX(PI / 2), steel); sh.position.z = h / 2; hd.position.z = h; p.add(sh, hd); return p; };
    const post = () => { const p = new TH.Mesh(new TH.CylinderGeometry(0.42, 0.5, 0.3, 28).rotateX(PI / 2), dark); p.position.z = 0.15; p.castShadow = true; return p; };
    const dyn = new TH.Group(); g.add(dyn); const curve = S.lines([], { c: 'c2', opacity: 0.95, w: 2.2 }); const marker = new TH.Mesh(new TH.SphereGeometry(0.2, 20, 14), brass); g.add(marker); S.add(g);
    let parts = null, key = '';
    function set(a, b, c, d, p, q, th, pts) {
      const k = [a, b, c, d, p, q].join('/'); if (k !== key) { key = k; for (const m of [...dyn.children]) { m.traverse((o) => o.geometry && o.geometry.dispose()); dyn.remove(m); }
        const lp = Math.hypot(p, q), lq = Math.hypot(b - p, q); parts = { crank: bar(a / U, red), coup: bar(b / U, blue), rock: bar(c / U, steel), ap: lp > 3 ? bar(lp / U, blue, 0.22) : null, bp: lq > 3 ? bar(lq / U, blue, 0.22) : null, pA: pin(0.62), pB: pin(0.62), pO: pin(0.5), pQ: pin(0.5), o1: post(), o2: post() };
        parts.crank.position.z = 0.32; parts.rock.position.z = 0.32; parts.coup.position.z = 0.52; if (parts.ap) parts.ap.position.z = 0.52; if (parts.bp) parts.bp.position.z = 0.52; parts.o2.position.x = d / U; parts.pQ.position.set(d / U, 0, 0.05); parts.pO.position.z = 0.05; for (const m of Object.values(parts)) if (m) dyn.add(m);
        curve.update(pts.slice(1).map((P, i) => [[pts[i][0] / U, pts[i][1] / U, 0.012], [P[0] / U, P[1] / U, 0.012]])); }
      const s = solve(a, b, c, d, th); if (!s) return; const A = s.A, B = s.B, P = couplerPoint(s, p, q);
      parts.crank.rotation.z = th; parts.rock.position.x = d / U; parts.rock.rotation.z = s.phi; parts.coup.position.set(A[0] / U, A[1] / U, 0.52); parts.coup.rotation.z = Math.atan2(B[1] - A[1], B[0] - A[0]);
      if (parts.ap) { parts.ap.position.set(A[0] / U, A[1] / U, 0.52); parts.ap.rotation.z = Math.atan2(P[1] - A[1], P[0] - A[0]); } if (parts.bp) { parts.bp.position.set(B[0] / U, B[1] / U, 0.52); parts.bp.rotation.z = Math.atan2(P[1] - B[1], P[0] - B[0]); }
      parts.pA.position.set(A[0] / U, A[1] / U, 0.2); parts.pB.position.set(B[0] / U, B[1] / U, 0.2); marker.position.set(P[0] / U, P[1] / U, 0.78);
    }
    return { set };
  }
  D['four-bar'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const a = v.a, b = v.b, c = v.c, d = v.d, m = { a, b, c, d, p: v.p, q: v.q }, G = grashof(a, b, c, d), cc = couplerCurve(m, 360), run = cc.run;
      if (!cc.pts.length) { L.setText(st.cap1, T('These four lengths cannot be joined into a closed chain: one bar is longer than the other three together.', 'この四つの長さでは、閉じた連鎖を作れません。1 本の棒が、ほかの 3 本の合計より長いからです。')); L.setText(st.cap2, ''); st.g2.replaceChildren(); ctx.readout([{ k: T('linkage', 'リンク機構'), v: T('cannot be assembled', '組み立てられない'), tone: 'warn' }], ''); return; }
      const th = run.full ? rad(v.th) : run.lo + (run.hi - run.lo) * (v.th / 360), s = solve(a, b, c, d, th), P = couplerPoint(s, v.p, v.q); st.q = { a, b, c, d, p: v.p, q: v.q, th, pts: cc.pts.map((o) => o.P) };
      L.setText(st.cap1, T(tx`Four bars pinned in a loop, one of them the base plate. The red bar, \(${fmt(a, 0)}\) mm long, is driven; the blue coupler, \(${fmt(b, 0)}\) mm, joins it to the steel bar, \(${fmt(c, 0)}\) mm, which swings about a pivot \(${fmt(d, 0)}\) mm away. The brass point is carried on the coupler, and the red curve on the plate is the path it traces. One angle fixes the position of everything.`, tx`4 本の棒を、ピンで輪につないだものです。そのうちの 1 本は、基板です。長さ \(${fmt(a, 0)}\) mm の赤い棒が駆動されます。\(${fmt(b, 0)}\) mm の青い連結棒が、これを \(${fmt(c, 0)}\) mm の鋼の棒につなぎ、鋼の棒は、\(${fmt(d, 0)}\) mm 離れた支点の周りを揺動します。真ちゅうの点は連結棒に載っていて、基板の上の赤い曲線が、その点の描く経路です。一つの角度が、すべての位置を決めます。`));
      L.setText(st.cap2, T(tx`Angle of the output bar against the angle of the input. The slope is the speed ratio between them at that instant: where the curve is flat the output pauses, however fast the input turns. The dashed curve is the transmission angle between coupler and output bar; near 0° or 180° the coupler pushes along the bar instead of across it and the linkage jams. Drag the gold point.`, tx`出力の棒の角度を、入力の角度に対して描いています。傾きは、その瞬間の両者の速さの比です。曲線が平らなところでは、入力がどれほど速く回っても、出力は止まります。破線は、連結棒と出力の棒の間の伝達角です。0° や 180° に近いと、連結棒は、棒を横切る向きではなく、棒に沿う向きに押すので、機構は動かなくなります。金色の点をドラッグしてください。`));
      st.g2.replaceChildren(); const x0 = deg(run.lo), x1 = deg(run.hi), out = [], tr = []; let prev = null, off = 0; for (const o of cc.pts) { const q = solve(a, b, c, d, o.th); let ph = deg(q.phi); if (prev !== null) { while (ph + off - prev > 180) off -= 360; while (ph + off - prev < -180) off += 360; } prev = ph + off; out.push([deg(o.th), prev]); tr.push([deg(o.th), deg(q.mu)]); }
      const ys = out.map((o) => o[1]), ylo = Math.min(0, ...ys) - 10, yhi = Math.max(180, ...ys) + 10, g = L.fig(st.g2, { x: [x0, x1], y: [ylo, yhi], aspect: 0.8, maxH: 400, xlabel: T('angle of the input bar (degrees)', '入力の棒の角度（度）'), ylabel: T('angle (degrees)', '角度（度）') });
      g.line(tr, { c: 'muted', w: 1.6, dash: '5 4' }); g.line(out, { c: 'c1', w: 2.8 }); let phNow = deg(s.phi); { const near = out.reduce((bst, o) => (Math.abs(o[0] - deg(th)) < Math.abs(bst[0] - deg(th)) ? o : bst), out[0]); phNow = near[1]; }
      g.handle(deg(th), phNow, { c: 'hl', axis: 'x', bounds: [x0, x1, ylo, yhi], label: T('input', '入力'), onDrag: (x) => ctx.set('th', clamp(Math.round(run.full ? x : ((x - x0) / (x1 - x0)) * 360), 0, 360)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('angle of the output bar', '出力の棒の角度') }, { c: 'muted', dash: true, label: T('transmission angle', '伝達角') }, { c: 'c2', label: T('path of the coupler point', '連結棒の上の点の経路') }]);
      const mus = tr.map((o) => o[1]), swing = Math.max(...ys) - Math.min(...ys);
      ctx.readout([
        { k: T('shortest + longest; the other two', '最短と最長の和、ほかの 2 本の和'), v: tx`\(${fmt(Math.min(a, b, c, d) + Math.max(a, b, c, d), 0)},\ ${fmt(a + b + c + d - Math.min(a, b, c, d) - Math.max(a, b, c, d), 0)}\ \mathrm{mm}\)` },
        { k: T('type', '種類'), v: T(TYPES[G.type][0], TYPES[G.type][1]), tone: 'key' },
        { k: T('input can move through', '入力が動ける範囲'), v: tx`\(${fmt(run.full ? 360 : x1 - x0, 0)}^\circ\)` },
        { k: T('output swings through', '出力が揺動する範囲'), v: tx`\(${fmt(Math.min(360, swing), 0)}^\circ\)` },
        { k: T('transmission angle now; its range', '現在の伝達角、その範囲'), v: tx`\(${fmt(deg(s.mu), 0)}^\circ;\ ${fmt(Math.min(...mus), 0)}^\circ\text{–}${fmt(Math.max(...mus), 0)}^\circ\)`, tone: Math.min(...mus) < 30 || Math.max(...mus) > 150 ? 'warn' : 'good' },
      ], T(G.ok ? 'Shortest plus longest is no more than the other two together, so the shortest bar can turn all the way round relative to its neighbours. Which bar is shortest decides the kind of motion.' : 'Shortest plus longest exceeds the other two together. No bar can make a full turn: the linkage only rocks between two limits.', G.ok ? '最短と最長の和が、ほかの 2 本の和以下なので、最短の棒は、隣の棒に対して一回転できます。どの棒が最短かによって、運動の種類が決まります。' : '最短と最長の和が、ほかの 2 本の和を超えています。どの棒も一回転できず、機構は二つの限界の間で揺動するだけです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.0 : 0.85, maxH: 540, camera: [3, -14.5, 18.5], target: [3, 1.6, 0], fov: 30,
        label: T('3D four-bar linkage of steel bars on a plate. Drag to rotate.', '基板の上にある、鋼の棒でできた 4 節リンク機構の 3D 表示。ドラッグで回転できます。'),
        init(S) { st.flat = false; st.bars = buildBars(S); const q = st.q; st.bars.set(q.a, q.b, q.c, q.d, q.p, q.q, q.th, q.pts); },
        update(S) { const q = st.q; st.bars.set(q.a, q.b, q.c, q.d, q.p, q.q, q.th, q.pts); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-a - 20, d + c + 20], y: [-Math.max(a, c) - 10, Math.max(a, c) + b * 0.6], equal: true, maxH: 320, axes: false, grid: false }); f2.line(cc.pts.map((o) => o.P), { c: 'c2', w: 1.6 }); f2.seg([0, 0], s.A, { c: 'c2', w: 4 }); f2.seg(s.A, s.B, { c: 'c1', w: 4 }); f2.seg([d, 0], s.B, { c: 'ink', w: 4 }); f2.dot(P[0], P[1], { c: 'hl', r: 5 }); },
      });
    },
  };

  /* ================= 2. straight lines from circles ================= */
  D['straight-line'] = {
    render(ctx, v) {
      const m = SL[v.kind], cc = couplerCurve(m, 720), run = cc.run, th = run.lo + (run.hi - run.lo) * (v.pos / 100), s = solve(m.a, m.b, m.c, m.d, th, m.br || 1), P = couplerPoint(s, m.p, m.q), best = straightest(m);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`${m.en}’s linkage. Every pin moves on a circle, yet the gold point on the coupler traces the red path, part of which (bold) is very nearly straight. ${['Watt used it in 1784 to guide the piston rod of his steam engine, and it still locates the rear axle of many cars.', 'Chebyshev found these proportions in the 1850s by asking which curve departs least from a line.', 'In this arrangement the crank turns fully, and the straight part is traversed at nearly constant speed during half of each turn.'][v.kind]} Drag the gold point.`, tx`${m.ja}のリンク機構です。どのピンも円の上を動きますが、連結棒の上の金色の点は赤い経路を描き、その一部（太線）は、ほぼ直線です。${['ワットは、1784 年に、蒸気機関のピストン棒を導くためにこれを使いました。今でも、多くの自動車の後ろの車軸を位置決めしています。', 'チェビシェフは、1850 年代に、どの曲線が直線から最も外れないかを問うことで、この比率を見つけました。', 'この配置では、クランクは一回転し、直線の部分は、1 回転の半分の間に、ほぼ一定の速さで通過されます。'][v.kind]}金色の点をドラッグしてください。`));
      const xs = cc.pts.map((o) => o.P[0]).concat([0, m.d, s.A[0], s.B[0]]), ys = cc.pts.map((o) => o.P[1]).concat([0, -m.a, m.a, m.c]), pad = 0.4, a = L.fig(c1, { x: [Math.min(...xs, -m.a) - pad, Math.max(...xs, m.d + (v.kind ? 0 : 0)) + pad], y: [Math.min(...ys) - pad, Math.max(...ys) + pad], equal: true, maxH: 380, axes: false, grid: false });
      a.line(cc.pts.map((o) => o.P), { c: 'c2', w: 1.6 }); { const seg = []; const n = cc.pts.length; for (let k = 0; k <= best.w; k++) seg.push(cc.pts[best.closed ? (best.i + k) % (n - 1) : best.i + k].P); a.line(seg, { c: 'c2', w: 4 }); }
      a.seg([0, 0], s.A, { c: 'ink', w: 3.2 }); a.seg([m.d, 0], s.B, { c: 'ink', w: 3.2 }); a.seg(s.A, s.B, { c: 'c1', w: 3.2 }); if (m.p > m.b) a.seg(s.B, P, { c: 'c1', w: 3.2 });
      for (const q of [[0, 0], [m.d, 0]]) { a.poly([[q[0] - 0.22, q[1] - 0.3], [q[0] + 0.22, q[1] - 0.3], [q[0], q[1]]], { c: 'muted', fill: 'muted', opacity: 0.6 }); a.dot(q[0], q[1], { c: 'ink', r: 4 }); } a.dot(s.A[0], s.A[1], { c: 'ink', r: 3.5 }); a.dot(s.B[0], s.B[1], { c: 'ink', r: 3.5 });
      a.handle(P[0], P[1], { c: 'hl', bounds: [-99, 99, -99, 99], label: T('traced point', '経路を描く点'), onDrag: (x, y) => { let bi = 0, bd = 1e9; cc.pts.forEach((o, i) => { const dd = (o.P[0] - x) ** 2 + (o.P[1] - y) ** 2; if (dd < bd) { bd = dd; bi = i; } }); ctx.set('pos', Math.round((bi / (cc.pts.length - 1)) * 200) / 2); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the bold stretch departs from the straight line between its ends, magnified, against distance along it. Each of these linkages touches the true line at several points and bulges between them. None is exact. An exact straight line from pinned bars needs eight of them, and was not found until Peaucellier’s linkage of 1864.`, tx`太線の部分が、その両端を結ぶ直線からどれだけ外れるかを、拡大して、線に沿った距離に対して描いています。これらのリンク機構はどれも、本当の直線に数か所で接し、その間で膨らみます。正確なものは一つもありません。ピンでつないだ棒で正確な直線を描くには、8 本の棒が必要で、1864 年のポースリエのリンク機構まで見つかりませんでした。`));
      const dv = [], n = cc.pts.length, ex = (best.p1[0] - best.p0[0]) / best.chord, ey = (best.p1[1] - best.p0[1]) / best.chord; for (let k = 0; k <= best.w; k++) { const q = cc.pts[best.closed ? (best.i + k) % (n - 1) : best.i + k].P, along = (q[0] - best.p0[0]) * ex + (q[1] - best.p0[1]) * ey, off = -(q[0] - best.p0[0]) * ey + (q[1] - best.p0[1]) * ex; dv.push([(along / best.chord) * 100, (off / best.chord) * 1000]); }
      const dm = Math.max(0.5, ...dv.map((o) => Math.abs(o[1]))) * 1.2, b = L.fig(c2, { x: [0, 100], y: [-dm, dm], aspect: 0.7, maxH: 350, xlabel: T('along the stroke (%)', 'ストロークに沿った位置（%）'), ylabel: T('off the line (thousandths of the stroke)', '直線からのずれ（ストロークの 1000 分の 1）') });
      b.hline(0, { c: 'muted', w: 1 }); b.line(dv, { c: 'c2', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c2', label: T('path of the point; its straightest third', '点の経路、最もまっすぐな 3 分の 1') }, { c: 'c1', label: T('coupler', '連結棒') }, { c: 'ink', label: T('bars on fixed pivots', '固定された支点を持つ棒') }]);
      ctx.readout([
        { k: T('bars: driven, coupler, follower, base', '棒：駆動、連結棒、従動、基礎'), v: tx`\(${fmt(m.a, 2)},\ ${fmt(m.b, 2)},\ ${fmt(m.c, 2)},\ ${fmt(m.d, 2)}\)` },
        { k: T('length of the straight stretch', '直線の部分の長さ'), v: tx`\(${fmt(best.chord, 2)}\)` },
        { k: T('greatest departure from the line', '直線からの最大のずれ'), v: tx`\(${fmt(best.dev, 4)}\)` },
        { k: T('that is one part in', 'ずれは、ストロークの'), v: tx`\(${fmt(1 / best.ratio, 0)}\)`, tone: 'key' },
      ], T('Before machine tools could cut an accurate flat slide, a linkage was the only way to make a machine part move in a line. Watt called his the invention he was proudest of.', '工作機械が正確な平らな案内面を削れるようになる前は、機械の部品を直線の上で動かす方法は、リンク機構しかありませんでした。ワットは、自分のリンク機構を、最も誇りに思う発明と呼びました。'));
    },
  };

  /* ================= 3. cams ================= */
  D['cam-follower'] = {
    render(ctx, v) {
      const law = v.law, f = LAWS[law], h = v.h, be = v.beta, Rb = 20, now = cam(v.th, h, be, law), om = (2 * PI * v.rpm) / 60, pa = peakAccel(h, be, law, v.rpm), pv = peakSpeed(h, be, law, v.rpm);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A plate cam on a shaft, with a follower resting on its edge. The dashed circle is the base circle, of radius 20 mm; wherever the edge stands outside it, the follower is lifted by that amount. This cam lifts \(${fmt(h, 1)}\) mm over \(${fmt(be, 0)}\)° of turning, holds, lowers over the same angle, and rests. Any motion that can be drawn as a graph can be cut as a cam. Drag the gold point to turn it.`, tx`軸に取り付けた板カムと、その縁に載っている従動節です。破線の円は、半径 20 mm の基礎円です。縁がその外側にあるところでは、従動節は、その分だけ持ち上げられます。このカムは、\(${fmt(be, 0)}\)° 回る間に \(${fmt(h, 1)}\) mm 持ち上げ、保持し、同じ角度で下ろし、休みます。グラフに描ける運動は、どれもカムとして削り出せます。金色の点をドラッグして、カムを回してください。`));
      const R = Rb + h + 6, a = L.fig(c1, { x: [-R, R], y: [-R, R + 22], equal: true, maxH: 380, axes: false, grid: false }), rot = rad(90 - v.th), out = [], base = [];
      for (let i = 0; i <= 360; i++) { const r = Rb + cam(i, h, be, law).s, an = rad(i) + rot; out.push([r * Math.cos(an), r * Math.sin(an)]); base.push([Rb * Math.cos(an), Rb * Math.sin(an)]); }
      a.poly(out, { c: 'ink', fill: 'c1', opacity: 0.3, w: 2.2 }); a.line(base, { c: 'muted', w: 1.2, dash: '4 3' }); a.circle(0, 0, 3.2, { c: 'ink', fill: 'muted', opacity: 0.8 }); a.seg([0, 0], [8 * Math.cos(rot), 8 * Math.sin(rot)], { c: 'ink', w: 1.4 });
      const top = Rb + now.s; a.rect(-9, top, 18, 3, { c: 'ink', fill: 'c2', opacity: 0.7 }); a.rect(-2.2, top + 3, 4.4, 17, { c: 'ink', fill: 'c2', opacity: 0.45 }); a.rect(-7, Rb + h + 9, 4, 9, { c: 'muted', fill: 'muted', opacity: 0.5 }); a.rect(3, Rb + h + 9, 4, 9, { c: 'muted', fill: 'muted', opacity: 0.5 });
      a.handle((Rb + h + 3) * Math.cos(rot), (Rb + h + 3) * Math.sin(rot), { c: 'hl', bounds: [-R, R, -R, R], label: T('turn the cam', 'カムを回す'), onDrag: (x, y) => ctx.set('th', Math.round(((90 - deg(Math.atan2(y, x))) % 360 + 360) % 360)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Lift, speed and acceleration of the follower through one turn, each scaled to its own greatest value. The lift curves of the three laws look almost alike. Their accelerations do not. Simple harmonic motion starts and stops with a jump in acceleration, a hammer blow at each end; constant acceleration has the lowest peak but three jumps; cycloidal motion alone starts from zero, at the price of the highest peak.`, tx`1 回転の間の従動節の変位、速さ、加速度を、それぞれの最大値を 1 として描いています。三つの法則の変位の曲線は、ほとんど同じに見えます。加速度は違います。単弦運動は、加速度の跳びで始まり、跳びで終わります。両端でハンマーで打つような衝撃です。等加速度運動は、ピークが最も低いものの、跳びが 3 回あります。サイクロイド運動だけがゼロから始まりますが、その代わり、ピークは最も高くなります。`));
      const b = L.fig(c2, { x: [0, 360], y: [-1.15, 1.15], aspect: 0.7, maxH: 350, xlabel: T('angle of the cam (degrees)', 'カムの角度（度）'), ylabel: T('scaled to the greatest value', '最大値を 1 とした値'), ticksX: [[0, '0'], [90, '90'], [180, '180'], [270, '270'], [360, '360']] });
      const vm = ([PI / 2, 2, 2][law] * h) / rad(be), am = (f.peak * h) / rad(be) ** 2; b.hline(0, { c: 'muted', w: 1 }); b.line(L.sample(0, 360, 720, (q) => cam(q, h, be, law).a / am), { c: 'c2', w: 2 }); b.line(L.sample(0, 360, 720, (q) => cam(q, h, be, law).v / vm), { c: 'c3', w: 2 }); b.line(L.sample(0, 360, 720, (q) => cam(q, h, be, law).s / h), { c: 'c1', w: 2.8 }); b.vline(v.th, { c: 'hl', w: 1.6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('lift', '変位') }, { c: 'c3', label: T('speed', '速さ') }, { c: 'c2', label: T('acceleration', '加速度') }]);
      ctx.readout([
        { k: T('lift now', '現在の変位'), v: tx`\(${fmt(now.s, 2)}\ \mathrm{mm}\)` },
        { k: T('greatest speed of the follower', '従動節の最大の速さ'), v: tx`\(${fmt(pv, 2)}\ \mathrm{m/s}\)` },
        { k: T('greatest acceleration', '最大の加速度'), v: tx`\(${fmt(pa, 0)}\ \mathrm{m/s^2}\ (${fmt(pa / 9.81, pa / 9.81 < 10 ? 1 : 0)}\,g)\)`, tone: 'key' },
        { k: T('force on a 100 g follower', '100 g の従動節にかかる力'), v: tx`\(${fmt(pa * 0.1, pa * 0.1 < 10 ? 1 : 0)}\ \mathrm{N}\)` },
        { k: T('acceleration at the start of the rise', '上昇の始まりでの加速度'), v: law === 1 ? T('zero: no shock', 'ゼロ：衝撃なし') : T('jumps at once to the peak', 'いきなりピークに跳ぶ'), tone: law === 1 ? 'good' : 'warn' },
      ], T('Acceleration grows as the square of the shaft speed, and on the downward half it is the spring, not the cam, that must supply it. When the spring cannot, the follower leaves the cam: valve float in an engine.', '加速度は、軸の回転数の 2 乗に比例して大きくなります。下向きの半分では、加速度を与えるのは、カムではなく、ばねです。ばねが足りないと、従動節はカムから離れます。エンジンでは、これがバルブの踊りです。'));
    },
  };
})();
