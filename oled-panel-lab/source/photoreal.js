// Progressive photoreal rendering helpers for three.js EffectComposer pipelines.
//  - Accumulator: a post pass that averages jittered frames while the view is still (supersampling),
//    optionally with a thin-lens aperture (true depth of field converges as samples accumulate) and
//    with neighbourhood clamping so small animated parts (hands, LEDs) do not ghost.
//  - Adaptive: watches frame time while the view moves and steps the pixel ratio down to hold ~50 fps.
import * as THREE from 'three';
import {Pass, FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

export function halton(i, b) { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }

const ACC_FS = `uniform sampler2D tNew; uniform sampler2D tOld; uniform float w; uniform float k; uniform vec2 px; varying vec2 vUv;
void main(){
  vec4 c = texture2D(tNew, vUv);
  if (w >= 1.0) { gl_FragColor = c; return; }
  vec4 h = texture2D(tOld, vUv);
  if (k > 0.0) {
    vec3 m1 = vec3(0.0), m2 = vec3(0.0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec3 s = texture2D(tNew, vUv + vec2(float(x), float(y)) * px).rgb; m1 += s; m2 += s * s; }
    m1 /= 9.0; m2 /= 9.0; vec3 sd = sqrt(max(m2 - m1 * m1, 0.0));
    h.rgb = clamp(h.rgb, m1 - k * sd - 0.002, m1 + k * sd + 0.002);
  }
  gl_FragColor = mix(h, c, w);
}`;
const COPY_FS = 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }';
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

export class Accumulator extends Pass {
  constructor({max = 48, clamp = 0, aperture = 0, focus = 10} = {}) {
    super();
    this.max = max; this.clamp = clamp; this.aperture = aperture; this.focus = focus; this.n = 0;
    const rt = () => new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, depthBuffer: false});
    this.a = rt(); this.b = rt();
    this.mat = new THREE.ShaderMaterial({uniforms: {tNew: {value: null}, tOld: {value: null}, w: {value: 1}, k: {value: 0}, px: {value: new THREE.Vector2()}}, vertexShader: VS, fragmentShader: ACC_FS, depthTest: false, depthWrite: false});
    this.copyMat = new THREE.ShaderMaterial({uniforms: {t: {value: null}}, vertexShader: VS, fragmentShader: COPY_FS, depthTest: false, depthWrite: false});
    this.quad = new FullScreenQuad(this.mat); this.copyQuad = new FullScreenQuad(this.copyMat);
    this._saved = new THREE.Vector3(); this._moved = false; this._r = new THREE.Vector3(); this._u = new THREE.Vector3();
  }
  reset() { this.n = 0; }
  get converged() { return this.n >= this.max; }
  setSize(w, h) { this.a.setSize(w, h); this.b.setSize(w, h); this.mat.uniforms.px.value.set(1 / w, 1 / h); this.n = 0; }
  // Call before composer.render(); w, h are drawing-buffer pixels.
  jitter(camera, w, h) {
    this._moved = false;
    if (this.n === 0) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); return; }
    const i = (this.n % 256) + 1;
    let ox = halton(i, 2) - .5, oy = halton(i, 3) - .5;
    if (this.aperture > 0 && camera.isPerspectiveCamera) {
      const r = Math.sqrt(halton(i, 5)) * this.aperture, a = halton(i, 7) * Math.PI * 2, dx = r * Math.cos(a), dy = r * Math.sin(a);
      camera.updateMatrixWorld();
      this._r.setFromMatrixColumn(camera.matrixWorld, 0); this._u.setFromMatrixColumn(camera.matrixWorld, 1);
      this._saved.copy(camera.position); this._moved = true;
      camera.position.addScaledVector(this._r, dx).addScaledVector(this._u, dy); camera.updateMatrixWorld();
      const fpx = (h / 2) / Math.tan(camera.fov * Math.PI / 360) * camera.zoom;
      ox += -dx * fpx / this.focus; oy += dy * fpx / this.focus;
    }
    camera.setViewOffset(w, h, ox, oy, w, h);
  }
  restore(camera) {
    if (camera.view && camera.view.enabled) camera.clearViewOffset();
    if (this._moved) { camera.position.copy(this._saved); camera.updateMatrixWorld(); this._moved = false; }
  }
  render(renderer, writeBuffer, readBuffer) {
    const u = this.mat.uniforms;
    u.tNew.value = readBuffer.texture; u.tOld.value = this.a.texture;
    u.w.value = this.n === 0 ? 1 : 1 / (this.n + 1); u.k.value = this.clamp;
    renderer.setRenderTarget(this.b); this.quad.render(renderer);
    const t = this.a; this.a = this.b; this.b = t;
    this.copyMat.uniforms.t.value = this.a.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.copyQuad.render(renderer);
    if (this.n < this.max) this.n++;
  }
  dispose() { this.a.dispose(); this.b.dispose(); this.mat.dispose(); this.copyMat.dispose(); this.quad.dispose(); this.copyQuad.dispose(); }
}

// Steps through quality levels (usually pixel ratios) while the view is moving.
export class Adaptive {
  constructor(levels, apply, {slowMs = 21, fastMs = 17.6} = {}) {
    this.levels = levels; this.apply = apply; this.i = 0; this.ema = 16.7; this.count = 0; this.floor = levels.length; this.slowMs = slowMs; this.fastMs = fastMs;
    this.publish();
  }
  get level() { return this.levels[this.i]; }
  frame(ms, moving) {
    // Single long frames (shader compiles, texture uploads, tab switches) are hitches, not sustained load.
    if (!moving || !(ms > 0) || ms > 70) return;
    this.ema = this.ema * .92 + ms * .08; this.count++;
    if (this.count > 40 && this.ema > this.slowMs && this.i < this.levels.length - 1) { this.floor = this.i; this.i++; this.apply(this.level, this.i); this.count = 0; this.ema = 16.7; this.publish(); }
    else if (this.count > 400 && this.ema < this.fastMs && this.i > 0 && this.i - 1 < this.floor) { this.i--; this.apply(this.level, this.i); this.count = 0; this.publish(); }
  }
  publish() { if (typeof window !== 'undefined') window.__quality = {level: this.i, value: this.level, ema: +this.ema.toFixed(1)}; }
}

// Shared texture loader for the CC0 scanned surface sets in /assets/textures/.
const texCache = new Map();
export const textureEvents = {onLoad: null};
export function scanned(url, {srgb = false, repeat = [1, 1], anisotropy = 8} = {}, onLoad) {
  const key = url + repeat.join(',');
  if (texCache.has(key)) return texCache.get(key);
  const t = new THREE.TextureLoader().load(url, tex => { if (onLoad) onLoad(tex); if (textureEvents.onLoad) textureEvents.onLoad(tex); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = anisotropy;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texCache.set(key, t); return t;
}
