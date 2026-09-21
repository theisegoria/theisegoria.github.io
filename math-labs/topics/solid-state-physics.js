'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * Math.PI, DEG = PI / 180;

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  // two-site chain: H_AB(k) = t1 + t2 e^{-ik}
  const sshE = (t1, t2, k) => Math.sqrt(Math.max(0, t1 * t1 + t2 * t2 + 2 * t1 * t2 * Math.cos(k)));
  const sshVg = (t1, t2, k, band) => { const e = sshE(t1, t2, k); return e < 1e-12 ? 0 : -band * t1 * t2 * Math.sin(k) / e; };
  // Kronig-Penney with hbar^2/2m = 1, a = 1, well width b = 1 - c, barrier V0 of width c
  function kpF(E, V0, c) {
    const b = 1 - c; E = Math.max(E, 1e-10);
    const al = Math.sqrt(E);
    if (E < V0 - 1e-10) { const be = Math.sqrt(V0 - E); return Math.cos(al * b) * Math.cosh(be * c) + (be * be - al * al) / (2 * al * be) * Math.sin(al * b) * Math.sinh(be * c); }
    const ga = Math.max(1e-7, Math.sqrt(Math.max(0, E - V0)));
    return Math.cos(al * b) * Math.cos(ga * c) - (al * al + ga * ga) / (2 * al * ga) * Math.sin(al * b) * Math.sin(ga * c);
  }
  function kpBands(V0, c, Emax, dE = 0.005) {
    const bands = []; let start = null, prev = null;
    for (let E = dE; E <= Emax + 1e-9; E += dE) {
      const ok = Math.abs(kpF(E, V0, c)) <= 1;
      if (ok && start === null) start = E;
      if (!ok && start !== null) { bands.push([start, prev]); start = null; }
      prev = E;
    }
    if (start !== null) bands.push([start, Emax]);
    return bands;
  }
  // reciprocal basis: a_i . b_j = 2 pi delta_ij
  function reciprocal(a1, a2) { const det = a1[0] * a2[1] - a1[1] * a2[0]; return [[TAU * a2[1] / det, -TAU * a2[0] / det], [-TAU * a1[1] / det, TAU * a1[0] / det]]; }
  // Gs must be sorted by |G|^2; only |G| < 2|k| can be closer to k than the origin is
  function zoneIndex(kx, ky, Gs) { let n = 1; const lim = 4 * (kx * kx + ky * ky); for (const [gx, gy, g2] of Gs) { if (g2 >= lim) break; if (2 * (kx * gx + ky * gy) > g2) n++; } return n; }
  (window.LabModels = window.LabModels || {})['solid-state-physics'] = { sshE, sshVg, kpF, kpBands, reciprocal, zoneIndex };

  /* ---------- 1. tight binding ---------- */
  D['tight-binding'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state; st.band ??= -1;
      const t1 = v.t1, t2 = v.t2, k = v.k * PI, band = st.band;
      const E = band * sshE(t1, t2, k);
      const hr = t1 + t2 * Math.cos(k), hi = -t2 * Math.sin(k), hm = Math.hypot(hr, hi);
      // psi_B / psi_A = band * conj(h)/|h|
      const ph = hm > 1e-12 ? Math.atan2(-hi, hr) : 0, sgn = band;
      const cells = 7;
      L.h('p', 'lab-cap', ctx.host, T('The chain: bond thickness is the hopping strength; bars are the real part of the Bloch wave on each site, turning in time.', '鎖：結合の太さは飛び移りの強さ、棒は各サイト上のブロッホ波の実部で、時間とともに回ります。'));
      const s = L.fig(ctx.host, { x: [-0.6, cells * 2 - 0.4], y: [-1.25, 1.25], aspect: 0.2, minH: 150, maxH: 190, axes: false });
      for (let n = 0; n < cells; n++) {
        const xa = 2 * n, xb = 2 * n + 1;
        s.seg([xa, 0], [xb, 0], { c: 'muted', w: 1 + 5 * t1, op: 0.6, layer: 'under' });
        if (n < cells - 1) s.seg([xb, 0], [xa + 2, 0], { c: 'muted', w: 1 + 5 * t2, op: 0.6, layer: 'under' });
      }
      const drawWave = (time) => {
        s.clear('main'); s.clear('over');
        const env = [];
        for (let n = 0; n < cells; n++) {
          const xa = 2 * n, xb = 2 * n + 1, th = k * n - E * time;
          const A = Math.cos(th) / Math.SQRT2, B = sgn * Math.cos(th + ph) / Math.SQRT2;
          s.seg([xa, 0], [xa, A * 1.4], { c: 'c1', w: 5 }); s.seg([xb, 0], [xb, B * 1.4], { c: 'c3', w: 5 });
          s.dot(xa, 0, { c: 'c1', r: 6 }); s.dot(xb, 0, { c: 'c3', r: 6 });
          env.push([xa, A * 1.4], [xb, B * 1.4]);
        }
        s.line(env, { c: 'hl', w: 1.4, op: 0.8 });
      };
      drawWave(0);
      st.anim = L.animator(ctx.host, (dt, t) => { drawWave(t); }, { autoplay: true });
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Bands E(k) across the Brillouin zone, with the density of states on the right. Drag the gold point.', 'ブリルアンゾーン全体のバンド E(k) と、右側に状態密度。金色の点をドラッグしてください。'));
      const Em = t1 + t2 + 0.3;
      const f = L.fig(c1, { x: [-1, 1.55], y: [-Em, Em], aspect: 0.5, maxH: 360, xlabel: 'ka/π', ylabel: 'E', ticksX: [[-1, '−1'], [-0.5, '−½'], [0, '0'], [0.5, '½'], [1, '1']] });
      const gap = Math.abs(t1 - t2);
      if (gap > 0.01) f.rect(-1, -gap, 2, 2 * gap, { c: 'c2', fo: 0.12, nostroke: true, layer: 'under' });
      f.line(L.sample(-1, 1, 300, (x) => sshE(t1, t2, x * PI)), { c: 'c2', w: 2.6 });
      f.line(L.sample(-1, 1, 300, (x) => -sshE(t1, t2, x * PI)), { c: 'c1', w: 2.6 });
      f.vline(1.02, { c: 'grid', dash: '', w: 1 });
      // density of states by sampling k uniformly
      const nb = 90, bins = new Array(nb).fill(0), NK = 6000;
      for (let i = 0; i < NK; i++) { const kk = -PI + TAU * (i + 0.5) / NK, e = sshE(t1, t2, kk); for (const ee of [e, -e]) { const b = Math.floor((ee + Em) / (2 * Em) * nb); if (b >= 0 && b < nb) bins[b]++; } }
      const mx = Math.max(...bins.slice(1, -1), 1);
      bins.forEach((c, b) => { if (c) f.rect(1.06, -Em + b * 2 * Em / nb, 0.45 * Math.min(1, c / mx), 2 * Em / nb, { c: 'c4', fo: 0.55, nostroke: true }); });
      f.text(1.28, Em * 0.88, T('DOS', '状態密度'), { small: true, c: 'c4' });
      if (gap > 0.05) f.text(0, 0, T(`gap 2|t₁ − t₂| = ${fmt(2 * gap, 2)}`, `ギャップ 2|t₁ − t₂| = ${fmt(2 * gap, 2)}`), { small: true, c: 'c2', dy: 4 });
      f.dot(v.k, E, { c: 'hl', r: 4 });
      f.handle(v.k, E, { c: 'hl', r: 8, label: T('Bloch state', 'ブロッホ状態'), bounds: [-1, 1, -Em, Em], onDrag: (x, y) => { st.band = y >= 0 ? 1 : -1; ctx.set('k', x, true); ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'c1', label: T('lower band, site A bars', '下のバンド、サイト A の棒') }, { c: 'c3', label: T('site B bars', 'サイト B の棒') }, { c: 'c2', label: T('upper band', '上のバンド') }, { kind: 'fill', c: 'c4', label: T('density of states', '状態密度') }]);
      ctx.readout([{ k: 'E', v: fmt(E, 3), tone: 'key' }, { k: T('band gap', 'バンドギャップ'), v: fmt(2 * gap, 3) }, { k: T('each band width', '各バンドの幅'), v: fmt(t1 + t2 - gap, 3) }, { k: T('group velocity dE/dk', '群速度 dE/dk'), v: fmt(sshVg(t1, t2, k, band), 3) }],
        Math.abs(Math.abs(v.k) - 1) < 0.02 && gap > 0.01 ? T('At the zone edge the group velocity vanishes and the bars stand still in shape, only swelling and shrinking: a standing wave.', 'ゾーン端では群速度が 0 になり、棒の形は動かずに伸び縮みするだけです。定在波です。') : gap < 0.01 ? T('Equal bonds: the gap closes and the two bands join into one cosine band folded at the zone edge.', '結合が等しいとギャップが閉じ、二本のバンドはゾーン端で折り返した一本の余弦バンドにつながります。') : T('Near k = 0 the pattern slides along the chain; the two states at the same k differ by the relative sign of the A and B amplitudes.', 'k = 0 付近では模様が鎖に沿って滑ります。同じ k の二つの状態は、A と B の振幅の相対的な符号が違います。'));
    },
  };

  /* ---------- 2. Kronig-Penney ---------- */
  D['kronig-penney'] = {
    render(ctx, v) {
      const V0 = v.v0, c = v.width, b = 1 - c, Emax = 45, Ep = v.energy;
      const bands = kpBands(V0, c, Emax);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Three cells of the potential with the allowed bands shaded', 'ポテンシャルの 3 周期分と、許されたバンド（影）'));
      const f = L.fig(c1, { x: [0, 3], y: [0, Emax], aspect: 1.05, maxH: 420, xlabel: 'x / a', ylabel: 'E' });
      bands.forEach(([lo, hi]) => f.rect(0, lo, 3, hi - lo, { c: 'c1', fo: 0.28, nostroke: true, layer: 'under' }));
      for (let n = 0; n < 3; n++) f.rect(n + b, 0, c, Math.min(V0, Emax), { c: 'muted', fo: 0.35, nostroke: true });
      const pot = []; for (let n = 0; n < 3; n++) pot.push([n, 0], [n + b, 0], [n + b, V0], [n + 1, V0], [n + 1, 0]);
      f.line(pot, { c: 'ink', w: 2 });
      const fp = kpF(Ep, V0, c), allowed = Math.abs(fp) <= 1;
      f.hline(Ep, { c: 'hl', w: 2.2, dash: allowed ? '' : '5 4' });
      f.handle(2.85, Ep, { c: 'hl', r: 8, axis: 'y', label: T('Probe energy', '調べるエネルギー'), bounds: [2.85, 2.85, 0.2, Emax], onDrag: (x, y) => { ctx.set('energy', y, true); ctx.redraw(); } });
      L.h('p', 'lab-cap', c2, T('The same bands as E(k) in the reduced zone; dashed: free electron folded back', '縮約ゾーンの E(k) で見た同じバンド。点線は折り返した自由電子'));
      const g = L.fig(c2, { x: [-1, 1], y: [0, Emax], aspect: 1.05, maxH: 420, xlabel: 'ka/π', ticksX: [[-1, '−1'], [0, '0'], [1, '1']] });
      for (let m = -3; m <= 3; m++) g.line(L.sample(-1, 1, 200, (x) => (x * PI + TAU * m) ** 2), { c: 'muted', w: 1.1, dash: '4 4' });
      bands.forEach(([lo, hi]) => g.rect(-1, lo, 2, hi - lo, { c: 'c1', fo: 0.12, nostroke: true, layer: 'under' }));
      bands.forEach(([lo, hi]) => {
        const pts = []; for (let E = lo; E <= hi + 1e-9; E += Math.max(0.004, (hi - lo) / 400)) { const ff = L.clamp(kpF(E, V0, c), -1, 1); pts.push([Math.acos(ff) / PI, E]); }
        const ff = L.clamp(kpF(hi, V0, c), -1, 1); pts.push([Math.acos(ff) / PI, hi]);
        g.line(pts, { c: 'c1', w: 2.6 }); g.line(pts.map(([x, y]) => [-x, y]), { c: 'c1', w: 2.6 });
      });
      g.hline(Ep, { c: 'hl', w: 1.6, dash: allowed ? '' : '5 4' });
      if (allowed) { const kk = Math.acos(fp) / PI; g.dot(kk, Ep, { c: 'hl', r: 6 }); g.dot(-kk, Ep, { c: 'hl', r: 6 }); }
      L.h('p', 'lab-cap', ctx.host, T('The right-hand side f(E): energies are allowed exactly where the curve stays inside the band |f| ≤ 1', '右辺 f(E)：曲線が帯 |f| ≤ 1 の内側にあるエネルギーだけが許されます'));
      const h = L.fig(ctx.host, { x: [0, Emax], y: [-3.2, 3.2], aspect: 0.28, minH: 190, maxH: 240, xlabel: 'E', ylabel: 'f(E)' });
      h.rect(0, -1, Emax, 2, { c: 'c3', fo: 0.12, nostroke: true, layer: 'under' });
      bands.forEach(([lo, hi]) => h.rect(lo, -3.2, hi - lo, 6.4, { c: 'c1', fo: 0.14, nostroke: true, layer: 'under' }));
      h.line(L.sample(0.02, Emax, 1200, (E) => L.clamp(kpF(E, V0, c), -3.5, 3.5)), { c: 'c1', w: 2.2 });
      if (V0 > 0 && V0 < Emax) h.vline(V0, { c: 'muted', dash: '3 3' });
      h.vline(Ep, { c: 'hl', w: 1.8, dash: '' }); h.dot(Ep, L.clamp(fp, -3.1, 3.1), { c: 'hl', r: 5 });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('allowed bands', '許されたバンド') }, { c: 'muted', dash: true, label: T('free electron, E = k², folded', '自由電子 E = k²（折り返し）') }, { c: 'hl', label: T('probe energy', '調べるエネルギー') }]);
      const edges = bands.slice(0, 3).map(([lo, hi]) => `${fmt(lo, 2)}–${fmt(hi, 2)}`).join(', ');
      const gap1 = bands.length > 1 ? bands[1][0] - bands[0][1] : NaN;
      ctx.readout([{ k: T('probe E', '調べる E'), v: fmt(Ep, 2) }, { k: 'f(E)', v: fmt(fp, 3) }, { k: T('state', '状態'), v: allowed ? T(`allowed, ka/π = ${fmt(Math.acos(fp) / PI, 3)}`, `許される、ka/π = ${fmt(Math.acos(fp) / PI, 3)}`) : T('forbidden (in a gap)', '禁止（ギャップ内）'), tone: allowed ? 'good' : 'warn' }, { k: T('first bands', '最初のバンド'), v: edges }, { k: T('first gap', '最初のギャップ'), v: fmt(gap1, 3), tone: 'key' }],
        V0 === 0 ? T('No barriers: f(E) = cos √E never leaves [−1, 1], every energy is allowed and the bands are the folded parabola.', '障壁がなければ f(E) = cos √E は [−1, 1] から出ず、すべてのエネルギーが許され、バンドは折り返した放物線そのものです。') : T('Each gap opens where the folded free-electron parabolas would cross: Bragg reflection splits the crossing.', '各ギャップは折り返した自由電子の放物線が交わるはずの場所で開きます。ブラッグ反射が交点を分裂させます。'));
    },
  };

  /* ---------- 3. Brillouin zones ---------- */
  D.brillouin = {
    render(ctx, v) {
      const a1 = [1, 0], a2 = [v.len * Math.cos(v.ang * DEG), v.len * Math.sin(v.ang * DEG)];
      const [b1, b2] = reciprocal(a1, a2);
      const cellA = Math.abs(a1[0] * a2[1] - a1[1] * a2[0]), bz = TAU * TAU / cellA;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Real space: drag the tip of a₂. The filled cell is the Wigner–Seitz cell.', '実空間：a₂ の先端をドラッグしてください。塗った領域がウィグナー・ザイツ胞です。'));
      const f = L.fig(c1, { x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, maxH: 380, grid: false });
      const lat = []; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const p = [i * a1[0] + j * a2[0], i * a1[1] + j * a2[1]]; if (Math.abs(p[0]) < 2.55 && Math.abs(p[1]) < 2.15) lat.push(p); }
      // Wigner-Seitz cell by clipping a big square with bisector half-planes
      const clip = (poly, n, d) => { const out = []; for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length], fp = P[0] * n[0] + P[1] * n[1] - d, fq = Q[0] * n[0] + Q[1] * n[1] - d; if (fp <= 0) out.push(P); if (fp * fq < 0) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } } return out; };
      const cellOf = (pts) => { let poly = [[-9, -9], [9, -9], [9, 9], [-9, 9]]; pts.forEach((p) => { const r2 = p[0] * p[0] + p[1] * p[1]; if (r2 > 1e-9) poly = clip(poly, p, r2 / 2); }); return poly; };
      f.poly(cellOf(lat), { c: 'c1', fo: 0.22, w: 1.6 });
      lat.forEach((p) => f.dot(p[0], p[1], { c: 'ink', r: 3.2 }));
      f.arrow([0, 0], a1, { c: 'c2', w: 2.6 }); f.arrow([0, 0], a2, { c: 'c3', w: 2.6 });
      f.text(a1[0], a1[1], 'a₁', { c: 'c2', dx: 6, dy: 16 });
      f.handle(a2[0], a2[1], { c: 'c3', r: 8, label: T('Tip of a₂', 'a₂ の先端'), onDrag: (x, y) => { const r = L.clamp(Math.hypot(x, y), 0.6, 1.6), ang = L.clamp(Math.atan2(y, x) / DEG, 40, 140); ctx.set('len', r, true); ctx.set('ang', ang, true); ctx.redraw(); } });
      f.text(a2[0], a2[1], 'a₂', { c: 'c3', dx: 14, dy: -8 });
      // reciprocal space window sized to hold the requested zones
      const bmax = Math.max(Math.hypot(...b1), Math.hypot(...b2));
      const R = 1.25 * Math.sqrt(v.zones * bz / PI) + 0.3 * bmax;
      L.h('p', 'lab-cap', c2, T('Reciprocal space: zones 1 to n, coloured in turn', '逆格子空間：第 1 から第 n ゾーンを順に色分け'));
      const g = L.fig(c2, { x: [-R, R], y: [-0.8 * R, 0.8 * R], equal: true, maxH: 380, grid: false, axes: false });
      const Gs = []; const lim = Math.ceil(2.2 * R / Math.min(Math.hypot(...b1), Math.hypot(...b2))) + 2;
      for (let i = -lim; i <= lim; i++) for (let j = -lim; j <= lim; j++) { if (!i && !j) continue; const gx = i * b1[0] + j * b2[0], gy = i * b1[1] + j * b2[1], g2 = gx * gx + gy * gy; if (g2 < 4 * 2 * R * R) Gs.push([gx, gy, g2]); }
      Gs.sort((p, q) => p[2] - q[2]);
      const col = L.colours(), toks = ['c1', 'c3', 'c2', 'c4'];
      const counts = new Array(v.zones + 2).fill(0); let edge = false; const cw = Math.round(g.pw / 2), ch = Math.round(g.ph / 2);
      g.raster((x, y) => {
        const z = zoneIndex(x, y, Gs);
        if (z > v.zones) return col.plate;
        const base = col[toks[(z - 1) % 4]], s = 0.62 - 0.06 * Math.floor((z - 1) / 4);
        return [0, 1, 2].map((i) => col.plate[i] + (base[i] - col.plate[i]) * s);
      }, { res: 2 });
      // area estimate on a separate uniform grid
      const NX = 260, NY = Math.round(NX * 0.8), dA = (2 * R / NX) * (1.6 * R / NY);
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const x = -R + (i + 0.5) * 2 * R / NX, y = -0.8 * R + (j + 0.5) * 1.6 * R / NY; const z = zoneIndex(x, y, Gs); if (z <= v.zones) { counts[z] += dA; if (i === 0 || j === 0 || i === NX - 1 || j === NY - 1) edge = true; } }
      Gs.filter((q) => Math.abs(q[0]) < R && Math.abs(q[1]) < 0.8 * R).forEach((q) => g.dot(q[0], q[1], { c: 'ink', r: 2.6 }));
      g.dot(0, 0, { c: 'ink', r: 4 });
      g.arrow([0, 0], b1, { c: 'c2', w: 2.2 }); g.arrow([0, 0], b2, { c: 'c3', w: 2.2 });
      g.text(b1[0], b1[1], 'b₁', { c: 'c2', dx: 8, dy: 14 }); g.text(b2[0], b2[1], 'b₂', { c: 'c3', dx: 12, dy: -6 });
      void cw; void ch;
      L.legend(ctx.host, [{ c: 'c2', label: 'a₁, b₁' }, { c: 'c3', label: 'a₂, b₂' }, { kind: 'fill', c: 'c1', label: T('zone 1, then the colours cycle', '第 1 ゾーン、以降は色が巡回') }]);
      const ratios = counts.slice(1, v.zones + 1).map((a) => fmt(a / bz, 2)).join(', ');
      ctx.readout([{ k: '|b₁|, |b₂|', v: `${fmt(Math.hypot(...b1), 3)}, ${fmt(Math.hypot(...b2), 3)}` }, { k: T('zone area (2π)²/|a₁ × a₂|', 'ゾーン面積 (2π)²/|a₁ × a₂|'), v: fmt(bz, 3), tone: 'key' }, { k: T('measured areas ÷ that', '測定面積 ÷ それ'), v: ratios, tone: edge ? 'warn' : 'good' }],
        edge ? T('The highest zone reaches the edge of the window, so its measured area is cut short.', '最も高次のゾーンが描画範囲の端に届いているので、その測定面積は小さく出ます。') : Math.abs(v.ang - 60) < 0.6 && Math.abs(v.len - 1) < 0.006 ? T('Hexagonal lattice: the first zone is a regular hexagon, and the higher zones are stars of triangles.', '六方格子：第一ゾーンは正六角形で、高次のゾーンは三角形からなる星形です。') : T('However the zones splinter, every one has the same area as the first.', 'ゾーンがどれほど細かく割れても、どれも第一ゾーンと同じ面積です。'));
    },
  };
})();
