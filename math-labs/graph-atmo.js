/* graph-atmo.js: the living background of the knowledge graph.
 *
 * A WebGL layer under the SVG graph. Each subject is a soft nebula in its own
 * colour, and a few hundred motes of light drift in depth inside it, so the
 * map reads as six regions of a sky rather than circles on paper. When the
 * view changes (overview, a subject, a topic) the nebulae glide to their new
 * places and the motes stream after them. The pointer adds a little parallax.
 *
 * It is decoration only: the SVG above carries every label, link and control,
 * and if WebGL is missing this module simply does nothing. It renders only
 * while visible, eases to a still picture under reduced motion, and reads its
 * colours from the same --kg-* tokens as the graph, so light and dark both work.
 */
import * as THREE from '/vendor/three/r186/build/three.module.js';
// colours are used exactly as the stylesheet gives them (sRGB), like the SVG above
THREE.ColorManagement.enabled = false;

const GROUPS = ['foundations', 'analysis', 'geometry', 'applications', 'physics', 'engineering'];
const MAXG = 12;          // nebula slots
const N = 1100;           // motes

const vertNeb = /* glsl */`
varying vec2 vPx;
uniform vec2 uSize;
void main() { vPx = (position.xy * 0.5 + 0.5) * uSize; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const fragNeb = /* glsl */`
precision highp float;
varying vec2 vPx;
uniform vec4 uG[${MAXG}];        // x, y, radius, strength (all in view pixels; y down)
uniform vec3 uC[${MAXG}];
uniform int uN;
uniform float uTime, uDark, uZoom;
uniform vec2 uPan, uSize;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
void main() {
  vec2 px = vec2(vPx.x, uSize.y - vPx.y);
  vec2 q = (px - uPan) / uZoom;                    // into the graph's own coordinates
  vec3 col = vec3(0.0); float a = 0.0;
  for (int i = 0; i < ${MAXG}; i++) {
    if (i >= uN) break;
    vec4 g = uG[i];
    vec2 d = q - g.xy;
    float r = g.z;
    float wob = fbm(d / r * 1.6 + vec2(uTime * 0.035, -uTime * 0.025) + float(i) * 3.7);
    float k = exp(-dot(d, d) / (r * r) * (1.25 - 0.55 * wob));
    float w = k * g.w;
    col += uC[i] * w; a += w;
  }
  a = clamp(a, 0.0, 1.0);
  col = a > 0.0 ? col / max(a, 1e-3) : col;
  float strength = mix(0.16, 0.40, uDark);
  float A = a * strength;
  gl_FragColor = vec4(col * A, A);
}`;

const vertMote = /* glsl */`
attribute float aSize; attribute float aDepth; attribute vec3 aCol; attribute float aSeed;
varying vec3 vCol; varying float vA;
uniform float uTime, uDpr, uZoom;
void main() {
  vCol = aCol;
  float tw = 0.65 + 0.35 * sin(uTime * (0.6 + aSeed * 1.4) + aSeed * 40.0);
  vA = tw * (0.35 + 0.65 * (1.0 - aDepth));
  gl_PointSize = aSize * uDpr * (0.65 + 0.7 * (1.0 - aDepth)) * mix(1.0, uZoom, 0.6);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const fragMote = /* glsl */`
precision highp float;
varying vec3 vCol; varying float vA;
uniform float uDark;
void main() {
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  float core = smoothstep(0.5, 0.0, r);
  float a = core * core * vA * mix(0.55, 0.95, uDark);
  gl_FragColor = vec4(mix(vCol, vec3(1.0), uDark * core * 0.35) * a, a);
}`;

function readColours(el) {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden';
  el.appendChild(probe);
  const out = {};
  const get = (v) => { probe.style.color = ''; probe.style.color = `var(${v})`; const c = new THREE.Color(); c.setStyle(getComputedStyle(probe).color); return c; };
  GROUPS.forEach((g) => { out[g] = get('--kg-' + g); });
  out.muted = get('--kg-muted'); out.accent = get('--kg-accent'); out.paper = get('--kg-paper');
  probe.remove();
  out.dark = (out.paper.r + out.paper.g + out.paper.b) / 3 < 0.35;
  return out;
}

export function mount(figure, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'kg-atmo';
  canvas.setAttribute('aria-hidden', 'true');
  figure.prepend(canvas);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power', premultipliedAlpha: true }); }
  catch (e) { canvas.remove(); return null; }
  if (!renderer.getContext()) { canvas.remove(); return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // no conversion: values are already sRGB
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
  let W = 1, H = 1, dpr = Math.min(2, devicePixelRatio || 1);
  let cols = readColours(figure.closest('.kg') || figure);

  // nebulae: one full-screen quad
  const nebU = {
    uG: { value: Array.from({ length: MAXG }, () => new THREE.Vector4()) },
    uC: { value: Array.from({ length: MAXG }, () => new THREE.Color()) },
    uN: { value: 0 }, uTime: { value: 0 }, uDark: { value: cols.dark ? 1 : 0 },
    uZoom: { value: 1 }, uPan: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2(1, 1) },
  };
  const neb = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: nebU, vertexShader: vertNeb, fragmentShader: fragNeb, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
  }));
  neb.frustumCulled = false;
  const nebScene = new THREE.Scene(); nebScene.add(neb);
  const nebCam = new THREE.Camera();

  // motes
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), depth = new Float32Array(N), seed = new Float32Array(N);
  const home = new Float32Array(N * 2), from = new Float32Array(N * 2), orbit = new Float32Array(N * 3), owner = new Int16Array(N);
  for (let i = 0; i < N; i++) { seed[i] = Math.random(); depth[i] = Math.random(); size[i] = 1.6 + Math.random() * Math.random() * 4.2; orbit[i * 3] = 2 + Math.random() * 10; orbit[i * 3 + 1] = (Math.random() - 0.5) * 0.25; orbit[i * 3 + 2] = Math.random() * 6.283; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const moteU = { uTime: { value: 0 }, uDpr: { value: dpr }, uZoom: { value: 1 }, uDark: { value: cols.dark ? 1 : 0 } };
  const motes = new THREE.Points(geo, new THREE.ShaderMaterial({ uniforms: moteU, vertexShader: vertMote, fragmentShader: fragMote, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending }));
  motes.frustumCulled = false;
  scene.add(motes);

  let glows = [], glowFrom = [], tScene = -1e9, t = 0, last = performance.now(), running = false, visible = true;
  let zoom = { k: 1, x: 0, y: 0 }, ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  const TRANS = 1.15;
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  function assign() {
    // share motes among the glows by area, keeping a quarter as a faint ambient field
    for (let i = 0; i < N * 2; i++) from[i] = home[i];
    const total = glows.reduce((s, g) => s + g.r * g.r * (g.w ?? 1), 0) || 1;
    let i = 0;
    const amb = Math.round(N * 0.22);
    for (; i < amb; i++) { owner[i] = -1; home[i * 2] = Math.random() * W; home[i * 2 + 1] = Math.random() * H; setCol(i, cols.muted); }
    glows.forEach((g, gi) => {
      const n = gi === glows.length - 1 ? N - i : Math.round((N - amb) * g.r * g.r * (g.w ?? 1) / total);
      for (let k = 0; k < n && i < N; k++, i++) {
        owner[i] = gi;
        const rr = g.r * 1.05 * Math.sqrt(-Math.log(1 - Math.random() * 0.93)) * 0.62, th = Math.random() * 6.283;
        home[i * 2] = g.x + rr * Math.cos(th); home[i * 2 + 1] = g.y + rr * Math.sin(th);
        setCol(i, cols[g.group] || cols.muted);
      }
    });
    for (; i < N; i++) { owner[i] = -1; home[i * 2] = Math.random() * W; home[i * 2 + 1] = Math.random() * H; setCol(i, cols.muted); }
    geo.attributes.aCol.needsUpdate = true;
  }
  function setCol(i, c) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }

  function frame(now) {
    running = false;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const still = reduce.matches;
    t += still ? 0 : dt;
    const sk = still ? 1 : Math.min(1, (performance.now() - tScene) / (TRANS * 1000)), e = ease(sk);
    // nebulae glide between layouts
    nebU.uN.value = Math.min(MAXG, glows.length);
    glows.slice(0, MAXG).forEach((g, i) => {
      const f = glowFrom[i] || { x: g.x, y: g.y, r: g.r * 0.4, w: 0 };
      nebU.uG.value[i].set(f.x + (g.x - f.x) * e, f.y + (g.y - f.y) * e, f.r + (g.r - f.r) * e, ((f.w ?? 0) + ((g.w ?? 1) - (f.w ?? 0)) * e));
      nebU.uC.value[i].copy(cols[g.group] || cols.accent);
    });
    nebU.uTime.value = t; moteU.uTime.value = t;
    ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 3); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 3);
    for (let i = 0; i < N; i++) {
      const d = depth[i], ox = orbit[i * 3], sp = orbit[i * 3 + 1], ph = orbit[i * 3 + 2];
      const hx = from[i * 2] + (home[i * 2] - from[i * 2]) * ease(Math.min(1, Math.max(0, sk * 1.25 - seed[i] * 0.25)));
      const hy = from[i * 2 + 1] + (home[i * 2 + 1] - from[i * 2 + 1]) * ease(Math.min(1, Math.max(0, sk * 1.25 - seed[i] * 0.25)));
      const a = ph + t * sp;
      const par = (1 - d) * 14;
      pos[i * 3] = (hx + ox * Math.cos(a) + ptr.x * par) * zoom.k + zoom.x;
      pos[i * 3 + 1] = (hy + ox * Math.sin(a * 1.3) + ptr.y * par) * zoom.k + zoom.y;
      pos[i * 3 + 2] = -d;
    }
    geo.attributes.position.needsUpdate = true;
    renderer.autoClear = false; renderer.clear();
    renderer.render(nebScene, nebCam);
    renderer.render(scene, camera);
    if (!still || sk < 1) schedule();
  }
  function schedule() { if (!running) { running = true; requestAnimationFrame(frame); } }

  function resize(w, h) {
    W = w; H = h; dpr = Math.min(2, devicePixelRatio || 1);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = h; camera.updateProjectionMatrix();
    nebU.uSize.value.set(w, h); moteU.uDpr.value = dpr;
    schedule();
  }
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { last = performance.now(); schedule(); } });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) { last = performance.now(); schedule(); } };
  document.addEventListener('visibilitychange', onVis);
  const onMove = (ev) => { const r = figure.getBoundingClientRect(); ptr.tx = ((ev.clientX - r.left) / r.width - 0.5) * -2; ptr.ty = ((ev.clientY - r.top) / r.height - 0.5) * -2; schedule(); };
  figure.addEventListener('pointermove', onMove);
  reduce.addEventListener?.('change', schedule);

  return {
    setScene(list, w, h) {
      if (w !== W || h !== H) resize(w, h);
      // the current (possibly mid-flight) nebulae become the starting point
      const cur = nebU.uG.value;
      glowFrom = list.map((g, i) => {
        const same = glows.findIndex((o) => o.key && o.key === g.key);
        if (same >= 0 && same < MAXG && nebU.uN.value > same) return { x: cur[same].x, y: cur[same].y, r: cur[same].z, w: cur[same].w };
        return { x: g.x, y: g.y, r: g.r * 0.35, w: 0 };
      });
      glows = list.slice(0, MAXG);
      assign();
      tScene = performance.now();
      schedule();
    },
    setZoom(k, x, y) { zoom = { k, x, y }; nebU.uZoom.value = k; nebU.uPan.value.set(x, y); moteU.uZoom.value = k; schedule(); },
    theme() { cols = readColours(figure.closest('.kg') || figure); nebU.uDark.value = moteU.uDark.value = cols.dark ? 1 : 0; assign(); schedule(); },
    dispose() { io.disconnect(); document.removeEventListener('visibilitychange', onVis); figure.removeEventListener('pointermove', onMove); renderer.dispose(); canvas.remove(); },
  };
}
