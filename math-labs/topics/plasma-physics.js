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
      const g = L.fig(c2, { x: [0, rM], y: [0, yM], aspect: 0.85, maxH: 360, xlabel: 'r' });
      g.text(rM * 0.98, yM, T('φ(r), and Q(r)/q', 'φ(r) と Q(r)/q'), { anchor: 'end', dy: 14, small: true, c: 'muted' });
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
      ctx.readout([{ k: 'λD', v: fmt(lam, 3) }, { k: 'r', v: fmt(rp, 3) }, { k: 'φ(r)', v: fmt(phi, 3), tone: 'key' }, { k: T('bare φ₀/r', '裸の φ₀/r'), v: fmt(q / rp, 3) }, { k: T('screening factor e^(−r/λD)', '遮蔽因子 e^(−r/λD)'), v: fmt(Math.exp(-rp / lam), 3), tone: 'key' }, { k: T('net charge inside r', 'r の内側の正味の電荷'), v: `${fmt(enc, 3)} q` }],
        T('Drag the gold handle. The cloud carries exactly −q in total, so from far away the test charge is hidden: inside r = λD it still shows 74 % of q, inside 3λD only 20 %.', '金色のハンドルをドラッグできます。雲は全体でちょうど −q を持つので、遠くからは試験電荷が見えなくなります。r = λD の内側ではまだ q の74 %が見えますが、3λD の内側では20 %だけです。'));
    },
  };

  /* ---------- 2. Cyclotron motion: a helix about B ---------- */
  const CB = 2.6, CZ = 2.0; // half-width of the drawn box across B, half-height along B
  // orbit in the plane across B (B along +z, B = 1); q > 0 turns clockwise seen from +B
  function gyro(w, sp) {
    const sgn = Math.sign(w), aw = Math.abs(w), straight = aw < 1e-6;
    const rL = straight ? Infinity : sp / aw, TT = straight ? Infinity : 2 * Math.PI / aw;
    const y0 = straight ? 0 : sgn * Math.min(rL, 2.3);
    const cen = straight ? null : [0, y0 - sgn * rL];
    const pos = (t) => straight ? [sp * t, 0] : [sp / w * Math.sin(w * t), y0 + sp / w * (Math.cos(w * t) - 1)];
    const vel = (t) => straight ? [sp, 0] : [sp * Math.cos(w * t), -sp * Math.sin(w * t)];
    return { sgn, aw, straight, rL, TT, y0, cen, pos, vel };
  }
  D.cyclotron = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      const w = v.ratio, sp = v.speed, vpar = v.parallel ?? 0.3, O = gyro(w, sp), { sgn, aw, straight, rL, TT, y0, cen, pos, vel } = O;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('The orbit in 3D, with B pointing up. The circle across B is the cyclotron motion; the speed along B, untouched by the force, stretches it into a helix. Drag to turn the view.', '3D で見た軌道。B は上向きです。B を横切る円運動がサイクロトロン運動で、力の影響を受けない B 方向の速度がそれをらせんに引き伸ばします。ドラッグで視点が回ります。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Frequency ω and Larmor radius rₗ against q/m, for this v⊥. Drag the gold point.', 'この v⊥ での q/m に対する角振動数 ω とラーマー半径 rₗ。金色の点をドラッグできます。'));
        st.g2 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
      }
      // time span of the drawn helix: from the bottom of the box to the top, at most six turns
      const tEnd = straight ? (vpar > 1e-6 ? Math.min(2 * CB / sp, 2 * CZ / vpar) : 2 * CB / sp) : (vpar > 1e-6 ? Math.min(6 * TT, 2 * CZ / vpar) : TT);
      const z = (t) => vpar * t; // the helix is drawn for t in [−tEnd/2, tEnd/2], crossing the middle plane at t = 0
      let flatF = null;
      const drawFlat = () => {
        st.v3.replaceChildren();
        st.cap1.textContent = T('Orbit in the plane, B out of the page (dots)', '平面内の軌道。B は紙面から手前向き（点）');
        const R = 3.6, f = L.fig(st.v3, { x: [-R, R], y: [-R, R], equal: true, maxH: 400, xlabel: 'x', ylabel: 'y' });
        for (let x = -3; x <= 3.01; x += 1) for (let y = -3; y <= 3.01; y += 1) { f.circle(x, y, 0.1, { c: 'muted', w: 1, layer: 'under' }); f.dot(x, y, { c: 'muted', r: 1.6, layer: 'under' }); }
        if (!straight) {
          f.circle(cen[0], cen[1], rL, { c: 'c1', w: 2, op: 0.9 });
          f.circle(cen[0], y0 + sgn * rL, rL, { c: 'muted', w: 1.2, dash: '4 4', op: 0.8 });
          f.dot(cen[0], cen[1], { c: 'c1', r: 3.5, layer: 'main' });
          const lx = cen[0] - Math.min(rL, 2);
          f.text(lx, cen[1], T('guiding centre', '案内中心'), { small: true, anchor: 'end', dx: -6, dy: 4, c: 'c1', layer: 'main' });
          f.seg([lx, cen[1]], [cen[0], cen[1]], { c: 'c1', w: 1, dash: '2 3', op: 0.7, layer: 'main' });
          const rr = Math.min(rL * 0.55, 1.1) / rL;
          const arc = L.sample(0.08 * TT, 0.3 * TT, 30, (t) => { const p = pos(t); return [cen[0] + rr * (p[0] - cen[0]), cen[1] + rr * (p[1] - cen[1])]; });
          f.line(arc, { c: 'c1', w: 1.8, arrow: true });
        } else f.line([[-R, 0], [R, 0]], { c: 'c1', w: 2 });
        f.layers.anim = f.group('over');
        return f;
      };
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const qM = 2, yM = 3.2;
        const g = L.fig(st.g2, { x: [-qM, qM], y: [-yM, yM], aspect: 0.85, maxH: 400, xlabel: 'q/m' });
        g.text(-qM + 0.05, yM, T('ω, rₗ', 'ω, rₗ'), { anchor: 'start', dx: 4, dy: 14, small: true, c: 'muted' });
        g.hline(0, { c: 'ink', w: 1, op: 0.5, layer: 'under' });
        g.line([[-qM, -qM], [qM, qM]], { c: 'c2', w: 2.2 });
        g.text(qM - 0.05, qM, 'ω = qB/m', { anchor: 'end', dy: -8, small: true, c: 'c2' });
        const rl = (q) => Math.min(yM * 1.5, sp / Math.abs(q));
        g.line(L.sample(-qM, -0.02, 160, rl), { c: 'c1', w: 2.2 });
        g.line(L.sample(0.02, qM, 160, rl), { c: 'c1', w: 2.2 });
        g.text(qM - 0.05, rl(qM) - 0.32, 'rₗ = v⊥/|ω|', { anchor: 'end', dy: 4, small: true, c: 'c1' });
        g.vline(w, { c: 'hl', w: 1.2, dash: '2 3' });
        g.dot(w, w, { c: 'hl', r: 6 });
        if (!straight && rL < yM) g.dot(w, rL, { c: 'hl', r: 6 });
        g.handle(w, 0, { c: 'hl', r: 7, axis: 'x', bounds: [-qM, qM, -yM, yM], snap: 0.05, label: T('Charge-to-mass ratio q/m', '電荷質量比 q/m'), onDrag: (x) => ctx.set('ratio', x) });
        L.legend(st.leg, [{ c: 'c1', label: T('orbit of this particle; rₗ against q/m', 'この粒子の軌道・q/m に対する rₗ') }, { c: 'muted', dash: true, label: T('same particle with the opposite charge', '電荷の符号だけ逆の粒子') }, { c: 'c3', label: T('velocity v', '速度 v') }, { c: 'c2', label: T('force qv × B, toward the guiding centre; ω against q/m', '力 qv × B（案内中心向き）・q/m に対する ω') }, { kind: 'dot', c: 'hl', label: T('particle; current q/m', '粒子・現在の q/m') }]);
        const pitch = straight ? Infinity : vpar * TT;
        ctx.readout([{ k: T('cyclotron frequency ω = qB/m', 'サイクロトロン角振動数 ω = qB/m'), v: fmt(w, 3) }, { k: T('Larmor radius v⊥/|ω|', 'ラーマー半径 v⊥/|ω|'), v: straight ? '∞' : fmt(rL, 3), tone: 'key' }, { k: T('period 2π/|ω|', '周期 2π/|ω|'), v: straight ? '∞' : fmt(TT, 3) }, { k: T('pitch v∥ · 2π/|ω|', 'ピッチ v∥ · 2π/|ω|'), v: straight ? '∞' : fmt(pitch, 3) }, { k: T('sense seen from +B', '+B 側から見た向き'), v: straight ? T('no turning', '曲がらない') : sgn > 0 ? T('clockwise', '時計回り') : T('counterclockwise', '反時計回り') }],
          T('B = 1, pointing up in the 3D view and out of the page in the plan. Positive charges circle clockwise seen from the tip of B, negative ones counterclockwise; the radius depends only on |q|/m and v⊥, the pitch on v∥, and the speed never changes.', 'B = 1 で、3D 図では上向き、平面図では紙面から手前向きです。B の先端側から見て正電荷は時計回り、負電荷は反時計回りに回ります。半径は |q|/m と v⊥ だけで、ピッチは v∥ で決まり、速さは変わりません。'));
      };
      const startAnim = () => {
        st.anim?.stop(); st.bar.replaceChildren();
        st.t ??= 0.62 * tEnd / 1.2;
        st.anim = L.animator(st.bar, (dt, t, label) => {
          st.t = t; const tt = t * 1.2;
          if (st.flat && flatF) {
            const f = flatF; f.clear('anim');
            const span = Number.isFinite(TT) ? 0.35 * TT : 2.5 / sp, NS = 14, R = 3.6;
            const P = (u) => straight ? [-R + ((sp * u) % (2 * R)), 0] : pos(u);
            for (let i = 0; i < NS; i++) {
              const ta = tt - span * (NS - i) / NS, tb = tt - span * (NS - i - 1) / NS;
              if (straight && (Math.floor(ta * sp / (2 * R)) !== Math.floor(tb * sp / (2 * R)) || ta < 0)) continue;
              f.seg(P(ta), P(tb), { c: 'hl', w: 4, op: 0.08 + 0.6 * (i + 1) / NS, layer: 'anim' });
            }
            const p = P(tt), u = vel(tt), s = 0.6;
            f.arrow(p, [p[0] + u[0] * s, p[1] + u[1] * s], { c: 'c3', w: 2.6, layer: 'anim' });
            if (!straight) { const fx = cen[0] - p[0], fy = cen[1] - p[1], m = Math.hypot(fx, fy) || 1, len = 0.35 + 0.35 * aw * sp / 2; f.arrow(p, [p[0] + fx / m * len, p[1] + fy / m * len], { c: 'c2', w: 2.6, layer: 'anim' }); }
            f.dot(p[0], p[1], { c: 'hl', r: 7, layer: 'anim' });
          } else st.move3d?.(((tt % tEnd) + tEnd) % tEnd - tEnd / 2);
          const ang = Number.isFinite(TT) ? ((w * tt) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) : 0;
          label.textContent = Number.isFinite(TT) ? `t = ${fmt((tt % TT) / TT, 2)} T,  ${T('turned', '回転角')} ${fmt(ang * 180 / Math.PI, 0)}°,  |v| = ${fmt(Math.hypot(sp, vpar), 2)}` : `t = ${fmt(tt, 1)},  |v| = ${fmt(Math.hypot(sp, vpar), 2)}`;
        }, { autoplay: true, initialT: st.t, playLabel: T('Play', '再生') });
      };
      // the helix, cut where it leaves the box so a very wide orbit shows only the arcs that cross it
      const pieces = (wq, y0q) => {
        const G = gyro(wq, sp), out = [], N = Math.max(60, Math.ceil(tEnd / (G.straight ? 0.05 : TT / 90)));
        let cur = [];
        for (let i = 0; i <= N; i++) {
          const t = tEnd * (i / N - 0.5), p = G.straight ? [sp * t, 0] : [sp / wq * Math.sin(wq * t), y0q + sp / wq * (Math.cos(wq * t) - 1)];
          if (Math.abs(p[0]) <= CB + 1e-9 && Math.abs(p[1]) <= CB + 1e-9) cur.push([p[0], p[1], z(t)]);
          else if (cur.length) { out.push(cur); cur = []; }
        }
        if (cur.length) out.push(cur);
        return out;
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 460, camera: [7.6, -9.2, 4.4], target: [0, 0, -0.15], fov: 32,
        init(S) {
          st.flat = false;
          const fl = [];
          for (let x = -2.4; x <= 2.41; x += 1.6) for (let y = -2.4; y <= 2.41; y += 1.6) if (!(x < -2.3 && y < -2.3)) fl.push([[x, y, -CZ], [x, y, CZ]]);
          S.lines(fl, { c: 'muted', opacity: S.dark ? 0.22 : 0.28 });
          S.arrow([-2.4, -2.4, -CZ], [0, 0, 2 * CZ + 0.3], { c: 'muted', r: 0.02 });
          S.label('B', [-2.4, -2.4, CZ + 0.45], { math: true, align: 'middle' });
          S.lines([[[-CB, -CB, -CZ], [CB, -CB, -CZ]], [[CB, -CB, -CZ], [CB, CB, -CZ]], [[CB, CB, -CZ], [-CB, CB, -CZ]], [[-CB, CB, -CZ], [-CB, -CB, -CZ]]], { c: 'muted', opacity: 0.5 });
          st.tubes = L.seq(10, () => S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.028 }));
          st.ghost = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'muted', opacity: 0.6 });
          st.shadow = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c1', opacity: 0.45 });
          st.gc = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c1', opacity: 0.8 });
          st.gcLab = S.label(T('guiding centre', '案内中心'), [0, 0, 0], { small: true, c: 'c1', align: 'middle' });
          st.ball = S.sphere([0, 0, 0], 0.11, { c: 'hl', glow: 0.3 });
          st.vArr = S.arrow([0, 0, 0], [0, 0, 1], { c: 'c3', r: 0.03 });
          st.fArr = S.arrow([0, 0, 0], [0, 0, 1], { c: 'c2', r: 0.03 });
          st.S = S;
        },
        update(S, vv) {
          const ps = pieces(w, y0);
          st.tubes.forEach((tb, i) => tb.update(ps[i] && ps[i].length > 1 ? ps[i] : []));
          const ghost = straight ? [] : pieces(-w, -y0);
          const segs = []; ghost.forEach((pc) => { for (let i = 0; i + 1 < pc.length; i++) segs.push([pc[i], pc[i + 1]]); });
          st.ghost.update(segs.length ? segs : [[[0, 0, 0], [0, 0, 0]]]);
          const sh = [];
          if (!straight) for (let k = 0; k < 96; k++) { const a0 = k / 96 * L.TAU, a1 = (k + 1) / 96 * L.TAU, q0 = [cen[0] + rL * Math.cos(a0), cen[1] + rL * Math.sin(a0)], q1 = [cen[0] + rL * Math.cos(a1), cen[1] + rL * Math.sin(a1)]; if (Math.max(...q0.map(Math.abs), ...q1.map(Math.abs)) <= CB) sh.push([[...q0, -CZ + 0.005], [...q1, -CZ + 0.005]]); }
          else sh.push([[-CB, 0, -CZ + 0.005], [CB, 0, -CZ + 0.005]]);
          st.shadow.update(sh);
          const gcIn = !straight && Math.abs(cen[1]) <= CB;
          st.gc.update(gcIn ? [[[cen[0], cen[1], -CZ], [cen[0], cen[1], CZ]]] : [[[0, 0, 0], [0, 0, 0]]]);
          st.gcLab.el.hidden = !gcIn;
          if (gcIn) st.gcLab.set([cen[0], cen[1], CZ + 0.18]);
          st.move3d = (t) => {
            const p2 = pos(t), u = vel(t), p = [p2[0], p2[1], z(t)];
            const inBox = Math.abs(p2[0]) <= CB && Math.abs(p2[1]) <= CB;
            st.ball.visible = st.vArr.visible = st.fArr.visible = inBox;
            if (!inBox) { S.invalidate(); return; }
            st.ball.at(p);
            st.vArr.set(p, [u[0] * 0.85, u[1] * 0.85, vpar * 0.85]);
            if (!straight) { const fx = cen[0] - p2[0], fy = cen[1] - p2[1], m = Math.hypot(fx, fy) || 1, len = 0.45 + 0.4 * aw * sp / 2; st.fArr.set(p, [fx / m * len, fy / m * len, 0]); } else st.fArr.visible = false;
            S.invalidate();
          };
          draw2d(); startAnim();
        },
        fallback() { st.flat = true; flatF = drawFlat(); draw2d(); startAnim(); },
      });
      if (!st.__v3 && !st.flat) { draw2d(); startAnim(); }
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
      if (wp > 0.07 * yM) f.text(kM * 0.97, 0, T('no propagation: ω < ωₚ', '伝播しない：ω < ωₚ'), { anchor: 'end', small: true, dy: -7, c: 'muted' });
      f.hline(wp, { c: 'muted', dash: '4 4' });
      f.text(0, wp, 'ωₚ', { anchor: 'start', dx: 6, dy: -6, small: true });
      f.line([[0, 0], [kM, c * kM]], { c: 'ink', w: 1.2, dash: '3 4' });
      const kl = Math.min(0.95 * kM, 0.9 * yM / c);
      const kt = 0.62 * kl;
      f.text(kt, c * kt, T('light line ω = ck', '光線 ω = ck'), { anchor: 'start', dx: 9, dy: 15, small: true, c: 'muted' });
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
