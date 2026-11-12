'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180;

  /* ---------------- models (no DOM) ----------------
   * Steps are fixed to an endless chain every PITCH = 0.4 m. On a slope theta each step sits PITCH sin(theta) above
   * the last (the riser) and PITCH cos(theta) further on (the exposed tread).
   * Each step has a chain wheel and a trailing wheel set b behind and c below it. For the tread to stay level the
   * trailing wheel needs its own track, the chain track shifted by (-b, -c); measured square to the slope the two
   * tracks are c cos(theta) - b sin(theta) apart.
   * Chain path: flat, an arc of radius R up to theta, a straight, an arc back to level, flat; then round a wheel
   * and back underneath.
   * Capacity: v / PITCH steps a second, k people on each. Power: mass flow x g x rise / efficiency, plus idling.
   */
  const PITCH = 0.4, HALF = 0.375;
  const riser = (thetaDeg) => PITCH * Math.sin(rad(thetaDeg));
  const going = (thetaDeg) => PITCH * Math.cos(rad(thetaDeg));
  const trackGap = (b, c, thetaDeg) => c * Math.cos(rad(thetaDeg)) - b * Math.sin(rad(thetaDeg));
  function chainPath(thetaDeg, H = 3, R = 1.5, L1 = 2.6, L2 = 2.0, ds = 0.02) { const th = rad(thetaDeg), Ls = (H - 2 * R * (1 - Math.cos(th))) / Math.sin(th), segs = [[L1, 0], [R * th, 1 / R], [Ls, 0], [R * th, -1 / R], [L2, 0]], pts = []; let x = -L1, z = 0, a = 0, s = 0; pts.push({ x, z, a, s });
    for (const [len, k] of segs) { const n = Math.max(1, Math.round(len / ds)), h = len / n; for (let i = 0; i < n; i++) { const am = a + (k * h) / 2; x += Math.cos(am) * h; z += Math.sin(am) * h; a += k * h; s += h; pts.push({ x, z, a, s }); } }
    const top = pts[pts.length - 1], Lup = top.s, Lsemi = PI * HALF, total = 2 * Lup + 2 * Lsemi;
    const at = (q) => { q = ((q % total) + total) % total; if (q <= Lup) { const i = Math.min(pts.length - 2, Math.floor((q / Lup) * (pts.length - 1))), p0 = pts[i], p1 = pts[i + 1], u = (q - p0.s) / (p1.s - p0.s || 1); return { x: p0.x + (p1.x - p0.x) * u, z: p0.z + (p1.z - p0.z) * u, tan: p0.a + (p1.a - p0.a) * u, ang: 0, zone: 0 }; }
      if (q <= Lup + Lsemi) { const u = (q - Lup) / Lsemi, b = PI / 2 - u * PI; return { x: top.x + HALF * Math.cos(b), z: top.z - HALF + HALF * Math.sin(b), tan: -u * PI, ang: -u * PI, zone: 1 }; }
      if (q <= 2 * Lup + Lsemi) { const r = at(2 * Lup + Lsemi - q); return { x: r.x, z: r.z - 2 * HALF, tan: r.tan + PI, ang: -PI + r.tan, zone: 2, slope: r.tan }; }
      const u = (q - 2 * Lup - Lsemi) / Lsemi, b = -PI / 2 - u * PI; return { x: pts[0].x + HALF * Math.cos(b), z: pts[0].z - HALF + HALF * Math.sin(b), tan: -PI - u * PI, ang: -PI - u * PI, zone: 3 }; };
    return { pts, Lup, total, at, top, Ls }; }
  const capacity = (v, k, fill = 1) => (v / PITCH) * k * 3600 * fill;                                  // people per hour
  const liftPower = (perHour, H, eta = 0.8) => ((perHour / 3600) * 75 * G * H) / eta;                  // W
  const idlePower = (H) => 600 + 300 * H;
  const rideTime = (H, v, thetaDeg) => H / (v * Math.sin(rad(thetaDeg)));
  const M = { PITCH, riser, going, trackGap, chainPath, capacity, liftPower, idlePower, rideTime };
  (window.LabModels = window.LabModels || {}).escalators = M;

  /* ================= 1. the loop of steps (3D) ================= */
  function buildEsc(S, thetaDeg) {
    const TH = S.THREE, g = new TH.Group(), path = chainPath(thetaDeg);                                // 1 unit = 1 m; travel toward +x and up
    const alu = S.mat('#b9bec5', { metal: 1, rough: 0.4 }), dark = S.mat('#2a2c30', { metal: 0.6, rough: 0.55 }), glass = S.mat('#cfe2ec', { rough: 0.05, coat: 1, opacity: 0.2, side: 2 }), rubber = S.mat('#17181a', { rough: 0.7 }), yellow = S.mat('#e2b400', { rough: 0.6 }), floor = S.mat('#8f8c86', { rough: 0.9, coat: 0 }), green = S.mat('#3a8a5c', { metal: 0.6, rough: 0.45 }), cloth = [S.mat('#3f6fb5', { rough: 0.9, coat: 0 }), S.mat('#b8432a', { rough: 0.9, coat: 0 }), S.mat('#7a6a55', { rough: 0.9, coat: 0 })];
    const prof = [[-0.2, 0.12], [0.2, 0.12], [0.2, 0.08], [-0.16, -0.15], [-0.2, -0.15]];
    const stepGeo = new TH.ExtrudeGeometry(new TH.Shape(prof.map((q) => new TH.Vector2(q[0], q[1]))), { depth: 1.0, bevelEnabled: false }).rotateX(PI / 2).translate(0, 0.5, 0);
    const n = Math.round(path.total / PITCH), steps = [];
    for (let i = 0; i < n; i++) { const s = new TH.Group(), body = new TH.Mesh(stepGeo, alu); body.castShadow = true; s.add(body); const edge = new TH.Mesh(new TH.BoxGeometry(0.03, 1.0, 0.012), yellow); edge.position.set(-0.185, 0, 0.125); s.add(edge); for (const y of [-0.56, 0.56]) { const w1 = new TH.Mesh(new TH.CylinderGeometry(0.05, 0.05, 0.05, 14), dark); w1.position.set(0, y, 0); s.add(w1); const w2 = new TH.Mesh(new TH.CylinderGeometry(0.04, 0.04, 0.05, 14), yellow); w2.position.set(-0.2, y, -0.2); s.add(w2); } g.add(s); steps.push(s); }
    const riders = [3, 9, 16].map((k, i) => { const p = new TH.Group(), b = new TH.Mesh(new TH.CapsuleGeometry(0.15, 0.8, 4, 10).rotateX(PI / 2), cloth[i]), h = new TH.Mesh(new TH.SphereGeometry(0.12, 12, 10), S.mat('#d9b48f', { rough: 0.8 })); b.position.z = 0.67; h.position.z = 1.4; p.add(b, h); g.add(p); return { p, k }; });
    // balustrades: glass ribbons and handrails along the passenger run; a skirt on the far side only
    const ribbon = (y, z0, z1, mat) => { const P = path.pts, geo = new TH.BufferGeometry(), pos = [], idx = []; P.forEach((q, i) => { pos.push(q.x, y, q.z + z0, q.x, y, q.z + z1); if (i < P.length - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }); geo.setAttribute('position', new TH.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new TH.Mesh(geo, mat); g.add(m); return m; };
    for (const y of [-0.62, 0.62]) { ribbon(y, 0.15, 1.05, glass); const hr = S.tube(path.pts.filter((q, i) => i % 4 === 0).map((q) => [q.x, y, q.z + 1.08]), { r: 0.04, add: false, radial: 8, segments: 160 }); hr.material = rubber; g.add(hr); } ribbon(0.66, -1.0, 0.15, dark);
    // landings, drive wheels and motor
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    box(2.2, 2.6, 0.08, path.pts[0].x - 0.75, 0, 0.1, floor); box(2.2, 2.6, 0.08, path.top.x + 0.75, 0, path.top.z + 0.1, floor);
    const wheels = [[path.top.x, path.top.z - HALF], [path.pts[0].x, path.pts[0].z - HALF]].map(([x, z]) => { const w = new TH.Group(); for (const y of [-0.56, 0.56]) { const d = new TH.Mesh(new TH.CylinderGeometry(HALF - 0.05, HALF - 0.05, 0.04, 36), alu); d.position.y = y; w.add(d); for (let k = 0; k < 3; k++) { const sp = new TH.Mesh(new TH.BoxGeometry(0.62, 0.05, 0.05), dark); sp.position.y = y; sp.rotation.y = (k / 3) * PI; w.add(sp); } } w.position.set(x, 0, z); g.add(w); return w; });
    box(0.5, 0.5, 0.45, path.top.x + 0.3, 0.2, path.top.z - 1.05, green);
    const tracks = S.lines([], { c: 'c2', opacity: 0.9, w: 1.6 }), chain = S.lines([], { c: 'ink', opacity: 0.8, w: 1.4 });
    { const a = [], b = []; for (let q = 0; q < path.total; q += 0.08) { const p0 = path.at(q), p1 = path.at(q + 0.08); a.push([[p0.x, -0.56, p0.z], [p1.x, -0.56, p1.z]]); if (p0.zone === 0 && p1.zone === 0) b.push([[p0.x - 0.2, -0.56, p0.z - 0.2], [p1.x - 0.2, -0.56, p1.z - 0.2]]); } chain.update(a); tracks.update(b); }
    S.add(g);
    return { g, path, steps, riders, wheels };
  }
  D['escalator-loop'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (st.thBuilt !== undefined && st.thBuilt !== v.th) st.frame = null; st.thBuilt = v.th;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const path = chainPath(v.th), nst = Math.round(path.total / PITCH); st.p = v;
      L.setText(st.cap1, T(tx`An escalator with its near skirt removed. The steps are fixed at equal spacing to an endless chain (black line) that runs up the slope, round a driven wheel at the top, back down underneath and round an idle wheel at the bottom. On the way up every tread stays level; underneath, the steps hang upside down. At each end the steps sink to the same height and slide under a comb in the floor as one flat belt.`, tx`手前のスカートを取り外した、エスカレーターです。踏段は、等間隔で、輪になった鎖（黒い線）に固定されています。鎖は斜面を上がり、上端で駆動される車を回り、下を通って戻り、下端で従動の車を回ります。上りの間、踏面は常に水平です。下では、踏段は逆さまにつり下がっています。両端では、踏段が同じ高さに沈み、一枚の平らな帯として、床のくしの下に滑り込みます。`));
      L.setText(st.cap2, T(tx`Height of each step above the one before it, along the passenger run. The chain bends through an arc from level to \(${fmt(v.th, 0)}\)°, so the risers grow gradually from nothing to \(${fmt(riser(v.th) * 1000, 0)}\) mm and shrink again at the top. Drag the gold point to change the slope.`, tx`乗客が乗る区間に沿った、一つ前の踏段との高さの差です。鎖は、水平から \(${fmt(v.th, 0)}\)° まで弧を描いて曲がるので、蹴上げはゼロから \(${fmt(riser(v.th) * 1000, 0)}\) mm まで徐々に大きくなり、上端で再び小さくなります。金色の点をドラッグして、傾きを変えてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, path.Lup], y: [0, 260], aspect: 0.8, maxH: 400, xlabel: T('distance along the chain (m)', '鎖に沿った距離（m）'), ylabel: T('riser (mm)', '蹴上げ（mm）') });
      g.hline(240, { c: 'muted', dash: '5 4' }); g.line(path.pts.map((q) => [q.s, PITCH * Math.sin(q.a) * 1000]), { c: 'c1', w: 2.8 });
      g.handle(path.Lup / 2, riser(v.th) * 1000, { c: 'hl', axis: 'y', bounds: [0, path.Lup, PITCH * Math.sin(rad(20)) * 1000, PITCH * Math.sin(rad(35)) * 1000], label: T('slope', '傾き'), onDrag: (x, y) => ctx.set('th', clamp(Math.round((Math.asin(clamp(y / 1000 / PITCH, 0, 1)) * 180) / PI), 20, 35)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('riser along the run', '区間に沿った蹴上げ') }, { c: 'muted', dash: true, label: T('largest riser the standards allow', '規格で認められる最大の蹴上げ') }]);
      ctx.readout([
        { k: T('riser on the slope', '斜面での蹴上げ'), v: tx`\(${fmt(riser(v.th) * 1000, 0)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('tread showing on the slope', '斜面で見える踏面の奥行き'), v: tx`\(${fmt(going(v.th) * 1000, 0)}\ \mathrm{mm}\ \text{${T('of', '（全体は')}}\ 400${T('', '）')}\)` },
        { k: T('steps in the loop', '輪の中の踏段の数'), v: tx`\(${nst}\)` },
        { k: T('steps carrying passengers at once', '同時に乗客を運べる踏段の数'), v: tx`\(${Math.round(path.Lup / PITCH)}\)` },
        { k: T('a step goes round the loop in', '踏段が輪を一周する時間'), v: tx`\(${fmt(path.total / v.v, 0)}\ \mathrm{s}\)` },
        { k: T('ride from floor to floor', '床から床まで乗っている時間'), v: tx`\(${fmt(path.Lup / v.v, 0)}\ \mathrm{s}\)` },
      ], T('More than half the steps are out of sight at any moment, coming back underneath. An escalator is a conveyor belt whose surface happens to fold into stairs.', 'どの瞬間にも、踏段の半分以上は見えないところにあり、下を通って戻っています。エスカレーターは、表面がたまたま階段に折りたたまれるベルトコンベヤーです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.8, maxH: 540, camera: [-3, -24, 9.5], target: [2.7, 0, 1.3], fov: 30,
        label: T('3D escalator with its loop of steps exposed. Drag to rotate.', '踏段の輪が見えるエスカレーターの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.th = st.p.th; st.es = buildEsc(S, st.th); st.s = 0; st.S = S;
          const draw = (dt) => { const m = st.es, P = m.path; st.s = (st.s + dt * st.p.v * 1.0) % P.total; const n = m.steps.length;
            m.steps.forEach((sp, i) => { const q = P.at(st.s + (i / n) * P.total), ang = q.zone === 2 ? -PI + (q.slope || 0) : q.ang; sp.position.set(q.x, 0, q.z); sp.rotation.y = -ang; });
            m.riders.forEach((r) => { const q = P.at(st.s + (r.k / n) * P.total); r.p.visible = q.zone === 0; r.p.position.set(q.x, 0, q.z + 0.12); }); m.wheels.forEach((w) => { w.rotation.y = st.s / HALF; }); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-3.5, 9], y: [-1.5, 5], equal: true, maxH: 300, axes: false, grid: false }); f2.line(path.pts.map((q) => [q.x, q.z]), { c: 'ink', w: 2.4 }); f2.line(path.pts.map((q) => [q.x, q.z - 0.75]), { c: 'muted', w: 1.6 }); },
      });
    },
  };

  /* ================= 2. two tracks keep the treads level ================= */
  D['two-tracks'] = {
    render(ctx, v) {
      const path = chainPath(v.th, 3, 1.5, 1.6, 1.2), gapS = trackGap(v.b / 1000, v.c / 1000, v.th), b = v.b / 1000, c = v.c / 1000, s0 = clamp(v.pos, 0, 1) * (path.Lup - 1.2) + 0.6;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Side view of the bottom of the passenger run. Each step rides on two pairs of wheels: one pair on the chain (blue track) and a trailing pair set \(${fmt(v.b, 0)}\) mm behind and \(${fmt(v.c, 0)}\) mm lower (red track). A tread stays level only if both wheels rise by the same amount at the same moment, so the red track is an exact copy of the blue one, moved back and down by those two distances. Drag the gold point to move the steps.`, tx`乗客が乗る区間の下端を、横から見た図です。それぞれの踏段は、二組の車輪に載っています。一組は鎖の上（青い軌道）にあり、もう一組は、\(${fmt(v.b, 0)}\) mm 後ろ、\(${fmt(v.c, 0)}\) mm 下にあります（赤い軌道）。踏面が水平を保つのは、両方の車輪が同時に同じだけ上がるときだけです。そのため、赤い軌道は、青い軌道をその二つの距離だけ後ろと下にずらした、正確な写しです。金色の点をドラッグして、踏段を動かしてください。`));
      const a = L.fig(c1, { x: [-1.7, 3.3], y: [-0.7, 2.6], equal: true, aspect: 0.66, maxH: 350, xlabel: T('along the floor (m)', '床に沿った距離（m）'), ylabel: T('height (m)', '高さ（m）') });
      a.line(path.pts.map((q) => [q.x, q.z]), { c: 'c1', w: 2 }); a.line(path.pts.map((q) => [q.x - b, q.z - c]), { c: 'c2', w: 2 });
      for (let k = -3; k <= 4; k++) { const q = path.at(clamp(s0 + k * PITCH, 0, path.Lup)); a.poly([[q.x - 0.32, q.z + 0.12], [q.x + 0.08, q.z + 0.12], [q.x + 0.08, q.z + 0.08], [q.x - 0.28, q.z - c - 0.02], [q.x - 0.32, q.z - c - 0.02]], { c: 'ink', fill: 'grid', fo: 0.55, w: 1.2 }); a.dot(q.x, q.z, { c: 'c1', r: 3.5 }); a.dot(q.x - b, q.z - c, { c: 'c2', r: 3.5 }); }
      { const q = path.at(s0); a.handle(q.x - 0.12, q.z + 0.12, { c: 'hl', bounds: [-1.7, 3.3, -0.7, 2.6], label: T('position of the steps', '踏段の位置'), onDrag: (x) => { let bi = 0, bd = 1e9; path.pts.forEach((p2, i) => { const d = Math.abs(p2.x - 0.12 - x); if (d < bd) { bd = d; bi = i; } }); ctx.set('pos', clamp(Math.round(((path.pts[bi].s - 0.6) / (path.Lup - 1.2)) * 50) / 50, 0, 1)); } }); }
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Distance between the two tracks, measured square to the chain, along the run. On the level they are \(${fmt(v.c, 0)}\) mm apart, one above the other. On the slope the offset backward works against the offset downward and they close to \(${fmt(gapS * 1000, 0)}\) mm. Where the curve reaches zero the tracks cross.`, tx`二つの軌道の間隔を、鎖に直角な向きに測り、区間に沿って描いています。水平な部分では、一方がもう一方の真下に \(${fmt(v.c, 0)}\) mm 離れています。斜面では、後ろへのずれが下へのずれを打ち消す向きに働き、間隔は \(${fmt(gapS * 1000, 0)}\) mm まで縮まります。曲線がゼロに達するところで、軌道は交差します。`));
      const f = L.fig(c2, { x: [0, path.Lup], y: [-120, Math.max(200, v.c * 1.15)], aspect: 0.66, maxH: 350, xlabel: T('distance along the chain (m)', '鎖に沿った距離（m）'), ylabel: T('gap between tracks (mm)', '軌道の間隔（mm）') });
      f.hline(0, { c: 'muted' }); f.line(path.pts.map((q) => [q.s, (c * Math.cos(q.a) - b * Math.sin(q.a)) * 1000]), { c: 'c3', w: 2.8 }); f.vline(s0, { c: 'muted', dash: '4 3' });
      L.legend(ctx.host, [{ c: 'c1', label: T('track of the chain wheels', '鎖の車輪の軌道') }, { c: 'c2', label: T('track of the trailing wheels', '後ろの車輪の軌道') }, { c: 'c3', label: T('gap between them', '二つの間隔') }]);
      ctx.readout([
        { k: T('gap on the level', '水平な部分での間隔'), v: tx`\(${fmt(v.c, 0)}\ \mathrm{mm}\)` },
        { k: T('gap on the slope', '斜面での間隔'), v: tx`\(${fmt(gapS * 1000, 0)}\ \mathrm{mm}\)`, tone: 'key' },
        { k: T('tracks would cross at a slope of', '軌道が交差する傾き'), v: tx`\(${fmt((Math.atan(c / b) * 180) / PI, 1)}^\circ\)`, tone: gapS < 0 ? 'warn' : 'good' },
        { k: T('riser on the slope', '斜面での蹴上げ'), v: tx`\(${fmt(riser(v.th) * 1000, 0)}\ \mathrm{mm}\)` },
      ], T(gapS < 0 ? 'The trailing track has passed through the chain track. It can be built, with the two tracks side by side at different widths, but the wheels now carry the step from the opposite side.' : 'With one track the steps would tilt with the slope, like the links of a bicycle chain. The second track, never parallel to the first, is the whole invention.', gapS < 0 ? '後ろの軌道が、鎖の軌道を通り抜けています。二つの軌道を幅の違う位置に並べれば作れますが、車輪は、踏段を反対側から支えることになります。' : '軌道が一つなら、踏段は、自転車のチェーンのこまのように、斜面とともに傾きます。一つ目と決して平行にならない二つ目の軌道こそが、発明のすべてです。'));
    },
  };

  /* ================= 3. how many people, how much power ================= */
  D['escalator-capacity'] = {
    render(ctx, v) {
      const k = [1, 1.5, 2][v.w], cap = capacity(v.v, k), real = capacity(v.v, k, v.fill / 100), Pl = liftPower(real, v.H), Pi = idlePower(v.H), t = rideTime(v.H, v.v, 30), onb = (real / 3600) * t;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`People carried an hour against the speed of the steps, for three widths of step that hold one, one and a half and two people. A step passes every \(${fmt((PITCH / v.v) * 1000, 0)}\) ms, so the count is simply steps a second times people a step. The dashed line is what is carried in practice, with \(${fmt(v.fill, 0)}\) per cent of the places taken. Drag the gold point.`, tx`1 時間に運べる人数を、踏段の速さに対して描いています。1 人、1.5 人、2 人が乗れる、三通りの幅の踏段です。踏段は \(${fmt((PITCH / v.v) * 1000, 0)}\) ms ごとに通過するので、人数は、毎秒の踏段の数に 1 段あたりの人数を掛けただけです。破線は、場所の \(${fmt(v.fill, 0)}\) % が埋まった場合に、実際に運べる人数です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0.3, 0.9], y: [0, 18], aspect: 0.7, maxH: 350, xlabel: T('speed of the steps (m/s)', '踏段の速さ（m/s）'), ylabel: T('people an hour (thousands)', '1 時間あたりの人数（千人）') });
      [1, 1.5, 2].forEach((kk) => a.line([[0.3, capacity(0.3, kk) / 1000], [0.9, capacity(0.9, kk) / 1000]], { c: kk === k ? 'c1' : 'muted', w: kk === k ? 2.8 : 1.3 })); a.line([[0.3, capacity(0.3, k, v.fill / 100) / 1000], [0.9, capacity(0.9, k, v.fill / 100) / 1000]], { c: 'c1', w: 1.8, dash: '5 4' });
      a.handle(v.v, cap / 1000, { c: 'hl', axis: 'x', bounds: [0.3, 0.9, 0, 18], label: T('speed', '速さ'), onDrag: (x) => ctx.set('v', clamp(Math.round(x * 20) / 20, 0.3, 0.9)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Power drawn against the number of people carried, for a rise of \(${fmt(v.H, 1)}\) m. An escalator with nobody on it still has to drag its chain, steps and handrails round (the flat part). Each passenger then adds the work of lifting their own weight. Going down, the same passengers give that work back and the motor has to brake.`, tx`消費する電力を、運ぶ人数に対して、高さ \(${fmt(v.H, 1)}\) m の場合について描いています。誰も乗っていないエスカレーターも、鎖、踏段、手すりを回し続けなければなりません（平らな部分）。乗客 1 人ごとに、その人の体重を持ち上げる仕事が加わります。下りでは、同じ乗客がその仕事を戻し、モーターはブレーキをかけなければなりません。`));
      const b = L.fig(c2, { x: [0, 18], y: [-30, 60], aspect: 0.7, maxH: 350, xlabel: T('people an hour (thousands)', '1 時間あたりの人数（千人）'), ylabel: T('motor power (kW)', 'モーターの電力（kW）') });
      b.hline(0, { c: 'muted' }); b.line([[0, Pi / 1000], [18, (Pi + liftPower(18000, v.H)) / 1000]], { c: 'c2', w: 2.8 }); b.line([[0, Pi / 1000], [18, (Pi - liftPower(18000, v.H) * 0.64) / 1000]], { c: 'c3', w: 2 }); b.dot(real / 1000, (Pi + Pl) / 1000, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('every place taken; as used', 'すべての場所が埋まった場合、実際の利用') }, { c: 'muted', label: T('other widths', 'ほかの幅') }, { c: 'c2', label: T('going up', '上り') }, { c: 'c3', label: T('going down', '下り') }]);
      ctx.readout([
        { k: T('steps passing a second', '毎秒通過する踏段'), v: tx`\(${fmt(v.v / PITCH, 2)}\)` },
        { k: T('people an hour: every place taken, as used', '1 時間の人数：すべての場所、実際の利用'), v: tx`\(${fmt(cap, 0)},\ ${fmt(real, 0)}\)`, tone: 'key' },
        { k: T('on the escalator at one time', '同時に乗っている人数'), v: tx`\(${fmt(onb, 0)}\)` },
        { k: T('power: idling, lifting the passengers', '電力：空転、乗客の持ち上げ'), v: tx`\(${fmt(Pi / 1000, 1)},\ ${fmt(Pl / 1000, 1)}\ \mathrm{kW}\)` },
        { k: T('energy per passenger', '乗客 1 人あたりのエネルギー'), v: tx`\(${fmt(((Pi + Pl) / Math.max(real, 1)) * 1, 1)}\ \mathrm{Wh}\)`, tone: 'good' },
        { k: T('lifts needed to match it (13 people, 40 s a trip)', '同じ人数を運ぶエレベーターの台数（13 人、1 往復 40 秒）'), v: tx`\(${fmt(real / ((13 * 3600) / 40), 1)}\)` },
      ], T('An escalator never makes anyone wait, which is why it out-carries lifts over short rises. Its weakness is the idling: at night, an empty escalator spends as much as a kettle left on, so modern ones slow down or stop when nobody approaches.', 'エスカレーターは、誰も待たせません。短い高さでは、エレベーターより多くの人を運べるのはこのためです。弱点は空転です。夜間、誰も乗っていないエスカレーターは、つけっぱなしの電気ケトルと同じ程度の電力を使います。そのため、最近のものは、誰も近づかないときに減速したり、止まったりします。'));
    },
  };
})();
