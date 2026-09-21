'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI;

  /* ---------- 1. Riemann versus Lebesgue partitions ---------- */
  const fB = (x) => 0.5 + 0.28 * Math.sin(3 * PI * x) + 0.15 * Math.cos(7 * PI * x + 0.5);
  const simpson = (f, a, b, n = 2000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  const INT = simpson(fB, 0, 1);
  // intervals of {x in [0,1] : f(x) >= y}
  function superlevel(f, y, n = 1500) {
    const out = []; let start = null, prevX = 0, prevV = f(0) - y;
    if (prevV >= 0) start = 0;
    for (let i = 1; i <= n; i++) {
      const x = i / n, v = f(x) - y;
      if ((prevV >= 0) !== (v >= 0)) { const c = prevX + (x - prevX) * prevV / (prevV - v); if (v >= 0) start = c; else { out.push([start, c]); start = null; } }
      prevX = x; prevV = v;
    }
    if (start !== null) out.push([start, 1]);
    return out;
  }
  const meas = (iv) => iv.reduce((s, [a, b]) => s + b - a, 0);

  D.partitions = {
    render(ctx, v) {
      const n = Math.round(v.resolution), st = ctx.state;
      if (st.y === undefined) st.y = 0.62;
      const yL = st.y;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Riemann: cut the x-axis into ${n} pieces and use the least value on each.`, `リーマン：x 軸を ${n} 個に切り、各部分で最小値を使います。`));
      L.h('p', 'lab-cap', c2, T(`Lebesgue: cut the y-axis into ${n} levels and measure where f reaches each one.`, `ルベーグ：y 軸を ${n} 段に切り、f が各段に届く集合を測ります。`));
      const opt = { x: [0, 1], y: [0, 1.02], aspect: 0.8, maxH: 360, xlabel: 'x' };
      const a = L.fig(c1, opt), b = L.fig(c2, opt);
      let riem = 0;
      for (let i = 0; i < n; i++) {
        let m = Infinity; for (let j = 0; j <= 40; j++) m = Math.min(m, fB((i + j / 40) / n));
        riem += m / n;
        a.rect(i / n, 0, 1 / n, m, { c: 'c1', fo: i % 2 ? 0.38 : 0.26, w: 0.8 });
      }
      let leb = 0;
      for (let k = 1; k <= n; k++) {
        const y = k / n, iv = superlevel(fB, y);
        leb += meas(iv) / n;
        iv.forEach(([s, e]) => b.rect(s, y - 1 / n, e - s, 1 / n, { c: 'c3', fo: k % 2 ? 0.38 : 0.26, w: 0.8 }));
        b.hline(y, { c: 'c3', w: 0.6, dash: '2 4', op: 0.6, layer: 'under' });
      }
      const curve = L.sample(0, 1, 300, fB);
      a.line(curve, { c: 'ink', w: 2.4 }); b.line(curve, { c: 'ink', w: 2.4 });
      // the probed level set
      const iv = superlevel(fB, yL);
      b.hline(yL, { c: 'hl', w: 1.6, dash: '5 4' });
      iv.forEach(([s, e]) => { b.seg([s, 0.012], [e, 0.012], { c: 'hl', w: 6 }); b.seg([s, 0], [s, yL], { c: 'hl', w: 1, dash: '2 3' }); b.seg([e, 0], [e, yL], { c: 'hl', w: 1, dash: '2 3' }); });
      b.text(0.02, yL, `{f ≥ ${fmt(yL, 2)}}`, { anchor: 'start', dy: -7, small: true });
      b.handle(0.97, yL, { c: 'hl', axis: 'y', bounds: [0, 1, 0.08, 0.98], label: T('Level y', '水準 y'), onDrag: (x, y) => { st.y = y; ctx.redraw(); } });
      L.legend(ctx.host, [{ c: 'ink', label: 'f' }, { kind: 'fill', c: 'c1', label: T('Riemann lower sum', 'リーマン下和') }, { kind: 'fill', c: 'c3', label: T('Lebesgue lower sum Σ Δy · λ{f ≥ yₖ}', 'ルベーグ下和 Σ Δy · λ{f ≥ yₖ}') }, { c: 'hl', label: T('the set {f ≥ y} on the axis', '軸上の集合 {f ≥ y}') }]);
      ctx.readout([
        { k: T('Riemann lower sum', 'リーマン下和'), v: fmt(riem, 4) },
        { k: T('Lebesgue lower sum', 'ルベーグ下和'), v: fmt(leb, 4) },
        { k: '∫f', v: fmt(INT, 4), tone: 'key' },
        { k: `λ{f ≥ ${fmt(yL, 2)}}`, v: fmt(meas(iv), 4) },
      ], T('Drag the gold handle: the Lebesgue sum only needs the length of each set {f ≥ y}, however many pieces it has.', '金色のハンドルをドラッグします。ルベーグ和に必要なのは、各集合 {f ≥ y} の長さだけで、何個に分かれていても構いません。'));
    },
  };

  /* ---------- 2. simple functions under sqrt ---------- */
  const sIntegral = (n) => { const N = 2 ** n; let s = 0; for (let k = 0; k < N; k++) s += (k / N) * ((2 * k + 1) / (N * N)); return s; };
  const stair = (n) => { const N = 2 ** n, pts = [[0, 0]]; for (let k = 0; k < N; k++) { const a = (k / N) ** 2, b = ((k + 1) / N) ** 2; pts.push([a, k / N], [b, k / N]); } pts.push([1, 1], [1, 0]); return pts; };
  D['simple-functions'] = {
    render(ctx, v) {
      const n = Math.round(v.resolution), N = 2 ** n;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`s${n} rounds √x down to a multiple of 1/${N}. Each step lives on the preimage [k²/4ⁿ, (k+1)²/4ⁿ).`, `s${n} は √x を 1/${N} の倍数に切り下げます。各段は逆像 [k²/4ⁿ, (k+1)²/4ⁿ) の上にあります。`));
      L.h('p', 'lab-cap', c2, T('The integrals ∫sₘ increase to ∫√x = 2/3.', '積分 ∫sₘ は ∫√x = 2/3 へ増加します。'));
      const a = L.fig(c1, { x: [0, 1], y: [0, 1.05], aspect: 0.8, maxH: 360, xlabel: 'x' });
      if (n <= 5) for (let k = 1; k < N; k++) a.hline(k / N, { c: 'muted', w: 0.6, dash: '2 4', op: 0.6, layer: 'under' });
      a.poly(stair(n), { c: 'c1', fo: 0.32, w: 1.2 });
      if (n >= 1) a.line(stair(n - 1).slice(0, -1), { c: 'c2', w: 1.6, dash: '5 3' });
      a.line(L.sample(0, 1, 300, Math.sqrt), { c: 'ink', w: 2.6 });
      if (n <= 5) for (let k = 1; k < N; k++) a.seg([(k / N) ** 2, 0], [(k / N) ** 2, 0.035], { c: 'hl', w: 2, layer: 'over' });
      a.hover((x) => { if (x < 0 || x > 1) return null; const s = Math.floor(N * Math.sqrt(x)) / N; return { x, y: s, text: `√x = ${fmt(Math.sqrt(x), 4)}, s${n} = ${fmt(s, 4)}` }; });
      const b = L.fig(c2, { x: [-0.6, 8.6], y: [0, 0.72], aspect: 0.8, maxH: 360, xlabel: T('level m', 'レベル m'), ticksX: L.seq(9, (m) => [m, String(m)]) });
      b.hline(2 / 3, { c: 'ink', w: 1.6, dash: '6 4' });
      b.text(-0.5, 2 / 3, '2/3', { anchor: 'start', dy: -6, small: true });
      for (let m = 0; m <= 8; m++) {
        const I = sIntegral(m);
        b.rect(m - 0.34, 0, 0.68, I, { c: m === n ? 'hl' : 'c1', fo: m === n ? 0.85 : m < n ? 0.45 : 0.15, w: 0.8 });
      }
      b.text(n, sIntegral(n), fmt(sIntegral(n), 4), { dy: -8, small: true });
      b.handle(n, 0.05, { c: 'hl', axis: 'x', snap: 1, bounds: [0, 8, 0, 1], label: T('Level n', 'レベル n'), onDrag: (m) => ctx.set('resolution', m) });
      L.legend(ctx.host, [{ c: 'ink', label: '√x' }, { kind: 'fill', c: 'c1', label: T(`s${n}, the area ∫s${n}`, `s${n} と面積 ∫s${n}`) }, { c: 'c2', dash: true, label: T(`previous level s${Math.max(0, n - 1)}`, `前のレベル s${Math.max(0, n - 1)}`) }, { c: 'hl', label: T('preimage endpoints k²/4ⁿ', '逆像の端点 k²/4ⁿ') }]);
      const I = sIntegral(n);
      ctx.readout([
        { k: `∫s${n}`, v: fmt(I, 5), tone: 'key' },
        { k: '2/3 − ∫sₙ', v: fmt(2 / 3 - I, 4) },
        { k: T('sup |√x − sₙ| ≤ 2⁻ⁿ', 'sup |√x − sₙ| ≤ 2⁻ⁿ'), v: fmt(1 / N, 4) },
        { k: T('steps', '段の数'), v: String(N) },
      ], T('sₙ₊₁ ≥ sₙ everywhere, so the integrals can only increase, and the monotone convergence theorem gives the limit 2/3.', 'どこでも sₙ₊₁ ≥ sₙ なので積分は増加するしかなく、単調収束定理により極限は 2/3 です。'));
    },
  };

  /* ---------- 3. a mass that escapes ---------- */
  D.convergence = {
    render(ctx, v) {
      const n = Math.round(v.n), st = ctx.state;
      if (st.x === undefined) st.x = 0.3;
      const x0 = st.x, fn = (m, x) => (x > 0 && x < 1 / m ? m : 0);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`f${n} = ${n}·1(0, 1/${n}): a spike of area 1. Drag the gold point x.`, `f${n} = ${n}·1(0, 1/${n})：面積1の尖り。金色の点 x をドラッグできます。`));
      L.h('p', 'lab-cap', c2, T('Along the sequence: the value at x drops to 0, the integral stays 1.', '列に沿って：x での値は0に落ちますが、積分は1のままです。'));
      const Y = Math.max(8, n * 1.12);
      const a = L.fig(c1, { x: [0, 1], y: [0, Y], aspect: 0.8, maxH: 360, xlabel: 'x' });
      // envelope sup_m f_m(x) = ceil(1/x) - 1, not integrable
      a.line(L.sample(0.004, 1, 1500, (x) => Math.ceil(1 / x - 1e-12) - 1), { c: 'c2', w: 1.4, dash: '5 3' });
      for (let m = 1; m < n; m++) a.line([[0, m], [1 / m, m], [1 / m, 0]], { c: 'c1', w: 1, op: 0.28 });
      a.rect(0, 0, 1 / n, n, { c: 'c1', fo: 0.45, w: 2 });
      a.text(1 / n, n, T(`f${n}: area 1`, `f${n}：面積 1`), { anchor: 'start', dx: 6, dy: 14, small: true });
      a.vline(x0, { c: 'hl', w: 1.2 });
      a.dot(x0, fn(n, x0), { c: 'hl', r: 6 });
      a.handle(x0, Y * 0.5, { c: 'hl', axis: 'x', bounds: [0.02, 0.98, 0, Y], label: T('Point x', '点 x'), onDrag: (x) => { st.x = x; ctx.redraw(); } });
      const b = L.fig(c2, { x: [0, 41], y: [0, Math.max(1.6, Math.ceil(1 / x0) * 1.1)], aspect: 0.8, maxH: 360, xlabel: 'n' });
      for (let m = 1; m <= 40; m++) {
        b.dot(m, 1, { c: 'c2', r: m === n ? 5.5 : 3 });
        b.dot(m, fn(m, x0), { c: 'c1', r: m === n ? 5.5 : 3, hollow: m !== n });
      }
      b.vline(n, { c: 'hl', w: 1.2, dash: '2 3' });
      const last = Math.ceil(1 / x0) - 1;
      if (last >= 1 && last < 40) b.text(last + 1, 0, T(`fₙ(x) = 0 from n = ${last + 1} on`, `n = ${last + 1} 以降は fₙ(x) = 0`), { anchor: 'start', dy: -22, small: true, c: 'c1' });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T(`f${n}, and the values fₙ(x)`, `f${n} と値 fₙ(x)`) }, { kind: 'dot', c: 'c2', label: '∫fₙ = 1' }, { c: 'c2', dash: true, label: T('sup over n of fₙ ≈ 1/x, with infinite integral', 'n についての上限 sup fₙ ≈ 1/x（積分は無限大）') }]);
      ctx.readout([
        { k: `f${n}(${fmt(x0, 2)})`, v: fmt(fn(n, x0), 3) },
        { k: `∫f${n}`, v: '1', tone: 'key' },
        { k: T('∫ of the limit', '極限の積分'), v: '0', tone: 'warn' },
        { k: T('∫ sup fₙ', '∫ sup fₙ'), v: '∞' },
      ], T('For each x > 0, fₙ(x) = 0 once n ≥ 1/x, yet the mass 1 escapes into the spike at 0. No integrable g dominates all fₙ, so dominated convergence does not apply.', '各 x > 0 で n ≥ 1/x となれば fₙ(x) = 0 ですが、質量1は0の尖りへ逃げます。すべての fₙ を支配する可積分な g はないので、優収束定理は使えません。'));
    },
  };
})();
