'use strict';
(() => {
  const L = window.Lab, D = (window.LabDefs = window.LabDefs || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const PI = Math.PI;

  /* ---------- model (pure, checked by checks/acoustics.cjs) ---------- */
  // String of length 1 between rigid ends, wave speed 1, so the fundamental period is 2.
  const mod2 = (s) => ((s % 2) + 2) % 2;
  // odd 2-periodic extension of a profile given on [0, 1]
  const oddExt = (g) => (s) => { const u = mod2(s); return u <= 1 ? g(u) : -g(2 - u); };
  const triangle = (b) => (x) => (x <= b ? x / b : (1 - x) / (1 - b));
  // plucked at x = b with unit height, released from rest: d'Alembert
  const pluckY = (b) => { const F = oddExt(triangle(b)); return (x, t) => 0.5 * (F(x - t) + F(x + t)); };
  const pluckCoef = (b, n) => (2 * Math.sin(n * PI * b)) / (n * n * PI * PI * b * (1 - b));
  // struck by a hammer of width w centred on b: unit initial velocity there, y = (Φ(x+t) − Φ(x−t))/2 with Φ' the odd extension
  const HW = 0.04;
  const strikeY = (b, w = HW) => { const lo = b - w / 2; const Phi = (s) => { const u = mod2(s), a = u <= 1 ? u : 2 - u; return clamp(a - lo, 0, w); }; return (x, t) => 0.5 * (Phi(x + t) - Phi(x - t)); };
  // modal velocity amplitudes for the box velocity: y = Σ cₙ sin(nπx) sin(nπt)
  const strikeCoef = (b, n, w = HW) => (4 / (n * n * PI * PI)) * Math.sin(n * PI * b) * Math.sin((n * PI * w) / 2);
  // ideal Helmholtz motion: a corner circulating on the parabolas ±K x(1 − x); all modes ∝ 1/n², whatever the bowing point
  const helmholtzY = (K) => (x, t) => { const xi = mod2(t); if (xi <= 1) { const c = xi, h = K * c * (1 - c); return c <= 0 || c >= 1 ? 0 : x <= c ? (h * x) / c : (h * (1 - x)) / (1 - c); } const c = 2 - xi, h = -K * c * (1 - c); return c <= 0 || c >= 1 ? 0 : x <= c ? (h * x) / c : (h * (1 - x)) / (1 - c); };
  const helmholtzCoef = (K, n) => (2 * K) / (n * n * PI * PI);
  // velocity at the bowing point during stick and slip (bow speed sets K: v_bow = K b in these units)
  const helmholtzVel = (K, b) => ({ stick: -K * b, slip: K * (1 - b), stickFraction: 1 - b });
  // energy in mode n is proportional to n² × amplitude² (mass per length and tension 1)
  const modeEnergy = (amp, n) => n * n * amp * amp;

  // Chladni: the classic two-term approximation for a square plate with free edges, x, y in [0, 1]
  const chladniW = (m, n, sg) => (x, y) => { const a = Math.cos(m * PI * x) * Math.cos(n * PI * y), b = Math.cos(n * PI * x) * Math.cos(m * PI * y); return m === n ? a : a + sg * b; };
  const chladniRel = (m, n) => m * m + n * n; // bending waves: f ∝ k², with k² = π²(m² + n²) here
  function sand(m, n, sg, N, iters, seed = 7) {
    let s = seed >>> 0; const r = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const w = chladniW(m, n, sg), xs = new Float32Array(N), ys = new Float32Array(N), snaps = [];
    for (let i = 0; i < N; i++) { xs[i] = r(); ys[i] = r(); }
    const amp = m === n ? 1 : 2;
    for (let k = 0; k <= iters; k++) {
      if (k % 4 === 0) snaps.push([xs.slice(), ys.slice()]);
      for (let i = 0; i < N; i++) {
        const a = Math.abs(w(xs[i], ys[i])) / amp, st = 0.13 * a, g1 = r() - 0.5, g2 = r() - 0.5;
        let x = xs[i] + st * 2 * g1, y = ys[i] + st * 2 * g2;
        if (x < 0) x = -x; if (x > 1) x = 2 - x; if (y < 0) y = -y; if (y > 1) y = 2 - y;
        xs[i] = x; ys[i] = y;
      }
    }
    return snaps;
  }

  // Doppler: source on the x axis at speed M (sound speed 1), position M t; observer at (X, Y)
  const arrival = (te, M, X, Y) => te + Math.hypot(X - M * te, Y);
  const heardRatio = (te, M, X, Y) => { const r = Math.hypot(X - M * te, Y); return 1 / (1 - (M * (X - M * te)) / r); };
  const machAngle = (M) => (M > 1 ? Math.asin(1 / M) : null);
  // emission time of the sound that arrives with the boom: cos θ = 1/M there
  const boomEmission = (M, X, Y) => (M > 1 ? (X - Math.abs(Y) / Math.sqrt(M * M - 1)) / M : null);
  const boomTime = (M, X, Y) => (M > 1 ? (X + Math.abs(Y) * Math.sqrt(M * M - 1)) / M : null);
  // emission times whose sound arrives at time t (one for M < 1; none or two for M > 1)
  function emissionsAt(t, M, X, Y) {
    const f = (te) => arrival(te, M, X, Y) - t, out = [];
    const lo = t - 80, hi = t; let a = lo, fa = f(a); const K = 1600;
    for (let k = 1; k <= K; k++) { const b = lo + ((hi - lo) * k) / K, fb = f(b); if (fa === 0) out.push(a); else if (fa * fb < 0) { let x0 = a, x1 = b; for (let j = 0; j < 60; j++) { const xm = (x0 + x1) / 2; if (f(x0) * f(xm) <= 0) x1 = xm; else x0 = xm; } out.push((x0 + x1) / 2); } a = b; fa = fb; }
    return out;
  }

  (window.LabModels = window.LabModels || {})['acoustics'] = { oddExt, triangle, pluckY, pluckCoef, strikeY, strikeCoef, helmholtzY, helmholtzCoef, helmholtzVel, modeEnergy, chladniW, chladniRel, sand, arrival, heardRatio, machAngle, boomEmission, boomTime, emissionsAt, HW };

  if (!L.fig) return; // model-only load (checks)
  const T = L.T, fmt = L.fmt;

  /* ---------- 1. harmonics of a string ---------- */
  const KB = 3.2, NH = 16;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a), qden = (b) => { const k = Math.round(b * 100); return 100 / gcd(100, k); };
  D['string-harmonics'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const mode = v.mode, b = v.beta;
      const Y = mode === 0 ? pluckY(b) : mode === 1 ? strikeY(b) : helmholtzY(KB);
      const sc = mode === 1 ? 1.6 / HW : 1;
      const amps = L.seq(NH, (i) => { const n = i + 1; return Math.abs(mode === 0 ? pluckCoef(b, n) : mode === 1 ? strikeCoef(b, n) : helmholtzCoef(KB, n)); });
      const amax = Math.max(...amps), missing = L.seq(NH, (i) => i + 1).filter((n) => mode !== 2 && Math.abs(Math.sin(n * PI * b)) < 1e-6);
      let eTot = 0, e1 = 0; for (let n = 1; n <= 400; n++) { const a = mode === 0 ? pluckCoef(b, n) : mode === 1 ? strikeCoef(b, n) : helmholtzCoef(KB, n), e = modeEnergy(a, n); eTot += e; if (n === 1) e1 = e; }
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, [
        T('The string just after it is let go, in slow motion. Two kinks run apart from the pluck point and reflect, inverted, at the ends. Drag the gold marker to move the pluck point.', '離した直後の弦をスローモーションで示します。二つの折れ目が弾いた点から左右へ走り、両端で反転して反射します。金色の印をドラッグして弾く位置を動かしてください。'),
        T('The string after a narrow hammer blow, in slow motion: two pulses run out from the struck point. Drag the gold marker to move the hammer.', '細いハンマーで打った後の弦をスローモーションで示します。打った点から二つのパルスが走り出します。金色の印をドラッグしてハンマーを動かしてください。'),
        T('Helmholtz motion under the bow, in slow motion: a single corner circulates around the dashed parabolas, once per period. Drag the gold marker to move the bow.', '弓の下でのヘルムホルツ運動をスローモーションで示します。一つの角が破線の放物線をめぐり、一周期に一回まわります。金色の印をドラッグして弓を動かしてください。'),
      ][mode]);
      const f = L.fig(c1, { x: [-0.04, 1.04], y: [-1.15, 1.15], aspect: 0.62, axes: false, grid: false, maxH: 330 });
      f.seg([0, 0], [1, 0], { c: 'muted', w: 1, dash: '3 4', layer: 'under' });
      f.rect(-0.035, -0.35, 0.035, 0.7, { c: 'ink', fill: 'ink', fo: 0.8, w: 1, layer: 'under' }); f.rect(1, -0.35, 0.035, 0.7, { c: 'ink', fill: 'ink', fo: 0.8, w: 1, layer: 'under' });
      f.text(0.02, -0.55, T('nut', 'ナット'), { small: true, c: 'muted', anchor: 'start' }); f.text(0.98, -0.55, T('bridge', '駒'), { small: true, c: 'muted', anchor: 'end' });
      if (mode === 2) { [1, -1].forEach((sg) => f.line(L.sample(0, 1, 80, (x) => [x, sg * KB * x * (1 - x)]), { c: 'c4', w: 1.2, dash: '5 4', layer: 'under' })); }
      f.vline(b, { c: 'hl', w: 1, dash: '2 4', layer: 'under' });
      const G = f.group('main');
      f.handle(b, -1.02, { c: 'hl', r: 7, axis: 'x', snap: 0.01, label: T('Pluck, strike or bow point', '弾く、打つ、弓の位置'), bounds: [0.04, 0.5, -1.02, -1.02], onDrag: (x) => ctx.set('beta', Math.round(clamp(x, 0.04, 0.5) * 100) / 100) });
      f.text(b, -1.02, T(['pluck', 'hammer', 'bow'][mode], ['弾く', 'ハンマー', '弓'][mode]), { small: true, c: 'hl', anchor: 'start', dx: 12, dy: 4 });
      const xs = L.seq(241, (i) => i / 240);
      const drawString = (t) => { while (G.firstChild) G.removeChild(G.firstChild); const pts = xs.map((x) => [x, sc * Y(x, t)]); G.appendChild(f.line(pts, { c: 'c1', w: 3 })); if (mode === 2) { const xi = mod2(t), c = xi <= 1 ? xi : 2 - xi; G.appendChild(f.dot(c, sc * Y(c, t), { c: 'c2', r: 4.5 })); } };
      // spectrum
      L.h('p', 'lab-cap', c2, mode === 2
        ? T('Amplitude of each harmonic in dB. Ideal Helmholtz motion contains every harmonic, falling as 1/n², wherever the bow is.', '各倍音の振幅（dB）です。理想的なヘルムホルツ運動は弓の位置によらずすべての倍音を含み、1/n² で減ります。')
        : T(`Amplitude of each harmonic in dB. Harmonics with a node at the ${mode === 0 ? 'pluck' : 'strike'} point cannot be excited and are missing (crosses).`, `各倍音の振幅（dB）です。${mode === 0 ? '弾いた' : '打った'}点に節がある倍音は励起できず、欠けています（×印）。`));
      const s = L.fig(c2, { x: [0.3, NH + 0.7], y: [-50, 3], aspect: 0.5, xlabel: T('harmonic n', '倍音 n'), ylabel: 'dB', maxH: 230, ticksX: L.seq(8, (i) => [2 * i + 2, String(2 * i + 2)]).concat([[1, '1']]), ticksY: [[0, '0'], [-20, '−20'], [-40, '−40']] });
      amps.forEach((a, i) => { const n = i + 1, db = a > amax * 1e-6 ? 20 * Math.log10(a / amax) : -60; if (db > -50) s.rect(n - 0.32, -50, 0.64, db + 50, { c: mode === 2 ? 'c4' : 'c1', fill: mode === 2 ? 'c4' : 'c1', fo: 0.75, w: 0.8 }); });
      missing.forEach((n) => s.text(n, -46, '×', { c: 'c2', dy: 4 }));
      s.line(L.sample(1, NH, 60, (n) => [n, mode === 1 ? -20 * Math.log10(n) : -40 * Math.log10(n)]), { c: 'muted', w: 1.2, dash: '4 3', layer: 'over' });
      s.text(NH - 0.2, mode === 1 ? -20 * Math.log10(NH) : -40 * Math.log10(NH), mode === 1 ? '1/n' : '1/n²', { small: true, c: 'muted', anchor: 'end', dy: -8 });
      // time trace
      const TT = L.seq(401, (i) => (4 * i) / 400), dd = 1e-3;
      const trace = mode === 2 ? TT.map((t) => [t, (Y(b, t + dd) - Y(b, t - dd)) / (2 * dd)]) : TT.map((t) => [t, (sc * (Y(dd, t) - Y(0, t))) / dd]);
      const tmx = Math.max(...trace.map((p) => Math.abs(p[1]))) * 1.15 || 1;
      L.h('p', 'lab-cap', c2, mode === 2
        ? T('Velocity of the string under the bow over two periods: it sticks to the bow for a fraction 1 − β of each period, then slips back fast.', '二周期分の、弓の下の弦の速度です。各周期の 1 − β の割合だけ弓に張り付いて動き、その後すばやく滑り戻ります。')
        : T('Force on the bridge (the string’s slope at the end) over two periods: this is what the body of an instrument hears.', '二周期分の、駒にかかる力（端での弦の傾き）です。楽器の胴が聞いているのはこれです。'));
      const tr = L.fig(c2, { x: [0, 4], y: [-tmx, tmx], aspect: 0.32, xlabel: T('time (periods)', '時間（周期）'), maxH: 150, ticksX: [[0, '0'], [1, '½'], [2, '1'], [3, '1½'], [4, '2']], ticksY: [[0, '0']] });
      tr.hline(0, { c: 'muted', w: 1, layer: 'under' });
      tr.line(trace, { c: mode === 2 ? 'c4' : 'c3', w: 2 });
      const cur = tr.group('over');
      L.legend(ctx.host, [{ c: 'c1', label: T('string', '弦') }, { c: 'hl', kind: 'dot', label: T('excitation point β', '励起点 β') }, { c: mode === 2 ? 'c4' : 'c1', kind: 'fill', label: T('harmonic amplitudes', '倍音の振幅') }].concat(missing.length ? [{ c: 'c2', kind: 'dot', label: T('missing harmonics', '欠けた倍音') }] : []));
      const hv = helmholtzVel(KB, b);
      ctx.readout([
        { k: T('excitation', '励起'), v: T(['plucked', 'struck', 'bowed'][mode], ['弾く', '打つ', '弓で弾く'][mode]), tone: 'key' },
        { k: 'β', v: fmt(b, 2) },
        { k: T('missing harmonics', '欠けた倍音'), v: missing.length ? missing.join(', ') : T('none', 'なし'), tone: missing.length ? 'warn' : undefined },
        { k: T('energy in the fundamental', '基音のエネルギー'), v: `${fmt((100 * e1) / eTot, 3)}%`, tone: 'good' },
      ].concat(mode === 2 ? [{ k: T('stick fraction 1 − β', '張り付く割合 1 − β'), v: fmt(hv.stickFraction, 2) }, { k: T('slip speed / bow speed', '滑る速さ／弓の速さ'), v: fmt(hv.slip / -hv.stick, 3) }] : []), [
        T(`Plucking at β = ${fmt(b, 2)} gives amplitudes ∝ sin(nπβ)/n², so every harmonic that is a multiple of ${qden(b)} is silent${qden(b) > NH ? ' (none in this range)' : ''}. Plucking near the bridge leaves more energy in the high harmonics and sounds brighter.`, `β = ${fmt(b, 2)} で弾くと振幅は sin(nπβ)/n² に比例し、${qden(b)} の倍数番目の倍音はすべて鳴りません${qden(b) > NH ? '（この範囲にはありません）' : ''}。駒の近くで弾くほど高い倍音にエネルギーが残り、明るい音になります。`),
        T('A narrow hammer gives every mode the same velocity, times sin(nπβ), so displacement falls only as 1/n until the hammer’s width cuts the series off. Piano hammers strike between about one seventh and one ninth of the way along the string, which puts a near-node of the 7th to 9th harmonics at the hammer and weakens them.', '細いハンマーはすべてのモードに sin(nπβ) を掛けた同じ速度を与えるので、変位はハンマーの幅が級数を打ち切るまで 1/n でしか減りません。ピアノのハンマーは弦の約七分の一から九分の一の所を打ち、第 7 から第 9 倍音の節に近い点を打つことでそれらを弱めます。'),
        T(`The bow only sets the corner’s height, not the spectrum: the string slips past the bow for a fraction β = ${fmt(b, 2)} of each period at ${fmt(hv.slip / -hv.stick, 3)} times the bow speed. Bowing closer to the bridge needs more bow force to keep the stick phase, and the real corner is rounded, which brightens the tone.`, `弓が決めるのは角の高さだけで、スペクトルは変わりません。弦は各周期の β = ${fmt(b, 2)} の割合だけ弓の ${fmt(hv.slip / -hv.stick, 3)} 倍の速さで滑ります。駒に近く弾くほど張り付きを保つのにより大きな弓圧が要り、実際の角は丸まっていて、それが音を明るくします。`),
      ][mode]);
      const draw = (t) => { drawString(t); while (cur.firstChild) cur.removeChild(cur.firstChild); const tt = t % 4; cur.appendChild(tr.vline(tt, { c: 'hl', w: 1.2, dash: '3 3', layer: 'over' })); };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const tt = 0.35 * t; draw(tt); lb.textContent = T(`t = ${fmt(tt / 2, 2)} periods`, `t = ${fmt(tt / 2, 2)} 周期`); }, { autoplay: !L.reduced(), initialT: mode === 0 ? 0 : 0.5 / 0.35 });
    },
  };

  /* ---------- 2. Chladni figures ---------- */
  const NS = 2600, ITER = 320, PA = 0.2;
  function chladniFrame(ctx) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    st.row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', st.row); st.c2 = L.h('div', 'lab-col', st.row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, '');
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, '');
    st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  D['chladni'] = {
    three: true,
    render(ctx, v) {
      const st = chladniFrame(ctx);
      const m = v.m, n = v.n, sg = v.sign === 0 ? 1 : -1;
      const zero = m === 0 && n === 0;
      const key = `${m}|${n}|${sg}`;
      if (st.key !== key && !zero) { st.snaps = sand(m, n, sg, NS, ITER); st.key = key; }
      st.mode = { m, n, sg, zero, w: chladniW(m, n, sg), amp: m === n ? 1 : 2 };
      const label = `(${m}, ${n}${m === n ? '' : sg > 0 ? ', +' : ', −'})`, labelJ = `(${m}, ${n}${m === n ? '' : sg > 0 ? '、+' : '、−'})`;
      const capFlat = T(`Sand on a square plate vibrating in mode ${label}. Colour is the displacement at one instant, warm up and cool down. Sand is thrown about where the plate moves and comes to rest on the nodal lines, where it does not.`, `モード ${labelJ} で振動する正方形の板の上の砂です。色はある瞬間の変位で、暖色が上、寒色が下です。砂は板が動く所で跳ね飛ばされ、動かない節線の上で止まります。`);
      st.cap1.textContent = zero
        ? T('Mode (0, 0) is the plate moving up and down as a rigid body: there is no bending and no nodal line. Choose another mode.', 'モード (0, 0) は板が剛体として上下に動くだけで、曲げも節線もありません。別のモードを選んでください。')
        : st.flat
          ? T(`Sand on a square plate vibrating in mode ${label}. Colour is the displacement at one instant, warm up and cool down. Sand is thrown about where the plate moves and comes to rest on the nodal lines, where it does not.`, `モード ${labelJ} で振動する正方形の板の上の砂です。色はある瞬間の変位で、暖色が上、寒色が下です。砂は板が動く所で跳ね飛ばされ、動かない節線の上で止まります。`)
          : T(`The plate vibrating in mode ${label}, with its motion greatly exaggerated and coloured by displacement. Sand is thrown off the parts that move and settles on the nodal lines, which stay still. Press Play to sprinkle it again; drag to turn the plate.`, `モード ${labelJ} で振動する板です。動きを大きく誇張し、変位で色分けしています。砂は動く部分から跳ね飛ばされ、静止したままの節線の上に集まります。再生で砂をまき直せます。ドラッグで板を回せます。`);
      // gallery of modes: drag the gold square to choose (m, n)
      st.cap2.textContent = T(`Nodal lines of every mode up to (4, 4) with the ${sg > 0 ? '+' : '−'} combination. Drag the gold point to choose a mode.`, `${sg > 0 ? '+' : '−'} の組み合わせで (4, 4) までのすべてのモードの節線です。金色の点をドラッグしてモードを選んでください。`);
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 5], y: [0, 5], equal: true, axes: true, grid: false, maxH: 420, xlabel: 'm', ylabel: 'n', ticksX: L.seq(5, (i) => [i + 0.5, String(i)]), ticksY: L.seq(5, (i) => [i + 0.5, String(i)]) });
      const col = L.colours(), ink = col.ink, pl = col.plate, hl = col.c1;
      g.raster((x, y) => { const i = Math.floor(x), j = Math.floor(y), u = (x - i - 0.06) / 0.88, vv = (y - j - 0.06) / 0.88; if (u < 0 || u > 1 || vv < 0 || vv > 1 || (i === 0 && j === 0)) return pl; const ww = chladniW(i, j, sg)(u, vv) / (i === j ? 1 : 2); const e = Math.abs(ww); return e < 0.05 ? ink : ww > 0 ? hl.map((c, q) => 0.25 * c + 0.75 * pl[q]) : pl; }, { res: 2 });
      g.rect(m + 0.02, n + 0.02, 0.96, 0.96, { c: 'hl', w: 2.6, layer: 'over' });
      g.handle(m + 0.5, n + 0.5, { c: 'hl', r: 6, snap: 1, label: T('Mode (m, n)', 'モード (m, n)'), bounds: [0.5, 4.5, 0.5, 4.5], onDrag: (x, y) => { const mi = Math.round(x - 0.5), ni = Math.round(y - 0.5); ctx.set('m', mi, true); ctx.set('n', ni); } });
      st.leg.replaceChildren();
      L.legend(st.leg, [{ c: 'pos', kind: 'fill', label: T('moving up', '上へ動く') }, { c: 'neg', kind: 'fill', label: T('moving down', '下へ動く') }, { c: 'ink', kind: 'dot', label: T('sand, collecting on nodal lines', '節線に集まる砂') }]);
      const rel = chladniRel(m, n) / chladniRel(1, 1);
      ctx.readout([
        { k: T('mode', 'モード'), v: `(${m}, ${n})${m === n ? '' : sg > 0 ? ' +' : ' −'}`, tone: 'key' },
        { k: T('frequency / f(1,1), this approximation', '周波数 / f(1,1)（この近似）'), v: zero ? '0' : fmt(rel, 3) },
        { k: T('partner with the same frequency', '同じ周波数の相手'), v: m === n || zero ? T('none', 'なし') : `(${m}, ${n}) ${sg > 0 ? '−' : '+'}` },
      ], zero ? '' : m === n
        ? T('With m = n the two terms coincide: the + combination is a plain grid of nodal lines, and the − combination would vanish identically, so the same grid is shown for both.', 'm = n では二つの項が一致します。+ の組み合わせは節線の単純な格子になり、− の組み合わせは恒等的に消えてしまうので、どちらにも同じ格子を示します。')
        : T(`The + and − combinations of (${m}, ${n}) share one frequency in this approximation and draw different figures, one symmetric and one antisymmetric under swapping x and y. On a real plate the free edges split the pair a little, which is why Chladni heard them as separate notes.`, `(${m}, ${n}) の + と − の組み合わせは、この近似では周波数が同じで、x と y の入れ替えについて対称なものと反対称なものという別の図形を描きます。実際の板では自由端がこの組をわずかに分けるので、クラドニは別々の音として聞きました。`));
      // the flat picture, for browsers without 3D
      const flat2d = () => {
        if (!st.f || !st.f.svg.isConnected || st.fKey !== key) {
          st.fKey = key; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [0, 1], y: [0, 1], equal: true, axes: false, grid: false, maxH: 420 });
          if (!zero) f.raster((x, y) => 0.55 * st.mode.w(x, y) / st.mode.amp, { cmap: 'div', res: 3 });
          f.rect(0, 0, 1, 1, { c: 'ink', w: 2.4, layer: 'under' });
          const G = f.group('over');
          st.P = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          st.P.setAttribute('style', 'fill:none;stroke:var(--lab-ink);stroke-width:2.3;stroke-linecap:round;opacity:0.9'); G.appendChild(st.P);
          st.f = f;
        }
        return st.f;
      };
      st.drawFrame = (k, phase, done) => {
        const md = st.mode;
        if (st.flat) {
          const f = flat2d();
          if (md.zero) { st.P.setAttribute('d', ''); return; }
          const [xs, ys] = st.snaps[clamp(k, 0, st.snaps.length - 1)]; let d = ''; for (let i = 0; i < xs.length; i++) d += `M${f.X(xs[i]).toFixed(1)} ${f.Y(ys[i]).toFixed(1)}h0`; st.P.setAttribute('d', d);
          return;
        }
        st.draw3d?.(k, done ? 0.85 : Math.cos(phase));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.86, maxH: 470, camera: [2.35, -3.3, 2.6], target: [0, 0, -0.1], fov: 31,
        init(S) {
          st.flat = false;
          st.plate = S.surface((u, w) => [u, w, 0], { u: [-1, 1], v: [-1, 1], nu: 96, nv: 96, colour: () => S.colour('plate'), rough: 0.72, coat: 0.15 });
          st.plate.userData.noOcclude = true;
          st.edge = S.lines([], { c: 'ink', opacity: 0.9 });
          st.grains = S.points(L.seq(NS, () => [0, 0, 0]), { c: 'ink', r: 0.011, max: NS, rough: 0.9, coat: 0 });
          st.post = S.tube([[0, 0, -0.5], [0, 0, -0.02]], { c: 'muted', r: 0.02 });
          st.draw3d = (k, c) => {
            const md = st.mode, A = md.zero ? 0.12 : PA, wn = (x, y) => (md.zero ? 1 : md.w(x, y) / md.amp);
            const Z = (X, Y) => A * c * wn((X + 1) / 2, (Y + 1) / 2);
            st.plate.update((X, Y) => [X, Y, Z(X, Y)], (X, Y) => S.cmap.div(md.zero ? 0.5 * c : Math.max(-1, Math.min(1, 1.25 * c * wn((X + 1) / 2, (Y + 1) / 2)))));
            const e = []; const N = 48;
            for (let i = 0; i < N; i++) { const a = -1 + 2 * i / N, b = -1 + 2 * (i + 1) / N; e.push([[a, -1, Z(a, -1)], [b, -1, Z(b, -1)]], [[a, 1, Z(a, 1)], [b, 1, Z(b, 1)]], [[-1, a, Z(-1, a)], [-1, b, Z(-1, b)]], [[1, a, Z(1, a)], [1, b, Z(1, b)]]); }
            st.edge.update(e);
            st.post.update([[0, 0, -0.55], [0, 0, Z(0, 0) - 0.01]]);
            if (md.zero) { st.grains.visible = false; S.invalidate(); return; }
            st.grains.visible = true;
            const [xs, ys] = st.snaps[clamp(k, 0, st.snaps.length - 1)], pts = new Array(xs.length);
            for (let i = 0; i < xs.length; i++) { const X = 2 * xs[i] - 1, Y = 2 * ys[i] - 1; pts[i] = [X, Y, Z(X, Y) + 0.012]; }
            st.grains.update(pts);
          };
        },
        update() { st.anim?.redraw(); },
        fallback() { st.flat = true; st.row.classList.remove('is-wide'); if (!zero) st.cap1.textContent = capFlat; st.f = null; st.anim?.redraw(); },
      });
      const S0 = zero ? 0 : st.snaps.length - 1;
      st.anim?.stop();
      st.anim = L.animator(st.bar.firstChild ? (st.bar.replaceChildren(), st.bar) : st.bar, (dt, t, lb) => {
        const k = Math.min(S0, Math.floor(t * 18)), done = zero ? t >= 6 : k >= S0;
        st.drawFrame(k, t * 2 * PI * 2.2, done);
        lb.textContent = zero ? '' : T(`${k * 4} bounces`, `${k * 4} 回跳ねた後`);
        return zero ? t < 6 : k < S0;
      }, { autoplay: false, once: true, initialT: 1e4, playLabel: T('Play: sprinkle sand and bow the plate', '再生：砂をまいて板を弓で鳴らす') });
    },
  };
  /* ---------- 3. Doppler effect and the Mach cone ---------- */
  D['doppler-mach'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const M = v.M, X = v.ox, Yo = v.oy, sp = Math.max(M, 0.6), t0 = -6.5 / sp, t1 = 6.5 / sp, span = t1 - t0, DT = 0.55, speed = 1.1;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, M > 1
        ? T(`A source moving at Mach ${fmt(M, 2)}: it outruns its own wavefronts, which pile up on a cone of half-angle ${fmt((machAngle(M) * 180) / PI, 3)}°. Drag the listener.`, `マッハ ${fmt(M, 2)} で動く音源です。音源は自分の波面を追い越し、波面は半頂角 ${fmt((machAngle(M) * 180) / PI, 3)}° の円錐に積み重なります。聴き手をドラッグしてください。`)
        : T(`A source moving at Mach ${fmt(M, 2)}, emitting a crest every ${fmt(DT, 2)} time units: the crests bunch up ahead and spread out behind. Drag the listener.`, `マッハ ${fmt(M, 2)} で動き、${fmt(DT, 2)} 時間単位ごとに山を出す音源です。山は前方で詰まり、後方で広がります。聴き手をドラッグしてください。`));
      const f = L.fig(c1, { x: [-6.5, 6.5], y: [-3.6, 3.6], equal: true, axes: false, grid: false, maxH: 380 });
      f.seg([-6.5, 0], [6.5, 0], { c: 'muted', w: 1, dash: '3 5', layer: 'under' });
      const W = f.group('main');
      f.handle(X, Yo, { c: 'c3', r: 8, label: T('Listener', '聴き手'), bounds: [-6, 6, 0.4, 3.3], onDrag: (x, y) => { ctx.set('ox', Math.round(x * 10) / 10, true); ctx.set('oy', Math.round(y * 10) / 10); } });
      f.text(X, Yo, T('listener', '聴き手'), { small: true, c: 'c3', anchor: 'start', dx: 12, dy: -8 });
      // heard frequency against arrival time
      L.h('p', 'lab-cap', c2, T('What the listener hears: frequency ratio f′/f against time, on a log scale. The gold line is now.', '聴き手に聞こえるもの：時間に対する周波数比 f′/f を対数目盛で示します。金色の線が現在です。'));
      const Lg = (r) => Math.log10(clamp(Math.abs(r), 0.2, 8));
      const g = L.fig(c2, { x: [t0, t1], y: [Lg(0.2), Lg(8)], aspect: 0.62, xlabel: T('time', '時間'), ylabel: 'f′ / f', maxH: 300, ticksY: [[Lg(0.25), '¼'], [Lg(0.5), '½'], [0, '1'], [Lg(2), '2'], [Lg(4), '4'], [Lg(8), '8']] });
      g.hline(0, { c: 'muted', w: 1, layer: 'under' });
      // the curve, parametrised by emission time; for M > 1 it has two branches meeting at the boom
      const tes = L.seq(1601, (i) => t0 - 30 + ((t1 - t0 + 30) * i) / 1600), pts = tes.map((te) => [arrival(te, M, X, Yo), Lg(heardRatio(te, M, X, Yo))]);
      if (M > 1) { const tb = boomTime(M, X, Yo), teb = boomEmission(M, X, Yo); let k = 0; while (k < pts.length && tes[k] < teb) k++; const A = pts.slice(0, k).filter((p) => p[0] <= t1), B = pts.slice(k).filter((p) => p[0] <= t1); g.line(A, { c: 'c2', w: 2.4 }); g.line(B, { c: 'c1', w: 2.4 }); if (tb >= t0 && tb <= t1) { g.vline(tb, { c: 'c2', w: 1.4, dash: '4 3', layer: 'under' }); g.text(tb, Lg(6.5), T('boom', 'ブーム'), { small: true, c: 'c2', anchor: 'start', dx: 5 }); } }
      else g.line(pts.filter((p) => p[0] >= t0 - 1 && p[0] <= t1), { c: 'c1', w: 2.4 });
      if (M < 1) { g.hline(Lg(1 / (1 - M)), { c: 'c4', w: 1, dash: '4 4', layer: 'under' }); g.hline(Lg(1 / (1 + M)), { c: 'c4', w: 1, dash: '4 4', layer: 'under' }); g.text(t1, Lg(1 / (1 - M)), `1/(1 − M)`, { small: true, c: 'c4', anchor: 'end', dy: -6 }); g.text(t1, Lg(1 / (1 + M)), `1/(1 + M)`, { small: true, c: 'c4', anchor: 'end', dy: 14 }); }
      const now = g.group('over');
      L.legend(ctx.host, [{ c: 'hl', kind: 'dot', label: T('source', '音源') }, { c: 'c1', label: T('wavefronts; heard frequency', '波面、聞こえる周波数') }].concat(M > 1 ? [{ c: 'c2', label: T('Mach cone; sound heard in reverse', 'マッハ円錐、逆順に聞こえる音') }] : []).concat([{ c: 'c3', kind: 'dot', label: T('listener', '聴き手') }]));
      const draw = (tt) => {
        while (W.firstChild) W.removeChild(W.firstChild); while (now.firstChild) now.removeChild(now.firstChild);
        const add = (e) => (W.appendChild(e), e), xs = M * tt;
        const kmax = Math.ceil(60 / DT);
        for (let k = 0; k <= kmax; k++) { const te = Math.floor(tt / DT) * DT - k * DT, r = tt - te; if (r <= 0) continue; const cxp = M * te, near = Math.max(0, Math.abs(cxp) - 6.5), far = Math.hypot(Math.abs(cxp) + 6.5, 3.6); if (r < near || r > far) continue; add(f.circle(cxp, 0, r, { c: 'c1', w: 1.4, op: Math.max(0.18, 1 - r / 12) })); }
        if (M > 1) { const mu = machAngle(M), Lc = 16; [1, -1].forEach((s) => add(f.seg([xs, 0], [xs - Lc * Math.cos(mu), s * Lc * Math.sin(mu)], { c: 'c2', w: 2.2 }))); }
        if (Math.abs(xs) < 6.6) add(f.dot(xs, 0, { c: 'hl', r: 7 }));
        const es = emissionsAt(tt, M, X, Yo);
        es.forEach((te) => { add(f.seg([M * te, 0], [X, Yo], { c: 'c3', w: 1, dash: '2 3', op: 0.8 })); add(f.dot(M * te, 0, { c: 'c3', r: 3, hollow: true })); });
        if (tt >= t0 && tt <= t1) now.appendChild(g.vline(tt, { c: 'hl', w: 1.6, dash: false, layer: 'over' }));
        es.forEach((te) => { const r = heardRatio(te, M, X, Yo); if (tt >= t0 && tt <= t1) now.appendChild(g.dot(tt, Lg(r), { c: 'hl', r: 5 })); });
        const rs = es.map((te) => heardRatio(te, M, X, Yo));
        ctx.readout([
          { k: 'M', v: fmt(M, 2), tone: 'key' },
          { k: T('approaching, f′/f', '近づくとき f′/f'), v: M < 1 ? fmt(1 / (1 - M), 3) : M === 1 ? '∞' : T('shock', '衝撃波') },
          { k: T('receding, f′/f', '遠ざかるとき f′/f'), v: fmt(1 / (1 + M), 3) },
          { k: T('Mach angle μ', 'マッハ角 μ'), v: M > 1 ? `${fmt((machAngle(M) * 180) / PI, 3)}°` : '–' },
          { k: T('heard now', '今聞こえる'), v: rs.length ? rs.map((r) => (r < 0 ? T(`${fmt(-r, 3)} (reversed)`, `${fmt(-r, 3)}（逆順）`) : fmt(r, 3))).join(', ') : T('silence', '無音'), tone: 'good' },
        ], M > 1
          ? T(`Before the cone reaches the listener nothing at all is heard. At the boom, time ${fmt(boomTime(M, X, Yo), 3)}, the sound from a whole stretch of the path arrives at once; after it the listener hears two sounds, the recent one at 1/(1 + M cos θ) and an older one played backwards.`, `円錐が聴き手に届く前には何も聞こえません。時刻 ${fmt(boomTime(M, X, Yo), 3)} のブームでは、経路のある区間全体からの音が一度に届きます。その後、聴き手は二つの音を聞きます。最近の音は 1/(1 + M cos θ) の高さで、古い音は逆再生で聞こえます。`)
          : M === 1 ? T('At exactly M = 1 the source keeps pace with its own crests, which all pile into one wall travelling with it: the listener hears nothing until that wall arrives, and then a pitch that starts out infinitely high and falls towards 1/(1 + M) = ½.', 'ちょうど M = 1 では、音源は自分の山と同じ速さで進み、山はすべて音源とともに進む一枚の壁に積み重なります。聴き手はその壁が届くまで何も聞かず、届いた後は無限に高い音から 1/(1 + M) = ½ へ下がっていく音を聞きます。')
          : T('The pitch falls smoothly as the source goes by, from 1/(1 − M cos θ) towards 1/(1 + M) of its own frequency, where θ is measured at the moment the sound was emitted, not when it is heard. The closer the listener is to the path, the sharper the drop.', '音源が通り過ぎるにつれ、音の高さは音源本来の周波数の 1/(1 − M cos θ) 倍から 1/(1 + M) 倍へなめらかに下がります。θ は音が聞こえた時ではなく出された時に測ります。聴き手が経路に近いほど、下がり方は急になります。'));
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lb) => { const tt = t0 + ((((t * speed) % span) + span) % span); draw(tt); lb.textContent = T(`t = ${fmt(tt, 2)}`, `t = ${fmt(tt, 2)}`); }, { autoplay: !L.reduced(), initialT: (0.5 * span) / speed });
    },
  };
})();
