'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  /* ---------- 1. Debye screening ---------- */
  D.debye = {
    render(ctx, v) {
      const st = ctx.state, lam = v.length, q = v.charge;
      st.r ??= 1.5;
      const rp = st.r;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Net charge of the plasma around a positive test charge', '正の試験電荷のまわりのプラズマの正味の電荷'));
      L.h('p', 'lab-cap', c2, T('Potential and the charge it encloses, against distance r', '距離 r に対するポテンシャルと内側の電荷'));
      const R = 3.2;
      const f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, axes: false, maxH: 360 });
      const cm = L.cmaps.div;
      f.raster((x, y) => { const r = Math.hypot(x, y) + 1e-3; const rho = q * Math.exp(-r / lam) / (r * lam * lam); return cm(-Math.tanh(0.45 * rho)); }, { res: 2 });
      f.circle(0, 0, lam, { c: 'ink', w: 1.6, dash: '5 4' });
      f.text(lam * Math.SQRT1_2, lam * Math.SQRT1_2, 'λD', { dx: 8, dy: -4 });
      f.circle(0, 0, rp, { c: 'hl', w: 2.2 });
      f.dot(0, 0, { c: 'pos', r: 9 });
      f.text(0, 0, '+', { c: 'plate', dy: 5 });
      // right: potentials
      const rM = 5, yM = 4;
      const g = L.fig(c2, { x: [0, rM], y: [0, yM], aspect: 0.85, maxH: 360, xlabel: 'r', ylabel: 'φ' });
      g.line(L.sample(0.02, rM, 300, (r) => q / r), { c: 'c2', w: 1.8, dash: '6 4' });
      g.area(L.sample(0.02, rM, 300, (r) => Math.min(yM * 2, q * Math.exp(-r / lam) / r)), { c: 'c1', fo: 0.14 });
      g.line(L.sample(0.02, rM, 300, (r) => q * Math.exp(-r / lam) / r), { c: 'c1', w: 2.8 });
      g.line(L.sample(0, rM, 200, (r) => (1 + r / lam) * Math.exp(-r / lam)), { c: 'c3', w: 2 });
      g.vline(lam, { c: 'ink', dash: '5 4' });
      g.text(lam, yM, 'λD', { dx: 6, dy: 16, anchor: 'start' });
      const phi = q * Math.exp(-rp / lam) / rp, enc = (1 + rp / lam) * Math.exp(-rp / lam);
      g.vline(rp, { c: 'hl', dash: '2 3', w: 1.4 });
      g.dot(rp, enc, { c: 'c3', r: 5 });
      if (phi < yM) g.dot(rp, phi, { c: 'c1', r: 5 });
      g.handle(rp, Math.min(yM - 0.15, Math.max(phi, 0.15)), { c: 'hl', r: 8, axis: 'x', bounds: [0.1, rM, 0, yM], snap: 0.05, label: T('Probe radius r', '調べる半径 r'), onDrag: (x) => { st.r = x; ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'c1', label: T('screened potential φ₀e^(−r/λD)/r', '遮蔽されたポテンシャル φ₀e^(−r/λD)/r') }, { c: 'c2', dash: true, label: T('bare Coulomb potential φ₀/r', '裸のクーロンポテンシャル φ₀/r') }, { c: 'c3', label: T('net charge inside r, as a fraction of q', '半径 r の内側の正味の電荷（q に対する割合）') }, { kind: 'fill', c: 'neg', label: T('negative screening cloud', '負の遮蔽雲') }, { c: 'hl', label: T('probe sphere', '調べる球面') }]);
      ctx.readout([{ k: 'λD', v: fmt(lam, 3) }, { k: 'r', v: fmt(rp, 3) }, { k: T('screening factor e^(−r/λD)', '遮蔽因子 e^(−r/λD)'), v: fmt(Math.exp(-rp / lam), 3), tone: 'key' }, { k: T('net charge inside r', 'r の内側の正味の電荷'), v: `${fmt(enc, 3)} q` }],
        T('Drag the gold handle. The cloud carries exactly −q in total, so from far away the test charge is hidden: inside r = λD it still shows 74 % of q, inside 3λD only 20 %.', '金色のハンドルをドラッグできます。雲は全体でちょうど −q を持つので、遠くからは試験電荷が見えなくなります。r = λD の内側ではまだ q の74 %が見えますが、3λD の内側では20 %だけです。'));
    },
  };

  /* ---------- 2. Cyclotron motion, B out of the page ---------- */
  D.cyclotron = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const w = v.ratio, sp = v.speed, sgn = Math.sign(w), aw = Math.abs(w), straight = aw < 1e-6;
      const rL = straight ? Infinity : sp / aw, TT = straight ? Infinity : 2 * Math.PI / aw;
      const R = 3.6;
      const f = L.fig(ctx.host, { x: [-R, R], y: [-R, R], equal: true, maxH: 460, xlabel: 'x', ylabel: 'y' });
      for (let x = -3; x <= 3.01; x += 1) for (let y = -3; y <= 3.01; y += 1) { f.circle(x, y, 0.1, { c: 'muted', w: 1, layer: 'under' }); f.dot(x, y, { c: 'muted', r: 1.6, layer: 'under' }); }
      // q > 0 with B along +z gyrates clockwise, centre below a particle moving in +x
      const y0 = straight ? 0 : sgn * Math.min(rL, 2.8);
      const cen = straight ? null : [0, y0 - sgn * rL];
      const pos = (t) => straight ? [-R + ((sp * t) % (2 * R)), 0] : [sp / w * Math.sin(w * t), y0 + sp / w * (Math.cos(w * t) - 1)];
      const vel = (t) => straight ? [sp, 0] : [sp * Math.cos(w * t), -sp * Math.sin(w * t)];
      if (!straight) {
        f.circle(cen[0], cen[1], rL, { c: 'c1', w: 2, op: 0.9 });
        f.circle(cen[0], y0 + sgn * rL, rL, { c: 'muted', w: 1.2, dash: '4 4', op: 0.8 });
        f.dot(cen[0], cen[1], { c: 'c1', r: 3.5, layer: 'main' });
        f.text(cen[0], cen[1], T('guiding centre', '案内中心'), { small: true, dy: 16, c: 'c1', layer: 'main' });
        // rotation sense arrow
        const rr = Math.min(rL * 0.55, 1.1) / rL;
        const arc = L.sample(0.08 * TT, 0.3 * TT, 30, (t) => { const p = pos(t); return [cen[0] + rr * (p[0] - cen[0]), cen[1] + rr * (p[1] - cen[1])]; });
        f.line(arc, { c: 'c1', w: 1.8, arrow: true });
      } else f.line([[-R, 0], [R, 0]], { c: 'c1', w: 2 });
      f.layers.anim = f.group('over');
      const DUR = straight ? 2 * R / sp : TT;
      st.t ??= 0.35 * (Number.isFinite(TT) ? TT : 1);
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        st.t = t; const tt = t * 1.2;
        f.clear('anim');
        const p = pos(tt), u = vel(tt), s = 0.6;
        f.arrow(p, [p[0] + u[0] * s, p[1] + u[1] * s], { c: 'c3', w: 2.6, layer: 'anim' });
        if (!straight) { const fx = cen[0] - p[0], fy = cen[1] - p[1], m = Math.hypot(fx, fy) || 1, len = 0.35 + 0.35 * aw * sp / 2; f.arrow(p, [p[0] + fx / m * len, p[1] + fy / m * len], { c: 'c2', w: 2.6, layer: 'anim' }); }
        f.dot(p[0], p[1], { c: 'hl', r: 7, layer: 'anim' });
        label.textContent = Number.isFinite(TT) ? `t = ${fmt((tt % TT) / TT, 2)} T` : '';
      }, { autoplay: true, initialT: st.t, playLabel: T('Play', '再生') });
      void DUR;
      L.legend(ctx.host, [{ c: 'c1', label: T('orbit of this particle', 'この粒子の軌道') }, { c: 'muted', dash: true, label: T('same particle with the opposite charge', '電荷の符号だけ逆の粒子') }, { c: 'c3', label: T('velocity v', '速度 v') }, { c: 'c2', label: T('force qv × B, toward the centre', '力 qv × B（中心向き）') }]);
      ctx.readout([{ k: T('cyclotron frequency ω = qB/m', 'サイクロトロン角振動数 ω = qB/m'), v: fmt(w, 3) }, { k: T('Larmor radius v⊥/|ω|', 'ラーマー半径 v⊥/|ω|'), v: straight ? '∞' : fmt(rL, 3), tone: 'key' }, { k: T('period 2π/|ω|', '周期 2π/|ω|'), v: straight ? '∞' : fmt(TT, 3) }, { k: T('sense seen from +B', '+B 側から見た向き'), v: straight ? T('no turning', '曲がらない') : sgn > 0 ? T('clockwise', '時計回り') : T('counterclockwise', '反時計回り') }],
        T('B points out of the page (dots), B = 1. Positive charges circle clockwise, negative ones counterclockwise; the radius depends only on |q|/m and v⊥, and the speed never changes.', 'B は紙面から手前向き（点）で B = 1 とします。正電荷は時計回り、負電荷は反時計回りに回ります。半径は |q|/m と v⊥ だけで決まり、速さは変わりません。'));
    },
  };

  /* ---------- 3. Dispersion ω² = ωp² + c²k² ---------- */
  D.dispersion = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const wp = v.frequency, c = v.speed, k = v.k;
      const om = (kk) => Math.sqrt(wp * wp + c * c * kk * kk);
      const w0 = om(k), vph = w0 / k, vg = c * c * k / w0;
      const kM = 4, yM = om(kM) * 1.08;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Dispersion diagram: drag the point along the branch', '分散図：点を分枝に沿ってドラッグします'));
      L.h('p', 'lab-cap', c2, T('The wave in space: crests move at the phase velocity, the envelope at the group velocity', '空間での波：山は位相速度、包絡線は群速度で進みます'));
      const f = L.fig(c1, { x: [0, kM], y: [0, yM], aspect: 0.85, maxH: 380, xlabel: 'k', ylabel: 'ω' });
      f.rect(0, 0, kM, wp, { c: 'muted', fo: 0.14, nostroke: true, layer: 'under' });
      f.text(kM * 0.97, wp / 2, T('no propagation: ω < ωₚ', '伝播しない：ω < ωₚ'), { anchor: 'end', small: true, dy: 4, c: 'muted' });
      f.hline(wp, { c: 'muted', dash: '4 4' });
      f.text(0, wp, 'ωₚ', { anchor: 'start', dx: 6, dy: -6, small: true });
      f.line([[0, 0], [kM, c * kM]], { c: 'ink', w: 1.2, dash: '3 4' });
      const kl = Math.min(0.95 * kM, 0.9 * yM / c);
      f.text(kl, c * kl, T('light line ω = ck', '光線 ω = ck'), { anchor: 'end', dx: 2, dy: 18, small: true, c: 'muted' });
      f.line(L.sample(0, kM, 200, om), { c: 'c1', w: 2.8 });
      // phase velocity chord from the origin, group velocity tangent
      f.line([[0, 0], [k, w0]], { c: 'c2', w: 2 });
      const d = 0.9;
      f.line([[k - d, w0 - vg * d], [k + d, w0 + vg * d]], { c: 'c3', w: 2 });
      f.handle(k, w0, { c: 'hl', r: 8, axis: 'x', bounds: [0.5, kM, 0, yM], snap: 0.05, label: T('Wave number k', '波数 k'), onDrag: (x) => ctx.set('k', x) });
      // wave view
      const X = 40, sig = 4;
      const gw = L.fig(c2, { x: [0, X], y: [-1.3, 1.3], aspect: 0.85, maxH: 380, xlabel: 'x', grid: false, ticksY: [[-1, '−1'], [0, '0'], [1, '1']] });
      gw.layers.anim = gw.group('main');
      const x0 = 6, travel = X - 2 * x0;
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        st.t = t; const tt = t % (travel / vg);
        const xc = x0 + vg * tt;
        gw.clear('anim');
        const env = (x) => Math.exp(-((x - xc) ** 2) / (2 * sig * sig));
        gw.line(L.sample(0, X, 500, (x) => env(x) * Math.cos(k * (x - xc) - (w0 - k * vg) * tt)), { c: 'c1', w: 2, layer: 'anim' });
        gw.line(L.sample(0, X, 200, env), { c: 'c3', w: 1.4, dash: '4 3', layer: 'anim' });
        gw.line(L.sample(0, X, 200, (x) => -env(x)), { c: 'c3', w: 1.4, dash: '4 3', layer: 'anim' });
        // a crest: phase k x − ω t = 2πm; follow the crest nearest the envelope peak
        const ph = (w0 - k * vg) * tt; // the wave is env · cos(k(x − xc) − ph)
        const xcr = xc + (ph - 2 * Math.PI * Math.round(ph / (2 * Math.PI))) / k;
        gw.dot(xc, 1, { c: 'c3', r: 5.5, layer: 'anim' });
        gw.dot(xcr, env(xcr), { c: 'c2', r: 6, layer: 'anim' });
        label.textContent = `t = ${fmt(tt, 1)}`;
      }, { autoplay: true, initialT: st.t ?? (X / 2 - x0) / vg, playLabel: T('Play', '再生') });
      L.legend(ctx.host, [{ c: 'c1', label: T('branch ω(k), and the wave', '分枝 ω(k) と波') }, { c: 'c2', label: T('phase velocity ω/k (chord, and a crest)', '位相速度 ω/k（弦と波の山）') }, { c: 'c3', label: T('group velocity dω/dk (tangent, and the envelope)', '群速度 dω/dk（接線と包絡線）') }]);
      ctx.readout([{ k: 'ω', v: fmt(w0, 3) }, { k: T('phase velocity ω/k', '位相速度 ω/k'), v: fmt(vph, 3), tone: 'warn' }, { k: T('group velocity c²k/ω', '群速度 c²k/ω'), v: fmt(vg, 3), tone: 'good' }, { k: T('their product', '両者の積'), v: `${fmt(vph * vg, 3)} = c²` }, { k: T('refractive index ck/ω', '屈折率 ck/ω'), v: fmt(c * k / w0, 3) }],
        T('The crest (orange) runs through the envelope faster than c, while the envelope, which carries energy and information, moves slower than c. Near the cutoff the envelope almost stops.', '波の山（橙）は c より速く包絡線の中を走り抜けますが、エネルギーと情報を運ぶ包絡線は c より遅く進みます。カットオフの近くでは包絡線はほとんど止まります。'));
    },
  };
})();
