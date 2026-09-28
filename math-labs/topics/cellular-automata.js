'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // small seeded generator (mulberry32) so every random row, soup and braking sequence is reproducible
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- model (pure, checked by checks/cellular-automata.cjs) ---------- */
  // 1. elementary rules. The table is indexed by the neighbourhood 4a + 2b + c, so rule = sum table[k] 2^k.
  const ruleTable = (n) => Uint8Array.from({ length: 8 }, (_, k) => (n >> k) & 1);
  function stepRow(row, table) {
    const w = row.length, out = new Uint8Array(w);
    for (let i = 0; i < w; i++) out[i] = table[4 * row[(i - 1 + w) % w] + 2 * row[i] + row[(i + 1) % w]];
    return out;
  }
  // rows 0..steps from an initial row (a Uint8Array, or the width of a single-cell row)
  function evolve(rule, init, steps) {
    const table = ruleTable(rule);
    let row = typeof init === 'number' ? (() => { const r = new Uint8Array(init); r[init >> 1] = 1; return r; })() : Uint8Array.from(init);
    const rows = [row];
    for (let t = 0; t < steps; t++) { row = stepRow(row, table); rows.push(row); }
    return rows;
  }
  const randomRow = (w, seed, p = 0.5) => { const R = rng(seed); return Uint8Array.from({ length: w }, () => (R() < p ? 1 : 0)); };
  // the two symmetries of the rule space: reflection swaps a and c, complementation swaps 0 and 1 in inputs and outputs
  const mirrorRule = (n) => { let m = 0; for (let k = 0; k < 8; k++) { const a = (k >> 2) & 1, b = (k >> 1) & 1, c = k & 1; if ((n >> k) & 1) m |= 1 << (4 * c + 2 * b + a); } return m; };
  const complementRule = (n) => { let m = 0; for (let k = 0; k < 8; k++) if (!((n >> k) & 1)) m |= 1 << (7 - k); return m; };
  const equivalents = (n) => [n, mirrorRule(n), complementRule(n), mirrorRule(complementRule(n))];
  const canonicalRule = (n) => Math.min(...equivalents(n));
  const countClasses = () => new Set(Array.from({ length: 256 }, (_, n) => canonicalRule(n))).size;
  const lambda = (n) => ruleTable(n).reduce((s, b) => s + b, 0) / 8;
  const density = (row) => row.reduce((s, b) => s + b, 0) / row.length;
  // least period of the row sequence, if some row repeats an earlier one (then the whole future repeats)
  function rowPeriod(rows) {
    const seen = new Map();
    for (let t = 0; t < rows.length; t++) { const k = Array.from(rows[t]).join(''); if (seen.has(k)) return { from: seen.get(k), period: t - seen.get(k) }; seen.set(k, t); }
    return null;
  }

  // 2. Life-like rules on a torus. A rule is {B: Set, S: Set} of neighbour counts.
  const parseRule = (s) => { const m = /^B(\d*)\/S(\d*)$/.exec(s); return { B: new Set(m[1].split('').map(Number)), S: new Set(m[2].split('').map(Number)), name: s }; };
  const RULES = ['B3/S23', 'B36/S23', 'B2/S', 'B3678/S34678'].map(parseRule);
  function lifeStep(grid, W, H, rule) {
    const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      const ym = ((y - 1 + H) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const xm = (x - 1 + W) % W, xp = (x + 1) % W;
        const n = grid[ym + xm] + grid[ym + x] + grid[ym + xp] + grid[y0 + xm] + grid[y0 + xp] + grid[yp + xm] + grid[yp + x] + grid[yp + xp];
        out[y0 + x] = grid[y0 + x] ? (rule.S.has(n) ? 1 : 0) : (rule.B.has(n) ? 1 : 0);
      }
    }
    return out;
  }
  const population = (grid) => { let s = 0; for (let i = 0; i < grid.length; i++) s += grid[i]; return s; };
  const PATTERNS = {
    glider: ['.O.', '..O', 'OOO'],
    rpentomino: ['.OO', 'OO.', '.O.'],
    gun: ['........................O...........', '......................O.O...........', '............OO......OO............OO', '...........O...O....OO............OO', 'OO........O.....O...OO..............', 'OO........O...O.OO....O.O...........', '..........O.....O.......O...........', '...........O...O....................', '............OO......................'],
    block: ['OO', 'OO'], blinker: ['OOO'],
  };
  // place a pattern (rows of . and O) with its top-left corner at (x, y) on an empty W x H grid, or onto a given grid
  function placePattern(rows, W, H, x, y, grid) {
    const g = grid || new Uint8Array(W * H);
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'O') g[((y + j) % H) * W + ((x + i) % W)] = 1; });
    return g;
  }
  const bbox = (grid, W, H) => { let x0 = W, x1 = -1, y0 = H, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? null : [x0, x1, y0, y1]; };

  // 3. Langton's ant on an N x N grid (finite; the caller keeps the ant away from the edge). Headings: 0 east, 1 north, 2 west, 3 south.
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  function antState(N, start = 0, seed = 5) {
    const grid = new Uint8Array(N * N), c = N >> 1;
    let black = 0;
    if (start === 1) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { grid[(c + j) * N + c + i] = 1; black++; }
    if (start === 2) { const R = rng(seed); for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (R() < 0.5) { grid[(c + j) * N + c + i] = 1; black++; } }
    const s = { grid, N, x: c, y: c, d: 1, t: 0, black, hist: [], step(n) {
      for (let k = 0; k < n; k++) {
        const idx = s.y * N + s.x;
        if (grid[idx]) { s.d = (s.d + 1) & 3; grid[idx] = 0; s.black--; } else { s.d = (s.d + 3) & 3; grid[idx] = 1; s.black++; }
        s.x += DX[s.d]; s.y += DY[s.d]; s.t++;
        if (s.x < 1 || s.y < 1 || s.x >= N - 1 || s.y >= N - 1) return false;
      }
      return true;
    } };
    return s;
  }
  // run the ant for `steps` steps: positions every step, black counts every `every` steps, and the step at which the highway begins
  function antRun(steps, N = 160, start = 0, every = 50) {
    const s = antState(N, start), pos = new Int16Array(2 * (steps + 1)), counts = [s.black];
    pos[0] = s.x; pos[1] = s.y;
    let x0 = s.x, x1 = s.x, y0 = s.y, y1 = s.y, cut = steps;
    for (let t = 1; t <= steps; t++) {
      if (!s.step(1)) { cut = t - 1; break; }
      pos[2 * t] = s.x; pos[2 * t + 1] = s.y;
      if (s.x < x0) x0 = s.x; if (s.x > x1) x1 = s.x; if (s.y < y0) y0 = s.y; if (s.y > y1) y1 = s.y;
      if (t % every === 0) counts.push(s.black);
    }
    return { pos, counts, every, box: [x0, x1, y0, y1], steps: cut, highway: highwayStart(pos, cut) };
  }
  // the highway that persists to the end of the run: the signed displacement over the last 104 steps is (±2, ±2), and the earliest step from
  // which every later 104-step window has that same displacement. A highway that later collides with debris and dissolves does not count.
  function highwayStart(pos, steps, periods = 3) {
    if (steps < 104 * periods) return null;
    const d = (t) => [pos[2 * (t + 104)] - pos[2 * t], pos[2 * (t + 104) + 1] - pos[2 * t + 1]];
    const [dx, dy] = d(steps - 104);
    if (Math.abs(dx) !== 2 || Math.abs(dy) !== 2) return null;
    let t = steps - 104;
    while (t > 0) { const [ex, ey] = d(t - 1); if (ex !== dx || ey !== dy) break; t--; }
    return steps - t >= 104 * periods ? t : null;
  }

  // 4. traffic on a ring. Rule 184: a car moves iff the cell ahead is empty. Nagel-Schreckenberg with v_max = 1: a car that could move brakes with probability p.
  function trafficStep(row, p = 0, R = null) {
    const w = row.length, out = new Uint8Array(w); let moved = 0;
    for (let i = 0; i < w; i++) {
      if (!row[i]) continue;
      const ahead = (i + 1) % w;
      if (!row[ahead] && !(p > 0 && R() < p)) { out[ahead] = 1; moved++; } else out[i] = 1;
    }
    return { row: out, moved };
  }
  const rule184Step = (row) => trafficStep(row).row;
  // cars placed at random with the exact count round(rho L)
  function trafficInit(Lr, rho, seed) {
    const n = Math.round(rho * Lr), R = rng(seed), idx = Array.from({ length: Lr }, (_, i) => i);
    for (let i = Lr - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const row = new Uint8Array(Lr); for (let k = 0; k < n; k++) row[idx[k]] = 1;
    return row;
  }
  // rows 0..T and the flow (cars advancing per cell per step) averaged over the last `measure` steps
  function simulateTraffic(Lr, rho, p, T, seed = 3, measure = 100) {
    let row = trafficInit(Lr, rho, seed); const rows = [row], R = rng(seed + 11); let mv = 0;
    for (let t = 1; t <= T; t++) { const s = trafficStep(row, p, R); row = s.row; rows.push(row); if (t > T - measure) mv += s.moved; }
    return { rows, flow: mv / (measure * Lr), cars: population(rows[0]) };
  }
  const tent = (rho) => Math.min(rho, 1 - rho);

  (window.LabModels = window.LabModels || {})['cellular-automata'] = { rng, ruleTable, stepRow, evolve, randomRow, mirrorRule, complementRule, equivalents, canonicalRule, countClasses, lambda, density, rowPeriod, parseRule, RULES, lifeStep, population, PATTERNS, placePattern, bbox, antState, antRun, highwayStart, trafficStep, rule184Step, trafficInit, simulateTraffic, tent };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const clickable = (f, elm, fn, label) => { elm.style.cursor = 'pointer'; elm.setAttribute('tabindex', '0'); elm.setAttribute('role', 'button'); elm.setAttribute('aria-label', label); elm.addEventListener('click', fn); elm.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); elm.style.pointerEvents = 'all'; f.layers.ui.appendChild(elm); };

  /* ---------- 1. the 256 elementary rules ---------- */
  D['elementary-ca'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, rule = v.rule, R = v.rows, W = 2 * R + 1;
      const key = `${rule}|${v.init}|${R}`;
      if (st.key !== key) { st.rows = evolve(rule, v.init === 0 ? W : randomRow(W, 17), R); st.key = key; }
      const rows = st.rows, col = L.colours();
      // the rule as eight icons: neighbourhood 111 first, output below; click an output to flip that bit
      L.h('p', 'lab-cap', ctx.host, T(`Rule ${rule}: the eight neighbourhoods and their outputs. Click an output cell to change the rule.`, `ルール ${rule}：八つの近傍とその出力です。出力のセルをクリックするとルールが変わります。`));
      const icon = L.fig(ctx.host, { x: [0, 96], y: [0, 9], axes: false, grid: false, equal: true, maxH: 90 });
      const cell = (x, y, on, o = {}) => icon.rect(x, y, 2.6, 2.6, Object.assign({ c: 'muted', w: 0.8, fill: on ? 'ink' : 'plate', fo: on ? 0.95 : 1, layer: 'main' }, o));
      for (let k = 7; k >= 0; k--) {
        const x = 2 + (7 - k) * 12, a = (k >> 2) & 1, b = (k >> 1) & 1, c = k & 1, out = (rule >> k) & 1;
        cell(x, 5.4, a); cell(x + 2.8, 5.4, b); cell(x + 5.6, 5.4, c);
        const r = cell(x + 2.8, 1.2, out, { c: out ? 'hl' : 'muted', w: out ? 1.4 : 0.8, fill: out ? 'hl' : 'plate', fo: out ? 0.9 : 1 });
        const hit = L.el('rect', { x: icon.X(x) - 2, y: icon.Y(9), width: icon.X(x + 8.4) - icon.X(x) + 4, height: icon.Y(0) - icon.Y(9), fill: 'transparent' });
        clickable(icon, hit, () => ctx.set('rule', rule ^ (1 << k)), T(`Neighbourhood ${a}${b}${c} gives ${out}; click to make it ${1 - out}`, `近傍 ${a}${b}${c} の出力は ${out} です。クリックで ${1 - out} にします`));
        icon.text(x + 4.2, 8.9, `${a}${b}${c}`, { small: true, c: 'muted', dy: -1 });
        void r;
      }
      // the space-time diagram, time downwards
      L.h('p', 'lab-cap', ctx.host, T(`Space–time diagram, ${W} cells wide, time running down ${R} rows.`, `時空図です。幅 ${W} セル、時間は下向きに ${R} 行進みます。`));
      const f = L.fig(ctx.host, { x: [0, W], y: [0, R + 1], axes: true, grid: false, xlabel: T('cell i', 'セル i'), ylabel: T('time t ↓', '時間 t ↓'), ticksY: [[R + 1, '0'], [R + 1 - Math.round(R / 2), String(Math.round(R / 2))], [1, String(R)]], aspect: clamp((R + 1) / W * 1.15, 0.3, 0.62), maxH: 420 });
      const ink = col.ink, plate = col.plate, dim = mixc(plate, col.muted, 0.12);
      const paint = (upto) => f.raster((x, y) => { const t = R + 1 - y, ti = Math.floor(t), i = Math.floor(x); if (ti > upto) return dim; const r = rows[clamp(ti, 0, R)]; return r && r[clamp(i, 0, W - 1)] ? ink : plate; }, { res: 1, pixel: true });
      paint(R);
      const RATE = Math.max(12, R / 6);
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const k = Math.min(R, Math.floor(t * RATE)); paint(k); lab.textContent = T(`t = ${k}`, `t = ${k}`); if (k >= R) return false; }, { autoplay: false, once: true, initialT: R / RATE + 1, duration: R / RATE + 1, playLabel: T('Play the rows', '行を再生') });
      const eq = equivalents(rule), canon = canonicalRule(rule), per = rowPeriod(rows), last = rows[R];
      const bits = Array.from({ length: 8 }, (_, i) => (rule >> (7 - i)) & 1).join('');
      L.legend(ctx.host, [{ c: 'ink', kind: 'fill', label: T('cell = 1', 'セル = 1') }, { c: 'hl', kind: 'fill', label: T('output 1 in the rule icons', 'ルールのアイコンで出力が 1') }]);
      ctx.readout([
        { k: T('rule', 'ルール'), v: `${rule} = ${bits}₂`, tone: 'key' },
        { k: T('class representative', '同値類の代表'), v: canon === rule ? T(`${canon} (itself)`, `${canon}（自身）`) : String(canon) },
        { k: T('mirror, complement, both', '鏡映、補集合、両方'), v: `${eq[1]}, ${eq[2]}, ${eq[3]}` },
        { k: 'λ', v: `${lambda(rule) * 8}/8 = ${fmt(lambda(rule), 3)}` },
        { k: T('density of the last row', '最後の行の密度'), v: fmt(density(last), 3) },
        { k: T('row period', '行の周期'), v: per ? T(`${per.period} from t = ${per.from}`, `${per.period}、t = ${per.from} から`) : T(`none within ${R} rows`, `${R} 行の範囲では見つからず`), tone: per ? 'good' : undefined },
      ], [30, 86, 135, 149].includes(rule)
        ? T('Rule 30 and its three equivalents: from a single cell the left edge is regular but the centre column passes every statistical test for randomness that has been tried, which is why rule 30 was used as a random number generator.', 'ルール 30 とその三つの同値なルールです。一つのセルから始めると左端は規則的ですが、中央の列はこれまで試されたあらゆるランダム性の統計検定を通過します。ルール 30 が乱数生成器として使われたのはそのためです。')
        : [90, 165].includes(rule) ? T('Rule 90 is addition mod 2 of the two neighbours, so the diagram is Pascal’s triangle mod 2: a Sierpinski triangle, with 2^s(t) cells alive at time t.', 'ルール 90 は両隣の mod 2 での和なので、図はパスカルの三角形 mod 2、つまりシェルピンスキーの三角形です。時刻 t には 2^s(t) 個のセルが生きています。')
          : [110, 124, 137, 193].includes(rule) ? T('Rule 110 is the simplest rule proved Turing complete (Cook, 2004): the moving structures are particles whose collisions carry out computation on a periodic background.', 'ルール 110 はチューリング完全であることが証明された最も単純なルールです（クック、2004 年）。動く構造は粒子で、その衝突が周期的な背景の上で計算を行います。')
            : per ? T(`The rows repeat with period ${per.period}, so this rule from this start is periodic: everything after row ${per.from} is a copy of what came before.`, `行は周期 ${per.period} で繰り返すので、この初期行からのこのルールは周期的です。第 ${per.from} 行より後はすべて前の写しです。`)
              : T('No row repeats within the diagram. The four equivalent rule numbers give the same diagram up to a left-right flip or a swap of black and white.', '図の範囲で繰り返す行はありません。四つの同値なルール番号は、左右の反転か白黒の入れ替えを除いて同じ図を与えます。'));
    },
  };

  /* ---------- 2. Conway's Game of Life ---------- */
  const GW = 64, GH = 40, MAXGEN = 2000;
  const RULE_NAME = [['Life', 'ライフ'], ['HighLife', 'ハイライフ'], ['Seeds', 'Seeds'], ['Day & Night', 'Day & Night']];
  function baseGrid(pattern) {
    if (pattern === 0) return placePattern(PATTERNS.glider, GW, GH, 6, 6);
    if (pattern === 1) return placePattern(PATTERNS.rpentomino, GW, GH, 30, 18);
    if (pattern === 2) return placePattern(PATTERNS.gun, GW, GH, 4, 4);
    if (pattern === 3) { const R = rng(23), g = new Uint8Array(GW * GH); for (let y = 10; y < 30; y++) for (let x = 20; x < 44; x++) g[y * GW + x] = R() < 0.35 ? 1 : 0; return g; }
    return new Uint8Array(GW * GH);
  }
  D['game-of-life'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, rule = RULES[v.rule], col = L.colours();
      if (st.pattern !== v.pattern) { st.base = baseGrid(v.pattern); st.pattern = v.pattern; st.gens = null; }
      if (!st.gens || st.ruleIdx !== v.rule) { st.gens = [st.base]; st.pops = [population(st.base)]; st.ruleIdx = v.rule; }
      const upto = (g) => { while (st.gens.length <= g && st.gens.length <= MAXGEN) { const n = lifeStep(st.gens[st.gens.length - 1], GW, GH, rule); st.gens.push(n); st.pops.push(population(n)); } return st.gens[Math.min(g, st.gens.length - 1)]; };
      upto(v.gen);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The ${GW} × ${GH} torus. Click a cell to toggle it (this restarts the count at generation 0).`, `${GW} × ${GH} のトーラスです。セルをクリックすると反転します（世代は 0 に戻ります）。`));
      const f = L.fig(c1, { x: [0, GW], y: [0, GH], equal: true, axes: false, maxH: 400 });
      const dead = col.plate, faint = mixc(col.plate, col.muted, 0.16), old = col.c1, young = col.hl;
      const paintGrid = (g, prev) => f.raster((x, y) => { const i = Math.floor(x), j = GH - 1 - Math.floor(y); const k = clamp(j, 0, GH - 1) * GW + clamp(i, 0, GW - 1); if (!g[k]) return (i + j) % 2 ? dead : faint; return prev && !prev[k] ? young : old; }, { res: 1, pixel: true });
      const drawGen = (g) => { const grid = upto(g), prev = g > 0 ? st.gens[g - 1] : null; paintGrid(grid, prev); return { grid, prev }; };
      // right: population against generation
      L.h('p', 'lab-cap', c2, T('Population against generation. The gold point is the generation shown.', '世代に対する個体数です。金色の点が表示中の世代です。'));
      const gmax = Math.max(60, v.gen + 20), pmax = Math.max(20, ...st.pops.slice(0, v.gen + 1)) * 1.15;
      const g = L.fig(c2, { x: [0, gmax], y: [0, pmax], aspect: 0.7, xlabel: T('generation', '世代'), ylabel: T('live cells', '生きたセル'), maxH: 400 });
      const drawPop = (gen) => { g.clear('main'); g.clear('over'); const n = Math.min(gen, st.pops.length - 1); g.line(st.pops.slice(0, n + 1).map((p, i) => [i, p]), { c: 'c1', w: 2, layer: 'main' }); g.dot(n, st.pops[n], { c: 'hl', r: 5.5, layer: 'over' }); g.text(n, st.pops[n], String(st.pops[n]), { c: 'hl', dx: n > 0.8 * gmax ? -10 : 10, dy: -10, anchor: n > 0.8 * gmax ? 'end' : 'start', layer: 'over' }); };
      const show = (gen) => { const { grid, prev } = drawGen(gen); drawPop(gen); const pop = population(grid); let births = 0, deaths = 0; if (prev) for (let k = 0; k < grid.length; k++) { if (grid[k] && !prev[k]) births++; if (!grid[k] && prev[k]) deaths++; } return { pop, births, deaths, grid }; };
      let cur = v.gen, info = show(cur);
      // clicking toggles a cell of the current grid, which becomes the new generation 0
      f.svg.addEventListener('pointerdown', (e) => {
        const r = f.svg.getBoundingClientRect(); const x = f.IX((e.clientX - r.left) * f.W / r.width), y = f.IY((e.clientY - r.top) * f.H / r.height);
        const i = Math.floor(x), j = GH - 1 - Math.floor(y); if (i < 0 || j < 0 || i >= GW || j >= GH) return;
        const base = Uint8Array.from(st.gens[Math.min(cur, st.gens.length - 1)]); base[j * GW + i] ^= 1;
        st.base = base; st.gens = null; ctx.set('gen', 0);
      });
      const readout = (gen, inf) => ctx.readout([
        { k: T('rule', 'ルール'), v: `${T(...RULE_NAME[v.rule])} ${rule.name}` },
        { k: T('generation', '世代'), v: String(gen), tone: 'key' },
        { k: T('population', '個体数'), v: String(inf.pop), tone: 'good' },
        { k: T('births, deaths this step', 'この世代の誕生、死亡'), v: gen ? `${inf.births}, ${inf.deaths}` : T('none yet', 'まだなし') },
        { k: T('bounding box', '外接する箱'), v: (() => { const b = bbox(inf.grid, GW, GH); return b ? `${b[1] - b[0] + 1} × ${b[3] - b[2] + 1}` : T('empty', '空'); })() },
      ], [
        T('The glider: every four generations its five cells reappear one row down and one column right, speed c/4. On this torus it returns to its starting cells after 1280 generations.', 'グライダーです。四世代ごとに五つのセルが一行下、一列右に再び現れます。速さは c/4 です。このトーラスでは 1280 世代で出発点のセルに戻ってきます。'),
        T('The R-pentomino: five cells that keep growing for over a thousand generations on the infinite plane. Here the torus folds the debris back on itself.', 'R ペントミノです。無限平面では千世代以上も成長し続ける五つのセルです。ここではトーラスが残骸を自分自身の上に折り返します。'),
        T('Gosper’s gun: period 30. Each new glider is born from the collision of the two shuttles; on the torus the gliders eventually return and destroy the gun.', 'ゴスパーの銃です。周期 30 で、新しいグライダーは二つのシャトルの衝突から生まれます。トーラス上ではグライダーがやがて戻ってきて銃を壊します。'),
        T('A random soup at density 0.35 collapses quickly under Life into still lifes, blinkers and a few gliders; under Seeds nothing survives one generation, so the population is pure births.', '密度 0.35 のランダムなスープはライフのもとで速やかに崩れ、固定物体、ブリンカー、いくつかのグライダーになります。Seeds では一世代も生き残るものがないので、個体数はすべて誕生によるものです。'),
        T('Draw a pattern by clicking cells, then press Play. Three cells in a row make a blinker; four in a square never change.', 'セルをクリックしてパターンを描き、再生を押してください。横に三つでブリンカー、正方形に四つなら決して変わりません。'),
      ][v.pattern]);
      readout(cur, info);
      st.anim = L.animator(ctx.host, (dt, t, lab) => {
        const gen = v.gen + Math.floor(t * 8);
        if (gen !== cur) { cur = Math.min(gen, MAXGEN); info = show(cur); readout(cur, info); }
        lab.textContent = T(`generation ${cur}`, `第 ${cur} 世代`);
        if (cur >= MAXGEN || (cur > v.gen && info.pop === 0)) return false;
      }, { autoplay: false, initialT: 0, playLabel: T('Play', '再生') });
      L.legend(ctx.host, [{ c: 'c1', kind: 'fill', label: T('alive', '生きている') }, { c: 'hl', kind: 'fill', label: T('born this generation', 'この世代に誕生') }]);
    },
  };

  /* ---------- 3. Langton's ant ---------- */
  const AN = 460, AMAX = 12000;
  D['langtons-ant'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, col = L.colours();
      if (st.start !== v.start) { st.run = antRun(AMAX, AN, v.start); st.start = v.start; st.ant = null; }
      const run = st.run, steps = Math.min(v.steps, run.steps);
      const [bx0, bx1, by0, by1] = run.box, m = 6, X0 = bx0 - m, X1 = bx1 + m + 1, Y0 = by0 - m, Y1 = by1 + m + 1;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The grid after the chosen number of steps. Black cells are black; the ant is the gold point with its heading.', '選んだステップ数のあとの格子です。黒いセルは黒く、アリは向きを示す金色の点です。'));
      const f = L.fig(c1, { x: [X0, X1], y: [Y0, Y1], equal: true, axes: false, maxH: 430 });
      const ink = col.ink, plate = col.plate, faint = mixc(plate, col.muted, 0.1);
      const ensure = (n) => { if (!st.ant || st.ant.t > n) st.ant = antState(AN, v.start); if (st.ant.t < n) st.ant.step(n - st.ant.t); return st.ant; };
      const paint = (n) => {
        const a = ensure(n), g = a.grid;
        f.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i >= AN || j >= AN) return plate; return g[j * AN + i] ? ink : ((i + j) % 2 ? plate : faint); }, { res: 1, pixel: true });
        f.clear('over');
        // the last 300 steps of the path, fading, and the ant
        const n0 = Math.max(0, n - 300), pts = []; for (let t = n0; t <= n; t++) pts.push([run.pos[2 * t] + 0.5, run.pos[2 * t + 1] + 0.5]);
        if (pts.length > 1) f.line(pts, { c: 'hl', w: 1.2, op: 0.55, layer: 'over' });
        f.dot(a.x + 0.5, a.y + 0.5, { c: 'hl', r: 5, layer: 'over' });
        f.arrow([a.x + 0.5, a.y + 0.5], [a.x + 0.5 + 2.2 * DX[a.d], a.y + 0.5 + 2.2 * DY[a.d]], { c: 'hl', w: 1.6, layer: 'over' });
        return a;
      };
      // right: black cells against steps
      L.h('p', 'lab-cap', c2, T('Black cells against steps. The vertical band marks where the highway begins.', 'ステップ数に対する黒いセルの数です。縦の帯は高速道路が始まる位置です。'));
      const cmax = Math.max(...run.counts) * 1.12;
      const g = L.fig(c2, { x: [0, AMAX + 700], y: [0, cmax], aspect: 0.7, xlabel: T('steps', 'ステップ数'), ylabel: T('black cells', '黒いセル'), maxH: 430, ticksX: [[0, '0'], [4000, '4000'], [8000, '8000'], [12000, '12000']] });
      if (run.highway !== null) { g.rect(run.highway, 0, AMAX - run.highway, cmax, { c: 'c2', fill: 'c2', fo: 0.08, nostroke: true, layer: 'under' }); g.vline(run.highway, { c: 'c2', w: 1.2, dash: '4 3', layer: 'under' }); g.text(run.highway, cmax * 0.95, T(`highway from step ${run.highway}`, `${run.highway} 歩目から高速道路`), { small: true, c: 'c2', anchor: run.highway > AMAX * 0.6 ? 'end' : 'start', dx: run.highway > AMAX * 0.6 ? -6 : 6, layer: 'over' }); }
      g.line(run.counts.map((c, i) => [i * run.every, c]), { c: 'c1', w: 2, layer: 'main' });
      const mark = (n, black) => { g.clear('over'); g.dot(n, black, { c: 'hl', r: 5.5, layer: 'over' }); };
      g.handle(steps, run.counts[Math.min(run.counts.length - 1, Math.round(steps / run.every))], { c: 'hl', r: 7, axis: 'x', snap: 50, label: T('Steps', 'ステップ数'), bounds: [0, run.steps, 0, cmax], onDrag: (x) => ctx.set('steps', Math.round(x / 50) * 50) });
      const readout = (n, a) => {
        const hw = run.highway, on = hw !== null && n >= hw;
        ctx.readout([
          { k: T('steps', 'ステップ数'), v: n.toLocaleString(), tone: 'key' },
          { k: T('black cells', '黒いセル'), v: String(a.black), tone: 'good' },
          { k: T('parity check', '偶奇の確認'), v: (a.black - run.counts[0]) % 2 === n % 2 ? T('black − start ≡ steps (mod 2)', '黒 − 初期 ≡ 歩数 (mod 2)') : '?' },
          { k: T('ant, from the start', 'アリの位置（出発点から）'), v: `(${a.x - (AN >> 1)}, ${a.y - (AN >> 1)})` },
          { k: T('highway', '高速道路'), v: hw === null ? T('not within 12,000 steps', '12,000 歩以内には現れず') : on ? T(`since step ${hw}`, `${hw} 歩目から`) : T(`begins at step ${hw}`, `${hw} 歩目に始まります`), tone: on ? 'good' : 'warn' },
        ], on
          ? T('On the highway the ant repeats a 104-step cycle, moving two cells diagonally and leaving 12 new black cells each time: the band grows without end, and the count of black cells climbs at a fixed slope.', '高速道路の上でアリは 104 歩の周期を繰り返し、そのたびに斜めに二マス進んで 12 個の新しい黒いセルを残します。帯は際限なく伸び、黒いセルの数は一定の傾きで増えていきます。')
          : T('Before the highway the ant’s track looks disordered, and the count of black cells wanders with no trend. Nothing in the picture predicts that a highway is coming.', '高速道路の前のアリの軌跡は無秩序に見え、黒いセルの数は傾向なくさまよいます。図の中には高速道路が来ることを予告するものは何もありません。'));
      };
      readout(steps, paint(steps));
      mark(steps, ensure(steps).black);
      const RATE = Math.max(400, steps / 18);
      st.anim = L.animator(ctx.host, (dt, t, lab) => { const n = Math.min(steps, Math.floor(t * RATE)); const a = paint(n); mark(n, a.black); readout(n, a); lab.textContent = T(`step ${n.toLocaleString()}`, `${n.toLocaleString()} 歩`); if (n >= steps) return false; }, { autoplay: false, once: true, initialT: steps / RATE + 1, duration: steps / RATE + 1, playLabel: T('Replay from the start', '最初から再生') });
      L.legend(ctx.host, [{ c: 'ink', kind: 'fill', label: T('black cell', '黒いセル') }, { c: 'hl', kind: 'dot', label: T('the ant, and its last 300 steps', 'アリと直近 300 歩') }, { c: 'c1', label: T('black cells over time', '黒いセルの数の推移') }]);
    },
  };

  /* ---------- 4. rule 184 as traffic ---------- */
  const RL = 200, TRANSIENT = 300, MEASURE = 100, PBRAKE = 0.3;
  D['rule-184-traffic'] = {
    render(ctx, v) {
      const st = ctx.state, col = L.colours(), p = v.model === 1 ? PBRAKE : 0, S = v.steps;
      const key = `${v.rho}|${v.model}|${S}`;
      if (st.key !== key) { st.sim = simulateTraffic(RL, v.rho, p, Math.max(S, TRANSIENT) + MEASURE, 3, MEASURE); st.key = key; }
      if (!st.curve || st.curveModel !== v.model) { st.curve = L.seq(19, (i) => { const r = 0.05 * (i + 1); return [r, simulateTraffic(RL, r, p, TRANSIENT + MEASURE, 3, MEASURE).flow]; }); st.curveModel = v.model; }
      const sim = st.sim, rows = sim.rows;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Space–time diagram of the ring of ${RL} cells, time downwards from a random start. Cars are dark; stopped cars are orange.`, `${RL} セルの環の時空図です。ランダムな初期状態から時間は下向きに進みます。車は濃く、止まった車は橙色です。`));
      const f = L.fig(c1, { x: [0, RL], y: [0, S + 1], axes: true, grid: false, xlabel: T('cell', 'セル'), ylabel: T('time ↓', '時間 ↓'), ticksY: [[S + 1, '0'], [1, String(S)]], aspect: clamp((S + 1) / RL * 1.3, 0.35, 0.62), maxH: 400 });
      const car = col.ink, stopped = col.c2, plate = col.plate;
      f.raster((x, y) => { const t = clamp(Math.floor(S + 1 - y), 0, S), i = clamp(Math.floor(x), 0, RL - 1); const r = rows[t]; if (!r[i]) return plate; const nxt = rows[Math.min(t + 1, rows.length - 1)]; return nxt[i] ? stopped : car; }, { res: 1, pixel: true });
      L.h('p', 'lab-cap', c2, T('The fundamental diagram: flow against density, measured over the last 100 steps after a transient of 300. Drag the gold point.', '基本図です。300 ステップの過渡状態のあとの最後の 100 ステップで測った、密度に対する流量です。金色の点をドラッグしてください。'));
      const g = L.fig(c2, { x: [0, 1], y: [0, 0.56], aspect: 0.75, xlabel: T('density ρ', '密度 ρ'), ylabel: T('flow q', '流量 q'), maxH: 400 });
      g.line([[0, 0], [0.5, 0.5], [1, 0]], { c: 'c4', w: 1.6, dash: '5 3', layer: 'under' });
      g.line(st.curve, { c: 'c1', w: 2.2, layer: 'main' });
      st.curve.forEach(([r, q]) => g.dot(r, q, { c: 'c1', r: 3, layer: 'main' }));
      g.handle(v.rho, sim.flow, { c: 'hl', r: 7, axis: 'x', snap: 0.05, label: T('Density ρ', '密度 ρ'), bounds: [0.05, 0.95, 0, 0.56], onDrag: (x) => ctx.set('rho', Math.round(x * 20) / 20) });
      g.text(v.rho, sim.flow, `q = ${fmt(sim.flow, 3)}`, { c: 'hl', dx: v.rho > 0.6 ? -12 : 12, dy: -10, anchor: v.rho > 0.6 ? 'end' : 'start', layer: 'over' });
      g.text(0.5, 0.5, T('q = min(ρ, 1 − ρ)', 'q = min(ρ, 1 − ρ)'), { small: true, c: 'c4', dy: -10 });
      const last = rows[rows.length - 1], lastPrev = rows[rows.length - 2]; let stoppedN = 0; for (let i = 0; i < RL; i++) if (lastPrev[i] && last[i]) stoppedN++;
      L.legend(ctx.host, [{ c: 'ink', kind: 'fill', label: T('a car that moves next step', '次のステップで動く車') }, { c: 'c2', kind: 'fill', label: T('a car that waits', '待つ車') }, { c: 'c1', label: T('measured flow', '測定した流量') }, { c: 'c4', dash: true, label: T('rule 184 exactly: the tent', 'ルール 184 の厳密解：三角形') }]);
      const th = tent(v.rho);
      ctx.readout([
        { k: 'ρ', v: `${fmt(v.rho, 2)} (${sim.cars} ${T('cars', '台')})`, tone: 'key' },
        { k: T('measured flow q', '測定した流量 q'), v: fmt(sim.flow, 4), tone: 'good' },
        { k: 'min(ρ, 1 − ρ)', v: fmt(th, 4) },
        { k: T('mean speed q/ρ', '平均速度 q/ρ'), v: fmt(sim.flow / v.rho, 3) },
        { k: T('cars stopped at the last step', '最後のステップで止まった車'), v: `${stoppedN} / ${sim.cars}`, tone: stoppedN ? 'warn' : undefined },
      ], v.model === 0
        ? (v.rho < 0.5 ? T('Below ρ = 1/2 the initial jams dissolve within the transient: afterwards every car moves every step, the flow is exactly ρ and the space–time lines all slope the same way.', 'ρ = 1/2 未満では初期の渋滞は過渡状態のうちに解消します。その後はすべての車が毎ステップ動き、流量はちょうど ρ で、時空図の線はすべて同じ向きに傾きます。') : v.rho > 0.5 ? T('Above ρ = 1/2 it is the gaps that flow: every gap moves backwards every step, the flow is exactly 1 − ρ, and the dark bands are jams drifting left at one cell per step.', 'ρ = 1/2 を超えると流れるのは隙間です。すべての隙間が毎ステップ後ろへ動き、流量はちょうど 1 − ρ で、濃い帯は一ステップに一マスずつ左へ流れる渋滞です。') : T('At ρ = 1/2 the flow is maximal, 1/2: any arrangement other than strict alternation leaves some car or some gap waiting, and the transient sorts the cars into the alternating pattern.', 'ρ = 1/2 で流量は最大の 1/2 です。厳密に交互に並ぶ以外の配置では車か隙間のどれかが待たされ、過渡状態が車を交互の模様に整えます。'))
        : T('With random braking, a car that could move stays put with probability 0.3, so jams nucleate out of free flow and never fully dissolve: the measured flow lies below the tent everywhere and its peak moves to a lower density.', 'ランダムな減速があると、動けるはずの車が確率 0.3 でその場にとどまるので、渋滞は自由な流れの中から発生し、完全には解消しません。測定した流量はどこでも三角形の下にあり、その頂点はより低い密度へ移ります。'));
    },
  };
})();
