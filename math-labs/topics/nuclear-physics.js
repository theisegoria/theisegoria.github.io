'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- model (pure, checked by checks/nuclear-physics.cjs); MeV, fm, seconds ---------- */
  // semi-empirical mass formula (Krane's coefficients)
  const AV = 15.75, AS = 17.8, AC = 0.711, AA = 23.7, AP = 11.18;
  function semf(A, Z) {
    if (A < 1 || Z < 0 || Z > A) return null;
    const N = A - Z, vol = AV * A, surf = AS * Math.cbrt(A * A), coul = (AC * Z * (Z - 1)) / Math.cbrt(A), asym = (AA * (N - Z) ** 2) / A;
    const pair = Z % 2 === 0 && N % 2 === 0 ? AP / Math.sqrt(A) : Z % 2 === 1 && N % 2 === 1 ? -AP / Math.sqrt(A) : 0;
    return { vol, surf, coul, asym, pair, B: vol - surf - coul - asym + pair };
  }
  const B = (A, Z) => { const r = semf(A, Z); return r ? r.B : -Infinity; };
  // the bottom of the valley of stability: dB/dZ = 0 (pairing ignored)
  const zValley = (A) => (4 * AA + AC / Math.cbrt(A)) / ((2 * AC) / Math.cbrt(A) + (8 * AA) / A);
  const MP = 938.272, MN = 939.565, ME = 0.511, MHE4B = 28.2957; // MeV; binding energy of helium‑4 (measured)
  const atomicMass = (A, Z) => Z * (MP + ME) + (A - Z) * MN - B(A, Z);
  const Sn = (A, Z) => B(A, Z) - B(A - 1, Z), Sp = (A, Z) => B(A, Z) - B(A - 1, Z - 1);
  const Qalpha = (A, Z) => B(A - 4, Z - 2) + MHE4B - B(A, Z);
  const bound = (A, Z) => A >= 2 && Z >= 1 && A - Z >= 0 && B(A, Z) > 0 && Sn(A, Z) > 0 && Sp(A, Z) > 0;
  function betaStable(A, Z) { const m = atomicMass(A, Z); return !(Z > 1 && atomicMass(A, Z - 1) < m) && !(Z < A && atomicMass(A, Z + 1) < m); }
  // measured binding energy per nucleon (AME2020), MeV
  const MEAS = [[2, 1, 1.112], [4, 2, 7.074], [7, 3, 5.606], [12, 6, 7.680], [16, 8, 7.976], [20, 10, 8.032], [40, 20, 8.551], [56, 26, 8.790], [62, 28, 8.795], [84, 36, 8.717], [120, 50, 8.505], [138, 56, 8.393], [208, 82, 7.868], [238, 92, 7.570]];

  // decay chain A → B → C, Bateman solution with N_A(0) = 1
  function bateman(la, lb, t) {
    const NA = Math.exp(-la * t), NB = Math.abs(lb - la) < 1e-12 * lb ? la * t * Math.exp(-la * t) : (la / (lb - la)) * (Math.exp(-la * t) - Math.exp(-lb * t));
    return { NA, NB, NC: 1 - NA - NB };
  }
  const tMaxDaughter = (la, lb) => (Math.abs(lb - la) < 1e-9 * lb ? 1 / la : Math.log(lb / la) / (lb - la));
  // Monte Carlo: exact decay times of n atoms (seeded)
  function decayTimes(n, la, lb, seed = 11) { let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const out = []; for (let i = 0; i < n; i++) { const ta = -Math.log(1 - r()) / la, tb = ta - Math.log(1 - r()) / lb; out.push([ta, tb]); } return out; }

  // alpha decay: Gamow factor for a Coulomb barrier, assault frequency v/2R
  const HC = 197.327, KE = 1.439964, MALPHA = 3727.379, U = 931.494, R0 = 1.2;
  function alpha(Z, A, Q) {
    const Zd = Z - 2, Ad = A - 4, Md = Ad * U, mu = (MALPHA * Md) / (MALPHA + Md), R = R0 * (Math.cbrt(Ad) + Math.cbrt(4)), b = (2 * Zd * KE) / Q, x = Math.min(1, R / b);
    const G = ((2 * Math.sqrt(2 * mu * Q)) / HC) * b * (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
    const v = Math.sqrt((2 * Q) / mu) * 2.99792458e23, f = v / (2 * R), P = Math.exp(-G);
    return { Zd, mu, R, b, G, P, f, VR: (2 * Zd * KE) / R, thalf: Math.log(2) / (f * P) };
  }
  // measured ground-state alpha emitters: [symbol, Z, A, Q (MeV), half-life (s)]
  const YEAR = 3.15576e7, DAY = 86400;
  const ALPHAS = [['Po', 84, 210, 5.407, 138.376 * DAY], ['Po', 84, 212, 8.954, 2.99e-7], ['Po', 84, 214, 7.833, 1.643e-4], ['Po', 84, 216, 6.906, 0.145], ['Po', 84, 218, 6.115, 185.9], ['Rn', 86, 220, 6.405, 55.6], ['Rn', 86, 222, 5.590, 3.8235 * DAY], ['Ra', 88, 224, 5.789, 3.6319 * DAY], ['Ra', 88, 226, 4.871, 1600 * YEAR], ['Th', 90, 228, 5.520, 1.9116 * YEAR], ['Th', 90, 230, 4.770, 7.54e4 * YEAR], ['Th', 90, 232, 4.083, 1.40e10 * YEAR], ['U', 92, 234, 4.858, 2.455e5 * YEAR], ['U', 92, 238, 4.270, 4.468e9 * YEAR]];

  (window.LabModels = window.LabModels || {})['nuclear-physics'] = { AV, AS, AC, AA, AP, semf, B, zValley, atomicMass, Sn, Sp, Qalpha, bound, betaStable, MEAS, bateman, tMaxDaughter, decayTimes, alpha, ALPHAS, YEAR, DAY };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;
  const SYM = 'n H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds'.split(' ');
  const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  const supS = (n) => (n < 0 ? '⁻' : '') + sup(Math.abs(n));
  const sci = (x) => { const e = Math.floor(Math.log10(x)); return `${fmt(x / 10 ** e, 3)}×10${supS(e)}`; };
  const nuc = (A, Z) => `${sup(A)}${SYM[Z] || 'Z' + Z}`;
  const dur = (s) => { const a = Math.abs(s); if (a < 1e-3) return `${fmt(s * 1e6, 3)} µs`; if (a < 1) return `${fmt(s * 1e3, 3)} ms`; if (a < 120) return `${fmt(s, 3)} s`; if (a < 7200) return `${fmt(s / 60, 3)} min`; if (a < 3 * DAY) return `${fmt(s / 3600, 3)} h`; if (a < YEAR) return `${fmt(s / DAY, 3)} d`; const y = s / YEAR; if (y < 1e6) return `${fmt(y, 3)} y`; const e = Math.floor(Math.log10(y)); return `${fmt(y / 10 ** e, 3)}×10${sup(e)} y`; };

  /* ---------- 1. binding energy: the liquid drop ---------- */
  const MAGIC = [8, 20, 28, 50, 82, 126];
  D['binding-energy'] = {
    render(ctx, v) {
      const Z = v.Z, N = v.N, A = Z + N, r = semf(A, Z), ok = bound(A, Z);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Every nucleus the liquid-drop formula binds, coloured by binding energy per nucleon, between the drip lines where one more neutron or proton would no longer be held. The dark curve is the valley of stability; dashed lines mark the magic numbers the formula knows nothing about. Drag the gold point to choose a nucleus.', '液滴の式が束縛するすべての原子核を、核子あたりの結合エネルギーで色分けしています。外側はドリップ線で、そこを越えると中性子や陽子をもう一つ保てません。濃い色の曲線は安定の谷で、破線はこの式が何も知らない魔法数です。金色の点をドラッグして原子核を選んでください。'));
      const f = L.fig(c1, { x: [0, 165], y: [0, 112], equal: true, xlabel: T('neutrons N', '中性子数 N'), ylabel: T('protons Z', '陽子数 Z'), maxH: 420 });
      const cl = L.colours();
      f.raster((x, y) => { const n = Math.round(x), z = Math.round(y), a = n + z; if (z < 1 || !bound(a, z)) return cl.plate; const ba = B(a, z) / a, t = clamp((ba - 6.5) / 2.3, 0, 1); return L.cmaps.warm(0.18 + 0.82 * t); }, { res: 2 });
      MAGIC.forEach((m) => { if (m <= 110) f.hline(m, { c: 'muted', w: 0.8, dash: '2 4', layer: 'under' }); f.vline(m, { c: 'muted', w: 0.8, dash: '2 4', layer: 'under' }); });
      f.line(L.sample(2, 275, 200, (a) => { const z = zValley(a); return [a - z, z]; }).filter((p) => p[0] <= 165 && p[1] <= 112), { c: 'ink', w: 2 });
      f.line(L.sample(0, 110, 2, (z) => [z, z]), { c: 'muted', w: 1, dash: '5 4' }); f.text(100, 100, 'N = Z', { small: true, c: 'muted', anchor: 'start', dx: 4 });
      f.handle(N, Z, { c: 'hl', r: 7, snap: 1, label: T('Nucleus (N, Z)', '原子核 (N, Z)'), bounds: [0, 165, 1, 110], onDrag: (x, y) => { ctx.set('N', Math.round(x), true); ctx.set('Z', Math.round(y)); } });
      f.text(N, Z, nuc(A, Z), { small: true, c: 'ink', anchor: 'start', dx: 11, dy: -9 });
      // B/A along the valley, built up term by term
      L.h('p', 'lab-cap', c2, T('Binding energy per nucleon along the valley, built from the volume term down: surface, Coulomb and asymmetry each take their share. Dots are measured values.', '谷に沿った核子あたりの結合エネルギーを、体積項から順に組み立てています。表面、クーロン、非対称の各項がそれぞれの分を差し引きます。点は測定値です。'));
      const g = L.fig(c2, { x: [0, 260], y: [0, 16.5], aspect: 0.7, xlabel: T('mass number A', '質量数 A'), ylabel: 'MeV', maxH: 300 });
      const As = L.seq(256, (i) => i + 4), terms = As.map((a) => { const z = zValley(a), n = a - z; return { a, s: (AS * Math.cbrt(a * a)) / a, c: (AC * z * (z - 1)) / Math.cbrt(a) / a, y: (AA * (n - z) ** 2) / a / a }; });
      const lvl = (k) => terms.map((t) => [t.a, AV - (k >= 1 ? t.s : 0) - (k >= 2 ? t.c : 0) - (k >= 3 ? t.y : 0)]);
      const band = (k, c) => { const top = lvl(k - 1), bot = lvl(k); g.poly(top.concat(bot.slice().reverse()), { c, fill: c, fo: 0.32, w: 0 }); };
      g.hline(AV, { c: 'muted', w: 1.4, dash: false, layer: 'under' }); g.text(255, AV, T('volume', '体積'), { small: true, c: 'muted', anchor: 'end', dy: -6 });
      band(1, 'c2'); band(2, 'c3'); band(3, 'c4');
      g.text(200, 14.2, T('surface', '表面'), { small: true, c: 'c2', anchor: 'middle' }); g.text(200, 11.3, T('Coulomb', 'クーロン'), { small: true, c: 'c3', anchor: 'middle' }); g.text(235, 9.1, T('asymmetry', '非対称'), { small: true, c: 'c4', anchor: 'middle' });
      g.line(lvl(3), { c: 'c1', w: 2.8 });
      MEAS.forEach(([a, z, ba]) => g.dot(a, ba, { c: 'ink', r: 3.5 }));
      g.text(56, 8.79, nuc(56, 26), { small: true, c: 'ink', dy: -9 });
      g.vline(A, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' });
      if (r && r.B > 0) g.dot(A, r.B / A, { c: 'hl', r: 5.5 });
      // breakdown of the chosen nucleus
      L.h('p', 'lab-cap', c2, T(`The terms for ${nuc(A, Z)}, in MeV.`, `${nuc(A, Z)} の各項（MeV）です。`));
      const items = r ? [[T('volume', '体積'), r.vol, 'muted'], [T('surface', '表面'), -r.surf, 'c2'], [T('Coulomb', 'クーロン'), -r.coul, 'c3'], [T('asymmetry', '非対称'), -r.asym, 'c4'], [T('pairing', '対'), r.pair, 'c1'], [T('total B', '合計 B'), r.B, 'hl']] : [];
      const mx = Math.max(1, ...items.map((i) => Math.abs(i[1])));
      const h = L.fig(c2, { x: [-mx * 1.32, mx * 1.32], y: [-0.6, items.length - 0.4], aspect: 0.42, axes: false, grid: false, maxH: 170 });
      h.vline(0, { c: 'ink', w: 1, dash: false, layer: 'under' });
      items.forEach(([nm, val, c], i) => { const y = items.length - 1 - i; h.rect(Math.min(0, val), y - 0.32, Math.abs(val), 0.64, { c, fill: c, fo: c === 'hl' ? 0.8 : 0.6, w: 0.8 }); h.text(val >= 0 ? -mx * 0.02 : mx * 0.02, y, nm, { small: true, c: 'ink', anchor: val >= 0 ? 'end' : 'start', dy: 4 }); h.text(val, y, fmt(val, 1), { small: true, c, anchor: val >= 0 ? 'start' : 'end', dx: val >= 0 ? 4 : -4, dy: 4 }); });
      L.legend(ctx.host, [{ c: 'c2', kind: 'fill', label: T('higher B/A: warmer', 'B/A が大きいほど暖色') }, { c: 'ink', label: T('valley of stability', '安定の谷') }, { c: 'ink', kind: 'dot', label: T('measured B/A', '測定された B/A') }, { c: 'c1', label: T('formula B/A', '式による B/A') }]);
      const qa = A > 8 && Z > 2 ? Qalpha(A, Z) : null;
      ctx.readout([
        { k: T('nucleus', '原子核'), v: `${nuc(A, Z)} (Z = ${Z}, N = ${N})`, tone: 'key' },
        { k: 'B', v: r ? `${fmt(r.B, 1)} MeV` : '–' },
        { k: 'B/A', v: r ? `${fmt(r.B / A, 3)} MeV` : '–', tone: 'good' },
        { k: T('S_n, S_p', 'S_n, S_p'), v: r && A > 2 ? `${fmt(Sn(A, Z), 2)}, ${fmt(Sp(A, Z), 2)} MeV` : '–' },
        { k: 'Q_α', v: qa !== null ? `${fmt(qa, 2)} MeV` : '–' },
        { k: T('fate', '運命'), v: !ok ? T('unbound: beyond a drip line', '非束縛：ドリップ線の外') : betaStable(A, Z) ? T('stable against β decay', 'β 崩壊に対して安定') : atomicMass(A, Z - 1) < atomicMass(A, Z) ? T('β⁺ or electron capture', 'β⁺ または電子捕獲') : T('β⁻ decay', 'β⁻ 崩壊'), tone: ok && betaStable(A, Z) ? 'good' : 'warn' },
      ], !ok
        ? T('Outside the drip lines the last neutron or proton is not bound at all and drips off in about the time it takes to cross the nucleus.', 'ドリップ線の外では最後の中性子または陽子がまったく束縛されず、原子核を横切るほどの時間で抜け落ちます。')
        : qa !== null && qa > 0 && A > 140
          ? T(`Q_α = ${fmt(qa, 2)} MeV is positive, so this nucleus could lower its energy by emitting an alpha particle; whether it does so in microseconds or billions of years is decided by tunnelling, in the third experiment.`, `Q_α = ${fmt(qa, 2)} MeV は正なので、この原子核はアルファ粒子を出してエネルギーを下げられます。それがマイクロ秒で起こるか数十億年かかるかはトンネル効果で決まり、三つ目の実験で扱います。`)
          : T('The surface term penalises light nuclei, which have a large fraction of nucleons on the surface, and the Coulomb term heavy ones, whose protons all repel: B/A peaks near iron and nickel, which is why fusion releases energy below them and fission above.', '表面項は表面にある核子の割合が大きい軽い原子核を罰し、クーロン項は陽子がすべて反発し合う重い原子核を罰します。B/A は鉄とニッケルの近くで最大になり、だからそれより軽い所では核融合が、重い所では核分裂がエネルギーを放出します。'));
    },
  };

  /* ---------- 2. decay chains ---------- */
  const NG = 30;
  D['decay-chain'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const ta = Math.pow(10, v.lA), tb = Math.pow(10, v.lB), la = Math.LN2 / ta, lb = Math.LN2 / tb;
      const key = `${v.lA}|${v.lB}`, st = ctx.state;
      if (st.key !== key) { st.times = decayTimes(NG * NG, la, lb); st.key = key; }
      const t0 = 0.02 * Math.min(ta, tb), t1 = 12 * Math.max(ta, tb), lt0 = Math.log10(t0), lt1 = Math.log10(t1);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      const capL = L.h('p', 'lab-cap', c1, '');
      const s = L.stage(c1, { w: NG, h: NG, maxH: 360 }), G = s.group('main');
      // fractions and activities on a log time axis
      L.h('p', 'lab-cap', c2, T('Amounts of parent, daughter and stable end product against time on a logarithmic axis: Bateman’s solution (lines) and the 900 atoms at the left (dots).', '親、娘、安定な最終生成物の量を対数の時間軸で示します。ベイトマンの解（線）と左の 900 個の原子（点）です。'));
      const g = L.fig(c2, { x: [lt0, lt1], y: [0, 1.04], aspect: 0.5, xlabel: T('time (h)', '時間（h）'), ylabel: T('fraction', '割合'), maxH: 220, ticksX: L.seq(Math.floor(lt1) - Math.ceil(lt0) + 1, (i) => { const e = Math.ceil(lt0) + i; return [e, e >= 0 && e <= 3 ? String(10 ** e) : `10${supS(e)}`]; }) });
      const ts = L.seq(240, (i) => lt0 + ((lt1 - lt0) * i) / 239), bs = ts.map((lt) => bateman(la, lb, 10 ** lt));
      g.line(ts.map((lt, i) => [lt, bs[i].NA]), { c: 'c1', w: 2.4 }); g.line(ts.map((lt, i) => [lt, bs[i].NB]), { c: 'c2', w: 2.4 }); g.line(ts.map((lt, i) => [lt, bs[i].NC]), { c: 'c3', w: 2.4 });
      const mc = ts.filter((_, i) => i % 8 === 0).map((lt) => { const t = 10 ** lt; let a = 0, b = 0; for (const [x, y] of st.times) { if (t < x) a++; else if (t < y) b++; } return [lt, a / (NG * NG), b / (NG * NG)]; });
      mc.forEach(([lt, a, b]) => { g.dot(lt, a, { c: 'c1', r: 2.4, hollow: true, layer: 'main' }); g.dot(lt, b, { c: 'c2', r: 2.4, hollow: true, layer: 'main' }); g.dot(lt, 1 - a - b, { c: 'c3', r: 2.4, hollow: true, layer: 'main' }); });
      const cur = g.group('over');
      L.h('p', 'lab-cap', c2, T('Activities, decays per unit time, relative to the parent’s initial activity, on a log scale. Where the daughter’s line runs parallel to the parent’s, the chain is in equilibrium.', '放射能、つまり単位時間あたりの崩壊数を、親の初めの放射能に対する比として対数目盛で示します。娘の線が親の線と平行に走る所では、崩壊系列は平衡にあります。'));
      const h = L.fig(c2, { x: [lt0, lt1], y: [-4, 0.6], aspect: 0.42, xlabel: T('time (h)', '時間（h）'), ylabel: 'log₁₀ λN/λ_A', maxH: 190, ticksX: [] });
      h.line(ts.map((lt, i) => [lt, Math.log10(Math.max(1e-6, bs[i].NA))]), { c: 'c1', w: 2.2 });
      h.line(ts.map((lt, i) => [lt, clamp(Math.log10(Math.max(1e-6, (lb / la) * bs[i].NB)), -4.5, 1)]), { c: 'c2', w: 2.2 });
      const cur2 = h.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T(`parent, t½ = ${fmt(ta, 3)} h`, `親、t½ = ${fmt(ta, 3)} h`) }, { c: 'c2', label: T(`daughter, t½ = ${fmt(tb, 3)} h`, `娘、t½ = ${fmt(tb, 3)} h`) }, { c: 'c3', label: T('stable end product', '安定な最終生成物') }]);
      const regime = ta > 50 * tb ? 0 : ta > tb * 1.0001 ? 1 : 2;
      const tm = tMaxDaughter(la, lb);
      ctx.readout([
        { k: T('half-lives', '半減期'), v: `${fmt(ta, 3)} h → ${fmt(tb, 3)} h`, tone: 'key' },
        { k: T('daughter peaks at', '娘が最大になる時刻'), v: `${fmt(tm, 1)} h` },
        { k: T('largest daughter fraction', '娘の最大の割合'), v: fmt(bateman(la, lb, tm).NB, 3) },
        { k: T('activity ratio at late times', '遅い時刻の放射能比'), v: regime === 2 ? T('no equilibrium', '平衡なし') : fmt(lb / (lb - la), 3), tone: 'good' },
        { k: T('regime', '状態'), v: [T('secular equilibrium', '永続平衡'), T('transient equilibrium', '過渡平衡'), T('no equilibrium', '平衡なし')][regime] },
      ], [
        T('The parent lives so much longer that its activity barely changes while the daughter builds up: after a few daughter half-lives the two activities are equal. That is why radium in old rocks always comes with exactly as many radon decays per second.', '親の寿命がずっと長いので、娘が増える間に親の放射能はほとんど変わりません。娘の半減期の数倍の後には二つの放射能は等しくなります。だから古い岩石の中のラジウムには、毎秒ちょうど同じ数のラドンの崩壊が必ず伴います。'),
        T(`The daughter decays faster than the parent, so after a while it follows the parent down with a constant ratio of activities λ_B/(λ_B − λ_A) = ${fmt(lb / (lb - la), 3)}, slightly above 1. Medical generators, which milk technetium‑99m from molybdenum‑99, work in this regime.`, `娘は親より速く崩壊するので、しばらくすると放射能の比 λ_B/(λ_B − λ_A) = ${fmt(lb / (lb - la), 3)} を一定に保って親とともに減っていきます。この値は 1 よりわずかに大きくなります。モリブデン 99 からテクネチウム 99m を取り出す医療用ジェネレータは、この状態で働きます。`),
        T('The daughter lives longer than the parent, so the parent is used up first and the daughter then decays at its own slower rate: no equilibrium is reached, and at late times the daughter’s activity exceeds the parent’s by an ever larger factor.', '娘の寿命が親より長いので、親が先に使い尽くされ、その後娘は自分のより遅い率で崩壊します。平衡には達せず、遅い時刻では娘の放射能が親の放射能をますます大きな比で上回ります。'),
      ][regime]);
      const cells = []; for (let i = 0; i < NG * NG; i++) { const x = i % NG, y = Math.floor(i / NG); cells.push([x + 0.5, NG - y - 0.5]); }
      const draw = (lt) => {
        const t = 10 ** lt; while (G.firstChild) G.removeChild(G.firstChild); while (cur.firstChild) cur.removeChild(cur.firstChild); while (cur2.firstChild) cur2.removeChild(cur2.firstChild);
        let a = 0, b = 0; const paths = { c1: '', c2: '', c3: '' };
        st.times.forEach(([x, y], i) => { const k = t < x ? 'c1' : t < y ? 'c2' : 'c3'; if (k === 'c1') a++; else if (k === 'c2') b++; const [px, py] = cells[i]; paths[k] += `M${s.X(px).toFixed(1)} ${s.Y(py).toFixed(1)}h0`; });
        for (const k of ['c3', 'c2', 'c1']) { const P = document.createElementNS('http://www.w3.org/2000/svg', 'path'); P.setAttribute('d', paths[k]); P.setAttribute('style', `fill:none;stroke:var(--lab-${k});stroke-width:${k === 'c3' ? 6 : 8};stroke-linecap:round;opacity:${k === 'c3' ? 0.45 : 0.95}`); G.appendChild(P); }
        cur.appendChild(g.vline(lt, { c: 'hl', w: 1.4, dash: '3 3', layer: 'over' })); cur2.appendChild(h.vline(lt, { c: 'hl', w: 1.4, dash: '3 3', layer: 'over' }));
        capL.textContent = T(`900 atoms at t = ${fmt(t, 3)} h: ${a} parent (blue), ${b} daughter (orange), ${NG * NG - a - b} stable (teal). Each atom decays at a random moment; only the averages are predictable.`, `t = ${fmt(t, 3)} h の 900 個の原子：親 ${a} 個（青）、娘 ${b} 個（オレンジ）、安定 ${NG * NG - a - b} 個（青緑）。各原子は無作為な瞬間に崩壊し、予測できるのは平均だけです。`);
      };
      const ltm = clamp(Math.log10(tm), lt0, lt1), dur0 = 7;
      st.anim = L.animator(ctx.host, (dt, t, lb2) => { const lt = lt0 + ((lt1 - lt0) * Math.min(t, dur0)) / dur0; draw(lt); lb2.textContent = `t = ${fmt(10 ** lt, 3)} h`; return t < dur0; }, { autoplay: false, once: true, initialT: (dur0 * (ltm - lt0)) / (lt1 - lt0), playLabel: T('Play: watch the atoms decay', '再生：原子の崩壊を見る') });
    },
  };

  /* ---------- 3. alpha decay by tunnelling ---------- */
  const ELS = [['Po', 84, 214], ['Rn', 86, 222], ['Ra', 88, 226], ['Th', 90, 230], ['U', 92, 236]];
  const ELC = ['c1', 'c2', 'c3', 'c4', 'muted'];
  D['alpha-tunnelling'] = {
    render(ctx, v) {
      const [sym, Z, A] = ELS[v.el], Q = v.Q, a = alpha(Z, A, Q);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The potential energy of an alpha particle and a ${SYM[Z - 2]} nucleus (Z = ${Z - 2}) against their separation: a well inside the nuclear radius R, then the Coulomb barrier. The alpha has energy Q and must tunnel through the shaded region between R and b.`, `アルファ粒子と ${SYM[Z - 2]} の原子核（Z = ${Z - 2}）の、距離に対する位置エネルギーです。原子核の半径 R の内側は井戸で、その外はクーロン障壁です。アルファ粒子のエネルギーは Q で、R と b の間の陰影の領域をトンネルで抜けねばなりません。`));
      const rmax = 75, f = L.fig(c1, { x: [0, rmax], y: [-12, 34], aspect: 0.78, xlabel: 'r (fm)', ylabel: 'MeV', maxH: 380 });
      f.hline(0, { c: 'muted', w: 1, dash: false, layer: 'under' });
      const Vc = (r) => (2 * (Z - 2) * KE) / r;
      f.area(L.sample(a.R, Math.min(a.b, rmax), 160, (r) => [r, Vc(r)]).concat([[Math.min(a.b, rmax), Q], [a.R, Q]]), { c: 'hl', fill: 'hl', fo: 0.35, base: Q, w: 0 });
      f.line([[0, -10], [a.R, -10], [a.R, Math.min(34, Vc(a.R))]].concat(L.sample(a.R, rmax, 200, (r) => [r, Math.min(34, Vc(r))])), { c: 'ink', w: 2.6 });
      f.seg([0, Q], [rmax, Q], { c: 'c1', w: 2, dash: '6 4' });
      f.text(1.5, Q, `Q = ${fmt(Q, 3)} MeV`, { small: true, c: 'c1', anchor: 'start', dy: -7 });
      f.vline(a.R, { c: 'muted', w: 1, dash: '2 3', layer: 'under' }); f.text(a.R, -12, `R = ${fmt(a.R, 2)} fm`, { small: true, c: 'muted', dy: -4, anchor: 'start', dx: 3 });
      if (a.b < rmax) { f.vline(a.b, { c: 'muted', w: 1, dash: '2 3', layer: 'under' }); f.text(a.b, -12, `b = ${fmt(a.b, 1)} fm`, { small: true, c: 'muted', dy: -4, anchor: 'start', dx: 3 }); }
      f.text(a.R + 2, Math.min(32, Vc(a.R)), `${fmt(Vc(a.R), 1)} MeV`, { small: true, c: 'ink', anchor: 'start', dy: 4 });
      f.handle(Math.min(rmax - 4, a.b + 6), Q, { c: 'hl', r: 7, axis: 'y', label: 'Q', bounds: [0, rmax, 3.8, 9.2], onDrag: (x, y) => ctx.set('Q', Math.round(clamp(y, 3.8, 9.2) * 1000) / 1000) });
      // Geiger–Nuttall
      L.h('p', 'lab-cap', c2, T('Half-life against Q on a log scale (the Geiger–Nuttall law). Lines: the tunnelling model for each element; dots: measured ground-state alpha emitters. Drag the gold point.', '対数目盛での Q に対する半減期（ガイガー・ヌッタルの法則）です。線は各元素についてのトンネル効果のモデル、点は測定された基底状態のアルファ崩壊核です。金色の点をドラッグしてください。'));
      const yr = (s) => Math.log10(s);
      const g = L.fig(c2, { x: [3.8, 9.2], y: [-8, 19], aspect: 0.9, xlabel: 'Q (MeV)', ylabel: T('log₁₀ t½ (s)', 'log₁₀ t½（s）'), maxH: 400, ticksY: [-6, -3, 0, 3, 6, 9, 12, 15, 18].map((e) => [e, String(e).replace('-', '−')]) });
      [[Math.log10(60), T('1 minute', '1 分')], [Math.log10(DAY), T('1 day', '1 日')], [Math.log10(YEAR), T('1 year', '1 年')], [Math.log10(1e6 * YEAR), T('a million years', '100 万年')], [Math.log10(1e9 * YEAR), T('a billion years', '10 億年')]].forEach(([y, lab]) => { g.hline(y, { c: 'muted', w: 0.8, dash: '2 4', layer: 'under' }); g.text(9.15, y, lab, { small: true, c: 'muted', anchor: 'end', dy: -4 }); });
      ELS.forEach(([s, z, aa], i) => g.line(L.sample(3.8, 9.2, 120, (q) => [q, clamp(yr(alpha(z, aa, q).thalf), -9, 20)]), { c: ELC[i], w: i === v.el ? 2.8 : 1.3, op: i === v.el ? 1 : 0.55 }));
      ALPHAS.forEach(([s, z, aa, q, t]) => { const i = ELS.findIndex((e) => e[1] === z); g.dot(q, yr(t), { c: ELC[i], r: i === v.el ? 5 : 3.5, op: i === v.el ? 1 : 0.6 }); if (i === v.el) g.text(q, yr(t), `${sup(aa)}${s}`, { small: true, c: ELC[i], anchor: 'start', dx: 7, dy: -5 }); });
      g.handle(Q, clamp(yr(a.thalf), -8, 19), { c: 'hl', r: 7, axis: 'x', label: 'Q', bounds: [3.8, 9.2, -8, 19], onDrag: (x) => ctx.set('Q', Math.round(clamp(x, 3.8, 9.2) * 1000) / 1000) });
      L.legend(ctx.host, ELS.map(([s, z], i) => ({ c: ELC[i], label: `${s} (Z = ${z})` })).concat([{ c: 'hl', kind: 'fill', label: T('barrier to tunnel through', 'トンネルで抜ける障壁') }]));
      const near = ALPHAS.filter((d) => d[1] === Z).reduce((best, d) => (Math.abs(d[3] - Q) < Math.abs(best[3] - Q) ? d : best));
      ctx.readout([
        { k: T('parent', '親核'), v: `${sym} (Z = ${Z}), A ≈ ${A}`, tone: 'key' },
        { k: T('barrier top V(R)', '障壁の頂上 V(R)'), v: `${fmt(a.VR, 1)} MeV` },
        { k: T('Gamow factor G', 'ガモフ因子 G'), v: fmt(a.G, 1) },
        { k: T('penetration e^(−G)', '透過確率 e^(−G)'), v: sci(a.P) },
        { k: T('knocks per second', '毎秒の衝突回数'), v: sci(a.f) },
        { k: T('predicted t½', '予測される t½'), v: dur(a.thalf), tone: 'good' },
      ], T(`Raising Q from ${fmt(Q, 3)} to ${fmt(Q + 1, 3)} MeV changes the predicted half-life by a factor of 10${sup(Math.round(Math.log10(a.thalf / alpha(Z, A, Q + 1).thalf)))}: the barrier gets thinner and lower at once, and the probability depends on it exponentially. The nearest measured case is ${sup(near[2])}${near[0]}, Q = ${fmt(near[3], 3)} MeV, t½ = ${dur(near[4])}.`, `Q を ${fmt(Q, 3)} から ${fmt(Q + 1, 3)} MeV に上げると、予測される半減期は 10${sup(Math.round(Math.log10(a.thalf / alpha(Z, A, Q + 1).thalf)))} 分の一になります。障壁は薄くなると同時に低くなり、確率はそれに指数関数的に依存するからです。最も近い測定例は ${sup(near[2])}${near[0]} で、Q = ${fmt(near[3], 3)} MeV、t½ = ${dur(near[4])} です。`));
    },
  };
})();
