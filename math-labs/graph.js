'use strict';
/* Knowledge graph of the math encyclopedia topics.
   Edges: the related links the encyclopedia has always drawn (two neighbours
   inside each group, plus the curated cross-links), joined with the
   prerequisites that a topic's own "Before you begin" line names. The latter
   are directed: A -> B means B lists A as a prerequisite. */
(() => {
  const root = document.querySelector('[data-knowledge-graph]');
  if (!root) return;
  const ja = document.documentElement.lang === 'ja';
  const L = ja ? 1 : 0;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = s => root.querySelector(s);
  const svg = $('.kg-svg');
  const figure = $('.kg-figure');
  const gEdges = $('.kg-edges');
  const gNodes = $('.kg-nodes');
  const detail = $('.kg-detail');
  const search = $('#kg-search');
  const status = $('.kg-status');
  const listRoot = $('.kg-list');
  const legend = $('.kg-legend');

  const GROUPS = ['foundations', 'analysis', 'geometry', 'applications', 'physics'];
  const T = ja ? {
    groups: { foundations: '基礎', analysis: '解析', geometry: '幾何', applications: '応用', physics: '物理' },
    buildsOn: '前提とするトピック', leadsTo: 'このトピックを前提とする', related: '関連するトピック',
    open: 'トピックを開く', none: 'なし',
    topics: n => `${n}件のトピック`, matches: n => n ? `${n}件が一致` : '一致するトピックはない',
    idleTitle: (n) => `${n}のトピックのつながり`,
    idle: 'トピックにカーソルを合わせるかフォーカスすると、前提とするトピックと、そのトピックを前提とするトピックが浮かび上がる。クリックでトピックを開く。色の付いた領域が五つの分野である。',
    keys: '矢印キーで近くのトピックへ移動、Enterで開く、Escで解除。',
    before: '前提知識', links: n => `${n}本のつながり`,
    failed: 'グラフを読み込めなかった。',
    path: '学ぶ順序', pathNote: '前提をすべてたどった順序。', labs: n => `${n}件の実験`, reset: '配置を元に戻す',
    dragHint: 'ノードはドラッグで動かせる。'
  } : {
    groups: { foundations: 'Foundations', analysis: 'Analysis', geometry: 'Geometry', applications: 'Applications', physics: 'Physics' },
    buildsOn: 'Builds on', leadsTo: 'Leads to', related: 'Related', open: 'Open topic', none: 'None',
    topics: n => `${n} topics`, matches: n => n ? `${n} ${n === 1 ? 'match' : 'matches'}` : 'No matching topic',
    idleTitle: (n) => `How the ${n} topics connect`,
    idle: 'Hover over or focus a topic to trace what it builds on and what builds on it. Click a topic to open it. The tinted regions are the five subjects.',
    keys: 'Arrow keys move to the nearest topic in that direction, Enter opens it, Escape clears.',
    before: 'Before you begin', links: n => `${n} connection${n === 1 ? '' : 's'}`,
    failed: 'Could not load the graph.',
    path: 'Learning path', pathNote: 'Every prerequisite, in an order you could study them.', labs: n => `${n} experiment${n === 1 ? '' : 's'}`, reset: 'Reset layout',
    dragHint: 'Drag a topic to move it.'
  };
  const SHORT = {
    'partial-differential-equations': ['PDEs', '偏微分方程式'],
    'statistics-inference': ['Statistics', '統計と推測'],
    'probability-inference': ['Probability', '確率']
  };
  // Curated cross-links the encyclopedia has always drawn.
  const CROSS = {
    'number-theory': ['information-theory', 'graph-theory'],
    'partial-differential-equations': ['classical-mechanics', 'thermodynamics'],
    'linear-algebra': ['quantum-mechanics', 'calculus-of-variations'],
    'fourier-analysis': ['optics', 'information-theory'],
    'dynamical-systems': ['classical-mechanics'],
    'differential-geometry': ['calculus-of-variations', 'algebraic-topology'],
    'statistical-mechanics': ['thermodynamics', 'probability-inference', 'quantum-mechanics'],
    'measure-theory': ['probability-inference', 'numerical-analysis', 'partial-differential-equations'],
    'markov-chains': ['probability-inference', 'dynamical-systems', 'information-theory'],
    'differential-forms': ['differential-geometry', 'algebraic-topology', 'electromagnetism'],
    'general-relativity': ['special-relativity', 'differential-geometry', 'classical-mechanics'],
    'functional-analysis': ['measure-theory', 'linear-algebra', 'numerical-analysis'],
    'plasma-physics': ['electromagnetism', 'fluid-dynamics', 'statistical-mechanics'],
    'lie-groups': ['quantum-mechanics', 'differential-geometry', 'group-theory'],
    'hamiltonian-mechanics': ['dynamical-systems', 'numerical-analysis', 'statistical-mechanics'],
    'stochastic-processes': ['partial-differential-equations', 'statistical-mechanics', 'measure-theory'],
    'solid-state-physics': ['fourier-analysis', 'linear-algebra', 'statistical-mechanics'],
    'control-theory': ['dynamical-systems', 'complex-analysis', 'fourier-analysis'],
    'logic-computability': ['number-theory', 'graph-theory', 'information-theory'],
    'hyperbolic-geometry': ['group-theory', 'general-relativity', 'complex-analysis'],
    'rigid-body-dynamics': ['lie-groups', 'hamiltonian-mechanics'],
    'elliptic-curves': ['complex-analysis', 'hyperbolic-geometry'],
    'atomic-physics': ['optics', 'lie-groups'],
    'quaternions': ['lie-groups', 'rigid-body-dynamics', 'complex-analysis'],
    'pushforward-pullback': ['probability-inference', 'stochastic-processes', 'statistical-mechanics'],
    'knot-theory': ['graph-theory', 'lie-groups', 'hyperbolic-geometry'],
    'quantum-information': ['linear-algebra', 'probability-inference', 'quaternions'],
    'cosmology': ['statistical-mechanics', 'differential-geometry', 'special-relativity'],
    'fractal-geometry': ['complex-analysis', 'stochastic-processes', 'hyperbolic-geometry'],
    'cellular-automata': ['logic-computability', 'fractal-geometry', 'statistical-mechanics'],
    'complex-systems': ['statistical-mechanics', 'graph-theory', 'cellular-automata'],
    'galois-theory': ['elliptic-curves', 'lie-groups', 'number-theory'],
    'magnetism-ising': ['complex-systems', 'markov-chains', 'solid-state-physics']
  };
  // Topics named in each topic's own prerequisite line (content.json "prerequisite").
  const PREREQ = {
    'optimization': ['linear-algebra'],                                  // Derivatives, vectors, and matrices
    'algebraic-topology': ['graph-theory', 'linear-algebra'],            // Sets, graphs, and elementary linear algebra
    'information-theory': ['probability-inference'],                     // Probability and logarithms
    'calculus-of-variations': ['classical-mechanics'],                   // Calculus and mechanics
    'statistics-inference': ['probability-inference'],                   // Probability and algebra
    'statistical-mechanics': ['probability-inference'],                  // Probability and energy
    'markov-chains': ['probability-inference', 'linear-algebra'],        // Probability and linear algebra
    'differential-forms': ['differential-geometry'],                     // Multivariable calculus and differential geometry
    'general-relativity': ['special-relativity', 'differential-geometry'],// Special relativity and differential geometry
    'functional-analysis': ['linear-algebra'],                           // Linear algebra and real analysis
    'plasma-physics': ['electromagnetism'],                              // Electromagnetism and differential equations
    'lie-groups': ['linear-algebra', 'group-theory'],                    // Linear algebra and group theory
    'hamiltonian-mechanics': ['classical-mechanics', 'calculus-of-variations'], // Classical mechanics and calculus of variations
    'stochastic-processes': ['probability-inference', 'measure-theory', 'markov-chains'], // Probability, measure theory, and Markov chains
    'solid-state-physics': ['quantum-mechanics', 'fourier-analysis'],    // Quantum mechanics and Fourier analysis
    'control-theory': ['dynamical-systems', 'complex-analysis'],         // Dynamical systems and complex analysis
    'hyperbolic-geometry': ['differential-geometry'],                    // Complex numbers and differential geometry
    'rigid-body-dynamics': ['classical-mechanics', 'linear-algebra'],    // Classical mechanics and linear algebra
    'elliptic-curves': ['group-theory', 'number-theory'],               // Group theory, modular arithmetic and complex numbers
    'atomic-physics': ['quantum-mechanics'],                             // Quantum mechanics
    'quaternions': ['linear-algebra'],                                   // Vectors, dot and cross products, rotation matrices and complex numbers
    'pushforward-pullback': ['differential-forms', 'measure-theory'],   // Multivariable calculus, Jacobians, measures and differential forms
    'knot-theory': ['algebraic-topology', 'group-theory'],              // Algebraic topology and group theory
    'quantum-information': ['quantum-mechanics', 'information-theory'], // Quantum mechanics and information theory
    'cosmology': ['general-relativity', 'thermodynamics'],             // General relativity and thermodynamics
    'fractal-geometry': ['measure-theory', 'dynamical-systems'],        // Measure theory and dynamical systems
    'cellular-automata': ['logic-computability', 'probability-inference'], // Logic and computability, and elementary probability
    'complex-systems': ['probability-inference', 'dynamical-systems', 'statistical-mechanics'], // Probability, dynamical systems, and statistical mechanics
    'galois-theory': ['group-theory', 'complex-analysis'],               // Group theory, polynomials and complex numbers
    'magnetism-ising': ['statistical-mechanics', 'probability-inference'] // Statistical mechanics and probability
  };
  // Where each group settles, as fractions of the stage.
  const ANCHOR = {
    foundations: [0.11, 0.50], analysis: [0.40, 0.14], geometry: [0.36, 0.84],
    applications: [0.72, 0.12], physics: [0.82, 0.66]
  };

  let topics = [], bySlug = new Map(), edges = [], focusSlug = null, pinned = null, groupHi = null, query = '';
  let nodeEls = new Map(), edgeEls = [], W = 0, H = 0, lastPointer = 'mouse', built = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const href = d => `${ja ? '/ja' : ''}/${d.slug}/`;
  const shortName = d => (SHORT[d.slug] || [])[L] || d.title[L].split(/[:：]/)[0].trim();
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  function buildData(items) {
    topics = items.map((d, i) => ({ ...d, i, out: new Set(), inn: new Set(), rel: new Set() }));
    bySlug = new Map(topics.map(d => [d.slug, d]));
    const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
    const map = new Map();
    const addRel = (a, b, auto) => { if (a === b || !bySlug.has(a) || !bySlug.has(b)) return; const k = key(a, b); if (!map.has(k)) map.set(k, { a, b, dir: false, auto }); else if (!auto) map.get(k).auto = false; };
    // filler edges: each topic to its two list neighbours in the same group. They hold the groups together in the layout and are drawn only faintly.
    topics.forEach(d => topics.filter(x => x.group === d.group && x.slug !== d.slug).slice(0, 2).forEach(x => addRel(d.slug, x.slug, true)));
    Object.entries(CROSS).forEach(([a, bs]) => bs.forEach(b => addRel(a, b, false)));
    Object.entries(PREREQ).forEach(([b, as]) => as.forEach(a => { if (!bySlug.has(a) || !bySlug.has(b)) return; map.set(key(a, b), { a, b, dir: true, auto: false }); }));
    edges = [...map.values()];
    edges.forEach(e => {
      const A = bySlug.get(e.a), B = bySlug.get(e.b);
      if (e.dir) { A.out.add(e.b); B.inn.add(e.a); } else { A.rel.add(e.b); B.rel.add(e.a); }
    });
    topics.forEach(d => { d.degree = d.out.size + d.inn.size + d.rel.size; d.short = shortName(d); });
  }
  // every prerequisite of a topic, transitively, in an order that respects the arrows (Kahn on the ancestor set)
  function learningPath(d) {
    const anc = new Set(); const stack = [...d.inn];
    while (stack.length) { const s = stack.pop(); if (anc.has(s)) continue; anc.add(s); bySlug.get(s).inn.forEach(x => stack.push(x)); }
    const left = new Set(anc), out = [];
    while (left.size) {
      const ready = [...left].filter(s => ![...bySlug.get(s).inn].some(x => left.has(x))).sort((a, b) => bySlug.get(a).short.localeCompare(bySlug.get(b).short, ja ? 'ja' : 'en'));
      if (!ready.length) { out.push(...left); break; }
      ready.forEach(s => { out.push(s); left.delete(s); });
    }
    return { set: anc, order: out };
  }

  // ---------- layout ----------
  function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function layout() {
    const pad = 24;
    const nodes = topics.map(d => {
      const [ax, ay] = ANCHOR[d.group];
      return { d, x: ax * W + (hash(d.i) - .5) * 80, y: ay * H + (hash(d.i + 50) - .5) * 80, vx: 0, vy: 0, ax: ax * W, ay: ay * H };
    });
    const idx = new Map(nodes.map((n, i) => [n.d.slug, i]));
    const springs = edges.map(e => [idx.get(e.a), idx.get(e.b), e]);
    const scale = Math.sqrt(W * H / 30);
    const len = scale * 0.95;
    for (let it = 0; it < 420; it++) {
      const alpha = 1 - it / 420;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy + 1;
        const f = scale * scale * (a.d.group === b.d.group ? 0.5 : 1.35) / d2 * alpha;
        const d = Math.sqrt(d2); dx /= d; dy /= d;
        a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      }
      springs.forEach(([i, j, e]) => {
        const a = nodes[i], b = nodes[j];
        const same = a.d.group === b.d.group;
        let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
        const k = (same ? (e.auto ? 0.06 : 0.05) : 0.006) * alpha;
        const f = (d - len * (same ? 0.8 : 1.2)) * k; dx /= d; dy /= d;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      });
      nodes.forEach(n => {
        n.vx += (n.ax - n.x) * 0.045 * alpha; n.vy += (n.ay - n.y) * 0.045 * alpha;
        n.x += n.vx; n.y += n.vy; n.vx *= 0.55; n.vy *= 0.55;
      });
    }
    // Fit to the stage, keeping room for labels, then remove label collisions.
    const boxes = nodes.map(n => ({ n, w: n.d.labelW + 10, r: n.d.r }));
    const fit = () => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      boxes.forEach(b => { x0 = Math.min(x0, b.n.x - b.w / 2); x1 = Math.max(x1, b.n.x + b.w / 2); y0 = Math.min(y0, b.n.y - b.r); y1 = Math.max(y1, b.n.y + b.r + 22); });
      const sx = (W - 2 * pad) / (x1 - x0), sy = (H - 2 * pad) / (y1 - y0);
      boxes.forEach(b => { b.n.x = pad + (b.n.x - x0) * sx; b.n.y = pad + (b.n.y - y0) * sy; });
    };
    fit();
    const rect = b => ({ l: b.n.x - b.w / 2, r: b.n.x + b.w / 2, t: b.n.y - b.r - 5, b: b.n.y + b.r + 21 });
    for (let pass = 0; pass < 260; pass++) {
      let moved = false;
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const A = rect(boxes[i]), B = rect(boxes[j]);
        const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l) + 8, oy = Math.min(A.b, B.b) - Math.max(A.t, B.t) + 6;
        if (ox > 0 && oy > 0) {
          moved = true;
          const a = boxes[i].n, b = boxes[j].n;
          if (ox * 0.7 < oy) { const s = (a.x < b.x ? -1 : 1) * ox / 2; a.x += s; b.x -= s; }
          else { const s = (a.y < b.y ? -1 : 1) * oy / 2; a.y += s; b.y -= s; }
        }
      }
      boxes.forEach(b => {
        b.n.x = Math.max(pad + b.w / 2, Math.min(W - pad - b.w / 2, b.n.x));
        b.n.y = Math.max(pad + b.r, Math.min(H - pad - b.r - 20, b.n.y));
      });
      if (!moved) break;
    }
    nodes.forEach(n => { n.d.x = n.x; n.d.y = n.y; });
  }

  // ---------- drawing ----------
  function measure() {
    const probe = el('text', { class: 'kg-label' }, gNodes);
    topics.forEach(d => {
      probe.textContent = d.short;
      d.labelW = probe.getComputedTextLength();
      d.r = 4.5 + Math.sqrt(d.degree) * 1.35;
    });
    probe.remove();
  }
  function edgePath(e) {
    const A = bySlug.get(e.a), B = bySlug.get(e.b);
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    // gentle bend so parallel runs separate
    const bend = Math.min(40, d * 0.12) * (e.a < e.b ? 1 : -1);
    const mx = (A.x + B.x) / 2 - dy / d * bend, my = (A.y + B.y) / 2 + dx / d * bend;
    const ex = B.x - (B.x - mx) / Math.hypot(B.x - mx, B.y - my) * (B.r + 3);
    const ey = B.y - (B.y - my) / Math.hypot(B.x - mx, B.y - my) * (B.r + 3);
    return { d: `M${A.x.toFixed(1)},${A.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`, ex, ey, ang: Math.atan2(ey - my, ex - mx) };
  }
  // a soft region behind each group: the convex hull of its nodes, padded by a thick rounded stroke
  const gHulls = (() => { const g = el('g', { class: 'kg-hulls', 'aria-hidden': 'true' }); svg.insertBefore(g, gEdges); return g; })();
  let hullEls = new Map();
  function hullOf(pts) {
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (P.length < 3) return P;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = []; for (const p of P) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    const upper = []; for (const p of P.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  }
  function drawHulls() {
    gHulls.replaceChildren(); hullEls.clear(); placedLabels.length = 0;
    GROUPS.forEach(g => {
      const pts = topics.filter(d => d.group === g).map(d => [d.x, d.y]);
      if (!pts.length) return;
      const hull = hullOf(pts), d = hull.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + 'Z';
      const wrap = el('g', { class: `kg-hull g-${g}` }, gHulls);
      el('path', { d, class: 'kg-hull-fill' }, wrap);
      const [lx, ly] = hullLabelPos(hull);
      const label = el('text', { class: 'kg-hull-label', x: lx, y: ly }, wrap);
      label.textContent = T.groups[g];
      hullEls.set(g, wrap);
    });
  }
  // the label goes on the hull vertex that, pushed 44px outward from the centroid, is farthest from every node label
  const placedLabels = [];
  function hullLabelPos(hull) {
    const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length, cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
    const obstacles = topics.map(t => ({ x: t.x, y: t.y + 8, w: t.labelW })).concat(placedLabels.map(q => ({ x: q[0], y: q[1] - 6, w: 110 })));
    let best = null, bestS = -Infinity;
    hull.forEach(p => {
      const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1;
      const x = Math.max(40, Math.min(W - 40, p[0] + dx / d * 44)), y = Math.max(16, Math.min(H - 8, p[1] + dy / d * 44));
      let clear = Infinity;
      obstacles.forEach(t => { const ddx = Math.abs(t.x - x) - t.w / 2, ddy = Math.abs(t.y - y) - 14; clear = Math.min(clear, Math.max(ddx, ddy, 0)); });
      if (clear > bestS) { bestS = clear; best = [x, y]; }
    });
    best = best || [cx, cy]; placedLabels.push(best);
    return best;
  }
  function updateHull(g) { const w = hullEls.get(g); if (!w) return; const pts = topics.filter(d => d.group === g).map(d => [d.x, d.y]); const hull = hullOf(pts); w.querySelector('path').setAttribute('d', hull.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + 'Z'); placedLabels.length = 0; const [lx, ly] = hullLabelPos(hull); const t = w.querySelector('text'); t.setAttribute('x', lx); t.setAttribute('y', ly); }
  function updateEdge(rec) { const p = edgePath(rec.e); rec.g.querySelector('path').setAttribute('d', p.d); const arr = rec.g.querySelector('.kg-arrow'); if (arr) { const s = 6.5, a = p.ang; const pts = [[p.ex, p.ey], [p.ex - s * Math.cos(a - .42), p.ey - s * Math.sin(a - .42)], [p.ex - s * Math.cos(a + .42), p.ey - s * Math.sin(a + .42)]]; arr.setAttribute('d', `M${pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' L')} Z`); } }
  let moved = false, resetBtn = null;
  function makeDraggable(a, d) {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false, pid = null;
    a.addEventListener('pointerdown', ev => {
      if (ev.button !== 0) return;
      const r = svg.getBoundingClientRect(); sx = ev.clientX; sy = ev.clientY; ox = d.x; oy = d.y; dragging = false; pid = ev.pointerId;
      const scale = W / r.width;
      const move = e => {
        const dx = (e.clientX - sx) * scale, dy = (e.clientY - sy) * scale;
        if (!dragging && Math.hypot(dx, dy) < 4) return;
        if (!dragging) { dragging = true; a.classList.add('is-dragging'); a.setPointerCapture?.(pid); }
        d.x = Math.max(16, Math.min(W - 16, ox + dx)); d.y = Math.max(16, Math.min(H - 24, oy + dy));
        a.setAttribute('transform', `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})`);
        edgeEls.forEach(rec => { if (rec.e.a === d.slug || rec.e.b === d.slug) updateEdge(rec); });
        updateHull(d.group);
      };
      const up = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); a.classList.remove('is-dragging'); if (dragging) { moved = true; resetBtn && (resetBtn.hidden = false); setTimeout(() => { moved = false; }, 0); } };
      document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
    });
    a.addEventListener('click', ev => { if (moved) { ev.preventDefault(); ev.stopImmediatePropagation(); } }, true);
  }
  function draw() {
    const box = figure.getBoundingClientRect();
    W = Math.max(640, Math.round(box.width));
    H = Math.round(Math.max(520, Math.min(820, W * 0.68)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    gEdges.replaceChildren(); gNodes.replaceChildren(); nodeEls.clear(); edgeEls = [];
    measure();
    layout();
    drawHulls();
    edges.forEach(e => {
      const p = edgePath(e);
      const g = el('g', { class: 'kg-edge' + (e.dir ? ' is-dir' : '') + (e.auto ? ' is-auto' : '') }, gEdges);
      el('path', { d: p.d }, g);
      if (e.dir) {
        const s = 6.5, a = p.ang;
        const pts = [[p.ex, p.ey], [p.ex - s * Math.cos(a - .42), p.ey - s * Math.sin(a - .42)], [p.ex - s * Math.cos(a + .42), p.ey - s * Math.sin(a + .42)]];
        el('path', { class: 'kg-arrow', d: `M${pts.map(q => q.map(v => v.toFixed(1)).join(',')).join(' L')} Z` }, g);
      }
      edgeEls.push({ e, g });
    });
    const order = [...topics].sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.y - b.y || a.x - b.x);
    order.forEach(d => {
      const a = el('a', { href: href(d), class: `kg-node g-${d.group}`, tabindex: '-1', 'data-slug': d.slug, transform: `translate(${d.x.toFixed(1)} ${d.y.toFixed(1)})` }, gNodes);
      a.setAttribute('aria-label', `${d.title[L]}. ${T.groups[d.group]}. ${T.links(d.degree)}.`);
      el('circle', { class: 'kg-hit', r: Math.max(18, d.r + 10) }, a);
      el('circle', { class: 'kg-ring', r: d.r + 5 }, a);
      el('circle', { class: 'kg-dot', r: d.r }, a);
      const t = el('text', { class: 'kg-label', y: d.r + 16 }, a);
      t.textContent = d.short;
      nodeEls.set(d.slug, a);
      makeDraggable(a, d);
      a.addEventListener('pointerenter', () => { if (lastPointer === 'mouse') setFocus(d.slug); });
      a.addEventListener('pointerleave', () => { if (lastPointer === 'mouse') setFocus(pinned); });
      a.addEventListener('focus', () => { setRoving(d.slug); setFocus(d.slug); });
      a.addEventListener('click', ev => {
        if (lastPointer !== 'mouse' && focusSlug !== d.slug) { ev.preventDefault(); pinned = d.slug; setFocus(d.slug); }
      });
    });
    setRoving(focusSlug || pinned || order[0].slug);
    built = true;
    render();
  }
  function setRoving(slug) {
    nodeEls.forEach((a, s) => a.setAttribute('tabindex', s === slug ? '0' : '-1'));
  }

  // ---------- state ----------
  function matchesQuery(d) {
    if (!query) return false;
    const hay = `${d.title[0].split(':')[0]} ${d.title[1].split('：')[0]} ${d.short} ${d.slug.replace(/-/g, ' ')} ${T.groups[d.group]} ${d.group}`.toLowerCase();
    return hay.includes(query);
  }
  function setFocus(slug) {
    focusSlug = slug && bySlug.has(slug) ? slug : null;
    render();
  }
  function render() {
    const f = focusSlug && bySlug.get(focusSlug);
    const path = f ? learningPath(f) : null;
    const matches = new Set(topics.filter(matchesQuery).map(d => d.slug));
    status.textContent = query ? T.matches(matches.size) : T.topics(topics.length);
    listRoot.querySelectorAll('[data-slug]').forEach(li => { li.hidden = !!query && !matches.has(li.dataset.slug); });
    listRoot.querySelectorAll('.kg-list-group').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('[data-slug]')].some(li => !li.hidden); });
    if (!built) return;
    svg.classList.toggle('is-focusing', !!f);
    svg.classList.toggle('is-searching', !f && !!query);
    svg.classList.toggle('is-grouping', !f && !query && !!groupHi);
    nodeEls.forEach((a, s) => {
      const d = bySlug.get(s);
      a.classList.toggle('is-focus', !!f && s === f.slug);
      a.classList.toggle('is-pre', !!f && f.inn.has(s));
      a.classList.toggle('is-dep', !!f && f.out.has(s));
      a.classList.toggle('is-rel', !!f && f.rel.has(s));
      a.classList.toggle('is-anc', !!f && path.set.has(s) && !f.inn.has(s));
      a.classList.toggle('is-match', matches.has(s));
      a.classList.toggle('is-group', groupHi === d.group);
    });
    edgeEls.forEach(({ e, g }) => {
      const on = !!f && (e.a === f.slug || e.b === f.slug);
      g.classList.toggle('is-on', on);
      g.classList.toggle('is-pre', on && e.dir && e.b === f.slug);
      g.classList.toggle('is-dep', on && e.dir && e.a === f.slug);
      g.classList.toggle('is-group', !f && groupHi && bySlug.get(e.a).group === groupHi && bySlug.get(e.b).group === groupHi);
      g.classList.toggle('is-path', !!f && !on && e.dir && path.set.has(e.a) && path.set.has(e.b));
    });
    hullEls.forEach((w, g) => w.classList.toggle('is-group', groupHi === g));
    // bring the focused node's edges to the front
    if (f) edgeEls.forEach(({ g }) => { if (g.classList.contains('is-on')) gEdges.append(g); });
    renderDetail(f, path);
  }
  function chips(set, cls) {
    const wrap = h('p', 'kg-chips');
    const arr = [...set].map(s => bySlug.get(s)).sort((a, b) => a.short.localeCompare(b.short, ja ? 'ja' : 'en'));
    if (!arr.length) { wrap.append(h('span', 'kg-none', T.none)); return wrap; }
    arr.forEach(d => {
      const a = h('a', `kg-chip ${cls} g-${d.group}`, d.short);
      a.href = href(d);
      a.addEventListener('mouseenter', () => nodeEls.get(d.slug)?.classList.add('is-hint'));
      a.addEventListener('mouseleave', () => nodeEls.get(d.slug)?.classList.remove('is-hint'));
      wrap.append(a);
    });
    return wrap;
  }
  function renderDetail(f, path) {
    detail.replaceChildren();
    if (!f) {
      detail.append(h('p', 'kg-kicker', T.topics(topics.length) + ' · ' + T.links(edges.filter(e => !e.auto).length)));
      detail.append(h('h2', 'kg-d-title', T.idleTitle(topics.length)));
      detail.append(h('p', 'kg-d-copy', T.idle));
      detail.append(h('p', 'kg-d-keys', T.keys + ' ' + T.dragHint));
      const key = h('div', 'kg-key');
      [['pre', T.buildsOn], ['dep', T.leadsTo], ['rel', T.related]].forEach(([c, t]) => {
        const row = h('p', 'kg-key-row'); row.append(h('span', `kg-swatch s-${c}`), document.createTextNode(t)); key.append(row);
      });
      detail.append(key);
      return;
    }
    const kicker = h('p', `kg-kicker g-${f.group}`); kicker.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[f.group]));
    detail.append(kicker);
    const [head, ...rest] = f.title[L].split(/([:：])/);
    const title = h('h2', 'kg-d-title', head.trim());
    if (rest.length > 1) title.append(h('span', 'kg-d-sub', rest.slice(1).join('').trim()));
    detail.append(title);
    detail.append(h('p', 'kg-d-copy', f.description[L]));
    const pre = h('p', 'kg-d-pre'); pre.append(h('span', null, T.before + ': '), document.createTextNode(f.prerequisite[L])); detail.append(pre);
    [['pre', T.buildsOn, f.inn], ['dep', T.leadsTo, f.out], ['rel', T.related, f.rel]].forEach(([c, t, set]) => {
      if (!set.size && c !== 'rel') return;
      const hd = h('h3', 'kg-d-h'); hd.append(h('span', `kg-swatch s-${c}`), document.createTextNode(t)); detail.append(hd, chips(set, 'c-' + c));
    });
    if (path && path.order.length > f.inn.size) {
      const hd = h('h3', 'kg-d-h'); hd.append(h('span', 'kg-swatch s-path'), document.createTextNode(T.path)); detail.append(hd);
      const ol = h('ol', 'kg-path');
      path.order.forEach(s => { const d = bySlug.get(s); const li = h('li'); const a = h('a', `kg-chip c-path g-${d.group}`, d.short); a.href = href(d); a.addEventListener('mouseenter', () => nodeEls.get(s)?.classList.add('is-hint')); a.addEventListener('mouseleave', () => nodeEls.get(s)?.classList.remove('is-hint')); li.append(a); ol.append(li); });
      detail.append(ol, h('p', 'kg-d-note', T.pathNote));
    }
    if (f.labs && f.labs.length) {
      const hd = h('h3', 'kg-d-h'); hd.append(document.createTextNode(T.labs(f.labs.length))); detail.append(hd);
      const ul = h('ul', 'kg-labs');
      f.labs.forEach(lab => { const li = h('li'); const a = h('a', 'kg-lab', lab.title[L].replace(/^\d+\.\s*/, '')); a.href = href(f) + '#' + lab.id; li.append(a); ul.append(li); });
      detail.append(ul);
    }
    const open = h('a', 'kg-open', T.open); open.href = href(f); open.append(h('span', null, ' →'));
    detail.append(open);
  }

  // ---------- phone list ----------
  function buildList() {
    listRoot.replaceChildren();
    GROUPS.forEach(g => {
      const sec = h('section', `kg-list-group g-${g}`);
      const hd = h('h2', 'kg-list-h'); hd.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[g]));
      sec.append(hd);
      const ul = h('ul');
      topics.filter(d => d.group === g).sort((a, b) => a.short.localeCompare(b.short, ja ? 'ja' : 'en')).forEach(d => {
        const li = h('li'); li.dataset.slug = d.slug;
        const a = h('a', 'kg-li-link'); a.href = href(d);
        a.append(h('strong', null, d.short), h('span', 'kg-li-desc', d.description[L]));
        li.append(a);
        const meta = h('p', 'kg-li-meta');
        const part = (label, set, cls) => {
          if (!set.size) return;
          const s = h('span', 'kg-li-rel ' + cls); s.append(h('em', null, label + ' '));
          [...set].forEach((x, k) => { if (k) s.append(document.createTextNode(ja ? '、' : ', ')); const aa = h('a', null, bySlug.get(x).short); aa.href = href(bySlug.get(x)); s.append(aa); });
          meta.append(s);
        };
        part(T.buildsOn, d.inn, 'c-pre'); part(T.leadsTo, d.out, 'c-dep'); part(T.related, d.rel, 'c-rel');
        li.append(meta); ul.append(li);
      });
      sec.append(ul); listRoot.append(sec);
    });
  }

  // ---------- legend ----------
  function buildLegend() {
    legend.replaceChildren();
    GROUPS.forEach(g => {
      const b = h('button', `kg-leg g-${g}`); b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[g]), h('span', 'kg-leg-n', String(topics.filter(d => d.group === g).length)));
      b.addEventListener('click', () => {
        groupHi = groupHi === g ? null : g;
        legend.querySelectorAll('.kg-leg').forEach(x => x.setAttribute('aria-pressed', String(x === b && groupHi === g)));
        render();
      });
      b.addEventListener('mouseenter', () => { if (!groupHi) { groupHi = g; render(); groupHi = null; } });
      b.addEventListener('mouseleave', () => render());
      legend.append(b);
    });
    resetBtn = h('button', 'kg-leg kg-reset', T.reset); resetBtn.type = 'button'; resetBtn.hidden = true;
    resetBtn.addEventListener('click', () => { resetBtn.hidden = true; draw(); });
    legend.append(resetBtn);
  }

  // ---------- keyboard ----------
  function nearest(from, dir) {
    const [ux, uy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[dir];
    let best = null, bestS = Infinity;
    topics.forEach(d => {
      if (d === from) return;
      const dx = d.x - from.x, dy = d.y - from.y, along = dx * ux + dy * uy;
      if (along <= 4) return;
      const across = Math.abs(dx * uy - dy * ux);
      const s = along + across * 2.2;
      if (s < bestS) { bestS = s; best = d; }
    });
    return best;
  }
  gNodes.addEventListener('keydown', ev => {
    const cur = bySlug.get(ev.target.closest('.kg-node')?.dataset.slug);
    if (!cur) return;
    if (ev.key.startsWith('Arrow')) {
      ev.preventDefault();
      const n = nearest(cur, ev.key);
      if (n) nodeEls.get(n.slug).focus();
    } else if (ev.key === 'Escape') {
      pinned = null; setFocus(null); ev.target.blur();
    } else if (ev.key === ' ') {
      ev.preventDefault(); location.href = href(cur);
    }
  });
  gNodes.addEventListener('focusout', ev => { if (!gNodes.contains(ev.relatedTarget)) setFocus(pinned); });
  addEventListener('pointerdown', ev => { lastPointer = ev.pointerType || 'mouse'; }, true);
  svg.addEventListener('click', ev => { if (!ev.target.closest('.kg-node')) { pinned = null; setFocus(null); } });

  // ---------- search ----------
  search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); if (query) { pinned = null; focusSlug = null; } render(); });
  search.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      const first = topics.filter(matchesQuery).sort((a, b) => a.x - b.x)[0];
      if (first) { ev.preventDefault(); if (getComputedStyle(figure).display === 'none') listRoot.querySelector(`[data-slug="${first.slug}"] a`)?.focus(); else nodeEls.get(first.slug)?.focus(); }
    } else if (ev.key === 'Escape') { search.value = ''; query = ''; render(); }
  });

  let resizeTimer = 0, lastW = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = Math.round(figure.getBoundingClientRect().width);
      if (!w || Math.abs(w - lastW) < 8) return;
      lastW = w; draw();
    }, reduce.matches ? 0 : 120);
  });

  fetch('/math-labs/content.json').then(r => r.json()).then(async items => {
    buildData(items);
    buildLegend();
    buildList();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const initial = new URLSearchParams(location.search).get('topic');
    if (initial && bySlug.has(initial)) { pinned = initial; focusSlug = initial; }
    lastW = Math.round(figure.getBoundingClientRect().width);
    if (lastW) draw(); else render();
    ro.observe(figure);
    root.classList.add('is-ready');
  }).catch(() => { status.textContent = T.failed; });
})();
