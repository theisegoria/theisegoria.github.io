'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const RAD = Math.PI / 180;

  /* ---------- model (pure, checked by checks/continuum-mechanics.cjs); SI units ---------- */
  // 1. kinematics of a homogeneous deformation x = F X, with F = [[a, b], [c, d]]
  function eigSym(a, b, d) { const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b), th = 0.5 * Math.atan2(2 * b, a - d); return { l1: m + r, l2: m - r, th, m, r }; }
  const mul = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
  const tr = (A) => [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
  const det = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const rotM = (t) => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
  // polar decomposition F = R U, U = sqrt(FᵀF) symmetric positive definite
  function polar(F) {
    const C = mul(tr(F), F), e = eigSym(C[0][0], C[0][1], C[1][1]), s1 = Math.sqrt(Math.max(e.l1, 0)), s2 = Math.sqrt(Math.max(e.l2, 0));
    const n1 = [Math.cos(e.th), Math.sin(e.th)], n2 = [-Math.sin(e.th), Math.cos(e.th)];
    const U = [[s1 * n1[0] ** 2 + s2 * n2[0] ** 2, s1 * n1[0] * n1[1] + s2 * n2[0] * n2[1]], [s1 * n1[0] * n1[1] + s2 * n2[0] * n2[1], s1 * n1[1] ** 2 + s2 * n2[1] ** 2]];
    const dU = det(U), Ui = [[U[1][1] / dU, -U[0][1] / dU], [-U[1][0] / dU, U[0][0] / dU]], R = mul(F, Ui);
    return { U, R, lam: [s1, s2], n1, n2, angle: Math.atan2(R[1][0], R[0][0]) };
  }
  const green = (F) => { const C = mul(tr(F), F); return [[(C[0][0] - 1) / 2, C[0][1] / 2], [C[1][0] / 2, (C[1][1] - 1) / 2]]; };
  const smallStrain = (F) => [[F[0][0] - 1, (F[0][1] + F[1][0]) / 2], [(F[0][1] + F[1][0]) / 2, F[1][1] - 1]];
  const mohr = (E) => { const e = eigSym(E[0][0], E[0][1], E[1][1]); return { c: e.m, r: e.r, p1: e.l1, p2: e.l2 }; };

  // 2. Euler–Bernoulli beam, EI w'''' = −q, point load P (downward) at a, uniform load q (downward); w upward
  const SUPS = ['cantilever', 'simple', 'fixed'];
  function beam(sup, P, a, q, EI, Lb) {
    const H = (x) => (x >= a ? 1 : 0), pp = (x) => Math.max(0, x - a);
    const wp = [(x) => (-q * x ** 4) / 24 - (P * pp(x) ** 3) / 6, (x) => (-q * x ** 3) / 6 - (P * pp(x) ** 2) / 2, (x) => (-q * x * x) / 2 - P * pp(x), (x) => -q * x - P * H(x)].map((g) => (x) => g(x) / EI);
    let c0 = 0, c1 = 0, c2 = 0, c3 = 0;
    if (sup === 'cantilever') { c3 = -wp[3](Lb); c2 = -c3 * Lb - wp[2](Lb); }
    else if (sup === 'simple') { c3 = -wp[2](Lb) / Lb; c1 = -(c3 * Lb ** 3 / 6 + wp[0](Lb)) / Lb; }
    else { // fixed–fixed: solve [L²/2 L³/6; L L²/2][c2 c3] = −[wp(L) wp'(L)]
      const a11 = Lb * Lb / 2, a12 = Lb ** 3 / 6, a21 = Lb, a22 = Lb * Lb / 2, b1 = -wp[0](Lb), b2 = -wp[1](Lb), dd = a11 * a22 - a12 * a21;
      c2 = (b1 * a22 - a12 * b2) / dd; c3 = (a11 * b2 - a21 * b1) / dd;
    }
    const w = (x) => c0 + c1 * x + (c2 * x * x) / 2 + (c3 * x ** 3) / 6 + wp[0](x);
    const slope = (x) => c1 + c2 * x + (c3 * x * x) / 2 + wp[1](x);
    const M = (x) => EI * (c2 + c3 * x + wp[2](x));
    const V = (x) => EI * (c3 + wp[3](x));
    return { w, slope, M, V, R0: EI * c3, M0: EI * c2 };
  }
  const BEAM = { E: 200e9, b: 0.04, h: 0.06, Lb: 1, sy: 250e6 };
  BEAM.I = (BEAM.b * BEAM.h ** 3) / 12;

  // 3. Euler buckling and the elastica. K(p) by the arithmetic–geometric mean
  function ellK(p) { let a = 1, b = Math.sqrt(1 - p * p); for (let i = 0; i < 30; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return Math.PI / (2 * a); }
  const loadRatio = (p) => (2 * ellK(p) / Math.PI) ** 2; // P/P_cr on the post-buckled branch, the same for every end condition
  function pFromLoad(r) { if (r <= 1) return 0; let lo = 0, hi = 0.999999; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (loadRatio(m) < r) lo = m; else hi = m; } return (lo + hi) / 2; }
  const BCS = [{ id: 'pinned', K: 1, q: 2, from: 1, to: 3 }, { id: 'free', K: 2, q: 1, from: 0, to: 1 }, { id: 'fixed', K: 0.5, q: 4, from: 0, to: 4 }]; // q = quarter-periods in the length
  // shape of the buckled column, length 1: θ'' = −k² sin θ from θ = 0, θ' = 2pk; returns points [lateral, axial] from the base
  function elastica(p, bc, n = 400) {
    const K = ellK(p), k = (bc.q * K), s0 = bc.from * K / k, s1 = bc.to * K / k; // with total length s1 − s0 = 1
    const f = (th, om) => [om, -k * k * Math.sin(th)];
    let th = 0, om = 2 * p * k, x = 0, y = 0, s = 0; const h = 1 / n, out = [];
    const stepTo = (S) => { while (s < S - 1e-12) { const dh = Math.min(h, S - s); const a1 = f(th, om), a2 = f(th + dh / 2 * a1[0], om + dh / 2 * a1[1]), a3 = f(th + dh / 2 * a2[0], om + dh / 2 * a2[1]), a4 = f(th + dh * a3[0], om + dh * a3[1]);
      const nth = th + dh / 6 * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]), nom = om + dh / 6 * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]), tm = (th + nth) / 2;
      // position by Simpson on the tangent angle
      x += dh / 6 * (Math.sin(th) + 4 * Math.sin(th + dh / 2 * a1[0]) + Math.sin(nth)) ; y += dh / 6 * (Math.cos(th) + 4 * Math.cos(th + dh / 2 * a1[0]) + Math.cos(nth)); void tm;
      th = nth; om = nom; s += dh; if (s >= s0 - 1e-12) out.push([x, y]); } };
    stepTo(s0); const base = [x, y]; out.length = 0; out.push([0, 0]);
    while (s < s1 - 1e-12) { stepTo(Math.min(s1, s + h)); out[out.length - 1] = [out[out.length - 1][0] - base[0], out[out.length - 1][1] - base[1]]; }
    return out;
  }
  // linear buckling mode, lateral deflection along the length (max 1)
  const mode = (id, xi) => (id === 'pinned' ? Math.sin(Math.PI * xi) : id === 'free' ? 1 - Math.cos((Math.PI * xi) / 2) : (1 - Math.cos(2 * Math.PI * xi)) / 2);
  // maximum lateral deflection on the post-buckled branch, per unit length: closed forms 2p/K (free), p/K (pinned, fixed)
  const elasticaDelta = (p, id) => (id === 'free' ? 2 : 1) * p / ellK(p);
  const COL = { E: 200e9, d: 0.02, sy: 250e6 };
  COL.I = (Math.PI * COL.d ** 4) / 64; COL.A = (Math.PI * COL.d ** 2) / 4; COL.r = COL.d / 4;
  const eulerLoad = (Lc, K, c = COL) => (Math.PI ** 2 * c.E * c.I) / (K * Lc) ** 2;
  const johnson = (lam, c = COL) => c.sy * (1 - (c.sy * lam * lam) / (4 * Math.PI ** 2 * c.E));

  (window.LabModels = window.LabModels || {})['continuum-mechanics'] = { eigSym, mul, tr, det, rotM, polar, green, smallStrain, mohr, SUPS, beam, BEAM, ellK, loadRatio, pFromLoad, BCS, elastica, mode, elasticaDelta, COL, eulerLoad, johnson };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const put = (G, e) => (G.appendChild(e), e);
  const empty = (G) => { while (G.firstChild) G.removeChild(G.firstChild); };

  /* ---------- 1. the deformation gradient ---------- */
  D['deformation-gradient'] = {
    render(ctx, v) {
      const Q = rotM(v.rot * RAD), F0 = [[v.f11, v.f12], [v.f21, v.f22]], F = mul(Q, F0), J = det(F);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A square of material (dashed) and its image under x = F X (blue grid). The columns of F are where the two edges go: drag F e₁ and F e₂. The gold ellipse is the image of the dashed circle, with its principal stretches λ₁, λ₂.', '材料の正方形（破線）と、x = F X によるその像（青い格子）です。F の列は二つの辺の行き先で、F e₁ と F e₂ をドラッグできます。金色の楕円は破線の円の像で、主伸び λ₁、λ₂ を示します。'));
      const f = L.fig(c1, { x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, maxH: 420, axes: false });
      const map = ([x, y]) => [F[0][0] * x + F[0][1] * y, F[1][0] * x + F[1][1] * y];
      for (let k = -4; k <= 4; k++) { const t = k / 4; f.seg([t, -1], [t, 1], { c: 'muted', w: 0.6, op: 0.5, layer: 'under' }); f.seg([-1, t], [1, t], { c: 'muted', w: 0.6, op: 0.5, layer: 'under' }); }
      f.poly([[-1, -1], [1, -1], [1, 1], [-1, 1]], { c: 'muted', w: 1.2, dash: '5 4', fill: false });
      f.poly([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(map), { c: J > 0 ? 'c1' : 'c2', w: 1.8, fo: 0.1 });
      for (let k = -3; k <= 3; k++) { const t = k / 4; f.seg(map([t, -1]), map([t, 1]), { c: 'c1', w: 0.9, op: 0.55 }); f.seg(map([-1, t]), map([1, t]), { c: 'c1', w: 0.9, op: 0.55 }); }
      const r0 = 0.62;
      f.circle(0, 0, r0, { c: 'ink', w: 1, dash: '3 4', op: 0.6 });
      f.line(L.sample(0, 2 * Math.PI, 120, (t) => map([r0 * Math.cos(t), r0 * Math.sin(t)])), { c: 'hl', w: 2.6, fill: 'hl', fo: 0.18, closed: true });
      const pd = polar(F);
      if (J > 1e-9) {
        [[pd.n1, pd.lam[0], 'c2', 'λ₁'], [pd.n2, pd.lam[1], 'c4', 'λ₂']].forEach(([n, l, c, s]) => { const m = map(n), tip = [m[0] * r0, m[1] * r0]; f.arrow([0, 0], tip, { c, w: 2.4 }); f.seg([0, 0], [n[0] * r0, n[1] * r0], { c, w: 1.2, dash: '3 3', op: 0.8 }); f.text(tip[0] * 1.15, tip[1] * 1.15, s, { c, math: true, small: true }); });
      }
      const e1 = [F[0][0], F[1][0]], e2 = [F[0][1], F[1][1]], Qt = tr(Q);
      const back = (x, y) => [Qt[0][0] * x + Qt[0][1] * y, Qt[1][0] * x + Qt[1][1] * y];
      f.text(e1[0], e1[1], 'F e₁', { c: 'c1', small: true, dx: 14, dy: -10, anchor: 'start' }); f.text(e2[0], e2[1], 'F e₂', { c: 'c3', small: true, dx: 14, dy: -10, anchor: 'start' });
      f.handle(e1[0], e1[1], { c: 'c1', r: 7, snap: 0.01, label: 'F e₁', onDrag: (x, y) => { const [a, b] = back(x, y); ctx.set('f11', a, true); ctx.set('f21', b); } });
      f.handle(e2[0], e2[1], { c: 'c3', r: 7, snap: 0.01, label: 'F e₂', onDrag: (x, y) => { const [a, b] = back(x, y); ctx.set('f12', a, true); ctx.set('f22', b); } });

      L.h('p', 'lab-cap', c2, T('Mohr’s circles: normal strain against shear strain on every plane through the point. Blue is the exact Green–Lagrange strain E, orange dashed is the small-strain tensor ε. Under a rigid rotation E stays put; ε does not.', 'モールの円です。点を通るあらゆる面での垂直ひずみとせん断ひずみを示します。青が厳密なグリーン・ラグランジュひずみ E、オレンジの破線が微小ひずみテンソル ε です。剛体回転のもとで E は動きませんが、ε は動きます。'));
      const E = green(F), eps = smallStrain(F), mE = mohr(E), me = mohr(eps);
      const ext = Math.max(0.3, Math.abs(mE.c) + mE.r, Math.abs(me.c) + me.r) * 1.15;
      const g = L.fig(c2, { x: [-ext, ext], y: [-ext * 0.75, ext * 0.75], equal: true, maxH: 340, xlabel: T('normal strain', '垂直ひずみ'), ylabel: T('shear strain', 'せん断ひずみ') });
      g.hline(0, { c: 'muted', w: 1, dash: false, layer: 'under' }); g.vline(0, { c: 'muted', w: 1, dash: false, layer: 'under' });
      g.circle(me.c, 0, me.r, { c: 'c2', w: 1.8, dash: '6 4' });
      g.circle(mE.c, 0, mE.r, { c: 'c1', w: 2.4, fill: 'c1', fo: 0.08 });
      g.seg([E[0][0], E[0][1]], [E[1][1], -E[0][1]], { c: 'c1', w: 1.2 });
      g.dot(E[0][0], E[0][1], { c: 'c1', r: 4.5 }); g.text(E[0][0], E[0][1], 'x', { small: true, c: 'c1', dx: 8, dy: -6, anchor: 'start' });
      g.dot(E[1][1], -E[0][1], { c: 'c1', r: 4.5 }); g.text(E[1][1], -E[0][1], 'y', { small: true, c: 'c1', dx: 8, dy: 12, anchor: 'start' });
      [[mE.p1, 'E₁'], [mE.p2, 'E₂']].forEach(([x, s]) => { g.dot(x, 0, { c: 'hl', r: 4.5 }); g.text(x, 0, s, { small: true, c: 'ink', dy: 16 }); });
      L.legend(ctx.host, [{ c: 'c1', label: T('deformed material; Green–Lagrange E', '変形した材料、グリーン・ラグランジュひずみ E') }, { c: 'hl', kind: 'fill', label: T('image of a circle (strain ellipse)', '円の像（ひずみ楕円）') }, { c: 'c2', dash: true, label: T('small strain ε', '微小ひずみ ε') }]);
      const bad = J <= 1e-9;
      ctx.readout([
        { k: 'F', v: `[${fmt(F[0][0], 2)} ${fmt(F[0][1], 2)}; ${fmt(F[1][0], 2)} ${fmt(F[1][1], 2)}]`, tone: 'key' },
        { k: 'J = det F', v: fmt(J, 3), tone: bad ? 'warn' : J > 0.98 && J < 1.02 ? 'good' : undefined },
        ...(bad ? [] : [{ k: T('principal stretches λ₁, λ₂', '主伸び λ₁、λ₂'), v: `${fmt(pd.lam[0], 3)}, ${fmt(pd.lam[1], 3)}` }, { k: T('rotation in R', 'R の回転'), v: `${fmt(pd.angle / RAD, 1)}°` }]),
        { k: T('E principal', 'E の主値'), v: `${fmt(mE.p1, 3)}, ${fmt(mE.p2, 3)}` },
        { k: T('ε principal', 'ε の主値'), v: `${fmt(me.p1, 3)}, ${fmt(me.p2, 3)}`, tone: Math.abs(me.p1 - mE.p1) + Math.abs(me.p2 - mE.p2) > 0.02 ? 'warn' : 'good' },
      ], bad
        ? T('With J = det F ≤ 0 the material has been squashed to zero area or turned inside out. No real deformation does this, which is why J > 0 is required of every deformation gradient.', 'J = det F ≤ 0 では、材料は面積 0 に押しつぶされたか、裏返されています。現実の変形はこれを起こさないので、すべての変形勾配に J > 0 が要求されます。')
        : T(`Every deformation is a stretch followed by a rotation, F = R U: the stretches λ₁ = ${fmt(pd.lam[0], 3)} and λ₂ = ${fmt(pd.lam[1], 3)} act along perpendicular material directions (dashed), which then turn by ${fmt(pd.angle / RAD, 1)}°. The area changes by J = λ₁λ₂ = ${fmt(J, 3)}. Turn the extra rotation slider: E, built from FᵀF, is blind to it, but the small strain ε = (F + Fᵀ)/2 − I reports strains that are not there, which is why it is only valid for small rotations.`, `あらゆる変形は伸びとそれに続く回転 F = R U です。伸び λ₁ = ${fmt(pd.lam[0], 3)}、λ₂ = ${fmt(pd.lam[1], 3)} は直交する材料の方向（破線）に沿って働き、その方向が ${fmt(pd.angle / RAD, 1)}° 回ります。面積は J = λ₁λ₂ = ${fmt(J, 3)} 倍になります。追加の回転のスライダーを動かしてください。FᵀF から作る E はそれに反応しませんが、微小ひずみ ε = (F + Fᵀ)/2 − I は存在しないひずみを報告します。だから ε は回転が小さいときにしか使えないのです。`));
    },
  };

  /* ---------- 2. bending of beams ---------- */
  const SUPNAMES = [['cantilever', '片持ちはり'], ['simply supported', '単純支持はり'], ['fixed at both ends', '両端固定はり']];
  D['beam-bending'] = {
    render(ctx, v) {
      const sup = SUPS[v.sup], P = v.P * 1e3, q = v.q * 1e3, a = v.a, { E, I, Lb, h, sy } = BEAM, EI = E * I;
      const bm = beam(sup, P, a, q, EI, Lb), xs = L.seq(401, (i) => i / 400);
      const ws = xs.map(bm.w), Ms = xs.map(bm.M), Vs = xs.map(bm.V);
      const wmax = ws.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0), iw = ws.indexOf(wmax);
      const Mmax = Ms.reduce((m, x) => (Math.abs(x) > Math.abs(m) ? x : m), 0), smax = (Math.abs(Mmax) * h / 2) / I;
      const hd = 0.075, scale = Math.abs(wmax) > 1e-12 ? 0.11 / Math.abs(wmax) : 1;
      L.h('p', 'lab-cap', ctx.host, T(`A steel bar 1 m long, 40 mm wide and 60 mm deep, coloured by bending stress σ = −M y/I (warm: tension, cool: compression; full colour at 125 MPa, half the yield stress). Deflections are exaggerated ${fmt(scale, 0)} times and the depth is not to scale. Drag the gold handle to move the point load.`, `長さ 1 m、幅 40 mm、高さ 60 mm の鋼の棒を、曲げ応力 σ = −M y/I で色分けしています（暖色が引張、寒色が圧縮、降伏応力の半分の 125 MPa で最も濃い色）。たわみは ${fmt(scale, 0)} 倍に誇張し、高さは縮尺どおりではありません。金色のハンドルで集中荷重を動かせます。`));
      const f = L.fig(ctx.host, { x: [-0.07, 1.07], y: [-0.27, 0.27], aspect: 0.4, maxH: 330, axes: false, grid: false });
      const col = L.colours(), wmap = (x) => scale * bm.w(clamp(x, 0, 1));
      f.raster((x, y) => { if (x < 0 || x > 1) return col.plate; const dy = (y - wmap(x)) / (hd / 2); if (Math.abs(dy) > 1) return col.plate; return L.cmaps.div((-bm.M(x) * dy * (h / 2)) / I / (sy / 2)); }, { res: 2 });
      f.line(xs.map((x) => [x, wmap(x) + hd / 2]), { c: 'ink', w: 1.4 }); f.line(xs.map((x) => [x, wmap(x) - hd / 2]), { c: 'ink', w: 1.4 });
      f.line(xs.map((x) => [x, wmap(x)]), { c: 'ink', w: 0.8, dash: '4 4', op: 0.6 });
      f.seg([0, 0], [1, 0], { c: 'muted', w: 1, dash: '2 5', layer: 'under' });
      // supports
      const wall = (x0, dir) => { f.rect(dir > 0 ? x0 - 0.035 : x0, -0.12, 0.035, 0.24, { c: 'muted', fill: 'muted', fo: 0.35, w: 1 }); for (let k = 0; k < 6; k++) { const y = -0.12 + k * 0.045; f.seg([x0 - dir * 0.035, y], [x0 - dir * 0.005, y + 0.03], { c: 'muted', w: 0.8 }); } };
      const pin = (x0, roller) => { f.poly([[x0, -hd / 2], [x0 - 0.03, -hd / 2 - 0.06], [x0 + 0.03, -hd / 2 - 0.06]], { c: 'ink', w: 1.2, fill: 'muted', fo: 0.3 }); if (roller) { f.circle(x0 - 0.016, -hd / 2 - 0.072, 0.011, { c: 'ink', w: 1 }); f.circle(x0 + 0.016, -hd / 2 - 0.072, 0.011, { c: 'ink', w: 1 }); } f.seg([x0 - 0.05, -hd / 2 - (roller ? 0.086 : 0.062)], [x0 + 0.05, -hd / 2 - (roller ? 0.086 : 0.062)], { c: 'ink', w: 1.4 }); };
      if (sup === 'cantilever') wall(0, 1); else if (sup === 'simple') { pin(0, false); pin(1, true); } else { wall(0, 1); wall(1, -1); }
      // loads
      if (q > 0) { const ql = 0.03 + 0.06 * (v.q / 10); f.seg([0, hd / 2 + 0.02 + ql], [1, hd / 2 + 0.02 + ql], { c: 'c4', w: 1.4 }); for (let k = 0; k <= 20; k++) { const x = k / 20; f.arrow([x, hd / 2 + 0.02 + ql], [x, wmap(x) + hd / 2 + 0.005], { c: 'c4', w: 1.2 }); } f.text(1.0, hd / 2 + 0.03 + ql, `q = ${fmt(v.q, 1)} kN/m`, { small: true, c: 'c4', anchor: 'end', dy: -6 }); }
      if (P > 0) { const top = wmap(a) + hd / 2; f.arrow([a, top + 0.15], [a, top + 0.004], { c: 'c2', w: 3 }); f.text(a, top + 0.15, `P = ${fmt(v.P, 1)} kN`, { small: true, c: 'c2', dy: -10 }); }
      f.handle(a, wmap(a) + hd / 2 + 0.15, { c: 'hl', r: 7, axis: 'x', snap: 0.01, bounds: [0, 1, -1, 1], label: T('Position of the point load', '集中荷重の位置'), onDrag: (x) => ctx.set('a', clamp(Math.round(x * 100) / 100, 0, 1)) });
      f.dot(xs[iw], wmap(xs[iw]), { c: 'hl', r: 4.5 }); f.text(xs[iw], wmap(xs[iw]) - hd / 2, `${fmt(wmax * 1e3, 2)} mm`, { small: true, c: 'ink', dy: 16 });
      // shear and moment diagrams
      const row = L.h('div', 'lab-row', ctx.host), d1 = L.h('div', 'lab-col', row), d2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', d1, T('Shear force V(x) (kN).', 'せん断力 V(x)（kN）。'));
      const vm = Math.max(1, ...Vs.map((x) => Math.abs(x) / 1e3)) * 1.2;
      const gv = L.fig(d1, { x: [0, 1], y: [-vm, vm], aspect: 0.45, maxH: 200, xlabel: 'x (m)', ylabel: 'kN' });
      gv.area(xs.map((x, i) => [x, Vs[i] / 1e3]), { c: 'c3', fo: 0.25 }); gv.line(xs.map((x, i) => [x, Vs[i] / 1e3]), { c: 'c3', w: 2 }); gv.hline(0, { c: 'muted', dash: false, w: 1 });
      L.h('p', 'lab-cap', d2, T('Bending moment M(x) (kN·m), sagging positive.', '曲げモーメント M(x)（kN·m）、下に凸を正とします。'));
      const mm = Math.max(0.5, ...Ms.map((x) => Math.abs(x) / 1e3)) * 1.2;
      const gm = L.fig(d2, { x: [0, 1], y: [-mm, mm], aspect: 0.45, maxH: 200, xlabel: 'x (m)', ylabel: 'kN·m' });
      gm.area(xs.map((x, i) => [x, Ms[i] / 1e3]), { c: 'c4', fo: 0.25 }); gm.line(xs.map((x, i) => [x, Ms[i] / 1e3]), { c: 'c4', w: 2 }); gm.hline(0, { c: 'muted', dash: false, w: 1 });
      const im = Ms.indexOf(Mmax); gm.dot(xs[im], Mmax / 1e3, { c: 'hl', r: 4.5 });
      L.legend(ctx.host, [{ c: 'pos', kind: 'fill', label: T('tension', '引張') }, { c: 'neg', kind: 'fill', label: T('compression', '圧縮') }, { c: 'c2', label: T('point load P', '集中荷重 P') }, { c: 'c4', label: T('distributed load q; moment', '分布荷重 q、モーメント') }, { c: 'c3', label: T('shear', 'せん断力') }]);
      const ref = sup === 'cantilever' ? [(P * a ** 2 * (3 * Lb - a)) / (6 * EI), (q * Lb ** 4) / (8 * EI), T('tip: P a²(3L − a)/6EI + qL⁴/8EI', '先端：P a²(3L − a)/6EI + qL⁴/8EI')]
        : sup === 'simple' ? [(P * Lb ** 3) / (48 * EI), (5 * q * Lb ** 4) / (384 * EI), T('centre, load at mid-span: PL³/48EI + 5qL⁴/384EI', '中央、荷重が中央のとき：PL³/48EI + 5qL⁴/384EI')]
        : [(P * Lb ** 3) / (192 * EI), (q * Lb ** 4) / (384 * EI), T('centre, load at mid-span: PL³/192EI + qL⁴/384EI', '中央、荷重が中央のとき：PL³/192EI + qL⁴/384EI')];
      ctx.readout([
        { k: T('support', '支持'), v: T(...SUPNAMES[v.sup]), tone: 'key' },
        { k: T('largest deflection', '最大たわみ'), v: `${fmt(Math.abs(wmax) * 1e3, 2)} mm, x = ${fmt(xs[iw], 2)} m` },
        { k: T('largest moment', '最大モーメント'), v: `${fmt(Math.abs(Mmax) / 1e3, 2)} kN·m` },
        { k: T('largest stress', '最大応力'), v: `${fmt(smax / 1e6, 0)} MPa`, tone: smax > sy ? 'warn' : 'good' },
        { k: T('safety factor on yield', '降伏に対する安全率'), v: smax > 0 ? fmt(sy / smax, 2) : '∞', tone: smax > sy ? 'warn' : undefined },
        { k: T('textbook formula', '教科書の公式'), v: `${ref[2]} = ${fmt((ref[0] + ref[1]) * 1e3, 2)} mm` },
      ], [
        T('A cantilever carries everything back to the wall, so the moment, and the stress, are largest at the root: tension along the top, compression along the bottom. The tip deflection grows with the cube of the load’s distance from the wall, which is why diving boards and aircraft wings are deep at the root.', '片持ちはりはすべてを壁まで運ぶので、モーメントと応力は根元で最大になります。上面に沿って引張、下面に沿って圧縮です。先端のたわみは壁から荷重までの距離の三乗で増えるので、飛び込み板や航空機の翼は根元が深くなっています。'),
        T('Simple supports cannot resist a moment, so the moment is zero at both ends and peaks under the load, with the beam sagging: compression on top, tension underneath. Move the load towards a support and the moment collapses, because the support takes almost all of it directly.', '単純支持はモーメントに抵抗できないので、モーメントは両端で 0 になり荷重の下で最大になり、はりは下に凸にたわみます。上面が圧縮、下面が引張です。荷重を支点に近づけるとモーメントは小さくなります。支点がほとんどすべてを直接受けるからです。'),
        T('Clamping both ends lets the walls resist rotation, which puts hogging moments at the supports (tension on top there) and reduces the mid-span moment. With the load in the middle the deflection is a quarter of the simply supported value: stiffness that comes entirely from the boundary conditions.', '両端を固定すると壁が回転に抵抗するので、支点には上に凸のモーメント（そこでは上面が引張）が生じ、中央のモーメントは小さくなります。荷重が中央にあるとき、たわみは単純支持の四分の一です。剛さが境界条件だけから生まれるのです。'),
      ][v.sup]);
    },
  };

  /* ---------- 3. buckling and the elastica ---------- */
  const BCNAMES = [['pinned–pinned', '両端ピン'], ['fixed–free', '固定・自由'], ['fixed–fixed', '両端固定']];
  D['buckling'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const bc = BCS[v.bc], Lc = v.len, imp = v.imp / 100, load = v.load, Pcr = eulerLoad(Lc, bc.K), slen = (bc.K * Lc) / COL.r, scr = Pcr / COL.A;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('A 20 mm steel rod under an end load P, drawn to scale. Below P_cr a crooked rod bows more and more; above it a perfect rod takes the exact large-deflection shape of Euler’s elastica.', '端に荷重 P を受ける直径 20 mm の鋼の棒を縮尺どおりに描いています。P_cr 未満では曲がった棒がどんどん反り、それを超えると完全な棒はオイラーのエラスティカの厳密な大変形の形をとります。'));
      const xr = bc.id === 'free' ? 0.95 : 0.5;
      const f = L.fig(c1, { x: [-xr, xr], y: [-0.12, 1.16], equal: true, axes: false, grid: false, maxH: 430 });
      f.seg([0, 0], [0, 1], { c: 'muted', w: 1, dash: '4 4', layer: 'under' });
      const fixedBase = (y, up) => { f.rect(-0.16, up ? y - 0.05 : y, 0.32, 0.05, { c: 'muted', fill: 'muted', fo: 0.35, w: 1, layer: 'under' }); };
      const pinAt = (y, up) => { const s = up ? -1 : 1; f.poly([[0, y], [-0.05, y - s * 0.07], [0.05, y - s * 0.07]], { c: 'ink', w: 1.2, fill: 'muted', fo: 0.3, layer: 'under' }); f.seg([-0.09, y - s * 0.07], [0.09, y - s * 0.07], { c: 'ink', w: 1.4, layer: 'under' }); };
      if (bc.id === 'pinned') { pinAt(0, true); } else fixedBase(0, true);
      const G = f.group('main');
      // load–deflection diagram
      L.h('p', 'lab-cap', c2, T('Load against the largest sideways deflection. Perfect rod (blue): straight until P_cr, then the elastica branch, which rises only slowly. Crooked rods (orange, initial bow δ₀): δ = δ₀/(1 − P/P_cr) from small-deflection theory. Drag the gold point to set the load.', '荷重と最大の横たわみの関係です。完全な棒（青）は P_cr までまっすぐで、その後ゆっくりとしか上がらないエラスティカの枝に乗ります。初期の曲がり δ₀ をもつ棒（オレンジ）は、微小変形理論による δ = δ₀/(1 − P/P_cr) です。金色の点をドラッグして荷重を設定してください。'));
      const pm = pFromLoad(1.6), dmax = elasticaDelta(pm, bc.id) * 1.08;
      const g = L.fig(c2, { x: [0, dmax], y: [0, 1.65], aspect: 0.7, maxH: 290, xlabel: T('largest deflection δ/L', '最大たわみ δ/L'), ylabel: 'P/P_cr' });
      g.hline(1, { c: 'muted', w: 1, dash: '4 4' });
      g.seg([0, 0], [0, 1], { c: 'c1', w: 2.6 });
      g.line(L.sample(0, pm, 120, (p) => [elasticaDelta(p, bc.id), loadRatio(p)]), { c: 'c1', w: 2.6 });
      [0.001, 0.005, 0.01].forEach((d0) => g.line(L.sample(0, 0.985, 120, (r) => [d0 / (1 - r), r]), { c: 'muted', w: 1, dash: '3 4' }));
      if (imp > 0) g.line(L.sample(0, 0.985, 160, (r) => [imp / (1 - r), r]), { c: 'c2', w: 2.2 });
      const cur = g.group('over');
      // design curve
      L.h('p', 'lab-cap', c2, T('Critical stress against slenderness KL/r: Euler’s π²E/(KL/r)² (blue) holds only below yield; stocky columns fail by yielding, and the Johnson parabola (teal) bridges the two.', '細長比 KL/r に対する限界応力です。オイラーの π²E/(KL/r)²（青）は降伏応力より下でしか成り立ちません。太く短い柱は降伏で壊れ、ジョンソンの放物線（青緑）が二つをつなぎます。'));
      const lc = Math.sqrt((2 * Math.PI ** 2 * COL.E) / COL.sy);
      const h2 = L.fig(c2, { x: [0, 300], y: [0, 400], aspect: 0.5, maxH: 220, xlabel: T('slenderness KL/r', '細長比 KL/r'), ylabel: 'MPa' });
      h2.line(L.sample(40, 300, 200, (x) => (Math.PI ** 2 * COL.E) / x ** 2 / 1e6), { c: 'c1', w: 2.2 });
      h2.line(L.sample(0, lc, 100, (x) => johnson(x) / 1e6), { c: 'c3', w: 2.2 });
      h2.hline(COL.sy / 1e6, { c: 'c2', w: 1.4, dash: '6 4' }); h2.text(298, COL.sy / 1e6, T('yield 250 MPa', '降伏 250 MPa'), { small: true, c: 'c2', anchor: 'end', dy: -6 });
      const sAct = slen < lc ? johnson(slen) : scr; h2.dot(Math.min(slen, 300), Math.min(400, sAct / 1e6), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('perfect rod; Euler curve', '完全な棒、オイラー曲線') }, { c: 'c2', label: T('crooked rod, this δ₀', 'この δ₀ をもつ曲がった棒') }, { c: 'muted', dash: true, label: 'δ₀ = 0.1%, 0.5%, 1% L' }, { c: 'c3', label: T('Johnson parabola', 'ジョンソンの放物線') }]);

      const draw = (P) => {
        empty(G); empty(cur);
        let pts, delta, regime;
        if (P >= 1) { const p = pFromLoad(Math.max(P, 1 + 1e-9)); pts = elastica(p, bc); delta = elasticaDelta(p, bc.id); regime = 'post'; }
        else { const Pc = Math.min(P, 0.985); delta = imp / (1 - Pc); pts = L.seq(101, (i) => [delta * mode(bc.id, i / 100), i / 100]); regime = P > 0.985 ? 'clip' : 'pre'; }
        const top = pts[pts.length - 1];
        put(G, f.line(pts, { c: 'c1', w: 6, op: 0.9 }));
        if (bc.id === 'free') put(G, f.dot(top[0], top[1], { c: 'ink', r: 3.5, layer: 'main' }));
        if (bc.id === 'pinned') { put(G, f.poly([[top[0], top[1]], [top[0] - 0.05, top[1] + 0.07], [top[0] + 0.05, top[1] + 0.07]], { c: 'ink', w: 1.2, fill: 'muted', fo: 0.3 })); put(G, f.seg([top[0] - 0.09, top[1] + 0.07], [top[0] + 0.09, top[1] + 0.07], { c: 'ink', w: 1.4 })); }
        if (bc.id === 'fixed') put(G, f.rect(top[0] - 0.16, top[1], 0.32, 0.05, { c: 'muted', fill: 'muted', fo: 0.35, w: 1 }));
        const ay = top[1] + (bc.id === 'free' ? 0.02 : 0.08);
        put(G, f.arrow([top[0], ay + 0.1 + 0.06 * P], [top[0], ay], { c: 'c2', w: 3 })); put(G, f.text(top[0], ay + 0.1 + 0.06 * P, 'P', { c: 'c2', math: true, dx: 12, dy: 6, anchor: 'start' }));
        put(cur, g.dot(Math.min(delta, dmax), Math.min(P, 1.65), { c: 'hl', r: 5.5 }));
        return { delta, regime };
      };
      const res = draw(load);
      g.handle(Math.min(res.delta, dmax), load, { c: 'hl', r: 7, axis: 'y', snap: 0.01, bounds: [0, dmax, 0, 1.6], label: 'P/P_cr', onDrag: (x, y) => ctx.set('load', clamp(Math.round(y * 100) / 100, 0, 1.6)) });
      ctx.readout([
        { k: T('ends', '端の条件'), v: `${T(...BCNAMES[v.bc])}, K = ${fmt(bc.K, 2)}`, tone: 'key' },
        { k: 'P_cr = π²EI/(KL)²', v: `${fmt(Pcr / 1e3, 2)} kN` },
        { k: 'P', v: `${fmt((load * Pcr) / 1e3, 2)} kN` },
        { k: T('slenderness KL/r', '細長比 KL/r'), v: fmt(slen, 0) },
        { k: T('Euler stress', 'オイラー応力'), v: `${fmt(scr / 1e6, 0)} MPa`, tone: scr > COL.sy ? 'warn' : 'good' },
        { k: 'δ/L', v: fmt(res.delta, 3) },
      ], scr > COL.sy
        ? T(`This rod is too stocky for Euler’s formula: it would need ${fmt(scr / 1e6, 0)} MPa to buckle elastically, more than the 250 MPa at which steel yields. It fails by yielding first, and the Johnson curve gives a realistic limit. Lengthen it or free one end to see elastic buckling.`, `この棒はオイラーの式には太く短すぎます。弾性座屈には ${fmt(scr / 1e6, 0)} MPa が必要で、鋼が降伏する 250 MPa を超えています。先に降伏で壊れ、ジョンソン曲線が現実的な限界を与えます。長くするか一端を自由にすると弾性座屈が見られます。`)
        : res.regime === 'post'
          ? T(`Past the critical load the straight rod is unstable and jumps to the bent elastica, and the bent shape needs only slightly more load to bend a lot further: at P = ${fmt(load, 2)} P_cr it bows ${fmt(res.delta * 100, 1)}% of its length. Real columns yield long before this, so P_cr is effectively the strength. The branch is P/P_cr = (2K(p)/π)², the same for every end condition once lengths are measured in KL.`, `限界荷重を超えるとまっすぐな棒は不安定になって曲がったエラスティカへ移り、曲がった形はわずかな荷重の増加で大きく曲がります。P = ${fmt(load, 2)} P_cr では長さの ${fmt(res.delta * 100, 1)}% だけ反ります。実際の柱はそのずっと前に降伏するので、実質的に P_cr が強度になります。この枝は P/P_cr = (2K(p)/π)² で、長さを KL で測れば端の条件によらず同じです。`)
          : res.regime === 'clip'
            ? T('Close to P_cr the small-deflection formula δ₀/(1 − P/P_cr) blows up and stops being valid; the true path of a crooked rod bends over and joins the elastica branch. The drawing holds the shape at 0.985 P_cr.', 'P_cr に近づくと微小変形の式 δ₀/(1 − P/P_cr) は発散して成り立たなくなります。曲がった棒の本当の経路は折れ曲がってエラスティカの枝に合流します。図は 0.985 P_cr の形で止めています。')
            : imp === 0
              ? T('A perfectly straight rod stays straight under any load below P_cr: there is no bending until the load reaches the critical value and the straight state loses stability.', '完全にまっすぐな棒は P_cr 未満のどんな荷重でもまっすぐなままです。荷重が限界値に達してまっすぐな状態が安定性を失うまで、曲がりは生じません。')
              : T(`A rod with an initial bow of ${fmt(v.imp, 2)}% of its length bows by δ₀/(1 − P/P_cr): ${fmt(res.delta * 100, 2)}% at ${fmt(load, 2)} P_cr, ten times the initial bow at 0.9 P_cr. The bending moment P δ grows with it, so crooked columns yield before reaching P_cr.`, `長さの ${fmt(v.imp, 2)}% の初期の曲がりをもつ棒は δ₀/(1 − P/P_cr) だけ反り、${fmt(load, 2)} P_cr では ${fmt(res.delta * 100, 2)}% です。0.9 P_cr では初期の曲がりの十倍になります。曲げモーメント P δ もそれとともに増えるので、曲がった柱は P_cr に達する前に降伏します。`));
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const P = Math.min(load, t * 0.45); draw(P); lb.textContent = `P = ${fmt(P, 2)} P_cr`; return P < load; }, { autoplay: false, once: true, initialT: load / 0.45 + 0.01, playLabel: T('Play: load the column', '再生：柱に荷重をかける') });
    },
  };
})();
