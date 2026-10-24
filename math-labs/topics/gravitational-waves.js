'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const PI = Math.PI, TAU = 2 * PI, rad = (d) => d * PI / 180;

  /* ---------------- models (no DOM) ---------------- */
  const TSUN = 4.925490947e-6;           // G M_sun / c^3 in seconds
  const LSUN = 1476.625;                 // G M_sun / c^2 in metres
  const C = 299792458, MPC = 3.0856775814913673e22;

  // transverse-traceless displacement of a free mass at (x, y) in the plane z = const
  const ttDisplace = (x, y, hp, hx) => [x + 0.5 * (hp * x + hx * y), y + 0.5 * (hx * x - hp * y)];
  // polarisation content at retarded phase ph: linear at angle psi, or circular
  const polar = (mode, psi, h, ph) => (mode === 1
    ? [h * Math.cos(ph), h * Math.sin(ph)]
    : [h * Math.cos(2 * psi) * Math.cos(ph), h * Math.sin(2 * psi) * Math.cos(ph)]);
  // fractional arm-length changes of an L-shaped detector with arms along x and y, wave along z
  const armStrain = (hp, hx) => ({ x: 0.5 * hp, y: -0.5 * hp, diff: hp });

  const chirpMass = (m1, m2) => Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
  const eta = (m1, m2) => m1 * m2 / (m1 + m2) ** 2;
  // leading-order (Newtonian quadrupole) inspiral, masses in solar masses, times in seconds
  const fOfTau = (tau, Mc) => Math.pow(5 / (256 * tau), 3 / 8) * Math.pow(Mc * TSUN, -5 / 8) / PI;
  const tauOfF = (f, Mc) => (5 / 256) * Math.pow(PI * f, -8 / 3) * Math.pow(Mc * TSUN, -5 / 3);
  const phaseOfTau = (tau, Mc) => -2 * Math.pow(tau / (5 * Mc * TSUN), 5 / 8);           // GW phase, up to a constant
  const cycles = (f1, f2, Mc) => (Math.pow(f1, -5 / 3) - Math.pow(f2, -5 / 3)) / (32 * Math.pow(PI, 8 / 3) * Math.pow(Mc * TSUN, 5 / 3));
  const fISCO = (M) => 1 / (Math.pow(6, 1.5) * PI * M * TSUN);
  // strain amplitude for a face-on source at distance D (Mpc)
  const strain = (f, Mc, Dmpc) => 4 * Math.pow(Mc * LSUN, 5 / 3) * Math.pow(PI * f / C, 2 / 3) / (Dmpc * MPC);
  // separation in units of GM/c^2 from GW frequency (Kepler, orbital frequency = f/2)
  const sepOfF = (f, M) => Math.pow(PI * f * M * TSUN, -2 / 3);
  // geometric units (G = c = M = 1): tau(a) = 5 a^4 / (256 eta)
  const tauOfSep = (a, nu) => 5 * a ** 4 / (256 * nu);
  const sepOfTau = (tau, nu) => Math.pow(256 * nu * tau / 5, 0.25);
  const orbPhaseOfTau = (tau, nu) => -Math.pow(tau, 5 / 8) / (Math.pow(5, 5 / 8) * Math.pow(nu, 3 / 8));   // orbital phase, M = 1

  // detector antenna pattern, arms along x and y; source direction (theta, phi), polarisation angle psi
  const Fplus = (th, ph, ps) => 0.5 * (1 + Math.cos(th) ** 2) * Math.cos(2 * ph) * Math.cos(2 * ps) - Math.cos(th) * Math.sin(2 * ph) * Math.sin(2 * ps);
  const Fcross = (th, ph, ps) => 0.5 * (1 + Math.cos(th) ** 2) * Math.cos(2 * ph) * Math.sin(2 * ps) + Math.cos(th) * Math.sin(2 * ph) * Math.cos(2 * ps);
  const Frms = (th, ph) => Math.sqrt(0.25 * (1 + Math.cos(th) ** 2) ** 2 * Math.cos(2 * ph) ** 2 + Math.cos(th) ** 2 * Math.sin(2 * ph) ** 2);

  const M = { TSUN, LSUN, ttDisplace, polar, armStrain, chirpMass, eta, fOfTau, tauOfF, phaseOfTau, cycles, fISCO, strain, sepOfF, tauOfSep, sepOfTau, orbPhaseOfTau, Fplus, Fcross, Frms };
  (window.LabModels = window.LabModels || {})['gravitational-waves'] = M;

  /* ---------------- shared layout ---------------- */
  function frame(ctx, caps, opts = {}) {
    const st = ctx.state;
    if (st.frame && st.frame.isConnected) return st;
    st.anim?.stop(); st.anim = null; st.g = null; st.f1 = null; st.key = null;
    ctx.host.replaceChildren();
    st.frame = L.h('div', '', ctx.host);
    const row = L.h('div', 'lab-row', st.frame);
    st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
    st.cap1 = L.h('p', 'lab-cap', st.c1, caps[0]);
    st.v3 = L.h('div', '', st.c1);
    st.cap2 = L.h('p', 'lab-cap', st.c2, caps[1]);
    st.g2 = L.h('div', '', st.c2);
    st.bar = L.h('div', '', st.frame);
    st.leg = L.h('div', '', st.frame);
    if (opts.wide) row.classList.add('is-wide');
    return st;
  }

  /* ---------------- 1. polarisations ---------------- */
  const NR = 24, RINGS = 5, LAMBDA = 6, SPACING = LAMBDA / 4, PER = 2;
  D['gw-polarization'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('Five rings of free masses along the direction of travel, each meeting the wave a quarter wavelength later. The strain is exaggerated about 10²⁰ times.', '進行方向に並んだ自由質点の輪。それぞれ四分の一波長ずつ遅れて波を受けます。ひずみは約 10²⁰ 倍に誇張しています。'), T('Strain at the front ring, and what an L-shaped detector with arms along x and y records.', '先頭の輪でのひずみと、x 軸と y 軸に腕をもつ L 字型検出器が記録する信号。')], { wide: true });
      st.v = v;
      const mode = Math.round(v.pol ?? 0), psi = rad(v.psi ?? 0), h = v.h ?? 0.3;
      const ringAt = (k, t) => {
        const z = (k - (RINGS - 1) / 2) * SPACING;
        const ph = TAU * (t / PER - z / LAMBDA);
        const [hp, hx] = polar(mode, psi, h, ph);
        return { z, hp, hx, pts: L.seq(NR, (i) => { const a = TAU * i / NR; return ttDisplace(Math.cos(a), Math.sin(a), hp, hx); }) };
      };
      const front = (t) => ringAt(RINGS - 1, t);
      const draw2d = (t) => {
        if (!st.g || !st.g.svg.isConnected) {
          st.g2.replaceChildren();
          st.g = L.fig(st.g2, { x: [0, 2.5], y: [-0.65, 0.65], aspect: 0.62, maxH: 330, xlabel: T('time (wave periods)', '時間（周期）'), ylabel: T('strain (visual units)', 'ひずみ（表示単位）') });
          const tr = L.seq(301, (i) => { const x = 2.5 * i / 300, f = ringAt(RINGS - 1, x * PER); return [x, f.hp, f.hx]; });
          st.g.line(tr.map(([x, a]) => [x, a]), { c: 'c1', w: 2.4, layer: 'under' });
          st.g.line(tr.map(([x, , b]) => [x, b]), { c: 'c2', w: 2.4, layer: 'under' });
          st.g.line(tr.map(([x, a, b]) => [x, armStrain(a, b).x]), { c: 'c3', w: 1.4, dash: '5 4', layer: 'under' });
          st.g.line(tr.map(([x, a, b]) => [x, armStrain(a, b).y]), { c: 'c4', w: 1.4, dash: '2 3', layer: 'under' });
          st.leg.replaceChildren();
          L.legend(st.leg, [{ c: 'c1', label: T('h₊ (stretches x, squeezes y)', 'h₊（x を伸ばし y を縮める）') }, { c: 'c2', label: T('h× (the same, rotated 45°)', 'h×（同じ変形を 45° 回したもの）') }, { c: 'c3', dash: true, label: T('arm x: ΔLₓ/L = h₊/2', 'x 腕：ΔLₓ/L = h₊/2') }, { c: 'c4', dash: true, label: T('arm y: ΔL_y/L = −h₊/2', 'y 腕：ΔL_y/L = −h₊/2') }, { kind: 'dot', c: 'hl', label: T('mass on the x axis', 'x 軸上の質点') }]);
        }
        st.g.clear('over');
        const tm = (t / PER) % 2.5;
        st.g.vline(tm, { c: 'muted', w: 1, dash: '3 3', layer: 'over' });
        const f = front(t);
        st.g.dot(tm, f.hp, { c: 'c1', r: 4.5, layer: 'over' });
        st.g.dot(tm, f.hx, { c: 'c2', r: 4.5, layer: 'over' });
        return f;
      };
      const flat = (t) => {
        if (!st.f1 || !st.f1.svg.isConnected) { st.v3.replaceChildren(); st.f1 = L.fig(st.v3, { x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, maxH: 360, axes: false }); }
        const f = st.f1; f.clear('main'); f.clear('over');
        const r = front(t);
        f.line(L.sample(0, TAU, 120, (a) => [Math.cos(a), Math.sin(a)]), { c: 'grid', w: 1, dash: '3 4', layer: 'main' });
        f.line([...r.pts, r.pts[0]], { c: 'c1', w: 1.5, op: 0.5, layer: 'main' });
        r.pts.forEach(([x, y], i) => f.dot(x, y, { c: i === 0 ? 'hl' : 'c1', r: i === 0 ? 6 : 4.2, layer: 'over' }));
        return r;
      };
      const readout = (r) => {
        const s = armStrain(r.hp, r.hx);
        ctx.readout([
          { k: 'h₊', v: fmt(r.hp, 3), tone: 'key' }, { k: 'h×', v: fmt(r.hx, 3) },
          { k: T('ΔLₓ/L', 'ΔLₓ/L'), v: fmt(s.x, 3) }, { k: T('ΔL_y/L', 'ΔL_y/L'), v: fmt(s.y, 3) },
          { k: T('area change', '面積の変化'), v: fmt((1 + 0.5 * r.hp) * (1 - 0.5 * r.hp) - 0.25 * r.hx * r.hx - 1, 3) },
        ], mode === 1 ? T('Circular polarisation: the stretch axis turns at half the wave frequency, and the ring never passes through a circle. An L-shaped detector sees only the h₊ part along its own arms.', '円偏光では伸びる軸が波の振動数の半分で回り、輪は円の形を一度も通りません。L 字型検出器は自分の腕に沿った h₊ 成分だけを感じます。')
          : Math.abs(Math.cos(2 * psi)) < 1e-9 ? T('Pure × polarisation along these axes: both arms keep their length to first order, so this detector records nothing.', 'この軸に対して純粋な × 偏光なので、二本の腕の長さは一次では変わらず、この検出器は何も記録しません。')
            : T('The deformation is traceless: what one axis gains the perpendicular axis loses, so the enclosed area changes only at second order in h. Real strains are around 10⁻²¹.', '変形はトレースがゼロで、一方の軸が伸びた分だけ直交する軸が縮むので、囲む面積は h の二次でしか変わりません。実際のひずみは 10⁻²¹ 程度です。'));
      };
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => {
          st.t = t;
          const r = st.flat ? flat(t) : (st.draw3d?.(t), front(t));
          draw2d(t); if (st.lastRead !== Math.round(t * 8)) { st.lastRead = Math.round(t * 8); readout(r); }
        }, { initialT: 0.3, playLabel: T('Play the wave', '波を流す') });
      }
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 470, camera: [6.2, -7.4, 8.6], target: [0, 0, 0], fov: 34,
        init(S) {
          st.flat = false;
          const ringsM = [], tubes = [];
          for (let k = 0; k < RINGS; k++) {
            const pts = S.points(L.seq(NR, () => [0, 0, 0]), { c: 'c1', r: 0.055, max: NR, coat: 0.9 });
            const ref = S.tube(L.sample(0, TAU, 96, (a) => [Math.cos(a), Math.sin(a), 0]).map((p) => p), { c: 'muted', r: 0.006, closed: true });
            const loop = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c1', r: 0.012, closed: true, opacity: 0.55 });
            ringsM.push({ pts, ref, loop }); tubes.push(loop);
          }
          st.lead = S.sphere([1, 0, 0], 0.085, { c: 'hl', glow: 0.4 });
          S.arrow([0, 0, -RINGS * SPACING / 2 - 1.2], [0, 0, RINGS * SPACING + 2.0], { c: 'c3', r: 0.022 });
          S.label(T('wave travels along z', '波は z 方向に進む'), [0.12, 0, RINGS * SPACING / 2 + 0.9], { small: true });
          st.xlab = S.label('x', [1.45, 0, 0], { math: true, c: 'muted' });
          S.label('y', [0, 1.45, 0], { math: true, c: 'muted' });
          S.lines([[[-1.4, 0, 0], [1.4, 0, 0]], [[0, -1.4, 0], [0, 1.4, 0]]], { c: 'muted', opacity: 0.35 });
          st.draw3d = (t) => {
            for (let k = 0; k < RINGS; k++) {
              const r = ringAt(k, t), R = ringsM[k];
              R.ref.position.z = r.z;
              const P = r.pts.map(([x, y]) => [x, y, r.z]);
              R.pts.update(P);
              R.loop.update([...P]);
              if (k === RINGS - 1) st.lead.at(P[0]);
            }
            S.invalidate();
          };
          st.draw3d(st.t ?? 0.3);
        },
        update() { st.anim?.redraw(); },
        fallback() { st.flat = true; st.f1 = null; st.anim?.redraw(); },
      });
      st.anim?.redraw();
    },
  };

  /* ---------------- 2. inspiral chirp ---------------- */
  const A0 = 14, RDISC = 170, ISCO = 6;
  D['gw-chirp'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The orbital plane, seen in units of GM/c². The sheet is the leading-order wave h ∝ cos(2φ − Φ(t − r))/r; the two bodies are drawn far larger than their horizons.', '軌道面（単位は GM/c²）。面は最低次の波 h ∝ cos(2φ − Φ(t − r))/r です。二つの天体は地平面よりずっと大きく描いています。'), T('The same signal at Earth, in seconds before the end of the inspiral, for the masses and distance you chose.', '選んだ質量と距離で地球に届く同じ信号。横軸はインスパイラルの終わりまでの秒数です。')], { wide: true });
      st.v = v;
      const m1 = v.m1, m2 = v.m2, Mt = m1 + m2, nu = eta(m1, m2), Mc = chirpMass(m1, m2), Dm = v.dist;
      const fi = fISCO(Mt), tau0 = tauOfSep(A0, nu);
      const total = tau0 + RDISC + 20;                       // geometric time shown: inspiral, then let the last waves reach the rim
      const PHI0 = orbPhaseOfTau(tau0, nu);
      const tauAt = (tg) => tau0 - tg;                       // tg: geometric time since the start
      const tauI = tauOfSep(ISCO, nu);
      const field = (r, phi, tg) => {                        // h+ in the plane, normalised, at time tg
        const tr = tg - r;                                   // retarded time
        let tau = tau0 - tr;
        if (tau < tauI) return 0;                            // after the last stable orbit: not modelled, left flat
        const a = sepOfTau(tau, nu), w = Math.pow(a, -1.5);  // orbital angular frequency
        const amp = Math.pow(w / Math.pow(A0, -1.5), 2 / 3);
        const fade = Math.min(1, Math.max(0, (r - 1.2 * a) / 18));
        return amp * fade * Math.cos(2 * (orbPhaseOfTau(tau, nu) - PHI0) - 2 * phi) * (26 / Math.max(r, 26));
      };
      const speed = total / 16;                              // seconds of playback for the whole run
      const tgOf = (t) => Math.min(total, t * speed);
      const draw2d = (tg) => {
        if (!st.g || !st.g.svg.isConnected || st.key !== `${m1},${m2},${Dm}`) {
          st.key = `${m1},${m2},${Dm}`;
          st.g2.replaceChildren();
          const tauIs0 = tauOfF(fi, Mc);
          const tShow = Math.min(tauOfF(Math.min(20, fi * 0.5), Mc) - tauIs0, 4);
          const fLo = fOfTau(tShow + tauIs0, Mc);
          const hmax = strain(fi, Mc, Dm);
          st.g = L.fig(st.g2, { x: [-tShow, 0], y: [-1.15 * hmax * 1e21, 1.15 * hmax * 1e21], aspect: 0.62, maxH: 320, xlabel: T('seconds before the last stable orbit', '最内安定軌道までの秒数'), ylabel: 'h₊ × 10²¹' });
          const N = 2400, pts = [], fpts = [];
          const tauIs = tauOfF(fi, Mc);
          for (let i = 0; i <= N; i++) {
            const tt = -tShow + tShow * i / N, tau = -tt + tauIs;
            const f = fOfTau(tau, Mc), hh = strain(f, Mc, Dm) * 1e21;
            pts.push([tt, hh * Math.cos(phaseOfTau(tau, Mc) - phaseOfTau(tauIs, Mc))]);
            fpts.push([tt, f]);
          }
          st.g.line(pts, { c: 'c1', w: 1.3, layer: 'under' });
          st.g.line(pts.map(([t, y], i) => [t, strain(fpts[i][1], Mc, Dm) * 1e21]), { c: 'c2', w: 1.4, dash: '4 3', layer: 'under' });
          st.g.text(-tShow, 1.05 * hmax * 1e21, T(`from ${fmt(fLo, 1)} Hz`, `${fmt(fLo, 1)} Hz から`), { small: true, c: 'muted', dx: 4 , layer: 'main' });
          st.g.text(0, 1.05 * hmax * 1e21, `${fmt(fi, 0)} Hz`, { small: true, c: 'muted', anchor: 'end', dx: -4 , layer: 'main' });
          st.leg.replaceChildren();
          L.legend(st.leg, [{ c: 'c1', label: T('h₊ at Earth, face-on', '地球での h₊（正面から見た場合）') }, { c: 'c2', dash: true, label: T('amplitude ∝ f^{2/3}', '振幅 ∝ f^{2/3}') }, { kind: 'fill', c: 'pos', label: T('space stretched along this direction', 'この向きに空間が伸びている') }, { kind: 'fill', c: 'neg', label: T('space squeezed', '空間が縮んでいる') }]);
          st.tShow = tShow; st.tauIs = tauIs;
          ctx.readout([
            { k: T('chirp mass 𝓜', 'チャープ質量 𝓜'), v: fmt(Mc, 2) + ' M☉', tone: 'key' },
            { k: T('f at the last stable orbit', '最内安定軌道での f'), v: fmt(fi, 0) + ' Hz' },
            { k: T('time from 20 Hz', '20 Hz からの時間'), v: fi > 20 ? fmt(tauOfF(20, Mc) - tauOfF(fi, Mc), 2) + ' s' : 'n/a' },
            { k: T('cycles from 20 Hz', '20 Hz からの周期数'), v: fi > 20 ? fmt(cycles(20, fi, Mc), 0) : 'n/a' },
            { k: T('peak strain', '最大ひずみ'), v: fmt(hmax * 1e21, 2) + '×10⁻²¹' },
          ], T('Only the chirp mass sets how fast the frequency sweeps up, so a measured chirp weighs the binary. The sweep ends where the orbit stops being stable; the plunge and merger after that need numerical relativity and are not drawn.', '周波数の上がり方を決めるのはチャープ質量だけなので、観測したチャープから連星の質量がわかります。上昇は軌道が安定でなくなるところで終わります。その後の落下と合体には数値相対論が必要で、ここでは描いていません。'));
        }
        st.g.clear('over');
        const tau = tauAt(tg);
        // geometric and physical leading-order clocks agree: seconds = (tau - tau_ISCO) × M × G M_sun / c^3
        const tsec = tau > tauI ? -(tau - tauI) * Mt * TSUN : 0;
        if (tsec > -st.tShow) st.g.vline(tsec, { c: 'hl', w: 1.6, layer: 'over' });
      };
      const flat = (tg) => {
        if (!st.f1 || !st.f1.svg.isConnected) { st.v3.replaceChildren(); st.f1 = L.fig(st.v3, { x: [-RDISC, RDISC], y: [-RDISC, RDISC], equal: true, maxH: 380, axes: false }); }
        const f = st.f1; f.clear('over');
        f.raster((x, y) => { const r = Math.hypot(x, y); return r > RDISC ? 0 : field(r, Math.atan2(y, x), tg) * 0.9; }, { cmap: 'div', res: 3 });
        const tau = tauAt(tg), a = tau > tauI ? sepOfTau(tau, nu) : 0, ph = tau > tauI ? orbPhaseOfTau(tau, nu) - PHI0 : 0;
        f.dot(a * m2 / Mt * Math.cos(ph), a * m2 / Mt * Math.sin(ph), { c: 'ink', r: 5, layer: 'over' });
        f.dot(-a * m1 / Mt * Math.cos(ph), -a * m1 / Mt * Math.sin(ph), { c: 'ink', r: 4, layer: 'over' });
      };
      if (!st.anim) {
        st.anim = L.animator(st.bar, (dt, t) => {
          const tg = tgOf(t); st.tg = tg;
          if (st.flat) { if (!st.lastF || Math.abs(st.lastF - t) > 0.12 || dt === 0) { st.lastF = t; flat(tg); } } else st.draw3d?.(tg);
          draw2d(tg);
          return t * speed < total;
        }, { initialT: (tau0 - tauOfSep(7.2, nu)) / speed, autoplay: false, restart: true, once: true, duration: total / speed, playLabel: T('Play', '再生') });
      }
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.72, maxH: 470, camera: [0, -205, 150], target: [0, 0, -6], fov: 38, minDistance: 40, maxDistance: 520,
        init(S) {
          st.flat = false;
          st.sheet = S.surface((u, w) => [u * Math.cos(w), u * Math.sin(w), 0], { u: [4, RDISC], v: [0, TAU], nu: 110, nv: 200, colour: () => S.colour('plate'), rough: 0.62, coat: 0.25, wire: true, wireEvery: 11, wireEveryV: 25, wireOpacity: 0.12 });
          st.b1 = S.sphere([0, 0, 0], 2.6, { c: 'c4', coat: 1, rough: 0.2 });
          st.b2 = S.sphere([0, 0, 0], 2.2, { c: 'c3', coat: 1, rough: 0.2 });
          st.trail1 = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c4', r: 0.35, opacity: 0.6 });
          st.trail2 = S.tube([[0, 0, 0], [0, 0, 0.01]], { c: 'c3', r: 0.35, opacity: 0.6 });
          S.label(T('outgoing waves travel at c', '外向きの波は光速で進む'), [RDISC * 0.62, -RDISC * 0.62, 6], { small: true });
          st.blab = S.label('', [0, 0, 8], { small: true, align: 'middle' });
          st.draw3d = (tg) => {
            const H = 13;
            st.sheet.update((u, w) => [u * Math.cos(w), u * Math.sin(w), H * field(u, w, tg)], (u, w) => S.cmap.div(field(u, w, tg) * 1.15));
            const tau = tauAt(tg);
            const live = tau > tauI;
            const a = live ? sepOfTau(tau, nu) : 0, ph = live ? orbPhaseOfTau(tau, nu) - PHI0 : 0;
            const p1 = [a * m2 / Mt * Math.cos(ph), a * m2 / Mt * Math.sin(ph), 3], p2 = [-a * m1 / Mt * Math.cos(ph), -a * m1 / Mt * Math.sin(ph), 3];
            st.b1.at(p1); st.b2.at(p2);
            st.b1.scale.setScalar(live ? 1.2 + 1.6 * m1 / Mt : 3.1); st.b2.visible = live;
            const tr = (sgn, mm) => L.seq(60, (i) => { const tt = Math.max(tauI, tau) + i * 6; const aa = sepOfTau(tt, nu), pp = orbPhaseOfTau(tt, nu) - PHI0; return [sgn * aa * mm / Mt * Math.cos(pp), sgn * aa * mm / Mt * Math.sin(pp), 3]; });
            if (live) { st.trail1.update(tr(1, m2)); st.trail2.update(tr(-1, m1)); } else { st.trail1.update([[0, 0, 3], [0, 0, 3.01]]); st.trail2.update([[0, 0, 3], [0, 0, 3.01]]); }
            st.blab.set([0, 0, 9], live ? T(`separation ${fmt(a, 1)} GM/c²`, `間隔 ${fmt(a, 1)} GM/c²`) : T('merged (not modelled)', '合体（モデル外）'));
          };
          st.draw3d(st.tg ?? tgOf(st.anim?.t ?? 0));
        },
        update() { st.anim?.redraw(); },
        fallback() { st.flat = true; st.f1 = null; st.anim?.redraw(); },
      });
      st.anim?.redraw();
    },
  };

  /* ---------------- 3. antenna pattern ---------------- */
  const RS = 1.75;
  D['gw-antenna'] = {
    three: true,
    render(ctx, v) {
      const st = frame(ctx, [T('The detector at the centre, its response drawn as a surface: the distance from the centre in each direction is how strongly a wave from there moves the arms. Drag the gold source around the sky.', '中央に検出器があり、その応答を面で表しています。各方向での中心からの距離が、その方向から来た波が腕をどれだけ動かすかです。金色の波源を空でドラッグしてください。'), T('The whole sky unrolled: response against azimuth φ and angle θ from the zenith.', '空全体を広げた図。方位角 φ と天頂からの角 θ に対する応答。')], { wide: true });
      const th = rad(v.theta), ph = rad(v.phi), ps = rad(v.psi), mode = Math.round(v.mode ?? 2);
      const F = (a, b) => (mode === 0 ? Fplus(a, b, ps) : mode === 1 ? Fcross(a, b, ps) : Frms(a, b));
      const fp = Fplus(th, ph, ps), fx = Fcross(th, ph, ps), fr = Frms(th, ph);
      const draw2d = () => {
        st.g2.replaceChildren(); st.leg.replaceChildren();
        const g = L.fig(st.g2, { x: [0, 360], y: [180, 0], aspect: 0.62, maxH: 320, xlabel: T('azimuth φ (°)', '方位角 φ（°）'), ylabel: T('θ from zenith (°)', '天頂角 θ（°）'), ticksX: [[0, '0'], [90, '90'], [180, '180'], [270, '270'], [360, '360']], ticksY: [[0, '0'], [45, '45'], [90, '90'], [135, '135'], [180, '180']] });
        g.raster((x, y) => (mode === 2 ? F(rad(y), rad(x)) : F(rad(y), rad(x))), { cmap: mode === 2 ? 'seq' : 'div', res: 3 });
        for (const p0 of [45, 135, 225, 315]) g.dot(p0, 90, { c: 'ink', r: 3.5, hollow: true });
        g.handle(v.phi, v.theta, { c: 'hl', label: T('source', '波源'), onDrag: (x, y) => { ctx.set('phi', L.clamp(x, 0, 360), true); ctx.set('theta', L.clamp(y, 0, 180)); } });
        L.legend(st.leg, mode === 2 ? [{ kind: 'fill', c: 'c1', label: T('√(F₊² + F×²): response averaged over polarisation', '√(F₊² + F×²)：偏光で平均した応答') }, { kind: 'dot', c: 'ink', label: T('blind spots: in the plane, between the arms', '死角：腕のあいだの水平面内') }]
          : [{ kind: 'fill', c: 'pos', label: T(mode === 0 ? 'F₊ > 0' : 'F× > 0', mode === 0 ? 'F₊ > 0' : 'F× > 0') }, { kind: 'fill', c: 'neg', label: T(mode === 0 ? 'F₊ < 0 (arms respond with opposite sign)' : 'F× < 0', mode === 0 ? 'F₊ < 0（腕が逆符号で応答）' : 'F× < 0') }]);
        ctx.readout([
          { k: 'F₊', v: fmt(fp, 3), tone: mode === 0 ? 'key' : undefined }, { k: 'F×', v: fmt(fx, 3), tone: mode === 1 ? 'key' : undefined },
          { k: '√(F₊² + F×²)', v: fmt(fr, 3), tone: mode === 2 ? 'key' : undefined },
          { k: T('sky average of F₊²', 'F₊² の全天平均'), v: '1/5' },
        ], fr < 0.05 ? T('The source sits near a blind spot: a wave from here stretches both arms equally and the difference signal vanishes.', '波源は死角の近くにあります。ここからの波は二本の腕を同じだけ伸び縮みさせるので、差の信号が消えます。')
          : T('Overhead (θ = 0) the response is 1: the wave lies flat across both arms. Any direction except the four blind spots gives some signal, which is why one detector cannot locate a source and the network needs three or more.', '真上 (θ = 0) では応答は 1 で、波が二本の腕に平らにかかります。四つの死角以外のどの方向からも何らかの信号があるので、一台では波源の方向が決まらず、三台以上の観測網が必要になります。'));
      };
      const dir = (a, b) => [Math.sin(a) * Math.cos(b), Math.sin(a) * Math.sin(b), Math.cos(a)];
      L.view3d(ctx, v, {
        host: st.v3, aspect: 0.82, maxH: 470, camera: [3.6, -4.6, 3.0], target: [0, 0, 0.1], fov: 34,
        init(S) {
          st.flat = false;
          st.lobe = S.surface((a, b) => { const d = dir(a, b), r = Math.abs(F(a, b)); return [d[0] * r, d[1] * r, d[2] * r]; }, { u: [0, PI], v: [0, TAU], nu: 90, nv: 180, colour: () => S.colour('c1'), rough: 0.35, coat: 0.7, opacity: 0.92 });
          S.tube([[0, 0, 0], [1.25, 0, 0]], { c: 'ink', r: 0.03 }); S.tube([[0, 0, 0], [0, 1.25, 0]], { c: 'ink', r: 0.03 });
          S.box([0.14, 0.14, 0.14], [1.25, 0, 0], { c: 'muted', metal: 0.6, rough: 0.3 }); S.box([0.14, 0.14, 0.14], [0, 1.25, 0], { c: 'muted', metal: 0.6, rough: 0.3 });
          S.label(T('arm x', '腕 x'), [1.3, 0, 0.08], { small: true }); S.label(T('arm y', '腕 y'), [0, 1.3, 0.08], { small: true });
          S.lines(L.seq(96, (i) => { const a = TAU * i / 96, b = TAU * (i + 1) / 96; return [[RS * Math.cos(a), RS * Math.sin(a), 0], [RS * Math.cos(b), RS * Math.sin(b), 0]]; }), { c: 'muted', opacity: 0.4 });
          st.ray = S.arrow([0, 0, 0], [0, 0, 1], { c: 'hl', r: 0.018 });
          st.wave = S.disc([0, 0, 0], [0, 0, 1], 0.42, { c: 'hl', opacity: 0.22 });
          st.src = S.handle(dir(th, ph).map((x) => x * RS), { sphere: [[0, 0, 0], RS], r: 0.09, onDrag: (q) => {
            const r = Math.hypot(q.x, q.y, q.z); const t2 = Math.acos(L.clamp(q.z / r, -1, 1)) * 180 / PI; let p2 = Math.atan2(q.y, q.x) * 180 / PI; if (p2 < 0) p2 += 360;
            ctx.set('phi', Math.round(p2), true); ctx.set('theta', Math.round(t2));
          } });
          st.mode = mode; st.psi = ps;
        },
        update(S) {
          st.lobe.update((a, b) => { const d = dir(a, b), r = Math.abs(F(a, b)); return [d[0] * r, d[1] * r, d[2] * r]; }, (a, b) => { const x = F(a, b); return mode === 2 ? S.cmap.seq(x) : S.cmap.div(x * 1.2); });
          const d = dir(th, ph);
          st.src.at(d.map((x) => x * RS));
          st.ray.set(d.map((x) => x * (RS - 0.12)), d.map((x) => -x * (RS - 0.12 - Math.max(0.05, Math.abs(F(th, ph))))));
          st.wave.position.set(d[0] * RS * 0.82, d[1] * RS * 0.82, d[2] * RS * 0.82); st.wave.lookAt(0, 0, 0);
          S.invalidate();
          draw2d();
        },
        fallback() { st.flat = true; st.v3.replaceChildren(); L.h('p', 'lab-cap', st.v3, T('Your browser has no 3D graphics, so only the unrolled map is shown.', 'このブラウザでは 3D 表示ができないため、展開図だけを表示しています。')); draw2d(); },
      });
      if (!st.__v3 && !st.flat) draw2d();
    },
  };
})();
