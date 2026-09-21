'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, SQ2 = Math.SQRT2;
  const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
  const deg = (r) => r * 180 / PI;

  /* ---------- 1. Particle in a box (units ħ = m = L = 1, so Eₙ = n²π²/2 = n²E₁) ---------- */
  const psi = (k, x) => SQ2 * Math.sin(k * PI * x);
  const En = (k) => k * k * PI * PI / 2;

  D.wavefunction = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const n = Math.round(v.n), sup = Math.round(v.mode) === 1;
      const ks = sup ? [n, n + 1] : [n];
      const cs = sup ? [1 / SQ2, 1 / SQ2] : [1];
      st.ab ||= [0.4, 0.6];
      const period = sup ? 2 * PI / (En(n + 1) - En(n)) : 2 * PI / En(n);

      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, sup ? T('Energy ladder: the two components, each turning at its own frequency Eₖ/ħ', 'エネルギー準位：2つの成分がそれぞれ Eₖ/ħ の角振動数で回ります') : T('Energy ladder: Re Ψ breathes at frequency Eₙ/ħ', 'エネルギー準位：Re Ψ は角振動数 Eₙ/ħ で振動します'));
      L.h('p', 'lab-cap', c2, T('Probability density |Ψ(x, t)|²', '確率密度 |Ψ(x, t)|²'));

      // Ladder
      const K = Math.max(3, Math.min(7, ks[ks.length - 1] + 1));
      const amp = (k) => 0.42 * (2 * k - 1) + 0.5;
      const top = K * K + amp(K) * (ks.includes(K) ? 1.12 : 0.6), bot = -0.07 * top;
      const lad = L.fig(c1, { x: [-0.08, 1.5], y: [bot, top], axes: false, aspect: 0.95, maxH: 380 });
      lad.line([[0, top], [0, 0], [1, 0], [1, top]], { c: 'ink', w: 3.5, layer: 'under' });
      for (let k = 1; k <= K; k++) {
        const on = ks.includes(k);
        lad.seg([0, En(k) / En(1)], [1, En(k) / En(1)], { c: on ? (k === n ? 'c1' : 'c4') : 'muted', w: on ? 1.4 : 1, dash: on ? '' : '3 4', op: on ? 0.8 : 0.6, layer: 'under' });
        if (on || 2 * k - 1 > top * 0.06 || k === 1) lad.text(1.05, k * k, `E${sub(k)} = ${k * k}E₁`, { anchor: 'start', small: true, dy: 4, c: on ? (k === n ? 'c1' : 'c4') : 'muted' });
      }
      lad.text(0.5, bot, 'V = 0', { small: true, dy: -3, c: 'muted' });

      // Density
      const ymax = sup ? 4.3 : 2.3;
      const g = L.fig(c2, { x: [0, 1], y: [0, ymax], aspect: 0.95, maxH: 380, xlabel: 'x / L', ylabel: '|Ψ|²' });
      const dens = (x, t) => {
        let re = 0, im = 0;
        ks.forEach((k, i) => { const a = cs[i] * psi(k, x); re += a * Math.cos(En(k) * t); im -= a * Math.sin(En(k) * t); });
        return re * re + im * im;
      };
      if (sup) g.line(L.sample(0, 1, 200, (x) => (psi(n, x) ** 2 + psi(n + 1, x) ** 2) / 2), { c: 'muted', w: 1.4, dash: '5 4', layer: 'under' });

      const prob = (a, b, t) => { const m = 200, h = (b - a) / m; if (h <= 0) return 0; let s = dens(a, t) + dens(b, t); for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * dens(a + i * h, t); return s * h / 3; };
      const draw = (t) => {
        lad.clear('main'); g.clear('main'); g.clear('over');
        // ladder curves
        ks.forEach((k, i) => {
          const c = i === 0 ? 'c1' : 'c4', y0 = k * k, A = amp(k);
          lad.line(L.sample(0, 1, 120, (x) => y0 - A * cs[i] * SQ2 / 2 * psi(k, x) * Math.sin(En(k) * t) / 1), { c, w: 1.2, dash: '3 3', op: 0.55 });
          lad.line(L.sample(0, 1, 120, (x) => y0 + A * cs[i] * SQ2 / 2 * psi(k, x) * Math.cos(En(k) * t)), { c, w: 2.6 });
        });
        // density
        const pts = L.sample(0, 1, 240, (x) => dens(x, t));
        g.area(pts, { c: 'c1', fo: 0.18, layer: 'main' });
        g.line(pts, { c: 'c1', w: 2.6 });
        const [a, b] = st.ab;
        g.area(L.sample(a, b, 120, (x) => dens(x, t)), { c: 'c2', fo: 0.4, layer: 'main' });
        if (!sup) for (let j = 1; j < n; j++) g.dot(j / n, 0, { c: 'c4', r: 5, hollow: true });
        if (!sup && n > 1) g.text(1 / n, 0, T('node', '節'), { small: true, dy: -12, c: 'c4' });
        let mx = 0; if (sup) { const m = 200; for (let i = 0; i <= m; i++) { const x = i / m; mx += x * dens(x, t) * (i === 0 || i === m ? 0.5 : 1) / m; } g.vline(mx, { c: 'hl', dash: '4 3', w: 1.6, layer: 'over' }); g.dot(mx, ymax * 0.93, { c: 'hl', r: 5.5 }); g.text(mx, ymax * 0.93, '⟨x⟩', { dx: 0, dy: -10, small: true }); }
        const P = prob(a, b, t);
        g.text((a + b) / 2, ymax * (sup ? 0.8 : 1), `P = ${fmt(P, 3)}`, { dy: sup ? 0 : 16, c: 'c2', small: true });
        const items = sup
          ? [{ k: '⟨E⟩', v: `${fmt((n * n + (n + 1) * (n + 1)) / 2, 3)} E₁` }, { k: T('beat period 2πħ/(Eₙ₊₁ − Eₙ)', 'うなりの周期 2πħ/(Eₙ₊₁ − Eₙ)'), v: `${fmt(4 / ((2 * n + 1) * PI), 3)} mL²/ħ` }, { k: '⟨x⟩ / L', v: fmt(mx, 3) }, { k: `P(${fmt(a, 2)} < x/L < ${fmt(b, 2)})`, v: fmt(P, 3), tone: 'key' }]
          : [{ k: `E${sub(n)} = n²E₁`, v: `${n * n} E₁` }, { k: T('nodes inside', '内部の節'), v: String(n - 1) }, { k: `P(${fmt(a, 2)} < x/L < ${fmt(b, 2)})`, v: fmt(P, 3), tone: 'key' }];
        ctx.readout(items, sup ? T('The density sloshes back and forth with the beat period; its time average is the dashed curve.', '密度はうなりの周期で左右に揺れ、その時間平均が破線です。') : T('The phase turns but |Ψ|² never changes: that is what stationary means. Drag the orange handles to integrate the density.', '位相は回りますが |Ψ|² は変わりません。これが定常の意味です。橙のハンドルで積分区間を動かせます。'));
      };
      st.t ??= 0;
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        st.t = t; const ts = t / 3 * period; draw(ts);
        label.textContent = `t = ${fmt(ts / period, 2)} × ${sup ? T('beat period', 'うなりの周期') : T('phase period', '位相の周期')}`;
      }, { autoplay: true, initialT: st.t, playLabel: T('Play time evolution', '時間発展を再生') });
      // interval handles
      [0, 1].forEach((i) => g.handle(st.ab[i], 0, { c: 'c2', r: 7, axis: 'x', bounds: [0, 1, 0, 0], snap: 0.01, label: i ? T('Right end of the interval', '区間の右端') : T('Left end of the interval', '区間の左端'), onDrag: (x) => { const ab = st.ab.slice(); ab[i] = x; if (ab[0] > ab[1]) ab.reverse(); st.ab = ab; ctx.redraw(); } }));
      L.legend(ctx.host, [{ c: 'c1', label: sup ? T(`ψ${sub(n)} component (Re solid, Im dashed)`, `ψ${sub(n)} 成分（実線 Re、破線 Im）`) : T('Re Ψ (solid) and Im Ψ (dashed)', 'Re Ψ（実線）と Im Ψ（破線）') }].concat(sup ? [{ c: 'c4', label: T(`ψ${sub(n + 1)} component`, `ψ${sub(n + 1)} 成分`) }, { c: 'muted', dash: true, label: T('time-averaged density', '時間平均した密度') }] : [{ kind: 'dot', c: 'c4', label: T('nodes, where |ψ|² = 0', '節（|ψ|² = 0 の点）') }]).concat([{ kind: 'fill', c: 'c2', label: T('probability of finding it in the interval', '区間内に見つかる確率') }]));
    },
  };

  /* ---------- 2. Gaussian packet: Δx·Δp (ħ = m = 1) ---------- */
  D.uncertainty = {
    render(ctx, v) {
      const st = ctx.state;
      st.anim?.stop();
      const s0 = v.width, sp = 1 / (2 * s0), tEnd = 4 * s0 * s0, DUR = 3.2;
      const sx = (t) => s0 * Math.sqrt(1 + (t / (2 * s0 * s0)) ** 2);
      const gauss = (x, s) => Math.exp(-x * x / (2 * s * s)) / (s * Math.sqrt(2 * PI));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Position density |ψ(x)|²', '位置の確率密度 |ψ(x)|²'));
      L.h('p', 'lab-cap', c2, T('Momentum density |φ(p)|²', '運動量の確率密度 |φ(p)|²'));
      const ymax = 1.22 * Math.max(gauss(0, s0), gauss(0, sp));
      const fx = L.fig(c1, { x: [-8, 8], y: [0, ymax], aspect: 0.62, maxH: 300, xlabel: 'x', ylabel: '|ψ|²' });
      const fp = L.fig(c2, { x: [-6, 6], y: [0, ymax], aspect: 0.62, maxH: 300, xlabel: 'p (ħ = 1)', ylabel: '|φ|²' });
      L.h('p', 'lab-cap', ctx.host, T('The (Δx, Δp) plane: the shaded region Δx·Δp < ħ/2 is forbidden', '(Δx, Δp) 平面：網掛けの領域 Δx·Δp < ħ/2 は禁止されています'));
      const fh = L.fig(ctx.host, { x: [0, 5], y: [0, 2.75], aspect: 0.34, minH: 180, maxH: 250, xlabel: 'Δx', ylabel: 'Δp' });
      fh.area(L.sample(0.18, 5, 200, (x) => Math.min(2.75, 0.5 / x)), { c: 'muted', fo: 0.22 });
      fh.line(L.sample(0.18, 5, 200, (x) => 0.5 / x), { c: 'ink', w: 1.6 });
      fh.text(4.9, 0.5 / 4.9, 'Δx·Δp = ħ/2', { anchor: 'end', dy: -8, small: true, layer: 'under' });
      fh.text(0.3, 0.2, T('forbidden', '禁止'), { anchor: 'start', small: true, layer: 'under' });
      // momentum density: unchanged by free motion
      const pp = L.sample(-6, 6, 240, (p) => gauss(p, sp));
      fp.area(L.sample(-sp, sp, 80, (p) => gauss(p, sp)), { c: 'c2', fo: 0.3 });
      fp.line(pp, { c: 'c2', w: 2.6 });
      const yp = gauss(sp, sp);
      fp.line([[-sp, yp], [sp, yp]], { c: 'ink', w: 1.4 });
      fp.text(-sp, yp, `2Δp = ${fmt(2 * sp, 2)}`, { anchor: 'end', dx: -8, dy: 4, small: true });
      const draw = (t) => {
        const s = sx(t);
        fx.clear('main'); fx.clear('over'); fh.clear('over'); fh.clear('main');
        fx.area(L.sample(-s, s, 80, (x) => gauss(x, s)), { c: 'c1', fo: 0.3, layer: 'main' });
        fx.line(L.sample(-8, 8, 260, (x) => gauss(x, s)), { c: 'c1', w: 2.6 });
        if (t > 0) fx.line(L.sample(-8, 8, 260, (x) => gauss(x, s0)), { c: 'c1', w: 1.2, dash: '4 4', op: 0.6 });
        const y = gauss(s, s);
        fx.line([[-s, y], [s, y]], { c: 'ink', w: 1.4 });
        fx.text(-s, y, `2Δx = ${fmt(2 * s, 2)}`, { anchor: 'end', dx: -8, dy: 4, small: true });
        if (t > 0) fh.line(L.sample(0, t, 40, (tt) => [sx(tt), sp]), { c: 'hl', w: 2, dash: '4 3' });
        fh.dot(s, sp, { c: 'hl', r: 6.5 });
        fh.text(s, sp, `(${fmt(s, 2)}, ${fmt(sp, 2)})`, { dx: s > 3.6 ? -10 : 10, dy: -9, small: true, anchor: s > 3.6 ? 'end' : 'start' });
        ctx.readout([{ k: 'Δx', v: fmt(s, 3) }, { k: 'Δp', v: fmt(sp, 3) }, { k: 'Δx·Δp', v: `${fmt(s * sp, 3)} ħ`, tone: s * sp < 0.5005 ? 'good' : 'key' }, { k: 't', v: fmt(t, 3) }], t < 1e-9 ? T('At t = 0 the Gaussian saturates the bound: Δx·Δp = ħ/2 exactly. Drag the blue handle to change Δx.', 't = 0 のガウス波束は下限にちょうど達し、Δx·Δp = ħ/2 です。青のハンドルで Δx を変えられます。') : T('Free motion leaves |φ(p)|² unchanged, while the packet spreads, so the product grows above ħ/2.', '自由運動では |φ(p)|² は変わらず、波束だけが広がるので、積は ħ/2 より大きくなります。'));
      };
      st.anim = L.animator(ctx.host, (dt, t, label) => {
        const u = Math.min(1, t / DUR), tt = u * tEnd;
        draw(tt);
        label.textContent = u > 0 ? `t = ${fmt(tt, 3)}` : '';
        return u < 1;
      }, { autoplay: false, once: true, duration: DUR, initialT: 0, playLabel: T('Let it spread freely', '自由に広がらせる') });
      fx.handle(s0, gauss(s0, s0), { c: 'c1', axis: 'x', bounds: [0.2, 2, 0, 3], snap: 0.05, label: T('Position width Δx', '位置の幅 Δx'), onDrag: (x) => ctx.set('width', x) });
      L.legend(ctx.host, [{ c: 'c1', label: T('position density, shaded ±Δx', '位置の密度（網掛けは ±Δx）') }, { c: 'c2', label: T('momentum density, shaded ±Δp', '運動量の密度（網掛けは ±Δp）') }, { kind: 'dot', c: 'hl', label: T('this packet', 'この波束') }]);
    },
  };

  /* ---------- 3. Bloch sphere, drawn in 2D with an orthographic camera ---------- */
  D.bloch = {
    render(ctx, v) {
      const st = ctx.state;
      st.view ||= { a: 0.52, e: 0.36 };
      const th = v.theta * PI / 180, ph = v.phi * PI / 180;
      const s = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
      const { a, e } = st.view;
      const R = [-Math.sin(a), Math.cos(a), 0], U = [-Math.cos(a) * Math.sin(e), -Math.sin(a) * Math.sin(e), Math.cos(e)], N = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
      const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
      const P = (p) => [dot3(p, R), dot3(p, U)], depth = (p) => dot3(p, N);

      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Drag the gold tip to set the state; drag anywhere else to turn the sphere', '金色の先端をドラッグして状態を決め、それ以外の場所をドラッグすると球を回せます'));
      const f = L.fig(c1, { x: [-1.5, 1.5], y: [-1.42, 1.42], equal: true, axes: false, maxH: 420 });
      f.svg.style.cursor = 'grab'; f.svg.style.touchAction = 'none';
      // wireframe: split each circle into front (solid) and back (faint dashed) runs
      const curve = (pts, o, oBack) => {
        let run = [], front = null;
        const flush = () => { if (run.length > 1) f.line(run, front ? o : oBack); };
        pts.forEach((p) => { const fr = depth(p) >= 0; if (front !== null && fr !== front) { const last = run[run.length - 1]; flush(); run = [last]; } front = fr; run.push(P(p)); });
        flush();
      };
      const back = { c: 'muted', w: 0.8, dash: '2 4', op: 0.55, layer: 'under' };
      for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = Math.sin(la), r = Math.cos(la); curve(L.seq(97, (i) => { const q = L.TAU * i / 96; return [r * Math.cos(q), r * Math.sin(q), z]; }), { c: k === 0 ? 'ink' : 'muted', w: k === 0 ? 1.3 : 0.9, op: k === 0 ? 0.7 : 0.6, layer: 'under' }, back); }
      for (let k = 0; k < 6; k++) { const lo = k * PI / 6; curve(L.seq(97, (i) => { const q = L.TAU * i / 96; return [Math.cos(q) * Math.cos(lo), Math.cos(q) * Math.sin(lo), Math.sin(q)]; }), { c: 'muted', w: 0.9, op: 0.6, layer: 'under' }, back); }
      f.circle(0, 0, 1, { c: 'ink', w: 1.4, op: 0.8, fill: 'plate', fo: 0 });
      // axes
      const axes = [[[1, 0, 0], '|+⟩', 'x'], [[0, 1, 0], '|+i⟩', 'y'], [[0, 0, 1], '|0⟩', 'z'], [[0, 0, -1], '|1⟩', ''], [[-1, 0, 0], '|−⟩', ''], [[0, -1, 0], '|−i⟩', '']];
      axes.forEach(([p, ket, name]) => {
        const q = P(p), fr = depth(p) >= -1e-9;
        f.line([[0, 0], P(p.map((x) => x * 1.18))], { c: 'ink', w: name ? 1.3 : 1, op: fr ? 0.75 : 0.35, dash: name ? '' : '3 3' });
        const off = P(p.map((x) => x * 1.32)), len = Math.hypot(q[0], q[1]);
        if (len > 0.25 || p[2] !== 0) f.text(off[0], off[1], ket, { small: true, dy: 4, c: fr ? 'ink' : 'muted' });
        if (name && (len > 0.25 || p[2] !== 0)) { const e2 = P(p.map((x) => x * 1.12)); f.text(e2[0], e2[1], name, { math: true, small: true, dx: 9, dy: -4, c: 'muted' }); }
      });
      // angle arcs: θ from z to the state, φ in the equator from x to the projection
      const sp = Math.hypot(s[0], s[1]);
      if (th > 0.02) curve(L.seq(41, (i) => { const q = th * i / 40; return [0.38 * Math.sin(q) * Math.cos(ph), 0.38 * Math.sin(q) * Math.sin(ph), 0.38 * Math.cos(q)]; }), { c: 'c1', w: 2 }, { c: 'c1', w: 1.4, dash: '3 3' });
      if (sp > 0.02 && Math.abs(ph) > 0.02) curve(L.seq(41, (i) => { const q = ph * i / 40; return [0.3 * Math.cos(q), 0.3 * Math.sin(q), 0]; }), { c: 'c2', w: 2 }, { c: 'c2', w: 1.4, dash: '3 3' });
      const mid = (q) => P(q);
      if (th > 0.15) { const m = mid([0.5 * Math.sin(th / 2) * Math.cos(ph), 0.5 * Math.sin(th / 2) * Math.sin(ph), 0.5 * Math.cos(th / 2)]); f.text(m[0], m[1], 'θ', { math: true, c: 'c1', dy: 4, dx: 8 }); }
      if (sp > 0.1 && Math.abs(ph) > 0.2) { const m = mid([0.42 * Math.cos(ph / 2), 0.42 * Math.sin(ph / 2), 0]); f.text(m[0], m[1], 'φ', { math: true, c: 'c2', dy: 5 }); }
      // projections of the state vector
      const foot = [s[0], s[1], 0];
      f.line([P(s), P(foot)], { c: 'c4', w: 1.6, dash: '4 3' });
      f.line([[0, 0], P(foot)], { c: 'c4', w: 1.6, dash: '4 3' });
      f.line([P(s), P([0, 0, s[2]])], { c: 'c4', w: 1.2, dash: '2 3', op: 0.8 });
      f.dot(...P(foot), { c: 'c4', r: 3.5 });
      f.dot(...P([0, 0, s[2]]), { c: 'c4', r: 3.5 });
      const tipFront = depth(s) >= 0;
      f.arrow([0, 0], P(s), { c: 'hl', w: 3.4, op: tipFront ? 1 : 0.6, layer: 'over' });
      f.dot(0, 0, { c: 'ink', r: 2.5 });
      f.handle(...P(s), { c: 'hl', r: 8, label: T('State on the Bloch sphere', 'ブロッホ球上の状態'), bounds: [-1.5, 1.5, -1.5, 1.5], onDrag: (x, y) => {
        let r2 = x * x + y * y; if (r2 > 1) { const k = 1 / Math.sqrt(r2); x *= k; y *= k; r2 = 1; }
        const d = Math.sqrt(Math.max(0, 1 - r2));
        const w = [0, 1, 2].map((i) => x * R[i] + y * U[i] + d * N[i]);
        ctx.set('theta', Math.acos(L.clamp(w[2], -1, 1)) * 180 / PI, true);
        if (Math.hypot(w[0], w[1]) > 1e-3) ctx.set('phi', Math.atan2(w[1], w[0]) * 180 / PI, true);
        ctx.redraw();
      } });
      // background drag turns the camera
      f.svg.addEventListener('pointerdown', (ev) => {
        if (ev.target.closest('.lab-handle')) return;
        ev.preventDefault();
        const x0 = ev.clientX, y0 = ev.clientY, v0 = { ...st.view };
        const move = (m) => { st.view = { a: v0.a - (m.clientX - x0) * 0.01, e: L.clamp(v0.e + (m.clientY - y0) * 0.01, -1.4, 1.4) }; ctx.redraw(); };
        const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
      });

      // Right: amplitudes as phasors, and measurement probabilities along three axes
      const al = Math.cos(th / 2), be = Math.sin(th / 2);
      L.h('p', 'lab-cap', c2, T('Amplitudes α = ⟨0|ψ⟩ and β = ⟨1|ψ⟩ in the complex plane', '複素平面上の振幅 α = ⟨0|ψ⟩ と β = ⟨1|ψ⟩'));
      const g = L.fig(c2, { x: [-1.25, 1.25], y: [-1.15, 1.15], equal: true, maxH: 250, grid: false, ticksX: [[-1, '−1'], [0, '0'], [1, '1']], ticksY: [[-1, '−i'], [0, '0'], [1, 'i']] });
      g.circle(0, 0, 1, { c: 'muted', w: 1, dash: '3 4' });
      g.arrow([0, 0], [al, 0], { c: 'c1', w: 3 });
      g.text(al, 0, 'α', { math: true, c: 'c1', dx: al > 0.9 ? -4 : 10, dy: -8 });
      if (be > 1e-3) { g.arrow([0, 0], [be * Math.cos(ph), be * Math.sin(ph)], { c: 'c2', w: 3 }); g.text(be * Math.cos(ph), be * Math.sin(ph), 'β', { math: true, c: 'c2', dx: 10 * Math.cos(ph), dy: -10 * Math.sin(ph) + 4 }); }
      if (be > 0.12 && Math.abs(ph) > 0.05) g.line(L.seq(31, (i) => { const q = ph * i / 30; return [0.22 * Math.cos(q), 0.22 * Math.sin(q)]; }), { c: 'c2', w: 1.4 });
      L.h('p', 'lab-cap', c2, T('Outcome probabilities when measuring along z, x and y', 'z、x、y 方向で測定したときの結果の確率'));
      const pr = [[(1 + s[2]) / 2, 'Z', '|0⟩', '|1⟩'], [(1 + s[0]) / 2, 'X', '|+⟩', '|−⟩'], [(1 + s[1]) / 2, 'Y', '|+i⟩', '|−i⟩']];
      const b = L.fig(c2, { x: [-0.2, 1.02], y: [-0.2, 3.1], axes: false, aspect: 0.45, minH: 140, maxH: 180 });
      pr.forEach(([p, name, up, dn], i) => {
        const y = 2.5 - i;
        b.rect(0, y - 0.62, p, 0.32, { c: 'c1', fo: 0.8, nostroke: true });
        b.rect(p, y - 0.62, 1 - p, 0.32, { c: 'c2', fo: 0.4, nostroke: true });
        b.text(-0.1, y - 0.46, name, { dy: 5 });
        b.text(0, y, `${up} ${fmt(p, 2)}`, { anchor: 'start', small: true, dy: 0, c: 'c1' });
        b.text(1, y, `${dn} ${fmt(1 - p, 2)}`, { anchor: 'end', small: true, dy: 0, c: 'c2' });
      });
      L.legend(ctx.host, [{ c: 'hl', label: T('Bloch vector (⟨σx⟩, ⟨σy⟩, ⟨σz⟩)', 'ブロッホベクトル (⟨σx⟩, ⟨σy⟩, ⟨σz⟩)') }, { c: 'c4', dash: true, label: T('its projections', 'その射影') }, { c: 'c1', label: T('θ and |α|² = cos²(θ/2)', 'θ と |α|² = cos²(θ/2)') }, { c: 'c2', label: T('φ, the relative phase of β', 'φ（β の相対位相）') }]);
      ctx.readout([{ k: 'α, β', v: `${fmt(al, 3)}, ${fmt(be, 3)}·e^(i·${fmt(v.phi, 0)}°)` }, { k: 'P(0) = cos²(θ/2)', v: fmt(al * al, 3), tone: 'key' }, { k: 'P(1)', v: fmt(be * be, 3) }, { k: T('Bloch vector', 'ブロッホベクトル'), v: `(${fmt(s[0], 2)}, ${fmt(s[1], 2)}, ${fmt(s[2], 2)})` }],
        Math.abs(th - PI / 2) < 0.01 ? T('On the equator both outcomes along z are equally likely; φ decides what an x or y measurement gives.', '赤道上では z 方向の2つの結果は等確率で、x や y の測定結果は φ が決めます。') : T('Changing φ never changes P(0) or P(1); it only changes the x and y probabilities.', 'φ を変えても P(0) と P(1) は変わらず、x と y の確率だけが変わります。'));
      void deg;
    },
  };
})();
