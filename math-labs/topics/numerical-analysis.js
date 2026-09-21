'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const sup = (n) => String(n).split('').map((c) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[c] ?? c).join('');

  /* ---------- 1. accuracy and stability on y' = -5y ---------- */
  const lam = -5, TEND = 2;
  const RE = (z) => 1 + z, RK = (z) => 1 + z + z * z / 2 + z ** 3 / 6 + z ** 4 / 24, RB = (z) => 1 / (1 - z);
  const RK4_LIMIT = 2.785293563405282 / 5; // |R(z)| = 1 on the negative real axis

  D.ode = {
    render(ctx, v) {
      const h = v.h, n = Math.floor(TEND / h + 1e-9), z = lam * h;
      const run = (R) => L.seq(n + 1, (k) => [k * h, R(z) ** k]);
      const eu = run(RE), rk = run(RK), be = run(RB);
      const err = (s) => Math.max(...s.map(([t, y]) => Math.abs(y - Math.exp(lam * t))));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Numerical solutions on [0, 2] against the exact e⁻⁵ᵗ. Values beyond ±1.6 leave the frame.', '[0, 2] 上の数値解と厳密解 e⁻⁵ᵗ。±1.6 を超える値は枠の外に出ます。'));
      L.h('p', 'lab-cap', c2, T('Growth factor per step, yₙ₊₁ = R(−5h) yₙ. Stable where |R| < 1 (shaded band).', '1ステップあたりの増幅率 yₙ₊₁ = R(−5h) yₙ。|R| < 1 の帯で安定です。'));
      const all = eu.concat(rk).map((p) => p[1]);
      const ylo = Math.max(-1.6, Math.min(-0.25, ...all) - 0.1), yhi = Math.min(1.6, Math.max(1.1, ...all) + 0.1);
      const f = L.fig(c1, { x: [0, TEND], y: [ylo, yhi], aspect: 0.78, maxH: 360, xlabel: 't', ylabel: 'y' });
      f.line(L.sample(0, TEND, 300, (t) => Math.exp(lam * t)), { c: 'ink', w: 2.6, op: 0.75 });
      const draw = (s, c, dash) => { f.line(s, { c, w: 1.6, dash, op: 0.85 }); s.forEach(([t, y]) => { if (y > ylo && y < yhi) f.dot(t, y, { c, r: 3.6 }); }); };
      draw(be, 'c3', '2 3'); draw(eu, 'c2'); draw(rk, 'c1');
      const g = L.fig(c2, { x: [0, 0.6], y: [-2.2, 1.3], aspect: 0.78, maxH: 360, xlabel: T('step size h', '刻み幅 h'), ylabel: 'R(−5h)' });
      g.rect(0, -1, 0.6, 2, { c: 'c3', fo: 0.1, nostroke: true, layer: 'under' });
      g.hline(1, { c: 'c3', w: 1, dash: '3 3' }); g.hline(-1, { c: 'c3', w: 1, dash: '3 3' });
      g.line(L.sample(0, 0.6, 200, (x) => Math.exp(lam * x)), { c: 'ink', w: 2, op: 0.7 });
      g.line(L.sample(0, 0.6, 200, (x) => RE(lam * x)), { c: 'c2', w: 2.2 });
      g.line(L.sample(0, 0.6, 200, (x) => RK(lam * x)), { c: 'c1', w: 2.2 });
      g.line(L.sample(0, 0.6, 200, (x) => RB(lam * x)), { c: 'c3', w: 2.2, dash: '5 3' });
      g.vline(0.4, { c: 'c2', w: 1, dash: '2 3' }); g.vline(RK4_LIMIT, { c: 'c1', w: 1, dash: '2 3' });
      g.text(0.4, -2.2, 'h = 0.4', { dx: -4, dy: -6, anchor: 'end', small: true, c: 'c2' });
      g.text(RK4_LIMIT, 1.3, `h ≈ ${fmt(RK4_LIMIT, 3)}`, { dx: -4, dy: 14, anchor: 'end', small: true, c: 'c1' });
      g.vline(h, { c: 'hl', w: 1.6, dash: false, op: 0.8 });
      [[RE, 'c2'], [RK, 'c1'], [RB, 'c3']].forEach(([R, c]) => { const y = R(z); if (y > -2.2 && y < 1.3) g.dot(h, y, { c, r: 5 }); });
      g.handle(h, -1.85, { c: 'hl', axis: 'x', bounds: [0.025, 0.6, -2, 1], label: T('Step size h', '刻み幅 h'), onDrag: (x) => ctx.set('h', x) });
      L.legend(ctx.host, [{ c: 'ink', label: T('exact e⁻⁵ᵗ, factor e⁻⁵ʰ', '厳密解 e⁻⁵ᵗ・増幅率 e⁻⁵ʰ') }, { c: 'c2', label: T('explicit Euler, 1 − 5h', '陽的オイラー 1 − 5h') }, { c: 'c1', label: T('RK4, degree-4 Taylor polynomial', 'RK4（4次テイラー多項式）') }, { c: 'c3', dash: true, label: T('implicit Euler, 1/(1 + 5h)', '陰的オイラー 1/(1 + 5h)') }]);
      const tone = (R) => (Math.abs(R(z)) < 1 ? 'good' : 'warn');
      ctx.readout([
        { k: T('Euler factor', 'オイラーの倍率'), v: fmt(RE(z), 3), tone: tone(RE) },
        { k: T('RK4 factor', 'RK4 の倍率'), v: fmt(RK(z), 3), tone: tone(RK) },
        { k: T('max error, Euler', '最大誤差（オイラー）'), v: fmt(err(eu), 3) },
        { k: T('max error, RK4', '最大誤差（RK4）'), v: fmt(err(rk), 3), tone: 'key' },
      ], h >= RK4_LIMIT ? T('Past h ≈ 0.557 even RK4 grows; only the implicit method still decays.', 'h ≈ 0.557 を超えると RK4 でも増大し、減衰し続けるのは陰解法だけです。')
        : h > 0.4 ? T('Euler’s factor is below −1, so the numerical solution flips sign and grows with each step.', 'オイラーの倍率が −1 未満なので、誤差は符号を変えながら毎ステップ増大します。')
          : h > 0.2 ? T('Euler is stable but oscillates, because 1 − 5h is negative.', 'オイラーは安定ですが、1 − 5h が負なので振動します。') : '');
    },
  };

  /* ---------- 2. cancellation ---------- */
  const direct = (x) => (Math.sqrt(1 + x) - 1) / x;
  const stable = (x) => 1 / (Math.sqrt(1 + x) + 1);
  const relErr = (x) => Math.abs(direct(x) - stable(x)) / stable(x);
  const EPS = 2.220446049250313e-16;
  D.cancellation = {
    render(ctx, v) {
      const e = Math.round(v.exponent), x = 10 ** -e;
      const lg = (r) => Math.max(-17.5, Math.log10(Math.max(r, 1e-18)));
      L.h('p', 'lab-cap', ctx.host, T('Relative error of the direct formula, computed in binary64, as x = 10⁻ᵉ shrinks.', 'x = 10⁻ᵉ を小さくしたときの直接計算の相対誤差（倍精度で計算）。'));
      const f = L.fig(ctx.host, { x: [1, 17], y: [-17.5, 1], aspect: 0.42, maxH: 330, xlabel: T('e, where x = 10⁻ᵉ', 'e（x = 10⁻ᵉ）'), ylabel: T('relative error', '相対誤差'), ticksY: [-16, -12, -8, -4, 0].map((k) => [k, k === 0 ? '1' : '10' + sup(k)]), ticksX: L.seq(9, (i) => [1 + 2 * i, String(1 + 2 * i)]) });
      f.rect(15.65, -17.5, 1.35, 18.5, { c: 'c2', fo: 0.08, nostroke: true, layer: 'under' });
      f.line(L.sample(1, 17, 200, (s) => Math.log10(EPS * 10 ** s)), { c: 'muted', w: 1.4, dash: '6 4' });
      f.text(9, Math.log10(EPS * 1e9), T('rounding model ε/x', '丸めのモデル ε/x'), { anchor: 'start', dx: 6, dy: 34, small: true, c: 'muted' });
      f.line(L.sample(1, 17, 900, (s) => lg(relErr(10 ** -s))), { c: 'c2', w: 1.4, op: 0.75 });
      for (let k = 1; k <= 17; k++) f.dot(k, lg(relErr(10 ** -k)), { c: 'c2', r: 3.2 });
      f.text(16.33, -8, '1 + x = 1', { small: true, c: 'c2' });
      const r = relErr(x);
      f.vline(e, { c: 'hl', w: 1.4, dash: '2 3' });
      f.dot(e, lg(r), { c: 'hl', r: 6.5 });
      f.handle(e, -16.4, { c: 'hl', axis: 'x', snap: 1, bounds: [1, 17, -17, 1], label: T('Exponent e', '指数 e'), onDrag: (s) => ctx.set('exponent', s) });
      f.hover((s) => { const k = Math.round(s); if (k < 1 || k > 17) return null; return { x: k, y: lg(relErr(10 ** -k)), text: `x = 10${sup(-k)}: ${relErr(10 ** -k).toExponential(1)}` }; });
      L.legend(ctx.host, [{ c: 'c2', label: T('direct (√(1+x) − 1)/x', '直接計算 (√(1+x) − 1)/x') }, { c: 'muted', dash: true, label: T('rounding model ε/x, ε = 2⁻⁵²', '丸めのモデル ε/x（ε = 2⁻⁵²）') }]);
      // digit table: what the machine actually holds
      const s1 = Math.sqrt(1 + x), num = s1 - 1, trueNum = x * stable(x);
      const good = r > 0 ? Math.max(0, Math.min(17, Math.floor(-Math.log10(r)))) : 17;
      const tbl = L.h('div', '', ctx.host);
      tbl.style.cssText = 'font-family:var(--f-mono,ui-monospace,monospace);font-size:.8rem;display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:10px 4px;overflow-x:auto';
      const rowT = (k, val, hi) => {
        L.h('span', '', tbl, k).style.color = 'var(--lab-muted)';
        const cell = L.h('span', '', tbl);
        if (hi === undefined) { cell.textContent = val; return; }
        const [m, ex] = val.split('e');
        const digits = m.replace('-', '').replace('.', '');
        let seen = 0, out = '';
        const a = L.h('b', '', cell), bb = L.h('span', '', cell);
        for (const ch of m) { if (/\d/.test(ch) && (seen > 0 || ch !== '0')) seen++; if (seen <= hi || !/\d/.test(ch)) out += ch; else break; }
        a.textContent = out; a.style.color = 'var(--lab-c3)';
        bb.textContent = m.slice(out.length) + (ex ? 'e' + ex : ''); bb.style.color = 'var(--lab-c2)';
        void digits;
      };
      rowT(T('√(1 + x) in binary64', '倍精度の √(1 + x)'), s1.toPrecision(17));
      rowT(T('direct numerator √(1+x) − 1', '直接計算の分子 √(1+x) − 1'), num.toExponential(16), num === 0 ? 0 : good);
      rowT(T('stable numerator x/(√(1+x) + 1)', '安定な分子 x/(√(1+x) + 1)'), trueNum.toExponential(16), 17);
      L.h('p', 'lab-cap', ctx.host, T('Green digits agree with the stable value; orange digits are rounding noise.', '緑の桁は安定な値と一致し、橙の桁は丸めの雑音です。'));
      ctx.readout([
        { k: 'x', v: `10${sup(-e)}` },
        { k: T('direct', '直接計算'), v: fmt(direct(x), 6), tone: r > 1e-3 ? 'warn' : undefined },
        { k: T('stable', '安定な式'), v: fmt(stable(x), 6), tone: 'good' },
        { k: T('relative error', '相対誤差'), v: r === 0 ? '0' : r < 1e-3 ? (() => { const [m, x] = r.toExponential(1).split('e'); return `${m}×10${sup(Number(x))}`; })() : fmt(r, 3), tone: 'key' },
        { k: T('correct digits', '正しい桁数'), v: String(good) },
      ], e >= 16 ? T('1 + x rounds to 1, so the direct numerator is exactly 0 and every digit is lost.', '1 + x が1に丸められるため、直接計算の分子はちょうど0になり、すべての桁が失われます。') : T('√(1 + x) and 1 share about e + 1 leading digits, so the subtraction keeps only about 16 − e correct ones.', '√(1 + x) と 1 は先頭の約 e + 1 桁が一致するため、引き算の後に正しい桁は約 16 − e 桁しか残りません。'));
    },
  };

  /* ---------- 3. Runge's phenomenon ---------- */
  const runge = (x) => 1 / (1 + 25 * x * x);
  const nodes = (n, cheb) => L.seq(n + 1, (j) => (cheb ? Math.cos(j * Math.PI / n) : -1 + 2 * j / n));
  function interp(n, cheb) {
    const xs = nodes(n, cheb), ys = xs.map(runge);
    const w = xs.map((x, i) => 1 / xs.reduce((a, y, j) => (i === j ? a : a * (x - y)), 1));
    return (x) => { let num = 0, den = 0; for (let i = 0; i <= n; i++) { const d = x - xs[i]; if (Math.abs(d) < 1e-14) return ys[i]; const q = w[i] / d; num += q * ys[i]; den += q; } return num / den; };
  }
  const maxErr = (p) => { let m = 0; for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000; m = Math.max(m, Math.abs(p(x) - runge(x))); } return m; };
  D.interpolation = {
    render(ctx, v) {
      const n = Math.round(v.n), cheb = Math.round(v.cheb) === 1, st = ctx.state;
      if (!st.errs) st.errs = [0, 1].map((c) => L.seq(19, (i) => [i + 2, maxErr(interp(i + 2, c))]));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Degree ${n} interpolants of 1/(1 + 25x²). Dots are the nodes in use.`, `1/(1 + 25x²) の ${n} 次補間多項式。点は使用中の節点です。`));
      L.h('p', 'lab-cap', c2, T('Maximum error on [−1, 1] against degree (log scale).', '[−1, 1] 上の最大誤差と次数（対数目盛）。'));
      const f = L.fig(c1, { x: [-1, 1], y: [-0.7, 1.5], aspect: 0.8, maxH: 380, xlabel: 'x' });
      const pe = interp(n, false), pc = interp(n, true);
      f.line(L.sample(-1, 1, 400, runge), { c: 'ink', w: 3, op: 0.55 });
      f.line(L.sample(-1, 1, 800, cheb ? pe : pc), { c: cheb ? 'c2' : 'c1', w: 1.4, dash: '5 4', op: 0.6 });
      f.line(L.sample(-1, 1, 800, cheb ? pc : pe), { c: cheb ? 'c1' : 'c2', w: 2.4 });
      const p = cheb ? pc : pe;
      let wx = 0, wm = 0; for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000, d = Math.abs(p(x) - runge(x)); if (d > wm) { wm = d; wx = x; } }
      if (Math.abs(p(wx)) < 1.5) f.seg([wx, runge(wx)], [wx, p(wx)], { c: 'hl', w: 2.5 });
      nodes(n, cheb).forEach((x) => f.dot(x, runge(x), { c: 'hl', r: 4.5 }));
      nodes(n, cheb).forEach((x) => f.seg([x, -0.7], [x, -0.62], { c: 'hl', w: 2, layer: 'over' }));
      f.hover((x) => ({ x, text: `f = ${fmt(runge(x), 3)}, p = ${fmt(p(x), 3)}` }));
      const ylo = -16, g = L.fig(c2, { x: [2, 20], y: [-4, 2], aspect: 0.8, maxH: 380, xlabel: T('degree n', '次数 n'), ticksY: [-4, -3, -2, -1, 0, 1, 2].map((k) => [k, k === 0 ? '1' : '10' + sup(k)]), ticksX: [2, 5, 10, 15, 20].map((k) => [k, String(k)]) });
      void ylo;
      const lgE = (e) => Math.log10(e);
      g.line(st.errs[0].map(([k, e]) => [k, lgE(e)]), { c: 'c2', w: 2.2 });
      g.line(st.errs[1].map(([k, e]) => [k, lgE(e)]), { c: 'c1', w: 2.2 });
      st.errs.forEach((s, c) => s.forEach(([k, e]) => g.dot(k, lgE(e), { c: c ? 'c1' : 'c2', r: 2.8 })));
      g.vline(n, { c: 'hl', w: 1.4, dash: '2 3' });
      const cur = st.errs[cheb ? 1 : 0][n - 2][1];
      g.dot(n, lgE(cur), { c: 'hl', r: 6.5 });
      g.handle(n, -3.6, { c: 'hl', axis: 'x', snap: 1, bounds: [2, 20, -4, 2], label: T('Degree n', '次数 n'), onDrag: (k) => ctx.set('n', k) });
      L.legend(ctx.host, [{ c: 'ink', label: 'f(x) = 1/(1 + 25x²)' }, { c: 'c2', label: T('equally spaced nodes', '等間隔点') }, { c: 'c1', label: T('Chebyshev–Lobatto nodes', 'チェビシェフ・ロバット点') }, { c: 'hl', label: T('largest error, and the nodes', '最大誤差の位置と節点') }]);
      const other = st.errs[cheb ? 0 : 1][n - 2][1];
      ctx.readout([
        { k: T('max error, this node set', '最大誤差（この点）'), v: fmt(cur, 3), tone: 'key' },
        { k: T('max error, the other set', '最大誤差（もう一方）'), v: fmt(other, 3) },
        { k: T('where', '位置'), v: `x = ${fmt(wx, 3)}` },
      ], cheb ? T('Chebyshev errors fall geometrically with n: for this f roughly like 1.22⁻ⁿ.', 'チェビシェフ点の誤差は n に対して幾何級数的に減少します。この f ではおよそ 1.22⁻ⁿ です。') : T('Equally spaced errors grow with n near the ends, even though every node is matched exactly.', '等間隔点ではすべての節点で一致していても、端点付近の誤差は n とともに増大します。'));
    },
  };
})();
