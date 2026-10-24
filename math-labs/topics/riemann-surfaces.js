'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180;

  /* ---------------- complex arithmetic and models (no DOM) ---------------- */
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cabs = (a) => Math.hypot(a[0], a[1]);
  const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
  const csqrt = (a) => { const r = Math.sqrt(cabs(a)), t = Math.atan2(a[1], a[0]) / 2; return [r * Math.cos(t), r * Math.sin(t)]; };
  const unwrap = (prev, a) => { while (a - prev > PI) a -= TAU; while (a - prev < -PI) a += TAU; return a; };

  // 1. analytic continuation of z^(1/m) or log z along a loop z(t) = c + R e^(2 pi i t), t in [0, turns]
  // kind: 0 square root, 1 cube root, 2 logarithm. Returns samples {t, z, theta (continuous argument), w}
  const wOf = (kind, rho, th) => (kind === 2 ? [Math.log(rho), th] : [Math.pow(rho, 1 / (kind + 2)) * Math.cos(th / (kind + 2)), Math.pow(rho, 1 / (kind + 2)) * Math.sin(th / (kind + 2))]);
  function continueLoop(kind, c, R, turns, n = 360) {
    const out = [];
    let th = null;
    for (let i = 0; i <= n * turns; i++) {
      const t = i / n, z = [c[0] + R * Math.cos(TAU * t), c[1] + R * Math.sin(TAU * t)];
      const rho = cabs(z), a = Math.atan2(z[1], z[0]);
      th = th === null ? a : unwrap(th, a);
      out.push({ t, z, rho, theta: th, w: wOf(kind, Math.max(rho, 1e-12), th) });
    }
    return out;
  }
  const winding = (c, R, turns) => (Math.hypot(c[0], c[1]) < R ? turns : 0);

  // 2. hyperelliptic curve w^2 = prod (z - a_k)
  const poly = (pts, z) => pts.reduce((acc, a) => cmul(acc, csub(z, a)), [1, 0]);
  // continue sqrt(p) along a sampled path, starting from w0 (or the principal root)
  function continueSqrt(pts, path, w0) {
    let w = w0 || csqrt(poly(pts, path[0]));
    const out = [w];
    for (let i = 1; i < path.length; i++) {
      const r = csqrt(poly(pts, path[i]));
      w = Math.hypot(r[0] - w[0], r[1] - w[1]) <= Math.hypot(r[0] + w[0], r[1] + w[1]) ? r : [-r[0], -r[1]];
      out.push(w);
    }
    return out;
  }
  const genusHyper = (n) => Math.floor((n - 1) / 2);
  const branchCount = (n) => (n % 2 ? n + 1 : n);                  // with infinity when the degree is odd
  const enclosed = (pts, c, R) => pts.filter((a) => Math.hypot(a[0] - c[0], a[1] - c[1]) < R).length;
  // superelliptic w^m = polynomial of degree n with distinct roots, gcd(m, n) = 1: Riemann-Hurwitz gives g = (m - 1)(n - 1)/2
  const genusSuper = (m, n) => (m - 1) * (n - 1) / 2;

  // 3. Riemann sphere and Moebius maps; stereographic projection from the north pole onto the equatorial plane
  const stereo = (P) => [P[0] / (1 - P[2]), P[1] / (1 - P[2])];
  const unstereo = (z) => { const r2 = z[0] * z[0] + z[1] * z[1]; return [2 * z[0] / (1 + r2), 2 * z[1] / (1 + r2), (r2 - 1) / (r2 + 1)]; };
  const rotX = (P, a) => [P[0], P[1] * Math.cos(a) - P[2] * Math.sin(a), P[1] * Math.sin(a) + P[2] * Math.cos(a)];
  // the one-parameter flow f_t in standard position (fixed points 0 and infinity, or infinity alone)
  function mobiusParams(kind, amount) {
    if (kind === 0) return { lam: [Math.cos(amount * PI), Math.sin(amount * PI)], log: [0, amount * PI] };
    if (kind === 1) { const k = Math.exp(2 * amount); return { lam: [k, 0], log: [2 * amount, 0] }; }
    if (kind === 2) return { b: [2 * amount, 0] };
    return { lam: cexp([amount, amount * PI]), log: [amount, amount * PI] };
  }
  function flowStd(kind, amount, z, t) {
    const m = mobiusParams(kind, amount);
    if (kind === 2) return cadd(z, [m.b[0] * t, m.b[1] * t]);
    return cmul(z, cexp([m.log[0] * t, m.log[1] * t]));
  }
  // apply the conjugated flow to a point P on the sphere: rotate into standard position, act, rotate back
  function flowSphere(kind, amount, tilt, P, t) {
    const Q = rotX(P, -tilt);
    if (1 - Q[2] < 1e-12) return P.slice();                          // infinity is fixed by every standard flow
    return rotX(unstereo(flowStd(kind, amount, stereo(Q), t)), tilt);
  }
  // normalised matrix (det 1) of the time-1 map in standard position and its trace squared
  function mobiusMatrix(kind, amount) {
    const m = mobiusParams(kind, amount);
    if (kind === 2) return { a: [1, 0], b: m.b, c: [0, 0], d: [1, 0] };
    const s = cexp([m.log[0] / 2, m.log[1] / 2]), si = cdiv([1, 0], s);
    return { a: s, b: [0, 0], c: [0, 0], d: si };
  }
  const traceSq = (M) => { const tr = cadd(M.a, M.d); return cmul(tr, tr); };
  function classify(tr2) {
    if (Math.abs(tr2[1]) > 1e-9) return 3;
    if (Math.abs(tr2[0] - 4) < 1e-9) return 2;
    if (tr2[0] > 4) return 1;
    return tr2[0] >= 0 ? 0 : 3;                                      // a negative real trace squared is loxodromic too
  }
  const fixedPoints = (kind, tilt) => { const top = rotX([0, 0, 1], tilt), bot = rotX([0, 0, -1], tilt); return kind === 2 ? [top] : [bot, top]; };

  const M = { cadd, csub, cmul, cdiv, cabs, csqrt, cexp, wOf, continueLoop, winding, poly, continueSqrt, genusHyper, branchCount, enclosed, genusSuper, stereo, unstereo, rotX, flowStd, flowSphere, mobiusMatrix, traceSq, classify, fixedPoints };
  (window.LabModels = window.LabModels || {})['riemann-surfaces'] = M;

  /* ---------------- shared layout ---------------- */
  function frame(ctx, caps) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null; st.g = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row is-wide', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, caps[0]);
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, caps[1]);
    st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    return st;
  }
  const FLOOR = -2.1, RMAX = 2.0;
  const heightOf = (kind, w, th) => (kind === 2 ? 0.16 * th : w[1]);     // Im w; for the logarithm Im w = theta, drawn at 0.16 scale

  /* ---------------- 1. square roots and logarithms ---------------- */
  const RANGES = [[-PI, 3 * PI], [-PI, 5 * PI], [-PI, 7 * PI]];
  D['branch-sheets'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The graph of Im w over the z-plane, for every branch at once. Walk the gold point round the loop on the floor: its lift climbs the surface, and if the loop goes round 0 it comes back on a different sheet. Drag the loop’s centre.', 'z 平面の上に、すべての分枝の Im w をまとめて描いたグラフ。床の上の輪に沿って金色の点を歩かせると、持ち上げた点は面をのぼり、輪が 0 を回ると別のシートに戻ってきます。輪の中心をドラッグしてください。'), T('The same continuation in the w-plane: where w starts, and where it ends after the loop.', '同じ解析接続を w 平面で見たもの。w の出発点と、輪を回ったあとの終点。')]);
      const kind = Math.round(v.func ?? 0), c = [v.cx, v.cy], R = v.R, turns = Math.round(v.turns ?? 1);
      const path = continueLoop(kind, c, R, turns);
      const wind = winding(c, R, turns);
      const w0 = path[0].w, w1 = path[path.length - 1].w;
      const sheetN = kind === 0 ? 2 : kind === 1 ? 3 : Infinity;
      const readout = () => {
        ctx.readout([
          { k: T('winding number round 0', '0 のまわりの回転数'), v: String(wind), tone: 'key' },
          { k: T('w at the start', '出発時の w'), v: `${fmt(w0[0], 3)} ${w0[1] < 0 ? '−' : '+'} ${fmt(Math.abs(w0[1]), 3)}i` },
          { k: T('w after the loop', '一周後の w'), v: `${fmt(w1[0], 3)} ${w1[1] < 0 ? '−' : '+'} ${fmt(Math.abs(w1[1]), 3)}i`, tone: wind ? 'warn' : 'good' },
          { k: T('change', '変化'), v: kind === 2 ? `+ ${fmt(2 * wind, 0)}πi` : (wind % sheetN === 0 ? T('none', 'なし') : `× exp(2πi·${wind}/${sheetN})`) },
        ], wind === 0 ? T('The loop does not go round the branch point 0, so the continued value comes back to where it started: the lift is a closed loop on one sheet.', '輪は分岐点 0 を回らないので、接続した値は元に戻ります。持ち上げた道は一枚のシートの上の閉じた輪です。')
          : kind === 2 ? T('Each turn round 0 adds 2πi: the logarithm has infinitely many sheets, stacked like a spiral staircase, and never comes back.', '0 を一回まわるごとに 2πi が加わります。対数は無限に多くのシートをもち、らせん階段のように積み重なって、元には戻りません。')
            : T(`Going round 0 multiplies the value by a ${sheetN === 2 ? 'square' : 'cube'} root of unity, so it lands on another sheet; after ${sheetN} turns it is back. The surface needs ${sheetN} sheets glued along a cut.`, `0 を回ると値は 1 の${sheetN === 2 ? '平方' : '立方'}根倍になり、別のシートに移ります。${sheetN} 回まわると元に戻ります。面は切れ目に沿って貼り合わせた ${sheetN} 枚のシートを必要とします。`));
      };
      const drawW = (k) => {
        if (!st.g || !st.g.svg.isConnected || st.gkey !== JSON.stringify(v)) {
          st.gkey = JSON.stringify(v);
          st.g2.replaceChildren(); st.leg.replaceChildren();
          const xr = kind === 2 ? [Math.log(Math.max(0.02, Math.hypot(...c) - R)) - 0.4, Math.log(Math.hypot(...c) + R) + 0.4] : [-1.75, 1.75];
          const yr = kind === 2 ? [-PI - 0.4, PI + TAU * Math.max(1, turns) + 0.4] : [-1.75, 1.75];
          st.g = L.fig(st.g2, { x: xr, y: yr, equal: kind !== 2, aspect: kind === 2 ? 1.25 : undefined, maxH: 360, xlabel: 'Re w', ylabel: 'Im w' });
          if (kind !== 2) for (let j = 0; j < sheetN; j++) { const a = (2 * j + 1) * PI / sheetN; st.g.seg([0, 0], [2 * Math.cos(a), 2 * Math.sin(a)], { c: 'grid', w: 1, dash: '3 4' }); }
          else for (let j = -1; j <= turns + 1; j++) st.g.hline(PI + TAU * j, { c: 'grid', w: 1, dash: '3 4' });
          st.g.line(path.map((p) => p.w), { c: 'c1', w: 2.4, layer: 'under' });
          st.g.dot(w0[0], w0[1], { c: 'ink', r: 5.5, layer: 'main' });
          st.g.dot(w1[0], w1[1], { c: 'c2', r: 7, hollow: true, layer: 'main' });
          L.legend(st.leg, [{ c: 'c1', label: T('the continued value w along the loop', '輪に沿って接続した値 w') }, { kind: 'dot', c: 'ink', label: T('start', '出発点') }, { kind: 'dot', c: 'c2', label: T('end of the loop', '輪の終点') }, { c: 'grid', dash: true, label: kind === 2 ? T('Im w = (2k + 1)π: edges of the sheets', 'Im w = (2k + 1)π：シートの境目') : T('images of the cut: edges of the sheets', '切れ目の像：シートの境目') }]);
          readout();
        }
        st.g.clear('over');
        const p = path[Math.min(path.length - 1, k)];
        st.g.dot(p.w[0], p.w[1], { c: 'hl', r: 6, layer: 'over' });
      };
      const drawAt = (u) => {
        const k = Math.round(Math.min(1, Math.max(0, u)) * (path.length - 1));
        if (!st.flat && st.S) {
          const p = path[k];
          const lift = (q) => { const th = wrapTheta(kind, q.theta); return [q.z[0], q.z[1], heightOf(kind, wOf(kind, Math.max(q.rho, 1e-9), th), th) + 0.02]; };
          st.trail.update(path.slice(0, k + 1).filter((_, i) => i % 3 === 0 || i === k).map(lift));
          st.dot.at(lift(p));
          st.base.at([p.z[0], p.z[1], FLOOR]);
          st.drop.update([[[p.z[0], p.z[1], FLOOR], lift(p)]]);
          st.S.invalidate();
        }
        drawW(k);
      };
      // the drawn surface covers RANGES[kind]; continuation beyond it is the same point for roots (periodic), so wrap
      const wrapTheta = (kd, th) => { if (kd === 2) return th; const per = TAU * (kd + 2), [lo] = RANGES[kd]; return lo + ((((th - lo) % per) + per) % per); };
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => { const dur = 2.6 * Math.max(1, st.turnsNow ?? 1); const u = (t % (dur + 0.8)) / dur; drawAt(u); }, { initialT: 2.6 * Math.max(1, turns) * 0.999, playLabel: T('Walk the loop', '輪を歩く') });
      }
      st.turnsNow = turns;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 500, camera: [4.6, -5.6, 3.4], target: [0, 0, kind === 2 ? 0.9 : -0.3], fov: 34,
        init(S) {
          st.flat = false; st.S = S;
          st.surf = S.surface(() => [0, 0, 0], { u: [0.02, RMAX], v: [0, 1], nu: 50, nv: 260, rough: 0.45, coat: 0.5, wire: true, wireEvery: 7, wireEveryV: 13, wireOpacity: 0.14, opacity: 0.94, colour: () => S.colour('c1') });
          S.floor({ size: 2.3, n: 12, z: FLOOR });
          S.lines([[[0, 0, FLOOR], [0, 0, 4.2]]], { c: 'ink', opacity: 0.45 });
          S.sphere([0, 0, FLOOR], 0.06, { c: 'ink' });
          S.label(T('branch point 0', '分岐点 0'), [0.08, 0, FLOOR + 0.05], { small: true });
          st.loop = S.tube([[0, 0, FLOOR], [0, 0, FLOOR + 0.01]], { c: 'c2', r: 0.018, closed: true });
          st.trail = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.035, glow: 0.3 });
          st.dot = S.sphere([0, 0, 0], 0.075, { c: 'hl', glow: 0.5 });
          st.base = S.sphere([0, 0, FLOOR], 0.05, { c: 'hl' });
          st.drop = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'hl', opacity: 0.55 });
          st.ctr = S.handle([c[0], c[1], FLOOR], { plane: [[0, 0, 1], [0, 0, FLOOR]], bounds: [-1.6, 1.6, -1.6, 1.6], r: 0.07, c: 'c2', onDrag: (q) => { ctx.set('cx', q.x, true); ctx.set('cy', q.y); return [q.x, q.y, FLOOR]; } });
          st.kind = null;
        },
        update(S) {
          if (st.kind !== kind) {
            st.kind = kind;
            const [lo, hi] = RANGES[kind];
            st.surf.update((u, w) => { const th = lo + (hi - lo) * w, ww = wOf(kind, u, th); return [u * Math.cos(th), u * Math.sin(th), heightOf(kind, ww, th)]; },
              (u, w) => { const th = lo + (hi - lo) * w, ww = wOf(kind, u, th); return kind === 2 ? S.cmap.seq((ww[0] + 2.2) / 3) : S.cmap.div(ww[0] / Math.pow(RMAX, 1 / (kind + 2))); });
          }
          st.loop.update(L.seq(97, (i) => [c[0] + R * Math.cos(TAU * i / 96), c[1] + R * Math.sin(TAU * i / 96), FLOOR + 0.005]));
          st.ctr.at([c[0], c[1], FLOOR]);
          st.anim?.redraw();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('3D graphics are not available here; the w-plane on the right shows the continuation.', 'ここでは 3D 表示を使えません。右の w 平面が接続を示します。')); st.anim?.redraw(); },
      });
      st.anim?.redraw();
    },
  };

  /* ---------------- 2. gluing sheets: branch points and genus ---------------- */
  const BOX = 2.0;
  const hComp = (w) => 1.1 * Math.tanh(0.45 * w[0]);
  function defaultPts(n) { return L.seq(n, (i) => [n === 1 ? 0 : -1.3 + 2.6 * i / (n - 1), 0.45 * Math.sin(2.1 * i + 0.4)]); }
  D['branch-genus'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('w² = (z − a₁)…(z − aₙ): the two values ±w drawn as two sheets over the z-plane (height Re w, compressed; colour Im w). They meet only at the branch points, which you can drag on the floor.', 'w² = (z − a₁)…(z − aₙ)：二つの値 ±w を z 平面の上の二枚のシートとして描いています（高さは Re w を圧縮したもの、色は Im w）。シートが出会うのは分岐点だけで、床の上でドラッグできます。'), T('The z-plane: branch points joined in pairs by cuts (with ∞ when n is odd). A loop swaps the sheets exactly when it encloses an odd number of branch points.', 'z 平面：分岐点を二つずつ切れ目で結んでいます（n が奇数のときは ∞ とも）。輪がシートを入れ替えるのは、奇数個の分岐点を囲むときに限ります。')]);
      const n = Math.round(v.n ?? 4);
      st.ptsByN ||= {};
      st.ptsByN[n] ||= defaultPts(n);
      const pts = st.ptsByN[n];
      const c = [v.cx, v.cy], R = v.R;
      const loopPath = L.seq(241, (i) => [c[0] + R * Math.cos(TAU * i / 240), c[1] + R * Math.sin(TAU * i / 240)]);
      const k = enclosed(pts, c, R), g = genusHyper(n), B = branchCount(n);
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const f = L.fig(st.g2, { x: [-BOX, BOX], y: [-BOX, BOX], equal: true, maxH: 360, xlabel: 'Re z', ylabel: 'Im z' });
        f.raster((x, y) => { const w = M.csqrt(poly(pts, [x, y])); return Math.atan2(w[1], w[0]) / PI; }, { cmap: 'div', res: 4 });
        const sorted = pts.map((p, i) => [p, i]).sort((a, b) => a[0][0] - b[0][0]);
        for (let i = 0; i + 1 < sorted.length; i += 2) f.seg(sorted[i][0], sorted[i + 1][0], { c: 'ink', w: 3 });
        if (n % 2) { const last = sorted[sorted.length - 1][0]; f.seg(last, [BOX + 1, last[1]], { c: 'ink', w: 3, dash: '6 4' }); }
        f.line(loopPath, { c: k % 2 ? 'c2' : 'c3', w: 2.2 });
        pts.forEach((p, i) => f.handle(p[0], p[1], { c: 'hl', label: `a${i + 1}`, bounds: [-BOX + 0.1, BOX - 0.1, -BOX + 0.1, BOX - 0.1], onDrag: (x, y) => { pts[i] = [x, y]; ctx.redraw(); } }));
        L.legend(st.leg, [{ c: 'ink', label: T('cuts: cross one and you change sheet', '切れ目：横切るとシートが変わる') }, { c: k % 2 ? 'c2' : 'c3', label: k % 2 ? T('loop: swaps the sheets', '輪：シートを入れ替える') : T('loop: comes back to the same sheet', '輪：同じシートに戻る') }, { kind: 'fill', c: 'pos', label: T('background: arg of the principal √p, which jumps along the cuts', '背景：主値 √p の偏角。切れ目で跳ぶ') }]);
        ctx.readout([
          { k: T('degree n', '次数 n'), v: String(n) },
          { k: T('branch points (with ∞ if n is odd)', '分岐点の数（n が奇数なら ∞ を含む）'), v: String(B) },
          { k: T('genus g = (B − 2)/2', '種数 g = (B − 2)/2'), v: String(g), tone: 'key' },
          { k: 'χ = 2 − 2g', v: String(2 - 2 * g) },
          { k: T('branch points inside the loop', '輪の内側の分岐点'), v: String(k), tone: k % 2 ? 'warn' : 'good' },
        ], T(`Two copies of the sphere, each slit along ${B / 2} cut${B > 2 ? 's' : ''}, glued crosswise along the slits: ${g === 0 ? 'a sphere again' : g === 1 ? 'a torus' : `a surface with ${g} holes`}. Riemann–Hurwitz: χ = 2·2 − B = ${4 - B}.`, `切れ目 ${B / 2} 本で切り開いた球面を二つ用意し、切れ目どうしを交差させて貼り合わせると、${g === 0 ? 'また球面' : g === 1 ? 'トーラス' : `穴が ${g} 個ある曲面`}になります。リーマン・フルヴィッツの公式：χ = 2·2 − B = ${4 - B}。`));
      };
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 500, camera: [4.4, -5.6, 4.6], target: [0, 0, -0.55], fov: 34,
        init(S) {
          st.flat = false; st.S = S;
          const THREE = S.THREE;
          st.geo = new THREE.BufferGeometry();
          st.mesh = new THREE.Mesh(st.geo, S.mat('c1', { vertexColors: true, rough: 0.45, coat: 0.5, opacity: 0.93 }));
          S.add(st.mesh);
          S.floor({ size: 2.2, n: 12, z: FLOOR });
          st.loop = S.tube([[0, 0, FLOOR], [0, 0, FLOOR + 0.01]], { c: 'c3', r: 0.016, closed: true });
          st.lift = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'hl', r: 0.03, glow: 0.3 });
          st.liftEnd = S.sphere([0, 0, 0], 0.07, { c: 'hl', glow: 0.5 });
          st.liftStart = S.sphere([0, 0, 0], 0.06, { c: 'ink' });
          st.posts = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'ink', opacity: 0.4 });
          st.handles = L.seq(6, (i) => S.handle([0, 0, -50], { plane: [[0, 0, 1], [0, 0, FLOOR]], bounds: [-BOX + 0.1, BOX - 0.1, -BOX + 0.1, BOX - 0.1], r: 0.065, onDrag: (q) => { const p = st.ptsByN[st.n]; if (p && p[i]) { p[i] = [q.x, q.y]; ctx.redraw(); } return [q.x, q.y, FLOOR]; } }));
        },
        update(S) {
          st.n = n;
          // values on a polar grid over the disc, continued ring by ring so the sheet labels are as continuous as possible
          const NR = 54, NT = 180, RD = 1.95, cnt = (NR + 1) * NT, W = new Array(cnt);
          const zAt = (i, j) => { const rr = 0.02 + (RD - 0.02) * i / NR, t = TAU * j / NT; return [rr * Math.cos(t), rr * Math.sin(t)]; };
          for (let i = 0; i <= NR; i++) for (let j = 0; j < NT; j++) {
            let w = M.csqrt(poly(pts, zAt(i, j)));
            const ref = j > 0 ? W[i * NT + j - 1] : i > 0 ? W[(i - 1) * NT] : null;
            if (ref && Math.hypot(w[0] - ref[0], w[1] - ref[1]) > Math.hypot(w[0] + ref[0], w[1] + ref[1])) w = [-w[0], -w[1]];
            W[i * NT + j] = w;
          }
          const pos = new Float32Array(2 * cnt * 3), col = new Float32Array(pos.length), idx = [];
          const off = cnt;
          for (let sh = 0; sh < 2; sh++) for (let i = 0; i <= NR; i++) for (let j = 0; j < NT; j++) {
            const id = i * NT + j, w = sh ? [-W[id][0], -W[id][1]] : W[id], q = (sh * off + id) * 3, z = zAt(i, j);
            pos[q] = z[0]; pos[q + 1] = z[1]; pos[q + 2] = hComp(w);
            const cc = S.cmap.div(Math.tanh(0.8 * w[1])); col[q] = cc.r; col[q + 1] = cc.g; col[q + 2] = cc.b;
          }
          const jump = (a, b) => { const p = W[a], q = W[b]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5 * (0.25 + Math.hypot(p[0], p[1]) + Math.hypot(q[0], q[1])); };
          for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) {
            const a = i * NT + j, b = i * NT + (j + 1) % NT, cI = (i + 1) * NT + (j + 1) % NT, d = (i + 1) * NT + j;
            for (const [x, y, zI] of [[a, b, cI], [a, cI, d]]) {
              if (jump(x, y) || jump(y, zI) || jump(x, zI)) continue;
              idx.push(x, y, zI, off + x, off + y, off + zI);
            }
          }
          st.geo.setAttribute('position', new S.THREE.BufferAttribute(pos, 3));
          st.geo.setAttribute('color', new S.THREE.BufferAttribute(col, 3));
          st.geo.setIndex(idx); st.geo.computeVertexNormals(); st.geo.computeBoundingSphere();
          st.loop.update(loopPath.filter((_, i) => i % 3 === 0).map((p) => [p[0], p[1], FLOOR + 0.005]));
          // lift the loop, starting on the sheet drawn first (sh = 0) at the nearest grid point
          const z0 = loopPath[0], r0 = Math.hypot(z0[0], z0[1]), t0 = Math.atan2(z0[1], z0[0]);
          const gi = Math.min(NR, Math.max(0, Math.round((r0 - 0.02) / (RD - 0.02) * NR))), gj = ((Math.round(t0 / TAU * NT) % NT) + NT) % NT;
          const ref = W[gi * NT + gj];
          let w0 = M.csqrt(poly(pts, loopPath[0])); if (ref && Math.hypot(w0[0] - ref[0], w0[1] - ref[1]) > Math.hypot(w0[0] + ref[0], w0[1] + ref[1])) w0 = [-w0[0], -w0[1]];
          const ws = continueSqrt(pts, loopPath, w0);
          const lifted = loopPath.map((p, i) => [p[0], p[1], hComp(ws[i]) + 0.03]);
          st.lift.update(lifted.filter((_, i) => i % 2 === 0)); st.liftStart.at(lifted[0]); st.liftEnd.at(lifted[lifted.length - 1]);
          st.posts.update(pts.map((p) => [[p[0], p[1], FLOOR], [p[0], p[1], 0]]));
          st.handles.forEach((h, i) => h.at(i < n ? [pts[i][0], pts[i][1], FLOOR] : [0, 0, -50]));
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('3D graphics are not available here; the z-plane on the right carries the construction.', 'ここでは 3D 表示を使えません。右の z 平面に作図があります。')); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };

  /* ---------------- 3. the Riemann sphere and Moebius maps ---------------- */
  const KINDS = [T('elliptic', '楕円型'), T('hyperbolic', '双曲型'), T('parabolic', '放物型'), T('loxodromic', '斜航型')];
  const fib = (n) => L.seq(n, (i) => { const z = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - z * z), a = i * PI * (3 - Math.sqrt(5)); return [r * Math.cos(a), r * Math.sin(a), z]; }).filter((p) => p[2] < 0.985);
  function orbitsStd(kind, amount) {
    // orbits of the flow in standard position, as polylines in the plane
    const out = [];
    if (kind === 0) for (const r of [0.15, 0.3, 0.5, 0.75, 1, 1.35, 1.9, 2.8, 4.5]) out.push(L.seq(97, (i) => [r * Math.cos(TAU * i / 96), r * Math.sin(TAU * i / 96)]));
    else if (kind === 1) for (let j = 0; j < 12; j++) { const a = TAU * j / 12; out.push(L.seq(81, (i) => { const r = Math.exp(-4 + 8 * i / 80); return [r * Math.cos(a), r * Math.sin(a)]; })); }
    else if (kind === 2) for (const y of [-3, -1.6, -0.9, -0.5, -0.2, 0, 0.2, 0.5, 0.9, 1.6, 3]) out.push(L.seq(81, (i) => { const x = -30 + 60 * i / 80; return [Math.sign(x) * x * x / 30, y]; }));
    else { const lg = [amount, amount * PI]; for (let j = 0; j < 8; j++) { const a = TAU * j / 8; out.push(L.seq(161, (i) => { const s = (-1 + 2 * i / 160) * 5 / Math.max(0.2, lg[0]); const r = Math.exp(lg[0] * s); return [r * Math.cos(a + lg[1] * s), r * Math.sin(a + lg[1] * s)]; })); } }
    return out;
  }
  D['riemann-sphere'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The Riemann sphere: every point of the plane, plus ∞ at the north pole, by projection from that pole. The dots flow under a one-parameter family of Möbius maps; drag the gold point and follow its projection line.', 'リーマン球面：北極からの射影で、平面のすべての点と北極の ∞ を表します。点は一径数のメビウス変換の族によって流れます。金色の点をドラッグし、射影の直線をたどってください。'), T('The same flow in the plane. Circles go to circles, and the fixed points decide the type.', '同じ流れを平面で見たもの。円は円に移り、固定点が型を決めます。')]);
      const kind = Math.round(v.kind ?? 1), amount = v.amount, tilt = rad(v.tilt);
      st.P ||= unstereo([0.6, 0.35]);
      const Mx = mobiusMatrix(kind, amount), tr2 = traceSq(Mx);
      const fps = fixedPoints(kind, tilt);
      const toPlane = (P) => (1 - P[2] < 1e-9 ? null : stereo(P));
      const orbits3 = orbitsStd(kind, amount).map((poly2) => poly2.map((z) => rotX(unstereo(z), tilt)));
      const dots0 = fib(220);
      const draw2d = (t) => {
        const gk = `${kind},${amount},${v.tilt},${st.P.join(',')}`;
        if (!st.g || !st.g.svg.isConnected || st.gkey !== gk) {
          st.gkey = gk;
          st.g2.replaceChildren(); st.leg.replaceChildren();
          st.g = L.fig(st.g2, { x: [-3, 3], y: [-3, 3], equal: true, maxH: 360, xlabel: 'Re z', ylabel: 'Im z' });
          st.g.circle(0, 0, 1, { c: 'muted', w: 1, dash: '4 4' });
          for (const o of orbits3) { const pl = o.map((P) => toPlane(P)); let seg = []; for (const q of pl) { if (!q || Math.hypot(...q) > 9) { if (seg.length > 1) st.g.line(seg, { c: 'c1', w: 1, op: 0.45, layer: 'under' }); seg = []; } else seg.push(q); } if (seg.length > 1) st.g.line(seg, { c: 'c1', w: 1, op: 0.45, layer: 'under' }); }
          fps.forEach((F) => { const q = toPlane(F); if (q && Math.hypot(...q) < 3) st.g.dot(q[0], q[1], { c: 'c2', r: 5.5, layer: 'main' }); });
          st.ph = st.g.handle(...toPlane(st.P).map((x) => L.clamp(x, -2.9, 2.9)), { c: 'hl', label: 'z', onDrag: (x, y) => { st.P = unstereo([x, y]); ctx.redraw(); } });
          L.legend(st.leg, [{ c: 'c1', label: T('orbits of the flow', '流れの軌道') }, { kind: 'dot', c: 'c2', label: T('fixed points (∞ is the north pole)', '固定点（∞ は北極）') }, { kind: 'dot', c: 'hl', label: T('z and its image f(z)', 'z とその像 f(z)') }, { c: 'muted', dash: true, label: T('unit circle = equator', '単位円 = 赤道') }]);
          const z = toPlane(st.P), fz = toPlane(flowSphere(kind, amount, tilt, st.P, 1));
          const fpTxt = fps.map((F) => { const q = toPlane(F); return q ? `${fmt(q[0], 2)} ${q[1] < 0 ? '−' : '+'} ${fmt(Math.abs(q[1]), 2)}i` : '∞'; }).join(T(' and ', ' と '));
          ctx.readout([
            { k: T('type', '型'), v: KINDS[classify(tr2)], tone: 'key' },
            { k: T('tr² of the normalised matrix', '正規化した行列の tr²'), v: Math.abs(tr2[1]) < 1e-9 ? fmt(tr2[0], 3) : `${fmt(tr2[0], 3)} ${tr2[1] < 0 ? '−' : '+'} ${fmt(Math.abs(tr2[1]), 3)}i` },
            { k: T('fixed points', '固定点'), v: fpTxt },
            { k: 'z', v: z ? `${fmt(z[0], 2)} ${z[1] < 0 ? '−' : '+'} ${fmt(Math.abs(z[1]), 2)}i` : '∞' },
            { k: 'f(z)', v: fz ? `${fmt(fz[0], 2)} ${fz[1] < 0 ? '−' : '+'} ${fmt(Math.abs(fz[1]), 2)}i` : '∞' },
          ], [T('Elliptic: tr² is real and below 4. The sphere simply rotates about the axis through the two fixed points.', '楕円型：tr² は 4 未満の実数です。球面は二つの固定点を通る軸のまわりに回転するだけです。'), T('Hyperbolic: tr² is real and above 4. Everything streams out of one fixed point and into the other along circles through both.', '双曲型：tr² は 4 より大きい実数です。すべてが一方の固定点から湧き出し、両方を通る円に沿ってもう一方へ流れ込みます。'), T('Parabolic: tr² = 4 exactly and the two fixed points have merged. The orbits are circles all tangent at that one point: a translation of the plane, seen from ∞.', '放物型：tr² はちょうど 4 で、二つの固定点が一つに合体しています。軌道はすべてその一点で接する円で、∞ から見た平面の平行移動です。'), T('Loxodromic: tr² is not real. Points spiral from one fixed point to the other, like a ship holding a constant compass bearing.', '斜航型：tr² は実数ではありません。点は一方の固定点からもう一方へ、一定の方位を保つ船のようにらせんを描いて進みます。')][classify(tr2)]);
        }
        st.g.clear('over');
        const pts = dots0.map((P) => toPlane(flowSphere(kind, amount, tilt, P, t))).filter((q) => q && Math.abs(q[0]) < 3 && Math.abs(q[1]) < 3);
        for (const q of pts) st.g.dot(q[0], q[1], { c: 'c4', r: 1.8, layer: 'over' });
        const fz = toPlane(flowSphere(kind, amount, tilt, st.P, 1));
        if (fz && Math.abs(fz[0]) < 3 && Math.abs(fz[1]) < 3) st.g.dot(fz[0], fz[1], { c: 'hl', r: 5, hollow: true, layer: 'over' });
      };
      const tOf = (time) => { const u = (time % 4) / 4; return -1 + 2 * u; };
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, time) => {
          const t = tOf(time); st.t = t;
          if (!st.flat && st.S) { st.dots.update(dots0.map((P) => flowSphere(st.kind, st.amount, st.tilt, P, t).map((x) => x * 1.012))); st.S.invalidate(); }
          if (!st.lastDraw || time - st.lastDraw > 0.06 || dt === 0) { st.lastDraw = time; draw2d(t); }
        }, { initialT: 2.6, playLabel: T('Play the flow', '流れを再生') });
      }
      st.kind = kind; st.amount = amount; st.tilt = tilt;
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.8, maxH: 500, camera: [2.5, -2.9, 1.8], target: [0, 0, 0.05], fov: 36,
        init(S) {
          st.flat = false; st.S = S;
          S.surface((u, w) => [Math.sin(u) * Math.cos(w), Math.sin(u) * Math.sin(w), Math.cos(u)], { u: [0, PI], v: [0, TAU], nu: 64, nv: 128, c: 'plate', opacity: 0.55, rough: 0.15, coat: 1, wire: true, wireEvery: 8, wireEveryV: 16, wireOpacity: 0.1 });
          S.floor({ size: 3, n: 12, z: 0 });
          st.orb = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'c1', opacity: 0.55 });
          st.dots = S.points(dots0, { c: 'c4', r: 0.022, max: dots0.length, coat: 0.8 });
          st.fp = [S.sphere([0, 0, 0], 0.06, { c: 'c2' }), S.sphere([0, 0, 0], 0.06, { c: 'c2' })];
          S.sphere([0, 0, 1], 0.045, { c: 'ink' }); S.label('∞', [0.05, 0, 1.12], { math: true });
          st.proj = S.lines([[[0, 0, 0], [0, 0, 0]]], { c: 'hl', opacity: 0.8 });
          st.zdot = S.sphere([0, 0, 0], 0.045, { c: 'hl' });
          st.img = S.sphere([0, 0, 0], 0.05, { c: 'hl', opacity: 0.6 });
          st.h = S.handle(st.P, { sphere: [[0, 0, 0], 1], r: 0.065, onDrag: (q) => { const l = Math.hypot(q.x, q.y, q.z); st.P = [q.x / l, q.y / l, Math.min(0.995, q.z / l)]; ctx.redraw(); return st.P; } });
          st.zl = S.label('z', [0, 0, 0], { math: true }); st.fl = S.label('f(z)', [0, 0, 0], { math: true });
        },
        update(S) {
          const segs = [];
          for (const o of orbits3) for (let i = 0; i + 1 < o.length; i++) if (Math.hypot(o[i][0] - o[i + 1][0], o[i][1] - o[i + 1][1], o[i][2] - o[i + 1][2]) < 0.5) segs.push([o[i].map((x) => x * 1.004), o[i + 1].map((x) => x * 1.004)]);
          st.orb.update(segs);
          st.fp.forEach((s, i) => { s.visible = i < fps.length; if (i < fps.length) s.at(fps[i].map((x) => x * 1.01)); });
          const z = toPlane(st.P), Q = flowSphere(kind, amount, tilt, st.P, 1);
          const zp = z && Math.hypot(...z) < 6 ? [z[0], z[1], 0] : null;
          st.proj.update(zp ? [[[0, 0, 1], zp]] : [[[0, 0, 1], st.P]]);
          if (zp) st.zdot.at(zp); st.zdot.visible = !!zp;
          st.h.at(st.P); st.img.at(Q.map((x) => x * 1.01));
          st.zl.set(zp || st.P); st.fl.set(Q.map((x) => x * 1.08));
          S.invalidate();
          st.anim?.redraw();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('3D graphics are not available here; the plane on the right shows the same flow.', 'ここでは 3D 表示を使えません。右の平面が同じ流れを示します。')); st.anim?.redraw(); },
      });
      st.anim?.redraw();
    },
  };
})();
