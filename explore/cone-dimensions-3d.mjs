/* cone-dimensions-3d.mjs: the cone of the figure above, in three dimensions, with its curved surface
 * unrolling into a circular sector. The height is shared with the 2D figure (the iframe) by postMessage. */
import { create } from '/math-labs/three3d.js';
import { onThemeChange } from '/assets/lab-kit/lab-kit.js';

const ja = document.documentElement.lang === 'ja';
const T = (en, jp) => (ja ? jp : en);
const R = 3;                                   // the radius the page keeps fixed
const TAU = Math.PI * 2;
const root = document.getElementById('cone3d-section');
const $ = (id) => document.getElementById(id);
const fmt = (x, d = 2) => Number(x.toFixed(d)).toLocaleString(ja ? 'ja-JP' : 'en', { minimumFractionDigits: d, maximumFractionDigits: d });
const st = { h: 4, u: 0 };
const frame = document.querySelector('iframe');

/* geometry of the partly unrolled cone: radius s along the slant, angle a (-theta/2..theta/2) in the flat sector.
 * Rolling the sector into a cone of half-angle beta with sin(beta) = m keeps every length (it is an isometry);
 * m runs from r/l (the closed cone) to 1 (flat). */
const geo = () => {
  const h = st.h, l = Math.hypot(R, h), m0 = R / l, theta = TAU * m0;
  const m = m0 + st.u * (1 - m0), cb = Math.sqrt(Math.max(0, 1 - m * m));
  return { h, l, m0, theta, m, cb };
};
const phiC = -Math.PI / 4;   // the flat sector faces the viewer; the seam of the closed cone is at the back
const pt = (s, a, g) => { const phi = phiC + a / g.m; return [s * g.m * Math.cos(phi), s * g.m * Math.sin(phi), (g.l - s) * g.cb]; };

async function build(host) {
  const S = await create(host, {
    aspect: 0.8, maxH: 520, camera: [7.4, -9.2, 5.8], target: [0, 0, 1.7], fov: 30,
    label: T('3D cone. Drag to rotate.', '3D円錐。ドラッグで回転できます。'),
  });
  if (!S) return null;
  const THREE = S.THREE;
  const lat = S.surface((u, v) => { const g = geo(); return pt(v * g.l, u * g.theta / 2, g); }, { u: [-1, 1], v: [0, 1], nu: 96, nv: 14, c: 'c1', opacity: 0.6, wire: true, wireEvery: 8, add: false });
  const base = S.surface((u, v) => [R * v * Math.cos(u), R * v * Math.sin(u), 0], { u: [0, TAU], v: [0, 1], nu: 72, nv: 4, c: 'c3', opacity: 0.42, add: false });
  const th = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.05, c: 'hl', add: false });
  const tr = S.tube([[0, 0, 0], [R, 0, 0]], { r: 0.05, c: 'c2', add: false });
  const seamA = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.05, c: 'ink', add: false });
  const seamB = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.05, c: 'ink', add: false });
  const rim = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.05, c: 'c2', add: false });
  const grp = new THREE.Group(); grp.add(lat, base, th, tr, seamA, seamB, rim); S.add(grp);
  const lh = S.label('h', [0, 0, 1], { math: true }), lr = S.label('r', [1, 0, 0], { math: true }), ll = S.label('ℓ', [1, 0, 1], { math: true });
  const lsec = S.label('', [0, 0, 0], { small: true });

  const ts = S.tube([[0, 0, 0], [0, 0, 1]], { r: 0.055, c: 'c3', add: false }); grp.add(ts);
  const larc = S.label(T('arc = 2πr', '弧 = 2πr'), [0, 0, 0], { small: true });
  const apply = () => {
    const g = geo(), closed = st.u < 0.02;
    lat.update();
    th.update([[0, 0, 0], [0, 0, g.h]]);
    tr.update([[0, 0, 0], [R * Math.cos(phiC), R * Math.sin(phiC), 0]]);
    ts.update([pt(0, 0, g), pt(g.l, 0, g)]);
    rim.update(Array.from({ length: 61 }, (_, i) => pt(g.l, (-0.5 + i / 60) * g.theta, g)));
    seamA.update(Array.from({ length: 12 }, (_, i) => pt((i / 11) * g.l, -g.theta / 2, g)));
    seamB.update(Array.from({ length: 12 }, (_, i) => pt((i / 11) * g.l, g.theta / 2, g)));
    // the base disc, the height and the radius belong to the closed cone; the two cut edges appear once it opens
    base.visible = closed; th.visible = closed; tr.visible = closed; seamA.visible = seamB.visible = !closed;
    lh.show(closed); lr.show(closed); larc.show(!closed); lsec.show(!closed);
    lh.set([-0.12, 0, g.h / 2]);
    lr.set([R * Math.cos(phiC) / 2, R * Math.sin(phiC) / 2, -0.08]);
    const mid = pt(g.l * 0.5, 0, g);
    ll.set([mid[0] + 0.05, mid[1], mid[2] + 0.12]);
    const ar = pt(g.l, 0, g); larc.set([ar[0] * 1.06, ar[1] * 1.06, ar[2] + 0.05]);
    const mid2 = pt(g.l * 0.45, g.theta * 0.18, g); lsec.set([mid2[0], mid2[1], mid2[2] + 0.1]);
    lsec.el.textContent = T('sector angle ', '中心角 ') + fmt(g.theta * 180 / Math.PI, 1) + '°';
    S.invalidate();
    return g;
  };
  return { S, apply, dispose: () => S.dispose() };
}

const readouts = () => {
  const g = geo();
  $('c3-l').textContent = fmt(g.l, 2);
  $('c3-v').textContent = fmt(Math.PI * R * R * g.h / 3, 2);
  $('c3-a').textContent = fmt(Math.PI * R * g.l, 2);
  $('c3-t').textContent = fmt(g.theta * 180 / Math.PI, 1) + '°';
  $('c3-hv').textContent = fmt(st.h, 1);
  $('c3-uv').textContent = Math.round(st.u * 100) + '%';
};

async function main() {
  if (!root) return;
  const host = $('cone3d-view'), sh = $('c3-h'), su = $('c3-u');
  let cur = null;
  const post = () => { try { frame?.contentWindow?.postMessage({ coneH: st.h }, '*'); } catch (e) { /* no frame */ } };
  const refresh = () => { readouts(); cur?.apply(); };
  const setH = (h, notify) => { st.h = Math.min(8, Math.max(1, Math.round(h * 10) / 10)); sh.value = String(st.h); refresh(); if (notify) post(); };
  // practice cards: "Show in the figure" sets the height, in the 2D figure and (when there is one) the 3D scene
  window.PracticeHosts = window.PracticeHosts || {};
  const hostObj = { set(v) { if (typeof v.h === 'number') setH(v.h, true); } };
  for (const id of ['slant', 'volume', 'unroll']) window.PracticeHosts['explore-cone-dimensions-' + id] = hostObj;
  window.addEventListener('message', (ev) => {
    if (frame && ev.source === frame.contentWindow && ev.data && typeof ev.data.coneH === 'number') setH(ev.data.coneH, false);
  });
  if (/[?&]flat\b/.test(location.search)) return;
  root.hidden = false;   // the scene needs a laid-out box to size itself
  cur = await build(host).catch((e) => { console.warn('cone3d', e); return null; });
  if (!cur) { root.hidden = true; return; }
  sh.addEventListener('input', () => setH(Number(sh.value), true));
  su.addEventListener('input', () => { st.u = Number(su.value); refresh(); });
  refresh();
  let busy = false;
  onThemeChange(async () => {
    if (busy) return; busy = true;
    try { cur?.dispose(); cur = await build(host).catch(() => null); cur?.apply(); } finally { busy = false; }
  });
}
main();
