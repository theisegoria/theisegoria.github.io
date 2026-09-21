'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = L.TAU;
  const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
  const GIBBS = 1.1789797444721672; // (2/π) Si(π), the limiting peak of the partial sums

  /* ---------- 1. square wave from odd harmonics ---------- */
  const bk = (k) => 4 / (PI * (2 * k + 1));
  const SN = (x, N) => { let s = 0; for (let k = 0; k < N; k++) s += Math.sin((2 * k + 1) * x) / (2 * k + 1); return 4 * s / PI; };

  D.harmonics = {
    render(ctx, v) {
      const N = Math.round(v.n), xp = PI / (2 * N), peak = SN(xp, N);
      const f = L.fig(ctx.host, { x: [-PI, PI], y: [-1.5, 1.5], piX: true, aspect: 0.46, maxH: 360, xlabel: 'x' });
      // target square wave
      f.line([[-PI, -1], [0, -1]], { c: 'ink', w: 1.6, op: 0.45 });
      f.line([[0, 1], [PI, 1]], { c: 'ink', w: 1.6, op: 0.45 });
      f.line([[0, -1], [0, 1]], { c: 'ink', w: 1, op: 0.3, dash: '3 3' });
      // the harmonic added last
      const kLast = 2 * N - 1;
      f.line(L.sample(-PI, PI, 900, (x) => 4 / PI * Math.sin(kLast * x) / kLast), { c: 'c2', w: 1.3, op: 0.7 });
      f.line(L.sample(-PI, PI, 1400, (x) => SN(x, N)), { c: 'c1', w: 2.4 });
      f.hline(GIBBS, { c: 'hl', w: 1.1, dash: '4 4' });
      f.dot(xp, peak, { c: 'hl', r: 5.5 });
      f.dot(-xp, -peak, { c: 'hl', r: 4, op: 0.8 });
      f.dot(0, 0, { c: 'ink', r: 4.5 });
      f.text(xp, peak, T(`peak ${fmt(peak, 4)}`, `山 ${fmt(peak, 4)}`), { anchor: 'start', dx: 9, dy: -8, small: true });
      f.text(0, 0, T(`S${sub(N)}(0) = 0, the midpoint`, `S${sub(N)}(0) = 0（中点）`), { anchor: 'start', dx: 8, dy: 16, small: true });
      f.text(-PI / 2, GIBBS, T('limit peak 1.179', '極限の山 1.179'), { dy: -6, small: true, c: 'hl' });
      f.hover((x) => ({ x, y: SN(x, N), text: `S${sub(N)}(${fmt(x, 3)}) = ${fmt(SN(x, N), 4)}` }));
      L.legend(ctx.host, [{ c: 'ink', label: T('square wave', '矩形波') }, { c: 'c1', label: T(`partial sum S${sub(N)}`, `部分和 S${sub(N)}`) }, { c: 'c2', label: T(`last term added, k = ${kLast}`, `最後に加えた項 k = ${kLast}`) }, { c: 'hl', dash: true, label: T('Gibbs limit (2/π)Si(π)', 'ギブスの極限 (2/π)Si(π)') }]);

      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Zoom on the jump at x = 0: the overshoot keeps its height but its width shrinks like π/(2N).', 'x = 0 の跳躍を拡大：行き過ぎの高さは残り、幅は π/(2N) のように縮みます。'));
      const z = L.fig(c1, { x: [0, 1.2], y: [0.5, 1.3], aspect: 0.62, maxH: 280, xlabel: 'x' });
      z.hline(1, { c: 'ink', dash: false, w: 1.4, op: 0.45 });
      z.hline(GIBBS, { c: 'hl', w: 1.1, dash: '4 4' });
      for (const M of [Math.max(1, Math.round(N / 4)), Math.max(1, Math.round(N / 2))]) if (M < N) z.line(L.sample(0, 1.2, 300, (x) => SN(x, M)), { c: 'c1', w: 1.2, op: 0.3 });
      z.line(L.sample(0, 1.2, 600, (x) => SN(x, N)), { c: 'c1', w: 2.4 });
      z.seg([0, 0.62], [xp, 0.62], { c: 'hl', w: 2 });
      z.seg([xp, 0.58], [xp, peak], { c: 'hl', w: 1, dash: '2 3' });
      z.dot(xp, peak, { c: 'hl', r: 5 });
      z.text(xp, 0.62, `π/(2N) = ${fmt(xp, 3)}`, { anchor: 'start', dx: 6, dy: 4, small: true });

      L.h('p', 'lab-cap', c2, T('Sine coefficients bₖ = 4/(πk): only odd k occur, and they decay like 1/k.', '正弦係数 bₖ = 4/(πk)：奇数 k だけが現れ、1/k のように減衰します。'));
      const K = Math.max(21, 2 * N + 3);
      const g = L.fig(c2, { x: [0, K], y: [0, 1.4], aspect: 0.62, maxH: 280, xlabel: T('harmonic k', '調和波の次数 k'), ylabel: 'bₖ' });
      for (let k = 1; k <= K; k += 2) {
        const on = k <= kLast;
        g.seg([k, 0], [k, 4 / (PI * k)], { c: on ? (k === kLast ? 'c2' : 'c1') : 'muted', w: g.small ? 2.5 : 4, op: on ? 0.95 : 0.35 });
      }
      g.line(L.sample(1, K, 200, (k) => 4 / (PI * k)), { c: 'muted', w: 1, dash: '3 3' });
      let s2 = 0; for (let k = 0; k < N; k++) s2 += bk(k) ** 2;
      const rel = Math.sqrt(Math.max(0, 1 - s2 / 2));
      ctx.readout([
        { k: T('highest harmonic', '最高次数'), v: String(kLast) },
        { k: T(`peak of S${sub(N)}`, `S${sub(N)} の山`), v: fmt(peak, 4), tone: 'key' },
        { k: T('overshoot / jump', '行き過ぎ／跳躍幅'), v: fmt((peak - 1) / 2 * 100, 2) + '%' },
        { k: T('relative L² error', '相対 L² 誤差'), v: fmt(rel, 4), tone: 'good' },
      ], T('The L² error tends to 0 while the overshoot tends to about 8.95% of the jump: convergence in mean, not uniform.', 'L² 誤差は 0 に近づきますが、行き過ぎは跳躍幅の約 8.95% に近づきます。平均収束であって一様収束ではありません。'));
    },
  };

  /* ---------- 2. convolution ---------- */
  // f is the unit pulse on [-1/2, 1/2]; g is chosen. G is an antiderivative of g, so (f*g)(t) = G(t+1/2) - G(t-1/2).
  const SHAPES = [
    { g: (s) => (Math.abs(s) <= 0.5 ? 1 : 0), G: (s) => L.clamp(s + 0.5, 0, 1), lo: -0.5, hi: 0.5, top: 1.3, name: ['unit pulse', '単位パルス'] },
    { g: (s) => (s >= 0 && s <= 1 ? 2 * s : 0), G: (s) => L.clamp(s, 0, 1) ** 2, lo: 0, hi: 1, top: 2.3, name: ['ramp 2s on [0, 1]', '[0, 1] 上の傾斜 2s'] },
    { g: (s) => (s >= 0 ? Math.exp(-s) : 0), G: (s) => (s > 0 ? 1 - Math.exp(-s) : 0), lo: 0, hi: 8, top: 1.3, name: ['decay e⁻ˢ for s ≥ 0', 's ≥ 0 で減衰 e⁻ˢ'] },
  ];
  D.convolution = {
    render(ctx, v) {
      const S = SHAPES[Math.round(v.shape ?? 0)] || SHAPES[0], t = v.t;
      const conv = (tt) => S.G(tt + 0.5) - S.G(tt - 0.5);
      const X0 = -2.2, X1 = 3.2;
      L.h('p', 'lab-cap', ctx.host, T('Top: f(τ) and the reflected, shifted g(t − τ). The shaded product has area (f * g)(t).', '上：f(τ) と反転して移動した g(t − τ)。塗られた積の面積が (f * g)(t) です。'));
      const a = L.fig(ctx.host, { x: [X0, X1], y: [0, S.top], aspect: 0.34, maxH: 250, minH: 180, xlabel: 'τ' });
      const gs = (tau) => S.g(t - tau);
      const fr = (tau) => (Math.abs(tau) <= 0.5 ? 1 : 0);
      if (v.shape > 0) a.line(L.sample(X0, X1, 900, (tau) => S.g(tau)), { c: 'muted', w: 1.2, dash: '4 4', op: 0.8 });
      a.area(L.sample(X0, X1, 1100, (tau) => fr(tau) * gs(tau)), { c: 'hl', fo: 0.5 });
      a.line(L.sample(X0, X1, 1100, fr), { c: 'c1', w: 2.4 });
      a.line(L.sample(X0, X1, 1100, gs), { c: 'c2', w: 2.4 });
      a.vline(t, { c: 'c2', w: 1, dash: '2 3' });
      a.text(-0.5, 1, 'f(τ)', { dy: -7, dx: -4, anchor: 'end', c: 'c1', math: true });
      const gl = v.shape === 1 ? [t - 1, 2, 'end', -6] : v.shape === 2 ? [t, 1, 'start', 6] : [t + 0.5, 1, 'start', 4];
      a.text(L.clamp(gl[0], X0 + 0.2, X1 - 0.2), gl[1], 'g(t − τ)', { dy: -7, dx: gl[3], anchor: gl[2], c: 'c2', math: true });
      a.handle(t, S.top * 0.08, { c: 'c2', axis: 'x', bounds: [-1.5, 2.5, 0, S.top], label: T('Shift t', 'ずれ t'), onDrag: (x) => ctx.set('t', x) });

      L.h('p', 'lab-cap', ctx.host, T('Bottom: the convolution as a function of the shift t.', '下：ずれ t の関数としての畳み込み。'));
      const b = L.fig(ctx.host, { x: [X0, X1], y: [0, 1.15], aspect: 0.3, maxH: 230, minH: 170, xlabel: 't' });
      b.area(L.sample(X0, X1, 800, conv), { c: 'c4', fo: 0.12 });
      b.line(L.sample(X0, X1, 800, conv), { c: 'c4', w: 2.4 });
      b.seg([t, 0], [t, conv(t)], { c: 'hl', w: 2 });
      b.dot(t, conv(t), { c: 'hl', r: 6 });
      b.text(t, conv(t), fmt(conv(t), 3), { anchor: 'start', dx: 10, dy: -4, small: true });
      b.handle(t, 0.06, { c: 'c2', axis: 'x', bounds: [-1.5, 2.5, 0, 1], label: T('Shift t', 'ずれ t'), onDrag: (x) => ctx.set('t', x) });
      b.hover((x) => ({ x, y: conv(x), text: `(f * g)(${fmt(x, 2)}) = ${fmt(conv(x), 3)}` }));
      const leg = [{ c: 'c1', label: T('f: unit pulse', 'f：単位パルス') }, { c: 'c2', label: `g: ${T(S.name[0], S.name[1])}` }, { kind: 'fill', c: 'hl', label: T('product f(τ)g(t − τ)', '積 f(τ)g(t − τ)') }, { c: 'c4', label: 'f * g' }];
      if (v.shape > 0) leg.splice(2, 0, { c: 'muted', dash: true, label: T('g(τ) before reflection', '反転前の g(τ)') });
      L.legend(ctx.host, leg);
      ctx.readout([{ k: 't', v: fmt(t, 2) }, { k: T('(f * g)(t) = shaded area', '(f * g)(t) = 塗られた面積'), v: fmt(conv(t), 4), tone: 'key' }, { k: '∫ f * g = (∫f)(∫g)', v: '1' }],
        v.shape > 0 ? T('Drag either orange handle. The dashed g(τ) is flipped before it slides, so the output leans the other way.', '橙のハンドルをドラッグできます。破線の g(τ) は移動の前に反転されるため、出力の傾きの向きが変わります。') : T('Drag either orange handle. For two unit pulses the overlap length is 1 − |t|, a triangle.', '橙のハンドルをドラッグできます。2つの単位パルスでは重なりの長さは 1 − |t| で、三角形になります。'));
    },
  };

  /* ---------- 3. sampling and aliasing ---------- */
  D.sampling = {
    render(ctx, v) {
      const fq = v.f, fs = v.fs, nyq = fs / 2;
      const al = Math.abs((((fq + nyq) % fs) + fs) % fs - nyq);
      const aliased = Math.abs(al - fq) > 1e-9;
      L.h('p', 'lab-cap', ctx.host, T('One second of signal. Every sample of the fast cosine also lies on the slow dashed cosine.', '1秒間の信号。速い余弦波の標本はすべて、遅い破線の余弦波の上にもあります。'));
      const a = L.fig(ctx.host, { x: [0, 1], y: [-1.35, 1.35], aspect: 0.36, maxH: 280, minH: 190, xlabel: T('time t (s)', '時間 t（秒）') });
      a.line(L.sample(0, 1, 1200, (x) => Math.cos(TAU * fq * x)), { c: 'c1', w: 1.8 });
      if (aliased) a.line(L.sample(0, 1, 600, (x) => Math.cos(TAU * al * x)), { c: 'c2', w: 2.4, dash: '6 4' });
      for (let n = 0; n <= fs; n++) {
        const tt = n / fs, y = Math.cos(TAU * fq * tt);
        a.seg([tt, 0], [tt, y], { c: 'hl', w: 1.4, op: 0.8 });
        a.dot(tt, y, { c: 'hl', r: a.small ? 3.5 : 4.5 });
      }
      a.hover((x) => ({ x, text: `t = ${fmt(x, 3)}: cos(2πft) = ${fmt(Math.cos(TAU * fq * x), 3)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T(`signal, ${fmt(fq)} Hz`, `信号 ${fmt(fq)} Hz`) }, { kind: 'dot', c: 'hl', label: T(`samples, ${fs} per second`, `標本（毎秒 ${fs} 個）`) }].concat(aliased ? [{ c: 'c2', dash: true, label: T(`alias, ${fmt(al)} Hz`, `エイリアス ${fmt(al)} Hz`) }] : []));

      L.h('p', 'lab-cap', ctx.host, T('Frequency axis: sampling copies the spectrum to k·fₛ ± f. Only the copy inside [0, fₛ/2] is seen.', '周波数軸：標本化はスペクトルを k·fₛ ± f に複製します。見えるのは [0, fₛ/2] 内の複製だけです。'));
      const F1 = Math.max(fs + fq, fq + 2, 2 * fs) + 1;
      const b = L.fig(ctx.host, { x: [0, F1], y: [0, 1.35], aspect: 0.26, maxH: 210, minH: 170, xlabel: T('frequency (Hz)', '周波数（Hz）'), ticksY: [] });
      b.rect(0, 0, nyq, 1.35, { c: 'c3', fo: 0.12, nostroke: true, layer: 'under' });
      b.vline(nyq, { c: 'c3', w: 1.4, dash: '4 3' });
      b.text(nyq, 1.35, 'fₛ/2', { dy: 14, dx: 4, anchor: 'start', small: true, c: 'c3' });
      for (let k = 1; k * fs <= F1 + fq; k++) {
        b.vline(k * fs, { c: 'muted', w: 1, dash: '2 4' });
        b.text(k * fs, 1.35, k === 1 ? 'fₛ' : `${k}fₛ`, { dy: 14, dx: 4, anchor: 'start', small: true, c: 'muted' });
        for (const s of [-1, 1]) { const x = k * fs + s * fq; if (x > 1e-9 && x < F1) { b.seg([x, 0], [x, 0.55], { c: 'muted', w: 2.4, op: 0.7 }); b.dot(x, 0.55, { c: 'muted', r: 3 }); } }
      }
      b.seg([fq, 0], [fq, 1], { c: 'c1', w: 3 }); b.dot(fq, 1, { c: 'c1', r: 4.5 });
      b.text(fq, 1, 'f', { dy: -8, math: true, c: 'c1' });
      if (aliased) {
        b.seg([al, 0], [al, 0.8], { c: 'c2', w: 3 }); b.dot(al, 0.8, { c: 'c2', r: 4.5 });
        b.text(al, 0.8, T('seen', '見える'), { dy: -8, c: 'c2', small: true });
        b.arrow([fq, 0.22], [al + (fq > al ? 0.25 : -0.25), 0.22], { c: 'c2', w: 1.5, dash: '4 3' });
      }
      ctx.readout([
        { k: T('Nyquist frequency fₛ/2', 'ナイキスト周波数 fₛ/2'), v: fmt(nyq) + ' Hz' },
        { k: T('apparent frequency', '見かけの周波数'), v: fmt(al) + ' Hz', tone: aliased ? 'warn' : 'good' },
        { k: T('samples per period', '1周期あたりの標本数'), v: fmt(fs / fq, 2) },
      ], Math.abs(fq - nyq) < 1e-9 ? T('Exactly at fₛ/2 the samples alternate ±1; a sine of this frequency would give all zeros, so this case is already ambiguous.', 'ちょうど fₛ/2 では標本は ±1 を交互に取ります。同じ周波数の正弦波なら標本はすべて0になるので、この場合もすでに曖昧です。')
        : aliased ? T('f is above fₛ/2, so it folds back into the band and masquerades as the dashed cosine.', 'f が fₛ/2 を超えているため、帯域内に折り返され、破線の余弦波に化けます。')
          : T('f is below fₛ/2: the samples determine this cosine among all band-limited signals.', 'f は fₛ/2 未満です。帯域制限された信号の中で、標本がこの余弦波を決定します。'));
    },
  };
})();
