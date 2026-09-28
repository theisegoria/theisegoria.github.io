'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, DEG = PI / 180, SQ2 = Math.SQRT2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/quantum-information.cjs) ---------- */

  /* 1. CHSH. Two qubits in |Φ+> = (|00> + |11>)/√2; each party measures the spin along a
     direction in the x-z plane at angle a (Alice) or b (Bob) from the z axis. The correlation
     of the two ±1 outcomes is E(a, b) = cos(a − b). Angles in radians. */
  const E_quantum = (a, b) => Math.cos(a - b);
  // one deterministic local-hidden-variable model: a hidden angle λ uniform on the circle,
  // Alice answers sign(cos(a − λ)), Bob answers sign(cos(b − λ)); the correlation is a sawtooth
  const angleDiff = (a, b) => { let d = Math.abs(a - b) % (2 * PI); if (d > PI) d = 2 * PI - d; return d; };
  const E_lhv = (a, b) => 1 - 2 * angleDiff(a, b) / PI;
  const S = (a, ap, b, bp, E = E_quantum) => E(a, b) - E(a, bp) + E(ap, b) + E(ap, bp);
  const TSIRELSON = 2 * SQ2;
  // the largest S reachable by moving Bob's second setting b′ alone (grid, then a parabolic refinement)
  function maxOverBp(a, ap, b, E = E_quantum, n = 720) {
    let best = -Infinity, bi = 0;
    for (let i = 0; i < n; i++) { const s = S(a, ap, b, 2 * PI * i / n, E); if (s > best) { best = s; bi = i; } }
    const h = 2 * PI / n, x0 = 2 * PI * bi / n;
    const sm = S(a, ap, b, x0 - h, E), sp = S(a, ap, b, x0 + h, E), den = sm - 2 * best + sp;
    let x = x0;
    if (Math.abs(den) > 1e-12) { const dx = 0.5 * h * (sm - sp) / den; if (Math.abs(dx) < h) x = x0 + dx; }
    const s = S(a, ap, b, x, E);
    return s > best ? { bp: (x + 2 * PI) % (2 * PI), S: s } : { bp: x0, S: best };
  }
  // the largest S over all four settings (coarse grid over Alice and Bob's first settings, exact in b′)
  function maxS(E = E_quantum, n = 36) {
    let best = { S: -Infinity };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const a = 2 * PI * i / n, ap = 2 * PI * j / n, b = 2 * PI * k / n, m = maxOverBp(a, ap, b, E, 180);
      if (m.S > best.S) best = { a, ap, b, bp: m.bp, S: m.S };
    }
    return best;
  }

  /* 2. Teleportation. Three qubits, q0 = the message |ψ>, q1 = Alice's half of |Φ+>, q2 = Bob's half.
     Basis index = 4 q0 + 2 q1 + q2. Amplitudes are [re, im] pairs. */
  const cx = (re, im = 0) => [re, im];
  const cadd = (u, v) => [u[0] + v[0], u[1] + v[1]];
  const cmul = (u, v) => [u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0]];
  const cconj = (u) => [u[0], -u[1]];
  const cabs2 = (u) => u[0] * u[0] + u[1] * u[1];
  const zeros = (n) => Array.from({ length: n }, () => [0, 0]);
  const H = [[cx(1 / SQ2), cx(1 / SQ2)], [cx(1 / SQ2), cx(-1 / SQ2)]];
  const X = [[cx(0), cx(1)], [cx(1), cx(0)]];
  const Z = [[cx(1), cx(0)], [cx(0), cx(-1)]];
  const I2 = [[cx(1), cx(0)], [cx(0), cx(1)]];
  const psi1 = (th, ph) => [cx(Math.cos(th / 2)), cx(Math.sin(th / 2) * Math.cos(ph), Math.sin(th / 2) * Math.sin(ph))];
  // |ψ> ⊗ |Φ+>
  function initial(th, ph) {
    const p = psi1(th, ph), s = zeros(8);
    for (let q0 = 0; q0 < 2; q0++) { s[4 * q0 + 0] = [p[q0][0] / SQ2, p[q0][1] / SQ2]; s[4 * q0 + 3] = [p[q0][0] / SQ2, p[q0][1] / SQ2]; }
    return s;
  }
  const bitOf = (i, k) => (i >> (2 - k)) & 1;
  function gate1(s, k, U) {
    const out = s.map((a) => a.slice()), sh = 1 << (2 - k);
    for (let i = 0; i < 8; i++) if (!bitOf(i, k)) {
      const j = i | sh, a = s[i], b = s[j];
      out[i] = cadd(cmul(U[0][0], a), cmul(U[0][1], b));
      out[j] = cadd(cmul(U[1][0], a), cmul(U[1][1], b));
    }
    return out;
  }
  function cnot(s, c, t) {
    const out = s.map((a) => a.slice()), sh = 1 << (2 - t);
    for (let i = 0; i < 8; i++) if (bitOf(i, c) && !bitOf(i, t)) { out[i] = s[i | sh].slice(); out[i | sh] = s[i].slice(); }
    return out;
  }
  const norm2 = (s) => s.reduce((acc, a) => acc + cabs2(a), 0);
  // projective measurement of q0 and q1 with outcomes m1, m2: probability and the normalised post-measurement state
  function measure(s, m1, m2) {
    const keep = s.map((a, i) => (bitOf(i, 0) === m1 && bitOf(i, 1) === m2 ? a.slice() : [0, 0]));
    const p = norm2(keep), r = p > 1e-300 ? 1 / Math.sqrt(p) : 0;
    return { p, state: keep.map((a) => [a[0] * r, a[1] * r]) };
  }
  const outcomeProbs = (s) => [[0, 0], [0, 1], [1, 0], [1, 1]].map(([m1, m2]) => measure(s, m1, m2).p);
  // Bob's reduced density matrix: trace over q0 and q1
  function traceToBob(s) {
    const rho = [[cx(0), cx(0)], [cx(0), cx(0)]];
    for (let b = 0; b < 2; b++) for (let bb = 0; bb < 2; bb++) for (let k = 0; k < 4; k++) rho[b][bb] = cadd(rho[b][bb], cmul(s[2 * k + b], cconj(s[2 * k + bb])));
    return rho;
  }
  // Bloch vector of a 2x2 density matrix, ρ = (I + r·σ)/2
  const blochOfRho = (rho) => [2 * rho[0][1][0], -2 * rho[0][1][1], rho[0][0][0] - rho[1][1][0]];
  const blochOfPsi = (th, ph) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  const fidelity = (p, rho) => { let f = 0; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) f += cmul(cmul(cconj(p[i]), rho[i][j]), p[j])[0]; return f; };
  const mat2 = (A, B) => [[cadd(cmul(A[0][0], B[0][0]), cmul(A[0][1], B[1][0])), cadd(cmul(A[0][0], B[0][1]), cmul(A[0][1], B[1][1]))], [cadd(cmul(A[1][0], B[0][0]), cmul(A[1][1], B[1][0])), cadd(cmul(A[1][0], B[0][1]), cmul(A[1][1], B[1][1]))]];
  // Bob's correction for outcome (m1, m2): his qubit holds X^{m2} Z^{m1} |ψ>, so he applies Z^{m1} X^{m2}
  const correction = (m1, m2) => mat2(m1 ? Z : I2, m2 ? X : I2);
  // the whole protocol: the state after each of the five steps, for outcome (m1, m2)
  function teleport(th, ph, m1, m2) {
    const s0 = initial(th, ph), s1 = cnot(s0, 0, 1), s2 = gate1(s1, 0, H);
    const m = measure(s2, m1, m2), s3 = m.state, s4 = gate1(s3, 2, correction(m1, m2));
    const stages = [s0, s1, s2, s3, s4];
    return { stages, p: m.p, probs: outcomeProbs(s2), rhoBob: stages.map(traceToBob), psi: psi1(th, ph) };
  }

  /* 3. Entanglement entropy. |ψ(θ, β)> = (I ⊗ R_y(β)) (cos θ |00> + sin θ |11>); real amplitudes, index 2A + B. */
  const Ry = (b) => [[Math.cos(b / 2), -Math.sin(b / 2)], [Math.sin(b / 2), Math.cos(b / 2)]];
  function state2(th, be) {
    const s = [Math.cos(th), 0, 0, Math.sin(th)], R = Ry(be), out = s.slice();
    for (let A = 0; A < 2; A++) { out[2 * A] = R[0][0] * s[2 * A] + R[0][1] * s[2 * A + 1]; out[2 * A + 1] = R[1][0] * s[2 * A] + R[1][1] * s[2 * A + 1]; }
    return out;
  }
  const rhoA = (s) => { const r = [[0, 0], [0, 0]]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) r[i][j] += s[2 * i + k] * s[2 * j + k]; return r; };
  const rhoB = (s) => { const r = [[0, 0], [0, 0]]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) r[i][j] += s[2 * k + i] * s[2 * k + j]; return r; };
  const eig2 = (r) => { const m = (r[0][0] + r[1][1]) / 2, d = Math.sqrt(Math.max(0, ((r[0][0] - r[1][1]) / 2) ** 2 + r[0][1] * r[1][0])); return [m + d, m - d]; };
  const xlog = (x) => (x > 1e-300 ? x * Math.log2(x) : 0);
  const entropy = (lams) => Math.max(0, -lams.reduce((acc, l) => acc + xlog(l), 0));
  const concurrence = (s) => 2 * Math.abs(s[0] * s[3] - s[1] * s[2]);
  const blochReal = (r) => [2 * r[0][1], 0, r[0][0] - r[1][1]];
  const len3 = (v) => Math.hypot(v[0], v[1], v[2]);

  (window.LabModels = window.LabModels || {})['quantum-information'] = {
    E_quantum, E_lhv, angleDiff, S, TSIRELSON, maxOverBp, maxS,
    psi1, initial, gate1, cnot, measure, outcomeProbs, traceToBob, blochOfRho, blochOfPsi, fidelity, correction, teleport, H, X, Z, I2,
    Ry, state2, rhoA, rhoB, eig2, entropy, concurrence, blochReal, len3,
  };

  if (!L.fig) return; // model-only load (checks)

  /* ---------- shared drawing: a fixed orthographic camera for the Bloch sphere ---------- */
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  function camera(st, a0 = 0.62, e0 = 0.34) {
    st.view ||= { a: a0, e: e0 };
    const { a, e } = st.view;
    const R = [-Math.sin(a), Math.cos(a), 0], U = [-Math.cos(a) * Math.sin(e), -Math.sin(a) * Math.sin(e), Math.cos(e)], N = [Math.cos(a) * Math.cos(e), Math.sin(a) * Math.cos(e), Math.sin(e)];
    const lift = (x, y) => { const r2 = x * x + y * y; if (r2 >= 1) { const r = Math.sqrt(r2); x /= r; y /= r; return add3(scale3(R, x), scale3(U, y)); } return add3(add3(scale3(R, x), scale3(U, y)), scale3(N, Math.sqrt(1 - r2))); };
    return { P: (p) => [dot3(p, R), dot3(p, U)], depth: (p) => dot3(p, N), N, lift };
  }
  function orbit(f, ctx) {
    f.svg.style.cursor = 'grab'; f.svg.style.touchAction = 'none';
    f.svg.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('.lab-handle')) return;
      ev.preventDefault();
      const x0 = ev.clientX, y0 = ev.clientY, v0 = { ...ctx.state.view };
      const move = (m) => { ctx.state.view = { a: v0.a - (m.clientX - x0) * 0.01, e: clamp(v0.e + (m.clientY - y0) * 0.01, -1.4, 1.4) }; ctx.redraw(); };
      const end = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    });
  }
  function curve3(f, cam, pts, o, oBack) {
    let run = [], front = null;
    const flush = () => { if (run.length > 1) f.line(run, front ? o : (oBack || o)); };
    pts.forEach((p) => { const fr = cam.depth(p) >= -1e-9; if (front !== null && fr !== front) { const last = run[run.length - 1]; flush(); run = [last]; } front = fr; run.push(cam.P(p)); });
    flush();
  }
  function blochSphere(f, cam) {
    const back = { c: 'muted', w: 0.6, dash: '2 4', op: 0.3, layer: 'under' };
    for (let k = -2; k <= 2; k++) { const la = k * PI / 6, z = Math.sin(la), rr = Math.cos(la); curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [rr * Math.cos(q), rr * Math.sin(q), z]; }), { c: 'muted', w: k === 0 ? 1 : 0.7, op: 0.4, layer: 'under' }, back); }
    for (let k = 0; k < 6; k++) { const lo = k * PI / 6; curve3(f, cam, L.seq(97, (i) => { const q = L.TAU * i / 96; return [Math.cos(q) * Math.cos(lo), Math.cos(q) * Math.sin(lo), Math.sin(q)]; }), { c: 'muted', w: 0.7, op: 0.35, layer: 'under' }, back); }
    f.circle(0, 0, 1, { c: 'ink', w: 1.1, op: 0.45, layer: 'under' });
    [[[1, 0, 0], 'x'], [[0, 1, 0], 'y'], [[0, 0, 1], 'z']].forEach(([p, s]) => {
      const tip = scale3(p, 1.22), q = cam.P(tip);
      f.line([cam.P([0, 0, 0]), q], { c: 'muted', w: 1, op: cam.depth(tip) >= 0 ? 0.7 : 0.35, dash: '3 3', layer: 'under' });
      const lab = cam.P(scale3(p, 1.32)); f.text(lab[0], lab[1], s, { math: true, small: true, c: 'muted', dy: 4, layer: 'main' });
    });
    const z0 = cam.P([0, 0, 1.08]), z1 = cam.P([0, 0, -1.08]);
    f.text(z0[0], z0[1], '|0⟩', { small: true, c: 'ink', dx: -14, dy: -4, layer: 'main' });
    f.text(z1[0], z1[1], '|1⟩', { small: true, c: 'ink', dx: -14, dy: 12, layer: 'main' });
  }
  const arrow3 = (f, cam, v, o) => { const a = cam.P([0, 0, 0]), b = cam.P(v); if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-3) return f.dot(0, 0, Object.assign({ r: 5 }, o)); return f.line([a, b], Object.assign({ arrow: true, w: 2.6 }, o)); };
  const deg = (x) => `${fmt(x, 0)}°`;

  /* ---------- 1. the CHSH game ---------- */
  D['chsh'] = {
    render(ctx, v) {
      const a = v.a * DEG, ap = v.ap * DEG, b = v.b * DEG, bp = v.bp * DEG, lhv = v.model === 1;
      const E = lhv ? E_lhv : E_quantum, Eo = lhv ? E_quantum : E_lhv;
      const Eab = E(a, b), Eabp = E(a, bp), Eapb = E(ap, b), Eapbp = E(ap, bp), s = Eab - Eabp + Eapb + Eapbp;
      const best = maxOverBp(a, ap, b, E);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Alice’s and Bob’s detector dials. Drag the four settings; each angle is measured from the z axis in the x-z plane.', 'アリスとボブの検出器のダイヤルです。四つの設定をドラッグしてください。角度は x-z 平面内で z 軸から測ります。'));
      const f = L.fig(c1, { x: [-2.55, 2.55], y: [-1.42, 1.42], equal: true, axes: false, maxH: 330 });
      const dial = (cxp, name, who, settings) => {
        f.circle(cxp, 0, 1, { c: 'ink', w: 1.2, op: 0.5, layer: 'under' });
        for (let k = 0; k < 8; k++) { const q = k * PI / 4, r0 = k % 2 ? 0.93 : 0.88; f.seg([cxp + r0 * Math.cos(q), r0 * Math.sin(q)], [cxp + Math.cos(q), Math.sin(q)], { c: 'muted', w: 1, op: 0.7, layer: 'under' }); }
        f.seg([cxp, 0], [cxp + 0.86, 0], { c: 'muted', w: 1, dash: '3 3', op: 0.6, layer: 'under' });
        f.text(cxp + 1.02, 0, '0°', { small: true, c: 'muted', anchor: 'start', dx: 4, dy: 4 });
        f.text(cxp, -1.28, `${who} · ${name}`, { small: true, c: 'ink' });
        settings.forEach(([ang, key, lab, col, dash]) => {
          f.seg([cxp, 0], [cxp + 0.86 * Math.cos(ang), 0.86 * Math.sin(ang)], { c: col, w: dash ? 2 : 2.8, dash: dash ? '6 4' : undefined });
          const r = dash ? 0.28 : 0.42;
          if (Math.abs(ang) > 1e-6) f.line(L.seq(41, (i) => { const q = ang * i / 40; return [cxp + r * Math.cos(q), r * Math.sin(q)]; }), { c: col, w: 1.2, op: 0.7, dash: dash ? '3 2' : undefined });
          const lx = cxp + 1.14 * Math.cos(ang), ly = 1.14 * Math.sin(ang);
          f.text(lx, ly, lab, { math: true, c: col, dy: 5 });
          f.handle(cxp + 0.86 * Math.cos(ang), 0.86 * Math.sin(ang), { c: col, r: dash ? 6 : 8, label: `${lab}`, bounds: [cxp - 1.1, cxp + 1.1, -1.1, 1.1], onDrag: (x, y) => { let d = Math.atan2(y, x - cxp) / DEG; if (d < 0) d += 360; ctx.set(key, Math.round(d), true); ctx.redraw(); } });
        });
      };
      dial(-1.3, T('Alice', 'アリス'), 'A', [[a, 'a', 'a', 'c1', false], [ap, 'ap', 'a′', 'c1', true]]);
      dial(1.3, T('Bob', 'ボブ'), 'B', [[b, 'b', 'b', 'c2', false], [bp, 'bp', 'b′', 'c2', true]]);

      L.h('p', 'lab-cap', c2, T('S as Bob’s second setting b′ turns, with the other three fixed. Drag the gold point along the curve.', '他の三つを固定し、ボブの二つ目の設定 b′ を回したときの S です。金色の点を曲線に沿ってドラッグできます。'));
      const g = L.fig(c2, { x: [0, 360], y: [-3.4, 3.4], aspect: 0.72, maxH: 330, xlabel: T('b′ (degrees)', 'b′（度）'), ticksX: [[0, '0'], [90, '90'], [180, '180'], [270, '270'], [360, '360']], ticksY: [[-2.828, '−2√2'], [-2, '−2'], [0, '0'], [2, '2'], [2.828, '2√2']] });
      g.rect(0, -2, 360, 4, { c: 'muted', fo: 0.13, nostroke: true, layer: 'under' });
      g.hline(TSIRELSON, { c: 'c4', w: 1.4, dash: '6 4', op: 0.9, layer: 'under' });
      g.hline(-TSIRELSON, { c: 'c4', w: 1.4, dash: '6 4', op: 0.9, layer: 'under' });
      g.text(356, 1.7, T('classical: |S| ≤ 2', '古典：|S| ≤ 2'), { small: true, c: 'muted', anchor: 'end', dy: -2 });
      g.text(356, TSIRELSON, T('Tsirelson: 2√2', 'ツィレルソン限界：2√2'), { small: true, c: 'c4', anchor: 'end', dy: -5 });
      g.text(4, 3.1, 'S', { math: true, small: true, c: 'muted', anchor: 'start', dy: 4 });
      g.line(L.sample(0, 360, 361, (x) => S(a, ap, b, x * DEG, Eo)), { c: lhv ? 'c1' : 'c2', w: 1.4, dash: '4 3', op: 0.55 });
      g.line(L.sample(0, 360, 721, (x) => S(a, ap, b, x * DEG, E)), { c: lhv ? 'c2' : 'c1', w: 2.6 });
      g.vline(v.bp, { c: 'hl', w: 1, op: 0.5, dash: '3 3', layer: 'under' });
      g.handle(v.bp, s, { c: 'hl', label: T('b′ along the curve', '曲線に沿った b′'), axis: 'x', bounds: [0, 360, -3.1, 3.1], onDrag: (x) => { ctx.set('bp', Math.round(x), true); ctx.redraw(); } });
      g.hover((x) => ({ x, y: S(a, ap, b, x * DEG, E), text: `b′ = ${fmt(x, 0)}°, S = ${fmt(S(a, ap, b, x * DEG, E), 3)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('quantum, E = cos(a − b)', '量子：E = cos(a − b)') }, { c: 'c2', label: T('local hidden variable model', '局所隠れた変数モデル') }, { c: 'muted', kind: 'fill', label: T('classical band |S| ≤ 2', '古典的な帯 |S| ≤ 2') }, { c: 'c4', dash: true, label: T('Tsirelson bound 2√2', 'ツィレルソン限界 2√2') }]);
      const viol = Math.abs(s) > 2 + 1e-9;
      ctx.readout([{ k: 'E(a, b)', v: fmt(Eab, 3) }, { k: 'E(a, b′)', v: fmt(Eabp, 3) }, { k: 'E(a′, b)', v: fmt(Eapb, 3) }, { k: 'E(a′, b′)', v: fmt(Eapbp, 3) }, { k: 'S', v: fmt(s, 3), tone: viol ? 'good' : 'key' }, { k: T('classical bound', '古典限界'), v: viol ? T('violated', '破れています') : T('respected', '守られています'), tone: viol ? 'good' : 'warn' }, { k: T('max S over b′', 'b′ についての最大 S'), v: `${fmt(best.S, 3)} (b′ = ${fmt(best.bp / DEG, 0)}°)` }],
        lhv ? T('In the hidden-variable model every correlation is a straight ramp in the angle difference, and no choice of the four settings pushes S past 2. Switch back to quantum and the same dials reach 2√2.', '隠れた変数モデルではどの相関も角度差の一次式で、四つの設定をどう選んでも S は 2 を超えません。量子に戻すと、同じダイヤルで 2√2 に届きます。')
          : T('With the singlet-like correlations of Φ⁺, S is a sum of four cosines. Move b′ towards a′ + 45° while keeping a, a′ and b at 0°, 90° and 45°, and S climbs to its ceiling 2√2, above anything a local model can produce.', 'Φ⁺ の相関では S は四つの余弦の和です。a、a′、b を 0°、90°、45° に保ったまま b′ を a′ + 45° に近づけると、S は上限の 2√2 まで上がり、局所的なモデルでは決して出せない値になります。'));
    },
  };

  /* ---------- 2. teleportation, step by step ---------- */
  const STEP_NAMES = [T('0. Alice holds |ψ⟩; Alice and Bob share Φ⁺', '0. アリスが |ψ⟩ を持ち、アリスとボブが Φ⁺ を共有'), T('1. CNOT from ψ onto Alice’s half', '1. ψ を制御にしてアリスの片割れへ CNOT'), T('2. Hadamard on ψ', '2. ψ にアダマール'), T('3. Alice measures both qubits', '3. アリスが二つの量子ビットを測定'), T('4. Bob applies Xᵐ² Zᵐ¹', '4. ボブが Xᵐ² Zᵐ¹ で補正')];
  const PAULI_NAME = ['I', 'X', 'Z', 'XZ'];
  const STEP_DUR = 1.7;
  D['teleportation'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const th = v.theta * DEG, ph = v.phi * DEG, m1 = v.outcome >> 1, m2 = v.outcome & 1;
      const R = teleport(th, ph, m1, m2);
      const rPsi = blochOfPsi(th, ph);
      const cam = camera(ctx.state);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The Bloch sphere. Drag the gold tip to set |ψ⟩; drag elsewhere to turn the view. Bob’s qubit is drawn in orange.', 'ブロッホ球です。金色の先端をドラッグして |ψ⟩ を決め、それ以外の場所をドラッグすると視点が回ります。ボブの量子ビットは橙色です。'));
      const f = L.fig(c1, { x: [-1.5, 1.5], y: [-1.45, 1.45], equal: true, axes: false, maxH: 380 });
      orbit(f, ctx);
      blochSphere(f, cam);
      const tip = cam.P(rPsi);
      f.handle(tip[0], tip[1], { c: 'hl', r: 8, label: T('State |ψ⟩ to teleport', 'テレポートする状態 |ψ⟩'), bounds: [-1, 1, -1, 1], onDrag: (x, y) => { const p = cam.lift(x, y); let t = Math.acos(clamp(p[2], -1, 1)) / DEG, q = Math.atan2(p[1], p[0]) / DEG; if (q < 0) q += 360; ctx.set('theta', Math.round(t), true); ctx.set('phi', Math.round(q), true); ctx.redraw(); } });

      L.h('p', 'lab-cap', c2, T('The circuit, with the current step highlighted. Double lines carry Alice’s two classical bits.', '回路です。現在のステップを強調しています。二重線はアリスの古典ビット二つを運びます。'));
      const st = L.stage(c2, { w: 100, h: 46, maxH: 250 });
      const wy = [38, 26, 14];
      // the measured wires end at the meters; Bob's wire runs on
      ['ψ', 'A', 'B'].forEach((s, i) => { st.text(3, wy[i], s, { math: true, small: true, anchor: 'start', dy: 4, layer: 'main' }); st.seg([8, wy[i]], [i === 2 ? 98 : 62, wy[i]], { c: 'ink', w: 1.4, op: 0.8, layer: 'main' }); });
      // Φ+ source across A and B
      st.rect(11, 9, 9, 22, { c: 'c3', fo: 0.18, w: 1.2, rx: 3, layer: 'main' });
      st.text(15.5, 20, 'Φ⁺', { small: true, c: 'c3', dy: 4, layer: 'main' });
      // CNOT
      st.seg([34, 38], [34, 26], { c: 'ink', w: 1.4, layer: 'main' });
      st.dot(34, 38, { c: 'ink', r: 4, layer: 'main' });
      st.circle(34, 26, 2.6, { c: 'ink', w: 1.4, layer: 'main' });
      st.seg([34, 28.6], [34, 23.4], { c: 'ink', w: 1.4, layer: 'main' }); st.seg([31.4, 26], [36.6, 26], { c: 'ink', w: 1.4, layer: 'main' });
      // H
      st.rect(46, 34, 8, 8, { c: 'plate', fo: 1, w: 1.3, rx: 1, layer: 'main' }).style.stroke = 'var(--lab-ink)';
      st.text(50, 38, 'H', { math: true, small: true, dy: 4, layer: 'main' });
      // meters
      [38, 26].forEach((y) => { st.rect(62, y - 4, 8, 8, { c: 'plate', fo: 1, w: 1.3, rx: 1, layer: 'main' }).style.stroke = 'var(--lab-ink)'; st.line(L.seq(13, (i) => { const q = PI * i / 12; return [66 + 2.6 * Math.cos(q), y - 2 + 2.6 * Math.sin(q)]; }), { c: 'ink', w: 1, layer: 'main' }); st.seg([66, y - 2], [68.2, y + 1.6], { c: 'ink', w: 1.2, layer: 'main' }); });
      // classical double wires from the meters to Bob's corrections
      const dseg = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, ox = -dy / n * 0.45, oy = dx / n * 0.45; st.seg([a[0] + ox, a[1] + oy], [b[0] + ox, b[1] + oy], { c: 'muted', w: 0.9, layer: 'main' }); st.seg([a[0] - ox, a[1] - oy], [b[0] - ox, b[1] - oy], { c: 'muted', w: 0.9, layer: 'main' }); };
      dseg([70, 38], [92, 38]); dseg([92, 38], [92, 18]);
      dseg([70, 26], [80, 26]); dseg([80, 26], [80, 18]);
      st.text(74, 38, 'm₁', { small: true, anchor: 'start', dy: -3, layer: 'main' }); st.text(72, 26, 'm₂', { small: true, anchor: 'start', dy: -3, layer: 'main' });
      [[80, 'Xᵐ²'], [92, 'Zᵐ¹']].forEach(([x, s]) => { st.rect(x - 4.5, 10, 9, 8, { c: 'plate', fo: 1, w: 1.3, rx: 1, layer: 'main' }).style.stroke = 'var(--lab-c2)'; st.text(x, 14, s, { math: true, small: true, c: 'c2', dy: 4, layer: 'main' }); });
      const HI = [[1, 22], [28, 40], [44, 56], [60, 72], [74, 98]];

      L.h('p', 'lab-cap', c2, T('The eight amplitudes of the three-qubit state |ψ A B⟩, real and imaginary parts.', '三量子ビット状態 |ψ A B⟩ の八つの振幅、実部と虚部です。'));
      const g = L.fig(c2, { x: [0, 8], y: [-1.05, 1.05], aspect: 0.42, maxH: 200, minH: 150, ticksX: L.seq(8, (i) => [i + 0.5, `|${(i >> 2) & 1}${(i >> 1) & 1}${i & 1}⟩`]), ticksY: [[-1, '−1'], [-0.5, '−½'], [0, '0'], [0.5, '½'], [1, '1']] });
      g.hline(0, { c: 'muted', w: 1, op: 0.6, dash: undefined, layer: 'under' });

      const rhoBlind = traceToBob(R.stages[2]);
      const rBlind = blochOfRho(rhoBlind);
      const rPre = blochOfRho(R.rhoBob[3]), rPost = blochOfRho(R.rhoBob[4]);
      const F = fidelity(R.psi, R.rhoBob[4]);
      let last = -1;
      const drawStep = (k) => {
        f.clear('over'); st.clear('over'); g.clear('main');
        const s = R.stages[k];
        // Bloch: ψ, and Bob's vector at this step
        arrow3(f, cam, rPsi, { c: 'ink', w: 2.4, layer: 'over' });
        const rB = blochOfRho(R.rhoBob[k]);
        arrow3(f, cam, rB, { c: 'c2', w: 3, layer: 'over' });
        const lb = cam.P(scale3(rB, 1.12));
        if (len3(rB) < 1e-9) f.text(0, 0, T('Bob: I/2', 'ボブ：I/2'), { small: true, c: 'c2', dx: 10, dy: 14, anchor: 'start', layer: 'over' });
        else f.text(lb[0], lb[1], k === 4 ? T('Bob = |ψ⟩', 'ボブ = |ψ⟩') : `${T('Bob:', 'ボブ：')} ${PAULI_NAME[v.outcome]}|ψ⟩`, { small: true, c: 'c2', dx: 8, dy: 12, anchor: 'start', layer: 'over' });
        const lp = cam.P(scale3(rPsi, 1.12)); f.text(lp[0], lp[1], '|ψ⟩', { c: 'ink', small: true, dx: lp[0] < 0 ? -12 : 12, dy: -8, layer: 'over' });
        // circuit highlight
        const [x0, x1] = HI[k];
        st.rect(x0, 3, x1 - x0, 40, { c: 'hl', fo: 0.16, w: 1.2, rx: 2, layer: 'over' });
        st.text((x0 + x1) / 2, 44.5, `${T('step', 'ステップ')} ${k}`, { small: true, c: 'hl', dy: 0, layer: 'over' });
        // amplitudes
        s.forEach((amp, i) => {
          if (Math.abs(amp[0]) > 1e-12) g.rect(i + 0.14, 0, 0.34, amp[0], { c: 'c1', fo: 0.85, w: 0.8 });
          if (Math.abs(amp[1]) > 1e-12) g.rect(i + 0.52, 0, 0.34, amp[1], { c: 'c2', fo: 0.85, w: 0.8 });
          if (Math.abs(amp[0]) <= 1e-12 && Math.abs(amp[1]) <= 1e-12) g.dot(i + 0.5, 0, { c: 'muted', r: 2.5, layer: 'main' });
        });
        const items = [{ k: '|ψ⟩', v: `θ = ${deg(v.theta)}, φ = ${deg(v.phi)}` }, { k: T('Alice’s outcome', 'アリスの結果'), v: k < 3 ? T('not yet measured', '未測定') : `m₁m₂ = ${m1}${m2}` }, { k: T('P(outcome)', '結果の確率'), v: fmt(R.p, 3) }];
        if (k < 3) items.push({ k: T('Bob’s reduced state', 'ボブの縮約状態'), v: `I/2 (|r| = ${fmt(len3(rB), 3)})`, tone: 'key' });
        if (k === 3) items.push({ k: T('Bob holds', 'ボブの状態'), v: `${PAULI_NAME[v.outcome]}|ψ⟩`, tone: 'key' }, { k: T('fidelity with |ψ⟩ now', '現在の |ψ⟩ との忠実度'), v: fmt(fidelity(R.psi, R.rhoBob[3]), 3), tone: fidelity(R.psi, R.rhoBob[3]) < 0.999 ? 'warn' : undefined });
        if (k === 4) items.push({ k: T('correction', '補正'), v: `${m1 ? 'Z' : ''}${m2 ? 'X' : ''}${m1 || m2 ? '' : 'I'}` }, { k: T('fidelity ⟨ψ|ρ_B|ψ⟩', '忠実度 ⟨ψ|ρ_B|ψ⟩'), v: fmt(F, 6), tone: 'good' });
        items.push({ k: T('Bob before learning the outcome', '結果を知る前のボブ'), v: `|r| = ${fmt(len3(rBlind), 3)}` });
        ctx.readout(items, STEP_NAMES[k] + (k === 4 ? T(' The two classical bits, not the qubits, cross the channel; Bob’s state is I/2 until they arrive.', ' 通信路を渡るのは量子ビットではなく古典ビット二つで、届くまでボブの状態は I/2 のままです。') : ''));
      };
      const DUR = 5 * STEP_DUR;
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => {
        const k = Math.min(4, Math.floor(t / STEP_DUR));
        if (k !== last) { last = k; drawStep(k); ctx.set('step', k, true); lab.textContent = `${T('step', 'ステップ')} ${k} / 4`; }
        if (t >= DUR) return false;
      }, { autoplay: false, once: true, duration: DUR, initialT: v.step * STEP_DUR + STEP_DUR / 2, playLabel: T('Play the protocol', '手順を再生') });
      L.legend(ctx.host, [{ c: 'ink', label: T('|ψ⟩, the state to teleport', 'テレポートする状態 |ψ⟩') }, { c: 'c2', label: T('Bob’s qubit', 'ボブの量子ビット') }, { c: 'c1', kind: 'fill', label: T('Re amplitude', '振幅の実部') }, { c: 'c2', kind: 'fill', label: T('Im amplitude', '振幅の虚部') }]);
      void rPre; void rPost;
    },
  };

  /* ---------- 3. entanglement entropy ---------- */
  D['entanglement-entropy'] = {
    render(ctx, v) {
      if (v.preset === 1 && Math.abs(v.theta - 45) > 1e-9) { ctx.set('theta', 45, true); ctx.set('preset', 1); return; }
      if (v.preset === 2 && Math.abs(v.theta) > 1e-9) { ctx.set('theta', 0, true); ctx.set('preset', 2); return; }
      const th = v.theta * DEG, be = v.beta * DEG;
      const s = state2(th, be), rA = rhoA(s), lam = eig2(rA), Sb = entropy(lam), C = concurrence(s), r = blochReal(rA), rl = len3(r);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Drag θ on the dial: the Schmidt coefficients cos θ and sin θ are its projections, and their squares are the bars.', 'ダイヤルで θ をドラッグしてください。シュミット係数 cos θ と sin θ はその射影で、その二乗が棒です。'));
      const f = L.fig(c1, { x: [-0.2, 2.75], y: [-0.22, 1.2], equal: true, axes: false, maxH: 250 });
      f.line(L.seq(61, (i) => { const q = PI / 2 * i / 60; return [Math.cos(q), Math.sin(q)]; }), { c: 'muted', w: 1.2, op: 0.7, layer: 'under' });
      f.seg([0, 0], [1.08, 0], { c: 'muted', w: 1, layer: 'under' }); f.seg([0, 0], [0, 1.08], { c: 'muted', w: 1, layer: 'under' });
      f.seg([0, 0], [Math.cos(th), Math.sin(th)], { c: 'hl', w: 2.4 });
      f.seg([Math.cos(th), Math.sin(th)], [Math.cos(th), 0], { c: 'c1', w: 1.2, dash: '3 3' });
      f.seg([Math.cos(th), Math.sin(th)], [0, Math.sin(th)], { c: 'c2', w: 1.2, dash: '3 3' });
      f.seg([0, 0], [Math.cos(th), 0], { c: 'c1', w: 3 }); f.seg([0, 0], [0, Math.sin(th)], { c: 'c2', w: 3 });
      f.text(Math.cos(th) / 2, 0, 'cos θ', { math: true, small: true, c: 'c1', dy: 16 });
      f.text(0, Math.sin(th) / 2, 'sin θ', { math: true, small: true, c: 'c2', anchor: 'end', dx: -6, dy: 4 });
      if (th > 0.05) f.line(L.seq(31, (i) => { const q = th * i / 30; return [0.3 * Math.cos(q), 0.3 * Math.sin(q)]; }), { c: 'hl', w: 1.2 });
      f.text(0.4 * Math.cos(th / 2), 0.4 * Math.sin(th / 2), 'θ', { math: true, small: true, c: 'hl', dx: 6, dy: 4 });
      f.handle(Math.cos(th), Math.sin(th), { c: 'hl', label: T('Schmidt angle θ', 'シュミット角 θ'), bounds: [-0.2, 1.2, -0.2, 1.2], onDrag: (x, y) => { const d = clamp(Math.atan2(y, x) / DEG, 0, 90); ctx.set('preset', 0, true); ctx.set('theta', Math.round(d * 2) / 2, true); ctx.redraw(); } });
      // the bars λ1 = cos²θ, λ2 = sin²θ
      const bx = 1.55, bw = 0.42;
      f.seg([bx - 0.1, 0], [bx + 2 * bw + 0.3, 0], { c: 'muted', w: 1, layer: 'under' });
      f.seg([bx - 0.1, 1], [bx + 2 * bw + 0.3, 1], { c: 'muted', w: 0.8, dash: '3 3', op: 0.6, layer: 'under' });
      f.text(bx - 0.14, 1, '1', { small: true, c: 'muted', anchor: 'end', dy: 4 });
      f.rect(bx, 0, bw, lam[0], { c: 'c1', fo: 0.8, w: 0.8 }); f.rect(bx + bw + 0.12, 0, bw, lam[1], { c: 'c2', fo: 0.8, w: 0.8 });
      f.text(bx + bw / 2, 0, 'λ₁', { math: true, small: true, c: 'c1', dy: 16 }); f.text(bx + bw * 1.5 + 0.12, 0, 'λ₂', { math: true, small: true, c: 'c2', dy: 16 });
      f.text(bx + bw / 2, lam[0], fmt(lam[0], 2), { small: true, c: 'c1', dy: -5 }); f.text(bx + bw * 1.5 + 0.12, lam[1], fmt(lam[1], 2), { small: true, c: 'c2', dy: -5 });

      L.h('p', 'lab-cap', c1, T('The Bloch ball of ρ_A, cut through the x-z plane: pure states on the surface, mixed states inside. The vector shrinks as the state entangles; the local rotation β never moves it.', 'ρ_A のブロッホ球を x-z 平面で切ったものです。表面が純粋状態、内部が混合状態です。もつれが強まるとベクトルは縮み、局所回転 β では動きません。'));
      const k = L.fig(c1, { x: [-1.5, 1.5], y: [-1.22, 1.22], equal: true, axes: false, maxH: 240 });
      k.circle(0, 0, 1, { c: 'c3', fill: true, fo: 0.12, w: 1.2, op: 0.9, layer: 'under' });
      k.hline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' }); k.vline(0, { c: 'muted', w: 0.8, op: 0.5, layer: 'under' });
      k.text(1.2, 0, 'x', { math: true, small: true, c: 'muted', dy: 14 }); k.text(0, 1.1, 'z', { math: true, small: true, c: 'muted', dx: 12 });
      k.text(0, 1.03, '|0⟩', { small: true, c: 'muted', dx: -16, dy: -2 }); k.text(0, -1.03, '|1⟩', { small: true, c: 'muted', dx: -16, dy: 12 });
      if (rl > 1e-6) k.arrow([0, 0], [r[0], r[2]], { c: 'hl', w: 3 }); else k.dot(0, 0, { c: 'hl', r: 6 });
      k.text(r[0], r[2], `|r_A| = ${fmt(rl, 3)}`, { small: true, c: 'hl', anchor: 'start', dx: 10, dy: r[2] >= 0 ? -2 : 12 });

      L.h('p', 'lab-cap', c2, T('Entanglement entropy S(ρ_A) and concurrence C against θ; the gold point is the current state.', 'θ に対するもつれエントロピー S(ρ_A) とコンカレンス C です。金色の点が現在の状態です。'));
      const g = L.fig(c2, { x: [0, 90], y: [0, 1.08], aspect: 0.78, maxH: 380, xlabel: T('θ (degrees)', 'θ（度）'), ticksX: [[0, '0'], [15, '15'], [30, '30'], [45, '45'], [60, '60'], [75, '75'], [90, '90']], ticksY: [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']] });
      g.line(L.sample(0, 90, 361, (x) => Math.abs(Math.sin(2 * x * DEG))), { c: 'c4', w: 2, dash: '6 4' });
      g.line(L.sample(0, 90, 361, (x) => entropy([Math.cos(x * DEG) ** 2, Math.sin(x * DEG) ** 2])), { c: 'c1', w: 2.8 });
      g.vline(v.theta, { c: 'hl', w: 1, op: 0.5, dash: '3 3', layer: 'under' });
      g.dot(v.theta, C, { c: 'c4', r: 4.5 });
      g.handle(v.theta, Sb, { c: 'hl', r: 8, label: T('θ along the entropy curve', 'エントロピー曲線に沿った θ'), axis: 'x', bounds: [0, 90, 0, 1.08], onDrag: (x) => { ctx.set('preset', 0, true); ctx.set('theta', Math.round(x * 2) / 2, true); ctx.redraw(); } });
      g.text(45, 1.0, T('1 bit at θ = 45°', 'θ = 45° で 1 ビット'), { small: true, c: 'c1', dy: -6 });
      g.hover((x) => ({ x, y: entropy([Math.cos(x * DEG) ** 2, Math.sin(x * DEG) ** 2]), text: `θ = ${fmt(x, 1)}°, S = ${fmt(entropy([Math.cos(x * DEG) ** 2, Math.sin(x * DEG) ** 2]), 3)}, C = ${fmt(Math.abs(Math.sin(2 * x * DEG)), 3)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('entropy S(ρ_A) in bits', 'エントロピー S(ρ_A)（ビット）') }, { c: 'c4', dash: true, label: T('concurrence C = |sin 2θ|', 'コンカレンス C = |sin 2θ|') }, { c: 'hl', kind: 'dot', label: T('current state', '現在の状態') }]);
      const kind = C < 1e-6 ? T('product state', '積状態') : C > 1 - 1e-6 ? T('maximally entangled', '最大にもつれた状態') : T('partially entangled', '部分的にもつれた状態');
      ctx.readout([{ k: 'λ₁, λ₂', v: `${fmt(lam[0], 4)}, ${fmt(lam[1], 4)}` }, { k: 'S(ρ_A)', v: `${fmt(Sb, 4)} ${T('bits', 'ビット')}`, tone: 'key' }, { k: 'C', v: fmt(C, 4) }, { k: '|r_A|', v: fmt(rl, 4) }, { k: T('state', '状態'), v: kind, tone: C > 1 - 1e-6 ? 'good' : undefined }, { k: T('local rotation β', '局所回転 β'), v: deg(v.beta) }],
        T('Amplitudes change with β, but ρ_A, its eigenvalues, the entropy and the concurrence do not: entanglement cannot be created or destroyed by acting on one side alone. Only θ, which mixes |00⟩ with |11⟩, moves the gold point.', '振幅は β とともに変わりますが、ρ_A もその固有値もエントロピーもコンカレンスも変わりません。片側だけへの操作では、もつれを作ることも壊すこともできないのです。金色の点を動かすのは、|00⟩ と |11⟩ を混ぜる θ だけです。'));
    },
  };
})();
