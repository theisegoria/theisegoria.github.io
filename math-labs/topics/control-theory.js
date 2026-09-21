'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  // unit-gain second-order step response with poles sigma +/- i omega
  function step2(sig, om, t) {
    if (sig * sig + om * om < 1e-12) return 0;
    if (om < 1e-9) return 1 - Math.exp(sig * t) * (1 - sig * t);
    return 1 - Math.exp(sig * t) * (Math.cos(om * t) - (sig / om) * Math.sin(om * t));
  }
  // roots of a monic polynomial (coefficients highest first, leading 1) by Durand-Kerner
  function roots(c) {
    const n = c.length - 1; let z = Array.from({ length: n }, (_, k) => { const r = 0.9 + 0.4 * k / n, a = 2 * PI * k / n + 0.4; return [r * Math.cos(a), r * Math.sin(a)]; });
    const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1] || 1e-300; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
    const ev = (x) => c.reduce((acc, ck) => { const m = mul(acc, x); return [m[0] + ck, m[1]]; }, [0, 0]);
    for (let it = 0; it < 500; it++) {
      let moved = 0;
      z = z.map((zi, i) => { let den = [1, 0]; z.forEach((zj, j) => { if (i !== j) den = mul(den, [zi[0] - zj[0], zi[1] - zj[1]]); }); const d = div(ev(zi), den); moved = Math.max(moved, Math.hypot(d[0], d[1])); return [zi[0] - d[0], zi[1] - d[1]]; });
      if (moved < 1e-13) break;
    }
    return z;
  }
  // PID on G = 1/(s+1)^3, derivative on measurement, load disturbance d at plant input from tDist
  function simulatePID(kp, ki, kd, { tMax = 40, h = 0.01, dist = -0.5, tDist = 15 } = {}) {
    let x = [0, 0, 0], z = 0; const out = [];
    const f = (t, x, z) => {
      const y = x[2], yd = -x[2] + x[1], r = 1, u = kp * (r - y) + ki * z - kd * yd, d = t >= tDist ? dist : 0;
      return { dx: [-x[0] + u + d, -x[1] + x[0], -x[2] + x[1]], dz: r - y, u };
    };
    const N = Math.round(tMax / h);
    for (let i = 0; i <= N; i++) {
      const t = i * h, k1 = f(t, x, z);
      if (i % 4 === 0) out.push([t, x[2], k1.u]);
      const add = (x, dx, s) => x.map((v, j) => v + s * dx[j]);
      const k2 = f(t + h / 2, add(x, k1.dx, h / 2), z + h / 2 * k1.dz), k3 = f(t + h / 2, add(x, k2.dx, h / 2), z + h / 2 * k2.dz), k4 = f(t + h, add(x, k3.dx, h), z + h * k3.dz);
      x = x.map((v, j) => v + h / 6 * (k1.dx[j] + 2 * k2.dx[j] + 2 * k3.dx[j] + k4.dx[j])); z += h / 6 * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz);
      if (!x.every((v) => Math.abs(v) < 1e6)) break;
    }
    return out;
  }
  const pidPoles = (kp, ki, kd) => roots([1, 3, 3 + kd, 1 + kp, ki]);
  // loop L(i w) = K e^{-i w tau} / (1 + i w)^3
  const loopAt = (K, tau, w) => { const mag = K / Math.pow(1 + w * w, 1.5), ph = -3 * Math.atan(w) - w * tau; return [mag * Math.cos(ph), mag * Math.sin(ph), mag, ph]; };
  function margins(K, tau) {
    const wc = K > 1 ? Math.sqrt(Math.pow(K, 2 / 3) - 1) : null;
    const pm = wc === null ? Infinity : 180 + (-3 * Math.atan(wc) - wc * tau) * 180 / PI;
    let lo = 0, hi = 1e3; const g = (w) => 3 * Math.atan(w) + w * tau - PI;
    let w180 = null; if (g(hi) > 0) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (g(m) > 0) hi = m; else lo = m; } w180 = (lo + hi) / 2; }
    const gm = w180 === null ? Infinity : Math.pow(1 + w180 * w180, 1.5) / K;
    return { wc, pm, w180, gm };
  }
  function encirclements(K, tau) {
    let prev = null, total = 0;
    for (let i = 0; i <= 40000; i++) { const w = Math.pow(10, -4 + 8 * i / 40000), [x, y] = loopAt(K, tau, w); const a = Math.atan2(y, x + 1); if (prev !== null) { let d = a - prev; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; total += d; } prev = a; }
    return Math.round(-total / PI); // clockwise encirclements over the full contour, counting both halves
  }
  (window.LabModels = window.LabModels || {})['control-theory'] = { step2, roots, simulatePID, pidPoles, loopAt, margins, encirclements };

  // a pole marker: an x drawn in figure pixels so it stays square
  function cross(f, x, y, c) { const px = f.X(x), py = f.Y(y), r = 6; [[-r, -r, r, r], [-r, r, r, -r]].forEach(([a, b, cc, d]) => f.line([[f.IX(px + a), f.IY(py + b)], [f.IX(px + cc), f.IY(py + d)]], { c, w: 3, layer: 'over' })); }

  /* ---------- 1. poles ---------- */
  D.poles = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const sig = v.sigma, om = v.omega;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The s-plane: drag the upper pole', 's 平面：上の極をドラッグしてください'));
      const f = L.fig(c1, { x: [-3.5, 1.5], y: [-6.5, 6.5], aspect: 1.1, maxH: 400, xlabel: 'Re s', ylabel: 'Im s' });
      f.rect(-3.5, -6.5, 3.5, 13, { c: 'c3', fo: 0.07, nostroke: true, layer: 'under' });
      f.rect(0, -6.5, 1.5, 13, { c: 'c2', fo: 0.1, nostroke: true, layer: 'under' });
      f.text(-3.35, -6.0, T('stable', '安定'), { anchor: 'start', small: true, c: 'c3' });
      f.text(1.35, -6.0, T('unstable', '不安定'), { anchor: 'end', small: true, c: 'c2' });
      const wn = Math.hypot(sig, om);
      if (wn > 0.05) {
        f.line(L.seq(121, (i) => { const a = PI / 2 + PI * i / 120; return [wn * Math.cos(a), wn * Math.sin(a)]; }), { c: 'muted', w: 1, dash: '3 4' });
        if (sig < 0) f.seg([0, 0], [sig * 20 / wn, om * 20 / wn], { c: 'c4', w: 1.2, dash: '5 4' });
      }
      cross(f, sig, -om, 'c1');
      f.handle(sig, om, { c: 'c1', r: 9, label: T('Pole', '極'), bounds: [-3, 1, 0, 6], onDrag: (x, y) => { ctx.set('sigma', x, true); ctx.set('omega', y, true); ctx.redraw(); } });
      L.h('p', 'lab-cap', c2, T('Step response y(t)', 'ステップ応答 y(t)'));
      const tMax = 10;
      const ys = L.sample(0, tMax, 600, (t) => step2(sig, om, t));
      const ymax = L.clamp(Math.max(1.3, ...ys.map((p) => p[1]).filter(Number.isFinite)) + 0.1, 1.3, 2.4);
      const g = L.fig(c2, { x: [0, tMax], y: [-0.6, ymax], aspect: 0.8, maxH: 400, xlabel: 't', ylabel: 'y' });
      g.hline(1, { c: 'ink', dash: '4 4' });
      if (sig < 0 && om > 1e-6) { const A = Math.hypot(1, sig / om); for (const s of [1, -1]) g.line(L.sample(0, tMax, 200, (t) => 1 + s * A * Math.exp(sig * t)), { c: 'c4', w: 1.2, dash: '3 3' }); }
      const os = sig < 0 && om > 1e-6 ? Math.exp(PI * sig / om) : null, ts = sig < 0 ? 4 / -sig : null;
      if (os !== null && PI / om < tMax) { g.dot(PI / om, 1 + os, { c: 'c2', r: 5 }); g.text(PI / om, 1 + os, T(`overshoot ${fmt(os * 100, 1)}%`, `オーバーシュート ${fmt(os * 100, 1)}%`), { small: true, c: 'c2', dy: -10, anchor: 'start', dx: 6 }); }
      if (ts !== null && ts < tMax) { g.vline(ts, { c: 'c3', dash: '2 3' }); g.text(ts, -0.45, T('settling ≈ 4/|σ|', '整定 ≈ 4/|σ|'), { small: true, c: 'c3', dx: 4, anchor: 'start' }); }
      g.line(ys, { c: 'c1', w: 2.6 });
      ctx.state.anim = L.animator(ctx.host, (dt, t) => { g.clear('over'); const tt = Math.min(tMax, t * 2.5); const y = step2(sig, om, tt); if (Number.isFinite(y) && y > -0.6 && y < ymax) g.dot(tt, y, { c: 'hl', r: 6.5 }); if (tt >= tMax) return false; }, { autoplay: false, once: true, initialT: 0, playLabel: T('Trace the response', '応答をたどる') });
      L.legend(ctx.host, [{ c: 'c1', label: T('poles σ ± iω and the response', '極 σ ± iω と応答') }, { c: 'c4', dash: true, label: T('envelope e^(σt), and the constant-overshoot ray', '包絡線 e^(σt) と、オーバーシュート一定の半直線') }, { c: 'muted', dash: true, label: T('natural frequency |s|', '固有振動数 |s|') }]);
      const zeta = wn > 0 ? -sig / wn : 0;
      ctx.readout([{ k: T('poles', '極'), v: `${fmt(sig, 2)} ± ${fmt(om, 2)}i`, tone: 'key' }, { k: T('damping ratio ζ', '減衰比 ζ'), v: fmt(zeta, 3) }, { k: T('overshoot', 'オーバーシュート'), v: os === null ? (sig < 0 ? '0%' : '∞') : `${fmt(os * 100, 1)}%` }, { k: T('settling time', '整定時間'), v: ts === null ? '∞' : fmt(ts, 2), tone: sig >= 0 ? 'warn' : undefined }],
        sig > 0 ? T('A pole in the right half-plane: every disturbance grows like e^(σt).', '右半平面の極：あらゆる乱れが e^(σt) のように増大します。') : Math.abs(sig) < 1e-9 ? T('On the imaginary axis the response oscillates forever without decaying.', '虚軸上では、応答は減衰せずに永遠に振動します。') : om < 1e-9 ? T('Real poles: no oscillation, no overshoot.', '実数の極：振動もオーバーシュートもありません。') : T('Drag along the dashed ray and the overshoot stays fixed while the speed changes.', '点線の半直線に沿ってドラッグすると、速さは変わりますがオーバーシュートは一定です。'));
    },
  };

  /* ---------- 2. PID ---------- */
  D.pid = {
    render(ctx, v) {
      const run = simulatePID(v.kp, v.ki, v.kd), P = pidPoles(v.kp, v.ki, v.kd);
      const maxRe = Math.max(...P.map((z) => z[0])), stable = maxRe < -1e-6, marginal = !stable && maxRe < 1e-6;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      c1.style.gridColumn = 'span 2';
      L.h('p', 'lab-cap', c1, T('Output y and set-point r; a load disturbance arrives at t = 15', '出力 y と目標値 r。t = 15 で負荷外乱が加わります'));
      const f = L.fig(c1, { x: [0, 40], y: [-0.4, 2], aspect: 0.4, maxH: 300, ylabel: 'y' });
      f.rect(15, -0.4, 25, 2.4, { c: 'c2', fo: 0.05, nostroke: true, layer: 'under' });
      f.vline(15, { c: 'c2', dash: '3 3' }); f.text(15.3, 1.85, T('disturbance', '外乱'), { anchor: 'start', small: true, c: 'c2' });
      f.line([[0, 1], [40, 1]], { c: 'ink', w: 1.4, dash: '5 4' });
      f.line(run.map((p) => [p[0], p[1]]), { c: 'c1', w: 2.6 });
      const g = L.fig(c1, { x: [0, 40], y: [-2, 4], aspect: 0.18, minH: 120, maxH: 150, xlabel: 't', ylabel: 'u', ticksY: [[-2, '−2'], [0, '0'], [2, '2'], [4, '4']] });
      g.line(run.map((p) => [p[0], p[2]]), { c: 'c2', w: 1.8 });
      L.h('p', 'lab-cap', c2, T('Closed-loop poles', '閉ループの極'));
      const hq = L.fig(c2, { x: [-3.5, 1], y: [-2.6, 2.6], aspect: 1.05, maxH: 440, xlabel: 'Re s', ylabel: 'Im s' });
      hq.rect(0, -2.6, 1, 5.2, { c: 'c2', fo: 0.1, nostroke: true, layer: 'under' });
      P.forEach((z) => { const x = L.clamp(z[0], -3.4, 0.95), y = L.clamp(z[1], -2.5, 2.5); cross(hq, x, y, z[0] < 0 ? 'c1' : 'c2'); });
      const ys = run.map((p) => p[1]), pre = run.filter((p) => p[0] < 15), post = run.filter((p) => p[0] > 15);
      const peak = Math.max(...pre.map((p) => p[1])), os = Math.max(0, peak - 1);
      const errEnd = 1 - (run.at(-1)?.[1] ?? NaN), dip = 1 - Math.min(...post.map((p) => p[1]));
      L.legend(ctx.host, [{ c: 'c1', label: T('output y', '出力 y') }, { c: 'ink', dash: true, label: T('set-point r = 1', '目標値 r = 1') }, { c: 'c2', label: T('control effort u', '操作量 u') }]);
      void ys;
      const fin = (x, d) => (stable || marginal ? fmt(x, d) : '∞');
      ctx.readout([{ k: T('closed loop', '閉ループ'), v: stable ? T('stable', '安定') : marginal ? T('marginal', '安定限界') : T('unstable', '不安定'), tone: stable ? 'good' : 'warn' }, { k: T('overshoot', 'オーバーシュート'), v: stable || marginal ? `${fmt(os * 100, 1)}%` : '∞' }, { k: T('dip after disturbance', '外乱後の落ち込み'), v: fin(dip, 3) }, { k: T('error at t = 40', 't = 40 での誤差'), v: fin(errEnd, 4), tone: 'key' }, { k: T('slowest pole', '最も遅い極'), v: fmt(maxRe, 3) }],
        marginal ? T('A closed-loop pole sits at s = 0: with no integral action and no proportional gain nothing pulls the output back, so any offset stays or drifts.', '閉ループの極が s = 0 にあります。積分動作も比例ゲインもないので出力を引き戻すものがなく、ずれは残るか漂います。') : !stable ? T('A pair of poles has crossed into the right half-plane: the loop now amplifies its own oscillation.', '一対の極が右半平面に入りました。ループが自分自身の振動を増幅しています。') : v.ki === 0 ? T('With no integral action the disturbance leaves a permanent offset.', '積分動作がないと、外乱は恒久的なずれを残します。') : T('The integral term slowly removes the offset the disturbance caused; the derivative term damps the ringing.', '積分項が外乱によるずれをゆっくり取り除き、微分項が振動を抑えます。'));
    },
  };

  /* ---------- 3. Bode and Nyquist ---------- */
  D['bode-nyquist'] = {
    render(ctx, v) {
      const K = v.gain, tau = v.delay, M = margins(K, tau), N = encirclements(K, tau), stable = N === 0;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Bode plot: gain in decibels and phase in degrees', 'ボード線図：デシベルのゲインと度の位相'));
      const lw = (w) => Math.log10(w), tx = [[-2, '0.01'], [-1, '0.1'], [0, '1'], [1, '10'], [2, '100']];
      const gm = L.fig(c1, { x: [-2, 2], y: [-80, 30], aspect: 0.55, maxH: 230, ylabel: 'dB', ticksX: tx });
      gm.hline(0, { c: 'ink', dash: '4 4' });
      gm.line(L.sample(-2, 2, 400, (x) => 20 * Math.log10(loopAt(K, tau, Math.pow(10, x))[2])), { c: 'c1', w: 2.4 });
      const gp = L.fig(c1, { x: [-2, 2], y: [-540, 0], aspect: 0.55, maxH: 230, xlabel: 'ω', ylabel: T('phase', '位相'), ticksX: tx, ticksY: [[0, '0°'], [-180, '−180°'], [-360, '−360°'], [-540, '−540°']] });
      gp.hline(-180, { c: 'c2', dash: '4 4' });
      gp.line(L.sample(-2, 2, 400, (x) => loopAt(K, tau, Math.pow(10, x))[3] * 180 / PI), { c: 'c3', w: 2.4 });
      if (M.wc !== null && M.wc > 0.01 && M.wc < 100) { gm.vline(lw(M.wc), { c: 'hl', dash: '3 3' }); gp.vline(lw(M.wc), { c: 'hl', dash: '3 3' }); const ph = loopAt(K, tau, M.wc)[3] * 180 / PI; if (Number.isFinite(M.pm)) { gp.seg([lw(M.wc), -180], [lw(M.wc), ph], { c: 'hl', w: 3.4 }); gp.text(lw(M.wc), (ph - 180) / 2, T(`PM ${fmt(M.pm, 0)}°`, `位相余裕 ${fmt(M.pm, 0)}°`), { small: true, c: 'hl', dx: 8, anchor: 'start' }); } }
      if (M.w180 !== null && M.w180 > 0.01 && M.w180 < 100) { gm.vline(lw(M.w180), { c: 'c2', dash: '3 3' }); gp.vline(lw(M.w180), { c: 'c2', dash: '3 3' }); const db = 20 * Math.log10(loopAt(K, tau, M.w180)[2]); gm.seg([lw(M.w180), 0], [lw(M.w180), db], { c: 'c2', w: 3.4 }); gm.text(lw(M.w180), db / 2, T(`GM ${fmt(-db, 1)} dB`, `ゲイン余裕 ${fmt(-db, 1)} dB`), { small: true, c: 'c2', dx: 8, anchor: 'start' }); }
      L.h('p', 'lab-cap', c2, T('Nyquist plot: the same function as one curve in the complex plane', 'ナイキスト線図：同じ関数を複素平面上の一本の曲線として'));
      const R = Math.max(2.4, K + 0.4);
      const nq = L.fig(c2, { x: [-R, R], y: [-R * 0.9, R * 0.9], equal: true, maxH: 440, xlabel: 'Re L', ylabel: 'Im L' });
      nq.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 4' });
      const ws = L.seq(1600, (i) => Math.pow(10, -3 + 5 * i / 1599));
      const pts = ws.map((w) => loopAt(K, tau, w).slice(0, 2));
      nq.line(pts.map(([x, y]) => [x, -y]), { c: 'c1', w: 1.4, dash: '4 3', op: 0.6 });
      nq.line(pts, { c: 'c1', w: 2.6 });
      [0.3, 1, 3].forEach((w) => { const [x, y] = loopAt(K, tau, w); const [x2, y2] = loopAt(K, tau, w * 1.05); nq.arrow([x, y], [x2, y2], { c: 'c1', w: 2.6 }); nq.text(x, y, `ω=${w}`, { small: true, c: 'muted', dx: 10, dy: -6, anchor: 'start' }); });
      nq.dot(-1, 0, { c: 'c2', r: 6 }); nq.text(-1, 0, '−1', { small: true, c: 'c2', dy: 18 });
      L.legend(ctx.host, [{ c: 'c1', label: T('L(iω), ω > 0', 'L(iω)、ω > 0') }, { c: 'c1', dash: true, label: T('its mirror, ω < 0', 'その鏡像、ω < 0') }, { c: 'c3', label: T('phase', '位相') }, { c: 'hl', label: T('gain crossover and phase margin', 'ゲイン交差と位相余裕') }, { c: 'c2', label: T('phase crossover and gain margin', '位相交差とゲイン余裕') }]);
      ctx.readout([{ k: T('closed loop', '閉ループ'), v: stable ? T('stable', '安定') : T('unstable', '不安定'), tone: stable ? 'good' : 'warn' }, { k: T('encirclements of −1', '−1 を囲む回数'), v: String(N), tone: 'key' }, { k: T('gain margin', 'ゲイン余裕'), v: Number.isFinite(M.gm) ? `×${fmt(M.gm, 3)}` : '∞' }, { k: T('phase margin', '位相余裕'), v: Number.isFinite(M.pm) ? `${fmt(M.pm, 1)}°` : '∞' }],
        tau > 0 ? T('Delay leaves the gain curve untouched and only pulls the phase down, so it eats the phase margin first.', '遅れはゲイン曲線を変えず位相だけを下げるので、まず位相余裕を食いつぶします。') : T('Without delay the loop is stable for K < 8; watch the curve reach −1 exactly as the gain margin reaches ×1.', '遅れがなければ K < 8 でループは安定です。ゲイン余裕が ×1 に達するちょうどそのとき、曲線が −1 に届きます。'));
    },
  };
})();
