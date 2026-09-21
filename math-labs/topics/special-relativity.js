'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const gam = (v) => 1 / Math.sqrt(1 - v * v);
  const hyper = (s, lo, hi, n = 120) => L.sample(lo, hi, n, (u) => [s * Math.sinh(u), s * Math.cosh(u)]);

  /* ---------- 1. Minkowski diagram with a boosted frame (c = 1) ---------- */
  D['relativity-lorentz'] = {
    render(ctx, v) {
      const st = ctx.state, b = v.v, g = gam(b);
      st.ev ||= [1.2, 2];
      const R = 3;
      const f = L.fig(ctx.host, { x: [-R, R], y: [-R, R], equal: true, maxH: 540, xlabel: 'x', ylabel: 'ct', grid: true });
      // light cone
      f.poly([[0, 0], [R, R], [-R, R]], { c: 'hl', fo: 0.07, w: 0, layer: 'under' });
      f.poly([[0, 0], [R, -R], [-R, -R]], { c: 'hl', fo: 0.07, w: 0, layer: 'under' });
      // invariant hyperbolae
      for (const s of [1, 2]) {
        for (const sg of [1, -1]) {
          f.line(hyper(s, -2.2, 2.2).map(([x, t]) => [x, sg * t]), { c: 'c3', w: 1.1, dash: '4 4', op: 0.8, layer: 'under' });
          f.line(hyper(s, -2.2, 2.2).map(([x, t]) => [sg * t, x]), { c: 'c3', w: 1.1, dash: '4 4', op: 0.8, layer: 'under' });
        }
      }
      f.text(0, -1, 's² = 1', { c: 'c3', small: true, dx: 26, dy: 14, layer: 'under' });
      f.text(0, -2, 's² = 4', { c: 'c3', small: true, dx: 26, dy: 14, layer: 'under' });
      // boosted grid: lines of constant x' and constant t'
      const P = (xp, tp) => [g * (xp + b * tp), g * (tp + b * xp)];
      for (let k = -6; k <= 6; k++) {
        if (k === 0) continue;
        f.line([P(k, -9), P(k, 9)], { c: 'c2', w: 0.9, op: 0.3 });
        f.line([P(-9, k), P(9, k)], { c: 'c2', w: 0.9, op: 0.3 });
      }
      f.line([P(0, -9), P(0, 9)], { c: 'c2', w: 2.4 });
      f.line([P(-9, 0), P(9, 0)], { c: 'c2', w: 2.4 });
      // light rays
      f.line([[-R, -R], [R, R]], { c: 'hl', w: 2.2 });
      f.line([[-R, R], [R, -R]], { c: 'hl', w: 2.2 });
      f.text(R * 0.93, R * 0.93, T('light', '光'), { c: 'hl', small: true, anchor: 'end', dx: -10, dy: 2 });
      // unit ticks of the moving frame, sitting on the hyperbolae
      for (const k of [1, 2]) {
        const a = P(0, k), c = P(k, 0);
        f.dot(a[0], a[1], { c: 'c2', r: 4 }); f.dot(c[0], c[1], { c: 'c2', r: 4 });
      }
      // axis labels
      const tp = P(0, 2.7 / g), xp = P(2.7 / g, 0);
      const inb = (p) => Math.abs(p[0]) < R * 0.97 && Math.abs(p[1]) < R * 0.97;
      if (inb(tp)) f.text(tp[0], tp[1], 'ct′', { math: true, c: 'c2', dx: 14, dy: 4 });
      if (inb(xp)) f.text(xp[0], xp[1], 'x′', { math: true, c: 'c2', dx: 2, dy: -10 });
      // the event and how each frame reads its coordinates
      const [ex, et] = st.ev;
      const exp = g * (ex - b * et), etp = g * (et - b * ex), s2 = et * et - ex * ex;
      const onT = P(0, etp), onX = P(exp, 0);
      f.line([[ex, et], onT], { c: 'c2', w: 1.4, dash: '5 3' });
      f.line([[ex, et], onX], { c: 'c2', w: 1.4, dash: '5 3' });
      f.line([[ex, et], [0, et]], { c: 'ink', w: 1.1, dash: '2 3', op: 0.7 });
      f.line([[ex, et], [ex, 0]], { c: 'ink', w: 1.1, dash: '2 3', op: 0.7 });
      f.dot(onT[0], onT[1], { c: 'c2', r: 3.5, hollow: true });
      f.dot(onX[0], onX[1], { c: 'c2', r: 3.5, hollow: true });
      f.text(ex, et, 'E', { math: true, dx: 13, dy: -9 });
      f.handle(ex, et, { c: 'c1', r: 8, snap: 0.05, bounds: [-2.8, 2.8, -2.8, 2.8], label: T('Event E', '事象 E'), onDrag: (x, y) => { st.ev = [x, y]; ctx.redraw(); } });
      // speed handle on the ct' axis
      const hy = 2.55;
      f.handle(b * hy, hy, { c: 'c2', r: 7, axis: 'x', bounds: [-0.8 * hy, 0.8 * hy, hy, hy], label: T('Tilt of the moving frame (speed v)', '運動系の傾き（速さ v）'), onDrag: (x) => ctx.set('v', x / hy) });
      L.legend(ctx.host, [{ c: 'ink', label: T('frame S: x and ct axes', '系 S：x 軸と ct 軸') }, { c: 'c2', label: T('frame S′ moving at v: its axes and grid', '速さ v で動く系 S′：軸と格子') }, { c: 'hl', label: T('light rays, x = ±ct', '光線 x = ±ct') }, { c: 'c3', dash: true, label: T('hyperbolae (ct)² − x² = constant', '双曲線 (ct)² − x² = 一定') }]);
      const kind = Math.abs(s2) < 0.02 ? T('lightlike', '光的') : s2 > 0 ? T('timelike', '時間的') : T('spacelike', '空間的');
      ctx.readout([{ k: 'γ', v: fmt(g, 4) }, { k: T('E in S: (x, ct)', 'S での E：(x, ct)'), v: `(${fmt(ex, 2)}, ${fmt(et, 2)})` }, { k: T('E in S′: (x′, ct′)', 'S′ での E：(x′, ct′)'), v: `(${fmt(exp, 2)}, ${fmt(etp, 2)})`, tone: 'key' }, { k: 's² = (ct)² − x²', v: `${fmt(s2, 3)} (${kind})`, tone: 'good' }],
        T('Drag E, or tilt the orange axis. The dashed orange lines, parallel to the S′ axes, read off x′ and ct′; the unit ticks of S′ lie on the hyperbolae, so both frames agree on s².', 'E をドラッグするか、橙の軸を傾けてください。S′ の軸に平行な橙の破線で x′ と ct′ を読み取ります。S′ の目盛りは双曲線上にあるので、どちらの系でも s² は同じです。'));
    },
  };

  /* ---------- 2. Proper time along two worldlines ---------- */
  D.spacetime = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const b = v.v, Dt = v.time, g = gam(b), tau = Dt / g;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Spacetime diagram in the frame of the resting clock (c = 1)', '静止した時計の系での時空図（c = 1）'));
      L.h('p', 'lab-cap', c2, T('The two clocks, full dial = Δt', '2つの時計（文字盤1周 = Δt）'));
      const Rt = Dt * 1.08 + 0.2, xr = Math.max(Dt * 1.02, 1.2);
      const f = L.fig(c1, { x: [-0.28 * xr, xr], y: [0, Rt], equal: true, maxH: 440, xlabel: 'x', ylabel: 'ct' });
      f.line([[0, 0], [Rt, Rt]], { c: 'hl', w: 1.6, dash: '6 4' });
      f.text(Math.min(Rt, xr) * 0.55, Math.min(Rt, xr) * 0.55, T('light', '光'), { c: 'hl', small: true, dx: 8, dy: 12, anchor: 'start' });
      // hyperbolae of constant proper time through the ticks
      const nT = Math.floor(Dt + 1e-9);
      for (let k = 1; k <= nT; k++) f.line(hyper(k, 0, Math.acosh(Math.max(1, Rt / k))), { c: 'c3', w: 1, dash: '3 4', op: 0.75, layer: 'under' });
      // worldlines
      f.line([[0, 0], [0, Dt]], { c: 'ink', w: 3 });
      f.line([[0, 0], [b * Dt, Dt]], { c: 'c1', w: 3 });
      for (let k = 1; k <= nT; k++) f.dot(0, k, { c: 'ink', r: 3.5 });
      for (let k = 1; k <= Math.floor(tau + 1e-9); k++) f.dot(b * g * k, g * k, { c: 'c1', r: 3.5 });
      f.text(0, Dt, `t = ${fmt(Dt, 2)}`, { anchor: 'end', dx: -8, dy: 4, small: true });
      f.text(b * Dt, Dt, `τ = ${fmt(tau, 2)}`, { anchor: b > 0.5 ? 'end' : 'start', dx: b > 0.5 ? -12 : 12, dy: 4, small: true, c: 'c1' });
      f.handle(b * Dt, Dt, { c: 'c1', r: 7, label: T('End of the moving clock’s trip', '運動する時計の到達点'), bounds: [0, 0.99 * Rt, 1, Rt], onDrag: (x, y) => { const t = L.clamp(y, 1, 10); ctx.set('time', t, true); ctx.set('v', Math.min(0.99, x / t)); } });
      // clocks
      const s = L.stage(c2, { w: 100, h: 64, maxH: 300 });
      const dial = (cx, lab, frac, val, c) => {
        s.circle(cx, 34, 20, { c: 'ink', w: 1.6, fill: 'plate', fo: 1 });
        for (let k = 0; k < 12; k++) { const q = k / 12 * L.TAU; s.seg([cx + 17.5 * Math.sin(q), 34 + 17.5 * Math.cos(q)], [cx + 20 * Math.sin(q), 34 + 20 * Math.cos(q)], { c: 'muted', w: 1 }); }
        s.text(cx, 58, lab, { small: true, layer: 'main', dy: 4 });
        return (u) => {
          const a = Math.min(frac * u, 0.99999) * L.TAU;
          const pts = [[cx, 34]].concat(L.seq(61, (i) => { const q = a * i / 60; return [cx + 19 * Math.sin(q), 34 + 19 * Math.cos(q)]; }));
          if (a > 0.01) s.poly(pts, { c, fo: 0.3, w: 0, layer: 'over' });
          s.line([[cx, 34], [cx + 16 * Math.sin(a), 34 + 16 * Math.cos(a)]], { c, w: 3, layer: 'over' });
          s.text(cx, 8, `${val} = ${fmt(frac * u * Dt, 2)}`, { small: true, c, layer: 'over', dy: 4 });
        };
      };
      const dA = dial(26, T('clock at rest', '静止した時計'), 1, 't', 'ink');
      const dB = dial(74, T(`clock moving at ${fmt(b, 2)}c`, `${fmt(b, 2)}c で動く時計`), 1 / g, 'τ', 'c1');
      f.layers.anim = f.group('over');
      const DUR = 3.5;
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        const u = Math.min(1, t / DUR);
        s.clear('over'); f.clear('anim');
        dA(u); dB(u);
        if (u < 1) { f.line([[-xr, u * Dt], [2 * xr, u * Dt]], { c: 'muted', w: 1, dash: '2 3', layer: 'anim' }); f.dot(0, u * Dt, { c: 'ink', r: 5.5, layer: 'anim' }); f.dot(b * u * Dt, u * Dt, { c: 'hl', r: 6.5, layer: 'anim' }); }
        label.textContent = u < 1 ? `t = ${fmt(u * Dt, 2)}` : '';
        return u < 1;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Run both clocks', '2つの時計を動かす') });
      L.legend(ctx.host, [{ c: 'ink', label: T('clock at rest, ticks every unit of t', '静止した時計（t の1単位ごとの目盛り）') }, { c: 'c1', label: T('moving clock, ticks every unit of its own τ', '運動する時計（自分の τ の1単位ごとの目盛り）') }, { c: 'c3', dash: true, label: T('hyperbolae (ct)² − x² = τ²: equal proper time', '双曲線 (ct)² − x² = τ²（固有時が等しい）') }]);
      ctx.readout([{ k: 'γ', v: fmt(g, 4) }, { k: 'Δt', v: fmt(Dt, 3) }, { k: 'Δτ = Δt/γ', v: fmt(tau, 3), tone: 'key' }, { k: T('distance vΔt', '距離 vΔt'), v: fmt(b * Dt, 3) }],
        T('Each tick of the moving clock sits on the same hyperbola as the matching tick of the resting clock, higher up the page: the interval, not the coordinate time, is what a clock measures. Drag the blue end point.', '運動する時計の各目盛りは、静止した時計の対応する目盛りと同じ双曲線上の、より上の位置にあります。時計が測るのは座標時間ではなく時空間隔です。青の終点をドラッグできます。'));
    },
  };

  /* ---------- 3. The twin paradox ---------- */
  D.twin = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const b = v.v, TT = v.time, g = gam(b), half = TT / 2, Dd = b * half, tauT = TT / g;
      const t1 = half * (1 - b * b), t2 = half * (1 + b * b);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Worldlines in the home frame (years and light years)', '地球の系での世界線（年と光年）'));
      const xr = Math.max(Dd * 1.3, TT * 0.3);
      const f = L.fig(c1, { x: [-0.45 * xr, xr], y: [0, TT * 1.04], equal: true, maxH: 470, xlabel: T('x (light years)', 'x（光年）'), ylabel: T('t (years)', 't（年）') });
      f.line([[0, 0], [TT, TT]], { c: 'hl', w: 1.2, dash: '6 4', op: 0.8 });
      // lines of simultaneity of the traveller at the turnaround
      f.line([[-xr, t1 - b * xr], [Dd, half]], { c: 'c2', w: 1.6, dash: '5 3' });
      f.line([[-xr, t2 + b * xr], [Dd, half]], { c: 'c4', w: 1.6, dash: '5 3' });
      f.seg([0, t1], [0, t2], { c: 'c2', w: 7, op: 0.35 });
      f.text(0, (t1 + t2) / 2, T(`jump ${fmt(t2 - t1, 2)} yr`, `飛び ${fmt(t2 - t1, 2)} 年`), { anchor: 'end', dx: -9, dy: 4, small: true, c: 'c2' });
      // worldlines and yearly ticks
      f.line([[0, 0], [0, TT]], { c: 'ink', w: 3 });
      f.line([[0, 0], [Dd, half], [0, TT]], { c: 'c1', w: 3 });
      for (let k = 1; k < TT - 1e-9; k++) f.dot(0, k, { c: 'ink', r: 3 });
      for (let k = 1; k < tauT - 1e-9; k++) { const tt = k * g; const x = tt <= half ? b * tt : b * (TT - tt); f.dot(x, tt, { c: 'c1', r: 3 }); }
      f.text(Dd, half, T(`turn at ${fmt(Dd, 2)} ly`, `折り返し ${fmt(Dd, 2)} 光年`), { anchor: Dd > 0.6 * xr ? 'end' : 'start', dx: Dd > 0.6 * xr ? -12 : 12, dy: Dd > 0.6 * xr ? -12 : 4, small: true, c: 'c1' });
      f.handle(Dd, half, { c: 'c1', r: 8, label: T('Turnaround event', '折り返しの事象'), bounds: [0.05, xr * 1.5, 1, 10], onDrag: (x, y) => { const h = L.clamp(y, 1, 10); ctx.set('time', 2 * h, true); ctx.set('v', L.clamp(x / h, 0.1, 0.95)); } });
      // right: bookkeeping bars
      L.h('p', 'lab-cap', c2, T('Two ways to add up the home twin’s age at the reunion', '再会時の地球側の年齢を数える2つの方法'));
      const bars = L.fig(c2, { x: [-0.02 * TT, TT * 1.02], y: [0.25, 4.3], axes: false, aspect: 0.62, maxH: 280 });
      const seg = (y, x0, w, c, fo, lab) => { bars.rect(x0, y, w, 0.55, { c, fo, w: 1 }); if (lab) bars.text(x0 + w / 2, y + 0.275, lab, { small: true, dy: 1, layer: 'main' }); };
      const fits = (w, lab) => w / TT * 300 > lab.length * 6.5;
      bars.text(0, 4.05, T('home clock, read at home', '地球の時計（地球で読む）'), { anchor: 'start', small: true, dy: 4, layer: 'main' });
      seg(3.2, 0, TT, 'ink', 0.14, `${fmt(TT, 2)} ${T('yr', '年')}`);
      bars.text(0, 2.75, T('home clock, as the traveller reckons it', '地球の時計（旅行者の計算）'), { anchor: 'start', small: true, dy: 4, layer: 'main' });
      const lab1 = `${T('out', '往路')} ${fmt(t1, 1)}`, lab2 = `${T('jump', '飛び')} ${fmt(t2 - t1, 1)}`;
      seg(1.9, 0, t1, 'c2', 0.3, fits(t1, lab1) ? lab1 : '');
      seg(1.9, t1, t2 - t1, 'hl', 0.45, fits(t2 - t1, lab2) ? lab2 : (fits(t2 - t1, 'jump') ? T('jump', '飛び') : ''));
      seg(1.9, t2, t1, 'c4', 0.3, fits(t1, lab1) ? `${T('back', '復路')} ${fmt(t1, 1)}` : '');
      bars.text(0, 1.45, T('traveller clock', '旅行者の時計'), { anchor: 'start', small: true, dy: 4, layer: 'main', c: 'c1' });
      seg(0.6, 0, tauT, 'c1', 0.3, `${fmt(tauT, 2)} ${T('yr', '年')}`);
      f.layers.anim = f.group('over');
      const DUR = 4;
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        const u = Math.min(1, t / DUR), th = u * TT;
        f.clear('anim');
        const x = th <= half ? b * th : b * (TT - th);
        if (u < 1) {
          const seen = th <= half ? th - b * x : th + b * x;
          f.line([[x, th], [-xr, seen - (th <= half ? 1 : -1) * b * xr]], { c: th <= half ? 'c2' : 'c4', w: 2, layer: 'anim' });
          f.dot(0, seen, { c: th <= half ? 'c2' : 'c4', r: 4.5, layer: 'anim' });
          f.dot(0, th, { c: 'ink', r: 5.5, layer: 'anim' });
          f.dot(x, th, { c: 'hl', r: 6.5, layer: 'anim' });
          label.textContent = T(`home ${fmt(th, 1)} yr, traveller ${fmt(th / g, 1)} yr`, `地球 ${fmt(th, 1)} 年、旅行者 ${fmt(th / g, 1)} 年`);
        } else label.textContent = '';
        return u < 1;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play the trip', '旅を再生') });
      L.legend(ctx.host, [{ c: 'ink', label: T('home twin, dot every year', '地球に残る双子（1年ごとの点）') }, { c: 'c1', label: T('traveller, dot every year of own time', '旅行する双子（自分の1年ごとの点）') }, { c: 'c2', dash: true, label: T('traveller’s “now” going out', '往路の旅行者の「今」') }, { c: 'c4', dash: true, label: T('traveller’s “now” coming back', '復路の旅行者の「今」') }]);
      ctx.readout([{ k: 'γ', v: fmt(g, 4) }, { k: T('home twin ages', '地球側の経過'), v: `${fmt(TT, 3)}${T(' yr', ' 年')}` }, { k: T('traveller ages T/γ', '旅行者の経過 T/γ'), v: `${fmt(tauT, 3)}${T(' yr', ' 年')}`, tone: 'key' }, { k: T('difference', '差'), v: `${fmt(TT - tauT, 3)}${T(' yr', ' 年')}` }, { k: T('jump at turnaround v²T', '折り返しでの飛び v²T'), v: `${fmt(b * b * TT, 3)}${T(' yr', ' 年')}` }],
        T('Drag the turnaround. On each leg the traveller sees the home clock run slow by 1/γ, yet it wins: turning round swings the traveller’s line of “now” across the home worldline, skipping v²T years.', '折り返し点をドラッグできます。どちらの行程でも旅行者には地球の時計が 1/γ 倍に遅れて見えますが、それでも地球側が年を取ります。向きを変えると旅行者の「今」の線が地球の世界線を横切って振れ、v²T 年分を飛び越えるからです。'));
    },
  };
})();
