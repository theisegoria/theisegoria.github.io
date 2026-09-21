'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;
  // Composite Simpson rule on [a, b] with n (even) panels.
  const simpson = (fn, a, b, n = 400) => { const h = (b - a) / n; let s = fn(a) + fn(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fn(a + i * h); return s * h / 3; };

  D['euler-lagrange'] = {
    render(ctx, v) {
      const g = 8, eps = v.bend, shape = Math.round(v.shape ?? 0);
      // variations eta(t) with eta(0) = eta(1) = 0, normalised to max |eta| = 1
      const ETA = [
        { f: (t) => Math.sin(PI * t), d: (t) => PI * Math.cos(PI * t), dd: (t) => -PI * PI * Math.sin(PI * t), th: 0.5 },
        { f: (t) => Math.sin(2 * PI * t), d: (t) => 2 * PI * Math.cos(2 * PI * t), dd: (t) => -4 * PI * PI * Math.sin(2 * PI * t), th: 0.25 },
        { f: (t) => 6.75 * t * t * (1 - t), d: (t) => 6.75 * (2 * t - 3 * t * t), dd: (t) => 6.75 * (2 - 6 * t), th: 2 / 3 },
      ][shape];
      const qs = (t) => 0.5 * g * t * (1 - t), qsd = (t) => 0.5 * g * (1 - 2 * t);
      const q = (t, e = eps) => qs(t) + e * ETA.f(t), qd = (t, e = eps) => qsd(t) + e * ETA.d(t);
      const S = (e) => simpson((t) => 0.5 * qd(t, e) ** 2 - g * q(t, e), 0, 1);
      const S0 = S(0), Se = S(eps), c2 = 0.5 * simpson((t) => ETA.d(t) ** 2, 0, 1);
      const row = L.h('div', 'lab-row', ctx.host);
      const col1 = L.h('div', 'lab-col', row), col2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', col1, T('Height q(t) of a ball thrown up at t = 0 and caught at t = 1. Drag the orange handle to bend the trial path.', 't = 0 で投げ上げ t = 1 で受け止めるボールの高さ q(t)。橙のハンドルで試行経路を曲げられます。'));
      const f = fig(col1, { x: [0, 1], y: [-1.15, 2.15], aspect: 0.72, maxH: 340, xlabel: 't', ylabel: 'q' });
      [-1, -0.5, 0.5, 1].forEach((e) => f.line(L.sample(0, 1, 80, (t) => q(t, e)), { c: 'muted', w: 1, op: 0.25, layer: 'under' }));
      f.line(L.sample(0, 1, 200, (t) => q(t, 0)), { c: 'c1', w: 2.6 });
      f.line(L.sample(0, 1, 200, (t) => q(t)), { c: 'hl', w: 3 });
      f.dot(0, 0, { c: 'ink', r: 5 }); f.dot(1, 0, { c: 'ink', r: 5 });
      f.text(0.5, qs(0.5), T('stationary path', '停留経路'), { c: 'c1', dy: eps > 0 ? 18 : -10, small: true });
      f.handle(ETA.th, q(ETA.th), { c: 'c2', label: T('Bend of the trial path', '試行経路の曲がり'), axis: 'y', bounds: [0, 1, -1.1, 2.1], onDrag: (x, y) => ctx.set('bend', (y - qs(ETA.th)) / ETA.f(ETA.th)) });
      // residual of the Euler-Lagrange equation along the trial path
      const rmax = Math.max(...L.seq(101, (i) => Math.abs(ETA.dd(i / 100)))) * 1.1;
      L.h('p', 'lab-cap', col1, T('Euler–Lagrange residual q̈ + g along the trial path (zero on the stationary path).', '試行経路に沿ったオイラー・ラグランジュ方程式の残差 q̈ + g（停留経路では 0）。'));
      const r = fig(col1, { x: [0, 1], y: [-rmax, rmax], aspect: 0.3, minH: 140, maxH: 170, xlabel: 't', ticksY: [[-Math.round(rmax * 0.8), fmt(-Math.round(rmax * 0.8), 0)], [0, '0'], [Math.round(rmax * 0.8), fmt(Math.round(rmax * 0.8), 0)]] });
      const res = L.sample(0, 1, 200, (t) => eps * ETA.dd(t));
      r.area(res, { c: 'c2', fo: 0.25 });
      r.line(res, { c: 'c2', w: 2 });
      // right: the action as a function of the bend
      L.h('p', 'lab-cap', col2, T('The action S of every path in this one-parameter family.', 'この1パラメータ族の各経路の作用 S。'));
      const lo = S0 - 0.05 * c2, hi = S0 + c2 * 1.05;
      const a = fig(col2, { x: [-1, 1], y: [lo, hi], aspect: 0.9, maxH: 420, xlabel: T('bend ε', '曲がり ε'), ylabel: 'S' });
      a.line(L.sample(-1, 1, 120, S), { c: 'ink', w: 2.2 });
      a.line([[-0.35, S0], [0.35, S0]], { c: 'c1', w: 1.6, dash: '5 4' });
      a.dot(0, S0, { c: 'c1', r: 6 });
      a.text(0, S0, T('dS/dε = 0', 'dS/dε = 0'), { dy: 20, c: 'c1', small: true });
      a.vline(eps, { c: 'hl', w: 1.2 });
      a.dot(eps, Se, { c: 'hl', r: 7 });
      a.hover((x) => (x < -1 || x > 1 ? null : { x, y: S(x), text: `ε = ${fmt(x, 2)}: S = ${fmt(S(x), 4)}` }));
      L.legend(ctx.host, [{ c: 'c1', label: T('Stationary path q*(t) = 4t(1 − t)', '停留経路 q*(t) = 4t(1 − t)') }, { c: 'hl', label: T('Trial path q* + εη', '試行経路 q* + εη') }, { c: 'muted', label: T('Other members of the family', '族の他の経路') }, { kind: 'fill', c: 'c2', label: T('Residual q̈ + g', '残差 q̈ + g') }]);
      ctx.readout([
        { k: 'S[q*]', v: fmt(S0, 4), tone: 'good' },
        { k: 'S[q* + εη]', v: fmt(Se, 4), tone: 'key' },
        { k: 'ΔS', v: fmt(Se - S0, 4) },
        { k: T('ε²·½∫η̇² dt', 'ε²·½∫η̇² dt'), v: fmt(eps * eps * c2, 4) },
      ], T(`With L = ½q̇² − gq (g = ${g}), the term linear in ε is −ε∫(q̈* + g)η dt, which vanishes because q* solves the Euler–Lagrange equation q̈ = −g. What is left is the positive term ε²·½∫η̇² dt.`, `L = ½q̇² − gq（g = ${g}）では、ε の1次の項は −ε∫(q̈* + g)η dt で、q* がオイラー・ラグランジュ方程式 q̈ = −g を満たすので消えます。残るのは正の項 ε²·½∫η̇² dt です。`));
    },
  };

  D.geodesic = {
    render(ctx, v) {
      const p0 = rad(v.latitude), dl = rad(v.arc), h = dl / 2;
      const A = Math.tan(p0) / Math.cos(h);
      const gc = (l) => Math.atan(A * Math.cos(l));
      // keep every path of the family on the sphere: it must not run past the pole
      const gap = Math.abs(gc(0) - p0), smax = gap > 1e-9 ? Math.min(2, 0.97 * (PI / 2 - Math.abs(p0)) / gap) : 2, s = Math.min(v.pull ?? 1, smax);
      const curve = (sv) => (l) => p0 + sv * (gc(l) - p0);
      const lenOf = (fn) => simpson((l) => { const e = 1e-5, d = (fn(l + e) - fn(l - e)) / (2 * e); return Math.sqrt(d * d + Math.cos(fn(l)) ** 2); }, -h, h, 200);
      const Lpar = dl * Math.cos(p0), Lgc = 2 * Math.asin(Math.min(1, Math.cos(p0) * Math.sin(h))), Ls = lenOf(curve(s));
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T('Longitude–latitude map. Drag the handle to vary the path between the two cities.', '経度・緯度の地図。ハンドルをドラッグして2都市間の経路を変えます。'));
      const far = deg(curve(smax)(0)), ylo = L.clamp(Math.min(deg(p0), far) - 22, -90, 60), yhi = L.clamp(Math.max(deg(p0), far) + 22, -60, 90);
      const m = fig(c1, { x: [-95, 95], y: [ylo, yhi], aspect: 0.8, maxH: 360, xlabel: T('longitude (°)', '経度（°）'), ylabel: T('latitude (°)', '緯度（°）'), ticksX: [-90, -45, 0, 45, 90].map((x) => [x, String(x).replace('-', '−')]), ticksY: [-90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90].filter((x) => x >= ylo && x <= yhi).map((x) => [x, String(x).replace('-', '−')]) });
      const inMap = (fn) => L.sample(-h, h, 160, (l) => [deg(l), deg(fn(l))]);
      [0, 0.5, 1.5, 2].filter((sv) => sv <= smax).forEach((sv) => m.line(inMap(curve(sv)), { c: 'muted', w: 1, op: 0.35 }));
      m.line(inMap(() => p0), { c: 'c2', w: 2.2, dash: '6 4' });
      m.line(inMap(gc), { c: 'c1', w: 2.6 });
      m.line(inMap(curve(s)), { c: 'hl', w: 2.6 });
      [-h, h].forEach((l) => m.dot(deg(l), deg(p0), { c: 'ink', r: 5.5 }));
      const top = gc(0);
      m.handle(0, deg(curve(s)(0)), { c: 'c2', axis: 'y', label: T('Trial path', '試行経路'), bounds: [-95, 95, ylo, yhi], onDrag: (x, y) => { if (Math.abs(top - p0) > 1e-6) ctx.set('pull', (rad(y) - p0) / (top - p0)); } });
      // orthographic view of the globe
      L.h('p', 'lab-cap', c2, T('The same paths on the globe (dashed where they pass behind).', '同じ経路を地球儀上に表示（裏側は破線）。'));
      const gf = fig(c2, { axes: false, x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, maxH: 360 });
      const tilt = L.clamp(p0 * 0.8, -1.1, 1.1);
      const proj = (l, p) => { const x = Math.cos(p) * Math.sin(l), y = Math.sin(p), z = Math.cos(p) * Math.cos(l); return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)]; };
      const draw3 = (pts, o) => { let seg = [], front = null; const flush = () => { if (seg.length > 1) gf.line(seg, Object.assign({}, o, front ? {} : { dash: '3 4', op: (o.op ?? 1) * 0.45 })); seg = []; }; pts.forEach(([l, p]) => { const [x, y, z] = proj(l, p), fr = z >= 0; if (front !== null && fr !== front) { seg.push([x, y]); flush(); } front = fr; seg.push([x, y]); }); flush(); };
      gf.circle(0, 0, 1, { c: 'muted', fill: true, fo: 0.05, w: 1.4 });
      for (let p = -60; p <= 60; p += 30) { const pts = L.sample(-PI, PI, 120, (l) => [l, rad(p)]); let seg = []; pts.forEach(([l, pp]) => { const [x, y, z] = proj(l, pp); if (z >= 0) seg.push([x, y]); else { if (seg.length > 1) gf.line(seg, { c: 'muted', w: 0.8, op: 0.4, layer: 'under' }); seg = []; } }); if (seg.length > 1) gf.line(seg, { c: 'muted', w: 0.8, op: 0.4, layer: 'under' }); }
      for (let l = -180; l < 180; l += 30) { const pts = L.sample(-PI / 2, PI / 2, 80, (pp) => [rad(l), pp]); let seg = []; pts.forEach(([ll, pp]) => { const [x, y, z] = proj(ll, pp); if (z >= 0) seg.push([x, y]); else { if (seg.length > 1) gf.line(seg, { c: 'muted', w: 0.8, op: 0.4, layer: 'under' }); seg = []; } }); if (seg.length > 1) gf.line(seg, { c: 'muted', w: 0.8, op: 0.4, layer: 'under' }); }
      const on = (fn) => L.sample(-h, h, 160, (l) => [l, fn(l)]);
      draw3(on(() => p0), { c: 'c2', w: 2.2, dash: '6 4' });
      draw3(on(gc), { c: 'c1', w: 2.6 });
      draw3(on(curve(s)), { c: 'hl', w: 2.6 });
      [-h, h].forEach((l) => { const [x, y] = proj(l, p0); gf.dot(x, y, { c: 'ink', r: 5.5 }); });
      // length of the trial path as a function of the pull
      L.h('p', 'lab-cap', ctx.host, T('Length of the trial path as the pull varies: it is stationary, and smallest, at the great circle.', '引き寄せ量を変えたときの試行経路の長さ。大円で停留し、最小になります。'));
      const Ls_ = L.sample(0, smax, 60, (sv) => lenOf(curve(sv)));
      const ymin = Math.min(...Ls_.map((p) => p[1])), ymax = Math.max(...Ls_.map((p) => p[1]));
      const pad = Math.max(0.02, (ymax - ymin) * 0.15);
      const lf = fig(ctx.host, { x: [0, Math.max(smax, 1.2)], y: [ymin - pad, ymax + pad], aspect: 0.3, minH: 170, maxH: 220, xlabel: T('pull toward the great circle (0 = parallel, 1 = great circle)', '大円への引き寄せ（0 = 緯線、1 = 大円）'), ylabel: T('length', '長さ') });
      lf.line(Ls_, { c: 'ink', w: 2 });
      lf.dot(0, Lpar, { c: 'c2', r: 5.5 }); lf.dot(1, Lgc, { c: 'c1', r: 6 }); lf.dot(s, Ls, { c: 'hl', r: 7 });
      L.legend(ctx.host, [{ c: 'c2', dash: true, label: T('Parallel of latitude: straight on the map', '緯線：地図上では直線') }, { c: 'c1', label: T('Great circle: the geodesic', '大円：測地線') }, { c: 'hl', label: T('Trial path', '試行経路') }, { c: 'muted', label: T('Other paths in the family', '族の他の経路') }]);
      const km = (x) => `${fmt(x, 4)} (${Math.round(x * 6371).toLocaleString('en-US')} km)`;
      ctx.readout([
        { k: T('parallel', '緯線'), v: km(Lpar) },
        { k: T('great circle', '大円'), v: km(Lgc), tone: 'good' },
        { k: T('trial path', '試行経路'), v: km(Ls), tone: 'key' },
      ], (v.pull > smax + 1e-9 ? T(`Pulls beyond ${fmt(smax, 2)} would carry the path past the pole, so the family stops there. `, `${fmt(smax, 2)} を超える引き寄せでは経路が極を越えてしまうので、族はそこで止めます。`) : '') + (Math.abs(p0) < 1e-9 ? T('On the equator the parallel is itself a great circle, so every path in this family coincides.', '赤道では緯線自体が大円なので、この族の経路はすべて一致します。') : T('Lengths on the unit sphere, and on Earth with radius 6371 km. The great circle bulges toward the nearer pole on the map, yet it is shorter.', '単位球面上の長さと、半径 6371 km の地球上の長さです。大円は地図上では近い方の極へ膨らみますが、より短くなります。')));
    },
  };

  D['least-action'] = {
    render(ctx, v) {
      const spans = [PI / 2, 3 * PI / 4, 5 * PI / 4, 3 * PI / 2], names = ['π/2', '3π/4', '5π/4', '3π/2'];
      const si = Math.round(v.span ?? 1), Tt = spans[si], k = Math.round(v.mode ?? 1), eps = v.amplitude;
      const qs = (t) => Math.sin(t) / Math.sin(Tt), qsd = (t) => Math.cos(t) / Math.sin(Tt);
      const eta = (kk) => (t) => Math.sin(kk * PI * t / Tt), etad = (kk) => (t) => kk * PI / Tt * Math.cos(kk * PI * t / Tt);
      const q = (t, e = eps, kk = k) => qs(t) + e * eta(kk)(t), qd = (t, e = eps, kk = k) => qsd(t) + e * etad(kk)(t);
      const S = (e, kk = k) => simpson((t) => 0.5 * (qd(t, e, kk) ** 2 - q(t, e, kk) ** 2), 0, Tt);
      const S0 = 0.5 / Math.tan(Tt), coef = (kk) => (Tt / 4) * ((kk * PI / Tt) ** 2 - 1);
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`An oscillator, L = ½q̇² − ½q², from q(0) = 0 to q(T) = 1 with T = ${names[si]}.`, `振動子 L = ½q̇² − ½q² を q(0) = 0 から q(T) = 1 まで、T = ${names[si]}。`));
      const yl = Math.max(1.6, Math.abs(1 / Math.sin(Tt)) + 1.2);
      const f = fig(c1, { x: [0, Tt], y: [-yl, yl], aspect: 0.8, maxH: 360, xlabel: 't', ylabel: 'q', piX: true });
      [-1, -0.5, 0.5, 1].forEach((e) => f.line(L.sample(0, Tt, 100, (t) => q(t, e)), { c: 'muted', w: 1, op: 0.3, layer: 'under' }));
      f.line(L.sample(0, Tt, 200, (t) => q(t, 0)), { c: 'c1', w: 2.6 });
      f.line(L.sample(0, Tt, 200, (t) => q(t)), { c: 'hl', w: 3 });
      f.dot(0, 0, { c: 'ink', r: 5 }); f.dot(Tt, 1, { c: 'ink', r: 5 });
      // right: S(eps) - S* for the three modes
      L.h('p', 'lab-cap', c2, T('Change of action ΔS = S − S* along three different variations ηₖ = sin(kπt/T).', '3種類の変分 ηₖ = sin(kπt/T) に沿った作用の変化 ΔS = S − S*。'));
      const cmax = Math.max(...[1, 2, 3].map((kk) => Math.abs(coef(kk))));
      const cmin = Math.min(0, ...[1, 2, 3].map(coef));
      const a = fig(c2, { x: [-1, 1], y: [cmin * 1.1 - 0.05 * cmax, cmax * 1.05], aspect: 0.8, maxH: 360, xlabel: T('amplitude ε', '振幅 ε'), ylabel: 'ΔS' });
      const MC = { 1: 'c2', 2: 'c3', 3: 'c4' };
      [1, 2, 3].forEach((kk) => a.line(L.sample(-1, 1, 100, (e) => e * e * coef(kk)), { c: MC[kk], w: kk === k ? 3 : 1.4, op: kk === k ? 1 : 0.55 }));
      [1, 2, 3].forEach((kk) => a.text(1, coef(kk), `k = ${kk}`, { anchor: 'end', dx: -4, dy: coef(kk) >= 0 ? -6 : 16, small: true, c: MC[kk] }));
      a.hline(0, { c: 'c1', w: 1.4, dash: '5 4' });
      const dS = S(eps) - S0;
      a.dot(eps, dS, { c: 'hl', r: 7 });
      a.dot(0, 0, { c: 'c1', r: 5 });
      L.legend(ctx.host, [{ c: 'c1', label: T('Classical path q* = sin t / sin T', '古典経路 q* = sin t / sin T') }, { c: 'hl', label: T(`Varied path q* + ε·η${'₁₂₃'[k - 1]}`, `変分した経路 q* + ε·η${'₁₂₃'[k - 1]}`) }, { c: 'c2', label: 'k = 1' }, { c: 'c3', label: 'k = 2' }, { c: 'c4', label: 'k = 3' }]);
      const saddle = Tt > PI;
      ctx.readout([
        { k: 'S[q*] = ½ cot T', v: fmt(S0, 4) },
        { k: 'S[q* + εηₖ]', v: fmt(S(eps), 4), tone: 'key' },
        { k: 'ΔS = ε²·(T/4)((kπ/T)² − 1)', v: fmt(eps * eps * coef(k), 4), tone: dS < -1e-9 ? 'warn' : undefined },
        { k: T('classical path is', '古典経路は'), v: saddle ? T('a saddle', '鞍点') : T('a minimum', '最小'), tone: saddle ? 'warn' : 'good' },
      ], saddle ? T('T is longer than π, past the first conjugate point, so the slow variation k = 1 lowers the action while faster ones raise it: the action is stationary but not least.', 'T が π より長く最初の共役点を越えているので、ゆっくりした変分 k = 1 は作用を下げ、速い変分は上げます。作用は停留しますが最小ではありません。') : T('For T < π every variation raises the action, so here the classical path really is a minimum.', 'T < π ではどの変分も作用を上げるので、ここでは古典経路は本当に最小です。'));
    },
  };
})();
