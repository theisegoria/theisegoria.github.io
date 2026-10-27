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

  // ---------- 2. determinant as signed volume ----------
  // A = [[a, c, p], [0, d, q], [0, 0, k]]: the first two columns lie in the floor, so det A = a d k.
  const detCols = (v, s = 1) => {
    const m = (x, y) => x + (y - x) * s;
    return [[m(1, v.a), 0, 0], [m(0, v.c), m(1, v.d), 0], [m(0, v.p ?? 0), m(0, v.q ?? 0), m(1, v.k ?? 1)]];
  };
  const det3 = ([u, w, z]) => u[0] * (w[1] * z[2] - w[2] * z[1]) - w[0] * (u[1] * z[2] - u[2] * z[1]) + z[0] * (u[1] * w[2] - u[2] * w[1]);
  function rank3(cols) {
    const M = [0, 1, 2].map((i) => cols.map((c) => c[i]));
    let r = 0;
    for (let c = 0; c < 3 && r < 3; c++) {
      let piv = r; for (let i = r; i < 3; i++) if (Math.abs(M[i][c]) > Math.abs(M[piv][c])) piv = i;
      if (Math.abs(M[piv][c]) < 1e-9) continue;
      [M[r], M[piv]] = [M[piv], M[r]];
      for (let i = r + 1; i < 3; i++) { const f = M[i][c] / M[r][c]; for (let j = c; j < 3; j++) M[i][j] -= f * M[r][j]; }
      r++;
    }
    return r;
  }
  // orthographic view of 3D points for the no-3D fallbacks: camera position (looking at target), z up
  function ortho(cam, target) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nrm = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const F = nrm(sub(target, cam)), R = nrm(cr(F, [0, 0, 1])), U = cr(R, F);
    return { P: (q) => [dt(q, R), dt(q, U)], depth: (q) => dt(q, F) };
  }
  function orthoFig(host, pts, O) {
    const xs = pts.map((q) => O.P(q)[0]), ys = pts.map((q) => O.P(q)[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), m = 0.12 * Math.max(x1 - x0, y1 - y0);
    return L.fig(host, { axes: false, grid: false, equal: true, x: [x0 - m, x1 + m], y: [y0 - m, y1 + m], maxH: 400 });
  }
  const easeIO = (s) => (s < 0.5 ? 2 * s * s : 1 - 2 * (1 - s) ** 2);
  const CUBE_FACES = [[0, 2, 3, 1], [4, 5, 7, 6], [0, 1, 5, 4], [2, 6, 7, 3], [0, 4, 6, 2], [1, 3, 7, 5]];
  const CUBE_EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const corners = ([u, w, z]) => L.seq(8, (n) => { const i = n & 1, j = (n >> 1) & 1, l = (n >> 2) & 1; return [0, 1, 2].map((r) => i * u[r] + j * w[r] + l * z[r]); });
  D.det = {
    three: true,
    render(ctx, v) {
      const st = ctx.state, DUR = 1.8;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('The unit cube (grey edges) and its image, the parallelepiped spanned by the columns Ae₁, Ae₂, Ae₃. Drag the three tips; drag elsewhere to turn the view.', '単位立方体（灰色の辺）とその像、列 Ae₁, Ae₂, Ae₃ が張る平行六面体です。三つの先端をドラッグでき、それ以外の場所をドラッグすると視点が回ります。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The floor face from above: the 2 × 2 block sends the unit square to the parallelogram spanned by Ae₁ and Ae₂, of area |ad|.', '上から見た底面です。2 × 2 の区画が単位正方形を Ae₁ と Ae₂ の張る平行四辺形に移し、その面積は |ad| です。'));
        st.g2 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame);
        st.leg = L.h('div', '', st.frame);
      }
      st.anim?.stop();
      st.g2.replaceChildren(); st.bar.replaceChildren(); st.leg.replaceChildren();
      const cols = detCols(v), det = det3(cols), base = v.a * v.d, rank = rank3(cols);
      // 2D: the floor face
      const f = L.fig(st.g2, { x: [-2.8, 2.8], y: [-2.3, 2.3], equal: true, maxH: 400 });
      L.seq(9, (i) => i - 4).forEach((i) => {
        f.line([[-4, i], [4, i]], { c: 'muted', w: 0.8, op: 0.22, layer: 'under' });
        f.line([[i, -4], [i, 4]], { c: 'muted', w: 0.8, op: 0.22, layer: 'under' });
      });
      f.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { c: 'muted', fo: 0.04, dash: '4 4', w: 1.1, layer: 'under' });
      const draw2d = (s) => {
        f.clear('main'); f.clear('over');
        const Ms = [1 + (v.a - 1) * s, v.c * s, 0, 1 + (v.d - 1) * s], dt = Ms[0] * Ms[3];
        grid(f, Ms, 5);
        const img = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => apply(Ms, p));
        f.poly(img, { c: dt < -1e-9 ? 'c2' : 'c1', fo: 0.26, w: 2 });
        f.arrow([0, 0], apply(Ms, [1, 0]), { c: 'c2', w: 2.8 });
        f.arrow([0, 0], apply(Ms, [0, 1]), { c: 'c3', w: 2.8 });
        const cen = apply(Ms, [0.5, 0.5]);
        if (Math.abs(dt) > 0.2) f.text(cen[0], cen[1], `${T('area', '面積')} ${fmt(Math.abs(dt), 2)}`, { dy: 4, layer: 'over' });
      };
      f.handle(v.a, 0, { c: 'c2', axis: 'x', snap: 0.1, bounds: [-2, 2, 0, 0], label: T('Tip of Ae₁', 'Ae₁ の先端'), onDrag: (x) => ctx.set('a', x) });
      f.handle(v.c, v.d, { c: 'c3', snap: 0.1, bounds: [-2, 2, -2, 2], label: T('Tip of Ae₂', 'Ae₂ の先端'), onDrag: (x, y) => { ctx.set('c', x, true); ctx.set('d', y); } });
      const frameAt = (s) => { draw2d(s); st.e = s; st.shape3d?.(s); };
      st.anim = L.animator(st.bar, (dt, t, label) => {
        const s = Math.min(1, t / DUR), e = easeIO(s);
        frameAt(e);
        label.textContent = e < 1 ? T('from I to A', 'I から A へ') + ` · ${Math.round(e * 100)}%` : '';
        return s < 1;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play I → A', 'I → A を再生') });
      const neg = det < -1e-9;
      L.legend(st.leg, [
        { kind: 'fill', c: neg ? 'c2' : 'c1', label: neg ? T('Image of the unit cube, orientation reversed', '単位立方体の像（向きが反転）') : T('Image of the unit cube', '単位立方体の像') },
        { c: 'c2', label: 'Ae₁' }, { c: 'c3', label: 'Ae₂' }, { c: 'c4', label: T('Ae₃, at height k above the floor', 'Ae₃（床からの高さ k）') },
      ]);
      ctx.readout([
        { k: 'det A = a·d·k', v: fmt(det), tone: 'key' },
        { k: T('base area |ad|', '底面積 |ad|'), v: fmt(Math.abs(base)) },
        { k: T('height |k|', '高さ |k|'), v: fmt(Math.abs(v.k)) },
        { k: T('Rank', '階数'), v: String(rank), tone: rank < 3 ? 'warn' : undefined },
        { k: T('Orientation', '向き'), v: neg ? T('reversed', '反転') : det > 1e-9 ? T('kept', '保存') : T('collapsed', '潰れる') },
      ], rank < 3 ? T('A zero factor flattens the solid: the volume is zero and the columns span only a plane or a line.', '因子が一つでも 0 だと立体は潰れ、体積は 0 で、列は平面か直線しか張りません。') : T('Moving the top vector sideways (p and q) shears the solid without changing its volume: base times height is unchanged.', '上のベクトルを横に動かす（p と q）と立体はせん断されますが、底面積 × 高さは変わらないので体積も変わりません。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 440, camera: [3.9, -4.4, 3.1], target: [0.35, 0.35, 0.45], fov: 34,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          S.floor({ size: 2.5, n: 10, z: 0 });
          S.axes({ len: 2.4, negFrac: 0.35 });
          S.lines(CUBE_EDGES.map(([i, j]) => { const P = corners([[1, 0, 0], [0, 1, 0], [0, 0, 1]]); return [P[i], P[j]]; }), { c: 'muted', opacity: 0.75 });
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
          st.solidMat = S.mat('c1', { opacity: 0.42, rough: 0.45, coat: 0.3 });
          st.solid = new THREE.Mesh(geo, st.solidMat); S.add(st.solid);
          const bgeo = new THREE.BufferGeometry();
          bgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
          st.baseMat = S.mat('c1', { opacity: 0.5, rough: 0.6 });
          st.base = new THREE.Mesh(bgeo, st.baseMat); S.add(st.base);
          st.edges = S.lines(CUBE_EDGES.map(() => [[0, 0, 0], [0, 0, 0]]), { c: 'ink', opacity: 0.8 });
          st.drop = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c4', opacity: 0.7 });
          st.ar = [S.arrow([0, 0, 0], [1, 0, 0], { c: 'c2', r: 0.03 }), S.arrow([0, 0, 0], [0, 1, 0], { c: 'c3', r: 0.03 }), S.arrow([0, 0, 0], [0, 0, 1], { c: 'c4', r: 0.03 })];
          const snap = (x, lo, hi) => L.clamp(Math.round(x * 10) / 10, lo, hi);
          st.h = [
            S.handle([1, 0, 0], { c: 'c2', r: 0.085, label: 'Ae₁', plane: [[0, 0, 1], [0, 0, 0]], onDrag: (q) => { const a = snap(q.x, -2, 2); ctx.set('a', a); return [a, 0, 0]; } }),
            S.handle([0, 1, 0], { c: 'c3', r: 0.085, label: 'Ae₂', plane: [[0, 0, 1], [0, 0, 0]], onDrag: (q) => { const c = snap(q.x, -2, 2), d = snap(q.y, -2, 2); ctx.set('c', c, true); ctx.set('d', d); return [c, d, 0]; } }),
            S.handle([0, 0, 1], { c: 'c4', r: 0.085, label: 'Ae₃', plane: [[0, 0, 1], [0, 0, 1]], onDrag: (q) => { const p = snap(q.x, -1.5, 1.5), qq = snap(q.y, -1.5, 1.5); ctx.set('p', p, true); ctx.set('q', qq); return [p, qq, st.v.k]; } }),
          ];
          st.kLab = S.label('k', [0, 0, 0.5], { math: true, c: 'c4' });
          st.volLab = S.label('', [0.5, 0.5, 0.5], { small: true, align: 'middle' });
          st.shape3d = (s) => {
            const C = detCols(st.v, s), P = corners(C), dt = det3(C);
            const pos = st.solid.geometry.attributes.position.array;
            let o = 0;
            CUBE_FACES.forEach((fc) => [fc[0], fc[1], fc[2], fc[0], fc[2], fc[3]].forEach((n) => { pos[o++] = P[n][0]; pos[o++] = P[n][1]; pos[o++] = P[n][2]; }));
            st.solid.geometry.attributes.position.needsUpdate = true; st.solid.geometry.computeVertexNormals(); st.solid.geometry.computeBoundingSphere();
            const bp = st.base.geometry.attributes.position.array, z0 = 0.004;
            [0, 1, 3, 0, 3, 2].forEach((n, i) => { bp[3 * i] = P[n][0]; bp[3 * i + 1] = P[n][1]; bp[3 * i + 2] = z0; });
            st.base.geometry.attributes.position.needsUpdate = true; st.base.geometry.computeVertexNormals(); st.base.geometry.computeBoundingSphere();
            const tone = dt < -1e-9 ? 'c2' : 'c1';
            st.solidMat.color.copy(S.colour(tone)); st.baseMat.color.copy(S.colour(tone));
            st.edges.update(CUBE_EDGES.map(([i, j]) => [P[i], P[j]]));
            st.drop.update([[C[2], [C[2][0], C[2][1], 0]]]);
            C.forEach((c, i) => { st.ar[i].visible = Math.hypot(...c) > 1e-6; if (st.ar[i].visible) st.ar[i].set([0, 0, 0], c); st.h[i].at(c); });
            st.h[2].userData.handle.plane = [[0, 0, 1], [0, 0, C[2][2]]];
            st.kLab.set([C[2][0] + 0.08, C[2][1], C[2][2] / 2]);
            st.kLab.el.style.opacity = Math.abs(C[2][2]) > 0.25 ? '' : '0';
            const cen = P.reduce((acc, q) => acc.map((x, i) => x + q[i] / 8), [0, 0, 0]);
            st.volLab.set(cen, `det = ${fmt(dt, 2)}`);
            S.invalidate();
          };
        },
        update(S, vv) { st.v = vv; st.shape3d(st.e ?? 1); },
        fallback() {
          st.flat = true; st.shape3d = null;
          st.v3.replaceChildren();
          st.cap1.textContent = T('The unit cube (grey dashed edges) and its image, the parallelepiped spanned by Ae₁, Ae₂, Ae₃, in a fixed oblique view.', '単位立方体（灰色の破線）とその像、Ae₁, Ae₂, Ae₃ の張る平行六面体を、固定した斜めの視点から描いています。');
          const O = ortho([3.9, -4.4, 3.1], [0.35, 0.35, 0.45]), C = detCols(v), Pc = corners(C), U = corners([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
          const ax = [[2.2, 0, 0], [0, 2.2, 0], [0, 0, 2.2]];
          const f = orthoFig(st.v3, [...Pc, ...U, ...ax, [-0.6, 0, 0], [0, -0.6, 0]], O);
          ax.forEach((a, i) => { f.arrow(O.P(a.map((x) => -0.3 * x)), O.P(a), { c: 'muted', w: 1, op: 0.7 }); f.text(...O.P(a), 'xyz'[i], { math: true, c: 'muted', dx: 6 }); });
          CUBE_EDGES.forEach(([i, j]) => f.line([O.P(U[i]), O.P(U[j])], { c: 'muted', w: 1, dash: '3 3', op: 0.8 }));
          const tone = det < -1e-9 ? 'c2' : 'c1';
          CUBE_FACES.map((fc) => ({ fc, d: fc.reduce((acc, k) => acc + O.depth(Pc[k]), 0) })).sort((p1, p2) => p2.d - p1.d)
            .forEach(({ fc }) => f.poly(fc.map((k) => O.P(Pc[k])), { c: tone, fo: 0.16, w: 1.1 }));
          f.line([O.P(C[2]), O.P([C[2][0], C[2][1], 0])], { c: 'c4', w: 1.2, dash: '4 3' });
          ['c2', 'c3', 'c4'].forEach((c, i) => { if (Math.hypot(...C[i]) > 1e-6) { f.arrow(O.P([0, 0, 0]), O.P(C[i]), { c, w: 2.6 }); f.text(...O.P(C[i]), `Ae${'₁₂₃'[i]}`, { c, dx: 8, dy: -6, small: true }); } });
        },
      });
      st.v = v;
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

  // ---------- 4. least squares as projection onto the column space ----------
  // Fit y = x0 + x1 t to (0, b1), (1, b2), (2, b3): A = [1 0; 1 1; 1 2], AᵀA = [3 3; 3 5].
  function lsq(b) {
    const s0 = b[0] + b[1] + b[2], s1 = b[1] + 2 * b[2];
    const x0 = (5 * s0 - 3 * s1) / 6, x1 = (s1 - s0) / 2;
    const p = [x0, x0 + x1, x0 + 2 * x1], e = b.map((y, i) => y - p[i]);
    return { x0, x1, p, e, atb: [s0, s1], e2: e.reduce((s, y) => s + y * y, 0) };
  }
  const sub3 = (u, w) => [u[0] - w[0], u[1] - w[1], u[2] - w[2]];
  const add3 = (u, w, k = 1) => [u[0] + k * w[0], u[1] + k * w[1], u[2] + k * w[2]];
  const unit3 = (u) => { const l = Math.hypot(...u) || 1; return u.map((x) => x / l); };
  D.projection = {
    three: true,
    render(ctx, v) {
      const st = ctx.state, b = [v.b1, v.b2, v.b3], F = lsq(b);
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, T('ℝ³, one axis per data point. The blue plane is every vector Ax, the column space of A. Drag b; drag elsewhere to turn the view.', 'データ点ごとに一つの軸をとった ℝ³ です。青い平面は Ax の全体、つまり A の列空間です。b をドラッグでき、それ以外の場所をドラッグすると視点が回ります。'));
        st.v3 = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('The same fit as data: drag the three points. The orange misses are the three components of e.', '同じ当てはめをデータとして見た図です。三つの点をドラッグできます。橙色のずれが e の三つの成分です。'));
        st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      st.g2.replaceChildren(); st.leg.replaceChildren();
      // 2D: data and fitted line
      const g = L.fig(st.g2, { x: [-0.5, 2.5], y: [-0.6, 3.6], aspect: 1.05, maxH: 420, xlabel: 't', ylabel: 'y', ticksX: [[0, '0'], [1, '1'], [2, '2']] });
      g.line([[-0.5, F.x0 - 0.5 * F.x1], [2.5, F.x0 + 2.5 * F.x1]], { c: 'c1', w: 2.4 });
      [0, 1, 2].forEach((t) => {
        if (Math.abs(F.e[t]) > 1e-3) g.line([[t, F.p[t]], [t, b[t]]], { c: 'c2', w: 2.4 });
        g.dot(t, F.p[t], { c: 'hl', r: 4.5 });
        if (Math.abs(F.e[t]) > 0.15) g.text(t, (F.p[t] + b[t]) / 2, `e${'₁₂₃'[t]}`, { c: 'c2', dx: 8, small: true, math: true });
        g.handle(t, b[t], { c: 'ink', axis: 'y', snap: 0.1, bounds: [t, t, 0, 3], label: T(`Data point ${t + 1}`, `データ点 ${t + 1}`), onDrag: (x, y) => ctx.set('b' + (t + 1), y) });
      });
      L.legend(st.leg, [
        { c: 'ink', kind: 'dot', label: T('data b = (b₁, b₂, b₃)', 'データ b = (b₁, b₂, b₃)') },
        { c: 'hl', kind: 'dot', label: T('projection p = Ax̂: the fitted values', '射影 p = Ax̂：当てはめた値') },
        { c: 'c2', label: T('residual e = b − p, perpendicular to the plane', '残差 e = b − p（平面に垂直）') },
        { c: 'c1', label: T('column space of A, and the fitted line y = x̂₀ + x̂₁t', 'A の列空間と当てはめた直線 y = x̂₀ + x̂₁t') },
      ]);
      const ate = [F.e[0] + F.e[1] + F.e[2], F.e[1] + 2 * F.e[2]];
      ctx.readout([
        { k: T('x̂ = (intercept, slope)', 'x̂ =（切片, 傾き）'), v: `(${fmt(F.x0, 3)}, ${fmt(F.x1, 3)})`, tone: 'key' },
        { k: 'p = Ax̂', v: `(${fmt(F.p[0], 3)}, ${fmt(F.p[1], 3)}, ${fmt(F.p[2], 3)})` },
        { k: '‖e‖²', v: fmt(F.e2, 4) },
        { k: 'Aᵀe', v: `(${fmt(Math.abs(ate[0]) < 5e-10 ? 0 : ate[0], 3)}, ${fmt(Math.abs(ate[1]) < 5e-10 ? 0 : ate[1], 3)})`, tone: 'good' },
      ], F.e2 < 1e-9 ? T('The three points are collinear: b lies in the plane, so p = b and the residual vanishes.', '三点が一直線上にあります。b が平面上にあるので p = b で、残差は 0 です。') : T('Aᵀe = 0 says the residual is perpendicular to both columns, so to the whole plane: that is the normal equation AᵀAx̂ = Aᵀb.', 'Aᵀe = 0 は残差が両方の列に、したがって平面全体に垂直であることを表します。これが正規方程式 AᵀAx̂ = Aᵀb です。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 460, camera: [-2.0, -4.4, 5.2], target: [1.05, 1.05, 1.0], fov: 36,
        init(S) {
          st.flat = false;
          const q1 = unit3([1, 1, 1]), q2 = unit3([-1, 0, 1]), c0 = [1.3, 1.3, 1.3];
          const plane = (al, be) => add3(add3(c0, q1, al), q2, be);
          S.surface(plane, { u: [-2.3, 2.3], v: [-1.4, 1.4], nu: 2, nv: 2, c: 'c1', opacity: 0.2, rough: 0.7 });
          const segs = [];
          for (let i = -4; i <= 4; i++) segs.push([plane(i * 2.3 / 4, -1.4), plane(i * 2.3 / 4, 1.4)]);
          for (let j = -2; j <= 2; j++) segs.push([plane(-2.3, j * 1.4 / 2), plane(2.3, j * 1.4 / 2)]);
          S.lines(segs, { c: 'c1', opacity: 0.35 });
          S.axes({ len: 3.2, negFrac: 0.15, names: ['t = 0', 't = 1', 't = 2'] });
          S.arrow([0, 0, 0], [1, 1, 1], { c: 'muted', r: 0.022 });
          S.arrow([0, 0, 0], [0, 1, 2], { c: 'muted', r: 0.022 });
          S.label('a₁', [1.05, 1.05, 1.12], { math: true, c: 'muted' });
          S.label('a₂', [0, 0.95, 1.9], { math: true, c: 'muted', align: 'end' });
          st.bArrow = S.arrow([0, 0, 0], [1, 1, 1], { c: 'ink', r: 0.03 });
          st.pArrow = S.arrow([0, 0, 0], [1, 1, 1], { c: 'hl', r: 0.034, glow: 0.2 });
          st.eTube = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c2', r: 0.03 });
          st.combo = S.lines([[[0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]], { c: 'hl', opacity: 0.6 });
          st.corner = S.lines([[[0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]], { c: 'ink', opacity: 0.8 });
          st.pDot = S.sphere([0, 0, 0], 0.05, { c: 'hl' });
          st.pLab = S.label('p', [0, 0, 0], { math: true, c: 'hl' });
          st.eLab = S.label('e', [0, 0, 0], { math: true, c: 'c2' });
          const camDir = () => { const d = new S.THREE.Vector3(); S.camera.getWorldDirection(d); return [d.x, d.y, d.z]; };
          const ho = { c: 'ink', r: 0.075, label: 'b', onDrag: (q) => { const s = (x) => L.clamp(Math.round(x * 10) / 10, 0, 3); const nb = [s(q.x), s(q.y), s(q.z)]; ctx.set('b1', nb[0], true); ctx.set('b2', nb[1], true); ctx.set('b3', nb[2]); return nb; } };
          Object.defineProperty(ho, 'plane', { get: () => [camDir(), st.b] });
          st.bh = S.handle([0, 0, 0], ho);
        },
        update(S, vv) {
          const bb = [vv.b1, vv.b2, vv.b3], G = lsq(bb);
          st.b = bb;
          st.bArrow.set([0, 0, 0], bb); st.bh.at(bb);
          st.pArrow.visible = Math.hypot(...G.p) > 1e-6; if (st.pArrow.visible) st.pArrow.set([0, 0, 0], G.p);
          st.pDot.at(G.p);
          const el = Math.sqrt(G.e2);
          st.eTube.visible = el > 1e-3; if (el > 1e-3) st.eTube.update([G.p, bb]);
          const m1 = [G.x0, G.x0, G.x0];
          st.combo.update([[[0, 0, 0], m1], [m1, G.p]]);
          if (el > 0.12 && Math.hypot(...G.p) > 0.3) {
            const s = 0.16, ue = unit3(G.e), ud = unit3(G.p.map((x) => -x));
            st.corner.update([[add3(G.p, ue, s), add3(add3(G.p, ue, s), ud, s)], [add3(add3(G.p, ue, s), ud, s), add3(G.p, ud, s)]]);
          } else st.corner.update([[[0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0]]]);
          st.pLab.set(add3(G.p, [0.05, 0, -0.18]));
          st.eLab.set(add3(add3(G.p, G.e, 0.5), unit3(G.p), 0.12)); st.eLab.el.style.opacity = el > 0.25 ? '' : '0';
          S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          st.cap1.textContent = T('ℝ³, one axis per data point, in a fixed oblique view. The blue plane is the column space of A; e is perpendicular to it.', 'データ点ごとに一つの軸をとった ℝ³ を、固定した斜めの視点から描いています。青い平面は A の列空間で、e はそれに垂直です。');
          const O = ortho([-2.0, -4.4, 5.2], [1.05, 1.05, 1.0]), q1 = unit3([1, 1, 1]), q2 = unit3([-1, 0, 1]), c0 = [1.3, 1.3, 1.3];
          const pl = (al, be) => add3(add3(c0, q1, al), q2, be), corn = [pl(-2.3, -1.4), pl(2.3, -1.4), pl(2.3, 1.4), pl(-2.3, 1.4)];
          const ax = [[3.2, 0, 0], [0, 3.2, 0], [0, 0, 3.2]];
          const f = orthoFig(st.v3, [...corn, ...ax, b], O);
          ax.forEach((a, i) => { f.arrow(O.P([0, 0, 0]), O.P(a), { c: 'muted', w: 1, op: 0.7 }); f.text(...O.P(a), `t = ${i}`, { c: 'muted', small: true, dx: 4 }); });
          f.poly(corn.map(O.P), { c: 'c1', fo: 0.14, w: 1 });
          [[1, 1, 1], [0, 1, 2]].forEach((a, i) => { f.arrow(O.P([0, 0, 0]), O.P(a), { c: 'muted', w: 1.8 }); f.text(...O.P(a), `a${'₁₂'[i]}`, { c: 'muted', small: true, dx: 6 }); });
          f.arrow(O.P([0, 0, 0]), O.P(b), { c: 'ink', w: 2.2 });
          f.arrow(O.P([0, 0, 0]), O.P(F.p), { c: 'hl', w: 2.6 });
          f.line([O.P(F.p), O.P(b)], { c: 'c2', w: 2.6 });
          f.text(...O.P(b), 'b', { math: true, dx: 8, dy: -6 });
          f.text(...O.P(F.p), 'p', { math: true, c: 'hl', dx: 8, dy: 12 });
        },
      });
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
