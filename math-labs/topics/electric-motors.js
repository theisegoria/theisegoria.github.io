'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const TAU = 2 * Math.PI;

  /* ---------- model (pure, checked by checks/electric-motors.cjs); SI units ---------- */
  // complex arithmetic on [re, im]
  const C = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], sub: (a, b) => [a[0] - b[0], a[1] - b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, abs: (a) => Math.hypot(a[0], a[1]), exp: (t) => [Math.cos(t), Math.sin(t)], scale: (a, s) => [a[0] * s, a[1] * s], conj: (a) => [a[0], -a[1]] };
  const par = (a, b) => C.div(C.mul(a, b), C.add(a, b));

  // 1. three windings 120° apart; i_k = A_k cos(ωt + φ_k); field vector Σ i_k û_k
  const AXES = [0, TAU / 3, (2 * TAU) / 3];
  function supply(mode, ub) {
    if (mode === 3) return { A: [1, 0, 0], ph: [0, 0, 0] };
    const A = mode === 1 ? [1, 1, ub] : [1, 1, 1], ph = mode === 2 ? [0, TAU / 3, -TAU / 3] : [0, -TAU / 3, TAU / 3];
    return { A, ph };
  }
  const currents = (s, wt) => s.A.map((a, k) => a * Math.cos(wt + s.ph[k]));
  function fieldVec(s, wt) { const i = currents(s, wt); return [i.reduce((t, x, k) => t + x * Math.cos(AXES[k]), 0), i.reduce((t, x, k) => t + x * Math.sin(AXES[k]), 0)]; }
  // forward- and backward-rotating parts: B(t) = F e^{jωt} + B e^{−jωt}
  function sequences(s) {
    let F = [0, 0], Bk = [0, 0];
    s.A.forEach((a, k) => { F = C.add(F, C.scale(C.exp(s.ph[k] + AXES[k]), a / 2)); Bk = C.add(Bk, C.scale(C.exp(AXES[k] - s.ph[k]), a / 2)); });
    return { F: C.abs(F), B: C.abs(Bk), Fc: F, Bc: Bk };
  }
  // air-gap field around the bore at mechanical angle θ for p pole pairs
  const airgap = (s, wt, theta, p) => currents(s, wt).reduce((t, x, k) => t + x * Math.cos(p * theta - AXES[k]), 0);

  // 2. permanent-magnet DC motor: V = R i + L di/dt + k ω, J dω/dt = k i − T_load − T_f
  const DCM = { k: 0.02, L: 0.5e-3, J: 2e-5, Tf: 0.01 };
  function dcSteady(V, R, TL, m = DCM) {
    const I = (TL + m.Tf) / m.k, w = Math.max(0, (V - I * R) / m.k), Pout = TL * w, Pin = V * (w > 0 ? I : V / R);
    return { I: w > 0 ? I : V / R, w, Pout, Pin, eta: Pin > 0 ? Pout / Pin : 0, stall: (m.k * V) / R - m.Tf, w0: (V - (m.Tf / m.k) * R) / m.k };
  }
  const dcEtaMax = (V, R, m = DCM) => { const I0 = m.Tf / m.k, Is = V / R; return { eta: (1 - Math.sqrt(I0 / Is)) ** 2, I: Math.sqrt(I0 * Is), T: m.k * Math.sqrt(I0 * Is) - m.Tf }; };
  function dcSpinUp(V, R, TL, tEnd, n = 2000, m = DCM) {
    const f = (i, w) => { const di = (V - R * i - m.k * w) / m.L; let dw = (m.k * i - TL - m.Tf) / m.J; if (w <= 0 && dw < 0) dw = 0; return [di, dw]; };
    let i = 0, w = 0; const h = tEnd / n, out = [{ t: 0, i, w }];
    for (let s = 1; s <= n; s++) {
      // the electrical time constant is short, so sub-step
      for (let q = 0; q < 8; q++) { const hh = h / 8, a = f(i, w), b = f(i + hh / 2 * a[0], w + hh / 2 * a[1]), c = f(i + hh / 2 * b[0], w + hh / 2 * b[1]), d = f(i + hh * c[0], w + hh * c[1]); i += hh / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); w = Math.max(0, w + hh / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1])); }
      out.push({ t: s * h, i, w });
    }
    return out;
  }

  // 3. induction motor, per-phase equivalent circuit; star-connected, 400 V line, 50 Hz, 4 poles; V/f held constant
  const IM = { V: 400 / Math.sqrt(3), f: 50, p: 2, R1: 0.4, X1: 1.0, Xm: 30, R2: 0.35, X2: 1.0 };
  function imCircuit(s, f = 50, rr = 1, m = IM) {
    const k = f / m.f, V = m.V * k, ws = (TAU * f) / m.p, Z1 = [m.R1, m.X1 * k], Zm = [0, m.Xm * k];
    if (Math.abs(s) < 1e-12) { const I1 = C.div([V, 0], C.add(Z1, Zm)); return { T: 0, I1: C.abs(I1), I2: 0, Pag: 0, Pin: 3 * V * I1[0], pf: I1[0] / C.abs(I1), ws, V }; }
    const Z2 = [(m.R2 * rr) / s, m.X2 * k], Z = C.add(Z1, par(Zm, Z2)), I1 = C.div([V, 0], Z), I2 = C.mul(I1, C.div(Zm, C.add(Zm, Z2)));
    const Pag = (3 * C.abs(I2) ** 2 * m.R2 * rr) / s;
    return { T: Pag / ws, I1: C.abs(I1), I2: C.abs(I2), Pag, Pin: 3 * V * I1[0], pf: I1[0] / C.abs(I1), ws, V, Pmech: Pag * (1 - s) };
  }
  // Thevenin equivalent seen by the rotor; breakdown slip and torque
  function imBreakdown(f = 50, rr = 1, m = IM) {
    const k = f / m.f, V = m.V * k, ws = (TAU * f) / m.p, Zth = par([m.R1, m.X1 * k], [0, m.Xm * k]), Vth = C.abs(C.mul([V, 0], C.div([0, m.Xm * k], [m.R1, (m.X1 + m.Xm) * k]))), X = Zth[1] + m.X2 * k;
    const sm = (m.R2 * rr) / Math.hypot(Zth[0], X), Tm = (3 * Vth * Vth) / (2 * ws * (Zth[0] + Math.hypot(Zth[0], X)));
    return { sm, Tm, Vth, Rth: Zth[0], Xth: Zth[1] };
  }
  const T_RATED = imCircuit(0.03).T; // the torque this motor gives at 3% slip on 50 Hz, used as its rated torque
  // stable operating point against a load torque that depends on speed; null if the load exceeds the breakdown torque
  function imOperate(load, f = 50, rr = 1, m = IM) {
    const { sm } = imBreakdown(f, rr, m), ns = (60 * f) / m.p, g = (s) => imCircuit(s, f, rr, m).T - load(ns * (1 - s));
    if (g(Math.min(sm, 1)) < 0) return null;
    let lo = 1e-9, hi = Math.min(sm, 1); for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }

  (window.LabModels = window.LabModels || {})['electric-motors'] = { C, AXES, supply, currents, fieldVec, sequences, airgap, DCM, dcSteady, dcEtaMax, dcSpinUp, IM, imCircuit, imBreakdown, T_RATED, imOperate };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const put = (G, e) => (G.appendChild(e), e);
  const empty = (G) => { while (G.firstChild) G.removeChild(G.firstChild); };
  const PH = ['c1', 'c2', 'c3'];

  /* ---------- 1. the rotating magnetic field ---------- */
  const MODES = [['balanced three-phase', '平衡三相'], ['unbalanced', '不平衡'], ['phases b and c swapped', 'b 相と c 相を入れ替え'], ['single phase', '単相']];
  // machine geometry for the 3D view: axis along y, cross-section in the x–z plane, angle θ from x towards z
  const RS = 1.45, RB = 1.05, RR = 0.8, LH = 0.55, RC = 1.11;
  const PM = (r, th, y) => [r * Math.cos(th), y, r * Math.sin(th)];
  // where the rotor of a lightly loaded synchronous machine points (mechanical): it follows the stronger rotating part
  // of the field, lagging it by a constant load angle of 25 electrical degrees; a purely pulsating field leaves it at rest
  const LOAD_ANGLE = (25 * Math.PI) / 180;
  function rotorAngle(seq, wt, p) {
    const F = seq.F, B = seq.B;
    if (F > B + 1e-9) return (Math.atan2(seq.Fc[1], seq.Fc[0]) + wt - LOAD_ANGLE) / p;
    if (B > F + 1e-9) return (Math.atan2(seq.Bc[1], seq.Bc[0]) - wt + LOAD_ANGLE) / p;
    return (Math.atan2(seq.Fc[1], seq.Fc[0]) + Math.atan2(seq.Bc[1], seq.Bc[0])) / (2 * p);
  }
  // one full-pitch coil of phase k under pole pair m, as a closed loop (bars through the stack, end turns at both ends)
  function coilLoop(k, m, p) {
    const ax = (AXES[k] + TAU * m) / p, ta = ax + Math.PI / (2 * p), tb = ax - Math.PI / (2 * p);
    const ye = LH + 0.1 + 0.075 * k, re = 1.17 + 0.065 * k, pts = [];
    const seg = (a, b, nn) => { for (let i = 0; i < nn; i++) { const t = i / nn; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } };
    const arc = (t0, t1, y, nn) => { for (let i = 0; i < nn; i++) pts.push(PM(re, t0 + (t1 - t0) * i / nn, y)); };
    const na = Math.max(10, Math.round(40 / p));
    seg(PM(RC, ta, LH + 0.02), PM(RC, ta, -LH - 0.02), 14);
    seg(PM(RC, ta, -LH - 0.02), PM(re, ta, -ye), 4);
    arc(ta, tb, -ye, na);
    seg(PM(re, tb, -ye), PM(RC, tb, -LH - 0.02), 4);
    seg(PM(RC, tb, -LH - 0.02), PM(RC, tb, LH + 0.02), 14);
    seg(PM(RC, tb, LH + 0.02), PM(re, tb, ye), 4);
    arc(tb, ta, ye, na);
    seg(PM(re, ta, ye), PM(RC, ta, LH + 0.02), 4);
    return { pts, mid: PM(re + 0.08, ax, -ye - 0.02) };
  }
  // the previous 2D cross-section, kept as the fallback; returns draw(wt)
  function flatStator(host, s, p) {
    const f = L.fig(host, { x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, grid: false, maxH: 400 });
    const col = L.colours();
    f.circle(0, 0, 1.38, { c: 'muted', w: 1.2, fill: 'muted', fo: 0.12, layer: 'under' });
    f.circle(0, 0, 0.93, { c: 'muted', w: 1.2, fill: 'muted', fo: 0.08, layer: 'under' });
    for (let k = 0; k < 3; k++) for (let m = 0; m < p; m++) {
      const ax = (AXES[k] + TAU * m) / p;
      [ax + Math.PI / (2 * p), ax - Math.PI / (2 * p)].forEach((a, j) => { f.circle(1.25 * Math.cos(a), 1.25 * Math.sin(a), 0.055, { c: PH[k], w: 1.4, fill: PH[k], fo: j ? 0.15 : 0.75, layer: 'under' }); });
      if (m === 0) f.text(1.25 * Math.cos(ax + Math.PI / (2 * p)) * 1.12, 1.25 * Math.sin(ax + Math.PI / (2 * p)) * 1.12, 'abc'[k], { c: PH[k], math: true, small: true, layer: 'under' });
    }
    const rs = 0.42;
    f.line(L.sample(0, TAU, 160, (t) => fieldVec(s, t).map((x) => x * rs)), { c: 'hl', w: 1.4, dash: '4 4', op: 0.8, layer: 'under' });
    return (wt) => {
      f.clear('main'); f.clear('over');
      f.raster((x, y) => { const r = Math.hypot(x, y); if (r < 0.95 || r > 1.13) return col.plate; return L.cmaps.div(airgap(s, wt, Math.atan2(y, x), p) / 1.6); }, { res: f.small ? 2 : 2.5 });
      const i = currents(s, wt); let tip = [0, 0];
      i.forEach((x, k) => { if (s.A[k] === 0) return; const nxt = [tip[0] + x * rs * Math.cos(AXES[k]), tip[1] + x * rs * Math.sin(AXES[k])]; if (Math.abs(x) > 0.02) f.arrow(tip, nxt, { c: PH[k], w: 2.2 }); tip = nxt; });
      if (Math.hypot(...tip) > 0.01) f.arrow([0, 0], tip, { c: 'hl', w: 3.4, layer: 'over' });
      f.dot(0, 0, { c: 'ink', r: 2.5, layer: 'over' });
    };
  }
  D['rotating-field'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state, s = supply(v.mode, v.ub), p = v.pp, seq = sequences(s), ns = (60 * v.f) / p;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, '');
        st.v3 = L.h('div', '', st.c1);
        st.g2 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
      }
      st.cap1.textContent = T(`A stator with ${p} pole pair${p > 1 ? 's' : ''} and its three-phase winding, one coil per phase per pole pair, each glowing with the size of its current. The ring in the air gap and the permanent-magnet rotor are coloured by the radial field: warm where it points outward, cool where inward. The gold arrow${p > 1 ? 's point' : ' points'} along the field; the rotor, lightly loaded, follows ${p > 1 ? 'them' : 'it'} 25 electrical degrees behind. Drag to turn the view.`, `${p} 極対の固定子と三相巻線です。各相には極対ごとに一つのコイルがあり、電流の大きさに応じて光ります。エアギャップの輪と永久磁石の回転子は半径方向の磁界で色分けしています（暖色は外向き、寒色は内向き）。金色の矢印は磁界の向きで、軽い負荷のかかった回転子は電気角で 25° 遅れてそれに従います。ドラッグすると視点を回せます。`);
      // 2D column: the construction in electrical degrees, the currents, the size of the field
      st.g2.replaceChildren();
      L.h('p', 'lab-cap', st.g2, T('In electrical degrees: each phase’s contribution along its winding axis, added tip to tail, and the sum (gold). The dashed curve is the path of its tip over a cycle.', '電気角で見た作図です。各相の寄与を巻線の軸に沿った矢印として次々につなぎ、その和を金色で示します。破線は一周期での先端の軌跡です。'));
      const rs = 0.62, vf = L.fig(st.g2, { x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, grid: false, maxH: 190 });
      AXES.forEach((a, k) => { vf.seg([-1.15 * Math.cos(a), -1.15 * Math.sin(a)], [1.15 * Math.cos(a), 1.15 * Math.sin(a)], { c: PH[k], w: 1, dash: '2 4', op: 0.7, layer: 'under' }); vf.text(1.3 * Math.cos(a), 1.3 * Math.sin(a), 'abc'[k], { c: PH[k], math: true, small: true, dy: 4 }); });
      vf.line(L.sample(0, TAU, 160, (t) => fieldVec(s, t).map((x) => x * rs)), { c: 'hl', w: 1.4, dash: '4 4', op: 0.8, layer: 'under' });
      L.h('p', 'lab-cap', st.g2, T('Phase currents over two cycles, and the size of the field: constant when balanced, wobbling when unbalanced, collapsing twice a cycle for a single phase.', '二周期にわたる相電流と磁界の大きさです。平衡なら一定、不平衡ならゆらぎ、単相では一周期に二回 0 になります。'));
      const g = L.fig(st.g2, { x: [0, 720], y: [-1.6, 1.6], aspect: 0.5, maxH: 175, xlabel: T('electrical angle ωt (°)', '電気角 ωt（°）'), ylabel: T('current', '電流'), ticksX: [[0, '0'], [180, '180'], [360, '360'], [540, '540'], [720, '720']] });
      g.hline(0, { c: 'muted', w: 1, dash: false });
      for (let k = 0; k < 3; k++) if (s.A[k] > 0) g.line(L.sample(0, 720, 240, (x) => currents(s, (x * Math.PI) / 180)[k]), { c: PH[k], w: 2.2 });
      const hm = L.fig(st.g2, { x: [0, 720], y: [0, 2.2], aspect: 0.3, maxH: 120, xlabel: T('electrical angle ωt (°)', '電気角 ωt（°）'), ylabel: '|B|', ticksX: [[0, '0'], [360, '360'], [720, '720']], ticksY: [[0, '0'], [1.5, '1.5']] });
      hm.line(L.sample(0, 720, 240, (x) => Math.hypot(...fieldVec(s, (x * Math.PI) / 180))), { c: 'hl', w: 2.2 });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('phase a', 'a 相') }, { c: 'c2', label: T('phase b', 'b 相') }, { c: 'c3', label: T('phase c', 'c 相') }, { c: 'hl', label: T('resultant field', '合成磁界') }]);
      const dir = seq.F > seq.B + 1e-9 ? 1 : seq.B > seq.F + 1e-9 ? -1 : 0;
      ctx.readout([
        { k: T('supply', '電源'), v: T(...MODES[v.mode]), tone: 'key' },
        { k: T('synchronous speed 60f/p', '同期速度 60f/p'), v: `${fmt(ns, 0)} rpm` },
        { k: T('forward, backward field', '正転、逆転の磁界'), v: `${fmt(seq.F, 3)}, ${fmt(seq.B, 3)}` },
        { k: T('rotation', '回転'), v: dir > 0 ? T('anticlockwise', '反時計回り') : dir < 0 ? T('clockwise', '時計回り') : T('none, pulsating', 'なし、脈動のみ'), tone: dir ? 'good' : 'warn' },
      ], [
        T(`Three equal currents 120° apart in three windings 120° apart add up to a field of constant size, 3/2 of one phase’s peak, that turns smoothly at the supply frequency in electrical degrees, ${fmt(ns, 0)} rpm mechanically with ${p} pole pair${p > 1 ? 's' : ''}. Nothing moves, yet the field rotates, and a magnet rotor is dragged round with it: this is the trick behind every induction and synchronous motor.`, `120° ずつずれた三つの巻線に流れる、120° ずつずれた三つの等しい電流は、一相の最大値の 3/2 の一定の大きさの磁界になり、電気角で電源周波数でなめらかに回ります。${p} 極対では機械的には ${fmt(ns, 0)} rpm です。何も動かないのに磁界は回り、磁石の回転子はそれに引きずられて回ります。これがすべての誘導電動機と同期電動機の秘訣です。`),
        T(`With phase c at ${fmt(v.ub, 2)} of the others, the field is a forward part of size ${fmt(seq.F, 3)} plus a backward part of size ${fmt(seq.B, 3)} turning the other way, so its tip traces an ellipse and its size pulses at twice the supply frequency. The rotor turns steadily, so the field swings ahead of it and behind it: a torque ripple. The backward part also brakes and heats an induction rotor, which is why motors are derated on unbalanced supplies.`, `c 相が他の相の ${fmt(v.ub, 2)} 倍のとき、磁界は大きさ ${fmt(seq.F, 3)} の正転部分と、逆向きに回る大きさ ${fmt(seq.B, 3)} の逆転部分の和になるので、先端は楕円を描き、大きさは電源周波数の二倍で脈動します。回転子は一定の速さで回るので、磁界はその前後に揺れ、トルクが脈動します。逆転部分は誘導電動機の回転子にブレーキをかけて熱するので、不平衡な電源では電動機の定格を下げます。`),
        T('Swapping any two supply leads reverses the phase sequence, so the field and the rotor turn the other way at the same speed. This is how a three-phase motor is reversed: no change inside the motor at all.', '電源の任意の二本の線を入れ替えると相順が逆になり、磁界と回転子は同じ速さで逆向きに回ります。三相電動機はこうして逆転させます。電動機の中は何も変えません。'),
        T('One winding alone gives a field that only pulses back and forth along its axis, and the rotor stays put. That pulsating field is the sum of two equal fields turning in opposite directions, each half the size, so a single-phase motor has no starting torque and needs a second, phase-shifted winding (a capacitor or shaded pole) to choose a direction.', '巻線が一つだけだと、磁界はその軸に沿って行ったり来たりと脈動するだけで、回転子は動きません。その脈動する磁界は逆向きに回る二つの等しい磁界の和で、それぞれの大きさは半分です。そのため単相電動機には始動トルクがなく、向きを選ぶには位相をずらした二つ目の巻線（コンデンサやくま取りコイル）が必要です。'),
      ][v.mode]);

      const draw2d = (wt) => {
        vf.clear('main'); vf.clear('over'); g.clear('over'); hm.clear('over');
        const i = currents(s, wt); let tip = [0, 0];
        i.forEach((x, k) => { if (s.A[k] === 0) return; const nxt = [tip[0] + x * rs * Math.cos(AXES[k]), tip[1] + x * rs * Math.sin(AXES[k])]; if (Math.abs(x) > 0.02) vf.arrow(tip, nxt, { c: PH[k], w: 2.2 }); tip = nxt; });
        if (Math.hypot(...tip) > 0.01) vf.arrow([0, 0], tip, { c: 'hl', w: 3.2, layer: 'over' });
        vf.dot(0, 0, { c: 'ink', r: 2.5, layer: 'over' });
        const deg = ((((wt * 180) / Math.PI) % 720) + 720) % 720;
        g.vline(deg, { c: 'ink', w: 1.2, dash: '3 3', layer: 'over' }); i.forEach((x, k) => { if (s.A[k] > 0) g.dot(deg, x, { c: PH[k], r: 4.5, layer: 'over' }); });
        hm.vline(deg, { c: 'ink', w: 1.2, dash: '3 3', layer: 'over' }); hm.dot(deg, Math.hypot(...tip) / rs, { c: 'hl', r: 4.5, layer: 'over' });
        return deg;
      };
      st.drawAt = (wt) => { const deg = draw2d(wt); if (st.flat) st.flatDraw?.(wt); else st.draw3d?.(wt); return deg; };
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t, lb) => { const deg = st.drawAt(t * TAU * 0.25); lb.textContent = `ωt = ${fmt(Math.round(deg), 3)}°`; }, { autoplay: true, initialT: 0.35, playLabel: T('Play: run the supply', '再生：電源を流す') });

      L.view3d(ctx, v, {
        host: st.v3, aspect: 1, maxH: 560, camera: [2.5, -5.9, 2.7], target: [0, 0.05, 0], fov: 34,
        init(S) {
          st.flat = false; st.coilP = null;
          const iron = { c: 'muted', metal: 0.55, rough: 0.38, coat: 0.3 };
          S.surface((u, w) => PM(RS, w, u), { u: [-LH, LH], v: [0, TAU], nu: 2, nv: 120, ...iron });
          S.surface((u, w) => PM(u, w, -LH), { u: [RB, RS], v: [0, TAU], nu: 2, nv: 120, ...iron });
          S.surface((u, w) => PM(u, w, LH), { u: [RB, RS], v: [0, TAU], nu: 2, nv: 120, ...iron });
          // laminations
          const lam = []; for (let j = 1; j < 14; j++) { const y = -LH + (2 * LH * j) / 14; for (let i = 0; i < 96; i++) lam.push([PM(RS + 0.002, (TAU * i) / 96, y), PM(RS + 0.002, (TAU * (i + 1)) / 96, y)]); }
          S.lines(lam, { c: 'ink', opacity: S.dark ? 0.25 : 0.18 });
          // the air gap: the stator bore and a ring at the front, both coloured by the radial field
          st.bore = S.surface((u, w) => PM(RB, w, u), { u: [-LH, LH], v: [0, TAU], nu: 2, nv: 180, colour: () => S.cmap.div(0), rough: 0.5, coat: 0.1 });
          st.ring = S.surface((u, w) => PM(u, w, -LH - 0.046), { u: [RR + 0.012, RB], v: [0, TAU], nu: 1, nv: 180, colour: () => S.cmap.div(0), rough: 0.6, coat: 0.05 });
          // rotor: a permanent magnet with p pole pairs, coloured by its own radial magnetisation
          st.rotor = new S.THREE.Group();
          const mag = (w) => S.cmap.div(0.7 * Math.tanh(4 * Math.cos(st.rp * w)));
          st.rp = p;
          st.rotorSkin = [
            S.surface((u, w) => PM(RR, w, u), { u: [-LH - 0.04, LH + 0.04], v: [0, TAU], nu: 2, nv: 160, colour: (u, w) => mag(w), add: false, rough: 0.55, coat: 0.15 }),
            S.surface((u, w) => PM(u, w, -LH - 0.04), { u: [0.12, RR], v: [0, TAU], nu: 2, nv: 160, colour: (u, w) => mag(w), add: false, rough: 0.55, coat: 0.15 }),
            S.surface((u, w) => PM(u, w, LH + 0.04), { u: [0.12, RR], v: [0, TAU], nu: 2, nv: 160, colour: (u, w) => mag(w), add: false, rough: 0.55, coat: 0.15 }),
          ];
          st.rotorMag = mag;
          st.rotor.add(...st.rotorSkin);
          S.add(st.rotor);
          S.tube([[0, -LH - 0.75, 0], [0, LH + 0.5, 0]], { c: 'ink', r: 0.11, metal: 0.85, rough: 0.25 });
          st.arrows = [0, 1, 2, 3].map(() => S.arrow([0, -LH - 0.06, 0], [0.5, 0, 0], { c: 'hl', r: 0.03, glow: 0.35 }));
          st.coilG = new S.THREE.Group(); S.add(st.coilG);
          st.lab = [0, 1, 2].map((k) => S.label('abc'[k], [0, 0, 0], { math: true, c: PH[k] }));
          st.bLab = S.label('B', [0, 0, 0], { math: true, c: 'hl' });
          st.S3 = S;
        },
        update(S) {
          if (st.coilP !== p) {
            st.coilP = p;
            for (const c of [...st.coilG.children]) { st.coilG.remove(c); c.geometry?.dispose(); c.material?.dispose(); }
            st.coilMats = [[], [], []];
            for (let k = 0; k < 3; k++) for (let m = 0; m < p; m++) {
              const lp = coilLoop(k, m, p), tube = S.tube(lp.pts, { c: PH[k], r: 0.034, closed: true, add: false, glow: 0.3, metal: 0.35, rough: 0.3 });
              st.coilG.add(tube); st.coilMats[k].push(tube.material);
              if (m === 0) st.lab[k].set(lp.mid);
            }
            st.rp = p; st.rotorSkin.forEach((m) => m.update(undefined, (u, w) => st.rotorMag(w)));
          }
          st.draw3d = (wt) => {
            const i = currents(s, wt), B = fieldVec(s, wt), mB = Math.hypot(...B), aB = Math.atan2(B[1], B[0]);
            const ag = (w) => { const b = airgap(s, wt, w, p) / 1.5; return S.cmap.div(Math.sign(b) * Math.abs(b) ** 0.75); };
            st.bore.update(undefined, (u, w) => ag(w)); st.ring.update(undefined, (u, w) => ag(w));
            st.rotor.rotation.y = -rotorAngle(seq, wt, p);
            st.coilMats.forEach((ms, k) => ms.forEach((mt) => { mt.emissiveIntensity = s.A[k] === 0 ? 0 : 0.06 + 0.7 * Math.abs(i[k]); mt.opacity = 1; }));
            const len = (0.62 * mB) / 1.5;
            st.arrows.forEach((a, m) => { if (m >= p || mB < 0.02) { a.set([0, -LH - 0.06, 0], [0, 0, 0]); return; } const ph = (aB + TAU * m) / p; a.set([0, -LH - 0.06, 0], [len * Math.cos(ph), 0, len * Math.sin(ph)]); });
            const ph0 = aB / p; st.bLab.set([(len + 0.08) * Math.cos(ph0), -LH - 0.06, (len + 0.08) * Math.sin(ph0)]); st.bLab.show(mB > 0.05);
            S.invalidate();
          };
          st.anim?.redraw();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          st.cap1.textContent = T(`A stator with ${p} pole pair${p > 1 ? 's' : ''}, cut across. The ring is the air gap, coloured by the radial field (warm: outward, cool: inward). Dots are the conductors of phases a, b and c. In the middle, each phase’s contribution along its winding axis and their sum (gold), in electrical degrees.`, `${p} 極対の固定子の断面です。輪がエアギャップで、半径方向の磁界で色分けしています（暖色が外向き、寒色が内向き）。点は a、b、c 相の導体です。中央には各相の寄与を巻線の軸に沿った矢印で、その和を金色で示しています（電気角）。`);
          st.flatDraw = flatStator(st.v3, s, p);
          st.anim?.redraw();
        },
      });
      st.anim?.redraw();
    },
  };

  /* ---------- 2. the DC motor ---------- */
  D['dc-motor'] = {
    render(ctx, v) {
      const V = v.V, R = v.R, m = DCM, stall = (m.k * V) / R - m.Tf, Tmax = Math.max(0.05, stall * 1.08), TL = clamp(v.TL, 0, Math.max(0, stall));
      const op = dcSteady(V, R, TL), em = dcEtaMax(V, R), rpm = (w) => (w * 60) / TAU, w0 = op.w0, Pmax = stall > 0 ? (stall * w0) / 4 : 0;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Speed against load torque: a straight line from the no-load speed to the stall torque. Drag the gold point to change the load.', '負荷トルクに対する回転速度です。無負荷速度から拘束トルクまでの直線です。金色の点をドラッグして負荷を変えてください。'));
      const f = L.fig(c1, { x: [0, Tmax], y: [0, rpm(24 / m.k) * 1.05], aspect: 0.7, maxH: 300, xlabel: T('load torque (N·m)', '負荷トルク（N·m）'), ylabel: 'rpm' });
      [6, 12, 18, 24].forEach((vv) => { if (Math.abs(vv - V) > 0.5) f.line([[0, rpm(dcSteady(vv, R, 0).w0)], [Math.max(0, (m.k * vv) / R - m.Tf), 0]], { c: 'muted', w: 1, dash: '3 4' }); });
      if (stall > 0) f.line([[0, rpm(w0)], [stall, 0]], { c: 'c1', w: 2.8 });
      f.text(Math.max(0, stall), 0, T(`stall ${fmt(Math.max(0, stall), 2)} N·m`, `拘束 ${fmt(Math.max(0, stall), 2)} N·m`), { small: true, c: 'c1', anchor: stall > Tmax * 0.7 ? 'end' : 'start', dx: 4, dy: -8 });
      f.handle(TL, rpm(op.w), { c: 'hl', r: 7, axis: 'x', snap: 0.001, bounds: [0, Math.max(0, stall), 0, 1e9], label: T('Load torque', '負荷トルク'), onDrag: (x) => ctx.set('TL', Math.round(x * 1000) / 1000) });
      L.h('p', 'lab-cap', c1, T(`Output power (orange, as % of its maximum ${fmt(Pmax, 1)} W) and efficiency (teal), both against load torque.`, `出力（オレンジ、最大値 ${fmt(Pmax, 1)} W に対する %）と効率（青緑）を、どちらも負荷トルクに対して示します。`));
      const h2 = L.fig(c1, { x: [0, Tmax], y: [0, 100], aspect: 0.45, maxH: 200, xlabel: T('load torque (N·m)', '負荷トルク（N·m）'), ylabel: '%' });
      if (stall > 0) {
        h2.line(L.sample(0, stall, 200, (t) => (100 * dcSteady(V, R, t).Pout) / Pmax), { c: 'c2', w: 2.4 });
        h2.line(L.sample(0, stall, 200, (t) => 100 * dcSteady(V, R, t).eta), { c: 'c3', w: 2.4 });
        h2.vline(TL, { c: 'hl', w: 1.2, dash: '3 3' }); h2.dot(em.T, 100 * em.eta, { c: 'c3', r: 4.5 }); h2.text(em.T, 100 * em.eta, `η_max ${fmt(100 * em.eta, 0)}%`, { small: true, c: 'c3', anchor: 'start', dx: 6, dy: -6 });
      }
      // switch-on transient
      const tm = (m.J * R) / m.k ** 2, tEnd = Math.max(0.02, 5 * tm), tr = dcSpinUp(V, R, TL, tEnd, 500), wTop = Math.max(rpm(Math.max(w0, 0)) * 1.12, 100);
      L.h('p', 'lab-cap', c2, T(`Switching on at ${fmt(V, 0)} V with this load: speed (blue) and current (orange). The mechanical time constant J R/k² is ${fmt(tm * 1e3, 1)} ms; the current spikes to almost V/R before the back EMF builds up.`, `この負荷で ${fmt(V, 0)} V を入れたときの回転速度（青）と電流（オレンジ）です。機械的な時定数 J R/k² は ${fmt(tm * 1e3, 1)} ms で、逆起電力が立ち上がるまで電流はほぼ V/R まで跳ね上がります。`));
      const sp = L.fig(c2, { x: [0, tEnd * 1e3], y: [0, wTop], aspect: 0.5, maxH: 220, xlabel: 'ms', ylabel: 'rpm' });
      sp.hline(rpm(op.w), { c: 'c1', w: 1, dash: '4 4' }); sp.line(tr.map((o) => [o.t * 1e3, rpm(o.w)]), { c: 'c1', w: 2.6 });
      sp.vline(tm * 1e3, { c: 'muted', w: 1, dash: '2 4' }); sp.text(tm * 1e3, wTop * 0.94, 'τ', { small: true, c: 'muted', math: true, dx: 6, anchor: 'start' });
      const imax = Math.max(...tr.map((o) => o.i), V / R, 0.1);
      const ci = L.fig(c2, { x: [0, tEnd * 1e3], y: [0, imax * 1.1], aspect: 0.4, maxH: 190, xlabel: 'ms', ylabel: 'A' });
      ci.hline(op.I, { c: 'c2', w: 1, dash: '4 4' }); ci.line(tr.map((o) => [o.t * 1e3, o.i]), { c: 'c2', w: 2.4 });
      L.legend(ctx.host, [{ c: 'c1', label: T('speed', '回転速度') }, { c: 'muted', dash: true, label: T('other voltages (6, 12, 18, 24 V)', '他の電圧（6、12、18、24 V）') }, { c: 'c2', label: T('output power; current', '出力、電流') }, { c: 'c3', label: T('efficiency', '効率') }]);
      ctx.readout([
        { k: T('speed', '回転速度'), v: `${fmt(rpm(op.w), 0)} rpm`, tone: 'key' },
        { k: T('current', '電流'), v: `${fmt(op.I, 2)} A` },
        { k: T('output power', '出力'), v: `${fmt(op.Pout, 1)} W` },
        { k: T('efficiency', '効率'), v: `${fmt(100 * op.eta, 1)}%`, tone: op.eta > 0.75 ? 'good' : undefined },
        ...(stall > 0 ? [{ k: T('best efficiency, at', '最高効率とそのトルク'), v: `${fmt(100 * em.eta, 1)}%, ${fmt(em.T, 3)} N·m` }, { k: T('maximum power, at', '最大出力とそのトルク'), v: `${fmt(Pmax, 1)} W, ${fmt(stall / 2, 3)} N·m` }] : []),
      ], stall <= 0
        ? T('At this voltage the motor cannot overcome its own friction.', 'この電圧では電動機は自分の摩擦に打ち勝てません。')
        : T(`Torque is proportional to current (T = k i) and the back EMF is proportional to speed (e = k ω), so loading the motor slows it, lowers the back EMF and lets more current in: speed falls in a straight line. Output power peaks at half the stall torque, where efficiency is under 50%, but the best efficiency, ${fmt(100 * em.eta, 0)}%, comes at light load, where the current is the geometric mean of the no-load and stall currents. Motors are therefore chosen so that they normally run well below their maximum power.`, `トルクは電流に比例し（T = k i）、逆起電力は回転速度に比例する（e = k ω）ので、負荷をかけると電動機は遅くなり、逆起電力が下がってより多くの電流が流れます。回転速度は直線的に下がります。出力は拘束トルクの半分で最大になりますが、そこでの効率は 50% 未満です。最高効率 ${fmt(100 * em.eta, 0)}% は軽い負荷で得られ、そこでの電流は無負荷電流と拘束電流の幾何平均です。だから電動機は、ふだんは最大出力よりずっと下で回るように選ばれます。`));
    },
  };

  /* ---------- 3. the induction motor ---------- */
  D['induction-torque'] = {
    render(ctx, v) {
      const fq = v.f, rr = v.rr, ns = (60 * fq) / IM.p, ns50 = 1500, Tr = T_RATED, fan = v.load === 1;
      const load = (n) => (fan ? v.TL * Tr * (n / ns50) ** 2 * Math.sign(n) : v.TL * Tr);
      const bd = imBreakdown(fq, rr), bd50 = imBreakdown(50, 1), sOp = imOperate(load, fq, rr);
      const nOf = (s) => ns * (1 - s), sOf = (n) => 1 - n / ns;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Torque against shaft speed for an 11 kW-class four-pole motor (blue), with the load (orange). Below zero speed the motor brakes, above synchronous speed it generates. The dashed curve is the motor at 50 Hz with its normal rotor. Drag the gold point to change the load.', '11 kW 級の四極電動機の、軸の回転速度に対するトルク（青）と負荷（オレンジ）です。速度が負の領域では制動し、同期速度を超えると発電します。破線は 50 Hz、通常の回転子での電動機です。金色の点をドラッグして負荷を変えてください。'));
      const nmin = -400, nmax = 1900, ymax = bd50.Tm * 1.35, ymin = -bd50.Tm * 1.15;
      const f = L.fig(c1, { x: [nmin, nmax], y: [ymin, ymax], aspect: 0.72, maxH: 380, xlabel: T('shaft speed (rpm)', '軸の回転速度（rpm）'), ylabel: 'N·m' });
      f.rect(nmin, ymin, -nmin, ymax - ymin, { c: 'c4', fill: 'c4', fo: 0.06, nostroke: true, layer: 'under' });
      f.rect(ns, ymin, nmax - ns, ymax - ymin, { c: 'c3', fill: 'c3', fo: 0.07, nostroke: true, layer: 'under' });
      f.text(nmin / 2, ymax * 0.74, T('braking', '制動'), { small: true, c: 'c4' }); f.text((ns + nmax) / 2, ymax * 0.9, T('generating', '発電'), { small: true, c: 'c3' }); f.text(ns * 0.45, ymax * 0.9, T('motoring', '電動'), { small: true, c: 'muted' });
      f.hline(0, { c: 'muted', w: 1, dash: false }); f.vline(ns, { c: 'muted', w: 1 }); f.text(ns, ymin, `n_s = ${fmt(ns, 0)}`, { small: true, c: 'muted', dy: -6, dx: 4, anchor: 'start' });
      const curve = (fr, r) => { const n_s = (60 * fr) / IM.p; return L.sample(nmin, nmax, 500, (n) => { const s = 1 - n / n_s; return [n, imCircuit(Math.abs(s) < 1e-9 ? 1e-9 : s, fr, r).T]; }); };
      if (Math.abs(fq - 50) > 0.5 || Math.abs(rr - 1) > 0.01) f.line(curve(50, 1), { c: 'muted', w: 1.4, dash: '5 4' });
      f.line(curve(fq, rr), { c: 'c1', w: 2.8 });
      f.line(L.sample(nmin, nmax, 200, load), { c: 'c2', w: 2.2 });
      const nb = nOf(bd.sm); f.dot(nb, bd.Tm, { c: 'c1', r: 4.5 }); f.text(nb, bd.Tm, T('breakdown', '停動'), { small: true, c: 'c1', dy: -10 });
      const st = imCircuit(1, fq, rr); f.dot(0, st.T, { c: 'c1', r: 4.5 }); f.text(0, st.T, T('start', '始動'), { small: true, c: 'c1', anchor: 'start', dx: 8, dy: 4 });
      const nop = sOp === null ? 0 : nOf(sOp), Top = sOp === null ? load(0) : imCircuit(sOp, fq, rr).T;
      f.handle(nop, Top, { c: 'hl', r: 7, axis: 'y', bounds: [nmin, nmax, 0, ymax], label: T('Load torque', '負荷トルク'), onDrag: (x, y) => { const base = fan ? Tr * Math.max(0.05, (nop / ns50) ** 2) : Tr; ctx.set('TL', clamp(Math.round((y / base) * 100) / 100, 0, 1.6)); } });
      // stator current
      L.h('p', 'lab-cap', c2, T('Stator current per phase against speed. Starting straight across the line draws several times the running current, which is why large motors use soft starters or drives.', '回転速度に対する相ごとの固定子電流です。電源に直接つないで始動すると運転電流の何倍もの電流が流れます。だから大きな電動機はソフトスタータやインバータを使います。'));
      const Ist = imCircuit(1, 50, 1).I1;
      const g = L.fig(c2, { x: [0, nmax], y: [0, Ist * 1.15], aspect: 0.7, maxH: 300, xlabel: T('shaft speed (rpm)', '軸の回転速度（rpm）'), ylabel: 'A' });
      g.line(L.sample(0, nmax, 400, (n) => { const s = sOf(n); return imCircuit(Math.abs(s) < 1e-9 ? 1e-9 : s, fq, rr).I1; }), { c: 'c4', w: 2.6 });
      if (sOp !== null) g.dot(nop, imCircuit(sOp, fq, rr).I1, { c: 'hl', r: 5.5 });
      L.legend(ctx.host, [{ c: 'c1', label: T('motor torque', '電動機のトルク') }, { c: 'muted', dash: true, label: T('50 Hz, normal rotor', '50 Hz、通常の回転子') }, { c: 'c2', label: fan ? T('fan load ∝ n²', 'ファン負荷 ∝ n²') : T('constant-torque load', '定トルク負荷') }, { c: 'c4', label: T('stator current', '固定子電流') }]);
      const o = sOp === null ? null : imCircuit(sOp, fq, rr);
      ctx.readout([
        { k: T('synchronous speed', '同期速度'), v: `${fmt(ns, 0)} rpm`, tone: 'key' },
        ...(o ? [
          { k: T('running speed, slip', '運転速度、すべり'), v: `${fmt(nop, 0)} rpm, ${sOp < 1e-4 ? '0' : fmt(100 * sOp, 2)}%` },
          { k: T('torque, power', 'トルク、出力'), v: `${fmt(o.T < 0.05 ? 0 : o.T, 1)} N·m, ${fmt(o.Pmech < 5 ? 0 : o.Pmech / 1e3, 2)} kW` },
          { k: T('efficiency, power factor', '効率、力率'), v: `${o.Pmech < 5 ? '0' : fmt((100 * o.Pmech) / o.Pin, 1)}%, ${fmt(o.pf, 2)}` },
        ] : [{ k: T('operating point', '運転点'), v: T('stalled', '停動'), tone: 'warn' }]),
        { k: T('breakdown torque, slip', '停動トルク、すべり'), v: `${fmt(bd.Tm, 0)} N·m, ${fmt(100 * bd.sm, 1)}%` },
        { k: T('starting torque, current', '始動トルク、電流'), v: `${fmt(st.T, 0)} N·m, ${fmt(st.I1, 0)} A` },
      ], !o
        ? T('The load torque is larger than the breakdown torque, so there is no stable operating point: the motor slows down, the torque falls further, and it stalls, drawing its full starting current until a protection trips.', '負荷トルクが停動トルクより大きいので、安定な運転点がありません。電動機は減速し、トルクはさらに下がり、停止して、保護装置が働くまで始動電流を流し続けます。')
        : T(`The rotor turns ${fmt(100 * sOp, 2)}% slower than the field, and that slip is what induces its currents: no slip, no torque. Near synchronous speed the curve is almost a straight line, so speed barely changes with load. Raising the rotor resistance moves the breakdown point to higher slip without changing its height (${fmt(bd.Tm, 0)} N·m), trading efficiency for starting torque; lowering the frequency with V/f fixed shifts the whole curve sideways, which is how a variable-frequency drive sets the speed. At low frequency the stator resistance takes a larger share of the voltage and the peak torque falls.`, `回転子は磁界より ${fmt(100 * sOp, 2)}% 遅く回り、そのすべりが電流を誘導します。すべりがなければトルクもありません。同期速度の近くで曲線はほぼ直線なので、速度は負荷でほとんど変わりません。回転子の抵抗を大きくすると、停動点はその高さ（${fmt(bd.Tm, 0)} N·m）を変えずに大きなすべりへ移り、効率と引き換えに始動トルクが得られます。V/f を一定にして周波数を下げると曲線全体が横にずれ、可変周波数インバータはこうして速度を決めます。低い周波数では固定子抵抗が電圧のより大きな割合を取り、最大トルクは下がります。`));
    },
  };
})();
