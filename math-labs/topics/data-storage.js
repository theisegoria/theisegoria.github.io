'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Hard disc: a 3.5 inch drive. Seek time for a move across a fraction d of the stroke, t = t_settle + (t_full - t_settle) sqrt(d)
   * (a voice-coil actuator accelerates for half the move and brakes for the other half, so time goes as the square root
   * of distance); mean rotational latency is half a revolution; with constant bits per millimetre of track the data rate
   * is proportional to radius.
   * Flash: n bits per cell are stored as 2^n levels of threshold voltage; each level is a Gaussian whose width grows with
   * wear and whose mean sags with retention time; a read compares against 2^n - 1 reference voltages and, with Gray
   * coding, each misread into a neighbouring level costs one bit.
   * Workloads: time to complete a number of random and sequential reads on a disc, a SATA SSD and an NVMe SSD.
   */
  const HDD = { rIn: 0.0205, rOut: 0.046, tSettle: 0.0008, tFull: 0.016, bitsPerM: 57.6e6 };
  const seekTime = (r1, r2) => { const d = Math.abs(r2 - r1) / (HDD.rOut - HDD.rIn); return d === 0 ? 0 : HDD.tSettle + (HDD.tFull - HDD.tSettle) * Math.sqrt(d); };
  const meanSeek = () => HDD.tSettle + (HDD.tFull - HDD.tSettle) * (8 / 15);          // E sqrt|x - y| for independent uniform x, y
  const latency = (rpm) => 0.5 * (60 / rpm);
  const dataRate = (r, rpm) => ((rpm / 60) * TAU * r * HDD.bitsPerM) / 8;              // bytes per second
  const hddIops = (rpm) => 1 / (meanSeek() + latency(rpm));
  // actuator geometry (metres): spindle at the origin, pivot P, head on an arm of length LA; angle of the arm for radius r
  const PIV = [0.056, -0.039], LA = 0.052;
  function armAngle(r) {
    const dP = Math.hypot(PIV[0], PIV[1]), base = Math.atan2(-PIV[1], -PIV[0]);        // direction from pivot to spindle
    const c = clamp((LA * LA + dP * dP - r * r) / (2 * LA * dP), -1, 1);
    return base + Math.acos(c);                                                         // head swings to the +y side of the pivot-spindle line
  }
  const headPos = (r) => { const a = armAngle(r); return [PIV[0] + LA * Math.cos(a), PIV[1] + LA * Math.sin(a)]; };

  // ---- NAND flash ----
  const erfc = (x) => { const z = Math.abs(x), t = 1 / (1 + 0.5 * z); const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; };
  const Qf = (x) => 0.5 * erfc(x / Math.SQRT2);                                         // Gaussian tail probability
  const SIG0 = [0.15, 0.145, 0.086, 0.0475];                                              // programmed spread of a fresh cell (volts) for 1 to 4 bits
  const VWIN = [0.6, 5.4];                                                              // programmed levels sit in this window (volts); the erased level is at -1.5 V
  function levels(bits, cycles = 0, months = 0) {
    const n = 2 ** bits, out = [], wear = Math.sqrt(cycles / 1000), sag = 0.022 * Math.log1p(months) * (1 + 0.5 * wear);
    for (let i = 0; i < n; i++) {
      const v0 = i === 0 ? -1.5 : n === 2 ? 3 : VWIN[0] + ((VWIN[1] - VWIN[0]) * (i - 1)) / (n - 2);
      const sigma = i === 0 ? 0.32 * (1 + 0.1 * wear) : SIG0[bits - 1] * (1 + 0.45 * wear);       // finer programming steps for more levels
      out.push({ mean: v0 - (i === 0 ? -0.04 * wear : sag * (v0 + 1.5)), sigma });       // charge leaks from the high levels; the erased level creeps up
    }
    return out;
  }
  const defaultRefs = (lv) => lv.slice(1).map((b, i) => { const a = lv[i]; return (a.mean * b.sigma + b.mean * a.sigma) / (a.sigma + b.sigma); });
  // raw bit error rate: probability of crossing a reference into the neighbouring level, one bit each (Gray code), per stored bit
  function rber(lv, refs, bits) {
    let p = 0; const n = lv.length;
    for (let i = 0; i < n - 1; i++) p += Qf((refs[i] - lv[i].mean) / lv[i].sigma) + Qf((lv[i + 1].mean - refs[i]) / lv[i + 1].sigma);
    return p / n / bits;
  }
  const ECC_LIMIT = 5e-3;

  // ---- workloads ----
  const DEV = [
    { key: 'hdd', seq: 200e6, par: 1 }, { key: 'sata', seq: 550e6, lat: 90e-6, par: 32 }, { key: 'nvme', seq: 7000e6, lat: 25e-6, par: 128 },
  ];
  // time (s) to read `bytes`, a fraction `rnd` of it as random 4 KiB reads at queue depth q, the rest sequentially
  function jobTime(dev, bytes, rnd, q = 1, rpm = 7200) {
    const d = DEV[dev], nRand = (bytes * rnd) / 4096, seq = (bytes * (1 - rnd)) / d.seq;
    let iops;
    if (dev === 0) iops = 1 / ((meanSeek() - HDD.tSettle) / Math.sqrt(Math.min(q, 32)) + HDD.tSettle + latency(rpm) / (q > 1 ? 1 + 0.35 * Math.log2(Math.min(q, 32)) : 1));   // command queueing shortens seeks and waits
    else iops = Math.min(q, d.par) / d.lat;
    return { time: nRand / iops + seq, iops, seqRate: d.seq };
  }
  const M = { HDD, seekTime, meanSeek, latency, dataRate, hddIops, armAngle, headPos, PIV, LA, Qf, levels, defaultRefs, rber, ECC_LIMIT, DEV, jobTime };
  (window.LabModels = window.LabModels || {})['data-storage'] = M;

  /* ================= 1. inside a hard disc (3D) ================= */
  const RPMS = [5400, 7200, 10000, 15000];
  function buildDrive(S) {
    const TH = S.THREE, g = new TH.Group(), K = 10;                                     // scene units: decimetres
    const alu = S.mat('#b7bbc0', { metal: 0.85, rough: 0.5, coat: 0.1 }), dark = S.mat('#1c1d20', { rough: 0.55, coat: 0.2 }), steel = S.mat('#d9dce0', { metal: 1, rough: 0.2 });
    const mirror = S.mat('#e4e8ec', { metal: 1, rough: 0.035, coat: 1, coatRough: 0.02 }), copper = S.mat('#b87333', { metal: 0.9, rough: 0.35 }), pcb = S.mat('#1f5e3a', { rough: 0.5, coat: 0.6 }), amber = S.mat('#c98b2b', { rough: 0.4, coat: 0.6, opacity: 0.92 });
    const add = (m, p = g) => { m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
    const box = (w, d, h, x, y, z, mat, p) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); return add(m, p); };
    const cyl = (r, h, x, y, z, mat, p, seg = 48, r2 = r) => { const m = new TH.Mesh(new TH.CylinderGeometry(r2, r, h, seg).rotateX(PI / 2), mat); m.position.set(x, y, z); return add(m, p); };
    // base casting: floor and walls of the tub (147 x 101.6 x 26 mm), the spindle left of centre
    const OX = 0.22, W = 1.47, Dp = 1.016;
    box(W, Dp, 0.03, OX, 0, -0.015, alu);
    for (const s of [-1, 1]) { box(W, 0.035, 0.2, OX, s * (Dp / 2 - 0.0175), 0.1, alu); box(0.035, Dp - 0.07, 0.2, OX + s * (W / 2 - 0.0175), 0, 0.1, alu); }
    for (const [x, y] of [[-0.46, -0.46], [-0.46, 0.46], [0.9, -0.46], [0.9, 0.46]]) cyl(0.022, 0.012, x, y, 0.206, steel);
    // platters, spacers and clamp, spinning about the spindle
    const spin = new TH.Group(); g.add(spin);
    const ringGeo = new TH.LatheGeometry([[0.125, -0.004], [0.475, -0.004], [0.475, 0.004], [0.125, 0.004], [0.125, -0.004]].map((q) => new TH.Vector2(q[0], q[1])), 96).rotateX(PI / 2);
    const PZ = [0.05, 0.085, 0.12];
    for (const z of PZ) { const m = new TH.Mesh(ringGeo, mirror); m.position.z = z; add(m, spin); }
    cyl(0.125, 0.13, 0, 0, 0.065, alu, spin); cyl(0.16, 0.012, 0, 0, 0.13, steel, spin);
    for (let i = 0; i < 6; i++) cyl(0.012, 0.006, 0.12 * Math.cos((i * TAU) / 6), 0.12 * Math.sin((i * TAU) / 6), 0.138, dark, spin, 12);
    const mark = box(0.03, 0.008, 0.002, 0.2, 0, 0.1245, dark, spin); mark.castShadow = false;
    // actuator: E-block on a pivot, four arms with suspensions and sliders, and the voice coil behind the pivot
    const armMat = S.mat('#c4c9cf', { metal: 0.9, rough: 0.42, coat: 0.2 });
    const armShape = new TH.Shape(); armShape.moveTo(0, -0.055); armShape.lineTo(0.32, -0.02); armShape.lineTo(0.32, 0.02); armShape.lineTo(0, 0.055); armShape.closePath();
    for (const [hx, hr] of [[0.1, 0.024], [0.19, 0.017], [0.26, 0.011]]) { const hp = new TH.Path(); hp.absarc(hx, 0, hr, 0, TAU, true); armShape.holes.push(hp); }
    const armGeo = new TH.ExtrudeGeometry(armShape, { depth: 0.008, bevelEnabled: false, curveSegments: 20 }).translate(0, 0, -0.004);
    const act = new TH.Group(); act.position.set(PIV[0] * K, PIV[1] * K, 0); g.add(act);
    cyl(0.05, 0.14, 0, 0, 0.085, alu, act); cyl(0.022, 0.16, 0, 0, 0.085, steel, act);
    const AZ = [0.032, 0.0675, 0.1025, 0.138];
    for (const z of AZ) {
      const arm = new TH.Mesh(armGeo, armMat); arm.position.set(0.02, 0, z); add(arm, act);
      const sus = new TH.Mesh(new TH.BoxGeometry(0.2, 0.03, 0.002), steel); sus.position.set(0.42, 0, z + (z > 0.09 ? -0.004 : 0.004)); add(sus, act);
      box(0.02, 0.016, 0.005, LA * K - 0.004, 0, z + (z > 0.09 ? -0.008 : 0.008), dark, act);
    }
    // voice coil: a flat trapezoidal winding between two magnet plates (the upper plate is left off)
    const coil = new TH.Mesh(new TH.TorusGeometry(0.07, 0.014, 10, 40), copper); coil.scale.set(1.2, 0.9, 0.5); const tail = new TH.Group(); tail.rotation.z = 0.45; act.add(tail); coil.position.set(-0.16, 0, 0.085); add(coil, tail);
    box(0.12, 0.05, 0.01, -0.07, 0, 0.085, amber, tail);
    const mag = new TH.Group(); mag.position.set(PIV[0] * K, PIV[1] * K, 0); mag.rotation.z = armAngle(0.033) + 0.45; g.add(mag);
    const magGeo = new TH.RingGeometry(0.08, 0.27, 40, 1, PI * 0.82, PI * 0.36);
    const plate = new TH.Mesh(magGeo, S.mat('#9a9da2', { metal: 0.9, rough: 0.35, side: TH.DoubleSide })); plate.position.z = 0.04; add(plate, mag);
    for (const [a0, col] of [[PI * 0.84, '#b0463a'], [PI * 1.005, '#3f6fb0']]) { const m = new TH.Mesh(new TH.RingGeometry(0.1, 0.25, 24, 1, a0, PI * 0.155), S.mat(col, { rough: 0.5, side: TH.DoubleSide })); m.position.z = 0.047; mag.add(m); }
    // head ramp at the edge of the discs, flex cable, connector and circuit board
    box(0.08, 0.12, 0.11, 0.5, -0.03, 0.085, S.mat('#e9e2cf', { rough: 0.6 }));
    const flex = S.tube([[PIV[0] * K + 0.02, PIV[1] * K - 0.05, 0.08], [PIV[0] * K + 0.16, PIV[1] * K - 0.07, 0.07], [0.86, -0.36, 0.06]], { r: 0.012, add: false }); flex.material = amber; add(flex);
    box(0.16, 0.06, 0.07, 0.86, -0.4, 0.05, dark);
    box(0.5, 0.12, 0.012, 0.6, -0.42, -0.04, pcb);
    S.add(g);
    return { g, spin, act, K };
  }
  D['hdd-seek'] = {
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
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const rpm = RPMS[v.rpm], r = v.r / 1000, from = (st.fromR ?? 0.03), ts = seekTime(from, r), lat = latency(rpm), rate = dataRate(r, rpm);
      L.setText(st.cap1, T(tx`A 3.5 inch hard disc with its cover off: three mirror-polished platters on one spindle, and a stack of arms on a pivot carrying a head over each surface. The flat copper coil behind the pivot sits between two magnets; current through it swings the arms, as in a loudspeaker. Drag the gold head to another track; the spin is slowed about a thousand times.`, tx`カバーを外した 3.5 インチのハードディスクです。一本のスピンドルに鏡面仕上げのプラッタが 3 枚あり、ピボットに載ったアームの束が各面の上にヘッドを運びます。ピボットの後ろの平たい銅のコイルは二枚の磁石の間にあり、電流を流すとスピーカーと同じ原理でアームが振れます。金色のヘッドを別のトラックへドラッグしてください。回転は約 1000 分の 1 に遅くしています。`));
      L.setText(st.cap2, T(tx`Time to reach a random block: the seek (move the head) plus the wait for the disc to turn the block under it, for each spindle speed. Faster discs cut only the wait.`, tx`ランダムなブロックに達するまでの時間です。シーク（ヘッドの移動）と、円盤が回ってブロックがヘッドの下に来るまでの待ち時間を、回転数ごとに示します。回転を速くしても短くなるのは待ち時間だけです。`));
      L.setText(st.cap3, T(tx`Sequential data rate against track radius. Bits are written at the same spacing everywhere, and an outer track moves faster under the head, so the outside of the disc is more than twice as fast as the inside.`, tx`トラックの半径に対する連続読み出しの速さです。ビットはどこでも同じ間隔で書かれ、外側のトラックほどヘッドの下を速く通るので、円盤の外側は内側の 2 倍以上の速さになります。`));
      st.g2.replaceChildren(); st.g3.replaceChildren();
      const f = L.fig(st.g2, { x: [0, 4], y: [0, 16], aspect: 0.55, maxH: 230, ticksX: RPMS.map((q, i) => [i + 0.5, String(q)]), xlabel: T('spindle speed (rpm); time in milliseconds', '回転数（rpm）、時間はミリ秒') });
      RPMS.forEach((q, i) => { const ms = meanSeek() * 1000, lt = latency(q) * 1000; f.rect(i + 0.2, 0, 0.6, ms, { c: 'c1', fill: 'c1', fo: i === v.rpm ? 0.8 : 0.4 }); f.rect(i + 0.2, ms, 0.6, lt, { c: 'c2', fill: 'c2', fo: i === v.rpm ? 0.8 : 0.4 }); f.text(i + 0.5, ms + lt, fmt(ms + lt, 1), { small: true, dy: -6 }); });
      const g = L.fig(st.g3, { x: [20, 47], y: [0, 320], aspect: 0.5, maxH: 210, xlabel: T('track radius (mm)', 'トラックの半径（mm）'), ylabel: 'MB/s' });
      g.line(L.sample(20.5, 46, 60, (x) => dataRate(x / 1000, rpm) / 1e6), { c: 'c3', w: 2.4 });
      g.handle(v.r, Math.min(320, rate / 1e6), { c: 'hl', axis: 'x', bounds: [20.5, 46, 0, 320], label: T('track', 'トラック'), onDrag: (x) => { st.fromR = v.r / 1000; ctx.set('r', clamp(Math.round(x * 2) / 2, 20.5, 46)); } });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', kind: 'fill', label: T('mean seek', '平均シーク') }, { c: 'c2', kind: 'fill', label: T('mean rotational wait (half a turn)', '平均の回転待ち（半回転）') }, { c: 'c3', label: T('data rate', 'データ転送速度') }]);
      ctx.readout([
        { k: T(tx`this seek, from ${fmt(from * 1000, 1)} to ${fmt(v.r, 1)} mm`, tx`今回のシーク（${fmt(from * 1000, 1)} mm から ${fmt(v.r, 1)} mm へ）`), v: tx`\(${fmt(ts * 1000, 2)}\ \mathrm{ms}\)` },
        { k: T('mean wait for the disc', '円盤の平均待ち時間'), v: tx`\(${fmt(lat * 1000, 2)}\ \mathrm{ms}\)` },
        { k: T('random reads per second (mean seek + wait)', '毎秒のランダム読み出し回数（平均シーク + 待ち）'), v: fmt(hddIops(rpm), 0), tone: 'key' },
        { k: T('speed of the track under the head, data rate', 'ヘッドの下のトラックの速さ、転送速度'), v: tx`\(${fmt((rpm / 60) * TAU * r * 3.6, 0)}\ \mathrm{km/h},\ ${fmt(rate / 1e6, 0)}\ \mathrm{MB/s}\)` },
      ], T('Every random read costs about a hundredth of a second of mechanical motion, so a disc manages roughly a hundred of them a second however large it is. That single number is why operating systems feel different on a disc and on flash.', 'ランダムな読み出しは 1 回ごとに約 100 分の 1 秒の機械的な動きを必要とするので、どれほど大容量でも、ディスクがこなせるのは毎秒 100 回程度です。ディスクとフラッシュで OS の体感が違うのは、このただ一つの数のためです。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.85 : 0.72, maxH: 520, camera: [0.75, -1.25, 2.75], target: [0.22, -0.02, 0], fov: 30,
        label: T('3D hard disc drive with spinning platters and a seeking arm. Drag to rotate.', '回転するプラッタとシークするアームをもつ 3D のハードディスク。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.dr = buildDrive(S); st.ang = armAngle(0.03); st.spinA = 0;
          const K = st.dr.K;
          st.hdl = S.handle([0, 0, 0.16], { r: 0.035, c: 'hl', plane: [[0, 0, 1], [0, 0, 0.16]], onDrag: (q) => {
            const a = Math.atan2(q.y - PIV[1] * K, q.x - PIV[0] * K), hx = PIV[0] + LA * Math.cos(a), hy = PIV[1] + LA * Math.sin(a), rr = clamp(Math.hypot(hx, hy), 0.0205, 0.046);
            st.fromR = st.cur; st.ctx.set('r', Math.round(rr * 2000) / 2);
            const p = headPos(st.ctx ? rr : rr); return [p[0] * K, p[1] * K, 0.16];
          } });
          st.trk = S.lines([], { c: 'hl', opacity: 0.9, w: 2 });
          S.label(T('platters', 'プラッタ'), [-0.36, 0.3, 0.16], { small: true }); S.label(T('voice coil and magnets', 'ボイスコイルと磁石'), [0.6, -0.2, 0.34], { small: true }); S.label(T('head', 'ヘッド'), [0.3, 0.12, 0.26], { small: true }); S.label(T('ramp', 'ランプ'), [0.52, -0.03, 0.2], { small: true });
          S.animate((dt) => {
            const d = Math.min(dt, 0.05), tgt = armAngle(st.cur ?? 0.03), diff = tgt - st.ang;
            if (!S.reduced()) st.spinA = (st.spinA + d * 5.5) % TAU;
            st.ang += clamp(diff, -d * 2.2, d * 2.2);
            st.dr.spin.rotation.z = st.spinA; st.dr.act.rotation.z = st.ang;
            const K2 = st.dr.K; st.hdl.at([(PIV[0] + LA * Math.cos(st.ang)) * K2, (PIV[1] + LA * Math.sin(st.ang)) * K2, 0.16]);
            return !S.reduced() || Math.abs(diff) > 1e-4;
          });
        },
        update(S) {
          st.cur = r; const K = st.dr.K, seg = [];
          for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU, b = ((i + 1) / 96) * TAU; seg.push([[r * K * Math.cos(a), r * K * Math.sin(a), 0.1252], [r * K * Math.cos(b), r * K * Math.sin(b), 0.1252]]); }
          st.trk.update(seg);
          if (S.reduced()) { st.ang = armAngle(r); st.dr.act.rotation.z = st.ang; const p = headPos(r); st.hdl.at([p[0] * K, p[1] * K, 0.16]); }
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f2 = L.fig(st.v3, { x: [-55, 125], y: [-58, 58], equal: true, maxH: 380, axes: false, grid: false });
          f2.rect(-51.5, -50.8, 147, 101.6, { c: 'muted', fill: 'muted', fo: 0.15 }); f2.circle(0, 0, 47.5, { c: 'ink', w: 2 }); f2.circle(0, 0, 12.5, { c: 'ink', w: 2 }); f2.circle(0, 0, v.r, { c: 'hl', w: 2 });
          const p = headPos(r); f2.line([[PIV[0] * 1000, PIV[1] * 1000], [p[0] * 1000, p[1] * 1000]], { c: 'c1', w: 6 }); f2.dot(p[0] * 1000, p[1] * 1000, { c: 'hl', r: 5 });
        },
      });
    },
  };

  /* ================= 2. flash: levels of trapped charge ================= */
  D['nand-levels'] = {
    render(ctx, v) {
      const bits = v.bits, cycles = Math.round(10 ** v.lc), lv = levels(bits, cycles, v.mo), refs = defaultRefs(lv), n = lv.length;
      const ki = clamp(Math.round(ctx.state.ki ?? Math.floor((n - 1) / 2)), 0, n - 2), use = refs.slice(); use[ki] += v.dv;
      const ber = rber(lv, use, bits), ber0 = rber(lv, refs, bits);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Each flash cell is a transistor with a little charge trapped in an insulated layer, which shifts the gate voltage at which it switches on. Storing \(${bits}\) bit${bits > 1 ? 's' : ''} means telling \(${n}\) such threshold voltages apart. The curves show how the cells of each level are spread; the dashed lines are the read reference voltages. Drag the gold one.`, tx`フラッシュの各セルは、絶縁された層に少量の電荷を閉じ込めたトランジスタで、その電荷がオンになるゲート電圧をずらします。\(${bits}\) ビットを記憶するとは、\(${n}\) 通りのしきい値電圧を見分けることです。曲線は各レベルのセルの広がりを、破線は読み出しの参照電圧を示します。金色の破線をドラッグしてください。`));
      const top = 1.05 / (Math.min(...lv.slice(1).map((q) => q.sigma)) * Math.sqrt(TAU));
      const f = L.fig(c1, { x: [-3, 6.4], y: [0, top], aspect: 0.72, maxH: 360, xlabel: T(tx`threshold voltage \(V_{\rm th}\) (V)`, tx`しきい値電圧 \(V_{\rm th}\)（V）`), ylabel: T('cells', 'セル数') });
      const pdf = (q, x) => Math.exp(-0.5 * ((x - q.mean) / q.sigma) ** 2) / (q.sigma * Math.sqrt(TAU));
      lv.forEach((q, i) => { const pts = L.sample(q.mean - 4.5 * q.sigma, q.mean + 4.5 * q.sigma, 60, (x) => Math.min(top, pdf(q, x))); f.area(pts, { c: i % 2 ? 'c1' : 'c3', fo: 0.3, base: 0 }); f.line(pts, { c: i % 2 ? 'c1' : 'c3', w: 1.6 }); });
      use.forEach((x, i) => { if (i !== ki) f.vline(x, { c: 'muted', dash: '4 3', w: 1.2 }); });
      f.vline(use[ki], { c: 'hl', dash: '4 3', w: 1.8 });
      f.handle(use[ki], top * 0.86, { c: 'hl', axis: 'x', bounds: [-2.8, 6.2, 0, top], label: T('read reference', '読み出し参照電圧'), onDrag: (x) => {
        let best = 0, bd = 9; refs.forEach((q, i) => { const d = Math.abs(q - x); if (d < bd) { bd = d; best = i; } });
        if (Math.abs(x - use[ki]) > 0.25 && best !== ki) { ctx.state.ki = best; ctx.set('dv', 0); } else ctx.set('dv', clamp(Math.round((x - refs[ki]) * 100) / 100, -0.5, 0.5));
      } });
      if (bits <= 3) lv.forEach((q, i) => f.text(q.mean, Math.min(top * 0.97, pdf(q, q.mean)), (i ^ (i >> 1)).toString(2).padStart(bits, '0'), { small: true, dy: -5 }));
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Raw bit error rate against program and erase cycles for one to four bits per cell, after the chosen retention time. Above the dashed line the error-correcting code can no longer recover the data. More bits per cell means narrower gaps and a shorter life.`, tx`1 セルあたり 1 から 4 ビットについて、選んだ保持時間の後の生のビット誤り率を、書き込みと消去の回数に対して描いています。破線より上では、誤り訂正符号でもデータを復元できません。1 セルあたりのビット数が多いほどすき間が狭く、寿命が短くなります。`));
      const g = L.fig(c2, { x: [1, 5], y: [-12, 0], aspect: 0.72, maxH: 360, xlabel: T('program/erase cycles', '書き込み・消去の回数'), ticksX: [[1, '10'], [2, '100'], [3, '1k'], [4, '10k'], [5, '100k']], ticksY: [[-12, '10⁻¹²'], [-9, '10⁻⁹'], [-6, '10⁻⁶'], [-3, '10⁻³'], [0, '1']] });
      g.hline(Math.log10(ECC_LIMIT), { c: 'ink', dash: '5 4' }); g.text(1.1, Math.log10(ECC_LIMIT), T('limit of error correction', '誤り訂正の限界'), { small: true, anchor: 'start', dy: -6 });
      ['c3', 'c1', 'c2', 'c4'].forEach((c, b) => g.line(L.sample(1, 5, 60, (x) => { const q = levels(b + 1, 10 ** x, v.mo); return clamp(Math.log10(Math.max(1e-13, rber(q, defaultRefs(q), b + 1))), -12, 0); }), { c, w: b + 1 === bits ? 3 : 1.6 }));
      g.dot(clamp(v.lc, 1, 5), clamp(Math.log10(Math.max(1e-13, ber0)), -12, 0), { c: 'hl', r: 5.5 });
      L.legend(ctx.host, [{ c: 'c3', label: T('SLC, 1 bit', 'SLC（1 ビット）') }, { c: 'c1', label: T('MLC, 2 bits', 'MLC（2 ビット）') }, { c: 'c2', label: T('TLC, 3 bits', 'TLC（3 ビット）') }, { c: 'c4', label: T('QLC, 4 bits', 'QLC（4 ビット）') }]);
      const sci = (x) => (x < 1e-12 ? tx`<10^{-12}` : x >= 0.001 ? fmt(x, 4) : (() => { const [m, e] = x.toExponential(1).split('e'); return tx`${m}\times10^{${Number(e)}}`; })());
      ctx.readout([
        { k: T('levels, gap between neighbours', 'レベル数、隣どうしの間隔'), v: tx`\(${n},\ ${fmt(n > 2 ? (VWIN[1] - VWIN[0]) / (n - 2) : 4.5, 2)}\ \mathrm{V}\)` },
        { k: T('spread of one level (standard deviation)', '一つのレベルの広がり（標準偏差）'), v: tx`\(${fmt(lv[n - 1].sigma * 1000, 0)}\ \mathrm{mV}\)` },
        { k: T('raw bit error rate with these references', 'この参照電圧での生のビット誤り率'), v: tx`\(${sci(ber)}\)`, tone: ber < ECC_LIMIT ? 'good' : 'warn' },
        { k: T('with the best references', '最適な参照電圧での値'), v: tx`\(${sci(ber0)}\)`, tone: 'key' },
      ], T('A drive never trusts a single read. It stores extra check bits with every page, moves its reference voltages to follow the drifting levels, and retires blocks whose error rate creeps towards the limit. The curves here are a simple Gaussian model with representative numbers.', 'ドライブは一度の読み出しをそのまま信用しません。各ページに検査用のビットを余分に記憶し、ずれていくレベルを追って参照電圧を動かし、誤り率が限界に近づいたブロックは使うのをやめます。ここでの曲線は、代表的な数値を使った単純なガウス分布のモデルです。'));
    },
  };

  /* ================= 3. the same job on three drives ================= */
  D['storage-latency'] = {
    render(ctx, v) {
      const bytes = 2 ** v.lg, rnd = v.rnd / 100, q = 2 ** v.lq, rpm = 7200, res = [0, 1, 2].map((d) => jobTime(d, bytes, rnd, q, rpm));
      const names = [T('hard disc, 7200 rpm', 'ハードディスク（7200 rpm）'), T('SATA SSD', 'SATA SSD'), T('NVMe SSD', 'NVMe SSD')];
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const human = (b) => (b >= 2 ** 30 ? fmt(b / 2 ** 30, 1) + ' GiB' : fmt(b / 2 ** 20, 0) + ' MiB');
      const dur = (s) => (s >= 3600 ? fmt(s / 3600, 1) + ' h' : s >= 60 ? fmt(s / 60, 1) + ' min' : s >= 1 ? fmt(s, 2) + ' s' : fmt(s * 1000, 1) + ' ms');
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Time to read ${human(bytes)}, with ${fmt(v.rnd, 0)}% of it scattered in 4 KiB pieces and the rest in one run, on three kinds of drive. The axis is logarithmic: each gridline is ten times longer. Drag the gold point to change how scattered the data is.`, tx`${human(bytes)} を読むのにかかる時間を、三種類のドライブで比べます。データの ${fmt(v.rnd, 0)}% は 4 KiB の断片に散らばり、残りは一続きです。軸は対数で、目盛り一つごとに 10 倍長くなります。金色の点をドラッグして、データの散らばり具合を変えてください。`));
      const f = L.fig(c1, { x: [-3, 5], y: [0, 3], aspect: 0.6, maxH: 300, xlabel: T('time', '時間'), ticksX: [[-3, '1 ms'], [-2, '10 ms'], [-1, '0.1 s'], [0, '1 s'], [1, '10 s'], [2, '100 s'], [3, '17 min'], [4, '2.8 h'], [5, '28 h']], ticksY: [] });
      res.forEach((q2, i) => { const x = clamp(Math.log10(Math.max(q2.time, 1e-3)), -3, 5); f.rect(-3, 2 - i + 0.2, x + 3, 0.6, { c: ['c2', 'c1', 'c3'][i], fill: ['c2', 'c1', 'c3'][i], fo: 0.65 }); f.text(Math.min(x, 3.4), 2 - i + 0.5, `${names[i]}: ${dur(q2.time)}`, { small: true, anchor: 'start', dx: 8, dy: 4 }); });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How the time grows as the read becomes more scattered. Flash barely notices; the disc slows by a factor of thousands, because every scattered piece costs a seek and half a turn.`, tx`読み出しが散らばるにつれて、時間がどう増えるかを示します。フラッシュはほとんど影響を受けませんが、ディスクは数千倍遅くなります。散らばった断片一つごとに、シークと半回転が必要になるからです。`));
      const g = L.fig(c2, { x: [0, 100], y: [-3, 5], aspect: 0.6, maxH: 300, xlabel: T('random share of the data (%)', 'ランダムな部分の割合（%）'), ticksY: [[-2, '10 ms'], [0, '1 s'], [2, '100 s'], [4, '2.8 h']] });
      [0, 1, 2].forEach((d) => g.line(L.sample(0, 100, 100, (x) => clamp(Math.log10(Math.max(1e-3, jobTime(d, bytes, x / 100, q, rpm).time)), -3, 5)), { c: ['c2', 'c1', 'c3'][d], w: 2.4 }));
      g.handle(v.rnd, clamp(Math.log10(Math.max(1e-3, res[0].time)), -3, 5), { c: 'hl', axis: 'x', bounds: [0, 100, -3, 5], label: T('random share', 'ランダムな割合'), onDrag: (x) => ctx.set('rnd', clamp(Math.round(x), 0, 100)) });
      L.legend(ctx.host, [{ c: 'c2', label: names[0] }, { c: 'c1', label: names[1] }, { c: 'c3', label: names[2] }]);
      ctx.readout([
        { k: T('random 4 KiB reads per second: disc, SATA, NVMe', '毎秒のランダム 4 KiB 読み出し：ディスク、SATA、NVMe'), v: res.map((q2) => fmt(q2.iops, 0)).join(', '), tone: 'key' },
        { k: T('sequential rate (MB/s)', '連続読み出しの速さ（MB/s）'), v: res.map((q2) => fmt(q2.seqRate / 1e6, 0)).join(', ') },
        { k: T('NVMe advantage over the disc for this job', 'この作業での NVMe のディスクに対する優位'), v: tx`\(${fmt(res[0].time / res[2].time, 0)}\times\)` },
        { k: T('requests in flight (queue depth)', '同時に出している要求の数（キュー深度）'), v: String(q) },
      ], T('A SATA SSD is held back by its interface, designed for discs: one queue of 32 commands and 600 MB/s. NVMe talks to flash over PCIe with thousands of queues, which is why its gain is largest when many requests are in flight at once.', 'SATA SSD は、ディスク向けに設計されたインターフェースに足を引っ張られます。キューは 32 コマンドが一本だけで、速さは 600 MB/s までです。NVMe は PCIe を通して数千本のキューでフラッシュと話すので、多数の要求が同時に出ているときほど差が大きくなります。'));
    },
  };
})();
