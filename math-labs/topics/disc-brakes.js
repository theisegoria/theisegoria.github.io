'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, G = 9.80665, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Hydraulics: pedal force x lever ratio x booster gain on a master cylinder gives line pressure; that pressure on a
   * caliper piston clamps two pads, each with friction mu, at an effective radius on the disc.
   *   torque per front wheel = 2 mu p A_cal r_eff. The front axle does 70 per cent of the braking.
   * Heat: each front disc takes 35 per cent of the kinetic energy; cooling is exponential with time constant TAU_C.
   * Pad friction fades linearly from 0.4 at 400 C to 0.2 at 700 C.
   * Tyre: mu(s) = D sin(C atan(B s)) for slip s between 0 (rolling) and 1 (locked).
   * Stop: one wheel carrying a quarter of the car, I w' = mu N r - T, v' = -mu g, with or without an ABS that
   * releases pressure above 20 per cent slip and reapplies it below 12.
   */
  const MASS = 1300, RW = 0.31, REFF = 0.12, BOOST = 4, FRONT = 0.7, MDISC = 6, CIRON = 460, TAU_C = 120, IW = 1.2;
  const linePressure = (pedal, ratio, mcMm) => (pedal * ratio * BOOST) / (PI * (mcMm / 2000) ** 2);              // Pa
  const clampForce = (p, calMm) => p * PI * (calMm / 2000) ** 2;                                                 // N on each pad
  const wheelTorque = (p, calMm, mu) => 2 * mu * clampForce(p, calMm) * REFF;
  const brakeForce = (p, calMm, mu) => ((2 * wheelTorque(p, calMm, mu)) / RW) / FRONT;                           // whole car, N
  const decel = (p, calMm, mu, grip = 1) => Math.min(brakeForce(p, calMm, mu) / MASS, grip * G);
  const stopEnergy = (kmh, mass = MASS) => 0.5 * mass * (kmh / 3.6) ** 2;
  const discRise = (kmh, mass = MASS, mdisc = MDISC) => (0.5 * FRONT * stopEnergy(kmh, mass)) / (mdisc * CIRON);
  const padMu = (Tc) => (Tc <= 400 ? 0.4 : Tc >= 700 ? 0.2 : 0.4 - (0.2 * (Tc - 400)) / 300);
  function repeatStops(kmh, gap, n = 10, mdisc = MDISC, Ta = 20) { let Tc = Ta; const tr = [[0, Tc]], peaks = []; for (let i = 0; i < n; i++) { Tc += discRise(kmh, MASS, mdisc); peaks.push(Tc); tr.push([i * gap, Tc]); for (let k = 1; k <= 20; k++) { const t = (gap * k) / 20; tr.push([i * gap + t, Ta + (Tc - Ta) * Math.exp(-t / TAU_C)]); } Tc = Ta + (Tc - Ta) * Math.exp(-gap / TAU_C); } return { tr, peaks, steady: Ta + discRise(kmh, MASS, mdisc) / (1 - Math.exp(-gap / TAU_C)) }; }
  const ROADS = [{ D: 1.0, B: 12, C: 1.6 }, { D: 0.7, B: 10, C: 1.7 }, { D: 0.15, B: 20, C: 1.5 }];
  const tyreMu = (s, road) => { const r = ROADS[road]; return r.D * Math.sin(r.C * Math.atan(r.B * clamp(s, 0, 1))); };
  const peakSlip = (road) => Math.tan(PI / (2 * ROADS[road].C)) / ROADS[road].B;
  function stop(kmh, road, abs, dt = 0.001) { let v = kmh / 3.6, w = v / RW, x = 0, t = 0, Tq = 0, k = 0, sSum = 0, n = 0; const N = (MASS * G) / 4, Td = 3000, tr = [];
    while (v > 0.3 && t < 60) { const s = clamp((v - w * RW) / Math.max(v, 0.5), 0, 1), mu = tyreMu(s, road); if (abs && v > 2) { if (s > 0.2) Tq -= 40000 * dt; else if (s < 0.12) Tq += 15000 * dt; } else Tq += 15000 * dt; Tq = clamp(Tq, 0, Td);
      w = clamp(w + ((mu * N * RW - Tq) / IW) * dt, 0, v / RW); v -= mu * G * dt; x += v * dt; t += dt; sSum += s; n++; if (k++ % 10 === 0) tr.push({ t, v: v * 3.6, vw: w * RW * 3.6, s }); }
    return { x, t, tr, meanSlip: sSum / n }; }
  const idealStop = (kmh, road) => (kmh / 3.6) ** 2 / (2 * tyreMu(peakSlip(road), road) * G);
  const M = { MASS, RW, REFF, BOOST, FRONT, linePressure, clampForce, wheelTorque, brakeForce, decel, stopEnergy, discRise, padMu, repeatStops, tyreMu, peakSlip, stop, idealStop, ROADS };
  (window.LabModels = window.LabModels || {})['disc-brakes'] = M;

  /* ================= 1. pedal to pad (3D) ================= */
  function buildBrake(S) {
    const TH = S.THREE, g = new TH.Group();                                                          // 1 unit = 100 mm; axle along x, inboard is +x
    const iron = S.mat('#7b8088', { metal: 1, rough: 0.42 }), steel = S.mat('#cfd3d8', { metal: 1, rough: 0.25 }), red = S.mat('#b8432a', { metal: 0.5, rough: 0.45, opacity: 0.4 }), redS = S.mat('#b8432a', { metal: 0.5, rough: 0.45 }), pad = S.mat('#2b2622', { rough: 0.95, coat: 0 }), fluid = S.mat('#d9a441', { rough: 0.1, coat: 1, opacity: 0.6 }), hose = S.mat('#1b1c1f', { rough: 0.7 });
    const disc = new TH.Group(); g.add(disc);
    const faces = [-0.11, 0.11].map((x) => { const m = new TH.Mesh(new TH.CylinderGeometry(1.5, 1.5, 0.07, 64).rotateZ(PI / 2), iron.clone()); m.position.x = x; m.castShadow = true; disc.add(m); return m; });
    for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU, vane = new TH.Mesh(new TH.BoxGeometry(0.15, 0.05, 0.62), iron), pv = new TH.Group(); vane.position.z = 1.17; pv.rotation.x = a; pv.add(vane); disc.add(pv); }
    { const hat = new TH.Mesh(new TH.CylinderGeometry(0.75, 0.75, 0.45, 40).rotateZ(PI / 2), iron); hat.position.x = -0.3; disc.add(hat); for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU, st = new TH.Mesh(new TH.CylinderGeometry(0.05, 0.05, 0.5, 10).rotateZ(PI / 2), steel); st.position.set(-0.7, 0.5 * Math.cos(a), 0.5 * Math.sin(a)); disc.add(st); } const ax = new TH.Mesh(new TH.CylinderGeometry(0.22, 0.22, 2.4, 20).rotateZ(PI / 2), steel); ax.position.x = 0.9; disc.add(ax); }
    // caliper at the top: outer fingers, bridge, see-through cylinder body, piston, fluid, pads
    const cal = new TH.Group(); cal.position.z = 1.12; g.add(cal);
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; cal.add(m); return m; };
    box(0.22, 1.5, 0.75, -0.48, 0, 0, redS); box(1.5, 1.5, 0.2, 0.2, 0, 0.52, redS); box(0.9, 1.5, 0.95, 0.85, 0, 0, red).castShadow = false;
    const padIn = new TH.Group(), padOut = new TH.Group(); cal.add(padIn, padOut);
    for (const [gp, sgn] of [[padIn, 1], [padOut, -1]]) { const fr = new TH.Mesh(new TH.BoxGeometry(0.11, 1.25, 0.62), pad); fr.position.x = sgn * 0.055; const bk = new TH.Mesh(new TH.BoxGeometry(0.05, 1.3, 0.68), steel); bk.position.x = sgn * 0.135; gp.add(fr, bk); }
    const piston = new TH.Mesh(new TH.CylinderGeometry(0.27, 0.27, 0.45, 32).rotateZ(PI / 2), steel); cal.add(piston);
    const oil = new TH.Mesh(new TH.CylinderGeometry(0.265, 0.265, 1, 32).rotateZ(PI / 2), fluid); cal.add(oil);
    { const t = S.tube([[1.3, 0, 1.12], [1.7, 0, 1.3], [2.1, 0.3, 1.9], [2.2, 0.8, 2.8]], { r: 0.05, add: false, radial: 8, segments: 40 }); t.material = hose; g.add(t); }
    S.add(g);
    return { disc, faces, padIn, padOut, piston, oil };
  }
  D['brake-caliper'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const p = linePressure(v.pedal, v.ratio, v.mc), Fc = clampForce(p, v.cal), Tq = wheelTorque(p, v.cal, v.mu), a = decel(p, v.cal, v.mu), raw = brakeForce(p, v.cal, v.mu) / MASS; st.a = a;
      L.setText(st.cap1, T(tx`A front disc brake with the body of its caliper made see-through. Fluid from the pedal (amber) pushes a piston \(${fmt(v.cal, 0)}\) mm across against the inner pad. The caliper is free to slide, so as the piston pushes one way the caliper is pulled the other and its outer fingers press the second pad against the far face. The disc, with cooling vanes between its two faces, turns with the wheel and glows as it takes up the car's energy.`, tx`キャリパーの本体を透明にした、前輪のディスクブレーキです。ペダルからの液（琥珀色）が、直径 \(${fmt(v.cal, 0)}\) mm のピストンを内側のパッドに押し付けます。キャリパーは自由に滑るので、ピストンが一方に押すと、キャリパーは反対側に引かれ、外側の爪が二つ目のパッドを反対の面に押し付けます。二つの面の間に冷却用の羽根を持つディスクは、車輪と一緒に回り、車のエネルギーを受け取って赤く光ります。`));
      L.setText(st.cap2, T(tx`How hard the car slows against the push on the pedal. The line is straight because every stage multiplies: lever, booster, the ratio of the two piston areas, and the friction of the pads. It stops rising at about 1 \(g\), where dry tyres run out of grip. Drag the gold point.`, tx`車の減速の強さを、ペダルを踏む力に対して描いています。てこ、倍力装置、二つのピストンの面積の比、パッドの摩擦と、どの段階も掛け算なので、線はまっすぐです。乾いた路面でタイヤのグリップが尽きる約 1 \(g\) で、それ以上は上がりません。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 400], y: [0, 1.4], aspect: 0.8, maxH: 400, xlabel: T('push on the pedal (N)', 'ペダルを踏む力（N）'), ylabel: T('slowing (× gravity)', '減速（重力の倍数）') });
      g.hline(1, { c: 'muted', dash: '5 4' }); g.line(L.sample(0, 400, 80, (q) => Math.min(1.4, brakeForce(linePressure(q, v.ratio, v.mc), v.cal, v.mu) / MASS / G)), { c: 'muted', w: 1.3 }); g.line(L.sample(0, 400, 80, (q) => decel(linePressure(q, v.ratio, v.mc), v.cal, v.mu) / G), { c: 'c1', w: 2.8 });
      g.handle(v.pedal, a / G, { c: 'hl', axis: 'x', bounds: [0, 400, 0, 1.4], label: T('push on the pedal', 'ペダルを踏む力'), onDrag: (x) => ctx.set('pedal', clamp(Math.round(x / 10) * 10, 20, 400)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('slowing of the car', '車の減速') }, { c: 'muted', label: T('what the brakes ask for; limit of grip', 'ブレーキが求める減速、グリップの限界') }]);
      ctx.readout([
        { k: T('pressure in the brake line', 'ブレーキ配管の圧力'), v: tx`\(${fmt(p / 1e5, 0)}\ \mathrm{bar}\)`, tone: 'key' },
        { k: T('each pad is pressed with', 'それぞれのパッドを押す力'), v: tx`\(${fmt(Fc / 1000, 1)}\ \mathrm{kN}\)` },
        { k: T('force multiplied from foot to pad', '足からパッドまでの力の倍率'), v: tx`\(\times${fmt(Fc / v.pedal, 0)}\)` },
        { k: T('braking torque on one front wheel', '前輪一つのブレーキトルク'), v: tx`\(${fmt(Tq, 0)}\ \mathrm{N\,m}\)` },
        { k: T('the car slows at', '車の減速'), v: tx`\(${fmt(a / G, 2)}\,g\)`, tone: raw > G ? 'warn' : 'good' },
        { k: T('from 100 km/h it stops in', '時速 100 km から止まるまでの距離'), v: tx`\(${fmt((100 / 3.6) ** 2 / (2 * a), 0)}\ \mathrm{m}\)` },
      ], T(raw > G ? 'The brakes are asking for more than the tyres can give. Without anti-lock control the wheels would stop turning and slide.' : 'The foot moves a long way with a small force; the pads move a fraction of a millimetre with an enormous one. The work is the same at both ends.', raw > G ? 'ブレーキは、タイヤが出せる以上の力を求めています。アンチロック制御がなければ、車輪は回転を止めて滑ります。' : '足は、小さな力で長い距離を動きます。パッドは、非常に大きな力で 1 ミリメートルに満たない距離を動きます。両端で、仕事は同じです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.95 : 0.85, maxH: 560, camera: [6.5, -6.5, 3.6], target: [0.25, 0, 0.3], fov: 30,
        label: T('3D disc brake with a see-through caliper. Drag to rotate.', '透明なキャリパーの付いたディスクブレーキの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.bk = buildBrake(S); st.w = 14; st.ang = 0; st.heat = 0; st.ph = 0;
          S.label(T('piston', 'ピストン'), [1.1, -0.9, 1.75], { small: true }); S.label(T('pads', 'パッド'), [-0.1, -0.95, 0.55], { small: true }); S.label(T('disc', 'ディスク'), [-0.2, 0, -1.75], { small: true }); S.label(T('fluid', '液'), [2.4, 0.8, 3.0], { small: true });
          const draw = (dt) => { const m = st.bk; st.ph += dt; const braking = st.ph > 1.6; if (braking) { st.w = Math.max(0, st.w - st.a * 1.6 * dt); st.heat = Math.min(1, st.heat + (st.w > 0 ? 0.5 * (st.a / G) * dt : 0)); } if (st.w === 0 && st.ph > 1.6 && (st.rest = (st.rest || 0) + dt) > 1.2) { st.ph = 0; st.rest = 0; st.w = 14; } if (!braking) st.heat = Math.max(0, st.heat - 0.4 * dt);
            st.ang += st.w * dt; m.disc.rotation.x = st.ang; const gap = braking ? 0 : 0.035; m.padIn.position.x = 0.145 + gap; m.padOut.position.x = -0.145 - gap; m.piston.position.x = 0.145 + gap + 0.16 + 0.225; const x0 = m.piston.position.x + 0.225, x1 = 1.28; m.oil.scale.x = Math.max(0.02, x1 - x0); m.oil.position.x = (x0 + x1) / 2;
            m.faces.forEach((f) => { if (f.material.emissive) { f.material.emissive.setRGB(1, 0.25, 0.05); f.material.emissiveIntensity = 1.2 * st.heat; } }); };
          st.draw = draw; draw(0);
          S.animate((dt) => { if (S.reduced()) return false; draw(Math.min(0.05, dt || 0.016)); return true; });
        },
        update(S) { st.draw(0); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-2, 2], y: [-2, 2.2], equal: true, maxH: 320, axes: false, grid: false }); f2.circle(0, 0, 1.5, { c: 'ink', fill: 'grid', fo: 0.6, w: 1.6 }); f2.circle(0, 0, 0.75, { c: 'ink', fill: 'none', w: 1.4 }); f2.rect(-0.75, 0.75, 1.5, 0.95, { c: 'c2', fill: 'c2', fo: 0.5 }); },
      });
    },
  };

  /* ================= 2. where the energy goes ================= */
  D['brake-heat'] = {
    render(ctx, v) {
      const rise = discRise(v.kmh, MASS, v.md), rs = repeatStops(v.kmh, v.gap, 10, v.md), hot = rs.peaks[rs.peaks.length - 1], E = stopEnergy(v.kmh);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Temperature of a front disc through ten hard stops from \(${fmt(v.kmh, 0)}\) km/h, one every \(${fmt(v.gap, 0)}\) s. Each stop turns the car's energy of motion into heat in a few seconds, and the disc can only shed it slowly to the passing air. If the next stop comes before the disc has cooled, the temperature ratchets upward toward the dashed level.`, tx`時速 \(${fmt(v.kmh, 0)}\) km からの強い制動を、\(${fmt(v.gap, 0)}\) 秒ごとに 10 回繰り返したときの、前輪のディスクの温度です。1 回の制動で、車の運動エネルギーが数秒で熱に変わります。ディスクは、その熱を、流れる空気にゆっくりとしか逃がせません。ディスクが冷える前に次の制動が来ると、温度は破線の高さに向かって段々に上がります。`));
      const ymax = Math.max(800, Math.ceil(hot / 100) * 100 + 100), a = L.fig(c1, { x: [0, 10 * v.gap], y: [0, ymax], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('disc temperature (°C)', 'ディスクの温度（°C）') });
      a.rect(0, 400, 10 * v.gap, ymax - 400, { c: 'c2', fill: 'c2', fo: 0.08, nostroke: true, layer: 'under' }); a.hline(Math.min(ymax, rs.steady), { c: 'muted', dash: '5 4' }); a.line(rs.tr.map((q) => [q[0], Math.min(ymax, q[1])]), { c: 'c1', w: 2.6 }); a.text(10 * v.gap * 0.98, 430, T('pads begin to fade', 'パッドの効きが落ち始める'), { small: true, anchor: 'end' });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Temperature rise of the disc in one stop against the speed it stops from. Energy of motion goes as the square of the speed, so stopping from twice as fast heats the disc four times as much. Drag the gold point.`, tx`1 回の制動でのディスクの温度上昇を、制動を始める速度に対して描いています。運動エネルギーは速度の 2 乗に比例するので、2 倍の速度から止まると、ディスクは 4 倍温まります。金色の点をドラッグしてください。`));
      const b = L.fig(c2, { x: [0, 250], y: [0, 500], aspect: 0.7, maxH: 350, xlabel: T('speed before braking (km/h)', '制動前の速度（km/h）'), ylabel: T('rise in one stop (K)', '1 回の制動での上昇（K）') });
      b.line(L.sample(0, 250, 80, (q) => Math.min(500, discRise(q, MASS, v.md))), { c: 'c2', w: 2.8 });
      b.handle(v.kmh, Math.min(500, rise), { c: 'hl', axis: 'x', bounds: [30, 250, 0, 500], label: T('speed', '速度'), onDrag: (x) => ctx.set('kmh', clamp(Math.round(x / 10) * 10, 30, 250)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('disc temperature', 'ディスクの温度') }, { c: 'muted', dash: true, label: T('where repeated stops settle', '繰り返しで落ち着く温度') }, { c: 'c2', label: T('rise in one stop; fade zone', '1 回の制動での上昇、効きが落ちる範囲') }]);
      ctx.readout([
        { k: T('energy of motion', '運動エネルギー'), v: tx`\(${fmt(E / 1000, 0)}\ \mathrm{kJ}\)` },
        { k: T('into each front disc', '前輪のディスク一つあたり'), v: tx`\(${fmt((0.35 * E) / 1000, 0)}\ \mathrm{kJ}\)` },
        { k: T('rise in one stop', '1 回の制動での上昇'), v: tx`\(${fmt(rise, 0)}\ \mathrm{K}\)`, tone: 'key' },
        { k: T('after ten stops', '10 回の制動の後'), v: tx`\(${fmt(hot, 0)}\ ^\circ\mathrm{C}\)`, tone: hot > 400 ? 'warn' : 'good' },
        { k: T('pad friction then', 'そのときのパッドの摩擦係数'), v: tx`\(${fmt(padMu(hot), 2)}\)`, tone: padMu(hot) < 0.4 ? 'warn' : undefined },
        { k: T('average heating power in a 4 s stop', '4 秒の制動での平均の発熱'), v: tx`\(${fmt(E / 4000, 0)}\ \mathrm{kW}\)` },
      ], T(hot > 400 ? 'Hot enough for the resin in the pads to break down. The friction falls, the pedal has to be pushed harder for the same slowing, and the heat keeps coming.' : 'The disc has time to cool between stops. Brakes are sized by how much heat they can hold and shed, not by how hard they can squeeze.', hot > 400 ? 'パッドの樹脂が分解するほどの高温です。摩擦が下がり、同じ減速を得るにはペダルを強く踏まなければならず、熱は生じ続けます。' : 'ディスクには、制動の間に冷える時間があります。ブレーキの大きさは、どれだけ強く挟めるかではなく、どれだけの熱を蓄え、逃がせるかで決まります。'));
    },
  };

  /* ================= 3. anti-lock ================= */
  D['abs-slip'] = {
    render(ctx, v) {
      const road = v.road, on = stop(v.kmh, road, true), off = stop(v.kmh, road, false), ps = peakSlip(road), cur = v.abs > 0 ? on : off;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Grip of a tyre against how much it is slipping: 0 is rolling freely, 100 per cent is locked and sliding. Grip is greatest at about \(${fmt(ps * 100, 0)}\) per cent slip and falls beyond it, so past the peak a wheel that slows further is held back less by the road and stops turning within a few hundredths of a second. The gold point is the average slip during this stop.`, tx`タイヤのグリップを、滑りの度合いに対して描いています。0 は自由に転がっている状態、100 % はロックして滑っている状態です。グリップは約 \(${fmt(ps * 100, 0)}\) % の滑りで最大になり、それを超えると下がります。そのため、頂点を過ぎてさらに遅くなった車輪は、路面から受ける力が減り、100 分の数秒で回転が止まります。金色の点は、この制動での平均の滑りです。`));
      const a = L.fig(c1, { x: [0, 100], y: [0, 1.1], aspect: 0.7, maxH: 350, xlabel: T('slip (%)', '滑り（%）'), ylabel: T('grip (friction coefficient)', 'グリップ（摩擦係数）') });
      a.rect(12, 0, 8, 1.1, { c: 'c3', fill: 'c3', fo: 0.14, nostroke: true, layer: 'under' }); [0, 1, 2].filter((r) => r !== road).forEach((r) => a.line(L.sample(0, 100, 120, (q) => tyreMu(q / 100, r)), { c: 'muted', w: 1.3 })); a.line(L.sample(0, 100, 160, (q) => tyreMu(q / 100, road)), { c: 'c1', w: 2.8 }); a.dot(cur.meanSlip * 100, tyreMu(cur.meanSlip, road), { c: 'hl', r: 6 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Speed of the car (blue) and of the rim of its wheel (red) through a full-force stop, ${v.abs > 0 ? 'with' : 'without'} anti-lock control. With it, a valve lets pressure out of the brake whenever the wheel slows much faster than the car and lets it back in when the wheel recovers, many times a second, holding the tyre in the shaded band of slip. Without it the wheel locks at once and the car slides.`, tx`全力で制動したときの、車の速度（青）と車輪の外周の速度（赤）です。アンチロック制御は${v.abs > 0 ? 'あり' : 'なし'}です。制御があると、車輪が車よりずっと速く減速するたびに弁がブレーキの圧力を抜き、車輪が回復すると圧力を戻します。これを毎秒何回も繰り返し、タイヤを滑りの網かけの範囲に保ちます。制御がないと、車輪はすぐにロックし、車は滑ります。`));
      const tmax = Math.max(on.t, off.t) * 1.05, b = L.fig(c2, { x: [0, tmax], y: [0, v.kmh * 1.08], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（秒）'), ylabel: T('speed (km/h)', '速度（km/h）') });
      b.line((v.abs > 0 ? off : on).tr.map((q) => [q.t, q.v]), { c: 'muted', w: 1.3 }); b.line(cur.tr.map((q) => [q.t, q.vw]), { c: 'c2', w: 1.6 }); b.line(cur.tr.map((q) => [q.t, q.v]), { c: 'c1', w: 2.8 });
      L.legend(ctx.host, [{ c: 'c1', label: T('this road; car', 'この路面、車') }, { c: 'c2', label: T('wheel', '車輪') }, { c: 'muted', label: T('other roads; the car the other way', 'ほかの路面、もう一方の場合の車') }, { c: 'c3', label: T('band the control aims for', '制御が狙う範囲') }]);
      ctx.readout([
        { k: T('best grip, at slip', '最大のグリップとその滑り'), v: tx`\(${fmt(tyreMu(ps, road), 2)},\ ${fmt(ps * 100, 0)}\ \%\)` },
        { k: T('grip when locked', 'ロックしたときのグリップ'), v: tx`\(${fmt(tyreMu(1, road), 2)}\)` },
        { k: T('stops in, with anti-lock', '停止距離（制御あり）'), v: tx`\(${fmt(on.x, 1)}\ \mathrm{m}\)`, tone: 'key' },
        { k: T('stops in, wheels locked', '停止距離（車輪ロック）'), v: tx`\(${fmt(off.x, 1)}\ \mathrm{m}\)`, tone: 'warn' },
        { k: T('best possible', '理想的な停止距離'), v: tx`\(${fmt(idealStop(v.kmh, road), 1)}\ \mathrm{m}\)` },
        { k: T('still doing, where the other has stopped', 'もう一方が止まった地点での速度'), v: tx`\(${fmt(Math.sqrt(Math.max(0, 1 - on.x / off.x)) * v.kmh, 0)}\ \mathrm{km/h}\)` },
      ], T('The shorter stop is the lesser gain. A locked wheel slides the same in every direction and cannot steer; a wheel kept turning can still pull the car sideways round an obstacle.', '停止距離が短くなることは、利点の小さいほうです。ロックした車輪はどの向きにも同じように滑り、かじが利きません。回り続ける車輪は、障害物をよけるために車を横に引くことができます。'));
    },
  };
})();
