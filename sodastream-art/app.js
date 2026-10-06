import {t} from './i18n.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {HorizontalBlurShader} from 'three/addons/shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from 'three/addons/shaders/VerticalBlurShader.js';
import {buildArtModel} from './art-model.js';
import {createPhotoreal, loadGainMapHDR, texSet} from './photoreal.js';

const $ = s => document.querySelector(s), reduced = matchMedia('(prefers-reduced-motion: reduce)');
let step = 0, presses = 0, busy = false, inside = false, pressStarted = 0, lastPressFinished = -10000, render = () => {}, cameraView = () => {}, currentView = 'hero';
const chapters = [
  ['THE DESIGN', 'A little leverage.', 'The ART is a manual carbonator: no power and no pump. A CO₂ cylinder stands in the rear housing, and the bottle hangs from the Snap-Lock collar under the metal-trimmed head. Holding the lever down lets gas out of the cylinder, through the head and into the water.'],
  ['PREPARE THE BOTTLE', 'Fill. Lift. Lock.', 'Fill a compatible bottle with cold, plain water to its fill line. With the bottle tilted forward, insert the neck, then push up and back into the Snap-Lock. Watch the bottle swing up into the collar; it hangs above the base.'],
  ['CARBONATE', 'Put the lever to work.', 'Push the lever fully down for one second, then release. Watch the nozzle under the water line: gas leaves it as a jet of bubbles. Some dissolves on the way up; the rest collects in the headspace and raises the pressure, which pushes more CO₂ into the water. The official guide suggests three presses for standard fizz or five for strong fizz.'],
  ['RELEASE', 'Let the pressure go.', 'After releasing the lever, gently tilt the bottle fully forward. The gas trapped in the headspace escapes with a hiss before the bottle comes free. Add flavours only after carbonation, then pour and enjoy.']
];
function sync() {
  const c = chapters[step];
  $('#chapter').textContent = `0${step + 1} / ${c[0]}`; $('#title').textContent = c[1]; $('#copy').textContent = c[2];
  document.querySelectorAll('[data-step]').forEach(b => {b.classList.toggle('selected', +b.dataset.step === step); b.setAttribute('aria-current', +b.dataset.step === step ? 'step' : 'false')});
  $('#count').innerHTML = `${presses} <small>/ 5</small>`; $('#press').disabled = step !== 2 || busy || presses >= 5;
  $('#status').textContent = step === 0 ? 'Select “Fill & lock” to prepare the bottle.' : step === 1 ? 'Bottle filled and locked. Continue to make it fizz.' : step === 3 ? 'Pressure released. Flavours go in afterwards.' : busy ? 'Lever down: gas enters the water.' : presses === 5 ? 'Five presses: strong fizz guidance. Ready to release.' : presses === 3 ? 'Three presses: standard fizz guidance.' : `${presses} of 5 demonstration presses. Each press lasts one second.`;
  $('#next').textContent = ['Next: Fill & lock →', 'Next: Make it fizz →', 'Next: Release & enjoy →', 'Start again ↺'][step];
  $('#gas-legend').hidden = !inside;
  render();
}
function setStep(n) {if (busy) return; step = n; if (n < 2) presses = 0; sync()}
document.querySelectorAll('[data-step]').forEach(b => b.onclick = () => setStep(+b.dataset.step)); $('#next').onclick = () => setStep((step + 1) % 4);
$('#inside').onchange = e => {inside = e.target.checked; if (inside && currentView === 'front') cameraView('hero'); sync()};
$('#press').onclick = () => {if (busy || step !== 2 || presses >= 5) return; busy = true; pressStarted = performance.now(); sync(); setTimeout(() => {busy = false; presses++; lastPressFinished = performance.now(); sync()}, 1000)};
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => cameraView(b.dataset.view)); $('#reset').onclick = () => {if (busy) return; inside = false; $('#inside').checked = false; setStep(0); cameraView('hero')}; sync();

/* Stage colours come from the page theme, so the studio backdrop matches the card in light and dark. */
function stageColours() {const cs = getComputedStyle($('.stage')); return [cs.getPropertyValue('--stage-top').trim() || '#efebe4', cs.getPropertyValue('--stage-bottom').trim() || '#dcd6cc']}
// The backdrop is drawn before tone mapping, so each colour is passed through
// the inverse of the Neutral tone curve: the rendered stage then matches the
// CSS card colour exactly and the canvas edge disappears.
function invNeutral(o, exposure) {
  const S = .76, D = .24, max = Math.max(...o); let c = o.slice();
  if (max >= S) {const np = Math.min(max, .9995), peak = D * D / (1 - np) - D + S, g = 1 - 1 / (.15 * (peak - np) + 1); c = o.map(v => (v - g * np) / (1 - g) * peak / np)}
  const m = Math.min(...c), x = m >= .04 ? null : Math.sqrt(Math.max(0, m) / 6.25), off = x === null ? .04 : x - m;
  return c.map(v => (v + off) / exposure);
}
function backdropTexture(exposure) {
  const [top, bottom] = stageColours().map(c => {const k = new T.Color(c); return [k.r, k.g, k.b]}), n = 256, data = new Uint16Array(n * 4);
  for (let i = 0; i < n; i++) {const v = i / (n - 1), u = Math.min(1, (1 - v) / .62), e = u * u * (3 - 2 * u), rgb = invNeutral(top.map((tc, j) => tc + (bottom[j] - tc) * e), exposure); for (let j = 0; j < 3; j++) data[i * 4 + j] = T.DataUtils.toHalfFloat(rgb[j]); data[i * 4 + 3] = T.DataUtils.toHalfFloat(1)}
  const tex = new T.DataTexture(data, 1, n, T.RGBAFormat, T.HalfFloatType); tex.colorSpace = T.LinearSRGBColorSpace; tex.magFilter = tex.minFilter = T.LinearFilter; tex.needsUpdate = true; return tex;
}

/* Soft contact shadow: the model's underside rendered from below into a small
   texture as depth, blurred twice and laid on the floor. */
function contactShadow(renderer, scene, {width = 3.6, depth = 4.2, far = 1.1, blur = 3.2, opacity = .78, res = 512} = {}) {
  const rt = new T.WebGLRenderTarget(res, res), rtBlur = new T.WebGLRenderTarget(res, res);
  rt.texture.generateMipmaps = rtBlur.texture.generateMipmaps = false;
  const cam = new T.OrthographicCamera(-width / 2, width / 2, depth / 2, -depth / 2, 0, far); cam.rotation.x = Math.PI / 2;
  const depthMat = new T.MeshDepthMaterial(); depthMat.depthTest = depthMat.depthWrite = false;
  depthMat.onBeforeCompile = s => {s.fragmentShader = s.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 1.6 ) );')};
  const h = new T.ShaderMaterial(HorizontalBlurShader), v = new T.ShaderMaterial(VerticalBlurShader); h.depthTest = v.depthTest = false;
  const quad = new FullScreenQuad();
  const plane = new T.Mesh(new T.PlaneGeometry(width, depth), new T.MeshBasicMaterial({map: rt.texture, transparent: true, opacity, depthWrite: false, toneMapped: false}));
  plane.rotation.x = -Math.PI / 2; plane.scale.y = -1; plane.position.y = .002; plane.renderOrder = 1; plane.userData.noAO = true; plane.userData.noContact = true;
  function update() {
    const bg = scene.background, hidden = [];
    scene.traverse(o => {if (o.visible && (o.userData.noContact || o.isLight)) {o.visible = false; hidden.push(o)}});
    scene.background = null; scene.overrideMaterial = depthMat;
    const prevRT = renderer.getRenderTarget(), prevClear = renderer.getClearAlpha(), prevColor = renderer.getClearColor(new T.Color());
    renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam);
    scene.overrideMaterial = null; scene.background = bg; hidden.forEach(o => o.visible = true);
    for (let i = 0; i < 2; i++) {
      h.uniforms.tDiffuse.value = rt.texture; h.uniforms.h.value = blur / 256 * (i ? .6 : 1); quad.material = h; renderer.setRenderTarget(rtBlur); renderer.clear(); quad.render(renderer);
      v.uniforms.tDiffuse.value = rtBlur.texture; v.uniforms.v.value = blur / 256 * (i ? .6 : 1); quad.material = v; renderer.setRenderTarget(rt); renderer.clear(); quad.render(renderer);
    }
    renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevClear);
  }
  return {plane, update, dispose() {rt.dispose(); rtBlur.dispose(); depthMat.dispose(); h.dispose(); v.dispose(); quad.dispose()}};
}

/* Studio environment: the CC0 soft-box HDRI on a sphere, plus three strip
   lights so the polished steel carries long, clean highlights. */
async function studioEnvironment(renderer, source = null, size = 256) {
  const env = new T.Scene(), hdr = source ? source.texture : await new HDRLoader().loadAsync('/assets/hdri/studio_small_09_1k.hdr');
  hdr.mapping = T.EquirectangularReflectionMapping;
  const sphereMat = new T.MeshBasicMaterial({map: hdr, side: T.BackSide}); sphereMat.color.setScalar(.62);
  const sphere = new T.Mesh(new T.SphereGeometry(30, 64, 32), sphereMat); sphere.rotation.y = -.9; env.add(sphere);
  // A dark studio floor below, so polished steel shows a crisp horizon line.
  const ground = new T.Mesh(new T.CircleGeometry(29, 48), new T.MeshBasicMaterial({color: 0x0c0c0c})); ground.rotation.x = -Math.PI / 2; ground.position.y = -6; env.add(ground);
  for (const [w, h, k, p] of [[1.5, .42, 4.2, [-.62, .62, .48]], [.12, 1.7, 5, [.9, .28, -.25]], [.1, 1.4, 2.6, [-.88, .15, -.5]], [1.1, .07, 3.5, [.2, .97, .15]]]) {
    const m = new T.Mesh(new T.PlaneGeometry(w * 15, h * 15), new T.MeshBasicMaterial({color: new T.Color(k, k, k), side: T.DoubleSide}));
    m.position.copy(new T.Vector3(...p).normalize().multiplyScalar(25)); m.lookAt(0, 0, 0); env.add(m);
  }
  const pmrem = new T.PMREMGenerator(renderer), rt = pmrem.fromScene(env, 0, .1, 120, {size});
  env.traverse(o => {if (o.isMesh) {o.geometry.dispose(); o.material.dispose()}}); if (source) source.dispose(); else hdr.dispose(); pmrem.dispose();
  return rt;
}

/* On-stage labels with leader lines. On a phone the labels become numbered
   markers with a key below the stage. */
const LABELS = {
  outside: [['lever', 'Carbonating lever'], ['head', 'Metal-trimmed head'], ['collar', 'Snap-Lock collar'], ['nozzle', 'Gas nozzle'], ['fill', 'Fill line'], ['bottle', 'PET carbonating bottle'], ['housing', 'Rear housing: CO₂ cylinder inside']],
  inside: [['cylinder', 'CO₂ cylinder: liquid CO₂ under pressure'], ['valve', 'Cylinder valve: opens while the lever is down'], ['route', 'Gas route through the head (schematic)'], ['latch', 'Quick Connect latch'], ['headspace', 'Headspace: gas gathers, pressure rises'], ['nozzle', 'Nozzle under the water line'], ['lever', 'Lever (linkage not modelled)']]
};
const NORMALS = {head: [0, 0, 1], collar: [0, 0, 1], bottle: [-.6, 0, .8], fill: [.5, 0, .8], housing: [-1, 0, 0], cylinder: [-.6, 0, .3], valve: [-.3, .3, .5], route: [-.6, .5, .3], latch: [-.5, .3, -.5], headspace: [0, 0, 1], nozzle: [0, 0, 1], lever: [1, .3, .4]};

try {
  const holder = $('#viewport'), scene = new T.Scene(), camera = new T.PerspectiveCamera(28, 1, .1, 100);
  const renderer = new T.WebGLRenderer({antialias: false, powerPreference: 'high-performance'});
  const phone = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = 1.02; renderer.outputColorSpace = T.SRGBColorSpace;
  holder.prepend(renderer.domElement); renderer.domElement.setAttribute('role', 'img'); renderer.domElement.setAttribute('aria-label', 'Reference-based SodaStream ART model. Camera buttons provide keyboard views.');
  const controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false; controls.minDistance = 2.4; controls.maxDistance = 22; controls.maxPolarAngle = Math.PI * .53; controls.enableDamping = false;

  scene.background = backdropTexture(renderer.toneMappingExposure);
  const key = new T.DirectionalLight(0xfff6ec, 1.35); key.position.set(-3.5, 8, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left: -3, right: 3, top: 5.5, bottom: -2.5, near: 1, far: 20}); key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 6; key.target.position.set(0, 1.5, 0); scene.add(key, key.target);
  const rim = new T.DirectionalLight(0xe8f0ff, 1.1); rim.position.set(4, 5, -6); scene.add(rim);
  const floor = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({opacity: .16})); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.noContact = true; scene.add(floor);

  const model = buildArtModel(scene);
  // CC0 scans (ambientCG) replace the procedural micro-surface where the finish is textured:
  // moulding grain on the satin column (Plastic 010, about 2 cm tiles), brushed grain on the
  // lever hub (Metal 009) and the rubber feet and gaskets (Rubber 004). The roughness maps
  // vary around the photographed finish; base roughness is divided by each map's mean.
  {const once = new Set(), texRedraw = () => render();
    scene.traverse(o => {const m = o.material; if (!o.isMesh || !m || once.has(m)) return; once.add(m);
      if (m.name === 'satin-black') {Object.assign(m, texSet('acg-plastic010-grain', [5, 5], texRedraw)); m.roughness = .5 / .363; m.normalScale.set(.35, .35)}
      else if (m.name === 'brushed-steel') {Object.assign(m, texSet('acg-metal009-brushed', [2, 2], texRedraw)); m.roughness = .3 / .469}
      else if (m.name === 'rubber') {Object.assign(m, texSet('acg-rubber004', [3, 3], texRedraw)); m.roughness = .88 / .591}
      else return;
      m.needsUpdate = true});}
  const contact = contactShadow(renderer, scene); scene.add(contact.plane);

  let gtao = null;
  {
    gtao = new GTAOPass(scene, camera, 512, 512);
    gtao.updateGtaoMaterial({radius: .22, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 16, distanceFallOff: 1, screenSpaceRadius: false});
    gtao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16});
    gtao.blendIntensity = .9;
    // Glass, water and bubbles do not occlude: hide them from the AO G-buffer.
    const ov = gtao._overrideVisibility.bind(gtao);
    gtao._overrideVisibility = () => {ov(); scene.traverse(o => {if (o.visible && o.userData.noAO) {o.visible = false; gtao._visibilityCache.push(o)}})};
  }
  // Still frames converge to supersampled AA, stochastic reflections in the
  // gloss black and steel, and (on the lever close-up) a thin-lens depth of field.
  const pr = createPhotoreal({renderer, scene, camera, gtao, phone, ssr: {maxDistance: 2.6, thickness: .22, intensity: 1}});

  let envRT = null, ready = false;
  studioEnvironment(renderer).then(rt => {envRT = rt; scene.environment = rt.texture; scene.environmentIntensity = 1; ready = true; $('#fallback').hidden = true; window.__labReady = true; draw();
    // then the 2k studio light for crisper strip-light reflections (desktop only)
    if (!phone) loadGainMapHDR(renderer, '/assets/textures/studio-hdri-2k/studio_small_09', '/assets/textures/studio-hdri-2k/studio_small_09-gain').then(src => studioEnvironment(renderer, src, 512)).then(rt2 => {const old = envRT; envRT = rt2; scene.environment = rt2.texture; old.dispose(); window.__labEnv2k = true; draw()}).catch(e => console.warn(e))}).catch(err => {console.warn(err); ready = true; $('#fallback').hidden = true; draw()});

  // Labels
  const layer = $('#labels'), svg = layer.querySelector('svg'), key_ = $('#label-key');
  let labelSet = null, labelNodes = [];
  function buildLabels() {
    const set = inside ? 'inside' : 'outside';
    if (labelSet === set) return; labelSet = set;
    layer.querySelectorAll('.tag').forEach(n => n.remove()); svg.innerHTML = ''; key_.innerHTML = '';
    labelNodes = LABELS[set].map(([id, text], i) => {
      const tag = document.createElement('div'); tag.className = 'tag'; tag.innerHTML = `<b>${i + 1}</b><span></span>`; tag.querySelector('span').textContent = text; layer.append(tag);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'), dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '3'); svg.append(line, dot);
      const li = document.createElement('li'); li.textContent = text; key_.append(li);
      return {id, tag, line, dot, li};
    });
  }
  const tmp = new T.Vector3(), camDir = new T.Vector3();
  function placeLabels() {
    buildLabels();
    const w = holder.clientWidth, h = holder.clientHeight, compact = w < 560;
    layer.classList.toggle('compact', compact); svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    camera.getWorldDirection(camDir);
    const items = [];
    for (const n of labelNodes) {
      const [obj, local] = model.anchors[n.id]; tmp.copy(local); obj.localToWorld(tmp);
      const normal = new T.Vector3(...(NORMALS[n.id] || [0, 0, 1])).normalize(), facing = normal.dot(camDir) < .35;
      const p = tmp.clone().project(camera), x = (p.x * .5 + .5) * w, y = (-p.y * .5 + .5) * h;
      const visible = facing && p.z < 1 && x > 4 && x < w - 4 && y > 24 && y < h - 8 && (n.id !== 'nozzle' || step > 1 || inside) && (n.id !== 'fill' || step < 2);
      items.push({n, x, y, visible}); n.li.classList.toggle('off', !visible);
    }
    const cx = w / 2;
    if (compact) {
      for (const it of items) {it.n.tag.style.display = it.visible ? '' : 'none'; it.n.line.style.display = 'none'; it.n.dot.style.display = 'none'; if (it.visible) it.n.tag.style.transform = `translate(${Math.round(it.x - 11)}px,${Math.round(it.y - 11)}px)`}
      return;
    }
    for (const side of ['left', 'right']) {
      const list = items.filter(it => it.visible && (side === 'left' ? it.x < cx : it.x >= cx)).sort((a, b) => a.y - b.y);
      let prev = 30;
      for (const it of list) {
        const tag = it.n.tag; tag.style.display = ''; const tw = tag.offsetWidth, th = tag.offsetHeight;
        let y = Math.max(prev, it.y - th / 2); y = Math.min(y, h - th - 6); prev = y + th + 8;
        const x = side === 'left' ? 14 : w - tw - 14, ex = side === 'left' ? x + tw : x, ey = y + th / 2;
        tag.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
        const bend = side === 'left' ? Math.min(it.x - 18, ex + 24) : Math.max(it.x + 18, ex - 24);
        it.n.line.setAttribute('points', `${ex},${ey} ${bend},${ey} ${it.x},${it.y}`); it.n.line.style.display = ''; it.n.dot.style.display = '';
        it.n.dot.setAttribute('cx', it.x); it.n.dot.setAttribute('cy', it.y);
      }
    }
    for (const it of items) if (!it.visible) {it.n.tag.style.display = 'none'; it.n.line.style.display = 'none'; it.n.dot.style.display = 'none'}
  }

  let frame = 0, transition = null, contactDirty = true; const started = performance.now(); window.__labFrames = 0;
  function draw() {
    cancelAnimationFrame(frame); if (document.hidden || !ready) return;
    const now = performance.now();
    if (transition) {const u = Math.min(1, (now - transition.started) / 650), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; camera.position.lerpVectors(transition.from, transition.to, e); controls.target.lerpVectors(transition.targetFrom, transition.targetTo, e); camera.lookAt(controls.target); if (u === 1) transition = null}
    const moving = busy || now - lastPressFinished < 6000 || (step === 3 && presses > 0 && now - lastPressFinished < 6000);
    const posing = model.update({inside, busy, presses, step, time: (now - started) / 1000, pressPhase: (now - pressStarted) / 1000, reduced: reduced.matches, now});
    if (busy || posing || contactDirty) {contact.update(); contactDirty = false}
    const more = pr.render(); placeLabels(); window.__labFrames++;
    if (more || transition || posing || ((moving || busy) && !reduced.matches) || (inside && busy)) frame = requestAnimationFrame(draw);
    else if (moving && reduced.matches) frame = 0;
  }
  render = () => {contactDirty = true; draw()}; controls.addEventListener('start', () => {transition = null}); controls.addEventListener('change', draw);
  const VIEWS = {hero: [[.56, .26, .79], [.08, 2.12, .05], 1], front: [[0, .07, 1], [0, 2.15, 0], 1], side: [[1, .07, 0], [0, 2.15, 0], 1], rear: [[-.5, .28, -.82], [0, 2.15, -.3], 1], detail: [[.85, .32, .42], [.66, 3.86, .4], .5]};
  const VIEW_NAMES = {hero: '01 / THE WHOLE OBJECT', front: '02 / FRONT ELEVATION', side: '03 / SIDE PROFILE', rear: '04 / CYLINDER HOUSING', detail: '05 / THE CARBONATING LEVER'};
  function fitDistance(scale) {const fov = T.MathUtils.degToRad(camera.fov), hFit = 2.68 / Math.tan(fov / 2), wFit = 1.6 / (Math.tan(fov / 2) * camera.aspect); return Math.max(hFit, wFit) * scale}
  cameraView = name => {
    currentView = name; const [dir, target0, scale] = VIEWS[name], target = name === 'detail' || camera.aspect > .95 ? target0 : [target0[0], target0[1] + .22, target0[2]], d = fitDistance(scale), position = new T.Vector3(...dir).normalize().multiplyScalar(d).add(new T.Vector3(...target));
    if (camera.position.length() > 1 && !reduced.matches) transition = {started: performance.now(), from: camera.position.clone(), to: position, targetFrom: controls.target.clone(), targetTo: new T.Vector3(...target)};
    else {camera.position.copy(position); controls.target.set(...target); controls.update()}
    document.querySelectorAll('[data-view]').forEach(b => {b.classList.toggle('active', b.dataset.view === name); b.setAttribute('aria-pressed', String(b.dataset.view === name))});
    $('#view-label').textContent = VIEW_NAMES[name];
    pr.setDof(name === 'detail' ? {focus: new T.Vector3(...target), aperture: .045} : null); draw();
  };
  function resize() {
    const w = holder.clientWidth, h = holder.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); pr.setSize(w, h);
    if (!transition) {const [dir, target, scale] = VIEWS[currentView], cur = camera.position.clone().sub(controls.target); if (cur.length() > 1) {camera.position.copy(controls.target).add(cur.normalize().multiplyScalar(fitDistance(scale))); controls.update()}}
    draw();
  }
  const observer = new ResizeObserver(resize); observer.observe(holder); document.addEventListener('visibilitychange', draw); reduced.addEventListener('change', draw);
  // Follow the site theme: rebuild the backdrop gradient when it changes.
  const themeWatch = new MutationObserver(() => {const old = scene.background; scene.background = backdropTexture(renderer.toneMappingExposure); old?.dispose(); draw()});
  themeWatch.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme', 'style', 'class']});
  addEventListener('languagechange', () => {labelSet = null; draw()});
  renderer.domElement.addEventListener('webglcontextlost', e => {e.preventDefault(); cancelAnimationFrame(frame); $('#fallback').hidden = false; $('#fallback').textContent = '3D rendering paused. Reload to restore it; the chemistry guide still works.'});
  camera.aspect = holder.clientWidth / Math.max(1, holder.clientHeight); cameraView('hero'); resize();
  addEventListener('pagehide', () => {observer.disconnect(); themeWatch.disconnect(); cancelAnimationFrame(frame); controls.dispose(); envRT?.dispose(); contact.dispose(); pr.dispose(); renderer.dispose()}, {once: true});
} catch (error) {console.error(error); $('#fallback').hidden = false; $('#fallback').textContent = '3D is unavailable in this browser. The guided steps and interactive chemistry still work.'}

if (document.modelContext?.registerTool) {const lifecycle = new AbortController(); addEventListener('pagehide', () => lifecycle.abort(), {once: true}); try {Promise.resolve(document.modelContext.registerTool({name: 'explore_art_step', description: 'Show a stage of the SodaStream ART educational guide and optionally reveal the illustrative gas path.', inputSchema: {type: 'object', properties: {step: {type: 'integer', minimum: 0, maximum: 3}, revealGasPath: {type: 'boolean'}}, required: ['step'], additionalProperties: false}, annotations: {readOnlyHint: false, untrustedContentHint: false}, execute(input) {if (!input || !Number.isInteger(input.step) || input.step < 0 || input.step > 3 || Object.keys(input).some(k => !['step', 'revealGasPath'].includes(k)) || (input.revealGasPath !== undefined && typeof input.revealGasPath !== 'boolean')) throw new Error('Expected step 0-3 and an optional boolean revealGasPath'); if (busy) throw new Error('Wait for the current lever press to finish'); if (input.revealGasPath !== undefined) {inside = input.revealGasPath; $('#inside').checked = inside} setStep(input.step); return {step, title: chapters[step][1], presses, revealGasPath: inside}}}, {signal: lifecycle.signal})).catch(console.warn)} catch (e) {console.warn(e)}}
