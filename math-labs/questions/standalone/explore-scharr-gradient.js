'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const K = 'explore-scharr-gradient-';
  const DEG = 180 / Math.PI;
  const cf = (v) => (Math.abs(v) === 1 ? '' : Math.abs(v));
  const scharr = (p) => ({ gx: (3 * (p[2] - p[0]) + 10 * (p[5] - p[3]) + 3 * (p[8] - p[6])) / 32, gy: (3 * (p[6] + p[8] - p[0] - p[2]) + 10 * (p[7] - p[1])) / 32 });
  const sobel = (p) => ({ gx: ((p[2] - p[0]) + 2 * (p[5] - p[3]) + (p[8] - p[6])) / 8, gy: ((p[6] + p[8] - p[0] - p[2]) + 2 * (p[7] - p[1])) / 8 });
  const grid = (p) => `\\begin{pmatrix} ${p[0]} & ${p[1]} & ${p[2]} \\\\ ${p[3]} & ${p[4]} & ${p[5]} \\\\ ${p[6]} & ${p[7]} & ${p[8]} \\end{pmatrix}`;
  const randPatch = (r) => Array.from({ length: 9 }, () => r.int(0, 25) * 10);
  const ang = (gx, gy) => Math.atan2(gy, gx) * DEG;

  /* ---------- from a patch to a gradient ---------- */
  Q[K + 'gradient'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.int(0, 10) * 10, R = r.int(0, 25) * 10, M = Math.round((L + R) / 20) * 10;
        const p = [L, M, R, L, M, R, L, M, R], gx = (R - L) / 2;
        return {
          q: [`A 3 by 3 patch has constant columns with intensities $${L}$, $${M}$, $${R}$ from left to right. What is $G_x$ from the normalized Scharr operator?`, `3 × 3 の画素パッチは、列ごとに一定で、左から右へ強度 $${L}$、$${M}$、$${R}$ です。正規化した Scharr 演算子による $G_x$ を求めてください。`],
          a: { type: 'num', v: gx, tol: 1e-6 },
          hint: ['The kernel $[3, 10, 3]^{\\mathsf T}[-1, 0, 1]/32$ gives $16(\\text{right} - \\text{left})/32$ on constant columns.', '定数の列に対しては、カーネル $[3, 10, 3]^{\\mathsf T}[-1, 0, 1]/32$ は $16(\\text{右} - \\text{左})/32$ になります。'],
          sol: [[`Smoothing down a constant column multiplies it by $3 + 10 + 3 = 16$.`, `定数の列を縦に平滑化すると $3 + 10 + 3 = 16$ 倍になります。`], [`$G_x = \\dfrac{16(${R} - ${L})}{32} = ${n(gx)}$.`, `$G_x = \\dfrac{16(${R} - ${L})}{32} = ${n(gx)}$ です。`], [`$G_y = 0$ since nothing changes down a column. The gradient points ${gx >= 0 ? 'right' : 'left'}, across the vertical edge.`, `列に沿っては変化しないので $G_y = 0$ です。勾配は ${gx >= 0 ? '右' : '左'}向き、つまり縦のエッジを横切る向きです。`]],
        };
      }
      if (form === 1) {
        const gx = r.int(-6, 6), gy = r.int(-6, 6);
        return {
          q: [`$G_x = ${gx}$, $G_y = ${gy}$. What is the gradient magnitude $|G|$? Give three decimals.`, `$G_x = ${gx}$、$G_y = ${gy}$ です。勾配の大きさ $|G|$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: Math.hypot(gx, gy), tol: 6e-4, show: Number.isInteger(Math.hypot(gx, gy)) ? undefined : `\\sqrt{${gx * gx + gy * gy}}` },
          sol: [[`$|G| = \\sqrt{${gx}^2 + ${gy}^2} = \\sqrt{${gx * gx + gy * gy}} = ${n(Math.hypot(gx, gy), 4)}$.`, `$|G| = \\sqrt{${gx}^2 + ${gy}^2} = \\sqrt{${gx * gx + gy * gy}} = ${n(Math.hypot(gx, gy), 4)}$ です。`], ['The magnitude is the edge strength: how many intensity levels change per pixel across the edge.', '大きさはエッジの強さで、エッジを横切って 1 画素あたり強度がいくつ変わるかを表します。']],
        };
      }
      const dirs = [['right (positive $x$)', '右（正の $x$ 方向）', 0], ['down the image (positive $y$)', '画像の下向き（正の $y$ 方向）', 90], ['left (negative $x$)', '左（負の $x$ 方向）', 180], ['up the image (negative $y$)', '画像の上向き（負の $y$ 方向）', -90]];
      const k = r.int(0, 3), dk = dirs[k];
      const desc = [['dark on the left, bright on the right', '左が暗く右が明るい'], ['dark at the top, bright at the bottom', '上が暗く下が明るい'], ['bright on the left, dark on the right', '左が明るく右が暗い'], ['bright at the top, dark at the bottom', '上が明るく下が暗い']][k];
      return {
        q: [`A straight edge has ${desc[0]}. In which direction does the gradient point? (Image coordinates: $y$ increases downward.)`, `まっすぐなエッジで、${desc[1]}ときの勾配の向きはどれですか（画像座標では $y$ は下向きに増えます）。`],
        a: { type: 'choice', fixed: true, opts: dirs.map((d) => [d[0], d[1]]), v: k },
        hint: ['The gradient points toward increasing intensity.', '勾配は強度が増える向きを指します。'],
        sol: [[`The gradient points toward the brighter side, ${dk[0]}.`, `勾配は明るい側、すなわち${dk[1]}を指します。`], [`It crosses the edge at a right angle; the visible edge itself runs along the perpendicular direction.`, `エッジを直角に横切ります。目に見えるエッジ自体は、それと垂直な方向に走っています。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = randPatch(r), g = scharr(p);
        return {
          q: [`For the patch $${grid(p)}$, compute $(G_x, G_y)$ with the normalized Scharr kernels (divide by $32$). Give two decimals.`, `パッチ $${grid(p)}$ について、正規化した Scharr カーネル（$32$ で割る）で $(G_x, G_y)$ を求めてください（小数第2位まで）。`],
          a: { type: 'tuple', v: [g.gx, g.gy], labels: ['$G_x$', '$G_y$'], tol: 0.006 },
          hint: ['$G_x$ uses columns: $3(c - a) + 10(f - d) + 3(i - g)$; $G_y$ uses rows.', '$G_x$ は列を使い $3(c - a) + 10(f - d) + 3(i - g)$、$G_y$ は行を使います。'],
          sol: [[`$32G_x = 3(${p[2] - p[0]}) + 10(${p[5] - p[3]}) + 3(${p[8] - p[6]}) = ${32 * g.gx}$.`, `$32G_x = 3(${p[2] - p[0]}) + 10(${p[5] - p[3]}) + 3(${p[8] - p[6]}) = ${32 * g.gx}$ です。`], [`$32G_y = 3(${p[6] - p[0]} + ${p[8] - p[2]}) + 10(${p[7] - p[1]}) = ${32 * g.gy}$.`, `$32G_y = 3(${p[6] - p[0]} + ${p[8] - p[2]}) + 10(${p[7] - p[1]}) = ${32 * g.gy}$ です。`], [`So $(G_x, G_y) = (${n(g.gx, 4)}, ${n(g.gy, 4)})$, in signed floating point: an 8-bit output would have destroyed the negative values.`, `したがって $(G_x, G_y) = (${n(g.gx, 4)}, ${n(g.gy, 4)})$ です。符号付き浮動小数点で計算しています。8 ビット出力では負の値が失われてしまいます。`]],
        };
      }
      if (form === 1) {
        let gx, gy; do { gx = r.int(-8, 8); gy = r.int(-8, 8); } while (!gx && !gy);
        const th = ang(gx, gy);
        return {
          q: [`$G_x = ${gx}$ and $G_y = ${gy}$. Find the gradient direction $\\theta = \\operatorname{atan2}(G_y, G_x)$ in degrees. Give one decimal.`, `$G_x = ${gx}$、$G_y = ${gy}$ です。勾配の方向 $\\theta = \\operatorname{atan2}(G_y, G_x)$ を度で求めてください（小数第1位まで）。`],
          a: { type: 'num', v: th, tol: 0.06 },
          hint: ['Use both signs to pick the quadrant; a plain $\\arctan(G_y/G_x)$ cannot tell opposite directions apart.', '二つの符号から象限を決めます。$\\arctan(G_y/G_x)$ だけでは逆向きを区別できません。'],
          sol: [[`The reference angle is $\\arctan(${Math.abs(gy)}/${Math.abs(gx)}) = ${n(Math.atan(Math.abs(gy / gx)) * DEG, 3)}^\\circ$ (or $90^\\circ$ if $G_x = 0$).`, `基準角は $\\arctan(${Math.abs(gy)}/${Math.abs(gx)}) = ${n(Math.atan(Math.abs(gy / gx)) * DEG, 3)}^\\circ$（$G_x = 0$ なら $90^\\circ$）です。`], [`With $G_x = ${gx}$ and $G_y = ${gy}$ the vector lies in the ${gx >= 0 ? (gy >= 0 ? 'first' : 'fourth') : (gy >= 0 ? 'second' : 'third')} quadrant, so $\\theta = ${n(th, 3)}^\\circ$.`, `$G_x = ${gx}$、$G_y = ${gy}$ のベクトルは第${gx >= 0 ? (gy >= 0 ? '1' : '4') : (gy >= 0 ? '2' : '3')}象限にあるので、$\\theta = ${n(th, 3)}^\\circ$ です。`], ['Because $y$ points down in an image, a positive angle turns clockwise on the screen.', '画像では $y$ が下向きなので、正の角は画面上では時計回りです。']],
        };
      }
      const a = r.nz(-4, 4), b = r.nz(-4, 4), c0 = r.int(100, 150);
      const p = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) p.push(c0 + a * i + b * j);
      const g = scharr(p);
      return {
        q: [`A smooth ramp $I(x, y) = ${c0} ${a < 0 ? '-' : '+'} ${cf(a)}x ${b < 0 ? '-' : '+'} ${cf(b)}y$ is sampled at $x, y \\in \\{-1, 0, 1\\}$, giving the patch $${grid(p)}$. Find $(G_x, G_y)$ from the normalized Scharr operator.`, `なめらかな傾斜 $I(x, y) = ${c0} ${a < 0 ? '-' : '+'} ${cf(a)}x ${b < 0 ? '-' : '+'} ${cf(b)}y$ を $x, y \\in \\{-1, 0, 1\\}$ で標本化すると、パッチ $${grid(p)}$ になります。正規化した Scharr 演算子による $(G_x, G_y)$ を求めてください。`],
        a: { type: 'tuple', v: [g.gx, g.gy], labels: ['$G_x$', '$G_y$'], tol: 0.006 },
        sol: [[`$32G_x = 3(${p[2] - p[0]}) + 10(${p[5] - p[3]}) + 3(${p[8] - p[6]}) = ${32 * g.gx}$, so $G_x = ${n(g.gx, 4)}$.`, `$32G_x = 3(${p[2] - p[0]}) + 10(${p[5] - p[3]}) + 3(${p[8] - p[6]}) = ${32 * g.gx}$ なので $G_x = ${n(g.gx, 4)}$ です。`], [`$32G_y = ${32 * g.gy}$, so $G_y = ${n(g.gy, 4)}$.`, `$32G_y = ${32 * g.gy}$ なので $G_y = ${n(g.gy, 4)}$ です。`], [`The result equals the ramp's slopes $(${a}, ${b})$ exactly: that is what the factor $1/32$ calibrates. The constant ${c0} drops out.`, `結果は傾斜の勾配 $(${a}, ${b})$ にちょうど一致します。係数 $1/32$ はこのために較正されています。定数 ${c0} は消えます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let gx, gy; do { gx = r.int(-9, 9); gy = r.int(-9, 9); } while (!gx && !gy);
        const th = ang(gx, gy), t = ((th + 90) % 180 + 180) % 180;
        return {
          q: [`$G_x = ${gx}$, $G_y = ${gy}$. The edge runs perpendicular to the gradient. Give the edge orientation as an angle in $[0^\\circ, 180^\\circ)$, to one decimal.`, `$G_x = ${gx}$、$G_y = ${gy}$ です。エッジは勾配に垂直に走ります。エッジの向きを $[0^\\circ, 180^\\circ)$ の角度として、小数第1位まで求めてください。`],
          a: { type: 'num', v: t, tol: 0.06 },
          hint: ['Add $90^\\circ$ to $\\theta$, then reduce modulo $180^\\circ$: a line has no arrowhead.', '$\\theta$ に $90^\\circ$ を足し、$180^\\circ$ で割った余りにします。直線には向きがありません。'],
          sol: [[`$\\theta = \\operatorname{atan2}(${gy}, ${gx}) = ${n(th, 3)}^\\circ$.`, `$\\theta = \\operatorname{atan2}(${gy}, ${gx}) = ${n(th, 3)}^\\circ$ です。`], [`The tangent is at $\\theta + 90^\\circ = ${n(th + 90, 3)}^\\circ$, which as an undirected line is $${n(t, 3)}^\\circ$.`, `接線は $\\theta + 90^\\circ = ${n(th + 90, 3)}^\\circ$ で、向きのない直線としては $${n(t, 3)}^\\circ$ です。`], ['The gradient is a normal to the level curve; the edge you see is its tangent.', '勾配は等高線の法線で、目に見えるエッジはその接線です。']],
        };
      }
      if (form === 1) {
        const tgt = r.pick([30, 45, 60, 120, 135, 150, -30, -60]), m = r.pick([2, 4, 6, 10]);
        const gx = m * Math.cos(tgt / DEG), gy = m * Math.sin(tgt / DEG);
        return {
          q: [`An edge of strength $|G| = ${m}$ has a gradient pointing at $\\theta = ${tgt}^\\circ$. What is $G_y$? Give three decimals.`, `強さ $|G| = ${m}$ のエッジの勾配が $\\theta = ${tgt}^\\circ$ を向いています。$G_y$ を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: gy, tol: 6e-4 },
          hint: ['$G_x = |G|\\cos\\theta$, $G_y = |G|\\sin\\theta$.', '$G_x = |G|\\cos\\theta$、$G_y = |G|\\sin\\theta$ です。'],
          sol: [[`$G_y = ${m}\\sin ${tgt}^\\circ = ${n(gy, 4)}$.`, `$G_y = ${m}\\sin ${tgt}^\\circ = ${n(gy, 4)}$ です。`], [`Then $G_x = ${m}\\cos ${tgt}^\\circ = ${n(gx, 4)}$, and $\\sqrt{G_x^2 + G_y^2} = ${m}$ checks.`, `$G_x = ${m}\\cos ${tgt}^\\circ = ${n(gx, 4)}$ で、$\\sqrt{G_x^2 + G_y^2} = ${m}$ と確かめられます。`]],
        };
      }
      const p = randPatch(r), a = scharr(p), b = sobel(p), v = Math.abs(a.gx - b.gx);
      return {
        q: [`For the patch $${grid(p)}$, find $|G_x^{\\text{Scharr}} - G_x^{\\text{Sobel}}|$, with both normalized (Scharr by $32$, Sobel by $8$). Give two decimals.`, `パッチ $${grid(p)}$ について、両方を正規化した（Scharr は $32$、Sobel は $8$ で割る）$|G_x^{\\text{Scharr}} - G_x^{\\text{Sobel}}|$ を求めてください（小数第2位まで）。`],
        a: { type: 'num', v, tol: 0.006 },
        hint: ['Sobel smooths with $1{:}2{:}1$, Scharr with $3{:}10{:}3$.', 'Sobel は $1{:}2{:}1$、Scharr は $3{:}10{:}3$ で平滑化します。'],
        sol: [[`Scharr: $G_x = ${n(a.gx, 4)}$. Sobel: $G_x = ((${p[2] - p[0]}) + 2(${p[5] - p[3]}) + (${p[8] - p[6]}))/8 = ${n(b.gx, 4)}$.`, `Scharr は $G_x = ${n(a.gx, 4)}$、Sobel は $G_x = ((${p[2] - p[0]}) + 2(${p[5] - p[3]}) + (${p[8] - p[6]}))/8 = ${n(b.gx, 4)}$ です。`], [`The difference is $${n(v, 4)}$.`, `差は $${n(v, 4)}$ です。`], ['Both are exact on a linear ramp; they differ on a patch with structure because they weight the middle row differently, which is what makes Scharr more isotropic under rotation.', 'どちらも直線的な傾斜では正確です。構造のあるパッチでは、中央の行への重みが違うため差が出ます。この違いが、Scharr を回転に対してより等方的にしています。']],
      };
    },
  ];

  /* ---------- the kernel itself ---------- */
  Q[K + 'kernel'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.int(1, 5), q = r.int(1, 12);
        return {
          q: [`A derivative kernel smooths with weights $[${p}, ${q}, ${p}]$ and differentiates with $[-1, 0, 1]$. What divisor makes its response to a ramp $I = ax$ equal $a$?`, `微分カーネルは重み $[${p}, ${q}, ${p}]$ で平滑化し、$[-1, 0, 1]$ で微分します。傾斜 $I = ax$ への応答が $a$ になる除数はいくつですか。`],
          a: { type: 'int', v: 2 * (2 * p + q) },
          hint: ['Sum $w_{ij}\\,x_j$ over the nine cells of the raw kernel.', '素のカーネルの 9 マスについて $w_{ij}\\,x_j$ を足します。'],
          sol: [[`Each of the three rows contributes $(${p}, ${q}, ${p})$ smoothed weight times $(1 - (-1)) = 2$ for $x$.`, `3 行それぞれが、平滑化の重みに $x$ の差 $(1 - (-1)) = 2$ を掛けて寄与します。`], [`Total: $2(${p} + ${q} + ${p}) = ${2 * (2 * p + q)}$.`, `合計は $2(${p} + ${q} + ${p}) = ${2 * (2 * p + q)}$ です。`], [`For $[3, 10, 3]$ this is $32$ (Scharr) and for $[1, 2, 1]$ it is $8$ (Sobel).`, `$[3, 10, 3]$ では $32$（Scharr）、$[1, 2, 1]$ では $8$（Sobel）です。`]],
        };
      }
      if (form === 1) {
        const s = r.pick([[3, 10, 3], [1, 2, 1], [1, 1, 1]]), i = r.int(0, 2), j = r.pick([0, 2]), d = [-1, 0, 1][j], v = s[i] * d;
        const nm = { '3,10,3': 'Scharr', '1,2,1': 'Sobel', '1,1,1': 'Prewitt' }[s.join(',')];
        return {
          q: [`The ${nm} $K_x$ (before normalizing) is the outer product of the column $[${s.join(', ')}]^{\\mathsf T}$ and the row $[-1, 0, 1]$. What is its entry in row ${i + 1}, column ${j + 1}?`, `${nm} の $K_x$（正規化前）は、列 $[${s.join(', ')}]^{\\mathsf T}$ と行 $[-1, 0, 1]$ の外積です。${i + 1} 行 ${j + 1} 列の成分を求めてください。`],
          a: { type: 'int', v },
          sol: [[`Entry $= (\\text{column})_{${i + 1}}\\times(\\text{row})_{${j + 1}} = ${s[i]}\\times(${d}) = ${v}$.`, `成分は $(\\text{列})_{${i + 1}}\\times(\\text{行})_{${j + 1}} = ${s[i]}\\times(${d}) = ${v}$ です。`], ['A separable kernel is a smoothing along one axis times a difference along the other, so it costs two short passes instead of one 3 by 3 pass.', '分離可能なカーネルは、一方の軸の平滑化と他方の軸の差分の積なので、3 × 3 を一度に掛ける代わりに短い二回の処理で済みます。']],
        };
      }
      const a = r.nz(-5, 5);
      return {
        q: [`The raw (unnormalized) Scharr $K_x$ is applied to the ramp $I(x, y) = ${a}x + 50$. What number does it return?`, `正規化していない Scharr の $K_x$ を、傾斜 $I(x, y) = ${a}x + 50$ に適用すると、いくつが返りますか。`],
        a: { type: 'int', v: 32 * a },
        sol: [[`The raw kernel's response to $I = ax + b$ is $32a$.`, `素のカーネルの $I = ax + b$ への応答は $32a$ です。`], [`So it returns $32\\times ${a} = ${32 * a}$; dividing by $32$ gives back the slope $${a}$.`, `したがって $32\\times ${a} = ${32 * a}$ が返り、$32$ で割ると傾き $${a}$ に戻ります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.int(1, 5), q = r.int(1, 10), s = 2 * p + q, a = r.nz(-6, 6);
        return {
          q: [`A kernel smooths with $[${p}, ${q}, ${p}]$ and differentiates with $[-1, 0, 1]$, normalized to be exact on ramps. Applied to the ramp $I(x, y) = ${a}x$, what raw (unnormalized) number does the kernel return?`, `カーネルは $[${p}, ${q}, ${p}]$ で平滑化、$[-1, 0, 1]$ で微分し、傾斜に対して正確になるよう正規化されています。傾斜 $I(x, y) = ${a}x$ に適用したとき、正規化前の値はいくつですか。`],
          a: { type: 'int', v: 2 * s * a },
          sol: [[`The normalizer is $2(2\\cdot ${p} + ${q}) = ${2 * s}$.`, `正規化の除数は $2(2\\cdot ${p} + ${q}) = ${2 * s}$ です。`], [`The raw response is $${2 * s}\\times ${a} = ${2 * s * a}$.`, `正規化前の応答は $${2 * s}\\times ${a} = ${2 * s * a}$ です。`]],
        };
      }
      if (form === 1) {
        const p = r.int(1, 5), q = r.int(1, 12), N = 2 * (2 * p + q);
        return {
          q: [`A normalizer of $${N}$ is needed for smoothing weights $[${p}, q, ${p}]$ with derivative $[-1, 0, 1]$. Find the centre weight $q$.`, `平滑化の重み $[${p}, q, ${p}]$ と微分 $[-1, 0, 1]$ に対して、正規化の除数は $${N}$ です。中央の重み $q$ を求めてください。`],
          a: { type: 'int', v: q },
          hint: ['The normalizer is $2(2p + q)$.', '除数は $2(2p + q)$ です。'],
          sol: [[`$2(2\\cdot ${p} + q) = ${N}$, so $2\\cdot ${p} + q = ${N / 2}$.`, `$2(2\\cdot ${p} + q) = ${N}$ より $2\\cdot ${p} + q = ${N / 2}$ です。`], [`$q = ${q}$.`, `$q = ${q}$ です。`]],
        };
      }
      const p = randPatch(r), a = scharr(p), b = sobel(p);
      return {
        q: [`For the patch $${grid(p)}$, what is the Sobel $G_y$ (normalized by $8$)? Give two decimals.`, `パッチ $${grid(p)}$ について、Sobel の $G_y$（$8$ で割る）を求めてください（小数第2位まで）。`],
        a: { type: 'num', v: b.gy, tol: 0.006 },
        sol: [[`$8G_y = (${p[6]} + ${p[8]} - ${p[0]} - ${p[2]}) + 2(${p[7]} - ${p[1]}) = ${8 * b.gy}$.`, `$8G_y = (${p[6]} + ${p[8]} - ${p[0]} - ${p[2]}) + 2(${p[7]} - ${p[1]}) = ${8 * b.gy}$ です。`], [`$G_y = ${n(b.gy, 4)}$, compared with Scharr's $${n(a.gy, 4)}$ for the same patch.`, `$G_y = ${n(b.gy, 4)}$ で、同じパッチの Scharr では $${n(a.gy, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const p = randPatch(r), s = scharr(p), t = sobel(p);
        const tolDeg = Math.abs(ang(s.gx, s.gy) - ang(t.gx, t.gy));
        return {
          q: [`For the patch $${grid(p)}$, by how many degrees do the Scharr and Sobel gradient directions differ? Give one decimal.`, `パッチ $${grid(p)}$ について、Scharr と Sobel の勾配方向は何度違いますか（小数第1位まで）。`],
          a: { type: 'num', v: Math.min(tolDeg, 360 - tolDeg), tol: 0.06 },
          hint: ['Compute both $\\operatorname{atan2}$ angles and subtract; the difference is smaller than $180^\\circ$.', '二つの $\\operatorname{atan2}$ の角を求めて引きます。差は $180^\\circ$ より小さい値です。'],
          sol: [[`Scharr: $(G_x, G_y) = (${n(s.gx, 4)}, ${n(s.gy, 4)})$, so $\\theta = ${n(ang(s.gx, s.gy), 3)}^\\circ$.`, `Scharr は $(G_x, G_y) = (${n(s.gx, 4)}, ${n(s.gy, 4)})$ で $\\theta = ${n(ang(s.gx, s.gy), 3)}^\\circ$ です。`], [`Sobel: $(G_x, G_y) = (${n(t.gx, 4)}, ${n(t.gy, 4)})$, so $\\theta = ${n(ang(t.gx, t.gy), 3)}^\\circ$.`, `Sobel は $(G_x, G_y) = (${n(t.gx, 4)}, ${n(t.gy, 4)})$ で $\\theta = ${n(ang(t.gx, t.gy), 3)}^\\circ$ です。`], [`They differ by $${n(Math.min(tolDeg, 360 - tolDeg), 3)}^\\circ$. On a clean straight edge the two agree closely; the gap shows what a different smoothing weight does to the measured direction.`, `差は $${n(Math.min(tolDeg, 360 - tolDeg), 3)}^\\circ$ です。きれいな直線のエッジでは両者はよく一致し、この差は平滑化の重みが測定される方向に与える影響を示します。`]],
        };
      }
      const a = r.nz(-4, 4), b = r.nz(-4, 4);
      const g = Math.hypot(a, b);
      return {
        q: [`A ramp $I(x, y) = ${a === 1 ? '' : a === -1 ? '-' : a}x ${b < 0 ? '-' : '+'} ${cf(b)}y$ has the normalized Scharr gradient $(${a}, ${b})$. Replace $(x, y)$ by $(y, -x)$, so the new ramp is $I'(x, y) = I(y, -x)$. What is $\\theta$ for the new ramp, given the old $\\theta = ${n(ang(a, b), 3)}^\\circ$? Give it in $(-180^\\circ, 180^\\circ]$ to one decimal.`, `傾斜 $I(x, y) = ${a === 1 ? '' : a === -1 ? '-' : a}x ${b < 0 ? '-' : '+'} ${cf(b)}y$ の正規化 Scharr 勾配は $(${a}, ${b})$ です。$(x, y)$ を $(y, -x)$ に置き換えた新しい傾斜を $I'(x, y) = I(y, -x)$ とします。元の $\\theta = ${n(ang(a, b), 3)}^\\circ$ のとき、新しい傾斜の $\\theta$ を $(-180^\\circ, 180^\\circ]$ で、小数第1位まで求めてください。`],
        a: { type: 'num', v: ang(-b, a), tol: 0.06 },
        hint: ['$I\'(x, y) = ay - bx$, so read off its slopes.', '$I\'(x, y) = ay - bx$ なので、傾きを読み取ります。'],
        sol: [[`$I'(x, y) = ${a === 1 ? '' : a === -1 ? '-' : a}y ${b < 0 ? '+' : '-'} ${cf(b)}x$, whose slopes are $(G_x, G_y) = (${-b}, ${a})$.`, `$I'(x, y) = ${a === 1 ? '' : a === -1 ? '-' : a}y ${b < 0 ? '+' : '-'} ${cf(b)}x$ で、傾きは $(G_x, G_y) = (${-b}, ${a})$ です。`], [`$\\theta' = \\operatorname{atan2}(${a}, ${-b}) = ${n(ang(-b, a), 3)}^\\circ$.`, `$\\theta' = \\operatorname{atan2}(${a}, ${-b}) = ${n(ang(-b, a), 3)}^\\circ$ です。`], [`The magnitude $${n(g, 4)}$ is unchanged and the direction turned by exactly $90^\\circ$: a good gradient operator should rotate with the image, which is the isotropy Scharr was tuned for.`, `大きさ $${n(g, 4)}$ は変わらず、方向はちょうど $90^\\circ$ 回ります。良い勾配演算子は画像とともに回るべきで、Scharr はその等方性のために調整されています。`]],
      };
    },
  ];
})();
