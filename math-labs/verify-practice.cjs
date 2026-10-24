// Fuzz every practice generator: node math-labs/verify-practice.cjs [slug ...] [--seeds=N] [--require-all]
// Each tier of each experiment is run for N seeds. A question fails if it throws, if any text is
// missing a language, carries NaN/undefined/an em-dash, has TeX that KaTeX cannot render, if its
// answer is not accepted by its own checker, or if a 'set' names a control the experiment lacks.
'use strict';
const fs = require('node:fs'), path = require('node:path');
const P = require('./practice.js');
globalThis.Practice = P;
const katex = require(path.join(__dirname, '../analysis-atlas/vendor/katex.min.js'));
const args = process.argv.slice(2);
const seeds = Number((args.find((a) => a.startsWith('--seeds=')) || '--seeds=120').split('=')[1]);
const requireAll = args.includes('--require-all');
const only = args.filter((a) => !a.startsWith('--'));
const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
const patches = {};
for (const f of fs.readdirSync(path.join(__dirname, 'content-patches'))) patches[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(__dirname, 'content-patches', f), 'utf8'));
const qdir = path.join(__dirname, 'questions');
let checks = 0, failures = [];
const fail = (where, msg) => { failures.push(`${where}: ${msg}`); };
const cjk = /[぀-ヿ㐀-鿿]/;
const texCache = new Map();
function texOK(s) {
  if (texCache.has(s)) return texCache.get(s);
  let ok = true;
  try { katex.renderToString(s, { throwOnError: true, displayMode: false, strict: 'ignore' }); } catch (e) { ok = e.message.slice(0, 160); }
  texCache.set(s, ok); return ok;
}
function textCheck(where, pair, label) {
  if (pair === undefined) return;
  if (!Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || typeof pair[1] !== 'string') { fail(where, `${label} is not an [en, ja] pair`); return; }
  const [en, ja] = pair;
  if (!en.trim() || !ja.trim()) fail(where, `${label} has an empty language`);
  if (ja.replace(/\$[^$]*\$/g, '').trim() && !cjk.test(ja) && /[a-z]{4,}/i.test(ja.replace(/\$[^$]*\$/g, ''))) fail(where, `${label} Japanese text looks untranslated: ${ja.slice(0, 60)}`);
  for (const s of pair) {
    if (/\bNaN\b|undefined|\[object |Infinity(?![a-z])/.test(s)) fail(where, `${label} contains NaN/undefined: ${s.slice(0, 90)}`);
    if (s.includes('—')) fail(where, `${label} contains an em-dash`);
    const n = (s.match(/\$/g) || []).length;
    if (n % 2) fail(where, `${label} has an unmatched $: ${s.slice(0, 90)}`);
    for (const m of s.matchAll(/\$([^$]+)\$/g)) { const r = texOK(m[1]); if (r !== true) fail(where, `${label} TeX error "${m[1].slice(0, 70)}": ${r}`); }
  }
  checks++;
}
const topics = content.map((t) => t.slug).filter((s) => !only.length || only.includes(s));
let missing = [];
for (const slug of topics) {
  const file = path.join(qdir, slug + '.js');
  const topic = content.find((t) => t.slug === slug);
  if (!fs.existsSync(file)) { missing.push(slug); continue; }
  globalThis.LabQuestions = {};
  require(file);
  const Q = globalThis.LabQuestions;
  for (const lab of topic.labs) {
    const gens = Q[lab.id];
    if (!gens) { fail(`${slug}/${lab.id}`, 'no generators'); continue; }
    if (gens.length !== 3 || gens.some((g) => typeof g !== 'function')) { fail(`${slug}/${lab.id}`, 'needs exactly three generator functions'); continue; }
    const params = (patches[slug]?.[lab.id]?.params) || lab.params;
    const pmap = Object.fromEntries(params.map((p) => [p[0], p]));
    for (let tier = 0; tier < 3; tier++) {
      const prompts = new Set();
      let errs = 0;
      for (let s = 1; s <= seeds && errs < 3; s++) {
        const where = `${slug}/${lab.id} tier ${tier + 1} seed ${s}`;
        let q;
        try { q = P.generate(gens, tier, s); } catch (e) { fail(where, 'threw ' + (e.stack || e).toString().split('\n').slice(0, 2).join(' ')); errs++; continue; }
        const before = failures.length;
        textCheck(where, q.q, 'q'); textCheck(where, q.hint, 'hint');
        if (!Array.isArray(q.sol) || !q.sol.length) fail(where, 'no solution steps'); else q.sol.forEach((st, i) => textCheck(where, st, `sol[${i}]`));
        prompts.add(q.q?.[0] + '|' + JSON.stringify(q.a?.v));
        const a = q.a || {};
        if (a.unit) textCheck(where, a.unit, 'unit');
        if (a.lhs) textCheck(where, a.lhs, 'lhs');
        if (a.show !== undefined) { const r = texOK(a.show); if (r !== true) fail(where, `show TeX error: ${r}`); }
        switch (a.type) {
          case 'num': if (!Number.isFinite(a.v)) fail(where, `answer not finite: ${a.v}`); else if (!P.check(a, String(a.v)).ok) fail(where, 'own answer rejected'); break;
          case 'int': if (!Number.isInteger(a.v)) fail(where, `int answer not an integer: ${a.v}`); else if (!P.check(a, String(a.v)).ok) fail(where, 'own answer rejected'); break;
          case 'tuple': if (!Array.isArray(a.v) || !a.v.every(Number.isFinite)) fail(where, 'tuple not finite'); else { if (!P.check(a, a.v.map(String)).ok) fail(where, 'own tuple rejected'); if (a.labels) a.labels.forEach((l, i) => (Array.isArray(l) ? textCheck(where, l, `label ${i}`) : textCheck(where, [l, l], `label ${i}`))); } break;
          case 'choice': {
            if (!Array.isArray(a.opts) || a.opts.length < 2) { fail(where, 'choice needs 2+ options'); break; }
            if (!(a.v >= 0 && a.v < a.opts.length)) fail(where, 'choice answer out of range');
            a.opts.forEach((o, i) => textCheck(where, o, `opt ${i}`));
            if (new Set(a.opts.map((o) => o[0])).size !== a.opts.length) fail(where, 'duplicate options');
            if (!P.check(a, a.v).ok) fail(where, 'own choice rejected');
            break;
          }
          case 'expr': {
            try { P.parse(a.v, a.vars); } catch (e) { fail(where, `answer expression does not parse: ${a.v}`); break; }
            if (!P.check(a, a.v).ok) fail(where, `own expression rejected (too few finite points?): ${a.v}`);
            const t = texOK(P.answerTeX(a)); if (t !== true) fail(where, `answer TeX: ${t}`);
            break;
          }
          default: fail(where, `unknown answer type ${a.type}`);
        }
        if (q.set) for (const [k, v] of Object.entries(q.set)) {
          const p = pmap[k];
          if (!p) fail(where, `set names unknown control "${k}"`);
          else if (!(v >= p[3] - 1e-9 && v <= p[4] + 1e-9)) fail(where, `set ${k}=${v} outside [${p[3]}, ${p[4]}]`);
        }
        if (failures.length > before) errs++;
        checks++;
      }
      if (prompts.size < Math.min(5, seeds)) fail(`${slug}/${lab.id} tier ${tier + 1}`, `only ${prompts.size} distinct questions in ${seeds} seeds`);
    }
  }
  for (const id of Object.keys(Q)) if (!topic.labs.some((l) => l.id === id)) fail(slug, `generators for unknown experiment ${id}`);
}
if (failures.length) {
  console.error(failures.slice(0, 60).join('\n'));
  console.error(`\n${failures.length} practice failures`);
  process.exit(1);
}
if (requireAll && missing.length) { console.error(`topics without questions: ${missing.join(', ')}`); process.exit(1); }
console.log(`${checks} practice checks passed across ${topics.length - missing.length} topics` + (missing.length ? ` (${missing.length} topics have no questions yet)` : ''));
