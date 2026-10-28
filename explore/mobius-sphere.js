/* Möbius maps on the Riemann sphere: the z-sphere and its image under w = T(z). */
import { create } from '/math-labs/three3d.js';

const ja = document.documentElement.lang.startsWith('ja');
const t = (en, jp) => (ja ? jp : en);
const root = document.querySelector('[data-mobius3d]');
const Z = (re, im = 0) => ({ re, im });
const add = (a, b) => Z(a.re + b.re, a.im + b.im), mul = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a, b) => { const d = b.re * b.re + b.im * b.im; return d < 1e-18 ? null : Z((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const MAPS = {
  cayley: { label: t('Cayley map (z − i)/(z + i)', 'ケイリー写像 (z − i)/(z + i)'), a: Z(1), b: Z(0, -1), c: Z(1), d: Z(0, 1) },
  inversion: { label: t('Inversion 1/z', '反転 1/z'), a: Z(0), b: Z(1), c: Z(1), d: Z(0) },
  fraction: { label: t('(z − 1)/(z + 1)', '(z − 1)/(z + 1)'), a: Z(1), b: Z(-1), c: Z(1), d: Z(1) },
  translation: { label: t('Translation z + 0.8 + 0.4i', '平行移動 z + 0.8 + 0.4i'), a: Z(1), b: Z(0.8, 0.4), c: Z(0), d: Z(1) },
  rotate: { label: t('Rotate and scale 1.2e^(iπ/4) z', '回転・拡大 1.2e^(iπ/4) z'), a: Z(1.2 * Math.SQRT1_2, 1.2 * Math.SQRT1_2), b: Z(0), c: Z(0), d: Z(1) },
  loxodromic: { label: t('Spiral (2 + i) z', '螺旋 (2 + i) z'), a: Z(2, 1), b: Z(0), c: Z(0), d: Z(1) },
};
const state = { map: 'cayley' };
let S = null, parts = null, started = false;

const lift = (z) => {
  if (!z) return [0, 0, 1];
  const r2 = z.re * z.re + z.im * z.im;
  if (!Number.isFinite(r2) || r2 > 1e12) return [0, 0, 1];
  return [(2 * z.re) / (r2 + 1), (2 * z.im) / (r2 + 1), (r2 - 1) / (r2 + 1)];
};
const T = (m) => (z) => div(add(mul(m.a, z), m.b), add(mul(m.c, z), m.d));
const SPREAD = 1.55, RAD = 1;

function curves(fn) {
  const fam = { h: [], v: [], circ: [], ring: [] };
  const wsteps = Array.from({ length: 221 }, (_, i) => 4 * Math.sinh(-3.4 + (6.8 * i) / 220));
  const line = (mk) => { const pts = [[0, 0, 1], ...wsteps.map((s) => lift(fn(mk(s)))), [0, 0, 1]]; return pts; };
  for (let k = -2; k <= 2; k++) { fam.h.push(line((s) => Z(s, k))); fam.v.push(line((s) => Z(k, s))); }
  for (const rho of [0.5, 2]) fam.ring.push(Array.from({ length: 121 }, (_, i) => lift(fn(Z(rho * Math.cos((2 * Math.PI * i) / 120), rho * Math.sin((2 * Math.PI * i) / 120))))));
  fam.circ = Array.from({ length: 181 }, (_, i) => lift(fn(Z(Math.cos((2 * Math.PI * i) / 180), Math.sin((2 * Math.PI * i) / 180)))));
  return fam;
}
const place = (pts, dx, k = 1.014) => pts.map((p) => [dx + RAD * k * p[0], RAD * k * p[1], RAD * k * p[2]]);
const segs = (pts) => { const s = []; for (let i = 0; i + 1 < pts.length; i++) s.push([pts[i], pts[i + 1]]); return s; };

function refresh() {
  const m = MAPS[state.map], f = T(m);
  const det = add(mul(m.a, m.d), mul({ re: -1, im: 0 }, mul(m.b, m.c)));
  const cz = Math.hypot(m.c.re, m.c.im) < 1e-9;
  const pole = cz ? null : div(mul({ re: -1, im: 0 }, m.d), m.c);
  const img = cz ? null : div(m.a, m.c);
  const cx = (z) => (!z ? '∞' : `${z.re.toFixed(2).replace(/\.?0+$/, '') || '0'} ${z.im < 0 ? '−' : '+'} ${Math.abs(z.im).toFixed(2).replace(/\.?0+$/, '') || '0'}i`);
  root.querySelector('[data-read]').innerHTML = [[t('Pole −d/c', '極 −d/c'), cz ? '∞' : cx(pole)], [t('T(∞)', 'T(∞)'), cz ? '∞' : cx(img)], [t('Determinant', '行列式'), cx(det)], [t('Circles', '円'), t('stay circles on the sphere', '球面上で円のまま')]].map(([k, v]) => `<div class="readout-item"><span>${k}</span><strong>${v}</strong></div>`).join('');
  if (!parts) return;
  const id = (z) => z, A = curves(id), B = curves(f);
  const dxA = -SPREAD, dxB = SPREAD;
  const flatten = (list, dx) => list.flatMap((p) => segs(place(p, dx)));
  parts.hA.update(flatten(A.h, dxA)); parts.vA.update(flatten(A.v, dxA));
  parts.hB.update(flatten(B.h, dxB)); parts.vB.update(flatten(B.v, dxB));
  parts.cA.update(place(A.circ, dxA, 1.006)); parts.cB.update(place(B.circ, dxB, 1.006));
  parts.rA.update(flatten(A.ring, dxA)); parts.rB.update(flatten(B.ring, dxB));
  const at = (p, dx) => [dx + RAD * 1.01 * p[0], RAD * 1.01 * p[1], RAD * 1.01 * p[2]];
  parts.pole.at(at(lift(pole), dxA)); parts.poleImg.at(at([0, 0, 1], dxB));
  parts.inf.at(at([0, 0, 1], dxA)); parts.infImg.at(at(lift(img), dxB));
  parts.pole.visible = parts.poleImg.visible = !cz;
  S.invalidate();
}

function build() {
  root.innerHTML = `
    <div class="lesson-workbench m3d">
      <div class="workbench-bar"><span class="workbench-status">${t('Riemann sphere', 'リーマン球面')}</span><p>${t('Drag to turn both spheres together. Lines of the plane become circles through the north pole (∞); every circle stays a circle.', 'ドラッグで二つの球を一緒に回します。平面の直線は北極 (∞) を通る円になり、円はすべて円のままです。')}</p></div>
      <div class="workbench-grid">
        <div class="workbench-controls">
          <div class="control-group"><label class="control-label" for="m3d-map">${t('Transformation', '変換')}</label><select class="lesson-select" id="m3d-map">${Object.entries(MAPS).map(([k, v]) => `<option value="${k}" ${k === state.map ? 'selected' : ''}>${v.label}</option>`).join('')}</select><p class="control-note">${t('Each sphere is the plane wrapped by inverse stereographic projection: the south pole is 0, the equator is the unit circle, the north pole is ∞.', '各球は平面を逆立体射影で包んだものです。南極が 0、赤道が単位円、北極が ∞ です。')}</p></div>
        </div>
        <div class="workbench-stage"><div class="math-wrap m3d-tokens" data-host></div><p class="m3d-note" data-note hidden>${t('This browser cannot draw the 3D view. The flat grids above show the same map.', 'このブラウザでは 3D 表示ができません。上の平面の格子が同じ写像を表しています。')}</p></div>
      </div>
      <div class="m3d-legend"><span><i style="background:var(--teal)"></i>${t('horizontal lines Im z = k', '水平線 Im z = k')}</span><span><i style="background:var(--coral)"></i>${t('vertical lines Re z = k', '鉛直線 Re z = k')}</span><span><i style="background:var(--gold)"></i>${t('unit circle', '単位円')}</span><span><i style="background:var(--ink-soft)"></i>${t('circles |z| = 1/2 and 2', '円 |z| = 1/2, 2')}</span></div>
      <div class="readout-grid" data-read aria-live="polite"></div>
    </div>`;
}

async function init() {
  if (started) return; started = true;
  const host = root.querySelector('[data-host]');
  const vw = window.innerWidth, w = host.clientWidth || 680, h = vw <= 780 ? Math.min(1.12 * vw, 480) : Math.min(580, Math.max(420, 0.5 * vw));
  const d = Math.max(6, 2.95 / (Math.tan(Math.PI / 12) * Math.min(w / h, 1.7)));
  S = await create(host, { aspect: 0.5, maxH: 580, camera: [0.07 * d, -0.93 * d, 0.34 * d], target: [0, 0, 0], fov: 30, label: t('Two Riemann spheres: the plane and its image under a Möbius map. Drag to rotate.', '二つのリーマン球面：平面とそのメビウス変換による像。ドラッグで回転できます。') }).catch(() => null);
  if (!S) { host.hidden = true; root.querySelector('[data-note]').hidden = false; return; }
  const C = S.cols, THREE = S.THREE;
  const body = C.c1.clone().lerp(C.plate, 0.8);
  for (const dx of [-SPREAD, SPREAD]) {
    S.surface((th, ph) => [dx + RAD * Math.sin(th) * Math.cos(ph), RAD * Math.sin(th) * Math.sin(ph), RAD * Math.cos(th)], { u: [0, Math.PI], v: [0, 2 * Math.PI], nu: 48, nv: 96, colour: (th) => body.clone().lerp(C.c3, 0.1 * (1 - Math.cos(th)) / 2), rough: 0.55, coat: 0.25 });
  }
  const L = (c, w, o = 0.95) => S.lines([], { c, w, opacity: o });
  parts = { hA: L('c3', 2.4), vA: L('c2', 2.4), hB: L('c3', 2.4), vB: L('c2', 2.4), rA: L('muted', 1.6, 0.8), rB: L('muted', 1.6, 0.8) };
  parts.cA = S.tube([[0, 0, 0], [1, 0, 0]], { c: 'hl', r: 0.012, n: 180 }); parts.cB = S.tube([[0, 0, 0], [1, 0, 0]], { c: 'hl', r: 0.012, n: 180 });
  parts.pole = S.sphere([0, 0, 0], 0.055, { c: 'c2', glow: 0.3 }); parts.poleImg = S.sphere([0, 0, 0], 0.055, { c: 'c2', glow: 0.3 });
  parts.inf = S.sphere([0, 0, 0], 0.055, { c: 'ink' }); parts.infImg = S.sphere([0, 0, 0], 0.055, { c: 'ink' });
  S.label('z', [-SPREAD, 0, 1.3], { math: true, c: 'ink' });
  S.label('w = T(z)', [SPREAD, 0, 1.3], { math: true, c: 'ink' });
  S.label('∞', [-SPREAD, 0, 1.12], { c: 'muted', small: true }); S.label('∞', [SPREAD, 0, 1.12], { c: 'muted', small: true });
  refresh(); S.settle(3000);
}

if (root) {
  build();
  root.querySelector('#m3d-map').addEventListener('change', (e) => { state.map = e.target.value; refresh(); });
  refresh();
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); init(); } }, { rootMargin: '400px' }); io.observe(root); } else init();
}
