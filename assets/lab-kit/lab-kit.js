/* lab-kit.js: the shared runtime for the site's interactive explainers.
 *
 * One module, no build step. It owns the boring but easy-to-get-wrong parts of
 * a canvas on a static page: WebGPU with a WebGL 2 fallback, resize at the
 * right pixel ratio, pausing when scrolled away or hidden, reduced-motion,
 * theme tokens from the stylesheet, context loss, and disposal. A lab imports
 * this and writes only its scene and its physics.
 *
 * Import map expected on the page (see tools/lab-template/index.html):
 *   three, three/webgpu -> /vendor/three/rNNN/build/three.webgpu.js
 *   three/tsl           -> /vendor/three/rNNN/build/three.tsl.js
 *   three/addons/       -> /vendor/three/rNNN/examples-jsm/
 */
import * as THREE from 'three/webgpu';

const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const darkQuery = matchMedia('(prefers-color-scheme: dark)');

/** Read CSS custom properties from the document (theme tokens) as strings. */
export function readTokens(names, el = document.documentElement) {
  const cs = getComputedStyle(el);
  const out = {};
  for (const n of names) out[n.replace(/^--/, '')] = cs.getPropertyValue(n).trim();
  return out;
}

/**
 * Same, but resolved to THREE.Color.
 *
 * The browser does the resolving, so light-dark(), color-mix() and oklch() all
 * work. setStyle is what converts: a CSS colour is sRGB, and handing its
 * components straight to a Color would have three.js read them as linear and
 * render everything several stops too bright.
 */
export function readColors(names, el) {
  const raw = readTokens(names, el);
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden';
  (el || document.body).appendChild(probe);
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    probe.style.color = '';
    probe.style.color = v;
    const css = getComputedStyle(probe).color;
    const c = new THREE.Color();
    try { c.setStyle(css, THREE.SRGBColorSpace); } catch { c.set(0x808080); }
    out[k] = c;
    out[k].css = css;
  }
  probe.remove();
  return out;
}

export const isDark = () =>
  document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : darkQuery.matches;

export const prefersReducedMotion = () => reducedMotionQuery.matches;

/** Call fn whenever the site theme flips (toggle button or OS setting). Returns a stop function. */
export function onThemeChange(fn) {
  const mo = new MutationObserver(() => fn(isDark()));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const h = () => fn(isDark());
  darkQuery.addEventListener('change', h);
  return () => { mo.disconnect(); darkQuery.removeEventListener('change', h); };
}

/**
 * Mount a three.js scene on a canvas.
 *
 * opts.setup({ renderer, scene, camera, THREE, lab })  -> may return { update(dt, t), dispose() }
 * opts.camera      a THREE.Camera, or omitted for a default PerspectiveCamera
 * opts.forceWebGL  skip WebGPU even when available (debugging the fallback path)
 * opts.maxDpr      cap on devicePixelRatio (default 2; a 4K retina at dpr 3 is 4x the pixels of dpr 1.5 for no visible gain)
 * opts.onDemand    render only when lab.invalidate() is called (static scenes, or reduced-motion)
 * opts.alpha       transparent clear so the page background shows through (default true; matches the site's paper)
 * opts.fallback    element to reveal when neither WebGPU nor WebGL 2 exists (default: the canvas's [data-lab-fallback] sibling)
 *
 * Returns lab: { renderer, scene, camera, backend, invalidate(), pause(), resume(), dispose(), size:{w,h,dpr} }
 */
export async function mountLab(canvas, opts = {}) {
  const {
    setup, forceWebGL = false, maxDpr = 2, alpha = true, antialias = true,
    camera: givenCamera, onDemand: onDemandOpt = false,
  } = opts;

  const fallback = opts.fallback ?? canvas.parentElement?.querySelector('[data-lab-fallback]');
  const showFallback = (why) => {
    canvas.hidden = true;
    if (fallback) { fallback.hidden = false; fallback.dataset.labReason = why; }
    console.warn('lab-kit: falling back to static figure:', why);
  };

  // WebGPURenderer falls back to WebGL 2 by itself; we only need to catch the
  // "neither" case, and to know which backend we got so the lab can choose
  // between a compute-shader path and a CPU path.
  let renderer;
  try {
    renderer = new THREE.WebGPURenderer({ canvas, antialias, alpha, forceWebGL });
    await renderer.init();
  } catch (err) {
    showFallback(err?.message || String(err));
    return null;
  }
  const backend = renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2';
  canvas.dataset.backend = backend;

  const scene = new THREE.Scene();
  const camera = givenCamera ?? new THREE.PerspectiveCamera(40, 1, 0.05, 200);
  if (!givenCamera) camera.position.set(0, 1.2, 4);

  const size = { w: 1, h: 1, dpr: 1 };
  let onDemand = onDemandOpt || prefersReducedMotion();
  let needsFrame = true;
  let running = false;
  let visible = true;      // in viewport
  let pageVisible = !document.hidden;
  let paused = false;      // by the lab itself
  let hooks = {};
  let disposed = false;
  let last = performance.now();
  let elapsed = 0;

  const lab = {
    renderer, scene, camera, backend, size, THREE,
    get reducedMotion() { return prefersReducedMotion(); },
    invalidate() { needsFrame = true; schedule(); },
    pause() { paused = true; },
    resume() { paused = false; lab.invalidate(); },
    setOnDemand(v) { onDemand = v; lab.invalidate(); },
    dispose,
  };

  // ---- resize: prefer device-pixel-content-box (exact backing store, no moiré),
  // fall back to contentBox * dpr where Safari lacks it.
  function resizeTo(cssW, cssH, pxW, pxH) {
    const dpr = Math.min(devicePixelRatio || 1, maxDpr);
    const w = pxW ?? Math.round(cssW * dpr);
    const h = pxH ?? Math.round(cssH * dpr);
    if (w === size.w && h === size.h) return;
    size.w = w; size.h = h; size.dpr = w / Math.max(1, cssW);
    renderer.setSize(w, h, false);           // false: CSS already sizes the canvas
    if (camera.isPerspectiveCamera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    hooks.resize?.(w, h, size.dpr);   // orthographic cameras set their own frustum here
    lab.invalidate();
  }
  const ro = new ResizeObserver((entries) => {
    const e = entries[0];
    const cb = e.contentBoxSize?.[0];
    const cssW = cb ? cb.inlineSize : e.contentRect.width;
    const cssH = cb ? cb.blockSize : e.contentRect.height;
    const dp = e.devicePixelContentBoxSize?.[0];
    if (dp && devicePixelRatio <= maxDpr) resizeTo(cssW, cssH, dp.inlineSize, dp.blockSize);
    else resizeTo(cssW, cssH);
  });
  try { ro.observe(canvas, { box: 'device-pixel-content-box' }); }
  catch { ro.observe(canvas); }

  // ---- visibility: no frames while scrolled away or in a background tab.
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) schedule(); else stop(); }, { rootMargin: '100px' });
  io.observe(canvas);
  const onVis = () => { pageVisible = !document.hidden; if (pageVisible) schedule(); else stop(); };
  document.addEventListener('visibilitychange', onVis);
  const onMotion = () => { onDemand = onDemandOpt || prefersReducedMotion(); lab.invalidate(); };
  reducedMotionQuery.addEventListener('change', onMotion);

  // ---- context loss (WebGL) / device loss (WebGPU)
  const onLost = (ev) => { ev.preventDefault?.(); stop(); console.warn('lab-kit: context lost'); };
  const onRestored = () => { console.warn('lab-kit: context restored'); lab.invalidate(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  renderer.onDeviceLost = (info) => { if (info?.reason !== 'destroyed') { console.warn('lab-kit: GPU device lost', info); stop(); } };

  // ---- loop
  function frame(now) {
    running = false;
    if (disposed || paused || !visible || !pageVisible) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    if (!onDemand || needsFrame) {
      elapsed += dt;
      needsFrame = false;
      hooks.update?.(dt, elapsed, lab);
      renderer.render(scene, camera);
    }
    if (!onDemand || needsFrame) schedule();
  }
  function schedule() { if (!running && !disposed) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function stop() { /* rAF simply does not get rescheduled; nothing to cancel */ }

  function dispose() {
    disposed = true;
    ro.disconnect(); io.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    reducedMotionQuery.removeEventListener('change', onMotion);
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    hooks.dispose?.();
    scene.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m) { for (const v of Object.values(m)) v?.isTexture && v.dispose(); m.dispose?.(); }
    });
    renderer.dispose();
  }

  hooks = (await setup?.({ renderer, scene, camera, THREE, lab })) || {};
  // Whatever setup returned is handed back on the lab, so a page's controls can
  // reach the scene's own functions without a module-level variable.
  lab.hooks = hooks;
  schedule();
  return lab;
}

/**
 * Bind a <form> (or any container) of range / number / checkbox / select / radio
 * inputs to a plain state object. Each input needs a name; a sibling
 * <output for="id"> is kept in sync using data-format ("fixed:2", "int", "pct", "sci:3") if present.
 * onChange(state, name) fires on every input event. Returns { state, set(name, value) }.
 */
export function bindControls(root, state, onChange) {
  const inputs = [...root.querySelectorAll('input[name], select[name]')];
  const outputs = new Map([...root.querySelectorAll('output[for]')].map((o) => [o.getAttribute('for'), o]));
  const fmt = (el, v) => {
    const f = el.dataset.format || (el.step && el.step.includes('.') ? `fixed:${el.step.split('.')[1].length}` : 'auto');
    if (typeof v !== 'number') return String(v);
    if (f === 'int') return Math.round(v).toLocaleString();
    if (f === 'pct') return (v * 100).toFixed(0) + '%';
    if (f.startsWith('fixed:')) return v.toFixed(+f.slice(6));
    if (f.startsWith('sci:')) return v.toExponential(+f.slice(4));
    return Number.isInteger(v) ? String(v) : v.toPrecision(3);
  };
  const read = (el) => el.type === 'checkbox' ? el.checked : el.type === 'radio' ? el.value : (el.type === 'range' || el.type === 'number') ? +el.value : el.value;
  const refresh = (el) => { const o = outputs.get(el.id); if (o) o.value = fmt(el, read(el)); };
  for (const el of inputs) {
    if (el.type === 'radio' && !el.checked) continue;
    if (el.name in state) {
      if (el.type === 'checkbox') el.checked = !!state[el.name];
      else if (el.type !== 'radio') el.value = state[el.name];
    } else state[el.name] = read(el);
    refresh(el);
  }
  root.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!el.name) return;
    if (el.type === 'radio' && !el.checked) return;
    state[el.name] = read(el);
    refresh(el);
    onChange?.(state, el.name);
  });
  return {
    state,
    set(name, value) {
      state[name] = value;
      for (const el of inputs) if (el.name === name) { if (el.type === 'checkbox') el.checked = !!value; else if (el.type === 'radio') el.checked = el.value === value; else el.value = value; refresh(el); }
      onChange?.(state, name);
    },
  };
}

/**
 * Scrollytelling: a sticky stage beside a column of steps. Each step element
 * carries data-step; onStep(index, el) fires when it becomes the active one.
 * JS-driven on purpose: CSS scroll-driven animations are still not in Firefox
 * stable, so the JS path is the one that has to work and CSS is decoration.
 */
export function scrollSteps(steps, onStep, { threshold = 0.6 } = {}) {
  const els = [...steps];
  let active = -1;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = els.indexOf(e.target);
      if (i !== active) { active = i; els.forEach((el, j) => el.classList.toggle('is-active', j === i)); onStep(i, e.target); }
    }
  }, { threshold, rootMargin: '-20% 0px -20% 0px' });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

/** rAF-throttled pointer position in normalised device coords for raycasting. */
export function trackPointer(canvas, onMove) {
  const ndc = new THREE.Vector2();
  let pending = false;
  const h = (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; onMove(ndc, ev); }); }
  };
  canvas.addEventListener('pointermove', h);
  return () => canvas.removeEventListener('pointermove', h);
}
