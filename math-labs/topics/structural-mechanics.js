'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------------- models (no DOM) ----------------
   * 1. A plane truss on pin and roller supports, solved by the method of joints as one linear system: every joint
   *    contributes two equilibrium equations, the unknowns are the member forces (tension positive) and the
   *    three support reactions. A determinate truss has members + 3 = 2 x joints.
   * 2. An Euler-Bernoulli beam by Hermite finite elements. Deflection y is positive downward, M is the sagging
   *    moment; shear and moment come from statics once the support reactions are known.
   * 3. Buckling of a column: the lateral deflection satisfies w'' + k^2 w = 0 between constraints, with
   *    w = A sin(k x) + B cos(k x) + C x + D on each segment. The end conditions (and an optional rigid lateral brace)
   *    give a square homogeneous system; its determinant vanishes at the critical loads P = k^2 EI. */
  function gauss(A, n) {
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-13) return null;
      if (p !== c) { const t = A[c]; A[c] = A[p]; A[p] = t; }
      for (let r = c + 1; r < n; r++) {
        const f = A[r][c] / A[c][c];
        if (f) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
      }
    }
    const x = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = A[r][n]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    return x;
  }

  /* ---- 1. truss ---- */
  const TL = 24;                                    // span (m)
  const TYPES = ['Pratt', 'Howe', 'Warren'];
  function trussGeom(type, n, h) {
    const s = TL / n, nodes = [], mem = [];
    for (let i = 0; i <= n; i++) nodes.push([i * s, 0]);
    if (type === 2) {
      for (let i = 0; i < n; i++) nodes.push([(i + 0.5) * s, h]);
      for (let i = 0; i < n; i++) mem.push([i, i + 1]);
      for (let i = 0; i < n - 1; i++) mem.push([n + 1 + i, n + 2 + i]);
      for (let i = 0; i < n; i++) { mem.push([i, n + 1 + i]); mem.push([n + 1 + i, i + 1]); }
    } else {
      for (let i = 0; i <= n; i++) nodes.push([i * s, h]);
      for (let i = 0; i < n; i++) { mem.push([i, i + 1]); mem.push([n + 1 + i, n + 2 + i]); }
      for (let i = 0; i <= n; i++) mem.push([i, n + 1 + i]);
      for (let i = 0; i < n; i++) {
        const left = i < n / 2;
        if (type === 0) mem.push(left ? [n + 1 + i, i + 1] : [n + 2 + i, i]);   // Pratt: diagonals fall toward the middle
        else mem.push(left ? [i, n + 2 + i] : [i + 1, n + 1 + i]);              // Howe: diagonals rise toward the middle
      }
    }
    return { nodes, mem, n, s, h, type };
  }
  const nodeName = (g, k) => (k <= g.n ? 'L' + k : 'U' + (g.type === 2 ? k - g.n : k - g.n - 1));
  const memName = (g, c) => nodeName(g, g.mem[c][0]) + nodeName(g, g.mem[c][1]);
  const memLen = (g, c) => Math.hypot(g.nodes[g.mem[c][1]][0] - g.nodes[g.mem[c][0]][0], g.nodes[g.mem[c][1]][1] - g.nodes[g.mem[c][0]][1]);
  // load P (kN, downward) at x on the deck, shared to the two joints either side by the lever rule
  function trussSolve(g, P, x) {
    const { nodes, mem, n, s } = g, J = nodes.length, m = mem.length, N = 2 * J;
    if (m + 3 !== N) throw new Error('truss is not statically determinate');
    const A = Array.from({ length: N }, () => new Float64Array(N + 1));
    mem.forEach(([i, j], c) => {
      const dx = nodes[j][0] - nodes[i][0], dz = nodes[j][1] - nodes[i][1], l = Math.hypot(dx, dz), ex = dx / l, ez = dz / l;
      A[2 * i][c] += ex; A[2 * i + 1][c] += ez; A[2 * j][c] -= ex; A[2 * j + 1][c] -= ez;
    });
    A[0][m] = 1; A[1][m + 1] = 1; A[2 * n + 1][m + 2] = 1;
    const k = Math.max(0, Math.min(n - 1, Math.floor(x / s + 1e-9))), lam = Math.min(1, Math.max(0, x / s - k));
    const nodal = new Float64Array(J);
    nodal[k] += P * (1 - lam); nodal[k + 1] += P * lam;
    for (let j = 0; j < J; j++) A[2 * j + 1][N] = nodal[j];
    const u = gauss(A, N);
    if (!u) throw new Error('singular truss');
    return { F: Array.from(u.slice(0, m)), Rax: u[m], Ray: u[m + 1], Rby: u[m + 2], nodal, P, x };
  }
  // sagging moment of the whole truss, as a beam, at a distance xs from the left support
  function trussMoment(g, sol, xs) {
    let M = sol.Ray * xs;
    for (let j = 0; j <= g.n; j++) M -= sol.nodal[j] * Math.max(0, xs - g.nodes[j][0]);
    return M;
  }
  // forces acting on joint j: members pull toward their far end when in tension
  function jointForces(g, sol, j) {
    const out = [];
    g.mem.forEach(([a, b], c) => {
      if (a !== j && b !== j) return;
      const o = a === j ? b : a, dx = g.nodes[o][0] - g.nodes[j][0], dz = g.nodes[o][1] - g.nodes[j][1], l = Math.hypot(dx, dz);
      out.push({ kind: 'member', c, name: memName(g, c), vec: [sol.F[c] * dx / l, sol.F[c] * dz / l], f: sol.F[c] });
    });
    if (j === 0) out.push({ kind: 'reaction', name: 'R', vec: [sol.Rax, sol.Ray] });
    if (j === g.n) out.push({ kind: 'reaction', name: 'R', vec: [0, sol.Rby] });
    if (sol.nodal[j] > 1e-12) out.push({ kind: 'load', name: 'P', vec: [0, -sol.nodal[j]] });
    return out;
  }

  /* ---- 2. beam ---- */
  const BL = 6, BEAM_B = 0.15, E_STEEL = 200e6;      // length (m), width (m), E in kN/m^2
  const secI = (hmm) => BEAM_B * Math.pow(hmm / 1000, 3) / 12;
  // sup: 0 cantilever (fixed at x = 0), 1 simple, 2 fixed-fixed, 3 propped (fixed at 0, pin at L)
  function beamSolve(sup, P, a, w, EI, nel = 48) {
    const xs = [];
    for (let i = 0; i <= nel; i++) xs.push(BL * i / nel);
    let ia = xs.findIndex((x) => Math.abs(x - a) < 1e-9);
    if (ia < 0) { xs.push(a); xs.sort((p, q) => p - q); ia = xs.indexOf(a); }
    const Nn = xs.length, nd = 2 * Nn;
    const K = Array.from({ length: nd }, () => new Float64Array(nd)), F = new Float64Array(nd);
    for (let e = 0; e < Nn - 1; e++) {
      const l = xs[e + 1] - xs[e], c = EI / (l * l * l), o = 2 * e;
      const k = [[12, 6 * l, -12, 6 * l], [6 * l, 4 * l * l, -6 * l, 2 * l * l], [-12, -6 * l, 12, -6 * l], [6 * l, 2 * l * l, -6 * l, 4 * l * l]];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) K[o + i][o + j] += c * k[i][j];
      F[o] += w * l / 2; F[o + 1] += w * l * l / 12; F[o + 2] += w * l / 2; F[o + 3] -= w * l * l / 12;
    }
    F[2 * ia] += P;
    const last = 2 * (Nn - 1);
    const fixed = sup === 0 ? [0, 1] : sup === 1 ? [0, last] : sup === 2 ? [0, 1, last, last + 1] : [0, 1, last];
    const free = []; for (let i = 0; i < nd; i++) if (!fixed.includes(i)) free.push(i);
    const A = free.map((i) => { const r = new Float64Array(free.length + 1); free.forEach((j, c) => { r[c] = K[i][j]; }); r[free.length] = F[i]; return r; });
    const sol = free.length ? gauss(A, free.length) : [];
    const u = new Float64Array(nd); free.forEach((i, c) => { u[i] = sol[c]; });
    const react = (i) => { let s = -F[i]; for (let j = 0; j < nd; j++) s += K[i][j] * u[j]; return s; };
    const R0 = -react(0), M0 = sup === 1 ? 0 : react(1);
    const RL = P + w * BL - R0;
    const el = (x) => { let lo = 0, hi = Nn - 2; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid - 1; } return lo; };
    const at = (x) => {
      const e = el(x), l = xs[e + 1] - xs[e], s = Math.min(1, Math.max(0, (x - xs[e]) / l)), o = 2 * e;
      const y = (1 - 3 * s * s + 2 * s ** 3) * u[o] + l * (s - 2 * s * s + s ** 3) * u[o + 1] + (3 * s * s - 2 * s ** 3) * u[o + 2] + l * (-s * s + s ** 3) * u[o + 3];
      const th = ((-6 * s + 6 * s * s) * u[o] + l * (1 - 4 * s + 3 * s * s) * u[o + 1] + (6 * s - 6 * s * s) * u[o + 2] + l * (-2 * s + 3 * s * s) * u[o + 3]) / l;
      return { y, th };
    };
    const V = (x, side = 0) => R0 - (x > a + 1e-12 || (side > 0 && x >= a - 1e-12) ? P : 0) - w * x;
    const M = (x) => M0 + R0 * x - P * Math.max(0, x - a) - w * x * x / 2;
    return { sup, P, a, w, EI, xs, u, R0, M0, RL, ML: M(BL), at, V, M, y: (x) => at(x).y, th: (x) => at(x).th };
  }
  function beamExtremes(b) {
    let m = 0, y = 0, v = 0;
    for (let i = 0; i <= 240; i++) { const x = BL * i / 240; m = Math.max(m, Math.abs(b.M(x))); y = Math.max(y, Math.abs(b.y(x))); v = Math.max(v, Math.abs(b.V(x, -1)), Math.abs(b.V(x, 1))); }
    return { M: m, y, V: v };
  }

  /* ---- 3. column ---- */
  const ENDS = [['p', 'p'], ['f', 'free'], ['f', 'f'], ['f', 'p']];     // base, top
  function colMatrix(kap, bc, b) {
    const [e0, e1] = ENDS[bc], cols = b == null ? 4 : 8, M = [];
    const sn = (x) => Math.sin(kap * x), cs = (x) => Math.cos(kap * x);
    const row = (seg, vals) => { const r = new Float64Array(cols); for (let i = 0; i < 4; i++) r[seg * 4 + i] = vals[i]; return r; };
    const W = (x) => [sn(x), cs(x), x, 1], W1 = (x) => [kap * cs(x), -kap * sn(x), 1, 0], W2 = (x) => [sn(x), cs(x), 0, 0], SH = [0, 0, 1, 0];
    const end = (type, x, seg) => (type === 'p' ? [row(seg, W(x)), row(seg, W2(x))] : type === 'f' ? [row(seg, W(x)), row(seg, W1(x))] : [row(seg, W2(x)), row(seg, SH)]);
    M.push(...end(e0, 0, 0));
    M.push(...end(e1, 1, b == null ? 0 : 1));
    if (b != null) {
      M.push(row(0, W(b)), row(1, W(b)));
      const d1 = new Float64Array(8), d2 = new Float64Array(8);
      W1(b).forEach((q, i) => { d1[i] = q; d1[4 + i] = -q; });
      W2(b).forEach((q, i) => { d2[i] = q; d2[4 + i] = -q; });
      M.push(d1, d2);
    }
    return M;
  }
  function det(M) {
    const n = M.length, A = M.map((r) => Float64Array.from(r));
    let d = 1;
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (A[p][c] === 0) return 0;
      if (p !== c) { const t = A[c]; A[c] = A[p]; A[p] = t; d = -d; }
      d *= A[c][c];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; }
    }
    return d;
  }
  // critical values of kappa = k L, lowest first (P = kappa^2 EI / L^2)
  function colKappas(bc, b, count = 3) {
    const out = [], dk = 0.02;
    let k0 = 0.25, d0 = det(colMatrix(k0, bc, b));
    for (let k = k0 + dk; k < 30 && out.length < count; k += dk) {
      const d1 = det(colMatrix(k, bc, b));
      if (d0 * d1 < 0) {
        let lo = k - dk, hi = k, dl = d0;
        for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2, dm = det(colMatrix(mid, bc, b)); if (dl * dm <= 0) hi = mid; else { lo = mid; dl = dm; } }
        out.push((lo + hi) / 2);
      }
      d0 = d1;
    }
    return out;
  }
  function nullvec(M) {
    const n = M.length, A = M.map((r) => Array.from(r)), perm = Array.from({ length: n }, (_, i) => i);
    for (let c = 0; c < n - 1; c++) {
      let pr = c, pc = c, best = -1;
      for (let r = c; r < n; r++) for (let k = c; k < n; k++) if (Math.abs(A[r][k]) > best) { best = Math.abs(A[r][k]); pr = r; pc = k; }
      [A[c], A[pr]] = [A[pr], A[c]];
      if (pc !== c) { for (let r = 0; r < n; r++) { const t = A[r][c]; A[r][c] = A[r][pc]; A[r][pc] = t; } const t = perm[c]; perm[c] = perm[pc]; perm[pc] = t; }
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; }
    }
    const y = new Array(n).fill(0); y[n - 1] = 1;
    for (let r = n - 2; r >= 0; r--) { let s = 0; for (let k = r + 1; k < n; k++) s += A[r][k] * y[k]; y[r] = -s / A[r][r]; }
    const x = new Array(n); perm.forEach((orig, i) => { x[orig] = y[i]; });
    return x;
  }
  // mode shape w(xi), xi = z / L in [0, 1], scaled so that max |w| = 1
  function colMode(bc, b, kap) {
    const c = nullvec(colMatrix(kap, bc, b));
    const raw = (xi) => { const o = b != null && xi > b ? 4 : 0; return c[o] * Math.sin(kap * xi) + c[o + 1] * Math.cos(kap * xi) + c[o + 2] * xi + c[o + 3]; };
    let mx = 0, sg = 1;
    for (let i = 0; i <= 200; i++) { const v = raw(i / 200); if (Math.abs(v) > Math.abs(mx)) { mx = v; } }
    sg = mx < 0 ? -1 : 1;
    const sc = sg / (Math.abs(mx) || 1);
    return (xi) => raw(xi) * sc;
  }
  // tube used in the lab: 60 x 4 mm steel
  const TUBE = (() => { const D0 = 0.06, d0 = 0.052; const I = PI / 64 * (D0 ** 4 - d0 ** 4), A = PI / 4 * (D0 * D0 - d0 * d0); return { I, A, r: Math.sqrt(I / A), E: 200e9, EI: 200e9 * I, sy: 250e6 }; })();
  const eulerLoad = (EI, len, K) => PI * PI * EI / ((K * len) ** 2);

  const M = {
    TL, TYPES, trussGeom, trussSolve, trussMoment, jointForces, nodeName, memName, memLen,
    BL, secI, beamSolve, beamExtremes, E_STEEL,
    ENDS, colMatrix, det, colKappas, colMode, TUBE, eulerLoad, gauss,
  };
  (window.LabModels = window.LabModels || {})['structural-mechanics'] = M;

  /* ---------------- shared pieces ---------------- */
  function frame(ctx, caps) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, caps[0]);
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, caps[1]);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  const thick = (f, fmax, lo, hi) => lo + (hi - lo) * Math.sqrt(Math.min(1, Math.abs(f) / (fmax || 1)));
  // tension cool, compression warm: the diverging map is warm for positive values
  const forceColour = (S, f, fmax) => { const t = Math.min(1, Math.abs(f) / (fmax || 1)); return S.cmap.div(-Math.sign(f) * Math.pow(t, 0.42)); };

  /* ---------------- 1. truss bridge ---------------- */
  D['truss-bridge'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('A truss bridge from a few steel bars pinned at the joints. Each bar carries only a push or a pull along its length: blue bars are in tension, orange in compression, and a bar is drawn as thick as its force needs. Drag the gold load along the deck and the forces redistribute.', 'ピンで留めた細い鋼の棒だけでできたトラス橋です。どの棒も長さの方向の押しか引きだけを受け持ちます。青い棒は引張、橙の棒は圧縮で、棒は力に応じた太さで描かれます。金色の荷重を床版に沿ってドラッグすると、力が配り直されます。'),
        T('The side elevation with the forces in kN. Hover a bar to read its force. Pick a joint: its member forces and the load or reaction acting there must add to zero, which is the force polygon below.', '側面図に力を kN で示しています。棒の上にカーソルを置くとその力が読めます。節点を選ぶと、その節点に働く棒の力と荷重または反力の合計がゼロになります。それが下の力の多角形です。'),
      ]);
      const type = Math.round(v.type), n = Math.round(v.n), h = v.h;
      const g = trussGeom(type, n, h), J = g.nodes.length;
      const jsel = Math.min(Math.round(v.joint), J - 1);
      if (!st.polyHost || !st.polyHost.isConnected) { st.elev = L.h('div', '', st.c2); st.capPoly = L.h('p', 'lab-cap', st.c2, ''); st.poly = L.h('div', '', st.c2); }
      st.capPoly.textContent = T('Force polygon at joint ', '節点の力の多角形：') + nodeName(g, jsel) + T('. Each arrow is a force acting on the joint; laid head to tail they close.', '。矢印はこの節点に働く力で、頭と尾をつなぐと閉じます。');
      st.polyHost = st.poly;
      const W = 5, X0 = TL / 2;
      const tops = g.nodes.map((q, k) => k).filter((k) => k > n);
      const draw2d = (sol, x) => {
        st.elev.replaceChildren(); st.poly.replaceChildren(); st.leg.replaceChildren();
        const fmax = Math.max(1e-9, ...sol.F.map(Math.abs));
        const f = L.fig(st.elev, { x: [-3.9, TL + 3.9], y: [-2.1, h + 3.4], equal: true, axes: false, grid: false, maxH: 300 });
        f.poly([[-0.7, -1], [0.7, -1], [0, -0.05]], { c: 'muted', fill: true, fo: 0.35 });
        f.poly([[TL - 0.7, -1.4], [TL + 0.7, -1.4], [TL, -0.45]], { c: 'muted', fill: true, fo: 0.35 });
        f.circle(TL, -0.95, 0.4, { c: 'muted', fill: true, fo: 0.3 });
        f.seg([-1.4, -1.1], [1.4, -1.1], { c: 'muted', w: 2 }); f.seg([TL - 1.4, -1.5], [TL + 1.4, -1.5], { c: 'muted', w: 2 });
        g.mem.forEach(([a, b], c) => {
          const fc = sol.F[c], small = Math.abs(fc) < 1e-6 * fmax + 1e-9;
          f.seg(g.nodes[a], g.nodes[b], { c: small ? 'muted' : fc > 0 ? 'c1' : 'c2', w: small ? 1.6 : thick(fc, fmax, 2.2, 8), op: small ? 0.7 : 0.95 });
        });
        g.nodes.forEach((p, k) => f.dot(p[0], p[1], { c: 'ink', r: k === jsel ? 5.5 : 3 }));
        const pj = g.nodes[jsel];
        f.circle(pj[0], pj[1], 0.85, { c: 'hl', w: 2.4, fill: false });
        const bits = jointForces(g, sol, jsel).filter((q) => Math.hypot(...q.vec) > 1e-6 * fmax + 1e-9);
        f.text(pj[0], pj[1] - 1.55, nodeName(g, jsel), { anchor: 'middle', small: true, math: true });
        f.hover((hx, hz) => {
          let best = null, bd = 0.9;
          g.mem.forEach(([a, b], c) => {
            const A = g.nodes[a], B = g.nodes[b], dx = B[0] - A[0], dz = B[1] - A[1], t = Math.max(0, Math.min(1, ((hx - A[0]) * dx + (hz - A[1]) * dz) / (dx * dx + dz * dz))), d = Math.hypot(hx - A[0] - t * dx, hz - A[1] - t * dz);
            if (d < bd) { bd = d; best = c; }
          });
          return best === null ? null : { x: hx, y: hz, text: memName(g, best) + '  ' + (sol.F[best] > 0.005 ? T('tension ', '引張 ') : sol.F[best] < -0.005 ? T('compression ', '圧縮 ') : T('no force ', '力なし ')) + fmt(Math.abs(sol.F[best]), 1) + ' kN' };
        });
        if (sol.P > 0) f.arrow([x, h + 2.9], [x, 0.4], { c: 'hl', w: 3 });
        f.text(x, h + 3.15, sol.P > 0 ? 'P = ' + fmt(sol.P, 0) + ' kN' : '', { anchor: 'middle', small: true });
        f.handle(x, 0, { c: 'hl', label: T('load position', '荷重の位置'), axis: 'x', bounds: [0, TL, 0, 0], snap: 0.1, onDrag: (nx) => ctx.set('x', nx) });
        f.text(-1.7, -0.9, T('pin', 'ピン'), { anchor: 'end', small: true }); f.text(TL + 1.7, -0.9, T('roller', 'ローラー'), { anchor: 'start', small: true });
        // force polygon
        if (!bits.length) { const pf0 = L.fig(st.poly, { x: [-1, 1], y: [-1, 1], equal: true, axes: false, grid: false, maxH: 270 }); pf0.text(0, 0, T('no force on this joint', 'この節点には力が働いていません'), { anchor: 'middle', small: true }); }
        const sorted = bits.slice().sort((p, q) => Math.atan2(p.vec[1], p.vec[0]) - Math.atan2(q.vec[1], q.vec[0]));
        const big = Math.max(1, ...sorted.map((q) => Math.hypot(...q.vec)));
        let cx = 0, cz = 0; const pts = [[0, 0]];
        sorted.forEach((q) => { cx += q.vec[0]; cz += q.vec[1]; pts.push([cx, cz]); });
        const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
        const span = Math.max(x1 - x0, z1 - z0, big * 0.6), pad = span * 0.2;
        const mxp = (x0 + x1) / 2, mzp = (z0 + z1) / 2;
        const pf = !bits.length ? null : L.fig(st.poly, { x: [mxp - span / 2 - pad, mxp + span / 2 + pad], y: [mzp - span / 2 - pad, mzp + span / 2 + pad], equal: true, axes: false, grid: false, maxH: 270 });
        sorted.forEach((q, i) => {
          const a = pts[i], b = pts[i + 1];
          const col = q.kind === 'member' ? (q.f > 0 ? 'c1' : 'c2') : q.kind === 'load' ? 'hl' : 'c3';
          pf.arrow(a, b, { c: col, w: 3 });
          const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
          const lab = q.kind === 'member' ? q.name + ' ' + (q.f > 0 ? '+' : '−') + fmt(Math.abs(q.f), 1) : q.kind === 'load' ? 'P ' + fmt(Math.hypot(dx, dz), 1) : T('reaction ', '反力 ') + fmt(Math.hypot(dx, dz), 1);
          pf.text((a[0] + b[0]) / 2 - dz / l * span * 0.08, (a[1] + b[1]) / 2 + dx / l * span * 0.08, lab, { anchor: 'middle', small: true, c: col });
        });
        if (pf) pf.dot(0, 0, { c: 'ink', r: 3 });
        L.legend(st.leg, [{ c: 'c1', label: T('tension (the bar pulls on its joints)', '引張（棒が節点を引く）') }, { c: 'c2', label: T('compression (the bar pushes on its joints)', '圧縮（棒が節点を押す）') }, { c: 'muted', label: T('no force', '力なし') }, { kind: 'dot', c: 'hl', label: T('load and its position', '荷重とその位置') }]);
        const iMax = sol.F.reduce((b, q, i) => (q > sol.F[b] ? i : b), 0), iMin = sol.F.reduce((b, q, i) => (q < sol.F[b] ? i : b), 0);
        const xm = TL / 2, Mmid = trussMoment(g, sol, xm);
        ctx.readout([
          { k: T('reaction at the pin / roller', 'ピン / ローラーの反力'), v: fmt(sol.Ray, 1) + ' / ' + fmt(sol.Rby, 1) + ' kN', tone: 'key' },
          { k: T('largest tension', '最大の引張'), v: memName(g, iMax) + ' ' + fmt(sol.F[iMax], 1) + ' kN', tone: 'key' },
          { k: T('largest compression', '最大の圧縮'), v: memName(g, iMin) + ' ' + fmt(sol.F[iMin], 1) + ' kN', tone: 'key' },
          { k: T('moment at mid-span ÷ height', '中央のモーメント ÷ 高さ'), v: fmt(Mmid / h, 1) + ' kN' },
          { k: T('members + 3 = 2 × joints', '棒の数 + 3 = 2 × 節点数'), v: `${g.mem.length} + 3 = 2 × ${J}`, tone: 'good' },
        ], T('A chord carries the beam moment of its section divided by the truss height, M/h, so a taller truss needs less steel in its chords. The diagonals carry the shear.', '弦材は、その断面のはりとしてのモーメントをトラスの高さで割った M/h を受け持つので、高いトラスほど弦材の鋼が少なくて済みます。斜材はせん断力を受け持ちます。'));
      };
      const build3d = (S) => {
        const key = type + '|' + n;
        if (st.tkey === key && st.grp) return;
        if (st.grp) { S.scene.remove(st.grp); st.grp.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); }); }
        const THREE = S.THREE, grp = new THREE.Group();
        const cyl = new THREE.CylinderGeometry(1, 1, 1, 14);
        st.ms = [];
        for (let c = 0; c < g.mem.length; c++) for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(cyl, S.mat('c1', { rough: 0.32, coat: 0.5, metal: 0.55 })); m.castShadow = true; grp.add(m); st.ms.push(m); }
        st.xm = [];
        const addX = (kind) => { const m = new THREE.Mesh(cyl, S.mat('muted', { rough: 0.4, metal: 0.5, coat: 0.4 })); m.castShadow = true; grp.add(m); st.xm.push({ m, kind }); return m; };
        for (let i = 0; i <= n; i++) addX({ type: 'floor', i });
        tops.forEach((k) => addX({ type: 'top', k }));
        S.add(grp);
        st.grp = grp; st.tkey = key;
      };
      const place = (m, a, b, r) => {
        const THREE = st.S.THREE, A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
        m.position.copy(A).add(B).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        m.scale.set(r, len, r);
      };
      const paint = (x) => {
        const sol = trussSolve(g, v.P, x);
        if (!st.flat && st.S) {
          const S = st.S;
          build3d(S);
          const fmax = Math.max(1e-9, ...sol.F.map(Math.abs));
          g.mem.forEach(([a, b], c) => {
            const fc = sol.F[c], small = Math.abs(fc) < 1e-6 * fmax + 1e-9;
            for (let k = 0; k < 2; k++) {
              const y = (k ? 1 : -1) * W / 2, m = st.ms[c * 2 + k];
              place(m, [g.nodes[a][0] - X0, y, g.nodes[a][1]], [g.nodes[b][0] - X0, y, g.nodes[b][1]], small ? 0.05 : thick(fc, fmax, 0.07, 0.3));
              m.material.color.copy(small ? S.colour('muted') : forceColour(S, fc, fmax));
            }
          });
          st.xm.forEach(({ m, kind }) => {
            if (kind.type === 'floor') place(m, [kind.i * g.s - X0, -W / 2, 0], [kind.i * g.s - X0, W / 2, 0], 0.09);
            else place(m, [g.nodes[kind.k][0] - X0, -W / 2, h], [g.nodes[kind.k][0] - X0, W / 2, h], 0.06);
          });
          st.pts.update(g.nodes.flatMap((p) => [[p[0] - X0, -W / 2, p[1]], [p[0] - X0, W / 2, p[1]]]));
          st.load.set([x - X0, 0, h + 3.4], sol.P > 0 ? [0, 0, -(2.9 + 0.001)] : [0, 0, 0]);
          st.load.visible = sol.P > 0;
          st.hdl.at([x - X0, 0, 0.1]);
          st.hdl.userData.handle.plane = [[0, 0, 1], [0, 0, 0.1]];
          st.lab.set([x - X0, 0, h + 3.7], sol.P > 0 ? 'P = ' + fmt(sol.P, 0) + ' kN' : '');
          S.invalidate();
        }
        draw2d(sol, x);
      };
      st.paint = paint;
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => {
          const run = 5.5;
          if (t >= run) { st.paint(st.xFinal ?? 8); return t > run + 0.01 ? false : undefined; }
          st.paint(TL * (t / run));
        }, { initialT: 99, playLabel: T('Drive the load across', '荷重を端から端へ動かす'), autoplay: false, once: true });
      }
      st.xFinal = v.x;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.7, maxH: 500, camera: [9, -34, 17], target: [0, 0, 2.4], fov: 30,
        init(S) {
          st.flat = false; st.S = S; st.tkey = null; st.grp = null;
          S.floor({ size: 22, n: 22, z: -3.4 });
          const THREE = S.THREE;
          const slab = S.box([TL, W, 0.16], [0, 0, -0.18], { c: 'muted', opacity: 0.3 });
          slab.castShadow = false;
          for (const sgn of [-1, 1]) S.box([2.2, W + 1.4, 2.8], [sgn * (TL / 2 + 0.7), 0, -2.0], { c: 'muted', rough: 0.7, coat: 0.1 });
          for (const sgn of [-1, 1]) for (const yy of [-W / 2, W / 2]) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 24), S.mat('ink', { rough: 0.3, metal: 0.6 }));
            cone.rotation.x = PI / 2; cone.position.set(sgn * TL / 2, yy, -0.4); cone.castShadow = true; S.add(cone);
          }
          st.pts = S.points([[0, 0, 0]], { c: 'ink', r: 0.24, max: 80, rough: 0.25, metal: 0.6 });
          st.load = S.arrow([0, 0, h + 3.4], [0, 0, -2.9], { c: 'hl', r: 0.14, glow: 0.2 });
          st.lab = S.label('', [0, 0, h + 3.7], { small: true, align: 'middle' });
          st.hdl = S.handle([v.x - X0, 0, 0.1], { plane: [[0, 0, 1], [0, 0, 0.1]], bounds: [-X0, X0, -W / 2, W / 2], r: 0.4, onDrag: (q) => { ctx.set('x', Math.round((q.x + X0) * 10) / 10); return [Math.round((q.x + X0) * 10) / 10 - X0, 0, 0.1]; } });
        },
        update() { paint(st.anim && st.anim.t < 5.5 && st.anim.t > 0.01 ? TL * (st.anim.t / 5.5) : v.x); },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the elevation on the right carries every force.', 'このブラウザでは 3D 表示ができません。右の側面図に力のすべてがあります。')); paint(v.x); },
      });
      if (!st.__v3 && !st.flat) paint(v.x);
    },
  };

  /* ---------------- 2. beam diagrams ---------------- */
  const SUPPORTS = [['Cantilever', '片持ち'], ['Simple', '単純支持'], ['Fixed–fixed', '両端固定'], ['Fixed–pinned', '固定・ピン']];
  D['beam-diagrams'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('A steel beam, 6 m long, shaded by its bending stress: orange fibres are squeezed, blue ones stretched, and the grey line down the middle (the neutral axis) does neither. Cross-sections stay flat and square to the bent axis, which is the Euler–Bernoulli assumption. Drag the gold load; the deflection is exaggerated by the factor shown.', '長さ 6 m の鋼のはりを曲げ応力で塗り分けています。橙の繊維は縮み、青の繊維は伸び、中央の灰色の線（中立軸）はどちらでもありません。断面は平らなまま、曲がった軸に直交しつづけます。これがオイラー・ベルヌーイの仮定です。金色の荷重をドラッグしてください。たわみは表示の倍率で誇張しています。'),
        T('Shear V is the slope of the moment M, and M is the second derivative of the deflection times EI. Drag the dot on the moment diagram to cut the beam where you like.', 'せん断力 V はモーメント M の傾きで、M はたわみの二階微分に EI をかけたものです。モーメント図の点をドラッグすると、好きな位置ではりを切断できます。'),
      ]);
      const sup = Math.round(v.sup), hh = v.h, I = secI(hh), EI = E_STEEL * I;
      const bm = beamSolve(sup, v.P, v.a, v.w, EI);
      const ex = beamExtremes(bm);
      const sigMax = ex.M * (hh / 2000) / I / 1000;               // MPa (kN m / m^4 = kN/m^2 = kPa; /1000 -> MPa)
      const cutx = v.cut, Mc = bm.M(cutx), Vc = bm.V(cutx, 1);
      const sigC = Math.abs(Mc) * (hh / 2000) / I / 1000;
      const scale = ex.y > 0 ? Math.min(4000, Math.max(1, 0.42 / ex.y)) : 1;
      const NU = 96;
      const grid = Array.from({ length: NU + 1 }, (_, i) => { const x = BL * i / NU, q = bm.at(x); return { x, y: q.y, th: q.th, M: bm.M(x) }; });
      const draw2d = () => {
        if (!st.vHost || !st.vHost.isConnected) { st.vHost = L.h('div', '', st.c2); st.mHost = L.h('div', '', st.c2); st.yHost = L.h('div', '', st.c2); st.sHost = L.h('div', '', st.c1); }
        [st.vHost, st.mHost, st.yHost, st.sHost].forEach((e) => e.replaceChildren()); st.leg.replaceChildren();
        const xs = []; for (let i = 0; i <= 120; i++) xs.push(BL * i / 120);
        const vpts = []; xs.forEach((x) => { if (Math.abs(x - v.a) < 1e-9) vpts.push([x, bm.V(x, -1)], [x, bm.V(x, 1)]); else vpts.push([x, bm.V(x, 1)]); });
        if (!xs.some((x) => Math.abs(x - v.a) < 1e-9)) { const k = vpts.findIndex((p) => p[0] > v.a); const at = k < 0 ? vpts.length : k; vpts.splice(at, 0, [v.a, bm.V(v.a, -1)], [v.a, bm.V(v.a, 1)]); }
        const pad = (a) => Math.max(1, a * 1.5);
        const fv = L.fig(st.vHost, { x: [0, BL], y: [-pad(ex.V), pad(ex.V)], aspect: 0.3, maxH: 150, xlabel: '', ylabel: 'V (kN)' });
        fv.hline(0, { c: 'ink', w: 1, op: 0.5 });
        fv.area(vpts, { base: 0, c: 'c3', fo: 0.22 }); fv.line(vpts, { c: 'c3', w: 2.2 });
        fv.vline(cutx, { c: 'hl', w: 1.2, dash: true });
        const mp = xs.map((x) => [x, bm.M(x)]);
        const fm = L.fig(st.mHost, { x: [0, BL], y: [-pad(ex.M), pad(ex.M)], aspect: 0.3, maxH: 150, xlabel: '', ylabel: 'M (kN·m)' });
        fm.hline(0, { c: 'ink', w: 1, op: 0.5 });
        fm.area(mp, { base: 0, c: 'c2', fo: 0.22 }); fm.line(mp, { c: 'c2', w: 2.2 });
        fm.vline(cutx, { c: 'hl', w: 1.2, dash: true });
        fm.handle(cutx, Mc, { c: 'hl', label: T('cut here', 'ここで切断'), axis: 'x', bounds: [0, BL, -1e9, 1e9], snap: 0.05, onDrag: (nx) => ctx.set('cut', nx) });
        const yp = xs.map((x) => [x, bm.y(x) * 1000]);
        const yl = Math.max(0.05, ex.y * 1000 * 1.3);
        const fy = L.fig(st.yHost, { x: [0, BL], y: [yl, -yl], aspect: 0.3, maxH: 150, xlabel: 'x (m)', ylabel: T('deflection (mm)', 'たわみ（mm）') });
        fy.hline(0, { c: 'ink', w: 1, op: 0.5 });
        fy.line(yp, { c: 'c1', w: 2.2 });
        fy.vline(cutx, { c: 'hl', w: 1.2, dash: true });
        // stress distribution at the cut
        const half = hh / 2;
        const tauMax = 1.5 * Math.abs(Vc) / (BEAM_B * hh / 1000) / 1000;
        const sx = Math.max(sigC, tauMax, 0.5) * 1.35;
        const fs = L.fig(st.sHost, { x: [-sx, sx], y: [-half * 1.18, half * 1.18], aspect: 0.5, maxH: 210, xlabel: T('stress at the cut (MPa), across the depth in mm', '切断面の応力（MPa）、横軸が高さ方向（mm）'), ylabel: '' });
        const sTop = -Math.sign(Mc) * sigC, sBot = Math.sign(Mc) * sigC;   // sagging: the top face is squeezed
        fs.rect(-sx, -half, 2 * sx, hh, { c: 'muted', fill: true, fo: 0.07, nostroke: true });
        fs.vline(0, { c: 'ink', w: 1.2, dash: true, op: 0.7 });
        fs.poly([[0, 0], [0, half], [sTop, half]], { c: sTop <= 0 ? 'c2' : 'c1', fill: true, fo: 0.32 });
        fs.poly([[0, 0], [0, -half], [sBot, -half]], { c: sBot <= 0 ? 'c2' : 'c1', fill: true, fo: 0.32 });
        const pts = L.sample(-half, half, 40, (y) => [(1 - (2 * y / hh) ** 2) * tauMax, y]);
        fs.line(pts, { c: 'c3', w: 2.2 });
        if (sigC > 0.01) { fs.text(sTop, half, (sTop < 0 ? '−' : '+') + fmt(sigC, 1) + ' MPa', { anchor: sTop < 0 ? 'end' : 'start', small: true, dy: 14 }); fs.text(sBot, -half, (sBot < 0 ? '−' : '+') + fmt(sigC, 1) + ' MPa', { anchor: sBot < 0 ? 'end' : 'start', small: true, dy: -6 }); }
        fs.text(sx * 0.97, 0, T('neutral axis', '中立軸'), { anchor: 'end', small: true, dy: -6 });
        L.legend(st.leg, [{ c: 'c3', label: T('shear V; at the cut also the shear stress τ, parabolic', 'せん断力 V。切断面ではせん断応力 τ（放物線）も') }, { c: 'c2', label: T('moment M; the stress σ = M y / I is the shaded triangle', 'モーメント M。応力 σ = M y / I は塗った三角形') }, { c: 'c1', label: T('deflection y (down is positive)', 'たわみ y（下向きが正）') }, { kind: 'dot', c: 'hl', label: T('the section you are looking at', '見ている断面') }]);
        const fl = ex.y > 0 ? BL / ex.y : Infinity;
        ctx.readout([
          { k: T('reactions at x = 0 and L', 'x = 0 と L の反力'), v: fmt(bm.R0, 1) + ' and ' + fmt(bm.RL, 1) + ' kN', tone: 'key' },
          { k: T('largest |M|', '|M| の最大'), v: fmt(ex.M, 1) + ' kN·m', tone: 'key' },
          { k: T('largest deflection', '最大たわみ'), v: fmt(ex.y * 1000, 2) + ' mm' + (Number.isFinite(fl) ? ' (L/' + fmt(fl, 0) + ')' : ''), tone: 'key' },
          { k: T('largest bending stress', '最大の曲げ応力'), v: fmt(sigMax, 1) + ' MPa', tone: sigMax > 160 ? 'warn' : undefined },
          { k: T('at the cut: M, V', '切断面の M, V'), v: fmt(Mc, 1) + ' kN·m, ' + fmt(Vc, 1) + ' kN' },
          { k: 'EI', v: fmt(EI, 0) + ' kN·m²' },
          { k: T('deflection drawn exaggerated', '図でのたわみの誇張'), v: '× ' + fmt(scale, 0) },
        ], T('Depth matters cubically: I = b h³ / 12, so a beam twice as deep deflects an eighth as much under the same load, and has a quarter of the stress.', '高さは三乗で効きます。I = b h³ / 12 なので、高さが二倍のはりは同じ荷重でたわみが八分の一、応力が四分の一になります。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.62, maxH: 440, camera: [3.4, -8.6, 3.4], target: [3, 0, -0.05], fov: 30,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          S.floor({ size: 7.5, n: 15, z: -1.25 });
          const mk = () => S.surface((u, w) => [u, 0, 0], { u: [0, BL], v: [-1, 1], nu: NU, nv: 6, c: 'c1', colour: () => S.colour('muted'), rough: 0.4, coat: 0.5 });
          st.faces = { front: mk(), back: mk(), top: mk(), bottom: mk(), capL: mk(), capR: mk() };
          st.axis = S.lines([[[0, 0, 0], [1, 0, 0]]], { c: 'ink', opacity: 0.55, w: 2 });
          st.stations = S.lines([[[0, 0, 0], [0, 0, 0.1]]], { c: 'ink', opacity: 0.4, w: 1.2 });
          st.cutRing = S.lines([[[0, 0, 0], [0, 0, 0.1]]], { c: 'hl', opacity: 1, w: 3 });
          st.cutLab = S.label(T('cut', '切断面'), [0, 0, 0], { small: true, align: 'middle' });
          st.wallL = S.box([0.4, 1.4, 1.5], [-0.2, 0, 0], { c: 'muted', rough: 0.7, coat: 0.1 });
          st.wallR = S.box([0.4, 1.4, 1.5], [BL + 0.2, 0, 0], { c: 'muted', rough: 0.7, coat: 0.1 });
          const cone = () => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.4, 24), S.mat('ink', { rough: 0.3, metal: 0.6 })); m.rotation.x = PI / 2; m.castShadow = true; S.add(m); return m; };
          st.pinL = cone(); st.pinR = cone();
          st.rollR = S.sphere([BL, 0, -0.5], 0.1, { c: 'ink' });
          st.pAr = S.arrow([0, 0, 1], [0, 0, -0.7], { c: 'hl', r: 0.07, glow: 0.2 });
          st.pLab = S.label('', [0, 0, 1], { small: true, align: 'middle' });
          st.udl = Array.from({ length: 13 }, (_, i) => S.arrow([i * BL / 12, 0, 1], [0, 0, -0.5], { c: 'c4', r: 0.035 }));
          st.udlLine = S.lines([[[0, 0, 1], [BL, 0, 1]]], { c: 'c4', opacity: 0.9, w: 2 });
          st.hdl = S.handle([v.a, 0, 0.3], { plane: [[0, 0, 1], [0, 0, 0.3]], bounds: [0, BL, -0.7, 0.7], r: 0.16, onDrag: (q) => { const a = Math.round(q.x * 10) / 10; ctx.set('a', a); return [a, 0, st.hdlZ ?? 0.3]; } });
        },
        update(S) {
          const hz = hh / 1000, top = hz / 2 + 0.05;
          const sc = scale, b2 = BEAM_B / 2;
          const idx = (u) => Math.max(0, Math.min(NU, Math.round(u / BL * NU)));
          const pos = (xi, eta, yy) => { const q = grid[idx(xi)]; return [q.x + sc * eta * q.th, yy, eta - sc * q.y]; };
          const col = (xi, eta) => { const q = grid[idx(xi)]; const sg = -q.M * eta / I / 1000; const t = ex.M > 0 ? sg / sigMax : 0; return S.cmap.div(-Math.sign(t) * Math.pow(Math.min(1, Math.abs(t)), 0.5)); };
          const F = st.faces;
          F.front.update((u, w) => pos(u, w * hz / 2, -b2), (u, w) => col(u, w * hz / 2));
          F.back.update((u, w) => pos(u, w * hz / 2, b2), (u, w) => col(u, w * hz / 2));
          F.top.update((u, w) => pos(u, hz / 2, w * b2), (u) => col(u, hz / 2));
          F.bottom.update((u, w) => pos(u, -hz / 2, w * b2), (u) => col(u, -hz / 2));
          F.capL.update((u, w) => pos(0, w * hz / 2, (u / BL - 0.5) * BEAM_B), () => S.colour('muted'));
          F.capR.update((u, w) => pos(BL, w * hz / 2, (u / BL - 0.5) * BEAM_B), () => S.colour('muted'));
          st.axis.update(L.seq(NU, (i) => [pos(BL * i / NU, 0, 0), pos(BL * (i + 1) / NU, 0, 0)]));
          const segs = [];
          for (let i = 1; i <= 9; i++) { const xi = BL * i / 10; segs.push([pos(xi, -hz / 2, -b2), pos(xi, hz / 2, -b2)]); }
          st.stations.update(segs);
          const cp = (e, yy) => pos(cutx, e, yy), e2 = hz / 2 + 0.01;
          st.cutRing.update([[cp(-e2, -b2 - 0.01), cp(e2, -b2 - 0.01)], [cp(e2, -b2 - 0.01), cp(e2, b2 + 0.01)], [cp(e2, b2 + 0.01), cp(-e2, b2 + 0.01)], [cp(-e2, b2 + 0.01), cp(-e2, -b2 - 0.01)]]);
          st.cutLab.set(cp(e2, 0).map((q, i) => (i === 2 ? q + 0.25 : q)));
          st.wallL.visible = sup === 0 || sup === 2 || sup === 3; st.wallR.visible = sup === 2;
          st.pinL.visible = sup === 1; st.pinR.visible = sup === 1 || sup === 3; st.rollR.visible = sup === 1 || sup === 3;
          st.pinL.position.set(0, 0, -hz / 2 - 0.2); st.pinR.position.set(BL, 0, -hz / 2 - 0.2 - 0.1);
          st.rollR.at([BL, 0, -hz / 2 - 0.47]);
          // loads
          const ap = pos(v.a, top, 0);
          const aTop = ap[2];
          st.hdlZ = aTop + 0.04;
          st.pAr.visible = v.P > 0; st.pAr.set([ap[0], 0, aTop + 0.95], [0, 0, -0.85]);
          st.pLab.set([ap[0], 0, aTop + 1.05], v.P > 0 ? fmt(v.P, 0) + ' kN' : '');
          st.hdl.at([ap[0], 0, aTop + 0.04]);
          st.hdl.userData.handle.plane = [[0, 0, 1], [0, 0, aTop + 0.04]];
          const have = v.w > 0;
          st.udl.forEach((a, i) => { const x = BL * i / 12, q = pos(x, hz / 2, 0); a.visible = have; if (have) a.set([q[0], 0, q[2] + 0.55], [0, 0, -0.5]); });
          st.udlLine.visible = have;
          if (have) st.udlLine.update(L.seq(12, (i) => { const p = pos(BL * i / 12, hz / 2, 0), q = pos(BL * (i + 1) / 12, hz / 2, 0); return [[p[0], 0, p[2] + 0.55], [q[0], 0, q[2] + 0.55]]; }));
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the diagrams on the right carry the whole analysis.', 'このブラウザでは 3D 表示ができません。右の図に解析のすべてがあります。')); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. column modes ---------------- */
  D['column-modes'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [
        T('A steel tube loaded along its axis. The lowest load at which it can bow sideways is the Euler load; the shape it bows into is the first mode. Change how the ends are held, then add a rigid lateral brace and drag it up and down: the bowed shape, and the load, change completely. The deflection shown is a fixed small amplitude, because linear theory only fixes the shape.', '軸方向に荷重を受ける鋼管です。横に反りうる最小の荷重がオイラー荷重で、そのときの反りの形が第一モードです。端の支え方を変え、さらに剛な横の支えを加えて上下にドラッグしてください。反りの形も荷重もすっかり変わります。線形理論では形しか決まらないので、表示のたわみは小さな一定の振幅です。'),
        T('Above: the first three mode shapes of this column (the chosen one is thick). Below: how the lowest buckling load, in units of the pinned–pinned Euler load, depends on where the brace sits. Drag the point.', '上：この柱の最初の三つのモードの形（選んだものが太線）。下：最小の座屈荷重が、支えの位置でどう変わるかを、両端ピンのオイラー荷重を単位にして示します。点をドラッグしてください。'),
      ]);
      const bc = Math.round(v.bc), braced = Math.round(v.brace) === 1, b = braced ? v.bh : null, mode = Math.round(v.mode), len = v.len;
      const kaps = colKappas(bc, b, 3);
      const kn = kaps[Math.min(mode, kaps.length) - 1] ?? NaN;
      const shapes = kaps.map((k) => colMode(bc, b, k));
      const PE = eulerLoad(TUBE.EI, len, 1) / 1000;           // kN, pinned-pinned
      const Pn = (kn / PI) ** 2 * PE;
      const K1 = PI / kaps[0], Kn = PI / kn;
      const lam = Kn * len / TUBE.r, sig = Pn * 1000 / TUBE.A / 1e6, lamC = PI * Math.sqrt(TUBE.E / TUBE.sy);
      const H = 3, AMP = 0.07;
      if (!st.curves || st.curves.bc !== bc) {
        const pts = [];
        for (let i = 0; i < 46; i++) { const bb = 0.04 + 0.92 * i / 45, ks = colKappas(bc, bb, 1); pts.push([bb, ks.length ? (ks[0] / PI) ** 2 : NaN]); }
        st.curves = { bc, pts, base: (colKappas(bc, null, 1)[0] / PI) ** 2 };
      }
      const draw2d = () => {
        if (!st.mHost || !st.mHost.isConnected) { st.mHost = L.h('div', '', st.c2); st.kHost = L.h('div', '', st.c2); }
        st.mHost.replaceChildren(); st.kHost.replaceChildren(); st.leg.replaceChildren();
        if (st.flat) { st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics; the mode shapes below carry the picture.', 'このブラウザでは 3D 表示ができません。下のモードの形が図を担います。')); }
        const fm = L.fig(st.mHost, { x: [-1.35, 1.35], y: [0, 1.04], aspect: 0.7, maxH: 300, xlabel: T('lateral deflection, relative to its peak', '横方向のたわみ（ピークに対する比）'), ylabel: T('height z / L', '高さ z / L') });
        fm.vline(0, { c: 'muted', w: 1, dash: true });
        const cc = ['c1', 'c3', 'c4'];
        shapes.forEach((s, i) => fm.line(L.sample(0, 1, 160, (xi) => [s(xi), xi]), { c: cc[i], w: i + 1 === mode ? 3.4 : 1.4, op: i + 1 === mode ? 1 : 0.55 }));
        if (braced) { fm.hline(v.bh, { c: 'hl', w: 2, dash: true }); fm.text(1.3, v.bh, T('brace', '支え'), { anchor: 'end', small: true, dy: -5 }); }
        L.legend(st.leg, kaps.map((k, i) => ({ c: cc[i], label: T(`mode ${i + 1}: P = ${fmt((k / PI) ** 2, 3)} × pinned–pinned Euler load`, `モード ${i + 1}：P = 両端ピンのオイラー荷重の ${fmt((k / PI) ** 2, 3)} 倍`) })).concat([{ kind: 'dot', c: 'hl', label: T('brace (a rigid lateral support)', '支え（剛な横の支え）') }]));
        const pts = st.curves.pts.filter((p) => Number.isFinite(p[1]));
        const top = Math.max(1.2, ...pts.map((p) => p[1])) * 1.12;
        const fk = L.fig(st.kHost, { x: [0, 1], y: [0, top], aspect: 0.62, maxH: 260, xlabel: T('brace height z / L', '支えの高さ z / L'), ylabel: T('lowest P / pinned–pinned Euler load', '最小の P ÷ 両端ピンのオイラー荷重') });
        fk.hline(st.curves.base, { c: 'muted', w: 1.4, dash: true });
        fk.text(0.98, st.curves.base, T('no brace', '支えなし'), { anchor: 'end', small: true, dy: -5 });
        fk.line(pts, { c: 'c2', w: 2.6 });
        const cur = braced ? (kaps[0] / PI) ** 2 : st.curves.base;
        fk.handle(v.bh, cur, { c: braced ? 'hl' : 'muted', label: T('brace height', '支えの高さ'), bounds: [0.05, 0.95, 0, 1e9], axis: 'x', snap: 0.01, onDrag: (nx) => { ctx.set('brace', 1, true); ctx.set('bh', nx); } });
        const gain = braced ? (kaps[0] / PI) ** 2 / st.curves.base : 1;
        ctx.readout([
          { k: T(`P${mode} (critical load, mode ${mode})`, `P${mode}（モード ${mode} の限界荷重）`), v: fmt(Pn, 1) + ' kN', tone: 'key' },
          { k: T('Euler load, pinned–pinned', 'オイラー荷重（両端ピン）'), v: fmt(PE, 1) + ' kN' },
          { k: T('effective length factor K', '有効長さ係数 K'), v: fmt(Kn, 3), tone: 'key' },
          { k: T('slenderness KL / r', '細長比 KL / r'), v: fmt(lam, 0) },
          { k: T('stress at buckling', '座屈時の応力'), v: fmt(sig, 0) + ' MPa', tone: sig > 250 ? 'warn' : undefined },
          braced ? { k: T('gain from the brace', '支えによる増加'), v: '× ' + fmt(gain, 2), tone: 'good' } : { k: T('first mode K', '第一モードの K'), v: fmt(K1, 3) },
        ], sig > TUBE.sy / 1e6 ? T(`The tube would yield at 250 MPa before it buckled, so Euler's formula does not apply here: the column is stocky (KL/r below ${fmt(lamC, 0)}) and fails by crushing.`, `この管は座屈する前に 250 MPa で降伏するので、オイラーの式は当てはまりません。柱は太短く（KL/r が ${fmt(lamC, 0)} 未満）、圧壊で壊れます。`)
          : T('Critical load is P = κ² EI / L², where κ is the n-th root of the end-condition equation; the effective length is KL = πL / κ.', '限界荷重は P = κ² EI / L² で、κ は端の条件の式の第 n 根です。有効長さは KL = πL / κ です。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 1.1, maxH: 640, camera: [6.6, -8.2, 3.3], target: [0, 0, 1.75], fov: 32,
        init(S) {
          st.flat = false;
          const THREE = S.THREE;
          S.floor({ size: 2.6, n: 13, z: -0.25 });
          st.col = S.tube([[0, 0, 0], [0, 0, 1]], { c: 'c1', r: 0.055, rough: 0.3, metal: 0.6, coat: 0.6, n: 60 });
          st.ghost = [0, 1, 2].map((i) => S.polyline([[0, 0, 0], [0, 0, 1]], { c: ['c1', 'c3', 'c4'][i], opacity: 0.0, w: 1.6 }));
          const blockM = () => S.mat('muted', { rough: 0.5, metal: 0.4 });
          st.baseBlock = S.box([0.8, 0.8, 0.25], [0, 0, -0.125], { c: 'muted', rough: 0.6, coat: 0.2 });
          st.baseCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 24), S.mat('ink', { rough: 0.3, metal: 0.6 }));
          st.baseCone.rotation.x = PI / 2; st.baseCone.position.set(0, 0, -0.14); st.baseCone.castShadow = true; S.add(st.baseCone);
          st.topBlock = S.box([0.8, 0.8, 0.25], [0, 0, H + 0.125], { c: 'muted', rough: 0.6, coat: 0.2 });
          st.topCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 24), S.mat('ink', { rough: 0.3, metal: 0.6 }));
          st.topCone.rotation.x = -PI / 2; st.topCone.position.set(0, 0, H + 0.14); st.topCone.castShadow = true; S.add(st.topCone);
          st.cap = S.box([0.34, 0.34, 0.05], [0, 0, H + 0.025], { c: 'ink', rough: 0.3, metal: 0.6 });
          st.load = S.arrow([0, 0, H + 1.15], [0, 0, -0.95], { c: 'hl', r: 0.05, glow: 0.2 });
          st.pLab = S.label('', [0.1, 0, H + 1.2], { small: true });
          st.ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.028, 12, 36), S.mat('hl', { rough: 0.3, metal: 0.5 }));
          st.ring.castShadow = true; S.add(st.ring);
          st.strutL = S.box([0.8, 0.05, 0.05], [-0.55, 0, 1], { c: 'muted', metal: 0.5 }); st.strutR = S.box([0.8, 0.05, 0.05], [0.55, 0, 1], { c: 'muted', metal: 0.5 });
          st.postL = S.box([0.12, 0.5, 0.5], [-0.98, 0, 1], { c: 'muted', rough: 0.7 }); st.postR = S.box([0.12, 0.5, 0.5], [0.98, 0, 1], { c: 'muted', rough: 0.7 });
          st.hdl = S.handle([0.34, 0, v.bh * H], { plane: [[0, 1, 0], [0, 0, 0]], bounds: [0.34, 0.34, -1, 1, 0.05 * H, 0.95 * H], r: 0.075, onDrag: (q) => { const nb = Math.round(Math.min(0.95, Math.max(0.05, q.z / H)) * 100) / 100; ctx.set('brace', 1, true); ctx.set('bh', nb); return [0.34, 0, nb * H]; } });
          st.hdl.labelItem = S.label(T('drag the brace', '支えをドラッグ'), [0.34, 0, v.bh * H], { small: true });
        },
        update(S) {
          const w = shapes[Math.min(mode, shapes.length) - 1] || (() => 0);
          const pts = L.seq(61, (i) => { const xi = i / 60; return [AMP * H * w(xi), 0, xi * H]; });
          st.col.update(pts);
          const top = pts[60];
          st.ghost.forEach((gh, i) => { const s = shapes[i]; gh.material.opacity = s && i + 1 !== mode ? 0.55 : 0; if (s && i + 1 !== mode) gh.update(L.seq(61, (j) => [AMP * H * s(j / 60), 0, j / 60 * H])); });
          const e = ENDS[bc];
          st.baseBlock.visible = e[0] === 'f'; st.baseCone.visible = e[0] === 'p';
          st.topBlock.visible = e[1] === 'f'; st.topCone.visible = e[1] === 'p';
          st.cap.position.set(top[0], 0, H + 0.025); st.load.set([top[0], 0, H + 1.15], [0, 0, -0.95]);
          st.pLab.set([top[0] + 0.1, 0, H + 1.2], 'P = ' + fmt(Pn, 0) + ' kN');
          const zb = v.bh * H;
          [st.ring, st.strutL, st.strutR, st.postL, st.postR].forEach((m) => { m.visible = braced; });
          st.ring.position.set(0, 0, zb); st.strutL.position.set(-0.55, 0, zb); st.strutR.position.set(0.55, 0, zb); st.postL.position.set(-0.98, 0, zb); st.postR.position.set(0.98, 0, zb);
          st.hdl.at([0.34, 0, zb]); st.hdl.setColour(braced ? 'hl' : 'muted');
          st.hdl.labelItem.set([0.34, 0, zb]);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
