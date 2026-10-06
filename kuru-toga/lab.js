/* Inside the Kuru Toga: the engine, and what its turning is worth.
 *
 * Two views share one canvas and one renderer. The engine view is built at the
 * proportions of a real 0.5 mm mechanism, about three and a half millimetres
 * across the cam rings, so the teeth are as small next to the barrel as they
 * actually are. The rotor's height is not animated on its own: it is solved
 * from the cam contact every frame, so a tooth is always either seated or
 * riding the opposing slope, never through it. The wear view runs the
 * simulation in model.js and paints what each stroke leaves on the paper.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mountLab, bindControls, readColors, onThemeChange, isDark } from '/assets/lab-kit/lab-kit.js';
import { createStudio, surface, ensureUVs } from '/assets/lab-kit/studio-look.js';
import { engineState, degreesPerStroke, makeTip, wearStroke, coneHalfAngle, DEG } from './model.js';

const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');
const labelLayer = document.getElementById('labels');
const unrolled = document.getElementById('unrolled');

/* The two editions share this file, so every string the scene writes into the
 * page lives here rather than in the markup. */
const JA = document.documentElement.lang.startsWith('ja');
const T = JA ? {
  spring: 'コイルバネ（ローターを前へ押す）', upper: '上カムリング（固定）', rotor: 'ローター（回って滑る）',
  lower: '下カムリング（固定）', chuck: 'チャック（芯をつかむ）', lead: '芯 0.5 mm', housing: '外筒（固定、透明で表示）',
  perStroke: '一画あたり', perTurn: '一周の画数', turned: '回転の累計', strokes: '画数',
  driving: '駆動', upperRing: '上リング', lowerRing: '下リング', neither: 'どちらでもない',
  fixedLead: '回らない芯', turningLead: '回る芯', narrower: '細さの差', cone: '先端の円錐',
  pressing: '押している。ローターが上がり、上の歯が固定された上リングに乗り上げる。半歯ぶん。',
  lifting: '離している。バネがローターを押し下げ、下の歯が下リングに乗り上げる。残りの半歯ぶん。',
  noLift: 'ペンが紙から離れないので、ローターは一周せず、芯は回らない。',
  laneFixed: '回転なし', laneTurning: '回転あり', lineW: '線幅',
  shortSpring: 'バネ', shortUpper: '上カム（固定）', shortRotor: 'ローター', shortLower: '下カム（固定）', shortChuck: 'チャック', shortLead: '芯', shortHousing: '外筒',
} : {
  spring: 'spring: pushes the rotor forward', upper: 'upper cam ring, fixed', rotor: 'rotor: turns and slides',
  lower: 'lower cam ring, fixed', chuck: 'chuck: grips the lead', lead: 'lead, 0.5 mm', housing: 'housing, fixed (drawn clear)',
  perStroke: 'per stroke', perTurn: 'strokes per turn', turned: 'turned so far', strokes: 'strokes',
  driving: 'driving', upperRing: 'upper ring', lowerRing: 'lower ring', neither: 'neither ring',
  fixedLead: 'fixed lead', turningLead: 'turning lead', narrower: 'narrower by', cone: 'tip cone',
  pressing: 'Pressing. The rotor rises and its upper teeth ride the fixed upper ring: half a tooth.',
  lifting: 'Lifting. The spring drives the rotor down and its lower teeth ride the lower ring: the other half.',
  noLift: 'The pen never leaves the paper, so the rotor never cycles and the lead never turns.',
  laneFixed: 'no rotation', laneTurning: 'turning', lineW: 'line',
  shortSpring: 'spring', shortUpper: 'upper cam, fixed', shortRotor: 'rotor', shortLower: 'lower cam, fixed', shortChuck: 'chuck', shortLead: 'lead', shortHousing: 'housing',
};

const params = {
  view: 'engine',
  teeth: 40,
  running: true,
  lift: true,
  hold: 60,
  wearRate: 1,        // microns of lead per stroke
  diameter: 0.5,
  rate: 1.1,          // strokes a second
};

/* The engine, in millimetres. The cam ring diameters follow a 0.5 mm pencil.
 * Tooth height and cushion travel are not published anywhere I could find, so
 * these are the smallest values that still let the cam ride cleanly, and the
 * page says as much rather than pretending to a measurement.
 *
 * Heights, from the lower ring's tooth roots at y = 0 upward:
 *   lower ring   teeth 0..toothH, body down to -ringBody
 *   rotor        lower teeth seated on the lower ring at rest; a body; upper
 *                teeth from Ht to Ht + toothH, half a pitch round
 *   upper ring   teeth hanging down to Hu: one cushion gap plus half a tooth
 *                clear of the rotor's crests at rest
 */
const ENG = {
  housing: [1.98, 2.32], camInner: 1.05, camOuter: 1.95, rotorInner: 1.05, rotorOuter: 1.9,
  ringBody: 0.7, toothH: 0.18, gap: 0.10, rotorBody: 1.25,
  tube: [0.3, 0.52], leadR: 0.25,
};
ENG.travel = ENG.gap + ENG.toothH / 2;          // the rotor's whole axial stroke
ENG.Ht = ENG.toothH + ENG.rotorBody;             // rotor: root of its upper teeth
ENG.Hu = ENG.travel + ENG.Ht;                    // upper ring: tips of its teeth
ENG.top = ENG.Hu + ENG.toothH + ENG.ringBody;    // upper ring's back face
ENG.collar = ENG.top + 0.08;                     // spring seat on the moving tube, at rest
ENG.shoulder = ENG.collar + 0.22 + 3.1;          // the fixed seat the spring pushes against
const NOSE = { top: -ENG.ringBody - 0.35, bottom: -ENG.ringBody - 6.6, pipe: 2.8, leadOut: 0.9 };

/** Rotor height and turn from the cam contact, for a point in the press-lift cycle.
 *  The first 15% of each half stroke takes up the cushion gap with no turning;
 *  then the teeth ride, and the height follows the slope the rotor slides on.
 *  The turn matches engineState() in model.js. */
function engineContact(phase, teeth) {
  const p = ((phase % 1) + 1) % 1, pressing = p < 0.5, local = pressing ? p * 2 : (p - 0.5) * 2;
  const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const ride = sm((local - 0.15) / 0.7), free = sm(local / 0.15);
  const half = Math.PI / teeth;                  // half a tooth, radians
  if (pressing) return { y: local < 0.15 ? ENG.gap * free : ENG.gap + (ENG.toothH / 2) * ride, turn: half * ride };
  return { y: local < 0.15 ? ENG.travel - ENG.gap * free : (ENG.toothH / 2) * (1 - ride), turn: half + half * ride };
}

// --------------------------------------------------------------- geometry --

/** One face of a sawtooth cam ring, as {a, y} around the circle. */
function sawProfile(teeth, height, hand, phase, seg = 6) {
  const pts = [];
  for (let t = 0; t < teeth; t++) {
    for (let s = 0; s <= seg; s++) {
      const u = s / seg;
      pts.push({ a: ((t + u + phase) / teeth) * Math.PI * 2, y: height * (hand > 0 ? u : 1 - u) });
    }
  }
  pts.push({ a: pts[0].a + Math.PI * 2, y: pts[0].y });
  return pts;
}
const flatProfile = (ref, y) => ref.map(({ a }) => ({ a, y }));
const shift = (prof, dy) => prof.map(({ a, y }) => ({ a, y: y + dy }));

/**
 * A ring whose top and bottom surfaces are given as profiles around the circle.
 * A flat profile on one face gives a fixed ring; sawteeth on both gives the
 * rotor. Repeated angles inside a profile become the vertical face of a tooth,
 * which is what makes the teeth read as cut rather than moulded. Angles run
 * clockwise seen from the back of the pencil (z = -r sin a), so a falling
 * angle is the counter-clockwise turn, seen from the tip, that the teardown
 * reports.
 */
function ringGeometry(inner, outer, topProfile, botProfile) {
  const n = topProfile.length;
  const pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const { a, y: ty } = topProfile[i];
    const by = botProfile[i].y;
    const c = Math.cos(a), s = -Math.sin(a);
    pos.push(inner * c, ty, inner * s, outer * c, ty, outer * s,
             inner * c, by, inner * s, outer * c, by, outer * s);
  }
  for (let i = 0; i < n - 1; i++) {
    const A = i * 4, B = (i + 1) * 4;
    idx.push(A, A + 1, B + 1, A, B + 1, B);
    idx.push(A + 2, B + 2, B + 3, A + 2, B + 3, A + 3);
    idx.push(A + 1, A + 3, B + 3, A + 1, B + 3, B + 1);
    idx.push(A, B, B + 2, A, B + 2, A + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // Flat normals. Sharing vertices between the tooth faces and the ring walls
  // would average their normals together and smear the cut edges into a soft
  // fluted look, which is not what a cut cam looks like.
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  g.dispose();
  return flat;
}

/** A surface of revolution about y from [r, y] points; a closed, anticlockwise profile makes a solid. */
function lathe(pts, seg = 64, start = 0, len = Math.PI * 2) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, start, len);
}
/** A tube wall with square ends: inner and outer radius, bottom and top. */
const tubePts = (ri, ro, y0, y1) => [[ri, y0], [ro, y0], [ro, y1], [ri, y1], [ri, y0]];

/** A compression spring as a swept tube, built at unit height and scaled. Its
 *  end turns are closed, as a real one's are. */
function springGeometry(radius, wire, coils, seg = 360) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, a = t * coils * Math.PI * 2;
    const turn = t * coils, body = coils - 2;
    const h = turn < 1 ? turn * 0.02 : turn > coils - 1 ? 1 - (coils - turn) * 0.02 : 0.02 + ((turn - 1) / body) * 0.96;
    pts.push(new THREE.Vector3(radius * Math.cos(a), h, radius * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, wire, 10, false);
}

/** The lead tip: the polar height field, plus a skirt up to the shaft. */
function tipGeometry(tip, shaftTop) {
  const { nr, sectors } = tip;
  const count = nr * sectors + sectors;
  const idx = [];
  for (let i = 0; i < nr - 1; i++) {
    for (let j = 0; j < sectors; j++) {
      const j2 = (j + 1) % sectors;
      idx.push(i * sectors + j, (i + 1) * sectors + j, (i + 1) * sectors + j2,
               i * sectors + j, (i + 1) * sectors + j2, i * sectors + j2);
    }
  }
  const skirt = nr * sectors;
  for (let j = 0; j < sectors; j++) {
    const j2 = (j + 1) % sectors;
    idx.push((nr - 1) * sectors + j, (nr - 1) * sectors + j2, skirt + j2,
             (nr - 1) * sectors + j, skirt + j2, skirt + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  g.setIndex(idx);
  g.userData = { tip, shaftTop };
  return g;
}

function updateTipGeometry(g, graphite, highlight) {
  const { tip, shaftTop } = g.userData;
  const { nr, sectors, rho, h, cos, sin, contact } = tip;
  const pos = g.attributes.position.array, col = g.attributes.color.array;
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < sectors; j++) {
      const k = i * sectors + j, o = k * 3;
      pos[o] = rho[i] * cos[j]; pos[o + 1] = rho[i] * sin[j]; pos[o + 2] = h[k];
      const c = contact[k] ? highlight : graphite;
      col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b;
    }
  }
  for (let j = 0; j < sectors; j++) {
    const o = (nr * sectors + j) * 3;
    pos[o] = tip.radius * cos[j]; pos[o + 1] = tip.radius * sin[j]; pos[o + 2] = shaftTop;
    col[o] = graphite.r; col[o + 1] = graphite.g; col[o + 2] = graphite.b;
  }
  g.attributes.position.needsUpdate = true;
  g.attributes.color.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}

// ------------------------------------------------------------------ scene --
const lab = await mountLab(canvas, {
  maxDpr: 2,
  async setup({ renderer, scene, camera, lab }) {
    camera.fov = 30;
    camera.near = 0.05;
    camera.far = 5000;
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.addEventListener('change', () => lab.invalidate());

    /* Studio light from a real HDRI for the reflections and the fill; each
     * view keeps its own key light, because one is in millimetres and the
     * other in fortieths of one. */
    const look = await createStudio(lab, {
      // the wear view is a macro shot of two tips on paper: a shallow depth of field focused on the tips
      controls, dof: { bokeh: 1.3 },
      scale: 20, hdri: 'studio', strips: 'product', shadows: false, keyIntensity: 0,
      exposure: 1.0, envIntensity: 0.95, aoRadius: 0.35, aoThickness: 0.12,
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    const phys = (o, surf, rep, ns) => {
      const m = new THREE.MeshPhysicalMaterial(o);
      if (surf) { const t = surface(surf).clone(); t.repeat.set(rep, rep); t.needsUpdate = true; m.normalMap = t; m.normalScale = new THREE.Vector2(ns, ns); }
      return m;
    };
    const materials = {
      // The cam rings are moulded acetal, an ivory engineering plastic with a
      // faint sheen; the rotor is a coloured moulding so its turning shows.
      cam: phys({ color: 0xebe6da, metalness: 0, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.35, sheen: 0.2, sheenRoughness: 0.6 }, 'grain', 2, 0.04),
      rotor: phys({ metalness: 0, roughness: 0.34, clearcoat: 0.35, clearcoatRoughness: 0.25 }, 'grain', 2, 0.04),
      steel: phys({ color: 0xd8dadd, metalness: 1, roughness: 0.16, envMapIntensity: 1.2 }),
      chrome: phys({ color: 0xeeeeee, metalness: 1, roughness: 0.06, envMapIntensity: 1.3 }),
      spring: phys({ color: 0xb9bcc1, metalness: 1, roughness: 0.3, envMapIntensity: 1.05 }),
      brass: phys({ color: 0xd8b26a, metalness: 1, roughness: 0.24, envMapIntensity: 1.15 }),
      // graphite: near-black, with the metallic lustre a pencil lead really has
      graphite: phys({ color: 0x3a3b3e, metalness: 0.55, roughness: 0.34, envMapIntensity: 1.1 }),
      mark: phys({ color: 0xf6f3ec, metalness: 0, roughness: 0.5 }),
      // The housing, a clear polycarbonate tube. Two layers over one shape: a
      // faint tint that is blended, and the reflections alone, added on top,
      // so the tube reads as glossy plastic without hiding what is inside.
      housing: phys({ color: 0xe9eef3, metalness: 0, roughness: 0.2, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }),
      gloss: phys({ color: 0x000000, metalness: 0, roughness: 0.05, specularIntensity: 1, ior: 1.58, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      lead: phys({ vertexColors: true, metalness: 0.5, roughness: 0.36, envMapIntensity: 1.1 }),
      body: phys({ color: 0x2b2d31, metalness: 0, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.4, sheen: 0.2 }, 'grain', 12, 0.06),
      paper: null,
    };

    // ---------------------------------------------------------- engine view --
    // Laid over a little, both because a pencil is held over and because a
    // vertical object in a wide frame wastes most of the frame.
    const engine = new THREE.Group();
    engine.rotation.z = -0.4;
    scene.add(engine);
    const engineKey = new THREE.DirectionalLight(0xfff4e8, 1.5);
    engineKey.position.set(7, 11, 6);
    engineKey.castShadow = true;
    engineKey.shadow.mapSize.set(1024, 1024);
    engineKey.shadow.radius = 4;
    engineKey.shadow.bias = -0.0005;
    Object.assign(engineKey.shadow.camera, { left: -9, right: 9, top: 12, bottom: -12, near: 1, far: 40 });
    const engineFill = new THREE.DirectionalLight(0xe8efff, 0.35);
    engineFill.position.set(-8, 2, -6);
    engine.add(engineKey, engineFill);

    let camParts = null;
    function buildEngine(teeth) {
      if (camParts) {
        engine.remove(camParts.group);
        camParts.group.traverse((o) => o.geometry?.dispose());
      }
      const group = new THREE.Group();
      const { camInner: ci, camOuter: co, rotorInner: ri, rotorOuter: ro, ringBody: rb, toothH: th } = ENG;

      // Lower ring: teeth up, fixed to the housing.
      const lowTop = sawProfile(teeth, th, +1, 0);
      const lower = new THREE.Mesh(ringGeometry(ci, co, lowTop, flatProfile(lowTop, -rb)), materials.cam);

      // Rotor: its lower teeth are congruent with the lower ring, so at rest
      // they sit seated in it; its upper teeth are mirrored and half a pitch
      // round. That offset is the trick.
      const rotorBot = sawProfile(teeth, th, +1, 0);
      const rotorTop = shift(sawProfile(teeth, th, -1, 0.5), ENG.Ht);
      const rotor = new THREE.Mesh(ringGeometry(ri, ro, rotorTop, rotorBot), materials.rotor);
      // the hub that ties the rotor to the tube the chuck hangs from
      const hub = new THREE.Mesh(lathe(tubePts(ENG.tube[1], ri + 0.01, th + 0.25, ENG.Ht - 0.25), 64), materials.rotor);
      rotor.add(hub);
      // index marks on the rotor's flank, so its turning reads at a glance
      for (const k of [0, 1, 2]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, ENG.rotorBody * 0.7, 0.06), materials.mark);
        const a = (k / 3) * Math.PI * 2;
        stripe.position.set((ro - 0.01) * Math.cos(a), th + ENG.rotorBody * 0.5, -(ro - 0.01) * Math.sin(a));
        stripe.rotation.y = a + Math.PI / 2;
        rotor.add(stripe);
      }

      // Upper ring: teeth down, mirrored. Also fixed to the housing.
      const upBot = shift(sawProfile(teeth, th, -1, 0), ENG.Hu);
      const upper = new THREE.Mesh(ringGeometry(ci, co, flatProfile(upBot, ENG.top), upBot), materials.cam);
      group.add(lower, rotor, upper);

      // The parts that ride with the rotor: the tube up its middle, the spring
      // seat on the tube, the chuck and chuck ring at its front, and the lead.
      const moving = new THREE.Group();
      const tube = new THREE.Mesh(lathe(tubePts(ENG.tube[0], ENG.tube[1], -rb - 0.9, ENG.shoulder + 0.9), 48), materials.steel);
      const collar = new THREE.Mesh(lathe(tubePts(ENG.tube[1], 1.3, ENG.collar, ENG.collar + 0.22), 64), materials.steel);
      // the chuck: three jaws split by slots, closing on the lead in a cone
      const c0 = -rb - 0.9;
      const jawPts = [[ENG.leadR + 0.005, c0 - 2.3], [0.6, c0 - 2.3], [0.74, c0 - 1.95], [0.74, c0 - 1.4], [ENG.tube[1], c0 - 0.6], [ENG.tube[1], c0 + 0.05], [ENG.tube[0], c0 + 0.05], [ENG.tube[0], c0 - 1.2], [ENG.leadR + 0.005, c0 - 1.5], [ENG.leadR + 0.005, c0 - 2.3]];
      const chuck = new THREE.Group();
      for (let k = 0; k < 3; k++) chuck.add(new THREE.Mesh(lathe(jawPts, 24, (k / 3) * Math.PI * 2 + 0.07, (Math.PI * 2) / 3 - 0.14), materials.brass));
      const chuckRing = new THREE.Mesh(lathe([[0.745, c0 - 2.2], [0.96, c0 - 2.1], [0.96, c0 - 1.35], [0.745, c0 - 1.35], [0.745, c0 - 2.2]], 64), materials.chrome);
      // the lead, with a fine stripe down it so its turning shows too
      const leadTop = ENG.shoulder + 0.8, leadBot = NOSE.bottom - NOSE.pipe - NOSE.leadOut;
      const lead = new THREE.Mesh(lathe([[0, leadBot - 0.12], [ENG.leadR * 0.7, leadBot - 0.05], [ENG.leadR, leadBot + 0.06], [ENG.leadR, leadTop], [0, leadTop]], 40), materials.graphite);
      const leadStripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, leadTop - leadBot - 0.3, 0.06), materials.mark);
      leadStripe.position.set(0, (leadTop + leadBot) / 2 + 0.1, ENG.leadR - 0.012);
      moving.add(tube, collar, chuck, chuckRing, lead, leadStripe);
      group.add(moving);

      // The spring, between the collar and the fixed seat above it.
      const spring = new THREE.Mesh(springGeometry(1.08, 0.075, 8), materials.spring);
      const seat = new THREE.Mesh(lathe(tubePts(0.6, ENG.housing[0], ENG.shoulder, ENG.shoulder + 0.45), 64), materials.cam);
      group.add(spring, seat);

      // The fixed front: the housing, a nose that tapers to the guide pipe, and the pipe.
      const housing = new THREE.Mesh(lathe(tubePts(ENG.housing[0], ENG.housing[1], NOSE.top, ENG.shoulder + 0.9), 96), materials.housing);
      const nose = new THREE.Mesh(lathe([[ENG.housing[0], NOSE.top], [0.42, NOSE.bottom], [0.62, NOSE.bottom], [ENG.housing[1], NOSE.top], [ENG.housing[0], NOSE.top]], 96), materials.housing);
      const pipe = new THREE.Mesh(lathe(tubePts(ENG.leadR + 0.03, 0.42, NOSE.bottom - NOSE.pipe, NOSE.bottom + 0.4), 40), materials.steel);
      housing.add(new THREE.Mesh(housing.geometry, materials.gloss));
      nose.add(new THREE.Mesh(nose.geometry, materials.gloss));
      housing.renderOrder = nose.renderOrder = 3;
      group.add(housing, nose, pipe);

      for (const m of [lower, rotor, hub, upper, tube, collar, chuckRing, lead, spring, seat, pipe]) { m.castShadow = true; m.receiveShadow = true; }
      chuck.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      engine.add(group);
      camParts = { group, rotor, moving, spring };
      // the moulding grain is a normal map, which needs UVs (and tangents) on the hand-built rings
      group.traverse((o) => { if (o.isMesh && o.material.normalMap) ensureUVs(o.geometry, 1); });
    }
    buildEngine(params.teeth);

    // ------------------------------------------------------------ wear view --
    const S = 40;                                  // scene units per millimetre
    const PAPER_W = 1200, PAPER_D = 640;
    const wear = new THREE.Group();
    wear.visible = false;
    scene.add(wear);
    const wearKey = new THREE.DirectionalLight(0xfff4e8, 2.3);
    wearKey.position.set(360, 620, 300);
    wearKey.castShadow = true;
    wearKey.shadow.mapSize.set(2048, 2048);
    wearKey.shadow.radius = 8;
    wearKey.shadow.blurSamples = 16;
    Object.assign(wearKey.shadow.camera, { left: -620, right: 620, top: 440, bottom: -440, near: 50, far: 1600 });
    const wearFill = new THREE.DirectionalLight(0xe8efff, 0.35);
    wearFill.position.set(-200, 120, -220);
    wear.add(wearKey, wearFill);

    const paperCanvas = document.createElement('canvas');
    paperCanvas.width = 3072; paperCanvas.height = 1638;
    const px = paperCanvas.getContext('2d');
    const paperTex = new THREE.CanvasTexture(paperCanvas);
    paperTex.wrapS = THREE.RepeatWrapping;
    paperTex.colorSpace = THREE.SRGBColorSpace;
    paperTex.anisotropy = 8;
    paperTex.generateMipmaps = false;
    paperTex.minFilter = THREE.LinearFilter;
    /* Two planes rather than one. The sheet is solid and takes the page's paper
     * colour, a fibre grain and the shadows; the graphite is a layer just above
     * it carrying only the marks. Painting the paper colour into the canvas
     * would be simpler until the reader flips the site's theme, at which point
     * the line already written would have to be thrown away to repaint it. */
    materials.paper = phys({ roughness: 0.92, metalness: 0, sheen: 0.4, sheenRoughness: 0.8 }, 'grain', 40, 0.12);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W * 3, PAPER_D * 4), materials.paper);
    sheet.rotation.x = -Math.PI / 2;
    sheet.receiveShadow = true;
    materials.ink = new THREE.MeshPhysicalMaterial({ map: paperTex, transparent: true, depthWrite: false, metalness: 0.2, roughness: 0.5 });
    const ink = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_D), materials.ink);
    ink.rotation.x = -Math.PI / 2;
    ink.position.y = 0.5;
    wear.add(sheet, ink);

    const lanes = [
      { name: 'fixed', turning: false, z: -84, label: T.laneFixed },
      { name: 'turning', turning: true, z: 84, label: T.laneTurning },
    ];
    for (const lane of lanes) {
      lane.holder = new THREE.Group();
      lane.holder.position.set(0, 0, lane.z);
      wear.add(lane.holder);
      lane.shaft = new THREE.Group();
      lane.holder.add(lane.shaft);
      lane.width = 0;
    }

    /* The lead, the guide pipe it comes out of, the nose cone and the grip.
     * Without them the leads read as floating sticks. */
    const LEAD_OUT = 1.75;                         // mm of lead outside the pipe
    function buildLanes() {
      for (const lane of lanes) {
        if (lane.parts) { lane.shaft.remove(lane.parts); lane.parts.traverse((o) => o.geometry?.dispose()); }
        lane.tip = makeTip({ radius: params.diameter / 2, rings: 26, sectors: 84 });
        const parts = new THREE.Group();
        lane.mesh = new THREE.Mesh(tipGeometry(lane.tip, LEAD_OUT + 0.7), materials.lead);
        lane.mesh.castShadow = true;
        parts.add(lane.mesh);
        // the rest are lathes about y, stood along the lead's +z
        const along = new THREE.Group();
        along.rotation.x = Math.PI / 2;
        const r = params.diameter / 2;
        const z0 = LEAD_OUT;
        // a slim guide pipe, the start of the metal nose cone, and the grip: a
        // real barrel is wider, but two of them would not fit 4 mm apart
        along.add(new THREE.Mesh(lathe(tubePts(r + 0.02, r + 0.14, z0, z0 + 3.4), 40), materials.steel));
        along.add(new THREE.Mesh(lathe([[r + 0.14, z0 + 3.3], [0.56, z0 + 3.3], [0.62, z0 + 3.45], [1.5, z0 + 7.6], [1.58, z0 + 8.0], [1.58, z0 + 9.6], [r + 0.14, z0 + 9.6]], 64), materials.chrome));
        along.add(new THREE.Mesh(lathe([[1.6, z0 + 9.6], [1.72, z0 + 9.8], [1.72, z0 + 30], [0, z0 + 30]], 64), materials.body));
        along.traverse((m) => { if (m.isMesh) m.castShadow = true; });
        parts.add(along);
        parts.scale.setScalar(S);
        lane.parts = parts;
        lane.shaft.add(parts);
        updateTipGeometry(lane.mesh.geometry, graphite, highlight);
        lane.width = 0;
      }
    }

    /* The lead runs along the tip mesh's local +z, so the shaft is turned to put
     * local x along the lean, local y across the stroke, and local z up the
     * pencil at the hold angle. The pencil leans towards +x and the line it has
     * already written trails away to -x, so the body never covers its own work. */
    function placeLanes() {
      const th = params.hold * DEG;
      const basis = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(-Math.sin(th), Math.cos(th), 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(Math.cos(th), Math.sin(th), 0));
      for (const lane of lanes) lane.shaft.quaternion.setFromRotationMatrix(basis);
    }

    let distance = 0, paperInk = '#333';
    function clearPaper() {
      px.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
      distance = 0;
      paperTex.offset.x = 0;
      paperTex.needsUpdate = true;
    }

    /** Wipe a band of the sheet, given in paper units along the stroke. */
    function clearAhead(at, width) {
      const w = paperCanvas.width;
      let f = (0.5 + at / PAPER_W) % 1;
      if (f < 0) f += 1;
      const x = f * w, half = (width / PAPER_W) * w / 2;
      px.clearRect(x - half, 0, 2 * half, paperCanvas.height);
      if (x - half < 0) px.clearRect(w + x - half, 0, 2 * half, paperCanvas.height);
      if (x + half > w) px.clearRect(x + half - w - 2 * half, 0, 2 * half, paperCanvas.height);
    }

    /** Paint one stroke on the paper: the contact patch dragged along a short
     *  dash, in paper coordinates, with a little grain in the graphite. */
    const DASH = 34, DASH_STEPS = 9;
    function stamp(lane) {
      const { tip } = lane;
      const { nr, sectors, rho, cos, sin, contact, dRho, dAlpha } = tip;
      const st = Math.sin(params.hold * DEG);
      const phi = tip.azimuth, cp = Math.cos(phi), sp = Math.sin(phi);
      const sx = paperCanvas.width / PAPER_W, sy = paperCanvas.height / PAPER_D;
      const laneCy = ((lane.z + PAPER_D / 2) / PAPER_D) * paperCanvas.height;
      px.fillStyle = paperInk;
      for (let d = 0; d < DASH_STEPS; d++) {
        const off = (d / (DASH_STEPS - 1) - 0.5) * DASH;
        px.globalAlpha = 0.18 + 0.1 * Math.random();
        for (let i = 0; i < nr; i++) {
          const across = Math.max(dRho, rho[i] * dAlpha) * S * sy * 1.3;
          const alongW = (dRho / st) * S * sx * 1.3 + (DASH / DASH_STEPS) * sx;
          for (let j = 0; j < sectors; j++) {
            const k = i * sectors + j;
            if (!contact[k]) continue;
            // In the frame where the pencil leans along local +x, a contact cell
            // lands on the paper at -x/sin(hold) along the stroke and +y across.
            const u = -(rho[i] * (cos[j] * cp + sin[j] * sp) * S) / st;
            const v = rho[i] * (sin[j] * cp - cos[j] * sp) * S;
            let f = (0.5 + (distance + u + off) / PAPER_W) % 1;
            if (f < 0) f += 1;
            px.fillRect(f * paperCanvas.width - alongW / 2, laneCy + v * sy - across / 2, alongW, across);
          }
        }
      }
      px.globalAlpha = 1;
      paperTex.needsUpdate = true;
    }

    // ------------------------------------------------------------- theming --
    let graphite = new THREE.Color(0x3a3b3e), highlight = new THREE.Color(0xcc7744), colours = {};
    function applyTheme() {
      const dark = isDark();
      colours = readColors(['--ink', '--accent', '--paper', '--paper-sunk']);
      const white = new THREE.Color(0xffffff), black = new THREE.Color(0x000000);
      materials.rotor.color.copy(colours.accent).lerp(white, 0.08);
      materials.paper.color.copy(colours.paper).lerp(dark ? black : white, dark ? 0.15 : 0.25);
      materials.paper.sheenColor = new THREE.Color(0xffffff).multiplyScalar(dark ? 0.15 : 0.5);
      paperInk = '#' + (dark ? colours.ink.clone() : new THREE.Color(0x2a2b2e)).getHexString();
      highlight = new THREE.Color(0x3a3b3e).lerp(colours.accent, 0.7);
      for (const lane of lanes) if (lane.mesh) updateTipGeometry(lane.mesh.geometry, graphite, highlight);
      lab.invalidate();
    }
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    buildLanes();
    placeLanes();

    // -------------------------------------------------------------- labels --
    /* Callouts out in the margin columns, with a hairline leader and a dot on
     * the part, stacked so they never overlap. On a narrow stage they shorten. */
    const SVGNS = 'http://www.w3.org/2000/svg';
    const leaders = document.createElementNS(SVGNS, 'svg');
    leaders.setAttribute('class', 'lab-leaders');
    labelLayer.appendChild(leaders);
    let rotorY = 0;
    // anchors in the engine's own frame, on the side that faces the default camera
    const face = (r, y, deg) => new THREE.Vector3(r * Math.sin(deg * DEG), y, r * Math.cos(deg * DEG));
    const engineLabels = [
      [T.spring, T.shortSpring, () => face(1.16, ENG.collar + 1.8, 15), -1],
      [T.upper, T.shortUpper, () => face(ENG.camOuter, ENG.Hu + ENG.toothH + ENG.ringBody * 0.5, 12), -1],
      [T.lower, T.shortLower, () => face(ENG.camOuter, -ENG.ringBody * 0.45, 12), -1],
      [T.chuck, T.shortChuck, () => face(0.86, -ENG.ringBody - 2.6, 20), -1],
      [T.housing, T.shortHousing, () => face(ENG.housing[1], ENG.shoulder - 0.2, 60), 1],
      [T.rotor, T.shortRotor, () => face(ENG.rotorOuter, ENG.toothH + ENG.rotorBody * 0.5 + rotorY, 55), 1],
      [T.lead, T.shortLead, () => face(ENG.leadR, NOSE.top - 3.2, 330), -1],
    ].map(([text, short, at, side]) => {
      const e = document.createElement('span');
      e.className = 'lab-label';
      e.textContent = text;
      labelLayer.appendChild(e);
      const line = document.createElementNS(SVGNS, 'line'), dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '2.6');
      leaders.append(line, dot);
      return { text, short, at, side, e, line, dot, size: null, shown: text };
    });
    const wearLabels = lanes.map((lane) => {
      const e = document.createElement('span');
      e.className = 'lab-label is-lane';
      labelLayer.appendChild(e);
      return { lane, e, at: new THREE.Vector3(-168, 20, lane.z) };
    });

    // ----------------------------------------------------------- the views --
    const framing = {
      engine: { pos: new THREE.Vector3(8.6, 3.9, 15.0), target: new THREE.Vector3(0.8, 0.95, 0), min: 3, max: 60 },
      wear: { pos: new THREE.Vector3(-560, 400, 330), target: new THREE.Vector3(60, 30, -10), min: 120, max: 2400 },
    };
    let tween = null;
    function setView(name, instant = false) {
      engine.visible = name === 'engine';
      wear.visible = name === 'wear';
      // paper under a desk lamp wants less fill than polished parts in a studio
      look.setEnvIntensity(name === 'wear' ? 0.55 : 0.95);
      look.setDOF(name === 'wear' ? { on: true, range: 420 } : false);
      leaders.style.display = name === 'engine' ? '' : 'none';
      for (const l of engineLabels) l.e.hidden = name !== 'engine';
      for (const l of wearLabels) l.e.hidden = name !== 'wear';
      unrolled.closest('.lab-aside').hidden = name !== 'engine';
      const f = framing[name];
      controls.minDistance = f.min; controls.maxDistance = f.max;
      if (instant) { camera.position.copy(f.pos); controls.target.copy(f.target); controls.update(); }
      else tween = { from: camera.position.clone(), fromT: controls.target.clone(), to: f.pos, toT: f.target, t: 0 };
      lab.invalidate();
    }
    setView('engine', true);

    // -------------------------------------------------------------- driving --
    let phase = 0, cycleBase = 0, strokes = 0, wearStrokes = 0;

    function doStroke() {
      wearStrokes++;
      const step = params.lift ? degreesPerStroke(params.teeth) : 0;
      const volume = Math.PI * (params.diameter / 2) ** 2 * (params.wearRate / 1000);
      distance += 48;
      // Wipe a band just ahead of the pen. The texture scrolls by wrapping, so
      // without this the same strip of canvas is written over on every lap and
      // the marks pile up into mush instead of scrolling cleanly away.
      clearAhead(distance + 70, 110);
      for (const lane of lanes) {
        const res = wearStroke(lane.tip, { holdDeg: params.hold, volume, turnDeg: lane.turning ? step : 0 });
        lane.width = res.lineWidth;
        lane.mesh.rotation.z = -lane.tip.azimuth;
        // The tip surface climbs the lead as graphite goes, so slide the mesh
        // back down its own axis to keep the cut plane on the paper.
        lane.mesh.position.z = -res.planeHeight;
        updateTipGeometry(lane.mesh.geometry, graphite, highlight);
        stamp(lane);
      }
      paperTex.offset.x = distance / PAPER_W;
    }

    function reset() {
      phase = 0; cycleBase = 0; strokes = 0; wearStrokes = 0;
      buildLanes(); clearPaper(); lab.invalidate();
    }

    /** One press and lift, for a reader who would rather step than watch. */
    function step() {
      strokes++;
      if (params.lift) cycleBase += degreesPerStroke(params.teeth);
      if (params.view === 'wear') doStroke();
      lab.invalidate();
    }

    const um = (mm) => `${(mm * 1000).toFixed(0)} µm`;
    function updateReadout() {
      if (params.view === 'engine') {
        const s = engineState(params.lift ? phase : 0, params.teeth);
        readout.innerHTML =
          `<span>${T.perStroke} <b>${params.lift ? degreesPerStroke(params.teeth).toFixed(0) + '°' : '0°'}</b></span>` +
          `<span>${T.perTurn} <b>${params.lift ? params.teeth : '∞'}</b></span>` +
          `<span>${T.turned} <b>${(cycleBase + (params.lift ? s.turned : 0)).toFixed(0)}°</b></span>` +
          `<span>${T.strokes} <b>${strokes}</b></span>` +
          `<span>${T.driving} <b>${params.lift ? (s.driving === 'upper' ? T.upperRing : T.lowerRing) : T.neither}</b></span>`;
      } else {
        const f = lanes[0].width, t = lanes[1].width;
        readout.innerHTML =
          `<span>${T.fixedLead} <b>${um(f)}</b></span>` +
          `<span>${T.turningLead} <b>${um(t)}</b></span>` +
          `<span>${T.narrower} <b>${f > 0 ? ((1 - t / f) * 100).toFixed(0) : '0'}%</b></span>` +
          `<span>${T.cone} <b>${coneHalfAngle(lanes[1].tip).toFixed(0)}°</b></span>` +
          `<span>${T.strokes} <b>${wearStrokes}</b></span>`;
      }
    }

    /* The unrolled strip: the same engine state drawn flat, where the half pitch
     * offset between the two cam pairs is the whole story. */
    const strip = {
      upper: unrolled.querySelector('#u-upper'),
      lower: unrolled.querySelector('#u-lower'),
      rotor: unrolled.querySelector('#u-rotor'),
      top: unrolled.querySelector('#u-rotor-top'),
      bot: unrolled.querySelector('#u-rotor-bot'),
      caption: document.getElementById('u-caption'),
    };
    /* Geometry of the strip, in its own SVG units. The rotor sits one tooth
     * height clear of the upper ring at rest and nested in the lower one, so a
     * full press lifts it by exactly that height and slides it half a pitch,
     * which lands its upper teeth nested in turn. */
    const PITCH = 27, TH = 9, UPPER = 36, TOP_REST = 36 + TH, MID = 75, BOTTOM = 105;
    function sawPath(baseY, hand, phaseFrac, teeth = 14) {
      let d = '';
      for (let t = -2; t <= teeth; t++) {
        const x = (t + phaseFrac) * PITCH;
        d += `${t === -2 ? 'M' : 'L'}${x.toFixed(1)} ${(baseY + (hand > 0 ? 0 : -TH)).toFixed(1)}`;
        d += `L${(x + PITCH).toFixed(1)} ${(baseY + (hand > 0 ? -TH : 0)).toFixed(1)}`;
        d += `L${(x + PITCH).toFixed(1)} ${(baseY + (hand > 0 ? 0 : -TH)).toFixed(1)}`;
      }
      return d;
    }
    const close = (y) => `L440 ${y} L-80 ${y} Z`;
    strip.upper.setAttribute('d', sawPath(UPPER, -1, 0) + close(0));
    strip.lower.setAttribute('d', sawPath(BOTTOM, +1, 0) + close(150));
    strip.top.setAttribute('d', sawPath(TOP_REST, -1, 0.5) + close(MID));
    strip.bot.setAttribute('d', sawPath(BOTTOM, +1, 0) + close(MID));
    function updateStrip(s, c) {
      const slide = params.lift ? s.turned / degreesPerStroke(params.teeth) : 0;
      // the strip has no cushion gap, so it lifts by the cam's share of the travel only
      const lift = params.lift ? Math.max(0, Math.min(1, (c.y - (s.pressing ? ENG.gap : 0)) / (ENG.toothH / 2))) : 0;
      strip.rotor.setAttribute('transform', `translate(${(slide * PITCH).toFixed(2)} ${(-lift * TH).toFixed(2)})`);
      strip.caption.textContent = !params.lift ? T.noLift : s.pressing ? T.pressing : T.lifting;
    }

    // ---------------------------------------------------------------- loop --
    const ndc = new THREE.Vector3();
    function positionLabels() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      leaders.setAttribute('viewBox', `0 0 ${w} ${h}`);
      if (params.view === 'wear') {
        for (const l of wearLabels) {
          l.e.textContent = `${l.lane.label} · ${T.lineW} ${um(l.lane.width)}`;
          ndc.copy(l.at).project(camera);
          const on = ndc.z < 1 && Math.abs(ndc.x) < 1.1 && Math.abs(ndc.y) < 1.1;
          l.e.style.opacity = on ? '1' : '0';
          const ax = (ndc.x * 0.5 + 0.5) * w, ay = (-ndc.y * 0.5 + 0.5) * h;
          l.e.style.transform = `translate(-50%,-50%) translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px)`;
        }
        return;
      }
      const narrow = w < 620;
      const cols = { '-1': [], '1': [] };
      for (const l of engineLabels) {
        const want = narrow ? l.short : l.text;
        if (l.shown !== want) { l.e.textContent = want; l.shown = want; l.size = null; }
        ndc.copy(l.at());
        engine.localToWorld(ndc);
        ndc.project(camera);
        const on = ndc.z < 1 && Math.abs(ndc.x) < 1.02 && Math.abs(ndc.y) < 1.02;
        l.e.style.opacity = l.line.style.opacity = l.dot.style.opacity = on ? '1' : '0';
        if (!on) continue;
        if (!l.size) l.size = [l.e.offsetWidth, l.e.offsetHeight];
        cols[l.side].push({ l, ax: (ndc.x * 0.5 + 0.5) * w, ay: (-ndc.y * 0.5 + 0.5) * h });
      }
      // Labels line up in a margin column each side, stacked top to bottom
      // without overlap, with a leader back to the part: the mechanism itself
      // stays uncovered.
      for (const side of [-1, 1]) {
        const col = cols[side].sort((a, b) => a.ay - b.ay);
        const edge = side < 0 ? (narrow ? 8 : w * 0.06) : (narrow ? w - 8 : w * 0.94);
        for (let k = 0; k < col.length; k++) {
          const c = col[k], [bw, bh] = c.l.size;
          c.bw = bw; c.bh = bh;
          c.x = side < 0 ? Math.min(edge, c.ax - 24 - bw) : Math.max(edge - bw, c.ax + 24);
          c.x = Math.max(6, Math.min(w - 6 - bw, c.x));
          c.y = Math.max(bh / 2 + 4, c.ay);
          if (k) c.y = Math.max(c.y, col[k - 1].y + (col[k - 1].bh + bh) / 2 + 6);
        }
        for (let k = col.length - 1; k >= 0; k--) {
          const lim = k === col.length - 1 ? h - col[k].bh / 2 - 40 : col[k + 1].y - (col[k + 1].bh + col[k].bh) / 2 - 6;
          if (col[k].y > lim) col[k].y = lim;
        }
        for (const c of col) {
          c.l.e.style.transform = `translate(${c.x.toFixed(1)}px, ${(c.y - c.bh / 2).toFixed(1)}px)`;
          const ex = side < 0 ? c.x + c.bw : c.x;
          c.l.line.setAttribute('x1', c.ax.toFixed(1)); c.l.line.setAttribute('y1', c.ay.toFixed(1));
          c.l.line.setAttribute('x2', ex.toFixed(1)); c.l.line.setAttribute('y2', c.y.toFixed(1));
          c.l.dot.setAttribute('cx', c.ax.toFixed(1)); c.l.dot.setAttribute('cy', c.ay.toFixed(1));
        }
      }
    }

    return {
      update(dt) {
        controls.update();
        if (tween) {
          tween.t = Math.min(1, tween.t + dt * 1.8);
          const e = tween.t * tween.t * (3 - 2 * tween.t);
          camera.position.lerpVectors(tween.from, tween.to, e);
          controls.target.lerpVectors(tween.fromT, tween.toT, e);
          controls.update();
          if (tween.t >= 1) tween = null;
        }

        if (params.running) {
          phase += dt * params.rate;
          while (phase >= 1) {
            phase -= 1;
            strokes++;
            if (params.lift) cycleBase += degreesPerStroke(params.teeth);
            if (params.view === 'wear') doStroke();
          }
        }

        const s = engineState(params.lift ? phase : 0, params.teeth);
        const c = params.lift ? engineContact(phase, params.teeth) : { y: 0, turn: 0 };
        if (camParts && params.view === 'engine') {
          rotorY = c.y;
          // the turn is negative in the ring's angle: counter-clockwise seen from the tip
          const turned = -(cycleBase * DEG + c.turn);
          camParts.rotor.position.y = c.y;
          camParts.rotor.rotation.y = turned;
          camParts.moving.position.y = c.y;
          camParts.moving.rotation.y = turned;
          const seat = ENG.collar + 0.22 + c.y;
          camParts.spring.position.y = seat;
          camParts.spring.scale.y = ENG.shoulder - seat;
          updateStrip(s, c);
        }
        positionLabels();
        updateReadout();
      },
      render: look.render,
      resize() { positionLabels(); },
      dispose() { controls.dispose(); stopTheme(); paperTex.dispose(); look.dispose(); },
      api: { buildEngine, buildLanes, placeLanes, clearPaper, setView, reset, step },
    };
  },
});

// ------------------------------------------------------------------ wiring --
if (lab) {
  const api = lab.hooks.api;
  bindControls(panel, params, (p, name) => {
    p.teeth = +p.teeth;
    p.diameter = +p.diameter;
    if (name === 'view') api.setView(p.view);
    if (name === 'teeth') { api.buildEngine(p.teeth); api.reset(); }
    if (name === 'hold' || name === 'diameter') { api.placeLanes(); api.reset(); }
    if (name === 'wearRate') api.reset();
    lab.setOnDemand(!p.running);
    lab.invalidate();
  });
  panel.querySelector('#reset').addEventListener('click', () => api.reset());
  panel.querySelector('#step').addEventListener('click', () => api.step());
  if (lab.reducedMotion) {
    params.running = false;
    panel.querySelector('[name=running]').checked = false;
  }
}
