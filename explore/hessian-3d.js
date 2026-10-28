/* The Hessian as a surface: z = (a x^2 + 2 b x y + c y^2) / 2, with its normal sections. */
import { create } from '/math-labs/three3d.js';

const ja = document.documentElement.lang.startsWith('ja');
const t = (en, jp) => (ja ? jp : en);
const root = document.querySelector('[data-hessian3d]');
const state = { a: 1.2, b: 0.4, c: -0.8, theta: 35 };
const num = (v, d = 2) => (Math.abs(v) < 10 ** -d / 2 ? '0' : v.toLocaleString(ja ? 'ja-JP' : 'en-US', { maximumFractionDigits: d }));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const PRESETS = [
  ['bowl', t('Bowl', '碗'), { a: 1.5, b: 0, c: 1 }],
  ['dome', t('Dome', 'ドーム'), { a: -1.5, b: 0, c: -1 }],
  ['saddle', t('Saddle', '鞍'), { a: 1.2, b: 0.4, c: -0.8 }],
  ['valley', t('Flat valley', '平らな谷'), { a: 1.5, b: 0, c: 0 }],
  ['twist', t('Rotated saddle', '回転した鞍'), { a: 0, b: 1.5, c: 0 }],
];

let ctl = null, S = null, parts = null, started = false;

function build() {
  root.innerHTML = `
    <div class="lesson-workbench m3d">
      <div class="workbench-bar"><span class="workbench-status">${t('Live surface', 'ライブ曲面')}</span><p>${t('Drag the surface to turn it. The gold curve is the cut along your direction; its bend at the origin is the number uᵀHu.', '曲面をドラッグして回します。金色の曲線は選んだ方向の切り口で、原点での曲がり具合が uᵀHu です。')}</p></div>
      <div class="workbench-grid">
        <div class="workbench-controls">
          <div class="control-group"><span class="control-label">${t('Start from a shape', '形から始める')}</span><div class="segmented" data-presets>${PRESETS.map(([k, label]) => `<button type="button" data-preset="${k}" aria-pressed="false">${label}</button>`).join('')}</div></div>
          ${[['a', 'a = H₁₁', -3, 3, 0.05], ['b', 'b = H₁₂', -3, 3, 0.05], ['c', 'c = H₂₂', -3, 3, 0.05], ['theta', t('direction θ (degrees)', '方向 θ（度）'), 0, 180, 1]].map(([k, label, lo, hi, st]) => `<div class="control-group"><label class="control-label" for="h3d-${k}">${label}</label><div class="range-row"><input class="lesson-range" id="h3d-${k}" data-key="${k}" type="range" min="${lo}" max="${hi}" step="${st}" value="${state[k]}"><output class="range-value" data-out="${k}"></output></div></div>`).join('')}
        </div>
        <div class="workbench-stage"><div class="math-wrap m3d-tokens" data-host></div><p class="m3d-note" data-note hidden>${t('This browser cannot draw the 3D view. The heat map above shows the same quadratic.', 'このブラウザでは 3D 表示ができません。上の色図が同じ二次式を表しています。')}</p></div>
      </div>
      <div class="m3d-legend"><span><i style="background:var(--teal)"></i>${t('surface above the plane (q > 0)', '平面より上の曲面 (q > 0)')}</span><span><i style="background:var(--coral)"></i>${t('below the plane (q < 0)', '平面より下 (q < 0)')}</span><span><i style="background:var(--gold)"></i>${t('cut along your direction', '選んだ方向の切り口')}</span><span><i style="background:var(--ink-soft)"></i>${t('principal curves (eigen-directions)', '主曲線（固有方向）')}</span></div>
      <div class="readout-grid" data-read aria-live="polite"></div>
      <div class="equation-strip" data-eq></div>
    </div>`;
}

function eig() {
  const { a, b, c } = state;
  const disc = Math.sqrt((a - c) ** 2 + 4 * b * b), l1 = (a + c + disc) / 2, l2 = (a + c - disc) / 2;
  const phi = 0.5 * Math.atan2(2 * b, a - c);
  return { l1, l2, phi, det: a * c - b * b };
}
const q = (x, y) => 0.5 * (state.a * x * x + 2 * state.b * x * y + state.c * y * y);

function refresh() {
  const { l1, l2, phi, det } = eig();
  const th = (state.theta * Math.PI) / 180;
  const u = [Math.cos(th), Math.sin(th)];
  const curv = state.a * u[0] * u[0] + 2 * state.b * u[0] * u[1] + state.c * u[1] * u[1];
  for (const k of Object.keys(state)) { const o = root.querySelector(`[data-out="${k}"]`); if (o) o.textContent = num(state[k], k === 'theta' ? 0 : 2); const i = root.querySelector(`[data-key="${k}"]`); if (i && document.activeElement !== i) i.value = state[k]; }
  let kind = t('inconclusive (flat direction)', '判定不能（平らな方向あり）');
  if (l2 > 1e-7) kind = t('local minimum', '局所最小'); else if (l1 < -1e-7) kind = t('local maximum', '局所最大'); else if (l1 > 1e-7 && l2 < -1e-7) kind = t('saddle', '鞍点');
  root.querySelector('[data-read]').innerHTML = [[t('Eigenvalue λ₁', '固有値 λ₁'), num(l1)], [t('Eigenvalue λ₂', '固有値 λ₂'), num(l2)], [t('Curvature along θ', 'θ 方向の曲率'), num(curv)], [t('Critical point', '臨界点'), kind]].map(([k, v]) => `<div class="readout-item"><span>${k}</span><strong>${v}</strong></div>`).join('');
  root.querySelector('[data-eq]').innerHTML = `<strong>u\u1d40Hu</strong> = ${num(curv)} \u00b7 \u03b8 = ${num(state.theta, 0)}\u00b0 \u00b7 H = [[${num(state.a)}, ${num(state.b)}], [${num(state.b)}, ${num(state.c)}]]`;
  if (!parts) return;
  const mx = Math.max(Math.abs(l1), Math.abs(l2));
  const R = mx < 0.85 ? 2 : Math.sqrt(3.4 / mx);
  parts.R = R;
  const zs = Math.max(1.2, 0.5 * mx * R * R);
  const col = (x, y, p) => parts.colour(clamp(p[2] / zs, -1, 1));
  parts.surf.update((s, v) => [R * s * Math.cos(v), R * s * Math.sin(v), q(R * s * Math.cos(v), R * s * Math.sin(v))], col);
  const curve = (ang, lift = 0.012) => Array.from({ length: 97 }, (_, i) => { const x = -R + (2 * R * i) / 96, X = x * Math.cos(ang), Y = x * Math.sin(ang); return [X, Y, q(X, Y) + lift]; });
  parts.cut.update(curve(th, 0.02));
  parts.e1.update(curve(phi, 0.006));
  parts.e2.update(curve(phi + Math.PI / 2, 0.006));
  const plane = (s, v) => [R * (2 * s - 1) * Math.cos(th), R * (2 * s - 1) * Math.sin(th), (2 * v - 1) * 2.0];
  parts.plane.update(plane);
  S.invalidate();
}

async function init() {
  if (started) return; started = true;
  const host = root.querySelector('[data-host]');
  S = await create(host, { aspect: 0.8, maxH: 640, camera: [7.2, -8.4, 5.4], target: [0, 0, 0.2], fov: 34, label: t('3D surface of the quadratic form. Drag to rotate.', '二次形式の 3D 曲面。ドラッグで回転できます。') }).catch(() => null);
  if (!S) { host.hidden = true; root.querySelector('[data-note]').hidden = false; return; }
  const C = S.cols, THREE = S.THREE;
  const mid = C.plate.clone().lerp(C.muted, 0.38);
  const colour = (v) => (v >= 0 ? mid.clone().lerp(C.c3, v) : mid.clone().lerp(C.c2, -v));
  parts = { colour };
  parts.surf = S.surface((s, v) => [s, v, 0], { u: [0, 1], v: [0, 2 * Math.PI], nu: 40, nv: 96, wire: true, wireEvery: 5, wireEveryV: 8, wireOpacity: 0.16, colour: () => mid, rough: 0.5, coat: 0.3 });
  parts.plane = S.surface((s, v) => [s, v, 0], { u: [0, 1], v: [0, 1], nu: 2, nv: 2, c: 'hl', opacity: 0.1, rough: 0.6, coat: 0, wire: false });
  const pts = Array.from({ length: 9 }, (_, i) => [i / 8, 0, 0]);
  parts.cut = S.tube(pts, { c: 'hl', r: 0.045, n: 96 });
  parts.e1 = S.tube(pts, { c: 'c3', r: 0.022, n: 96 });
  parts.e2 = S.tube(pts, { c: 'c4', r: 0.022, n: 96 });
  S.axes({ len: 2.3, names: ['x', 'y', 'z'] });
  parts.origin = S.sphere([0, 0, 0], 0.05, { c: 'ink' });
  refresh();
  S.settle(3000);
}

function wire() {
  root.querySelectorAll('[data-key]').forEach((el) => el.addEventListener('input', () => { state[el.dataset.key] = Number(el.value); markPreset(); refresh(); }));
  root.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => { const p = PRESETS.find((x) => x[0] === b.dataset.preset); Object.assign(state, p[2]); markPreset(b.dataset.preset); refresh(); }));
}
function markPreset(key) { root.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === key))); }

function set(values) {
  const v = values || {};
  for (const k of ['a', 'b', 'c', 'theta']) if (k in v) state[k] = Number(v[k]);
  markPreset(); refresh(); init();
  root.querySelector('.m3d')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
}

if (root) {
  build(); wire(); markPreset('saddle'); refresh();
  window.__h3dSet = set;
  if (window.__h3dPending) { set(window.__h3dPending); window.__h3dPending = null; }
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); init(); } }, { rootMargin: '400px' }); io.observe(root); } else init();
}
