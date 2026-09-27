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
} : {
  intake: 'intake', impeller: 'mixed-flow impeller', slot: 'slot', coanda: 'Coanda surface', plenum: 'plenum',
  induced: 'induced through the loop', entrained: 'entrained from around it',
  slotSpeed: 'slot speed', re: 'slot Reynolds number', dp: 'slot pressure', q0: 'motor air',
  qx: 'air moving at x', mult: 'multiplication', through: 'speed through the loop', xs: 'becomes a round jet at', power: 'jet power',
  ls: 'l/s', dist: 'distance x (m)', flow: 'flow (l/s)', slotW: 'slot width (mm)', ratioAx: 'ratio',
  primary: 'motor', indShort: 'through the loop', entShort: 'from around it', patent: 'patent',
  delivered: 'air at x', ratioLine: 'ratio', best: 'matched', now: 'now',
  annular: 'annular sheet', round: 'round jet',
};

const params = { ...M.DEFAULTS, speed: 1, cutaway: true, labels: true, flow: true };
let sol = M.solve(params);

/* ----------------------------------------------------------- geometry ---- */
const Z_NOSE = -0.03;                 // axial position of the loop's nose
const BASE = { r: 0.064, h: 0.27, z: 0.015 };
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
  g.position.y = loopCentreY(D);
  return { group: g, profile: P };
}

function buildBase(cut, mats) {
  const g = new THREE.Group();
  g.position.z = BASE.z;
  const t0 = cut ? (315) * d2r : 0, tl = cut ? (360 - 90) * d2r : Math.PI * 2;
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(BASE.r, BASE.r * 1.06, BASE.h, 128, 1, true, t0, tl), mats.shell);
  shell.position.y = BASE.h / 2;
  g.add(shell);
  const lining = new THREE.Mesh(new THREE.CylinderGeometry(BASE.r - 0.003, BASE.r * 1.06 - 0.003, BASE.h, 96, 1, true, t0, tl), mats.dark);
  lining.position.y = BASE.h / 2;
  g.add(lining);
  const top = new THREE.Mesh(new THREE.CircleGeometry(BASE.r, 96, t0 + Math.PI / 2, tl), mats.shell);
  top.rotation.x = -Math.PI / 2; top.position.y = BASE.h;
  g.add(top);
  const foot = new THREE.Mesh(new THREE.CircleGeometry(BASE.r * 1.06, 96), mats.dark);
  foot.rotation.x = -Math.PI / 2; foot.position.y = 0.001;
  g.add(foot);
  if (cut) {
    // the two cut faces of the wall
    for (const th of [t0, t0 + tl]) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.004, BASE.h), mats.cap);
      f.position.set((BASE.r - 0.0015) * Math.sin(th), BASE.h / 2, (BASE.r - 0.0015) * Math.cos(th));
      f.rotation.y = th + Math.PI / 2;
      g.add(f);
    }
  }
  // the grille: rows of small holes round the lower barrel
  const rows = 7, cols = 44;
  const hole = new THREE.CylinderGeometry(0.0026, 0.0026, 0.0012, 12);
  hole.rotateZ(Math.PI / 2);
  const holes = new THREE.InstancedMesh(hole, mats.hole, rows * cols);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const th = ((j + (i % 2) * 0.5) / cols) * Math.PI * 2;
    const deg = ((th / d2r) % 360 + 360) % 360;
    if (cut && deg > 225 && deg < 315) continue;
    const y = 0.045 + i * 0.0125;
    const rr = BASE.r * (1.06 - 0.06 * (y / BASE.h)) + 0.0002;
    p.set(rr * Math.sin(th), y, rr * Math.cos(th));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), th - Math.PI / 2);
    holes.setMatrixAt(n++, m.compose(p, q, s));
  }
  holes.count = n;
  g.add(holes);
  // motor and impeller
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 48), mats.dark);
  motor.position.y = 0.05;
  g.add(motor);
  const imp = new THREE.Group();
  imp.position.y = 0.09;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.012, 0.075, 48), mats.metal);
  hub.position.y = 0.0375;
  imp.add(hub);
  const blade = impellerBlade();
  for (let k = 0; k < 9; k++) {
    const b = new THREE.Mesh(blade, mats.blade);
    b.rotation.y = (k / 9) * Math.PI * 2;
    imp.add(b);
  }
  g.add(imp);
  // stator vanes and the duct up into the loop
  const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.1, 48, 1, true), mats.dark);
  duct.position.y = 0.215;
  g.add(duct);
  return { group: g, impeller: imp };
}

/** One mixed-flow blade: a twisted strip between hub and shroud, rising and
 *  flaring as it wraps, so air leaves up and outward rather than purely out. */
function impellerBlade() {
  const ns = 18, nt = 5;
  const pos = [], idx = [];
  for (let i = 0; i <= ns; i++) {
    const s = i / ns;
    const y = 0.075 * s;
    const rh = 0.012 + 0.014 * s, rs = 0.03 + 0.016 * s;
    const th0 = 1.1 * Math.pow(s, 1.25);
    for (let j = 0; j <= nt; j++) {
      const t = j / nt;
      const r = rh + (rs - rh) * t, th = th0 + 0.25 * t;
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
const COUNTS = [1500, 1400, 1700];
const N = COUNTS[0] + COUNTS[1] + COUNTS[2];
const PH = { INTAKE: 0, BASE: 1, LOOP: 2, SLOT: 3, JET: 4, BEHIND: 5, SIDE: 6 };
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

function spawn(i, anywhere) {
  const k = kind[i];
  age[i] = 0;
  psi[i] = Math.random() * Math.PI * 2;
  if (k === KIND.PRIMARY && Math.random() < 0.72) {
    // most parcels are picked up in the plenum, so the sheet at the slot is
    // dense; the rest make the whole trip from the grille, through the impeller
    phase[i] = PH.SLOT; aux[i] = Math.random() * 0.4 * (G.pathLen || 0.1);
    lim[i] = 0.3 + Math.random() * 1.1;
    if (anywhere) { phase[i] = PH.JET; zz[i] = Math.random() * lim[i]; lane[i] = Math.max(-0.9, Math.min(0.9, gauss() * 0.22)); aux2[i] = lane[i]; }
  } else if (k === KIND.PRIMARY) {
    lim[i] = XI_MAX;
    phase[i] = PH.INTAKE;
    aux[i] = Math.random() * Math.PI * 2;        // angle round the base
    aux2[i] = 0.045 + Math.random() * 0.08;      // height of the hole it enters
    rr[i] = 0.11 + Math.random() * 0.05;
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
    case PH.INTAKE: {        // drawn in through the grille
      rr[i] -= vis(2.5 * params.speed) * dt;
      if (rr[i] <= BASE.r * 0.7) { phase[i] = PH.BASE; rr[i] = 0.036; }
      break;
    }
    case PH.BASE: {          // up through the impeller, swirling
      aux2[i] += vis(6 * params.speed) * dt;
      aux[i] += 3 * params.speed * dt;
      if (aux2[i] >= BASE.h + 0.01) {
        phase[i] = PH.LOOP;
        aux[i] = -Math.PI / 2;                     // enters the loop at the bottom
        aux2[i] = (Math.random() < 0.5 ? -1 : 1);  // goes round one way or the other
        // pick a destination on that side
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
  if (k === KIND.PRIMARY && phase[i] !== PH.JET && age[i] > 20) spawn(i, false);
}

const _v = new THREE.Vector3();
function worldPos(i, out) {
  switch (phase[i]) {
    case PH.INTAKE: return out.set(rr[i] * Math.sin(aux[i]), aux2[i], BASE.z + rr[i] * Math.cos(aux[i]));
    case PH.BASE: return out.set(rr[i] * Math.sin(aux[i]), Math.min(aux2[i], BASE.h + 0.01), BASE.z + rr[i] * Math.cos(aux[i]));
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
    camera.fov = 34; camera.near = 0.02; camera.far = 40;
    camera.position.set(-1.42, 0.84, -0.5);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.37, 0.52);
    controls.enableDamping = true;
    controls.minDistance = 0.35; controls.maxDistance = 5;
    controls.maxPolarAngle = Math.PI * 0.53;
    controls.addEventListener('change', () => lab.invalidate());
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
      metal: new THREE.MeshStandardNodeMaterial({ color: 0x8d9097, metalness: 0.8, roughness: 0.35 }),
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
      mats.cap.color.copy(c.accent).lerp(new THREE.Color(0xd8c8b8), 0.35);
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
        if (!params.flow) f = 0;
        const len = Math.min(0.06, Math.max(0.006, speed * 0.09));
        if (dir.lengthSq() > 0.5) q.setFromUnitVectors(Zup, dir); else q.identity();
        mid.copy(_v);
        const th = kind[i] === KIND.PRIMARY ? 0.0034 : 0.0024;
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
      { t: T.intake, at: () => new THREE.Vector3(BASE.r * 1.07 * Math.sin(212 * d2r), 0.09, BASE.z + BASE.r * 1.07 * Math.cos(212 * d2r)), side: -1 },
      { t: T.impeller, at: () => new THREE.Vector3(-0.03, 0.14, BASE.z), side: -1, cut: true },
      { t: T.slot, at: () => ringPoint(new THREE.Vector3(), 172 * d2r, G.R + G.P.S2[1], Z_NOSE + G.P.S2[0], G.y0), side: -1, cut: true },
      { t: T.coanda, at: () => ringPoint(new THREE.Vector3(), 100 * d2r, G.R + G.P.vMin, Z_NOSE + G.P.C[0], G.y0), side: 1, cut: true },
      { t: T.plenum, at: () => ringPoint(new THREE.Vector3(), 136 * d2r, G.rPlenum, G.zPlenum, G.y0), side: -1, cut: true },
      { t: T.induced, at: () => new THREE.Vector3(0, G.y0 - 0.02, Z_NOSE - 0.42), side: 1, chip: true },
      { t: T.entrained, at: () => new THREE.Vector3(-(G.R + 0.32), G.y0 + 0.12, G.zTE + 0.5), side: -1, chip: true },
      { t: '', at: () => new THREE.Vector3(0, G.y0 + rc(params.x) + wj(params.x), G.zTE + params.x), side: 1, probe: true },
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
        const hide = (L.cut && !params.cutaway) || (narrow && !L.chip && !L.probe && L.t !== T.slot && L.t !== T.coanda);
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

    let dirty = true;
    return {
      update(dt) {
        controls.update();
        if (dirty) { rebuild(); placeProbe(); dirty = false; }
        const running = !lab.reducedMotion && params.speed > 0;
        if (running) for (let i = 0; i < N; i++) stepParticle(i, dt);
        if (running) base.impeller.rotation.y -= 2.6 * params.speed * dt;
        writeStreaks(running ? dt : 0);
        placeLabels();
      },
      rebuildGeometry() { dirty = true; lab.invalidate(); },
      reprobe() { placeProbe(); lab.invalidate(); },
      dispose() { controls.dispose(); stopTheme(); },
    };
  },
});

function onParams(p, name) {
  refreshFlow();
  drawChartX(); drawChartB(); writeReadout();
  if (!lab) return;
  if (name === 'slotMm' || name === 'diameterMm' || name === 'cutaway') lab.hooks.rebuildGeometry();
  else lab.hooks.reprobe?.();
  lab.setOnDemand(lab.reducedMotion || p.speed === 0);
  lab.invalidate();
}

bindControls(panel, params, onParams);
drawChartX(); drawChartB(); writeReadout();
