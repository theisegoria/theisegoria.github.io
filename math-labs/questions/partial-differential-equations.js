'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig, frac, terms } = P.util;
  const PI = Math.PI;
  const r2 = (x) => Math.round(x * 100) / 100;

  /* ---------------- 1. heat equation ---------------- */
  // the lab: rod of length 10, initial bumps of height 1 at x = 3 and 0.45 at x = 7.2
  Q.heat = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([0.01, 0.02, 0.04, 0.05, 0.08, 0.1]), dx = r.pick([0.1, 0.2, 0.05, 0.25]);
        const dt = dx * dx / (2 * k);
        return {
          q: [`The explicit scheme $u_i^{n+1} = u_i^n + r(u_{i-1}^n - 2u_i^n + u_{i+1}^n)$ is stable only for $r = \\kappa\\Delta t/\\Delta x^2 \\le \\tfrac12$. With $\\kappa = ${n(k)}$ and $\\Delta x = ${n(dx)}$, what is the largest stable time step $\\Delta t$?`, `陽的差分法 $u_i^{n+1} = u_i^n + r(u_{i-1}^n - 2u_i^n + u_{i+1}^n)$ は $r = \\kappa\\Delta t/\\Delta x^2 \\le \\tfrac12$ のときだけ安定です。$\\kappa = ${n(k)}$、$\\Delta x = ${n(dx)}$ のとき、安定な最大の時間刻み $\\Delta t$ はいくつですか。`],
          a: { type: 'num', v: dt },
          hint: ['Set $r = \\tfrac12$ and solve for $\\Delta t$.', '$r = \\tfrac12$ とおいて $\\Delta t$ について解いてください。'],
          sol: [[`$\\Delta t = \\dfrac{\\Delta x^2}{2\\kappa} = \\dfrac{${n(dx * dx)}}{${n(2 * k)}} = ${n(dt)}$.`, `$\\Delta t = \\dfrac{\\Delta x^2}{2\\kappa} = \\dfrac{${n(dx * dx)}}{${n(2 * k)}} = ${n(dt)}$ です。`], ['Halving $\\Delta x$ forces a time step four times smaller: refining an explicit heat solver in space makes it much more expensive in time.', '$\\Delta x$ を半分にすると時間刻みは4分の1にしなければなりません。陽的な熱方程式の解法を空間方向に細かくすると、時間方向の計算量が大きく増えます。']],
          set: { kappa: k },
        };
      }
      if (form === 1) {
        const s = r.pick([0.2, 0.3, 0.4, 0.5]), k = r.pick([0.02, 0.04, 0.05, 0.1]), t = r.pick([5, 10, 20, 30, 40]);
        const w = Math.sqrt(s * s + 2 * k * t);
        return {
          q: [`A Gaussian warm spot of width $\\sigma = ${n(s)}$ sits in a long rod with diffusivity $\\kappa = ${n(k)}$. What is its width at $t = ${t}$? (Width grows as $\\sqrt{\\sigma^2 + 2\\kappa t}$.)`, `幅 $\\sigma = ${n(s)}$ のガウス型の暖かい点が、拡散係数 $\\kappa = ${n(k)}$ の長い棒にあります。$t = ${t}$ での幅はいくつですか（幅は $\\sqrt{\\sigma^2 + 2\\kappa t}$ のように広がります）。`],
          a: { type: 'num', v: w, tol: 0.002 },
          sol: [[`$\\sqrt{${n(s * s)} + 2\\cdot${n(k)}\\cdot${t}} = \\sqrt{${n(s * s + 2 * k * t)}} = ${n(w, 4)}$.`, `$\\sqrt{${n(s * s)} + 2\\cdot${n(k)}\\cdot${t}} = \\sqrt{${n(s * s + 2 * k * t)}} = ${n(w, 4)}$ です。`], ['Variances add: diffusion for time $t$ convolves the profile with a Gaussian of variance $2\\kappa t$. The peak height falls by the same factor the width grows, since the heat is conserved.', '分散が足し合わされます。時間 $t$ の拡散は分散 $2\\kappa t$ のガウス関数との畳み込みだからです。熱量は保存されるので、山の高さは幅が広がるのと同じ比で下がります。']],
          set: { kappa: k, time: t, bc: 0 },
        };
      }
      const Lr = r.pick([2, 4, 5, 8, 10]), Qh = r.pick([1.2, 1.554, 3, 0.8, 2.5, 6]);
      return {
        q: [`A rod of length $${Lr}$ with insulated ends holds total heat $\\int u\\,dx = ${n(Qh)}$. What temperature does it settle to?`, `両端が断熱された長さ $${Lr}$ の棒の総熱量が $\\int u\\,dx = ${n(Qh)}$ です。棒は最終的にどんな温度に落ち着きますか。`],
        a: { type: 'num', v: Qh / Lr },
        hint: ['With insulated ends no heat leaves, and the final state is uniform.', '断熱端では熱は逃げず、最終状態は一様です。'],
        sol: [['Insulated ends mean $u_x = 0$ there, so $\\tfrac{d}{dt}\\int u\\,dx = \\kappa[u_x]_0^L = 0$: the total is conserved.', '断熱端では $u_x = 0$ なので $\\tfrac{d}{dt}\\int u\\,dx = \\kappa[u_x]_0^L = 0$ となり、総量は保存されます。'], [`The only steady state is a constant, so it must be $${n(Qh)}/${Lr} = ${n(Qh / Lr)}$: the mean of the initial temperature.`, `定常状態は定数だけなので、それは $${n(Qh)}/${Lr} = ${n(Qh / Lr)}$、すなわち初期温度の平均です。`]],
        set: Lr === 10 && Qh === 1.554 ? { bc: 0, time: 40 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const m = r.int(1, 4), k = r.pick([0.02, 0.04, 0.05, 0.08, 0.1]);
        const lam = k * (m * PI / 10) ** 2;
        return {
          q: [`On the rod $0 \\le x \\le 10$ with both ends held at 0, the mode $\\sin(${m === 1 ? '' : m}\\pi x/10)$ decays like $e^{-\\lambda t}$. Find $\\lambda$ for $\\kappa = ${n(k)}$.`, `両端を 0 に保った棒 $0 \\le x \\le 10$ で、モード $\\sin(${m === 1 ? '' : m}\\pi x/10)$ は $e^{-\\lambda t}$ のように減衰します。$\\kappa = ${n(k)}$ のとき $\\lambda$ を求めてください。`],
          a: { type: 'num', v: lam, tol: Math.max(1e-5, lam * 0.004) },
          hint: ['Substitute $u = e^{-\\lambda t}\\sin(k x)$ into $u_t = \\kappa u_{xx}$.', '$u = e^{-\\lambda t}\\sin(k x)$ を $u_t = \\kappa u_{xx}$ に代入してください。'],
          sol: [[`$u_{xx} = -k^2 u$ with $k = ${m === 1 ? '' : m}\\pi/10$, so $-\\lambda u = -\\kappa k^2 u$ and $\\lambda = \\kappa k^2$.`, `$k = ${m === 1 ? '' : m}\\pi/10$ として $u_{xx} = -k^2 u$ なので、$-\\lambda u = -\\kappa k^2 u$、つまり $\\lambda = \\kappa k^2$ です。`], [`$\\lambda = ${n(k)}\\cdot(${m === 1 ? '' : m}\\pi/10)^2 = ${n(lam, 5)}$, a time constant of $1/\\lambda \\approx ${n(1 / lam, 3)}$.`, `$\\lambda = ${n(k)}\\cdot(${m === 1 ? '' : m}\\pi/10)^2 = ${n(lam, 5)}$ で、時定数は $1/\\lambda \\approx ${n(1 / lam, 3)}$ です。`], ['The rate grows as the square of the wavenumber, so wiggles die long before the broad hump does.', '減衰率は波数の2乗に比例するので、細かい凹凸はなだらかな山よりずっと早く消えます。']],
          set: { kappa: k, bc: 1 },
        };
      }
      if (form === 1) {
        const m = r.int(2, 6);
        return {
          q: [`With fixed ends, how many times faster does the mode $\\sin(${m}\\pi x/L)$ decay than the fundamental $\\sin(\\pi x/L)$?`, `固定端のとき、モード $\\sin(${m}\\pi x/L)$ は基本モード $\\sin(\\pi x/L)$ の何倍速く減衰しますか。`],
          a: { type: 'num', v: m * m },
          sol: [[`The decay rate of mode $m$ is $\\kappa(m\\pi/L)^2$, so the ratio is $m^2 = ${m * m}$.`, `モード $m$ の減衰率は $\\kappa(m\\pi/L)^2$ なので、比は $m^2 = ${m * m}$ です。`], ['That is why the sharp first bump in the figure flattens almost at once while the broad shape lingers: sharp features are made of high modes.', '図の鋭い最初の山がすぐに平らになり、なだらかな形が長く残るのはこのためです。鋭い形は高次のモードでできています。']],
        };
      }
      if (form === 2) {
        const rr = r.pick([0.1, 0.2, 0.25, 0.4, 0.5]), a = r.int(1, 9) / 10, b = r.int(1, 9) / 10, c = r.int(1, 9) / 10;
        const out = b + rr * (a - 2 * b + c);
        return {
          q: [`One explicit step with $r = ${n(rr)}$: neighbouring grid values are $u_{i-1} = ${n(a)}$, $u_i = ${n(b)}$, $u_{i+1} = ${n(c)}$. What is $u_i$ after the step?`, `$r = ${n(rr)}$ で陽的差分法を1ステップ進めます。隣り合う格子の値は $u_{i-1} = ${n(a)}$、$u_i = ${n(b)}$、$u_{i+1} = ${n(c)}$ です。ステップ後の $u_i$ はいくつですか。`],
          a: { type: 'num', v: out, tol: 1e-6 + Math.abs(out) * 1e-4 },
          sol: [[`The discrete curvature is $u_{i-1} - 2u_i + u_{i+1} = ${n(a)} - ${n(2 * b)} + ${n(c)} = ${n(a - 2 * b + c)}$.`, `離散的な曲率は $u_{i-1} - 2u_i + u_{i+1} = ${n(a)} - ${n(2 * b)} + ${n(c)} = ${n(a - 2 * b + c)}$ です。`], [`$u_i \\leftarrow ${n(b)} + ${n(rr)}\\cdot(${n(a - 2 * b + c)}) = ${n(out)}$.`, `$u_i \\leftarrow ${n(b)} + ${n(rr)}\\cdot(${n(a - 2 * b + c)}) = ${n(out)}$ です。`], [`${a - 2 * b + c < 0 ? 'The point sits above the average of its neighbours, so it cools.' : a - 2 * b + c > 0 ? 'The point sits below the average of its neighbours, so it warms.' : 'The point equals the average of its neighbours, so it does not change.'}`, `${a - 2 * b + c < 0 ? 'この点は隣の平均より高いので冷えます。' : a - 2 * b + c > 0 ? 'この点は隣の平均より低いので温まります。' : 'この点は隣の平均に等しいので変わりません。'}`]],
        };
      }
      const k = r.pick([0.02, 0.04, 0.05, 0.1]), f = r.pick([0.5, 0.25, 0.1, 0.01]);
      const lam = k * (PI / 10) ** 2, t = Math.log(1 / f) / lam;
      return {
        q: [`On the rod of length 10 with both ends held at 0 and $\\kappa = ${n(k)}$, how long does the fundamental mode take to fall to ${f === 0.5 ? 'half' : `a fraction $${n(f)}$`} of its amplitude?`, `長さ 10 の棒の両端を 0 に保ち、$\\kappa = ${n(k)}$ とします。基本モードの振幅が${f === 0.5 ? '半分' : `$${n(f)}$ 倍`}になるまでの時間はどれだけですか。`],
        a: { type: 'num', v: t, rel: 0.005 },
        hint: ['Solve $e^{-\\lambda_1 t} = f$ with $\\lambda_1 = \\kappa(\\pi/L)^2$.', '$\\lambda_1 = \\kappa(\\pi/L)^2$ として $e^{-\\lambda_1 t} = f$ を解いてください。'],
        sol: [[`$\\lambda_1 = ${n(k)}\\cdot(\\pi/10)^2 = ${n(lam, 5)}$.`, `$\\lambda_1 = ${n(k)}\\cdot(\\pi/10)^2 = ${n(lam, 5)}$ です。`], [`$t = \\ln(1/${n(f)})/\\lambda_1 = ${n(Math.log(1 / f), 4)}/${n(lam, 5)} = ${n(t, 4)}$.`, `$t = \\ln(1/${n(f)})/\\lambda_1 = ${n(Math.log(1 / f), 4)}/${n(lam, 5)} = ${n(t, 4)}$ です。`], ['Late in the run every higher mode has died, so the whole rod decays at this one slowest rate, keeping the shape of a single sine arch.', '時間が経つと高次のモードはすべて消えるので、棒全体がこの最も遅い率で減衰し、正弦波一山の形を保ちます。']],
        set: t <= 40 ? { kappa: k, bc: 1, time: Math.round(t) } : { kappa: k, bc: 1, time: 40 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const A = r.pick([1, 2, 3, -1]), m = r.pick([2, 3, 4]), B = r.pick([1, -1, 2, -2, 0.5]), k = r.pick([1, 0.5, 2]);
        const v = `${A}*sin(x)*exp(-${k}*t) + ${B}*sin(${m}*x)*exp(-${k * m * m}*t)`;
        return {
          q: [`Solve $u_t = ${k === 1 ? '' : n(k)}u_{xx}$ on $0 \\le x \\le \\pi$ with $u(0, t) = u(\\pi, t) = 0$ and $u(x, 0) = ${terms([[A, '\\sin x'], [B, `\\sin ${m}x`]])}$.`, `$0 \\le x \\le \\pi$ で $u(0, t) = u(\\pi, t) = 0$、$u(x, 0) = ${terms([[A, '\\sin x'], [B, `\\sin ${m}x`]])}$ のとき、$u_t = ${k === 1 ? '' : n(k)}u_{xx}$ を解いてください。`],
          a: { type: 'expr', v, vars: ['x', 't'], dom: { x: [0.3, 2.8], t: [0.05, 0.6] }, lhs: ['$u(x, t) =$', '$u(x, t) =$'] },
          hint: ['Each sine is a separated solution on its own; the equation is linear, so add them.', '各正弦関数はそれ自体で変数分離解です。方程式は線形なので足し合わせます。'],
          sol: [[`$\\sin(jx)e^{-\\lambda t}$ solves the equation when $\\lambda = ${k === 1 ? '' : n(k) + '\\,'}j^2$, and it vanishes at $x = 0, \\pi$.`, `$\\sin(jx)e^{-\\lambda t}$ は $\\lambda = ${k === 1 ? '' : n(k) + '\\,'}j^2$ のとき方程式を満たし、$x = 0, \\pi$ で 0 になります。`], [`So $u = ${terms([[A, `\\sin x\\,e^{-${n(k)}t}`], [B, `\\sin ${m}x\\,e^{-${n(k * m * m)}t}`]])}$.`, `よって $u = ${terms([[A, `\\sin x\\,e^{-${n(k)}t}`], [B, `\\sin ${m}x\\,e^{-${n(k * m * m)}t}`]])}$ です。`], [`The $\\sin ${m}x$ part decays ${m * m} times faster, so the solution soon looks like a single arch.`, `$\\sin ${m}x$ の部分は ${m * m} 倍速く減衰するので、解はすぐに一山の形になります。`]],
        };
      }
      if (form === 1) {
        const mat = r.pick([['copper', '銅', 1.11e-4], ['aluminium', 'アルミニウム', 9.7e-5], ['steel', '鋼', 1.2e-5], ['glass', 'ガラス', 3.4e-7]]);
        const s0 = r.pick([1, 2]) * 1e-2, s1 = r.pick([5, 10, 20]) * 1e-2;
        const t = (s1 * s1 - s0 * s0) / (2 * mat[2]);
        return {
          q: [`A hot spot of width ${n(s0 * 100)} cm in a long ${mat[0]} bar ($\\kappa = ${sig(mat[2], 2)}$ m²/s) spreads as a Gaussian. How many seconds until its width is ${n(s1 * 100)} cm?`, `長い${mat[1]}の棒（$\\kappa = ${sig(mat[2], 2)}$ m²/s）にある幅 ${n(s0 * 100)} cm の熱い点が、ガウス型のまま広がります。幅が ${n(s1 * 100)} cm になるのは何秒後ですか。`],
          a: { type: 'num', v: t, rel: 0.01, unit: ['s', '秒'] },
          hint: ['Invert $\\sigma(t)^2 = \\sigma_0^2 + 2\\kappa t$.', '$\\sigma(t)^2 = \\sigma_0^2 + 2\\kappa t$ を $t$ について解いてください。'],
          sol: [[`$t = \\dfrac{\\sigma_1^2 - \\sigma_0^2}{2\\kappa} = \\dfrac{${sig(s1 * s1, 3)} - ${sig(s0 * s0, 3)}}{2\\cdot ${sig(mat[2], 2)}}$.`, `$t = \\dfrac{\\sigma_1^2 - \\sigma_0^2}{2\\kappa} = \\dfrac{${sig(s1 * s1, 3)} - ${sig(s0 * s0, 3)}}{2\\cdot ${sig(mat[2], 2)}}$ です。`], [`$t \\approx ${sig(t, 3)}$ s.`, `$t \\approx ${sig(t, 3)}$ 秒です。`], ['Diffusion time scales with the square of the distance: twice as far takes four times as long, which is why heat crosses a thin wall quickly and a thick one slowly.', '拡散にかかる時間は距離の2乗に比例します。2倍の距離には4倍の時間がかかるので、熱は薄い壁はすぐに、厚い壁はゆっくり通り抜けます。']],
        };
      }
      const k = r.pick([0.04, 0.05, 0.08, 0.1]), t = r.pick([5, 10, 15, 20]);
      const ratio = Math.exp(-8 * k * (PI / 10) ** 2 * t);
      return {
        q: [`On the rod of length 10 with ends held at 0 and $\\kappa = ${n(k)}$, the modes $\\sin(\\pi x/10)$ and $\\sin(3\\pi x/10)$ start with equal amplitudes. By what factor has the ratio (mode 3)/(mode 1) shrunk at $t = ${t}$?`, `長さ 10 の棒の両端を 0 に保ち、$\\kappa = ${n(k)}$ とします。モード $\\sin(\\pi x/10)$ と $\\sin(3\\pi x/10)$ が同じ振幅で始まります。$t = ${t}$ で比（モード3）/（モード1）はいくつになっていますか。`],
        a: { type: 'num', v: ratio, rel: 0.01 },
        hint: ['Divide the two exponentials; only the difference of the rates matters.', '2つの指数関数を割り算します。効くのは減衰率の差だけです。'],
        sol: [[`The rates are $\\kappa(\\pi/10)^2$ and $9\\kappa(\\pi/10)^2$, differing by $8\\kappa(\\pi/10)^2 = ${n(8 * k * (PI / 10) ** 2, 5)}$.`, `減衰率は $\\kappa(\\pi/10)^2$ と $9\\kappa(\\pi/10)^2$ で、差は $8\\kappa(\\pi/10)^2 = ${n(8 * k * (PI / 10) ** 2, 5)}$ です。`], [`The ratio is $e^{-${n(8 * k * (PI / 10) ** 2, 5)}\\cdot ${t}} = ${n(ratio, 4)}$.`, `比は $e^{-${n(8 * k * (PI / 10) ** 2, 5)}\\cdot ${t}} = ${n(ratio, 4)}$ です。`], ['The heat equation smooths: whatever the start, the profile approaches the slowest mode, and finer detail is forgotten exponentially fast.', '熱方程式はならす働きをします。初期状態にかかわらず形は最も遅いモードに近づき、細かい形は指数関数的に速く忘れられます。']],
        set: { kappa: k, bc: 1, time: t },
      };
    },
  ];

  /* ---------------- 2. wave equation ---------------- */
  Q.wave = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.step(0.5, 2, 0.1), kind = r.int(0, 1);
        const v = kind ? 20 / c : 10 / c;
        return {
          q: [kind ? `The string in the figure has length 10 and wave speed $c = ${n(c)}$. After what time does it first return to its starting shape?` : `The string in the figure has length 10 and wave speed $c = ${n(c)}$. How long does a pulse take to cross it once?`, kind ? `図の弦は長さ 10、波速 $c = ${n(c)}$ です。弦が最初の形に初めて戻るのはいつですか。` : `図の弦は長さ 10、波速 $c = ${n(c)}$ です。パルスが弦を1回渡るのにかかる時間はどれだけですか。`],
          a: { type: 'num', v },
          sol: kind ? [[`Each half must travel to an end, back across, and to its start: a distance $2L = 20$.`, `それぞれの半分は端まで行き、反対側まで戻り、元の位置に帰ります。その距離は $2L = 20$ です。`], [`Time $= 2L/c = 20/${n(c)} = ${n(v)}$, with either type of end, since two reflections undo any sign change.`, `時間は $2L/c = 20/${n(c)} = ${n(v)}$ です。2回反射すると符号の変化が打ち消されるので、端の種類によりません。`]] : [[`Time $= L/c = 10/${n(c)} = ${n(v)}$.`, `時間は $L/c = 10/${n(c)} = ${n(v)}$ です。`], ['The shape of the pulse plays no part: in the wave equation every shape travels at the same speed $c$.', 'パルスの形は関係しません。波動方程式ではどんな形も同じ速さ $c$ で進みます。']],
          set: { c, time: Math.min(30, Math.round(v)) },
        };
      }
      if (form === 1) {
        const T = r.pick([40, 60, 70, 80, 100]), mu = r.pick([0.4, 0.6, 1, 2, 3.5]) * 1e-3;
        const c = Math.sqrt(T / mu);
        return {
          q: [`A guitar string is under tension $${T}$ N and has linear density $${n(mu * 1000)}$ g/m. What is the speed of waves on it?`, `ギターの弦の張力が $${T}$ N、線密度が $${n(mu * 1000)}$ g/m です。弦を伝わる波の速さはいくらですか。`],
          a: { type: 'num', v: c, rel: 0.005, unit: ['m/s', 'm/s'] },
          hint: ['$c = \\sqrt{T/\\mu}$, with $\\mu$ in kg/m.', '$c = \\sqrt{T/\\mu}$ で、$\\mu$ は kg/m で表します。'],
          sol: [[`$\\mu = ${sig(mu, 2)}$ kg/m, so $c = \\sqrt{${T}/${sig(mu, 2)}} = ${sig(c, 4)}$ m/s.`, `$\\mu = ${sig(mu, 2)}$ kg/m なので、$c = \\sqrt{${T}/${sig(mu, 2)}} = ${sig(c, 4)}$ m/s です。`], ['Tighter or lighter strings carry waves faster, which is why tuning up raises the pitch.', '張りが強いほど、また軽いほど波は速く伝わります。弦を締めると音が高くなるのはこのためです。']],
        };
      }
      const free = r.int(0, 1);
      return {
        q: [`An upward pulse on a string reaches a ${free ? 'free end (a ring sliding on a frictionless pole)' : 'fixed end (clamped)'}. What comes back?`, `弦の上向きのパルスが${free ? '自由端（摩擦のない棒に沿って滑る輪）' : '固定端（締め付けた端）'}に届きます。何が戻ってきますか。`],
        a: { type: 'choice', opts: [['An upward pulse', '上向きのパルス'], ['A downward pulse', '下向きのパルス'], ['Nothing: the pulse is absorbed', '何も戻らない（パルスは吸収される）']], v: free ? 0 : 1, fixed: true },
        hint: ['Ask what the end must do: stay at zero, or have zero slope.', '端が満たすべき条件を考えてください。変位が 0 か、傾きが 0 かです。'],
        sol: free ? [['A free end feels no transverse force, so the slope there is zero: $u_x = 0$.', '自由端には横向きの力が働かないので、そこでの傾きは 0、つまり $u_x = 0$ です。'], ['An even mirror image beyond the end keeps the slope zero, so the reflection has the same sign: an upward pulse returns, and the end swings to twice the height for a moment.', '端の外に偶関数的な鏡像を置けば傾きは 0 に保たれるので、反射波は同じ符号で、上向きのパルスが戻ります。端は一瞬、2倍の高さまで振れます。']] : [['A clamped end must stay at $u = 0$.', '締め付けた端は $u = 0$ のままでなければなりません。'], ['An inverted mirror image beyond the end cancels the pulse there at every moment, so the reflection is inverted: a downward pulse returns.', '端の外に反転した鏡像を置けば、端ではいつでも打ち消し合います。そのため反射波は反転し、下向きのパルスが戻ります。']],
        set: { ends: free, time: 10, c: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([1, 2, 0.5, 3]), x0 = r.pick([0, 0.5, 1, 1.5, 2]), t0 = r.pick([0.5, 1, 1.5, 2]);
        const F = (x) => 1 / (1 + x * x), u = 0.5 * (F(x0 - c * t0) + F(x0 + c * t0));
        return {
          q: [`An infinite string with $c = ${n(c)}$ is released from rest in the shape $u(x, 0) = \\dfrac{1}{1 + x^2}$. Find $u(${n(x0)}, ${n(t0)})$.`, `波速 $c = ${n(c)}$ の無限に長い弦を、形 $u(x, 0) = \\dfrac{1}{1 + x^2}$ で静かに放します。$u(${n(x0)}, ${n(t0)})$ を求めてください。`],
          a: { type: 'num', v: u, tol: 6e-4 },
          hint: ['Released from rest: $u = \\tfrac12[F(x - ct) + F(x + ct)]$.', '静かに放すので $u = \\tfrac12[F(x - ct) + F(x + ct)]$ です。'],
          sol: [[`$x - ct = ${n(x0 - c * t0)}$ and $x + ct = ${n(x0 + c * t0)}$.`, `$x - ct = ${n(x0 - c * t0)}$、$x + ct = ${n(x0 + c * t0)}$ です。`], [`$u = \\tfrac12\\left[${n(F(x0 - c * t0), 4)} + ${n(F(x0 + c * t0), 4)}\\right] = ${n(u, 4)}$.`, `$u = \\tfrac12\\left[${n(F(x0 - c * t0), 4)} + ${n(F(x0 + c * t0), 4)}\\right] = ${n(u, 4)}$ です。`], ['The value at a point depends only on the initial shape at the two feet of the characteristics $x \\pm ct$: information travels at exactly speed $c$.', 'ある点の値は、特性線 $x \\pm ct$ の2つの足での初期形状だけで決まります。情報はちょうど速さ $c$ で伝わります。']],
        };
      }
      if (form === 1) {
        const Ls = r.pick([0.65, 0.648, 0.33, 0.5]), f1 = r.pick([82.4, 110, 146.8, 196, 246.9, 329.6]), m = r.int(2, 5);
        const c = 2 * Ls * f1;
        return {
          q: [`A string of vibrating length $${n(Ls)}$ m, fixed at both ends, has fundamental $${n(f1)}$ Hz. What is the wave speed, and what is the frequency of harmonic $${m}$?`, `両端を固定した振動部分の長さ $${n(Ls)}$ m の弦の基本振動数が $${n(f1)}$ Hz です。波の速さと第 $${m}$ 倍音の振動数を求めてください。`],
          a: { type: 'tuple', v: [c, m * f1], labels: ['$c$ (m/s)', `$f_${m}$ (Hz)`], rel: 0.005 },
          hint: ['The fundamental fits half a wavelength between the ends.', '基本振動では両端の間に半波長が収まります。'],
          sol: [[`$\\lambda_1 = 2L = ${n(2 * Ls)}$ m, so $c = \\lambda_1 f_1 = ${n(c, 4)}$ m/s.`, `$\\lambda_1 = 2L = ${n(2 * Ls)}$ m なので $c = \\lambda_1 f_1 = ${n(c, 4)}$ m/s です。`], [`Mode $m$ fits $m$ half-wavelengths: $f_m = m c/(2L) = ${m}\\cdot${n(f1)} = ${n(m * f1)}$ Hz.`, `モード $m$ では半波長が $m$ 個収まるので $f_m = m c/(2L) = ${m}\\cdot${n(f1)} = ${n(m * f1)}$ Hz です。`], ['The overtones of an ideal string are exact integer multiples, which is what makes it sound pitched rather than clangy.', '理想的な弦の倍音は正確に整数倍で、そのため金属的な響きではなく音程のある音になります。']],
        };
      }
      // the lab: pulse centred at 3, right-moving half
      let c, t, pos, sign, free;
      do { c = r.step(0.5, 2, 0.1); t = r.int(1, 30); free = r.int(0, 1); let p = 3 + c * t; p = ((p % 20) + 20) % 20; sign = 1; if (p > 10) { p = 20 - p; sign = free ? 1 : -1; } pos = p; } while (pos < 0.8 || pos > 9.2 || Math.abs(pos - (((3 - c * t) % 20 + 20) % 20 > 10 ? 20 - ((3 - c * t) % 20 + 20) % 20 : ((3 - c * t) % 20 + 20) % 20)) < 1.5);
      const raw = 3 + c * t, bounces = Math.floor(raw / 10);
      return {
        q: [`In the figure the pulse starts centred at $x = 3$ on a string of length 10 with ${free ? 'free' : 'fixed'} ends and $c = ${n(c)}$. Where is the centre of the half that set off to the right at $t = ${t}$?`, `図ではパルスが長さ 10 の弦の $x = 3$ を中心に出発し、端は${free ? '自由端' : '固定端'}、$c = ${n(c)}$ です。右へ出発した半分の中心は $t = ${t}$ でどこにありますか。`],
        a: { type: 'num', v: pos, tol: 0.01 },
        hint: ['Unfold the reflections: move the centre to $3 + ct$ on a line, then fold back into $[0, 10]$ with period 20.', '反射を展開して考えます。中心を直線上で $3 + ct$ まで動かし、周期 20 で $[0, 10]$ に折り返してください。'],
        sol: [[`Unfolded, the centre is at $3 + ${n(c)}\\cdot${t} = ${n(raw)}$, after ${bounces} reflection${bounces === 1 ? '' : 's'}.`, `展開した直線上では中心は $3 + ${n(c)}\\cdot${t} = ${n(raw)}$ にあり、${bounces} 回反射しています。`], [`Folding back into the string gives $x = ${n(pos)}$.`, `弦の上に折り返すと $x = ${n(pos)}$ です。`], [free ? 'Free ends keep the sign, so it is still an upward bump there.' : `Each fixed end flips the sign, so after ${bounces} reflection${bounces === 1 ? '' : 's'} it is ${sign > 0 ? 'upright' : 'upside down'}.`, free ? '自由端では符号が保たれるので、そこにはまだ上向きの山があります。' : `固定端ごとに符号が反転するので、${bounces} 回の反射の後では${sign > 0 ? '上向き' : '下向き'}です。`]],
        set: { c, time: t, ends: free },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([1, 2, 3, 0.5]), k = r.pick([1, 2, 3]), c = r.pick([1, 2, 0.5, 3]);
        const amp = a / (k * c);
        const v = `${amp}*sin(${k}*x)*sin(${k * c}*t)`;
        return {
          q: [`An infinite string with $c = ${n(c)}$ starts flat, $u(x, 0) = 0$, with velocity $u_t(x, 0) = ${terms([[a, `\\cos ${k === 1 ? '' : k}x`]])}$. Find $u(x, t)$.`, `波速 $c = ${n(c)}$ の無限に長い弦が平らな状態 $u(x, 0) = 0$ から、速度 $u_t(x, 0) = ${terms([[a, `\\cos ${k === 1 ? '' : k}x`]])}$ で動き始めます。$u(x, t)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['x', 't'], dom: { x: [-2, 2], t: [0.1, 1.5] }, lhs: ['$u(x, t) =$', '$u(x, t) =$'] },
          hint: ['d\'Alembert with initial velocity $g$: $u = \\frac{1}{2c}\\int_{x-ct}^{x+ct} g(s)\\,ds$.', '初速度 $g$ に対するダランベールの公式は $u = \\frac{1}{2c}\\int_{x-ct}^{x+ct} g(s)\\,ds$ です。'],
          sol: [[`$\\int_{x-ct}^{x+ct} ${n(a)}\\cos(${k}s)\\,ds = \\tfrac{${n(a)}}{${k}}[\\sin(${k}(x + ct)) - \\sin(${k}(x - ct))] = \\tfrac{${n(2 * a)}}{${k}}\\sin(${k}x)\\sin(${n(k * c)}t)$.`, `$\\int_{x-ct}^{x+ct} ${n(a)}\\cos(${k}s)\\,ds = \\tfrac{${n(a)}}{${k}}[\\sin(${k}(x + ct)) - \\sin(${k}(x - ct))] = \\tfrac{${n(2 * a)}}{${k}}\\sin(${k}x)\\sin(${n(k * c)}t)$ です。`], [`Dividing by $2c = ${n(2 * c)}$: $u = ${n(amp, 4)}\\sin(${k}x)\\sin(${n(k * c)}t)$.`, `$2c = ${n(2 * c)}$ で割ると $u = ${n(amp, 4)}\\sin(${k}x)\\sin(${n(k * c)}t)$ です。`], ['Two travelling waves have combined into a standing wave: nodes where $\\sin(kx) = 0$ never move, and every point oscillates at angular frequency $kc$.', '2つの進行波が合わさって定常波になっています。$\\sin(kx) = 0$ となる節は動かず、各点は角振動数 $kc$ で振動します。']],
        };
      }
      if (form === 1) {
        let c; do { c = r.step(0.5, 2, 0.1); } while (Math.abs(20 / c - Math.round(20 / c)) > 1e-9 || 20 / c > 30);
        const T = 20 / c;
        return {
          q: [`On the figure's string (length 10, fixed ends), what wave speed $c$ makes the motion repeat with period $${n(T)}$?`, `図の弦（長さ 10、固定端）で、運動が周期 $${n(T)}$ で繰り返すのは波速 $c$ がいくつのときですか。`],
          a: { type: 'num', v: c },
          sol: [[`The motion repeats when each half has travelled $2L = 20$, so $T = 20/c$.`, `それぞれの半分が $2L = 20$ 進むと運動が繰り返すので、$T = 20/c$ です。`], [`$c = 20/${n(T)} = ${n(c)}$. Set it and scrub to $t = ${n(T)}$: the string is back in its starting shape.`, `$c = 20/${n(T)} = ${n(c)}$ です。これに設定して $t = ${n(T)}$ まで動かすと、弦は最初の形に戻っています。`]],
          set: { c, time: T, ends: 0 },
        };
      }
      const m = r.pick([2, 3, 4, 5]), j = r.pick([1, 2, 3]);
      return {
        q: [`A string fixed at both ends is plucked at $x = L/${m}$ and released. Which harmonics are missing from its sound?`, `両端を固定した弦を $x = L/${m}$ の位置ではじいて放します。音から欠けるのはどの倍音ですか。`],
        a: { type: 'choice', opts: [[`Every ${m === 2 ? 'second' : m === 3 ? 'third' : m + 'th'} harmonic: $${m}, ${2 * m}, ${3 * m}, \\dots$`, `$${m}, ${2 * m}, ${3 * m}, \\dots$ 番目の倍音`], [`Only harmonic $${m}$`, `第 $${m}$ 倍音だけ`], ['None: a pluck excites every harmonic', 'なし。はじくとすべての倍音が出る'], [`The harmonics below $${m}$`, `$${m}$ より低い倍音`]], v: 0 },
        hint: ['Mode $n$ has shape $\\sin(n\\pi x/L)$. Which modes have a node at the plucking point?', 'モード $n$ の形は $\\sin(n\\pi x/L)$ です。はじいた点に節があるのはどのモードでしょうか。'],
        sol: [[`The amplitude of mode $n$ is proportional to $\\sin(n\\pi/${m})$, the mode's own displacement at the plucking point.`, `モード $n$ の振幅は、はじいた点でのそのモード自身の変位 $\\sin(n\\pi/${m})$ に比例します。`], [`It vanishes exactly when $n$ is a multiple of $${m}$, so harmonics $${m}, ${2 * m}, \\dots$ are absent${j ? '' : ''}.`, `これは $n$ が $${m}$ の倍数のときにちょうど 0 になるので、第 $${m}, ${2 * m}, \\dots$ 倍音が欠けます。`], ['Guitarists use this: plucking near the middle kills the even harmonics and sounds round, plucking near the bridge keeps them and sounds bright.', 'ギター奏者はこれを使い分けます。中央付近ではじくと偶数倍音が消えて丸い音に、ブリッジ近くではじくと倍音が残って明るい音になります。']],
      };
    },
  ];

  /* ---------------- 3. Laplace's equation ---------------- */
  // potential at the readout's point P near (0.6, 0.6) with the electrodes in their starting places:
  // electrode A alone at potential 1, and electrode B alone at potential 1 (grid solution, walls at 0)
  const PA = 0.0806, PB = 0.3963;
  Q.laplace = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const vals = [r.int(-9, 9) / 10, r.int(-9, 9) / 10, r.int(-9, 9) / 10, r.int(-9, 9) / 10];
        const m = vals.reduce((s, x) => s + x, 0) / 4;
        return {
          q: [`On the relaxation grid, a free point's four neighbours hold $${vals.map((x) => n(x)).join(',\\ ')}$. What value does relaxation converge to at the point?`, `緩和法の格子で、ある自由な点の隣接4点の値が $${vals.map((x) => n(x)).join(',\\ ')}$ です。緩和法が収束したとき、その点の値はいくつですか。`],
          a: { type: 'num', v: m },
          sol: [['The discrete Laplace equation $V_{i-1,j} + V_{i+1,j} + V_{i,j-1} + V_{i,j+1} - 4V_{i,j} = 0$ says each value is the average of its neighbours.', '離散ラプラス方程式 $V_{i-1,j} + V_{i+1,j} + V_{i,j-1} + V_{i,j+1} - 4V_{i,j} = 0$ は、各値が隣接点の平均であることを表します。'], [`$V = (${vals.map((x) => n(x)).join(' + ')})/4 = ${n(m)}$, which is what the readout's neighbour-mean check confirms at P.`, `$V = (${vals.map((x) => n(x)).join(' + ')})/4 = ${n(m)}$ です。読み取り欄の P での隣接平均の確認はこのことを示しています。`]],
        };
      }
      if (form === 1) {
        const a = r.nz(-4, 4), b = r.nz(-4, 4), c = r.int(-3, 3);
        return {
          q: [`The potential is $V = ${terms([[a, 'x'], [b, 'y'], [c, '']])}$. What is the field strength $|\\mathbf E|$?`, `電位が $V = ${terms([[a, 'x'], [b, 'y'], [c, '']])}$ です。電場の強さ $|\\mathbf E|$ はいくつですか。`],
          a: { type: 'num', v: Math.hypot(a, b), show: Number.isInteger(Math.hypot(a, b)) ? undefined : `\\sqrt{${a * a + b * b}}` },
          sol: [[`$\\mathbf E = -\\nabla V = (${-a}, ${-b})$.`, `$\\mathbf E = -\\nabla V = (${-a}, ${-b})$ です。`], [`$|\\mathbf E| = \\sqrt{${a * a} + ${b * b}} = ${n(Math.hypot(a, b))}$. The field is uniform and points straight down the slope of $V$.`, `$|\\mathbf E| = \\sqrt{${a * a} + ${b * b}} = ${n(Math.hypot(a, b))}$ です。電場は一様で、$V$ の坂をまっすぐ下る向きです。`]],
        };
      }
      return {
        q: ['$V$ solves Laplace\'s equation inside a closed region. Where can $V$ reach its largest value?', '閉じた領域の内部で $V$ がラプラス方程式を満たします。$V$ が最大値をとりうるのはどこですか。'],
        a: { type: 'choice', opts: [['Only on the boundary (here, an electrode or a wall)', '境界上だけ（ここでは電極か壁）'], ['At a point inside where $\\nabla V = 0$', '内部の $\\nabla V = 0$ となる点'], ['Anywhere: it depends on the boundary values', 'どこでもよい（境界値しだい）'], ['At the centre of the region', '領域の中心']], v: 0 },
        hint: ['Use the mean-value property: could a point be larger than the average around it?', '平均値の性質を使います。ある点がまわりの平均より大きくなれるでしょうか。'],
        sol: [['Each value is the average over any circle around it, so an interior maximum would force $V$ to be constant near it.', '各値はそのまわりのどの円の上の平均にも等しいので、内部に最大値があれば、その近くで $V$ は定数になってしまいます。'], ['So the maximum (and minimum) lie on the boundary. A point where $\\nabla V = 0$ inside is a saddle, as between two positive electrodes.', 'したがって最大値（と最小値）は境界上にあります。内部で $\\nabla V = 0$ となる点は鞍点で、2つの正の電極の間がその例です。']],
        set: { left: 1, right: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.nz(-4, 4), b = r.int(-5, 5), d = r.nz(-3, 3), e = r.int(-3, 3);
        return {
          q: [`For which $c$ is $V = ${terms([[a, 'x^2'], [b, 'xy'], ['c', 'y^2'], [d, 'x'], [e, 'y']])}$ harmonic ($\\nabla^2 V = 0$)?`, `$V = ${terms([[a, 'x^2'], [b, 'xy'], ['c', 'y^2'], [d, 'x'], [e, 'y']])}$ が調和関数（$\\nabla^2 V = 0$）となる $c$ を求めてください。`],
          a: { type: 'num', v: -a },
          sol: [[`$V_{xx} = ${2 * a}$ and $V_{yy} = 2c$; the $xy$ and linear terms contribute nothing.`, `$V_{xx} = ${2 * a}$、$V_{yy} = 2c$ で、$xy$ の項と1次の項は寄与しません。`], [`$${2 * a} + 2c = 0$ gives $c = ${-a}$: the surface bends up one way exactly as much as it bends down the other, a saddle.`, `$${2 * a} + 2c = 0$ より $c = ${-a}$ です。曲面は一方向に上がるのとちょうど同じだけ他方向に下がり、鞍の形になります。`]],
        };
      }
      if (form === 1) {
        const a = r.pick([1, 2, 3]), b = r.pick([1, 2]), V0 = r.pick([1, 5, 10, 100]);
        const x = a / 2, y = b / 2, V = V0 * Math.sin(PI * x / a) * Math.sinh(PI * y / a) / Math.sinh(PI * b / a);
        return {
          q: [`In the rectangle $0 \\le x \\le ${a}$, $0 \\le y \\le ${b}$ three sides are grounded and the top is held at $V = ${V0}\\sin(\\pi x/${a === 1 ? 1 : a})$. Find $V$ at the centre.`, `長方形 $0 \\le x \\le ${a}$、$0 \\le y \\le ${b}$ の3辺を接地し、上の辺を $V = ${V0}\\sin(\\pi x/${a === 1 ? 1 : a})$ に保ちます。中心での $V$ を求めてください。`],
          a: { type: 'num', v: V, rel: 0.003 },
          hint: ['Try $V = A\\sin(\\pi x/a)\\sinh(\\pi y/a)$: it is harmonic and vanishes on three sides.', '$V = A\\sin(\\pi x/a)\\sinh(\\pi y/a)$ を試してください。調和関数で、3辺で 0 になります。'],
          sol: [[`Matching the top edge: $A = ${V0}/\\sinh(\\pi\\cdot${b}/${a}) = ${n(V0 / Math.sinh(PI * b / a), 4)}$.`, `上の辺に合わせると $A = ${V0}/\\sinh(\\pi\\cdot${b}/${a}) = ${n(V0 / Math.sinh(PI * b / a), 4)}$ です。`], [`At $(${n(x)}, ${n(y)})$: $V = A\\cdot 1\\cdot\\sinh(\\pi\\cdot${n(y)}/${a}) = ${n(V, 4)}$.`, `$(${n(x)}, ${n(y)})$ では $V = A\\cdot 1\\cdot\\sinh(\\pi\\cdot${n(y)}/${a}) = ${n(V, 4)}$ です。`], ['The centre gets well under half the top value: the influence of a boundary wiggle dies off exponentially with distance from it.', '中心の値は上の辺の値の半分を大きく下回ります。境界の凹凸の影響は、境界からの距離とともに指数関数的に弱まります。']],
        };
      }
      const a = r.step(-1, 1, 0.1), b = r.step(-1, 1, 0.1);
      const V = a * PA + b * PB;
      return {
        q: [`With the electrodes in their starting places, the readout's point P has $V = ${PA}$ when A is at 1 and B at 0, and $V = ${PB}$ when A is at 0 and B at 1. What is $V$ at P when A is at $${n(a)}$ and B at $${n(b)}$?`, `電極が初期位置にあるとき、読み取り欄の点 P の電位は、A が 1、B が 0 なら $V = ${PA}$、A が 0、B が 1 なら $V = ${PB}$ です。A が $${n(a)}$、B が $${n(b)}$ のとき、P での $V$ はいくつですか。`],
        a: { type: 'num', v: V, tol: 0.002 },
        hint: ['Laplace\'s equation and the boundary conditions are linear in the electrode potentials.', 'ラプラス方程式と境界条件は、電極の電位について線形です。'],
        sol: [['Superposition: the solution for potentials $(a, b)$ is $a$ times the A-alone solution plus $b$ times the B-alone solution.', '重ね合わせ：電位 $(a, b)$ に対する解は、A だけの解の $a$ 倍と B だけの解の $b$ 倍の和です。'], [`$V_P = ${n(a)}\\cdot${PA} + ${n(b)}\\cdot${PB} = ${n(V, 4)}$. Set the sliders and compare with the readout.`, `$V_P = ${n(a)}\\cdot${PA} + ${n(b)}\\cdot${PB} = ${n(V, 4)}$ です。スライダーを設定して読み取り欄と比べてください。`]],
        set: { left: a, right: b },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const r1 = r.pick([1, 2]), r2 = r1 * r.pick([2, 3, 4, 5]), V1 = r.pick([1, 5, 10, 12]);
        const v = `${V1}*ln(${r2}/r)/ln(${r2 / r1})`;
        return {
          q: [`Between two long coaxial cylinders the potential depends only on $r$. The inner one ($r = ${r1}$) is at $${V1}$ and the outer one ($r = ${r2}$) is grounded. Find $V(r)$.`, `長い同軸円筒の間では電位は $r$ だけによります。内側（$r = ${r1}$）を $${V1}$、外側（$r = ${r2}$）を接地します。$V(r)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['r'], dom: { r: [r1, r2] }, lhs: ['$V(r) =$', '$V(r) =$'] },
          hint: ['In the plane, the radial solutions of $\\nabla^2 V = 0$ are $A + B\\ln r$.', '平面では $\\nabla^2 V = 0$ の動径方向だけの解は $A + B\\ln r$ です。'],
          sol: [['$\\nabla^2 V = \\frac1r(rV\')\' = 0$ gives $rV\' = $ const, so $V = A + B\\ln r$.', '$\\nabla^2 V = \\frac1r(rV\')\' = 0$ より $rV\'$ は定数で、$V = A + B\\ln r$ です。'], [`$V(${r2}) = 0$ and $V(${r1}) = ${V1}$ give $V = ${V1}\\,\\dfrac{\\ln(${r2}/r)}{\\ln ${r2 / r1}}$.`, `$V(${r2}) = 0$、$V(${r1}) = ${V1}$ より $V = ${V1}\\,\\dfrac{\\ln(${r2}/r)}{\\ln ${r2 / r1}}$ です。`], ['The field $|E| = ' + V1 + '/(r\\ln ' + (r2 / r1) + ')$ falls like $1/r$, the field of a line charge: that logarithm is why the potential near the small electrodes in the figure rises so steeply.', '電場 $|E| = ' + V1 + '/(r\\ln ' + (r2 / r1) + ')$ は線電荷の電場と同じく $1/r$ で減ります。図の小さな電極の近くで電位が急に立ち上がるのは、この対数のためです。']],
        };
      }
      if (form === 1) {
        const m = r.int(1, 4), A = r.pick([1, 2, 3, 5]);
        return {
          q: [`Find the solution of $\\nabla^2 V = 0$ in the half-strip $0 < x < \\pi$, $y > 0$ with $V = 0$ on the sides $x = 0, \\pi$, $V(x, 0) = ${A === 1 ? '' : A}\\sin ${m === 1 ? '' : m}x$, and $V$ bounded as $y \\to \\infty$.`, `半帯領域 $0 < x < \\pi$、$y > 0$ で、側面 $x = 0, \\pi$ で $V = 0$、$V(x, 0) = ${A === 1 ? '' : A}\\sin ${m === 1 ? '' : m}x$、$y \\to \\infty$ で有界となる $\\nabla^2 V = 0$ の解を求めてください。`],
          a: { type: 'expr', v: `${A}*sin(${m}*x)*exp(-${m}*y)`, vars: ['x', 'y'], dom: { x: [0.2, 3], y: [0.1, 1.5] }, lhs: ['$V(x, y) =$', '$V(x, y) =$'] },
          hint: ['Separate: $V = X(x)Y(y)$ with $X = \\sin(mx)$. What must $Y$ satisfy?', '変数分離 $V = X(x)Y(y)$、$X = \\sin(mx)$ とします。$Y$ が満たすべき式は何でしょうか。'],
          sol: [[`$X'' = -${m * m}X$ forces $Y'' = ${m * m}Y$, so $Y = Ae^{-${m}y} + Be^{${m}y}$.`, `$X'' = -${m * m}X$ より $Y'' = ${m * m}Y$ となり、$Y = Ae^{-${m}y} + Be^{${m}y}$ です。`], [`Boundedness kills the growing exponential, and the bottom edge fixes $A = ${A}$: $V = ${A === 1 ? '' : A}\\sin(${m === 1 ? '' : m}x)e^{-${m === 1 ? '' : m}y}$.`, `有界性から増大する指数関数は除かれ、下の辺から $A = ${A}$ です。$V = ${A === 1 ? '' : A}\\sin(${m === 1 ? '' : m}x)e^{-${m === 1 ? '' : m}y}$ となります。`], ['A boundary pattern of wavelength $2\\pi/m$ is felt only to a depth of about $1/m$: fine detail on an electrode is invisible from far away.', '波長 $2\\pi/m$ の境界の模様は深さ約 $1/m$ までしか感じられません。電極の細かな形は遠くからは見えません。']],
        };
      }
      let a, b; do { a = r.step(-1, 1, 0.1); b = r.step(-1, 1, 0.1); } while (Math.abs(b) < 0.05);
      const target = r.int(-3, 3) / 10;
      const bb = (target - a * PA) / PB;
      if (Math.abs(bb) <= 1) {
        const bset = Math.round(bb * 10) / 10;
        return {
          q: [`With the electrodes in their starting places, P has $V = ${PA}$ for (A, B) = (1, 0) and $V = ${PB}$ for (0, 1). Electrode A is at $${n(a)}$. What potential on B makes $V = ${n(target)}$ at P?`, `電極が初期位置にあるとき、P の電位は (A, B) = (1, 0) で $V = ${PA}$、(0, 1) で $V = ${PB}$ です。電極 A は $${n(a)}$ です。P で $V = ${n(target)}$ となる B の電位を求めてください。`],
          a: { type: 'num', v: bb, tol: 0.005 },
          hint: ['Write $V_P$ as a linear function of the two electrode potentials and solve for the second.', '$V_P$ を2つの電極の電位の線形関数として書き、2つ目について解いてください。'],
          sol: [[`$V_P = ${n(a)}\\cdot${PA} + V_B\\cdot${PB} = ${n(target)}$.`, `$V_P = ${n(a)}\\cdot${PA} + V_B\\cdot${PB} = ${n(target)}$ です。`], [`$V_B = (${n(target)} - ${n(a * PA, 4)})/${PB} = ${n(bb, 4)}$. P is nearer B, so B's potential weighs about ${Math.round(PB / PA)} times as much as A's.`, `$V_B = (${n(target)} - ${n(a * PA, 4)})/${PB} = ${n(bb, 4)}$ です。P は B に近いので、B の電位は A の電位の約 ${Math.round(PB / PA)} 倍の重みをもちます。`]],
          set: { left: a, right: bset },
        };
      }
      return {
        q: ['Two electrodes in the grounded box are both held at $V = +1$. What does the potential look like on the segment between them?', '接地された箱の中の2つの電極を、どちらも $V = +1$ に保ちます。電極の間の線分上で電位はどうなっていますか。'],
        a: { type: 'choice', opts: [['It dips to a minimum that is a saddle point of $V$', '極小値まで下がり、そこは $V$ の鞍点'], ['It stays exactly 1 all along', '全体でちょうど 1 のまま'], ['It dips to a local minimum of $V$ in the plane', '平面内での $V$ の極小値まで下がる'], ['It rises above 1 midway', '中間で 1 を超える']], v: 0 },
        hint: ['Along the segment $V$ must dip, since the walls pull it down. Now look across the segment.', '壁が電位を下げるので、線分に沿って $V$ は下がるはずです。次に線分と直交する方向を見てください。'],
        sol: [['Along the segment, $V$ falls from 1 and rises back to 1, so it has a minimum there; it cannot exceed 1 by the maximum principle.', '線分に沿って $V$ は 1 から下がり、また 1 に戻るので、そこに極小があります。最大値の原理により 1 を超えることはありません。'], ['Across the segment, $V$ falls toward the walls, so that point is a maximum in the other direction: a saddle. A harmonic function has no interior local minimum.', '線分と直交する方向には $V$ は壁に向かって下がるので、その点は別の方向には極大になっています。つまり鞍点です。調和関数は内部に極小をもちません。']],
        set: { left: 1, right: 1 },
      };
    },
  ];
})();
