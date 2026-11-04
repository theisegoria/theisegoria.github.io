'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {});
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Murray (1926): a vessel of radius r and length l carrying a steady flow Q costs
   *   P = 8 mu l Q^2 / (pi r^4)      (Poiseuille pumping power)
   *     + b pi r^2 l                  (metabolic upkeep of the blood it holds, b in W per m^3)
   * dP/dr = 0 gives Q = (pi/4) sqrt(b/mu) r^3, so flow goes with the cube of the radius, the wall shear stress
   * 4 mu Q/(pi r^3) is the same sqrt(b mu) in every vessel, and at the optimum the pumping term is half the upkeep term,
   * so the cost per unit length is (3/2) b pi r^2. A junction of three optimal vessels therefore sits where three pulls
   * proportional to r^2 balance, which is Murray's second result, cos th1 = (r0^4 + r1^4 - r2^4)/(2 r0^2 r1^2).
   */
  const seg = (r, Q, mu, b, l = 1) => { const pump = (8 * mu * l * Q * Q) / (PI * r ** 4), vol = b * PI * r * r * l; return { pump, vol, total: pump + vol }; };
  const rOpt = (Q, mu, b) => Math.pow((16 * mu * Q * Q) / (PI * PI * b), 1 / 6);
  const qOpt = (r, mu, b) => (PI / 4) * Math.sqrt(b / mu) * r ** 3;
  const tau = (r, Q, mu) => (4 * mu * Q) / (PI * r ** 3);
  const tauOpt = (mu, b) => Math.sqrt(b * mu);
  const costRatio = (rho) => (Math.pow(rho, -4) + 2 * rho * rho) / 3;   // P(r)/P(r*) for r = rho r*
  function murrayAngles(r0, r1, r2) {
    const c1 = (r0 ** 4 + r1 ** 4 - r2 ** 4) / (2 * r0 * r0 * r1 * r1), c2 = (r0 ** 4 + r2 ** 4 - r1 ** 4) / (2 * r0 * r0 * r2 * r2);
    const ok = Math.abs(c1) <= 1 && Math.abs(c2) <= 1;
    return { th1: Math.acos(clamp(c1, -1, 1)) / DEG, th2: Math.acos(clamp(c2, -1, 1)) / DEG, ok };
  }
  // the reference vessel: 1 mL/s of blood (mu = 3.5 mPa s) with Murray's own whole-body estimate of the upkeep,
  // b = 19 300 erg per cm^3 per second = 1930 W/m^3
  const REF = { Q: 1e-6, mu: 3.5e-3, b: 1930 };

  /* a T-free three-point junction: parent from A, daughters to B1 and B2, each with a cost per unit length w_i.
   * Cost C(J) = sum w_i |J - P_i|; the minimiser is the weighted Fermat point (Weiszfeld iteration). */
  const JA = [0, -4], JB1 = [-3.2, 3], JB2 = [3.2, 3];
  function bifurcation(s, k, o = REF) {
    const Q0 = o.Q, Q1 = s * Q0, Q2 = (1 - s) * Q0, r0 = rOpt(Q0, o.mu, o.b);
    const r1 = r0 * Math.pow(s, 1 / k), r2 = r0 * Math.pow(1 - s, 1 / k);
    const w = [seg(r0, Q0, o.mu, o.b).total, seg(r1, Q1, o.mu, o.b).total, seg(r2, Q2, o.mu, o.b).total];
    return { Q: [Q0, Q1, Q2], r: [r0, r1, r2], w, pts: [JA, JB1, JB2] };
  }
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const cost = (J, B) => B.w[0] * dist(J, B.pts[0]) + B.w[1] * dist(J, B.pts[1]) + B.w[2] * dist(J, B.pts[2]);
  // the pull of the three vessels on the junction: sum of w_i times the unit vector from J towards P_i (= -grad C)
  function pull(J, B) {
    let fx = 0, fy = 0; const parts = [];
    for (let i = 0; i < 3; i++) { const d = dist(J, B.pts[i]) || 1e-12, u = [(B.pts[i][0] - J[0]) / d, (B.pts[i][1] - J[1]) / d]; parts.push([u[0] * B.w[i], u[1] * B.w[i]]); fx += parts[i][0]; fy += parts[i][1]; }
    return { f: [fx, fy], parts };
  }
  function fermat(B) {
    // a vertex wins if its weight is at least the pull of the other two there
    for (let i = 0; i < 3; i++) { const P = B.pts[i]; let fx = 0, fy = 0; for (let j = 0; j < 3; j++) if (j !== i) { const d = dist(P, B.pts[j]); fx += (B.w[j] * (B.pts[j][0] - P[0])) / d; fy += (B.w[j] * (B.pts[j][1] - P[1])) / d; } if (Math.hypot(fx, fy) <= B.w[i]) return { J: P.slice(), vertex: i }; }
    let J = [(B.pts[0][0] + B.pts[1][0] + B.pts[2][0]) / 3, (B.pts[0][1] + B.pts[1][1] + B.pts[2][1]) / 3];
    for (let it = 0; it < 2000; it++) {
      let nx = 0, ny = 0, dd = 0;
      for (let i = 0; i < 3; i++) { const d = Math.max(1e-12, dist(J, B.pts[i])); nx += (B.w[i] * B.pts[i][0]) / d; ny += (B.w[i] * B.pts[i][1]) / d; dd += B.w[i] / d; }
      const Jn = [nx / dd, ny / dd], moved = dist(J, Jn); J = Jn; if (moved < 1e-13) break;
    }
    return { J, vertex: -1 };
  }
  // branching angles at a junction J: each daughter's angle from the parent's direction of travel
  function anglesAt(J, B) {
    const d0 = [J[0] - B.pts[0][0], J[1] - B.pts[0][1]], n0 = Math.hypot(...d0) || 1;
    const ang = (P) => { const d = [P[0] - J[0], P[1] - J[1]], n = Math.hypot(...d) || 1; return Math.acos(clamp((d[0] * d0[0] + d[1] * d0[1]) / (n * n0), -1, 1)) / DEG; };
    return [ang(B.pts[1]), ang(B.pts[2])];
  }

  /* a binary tree, every parent splitting its flow s : 1 - s, radii r = c Q^(1/k) with the single scale c chosen to
   * minimise the total cost; lengths proportional to the Murray radius (a fixed length-to-radius ratio). The cost of
   * the best tree in each family is 3 A c^-4 with c^6 = 2A/B; k = 3 makes every segment individually optimal. */
  function treeSegs(G, s) {
    const out = [];
    const rec = (g, Q, parent, side) => { const i = out.length; out.push({ g, Q, parent, side, l: Math.cbrt(Q) }); if (g < G) { rec(g + 1, Q * s, i, 1); rec(g + 1, Q * (1 - s), i, 2); } return i; };
    rec(0, 1, -1, 0);
    return out;
  }
  function treeCost(G, s, k, o = { mu: 1, b: 1 }) {
    const S = treeSegs(G, s); let A = 0, B = 0;
    for (const q of S) { A += (8 * o.mu * q.l * q.Q ** (2 - 4 / k)) / PI; B += o.b * PI * q.l * q.Q ** (2 / k); }
    const c = Math.pow((2 * A) / B, 1 / 6);
    return { cost: 3 * A * c ** -4, c, A, B, segs: S };
  }
  const treeCostRatio = (G, s, k) => treeCost(G, s, k).cost / treeCost(G, s, 3).cost;
  // wall shear stress and mean speed relative to the root, along the path taking side 1 (s) or side 2 (1 - s) each time
  const tauRatio = (g, q, k) => Math.pow(q, g * (1 - 3 / k));          // q = flow fraction per step
  const speedRatio = (g, q, k) => Math.pow(q, g * (1 - 2 / k));

  const M = { seg, rOpt, qOpt, tau, tauOpt, costRatio, murrayAngles, REF, bifurcation, cost, pull, fermat, anglesAt, treeSegs, treeCost, treeCostRatio, tauRatio, speedRatio, JA, JB1, JB2 };
  (window.LabModels = window.LabModels || {})['murrays-law'] = M;

  /* ================= 1. one vessel: the price of a radius ================= */
  D['murray-cost'] = {
    render(ctx, v) {
      const mu = v.mu * 1e-3, b = v.b, Q = v.Q * 1e-6, r = v.r * 1e-3;
      const rs = rOpt(Q, mu, b), rsm = rs * 1e3, P = (x) => seg(x * 1e-3, Q, mu, b), Ps = P(rsm), Pc = P(v.r);
      const mW = 1e3, xmax = Math.max(2.4 * rsm, v.r * 1.15), ymax = Ps.total * mW * 3.2;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Power needed per metre of vessel against its radius. A narrow vessel is expensive to push blood through; a wide one is expensive to fill. Drag the gold point along the total.', '血管 1 m あたりに必要な電力を半径に対して描いています。細い血管は血液を押し流すのが高くつき、太い血管は満たしておくのが高くつきます。金色の点を合計の曲線に沿ってドラッグしてください。'));
      const f = L.fig(c1, { x: [0, xmax], y: [0, ymax], aspect: 0.72, maxH: 380, xlabel: T('radius r (mm)', '半径 r（mm）'), ylabel: T('power per length (mW/m)', '長さあたりの電力（mW/m）') });
      const x0 = Math.max(0.02, xmax / 400);
      const crv = (key) => L.sample(x0, xmax, 320, (x) => [x, Math.min(ymax * 1.5, P(x)[key] * mW)]);
      f.line(crv('pump'), { c: 'c1', w: 2.2 });
      f.line(crv('vol'), { c: 'c2', w: 2.2 });
      f.line(crv('total'), { c: 'ink', w: 3 });
      f.vline(rsm, { c: 'c3', dash: '5 4', w: 1.4 });
      f.dot(rsm, Ps.total * mW, { c: 'c3', r: 5 });
      f.text(rsm, Ps.total * mW, T('minimum r*', '最小 r*'), { small: true, c: 'c3', dy: -14, anchor: 'middle' });
      { // label the pumping curve where it crosses 80% of the plot height, to the right of the curve
        const yT = ymax * 0.8, xT = Math.pow((8 * mu * Q * Q) / (PI * (yT / mW)), 1 / 4) * 1e3;
        f.text(xT, yT, T('pumping 8μQ²/πr⁴', '送り出し 8μQ²/πr⁴'), { small: true, c: 'c1', anchor: 'end', dx: -8 });
      }
      f.text(xmax * 0.93, P(xmax * 0.93).vol * mW, T('upkeep bπr²', '維持 bπr²'), { small: true, c: 'c2', anchor: 'end', dy: -8 });
      f.seg([v.r, 0], [v.r, Pc.total * mW], { c: 'hl', w: 1.2, dash: '3 3', layer: 'under' });
      f.handle(v.r, Math.min(ymax, Pc.total * mW), { c: 'hl', axis: 'x', bounds: [0.2, Math.min(4, xmax), 0, ymax], label: T('vessel radius', '血管の半径'), onDrag: (x) => ctx.set('r', clamp(x, 0.2, 4)) });
      f.hover((x) => { if (x <= 0) return null; const p = P(x); return { x, y: Math.min(ymax, p.total * mW), text: `r = ${fmt(x, 3)} mm · ${fmt(p.total * mW, 3)} mW/m` }; });
      // the vessel itself, in longitudinal section, with the Poiseuille profile
      L.h('p', 'lab-cap', c2, T('The same vessel cut along its axis, to scale across it. The arrows are the parabolic Poiseuille profile, twice the mean speed on the axis and zero at the wall; the slope at the wall is the shear stress the lining feels. Dashed: the optimal wall.', '同じ血管を軸に沿って切った断面で、横方向は縮尺どおりです。矢印は放物線形のポアズイユ流の速度分布で、軸上で平均速度の 2 倍、壁でゼロになります。壁での傾きが、内壁の受けるずり応力です。破線は最適な壁の位置です。'));
      const R = Math.max(v.r, rsm) * 1.25;
      const g = L.fig(c2, { x: [0, 10], y: [-R, R], aspect: 0.72, maxH: 380, xlabel: T('along the vessel (schematic)', '血管に沿った方向（模式的）'), ylabel: T('distance from axis (mm)', '軸からの距離（mm）') });
      g.rect(0, -v.r, 10, 2 * v.r, { fill: 'pos', fo: 0.12, nostroke: true, layer: 'under' });
      for (const sg of [1, -1]) { g.line([[0, sg * v.r], [10, sg * v.r]], { c: 'c4', w: 4 }); g.line([[0, sg * rsm], [10, sg * rsm]], { c: 'c3', w: 1.3, dash: '5 4' }); }
      const ubar = Q / (PI * r * r), ubarS = Q / (PI * rs * rs), sc = 5.6 / (2 * ubarS * 1.6), umax = 2 * ubar;
      const X0 = 1.6, len = (y) => Math.min(7.9, 2 * ubar * (1 - (y * y) / (v.r * v.r)) * sc);
      g.line(L.sample(-v.r, v.r, 80, (y) => [X0 + len(y), y]), { c: 'c1', w: 2.2 });
      g.seg([X0, -v.r], [X0, v.r], { c: 'muted', w: 1 });
      for (let i = 1; i < 12; i++) { const y = -v.r + (2 * v.r * i) / 12, L0 = len(y); if (L0 > 0.08) g.arrow([X0, y], [X0 + L0, y], { c: 'c1', w: 1.4 }); }
      if (2 * ubar * sc > 7.9) g.text(9.8, 0, T('profile clipped', '分布は途中で切っています'), { small: true, anchor: 'end', dy: -10, c: 'muted' });
      const tw = tau(r, Q, mu), ts = tauOpt(mu, b);
      g.text(9.8, v.r, `τ = ${fmt(tw, 3)} Pa`, { small: true, anchor: 'end', dy: 16, c: 'c4' });
      L.legend(ctx.host, [{ c: 'c1', label: T('pumping power 8μQ²/(πr⁴)', '送り出しの電力 8μQ²/(πr⁴)') }, { c: 'c2', label: T('upkeep of the blood bπr²', '血液の維持費 bπr²') }, { c: 'ink', label: T('total', '合計') }, { c: 'c3', dash: true, label: T('Murray optimum r*', 'マレーの最適値 r*') }, { kind: 'dot', c: 'hl', label: T('this vessel', 'この血管') }]);
      const extra = (Pc.total / Ps.total - 1) * 100;
      ctx.readout([
        { k: T('optimal radius r* = (16μQ²/π²b)^(1/6)', '最適半径 r* = (16μQ²/π²b)^(1/6)'), v: `${fmt(rsm, 3)} mm`, tone: 'key' },
        { k: T('cost of this radius vs the optimum', 'この半径の費用、最適値との比較'), v: `${fmt(Pc.total * mW, 3)} mW/m, ${extra < 0.05 ? T('optimal', '最適') : '+' + fmt(extra, 2) + '%'}` },
        { k: T('pumping : upkeep', '送り出し : 維持'), v: `${fmt(Pc.pump / Pc.vol, 3)} ${T('(1/2 at the optimum)', '（最適値では 1/2）')}` },
        { k: T('wall shear stress τ = 4μQ/(πr³)', '壁ずり応力 τ = 4μQ/(πr³)'), v: `${fmt(tw, 3)} Pa, ${T('optimum', '最適値')} √(bμ) = ${fmt(ts, 3)} Pa`, tone: Math.abs(tw / ts - 1) < 0.03 ? 'good' : undefined },
        { k: T('mean speed Q/(πr²)', '平均速度 Q/(πr²)'), v: `${fmt(ubar * 100, 3)} cm/s` },
      ], T(`Halving the radius multiplies the pumping power by 16 but saves only three quarters of the upkeep, which is why the minimum is lopsided: too narrow costs far more than too wide. At the optimum the flow is ${fmt(v.Q, 3)} mL/s = (π/4)√(b/μ) r*³, and the shear stress at the wall does not depend on Q at all.`, `半径を半分にすると送り出しの電力は 16 倍になりますが、維持費は四分の三しか減りません。そのため最小値の両側は非対称で、細すぎるほうが太すぎるよりずっと高くつきます。最適値では流量 ${fmt(v.Q, 3)} mL/s = (π/4)√(b/μ) r*³ が成り立ち、壁のずり応力は Q にまったくよりません。`));
    },
  };

  /* ================= 2. the junction: Murray's branching angles ================= */
  const VR = 0.42;                                    // display radius of the parent tube
  const VZ0 = -3.4, VZH = 2.4, XR = [-4.6, 4.6], YR = [-4.6, 4.2];
  const angleOf = (u) => Math.atan2(u[1], u[0]);
  function bifState(v) {
    const B = bifurcation(v.s, v.k), F = fermat(B), J = [v.jx, v.jy], C = cost(J, B), Cs = cost(F.J, B);
    const ang = anglesAt(J, B), angS = anglesAt(F.J, B), mur = murrayAngles(...B.r);
    return { B, F, J, C, Cs, ang, angS, mur };
  }
  function costRange(B, Cs) {
    let hi = 0; for (const x of [XR[0], XR[1]]) for (const y of [YR[0], YR[1]]) hi = Math.max(hi, cost([x, y], B));
    return [Cs, Cs + (hi - Cs) * 0.55];
  }
  D['murray-bifurcation'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const E = bifState(v), B = E.B, [lo, hi] = costRange(B, E.Cs);
      const zOf = (C) => VZ0 + VZH * Math.min(1.25, (C - lo) / (hi - lo));
      st.cap1.textContent = T('A parent vessel splits into two. Each tube is drawn at its radius, and below it hangs the cost of the whole junction, Σ wᵢ·lengthᵢ, as a bowl over every place the branch point could sit. Drag the gold junction: it costs least at the bottom of the bowl, the ring.', '親の血管が二本に分かれます。管はそれぞれの半径で描いてあり、その下には分岐点の置き場所ごとの分岐全体の費用 Σ wᵢ・長さᵢ を、お椀の形にして吊るしています。金色の分岐点をドラッグしてください。費用はお椀の底、輪の位置で最小になります。');
      st.cap2.textContent = T('The vessels pull on the junction like weighted strings. Left: each pull points along its vessel with strength w, the cost per metre, and the gold arrow is their sum. Right: the same pulls laid head to tail. They close into a triangle only at the optimum; the gold gap is the force that still slides the junction downhill.', '血管は、おもりの付いた糸のように分岐点を引っ張ります。左：それぞれの力は自分の血管の向きを向き、大きさは 1 m あたりの費用 w です。金色の矢印はその和です。右：同じ力を順につないだものです。最適点でだけ三角形が閉じ、金色の隙間は分岐点をまだ坂の下へ滑らせる力です。');
      const draw2d = () => {
        st.g2.replaceChildren();
        const pl = pull(E.J, B), wmax = Math.max(...B.w), u = (q) => [(1.1 * q[0]) / wmax, (1.1 * q[1]) / wmax];
        const g = L.fig(st.g2, { x: [-2.7, 2.7], y: [-1.45, 1.35], equal: true, maxH: 330, axes: false, grid: false });
        const cols = ['c2', 'c1', 'c3'], nm = [T('parent w₀', '親 w₀'), T('w₁', 'w₁'), T('w₂', 'w₂')];
        // left: the three pulls on the junction and their resultant
        const O = [-1.35, -0.05];
        g.text(O[0], 1.22, T('pulls on the junction', '分岐点にかかる力'), { small: true, anchor: 'middle', c: 'muted' });
        for (let i = 0; i < 3; i++) { const d = u(pl.parts[i]), tip = [O[0] + d[0], O[1] + d[1]], nn = Math.hypot(...d) || 1; g.arrow(O, tip, { c: cols[i], w: 3 }); g.text(tip[0] + (0.16 * d[0]) / nn, tip[1] + (0.16 * d[1]) / nn, nm[i], { small: true, c: cols[i], anchor: 'middle', dy: 4 }); }
        const net = u(pl.f), gap = Math.hypot(...net);
        if (gap > 0.012) g.arrow(O, [O[0] + net[0], O[1] + net[1]], { c: 'hl', w: 2.6, dash: '4 3' });
        g.dot(O[0], O[1], { c: 'ink', r: 3.5 });
        // right: the same pulls head to tail
        g.text(1.35, 1.22, T('head to tail', '順につなぐ'), { small: true, anchor: 'middle', c: 'muted' });
        const seq = [1, 2, 0], pts = [[0, 0]];
        for (const i of seq) { const d = u(pl.parts[i]), p = pts[pts.length - 1]; pts.push([p[0] + d[0], p[1] + d[1]]); }
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length, sh = (p) => [p[0] - cx + 1.35, p[1] - cy - 0.05];
        seq.forEach((i, j) => g.arrow(sh(pts[j]), sh(pts[j + 1]), { c: cols[i], w: 3 }));
        if (gap > 0.012) g.arrow(sh(pts[3]), sh(pts[0]), { c: 'hl', w: 2.4, dash: '4 3' });
        g.text(0, -1.38, gap > 0.012 ? T(`unbalanced: net pull ${fmt(gap * 100, 2)}% of the largest`, `釣り合っていません：合力は最大の力の ${fmt(gap * 100, 2)}%`) : T('balanced: the triangle closes', '釣り合い：三角形が閉じます'), { small: true, anchor: 'middle', c: gap > 0.012 ? 'hl' : 'c3' });
      };
      const readout = () => {
        const extra = (E.C / E.Cs - 1) * 100;
        ctx.readout([
          { k: T('daughter radii r₁/r₀, r₂/r₀ (rule r ∝ Q^(1/k))', '娘の半径 r₁/r₀、r₂/r₀（規則 r ∝ Q^(1/k)）'), v: `${fmt(B.r[1] / B.r[0], 3)}, ${fmt(B.r[2] / B.r[0], 3)}; r₁³ + r₂³ = ${fmt((B.r[1] ** 3 + B.r[2] ** 3) / B.r[0] ** 3, 3)} r₀³` },
          { k: T('cost per metre w₀ : w₁ : w₂', '1 m あたりの費用 w₀ : w₁ : w₂'), v: `1 : ${fmt(B.w[1] / B.w[0], 3)} : ${fmt(B.w[2] / B.w[0], 3)}` },
          { k: T('your junction: angles θ₁, θ₂; extra cost', 'あなたの分岐点：角 θ₁、θ₂、余分な費用'), v: `${fmt(E.ang[0], 3)}°, ${fmt(E.ang[1], 3)}°; +${fmt(Math.max(0, extra), 2)}%` },
          { k: T('optimal junction: θ₁, θ₂', '最適な分岐点：θ₁、θ₂'), v: E.F.vertex < 0 ? `${fmt(E.angS[0], 3)}°, ${fmt(E.angS[1], 3)}°` : T('at a vessel end (no branch angle)', '血管の端（分岐角なし）'), tone: 'key' },
          { k: T("Murray's formula cos θ₁ = (r₀⁴ + r₁⁴ − r₂⁴)/(2r₀²r₁²)", 'マレーの式 cos θ₁ = (r₀⁴ + r₁⁴ − r₂⁴)/(2r₀²r₁²)'), v: E.mur.ok ? `${fmt(E.mur.th1, 3)}°, ${fmt(E.mur.th2, 3)}°` : T('no real angle', '実数の角なし'), tone: Math.abs(v.k - 3) < 1e-9 ? 'good' : undefined },
        ], Math.abs(v.k - 3) < 1e-9 ? T("With radii obeying the cube law each vessel's cost per metre is (3/2)bπr², so the pulls go as r² and the balance point reproduces Murray's angle formula exactly. A symmetric split gives 37.5° on each side.", '半径が三乗則に従うと、各血管の 1 m あたりの費用は (3/2)bπr² なので、引く力は r² に比例し、釣り合いの点はマレーの角の式をそのまま再現します。対称な分岐では片側 37.5° です。')
          : T("Off the cube law the radii are no longer optimal, the pulls are no longer proportional to r², and Murray's formula, which assumes optimal vessels, stops predicting where the junction should sit.", '三乗則から外れると半径は最適でなくなり、引く力も r² に比例しなくなります。最適な血管を仮定するマレーの式は、分岐点のあるべき位置を予言しなくなります。'));
      };
      L.legend(st.leg, [{ c: 'c2', label: T('parent', '親') }, { c: 'c1', label: T('daughter 1 (share s)', '娘 1（割合 s）') }, { c: 'c3', label: T('daughter 2 (share 1 − s)', '娘 2（割合 1 − s）') }, { kind: 'dot', c: 'hl', label: T('junction you place', 'あなたの置く分岐点') }, { kind: 'fill', c: 'c3', label: T('cost bowl: deeper teal is cheaper', '費用のお椀：濃い青緑ほど安い') }]);
      draw2d(); readout();
      const key = `${v.s}|${v.k}`;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 520, camera: [8.6, -13.2, 11.4], target: [0, -0.4, -1.4], fov: 32,
        label: T('3D junction of three vessels over its cost bowl. Drag to rotate; drag the gold junction to move the branch point.', '費用のお椀の上にある三本の血管の分岐の 3D 図。ドラッグで回転、金色の分岐点をドラッグで分岐点を動かせます。'),
        init(S) {
          st.flat = false; st.S = S; st.key = null;
          st.tubes = [];
          st.caps = [0, 1, 2].map((i) => S.sphere([0, 0, 0], 0.3, { c: ['c2', 'c1', 'c3'][i] }));
          st.jball = S.sphere([0, 0, 0], 0.5, { c: 'c2' });
          st.drop = S.lines([], { c: 'hl', opacity: 0.9 });
          st.onSurf = S.sphere([0, 0, 0], 0.16, { c: 'hl' });
          st.best = new S.THREE.Mesh(new S.THREE.TorusGeometry(0.34, 0.07, 12, 48), S.mat('ink', { metal: 0.4, rough: 0.3 })); S.add(st.best);
          st.hdl = S.handle([0, 0, 0], { c: 'hl', r: 0.24, plane: [[0, 0, 1], [0, 0, 0.7]], label: T('junction', '分岐点'), onDrag: (q) => { const x = clamp(Math.round(q.x * 100) / 100, -3.5, 3.5), y = clamp(Math.round(q.y * 100) / 100, -3.5, 2.6); st.ctx.set('jx', x, true); st.ctx.set('jy', y); return [x, y, 0.7]; } });
          st.lab = [S.label(T('parent', '親'), [JA[0] + 0.5, JA[1], 0.3], { small: true }), S.label(T('daughter 1', '娘 1'), [JB1[0] + 0.3, JB1[1] + 0.6, 0.3], { small: true, align: 'middle' }), S.label(T('daughter 2', '娘 2'), [JB2[0] - 0.5, JB2[1] + 0.6, 0.3], { small: true, align: 'middle' }), S.label(T('cheapest', '最安'), [0, 0, 0], { small: true, c: 'ink' })];
        },
        update(S) {
          if (st.key !== key) {
            st.key = key;
            st.surf?.removeFromParent();
            st.surf = S.graph((x, y) => zOf(cost([x, y], B)), { x: XR, y: YR, nu: 90, nv: 86, colour: (u, w, p) => S.colour('c3').clone().lerp(S.colour('plate'), Math.min(1, (p[2] - VZ0) / (VZH * 1.25)) * 0.88), opacity: 0.94, wire: true, wireEvery: 6 });
            st.surf.castShadow = false;
          }
          const J = [...E.J, 0];
          const rr = (i) => VR * B.r[i] / B.r[0];
          B.pts.forEach((P, i) => {
            const ends = [[P[0], P[1], 0], J];
            if (!st.tubes[i] || st.tubes[i].userData.r !== rr(i)) { st.tubes[i]?.removeFromParent(); st.tubes[i] = S.tube(ends, { r: rr(i), radial: 36, segments: 8, c: ['c2', 'c1', 'c3'][i], rough: 0.28, coat: 0.7 }); st.tubes[i].userData.r = rr(i); }
            else st.tubes[i].update(ends);
          });
          B.pts.forEach((P, i) => { st.caps[i].at([P[0], P[1], 0]); st.caps[i].scale.setScalar(rr(i)); });
          st.jball.at(J); st.jball.scale.setScalar(Math.max(rr(0), rr(1), rr(2)) * 1.02);
          st.hdl.at([J[0], J[1], 0.7]);
          const zj = zOf(E.C), zs = zOf(E.Cs);
          st.onSurf.at([J[0], J[1], zj]);
          st.drop.update([[[J[0], J[1], -0.1], [J[0], J[1], zj + 0.12]]]);
          st.best.position.set(E.F.J[0], E.F.J[1], zs + 0.05);
          st.lab[3].set([E.F.J[0] + 0.55, E.F.J[1], zs + 0.05]);
          S.fitStage?.(); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: XR, y: YR, equal: true, maxH: 460, axes: false, grid: false });
          f.raster((x, y) => Math.min(1, (cost([x, y], B) - lo) / (hi - lo)), { cmap: 'seq', res: 5 });
          B.pts.forEach((P, i) => f.seg(P, E.J, { c: ['c2', 'c1', 'c3'][i], w: 6 + 22 * (B.r[i] / B.r[0]) * VR }));
          f.circle(E.F.J[0], E.F.J[1], 0.3, { c: 'ink', w: 2.5 });
          f.handle(E.J[0], E.J[1], { c: 'hl', bounds: [-3.5, 3.5, -3.5, 2.6], label: T('junction', '分岐点'), onDrag: (x, y) => { ctx.set('jx', Math.round(x * 100) / 100, true); ctx.set('jy', Math.round(y * 100) / 100); } });
        },
      });
    },
  };

  /* ================= 3. the tree: one law, all the way down ================= */
  const R0 = 0.36, LEN = 7.2;
  function treeGeom(G, s) {
    const segs = treeSegs(G, s), a = murrayAngles(1, Math.cbrt(s), Math.cbrt(1 - s));
    const t1 = a.th1 * DEG, t2 = a.th2 * DEG, nrm = (p) => { const n = Math.hypot(...p) || 1; return [p[0] / n, p[1] / n, p[2] / n]; };
    const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const comb = (p, cp, q, cq) => [p[0] * cp + q[0] * cq, p[1] * cp + q[1] * cq, p[2] * cp + q[2] * cq];
    for (const q of segs) {
      q.r3 = R0 * Math.cbrt(q.Q); q.len = LEN * q.r3;
      if (q.parent < 0) { q.p0 = [0, 0, 0]; q.d = [0, 0, 1]; q.n = [1, 0, 0]; }
      else {
        const P = segs[q.parent], th = q.side === 1 ? t1 : -t2;
        q.p0 = P.p1; q.d = nrm(comb(P.d, Math.cos(th), P.n, Math.sin(th)));
        q.n = nrm(cross(q.d, P.n));
      }
      q.p1 = [q.p0[0] + q.d[0] * q.len, q.p0[1] + q.d[1] * q.len, q.p0[2] + q.d[2] * q.len];
    }
    return segs;
  }
  D['murray-tree'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1);
        st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.bar = L.h('div', '', st.frame); st.leg = L.h('div', '', st.frame);
      }
      const G = v.gen, s = v.s, k = v.k, show = v.show;
      const segs = treeGeom(G, s);
      for (const q of segs) { q.rk = R0 * Math.pow(q.Q, 1 / k); q.tau = Math.pow(q.Q, 1 - 3 / k); q.u = Math.pow(q.Q, 1 - 2 / k); }
      const val = (q) => Math.log2(show ? q.u : q.tau);
      const span = 3;
      st.cap1.textContent = T('A branching tree in which every vessel splits its flow s : 1 − s, branches leave at Murray’s angles, and the radii follow r ∝ Q^(1/k). Color is the wall shear stress (or the mean speed) relative to the root. At k = 3 the whole tree turns one color. The gold dots are blood moving at the mean speed.', 'どの血管も流量を s : 1 − s に分け、枝はマレーの角で分かれ、半径は r ∝ Q^(1/k) に従う分岐の木です。色は根もとに対する壁ずり応力（または平均速度）です。k = 3 では木全体が一色になります。金色の点は平均速度で流れる血液です。');
      st.cap2.textContent = T('Total cost of the best tree with radii r = cQ^(1/k), the scale c chosen optimally, relative to the cube law. Every other exponent costs more.', '半径 r = cQ^(1/k) の木のうち最良のもの（尺度 c を最適に選んだもの）の全費用を、三乗則に対する比で示します。ほかのどの指数でも費用は増えます。');
      st.cap3.textContent = show ? T('Mean speed relative to the root, generation by generation, along the path that always takes the larger share and along the one that always takes the smaller.', '根もとに対する平均速度を、世代ごとに描いています。常に大きいほうの枝をたどる経路と、常に小さいほうをたどる経路です。') : T('Wall shear stress relative to the root, generation by generation, along the path that always takes the larger share and along the one that always takes the smaller.', '根もとに対する壁ずり応力を、世代ごとに描いています。常に大きいほうの枝をたどる経路と、常に小さいほうをたどる経路です。');
      // ---- cost against exponent
      st.g2.replaceChildren(); st.g3.replaceChildren(); st.leg.replaceChildren();
      const ks = L.sample(2, 4, 81, (x) => [x, treeCostRatio(G, s, x)]), ymax = Math.max(1.25, ...ks.map((q) => q[1])) * 1.04;
      const f = L.fig(st.g2, { x: [2, 4], y: [0.98, ymax], aspect: 0.5, maxH: 220, xlabel: T('radius exponent k', '半径の指数 k'), ylabel: T('cost ÷ cube-law cost', '費用 ÷ 三乗則の費用') });
      f.line(ks, { c: 'c1', w: 2.4 }); f.vline(3, { c: 'c3', dash: '5 4' });
      f.text(3, ymax, T('Murray, k = 3', 'マレー、k = 3'), { small: true, c: 'c3', dx: 6, dy: 14 });
      f.handle(k, treeCostRatio(G, s, k), { c: 'hl', axis: 'x', snap: 0.05, bounds: [2, 4, 0.98, ymax], label: T('exponent', '指数'), onDrag: (x) => ctx.set('k', Math.round(clamp(x, 2, 4) * 20) / 20) });
      // ---- ratio along the paths
      const gs = L.seq(G + 1, (g) => g), big = Math.max(s, 1 - s), sml = Math.min(s, 1 - s);
      const rat = (g, q) => (show ? speedRatio(g, q, k) : tauRatio(g, q, k));
      const pa = gs.map((g) => [g, Math.log2(rat(g, big))]), pb = gs.map((g) => [g, Math.log2(rat(g, sml))]);
      const yl = Math.max(1, ...pa.map((q) => Math.abs(q[1])), ...pb.map((q) => Math.abs(q[1]))) * 1.1;
      const h = L.fig(st.g3, { x: [0, Math.max(2, G)], y: [-yl, yl], aspect: 0.5, maxH: 220, xlabel: T('generation', '世代'), ylabel: show ? T('log₂ (u / u₀)', 'log₂ (u / u₀)') : T('log₂ (τ / τ₀)', 'log₂ (τ / τ₀)') });
      h.hline(0, { c: 'muted', w: 1 });
      h.line(pa, { c: 'c2', w: 2.4 }); h.line(pb, { c: 'c4', w: 2.4, dash: s === 0.5 ? '6 4' : false });
      pa.forEach((q) => h.dot(q[0], q[1], { c: 'c2', r: 3 })); pb.forEach((q) => h.dot(q[0], q[1], { c: 'c4', r: 3 }));
      L.legend(st.leg, [{ kind: 'fill', c: 'c3', label: T('same as the root', '根もとと同じ') }, { kind: 'fill', c: 'c1', label: show ? T('slower than the root', '根もとより遅い') : T('less shear than the root', '根もとよりずり応力が小さい') }, { kind: 'fill', c: 'pos', label: show ? T('faster than the root', '根もとより速い') : T('more shear than the root', '根もとよりずり応力が大きい') }, { c: 'c2', label: T('always the larger share', '常に大きいほう') }, { c: 'c4', label: T('always the smaller share', '常に小さいほう') }, { kind: 'dot', c: 'hl', label: T('blood moving at the mean speed', '平均速度で動く血液') }]);
      const leaves = 2 ** G, tl = Math.pow(1 - s, 1 / k) ** G, cr = treeCostRatio(G, s, k);
      const sumR = (gg) => { let a = 0; for (const q of segs) if (q.g === gg) a += q.rk ** 2; return a / R0 ** 2; };
      ctx.readout([
        { k: T('vessels: segments, leaves', '血管：区間の数、末端の数'), v: `${segs.length}, ${leaves}` },
        { k: T('cost relative to the cube law', '三乗則に対する費用'), v: k === 3 ? T('1 (the minimum)', '1（最小）') : `${fmt(cr, 4)} (+${fmt((cr - 1) * 100, 2)}%)`, tone: 'key' },
        { k: T('shear stress at the last generation, larger and smaller paths', '最終世代の壁ずり応力、大きい経路と小さい経路'), v: `${fmt(tauRatio(G, big, k), 3)} τ₀, ${fmt(tauRatio(G, sml, k), 3)} τ₀`, tone: Math.abs(k - 3) < 1e-9 ? 'good' : undefined },
        { k: T('total cross-section, generation G ÷ root', '全断面積、第 G 世代 ÷ 根もと'), v: fmt(sumR(G), 3) },
        { k: T('smallest radius ÷ root radius', '最小半径 ÷ 根もとの半径'), v: fmt(tl, 3) },
      ], Math.abs(k - 3) < 1e-9 ? T('Under the cube law τ ∝ Q/r³ is the same in every vessel, and since both the length (drawn here) and the mean speed go as r, blood spends the same time in each generation. The total cross-section grows by 2^(1/3) at every symmetric split, so blood slows as it spreads out.', '三乗則のもとでは τ ∝ Q/r³ はどの血管でも同じです。長さ（ここでの描き方）も平均速度も r に比例するので、血液はどの世代でも同じ時間を過ごします。対称な分岐のたびに全断面積は 2^(1/3) 倍になるので、血液は広がるにつれて遅くなります。')
        : k < 3 ? T('With k < 3 the daughters are too thin for their flow: shear stress and pumping cost climb towards the leaves. Area-preserving branching, k = 2, keeps the mean speed constant at a large price.', 'k < 3 では娘の血管は流量に対して細すぎます。末端に向かってずり応力と送り出しの費用が増えていきます。断面積を保つ分岐 k = 2 では平均速度が一定になりますが、大きな代償を払います。')
          : T('With k > 3 the daughters are too wide: the shear stress falls towards the leaves and the tree holds more blood than it needs.', 'k > 3 では娘の血管は太すぎます。末端に向かってずり応力が下がり、木は必要以上の血液を抱えます。'));
      // ---- particles: deterministic paths chosen in proportion to flow
      const hash = (i, j) => { const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); };
      const NP = 150, paths = [];
      for (let i = 0; i < NP; i++) {
        const path = [0]; let cur = 0;
        for (let g = 0; g < G; g++) { const kids = segs.map((q, j) => j).filter((j) => segs[j].parent === cur); const pick = hash(i, g) < s ? kids.find((j) => segs[j].side === 1) : kids.find((j) => segs[j].side === 2); cur = pick; path.push(cur); }
        const times = path.map((j) => segs[j].len / (segs[j].u * 1.6)), Tt = times.reduce((a, b) => a + b, 0);
        paths.push({ path, times, Tt, ph: hash(i, 99), lat: [Math.sqrt(hash(i, 7)) * 0.62, hash(i, 8) * TAU] });
      }
      const posAt = (P, t) => {
        let tt = (((t + P.ph * P.Tt) % P.Tt) + P.Tt) % P.Tt, j = 0;
        while (j < P.path.length - 1 && tt > P.times[j]) { tt -= P.times[j]; j++; }
        const q = segs[P.path[j]], f0 = clamp(tt / P.times[j], 0, 1), e1 = q.n, e2 = [q.d[1] * e1[2] - q.d[2] * e1[1], q.d[2] * e1[0] - q.d[0] * e1[2], q.d[0] * e1[1] - q.d[1] * e1[0]];
        const rr = P.lat[0] * q.rk, c = Math.cos(P.lat[1]) * rr, d = Math.sin(P.lat[1]) * rr;
        return [q.p0[0] + q.d[0] * q.len * f0 + e1[0] * c + e2[0] * d, q.p0[1] + q.d[1] * q.len * f0 + e1[1] * c + e2[1] * d, q.p0[2] + q.d[2] * q.len * f0 + e1[2] * c + e2[2] * d];
      };
      st.t = st.t ?? 0.8;
      const poseDots = (t) => { if (st.flat || !st.dots) return; st.dots.update(paths.map((P) => posAt(P, t))); st.S.invalidate(); };
      st.poseDots = poseDots;
      if (!st.anim) st.anim = L.animator(st.bar, (dt, t) => { st.t = t; st.poseDots?.(t); }, { autoplay: true, initialT: 0.8, playLabel: T('Play: blood flow', '再生：血液の流れ') });
      const sKey = `${G}|${s}`;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 1.0, maxH: 560, camera: [9, -12, 6.5], target: [0, 0, 4], fov: 34,
        label: T('3D vascular tree colored by wall shear stress. Drag to rotate.', '壁ずり応力で色分けした血管の木の 3D 図。ドラッグで回転できます。'),
        init(S) { st.flat = false; st.S = S; st.key = null; },
        update(S) {
          const TH = S.THREE;
          if (st.key !== sKey) {
            st.key = sKey;
            for (const o of st.objs ?? []) o.removeFromParent();
            st.objs = [];
            const n = segs.length;
            const geo = new TH.CylinderGeometry(1, 1, 1, 18, 1, true).rotateX(PI / 2).translate(0, 0, 0.5);
            const mat = S.mat(new TH.Color(1, 1, 1), { rough: 0.32, coat: 0.7 });
            st.cyl = new TH.InstancedMesh(geo, mat, n); st.cyl.castShadow = true;
            st.jnt = new TH.InstancedMesh(new TH.SphereGeometry(1, 20, 14), S.mat(new TH.Color(1, 1, 1), { rough: 0.32, coat: 0.7 }), n); st.jnt.castShadow = true;
            const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
            for (const q of segs) for (const p of [q.p0, q.p1]) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i]); hi[i] = Math.max(hi[i], p[i]); }
            const bb = new TH.Mesh(new TH.BoxGeometry(hi[0] - lo[0] + 0.6, hi[1] - lo[1] + 0.6, hi[2] - lo[2] + 0.2), new TH.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            bb.position.set((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2); bb.castShadow = false;
            st.dots = S.points(paths.map(() => [0, 0, 0]), { c: 'hl', r: 0.075, max: NP, glow: 0.7 }); st.dots.castShadow = false;
            st.objs.push(st.cyl, st.jnt, bb, st.dots); S.add(st.cyl); S.add(st.jnt); S.add(bb);
            st.lab0 = st.lab0 ?? S.label(T('root', '根もと'), [0.6, 0, 0.6], { small: true });
            S.look([hi[0] + (hi[2] - lo[2]) * 0.9, lo[1] - (hi[2] - lo[2]) * 1.15, hi[2] * 0.85], [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) * 0.45], true);
          }
          const m4 = new TH.Matrix4(), qt = new TH.Quaternion(), z = new TH.Vector3(0, 0, 1), col = new TH.Color();
          segs.forEach((q, i) => {
            qt.setFromUnitVectors(z, new TH.Vector3(...q.d));
            m4.compose(new TH.Vector3(...q.p0), qt, new TH.Vector3(q.rk, q.rk, q.len)); st.cyl.setMatrixAt(i, m4);
            m4.compose(new TH.Vector3(...q.p1), qt, new TH.Vector3(q.rk, q.rk, q.rk)); st.jnt.setMatrixAt(i, m4);
            { const t = clamp(val(q) / span, -1, 1); col.copy(S.colour('c3')).lerp(S.colour(t >= 0 ? 'pos' : 'c1'), Math.abs(t)); } st.cyl.setColorAt(i, col); st.jnt.setColorAt(i, col);
          });
          st.cyl.instanceMatrix.needsUpdate = st.jnt.instanceMatrix.needsUpdate = true;
          if (st.cyl.instanceColor) st.cyl.instanceColor.needsUpdate = true; if (st.jnt.instanceColor) st.jnt.instanceColor.needsUpdate = true;
          st.cyl.computeBoundingSphere?.(); st.jnt.computeBoundingSphere?.();
          st.poseDots(st.t);
          S.fitStage?.(); S.invalidate();
        },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          // the same tree with every bifurcation laid in one plane (x, z)
          const flat = treeSegs(G, s), a = murrayAngles(1, Math.cbrt(s), Math.cbrt(1 - s));
          let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
          for (const q of flat) {
            q.len = LEN * R0 * Math.cbrt(q.Q); q.rk = R0 * Math.pow(q.Q, 1 / k); q.tau = Math.pow(q.Q, 1 - 3 / k); q.u = Math.pow(q.Q, 1 - 2 / k);
            if (q.parent < 0) { q.p0 = [0, 0]; q.ang = PI / 2; } else { const P = flat[q.parent]; q.p0 = P.p1; q.ang = P.ang + (q.side === 1 ? a.th1 : -a.th2) * DEG * (P.g % 2 ? -1 : 1); }
            q.p1 = [q.p0[0] + Math.cos(q.ang) * q.len, q.p0[1] + Math.sin(q.ang) * q.len];
            for (const p of [q.p0, q.p1]) { lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1])]; hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1])]; }
          }
          const fg = L.fig(st.v3, { x: [lo[0] - 0.4, hi[0] + 0.4], y: [lo[1] - 0.3, hi[1] + 0.3], equal: true, maxH: 480, axes: false, grid: false });
          const px = fg.X(1) - fg.X(0);
          const cs = L.colours(), mix = (p, q, t) => p.map((x, i) => Math.round(x + (q[i] - x) * t));
          for (const q of flat) { const t = clamp(val(q) / span, -1, 1), c = t >= 0 ? mix(cs.c3, cs.pos, t) : mix(cs.c3, cs.c1, -t); const ln = fg.seg(q.p0, q.p1, { w: Math.max(1, 2 * q.rk * px) }); ln.style.stroke = `rgb(${c.join(',')})`; ln.style.strokeLinecap = 'round'; }
        },
      });
    },
  };
})();
