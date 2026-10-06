/* The bladeless fan: scene, particles and charts.
 *
 * One canvas. The loop is a lathe of the cross-section in model.js, so the slot
 * the reader widens is the slot the particles leave through. Particle speeds
 * come from the same jet laws that produce the numbers, compressed by a square
 * root so a 19 m/s sheet and a 2 m/s drift can share one screen. Each parcel
 * draws its own recent path as a tapering streak, so the picture shows where
 * the air is going as well as where it is.
 */
import * as THREE from 'three/webgpu';
import { attribute } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mountLab, bindControls, readColors, onThemeChange, isDark } from '/assets/lab-kit/lab-kit.js';
import { createStudio, surface } from '/assets/lab-kit/studio-look.js';
import * as M from './model.js';

const canvas = document.getElementById('stage');
const panel = document.getElementById('controls');
const readout = document.getElementById('readout');
const labelLayer = document.getElementById('labels');
const chartX = document.getElementById('chart-x');
const chartB = document.getElementById('chart-b');

const JA = document.documentElement.lang.startsWith('ja');
const T = JA ? {
  intake: '吸気口の穴', impeller: '斜流インペラ', slot: 'スリット 1.3 mm', coanda: 'コアンダ面', plenum: '空気室',
  induced: '輪の中を通って引き込まれる空気', entrained: '周囲から巻き込まれる空気',
  slotSpeed: 'スリット流速', re: 'スリットのレイノルズ数', dp: 'スリット差圧', q0: 'モーターが送る空気',
  qx: '距離xでの風量', mult: '増幅率', through: '輪を抜ける風速', xs: '円形噴流への移行', power: '噴流の空気動力',
  ls: 'L/s', dist: '距離 x (m)', flow: '風量 (L/s)', slotW: 'スリット幅 (mm)', ratioAx: '増幅率',
  primary: 'モーター', indShort: '輪の中から', entShort: '周囲から', patent: '特許の値',
  delivered: 'x での風量', ratioLine: '増幅率', best: '整合点', now: '現在',
  annular: '環状の膜', round: '円形噴流',
  bell: 'ベルマウス', motor: 'モーター', vanes: '整流翼', neck: 'ネック', diffuser: 'ディフューザー 15°',
  keyHead: (x) => `距離 ${x} m の面を通る空気`,
  keyP: 'モーターが送る空気', keyI: '輪の中を通って引き込まれる', keyE: '周囲から巻き込まれる',
  metre: 'm',
  tour: [
    '空気の通り道の全体。筋の一本一本が空気の小さな塊で、その最近の軌跡を描いている。琥珀色はモーターが触れる唯一の空気で、青と緑はそれが引きずる空気である。左上の凡例が、選んだ距離でそれぞれが何リットルかを示す。',
    '空気は台座の下部を一周する数百の小さな穴から入り、インペラの下の部屋に集まる。穴が小さいのは静かにするためとモーターを見せないためで、それでも開口の合計はスリットの何倍もある。琥珀色の筋が穴から内側へ向かうのを見てほしい。',
    'ベルマウスがインペラに下から空気を送る。これは斜流インペラで、上に行くほど広がるハブに九枚の羽根が付き、空気を上向きと外向きに同時に押し出す。軸流ファンと遠心送風機の中間であり、この扇風機で動く部品はこれだけである。',
    'インペラを出た空気は回転している。その上に並ぶ固定された翼が渦を取り除き、回転の運動を圧力として回収する。筋がらせんから真っすぐな上昇に変わるところが整流翼である。台座はそこで絞られてネックとなり、空気を輪の中へ送り上げる。',
    '輪の内部で空気は一周する通路、空気室を満たし、二百パスカルほどの圧力になる。出口が一つしかない貯め池である。輪を半透明にしてあるので、空気が左右に分かれて輪を回るのが見える。',
    '出口は輪の内側の面にある幅1.3 mmのスリットである。膜は秒速約19 mで出て、丸みのあるコアンダ面に沿って曲がり、開いたディフューザーを通って後縁へ向かう。切断面の濃い色の部分が空気室とスリットへの通路である。',
    '後縁を離れた膜は両面で空気を引き込む。後ろから輪の中を通る空気（青）と、縁の周りから来る空気（緑）である。輪はxの位置で、そこを通る空気の量が凡例に出る。1 m先では、モーターが送った1リットルにつき16リットルが動いている。',
  ],
} : {
  intake: 'intake holes', impeller: 'mixed-flow impeller', slot: 'slot, 1.3 mm', coanda: 'Coanda surface', plenum: 'plenum',
  induced: 'induced through the loop', entrained: 'entrained from around it',
  slotSpeed: 'slot speed', re: 'slot Reynolds number', dp: 'slot pressure', q0: 'motor air',
  qx: 'air moving at x', mult: 'multiplication', through: 'speed through the loop', xs: 'becomes a round jet at', power: 'jet power',
  ls: 'l/s', dist: 'distance x (m)', flow: 'flow (l/s)', slotW: 'slot width (mm)', ratioAx: 'ratio',
  primary: 'motor', indShort: 'through the loop', entShort: 'from around it', patent: 'patent',
  delivered: 'air at x', ratioLine: 'ratio', best: 'matched', now: 'now',
  annular: 'annular sheet', round: 'round jet',
  bell: 'bell mouth', motor: 'motor', vanes: 'stator vanes', neck: 'neck', diffuser: 'diffuser, 15°',
  keyHead: (x) => `Air crossing the plane at ${x} m`,
  keyP: 'sent by the motor', keyI: 'drawn through the loop', keyE: 'drawn from around it',
  metre: 'm',
  tour: [
    'The whole path. Each streak is a small parcel of air drawn with its recent track. Amber is the only air the motor touches; blue and green are what it drags along, and the key in the corner gives each in litres a second at the distance you choose.',
    'Air comes in through a few hundred small holes round the bottom of the base, into a chamber under the impeller. The holes are small to keep the base quiet and the motor out of sight; their total open area is still many times the slot\'s. Watch the amber streaks turn inward through them.',
    'A bell mouth feeds the impeller from below. This is a mixed-flow impeller: nine blades on a hub that widens as it rises, so air leaves upward and outward at once, part axial fan and part centrifugal blower. It is the only moving part in the fan.',
    'The impeller leaves the air spinning. A ring of fixed vanes above it takes the swirl off and turns that motion back into pressure: the streaks change from a spiral to a straight climb as they pass them. The base then narrows into a neck that carries the air up into the loop.',
    'Inside the loop the air fills a channel that runs the whole way round, the plenum, at a couple of hundred pascals. It is a reservoir with one exit. The loop is drawn translucent here so you can see the air split and run round both ways.',
    'The exit is the slot, 1.3 mm wide on the loop\'s inner face. The sheet leaves at about 19 m/s, wraps the rounded Coanda surface, and runs along the flared diffuser to the trailing edge. In the cut face, the dark hollow is the plenum and the passage down to the slot.',
    'Off the trailing edge the sheet drags in air on both faces: through the loop from behind (blue) and from around the rim (green). The ring marks the distance x, and the key gives what crosses it. By a metre out there are sixteen litres moving for every one the motor sent.',
  ],
};

/* Tour stops. Camera and target are in metres in the scene; the loop's own
 * points are functions because they move with the loop diameter. `labels` are
 * the callouts drawn at that stop, `trail` the length of each streak in
 * seconds of travel and `width` its thickness relative to the overview. */
const LOOP_FACE = 100 * Math.PI / 180;    // the cut face that faces the camera
const TOUR = [
  { cam: [-1.5, 0.74, -0.86], tgt: [0, 0.31, 0.6], focus: null, jet: true, labels: ['intake', 'impeller', 'coanda', 'probe', 'ruler'], trail: 0.24 },
  { cam: [0.3, 0.19, 0.4], tgt: [0, 0.075, -0.009], focus: ['shell', 'grille'], phases: [1], labels: ['intake'], trail: 0.13, width: 0.55 },
  { cam: [-0.25, 0.14, -0.105], tgt: [-0.005, 0.095, -0.009], focus: ['bell', 'impeller', 'casing', 'motor'], phases: [1], labels: ['bell', 'impeller', 'motor'], trail: 0.07, width: 0.4 },
  { cam: [-0.28, 0.27, -0.12], tgt: [0, 0.195, -0.009], focus: ['vanes', 'motor', 'neck', 'casing'], phases: [1], labels: ['vanes', 'motor', 'neck'], trail: 0.08, width: 0.45 },
  { cam: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0).add(new THREE.Vector3(-0.2, 0.11, -0.17)), tgt: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0), focus: ['loop'], phases: [1, 2, 3], xray: true, labels: ['plenum', 'slot'], trail: 0.1, width: 0.6 },
  { cam: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + G.P.C[1], Z_NOSE + G.P.C[0], G.y0).add(new THREE.Vector3(-0.075, -0.055, -0.055)), tgt: () => ringPoint(new THREE.Vector3(), LOOP_FACE, G.R + G.P.C[1] - 0.006, Z_NOSE + G.P.C[0] + 0.012, G.y0), focus: ['loop'], phases: [3, 4], near: 0.35, labels: ['slot', 'coanda', 'diffuser', 'plenum'], trail: 0.08, width: 0.22, sheet: true },
  { cam: [-1.7, 0.95, 1.7], tgt: [0, 0.45, 1.0], focus: null, jet: true, labels: ['induced', 'entrained', 'probe', 'ruler'], trail: 0.24 },
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

/* The loop is three lathes of the one section, split where the surface has a
 * real edge: the outer skin from the trailing edge round the nose to the
 * slot's upstream lip; the hollow inside (the passage up from the slot and
 * the plenum); and the Coanda surface with the diffuser back to the trailing
 * edge. Splitting there keeps the lips and the trailing edge sharp instead of
 * smoothing them into a doughnut, and lets the hollow be dark. */
function buildLoop(slotMm, D, cut, mats) {
  const P = M.profile(slotMm);
  const R = D / 2;
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;   // lathe axis (y) -> flow axis (z)
  g.add(inner);
  const v2 = ([u, v]) => new THREE.Vector2(R + v, u + Z_NOSE);
  const iS1 = P.pts.indexOf(P.S1), iS2 = P.pts.indexOf(P.S2);
  const skin = P.pts.slice(0, iS1 + 1).map(v2);
  const bore = P.pts.slice(iS1, iS2 + 1).map(v2);
  const face = [...P.pts.slice(iS2), P.pts[0]].map(v2);
  // lathe angle phi relates to ring angle psi by phi = psi + 90 deg
  const phiA = (CUT.a1 + 90) * d2r, span = cut ? (360 - (CUT.a1 - CUT.a0)) * d2r : Math.PI * 2;
  const SEG = 288;
  for (const [pts, mat] of [[skin, mats.loop], [bore, mats.bore], [face, mats.face]]) {
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, SEG, cut ? phiA : 0, span), mat);
    m.userData.part = 'loop';
    inner.add(m);
  }
  if (cut) {
    const all = P.pts.map(v2);
    const shape = new THREE.Shape(all);
    for (const psiDeg of [CUT.a0, CUT.a1]) {
      const geo = new THREE.ShapeGeometry(shape);
      const phi = (psiDeg + 90) * d2r;
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const r = p.getX(i), y = p.getY(i);
        p.setXYZ(i, r * Math.sin(phi), y, r * Math.cos(phi));
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mats.cap);
      m.userData.part = 'loop';
      inner.add(m);
    }
  }
  // the sheet itself: the primary air's path from the slot to the trailing
  // edge, swept round the loop as a thin translucent band (shown on the slot stop)
  const sheetPts = P.path.slice(2).map(v2);
  const sheet = new THREE.Mesh(new THREE.LatheGeometry(sheetPts, SEG, cut ? phiA : 0, span), mats.sheet);
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
  band: [0.012, 0.1135], grilleY: [0.026, 0.1], rows: 8, cols: 64, holeR: 0.0021, seamY: 0.115,
  chamberTop: 0.06,
  throat: 0.036, bellR: 0.054,
  impY: [0.06, 0.125], hubR: [0.011, 0.033], caseR: [0.036, 0.056],
  motorR: 0.03, motorY: [0.125, 0.2],
  vaneY: [0.132, 0.182], vaneR: [0.031, 0.056], vanes: 11,
  neckY: [0.2, 0.266], neckR: [0.058, 0.021],
};
const WALL = 0.003, FILLET = 0.011;
const rAt = (y) => BASE.r * (1.06 - 0.06 * (y / BASE.h));

/** A surface of revolution about y from a list of [r, y] points. */
function lathe(pts, seg = 96, start = 0, len = Math.PI * 2) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, start, len);
}

/** The skirt's perforation, as an alpha map: one texture tile spans two
 *  columns of holes (the rows are staggered) and the full height of the band. */
function perforation() {
  const W = 64, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#000';
  const bandH = BS.band[1] - BS.band[0];
  const colPitch = 2 * Math.PI * rAt(0.06) / BS.cols;     // metres between columns
  const rx = (BS.holeR / (2 * colPitch)) * W, ry = (BS.holeR / bandH) * H;
  for (let k = 0; k < BS.rows; k++) {
    const y = BS.grilleY[0] + (k / (BS.rows - 1)) * (BS.grilleY[1] - BS.grilleY[0]);
    const cy = (1 - (y - BS.band[0]) / bandH) * H;
    for (const cx of k % 2 ? [W * 0.75] : [W * 0.25]) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8;
  return t;
}

function buildBase(cut, mats) {
  const g = new THREE.Group();
  g.position.z = BASE.z;
  const tag = (mesh, part) => { mesh.userData.part = part; g.add(mesh); return mesh; };
  const t0 = cut ? BS.gap[1] * d2r : 0, tl = cut ? (360 - (BS.gap[1] - BS.gap[0])) * d2r : Math.PI * 2;
  const H = BASE.h, rOpen = BS.neckR[1] + 0.004, s = BS.seamY;

  // the outer skin: a chamfered foot, the perforated band, a shallow seam
  // groove, the body, and a rounded shoulder into a slightly dished top
  const foot = [[rAt(0) - 0.0035, 0], [rAt(0.0035), 0.0035], [rAt(BS.band[0]), BS.band[0]]];
  const band = [[rAt(BS.band[0]), BS.band[0]], [rAt(BS.band[1]), BS.band[1]]];
  const upper = [[rAt(BS.band[1]), BS.band[1]], [rAt(s - 0.0009) - 0.0011, s - 0.0009], [rAt(s + 0.0009) - 0.0011, s + 0.0009], [rAt(s + 0.0016), s + 0.0016]];
  for (let k = 0; k <= 10; k++) {
    const a = (k / 10) * Math.PI / 2;
    upper.push([rAt(H) - FILLET + FILLET * Math.cos(a), H - FILLET + FILLET * Math.sin(a)]);
  }
  upper.push([rOpen + 0.006, H - 0.0025], [rOpen, H - 0.003]);
  tag(new THREE.Mesh(lathe(foot, 160, t0, tl), mats.body), 'shell');
  const bandMesh = tag(new THREE.Mesh(lathe(band, 160, t0, tl), mats.band), 'grille');
  bandMesh.material = mats.band;
  mats.band.alphaMap.repeat.x = (BS.cols / 2) * (tl / (Math.PI * 2));
  tag(new THREE.Mesh(lathe(upper, 160, t0, tl), mats.body), 'shell');

  // a blank, round power button on the front of the base, where the air blows
  const button = new THREE.Mesh(lathe([[0, 0.0018], [0.0046, 0.0018], [0.0054, 0.0012], [0.0056, 0]], 40), mats.motor);
  button.rotation.x = Math.PI / 2;
  button.position.set(0, 0.165, rAt(0.165) - 0.0006);
  tag(button, 'shell');

  // the lining behind the skin, the floor of the chamber
  const lining = [[rOpen, H - 0.003 - WALL], [rAt(H) - FILLET, H - WALL], [rAt(H - FILLET) - WALL, H - FILLET], [rAt(WALL) - WALL, WALL]];
  tag(new THREE.Mesh(lathe(lining, 128, t0, tl), mats.lining), 'shell');
  tag(new THREE.Mesh(lathe([[0, WALL], [rAt(WALL) - WALL, WALL]], 96), mats.lining), 'shell');

  if (cut) {
    // the two cut faces: the wall's own section, foot to neck opening
    const sec = [[0, 0], ...foot, ...band.slice(1), ...upper.slice(1), ...lining, [0, WALL]];
    const shape = new THREE.Shape(sec.map(([r, y]) => new THREE.Vector2(r, y)));
    for (const th of [t0, t0 + tl]) {
      const geo = new THREE.ShapeGeometry(shape);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const r = p.getX(i), y = p.getY(i); p.setXYZ(i, r * Math.sin(th), y, r * Math.cos(th)); }
      geo.computeVertexNormals();
      tag(new THREE.Mesh(geo, mats.cap), 'shell');
    }
  }

  // chamber floor under the impeller and the bell mouth that feeds it
  const bellPts = [];
  for (let k = 0; k <= 14; k++) {
    const a = (Math.PI / 2) * (k / 14);
    bellPts.push([BS.throat + (BS.bellR - BS.throat) * (1 - Math.cos(a)), BS.chamberTop - 0.016 * Math.sin(a)]);
  }
  bellPts.push([BS.bellR + 0.004, BS.chamberTop - 0.018]);
  tag(new THREE.Mesh(lathe(bellPts, 128, t0, tl), mats.plastic), 'bell');
  // impeller casing: the fixed cone the blades run inside
  tag(new THREE.Mesh(lathe([[BS.caseR[0] - 0.001, BS.impY[0] - 0.002], [BS.caseR[0], BS.impY[0]], [BS.caseR[1], BS.impY[1]], [BS.caseR[1], BS.impY[1] + 0.004]], 128, t0, tl), mats.casing), 'casing');

  // the impeller: hub plus nine blades, the only moving part
  const imp = new THREE.Group();
  imp.userData.part = 'impeller';
  const hubPts = [[0, BS.impY[0] - 0.006]];
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; hubPts.push([BS.hubR[0] * Math.sin(a), BS.impY[0] - 0.006 * Math.cos(a)]); }
  for (let k = 1; k <= 10; k++) {
    const t = k / 10;
    hubPts.push([BS.hubR[0] + (BS.hubR[1] - BS.hubR[0]) * Math.pow(t, 0.8), BS.impY[0] + (BS.impY[1] - BS.impY[0]) * t]);
  }
  hubPts.push([BS.hubR[1], BS.impY[1] + 0.004], [0.006, BS.impY[1] + 0.004]);
  const hub = new THREE.Mesh(lathe(hubPts, 72), mats.alu); hub.userData.part = 'impeller'; imp.add(hub);
  const blade = impellerBlade();
  for (let k = 0; k < 9; k++) {
    const b = new THREE.Mesh(blade, mats.alu);
    b.rotation.y = (k / 9) * Math.PI * 2;
    b.userData.part = 'impeller';
    imp.add(b);
  }
  g.add(imp);

  // the motor bucket above the impeller, with a band of windings and a steel can
  tag(new THREE.Mesh(lathe([[0, BS.motorY[0]], [BS.motorR - 0.002, BS.motorY[0]], [BS.motorR, BS.motorY[0] + 0.002], [BS.motorR, BS.motorY[1]], [BS.motorR - 0.006, BS.motorY[1] + 0.006], [0, BS.motorY[1] + 0.006]], 72), mats.motor), 'motor');
  tag(new THREE.Mesh(lathe([[BS.motorR + 0.0008, BS.motorY[0] + 0.012], [BS.motorR + 0.0012, BS.motorY[0] + 0.014], [BS.motorR + 0.0012, BS.motorY[0] + 0.038], [BS.motorR + 0.0008, BS.motorY[0] + 0.04]], 72), mats.copper), 'motor');
  tag(new THREE.Mesh(lathe([[BS.motorR + 0.0006, BS.motorY[0] + 0.046], [BS.motorR + 0.0006, BS.motorY[1] - 0.006]], 72), mats.steel), 'motor');
  tag(new THREE.Mesh(lathe([[0, BS.impY[1]], [0.004, BS.impY[1]], [0.004, BS.motorY[0]], [0, BS.motorY[0]]], 24), mats.steel), 'motor');

  // stator vanes: fixed, curved so they meet the swirling air head on at the
  // bottom and hand it on straight up at the top
  const vaneGeo = statorVane();
  for (let k = 0; k < BS.vanes; k++) {
    const th = (k / BS.vanes) * Math.PI * 2;
    const deg = ((th / d2r) % 360 + 360) % 360;
    if (cut && deg > BS.gap[0] + 8 && deg < BS.gap[1] - 8) continue;
    const v = new THREE.Mesh(vaneGeo, mats.vane);
    v.rotation.y = th;
    tag(v, 'vanes');
  }
  // the annular duct wall round the vanes, and the neck up into the loop
  tag(new THREE.Mesh(lathe([[BS.caseR[1], BS.impY[1] + 0.004], [BS.neckR[0], BS.neckY[0]]], 128, t0, tl), mats.casing), 'casing');
  const neck = [];
  for (let k = 0; k <= 14; k++) {
    const t = k / 14, e = t * t * (3 - 2 * t);
    neck.push([BS.neckR[0] + (BS.neckR[1] - BS.neckR[0]) * e, BS.neckY[0] + (BS.neckY[1] - BS.neckY[0]) * t]);
  }
  neck.push([BS.neckR[1], BASE.h + 0.006]);
  tag(new THREE.Mesh(lathe(neck, 128, t0, tl), mats.casing), 'neck');
  return { group: g, impeller: imp };
}

/** One stator vane: a cambered sheet between the hub and the duct wall. Its
 *  lower edge leans into the swirl the impeller leaves; it straightens to
 *  vertical by the top, which is what takes the swirl out. */
function statorVane() {
  const ns = 16, nt = 4, pos = [], uv = [], idx = [];
  const [y0, y1] = BS.vaneY, [r0, r1] = BS.vaneR;
  for (let i = 0; i <= ns; i++) {
    const s = i / ns, y = y0 + (y1 - y0) * s;
    const arc = 0.026 * (1 - (1 - s) * (1 - s));     // circumferential offset, metres: with the swirl at the foot, axial at the top
    for (let j = 0; j <= nt; j++) {
      const t = j / nt, r = r0 + (r1 - r0) * t + 0.0008, a = arc / r;
      pos.push(r * Math.sin(a), y, r * Math.cos(a));
      uv.push(s, t);
    }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) {
    const a = i * (nt + 1) + j, b = a + nt + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** One mixed-flow blade: a twisted strip between hub and casing, rising and
 *  flaring as it wraps, so air leaves up and outward rather than purely out. */
function impellerBlade() {
  const ns = 24, nt = 6;
  const pos = [], uv = [], idx = [];
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
      uv.push(s, t);
    }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) {
    const a = i * (nt + 1) + j, b = a + nt + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
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
const fresh = new Uint8Array(N).fill(1);   // set when a parcel is (re)born, so its streak starts from nothing
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
  fresh[i] = 1;
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
    aux2[i] = BS.grilleY[0] + (Math.floor(Math.random() * BS.rows) / (BS.rows - 1)) * (BS.grilleY[1] - BS.grilleY[0]);   // the row of holes it enters
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

/* ------------------------------------------------------------ the key ---- */
/* A legend on the stage itself: the three colours, what each one is, and how
 * much of it crosses the measuring plane, so the picture can be read without
 * scrolling to the charts. */
const stageEl = canvas.parentElement;
const flowKey = document.createElement('div');
flowKey.className = 'flow-key';
flowKey.setAttribute('aria-hidden', 'true');
flowKey.innerHTML = `<p class="flow-key-h"><span class="l"></span><span class="s"></span></p>` + [['p', T.keyP, T.primary], ['i', T.keyI, T.indShort], ['e', T.keyE, T.entShort]]
  .map(([k, t, sh]) => `<p class="flow-key-row" data-k="${k}"><i></i><span class="l">${t}</span><span class="s">${sh}</span><b></b></p>`).join('') + '<p class="flow-key-sum"></p>';
stageEl.appendChild(flowKey);
const keyRows = [...flowKey.querySelectorAll('.flow-key-row')];
function writeKey() {
  const s = sol;
  flowKey.querySelector('.flow-key-h .l').textContent = T.keyHead(fmt(params.x, 2));
  flowKey.querySelector('.flow-key-h .s').textContent = `x = ${fmt(params.x, 2)} m`;
  const v = [s.Q0, s.induced, s.entrained];
  keyRows.forEach((r, k) => { r.querySelector('b').textContent = `${fmt(v[k] * 1000)} ${T.ls}`; r.classList.toggle('is-off', !kindsOn[k]); });
  flowKey.querySelector('.flow-key-sum').textContent = `= ${fmt(s.Q * 1000)} ${T.ls} · ${fmt(s.ratio, 1)}×`;
  flowKey.hidden = !params.flow;
}

/* ---------------------------------------------------------------- stage ---- */
refreshFlow();

const lab = await mountLab(canvas, {
  async setup({ renderer, scene, camera, lab }) {
    camera.fov = 32; camera.near = 0.004; camera.far = 40;
    camera.position.set(...TOUR[0].cam);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(...TOUR[0].tgt);
    controls.enableDamping = true;
    controls.minDistance = 0.06; controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.addEventListener('change', () => lab.invalidate());
    controls.addEventListener('start', () => { camAnim = null; });
    controls.update();

    // a real studio: HDRI light with soft-box strips, a soft contact shadow on
    // the floor, ambient occlusion in the base's crowded interior
    const look = await createStudio(lab, {
      // photoreal: the 2k studio and a 512 px reflection cube for the polished loop, and a macro lens
      // that the close-up tour stops turn on (focused on the orbit target)
      hdriRes: '2k', envSize: 512, controls, dof: { bokeh: 0.8 },
      scale: 0.7, center: [0, 0.32, 0], floorY: 0, hdri: 'studio', strips: 'product',
      exposure: 1.0, envIntensity: 1.0, keyIntensity: 1.3, keyDir: [-0.45, 1, -0.55], shadowOpacity: 0.2,
      aoRadius: 0.022, aoThickness: 0.008,
    });

    /* Finishes. The visible shell is satin metallic paint over a fine grain;
     * the perforated band is a darker version of the same; the interior is
     * moulded plastic; the impeller is light alloy. Generic choices, nothing
     * copied from a product's colourway. */
    const phys = (o, surf, rep, ns) => {
      const m = new THREE.MeshPhysicalMaterial(o);
      if (surf) { const t = surface(surf).clone(); t.repeat.set(rep, rep); t.needsUpdate = true; m.normalMap = t; m.normalScale = new THREE.Vector2(ns, ns); }
      return m;
    };
    const DS = THREE.DoubleSide;
    const mats = {
      loop: phys({ color: 0xc3c7cd, metalness: 0.8, roughness: 0.3, clearcoat: 0.45, clearcoatRoughness: 0.2, side: DS }, 'grain', 18, 0.05),
      face: phys({ color: 0xc9cdd2, metalness: 0.85, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.08, side: DS }),
      bore: phys({ color: 0x24262a, metalness: 0.1, roughness: 0.7, side: DS }),
      cap: phys({ color: 0xd8cfc4, metalness: 0, roughness: 0.88, side: DS }),
      body: phys({ color: 0xc3c7cd, metalness: 0.8, roughness: 0.3, clearcoat: 0.45, clearcoatRoughness: 0.2, side: DS }, 'grain', 10, 0.05),
      band: phys({ color: 0x50545b, metalness: 0.85, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.25, side: DS, alphaMap: perforation(), alphaTest: 0.5 }),
      lining: phys({ color: 0x1b1c1f, metalness: 0, roughness: 0.8, side: DS }),
      plastic: phys({ color: 0x3a3d43, metalness: 0, roughness: 0.42, clearcoat: 0.2, clearcoatRoughness: 0.35, side: DS }, 'grain', 6, 0.08),
      casing: phys({ color: 0x2e3035, metalness: 0, roughness: 0.48, clearcoat: 0.15, clearcoatRoughness: 0.4, side: DS }, 'grain', 6, 0.08),
      alu: phys({ color: 0xb4b9bf, metalness: 1, roughness: 0.32, side: DS }),
      motor: phys({ color: 0x1c1d20, metalness: 0.1, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
      copper: phys({ color: 0xc8804c, metalness: 1, roughness: 0.3 }),
      steel: phys({ color: 0xc4c7cb, metalness: 1, roughness: 0.2 }),
      vane: phys({ color: 0x4b4e55, metalness: 0, roughness: 0.46, side: DS }),
      sheet: new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.38, depthWrite: false, side: DS }),
    };

    let loop = null, base = null;
    const rebuild = () => {
      if (loop) { scene.remove(loop.group); loop.group.traverse((o) => o.geometry?.dispose()); }
      if (base) { scene.remove(base.group); base.group.traverse((o) => o.geometry?.dispose()); }
      loop = buildLoop(params.slotMm, params.diameterMm / 1000, params.cutaway, mats);
      base = buildBase(params.cutaway, mats);
      for (const root of [loop.group, base.group]) root.traverse((o) => { if (o.isMesh && o.userData.part !== 'sheet') o.castShadow = true; });
      scene.add(loop.group, base.group);
    };
    rebuild();

    /* ------------------------------------------------------------ streaks */
    // Each parcel is a ribbon through its last K positions, facing the camera,
    // tapering and fading toward the tail. The history is sampled at a fixed
    // interval of simulated time, so a streak's length is a speed.
    const K = 9, HN = K - 1;
    const hist = new Float32Array(N * HN * 3);
    let histHead = 0, histClock = 0;
    const VERTS = N * K * 2;
    const sPos = new Float32Array(VERTS * 3), sCol = new Float32Array(VERTS * 3), sAlpha = new Float32Array(VERTS);
    const sIdx = new Uint32Array(N * HN * 6);
    for (let i = 0, n = 0; i < N; i++) for (let j = 0; j < HN; j++) {
      const a = (i * K + j) * 2;
      sIdx[n++] = a; sIdx[n++] = a + 1; sIdx[n++] = a + 2; sIdx[n++] = a + 1; sIdx[n++] = a + 3; sIdx[n++] = a + 2;
    }
    const streakGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage);
    const alphaAttr = new THREE.BufferAttribute(sAlpha, 1).setUsage(THREE.DynamicDrawUsage);
    const colAttr = new THREE.BufferAttribute(sCol, 3);
    streakGeo.setAttribute('position', posAttr);
    streakGeo.setAttribute('color', colAttr);
    streakGeo.setAttribute('alpha', alphaAttr);
    streakGeo.setIndex(new THREE.BufferAttribute(sIdx, 1));
    const streakMat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide });
    streakMat.colorNode = attribute('color', 'vec3');
    streakMat.opacityNode = attribute('alpha', 'float');
    const streaks = new THREE.Mesh(streakGeo, streakMat);
    streaks.frustumCulled = false;
    streaks.renderOrder = 2;
    scene.add(streaks);

    // the measurement plane at x
    const probeMat = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
    const probe = new THREE.Mesh(new THREE.RingGeometry(0, 1, 96), probeMat);
    const probeEdgeMat = new THREE.LineBasicNodeMaterial({ transparent: true, opacity: 0.85 });
    const probeEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 97 }, (_, k) => new THREE.Vector3(Math.cos((k / 96) * Math.PI * 2), Math.sin((k / 96) * Math.PI * 2), 0))), probeEdgeMat);
    scene.add(probe, probeEdge);

    // a ruler on the floor under the jet, a tick every half metre from the trailing edge
    const rulerMat = new THREE.LineBasicNodeMaterial({ transparent: true, opacity: 0.7 });
    const rp = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 3)];
    for (let k = 0; k <= 6; k++) { const L = k % 2 ? 0.018 : 0.04; rp.push(new THREE.Vector3(-L, 0, k / 2), new THREE.Vector3(L, 0, k / 2)); }
    const ruler = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rp), rulerMat);
    ruler.position.y = 0.0008;
    scene.add(ruler);

    const placeProbe = () => {
      const xi = params.x;
      const outer = rc(xi) + wj(xi), inner = Math.max(0, rc(xi) - wj(xi));
      probe.geometry.dispose();
      probe.geometry = new THREE.RingGeometry(inner, outer, 96);
      probe.position.set(0, G.y0, G.zTE + xi);
      probeEdge.position.copy(probe.position);
      probeEdge.scale.setScalar(outer);
      ruler.position.z = G.zTE;
    };
    placeProbe();

    // colours from the page
    const colours = { k: [] };
    let dark = isDark();
    const applyTheme = () => {
      dark = isDark();
      const c = readColors(['--flow-primary', '--flow-induced', '--flow-entrained', '--ink', '--rule-firm', '--accent', '--paper']);
      colours.k = [c['flow-primary'], c['flow-induced'], c['flow-entrained']];
      for (let i = 0; i < N; i++) {
        const col = colours.k[kind[i]];
        for (let v = 0; v < K * 2; v++) { const o = ((i * K) * 2 + v) * 3; sCol[o] = col.r; sCol[o + 1] = col.g; sCol[o + 2] = col.b; }
      }
      colAttr.needsUpdate = true;
      // on a dark page the streaks add light, like smoke in a beam; on paper they lay ink
      streakMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      streakMat.needsUpdate = true;
      rulerMat.color.copy(c['rule-firm']);
      probeMat.color.copy(c.accent); probeEdgeMat.color.copy(c.accent);
      mats.cap.color.copy(c.accent).lerp(new THREE.Color(dark ? 0x8a8178 : 0xe4dbd0), 0.72);
      mats.sheet.color.copy(c['flow-primary']);
      ghost.color.copy(c.ink);
      lab.invalidate();
    };

    /* The tour: a camera position, a set of parts left solid, and which
     * particles are drawn. Everything else goes to a ghost material. */
    const ghost = new THREE.MeshBasicNodeMaterial({ transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
    const xray = new THREE.MeshPhysicalMaterial({ color: 0xc3c7cd, metalness: 0.5, roughness: 0.3, clearcoat: 0.5, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide });
    applyTheme();
    const stopTheme = onThemeChange(applyTheme);

    // particles: warm the flow up so the first frame is already developed
    for (let i = 0; i < N; i++) spawn(i, true);
    const warm = (seconds) => { for (let t = 0; t < seconds; t += 1 / 30) for (let i = 0; i < N; i++) stepParticle(i, 1 / 30); };
    warm(6);

    const _p = new THREE.Vector3();
    /** Current positions into px; a parcel that was just born or jumped gets a history of itself. */
    function sampleNow() {
      for (let i = 0; i < N; i++) {
        worldPos(i, _p);
        const o = i * 3;
        px[o] = _p.x; px[o + 1] = _p.y; px[o + 2] = _p.z;
        const h = (i * HN + histHead) * 3;
        const jump = Math.abs(hist[h] - _p.x) + Math.abs(hist[h + 1] - _p.y) + Math.abs(hist[h + 2] - _p.z) > 0.09;
        if (fresh[i] || jump) {
          for (let k = 0; k < HN; k++) { const q = (i * HN + k) * 3; hist[q] = _p.x; hist[q + 1] = _p.y; hist[q + 2] = _p.z; }
          fresh[i] = 0;
        }
      }
    }
    function pushHistory() {
      histHead = (histHead + 1) % HN;
      for (let i = 0; i < N; i++) { const o = i * 3, h = (i * HN + histHead) * 3; hist[h] = px[o]; hist[h + 1] = px[o + 1]; hist[h + 2] = px[o + 2]; }
    }
    // build the first streaks from real motion rather than from nothing
    {
      const dt = (TOUR[+params.tour].trail ?? 0.24) / HN;
      sampleNow();
      for (let k = 0; k < HN; k++) { for (let i = 0; i < N; i++) stepParticle(i, dt); sampleNow(); pushHistory(); }
    }

    const pts = new Float32Array(K * 3);
    const tn = new THREE.Vector3(), vw = new THREE.Vector3(), sd = new THREE.Vector3();
    function writeStreaks() {
      const stop = TOUR[+params.tour];
      const cp = camera.position;
      const wStop = stop.width ?? 1;
      const aK = dark ? [0.62, 0.5, 0.5] : [0.92, 0.78, 0.78];
      for (let i = 0; i < N; i++) {
        const o = i * 3, vb = i * K * 2;
        // fade in at birth and out at the far end
        let f = Math.min(1, age[i] / 0.5);
        if (phase[i] === PH.JET) f *= 1 - smooth(lim[i] - Math.min(0.5, lim[i] * 0.4), lim[i], zz[i]);
        if (!params.flow || !kindsOn[kind[i]]) f = 0;
        const inBase = phase[i] <= PH.SLOT;
        if (stop.phases && !stop.phases.includes(phase[i])) f = 0;
        if (stop.near && phase[i] === PH.JET && zz[i] > stop.near) f = 0;
        if (f < 0.01) {
          for (let v = 0; v < K * 2; v++) { const q = (vb + v) * 3; sPos[q] = px[o]; sPos[q + 1] = px[o + 1]; sPos[q + 2] = px[o + 2]; sAlpha[vb + v] = 0; }
          continue;
        }
        pts[0] = px[o]; pts[1] = px[o + 1]; pts[2] = px[o + 2];
        for (let j = 1; j < K; j++) { const h = (i * HN + ((histHead - (j - 1) + HN) % HN)) * 3; pts[j * 3] = hist[h]; pts[j * 3 + 1] = hist[h + 1]; pts[j * 3 + 2] = hist[h + 2]; }
        const w = (inBase ? 0.0032 : kind[i] === KIND.PRIMARY ? 0.0044 : 0.0034) * wStop * (stop.xray && !inBase ? 0.6 : 1) * (0.35 + 0.65 * f);
        const a0 = aK[kind[i]] * f;
        tn.set(0, 0, 1);
        for (let j = 0; j < K; j++) {
          const j0 = Math.max(0, j - 1), j1 = Math.min(K - 1, j + 1);
          const tx = pts[j0 * 3] - pts[j1 * 3], ty = pts[j0 * 3 + 1] - pts[j1 * 3 + 1], tz = pts[j0 * 3 + 2] - pts[j1 * 3 + 2];
          if (tx * tx + ty * ty + tz * tz > 1e-12) tn.set(tx, ty, tz);
          vw.set(pts[j * 3] - cp.x, pts[j * 3 + 1] - cp.y, pts[j * 3 + 2] - cp.z);
          sd.crossVectors(tn, vw);
          const l = sd.length();
          const u = j / (K - 1);
          const half = l > 1e-12 ? (w * (1 - 0.8 * u)) / (2 * l) : 0;
          const q = (vb + j * 2) * 3;
          sPos[q] = pts[j * 3] + sd.x * half; sPos[q + 1] = pts[j * 3 + 1] + sd.y * half; sPos[q + 2] = pts[j * 3 + 2] + sd.z * half;
          sPos[q + 3] = pts[j * 3] - sd.x * half; sPos[q + 4] = pts[j * 3 + 1] - sd.y * half; sPos[q + 5] = pts[j * 3 + 2] - sd.z * half;
          const a = a0 * Math.pow(1 - u, 1.35);
          sAlpha[vb + j * 2] = a; sAlpha[vb + j * 2 + 1] = a;
        }
      }
      posAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    }
    writeStreaks();

    /* ------------------------------------------------------------ labels */
    /* Callouts sit beside the part with a hairline leader and a dot on the
     * part itself, and are pushed apart so they never overlap one another or
     * the key. Chips (the two entrained streams, the probe) sit on the flow. */
    const SVGNS_ = 'http://www.w3.org/2000/svg';
    const leaders = document.createElementNS(SVGNS_, 'svg');
    leaders.setAttribute('class', 'lab-leaders');
    labelLayer.appendChild(leaders);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const LABELS = {
      intake: { t: T.intake, at: () => {
        // on the skirt where it faces the camera, or beside the cut if the camera looks into it
        let a = Math.atan2(camera.position.x, camera.position.z - BASE.z) / d2r;
        a = ((a % 360) + 360) % 360;
        if (params.cutaway && a > BS.gap[0] - 12 && a < BS.gap[1] + 12) a = a - BS.gap[0] < BS.gap[1] - a ? BS.gap[0] - 12 : BS.gap[1] + 12;
        a += 14;
        return V(rAt(0.07) * Math.sin(a * d2r), 0.07, BASE.z + rAt(0.07) * Math.cos(a * d2r));
      }, side: -1 },
      bell: { t: T.bell, at: () => V(0.01, BS.chamberTop - 0.014, BASE.z - BS.bellR + 0.006), side: 1, cut: true },
      impeller: { t: T.impeller, at: () => V(-0.01, 0.1, BASE.z + 0.036), side: -1, cut: true },
      motor: { t: T.motor, at: () => V(0.008, 0.168, BASE.z - BS.motorR + 0.004), side: 1, cut: true },
      vanes: { t: T.vanes, at: () => V(-0.012, 0.157, BASE.z + 0.046), side: -1, cut: true },
      neck: { t: T.neck, at: () => V(0.006, 0.238, BASE.z - 0.034), side: 1, cut: true },
      slot: { t: T.slot, at: () => ringPoint(V(), LOOP_FACE, G.R + (G.P.S1[1] + G.P.S2[1]) / 2, Z_NOSE + (G.P.S1[0] + G.P.S2[0]) / 2, G.y0), side: -1, cut: true },
      diffuser: { t: T.diffuser, at: () => ringPoint(V(), LOOP_FACE, G.R + (G.P.E[1] + G.P.TE[1]) / 2 - 0.001, Z_NOSE + (G.P.E[0] + G.P.TE[0]) / 2, G.y0), side: 1, cut: true },
      coanda: { t: T.coanda, at: () => ringPoint(V(), 100 * d2r, G.R + G.P.vMin, Z_NOSE + G.P.C[0], G.y0), side: 1 },
      plenum: { t: T.plenum, at: () => ringPoint(V(), LOOP_FACE, G.rPlenum, G.zPlenum, G.y0), side: -1, cut: true },
      induced: { t: T.induced, at: () => V(0, G.y0 - 0.07, Z_NOSE - 0.28), chip: 1 },
      entrained: { t: T.entrained, at: () => V(-(G.R + 0.26), G.y0 + 0.28, G.zTE + 0.95), chip: 2 },
      probe: { t: '', at: () => V(0, G.y0 + rc(params.x) + wj(params.x), G.zTE + params.x), probe: true },
      tick1: { t: '1 ' + T.metre, at: () => V(0, 0, G.zTE + 1), tick: true, group: 'ruler' },
      tick2: { t: '2 ' + T.metre, at: () => V(0, 0, G.zTE + 2), tick: true, group: 'ruler' },
      tick3: { t: '3 ' + T.metre, at: () => V(0, 0, G.zTE + 3), tick: true, group: 'ruler' },
    };
    const labels = Object.entries(LABELS).map(([id, L]) => {
      const e = document.createElement('div');
      e.className = 'lab-label' + (L.chip ? ' is-chip' : '') + (L.probe ? ' is-probe' : '') + (L.tick ? ' is-tick' : '');
      if (L.chip) e.dataset.kind = L.chip;
      e.textContent = L.t;
      labelLayer.appendChild(e);
      const line = L.chip || L.probe || L.tick ? null : document.createElementNS(SVGNS_, 'line');
      const dot = line ? document.createElementNS(SVGNS_, 'circle') : null;
      if (line) { dot.setAttribute('r', '2.6'); leaders.append(line, dot); }
      return { id, ...L, e, line, dot, size: null };
    });
    const pv = new THREE.Vector3();
    const boxes = [];
    function placeLabels() {
      labelLayer.classList.toggle('is-hidden', !params.labels);
      if (!params.labels) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const narrow = w < 560;
      flowKey.classList.toggle('is-compact', w < 520);
      leaders.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const stop = TOUR[+params.tour];
      const want = new Set(stop.labels || []);
      const sr = stageEl.getBoundingClientRect();
      const kr = flowKey.hidden ? null : flowKey.getBoundingClientRect();
      const keyBox = kr ? { x0: kr.left - sr.left - 6, y0: kr.top - sr.top - 6, x1: kr.right - sr.left + 6, y1: kr.bottom - sr.top + 6 } : null;
      const callouts = { '-1': [], '1': [] };
      const chips = [];
      for (const L of labels) {
        let show = want.has(L.id) || (L.group && want.has(L.group));
        if (L.cut && !params.cutaway) show = false;
        if ((L.chip || L.probe) && !params.flow) show = false;
        if (L.probe) L.e.textContent = `x = ${fmt(params.x, 2)} m · ${fmt(sol.ratio, 1)}×`;
        if (show) { pv.copy(L.at()).project(camera); if (pv.z > 1 || Math.abs(pv.x) > 1.08 || Math.abs(pv.y) > 1.08) show = false; }
        L.e.style.opacity = show ? 1 : 0;
        if (L.line) { L.line.style.opacity = L.dot.style.opacity = show ? 1 : 0; }
        if (!show) continue;
        if (!L.size || L.probe) L.size = [L.e.offsetWidth, L.e.offsetHeight];
        const ax = (pv.x * 0.5 + 0.5) * w, ay = (-pv.y * 0.5 + 0.5) * h;
        if (L.chip || L.probe || L.tick) {
          const half = L.size[0] / 2 + 6;
          const x = Math.min(w - half, Math.max(half, ax));
          let y = Math.min(h - L.size[1], Math.max(L.size[1], ay + (L.tick ? 14 : 0)));
          // chips that would sit on one another step down instead
          for (const c of chips) if (Math.abs(c.x - x) < (c.w + L.size[0]) / 2 + 4 && Math.abs(c.y - y) < (c.h + L.size[1]) / 2 + 3) y = c.y + (c.h + L.size[1]) / 2 + 4;
          chips.push({ x, y, w: L.size[0], h: L.size[1] });
          L.e.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
          continue;
        }
        callouts[L.side < 0 ? '-1' : '1'].push({ L, ax, ay, y: ay });
      }
      // stack each side's callouts top to bottom without overlap, clear of the key
      const gap = narrow ? 26 : 44, pad = 4;
      boxes.length = 0;
      for (const side of [-1, 1]) {
        const col = callouts[side].sort((a, b) => a.ay - b.ay);
        for (let k = 0; k < col.length; k++) {
          const c = col[k], [bw, bh] = c.L.size;
          c.bw = bw; c.bh = bh;
          c.x = side < 0 ? Math.max(6, c.ax - gap - bw) : Math.min(w - 6 - bw, c.ax + gap);
          c.y = Math.max(bh / 2 + 4, c.ay);
          if (k) c.y = Math.max(c.y, col[k - 1].y + (col[k - 1].bh + bh) / 2 + pad);
          if (keyBox && c.x < keyBox.x1 && c.x + bw > keyBox.x0 && c.y + bh / 2 > keyBox.y0 && c.y - bh / 2 < keyBox.y1) c.y = keyBox.y1 + bh / 2;
        }
        // if the stack ran off the bottom, pull it back up
        for (let k = col.length - 1; k >= 0; k--) {
          const lim = k === col.length - 1 ? h - col[k].bh / 2 - 32 : col[k + 1].y - (col[k + 1].bh + col[k].bh) / 2 - pad;
          if (col[k].y > lim) col[k].y = lim;
        }
        for (const c of col) {
          c.L.e.style.transform = `translate(${c.x.toFixed(1)}px, ${(c.y - c.bh / 2).toFixed(1)}px)`;
          const ex = side < 0 ? c.x + c.bw : c.x;
          c.L.line.setAttribute('x1', c.ax.toFixed(1)); c.L.line.setAttribute('y1', c.ay.toFixed(1));
          c.L.line.setAttribute('x2', ex.toFixed(1)); c.L.line.setAttribute('y2', c.y.toFixed(1));
          c.L.dot.setAttribute('cx', c.ax.toFixed(1)); c.L.dot.setAttribute('cy', c.ay.toFixed(1));
        }
      }
    }

    function setFocus(stop) {
      const focus = stop.focus;
      for (const root of [loop.group, base.group]) root.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.userData.mat) o.userData.mat = o.material;
        const part = o.userData.part || 'loop';
        if (part === 'sheet') { o.visible = !!stop.sheet; return; }
        const solid = !focus || focus.includes(part);
        o.material = solid ? (stop.xray && part === 'loop' ? xray : o.userData.mat) : ghost;
        o.castShadow = solid && !stop.xray;
      });
      const showJet = !focus || !!stop.jet;
      kindsOn[0] = 1; kindsOn[1] = showJet ? 1 : 0; kindsOn[2] = showJet ? 1 : 0;
      probe.visible = probeEdge.visible = showJet;
      ruler.visible = !focus;
      if (look.floor) look.floor.visible = !focus;
      writeKey();
    }
    let camAnim = null;
    function goTo(stop, instant) {
      const vec = (v) => typeof v === 'function' ? v() : new THREE.Vector3(...v);
      const to = { p: vec(stop.cam), t: vec(stop.tgt) };
      // a narrow stage (4:3, phones) sees less sideways: stand back, and on the
      // whole-flow stops lean the frame toward the fan so it is not cut off
      if (canvas.clientWidth < 700) {
        if (stop.jet) to.t.z *= 0.72;
        to.p.sub(to.t).multiplyScalar(stop.jet ? 1.32 : 1.18).add(to.t);
      }
      if (instant || lab.reducedMotion) {
        camera.position.copy(to.p); controls.target.copy(to.t); controls.update(); camAnim = null;
      } else {
        camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: to.p, t1: to.t, start: performance.now(), dur: 1400 };
      }
      setFocus(stop);
      // close-ups get a shallow depth of field; the whole-flow views stay sharp end to end
      look.stage({ macro: !!stop.focus, radius: to.p.distanceTo(to.t) * 0.45, ms: instant ? 0 : 1400 });
      const cap = document.getElementById('tour-caption');
      if (cap) cap.textContent = stop.text;
      lab.invalidate();
    }
    goTo(TOUR[+params.tour], true);

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
        if (running) {
          // close-ups want streaks shorter than a frame of travel, so the
          // flow is sub-stepped until each streak sample is its own moment
          const interval = (TOUR[+params.tour].trail ?? 0.24) / HN;
          const nSub = Math.min(4, Math.max(1, Math.ceil(dt / interval)));
          const h = dt / nSub;
          for (let s = 0; s < nSub; s++) {
            for (let i = 0; i < N; i++) stepParticle(i, h);
            histClock += h;
            if (histClock >= interval) { histClock = Math.min(histClock - interval, interval); sampleNow(); pushHistory(); }
          }
          base.impeller.rotation.y -= 2.6 * params.speed * dt;
        }
        sampleNow();
        writeStreaks();
        placeLabels();
      },
      render: look.render,
      rebuildGeometry() { dirty = true; lab.invalidate(); },
      goTo(i) { goTo(TOUR[i]); },
      kindsOn,
      reprobe() { placeProbe(); lab.invalidate(); },
      dispose() { controls.dispose(); stopTheme(); look.dispose(); },
    };
  },
});

function onParams(p, name) {
  refreshFlow();
  drawChartX(); drawChartB(); writeReadout(); writeKey();
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
drawChartX(); drawChartB(); writeReadout(); writeKey();
