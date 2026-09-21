/* Inside the Kuru Toga: the engine, and what its turning is worth.
 *
 * Two views share one canvas and one renderer. The engine view is built at the
 * proportions of a real 0.5 mm mechanism, about three and a half millimetres
 * across the cam rings, so the teeth are as small next to the barrel as they
 * actually are. The wear view runs the simulation in model.js and paints what
 * each stroke leaves on the paper.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mountLab, bindControls, readColors, onThemeChange } from '/assets/lab-kit/lab-kit.js';
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
  spring: 'コイルバネ', upper: '上カムリング（固定）', rotor: 'ローター（回って滑る）',
  lower: '下カムリング（固定）', chuck: 'チャック',
  perStroke: '一画あたり', perTurn: '一周の画数', turned: '回転の累計', strokes: '画数',
  driving: '駆動', upperRing: '上リング', lowerRing: '下リング', neither: 'どちらでもない',
  fixedLead: '回らない芯', turningLead: '回る芯', narrower: '細さの差', cone: '先端の円錐',
  pressing: '押している。ローターが上がり、上の歯が固定された上リングに乗り上げる。半歯ぶん。',
  lifting: '離している。バネがローターを押し下げ、下の歯が下リングに乗り上げる。残りの半歯ぶん。',
  noLift: 'ペンが紙から離れないので、ローターは一周せず、芯は回らない。',
  laneFixed: '回転なし', laneTurning: '回転あり',
  shortSpring: 'バネ', shortUpper: '上カム', shortRotor: 'ローター', shortLower: '下カム', shortChuck: 'チャック',
} : {
  spring: 'return spring', upper: 'upper cam ring, fixed', rotor: 'rotor: turns and slides',
  lower: 'lower cam ring, fixed', chuck: 'chuck',
  perStroke: 'per stroke', perTurn: 'strokes per turn', turned: 'turned so far', strokes: 'strokes',
  driving: 'driving', upperRing: 'upper ring', lowerRing: 'lower ring', neither: 'neither ring',
  fixedLead: 'fixed lead', turningLead: 'turning lead', narrower: 'narrower by', cone: 'tip cone',
  pressing: 'Pressing. The rotor rises and its upper teeth ride the fixed upper ring: half a tooth.',
  lifting: 'Lifting. The spring drives the rotor down and its lower teeth ride the lower ring: the other half.',
  noLift: 'The pen never leaves the paper, so the rotor never cycles and the lead never turns.',
  laneFixed: 'no rotation', laneTurning: 'turning',
  shortSpring: 'spring', shortUpper: 'upper cam', shortRotor: 'rotor', shortLower: 'lower cam', shortChuck: 'chuck',
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

/* The engine, in millimetres. The cam ring diameters follow a 0.5 mm barrel.
 * Tooth height and cushion travel are not published anywhere I could find, so
 * these are the smallest values that still let the cam ride cleanly, and the
 * page says as much rather than pretending to a measurement. */
const ENG = {
  bore: 2.0, camInner: 1.05, camOuter: 1.75,
  ringBody: 0.75, toothH: 0.18, gap: 0.10,
  leadR: 0.25, rotorBody: 1.5,
};
ENG.travel = ENG.gap + ENG.toothH / 2;

// --------------------------------------------------------------- geometry --

/** One face of a sawtooth cam ring, as {a, y} around the circle. */
function sawProfile(teeth, height, hand, phase, seg = 5) {
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

/**
 * A ring whose top and bottom surfaces are given as profiles around the circle.
 * A flat profile on one face gives a fixed ring; sawteeth on both gives the
 * rotor. Repeated angles inside a profile become the vertical face of a tooth,
 * which is what makes the teeth read as cut rather than moulded.
 */
function ringGeometry(inner, outer, topProfile, botProfile) {
  const n = topProfile.length;
  const pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const { a, y: ty } = topProfile[i];
    const by = botProfile[i].y;
    const c = Math.cos(a), s = Math.sin(a);
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
  // fluted look, which is not what a machined cam looks like.
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  g.dispose();
  return flat;
}

/** A compression spring as a swept tube, built at unit height and scaled. */
function springGeometry(radius, wire, coils, seg = 200) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, a = t * coils * Math.PI * 2;
    pts.push(new THREE.Vector3(radius * Math.cos(a), t, radius * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, wire, 8, false);
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the page's own colours honest
    renderer.toneMappingExposure = 1.0;

    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
      scene.environmentIntensity = 0.5;
    } catch (err) { console.warn('lab: no environment map,', err.message); }

    camera.fov = 32;
    camera.near = 0.05;
    camera.far = 5000;
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.addEventListener('change', () => lab.invalidate());
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const materials = {
      // The cam rings and the rotor are moulded resin in the real mechanism, so
      // they are matte here. The chuck, spring and guide pipe are the metal.
      cam: new THREE.MeshStandardNodeMaterial({ metalness: 0.0, roughness: 0.48 }),
      rotor: new THREE.MeshStandardNodeMaterial({ metalness: 0.0, roughness: 0.42 }),
      steel: new THREE.MeshStandardNodeMaterial({ metalness: 0.92, roughness: 0.26 }),
      graphite: new THREE.MeshStandardNodeMaterial({ metalness: 0.1, roughness: 0.65 }),
      barrel: new THREE.MeshStandardNodeMaterial({ metalness: 0.05, roughness: 0.34, side: THREE.DoubleSide }),
      mark: new THREE.MeshStandardNodeMaterial({ metalness: 0.05, roughness: 0.5 }),
      lead: new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.1 }),
      nose: new THREE.MeshStandardNodeMaterial({ roughness: 0.42, metalness: 0.05, side: THREE.DoubleSide }),
      paper: null,
    };

    // ---------------------------------------------------------- engine view --
    // Laid over a little, both because a pencil is held over and because a
    // vertical object in a wide frame wastes most of the frame.
    const engine = new THREE.Group();
    engine.rotation.z = -0.4;
    scene.add(engine);
    const engineKey = new THREE.DirectionalLight(0xffffff, 2.4);
    engineKey.position.set(7, 11, 6);
    engineKey.castShadow = true;
    engineKey.shadow.mapSize.set(1024, 1024);
    engineKey.shadow.radius = 3;
    Object.assign(engineKey.shadow.camera, { left: -9, right: 9, top: 12, bottom: -12, near: 1, far: 40 });
    const engineFill = new THREE.DirectionalLight(0xffffff, 0.7);
    engineFill.position.set(-8, 2, -6);
    engine.add(engineKey, engineFill);

    let camParts = null;
    function buildEngine(teeth) {
      if (camParts) {
        engine.remove(camParts.group);
        camParts.group.traverse((o) => o.geometry?.dispose());
      }
      const group = new THREE.Group();
      const { camInner: ci, camOuter: co, ringBody: rb, toothH: th, rotorBody: rbody } = ENG;

      // Lower ring: teeth up, one handedness, phase zero. Fixed to the barrel.
      const lowTop = sawProfile(teeth, th, +1, 0);
      const lower = new THREE.Mesh(ringGeometry(ci, co, lowTop, flatProfile(lowTop, -rb)), materials.cam);

      // Rotor: its lower teeth are congruent with the lower ring, its upper
      // teeth are mirrored and sit half a pitch away. That offset is the trick.
      const rotorBot = sawProfile(teeth, th, +1, 0);
      const rotorTop = sawProfile(teeth, th, -1, 0.5);
      const rotor = new THREE.Mesh(
        ringGeometry(ci, co, rotorTop.map(({ a, y }) => ({ a, y: y + rbody })), rotorBot), materials.rotor);

      // Upper ring: teeth down, mirrored, phase zero. Also fixed to the barrel.
      const upBot = sawProfile(teeth, th, -1, 0);
      const upper = new THREE.Mesh(ringGeometry(ci, co, flatProfile(upBot, th + rb), upBot), materials.cam);

      // An index mark on the rotor's flank, so its turning reads at a glance.
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, rbody * 0.62, 0.07), materials.mark);
      stripe.position.set(0, rbody * 0.5, co - 0.01);
      rotor.add(stripe);

      rotor.position.y = th;
      upper.position.y = th + rbody + ENG.gap + th;
      group.add(lower, rotor, upper);

      const spring = new THREE.Mesh(springGeometry(1.2, 0.085, 5), materials.steel);
      spring.position.y = upper.position.y + th + rb;
      spring.scale.y = 1.7;
      group.add(spring);

      const moving = new THREE.Group();
      const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.44, 2.6, 28, 1, true), materials.steel);
      chuck.position.y = -rb - 1.3;
      const lead = new THREE.Mesh(new THREE.CylinderGeometry(ENG.leadR, ENG.leadR, 7.6, 20), materials.graphite);
      lead.position.y = -rb - 3.9;
      const leadStripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 7.6, 0.1), materials.mark);
      leadStripe.position.set(0, 0, ENG.leadR * 0.95);
      lead.add(leadStripe);
      moving.add(chuck, lead);
      group.add(moving);

      /* The barrel and the nose are cut away over the same arc so the body reads
       * as one sectioned model. Cylinder theta runs from +Z towards +X, and the
       * opening is centred on the default camera azimuth: point the section at
       * the reader, or the mechanism is behind a wall. */
      const CUT_FROM = Math.PI * 0.52, CUT_LEN = Math.PI * 1.35;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.6, 24, 1, true), materials.steel);
      pipe.position.y = -7.0;
      const nose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 1.8, 2.6, 44, 1, true), materials.barrel);
      nose.position.y = -4.3;
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(ENG.bore, ENG.bore, 8.6, 48, 1, true, CUT_FROM, CUT_LEN), materials.barrel);
      barrel.position.y = 1.5;
      group.add(pipe, nose, barrel);

      for (const m of [lower, rotor, upper, spring, chuck, lead, pipe]) { m.castShadow = true; m.receiveShadow = true; }
      for (const m of [nose, barrel]) m.receiveShadow = true;
      engine.add(group);
      camParts = { group, rotor, moving, spring };
    }
    buildEngine(params.teeth);

    /* Labels sit out in the margin with a leader back to the part, rather than
     * on top of it. Side is -1 to hang the label off to the left, +1 to the
     * right. */
    const makeLabels = (rows, cls = '') => rows.map(([text, x, y, z, side = -1, short = text]) => {
      const el = document.createElement('span');
      el.className = 'lab-label ' + cls;
      el.dataset.side = side < 0 ? 'left' : 'right';
      el.textContent = text;
      el.hidden = true;
      labelLayer.appendChild(el);
      return { at: new THREE.Vector3(x, y, z), side, el, text, short, lane: cls.includes('is-lane') };
    });
    const engineLabels = makeLabels([
      [T.spring, 0, ENG.toothH + ENG.rotorBody + 3.4, 1.2, -1, T.shortSpring],
      [T.upper, 0, ENG.toothH + ENG.rotorBody + ENG.gap + ENG.toothH + 0.4, 1.4, -1, T.shortUpper],
      [T.rotor, 0, ENG.toothH + ENG.rotorBody * 0.5, -1.7, +1, T.shortRotor],
      [T.lower, 0, -0.4, 1.4, -1, T.shortLower],
      [T.chuck, 0, -2.3, 1.0, -1, T.shortChuck],
    ]);

    // ------------------------------------------------------------ wear view --
    const S = 40;                                  // scene units per millimetre
    const PAPER_W = 1200, PAPER_D = 640;
    const wear = new THREE.Group();
    wear.visible = false;
    scene.add(wear);
    const wearKey = new THREE.DirectionalLight(0xffffff, 2.6);
    wearKey.position.set(360, 620, 300);
    wearKey.castShadow = true;
    wearKey.shadow.mapSize.set(1024, 1024);
    wearKey.shadow.radius = 5;
    Object.assign(wearKey.shadow.camera, { left: -620, right: 620, top: 440, bottom: -440, near: 50, far: 1600 });
    const wearFill = new THREE.DirectionalLight(0xffffff, 0.6);
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
     * colour and the shadows; the ink is a transparent layer just above it
     * carrying only the marks. Painting the paper colour into the canvas would
     * be simpler until the reader flips the site's theme, at which point the
     * line already written would have to be thrown away to repaint it. */
    materials.paper = new THREE.MeshStandardNodeMaterial({ roughness: 0.97, metalness: 0 });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W, PAPER_D), materials.paper);
    sheet.rotation.x = -Math.PI / 2;
    sheet.receiveShadow = true;
    materials.ink = new THREE.MeshBasicNodeMaterial({ map: paperTex, transparent: true, depthWrite: false });
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
    const wearLabels = makeLabels(lanes.map((l) => [l.label, -168, 20, l.z]), 'is-lane');

    /* The lead, the guide pipe it comes out of, and the cone of the pencil
     * nose. Without the last two the leads read as floating sticks. */
    const LEAD_OUT = 1.75;                         // mm of lead outside the pipe
    function buildLanes() {
      for (const lane of lanes) {
        if (lane.parts) { lane.shaft.remove(lane.parts); lane.parts.traverse((o) => o.geometry?.dispose()); }
        lane.tip = makeTip({ radius: params.diameter / 2, rings: 26, sectors: 84 });
        const parts = new THREE.Group();
        lane.mesh = new THREE.Mesh(tipGeometry(lane.tip, LEAD_OUT + 0.7), materials.lead);
        lane.mesh.castShadow = true;
        parts.add(lane.mesh);

        const sleeve = new THREE.Mesh(
          new THREE.CylinderGeometry(params.diameter / 2 + 0.11, params.diameter / 2 + 0.11, 1.2, 28, 1, true), materials.steel);
        sleeve.rotation.x = Math.PI / 2;
        sleeve.position.z = LEAD_OUT + 0.6;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.8, 40, 1, true), materials.nose);
        cone.rotation.x = -Math.PI / 2;   // apex toward the writing tip
        cone.position.z = LEAD_OUT + 1.2 + 0.9;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 16, 40, 1, false), materials.nose);
        body.rotation.x = Math.PI / 2;
        body.position.z = LEAD_OUT + 1.2 + 1.8 + 8;
        for (const m of [sleeve, cone, body]) { m.castShadow = true; parts.add(m); }

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

    /** Paint one stroke's contact patch on the paper, in paper coordinates. */
    function stamp(lane) {
      const { tip } = lane;
      const { nr, sectors, rho, cos, sin, contact, dRho, dAlpha } = tip;
      const st = Math.sin(params.hold * DEG);
      const phi = tip.azimuth, cp = Math.cos(phi), sp = Math.sin(phi);
      const sx = paperCanvas.width / PAPER_W, sy = paperCanvas.height / PAPER_D;
      const laneCy = ((lane.z + PAPER_D / 2) / PAPER_D) * paperCanvas.height;
      px.fillStyle = paperInk;
      px.globalAlpha = 0.72;
      for (let i = 0; i < nr; i++) {
        const across = Math.max(dRho, rho[i] * dAlpha) * S * sy * 1.3;
        const along = (dRho / st) * S * sx * 1.3;
        for (let j = 0; j < sectors; j++) {
          const k = i * sectors + j;
          if (!contact[k]) continue;
          // In the frame where the pencil leans along local +x, a contact cell
          // lands on the paper at -x/sin(hold) along the stroke and +y across.
          const u = -(rho[i] * (cos[j] * cp + sin[j] * sp) * S) / st;
          const v = rho[i] * (sin[j] * cp - cos[j] * sp) * S;
          let f = (0.5 + (distance + u) / PAPER_W) % 1;
          if (f < 0) f += 1;
          px.fillRect(f * paperCanvas.width - along / 2, laneCy + v * sy - across / 2, along, across);
        }
      }
      px.globalAlpha = 1;
      paperTex.needsUpdate = true;
    }

    // ------------------------------------------------------------- theming --
    let graphite = new THREE.Color(0x222222), highlight = new THREE.Color(0xcc7744), colours = {};
    function applyTheme() {
      colours = readColors(['--ink', '--accent', '--paper', '--paper-sunk']);
      const white = new THREE.Color(0xffffff), black = new THREE.Color(0x000000);
      materials.steel.color.copy(colours.ink).lerp(white, 0.66);
      materials.cam.color.copy(colours.paper).lerp(white, 0.5);
      materials.rotor.color.copy(colours.accent).lerp(white, 0.12);
      materials.graphite.color.copy(colours.ink).lerp(black, 0.4);
      materials.mark.color.copy(colours.paper);
      materials.barrel.color.copy(colours.ink).lerp(colours.paper, 0.34);
      materials.nose.color.copy(colours.ink).lerp(white, 0.58);
      materials.paper.color.copy(colours.paper).lerp(white, 0.35);
      paperInk = '#' + colours.ink.clone().lerp(black, 0.15).getHexString();
      graphite = colours.ink.clone().lerp(black, 0.35);
      highlight = colours.ink.clone().lerp(new THREE.Color(0x000000), 0.35).lerp(colours.accent, 0.62);
      for (const lane of lanes) if (lane.mesh) updateTipGeometry(lane.mesh.geometry, graphite, highlight);
      lab.invalidate();
    }
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    buildLanes();
    placeLanes();

    // ----------------------------------------------------------- the views --
    const framing = {
      engine: { pos: new THREE.Vector3(9.6, 4.4, 15.2), target: new THREE.Vector3(0.2, 1.1, 0), min: 4, max: 60 },
      wear: { pos: new THREE.Vector3(215, 555, 308), target: new THREE.Vector3(-150, 6, 0), min: 120, max: 2400 },
    };
    let tween = null;
    function setView(name, instant = false) {
      engine.visible = name === 'engine';
      wear.visible = name === 'wear';
      for (const l of engineLabels) l.el.hidden = name !== 'engine';
      for (const l of wearLabels) l.el.hidden = name !== 'wear';
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
    function updateStrip(s) {
      const slide = params.lift ? s.turned / degreesPerStroke(params.teeth) : 0;
      const lift = params.lift ? s.axial : 0;
      strip.rotor.setAttribute('transform', `translate(${(slide * PITCH).toFixed(2)} ${(-lift * TH).toFixed(2)})`);
      strip.caption.textContent = !params.lift ? T.noLift : s.pressing ? T.pressing : T.lifting;
    }

    // ---------------------------------------------------------------- loop --
    const ndc = new THREE.Vector3();
    function positionLabels() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const inEngine = params.view === 'engine';
      for (const l of (inEngine ? engineLabels : wearLabels)) {
        ndc.copy(l.at);
        if (inEngine) engine.localToWorld(ndc);       // the group is laid over
        ndc.project(camera);
        const on = ndc.z < 1 && Math.abs(ndc.x) < 1.12 && Math.abs(ndc.y) < 1.12;
        l.el.style.opacity = on ? '1' : '0';
        const ax = (ndc.x * 0.5 + 0.5) * w, ay = (-ndc.y * 0.5 + 0.5) * h;
        // On a narrow canvas there is no margin to run a label out into, so the
        // labels shorten and sit on the part as chips instead.
        const narrow = w < 620;
        if (l.lane || narrow) {
          if (!l.lane) {
            l.el.textContent = narrow ? l.short : l.text;
            l.el.classList.toggle('is-chip', narrow);
          }
          l.el.style.transform = `translate(-50%,-50%) translate(${ax.toFixed(1)}px, ${(ay + (l.lane ? 0 : -16)).toFixed(1)}px)`;
          continue;
        }
        if (l.el.textContent !== l.text) { l.el.textContent = l.text; l.el.classList.remove('is-chip'); }
        // Everything else lines up in a margin column with a leader back to it,
        // which is what keeps the mechanism itself uncovered.
        const colX = l.side < 0 ? w * 0.17 : w * 0.72;
        l.el.style.setProperty('--leader', `${Math.max(10, Math.abs(ax - colX) - 6).toFixed(1)}px`);
        l.el.style.transform = `translate(${l.side < 0 ? '-100%' : '0'},-50%) translate(${colX.toFixed(1)}px, ${ay.toFixed(1)}px)`;
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
        if (camParts && params.view === 'engine') {
          const rise = params.lift ? s.axial * ENG.travel : 0;
          const turned = -(cycleBase + (params.lift ? s.turned : 0)) * DEG;
          camParts.rotor.position.y = ENG.toothH + rise;
          camParts.rotor.rotation.y = turned;
          camParts.moving.position.y = rise;
          camParts.moving.rotation.y = turned;
          camParts.spring.scale.y = 2.6 - rise;
          updateStrip(s);
        }
        positionLabels();
        updateReadout();
      },
      resize() { positionLabels(); },
      dispose() { controls.dispose(); stopTheme(); paperTex.dispose(); },
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
