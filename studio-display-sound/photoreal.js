/* Photoreal rendering ladder for the WebGLRenderer explainers.

   Live frames (camera or model moving): multisampled HDR render, ground-truth AO
   when the frame budget allows, bloom on emissive parts only, neutral tone map.
   Still frames: the same pipeline plus stochastic screen-space reflections, run
   with sub-pixel jitter (and, on close-ups, a thin-lens aperture) and averaged
   over 32-48 frames. That is supersampled anti-aliasing, glossy reflections and
   depth of field from one accumulation, so thin edges and perforations settle
   instead of shimmering. Objects marked dynamic (flow markers, fans) are drawn
   live over the converged still image, depth-tested against the static scene.
   Adaptive quality: live frame time is measured and AO, bloom and pixel ratio
   step down to hold about 50 fps; the still image is always full quality. */
import * as T from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Pass, FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

export const DYNAMIC_LAYER = 5;
export function markDynamic(obj) {obj.traverse(o => {o.layers.set(DYNAMIC_LAYER); o.userData.prDynamic = true}); return obj}

const VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';

/* ------------------------------------------------------------------ stochastic SSR */
// Default reflectivity read from the physical material: metals by roughness,
// clear-coated paint and glass by their coat or surface roughness.
function defaultSSR(m) {
  if (m.userData && m.userData.ssr !== undefined) return m.userData.ssr;
  if (m.isMeshBasicMaterial || m.isShadowMaterial || m.isMeshDepthMaterial) return null;
  const rough = m.roughness ?? 1, metal = m.metalness ?? 0;
  if (metal > .5 && rough < .45) return {f0: .65, rough};
  if (m.transmission > 0) return {f0: .045, rough: Math.min(rough, .2)};
  if ((m.clearcoat || 0) > .45 && (m.clearcoatRoughness ?? 1) < .3) return {f0: .045, rough: m.clearcoatRoughness};
  if (rough < .25) return {f0: .04, rough};
  return null;
}

class SSRPass extends Pass {
  constructor(scene, camera, {maxDistance = 1, thickness = .05, intensity = 1, steps = 36, ssrOf = defaultSSR} = {}) {
    super();
    this.scene = scene; this.camera = camera; this.ssrOf = ssrOf; this.needsSwap = true; this.seed = 0;
    const depthTexture = new T.DepthTexture(1, 1); depthTexture.type = T.UnsignedIntType;
    this.maskRT = new T.WebGLRenderTarget(1, 1, {type: T.HalfFloatType, minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthTexture, depthBuffer: true});
    this.cache = new WeakMap();
    this.material = new T.ShaderMaterial({
      defines: {STEPS: steps},
      uniforms: {tColor: {value: null}, tMask: {value: null}, tDepth: {value: null}, uProj: {value: new T.Matrix4()}, uInvProj: {value: new T.Matrix4()}, uNear: {value: .1}, uFar: {value: 100}, uMaxDist: {value: maxDistance}, uThick: {value: thickness}, uSeed: {value: 0}, uIntensity: {value: intensity}},
      vertexShader: VERT,
      fragmentShader: `#include <packing>
uniform sampler2D tColor,tMask,tDepth;uniform mat4 uProj,uInvProj;uniform float uNear,uFar,uMaxDist,uThick,uSeed,uIntensity;varying vec2 vUv;
vec3 oct(vec2 f){f=f*2.-1.;vec3 n=vec3(f,1.-abs(f.x)-abs(f.y));float t=max(-n.z,0.);n.x+=n.x>=0.?-t:t;n.y+=n.y>=0.?-t:t;return normalize(n);}
float vz(vec2 uv){return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,uNear,uFar);}
vec3 vpos(vec2 uv,float d){vec4 v=uInvProj*vec4(vec3(uv,d)*2.-1.,1.);return v.xyz/v.w;}
vec2 toUv(vec3 p){vec4 c=uProj*vec4(p,1.);return c.xy/c.w*.5+.5;}
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
void main(){
 vec4 base=texture2D(tColor,vUv);gl_FragColor=base;
 vec4 m=texture2D(tMask,vUv);if(m.b<.001)return;
 float d=texture2D(tDepth,vUv).x;if(d>=1.)return;
 vec3 P=vpos(vUv,d),N=oct(m.rg),V=normalize(P);
 float rough=clamp(m.a,.015,1.),fade=1.-smoothstep(.32,.55,rough);if(fade<=0.)return;
 vec2 xi=fract(vec2(ign(gl_FragCoord.xy),ign(gl_FragCoord.xy+vec2(47.,17.)))+uSeed*vec2(.618034,.754878));
 float a=rough*rough*.8,phi=6.2831853*xi.x,ct=sqrt((1.-xi.y)/(1.+(a*a-1.)*xi.y)),st=sqrt(max(0.,1.-ct*ct));
 vec3 up=abs(N.z)<.999?vec3(0,0,1):vec3(1,0,0),tx=normalize(cross(up,N)),ty=cross(N,tx);
 vec3 H=normalize(tx*st*cos(phi)+ty*st*sin(phi)+N*ct),R=reflect(V,H);if(dot(R,N)<=0.)R=reflect(V,N);
 float NoV=clamp(dot(N,-V),0.,1.),F=m.b+(1.-m.b)*pow(1.-NoV,5.);
 float jit=fract(ign(gl_FragCoord.xy+vec2(13.,71.))+uSeed*.5698403);vec3 O=P+N*(.0015*-P.z);
 float tp=0.,th=0.;bool hit=false;
 for(int i=0;i<STEPS;i++){
  float s=(float(i)+jit)/float(STEPS),t=uMaxDist*s*s+.0005*-P.z;vec3 Q=O+R*t;if(Q.z>-uNear)break;
  vec2 uv=toUv(Q);if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)break;
  float dz=vz(uv)-Q.z;
  if(dz>0.&&dz<uThick+t*.06){float lo=tp,hi=t;for(int k=0;k<5;k++){float mid=(lo+hi)*.5;vec3 M=O+R*mid;if(vz(toUv(M))-M.z>0.)hi=mid;else lo=mid;}th=hi;hit=true;break;}
  tp=t;
 }
 if(!hit)return;
 vec2 hu=toUv(O+R*th);if(texture2D(tDepth,hu).x>=1.)return;
 vec4 hm=texture2D(tMask,hu);if(dot(oct(hm.rg),R)>.25)return;
 vec2 e=smoothstep(0.,.06,hu)*(1.-smoothstep(.94,1.,hu));
 float w=clamp(F*fade*e.x*e.y*(1.-smoothstep(.55,1.,th/uMaxDist))*uIntensity,0.,1.);
 gl_FragColor.rgb=mix(base.rgb,texture2D(tColor,hu).rgb,w);
}`,
      depthTest: false, depthWrite: false
    });
    this.quad = new FullScreenQuad(this.material);
  }
  maskFor(src) {
    let mm = this.cache.get(src);
    if (mm) return mm;
    const s = this.ssrOf(src);
    mm = new T.MeshNormalMaterial({side: src.side, flatShading: !!src.flatShading});
    if (src.normalMap) {mm.normalMap = src.normalMap; mm.normalScale = src.normalScale; mm.normalMapType = src.normalMapType}
    if (src.clippingPlanes) {mm.clippingPlanes = src.clippingPlanes; mm.clipIntersection = src.clipIntersection}
    const f0 = s ? s.f0 : 0, rough = s ? s.rough : 1;
    mm.onBeforeCompile = sh => {
      sh.uniforms.uF0 = {value: f0}; sh.uniforms.uRough = {value: rough};
      sh.fragmentShader = 'uniform float uF0;uniform float uRough;\nvec2 prOct(vec3 n){n/=abs(n.x)+abs(n.y)+abs(n.z);vec2 p=n.z>=0.?n.xy:(1.-abs(n.yx))*vec2(n.x>=0.?1.:-1.,n.y>=0.?1.:-1.);return p*.5+.5;}\n' + sh.fragmentShader;
      const i = sh.fragmentShader.lastIndexOf('}');
      sh.fragmentShader = sh.fragmentShader.slice(0, i) + 'gl_FragColor=vec4(prOct(normalize(normal)),uF0,uRough);\n}';
    };
    mm.customProgramCacheKey = () => 'prmask';
    this.cache.set(src, mm);
    return mm;
  }
  setSize(w, h) {this.maskRT.setSize(w, h)}
  render(renderer, writeBuffer, readBuffer) {
    const scene = this.scene, cam = this.camera, swapped = [], hidden = [];
    scene.traverseVisible(o => {
      if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
      const m = o.material;
      if (!o.isMesh || Array.isArray(m) || o.userData.noSSR || o.userData.prDynamic || (m.transparent && m.opacity < .5 && !(m.transmission > 0)) || (o.userData.noAO && !m.transmission) || m.isShadowMaterial || m.colorWrite === false) {hidden.push(o); return}
      swapped.push(o, m); o.material = this.maskFor(m);
    });
    for (const o of hidden) o.visible = false;
    const bg = scene.background, auto = renderer.shadowMap.autoUpdate, cc = renderer.getClearColor(new T.Color()), ca = renderer.getClearAlpha();
    scene.background = null; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.maskRT); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
    scene.background = bg; renderer.shadowMap.autoUpdate = auto; renderer.setClearColor(cc, ca);
    for (let i = 0; i < swapped.length; i += 2) swapped[i].material = swapped[i + 1];
    for (const o of hidden) o.visible = true;
    const u = this.material.uniforms;
    u.tColor.value = readBuffer.texture; u.tMask.value = this.maskRT.texture; u.tDepth.value = this.maskRT.depthTexture;
    u.uProj.value.copy(cam.projectionMatrix); u.uInvProj.value.copy(cam.projectionMatrixInverse); u.uNear.value = cam.near; u.uFar.value = cam.far; u.uSeed.value = this.seed;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
  dispose() {this.maskRT.dispose(); this.material.dispose(); this.quad.dispose()}
}

/* ------------------------------------------------------------------ sequences */
function halton(i, b) {let f = 1, r = 0; while (i > 0) {f /= b; r += f * (i % b); i = Math.floor(i / b)} return r}
function disk(u, v) {const a = 2 * u - 1, b = 2 * v - 1; if (!a && !b) return [0, 0]; let r, t; if (a * a > b * b) {r = a; t = Math.PI / 4 * (b / a)} else {r = b; t = Math.PI / 2 - Math.PI / 4 * (a / b)} return [r * Math.cos(t), r * Math.sin(t)]}

/* ------------------------------------------------------------------ the ladder */
export function createPhotoreal({renderer, scene, camera, gtao = null, bloom = null, ssr = {}, samples = 32, dofSamples = 48, maxPixelRatio, minPixelRatio = 1, phone = false, liveAO = true}) {
  const dbg = (new URLSearchParams(location.search).get('pr') || '');
  if (dbg.includes('nossr')) ssr = null;
  const composer = new EffectComposer(renderer, new T.WebGLRenderTarget(2, 2, {type: T.HalfFloatType, samples: 4}));
  const renderPass = new RenderPass(scene, camera); composer.addPass(renderPass);
  if (gtao) composer.addPass(gtao);
  const ssrPass = ssr ? new SSRPass(scene, camera, ssr) : null;
  if (ssrPass) composer.addPass(ssrPass);
  if (bloom) composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // running mean of the jittered frames, ping-ponged between two half-float targets
  const accA = new T.WebGLRenderTarget(2, 2, {type: T.HalfFloatType, depthBuffer: false}), accB = accA.clone();
  let accum = accA, accPrev = accB;
  const accMat = new T.ShaderMaterial({uniforms: {t: {value: null}, prev: {value: null}, w: {value: 1}}, vertexShader: VERT, fragmentShader: 'uniform sampler2D t,prev;uniform float w;varying vec2 vUv;void main(){gl_FragColor=mix(texture2D(prev,vUv),texture2D(t,vUv),w);}', depthTest: false, depthWrite: false, blending: T.NoBlending});
  const copyMat = new T.ShaderMaterial({uniforms: {t: {value: null}}, vertexShader: VERT, fragmentShader: 'uniform sampler2D t;varying vec2 vUv;void main(){gl_FragColor=texture2D(t,vUv);}', depthTest: false, depthWrite: false, blending: T.NoBlending});
  const accQuad = new FullScreenQuad(accMat), copyQuad = new FullScreenQuad(copyMat);
  const depthOnly = new T.MeshBasicMaterial({colorWrite: false, side: T.DoubleSide});
  const dprCap = maxPixelRatio || Math.min(devicePixelRatio, phone ? 1.5 : 1.75);
  const st = {level: phone ? 1 : 2, lastStep: performance.now() + 1500, n: 0, sig: NaN, still: 0, dof: null, gtaoAllowed: true, bloomAllowed: true, w: 0, h: 0, pr: dprCap, liveMs: [], accMs: [], hasDyn: false};
  const perf = window.__labPerf = {level: st.level, liveFps: 0, liveFrames: 0, accumSamples: 0, accumMsPerSample: 0, converged: false};
  camera.layers.enable(DYNAMIC_LAYER);

  function setPixelRatio(p) {st.pr = p; renderer.setPixelRatio(p); composer.setPixelRatio(p); if (st.w) resizeTargets()}
  function resizeTargets() {renderer.setSize(st.w, st.h, true); composer.setSize(st.w, st.h); for (const a of [accA, accB]) a.setSize(Math.round(st.w * st.pr), Math.round(st.h * st.pr))}
  setPixelRatio(st.level === 0 ? Math.max(minPixelRatio, 1) : dprCap);

  /* A cheap fingerprint of everything that changes the still image: camera,
     every visible static object's transform and material, lights, background. */
  const _bg = new T.Color();
  let debugMap = null;
  function signature() {
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    let s = 0, k = 1, dyn = false, cur = null;
    const add = v => {s += v * k; k = k * 1.37 % 9.7 + .31; if (debugMap) {const l = debugMap.get(cur) || []; l.push(+v.toFixed(6)); debugMap.set(cur, l)}};
    for (const e of camera.matrixWorld.elements) add(e);
    for (const e of camera.projectionMatrix.elements) add(e);
    const visit = o => {
      cur = o;
      if (!o.visible) {add(.5); return}
      if (o.userData.prDynamic) {dyn = true; return}
      if (o.isLight) {o.layers.enable(DYNAMIC_LAYER); add(o.intensity); add(o.color.r + o.color.g * 2 + o.color.b * 3)}
      if (o.isMesh || o.isLight || o.isPoints || o.isLine) {
        const e = o.matrixWorld.elements; add(e[0] + e[1] * 2 + e[2] * 3 + e[5] * 4 + e[6] * 5 + e[10] * 6 + e[12] * 7 + e[13] * 8 + e[14] * 9);
        const m = o.material;
        if (m && !Array.isArray(m)) {add(m.id); if (m.color) add(m.color.r + m.color.g * 2 + m.color.b * 3); add(m.opacity + (m.transparent ? 2 : 0) + (m.visible ? 0 : 4)); if (m.emissive) add((m.emissive.r + m.emissive.g + m.emissive.b) * (m.emissiveIntensity ?? 1)); add((m.map && m.map.image ? 1 : 0) + (m.normalMap && m.normalMap.image ? 2 : 0) + (m.roughnessMap && m.roughnessMap.image ? 4 : 0));}
        if (o.isInstancedMesh) {add(o.instanceMatrix.version); add(o.count); if (o.instanceColor) add(o.instanceColor.version)}
      }
      for (const c of o.children) visit(c);
    };
    visit(scene); cur = 'scene';
    const bg = scene.background; if (bg && bg.isColor) add(bg.r + bg.g * 2 + bg.b * 3); else if (bg) add(bg.id + (bg.version || 0));
    if (scene.environment) add(scene.environment.id); add(scene.environmentIntensity ?? 1); add(renderer.toneMappingExposure);
    add(st.w + st.h * 3 + st.pr * 7);
    st.hasDyn = dyn;
    return s;
  }

  // window.__prDiff(): names the objects whose fingerprint changes between two frames
  window.__prDiff = () => new Promise(res => {const snap = () => {debugMap = new Map(); const v = signature(); const m = debugMap; debugMap = null; m.set('total', [v, st.sig]); return m}; const a = snap(); requestAnimationFrame(() => requestAnimationFrame(() => {const b = snap(); const out = []; for (const [o, v] of b) if (JSON.stringify(a.get(o)) !== JSON.stringify(v)) out.push((o && (o.name || o.type || o)) + ':' + JSON.stringify(a.get(o)) + ' -> ' + JSON.stringify(v)); res(out.slice(0, 8))}))});
  // frame pacing probe: rAF intervals while live frames are being drawn
  const probe = {on: false, last: 0, until: 0, ts: []};
  function tick(t) {
    if (probe.last) {const dt = t - probe.last; if (dt < 200) {probe.ts.push(dt); if (probe.ts.length > 40) probe.ts.shift()}}
    probe.last = t;
    if (t < probe.until) requestAnimationFrame(tick); else {probe.on = false; probe.last = 0}
  }
  function pacing() {
    const now = performance.now(); probe.until = now + 400;
    if (!probe.on) {probe.on = true; requestAnimationFrame(tick)}
    if (probe.ts.length < 20) return 0;
    return probe.ts.reduce((a, b) => a + b, 0) / probe.ts.length;
  }
  function live() {
    const t0 = performance.now();
    if (gtao) gtao.enabled = liveAO && st.gtaoAllowed && st.level >= 2;
    if (bloom) bloom.enabled = st.bloomAllowed && st.level >= 1;
    if (ssrPass) ssrPass.enabled = false;
    camera.layers.enable(DYNAMIC_LAYER);
    composer.renderToScreen = true; composer.render();
    // frame budget: average rAF interval while live frames are being drawn
    perf.liveFrames++;
    const avg = pacing();
    if (avg) {
      perf.liveFps = Math.round(1000 / avg);
      if (avg > 22 && st.level > 0 && t0 - st.lastStep > 1000) {st.level--; st.lastStep = t0; probe.ts.length = 0; if (st.level === 0 && st.pr > minPixelRatio) setPixelRatio(Math.max(minPixelRatio, Math.min(1.25, st.pr)))}
      else if (avg < 17.5 && st.level < (phone ? 1 : 2) && t0 - st.lastStep > 5000) {st.level++; st.lastStep = t0; probe.ts.length = 0; if (st.pr < dprCap) setPixelRatio(dprCap)}
      perf.level = st.level;
    }
  }

  /* GTAO's rotation and denoise noise are fixed tiles, so averaging frames would keep their
     pattern as a fine speckle in creases. Each accumulated frame gets freshly rotated tiles,
     and the mean converges to smooth occlusion. */
  function reseedAO(i) {
    const g = gtao && gtao.gtaoNoiseTexture, p = gtao && gtao.pdNoiseTexture;
    if (g && g.image && g.image.data) {
      const d = g.image.data, n = d.length / 4, rot = halton(i, 11) * 2 * Math.PI, w = 64 + halton(i, 13) * 191;
      if (!g.userData.base) g.userData.base = Array.from({length: n}, (_, k) => Math.atan2(d[k * 4 + 1] / 127.5 - 1, d[k * 4] / 127.5 - 1));
      for (let k = 0; k < n; k++) {const a = g.userData.base[k] + rot; d[k * 4] = (Math.cos(a) * .5 + .5) * 255; d[k * 4 + 1] = (Math.sin(a) * .5 + .5) * 255; d[k * 4 + 3] = w}
      g.needsUpdate = true;
    }
    if (p && p.image && p.image.data) {const d = p.image.data; for (let k = 0; k < d.length; k++) d[k] = Math.random() * 256 | 0; p.needsUpdate = true}
  }
  const sv = {pos: new T.Vector3(), right: new T.Vector3(), up: new T.Vector3(), P: new T.Matrix4()};
  function accumulateOne() {
    const i = st.n + 1, t0 = performance.now();
    if (gtao) {gtao.enabled = st.gtaoAllowed && !dbg.includes('noao'); if (gtao.enabled) reseedAO(i)}
    if (bloom) bloom.enabled = st.bloomAllowed;
    if (ssrPass) {ssrPass.enabled = true; ssrPass.seed = i}
    camera.layers.disable(DYNAMIC_LAYER);
    // sub-pixel jitter and, on close-ups, a thin-lens aperture sample
    const W = accum.width, H = accum.height, jx = (halton(i, 2) - .5) * 2 / W, jy = (halton(i, 3) - .5) * 2 / H;
    sv.pos.copy(camera.position); sv.P.copy(camera.projectionMatrix);
    let dx = 0, dy = 0, f = 1;
    if (st.dof) {
      const [u, v] = disk(halton(i, 5), halton(i, 7)); dx = u * st.dof.aperture; dy = v * st.dof.aperture;
      f = typeof st.dof.focus === 'number' ? st.dof.focus : camera.position.distanceTo(st.dof.focus);
      sv.right.setFromMatrixColumn(camera.matrixWorld, 0); sv.up.setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(sv.right, dx).addScaledVector(sv.up, dy); camera.updateMatrixWorld();
    }
    const e = camera.projectionMatrix.elements;
    e[8] -= jx + e[0] * dx / f; e[9] -= jy + e[5] * dy / f;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    const auto = renderer.shadowMap.autoUpdate; if (st.n > 0) renderer.shadowMap.autoUpdate = false;
    composer.renderToScreen = false; composer.render();
    renderer.shadowMap.autoUpdate = auto;
    camera.position.copy(sv.pos); camera.projectionMatrix.copy(sv.P); camera.projectionMatrixInverse.copy(sv.P).invert(); camera.updateMatrixWorld();
    camera.layers.enable(DYNAMIC_LAYER);
    [accum, accPrev] = [accPrev, accum];
    accMat.uniforms.t.value = composer.readBuffer.texture; accMat.uniforms.prev.value = accPrev.texture; accMat.uniforms.w.value = 1 / i;
    renderer.setRenderTarget(accum); accQuad.render(renderer); renderer.setRenderTarget(null);
    st.n = i; perf.accumSamples = i; perf.accumMsPerSample = Math.round((perf.accumMsPerSample * (i - 1) + performance.now() - t0) / i * 10) / 10;
  }

  function present() {
    copyMat.uniforms.t.value = accum.texture; renderer.setRenderTarget(null); copyQuad.render(renderer);
    if (!st.hasDyn) return;
    // dynamic layer over the converged image, occluded by the static depth
    const bg = scene.background, auto = renderer.autoClear, sAuto = renderer.shadowMap.autoUpdate, mask = camera.layers.mask, hidden = [];
    scene.background = null; renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
    renderer.clearDepth();
    scene.traverseVisible(o => {const m = o.material; if (o.isMesh && m && (Array.isArray(m) || m.transparent || m.transmission > 0 || m.isShadowMaterial || o.userData.noDepth)) hidden.push(o)});
    for (const o of hidden) o.visible = false;
    camera.layers.disable(DYNAMIC_LAYER); scene.overrideMaterial = depthOnly; renderer.render(scene, camera); scene.overrideMaterial = null;
    for (const o of hidden) o.visible = true;
    camera.layers.set(DYNAMIC_LAYER); renderer.render(scene, camera);
    camera.layers.mask = mask; scene.background = bg; renderer.autoClear = auto; renderer.shadowMap.autoUpdate = sAuto;
  }

  /* Draw one frame. Returns true while the still image is still converging,
     so the caller keeps its animation loop alive. */
  function render() {
    const sig = signature(), target = st.dof ? dofSamples : samples;
    if (sig !== st.sig) {st.sig = sig; st.n = 0; st.still = 0; perf.converged = false; live(); return true}
    st.still++;
    if (dbg.includes('live')) {live(); return false}
    if (st.still < 3) {if (st.hasDyn) live(); return true}
    if (st.n < target) {accumulateOne(); present(); if (st.n >= target) perf.converged = true; return st.n < target}
    present(); return false;
  }
  // window.__prBench(n, level): median cost of n live frames at a quality level, GPU-synchronised (ms)
  window.__prBench = (n = 30, level = st.level) => {
    const keep = st.level, keepPr = st.pr, px = new Uint8Array(4), ms = []; st.level = level; const gl = renderer.getContext();
    setPixelRatio(level === 0 ? Math.max(minPixelRatio, Math.min(1.25, dprCap)) : dprCap); const pr = st.pr;
    for (let k = 0; k < n; k++) {const t = performance.now(); st.lastStep = t; live(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); ms.push(performance.now() - t)}
    st.level = keep; setPixelRatio(keepPr); st.sig = NaN; perf.liveFrames -= n; ms.sort((a, b) => a - b);
    return {level, median: Math.round(ms[n >> 1] * 10) / 10, p90: Math.round(ms[Math.floor(n * .9)] * 10) / 10, px: [st.w, st.h, pr]};
  };
  function setSize(w, h) {st.w = w; st.h = h; resizeTargets(); st.sig = NaN}
  function setDof(d) {if (JSON.stringify(d) !== JSON.stringify(st.dof)) {st.dof = d; st.sig = NaN}}
  function invalidate() {st.sig = NaN}
  return {render, setSize, setDof, invalidate, composer, get level() {return st.level}, set gtaoAllowed(v) {if (st.gtaoAllowed !== v) {st.gtaoAllowed = v; st.sig = NaN}}, set bloomAllowed(v) {if (st.bloomAllowed !== v) {st.bloomAllowed = v; st.sig = NaN}},
    dispose() {composer.dispose(); accA.dispose(); accB.dispose(); ssrPass?.dispose(); accMat.dispose(); copyMat.dispose(); accQuad.dispose(); copyQuad.dispose(); depthOnly.dispose()}};
}

/* ------------------------------------------------------------------ 2k studio light */
/* A 2k HDRI stored as an sRGB base JPEG plus a smooth log2 gain map (see the
   page sources for the encoder). Decoded on the GPU into a half-float
   equirect texture, then prefiltered by PMREM. About 0.5 MB instead of 6 MB. */
export async function loadGainMapHDR(renderer, base, gain) {
  const load = url => new Promise((res, rej) => new T.TextureLoader().load(url, res, undefined, rej));
  const [b, g, meta] = await Promise.all([load(base + '.jpg'), load(gain + '.png'), fetch(base + '.json').then(r => r.json())]);
  for (const t of [b, g]) {t.colorSpace = T.NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = T.LinearFilter}
  const W = b.image.width, H = b.image.height;
  const rt = new T.WebGLRenderTarget(W, H, {type: T.HalfFloatType, depthBuffer: false, generateMipmaps: false});
  const mat = new T.ShaderMaterial({uniforms: {tb: {value: b}, tg: {value: g}, lo: {value: meta.lo}, hi: {value: meta.hi}, gam: {value: meta.gamma}}, vertexShader: VERT,
    fragmentShader: 'uniform sampler2D tb,tg;uniform float lo,hi,gam;varying vec2 vUv;void main(){vec3 c=pow(texture2D(tb,vUv).rgb,vec3(gam));float k=exp2(mix(lo,hi,texture2D(tg,vUv).r));gl_FragColor=vec4(c*k,1.);}', depthTest: false, depthWrite: false});
  const q = new FullScreenQuad(mat), prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); q.render(renderer); renderer.setRenderTarget(prev);
  const tex = rt.texture; tex.mapping = T.EquirectangularReflectionMapping; tex.colorSpace = T.LinearSRGBColorSpace;
  b.dispose(); g.dispose(); mat.dispose(); q.dispose();
  return {texture: tex, dispose: () => rt.dispose()};
}

/* ------------------------------------------------------------------ CC0 scanned surfaces */
/* Small tiled texture sets in /assets/textures/<name>/ (color.jpg sRGB, normal.jpg
   OpenGL tangent normals, rough.jpg). onLoad lets the page restart convergence. */
export function texSet(name, repeat = [1, 1], onLoad, maps = ['normal', 'rough']) {
  const out = {}, loader = new T.TextureLoader();
  for (const m of maps) {
    const t = loader.load(`/assets/textures/${name}/${m}.jpg`, () => onLoad && onLoad());
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8;
    t.colorSpace = m === 'color' ? T.SRGBColorSpace : T.NoColorSpace;
    out[{color: 'map', normal: 'normalMap', rough: 'roughnessMap'}[m]] = t;
  }
  return out;
}
