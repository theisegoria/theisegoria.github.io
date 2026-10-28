'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI;

  // marching squares: one point list with null breaks, all levels together
  function contours(fn, x0, x1, y0, y1, nx, ny, levels) {
    const g = new Float64Array((nx + 1) * (ny + 1));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) g[j * (nx + 1) + i] = fn(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny);
    const out = [], dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = [g[j * (nx + 1) + i], g[j * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i + 1], g[(j + 1) * (nx + 1) + i]];
      if (v.some((q) => !Number.isFinite(q))) continue;
      const lo = Math.min(...v), hi = Math.max(...v);
      const X = x0 + i * dx, Y = y0 + j * dy;
      const P = [[X, Y], [X + dx, Y], [X + dx, Y + dy], [X, Y + dy]];
      for (const c of levels) {
        if (c < lo || c >= hi) continue;
        const pts = [];
        for (let e = 0; e < 4; e++) {
          const p = v[e] - c, q = v[(e + 1) % 4] - c;
          if ((p < 0) !== (q < 0)) { const t = p / (p - q); pts.push([P[e][0] + t * (P[(e + 1) % 4][0] - P[e][0]), P[e][1] + t * (P[(e + 1) % 4][1] - P[e][1])]); }
        }
        if (pts.length >= 2) { out.push(pts[0], pts[1], null); if (pts.length === 4) out.push(pts[2], pts[3], null); }
      }
    }
    return out;
  }

  /* ---------------- models (no DOM) ---------------- */
  // point charges in 3D, units with 1/4πε₀ = 1
  const efield = (charges, x, y, z) => { let ex = 0, ey = 0, ez = 0; for (const c of charges) { const dx = x - c.p[0], dy = y - c.p[1], dz = z, r2 = dx * dx + dy * dy + dz * dz, r3 = r2 * Math.sqrt(r2); ex += c.q * dx / r3; ey += c.q * dy / r3; ez += c.q * dz / r3; } return [ex, ey, ez]; };
  // field lines from the emitting charges, seeded evenly on a small sphere, so the number of lines leaving a charge is proportional to it (Gauss)
  function fieldLines3D(charges, perUnit = 16) {
    const sign = charges.some((c) => c.q > 0) ? 1 : -1;
    const emit = charges.filter((c) => c.q * sign > 0), sinks = charges.filter((c) => c.q * sign < 0);
    const out = [], GA = PI * (3 - Math.sqrt(5)), h = 0.03;
    const dir = (p) => { const e = efield(charges, p[0], p[1], p[2]), m = Math.hypot(...e) || 1; return [sign * e[0] / m, sign * e[1] / m, sign * e[2] / m]; };
    for (const c of emit) {
      const nL = Math.max(4, Math.round(perUnit * Math.abs(c.q)));
      for (let i = 0; i < nL; i++) {
        const zz = 1 - 2 * (i + 0.5) / nL, rr = Math.sqrt(1 - zz * zz), ph = i * GA + 0.3;
        let p = [c.p[0] + 0.1 * rr * Math.cos(ph), c.p[1] + 0.1 * rr * Math.sin(ph), 0.1 * zz];
        const pts = [p.slice()]; let end = null;
        for (let k = 0; k < 420; k++) {
          const k1 = dir(p), k2 = dir(p.map((x, j) => x + h / 2 * k1[j])), k3 = dir(p.map((x, j) => x + h / 2 * k2[j])), k4 = dir(p.map((x, j) => x + h * k3[j]));
          p = p.map((x, j) => x + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
          pts.push(p.slice());
          const sink = sinks.find((s) => Math.hypot(p[0] - s.p[0], p[1] - s.p[1], p[2]) < 0.09);
          if (sink) { end = sink; break; }
          if (Math.abs(p[0]) > 3.3 || Math.abs(p[1]) > 2.6 || Math.abs(p[2]) > 2.2) break;
        }
        out.push({ pts, from: c, to: end });
      }
    }
    return out;
  }
  // Lorentz: q = m = 1, B along z, E along y, starting at the origin with velocity (1, 0, vz)
  function lorentzPath(b, e, vz) {
    const vd = e / b, u0 = 1 - vd;
    return { vd, u0, rL: Math.abs(u0) / b, T: TAU / b, at: (t) => [vd * t + u0 / b * Math.sin(b * t), u0 / b * (Math.cos(b * t) - 1), vz * t], vel: (t) => [vd + u0 * Math.cos(b * t), -u0 * Math.sin(b * t), vz], centre: (t) => [vd * t, -u0 / b, vz * t] };
  }
  // induction: a point dipole (moment along +x) at x on the axis of a unit loop
  const flux = (x) => 1 / Math.pow(1 + x * x, 1.5);
  const dflux = (x) => -3 * x / Math.pow(1 + x * x, 2.5);
  const emfAt = (x, speed) => -dflux(x) * speed;
  (window.LabModels = window.LabModels || {}).electromagnetism = { efield, fieldLines3D, lorentzPath, flux, dflux, emfAt };

  /* ---------------- 1. electric field lines ---------------- */
  function fieldFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    st.row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', st.row); st.c2 = L.h('div', 'lab-col', st.row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('The two charges in space with their field lines. A charge q sends out a number of lines proportional to q, evenly in every direction, so in 3D the density of lines is the strength of the field. Drag a charge; drag elsewhere to turn the view.', '空間の中の二つの電荷とその力線です。電荷 q はあらゆる方向に均等に q に比例する本数の力線を出すので、3 次元では力線の密度がそのまま電場の強さになります。電荷をドラッグできます。それ以外の場所をドラッグすると視点が回ります。'));
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, T('The plane z = 0 through both charges: potential as colour, equipotentials dashed, field lines in the plane. Drag either charge here too.', '両方の電荷を通る平面 z = 0 です。電位を色で、等電位線を破線で、この平面内の力線を実線で示します。ここでも電荷をドラッグできます。'));
    st.d2 = L.h('div', '', st.c2);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  const SOFT = 0.04;
  const potential = (charges) => (x, y) => charges.reduce((s, c) => s + c.q / Math.sqrt((x - c.p[0]) ** 2 + (y - c.p[1]) ** 2 + SOFT), 0);
  const tone = (q) => (q > 0 ? 'pos' : q < 0 ? 'neg' : 'muted');
  function drawPlane(ctx, v, st, host, big) {
    host.replaceChildren();
    const q = [v.q1, v.q2];
    const f = L.fig(host, { x: [-2.4, 2.4], y: [-1.6, 1.6], equal: true, maxH: big ? 480 : 360, grid: false });
    const charges = st.pos.map((p, i) => ({ p, q: q[i] }));
    const phi = potential(charges);
    const E = (x, y) => charges.reduce((s, c) => { const dx = x - c.p[0], dy = y - c.p[1], r3 = Math.pow(dx * dx + dy * dy + SOFT, 1.5); return [s[0] + c.q * dx / r3, s[1] + c.q * dy / r3]; }, [0, 0]);
    const cm = L.cmaps.div;
    f.raster((x, y) => { const u = phi(x, y), s = Math.sign(u) * (1 - Math.exp(-Math.abs(u) / 1.2)); return cm(s * 0.85); }, { res: 2 });
    const dV = 0.4, levels = L.seq(25, (i) => (i - 12) * dV);
    f.line(contours(phi, -2.4, 2.4, -1.6, 1.6, f.small ? 84 : 132, f.small ? 56 : 88, levels), { c: 'ink', w: 1, dash: '3 3', op: 0.55, layer: 'under' });
    const seeds = [];
    const emit = charges.some((c) => c.q > 0) ? charges.filter((c) => c.q > 0) : charges.filter((c) => c.q < 0);
    const sign = charges.some((c) => c.q > 0) ? 1 : -1;
    emit.forEach((c) => { const nn = Math.max(6, Math.round(10 * Math.abs(c.q))); for (let k = 0; k < nn; k++) { const th = (k + 0.5) / nn * TAU; seeds.push([c.p[0] + 0.09 * Math.cos(th), c.p[1] + 0.09 * Math.sin(th)]); } });
    if (emit.length) f.stream((x, y) => { const e = E(x, y); return [sign * e[0], sign * e[1]]; }, seeds, { both: false, c: 'ink', w: 1.2, op: 0.55, h: 0.012, steps: 700, stop: (p) => charges.some((c) => c.q * sign < 0 && Math.hypot(p[0] - c.p[0], p[1] - c.p[1]) < 0.07) });
    charges.forEach((c, i) => {
      f.handle(c.p[0], c.p[1], { c: tone(c.q), r: 11, label: T(`Charge ${i + 1}`, `電荷${i + 1}`), bounds: [-2.2, 2.2, -1.4, 1.4], onDrag: (x, y) => { st.pos[i] = [x, y]; ctx.redraw(); } });
      f.text(c.p[0], c.p[1], c.q > 0 ? '+' : c.q < 0 ? '−' : '0', { dy: 5, c: 'plate' });
    });
    f.hover((x, y) => { const e = E(x, y); return { text: `(${fmt(x, 2)}, ${fmt(y, 2)})   V = ${fmt(phi(x, y), 2)}   |E| = ${fmt(Math.hypot(...e), 2)}` }; });
    return { phi, E };
  }
  D['electric-field'] = {
    three: true,
    render(ctx, v) {
      const st = fieldFrame(ctx);
      st.pos ||= [[-0.8, 0], [0.8, 0]];
      const after = (S) => {
        const { phi, E } = drawPlane(ctx, v, st, st.flat ? st.v3 : st.d2, st.flat);
        st.leg.replaceChildren();
        L.legend(st.leg, [{ kind: 'fill', c: 'pos', label: T('positive potential', '正の電位') }, { kind: 'fill', c: 'neg', label: T('negative potential', '負の電位') }, { c: st.flat ? 'ink' : 'c1', label: T('field lines', '電気力線') }, { c: 'ink', dash: true, label: T('equipotentials, every 0.4', '等電位線（0.4 刻み）') }]);
        const total = v.q1 + v.q2, d = Math.hypot(st.pos[0][0] - st.pos[1][0], st.pos[0][1] - st.pos[1][1]);
        const force = v.q1 * v.q2 / (d * d);
        const mid = [(st.pos[0][0] + st.pos[1][0]) / 2, (st.pos[0][1] + st.pos[1][1]) / 2], Em = E(mid[0], mid[1]);
        const lines = S ? st.lineCount : null;
        ctx.readout([{ k: T('net charge', '総電荷'), v: fmt(total, 2), tone: 'key' }, { k: T('separation', '距離'), v: fmt(d, 2) }, { k: T('force between them', '互いの力'), v: `${fmt(Math.abs(force), 3)} ${force < 0 ? T('attract', '引力') : force > 0 ? T('repel', '斥力') : ''}` }, { k: T('V, |E| at the midpoint', '中点での V, |E|'), v: `${fmt(phi(mid[0], mid[1]), 2)}, ${fmt(Math.hypot(...Em), 2)}` }].concat(lines ? [{ k: T('lines out, lines ending on the other charge', '出る力線、もう一方で終わる力線'), v: `${lines[0]}, ${lines[1]}` }] : []), T('Units with 1/4πε₀ = 1. Field lines leave positive charge and end on negative charge, and cross the equipotentials at right angles. With unequal charges only part of the lines from the larger one can end on the smaller; the rest escape to infinity.', '1/4πε₀ = 1 の単位です。力線は正電荷から出て負電荷で終わり、等電位線と直角に交わります。電荷の大きさが違うと、大きい方から出る力線の一部しか小さい方で終われず、残りは無限遠へ逃げていきます。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.78, maxH: 470, camera: [1.4, -5.6, 3.3], target: [0, 0, 0], fov: 34,
        init(S) {
          st.flat = false;
          st.plane = S.surface((u, w) => [u, w, 0], { u: [-2.4, 2.4], v: [-1.6, 1.6], nu: 72, nv: 48, colour: () => S.colour('plate'), opacity: 0.82, rough: 0.85, coat: 0 });
          st.plane.userData.noOcclude = true;
          st.lines = S.lines([], { c: 'c1', opacity: 0.95 });
          st.heads = L.seq(64, () => { const a = S.arrow([0, 0, 0], [0, 0, 0.001], { c: 'c1', r: 0.011, head: 0.07 }); a.visible = false; return a; });
          st.h = [0, 1].map((i) => S.handle([...st.pos[i], 0], { r: 0.1, c: i ? 'neg' : 'pos', plane: [[0, 0, 1], [0, 0, 0]], bounds: [-2.2, 2.2, -1.4, 1.4], onDrag: (q) => { st.pos[i] = [q.x, q.y]; ctx.redraw(); return [q.x, q.y, 0]; } }));
          st.lab = [0, 1].map((i) => S.label(`q${i ? '₂' : '₁'}`, [...st.pos[i], 0.2], { math: true }));
        },
        update(S, vv) {
          const q = [vv.q1, vv.q2], charges = st.pos.map((p, i) => ({ p, q: q[i] }));
          const phi = potential(charges);
          st.plane.update(undefined, (u, w) => { const uu = phi(u, w), s = Math.sign(uu) * (1 - Math.exp(-Math.abs(uu) / 0.7)); return S.cmap.div(s); });
          const fl = charges.some((c) => Math.abs(c.q) > 1e-9) ? fieldLines3D(charges) : [];
          const segs = []; fl.forEach((l) => { for (let i = 0; i + 1 < l.pts.length; i++) segs.push([l.pts[i], l.pts[i + 1]]); });
          st.lines.update(segs);
          st.heads.forEach((a, i) => {
            const l = fl[i];
            if (!l || l.pts.length < 30) { a.visible = false; return; }
            const k = Math.min(l.pts.length - 2, Math.round(l.pts.length * (l.to ? 0.5 : 0.22))), p = l.pts[k], pn = l.pts[k + 1], d = [pn[0] - p[0], pn[1] - p[1], pn[2] - p[2]], m = Math.hypot(...d) || 1;
            a.set(p, d.map((x) => x / m * 0.1));
          });
          st.lineCount = [fl.length, fl.filter((l) => l.to).length];
          charges.forEach((c, i) => {
            const m = st.h[i], col = S.colour(tone(c.q));
            m.material.color.copy(col); m.material.emissive.copy(col); m.children[0].material.color.copy(col);
            m.scale.setScalar(0.07 + 0.025 * Math.abs(c.q));
            m.at([...c.p, 0]);
            st.lab[i].set([c.p[0], c.p[1], 0.16 + 0.03 * Math.abs(c.q)], `q${i ? '₂' : '₁'} = ${c.q > 0 ? '+' : ''}${fmt(c.q, 1)}`);
          });
          after(S);
        },
        fallback() { st.flat = true; st.row.classList.remove('is-wide'); st.c2.hidden = true; st.cap1.textContent = T('Drag either charge, or hover to read V and |E| at any point. Dashed curves are equipotentials.', 'どちらの電荷もドラッグでき、任意の点にカーソルを合わせると V と |E| が読めます。破線は等電位線です。'); after(null); },
      });
      if (!st.__v3 && !st.flat) after(null);
    },
  };

  /* ---------------- 2. Lorentz force ---------------- */
  function lorentzFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    st.row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', st.row); st.c2 = L.h('div', 'lab-col', st.row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('A positive charge in a uniform magnetic field B (vertical lines), drawn to scale and resized to fit. Its path is a helix whose axis follows B; an electric field E adds a sideways drift.', '一様な磁場 B（縦の線）の中の正電荷です。縮尺どおりに描き、全体が収まるように拡大縮小しています。軌道は B に沿った軸をもつらせんで、電場 E を加えると横向きのドリフトが加わります。'));
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, T('Looking down B: the projection of the path, its guiding centre, and the circle it turns on.', 'B に沿って見下ろした図です。軌道の射影、案内中心、回転する円を示します。'));
    st.d2 = L.h('div', '', st.c2);
    st.d2b = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  // a window of time centred on t = 0 that shows a few turns without making a tall helix unreadable
  const lorentzSpan = (P, vz) => { const pitch = Math.abs(vz) * P.T, per = Math.max(P.rL * 2, Math.abs(P.vd) * P.T); const turns = pitch > 1e-9 ? L.clamp(4.5 * per / pitch, 1.25, 3) : 3; return turns * P.T; };
  D.lorentz = {
    three: true,
    render(ctx, v) {
      const st = lorentzFrame(ctx);
      st.v = v;
      const b = v.b, e = v.e ?? 0, vz = v.vz, P = lorentzPath(b, e, vz), span = lorentzSpan(P, vz);
      const ts = L.seq(601, (i) => -span / 2 + span * i / 600), path = ts.map(P.at);
      // 2D top view (and, flat, a side view)
      const draw2d = () => {
        st.d2.replaceChildren(); st.d2b.replaceChildren();
        const xs = path.map((p) => p[0]), ys = path.map((p) => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const half = Math.max(1.15 * (Math.max(...xs) - Math.min(...xs)) / 2, 1.15 * (Math.max(...ys) - Math.min(...ys)) / 2 / 0.75, 0.6 / b);
        const top = L.fig(st.d2, { x: [cx - half, cx + half], y: [cy - 0.75 * half, cy + 0.75 * half], equal: true, maxH: 340, xlabel: 'x', ylabel: 'y' });
        const gs = half / 3.2;
        for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) top.circle(cx + i * gs, cy + j * gs, 0.025 * half, { c: 'muted', fill: true, fo: 0.45, w: 0.6, layer: 'under' });
        top.line(path.map((p) => [p[0], p[1]]), { c: 'c1', w: 2 });
        top.line([[P.centre(-span / 2)[0], P.centre(0)[1]], [P.centre(span / 2)[0], P.centre(0)[1]]], { c: 'c4', w: 1.2, dash: '5 4' });
        const c0 = P.centre(0);
        top.circle(c0[0], c0[1], P.rL, { c: 'muted', w: 1, dash: '3 4', op: 0.8 });
        st.top = top;
        if (st.flat) {
          L.h('p', 'lab-cap', st.d2b, T('Side view: the drift along B', '横から：B 方向への移動'));
          const zs = path.map((p) => p[2]), zr = Math.max(0.6 / b, ...zs.map(Math.abs)) * 1.15;
          st.side = L.fig(st.d2b, { x: [cx - half, cx + half], y: [-zr, zr], aspect: 0.8, maxH: 300, xlabel: 'x', ylabel: 'z' });
          st.side.line(path.map((p) => [p[0], p[2]]), { c: 'c1', w: 1.6, op: 0.6 });
        } else st.side = null;
      };
      const marker = (t) => {
        const p = P.at(t), vel = P.vel(t), c = P.centre(t), top = st.top; if (!top) return;
        top.clear('over');
        const sc = Math.max(P.rL, 0.35 / b) * 0.7, vm = Math.hypot(vel[0], vel[1]) || 1;
        top.arrow([p[0], p[1]], [p[0] + vel[0] / vm * sc, p[1] + vel[1] / vm * sc], { c: 'c3', w: 2.4, layer: 'over' });
        if (P.rL > 1e-6) top.arrow([p[0], p[1]], [p[0] + (c[0] - p[0]) / Math.hypot(c[0] - p[0], c[1] - p[1]) * sc * 0.8, p[1] + (c[1] - p[1]) / Math.hypot(c[0] - p[0], c[1] - p[1]) * sc * 0.8], { c: 'c2', w: 2.4, layer: 'over' });
        top.dot(p[0], p[1], { c: 'hl', r: 6, layer: 'over' });
        if (st.side) { st.side.clear('over'); st.side.dot(p[0], p[2], { c: 'hl', r: 6, layer: 'over' }); if (Math.abs(vz) > 1e-6) st.side.arrow([p[0], p[2]], [p[0], p[2] + Math.sign(vz) * sc], { c: 'c4', w: 2.4, layer: 'over' }); }
      };
      st.marker = marker;
      draw2d();
      // 3D
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 470, camera: [4.6, -5.4, 2.7], target: [0, 0, 0], fov: 34,
        init(S) {
          st.flat = false;
          const segs = []; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if ((i + j) % 2 === 0) segs.push([[i * 0.9, j * 0.9, -2.1], [i * 0.9, j * 0.9, 2.1]]);
          S.lines(segs, { c: 'muted', opacity: S.dark ? 0.28 : 0.22 });
          st.bArrow = S.arrow([-1.9, -1.9, -1.9], [0, 0, 1.2], { c: 'ink', r: 0.02 });
          S.label('B', [-1.9, -1.9, -0.55], { math: true, c: 'ink' });
          st.eArrow = S.arrow([1.9, -1.9, -1.9], [0, 1, 0], { c: 'c4', r: 0.02 });
          st.eLab = S.label('E', [1.9, -0.75, -1.9], { math: true, c: 'c4' });
          st.path = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.028, opacity: 0.85 });
          st.drift = S.lines([], { c: 'c4', opacity: 0.8 });
          st.ball = S.sphere([0, 0, 0], 0.085, { c: 'hl', glow: 0.35 });
          st.av = S.arrow([0, 0, 0], [1, 0, 0], { c: 'c3', r: 0.022 });
          st.af = S.arrow([0, 0, 0], [0, 1, 0], { c: 'c2', r: 0.022 });
          st.ap = S.arrow([0, 0, 0], [0, 0, 1], { c: 'c4', r: 0.018 });
          st.lv = S.label('v', [0, 0, 0], { math: true, c: 'c3' });
        },
        update(S, vv) {
          const Pv = lorentzPath(vv.b, vv.e ?? 0, vv.vz), sp = lorentzSpan(Pv, vv.vz);
          const tt = L.seq(721, (i) => -sp / 2 + sp * i / 720), raw = tt.map(Pv.at);
          // centre and scale uniformly into the box |x|, |y| <= 1.9, |z| <= 1.9
          const ext = [0, 1, 2].map((k) => [Math.min(...raw.map((p) => p[k])), Math.max(...raw.map((p) => p[k]))]);
          const mid = ext.map(([a, c]) => (a + c) / 2), half = Math.max((ext[0][1] - ext[0][0]) / 2, (ext[1][1] - ext[1][0]) / 2, (ext[2][1] - ext[2][0]) / 2, 0.3 / vv.b);
          const k = 1.85 / half, M = (p) => [(p[0] - mid[0]) * k, (p[1] - mid[1]) * k, (p[2] - mid[2]) * k];
          st.map = M; st.P = Pv; st.sp = sp; st.k = k;
          st.path.update(raw.map(M));
          const c0 = Pv.centre(-sp / 2), c1 = Pv.centre(sp / 2);
          st.drift.update(Math.abs(Pv.vd) > 1e-9 || Math.abs(vv.vz) > 1e-9 ? [[M(c0), M(c1)]] : []);
          st.eArrow.visible = (vv.e ?? 0) > 1e-9; st.eLab.el.style.display = st.eArrow.visible ? '' : 'none';
          st.place3d = (t) => {
            const p = Pv.at(t), vel = Pv.vel(t), c = Pv.centre(t), q = M(p), sc = 0.7;
            const vm = Math.hypot(vel[0], vel[1]) || 1;
            st.ball.at(q);
            st.av.set(q, [vel[0] / vm * sc, vel[1] / vm * sc, 0]);
            const dc = [c[0] - p[0], c[1] - p[1]], dm = Math.hypot(...dc);
            st.af.visible = dm > 1e-9; if (dm > 1e-9) st.af.set(q, [dc[0] / dm * sc * 0.8, dc[1] / dm * sc * 0.8, 0]);
            st.ap.visible = Math.abs(vv.vz) > 1e-6; if (st.ap.visible) st.ap.set(q, [0, 0, Math.sign(vv.vz) * sc * 0.8]);
            st.lv.set([q[0] + vel[0] / vm * sc * 1.15, q[1] + vel[1] / vm * sc * 1.15, q[2]]);
          };
          st.anim?.redraw();
        },
        fallback() { st.flat = true; st.row.classList.remove('is-wide'); st.c1.hidden = true; st.cap2.textContent = T('Looking down the field B (out of the page)', '磁場 B に沿って見下ろす（紙面から手前向き）'); draw2d(); st.anim?.redraw(); },
      });
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => {
          const Pv = lorentzPath(st.v.b, st.v.e ?? 0, st.v.vz), sp = lorentzSpan(Pv, st.v.vz);
          const tt = ((t * 0.9 * Pv.T / 4.2 + sp / 2) % sp) - sp / 2;
          st.marker(tt);
          if (!st.flat && st.place3d) st.place3d(tt);
        }, { autoplay: true, initialT: 0 });
      } else st.anim.redraw();
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('path of the charge', '電荷の軌道') }, { c: 'c3', label: T('velocity v⊥', '速度 v⊥') }, { c: 'c2', label: T('magnetic force qv × B, toward the centre', '磁気力 qv × B（中心向き）') }, { c: 'c4', label: T('drift of the guiding centre: v∥ along B, E/B across it', '案内中心の移動：B 方向に v∥、横方向に E/B') }]);
      const pitch = Math.abs(vz) * P.T;
      ctx.readout([
        { k: T('Larmor radius r = mv⊥/qB', 'ラーマー半径 r = mv⊥/qB'), v: fmt(P.rL, 3), tone: 'key' },
        { k: T('period 2πm/qB', '周期 2πm/qB'), v: fmt(P.T, 3) },
        { k: T('pitch v∥T', 'ピッチ v∥T'), v: fmt(pitch, 3) },
        { k: T('drift E/B', 'ドリフト E/B'), v: fmt(P.vd, 3) },
      ], e > 1e-9
        ? T(`Units with q = m = 1, starting velocity (1, 0, v∥). In the frame moving at E/B = ${fmt(P.vd, 3)} the electric field vanishes and the charge simply circles, with radius |1 − E/B|/B. Seen from the lab that circle slides sideways, perpendicular to both E and B, whatever the sign of the charge.`, `q = m = 1 の単位で、初速は (1, 0, v∥) です。速さ E/B = ${fmt(P.vd, 3)} で動く系では電場が消え、電荷は半径 |1 − E/B|/B の円を描くだけです。実験室から見るとその円が E とも B とも垂直に横へ滑っていき、その向きは電荷の符号によりません。`)
        : T('Units with q = m = |v⊥| = 1. Stronger B means a tighter, faster circle; the force is always perpendicular to the velocity, so the speed never changes, and the parallel velocity is untouched.', 'q = m = |v⊥| = 1 の単位です。B が強いほど円は小さく速くなります。力は常に速度に垂直なので速さは変わらず、平行な速度成分も影響を受けません。'));
    },
  };

  /* ---------------- 3. Faraday induction ---------------- */
  function inductionFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null; st.g = null; st.gKey = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    st.row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', st.row); st.c2 = L.h('div', 'lab-col', st.row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, T('A small bar magnet on the axis of a wire loop, with its exact dipole field lines. Lines drawn bold pass through the loop: the number of them is the flux. Drag the magnet along the axis.', '針金のループの軸上にある小さな棒磁石と、その正確な双極子の磁力線です。太く描いた線がループを通り抜ける線で、その本数が磁束です。磁石は軸に沿ってドラッグできます。'));
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, T('Flux through the loop and the induced emf against the magnet position', '磁石の位置に対する、ループを貫く磁束と誘導起電力'));
    st.d2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  // dipole field lines psi = sin²θ / r in a meridian plane, as [axial offset, radial distance] from the dipole
  const PSI = [1, 3, 5, 7, 9, 11].map((k) => k / 12);
  function meridian(psi, n = 160) {
    const out = [];
    for (let i = 1; i < n; i++) { const th = PI * i / n, r = Math.sin(th) ** 2 / psi; out.push([r * Math.cos(th), r * Math.sin(th)]); }
    return out;
  }
  const MAG = 0.6, MW = 0.2;
  const insideMagnet = (a, rho) => Math.abs(a) < MAG + 0.02 && rho < MW + 0.03;
  D.induction = {
    three: true,
    render(ctx, v) {
      const st = inductionFrame(ctx);
      st.v = v;
      const speed = v.speed;
      const graph = () => {
        const key = `${speed}`;
        if (!st.g || !st.g.svg.isConnected || st.gKey !== key) {
          st.gKey = key; st.d2.replaceChildren();
          const g = L.fig(st.d2, { x: [-3, 3], y: [-1.6, 1.6], aspect: 0.72, maxH: 320, xlabel: T('magnet position', '磁石の位置') });
          const sc = Math.max(1, speed * 1.2);
          g.line(L.sample(-3, 3, 300, flux), { c: 'c1', w: 2.2 });
          g.line(L.sample(-3, 3, 300, (x) => emfAt(x, speed) / sc), { c: 'c2', w: 2.2 });
          g.text(-2.9, 0.95, 'Φ', { anchor: 'start', c: 'c1', math: true });
          g.text(-2.9, -1.1, sc > 1 ? T('ℰ (scaled)', 'ℰ（縮尺）') : 'ℰ', { anchor: 'start', c: 'c2', small: true });
          st.g = g; st.gsc = sc;
        }
        return st.g;
      };
      const readout = (x) => {
        const e = emfAt(x, speed), lines = PSI.filter((p) => p < flux(x)).length;
        ctx.readout([{ k: 'Φ', v: fmt(flux(x), 3) }, { k: 'ℰ = −dΦ/dt', v: fmt(e, 3), tone: 'key' }, { k: T('current', '電流'), v: Math.abs(e) < 0.02 ? T('none', 'なし') : e > 0 ? T('anticlockwise seen from +x', '+x 側から見て反時計回り') : T('clockwise seen from +x', '+x 側から見て時計回り') }].concat(st.flat ? [] : [{ k: T('field lines through the loop, per plane', 'ループを通る力線（面あたり）'), v: String(lines) }]), T('The flux of a point dipole through a unit loop is Φ = 1/(1 + x²)^{3/2} (in units of its peak). The emf is largest where the flux changes fastest, half a radius either side of the loop, not where the flux is largest, and it flips sign as the magnet passes through.', '点双極子が単位ループを貫く磁束は Φ = 1/(1 + x²)^{3/2}（最大値を単位とする）です。起電力が最大になるのは磁束が最も速く変わる所、つまりループの両側で半径の半分の位置で、磁束が最大の所ではありません。磁石が通り抜けると符号が反転します。'));
      };
      const flat2d = (x) => {
        if (!st.s || !st.s.svg.isConnected) { st.v3.replaceChildren(); st.s = L.fig(st.v3, { x: [-3, 3], y: [-1.9, 1.9], equal: true, maxH: 320, axes: false }); }
        const s = st.s; s.clear('main'); s.clear('over');
        const e = emfAt(x, speed), thru = flux(x);
        // exact dipole lines in the plane of the figure (both halves of the meridian plane)
        PSI.forEach((psi) => [1, -1].forEach((sg) => {
          const pts = meridian(psi).map(([a, rho]) => (insideMagnet(a, rho) || Math.abs(x + a) > 3.1 || rho > 1.85 ? null : [x + a, sg * rho]));
          const segs = []; let cur = []; pts.forEach((p) => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
          segs.forEach((sgm) => s.line(sgm, { c: 'c1', w: psi < thru ? 1.6 : 1, op: psi < thru ? 0.85 : 0.35, layer: 'main' }));
        }));
        s.line(L.seq(61, (i) => { const th = i / 60 * TAU; return [0.12 * Math.cos(th), Math.sin(th)]; }), { c: 'ink', w: 2.6, layer: 'main' });
        s.rect(x - MAG, -MW, MAG, 2 * MW, { c: 'c2', fo: 0.9, nostroke: true, layer: 'main' });
        s.rect(x, -MW, MAG, 2 * MW, { c: 'c1', fo: 0.9, nostroke: true, layer: 'main' });
        s.text(x + MAG / 2, 0, 'N', { dy: 4, c: 'plate', small: true, layer: 'main' });
        s.text(x - MAG / 2, 0, 'S', { dy: 4, c: 'plate', small: true, layer: 'main' });
        if (Math.abs(e) > 0.02) {
          const dir = e > 0 ? 1 : -1, wA = 1.8 + 1.4 * Math.min(1, Math.abs(e) / speed), span = 0.5 + 0.35 * Math.min(1, Math.abs(e) / speed);
          const arcPts = (th0, th1) => L.seq(13, (i) => { const th = th0 + (th1 - th0) * i / 12; return [0.12 * Math.cos(th), Math.sin(th)]; });
          s.line(arcPts(PI / 2 + span * dir, PI / 2 - span * dir), { c: 'hl', w: wA, arrow: true, layer: 'over' });
          s.text(0.12, 1, 'I', { dx: 9, dy: -4, anchor: 'start', math: true, c: 'hl', layer: 'over' });
        } else s.text(0, -1.5, T('no current', '電流なし'), { small: true, c: 'muted', layer: 'over' });
        s.arrow([x, 1.5], [x + 0.9 * Math.sign(speed), 1.5], { c: 'muted', w: 1.6, layer: 'over' });
      };
      const draw = (x) => {
        st.x = x;
        const g = graph(), e = emfAt(x, speed);
        g.clear('over');
        g.vline(x, { c: 'hl', dash: '2 3', w: 1.2, layer: 'over' });
        g.dot(x, flux(x), { c: 'c1', layer: 'over' });
        g.dot(x, e / st.gsc, { c: 'c2', layer: 'over' });
        if (st.flat) flat2d(x); else st.draw3d?.(x);
        readout(x);
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 460, camera: [2.2, -6.4, 2.9], target: [0, 0, 0], fov: 33,
        init(S) {
          st.flat = false;
          S.tube(L.seq(121, (i) => { const th = i / 120 * TAU; return [0, Math.cos(th), Math.sin(th)]; }), { c: 'ink', r: 0.035, closed: true, metal: 0.6, rough: 0.3 });
          st.disc = S.disc([0, 0, 0], [1, 0, 0], 0.985, { c: 'c1', opacity: 0.2 });
          st.disc.userData.noOcclude = true;
          st.n = S.box([MAG, 2 * MW, 2 * MW], [MAG / 2, 0, 0], { c: 'c1', rough: 0.35, coat: 0.6 });
          st.sPole = S.box([MAG, 2 * MW, 2 * MW], [-MAG / 2, 0, 0], { c: 'c2', rough: 0.35, coat: 0.6 });
          st.lN = S.label('N', [0, 0, 0], { small: true, c: 'c1' });
          st.lS = S.label('S', [0, 0, 0], { small: true, c: 'c2' });
          st.thru = S.lines([], { c: 'c1', opacity: 0.95 });
          st.rest = S.lines([], { c: 'c1', opacity: S.dark ? 0.3 : 0.25 });
          st.cur = L.seq(8, () => S.arrow([0, 0, 0], [0, 0, 0.01], { c: 'hl', r: 0.03, glow: 0.4 }));
          st.lI = S.label('I', [0, 0, 1.25], { math: true, c: 'hl' });
          S.label(T('loop', 'ループ'), [0, 0.3, -1.12], { small: true, c: 'muted' });
          st.mh = S.handle([0, 0, MW + 0.12], { r: 0.075, c: 'hl', plane: [[0, 1, 0], [0, 0, 0]], bounds: [-2, 2, -1, 1, MW + 0.12, MW + 0.12], onDrag: (q) => { const x = Math.round(L.clamp(q.x, -2, 2) * 10) / 10; st.anim?.pause(); ctx.set('position', x); return [x, 0, MW + 0.12]; } });
          st.draw3d = (x) => {
            st.n.position.x = x + MAG / 2; st.sPole.position.x = x - MAG / 2;
            st.lN.set([x + MAG, 0, MW + 0.05]); st.lS.set([x - MAG - 0.12, 0, MW + 0.05]);
            st.mh.at([x, 0, MW + 0.12]);
            const thru = flux(x), A = [], B = [];
            PSI.forEach((psi) => {
              const m = meridian(psi, 140);
              for (let j = 0; j < 8; j++) {
                const ph = TAU * j / 8 + PI / 8, c = Math.cos(ph), s = Math.sin(ph);
                const P3 = m.map(([a, rho]) => (insideMagnet(a, rho) || Math.abs(x + a) > 3.4 || rho > 2.1 ? null : [x + a, rho * c, rho * s]));
                for (let i = 0; i + 1 < P3.length; i++) if (P3[i] && P3[i + 1]) (psi < thru ? A : B).push([P3[i], P3[i + 1]]);
              }
            });
            st.thru.update(A); st.rest.update(B);
            st.disc.material.opacity = 0.08 + 0.32 * thru;
            const e = emfAt(x, st.v.speed), mag = Math.min(1, Math.abs(e) / Math.max(0.3, st.v.speed));
            st.cur.forEach((a, i) => {
              a.visible = Math.abs(e) > 0.02;
              if (!a.visible) return;
              const th = TAU * i / 8, p = [0, Math.cos(th), Math.sin(th)], tg = [0, -Math.sin(th) * Math.sign(e), Math.cos(th) * Math.sign(e)], len = 0.22 + 0.25 * mag;
              a.set([p[0] - tg[0] * len / 2, p[1] - tg[1] * len / 2, p[2] - tg[2] * len / 2], tg.map((q) => q * len));
            });
            st.lI.el.style.display = Math.abs(e) > 0.02 ? '' : 'none';
          };
          if (st.x !== undefined) st.draw3d(st.x);
        },
        update() { st.anim?.redraw(); },
        fallback() { st.flat = true; st.row.classList.remove('is-wide'); st.cap1.textContent = T('A bar magnet moves along the axis of a loop, seen from the side, with its exact dipole field lines; bold lines pass through the loop.', '棒磁石がループの軸に沿って動く様子を横から見た図です。正確な双極子の磁力線を描き、ループを通る線を太くしています。'); st.s = null; st.anim?.redraw(); },
      });
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => {
          const x0 = st.v.position, sp = st.v.speed;
          draw(t === 0 ? x0 : ((x0 + 3 + sp * t) % 6 + 6) % 6 - 3);
        }, { autoplay: false, playLabel: T('Sweep the magnet', '磁石を動かす') });
      } else { st.anim.t = 0; st.anim.redraw(); }
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'c1', label: T('flux Φ; bold field lines pass through the loop', '磁束 Φ（太い力線がループを通る）') }, { c: 'c2', label: T('induced emf ℰ', '誘導起電力 ℰ') }, { c: 'hl', label: T('induced current I, whose own field opposes the change of flux', '誘導電流 I（自らつくる磁場が磁束の変化に逆らう）') }]);
    },
  };
})();
