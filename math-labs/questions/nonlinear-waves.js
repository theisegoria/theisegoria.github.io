'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI;

  /* ---------------- kdv-solitons ---------------- */
  Q['kdv-solitons'] = [
    (r) => {
      const form = r.int(0, 2), k = r.step(0.6, 2, 0.1);
      if (form === 0) return {
        q: [`A KdV soliton $u = \\frac{k^2}{2}\\operatorname{sech}^2\\frac{k(x - k^2t)}{2}$ has $k = ${n(k, 1)}$. What is its speed?`, `KdV のソリトン $u = \\frac{k^2}{2}\\operatorname{sech}^2\\frac{k(x - k^2t)}{2}$ で $k = ${n(k, 1)}$ です。速さはいくらですか。`],
        a: { type: 'num', v: k * k, rel: 0.003 },
        hint: ['The argument is $x - k^2t$.', '引数は $x - k^2t$ です。'],
        sol: [[`The profile depends on $x - k^2t$, so it moves at $c = k^2$.`, `形は $x - k^2t$ に依存するので、速さ $c = k^2$ で動きます。`], [`$c = ${n(k, 1)}^2 = ${n(k * k, 3)}$.`, `$c = ${n(k, 1)}^2 = ${n(k * k, 3)}$ です。`]],
        set: { k1: k },
      };
      if (form === 1) return {
        q: [`What is the height of the KdV soliton with $k = ${n(k, 1)}$?`, `$k = ${n(k, 1)}$ の KdV ソリトンの高さはいくらですか。`],
        a: { type: 'num', v: (k * k) / 2, rel: 0.003 },
        hint: ['$\\operatorname{sech}0 = 1$.', '$\\operatorname{sech}0 = 1$ です。'],
        sol: [[`At the center $\\operatorname{sech}^2 0 = 1$, so the height is $k^2/2$.`, `中心では $\\operatorname{sech}^2 0 = 1$ なので、高さは $k^2/2$ です。`], [`$${n(k * k, 3)}/2 = ${n((k * k) / 2, 4)}$, half its speed.`, `$${n(k * k, 3)}/2 = ${n((k * k) / 2, 4)}$ で、速さの半分です。`]],
        set: { k1: k },
      };
      const h = r.step(0.2, 1.8, 0.1), c = 2 * h;
      return {
        q: [`A KdV soliton has height $${n(h, 1)}$. How fast does it travel?`, `高さ $${n(h, 1)}$ の KdV ソリトンはどれだけの速さで進みますか。`],
        a: { type: 'num', v: c, rel: 0.003 },
        hint: ['Height $k^2/2$, speed $k^2$.', '高さは $k^2/2$、速さは $k^2$ です。'],
        sol: [['Height and speed are both fixed by $k$: speed $= k^2 = 2\\times$ height.', '高さも速さも $k$ で決まり、速さ $= k^2 = 2\\times$ 高さ です。'], [`$c = 2 \\times ${n(h, 1)} = ${n(c, 2)}$.`, `$c = 2 \\times ${n(h, 1)} = ${n(c, 2)}$ です。`]],
      };
    },
    (r) => {
      const k1 = r.step(1, 2, 0.1), k2 = r.step(0.4, Math.min(1.5, Math.round((k1 - 0.2) * 10) / 10), 0.1), lg = Math.log((k1 + k2) / (k1 - k2)), which = r.int(0, 2);
      if (which === 2) {
        const A = ((k1 - k2) / (k1 + k2)) ** 2;
        return {
          q: [`For $k_1 = ${n(k1, 1)}$, $k_2 = ${n(k2, 1)}$, what is the interaction coefficient $A = \\bigl(\\frac{k_1 - k_2}{k_1 + k_2}\\bigr)^2$? Four decimals.`, `$k_1 = ${n(k1, 1)}$、$k_2 = ${n(k2, 1)}$ のとき、相互作用の係数 $A = \\bigl(\\frac{k_1 - k_2}{k_1 + k_2}\\bigr)^2$ はいくらですか。小数第 4 位まで答えてください。`],
          a: { type: 'num', v: A, tol: 0.00006 },
          hint: ['Substitute directly.', 'そのまま代入します。'],
          sol: [[`$(${n(k1 - k2, 1)}/${n(k1 + k2, 1)})^2$.`, `$(${n(k1 - k2, 1)}/${n(k1 + k2, 1)})^2$ です。`], [`$A = ${n(A, 5)}$; the smaller $A$, the larger the phase shifts $\\frac{1}{k_i}\\ln\\frac1A$.`, `$A = ${n(A, 5)}$ です。$A$ が小さいほど位相のずれ $\\frac{1}{k_i}\\ln\\frac1A$ は大きくなります。`]],
          set: { k1, k2 },
        };
      }
      const v = which === 0 ? (2 / k1) * lg : (2 / k2) * lg;
      return {
        q: [`Solitons with $k_1 = ${n(k1, 1)}$ and $k_2 = ${n(k2, 1)}$ collide. By how much is the ${which === 0 ? 'fast one shifted forward' : 'slow one shifted back'}?`, `$k_1 = ${n(k1, 1)}$ と $k_2 = ${n(k2, 1)}$ のソリトンが衝突します。${which === 0 ? '速いほうはどれだけ前へ' : '遅いほうはどれだけ後ろへ'}ずれますか。`],
        a: { type: 'num', v, rel: 0.004 },
        hint: ['$\\delta_i = \\frac{2}{k_i}\\ln\\frac{k_1 + k_2}{k_1 - k_2}$.', '$\\delta_i = \\frac{2}{k_i}\\ln\\frac{k_1 + k_2}{k_1 - k_2}$ です。'],
        sol: [[`$\\ln\\frac{${n(k1 + k2, 1)}}{${n(k1 - k2, 1)}} = ${n(lg, 4)}$.`, `$\\ln\\frac{${n(k1 + k2, 1)}}{${n(k1 - k2, 1)}} = ${n(lg, 4)}$ です。`], [`$\\frac{2}{${n(which === 0 ? k1 : k2, 1)}} \\times ${n(lg, 4)} = ${n(v, 4)}$.`, `$\\frac{2}{${n(which === 0 ? k1 : k2, 1)}} \\times ${n(lg, 4)} = ${n(v, 4)}$ です。`]],
        set: { k1, k2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([1, 1.5, 2]);
        return {
          q: [`Write the KdV soliton with $k = ${k}$ as a function of $x$ at $t = 0$.`, `$k = ${k}$ の KdV ソリトンを $t = 0$ で $x$ の関数として書いてください。`],
          a: { type: 'expr', v: `${(k * k) / 2}/cosh(${k / 2}*x)^2`, vars: ['x'], dom: { x: [-2, 2] }, lhs: ['$u(x, 0) =$', '$u(x, 0) =$'] },
          hint: ['$\\frac{k^2}{2}\\operatorname{sech}^2\\frac{kx}{2}$.', '$\\frac{k^2}{2}\\operatorname{sech}^2\\frac{kx}{2}$ です。'],
          sol: [[`Put $t = 0$: $u = \\frac{k^2}{2}\\operatorname{sech}^2(kx/2)$.`, `$t = 0$ とおくと $u = \\frac{k^2}{2}\\operatorname{sech}^2(kx/2)$ です。`], [`With $k = ${k}$: $${n((k * k) / 2, 3)}/\\cosh^2(${n(k / 2, 2)}x)$.`, `$k = ${k}$ では $${n((k * k) / 2, 3)}/\\cosh^2(${n(k / 2, 2)}x)$ です。`]],
        };
      }
      if (form === 1) {
        const c = r.pick([0.5, 1, 2, 3]), k = Math.sqrt(c), w = 2 / k;
        return {
          q: [`A KdV soliton moves at speed $${c}$. Its profile is $\\operatorname{sech}^2(x/w)$ in shape: what is $w$?`, `速さ $${c}$ で動く KdV ソリトンの形は $\\operatorname{sech}^2(x/w)$ です。$w$ はいくらですか。`],
          a: { type: 'num', v: w, rel: 0.003, show: `2/\\sqrt{${c}}` },
          hint: ['Speed $k^2$ gives $k$; the argument is $kx/2$.', '速さ $k^2$ から $k$ がわかり、引数は $kx/2$ です。'],
          sol: [[`$k = \\sqrt{${c}} = ${n(k, 4)}$, and $\\operatorname{sech}^2(kx/2)$ means $w = 2/k$.`, `$k = \\sqrt{${c}} = ${n(k, 4)}$ で、$\\operatorname{sech}^2(kx/2)$ なので $w = 2/k$ です。`], [`$w = ${n(w, 4)}$: faster solitons are narrower.`, `$w = ${n(w, 4)}$ です。速いソリトンほど細くなります。`]],
        };
      }
      const k1 = r.step(1.2, 2, 0.1), k2 = r.step(0.4, 1, 0.1), ratio = k1 / k2;
      return {
        q: [`In a collision of solitons with $k_1 = ${n(k1, 1)}$ and $k_2 = ${n(k2, 1)}$, what is the ratio of the slow soliton's shift to the fast one's?`, `$k_1 = ${n(k1, 1)}$ と $k_2 = ${n(k2, 1)}$ のソリトンの衝突で、遅いソリトンのずれと速いソリトンのずれの比はいくらですか。`],
        a: { type: 'num', v: ratio, rel: 0.003, show: `k_1/k_2` },
        hint: ['Both shifts share the logarithm.', '二つのずれは対数を共有しています。'],
        sol: [['$\\delta_2/\\delta_1 = \\frac{2/k_2}{2/k_1} = k_1/k_2$.', '$\\delta_2/\\delta_1 = \\frac{2/k_2}{2/k_1} = k_1/k_2$ です。'], [`$= ${n(ratio, 4)}$: the slow, broad soliton is displaced more.`, `$= ${n(ratio, 4)}$ で、遅く幅の広いソリトンのほうが大きくずれます。`]],
        ...(k1 > k2 + 0.05 ? { set: { k1, k2 } } : {}),
      };
    },
  ];

  /* ---------------- burgers-shock ---------------- */
  const tb = (a) => Math.exp(0.5) / (Math.SQRT2 * a);
  Q['burgers-shock'] = [
    (r) => {
      const form = r.int(0, 1), s = r.step(-2, 2, 0.5), a = r.step(0.5, 2, 0.5), t = r.step(0.5, 3, 0.5), u0 = a * Math.exp(-s * s);
      if (form === 0) return {
        q: [`For $u_t + uu_x = 0$ with $u_0(x) = ${n(a, 1)}e^{-x^2}$, where is the characteristic starting at $s = ${n(s, 1)}$ at time $t = ${n(t, 1)}$?`, `$u_0(x) = ${n(a, 1)}e^{-x^2}$ の $u_t + uu_x = 0$ で、$s = ${n(s, 1)}$ から出る特性曲線は時刻 $t = ${n(t, 1)}$ にどこにありますか。`],
        a: { type: 'num', v: s + u0 * t, tol: 0.002 },
        hint: ['$x = s + u_0(s)t$.', '$x = s + u_0(s)t$ です。'],
        sol: [[`$u_0(${n(s, 1)}) = ${n(u0, 4)}$.`, `$u_0(${n(s, 1)}) = ${n(u0, 4)}$ です。`], [`$x = ${n(s, 1)} + ${n(u0, 4)} \\times ${n(t, 1)} = ${n(s + u0 * t, 4)}$.`, `$x = ${n(s, 1)} + ${n(u0, 4)} \\times ${n(t, 1)} = ${n(s + u0 * t, 4)}$ です。`]],
        set: { a, t },
      };
      const uL = r.step(0.2, 2, 0.1), uR = r.step(0, Math.round((uL - 0.1) * 10) / 10, 0.1);
      return {
        q: [`A Burgers shock has $u_L = ${n(uL, 1)}$ behind it and $u_R = ${n(uR, 1)}$ ahead. How fast does it move?`, `バーガース方程式の衝撃波の後ろは $u_L = ${n(uL, 1)}$、前は $u_R = ${n(uR, 1)}$ です。衝撃波はどれだけの速さで動きますか。`],
        a: { type: 'num', v: (uL + uR) / 2, tol: 0.002 },
        hint: ['Rankine–Hugoniot: the average.', 'ランキン・ユゴニオ：平均です。'],
        sol: [['$s = \\frac{u_L + u_R}{2}$ from conservation of $\\int u\\,dx$.', '$\\int u\\,dx$ の保存から $s = \\frac{u_L + u_R}{2}$ です。'], [`$s = ${n((uL + uR) / 2, 3)}$.`, `$s = ${n((uL + uR) / 2, 3)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.step(0.5, 2, 0.05);
        return {
          q: [`When does the hump $u_0 = ${n(a, 2)}e^{-x^2}$ first break under $u_t + uu_x = 0$?`, `山 $u_0 = ${n(a, 2)}e^{-x^2}$ は $u_t + uu_x = 0$ のもとでいつ最初に砕けますか。`],
          a: { type: 'num', v: tb(a), rel: 0.003, show: `\\frac{\\sqrt e}{\\sqrt2\\,${n(a, 2)}}` },
          hint: ['$t^* = 1/\\max(-u_0^{\\prime})$; the steepest point is at $x = 1/\\sqrt2$.', '$t^* = 1/\\max(-u_0^{\\prime})$ で、最も急な点は $x = 1/\\sqrt2$ です。'],
          sol: [[`$-u_0^{\\prime} = 2ax e^{-x^2}$ is largest at $x = 1/\\sqrt2$, where it equals $\\sqrt2\\,a\\,e^{-1/2} = ${n(1 / tb(a), 4)}$.`, `$-u_0^{\\prime} = 2ax e^{-x^2}$ は $x = 1/\\sqrt2$ で最大になり、そこで $\\sqrt2\\,a\\,e^{-1/2} = ${n(1 / tb(a), 4)}$ です。`], [`$t^* = ${n(tb(a), 4)}$.`, `$t^* = ${n(tb(a), 4)}$ です。`]],
          set: { a, t: Math.min(4, Math.round(tb(a) * 100) / 100) },
        };
      }
      const m = r.pick([0.5, 1, 2, 4]), u = r.pick([1, 2]);
      return {
        q: [`For the initial ramp $u_0(x) = ${u} - ${n(m, 1)}x$ on $0 \\le x \\le ${n(u / m, 2)}$, when do all characteristics from the ramp meet?`, `初めの斜面 $u_0(x) = ${u} - ${n(m, 1)}x$（$0 \\le x \\le ${n(u / m, 2)}$）で、斜面から出るすべての特性曲線はいつ一点で出会いますか。`],
        a: { type: 'num', v: 1 / m, rel: 0.003 },
        hint: [`$x = s + (${u} - ${n(m, 1)}s)t$ is independent of $s$ when $1 - ${n(m, 1)}t = 0$.`, `$x = s + (${u} - ${n(m, 1)}s)t$ は $1 - ${n(m, 1)}t = 0$ のとき $s$ によりません。`],
        sol: [[`$x = s(1 - ${n(m, 1)}t) + ${u}t$, the same for every $s$ when $t = 1/${n(m, 1)}$.`, `$x = s(1 - ${n(m, 1)}t) + ${u}t$ は $t = 1/${n(m, 1)}$ のときすべての $s$ で同じです。`], [`$t^* = ${n(1 / m, 3)}$, which is $1/\\max(-u_0^{\\prime})$ as the general rule says.`, `$t^* = ${n(1 / m, 3)}$ で、一般の規則 $1/\\max(-u_0^{\\prime})$ と一致します。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['Under the Cole–Hopf substitution $u = -2\\nu\\,\\varphi_x/\\varphi$, Burgers\' equation becomes which equation for $\\varphi$?', 'コール・ホップの置換 $u = -2\\nu\\,\\varphi_x/\\varphi$ で、バーガース方程式は $\\varphi$ のどの方程式になりますか。'],
        a: { type: 'choice', v: 0, opts: [['the heat equation $\\varphi_t = \\nu\\varphi_{xx}$', '熱方程式 $\\varphi_t = \\nu\\varphi_{xx}$'], ['the wave equation $\\varphi_{tt} = \\nu\\varphi_{xx}$', '波動方程式 $\\varphi_{tt} = \\nu\\varphi_{xx}$'], ['the KdV equation', 'KdV 方程式']] },
        hint: ['The substitution removes the nonlinear term.', '置換によって非線形項が消えます。'],
        sol: [['Substituting and integrating once in $x$ leaves $\\varphi_t = \\nu\\varphi_{xx}$.', '代入して $x$ について一度積分すると $\\varphi_t = \\nu\\varphi_{xx}$ が残ります。'], ['So every Burgers solution comes from a solution of the linear heat equation, which is why the viscous shock is known exactly.', 'したがってバーガース方程式のどの解も線形の熱方程式の解から得られ、そのため粘性のある衝撃波が厳密にわかります。']],
      };
      if (form === 1) {
        const uL = r.step(0.5, 2, 0.1), nu = r.pick([0.01, 0.02, 0.05]), w = (4 * nu) / uL;
        return {
          q: [`The viscous Burgers shock from $u_L = ${n(uL, 1)}$ to $u_R = 0$ is $u = \\frac{u_L}{2}\\bigl(1 - \\tanh\\frac{u_L(x - st)}{4\\nu}\\bigr)$. With $\\nu = ${nu}$, what is its width scale $4\\nu/u_L$?`, `$u_L = ${n(uL, 1)}$ から $u_R = 0$ への粘性のあるバーガースの衝撃波は $u = \\frac{u_L}{2}\\bigl(1 - \\tanh\\frac{u_L(x - st)}{4\\nu}\\bigr)$ です。$\\nu = ${nu}$ のとき、幅の尺度 $4\\nu/u_L$ はいくらですか。`],
          a: { type: 'num', v: w, rel: 0.003 },
          hint: ['Read the scale from the tanh argument.', 'tanh の引数から尺度を読み取ります。'],
          sol: [[`The argument is $(x - st)/(4\\nu/u_L)$.`, `引数は $(x - st)/(4\\nu/u_L)$ です。`], [`Width $\\approx ${n(w, 4)}$: halving $\\nu$ halves it.`, `幅は約 $${n(w, 4)}$ で、$\\nu$ を半分にすると半分になります。`]],
        };
      }
      return {
        q: ['Write the Rankine–Hugoniot shock speed for Burgers\' equation in terms of $a = u_L$ and $b = u_R$.', 'バーガース方程式のランキン・ユゴニオの衝撃速度を $a = u_L$、$b = u_R$ で書いてください。'],
        a: { type: 'expr', v: '(a+b)/2', vars: ['a', 'b'], dom: { a: [1, 2], b: [0, 0.9] }, lhs: ['$s =$', '$s =$'] },
        hint: ['$s[u] = [u^2/2]$.', '$s[u] = [u^2/2]$ です。'],
        sol: [['$s(a - b) = (a^2 - b^2)/2$.', '$s(a - b) = (a^2 - b^2)/2$ です。'], ['Dividing by $a - b$: $s = (a + b)/2$.', '$a - b$ で割ると $s = (a + b)/2$ です。']],
      };
    },
  ];

  /* ---------------- fput-recurrence ---------------- */
  const om = (k, N) => 2 * Math.sin((k * PI) / (2 * (N + 1)));
  Q['fput-recurrence'] = [
    (r) => {
      const N = r.pick([8, 16, 32, 64]), k = r.int(1, 4), w = om(k, N);
      return {
        q: [`A chain of $N = ${N}$ unit masses and unit springs with fixed ends: what is the frequency $\\omega_${k} = 2\\sin\\frac{${k}\\pi}{2(N+1)}$? Four decimals.`, `両端を固定した $N = ${N}$ 個の単位質量と単位ばねの鎖で、振動数 $\\omega_${k} = 2\\sin\\frac{${k}\\pi}{2(N+1)}$ はいくらですか。小数第 4 位まで答えてください。`],
        a: { type: 'num', v: w, tol: 0.00006 },
        hint: ['Substitute and take the sine in radians.', '代入して、ラジアンで正弦をとります。'],
        sol: [[`$\\frac{${k}\\pi}{${2 * (N + 1)}} = ${n((k * PI) / (2 * (N + 1)), 5)}$.`, `$\\frac{${k}\\pi}{${2 * (N + 1)}} = ${n((k * PI) / (2 * (N + 1)), 5)}$ です。`], [`$\\omega_${k} = ${n(w, 5)}$, period $${n((2 * PI) / w, 3)}$.`, `$\\omega_${k} = ${n(w, 5)}$、周期は $${n((2 * PI) / w, 3)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const A = r.pick([0.5, 1, 1.5, 2]), N = 32, w = om(1, N), E = 0.5 * w * w * A * A * ((N + 1) / 2);
        return {
          q: [`Linear chain, $N = 32$: started at rest with $x_j = ${n(A, 1)}\\sin(j\\pi/33)$. What is the energy in mode 1, $E_1 = \\frac12\\omega_1^2Q_1^2$ with $Q_1 = ${n(A, 1)}\\sqrt{33/2}$?`, `線形の鎖、$N = 32$：$x_j = ${n(A, 1)}\\sin(j\\pi/33)$ で静止から始めます。モード 1 のエネルギー $E_1 = \\frac12\\omega_1^2Q_1^2$（$Q_1 = ${n(A, 1)}\\sqrt{33/2}$）はいくらですか。`],
          a: { type: 'num', v: E, rel: 0.004 },
          hint: ['$\\omega_1 = 2\\sin(\\pi/66)$.', '$\\omega_1 = 2\\sin(\\pi/66)$ です。'],
          sol: [[`$\\omega_1 = ${n(w, 5)}$, $Q_1^2 = ${n(A * A * 16.5, 4)}$.`, `$\\omega_1 = ${n(w, 5)}$、$Q_1^2 = ${n(A * A * 16.5, 4)}$ です。`], [`$E_1 = ${n(E, 5)}$: all of the energy, which a linear chain would keep in mode 1 forever.`, `$E_1 = ${n(E, 5)}$ で、これが全エネルギーです。線形の鎖ならいつまでもモード 1 に保たれます。`]],
          set: { alpha: 0, amp: A },
        };
      }
      const T = r.pick([66.025, 132.05]), tr = r.pick([5000, 10200, 15000]);
      return {
        q: [`The lowest mode has period $${n(T, 2)}$. How many of its periods is $t = ${tr}$?`, `最低次モードの周期は $${n(T, 2)}$ です。$t = ${tr}$ はその何周期分ですか。`],
        a: { type: 'num', v: tr / T, rel: 0.003 },
        hint: ['Divide.', '割り算です。'],
        sol: [[`$${tr}/${n(T, 2)}$.`, `$${tr}/${n(T, 2)}$ です。`], [`$\\approx ${n(tr / T, 3)}$ periods.`, `約 $${n(tr / T, 3)}$ 周期です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) return {
        q: ['With $\\alpha = 0$ the chain is linear. What fraction of the energy ever leaves mode 1?', '$\\alpha = 0$ では鎖は線形です。モード 1 からエネルギーの何割が出ていきますか。'],
        a: { type: 'num', v: 0, tol: 1e-6 },
        hint: ['Normal modes of a linear system are independent.', '線形系の基準モードは互いに独立です。'],
        sol: [['Each $Q_k$ obeys $\\ddot Q_k = -\\omega_k^2Q_k$ on its own.', '各 $Q_k$ は単独で $\\ddot Q_k = -\\omega_k^2Q_k$ に従います。'], ['So none: all energy stays in mode 1.', 'したがって 0 で、すべてのエネルギーはモード 1 にとどまります。']],
        set: { alpha: 0, amp: 1 },
      };
      if (form === 1) return {
        q: ['What did Fermi, Pasta, Ulam and Tsingou expect, and what did they find?', 'フェルミ、パスタ、ウラム、ツィンゴウは何を予想し、何を見つけましたか。'],
        a: { type: 'choice', v: 0, opts: [['expected equipartition; found a near-recurrence to the initial state', '等分配を予想し、初めの状態へのほぼ完全な再帰を見つけた'], ['expected recurrence; found equipartition', '再帰を予想し、等分配を見つけた'], ['expected chaos; found that the chain stopped moving', 'カオスを予想し、鎖が止まることを見つけた']] },
        hint: ['Statistical mechanics predicts equal sharing.', '統計力学は均等な分配を予言します。'],
        sol: [['They expected the nonlinearity to spread the energy evenly over the modes (equipartition).', '彼らは非線形性がエネルギーをモードに均等に広げる（等分配）と予想しました。'], ['Instead the energy returned almost entirely to mode 1, later explained by KdV solitons.', '実際にはエネルギーはほぼすべてモード 1 に戻り、のちに KdV のソリトンで説明されました。']],
        set: { alpha: 0.25, amp: 1 },
      };
      const N = r.pick([16, 32, 64]);
      return {
        q: [`For small $k$, $\\omega_k \\approx k\\pi/(N+1)$. For $N = ${N}$, what is the relative difference $(\\omega_3 - 3\\omega_1)/(3\\omega_1)$? Give it to three significant figures (negative).`, `$k$ が小さいとき $\\omega_k \\approx k\\pi/(N+1)$ です。$N = ${N}$ のとき、相対差 $(\\omega_3 - 3\\omega_1)/(3\\omega_1)$ はいくらですか。有効数字 3 桁で答えてください（負の値です）。`],
        a: { type: 'num', v: (om(3, N) - 3 * om(1, N)) / (3 * om(1, N)), rel: 0.005 },
        hint: ['Compute both frequencies exactly with $2\\sin$.', '二つの振動数を $2\\sin$ で正確に計算します。'],
        sol: [[`$\\omega_1 = ${n(om(1, N), 6)}$, $\\omega_3 = ${n(om(3, N), 6)}$.`, `$\\omega_1 = ${n(om(1, N), 6)}$、$\\omega_3 = ${n(om(3, N), 6)}$ です。`], ['The small negative mismatch is the dispersion that lets solitons form instead of a shock.', 'このわずかな負のずれが分散で、衝撃波ではなくソリトンができるのはこのためです。']],
      };
    },
  ];
})();
