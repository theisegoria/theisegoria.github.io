'use strict';
/* Knowledge graph of the math encyclopedia topics, in three levels.
   Overview: the six subjects as regions, joined by bands whose width is the
   number of connections between them. Subject: one subject's topics with
   full labels, and the topics they connect to elsewhere arranged on a ring
   by subject. Topic: one topic's neighbourhood, read left to right, from
   what it builds on to what builds on it, with related topics below.
   Edges: the related links the encyclopedia has always drawn (two neighbours
   inside each group, plus the curated cross-links), joined with the
   prerequisites that a topic's own "Before you begin" line names. The latter
   are directed: A -> B means B lists A as a prerequisite. The within-group
   neighbour links are listed as related but not drawn. */
(() => {
  const root = document.querySelector('[data-knowledge-graph]');
  if (!root) return;
  const ja = document.documentElement.lang === 'ja';
  const L = ja ? 1 : 0;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = s => root.querySelector(s);
  const svg = $('.kg-svg');
  const figure = $('.kg-figure');
  const detail = $('.kg-detail');
  const search = $('#kg-search');
  const status = $('.kg-status');
  const listRoot = $('.kg-list');
  const legend = $('.kg-legend');

  const GROUPS = ['foundations', 'analysis', 'geometry', 'applications', 'physics', 'engineering'];
  // order round the overview ring, chosen so that the most strongly linked subjects sit next to each other
  const RING = ['foundations', 'applications', 'analysis', 'engineering', 'physics', 'geometry'];
  const T = ja ? {
    groups: { foundations: '基礎', analysis: '解析', geometry: '幾何', applications: '応用', physics: '物理', engineering: '工学' },
    buildsOn: '前提とするトピック', leadsTo: 'このトピックを前提とする', related: '関連するトピック', earlier: 'さらに前の前提',
    open: 'トピックを開く', none: 'なし', all: 'すべての分野',
    topics: n => `${n}件のトピック`, matches: n => n ? `${n}件が一致` : '一致するトピックはない',
    overTitle: '六つの分野とそのつながり',
    overCopy: '円はそれぞれの分野で、中の点がトピックである。帯の太さは分野どうしのつながりの数を表す。分野をクリックするとその地図が開き、トピックをクリックすると、そのトピックが何を前提とし、何に続くかが見える。',
    strongest: '最も強いつながり', subjects: '分野',
    subjCopy: (n, i, o) => `${n}件のトピック。分野の中に${i}本、ほかの分野へ${o}本のつながりがある。外側の輪は、この分野とつながるほかの分野のトピックである。`,
    toOther: 'ほかの分野とのつながり', inSubject: 'この分野のトピック',
    keys: '矢印キーで近くの項目へ移動、Enterで開く、Escで一つ上の階層へ戻る。',
    keysZoom: '背景をドラッグして移動し、ピンチまたはCtrl+ホイールで拡大できる。',
    before: '前提知識', links: n => `${n}本のつながり`, linksBetween: n => `${n}本`,
    failed: 'グラフを読み込めなかった。',
    path: '学ぶ順序', pathNote: '前提をすべてたどった順序。', labs: n => `${n}件の実験`,
    zoomIn: '拡大', zoomOut: '縮小', zoomReset: '表示を元に戻す', crumbs: '階層', inTopics: n => `${n}件`,
    graphLabel: '数学百科事典の知識グラフ'
  } : {
    groups: { foundations: 'Foundations', analysis: 'Analysis', geometry: 'Geometry', applications: 'Applications', physics: 'Physics', engineering: 'Engineering' },
    buildsOn: 'Builds on', leadsTo: 'Leads to', related: 'Related', earlier: 'Earlier prerequisites',
    open: 'Open topic', none: 'None', all: 'All subjects',
    topics: n => `${n} topics`, matches: n => n ? `${n} ${n === 1 ? 'match' : 'matches'}` : 'No matching topic',
    overTitle: 'Six subjects and how they connect',
    overCopy: 'Each circle is a subject and each dot a topic. The width of a band is the number of connections between two subjects. Click a subject to open its map; click a topic to see what it builds on and what builds on it.',
    strongest: 'Strongest links', subjects: 'Subjects',
    subjCopy: (n, i, o) => `${n} topics, with ${i} connections inside the subject and ${o} to other subjects. The outer ring holds the topics elsewhere that this subject connects to.`,
    toOther: 'Links to other subjects', inSubject: 'Topics in this subject',
    keys: 'Arrow keys move to the nearest item, Enter opens it, Escape goes back up a level.',
    keysZoom: 'Drag the background to pan; pinch or Ctrl + scroll to zoom.',
    before: 'Before you begin', links: n => `${n} connection${n === 1 ? '' : 's'}`, linksBetween: n => String(n),
    failed: 'Could not load the graph.',
    path: 'Learning path', pathNote: 'Every prerequisite, in an order you could study them.', labs: n => `${n} experiment${n === 1 ? '' : 's'}`,
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomReset: 'Reset view', crumbs: 'Level', inTopics: n => `${n} topics`,
    graphLabel: 'Math encyclopedia knowledge graph'
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
    'magnetism-ising': ['complex-systems', 'markov-chains', 'solid-state-physics'],
    'watch-oscillators': ['dynamical-systems', 'hamiltonian-mechanics', 'gears-mechanisms'],
    'gears-mechanisms': ['differential-geometry', 'rigid-body-dynamics', 'watch-oscillators'],
    'quartz-resonators': ['solid-state-physics', 'crossovers-filters', 'watch-oscillators'],
    'loudspeakers': ['control-theory', 'fluid-dynamics', 'crossovers-filters'],
    'crossovers-filters': ['control-theory', 'complex-analysis', 'room-acoustics'],
    'room-acoustics': ['partial-differential-equations', 'statistical-mechanics', 'optics'],
    'wavelets': ['information-theory', 'numerical-analysis', 'quantum-mechanics'],
    'laser-physics': ['statistical-mechanics', 'dynamical-systems', 'atomic-physics']
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
    'magnetism-ising': ['statistical-mechanics', 'probability-inference'], // Statistical mechanics and probability
    'watch-oscillators': ['classical-mechanics', 'dynamical-systems'],   // Classical mechanics, damped oscillators and Bessel functions
    'gears-mechanisms': ['classical-mechanics', 'rigid-body-dynamics'], // Plane geometry, angular velocity and rigid bodies
    'quartz-resonators': ['classical-mechanics', 'electromagnetism'],    // Waves, elasticity and AC circuits
    'loudspeakers': ['electromagnetism', 'classical-mechanics', 'fourier-analysis'], // Damped oscillators, AC circuits and Bessel functions
    'crossovers-filters': ['electromagnetism', 'complex-analysis', 'fourier-analysis'], // AC circuits, complex numbers and Fourier analysis
    'room-acoustics': ['partial-differential-equations', 'fourier-analysis'], // The wave equation, standing waves and Fourier analysis
    'wavelets': ['fourier-analysis', 'functional-analysis'],              // Fourier analysis and inner product spaces
    'laser-physics': ['optics', 'quantum-mechanics']                     // Optics and quantum mechanics
  };

  let topics = [], bySlug = new Map(), edges = [], drawn = [];
  let view = { level: 'overview' }, hoverSlug = null, groupHi = null, query = '';
  let W = 0, H = 0, lastPointer = 'mouse', built = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const pageHref = d => `${ja ? '/ja' : ''}/${d.slug}/`;
  const shortName = d => (SHORT[d.slug] || [])[L] || d.title[L].split(/[:：]/)[0].trim();
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.append(n);
    return n;
  };
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const f1 = v => v.toFixed(1);

  // ---------- data ----------
  function buildData(items) {
    topics = items.map((d, i) => ({ ...d, i, out: new Set(), inn: new Set(), rel: new Set() }));
    bySlug = new Map(topics.map(d => [d.slug, d]));
    const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
    const map = new Map();
    const addRel = (a, b, auto) => { if (a === b || !bySlug.has(a) || !bySlug.has(b)) return; const k = key(a, b); if (!map.has(k)) map.set(k, { a, b, dir: false, auto }); else if (!auto) map.get(k).auto = false; };
    topics.forEach(d => topics.filter(x => x.group === d.group && x.slug !== d.slug).slice(0, 2).forEach(x => addRel(d.slug, x.slug, true)));
    Object.entries(CROSS).forEach(([a, bs]) => bs.forEach(b => addRel(a, b, false)));
    Object.entries(PREREQ).forEach(([b, as]) => as.forEach(a => { if (!bySlug.has(a) || !bySlug.has(b)) return; map.set(key(a, b), { a, b, dir: true, auto: false }); }));
    edges = [...map.values()];
    edges.forEach(e => {
      const A = bySlug.get(e.a), B = bySlug.get(e.b);
      if (e.dir) { A.out.add(e.b); B.inn.add(e.a); } else { A.rel.add(e.b); B.rel.add(e.a); }
    });
    drawn = edges.filter(e => !e.auto);
    topics.forEach(d => { d.degree = drawn.filter(e => e.a === d.slug || e.b === d.slug).length; d.short = shortName(d); d.cur = { x: 0, y: 0, r: 0, o: 0 }; });
  }
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
  const neighbours = d => new Set([...d.inn, ...d.out, ...d.rel]);
  const pairCount = (g1, g2) => drawn.filter(e => { const a = bySlug.get(e.a).group, b = bySlug.get(e.b).group; return (a === g1 && b === g2) || (a === g2 && b === g1); }).length;
  const inGroup = g => topics.filter(d => d.group === g);

  // ---------- label helpers ----------
  let probe = null;
  const textW = (s, cls = 'kg-label') => { probe.setAttribute('class', cls); probe.textContent = s; return probe.getComputedTextLength(); };
  function wrap(s, max) {
    if (textW(s) <= max) return [s];
    if (ja) { // split at a natural break near the middle, else hard split
      const cut = s.search(/[とのと・、]/) > 1 ? s.search(/[とのと・、]/) + 1 : Math.ceil(s.length / 2);
      return [s.slice(0, cut), s.slice(cut)];
    }
    const words = s.split(' '); let best = [s], bestW = Infinity;
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const w = Math.max(textW(a), textW(b)); if (w < bestW) { bestW = w; best = [a, b]; } }
    return best;
  }

  // ---------- scene ----------
  const gView = el('g', { class: 'kg-view' }); svg.replaceChildren(gView);
  const gBack = el('g', { class: 'kg-back', 'aria-hidden': 'true' }, gView);
  const gEdges = el('g', { class: 'kg-edges', 'aria-hidden': 'true' }, gView);
  const gFront = el('g', { class: 'kg-front' }, gView); // bubbles (overview)
  const gNodes = el('g', { class: 'kg-nodes' }, gView);
  const nodeEls = new Map();
  let edgeRecs = [];

  function makeNodes() {
    probe = el('text', { class: 'kg-label', visibility: 'hidden', 'aria-hidden': 'true' }, svg);
    topics.forEach(d => {
      const a = el('a', { href: pageHref(d), class: `kg-node g-${d.group} is-hidden`, tabindex: '-1', 'data-slug': d.slug }, gNodes);
      a.setAttribute('aria-label', `${d.title[L]}. ${T.groups[d.group]}. ${T.links(d.degree)}.`);
      d.hit = el('circle', { class: 'kg-hit', r: 16 }, a);
      d.ring = el('circle', { class: 'kg-ring', r: 10 }, a);
      d.dot = el('circle', { class: 'kg-dot', r: 5 }, a);
      d.text = el('text', { class: 'kg-label' }, a);
      d.labMode = '';
      nodeEls.set(d.slug, a);
      a.addEventListener('pointerenter', () => { if (lastPointer === 'mouse') setHover(d.slug); });
      a.addEventListener('pointerleave', () => { if (lastPointer === 'mouse') setHover(null); });
      a.addEventListener('focus', () => { setRoving(a); setHover(d.slug); });
      a.addEventListener('blur', () => setHover(null));
      a.addEventListener('click', ev => {
        if (panMoved) { ev.preventDefault(); return; }
        // the centre of the topic view opens the page; everything else navigates within the graph
        if (view.level === 'topic' && view.slug === d.slug) return;
        ev.preventDefault(); go({ level: 'topic', slug: d.slug });
      });
    });
  }
  function setLabel(d, mode, lines) {
    const key = mode + '|' + (lines || []).join('/');
    if (d.labMode === key) return; d.labMode = key;
    d.text.replaceChildren();
    if (mode === 'hide') { d.text.setAttribute('class', 'kg-label is-off'); return; }
    d.text.setAttribute('class', 'kg-label' + (mode === 'big' ? ' is-big' : '') + (mode === 'small' || mode === 'left' || mode === 'right' ? ' is-small' : ''));
    const anchor = mode === 'left' ? 'end' : mode === 'right' ? 'start' : 'middle';
    d.text.style.textAnchor = anchor;
    const r = d.tgt.r, lh = mode === 'big' ? 17 : 14.5;
    (lines || [d.short]).forEach((s, i) => {
      const t = el('tspan', {}, d.text); t.textContent = s;
      if (mode === 'left' || mode === 'right') { t.setAttribute('x', (mode === 'left' ? -1 : 1) * (r + 7)); t.setAttribute('y', 4.5 + (i - (lines.length - 1) / 2) * lh); }
      else { t.setAttribute('x', 0); t.setAttribute('y', r + (mode === 'big' ? 20 : 15) + i * lh); }
    });
  }

  // ---------- views: each sets d.tgt = {x, y, r, o, lab, lines} for every topic and returns what else to draw ----------
  function hideAll() { topics.forEach(d => { d.tgt = { x: d.cur.x, y: d.cur.y, r: d.cur.r || 5, o: 0, lab: 'hide' }; }); }
  const cxy = () => [W / 2, H / 2];

  function overviewLayout() {
    hideAll();
    const [cx, cy] = cxy(), m = Math.min(W, H);
    const k = m * 0.155 / Math.sqrt(17);
    const centres = {};
    RING.forEach((g, i) => {
      const a = (-120 + 60 * i) * Math.PI / 180;
      centres[g] = { x: cx + Math.cos(a) * W * 0.33, y: cy + Math.sin(a) * H * 0.31, r: Math.max(k * Math.sqrt(inGroup(g).length), m * 0.075), a };
    });
    RING.forEach(g => {
      const c = centres[g], list = inGroup(g).sort((a, b) => b.degree - a.degree || a.i - b.i);
      list.forEach((d, i) => {
        const rr = c.r * 0.74 * Math.sqrt((i + 0.5) / list.length), th = i * 2.39996 - Math.PI / 2;
        d.tgt = { x: c.x + rr * Math.cos(th), y: c.y + rr * Math.sin(th), r: 5.5, o: 1, lab: 'hide' };
      });
    });
    return { centres };
  }
  function overviewBack(ctx) {
    const [cx, cy] = cxy(), { centres } = ctx;
    const bands = [];
    for (let i = 0; i < RING.length; i++) for (let j = i + 1; j < RING.length; j++) {
      const n = pairCount(RING[i], RING[j]); if (!n) continue;
      const A = centres[RING[i]], B = centres[RING[j]];
      // pull the control point towards the middle, so the bands bundle through the centre
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, qx = mx + (cx - mx) * 0.45, qy = my + (cy - my) * 0.45;
      const ua = Math.hypot(qx - A.x, qy - A.y), ub = Math.hypot(qx - B.x, qy - B.y);
      const sx = A.x + (qx - A.x) / ua * A.r, sy = A.y + (qy - A.y) / ua * A.r, ex = B.x + (qx - B.x) / ub * B.r, ey = B.y + (qy - B.y) / ub * B.r;
      bands.push({ g1: RING[i], g2: RING[j], n, d: `M${f1(sx)},${f1(sy)} Q${f1(qx)},${f1(qy)} ${f1(ex)},${f1(ey)}`, lx: 0.25 * sx + 0.5 * qx + 0.25 * ex, ly: 0.25 * sy + 0.5 * qy + 0.25 * ey });
    }
    const gb = el('g', { class: 'kg-bands' }, gBack);
    bands.sort((a, b) => a.n - b.n).forEach(b => {
      const g = el('g', { class: 'kg-band', 'data-g1': b.g1, 'data-g2': b.g2 }, gb);
      el('path', { d: b.d, 'stroke-width': f1(1.5 + b.n * 0.95) }, g);
      const t = el('g', { class: 'kg-band-n', transform: `translate(${f1(b.lx)} ${f1(b.ly)})` }, g);
      el('rect', { x: -12, y: -9, width: 24, height: 18, rx: 9 }, t);
      el('text', { y: 4 }, t).textContent = String(b.n);
    });
    RING.forEach(g => {
      const c = centres[g], n = inGroup(g).length;
      const inside = pairCount(g, g);
      const b = el('g', { class: `kg-bubble g-${g}`, tabindex: '-1', role: 'button', 'data-group': g, 'aria-label': `${T.groups[g]}. ${T.topics(n)}. ${T.links(inside)}.` }, gFront);
      el('circle', { cx: f1(c.x), cy: f1(c.y), r: f1(c.r), class: 'kg-bubble-bg' }, b);
      const below = Math.sin(c.a) > -0.3;
      const ly = c.y + (below ? c.r + 22 : -c.r - 26);
      el('text', { x: f1(c.x), y: f1(ly), class: 'kg-bubble-name' }, b).textContent = T.groups[g];
      el('text', { x: f1(c.x), y: f1(ly + 16), class: 'kg-bubble-n' }, b).textContent = T.inTopics(n);
      b.addEventListener('click', () => go({ level: 'subject', group: g }));
      b.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go({ level: 'subject', group: g }); } });
      b.addEventListener('pointerenter', () => { if (lastPointer === 'mouse') setGroupHi(g); });
      b.addEventListener('pointerleave', () => { if (lastPointer === 'mouse') setGroupHi(null); });
      b.addEventListener('focus', () => { setRoving(b); setGroupHi(g); });
      b.addEventListener('blur', () => setGroupHi(null));
    });
  }

  function subjectLayout(g) {
    hideAll();
    const [cx, cy] = cxy();
    const inner = inGroup(g), innerSet = new Set(inner.map(d => d.slug));
    const extMap = new Map(); // ext slug -> inner neighbours
    drawn.forEach(e => {
      const ia = innerSet.has(e.a), ib = innerSet.has(e.b);
      if (ia && !ib) (extMap.get(e.b) || extMap.set(e.b, []).get(e.b)).push(e.a);
      if (ib && !ia) (extMap.get(e.a) || extMap.set(e.a, []).get(e.a)).push(e.b);
    });
    const ext = [...extMap.keys()].map(s => bySlug.get(s));
    const extW = Math.min(170, Math.max(60, ...ext.map(d => textW(d.short, 'kg-label is-small'))));
    const Rx = W / 2 - extW - 26, Ry = H / 2 - 30;
    const rx = Rx - 78, ry = Ry - 34;
    // inner labels, wrapped
    inner.forEach(d => { d.lines = wrap(d.short, 150); d.lw = Math.max(...d.lines.map(s => textW(s))); d.rr = 6 + Math.sqrt(d.degree) * 1.5; });
    const P = new Map(inner.map((d, i) => { const rr = Math.sqrt((i + 0.5) / inner.length), th = i * 2.39996; return [d.slug, { x: cx + rr * rx * 0.8 * Math.cos(th), y: cy + rr * ry * 0.8 * Math.sin(th), vx: 0, vy: 0 }]; }));
    const internal = drawn.filter(e => innerSet.has(e.a) && innerSet.has(e.b));
    const extPos = new Map();
    const relax = (iters, withExt) => {
      const scale = Math.sqrt(rx * ry * 2.4 / Math.max(inner.length, 3));
      for (let it = 0; it < iters; it++) {
        const al = 1 - it / iters;
        for (let i = 0; i < inner.length; i++) for (let j = i + 1; j < inner.length; j++) {
          const a = P.get(inner[i].slug), b = P.get(inner[j].slug);
          let dx = b.x - a.x, dy = (b.y - a.y) * 1.3, d2 = dx * dx + dy * dy + 1; const f = scale * scale * 0.9 / d2 * al, dd = Math.sqrt(d2); dx /= dd; dy /= dd;
          a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
        }
        internal.forEach(e => { const a = P.get(e.a), b = P.get(e.b); let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1; const f = (d - scale * 0.9) * 0.04 * al; dx /= d; dy /= d; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; });
        if (withExt) extMap.forEach((ins, s) => { const q = extPos.get(s); ins.forEach(x => { const a = P.get(x); a.vx += (q.x - a.x) * 0.004 * al; a.vy += (q.y - a.y) * 0.004 * al; }); });
        P.forEach(p => {
          p.vx += (cx - p.x) * 0.01 * al; p.vy += (cy - p.y) * 0.01 * al;
          p.x += p.vx; p.y += p.vy; p.vx *= 0.5; p.vy *= 0.5;
          const ex = (p.x - cx) / rx, ey = (p.y - cy) / ry, q = Math.hypot(ex, ey);
          if (q > 1) { p.x = cx + ex / q * rx; p.y = cy + ey / q * ry; }
        });
      }
    };
    const spread = () => { let qx = 0, qy = 0, mx = 0, my = 0; P.forEach(p => { mx += p.x / P.size; my += p.y / P.size; }); P.forEach(p => { qx = Math.max(qx, Math.abs(p.x - mx) / rx); qy = Math.max(qy, Math.abs(p.y - my) / ry); }); P.forEach(p => { p.x = cx + (p.x - mx) * 0.86 / (qx || 1); p.y = cy + (p.y - my) * 0.84 / (qy || 1); }); };
    relax(260, false); spread();
    // outer ring: each outside subject goes to the side where its neighbours are, in the order of their height
    const groupsOut = GROUPS.filter(x => x !== g).map(x => {
      const list = ext.filter(d => d.group === x);
      list.forEach(d => { const ins = extMap.get(d.slug).map(s => P.get(s)); d.py = ins.reduce((s, p) => s + p.y, 0) / ins.length; d.px = ins.reduce((s, p) => s + p.x, 0) / ins.length; });
      return { g: x, list, dx: list.reduce((s, d) => s + d.px - cx, 0), y: list.reduce((s, d) => s + d.py, 0) / (list.length || 1) };
    }).filter(o => o.list.length);
    const sides = { L: [], R: [] };
    groupsOut.sort((a, b) => Math.abs(b.dx) - Math.abs(a.dx)).forEach(o => {
      const nL = sides.L.reduce((s, q) => s + q.list.length, 0), nR = sides.R.reduce((s, q) => s + q.list.length, 0);
      let side = o.dx < 0 ? 'L' : 'R';
      if (side === 'L' && nL + o.list.length > (nL + nR + o.list.length) * 0.62 && nL > nR) side = 'R';
      else if (side === 'R' && nR + o.list.length > (nL + nR + o.list.length) * 0.62 && nR > nL) side = 'L';
      sides[side].push(o);
    });
    const arcs = [];
    Object.entries(sides).forEach(([side, gs]) => {
      gs.sort((a, b) => a.y - b.y); gs.forEach(o => o.list.sort((a, b) => a.py - b.py));
      const n = gs.reduce((s, o) => s + o.list.length, 0); if (!n) return;
      const GAP = 1.9, slots = n - 1 + (gs.length - 1) * GAP, span = Ry * 1.8, step = Math.min(36, span / Math.max(slots, 1));
      let y = cy - step * slots / 2;
      gs.forEach(o => {
        const seg = [];
        o.list.forEach(d => {
          const t = Math.max(-0.999, Math.min(0.999, (y - cy) / Ry)), x = cx + (side === 'L' ? -1 : 1) * Rx * Math.sqrt(1 - t * t);
          extPos.set(d.slug, { x, y }); seg.push([x, y]); y += step;
        });
        y += step * GAP - step;
        arcs.push({ g: o.g, side, seg }); arcs.stepUsed = Math.min(arcs.stepUsed || 99, step);
      });
    });
    relax(160, true); spread();
    // resolve overlaps between inner labels
    const boxes = inner.map(d => ({ d, p: P.get(d.slug), w: d.lw + 12, hb: d.rr + 6 + d.lines.length * 14.5 }));
    const rect = b => ({ l: b.p.x - b.w / 2, r: b.p.x + b.w / 2, t: b.p.y - b.d.rr - 4, b: b.p.y + b.hb });
    for (let pass = 0; pass < 300; pass++) {
      let moved = false;
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const A = rect(boxes[i]), B = rect(boxes[j]);
        const ox = Math.min(A.r, B.r) - Math.max(A.l, B.l) + 6, oy = Math.min(A.b, B.b) - Math.max(A.t, B.t) + 4;
        if (ox > 0 && oy > 0) { moved = true; const a = boxes[i].p, b = boxes[j].p; if (ox * 0.6 < oy) { const s = (a.x < b.x ? -1 : 1) * ox / 2; a.x += s; b.x -= s; } else { const s = (a.y < b.y ? -1 : 1) * oy / 2; a.y += s; b.y -= s; } }
      }
      boxes.forEach(b => { b.p.x = Math.max(cx - Rx + b.w / 2, Math.min(cx + Rx - b.w / 2, b.p.x)); b.p.y = Math.max(28, Math.min(H - 20 - b.hb, b.p.y)); });
      if (!moved) break;
    }
    inner.forEach(d => { const p = P.get(d.slug); d.tgt = { x: p.x, y: p.y, r: d.rr, o: 1, lab: 'below', lines: d.lines }; });
    ext.forEach(d => { const p = extPos.get(d.slug); d.tgt = { x: p.x, y: p.y, r: 4.5, o: 1, lab: p.x < cx ? 'left' : 'right', lines: [d.short], outer: true }; });
    return { g, inner: innerSet, ext: new Set(ext.map(d => d.slug)), arcs, Rx, Ry, rx, ry, step: arcs.stepUsed || 30 };
  }
  function subjectBack(ctx) {
    const [cx, cy] = cxy();
    el('ellipse', { cx, cy, rx: f1(ctx.rx + 40), ry: f1(ctx.ry + 30), class: `kg-region g-${ctx.g}` }, gBack);
    ctx.arcs.forEach(a => {
      const s = a.seg, g = el('g', { class: `kg-arc g-${a.g}` }, gBack);
      if (s.length > 1) el('path', { d: 'M' + s.map(p => f1(p[0]) + ',' + f1(p[1])).join(' L') }, g);
      const [x, y] = s[0], dir = a.side === 'L' ? -1 : 1;
      const b = el('text', { x: f1(x + dir * 4), y: f1(y - Math.min(18, 0.62 * ctx.step)), 'text-anchor': a.side === 'L' ? 'end' : 'start', class: 'kg-arc-label' }, g);
      b.textContent = T.groups[a.g];
    });
  }

  function topicLayout(slug) {
    hideAll();
    const f = bySlug.get(slug), path = learningPath(f);
    const anc = path.order.filter(s => !f.inn.has(s) && !f.rel.has(s) && !f.out.has(s)).map(s => bySlug.get(s));
    const byName = (a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.short.localeCompare(b.short, ja ? 'ja' : 'en');
    const inn = [...f.inn].map(s => bySlug.get(s)).sort(byName), out = [...f.out].map(s => bySlug.get(s)).sort(byName), rel = [...f.rel].map(s => bySlug.get(s)).sort(byName);
    // columns left to right: earlier prerequisites, builds on, the topic, leads to; only the ones in use, spread evenly
    const present = [anc.length > 0, inn.length > 0, true, out.length > 0], k = present.filter(Boolean).length;
    const xs = { 1: [0.5], 2: [0.3, 0.7], 3: [0.18, 0.5, 0.82], 4: [0.1, 0.34, 0.58, 0.84] }[k];
    let ci = 0; const colW = present.map(p => p ? xs[ci++] : null);
    const maxW = W * (k === 4 ? 0.2 : 0.26);
    // related: a grid along the bottom
    const perRow = Math.max(3, Math.floor((W - 40) / 150)), rows = Math.ceil(rel.length / perRow);
    const relTop = rel.length ? H - 22 - rows * 54 + 8 : H;
    const yTop = 104, yBot = rel.length ? relTop - 70 : H - 50, midY = (yTop + yBot) / 2;
    const column = (list, xf) => {
      const n = list.length, step = n > 1 ? Math.min(62, (yBot - yTop) / (n - 1)) : 0;
      list.forEach((d, i) => { const lines = wrap(d.short, maxW); d.tgt = { x: W * xf, y: midY + (i - (n - 1) / 2) * step - 8, r: 7, o: 1, lab: 'below', lines }; });
    };
    column(inn, colW[1]); column(out, colW[3]);
    if (anc.length) {
      // earlier prerequisites sit level with the topics they lead into
      column(anc, colW[0]);
      const want = d => { const kids = [...d.out].filter(s => f.inn.has(s)).map(s => bySlug.get(s).tgt.y); return kids.length ? kids.reduce((a, b) => a + b, 0) / kids.length : midY; };
      const ys = anc.map(d => d.tgt.y).sort((a, b) => a - b);
      anc.slice().sort((a, b) => want(a) - want(b)).forEach((d, i) => { d.tgt.y = ys[i]; });
    }
    rel.forEach((d, i) => {
      const row = Math.floor(i / perRow), inRow = Math.min(perRow, rel.length - row * perRow), col = i - row * perRow;
      const colStep = (W - 40) / perRow;
      d.tgt = { x: W / 2 + (col - (inRow - 1) / 2) * colStep, y: relTop + row * 54, r: 6, o: 1, lab: 'below', lines: wrap(d.short, colStep - 16) };
    });
    f.tgt = { x: W * colW[2], y: midY - 8, r: 13, o: 1, lab: 'big', lines: wrap(f.short, W * 0.2) };
    const heads = [];
    if (anc.length) heads.push([W * colW[0], T.earlier]);
    if (inn.length) heads.push([W * colW[1], T.buildsOn]);
    if (out.length) heads.push([W * colW[3], T.leadsTo]);
    return { slug, heads, col: new Set([...anc.map(d => d.slug), ...f.inn]), relTop: rel.length ? relTop : null, show: new Set([slug, ...anc.map(d => d.slug), ...f.inn, ...f.out, ...f.rel]), path };
  }
  function topicBack(ctx) {
    ctx.heads.forEach(([x, t]) => { el('text', { x: f1(x), y: 70, class: 'kg-col-h' }, gBack).textContent = t; });
    if (ctx.relTop != null) {
      el('line', { x1: 30, x2: W - 30, y1: f1(ctx.relTop - 40), y2: f1(ctx.relTop - 40), class: 'kg-rule-line' }, gBack);
      el('text', { x: W / 2, y: f1(ctx.relTop - 24), class: 'kg-col-h' }, gBack).textContent = T.related;
    }
  }

  // which edges each view draws
  function edgesFor(ctx) {
    if (view.level === 'subject') return drawn.filter(e => (ctx.inner.has(e.a) || ctx.inner.has(e.b)) && (ctx.inner.has(e.a) || ctx.ext.has(e.a)) && (ctx.inner.has(e.b) || ctx.ext.has(e.b))).map(e => ({ e, cls: ctx.inner.has(e.a) && ctx.inner.has(e.b) ? 'is-inner' : 'is-cross' }));
    if (view.level === 'topic') {
      const s = ctx.slug;
      return edges.filter(e => {
        if (e.a === s || e.b === s) return e.dir;
        return e.dir && ctx.col.has(e.a) && ctx.col.has(e.b);
      }).map(e => ({ e, cls: e.a === s || e.b === s ? (e.dir ? (e.b === s ? 'is-pre' : 'is-dep') : 'is-rel') : 'is-path' }));
    }
    return [];
  }
  function edgePath(e) {
    const A = bySlug.get(e.a).cur, B = bySlug.get(e.b).cur;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
    const bend = Math.min(36, d * 0.12) * (e.a < e.b ? 1 : -1);
    const mx = (A.x + B.x) / 2 - dy / d * bend, my = (A.y + B.y) / 2 + dx / d * bend;
    const u = Math.hypot(B.x - mx, B.y - my) || 1;
    const ex = B.x - (B.x - mx) / u * (B.r + 3), ey = B.y - (B.y - my) / u * (B.r + 3);
    return { d: `M${f1(A.x)},${f1(A.y)} Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)}`, ex, ey, ang: Math.atan2(ey - my, ex - mx) };
  }
  function drawEdges(list) {
    gEdges.replaceChildren(); edgeRecs = [];
    list.forEach(({ e, cls }) => {
      const g = el('g', { class: `kg-edge ${cls}` + (e.dir ? ' is-dir' : '') }, gEdges);
      const p = el('path', {}, g), arr = e.dir ? el('path', { class: 'kg-arrow' }, g) : null;
      edgeRecs.push({ e, g, p, arr });
    });
    updateEdges();
  }
  function updateEdges() {
    edgeRecs.forEach(r => {
      const q = edgePath(r.e); r.p.setAttribute('d', q.d);
      if (r.arr) { const s = 6.5, a = q.ang; r.arr.setAttribute('d', `M${f1(q.ex)},${f1(q.ey)} L${f1(q.ex - s * Math.cos(a - .42))},${f1(q.ey - s * Math.sin(a - .42))} L${f1(q.ex - s * Math.cos(a + .42))},${f1(q.ey - s * Math.sin(a + .42))} Z`); }
    });
  }

  // ---------- transitions ----------
  let anim = 0, ctx = null;
  function applyNode(d) {
    const a = nodeEls.get(d.slug), c = d.cur;
    a.setAttribute('transform', `translate(${f1(c.x)} ${f1(c.y)})`);
    a.style.opacity = c.o < 0.999 ? c.o.toFixed(3) : '';
    d.dot.setAttribute('r', f1(c.r)); d.ring.setAttribute('r', f1(c.r + 5)); d.hit.setAttribute('r', f1(view.level === 'overview' ? c.r + 2.5 : Math.max(12, c.r + 8)));
  }
  function layoutView() {
    const box = figure.getBoundingClientRect();
    W = Math.max(600, Math.round(box.width));
    H = Math.round(Math.max(560, Math.min(780, W * 0.74)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    detail.style.maxHeight = matchMedia('(max-width:1000px)').matches ? '' : H + 'px';
    if (view.level === 'subject') ctx = subjectLayout(view.group);
    else if (view.level === 'topic') ctx = topicLayout(view.slug);
    else ctx = overviewLayout();
  }
  function show(animate) {
    cancelAnimationFrame(anim);
    layoutView();
    gBack.replaceChildren(); gFront.replaceChildren();
    if (view.level === 'overview') overviewBack(ctx); else if (view.level === 'subject') subjectBack(ctx); else topicBack(ctx);
    svg.dataset.level = view.level;
    topics.forEach(d => {
      const a = nodeEls.get(d.slug), t = d.tgt, vis = t.o > 0;
      a.classList.toggle('is-hidden', !vis);
      a.classList.toggle('is-outer', !!t.outer);
      a.classList.toggle('is-center', view.level === 'topic' && d.slug === view.slug);
      if (vis) setLabel(d, t.lab, t.lines);
      if (vis && d.cur.o === 0) { d.cur.x = t.x; d.cur.y = t.y; d.cur.r = t.r; }
    });
    const from = topics.map(d => ({ ...d.cur }));
    drawEdges(edgesFor(ctx));
    resetZoom(false);
    const dur = animate && !reduce.matches ? 520 : 0, t0 = performance.now();
    gEdges.style.opacity = dur ? '0' : '';
    const step = now => {
      const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      topics.forEach((d, i) => { const a = from[i], t = d.tgt; d.cur.x = a.x + (t.x - a.x) * e; d.cur.y = a.y + (t.y - a.y) * e; d.cur.r = a.r + (t.r - a.r) * e; d.cur.o = a.o + (t.o - a.o) * e; applyNode(d); });
      updateEdges();
      if (dur) gEdges.style.opacity = String(Math.max(0, (k - 0.35) / 0.65));
      if (k < 1) anim = requestAnimationFrame(step); else { gEdges.style.opacity = ''; }
    };
    if (dur) anim = requestAnimationFrame(step); else step(performance.now());
    built = true;
    const first = focusables()[0]; if (first) setRoving(first, true);
    render();
  }
  function go(v, push = true) {
    if (v.level === 'topic' && !bySlug.has(v.slug)) v = { level: 'overview' };
    if (v.level === 'subject' && !GROUPS.includes(v.group)) v = { level: 'overview' };
    view = v; hoverSlug = null; groupHi = null;
    if (push) {
      const u = new URL(location.href); u.searchParams.delete('topic'); u.searchParams.delete('subject');
      if (v.level === 'topic') u.searchParams.set('topic', v.slug); if (v.level === 'subject') u.searchParams.set('subject', v.group);
      history.pushState({ kg: v }, '', u);
    }
    show(true);
    updateCrumbs();
  }
  addEventListener('popstate', ev => { view = ev.state?.kg || viewFromURL(); show(true); updateCrumbs(); });
  function viewFromURL() {
    const p = new URLSearchParams(location.search), t = p.get('topic'), s = p.get('subject');
    if (t && bySlug.has(t)) return { level: 'topic', slug: t };
    if (s && GROUPS.includes(s)) return { level: 'subject', group: s };
    return { level: 'overview' };
  }
  function up() { if (view.level === 'topic') go({ level: 'subject', group: bySlug.get(view.slug).group }); else if (view.level === 'subject') go({ level: 'overview' }); }

  // ---------- hover and highlight ----------
  function setHover(slug) { hoverSlug = slug; render(); }
  function setGroupHi(g) { groupHi = g; render(); }
  function matchesQuery(d) {
    if (!query) return false;
    const hay = `${d.title[0].split(':')[0]} ${d.title[1].split('：')[0]} ${d.short} ${d.slug.replace(/-/g, ' ')} ${T.groups[d.group]} ${d.group}`.toLowerCase();
    return hay.includes(query);
  }
  function render() {
    const matches = new Set(topics.filter(matchesQuery).map(d => d.slug));
    status.textContent = query ? T.matches(matches.size) : T.topics(topics.length);
    listRoot.querySelectorAll('[data-slug]').forEach(li => { li.hidden = !!query && !matches.has(li.dataset.slug); });
    listRoot.querySelectorAll('.kg-list-group').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('[data-slug]')].some(li => !li.hidden); });
    legend.querySelectorAll('.kg-leg').forEach(b => b.setAttribute('aria-pressed', String(view.level === 'subject' && view.group === b.dataset.group)));
    if (!built) return;
    const f = hoverSlug && view.level !== 'topic' ? bySlug.get(hoverSlug) : null;
    const nb = f ? neighbours(f) : null;
    svg.classList.toggle('is-focusing', !!f && view.level === 'subject');
    svg.classList.toggle('is-searching', !!query);
    svg.classList.toggle('is-grouping', view.level === 'overview' && !!groupHi);
    nodeEls.forEach((a, s) => {
      const d = bySlug.get(s);
      a.classList.toggle('is-focus', !!f && s === f.slug);
      a.classList.toggle('is-pre', !!f && f.inn.has(s));
      a.classList.toggle('is-dep', !!f && f.out.has(s));
      a.classList.toggle('is-rel', !!f && f.rel.has(s));
      a.classList.toggle('is-match', matches.has(s));
      a.classList.toggle('is-group', groupHi === d.group);
      // in the overview a label appears only for the hovered topic and for search matches
      if (view.level === 'overview') setLabel(d, (f && s === f.slug) || matches.has(s) ? 'small' : 'hide', [d.short]);
    });
    edgeRecs.forEach(({ e, g }) => {
      const on = !!f && (e.a === f.slug || e.b === f.slug);
      g.classList.toggle('is-on', on);
      g.classList.toggle('is-hpre', on && e.dir && e.b === f.slug);
      g.classList.toggle('is-hdep', on && e.dir && e.a === f.slug);
    });
    if (f) edgeRecs.forEach(({ g }) => { if (g.classList.contains('is-on')) gEdges.append(g); });
    gBack.querySelectorAll('.kg-band').forEach(b => { const on = groupHi && (b.dataset.g1 === groupHi || b.dataset.g2 === groupHi); b.classList.toggle('is-on', !!on); if (on) b.parentNode.append(b); });
    gFront.querySelectorAll('.kg-bubble').forEach(b => { b.classList.toggle('is-on', groupHi === b.dataset.group); b.classList.toggle('is-match', !!query && inGroup(b.dataset.group).some(d => matches.has(d.slug))); });
    if (view.level === 'overview' && groupHi) gFront.querySelectorAll('.kg-bubble').forEach(b => { if (b.dataset.group !== groupHi) b.classList.toggle('is-linked', pairCount(groupHi, b.dataset.group) > 0); });
    renderDetail();
  }

  // ---------- detail panel ----------
  function navLink(cls, text, v, g) {
    const a = h('a', cls + (g ? ` g-${g}` : ''), text);
    const u = new URL(location.href); u.searchParams.delete('topic'); u.searchParams.delete('subject');
    if (v.level === 'topic') u.searchParams.set('topic', v.slug); if (v.level === 'subject') u.searchParams.set('subject', v.group);
    a.href = u.pathname + u.search;
    a.addEventListener('click', ev => { ev.preventDefault(); go(v); });
    return a;
  }
  function chips(set, cls) {
    const wrap = h('p', 'kg-chips');
    const arr = [...set].map(s => bySlug.get(s)).sort((a, b) => a.short.localeCompare(b.short, ja ? 'ja' : 'en'));
    if (!arr.length) { wrap.append(h('span', 'kg-none', T.none)); return wrap; }
    arr.forEach(d => {
      const a = navLink(`kg-chip ${cls}`, d.short, { level: 'topic', slug: d.slug }, d.group);
      a.addEventListener('mouseenter', () => nodeEls.get(d.slug)?.classList.add('is-hint'));
      a.addEventListener('mouseleave', () => nodeEls.get(d.slug)?.classList.remove('is-hint'));
      wrap.append(a);
    });
    return wrap;
  }
  function keysNote() { detail.append(h('p', 'kg-d-keys', T.keys + ' ' + T.keysZoom)); }
  function renderDetail() {
    detail.replaceChildren();
    if (view.level === 'overview') {
      detail.append(h('p', 'kg-kicker', T.topics(topics.length) + ' · ' + T.links(drawn.length)));
      detail.append(h('h2', 'kg-d-title', T.overTitle));
      detail.append(h('p', 'kg-d-copy', T.overCopy));
      const hd = h('h3', 'kg-d-h', T.subjects); detail.append(hd);
      const ul = h('ul', 'kg-subj');
      GROUPS.forEach(g => { const li = h('li'); const a = navLink('kg-subj-link', '', { level: 'subject', group: g }, g); a.append(h('span', 'kg-kdot'), h('span', 'kg-subj-name', T.groups[g]), h('span', 'kg-subj-n', String(inGroup(g).length))); a.addEventListener('mouseenter', () => setGroupHi(g)); a.addEventListener('mouseleave', () => setGroupHi(null)); li.append(a); ul.append(li); });
      detail.append(ul);
      const pairs = [];
      for (let i = 0; i < GROUPS.length; i++) for (let j = i + 1; j < GROUPS.length; j++) { const n = pairCount(GROUPS[i], GROUPS[j]); if (n) pairs.push([GROUPS[i], GROUPS[j], n]); }
      detail.append(h('h3', 'kg-d-h', T.strongest));
      const ol = h('ul', 'kg-pairs');
      pairs.sort((a, b) => b[2] - a[2]).slice(0, 4).forEach(([a, b, n]) => { const li = h('li'); li.append(h('span', `kg-kdot g-${a}`), h('span', null, T.groups[a]), h('span', 'kg-pair-x', '–'), h('span', `kg-kdot g-${b}`), h('span', null, T.groups[b]), h('span', 'kg-subj-n', T.linksBetween(n))); ol.append(li); });
      detail.append(ol);
      keysNote();
      return;
    }
    if (view.level === 'subject') {
      const g = view.group, list = inGroup(g), inside = pairCount(g, g), outside = drawn.filter(e => (bySlug.get(e.a).group === g) !== (bySlug.get(e.b).group === g)).length;
      const kicker = h('p', `kg-kicker g-${g}`); kicker.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[g])); detail.append(kicker);
      detail.append(h('h2', 'kg-d-title', T.groups[g]));
      detail.append(h('p', 'kg-d-copy', T.subjCopy(list.length, inside, outside)));
      detail.append(h('h3', 'kg-d-h', T.inSubject), chips(new Set(list.map(d => d.slug)), 'c-in'));
      detail.append(h('h3', 'kg-d-h', T.toOther));
      const ul = h('ul', 'kg-subj');
      GROUPS.filter(x => x !== g).map(x => [x, pairCount(g, x)]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]).forEach(([x, n]) => { const li = h('li'); const a = navLink('kg-subj-link', '', { level: 'subject', group: x }, x); a.append(h('span', 'kg-kdot'), h('span', 'kg-subj-name', T.groups[x]), h('span', 'kg-subj-n', T.linksBetween(n))); li.append(a); ul.append(li); });
      detail.append(ul);
      keysNote();
      return;
    }
    const f = bySlug.get(view.slug), path = learningPath(f);
    const kicker = h('p', `kg-kicker g-${f.group}`); kicker.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[f.group])); detail.append(kicker);
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
    if (path.order.length > f.inn.size) {
      const hd = h('h3', 'kg-d-h'); hd.append(h('span', 'kg-swatch s-path'), document.createTextNode(T.path)); detail.append(hd);
      const ol = h('ol', 'kg-path');
      path.order.forEach(s => { const d = bySlug.get(s); const li = h('li'); li.append(navLink('kg-chip c-path', d.short, { level: 'topic', slug: s }, d.group)); ol.append(li); });
      detail.append(ol, h('p', 'kg-d-note', T.pathNote));
    }
    if (f.labs && f.labs.length) {
      const hd = h('h3', 'kg-d-h'); hd.append(document.createTextNode(T.labs(f.labs.length))); detail.append(hd);
      const ul = h('ul', 'kg-labs');
      f.labs.forEach(lab => { const li = h('li'); const a = h('a', 'kg-lab', lab.title[L].replace(/^\d+\.\s*/, '')); a.href = pageHref(f) + '#' + lab.id; li.append(a); ul.append(li); });
      detail.append(ul);
    }
    const open = h('a', 'kg-open', T.open); open.href = pageHref(f); open.append(h('span', null, ' →'));
    detail.append(open);
  }

  // ---------- breadcrumb and zoom controls ----------
  const bar = h('div', 'kg-over');
  const crumbs = h('nav', 'kg-crumbs'); crumbs.setAttribute('aria-label', T.crumbs);
  const zoom = h('div', 'kg-zoom');
  const zb = (txt, label, fn) => { const b = h('button', 'kg-zb', txt); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label; b.addEventListener('click', fn); zoom.append(b); return b; };
  bar.append(crumbs, zoom); figure.prepend(bar);
  function updateCrumbs() {
    crumbs.replaceChildren();
    const add = (text, v, g, current) => {
      if (crumbs.childNodes.length) crumbs.append(h('span', 'kg-sep', '›'));
      if (current) { const s = h('span', 'kg-crumb is-current' + (g ? ` g-${g}` : ''), text); s.setAttribute('aria-current', 'page'); if (g) s.prepend(h('span', 'kg-kdot')); crumbs.append(s); }
      else { const a = navLink('kg-crumb', text, v, g); if (g) a.prepend(h('span', 'kg-kdot')); crumbs.append(a); }
    };
    add(T.all, { level: 'overview' }, null, view.level === 'overview');
    if (view.level !== 'overview') { const g = view.level === 'subject' ? view.group : bySlug.get(view.slug).group; add(T.groups[g], { level: 'subject', group: g }, g, view.level === 'subject'); }
    if (view.level === 'topic') add(bySlug.get(view.slug).short, view, null, true);
  }

  // pan and zoom act on one transform over the whole scene; they reset whenever the level changes
  let zk = 1, zx = 0, zy = 0, panMoved = false;
  const applyZoom = () => { gView.setAttribute('transform', zk === 1 && !zx && !zy ? '' : `translate(${f1(zx)} ${f1(zy)}) scale(${zk.toFixed(3)})`); zoomReset.hidden = zk === 1 && !zx && !zy; };
  function zoomAt(k, px, py) { const nk = Math.max(1, Math.min(4, zk * k)); zx = px - (px - zx) * nk / zk; zy = py - (py - zy) * nk / zk; zk = nk; if (zk === 1) { zx = 0; zy = 0; } clampPan(); applyZoom(); }
  function clampPan() { zx = Math.min(0, Math.max(W - W * zk, zx)); zy = Math.min(0, Math.max(H - H * zk, zy)); }
  function resetZoom() { zk = 1; zx = 0; zy = 0; applyZoom(); }
  zb('+', T.zoomIn, () => zoomAt(1.4, W / 2, H / 2));
  zb('−', T.zoomOut, () => zoomAt(1 / 1.4, W / 2, H / 2));
  const zoomReset = zb('⟲', T.zoomReset, () => resetZoom()); zoomReset.hidden = true;
  const toSvg = ev => { const r = svg.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
  svg.addEventListener('wheel', ev => { if (!ev.ctrlKey && !ev.metaKey) return; ev.preventDefault(); const [x, y] = toSvg(ev); zoomAt(Math.exp(-ev.deltaY * 0.004), x, y); }, { passive: false });
  const pointers = new Map(); let pinch0 = 0;
  svg.addEventListener('pointerdown', ev => {
    lastPointer = ev.pointerType || 'mouse';
    pointers.set(ev.pointerId, [ev.clientX, ev.clientY]); panMoved = false;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  svg.addEventListener('pointermove', ev => {
    if (!pointers.has(ev.pointerId)) return;
    const prev = pointers.get(ev.pointerId); pointers.set(ev.pointerId, [ev.clientX, ev.clientY]);
    const r = svg.getBoundingClientRect(), s = W / r.width;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0) { const [x, y] = toSvg({ clientX: (a[0] + b[0]) / 2, clientY: (a[1] + b[1]) / 2 }); zoomAt(d / pinch0, x, y); } pinch0 = d; panMoved = true; return; }
    if (zk === 1) return;
    const dx = (ev.clientX - prev[0]) * s, dy = (ev.clientY - prev[1]) * s;
    if (!panMoved && Math.hypot(ev.clientX - prev[0], ev.clientY - prev[1]) < 1) return;
    panMoved = true; svg.classList.add('is-panning'); zx += dx; zy += dy; clampPan(); applyZoom();
  });
  const endPtr = ev => { pointers.delete(ev.pointerId); if (pointers.size < 2) pinch0 = 0; svg.classList.remove('is-panning'); setTimeout(() => { panMoved = false; }, 0); };
  svg.addEventListener('pointerup', endPtr); svg.addEventListener('pointercancel', endPtr);

  // ---------- phone list ----------
  function buildList() {
    listRoot.replaceChildren();
    GROUPS.forEach(g => {
      const sec = h('section', `kg-list-group g-${g}`);
      const hd = h('h2', 'kg-list-h'); hd.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[g]));
      sec.append(hd);
      const ul = h('ul');
      inGroup(g).sort((a, b) => a.short.localeCompare(b.short, ja ? 'ja' : 'en')).forEach(d => {
        const li = h('li'); li.dataset.slug = d.slug;
        const a = h('a', 'kg-li-link'); a.href = pageHref(d);
        a.append(h('strong', null, d.short), h('span', 'kg-li-desc', d.description[L]));
        li.append(a);
        const meta = h('p', 'kg-li-meta');
        const part = (label, set, cls) => {
          if (!set.size) return;
          const s = h('span', 'kg-li-rel ' + cls); s.append(h('em', null, label + ' '));
          [...set].forEach((x, k) => { if (k) s.append(document.createTextNode(ja ? '、' : ', ')); const aa = h('a', null, bySlug.get(x).short); aa.href = pageHref(bySlug.get(x)); s.append(aa); });
          meta.append(s);
        };
        part(T.buildsOn, d.inn, 'c-pre'); part(T.leadsTo, d.out, 'c-dep'); part(T.related, d.rel, 'c-rel');
        li.append(meta); ul.append(li);
      });
      sec.append(ul); listRoot.append(sec);
    });
  }

  // ---------- legend: one button per subject, opening its map ----------
  function buildLegend() {
    legend.replaceChildren();
    GROUPS.forEach(g => {
      const b = h('button', `kg-leg g-${g}`); b.type = 'button'; b.dataset.group = g;
      b.setAttribute('aria-pressed', 'false');
      b.append(h('span', 'kg-kdot'), document.createTextNode(T.groups[g]), h('span', 'kg-leg-n', String(inGroup(g).length)));
      b.addEventListener('click', () => go(view.level === 'subject' && view.group === g ? { level: 'overview' } : { level: 'subject', group: g }));
      b.addEventListener('mouseenter', () => { if (view.level === 'overview') setGroupHi(g); });
      b.addEventListener('mouseleave', () => { if (view.level === 'overview') setGroupHi(null); });
      legend.append(b);
    });
  }

  // ---------- keyboard ----------
  const focusables = () => view.level === 'overview' ? [...gFront.querySelectorAll('.kg-bubble')] : [...gNodes.querySelectorAll('.kg-node:not(.is-hidden)')];
  function setRoving(target, quiet) {
    svg.querySelectorAll('.kg-node, .kg-bubble').forEach(n => n.setAttribute('tabindex', n === target ? '0' : '-1'));
    if (!quiet) target.focus?.({ preventScroll: true });
  }
  function posOf(n) {
    if (n.classList.contains('kg-bubble')) { const c = n.querySelector('circle'); return [+c.getAttribute('cx'), +c.getAttribute('cy')]; }
    const d = bySlug.get(n.dataset.slug); return [d.cur.x, d.cur.y];
  }
  function nearest(from, dir) {
    const [ux, uy] = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[dir];
    const [fx, fy] = posOf(from); let best = null, bestS = Infinity;
    focusables().forEach(n => {
      if (n === from) return;
      const [x, y] = posOf(n), dx = x - fx, dy = y - fy, along = dx * ux + dy * uy;
      if (along <= 4) return;
      const s = along + Math.abs(dx * uy - dy * ux) * 2.2;
      if (s < bestS) { bestS = s; best = n; }
    });
    return best;
  }
  svg.addEventListener('keydown', ev => {
    const cur = ev.target.closest('.kg-node, .kg-bubble');
    if (!cur) return;
    if (ev.key.startsWith('Arrow')) { ev.preventDefault(); const n = nearest(cur, ev.key); if (n) setRoving(n); }
    else if (ev.key === 'Escape') { ev.preventDefault(); up(); setTimeout(() => focusables()[0]?.focus({ preventScroll: true }), 30); }
    else if (ev.key === ' ' && cur.classList.contains('kg-node')) { ev.preventDefault(); cur.click(); }
  });
  addEventListener('pointerdown', ev => { lastPointer = ev.pointerType || 'mouse'; }, true);

  // ---------- search ----------
  search.addEventListener('input', () => { query = search.value.trim().toLowerCase(); render(); });
  search.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      const first = topics.filter(matchesQuery).sort((a, b) => a.short.localeCompare(b.short))[0];
      if (!first) return;
      ev.preventDefault();
      if (getComputedStyle(figure.parentNode).display === 'none') listRoot.querySelector(`[data-slug="${first.slug}"] a`)?.focus();
      else go({ level: 'topic', slug: first.slug });
    } else if (ev.key === 'Escape') { search.value = ''; query = ''; render(); }
  });

  let resizeTimer = 0, lastW = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = Math.round(figure.getBoundingClientRect().width);
      if (!w || Math.abs(w - lastW) < 8) return;
      lastW = w; show(false);
    }, 120);
  });

  fetch('/math-labs/content.json').then(r => r.json()).then(async items => {
    buildData(items);
    buildLegend();
    buildList();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    makeNodes();
    view = viewFromURL();
    history.replaceState({ kg: view }, '', location.href);
    updateCrumbs();
    lastW = Math.round(figure.getBoundingClientRect().width);
    if (lastW) show(false); else render();
    ro.observe(figure);
    root.classList.add('is-ready');
  }).catch(err => { status.textContent = T.failed; console.error(err); });
})();
