// Cellular automata: rule symmetries and the 88 classes, rule 90 as Pascal mod 2, rule 30's centre column, Life's glider, block and blinker, Gosper's gun period, Langton's ant parity and highway, and rule 184's exact fundamental diagram.
module.exports = (M, { ok, near }) => {
  // 1. rule numbering and symmetries
  ok(M.mirrorRule(30) === 86 && M.complementRule(30) === 135 && M.mirrorRule(M.complementRule(30)) === 149, 'rule 30 is equivalent to 86, 135, 149');
  ok(M.canonicalRule(124) === 110 && M.canonicalRule(193) === 110 && M.canonicalRule(137) === 110, 'the rule 110 class');
  ok(M.mirrorRule(M.mirrorRule(77)) === 77 && M.complementRule(M.complementRule(77)) === 77, 'the symmetries are involutions');
  ok(M.countClasses() === 88, 'Burnside: 88 equivalence classes');
  near(M.lambda(30), 4 / 8, 1e-12); near(M.lambda(0), 0, 1e-12); near(M.lambda(255), 1, 1e-12);
  // 2. rule 90 from a single cell is Pascal's triangle mod 2: 2^{s(t)} ones in row t
  { const rows = M.evolve(90, 129, 40); const s = (t) => t.toString(2).split('').filter((c) => c === '1').length;
    ok(rows.every((r, t) => r.reduce((a, b) => a + b, 0) === 2 ** s(t)), 'rule 90 row t has 2^s(t) ones'); }
  // rule 30's centre column (OEIS A051023) begins 1,1,0,1,1,1,0,0,1,1,0,0
  { const rows = M.evolve(30, 201, 12); ok(rows.map((r) => r[100]).join('') === '1101110011000', 'rule 30 centre column'); }
  // rule 204 is the identity and rule 51 is complementation; rule 184 is the traffic rule
  { const r = M.randomRow(50, 9); ok(Array.from(M.stepRow(r, M.ruleTable(204))).join('') === Array.from(r).join(''), 'rule 204 is the identity');
    ok(M.stepRow(r, M.ruleTable(51)).every((b, i) => b === 1 - r[i]), 'rule 51 complements');
    ok(Array.from(M.stepRow(r, M.ruleTable(184))).join('') === Array.from(M.rule184Step(r)).join(''), 'rule 184 is the traffic step'); }
  // a periodic row is detected with the right period: rule 90 on a width-8 ring from a single cell
  { const per = M.rowPeriod(M.evolve(90, 8, 40)); ok(per && per.period > 0 && per.period <= 16, 'rule 90 on a ring of 8 is periodic'); }
  // 3. Life: block still, blinker period 2, glider moves (1, 1) in 4 generations
  { const W = 24, H = 24, life = M.RULES[0], str = (g) => Array.from(g).join('');
    const block = M.placePattern(M.PATTERNS.block, W, H, 5, 5); ok(str(M.lifeStep(block, W, H, life)) === str(block), 'block is a still life');
    const bl = M.placePattern(M.PATTERNS.blinker, W, H, 5, 5), b1 = M.lifeStep(bl, W, H, life), b2 = M.lifeStep(b1, W, H, life);
    ok(str(b1) !== str(bl) && str(b2) === str(bl), 'blinker has period 2');
    let g = M.placePattern(M.PATTERNS.glider, W, H, 3, 3); for (let k = 0; k < 4; k++) g = M.lifeStep(g, W, H, life);
    ok(str(g) === str(M.placePattern(M.PATTERNS.glider, W, H, 4, 4)), 'glider translates by (1, 1) in 4 generations');
    ok(M.population(g) === 5, 'glider has 5 cells'); }
  // Gosper's gun: 36 cells, period 30, and 5 more cells for every glider fired
  { const W = 120, H = 120, life = M.RULES[0]; let g = M.placePattern(M.PATTERNS.gun, W, H, 10, 10); ok(M.population(g) === 36, 'the gun has 36 cells');
    for (let k = 1; k <= 3; k++) { for (let i = 0; i < 30; i++) g = M.lifeStep(g, W, H, life); ok(M.population(g) === 36 + 5 * k, `after ${30 * k} generations: gun plus ${k} gliders`); } }
  // Seeds: every live cell dies each generation
  { const W = 20, H = 20, g = M.placePattern(M.PATTERNS.block, W, H, 5, 5), n = M.lifeStep(g, W, H, M.RULES[2]); ok(n[5 * W + 5] === 0 && n[6 * W + 6] === 0, 'Seeds kills every live cell'); }
  // 4. Langton's ant: parity, the highway after about 10,000 steps with period 104, and 12 black cells per period
  { const run = M.antRun(12000, 200, 0); ok(run.steps === 12000, 'the ant stays inside the 200-grid for 12,000 steps');
    ok(run.counts.every((c, i) => c % 2 === (i * run.every) % 2), 'black cells have the parity of the step count');
    ok(run.highway !== null && run.highway > 9000 && run.highway < 10500, 'the highway begins near step 10,000');
    const t = run.highway + 208, dx = run.pos[2 * (t + 104)] - run.pos[2 * t], dy = run.pos[2 * (t + 104) + 1] - run.pos[2 * t + 1]; ok(Math.abs(dx) === 2 && Math.abs(dy) === 2, 'the highway advances (2, 2) per 104 steps');
    const a = M.antState(200, 0); a.step(11000); const b1 = a.black; a.step(104); ok(a.black - b1 === 12, '12 new black cells per highway period');
    const s = M.antState(200, 0); s.step(1); ok(s.black === 1 && s.x === 101 && s.y === 100, 'first step: turn right from north, paint, move'); }
  // 5. rule 184: flow is exactly min(rho, 1 - rho) after the transient, and cars are conserved
  for (const rho of [0.2, 0.35, 0.5, 0.65, 0.9]) { const s = M.simulateTraffic(200, rho, 0, 400, 3, 100); near(s.flow, M.tent(rho), 1e-12); ok(s.rows.every((r) => M.population(r) === s.cars), 'cars conserved'); }
  // a jam recedes at one cell per step: a block of 5 cars loses its rear car each step
  { let r = new Uint8Array(40); for (let i = 10; i < 15; i++) r[i] = 1; r = M.rule184Step(r); ok(r[10] === 1 && r[13] === 1 && r[14] === 0 && r[15] === 1, 'the lead car moves on and the downstream end of the jam moves back one cell'); }
  // random braking lowers the flow below the tent
  { const s = M.simulateTraffic(200, 0.4, 0.3, 400, 3, 100); ok(s.flow < M.tent(0.4) - 0.02, 'braking reduces the flow'); }
};
