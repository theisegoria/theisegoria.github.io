'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, DEG = Math.PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const mod = (x, m) => ((x % m) + m) % m;

  /* ---------- model (pure, checked by checks/gears-mechanisms.cjs) ---------- */
  const inv = (a) => Math.tan(a) - a;                       // the involute function
  const involutePoint = (rb, t) => [rb * (Math.cos(t) + t * Math.sin(t)), rb * (Math.sin(t) - t * Math.cos(t))];
  // standard gear of z teeth, module m, pressure angle a0
  function gear(z, m, a0) { const r = m * z / 2, rb = r * Math.cos(a0); return { z, m, a0, r, rb, ra: r + m, rf: r - 1.25 * m }; }
  // half the angular thickness of a tooth at radius R (involute part, R >= rb)
  const halfThick = (G, R) => Math.PI / (2 * G.z) + inv(G.a0) - inv(Math.acos(clamp(G.rb / R, -1, 1)));
  // outline of a gear rotated so tooth k is centred at angle rot + 2 pi k / z; optional radii override (for an internal gear drawn as its spaces)
  function outline(G, rot, cx = 0, cy = 0, o = {}) {
    const ra = o.ra ?? G.ra, rf = o.rf ?? G.rf, pts = [], n = o.n ?? 8;
    const rLow = Math.max(G.rb, rf), P = (R, a) => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    for (let k = 0; k < G.z; k++) {
      const c = rot + TAU * k / G.z;
      if (rf < G.rb) pts.push(P(rf, c - halfThick(G, G.rb)));
      for (let i = 0; i <= n; i++) { const R = rLow + (ra - rLow) * i / n; pts.push(P(R, c - halfThick(G, R))); }
      const tA = halfThick(G, ra); for (let i = 1; i < 3; i++) pts.push(P(ra, c - tA + 2 * tA * i / 3));
      for (let i = n; i >= 0; i--) { const R = rLow + (ra - rLow) * i / n; pts.push(P(R, c + halfThick(G, R))); }
      if (rf < G.rb) pts.push(P(rf, c + halfThick(G, G.rb)));
      const a1 = c + halfThick(G, G.rb), a2 = c + TAU / G.z - halfThick(G, G.rb);
      for (let i = 1; i < 4; i++) pts.push(P(rf, a1 + (a2 - a1) * i / 4));
    }
    pts.push(pts[0]);
    return pts;
  }
  // a meshing pair: gear 1 at the origin, gear 2 on the +x axis, centres pulled apart by da (in modules)
  function mesh(z1, z2, a0, da = 0, m = 1) {
    const g1 = gear(z1, m, a0), g2 = gear(z2, m, a0), a0d = g1.r + g2.r, a = a0d + da * m;
    const ap = Math.acos(a0d * Math.cos(a0) / a), Lline = a * Math.sin(ap);
    const sMax = Math.sqrt(g1.ra ** 2 - g1.rb ** 2), sMin = Lline - Math.sqrt(g2.ra ** 2 - g2.rb ** 2), pb = Math.PI * m * Math.cos(a0);
    return { g1, g2, a, ap, L: Lline, sMin, sMax, pb, eps: (sMax - sMin) / pb, T1: [g1.rb * Math.cos(ap), g1.rb * Math.sin(ap)], u: [Math.sin(ap), -Math.cos(ap)], backlash: 2 * da * m * Math.tan(ap) };
  }
  // contact state for gear-1 rotation phi (clockwise positive): the distances s along the line of action, and gear 2's rotation
  function contacts(M, phi) {
    const { g1, g2, ap } = M, out = [];
    const b0 = -phi - halfThick(g1, g1.rb);             // base angle of tooth 0's clockwise-side flank
    const s0 = g1.rb * (ap - b0);                        // unwrapped contact distance for tooth 0
    for (let k = -g1.z; k <= g1.z; k++) { const s = s0 - g1.rb * TAU * k / g1.z; if (s >= M.sMin - 1e-9 && s <= M.sMax + 1e-9) out.push(s); }
    const g2base = Math.PI + ap - (M.L - s0) / g2.rb;    // gear 2's matching flank base angle
    const rot2 = g2base + halfThick(g2, g2.rb);
    return { s: out, rot2, point: (s) => [M.T1[0] + s * M.u[0], M.T1[1] + s * M.u[1]] };
  }

  // 2. the going train (ratios as rev/s)
  const THIRD = [75, 10], CENTRE = [80, 10], BARREL = [84, 12];
  function train(f, ze, pe, z4) {
    const esc = f / ze, fourth = esc * pe / z4, third = fourth * THIRD[1] / THIRD[0], centre = third * CENTRE[1] / CENTRE[0], barrel = centre * BARREL[1] / BARREL[0];
    return { esc, fourth, third, centre, barrel, T4: 1 / fourth, Tc: 1 / centre, Tb: 1 / barrel };
  }

  // 3. epicyclic: angular velocities given the fixed member and the input
  function epicyclic(zs, zp, fixed, input = 1) {
    const zr = zs + 2 * zp; let ws, wr, wc;
    if (fixed === 0) { wr = 0; ws = input; wc = ws * zs / (zs + zr); }
    else if (fixed === 1) { wc = 0; ws = input; wr = -ws * zs / zr; }
    else if (fixed === 2) { ws = 0; wr = input; wc = wr * zr / (zs + zr); }
    else { ws = 0; wc = input; wr = wc * (zs + zr) / zr; }
    const wp = wc - (zs / zp) * (ws - wc);
    return { zr, ws, wr, wc, wp };
  }
  const willisResidual = (E, zs) => (E.ws - E.wc) + (E.zr / zs) * (E.wr - E.wc);
  const equalSpacing = (zs, zr, n) => (zs + zr) % n === 0;

  (window.LabModels = window.LabModels || {})['gears-mechanisms'] = { inv, involutePoint, gear, halfThick, outline, mesh, contacts, THIRD, CENTRE, BARREL, train, epicyclic, willisResidual, equalSpacing };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const ALPHAS = [14.5, 20, 25];

  /* ---------- 3D helpers ---------- */
  const METAL = { metal: 0.75, rough: 0.3, coat: 0.55 };
  // see piston-engines: frames are requested for a few seconds after a build and whenever the view comes into sight
  const settle = (S) => { let k = 0; const tick = () => { S.invalidate(); if (++k < 28) setTimeout(tick, 250); }; tick(); };
  const watch = (S) => { try { new IntersectionObserver((e) => { if (e[0].isIntersecting && S.wrap.isConnected) settle(S); }).observe(S.wrap); } catch (e) { /* no observer */ } };
  const ring2 = (R, n = 96, cx = 0, cy = 0) => L.seq(n, (i) => [cx + R * Math.cos((TAU * i) / n), cy + R * Math.sin((TAU * i) / n)]);
  // an extruded gear from a closed 2D outline (gear frame, tooth 0 on +x), face width W centred on z = 0, with holes
  function gearMesh(S, pts, W, holes, c, o = {}) {
    const THREE = S.THREE, V2 = (p) => new THREE.Vector2(p[0], p[1]);
    const P = pts.slice(); if (Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1e-9) P.pop();
    const sh = new THREE.Shape(P.map(V2));
    holes.forEach((h) => sh.holes.push(new THREE.Path(h.map(V2))));
    const geo = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false, curveSegments: 4 });
    geo.translate(0, 0, -W / 2);
    return new THREE.Mesh(geo, S.mat(c, { ...METAL, ...o }));
  }
  // holes for a spur gear: a bore, and four lightening holes when the web is large enough
  function gearHoles(G) {
    const bore = Math.max(0.9, G.rf * 0.16), hs = [ring2(bore, 40)];
    if (G.rf > 9) for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + (k * TAU) / 4, rc = G.rf * 0.56; hs.push(ring2(G.rf * 0.2, 40, rc * Math.cos(a), rc * Math.sin(a))); }
    return hs;
  }
  function shaft(S, r, len, c = 'muted') { const g = new S.THREE.CylinderGeometry(r, r, len, 32); g.rotateX(Math.PI / 2); return new S.THREE.Mesh(g, S.mat(c, METAL)); }

  /* ---------- 1. involute gearing ---------- */
  const GW = 5; // face width in modules
  function frameIG(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame); st.leg = L.h('div', '', st.frame);
    return st;
  }
  D['involute-gearing'] = {
    three: true,
    render(ctx, v) {
      const st = frameIG(ctx), a0 = ALPHAS[v.alpha] * DEG, M = mesh(v.z1, v.z2, a0, v.da);
      st.phi ??= 0;
      st.cap1.textContent = T('The two gears, the driver (blue) turning clockwise seen from above. The gold band is the plane of action between the tip circles: every contact line lies on it. Drag the gold knob on the driven shaft to pull the centres apart.', '二つの歯車で、上から見て駆動歯車（青）が時計回りに回ります。金色の帯は歯先円の間の作用面で、すべての接触線がその上にあります。被動軸の上の金色のつまみをドラッグして中心を引き離してください。');
      st.cap2.textContent = T('Close-up of the mesh, seen along the axes: the line of action (gold between the tip circles) and the points of contact on it.', '軸の方向から見たかみ合い部の拡大図です。作用線（歯先円の間は金色）とその上の接触点を示します。');
      const rp1 = M.g1.rb / Math.cos(M.ap), rp2 = M.g2.rb / Math.cos(M.ap);
      const P0 = [rp1, 0], zw = 3.2;
      st.g2.replaceChildren(); st.leg.replaceChildren();
      const g = L.fig(st.g2, { x: [P0[0] - zw, P0[0] + zw], y: [-zw * 0.8, zw * 0.8], equal: true, axes: false, maxH: 380 });
      const lineEnds = [M.T1, [M.T1[0] + M.L * M.u[0], M.T1[1] + M.L * M.u[1]]], act = [[M.T1[0] + M.sMin * M.u[0], M.T1[1] + M.sMin * M.u[1]], [M.T1[0] + M.sMax * M.u[0], M.T1[1] + M.sMax * M.u[1]]];
      g.seg(lineEnds[0], lineEnds[1], { c: 'muted', w: 1, dash: '4 3', layer: 'under' }); g.seg(act[0], act[1], { c: 'hl', w: 2.4, op: 0.8, layer: 'under' }); g.seg([0, 0], [M.a, 0], { c: 'muted', w: 0.8, layer: 'under' });
      g.circle(0, 0, rp1, { c: 'muted', w: 1, dash: '5 4', layer: 'under' }); g.circle(M.a, 0, rp2, { c: 'muted', w: 1, dash: '5 4', layer: 'under' });
      g.dot(P0[0], 0, { c: 'ink', r: 3.5, layer: 'over' }); g.text(P0[0], 0, 'P', { math: true, c: 'ink', dx: -10, dy: -8, layer: 'over' });
      g.text(act[1][0], act[1][1], T('line of action', '作用線'), { small: true, c: 'hl', dx: 8, dy: 4, anchor: 'start', layer: 'over' });
      const gB = g.group('main'), gC = g.group('over');
      L.legend(st.leg, [{ c: 'c1', kind: 'fill', label: T(`driver, z₁ = ${v.z1}`, `駆動歯車、z₁ = ${v.z1}`) }, { c: 'c3', kind: 'fill', label: T(`driven, z₂ = ${v.z2}`, `被動歯車、z₂ = ${v.z2}`) }, { c: 'hl', label: T('line and plane of action, contact points and lines', '作用線と作用面、接触点と接触線') }]);
      const pose = (phi) => {
        const C = contacts(M, phi);
        gB.replaceChildren(); gC.replaceChildren();
        const o1 = outline(M.g1, -phi), o2 = outline(M.g2, C.rot2, M.a, 0);
        gB.appendChild(g.poly(o1, { c: 'c1', w: 1.6, fill: 'c1', fo: 0.14, layer: 'main' })); gB.appendChild(g.poly(o2, { c: 'c3', w: 1.6, fill: 'c3', fo: 0.14, layer: 'main' }));
        C.s.forEach((s) => { const q = C.point(s); gC.appendChild(g.dot(q[0], q[1], { c: 'hl', r: 6, layer: 'over' })); });
        const P = st.parts;
        if (P && P.gear1 && !st.flat) {
          P.gear1.rotation.z = -phi; P.gear2.rotation.z = C.rot2; P.gear2.position.x = M.a;
          P.cl.forEach((m, i) => { const s = C.s[i]; m.visible = s !== undefined; if (m.visible) { const q = C.point(s); m.position.set(q[0], q[1], 0); } });
          st.S.invalidate();
        }
        if (st.flat && st.flatPose) st.flatPose(phi, C);
        return C.s.length;
      };
      st.pose = pose;
      const nNow = pose(st.phi);
      ctx.readout([
        { k: T('ratio ω₁/ω₂', '速度比 ω₁/ω₂'), v: `${v.z2}/${v.z1} = ${fmt(v.z2 / v.z1, 4)}`, tone: 'key' },
        { k: T('centre distance', '中心距離'), v: `${fmt(M.a, 2)} m` },
        { k: T('operating pressure angle α′', '運転圧力角 α′'), v: `${fmt(M.ap / DEG, 2)}°` },
        { k: T('contact ratio ε', 'かみ合い率 ε'), v: fmt(M.eps, 3), tone: M.eps < 1.2 ? 'warn' : 'good' },
        { k: T('pairs in contact now', '現在接している歯の組'), v: String(nNow) },
        { k: T('backlash ≈ 2Δa tan α′', 'バックラッシュ ≈ 2Δa tan α′'), v: `${fmt(M.backlash, 3)} m` },
      ], v.da > 0
        ? T(`The centres are ${fmt(v.da, 2)} modules apart from standard. The line of action has tilted to ${fmt(M.ap / DEG, 1)}° and shortened, so fewer pairs overlap (ε = ${fmt(M.eps, 2)}), and the teeth have play; but the base circles are untouched, so the ratio is still exactly ${v.z2}/${v.z1}.`, `中心は標準より ${fmt(v.da, 2)} モジュール離れています。作用線は ${fmt(M.ap / DEG, 1)}° に傾いて短くなり、重なる組は減り（ε = ${fmt(M.eps, 2)}）、歯には遊びが生じます。しかし基礎円は変わらないので、比はなお正確に ${v.z2}/${v.z1} です。`)
        : T(`At the standard centre distance the pitch circles roll on each other at P. Every contact lies on the gold segment, and a new pair engages before the old one leaves, ${fmt(M.eps, 2)} pairs on average.`, `標準の中心距離ではピッチ円どうしが P で転がり合います。すべての接触は金色の線分上にあり、古い組が離れる前に新しい組がかみ合い始めます。平均 ${fmt(M.eps, 2)} 組です。`));
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lab) => { st.phi += dt * 0.25; st.pose(st.phi); lab.textContent = T(`driver turned ${fmt((st.phi / DEG) % 360, 0)}°`, `駆動歯車の回転 ${fmt((st.phi / DEG) % 360, 0)}°`); }, { autoplay: false, initialT: 0, playLabel: T('Turn the gears', '歯車を回す') });
      const key = `${v.z1},${v.z2},${v.alpha}`, zTop = GW / 2 + 2.6;
      const build = (S) => {
        const P = st.parts, THREE = S.THREE;
        if (P.key !== key) {
          P.key = key;
          (P.objs || []).forEach((o) => { S.scene.remove(o); o.traverse((m) => m.geometry?.dispose?.()); });
          P.objs = [];
          const add = (o) => { S.add(o); P.objs.push(o); return o; };
          P.gear1 = add(new THREE.Group()); P.gear2 = add(new THREE.Group());
          P.gear1.add(gearMesh(S, outline(M.g1, 0), GW, gearHoles(M.g1), 'c1'));
          P.gear2.add(gearMesh(S, outline(M.g2, 0), GW, gearHoles(M.g2), 'c3'));
          P.s1 = add(shaft(S, Math.max(0.9, M.g1.rf * 0.16) * 0.98, GW + 4)); P.s2 = add(shaft(S, Math.max(0.9, M.g2.rf * 0.16) * 0.98, GW + 4));
          P.s1.position.z = 0.6; P.s2.position.z = 0.6;
          // the pitch circles on the top faces
          P.pc = add(S.lines([], { c: 'ink', opacity: 0.55 }));
          P.cl = [0, 1, 2].map(() => { const m = shaft(S, 0.16, GW + 0.3, 'hl'); m.material.emissive.copy(S.colour('hl')); m.material.emissiveIntensity = 0.25; return add(m); });
          P.plane = add(new THREE.Mesh(new THREE.BufferGeometry(), S.mat('hl', { opacity: 0.32, rough: 0.5, coat: 0 })));
          P.plane.userData.noOcclude = true;
          P.loa = add(S.lines([], { c: 'hl', opacity: 0.9 }));
          const w = M.g1.ra + M.a + M.g2.ra + 2, cx = (M.a + M.g2.ra - M.g1.ra) / 2, d = w * 1.75 + 8;
          S.look([cx + d * 0.06, -d * 0.66, d * 0.72], [cx, 2.5, -1], true);
        }
        // everything that moves with the centre distance
        const rp1n = M.g1.rb / Math.cos(M.ap), rp2n = M.g2.rb / Math.cos(M.ap), z = GW / 2 + 0.03, segs = [];
        const circ = (cx, r) => { for (let i = 0; i < 120; i++) { const a = (TAU * i) / 120, b = (TAU * (i + 1)) / 120; if (i % 2 === 0) segs.push([[cx + r * Math.cos(a), r * Math.sin(a), z], [cx + r * Math.cos(b), r * Math.sin(b), z]]); } };
        circ(0, rp1n); circ(M.a, rp2n);
        P.pc.update(segs);
        P.s2.position.x = M.a;
        const A = act[0], B = act[1], h = GW / 2 + 0.02;
        const pos = new Float32Array([A[0], A[1], -h, B[0], B[1], -h, B[0], B[1], h, A[0], A[1], -h, B[0], B[1], h, A[0], A[1], h]);
        P.plane.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); P.plane.geometry.computeVertexNormals(); P.plane.geometry.computeBoundingSphere();
        P.loa.update([[[lineEnds[0][0], lineEnds[0][1], h + 0.01], [lineEnds[1][0], lineEnds[1][1], h + 0.01]]]);
        P.knob.at([M.a, 0, zTop]); P.lP.set([rp1n, 0, h + 0.4]);
        P.l1.set([-M.g1.ra * 0.7, -M.g1.ra * 0.7, h]); P.l2.set([M.a + M.g2.ra * 0.7, -M.g2.ra * 0.7, h]); P.lA.set([B[0], B[1], -h]);
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 480, camera: [16, -40, 50], target: [16, 0, 0], fov: 30,
        label: T('3D pair of involute spur gears. Drag to rotate; drag the gold knob to move the driven gear.', '3D のインボリュート平歯車の組。ドラッグで回転、金色のつまみで被動歯車を動かせます。'),
        init(S) {
          st.flat = false; st.S = S; watch(S);
          const P = st.parts = {};
          P.knob = S.handle([M.a, 0, zTop], { plane: [[0, 0, 1], [0, 0, zTop]], r: 0.9, onDrag: (q) => { const base = (st.vz1 + st.vz2) / 2, da = clamp(Math.round((q.x - base) / 0.02) * 0.02, 0, 0.6); ctx.set('da', da); return [base + da, 0, zTop]; } });
          P.lP = S.label('P', [0, 0, 0], { math: true });
          P.l1 = S.label(T('driver', '駆動歯車'), [0, 0, 0], { small: true, align: 'end' }); P.l2 = S.label(T('driven', '被動歯車'), [0, 0, 0], { small: true });
          P.lA = S.label(T('plane of action', '作用面'), [0, 0, 0], { small: true, c: 'hl' });
        },
        update(S) { const was = st.parts.key; P_(); build(S); st.pose(st.phi); if (was !== key) settle(S); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const R2 = M.g2.ra, X0 = -M.g1.ra - 0.5, X1 = M.a + R2 + 0.5, Yh = Math.max(M.g1.ra, R2) + 0.5;
          const f = L.fig(st.v3, { x: [X0, X1], y: [-Yh, Yh], equal: true, axes: false, maxH: 380 });
          for (const [cx, G, rp] of [[0, M.g1, rp1], [M.a, M.g2, rp2]]) { f.circle(cx, 0, rp, { c: 'muted', w: 1, dash: '5 4', layer: 'under' }); f.circle(cx, 0, G.rb, { c: 'muted', w: 0.8, dash: '1 3', layer: 'under' }); f.dot(cx, 0, { c: 'ink', r: 2.5, layer: 'under' }); }
          f.seg(lineEnds[0], lineEnds[1], { c: 'muted', w: 1, dash: '4 3', layer: 'under' }); f.seg(act[0], act[1], { c: 'hl', w: 2.4, op: 0.8, layer: 'under' });
          const gA = f.group('main'), gD = f.group('over');
          st.flatPose = (phi, C) => {
            gA.replaceChildren(); gD.replaceChildren();
            gA.appendChild(f.poly(outline(M.g1, -phi), { c: 'c1', w: 1.2, fill: 'c1', fo: 0.14, layer: 'main' })); gA.appendChild(f.poly(outline(M.g2, C.rot2, M.a, 0), { c: 'c3', w: 1.2, fill: 'c3', fo: 0.14, layer: 'main' }));
            C.s.forEach((s) => { const q = C.point(s); gD.appendChild(f.dot(q[0], q[1], { c: 'hl', r: 3.5, layer: 'over' })); });
          };
          setTimeout(() => st.pose(st.phi), 0);
        },
      });
      function P_() { st.vz1 = v.z1; st.vz2 = v.z2; }
      P_();
    },
  };

  /* ---------- 2. the going train ---------- */
  const VPH = [18000, 21600, 25200, 28800, 36000], SPEEDS = [1, 60, 3600];
  D['gear-train'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const vph = VPH[v.vph], fq = vph / 7200, R = train(fq, v.ze, v.pe, v.z4), sp = SPEEDS[v.speed];
      const secErr = 86400 * (60 / R.T4 - 1), minErr = 86400 * (3600 / R.Tc - 1), reserve = v.turns * R.Tb / 3600;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The train from barrel to escape wheel, schematic: each wheel drives the small pinion of the next. Wheel sizes are proportional to tooth counts.', '香箱からがんぎ車までの輪列の模式図です。各車は次の車の小さなかなを駆動します。車の大きさは歯数に比例します。'));
      const s = 0.05, arbors = [
        { key: 'barrel', z: 84, p: null, w: R.barrel, name: T('barrel', '香箱'), c: 'c4' },
        { key: 'centre', z: CENTRE[0], p: BARREL[1], w: R.centre, name: T('centre (minutes)', '二番（分）'), c: 'c1' },
        { key: 'third', z: THIRD[0], p: CENTRE[1], w: R.third, name: T('third', '三番'), c: 'c3' },
        { key: 'fourth', z: v.z4, p: THIRD[1], w: R.fourth, name: T('fourth (seconds)', '四番（秒）'), c: 'c1' },
        { key: 'esc', z: v.ze * 1.4, p: v.pe, w: R.esc, name: T('escape', 'がんぎ'), c: 'c2', teeth: v.ze },
      ];
      // lay out along a zigzag: wheel k meshes with pinion k+1 at distance (z_k + p_{k+1}) s
      let x = 0, y = 0; const pos = [];
      let dir = -0.9; arbors.forEach((A, k) => { if (k) { const d = (arbors[k - 1].z + A.p) * s; x += d * Math.cos(dir); y += d * Math.sin(dir); dir += 0.95; } pos.push([x, y]); });
      const xs = pos.map((q, k) => [q[0] - arbors[k].z * s, q[0] + arbors[k].z * s]).flat(), ys = pos.map((q, k) => [q[1] - arbors[k].z * s, q[1] + arbors[k].z * s]).flat();
      const f = L.fig(c1, { x: [Math.min(...xs) - 0.3, Math.max(...xs) + 0.3], y: [Math.min(...ys) - 0.5, Math.max(...ys) + 0.5], equal: true, axes: false, maxH: 400 });
      const G = f.group('main');
      const toothed = (cx, cy, r, n, rot, c, w, op = 1) => { const pts = []; const N = Math.min(n, 120); for (let i = 0; i <= N * 4; i++) { const a = rot + TAU * i / (N * 4), rr = r * (1 + ((i % 4 === 1 || i % 4 === 2) ? 0.035 : -0.035)); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return f.poly(pts, { c, w, fill: c, fo: 0.12 * op, op, layer: 'main' }); };
      const draw = (t) => {
        while (G.firstChild) G.removeChild(G.firstChild);
        arbors.forEach((A, k) => {
          const [cx, cy] = pos[k]; let ang = -TAU * A.w * t;
          if (A.key === 'esc') { const beats = Math.floor(t * 2 * fq); ang = -TAU * (beats / 2) / v.ze; }
          G.appendChild(toothed(cx, cy, A.z * s, A.teeth || A.z, ang, A.c, 1.4, 0.5));
          if (A.p) G.appendChild(toothed(cx, cy, A.p * s, A.p, ang, A.c, 1.6, 2.5));
          for (let j = 0; j < 4; j++) { const a = ang + j * TAU / 4; G.appendChild(f.seg([cx, cy], [cx + 0.8 * A.z * s * Math.cos(a), cy + 0.8 * A.z * s * Math.sin(a)], { c: A.c, w: 1, op: 0.6, layer: 'main' })); }
          if (A.key === 'centre' || A.key === 'fourth') { const a = Math.PI / 2 - TAU * A.w * t; G.appendChild(f.arrow([cx, cy], [cx + 0.95 * A.z * s * Math.cos(a), cy + 0.95 * A.z * s * Math.sin(a)], { c: 'hl', w: 2.6, layer: 'main' })); }
          const lt = f.text(cx, cy - ((A.p || 6) + 2) * s, A.name, { small: true, c: A.c, dy: 12, layer: 'main' }); lt.style.fontWeight = '600'; G.appendChild(lt);
        });
      };
      draw(0);
      // right: rotation periods on a log scale
      L.h('p', 'lab-cap', c2, T('Rotation period of each arbor (log scale). The seconds and minute hands need exactly 60 s and 3600 s.', '各軸の回転周期（対数目盛）です。秒針と分針にはちょうど 60 秒と 3600 秒が必要です。'));
      const rows = [['barrel', R.Tb], ['centre', R.Tc], ['third', R.third ? 1 / R.third : 0], ['fourth', R.T4], ['esc', 1 / R.esc]];
      const g = L.fig(c2, { x: [0, 5.5], y: [0, 5.2], aspect: 0.8, xlabel: T('log₁₀ period (s)', 'log₁₀ 周期（秒）'), axes: true, grid: true, maxH: 400, ticksX: [[0, '1 s'], [1, '10 s'], [2, '100 s'], [3, '1000 s'], [4, '3 h'], [5, '1 d']], ticksY: rows.map((r, i) => [4.6 - i, '']) });
      rows.forEach(([key, P], i) => { const A = arbors.find((q) => q.key === key), y = 4.6 - i; g.rect(0, y - 0.3, Math.log10(P), 0.6, { c: A.c, fill: A.c, fo: 0.35, w: 1, layer: 'main' }); g.text(Math.log10(P), y, `${A.name}: ${P >= 3600 ? fmt(P / 3600, 2) + ' h' : P >= 60 ? fmt(P / 60, 2) + ' min' : fmt(P, 2) + ' s'}`, { small: true, c: 'ink', dx: 6, anchor: 'start', layer: 'over' }); });
      g.vline(Math.log10(60), { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' }); g.vline(Math.log10(3600), { c: 'hl', w: 1.2, dash: '4 3', layer: 'under' });
      L.legend(ctx.host, [{ c: 'hl', label: T('hands, and the 60 s and 3600 s targets', '針と、60 秒と 3600 秒の目標') }, { c: 'c2', kind: 'fill', label: T('escape wheel, stepping half a tooth per beat', 'がんぎ車、一振動の半分ごとに半歯進む') }]);
      const okS = Math.abs(secErr) < 1e-6;
      ctx.readout([
        { k: T('balance', 'てんぷ'), v: `${vph.toLocaleString()} vph, f = ${fmt(fq, 2)} Hz`, tone: 'key' },
        { k: T('escape wheel', 'がんぎ車'), v: `${fmt(60 * R.esc, 2)} rpm` },
        { k: T('fourth wheel period', '四番車の周期'), v: `${fmt(R.T4, 3)} s`, tone: okS ? 'good' : 'warn' },
        { k: T('seconds hand error', '秒針の誤差'), v: okS ? T('none', 'なし') : `${fmt(secErr, 0)} s/day`, tone: okS ? 'good' : 'warn' },
        { k: T('centre wheel period', '二番車の周期'), v: `${fmt(R.Tc / 60, 3)} min`, tone: Math.abs(minErr) < 1e-6 ? 'good' : 'warn' },
        { k: T('power reserve', 'パワーリザーブ'), v: `${fmt(reserve, 1)} h` },
      ], okS
        ? T(`z_esc·z₄/(f·p_esc) = ${v.ze}·${v.z4}/(${fmt(fq, 1)}·${v.pe}) = 60 exactly: the seconds hand turns once a minute, and with the fixed 60 : 1 of the centre and third meshes, the minute hand once an hour.`, `z_esc·z₄/(f·p_esc) = ${v.ze}·${v.z4}/(${fmt(fq, 1)}·${v.pe}) = 60 ちょうどです。秒針は毎分一回転し、二番と三番のかみ合いの固定された 60 : 1 と合わせて、分針は毎時一回転します。`)
        : T(`The fourth wheel takes ${fmt(R.T4, 2)} s per turn, not 60, so the seconds and minute hands are wrong by ${fmt(secErr, 0)} s a day. No regulator adjustment can fix a tooth count: try changing the fourth wheel so that z_esc·z₄ = 60·f·p_esc = ${fmt(60 * fq * v.pe, 0)}.`, `四番車は一回転に 60 秒ではなく ${fmt(R.T4, 2)} 秒かかるので、秒針と分針は一日に ${fmt(secErr, 0)} 秒ずれます。歯数は緩急の調整では直せません。z_esc·z₄ = 60·f·p_esc = ${fmt(60 * fq * v.pe, 0)} となるよう四番車を変えてみてください。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { draw(t * sp); lab.textContent = T(`${fmt(t * sp / 60, 1)} min of watch time`, `時計の時間で ${fmt(t * sp / 60, 1)} 分`); }, { autoplay: false, initialT: 0, playLabel: T('Run the train', '輪列を動かす') });
    },
  };

  /* ---------- 3. epicyclic ---------- */
  const FIX_NAME = [['ring fixed', '内歯車固定'], ['carrier fixed', 'キャリア固定'], ['sun fixed', '太陽固定'], ['tourbillon', 'トゥールビヨン']];
  const EW = 6; // face width
  function frameEP(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame); st.leg = L.h('div', '', st.frame);
    return st;
  }
  D['epicyclic'] = {
    three: true,
    render(ctx, v) {
      const st = frameEP(ctx);
      const zs = v.zs, zp = v.zp, n = v.n, fixed = v.fixed, E = epicyclic(zs, zp, fixed, 1), zr = E.zr, m = 1, a0 = 20 * DEG;
      const S0 = gear(zs, m, a0), Pg = gear(zp, m, a0), Rg = gear(zr, m, a0), dc = S0.r + Pg.r, eq = equalSpacing(zs, zr, n), tour = fixed === 3;
      // initial phases: sun tooth 0 at angle 0; planet j at psi_j; mesh by the pitch-point rule
      const psi = L.seq(n, (j) => (TAU * j) / n);
      const planet0 = psi.map((ps) => { const ds = mod(ps, TAU / zs); return ps + Math.PI - (ds * S0.r) / Pg.r + Math.PI / zp; });
      const ring0 = (() => { const ps = psi[0], dp = mod(planet0[0] - ps, TAU / zp); return ps + (dp * Pg.r) / Rg.r; })();
      st.cap1.textContent = tour ? T('Tourbillon: the cage (gold) turns, carrying the escape pinion (orange) round the fixed wheel (grey) and the balance with it.', 'トゥールビヨン：かご（金）が回り、がんぎかな（オレンジ）を固定車（灰）の周りに運び、てんぷも一緒に運びます。') : T('Sun (blue), planets (teal) on the gold carrier, ring (violet). The fixed member is drawn in grey, like the frame it is bolted to.', '太陽（青）、金色のキャリアに載った遊星（青緑）、内歯車（紫）です。固定した部材は、それを留めた枠と同じ灰色で描いています。');
      st.cap2.textContent = T('Velocity diagram along the radius through one planet: tangential speed against radius. Across the planet the speed is a straight line.', '一つの遊星を通る半径に沿った速度線図です。半径に対する接線方向の速さで、遊星を横切る速さは直線になります。');
      // right: velocity diagram
      st.g2.replaceChildren(); st.leg.replaceChildren();
      const vS = E.ws * S0.r, vR = E.wr * Rg.r, vC = E.wc * dc, vmax = Math.max(Math.abs(vS), Math.abs(vR), Math.abs(vC), 1e-9) * 1.2;
      const g = L.fig(st.g2, { x: [0, Rg.r * 1.08], y: [-vmax, vmax], aspect: 0.8, xlabel: T('radius', '半径'), ylabel: T('tangential speed', '接線速度'), maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      g.rect(0, -vmax, S0.r, 2 * vmax, { c: 'c1', fill: 'c1', fo: 0.06, nostroke: true, layer: 'under' });
      g.rect(S0.r, -vmax, 2 * Pg.r, 2 * vmax, { c: 'c3', fill: 'c3', fo: 0.08, nostroke: true, layer: 'under' });
      g.line([[0, 0], [S0.r, vS]], { c: 'c1', w: 2.2, layer: 'main' });
      g.line([[S0.r, vS], [S0.r + 2 * Pg.r, tour ? vS + 2 * (vC - vS) : vR]], { c: 'c3', w: 2.6, layer: 'main' });
      g.line([[0, 0], [dc, vC]], { c: 'hl', w: 1.4, dash: '5 3', layer: 'main' });
      if (!tour) g.line([[0, 0], [Rg.r, vR]], { c: 'c4', w: 1.4, dash: '2 3', layer: 'main' });
      [[S0.r, vS, 'c1', T('sun', '太陽')], [dc, vC, 'hl', T('carrier', 'キャリア')], [Rg.r, tour ? null : vR, 'c4', T('ring', '内歯車')]].forEach(([x, y, c, name]) => { if (y === null) return; g.dot(x, y, { c, r: 5, layer: 'over' }); g.text(x, y, name, { small: true, c, dx: 6, dy: y >= 0 ? -8 : 14, anchor: 'start', layer: 'over' }); });
      L.legend(st.leg, [{ c: 'c1', label: T('sun', '太陽') }, { c: tour ? 'c2' : 'c3', label: T(tour ? 'escape pinion' : 'planet', tour ? 'がんぎかな' : '遊星') }, { c: 'hl', label: T(tour ? 'cage' : 'carrier', tour ? 'かご' : 'キャリア') }].concat(tour ? [] : [{ c: 'c4', label: T('ring', '内歯車') }], [{ c: 'muted', kind: 'fill', label: T('fixed member', '固定した部材') }]));
      const ratioTxt = fixed === 0 ? `ω_c/ω_s = ${zs}/${zs + zr} = ${fmt(E.wc, 4)}` : fixed === 1 ? `ω_r/ω_s = −${zs}/${zr} = ${fmt(E.wr, 4)}` : fixed === 2 ? `ω_c/ω_r = ${zr}/${zs + zr} = ${fmt(E.wc / E.wr, 4)}` : `ω_p/ω_c = 1 + ${zs}/${zp} = ${fmt(E.wp / E.wc, 3)}`;
      ctx.readout([
        { k: T('teeth sun, planet, ring', '歯数：太陽、遊星、内歯車'), v: `${zs}, ${zp}, ${zr}`, tone: 'key' },
        { k: T('mode', '構成'), v: T(...FIX_NAME[fixed]) },
        { k: T('ratio', '比'), v: ratioTxt, tone: 'good' },
        { k: T('planet spin ω_p (per input turn)', '遊星の自転 ω_p（入力一回転あたり）'), v: fmt(E.wp, 4) },
        { k: T(`${n} planets equally spaced`, `${n} 個の遊星の等間隔配置`), v: eq ? T(`yes: (${zs}+${zr})/${n} = ${(zs + zr) / n}`, `可能：(${zs}+${zr})/${n} = ${(zs + zr) / n}`) : T(`no: (${zs}+${zr})/${n} is not an integer`, `不可：(${zs}+${zr})/${n} は整数でない`), tone: eq || tour ? 'good' : 'warn' },
      ], tour
        ? T(`Relative to the cage the escape pinion simply rolls round a fixed wheel of ${zs} teeth, turning ${fmt(zs / zp, 2)} times per cage turn; seen from outside it turns once more with the cage, ${fmt(E.wp, 2)} times. With the cage at one turn a minute the whole escapement visits every orientation each minute.`, `かごに対してがんぎかなは歯数 ${zs} の固定車の周りを転がるだけで、かご一回転あたり ${fmt(zs / zp, 2)} 回回ります。外から見るとかごと一緒にもう一回転するので ${fmt(E.wp, 2)} 回です。かごが毎分一回転なら、脱進機全体が毎分すべての向きを巡ります。`)
        : fixed === 0 ? T(`With the ring held, the planets roll on it and the carrier follows at ${fmt(E.wc, 3)} of the sun’s speed: one stage gives a reduction of ${fmt(1 / E.wc, 2)} : 1 with the load shared between ${n} planets.`, `内歯車を固定すると遊星はその上を転がり、キャリアは太陽の速さの ${fmt(E.wc, 3)} でついていきます。一段で ${fmt(1 / E.wc, 2)} : 1 の減速が得られ、荷重は ${n} 個の遊星で分担されます。`)
          : fixed === 1 ? T('With the carrier held, the planets are just idlers on fixed axles: the ring turns the opposite way to the sun, slowed by z_s/z_r.', 'キャリアを固定すると遊星は固定軸上の中間車にすぎず、内歯車は太陽と逆向きに z_s/z_r だけ遅く回ります。')
            : T('With the sun held and the ring driving, the carrier turns the same way as the ring but slower, and each planet rolls round the fixed sun.', '太陽を固定して内歯車で駆動すると、キャリアは内歯車と同じ向きにより遅く回り、各遊星は固定された太陽の周りを転がります。'));
      const pose = (t) => {
        const th = { s: TAU * E.ws * t, r: TAU * E.wr * t, c: TAU * E.wc * t, p: TAU * E.wp * t };
        const P = st.parts;
        if (P && P.sun && !st.flat) {
          P.sun.rotation.z = th.s; if (P.ring) P.ring.rotation.z = ring0 + th.r; P.carrier.rotation.z = th.c;
          P.planets.forEach((pm, j) => { const a = psi[j] + th.c; pm.position.set(dc * Math.cos(a), dc * Math.sin(a), 0); pm.rotation.z = planet0[j] + th.p; });
          if (P.bal) P.bal.rotation.z = 0.9 * Math.sin(TAU * 2.5 * t * 4);
          st.S.invalidate();
        }
        if (st.flat && st.flatPose) st.flatPose(th);
      };
      st.pose = pose; st.t ??= 0;
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lab) => { st.t = t * 0.08; st.pose(st.t); lab.textContent = T('input turning', '入力を回転中'); }, { autoplay: false, initialT: 0, playLabel: T('Drive it', '駆動する') });
      const key = `${zs},${zp},${n},${fixed}`;
      const build = (S) => {
        const P = st.parts, THREE = S.THREE;
        if (P.key === key) return;
        P.key = key;
        (P.objs || []).forEach((o) => { S.scene.remove(o); o.traverse((q) => q.geometry?.dispose?.()); });
        P.objs = []; P.ring = null; P.bal = null;
        const add = (o) => { S.add(o); P.objs.push(o); return o; };
        const col = (k, c) => (k ? 'muted' : c);
        P.sun = add(new THREE.Group()); P.sun.add(gearMesh(S, outline(S0, 0), EW, gearHoles(S0), col(fixed === 2 || tour, 'c1')));
        const ax = add(shaft(S, Math.max(0.9, S0.rf * 0.16) * 0.98, EW + 5, 'muted')); ax.position.z = -1;
        if (!tour) {
          const inner = outline(Rg, 0, 0, 0, { ra: Rg.r + 1.25 * m, rf: Rg.r - m });
          P.ring = add(new THREE.Group()); P.ring.add(gearMesh(S, ring2(Rg.r + 2.4, 160), EW, [inner], col(fixed === 0, 'c4')));
        }
        P.planets = (tour ? [psi[0]] : psi).map(() => { const gp = add(new THREE.Group()); gp.add(gearMesh(S, outline(Pg, 0), EW, [ring2(Math.max(0.5, Pg.rf * 0.18), 28)], tour ? 'c2' : 'c3')); return gp; });
        // the carrier: a plate above the gears with an arm and a pin to each planet
        const car = P.carrier = add(new THREE.Group()), cm = S.mat(fixed === 1 ? 'muted' : 'hl', METAL), zc = EW / 2 + 0.9;
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.9, 40).rotateX(Math.PI / 2), cm); hub.position.z = zc; car.add(hub);
        (tour ? [psi[0], psi[0] + Math.PI] : psi).forEach((a, j) => {
          const arm = new THREE.Mesh(new THREE.BoxGeometry(dc, 1.6, 0.6), cm); arm.position.set((dc / 2) * Math.cos(a), (dc / 2) * Math.sin(a), zc); arm.rotation.z = a; car.add(arm);
          const boss = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.9, 32).rotateX(Math.PI / 2), cm); boss.position.set(dc * Math.cos(a), dc * Math.sin(a), zc); car.add(boss);
          if (!tour || j === 0) { const pin = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(0.45, Pg.rf * 0.17), Math.max(0.45, Pg.rf * 0.17), EW + 1.2, 24).rotateX(Math.PI / 2), cm); pin.position.set(dc * Math.cos(a), dc * Math.sin(a), 0.3); car.add(pin); }
        });
        if (tour) {
          const rim = new THREE.Mesh(new THREE.TorusGeometry(dc + Pg.ra + 0.6, 0.35, 12, 120), cm); rim.position.z = zc; car.add(rim);
          // a balance wheel riding on the cage opposite the pinion
          const bal = P.bal = new THREE.Group(), bm = S.mat('c1', METAL), rb = Math.min(dc * 0.55, Pg.ra * 1.6);
          bal.add(new THREE.Mesh(new THREE.TorusGeometry(rb, 0.28, 12, 72), bm));
          for (let k = 0; k < 3; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(rb, 0.3, 0.25), bm); const b = (k * TAU) / 3; sp.position.set((rb / 2) * Math.cos(b), (rb / 2) * Math.sin(b), 0); sp.rotation.z = b; bal.add(sp); }
          const holder = new THREE.Group(); holder.position.set(-dc * Math.cos(psi[0]), -dc * Math.sin(psi[0]), zc + 0.9); holder.add(bal); car.add(holder);
        }
        const Rv = tour ? dc + Pg.ra + 1 : Rg.r + 2.4, d = Rv * 3.9 + 8;
        S.look([0, -d * 0.64, d * 0.77], [0, -Rv * 0.05, -1], true);
        P.lS.set([0, 0, EW / 2 + 3.6], tour ? T('fixed wheel', '固定車') : T(fixed === 2 ? 'sun (fixed)' : 'sun', fixed === 2 ? '太陽（固定）' : '太陽'));
        P.lR.show(!tour); P.lR.set([Rg.r * 0.72, -(Rg.r + 2.4) * 0.72, EW / 2], T(fixed === 0 ? 'ring (fixed)' : 'ring', fixed === 0 ? '内歯車（固定）' : '内歯車'));
        P.lC.set([dc * 0.5, 0, zc + 0.8], T(tour ? 'cage' : fixed === 1 ? 'carrier (fixed)' : 'carrier', tour ? 'かご' : fixed === 1 ? 'キャリア（固定）' : 'キャリア'));
        settle(S);
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 480, camera: [0, -90, 110], target: [0, 0, 0], fov: 30,
        label: T('3D epicyclic gear set. Drag to rotate.', '3D の遊星歯車列。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.S = S; watch(S);
          const P = st.parts = {};
          P.lS = S.label('', [0, 0, 0], { small: true }); P.lR = S.label('', [0, 0, 0], { small: true }); P.lC = S.label('', [0, 0, 0], { small: true });
        },
        update(S) { build(S); st.pose(st.t); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const Rv = tour ? dc + Pg.ra + 1 : Rg.r + 2.4;
          const f = L.fig(st.v3, { x: [-Rv, Rv], y: [-Rv, Rv], equal: true, axes: false, maxH: 400 });
          const G = f.group('main'), O = f.group('over');
          st.flatPose = (th) => {
            G.replaceChildren(); O.replaceChildren();
            if (!tour) {
              const inner = outline(Rg, ring0 + th.r, 0, 0, { ra: Rg.r + 1.25 * m, rf: Rg.r - m }), outer = L.seq(121, (i) => [(Rg.r + 2.2) * Math.cos((TAU * i) / 120), (Rg.r + 2.2) * Math.sin((TAU * i) / 120)]);
              const d = [inner, outer].map((ring) => 'M' + ring.map(([x, y]) => f.X(x).toFixed(1) + ' ' + f.Y(y).toFixed(1)).join('L') + 'Z').join('');
              G.appendChild(L.el('path', { d, 'fill-rule': 'evenodd', style: `fill:var(--lab-c4);fill-opacity:${fixed === 0 ? 0.08 : 0.18};stroke:var(--lab-c4);stroke-width:1.2;opacity:${fixed === 0 ? 0.6 : 1}` }));
            }
            G.appendChild(f.poly(outline(S0, th.s), { c: 'c1', w: 1.2, fill: 'c1', fo: fixed === 2 || tour ? 0.05 : 0.16, op: fixed === 2 || tour ? 0.6 : 1, layer: 'main' }));
            psi.forEach((ps, j) => { const a = ps + th.c, cx = dc * Math.cos(a), cy = dc * Math.sin(a); if (!tour || j === 0) { G.appendChild(f.poly(outline(Pg, planet0[j] + th.p, cx, cy), { c: tour ? 'c2' : 'c3', w: 1.2, fill: tour ? 'c2' : 'c3', fo: 0.18, layer: 'main' })); } });
            psi.forEach((ps, j) => { if (tour && j) return; const a = ps + th.c; O.appendChild(f.seg([0, 0], [dc * Math.cos(a), dc * Math.sin(a)], { c: 'hl', w: 4, op: 0.85, layer: 'over' })); O.appendChild(f.dot(dc * Math.cos(a), dc * Math.sin(a), { c: 'hl', r: 4, layer: 'over' })); });
            if (tour) O.appendChild(f.circle(0, 0, dc + Pg.ra + 0.3, { c: 'hl', w: 1.2, dash: '5 4', layer: 'over' }));
            O.appendChild(f.dot(0, 0, { c: 'ink', r: 3, layer: 'over' }));
          };
          setTimeout(() => st.pose(st.t), 0);
        },
      });
      pose(st.t);
    },
  };
})();
