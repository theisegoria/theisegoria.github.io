/* The bladeless fan: scene, particles and charts.
 *
 * One canvas. The loop is a lathe of the cross-section in model.js, so the slot
 * the reader widens is the slot the particles leave through. Particle speeds
 * come from the same jet laws that produce the numbers, compressed by a square
 * root so a 19 m/s sheet and a 2 m/s drift can share one screen.
 */
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mountLab, bindControls, readColors, onThemeChange } from '/assets/lab-kit/lab-kit.js';
import * as M from './model.js';

const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');
const labelLayer = document.getElementById('labels');
const chartX = document.getElementById('chart-x');
const chartB = document.getElementById('chart-b');

const JA = document.documentElement.lang.startsWith('ja');
const T = JA ? {
  intake: '吸気口', impeller: '斜流インペラ', slot: 'スリット', coanda: 'コアンダ面', plenum: '内部の空気室',
  induced: '輪の中を通って引き込まれる空気', entrained: '周囲から巻き込まれる空気',
  slotSpeed: 'スリット流速', re: 'スリットのレイノルズ数', dp: 'スリット差圧', q0: 'モーターが送る空気',
  qx: '距離xでの風量', mult: '増幅率', through: '輪を抜ける風速', xs: '円形噴流への移行', power: '噴流の空気動力',
  ls: 'L/s', dist: '距離 x (m)', flow: '風量 (L/s)', slotW: 'スリット幅 (mm)', ratioAx: '増幅率',
  primary: 'モーター', indShort: '輪の中から', entShort: '周囲から', patent: '特許の値',
  delivered: 'x での風量', ratioLine: '増幅率', best: '整合点', now: '現在',
  annular: '環状の膜', round: '円形噴流',
  bell: 'ベルマウス', motor: 'モーター', vanes: '整流翼', neck: 'ネック', diffuser: 'ディフューザー',
  tour: [
    '空気の通り道の全体。琥珀色はモーターが触れる唯一の空気で、青と緑はそれが引きずる空気である。停留点を順にたどるか、ドラッグして自由に眺められる。',
    '空気は台座の下部を囲む数百の小さな穴から入り、インペラの下の部屋に集まる。穴が小さいのは静かにするためとモーターを見せないためで、それでも開口の合計はスリットの何倍もある。',
    'ベルマウスがインペラに下から空気を送る。これは斜流インペラで、上に行くほど広がるハブに九枚の羽根が付き、空気を上向きと外向きに同時に押し出す。軸流ファンと遠心送風機の中間であり、この扇風機で動く部品はこれだけである。',
    'インペラを出た空気は回転している。その上に並ぶ固定された翼が渦を取り除き、回転の運動を圧力として回収する。台座はそこで絞られてネックとなり、空気を輪の中へ送り上げる。',
    '輪の内部で空気は一周する通路、空気室を満たし、二百パスカルほどの圧力になる。出口が一つしかない貯め池である。',
    '出口は輪の内側の面にある幅1.3 mmのスリットである。膜は秒速約19 mで出て、丸みのあるコアンダ面に沿って曲がり、開いたディフューザーを通って後縁へ向かう。',
    '後縁を離れた膜は両面で空気を引き込む。後ろから輪の中を通る空気（青）と、縁の周りから来る空気（緑）である。1 m先では、モーターが送った1リットルにつき16リットルが動いている。',
  ],
} : {
  intake: 'intake', impeller: 'mixed-flow impeller', slot: 'slot', coanda: 'Coanda surface', plenum: 'plenum',
  induced: 'induced through the loop', entrained: 'entrained from around it',
  slotSpeed: 'slot speed', re: 'slot Reynolds number', dp: 'slot pressure', q0: 'motor air',
  qx: 'air moving at x', mult: 'multiplication', through: 'speed through the loop', xs: 'becomes a round jet at', power: 'jet power',
  ls: 'l/s', dist: 'distance x (m)', flow: 'flow (l/s)', slotW: 'slot width (mm)', ratioAx: 'ratio',
  primary: 'motor', indShort: 'through the loop', entShort: 'from around it', patent: 'patent',
  delivered: 'air at x', ratioLine: 'ratio', best: 'matched', now: 'now',
  annular: 'annular sheet', round: 'round jet',
  bell: 'bell mouth', motor: 'motor', vanes: 'stator vanes', neck: 'neck', diffuser: 'diffuser',
  tour: [
    'The whole path. Amber is the only air the motor touches; blue and green are what it drags along. Step through the stops, or drag to look around.',
    'Air comes in through a few hundred small holes round the bottom of the base, into a chamber under the impeller. The holes are small to keep the base quiet and the motor out of sight; their total open area is still many times the slot\'s.',
    'A bell mouth feeds the impeller from below. This is a mixed-flow impeller: nine blades on a hub that widens as it rises, so air leaves upward and outward at once, part axial fan and part centrifugal blower. It is the only moving part in the fan.',
    'The impeller leaves the air spinning. A ring of fixed vanes above it takes the swirl off and turns that motion back into pressure; the base then narrows into a neck that carries the air up into the loop.',
    'Inside the loop the air fills a channel that runs the whole way round, the plenum, at a couple of hundred pascals. It is a reservoir with one exit.',
    'The exit is the slot, 1.3 mm wide on the loop\'s inner face. The sheet leaves at about 19 m/s, wraps the rounded Coanda surface, and runs along the flared diffuser to the trailing edge.',
    'Off the trailing edge the sheet drags in air on both faces: through the loop from behind (blue) and from around the rim (green). By a metre out there are sixteen litres moving for every one the motor sent.',
  ],
};

/* Tour stops. Camera and target are in metres in the scene; the loop's own
 * points are functions because they move with the loop diameter. */
const LOOP_FACE = 100 * Math.PI / 180;    // the cut face that faces the camera
const TOUR = [
  { cam: [-1.42, 0.84, -0.5], tgt: [0, 0.37, 0.52], focus: null, jet: true },
  { cam: [0.2, 0.17, -0.47], tgt: [0, 0.06, -0.009], focus: ['shell', 'grille'], phases: [1], streak: 1.7 },
  { cam: [-0.25, 0.14, -0.105], tgt: [-0.005, 0.095, -0.009], focus: ['bell', 'impeller', 'casing', 'motor'], phases: [1] },
  { cam: [-0.28, 0.27, -0.12], tgt: [0, 0.195, -0.009], focus: ['vanes', 'motor', 'neck', 'casing'], phases: [1] },
  { cam: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0).add(new THREE.Vector3(-0.2, 0.11, -0.17)), tgt: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0), focus: ['loop'], phases: [1, 2, 3], xray: true, streak: 1.4 },
  { cam: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + G.P.C[1], Z_NOSE + G.P.C[0], G.y0).add(new THREE.Vector3(-0.075, -0.055, -0.055)), tgt: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + G.P.C[1] - 0.006, Z_NOSE + G.P.C[0] + 0.012, G.y0), focus: ['loop'], phases: [3, 4], near: 0.35, streak: 0.3, streakBase: 0.9, sheet: true },
  { cam: [-1.7, 0.95, 1.7], tgt: [0, 0.45, 1.0], focus: null, jet: true, labels: ['jet'] },
].map((st, i) => ({ ...st, text: T.tour[i] }));

const kindsOn = [1, 1, 1];      // which particle kinds the current tour stop draws
const params = { ...M.DEFAULTS, speed: 1, cutaway: true, labels: true, flow: true, tour: '0' };
let sol = M.solve(params);

/* ----------------------------------------------------------- geometry ---- */
const Z_NOSE = -0.03;                 // axial position of the loop's nose
const BASE = { r: 0.064, h: 0.27, z: -0.009 };   // z: the neck sits under the plenum
const CUT = { a0: 100, a1: 172 };     // cutaway wedge, degrees round the loop (0 = +x, 90 = up)
const d2r = Math.PI / 180;

function loopCentreY(D) { return BASE.h + D / 2 + 0.031 - 0.012; }

/** Loop position (world) for ring angle psi, radius r from the axis, axial z. */
function ringPoint(out, psi, r, z, y0) { return out.set(r * Math.cos(psi), y0 + r * Math.sin(psi), z); }

function buildLoop(slotMm, D, cut, mats) {
  const P = M.profile(slotMm);
  const R = D / 2;
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;   // lathe axis (y) -> flow axis (z)
  g.add(inner);
  const pts = P.pts.map(([u, v]) => new THREE.Vector2(R + v, u + Z_NOSE));
  pts.push(pts[0].clone());
  // lathe angle phi relates to ring angle psi by phi = psi + 90 deg
  const phiA = (CUT.a1 + 90) * d2r, span = cut ? (360 - (CUT.a1 - CUT.a0)) * d2r : Math.PI * 2;
  const lathe = new THREE.LatheGeometry(pts, 220, cut ? phiA : 0, span);
  inner.add(new THREE.Mesh(lathe, mats.shell));
  if (cut) {
    const shape = new THREE.Shape(pts.slice(0, -1));
    for (const psiDeg of [CUT.a0, CUT.a1]) {
      const geo = new THREE.ShapeGeometry(shape);
      const phi = (psiDeg + 90) * d2r;
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const r = p.getX(i), y = p.getY(i);
        p.setXYZ(i, r * Math.sin(phi), y, r * Math.cos(phi));
      }
      geo.computeVertexNormals();
      inner.add(new THREE.Mesh(geo, mats.cap));
    }
  }
  // the sheet itself: the primary air's path from the slot to the trailing
  // edge, swept round the loop as a thin translucent band (shown on the slot stop)
  const sheetPts = P.path.slice(2).map(([u, v]) => new THREE.Vector2(R + v, u + Z_NOSE));
  const sheet = new THREE.Mesh(new THREE.LatheGeometry(sheetPts, 220, cut ? phiA : 0, span), mats.sheet);
  sheet.userData.part = 'sheet';
  inner.add(sheet);
  g.position.y = loopCentreY(D);
  return { group: g, profile: P };
}

/* The base, following the layout in the patent's figures: air enters through
 * a perforated skirt into a chamber at the bottom, a bell mouth feeds the
 * impeller from below, the impeller throws it up and out into a ring of fixed
 * vanes that take the swirl off, and the base then narrows into a neck that
 * opens into the loop. The motor sits above the impeller in a bucket that the
 * air flows round. Dimensions are my own, to the proportions of a 350 mm loop
 * on a base a little over a quarter of a metre tall. */
const BS = {
  gap: [205, 295],            // cut-away wedge, degrees (0 = +z, 90 = +x)
  grilleY: [0.03, 0.105], chamberTop: 0.06,
  throat: 0.036, bellR: 0.054,
  impY: [0.06, 0.125], hubR: [0.011, 0.033], caseR: [0.036, 0.056],
  motorR: 0.03, motorY: [0.125, 0.2],
  vaneY: [0.132, 0.182], vaneR: [0.031, 0.056], vanes: 11,
  neckY: [0.2, 0.266], neckR: [0.058, 0.021],
};

/** A surface of revolution about y from a list of [r, y] points. */
function lathe(pts, seg = 96, start = 0, len = Math.PI * 2) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, start, len);
}

function buildBase(cut, mats) {
  const g = new THREE.Group();
  g.position.z = BASE.z;
  const tag = (mesh, part) => { mesh.userData.part = part; g.add(mesh); return mesh; };
  const t0 = cut ? BS.gap[1] * d2r : 0, tl = cut ? (360 - (BS.gap[1] - BS.gap[0])) * d2r : Math.PI * 2;
  const rAt = (y) => BASE.r * (1.06 - 0.06 * (y / BASE.h));

  // skirt, its lining, the top plate with the neck opening, the foot
  tag(new THREE.Mesh(lathe([[rAt(0), 0], [rAt(BASE.h), BASE.h]], 128, t0, tl), mats.shell), 'shell');
  tag(new THREE.Mesh(lathe([[rAt(0) - 0.003, 0.002], [rAt(BASE.h) - 0.003, BASE.h - 0.002]], 96, t0, tl), mats.dark), 'shell');
  tag(new THREE.Mesh(lathe([[BS.neckR[1] + 0.002, BASE.h], [rAt(BASE.h), BASE.h]], 96, t0, tl), mats.shell), 'shell');
  tag(new THREE.Mesh(lathe([[0, 0.001], [rAt(0), 0.001]], 96), mats.dark), 'shell');
  if (cut) for (const th of [t0, t0 + tl]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.004, BASE.h), mats.cap);
    f.position.set((BASE.r - 0.0015) * Math.sin(th), BASE.h / 2, (BASE.r - 0.0015) * Math.cos(th));
    f.rotation.y = th + Math.PI / 2;
    tag(f, 'shell');
  }

  // the grille: rows of holes round the skirt, only where the skirt exists
  const rows = 7, cols = 44;
  const hole = new THREE.CylinderGeometry(0.0026, 0.0026, 0.0014, 12);
  hole.rotateZ(Math.PI / 2);
  const holes = new THREE.InstancedMesh(hole, mats.hole, rows * cols);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const th = ((j + (i % 2) * 0.5) / cols) * Math.PI * 2;
    const deg = ((th / d2r) % 360 + 360) % 360;
    if (cut && deg > BS.gap[0] - 2 && deg < BS.gap[1] + 2) continue;
    const y = BS.grilleY[0] + (i / (rows - 1)) * (BS.grilleY[1] - BS.grilleY[0]);
    p.set((rAt(y) + 0.0002) * Math.sin(th), y, (rAt(y) + 0.0002) * Math.cos(th));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), th - Math.PI / 2);
    holes.setMatrixAt(n++, m.compose(p, q, one));
  }
  holes.count = n;
  tag(holes, 'grille');

  // chamber floor under the impeller and the bell mouth that feeds it
  const bellPts = [];
  for (let k = 0; k <= 10; k++) {
    const a = (Math.PI / 2) * (k / 10);
    bellPts.push([BS.throat + (BS.bellR - BS.throat) * (1 - Math.cos(a)), BS.chamberTop - 0.016 * Math.sin(a)]);
  }
  tag(new THREE.Mesh(lathe(bellPts, 96, t0, tl), mats.metal), 'bell');
  // impeller casing: the fixed cone the blades run inside
  tag(new THREE.Mesh(lathe([[BS.caseR[0], BS.impY[0]], [BS.caseR[1], BS.impY[1]], [BS.caseR[1], BS.impY[1] + 0.004]], 96, t0, tl), mats.casing), 'casing');

  // the impeller: hub plus nine blades, the only moving part
  const imp = new THREE.Group();
  imp.userData.part = 'impeller';
  const hubPts = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    hubPts.push([BS.hubR[0] + (BS.hubR[1] - BS.hubR[0]) * Math.pow(t, 0.8), BS.impY[0] + (BS.impY[1] - BS.impY[0]) * t]);
  }
  hubPts.push([BS.hubR[1], BS.impY[1] + 0.004], [0, BS.impY[1] + 0.004]);
  hubPts.unshift([0, BS.impY[0]]);
  const hub = new THREE.Mesh(lathe(hubPts, 64), mats.metal); hub.userData.part = 'impeller'; imp.add(hub);
  const blade = impellerBlade();
  for (let k = 0; k < 9; k++) {
    const b = new THREE.Mesh(blade, mats.blade);
    b.rotation.y = (k / 9) * Math.PI * 2;
    b.userData.part = 'impeller';
    imp.add(b);
  }
  g.add(imp);

  // the motor bucket above the impeller, with a band of windings
  tag(new THREE.Mesh(lathe([[0, BS.motorY[0]], [BS.motorR, BS.motorY[0]], [BS.motorR, BS.motorY[1]], [BS.motorR - 0.006, BS.motorY[1] + 0.006], [0, BS.motorY[1] + 0.006]], 64), mats.dark), 'motor');
  tag(new THREE.Mesh(lathe([[BS.motorR + 0.0008, BS.motorY[0] + 0.012], [BS.motorR + 0.0008, BS.motorY[0] + 0.04]], 64), mats.copper), 'motor');
  const shaft = new THREE.Mesh(lathe([[0, BS.impY[1]], [0.004, BS.impY[1]], [0.004, BS.motorY[0]], [0, BS.motorY[0]]], 24), mats.metal);
  tag(shaft, 'motor');

  // stator vanes: fixed, leaning against the impeller's swirl
  const vaneGeo = new THREE.BoxGeometry(BS.vaneR[1] - BS.vaneR[0], BS.vaneY[1] - BS.vaneY[0], 0.0012);
  for (let k = 0; k < BS.vanes; k++) {
    const th = (k / BS.vanes) * Math.PI * 2;
    const deg = ((th / d2r) % 360 + 360) % 360;
    if (cut && deg > BS.gap[0] + 8 && deg < BS.gap[1] - 8) continue;
    const v = new THREE.Mesh(vaneGeo, mats.vane);
    const rm = (BS.vaneR[0] + BS.vaneR[1]) / 2;
    v.position.set(rm * Math.sin(th), (BS.vaneY[0] + BS.vaneY[1]) / 2, rm * Math.cos(th));
    v.rotation.set(0, th - Math.PI / 2, 0);
    v.rotateX(-0.42);      // the lean that turns swirl back into axial flow
    tag(v, 'vanes');
  }
  // the annular duct wall round the vanes, and the neck up into the loop
  tag(new THREE.Mesh(lathe([[BS.caseR[1], BS.impY[1] + 0.004], [BS.neckR[0], BS.neckY[0]]], 96, t0, tl), mats.casing), 'casing');
  const neck = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, e = t * t * (3 - 2 * t);
    neck.push([BS.neckR[0] + (BS.neckR[1] - BS.neckR[0]) * e, BS.neckY[0] + (BS.neckY[1] - BS.neckY[0]) * t]);
  }
  neck.push([BS.neckR[1], BASE.h + 0.006]);
  tag(new THREE.Mesh(lathe(neck, 96, t0, tl), mats.casing), 'neck');
  return { group: g, impeller: imp };
}

/** One mixed-flow blade: a twisted strip between hub and casing, rising and
 *  flaring as it wraps, so air leaves up and outward rather than purely out. */
function impellerBlade() {
  const ns = 20, nt = 6;
  const pos = [], idx = [];
  const [y0, y1] = BS.impY;
  for (let i = 0; i <= ns; i++) {
    const s = i / ns;
    const y = y0 + (y1 - y0) * s;
    const rh = BS.hubR[0] + (BS.hubR[1] - BS.hubR[0]) * Math.pow(s, 0.8) + 0.0005;
    const rs = BS.caseR[0] + (BS.caseR[1] - BS.caseR[0]) * s - 0.0015;
    const th0 = 1.25 * Math.pow(s, 1.3);
    for (let j = 0; j <= nt; j++) {
      const t = j / nt;
      const r = rh + (rs - rh) * t, th = th0 + 0.3 * t;
      pos.push(r * Math.cos(th), y, r * Math.sin(th));
    }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) {
    const a = i * (nt + 1) + j, b = a + nt + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ---------------------------------------------------------- particles ---- */
const KIND = { PRIMARY: 0, INDUCED: 1, ENTRAINED: 2 };
const COUNTS = [2600, 1400, 1700];
const N = COUNTS[0] + COUNTS[1] + COUNTS[2];
const PH = { BASE: 1, LOOP: 2, SLOT: 3, JET: 4, BEHIND: 5, SIDE: 6 };
const XI_MAX = 3.1;

const kind = new Uint8Array(N), phase = new Uint8Array(N);
const psi = new Float32Array(N), aux = new Float32Array(N), aux2 = new Float32Array(N);
const lim = new Float32Array(N).fill(XI_MAX);   // where a parcel stops being drawn
const zz = new Float32Array(N), rr = new Float32Array(N), lane = new Float32Array(N), age = new Float32Array(N);
const px = new Float32Array(N * 3);   // previous world position
const dv = new Float32Array(N * 4);   // last direction (xyz) and speed, kept for still frames
for (let i = 0, k = 0; k < 3; k++) for (let c = 0; c < COUNTS[k]; c++) kind[i++] = k;

const vis = (v) => 0.13 * Math.sqrt(Math.max(0, v));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/** Geometry the particles need, refreshed whenever the controls move. */
const G = {};
function refreshFlow() {
  sol = M.solve(params);
  const P = M.profile(params.slotMm);
  const R = params.diameterMm / 2000;
  Object.assign(G, {
    R, y0: loopCentreY(params.diameterMm / 1000), P,
    zTE: Z_NOSE + P.TE[0], rTE: R + P.TE[1],
    B: params.slotMm / 1000, D: params.diameterMm / 1000,
    rPlenum: R + P.plenum.c[1], zPlenum: Z_NOSE + P.plenum.c[0],
  });
  // primary path lengths, for constant-speed travel along the profile
  const pts = P.path; let L = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(L); }
  G.pathLen = L; G.pathCum = cum;
}
const rc = (xi) => G.rTE * (1 - smooth(0, 1.15 * sol.xs, xi));
const wj = (xi) => 0.002 + 0.25 * Math.max(0, xi);
const um = (xi) => sol.U0 * M.peakSpeed(Math.max(xi, 1e-4), G.B, G.D);


/* The primary air's route through the base, as a polyline in (r, y) of the
 * base frame, from outside the grille to the mouth of the neck. yh is the
 * height of the hole the parcel came in through. Each segment carries a
 * nominal speed (m/s) and a swirl (radians per metre of travel). */
function basePath(yh) {
  return [
    { r: 0.16, y: yh, v: 1.2, w: 0 },
    { r: BASE.r * 1.03, y: yh, v: 2.5, w: 0 },
    { r: 0.046, y: yh, v: 3, w: 0 },
    { r: 0.03, y: BS.chamberTop - 0.014, v: 6, w: 0 },
    { r: 0.024, y: BS.impY[0] + 0.004, v: 11, w: 12 },
    { r: BS.caseR[1] - 0.008, y: BS.impY[1], v: 11, w: 55 },
    { r: (BS.vaneR[0] + BS.vaneR[1]) / 2, y: BS.vaneY[1], v: 7, w: 12 },
    { r: BS.neckR[0] - 0.014, y: BS.neckY[0], v: 6, w: 0 },
    { r: BS.neckR[1] - 0.004, y: BS.neckY[1], v: 9, w: 0 },
    { r: BS.neckR[1] - 0.004, y: BASE.h + 0.012, v: 9, w: 0 },
  ];
}
/** Position, speed and swirl at arc length s along the base path. Paths are
 *  cached per grille row, since every parcel enters through one of them. */
const BP = new Map();
function basePathFor(yh) {
  const key = Math.round(yh * 1e4);
  let c = BP.get(key);
  if (!c) {
    const P = basePath(yh), cum = [0];
    for (let k = 1; k < P.length; k++) cum.push(cum[k - 1] + Math.hypot(P[k].r - P[k - 1].r, P[k].y - P[k - 1].y));
    c = { P, cum, len: cum[cum.length - 1] };
    BP.set(key, c);
  }
  return c;
}
function basePathLen(yh) { return basePathFor(yh).len; }
const _b = { r: 0, y: 0, v: 0, w: 0, done: false };
function baseAt(yh, s) {
  const { P, cum } = basePathFor(yh);
  let k = 1;
  while (k < P.length - 1 && cum[k] < s) k++;
  const L = cum[k] - cum[k - 1];
  const f = Math.min(1, Math.max(0, (s - cum[k - 1]) / L));
  _b.r = P[k - 1].r + (P[k].r - P[k - 1].r) * f;
  _b.y = P[k - 1].y + (P[k].y - P[k - 1].y) * f;
  _b.v = P[k - 1].v; _b.w = P[k - 1].w;
  _b.done = k === P.length - 1 && s >= cum[k];
  return _b;
}

function spawn(i, anywhere) {
  const k = kind[i];
  age[i] = 0;
  psi[i] = Math.random() * Math.PI * 2;
  if (k === KIND.PRIMARY && Math.random() < 0.42) {
    // most parcels are picked up in the plenum, so the sheet at the slot is
    // dense; the rest make the whole trip from the grille, through the impeller
    phase[i] = PH.LOOP;
    aux[i] = Math.random() * Math.PI * 2;                 // where it is in the plenum now
    aux2[i] = Math.random() < 0.5 ? -1 : 1;               // which way round it drifts
    psi[i] = aux[i] + aux2[i] * (0.2 + Math.random() * 1.2);   // where it will leave through the slot
    lim[i] = 0.3 + Math.random() * 1.1;
    if (anywhere && Math.random() < 0.6) { phase[i] = PH.JET; zz[i] = Math.random() * lim[i]; lane[i] = Math.max(-0.9, Math.min(0.9, gauss() * 0.22)); aux2[i] = lane[i]; }
  } else if (k === KIND.PRIMARY) {
    phase[i] = PH.BASE;
    // angle round the base, avoiding the cut-away wedge where there are no holes
    let deg = Math.random() * 360;
    if (params.cutaway) deg = BS.gap[1] + Math.random() * (360 - (BS.gap[1] - BS.gap[0]));
    aux[i] = deg * d2r;
    aux2[i] = BS.grilleY[0] + (Math.floor(Math.random() * 7) / 6) * (BS.grilleY[1] - BS.grilleY[0]);   // the row of holes it enters
    zz[i] = Math.random() * 0.06;                // progress along the base path
    lim[i] = 0.25 + Math.random() * 0.5;           // fades soon after the slot: the plenum-born parcels carry the jet
    if (anywhere) zz[i] = Math.random() * basePathLen(aux2[i]);
    if (anywhere) { phase[i] = PH.JET; zz[i] = Math.random() * XI_MAX * Math.random(); lane[i] = Math.max(-0.9, Math.min(0.9, gauss() * 0.22)); aux2[i] = lane[i]; }
  } else if (k === KIND.INDUCED) {
    phase[i] = PH.BEHIND;
    rr[i] = G.rTE * 0.93 * Math.sqrt(Math.random());
    zz[i] = Z_NOSE - 0.12 - Math.random() * (anywhere ? 1.0 : 0.7);
    if (anywhere && Math.random() < 0.5) { zz[i] = G.zTE + Math.random() * 1.2; }
  } else {
    phase[i] = PH.SIDE;
    const xi0 = -0.08 + Math.pow(Math.random(), 1.4) * (XI_MAX - 0.4);
    aux[i] = xi0;
    zz[i] = G.zTE + xi0;
    rr[i] = rc(Math.max(0, xi0)) + wj(Math.max(0, xi0)) + 0.05 + Math.random() * (anywhere ? 0.5 : 0.55);
  }
}

function stepParticle(i, dt) {
  const k = kind[i];
  age[i] += dt;
  switch (phase[i]) {
    case PH.BASE: {          // in through the grille, up through the impeller, out of the neck
      const b = baseAt(aux2[i], zz[i]);
      const ds = vis(b.v * params.speed) * dt;
      zz[i] += ds;
      aux[i] += b.w * ds * (params.speed > 0 ? 1 : 0) * 1.6;
      if (b.done) {
        phase[i] = PH.LOOP;
        aux[i] = -Math.PI / 2;                     // enters the loop at the bottom
        aux2[i] = (Math.random() < 0.5 ? -1 : 1);  // goes round one way or the other
        const d = Math.random() * Math.PI * 0.999;
        psi[i] = -Math.PI / 2 + aux2[i] * d;
      }
      break;
    }
    case PH.LOOP: {          // round the plenum to its place on the loop
      aux[i] += aux2[i] * vis(0.6 * sol.U0) / G.rPlenum * dt;
      if ((aux2[i] > 0 && aux[i] >= psi[i]) || (aux2[i] < 0 && aux[i] <= psi[i])) { phase[i] = PH.SLOT; aux[i] = 0; }
      break;
    }
    case PH.SLOT: {          // down the passage, out of the slot, round the Coanda surface
      aux[i] += vis(sol.U0) * 0.55 * dt;
      if (aux[i] >= G.pathLen) { phase[i] = PH.JET; zz[i] = 0; lane[i] = Math.max(-0.9, Math.min(0.9, gauss() * 0.2)); aux2[i] = Math.max(-0.95, Math.min(0.95, gauss() * 0.3)); }
      break;
    }
    case PH.JET: {
      const xi = zz[i];
      const ro = rc(xi) + wj(xi), ri = Math.max(0, rc(xi) - wj(xi));
      const r = ri + (lane[i] + 1) * 0.5 * (ro - ri);
      const eta = (r - rc(xi)) / wj(xi);          // across the sheet, 0 at its centre
      const dz = (vis(um(xi) * Math.exp(-Math.LN2 * (eta / 0.45) ** 2)) + 0.01) * dt;
      zz[i] += dz;
      // turbulent mixing: a parcel wanders across the jet as it travels
      lane[i] += (aux2[i] - lane[i]) * Math.min(1, dz / 0.35);
      if (zz[i] > lim[i]) spawn(i, false);
      break;
    }
    case PH.BEHIND: {        // pulled through the open loop
      const xi = zz[i] - G.zTE;
      const approach = zz[i] < Z_NOSE ? 0.3 + 0.7 * Math.exp(-(Z_NOSE - zz[i]) / 0.3) : 1 + Math.max(0, xi) / Math.max(0.2, sol.xs);
      zz[i] += (vis(sol.throughSpeed * approach) + 0.004) * dt;
      const ri = Math.max(0, rc(xi) - wj(xi));
      if (xi > 0 && rr[i] >= ri) {
        const ro = rc(xi) + wj(xi);
        phase[i] = PH.JET; lane[i] = Math.min(1, 2 * (rr[i] - ri) / Math.max(1e-6, ro - ri) - 1); zz[i] = xi;
        aux2[i] = -1 + Math.random() * 1.6;
      } else if (xi > XI_MAX) spawn(i, false);
      break;
    }
    case PH.SIDE: {          // drawn in sideways toward the sheet
      const xi = zz[i] - G.zTE;
      const edge = rc(Math.max(0, xi)) + wj(Math.max(0, xi));
      const dist = rr[i] - edge;
      const v = vis(0.09 * um(Math.max(0.02, xi)) * (0.4 + 0.6 * Math.exp(-dist / 0.15))) + 0.004;
      rr[i] -= v * dt;
      zz[i] += 0.35 * v * dt;
      if (rr[i] <= edge) { phase[i] = PH.JET; zz[i] = Math.max(0, xi); lane[i] = 0.98; aux2[i] = 1 - Math.random() * 1.6; }
      break;
    }
  }
  if (k === KIND.PRIMARY && phase[i] !== PH.JET && age[i] > 30) spawn(i, false);
}

const _v = new THREE.Vector3();
function worldPos(i, out) {
  switch (phase[i]) {
    case PH.BASE: { const b = baseAt(aux2[i], zz[i]); return out.set(b.r * Math.sin(aux[i]), b.y, BASE.z + b.r * Math.cos(aux[i])); }
    case PH.LOOP: return ringPoint(out, aux[i], G.rPlenum, G.zPlenum, G.y0);
    case PH.SLOT: {
      const s = aux[i], cum = G.pathCum, pts = G.P.path;
      let j = 1; while (j < cum.length - 1 && cum[j] < s) j++;
      const f = Math.min(1, (s - cum[j - 1]) / Math.max(1e-9, cum[j] - cum[j - 1]));
      const u = pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, v = pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f;
      return ringPoint(out, psi[i], G.R + v, Z_NOSE + u, G.y0);
    }
    case PH.JET: {
      const xi = zz[i];
      const ro = rc(xi) + wj(xi), ri = Math.max(0, rc(xi) - wj(xi));
      return ringPoint(out, psi[i], ri + (lane[i] + 1) * 0.5 * (ro - ri), G.zTE + xi, G.y0);
    }
    default: return ringPoint(out, psi[i], rr[i], zz[i], G.y0);
  }
}

/* --------------------------------------------------------------- charts ---- */
const SVGNS = 'http://www.w3.org/2000/svg';
function el(name, attrs, parent) {
  const e = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.appendChild(e);
  return e;
}
const niceMax = (v) => { const p = 10 ** Math.floor(Math.log10(v)); for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p; return 10 * p; };
const fmt = (v, d = 0) => v.toLocaleString(JA ? 'ja-JP' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });

function drawChartX() {
  const W = 420, H = 266, m = { l: 48, r: 14, t: 34, b: 38 };
  chartX.replaceChildren();
  chartX.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const xMax = 3, B = params.slotMm / 1000, D = params.diameterMm / 1000;
  const Q0 = sol.Q0 * 1000;
  const xs = M.crossover(B, D);
  const pts = [];
  for (let i = 0; i <= 90; i++) {
    const x = (xMax * i) / 90;
    const r = M.ratio(x, B, D), rCore = M.ratio(Math.min(x, xs), B, D);
    const ind = (rCore - 1) / 2;
    pts.push({ x, p: Q0, i: Q0 * (1 + ind), t: Q0 * r });
  }
  const yMax = 4 * niceMax(Math.max(10, pts.at(-1).t * 1.05) / 4);
  const X = (x) => m.l + (x / xMax) * (W - m.l - m.r), Y = (y) => H - m.b - (y / yMax) * (H - m.t - m.b);
  // regime band
  el('rect', { x: X(0), y: m.t, width: X(Math.min(xs, xMax)) - X(0), height: H - m.t - m.b, class: 'c-band' }, chartX);
  if (xs < xMax) el('text', { x: X(Math.min(xs, xMax)) + 5, y: m.t + 11, class: 'c-note' }, chartX).textContent = T.round;
  el('text', { x: X(0) + 5, y: m.t + 11, class: 'c-note' }, chartX).textContent = T.annular;
  // grid and axes
  for (let k = 0; k <= 4; k++) {
    const y = (yMax * k) / 4;
    el('line', { x1: m.l, x2: W - m.r, y1: Y(y), y2: Y(y), class: 'c-grid' }, chartX);
    el('text', { x: m.l - 6, y: Y(y) + 3.5, class: 'c-tick', 'text-anchor': 'end' }, chartX).textContent = fmt(y);
  }
  for (let x = 0; x <= xMax; x += 0.5) el('text', { x: X(x), y: H - m.b + 14, class: 'c-tick', 'text-anchor': 'middle' }, chartX).textContent = fmt(x, 1);
  el('text', { x: (m.l + W - m.r) / 2, y: H - 6, class: 'c-axis', 'text-anchor': 'middle' }, chartX).textContent = T.dist;
  el('text', { x: 12, y: m.t + (H - m.t - m.b) / 2, class: 'c-axis', 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + (H - m.t - m.b) / 2})` }, chartX).textContent = T.flow;
  // stacked areas: entrained (top), induced, primary (bottom)
  const area = (lo, hi, cls) => {
    let d = `M${X(pts[0].x)},${Y(hi(pts[0]))}`;
    for (const p of pts.slice(1)) d += `L${X(p.x)},${Y(hi(p))}`;
    for (const p of [...pts].reverse()) d += `L${X(p.x)},${Y(lo(p))}`;
    el('path', { d: d + 'Z', class: cls }, chartX);
  };
  area((p) => p.i, (p) => p.t, 'c-ent');
  area((p) => p.p, (p) => p.i, 'c-ind');
  area(() => 0, (p) => p.p, 'c-pri');
  // patent point, only where it applies
  if (Math.abs(params.slotMm - 1.3) < 0.05 && Math.abs(params.diameterMm - 350) < 5 && params.speed > 0.99) {
    el('rect', { x: X(1.0), y: Y(500), width: X(1.2) - X(1.0), height: Y(400) - Y(500), class: 'c-patent' }, chartX);
    el('text', { x: X(1.2) + 4, y: Y(500) + 4, class: 'c-note' }, chartX).textContent = T.patent;
  }
  // probe
  const s = sol;
  el('line', { x1: X(params.x), x2: X(params.x), y1: m.t, y2: H - m.b, class: 'c-probe' }, chartX);
  el('circle', { cx: X(params.x), cy: Y(s.Q * 1000), r: 3.5, class: 'c-dot' }, chartX);
  const left = params.x > 0.8;
  const lx = left ? X(params.x) - 7 : X(params.x) + 7;
  el('text', { x: lx, y: Math.max(m.t + 24, Y(s.Q * 1000) - 8), class: 'c-label', 'text-anchor': left ? 'end' : 'start' }, chartX)
    .textContent = `${fmt(s.Q * 1000)} ${T.ls} · ${fmt(s.ratio, 1)}×`;
  // key
  const key = [['c-pri', T.primary], ['c-ind', T.indShort], ['c-ent', T.entShort]];
  let kx = m.l;
  const ky = 12;
  for (const [cls, txt] of key) {
    el('rect', { x: kx, y: ky - 7, width: 9, height: 9, class: cls + ' c-swatch' }, chartX);
    const t = el('text', { x: kx + 13, y: ky + 1, class: 'c-tick' }, chartX); t.textContent = txt;
    kx += 20 + txt.length * (JA ? 10 : 5.4);
  }
}

function drawChartB() {
  const W = 420, H = 266, m = { l: 48, r: 44, t: 34, b: 38 };
  chartB.replaceChildren();
  chartB.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const bMin = 0.5, bMax = 4;
  const rows = [];
  for (let i = 0; i <= 70; i++) {
    const b = bMin + ((bMax - bMin) * i) / 70;
    const s = M.solve({ ...params, slotMm: b });
    rows.push({ b, q: s.Q * 1000, r: s.ratio });
  }
  const qMax = 4 * niceMax((Math.max(...rows.map((d) => d.q)) * 1.1 || 1) / 4), rMax = 4 * niceMax(Math.max(...rows.map((d) => d.r)) * 1.05 / 4);
  const X = (b) => m.l + ((b - bMin) / (bMax - bMin)) * (W - m.l - m.r);
  const Yq = (q) => H - m.b - (q / qMax) * (H - m.t - m.b), Yr = (r) => H - m.b - (r / rMax) * (H - m.t - m.b);
  for (let k = 0; k <= 4; k++) {
    el('line', { x1: m.l, x2: W - m.r, y1: Yq((qMax * k) / 4), y2: Yq((qMax * k) / 4), class: 'c-grid' }, chartB);
    el('text', { x: m.l - 6, y: Yq((qMax * k) / 4) + 3.5, class: 'c-tick', 'text-anchor': 'end' }, chartB).textContent = fmt((qMax * k) / 4);
    el('text', { x: W - m.r + 6, y: Yr((rMax * k) / 4) + 3.5, class: 'c-tick c-tick-r' }, chartB).textContent = fmt((rMax * k) / 4) + '×';
  }
  for (let b = 0.5; b <= 4.001; b += 0.5) el('text', { x: X(b), y: H - m.b + 14, class: 'c-tick', 'text-anchor': 'middle' }, chartB).textContent = fmt(b, 1);
  el('text', { x: (m.l + W - m.r) / 2, y: H - 6, class: 'c-axis', 'text-anchor': 'middle' }, chartB).textContent = T.slotW;
  el('text', { x: 12, y: m.t + (H - m.t - m.b) / 2, class: 'c-axis', 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + (H - m.t - m.b) / 2})` }, chartB).textContent = T.delivered + ' (' + T.ls + ')';
  const line = (f, y, cls) => el('path', { d: rows.map((d, i) => `${i ? 'L' : 'M'}${X(d.b)},${y(f(d))}`).join(''), class: cls }, chartB);
  line((d) => d.r, Yr, 'c-ratio');
  line((d) => d.q, Yq, 'c-q');
  const best = M.bestSlotMm(params.diameterMm);
  if (best >= bMin && best <= bMax) {
    el('line', { x1: X(best), x2: X(best), y1: m.t, y2: H - m.b, class: 'c-best' }, chartB);
    el('text', { x: X(best) + 4, y: m.t + 11, class: 'c-note' }, chartB).textContent = `${T.best} ${fmt(best, 2)} mm`;
  }
  el('line', { x1: X(params.slotMm), x2: X(params.slotMm), y1: m.t, y2: H - m.b, class: 'c-probe' }, chartB);
  el('circle', { cx: X(params.slotMm), cy: Yq(sol.Q * 1000), r: 3.5, class: 'c-dot' }, chartB);
  el('circle', { cx: X(params.slotMm), cy: Yr(sol.ratio), r: 3, class: 'c-dot-r' }, chartB);
  // key
  el('line', { x1: m.l, x2: m.l + 16, y1: 8, y2: 8, class: 'c-q' }, chartB);
  el('text', { x: m.l + 20, y: 11.5, class: 'c-tick' }, chartB).textContent = `${T.delivered}, x = ${fmt(params.x, 2)} m`;
  el('line', { x1: m.l + 190, x2: m.l + 206, y1: 8, y2: 8, class: 'c-ratio' }, chartB);
  el('text', { x: m.l + 210, y: 11.5, class: 'c-tick' }, chartB).textContent = T.ratioLine;
}

function writeReadout() {
  const s = sol;
  const item = (k, v) => `<span>${k} <b>${v}</b></span>`;
  readout.innerHTML = [
    item(T.q0, `${fmt(s.Q0 * 1000, 1)} ${T.ls}`),
    item(T.slotSpeed, `${fmt(s.U0, 1)} m/s`),
    item(T.dp, `${fmt(s.dp)} Pa`),
    item(T.re, fmt(s.Re)),
    item(T.qx, `${fmt(s.Q * 1000)} ${T.ls}`),
    item(T.mult, `${fmt(s.ratio, 1)}×`),
    item(T.through, `${fmt(s.throughSpeed, 1)} m/s`),
    item(T.xs, `${fmt(s.xs, 2)} m`),
    item(T.power, `${fmt(s.power, 1)} W`),
  ].join('');
}

/* ---------------------------------------------------------------- stage ---- */
refreshFlow();

const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    renderer.toneMapping = THREE.NeutralToneMapping;
    camera.fov = 34; camera.near = 0.004; camera.far = 40;
    camera.position.set(-1.42, 0.84, -0.5);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.37, 0.52);
    controls.enableDamping = true;
    controls.minDistance = 0.06; controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.addEventListener('change', () => lab.invalidate());
    controls.addEventListener('start', () => { camAnim = null; });
    controls.update();

    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
      scene.environmentIntensity = 0.55;
    } catch (err) { console.warn('lab: no environment map,', err.message); }
    scene.add(new THREE.HemisphereLight(0xffffff, 0x60584f, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2, 3, -1);
    scene.add(key);

    const mats = {
      shell: new THREE.MeshStandardNodeMaterial({ color: 0xc9ccd1, metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide }),
      cap: new THREE.MeshStandardNodeMaterial({ color: 0xb07a52, metalness: 0.05, roughness: 0.75, side: THREE.DoubleSide }),
      dark: new THREE.MeshStandardNodeMaterial({ color: 0x2a2b2e, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide }),
      hole: new THREE.MeshBasicNodeMaterial({ color: 0x151515 }),
      metal: new THREE.MeshStandardNodeMaterial({ color: 0x8d9097, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide }),
      casing: new THREE.MeshStandardNodeMaterial({ color: 0x3a3c40, metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide }),
      copper: new THREE.MeshStandardNodeMaterial({ color: 0xb87333, metalness: 0.9, roughness: 0.4 }),
      vane: new THREE.MeshStandardNodeMaterial({ color: 0x777b82, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide }),
      sheet: new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
      blade: new THREE.MeshStandardNodeMaterial({ color: 0xb0b4bb, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide }),
    };

    const grid = new THREE.GridHelper(6, 30);
    grid.position.z = 1.2;
    grid.material.transparent = true; grid.material.opacity = 0.14;
    scene.add(grid);

    let loop = null, base = null;
    const rebuild = () => {
      if (loop) { scene.remove(loop.group); loop.group.traverse((o) => o.geometry?.dispose()); }
      if (base) { scene.remove(base.group); base.group.traverse((o) => o.geometry?.dispose()); }
      loop = buildLoop(params.slotMm, params.diameterMm / 1000, params.cutaway, mats);
      base = buildBase(params.cutaway, mats);
      scene.add(loop.group, base.group);
    };
    rebuild();

    // streaks
    const streakGeo = new THREE.BoxGeometry(1, 1, 1);
    const streakMat = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.9, depthWrite: false });
    const streaks = new THREE.InstancedMesh(streakGeo, streakMat, N);
    streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    streaks.frustumCulled = false;
    scene.add(streaks);

    // the measurement plane at x
    const probeMat = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false });
    const probe = new THREE.Mesh(new THREE.RingGeometry(0, 1, 96), probeMat);
    const probeEdgeMat = new THREE.LineBasicNodeMaterial({ transparent: true, opacity: 0.7 });
    const probeEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 97 }, (_, k) => new THREE.Vector3(Math.cos((k / 96) * Math.PI * 2), Math.sin((k / 96) * Math.PI * 2), 0))), probeEdgeMat);
    scene.add(probe, probeEdge);
    const placeProbe = () => {
      const xi = params.x;
      const outer = rc(xi) + wj(xi), inner = Math.max(0, rc(xi) - wj(xi));
      probe.geometry.dispose();
      probe.geometry = new THREE.RingGeometry(inner, outer, 96);
      probe.position.set(0, G.y0, G.zTE + xi);
      probeEdge.position.copy(probe.position);
      probeEdge.scale.setScalar(outer);
    };
    placeProbe();

    // colours from the page
    const colours = {};
    const applyTheme = () => {
      const c = readColors(['--flow-primary', '--flow-induced', '--flow-entrained', '--ink', '--rule', '--accent']);
      colours.k = [c['flow-primary'], c['flow-induced'], c['flow-entrained']];
      for (let i = 0; i < N; i++) streaks.setColorAt(i, colours.k[kind[i]]);
      streaks.instanceColor.needsUpdate = true;
      grid.material.color.copy(c.rule);
      probeMat.color.copy(c.accent); probeEdgeMat.color.copy(c.accent);
      mats.cap.color.copy(c.accent).lerp(new THREE.Color(0x9a8f86), 0.6);
      mats.sheet.color.copy(c['flow-primary']);
      lab.invalidate();
    };
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    // particles: warm the flow up so the first frame is already developed
    for (let i = 0; i < N; i++) spawn(i, true);
    const warm = (seconds) => { for (let t = 0; t < seconds; t += 1 / 30) for (let i = 0; i < N; i++) stepParticle(i, 1 / 30); };
    warm(6);
    for (let i = 0; i < N; i++) { worldPos(i, _v); px[i * 3] = _v.x; px[i * 3 + 1] = _v.y; px[i * 3 + 2] = _v.z; }

    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), dir = new THREE.Vector3(), mid = new THREE.Vector3();
    const Zup = new THREE.Vector3(0, 0, 1);
    function writeStreaks(dt) {
      const stop = TOUR[+params.tour];
      for (let i = 0; i < N; i++) {
        worldPos(i, _v);
        const o = i * 3;
        dir.set(_v.x - px[o], _v.y - px[o + 1], _v.z - px[o + 2]);
        const d = dir.length();
        if (d > 1e-7 && d < 0.5 && dt > 0) {
          dir.multiplyScalar(1 / d);
          dv[i * 4] = dir.x; dv[i * 4 + 1] = dir.y; dv[i * 4 + 2] = dir.z; dv[i * 4 + 3] = d / dt;
        } else if (d >= 0.5) { dv[i * 4 + 3] = 0; }
        dir.set(dv[i * 4], dv[i * 4 + 1], dv[i * 4 + 2]);
        const speed = dv[i * 4 + 3];
        // fade in at birth and out at the far end by shrinking
        let f = Math.min(1, age[i] / 0.5);
        if (phase[i] === PH.JET) f *= 1 - smooth(lim[i] - Math.min(0.5, lim[i] * 0.4), lim[i], zz[i]);
        if (!params.flow || !kindsOn[kind[i]]) f = 0;
        const inBase = phase[i] <= PH.SLOT, nearJet = phase[i] === PH.JET && zz[i] < 0.3;
        if (stop.phases && !stop.phases.includes(phase[i])) f = 0;
        if (stop.near && phase[i] === PH.JET && zz[i] > stop.near) f = 0;
        const closeUp = (inBase ? (stop.streakBase ?? stop.streak ?? 1) : (stop.streak ?? 1)) * (stop.xray && !inBase ? 0.5 : 1);
        const len = closeUp * Math.min(inBase ? 0.009 : nearJet ? 0.025 : 0.06, Math.max(inBase ? 0.003 : 0.006, speed * (inBase ? 0.03 : 0.09)));
        if (dir.lengthSq() > 0.5) q.setFromUnitVectors(Zup, dir); else q.identity();
        mid.copy(_v);
        const th = closeUp * (inBase ? 0.0019 : kind[i] === KIND.PRIMARY ? 0.003 : 0.0024);
        sc.set(th * f, th * f, len * f);
        streaks.setMatrixAt(i, mtx.compose(mid, q, sc));
        px[o] = _v.x; px[o + 1] = _v.y; px[o + 2] = _v.z;
      }
      streaks.instanceMatrix.needsUpdate = true;
    }
    for (let i = 0; i < N; i++) stepParticle(i, 1 / 30);
    writeStreaks(1 / 30);

    /* labels: HTML over the canvas, projected each frame */
    const labels = [
      { t: T.intake, part: 'grille', at: () => new THREE.Vector3(BASE.r * 1.07 * Math.sin(200 * d2r), 0.07, BASE.z + BASE.r * 1.07 * Math.cos(200 * d2r)), side: -1 },
      { t: T.bell, part: 'bell', ov: false, at: () => new THREE.Vector3(0.01, BS.chamberTop - 0.014, BASE.z - BS.bellR + 0.006), side: 1, cut: true },
      { t: T.impeller, part: 'impeller', at: () => new THREE.Vector3(-0.01, 0.1, BASE.z + 0.036), side: -1, cut: true },
      { t: T.motor, part: 'motor', ov: false, at: () => new THREE.Vector3(0.008, 0.168, BASE.z - BS.motorR + 0.004), side: 1, cut: true },
      { t: T.vanes, part: 'vanes', ov: false, at: () => new THREE.Vector3(-0.012, 0.157, BASE.z + 0.046), side: -1, cut: true },
      { t: T.neck, part: 'neck', ov: false, at: () => new THREE.Vector3(0.006, 0.238, BASE.z - 0.034), side: 1, cut: true },
      { t: T.slot, part: 'loop', ov: false, at: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + G.P.S1[1] - 0.002, Z_NOSE + G.P.S1[0] - 0.003, G.y0), side: -1, cut: true },
      { t: T.diffuser, part: 'loop', ov: false, at: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + (G.P.E[1] + G.P.TE[1]) / 2 - 0.002, Z_NOSE + (G.P.E[0] + G.P.TE[0]) / 2, G.y0), side: 1, cut: true },
      { t: T.coanda, part: 'loop', at: () => ringPoint(new THREE.Vector3(), 100 * d2r, G.R + G.P.vMin, Z_NOSE + G.P.C[0], G.y0), side: 1, cut: true },
      { t: T.plenum, part: 'loop', ov: false, at: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0), side: -1, cut: true },
      { t: T.induced, part: 'jet', at: () => new THREE.Vector3(0, G.y0 - 0.02, Z_NOSE - 0.42), side: 1, chip: true },
      { t: T.entrained, part: 'jet', at: () => new THREE.Vector3(-(G.R + 0.32), G.y0 + 0.12, G.zTE + 0.5), side: -1, chip: true },
      { t: '', part: 'jet', at: () => new THREE.Vector3(0, G.y0 + rc(params.x) + wj(params.x), G.zTE + params.x), side: 1, probe: true },
    ].map((L) => {
      const e = document.createElement('div');
      e.className = 'lab-label' + (L.chip ? ' is-chip' : '') + (L.probe ? ' is-probe' : '');
      e.dataset.side = L.side < 0 ? 'left' : 'right';
      e.textContent = L.t;
      labelLayer.appendChild(e);
      return { ...L, e };
    });
    const pv = new THREE.Vector3();
    function placeLabels() {
      labelLayer.classList.toggle('is-hidden', !params.labels);
      if (!params.labels) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const narrow = w < 560;
      for (const L of labels) {
        if (L.probe) L.e.textContent = `x = ${fmt(params.x, 2)} m · ${fmt(sol.ratio, 1)}×`;
        const stop = TOUR[+params.tour];
        const shown = stop.labels ? stop.labels.includes(L.part) : stop.focus ? (L.part && stop.focus.includes(L.part)) : L.ov !== false;
        const hide = !shown || (L.cut && !params.cutaway) || (narrow && !stop.focus && !L.chip && !L.probe && L.t !== T.slot && L.t !== T.coanda);
        pv.copy(L.at()).project(camera);
        if (hide || pv.z > 1) { L.e.style.opacity = 0; continue; }
        let x = (pv.x * 0.5 + 0.5) * w;
        const y = (-pv.y * 0.5 + 0.5) * h;
        if (L.chip || L.probe) { const half = L.e.offsetWidth / 2 + 8; x = Math.min(w - half, Math.max(half, x)); }
        const lead = L.chip || L.probe ? 0 : 20;
        L.e.style.setProperty('--leader', lead + 'px');
        const tx = L.side < 0 ? `calc(-100% - ${lead}px)` : `${lead}px`;
        L.e.style.transform = `translate(${x}px, ${y}px) translate(${L.chip || L.probe ? '-50%' : tx}, -50%)`;
        L.e.style.opacity = 1;
      }
    }


    /* The tour: a camera position, a set of parts left solid, and which
     * particles are drawn. Everything else goes to a ghost material. */
    const ghost = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
    const xray = new THREE.MeshStandardNodeMaterial({ color: 0xc9ccd1, metalness: 0.4, roughness: 0.4, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
    function setFocus(stop) {
      const focus = stop.focus;
      for (const root of [loop.group, base.group]) root.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.userData.mat) o.userData.mat = o.material;
        const part = o.userData.part || 'loop';
        if (part === 'sheet') { o.visible = !!stop.sheet; return; }
        o.material = (!focus || focus.includes(part)) ? (stop.xray && part === 'loop' ? xray : o.userData.mat) : ghost;
      });
      const showJet = !focus || !!stop.jet;
      kindsOn[0] = 1; kindsOn[1] = showJet ? 1 : 0; kindsOn[2] = showJet ? 1 : 0;
      probe.visible = probeEdge.visible = showJet;
      grid.visible = !focus;
    }
    let camAnim = null;
    function goTo(stop, instant) {
      const vec = (v) => typeof v === 'function' ? v() : new THREE.Vector3(...v);
      const to = { p: vec(stop.cam), t: vec(stop.tgt) };
      if (instant || lab.reducedMotion) {
        camera.position.copy(to.p); controls.target.copy(to.t); controls.update(); camAnim = null;
      } else {
        camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: to.p, t1: to.t, start: performance.now(), dur: 1400 };
      }
      setFocus(stop);
      const cap = document.getElementById('tour-caption');
      if (cap) cap.textContent = stop.text;
      lab.invalidate();
    }
    goTo(TOUR[+params.tour], true);
    ghost.color.set(0x808080);

    let dirty = true;
    return {
      update(dt) {
        if (camAnim) {
          camAnim.t = Math.min(1, (performance.now() - camAnim.start) / camAnim.dur);   // wall clock, so a slow machine still arrives
          const e = camAnim.t < 0.5 ? 4 * camAnim.t ** 3 : 1 - Math.pow(-2 * camAnim.t + 2, 3) / 2;
          camera.position.lerpVectors(camAnim.p0, camAnim.p1, e);
          controls.target.lerpVectors(camAnim.t0, camAnim.t1, e);
          if (camAnim.t >= 1) camAnim = null;
          lab.invalidate();
        }
        controls.update();
        if (dirty) { rebuild(); placeProbe(); setFocus(TOUR[+params.tour]); dirty = false; }
        const running = !lab.reducedMotion && params.speed > 0;
        if (running) for (let i = 0; i < N; i++) stepParticle(i, dt);
        if (running) base.impeller.rotation.y -= 2.6 * params.speed * dt;
        writeStreaks(running ? dt : 0);
        placeLabels();
      },
      rebuildGeometry() { dirty = true; lab.invalidate(); },
      goTo(i) { goTo(TOUR[i]); },
      kindsOn,
      reprobe() { placeProbe(); lab.invalidate(); },
      dispose() { controls.dispose(); stopTheme(); },
    };
  },
});

function onParams(p, name) {
  refreshFlow();
  drawChartX(); drawChartB(); writeReadout();
  if (!lab) return;
  if (name === 'tour') { lab.hooks.goTo(+p.tour); return; }
  if (name === 'slotMm' || name === 'diameterMm' || name === 'cutaway') lab.hooks.rebuildGeometry();
  else lab.hooks.reprobe?.();
  lab.setOnDemand(lab.reducedMotion || p.speed === 0);
  lab.invalidate();
}

const ctl = bindControls(panel, params, onParams);
for (const b of panel.querySelectorAll('[data-tour-step]')) {
  b.addEventListener('click', () => {
    const n = (+params.tour + (+b.dataset.tourStep) + TOUR.length) % TOUR.length;
    ctl.set('tour', String(n));
  });
}
drawChartX(); drawChartB(); writeReadout();
