import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// One scene unit is 10 cm. The envelope follows the manufacturer's dimension
// graphic: height 43.1 cm, body width 14.5 cm (16.9 cm with the lever), depth
// 24.5 cm. Heights and depths of the head, column, collar, bottle and lever
// pivot were read from the manufacturer's side photograph and scaled to that
// envelope. Hidden internals and the gas route are schematic.
export const DIMENSIONS = {height: 4.31, width: 1.45, lever: .24, depth: 2.45};
const BOTTLE_Z = .61, COLLAR_Y = 2.66, HEAD_BOTTOM = 2.88, HEAD_TOP = 4.31;
const NOZZLE_Y = 2.12, WATER_TOP = 2.23, BOTTLE_BOTTOM = .25, CYL_Z = -.68;

/* ------------------------------------------------------------ micro-surface */
function grainNormal(size = 256, strength = 1.6, cell = 3) {
  const h = new Float32Array(size * size), rnd = n => {const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x)};
  // value noise with two octaves: an orange-peel ripple plus fine grain
  const lat = (gx, gy, period) => rnd(((gx % period + period) % period) * 311.7 + ((gy % period + period) % period) * 74.7 + period);
  const smooth = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const [period, amp] of [[size / (cell * 8), .7], [size / cell, .3]]) {
      const fx = x / size * period, fy = y / size * period, ix = Math.floor(fx), iy = Math.floor(fy), tx = smooth(fx - ix), ty = smooth(fy - iy);
      const a = lat(ix, iy, period), b = lat(ix + 1, iy, period), c = lat(ix, iy + 1, period), d = lat(ix + 1, iy + 1, period);
      v += amp * ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty);
    }
    h[y * size + x] = v;
  }
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d'), img = ctx.createImageData(size, size), H = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = 4 * (y * size + x);
    img.data[i] = (-dx / l * .5 + .5) * 255; img.data[i + 1] = (dy / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; t.anisotropy = 8;
  return t;
}

export function buildArtModel(scene) {
  const root = new T.Group(); root.name = 'art'; scene.add(root);
  const shell = new T.Group(), backCover = new T.Group(), internals = new T.Group();
  root.add(shell, backCover, internals);
  const grain = grainNormal();
  const fine = grain.clone(); fine.repeat.set(9, 9); fine.needsUpdate = true;
  const peel = grain.clone(); peel.repeat.set(3, 3); peel.needsUpdate = true;

  // Finishes read from the product photographs: a mirror-gloss head, a satin
  // column, a glossy plinth, polished stainless trim and collar, brushed hub.
  const gloss = new T.MeshPhysicalMaterial({name: 'gloss-black', color: 0x0b0c0d, roughness: .3, clearcoat: 1, clearcoatRoughness: .045, normalMap: peel, normalScale: new T.Vector2(.05, .05)});
  const satin = new T.MeshPhysicalMaterial({name: 'satin-black', color: 0x0d0e0f, roughness: .5, clearcoat: .35, clearcoatRoughness: .32, normalMap: fine, normalScale: new T.Vector2(.22, .22)});
  const plinth = new T.MeshPhysicalMaterial({name: 'plinth-black', color: 0x0b0c0d, roughness: .34, clearcoat: .85, clearcoatRoughness: .09, normalMap: peel, normalScale: new T.Vector2(.06, .06)});
  const rubber = new T.MeshStandardMaterial({name: 'rubber', color: 0x0a0a0b, roughness: .88});
  const chrome = new T.MeshPhysicalMaterial({name: 'polished-steel', color: 0xc6c9cc, metalness: 1, roughness: .06});
  const brushed = new T.MeshPhysicalMaterial({name: 'brushed-steel', color: 0xbfc3c7, metalness: 1, roughness: .3, anisotropy: .85});
  const grip = new T.MeshPhysicalMaterial({name: 'lever-grip', color: 0x0c0d0e, roughness: .42, clearcoat: .5, clearcoatRoughness: .2, normalMap: fine, normalScale: new T.Vector2(.15, .15)});
  const pink = new T.MeshPhysicalMaterial({name: 'latch-pink', color: 0xc81f66, roughness: .4, clearcoat: .5, clearcoatRoughness: .2});
  const alu = new T.MeshPhysicalMaterial({name: 'cylinder-aluminium', color: 0xc6cacd, metalness: 1, roughness: .34});
  const brass = new T.MeshPhysicalMaterial({name: 'brass', color: 0xc99d52, metalness: 1, roughness: .22});

  const meshes = [];
  function add(geo, mat, pos = [0, 0, 0], parent = root) {const m = new T.Mesh(geo, mat); m.position.set(...pos); m.castShadow = m.receiveShadow = true; parent.add(m); meshes.push(m); return m}
  const round = (w, h, d, r, mat, pos, parent) => add(new RoundedBoxGeometry(w, h, d, 6, r), mat, pos, parent);
  const cyl = (rt, rb, h, mat, pos, parent, n = 72) => add(new T.CylinderGeometry(rt, rb, h, n), mat, pos, parent);
  const lathe = (pts, mat, pos, parent, n = 96) => add(new T.LatheGeometry(pts.map(p => new T.Vector2(Math.max(0, p[0]), p[1])), n), mat, pos, parent);
  const smoothLathe = (pts, mat, pos, parent, n = 96) => {const c = new T.SplineCurve(pts.map(p => new T.Vector2(...p))); return lathe(c.getPoints(140).map(p => [p.x, p.y]), mat, pos, parent, n)};
  function outline(w, h, topR, bottomR, taper = 1) {const top = w / 2, bot = w * taper / 2, y = h / 2, s = new T.Shape(); s.moveTo(-bot + bottomR, -y); s.lineTo(bot - bottomR, -y); s.quadraticCurveTo(bot, -y, bot, -y + bottomR); s.lineTo(top, y - topR); s.quadraticCurveTo(top, y, top - topR, y); s.lineTo(-top + topR, y); s.quadraticCurveTo(-top, y, -top, y - topR); s.lineTo(-bot, -y + bottomR); s.quadraticCurveTo(-bot, -y, -bot + bottomR, -y); return s}
  const extrude = (shape, depth, bevel = .015, seg = 5) => new T.ExtrudeGeometry(shape, {depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, steps: 1, curveSegments: 40});

  /* ---------------------------------------------------------------- plinth */
  // Glossy plinth with a slight draft, rubber feet and a matte bottle pad.
  const base = round(1.45, .19, 2.45, .065, plinth, [0, .095, 0]);
  {const p = base.geometry.attributes.position; for (let i = 0; i < p.count; i++) {const f = 1 - .055 * (p.getY(i) / .19 + .5); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f)} base.geometry.computeVertexNormals();}
  round(.92, .012, .96, .006, satin, [0, .193, BOTTLE_Z - .02]);
  for (const x of [-.52, .52]) for (const z of [-.9, .9]) cyl(.07, .07, .02, rubber, [x, .006, z], root, 24);

  /* ---------------------------------------------------------------- column */
  // Side profile (z, y) of the column that carries the head and houses the
  // cylinder. Its front face leans forward toward the head; the hidden upper
  // edge runs inside the head.
  const prof = new T.Shape();
  prof.moveTo(.07, .17); prof.lineTo(-1.15, .17); prof.lineTo(-1.075, 3.98);
  prof.quadraticCurveTo(-1.065, 4.25, -.82, 4.25); prof.lineTo(-.3, 4.25); prof.lineTo(.1, 3.9); prof.lineTo(.235, 2.9); prof.lineTo(.07, .17);
  const colGeo = extrude(prof, .94, .035, 6);
  colGeo.rotateY(-Math.PI / 2); colGeo.translate(.47, 0, 0);
  {const p = colGeo.attributes.position; for (let i = 0; i < p.count; i++) {const f = 1 + .045 * Math.max(0, 1 - p.getY(i) / 2.6); p.setX(i, p.getX(i) * f)} colGeo.computeVertexNormals();}
  add(colGeo, satin, [0, 0, 0], shell);
  // Horizontal ribs of the bottle rest, following the leaning front face.
  const front = y => .07 + (y - .17) * (.235 - .07) / (2.9 - .17);
  const ribGeo = new RoundedBoxGeometry(.84, .022, .03, 2, .009);
  for (let y = .42; y < 2.62; y += .062) {const r = add(ribGeo, satin, [0, y, front(y) + .028], shell); r.rotation.x = -Math.atan((.235 - .07) / 2.73)}
  // Removable rear cover with a fine parting line.
  const cover = round(.9, 3.66, .03, .012, satin, [0, 2.12, -1.135], backCover); cover.rotation.x = Math.atan(.075 / 3.81);

  /* ---------------------------------------------------------------- head */
  const headH = HEAD_TOP - HEAD_BOTTOM, headY = (HEAD_TOP + HEAD_BOTTOM) / 2;
  const headShape = outline(1.06, headH - .04, .2, .075, .925);
  add(extrude(headShape, 1.43, .02), gloss, [0, headY, -.4], shell);
  // Polished stainless frame around the front face. It wraps about a
  // centimetre round the sides, as in the side photograph.
  const rim = outline(1.1, headH, .22, .085, .925), inner = outline(.98, headH - .12, .17, .05, .925);
  rim.holes.push(new T.Path(inner.getPoints(120)));
  add(extrude(rim, .065, .01, 6), chrome, [0, headY, 1.09], shell);
  const face = add(extrude(outline(.985, headH - .115, .172, .052, .925), .07, .006), gloss, [0, headY, 1.08], shell);
  face.material = gloss.clone(); face.material.roughness = .18; face.material.clearcoatRoughness = .03;

  /* ---------------------------------------------------------------- Snap-Lock collar and nozzle */
  lathe([[.24, 0], [.318, .004], [.334, .02], [.336, .05], [.336, .19], [.328, .214], [.31, .22]], chrome, [0, COLLAR_Y, BOTTLE_Z], shell);
  cyl(.25, .25, .012, rubber, [0, COLLAR_Y + .002, BOTTLE_Z], shell, 48);
  lathe([[.0, 0], [.022, 0], [.026, .012], [.019, .03], [.017, .5], [.026, .53], [.0, .53]], rubber, [0, NOZZLE_Y, BOTTLE_Z], root, 24);

  /* ---------------------------------------------------------------- lever */
  const pivot = new T.Group(); pivot.position.set(.53, 3.76, .1); root.add(pivot);
  const along = g => {g.rotateZ(-Math.PI / 2); return g};
  add(along(new T.CylinderGeometry(.2, .2, .035, 64)), rubber, [.017, 0, 0], pivot);
  add(along(new T.LatheGeometry([[0, .03], [.172, .03], [.178, .048], [.178, .35], [.17, .375], [.148, .386], [0, .386]].map(p => new T.Vector2(...p)), 96)), chrome, [0, 0, 0], pivot);
  add(along(new T.CylinderGeometry(.13, .13, .006, 64)), brushed, [.388, 0, 0], pivot);
  const ring = add(new T.TorusGeometry(.092, .0065, 12, 72), chrome, [.393, 0, 0], pivot); ring.rotation.y = Math.PI / 2;
  add(along(new T.CylinderGeometry(.03, .03, .01, 6)), rubber, [.394, 0, 0], pivot);
  const lever = new T.Group(); pivot.add(lever);
  const arm = new T.Group(); arm.position.x = .33; arm.rotation.x = -Math.atan2(.44, 1.02); lever.add(arm);
  const alongZ = g => {g.rotateX(Math.PI / 2); return g};
  add(along(new T.CylinderGeometry(.105, .105, .1, 48)), chrome, [0, 0, 0], arm);
  add(alongZ(new T.LatheGeometry([[0, 0], [.07, 0], [.066, .1], [.06, .3], [0, .3]].map(p => new T.Vector2(...p)), 48)), chrome, [0, 0, 0], arm);
  add(alongZ(new T.LatheGeometry([[0, .29], [.07, .29], [.074, .31], [.076, .6], [.08, 1.0], [.079, 1.07], [.07, 1.105], [.045, 1.124], [0, 1.128]].map(p => new T.Vector2(...p)), 64)), grip, [0, 0, 0], arm);

  /* ---------------------------------------------------------------- bottle */
  // Fuse-style 1 L bottle: clear PET body, black base cup, neck ring.
  const bottlePivot = new T.Group(); bottlePivot.position.set(0, COLLAR_Y + .04, BOTTLE_Z); root.add(bottlePivot);
  const bottle = new T.Group(); bottle.position.y = BOTTLE_BOTTOM - (COLLAR_Y + .04); bottlePivot.add(bottle);
  const L = COLLAR_Y + .04 - BOTTLE_BOTTOM;
  const bottlePts = [[0, .02], [.26, .02], [.345, .045], [.39, .11], [.403, .24], [.406, .42], [.409, 1.62], [.402, 1.78], [.37, 1.95], [.3, 2.1], [.215, 2.2], [.168, 2.26], [.156, 2.3], [.156, L]];
  const radiusAt = h => {for (let i = 1; i < bottlePts.length; i++) {const [r1, h1] = bottlePts[i - 1], [r2, h2] = bottlePts[i]; if (h <= h2) return r1 + (r2 - r1) * (h - h1) / Math.max(1e-6, h2 - h1)} return .15};
  const pet = new T.MeshPhysicalMaterial({name: 'pet', color: 0x000000, roughness: .045, metalness: 0, ior: 1.57, specularIntensity: 1, side: T.DoubleSide, transparent: true, depthWrite: false});
  pet.blending = T.CustomBlending; pet.blendSrc = T.OneFactor; pet.blendDst = T.OneMinusSrcAlphaFactor; pet.blendSrcAlpha = T.OneFactor; pet.blendDstAlpha = T.OneMinusSrcAlphaFactor;
  pet.onBeforeCompile = s => {
    // A thin PET wall barely bends light: draw its reflections additively and
    // let a Fresnel term grey the silhouette, as in a product photograph.
    s.fragmentShader = s.fragmentShader.replace('#include <opaque_fragment>', `float fr = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 3.0);
      float edge = mix(0.035, 0.6, fr);
      gl_FragColor = vec4(outgoingLight + vec3(0.52, 0.57, 0.6) * edge * 0.35, edge);`);
  };
  pet.customProgramCacheKey = () => 'pet-fresnel';
  const shellMesh = smoothLathe(bottlePts, pet, [0, 0, 0], bottle, 128); shellMesh.castShadow = false; shellMesh.renderOrder = 3; shellMesh.userData.noAO = true;
  smoothLathe([[0, 0], [.27, 0], [.36, .03], [.405, .1], [.418, .22], [.418, .36], [.41, .375]], plinth, [0, 0, 0], bottle, 96);
  lathe([[.155, 2.31], [.195, 2.315], [.2, 2.33], [.195, 2.35], [.155, 2.355]], new T.MeshPhysicalMaterial({color: 0x15181a, roughness: .35, clearcoat: .4}), [0, 0, 0], bottle, 64);
  // Fill line: a moulded band on the shoulder, without lettering.
  const fillH = WATER_TOP - BOTTLE_BOTTOM;
  const fillLine = add(new T.TorusGeometry(radiusAt(fillH) + .003, .0035, 6, 96), new T.MeshStandardMaterial({color: 0xdfe5e8, roughness: .3, transparent: true, opacity: .55}), [0, fillH, 0], bottle);
  fillLine.rotation.x = Math.PI / 2; fillLine.castShadow = false; fillLine.userData.noAO = true;
  // Water: a refracting volume (IOR 1.333) filling the bottle to the fill line.
  const waterPts = []; for (let h = .03; h <= fillH; h += .02) waterPts.push([radiusAt(h) - .008, h]);
  waterPts.unshift([0, .03]); waterPts.push([radiusAt(fillH) - .008, fillH], [0, fillH]);
  const water = new T.MeshPhysicalMaterial({name: 'water', color: 0xffffff, transmission: 1, roughness: .02, ior: 1.333, thickness: .7, attenuationColor: new T.Color(0xd9f1ee), attenuationDistance: 5, specularIntensity: 1});
  const waterMesh = lathe(waterPts, water, [0, 0, 0], bottle, 96); waterMesh.castShadow = false; waterMesh.userData.noAO = true;

  /* ---------------------------------------------------------------- internals (teaching view) */
  smoothLathe([[0, .24], [.25, .24], [.29, .3], [.3, .42], [.3, 2.5], [.28, 2.74], [.2, 2.93], [.125, 3.02], [.112, 3.08], [0, 3.08]], alu, [0, 0, CYL_Z], internals);
  const sleeve = add(new T.CylinderGeometry(.304, .304, 1.95, 72, 1, true), pink, [0, 1.42, CYL_Z], internals);
  lathe([[0, 3.08], [.1, 3.08], [.1, 3.17], [.122, 3.18], [.122, 3.245], [.09, 3.25], [.088, 3.36], [0, 3.36]], brass, [0, 0, CYL_Z], internals, 32);
  for (const x of [-.2, .2]) round(.06, .5, .2, .02, pink, [x, 3.24, CYL_Z], internals);
  const handle = add(new T.TorusGeometry(.2, .032, 14, 48, Math.PI), pink, [0, 3.48, CYL_Z - .02], internals);
  round(.5, .2, .42, .04, satin, [0, 3.56, CYL_Z + .05], internals);
  // Schematic gas route: cylinder valve, through the head, down the nozzle.
  const path = new T.CatmullRomCurve3([[0, 3.38, CYL_Z], [0, 3.62, CYL_Z + .2], [0, 3.72, -.1], [0, 3.62, .38], [0, 3.1, BOTTLE_Z], [0, COLLAR_Y, BOTTLE_Z], [0, NOZZLE_Y + .02, BOTTLE_Z]].map(p => new T.Vector3(...p)), false, 'catmullrom', .2);
  const flow = {value: 0}, flowOn = {value: 0};
  const gas = new T.MeshStandardMaterial({name: 'gas', color: 0x0b5560, emissive: 0x1fd2e4, emissiveIntensity: 1.1, roughness: .35});
  gas.defines = {USE_UV: ''};
  gas.onBeforeCompile = s => {s.uniforms.uFlow = flow; s.uniforms.uOn = flowOn; s.fragmentShader = 'uniform float uFlow;\nuniform float uOn;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float dash = smoothstep(0.35, 0.5, fract(vUv.x * 18.0 - uFlow)) * smoothstep(0.95, 0.8, fract(vUv.x * 18.0 - uFlow));\n totalEmissiveRadiance *= mix(0.55, 0.25 + 1.6 * dash, uOn);')};
  gas.customProgramCacheKey = () => 'gas-flow';
  const tube = add(new T.TubeGeometry(path, 160, .026, 12, false), gas, [0, 0, 0], internals); tube.castShadow = false;

  /* ---------------------------------------------------------------- bubbles */
  // Undissolved gas: a downward jet from the nozzle during a press, then
  // smaller bubbles rising. Counts and speeds are illustrative.
  const N = 340, bubbleGeo = new T.SphereGeometry(1, 14, 10);
  const bubbleMat = new T.MeshStandardMaterial({name: 'bubble', color: 0xffffff, metalness: 1, roughness: .1, envMapIntensity: 1.25});
  const bubbles = new T.InstancedMesh(bubbleGeo, bubbleMat, N); bubbles.castShadow = false; bubbles.frustumCulled = false; bubbles.userData.noAO = true; bottle.add(bubbles);
  const seeds = Array.from({length: N}, (_, i) => {const r = k => {const x = Math.sin((i + 1) * (k + 1) * 91.345 + k * 17.17) * 43758.5453; return x - Math.floor(x)}; return [r(1), r(2), r(3), r(4), r(5)]});
  const dummy = new T.Object3D(), nozzleH = NOZZLE_Y - BOTTLE_BOTTOM;

  // Everything that becomes see-through in the teaching view.
  const fading = [];
  shell.traverse(o => {if (o.isMesh) {o.material = o.material.clone(); fading.push(o)}});
  const pose = {tilt: 0, drop: 0}, target = {tilt: 0, drop: 0}; let poseFrom = null, poseStarted = 0;
  function setPose(tilt, drop, now, animate) {if (target.tilt === tilt && target.drop === drop) return; target.tilt = tilt; target.drop = drop; if (animate) {poseFrom = {...pose}; poseStarted = now} else {pose.tilt = tilt; pose.drop = drop; poseFrom = null}}

  function update({inside, busy, presses, step, time, pressPhase, reduced, now}) {
    for (const o of fading) {if (o.material.transparent !== inside) {o.material.transparent = inside; o.material.needsUpdate = true} o.material.opacity = inside ? .11 : 1; o.material.depthWrite = !inside; o.castShadow = !inside}
    backCover.visible = !inside; internals.visible = inside;
    lever.rotation.x = busy ? (reduced ? .5 : .55 * Math.sin(Math.PI * Math.min(1, pressPhase))) : 0;
    // Bottle poses: locked, or tilted forward and lowered out of the collar.
    const wantTilt = step === 3 ? -.2 : 0, wantDrop = step === 3 ? .05 : 0;
    setPose(wantTilt, wantDrop, now, !reduced);
    let animating = false;
    if (poseFrom) {const u = Math.min(1, (now - poseStarted) / 900), e = u * u * (3 - 2 * u); pose.tilt = poseFrom.tilt + (target.tilt - poseFrom.tilt) * e; pose.drop = poseFrom.drop + (target.drop - poseFrom.drop) * e; if (u >= 1) poseFrom = null; else animating = true}
    bottlePivot.rotation.x = pose.tilt; bottlePivot.position.y = COLLAR_Y + .04 - pose.drop;
    // Gas flow along the schematic route.
    flowOn.value = busy ? 1 : 0; flow.value = reduced ? 0 : time * 2.2;
    // Bubbles.
    const showJet = step === 2 && busy, fizz = (step === 2 || step === 3) && presses > 0;
    bubbles.visible = showJet || fizz;
    if (bubbles.visible) {
      const level = Math.min(1, presses / 5), surf = fillH - .03;
      for (let i = 0; i < N; i++) {
        const [a, b, c, d, e] = seeds[i]; let x, y, z, s;
        if (showJet && i < 250) {
          // Jet: launched downward with a spread, slowed by drag, lifted by buoyancy.
          const life = .95, t = ((reduced ? .5 : pressPhase) + a * life) % life, tau = .16 + .12 * b, v0 = 3.2 + 2.2 * c, phi = .3 * Math.sqrt(d), ang = e * Math.PI * 2;
          const k = tau * (1 - Math.exp(-t / tau)), down = v0 * Math.cos(phi) * k, out = v0 * Math.sin(phi) * k + .05 * t;
          y = nozzleH - .02 - down + (.3 + .25 * b) * t * t; const rr = Math.min(out, radiusAt(Math.max(.05, y)) - .05);
          x = Math.cos(ang) * rr; z = Math.sin(ang) * rr; s = .007 + .016 * c * (1 - .3 * t);
          if (y > surf) y = surf;
        } else {
          // Residual bubbles rising from the walls and base of the bottle.
          if (i / N > .25 + .6 * level && !showJet) {dummy.scale.setScalar(0); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix); continue}
          const speed = .16 + .22 * b, start = .08 + a * (surf - .1), span = surf - .08;
          y = .08 + ((start - .08 + (reduced ? 0 : time) * speed) % span);
          const rr = (radiusAt(y) - .045) * Math.sqrt(c), ang = d * Math.PI * 2 + y * .6 * (e - .5);
          x = Math.cos(ang) * rr; z = Math.sin(ang) * rr; s = .006 + .009 * e;
        }
        dummy.position.set(x, y, z); dummy.scale.setScalar(s); dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
      }
      bubbles.instanceMatrix.needsUpdate = true;
    }
    return animating;
  }

  // Anchors for the on-stage labels, in local coordinates of the given part.
  const anchors = {
    lever: [arm, new T.Vector3(0, 0, .78)],
    head: [root, new T.Vector3(-.36, 3.92, 1.17)],
    collar: [root, new T.Vector3(-.3, COLLAR_Y + .1, BOTTLE_Z + .1)],
    bottle: [bottle, new T.Vector3(-.36, 1.1, .16)],
    fill: [bottle, new T.Vector3(.2, fillH, .27)],
    nozzle: [root, new T.Vector3(0, NOZZLE_Y + .06, BOTTLE_Z)],
    housing: [root, new T.Vector3(-.5, 1.7, -.62)],
    base: [root, new T.Vector3(-.5, .14, .95)],
    cylinder: [root, new T.Vector3(-.28, 1.6, CYL_Z + .1)],
    valve: [root, new T.Vector3(0, 3.3, CYL_Z + .1)],
    route: [root, new T.Vector3(0, 3.72, -.1)],
    headspace: [bottle, new T.Vector3(0, fillH + .14, 0)],
    latch: [root, new T.Vector3(-.2, 3.62, CYL_Z - .02)],
  };
  const glass = [shellMesh, waterMesh, fillLine];
  return {root, update, anchors, glass, path, bounds: new T.Box3(new T.Vector3(-.73, 0, -1.23), new T.Vector3(.97, HEAD_TOP, 1.23))};
}
