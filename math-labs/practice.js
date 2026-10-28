'use strict';
/* Practice: generated questions for the encyclopedia's experiments.
 *
 * Each experiment registers three generators, one per tier, in
 * window.LabQuestions[labId] = [warmUp, standard, challenge]. A generator is
 * a pure function of a seeded random source and returns
 *
 *   { q: [en, ja],                 prompt; $...$ is inline TeX
 *     a: answer spec (below),
 *     sol: [[en, ja], ...],        worked solution, one step per entry
 *     hint?: [en, ja],
 *     set?: { key: value } }       control values that show this case in the figure
 *
 * Answer specs:
 *   { type: 'num', v, rel?, tol?, unit?: [en, ja], show? }   typed numbers or constant expressions (1/3, 2pi, sqrt(2))
 *   { type: 'int', v, show? }                                exact integer
 *   { type: 'choice', opts: [[en, ja], ...], v: index, fixed? }
 *   { type: 'tuple', v: [...], labels: ['x','y'], rel?, tol? }
 *   { type: 'expr', v: 'x^2+1', vars: ['x'], dom?: {x:[a,b]}, const?: true, show? }
 *       symbolic, checked by evaluating both sides at random points;
 *       const: true accepts any answer differing by a constant (antiderivatives)
 *
 * The core (rng, expression parser, checker, helpers) has no DOM dependency
 * and is exported for Node, where verify-practice.cjs fuzzes every generator.
 */
(function (root) {
  const TAU = 2 * Math.PI;

  /* ---------- seeded random source ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const u = mulberry32(seed);
    const r = {
      seed,
      u,
      real: (a, b, d) => { const x = a + (b - a) * u(); return d === undefined ? x : Number(x.toFixed(d)); },
      int: (a, b) => a + Math.floor(u() * (b - a + 1)),
      nz: (a, b) => { let x = 0; while (x === 0) x = a + Math.floor(u() * (b - a + 1)); return x; },
      sign: () => (u() < 0.5 ? -1 : 1),
      chance: (p) => u() < p,
      pick: (arr) => arr[Math.floor(u() * arr.length)],
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      sample: (arr, k) => r.shuffle(arr).slice(0, k),
      step: (a, b, s) => { const n = Math.round((b - a) / s); return Number((a + s * Math.floor(u() * (n + 1))).toFixed(10)); },
    };
    return r;
  }

  /* ---------- expressions ---------- */
  const FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
    asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, arsinh: Math.asinh, arcosh: Math.acosh, artanh: Math.atanh,
    exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, lg: Math.log10, log2: Math.log2,
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil,
  };
  const GREEK = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω', xi: 'ξ', eta: 'η', zeta: 'ζ', psi: 'ψ' };
  const GREEK_BACK = Object.fromEntries(Object.entries(GREEK).map(([k, v]) => [v, k]));
  const FUNC_NAMES = Object.keys(FUNCS).sort((a, b) => b.length - a.length);
  const GREEK_NAMES = Object.keys(GREEK).sort((a, b) => b.length - a.length);

  function tokenize(src, vars) {
    const s = String(src)
      .replace(/[−–]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3').replace(/\*\*/g, '^')
      .replace(/[θαβγδεκλμνρστφωξηζψ]/g, (c) => GREEK_BACK[c] || c);
    const out = [];
    const multi = (vars || []).filter((v) => v.length > 1).sort((a, b) => b.length - a.length);
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (num && /[\d.]/.test(c)) {
        let text = num[0];
        // "2e" with no exponent digits is 2·e, handled by the letter branch
        out.push({ t: 'num', v: Number(text) }); i += text.length; continue;
      }
      if (/[a-z_]/i.test(c)) {
        let run = /^[a-z_][a-z0-9_]*/i.exec(s.slice(i))[0];
        // split a run like "2xsinx" into known pieces, longest first
        let j = 0;
        while (j < run.length) {
          const rest = run.slice(j);
          let m = multi.find((v) => rest.startsWith(v));
          if (m) { out.push({ t: 'id', v: m }); j += m.length; continue; }
          m = FUNC_NAMES.find((f) => rest.toLowerCase().startsWith(f));
          if (m) { out.push({ t: 'fn', v: m }); j += m.length; continue; }
          m = GREEK_NAMES.find((g) => rest.startsWith(g));
          if (m) { out.push({ t: 'id', v: m }); j += m.length; continue; }
          if (rest.startsWith('pi')) { out.push({ t: 'id', v: 'pi' }); j += 2; continue; }
          if (/\d/.test(rest[0])) { const d = /^\d+/.exec(rest)[0]; out.push({ t: 'num', v: Number(d) }); j += d.length; continue; }
          if (rest[0] === '_') throw new Error('subscript');
          out.push({ t: 'id', v: rest[0] }); j += 1;
        }
        i += run.length; continue;
      }
      if ('+-*/^()|!,[]'.includes(c)) { out.push({ t: c === '[' ? '(' : c === ']' ? ')' : c }); i++; continue; }
      throw new Error('char ' + c);
    }
    return out;
  }

  function parse(src, vars = []) {
    const toks = tokenize(src, vars);
    let p = 0;
    const peek = () => toks[p];
    const eat = (t) => { if (toks[p] && toks[p].t === t) { p++; return true; } return false; };
    const startsAtom = (tk) => tk && (tk.t === 'num' || tk.t === 'id' || tk.t === 'fn' || tk.t === '(');
    function sum() {
      let a = prod();
      for (;;) {
        if (eat('+')) a = { op: '+', a, b: prod() };
        else if (eat('-')) a = { op: '-', a, b: prod() };
        else return a;
      }
    }
    function prod() {
      let a = unary();
      for (;;) {
        if (eat('*')) a = { op: '*', a, b: unary() };
        else if (eat('/')) a = { op: '/', a, b: unary() };
        else if (startsAtom(peek())) a = { op: '*', a, b: pow(), imp: true };
        else return a;
      }
    }
    function unary() {
      if (eat('-')) return { op: 'neg', a: unary() };
      if (eat('+')) return unary();
      return pow();
    }
    function pow() {
      const base = postfix();
      if (eat('^')) return { op: '^', a: base, b: unary() };
      return base;
    }
    function postfix() {
      let a = atom();
      while (eat('!')) a = { op: '!', a };
      return a;
    }
    function atom() {
      const tk = toks[p++];
      if (!tk) throw new Error('end');
      if (tk.t === 'num') return { num: tk.v };
      if (tk.t === 'id') {
        if (tk.v === 'pi') return { con: 'pi' };
        if (tk.v === 'e' && !vars.includes('e')) return { con: 'e' };
        if (!vars.includes(tk.v)) throw new Error('unknown ' + tk.v);
        return { v: tk.v };
      }
      if (tk.t === 'fn') {
        let power = null;
        if (eat('^')) power = unary_small();
        let arg;
        if (peek() && peek().t === '(') { p++; arg = sum(); if (!eat(')')) throw new Error('paren'); }
        else arg = pow();
        const node = { fn: tk.v, a: arg };
        return power ? { op: '^', a: node, b: power } : node;
      }
      if (tk.t === '(') { const e = sum(); if (!eat(')')) throw new Error('paren'); return { op: '()', a: e }; }
      if (tk.t === '|') { const e = sum(); if (!eat('|')) throw new Error('bar'); return { fn: 'abs', a: e }; }
      throw new Error('token ' + tk.t);
    }
    function unary_small() { if (eat('-')) return { op: 'neg', a: postfix() }; return postfix(); }
    const tree = sum();
    if (p < toks.length) throw new Error('trailing');
    return tree;
  }

  function fact(n) { if (n < 0 || !Number.isInteger(n) || n > 170) return NaN; let r = 1; for (let k = 2; k <= n; k++) r *= k; return r; }
  function evaluate(node, env = {}) {
    if ('num' in node) return node.num;
    if (node.con) return node.con === 'pi' ? Math.PI : Math.E;
    if (node.v) return env[node.v];
    if (node.fn) return FUNCS[node.fn](evaluate(node.a, env));
    const a = evaluate(node.a, env);
    switch (node.op) {
      case '()': return a;
      case 'neg': return -a;
      case '!': return fact(a);
      case '+': return a + evaluate(node.b, env);
      case '-': return a - evaluate(node.b, env);
      case '*': return a * evaluate(node.b, env);
      case '/': return a / evaluate(node.b, env);
      case '^': { const b = evaluate(node.b, env); if (a < 0 && !Number.isInteger(b)) { const q = Math.round(1 / b); if (Math.abs(1 / b - q) < 1e-9 && q % 2) return -Math.pow(-a, b); } return Math.pow(a, b); }
    }
    return NaN;
  }

  const TEXFN = { sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot', asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', exp: '\\exp', ln: '\\ln', log: '\\log', lg: '\\log_{10}', log10: '\\log_{10}', log2: '\\log_2' };
  function toTeX(node) {
    const prec = (n) => (n.op === '+' || n.op === '-') ? 1 : (n.op === '*' || n.op === '/') ? 2 : n.op === 'neg' ? 2.5 : n.op === '^' ? 3 : 4;
    const wrap = (n, min) => (prec(n) < min ? `\\left(${toTeX(n)}\\right)` : toTeX(n));
    if ('num' in node) return fmtNum(node.num, 8);
    if (node.con) return node.con === 'pi' ? '\\pi' : 'e';
    if (node.v) return GREEK[node.v] ? '\\' + node.v : node.v;
    if (node.fn === 'sqrt') return `\\sqrt{${toTeX(node.a)}}`;
    if (node.fn === 'cbrt') return `\\sqrt[3]{${toTeX(node.a)}}`;
    if (node.fn === 'abs') return `\\left|${toTeX(node.a)}\\right|`;
    if (node.fn) return `${TEXFN[node.fn] || '\\operatorname{' + node.fn + '}'}\\left(${toTeX(node.a)}\\right)`;
    switch (node.op) {
      case '()': return `\\left(${toTeX(node.a)}\\right)`;
      case 'neg': return '-' + wrap(node.a, 2.5);
      case '!': return wrap(node.a, 4) + '!';
      case '+': return `${toTeX(node.a)} + ${wrap(node.b, 1)}`;
      case '-': return `${toTeX(node.a)} - ${wrap(node.b, 2)}`;
      case '*': {
        const l = wrap(node.a, 2), r = wrap(node.b, 2.5);
        const needDot = 'num' in node.b || (node.b.op === '^' && 'num' in node.b.a) || (node.b.op === 'neg');
        return needDot ? `${l} \\cdot ${r}` : `${l}\\,${r}`;
      }
      case '/': return `\\frac{${toTeX(node.a.op === '()' ? node.a.a : node.a)}}{${toTeX(node.b.op === '()' ? node.b.a : node.b)}}`;
      case '^': return `{${wrap(node.a, 4)}}^{${toTeX(node.b.op === '()' ? node.b.a : node.b)}}`;
    }
    return '?';
  }

  /* ---------- formatting helpers for generators ---------- */
  function fmtNum(x, d = 4) {
    if (!Number.isFinite(x)) return x > 0 ? '\\infty' : x < 0 ? '-\\infty' : '\\text{n/a}';
    if (x === 0 || Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    if (a >= 1e6 || a < 1e-4) {
      const [m, e] = x.toExponential(Math.max(1, d - 1)).split('e');
      return `${Number(m)} \\times 10^{${Number(e)}}`;
    }
    const s = Number(x.toFixed(d));
    return String(s === 0 ? Number(x.toPrecision(Math.max(1, d))) : s);
  }
  /* significant figures, for physical quantities */
  function sig(x, n = 3) {
    if (!Number.isFinite(x)) return fmtNum(x);
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) { const [m, e] = x.toExponential(n - 1).split('e'); return `${m} \\times 10^{${Number(e)}}`; }
    return String(Number(x.toPrecision(n)));
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function frac(p, q, display) {
    if (q < 0) { p = -p; q = -q; }
    const g = gcd(p, q) || 1; p /= g; q /= g;
    if (q === 1) return String(p);
    const f = display ? '\\dfrac' : '\\tfrac';
    return (p < 0 ? '-' : '') + `${f}{${Math.abs(p)}}{${q}}`;
  }
  /* polynomial / linear-combination writer: terms [[coef, 'x^2'], [coef, 'x'], [coef, '']] */
  function terms(list, opt = {}) {
    let out = '';
    for (const [c0, m] of list) {
      const c = typeof c0 === 'number' ? c0 : c0;
      if (typeof c === 'number' && Math.abs(c) < 1e-14) continue;
      const neg = typeof c === 'number' ? c < 0 : String(c).startsWith('-');
      const mag = typeof c === 'number' ? Math.abs(c) : String(c).replace(/^-/, '');
      let body;
      if (m === '' || m === undefined) body = typeof mag === 'number' ? fmtNum(mag, opt.d ?? 4) : mag;
      else if (mag === 1 || mag === '1') body = m;
      else body = (typeof mag === 'number' ? fmtNum(mag, opt.d ?? 4) : mag) + (opt.dot ? ' \\cdot ' : '') + m;
      if (!out) out = (neg ? '-' : '') + body;
      else out += (neg ? ' - ' : ' + ') + body;
    }
    return out || '0';
  }
  /* matrix in TeX */
  function mat(rows, br = 'pmatrix', d = 4) {
    return `\\begin{${br}}${rows.map((r) => r.map((x) => (typeof x === 'number' ? fmtNum(x, d) : x)).join(' & ')).join(' \\\\ ')}\\end{${br}}`;
  }
  const deg = (rad) => rad * 180 / Math.PI;

  /* ---------- checking ---------- */
  function parseNumber(text) {
    const s = String(text).trim().replace(/,(?=\d{3}\b)/g, '').replace(/%$/, 'e-2');
    if (!s) return { err: 'empty' };
    try {
      const tree = parse(s, []);
      const v = evaluate(tree, {});
      if (!Number.isFinite(v)) return { err: 'nan' };
      return { v, tree };
    } catch (e) { return { err: 'syntax' }; }
  }
  function closeEnough(u, v, a) {
    const tol = a.tol ?? 0;
    const rel = a.rel ?? (a.tol !== undefined ? 0 : 0.005);
    return Math.abs(u - v) <= Math.max(tol, rel * Math.abs(v), 1e-9);
  }
  /* sample points for symbolic comparison: deterministic per answer */
  function points(a, k = 10) {
    const r = rng(0x5eed + (a.v || '').length * 31);
    const pts = [];
    for (let i = 0; i < k * 3 && pts.length < k; i++) {
      const env = {};
      for (const name of a.vars) { const [lo, hi] = (a.dom && a.dom[name]) || [0.35, 2.15]; env[name] = lo + (hi - lo) * r.u(); }
      pts.push(env);
    }
    return pts;
  }
  function exprEqual(userTree, a) {
    const ref = parse(a.v, a.vars);
    let used = 0, offset = null;
    for (const env of points(a, 12)) {
      const x = evaluate(ref, env), y = evaluate(userTree, env);
      if (!Number.isFinite(x)) continue;
      if (!Number.isFinite(y)) return false;
      used++;
      if (a.const) {
        const d = y - x;
        if (offset === null) { offset = d; continue; }
        if (Math.abs(d - offset) > 1e-6 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
      } else if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x))) return false;
    }
    return used >= 4;
  }
  /* returns { ok, err?, parsed? } where parsed is TeX of what was read */
  function check(a, input) {
    if (a.type === 'choice') return { ok: Number(input) === a.v };
    if (a.type === 'tuple') {
      const res = input.map((t) => parseNumber(t));
      if (res.some((x) => x.err)) return { ok: false, err: res.find((x) => x.err).err };
      const each = res.map((x, i) => closeEnough(x.v, a.v[i], a));
      return { ok: each.every(Boolean), each };
    }
    if (a.type === 'expr') {
      let tree;
      try { tree = parse(String(input).replace(/^\s*[a-zA-Z]\s*(\([a-z]\))?\s*=/, ''), a.vars); } catch (e) { return { ok: false, err: 'syntax' }; }
      return { ok: exprEqual(tree, a), parsed: toTeX(tree) };
    }
    const n = parseNumber(input);
    if (n.err) return { ok: false, err: n.err };
    if (a.type === 'int') return { ok: Math.abs(n.v - a.v) < 1e-9 };
    return { ok: closeEnough(n.v, a.v, a) };
  }
  function answerTeX(a) {
    if (a.show) return a.show;
    if (a.type === 'num') return fmtNum(a.v, 4);
    if (a.type === 'int') return String(a.v);
    if (a.type === 'tuple') return '\\left(' + a.v.map((x) => fmtNum(x, 4)).join(',\\ ') + '\\right)';
    if (a.type === 'expr') { try { return toTeX(parse(a.v, a.vars)); } catch (e) { return a.v; } }
    return '';
  }

  const TIERS = [['Warm-up', '基礎'], ['Standard', '標準'], ['Challenge', '発展']];
  function generate(gens, tier, seed) {
    const r = rng(seed * 3 + tier + 1);
    const q = gens[tier](r);
    if (q.a.type === 'choice' && !q.a.fixed) {
      const order = r.shuffle(q.a.opts.map((_, i) => i));
      q.a = { ...q.a, opts: order.map((i) => q.a.opts[i]), v: order.indexOf(q.a.v) };
    }
    return q;
  }

  const core = { rng, parse, evaluate, toTeX, check, closeEnough, parseNumber, answerTeX, exprEqual, generate, TIERS, util: { fmtNum, sig, frac, terms, mat, gcd, deg, TAU } };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return; }

  /* ================= browser UI ================= */
  const doc = root.document;
  const ja = doc.documentElement.lang === 'ja';
  const T = (en, jp) => (ja ? jp : en);
  const L = (pair) => (Array.isArray(pair) ? pair[ja ? 1 : 0] : String(pair));
  const h = (tag, cls, parent, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; if (parent) parent.appendChild(n); return n; };

  function renderMath(node, text) {
    node.replaceChildren();
    const parts = String(text).split(/(\$[^$]+\$)/g);
    let lastMath = null;
    for (let part of parts) {
      if (!part) continue;
      // keep punctuation that follows a formula on the same line as it
      if (lastMath && /^[.,;:!?)、。，．）]/.test(part)) { const m = /^[.,;:!?)、。，．）]+/.exec(part)[0]; lastMath.append(doc.createTextNode(m)); part = part.slice(m.length); if (!part) continue; }
      lastMath = null;
      if (part.length > 2 && part[0] === '$' && part.at(-1) === '$') {
        const wrapSpan = h('span', 'pr-mw', node);
        lastMath = wrapSpan;
        const span = h('span', 'pr-m', wrapSpan);
        const tex = part.slice(1, -1);
        if (root.katex) { try { root.katex.render(tex, span, { throwOnError: false, displayMode: false }); continue; } catch (e) { /* fall through */ } }
        span.textContent = tex.replace(/\\[a-z]+/gi, (m) => m.slice(1)).replace(/[{}]/g, '');
        span.dataset.tex = '';
        span.dataset.raw = tex;
      } else node.append(doc.createTextNode(part));
    }
  }
  const pending = new Set();
  function rerenderLater() { for (const n of pending) { if (n.isConnected && root.katex && n.__text) renderMath(n, n.__text); } pending.clear(); }
  function math(node, text) { node.__text = text; renderMath(node, text); if (!root.katex) pending.add(node); }
  root.addEventListener?.('load', rerenderLater);

  const store = {
    get(k) { try { return JSON.parse(root.localStorage.getItem('isegoria.practice.' + k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { root.localStorage.setItem('isegoria.practice.' + k, JSON.stringify(v)); } catch (e) { /* storage off */ } },
  };

  const HELP_EXPR = T('Type an expression: ^ for powers, * optional, sqrt( ), exp( ), ln( ), sin( ), pi.', '式を入力してください。累乗は ^、掛け算の * は省略可、sqrt( )、exp( )、ln( )、sin( )、pi が使えます。');
  const HELP_NUM = T('A number or exact value: 0.75, 3/4, 2pi, sqrt(2)/2, 1.6e-19.', '数値または厳密値で入力できます。例：0.75、3/4、2pi、sqrt(2)/2、1.6e-19');

  function mount(holder, gens, opts = {}) {
    if (!gens || gens.length < 3 || holder.__practice) return;
    holder.__practice = true;
    const id = holder.dataset.practice;
    const section = holder.closest('[data-lab]') || holder.closest('section') || holder;
    const getCtx = () => section.__ctx || (section.__getCtx ? section.__getCtx() : null);
    const params = new URLSearchParams(root.location.search);
    const key = id + '.q';
    let tier = 1, seed = (Math.random() * 1e9) >>> 0;
    const saved = params.get(key);
    if (saved && /^[0-2]-\d+$/.test(saved)) { tier = Number(saved[0]); seed = Number(saved.slice(2)); }
    else { const pref = store.get('tier'); if (pref !== null && pref >= 0 && pref <= 2) tier = pref; }

    holder.replaceChildren();
    holder.classList.add('is-live');
    holder.setAttribute('data-ig-no-math', '');
    const head = h('div', 'pr-head', holder);
    h('h3', 'pr-title', head, T('Practice', '練習問題'));
    const seg = h('div', 'pr-tiers', head); seg.setAttribute('role', 'radiogroup'); seg.setAttribute('aria-label', T('Difficulty', '難易度'));
    const tierBtns = TIERS.map((t, i) => { const b = h('button', '', seg, L(t)); b.type = 'button'; b.setAttribute('role', 'radio'); b.addEventListener('click', () => { tier = i; store.set('tier', i); fresh(); }); return b; });
    const tally = h('span', 'pr-tally', head);
    const qBox = h('div', 'pr-q', holder);
    const form = h('form', 'pr-form', holder); form.noValidate = true;
    const feedback = h('p', 'pr-feedback', holder); feedback.setAttribute('aria-live', 'polite');
    const actions = h('div', 'pr-actions', holder);
    const bHint = h('button', 'pr-ghost', actions, T('Hint', 'ヒント')); bHint.type = 'button';
    const bSol = h('button', 'pr-ghost', actions, T('Show solution', '解答を見る')); bSol.type = 'button';
    const bShow = h('button', 'pr-ghost', actions, T('Show in the figure', '図で確かめる')); bShow.type = 'button';
    const bNew = h('button', 'pr-new', actions, T('New question', '次の問題')); bNew.type = 'button';
    const hintBox = h('p', 'pr-hint', holder); hintBox.hidden = true;
    const sol = h('ol', 'pr-sol', holder); sol.hidden = true;

    let q = null, inputs = [], answered = false, revealed = false;
    const statsKey = 'stats.' + id;
    const paintTally = () => {
      const s = store.get(statsKey) || { right: 0, tried: 0, streak: 0 };
      tally.textContent = s.tried ? T(`${s.right} of ${s.tried} correct${s.streak > 1 ? ` · streak ${s.streak}` : ''}`, `${s.tried}問中${s.right}問正解${s.streak > 1 ? `・${s.streak}連続` : ''}`) : '';
    };
    const record = (ok) => {
      const s = store.get(statsKey) || { right: 0, tried: 0, streak: 0 };
      s.tried++; if (ok) { s.right++; s.streak++; } else s.streak = 0;
      store.set(statsKey, s); paintTally();
    };
    function writeURL() {
      try { const url = new URL(root.location.href); url.searchParams.set(key, `${tier}-${seed}`); root.history.replaceState(null, '', url); doc.querySelectorAll('a[hreflang]').forEach((a) => { try { const u = new URL(a.href); u.search = root.location.search; a.href = u.href; } catch (e) { /* ignore */ } }); } catch (e) { /* ignore */ }
    }
    function fresh() { seed = (Math.random() * 1e9) >>> 0; build(); writeURL(); }
    function build() {
      tierBtns.forEach((b, i) => b.setAttribute('aria-checked', String(i === tier)));
      try { q = generate(gens, tier, seed); } catch (e) { console.error(id, e); qBox.textContent = T('This question could not be generated. Try another.', 'この問題を生成できませんでした。次の問題をお試しください。'); return; }
      answered = false; revealed = false;
      holder.classList.remove('is-right', 'is-wrong');
      math(qBox, L(q.q));
      form.replaceChildren(); inputs = [];
      feedback.textContent = ''; feedback.className = 'pr-feedback';
      hintBox.hidden = true; bHint.hidden = !q.hint; sol.hidden = true; bSol.textContent = T('Show solution', '解答を見る');
      bShow.hidden = !(q.set && getCtx());
      const a = q.a;
      if (a.type === 'choice') {
        const list = h('div', 'pr-choices', form); list.setAttribute('role', 'radiogroup');
        a.opts.forEach((o, i) => {
          const lab = h('label', 'pr-choice', list);
          const inp = h('input', '', lab); inp.type = 'radio'; inp.name = id + '-c'; inp.value = String(i);
          const span = h('span', 'pr-choice-t', lab); math(span, L(o));
          inp.addEventListener('change', () => { list.querySelectorAll('.pr-choice').forEach((x) => x.classList.toggle('is-picked', x.querySelector('input').checked)); });
          inputs.push(inp);
        });
      } else if (a.type === 'tuple') {
        const row = h('div', 'pr-tuple', form);
        a.v.forEach((_, i) => {
          const lab = h('label', 'pr-field', row);
          math(h('span', 'pr-field-k', lab), L(a.labels?.[i] ?? `$x_${i + 1}$`));
          const inp = h('input', 'pr-input', lab); inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.spellcheck = false;
          inputs.push(inp);
        });
        if (a.unit) math(h('span', 'pr-unit', row), L(a.unit));
      } else {
        const row = h('div', 'pr-line', form);
        if (a.lhs) math(h('span', 'pr-lhs', row), L(a.lhs));
        const inp = h('input', 'pr-input' + (a.type === 'expr' ? ' is-expr' : ''), row);
        inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', T('Your answer', '解答'));
        if (a.type !== 'expr') inp.inputMode = 'text';
        if (a.unit) math(h('span', 'pr-unit', row), L(a.unit));
        inputs.push(inp);
        const help = h('p', 'pr-help', form, a.type === 'expr' ? HELP_EXPR : (a.type === 'num' ? HELP_NUM : ''));
        if (a.type === 'expr') {
          const prev = h('p', 'pr-preview', form);
          inp.addEventListener('input', () => {
            if (!inp.value.trim()) { prev.textContent = ''; return; }
            try { const tree = parse(inp.value.replace(/^\s*[a-zA-Z]\s*(\([a-z]\))?\s*=/, ''), a.vars); math(prev, T('Reads as ', '読み取り：') + '$' + toTeX(tree) + '$'); prev.classList.remove('is-bad'); }
            catch (e) { prev.textContent = T('Not yet a complete expression', 'まだ式として読めません'); prev.classList.add('is-bad'); }
          });
        }
        void help;
      }
      const bCheck = h('button', 'pr-check', form, T('Check', '答え合わせ')); bCheck.type = 'submit';
      paintTally();
      if (opts.autofocus) inputs[0]?.focus();
    }
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      if (!q) return;
      const a = q.a;
      let value;
      if (a.type === 'choice') { const pick = inputs.find((x) => x.checked); if (!pick) { feedback.textContent = T('Pick an option first.', '選択肢を選んでください。'); return; } value = pick.value; }
      else if (a.type === 'tuple') value = inputs.map((x) => x.value);
      else value = inputs[0].value;
      if (a.type !== 'choice' && (Array.isArray(value) ? value.some((v) => !v.trim()) : !value.trim())) { feedback.textContent = T('Enter an answer first.', '解答を入力してください。'); return; }
      const res = check(a, value);
      if (res.err === 'syntax' || res.err === 'nan') { feedback.className = 'pr-feedback is-bad'; feedback.textContent = T('That could not be read as a number or expression.', '数値または式として読み取れませんでした。'); return; }
      if (!answered && !revealed) record(res.ok);
      answered = true;
      holder.classList.toggle('is-right', res.ok); holder.classList.toggle('is-wrong', !res.ok);
      feedback.className = 'pr-feedback ' + (res.ok ? 'is-good' : 'is-bad');
      if (res.ok) math(feedback, T('Correct. ', '正解です。') + (a.type === 'num' || a.type === 'expr' ? T('Exact value: ', '厳密値：') + '$' + answerTeX(a) + '$' : ''));
      else if (a.type === 'tuple' && res.each) feedback.textContent = T(`${res.each.filter(Boolean).length} of ${res.each.length} components are right. Try again, or open the solution.`, `${res.each.length}個中${res.each.filter(Boolean).length}個が正解です。もう一度考えるか、解答を開いてください。`);
      else feedback.textContent = T('Not quite. Try again, take the hint, or open the solution.', '惜しいです。もう一度考えるか、ヒントか解答を見てください。');
      if (a.type === 'choice') form.querySelectorAll('.pr-choice').forEach((x, i) => { x.classList.toggle('is-answer', i === a.v && res.ok); });
    });
    bHint.addEventListener('click', () => { if (!q?.hint) return; hintBox.hidden = !hintBox.hidden; if (!hintBox.hidden) math(hintBox, L(q.hint)); });
    bSol.addEventListener('click', () => {
      if (!q) return;
      if (!sol.hidden) { sol.hidden = true; bSol.textContent = T('Show solution', '解答を見る'); return; }
      if (!answered) revealed = true;
      sol.replaceChildren();
      for (const step of q.sol || []) math(h('li', '', sol), L(step));
      const a = q.a;
      const fin = h('li', 'pr-final', sol);
      if (a.type === 'choice') math(fin, T('Answer: ', '答え：') + L(a.opts[a.v]));
      else math(fin, T('Answer: ', '答え：') + '$' + answerTeX(a) + '$' + (a.unit ? ' ' + L(a.unit) : ''));
      if (a.type === 'choice') form.querySelectorAll('.pr-choice').forEach((x, i) => x.classList.toggle('is-answer', i === a.v));
      sol.hidden = false; bSol.textContent = T('Hide solution', '解答を閉じる');
    });
    bShow.addEventListener('click', () => {
      const ctx = getCtx(); if (!ctx || !q?.set) return;
      const entries = Object.entries(q.set);
      entries.forEach(([k, v], i) => ctx.set(k, v, i < entries.length - 1));
      section.querySelector('.plot')?.scrollIntoView({ behavior: root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    });
    bNew.addEventListener('click', fresh);
    build();
  }

  function mountAll(scope) {
    const Q = root.LabQuestions || {};
    (scope || doc).querySelectorAll('[data-practice]').forEach((el) => mount(el, Q[el.dataset.practice]));
  }
  root.Practice = { ...core, mount, mountAll, math };
  const me = doc.currentScript;
  if (me && me.hasAttribute('data-auto')) {
    const go = () => mountAll();
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', go); else go();
  }
})(typeof window !== 'undefined' ? window : globalThis);
