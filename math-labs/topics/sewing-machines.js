'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI, TAU = 2 * PI, clamp = (x, a, b) => Math.min(b, Math.max(a, x)), rad = (d) => (d * PI) / 180, mod = (x, m) => ((x % m) + m) % m;

  /* ---------------- models (no DOM) ----------------
   * One turn of the main shaft makes one stitch; angles in degrees, 0 = needle at the top.
   * Needle tip height (mm above the cloth): 2 + 12 cos(theta). Take-up lever highest at 70, lowest at 250.
   * The rotary hook turns twice per stitch and its point passes the needle at 205, just after the needle has
   * started to rise and thrown a loop. It carries the loop round the bobbin case over the next 170 degrees of the
   * shaft; the take-up then pulls it up through the cloth. The feed moves the cloth while the needle is clear.
   * Needle bar as a slider-crank: x = r cos(t) + sqrt(l^2 - r^2 sin^2(t)).
   * Knot position in the cloth, as a fraction of its thickness from the top: Tb / (Tu + Tb) weighted.
   */
  const needleTip = (th) => 2 + 12 * Math.cos(rad(th));
  const takeUp = (th) => 42 + 9 * Math.cos(rad(th - 70));
  const hookAngle = (th) => 90 - 2 * (th - 205);                                                       // degrees, in the plane of the hook
  const loopPhase = (th) => { const q = mod(th - 205, 360); return q < 170 ? { stage: 1, f: q / 170 } : q < 235 ? { stage: 2, f: 1 - (q - 170) / 65 } : { stage: 0, f: 0 }; };
  const feedProgress = (th) => { const q = mod(th - 290, 360); if (q < 140) { const u = q / 140; return u * u * (3 - 2 * u); } return q < 165 ? 1 : 0; };
  const needleInCloth = (th) => needleTip(th) < 0;
  function sliderCrank(thDeg, r, l) { const t = rad(thDeg), s = Math.sin(t), c = Math.cos(t), root = Math.sqrt(l * l - r * r * s * s); return { x: r * c + root - l, v: -r * s - (r * r * s * c) / root, a: -r * c - (r * r * (c * c - s * s)) / root - (r ** 4 * s * s * c * c) / root ** 3 }; }   // per radian, per radian^2
  const needlePeak = (spm, strokeMm, rodMm = 45) => { const w = (spm * TAU) / 60, r = strokeMm / 2000, l = rodMm / 1000; let vm = 0, am = 0; for (let d = 0; d < 360; d += 1) { const q = sliderCrank(d, r, l); vm = Math.max(vm, Math.abs(q.v * w)); am = Math.max(am, Math.abs(q.a * w * w)); } return { v: vm, a: am, w }; };
  const knotDepth = (Tu, Tb) => clamp(0.5 + 1.5 * ((Tb - Tu) / (Tb + Tu)), -0.15, 1.15);                // 0 = top surface, 1 = underside
  const threadUse = (Ls, t, depth) => { const d = clamp(depth, 0, 1); return { top: Ls + 2 * t * d, bob: Ls + 2 * t * (1 - d) }; };
  const eyePasses = (loopMm, Ls, t, depth) => (2 * loopMm) / threadUse(Ls, t, depth).top;
  const M = { needleTip, takeUp, hookAngle, loopPhase, feedProgress, needleInCloth, sliderCrank, needlePeak, knotDepth, threadUse, eyePasses };
  (window.LabModels = window.LabModels || {})['sewing-machines'] = M;

  /* ================= 1. the lockstitch (3D) ================= */
  const SL = 0.45, HC = [0, 0.14, -1.25], HR = 0.88;
  function buildSewing(S) {
    const TH = S.THREE, g = new TH.Group();                                                           // 1 unit = 10 mm; cloth moves toward -x
    const steel = S.mat('#d4d8dd', { metal: 1, rough: 0.2 }), dark = S.mat('#55595f', { metal: 0.9, rough: 0.45 }), plateM = S.mat('#c9cdd3', { metal: 1, rough: 0.3, opacity: 0.45 }), clothA = S.mat('#e8dcc2', { rough: 0.95, coat: 0 }), clothB = S.mat('#c9d6c3', { rough: 0.95, coat: 0 }), bronze = S.mat('#b58a4a', { metal: 1, rough: 0.35, opacity: 0.55 }), spoolM = S.mat('#2f5fb0', { rough: 0.8 });
    const box = (w, d, h, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, d, h), mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    box(9, 1.9, 0.06, -1.2, 1.0, 0.03, clothB); box(9, 1.9, 0.06, -1.2, 1.0, 0.09, clothA); box(5, 2.2, 0.08, 0, 1.1, -0.05, plateM).castShadow = false;
    const needle = new TH.Group(); g.add(needle); { const sh = new TH.Mesh(new TH.CylinderGeometry(0.045, 0.045, 3.0, 12).rotateX(PI / 2), steel); sh.position.z = 1.7; const pt = new TH.Mesh(new TH.ConeGeometry(0.045, 0.22, 12).rotateX(-PI / 2), steel); pt.position.z = 0.11; const bar = new TH.Mesh(new TH.CylinderGeometry(0.13, 0.13, 3.2, 16).rotateX(PI / 2), dark); bar.position.z = 4.7; const eye = new TH.Mesh(new TH.TorusGeometry(0.05, 0.015, 6, 14).rotateX(PI / 2), dark); eye.position.set(0, -0.05, 0.3); needle.add(sh, pt, bar, eye); }
    { const foot = box(1.2, 0.5, 0.06, 0.25, 0.42, 0.16, steel); const fb = new TH.Mesh(new TH.CylinderGeometry(0.1, 0.1, 3.2, 12).rotateX(PI / 2), dark); fb.position.set(0.6, 0.55, 1.8); g.add(fb); }
    const hook = new TH.Group(); hook.position.set(...HC); g.add(hook); { const ring = new TH.Mesh(new TH.TorusGeometry(HR, 0.06, 10, 60, PI * 1.72).rotateX(PI / 2), steel); ring.castShadow = true; hook.add(ring); const tip = new TH.Mesh(new TH.ConeGeometry(0.075, 0.45, 10).rotateX(-PI / 2), steel); tip.position.set(HR, 0, -0.2); hook.add(tip); const back = new TH.Mesh(new TH.CylinderGeometry(0.2, 0.2, 0.9, 16), dark); back.position.y = 0.75; hook.add(back); const disc = new TH.Mesh(new TH.CylinderGeometry(HR, HR, 0.05, 40), dark); disc.position.y = 0.33; hook.add(disc); }
    { const cs = new TH.Mesh(new TH.CylinderGeometry(0.66, 0.66, 0.36, 36), bronze); cs.position.set(HC[0], HC[1] + 0.02, HC[2]); g.add(cs); const bb = new TH.Mesh(new TH.CylinderGeometry(0.5, 0.5, 0.26, 30), spoolM); bb.position.set(HC[0], HC[1] + 0.02, HC[2]); g.add(bb); }
    const lever = new TH.Mesh(new TH.BoxGeometry(1.5, 0.08, 0.1), dark); g.add(lever);
    { const sp = new TH.Mesh(new TH.CylinderGeometry(0.4, 0.4, 0.9, 24).rotateX(PI / 2), S.mat('#b8432a', { rough: 0.8 })); sp.position.set(-2.4, 0.9, 6.2); g.add(sp); const td = new TH.Mesh(new TH.CylinderGeometry(0.22, 0.22, 0.1, 20), steel); td.position.set(-0.9, -0.2, 4.4); g.add(td); }
    const top = S.lines([], { c: 'c2', opacity: 1, w: 2.6 }), bob = S.lines([], { c: 'c1', opacity: 1, w: 2.6 });
    S.add(g);
    const poly = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
    const set = (th) => { const zt = needleTip(th) / 10, zu = takeUp(th) / 10, ha = rad(hookAngle(th)), lp = loopPhase(th), fp = feedProgress(th), inC = needleInCloth(th), xs = -SL * fp;
      needle.position.z = zt; hook.rotation.y = -ha; lever.position.set(-0.35, -0.2, zu + 0.0); lever.rotation.y = -0.5 * Math.cos(rad(th - 70)); const eye = [0, -0.05, zt + 0.3], tu = [0.4, -0.2, zu];
      const a = [[-2.4, 0.9, 5.8], [-0.9, -0.2, 4.4], [-0.3, -0.2, 3.0], tu, [0, -0.08, zt + 3.0], eye];
      if (inC) { a.push([0, 0, 0.12]); } else a.push([xs, 0.02, 0.125]);
      let segs = poly(a); if (!inC) segs = poly(a.slice(0, 6)).concat([[eye, [xs, 0.02, 0.125]]]); else segs = poly(a.slice(0, 5)).concat([[[0, -0.08, zt + 3.0], [0, -0.05, 0.13]]]);
      const H = [0, 0.14, -0.02];
      if (lp.stage === 1) { const pts = [H], n = 26, span = 2 * mod(th - 205, 360); for (let i = 0; i <= n; i++) { const an = rad(90 - (span * i) / n); pts.push([HC[0] + (HR + 0.06) * Math.cos(an), 0.14, HC[2] + (HR + 0.06) * Math.sin(an)]); } pts.push(H); segs = segs.concat(poly(pts)); if (inC) segs.push([[0, 0, 0.12], eye]); }
      else if (lp.stage === 2) { const pts = [], n = 28, h = 2.2 * lp.f, w = 1.0 * Math.sqrt(lp.f); for (let i = 0; i <= n; i++) { const an = (i / n) * TAU; pts.push([w * Math.sin(an) * 0.9, 0.14, -0.02 - (h / 2) * (1 - Math.cos(an))]); } segs = segs.concat(poly(pts)); }
      else if (inC) segs.push([[0, 0, 0.12], eye]);
      for (let k = 0; k < 14; k++) { const x0 = xs - k * SL, x1 = x0 - SL; if (x1 < -5.6) break; segs.push([[x0, 0.02, 0.125], [x1, 0.02, 0.125]]); }
      top.update(segs);
      const b = [[[HC[0], 0.16, HC[2] + 0.5], [0, 0.1, -0.1]], [[0, 0.1, -0.1], [xs, 0.02, -0.005]]]; for (let k = 0; k < 14; k++) { const x0 = xs - k * SL, x1 = x0 - SL; if (x1 < -5.6) break; b.push([[x0, 0.02, -0.005], [x1, 0.02, -0.005]], [[x0, 0.02, -0.005], [x0, 0.02, 0.06]]); }
      bob.update(b); };
    return { set };
  }
  D['lockstitch-hook'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      if (!st.frame || !st.frame.isConnected) { ctx.host.replaceChildren(); st.frame = L.h('div', '', ctx.host); const row = L.h('div', 'lab-row is-wide', st.frame); st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row); st.cap1 = L.h('p', 'lab-cap', st.c1); st.v3 = L.h('div', '', st.c1); st.cap2 = L.h('p', 'lab-cap', st.c2); st.g2 = L.h('div', '', st.c2); st.leg = L.h('div', '', st.frame); }
      const th = v.th, lp = loopPhase(th); st.p = v; st.th = th;
      const stage = lp.stage === 1 ? T('the hook is carrying the loop round the bobbin', '釜が輪を運んでボビンの周りを回している') : lp.stage === 2 ? T('the take-up lever is pulling the loop tight', '天びんが輪を引き締めている') : needleInCloth(th) ? T('the needle is carrying thread down through the cloth', '針が糸を布の下へ運んでいる') : T('the cloth is being fed on', '布が送られている');
      L.setText(st.cap1, T(tx`The stitch-forming parts of a sewing machine, seen from in front and below, with the bed cut away. The needle carries the upper thread (red) down through the cloth. As it starts back up, the thread bulges into a loop behind it, and the point of the turning hook passes through that loop and drags it right round a case holding the lower thread (blue) on its bobbin. The loop slips off, the lever above pulls it up tight, and the upper thread is left hooked round the lower one inside the cloth.`, tx`ミシンの縫い目を作る部分を、ベッドを切り取って、手前の下から見た図です。針は、上糸（赤）を布の下へ運びます。針が上がり始めると、糸は針の後ろで膨らんで輪になります。回転する釜の剣先がその輪をくぐり、ボビンに巻いた下糸（青）を収めたケースの周りに、輪をぐるりと引き回します。輪が外れると、上の天びんがそれを引き締め、上糸は、布の中で下糸に引っ掛かった状態で残ります。`));
      L.setText(st.cap2, T(tx`Timing through one turn of the main shaft. The needle (red) goes down and up once. The hook turns twice, and its point meets the needle at \(205\)°, when the needle has risen about 1 mm from the bottom. The take-up lever (blue) gives out thread while the loop grows and takes it back as the loop is cast off. The cloth is fed (green) only while the needle is out of it. Drag the gold point.`, tx`主軸 1 回転の間のタイミングです。針（赤）は 1 回上下します。釜は 2 回転し、剣先は、針が最下点から約 1 mm 上がった \(205\)° で針と出会います。天びん（青）は、輪が大きくなる間は糸を繰り出し、輪が外れると糸を引き戻します。布が送られる（緑）のは、針が布から抜けている間だけです。金色の点をドラッグしてください。`));
      st.g2.replaceChildren();
      const g = L.fig(st.g2, { x: [0, 360], y: [-12, 56], aspect: 0.8, maxH: 400, xlabel: T('main shaft angle (degrees)', '主軸の角度（度）'), ylabel: T('height above the cloth (mm)', '布からの高さ（mm）'), ticksX: [0, 90, 180, 270, 360].map((q) => [q, String(q)]) });
      g.rect(205, -12, 170 - 15, 68, { c: 'c2', fill: 'c2', fo: 0.07, nostroke: true, layer: 'under' }); g.hline(0, { c: 'muted' }); g.vline(205, { c: 'muted', dash: '3 3' });
      g.line(L.sample(0, 360, 120, (q) => needleTip(q)), { c: 'c2', w: 2.6 }); g.line(L.sample(0, 360, 120, (q) => takeUp(q)), { c: 'c1', w: 2.2 }); g.line(L.sample(0, 360, 180, (q) => -10 + 6 * feedProgress(q)), { c: 'c3', w: 2.2 });
      g.handle(th, needleTip(th), { c: 'hl', axis: 'x', bounds: [0, 359, -12, 56], label: T('shaft angle', '主軸の角度'), onDrag: (x) => ctx.set('th', clamp(Math.round(x / 5) * 5, 0, 355)) });
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c2', label: T('needle point; loop on the hook', '針先、釜に掛かった輪') }, { c: 'c1', label: T('take-up lever', '天びん') }, { c: 'c3', label: T('cloth feed', '布の送り') }]);
      ctx.readout([
        { k: T('now', 'いま'), v: stage, tone: 'key' },
        { k: T('needle point', '針先'), v: tx`\(${fmt(needleTip(th), 1)}\ \mathrm{mm}\ \text{${T(needleTip(th) < 0 ? 'below the cloth' : 'above the cloth', needleTip(th) < 0 ? '布の下' : '布の上')}}\)` },
        { k: T('hook has turned, since it took the loop', '輪を取ってからの釜の回転'), v: lp.stage === 1 ? tx`\(${fmt(2 * mod(th - 205, 360), 0)}^\circ\)` : T('free', '輪なし') },
        { k: T('take-up lever', '天びん'), v: tx`\(${fmt(takeUp(th), 0)}\ \mathrm{mm}\)` },
        { k: T('cloth fed, of one stitch', '布の送り（1 針に対する割合）'), v: tx`\(${fmt(100 * feedProgress(th), 0)}\ \%\)` },
      ], T('The trick is that the bobbin case is not fixed to anything: it floats in the hook, held from turning by a finger, so a loop of thread can pass all the way round it. A needle with its eye at the point makes that possible.', '工夫は、ボビンケースがどこにも固定されていないことにあります。ケースは釜の中に浮いていて、回り止めの突起で回転だけが止められているので、糸の輪がその周りを完全に一周できます。先端に穴のある針が、これを可能にしています。'));
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 1.15 : 1.05, maxH: 640, camera: [4.5, -15.5, 1], target: [-0.7, 0.3, 2.1], fov: 30,
        label: T('3D needle, rotary hook and bobbin forming a lockstitch. Drag to rotate.', '本縫いを作る針、回転釜、ボビンの 3D 表示。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.sw = buildSewing(S); st.run = st.th; st.sw.set(st.th);
          S.label(T('needle', '針'), [0.75, -0.3, 2.3], { small: true }); S.label(T('hook', '釜'), [1.6, 0, -1.3], { small: true }); S.label(T('bobbin', 'ボビン'), [-1.5, 0, -1.4], { small: true }); S.label(T('take-up lever', '天びん'), [1.9, -0.2, 4.4], { small: true }); S.label(T('cloth', '布'), [-4.6, 0, 0.5], { small: true });
          S.animate((dt) => { if (S.reduced() || !(st.p.run > 0)) return false; st.run = mod(st.run + Math.min(0.05, dt || 0.016) * 55, 360); st.sw.set(st.run); return true; });
        },
        update(S) { st.run = st.th; st.sw.set(st.th); S.invalidate(); },
        fallback() { st.flat = true; st.v3.replaceChildren(); const f2 = L.fig(st.v3, { x: [-4, 4], y: [-2.6, 3.2], equal: true, maxH: 320, axes: false, grid: false }); f2.seg([-4, 0], [4, 0], { c: 'ink', w: 3 }); f2.seg([0, needleTip(th) / 10], [0, needleTip(th) / 10 + 3], { c: 'ink', w: 2 }); f2.circle(0, -1.25, 0.88, { c: 'ink', fill: 'none', w: 2 }); f2.circle(0, -1.25, 0.5, { c: 'c1', fill: 'c1', fo: 0.5 }); },
      });
    },
  };

  /* ================= 2. where the threads lock ================= */
  D['stitch-tension'] = {
    render(ctx, v) {
      const dp = knotDepth(v.tu, v.tb), use = threadUse(v.ls, v.t, dp), n = 6;
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`A seam cut lengthways, \(${fmt(v.t, 1)}\) mm thick, with a stitch every \(${fmt(v.ls, 1)}\) mm. At each hole the upper thread (red) dips in, loops round the lower thread (blue) and comes back out. The two threads pull against each other, and the crossing settles where their pulls balance. With equal tension it lies hidden in the middle of the cloth. Drag the gold point up or down to change the balance.`, tx`縫い目を縦に切った断面で、厚さは \(${fmt(v.t, 1)}\) mm、\(${fmt(v.ls, 1)}\) mm ごとに 1 針です。それぞれの穴で、上糸（赤）が入り込み、下糸（青）に引っ掛かって、再び出てきます。二本の糸は互いに引き合い、交わる点は、引く力がつり合うところに落ち着きます。張力が等しければ、布の中央に隠れます。金色の点を上下にドラッグして、つり合いを変えてください。`));
      const W = n * v.ls, a = L.fig(c1, { x: [-v.ls * 0.5, W + v.ls * 0.5], y: [-v.t * 1.6, v.t * 0.9], aspect: 0.5, maxH: 300, axes: false, grid: false });
      a.rect(-v.ls * 0.5, -v.t, W + v.ls, v.t / 2, { c: 'muted', fill: 'c3', fo: 0.18, w: 0.8 }); a.rect(-v.ls * 0.5, -v.t / 2, W + v.ls, v.t / 2, { c: 'muted', fill: 'c3', fo: 0.3, w: 0.8 });
      const zk = -v.t * dp, up = [], lo = []; for (let k = 0; k <= n; k++) { const x = k * v.ls; up.push([x - v.ls * 0.06, Math.max(0, zk) + 0.0], [x, zk], [x + v.ls * 0.06, Math.max(0, zk)]); lo.push([x - v.ls * 0.06, Math.min(-v.t, zk)], [x, zk], [x + v.ls * 0.06, Math.min(-v.t, zk)]); }
      a.line(up.map((q) => [q[0], Math.max(q[1], zk)]), { c: 'c2', w: 2.6 }); a.line(lo, { c: 'c1', w: 2.6 }); for (let k = 0; k <= n; k++) a.dot(k * v.ls, zk, { c: 'ink', r: 3 });
      a.handle(3 * v.ls, zk, { c: 'hl', axis: 'y', bounds: [0, W, -v.t * 1.15, v.t * 0.15], label: T('where the threads lock', '糸が交わる位置'), onDrag: (x, y) => { const want = clamp(-y / v.t, -0.15, 1.15), r = (want - 0.5) / 1.5, tb = v.tb, tu = clamp((tb * (1 - r)) / (1 + r), 0.2, 3); ctx.set('tu', Math.round(tu * 20) / 20); } });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Thread used in each metre of seam against the length of the stitch, for this thickness of cloth. Each stitch uses one stitch length along the surface plus the trip down to the crossing and back. Short stitches in thick cloth spend most of their thread going in and out. The two threads share the total according to where the crossing lies.`, tx`この厚さの布で、縫い目 1 m あたりに使う糸の長さを、1 針の長さに対して描いています。1 針ごとに、表面に沿った 1 針分の長さと、交わる点まで下りて戻る分を使います。厚い布を細かく縫うと、糸のほとんどが出入りに使われます。二本の糸は、交わる点の位置に応じて、合計を分け合います。`));
      const b = L.fig(c2, { x: [1, 6], y: [1, 5], aspect: 0.6, maxH: 300, xlabel: T('stitch length (mm)', '1 針の長さ（mm）'), ylabel: T('thread per metre of seam (m)', '縫い目 1 m あたりの糸（m）') });
      b.line(L.sample(1, 6, 60, (q) => Math.min(5, threadUse(q, v.t, dp).top / q)), { c: 'c2', w: 2.6 }); b.line(L.sample(1, 6, 60, (q) => Math.min(5, threadUse(q, v.t, dp).bob / q)), { c: 'c1', w: 2.6 }); b.dot(v.ls, Math.min(5, use.top / v.ls), { c: 'hl', r: 6 });
      L.legend(ctx.host, [{ c: 'c2', label: T('upper thread', '上糸') }, { c: 'c1', label: T('lower thread', '下糸') }, { c: 'c3', label: T('two layers of cloth', '二枚の布') }]);
      ctx.readout([
        { k: T('threads lock at', '糸が交わる位置'), v: dp <= 0.02 ? T('on the top surface', '上の表面') : dp >= 0.98 ? T('on the underside', '裏側の表面') : tx`\(${fmt(dp * 100, 0)}\ \%\ \text{${T('of the way down', '（上からの深さ）')}}\)`, tone: dp < 0.2 || dp > 0.8 ? 'warn' : 'good' },
        { k: T('upper thread per stitch', '1 針あたりの上糸'), v: tx`\(${fmt(use.top, 2)}\ \mathrm{mm}\)` },
        { k: T('lower thread per stitch', '1 針あたりの下糸'), v: tx`\(${fmt(use.bob, 2)}\ \mathrm{mm}\)` },
        { k: T('thread in a metre of seam', '縫い目 1 m の糸'), v: tx`\(${fmt((use.top + use.bob) / v.ls, 2)}\ \mathrm{m}\)`, tone: 'key' },
        { k: T('stitches in a metre', '1 m あたりの針数'), v: tx`\(${fmt(1000 / v.ls, 0)}\)` },
      ], T(dp < 0.2 ? 'The upper thread is too tight: it lies straight along the top and drags the lower thread up into view.' : dp > 0.8 ? 'The upper thread is too slack: it is pulled through to the underside, where it shows as loops.' : 'Balanced. Each surface shows only its own thread, and a pull on the seam is shared by both.', dp < 0.2 ? '上糸が強すぎます。上糸は表面にまっすぐ横たわり、下糸を見える位置まで引き上げます。' : dp > 0.8 ? '上糸が弱すぎます。上糸は裏側まで引き出され、輪になって見えます。' : 'つり合っています。それぞれの面には、その面の糸だけが見え、縫い目を引く力は両方の糸が分け合います。'));
    },
  };

  /* ================= 3. speed ================= */
  D['needle-speed'] = {
    render(ctx, v) {
      const pk = needlePeak(v.spm, v.stroke), r = v.stroke / 2, l = 45, seam = (v.spm * v.ls) / 1000, passes = eyePasses(60, v.ls, 1, 0.5);
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.setText(L.h('p', 'lab-cap', c1), T(tx`Speed of the needle through one stitch, at \(${fmt(v.spm, 0)}\) stitches a minute with a stroke of \(${fmt(v.stroke, 0)}\) mm. The needle bar is driven by a crank and a short rod, so it stops at the top and the bottom and is fastest in between, as it passes through the cloth. Drag the gold point.`, tx`毎分 \(${fmt(v.spm, 0)}\) 針、行程 \(${fmt(v.stroke, 0)}\) mm のときの、1 針の間の針の速さです。針棒は、クランクと短い棒で動かされるので、上端と下端で止まり、その間、布を通るときに最も速くなります。金色の点をドラッグしてください。`));
      const a = L.fig(c1, { x: [0, 360], y: [-pk.v * 1.2, pk.v * 1.2], aspect: 0.7, maxH: 350, xlabel: T('main shaft angle (degrees)', '主軸の角度（度）'), ylabel: T('needle speed (m/s)', '針の速さ（m/s）'), ticksX: [0, 90, 180, 270, 360].map((q) => [q, String(q)]) });
      a.hline(0, { c: 'muted' }); a.line(L.sample(0, 360, 180, (q) => (sliderCrank(q, r / 1000, l / 1000).v * pk.w)), { c: 'c1', w: 2.8 });
      L.setText(L.h('p', 'lab-cap', c2), T(tx`Greatest acceleration of the needle bar against the stitching rate, in multiples of gravity, for this stroke (blue) and for strokes 6 mm shorter and longer. It rises with the square of the rate. A domestic machine runs at about 800 stitches a minute and an industrial one at 5000, where every moving part must be light, balanced and oiled.`, tx`針棒の最大の加速度を、毎分の針数に対して、重力の倍数で描いています。青はこの行程、灰色は 6 mm 短い行程と長い行程です。加速度は、針数の 2 乗で増えます。家庭用のミシンは毎分約 800 針、工業用は 5000 針で動き、後者では、動く部品はすべて、軽く、つり合いが取れ、油が差されていなければなりません。`));
      const b = L.fig(c2, { x: [0, 6000], y: [0, 600], aspect: 0.7, maxH: 350, xlabel: T('stitches a minute', '毎分の針数'), ylabel: T('peak acceleration (× gravity)', '最大加速度（重力の倍数）') });
      [v.stroke - 6, v.stroke + 6].forEach((s) => b.line(L.sample(100, 6000, 60, (q) => Math.min(600, needlePeak(q, s).a / 9.81)), { c: 'muted', w: 1.3 })); b.line(L.sample(100, 6000, 60, (q) => Math.min(600, needlePeak(q, v.stroke).a / 9.81)), { c: 'c1', w: 2.8 });
      b.handle(v.spm, Math.min(600, pk.a / 9.81), { c: 'hl', axis: 'x', bounds: [100, 6000, 0, 600], label: T('stitches a minute', '毎分の針数'), onDrag: (x) => ctx.set('spm', clamp(Math.round(x / 100) * 100, 100, 6000)) });
      L.legend(ctx.host, [{ c: 'c1', label: T('this stroke', 'この行程') }, { c: 'muted', label: T('shorter and longer strokes', '短い行程と長い行程') }]);
      ctx.readout([
        { k: T('stitches a second', '毎秒の針数'), v: tx`\(${fmt(v.spm / 60, 1)}\)` },
        { k: T('fastest needle speed', '針の最大の速さ'), v: tx`\(${fmt(pk.v, 2)}\ \mathrm{m/s}\)`, tone: 'key' },
        { k: T('peak acceleration', '最大加速度'), v: tx`\(${fmt(pk.a / 9.81, 0)}\,g\)`, tone: pk.a / 9.81 > 300 ? 'warn' : undefined },
        { k: T('hook speed', '釜の回転数'), v: tx`\(${fmt(2 * v.spm, 0)}\ \mathrm{rpm}\)` },
        { k: T('seam sewn', '縫う速さ'), v: tx`\(${fmt(seam, 1)}\ \mathrm{m/min}\)`, tone: 'good' },
        { k: T('each bit of thread passes through the eye', '糸のそれぞれの部分が針穴を通る回数'), v: tx`\(${fmt(passes, 0)}\ \text{${T('times', '回')}}\)` },
      ], T('Thread is not laid down as it leaves the spool. Each stitch draws out a loop long enough to go round the bobbin and takes most of it back, so a given piece of thread saws to and fro through the eye of the needle dozens of times before it is sewn in.', '糸は、糸巻きを出た順にそのまま縫い込まれるわけではありません。1 針ごとに、ボビンの周りを回れる長さの輪が引き出され、そのほとんどが引き戻されます。そのため、糸のある部分は、縫い込まれるまでに、針穴を何十回も行き来します。'));
    },
  };
})();
