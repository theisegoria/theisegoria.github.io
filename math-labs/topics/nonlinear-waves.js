'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = (window.LabDefs = window.LabDefs || {}), tx = String.raw;
  const PI = Math.PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------------- models (no DOM) ----------------
   * KdV u_t + 6 u u_x + u_xxx = 0. Two-soliton solution (Hirota): u = 2 (ln tau)_xx with
   * tau = 1 + e^{n1} + e^{n2} + A e^{n1 + n2}, n_i = k_i x - k_i^3 t + d_i, A = ((k1 - k2)/(k1 + k2))^2.
   * Each soliton alone is (k^2/2) sech^2(k(x - k^2 t)/2): speed k^2, height k^2/2. After the collision the faster one
   * is shifted forward by (2/k1) ln((k1 + k2)/(k1 - k2)) and the slower one back by (2/k2) of the same logarithm.
   * Burgers u_t + u u_x = nu u_xx, solved exactly by Cole-Hopf; inviscid characteristics x = s + u0(s) t.
   * FPUT alpha chain of N masses with fixed ends, energies in the normal modes of the linear chain.
   */
  function kdv(x, t, k1, k2, d1 = 0, d2 = 0) {
    const A = ((k1 - k2) / (k1 + k2)) ** 2, n1 = k1 * x - k1 ** 3 * t + d1, n2 = k2 * x - k2 ** 3 * t + d2, lA = Math.log(A);
    const e = [0, n1, n2, n1 + n2 + lA], m = Math.max(...e), w = e.map((q) => Math.exp(q - m));
    const kk = [0, k1, k2, k1 + k2];
    const tau = w[0] + w[1] + w[2] + w[3], tx1 = kk[1] * w[1] + kk[2] * w[2] + kk[3] * w[3], txx = kk[1] ** 2 * w[1] + kk[2] ** 2 * w[2] + kk[3] ** 2 * w[3];
    return (2 * (tau * txx - tx1 * tx1)) / (tau * tau);
  }
  const soliton = (x, t, k, d = 0) => (k * k / 2) / Math.cosh((k * x - k ** 3 * t + d) / 2) ** 2;
  const phaseShift = (k1, k2) => [(2 / k1) * Math.log((k1 + k2) / (k1 - k2)), (2 / k2) * Math.log((k1 + k2) / (k1 - k2))];
  // centers of the two solitons long before and long after the collision (with d1 = d2 = 0): the fast one runs along
  // k1^2 t and jumps ahead by s1; the slow one runs along k2^2 t + s2 before and k2^2 t after, so it falls back by s2
  function tracks(t, k1, k2) {
    const [s1, s2] = phaseShift(k1, k2);
    return t < 0 ? [k1 * k1 * t, k2 * k2 * t + s2] : [k1 * k1 * t + s1, k2 * k2 * t];
  }

  // Burgers with a Gaussian hump u0 = a exp(-x^2)
  const u0B = (x, a) => a * Math.exp(-x * x);
  const breakTime = (a) => Math.exp(0.5) / (Math.SQRT2 * a);         // 1/max(-u0')
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const F0 = (s, a) => a * (Math.sqrt(PI) / 2) * erf(s);           // integral of u0 from 0 to s
  function burgers(x, t, a, nu, grid) {
    if (t <= 0) return u0B(x, a);
    // Cole-Hopf: u = sum (x - s)/t K / sum K, K = exp(-(x - s)^2/(4 nu t) - F0(s)/(2 nu)), log-sum-exp for stability
    let m = -Infinity; const g = grid;
    for (let i = 0; i < g.s.length; i++) { const e = -((x - g.s[i]) ** 2) / (4 * nu * t) - g.F[i] / (2 * nu); if (e > m) m = e; }
    let num = 0, den = 0;
    for (let i = 0; i < g.s.length; i++) { const e = -((x - g.s[i]) ** 2) / (4 * nu * t) - g.F[i] / (2 * nu) - m; if (e < -40) continue; const k = Math.exp(e); num += ((x - g.s[i]) / t) * k; den += k; }
    return num / den;
  }
  const burgersGrid = (a, n = 2400) => { const s = new Float64Array(n), F = new Float64Array(n); for (let i = 0; i < n; i++) { s[i] = -8 + (20 * i) / (n - 1); F[i] = F0(s[i], a); } return { s, F }; };

  // FPUT alpha chain: x_j'' = (x_{j+1} - 2x_j + x_{j-1}) [1 + alpha (x_{j+1} - x_{j-1})], fixed ends
  function fput(N, alpha, amp, tEnd, dt = 0.1, every = 20) {
    const x = new Float64Array(N + 2), v = new Float64Array(N + 2), acc = new Float64Array(N + 2);
    for (let j = 1; j <= N; j++) x[j] = amp * Math.sin((PI * j) / (N + 1));
    const force = () => { for (let j = 1; j <= N; j++) { const dl = x[j] - x[j - 1], dr = x[j + 1] - x[j]; acc[j] = dr - dl + alpha * (dr * dr - dl * dl); } };
    const omega = Array.from({ length: N + 1 }, (_, k) => 2 * Math.sin((PI * k) / (2 * (N + 1))));
    const modes = () => {
      const E = new Float64Array(N + 1);
      for (let k = 1; k <= N; k++) { let Q = 0, Pk = 0; for (let j = 1; j <= N; j++) { const s = Math.sin((PI * j * k) / (N + 1)); Q += x[j] * s; Pk += v[j] * s; } const c = Math.sqrt(2 / (N + 1)); Q *= c; Pk *= c; E[k] = 0.5 * (Pk * Pk + omega[k] ** 2 * Q * Q); }
      return E;
    };
    const out = { t: [], E: [], X: [] }; force();
    const steps = Math.round(tEnd / dt);
    for (let s = 0; s <= steps; s++) {
      if (s % every === 0) { out.t.push(s * dt); out.E.push(modes()); out.X.push(Float64Array.from(x)); }
      for (let j = 1; j <= N; j++) { v[j] += 0.5 * dt * acc[j]; x[j] += dt * v[j]; }
      force(); for (let j = 1; j <= N; j++) v[j] += 0.5 * dt * acc[j];
    }
    // the total energy of the nonlinear chain (to check the integrator)
    out.energy = (X, Vv) => { let e = 0; for (let j = 0; j <= N; j++) { const d = X[j + 1] - X[j]; e += 0.5 * d * d + (alpha / 3) * d * d * d; } for (let j = 1; j <= N; j++) e += 0.5 * Vv[j] * Vv[j]; return e; };
    out.state = () => ({ x: Float64Array.from(x), v: Float64Array.from(v) });
    out.omega = omega;
    return out;
  }
  const M = { kdv, soliton, phaseShift, tracks, u0B, breakTime, erf, F0, burgers, burgersGrid, fput };
  (window.LabModels = window.LabModels || {})['nonlinear-waves'] = M;

  /* ================= 1. KdV solitons in a wave flume (3D) ================= */
  const XR = 26, TMAX = 9;                          // model x in [-XR, XR], time in [-TMAX, TMAX]
  const FL = 6.6, WD = 0.75, H0 = 0.55, AMP = 0.42;  // flume half-length, half-width, still depth, height per unit u (display)
  const X3 = (x) => (x / XR) * FL;
  D['kdv-solitons'] = {
    three: true,
    render(ctx, v) {
      const st = ctx.state; st.ctx = ctx;
      let k1 = Math.max(v.k1, v.k2), k2 = Math.min(v.k1, v.k2); if (k1 - k2 < 0.05) k2 = k1 - 0.05;
      const sh = phaseShift(k1, k2);
      // place the collision at x = 0, t = 0 by offsetting the phases so each soliton passes x = 0 at t = 0 before the shift
      if (!st.frame || !st.frame.isConnected) {
        st.anim?.stop(); st.anim = null;
        ctx.host.replaceChildren();
        st.frame = L.h('div', '', ctx.host);
        st.cap1 = L.h('p', 'lab-cap', st.frame); st.v3 = L.h('div', '', st.frame); st.bar = L.h('div', '', st.frame);
        const row = L.h('div', 'lab-row', st.frame);
        st.c1 = L.h('div', 'lab-col', row); st.c2 = L.h('div', 'lab-col', row);
        st.cap2 = L.h('p', 'lab-cap', st.c1); st.g2 = L.h('div', '', st.c1);
        st.cap3 = L.h('p', 'lab-cap', st.c2); st.g3 = L.h('div', '', st.c2);
        st.leg = L.h('div', '', st.frame);
      }
      st.time ??= -5;
      const U = (x, t) => kdv(x, t, k1, k2);
      L.setText(st.cap1, T(tx`A laboratory wave flume, as in Russell’s canal: two solitary waves of the Korteweg–de Vries equation \(u_t+6uu_x+u_{xxx}=0\). The taller one is faster, \(c=k^2\), catches up, and the two pass through each other unchanged in shape. Press Play, or drag the gold time line on the spacetime diagram below. Heights are exaggerated.`, tx`ラッセルの運河のような実験用の造波水路で、コルテヴェーグ・ド・フリース方程式 \(u_t+6uu_x+u_{xxx}=0\) の二つの孤立波が進みます。高いほうが速く（\(c=k^2\)）、追いついて、二つは形を変えずに互いを通り抜けます。Play を押すか、下の時空図の金色の時刻線をドラッグしてください。高さは誇張しています。`));
      L.setText(st.cap2, T(tx`Spacetime: \(u(x,t)\) as brightness. The ridges are the solitons’ paths. After the crossing each path is displaced: the fast one jumps ahead by \(\tfrac{2}{k_1}\ln\tfrac{k_1+k_2}{k_1-k_2}\), the slow one falls back.`, tx`時空図：\(u(x,t)\) を明るさで描いています。尾根が孤立波の経路です。交差のあと各経路はずれ、速いほうは \(\tfrac{2}{k_1}\ln\tfrac{k_1+k_2}{k_1-k_2}\) だけ前へ飛び、遅いほうは後ろへ下がります。`));
      L.setText(st.cap3, T('The water surface now (solid), against the sum of the two solitons drawn separately (dashed). They differ most during the collision: the waves interact nonlinearly, and yet both emerge intact.', '現在の水面（実線）と、二つの孤立波を別々に描いて足したもの（破線）です。差が最も大きいのは衝突の最中で、波は非線形に相互作用しますが、それでも両方とも無傷で現れます。'));
      const draw2d = () => {
        st.g2.replaceChildren(); st.g3.replaceChildren();
        const f = L.fig(st.g2, { x: [-XR, XR], y: [-TMAX, TMAX], aspect: 0.62, maxH: 300, xlabel: tx`\(x\)`, ylabel: tx`\(t\)` });
        const um = (k1 * k1) / 2;
        f.raster((x, t) => clamp(U(x, t) / um, 0, 1), { cmap: 'warm', res: 3 });
        for (const [i, c] of [[0, 'c1'], [1, 'c3']]) for (const side of [-1, 1]) f.line(L.sample(side < 0 ? -TMAX : 0, side < 0 ? 0 : TMAX, 60, (t) => [tracks(t, k1, k2)[i], t]).filter((p) => Math.abs(p[0]) < XR), { c, w: 1.2, dash: '4 4' });
        st.f2 = f;
        const g = L.fig(st.g3, { x: [-XR, XR], y: [-0.1, Math.max(1.15, (k1 * k1) / 2 * 1.15)], aspect: 0.62, maxH: 300, xlabel: tx`\(x\)`, ylabel: tx`\(u(x,t)\)` });
        st.g = g;
      };
      const drawNow = (fromDrag) => {
        const t = st.time, g = st.g;
        if (g) {
          g.clear('main');
          const c = tracks(t, k1, k2);
          g.line(L.sample(-XR, XR, 500, (x) => [x, soliton(x - c[0], 0, k1) + soliton(x - c[1], 0, k2)]), { c: 'muted', w: 1.6, dash: '5 4' });
          g.area(L.sample(-XR, XR, 500, (x) => [x, U(x, t)]), { c: 'c1', fo: 0.22 });
          g.line(L.sample(-XR, XR, 500, (x) => [x, U(x, t)]), { c: 'c1', w: 2.6 });
          g.text(XR * 0.97, Math.max(1.15, (k1 * k1) / 2 * 1.15) * 0.9, tx`\(t=${fmt(t, 3)}\)`, { anchor: 'end', small: true });
        }
        if (st.f2) {
          st.tline?.remove(); st.tline = st.f2.line([[-XR, t], [XR, t]], { c: 'hl', w: 1.6, layer: 'over' });
          if (!fromDrag) { st.tl?.remove(); st.tl = st.f2.handle(-XR * 0.9, t, { c: 'hl', axis: 'y', bounds: [-XR * 0.9, -XR * 0.9, -TMAX, TMAX], label: T('time', '時刻'), onDrag: (x, tt) => { st.anim?.pause(); st.time = tt; drawNow(true); } }); }
        }
        if (st.S && st.water) { st.water.update((u, w) => [-FL + 2 * FL * u, -WD + 2 * WD * w, H0 + AMP * U(-XR + 2 * XR * u, t)]); st.front.update((u, w) => [-FL + 2 * FL * u, -WD + 0.002, w * (H0 + AMP * U(-XR + 2 * XR * u, t))]); st.S.invalidate(); }
      };
      st.drawNow = drawNow;
      draw2d();
      st.leg.replaceChildren(); L.legend(st.leg, [{ c: 'c1', label: T('water surface u(x, t)', '水面 u(x, t)').replace('u(x, t)', tx`\(u(x,t)\)`) }, { c: 'muted', dash: true, label: T('two solitons added without interaction', '相互作用なしに足した二つの孤立波') }, { c: 'c1', dash: true, label: T(tx`fast soliton path, \(c_1=k_1^2\)`, tx`速い孤立波の経路 \(c_1=k_1^2\)`) }, { c: 'c3', dash: true, label: T(tx`slow soliton path, \(c_2=k_2^2\)`, tx`遅い孤立波の経路 \(c_2=k_2^2\)`) }]);
      ctx.readout([
        { k: T(tx`speeds \(c_i=k_i^2\)`, tx`速さ \(c_i=k_i^2\)`), v: tx`\(${fmt(k1 * k1, 3)},\ ${fmt(k2 * k2, 3)}\)` },
        { k: T(tx`heights \(k_i^2/2\)`, tx`高さ \(k_i^2/2\)`), v: tx`\(${fmt((k1 * k1) / 2, 3)},\ ${fmt((k2 * k2) / 2, 3)}\)` },
        { k: T('phase shifts: fast forward, slow back', '位相のずれ：速いほうは前へ、遅いほうは後ろへ'), v: tx`\(+${fmt(sh[0], 3)},\ -${fmt(sh[1], 3)}\)`, tone: 'key' },
        { k: T(tx`interaction coefficient \(A=\bigl(\tfrac{k_1-k_2}{k_1+k_2}\bigr)^2\)`, tx`相互作用の係数 \(A=\bigl(\tfrac{k_1-k_2}{k_1+k_2}\bigr)^2\)`), v: fmt(((k1 - k2) / (k1 + k2)) ** 2, 4) },
      ], T('A soliton balances two effects: steepening, because taller parts of the wave move faster, and dispersion, which spreads short waves out. Its height, width and speed are tied together by a single number k.', '孤立波は二つの効果の釣り合いです。波の高い部分ほど速く進むために起こる切り立ちと、短い波を広げる分散です。その高さ、幅、速さは一つの数 k で結びついています。').replace(' k.', tx` \(k\).`).replace(' k で', tx` \(k\) で`));
      st.anim?.stop();
      st.anim = L.animator(st.bar, (dt, t) => { st.time = -TMAX + ((t * 1.6) % (2 * TMAX)); drawNow(); return true; }, { autoplay: false, initialT: (st.time + TMAX) / 1.6, playLabel: T('Play', '再生') });
      L.view3d(ctx, v, {
        host: st.v3, aspect: (ctx.host.clientWidth || 900) < 560 ? 0.8 : 0.46, maxH: 500, camera: [2.4, -10.6, 5.6], target: [0, 0, 0.25], fov: 32,
        label: T('3D wave flume with two KdV solitons. Drag to rotate.', '二つの KdV 孤立波が進む 3D の造波水路。ドラッグで回転できます。'),
        init(S) {
          st.flat = false; st.S = S;
          const TH = S.THREE, steel = S.mat('#9aa1a8', { metal: 0.9, rough: 0.28, coat: 0.4 }), dark = S.mat('#3b4046', { metal: 0.8, rough: 0.35 });
          // bed and back wall (painted steel), front and back glass panels, steel frame with posts every meter
          const bed = new TH.Mesh(new TH.BoxGeometry(2 * FL + 0.4, 2 * WD + 0.3, 0.12), S.mat('#5b6168', { metal: 0.4, rough: 0.55 })); bed.position.set(0, 0, -0.06); S.add(bed);
          const backWall = new TH.Mesh(new TH.BoxGeometry(2 * FL + 0.4, 0.06, 1.35), S.mat('#e9eef2', { rough: 0.35, coat: 0.3 })); backWall.position.set(0, WD + 0.05, 0.62); S.add(backWall);
          for (const xg of L.seq(14, (i) => -FL + (2 * FL * (i + 0.5)) / 14)) { const grid = new TH.Mesh(new TH.BoxGeometry(0.012, 0.01, 1.2), dark); grid.position.set(xg, WD + 0.018, 0.62); S.add(grid); }
          for (const zg of [0.2, 0.4, 0.55, 0.7, 0.9, 1.1]) { const gl = new TH.Mesh(new TH.BoxGeometry(2 * FL, 0.01, zg === 0.55 ? 0.018 : 0.008), dark); gl.position.set(0, WD + 0.018, zg); S.add(gl); }
          const glass = new TH.Mesh(new TH.BoxGeometry(2 * FL + 0.2, 0.03, 1.3), S.mat('#e8f1f5', { glass: true, thickness: 0.03, ior: 1.5, rough: 0.04 })); glass.position.set(0, -WD - 0.03, 0.62); S.add(glass);
          for (let i = 0; i <= 12; i++) { const x = -FL - 0.1 + ((2 * FL + 0.2) * i) / 12; for (const y of [-WD - 0.06, WD + 0.09]) { const post = new TH.Mesh(new TH.BoxGeometry(0.06, 0.06, 1.4), steel); post.position.set(x, y, 0.6); S.add(post); } }
          for (const y of [-WD - 0.06, WD + 0.09]) for (const z of [1.3, -0.02]) { const rail = new TH.Mesh(new TH.BoxGeometry(2 * FL + 0.32, 0.08, 0.06), steel); rail.position.set(0, y, z); S.add(rail); }
          // wave maker: a piston paddle at the left end
          const paddle = new TH.Mesh(new TH.BoxGeometry(0.06, 2 * WD - 0.04, 1.0), S.mat('#c9d2d8', { metal: 0.6, rough: 0.3 })); paddle.position.set(-FL - 0.05, 0, 0.55); S.add(paddle);
          const ram = new TH.Mesh(new TH.CylinderGeometry(0.05, 0.05, 0.6, 20).rotateZ(PI / 2), steel); ram.position.set(-FL - 0.38, 0, 0.75); S.add(ram);
          // water: the surface and the face seen through the glass
          st.water = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 260, nv: 6, c: '#2f86b5', rough: 0.06, metal: 0.05, coat: 1, coatRough: 0.02 });
          st.front = S.surface(() => [0, 0, 0], { u: [0, 1], v: [0, 1], nu: 260, nv: 2, c: '#1f5f86', rough: 0.2, coat: 0.6 });
          S.label(T('wave maker', '造波板'), [-FL - 0.1, 0, 1.25], { small: true, align: 'middle' });
          S.label(T('glass side wall', 'ガラスの側壁'), [FL * 0.7, -WD - 0.1, 1.45], { small: true, align: 'middle' });
          drawNow();
        },
        update(S) { drawNow(); },
        fallback() {
          st.flat = true; st.v3.replaceChildren();
          const f = L.fig(st.v3, { x: [-XR, XR], y: [0, 2.2], aspect: 0.3, maxH: 200, axes: false, grid: false });
          f.area(L.sample(-XR, XR, 400, (x) => [x, 1 + 0.6 * U(x, st.time)]), { c: 'c1', fo: 0.5 });
        },
      });
      drawNow();
    },
  };

  /* ================= 2. Burgers: shocks from steepening ================= */
  const gCache = {};
  D['burgers-shock'] = {
    render(ctx, v) {
      const a = v.a, nu = v.nu, t = v.t, tb = breakTime(a), grid = (gCache[a] ||= burgersGrid(a));
      const row = L.h('div', 'lab-row', ctx.host), c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(tx`Characteristics of \(u_t+uu_x=0\): each point of the initial hump moves at its own height, \(x=s+u_0(s)\,t\). Fast lines from the top catch slow lines ahead of them; where they first cross, at \(t^*\), the wave breaks. Drag the gold time line.`, tx`\(u_t+uu_x=0\) の特性曲線です。初めの山の各点は自分の高さの速さで進み、\(x=s+u_0(s)\,t\) となります。頂上から出る速い線が前の遅い線に追いつき、最初に交わる \(t^*\) で波が砕けます。金色の時刻線をドラッグしてください。`));
      const f = L.fig(c1, { x: [-3, 6], y: [0, 4], aspect: 0.8, maxH: 360, xlabel: tx`\(x\)`, ylabel: tx`\(t\)` });
      for (let i = 0; i <= 44; i++) { const s = -3 + (6 * i) / 44, sp = u0B(s, a); f.line([[s, 0], [s + sp * 4, 4]], { c: s < 0 ? 'c1' : 'c2', w: 1, op: 0.75 }); }
      f.hline(tb, { c: 'c4', dash: '5 4', w: 1.4 }); f.text(5.9, tb, tx`\(t^*=${fmt(tb, 3)}\)`, { anchor: 'end', small: true, dy: -6, c: 'c4' });
      f.line([[-3, t], [6, t]], { c: 'hl', w: 2 });
      f.handle(-2.6, t, { c: 'hl', axis: 'y', bounds: [-2.6, -2.6, 0, 4], label: T('time', '時刻'), onDrag: (x, y) => ctx.set('t', clamp(Math.round(y * 100) / 100, 0, 4)) });
      L.h('p', 'lab-cap', c2, T(tx`The profile at time \(t\). Dashed: the inviscid solution traced along the characteristics, which folds over and becomes three-valued after \(t^*\). Solid: the exact viscous solution (Cole–Hopf), in which the fold is replaced by a thin shock of width about \(\nu/\Delta u\).`, tx`時刻 \(t\) での形です。破線は特性曲線に沿ってたどった非粘性の解で、\(t^*\) を過ぎると折れ重なり 3 価になります。実線は粘性のある厳密解（コール・ホップ）で、折れ目は幅が約 \(\nu/\Delta u\) の薄い衝撃波に置きかわります。`));
      const g = L.fig(c2, { x: [-3, 6], y: [-0.1, a * 1.15 + 0.1], aspect: 0.8, maxH: 360, xlabel: tx`\(x\)`, ylabel: tx`\(u\)` });
      g.line(L.sample(-3, 3, 400, (s) => [s + u0B(s, a) * t, u0B(s, a)]), { c: 'muted', w: 1.6, dash: '5 4' });
      const prof = L.sample(-3, 6, 360, (x) => [x, burgers(x, t, a, nu, grid)]);
      g.area(prof, { c: 'c1', fo: 0.2 }); g.line(prof, { c: 'c1', w: 2.6 });
      // the shock: steepest point of the viscous profile, its jump and the Rankine-Hugoniot speed
      let iMax = 1, sMax = 0; for (let i = 1; i < prof.length; i++) { const s = (prof[i - 1][1] - prof[i][1]) / (prof[i][0] - prof[i - 1][0]); if (s > sMax) { sMax = s; iMax = i; } }
      const xs = prof[iMax][0], uL = Math.max(...prof.slice(Math.max(0, iMax - 40), iMax).map((p) => p[1])), uR = Math.min(...prof.slice(iMax, iMax + 40).map((p) => p[1]));
      if (t > tb) { g.dot(xs, (uL + uR) / 2, { c: 'hl', r: 5 }); g.text(xs, (uL + uR) / 2, T('shock', '衝撃波'), { dx: 10, anchor: 'start', small: true, c: 'hl' }); }
      L.legend(ctx.host, [{ c: 'c1', label: T(tx`viscous solution, \(\nu=${fmt(nu, 3)}\)`, tx`粘性のある解、\(\nu=${fmt(nu, 3)}\)`) }, { c: 'muted', dash: true, label: T('inviscid, along characteristics', '非粘性、特性曲線に沿って') }, { c: 'c4', dash: true, label: T('breaking time', '砕波の時刻') }]);
      ctx.readout([
        { k: T(tx`breaking time \(t^*=1/\max(-u_0^{\prime})=\sqrt e/(\sqrt2\,a)\)`, tx`砕波の時刻 \(t^*=1/\max(-u_0^{\prime})=\sqrt e/(\sqrt2\,a)\)`), v: fmt(tb, 4), tone: 'key' },
        { k: T('state', '状態'), v: t < tb ? T('smooth, steepening', 'なめらか、切り立ちつつある') : T('a shock has formed', '衝撃波ができている'), tone: t < tb ? undefined : 'warn' },
        { k: T(tx`steepest slope \(|u_x|\)`, tx`最大の傾き \(|u_x|\)`), v: fmt(sMax, 3) },
        { k: T(tx`shock jump and Rankine–Hugoniot speed \(\tfrac12(u_L+u_R)\)`, tx`衝撃の飛びとランキン・ユゴニオの速さ \(\tfrac12(u_L+u_R)\)`), v: t > tb ? tx`\(${fmt(uL - uR, 3)},\ ${fmt((uL + uR) / 2, 3)}\)` : '–' },
      ], T('Viscosity never prevents the shock; it only sets its thickness. Halve ν and the front becomes twice as steep, but it sits in the same place and moves at the same speed, fixed by conservation of u alone.', '粘性は衝撃波を防ぐことはなく、その厚さを決めるだけです。ν を半分にすると前線は 2 倍急になりますが、同じ場所にあり同じ速さで動きます。それは u の保存だけで決まります。').replace(' ν ', tx` \(\nu\) `).replace(' u alone', tx` \(u\) alone`).replace(' u の', tx` \(u\) の`));
    },
  };

  /* ================= 3. Fermi-Pasta-Ulam-Tsingou: the recurrence ================= */
  const fCache = {};
  D['fput-recurrence'] = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const N = 32, key = `${v.alpha}|${v.amp}`, R = (fCache[key] ||= fput(N, v.alpha, v.amp, 16000, 0.1, 40));
      const nT = R.t.length, Etot = R.E[0].reduce((a, b) => a + b, 0);
      L.h('p', 'lab-cap', ctx.host, T('Thirty-two masses joined by slightly nonlinear springs, ends fixed, started in the smoothest mode. Fermi, Pasta, Ulam and Tsingou expected the energy to spread over all modes and stay spread. Instead it flows into a few modes and then comes almost all the way back.', 'わずかに非線形なばねでつながれた 32 個の質点です。両端は固定し、最もなめらかなモードから動かし始めます。フェルミ、パスタ、ウラム、ツィンゴウは、エネルギーがすべてのモードに広がり、広がったままになると予想しました。ところが実際には、いくつかのモードに流れ込んだあと、ほとんどすべてが戻ってきます。'));
      const ch = L.fig(ctx.host, { x: [0, N + 1], y: [-1.4, 1.4], aspect: 0.2, maxH: 150, axes: false, grid: false });
      L.h('p', 'lab-cap', ctx.host, T(tx`Energy in the first five normal modes \(E_k=\tfrac12(P_k^2+\omega_k^2Q_k^2)\), as a fraction of the total, over time. Mode 1 empties and refills; the gold cursor marks the moment drawn above.`, tx`最初の五つの基準モードのエネルギー \(E_k=\tfrac12(P_k^2+\omega_k^2Q_k^2)\) を、全体に対する割合で時間とともに描いています。モード 1 は空になってはまた満ちます。金色の線は、上に描いた瞬間を示します。`));
      const tmax = R.t[nT - 1], g = L.fig(ctx.host, { x: [0, tmax], y: [0, 1.02], aspect: 0.34, maxH: 280, xlabel: tx`\(t\)`, ylabel: tx`\(E_k/E\)` });
      const cols = ['c1', 'c2', 'c3', 'c4', 'muted'];
      for (let k = 1; k <= 5; k++) g.line(R.t.map((t, i) => [t, R.E[i][k] / Etot]), { c: cols[k - 1], w: k === 1 ? 2.4 : 1.6 });
      // the recurrence: the first maximum of E1 after it has dropped below half
      let dropped = false, best = 0, tRec = NaN;
      for (let i = 1; i < nT - 1; i++) { const e = R.E[i][1] / Etot; if (!dropped && e < 0.5) dropped = true; if (dropped && e > best && e > R.E[i - 1][1] / Etot && e >= R.E[i + 1][1] / Etot && e > 0.7) { best = e; tRec = R.t[i]; break; } }
      L.legend(ctx.host, [1, 2, 3, 4, 5].map((k) => ({ c: cols[k - 1], label: T(`mode ${k}`, `モード ${k}`) })));
      const period1 = (2 * PI) / R.omega[1];
      ctx.readout([
        { k: T(tx`mode-1 period \(2\pi/\omega_1\)`, tx`モード 1 の周期 \(2\pi/\omega_1\)`), v: fmt(period1, 4) },
        { k: T('recurrence time', '再帰の時刻'), v: Number.isFinite(tRec) ? tx`\(t\approx${fmt(tRec, 4)}\), ${fmt(tRec / period1, 3)} ${T('periods', '周期')}` : T('not within this run', 'この計算の範囲にはない'), tone: 'key' },
        { k: T('energy back in mode 1', 'モード 1 に戻ったエネルギー'), v: Number.isFinite(tRec) ? `${fmt(100 * best, 3)}%` : '–' },
      ], v.alpha === 0 ? T('With linear springs the modes are exactly independent: mode 1 keeps all its energy forever.', 'ばねが線形ならモードは厳密に独立で、モード 1 はいつまでもすべてのエネルギーを保ちます。')
        : T('The near-return is not equipartition failing by chance: the chain behaves almost like an integrable system, close to the KdV equation, whose solitons carry the energy around and bring it back.', 'ほぼ元に戻るのは偶然ではありません。この鎖はほとんど可積分系のように、KdV 方程式に近いふるまいをし、その孤立波がエネルギーを運び回して戻してくるのです。'));
      const drawAt = (i) => {
        ch.clear('main');
        const X = R.X[i], sc = 1 / Math.max(1e-9, v.amp);
        for (let j = 0; j <= N; j++) ch.line([[j, X[j] * sc], [j + 1, X[j + 1] * sc]], { c: 'muted', w: 1.4 });
        for (let j = 1; j <= N; j++) ch.circle(j, X[j] * sc, 0.32, { fill: 'c1', fo: 0.9, c: 'ink', w: 0.8 });
        ch.rect(-0.3, -1.4, 0.3, 2.8, { fill: 'muted', fo: 0.6, nostroke: true }); ch.rect(N + 1, -1.4, 0.3, 2.8, { fill: 'muted', fo: 0.6, nostroke: true });
        g.clear('over'); g.vline(R.t[i], { c: 'hl', w: 1.6, dash: null, layer: 'over' });
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, lab) => { const i = Math.min(nT - 1, Math.floor(t * 12)); drawAt(i); if (lab) L.setText(lab, tx`\(t=${fmt(R.t[i], 4)}\)`); return i < nT - 1; }, { initialT: Number.isFinite(tRec) ? R.t.indexOf(tRec) / 12 : 0, autoplay: false, once: true, playLabel: T('Play', '再生') });
    },
  };
})();
