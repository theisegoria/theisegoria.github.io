/* solids3d.mjs: the 3D view of the cone, cylinder-and-sphere and scaling tabs.
 * Built on the encyclopedia's three.js layer; lab.mjs keeps the SVG figures as the fallback. */
import { create } from '/math-labs/three3d.js';
import { onThemeChange } from '/assets/lab-kit/lab-kit.js';

const ja = document.documentElement.lang === 'ja';
const T = (en, jp) => (ja ? jp : en);
const TAU = Math.PI * 2;

async function build(host) {
  const S = await create(host, {
    aspect: 0.74, maxH: 470, camera: [9, -11.5, 6.6], target: [0, 0, 2.1], fov: 30,
    label: T('3D solid. Drag to rotate.', '3D立体。ドラッグで回転できます。'),
  });
  if (!S) return null;
  const THREE = S.THREE;
  const st = { r: 3, h: 4, k: 2, s: 1 };
  const P = (x, y, z) => [x * st.s, y * st.s, z * st.s];
  const groups = { cone: new THREE.Group(), solids: new THREE.Group(), scale: new THREE.Group() };
  const labels = { cone: [], solids: [], scale: [] };
  const lab = (id, text, p) => { const l = S.label(text, p, { math: true, occlude: false }); labels[id].push(l); return l; };

  /* ---- cone: surface, base, the right triangle of r, h and the slant height ---- */
  const cn = {};
  cn.surf = S.surface((u, v) => P(st.r * v * Math.cos(u), st.r * v * Math.sin(u), st.h * (1 - v)), { u: [0, TAU], v: [0, 1], nu: 72, nv: 10, c: 'c1', opacity: 0.55, wire: true, add: false });
  cn.base = S.surface((u, v) => P(st.r * v * Math.cos(u), st.r * v * Math.sin(u), 0), { u: [0, TAU], v: [0, 1], nu: 72, nv: 4, c: 'c1', opacity: 0.45, add: false });
  cn.tri = S.surface((u, v) => P(st.r * u, 0, st.h * (1 - u) * v), { u: [0, 1], v: [0, 1], nu: 8, nv: 8, c: 'hl', opacity: 0.3, add: false });
  cn.th = S.tube([P(0, 0, 0), P(0, 0, 4)], { r: 0.05, c: 'hl', add: false });
  cn.tr = S.tube([P(0, 0, 0), P(3, 0, 0)], { r: 0.05, c: 'c2', add: false });
  cn.ts = S.tube([P(3, 0, 0), P(0, 0, 4)], { r: 0.06, c: 'c3', add: false });
  cn.sq = S.polyline([P(0.3, 0, 0), P(0.3, 0, 0.3), P(0, 0, 0.3)], { c: 'ink', w: 1.6, opacity: 0.9, add: false });
  groups.cone.add(cn.surf, cn.base, cn.tri, cn.th, cn.tr, cn.ts, cn.sq);
  cn.lh = lab('cone', 'h', [0, 0, 2]); cn.lr = lab('cone', 'r', [1.5, 0, 0]); cn.ll = lab('cone', 'ℓ', [1.5, 0, 2]);
  const showCone = () => {
    const { r, h } = st;
    cn.surf.update(); cn.base.update(); cn.tri.update();
    cn.th.update([P(0, 0, 0), P(0, 0, h)]); cn.tr.update([P(0, 0, 0), P(r, 0, 0)]); cn.ts.update([P(r, 0, 0), P(0, 0, h)]);
    const q = Math.min(0.35, r * 0.2, h * 0.2); cn.sq.update([P(q, 0, 0), P(q, 0, q), P(0, 0, q)]);
    cn.lh.set(P(-0.1, 0, h / 2)); cn.lr.set(P(r / 2, 0, -0.05)); cn.ll.set(P(r / 2 + 0.2, 0, h / 2 + 0.15));
  };

  /* ---- cylinder and sphere with the same radius ---- */
  const sl = {};
  const cx = () => -(st.r + 0.6), sx = () => st.r + 0.6;
  sl.side = S.surface((u, v) => P(cx() + st.r * Math.cos(u), st.r * Math.sin(u), st.h * v), { u: [0, TAU], v: [0, 1], nu: 64, nv: 6, c: 'c1', opacity: 0.55, wire: true, add: false });
  sl.top = S.surface((u, v) => P(cx() + st.r * v * Math.cos(u), st.r * v * Math.sin(u), st.h), { u: [0, TAU], v: [0, 1], nu: 64, nv: 4, c: 'c1', opacity: 0.55, add: false });
  sl.bot = S.surface((u, v) => P(cx() + st.r * v * Math.cos(u), st.r * v * Math.sin(u), 0), { u: [0, TAU], v: [0, 1], nu: 64, nv: 4, c: 'c1', opacity: 0.45, add: false });
  sl.ball = S.surface((u, v) => P(sx() + st.r * Math.sin(u) * Math.cos(v), st.r * Math.sin(u) * Math.sin(v), st.r + st.r * Math.cos(u)), { u: [0, Math.PI], v: [0, TAU], nu: 40, nv: 64, c: 'c2', add: false });
  sl.ghost = S.surface((u, v) => P(sx() + st.r * Math.cos(u), st.r * Math.sin(u), 2 * st.r * v), { u: [0, TAU], v: [0, 1], nu: 64, nv: 2, c: 'c2', opacity: 0.12, add: false });
  sl.ghostTop = S.surface((u, v) => P(sx() + st.r * v * Math.cos(u), st.r * v * Math.sin(u), 2 * st.r), { u: [0, TAU], v: [0, 1], nu: 64, nv: 2, c: 'c2', opacity: 0.1, add: false });
  sl.hr = S.tube([P(0, 0, 0), P(0, 0, 1)], { r: 0.05, c: 'hl', add: false });
  groups.solids.add(sl.side, sl.top, sl.bot, sl.ball, sl.ghost, sl.ghostTop, sl.hr);
  sl.lh = lab('solids', 'h', [0, 0, 2]); sl.lc = lab('solids', T('cylinder', '円柱'), [0, 0, 0]); sl.ls = lab('solids', T('sphere', '球'), [0, 0, 0]);
  const showSolids = () => {
    const { r, h } = st;
    sl.side.update(); sl.top.update(); sl.bot.update(); sl.ball.update(); sl.ghost.update(); sl.ghostTop.update();
    sl.hr.update([P(cx() + r, 0, 0), P(cx() + r, 0, h)]);
    sl.lh.set(P(cx() + r + 0.1, 0, h / 2));
    sl.lc.set(P(cx(), 0, h + 0.3)); sl.ls.set(P(sx(), 0, 2 * r + 0.35));
  };

  /* ---- scaling: a unit cube and its k-times copy ---- */
  const sc = {};
  const boxEdges = (a, b) => {
    const [x0, y0, z0] = a, [x1, y1, z1] = b;
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
    return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([i, j]) => [c[i], c[j]]);
  };
  sc.big = S.box([1, 1, 1], [0.5, 0.5, 0.5], { c: 'c1', opacity: 0.4, add: false });
  sc.unit = S.box([1, 1, 1], [0.5, 0.5, 0.5], { c: 'c2', add: false });
  sc.edges = S.lines([], { c: 'ink', w: 1.4, opacity: 0.75, add: false });
  sc.grid = S.lines([], { c: 'ink', w: 1, opacity: 0.35, add: false });
  groups.scale.add(sc.big, sc.unit, sc.edges, sc.grid);
  sc.l1 = lab('scale', 'k', [0, 0, 0]); sc.l2 = lab('scale', 'k²', [0, 0, 0]); sc.l3 = lab('scale', 'k³', [0, 0, 0]);
  const showScale = () => {
    const k = st.k, s = 1.4;
    const q = (v) => v.map((x) => x * s);
    sc.big.scale.setScalar(k * s); sc.big.position.set(...q([k / 2, k / 2, k / 2]));
    sc.unit.scale.setScalar(s * 0.98); sc.unit.position.set(...q([0.5, 0.5, 0.5]));
    sc.big.visible = Math.abs(k - 1) > 0.05;
    const segs = [...boxEdges([0, 0, 0], [k, k, k]), ...(k > 1 ? [] : boxEdges([0, 0, 0], [1, 1, 1]))].map(([a, b]) => [q(a), q(b)]);
    sc.edges.update(segs);
    const g = [];
    for (let m = 1; m < k - 1e-9; m++) {
      g.push([[m, 0, 0], [m, 0, k]], [[0, 0, m], [k, 0, m]]); // front face y = 0
      g.push([[k, m, 0], [k, m, k]], [[k, 0, m], [k, k, m]]); // right face x = k
      g.push([[m, 0, k], [m, k, k]], [[0, m, k], [k, m, k]]); // top face z = k
    }
    sc.grid.update(g.map(([a, b]) => [q(a), q(b)]));
    sc.l1.set(q([k / 2, -0.15, -0.05])); sc.l2.set(q([k * 0.5, 0, k * 0.55])); sc.l3.set(q([k * 0.5, k * 0.5, k + 0.08]));
  };

  for (const g of Object.values(groups)) { g.visible = false; S.add(g); }
  showCone(); showSolids(); showScale();

  const fit = {
    cone: () => 4.4 / Math.max(st.r, st.h * 0.6, 2),
    solids: () => 5.4 / Math.max(2 * st.r + 0.6, 0.8 * Math.max(st.h, 2 * st.r)),
    scale: () => 1,
  };
  return {
    S,
    apply(id, p) {
      Object.assign(st, p);
      st.s = Math.min(1.6, fit[id]());
      for (const [name, g] of Object.entries(groups)) { g.visible = name === id; labels[name].forEach((l) => l.show(name === id)); }
      ({ cone: showCone, solids: showSolids, scale: showScale })[id]();
      S.look(id === 'scale' ? [7.2, -9.6, 5.4] : [9, -11.5, 6.6], id === 'scale' ? [1.6, 1.6, 1.8] : [0, 0, 2.1], true);
      S.invalidate();
    },
    dispose() { S.dispose(); },
  };
}

/* mount(host) -> { show(id, params), dispose() } or null when there is no WebGL */
export async function mount(host) {
  let cur = null, last = null, busy = false;
  const start = async () => {
    cur = await build(host).catch((e) => { console.warn('solids3d', e); return null; });
    if (cur && last) cur.apply(last.id, last.p);
    return cur;
  };
  if (!(await start())) return null;
  onThemeChange(async () => {
    if (busy) return; busy = true;
    try { cur?.dispose(); cur = null; await start(); } finally { busy = false; }
  });
  return {
    show(id, p) { last = { id, p: { ...p } }; cur?.apply(id, p); },
  };
}
