'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  D['electric-field'] = {
    render(ctx, v) {
      const st = ctx.state;
      st.pos ||= [[-0.8, 0], [0.8, 0]];
      const q = [v.q1, v.q2];
      const f = L.fig(ctx.host, { x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, maxH: 480, grid: false });
      const charges = st.pos.map((p, i) => ({ p, q: q[i] }));
      const soft = 0.04;
      const phi = (x, y) => charges.reduce((s, c) => s + c.q / Math.sqrt((x - c.p[0]) ** 2 + (y - c.p[1]) ** 2 + soft), 0);
      const E = (x, y) => charges.reduce((s, c) => { const dx = x - c.p[0], dy = y - c.p[1], r3 = Math.pow(dx * dx + dy * dy + soft, 1.5); return [s[0] + c.q * dx / r3, s[1] + c.q * dy / r3]; }, [0, 0]);
      const cm = L.cmaps.div, col = L.colours();
      // potential as colour, equipotentials as thin dark bands
      f.raster((x, y) => {
        const u = phi(x, y), s = Math.sign(u) * (1 - Math.exp(-Math.abs(u) / 1.2));
        const c = cm(s * 0.85);
        const band = Math.abs(((u * 2.5) % 1 + 1) % 1 - 0.5);
        const k = band > 0.47 ? 0.72 : 1;
        return [c[0] * k + col.ink[0] * (1 - k) * 0.4, c[1] * k + col.ink[1] * (1 - k) * 0.4, c[2] * k + col.ink[2] * (1 - k) * 0.4];
      }, { res: 2 });
      // field lines seeded around the charges that emit them
      const seeds = [];
      const emit = charges.some((c) => c.q > 0) ? charges.filter((c) => c.q > 0) : charges.filter((c) => c.q < 0);
      const sign = charges.some((c) => c.q > 0) ? 1 : -1;
      emit.forEach((c) => { const n = Math.max(6, Math.round(10 * Math.abs(c.q))); for (let k = 0; k < n; k++) { const th = (k + 0.5) / n * L.TAU; seeds.push([c.p[0] + 0.09 * Math.cos(th), c.p[1] + 0.09 * Math.sin(th)]); } });
      if (emit.length) f.stream((x, y) => { const e = E(x, y); return [sign * e[0], sign * e[1]]; }, seeds, { both: false, c: 'ink', w: 1.2, op: 0.55, h: 0.012, steps: 700, stop: (p) => charges.some((c) => c.q * sign < 0 && Math.hypot(p[0] - c.p[0], p[1] - c.p[1]) < 0.07) });
      charges.forEach((c, i) => {
        const tone = c.q > 0 ? 'pos' : c.q < 0 ? 'neg' : 'muted';
        f.handle(c.p[0], c.p[1], { c: tone, r: 11, label: T(`Charge ${i + 1}`, `電荷${i + 1}`), bounds: [-2.2, 2.2, -1.4, 1.4], onDrag: (x, y) => { st.pos[i] = [x, y]; ctx.redraw(); } });
        f.text(c.p[0], c.p[1], c.q > 0 ? '+' : c.q < 0 ? '−' : '0', { dy: 5, c: 'plate' });
      });
      f.hover((x, y) => { const e = E(x, y); return { text: `V ∝ ${fmt(phi(x, y), 2)}   |E| ∝ ${fmt(Math.hypot(...e), 2)}` }; });
      L.legend(ctx.host, [{ kind: 'fill', c: 'pos', label: T('positive potential', '正の電位') }, { kind: 'fill', c: 'neg', label: T('negative potential', '負の電位') }, { c: 'ink', label: T('field lines', '電気力線') }]);
      const total = v.q1 + v.q2, d = Math.hypot(st.pos[0][0] - st.pos[1][0], st.pos[0][1] - st.pos[1][1]);
      const force = v.q1 * v.q2 / (d * d);
      ctx.readout([{ k: T('net charge', '総電荷'), v: fmt(total, 2), tone: 'key' }, { k: T('separation', '距離'), v: fmt(d, 2) }, { k: T('force between them', '互いの力'), v: `${fmt(Math.abs(force), 3)} ${force < 0 ? T('attract', '引力') : force > 0 ? T('repel', '斥力') : ''}` }], T('Drag either charge. Bands are equipotentials; lines leave positive charge and end on negative.', 'どちらの電荷もドラッグできます。帯は等電位線、力線は正電荷から出て負電荷で終わります。'));
    },
  };

  D.lorentz = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const w = v.b, r = 1 / w, vz = v.vz, TT = 2 * Math.PI / w;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Looking down the field B (out of the page)', '磁場 B に沿って見下ろす（紙面から手前向き）'));
      L.h('p', 'lab-cap', c2, T('Side view: the drift along B', '横から：B 方向への移動'));
      const top = L.fig(c1, { x: [-5.4, 5.4], y: [-5.4, 5.4], equal: true, maxH: 340 });
      const zr = Math.max(4, Math.abs(vz) * TT * 3.2);
      const side = L.fig(c2, { x: [-5.4, 5.4], y: [-zr, zr], aspect: 0.8, maxH: 340, xlabel: 'x', ylabel: 'z' });
      // B-field symbols
      for (let x = -4.5; x <= 4.6; x += 1.5) for (let y = -4.5; y <= 4.6; y += 1.5) top.circle(x, y, 0.09, { c: 'muted', fill: true, fo: 0.6, w: 0.8, layer: 'under' });
      const pos = (t) => [r * Math.sin(w * t) - 0 + 0, -r * Math.cos(w * t) + r, vz * t];
      const center = [0, r];
      top.circle(center[0], center[1], r, { c: 'c1', w: 1.4, dash: '4 4', op: 0.7 });
      side.line(L.sample(-3 * TT, 3 * TT, 600, (t) => [pos(t)[0], pos(t)[2] - 0]), { c: 'c1', w: 1.4, op: 0.5 });
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        top.clear('over'); side.clear('over');
        const tt = (t % (3 * TT)) - 1.5 * TT, p = pos(tt), vx = Math.cos(w * tt), vy = Math.sin(w * tt);
        top.arrow([p[0], p[1]], [p[0] + vx * 1.3, p[1] + vy * 1.3], { c: 'c3', w: 2.4, layer: 'over' });
        top.arrow([p[0], p[1]], [p[0] + (center[0] - p[0]) * 0.8 / r * Math.min(r, 1.4), p[1] + (center[1] - p[1]) * 0.8 / r * Math.min(r, 1.4)], { c: 'c2', w: 2.4, layer: 'over' });
        top.dot(p[0], p[1], { c: 'hl', r: 6.5 });
        side.dot(p[0], p[2], { c: 'hl', r: 6.5 });
        if (Math.abs(vz) > 1e-6) side.arrow([p[0], p[2]], [p[0], p[2] + Math.sign(vz) * zr * 0.18], { c: 'c4', w: 2, layer: 'over' });
      }, { autoplay: true });
      L.legend(ctx.host, [{ c: 'c3', label: T('velocity v⊥', '速度 v⊥') }, { c: 'c2', label: T('force qv × B, always toward the centre', '力 qv × B（常に中心向き）') }, { c: 'c4', label: T('parallel velocity, untouched by B', '平行速度（B の影響を受けない）') }]);
      ctx.readout([{ k: T('Larmor radius r = mv⊥/qB', 'ラーマー半径 r = mv⊥/qB'), v: fmt(r, 3), tone: 'key' }, { k: T('period 2πm/qB', '周期 2πm/qB'), v: fmt(TT, 3) }, { k: T('pitch', 'ピッチ'), v: fmt(Math.abs(vz) * TT, 3) }], T('Units with q = m = |v⊥| = 1. Stronger B means a tighter, faster circle; the speed never changes.', 'q = m = |v⊥| = 1 の単位。B が強いほど円は小さく速くなるが、速さは変わりません。'));
    },
  };

  D.induction = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const speed = v.speed;
      const flux = (x) => 1 / Math.pow(1 + x * x, 1.5);
      const dflux = (x) => -3 * x / Math.pow(1 + x * x, 2.5);
      const emf = (x) => -dflux(x) * speed; // magnet moving in +x with speed
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A bar magnet moves along the axis of a loop', '棒磁石がループの軸に沿って動く'));
      L.h('p', 'lab-cap', c2, T('Flux through the loop and the induced emf', 'ループを貫く磁束と誘導起電力'));
      const s = L.fig(c1, { x: [-3, 3], y: [-1.7, 1.7], equal: true, maxH: 300, axes: false });
      const g = L.fig(c2, { x: [-3, 3], y: [-1.6, 1.6], aspect: 0.62, maxH: 300, xlabel: T('magnet position', '磁石の位置') });
      g.line(L.sample(-3, 3, 300, flux), { c: 'c1', w: 2.2 });
      g.line(L.sample(-3, 3, 300, (x) => emf(x) / Math.max(1, speed * 1.2)), { c: 'c2', w: 2.2 });
      g.text(-2.9, 0.95, 'Φ', { anchor: 'start', c: 'c1', math: true });
      g.text(-2.9, -1.1, T('ℰ (scaled)', 'ℰ（縮尺）'), { anchor: 'start', c: 'c2', small: true });
      const draw = (x) => {
        s.clear('main'); s.clear('over'); g.clear('over');
        // loop seen edge-on as an ellipse at x = 0
        s.circle(0, 0, 0, { c: 'muted' });
        const e = emf(x);
        s.line(L.seq(61, (i) => { const th = i / 60 * L.TAU; return [0.18 * Math.cos(th), 1.05 * Math.sin(th)]; }), { c: 'ink', w: 3 });
        // field lines of the magnet (dipole-like, drawn schematically)
        for (const k of [0.35, 0.7, 1.1]) s.line(L.seq(81, (i) => { const th = i / 80 * Math.PI; return [x + 1.6 * k * 1.9 * Math.sin(th) * Math.cos(th) * 1.1 + 0, 1.6 * k * Math.sin(th) ** 2 * 0.9]; }), { c: 'c1', w: 1, op: 0.45 });
        for (const k of [0.35, 0.7, 1.1]) s.line(L.seq(81, (i) => { const th = i / 80 * Math.PI; return [x + 1.6 * k * 1.9 * Math.sin(th) * Math.cos(th) * 1.1, -1.6 * k * Math.sin(th) ** 2 * 0.9]; }), { c: 'c1', w: 1, op: 0.45 });
        s.rect(x - 0.6, -0.2, 0.6, 0.4, { c: 'c2', fo: 0.9, nostroke: true });
        s.rect(x, -0.2, 0.6, 0.4, { c: 'c1', fo: 0.9, nostroke: true });
        s.text(x + 0.3, 0, 'N', { dy: 4, c: 'plate', small: true });
        s.text(x - 0.3, 0, 'S', { dy: 4, c: 'plate', small: true });
        // current direction arrow on the loop (sign of emf)
        if (Math.abs(e) > 0.02) {
          const up = e > 0;
          s.arrow([0.18 * 0.2, up ? -0.4 : 0.4], [0.18 * 0.2, up ? 0.4 : -0.4], { c: 'hl', w: 2 + 3 * Math.min(1, Math.abs(e) / speed), layer: 'over' });
        }
        s.arrow([x, 1.35], [x + 0.9 * Math.sign(speed), 1.35], { c: 'muted', w: 1.6 });
        g.dot(x, flux(x), { c: 'c1' });
        g.dot(x, emf(x) / Math.max(1, speed * 1.2), { c: 'c2' });
        g.vline(x, { c: 'hl', dash: '2 3', w: 1.2, layer: 'over' });
        ctx.readout([{ k: 'Φ', v: fmt(flux(x), 3) }, { k: 'ℰ = −dΦ/dt', v: fmt(e, 3), tone: 'key' }, { k: T('current', '電流'), v: Math.abs(e) < 0.02 ? T('none', 'なし') : e > 0 ? T('one way', '一方向') : T('reversed', '逆方向') }], T('The emf is largest where the flux changes fastest, not where the flux is largest, and it flips sign as the magnet passes the loop.', '起電力が最大になるのは磁束が最も速く変わる所で、磁束が最大の所ではありません。磁石がループを通過すると符号が反転します。'));
      };
      let x0 = v.position;
      ctx.state.anim = L.animator(ctx.host, (dt, t) => {
        if (t === 0) { draw(x0); return; }
        const x = ((x0 + 3 + speed * t) % 6) - 3;
        draw(x);
      }, { autoplay: false, playLabel: T('Sweep the magnet', '磁石を動かす') });
      L.legend(ctx.host, [{ c: 'c1', label: T('flux Φ through the loop', 'ループを貫く磁束 Φ') }, { c: 'c2', label: T('induced emf ℰ', '誘導起電力 ℰ') }, { c: 'hl', label: T('induced current', '誘導電流') }]);
    },
  };
})();
