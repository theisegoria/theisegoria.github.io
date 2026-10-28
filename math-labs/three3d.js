/* three3d.js: the 3D layer of the encyclopedia's lab kit.
 *
 * Loaded on demand by Lab.view3d (experience.js); never imported by a page
 * directly. It mounts a three.js scene through the site's lab-kit runtime
 * (WebGPU with a WebGL 2 fallback, pausing off-screen, context loss) and adds
 * what a mathematical figure needs: Z-up coordinates, a soft studio light that
 * makes surfaces read as surfaces, orbit with damping that never hijacks page
 * scrolling, colours from the same --lab-* tokens as the 2D figures, DOM labels
 * that follow 3D points, draggable handles constrained to a plane or a sphere,
 * and helpers for surfaces, tubes, arrows and point clouds that update in place
 * when a slider moves. See KIT.md, "3D experiments".
 */
import * as THREE from 'three/webgpu';
import { mountLab, readColors, isDark, prefersReducedMotion } from '/assets/lab-kit/lab-kit.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TOKENS = ['c1', 'c2', 'c3', 'c4', 'hl', 'ink', 'muted', 'plate', 'grid', 'pos', 'neg', 'zero'];
const ja = document.documentElement.lang === 'ja';
const T = (en, jp) => (ja ? jp : en);

function tokens(host) {
  const scope = host.closest('.math-wrap') || document.body;
  const raw = readColors(TOKENS.map((t) => '--lab-' + t), scope);
  const out = {};
  for (const t of TOKENS) out[t] = raw['lab-' + t];
  return out;
}

/* a smooth palette walk for scalar colouring: plate-tinted low end to highlight */
function ramp(cols, stops) {
  return (t) => {
    t = Math.min(1, Math.max(0, t));
    const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
    return new THREE.Color().copy(cols[stops[i]]).lerp(cols[stops[i + 1]], f);
  };
}

export async function create(host, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'lab3d';
  const aspect = opts.aspect ?? 0.62;
  wrap.style.setProperty('--lab3d-aspect', String(aspect));
  if (opts.maxH) wrap.style.setProperty('--lab3d-maxh', opts.maxH + 'px');
  const canvas = document.createElement('canvas');
  canvas.className = 'lab3d-canvas';
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', opts.label || T('3D figure. Drag to rotate.', '3D図。ドラッグで回転できます。'));
  const overlay = document.createElement('div'); overlay.className = 'lab3d-labels';
  const hint = document.createElement('div'); hint.className = 'lab3d-hint';
  hint.textContent = opts.hint ?? T('Drag to rotate · ctrl + scroll to zoom', 'ドラッグで回転・ctrl + スクロールで拡大');
  const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'lab3d-reset'; reset.textContent = T('Reset view', '視点を戻す');
  wrap.append(canvas, overlay, hint, reset);
  host.appendChild(wrap);

  let cols = tokens(host);
  const dark = isDark();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 35, 1, 0.01, 500);
  camera.up.set(0, 0, 1);
  const camPos = new THREE.Vector3(...(opts.camera ?? [5.5, -7, 4.2]));
  const target = new THREE.Vector3(...(opts.target ?? [0, 0, 0]));
  camera.position.copy(camPos);
  camera.lookAt(target);

  const S = { THREE, host, wrap, canvas, camera, cols, dark, T, ja, labels: [], handles: [], disposers: [], state: {} };

  const mountOpts = {
    camera,
    maxDpr: opts.maxDpr ?? 2,
    onDemand: true,
    setup: ({ renderer, scene }) => {
      S.renderer = renderer; S.scene = scene;
      renderer.toneMapping = THREE.AgXToneMapping;
      renderer.toneMappingExposure = dark ? 1.05 : 1.0;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (opts.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
      // image-based light: a neutral room gives metals and glossy surfaces something to reflect
      const pmrem = new THREE.PMREMGenerator(renderer);
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = env;
      scene.environmentIntensity = opts.envIntensity ?? (dark ? 0.55 : 0.75);
      pmrem.dispose();
      S.disposers.push(() => env.dispose());
      const hemi = new THREE.HemisphereLight(0xffffff, cols.plate.clone().multiplyScalar(0.6), dark ? 0.5 : 0.9);
      hemi.position.set(0, 0, 1);
      const key = new THREE.DirectionalLight(0xffffff, dark ? 1.6 : 2.0);
      key.position.set(4, -6, 9);
      if (opts.shadows) { key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 4; const c = key.shadow.camera; c.left = c.bottom = -8; c.right = c.top = 8; c.near = 1; c.far = 40; }
      const rim = new THREE.DirectionalLight(0xffffff, dark ? 0.6 : 0.5);
      rim.position.set(-6, 5, 3);
      scene.add(hemi, key, rim);
      S.key = key;
      return {
        update(dt, t) {
          const moving = S.controls?.update();
          let more = !!moving;
          if (S.tick) { if (S.tick(dt, t) !== false) more = true; }
          if (S.labels.length) S.placeLabels();
          if (more) S.lab?.invalidate();
        },
        resize() { S.placeLabels?.(); },
      };
    },
  };
  // a WebGPU adapter that exists but fails to initialise should still get WebGL 2, not the flat figure
  let lab = await mountLab(canvas, { ...mountOpts, fallback: null });
  if (!lab) { canvas.hidden = false; lab = await mountLab(canvas, { ...mountOpts, forceWebGL: true, fallback: null }); }
  if (!lab) { wrap.remove(); return null; }

  S.lab = lab;
  S.backend = lab.backend;

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enableDamping = !prefersReducedMotion();
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.8;
  controls.minDistance = opts.minDistance ?? camPos.distanceTo(target) * 0.35;
  controls.maxDistance = opts.maxDistance ?? camPos.distanceTo(target) * 2.4;
  if (opts.minPolar !== undefined) controls.minPolarAngle = opts.minPolar;
  if (opts.maxPolar !== undefined) controls.maxPolarAngle = opts.maxPolar;
  controls.update();
  S.controls = controls;
  // let the page scroll on touch; horizontal drags still rotate
  canvas.style.touchAction = 'pan-y';
  const wheel = (e) => { controls.enableZoom = e.ctrlKey || e.metaKey; };
  canvas.addEventListener('wheel', wheel, { capture: true, passive: true });
  let touched = false;
  controls.addEventListener('start', () => { if (!touched) { touched = true; hint.classList.add('is-gone'); } });
  controls.addEventListener('change', () => lab.invalidate());
  reset.addEventListener('click', () => { camera.position.copy(camPos); controls.target.copy(target); controls.update(); lab.invalidate(); });
  // keyboard orbit for people who cannot drag
  canvas.addEventListener('keydown', (e) => {
    const step = 0.12;
    const off = camera.position.clone().sub(controls.target);
    const sph = new THREE.Spherical().setFromVector3(new THREE.Vector3(off.x, off.z, -off.y));
    if (e.key === 'ArrowLeft') sph.theta -= step; else if (e.key === 'ArrowRight') sph.theta += step;
    else if (e.key === 'ArrowUp') sph.phi = Math.max(0.05, sph.phi - step); else if (e.key === 'ArrowDown') sph.phi = Math.min(Math.PI - 0.05, sph.phi + step);
    else return;
    e.preventDefault();
    const v = new THREE.Vector3().setFromSpherical(sph);
    camera.position.copy(controls.target).add(new THREE.Vector3(v.x, -v.z, v.y));
    controls.update(); lab.invalidate();
  });

  /* ---------- materials and colour ---------- */
  const colour = (c) => (c instanceof THREE.Color ? c : typeof c === 'string' && cols[c] ? cols[c] : new THREE.Color(c ?? cols.c1));
  S.colour = colour;
  S.mat = (c = 'c1', o = {}) => new THREE.MeshPhysicalMaterial({
    color: o.vertexColors ? new THREE.Color(1, 1, 1) : colour(c), roughness: o.rough ?? 0.42, metalness: o.metal ?? 0.0,
    clearcoat: o.coat ?? 0.35, clearcoatRoughness: 0.35, side: o.side ?? THREE.DoubleSide,
    transparent: (o.opacity ?? 1) < 1, opacity: o.opacity ?? 1, depthWrite: (o.opacity ?? 1) >= 1 || o.depthWrite === true,
    vertexColors: !!o.vertexColors, emissive: o.glow ? colour(o.glowColour ?? c) : new THREE.Color(0), emissiveIntensity: o.glow ?? 0,
    flatShading: !!o.flat,
  });
  S.cmap = {
    seq: ramp({ a: cols.c1.clone().lerp(cols.plate, 0.15), b: cols.c3, c: cols.hl }, ['a', 'b', 'c']),
    warm: ramp({ a: cols.c4, b: cols.c2, c: cols.hl }, ['a', 'b', 'c']),
    div: (v) => { v = Math.max(-1, Math.min(1, v)); const mid = cols.plate.clone().lerp(cols.muted, dark ? 0.3 : 0.42); return v >= 0 ? mid.clone().lerp(cols.pos, v) : mid.clone().lerp(cols.neg, -v); },
    phase: (arg, mag = 1) => { const h = ((arg / (2 * Math.PI)) % 1 + 1) % 1; const band = mag > 0 ? (Math.log2(mag) % 1 + 1) % 1 : 0; return new THREE.Color().setHSL(h, 0.62, 0.42 + 0.14 * band, THREE.SRGBColorSpace); },
  };

  /* ---------- geometry helpers (all in math coordinates, Z up) ---------- */
  const V = (p) => (p instanceof THREE.Vector3 ? p : new THREE.Vector3(p[0], p[1], p[2] ?? 0));
  S.V = V;
  S.add = (o) => { S.scene.add(o); lab.invalidate(); return o; };
  S.invalidate = () => lab.invalidate();

  /* parametric surface fn(u, v) -> [x, y, z]; colour(u, v, p) -> THREE.Color for vertex colours */
  S.surface = (fn, o = {}) => {
    const [u0, u1] = o.u ?? [0, 1], [v0, v1] = o.v ?? [0, 1];
    const nu = o.nu ?? 80, nv = o.nv ?? 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
    const col = new Float32Array((nu + 1) * (nv + 1) * 3);
    const idx = [];
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j, b = a + nv + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    geo.setIndex(idx);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const material = S.mat(o.c ?? 'c1', { ...o, vertexColors: !!o.colour });
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = !!opts.shadows; mesh.receiveShadow = !!opts.shadows;
    let wire = null;
    if (o.wire) {
      wire = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: colour(o.wireColour ?? 'ink'), transparent: true, opacity: o.wireOpacity ?? (dark ? 0.22 : 0.16), depthWrite: false }));
      mesh.add(wire);
    }
    mesh.update = (f = fn, colourFn = o.colour) => {
      fn = f;
      if (colourFn && !material.vertexColors) { material.vertexColors = true; material.color.set(1, 1, 1); material.needsUpdate = true; }
      let k = 0;
      const tmp = new THREE.Color();
      for (let i = 0; i <= nu; i++) {
        const u = u0 + (u1 - u0) * i / nu;
        for (let j = 0; j <= nv; j++) {
          const v = v0 + (v1 - v0) * j / nv;
          const p = fn(u, v);
          const ok = p && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2]);
          pos[k] = ok ? p[0] : 0; pos[k + 1] = ok ? p[1] : 0; pos[k + 2] = ok ? p[2] : 0;
          if (colourFn) { const c = colourFn(u, v, p) || tmp.set(0x888888); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; }
          k += 3;
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      if (wire) {
        const every = o.wireEvery ?? Math.max(1, Math.round(nu / 16));
        const seg = [];
        const P = (i, j) => { const q = (i * (nv + 1) + j) * 3; return [pos[q], pos[q + 1], pos[q + 2]]; };
        for (let i = 0; i <= nu; i += every) for (let j = 0; j < nv; j++) seg.push(...P(i, j), ...P(i, j + 1));
        const everyV = o.wireEveryV ?? Math.max(1, Math.round(nv / 16));
        for (let j = 0; j <= nv; j += everyV) for (let i = 0; i < nu; i++) seg.push(...P(i, j), ...P(i + 1, j));
        wire.geometry.dispose();
        wire.geometry = new THREE.BufferGeometry();
        wire.geometry.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
      }
      lab.invalidate();
      return mesh;
    };
    mesh.update(fn, o.colour);
    if (o.add !== false) S.add(mesh);
    return mesh;
  };
  /* graph of z = f(x, y) over a rectangle, coloured by height */
  S.graph = (f, o = {}) => {
    const [x0, x1] = o.x ?? [-2, 2], [y0, y1] = o.y ?? [-2, 2];
    const zr = o.zRange;
    const colourFn = o.colour ?? (zr ? (u, v, p) => S.cmap[o.cmap ?? 'seq']((p[2] - zr[0]) / (zr[1] - zr[0])) : null);
    const m = S.surface((u, v) => [u, v, f(u, v)], { ...o, u: [x0, x1], v: [y0, y1], colour: colourFn });
    const upd = m.update;
    m.update = (g = f, cf = colourFn) => { f = g; return upd((u, v) => [u, v, f(u, v)], cf); };
    return m;
  };

  /* tube along a polyline or along fn(t) on [t0, t1] */
  S.tube = (pts, o = {}) => {
    const material = S.mat(o.c ?? 'c2', { rough: 0.32, coat: 0.6, ...o });
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    mesh.castShadow = !!opts.shadows;
    mesh.update = (p = pts) => {
      pts = p;
      const arr = (typeof p === 'function' ? Array.from({ length: (o.n ?? 200) + 1 }, (_, i) => p((o.t?.[0] ?? 0) + ((o.t?.[1] ?? 1) - (o.t?.[0] ?? 0)) * i / (o.n ?? 200))) : p).filter((q) => q && q.every(Number.isFinite)).map(V);
      mesh.geometry.dispose();
      if (arr.length < 2) { mesh.geometry = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0, 0, 1e-6)), 1, 1e-6, 3); mesh.visible = false; lab.invalidate(); return mesh; }
      mesh.visible = true;
      const curve = new THREE.CatmullRomCurve3(arr, !!o.closed, 'centripetal');
      mesh.geometry = new THREE.TubeGeometry(curve, o.segments ?? Math.min(1200, arr.length * 2), o.r ?? 0.035, o.radial ?? 10, !!o.closed);
      lab.invalidate();
      return mesh;
    };
    mesh.update(pts);
    if (o.add !== false) S.add(mesh);
    return mesh;
  };
  /* thin line, for many curves at once (grids, trails) */
  S.lines = (segments, o = {}) => {
    const geo = new THREE.BufferGeometry();
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: colour(o.c ?? 'muted'), transparent: true, opacity: o.opacity ?? 0.6, depthWrite: false, vertexColors: !!o.colours }));
    line.update = (segs = segments, colours) => {
      if (!segs || !segs.length) segs = [[[0, 0, 0], [0, 0, 0]]];
      const flat = []; for (const [a, b] of segs) flat.push(a[0], a[1], a[2] ?? 0, b[0], b[1], b[2] ?? 0);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(flat, 3));
      if (colours) { const c = []; for (const col of colours) c.push(col.r, col.g, col.b, col.r, col.g, col.b); geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
      geo.computeBoundingSphere(); lab.invalidate(); return line;
    };
    line.update(segments, o.colours);
    if (o.add !== false) S.add(line);
    return line;
  };
  S.polyline = (pts, o = {}) => {
    const segs = []; for (let i = 0; i + 1 < pts.length; i++) segs.push([pts[i], pts[i + 1]]);
    const l = S.lines(segs, o);
    const up = l.update;
    l.update = (p) => { const s = []; for (let i = 0; i + 1 < p.length; i++) s.push([p[i], p[i + 1]]); return up(s); };
    return l;
  };
  /* arrow from a along vector d */
  S.arrow = (a, d, o = {}) => {
    const g = new THREE.Group();
    const material = S.mat(o.c ?? 'c2', { rough: 0.3, coat: 0.7, glow: o.glow, opacity: o.opacity });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), material);
    const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 18), material);
    shaft.castShadow = head.castShadow = !!opts.shadows;
    g.add(shaft, head);
    const up = new THREE.Vector3(0, 1, 0);
    g.set = (from = a, vec = d) => {
      a = from; d = vec;
      const A = V(from), D = V(vec), len = D.length();
      g.visible = len > 1e-6;
      if (!g.visible) { lab.invalidate(); return g; }
      const r = o.r ?? 0.035, hl = Math.min(len * 0.4, o.head ?? r * 7), hr = r * 2.6;
      g.position.copy(A);
      g.quaternion.setFromUnitVectors(up, D.clone().normalize());
      shaft.scale.set(r, len - hl, r); shaft.position.set(0, (len - hl) / 2, 0);
      head.scale.set(hr, hl, hr); head.position.set(0, len - hl / 2, 0);
      lab.invalidate();
      return g;
    };
    g.set(a, d);
    if (o.add !== false) S.add(g);
    return g;
  };
  S.sphere = (p, r = 0.08, o = {}) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), S.mat(o.c ?? 'hl', { rough: 0.25, coat: 0.8, ...o }));
    m.scale.setScalar(r); m.position.copy(V(p)); m.castShadow = !!opts.shadows;
    m.at = (q) => { m.position.copy(V(q)); lab.invalidate(); return m; };
    if (o.add !== false) S.add(m);
    return m;
  };
  /* many small spheres, one draw call */
  S.points = (pts, o = {}) => {
    const n = o.max ?? pts.length;
    // per-instance colours multiply the material colour, so the base must be white when they are given
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), S.mat(o.colours ? new THREE.Color(1, 1, 1) : (o.c ?? 'c1'), { rough: 0.35, ...o }), Math.max(1, n));
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3();
    im.update = (p = pts, colours, radii) => {
      pts = p; im.count = Math.min(n, p.length);
      for (let i = 0; i < im.count; i++) {
        const r = radii ? radii[i] : (o.r ?? 0.04);
        M.compose(V(p[i]), Q, Sc.set(r, r, r)); im.setMatrixAt(i, M);
        if (colours) im.setColorAt(i, colours[i]);
      }
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere?.();
      lab.invalidate(); return im;
    };
    im.frustumCulled = false;
    im.update(pts, o.colours, o.radii);
    if (o.add !== false) S.add(im);
    return im;
  };
  /* faint axes with tick-free arrow heads and labels */
  S.axes = (o = {}) => {
    const len = o.len ?? 2.4, g = new THREE.Group();
    const names = o.names ?? ['x', 'y', 'z'];
    const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    dirs.forEach((d, i) => {
      if (o.only && !o.only.includes(i)) return;
      const lo = o.neg === false ? 0 : -len * (o.negFrac ?? 1);
      g.add(S.arrow([d[0] * lo, d[1] * lo, d[2] * lo], [d[0] * (len - lo), d[1] * (len - lo), d[2] * (len - lo)], { c: 'muted', r: o.r ?? 0.012, add: false }));
      if (names[i]) S.label(names[i], [d[0] * (len + 0.18), d[1] * (len + 0.18), d[2] * (len + 0.18)], { math: true, c: 'muted' });
    });
    S.add(g);
    return g;
  };
  /* a floor grid in the plane z = z0 */
  S.floor = (o = {}) => {
    const half = o.size ?? 3, n = o.n ?? 12, z = o.z ?? 0;
    const segs = [];
    for (let i = 0; i <= n; i++) { const t = -half + 2 * half * i / n; segs.push([[t, -half, z], [t, half, z]], [[-half, t, z], [half, t, z]]); }
    const l = S.lines(segs, { c: 'grid', opacity: o.opacity ?? (dark ? 0.55 : 0.9) });
    if (o.shadow) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(half * 2, half * 2), new THREE.ShadowMaterial({ opacity: dark ? 0.35 : 0.16 }));
      m.position.z = z - 0.001; m.receiveShadow = true; S.add(m);
    }
    return l;
  };
  S.disc = (center, normal, r, o = {}) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 64), S.mat(o.c ?? 'c1', { opacity: o.opacity ?? 0.25, ...o }));
    m.position.copy(V(center)); m.lookAt(V(center).add(V(normal)));
    if (o.add !== false) S.add(m);
    return m;
  };
  S.box = (size, center, o = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...size), S.mat(o.c ?? 'c1', o));
    m.position.copy(V(center)); m.castShadow = m.receiveShadow = !!opts.shadows;
    if (o.add !== false) S.add(m);
    return m;
  };

  /* ---------- labels: DOM text pinned to 3D points ---------- */
  const proj = new THREE.Vector3();
  const occRay = new THREE.Raycaster();
  S.label = (text, p, o = {}) => {
    const el = document.createElement('span');
    el.className = 'lab3d-label' + (o.math ? ' is-math' : '') + (o.small ? ' is-small' : '');
    if (o.c) el.style.color = colour(o.c).css ?? '#' + colour(o.c).getHexString();
    el.textContent = text;
    overlay.appendChild(el);
    const item = { el, p: V(p), o };
    item.set = (q, t) => { if (q) item.p = V(q); if (t !== undefined) el.textContent = t; lab.invalidate(); return item; };
    item.show = (on) => { el.style.display = on ? '' : 'none'; return item; };
    item.remove = () => { el.remove(); S.labels.splice(S.labels.indexOf(item), 1); };
    S.labels.push(item);
    lab.invalidate();
    return item;
  };
  S.placeLabels = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    for (const it of S.labels) {
      proj.copy(it.p).project(camera);
      let hidden = proj.z > 1 || it.el.dataset.hidden === '1';
      if (!hidden && it.o.occlude) {
        const dir = it.p.clone().sub(camera.position), dist = dir.length();
        occRay.set(camera.position, dir.normalize()); occRay.far = dist - (it.o.occludeSlack ?? 0.05);
        const hit = occRay.intersectObjects(S.scene.children, true).find((h) => h.object.isMesh && h.object.visible && !h.object.userData.noOcclude);
        if (hit) hidden = true;
      }
      it.el.style.transform = `translate(${((proj.x + 1) / 2 * w + (it.o.dx ?? (it.o.align === 'end' ? -6 : 6))).toFixed(1)}px, ${((1 - proj.y) / 2 * h + (it.o.dy ?? -6)).toFixed(1)}px) translate(${it.o.align === 'end' ? '-100%' : it.o.align === 'middle' ? '-50%' : '0'}, -100%)`;
      it.el.style.opacity = hidden ? '0' : '';
    }
  };
  S.clearLabels = () => { for (const it of S.labels) it.el.remove(); S.labels.length = 0; };

  /* ---------- draggable handles ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const toNDC = (ev) => { const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); };
  /* o.plane: [normal, point] or o.sphere: [centre, radius] constrains the drag; onDrag(vec3) */
  S.handle = (p, o = {}) => {
    const m = S.sphere(p, o.r ?? 0.1, { c: o.c ?? 'hl', glow: 0.25 });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: colour(o.c ?? 'hl'), transparent: true, opacity: 0.18, depthWrite: false }));
    halo.scale.setScalar(1.9); m.add(halo);
    m.userData.handle = o; S.handles.push(m);
    m.setPlane = (nrm, q) => { o.plane = [nrm, q]; return m; };
    m.enable = (on) => { const i = S.handles.indexOf(m); if (on && i < 0) S.handles.push(m); if (!on && i >= 0) S.handles.splice(i, 1); m.visible = !!on; m.labelItem?.show(!!on); lab.invalidate(); return m; };
    m.setColour = (c) => { const col = colour(c); m.material.color.copy(col); m.material.emissive.copy(col); m.children[0].material.color.copy(col); lab.invalidate(); return m; };
    if (o.label) m.labelItem = S.label(o.label, p, { math: true });
    const at = m.at; m.at = (q) => { at(q); m.labelItem?.set(q); return m; };
    return m;
  };
  let dragging = null;
  const hitPoint = (o) => {
    if (o.sphere) {
      const c = V(o.sphere[0]), r = o.sphere[1];
      const sph = new THREE.Sphere(c, r), out = new THREE.Vector3();
      if (ray.ray.intersectSphere(sph, out)) return out;
      // outside the silhouette: project the closest point of the ray onto the sphere
      ray.ray.closestPointToPoint(c, out); return out.sub(c).setLength(r).add(c);
    }
    if (o.facing) { const nrm = camera.getWorldDirection(new THREE.Vector3()).negate(); const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(nrm, dragging.position); const out = new THREE.Vector3(); return ray.ray.intersectPlane(pl, out) ? out : null; }
    const [n, q] = o.plane ?? [[0, 0, 1], [0, 0, 0]];
    const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(V(n).normalize(), V(q));
    const out = new THREE.Vector3();
    return ray.ray.intersectPlane(pl, out) ? out : null;
  };
  canvas.addEventListener('pointerdown', (ev) => {
    if (!S.handles.length) return;
    toNDC(ev); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(S.handles, true)[0];
    if (!hit) return;
    let obj = hit.object; while (obj && !obj.userData.handle) obj = obj.parent;
    if (!obj) return;
    dragging = obj; controls.enabled = false; canvas.setPointerCapture(ev.pointerId); wrap.classList.add('is-dragging');
    ev.preventDefault(); ev.stopPropagation();
  }, { capture: true });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) {
      if (!S.handles.length || ev.pointerType !== 'mouse') return;
      toNDC(ev); ray.setFromCamera(ndc, camera);
      canvas.style.cursor = ray.intersectObjects(S.handles, true).length ? 'grab' : '';
      return;
    }
    toNDC(ev); ray.setFromCamera(ndc, camera);
    const o = dragging.userData.handle, q = hitPoint(o);
    if (!q) return;
    if (o.bounds) { const [x0, x1, y0, y1, z0, z1] = o.bounds; q.x = Math.min(x1, Math.max(x0, q.x)); q.y = Math.min(y1, Math.max(y0, q.y)); if (z0 !== undefined) q.z = Math.min(z1, Math.max(z0, q.z)); }
    const res = o.onDrag?.(q.clone());
    dragging.at(res ? V(res) : q);
  });
  const end = (ev) => { if (!dragging) return; dragging = null; controls.enabled = true; wrap.classList.remove('is-dragging'); try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* released */ } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  /* continuous animation while fn returns anything but false */
  S.animate = (fn) => { S.tick = fn; lab.invalidate(); };
  S.look = (pos, tgt, keep) => { camera.position.copy(V(pos)); if (tgt) controls.target.copy(V(tgt)); if (keep) { camPos.copy(V(pos)); if (tgt) target.copy(V(tgt)); } controls.update(); lab.invalidate(); };
  S.reduced = prefersReducedMotion;
  // a scene built off-screen can be skipped while its shaders compile; ask for frames until they are ready
  S.settle = (ms = 4000) => { const t0 = performance.now(); const tick = () => { lab.invalidate(); if (performance.now() - t0 < ms) setTimeout(tick, 250); }; tick(); };
  { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) S.settle(2500); }); io.observe(wrap); S.disposers.push(() => io.disconnect()); }
  S.light = (k = 1) => { S.scene.environmentIntensity *= k; S.scene.children.forEach((o) => { if (o.isLight) o.intensity *= k; }); lab.invalidate(); };
  S.dispose = () => {
    S.disposers.forEach((f) => f());
    controls.dispose();
    canvas.removeEventListener('wheel', wheel, { capture: true });
    lab.dispose();
    wrap.remove();
  };
  return S;
}
