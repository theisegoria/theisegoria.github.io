'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rad = (d) => d * Math.PI / 180;
  const supN = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const circle = (n = 180) => L.seq(n + 1, (i) => [Math.cos(L.TAU * i / n), Math.sin(L.TAU * i / n)]);
  const apply = (M, [x, y]) => [M[0] * x + M[1] * y, M[2] * x + M[3] * y];

  // Draw the image of the integer grid under a 2x2 matrix, behind everything.
  // Dark plates need a brighter grid: thin blue lines at 0.28 vanish on near-black.
  const isDark = () => { const p = L.colours().plate; return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2] < 128; };
  function grid(f, M, range = 4, o = {}) {
    const dk = isDark(), opMinor = dk ? 0.5 : 0.28, opAxis = dk ? 0.8 : 0.55, wMinor = dk ? 1.1 : 0.9;
    for (let i = -range; i <= range; i++) {
      f.line([apply(M, [-range, i]), apply(M, [range, i])], { c: o.c || 'c1', w: i === 0 ? 1.4 : wMinor, op: i === 0 ? opAxis : opMinor, layer: 'under' });
      f.line([apply(M, [i, -range]), apply(M, [i, range])], { c: o.c || 'c1', w: i === 0 ? 1.4 : wMinor, op: i === 0 ? opAxis : opMinor, layer: 'under' });
    }
  }

  D.basis = {
    render(ctx, v) {
      const { a, b, c, d } = v, det = a * d - b * c;
      const f = L.fig(ctx.host, { x: [-2.6, 2.6], y: [-2.2, 2.4], equal: true, maxH: 480 });
      const M = [a, c, b, d];
      grid(f, M, 5);
      const singular = Math.abs(det) < 1e-9;
      if (!singular) {
        const al = (d - c) / det, be = (a - b) / det;
        // the coordinate path: al*b1 then be*b2
        const p1 = [al * a, al * b];
        f.line([[0, 0], p1], { c: 'c2', w: 2, dash: '5 4' });
        f.line([p1, [1, 1]], { c: 'c3', w: 2, dash: '5 4' });
        f.text(p1[0] / 2, p1[1] / 2, `${fmt(al, 2)} b₁`, { c: 'c2', dy: -8, small: true });
        f.text((p1[0] + 1) / 2, (p1[1] + 1) / 2, `${fmt(be, 2)} b₂`, { c: 'c3', dy: -8, small: true });
      }
      f.arrow([0, 0], [a, b], { c: 'c2', w: 3 });
      f.arrow([0, 0], [c, d], { c: 'c3', w: 3 });
      f.arrow([0, 0], [1, 1], { c: 'hl', w: 3 });
      f.text(1, 1, 'v', { math: true, dx: 12, dy: -6 });
      f.handle(a, b, { c: 'c2', label: T('First basis vector', '第1基底ベクトル'), snap: 0.1, bounds: [-2, 2, -2, 2], onDrag: (x, y) => { ctx.set('a', x, true); ctx.set('b', y); } });
      f.handle(c, d, { c: 'c3', label: T('Second basis vector', '第2基底ベクトル'), snap: 0.1, bounds: [-2, 2, -2, 2], onDrag: (x, y) => { ctx.set('c', x, true); ctx.set('d', y); } });
      f.text(a, b, 'b₁', { math: true, dx: 16, dy: 18, c: 'c2' });
      f.text(c, d, 'b₂', { math: true, dx: 16, dy: 18, c: 'c3' });
      L.legend(ctx.host, [{ c: 'c1', label: T('Grid of the new basis', '新しい基底の格子') }, { c: 'hl', label: T('The fixed vector v = (1, 1)', '固定したベクトル v = (1, 1)') }, { c: 'c2', dash: true, label: T('Steps along b₁ and b₂', 'b₁ と b₂ に沿った移動') }]);
      ctx.readout(singular
        ? [{ k: 'det B', v: '0', tone: 'warn' }, { k: T('Coordinates', '座標'), v: T('not unique', '一意でない'), tone: 'warn' }]
        : [{ k: '[v]_B', v: `(${fmt((d - c) / det, 3)}, ${fmt((a - b) / det, 3)})`, tone: 'key' }, { k: 'det B', v: fmt(det) }],
        T('Drag the orange and teal handles.', '橙と青緑のハンドルをドラッグできます。'));
    },
  };

  D.det = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const { a, d, c } = v, det = a * d, M = [a, c, 0, d];
      const f = L.fig(ctx.host, { x: [-2.8, 2.8], y: [-2.3, 2.3], equal: true, maxH: 480 });
      L.seq(9, (i) => i - 4).forEach((i) => {
        f.line([[-4, i], [4, i]], { c: 'muted', w: 0.8, op: 0.22, layer: 'under' });
        f.line([[i, -4], [i, 4]], { c: 'muted', w: 0.8, op: 0.22, layer: 'under' });
      });
      f.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { c: 'muted', fo: 0.04, dash: '4 4', w: 1.1, layer: 'under' });
      const draw = (s) => {
        f.clear('main');
        const Ms = [1 + (M[0] - 1) * s, M[1] * s, 0, 1 + (M[3] - 1) * s], dt = Ms[0] * Ms[3];
        grid(f, Ms, 5);
        const img = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => apply(Ms, p));
        const col = dt < -1e-9 ? 'c2' : 'c1';
        f.poly(img, { c: col, fo: 0.26, w: 2 });
        f.arrow([0, 0], apply(Ms, [1, 0]), { c: 'c2', w: 2.8 });
        f.arrow([0, 0], apply(Ms, [0, 1]), { c: 'c3', w: 2.8 });
        f.clear('over');
        const cen = apply(Ms, [0.5, 0.5]);
        if (Math.abs(dt) > 0.2) f.text(cen[0], cen[1], `${T('area', '面積')} ${fmt(Math.abs(dt), 2)}`, { dy: 4 });
      };
      const rank = Math.abs(det) > 1e-9 ? 2 : (Math.abs(a) + Math.abs(c) + Math.abs(d) > 1e-9 ? 1 : 0);
      const DUR = 1.8;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const s = Math.min(1, t / DUR), e = s < 0.5 ? 2 * s * s : 1 - 2 * (1 - s) ** 2;
        draw(e);
        label.textContent = e < 1 ? T('from I to A', 'I から A へ') + ` · ${Math.round(e * 100)}%` : '';
        return s < 1;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play I → A', 'I → A を再生') });
      L.legend(ctx.host, [{ kind: 'fill', c: det < -1e-9 ? 'c2' : 'c1', label: det < -1e-9 ? T('Image of the unit square, orientation reversed', '単位正方形の像（向きが反転）') : T('Image of the unit square', '単位正方形の像') }, { c: 'c2', label: 'Ae₁' }, { c: 'c3', label: 'Ae₂' }]);
      ctx.readout([{ k: 'det A', v: fmt(det), tone: 'key' }, { k: T('Area', '面積'), v: fmt(Math.abs(det)) }, { k: T('Rank', '階数'), v: String(rank), tone: rank < 2 ? 'warn' : undefined }, { k: T('Orientation', '向き'), v: det < -1e-9 ? T('reversed', '反転') : det > 1e-9 ? T('kept', '保存') : T('collapsed', '潰れる') }]);
    },
  };

  D.eigen = {
    render(ctx, v) {
      const q = rad(v.angle), co = Math.cos(q), si = Math.sin(q), n = Math.round(v.n);
      const A = (p) => { const u = co * p[0] + si * p[1], w = -si * p[0] + co * p[1]; const u2 = v.l1 * u, w2 = v.l2 * w; return [co * u2 - si * w2, si * u2 + co * w2]; };
      const pts = []; let p = [-0.35, 1];
      for (let i = 0; i <= n; i++) { pts.push(p); p = A(p); }
      const ext = Math.max(2.2, ...pts.flat().map(Math.abs)) * 1.15;
      const f = L.fig(ctx.host, { x: [-ext, ext], y: [-ext * 0.8, ext * 0.8], equal: true });
      f.line([[-ext * 3 * co, -ext * 3 * si], [ext * 3 * co, ext * 3 * si]], { c: 'c2', w: 1.3, dash: '6 5', op: 0.8 });
      f.line([[ext * 3 * si, -ext * 3 * co], [-ext * 3 * si, ext * 3 * co]], { c: 'c3', w: 1.3, dash: '6 5', op: 0.8 });
      const ring = circle().map((u) => u.map((x) => x * 1));
      f.line(ring, { c: 'muted', w: 1, dash: '3 4', op: 0.6 });
      f.poly(ring.map(A), { c: 'c1', fo: 0.08, w: 1.6 });
      for (let i = 0; i < pts.length - 1; i++) f.arrow(pts[i], pts[i + 1], { c: 'hl', w: 1.8, op: 0.45 + 0.55 * (i + 1) / pts.length });
      // Label v and the last point always; intermediate points only when they sit clear of the previous label.
      const name = (i) => (i === 0 ? 'v' : i === 1 ? 'Av' : `A${supN(i)}v`);
      let lastLab = null;
      pts.forEach((pp, i) => {
        f.dot(pp[0], pp[1], { c: 'hl', r: i === 0 ? 5 : 4 });
        const px = [f.X(pp[0]), f.Y(pp[1])];
        const far = !lastLab || Math.hypot(px[0] - lastLab[0], px[1] - lastLab[1]) > 34;
        if (i === 0 || i === pts.length - 1 || far) {
          const flip = i === pts.length - 1 && i > 0 && !far;
          f.text(pp[0], pp[1], name(i), { dx: flip ? -12 : 12, dy: flip ? 14 : -8, anchor: flip ? 'end' : undefined, small: true });
          lastLab = px;
        }
      });
      f.text(ext * 0.72 * co, ext * 0.72 * si, `λ₁ = ${fmt(v.l1, 2)}`, { c: 'c2', dy: -8 });
      f.text(-ext * 0.72 * si, ext * 0.72 * co, `λ₂ = ${fmt(v.l2, 2)}`, { c: 'c3', dy: -8 });
      L.legend(ctx.host, [{ c: 'c2', dash: true, label: T('Eigendirection 1', '固有方向 1') }, { c: 'c3', dash: true, label: T('Eigendirection 2', '固有方向 2') }, { kind: 'fill', c: 'c1', label: T('Image of the unit circle', '単位円の像') }, { kind: 'dot', c: 'hl', label: T('Orbit v, Av, A²v, …', '軌道 v, Av, A²v, …') }]);
      const last = pts[pts.length - 1];
      const dom = Math.abs(v.l1) >= Math.abs(v.l2) ? 1 : 2;
      ctx.readout([{ k: n === 0 ? 'v' : n === 1 ? 'Av' : `A${supN(n)}v`, v: `(${fmt(last[0], 3)}, ${fmt(last[1], 3)})`, tone: 'key' }, { k: T('Dominant', '支配的'), v: `λ${dom === 1 ? '₁' : '₂'}` }, { k: 'det A', v: fmt(v.l1 * v.l2) }]);
    },
  };

  D.projection = {
    render(ctx, v) {
      const a = rad(v.angle), u = [Math.cos(a), Math.sin(a)], w = [2, 1], dot = u[0] * w[0] + u[1] * w[1], p = [u[0] * dot, u[1] * dot], r = [w[0] - p[0], w[1] - p[1]];
      const f = L.fig(ctx.host, { x: [-1.6, 3.2], y: [-1.2, 2.4], equal: true, maxH: 470 });
      f.line([[-6 * u[0], -6 * u[1]], [6 * u[0], 6 * u[1]]], { c: 'muted', w: 1.6 });
      // right-angle marker at the foot
      const rl = Math.hypot(...r);
      if (rl > 0.08) {
        const s = 0.16, e1 = u.map((x) => x * s * Math.sign(dot || 1) * -1), e2 = r.map((x) => x / rl * s);
        f.line([[p[0] + e1[0], p[1] + e1[1]], [p[0] + e1[0] + e2[0], p[1] + e1[1] + e2[1]], [p[0] + e2[0], p[1] + e2[1]]], { c: 'muted', w: 1.2 });
      }
      f.circle(w[0], w[1], rl, { c: 'c2', w: 1, dash: '3 4', op: 0.5 });
      f.arrow([0, 0], w, { c: 'ink', w: 2.4 });
      f.arrow([0, 0], p, { c: 'c1', w: 3 });
      f.line([p, w], { c: 'c2', w: 2.4 });
      f.dot(p[0], p[1], { c: 'c1' });
      f.text(w[0], w[1], 'v', { math: true, dx: 10, dy: -8 });
      f.text(p[0], p[1], 'v̂', { math: true, dx: -12, dy: 18, c: 'c1' });
      const tip = [2.6 * u[0], 2.6 * u[1]];
      f.handle(tip[0], tip[1], { c: 'c3', label: T('Direction of the line', '直線の向き'), onDrag: (x, y) => { let deg = Math.atan2(y, x) * 180 / Math.PI; if (deg < 0) deg += 180; if (deg > 180) deg -= 180; ctx.set('angle', deg); } });
      L.legend(ctx.host, [{ c: 'c1', label: T('Projection v̂', '射影 v̂') }, { c: 'c2', label: T('Residual v − v̂, perpendicular to the line', '残差 v − v̂（直線に垂直）') }, { c: 'c2', dash: true, label: T('Every closer point would lie inside this circle', 'より近い点はこの円の内側にある') }]);
      ctx.readout([{ k: '‖v − v̂‖²', v: fmt(rl * rl), tone: 'key' }, { k: 'u·(v − v̂)', v: fmt(u[0] * r[0] + u[1] * r[1]), tone: 'good' }, { k: 'v̂', v: `(${fmt(p[0], 3)}, ${fmt(p[1], 3)})` }], T('Drag the teal handle to turn the line.', '青緑のハンドルで直線を回せます。'));
    },
  };

  D.svd = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const a = rad(v.angle), b = rad(v.input), s2 = v.rank === 1 ? 0 : v.s2;
      const f = L.fig(ctx.host, { x: [-3.3, 3.3], y: [-2.5, 2.5], equal: true, maxH: 470 });
      const rot = (th, [x, y]) => [x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th)];
      const ease = (s) => (s < 0.5 ? 2 * s * s : 1 - 2 * (1 - s) ** 2);
      // stage 0 to 3: Vᵀ (rotate by -b), then Σ, then U (rotate by a)
      const map = (p, st) => {
        const s1 = Math.min(1, Math.max(0, st)), s2t = Math.min(1, Math.max(0, st - 1)), s3 = Math.min(1, Math.max(0, st - 2));
        let q = rot(-b * ease(s1), p);
        q = [q[0] * (1 + (v.s1 - 1) * ease(s2t)), q[1] * (1 + (s2 - 1) * ease(s2t))];
        return rot(a * ease(s3), q);
      };
      const ring = circle(), samples = L.seq(8, (i) => [Math.cos(L.TAU * i / 8), Math.sin(L.TAU * i / 8)]);
      f.line(ring, { c: 'muted', w: 1.1, dash: '3 4', op: 0.7, layer: 'under' });
      // Right singular vectors: the columns of V. Vᵀ sends v₁ to e₁ and v₂ to e₂, so their images are σ₁u₁ and σ₂u₂.
      const v1 = [Math.cos(b), Math.sin(b)], v2 = [-Math.sin(b), Math.cos(b)];
      // The rank-one truncation A₁ = σ₁u₁v₁ᵀ sends the unit circle onto the segment from −σ₁u₁ to σ₁u₁.
      const u1 = [Math.cos(a), Math.sin(a)];
      const full = v.rank === 2 && v.s2 > 1e-9;
      if (full) f.line([[-v.s1 * u1[0], -v.s1 * u1[1]], [v.s1 * u1[0], v.s1 * u1[1]]], { c: 'c2', w: 2, dash: '7 5', op: 0.55, layer: 'under' });
      const names = [T('input', '入力'), T('after Vᵀ: rotate', 'Vᵀ の後：回転'), T('after Σ: stretch', 'Σ の後：伸縮'), T('after U: rotate', 'U の後：回転')];
      const draw = (st) => {
        f.clear('main'); f.clear('over');
        f.poly(ring.map((p) => map(p, st)), { c: 'c1', fo: 0.12, w: 2.2 });
        const e1 = map(v1, st), e2 = map(v2, st);
        f.arrow([0, 0], e1, { c: 'c2', w: 2.8 });
        if (Math.hypot(...e2) > 1e-3) f.arrow([0, 0], e2, { c: 'c3', w: 2.8 });
        samples.forEach((p, i) => { const q = map(p, st); f.dot(q[0], q[1], { c: 'hl', r: 4 }); f.text(q[0], q[1], String(i), { small: true, dx: 9, dy: -7 }); });
      };
      const DUR = 4.2;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const st = Math.min(3, t / DUR * 3.3);
        draw(st);
        label.textContent = names[Math.min(3, Math.ceil(st - 1e-6))] || names[0];
        return t < DUR;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play Vᵀ, Σ, U', 'Vᵀ、Σ、U を再生') });
      const legend = [{ c: 'muted', dash: true, label: T('Unit circle', '単位円') }, { kind: 'fill', c: 'c1', label: v.rank === 1 ? T('Image under A₁ (rank one)', 'A₁（階数1）による像') : T('Its image under A', 'A による像') }, { c: 'c2', label: 'v₁ ↦ σ₁u₁' }, { kind: 'dot', c: 'hl', label: T('Numbered sample points', '番号付きの標本点') }];
      if (s2 > 1e-9) legend.splice(3, 0, { c: 'c3', label: 'v₂ ↦ σ₂u₂' });
      if (full) legend.splice(2, 0, { c: 'c2', dash: true, label: T('Rank-one image A₁: the segment ±σ₁u₁', '階数1の像 A₁：線分 ±σ₁u₁') });
      L.legend(ctx.host, legend);
      ctx.readout([{ k: 'σ₁', v: fmt(v.s1) }, { k: 'σ₂', v: fmt(v.s2) }, { k: T('Rank shown', '表示中の階数'), v: String(s2 > 1e-9 ? 2 : 1) }, { k: '‖A − A₁‖₂', v: fmt(v.s2), tone: 'key' }], v.rank === 1
        ? T('The figure shows A₁ = σ₁u₁v₁ᵀ, whose image is the segment. The dropped stretch σ₂ is the error ‖A − A₁‖₂.', '図は A₁ = σ₁u₁v₁ᵀ を示し、その像は線分です。除いた伸縮 σ₂ が誤差 ‖A − A₁‖₂ です。')
        : T('Play to watch A = UΣVᵀ act in three steps: rotate, stretch, rotate. The dashed segment is the rank-one image.', '再生すると A = UΣVᵀ が回転、伸縮、回転の3段階で作用する様子が見えます。破線の線分は階数1の像です。'));
    },
  };
})();
