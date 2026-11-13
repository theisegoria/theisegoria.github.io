'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, G = 9.81, clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * Mass m on spring k with damper c: natural frequency f_n = sqrt(k/m) / 2 pi, damping ratio zeta = c / (2 sqrt(k m)).
   * Driven by a force F cos(wt), with r = f / f_n: amplitude over static deflection
   *   H(r) = 1 / sqrt((1 - r^2)^2 + (2 zeta r)^2), lagging the force by atan2(2 zeta r, 1 - r^2).
   * Left alone: x = exp(-zeta w_n t) cos(w_d t), w_d = w_n sqrt(1 - zeta^2); successive peaks fall by exp(-delta),
   *   delta = 2 pi zeta / sqrt(1 - zeta^2). Q = 1 / (2 zeta).
   * Isolation: force passed to the floor over force applied, T(r) = sqrt((1 + (2 zeta r)^2) / ((1 - r^2)^2 + (2 zeta r)^2));
   *   T = 1 at r = sqrt 2 whatever the damping. A mount that sags d under the load has f_n = sqrt(g / d) / 2 pi.
   */
  const gain = (r, z) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
  const lag = (r, z) => (Math.atan2(2 * z * r, 1 - r * r) * 180) / PI;
  const peakRatio = (z) => (z < Math.SQRT1_2 ? Math.sqrt(1 - 2 * z * z) : 0);
  const peakGain = (z) => (z < Math.SQRT1_2 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1);
  const quality = (z) => 1 / (2 * z);
  const logDec = (z) => (2 * PI * z) / Math.sqrt(1 - z * z);
  const dampedFreq = (fn, z) => fn * Math.sqrt(1 - z * z);
  const ring = (t, fn, z) => (z < 1 ? Math.exp(-z * 2 * PI * fn * t) * Math.cos(2 * PI * dampedFreq(fn, z) * t) : (1 + 2 * PI * fn * t) * Math.exp(-2 * PI * fn * t));
  const envelope = (t, fn, z) => Math.exp(-Math.min(z, 1) * 2 * PI * fn * t);
  const cyclesToHalve = (z) => Math.LN2 / logDec(z);
  const transmit = (r, z) => Math.sqrt((1 + (2 * z * r) ** 2) / ((1 - r * r) ** 2 + (2 * z * r) ** 2));
  const mountFreq = (sagMm) => Math.sqrt(G / (sagMm / 1000)) / (2 * PI);
  const sagFor = (fn) => (G / (2 * PI * fn) ** 2) * 1000;
  const M = { gain, lag, peakRatio, peakGain, quality, logDec, dampedFreq, ring, envelope, cyclesToHalve, transmit, mountFreq, sagFor };
  (window.LabModels = window.LabModels || {})['vibration-resonance'] = M;

  /* ================= 1. the driven oscillator ================= */
  D['driven-oscillator'] = {
    render(ctx, v) {
      const z = v.zeta, r = v.r, H = gain(r, z), ph = lag(r, z), top = Math.min(12, Math.max(3, Math.ceil(peakGain(z) * 1.15)));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`How far a mass on a spring swings when pushed back and forth, compared with how far the same force would move it if applied slowly, against the rate of pushing. At 1 the push keeps time with the system’s own vibration, and each push adds to the last. Only the damping limits the swing there. The grey curves are for half and twice the damping. Drag the gold point.`, tx`ばねに付いたおもりを前後に押したときの振れ幅を、同じ力をゆっくり加えた場合の変位と比べ、押す速さに対して描いています。1 のところでは、押す動きが系自身の振動と同じ調子になり、1 回ごとの押しが前の押しに加わります。そこで振れ幅を抑えるのは、減衰だけです。灰色の曲線は、減衰が半分の場合と 2 倍の場合です。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 3], y: [0, top], aspect: 0.7, maxH: 350, xlabel: T('driving frequency over natural frequency', '駆動の周波数と固有振動数の比'), ylabel: T('swing over slow deflection', '振れ幅と、ゆっくり押した変位の比') });
      a.hline(1, { c: 'muted', dash: '4 3' }); for (const k of [0.5, 2]) a.line(L.sample(0, 3, 300, (q) => Math.min(top, gain(q, z * k))), { c: 'muted', w: 1.3 }); a.line(L.sample(0, 3, 300, (q) => Math.min(top, gain(q, z))), { c: 'c1', w: 2.8 });
      a.handle(r, Math.min(top, H), { c: 'hl', axis: 'x', bounds: [0, 3, 0, top], label: T('driving frequency', '駆動の周波数'), onDrag: (x) => ctx.set('r', clamp(Math.round(x * 50) / 50, 0.02, 3)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`How far the swing lags behind the push. Driven slowly, the mass follows the force: the spring is in charge. Driven fast, it moves opposite to the force: its inertia is in charge. At resonance it is a quarter of a cycle behind, so the force always pushes in the direction the mass is moving, which is the condition for feeding in the most power.`, tx`振れが押す力よりどれだけ遅れるかを描いています。ゆっくり駆動すると、おもりは力に従って動きます。ばねが支配しているからです。速く駆動すると、力と反対に動きます。慣性が支配しているからです。共振のところでは 4 分の 1 周期遅れるので、力はつねに、おもりが動いている向きに押します。これは、最も多くのパワーを送り込む条件です。`));
      const b = L.fig(c2, { x: [0, 3], y: [0, 180], aspect: 0.7, maxH: 350, xlabel: T('driving frequency over natural frequency', '駆動の周波数と固有振動数の比'), ylabel: T('lag behind the force (degrees)', '力に対する遅れ（度）'), ticksY: [[0, '0'], [45, '45'], [90, '90'], [135, '135'], [180, '180']] });
      b.hline(90, { c: 'muted', dash: '4 3' }); b.vline(1, { c: 'muted', dash: '4 3' }); b.line(L.sample(0, 3, 300, (q) => lag(q, z)), { c: 'c2', w: 2.8 }); b.dot(r, ph, { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('swing', '振れ幅') }, { c: 'muted', label: T('half and twice the damping', '減衰が半分、2 倍の場合') }, { c: 'c2', label: T('lag', '遅れ') }]);
      ctx.readout([
        { k: T('swing over slow deflection', '振れ幅と、ゆっくり押した変位の比'), v: tx`\(${fmt(H, 2)}\)`, tone: 'key' },
        { k: T('lag behind the force', '力に対する遅れ'), v: tx`\(${fmt(ph, 0)}^\circ\)` },
        { k: T('largest swing, and where', '最大の振れ幅と、その位置'), v: tx`\(${fmt(peakGain(z), 2)}\ \text{at}\ ${fmt(peakRatio(z), 3)}\)` },
        { k: T('quality factor', 'Q 値'), v: tx`\(${fmt(quality(z), 1)}\)` },
        { k: T('width of the peak', 'ピークの幅'), v: tx`\(${fmt(2 * z * 100, 0)}\,\%\)` },
      ], T(r < 0.6 ? 'Well below resonance: the spring holds the mass against the force, and the mass goes where it is pushed.' : r > 1.5 ? 'Well above resonance: the force reverses before the mass has gone far. Faster still and it barely moves, which is the principle of every vibration mount.' : 'Near resonance, where a small push repeated in time builds a large swing. The lighter the damping, the taller and narrower the peak.', r < 0.6 ? '共振よりかなり下です。ばねが力に逆らっておもりを支え、おもりは押された向きに動きます。' : r > 1.5 ? '共振よりかなり上です。おもりが大きく動く前に、力の向きが変わります。さらに速くすると、ほとんど動かなくなります。これが、あらゆる防振マウントの原理です。' : '共振の近くです。小さな押しを調子を合わせて繰り返すと、大きな振れに育ちます。減衰が小さいほど、ピークは高く、狭くなります。'));
    },
  };

  /* ================= 2. ringing down ================= */
  D['ring-down'] = {
    render(ctx, v) {
      const z = v.zeta, fn = v.fn, span = v.cyc / fn, d = z < 1 ? logDec(z) : Infinity;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A mass on a spring pulled aside and let go. It swings at very nearly its natural frequency, \(${fmt(fn, 1)}\) Hz, inside an envelope (dashed) that shrinks by the same fraction in every cycle. Raise the damping to 1 and it stops swinging altogether: it returns once, as fast as it can without overshooting.`, tx`ばねに付いたおもりを横に引いて、離したところです。おもりは、固有振動数の \(${fmt(fn, 1)}\) Hz にごく近い周波数で、包絡線（破線）の内側を振動します。包絡線は、1 周期ごとに同じ割合で縮みます。減衰を 1 まで上げると、振動はまったくしなくなり、行き過ぎないぎりぎりの速さで、一度だけ戻ります。`));
      const a = L.fig(c1, { x: [0, span], y: [-1.05, 1.05], aspect: 0.7, maxH: 350, xlabel: T('time (s)', '時間（s）'), ylabel: T('displacement', '変位') });
      a.hline(0, { c: 'muted', w: 1 }); if (z < 1) { a.line(L.sample(0, span, 200, (t) => envelope(t, fn, z)), { c: 'muted', w: 1.4, dash: '5 4' }); a.line(L.sample(0, span, 200, (t) => -envelope(t, fn, z)), { c: 'muted', w: 1.4, dash: '5 4' }); }
      a.line(L.sample(0, span, 900, (t) => ring(t, fn, z)), { c: 'c1', w: 2.4 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The number of swings it takes for the motion to fall to half, against the damping ratio, both on logarithmic scales. The quality factor Q is a count of the same thing: roughly the number of swings, times three, before the energy has all but gone. A car on its dampers manages one swing; a struck tuning fork, thousands. Drag the gold point.`, tx`運動が半分に下がるまでの振動の回数を、減衰比に対して、両対数の目盛りで描いています。Q 値は、同じものを数えた値です。エネルギーがほぼなくなるまでの振動の回数の、およそ 3 倍に当たります。ダンパーの上の自動車は 1 回、たたいた音叉は数千回、振動します。金色の点をドラッグしてください。`));
      const lg = Math.log10, b = L.fig(c2, { x: [-3, 0], y: [-1.5, 2.5], aspect: 0.7, maxH: 350, xlabel: T('damping ratio', '減衰比'), ylabel: T('swings to fall to half', '半分に下がるまでの振動の回数'), ticksX: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [0, '1']], ticksY: [[-1, '0.1'], [0, '1'], [1, '10'], [2, '100']] });
      b.line(L.sample(-3, -0.005, 120, (q) => clamp(lg(cyclesToHalve(10 ** q)), -1.5, 2.5)), { c: 'c2', w: 2.8 });
      b.handle(lg(z), z < 1 ? clamp(lg(cyclesToHalve(z)), -1.5, 2.5) : -1.5, { c: 'hl', axis: 'x', bounds: [-3, 0, -1.5, 2.5], label: T('damping ratio', '減衰比'), onDrag: (x) => { const q = 10 ** clamp(x, -3, 0); ctx.set('zeta', q < 0.01 ? Math.round(q * 1000) / 1000 : q < 0.1 ? Math.round(q * 200) / 200 : Math.round(q * 50) / 50); } });
      L.legend(ctx.host, [{ c: 'c1', label: T('displacement', '変位') }, { c: 'muted', dash: true, label: T('envelope', '包絡線') }, { c: 'c2', label: T('swings to fall to half', '半分に下がるまでの回数') }]);
      ctx.readout(z < 1 ? [
        { k: T('it swings at', '振動の周波数'), v: tx`\(${fmt(dampedFreq(fn, z), 2)}\ \mathrm{Hz}\)` },
        { k: T('each peak is this fraction of the last', '各ピークの、前のピークに対する割合'), v: tx`\(${fmt(Math.exp(-d), 3)}\)`, tone: 'key' },
        { k: T('swings to fall to half', '半分に下がるまでの回数'), v: tx`\(${fmt(cyclesToHalve(z), cyclesToHalve(z) < 10 ? 2 : 0)}\)` },
        { k: T('time to fall to half', '半分に下がるまでの時間'), v: tx`\(${fmt(cyclesToHalve(z) / dampedFreq(fn, z), 2)}\ \mathrm{s}\)` },
        { k: T('quality factor', 'Q 値'), v: tx`\(${fmt(quality(z), quality(z) < 10 ? 1 : 0)}\)` },
      ] : [{ k: T('damping', '減衰'), v: T('critical: no swing at all', '臨界：まったく振動しない'), tone: 'key' }, { k: T('back within 5 % after', '5 % 以内に戻るまで'), v: tx`\(${fmt(4.744 / (2 * PI * fn), 2)}\ \mathrm{s}\)` }],
      T(z >= 1 ? 'Critical damping: the quickest return with no overshoot. Door closers and the needles of meters aim for it.' : z > 0.2 ? 'Heavily damped, like a car body on its suspension: a bump is forgotten within a swing or two.' : 'Lightly damped: it rings. The same system, driven at this frequency, would build up a swing many times the slow deflection.', z >= 1 ? '臨界減衰です。行き過ぎずに最も速く戻ります。ドアクローザーや計器の針は、これを目指します。' : z > 0.2 ? 'サスペンションの上の車体のように、強く減衰しています。段差の影響は、1、2 回の振動で消えます。' : '減衰が小さく、鳴り続けます。同じ系をこの周波数で駆動すると、振れ幅は、ゆっくり押した変位の何倍にも育ちます。'));
    },
  };

  /* ================= 3. isolation ================= */
  D['vibration-isolation'] = {
    render(ctx, v) {
      const z = v.zeta, fn = mountFreq(v.sag), f = v.rpm / 60, r = f / fn, Tr = transmit(r, z), lg = Math.log10;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A machine shaking at \(${fmt(f, 1)}\) Hz stands on springs. The curve is the share of its shaking force that reaches the floor, against its speed compared with the bounce frequency of the machine on its mounts. Below 1.41 the mounts make matters worse. Above it they help, and help more the faster the machine runs. The grey curve is the same mount with no damping: better at speed, far worse on the way up through resonance. Drag the gold point.`, tx`\(${fmt(f, 1)}\) Hz で揺れる機械が、ばねの上に置かれています。曲線は、機械を揺らす力のうち床に届く割合を、機械の速さと、マウントの上で機械が弾む周波数との比に対して描いたものです。1.41 より下では、マウントは状況を悪くします。それより上では役に立ち、機械が速く回るほど、効果は大きくなります。灰色の曲線は、減衰のない同じマウントです。高速では優れていますが、共振を通過する途中では、はるかに悪くなります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 6], y: [-2, 1.2], aspect: 0.7, maxH: 350, xlabel: T('running speed over bounce frequency', '運転の速さと、弾む周波数の比'), ylabel: T('share of force reaching the floor', '床に届く力の割合'), ticksY: [[-2, '1 %'], [-1, '10 %'], [0, '100 %'], [1, '10×']] });
      a.hline(0, { c: 'muted', dash: '4 3' }); a.vline(Math.SQRT2, { c: 'muted', dash: '4 3' }); a.line(L.sample(0, 6, 400, (q) => clamp(lg(transmit(q, 0.002)), -2, 1.2)), { c: 'muted', w: 1.3 }); a.line(L.sample(0, 6, 400, (q) => clamp(lg(transmit(q, z)), -2, 1.2)), { c: 'c1', w: 2.8 });
      a.handle(clamp(r, 0, 6), clamp(lg(Tr), -2, 1.2), { c: 'hl', axis: 'x', bounds: [0.1, 6, -2, 1.2], label: T('running speed', '運転の速さ'), onDrag: (x) => ctx.set('rpm', clamp(Math.round((x * fn * 60) / 20) * 20, 60, 3600)) });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`The bounce frequency of anything resting on springs, against how far the springs sag under its weight. Mass and stiffness do not need to be known separately: the sag alone decides. Soft mounts, which sag a great deal, are what isolate; the dashed line marks the speed of this machine.`, tx`ばねの上に載っているものが弾む周波数を、その重さでばねが沈む量に対して描いています。質量と硬さを別々に知る必要はなく、沈む量だけで決まります。防振の効果があるのは、大きく沈む柔らかいマウントです。破線は、この機械の速さを示します。`));
      const top = Math.max(20, Math.ceil((f * 1.2) / 5) * 5), b = L.fig(c2, { x: [0, 50], y: [0, top], aspect: 0.7, maxH: 350, xlabel: T('sag under the load (mm)', '荷重による沈み（mm）'), ylabel: T('bounce frequency (Hz)', '弾む周波数（Hz）') });
      b.hline(f, { c: 'c2', dash: '5 4' }); b.line(L.sample(0.3, 50, 300, (q) => Math.min(top, mountFreq(q))), { c: 'c3', w: 2.8 }); b.dot(v.sag, Math.min(top, fn), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c1', label: T('with this damping', 'この減衰の場合') }, { c: 'muted', label: T('with none', '減衰がない場合') }, { c: 'c3', label: T('bounce frequency', '弾む周波数') }, { c: 'c2', dash: true, label: T('the machine', '機械') }]);
      ctx.readout([
        { k: T('bounce frequency on the mounts', 'マウントの上で弾む周波数'), v: tx`\(${fmt(fn, 2)}\ \mathrm{Hz}\)` },
        { k: T('machine speed over that', '機械の速さとの比'), v: tx`\(${fmt(r, 2)}\)` },
        { k: T('share of force reaching the floor', '床に届く力の割合'), v: tx`\(${fmt(Tr * 100, Tr < 0.1 ? 1 : 0)}\,\%\)`, tone: 'key' },
        { k: T('worst case, passing through resonance', '共振を通過するときの最悪の場合'), v: tx`\(${fmt(transmit(peakRatio(Math.min(z, 0.7)) || 1, z), 1)}\times\)`, tone: 'warn' },
        { k: T('sag needed to pass a tenth', '10 分の 1 にするのに必要な沈み'), v: tx`\(${fmt(sagFor(f / Math.sqrt(11)), 1)}\ \mathrm{mm}\)` },
      ], T(r < Math.SQRT2 ? 'The machine runs too close to the bounce frequency: the mounts pass on more force than a rigid bolt would. Use softer mounts or run faster.' : Tr < 0.2 ? 'Well isolated. Most of the shaking force is spent moving the machine itself against its own inertia, and little reaches the floor.' : 'Above the crossover but not far: the mounts help a little. Softer mounts would move the bounce frequency down and the machine further to the right.', r < Math.SQRT2 ? '機械が、弾む周波数に近すぎる速さで回っています。マウントは、ボルトで固定した場合よりも大きな力を伝えます。より柔らかいマウントを使うか、速く回します。' : Tr < 0.2 ? 'よく防振されています。揺らす力の大部分は、機械自身をその慣性に逆らって動かすのに使われ、床に届くのはわずかです。' : '交差点より上ですが、あまり離れていません。マウントは少し役に立っています。より柔らかいマウントにすると、弾む周波数が下がり、機械はさらに右へ移ります。'));
    },
  };
})();
