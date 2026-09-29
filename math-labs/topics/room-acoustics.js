'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, C = 343;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const cx = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, abs: (a) => Math.hypot(a[0], a[1]), scale: (a, k) => [a[0] * k, a[1] * k], expj: (t) => [Math.cos(t), Math.sin(t)] };
  const dB = (z) => 20 * Math.log10(Math.max(1e-9, typeof z === 'number' ? Math.abs(z) : cx.abs(z)));

  /* ---------- model (pure, checked by checks/room-acoustics.cjs); SI units ---------- */
  const modeFreq = (Lx, Ly, Lz, nx, ny, nz) => (C / 2) * Math.hypot(nx / Lx, ny / Ly, nz / Lz);
  const modeKind = (n) => ['none', 'axial', 'tangential', 'oblique'][n.filter((k) => k > 0).length];
  function modeList(Lx, Ly, Lz, fmax) {
    const out = [];
    for (let nx = 0; nx <= Math.ceil(2 * fmax * Lx / C); nx++) for (let ny = 0; ny <= Math.ceil(2 * fmax * Ly / C); ny++) for (let nz = 0; nz <= Math.ceil(2 * fmax * Lz / C); nz++) {
      if (!nx && !ny && !nz) continue;
      const f = modeFreq(Lx, Ly, Lz, nx, ny, nz); if (f <= fmax) out.push({ n: [nx, ny, nz], f, kind: modeKind([nx, ny, nz]) });
    }
    return out.sort((a, b) => a.f - b.f);
  }
  const modeShape = (n, Lx, Ly, Lz, x, y, z) => Math.cos(n[0] * Math.PI * x / Lx) * Math.cos(n[1] * Math.PI * y / Ly) * Math.cos(n[2] * Math.PI * z / Lz);
  // modal sum for a point source with a flat free-field response (volume acceleration held constant); delta = 6.91/T60 is the amplitude decay rate of every mode
  function modalResponse(Lx, Ly, Lz, src, rcv, f, T60, list) {
    const w = TAU * f, del = 6.9078 / T60; let p = [0, 0];
    const all = [{ n: [0, 0, 0], f: 0 }].concat(list);
    for (const m of all) {
      const eps = m.n.reduce((e, k) => e * (k ? 2 : 1), 1), wn = TAU * m.f;
      const num = eps * modeShape(m.n, Lx, Ly, Lz, ...src) * modeShape(m.n, Lx, Ly, Lz, ...rcv);
      p = cx.add(p, cx.div([num, 0], [wn * wn - w * w, 2 * del * w]));
    }
    return cx.scale(p, 1 / (Lx * Ly * Lz));
  }
  const schroeder = (T60, V) => 2000 * Math.sqrt(T60 / V);
  // Weyl's asymptotic count of modes below f in a rectangular room with rigid walls
  const weyl = (Lx, Ly, Lz, f) => { const V = Lx * Ly * Lz, S = 2 * (Lx * Ly + Ly * Lz + Lx * Lz), E = 4 * (Lx + Ly + Lz); return 4 * Math.PI * V * f ** 3 / (3 * C ** 3) + Math.PI * S * f ** 2 / (4 * C ** 2) + E * f / (8 * C) - 1; };

  const ROOMS = [{ dims: [5, 4, 2.5], full: 12 }, { dims: [9, 7, 3], full: 30 }, { dims: [40, 24, 16], full: 1100 }];
  const ALPHA = { floor: [0.10, 0.30], ceil: [0.05, 0.60] };
  function roomAbsorption(room, floor, ceil, aw, furn) {
    const [a, b, h] = ROOMS[room].dims, V = a * b * h, Sf = a * b, Sw = 2 * (a + b) * h, S = 2 * Sf + Sw;
    const parts = { floor: Sf * ALPHA.floor[floor], ceil: Sf * ALPHA.ceil[ceil], walls: Sw * aw, furn: ROOMS[room].full * furn / 100 };
    const A = parts.floor + parts.ceil + parts.walls + parts.furn;
    return { V, S, A, abar: A / S, parts, dims: [a, b, h] };
  }
  const sabine = (V, A) => 0.1611 * V / A;
  const eyring = (V, S, abar) => 0.1611 * V / (-S * Math.log(1 - Math.min(abar, 0.999999)));
  const critDist = (Q, A) => Math.sqrt(Q * A / (16 * Math.PI));
  const levelDirect = (Q, r) => 10 * Math.log10(Q / (4 * Math.PI * r * r));
  const levelReverb = (A) => 10 * Math.log10(4 / A);
  const meanFreePath = (V, S) => 4 * V / S;

  // one mirror plane: speaker at distance a, listener at distance b, separated by d along the plane
  function reflection(a, b, d) { const r1 = Math.hypot(d, b - a), r2 = Math.hypot(d, b + a); return { r1, r2, Delta: r2 - r1 }; }
  const boundaryH = (a, b, d, g, f) => { const R = reflection(a, b, d); return cx.add([1, 0], cx.scale(cx.expj(-TAU * f * R.Delta / C), g * R.r1 / R.r2)); };
  const notches = (Delta, fmax) => { const o = []; for (let n = 0; ; n++) { const f = (2 * n + 1) * C / (2 * Delta); if (f > fmax || n > 400) break; o.push(f); } return o; };
  // complex pressure (times distance scale 1 m) of source + image at a point (u along, w from the plane)
  function fieldAt(a, g, k, u, w) { const r1 = Math.max(0.03, Math.hypot(u, w - a)), r2 = Math.max(0.03, Math.hypot(u, w + a)); return cx.add(cx.scale(cx.expj(-k * r1), 1 / r1), cx.scale(cx.expj(-k * r2), g / r2)); }

  (window.LabModels = window.LabModels || {})['room-acoustics'] = { cx, dB, modeFreq, modeKind, modeList, modeShape, modalResponse, schroeder, weyl, ROOMS, ALPHA, roomAbsorption, sabine, eyring, critDist, levelDirect, levelReverb, meanFreePath, reflection, boundaryH, notches, fieldAt, C };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const hz = (f) => (f >= 1000 ? fmt(f / 1000, f >= 10000 ? 1 : 2) + ' kHz' : fmt(f, f < 100 ? 1 : 0) + ' Hz');
  const sgn = (x, d = 1) => { const r = Math.round(x * 10 ** d) / 10 ** d; return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(r), d); };
  const kindName = { axial: ['axial', '軸'], tangential: ['tangential', '接線'], oblique: ['oblique', '斜め'] };
  const kindCol = { axial: 'c1', tangential: 'c2', oblique: 'c3' };
  const EAR = 1.2, T60M = 0.4;
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* ---------- 1. room modes ---------- */
  D['room-modes'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const Lx = v.L, Ly = v.W, Lz = v.H, n = [v.nx, v.ny, v.nz], V = Lx * Ly * Lz;
      const list = modeList(Lx, Ly, Lz, 400), sel = n.some((k) => k > 0), fsel = modeFreq(Lx, Ly, Lz, ...n);
      const src = [0, 0, 0], rcv = [v.lx * Lx, v.ly * Ly, EAR], zf = Math.cos(n[2] * Math.PI * EAR / Lz);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, sel
        ? T(`Floor plan, ${fmt(Lx, 2)} × ${fmt(Ly, 2)} m, coloured by the pressure of mode (${n.join(', ')}) at ${hz(fsel)}, at ear height. The speaker is in the bottom-left corner; drag the listener.`, `${fmt(Lx, 2)} × ${fmt(Ly, 2)} m の平面図を、${hz(fsel)} のモード (${n.join(', ')}) の耳の高さでの圧力で色分けしています。スピーカーは左下の隅にあります。聴き手をドラッグしてください。`)
        : T('Choose a mode with at least one index above zero.', '少なくとも一つの番号が 0 より大きいモードを選んでください。'));
      const pf = L.fig(c1, { x: [0, Lx], y: [0, Ly], equal: true, maxH: 340, xlabel: T('length (m)', '長さ（m）'), ylabel: T('width (m)', '幅（m）') });
      const paint = (ph) => pf.raster((x, y) => (sel ? modeShape(n, Lx, Ly, Lz, x, y, EAR) * Math.cos(ph) : 0), { cmap: 'div', res: 3 });
      paint(0);
      pf.rect(0, 0, Lx, Ly, { c: 'ink', w: 2.4, layer: 'under' });
      pf.rect(0.04, 0.04, 0.32, 0.28, { c: 'ink', fill: 'ink', fo: 0.85, w: 1, layer: 'main' }); pf.text(0.44, 0.2, T('speaker', 'スピーカー'), { small: true, c: 'ink', anchor: 'start' });
      pf.handle(rcv[0], rcv[1], { c: 'hl', r: 8, label: T('Listener', '聴き手'), bounds: [0.02 * Lx, 0.98 * Lx, 0.02 * Ly, 0.98 * Ly], onDrag: (x, y) => { ctx.set('lx', Math.round(clamp(x / Lx, 0.02, 0.98) * 100) / 100, true); ctx.set('ly', Math.round(clamp(y / Ly, 0.02, 0.98) * 100) / 100); } });
      // response
      const F0 = 20, F1 = 250, N = 460, fs = L.seq(N, (i) => F0 + i * (F1 - F0) / (N - 1));
      const ps = fs.map((f) => modalResponse(Lx, Ly, Lz, src, rcv, f, T60M, list)), e = ps.map((z) => cx.abs(z) ** 2), ref = 10 * Math.log10(e.reduce((s, x) => s + x, 0) / N);
      const lv = e.map((x) => 10 * Math.log10(x) - ref);
      L.h('p', 'lab-cap', c2, T('The response at the listener, summed over every mode below 400 Hz. The ticks along the bottom are the modes: axial, tangential, oblique.', '聴き手での応答で、400 Hz より下のすべてのモードを足し合わせています。下端の目盛りがモードで、軸、接線、斜めの別に色分けしています。'));
      const g = L.fig(c2, { x: [F0, F1], y: [-30, 15], aspect: 0.66, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 320, ticksX: [[20, '20'], [50, '50'], [100, '100'], [150, '150'], [200, '200'], [250, '250']], ticksY: [[15, '+15'], [10, '+10'], [0, '0'], [-10, '−10'], [-20, '−20'], [-30, '−30']] });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      list.filter((m) => m.f <= F1).forEach((m) => g.seg([m.f, -30], [m.f, m.kind === 'axial' ? -26 : m.kind === 'tangential' ? -27.5 : -28.5], { c: kindCol[m.kind], w: 2, layer: 'under' }));
      const fS = schroeder(T60M, V); if (fS < F1) { g.vline(fS, { c: 'c4', w: 1.2, dash: '4 3', layer: 'under' }); g.text(fS, 13, `f_S ≈ ${hz(fS)}`, { small: true, c: 'c4', anchor: 'start', dx: 4 }); }
      if (sel && fsel <= F1) { g.vline(fsel, { c: 'hl', w: 1.4, dash: '2 3', layer: 'under' }); }
      g.line(fs.map((f, i) => [f, clamp(lv[i], -34, 19)]), { c: 'ink', w: 2.2, layer: 'main' });
      L.legend(ctx.host, [{ c: 'c1', label: T('axial modes', '軸モード') }, { c: 'c2', label: T('tangential', '接線モード') }, { c: 'c3', label: T('oblique', '斜めモード') }, { c: 'ink', label: T('response at the listener', '聴き手での応答') }, { c: 'hl', dash: true, label: T('selected mode', '選んだモード') }]);
      const psiR = sel ? modeShape(n, Lx, Ly, Lz, ...rcv) : 0, band = fs.map((f, i) => [f, lv[i]]).filter(([f]) => f >= 30 && f <= 150).map(([, y]) => y);
      const deg = list.filter((m) => sel && Math.abs(m.f - fsel) < 0.5 && m.n.join() !== n.join());
      ctx.readout([
        { k: T('selected mode', '選んだモード'), v: sel ? `(${n.join(', ')}) ${hz(fsel)}, ${T(...kindName[modeKind(n)])}` : '–', tone: 'key' },
        { k: T('its amplitude at the listener', '聴き手でのその振幅'), v: sel ? (Math.abs(psiR) < 0.03 ? T('near a node', '節の近く') : `${sgn(dB(psiR), 1)} dB`) : '–' },
        { k: T('modes below 100 Hz, 200 Hz', '100 Hz、200 Hz より下のモード'), v: `${list.filter((m) => m.f < 100).length}, ${list.filter((m) => m.f < 200).length}` },
        { k: T('Schroeder frequency (T₆₀ = 0.4 s)', 'シュレーダー周波数（T₆₀ = 0.4 s）'), v: hz(fS) },
        { k: T('spread 30 to 150 Hz', '30〜150 Hz の上下幅'), v: `${fmt(Math.max(...band) - Math.min(...band), 1)} dB` },
      ], deg.length
        ? T(`Mode (${n.join(', ')}) shares its frequency with (${deg[0].n.join(', ')}): the room’s proportions stack two modes on one note, which makes that note boom. Room ratios such as 1 : 1.4 : 1.9 are chosen to spread the modes evenly.`, `モード (${n.join(', ')}) は (${deg[0].n.join(', ')}) と周波数が同じです。部屋の比率が二つのモードを一つの音に積み重ね、その音を響かせます。1 : 1.4 : 1.9 のような部屋の比率は、モードを均等に散らすために選ばれます。`)
        : T('Move the listener towards a wall and the low modes grow; move it to the middle and every mode with an odd index along that direction disappears. The shape of the curve below about 150 Hz is set by where you sit, not by the speaker.', '聴き手を壁に近づけると低いモードが大きくなり、中央に動かすとその方向の番号が奇数のモードはすべて消えます。およそ 150 Hz より下の曲線の形を決めるのは、スピーカーではなく座る場所です。'));
      if (sel) ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { paint(TAU * 0.5 * t); lab.textContent = T(`oscillating, slowed from ${hz(fsel)}`, `${hz(fsel)} から遅くして振動を表示`); }, { autoplay: !L.reduced(), initialT: 0 });
    },
  };

  /* ---------- 2. reverberation ---------- */
  D['reverberation'] = {
    render(ctx, v) {
      const R = roomAbsorption(v.room, v.floor, v.ceil, v.aw, v.furn), T60 = sabine(R.V, R.A), TE = eyring(R.V, R.S, R.abar), rc = critDist(2, R.A), r = v.r;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      // echogram: energy per time bin relative to the direct sound, image sources at the statistical density 4 pi c^3 t^2 / V
      const tmax = Math.max(0.25, Math.min(1.25 * T60, 5)), bins = 900, dt = tmax / bins, del = C * R.A / (4 * R.V), t0 = r / C;
      const rand = rng(1 + v.room * 101 + v.floor * 7 + v.ceil * 13), gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(TAU * rand());
      const lev = [];
      for (let i = 0; i < bins; i++) {
        const ta = i * dt, tb = ta + dt, tm = ta + dt / 2;
        let E = ta <= t0 && t0 < tb ? 1 : 0;
        const tl = Math.max(ta, t0), lam = tb > tl ? (4 * Math.PI * C ** 3 / (3 * R.V)) * (tb ** 3 - tl ** 3) : 0;
        if (lam > 0) {
          const mean = (r * r) / (C * tm) ** 2 * Math.exp(-del * (tm - t0));
          if (lam < 30) { let k = 0, q = Math.exp(-lam), s = q, u = rand(); while (u > s && k < 200) { k++; q *= lam / k; s += q; } for (let j = 0; j < k; j++) E += mean * (0.4 + 1.2 * rand()); }
          else E += lam * mean * Math.max(0.05, 1 + 0.35 * gauss() / Math.sqrt(lam) + 0.25 * gauss() / Math.sqrt(lam));
        }
        lev.push(E > 0 ? 10 * Math.log10(E) : -200);
      }
      const floorDB = -80, line0 = 10 * Math.log10(4 * Math.PI * C * r * r * dt / R.V);
      L.h('p', 'lab-cap', c1, T(`Echogram of a handclap heard ${fmt(r, 1)} m away: sound energy in ${fmt(dt * 1000, dt < 0.002 ? 1 : 0)} ms slices, in dB relative to the direct sound. The dashed line is Sabine’s decay.`, `${fmt(r, 1)} m 離れて聞く手拍子のエコーグラムです。${fmt(dt * 1000, dt < 0.002 ? 1 : 0)} ms ごとの音のエネルギーを、直接音に対する dB で示しています。破線がセイビンの減衰です。`));
      const e = L.fig(c1, { x: [0, tmax], y: [floorDB, 5], aspect: 0.62, xlabel: T('time (s)', '時間（s）'), ylabel: 'dB', maxH: 300, ticksY: [[0, '0'], [-20, '−20'], [-40, '−40'], [-60, '−60'], [-80, '−80']] });
      const pts = []; lev.forEach((y, i) => { if (y > floorDB) { const x = i * dt; pts.push([x, floorDB], [x, y], [x + dt, y], [x + dt, floorDB]); } });
      if (pts.length) e.line(pts, { c: 'c1', w: 1, layer: 'main' });
      e.line([[t0, line0], [tmax, line0 - 60 * (tmax - t0) / T60]], { c: 'c2', w: 2, dash: '6 4', layer: 'over' });
      if (t0 + T60 <= tmax) { e.seg([t0, line0], [t0 + T60, line0], { c: 'hl', w: 1.2, layer: 'over' }); e.seg([t0 + T60, line0], [t0 + T60, line0 - 60], { c: 'hl', w: 1.2, layer: 'over' }); e.text(t0 + T60 * 0.6, line0 - 4, `T₆₀ = ${fmt(T60, 2)} s`, { small: true, c: 'hl' }); e.text(t0 + T60, line0 - 30, '60 dB', { small: true, c: 'hl', anchor: 'start', dx: 4 }); }
      else e.text(tmax, line0 - 60 * (tmax - t0) / T60 + 4, `T₆₀ = ${fmt(T60, 2)} s`, { small: true, c: 'hl', anchor: 'end' });
      // the first 60 ms, reflection by reflection
      const tz = 0.06, ref = [], rz = rng(7 + v.room * 31);
      { let t = t0, K = 4 * Math.PI * C ** 3 / (3 * R.V); while (ref.length < 4000) { const u = -Math.log(1 - rz()); t = Math.cbrt(t ** 3 + u / K); if (t > tz) break; ref.push([t, 10 * Math.log10((r * r) / (C * t) ** 2 * Math.exp(-del * (t - t0)) * (0.4 + 1.2 * rz()))]); } }
      L.h('p', 'lab-cap', c1, T(`The first 60 ms, one line per reflection (${ref.length}${ref.length >= 4000 ? '+' : ''}): the direct sound, then early reflections arriving ever more densely, as 4πc³t²/V.`, `最初の 60 ms を、反射一つにつき一本の線で示します（${ref.length}${ref.length >= 4000 ? '以上' : ''} 本）。直接音の後、初期反射が 4πc³t²/V に従ってしだいに密に届きます。`));
      const zf = L.fig(c1, { x: [0, tz * 1000], y: [-40, 3], aspect: 0.4, xlabel: T('time (ms)', '時間（ms）'), ylabel: 'dB', maxH: 180, ticksY: [[0, '0'], [-20, '−20'], [-40, '−40']] });
      const zp = []; ref.forEach(([t, y]) => { if (y > -40) zp.push([t * 1000, -40], [t * 1000, y], [t * 1000, -40]); });
      if (zp.length) zf.line(zp, { c: 'c1', w: 0.9, layer: 'main' });
      zf.seg([t0 * 1000, -40], [t0 * 1000, 0], { c: 'ink', w: 2.4, layer: 'over' }); zf.text(t0 * 1000, 0, T('direct', '直接音'), { small: true, c: 'ink', anchor: 'start', dx: 4, dy: 4 });
      // right: level against distance
      L.h('p', 'lab-cap', c2, T('Level against distance for a speaker radiating into half-space (Q = 2), relative to its sound power level. Drag the gold point to move the listener.', '半空間に放射するスピーカー（Q = 2）の、距離に対するレベルです。音響パワーレベルを基準にしています。金色の点をドラッグして聴き手を動かしてください。'));
      const lx0 = Math.log10(0.1), lx1 = Math.log10(50), Ltot = (rr) => 10 * Math.log10(10 ** (levelDirect(2, rr) / 10) + 10 ** (levelReverb(R.A) / 10));
      const yTop = Math.ceil((levelDirect(2, 0.1) + 3) / 10) * 10, yBot = Math.min(-50, Math.floor((levelReverb(R.A) - 12) / 10) * 10);
      const g = L.fig(c2, { x: [lx0, lx1], y: [yBot, yTop], aspect: 0.62, xlabel: T('distance (m)', '距離（m）'), ylabel: 'dB', maxH: 280, ticksX: [[-1, '0.1'], [Math.log10(0.3), '0.3'], [0, '1'], [Math.log10(3), '3'], [1, '10'], [Math.log10(30), '30']] });
      g.line(L.sample(lx0, lx1, 120, (x) => levelDirect(2, 10 ** x)), { c: 'c1', w: 1.6, dash: '5 4', layer: 'main' });
      g.hline(levelReverb(R.A), { c: 'c2', w: 1.6, dash: '5 4', layer: 'main' });
      g.line(L.sample(lx0, lx1, 160, (x) => Ltot(10 ** x)), { c: 'ink', w: 2.4, layer: 'main' });
      g.vline(Math.log10(rc), { c: 'c4', w: 1.2, dash: '2 3', layer: 'under' }); g.text(Math.log10(rc), yTop - 4, `r_c = ${fmt(rc, rc < 10 ? 2 : 1)} m`, { small: true, c: 'c4', anchor: 'start', dx: 4 });
      g.handle(Math.log10(r), Ltot(r), { c: 'hl', r: 7, axis: 'x', label: T('Listening distance', '聴取距離'), bounds: [Math.log10(0.3), Math.log10(20), yBot, yTop], onDrag: (x) => ctx.set('r', Math.round(clamp(10 ** x, 0.3, 20) * 10) / 10) });
      // absorption breakdown
      L.h('p', 'lab-cap', c2, T(`Where the ${fmt(R.A, R.A < 100 ? 1 : 0)} m² of absorption comes from.`, `${fmt(R.A, R.A < 100 ? 1 : 0)} m² の吸音量の内訳です。`));
      const b = L.stage(c2, { w: 100, h: 16, maxH: 70 }), keys = [['floor', 'c1', ['floor', '床']], ['walls', 'c2', ['walls', '壁']], ['ceil', 'c3', ['ceiling', '天井']], ['furn', 'c4', ['furnishings, people', '家具、人']]];
      let x = 2; keys.forEach(([k, c, nm]) => { const w = 96 * R.parts[k] / R.A; if (w > 0.2) { b.rect(x, 3, w, 6, { c, fill: c, fo: 0.6, w: 1 }); if (w > 12) b.text(x + w / 2, 13.5, T(...nm), { small: true, c }); } x += w; });
      L.legend(ctx.host, [{ c: 'c1', label: T('echogram; direct sound', 'エコーグラム、直接音') }, { c: 'c2', dash: true, label: T('reverberant field; Sabine decay', '残響音場、セイビンの減衰') }, { c: 'ink', label: T('total level', '合計のレベル') }]);
      const dr = levelDirect(2, r) - levelReverb(R.A);
      ctx.readout([
        { k: 'V, S', v: `${fmt(R.V, 0)} m³, ${fmt(R.S, 0)} m²` },
        { k: T('A, mean α', 'A、平均 α'), v: `${fmt(R.A, R.A < 100 ? 1 : 0)} m², ${fmt(R.abar, 3)}` },
        { k: T('T₆₀ Sabine, Eyring', 'T₆₀ セイビン、アイリング'), v: `${fmt(T60, 2)} s, ${fmt(TE, 2)} s`, tone: 'key' },
        { k: T('critical distance', '臨界距離'), v: `${fmt(rc, rc < 10 ? 2 : 1)} m` },
        { k: T(`direct minus reverberant at ${fmt(r, 1)} m`, `${fmt(r, 1)} m での直接音と残響音の差`), v: `${sgn(dr, 1)} dB` },
        { k: T('Schroeder frequency', 'シュレーダー周波数'), v: hz(schroeder(T60, R.V)) },
      ], T60 > 1.6
        ? T('A long decay suits orchestral music, which it blends and sustains, and harms speech, where each syllable is still sounding when the next arrives. Concert halls aim for about 2 s when full; lecture rooms for well under 1 s.', '長い減衰はオーケストラの音楽を溶け合わせ、響きを保つので合っていますが、話し言葉には害になります。次の音節が来ても前の音節がまだ鳴っているからです。コンサートホールは満席で約 2 s、講義室は 1 s を十分に下回ることを目指します。')
        : R.abar > 0.3
          ? T(`With mean α = ${fmt(R.abar, 2)} the two formulas part company: Sabine’s assumes each reflection removes a small fraction, and overestimates the decay time of absorbent rooms. Eyring’s is the better estimate here.`, `平均 α = ${fmt(R.abar, 2)} では二つの式の値は離れます。セイビンの式は反射ごとに取り除かれる割合が小さいと仮定しているので、吸音の多い部屋の減衰時間を大きく見積もります。ここではアイリングの式のほうがよい推定です。`)
          : T(`Beyond ${fmt(rc, 2)} m the reverberant field is louder than the direct sound. Moving further away no longer makes the room quieter, only less clear: the direct sound carries the detail, the reverberation carries the room.`, `${fmt(rc, 2)} m より遠くでは、残響音場のほうが直接音より大きくなります。それより離れても部屋が静かになるわけではなく、明瞭さが下がるだけです。細部を運ぶのは直接音で、部屋を運ぶのは残響です。`));
    },
  };

  /* ---------- 3. boundary reflection ---------- */
  D['boundary-reflection'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const wall = v.surf === 1, a = v.a, b = v.b, d = v.d, gg = v.g, f = Math.pow(10, v.lf), k = TAU * f / C, Rf = reflection(a, b, d);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      // plane coordinates: u along the plane, w distance from it; floor: x = u, y = w; wall: x = w, y = u
      const u0 = -1, u1 = Math.max(4, d + 1), w0 = -Math.min(2.6, a + 0.6), w1 = Math.max(a, b) + 0.8;
      const P = (u, w) => (wall ? [w, u] : [u, w]);
      L.h('p', 'lab-cap', c1, T(`Side view of the sound field at ${hz(f)}, ${wall ? 'the wall on the left' : 'the floor at the bottom'}. The shaded side is the mirror world holding the image source. Drag the speaker and the listener.`, `${hz(f)} での音場の側面図で、${wall ? '壁は左' : '床は下'}にあります。影をつけた側は鏡像音源のある鏡の世界です。スピーカーと聴き手をドラッグしてください。`));
      const fg = L.fig(c1, wall ? { x: [w0, w1], y: [u0, u1], equal: true, maxH: 380, xlabel: T('distance from the wall (m)', '壁からの距離（m）'), ylabel: T('along the wall (m)', '壁に沿った距離（m）') } : { x: [u0, u1], y: [w0, w1], equal: true, maxH: 320, xlabel: T('along the floor (m)', '床に沿った距離（m）'), ylabel: T('height (m)', '高さ（m）') });
      const paint = (ph) => fg.raster((x, y) => { const [u, w] = wall ? [y, x] : [x, y]; if (w < 0) return 0; const p = cx.mul(fieldAt(a, gg, k, u, w), cx.expj(ph)); const q = p[0] * 0.55; return Math.sign(q) * Math.min(1, Math.abs(q) ** 0.6); }, { cmap: 'div', res: 3 });
      paint(0);
      const mw = wall ? [[w0, u0], [0, u1]] : [[u0, w0], [u1, 0]];
      fg.rect(mw[0][0], mw[0][1], mw[1][0] - mw[0][0], mw[1][1] - mw[0][1], { c: 'muted', fill: 'plate', fo: 0.82, w: 0, layer: 'under' });
      fg.seg(P(u0, 0), P(u1, 0), { c: 'ink', w: 3.5, layer: 'main' });
      const S = P(0, a), I = P(0, -a), Lp = P(d, b), Rp = P(d * a / (a + b), 0);
      fg.seg(S, Lp, { c: 'c1', w: 2, layer: 'main' });
      fg.line([S, Rp, Lp], { c: 'c2', w: 2, layer: 'main' });
      fg.seg(I, Rp, { c: 'c2', w: 1.2, dash: '4 3', layer: 'main' });
      fg.circle(I[0], I[1], 0.12, { c: 'c2', w: 1.5, dash: '2 2', layer: 'main' }); fg.text(I[0], I[1], T('image', '鏡像'), { small: true, c: 'c2', anchor: 'start', dx: 12 });
      fg.handle(S[0], S[1], { c: 'c1', r: 8, axis: wall ? 'x' : 'y', label: T('Speaker', 'スピーカー'), bounds: wall ? [0.05, 2.5, S[1], S[1]] : [S[0], S[0], 0.05, 2.5], onDrag: (x, y) => ctx.set('a', Math.round(clamp(wall ? x : y, 0.05, 2.5) * 100) / 100) });
      fg.handle(Lp[0], Lp[1], { c: 'hl', r: 8, label: T('Listener', '聴き手'), bounds: wall ? [0.3, w1, 0, u1] : [0, u1, 0.3, w1], onDrag: (x, y) => { const [u, w] = wall ? [y, x] : [x, y]; ctx.set('d', Math.round(clamp(u, 0, 6) * 100) / 100, true); ctx.set('b', Math.round(clamp(w, 0.3, 4) * 100) / 100); } });
      // response
      const N = 1400, lfs = L.seq(N, (i) => 1.301 + i * 3 / (N - 1)), Hs = lfs.map((x) => dB(boundaryH(a, b, d, gg, 10 ** x)));
      L.h('p', 'lab-cap', c2, T('The response at the listener: direct sound plus reflection, relative to the direct sound alone. Drag the gold point to choose the frequency shown in the field.', '聴き手での応答で、直接音と反射の和を直接音だけに対して示しています。金色の点をドラッグして、音場に表示する周波数を選んでください。'));
      const LOGT = [[1.301, '20'], [1.699, '50'], [2, '100'], [2.301, '200'], [2.699, '500'], [3, '1k'], [3.301, '2k'], [3.699, '5k'], [4, '10k'], [4.301, '20k']];
      const gr = L.fig(c2, { x: [1.301, 4.301], y: [-30, 9], aspect: 0.62, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 300, ticksX: LOGT, ticksY: [[6, '+6'], [0, '0'], [-6, '−6'], [-12, '−12'], [-18, '−18'], [-24, '−24'], [-30, '−30']] });
      gr.hline(0, { c: 'muted', w: 1, layer: 'under' });
      const ns = notches(Rf.Delta, 20000); ns.slice(0, 4).forEach((fn, i) => { gr.vline(Math.log10(fn), { c: 'c2', w: 1, dash: '2 3', layer: 'under' }); if (i < 2) gr.text(Math.log10(fn), -28, hz(fn), { small: true, c: 'c2', anchor: 'start', dx: 3 }); });
      gr.line(lfs.map((x, i) => [x, clamp(Hs[i], -34, 12)]), { c: 'ink', w: 1.8, layer: 'main' });
      const Hf = dB(boundaryH(a, b, d, gg, f));
      gr.handle(v.lf, clamp(Hf, -30, 9), { c: 'hl', r: 7, axis: 'x', label: T('Frequency', '周波数'), bounds: [1.5, 3, -30, 9], onDrag: (x) => ctx.set('lf', Math.round(clamp(x, 1.5, 3) * 100) / 100) });
      L.legend(ctx.host, [{ c: 'c1', label: T('direct path', '直接の経路') }, { c: 'c2', label: T('reflected path; notches', '反射の経路、落ち込み') }, { c: 'ink', label: T('response at the listener', '聴き手での応答') }]);
      const ratio = gg * Rf.r1 / Rf.r2;
      ctx.readout([
        { k: 'r₁, r₂', v: `${fmt(Rf.r1, 3)} m, ${fmt(Rf.r2, 3)} m` },
        { k: T('extra path Δ, delay', '余分な経路 Δ、遅れ'), v: `${fmt(Rf.Delta, 3)} m, ${fmt(Rf.Delta / C * 1000, 2)} ms` },
        { k: T('first notches', '最初の落ち込み'), v: ns.length ? ns.slice(0, 3).map(hz).join(', ') : T('none below 20 kHz', '20 kHz より下にはなし'), tone: 'key' },
        { k: T('notch depth, peak height', '落ち込みの深さ、山の高さ'), v: `${sgn(dB(1 - ratio), 1)} dB, ${sgn(dB(1 + ratio), 1)} dB` },
        { k: T(`at ${hz(f)}`, `${hz(f)} で`), v: `${sgn(Hf, 1)} dB` },
      ], wall && a < 0.35
        ? T(`With the speaker ${fmt(a * 100, 0)} cm from the wall the first notch is at ${hz(ns[0])}, above most of the bass, and everything below it is lifted by up to ${fmt(dB(1 + ratio), 1)} dB. This is the boundary gain a “wall” equaliser setting cuts back.`, `スピーカーが壁から ${fmt(a * 100, 0)} cm では最初の落ち込みは ${hz(ns[0])} で、低音の大部分より上にあり、それより下はすべて最大 ${fmt(dB(1 + ratio), 1)} dB 持ち上がります。これが「壁」のイコライザー設定で削る境界による増強です。`)
        : T('Notches sit at odd multiples of the first one, evenly spaced in frequency, so on the logarithmic axis they crowd together towards the treble. Moving the speaker changes Δ and slides the whole comb; a smaller Δ pushes the first notch higher.', '落ち込みは最初のものの奇数倍にあり、周波数に対して等間隔です。そのため対数軸では高音に向かって詰まって見えます。スピーカーを動かすと Δ が変わり、くし全体がずれます。Δ が小さいほど最初の落ち込みは高くなります。'));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { paint(TAU * 0.6 * t); lab.textContent = T(`slowed from ${hz(f)}`, `${hz(f)} から遅くして表示`); }, { autoplay: !L.reduced(), initialT: 0 });
    },
  };
})();
