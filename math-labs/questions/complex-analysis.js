'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;
  const PI = Math.PI, D2R = PI / 180;
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cpow = (z, k) => { let w = [1, 0]; for (let i = 0; i < k; i++) w = cmul(w, z); return w; };
  const cx = (re, im, d = 4) => {
    if (Math.abs(im) < 1e-12) return n(re, d);
    const imS = Math.abs(Math.abs(im) - 1) < 1e-12 ? 'i' : `${n(Math.abs(im), d)}i`;
    if (Math.abs(re) < 1e-12) return (im < 0 ? '-' : '') + imS;
    return `${n(re, d)} ${im < 0 ? '-' : '+'} ${imS}`;
  };
  const wrap180 = (d) => { let x = ((d % 360) + 360) % 360; if (x > 180) x -= 360; return x; };
  const sup = ['', '', '^2', '^3', '^4'];
  const cf = (c) => (c === 1 ? '' : c === -1 ? '-' : String(c));

  /* ---------------- 1. conformal maps w = z^k ---------------- */
  Q.conformal = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 2, 3]);
        let a, b; do { a = r.int(-2, 2); b = r.int(-2, 2); } while (a === 0 || b === 0 || (Math.abs(a) === 2 && Math.abs(b) === 2 && k === 3));
        const w = cpow([a, b], k);
        return {
          q: [`Under $w = z${sup[k]}$, where does the point $z_0 = ${cx(a, b)}$ go? Give $\\operatorname{Re} w$ and $\\operatorname{Im} w$.`, `$w = z${sup[k]}$ によって、点 $z_0 = ${cx(a, b)}$ はどこへ移りますか。$\\operatorname{Re} w$ と $\\operatorname{Im} w$ を答えてください。`],
          a: { type: 'tuple', v: w, labels: ['$\\operatorname{Re} w$', '$\\operatorname{Im} w$'], tol: 1e-6 },
          hint: ['Multiply out, using $i^2 = -1$.', '$i^2 = -1$ を使って展開してください。'],
          sol: k === 2
            ? [[`$(${cx(a, b)})^2 = ${a * a} ${b * b ? '- ' + b * b : ''} + 2\\cdot(${a})(${b})i$.`, `$(${cx(a, b)})^2 = ${a * a} ${b * b ? '- ' + b * b : ''} + 2\\cdot(${a})(${b})i$ です。`], [`$w = ${cx(w[0], w[1])}$: the modulus is squared and the argument doubled.`, `$w = ${cx(w[0], w[1])}$ です。絶対値は2乗され、偏角は2倍になります。`]]
            : [[`$z_0^2 = ${cx(...cpow([a, b], 2))}$, then $z_0^3 = z_0^2 \\cdot z_0$.`, `$z_0^2 = ${cx(...cpow([a, b], 2))}$ で、$z_0^3 = z_0^2 \\cdot z_0$ です。`], [`$w = ${cx(w[0], w[1])}$: the modulus is cubed and the argument tripled.`, `$w = ${cx(w[0], w[1])}$ です。絶対値は3乗され、偏角は3倍になります。`]],
          set: { power: k },
        };
      }
      if (form === 1) {
        const k = r.int(2, 4);
        let a, b; do { a = r.int(-2, 2); b = r.int(-2, 2); } while (a === 0 && b === 0);
        const m2 = a * a + b * b, s = k * Math.pow(m2, (k - 1) / 2);
        const rt = Math.round(Math.sqrt(m2)), sq = rt * rt === m2, C = k * Math.pow(m2, Math.floor((k - 1) / 2));
        const showS = (k - 1) % 2 === 0 || sq ? undefined : `${C}\\sqrt{${m2}}`;
        return {
          q: [`For $f(z) = z${sup[k]}$, by what factor are short lengths near $z_0 = ${cx(a, b)}$ stretched?`, `$f(z) = z${sup[k]}$ で、$z_0 = ${cx(a, b)}$ の近くの短い長さは何倍に伸びますか。`],
          a: { type: 'num', v: s, show: showS },
          hint: ['The local scale factor of a holomorphic map is $|f\'(z_0)|$.', '正則写像の局所的な拡大率は $|f\'(z_0)|$ です。'],
          sol: [[`$f'(z) = ${k}z${k - 1 > 1 ? '^' + (k - 1) : ''}$, so $|f'(z_0)| = ${k}|z_0|^{${k - 1}}$.`, `$f'(z) = ${k}z${k - 1 > 1 ? '^' + (k - 1) : ''}$ なので $|f'(z_0)| = ${k}|z_0|^{${k - 1}}$ です。`], [`$|z_0| = \\sqrt{${m2}}$, so the factor is $${k}\\cdot(\\sqrt{${m2}})^{${k - 1}} = ${n(s, 4)}$, the same in every direction.`, `$|z_0| = \\sqrt{${m2}}$ なので倍率は $${k}\\cdot(\\sqrt{${m2}})^{${k - 1}} = ${n(s, 4)}$ で、どの方向にも同じです。`]],
          set: { power: k },
        };
      }
      const k = r.int(2, 4), th = r.step(15, 165, 5);
      let a, b; do { a = r.int(-2, 2); b = r.int(-2, 2); } while (a === 0 && b === 0);
      return {
        q: [`Two smooth curves cross at $z_0 = ${cx(a, b)}$ at an angle of $${th}^\\circ$. At what angle do their images under $w = z${sup[k]}$ cross?`, `2本のなめらかな曲線が $z_0 = ${cx(a, b)}$ で $${th}^\\circ$ の角度で交わっています。$w = z${sup[k]}$ による像は何度で交わりますか。`],
        a: { type: 'num', v: th, tol: 0.01, unit: ['°', '°'] },
        hint: ['Is $f\'(z_0)$ zero here?', 'ここで $f\'(z_0)$ は 0 ですか。'],
        sol: [[`$f'(z_0) = ${k}z_0${k > 2 ? '^' + (k - 1) : ''} \\ne 0$ because $z_0 \\ne 0$.`, `$z_0 \\ne 0$ なので $f'(z_0) = ${k}z_0${k > 2 ? '^' + (k - 1) : ''} \\ne 0$ です。`], [`Both tangent directions are rotated by the same $\\arg f'(z_0)$, so the angle stays $${th}^\\circ$: the map is conformal there.`, `2つの接線方向は同じ $\\arg f'(z_0)$ だけ回転するので、角度は $${th}^\\circ$ のままです。写像はそこで等角です。`]],
        set: { power: k, angle: th },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(2, 4), rad = r.pick([0.5, 1, 1.5, 2]), al = r.pick([30, 45, 60, 90, 120, 135, 150, -30, -45, -60, -120, -150]);
        const rot = wrap180((k - 1) * al);
        return {
          q: [`For $w = z${sup[k]}$, by what angle does the map rotate small arrows at $z_0 = ${n(rad)}e^{i\\cdot ${al}^\\circ}$? Give an angle in $(-180^\\circ, 180^\\circ]$.`, `$w = z${sup[k]}$ は、$z_0 = ${n(rad)}e^{i\\cdot ${al}^\\circ}$ の小さな矢印を何度回転させますか。$(-180^\\circ, 180^\\circ]$ の角度で答えてください。`],
          a: { type: 'num', v: rot, tol: 0.05, unit: ['°', '°'] },
          hint: ['The rotation is $\\arg f\'(z_0)$, and $\\arg(cz^m) = \\arg c + m\\arg z$.', '回転角は $\\arg f\'(z_0)$ で、$\\arg(cz^m) = \\arg c + m\\arg z$ です。'],
          sol: [[`$f'(z_0) = ${k}z_0${k > 2 ? '^' + (k - 1) : ''}$ and $${k} > 0$, so $\\arg f'(z_0) = ${k - 1}\\cdot ${al}^\\circ = ${(k - 1) * al}^\\circ$.`, `$f'(z_0) = ${k}z_0${k > 2 ? '^' + (k - 1) : ''}$ で $${k} > 0$ なので、$\\arg f'(z_0) = ${k - 1}\\cdot ${al}^\\circ = ${(k - 1) * al}^\\circ$ です。`], [`Reduced to $(-180^\\circ, 180^\\circ]$ that is $${rot}^\\circ$. The radius $${n(rad)}$ affects only the stretch, not the turn.`, `$(-180^\\circ, 180^\\circ]$ に直すと $${rot}^\\circ$ です。半径 $${n(rad)}$ は伸びにだけ効き、回転には効きません。`]],
          set: { power: k },
        };
      }
      if (form === 1) {
        const k = r.int(2, 4); const th = r.step(10, Math.floor(175 / k / 5) * 5, 5);
        return {
          q: [`Two curves leave the origin at an angle of $${th}^\\circ$ to each other. At what angle do their images under $w = z${sup[k]}$ leave $w = 0$?`, `2本の曲線が原点から互いに $${th}^\\circ$ の角度で出ています。$w = z${sup[k]}$ による像は $w = 0$ から何度の角度で出ますか。`],
          a: { type: 'num', v: k * th, tol: 0.01, unit: ['°', '°'] },
          hint: ['At $z = 0$ the derivative vanishes. Write a ray as $z = te^{i\\theta}$ and see what happens to $\\theta$.', '$z = 0$ では導関数が 0 です。半直線を $z = te^{i\\theta}$ と書き、$\\theta$ がどうなるか見てください。'],
          sol: [[`A ray $te^{i\\theta}$ goes to $t^{${k}}e^{i${k}\\theta}$: directions out of $0$ are multiplied by ${k}.`, `半直線 $te^{i\\theta}$ は $t^{${k}}e^{i${k}\\theta}$ に移るので、$0$ から出る方向は ${k} 倍になります。`], [`So the angle becomes $${k}\\cdot ${th}^\\circ = ${k * th}^\\circ$. The map is not conformal at the critical point, where $f'(0) = 0$.`, `したがって角度は $${k}\\cdot ${th}^\\circ = ${k * th}^\\circ$ になります。臨界点 $f'(0) = 0$ では写像は等角ではありません。`]],
          set: { power: k, angle: th >= 10 ? th : 10 },
        };
      }
      const k = r.int(2, 4); let a, b; do { a = r.int(-2, 2); b = r.int(-1, 2); } while (a === 0 && b === 0);
      const m2 = a * a + b * b, A = k * k * Math.pow(m2, k - 1);
      return {
        q: [`By what factor does $w = z${sup[k]}$ multiply small areas near $z_0 = ${cx(a, b)}$?`, `$w = z${sup[k]}$ は $z_0 = ${cx(a, b)}$ の近くの小さな面積を何倍にしますか。`],
        a: { type: 'int', v: A },
        hint: ['A conformal map is locally a rotation times a scaling by $|f\'|$. What does that do to an area?', '等角写像は局所的には回転と $|f\'|$ 倍の拡大です。面積はどうなりますか。'],
        sol: [[`$|f'(z_0)| = ${k}|z_0|^{${k - 1}}$ with $|z_0|^2 = ${m2}$.`, `$|f'(z_0)| = ${k}|z_0|^{${k - 1}}$、$|z_0|^2 = ${m2}$ です。`], [`Lengths scale by $|f'|$ in both directions, so areas scale by $|f'(z_0)|^2 = ${k * k}\\cdot ${m2}^{${k - 1}} = ${A}$. This is the Jacobian determinant of the map.`, `長さはどちらの方向にも $|f'|$ 倍なので、面積は $|f'(z_0)|^2 = ${k * k}\\cdot ${m2}^{${k - 1}} = ${A}$ 倍です。これは写像のヤコビ行列式です。`]],
        set: { power: k },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = r.pick([0.5, 1, 1.5, 2, -1, -0.5]);
        const A = c * c, B = 1 / (4 * c * c);
        return {
          q: [`Under $w = z^2$ the vertical line $\\operatorname{Re} z = ${n(c)}$ becomes a parabola $u = A - Bv^2$ in the $w = u + iv$ plane. Find $A$ and $B$.`, `$w = z^2$ によって縦の直線 $\\operatorname{Re} z = ${n(c)}$ は、$w = u + iv$ 平面の放物線 $u = A - Bv^2$ になります。$A$ と $B$ を求めてください。`],
          a: { type: 'tuple', v: [A, B], labels: ['$A$', '$B$'], tol: 1e-4 },
          hint: ['Put $z = c + iy$, write $u$ and $v$ in terms of $y$, then eliminate $y$.', '$z = c + iy$ とおいて $u$ と $v$ を $y$ で表し、$y$ を消去してください。'],
          sol: [[`$(${n(c)} + iy)^2 = ${n(c * c)} - y^2 + ${n(2 * c)}yi$, so $u = ${n(c * c)} - y^2$ and $v = ${n(2 * c)}y$.`, `$(${n(c)} + iy)^2 = ${n(c * c)} - y^2 + ${n(2 * c)}yi$ なので $u = ${n(c * c)} - y^2$、$v = ${n(2 * c)}y$ です。`], [`$y = v/${n(2 * c)}$ gives $u = ${n(A)} - v^2/${n(4 * c * c)}$: $A = ${n(A)}$, $B = ${n(B, 4)}$.`, `$y = v/${n(2 * c)}$ を代入すると $u = ${n(A)} - v^2/${n(4 * c * c)}$ となり、$A = ${n(A)}$、$B = ${n(B, 4)}$ です。`], ['The horizontal lines become the opposite family of parabolas, opening the other way, and the two families still cross at right angles, as the blue and teal grids in the figure do.', '横の直線は逆向きに開く放物線の族になり、2つの族は図の青と緑の格子のように直角に交わります。']],
          set: { power: 2 },
        };
      }
      if (form === 1) {
        const k = r.int(2, 4), ks = k * k;
        return {
          q: [`Write the Jacobian determinant of $w = z${sup[k]}$, viewed as a map $(x, y) \\mapsto (u, v)$, as a function of $x$ and $y$.`, `$w = z${sup[k]}$ を写像 $(x, y) \\mapsto (u, v)$ と見たときのヤコビ行列式を、$x$ と $y$ の式で表してください。`],
          a: { type: 'expr', v: k === 2 ? `${ks}*(x^2+y^2)` : `${ks}*(x^2+y^2)^${k - 1}`, vars: ['x', 'y'], dom: { x: [-1.4, 1.4], y: [-1.4, 1.4] }, lhs: ['$\\det J =$', '$\\det J =$'] },
          hint: ['By Cauchy–Riemann, $\\det J = u_x v_y - u_y v_x = u_x^2 + v_x^2 = |f\'(z)|^2$.', 'コーシー・リーマン方程式より $\\det J = u_x v_y - u_y v_x = u_x^2 + v_x^2 = |f\'(z)|^2$ です。'],
          sol: [['With $u_x = v_y$ and $u_y = -v_x$, $\\det J = u_x^2 + v_x^2 = |f\'(z)|^2$.', '$u_x = v_y$、$u_y = -v_x$ より $\\det J = u_x^2 + v_x^2 = |f\'(z)|^2$ です。'], [`$f'(z) = ${k}z${k > 2 ? '^' + (k - 1) : ''}$, so $\\det J = ${ks}|z|^{${2 * (k - 1)}} = ${ks}(x^2 + y^2)${k > 2 ? '^{' + (k - 1) + '}' : ''}$.`, `$f'(z) = ${k}z${k > 2 ? '^' + (k - 1) : ''}$ なので $\\det J = ${ks}|z|^{${2 * (k - 1)}} = ${ks}(x^2 + y^2)${k > 2 ? '^{' + (k - 1) + '}' : ''}$ です。`], ['It is never negative: a holomorphic map preserves orientation, and it vanishes only at the critical point $0$.', '負になることはありません。正則写像は向きを保ち、行列式が 0 になるのは臨界点 $0$ だけです。']],
          set: { power: k },
        };
      }
      const k = r.int(2, 4), s = r.pick([1, 2, 3, 4, 0.5, 6, 8]);
      const R = Math.pow(s / k, 1 / (k - 1));
      return {
        q: [`On which circle $|z| = R$ does $w = z${sup[k]}$ stretch short lengths by exactly the factor $${n(s)}$? Find $R$.`, `$w = z${sup[k]}$ が短い長さをちょうど $${n(s)}$ 倍に伸ばすのは、どの円 $|z| = R$ の上ですか。$R$ を求めてください。`],
        a: { type: 'num', v: R, tol: 1e-3 },
        hint: ['Set $|f\'(z)| = ' + n(s) + '$ and note it depends only on $|z|$.', '$|f\'(z)| = ' + n(s) + '$ とおき、それが $|z|$ だけで決まることに注目してください。'],
        sol: [[`$|f'(z)| = ${k}R^{${k - 1}}$, so $${k}R^{${k - 1}} = ${n(s)}$.`, `$|f'(z)| = ${k}R^{${k - 1}}$ なので $${k}R^{${k - 1}} = ${n(s)}$ です。`], [`$R = (${n(s)}/${k})^{1/${k - 1}} = ${n(R, 4)}$.`, `$R = (${n(s)}/${k})^{1/${k - 1}} = ${n(R, 4)}$ です。`], [`Inside this circle the map shrinks, outside it enlarges, which is why the image grid in the figure is crowded near $0$ and spread out far away.`, `この円の内側では写像は縮め、外側では拡大します。図の像の格子が $0$ の近くで詰まり、遠くで広がるのはこのためです。`]],
        set: { power: k },
      };
    },
  ];

  /* ---------------- 2. residues ---------------- */
  // the lab: f(z) = 1/(z - a) + 2/(z - b), a = p on the real axis, b = 0.9 + 0.9i, contour |z - c| = R
  const B = [0.9, 0.9];
  function labCase(r, needBoth) {
    for (;;) {
      const cxv = r.step(-1.2, 1.2, 0.1), cyv = r.step(-1.2, 1.2, 0.1), R = r.step(0.4, 1.8, 0.1), p = r.step(-1.6, 1.6, 0.1);
      const da = Math.hypot(p - cxv, cyv) - R, db = Math.hypot(B[0] - cxv, B[1] - cyv) - R;
      if (Math.abs(da) < 0.12 || Math.abs(db) < 0.12) continue;
      if (Math.abs(p - B[0]) < 0.15 && B[1] < 0.15) continue;
      const K = (da < 0 ? 1 : 0) + (db < 0 ? 2 : 0);
      if (needBoth !== undefined && r.u() < 0.6 && (K === 0) === needBoth) continue;
      return { cxv: Math.round(cxv * 100) / 100, cyv: Math.round(cyv * 100) / 100, R: Math.round(R * 100) / 100, p: Math.round(p * 100) / 100, da, db, K };
    }
  }
  Q.residue = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = labCase(r, true);
        const ins = [c.da < 0 ? ['a', 'a'] : null, c.db < 0 ? ['b', 'b'] : null].filter(Boolean);
        return {
          q: [`In the figure, $f(z) = \\dfrac{1}{z - a} + \\dfrac{2}{z - b}$ with $a = ${n(c.p)}$ and $b = 0.9 + 0.9i$. The contour is the circle with centre $${cx(c.cxv, c.cyv)}$ and radius $${n(c.R)}$, traversed anticlockwise. Writing $\\oint f\\,dz = 2\\pi i K$, what is $K$?`, `図の関数は $f(z) = \\dfrac{1}{z - a} + \\dfrac{2}{z - b}$、$a = ${n(c.p)}$、$b = 0.9 + 0.9i$ です。経路は中心 $${cx(c.cxv, c.cyv)}$、半径 $${n(c.R)}$ の円で、反時計回りにたどります。$\\oint f\\,dz = 2\\pi i K$ と書くとき、$K$ はいくつですか。`],
          a: { type: 'int', v: c.K },
          hint: ['Check which poles lie inside the circle: compare each pole\'s distance from the centre with the radius.', 'どの極が円の内側にあるかを、中心からの距離と半径を比べて調べてください。'],
          sol: [[`Distance from the centre to $a$: $${n(c.da + c.R, 3)}$; to $b$: $${n(c.db + c.R, 3)}$; radius $${n(c.R)}$.`, `中心から $a$ までの距離は $${n(c.da + c.R, 3)}$、$b$ までは $${n(c.db + c.R, 3)}$、半径は $${n(c.R)}$ です。`], [ins.length ? `Inside: ${ins.map((x) => '$' + x[0] + '$').join(' and ')}, with residues summing to $${c.K}$.` : 'No pole is inside, so $f$ is holomorphic on and inside the contour.', ins.length ? `内側にあるのは ${ins.map((x) => '$' + x[1] + '$').join(' と ')} で、留数の和は $${c.K}$ です。` : '内側に極はないので、$f$ は経路の上と内側で正則です。'], [`So $\\oint f\\,dz = ${c.K ? 2 * c.K + '\\pi i' : '0'}$ and $K = ${c.K}$: the running integral in the figure ends there.`, `したがって $\\oint f\\,dz = ${c.K ? 2 * c.K + '\\pi i' : '0'}$、$K = ${c.K}$ で、図の途中までの積分はそこで終わります。`]],
          set: { cx: c.cxv, cy: c.cyv, radius: c.R, pole: c.p },
        };
      }
      if (form === 1) {
        const al = r.nz(-3, 3), be = r.int(-4, 4), z0 = r.nz(-3, 3), z1 = r.pick([z0 + 2, z0 - 3, 5, -5].filter((x) => x !== z0));
        const res = al * z0 + be;
        return {
          q: [`Find the residue of $f(z) = \\dfrac{${terms([[al, 'z'], [be, '']])}}{z ${z0 < 0 ? '+' : '-'} ${Math.abs(z0)}} + \\dfrac{1}{z ${z1 < 0 ? '+' : '-'} ${Math.abs(z1)}}$ at $z = ${z0}$.`, `$f(z) = \\dfrac{${terms([[al, 'z'], [be, '']])}}{z ${z0 < 0 ? '+' : '-'} ${Math.abs(z0)}} + \\dfrac{1}{z ${z1 < 0 ? '+' : '-'} ${Math.abs(z1)}}$ の $z = ${z0}$ における留数を求めてください。`],
          a: { type: 'int', v: res },
          hint: ['At a simple pole $z_0$, $\\operatorname{Res} = \\lim_{z\\to z_0}(z - z_0)f(z)$. The second term is holomorphic there.', '単純極 $z_0$ では $\\operatorname{Res} = \\lim_{z\\to z_0}(z - z_0)f(z)$ です。第2項はそこで正則です。'],
          sol: [[`$(z ${z0 < 0 ? '+ ' + -z0 : '- ' + z0})f(z) \\to ${terms([[al, 'z'], [be, '']])}$ evaluated at $z = ${z0}$; the second term contributes nothing.`, `$(z ${z0 < 0 ? '+ ' + -z0 : '- ' + z0})f(z)$ は $z = ${z0}$ で $${terms([[al, 'z'], [be, '']])}$ の値に近づき、第2項は寄与しません。`], [`$\\operatorname{Res} = ${al}\\cdot(${z0}) ${be < 0 ? '-' : '+'} ${Math.abs(be)} = ${res}$.`, `$\\operatorname{Res} = ${al}\\cdot(${z0}) ${be < 0 ? '-' : '+'} ${Math.abs(be)} = ${res}$ です。`]],
        };
      }
      const k = r.nz(-3, 3), kind = r.int(0, 2);
      const fx = kind === 0 ? `\\dfrac{e^{${k === 1 ? '' : k === -1 ? '-' : k}z}}{z^2}` : kind === 1 ? `\\dfrac{\\cos(${k === 1 ? '' : k === -1 ? '-' : k}z)}{z^3}` : `\\dfrac{\\sin(${k === 1 ? '' : k === -1 ? '-' : k}z)}{z^4}`;
      const v = kind === 0 ? k : kind === 1 ? -k * k / 2 : -(k ** 3) / 6;
      const show = kind === 0 ? String(k) : kind === 1 ? frac(-k * k, 2) : frac(-(k ** 3), 6);
      const ser = kind === 0 ? `${terms([[1, ''], [k, 'z']])} + \\tfrac{${k * k}}{2}z^2 + \\cdots` : kind === 1 ? `1 - \\tfrac{${k * k}}{2}z^2 + \\cdots` : `${terms([[k, 'z']])} ${k > 0 ? '-' : '+'} \\tfrac{${Math.abs(k ** 3)}}{6}z^3 + \\cdots`;
      const need = kind === 0 ? 'z' : kind === 1 ? 'z^2' : 'z^3';
      return {
        q: [`Find $\\operatorname{Res}_{z=0}\\, ${fx}$.`, `$\\operatorname{Res}_{z=0}\\, ${fx}$ を求めてください。`],
        a: { type: 'num', v, show },
        hint: ['The residue is the coefficient of $1/z$ in the Laurent series. Expand the numerator as a Taylor series.', '留数はローラン級数の $1/z$ の係数です。分子をテイラー展開してください。'],
        sol: [[`The numerator is $${ser}$.`, `分子は $${ser}$ です。`], [`Dividing by $z^{${kind + 2}}$, the $1/z$ term comes from the $${need}$ term of the numerator: $\\operatorname{Res} = ${show}$.`, `$z^{${kind + 2}}$ で割ると、$1/z$ の項は分子の $${need}$ の項から来るので、$\\operatorname{Res} = ${show}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let p, q; do { p = r.int(-3, 3); q = r.int(-3, 3); } while (p === q);
        const encl = r.int(0, 2); // 0: only p, 1: only q, 2: both
        const Rr = encl === 2 ? Math.max(Math.abs(p), Math.abs(q)) + 1 : 0.5;
        const ctr = encl === 0 ? p : encl === 1 ? q : 0;
        const K2 = encl === 0 ? 2 / (p - q) : encl === 1 ? 2 / (q - p) : 0;
        const path = encl === 2 ? `|z| = ${Rr}` : `|z ${ctr < 0 ? '+ ' + -ctr : ctr > 0 ? '- ' + ctr : ''}| = \\tfrac12`;
        const fz = `\\dfrac{1}{(z ${p < 0 ? '+ ' + -p : p > 0 ? '- ' + p : ''})(z ${q < 0 ? '+ ' + -q : q > 0 ? '- ' + q : ''})}`;
        return {
          q: [`Evaluate $\\oint_{${path}} ${fz}\\,dz$ (anticlockwise). Write the answer as $c\\,\\pi i$ and give $c$.`, `$\\oint_{${path}} ${fz}\\,dz$（反時計回り）を求めてください。答えを $c\\,\\pi i$ と書いて $c$ を答えてください。`],
          a: { type: 'num', v: K2, show: frac(encl === 0 ? 2 : encl === 1 ? -2 : 0, encl === 2 ? 1 : p - q) },
          hint: ['Find which of the two simple poles lie inside the contour; the residue at $z = p$ is $1/(p - q)$.', '2つの単純極のどれが経路の内側にあるかを調べてください。$z = p$ での留数は $1/(p - q)$ です。'],
          sol: [[`$\\operatorname{Res}_{z=${p}} = 1/(${p} - (${q})) = ${frac(1, p - q)}$ and $\\operatorname{Res}_{z=${q}} = ${frac(1, q - p)}$.`, `$\\operatorname{Res}_{z=${p}} = 1/(${p} - (${q})) = ${frac(1, p - q)}$、$\\operatorname{Res}_{z=${q}} = ${frac(1, q - p)}$ です。`], [encl === 2 ? 'Both poles are inside, and their residues cancel.' : `Only $z = ${ctr}$ is inside.`, encl === 2 ? '両方の極が内側にあり、留数は打ち消し合います。' : `内側にあるのは $z = ${ctr}$ だけです。`], [`$\\oint = 2\\pi i \\cdot ${encl === 2 ? '0' : frac(encl === 0 ? 1 : -1, p - q)} = ${encl === 2 ? '0' : frac(encl === 0 ? 2 : -2, p - q) + '\\pi i'}$, so $c = ${frac(encl === 0 ? 2 : encl === 1 ? -2 : 0, encl === 2 ? 1 : p - q)}$.${encl === 2 ? ' A function that decays like $1/z^2$ has zero integral round any circle enclosing all its poles.' : ''}`, `$\\oint = 2\\pi i \\cdot ${encl === 2 ? '0' : frac(encl === 0 ? 1 : -1, p - q)} = ${encl === 2 ? '0' : frac(encl === 0 ? 2 : -2, p - q) + '\\pi i'}$ なので $c = ${frac(encl === 0 ? 2 : encl === 1 ? -2 : 0, encl === 2 ? 1 : p - q)}$ です。${encl === 2 ? '$1/z^2$ のように減衰する関数では、すべての極を囲む円に沿った積分は 0 です。' : ''}`]],
        };
      }
      if (form === 1) {
        const m = r.int(2, 5), a = r.nz(-2, 2);
        const v = m * a ** (m - 1);
        return {
          q: [`Find the residue of $f(z) = \\dfrac{z^{${m}}}{(z ${a < 0 ? '+ ' + -a : '- ' + a})^2}$ at its double pole.`, `$f(z) = \\dfrac{z^{${m}}}{(z ${a < 0 ? '+ ' + -a : '- ' + a})^2}$ の2位の極における留数を求めてください。`],
          a: { type: 'int', v },
          hint: ['At a double pole $z_0$, $\\operatorname{Res} = \\dfrac{d}{dz}\\big[(z - z_0)^2 f(z)\\big]_{z = z_0}$.', '2位の極 $z_0$ では $\\operatorname{Res} = \\dfrac{d}{dz}\\big[(z - z_0)^2 f(z)\\big]_{z = z_0}$ です。'],
          sol: [[`$(z - ${a})^2 f(z) = z^{${m}}$, whose derivative is $${m}z^{${m - 1}}$.`, `$(z - ${a})^2 f(z) = z^{${m}}$ で、その導関数は $${m}z^{${m - 1}}$ です。`], [`At $z = ${a}$: $\\operatorname{Res} = ${m}\\cdot(${a})^{${m - 1}} = ${v}$. Equivalently, expand $z^{${m}}$ about $${a}$ and read off the coefficient of $(z - ${a})$.`, `$z = ${a}$ で $\\operatorname{Res} = ${m}\\cdot(${a})^{${m - 1}} = ${v}$ です。$z^{${m}}$ を $${a}$ のまわりで展開して $(z - ${a})$ の係数を読んでも同じです。`]],
        };
      }
      const al = r.nz(-3, 3), be = r.nz(-4, 4), c = r.int(1, 3);
      const resC = (al * c + be) / (2 * c), resM = (al * c - be) / (2 * c);
      const which = r.int(0, 2);
      const K = which === 0 ? resC : which === 1 ? resM : al;
      const path = which === 2 ? `|z| = ${c + 1}` : `|z ${which === 0 ? '- ' + c : '+ ' + c}| = 1`;
      return {
        q: [`Evaluate $\\oint_{${path}} \\dfrac{${terms([[al, 'z'], [be, '']])}}{z^2 - ${c * c}}\\,dz$ (anticlockwise) as $c\\,\\pi i$. Give $c$.`, `$\\oint_{${path}} \\dfrac{${terms([[al, 'z'], [be, '']])}}{z^2 - ${c * c}}\\,dz$（反時計回り）を $c\\,\\pi i$ の形で求め、$c$ を答えてください。`],
        a: { type: 'num', v: 2 * K, show: frac(Math.round(2 * K * 2 * c), 2 * c) },
        hint: [`The poles are $z = \\pm ${c}$; at a simple pole $z_0$ of $g/h$, $\\operatorname{Res} = g(z_0)/h'(z_0)$.`, `極は $z = \\pm ${c}$ です。$g/h$ の単純極 $z_0$ では $\\operatorname{Res} = g(z_0)/h'(z_0)$ です。`],
        sol: [[`$\\operatorname{Res}_{z=${c}} = \\dfrac{${n(al * c + be)}}{${2 * c}} = ${n(resC, 4)}$, $\\operatorname{Res}_{z=-${c}} = \\dfrac{${n(-al * c + be)}}{${-2 * c}} = ${n(resM, 4)}$.`, `$\\operatorname{Res}_{z=${c}} = \\dfrac{${n(al * c + be)}}{${2 * c}} = ${n(resC, 4)}$、$\\operatorname{Res}_{z=-${c}} = \\dfrac{${n(-al * c + be)}}{${-2 * c}} = ${n(resM, 4)}$ です。`], [which === 2 ? `Both are inside; the sum is $${n(al)}$, the coefficient of $z$ in the numerator.` : `Only $z = ${which === 0 ? '' : '-'}${c}$ is inside.`, which === 2 ? `両方とも内側にあり、和は分子の $z$ の係数 $${n(al)}$ です。` : `内側にあるのは $z = ${which === 0 ? '' : '-'}${c}$ だけです。`], [`$\\oint = 2\\pi i\\cdot (${n(K, 4)})$, so $c = ${n(2 * K, 4)}$.`, `$\\oint = 2\\pi i\\cdot (${n(K, 4)})$ なので $c = ${n(2 * K, 4)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2);
        if (kind < 2 && r.chance(0.4)) {
          const v = kind === 0 ? 'pi/a' : 'pi/(2*a^3)';
          const integrand = kind === 0 ? '\\dfrac{dx}{x^2 + a^2}' : '\\dfrac{dx}{(x^2 + a^2)^2}';
          return {
            q: [`For $a > 0$, evaluate $\\displaystyle\\int_{-\\infty}^{\\infty} ${integrand}$ as a function of $a$.`, `$a > 0$ のとき、$\\displaystyle\\int_{-\\infty}^{\\infty} ${integrand}$ を $a$ の式で求めてください。`],
            a: { type: 'expr', v, vars: ['a'], dom: { a: [0.4, 2.5] }, lhs: ['$I(a) =$', '$I(a) =$'] },
            hint: ['Close the contour with a large semicircle in the upper half-plane; only the pole at $z = ia$ is enclosed, and the arc contributes nothing in the limit.', '上半平面の大きな半円で経路を閉じます。囲まれる極は $z = ia$ だけで、円弧の寄与は極限で 0 になります。'],
            sol: kind === 0
              ? [['$\\operatorname{Res}_{z=ia}\\dfrac{1}{z^2 + a^2} = \\dfrac{1}{2ia}$.', '$\\operatorname{Res}_{z=ia}\\dfrac{1}{z^2 + a^2} = \\dfrac{1}{2ia}$ です。'], ['$I = 2\\pi i\\cdot\\dfrac{1}{2ia} = \\dfrac{\\pi}{a}$.', '$I = 2\\pi i\\cdot\\dfrac{1}{2ia} = \\dfrac{\\pi}{a}$ です。'], ['It halves when $a$ doubles: the bump becomes twice as wide and four times lower.', '$a$ を2倍にすると半分になります。こぶの幅が2倍、高さが4分の1になるからです。']]
              : [['At the double pole $ia$: $\\operatorname{Res} = \\dfrac{d}{dz}(z + ia)^{-2}\\Big|_{ia} = -2(2ia)^{-3} = \\dfrac{1}{4ia^3}$.', '2位の極 $ia$ で $\\operatorname{Res} = \\dfrac{d}{dz}(z + ia)^{-2}\\Big|_{ia} = -2(2ia)^{-3} = \\dfrac{1}{4ia^3}$ です。'], ['$I = 2\\pi i\\cdot\\dfrac{1}{4ia^3} = \\dfrac{\\pi}{2a^3}$.', '$I = 2\\pi i\\cdot\\dfrac{1}{4ia^3} = \\dfrac{\\pi}{2a^3}$ です。'], ['Check by scaling: substituting $x = at$ turns $dx/(x^2 + a^2)^2$ into $a^{-3}\\,dt/(t^2 + 1)^2$.', 'スケールで確かめると、$x = at$ と置換すれば $dx/(x^2 + a^2)^2$ は $a^{-3}\\,dt/(t^2 + 1)^2$ になります。']],
          };
        }
        let a, b; do { a = r.int(1, 4); b = r.int(1, 4); } while (a === b && kind === 1);
        const vals = [PI / a, PI / (a * b * (a + b)), PI / (2 * a ** 3)];
        const shows = [`\\tfrac{\\pi}{${a}}`, `\\tfrac{\\pi}{${a * b * (a + b)}}`, `\\tfrac{\\pi}{${2 * a ** 3}}`];
        const ints = [`\\dfrac{dx}{x^2 + ${a * a}}`, `\\dfrac{dx}{(x^2 + ${a * a})(x^2 + ${b * b})}`, `\\dfrac{dx}{(x^2 + ${a * a})^2}`];
        const ai = a === 1 ? 'i' : a + 'i', bi = b === 1 ? 'i' : b + 'i';
        const sols = [
          [[`Close in the upper half-plane; the enclosed pole is $z = ${a === 1 ? '' : a}i$ with residue $\\dfrac{1}{${2 * a}i}$.`, `上半平面で閉じます。囲まれる極は $z = ${a === 1 ? '' : a}i$ で、留数は $\\dfrac{1}{${2 * a}i}$ です。`], [`$I = 2\\pi i\\cdot\\dfrac{1}{${2 * a}i} = ${shows[0]}$.`, `$I = 2\\pi i\\cdot\\dfrac{1}{${2 * a}i} = ${shows[0]}$ です。`]],
          [[`Enclosed poles $${ai}$ and $${bi}$. Residues $\\dfrac{1}{2i\\cdot${a}(${b * b} - ${a * a})}$ and $\\dfrac{1}{2i\\cdot${b}(${a * a} - ${b * b})}$.`, `囲まれる極は $${ai}$ と $${bi}$ です。留数は $\\dfrac{1}{2i\\cdot${a}(${b * b} - ${a * a})}$ と $\\dfrac{1}{2i\\cdot${b}(${a * a} - ${b * b})}$ です。`], [`Their sum times $2\\pi i$ simplifies to $\\dfrac{\\pi}{ab(a + b)} = ${shows[1]}$.`, `その和に $2\\pi i$ を掛けると $\\dfrac{\\pi}{ab(a + b)} = ${shows[1]}$ に整理できます。`]],
          [[`Double pole at $${ai}$: $\\operatorname{Res} = \\dfrac{d}{dz}(z + ${ai})^{-2}\\Big|_{${ai}} = \\dfrac{1}{${4 * a ** 3}i}$.`, `$${ai}$ の2位の極で $\\operatorname{Res} = \\dfrac{d}{dz}(z + ${ai})^{-2}\\Big|_{${ai}} = \\dfrac{1}{${4 * a ** 3}i}$ です。`], [`$I = 2\\pi i\\cdot\\dfrac{1}{${4 * a ** 3}i} = ${shows[2]}$.`, `$I = 2\\pi i\\cdot\\dfrac{1}{${4 * a ** 3}i} = ${shows[2]}$ です。`]],
        ];
        return {
          q: [`Evaluate $\\displaystyle\\int_{-\\infty}^{\\infty} ${ints[kind]}$ using residues.`, `留数を使って $\\displaystyle\\int_{-\\infty}^{\\infty} ${ints[kind]}$ を求めてください。`],
          a: { type: 'num', v: vals[kind], show: shows[kind] },
          hint: ['Close with a large upper semicircle: the arc integral tends to $0$ because the integrand decays like $1/|z|^2$ or faster.', '上半平面の大きな半円で閉じます。被積分関数は $1/|z|^2$ 以上の速さで減衰するので、円弧の積分は 0 に近づきます。'],
          sol: sols[kind].concat([['No antiderivative was needed: the poles in the upper half-plane decide the value of the real integral.', '原始関数を工夫しなくても、上半平面の極だけで実積分の値が決まります。']]),
        };
      }
      if (form === 1) {
        const [a, b, s] = r.pick([[5, 3, 4], [5, 4, 3], [13, 5, 12], [13, 12, 5], [2, 1, null], [3, 1, null], [3, 2, null], [10, 6, 8], [17, 8, 15]]);
        const root = Math.sqrt(a * a - b * b), v = 2 * PI / root;
        const sq = s ? String(s) : `\\sqrt{${a * a - b * b}}`;
        return {
          q: [`Evaluate $\\displaystyle\\int_0^{2\\pi} \\frac{d\\theta}{${a} + ${b === 1 ? '' : b}\\cos\\theta}$.`, `$\\displaystyle\\int_0^{2\\pi} \\frac{d\\theta}{${a} + ${b === 1 ? '' : b}\\cos\\theta}$ を求めてください。`],
          a: { type: 'num', v, show: s ? (s % 2 === 0 ? `\\tfrac{\\pi}{${s / 2}}` : `\\tfrac{2\\pi}{${s}}`) : `\\tfrac{2\\pi}{\\sqrt{${a * a - b * b}}}` },
          hint: ['Put $z = e^{i\\theta}$: $\\cos\\theta = (z + z^{-1})/2$ and $d\\theta = dz/(iz)$, turning the integral into one round $|z| = 1$.', '$z = e^{i\\theta}$ とおくと $\\cos\\theta = (z + z^{-1})/2$、$d\\theta = dz/(iz)$ となり、$|z| = 1$ を回る積分になります。'],
          sol: [[`The integral becomes $\\oint_{|z|=1} \\dfrac{2\\,dz}{i(${b === 1 ? '' : b}z^2 + ${2 * a}z + ${b})}$.`, `積分は $\\oint_{|z|=1} \\dfrac{2\\,dz}{i(${b === 1 ? '' : b}z^2 + ${2 * a}z + ${b})}$ になります。`], [`The roots are $z_\\pm = \\dfrac{-${a} \\pm ${sq}}{${b}}$; only $z_+ = ${n((-a + root) / b, 4)}$ lies inside the unit circle, with residue $\\dfrac{2}{i${b === 1 ? '' : '\\cdot ' + b}(z_+ - z_-)} = \\dfrac{1}{i${sq}}$.`, `根は $z_\\pm = \\dfrac{-${a} \\pm ${sq}}{${b}}$ で、単位円の内側にあるのは $z_+ = ${n((-a + root) / b, 4)}$ だけです。留数は $\\dfrac{2}{i${b === 1 ? '' : '\\cdot ' + b}(z_+ - z_-)} = \\dfrac{1}{i${sq}}$ です。`], [`$I = 2\\pi i\\cdot\\dfrac{1}{i${sq}} = \\dfrac{2\\pi}{${sq}} = ${n(v, 4)}$. As $b \\to a$ the denominator nearly vanishes at $\\theta = \\pi$ and the integral blows up.`, `$I = 2\\pi i\\cdot\\dfrac{1}{i${sq}} = \\dfrac{2\\pi}{${sq}} = ${n(v, 4)}$ です。$b \\to a$ では $\\theta = \\pi$ で分母がほぼ 0 になり、積分は発散します。`]],
        };
      }
      const p = r.step(-1.6, 1.6, 0.1), pa = Math.abs(p), bb = Math.hypot(...B);
      const want = r.int(0, 1); // 0: smallest radius for 6 pi i, 1: radius range for exactly 2 pi i (only a)
      const thr = Math.max(pa, bb);
      if (want === 1 && pa < bb - 0.1) {
        return {
          q: [`In the figure (centre $0$), the pole $a$ sits at $${n(p)}$ and $b = 0.9 + 0.9i$. For which radii $R$ does the circle $|z| = R$ give $\\oint f\\,dz = 2\\pi i$ exactly? Give the interval $(R_1, R_2)$.`, `図で中心を $0$ とし、極 $a$ を $${n(p)}$、$b = 0.9 + 0.9i$ とします。円 $|z| = R$ がちょうど $\\oint f\\,dz = 2\\pi i$ を与えるのはどの半径ですか。区間 $(R_1, R_2)$ で答えてください。`],
          a: { type: 'tuple', v: [pa, bb], labels: ['$R_1$', '$R_2$'], tol: 0.005 },
          hint: ['$2\\pi i$ means the enclosed residues sum to $1$: only $a$ may be inside.', '$2\\pi i$ は囲まれた留数の和が $1$ であることを意味します。内側にあってよいのは $a$ だけです。'],
          sol: [[`$a$ is inside when $R > |a| = ${n(pa)}$; $b$ is inside when $R > |b| = 0.9\\sqrt2 = ${n(bb, 4)}$.`, `$R > |a| = ${n(pa)}$ なら $a$ が内側に、$R > |b| = 0.9\\sqrt2 = ${n(bb, 4)}$ なら $b$ が内側にあります。`], [`So $${n(pa)} < R < ${n(bb, 4)}$. Below it the integral is $0$; above it, $6\\pi i$. It jumps by $2\\pi i\\cdot\\operatorname{Res}$ each time the contour sweeps over a pole.`, `したがって $${n(pa)} < R < ${n(bb, 4)}$ です。それより小さいと積分は $0$、大きいと $6\\pi i$ で、経路が極を横切るたびに $2\\pi i\\cdot$留数だけ跳びます。`]],
          set: { cx: 0, cy: 0, pole: p, radius: Math.min(2, Math.max(0.3, Math.round(((pa + bb) / 2) * 20) / 20)) },
        };
      }
      return {
        q: [`In the figure (centre $0$), the pole $a$ sits at $${n(p)}$ and $b = 0.9 + 0.9i$. What is the smallest radius $R_*$ such that every circle $|z| = R > R_*$ gives $\\oint f\\,dz = 6\\pi i$?`, `図で中心を $0$ とし、極 $a$ を $${n(p)}$、$b = 0.9 + 0.9i$ とします。$R > R_*$ のどの円 $|z| = R$ でも $\\oint f\\,dz = 6\\pi i$ となる最小の $R_*$ はいくつですか。`],
        a: { type: 'num', v: thr, tol: 0.005 },
        hint: ['$6\\pi i = 2\\pi i(1 + 2)$ needs both poles inside.', '$6\\pi i = 2\\pi i(1 + 2)$ には両方の極が内側にある必要があります。'],
        sol: [[`$|a| = ${n(pa)}$ and $|b| = 0.9\\sqrt2 = ${n(bb, 4)}$.`, `$|a| = ${n(pa)}$、$|b| = 0.9\\sqrt2 = ${n(bb, 4)}$ です。`], [`Both are inside exactly when $R > \\max(|a|, |b|) = ${n(thr, 4)}$. Beyond that, enlarging the circle changes nothing: the integral depends only on which poles are enclosed.`, `両方が内側にあるのは $R > \\max(|a|, |b|) = ${n(thr, 4)}$ のときちょうどです。それ以上円を大きくしても何も変わりません。積分はどの極を囲むかだけで決まるからです。`]],
        set: { cx: 0, cy: 0, pole: p, radius: Math.min(2, Math.round((thr + 0.15) * 20) / 20) },
      };
    },
  ];

  /* ---------------- 3. harmonic conjugates ---------------- */
  const FN = [
    { name: 'z^2', u: (x, y) => x * x - y * y, d: (z) => [2 * z[0], 2 * z[1]] },
    { name: 'z^3', u: (x, y) => x ** 3 - 3 * x * y * y, d: (z) => { const w = cmul(z, z); return [3 * w[0], 3 * w[1]]; } },
    { name: 'e^z', u: (x, y) => Math.exp(x) * Math.cos(y), d: (z) => [Math.exp(z[0]) * Math.cos(z[1]), Math.exp(z[0]) * Math.sin(z[1])] },
  ];
  const uTeX = ['x^2 - y^2', 'x^3 - 3xy^2', 'e^x\\cos y'];
  Q.harmonic = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.int(0, 2), x = r.step(-1.5, 1.5, 0.5), y = r.step(-1.5, 1.5, 0.5);
        const u = FN[k].u(x, y);
        return {
          q: [`Let $f(z) = ${FN[k].name}$ and $u = \\operatorname{Re} f$. Find $u$ at $(x, y) = (${n(x)}, ${n(y)})$.`, `$f(z) = ${FN[k].name}$、$u = \\operatorname{Re} f$ とします。$(x, y) = (${n(x)}, ${n(y)})$ での $u$ を求めてください。`],
          a: { type: 'num', v: u, tol: k === 2 ? 5e-4 : 1e-6 },
          hint: [`$u(x, y) = ${uTeX[k]}$.`, `$u(x, y) = ${uTeX[k]}$ です。`],
          sol: [[`For $z = x + iy$, $\\operatorname{Re}\\,${FN[k].name} = ${uTeX[k]}$.`, `$z = x + iy$ のとき $\\operatorname{Re}\\,${FN[k].name} = ${uTeX[k]}$ です。`], [`At $(${n(x)}, ${n(y)})$: $u = ${n(u, 4)}$. In the figure this is the level of the blue curve through the probe when $\\varphi = 0$.`, `$(${n(x)}, ${n(y)})$ では $u = ${n(u, 4)}$ です。図では $\\varphi = 0$ のとき、調べる点を通る青い等高線の値です。`]],
          set: { fn: k, phase: 0, px: x, py: y },
        };
      }
      if (form === 1) {
        const a = r.nz(-3, 3), harm = r.chance(0.5), b = harm ? -a : r.pick([a, 2 * a, -2 * a, a + 1].filter((t) => t !== -a)), c = r.int(-3, 3);
        const lap = 2 * a + 2 * b;
        return {
          q: [`Is $u(x, y) = ${terms([[a, 'x^2'], [c, 'xy'], [b, 'y^2']])}$ harmonic?`, `$u(x, y) = ${terms([[a, 'x^2'], [c, 'xy'], [b, 'y^2']])}$ は調和関数ですか。`],
          a: { type: 'choice', fixed: true, v: harm ? 0 : 1, opts: [['Yes: $u_{xx} + u_{yy} = 0$', 'はい。$u_{xx} + u_{yy} = 0$ です'], harm ? [`No: $u_{xx} = ${2 * a} \\ne 0$`, `いいえ。$u_{xx} = ${2 * a} \\ne 0$ です`] : [`No: $u_{xx} + u_{yy} = ${lap} \\ne 0$`, `いいえ。$u_{xx} + u_{yy} = ${lap} \\ne 0$ です`], ['It depends on the point', '点によって異なる']] },
          hint: ['Compute the Laplacian $u_{xx} + u_{yy}$. The $xy$ term does not contribute.', 'ラプラシアン $u_{xx} + u_{yy}$ を計算してください。$xy$ の項は寄与しません。'],
          sol: [[`$u_{xx} = ${2 * a}$ and $u_{yy} = ${2 * b}$, so $\\Delta u = ${lap}$ everywhere.`, `$u_{xx} = ${2 * a}$、$u_{yy} = ${2 * b}$ なので、至るところ $\\Delta u = ${lap}$ です。`], [harm ? `It is harmonic: in fact $u = \\operatorname{Re}\\big((${a}${c ? ` ${c > 0 ? '-' : '+'} ${frac(Math.abs(c), 2)}i` : ''})z^2\\big)$.` : 'It is not harmonic, so it cannot be the real part of any holomorphic function.', harm ? `調和関数です。実際 $u = \\operatorname{Re}\\big((${a}${c ? ` ${c > 0 ? '-' : '+'} ${frac(Math.abs(c), 2)}i` : ''})z^2\\big)$ です。` : '調和関数ではないので、どんな正則関数の実部にもなりえません。']],
        };
      }
      let x, y; do { x = r.step(-1.5, 1.5, 0.5); y = r.step(-1.5, 1.5, 0.5); } while (x === 0 && y === 0);
      const ph = r.step(0, 180, 15);
      const g = 2 * Math.hypot(x, y);
      return {
        q: [`For $f(z) = e^{i\\cdot ${ph}^\\circ} z^2$, find $|\\nabla u|$ at $(${n(x)}, ${n(y)})$, where $u = \\operatorname{Re} f$.`, `$f(z) = e^{i\\cdot ${ph}^\\circ} z^2$ について、$u = \\operatorname{Re} f$ の $(${n(x)}, ${n(y)})$ における $|\\nabla u|$ を求めてください。`],
        a: { type: 'num', v: g, tol: 1e-3 },
        hint: ['By Cauchy–Riemann, $|\\nabla u| = |f\'(z)|$, and the phase factor has modulus $1$.', 'コーシー・リーマン方程式より $|\\nabla u| = |f\'(z)|$ で、位相因子の絶対値は $1$ です。'],
        sol: [[`$f'(z) = 2e^{i\\varphi}z$, so $|f'| = 2|z| = 2\\sqrt{${n(x * x + y * y)}}$.`, `$f'(z) = 2e^{i\\varphi}z$ なので $|f'| = 2|z| = 2\\sqrt{${n(x * x + y * y)}}$ です。`], [`$|\\nabla u| = ${n(g, 4)}$, whatever the phase: rotating $f$ turns both gradients but does not change their length.`, `位相によらず $|\\nabla u| = ${n(g, 4)}$ です。$f$ を回転すると2つの勾配は向きを変えますが、長さは変わりません。`]],
        set: { fn: 0, phase: ph, px: x, py: y },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 4);
        let u, v, sol;
        if (kind === 0) {
          const a = r.nz(-3, 3), b = r.int(-3, 3), c = r.int(-3, 3);
          u = terms([[a, 'x^2'], [-a, 'y^2'], [b, 'x'], [c, 'y']]); v = `${2 * a}*x*y+(${b})*y-(${c})*x`;
          sol = [[`$u_x = ${terms([[2 * a, 'x'], [b, '']])}$, so $v_y = ${terms([[2 * a, 'x'], [b, '']])}$ and $v = ${terms([[2 * a, 'xy'], [b, 'y']])} + h(x)$.`, `$u_x = ${terms([[2 * a, 'x'], [b, '']])}$ なので $v_y = ${terms([[2 * a, 'x'], [b, '']])}$、$v = ${terms([[2 * a, 'xy'], [b, 'y']])} + h(x)$ です。`], [`$v_x = -u_y$ gives $${2 * a}y + h'(x) = ${terms([[2 * a, 'y'], [-c, '']])}$, so $h = ${terms([[-c, 'x']])} + C$.`, `$v_x = -u_y$ より $${2 * a}y + h'(x) = ${terms([[2 * a, 'y'], [-c, '']])}$、$h = ${terms([[-c, 'x']])} + C$ です。`], [`$v = ${terms([[2 * a, 'xy'], [b, 'y'], [-c, 'x']])} + C$, and $u + iv = ${terms([[a, 'z^2'], [b === 0 && c === 0 ? 0 : 1, `(${terms([[b, ''], [-c, 'i']])})z`]])}$ up to a constant.`, `$v = ${terms([[2 * a, 'xy'], [b, 'y'], [-c, 'x']])} + C$ で、定数を除いて $u + iv = ${terms([[a, 'z^2'], [b === 0 && c === 0 ? 0 : 1, `(${terms([[b, ''], [-c, 'i']])})z`]])}$ です。`]];
        } else if (kind === 1) {
          u = 'x^3 - 3xy^2'; v = '3*x^2*y-y^3';
          sol = [['$v_y = u_x = 3x^2 - 3y^2$, so $v = 3x^2y - y^3 + h(x)$.', '$v_y = u_x = 3x^2 - 3y^2$ なので $v = 3x^2y - y^3 + h(x)$ です。'], ['$v_x = 6xy + h\'(x)$ must equal $-u_y = 6xy$, so $h$ is constant.', '$v_x = 6xy + h\'(x)$ は $-u_y = 6xy$ に等しいので、$h$ は定数です。'], ['$v = 3x^2y - y^3 + C$: $u + iv = z^3$.', '$v = 3x^2y - y^3 + C$ で、$u + iv = z^3$ です。']];
        } else if (kind === 2) {
          const k = r.pick([1, 2, 3]);
          const kk = k === 1 ? '' : k;
          u = `e^{${kk}x}\\cos ${kk}y`; v = `exp(${k}*x)*sin(${k}*y)`;
          sol = [[`$v_y = u_x = ${kk}e^{${kk}x}\\cos ${kk}y$, so $v = e^{${kk}x}\\sin ${kk}y + h(x)$.`, `$v_y = u_x = ${kk}e^{${kk}x}\\cos ${kk}y$ なので $v = e^{${kk}x}\\sin ${kk}y + h(x)$ です。`], [`$v_x = ${kk}e^{${kk}x}\\sin ${kk}y + h'$ equals $-u_y = ${kk}e^{${kk}x}\\sin ${kk}y$, so $h$ is constant.`, `$v_x = ${kk}e^{${kk}x}\\sin ${kk}y + h'$ が $-u_y = ${kk}e^{${kk}x}\\sin ${kk}y$ に等しいので、$h$ は定数です。`], [`$v = e^{${kk}x}\\sin ${kk}y + C$: $u + iv = e^{${kk}z}$.`, `$v = e^{${kk}x}\\sin ${kk}y + C$ で、$u + iv = e^{${kk}z}$ です。`]];
        } else if (kind === 3) {
          u = '\\dfrac{x}{x^2 + y^2}'; v = '-y/(x^2+y^2)';
          sol = [['Recognise $u = \\operatorname{Re}(1/z)$, since $1/z = \\bar z/|z|^2 = (x - iy)/(x^2 + y^2)$.', '$1/z = \\bar z/|z|^2 = (x - iy)/(x^2 + y^2)$ なので $u = \\operatorname{Re}(1/z)$ です。'], ['So $v = \\operatorname{Im}(1/z) = -\\dfrac{y}{x^2 + y^2} + C$.', 'したがって $v = \\operatorname{Im}(1/z) = -\\dfrac{y}{x^2 + y^2} + C$ です。'], ['Check: $v_y = u_x = (y^2 - x^2)/(x^2 + y^2)^2$. The level curves of both are circles through $0$, meeting at right angles.', '確認：$v_y = u_x = (y^2 - x^2)/(x^2 + y^2)^2$ です。両方の等高線は $0$ を通る円で、直角に交わります。']];
        } else {
          const a = r.nz(-2, 2);
          u = terms([[a, 'xy']]); v = `${-a / 2}*(x^2-y^2)`;
          sol = [[`$v_y = u_x = ${terms([[a, 'y']])}$, so $v = ${frac(a, 2)}y^2 + h(x)$.`, `$v_y = u_x = ${terms([[a, 'y']])}$ なので $v = ${frac(a, 2)}y^2 + h(x)$ です。`], [`$v_x = h'(x) = -u_y = ${terms([[-a, 'x']])}$, so $h = ${frac(-a, 2)}x^2 + C$.`, `$v_x = h'(x) = -u_y = ${terms([[-a, 'x']])}$ なので $h = ${frac(-a, 2)}x^2 + C$ です。`], [`$v = ${frac(-a, 2)}(x^2 - y^2) + C$: $u + iv = ${frac(-a, 2)}iz^2$.`, `$v = ${frac(-a, 2)}(x^2 - y^2) + C$ で、$u + iv = ${frac(-a, 2)}iz^2$ です。`]];
        }
        return {
          q: [`Find a harmonic conjugate $v(x, y)$ of $u = ${u}$, so that $u + iv$ is holomorphic.`, `$u + iv$ が正則になるような、$u = ${u}$ の共役調和関数 $v(x, y)$ を求めてください。`],
          a: { type: 'expr', v, vars: ['x', 'y'], const: true, dom: { x: [0.4, 1.6], y: [0.3, 1.4] }, lhs: ['$v =$', '$v =$'] },
          hint: ['Integrate $v_y = u_x$ in $y$, then fix the leftover function of $x$ with $v_x = -u_y$.', '$v_y = u_x$ を $y$ で積分し、残った $x$ の関数を $v_x = -u_y$ で決めてください。'],
          sol,
        };
      }
      if (form === 1) {
        const kind = r.int(0, 2);
        if (kind === 0) {
          const p = r.nz(-3, 3);
          return {
            q: [`For which $a$ is $u = ${terms([[p, 'x^4'], [1, 'a\\,x^2y^2'], [p, 'y^4']])}$ harmonic?`, `$u = ${terms([[p, 'x^4'], [1, 'a\\,x^2y^2'], [p, 'y^4']])}$ が調和関数になる $a$ はいくつですか。`],
            a: { type: 'int', v: -6 * p },
            hint: ['Compute $u_{xx} + u_{yy}$ and make the coefficients of $x^2$ and $y^2$ vanish.', '$u_{xx} + u_{yy}$ を計算し、$x^2$ と $y^2$ の係数を 0 にしてください。'],
            sol: [[`$u_{xx} = ${12 * p}x^2 + 2ay^2$, $u_{yy} = 2ax^2 + ${12 * p}y^2$.`, `$u_{xx} = ${12 * p}x^2 + 2ay^2$、$u_{yy} = 2ax^2 + ${12 * p}y^2$ です。`], [`$\\Delta u = (${12 * p} + 2a)(x^2 + y^2) = 0$ needs $a = ${-6 * p}$; then $u = ${cf(p)}\\operatorname{Re} z^4$.`, `$\\Delta u = (${12 * p} + 2a)(x^2 + y^2) = 0$ には $a = ${-6 * p}$ が必要で、そのとき $u = ${cf(p)}\\operatorname{Re} z^4$ です。`]],
          };
        }
        const c = r.nz(-3, 3);
        const ux = kind === 1 ? terms([[c, 'x^3'], [1, 'a\\,xy^2']]) : terms([[1, 'a\\,x^2y'], [c, 'y^3']]);
        return {
          q: [`For which $a$ is $u = ${ux}$ harmonic?`, `$u = ${ux}$ が調和関数になる $a$ はいくつですか。`],
          a: { type: 'int', v: -3 * c },
          hint: ['Set the Laplacian $u_{xx} + u_{yy}$ to zero for all $x, y$.', 'すべての $x, y$ でラプラシアン $u_{xx} + u_{yy}$ が 0 になるようにしてください。'],
          sol: kind === 1
            ? [[`$u_{xx} = ${6 * c}x$, $u_{yy} = 2ax$, so $\\Delta u = (${6 * c} + 2a)x$.`, `$u_{xx} = ${6 * c}x$、$u_{yy} = 2ax$ なので $\\Delta u = (${6 * c} + 2a)x$ です。`], [`$a = ${-3 * c}$, and then $u = ${cf(c)}(x^3 - 3xy^2) = ${cf(c)}\\operatorname{Re} z^3$.`, `$a = ${-3 * c}$ で、そのとき $u = ${cf(c)}(x^3 - 3xy^2) = ${cf(c)}\\operatorname{Re} z^3$ です。`]]
            : [[`$u_{xx} = 2ay$, $u_{yy} = ${6 * c}y$, so $\\Delta u = (2a + ${6 * c})y$.`, `$u_{xx} = 2ay$、$u_{yy} = ${6 * c}y$ なので $\\Delta u = (2a + ${6 * c})y$ です。`], [`$a = ${-3 * c}$, and then $u = ${cf(-c)}(3x^2y - y^3) = ${cf(-c)}\\operatorname{Im} z^3$.`, `$a = ${-3 * c}$ で、そのとき $u = ${cf(-c)}(3x^2y - y^3) = ${cf(-c)}\\operatorname{Im} z^3$ です。`]],
        };
      }
      const x = r.step(-1.5, 1.5, 0.5), y = r.step(-1.5, 1.5, 0.5), ph = r.pick([0, 30, 45, 60, 90, 120, 135, 150, 180]);
      const fp = cmul([Math.cos(ph * D2R), Math.sin(ph * D2R)], [2 * x, 2 * y]);
      const gu = [fp[0], -fp[1]];
      return {
        q: [`For $f(z) = e^{i\\cdot ${ph}^\\circ} z^2$ and $u = \\operatorname{Re} f$, find $\\nabla u = (u_x, u_y)$ at $(${n(x)}, ${n(y)})$.`, `$f(z) = e^{i\\cdot ${ph}^\\circ} z^2$、$u = \\operatorname{Re} f$ について、$(${n(x)}, ${n(y)})$ における $\\nabla u = (u_x, u_y)$ を求めてください。`],
        a: { type: 'tuple', v: gu, labels: ['$u_x$', '$u_y$'], tol: 2e-3 },
        hint: ['$f\' = u_x + iv_x = u_x - iu_y$, so $\\nabla u = (\\operatorname{Re} f\', -\\operatorname{Im} f\')$.', '$f\' = u_x + iv_x = u_x - iu_y$ なので $\\nabla u = (\\operatorname{Re} f\', -\\operatorname{Im} f\')$ です。'],
        sol: [[`$f'(z_0) = 2e^{i\\cdot ${ph}^\\circ}(${cx(x, y)}) = ${cx(fp[0], fp[1], 3)}$.`, `$f'(z_0) = 2e^{i\\cdot ${ph}^\\circ}(${cx(x, y)}) = ${cx(fp[0], fp[1], 3)}$ です。`], [`$\\nabla u = (${n(gu[0], 3)}, ${n(gu[1], 3)})$, and $\\nabla v = (-u_y, u_x) = (${n(-gu[1], 3)}, ${n(gu[0], 3)})$ is the same vector turned by $90^\\circ$: compare the two arrows at the probe.`, `$\\nabla u = (${n(gu[0], 3)}, ${n(gu[1], 3)})$ で、$\\nabla v = (-u_y, u_x) = (${n(-gu[1], 3)}, ${n(gu[0], 3)})$ はそれを $90^\\circ$ 回したベクトルです。調べる点の2本の矢印と比べてください。`]],
        set: { fn: 0, phase: ph, px: x, py: y },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2), x0 = r.int(-2, 2), y0 = r.int(-2, 2), R = r.int(1, 5);
        const a = r.nz(-3, 3), b = r.int(-4, 4), c = r.int(-3, 3);
        const U = [(x, y) => a * (x * x - y * y) + b * x + c * y, (x, y) => x ** 3 - 3 * x * y * y + b * y, (x, y) => a * x * y + b * x + c];
        const UT = [terms([[a, 'x^2'], [-a, 'y^2'], [b, 'x'], [c, 'y']]), terms([[1, 'x^3'], [-3, 'xy^2'], [b, 'y']]), terms([[a, 'xy'], [b, 'x'], [c, '']])];
        const val = U[kind](x0, y0);
        return {
          q: [`What is the average of $u = ${UT[kind]}$ over the circle of radius $${R}$ centred at $(${x0}, ${y0})$?`, `中心 $(${x0}, ${y0})$、半径 $${R}$ の円の上での $u = ${UT[kind]}$ の平均値はいくつですか。`],
          a: { type: 'int', v: val },
          hint: ['Check that $u$ is harmonic. Then you do not need to integrate anything.', '$u$ が調和関数であることを確かめてください。そうすれば何も積分する必要はありません。'],
          sol: [['$u_{xx} + u_{yy} = 0$, so $u$ is harmonic in the whole plane.', '$u_{xx} + u_{yy} = 0$ なので、$u$ は平面全体で調和です。'], [`By the mean-value property the average over any circle equals the value at its centre: $u(${x0}, ${y0}) = ${val}$, whatever the radius.`, `平均値の性質により、どの円の上の平均も中心での値に等しく、半径によらず $u(${x0}, ${y0}) = ${val}$ です。`], ['This is why a harmonic function has no interior maxima or minima: the centre can never be above or below all of its neighbours.', '調和関数が内部に極大も極小ももたないのはこのためです。中心がまわりのすべての点より高くも低くもなれないのです。']],
        };
      }
      if (form === 1) {
        const k = r.int(2, 3), ph = r.step(0, 180, 5);
        const ask = r.int(0, 1);
        return {
          q: [ask ? `The level set $u = 0$ of $u = \\operatorname{Re}\\big(e^{i\\cdot ${ph}^\\circ} z^${k}\\big)$ near the critical point $0$ consists of straight lines through $0$. How many lines?` : `At the critical point $0$ of $u = \\operatorname{Re}\\big(e^{i\\cdot ${ph}^\\circ} z^${k}\\big)$, the zero level set is a set of lines through $0$. What angle separates neighbouring lines? Give degrees.`, ask ? `$u = \\operatorname{Re}\\big(e^{i\\cdot ${ph}^\\circ} z^${k}\\big)$ の等高線 $u = 0$ は、臨界点 $0$ の近くで $0$ を通る直線からなります。直線は何本ですか。` : `$u = \\operatorname{Re}\\big(e^{i\\cdot ${ph}^\\circ} z^${k}\\big)$ の臨界点 $0$ で、等高線 $u = 0$ は $0$ を通る直線の集まりです。隣り合う直線の間の角度を度で答えてください。`],
          a: ask ? { type: 'int', v: k } : { type: 'num', v: 180 / k, tol: 0.01, unit: ['°', '°'] },
          hint: ['In polar form $u = r^' + k + '\\cos(' + k + '\\theta + \\varphi)$. Where does the cosine vanish?', '極形式では $u = r^' + k + '\\cos(' + k + '\\theta + \\varphi)$ です。余弦が 0 になるのはどこですか。'],
          sol: [[`$u = r^${k}\\cos(${k}\\theta + \\varphi)$ vanishes when $${k}\\theta + \\varphi = \\pi/2 + m\\pi$.`, `$u = r^${k}\\cos(${k}\\theta + \\varphi)$ は $${k}\\theta + \\varphi = \\pi/2 + m\\pi$ のとき 0 になります。`], [`That gives directions $\\pi/${k}$ apart, $${2 * k}$ rays forming ${k} lines through $0$, separated by $${180 / k}^\\circ$.`, `これは $\\pi/${k}$ ずつ離れた方向、つまり $0$ を通る ${k} 本の直線をなす $${2 * k}$ 本の半直線で、間の角度は $${180 / k}^\\circ$ です。`], [`Away from $0$ level curves cross at $90^\\circ$; at the critical point the angle is divided by ${k} instead, the same failure of conformality as in the first experiment.`, `$0$ 以外では等高線は $90^\\circ$ で交わりますが、臨界点では角度が ${k} で割られます。最初の実験と同じ、等角性の崩れです。`]],
          set: { fn: k - 2, phase: ph, px: 0, py: 0 },
        };
      }
      if (r.chance(0.35)) {
        return {
          q: ['Can a non-constant harmonic function on a disc have a strict local maximum at an interior point?', '円板上の定数でない調和関数は、内部の点で狭義の極大をもちえますか。'],
          a: { type: 'choice', v: 0, opts: [['No: by the mean-value property the value at the centre of any small circle is the average round it, so it cannot exceed them all', 'いいえ。平均値の性質により、小さな円の中心での値はまわりの平均なので、すべてを上回ることはできない'], ['Yes, wherever $\\nabla u = 0$', 'はい。$\\nabla u = 0$ となる点ならどこでも'], ['Yes, if $u_{xx} < 0$ there', 'はい。そこで $u_{xx} < 0$ ならば'], ['Only if the disc is the whole plane', '円板が平面全体のときだけ']] },
          hint: ['Think about the average of $u$ over a small circle round the point.', 'その点のまわりの小さな円の上での $u$ の平均を考えてください。'],
          sol: [['A strict local maximum would make $u$ smaller than its centre value everywhere on a small circle, so its average would be smaller too.', '狭義の極大なら、小さな円の上の至るところで $u$ は中心の値より小さく、平均も小さくなります。'], ['But the mean-value property says the average equals the centre value. So the maximum of $u$ on a closed disc is attained on the boundary (the maximum principle). Where $\\nabla u = 0$ the point is a saddle, and $u_{xx} < 0$ forces $u_{yy} > 0$.', 'しかし平均値の性質によれば平均は中心の値に等しいので、閉円板での $u$ の最大値は境界でとられます（最大値原理）。$\\nabla u = 0$ の点は鞍点で、$u_{xx} < 0$ なら $u_{yy} > 0$ です。']],
        };
      }
      const a = r.pick([1, 2, 3, 0.5]), b = r.pick([1, 2, 3, 4, -2, -1, 6]);
      // max over theta of a cos 2θ + b cos θ = a(2t^2 - 1) + b t, t in [-1, 1]
      const g = (t) => a * (2 * t * t - 1) + b * t;
      const M = Math.max(g(1), g(-1));
      return {
        q: [`Find the maximum of $u = ${terms([[a, '(x^2 - y^2)'], [b, 'x']])}$ on the closed unit disc $x^2 + y^2 \\le 1$.`, `閉じた単位円板 $x^2 + y^2 \\le 1$ における $u = ${terms([[a, '(x^2 - y^2)'], [b, 'x']])}$ の最大値を求めてください。`],
        a: { type: 'num', v: M, tol: 1e-4 },
        hint: ['$u$ is harmonic, so the maximum is on the circle. Write $x = \\cos\\theta$, $y = \\sin\\theta$ and use $t = \\cos\\theta$.', '$u$ は調和なので、最大値は円の上にあります。$x = \\cos\\theta$、$y = \\sin\\theta$ とし、$t = \\cos\\theta$ を使ってください。'],
        sol: [['$\\Delta u = 0$, so by the maximum principle the maximum is attained on $|z| = 1$.', '$\\Delta u = 0$ なので、最大値原理により最大値は $|z| = 1$ の上でとられます。'], [`On the circle $u = ${n(a)}\\cos 2\\theta ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}\\cos\\theta = ${n(2 * a)}t^2 ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}t - ${n(a)}$ with $t \\in [-1, 1]$, an upward parabola in $t$.`, `円の上では $u = ${n(a)}\\cos 2\\theta ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}\\cos\\theta = ${n(2 * a)}t^2 ${b < 0 ? '-' : '+'} ${n(Math.abs(b))}t - ${n(a)}$（$t \\in [-1, 1]$）で、$t$ について上に開く放物線です。`], [`Its maximum is at an end: $u(t{=}1) = ${n(g(1))}$, $u(t{=}-1) = ${n(g(-1))}$, so the maximum is $${n(M)}$, at $z = ${g(1) >= g(-1) ? 1 : -1}$.`, `最大は端でとられ、$u(t{=}1) = ${n(g(1))}$、$u(t{=}-1) = ${n(g(-1))}$ なので最大値は $${n(M)}$（$z = ${g(1) >= g(-1) ? 1 : -1}$）です。`]],
      };
    },
  ];
})();
