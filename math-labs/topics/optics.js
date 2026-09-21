'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const rad = (d) => d * Math.PI / 180;

  /* ---------------- 1. Thin lens ---------------- */
  D.lens = {
    render(ctx, v) {
      const conv = v.kind < 0.5, f = conv ? v.f : -v.f, dO = v.object, h = 1;
      const X0 = -10.6, X1 = 10.6, Y0 = -3.4, Y1 = 3.4;
      const atF = Math.abs(dO - f) < 1e-9;
      const dI = atF ? Infinity : f * dO / (dO - f), m = atF ? Infinity : -dI / dO;
      const real = !atF && dI > 0;
      const fig = L.fig(ctx.host, { x: [X0, X1], y: [Y0, Y1], aspect: 0.4, maxH: 420, grid: false, axes: false });
      // optical axis and the lens
      fig.seg([X0, 0], [X1, 0], { c: 'muted', w: 1, layer: 'under' });
      const lensH = 2.9;
      if (conv) fig.poly(L.seq(41, (i) => { const t = i / 40 * 2 * Math.PI; return [0.22 * Math.cos(t), lensH * Math.sin(t)]; }), { c: 'c3', fo: 0.18, w: 1.6, layer: 'under' });
      else fig.poly([[-0.34, lensH], [0.34, lensH]].concat(L.seq(21, (i) => { const y = lensH - 2 * lensH * i / 20; return [0.34 - 0.26 * (1 - (y / lensH) ** 2), y]; }), [[-0.34, -lensH]], L.seq(21, (i) => { const y = -lensH + 2 * lensH * i / 20; return [-0.34 + 0.26 * (1 - (y / lensH) ** 2), y]; })), { c: 'c3', fo: 0.18, w: 1.6, layer: 'under' });
      // focal points and 2f marks
      for (const x of [f, -f]) { fig.dot(x, 0, { c: 'ink', r: 3.5, layer: 'main' }); }
      for (const x of [2 * f, -2 * f]) fig.seg([x, -0.12], [x, 0.12], { c: 'muted', w: 1.4 });
      fig.text(f, 0, "F′", { math: true, dy: 20, layer: 'main' });
      fig.text(-f, 0, 'F', { math: true, dy: 20, layer: 'main' });
      fig.text(2 * f, 0, '2F′', { small: true, dy: 20, c: 'muted', layer: 'main' });
      fig.text(-2 * f, 0, '2F', { small: true, dy: 20, c: 'muted', layer: 'main' });
      // rays: a thin lens changes a ray's slope by −y/f where it crosses at height y
      const O = [-dO, h];
      const ray = (sIn, o) => {
        const y = h + sIn * dO, sOut = sIn - y / f;
        if (Math.abs(y) > lensH) return;
        fig.line([O, [0, y]], o);
        fig.line([[0, y], [X1 + 1, y + sOut * (X1 + 1)]], o);
        if (!real && !atF) fig.line([[0, y], [Math.max(dI, X0 - 1), y + sOut * Math.max(dI, X0 - 1)]], Object.assign({}, o, { dash: '4 4', w: (o.w || 2) * 0.7, op: 0.8 }));
      };
      // a faint fan through the whole aperture
      for (let k = 0; k <= 8; k++) { const yh = -2.6 + 5.2 * k / 8; ray((yh - h) / dO, { c: 'hl', w: 1, op: 0.28 }); }
      ray(0, { c: 'c1', w: 2 });
      ray(-h / dO, { c: 'c4', w: 2 });
      if (!atF) ray(-h / (dO - f), { c: 'c2', w: 2 });
      // image
      let offNote = '';
      if (!atF) {
        const hi = m * h;
        const inView = dI > X0 && dI < X1 && Math.abs(hi) < Y1;
        if (inView) {
          fig.arrow([dI, 0], [dI, hi], { c: 'ink', w: 3.2, dash: real ? false : '5 3' });
          fig.text(dI, hi, real ? T('real image', '実像') : T('virtual image', '虚像'), { dy: hi > 0 ? -10 : 18, small: true, layer: 'main' });
        } else offNote = T(' The image lies outside the figure.', '像は図の外にあります。');
      }
      fig.arrow([-dO, 0], O, { c: 'ink', w: 3.2 });
      fig.text(-dO, h, T('object', '物体'), { dy: -12, small: true, layer: 'main' });
      fig.handle(O[0], O[1], { c: 'c2', label: T('Object position', '物体の位置'), axis: 'x', bounds: [-10, -0.5, Y0, Y1], onDrag: (x) => ctx.set('object', -x) });
      fig.handle(f, 0, { c: 'c3', r: 6, label: T('Focal point', '焦点'), axis: 'x', bounds: conv ? [1, 5, Y0, Y1] : [-5, -1, Y0, Y1], onDrag: (x) => ctx.set('f', Math.abs(x)) });
      L.legend(ctx.host, [{ c: 'c1', label: conv ? T('parallel ray, bends through F′', '平行光線（F′ を通る）') : T('parallel ray, leaves as if from F′', '平行光線（F′ から来たように広がる）') }, { c: 'c4', label: T('central ray, undeviated', '中心光線（直進）') }, { c: 'c2', label: conv ? T('ray through F, leaves parallel', 'F を通る光線（平行に出る）') : T('ray aimed at F, leaves parallel', 'F に向かう光線（平行に出る）') }, { c: 'ink', dash: true, label: T('backward extension, virtual image', '逆向きの延長（虚像）') }]);
      // linked graph d_i against d_o
      L.h('p', 'lab-cap', ctx.host, T('Image distance against object distance. Above zero the image is real, below it is virtual.', '物体距離に対する像距離。0 より上なら実像、下なら虚像です。'));
      const g = L.fig(ctx.host, { x: [0, 10.4], y: [-14, 14], aspect: 0.32, maxH: 240, xlabel: T('object distance d_o', '物体距離 d_o'), ylabel: 'd_i' });
      g.rect(0, 0, 10.4, 14, { c: 'c3', fo: 0.06, nostroke: true, layer: 'under' });
      g.rect(0, -14, 10.4, 14, { c: 'c4', fo: 0.06, nostroke: true, layer: 'under' });
      const cur = (x) => { const d = x - f; return Math.abs(d) < 1e-6 ? NaN : f * x / d; };
      g.line(L.sample(0.2, 10.4, 400, (x) => { const y = cur(x); return Math.abs(y) > 40 ? NaN : y; }), { c: 'c1', w: 2.2 });
      if (conv) { g.vline(f, { c: 'muted' }); g.text(f, 12, 'd_o = f', { anchor: 'start', dx: 5, small: true }); }
      g.text(10.3, 12.5, T('real', '実像'), { anchor: 'end', small: true, c: 'c3' });
      g.text(10.3, -12.5, T('virtual', '虚像'), { anchor: 'end', small: true, c: 'c4' });
      if (!atF) g.dot(dO, L.clamp(dI, -14, 14), { c: 'hl', r: 6 });
      const kind = atF ? T('none: rays leave parallel', 'なし（光線は平行）') : `${real ? T('real, inverted', '実像・倒立') : T('virtual, upright', '虚像・正立')}${T(', ', '、')}${Math.abs(m) > 1 ? T('enlarged', '拡大') : T('reduced', '縮小')}`;
      ctx.readout([{ k: 'd_i', v: atF ? '∞' : fmt(dI, 3), tone: 'key' }, { k: 'm = −d_i/d_o', v: atF ? '∞' : fmt(m, 3) }, { k: T('image', '像'), v: kind, tone: real ? 'good' : 'warn' }],
        T('Drag the object arrow or the focal point F′. Rays from the object tip all meet again at the image point; a virtual image is where the outgoing rays appear to come from.', '物体の矢印や焦点 F′ をドラッグできます。物体の先端から出た光線は像の点で再び集まります。虚像は、出ていく光線がそこから来たように見える点です。') + offNote);
    },
  };

  /* ---------------- 2. Multi-slit interference ---------------- */
  // Approximate RGB of a visible wavelength (nm).
  function spectral(nm) {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
    const k = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
    return [r, g, b].map((c) => 255 * Math.pow(c * k, 0.8));
  }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  D.interference = {
    render(ctx, v) {
      const lam = v.wavelength / 1000, d = v.spacing, a = v.width, N = Math.round(v.slits);
      const spec = spectral(v.wavelength), dark = [14, 13, 18];
      const I = (s) => { // far-field intensity at sinθ = s, normalised to 1 at θ = 0
        const beta = Math.PI * a * s / lam, phi = 2 * Math.PI * d * s / lam;
        const env = Math.abs(beta) < 1e-9 ? 1 : (Math.sin(beta) / beta) ** 2;
        const sp = Math.sin(phi / 2), arr = Math.abs(sp) < 1e-9 ? 1 : (Math.sin(N * phi / 2) / (N * sp)) ** 2;
        return env * arr;
      };
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Time-averaged intensity behind the slits, computed by adding the waves from every slit (distances in µm)', 'スリットの後ろの時間平均強度。各スリットからの波を足し合わせて計算しています（距離の単位は µm）'));
      const fg = L.fig(c1, { x: [-1, 23], y: [-7.5, 7.5], equal: true, maxH: 420, xlabel: 'x (µm)', ylabel: 'y (µm)' });
      const M = N >= 4 ? 2 : 3, k = 2 * Math.PI / lam, src = [];
      for (let j = 0; j < N; j++) for (let q = 0; q < M; q++) src.push((j - (N - 1) / 2) * d + (M > 1 ? (q / (M - 1) - 0.5) * a : 0));
      const S = src.length;
      fg.raster((x, y) => {
        if (x < 0) return dark;
        let re = 0, im = 0;
        for (let j = 0; j < S; j++) { const r = Math.hypot(x, y - src[j]); re += Math.cos(k * r); im += Math.sin(k * r); }
        const u = (re * re + im * im) / (S * S);
        return mix(dark, spec, Math.min(1, Math.sqrt(u) * 1.05));
      }, { res: fg.small ? 2 : 3 });
      // the barrier with its slits
      const gaps = L.seq(N, (j) => (j - (N - 1) / 2) * d).sort((p, q) => p - q);
      let yPrev = -7.6;
      gaps.forEach((yc) => { fg.rect(-0.35, yPrev, 0.35, yc - a / 2 - yPrev, { c: 'muted', fo: 1, nostroke: true }); yPrev = yc + a / 2; });
      fg.rect(-0.35, yPrev, 0.35, 7.6 - yPrev, { c: 'muted', fo: 1, nostroke: true });
      const mMax = Math.floor(d / lam + 1e-9);
      for (let mm = -Math.min(mMax, 2); mm <= Math.min(mMax, 2); mm++) {
        const s = mm * lam / d; if (Math.abs(s) >= 1) continue;
        const th = Math.asin(s), R = 26, e = [R * Math.cos(th), R * Math.sin(th)];
        fg.seg([0, 0], e, { c: 'hl', w: 1.2, dash: '3 5', op: 0.9 });
        const lx = Math.min(21.6, Math.abs(th) > 1e-9 ? 6.4 / Math.abs(Math.tan(th)) : 21.6), ly = Math.tan(th) * lx;
        if (Math.abs(ly) < 6.9) fg.text(lx, ly, `m = ${mm}`.replace('-', '−'), { small: true, dy: -6, anchor: 'end', c: 'hl' });
      }
      // far-field pattern against angle
      const c2 = L.h('div', 'lab-col', ctx.host);
      L.h('p', 'lab-cap', c2, T('Far-field intensity I(θ)/I₀ and how the screen looks', '遠方での強度 I(θ)/I₀ とスクリーンの見え方'));
      const strip = L.fig(c2, { x: [-90, 90], y: [0, 1], aspect: 0.05, minH: 34, maxH: 40, axes: false, pad: { l: 48, r: 16, t: 4, b: 4 } });
      strip.raster((x) => mix([0, 0, 0], spec, Math.min(1, Math.sqrt(I(Math.sin(rad(x)))) * 1.1)), { res: 2 });
      const g = L.fig(c2, { x: [-90, 90], y: [0, 1.08], aspect: 0.32, maxH: 260, xlabel: T('angle θ (degrees)', '角度 θ（度）'), ticksX: [-90, -60, -30, 0, 30, 60, 90].map((t) => [t, String(t).replace('-', '−')]) });
      const pts = L.sample(-90, 90, 1800, (x) => I(Math.sin(rad(x))));
      g.area(pts, { c: 'c1', fo: 0.14 });
      g.line(pts, { c: 'c1', w: 1.8 });
      g.line(L.sample(-90, 90, 600, (x) => { const bta = Math.PI * a * Math.sin(rad(x)) / lam; return Math.abs(bta) < 1e-9 ? 1 : (Math.sin(bta) / bta) ** 2; }), { c: 'c2', w: 1.4, dash: '5 4' });
      for (let mm = -mMax; mm <= mMax; mm++) { const s = mm * lam / d; if (Math.abs(s) >= 1 || Math.abs(mm) > 3) continue; const th = Math.asin(s) * 180 / Math.PI; g.text(th, I(s), String(mm).replace('-', '−'), { small: true, dy: -6 }); }
      L.legend(ctx.host, [{ c: 'c1', label: T(`${N}-slit intensity`, `${N} スリットの強度`) }, { c: 'c2', dash: true, label: T('single-slit envelope (sin β/β)²', '単スリットの包絡線 (sin β/β)²') }, { c: 'hl', dash: true, label: T('bright directions d sin θ = mλ', '明線の方向 d sin θ = mλ') }]);
      const th1 = lam / d < 1 ? Math.asin(lam / d) * 180 / Math.PI : NaN;
      ctx.readout([{ k: 'd/λ', v: fmt(d / lam, 3), tone: 'key' }, { k: T('first-order angle θ₁', '1次の角度 θ₁'), v: Number.isFinite(th1) ? `${fmt(th1, 3)}°` : T('none', 'なし') }, { k: T('bright orders |m| ≤ d/λ', '明線の次数 |m| ≤ d/λ'), v: String(2 * mMax + 1) }, { k: T('weak peaks between orders', '次数間の弱いピーク'), v: String(N - 2) }],
        T('More slits sharpen each bright order and add N − 2 faint peaks between them; the slit width only sets the envelope.', 'スリットを増やすと各明線が鋭くなり、その間に N − 2 個の弱いピークが現れます。スリット幅は包絡線だけを決めます。'));
    },
  };

  /* ---------------- 3. Polarisation ---------------- */
  D.polarization = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const th = rad(v.angle), I0 = v.i0, three = v.middle > 0.5;
      const plates = three ? [0, th / 2, th] : [0, th];
      const amps = [Math.sqrt(I0)];
      for (let i = 1; i < plates.length; i++) amps.push(amps[i - 1] * Math.cos(plates[i] - plates[i - 1]));
      const Iout = amps[amps.length - 1] ** 2;
      // oblique view of the beam
      L.h('p', 'lab-cap', ctx.host, T('The beam from the side: the electric field oscillates in the plane each filter lets through, and shrinks at each filter', '横から見たビーム：電場は各フィルターが通す面の中で振動し、フィルターごとに小さくなります'));
      const s = L.fig(ctx.host, { axes: false, x: [0, 12], y: [-1.9, 1.9], equal: true, maxH: 300 });
      const xs = three ? [2.2, 5.6, 9] : [2.6, 8];
      const proj = (x, ang, r) => [x - 0.42 * r * Math.sin(ang), r * Math.cos(ang) - 0.28 * r * Math.sin(ang)];
      const R = 1.45;
      s.seg([0, 0], [12, 0], { c: 'muted', w: 1, dash: '3 4', layer: 'under' });
      const tones = three ? ['c1', 'c3', 'c2'] : ['c1', 'c2'];
      xs.forEach((x, i) => {
        s.poly(L.seq(61, (j) => { const a = j / 60 * L.TAU; return proj(x, a, R); }), { c: tones[i], fo: 0.1, w: 1.4, layer: 'under' });
        s.seg(proj(x, plates[i], R), proj(x, plates[i] + Math.PI, R), { c: tones[i], w: 2.4, layer: 'under' });
        s.text(...proj(x, 0, R), [T('polariser', '偏光子'), three ? T('middle', '中間') : T('analyser', '検光子'), T('analyser', '検光子')][i], { dy: -8, small: true, c: tones[i] });
      });
      s.text(0.9, -1.55, T('unpolarised in', '非偏光'), { small: true, c: 'muted' });
      s.layers.wave = s.group('main');
      const segs = [[0.2, xs[0]]].concat(xs.map((x, i) => [x, i + 1 < xs.length ? xs[i + 1] : 12]));
      const wave = (ph) => {
        s.clear('wave');
        // unpolarised light: a few random planes, drawn faintly
        [0.3, 1.2, 2.1].forEach((a) => s.line(L.sample(segs[0][0], segs[0][1], 80, (x) => proj(x, a, 1.0 * Math.sin(5 * x - ph))), { c: 'muted', w: 1.2, op: 0.5, layer: 'wave' }));
        segs.slice(1).forEach(([xa, xb], i) => {
          const A = amps[i] / Math.sqrt(Math.max(I0, 1e-9)) * 1.0 * Math.sqrt(I0);
          if (A < 0.01) return;
          s.line(L.sample(xa, xb, 90, (x) => proj(x, plates[i], A * Math.sin(5 * x - ph))), { c: tones[i], w: 2.2, layer: 'wave' });
        });
      };
      const row = L.h('div', 'lab-row', ctx.host);
      const cA = L.h('div', 'lab-col', row), cB = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', cA, T('Looking along the beam: the field is projected onto each axis', 'ビームの方向から見る：電場は各軸へ射影されます'));
      L.h('p', 'lab-cap', cB, T('Transmitted intensity against the analyser angle', '検光子の角度に対する透過強度'));
      const b = L.fig(cA, { x: [-1.35, 1.35], y: [-1.25, 1.25], equal: true, maxH: 300, axes: false });
      b.circle(0, 0, 1.1, { c: 'muted', w: 1, fill: true, fo: 0.04 });
      const dir = (a) => [Math.sin(a), Math.cos(a)];
      plates.forEach((a, i) => { const u = dir(a); b.seg([-1.1 * u[0], -1.1 * u[1]], [1.1 * u[0], 1.1 * u[1]], { c: tones[i], w: 1.4, dash: '6 4', op: 0.8 }); });
      // successive projections of the field amplitude
      let prev = [0, amps[0] / Math.sqrt(Math.max(I0, 1e-9))];
      b.arrow([0, 0], prev, { c: 'c1', w: 3 });
      for (let i = 1; i < plates.length; i++) {
        const u = dir(plates[i]), A = amps[i] / Math.sqrt(Math.max(I0, 1e-9)), p = [A * u[0], A * u[1]];
        b.seg(prev, p, { c: 'muted', w: 1, dash: '2 3' });
        b.arrow([0, 0], p, { c: tones[i], w: 3 });
        prev = p;
      }
      b.text(0, 1, 'E₀', { math: true, dx: -12, anchor: 'end', dy: 6, c: 'c1' });
      const tipA = dir(th);
      b.text(prev[0] / 2, prev[1] / 2, three ? 'E₀cos²(θ/2)' : 'E₀cos θ', { math: true, dx: 10, dy: 14, anchor: 'start', c: 'c2' });
      const hp = [1.1 * tipA[0], 1.1 * tipA[1]];
      b.handle(hp[0], hp[1], { c: 'c2', label: T('Analyser angle', '検光子の角度'), onDrag: (x, y) => { let d = Math.atan2(x, y) * 180 / Math.PI; if (d < 0) d += 180; ctx.set('angle', d); } });
      b.text(hp[0], hp[1], `θ = ${Math.round(v.angle)}°`, { dx: hp[0] > 0 ? 14 : -14, dy: hp[1] > 0 ? -8 : 16, anchor: hp[0] > 0 ? 'start' : 'end', small: true });
      const g = L.fig(cB, { x: [0, 180], y: [0, 1.05], aspect: 0.8, maxH: 300, xlabel: T('analyser angle θ (degrees)', '検光子の角度 θ（度）'), ylabel: 'I/I₀', ticksX: [0, 45, 90, 135, 180].map((t) => [t, String(t)]) });
      g.line(L.sample(0, 180, 180, (x) => Math.abs(Math.cos(rad(x)))), { c: 'muted', w: 1.2, dash: '3 4' });
      g.line(L.sample(0, 180, 180, (x) => Math.cos(rad(x)) ** 2), { c: 'c2', w: three ? 1.6 : 2.6, op: three ? 0.5 : 1 });
      g.line(L.sample(0, 180, 180, (x) => Math.cos(rad(x / 2)) ** 4), { c: 'c3', w: three ? 2.6 : 1.6, op: three ? 1 : 0.5 });
      g.vline(v.angle, { c: 'hl', dash: '2 3' });
      g.dot(v.angle, Iout / I0, { c: 'hl', r: 6.5 });
      L.legend(ctx.host, [{ c: 'c2', label: T('two filters: cos²θ', 'フィルター2枚: cos²θ') }, { c: 'c3', label: T('middle filter at θ/2: cos⁴(θ/2)', '中間に θ/2 のフィルター: cos⁴(θ/2)') }, { c: 'muted', dash: true, label: T('field amplitude |cos θ|', '電場振幅 |cos θ|') }]);
      ctx.state.anim = L.animator(ctx.host, (dt, t) => { wave(t * 6); }, { autoplay: true });
      ctx.readout([{ k: T('transmitted I', '透過強度 I'), v: fmt(Iout, 3), tone: 'key' }, { k: 'I/I₀', v: fmt(Iout / I0, 3) }, ].concat(three ? [{ k: T('without the middle filter', '中間フィルターなし'), v: fmt(I0 * Math.cos(th) ** 2, 3), tone: 'warn' }] : []),
        three ? T('Adding a filter can let more light through: at θ = 90° two crossed filters pass nothing, but a third at 45° between them passes I₀/4.', 'フィルターを足すと光が増えることがあります。θ = 90° の直交した2枚は光を通しませんが、間に 45° の3枚目を入れると I₀/4 が通ります。')
          : T('Drag the orange handle to turn the analyser. The field amplitude is projected once, cos θ, and intensity is its square.', '橙のハンドルで検光子を回せます。電場振幅は一度射影されて cos θ 倍になり、強度はその二乗です。'));
    },
  };
})();
