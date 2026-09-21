'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lg = Math.log2;
  const xlog = (x) => (x > 0 ? -x * lg(x) : 0);
  const H2 = (p) => xlog(p) + xlog(1 - p);

  D.entropy = {
    render(ctx, v) {
      const p = v.p, q = 1 - p, s1 = -lg(p), s0 = -lg(q), H = H2(p);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Width = probability, height = surprise −log₂ p, area = contribution to H', '幅 = 確率、高さ = 驚き −log₂ p、面積 = H への寄与'));
      const ym = Math.min(7.4, Math.max(2.4, Math.max(s1, s0) * 1.28));
      const f = L.fig(c1, { x: [0, 1], y: [0, ym], aspect: 0.8, maxH: 360, xlabel: T('probability', '確率'), ylabel: T('bits', 'ビット') });
      f.rect(0, 0, p, s1, { c: 'c1', fo: 0.35, w: 1.6 });
      f.rect(p, 0, q, s0, { c: 'c2', fo: 0.35, w: 1.6 });
      f.hline(H, { c: 'hl', dash: '6 4', w: 2.2 });
      f.text(p < 0.5 ? 1 : 0, H, `H = ${fmt(H, 3)}`, { anchor: p < 0.5 ? 'end' : 'start', dx: p < 0.5 ? -4 : 4, dy: -7, small: true });
      const lab = (x0, w, s, name, c) => {
        if (w < 0.08) { const right = x0 < 0.5; f.text(right ? x0 + w : x0, s * 0.85, name, { anchor: right ? 'start' : 'end', dx: right ? 6 : -6, c, small: true }); return; }
        const tall = s > 0.16 * ym;
        f.text(x0 + w / 2, s, tall ? name : `${name}, ${T('area', '面積')} ${fmt(w * s, 3)}`, { dy: -8, c, small: true });
        if (tall) f.text(x0 + w / 2, s / 2, `${T('area', '面積')} ${fmt(w * s, 3)}`, { dy: 4, small: true });
      };
      lab(0, p, s1, `“1”: ${fmt(s1, 2)} ${T('bits', 'ビット')}`, 'c1');
      lab(p, q, s0, `“0”: ${fmt(s0, 2)} ${T('bits', 'ビット')}`, 'c2');
      L.h('p', 'lab-cap', c2, T('Binary entropy H(p); drag the point', '二値エントロピー H(p)。点をドラッグできます'));
      const g = L.fig(c2, { x: [0, 1], y: [0, 1.1], aspect: 0.8, maxH: 360, xlabel: T('probability of one p', '1の確率 p'), ylabel: 'H(p)' });
      g.area(L.sample(0, 1, 300, H2), { c: 'c4', fo: 0.08 });
      g.line(L.sample(0, 1, 300, H2), { c: 'c4', w: 2.6 });
      g.seg([p, 0], [p, H], { c: 'hl', w: 1.6, dash: '3 3' });
      g.handle(p, H, { c: 'hl', axis: 'x', bounds: [0.01, 0.99, 0, 1.1], label: T('Probability of one', '1の確率'), onDrag: (x) => ctx.set('p', x) });
      g.text(p, H, fmt(H, 3), { dy: -16, anchor: p > 0.8 ? 'end' : p < 0.2 ? 'start' : 'middle' });
      g.text(0.5, 1, T('fair coin: 1 bit', '公平なコイン：1ビット'), { dy: -10, small: true, c: 'muted' });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('outcome 1', '結果 1') }, { kind: 'fill', c: 'c2', label: T('outcome 0', '結果 0') }, { c: 'hl', dash: true, label: T('average surprise = entropy', '平均の驚き = エントロピー') }, { c: 'c4', label: 'H(p)' }]);
      ctx.readout([{ k: 'H(X)', v: `${fmt(H, 4)} ${T('bits', 'ビット')}`, tone: 'key' }, { k: T('surprise of 1', '1の驚き'), v: fmt(s1, 3) }, { k: T('surprise of 0', '0の驚き'), v: fmt(s0, 3) }],
        T('A rare outcome is very surprising but seldom happens, so its area stays small.', 'まれな結果は驚きが大きいものの、めったに起こらないため面積は小さいままです。'));
    },
  };

  D.channel = {
    render(ctx, v) {
      const e = v.noise, pi = v.input ?? 0.5, py = pi * (1 - e) + (1 - pi) * e;
      const HY = H2(py), HYX = H2(e), I = HY - HYX, C = 1 - HYX;
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('The binary symmetric channel and 32 bits sent through it', '二値対称通信路と、そこを通した32ビット'));
      const f = L.stage(c1, { w: 100, h: 78, maxH: 380 });
      const X0 = [22, 64], X1 = [22, 38], Y0 = [78, 64], Y1 = [78, 38];
      const wid = (x) => 0.8 + 6 * x;
      f.arrow([X0[0] + 5, X0[1]], [Y0[0] - 6, Y0[1]], { c: 'c1', w: wid(1 - e) });
      f.arrow([X1[0] + 5, X1[1]], [Y1[0] - 6, Y1[1]], { c: 'c1', w: wid(1 - e) });
      if (e > 0) { f.arrow([X0[0] + 5, X0[1] - 1.5], [Y1[0] - 6, Y1[1] + 1.5], { c: 'c2', w: wid(e) }); f.arrow([X1[0] + 5, X1[1] + 1.5], [Y0[0] - 6, Y0[1] - 1.5], { c: 'c2', w: wid(e) }); }
      [[X0, '0'], [X1, '1'], [Y0, '0'], [Y1, '1']].forEach(([P, s]) => { f.circle(P[0], P[1], 4.2, { c: 'ink', fill: 'plate', fo: 1, w: 1.6 }); f.text(P[0], P[1], s, { dy: 5 }); });
      f.text(22, 73, 'X', { math: true, dy: 4 }); f.text(78, 73, 'Y', { math: true, dy: 4 });
      f.text(50, 67.5, `1 − f = ${fmt(1 - e, 2)}`, { c: 'c1', small: true });
      if (e > 0) f.text(50, 44, `f = ${fmt(e, 2)}`, { c: 'c2', small: true, dy: 4 });
      const r = rng(424242), N = 32;
      const sent = L.seq(N, () => (r() < pi ? 1 : 0));
      const r2 = rng(99991), flips = L.seq(N, () => r2() < e);
      const cw = 100 / (N + 2);
      f.text(1, 24, T('sent', '送信'), { anchor: 'start', small: true, dy: -8 });
      f.text(1, 11, T('received', '受信'), { anchor: 'start', small: true, dy: -8 });
      sent.forEach((b, i) => {
        const x = cw * (i + 1), got = flips[i] ? 1 - b : b;
        f.rect(x, 17, cw * 0.84, 5, { c: b ? 'ink' : 'muted', fo: b ? 0.75 : 0.08, w: 0.8 });
        f.rect(x, 4, cw * 0.84, 5, { c: flips[i] ? 'c2' : got ? 'ink' : 'muted', fo: got ? 0.75 : 0.08, w: flips[i] ? 2 : 0.8 });
      });
      L.h('p', 'lab-cap', c2, T('Information as a function of the input probability', '入力確率の関数としての情報量'));
      const g = L.fig(c2, { x: [0, 1], y: [0, 1.16], aspect: 0.8, maxH: 380, xlabel: T('input probability P(X = 1)', '入力確率 P(X = 1)'), ylabel: T('bits', 'ビット') });
      const hy = (t) => H2(t * (1 - e) + (1 - t) * e);
      g.poly(L.sample(0, 1, 200, (t) => [t, hy(t)]).concat([[1, HYX], [0, HYX]]), { c: 'hl', fo: 0.22, w: 0 });
      g.line(L.sample(0, 1, 200, hy), { c: 'c1', w: 2.6 });
      g.hline(HYX, { c: 'c2', dash: false, w: 2.2 });
      g.seg([pi, HYX], [pi, HY], { c: 'ink', w: 2.6 });
      g.handle(pi, HY, { c: 'hl', axis: 'x', bounds: [0.01, 0.99, 0, 1], label: T('Input probability', '入力確率'), onDrag: (x) => ctx.set('input', x) });
      g.text(pi, (HY + HYX) / 2, `I = ${fmt(I, 3)}`, { dx: pi > 0.6 ? -8 : 8, anchor: pi > 0.6 ? 'end' : 'start', dy: 4, small: true });
      if (C > 0.02) { g.dot(0.5, 1, { c: 'ink', r: 3.5 }); g.text(0.5, 1, `C = ${fmt(C, 3)}`, { dy: -14, small: true }); }
      L.legend(ctx.host, [{ c: 'c1', label: 'H(Y)' }, { c: 'c2', label: 'H(Y | X) = H(f)' }, { kind: 'fill', c: 'hl', label: 'I(X; Y) = H(Y) − H(Y | X)' }, { kind: 'fill', c: 'c2', label: T('bit flipped by the channel', '通信路で反転したビット') }]);
      ctx.readout([{ k: 'H(Y)', v: fmt(HY, 3) }, { k: 'H(Y | X)', v: fmt(HYX, 3) }, { k: 'I(X; Y)', v: fmt(I, 3), tone: 'key' }, { k: T('capacity 1 − H(f)', '容量 1 − H(f)'), v: fmt(C, 3) }, { k: T('flips in the sample', '標本での反転'), v: `${flips.filter(Boolean).length} / ${N}` }],
        T('The noise sets the floor H(f); the input distribution sets how far H(Y) rises above it. A uniform input reaches capacity.', '雑音が下限 H(f) を決め、入力分布が H(Y) をどこまで押し上げるかを決めます。一様な入力で容量に達します。'));
    },
  };

  D.kl = {
    render(ctx, v) {
      const p = v.p, q = v.q;
      const dkl = (a, b) => a * lg(a / b) + (1 - a) * lg((1 - a) / (1 - b));
      const Dpq = dkl(p, q), Dqp = dkl(q, p), HP = H2(p);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Observed P and model Q; each term P(x) log₂(P(x)/Q(x)) is written below', '観測 P とモデル Q。各項 P(x) log₂(P(x)/Q(x)) を下に示します'));
      const f = L.fig(c1, { x: [0, 2], y: [-0.4, 1.08], aspect: 0.8, maxH: 360, ticksX: [[0.5, T('x = 1', 'x = 1')], [1.5, T('x = 0', 'x = 0')]], ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']], grid: false });
      [[0.5, p, q], [1.5, 1 - p, 1 - q]].forEach(([cx, a, b]) => {
        f.rect(cx - 0.34, 0, 0.3, a, { c: 'c1', fo: 0.45, w: 1.4 });
        f.rect(cx + 0.04, 0, 0.3, b, { c: 'c4', fo: 0.3, w: 1.4, dash: '4 3' });
        f.text(cx - 0.19, a, fmt(a, 2), { dy: -9, small: true, c: 'c1' });
        f.text(cx + 0.19, b, fmt(b, 2), { dy: -9, small: true, c: 'c4' });
        const term = a * lg(a / b);
        f.text(cx, -0.14, `${term >= 0 ? '+' : '−'}${fmt(Math.abs(term), 3)}`, { dy: 5, c: term >= 0 ? 'c2' : 'c3' });
      });
      f.hline(0, { c: 'ink', dash: false, w: 1 });
      f.text(1, -0.14, '+', { dy: 5, c: 'muted' });
      f.text(1, -0.3, `${T('sum', '和')} = ${fmt(Dpq, 3)} ${T('bits', 'ビット')}`, { dy: 5, c: 'c1' });
      L.h('p', 'lab-cap', c2, T('Both divergences as the model Q moves; drag the point', 'モデル Q を動かしたときの2つのダイバージェンス。点をドラッグできます'));
      const qs = L.sample(0.05, 0.95, 240, (x) => x);
      const ymax = Math.max(1, ...[0.05, 0.95].map((x) => Math.max(dkl(p, x), dkl(x, p)))) * 1.1;
      const g = L.fig(c2, { x: [0, 1], y: [0, ymax], aspect: 0.8, maxH: 360, xlabel: T('model probability q', 'モデル確率 q'), ylabel: T('bits', 'ビット') });
      g.line(qs.map(([x]) => [x, dkl(p, x)]), { c: 'c1', w: 2.6 });
      g.line(qs.map(([x]) => [x, dkl(x, p)]), { c: 'c4', w: 2.2, dash: '7 4' });
      g.vline(p, { c: 'muted', w: 1.2 });
      g.text(p, ymax, 'q = p', { dy: 14, dx: 5, anchor: 'start', small: true, c: 'muted' });
      g.seg([q, Dqp], [q, Dpq], { c: 'ink', w: 1.2, dash: '2 3' });
      g.dot(q, Dqp, { c: 'c4', r: 5 });
      g.handle(q, Dpq, { c: 'hl', axis: 'x', bounds: [0.05, 0.95, 0, ymax], label: T('Model probability', 'モデル確率'), onDrag: (x) => ctx.set('q', x) });
      L.legend(ctx.host, [{ kind: 'fill', c: 'c1', label: T('observed P', '観測 P') }, { kind: 'fill', c: 'c4', label: T('model Q', 'モデル Q') }, { c: 'c1', label: 'D(P ‖ Q)' }, { c: 'c4', dash: true, label: 'D(Q ‖ P)' }]);
      ctx.readout([{ k: 'D(P ‖ Q)', v: `${fmt(Dpq, 4)} ${T('bits', 'ビット')}`, tone: 'key' }, { k: 'D(Q ‖ P)', v: fmt(Dqp, 4) }, { k: 'H(P)', v: fmt(HP, 3) }, { k: T('cross-entropy H(P, Q)', '交差エントロピー H(P, Q)'), v: fmt(HP + Dpq, 3) }],
        T('One term can be negative, but the sum never is. The two directions differ unless p = q or q = 1 − p.', '1つの項は負になり得ますが、和は負になりません。p = q または q = 1 − p でない限り、2つの向きの値は異なります。'));
    },
  };
})();
