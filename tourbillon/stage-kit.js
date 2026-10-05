/* stage-kit.js: the pieces the two watch pages share on top of studio-look.js.
 *   - a loading veil with progress while the model and the studio light arrive;
 *   - a GLB loader with the Draco decoder;
 *   - canvas-drawn surfaces that the shared library does not have: forged carbon,
 *     a fine engraved dial grid, aventurine;
 *   - callout labels that never overlap: anchors on each part, labels stacked in
 *     two columns either side of the subject, joined by leader lines;
 *   - framing: fit the camera to a set of parts from a given direction.
 * The same file sits in /tourbillon/ and /perpetual-calendar/; each page imports its own copy. */
import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/* ------------------------------------------------------------------ loading veil */
export function loadingVeil(stage, ja) {
  const el = document.createElement('div');
  el.className = 'lab-loading'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<span class="lab-loading-ring" aria-hidden="true"></span><span class="lab-loading-text"></span><span class="lab-loading-bar" aria-hidden="true"><i></i></span>';
  stage.appendChild(el);
  const text = el.querySelector('.lab-loading-text'), bar = el.querySelector('.lab-loading-bar i');
  const say = (en, jp) => { text.textContent = ja ? jp : en; };
  say('Loading the watch', '時計を読み込み中');
  return {
    progress(f) { bar.style.width = `${Math.round(Math.max(0.03, Math.min(1, f)) * 100)}%`; },
    step(en, jp) { say(en, jp); },
    done() { el.classList.add('is-done'); setTimeout(() => el.remove(), 600); },
    fail(en, jp) { el.classList.add('is-error'); say(en, jp); },
  };
}

/* ------------------------------------------------------------------ GLB with Draco */
let draco = null;
export function loadGLB(url, onProgress) {
  if (!draco) { draco = new DRACOLoader(); draco.setDecoderPath('/vendor/three/r186/examples-jsm/libs/draco/'); }
  const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
  return loader.loadAsync(url, (e) => { if (e.lengthComputable && e.total) onProgress?.(e.loaded / e.total); });
}

/* ------------------------------------------------------------------ canvas surfaces */
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
function canvasTex(size, draw, { srgb = true, repeat = 1 } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = size; const ctx = c.getContext('2d'); draw(ctx, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8; t.repeat.setScalar(repeat); return t;
}
/** Forged carbon: chopped tow pressed at random angles, a marbled black and graphite. */
export function forgedCarbon(repeat = 1.2) {
  return canvasTex(1024, (ctx, n) => {
    ctx.fillStyle = '#121214'; ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 6000; i++) {
      const x = rnd() * n, y = rnd() * n, a = rnd() * Math.PI, l = 14 + rnd() * 70, w = 2 + rnd() * 9, g = 14 + Math.floor(rnd() * 34);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      const gr = ctx.createLinearGradient(0, -w, 0, w); gr.addColorStop(0, `rgba(${g},${g},${g + 3},0)`); gr.addColorStop(0.5, `rgba(${g},${g},${g + 3},0.85)`); gr.addColorStop(1, `rgba(${g},${g},${g + 3},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, l, w, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }, { repeat });
}
/** A plain fine engraved grid for the dial (normal map): thin V-grooves on a 0.42 mm pitch.  Deliberately not a raised pyramid pattern. */
export function fineGridNormal(cellsPerTile = 32, repeat = 1.49) {
  return canvasTex(512, (ctx, n) => {
    const img = ctx.createImageData(n, n); const p = n / cellsPerTile; const g = 1.3;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = (x % p) / p - 0.5, fy = (y % p) / p - 0.5;            // -0.5..0.5 within a cell; the groove sits at the cell edge
      const sx = Math.abs(fx) > 0.5 - 0.09 / g ? Math.sign(fx) : 0, sy = Math.abs(fy) > 0.5 - 0.09 / g ? Math.sign(fy) : 0;
      const nx = -sx * 0.6, ny = sy * 0.6, nz = 1; const l = Math.hypot(nx, ny, nz); const i = 4 * (y * n + x);
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, { srgb: false, repeat });
}
/** Aventurine: deep blue glass with copper-bright flecks, for the moon disc's sky. */
export function aventurine(repeat = 3) {
  return canvasTex(512, (ctx, n) => {
    const gr = ctx.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n * 0.7); gr.addColorStop(0, '#16285e'); gr.addColorStop(1, '#0c1840');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 2200; i++) { const b = 150 + Math.floor(rnd() * 105); ctx.fillStyle = `rgba(${b},${Math.floor(b * 0.86)},${Math.floor(b * 0.7)},${0.35 + rnd() * 0.65})`; const r = rnd() < 0.08 ? 1.6 : 0.8; ctx.fillRect(rnd() * n, rnd() * n, r, r); }
  }, { repeat });
}

/* ------------------------------------------------------------------ highlight materials */
export function dimOf(m) {
  const d = m.clone(); d.transparent = true; d.opacity = 0.04; d.depthWrite = false; d.envMapIntensity = 0.15; d.color?.multiplyScalar(0.5);
  d.transmission = 0; d.clearcoat = 0; d.normalMap = null; d.map = null; d.specularIntensity = 0.2; d.emissive?.setScalar(0); d.roughness = Math.max(0.6, d.roughness ?? 0.6); return d;
}
let ghostMat = null;
export function ghost() {
  if (!ghostMat) ghostMat = new THREE.MeshPhysicalMaterial({ name: 'ghost', color: 0xb8cde4, emissive: 0x2c3e55, emissiveIntensity: 0.6, metalness: 0, roughness: 0.35, transparent: true, opacity: 0.2, depthWrite: false, envMapIntensity: 0.5 });
  return ghostMat;
}

/* ------------------------------------------------------------------ callouts */
const short = (s) => s.split(/[,、（(]/)[0].trim();
export class Callouts {
  constructor(layer, canvas) {
    this.layer = layer; this.canvas = canvas; this.items = [];
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); this.svg.setAttribute('class', 'lab-leaders');
    layer.appendChild(this.svg);
  }
  /** items: [{ key, text, anchor(v3) -> fills world position, or false when hidden }] */
  set(items) {
    for (const it of this.items) it.el.remove();
    this.svg.replaceChildren();
    const narrow = false;
    this.items = items.map((it) => {
      const el = document.createElement('span'); el.className = 'lab-label'; el.dataset.part = it.key; el.textContent = narrow ? short(it.text) : it.text;
      this.layer.appendChild(el);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path'); line.setAttribute('class', 'lab-leader'); this.svg.appendChild(line);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '2.6'); dot.setAttribute('class', 'lab-leader-dot'); this.svg.appendChild(dot);
      return { ...it, el, line, dot, w: 0, h: 0 };
    });
    this.measure();
  }
  measure() { const hid = this.layer.hidden; this.layer.hidden = false; for (const it of this.items) { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; } this.layer.hidden = hid; }
  /** subject: { center: Vector3, radius } of what the stage is about; labels are kept outside its silhouette when there is room. */
  place(camera, show = true, subject = null) {
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight; const v = new THREE.Vector3();
    let scx = W / 2, srx = 0;
    if (subject) {
      v.copy(subject.center).project(camera); scx = (v.x * 0.5 + 0.5) * W;
      const d = camera.position.distanceTo(subject.center); srx = subject.radius / (d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * (H / 2) * 0.82;
    }
    this.layer.hidden = !show || !this.items.length; if (this.layer.hidden) return;
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`); this.svg.setAttribute('width', W); this.svg.setAttribute('height', H);
    if (this.items.some((it) => !it.w)) this.measure();
    const live = [];
    for (const it of this.items) {
      const ok = it.anchor(v); if (ok !== false) v.project(camera);
      const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
      it.on = ok !== false && v.z < 1 && x > 0 && x < W && y > 0 && y < H; it.ax = x; it.ay = y;
      if (it.on) live.push(it); else { it.el.style.opacity = 0; it.line.setAttribute('d', ''); it.dot.setAttribute('r', '0'); }
    }
    const gap = 4, pad = 8, reach = Math.min(64, W * 0.09);
    for (const left of [true, false]) {
      const col = live.filter((it) => (it.ax < scx) === left).sort((a, b) => a.ay - b.ay);
      for (const it of col) it.y = Math.min(H - pad - it.h, Math.max(pad, it.ay - it.h / 2));
      for (let i = 1; i < col.length; i++) col[i].y = Math.max(col[i].y, col[i - 1].y + col[i - 1].h + gap);
      for (let i = col.length - 1; i >= 0; i--) {
        const lim = i === col.length - 1 ? H - pad - col[i].h : col[i + 1].y - gap - col[i].h;
        col[i].y = Math.max(pad, Math.min(col[i].y, lim));
      }
      for (const it of col) {
        it.x = left ? Math.max(pad, Math.min(it.ax - reach - it.w, scx - srx - it.w - 10)) : Math.min(W - pad - it.w, Math.max(it.ax + reach, scx + srx + 10));
        const ex = left ? it.x + it.w : it.x, ey = it.y + it.h / 2; const kx = left ? ex + 10 : ex - 10;
        it.el.style.transform = `translate(${it.x.toFixed(0)}px, ${it.y.toFixed(0)}px)`; it.el.style.opacity = 1;
        it.line.setAttribute('d', `M${it.ax.toFixed(1)},${it.ay.toFixed(1)} L${kx.toFixed(1)},${ey.toFixed(1)} L${ex.toFixed(1)},${ey.toFixed(1)}`);
        it.dot.setAttribute('cx', it.ax.toFixed(1)); it.dot.setAttribute('cy', it.ay.toFixed(1)); it.dot.setAttribute('r', '2.6');
      }
    }
  }
}

/** Anchor point (object-local, three axes) for a part, from the builder's meta anchor in Blender axes (x, y, z) -> (x, z, -y). */
export function anchorOf(part, o) {
  if (part?.anchor) { const [x, y, z] = part.anchor; return new THREE.Vector3(x, z, -y); }
  const b = new THREE.Box3().setFromObject(o); const c = b.getCenter(new THREE.Vector3()); return o.worldToLocal(c);
}

/* ------------------------------------------------------------------ framing */
const box = new THREE.Box3(), tmp = new THREE.Box3();
function visibleChain(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
/** Camera position and target that fit `objects` seen from azimuth/elevation (degrees), with a margin. */
export function fitView(objects, camera, az, el, margin = 1.12) {
  box.makeEmpty();
  for (const o of objects) { if (!o || !visibleChain(o)) continue; o.updateWorldMatrix(true, true); tmp.setFromObject(o, true); if (!tmp.isEmpty()) box.union(tmp); }
  if (box.isEmpty()) return null;
  const s = box.getBoundingSphere(new THREE.Sphere());
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const d = (s.radius * margin) / Math.sin(Math.min(vf, hf) / 2);
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  const t = s.center;
  return [[t.x + d * Math.sin(a) * Math.cos(e), t.y + d * Math.sin(e), t.z + d * Math.cos(a) * Math.cos(e)], [t.x, t.y, t.z], { center: t.clone(), radius: s.radius }];
}
