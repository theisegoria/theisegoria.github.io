'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Differential: the two half-shaft speeds average to the carrier speed, wL + wR = 2 wc, and an open differential
   * sends equal torque to each side. In a turn of radius R (to the centre of the axle) with track t the wheels
   * need wc (1 -/+ t / 2R).
   * Car: 1300 kg, wheel radius 0.31 m, CdA 0.65 m^2, rolling coefficient 0.012, front-drive traction limit.
   * Engine torque 200 - 60 ((rpm - 4000) / 3000)^2 N m between 1000 and 6500 rpm.
   * Stepped box: ratios GEARS with a final drive; a shift takes a time during which a manual sends no torque and a
   * dual-clutch box keeps sending it. CVT: belt on two cone pulleys, centre distance C, fixed belt length.
   */
  const TRACK = 1.5, RW = 0.31, MASS = 1300, CDA = 0.65, CRR = 0.012, RHOA = 1.2, GEARS = [3.45, 1.94, 1.29, 0.97, 0.8], RED = 6500, IDLE = 1000, FLIM = 0.9 * MASS * G * 0.6;
  const wheelSpeeds = (wc, R, t = TRACK) => ({ inner: wc * (1 - t / (2 * R)), outer: wc * (1 + t / (2 * R)) });
  const spiderSpin = (wOuter, wInner, nSide = 16, nSpider = 10) => ((wOuter - wInner) / 2) * (nSide / nSpider);
  const openTorque = (Tin, gripLow, gripHigh) => { const each = Math.min(Tin / 2, gripLow, gripHigh); return { each, total: 2 * each }; };
  const torque = (rpm) => 200 - 60 * ((clamp(rpm, IDLE, RED) - 4000) / 3000) ** 2;
  const power = (rpm) => (torque(rpm) * rpm * TAU) / 60;                                              // W
  const peakPowerRpm = (() => { let b = 0, at = 0; for (let r = 1000; r <= 6500; r += 10) if (power(r) > b) { b = power(r); at = r; } return at; })();
  const speedAt = (rpm, g, fd) => ((rpm * TAU) / 60 / (g * fd)) * RW;                                 // m/s
  const rpmAt = (v, g, fd) => ((v / RW) * g * fd * 60) / TAU;
  const force = (rpm, g, fd, eta = 0.95) => (torque(rpm) * g * fd * eta) / RW;
  const resist = (v) => CRR * MASS * G + 0.5 * RHOA * CDA * v * v;
  function accel(mode, fd = 3.9, ts = 0.5, vEnd = 100 / 3.6, dt = 0.005) { let v = 0, t = 0, gi = 0, hold = 0; const tr = [[0, 0]]; const pk = peakPowerRpm;
    while (v < vEnd && t < 60) { let F;
      if (mode === 'cvt') { const need = (pk * TAU) / 60 * RW / Math.max(v, 0.1) / 5.2, i = clamp(need, 0.4, 2.5), rpm = clamp(rpmAt(v, i, 5.2), 2500, RED); F = Math.min(FLIM, (torque(rpm) * i * 5.2 * 0.88) / RW); }
      else { let rpm = rpmAt(v, GEARS[gi], fd); if (rpm >= RED && gi < GEARS.length - 1) { gi++; hold = ts; rpm = rpmAt(v, GEARS[gi], fd); } F = Math.min(FLIM, force(Math.max(rpm, 2500), GEARS[gi], fd)); if (hold > 0) { hold -= dt; if (mode === 'manual') F = 0; } }
      v += ((F - resist(v)) / MASS) * dt; t += dt; if (Math.round(t / dt) % 10 === 0) tr.push([t, v * 3.6]); }
    return { t, tr }; }
  function topSpeed(fd) { let best = 0; for (const g of GEARS) for (let rpm = 2000; rpm <= RED; rpm += 20) { const v = speedAt(rpm, g, fd); if (force(rpm, g, fd) >= resist(v) && v > best) best = v; } return best; }
  const CC = 0.16;
  const beltLen = (r1, r2, C = CC) => 2 * C + PI * (r1 + r2) + (r2 - r1) ** 2 / C;
  const BELT = beltLen(0.052, 0.052);
  function pulleys(ratio) { let a = 0.01, b = 0.1; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (beltLen(m, m * ratio) < BELT) a = m; else b = m; } const r1 = (a + b) / 2; return { r1, r2: r1 * ratio }; }
  const M = { TRACK, RW, MASS, GEARS, RED, FLIM, wheelSpeeds, spiderSpin, openTorque, torque, power, peakPowerRpm, speedAt, rpmAt, force, resist, accel, topSpeed, beltLen, BELT, pulleys, CC };
  (window.LabModels = window.LabModels || {})['car-transmissions'] = M;

  /* ================= 1. the differential (3D) ================= */
  function bevel(S, rBig, rSmall, h, n, mat) { const TH = S.THREE, g = new TH.Group(); const body = new TH.Mesh(new TH.CylinderGeometry(rSmall, rBig, h, 40).rotateZ(-PI / 2), mat); body.castShadow = true; g.add(body); const sl = Math.atan2(rBig - rSmall, h), len = Math.hypot(rBig - rSmall, h) * 0.92; for (let k = 0; k < n; k++) { const a = (k / n) * TAU, tooth = new TH.Mesh(new TH.BoxGeometry(len, ((TAU * (rBig + rSmall)) / 2 / n) * 0.5, 0.16), mat), piv = new TH.Group(); tooth.position.set(0, 0, (rBig + rSmall) / 2 + 0.05); tooth.rotation.y = sl; piv.rotation.x = a; piv.add(tooth); g.add(piv); } return g; }
  function buildDiff(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // half-shafts along x; drive shaft along -y
    const steel = S.mat('#c9cdd3', { metal: 1, rough: 0.28 }), dark = S.mat('#6f757d', { metal: 1, rough: 0.4 }), bronze = S.mat('#b58a4a', { metal: 1, rough: 0.35 }), blue = S.mat('#3f6fb5', { metal: 0.7, rough: 0.4 }), red = S.mat('#b8432a', { metal: 0.7, rough: 0.4 }), rubber = S.mat('#1b1c1f', { rough: 0.85, coat: 0 }), cage = S.mat('#8f959d', { metal: 1, rough: 0.45, opacity: 0.35, side: 2 });
    const carrier = new TH.Group(); g.add(carrier);
    { const ring = bevel(S, 2.3, 2.0, 0.4, 44, dark); ring.position.x = -1.25; carrier.add(ring); const cg = new TH.Mesh(new TH.CylinderGeometry(1.25, 1.25, 2.3, 40, 1, true).rotateZ(PI / 2), cage); carrier.add(cg); const pin = new TH.Mesh(new TH.CylinderGeometry(0.09, 0.09, 2.5, 14), steel); carrier.add(pin); for (const s of [-1, 1]) { const end = new TH.Mesh(new TH.RingGeometry(0.3, 1.25, 40).rotateY(PI / 2), cage); end.position.x = s * 1.15; carrier.add(end); } }
    const spiders = [-1, 1].map((s) => { const sp = bevel(S, 0.62, 0.36, 0.34, 10, bronze), hold = new TH.Group(); sp.rotation.z = (s * PI) / 2 + PI; hold.position.y = s * 0.92; hold.add(sp); carrier.add(hold); return { sp, s }; });
    const sides = [-1, 1].map((s) => { const sh = new TH.Group(); const gear = bevel(S, 0.95, 0.6, 0.36, 16, s < 0 ? blue : red); gear.rotation.y = s < 0 ? 0 : PI; gear.position.x = s * 0.72; sh.add(gear); const shaft = new TH.Mesh(new TH.CylinderGeometry(0.17, 0.17, 4.6, 18).rotateZ(PI / 2), steel); shaft.position.x = s * 3.1; shaft.castShadow = true; sh.add(shaft);
      const tyre = new TH.Mesh(new TH.TorusGeometry(1.35, 0.42, 14, 40).rotateY(PI / 2), rubber); tyre.position.x = s * 5.4; tyre.castShadow = true; sh.add(tyre); const rim = new TH.Mesh(new TH.CylinderGeometry(1.0, 1.0, 0.3, 30).rotateZ(PI / 2), steel); rim.position.x = s * 5.4; sh.add(rim); const mk = new TH.Mesh(new TH.BoxGeometry(0.9, 0.16, 2.6), s < 0 ? blue : red); mk.position.x = s * 5.4; sh.add(mk); g.add(sh); return sh; });
    const pin = new TH.Group(); { const pg = bevel(S, 0.62, 0.42, 0.4, 12, steel); pg.rotation.z = PI / 2; pin.add(pg); const sh = new TH.Mesh(new TH.CylinderGeometry(0.16, 0.16, 3.4, 16), steel); sh.position.y = -1.9; pin.add(sh); } pin.position.set(-1.0, -2.55, 0); g.add(pin);
    S.add(g);
    return { carrier, spiders, sides, pin };
  }
  D['differential'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const wc = v.v / 3.6 / RW, ws = wheelSpeeds(wc, v.R), ice = v.ice > 0, wL = ice ? 2 * wc : ws.inner, wR = ice ? 0 : ws.outer, rpm = (w) => (w * 60) / TAU; st.w = { wc, wL, wR };
      L.setText(st.cap1, T(tx`An open differential with its casing made see-through. The drive shaft turns the large ring gear and, with it, the cage that carries two small bronze gears on a cross pin. Those two mesh with a gear on the end of each half-shaft (blue to the left wheel, red to the right). Driving straight, the small gears do not turn on their pin and everything goes round as one. In a corner they roll, letting one shaft run ahead of the cage by exactly as much as the other falls behind.`, tx`ケースを透明にした、オープンデフ（差動装置）です。駆動軸が大きなリングギアを回し、それと一緒に、十字の軸に付いた二つの小さな青銅色の歯車を運ぶかごを回します。この二つは、それぞれの車軸の端にある歯車（青が左輪、赤が右輪）とかみ合っています。直進中、小さな歯車は軸の上で回らず、全体が一体となって回ります。カーブでは小さな歯車が転がり、一方の車軸がかごより進んだ分だけ、もう一方が遅れます。`));
      L.setText(st.cap2, T(tx`Speed of each driven wheel against the radius of the turn, at \(${fmt(v.v, 0)}\) km/h. The wheel on the outside has further to go and must turn faster; the inside one slower. Their average (dashed) is always the speed of the cage. Drag the gold point.`, tx`それぞれの駆動輪の回転数を、カーブの半径に対して、時速 \(${fmt(v.v, 0)}\) km の場合について描いています。外側の車輪は長い距離を進むので速く、内側は遅く回らなければなりません。その平均（破線）は、常にかごの回転数です。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [3, 40], y: [0, rpm(wc) * 1.5], aspect: 0.8, maxH: 400, xlabel: T('radius of the turn (m)', 'カーブの半径（m）'), ylabel: T('wheel speed (rpm)', '車輪の回転数（rpm）') });
      g.hline(rpm(wc), { c: 'muted', dash: '5 4' }); g.line(L.sample(3, 40, 80, (R) => rpm(wheelSpeeds(wc, R).inner)), { c: 'c1', w: 2.6 }); g.line(L.sample(3, 40, 80, (R) => rpm(wheelSpeeds(wc, R).outer)), { c: 'c2', w: 2.6 });
      g.handle(v.R, rpm(ws.outer), { c: 'hl', axis: 'x', bounds: [3, 40, 0, rpm(wc) * 1.5], label: T('radius of the turn', 'カーブの半径'), onDrag: (x) => ctx.set('R', clamp(Math.round(x), 3, 40)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('inside wheel (left)', '内側の車輪（左）') }, { c: 'c2', label: T('outside wheel (right)', '外側の車輪（右）') }, { c: 'muted', dash: true, label: T('cage', 'かご') }]);
      ctx.readout([
        { k: T('cage and ring gear', 'かごとリングギア'), v: tx`\(${fmt(rpm(wc), 0)}\ \mathrm{rpm}\)` },
        { k: T('left wheel, right wheel', '左輪、右輪'), v: tx`\(${fmt(rpm(wL), 0)},\ ${fmt(rpm(wR), 0)}\ \mathrm{rpm}\)`, tone: 'key' },
        { k: T('difference', '差'), v: tx`\(${fmt(rpm(Math.abs(wR - wL)), 0)}\ \mathrm{rpm}\ (${fmt((100 * Math.abs(wR - wL)) / (2 * wc), 0)}\ \%)\)` },
        { k: T('small gears turn on their pin at', '小さな歯車が軸の上で回る速さ'), v: tx`\(${fmt(rpm(Math.abs(spiderSpin(wR, wL))), 0)}\ \mathrm{rpm}\)` },
        { k: T('torque to each wheel', 'それぞれの車輪へのトルク'), v: T(ice ? 'only what the ice can take' : 'half each', ice ? '氷が受けられる分だけ' : '半分ずつ'), tone: ice ? 'warn' : 'good' },
      ], T(ice ? 'With one wheel on ice the cage turns but the gripping wheel does not. The spinning wheel takes all the motion, and because the two torques are always equal, the wheel with grip gets no more push than the ice can resist.' : 'The differential splits torque equally whatever the speeds. That is what lets a car corner without scrubbing a tyre, and also what strands it when one wheel loses grip.', ice ? '片方の車輪が氷の上にあると、かごは回っても、グリップしている車輪は回りません。空転する車輪がすべての動きを受け持ちます。二つのトルクは常に等しいので、グリップしている車輪には、氷が支えられる以上の力は伝わりません。' : 'デフは、回転数にかかわらず、トルクを等しく分けます。そのおかげで、車はタイヤを引きずらずに曲がれます。同時に、片方の車輪がグリップを失うと動けなくなる原因でもあります。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.8, maxH: 540, camera: [9, -18.5, 10], target: [0, 0, -0.2], fov: 30,
        label: T('3D open differential turning two wheels. Drag to rotate.', '二つの車輪を回すオープンデフの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.df = buildDiff(S); st.a = { c: 0, l: 0, r: 0 };
          S.label(T('ring gear', 'リングギア'), [-1.3, 0, 2.9], { small: true }); S.label(T('drive shaft', '駆動軸'), [-1.0, -5.2, 0.5], { small: true }); S.label(T('left wheel', '左輪'), [-5.4, 0, 2.4], { small: true }); S.label(T('right wheel', '右輪'), [5.4, 0, 2.4], { small: true });
          const draw = (dt) => { const m = st.df, q = st.w, k = 2.2 / Math.max(q.wc, 1e-6); st.a.c += q.wc * k * dt; st.a.l += q.wL * k * dt; st.a.r += q.wR * k * dt;
            m.carrier.rotation.x = st.a.c; m.sides[0].rotation.x = st.a.l; m.sides[1].rotation.x = st.a.r; const rel = (st.a.r - st.a.c) * (16 / 10); m.spiders.forEach((p) => { p.sp.parent.rotation.y = p.s * rel; }); m.pin.rotation.y = -st.a.c * (44 / 12); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-7, 7], y: [-4, 4], equal: true, maxH: 300, axes: false, grid: false }); f2.rect(-1.25, -1.25, 2.5, 2.5, { c: 'ink', fill: 'grid', fo: 0.4, w: 1.4 }); f2.rect(-1.6, -2.3, 0.4, 4.6, { c: 'ink', fill: 'ink', fo: 0.5 }); f2.seg(-6, 0, -0.9, 0, { c: 'c1', w: 5 }); f2.seg(0.9, 0, 6, 0, { c: 'c2', w: 5 }); f2.rect(-6.2, -1.7, 0.8, 3.4, { c: 'ink', fill: 'ink', fo: 0.8 }); f2.rect(5.4, -1.7, 0.8, 3.4, { c: 'ink', fill: 'ink', fo: 0.8 }); },
      });
    },
  };

  /* ================= 2. gears: manual and dual-clutch ================= */
  D['gearbox'] = {
    render(ctx, v) {
      const gi = clamp(Math.round(v.gear), 1, 5) - 1, man = accel('manual', v.fd, v.ts), dct = accel('dct', v.fd, v.ts), vt = topSpeed(v.fd);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Push at the driven wheels against road speed in each of five gears, with the force that air and tyres resist with (dashed). An engine gives much the same torque at any speed, so a low gear, which turns the wheels slowly, multiplies it into a large push over a short range of speed, and each higher gear trades push for range. The car stops gaining speed where push meets resistance. Drag the gold point to change gear.`, tx`駆動輪を押す力を、5 段それぞれについて、速度に対して描いています。破線は、空気とタイヤの抵抗です。エンジンのトルクは、どの回転数でもほぼ同じです。車輪をゆっくり回す低いギアは、トルクを大きな力に変えますが、使える速度の範囲は狭くなります。ギアを上げるごとに、力と引き換えに範囲が広がります。押す力と抵抗が等しくなるところで、車はそれ以上加速しません。金色の点をドラッグして、ギアを変えてください。`));
      const a = L.fig(c1, { x: [0, 220], y: [0, 9], aspect: 0.7, maxH: 350, xlabel: T('road speed (km/h)', '速度（km/h）'), ylabel: T('push at the wheels (kN)', '車輪を押す力（kN）') });
      a.hline(FLIM / 1000, { c: 'muted', dash: '2 4' }); a.line(L.sample(0, 220, 80, (q) => resist(q / 3.6) / 1000), { c: 'c2', w: 2, dash: '5 4' });
      GEARS.forEach((g, i) => a.line(L.sample(IDLE, RED, 40, (r) => 0).map((_, k) => { const r = IDLE + ((RED - IDLE) * k) / 39; return [speedAt(r, g, v.fd) * 3.6, force(r, g, v.fd) / 1000]; }).filter((q) => q[0] <= 220), { c: i === gi ? 'c1' : 'muted', w: i === gi ? 2.8 : 1.4 }));
      a.handle(speedAt(4000, GEARS[gi], v.fd) * 3.6, force(4000, GEARS[gi], v.fd) / 1000, { c: 'hl', axis: 'x', bounds: [0, 220, 0, 9], label: T('gear', 'ギア'), onDrag: (x) => { let b = 0, bd = 1e9; GEARS.forEach((g, i) => { const d = Math.abs(speedAt(4000, g, v.fd) * 3.6 - x); if (d < bd) { bd = d; b = i; } }); ctx.set('gear', b + 1); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Speed against time from rest, flat out, changing up at the red line. With one clutch (red) the engine is disconnected for \(${fmt(v.ts, 1)}\) s at every change and the car coasts. A dual-clutch box (blue) has the next gear already engaged on a second shaft and swaps clutches, so the push never stops.`, tx`停止状態から全開で加速し、レッドゾーンでシフトアップしたときの、速度と時間の関係です。クラッチが一つの場合（赤）、変速のたびにエンジンが \(${fmt(v.ts, 1)}\) 秒間切り離され、車は惰性で進みます。デュアルクラッチ式（青）は、次のギアを第二の軸ですでにかみ合わせていて、クラッチを切り替えるだけなので、押す力が途切れません。`));
      const b = L.fig(c2, { x: [0, Math.ceil(man.t + 1)], y: [0, 110], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('speed (km/h)', '速度（km/h）') });
      b.hline(100, { c: 'muted', dash: '4 4' }); b.line(man.tr, { c: 'c2', w: 2.4 }); b.line(dct.tr, { c: 'c1', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('selected gear; dual clutch', '選んだギア、デュアルクラッチ') }, { c: 'c2', label: T('resistance; single clutch', '抵抗、クラッチ一つ') }, { c: 'muted', label: T('other gears; grip limit', 'ほかのギア、グリップの限界') }]);
      ctx.readout([
        { k: T('gear ' + (gi + 1) + ': overall ratio', (gi + 1) + ' 速：総減速比'), v: tx`\(${fmt(GEARS[gi], 2)}\times${fmt(v.fd, 2)}=${fmt(GEARS[gi] * v.fd, 2)}\)` },
        { k: T('speed at the red line', 'レッドゾーンでの速度'), v: tx`\(${fmt(speedAt(RED, GEARS[gi], v.fd) * 3.6, 0)}\ \mathrm{km/h}\)`, tone: 'key' },
        { k: T('push at peak torque', '最大トルクでの押す力'), v: tx`\(${fmt(force(4000, GEARS[gi], v.fd) / 1000, 2)}\ \mathrm{kN}\)` },
        { k: T('engine speed at 100 km/h in fifth', '5 速、時速 100 km での回転数'), v: tx`\(${fmt(rpmAt(100 / 3.6, GEARS[4], v.fd), 0)}\ \mathrm{rpm}\)` },
        { k: T('0 to 100 km/h: single, dual clutch', '時速 0 から 100 km：クラッチ一つ、デュアル'), v: tx`\(${fmt(man.t, 1)},\ ${fmt(dct.t, 1)}\ \mathrm{s}\)`, tone: 'good' },
        { k: T('top speed', '最高速度'), v: tx`\(${fmt(vt * 3.6, 0)}\ \mathrm{km/h}\)` },
      ], T('In first gear the engine could push harder than the tyres can grip, so the start is limited by the road, not the gearbox.', '1 速では、エンジンはタイヤがグリップできる以上の力を出せるので、発進を制限するのは変速機ではなく路面です。'));
    },
  };

  /* ================= 3. the CVT ================= */
  D['cvt-variator'] = {
    render(ctx, v) {
      const p = pulleys(v.ratio), cvt = accel('cvt'), dct = accel('dct', 3.9, 0.3), pk = peakPowerRpm;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A continuously variable transmission seen end on. Each pulley is a pair of cones that can be squeezed together or let apart, so that the belt rides nearer the rim or nearer the hub. The belt has a fixed length, so as the driving pulley (blue) grows the driven one (red) must shrink, and every ratio between the two extremes is available. Drag the gold point.`, tx`無段変速機（CVT）を、軸方向から見た図です。それぞれのプーリーは一対の円すいで、押し合わせたり離したりすることで、ベルトが縁の近くや軸の近くを走ります。ベルトの長さは一定なので、駆動側のプーリー（青）が大きくなると、従動側（赤）は小さくならなければならず、両端の間のあらゆる変速比が使えます。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [-11, 27], y: [-12, 12], equal: true, aspect: 0.65, maxH: 340, axes: false, grid: false });
      const r1 = p.r1 * 100, r2 = p.r2 * 100, C = CC * 100, th = Math.asin((r2 - r1) / C);
      a.circle(0, 0, 9.5, { c: 'muted', fill: 'grid', fo: 0.25, w: 1 }); a.circle(C, 0, 9.5, { c: 'muted', fill: 'grid', fo: 0.25, w: 1 }); a.circle(0, 0, r1, { c: 'c1', fill: 'c1', fo: 0.3, w: 2 }); a.circle(C, 0, r2, { c: 'c2', fill: 'c2', fo: 0.3, w: 2 });
      for (const s of [-1, 1]) a.seg(-r1 * Math.sin(th), s * r1 * Math.cos(th), C - r2 * Math.sin(th), s * r2 * Math.cos(th), { c: 'ink', w: 3 });
      a.line(L.sample(PI / 2 + th, (3 * PI) / 2 - th, 40, (u) => 0).map((_, i) => { const u = PI / 2 + th + ((PI - 2 * th) * i) / 39; return [r1 * Math.cos(u), r1 * Math.sin(u)]; }), { c: 'ink', w: 3 }); a.line(L.sample(0, 1, 40, (u) => 0).map((_, i) => { const u = -PI / 2 - th + ((PI + 2 * th) * i) / 39; return [C + r2 * Math.cos(u), r2 * Math.sin(u)]; }), { c: 'ink', w: 3 });
      a.handle(0, r1, { c: 'hl', axis: 'y', bounds: [-11, 27, 2.5, 9], label: T('driving pulley', '駆動側のプーリー'), onDrag: (x, y) => { let b = v.ratio, bd = 1e9; for (let q = 0.4; q <= 2.501; q += 0.05) { const d = Math.abs(pulleys(q).r1 * 100 - y); if (d < bd) { bd = d; b = q; } } ctx.set('ratio', Math.round(b * 20) / 20); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Engine speed against road speed, accelerating flat out. A box with fixed gears (red) drags the engine up and down through its range, passing its best speed only for a moment in each gear. The CVT (blue) lets the engine climb to \(${fmt(pk, 0)}\) rpm, where it makes most power, and holds it there while the ratio does all the changing.`, tx`全開で加速するときのエンジンの回転数を、速度に対して描いています。段のある変速機（赤）は、エンジンを回転数の範囲の中で上下させ、最も良い回転数は、それぞれのギアで一瞬通過するだけです。CVT（青）は、エンジンを最大出力が出る毎分 \(${fmt(pk, 0)}\) 回転まで上げ、そこに保ったまま、変速比だけを変えていきます。`));
      const b = L.fig(c2, { x: [0, 160], y: [0, 7], aspect: 0.65, maxH: 340, xlabel: T('road speed (km/h)', '速度（km/h）'), ylabel: T('engine speed (thousand rpm)', 'エンジンの回転数（千 rpm）') });
      b.hline(pk / 1000, { c: 'muted', dash: '4 4' }); const saw = []; GEARS.forEach((g, i) => { const v0 = i === 0 ? 0 : speedAt(RED, GEARS[i - 1], 3.9) * 3.6, v1 = Math.min(160, speedAt(RED, g, 3.9) * 3.6); saw.push([v0, Math.max(1, rpmAt(v0 / 3.6, g, 3.9) / 1000)], [v1, rpmAt(v1 / 3.6, g, 3.9) / 1000]); }); b.line(saw, { c: 'c2', w: 2 });
      b.line(L.sample(0, 160, 160, (q) => { const need = ((pk * TAU) / 60) * RW / Math.max(q / 3.6, 0.1) / 5.2, i = clamp(need, 0.4, 2.5); return clamp(rpmAt(q / 3.6, i, 5.2), 2500, RED) / 1000; }), { c: 'c1', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('driving pulley; CVT', '駆動側のプーリー、CVT') }, { c: 'c2', label: T('driven pulley; five fixed gears', '従動側のプーリー、5 段の変速機') }, { c: 'muted', dash: true, label: T('speed of most power', '最大出力の回転数') }]);
      ctx.readout([
        { k: T('ratio (engine turns per turn out)', '変速比（出力 1 回転あたりの入力の回転）'), v: tx`\(${fmt(v.ratio, 2)}\)`, tone: 'key' },
        { k: T('belt runs at radius: driving, driven', 'ベルトが走る半径：駆動側、従動側'), v: tx`\(${fmt(r1 * 10, 0)},\ ${fmt(r2 * 10, 0)}\ \mathrm{mm}\)` },
        { k: T('length of the belt', 'ベルトの長さ'), v: tx`\(${fmt(BELT * 1000, 0)}\ \mathrm{mm}\)` },
        { k: T('span of ratios', '変速比の幅'), v: tx`\(2.5/0.4=${fmt(2.5 / 0.4, 2)}\)` },
        { k: T('most power, at', '最大出力とその回転数'), v: tx`\(${fmt(power(pk) / 1000, 0)}\ \mathrm{kW},\ ${fmt(pk, 0)}\ \mathrm{rpm}\)` },
        { k: T('0 to 100 km/h: CVT, dual clutch', '時速 0 から 100 km：CVT、デュアルクラッチ'), v: tx`\(${fmt(cvt.t, 1)},\ ${fmt(dct.t, 1)}\ \mathrm{s}\)`, tone: 'good' },
      ], T('The CVT keeps the engine at its best speed but loses more in the belt, about 12 per cent here against 5 for gears, so the two finish close together. Its real gain is in ordinary driving, where it can hold the engine at its most economical speed.', 'CVT は、エンジンを最も良い回転数に保ちますが、ベルトでの損失が大きく、ここでは歯車の 5 % に対して約 12 % です。そのため、両者の結果は近くなります。本当の利点は普段の走行にあり、エンジンを最も燃費の良い回転数に保てます。'));
    },
  };
})();
