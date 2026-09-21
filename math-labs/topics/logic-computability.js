'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};

  /* ---------- model (pure, checked by verify.cjs) ---------- */
  // rule: [write, move (+1 right, -1 left), next state]; 'H' halts
  const MACHINES = [
    { name: ['Binary increment', '二進数に 1 を足す'], blank: '_', start: 'R', tape: '10111', head: 0,
      rules: { 'R,0': ['0', 1, 'R'], 'R,1': ['1', 1, 'R'], 'R,_': ['_', -1, 'C'], 'C,1': ['0', -1, 'C'], 'C,0': ['1', -1, 'H'], 'C,_': ['1', -1, 'H'] },
      states: ['R', 'C'], symbols: ['0', '1', '_'], note: ['R: run right to the end. C: carry leftwards.', 'R：右端まで進む。C：左へ繰り上げる。'] },
    { name: ['Busy beaver, 2 states', 'ビジービーバー（2 状態）'], blank: '0', start: 'A', tape: '', head: 0,
      rules: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', -1, 'B'], 'B,0': ['1', -1, 'A'], 'B,1': ['1', 1, 'H'] },
      states: ['A', 'B'], symbols: ['0', '1'], note: ['The champion two-state machine: from a blank tape it writes as many 1s as any halting two-state machine can.', '2 状態の王者：空白のテープから、停止する 2 状態機械が書ける最大数の 1 を書きます。'] },
    { name: ['Busy beaver, 4 states', 'ビジービーバー（4 状態）'], blank: '0', start: 'A', tape: '', head: 0,
      rules: { 'A,0': ['1', 1, 'B'], 'A,1': ['1', -1, 'B'], 'B,0': ['1', -1, 'A'], 'B,1': ['0', -1, 'C'], 'C,0': ['1', 1, 'H'], 'C,1': ['1', -1, 'D'], 'D,0': ['1', 1, 'D'], 'D,1': ['0', 1, 'A'] },
      states: ['A', 'B', 'C', 'D'], symbols: ['0', '1'], note: ['Brady’s four-state champion: 107 steps, 13 ones.', 'ブレイディの 4 状態の王者：107 ステップ、13 個の 1。'] },
    { name: ['Unary addition', '一進数の足し算'], blank: '_', start: 'P', tape: '111_11', head: 0,
      rules: { 'P,1': ['1', 1, 'P'], 'P,_': ['1', 1, 'Q'], 'Q,1': ['1', 1, 'Q'], 'Q,_': ['_', -1, 'E'], 'E,1': ['_', -1, 'H'] },
      states: ['P', 'Q', 'E'], symbols: ['1', '_'], note: ['3 + 2: fill the gap with a 1, run to the end, erase one 1.', '3 + 2：すき間を 1 で埋め、端まで進み、1 を一つ消します。'] },
  ];
  function runMachine(m, maxSteps = 1000) {
    const tape = new Map(); [...m.tape].forEach((c, i) => { if (c !== m.blank) tape.set(i, c); });
    let head = m.head, state = m.start; const hist = [];
    const snap = (rule) => ({ tape: new Map(tape), head, state, rule });
    hist.push(snap(null));
    for (let s = 0; s < maxSteps && state !== 'H'; s++) {
      const sym = tape.get(head) ?? m.blank, key = `${state},${sym}`, r = m.rules[key];
      if (!r) break;
      if (r[0] === m.blank) tape.delete(head); else tape.set(head, r[0]);
      head += r[1]; state = r[2];
      hist.push(snap(key));
    }
    return hist;
  }
  const countOnes = (tape) => [...tape.values()].filter((c) => c === '1').length;
  // hypothetical halting table from a seed; D flips the diagonal
  function haltTable(n, seed) { let a = seed * 9301 + 49297; const r = () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; return Array.from({ length: n }, () => Array.from({ length: n }, () => r() < 0.55)); }
  const diagonal = (tab) => tab.map((row, i) => !row[i]);
  // Goedel numbering
  const CODES = { '¬': 1, '∨': 2, '→': 3, '∀': 4, '=': 5, '0': 6, 'S': 7, '(': 8, ')': 9, ',': 10, '+': 11, '×': 12, 'x': 13, 'y': 17 };
  function primes(n) { const out = []; for (let k = 2; out.length < n; k++) if (out.every((p) => k % p)) out.push(k); return out; }
  function godel(seq) { const ps = primes(seq.length); let g = 1n; seq.forEach((s, i) => { g *= BigInt(ps[i]) ** BigInt(CODES[s]); }); return g; }
  function decode(g) { const out = []; let k = 0; const ps = primes(40); g = BigInt(g); while (g > 1n && k < ps.length) { const p = BigInt(ps[k]); let e = 0; while (g % p === 0n) { g /= p; e++; } const s = Object.keys(CODES).find((c) => CODES[c] === e); if (!s) return null; out.push(s); k++; } return g === 1n ? out : null; }
  (window.LabModels = window.LabModels || {})['logic-computability'] = { MACHINES, runMachine, countOnes, haltTable, diagonal, CODES, primes, godel, decode };

  /* ---------- 1. Turing machine ---------- */
  D.turing = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const m = MACHINES[v.machine], hist = runMachine(m), last = hist.length - 1;
      const k = Math.min(v.step, last), cur = hist[k];
      let lo = Infinity, hi = -Infinity; hist.forEach((h) => { lo = Math.min(lo, h.head); hi = Math.max(hi, h.head); h.tape.forEach((_, i) => { lo = Math.min(lo, i); hi = Math.max(hi, i); }); });
      lo -= 1; hi += 1; const W = hi - lo + 1;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Tape at step ${k} of ${last}`, `ステップ ${k}（全 ${last}）のテープ`));
      const tp = L.fig(c1, { x: [lo - 0.6, hi + 0.6], y: [-0.9, 1.9], aspect: 0.2, minH: 120, maxH: 150, axes: false });
      const drawTape = (h) => {
        tp.clear('main'); tp.clear('over');
        for (let i = lo; i <= hi; i++) { const s = h.tape.get(i) ?? m.blank; tp.rect(i - 0.46, -0.46, 0.92, 0.92, { c: s === '1' ? 'c1' : 'muted', fo: s === '1' ? 0.4 : 0.06, w: s === '1' ? 1.6 : 1, rx: 3 }); tp.text(i, 0, s === '_' ? '' : s, { c: s === '1' ? 'ink' : 'muted', dy: 5 }).style.stroke = 'none'; }
        tp.poly([[h.head, 0.58], [h.head - 0.28, 1.05], [h.head + 0.28, 1.05]], { c: 'hl', fo: 0.95, w: 1 });
        tp.text(h.head, 1.45, h.state === 'H' ? T('halt', '停止') : h.state, { c: h.state === 'H' ? 'c3' : 'hl', dy: 5 });
      };
      drawTape(cur);
      // transition table
      L.h('p', 'lab-cap', c2, T('Transition table: write, move, next state', '遷移表：書く記号・移動・次の状態'));
      const tbl = L.h('table', 'lab-table is-rules', c2);
      const thead = L.h('tr', '', L.h('thead', '', tbl)); L.h('th', '', thead, T('state', '状態')); m.symbols.forEach((s) => L.h('th', '', thead, T(`read ${s}`, `${s} を読む`)));
      const tb = L.h('tbody', '', tbl), cells = {};
      m.states.forEach((q) => { const tr = L.h('tr', '', tb); L.h('th', '', tr, q); m.symbols.forEach((s) => { const r = m.rules[`${q},${s}`]; const td = L.h('td', '', tr, r ? `${r[0] === '_' ? '␣' : r[0]} ${r[1] > 0 ? 'R' : 'L'} ${r[2] === 'H' ? T('halt', '停止') : r[2]}` : '·'); cells[`${q},${s}`] = td; }); });
      const mark = (key) => Object.entries(cells).forEach(([kk, td]) => td.classList.toggle('is-active', kk === key));
      const nextKey = (h) => (h.state === 'H' ? null : `${h.state},${h.tape.get(h.head) ?? m.blank}`);
      mark(nextKey(cur));
      L.h('p', 'lab-cap', c2, m.note[L.ja ? 1 : 0]);
      // space-time diagram
      L.h('p', 'lab-cap', ctx.host, T('Space-time diagram: each column is the whole tape at one step (left end of the tape at the top), time runs to the right', '時空図：各列が一つのステップのテープ全体（テープの左端が上）で、時間は右へ進みます'));
      const rows = hist.length;
      const sp = L.fig(ctx.host, { x: [-0.5, rows - 0.5], y: [-hi - 0.5, -lo + 0.5], aspect: L.clamp(W / rows * 1.8, 0.22, 0.6), minH: 140, maxH: 420, axes: false });
      hist.forEach((h, t) => { h.tape.forEach((s, i) => { if (s === '1') sp.rect(t - 0.5, -i - 0.5, 1, 1, { c: 'c1', fo: 0.85, nostroke: true, layer: 'under' }); else if (s !== m.blank) sp.rect(t - 0.5, -i - 0.5, 1, 1, { c: 'c3', fo: 0.35, nostroke: true, layer: 'under' }); }); });
      hist.forEach((h, t) => sp.rect(t - 0.22, -h.head - 0.22, 0.44, 0.44, { c: 'hl', fo: 0.95, nostroke: true, layer: 'under' }));
      const drawNow = (t) => { sp.clear('over'); sp.rect(t - 0.5, -hi - 0.5, 1, W, { c: 'hl', fo: 0.15, w: 1.4, layer: 'over' }); };
      drawNow(k);
      const ones = countOnes(hist[last].tape);
      const read = (t) => ctx.readout([{ k: T('step', 'ステップ'), v: `${t} / ${last}` }, { k: T('state', '状態'), v: hist[t].state === 'H' ? T('halted', '停止') : hist[t].state, tone: hist[t].state === 'H' ? 'good' : 'key' }, { k: T('1s on tape', 'テープ上の 1'), v: String(countOnes(hist[t].tape)) }, { k: T('final 1s', '最終的な 1'), v: String(ones) }], m.note[L.ja ? 1 : 0]);
      read(k);
      let first = true;
      ctx.state.anim = L.animator(ctx.host, (dt, t) => { if (first) { first = false; return; } const s = Math.min(last, Math.floor(t * (last > 40 ? 18 : 5))); drawTape(hist[s]); mark(nextKey(hist[s])); drawNow(s); read(s); if (s >= last) { ctx.set('step', s, true); return false; } }, { autoplay: false, once: true, playLabel: T('Run from the start', '最初から実行') });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('a 1 on the tape', 'テープ上の 1') }, { kind: 'fill', c: 'hl', label: T('where the head is at each step', '各ステップでのヘッドの位置') }]);
    },
  };

  /* ---------- 2. diagonal argument ---------- */
  D.halting = {
    render(ctx, v) {
      const st = ctx.state, n = v.size, key = `${n}|${v.seed}`;
      if (st.key !== key) { st.tab = haltTable(n, v.seed); st.key = key; st.sel = null; }
      const tab = st.tab, d = diagonal(tab);
      L.h('p', 'lab-cap', ctx.host, T('Rows are programs, columns are inputs. Click any cell to change it; click a row name to suppose D is that program.', '行はプログラム、列は入力です。マスをクリックすると変えられます。行名をクリックすると、D がそのプログラムだと仮定します。'));
      const f = L.fig(ctx.host, { x: [-1.9, n + 0.3], y: [-n - 2.2, 1.1], equal: true, maxH: 520, axes: false });
      const cellEl = (el, fn, label) => { el.style.cursor = 'pointer'; el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', label); el.addEventListener('click', fn); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); el.style.pointerEvents = 'all'; f.layers.ui.appendChild(el); };
      for (let j = 0; j < n; j++) f.text(j + 0.5, 0.45, String(j), { small: true, c: 'muted' });
      for (let i = 0; i < n; i++) {
        const lab = f.text(-0.9, -i - 0.5, `P${i}`, { c: st.sel === i ? 'hl' : 'ink', dy: 5 });
        const hit = f.rect(-1.8, -i - 1, 1.7, 1, { c: 'hl', fo: st.sel === i ? 0.2 : 0.001, nostroke: true });
        cellEl(hit, () => { st.sel = st.sel === i ? null : i; ctx.redraw(); }, T(`Suppose D is program ${i}`, `D がプログラム ${i} だと仮定する`));
        void lab;
        for (let j = 0; j < n; j++) {
          const h = tab[i][j], diag = i === j;
          const r = f.rect(j + 0.05, -i - 0.95, 0.9, 0.9, { c: h ? 'c3' : 'c2', fo: diag ? 0.5 : 0.22, w: diag ? 2.4 : 0.6, rx: 3 });
          if (diag) r.style.stroke = 'var(--lab-hl)';
          f.text(j + 0.5, -i - 0.5, h ? '✓' : '∞', { c: 'ink', dy: 5, small: !diag }).style.stroke = 'none';
          cellEl(r, () => { tab[i][j] = !tab[i][j]; ctx.redraw(); }, T(`Program ${i} on input ${j}: ${h ? 'halts' : 'loops'}`, `プログラム ${i}、入力 ${j}：${h ? '停止' : '無限ループ'}`));
        }
      }
      // D's row
      const yD = -n - 1.4;
      f.text(-0.9, yD + 0.5, 'D', { c: 'hl', dy: 5 });
      for (let j = 0; j < n; j++) {
        f.rect(j + 0.05, yD + 0.05, 0.9, 0.9, { c: d[j] ? 'c3' : 'c2', fo: 0.5, w: 2.2, rx: 3 });
        f.text(j + 0.5, yD + 0.5, d[j] ? '✓' : '∞', { c: 'ink', dy: 5 }).style.stroke = 'none';
        f.line([[j + 0.5, -j - 0.95], [j + 0.5, yD + 0.95]], { c: 'hl', w: 1, dash: '2 3', op: 0.6, layer: 'under' });
      }
      if (st.sel !== null) { const i = st.sel; f.rect(-0.05, -i - 1.02, n + 0.1, 1.04, { c: 'hl', fo: 0, w: 2.4, layer: 'over' }); f.rect(i - 0.02, yD - 0.02, 1.04, 1.04, { c: 'hl', fo: 0, w: 3, layer: 'over' }); }
      L.legend(ctx.host, [{ kind: 'fill', c: 'c3', label: T('✓ halts', '✓ 停止する') }, { kind: 'fill', c: 'c2', label: T('∞ runs forever', '∞ 永遠に動く') }, { kind: 'fill', c: 'hl', label: T('the diagonal, which D flips', 'D が反転させる対角線') }]);
      const diffs = tab.filter((row, i) => row[i] !== d[i]).length;
      const note = st.sel === null ? T('Every row disagrees with D somewhere: at its own diagonal cell. So D is none of the listed programs.', 'どの行も、どこかで D と食い違います。自分自身の対角線のマスでです。だから D は並んだどのプログラムでもありません。') : (() => { const i = st.sel, h = tab[i][i]; return T(`Suppose D is P${i}. The table says P${i} on input ${i} ${h ? 'halts' : 'runs forever'}; D on ${i} does the opposite and ${h ? 'runs forever' : 'halts'}. The same program cannot do both.`, `D が P${i} だと仮定します。表によると P${i} は入力 ${i} で${h ? '停止します' : '永遠に動きます'}。D は ${i} でその逆をして${h ? '永遠に動きます' : '停止します'}。同じプログラムが両方をすることはできません。`); })();
      ctx.readout([{ k: T('programs listed', '並べたプログラム'), v: String(n) }, { k: T('rows that differ from D', 'D と異なる行'), v: `${diffs} / ${n}`, tone: 'good' }, { k: T('where they differ', '異なる場所'), v: T('on the diagonal', '対角線上'), tone: 'key' }], note);
    },
  };

  /* ---------- 3. Goedel numbering ---------- */
  const PRESETS = [['0', '=', '0'], ['S', '0', '+', 'S', '0', '=', 'S', 'S', '0'], ['¬', '(', '0', '=', 'S', '0', ')'], ['∀', 'x', '(', 'x', '=', 'x', ')']];
  D.godel = {
    render(ctx, v) {
      const st = ctx.state;
      if (st.preset !== v.formula || !st.seq) { st.seq = PRESETS[v.formula].slice(); st.preset = v.formula; }
      const seq = st.seq, ps = primes(Math.max(1, seq.length)), g = seq.length ? godel(seq) : 1n, digits = g.toString();
      L.h('p', 'lab-cap', ctx.host, T('Build a formula: each symbol becomes a prime power, and the formula becomes their product', '式を組み立ててください。各記号が素数のべきになり、式はそれらの積になります'));
      const pal = L.h('div', 'lab-palette', ctx.host);
      Object.keys(CODES).forEach((s) => { const b = L.h('button', 'lab-sym', pal, s); b.type = 'button'; b.title = T(`code ${CODES[s]}`, `番号 ${CODES[s]}`); b.addEventListener('click', () => { if (st.seq.length < 12) { st.seq.push(s); ctx.redraw(); } }); });
      const del = L.h('button', 'lab-sym is-wide', pal, T('⌫ delete', '⌫ 削除')); del.type = 'button'; del.addEventListener('click', () => { st.seq.pop(); ctx.redraw(); });
      const clr = L.h('button', 'lab-sym is-wide', pal, T('clear', '消去')); clr.type = 'button'; clr.addEventListener('click', () => { st.seq = []; ctx.redraw(); });
      const n = Math.max(seq.length, 3);
      const f = L.fig(ctx.host, { x: [-0.2, n + 0.2], y: [-0.75, 2.4], equal: true, maxH: 230, axes: false });
      const toks = ['c1', 'c3', 'c2', 'c4'];
      seq.forEach((s, i) => {
        const c = toks[i % 4];
        f.rect(i + 0.06, 0.1, 0.88, 1.2, { c, fo: 0.2, w: 1.6, rx: 6 });
        f.text(i + 0.5, 0.7, s, { c: 'ink', dy: 7 }).style.stroke = 'none';
        f.text(i + 0.5, 0.28, String(CODES[s]), { small: true, c, dy: 4 }).style.stroke = 'none';
        f.text(i + 0.5, 1.75, `${ps[i]}^${CODES[s]}`, { small: true, c, dy: 4 });
      });
      if (!seq.length) f.text(n / 2, 0.7, T('empty formula', '空の式'), { c: 'muted', dy: 5 });
      // where the digits come from: log10 contributions as one stacked bar
      L.h('p', 'lab-cap', ctx.host, T('Where the digits come from: each symbol’s share of log₁₀ of the number', '桁数の内訳：数の log₁₀ に対する各記号の寄与'));
      const logs = seq.map((s, i) => CODES[s] * Math.log10(ps[i])), tot = logs.reduce((a, b) => a + b, 0);
      const b = L.fig(ctx.host, { x: [0, Math.max(10, tot * 1.04)], y: [0, 1], aspect: 0.1, minH: 90, maxH: 110, ylabel: '', ticksY: [], xlabel: T('decimal digits', '10 進の桁数') });
      let acc = 0; logs.forEach((w, i) => { b.rect(acc, 0.15, w, 0.7, { c: toks[i % 4], fo: 0.3, w: 1.2 }); if (w > tot * 0.05) b.text(acc + w / 2, 0.5, seq[i], { c: 'ink', dy: 5 }).style.stroke = 'none'; acc += w; });
      const shown = digits.length <= 64 ? digits : `${digits.slice(0, 30)}…${digits.slice(-30)}`;
      const box = L.h('div', 'lab-bignum', ctx.host);
      L.h('div', 'lab-bignum-k', box, T('Gödel number', 'ゲーデル数'));
      L.h('div', 'lab-bignum-v', box, shown);
      L.h('div', 'lab-bignum-k', box, seq.map((s, i) => `${ps[i]}^${CODES[s]}`).join(' · ') || '1');
      const back = seq.length ? decode(g) : [];
      ctx.readout([{ k: T('symbols', '記号数'), v: String(seq.length) }, { k: T('digits', '桁数'), v: String(digits.length), tone: 'key' }, { k: T('decoded by factorising', '素因数分解で復号'), v: back ? back.join(' ') || '∅' : '?', tone: back && back.join('') === seq.join('') ? 'good' : 'warn' }],
        T('Factorising recovers the formula exactly, so any question about formulas (is this a proof? does it end in this sentence?) becomes a question about whole numbers.', '素因数分解で式を正確に復元できるので、式についての問い（これは証明か、この文で終わるか）はすべて整数についての問いになります。'));
    },
  };
})();
