'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const supN = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const mod = (a, n) => ((a % n) + n) % n;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  // Vertex position i of the regular n-gon, vertex 0 at the top, numbered anticlockwise.
  const vpos = (i, n, R = 1) => { const a = Math.PI / 2 + L.TAU * i / n; return [R * Math.cos(a), R * Math.sin(a)]; };
  // Element r^m s^e of D_n, acting on vertex positions by i -> (e ? -i : i) + m.
  const name = (m, e) => (m === 0 ? (e ? 's' : 'e') : 'r' + (m === 1 ? '' : supN(m)) + (e ? 's' : ''));
  const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const flip = ([x, y], s) => [x * Math.cos(Math.PI * s), y];
  const ease = (s) => { s = L.clamp(s, 0, 1); return s < 0.5 ? 2 * s * s : 1 - 2 * (1 - s) ** 2; };
  // A small asymmetric flag that rides on the polygon, so a reflection is visible even when the outline is not.
  // Figure labels here are plain Unicode, drawn in their own colours; keep the page's notation pass off them.
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const FLAG = [[0, 0.1], [0, 0.7], [-0.36, 0.57], [0, 0.44]];

  D.compose = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = Math.round(v.n), k = mod(Math.round(v.k), n), step = L.TAU / n;
      const row = L.h('div', 'lab-row', ctx.host);
      const panels = [
        { cap: T(`rᵏ ∘ s: reflect first, then rotate ${k} step${k === 1 ? '' : 's'}`, `rᵏ ∘ s：先に反転し、次に ${k} ステップ回転`), first: 's' },
        { cap: T(`s ∘ rᵏ: rotate ${k} step${k === 1 ? '' : 's'} first, then reflect`, `s ∘ rᵏ：先に ${k} ステップ回転し、次に反転`), first: 'r' },
      ].map((p) => {
        const col = L.h('div', 'lab-col', row);
        L.h('p', 'lab-cap', col, p.cap);
        const f = fig(col, { axes: false, x: [-1.42, 1.42], y: [-1.36, 1.42], equal: true, maxH: 330 });
        const out = L.seq(n + 1, (i) => vpos(i, n));
        f.poly(out, { c: 'muted', fo: 0.07, w: 1.6, layer: 'under' });
        f.line([[0, -1.3], [0, 1.3]], { c: 'c2', w: 1.3, dash: '6 5', op: 0.8, layer: 'under' });
        f.text(0, -1.3, T('mirror of s', 's の鏡'), { small: true, c: 'c2', dx: 6, dy: -2, anchor: 'start' });
        L.seq(n, (i) => { const q = vpos(i, n, 1.25); f.text(q[0], q[1], String(i), { small: true, c: 'muted', dy: 4, layer: 'under' }); });
        return Object.assign(p, { f });
      });
      const move = (pt, first, s1, s2) => (first === 's' ? rot(flip(pt, s1), k * step * s2) : flip(rot(pt, k * step * s1), s2));
      const draw = (t) => {
        const s1 = ease(t / 1.2), s2 = ease((t - 1.5) / 1.2);
        panels.forEach(({ f, first }) => {
          f.clear('main'); f.clear('over');
          f.poly(FLAG.map((p) => move(p, first, s1, s2)), { c: 'c4', fo: 0.55, w: 1.4 });
          for (let l = 0; l < n; l++) {
            const q = move(vpos(l, n), first, s1, s2);
            f.dot(q[0], q[1], { c: l === 0 ? 'hl' : 'c1', r: 12 });
            f.text(q[0], q[1], String(l), { c: 'plate', dy: 4.5 }).style.stroke = 'none';
          }
        });
      };
      const DUR = 2.8;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        draw(Math.min(t, DUR));
        label.textContent = t < DUR ? (t < 1.35 ? T('first step', '1段階目') : T('second step', '2段階目')) : '';
        return t < DUR;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Play both compositions', '2つの合成を再生') });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('Vertex labels, carried by the motion', '動きに運ばれる頂点ラベル') }, { kind: 'dot', c: 'hl', label: T('Label 0', 'ラベル 0') }, { kind: 'fill', c: 'c4', label: T('Flag: shows orientation', '旗：向きを示す') }, { c: 'muted', label: T('Grey numbers: fixed positions', '灰色の数字：固定された位置') }]);
      const A = mod(k, n), B = mod(-k, n);
      const reads = (m) => L.seq(n, (p) => mod(m - p, n)).join(' ');
      const same = A === B;
      ctx.readout([
        { k: 'rᵏ ∘ s', v: name(A, 1), tone: 'key' },
        { k: 's ∘ rᵏ', v: name(B, 1), tone: 'key' },
        { k: T('labels at positions 0…n−1', '位置 0…n−1 のラベル'), v: `${reads(A)}  |  ${reads(B)}` },
        { k: T('compositions', '合成'), v: same ? T('agree', '一致') : T('differ', '異なる'), tone: same ? 'good' : 'warn' },
      ], same ? T(`Here 2k = ${2 * k} is divisible by n = ${n}, so rᵏ = r⁻ᵏ and the two orders give the same symmetry.`, `ここでは 2k = ${2 * k} が n = ${n} で割り切れるので rᵏ = r⁻ᵏ となり、2つの順序は同じ対称になります。`)
        : T(`srᵏ = r⁻ᵏs, so the two results differ by r²ᵏ = ${name(mod(2 * k, n), 0)}.`, `srᵏ = r⁻ᵏs なので、2つの結果は r²ᵏ = ${name(mod(2 * k, n), 0)} だけ異なります。`) + (Math.round(v.k) >= n ? T(` (k is read modulo ${n}.)`, `（k は ${n} を法として読みます。）`) : ''));
    },
  };

  D.table = {
    render(ctx, v) {
      const n = Math.round(v.n), dih = v.group >= 0.5, m = dih ? 2 * n : n;
      const el = (i) => (i < n ? [i, 0] : [i - n, 1]);
      const idx = ([r, e]) => r + (e ? n : 0);
      const mul = (i, j) => { const [a, x] = el(i), [b, y] = el(j); return idx([mod(a + (x ? -b : b), n), x ^ y]); };
      const lab = (i) => (dih ? name(...el(i)) : String(i));
      const a = mod(Math.round(v.a), m), b = mod(Math.round(v.b), m);
      const ab = mul(a, b), ba = mul(b, a), inv = L.seq(m, (j) => j).find((j) => mul(a, j) === 0);
      const f = fig(ctx.host, { axes: false, x: [0, m + 1], y: [0, m + 1], equal: true, maxH: dih ? 560 : 420, pad: { l: 4, r: 4, t: 4, b: 4 } });
      const cellPx = f.X(1) - f.X(0), small = cellPx < 30;
      const Yr = (i) => m - i - 1; // row i occupies [Yr, Yr+1]
      const put = (x, y, s, o = {}) => { const t = f.text(x + 0.5, y + 0.5, s, Object.assign({ dy: 4, small }, o)); if (small && s.length > 2) t.style.fontSize = Math.max(8, cellPx * 0.36) + 'px'; t.style.pointerEvents = 'none'; t.style.stroke = 'none'; return t; };
      // body
      for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
        const val = mul(i, j), [r, e] = el(val);
        const rect = f.rect(1 + j, Yr(i), 1, 1, { c: e ? 'c2' : 'c1', fo: 0.07 + 0.45 * (r / n), w: 0.6, op: 1 });
        rect.style.stroke = 'var(--lab-plate)'; rect.style.cursor = 'pointer';
        rect.addEventListener('click', () => { ctx.set('a', i, true); ctx.set('b', j); });
        put(1 + j, Yr(i), lab(val), { c: 'ink' });
      }
      // headers
      put(0, m, dih ? '·' : '+', { c: 'muted' });
      for (let j = 0; j < m; j++) put(1 + j, m, lab(j), { c: j === b ? 'c3' : 'muted' });
      for (let i = 0; i < m; i++) put(0, Yr(i), lab(i), { c: i === a ? 'c3' : 'muted' });
      if (dih) { f.seg([1, m - n], [m + 1, m - n], { c: 'ink', w: 1.4, op: 0.45 }); f.seg([1 + n, 0], [1 + n, m], { c: 'ink', w: 1.4, op: 0.45 }); }
      // highlights: row a, column b, the product, the swapped product, and the inverse
      f.rect(1, Yr(a), m, 1, { c: 'c3', fill: false, w: 2 });
      f.rect(1 + b, 0, 1, m, { c: 'c3', fill: false, w: 2 });
      f.rect(1 + b, Yr(a), 1, 1, { c: 'hl', fo: 0.85, w: 2.5 });
      put(1 + b, Yr(a), lab(ab), { c: 'ink' }).style.fontWeight = '700';
      if (ba !== ab) f.rect(1 + a, Yr(b), 1, 1, { c: 'c4', fill: false, w: 2.5, dash: '4 3' });
      f.circle(1 + inv + 0.5, Yr(a) + 0.5, 0.36, { c: 'ink', w: 1.6, dash: '2 2', layer: 'over' });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: dih ? T('rotations rⁱ (darker = larger i)', '回転 rⁱ（濃いほど i が大きい）') : T('rotation by i steps (darker = larger i)', 'i ステップの回転（濃いほど i が大きい）') }].concat(dih ? [{ kind: 'fill', c: 'c2', label: T('reflections rⁱs', '反転 rⁱs') }] : []).concat([{ kind: 'fill', c: 'hl', label: T('a·b', 'a·b') }], ba !== ab ? [{ c: 'c4', dash: true, label: T('b·a, a different cell value', 'b·a（値が異なる）') }] : [], [{ c: 'ink', dash: true, label: T('identity in row a: column a⁻¹', '行 a の単位元：列 a⁻¹') }]));
      const commute = ab === ba;
      ctx.readout([
        { k: 'a·b', v: `${lab(a)} · ${lab(b)} = ${lab(ab)}`, tone: 'key' },
        { k: 'b·a', v: lab(ba), tone: commute ? undefined : 'warn' },
        { k: 'a⁻¹', v: lab(inv) },
        { k: T('commute', '可換'), v: commute ? T('yes', 'はい') : T('no', 'いいえ'), tone: commute ? 'good' : 'warn' },
      ], T('Click any cell to choose a and b. Every row and every column lists each element exactly once.', 'セルをクリックすると a と b を選べます。どの行・列にも各元がちょうど1回ずつ現れます。'));
    },
  };

  D.orbit = {
    render(ctx, v) {
      const n = Math.round(v.n), k = mod(Math.round(v.k), n), withS = v.refl >= 0.5, x = mod(Math.round(v.x), n);
      // Generate the group as a set of elements (m, e): i -> (e ? -i : i) + m.
      const key = ([mm, e]) => mm + e * n;
      const act = ([mm, e], i) => mod((e ? -i : i) + mm, n);
      const comp = ([m1, e1], [m2, e2]) => [mod((e1 ? -m2 : m2) + m1, n), e1 ^ e2]; // g1 after g2
      const gens = [[k, 0]].concat(withS ? [[0, 1]] : []);
      const G = [[0, 0]], seen = new Set([0]);
      for (let q = 0; q < G.length; q++) for (const g of gens) { const h = comp(g, G[q]); if (!seen.has(key(h))) { seen.add(key(h)); G.push(h); } }
      G.sort((p, q) => p[1] - q[1] || p[0] - q[0]);
      const orbitOf = (i) => [...new Set(G.map((g) => act(g, i)))].sort((p, q) => p - q);
      const orb = orbitOf(x), stab = G.filter((g) => act(g, x) === x);
      const orbits = []; const done = new Set();
      for (let i = 0; i < n; i++) if (!done.has(i)) { const o = orbitOf(i); o.forEach((j) => done.add(j)); orbits.push(o); }
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The group acting on the vertices. Click a vertex to follow its orbit.', '頂点に作用する群。頂点をクリックするとその軌道をたどれます。'));
      const f = fig(c1, { axes: false, x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, maxH: 360 });
      f.poly(L.seq(n + 1, (i) => vpos(i, n)), { c: 'muted', fo: 0.05, w: 1, layer: 'under' });
      if (withS) f.line([[0, -1.3], [0, 1.3]], { c: 'c2', w: 1.1, dash: '6 5', op: 0.6, layer: 'under' });
      const inOrb = new Set(orb);
      if (k !== 0) for (let i = 0; i < n; i++) {
        const j = mod(i + k, n), p = vpos(i, n, 0.9), q = vpos(j, n, 0.9), hot = inOrb.has(i);
        const sh = 0.12 / Math.max(0.3, Math.hypot(q[0] - p[0], q[1] - p[1]));
        f.arrow([p[0] + (q[0] - p[0]) * sh, p[1] + (q[1] - p[1]) * sh], [q[0] - (q[0] - p[0]) * sh, q[1] - (q[1] - p[1]) * sh], { c: hot ? 'hl' : 'c1', w: hot ? 2.6 : 1.2, op: hot ? 1 : 0.45 });
      }
      if (withS) for (let i = 1; i < n; i++) { const j = mod(-i, n); if (j > i) { const p = vpos(i, n, 0.9), q = vpos(j, n, 0.9); f.line([p, q], { c: 'c2', w: inOrb.has(i) ? 2 : 1.1, dash: '3 4', op: inOrb.has(i) ? 0.95 : 0.5 }); } }
      for (let i = 0; i < n; i++) {
        const p = vpos(i, n, 0.9), hot = inOrb.has(i);
        const d = f.dot(p[0], p[1], { c: hot ? 'hl' : 'muted', r: i === x ? 14 : 11.5, hollow: !hot });
        d.style.cursor = 'pointer'; d.addEventListener('click', () => ctx.set('x', i));
        const t = f.text(p[0], p[1], String(i), { small: true, dy: 4, c: hot ? 'ink' : 'muted' }); t.style.pointerEvents = 'none'; t.style.stroke = 'none';
      }
      const px = vpos(x, n, 1.22);
      f.text(px[0], px[1], 'x', { math: true, dy: 5, c: 'hl' });
      // Right: the group split into cosets of the stabilizer, one column per orbit point.
      L.h('p', 'lab-cap', c2, T('Group elements g sorted by where they send x. Each column is a coset gGₓ.', '元 g を x の行き先で分類したもの。各列が剰余類 gGₓ です。'));
      const cols = orb.length, rows = stab.length, Wu = Math.max(cols, 6), ox = (Wu - cols) / 2;
      const g2 = fig(c2, { axes: false, x: [0, Wu], y: [-0.15, rows + 1.35], equal: true, maxH: 300, pad: { l: 6, r: 6, t: 6, b: 6 } });
      const cellPx = g2.X(1) - g2.X(0);
      orb.forEach((y, ci) => {
        const cx = ox + ci + 0.5;
        g2.dot(cx, rows + 0.55, { c: 'hl', r: Math.min(11, cellPx * 0.3) });
        g2.text(cx, rows + 0.55, String(y), { small: true, dy: 4 }).style.stroke = 'none';
        const coset = G.filter((g) => act(g, x) === y);
        coset.forEach((g, ri) => {
          g2.rect(ox + ci + 0.07, rows - 1 - ri + 0.07, 0.86, 0.86, { c: g[1] ? 'c2' : 'c1', fo: 0.16, w: 1.2, rx: 4 });
          const t = g2.text(cx, rows - 1 - ri + 0.5, name(...g), { dy: 4, small: cellPx < 40 });
          if (cellPx < 32) t.style.fontSize = Math.max(8, cellPx * 0.34) + 'px';
        });
      });
      g2.text(0, rows + 1.2, T('x is sent to', 'x の行き先'), { small: true, anchor: 'start', c: 'muted', dx: 4, dy: 4 });
      L.legend(ctx.host, [{ kind: 'dot', c: 'hl', label: T('Orbit of x', 'x の軌道') }, { c: 'c1', label: T('Generator rᵏ: i ↦ i + k', '生成元 rᵏ：i ↦ i + k') }].concat(withS ? [{ c: 'c2', dash: true, label: T('Reflection s: i ↦ −i', '反転 s：i ↦ −i') }] : []));
      const g = gcd(n, k);
      ctx.readout([
        { k: '|G|', v: String(G.length) },
        { k: T('orbit Gx', '軌道 Gx'), v: `{${orb.join(', ')}}`, tone: 'key' },
        { k: 'Gₓ', v: `{${stab.map((s) => name(...s)).join(', ')}}` },
        { k: '|G| / |Gₓ|', v: `${G.length} / ${stab.length} = ${G.length / stab.length}`, tone: 'good' },
        { k: T('orbits', '軌道の数'), v: String(orbits.length) },
      ], withS ? T(`With s added, stabilizers can differ from vertex to vertex, so orbits can have different sizes; |Gx|·|Gₓ| = |G| still holds for each x.`, `s を加えると固定部分群の大きさが頂点ごとに変わり、軌道の大きさも変わり得ます。それでも各 x で |Gx|·|Gₓ| = |G| が成り立ちます。`)
        : T(`⟨rᵏ⟩ has n/gcd(n, k) = ${n}/${g} = ${n / g} element${n / g === 1 ? '' : 's'} and splits the ${n} vertices into gcd(n, k) = ${g} orbits of equal size.`, `⟨rᵏ⟩ は n/gcd(n, k) = ${n}/${g} = ${n / g} 個の元をもち、${n} 個の頂点を gcd(n, k) = ${g} 個の同じ大きさの軌道に分けます。`));
    },
  };
})();
