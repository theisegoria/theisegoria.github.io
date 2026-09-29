'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const TAU = 2 * Math.PI, C_AIR = 343, SQ2 = Math.SQRT2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const cx = { add: (a, b) => [a[0] + b[0], a[1] + b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, abs: (a) => Math.hypot(a[0], a[1]), arg: (a) => Math.atan2(a[1], a[0]), scale: (a, k) => [a[0] * k, a[1] * k], expj: (t) => [Math.cos(t), Math.sin(t)] };
  const dB = (z) => 20 * Math.log10(Math.max(1e-9, typeof z === 'number' ? Math.abs(z) : cx.abs(z)));

  /* ---------- model (pure, checked by checks/crossovers-filters.cjs); SI units ---------- */
  // 0 RC low-pass, 1 RC high-pass, 2 RLC low-pass, 3 RLC band-pass (output across R)
  function rlc(type, R, Lh, C, f) {
    const w = TAU * f;
    if (type === 0) return cx.div([1, 0], [1, w * R * C]);
    if (type === 1) return cx.div([0, w * R * C], [1, w * R * C]);
    const den = [1 - w * w * Lh * C, w * R * C];
    return type === 2 ? cx.div([1, 0], den) : cx.div([0, w * R * C], den);
  }
  const rcCorner = (R, C) => 1 / (TAU * R * C);
  const f0Of = (Lh, C) => 1 / (TAU * Math.sqrt(Lh * C));
  const qOf = (R, Lh, C) => Math.sqrt(Lh / C) / R;

  // crossover pairs, s = j f/fc. 0 BW1, 1 BW2, 2 BW2 tweeter inverted, 3 LR2 tweeter inverted, 4 LR4
  function xover(type, f, fc) {
    const s = [0, f / fc], s2 = cx.mul(s, s), one = [1, 0];
    const b1 = cx.add(one, s), b2 = cx.add(cx.add(s2, cx.scale(s, SQ2)), one);
    let lp, hp;
    if (type === 0) { lp = cx.div(one, b1); hp = cx.div(s, b1); }
    else if (type === 1 || type === 2) { lp = cx.div(one, b2); hp = cx.div(s2, b2); if (type === 2) hp = cx.scale(hp, -1); }
    else if (type === 3) { const d = cx.mul(b1, b1); lp = cx.div(one, d); hp = cx.scale(cx.div(s2, d), -1); }
    else { const d = cx.mul(b2, b2); lp = cx.div(one, d); hp = cx.div(cx.mul(s2, s2), d); }
    return { lp, hp, sum: cx.add(lp, hp) };
  }
  const XNAMES = [['1st-order Butterworth', '一次バターワース'], ['2nd-order Butterworth', '二次バターワース'], ['2nd-order Butterworth, tweeter inverted', '二次バターワース、ツイーター反転'], ['LR2, tweeter inverted', 'LR2、ツイーター反転'], ['LR4', 'LR4']];

  // two point sources, tweeter h above and dz behind the woofer; theta in degrees above the axis
  const pathDelay = (h, dz, thDeg) => { const t = thDeg * Math.PI / 180; return (dz * Math.cos(t) - h * Math.sin(t)) / C_AIR; };
  function offsetResp(h, dz, fc, f, thDeg) {
    const X = xover(4, f, fc), dt = pathDelay(h, dz, thDeg);
    return cx.add(X.lp, cx.mul(X.hp, cx.expj(-TAU * f * dt)));
  }
  const lobeTilt = (h, dz) => (h > 1e-9 ? Math.atan2(dz, h) * 180 / Math.PI : 0);
  // nulls at the crossover frequency: angles in (-90, 90) where the delay is an odd half-cycle
  function nullsAt(h, dz, fc) {
    const out = [];
    if (h < 1e-9) return out;
    for (let k = -8; k <= 8; k++) {
      const target = (k + 0.5) / fc; // dt = +-(k+1/2)/fc
      // dz cos t - h sin t = c*target  ->  R cos(t + phi) = c*target
      const Rr = Math.hypot(dz, h), phi = Math.atan2(h, dz), q = C_AIR * target / Rr;
      if (Math.abs(q) > 1) continue;
      for (const sgn of [1, -1]) { const t = sgn * Math.acos(q) - phi; const d = t * 180 / Math.PI; const dd = ((d + 540) % 360) - 180; if (dd > -90 && dd < 90 && !out.some((o) => Math.abs(o - dd) < 1e-6)) out.push(dd); }
    }
    return out.sort((a, b) => a - b);
  }
  function firstNulls(h, dz, fc) {
    const tilt = lobeTilt(h, dz), ns = nullsAt(h, dz, fc);
    const above = ns.filter((n) => n > tilt), below = ns.filter((n) => n < tilt);
    return { above: above.length ? above[0] : null, below: below.length ? below[below.length - 1] : null };
  }

  (window.LabModels = window.LabModels || {})['crossovers-filters'] = { cx, dB, rlc, rcCorner, f0Of, qOf, xover, pathDelay, offsetResp, lobeTilt, nullsAt, firstNulls, C_AIR };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const LOGT = [[1.301, '20'], [1.699, '50'], [2, '100'], [2.301, '200'], [2.699, '500'], [3, '1k'], [3.301, '2k'], [3.699, '5k'], [4, '10k'], [4.301, '20k']];
  const hz = (f) => (f >= 1000 ? fmt(f / 1000, f >= 10000 ? 1 : 2) + ' kHz' : fmt(f, f < 100 ? 1 : 0) + ' Hz');
  const deg = (r) => r * 180 / Math.PI;
  const unwrap = (arr) => { const o = arr.slice(); for (let i = 1; i < o.length; i++) { while (o[i] - o[i - 1] > 180) o[i] -= 360; while (o[i] - o[i - 1] < -180) o[i] += 360; } return o; };
  const sgn = (x, d = 1) => { const r = Math.round(x * 10 ** d) / 10 ** d; return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(r), d); };

  // schematic parts on a stage
  function parts(s) {
    const wire = (a, b, c = 'ink') => s.seg(a, b, { c, w: 1.6 });
    const res = (a, b, c, label, vert) => { const n = 6, pts = [a]; for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, z = i % 2 ? -2.2 : 2.2; pts.push(vert ? [a[0] + z, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, a[1] + z]); } pts.push(b); s.line(pts, { c, w: 1.7 }); if (vert) s.text(a[0] + 5, (a[1] + b[1]) / 2, label, { small: true, c, anchor: 'start' }); else s.text((a[0] + b[0]) / 2, a[1] - 6, label, { small: true, c }); };
    const coil = (a, b, c, label, vert) => { const n = 4; if (vert) { const r = (b[1] - a[1]) / (2 * n); for (let i = 0; i < n; i++) s.line(L.sample(0, Math.PI, 16, (t) => [a[0] + Math.abs(r) * Math.sin(t), a[1] + r + 2 * r * i - r * Math.cos(t)]), { c, w: 1.7 }); s.text(a[0] + 6, (a[1] + b[1]) / 2, label, { small: true, c, anchor: 'start' }); } else { const r = (b[0] - a[0]) / (2 * n); for (let i = 0; i < n; i++) s.line(L.sample(0, Math.PI, 16, (t) => [a[0] + r + 2 * r * i - r * Math.cos(t), a[1] + r * Math.sin(t)]), { c, w: 1.7 }); s.text((a[0] + b[0]) / 2, a[1] - 6, label, { small: true, c }); } };
    const cap = (a, b, c, label, vert) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (vert) { wire(a, [m[0], m[1] - 1.2]); wire([m[0], m[1] + 1.2], b); s.seg([m[0] - 4, m[1] - 1.2], [m[0] + 4, m[1] - 1.2], { c, w: 2.4 }); s.seg([m[0] - 4, m[1] + 1.2], [m[0] + 4, m[1] + 1.2], { c, w: 2.4 }); s.text(m[0] + 6, m[1], label, { small: true, c, anchor: 'start' }); } else { wire(a, [m[0] - 1.2, m[1]]); wire([m[0] + 1.2, m[1]], b); s.seg([m[0] - 1.2, m[1] - 4], [m[0] - 1.2, m[1] + 4], { c, w: 2.4 }); s.seg([m[0] + 1.2, m[1] - 4], [m[0] + 1.2, m[1] + 4], { c, w: 2.4 }); s.text(m[0], m[1] - 7, label, { small: true, c }); } };
    return { wire, res, coil, cap };
  }

  /* ---------- 1. RC and RLC filters ---------- */
  D['rlc-filters'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const R = v.R, Lh = v.L * 1e-3, C = v.C * 1e-6, type = v.type, f = Math.pow(10, v.lf);
      const H = rlc(type, R, Lh, C, f), g = cx.abs(H), ph = deg(cx.arg(H));
      const isRLC = type >= 2, fc = rcCorner(R, C), f0 = f0Of(Lh, C), Q = qOf(R, Lh, C), fk = isRLC ? f0 : fc;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The circuit: the input on the left, the output taken across the last element.', '回路です。左が入力で、出力は最後の素子の両端から取ります。'));
      const s = L.stage(c1, { w: 100, h: 50, maxH: 220 }), P = parts(s);
      const yt = 40, yb = 12, xs = 70;
      // source and terminals
      s.circle(8, 26, 5, { c: 'ink', w: 1.4 }); s.line(L.sample(-Math.PI, Math.PI, 20, (t) => [8 + t * 0.9, 26 - 2 * Math.sin(t)]), { c: 'ink', w: 1.2 }); s.text(15, 26, 'v_in', { small: true, c: 'muted', anchor: 'start' });
      P.wire([8, 31], [8, yt]); P.wire([8, 21], [8, yb]); P.wire([8, yb], [96, yb], 'ink');
      const ser = { 0: [['R', 'res', 'c2']], 1: [['C', 'cap', 'c3']], 2: [['R', 'res', 'c2'], ['L', 'coil', 'c1']], 3: [['L', 'coil', 'c1'], ['C', 'cap', 'c3']] }[type];
      const sh = { 0: ['C', 'cap', 'c3'], 1: ['R', 'res', 'c2'], 2: ['C', 'cap', 'c3'], 3: ['R', 'res', 'c2'] }[type];
      const xs0 = 16, span = (xs - 6 - xs0) / ser.length;
      P.wire([8, yt], [xs0, yt]);
      ser.forEach(([nm, kind, c], i) => { const a = xs0 + i * span, b = a + span; P.wire([a, yt], [a + 3, yt]); P[kind]([a + 3, yt], [b - 3, yt], c, nm, false); P.wire([b - 3, yt], [b, yt]); });
      P.wire([xs0 + ser.length * span, yt], [96, yt]);
      P.wire([xs, yt], [xs, yt - 6]); P[sh[1]]([xs, yt - 6], [xs, yb + 6], sh[2], sh[0], true); P.wire([xs, yb + 6], [xs, yb]);
      s.circle(96, yt, 1.3, { c: 'hl', fill: 'hl', fo: 1 }); s.circle(96, yb, 1.3, { c: 'hl', fill: 'hl', fo: 1 }); s.text(96, 26, 'v_out', { small: true, c: 'hl', anchor: 'end' });
      // time traces
      L.h('p', 'lab-cap', c1, T(`Input (grey) and output (gold) at ${hz(f)}, two cycles. The output is ${fmt(g, 3)} times the input and ${ph <= 0 ? 'lags' : 'leads'} it by ${fmt(Math.abs(ph), 1)}°.`, `${hz(f)} での入力（灰）と出力（金）を 2 周期分示します。出力は入力の ${fmt(g, 3)} 倍で、${fmt(Math.abs(ph), 1)}° ${ph <= 0 ? '遅れて' : '進んで'}います。`));
      const top = Math.max(1.15, g * 1.12);
      const tf = L.fig(c1, { x: [0, 2], y: [-top, top], aspect: 0.42, xlabel: T('time (cycles)', '時間（周期）'), maxH: 190, ticksX: [[0, '0'], [0.5, '½'], [1, '1'], [1.5, '1½'], [2, '2']] });
      tf.hline(0, { c: 'muted', w: 1, layer: 'under' });
      let G = null;
      const drawT = (sh0) => {
        if (G) G.remove(); G = tf.group('main'); const add = (e) => (G.appendChild(e), e);
        add(tf.line(L.sample(0, 2, 160, (x) => Math.sin(TAU * (x + sh0))), { c: 'muted', w: 1.8 }));
        add(tf.line(L.sample(0, 2, 160, (x) => g * Math.sin(TAU * (x + sh0) + ph * Math.PI / 180)), { c: 'hl', w: 2.4 }));
        const pk = ((0.25 - sh0) % 1 + 1) % 1, po = ((0.25 - ph / 360 - sh0) % 1 + 1) % 1;
        add(tf.line([[pk, 1], [pk, top * 0.98]], { c: 'muted', w: 1, dash: '3 3' })); add(tf.line([[po, g], [po, -top * 0.98]], { c: 'hl', w: 1, dash: '3 3' }));
      };
      drawT(0);
      // Bode
      const N = 360, lfs = L.seq(N, (i) => 1.3 + i * 3 / (N - 1)), Hs = lfs.map((x) => rlc(type, R, Lh, C, Math.pow(10, x)));
      const mags = Hs.map((z) => dB(z)), phs = unwrap(Hs.map((z) => deg(cx.arg(z))));
      const ymax = Math.max(6, Math.ceil((Math.max(...mags) + 4) / 6) * 6), ymin = -60;
      L.h('p', 'lab-cap', c2, T('Bode plot: gain in dB and phase against frequency. Drag the gold point to change the test frequency.', 'ボード線図：周波数に対する利得（dB）と位相です。金色の点をドラッグして試験周波数を変えてください。'));
      const b = L.fig(c2, { x: [1.3, 4.3], y: [ymin, ymax], aspect: 0.62, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 300, ticksX: LOGT, ticksY: L.seq(Math.floor(ymax / 12) - Math.ceil(ymin / 12) + 1, (i) => { const y = Math.ceil(ymin / 12) * 12 + i * 12; return [y, y > 0 ? '+' + y : String(y).replace('-', '−')]; }) });
      b.hline(0, { c: 'muted', w: 1, layer: 'under' }); b.hline(-3, { c: 'muted', w: 1, dash: '2 4', layer: 'under' });
      b.vline(Math.log10(fk), { c: 'c2', w: 1.2, dash: '4 3', layer: 'under' }); b.text(Math.log10(fk), ymax - 3, isRLC ? `f₀ = ${hz(f0)}` : `f_c = ${hz(fc)}`, { small: true, c: 'c2', anchor: 'start', dx: 5 });
      // asymptotes for the RC case
      if (!isRLC) { const x0 = Math.log10(fc); b.line(type === 0 ? [[1.3, 0], [x0, 0], [4.3, -20 * (4.3 - x0)]] : [[1.3, -20 * (x0 - 1.3)], [x0, 0], [4.3, 0]], { c: 'c4', w: 1.2, dash: '5 4', layer: 'under' }); }
      b.line(lfs.map((x, i) => [x, clamp(mags[i], ymin - 5, ymax + 5)]), { c: 'c1', w: 2.4, layer: 'main' });
      b.handle(v.lf, clamp(dB(H), ymin, ymax), { c: 'hl', r: 7, axis: 'x', label: T('Test frequency', '試験周波数'), bounds: [1.5, 4.3, ymin, ymax], onDrag: (x) => ctx.set('lf', Math.round(clamp(x, 1.5, 4.3) * 100) / 100) });
      const pr = L.fig(c2, { x: [1.3, 4.3], y: [-180, 90], aspect: 0.3, xlabel: 'f (Hz)', ylabel: T('phase (°)', '位相（°）'), maxH: 150, ticksX: LOGT, ticksY: [[-180, '−180'], [-90, '−90'], [0, '0'], [90, '90']] });
      pr.hline(0, { c: 'muted', w: 1, layer: 'under' }); pr.line(lfs.map((x, i) => [x, phs[i]]), { c: 'c4', w: 1.8, layer: 'main' }); pr.dot(v.lf, ph, { c: 'hl', r: 4.5, layer: 'over' });
      L.legend(ctx.host, [{ c: 'c1', label: T('gain |H| (dB)', '利得 |H|（dB）') }, { c: 'c4', label: T('phase of H', 'H の位相') }].concat(isRLC ? [] : [{ c: 'c4', dash: true, label: T('straight-line asymptotes', '直線の漸近線') }]));
      const items = isRLC
        ? [{ k: 'f₀', v: hz(f0), tone: 'key' }, { k: 'Q', v: fmt(Q, Q < 10 ? 2 : 1) }, { k: T('gain at f₀', 'f₀ での利得'), v: `${sgn(dB(rlc(type, R, Lh, C, f0)), 1)} dB` }]
        : [{ k: 'f_c', v: hz(fc), tone: 'key' }, { k: 'RC', v: `${fmt(R * C * 1e3, 3)} ms` }];
      items.push({ k: T(`at ${hz(f)}`, `${hz(f)} で`), v: `${sgn(dB(H), 1)} dB, ${sgn(ph, 1)}°` });
      const note = type === 2 && Q > 0.8
        ? T(`With Q = ${fmt(Q, 2)} the response peaks before it falls: at f₀ the reactances of L and C cancel, the current is limited only by R, and the voltage across C is Q times the input. Raise R to damp it; Q = 0.707 is the flattest (Butterworth) choice.`, `Q = ${fmt(Q, 2)} では応答は下がる前にピークをもちます。f₀ では L と C のリアクタンスが打ち消し合い、電流は R だけで制限され、C の両端の電圧は入力の Q 倍になります。R を上げると制動されます。Q = 0.707 が最も平らな（バターワースの）選択です。`)
        : type === 3
          ? T(`The band-pass is 0 dB and in phase exactly at f₀, and its −3 dB bandwidth is f₀/Q = ${hz(f0 / Q)}: a larger R widens the band.`, `バンドパスは f₀ でちょうど 0 dB かつ同位相で、−3 dB の帯域幅は f₀/Q = ${hz(f0 / Q)} です。R を大きくすると帯域が広がります。`)
          : isRLC
            ? T(`Two reactive elements give a second-order filter: 40 dB per decade above f₀, twice the RC slope, and a phase that turns through 180°.`, `二つのリアクタンス素子は二次のフィルターを作ります。f₀ より上で 10 倍ごとに 40 dB、RC の二倍の傾きで、位相は 180° 回ります。`)
            : T(`One pole: the straight-line asymptotes meet at f_c, where the true curve is 3 dB below them and the phase is exactly ${type === 0 ? '−45°' : '+45°'}.`, `極は一つです。直線の漸近線は f_c で交わり、そこで実際の曲線はそれより 3 dB 下にあり、位相はちょうど ${type === 0 ? '−45°' : '+45°'} です。`);
      ctx.readout(items, note);
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { drawT((t * 0.35) % 1); lab.textContent = T('scrolling', 'スクロール表示'); }, { autoplay: !L.reduced(), initialT: 0 });
    },
  };

  /* ---------- 2. crossover sum ---------- */
  D['crossover-sum'] = {
    render(ctx, v) {
      const type = v.type, fc = v.fc, f = Math.pow(10, v.lf), X = xover(type, f, fc);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Phasors at ${hz(f)}: the woofer’s output, then the tweeter’s added head to tail. The dark arrow is what the listener hears. The circle is unity gain.`, `${hz(f)} でのフェーザーです。ウーファーの出力に、ツイーターの出力を頭から尾へつなげて足しています。濃い矢印が聴き手の聞くものです。円は利得 1 です。`));
      const ph = L.fig(c1, { x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, maxH: 320 });
      ph.seg([-1.55, 0], [1.55, 0], { c: 'muted', w: 1, layer: 'under' }); ph.seg([0, -1.55], [0, 1.55], { c: 'muted', w: 1, layer: 'under' });
      ph.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 3', layer: 'under' }); ph.circle(0, 0, 0.5, { c: 'muted', w: 0.8, dash: '1 4', layer: 'under' });
      ph.text(1.52, 0, 'Re', { small: true, c: 'muted', anchor: 'end', dy: -6 }); ph.text(0, 1.52, 'Im', { small: true, c: 'muted', anchor: 'start', dx: 5 }); ph.text(0.36, -0.36, '−6 dB', { small: true, c: 'muted' });
      const tip = (z) => cx.abs(z) > 0.02;
      if (tip(X.lp)) ph.arrow([0, 0], X.lp, { c: 'c1', w: 5, layer: 'main' }); else ph.dot(0, 0, { c: 'c1', r: 3, layer: 'main' });
      if (tip(X.hp)) ph.arrow(X.lp, X.sum, { c: 'c2', w: 5, layer: 'main' });
      if (tip(X.sum)) ph.arrow([0, 0], X.sum, { c: 'ink', w: 1.6, layer: 'over' }); else ph.dot(0, 0, { c: 'ink', r: 4, layer: 'over' });
      // right: magnitudes and phase
      const N = 360, lfs = L.seq(N, (i) => 2 + i * 2.3 / (N - 1)), Xs = lfs.map((x) => xover(type, Math.pow(10, x), fc));
      L.h('p', 'lab-cap', c2, T('Woofer, tweeter and their sum. Drag the gold point along the sum to move the phasors.', 'ウーファー、ツイーター、そしてその和です。和の曲線に沿って金色の点をドラッグし、フェーザーを動かしてください。'));
      const b = L.fig(c2, { x: [2, 4.3], y: [-30, 6], aspect: 0.62, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 300, ticksX: LOGT.slice(2), ticksY: [[6, '+6'], [3, '+3'], [0, '0'], [-6, '−6'], [-12, '−12'], [-18, '−18'], [-24, '−24'], [-30, '−30']] });
      b.hline(0, { c: 'muted', w: 1, layer: 'under' }); b.vline(Math.log10(fc), { c: 'muted', w: 1.2, dash: '4 3', layer: 'under' }); b.text(Math.log10(fc), 4.5, `f_c = ${hz(fc)}`, { small: true, c: 'muted', anchor: 'start', dx: 5 });
      const cl = (y) => clamp(y, -34, 8);
      b.line(lfs.map((x, i) => [x, cl(dB(Xs[i].lp))]), { c: 'c1', w: 1.8, layer: 'main' });
      b.line(lfs.map((x, i) => [x, cl(dB(Xs[i].hp))]), { c: 'c2', w: 1.8, layer: 'main' });
      b.line(lfs.map((x, i) => [x, cl(dB(Xs[i].sum))]), { c: 'ink', w: 2.6, layer: 'main' });
      b.handle(v.lf, clamp(dB(X.sum), -30, 6), { c: 'hl', r: 7, axis: 'x', label: T('Frequency', '周波数'), bounds: [2, 4.3, -30, 6], onDrag: (x) => ctx.set('lf', Math.round(clamp(x, 2, 4.3) * 100) / 100) });
      const phs = unwrap(Xs.map((z) => deg(cx.arg(z.sum))));
      const pmin = Math.min(-200, Math.floor(Math.min(...phs) / 90) * 90), pmax = Math.max(90, Math.ceil(Math.max(...phs) / 90) * 90);
      const pr = L.fig(c2, { x: [2, 4.3], y: [pmin, pmax], aspect: 0.3, xlabel: 'f (Hz)', ylabel: T('phase of sum (°)', '和の位相（°）'), maxH: 150, ticksX: LOGT.slice(2), ticksY: L.seq(Math.round((pmax - pmin) / 90) + 1, (i) => { const y = pmin + i * 90; return [y, String(y).replace('-', '−')]; }).filter((_, i, a) => a.length < 6 || i % 2 === 0) });
      pr.hline(0, { c: 'muted', w: 1, layer: 'under' }); pr.line(lfs.map((x, i) => [x, phs[i]]), { c: 'c4', w: 1.8, layer: 'main' });
      const iSel = Math.round((v.lf - 2) / 2.3 * (N - 1)); if (tip(X.sum)) pr.dot(v.lf, phs[clamp(iSel, 0, N - 1)], { c: 'hl', r: 4.5, layer: 'over' });
      L.legend(ctx.host, [{ c: 'c1', label: T('woofer (low-pass)', 'ウーファー（ローパス）') }, { c: 'c2', label: T('tweeter (high-pass)', 'ツイーター（ハイパス）') }, { c: 'ink', label: T('acoustic sum', '音響的な和') }, { c: 'c4', label: T('phase of the sum', '和の位相') }]);
      const Xc = xover(type, fc, fc), sums = Xs.map((z) => dB(z.sum)), dev = Math.max(...sums.map(Math.abs));
      const rel = deg(cx.arg(X.hp) - cx.arg(X.lp)), relW = ((rel + 540) % 360) - 180;
      ctx.readout([
        { k: T('at f_c: woofer, tweeter', 'f_c で：ウーファー、ツイーター'), v: `${sgn(dB(Xc.lp), 2)} dB, ${sgn(dB(Xc.hp), 2)} dB` },
        { k: T('at f_c: sum', 'f_c で：和'), v: dB(Xc.sum) < -60 ? T('complete cancellation', '完全に打ち消し') : `${sgn(dB(Xc.sum), 2)} dB`, tone: 'key' },
        { k: T('largest deviation of the sum', '和の最大のずれ'), v: `${fmt(dev, 2)} dB` },
        { k: T(`at ${hz(f)}: tweeter relative to woofer`, `${hz(f)} で：ウーファーに対するツイーター`), v: `${sgn(relW, 0)}°` },
      ], [
        T('First order: the two halves are 90° apart at every frequency and their sum is exactly 1. The price is a shallow 6 dB/octave slope that leaves the tweeter handling a lot of low-frequency energy.', '一次：二つの半分はどの周波数でも 90° 離れていて、和はちょうど 1 です。代償は 6 dB/オクターブのなだらかな傾きで、ツイーターに多くの低域のエネルギーを負わせます。'),
        T('Second-order Butterworth: at the crossover the two arrows point in opposite directions and cancel. This is the notch that wiring the tweeter in reverse is meant to fix.', '二次バターワース：クロスオーバーで二つの矢印は逆向きを指し、打ち消し合います。ツイーターを逆に配線するのは、この落ち込みを直すためです。'),
        T('Inverted, the second-order Butterworth pair adds at right angles to magnitude √2 at f_c: a 3 dB bump. Its powers sum flat, its voltages do not.', '反転すると、二次バターワースの組は f_c で直角に足し合わされて大きさ √2、3 dB の盛り上がりになります。パワーの和は平らですが、電圧の和は平らではありません。'),
        T('LR2 with the tweeter inverted: each half is −6 dB at f_c and they are in phase, so the sum is flat everywhere, an all-pass whose phase turns through 180°.', 'ツイーターを反転した LR2：各半分は f_c で −6 dB で同位相なので、和はどこでも平らで、位相が 180° 回るオールパスになります。'),
        T('LR4: two Butterworth sections in cascade. Each half is −6 dB and in phase at f_c, the sum is flat to within rounding, and the phase turns through a full 360°.', 'LR4：二段のバターワースを縦続にしたものです。各半分は f_c で −6 dB かつ同位相で、和は丸め誤差の範囲で平らになり、位相はまるまる 360° 回ります。'),
      ][type]);
    },
  };

  /* ---------- 3. driver offset ---------- */
  D['driver-offset'] = {
    render(ctx, v) {
      const h = v.h / 100, dz = v.dz / 100, fc = v.fc, ang = v.ang;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Vertical radiation pattern (side view, speaker facing right). Rings at 0, −10 and −20 dB. Drag the listener around the arc.', '縦方向の放射パターン（側面図、スピーカーは右向き）です。輪は 0、−10、−20 dB です。聴き手を弧に沿ってドラッグしてください。'));
      const rOf = (d) => Math.max(0, (d + 30) / 30);
      const pf = L.fig(c1, { x: [-0.45, 1.3], y: [-1.15, 1.15], equal: true, axes: false, maxH: 360 });
      [0, -10, -20].forEach((d) => { pf.line(L.sample(-90, 90, 60, (t) => [rOf(d) * Math.cos(t * Math.PI / 180), rOf(d) * Math.sin(t * Math.PI / 180)]), { c: 'muted', w: 0.9, dash: d ? '2 4' : '3 3', layer: 'under' }); pf.text(0.03, -rOf(d) + 0.05, d ? `${String(d).replace('-', '−')}` : '0 dB', { small: true, c: 'muted', anchor: 'start' }); });
      [-60, -30, 30, 60].forEach((a) => { const t = a * Math.PI / 180; pf.seg([0, 0], [1.02 * Math.cos(t), 1.02 * Math.sin(t)], { c: 'muted', w: 0.6, op: 0.5, layer: 'under' }); pf.text(1.1 * Math.cos(t), 1.1 * Math.sin(t), `${a > 0 ? '+' : '−'}${Math.abs(a)}°`, { small: true, c: 'muted' }); });
      pf.seg([0, 0], [1.05, 0], { c: 'muted', w: 0.8, layer: 'under' });
      // the baffle, to scale (30 cm spans 0.4 units)
      const k = 0.4 / 0.3; pf.rect(-0.12 - Math.max(0, dz) * k, -0.18, 0.06, 0.18 + h * k + 0.12, { c: 'muted', fill: 'muted', fo: 0.12, w: 1, layer: 'under' });
      pf.circle(0, 0, 0.055, { c: 'c1', fill: 'c1', fo: 0.35, w: 1.5, layer: 'main' }); pf.circle(-dz * k, h * k, 0.03, { c: 'c2', fill: 'c2', fo: 0.5, w: 1.5, layer: 'main' });
      const polar = (f) => L.sample(-90, 90, 361, (t) => { const r = rOf(dB(offsetResp(h, dz, fc, f, t))), a = t * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; });
      pf.line(polar(fc / 2), { c: 'c3', w: 1.4, dash: '5 3', layer: 'main' });
      pf.line(polar(fc * 2), { c: 'c4', w: 1.4, dash: '5 3', layer: 'main' });
      pf.line(polar(fc), { c: 'c1', w: 2.6, layer: 'main' });
      const tilt = lobeTilt(h, dz); if (h > 0) { const t = tilt * Math.PI / 180; pf.seg([0, 0], [1.02 * Math.cos(t), 1.02 * Math.sin(t)], { c: 'c1', w: 1, dash: '1 3', layer: 'main' }); }
      const ta = ang * Math.PI / 180, Rl = 1.02;
      pf.seg([0, 0], [Rl * Math.cos(ta), Rl * Math.sin(ta)], { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' });
      pf.handle(Rl * Math.cos(ta), Rl * Math.sin(ta), { c: 'hl', r: 8, label: T('Listener', '聴き手'), bounds: [-0.45, 1.3, -1.15, 1.15], onDrag: (x, y) => ctx.set('ang', Math.round(clamp(Math.atan2(y, Math.max(1e-6, x)) * 180 / Math.PI, -60, 60))) });
      // right: response at the seat
      const N = 400, lfs = L.seq(N, (i) => 2 + i * 2.3 / (N - 1));
      L.h('p', 'lab-cap', c2, T(`Frequency response at the listener, ${sgn(ang, 0)}° from the axis, against the response on the axis.`, `軸から ${sgn(ang, 0)}° の聴き手での周波数応答を、軸上の応答と比べて示します。`));
      const b = L.fig(c2, { x: [2, 4.3], y: [-30, 6], aspect: 0.66, xlabel: 'f (Hz)', ylabel: 'dB', maxH: 320, ticksX: LOGT.slice(2), ticksY: [[6, '+6'], [0, '0'], [-6, '−6'], [-12, '−12'], [-18, '−18'], [-24, '−24'], [-30, '−30']] });
      b.hline(0, { c: 'muted', w: 1, layer: 'under' }); b.vline(Math.log10(fc), { c: 'muted', w: 1.2, dash: '4 3', layer: 'under' }); b.text(Math.log10(fc), 4.5, `f_c = ${hz(fc)}`, { small: true, c: 'muted', anchor: 'start', dx: 5 });
      const cl = (y) => clamp(y, -34, 8);
      b.line(lfs.map((x) => [x, cl(dB(offsetResp(h, dz, fc, Math.pow(10, x), 0)))]), { c: 'muted', w: 1.8, dash: '4 3', layer: 'main' });
      b.line(lfs.map((x) => [x, cl(dB(offsetResp(h, dz, fc, Math.pow(10, x), ang)))]), { c: 'hl', w: 2.6, layer: 'main' });
      L.legend(ctx.host, [{ c: 'c1', label: T('pattern at f_c', 'f_c でのパターン') }, { c: 'c3', dash: true, label: T('at f_c/2', 'f_c/2 で') }, { c: 'c4', dash: true, label: T('at 2f_c', '2f_c で') }, { c: 'hl', label: T('response at the listener', '聴き手での応答') }, { c: 'muted', dash: true, label: T('on axis', '軸上') }]);
      const dt = pathDelay(h, dz, ang), atSeat = dB(offsetResp(h, dz, fc, fc, ang)), nl = firstNulls(h, dz, fc);
      const nullTxt = (n) => (n === null ? T('none in front', '前方にはなし') : `${sgn(n, 1)}°`);
      ctx.readout([
        { k: T('extra path to the tweeter', 'ツイーターまでの経路差'), v: `${sgn(dt * C_AIR * 100, 1)} cm, ${sgn(dt * 1e6, 0)} µs` },
        { k: T('level at the seat, at f_c', '席での f_c のレベル'), v: `${sgn(atSeat, 1)} dB`, tone: 'key' },
        { k: T('main lobe points', '主ローブの向き'), v: `${sgn(tilt, 1)}°` },
        { k: T('first nulls at f_c', 'f_c での最初の零点'), v: `${nullTxt(nl.above)}, ${nullTxt(nl.below)}` },
        { k: T('at f_c, ±20°', 'f_c で ±20°'), v: `${sgn(dB(offsetResp(h, dz, fc, fc, 20)), 1)}, ${sgn(dB(offsetResp(h, dz, fc, fc, -20)), 1)} dB` },
      ], h < 1e-9
        ? (Math.abs(dz) < 1e-9
          ? T('Coincident: both drivers radiate from the same point, the delay is zero at every angle, and the sum is flat everywhere. This is what a coaxial driver aims for.', '一致：両方のドライバーが同じ点から放射し、遅延はどの角度でも 0 で、和はどこでも平らです。これが同軸型ドライバーの目指すものです。')
          : T(`On one axis but ${fmt(Math.abs(dz) * 100, 1)} cm apart in depth: the delay is nearly the same at every angle near the front, so a fixed ${fmt(Math.abs(dz) / C_AIR * 1e6, 0)} µs electronic delay on the ${dz > 0 ? 'woofer' : 'tweeter'} would restore a flat sum for everyone.`, `同じ軸上で奥行きが ${fmt(Math.abs(dz) * 100, 1)} cm ずれています。前方付近の遅延はどの角度でもほぼ同じなので、${dz > 0 ? 'ウーファー' : 'ツイーター'}に ${fmt(Math.abs(dz) / C_AIR * 1e6, 0)} µs の固定した電子的遅延を入れれば、全員に対して平らな和を取り戻せます。`))
        : T(`Near f_c the drivers play equally, so the pattern there is a two-source interference pattern with lobes and nulls; an octave away one driver dominates and the pattern is nearly round. Closer spacing, or a lower crossover frequency, pushes the first null further off axis.`, `f_c 付近では両ドライバーが等しく鳴るので、そこでのパターンはローブと零点をもつ二音源の干渉パターンになります。1 オクターブ離れると片方のドライバーが支配的になり、パターンはほぼ丸くなります。間隔を狭めるか、クロスオーバー周波数を下げると、最初の零点は軸から遠ざかります。`));
    },
  };
})();
