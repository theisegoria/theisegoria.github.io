'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const PI = Math.PI, TAU = 2 * PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
  const bump = (u) => { const a = Math.abs(u); return a >= 1 ? 0 : (1 - a * a) ** 2; };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const sub = (n) => String(n).split('').map((c) => SUB[c] ?? c).join('');

  /* ---------- model (pure, checked by checks/knot-theory.cjs) ---------- */

  /* 1. A diagram from a closed polyline. P is an array of [x, y] or [x, y, z]; the projection is (x, y).
     Crossings are found as segment intersections; over/under comes from z, or, with o.alternate, by
     alternating along the curve (Gauss parity makes that consistent on any planar closed curve).
     Returns the crossings with their signs, the writhe, the arcs (between under-passes, as parameter
     intervals), the colouring matrix (2·over − in − out per crossing), the determinant (a minor of it)
     and the number of tricolourings. */
  function segInt(a, b, c, d) {
    const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
    const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-14) return null;
    const qx = c[0] - a[0], qy = c[1] - a[1];
    const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
    if (t < 0 || t >= 1 || u < 0 || u >= 1) return null;
    return [t, u];
  }
  function diagram(P, o = {}) {
    const N = P.length, alt = !!o.alternate;
    const bx0 = new Float64Array(N), bx1 = new Float64Array(N), by0 = new Float64Array(N), by1 = new Float64Array(N);
    for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; bx0[i] = Math.min(a[0], b[0]); bx1[i] = Math.max(a[0], b[0]); by0[i] = Math.min(a[1], b[1]); by1[i] = Math.max(a[1], b[1]); }
    const X = [];
    for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) {
      if (i === 0 && j === N - 1) continue;
      if (bx1[i] < bx0[j] || bx1[j] < bx0[i] || by1[i] < by0[j] || by1[j] < by0[i]) continue;
      const r = segInt(P[i], P[(i + 1) % N], P[j], P[(j + 1) % N]); if (!r) continue;
      const a = P[i], b = P[(i + 1) % N];
      const x = a[0] + (b[0] - a[0]) * r[0], y = a[1] + (b[1] - a[1]) * r[0];
      // a crossing exactly on a shared vertex is found by two adjacent segment pairs; keep one
      if (X.some((c) => Math.abs(c.x - x) < 1e-9 && Math.abs(c.y - y) < 1e-9 && Math.abs(c.i - i) <= 1 && Math.abs(c.j - j) <= 1)) continue;
      X.push({ i, j, s: r[0], u: r[1], x, y });
    }
    const n = X.length;
    const passes = [];
    X.forEach((c, k) => { passes.push({ tau: c.i + c.s, k, which: 0 }); passes.push({ tau: c.j + c.u, k, which: 1 }); });
    passes.sort((a, b) => a.tau - b.tau);
    if (alt) passes.forEach((p, m) => { p.over = m % 2 === 0; });
    else {
      const zAt = (i, s) => { const a = P[i], b = P[(i + 1) % N]; return (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * s; };
      X.forEach((c) => { c.overWhich = zAt(c.i, c.s) >= zAt(c.j, c.u) ? 0 : 1; });
      passes.forEach((p) => { p.over = X[p.k].overWhich === p.which; });
    }
    const tangent = (i) => { const a = P[i], b = P[(i + 1) % N]; return [b[0] - a[0], b[1] - a[1]]; };
    let writhe = 0;
    passes.forEach((p) => { const c = X[p.k]; if (p.over) c.overPass = p; else c.underPass = p; });
    X.forEach((c) => {
      if (!c.overPass || !c.underPass) { c.sign = 0; c.bad = true; return; }
      const to = tangent(c.overPass.which ? c.j : c.i), tu = tangent(c.underPass.which ? c.j : c.i);
      c.sign = Math.sign(to[0] * tu[1] - to[1] * tu[0]); writhe += c.sign;
    });
    // arcs: between consecutive under-passes
    const U = passes.filter((p) => !p.over);
    U.forEach((p, m) => { p.m = m; });
    const arcs = U.map((p, m) => [p.tau, m + 1 < U.length ? U[m + 1].tau : U[0].tau + N]);
    const arcOf = (tau) => { let k = -1; for (let m = 0; m < U.length; m++) if (U[m].tau < tau) k = m; return (k + U.length) % U.length; };
    const M = X.map((c) => {
      const row = new Array(Math.max(1, U.length)).fill(0);
      if (c.bad) return row;
      c.overArc = arcOf(c.overPass.tau); c.inArc = (c.underPass.m - 1 + U.length) % U.length; c.outArc = c.underPass.m;
      row[c.overArc] += 2; row[c.inArc] -= 1; row[c.outArc] -= 1;
      return row;
    });
    const det = Math.abs(detInt(M.slice(0, Math.max(0, n - 1)).map((r) => r.slice(0, Math.max(0, n - 1)))));
    return { X, n, writhe, arcs, M, det, tri: countColourings(M, U.length, 3), passes };
  }
  // Bareiss fraction-free elimination: exact for small integer matrices
  function detInt(A) {
    const n = A.length; if (!n) return 1;
    const M = A.map((r) => r.slice()); let prev = 1, sign = 1;
    for (let k = 0; k < n - 1; k++) {
      if (M[k][k] === 0) { let sw = -1; for (let i = k + 1; i < n; i++) if (M[i][k] !== 0) { sw = i; break; } if (sw < 0) return 0; const t = M[k]; M[k] = M[sw]; M[sw] = t; sign = -sign; }
      for (let i = k + 1; i < n; i++) for (let j = k + 1; j < n; j++) M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) / prev;
      prev = M[k][k];
    }
    return sign * M[n - 1][n - 1];
  }
  // brute force: colourings of the m arcs with q colours satisfying 2·over − in − out ≡ 0 (mod q) at every crossing
  function countColourings(M, m, q) {
    if (!M.length || m === 0) return q;
    const rows = M.map((r) => { const nz = []; r.forEach((v, a) => { if (v) nz.push([a, v]); }); return nz; });
    const col = new Array(m).fill(0); const total = q ** m; let cnt = 0;
    for (let code = 0; code < total; code++) {
      let c = code; for (let a = 0; a < m; a++) { col[a] = c % q; c = (c - col[a]) / q; }
      let good = true;
      for (const nz of rows) { let s = 0; for (const [a, v] of nz) s += v * col[a]; if (((s % q) + q) % q !== 0) { good = false; break; } }
      if (good) cnt++;
    }
    return cnt;
  }
  const firstNontrivial = (M, m, q) => {
    if (!M.length) return null;
    const total = q ** m, col = new Array(m).fill(0);
    for (let code = 0; code < total; code++) {
      let c = code; for (let a = 0; a < m; a++) { col[a] = c % q; c = (c - col[a]) / q; }
      if (col.every((v) => v === col[0])) continue;
      if (M.every((r) => ((r.reduce((s, v, a) => s + v * col[a], 0) % q) + q) % q === 0)) return col.slice();
    }
    return null;
  };
  const rowOK = (row, col, q) => ((row.reduce((s, v, a) => s + v * col[a], 0) % q) + q) % q === 0;
  // points along the polyline at fractional parameter tau, and the drawn pieces (arcs shortened by a gap at each under-pass)
  function pointAt(P, tau) { const N = P.length; tau = ((tau % N) + N) % N; const i = Math.floor(tau), f = tau - i, a = P[i], b = P[(i + 1) % N]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
  function piece(P, t0, t1) { const pts = [pointAt(P, t0)]; for (let i = Math.floor(t0) + 1; i <= Math.floor(t1); i++) if (i > t0 && i < t1) pts.push(pointAt(P, i)); pts.push(pointAt(P, t1)); return pts; }
  function pieces(P, dg, gapLen) {
    if (!dg.n) return [P.map((p) => [p[0], p[1]]).concat([[P[0][0], P[0][1]]])];
    let len = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const gap = gapLen / (len / P.length);
    return dg.arcs.map(([a, b]) => { const g = Math.min(gap, (b - a) / 2.5); return piece(P, a + g, b - g); });
  }

  /* 2. Curves. The standard trefoil as a space curve, the trefoil as the closed 3-braid σ1σ2σ1σ2 with a
     Reidemeister move morphing inside it, twist knots (clasp plus n half twists) and (2, q) torus shadows. */
  const torusTrefoil3D = (N = 300) => L.seq(N, (k) => { const t = TAU * k / N; return [Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t)]; });
  const torusShadow = (q, N = 320) => L.seq(N, (k) => { const t = TAU * k / N, r = 2 + Math.cos(q * t); return [r * Math.cos(2 * t), r * Math.sin(2 * t)]; });

  const RHO0 = 1.0, DRHO = 0.6, SLOTS = 6;
  const rad = (pos) => RHO0 + (pos - 1) * DRHO;
  const win = (u) => bump(2 * u - 1);
  // blocks: f(entry position, u) -> [position, z, angular offset in slot units]; perm maps entry position to exit position
  const gen = (i) => ({ span: 1, perm: (p) => (p === i ? i + 1 : p === i + 1 ? i : p), f: (p, u) => (p === i ? [i + smooth(u), win(u), 0] : p === i + 1 ? [i + 1 - smooth(u), -win(u), 0] : [p, 0, 0]) });
  const straight = () => ({ span: 1, perm: (p) => p, f: (p) => [p, 0, 0] });
  // R3 as σ2σ1σ2 -> σ1σ2σ1 over three slots: A climbs 1 -> 3, D descends 3 -> 1 (under both), B bulges out (lam = 0) or in (lam = 1)
  const s3 = (x) => smooth(3 * x);
  const r3 = (lam) => ({ span: 3, perm: (p) => 4 - p, f: (p, u) => (p === 1 ? [1 + s3(u - (1 - lam) / 3) + s3(u - (2 - lam) / 3), win(u), 0] : p === 3 ? [3 - s3(u - lam / 3) - s3(u - (1 + lam) / 3), -win(u), 0] : [2 + (1 - 2 * lam) * (s3(u) - s3(u - 2 / 3)), 0, 0]) });
  const r2 = (lam) => ({ span: 1, perm: (p) => p, f: (p, u) => (p === 1 ? [1 + 1.6 * lam * win(u), win(u), 0] : p === 2 ? [2, -win(u), 0] : [3, 0, 0]) });
  const r1 = (lam) => ({ span: 1, perm: (p) => p, f: (p, u) => { if (p !== 3) return [p, 0, 0]; const s = 2 * u - 1; return [3 + 0.58 * lam * (1 + Math.cos(PI * s)), -lam * Math.sin(PI * s), -0.4 * lam * Math.sin(PI * s)]; } });
  // the trefoil as the closure of σ1σ2σ1σ2 on three strands, with one move region active
  function braidCurve(move, lam, M = 41) { // 41 samples per slot: no crossing of two symmetric profiles lands on a shared vertex
    const blocks = move === 2 ? [gen(1), r3(lam), r2(0), r1(0)] : [gen(1), gen(2), gen(1), gen(2), r2(move === 1 ? lam : 0), r1(move === 0 ? lam : 0)];
    const pts = []; let pos = 1, turns = 0;
    do {
      let slot = 0;
      for (const b of blocks) {
        const entry = pos, m = M * b.span;
        for (let k = 0; k < m; k++) { const u = k / m, [q, z, dth] = b.f(entry, u); const th = (slot + b.span * u + dth) * TAU / SLOTS, r = rad(q); pts.push([r * Math.cos(th), r * Math.sin(th), z]); }
        pos = b.perm(entry); slot += b.span;
      }
      turns++;
    } while (pos !== 1 && turns < 3);
    return pts;
  }
  // the angular extent (in slot units) of the region a move acts on
  const MOVE_SLOTS = [[5, 6], [4, 5], [1, 4]];

  const hermite = (P0, T0, P1, T1, m) => L.seq(m, (k) => { const t = k / m, t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2; return [h00 * P0[0] + h10 * T0[0] + h01 * P1[0] + h11 * T1[0], h00 * P0[1] + h10 * T0[1] + h01 * P1[1] + h11 * T1[1]]; });
  // twist knot with n half twists and a clasp: n = 0 unknot, 1 trefoil, 2 figure-eight, 4 stevedore
  function twistShadow(n) {
    const xa = -2.3, xb = 0.5, h = 0.5, xc = 1.7, hc = 0.5, yt = 1.25, K = 7, k = 2.2, ms = 24 + 16 * n;
    const x = (s) => xa + (xb - xa) * s;
    const strand = (sgn, from, to) => L.seq(ms, (i) => { const s = from + (to - from) * i / ms; return [x(s), sgn * h * Math.cos(PI * n * s)]; });
    const claspL = (from, to) => L.seq(40, (i) => { const u = from + (to - from) * i / 40; return [xc - hc * Math.cos(TAU * u), yt - 2 * yt * u]; });
    const claspR = L.seq(40, (i) => { const u = i / 40; return [xc + hc * Math.cos(TAU * u), -yt + 2 * yt * u]; });
    const pts = [];
    pts.push(...strand(1, 0, 1));
    if (n % 2 === 0) { pts.push(...hermite([xb, h], [k, 0], [xc - hc, yt], [0, -k], 24)); pts.push(...claspL(0, 1)); pts.push(...hermite([xc - hc, -yt], [0, -k], [xb, -h], [-k, 0], 24)); }
    else { pts.push(...hermite([xb, -h], [k, 0], [xc - hc, -yt], [0, k], 24)); pts.push(...claspL(1, 0)); pts.push(...hermite([xc - hc, yt], [0, k], [xb, h], [-k, 0], 24)); }
    pts.push(...strand(-1, 1, 0));
    pts.push(...hermite([xa, -h], [-K, 0], [xc + hc, -yt], [0, K], 60));
    pts.push(...claspR);
    pts.push(...hermite([xc + hc, yt], [0, K], [xa, h], [K, 0], 60));
    return pts;
  }
  // the five knots of the colouring experiment: name, crossing count, generator
  const KNOTS = [
    { name: ['unknot', '自明な結び目'], sym: '0₁', gen: () => twistShadow(0) },
    { name: ['trefoil', '三葉結び目'], sym: '3₁', gen: () => torusShadow(3) },
    { name: ['figure-eight', '8の字結び目'], sym: '4₁', gen: () => twistShadow(2) },
    { name: ['cinquefoil', '五つ葉結び目'], sym: '5₁', gen: () => torusShadow(5) },
    { name: ['stevedore', 'ステベドア結び目'], sym: '6₁', gen: () => twistShadow(4) },
  ];
  const knotDiagram = (k) => { const P = KNOTS[k].gen(); return { P, dg: diagram(P, { alternate: true }) }; };

  /* 3. Torus knots and links T(p, q) */
  const components = (p, q) => gcd(p, q);
  const crossingNumber = (p, q) => Math.min(p * (q - 1), q * (p - 1));
  const genus = (p, q) => ((p - 1) * (q - 1) + 1 - gcd(p, q)) / 2;
  const unknotting = (p, q) => (p - 1) * (q - 1) / 2;
  // integer polynomials as coefficient arrays, low degree first
  const pmul = (a, b) => { const c = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { c[i + j] += x * y; })); return c; };
  function pdiv(a, b) { // exact division, throws if the remainder is not zero
    const r = a.slice(), q = new Array(Math.max(1, a.length - b.length + 1)).fill(0), db = b.length - 1;
    for (let i = a.length - 1; i >= db; i--) { const c = r[i] / b[db]; q[i - db] = c; for (let j = 0; j <= db; j++) r[i - db + j] -= c * b[j]; }
    if (r.some((x) => Math.abs(x) > 1e-9)) throw new Error('inexact division');
    return q.map((x) => Math.round(x));
  }
  const tn1 = (n) => { const a = new Array(n + 1).fill(0); a[0] = -1; a[n] = 1; return a; }; // t^n - 1
  function alexander(p, q) {
    const d = gcd(p, q), Lc = p * q / d;
    let num = tn1(1); for (let i = 0; i < d; i++) num = pmul(num, tn1(Lc));
    return pdiv(pdiv(num, tn1(p)), tn1(q));
  }
  function polyString(c) {
    const terms = [];
    for (let i = c.length - 1; i >= 0; i--) {
      const v = c[i]; if (!v) continue;
      const mag = Math.abs(v), body = i === 0 ? String(mag) : (mag === 1 ? '' : String(mag)) + 't' + (i === 1 ? '' : sup(i));
      terms.push((v < 0 ? (terms.length ? ' − ' : '−') : (terms.length ? ' + ' : '')) + body);
    }
    return terms.join('') || '0';
  }
  const braidWord = (p, q) => { const w = L.seq(p - 1, (i) => 'σ' + sub(i + 1)).join(''); return p === 2 ? `σ₁${sup(q)}` : `(${w})${sup(q)}`; };
  // the (p, q) torus link on the torus of radii R, r: component k, parameter t in [0, 2π/d)
  function torusPoints(p, q, R = 2, r = 0.85, per = 120) {
    const d = gcd(p, q), out = [];
    for (let k = 0; k < d; k++) {
      const ph = TAU * k / p, n = Math.max(per, Math.round(60 * (p + q) / d));
      out.push(L.seq(n, (i) => { const t = TAU / d * i / n, w = q * t + ph, a = p * t, rr = R + r * Math.cos(w); return [rr * Math.cos(a), rr * Math.sin(a), r * Math.sin(w), a, w]; }));
    }
    return out;
  }

  (window.LabModels = window.LabModels || {})['knot-theory'] = { gcd, diagram, detInt, countColourings, firstNontrivial, rowOK, pieces, torusTrefoil3D, torusShadow, braidCurve, twistShadow, KNOTS, knotDiagram, components, crossingNumber, genus, unknotting, alexander, polyString, braidWord, torusPoints, pmul, pdiv };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt, COL4 = ['c1', 'c2', 'c3', 'c4'];

  /* ---------- 1. Reidemeister moves ---------- */
  D['reidemeister'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, move = v.move, DUR = 2.6;
      if (st.move !== move) {
        const NS = 60, lams = L.seq(NS, (i) => i / (NS - 1));
        st.curves = lams.map((lam) => { const P = braidCurve(move, lam); return { lam, P, dg: diagram(P) }; });
        st.move = move;
      }
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const capt = [T('The trefoil as the closed braid σ₁σ₂σ₁σ₂. Press Play: a kink grows on the outer strand until it crosses itself.', '閉じた組みひも σ₁σ₂σ₁σ₂ として描いた三葉結び目です。再生を押すと、外側のひもにねじりが育ち、やがて自分自身と交わります。'),
        T('The trefoil as the closed braid σ₁σ₂σ₁σ₂. Press Play: the inner strand is pushed across its neighbour and two crossings of opposite sign appear.', '閉じた組みひも σ₁σ₂σ₁σ₂ として描いた三葉結び目です。再生を押すと、内側のひもが隣のひもを越えて押し込まれ、符号が逆の交点が二つ現れます。'),
        T('The trefoil as the closed braid σ₁(σ₂σ₁σ₂). Press Play: the middle strand slides across the crossing of the other two, σ₂σ₁σ₂ becoming σ₁σ₂σ₁.', '閉じた組みひも σ₁(σ₂σ₁σ₂) として描いた三葉結び目です。再生を押すと、真ん中のひもが他の二本の交点を越えて滑り、σ₂σ₁σ₂ が σ₁σ₂σ₁ になります。')][move];
      L.h('p', 'lab-cap', c1, capt);
      const R = 3.15, f = L.fig(c1, { x: [-R, R], y: [-R, R], equal: true, axes: false, maxH: 460 });
      // the sector the move acts on
      const [s0, s1] = MOVE_SLOTS[move], sec = [[0, 0]];
      for (let i = 0; i <= 30; i++) { const th = (s0 + (s1 - s0) * i / 30) * TAU / SLOTS; sec.push([3.1 * Math.cos(th), 3.1 * Math.sin(th)]); }
      f.poly(sec, { c: 'hl', fill: 'hl', fo: 0.08, w: 0, layer: 'under' });
      const gap = 0.14;
      const draw = (lam) => {
        f.clear('main'); f.clear('over');
        const idx = Math.round(lam * (st.curves.length - 1)), { P, dg } = st.curves[idx];
        pieces(P, dg, gap).forEach((pts) => f.line(pts, { c: 'c1', w: 3 }));
        dg.X.forEach((c) => { if (c.bad) return; const sc = c.sign > 0 ? 'c2' : 'c4'; f.dot(c.x, c.y, { c: sc, r: 3.4, layer: 'over' }); f.text(c.x, c.y, c.sign > 0 ? '+' : '−', { small: true, c: sc, dx: 9, dy: -6, layer: 'over' }); });
        return dg;
      };
      // right: the invariants along the move
      L.h('p', 'lab-cap', c2, T('The same quantities along the move, read off the diagram at each instant. The gold marker is the frame on the left.', '移動の途中の各瞬間に図から読み取った同じ量です。金色の印が左の図の時刻を示します。'));
      const g = L.fig(c2, { x: [0, 1], y: [-0.5, 7.5], aspect: 0.75, xlabel: T('progress of the move (0 before, 1 after)', '移動の進み具合（0 が前、1 が後）'), ticksX: [[0, '0'], [0.5, '½'], [1, '1']], ticksY: [[0, '0'], [2, '2'], [4, '4'], [6, '6']], maxH: 360 });
      g.text(TAU * 0.97, TAU * 0.94, T('ψ, through the hole', 'ψ：穴を通る'), { anchor: 'end', small: true, c: 'muted' });
      const series = (key, c, o) => g.line(st.curves.map((s) => [s.lam, s.dg[key]]), Object.assign({ c }, o));
      series('n', 'c1', { w: 3.4 }); series('writhe', 'c2', { w: 2.2, dash: '6 4' }); series('det', 'c3', { w: 2.4 });
      const mark = (lam) => { g.clear('over'); const s = st.curves[Math.round(lam * (st.curves.length - 1))]; g.vline(lam, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' }); [['n', 'c1'], ['writhe', 'c2'], ['det', 'c3']].forEach(([k, c]) => g.dot(lam, s.dg[k], { c, r: 4.5, layer: 'over' })); };
      const readout = (dg) => ctx.readout([
        { k: T('crossings', '交点の数'), v: String(dg.n), tone: 'key' },
        { k: T('writhe Σ sign', 'ライズ Σ 符号'), v: fmt(dg.writhe, 0), tone: move === 0 ? 'warn' : 'good' },
        { k: T('determinant', '行列式'), v: String(dg.det), tone: 'good' },
        { k: T('tricolourings', '三彩色の数'), v: String(dg.tri) },
      ], [T('R1 adds one crossing and changes the writhe by exactly one; the determinant and the number of tricolourings do not move. Writhe is a property of the diagram, not of the knot.', 'R1 は交点を一つ増やし、ライズをちょうど 1 だけ変えます。行列式と三彩色の数は動きません。ライズは結び目ではなく図の性質です。'),
        T('R2 adds two crossings of opposite sign, so the writhe is unchanged, and so are the determinant and the tricolourings.', 'R2 は符号が逆の交点を二つ加えるので、ライズは変わらず、行列式と三彩色の数も変わりません。'),
        T('R3 keeps the number of crossings and every sign. The instant the middle strand passes through the crossing is the only non-generic moment of the move.', 'R3 は交点の数もすべての符号も保ちます。真ん中のひもが交点を通り過ぎる瞬間だけが、この移動で一般的でない唯一の瞬間です。')][move]);
      let last = draw(1); mark(1); readout(last);
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        const lam = smooth(Math.min(1, t / DUR)); last = draw(lam); mark(lam); readout(last);
        lab.textContent = T(`progress ${fmt(lam, 2)}`, `進み具合 ${fmt(lam, 2)}`);
        if (t >= DUR) return false;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play the move', '移動を再生') });
      L.legend(ctx.host, [{ c: 'c1', label: T('diagram (gaps mark the under-strand), and its crossing count', '図（切れ目が下側のひも）とその交点の数') }, { c: 'c2', kind: 'dot', label: T('positive crossing', '正の交点') }, { c: 'c4', kind: 'dot', label: T('negative crossing', '負の交点') }, { c: 'c2', dash: true, label: T('writhe', 'ライズ') }, { c: 'c3', label: T('determinant', '行列式') }]);
    },
  };

  /* ---------- 2. colouring a knot ---------- */
  const COL = ['c1', 'c2', 'hl'];
  D['tricolour'] = {
    render(ctx, v) {
      const st = ctx.state, k = v.knot, q = v.n;
      if (st.k !== k) { const { P, dg } = knotDiagram(k); const m = dg.arcs.length; Object.assign(st, { k, P, dg, m, col: firstNontrivial(dg.M, m, 3) || new Array(m).fill(0), counts: {} }); }
      const { P, dg, m } = st, col = st.col;
      st.counts[q] ??= countColourings(dg.M, m, q);
      const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
      const x0 = Math.min(...xs) - 0.35, x1 = Math.max(...xs) + 0.35, y0 = Math.min(...ys) - 0.35, y1 = Math.max(...ys) + 0.35;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`${KNOTS[k].sym}, ${KNOTS[k].name[0]}. Click an arc to change its colour. A crossing is marked ✓ when its three arcs are all alike or all different.`, `${KNOTS[k].sym}、${KNOTS[k].name[1]}です。弧をクリックすると色が変わります。三本の弧がすべて同じかすべて異なる交点に ✓ が付きます。`));
      const f = L.fig(c1, { x: [x0, x1], y: [y0, y1], equal: true, axes: false, maxH: 420 });
      const pcs = pieces(P, dg, 0.13);
      pcs.forEach((pts, a) => {
        f.line(pts, { c: COL[col[a]], w: 4.2 });
        const hit = f.line(pts, { c: 'ink', w: 26, op: 0, layer: 'over' });
        hit.style.cursor = 'pointer'; hit.setAttribute('tabindex', '0'); hit.setAttribute('role', 'button'); hit.setAttribute('aria-label', T(`Arc ${a}: change colour`, `弧 ${a}：色を変える`));
        const cycle = () => { col[a] = (col[a] + 1) % 3; ctx.redraw(); };
        hit.addEventListener('click', cycle); hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(); } });
        const mid = pts[Math.floor(pts.length / 4)];
        f.text(mid[0], mid[1], 'a' + sub(a), { small: true, c: 'muted', dx: 9, dy: -8, anchor: 'start' });
      });
      let sat = 0;
      dg.X.forEach((c, i) => { const good = rowOK(dg.M[i], col, 3); if (good) sat++; f.text(c.x, c.y, good ? '✓' : '✗', { small: true, c: 'ink', dx: 0, dy: -9, layer: 'over' }); });
      const valid = sat === dg.n, trivial = col.every((c) => c === col[0]);
      // right: the colouring matrix
      L.h('p', 'lab-cap', c2, T('The colouring matrix: one row per crossing (2 at the over-arc, −1 at the two under-arcs), one column per arc. A colouring is valid when every row sums to 0 mod 3 with the colours as 0, 1, 2. The determinant is any (n−1)×(n−1) minor.', '彩色行列です。行が交点（上側の弧に 2、下側の二本の弧に −1）、列が弧です。色を 0, 1, 2 とみなして各行の和が mod 3 で 0 になるとき、彩色は正しいものです。行列式は任意の (n−1)×(n−1) 小行列式です。'));
      const rows = Math.max(1, dg.n), cols = Math.max(1, m), W = cols + 2.6, H = rows + 1.6;
      const g = L.fig(c2, { x: [0, W], y: [0, H], equal: true, axes: false, maxH: 300 });
      for (let a = 0; a < cols; a++) { g.rect(a + 0.55, H - 1, 0.9, 0.45, { c: COL[col[a]], fill: COL[col[a]], fo: 0.85, nostroke: true }); g.text(a + 1, H - 0.72, 'a' + sub(a), { small: true, c: 'plate' }).style.stroke = 'none'; }
      for (let i = 0; i < rows; i++) {
        const y = H - 1.5 - i, good = dg.n ? rowOK(dg.M[i], col, 3) : true;
        if (i === rows - 1 && dg.n > 1) g.rect(0.5, y - 0.5, cols - 1, rows - 1, { c: 'c4', fill: 'c4', fo: 0.12, w: 1, dash: '3 3', layer: 'under' });
        for (let a = 0; a < cols; a++) { const val = dg.n ? dg.M[i][a] : 0; g.text(a + 1, y, val === 0 ? '·' : fmt(val, 0), { c: val === 0 ? 'muted' : 'ink', math: false, dy: 5 }); }
        g.text(cols + 1.2, y, dg.n ? (good ? '≡ 0 ✓' : '≢ 0 ✗') : '', { small: true, c: 'ink', anchor: 'start', dy: 4 });
        g.text(0.25, y, 'c' + sub(i), { small: true, c: 'muted', anchor: 'start', dy: 4 });
      }
      if (dg.n > 1) g.text(0.5, 0.15, T(`dashed minor: |det| = ${dg.det}`, `破線の小行列式：|det| = ${dg.det}`), { small: true, c: 'c4', anchor: 'start' });
      L.legend(ctx.host, [{ c: 'c1', label: T('colour 0', '色 0') }, { c: 'c2', label: T('colour 1', '色 1') }, { c: 'hl', label: T('colour 2', '色 2') }, { c: 'c4', kind: 'fill', label: T('the minor whose determinant is det K', '行列式 det K を与える小行列') }]);
      const gq = gcd(q, dg.det), can = gq > 1;
      ctx.readout([
        { k: T('crossings satisfied', '規則を満たす交点'), v: `${sat} / ${dg.n}`, tone: valid ? 'good' : 'warn' },
        { k: T('valid tricolouring', '正しい三彩色'), v: valid ? (trivial ? T('yes (trivial)', 'はい（自明）') : T('yes', 'はい')) : T('no', 'いいえ'), tone: valid && !trivial ? 'good' : undefined },
        { k: T('tricolourings of this diagram', 'この図の三彩色の数'), v: String(dg.tri), tone: 'key' },
        { k: T('determinant', '行列式'), v: String(dg.det), tone: 'key' },
        { k: `gcd(${q}, det)`, v: String(gq) },
        { k: T(`nontrivially ${q}-colourable`, `非自明な ${q}-彩色が可能`), v: can ? T('yes', 'はい') : T('no', 'いいえ'), tone: can ? 'good' : undefined },
        { k: T(`${q}-colourings (brute force)`, `${q}-彩色の数（総当たり）`), v: String(st.counts[q]) },
      ], T(`A knot is nontrivially n-colourable exactly when gcd(n, det) > 1. Tricolourings always number 3·3ʲ for some j, the 3 trivial ones included, so ${KNOTS[k].sym} has ${dg.tri}: ${dg.tri === 3 ? 'only the trivial colourings' : 'six nontrivial ones on top of the trivial three'}.`, `結び目が非自明に n-彩色できるのは、ちょうど gcd(n, det) > 1 のときです。三彩色の数はつねに、自明な 3 通りを含めて 3·3ʲ の形になるので、${KNOTS[k].sym} では ${dg.tri} 通りです。${dg.tri === 3 ? '自明な彩色しかありません。' : '自明な 3 通りに加えて非自明なものが 6 通りあります。'}`));
    },
  };

  /* ---------- 3. torus knots ---------- */
  const rotate = (pt, yaw, pitch) => {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = pt[0] * cy + pt[1] * sy, y1 = -pt[0] * sy + pt[1] * cy, z = pt[2];
    return [x, y1 * cp - z * sp, y1 * sp + z * cp]; // screen x, screen y (up), depth toward the viewer
  };
  D['torus-knots'] = {
    render(ctx, v) {
      const st = ctx.state, p = v.p, q = v.q, d = gcd(p, q);
      st.yaw ??= 0.55; st.pitch ??= -1.05;
      const comps = torusPoints(p, q, 2, 0.85, 120);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('T(p, q) on its torus: p turns around the axis, q turns through the hole. Drag to rotate (arrow keys work too). Nearer tube segments are drawn over farther ones.', 'トーラス上の T(p, q) です。軸のまわりを p 回、穴を q 回通ります。ドラッグで回転できます（矢印キーでも動きます）。手前の管が奥の管の上に描かれます。'));
      const Rv = 3.15, f = L.fig(c1, { x: [-Rv, Rv], y: [-Rv, Rv], equal: true, axes: false, maxH: 460 });
      // the torus itself, as meridians and parallels
      const R = 2, r = 0.85, ring = (fn) => f.line(L.seq(73, (i) => { const [x, y] = rotate(fn(TAU * i / 72), st.yaw, st.pitch); return [x, y]; }), { c: 'muted', w: 0.9, op: 0.45, layer: 'under' });
      for (let k = 0; k < 8; k++) { const a = TAU * k / 8; ring((w) => [(R + r * Math.cos(w)) * Math.cos(a), (R + r * Math.cos(w)) * Math.sin(a), r * Math.sin(w)]); }
      [0, PI / 2, PI, 3 * PI / 2].forEach((w) => ring((a) => [(R + r * Math.cos(w)) * Math.cos(a), (R + r * Math.cos(w)) * Math.sin(a), r * Math.sin(w)]));
      // depth-sorted tube chunks
      const chunks = [];
      comps.forEach((pts, ci) => {
        const S = pts.map((pt) => rotate(pt, st.yaw, st.pitch)), n = S.length;
        for (let i = 0; i < n; i += 2) { const a = S[i], b = S[(i + 1) % n], c = S[(i + 2) % n]; chunks.push({ z: (a[2] + b[2] + c[2]) / 3, pts: [[a[0], a[1]], [b[0], b[1]], [c[0], c[1]]], c: COL4[ci % 4] }); }
      });
      chunks.sort((a, b) => a.z - b.z);
      for (const ch of chunks) {
        // butt caps throughout: a chunk never paints back over its predecessor, so the tube reads as continuous
        f.line(ch.pts, { c: 'plate', w: 11 }).style.strokeLinecap = 'butt';
        f.line(ch.pts, { c: ch.c, w: 5.6 }).style.strokeLinecap = 'butt';
        f.line(ch.pts, { c: 'plate', w: 1.5, op: 0.35 }).style.strokeLinecap = 'butt';
      }
      // rotation by dragging anywhere, or with the arrow keys
      f.svg.style.cursor = 'grab'; f.wrap.tabIndex = 0; f.wrap.setAttribute('aria-label', T('Rotate the torus knot', 'トーラス結び目を回転'));
      f.svg.addEventListener('pointerdown', (e) => {
        e.preventDefault(); let lx = e.clientX, ly = e.clientY, raf = 0;
        const move = (ev) => { st.yaw += (ev.clientX - lx) * 0.012; st.pitch = clamp(st.pitch + (ev.clientY - ly) * 0.012, -PI, PI); lx = ev.clientX; ly = ev.clientY; if (!raf) raf = requestAnimationFrame(() => { raf = 0; ctx.redraw(); }); };
        const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
      });
      f.wrap.addEventListener('keydown', (e) => { const dd = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key]; if (!dd) return; e.preventDefault(); st.yaw += dd[0]; st.pitch += dd[1]; ctx.redraw(); });
      // right: the flat torus, where T(p, q) is a straight line of slope q/p
      L.h('p', 'lab-cap', c2, T('The same curve on the flat torus (opposite edges glued): a straight line of slope q/p. Each component is one line; a link with gcd(p, q) components is gcd(p, q) parallel lines.', '平らなトーラス（向かい合う辺を貼り合わせたもの）上の同じ曲線です。傾き q/p の直線になります。各成分が一本の直線で、gcd(p, q) 成分の絡み目は gcd(p, q) 本の平行線です。'));
      const g = L.fig(c2, { x: [0, TAU], y: [0, TAU], equal: true, xlabel: T('φ, around the axis', 'φ：軸のまわり'), ylabel: '', ticksX: [[0, '0'], [PI, 'π'], [TAU, '2π']], ticksY: [[0, '0'], [PI, 'π'], [TAU, '2π']], maxH: 360 });
      comps.forEach((pts, ci) => {
        let run = [];
        const flush = () => { if (run.length > 1) g.line(run, { c: COL4[ci % 4], w: 2.2 }); run = []; };
        pts.forEach((pt) => { const a = ((pt[3] % TAU) + TAU) % TAU, w = ((pt[4] % TAU) + TAU) % TAU; const last = run[run.length - 1]; if (last && (Math.abs(a - last[0]) > PI || Math.abs(w - last[1]) > PI)) flush(); run.push([a, w]); });
        flush();
      });
      const legend = L.seq(Math.min(d, 4), (i) => ({ c: COL4[i], label: d === 1 ? T('the knot', '結び目') : T(`component ${i + 1}`, `成分 ${i + 1}`) }));
      if (d > 4) legend.push({ c: 'muted', label: T('colours repeat beyond four components', '成分が四つを超えると色を繰り返します') });
      L.legend(ctx.host, legend);
      const isKnot = d === 1, alex = alexander(p, q), same = (a, b) => (p === a && q === b) || (p === b && q === a);
      const special = q === 1 || p === 1 ? T('the unknot', '自明な結び目') : same(2, 3) ? T('the trefoil 3₁', '三葉結び目 3₁') : same(2, 5) ? T('the cinquefoil 5₁', '五つ葉結び目 5₁') : same(2, 2) ? T('the Hopf link', 'ホップ絡み目') : same(2, 7) ? T('the knot 7₁', '結び目 7₁') : same(3, 4) ? T('the knot 8₁₉', '結び目 8₁₉') : null;
      ctx.readout([
        { k: 'T(p, q)', v: `T(${p}, ${q})` + (special ? ' = ' + special : ''), tone: 'key' },
        { k: T('components gcd(p, q)', '成分の数 gcd(p, q)'), v: String(d), tone: d > 1 ? 'warn' : undefined },
        { k: T('crossings in this drawing q(p−1)', 'この図の交点 q(p−1)'), v: String(q * (p - 1)) },
        { k: T('crossing number min(p(q−1), q(p−1))', '交点数 min(p(q−1), q(p−1))'), v: String(crossingNumber(p, q)), tone: 'good' },
        { k: T('genus of the fibre surface', 'ファイバー曲面の種数'), v: fmt(genus(p, q), 0) },
        { k: T('unknotting number (p−1)(q−1)/2', '結び目解消数 (p−1)(q−1)/2'), v: isKnot ? fmt(unknotting(p, q), 0) : T('knots only', '結び目のみ') },
        { k: 'Δ(t)', v: polyString(alex) },
        { k: T('braid word', '組みひもの語'), v: braidWord(p, q) },
        { k: 'T(q, p) ≅ T(p, q)', v: T('yes, always', 'はい、つねに') },
      ], isKnot
        ? T(`gcd(p, q) = 1, so this is a knot. Its Alexander polynomial has degree (p−1)(q−1) = ${(p - 1) * (q - 1)}, twice the genus, and the braid ${braidWord(p, q)} closes up to it on p = ${p} strands.`, `gcd(p, q) = 1 なので結び目です。アレクサンダー多項式の次数は (p−1)(q−1) = ${(p - 1) * (q - 1)} で種数の二倍、組みひも ${braidWord(p, q)} を p = ${p} 本のひもで閉じるとこの結び目になります。`)
        : T(`gcd(p, q) = ${d}, so this is a link of ${d} components, each a T(${p / d}, ${q / d}) torus knot. Δ(t) is the one-variable Alexander polynomial (t−1)(t^{pq/d}−1)^d / ((t^p−1)(t^q−1)); crossing number and genus use the same formulas as for knots.`, `gcd(p, q) = ${d} なので ${d} 成分の絡み目で、各成分はトーラス結び目 T(${p / d}, ${q / d}) です。Δ(t) は一変数のアレクサンダー多項式 (t−1)(t^{pq/d}−1)^d / ((t^p−1)(t^q−1)) で、交点数と種数は結び目と同じ公式です。`));
    },
  };
})();
