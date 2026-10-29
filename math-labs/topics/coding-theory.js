'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  /* ---------------- models (no DOM) ----------------
   * 1. Hamming(7,4) in its positional form: bits are numbered 1..7, the parity bits sit at 1, 2 and 4, and
   *    the syndrome of a received word is the XOR of the positions holding a 1. A single flipped bit makes the
   *    syndrome equal to its own position.
   * 2. Small binary codes in Hamming space {0,1}^n (n = 3, 4): minimum distance, nearest-codeword decoding,
   *    Hamming balls, and the classical bounds on rate against relative distance.
   * 3. Reed-Solomon over GF(13): the message is a polynomial of degree < k, the codeword its values at
   *    x = 1..n, and Berlekamp-Welch decoding recovers it from up to floor((n - s - k) / 2) errors after
   *    s erasures, by solving one linear system over the field. */

  /* ---- 1. Hamming(7,4) ---- */
  const DATA_POS = [3, 5, 6, 7], PAR_POS = [1, 2, 4];
  // word: array of 8 with index 1..7 used
  function h74Encode(m) {
    const w = new Array(8).fill(0);
    DATA_POS.forEach((p, i) => { w[p] = (m >> (3 - i)) & 1; });
    for (const pb of PAR_POS) { let s = 0; for (let p = 1; p <= 7; p++) if (p !== pb && (p & pb)) s ^= w[p]; w[pb] = s; }
    return w;
  }
  function h74Syndrome(w) { let s = 0; for (let p = 1; p <= 7; p++) if (w[p]) s ^= p; return s; }
  function h74Decode(w) {
    const s = h74Syndrome(w), c = w.slice();
    if (s) c[s] ^= 1;
    let m = 0; DATA_POS.forEach((p, i) => { m |= c[p] << (3 - i); });
    return { s, c, m };
  }
  const blockFailCoded = (p) => 1 - Math.pow(1 - p, 7) - 7 * p * Math.pow(1 - p, 6);
  const blockFailRaw = (p) => 1 - Math.pow(1 - p, 4);

  /* ---- 2. Hamming space ---- */
  const CODES = [
    { n: 3, words: [0b000, 0b111], name: ['Repetition, n = 3', '繰り返し、n = 3'] },
    { n: 3, words: [0b000, 0b011, 0b101, 0b110], name: ['Even weight, n = 3', '偶数重み、n = 3'] },
    { n: 4, words: [0b0000, 0b1111], name: ['Repetition, n = 4', '繰り返し、n = 4'] },
    { n: 4, words: [0b0000, 0b0011, 0b1100, 0b1111], name: ['Two pairs, n = 4', '二組の繰り返し、n = 4'] },
    { n: 4, words: [0b0000, 0b0111, 0b1011, 0b1101, 0b1110], name: ['Five words, n = 4', '五語、n = 4'] },
  ];
  const popcount = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  const hd = (a, b) => popcount(a ^ b);
  function minDistance(words) { let d = Infinity; for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) d = Math.min(d, hd(words[i], words[j])); return d; }
  function binom(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  const ballVolume = (n, t) => { let v = 0; for (let i = 0; i <= t; i++) v += binom(n, i); return v; };
  function nearest(words, r) {
    let best = Infinity, who = [];
    words.forEach((w, i) => { const d = hd(w, r); if (d < best) { best = d; who = [i]; } else if (d === best) who.push(i); });
    return { d: best, who };
  }
  function codeStats(code) {
    const { n, words } = code, M = words.length, d = minDistance(words), t = Math.floor((d - 1) / 2);
    const V = ballVolume(n, t);
    return { n, M, d, t, V, rate: Math.log2(M) / n, hammingOK: M * V <= 2 ** n, perfect: M * V === 2 ** n };
  }
  const H2 = (x) => (x <= 0 || x >= 1 ? 0 : -x * Math.log2(x) - (1 - x) * Math.log2(1 - x));
  const BOUNDS = {
    singleton: (dl) => Math.max(0, 1 - dl),
    hamming: (dl) => Math.max(0, 1 - H2(dl / 2)),
    plotkin: (dl) => Math.max(0, 1 - 2 * dl),
    gv: (dl) => (dl >= 0.5 ? 0 : Math.max(0, 1 - H2(dl))),
  };
  const FAMOUS = [
    { n: 7, k: 4, d: 3, name: 'Hamming [7,4,3]' }, { n: 15, k: 11, d: 3, name: 'Hamming [15,11,3]' },
    { n: 23, k: 12, d: 7, name: 'Golay [23,12,7]' }, { n: 24, k: 12, d: 8, name: 'Golay [24,12,8]' },
    { n: 32, k: 6, d: 16, name: 'Reed–Muller [32,6,16]' }, { n: 5, k: 1, d: 5, name: 'Repetition [5,1,5]' },
  ];

  /* ---- 3. Reed-Solomon over GF(13) ---- */
  const PR = 13;
  const md = (a) => ((a % PR) + PR) % PR;
  function inv(a) { a = md(a); let r = 1, e = PR - 2, b = a; while (e) { if (e & 1) r = r * b % PR; b = b * b % PR; e >>= 1; } return r; }
  const peval = (c, x) => { let s = 0; for (let i = c.length - 1; i >= 0; i--) s = md(s * x + c[i]); return s; };
  // message from a seed: k coefficients, deterministic
  function rsMessage(k, seed) { const c = []; let s = (seed * 7919 + 17) >>> 0; for (let i = 0; i < k; i++) { s = (s * 1103515245 + 12345) >>> 0; c.push((s >>> 16) % PR); } if (c.every((q) => q === 0)) c[0] = 1; return c; }
  const rsEncode = (c, n) => Array.from({ length: n }, (_, i) => peval(c, i + 1));
  // solve A x = b over GF(p); A is m x u. Returns one solution (free variables 0) or null.
  function solveMod(A, b) {
    const m = A.length, u = A[0].length, M = A.map((r, i) => [...r.map(md), md(b[i])]);
    const piv = []; let row = 0;
    for (let col = 0; col < u && row < m; col++) {
      let p = -1; for (let r = row; r < m; r++) if (M[r][col]) { p = r; break; }
      if (p < 0) continue;
      [M[row], M[p]] = [M[p], M[row]];
      const iv = inv(M[row][col]); for (let k = col; k <= u; k++) M[row][k] = M[row][k] * iv % PR;
      for (let r = 0; r < m; r++) if (r !== row && M[r][col]) { const f = M[r][col]; for (let k = col; k <= u; k++) M[r][k] = md(M[r][k] - f * M[row][k]); }
      piv.push(col); row++;
    }
    for (let r = row; r < m; r++) if (M[r][u]) return null;
    const x = new Array(u).fill(0); piv.forEach((col, r) => { x[col] = M[r][u]; });
    return x;
  }
  function polyDiv(num, den) {
    const a = num.slice(), q = new Array(Math.max(1, num.length - den.length + 1)).fill(0), dl = den.length - 1, li = inv(den[dl]);
    for (let i = a.length - 1; i >= dl; i--) { const f = a[i] * li % PR; q[i - dl] = f; if (f) for (let j = 0; j <= dl; j++) a[i - dl + j] = md(a[i - dl + j] - f * den[j]); }
    return { q, rem: a.slice(0, dl).every((x) => x === 0) };
  }
  // received: array of length n with values 0..12, or -1 for an erasure; points x = 1..n
  function rsDecode(recv, k) {
    const pts = recv.map((y, i) => [i + 1, y]).filter((p) => p[1] >= 0);
    const n = pts.length, t = Math.floor((n - k) / 2);
    if (n < k) return { ok: false, t: -1, n };
    for (let e = t; e >= 0; e--) {
      // unknowns: q_0..q_{e+k-1}, e_0..e_{e-1};  Q(x) - y E(x) = 0 with E monic of degree e
      const A = [], b = [];
      for (const [x, y] of pts) {
        const r = [];
        for (let j = 0; j < e + k; j++) r.push(md(Math.pow(x, j)));
        for (let l = 0; l < e; l++) r.push(md(-y * md(Math.pow(x, l))));
        A.push(r); b.push(md(y * md(Math.pow(x, e))));
      }
      const sol = solveMod(A, b);
      if (!sol) continue;
      const Q = sol.slice(0, e + k), E = [...sol.slice(e + k), 1];
      const { q, rem } = polyDiv(Q, E);
      if (!rem) continue;
      const P = q.slice(0, k); while (P.length < k) P.push(0);
      if (q.slice(k).some((x) => x)) continue;
      const bad = pts.filter(([x, y]) => peval(P, x) !== y).map((p) => p[0]);
      if (bad.length > t) continue;
      return { ok: true, P, E, bad, t, n };
    }
    return { ok: false, t, n };
  }

  const M = { h74Encode, h74Syndrome, h74Decode, blockFailCoded, blockFailRaw, CODES, hd, minDistance, binom, ballVolume, nearest, codeStats, H2, BOUNDS, FAMOUS, PR, inv, peval, rsMessage, rsEncode, solveMod, polyDiv, rsDecode };
  (window.LabModels = window.LabModels || {})['coding-theory'] = M;

  const bits = (x, n) => Array.from({ length: n }, (_, i) => (x >> (n - 1 - i)) & 1).join('');

  /* ---------------- 1. Hamming(7,4) ---------------- */
  D['hamming-74'] = {
    render(ctx, v) {
      const st = ctx.state, m = Math.round(v.m);
      if (st.m !== m) { st.m = m; st.flips = st.flips || new Set(); st.flips.clear(); }
      st.flips = st.flips || new Set();
      const sent = h74Encode(m), recv = sent.slice();
      st.flips.forEach((p) => { recv[p] ^= 1; });
      const dec = h74Decode(recv);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Three parity circles. Each circle must hold an even number of 1s; a circle drawn red has an odd count. Click a bit, here or in the row below, to flip it as the channel would.', '三つのパリティの円です。どの円にも 1 が偶数個入っていなければなりません。赤い円は 1 が奇数個です。ここか下の列のビットをクリックすると、通信路がするようにそのビットを反転できます。'));
      const f = L.fig(c1, { x: [-2.15, 2.15], y: [-2.0, 2.05], equal: true, axes: false, grid: false, maxH: 400 });
      const C = { 1: [-0.62, 0.42], 2: [0.62, 0.42], 4: [0, -0.62] }, R = 1.12;
      const odd = {}; PAR_POS.forEach((pb) => { let s = 0; for (let p = 1; p <= 7; p++) if (p & pb) s ^= recv[p]; odd[pb] = s; });
      PAR_POS.forEach((pb) => f.circle(C[pb][0], C[pb][1], R, { c: odd[pb] ? 'c2' : 'c1', w: odd[pb] ? 3.2 : 2, fill: true, fo: odd[pb] ? 0.13 : 0.05 }));
      f.text(C[1][0] - 0.95, C[1][1] + 0.95, T('check 1', '検査 1'), { anchor: 'middle', small: true });
      f.text(C[2][0] + 0.95, C[2][1] + 0.95, T('check 2', '検査 2'), { anchor: 'middle', small: true });
      f.text(C[4][0], C[4][1] - 1.38, T('check 4', '検査 4'), { anchor: 'middle', small: true });
      // region centres for positions 1..7
      const P = { 1: [-1.1, 0.75], 2: [1.1, 0.75], 4: [0, -1.18], 3: [0, 0.92], 5: [-0.66, -0.4], 6: [0.66, -0.4], 7: [0, 0.07] };
      const toggle = (p) => { if (st.flips.has(p)) st.flips.delete(p); else st.flips.add(p); ctx.redraw(); };
      for (let p = 1; p <= 7; p++) {
        const isPar = PAR_POS.includes(p), flipped = st.flips.has(p);
        f.circle(P[p][0], P[p][1], 0.27, { c: flipped ? 'c2' : isPar ? 'muted' : 'ink', w: flipped ? 3 : 1.4, fill: true, fo: flipped ? 0.25 : 0.08 });
        f.text(P[p][0], P[p][1], String(recv[p]), { anchor: 'middle', dy: 6 });
        f.text(P[p][0] + 0.3, P[p][1] + 0.27, String(p), { anchor: 'start', small: true, c: 'muted' });
      }
      f.hover((x, y) => {
        let best = null, bd = 0.32; for (let p = 1; p <= 7; p++) { const d = Math.hypot(x - P[p][0], y - P[p][1]); if (d < bd) { bd = d; best = p; } }
        return best ? { x: P[best][0], y: P[best][1], text: T(`bit ${best} (${PAR_POS.includes(best) ? 'parity' : 'data'}): click to flip`, `ビット ${best}（${PAR_POS.includes(best) ? 'パリティ' : 'データ'}）：クリックで反転`) } : null;
      });
      f.svg.style.cursor = 'pointer';
      f.svg.addEventListener('click', (ev) => {
        const m0 = f.svg.getScreenCTM(); if (!m0) return;
        const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m0.inverse()), x = f.IX(q.x), y = f.IY(q.y);
        for (let p = 1; p <= 7; p++) if (Math.hypot(x - P[p][0], y - P[p][1]) < 0.34) { toggle(p); return; }
      });
      const btns = L.h('div', 'lab-syms', c1);
      btns.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0 4px';
      for (let p = 1; p <= 7; p++) {
        const b = L.h('button', 'lab-sym', btns, String(recv[p])); b.type = 'button';
        b.setAttribute('aria-label', T(`flip bit ${p}`, `ビット ${p} を反転`)); b.setAttribute('aria-pressed', String(st.flips.has(p)));
        b.title = T(`position ${p}`, `位置 ${p}`);
        if (st.flips.has(p)) b.style.borderColor = 'var(--lab-c2)';
        if (PAR_POS.includes(p)) b.style.color = 'var(--lab-muted)';
        b.addEventListener('click', () => toggle(p));
      }
      const clr = L.h('button', 'lab-sym is-wide', btns, T('clear errors', '誤りを消す')); clr.type = 'button'; clr.addEventListener('click', () => { st.flips.clear(); ctx.redraw(); });
      // block error figure
      L.h('p', 'lab-cap', c2, T('Each bit is flipped independently with probability p. Probability that a 4-bit message arrives wrong: sent raw, or as a Hamming(7,4) word and decoded. Drag the point.', '各ビットは確率 p で独立に反転します。4 ビットのメッセージが誤って届く確率を、そのまま送った場合と、ハミング (7,4) 符号語として送り復号した場合で比べます。点をドラッグしてください。'));
      const pv = v.p;
      const fp = L.fig(c2, { x: [-3.5, -0.3], y: [-7, 0], aspect: 0.75, maxH: 330, xlabel: T('bit-flip probability p (log₁₀)', 'ビット反転確率 p（log₁₀）'), ylabel: T('message error probability (log₁₀)', 'メッセージ誤り確率（log₁₀）'), ticksX: [[-3, '10⁻³'], [-2, '0.01'], [-1, '0.1']], ticksY: [[-6, '10⁻⁶'], [-4, '10⁻⁴'], [-2, '0.01'], [0, '1']] });
      const lg = (y) => Math.log10(Math.max(1e-12, y));
      fp.line(L.sample(-3.5, -0.3, 160, (x) => [x, lg(blockFailRaw(10 ** x))]), { c: 'muted', w: 2.2 });
      fp.line(L.sample(-3.5, -0.3, 160, (x) => [x, lg(blockFailCoded(10 ** x))]), { c: 'c1', w: 2.6 });
      const xp = Math.log10(pv);
      fp.dot(xp, lg(blockFailRaw(pv)), { c: 'muted', r: 4 });
      fp.handle(xp, lg(blockFailCoded(pv)), { c: 'hl', label: T('bit-flip probability', 'ビット反転確率'), axis: 'x', bounds: [-3.5, -0.3, -7, 0], onDrag: (x) => ctx.set('p', Math.round(10 ** x * 10000) / 10000) });
      L.legend(ctx.host, [{ c: 'c1', label: T('Hamming(7,4), decoded: fails only if two or more of 7 bits flip', 'ハミング (7,4) で復号：7 ビット中 2 個以上反転したときだけ失敗') }, { c: 'muted', label: T('4 bits sent raw: fails if any bit flips', '4 ビットをそのまま送る：どれか 1 ビットでも反転すると失敗') }, { kind: 'dot', c: 'c2', label: T('a flipped bit, and a circle whose parity is now odd', '反転したビットと、パリティが奇数になった円') }]);
      const ok = dec.m === m;
      const syn = bits(dec.s, 3);
      ctx.readout([
        { k: T('message (4 bits)', 'メッセージ（4 ビット）'), v: bits(m, 4), tone: 'key' },
        { k: T('codeword sent, bits 1..7', '送った符号語（ビット 1..7）'), v: sent.slice(1).join('') },
        { k: T('received', '受信語'), v: recv.slice(1).join('') + '  (' + st.flips.size + T(' flipped)', ' 個反転)') },
        { k: T('syndrome (checks 4, 2, 1)', 'シンドローム（検査 4, 2, 1）'), v: syn + ' = ' + dec.s, tone: 'key' },
        { k: T('decoded message', '復号したメッセージ'), v: bits(dec.m, 4) + (ok ? T('  correct', '  正しい') : T('  wrong', '  誤り')), tone: ok ? 'good' : 'warn' },
        { k: T('at this p: raw / coded failure', 'この p での失敗確率：そのまま / 符号化'), v: fmt(blockFailRaw(pv), 3) + ' / ' + fmt(blockFailCoded(pv), 3) },
      ], dec.s === 0 ? (st.flips.size ? T('Zero syndrome but the word was changed: three flips can turn one codeword into another, and no code can see that.', 'シンドロームはゼロですが、語は変わっています。3 個の反転で別の符号語になることがあり、それはどの符号にも見えません。') : T('Every circle is even, so the syndrome is zero and the word is accepted as sent.', 'どの円も偶数なのでシンドロームはゼロで、送られたとおりに受け取ります。'))
        : st.flips.size === 1 ? T(`The odd circles are exactly those containing position ${dec.s}, so the syndrome, read as a binary number, names the flipped bit.`, `奇数の円は位置 ${dec.s} を含む円とちょうど一致するので、シンドロームを二進数として読むと、反転したビットの番号になります。`)
          : T(`Two or more flips look like a single flip at position ${dec.s}. The decoder trusts the likelier story and makes things worse.`, `2 個以上の反転は、位置 ${dec.s} の 1 個の反転と見分けがつきません。復号器はより起こりやすい方を信じ、かえって誤りを増やします。`));
    },
  };

  /* ---------------- 2. Hamming space ---------------- */
  const BALL = ['c1', 'c2', 'c3', 'c4', 'pos'];
  function vertexPos(x, n) {
    const b = (i) => (x >> (n - 1 - i)) & 1;
    if (n === 3) return [b(0) ? 1 : -1, b(1) ? 1 : -1, b(2) ? 1 : -1].map((q) => q * 1.15);
    const s = b(0) ? 0.55 : 1.4;                       // first bit picks the inner or the outer cube
    return [b(1) ? s : -s, b(2) ? s : -s, b(3) ? s : -s];
  }
  D['hamming-space'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state;
      if (!st.frame || !st.frame.isConnected) {
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        const row = L.h('div', 'lab-row is-wide', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap1 = L.h('p', 'lab-cap', st.c1, '');
        st.v3 = L.h('div', '', st.c1);
        st.flips = L.h('div', '', st.c1);
        L.h('p', 'lab-cap', st.c2, T('Rate k/n against relative distance d/n. The curves are limits for long codes: as n grows, codes on the green curve always exist and none can pass the orange and violet ones. Short codes can sit above those limits (Hamming [7,4,3] does), but no code of any length crosses the dashed Singleton line.', 'レート k/n と相対距離 d/n の関係です。曲線は長い符号の極限です。n が大きくなると、緑の曲線上の符号は必ず存在し、橙と紫の曲線を超える符号はありません。短い符号はこれらの極限より上にありえます（ハミング [7,4,3] がそうです）が、どの長さの符号も破線のシングルトン直線は越えません。'));
        st.v2 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      const ci = Math.round(v.code), code = CODES[ci], n = code.n, N = 1 << n, recv = Math.round(v.recv) % N;
      const S0 = codeStats(code);
      const near = nearest(code.words, recv);
      st.cap1.textContent = n === 3
        ? T('The cube {0,1}³: two words are joined by an edge when they differ in one bit, so distance is the number of edges on the shortest path. Each codeword (large) owns the words nearer to it than to any other; grey words are equally near two codewords. Drag the gold word, or flip its bits below.', '立方体 {0,1}³ です。二つの語は一ビットだけ違うとき辺で結ばれるので、距離は最短経路の辺の数です。各符号語（大きい球）は、他のどの符号語よりも自分に近い語を受け持ちます。灰色の語は二つの符号語から等距離です。金色の語をドラッグするか、下でビットを反転してください。')
        : T('The 4-cube {0,1}⁴ drawn as a cube inside a cube: the first bit chooses inner or outer, and each corner of the inner cube is joined to the matching outer one. Each codeword (large) owns the words nearer to it than to any other; grey words are tied. Drag the gold word, or flip its bits below.', '4 次元立方体 {0,1}⁴ を、立方体の中の立方体として描いています。最初のビットが内側か外側かを選び、内側の各頂点は対応する外側の頂点と結ばれています。各符号語（大きい球）は、他のどの符号語よりも自分に近い語を受け持ちます。灰色の語は等距離です。金色の語をドラッグするか、下でビットを反転してください。');
      const owner = (x) => { const r = nearest(code.words, x); return r.who.length === 1 ? r.who[0] : -1; };
      const draw2d = () => {
        st.v2.replaceChildren(); st.leg.replaceChildren(); st.flips.replaceChildren();
        if (st.flat) {
          st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-2, 2], y: [-2, 2], equal: true, axes: false, grid: false, maxH: 360 });
          const P2 = (x) => { const p = vertexPos(x, n); return [p[0] + 0.42 * p[1], p[2] + 0.3 * p[1]]; };
          for (let x = 0; x < N; x++) for (let i = 0; i < n; i++) { const y = x ^ (1 << i); if (y > x) f.seg(P2(x), P2(y), { c: 'muted', w: 1.2, op: 0.6 }); }
          for (let x = 0; x < N; x++) { const o = owner(x), isC = code.words.includes(x); f.dot(...P2(x), { c: o < 0 ? 'muted' : BALL[o], r: isC ? 8 : 5 }); f.text(...P2(x), bits(x, n), { anchor: 'middle', small: true, dy: -11 }); }
          f.dot(...P2(recv), { c: 'hl', r: 6 });
        }
        const btns = st.flips; btns.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0';
        L.h('span', 'lab-cap', btns, T('received word:', '受信語：')).style.alignSelf = 'center';
        for (let i = 0; i < n; i++) {
          const b = L.h('button', 'lab-sym', btns, String((recv >> (n - 1 - i)) & 1)); b.type = 'button';
          b.setAttribute('aria-label', T(`flip bit ${i + 1}`, `ビット ${i + 1} を反転`));
          b.addEventListener('click', () => ctx.set('recv', recv ^ (1 << (n - 1 - i))));
        }
        const f = L.fig(st.v2, { x: [0, 1.04], y: [0, 1.1], aspect: 0.82, maxH: 400, xlabel: T('relative distance δ = d/n', '相対距離 δ = d/n'), ylabel: T('rate R = k/n', 'レート R = k/n') });
        const pts = (fn, hi = 1) => L.sample(0, hi, 160, (x) => [x, fn(x)]);
        f.line(pts(BOUNDS.singleton), { c: 'muted', w: 1.4, dash: true });
        f.line(pts(BOUNDS.plotkin, 0.5), { c: 'c4', w: 2 });
        f.line(pts(BOUNDS.hamming), { c: 'c2', w: 2.2 });
        f.line(pts(BOUNDS.gv, 0.5), { c: 'c3', w: 2.2 });
        f.area(pts(BOUNDS.gv, 0.5), { base: 0, c: 'c3', fo: 0.08 });
        const LBL = { 'Hamming [7,4,3]': [6, -4], 'Hamming [15,11,3]': [6, -4], 'Golay [23,12,7]': [-6, 12, 'end'], 'Golay [24,12,8]': [6, 12], 'Reed–Muller [32,6,16]': [-6, 14, 'end'], 'Repetition [5,1,5]': [-6, -8, 'end'] };
        FAMOUS.forEach((q) => { const o = LBL[q.name] || [6, -4]; f.dot(q.d / q.n, q.k / q.n, { c: 'ink', r: 3.5 }); f.text(q.d / q.n, q.k / q.n, q.name, { small: true, dx: o[0], dy: o[1], anchor: o[2] || 'start' }); });
        f.dot(S0.d / n, S0.rate, { c: 'hl', r: 6.5 });
        const right = S0.d / n > 0.7;
        f.text(S0.d / n, S0.rate, T('this code', 'この符号'), { small: true, dx: right ? -10 : 10, dy: -8, c: 'hl', anchor: right ? 'end' : 'start' });
        L.legend(st.leg, [{ c: 'muted', dash: true, label: T('Singleton bound, k ≤ n − d + 1', 'シングルトン限界 k ≤ n − d + 1') }, { c: 'c2', label: T('Hamming (sphere-packing) bound: no code above', 'ハミング（球充填）限界：これより上の符号はない') }, { c: 'c4', label: T('Plotkin bound', 'プロトキン限界') }, { c: 'c3', label: T('Gilbert–Varshamov: codes this good always exist', 'ギルバート・ヴァルシャモフ：少なくともこれだけ良い符号は必ずある') }, { kind: 'dot', c: 'hl', label: T('the received word, and this code', '受信語と、この符号') }]);
        const dec = near.who.length === 1 ? bits(code.words[near.who[0]], n) : T('tie: ', '同点：') + near.who.map((i) => bits(code.words[i], n)).join(T(' or ', ' か '));
        ctx.readout([
          { k: T('length n, size M', '長さ n、語数 M'), v: `${n}, ${S0.M}` },
          { k: T('minimum distance d', '最小距離 d'), v: String(S0.d), tone: 'key' },
          { k: T('corrects t = ⌊(d−1)/2⌋ errors, detects d − 1', '訂正できる誤り t = ⌊(d−1)/2⌋、検出できる誤り d − 1'), v: `${S0.t}, ${S0.d - 1}`, tone: 'key' },
          { k: T('ball volume V(n, t) × M vs 2ⁿ', '球の体積 V(n, t) × M と 2ⁿ'), v: `${S0.V} × ${S0.M} = ${S0.V * S0.M} ${S0.perfect ? '=' : '<'} ${N}`, tone: S0.perfect ? 'good' : undefined },
          { k: T('received → nearest codeword', '受信語 → 最も近い符号語'), v: bits(recv, n) + ' → ' + dec + T(` (distance ${near.d})`, `（距離 ${near.d}）`), tone: near.who.length === 1 ? undefined : 'warn' },
        ], S0.perfect ? T('A perfect code: the balls of radius t around the codewords fill the whole space with no word left over, so every received word decodes.', '完全符号です。符号語のまわりの半径 t の球が空間全体を余りなく埋めるので、どの受信語も復号できます。')
          : S0.t === 0 ? T('With d = 2 the balls of radius 0 are just the codewords: a single error is detected (the word is not a codeword) but cannot be placed.', 'd = 2 では半径 0 の球は符号語そのものです。1 個の誤りは検出できます（符号語でなくなる）が、どこかは分かりません。')
            : T('The balls do not fill the space: the grey words lie at equal distance from two codewords, so a decoder can only report the error.', '球は空間を埋めつくしません。灰色の語は二つの符号語から等距離なので、復号器は誤りを報告することしかできません。'));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 470, camera: [4.2, -5.6, 3.3], target: [0, 0, 0], fov: 32,
        init(S) {
          st.flat = false; st.S = S;
          st.edges = S.lines([], { c: 'muted', opacity: 0.5, w: 1.6 });
          st.ballEdges = BALL.map((c) => S.lines([], { c, opacity: 0.95, w: 4 }));
          st.path = S.lines([], { c: 'hl', opacity: 1, w: 5 });
          st.pts = S.points([[0, 0, 0]], { colours: [S.colour('muted')], r: 0.1, max: 16, rough: 0.25, coat: 0.8 });
          st.labs = Array.from({ length: 16 }, () => S.label('', [0, 0, 0], { small: true, align: 'middle' }));
          st.recv = S.sphere([0, 0, 0], 0.16, { c: 'hl', glow: 0.25 });
          st.hdl = S.handle([0, 0, 0], { facing: true, r: 0.22, c: 'hl', onDrag: (q) => {
            let best = 0, bd = Infinity;
            for (let x = 0; x < (1 << st.n); x++) { const p = vertexPos(x, st.n), d = Math.hypot(p[0] - q.x, p[1] - q.y, p[2] - q.z); if (d < bd) { bd = d; best = x; } }
            if (best !== st.recvNow) ctx.set('recv', best);
            return vertexPos(best, st.n);
          } });
        },
        update(S) {
          st.n = n; st.recvNow = recv;
          const segs = [], ball = BALL.map(() => []);
          for (let x = 0; x < N; x++) for (let i = 0; i < n; i++) {
            const y = x ^ (1 << i); if (y < x) continue;
            const ox = owner(x), oy = owner(y);
            if (ox >= 0 && ox === oy && (code.words.includes(x) || code.words.includes(y)) && S0.t >= 1) ball[ox].push([vertexPos(x, n), vertexPos(y, n)]);
            else segs.push([vertexPos(x, n), vertexPos(y, n)]);
          }
          st.edges.update(segs); st.ballEdges.forEach((e, i) => e.update(ball[i]));
          const P = [], cols = [], radii = [];
          for (let x = 0; x < N; x++) { const o = owner(x), isC = code.words.includes(x); P.push(vertexPos(x, n)); cols.push(S.colour(o < 0 ? 'muted' : BALL[o])); radii.push(isC ? 0.2 : 0.11); }
          st.pts.update(P, cols, radii);
          st.labs.forEach((lb, x) => { if (x < N) { const p = vertexPos(x, n); lb.set([p[0], p[1], p[2] + (code.words.includes(x) ? 0.34 : 0.24)], bits(x, n)); lb.show(true); } else lb.show(false); });
          st.recv.at(vertexPos(recv, n)); st.hdl.at(vertexPos(recv, n));
          // shortest path to the decoded codeword
          const path = [];
          if (near.who.length === 1) { let x = recv; const target = code.words[near.who[0]]; for (let i = 0; i < n; i++) { const bit = 1 << (n - 1 - i); if ((x ^ target) & bit) { path.push([vertexPos(x, n), vertexPos(x ^ bit, n)]); x ^= bit; } } }
          st.path.update(path);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. Reed-Solomon ---------------- */
  D['reed-solomon'] = {
    render(ctx, v) {
      const st = ctx.state, k = Math.round(v.k), n = Math.max(k + 1, Math.round(v.n)), seed = Math.round(v.seed);
      const key = `${k}|${n}|${seed}`;
      const msg = rsMessage(k, seed), sent = rsEncode(msg, n);
      if (st.key !== key || !st.recv || st.recv.length !== n) { st.key = key; st.recv = sent.slice(); }
      const recv = st.recv, dec = rsDecode(recv, k);
      const nErr = recv.filter((y, i) => y >= 0 && y !== sent[i]).length, nEra = recv.filter((y) => y < 0).length;
      const row = L.h('div', 'lab-row is-wide', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The finite field GF(13) drawn as a 13 × 13 grid. The message is a polynomial P of degree below k; the codeword is its value at x = 1, …, n. Drag a received symbol up or down to corrupt it, or down into the bottom row to erase it. The decoder redraws P from what survives.', '有限体 GF(13) を 13 × 13 の格子として描いています。メッセージは次数 k 未満の多項式 P で、符号語は x = 1, …, n でのその値です。受信した記号を上下にドラッグすると誤りになり、一番下の行まで下げると消失になります。復号器は残ったものから P を描き直します。'));
      const f = L.fig(c1, { x: [-0.6, 12.6], y: [-1.7, 12.6], equal: true, axes: false, grid: false, maxH: 470 });
      for (let x = 0; x < PR; x++) for (let y = 0; y < PR; y++) f.dot(x, y, { c: 'muted', r: 1.3 });
      for (let i = 0; i < PR; i++) { f.text(i, -0.75, String(i), { anchor: 'middle', small: true, c: 'muted' }); f.text(-0.45, i, String(i), { anchor: 'end', small: true, c: 'muted', dy: 4 }); }
      f.rect(0.5, -1.55, n, 0.75, { c: 'muted', fill: true, fo: 0.07, nostroke: true });
      f.text(n + 0.6, -1.2, T('erased', '消失'), { small: true, c: 'muted', dy: 4 });
      if (dec.ok) {
        const vals = Array.from({ length: PR }, (_, x) => [x, peval(dec.P, x)]);
        for (let x = 0; x < PR - 1; x++) f.seg(vals[x], vals[x + 1], { c: 'c1', w: 1, op: 0.28 });
        vals.forEach(([x, y]) => f.circle(x, y, 0.32, { c: 'c1', w: 1.6, fill: false }));
        dec.bad.forEach((x) => f.circle(x, peval(dec.P, x), 0.5, { c: 'c3', w: 2.4, fill: false }));
      }
      for (let i = 0; i < n; i++) {
        const x = i + 1, y = recv[i];
        if (y >= 0 && y !== sent[i]) f.seg([x, sent[i]], [x, y], { c: 'c2', w: 1.4, dash: true, op: 0.7 });
        f.handle(x, y < 0 ? -1.18 : y, { c: y < 0 ? 'muted' : y !== sent[i] ? 'c2' : 'ink', r: 7, label: T(`received symbol at x = ${x}`, `x = ${x} の受信記号`), axis: 'y', bounds: [x, x, -1.18, 12], snap: 1,
          onDrag: (nx, ny) => { const nv = ny < -0.5 ? -1 : Math.round(ny); if (nv !== st.recv[i]) { st.recv[i] = nv; ctx.redraw(); } } });
      }
      // right: the decoding budget
      L.h('p', 'lab-cap', c2, T('What the decoder can afford: e errors and s erasures are always fixed when 2e + s ≤ n − k. An erasure costs half as much as an error, because its position is known.', '復号器が払えるもの：誤り e 個と消失 s 個は、2e + s ≤ n − k なら必ず直せます。消失は位置が分かっているので、誤りの半分の費用です。'));
      const rr = n - k;
      const g = L.fig(c2, { x: [-0.5, rr + 1.5], y: [-0.5, rr / 2 + 1.5], aspect: 0.82, maxH: 360, xlabel: T('erasures s', '消失 s'), ylabel: T('errors e', '誤り e') });
      g.poly([[0, 0], [rr, 0], [0, rr / 2]], { c: 'c3', fill: true, fo: 0.14 });
      for (let s = 0; s <= rr + 1; s++) for (let e = 0; e <= rr / 2 + 1; e++) g.dot(s, e, { c: 2 * e + s <= rr ? 'c3' : 'muted', r: 2.5 });
      g.line([[0, rr / 2], [rr, 0]], { c: 'c3', w: 2 });
      g.text(rr * 0.5, rr / 4, '2e + s = n − k', { small: true, dx: 8, dy: -6, c: 'c3' });
      g.dot(nEra, nErr, { c: dec.ok && dec.bad.length === nErr ? 'hl' : 'c2', r: 7 });
      L.legend(ctx.host, [{ c: 'c1', label: T('decoded polynomial P, evaluated on the whole field', '復号した多項式 P を体全体で評価したもの') }, { c: 'c2', label: T('a corrupted symbol (dashed back to the sent value)', '誤った記号（破線の先が送った値）') }, { c: 'c3', label: T('errors the decoder located (roots of its error locator)', '復号器が見つけた誤りの位置（誤り位置多項式の根）') }, { kind: 'dot', c: 'muted', label: T('erased symbol', '消失した記号') }]);
      const fixed = dec.ok && dec.P.every((c, i) => c === msg[i]);
      const polyTxt = (c) => c.map((q, i) => (q ? (i === 0 ? String(q) : (q === 1 ? '' : q) + 'x' + (i > 1 ? '^' + i : '')) : '')).filter(Boolean).reverse().join(' + ') || '0';
      ctx.readout([
        { k: T('message polynomial', 'メッセージ多項式'), v: 'P(x) = ' + polyTxt(msg), tone: 'key' },
        { k: T('n, k, d = n − k + 1', 'n、k、d = n − k + 1'), v: `${n}, ${k}, ${n - k + 1}` },
        { k: T('errors, erasures', '誤り、消失'), v: `${nErr}, ${nEra}`, tone: 2 * nErr + nEra <= n - k ? 'good' : 'warn' },
        { k: T('budget 2e + s against n − k', '予算 2e + s と n − k'), v: `${2 * nErr + nEra} ${2 * nErr + nEra <= n - k ? '≤' : '>'} ${n - k}` },
        { k: T('decoder', '復号器'), v: !dec.ok ? T('fails: no polynomial fits', '失敗：合う多項式がない') : fixed ? T('recovers the message', 'メッセージを復元') : T('returns a different codeword', '別の符号語を返す'), tone: fixed ? 'good' : 'warn' },
        dec.ok && dec.E && dec.E.length > 1 ? { k: T('error locator E(x), roots', '誤り位置多項式 E(x) の根'), v: dec.bad.length ? 'x = ' + dec.bad.join(', ') : T('none', 'なし') } : { k: T('largest t after erasures', '消失を除いたあとの最大の t'), v: String(Math.max(0, dec.t)) },
      ], T('Any k correct values fix a polynomial of degree below k, so two different codewords agree in at most k − 1 places: the minimum distance is n − k + 1, as large as the Singleton bound allows.', '正しい値が k 個あれば次数 k 未満の多項式は決まるので、異なる二つの符号語が一致するのは高々 k − 1 か所です。最小距離は n − k + 1 で、シングルトン限界が許す最大です。'));
      // buttons
      const bar = L.h('div', '', ctx.host); bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:6px';
      const rnd = L.h('button', 'lab-sym is-wide', bar, T('add a random error', '誤りを一つ加える')); rnd.type = 'button';
      rnd.addEventListener('click', () => {
        const good = st.recv.map((y, i) => (y >= 0 && y === sent[i] ? i : -1)).filter((i) => i >= 0);
        if (!good.length) return;
        st.rng = ((st.rng || 7) * 48271) % 2147483647;
        const i = good[st.rng % good.length]; st.recv[i] = (sent[i] + 1 + (st.rng >> 4) % (PR - 1)) % PR; ctx.redraw();
      });
      const clr = L.h('button', 'lab-sym is-wide', bar, T('restore the codeword', '符号語に戻す')); clr.type = 'button'; clr.addEventListener('click', () => { st.recv = sent.slice(); ctx.redraw(); });
    },
  };
})();
