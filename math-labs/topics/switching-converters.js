'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/switching-converters.cjs); SI units ---------- */
  // Buck converter with ideal switch; the freewheeling path is an ideal diode (current cannot reverse) or a synchronous switch (it can).
  function buckDeriv(s, on, p) {
    const [i, v] = s, vsw = on ? p.Vin : p.sync || i > 0 ? 0 : v; // diode off with zero current: the switch node floats at v
    let di = (vsw - v) / p.L; if (!on && !p.sync && i <= 0 && di < 0) di = 0;
    return [di, (i - v / p.R) / p.C];
  }
  function buckStep(s, on, p, h) {
    const k1 = buckDeriv(s, on, p), s2 = [s[0] + (h / 2) * k1[0], s[1] + (h / 2) * k1[1]], k2 = buckDeriv(s2, on, p), s3 = [s[0] + (h / 2) * k2[0], s[1] + (h / 2) * k2[1]], k3 = buckDeriv(s3, on, p), s4 = [s[0] + h * k3[0], s[1] + h * k3[1]], k4 = buckDeriv(s4, on, p);
    const out = [s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
    if (!on && !p.sync && out[0] < 0) out[0] = 0;
    return out;
  }
  // periodic steady state: Newton's method on the one-period map (shooting), from the averaged solution; returns one period sampled
  function buckPeriod(s0, p, per) { const h = 1 / p.fs / per; let s = s0; for (let k = 0; k < per; k++) s = buckStep(s, k < p.D * per, p, h); return s; }
  function buckSteady(p, iters = 30, per = 400) {
    const Ts = 1 / p.fs, h = Ts / per, K = (2 * p.L) / (p.R * Ts), ccm = p.sync || K >= 1 - p.D;
    const M0 = ccm ? p.D : dcmRatio(p.D, K), I0 = (M0 * p.Vin) / p.R;
    let s = [ccm ? I0 - buckRipple(p.Vin, p.D, p.L, p.fs) / 2 : 0, M0 * p.Vin];
    if (!p.sync) s[0] = Math.max(0, s[0]);
    for (let it = 0; it < iters; it++) {
      const F = buckPeriod(s, p, per).map((x, q) => x - s[q]);
      if (Math.abs(F[0]) < 1e-12 * (1 + Math.abs(I0)) && Math.abs(F[1]) < 1e-12 * p.Vin) break;
      const ei = 1e-6 * (1 + Math.abs(I0)), ev = 1e-6 * p.Vin, J = [[0, 0], [0, 0]];
      const si = [s[0] + ei, s[1]], sv = [s[0], s[1] + ev], Pi = buckPeriod(si, p, per), Pv = buckPeriod(sv, p, per), P0 = F.map((x, q) => x + s[q]);
      J[0][0] = (Pi[0] - P0[0]) / ei - 1; J[1][0] = (Pi[1] - P0[1]) / ei; J[0][1] = (Pv[0] - P0[0]) / ev; J[1][1] = (Pv[1] - P0[1]) / ev - 1;
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; if (!det) break;
      const d0 = (-F[0] * J[1][1] + F[1] * J[0][1]) / det, d1 = (-J[0][0] * F[1] + J[1][0] * F[0]) / det;
      s = [s[0] + d0, s[1] + d1]; if (!p.sync && s[0] < 0) s[0] = 0;
    }
    const t = [], i = [], v = [], vsw = [];
    for (let k = 0; k <= per; k++) { const on = k < p.D * per; t.push(k * h); i.push(s[0]); v.push(s[1]); vsw.push(on ? p.Vin : p.sync || s[0] > 1e-9 ? 0 : s[1]); if (k < per) s = buckStep(s, on, p, h); }
    // trapezoidal means over the period
    const mean = (a) => { let m = 0; for (let k = 0; k < per; k++) m += (a[k] + a[k + 1]) / 2; return m / per; };
    return { t, i, v, vsw, Ts, Vavg: mean(v), Iavg: mean(i), ipk: Math.max(...i), imin: Math.min(...i), vpp: Math.max(...v) - Math.min(...v) };
  }
  const buckRipple = (Vin, D, Lh, fs) => ((Vin - D * Vin) * D) / (Lh * fs); // ΔI in continuous conduction
  const buckVRipple = (dI, fs, C) => dI / (8 * fs * C);
  // ideal and lossy (inductor winding resistance R_L, a = R_L / R) conversion ratios
  function ratio(type, Dc, a = 0) {
    const u = 1 - Dc;
    if (type === 0) return { M: Dc / (1 + a), eta: 1 / (1 + a) };
    const eta = 1 / (1 + a / (u * u));
    if (type === 1) return { M: eta / u, eta };
    return { M: (-Dc * eta) / u, eta };
  }
  const boostMax = (a) => ({ D: 1 - Math.sqrt(a), M: 1 / (2 * Math.sqrt(a)) });
  // discontinuous conduction in the buck: K = 2L/(R Ts), boundary K = 1 − D
  const dcmRatio = (Dc, K) => 2 / (1 + Math.sqrt(1 + (4 * K) / (Dc * Dc)));
  const buckRatioK = (Dc, K) => (K >= 1 - Dc ? Dc : dcmRatio(Dc, K));
  const kCrit = (Dc) => 1 - Dc;
  const dcmD2 = (Dc, M) => (Dc * (1 - M)) / M;

  (window.LabModels = window.LabModels || {})['switching-converters'] = { buckDeriv, buckStep, buckPeriod, buckSteady, buckRipple, buckVRipple, ratio, boostMax, dcmRatio, buckRatioK, kCrit, dcmD2 };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const FS = 200e3, CAP = 47e-6;
  const unit = (x, u) => { const a = Math.abs(x); return a >= 1 ? `${fmt(x, 3)} ${u}` : a >= 1e-3 ? `${fmt(x * 1e3, 3)} m${u}` : `${fmt(x * 1e6, 3)} µ${u}`; };

  // circuit drawing on a stage (y up)
  function parts(s) {
    const wire = (a, b, c = 'ink', w = 1.6) => s.seg(a, b, { c, w });
    const res = (a, b, c, label) => { const n = 6, pts = [a]; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, z = i % 2 ? -1.8 : 1.8; pts.push(a[0] === b[0] ? [a[0] + z, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, a[1] + z]); } pts.push(b); s.line(pts, { c, w: 1.8 }); if (label) s.text(a[0] === b[0] ? a[0] + 4 : (a[0] + b[0]) / 2, a[0] === b[0] ? (a[1] + b[1]) / 2 : a[1] + 4.5, label, { small: true, c, anchor: a[0] === b[0] ? 'start' : 'middle', dy: 4 }); };
    const coil = (a, b, c, label) => { const n = 4, r = (b[0] - a[0]) / (2 * n); for (let i = 0; i < n; i++) s.line(L.sample(0, Math.PI, 14, (t) => [a[0] + r + 2 * r * i - r * Math.cos(t), a[1] + Math.abs(r) * Math.sin(t) * 1.3]), { c, w: 1.9 }); if (label) s.text((a[0] + b[0]) / 2, a[1] + 5.5, label, { small: true, c }); };
    const cap = (a, b, c, label) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; wire(a, [m[0], m[1] + 1]); wire([m[0], m[1] - 1], b); s.seg([m[0] - 3.2, m[1] + 1], [m[0] + 3.2, m[1] + 1], { c, w: 2.4 }); s.seg([m[0] - 3.2, m[1] - 1], [m[0] + 3.2, m[1] - 1], { c, w: 2.4 }); if (label) s.text(m[0] + 4.5, m[1], label, { small: true, c, anchor: 'start', dy: 4 }); };
    // diode pointing from a to b (vertical)
    const diode = (a, b, c, label) => { const m = (a[1] + b[1]) / 2, dir = Math.sign(b[1] - a[1]); wire(a, [a[0], m - 2 * dir]); wire([a[0], m + 2 * dir], b); s.poly([[a[0] - 2.6, m - 2 * dir], [a[0] + 2.6, m - 2 * dir], [a[0], m + 2 * dir]], { c, fill: c, fo: 0.25, w: 1.6 }); s.seg([a[0] - 2.6, m + 2 * dir], [a[0] + 2.6, m + 2 * dir], { c, w: 2 }); if (label) s.text(a[0] - 4, m, label, { small: true, c, anchor: 'end', dy: 4 }); };
    const sw = (a, b, closed, c, label, vert) => {
      const k = (x, y) => s.circle(x, y, 1.1, { c, w: 1.6, fill: 'plate', fo: 1 });
      if (vert) { const m = (a[1] + b[1]) / 2; wire(a, [a[0], m - 3.2]); wire([a[0], m + 3.2], b); s.seg([a[0], m - 3.2], closed ? [a[0], m + 3.2] : [a[0] - 4.2, m + 2.4], { c, w: 2.6 }); k(a[0], m - 3.2); k(a[0], m + 3.2); if (label) s.text(a[0] - 5, m, label, { small: true, c, anchor: 'end', dy: 4 }); }
      else { const m = (a[0] + b[0]) / 2; wire(a, [m - 3.6, a[1]]); wire([m + 3.6, a[1]], b); s.seg([m - 3.6, a[1]], closed ? [m + 3.6, a[1]] : [m + 2.6, a[1] + 4.4], { c, w: 2.6 }); k(m - 3.6, a[1]); k(m + 3.6, a[1]); if (label) s.text(m, a[1] + 6.5, label, { small: true, c }); }
    };
    const src = (x, y0, y1, label) => { const m = (y0 + y1) / 2; wire([x, y1], [x, m + 4]); wire([x, m - 4], [x, y0]); s.circle(x, m, 4, { c: 'ink', w: 1.6 }); s.text(x, m + 1.6, '+', { small: true, c: 'ink', dy: 0 }); s.text(x, m - 3.6, '−', { small: true, c: 'ink', dy: 0 }); if (label) s.text(x + 5.5, m, label, { small: true, c: 'ink', anchor: 'start', dy: 4 }); };
    return { wire, res, coil, cap, diode, sw, src };
  }

  /* ---------- 1. the buck converter ---------- */
  D['buck-converter'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const p = { Vin: v.Vin, D: v.D, L: v.L * 1e-6, C: CAP, R: v.R, fs: FS, sync: v.sync === 1 };
      const S = buckSteady(p), Ts = S.Ts, per = S.t.length - 1;
      const K = (2 * p.L) / (p.R * Ts), dcm = !p.sync && K < 1 - p.D, dI = buckRipple(p.Vin, p.D, p.L, FS);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const cap = L.h('p', 'lab-cap', c1, '');
      const s = L.stage(c1, { w: 100, h: 58, maxH: 300 });
      const Gs = s.group('main');
      // waveforms: two periods, time in µs
      const tus = (k) => (k * Ts * 1e6) / per, TT = 2 * Ts * 1e6;
      const ii = S.i.concat(S.i.slice(1)), vv = S.v.concat(S.v.slice(1)), vs = S.vsw.concat(S.vsw.slice(1)), idx = L.seq(2 * per + 1, (k) => k);
      L.h('p', 'lab-cap', c2, T('Switch-node voltage (violet) and inductor current (blue) over two switching periods at 200 kHz. Drag the gold corner, the end of the on time, to change the duty cycle D.', '200 kHz での二つのスイッチング周期にわたるスイッチ節点の電圧（紫）とインダクタ電流（青）です。オン時間の終わりにあたる金色の角をドラッグして、デューティ比 D を変えてください。'));
      const imax = Math.max(1, S.ipk * 1.25), imin = Math.min(0, S.imin * 1.25);
      const g = L.fig(c2, { x: [0, TT], y: [imin, imax], aspect: 0.55, xlabel: 't (µs)', ylabel: T('i_L (A)', 'i_L（A）'), maxH: 260 });
      const vk = (imax - imin) / (1.15 * p.Vin);
      g.area(idx.map((k) => [tus(k), imin + 0.02 * (imax - imin) + vs[k] * vk * 0.98]), { c: 'c4', fill: 'c4', fo: 0.12, base: imin, w: 1.2, layer: 'under' });
      g.text(TT * 0.01, imin + 0.02 * (imax - imin) + p.Vin * vk * 0.98, `v_sw = ${fmt(p.Vin, 3)} V`, { small: true, c: 'c4', anchor: 'start', dy: -6 });
      g.hline(0, { c: 'muted', w: 1, dash: false, layer: 'under' });
      g.hline(S.Iavg, { c: 'c1', w: 1.2, dash: '5 4', layer: 'under' }); g.text(TT, S.Iavg, `I = ${fmt(S.Iavg, 3)} A`, { small: true, c: 'c1', anchor: 'end', dy: -6 });
      g.line(idx.map((k) => [tus(k), ii[k]]), { c: 'c1', w: 2.6 });
      const kp = Math.round(p.D * per);
      g.handle(tus(kp), S.i[kp], { c: 'hl', r: 7, axis: 'x', label: T('Duty cycle D', 'デューティ比 D'), bounds: [0.05 * Ts * 1e6, 0.95 * Ts * 1e6, imin, imax], onDrag: (x) => ctx.set('D', Math.round(clamp(x / (Ts * 1e6), 0.05, 0.95) * 100) / 100) });
      const cur = g.group('over');
      L.h('p', 'lab-cap', c2, T('Output voltage ripple, in millivolts about its average.', '出力電圧のリプルを、平均からのミリボルトで示します。'));
      const vm = Math.max(0.5, (S.vpp * 1e3) / 2 * 1.3);
      const h = L.fig(c2, { x: [0, TT], y: [-vm, vm], aspect: 0.26, xlabel: 't (µs)', ylabel: 'mV', maxH: 130 });
      h.hline(0, { c: 'muted', w: 1, layer: 'under' }); h.line(idx.map((k) => [tus(k), (vv[k] - S.Vavg) * 1e3]), { c: 'c3', w: 2 });
      const cur2 = h.group('over');
      L.legend(ctx.host, [{ c: 'c4', kind: 'fill', label: T('switch-node voltage v_sw', 'スイッチ節点の電圧 v_sw') }, { c: 'c1', label: T('inductor current i_L', 'インダクタ電流 i_L') }, { c: 'c3', label: T('output ripple', '出力リプル') }, { c: 'hl', label: T('current path now', '今の電流の経路') }]);
      const draw = (k) => {
        const kk = ((k % per) + per) % per, on = kk < p.D * per, il = S.i[kk], flow = il > 1e-6 || (p.sync && il < -1e-6);
        while (Gs.firstChild) Gs.removeChild(Gs.firstChild); while (cur.firstChild) cur.removeChild(cur.firstChild); while (cur2.firstChild) cur2.removeChild(cur2.firstChild);
        const sub = parts({ seg: (a, b, o) => Gs.appendChild(s.seg(a, b, o)), line: (pts, o) => Gs.appendChild(s.line(pts, o)), poly: (pts, o) => Gs.appendChild(s.poly(pts, o)), text: (x, y, t, o) => Gs.appendChild(s.text(x, y, t, o)), dot: (x, y, o) => Gs.appendChild(s.dot(x, y, Object.assign({ layer: 'main' }, o))), circle: (x, y, r, o) => Gs.appendChild(s.circle(x, y, r, o)) });
        const yt = 46, yb = 10, hot = (x) => (x ? 'hl' : 'ink'), hw = (x) => (x ? 3.4 : 1.6);
        const pathOn = on && flow, pathOff = !on && flow;
        // input source and high-side switch
        sub.src(8, yb, yt, 'V_in');
        sub.wire([8, yt], [16, yt], hot(pathOn), hw(pathOn)); sub.sw([16, yt], [34, yt], on, pathOn ? 'hl' : 'ink', 'S');
        // switch node, freewheeling device to ground
        sub.wire([34, yt], [42, yt], hot(flow), hw(flow));
        if (p.sync) sub.sw([42, yb], [42, yt], !on, pathOff ? 'hl' : 'ink', 'S₂', true); else sub.diode([42, yb], [42, yt], pathOff ? 'hl' : 'ink', 'D');
        // inductor, output node, capacitor, load
        sub.coil([42, yt], [62, yt], flow ? 'hl' : 'c1', 'L'); sub.wire([62, yt], [90, yt], hot(flow), hw(flow));
        sub.cap([74, yt], [74, yb], 'c3', 'C'); sub.wire([90, yt], [90, yt - 8], hot(flow), hw(flow)); sub.res([90, yt - 8], [90, yb + 8], flow ? 'hl' : 'c2', 'R'); sub.wire([90, yb + 8], [90, yb], hot(flow), hw(flow));
        sub.wire([8, yb], [42, yb], hot(pathOn), hw(pathOn)); sub.wire([42, yb], [90, yb], hot(flow), hw(flow));
        if (flow) { const ax = 69, dir = il > 0 ? 1 : -1; Gs.appendChild(s.arrow([ax - 3 * dir, yt + 3.5], [ax + 3 * dir, yt + 3.5], { c: 'hl', w: 2 })); }
        Gs.appendChild(s.text(96, yt + 4, `V = ${fmt(S.Vavg, 3)} V`, { small: true, c: 'c3', anchor: 'end' }));
        cap.textContent = on
          ? T(`On: the switch connects the inductor to ${fmt(p.Vin, 3)} V, and the current ramps up at (V_in − V)/L.`, `オン：スイッチがインダクタを ${fmt(p.Vin, 3)} V につなぎ、電流は (V_in − V)/L で増えます。`)
          : flow ? T(`Off: the inductor keeps the current flowing through the ${p.sync ? 'second switch' : 'diode'}, and it ramps down at V/L.`, `オフ：インダクタが${p.sync ? '第二のスイッチ' : 'ダイオード'}を通して電流を流し続け、電流は V/L で減ります。`)
            : T('Off, and the inductor current has reached zero: the diode blocks, nothing flows, and the capacitor alone feeds the load. This is discontinuous conduction.', 'オフで、インダクタ電流が 0 に達しました。ダイオードが阻止して何も流れず、コンデンサだけが負荷に電流を供給します。これが電流不連続モードです。');
        const tk = tus(((k % (2 * per)) + 2 * per) % (2 * per));
        cur.appendChild(g.vline(tk, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); cur2.appendChild(h.vline(tk, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' }));
      };
      ctx.readout([
        { k: 'D', v: fmt(p.D, 2), tone: 'key' },
        { k: T('V_out (average)', 'V_out（平均）'), v: `${fmt(S.Vavg, 4)} V` },
        { k: 'D·V_in', v: `${fmt(p.D * p.Vin, 4)} V` },
        { k: T('ripple ΔI_L', 'リプル ΔI_L'), v: `${fmt(S.ipk - S.imin, 3)} A` },
        { k: T('ripple ΔV_out', 'リプル ΔV_out'), v: unit(S.vpp, 'V') },
        { k: T('mode', 'モード'), v: dcm ? T('discontinuous', '不連続') : T('continuous', '連続'), tone: dcm ? 'warn' : 'good' },
      ], dcm
        ? T(`With this light a load the current ripple ${fmt(dI, 3)} A would exceed twice the load current, so the diode cuts off each cycle and the output rises above D·V_in, to ${fmt(S.Vavg, 4)} V. A synchronous switch lets the current run negative and restores V = D·V_in.`, `この軽い負荷では電流リプル ${fmt(dI, 3)} A が負荷電流の二倍を超えるので、ダイオードは毎周期遮断し、出力は D·V_in を超えて ${fmt(S.Vavg, 4)} V になります。同期スイッチなら電流が負になることを許すので、V = D·V_in に戻ります。`)
        : T(`Volt-second balance: the inductor current returns to where it started each period, so (V_in − V)·D = V·(1 − D) and V = D·V_in. The ripple ΔI = (V_in − V)D/(L f) = ${fmt(dI, 3)} A, and the capacitor smooths the output to ΔV ≈ ΔI/(8 f C) = ${unit(buckVRipple(dI, FS, CAP), 'V')}.`, `ボルト秒の釣り合い：インダクタ電流は各周期で元の値に戻るので、(V_in − V)·D = V·(1 − D) で V = D·V_in です。リプルは ΔI = (V_in − V)D/(L f) = ${fmt(dI, 3)} A で、コンデンサが出力を ΔV ≈ ΔI/(8 f C) = ${unit(buckVRipple(dI, FS, CAP), 'V')} まで平滑にします。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const k = Math.floor(t * per * 0.45); draw(k); lb.textContent = T(`t = ${fmt(tus(((k % (2 * per)) + 2 * per) % (2 * per)), 3)} µs, slowed`, `t = ${fmt(tus(((k % (2 * per)) + 2 * per) % (2 * per)), 3)} µs（遅くして表示）`); }, { autoplay: !L.reduced(), initialT: (0.5 * p.D) / 0.45 });
    },
  };

  /* ---------- 2. conversion ratios and losses ---------- */
  const TYPES = [['buck', '降圧'], ['boost', '昇圧'], ['buck-boost', '昇降圧']];
  D['conversion-ratios'] = {
    render(ctx, v) {
      const type = v.type, Dc = v.D, a = v.a / 100, r = ratio(type, Dc, a), r0 = ratio(type, Dc, 0);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, [
        T('Buck: the switch chops the input, the inductor and capacitor average it. V = D·V_in.', '降圧：スイッチが入力を刻み、インダクタとコンデンサがそれを平均します。V = D·V_in です。'),
        T('Boost: with the switch closed the inductor charges from the input; when it opens, the inductor’s voltage adds to the input’s and pushes current through the diode. V = V_in/(1 − D).', '昇圧：スイッチが閉じている間インダクタは入力から蓄え、開くとインダクタの電圧が入力に加わって、ダイオードを通して電流を押し出します。V = V_in/(1 − D) です。'),
        T('Buck-boost: the inductor charges from the input, then empties into the output alone, with the polarity reversed. V = −D·V_in/(1 − D).', '昇降圧：インダクタは入力から蓄え、その後出力だけへ放出し、極性は反転します。V = −D·V_in/(1 − D) です。'),
      ][type]);
      const s = L.stage(c1, { w: 100, h: 50, maxH: 220 }), P = parts(s), yt = 40, yb = 8;
      P.src(8, yb, yt, 'V_in');
      if (type === 0) { P.wire([8, yt], [14, yt]); P.sw([14, yt], [32, yt], true, 'c4', 'S'); P.wire([32, yt], [40, yt]); P.diode([40, yb], [40, yt], 'c2', 'D'); P.coil([40, yt], [60, yt], 'c1', 'L'); P.wire([60, yt], [90, yt]); }
      else if (type === 1) { P.wire([8, yt], [14, yt]); P.coil([14, yt], [34, yt], 'c1', 'L'); P.wire([34, yt], [42, yt]); P.sw([42, yb], [42, yt], true, 'c4', 'S', true); s.line([[42, yt], [50, yt]], { c: 'ink', w: 1.6 }); s.poly([[50, yt + 2.6], [50, yt - 2.6], [54, yt]], { c: 'c2', fill: 'c2', fo: 0.25, w: 1.6 }); s.seg([54, yt + 2.6], [54, yt - 2.6], { c: 'c2', w: 2 }); s.text(52, yt + 5.5, 'D', { small: true, c: 'c2' }); P.wire([54, yt], [90, yt]); }
      else { P.wire([8, yt], [14, yt]); P.sw([14, yt], [32, yt], true, 'c4', 'S'); P.wire([32, yt], [44, yt]); s.seg([44, yt], [44, yt - 6], { c: 'ink', w: 1.6 }); const yc = (yt + yb) / 2; for (let i = 0; i < 4; i++) s.line(L.sample(0, Math.PI, 14, (t) => [44 + 2.3 * Math.sin(t), yt - 6 - 2.3 - 4.6 * i + 2.3 * Math.cos(t)]), { c: 'c1', w: 1.9 }); s.seg([44, yt - 6 - 18.4], [44, yb], { c: 'ink', w: 1.6 }); s.text(48, yc + 3, 'L', { small: true, c: 'c1', anchor: 'start' }); P.wire([44, yt], [52, yt]); s.poly([[56, yt + 2.6], [56, yt - 2.6], [52, yt]], { c: 'c2', fill: 'c2', fo: 0.25, w: 1.6 }); s.seg([52, yt + 2.6], [52, yt - 2.6], { c: 'c2', w: 2 }); s.text(54, yt + 5.5, 'D', { small: true, c: 'c2' }); P.wire([56, yt], [90, yt]); }
      P.cap([74, yt], [74, yb], 'c3', 'C'); P.wire([90, yt], [90, yt - 7]); P.res([90, yt - 7], [90, yb + 7], 'c2', 'R'); P.wire([90, yb + 7], [90, yb]); P.wire([8, yb], [90, yb]);
      s.text(96, yt + 4, type === 2 ? '−V' : 'V', { small: true, c: 'c3', anchor: 'end' });
      // efficiency panel under the circuit
      L.h('p', 'lab-cap', c1, T(`Efficiency η with the inductor’s winding resistance R_L = ${fmt(v.a, 2)}% of R.`, `インダクタの巻線抵抗 R_L = R の ${fmt(v.a, 2)}% のときの効率 η です。`));
      const e = L.fig(c1, { x: [0, 1], y: [0, 1.04], aspect: 0.42, xlabel: 'D', ylabel: 'η', maxH: 180, ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      e.line(L.sample(0.001, 0.995, 300, (d) => [d, ratio(type, d, a).eta]), { c: 'c3', w: 2.2 }); e.dot(Dc, r.eta, { c: 'hl', r: 5 });
      // M(D)
      const ymax = type === 0 ? 1.05 : 6, ymin = type === 2 ? -6 : 0, Mv = (d, aa) => ratio(type, d, aa).M;
      L.h('p', 'lab-cap', c2, T(`Conversion ratio M = V/V_in against duty cycle D: ideal (dashed) and with the winding resistance (solid). Drag the gold point.`, `デューティ比 D に対する変換比 M = V/V_in です。理想（破線）と巻線抵抗あり（実線）を示します。金色の点をドラッグしてください。`));
      const g = L.fig(c2, { x: [0, 1], y: [ymin, ymax], aspect: 0.86, xlabel: 'D', ylabel: 'M', maxH: 400 });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' }); if (type) g.hline(type === 1 ? 1 : -1, { c: 'muted', w: 1, dash: '2 4', layer: 'under' });
      g.line(L.sample(0, 0.995, 400, (d) => [d, clamp(Mv(d, 0), ymin - 1, ymax + 1)]), { c: 'c1', w: 1.6, dash: '6 4' });
      g.line(L.sample(0, 0.999, 500, (d) => [d, clamp(Mv(d, a), ymin - 1, ymax + 1)]), { c: 'c1', w: 2.8 });
      let peak = null;
      if (type && a > 0) { let best = 0, bd = 0; for (let k = 0; k <= 4000; k++) { const d = k / 4000 * 0.9999, m = Math.abs(Mv(d, a)); if (m > best) { best = m; bd = d; } } peak = { D: bd, M: best }; const yy = type === 2 ? -best : best; if (Math.abs(yy) < Math.max(Math.abs(ymin), ymax)) { g.dot(bd, yy, { c: 'c2', r: 4.5 }); g.text(bd, yy, T(`max |M| = ${fmt(best, 3)}`, `最大 |M| = ${fmt(best, 3)}`), { small: true, c: 'c2', anchor: 'end', dx: -8, dy: type === 2 ? 16 : -8 }); } }
      g.handle(Dc, clamp(r.M, ymin, ymax), { c: 'hl', r: 7, axis: 'x', label: 'D', bounds: [0, 0.99, ymin, ymax], onDrag: (x) => ctx.set('D', Math.round(clamp(x, 0, 0.99) * 100) / 100) });
      L.legend(ctx.host, [{ c: 'c1', dash: true, label: T('ideal', '理想') }, { c: 'c1', label: T('with winding resistance', '巻線抵抗あり') }, { c: 'c3', label: T('efficiency η', '効率 η') }, { c: 'hl', kind: 'dot', label: T('operating point', '動作点') }]);
      ctx.readout([
        { k: T('converter', '変換器'), v: T(...TYPES[type]), tone: 'key' },
        { k: 'D', v: fmt(Dc, 2) },
        { k: T('M ideal', 'M 理想'), v: fmt(r0.M, 4) },
        { k: T('M with R_L', 'M（R_L あり）'), v: fmt(r.M, 4), tone: 'good' },
        { k: 'η', v: `${fmt(100 * r.eta, 3)}%` },
      ].concat(peak ? [{ k: T('largest |M| possible', '可能な最大の |M|'), v: `${fmt(peak.M, 3)} (D = ${fmt(peak.D, 3)})`, tone: 'warn' }] : []), type === 0
        ? T('In the buck the inductor carries the load current at every duty cycle, so the winding resistance costs the same fraction, R_L/(R + R_L), everywhere.', '降圧ではインダクタがどのデューティ比でも負荷電流を流すので、巻線抵抗による損失の割合 R_L/(R + R_L) はどこでも同じです。')
        : a === 0 ? T('With no winding resistance the ideal formula holds exactly and |M| grows without limit as D approaches 1. Add even 1% of resistance to see the ceiling appear.', '巻線抵抗がなければ理想の式がそのまま成り立ち、D が 1 に近づくと |M| は限りなく大きくなります。1% の抵抗を加えるだけで、上限が現れるのが見えます。')
        : T(`The inductor carries the input current, the load current divided by 1 − D, so its loss grows as 1/(1 − D)²: past D = ${peak ? fmt(peak.D, 3) : '1'} more duty cycle gives less output, and the ideal formula’s promise of unlimited gain collapses.${type === 1 && a > 0 ? ` For the boost the peak is exactly M = 1/(2√(R_L/R)) = ${fmt(boostMax(a).M, 4)}.` : ''}`, `インダクタは入力電流、つまり負荷電流を 1 − D で割ったものを流すので、その損失は 1/(1 − D)² で増えます。D = ${peak ? fmt(peak.D, 3) : '1'} を超えるとデューティ比を増やすほど出力は下がり、理想の式が約束する無制限の利得は崩れます。${type === 1 && a > 0 ? `昇圧ではピークはちょうど M = 1/(2√(R_L/R)) = ${fmt(boostMax(a).M, 4)} です。` : ''}`));
    },
  };

  /* ---------- 3. continuous and discontinuous conduction ---------- */
  D['ccm-dcm'] = {
    render(ctx, v) {
      const Dc = v.D, K = Math.pow(10, v.lk), M = buckRatioK(Dc, K), dcm = K < kCrit(Dc), D2 = dcm ? dcmD2(Dc, M) : 1 - Dc;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The operating plane of a buck converter with a diode: duty cycle D across, K = 2L/(R·T_s) up, on a log scale. Below the boundary K = 1 − D the current runs dry each cycle. Drag the gold point.', 'ダイオードを使う降圧変換器の動作平面です。横がデューティ比 D、縦が対数目盛の K = 2L/(R·T_s) です。境界 K = 1 − D より下では、電流が毎周期尽きます。金色の点をドラッグしてください。'));
      const f = L.fig(c1, { x: [0, 1], y: [-2, 0.5], aspect: 0.86, xlabel: 'D', ylabel: 'K', maxH: 400, ticksY: [[-2, '0.01'], [-1, '0.1'], [0, '1'], [Math.log10(3), '3']] });
      f.raster((x, y) => (Math.pow(10, y) < 1 - x ? 0.16 : 0), { cmap: 'warm', res: 3 });
      f.line(L.sample(0, 0.99, 200, (d) => [d, Math.log10(1 - d)]), { c: 'c2', w: 2.4 });
      f.text(0.08, -1.55, T('discontinuous', '不連続'), { small: true, c: 'c2', anchor: 'start' }); f.text(0.7, -0.12, T('continuous', '連続'), { small: true, c: 'c1', anchor: 'start' });
      // contours of M
      [0.2, 0.4, 0.6, 0.8].forEach((m) => { const pts = []; for (let k = 0; k <= 160; k++) { const lk = -2 + (2.5 * k) / 160, KK = Math.pow(10, lk); // solve buckRatioK(d, KK) = m for d
        let lo = 0.001, hi = 0.999; for (let j = 0; j < 50; j++) { const mid = (lo + hi) / 2; if (buckRatioK(mid, KK) < m) lo = mid; else hi = mid; } pts.push([(lo + hi) / 2, lk]); }
        f.line(pts, { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); f.text(pts[pts.length - 1][0], 0.5, `M = ${m}`, { small: true, c: 'muted', dy: 12, dx: 2, anchor: 'start' }); });
      f.handle(Dc, v.lk, { c: 'hl', r: 8, label: T('Operating point (D, K)', '動作点 (D, K)'), bounds: [0.05, 0.95, -2, 0.5], onDrag: (x, y) => { ctx.set('D', Math.round(clamp(x, 0.05, 0.95) * 100) / 100, true); ctx.set('lk', Math.round(clamp(y, -2, 0.5) * 100) / 100); } });
      // M against D at this K
      L.h('p', 'lab-cap', c2, T(`Conversion ratio M = V/V_in against D at K = ${fmt(K, 3)}: in discontinuous conduction the output rises above D·V_in (dashed).`, `K = ${fmt(K, 3)} での D に対する変換比 M = V/V_in です。不連続モードでは出力が D·V_in（破線）を超えて上がります。`));
      const g = L.fig(c2, { x: [0, 1], y: [0, 1.02], aspect: 0.5, xlabel: 'D', ylabel: 'M', maxH: 220 });
      g.line([[0, 0], [1, 1]], { c: 'c1', w: 1.4, dash: '6 4' });
      g.line(L.sample(0.002, 0.999, 300, (d) => [d, buckRatioK(d, K)]), { c: 'c1', w: 2.6 });
      if (K < 1) g.vline(1 - K, { c: 'c2', w: 1.2, dash: '4 3', layer: 'under' });
      g.dot(Dc, M, { c: 'hl', r: 6 });
      // the inductor current over one period, in units of V_in·T_s/L
      L.h('p', 'lab-cap', c2, T('Inductor current over one period, in units of V_in·T_s/L: rising for D, falling for D₂, and zero for whatever is left.', 'インダクタ電流を V_in·T_s/L を単位として一周期分示します。D の間増え、D₂ の間減り、残りの間は 0 です。'));
      const Iav = (M * K) / 2, dI = (1 - M) * Dc, i0 = dcm ? 0 : Iav - dI / 2, ip = i0 + dI;
      const pts = dcm ? [[0, 0], [Dc, ip], [Dc + D2, 0], [1, 0]] : [[0, i0], [Dc, ip], [1, i0]];
      const top = Math.max(ip * 1.2, 0.05);
      const h = L.fig(c2, { x: [0, 1], y: [0, top], aspect: 0.36, xlabel: T('time / T_s', '時間 / T_s'), maxH: 160 });
      h.area(pts, { c: 'c1', fill: 'c1', fo: 0.15, base: 0, w: 2.6 });
      h.hline(Iav, { c: 'c1', w: 1.2, dash: '5 4', layer: 'under' });
      h.vline(Dc, { c: 'muted', w: 1, dash: '2 3', layer: 'under' }); if (dcm) h.vline(Dc + D2, { c: 'muted', w: 1, dash: '2 3', layer: 'under' });
      h.text(Dc / 2, top * 0.88, 'D', { small: true, c: 'ink' }); h.text(Dc + D2 / 2, top * 0.88, 'D₂', { small: true, c: 'ink' }); if (dcm && Dc + D2 < 0.97) h.text((1 + Dc + D2) / 2, top * 0.88, 'D₃', { small: true, c: 'c2' });
      L.legend(ctx.host, [{ c: 'c2', label: T('boundary K = 1 − D', '境界 K = 1 − D') }, { c: 'c1', label: T('M at this K; inductor current', 'この K での M、インダクタ電流') }, { c: 'c1', dash: true, label: T('ideal M = D; average current', '理想 M = D、平均電流') }, { c: 'hl', kind: 'dot', label: T('operating point', '動作点') }]);
      ctx.readout([
        { k: 'K', v: fmt(K, 3), tone: 'key' },
        { k: T('K_crit = 1 − D', 'K_crit = 1 − D'), v: fmt(kCrit(Dc), 3) },
        { k: T('mode', 'モード'), v: dcm ? T('discontinuous', '不連続') : T('continuous', '連続'), tone: dcm ? 'warn' : 'good' },
        { k: 'M', v: fmt(M, 4) },
        { k: 'D₂', v: fmt(D2, 3) },
        { k: T('idle fraction D₃', '休止の割合 D₃'), v: dcm ? fmt(1 - Dc - D2, 3) : '0' },
      ], dcm
        ? T(`The current reaches zero after D + D₂ = ${fmt(Dc + D2, 3)} of the period and stays there. Volt-seconds still balance, (V_in − V)D = V·D₂, but D₂ is no longer 1 − D, so the output depends on the load: M = 2/(1 + √(1 + 4K/D²)) = ${fmt(M, 4)}.`, `電流は周期の D + D₂ = ${fmt(Dc + D2, 3)} の時点で 0 に達し、そのままです。ボルト秒はやはり釣り合い (V_in − V)D = V·D₂ ですが、D₂ はもう 1 − D ではないので、出力は負荷に依存します。M = 2/(1 + √(1 + 4K/D²)) = ${fmt(M, 4)} です。`)
        : T('The inductor current never reaches zero, so the falling ramp fills the rest of the period, D₂ = 1 − D, and M = D whatever the load. Lighten the load (smaller K) and the valley of the ripple sinks until it touches zero at K = 1 − D.', 'インダクタ電流は決して 0 にならないので、下りの傾斜が周期の残りを満たして D₂ = 1 − D となり、負荷によらず M = D です。負荷を軽くする（K を小さくする）とリプルの谷が下がり、K = 1 − D で 0 に触れます。'));
    },
  };
})();
