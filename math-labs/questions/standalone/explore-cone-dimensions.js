'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI;
  const R0 = 3; // the radius the page's figure keeps fixed

  /* ---------- slant height, height and radius ---------- */
  Q['explore-cone-dimensions-slant'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const h = r.step(1, 8, 0.5);
        const l = Math.hypot(R0, h);
        return {
          q: [`The cone in the figure has radius $3$. Its perpendicular height is $h = ${n(h)}$. What is the slant height $\\ell$?`, `図の円錐は半径が $3$ です。垂直な高さは $h = ${n(h)}$ です。母線の長さ $\\ell$ はいくつですか。`],
          a: { type: 'num', v: l, tol: 0.0006 },
          hint: ['The radius, the height and the slant height form a right triangle.', '半径、高さ、母線は直角三角形をつくります。'],
          sol: [[`$\\ell^2 = r^2 + h^2 = 9 + ${n(h * h)} = ${n(9 + h * h)}$.`, `$\\ell^2 = r^2 + h^2 = 9 + ${n(h * h)} = ${n(9 + h * h)}$ です。`],
                [`$\\ell = ${n(l, 4)}$. The slant height is the hypotenuse, so it is always longer than $h$.`, `$\\ell = ${n(l, 4)}$ です。母線は斜辺なので、必ず $h$ より長くなります。`]],
          set: { h },
        };
      }
      if (form === 1) {
        const tri = r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [2, 5, 0], [1, 7, 0]]);
        const [rr, h] = tri;
        const l = Math.hypot(rr, h);
        return {
          q: [`A cone has base radius ${rr} and height ${h}. Find the slant height.`, `底面の半径が ${rr}、高さが ${h} の円錐の母線の長さを求めてください。`],
          a: { type: 'num', v: l, tol: 0.0006 },
          hint: ['$\\ell = \\sqrt{r^2 + h^2}$.', '$\\ell = \\sqrt{r^2 + h^2}$ です。'],
          sol: [[`$\\ell = \\sqrt{${rr * rr} + ${h * h}} = \\sqrt{${rr * rr + h * h}}$.`, `$\\ell = \\sqrt{${rr * rr} + ${h * h}} = \\sqrt{${rr * rr + h * h}}$ です。`],
                [`$\\ell = ${n(l, 4)}$, the length of the line from the apex to any point on the rim of the base.`, `$\\ell = ${n(l, 4)}$ で、頂点から底面のふちの任意の点までの線の長さです。`]],
          set: rr === R0 && h <= 8 ? { h } : undefined,
        };
      }
      if (form === 2) {
        const h = r.int(1, 7);
        const dh = r.pick([1, 2]);
        const d = Math.hypot(R0, h + dh) - Math.hypot(R0, h);
        return {
          q: [`With radius $3$, the height grows from $${h}$ to $${h + dh}$. By how much does the slant height grow?`, `半径 $3$ のまま、高さが $${h}$ から $${h + dh}$ に増えます。母線はどれだけ増えますか。`],
          a: { type: 'num', v: d, tol: 0.0006 },
          hint: ['Compute the slant height before and after, then subtract.', '前後の母線を計算して差をとります。'],
          sol: [[`Before: $\\sqrt{9 + ${h * h}} = ${n(Math.hypot(R0, h), 4)}$. After: $\\sqrt{9 + ${(h + dh) ** 2}} = ${n(Math.hypot(R0, h + dh), 4)}$.`, `前：$\\sqrt{9 + ${h * h}} = ${n(Math.hypot(R0, h), 4)}$。後：$\\sqrt{9 + ${(h + dh) ** 2}} = ${n(Math.hypot(R0, h + dh), 4)}$ です。`],
                [`The growth is $${n(d, 4)}$, less than the height growth ${dh}: $\\ell$ grows more slowly than $h$ because part of it is the fixed radius.`, `増加は $${n(d, 4)}$ で、高さの増加 ${dh} より小さくなります。$\\ell$ の一部は固定された半径なので、$h$ よりゆっくり増えます。`]],
          set: { h: h + dh <= 8 ? h : 7 },
        };
      }
      const rr = r.int(2, 9);
      const l = r.int(rr + 1, rr + 6);
      const h = Math.sqrt(l * l - rr * rr);
      return {
        q: [`A cone has base radius ${rr} and slant height ${l}. What is its perpendicular height?`, `底面の半径が ${rr}、母線の長さが ${l} の円錐の垂直な高さはいくつですか。`],
        a: { type: 'num', v: h, tol: 0.0006 },
        hint: ['Rearrange $\\ell^2 = r^2 + h^2$.', '$\\ell^2 = r^2 + h^2$ を変形します。'],
        sol: [[`$h^2 = \\ell^2 - r^2 = ${l * l} - ${rr * rr} = ${l * l - rr * rr}$.`, `$h^2 = \\ell^2 - r^2 = ${l * l} - ${rr * rr} = ${l * l - rr * rr}$ です。`],
              [`$h = ${n(h, 4)}$, shorter than the slant height ${l}.`, `$h = ${n(h, 4)}$ で、母線 ${l} より短くなります。`]],
        set: rr === R0 && h <= 8 ? { h: Math.round(h * 10) / 10 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([1.5, 2, 2.5, 3, 4]);
        const h = R0 * Math.sqrt(k * k - 1);
        return {
          q: [`The cone has radius $3$. For what height is the slant height exactly ${n(k)} times the radius?`, `円錐の半径は $3$ です。母線が半径のちょうど ${n(k)} 倍になる高さはいくつですか。`],
          a: { type: 'num', v: h, tol: 0.0051 },
          hint: ['The slant height is then $${n(k * 3)}$; use Pythagoras for $h$.'.replace('${n(k * 3)}', n(k * 3)), `そのとき母線は $${n(k * 3)}$ です。ピタゴラスの定理で $h$ を求めます。`],
          sol: [[`$\\ell = ${n(k)} \\cdot 3 = ${n(3 * k)}$, so $h^2 = ${n(9 * k * k)} - 9 = ${n(9 * k * k - 9)}$.`, `$\\ell = ${n(k)} \\cdot 3 = ${n(3 * k)}$ なので $h^2 = ${n(9 * k * k)} - 9 = ${n(9 * k * k - 9)}$ です。`],
                [`$h = ${n(h, 4)}$. For $k = 2$ the axial section is an equilateral triangle and $h = 3\\sqrt3 \\approx 5.196$.`, `$h = ${n(h, 4)}$ です。$k = 2$ のとき軸を通る断面は正三角形で、$h = 3\\sqrt3 \\approx 5.196$ です。`]],
          set: h <= 8 ? { h: Math.round(h * 10) / 10 } : undefined,
        };
      }
      if (form === 1) {
        const h = r.int(2, 8);
        const l = Math.hypot(R0, h);
        return {
          q: [`The slant height is $\\ell = ${n(l, 4)}$ and the radius is $3$. Find the angle between the slant side and the axis, in degrees.`, `母線は $\\ell = ${n(l, 4)}$、半径は $3$ です。母線と軸のなす角を度で求めてください。`],
          a: { type: 'num', v: (Math.asin(R0 / l) * 180) / PI, tol: 0.06, unit: ['°', '°'] },
          hint: ['In the right triangle the side opposite the angle at the apex is the radius.', '直角三角形で、頂点の角の対辺は半径です。'],
          sol: [[`$\\sin\\alpha = r/\\ell = 3/${n(l, 4)} = ${n(R0 / l, 4)}$.`, `$\\sin\\alpha = r/\\ell = 3/${n(l, 4)} = ${n(R0 / l, 4)}$ です。`],
                [`$\\alpha = ${n((Math.asin(R0 / l) * 180) / PI, 3)}^\\circ$ (equivalently $\\tan\\alpha = 3/${h}$). Taller cones have a smaller half-angle at the apex.`, `$\\alpha = ${n((Math.asin(R0 / l) * 180) / PI, 3)}^\\circ$ です（$\\tan\\alpha = 3/${h}$ とも表せます）。高い円錐ほど頂点の半角は小さくなります。`]],
          set: { h },
        };
      }
      const rr = r.int(2, 6), h = r.int(2, 9);
      const l = Math.hypot(rr, h);
      return {
        q: [`A cone has $\\ell + h = ${n(l + h, 4)}$ and $\\ell - h = ${n(l - h, 4)}$. Find the radius.`, `ある円錐で $\\ell + h = ${n(l + h, 4)}$、$\\ell - h = ${n(l - h, 4)}$ です。半径を求めてください。`],
        a: { type: 'num', v: rr, tol: 0.003 },
        hint: ['Multiply the two: $(\\ell + h)(\\ell - h) = \\ell^2 - h^2$.', '2 つを掛けます：$(\\ell + h)(\\ell - h) = \\ell^2 - h^2$。'],
        sol: [[`$(\\ell + h)(\\ell - h) = \\ell^2 - h^2 = r^2$.`, `$(\\ell + h)(\\ell - h) = \\ell^2 - h^2 = r^2$ です。`],
              [`$r^2 = ${n(l + h, 4)} \\cdot ${n(l - h, 4)} = ${n(rr * rr, 3)}$, so $r = ${rr}$. The difference $\\ell - h$ is small for a tall cone.`, `$r^2 = ${n(l + h, 4)} \\cdot ${n(l - h, 4)} = ${n(rr * rr, 3)}$ なので $r = ${rr}$ です。高い円錐では $\\ell - h$ は小さくなります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: [`With radius $3$ fixed, write the slant height $\\ell$ as a function of the height $h$, and then give $\\dfrac{d\\ell}{dh}$ as a formula in $h$.`, `半径 $3$ を固定したまま、母線 $\\ell$ を高さ $h$ の関数として表し、$\\dfrac{d\\ell}{dh}$ を $h$ の式で答えてください。`],
          a: { type: 'expr', v: 'h/sqrt(9+h^2)', vars: ['h'], lhs: ['$\\dfrac{d\\ell}{dh}=$', '$\\dfrac{d\\ell}{dh}=$'] },
          hint: ['Differentiate $\\ell = (9 + h^2)^{1/2}$ with the chain rule.', '連鎖律で $\\ell = (9 + h^2)^{1/2}$ を微分します。'],
          sol: [[`$\\ell = \\sqrt{9 + h^2}$, so $\\dfrac{d\\ell}{dh} = \\dfrac{h}{\\sqrt{9 + h^2}}$.`, `$\\ell = \\sqrt{9 + h^2}$ なので $\\dfrac{d\\ell}{dh} = \\dfrac{h}{\\sqrt{9 + h^2}}$ です。`],
                [`This is $h/\\ell = \\cos\\alpha$ of the apex half-angle, always below $1$: the slant height rises more slowly than the height and tends to rise at the same rate for tall cones.`, `これは頂点の半角 $\\alpha$ を用いた $h/\\ell = \\cos\\alpha$ で、常に $1$ 未満です。母線は高さより遅く伸び、高い円錐ではほぼ同じ速さで伸びます。`]],
          set: undefined,
        };
      }
      if (form === 1) {
        const rr = r.pick([3, 4, 5, 6]);
        return {
          q: [`For a tall cone of radius ${rr}, $\\ell - h \\approx \\dfrac{c}{h}$. Find $c$.`, `半径 ${rr} の背の高い円錐では $\\ell - h \\approx \\dfrac{c}{h}$ となります。$c$ を求めてください。`],
          a: { type: 'num', v: (rr * rr) / 2, tol: 1e-6 },
          hint: ['$\\ell - h = \\dfrac{r^2}{\\ell + h}$ and $\\ell + h \\approx 2h$.', '$\\ell - h = \\dfrac{r^2}{\\ell + h}$ で、$\\ell + h \\approx 2h$ です。'],
          sol: [[`$\\ell - h = \\dfrac{\\ell^2 - h^2}{\\ell + h} = \\dfrac{${rr * rr}}{\\ell + h}$.`, `$\\ell - h = \\dfrac{\\ell^2 - h^2}{\\ell + h} = \\dfrac{${rr * rr}}{\\ell + h}$ です。`],
                [`For large $h$, $\\ell + h \\approx 2h$, so $c = ${rr * rr}/2 = ${n((rr * rr) / 2)}$. The slant side hugs the axis ever more closely in length.`, `$h$ が大きいと $\\ell + h \\approx 2h$ なので $c = ${rr * rr}/2 = ${n((rr * rr) / 2)}$ です。母線の長さは軸の長さにどんどん近づきます。`]],
        };
      }
      const rr = r.int(2, 7), h = r.int(2, 9);
      const l = Math.hypot(rr, h);
      return {
        q: [`Radius ${rr}, height ${h}. If the radius grows by $1$ with the height fixed, by how much does the slant height grow?`, `半径 ${rr}、高さ ${h} の円錐があります。高さを変えずに半径を $1$ 増やすと、母線はどれだけ増えますか。`],
        a: { type: 'num', v: Math.hypot(rr + 1, h) - l, tol: 0.0006 },
        hint: ['Recompute $\\ell$ with the new radius and subtract.', '新しい半径で $\\ell$ を計算し直して差をとります。'],
        sol: [[`Old: $\\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$. New: $\\sqrt{${(rr + 1) ** 2} + ${h * h}} = ${n(Math.hypot(rr + 1, h), 4)}$.`, `前：$\\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$。後：$\\sqrt{${(rr + 1) ** 2} + ${h * h}} = ${n(Math.hypot(rr + 1, h), 4)}$ です。`],
              [`The increase is $${n(Math.hypot(rr + 1, h) - l, 4)}$. Here $\\ell$ is more sensitive to the radius than to the height whenever $r > h$.`, `増加は $${n(Math.hypot(rr + 1, h) - l, 4)}$ です。$r > h$ のときは、$\\ell$ は高さよりも半径の変化に敏感です。`]],
      };
    },
  ];

  /* ---------- volume and curved area ---------- */
  Q['explore-cone-dimensions-volume'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.step(1, 8, 0.5);
        return {
          q: [`The cone has radius $3$ and height $h = ${n(h)}$. What is its volume?`, `半径 $3$、高さ $h = ${n(h)}$ の円錐の体積はいくつですか。`],
          a: { type: 'num', v: 3 * PI * h, tol: 0.0051, show: `${n(3 * h)}\\pi` },
          hint: ['$V = \\tfrac13\\pi r^2 h$ with $r = 3$.', '$r = 3$ として $V = \\tfrac13\\pi r^2 h$ を使います。'],
          sol: [[`$V = \\tfrac13\\pi \\cdot 9 \\cdot ${n(h)} = ${n(3 * h)}\\pi$.`, `$V = \\tfrac13\\pi \\cdot 9 \\cdot ${n(h)} = ${n(3 * h)}\\pi$ です。`],
                [`$V = ${n(3 * PI * h, 3)}$. With the radius fixed, the volume is exactly proportional to $h$: it is $3\\pi$ per unit of height.`, `$V = ${n(3 * PI * h, 3)}$ です。半径が固定なら体積は $h$ にちょうど比例し、高さ 1 あたり $3\\pi$ です。`]],
          set: { h },
        };
      }
      if (form === 1) {
        const h = r.step(1, 8, 0.5);
        const l = Math.hypot(R0, h);
        return {
          q: [`The cone has radius $3$ and height $h = ${n(h)}$. What is its curved surface area?`, `半径 $3$、高さ $h = ${n(h)}$ の円錐の側面積はいくつですか。`],
          a: { type: 'num', v: 3 * PI * l, tol: 0.0051 },
          hint: ['$L = \\pi r\\ell$ needs the slant height first.', '$L = \\pi r\\ell$ には、まず母線が必要です。'],
          sol: [[`$\\ell = \\sqrt{9 + ${n(h * h)}} = ${n(l, 4)}$.`, `$\\ell = \\sqrt{9 + ${n(h * h)}} = ${n(l, 4)}$ です。`],
                [`$L = \\pi \\cdot 3 \\cdot ${n(l, 4)} = ${n(3 * PI * l, 3)}$. Unlike the volume, this is not proportional to $h$.`, `$L = \\pi \\cdot 3 \\cdot ${n(l, 4)} = ${n(3 * PI * l, 3)}$ です。体積と違って $h$ には比例しません。`]],
          set: { h },
        };
      }
      const rr = r.int(2, 6), h = r.int(2, 9);
      return {
        q: [`A cone has radius ${rr} and height ${h}. What fraction of the volume of the enclosing cylinder (same base and height) does it fill? Enter a decimal or fraction.`, `半径 ${rr}、高さ ${h} の円錐は、同じ底面と高さをもつ円柱の体積の何分の何を占めますか（小数または分数で入力）。`],
        a: { type: 'num', v: 1 / 3, tol: 1e-6, show: '\\tfrac13' },
        hint: ['Compare $\\tfrac13\\pi r^2 h$ with $\\pi r^2 h$.', '$\\tfrac13\\pi r^2 h$ と $\\pi r^2 h$ を比べます。'],
        sol: [[`The cylinder holds $\\pi r^2 h = ${n(PI * rr * rr * h, 3)}$; the cone $${n((PI * rr * rr * h) / 3, 3)}$.`, `円柱は $\\pi r^2 h = ${n(PI * rr * rr * h, 3)}$、円錐は $${n((PI * rr * rr * h) / 3, 3)}$ です。`],
              [`The ratio is $1/3$ whatever $r$ and $h$ are.`, `比は $r$ や $h$ によらず $1/3$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const h = r.step(1, 8, 0.5);
        const V = 3 * PI * h;
        return {
          q: [`The cone has radius $3$ and volume $${n(V, 4)}$. What is its height?`, `半径 $3$ で体積が $${n(V, 4)}$ の円錐の高さはいくつですか。`],
          a: { type: 'num', v: h, tol: 0.003 },
          hint: ['Solve $V = 3\\pi h$ for $h$.', '$V = 3\\pi h$ を $h$ について解きます。'],
          sol: [[`$V = \\tfrac13\\pi \\cdot 9 \\cdot h = 3\\pi h$, so $h = V/(3\\pi)$.`, `$V = \\tfrac13\\pi \\cdot 9 \\cdot h = 3\\pi h$ なので $h = V/(3\\pi)$ です。`],
                [`$h = ${n(V, 4)}/${n(3 * PI, 4)} = ${n(h, 3)}$. A linear relation inverts easily, which the curved area does not.`, `$h = ${n(V, 4)}/${n(3 * PI, 4)} = ${n(h, 3)}$ です。1 次の関係は簡単に逆算できますが、側面積はそうはいきません。`]],
          set: { h },
        };
      }
      if (form === 1) {
        const h = r.step(1, 8, 1);
        const l = Math.hypot(R0, h);
        const L = 3 * PI * l;
        return {
          q: [`The cone has radius $3$ and curved surface area $${n(L, 4)}$. What is its height?`, `半径 $3$ で側面積が $${n(L, 4)}$ の円錐の高さはいくつですか。`],
          a: { type: 'num', v: h, tol: 0.003 },
          hint: ['Find $\\ell$ from $L = 3\\pi\\ell$, then $h = \\sqrt{\\ell^2 - 9}$.', '$L = 3\\pi\\ell$ から $\\ell$ を求め、$h = \\sqrt{\\ell^2 - 9}$ とします。'],
          sol: [[`$\\ell = L/(3\\pi) = ${n(L, 4)}/${n(3 * PI, 4)} = ${n(l, 4)}$.`, `$\\ell = L/(3\\pi) = ${n(L, 4)}/${n(3 * PI, 4)} = ${n(l, 4)}$ です。`],
                [`$h = \\sqrt{\\ell^2 - 9} = \\sqrt{${n(l * l, 4)} - 9} = ${n(h, 3)}$.`, `$h = \\sqrt{\\ell^2 - 9} = \\sqrt{${n(l * l, 4)} - 9} = ${n(h, 3)}$ です。`]],
          set: { h },
        };
      }
      const h = r.int(2, 7);
      const pct = r.pick([1, 2, 5, 10]);
      const newV = 3 * PI * h * (1 + pct / 100);
      const l1 = Math.hypot(R0, h), l2 = Math.hypot(R0, h * (1 + pct / 100));
      return {
        q: [`At height $h = ${h}$ (radius $3$), the height is increased by ${pct}%. By what percentage does the curved surface area increase? (Exact change, not an approximation.)`, `半径 $3$、高さ $h = ${h}$ のとき、高さを ${pct}% 増やします。側面積は何パーセント増えますか（近似ではなく正確な変化で）。`],
        a: { type: 'num', v: (l2 / l1 - 1) * 100, tol: 0.006, unit: ['%', '%'] },
        hint: ['The area is proportional to $\\ell = \\sqrt{9 + h^2}$, not to $h$.', '面積は $h$ ではなく $\\ell = \\sqrt{9 + h^2}$ に比例します。'],
        sol: [[`Old $\\ell = \\sqrt{9 + ${h * h}} = ${n(l1, 4)}$. New $h = ${n(h * (1 + pct / 100), 4)}$, so $\\ell = ${n(l2, 4)}$.`, `もとの $\\ell = \\sqrt{9 + ${h * h}} = ${n(l1, 4)}$。新しい $h = ${n(h * (1 + pct / 100), 4)}$ なので $\\ell = ${n(l2, 4)}$ です。`],
              [`The area grows by $${n(l2, 4)}/${n(l1, 4)} - 1 = ${n((l2 / l1 - 1) * 100, 3)}\\%$, less than the ${pct}% for the volume. The fraction $h^2/(9 + h^2) = ${n((h * h) / (9 + h * h), 3)}$ of the height change reaches the area.`, `面積の増加は $${n(l2, 4)}/${n(l1, 4)} - 1 = ${n((l2 / l1 - 1) * 100, 3)}\\%$ で、体積の ${pct}% より小さくなります。高さの変化のうち $h^2/(9 + h^2) = ${n((h * h) / (9 + h * h), 3)}$ の割合だけが面積に伝わります。`]],
        set: { h },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        return {
          q: [`With radius $3$, write the ratio (curved surface area) / (volume) as a function of $h$.`, `半径 $3$ の円錐について、（側面積）/（体積）を $h$ の関数として表してください。`],
          a: { type: 'expr', v: 'sqrt(9+h^2)/h', vars: ['h'], lhs: ['$\\dfrac{L}{V}=$', '$\\dfrac{L}{V}=$'] },
          hint: ['$L = 3\\pi\\sqrt{9 + h^2}$ and $V = 3\\pi h$.', '$L = 3\\pi\\sqrt{9 + h^2}$、$V = 3\\pi h$ です。'],
          sol: [[`$L = \\pi r\\ell = 3\\pi\\sqrt{9 + h^2}$ and $V = 3\\pi h$.`, `$L = \\pi r\\ell = 3\\pi\\sqrt{9 + h^2}$、$V = 3\\pi h$ です。`],
                [`$L/V = \\sqrt{9 + h^2}/h = \\ell/h$, which decreases towards $1$ for tall cones.`, `$L/V = \\sqrt{9 + h^2}/h = \\ell/h$ で、背の高い円錐では $1$ に近づきます。`]],
        };
      }
      if (form === 1) {
        return {
          q: [`With radius $3$, give $\\dfrac{dL}{dh}$ for the curved surface area $L(h)$.`, `半径 $3$ の円錐の側面積 $L(h)$ について、$\\dfrac{dL}{dh}$ を求めてください。`],
          a: { type: 'expr', v: '3*pi*h/sqrt(9+h^2)', vars: ['h'], lhs: ['$\\dfrac{dL}{dh}=$', '$\\dfrac{dL}{dh}=$'] },
          hint: ['$L = 3\\pi(9 + h^2)^{1/2}$.', '$L = 3\\pi(9 + h^2)^{1/2}$ です。'],
          sol: [[`$\\dfrac{dL}{dh} = 3\\pi \\cdot \\dfrac{h}{\\sqrt{9 + h^2}}$.`, `$\\dfrac{dL}{dh} = 3\\pi \\cdot \\dfrac{h}{\\sqrt{9 + h^2}}$ です。`],
                [`It stays below $3\\pi$, the constant rate $dV/dh$ of the volume, and tends to $3\\pi$ as $h$ grows.`, `これは常に $3\\pi$ 未満で、体積の増加率 $dV/dh = 3\\pi$ より小さく、$h$ が大きくなるとそれに近づきます。`]],
        };
      }
      if (form === 2) {
        return {
          q: [`A cone has height $h$, slant height $\\ell$ and radius $r$. Write the volume $V$ in terms of $\\ell$ and $h$ only (eliminate $r$).`, `円錐の高さを $h$、母線を $\\ell$、半径を $r$ とします。$r$ を消去して、体積 $V$ を $\\ell$ と $h$ だけで表してください。`],
          a: { type: 'expr', v: 'pi*(l^2-h^2)*h/3', vars: ['l', 'h'], dom: { l: [1.5, 3], h: [0.5, 1.4] }, lhs: ['$V=$', '$V=$'] },
          hint: ['Use $r^2 = \\ell^2 - h^2$.', '$r^2 = \\ell^2 - h^2$ を使います。'],
          sol: [[`$V = \\tfrac13\\pi r^2 h$ and $r^2 = \\ell^2 - h^2$.`, `$V = \\tfrac13\\pi r^2 h$、$r^2 = \\ell^2 - h^2$ です。`],
                [`So $V = \\tfrac13\\pi(\\ell^2 - h^2)h$. For a fixed slant height this is largest when $h = \\ell/\\sqrt3$ (set $dV/dh = 0$): the cone of greatest volume on a given slant side.`, `したがって $V = \\tfrac13\\pi(\\ell^2 - h^2)h$ です。母線が一定なら $dV/dh = 0$ より $h = \\ell/\\sqrt3$ のとき最大になります。与えられた母線をもつ円錐のうち体積が最大のものです。`]],
        };
      }
      const l = r.int(3, 12);
      const h = l / Math.sqrt(3);
      const V = (PI * (l * l - h * h) * h) / 3;
      return {
        q: [`Among all cones with slant height ${l}, what is the largest possible volume?`, `母線の長さが ${l} のすべての円錐のうち、体積の最大値はいくつですか。`],
        a: { type: 'num', v: V, tol: 0.006 },
        hint: ['$V(h) = \\tfrac13\\pi(\\ell^2 - h^2)h$; set the derivative to zero.', '$V(h) = \\tfrac13\\pi(\\ell^2 - h^2)h$ の導関数を $0$ とおきます。'],
        sol: [[`$V'(h) = \\tfrac13\\pi(\\ell^2 - 3h^2) = 0$ gives $h = \\ell/\\sqrt3 = ${n(h, 4)}$.`, `$V'(h) = \\tfrac13\\pi(\\ell^2 - 3h^2) = 0$ より $h = \\ell/\\sqrt3 = ${n(h, 4)}$ です。`],
              [`Then $r^2 = \\ell^2 - h^2 = ${n(l * l - h * h, 4)}$ and $V = \\tfrac13\\pi \\cdot ${n(l * l - h * h, 4)} \\cdot ${n(h, 4)} = ${n(V, 3)}$. A very flat or very tall cone with the same slant holds less.`, `このとき $r^2 = \\ell^2 - h^2 = ${n(l * l - h * h, 4)}$ で $V = \\tfrac13\\pi \\cdot ${n(l * l - h * h, 4)} \\cdot ${n(h, 4)} = ${n(V, 3)}$ です。同じ母線でも、とても平たい円錐やとても細長い円錐は容積が小さくなります。`]],
      };
    },
  ];

  /* ---------- unrolling the curved surface ---------- */
  Q['explore-cone-dimensions-unroll'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const tri = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [3, 6, 0], [2, 5, 0]]);
        const [rr, h] = [tri[0], tri[1]];
        const l = Math.hypot(rr, h);
        const th = (360 * rr) / l;
        return {
          q: [`Cutting the curved surface of a cone with radius ${rr} and height ${h} along a slant line and flattening it gives a circular sector. What is the sector's central angle, in degrees?`, `半径 ${rr}、高さ ${h} の円錐の側面を母線に沿って切り開いて平らにすると、扇形になります。この扇形の中心角は何度ですか。`],
          a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
          hint: ['The sector radius is $\\ell$ and its arc is the base circumference $2\\pi r$.', '扇形の半径は $\\ell$、弧は底面の円周 $2\\pi r$ です。'],
          sol: [[`$\\ell = \\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$, the radius of the sector.`, `$\\ell = \\sqrt{${rr * rr} + ${h * h}} = ${n(l, 4)}$ が扇形の半径です。`],
                [`Arc $= 2\\pi r = \\ell\\theta$, so $\\theta = 2\\pi r/\\ell$ rad $= 360^\\circ \\cdot ${rr}/${n(l, 4)} = ${n(th, 3)}^\\circ$.`, `弧 $= 2\\pi r = \\ell\\theta$ なので $\\theta = 2\\pi r/\\ell$ ラジアン $= 360^\\circ \\cdot ${rr}/${n(l, 4)} = ${n(th, 3)}^\\circ$ です。`],
                [`The angle is less than $360^\\circ$ because $\\ell > r$: a tall cone gives a thin sector.`, `$\\ell > r$ なので $360^\\circ$ より小さくなります。背の高い円錐は細い扇形になります。`]],
          set: rr === R0 && h <= 8 ? { h } : undefined,
        };
      }
      if (form === 1) {
        const l = r.int(4, 12), th = r.pick([90, 120, 144, 180, 216, 240, 270]);
        const rr = (l * th) / 360;
        return {
          q: [`A sector of radius ${l} and angle ${th}° is rolled into a cone (the straight edges joined). What is the cone's base radius?`, `半径 ${l}、中心角 ${th}° の扇形の直線の辺をつないで円錐にします。底面の半径はいくつですか。`],
          a: { type: 'num', v: rr, tol: 0.003 },
          hint: ['The arc of the sector becomes the base circle.', '扇形の弧が底面の円になります。'],
          sol: [[`Arc length $= ${l} \\cdot ${th}\\pi/180 = ${n((l * th) / 180, 4)}\\pi$.`, `弧の長さは $${l} \\cdot ${th}\\pi/180 = ${n((l * th) / 180, 4)}\\pi$ です。`],
                [`This equals $2\\pi r$, so $r = ${n(rr, 4)}$. The sector radius ${l} becomes the slant height.`, `これが $2\\pi r$ に等しいので $r = ${n(rr, 4)}$ です。扇形の半径 ${l} は母線になります。`]],
        };
      }
      const rr = r.int(2, 6), h = r.int(2, 9);
      const l = Math.hypot(rr, h);
      return {
        q: [`The unrolled curved surface of a cone with radius ${rr} and height ${h} is a sector. What is its area?`, `半径 ${rr}、高さ ${h} の円錐の側面を切り開いた扇形の面積はいくつですか。`],
        a: { type: 'num', v: PI * rr * l, tol: 0.0051 },
        hint: ['The area of the sector is the curved surface area of the cone.', '扇形の面積は円錐の側面積に等しくなります。'],
        sol: [[`$\\ell = ${n(l, 4)}$, and the sector has radius $\\ell$ and arc $2\\pi r$.`, `$\\ell = ${n(l, 4)}$ で、扇形の半径は $\\ell$、弧は $2\\pi r$ です。`],
              [`Sector area $= \\tfrac12 \\ell \\cdot 2\\pi r = \\pi r\\ell = ${n(PI * rr * l, 3)}$, the familiar formula.`, `扇形の面積は $\\tfrac12 \\ell \\cdot 2\\pi r = \\pi r\\ell = ${n(PI * rr * l, 3)}$ で、おなじみの公式になります。`]],
        set: rr === R0 && h <= 8 ? { h } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const l = r.int(5, 13), th = r.pick([120, 144, 180, 216, 240]);
        const rr = (l * th) / 360;
        const h = Math.sqrt(l * l - rr * rr);
        return {
          q: [`A sector of radius ${l} and angle ${th}° is rolled into a cone. How tall is the cone?`, `半径 ${l}、中心角 ${th}° の扇形を丸めて円錐をつくります。円錐の高さはいくつですか。`],
          a: { type: 'num', v: h, tol: 0.006 },
          hint: ['Find the base radius from the arc, then use Pythagoras with $\\ell = ${l}$.'.replace('${l}', l), `弧から底面の半径を求め、$\\ell = ${l}$ でピタゴラスの定理を使います。`],
          sol: [[`The arc gives $r = ${l} \\cdot ${th}/360 = ${n(rr, 4)}$.`, `弧から $r = ${l} \\cdot ${th}/360 = ${n(rr, 4)}$ です。`],
                [`$h = \\sqrt{\\ell^2 - r^2} = \\sqrt{${l * l} - ${n(rr * rr, 4)}} = ${n(h, 4)}$.`, `$h = \\sqrt{\\ell^2 - r^2} = \\sqrt{${l * l} - ${n(rr * rr, 4)}} = ${n(h, 4)}$ です。`],
                [`A larger central angle gives a wider, lower cone; at $360^\\circ$ the cone would be a flat disc.`, `中心角が大きいほど、幅が広く低い円錐になります。$360^\\circ$ では平らな円盤になってしまいます。`]],
        };
      }
      if (form === 1) {
        const k = r.pick([1, 2, 3, 0.5]);
        const th = 360 / Math.sqrt(1 + k * k);
        return {
          q: [`A cone's height is ${n(k)} times its base radius. What central angle (in degrees) does its unrolled curved surface have?`, `円錐の高さが底面の半径の ${n(k)} 倍です。側面を切り開いた扇形の中心角は何度ですか。`],
          a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
          hint: ['Then $\\ell = r\\sqrt{1 + k^2}$, and $\\theta = 360^\\circ r/\\ell$.', 'このとき $\\ell = r\\sqrt{1 + k^2}$ で、$\\theta = 360^\\circ r/\\ell$ です。'],
          sol: [[`$\\ell = r\\sqrt{1 + ${n(k * k)}} = ${n(Math.sqrt(1 + k * k), 4)}\\,r$.`, `$\\ell = r\\sqrt{1 + ${n(k * k)}} = ${n(Math.sqrt(1 + k * k), 4)}\\,r$ です。`],
                [`$\\theta = 360^\\circ / ${n(Math.sqrt(1 + k * k), 4)} = ${n(th, 3)}^\\circ$. The angle depends only on the shape ($h/r$), not on the size.`, `$\\theta = 360^\\circ / ${n(Math.sqrt(1 + k * k), 4)} = ${n(th, 3)}^\\circ$ です。角は大きさではなく形（$h/r$）だけで決まります。`]],
        };
      }
      const rr = r.int(2, 6), h = r.int(2, 9);
      const l = Math.hypot(rr, h);
      const V = (PI * rr * rr * h) / 3, th = (360 * rr) / l;
      return {
        q: [`A sector of radius $\\ell = ${n(l, 4)}$ and angle $${n(th, 4)}^\\circ$ is rolled into a cone. Find the cone's volume.`, `半径 $\\ell = ${n(l, 4)}$、中心角 $${n(th, 4)}^\\circ$ の扇形を丸めて円錐にします。円錐の体積を求めてください。`],
        a: { type: 'num', v: V, tol: 0.006 },
        hint: ['First the base radius from the arc, then the height, then the volume.', 'まず弧から底面の半径、次に高さ、最後に体積を求めます。'],
        sol: [[`$r = \\ell\\theta/360 = ${n(l, 4)} \\cdot ${n(th, 4)}/360 = ${n((l * th) / 360, 4)}$.`, `$r = \\ell\\theta/360 = ${n(l, 4)} \\cdot ${n(th, 4)}/360 = ${n((l * th) / 360, 4)}$ です。`],
              [`$h = \\sqrt{\\ell^2 - r^2} = ${n(h, 4)}$.`, `$h = \\sqrt{\\ell^2 - r^2} = ${n(h, 4)}$ です。`],
              [`$V = \\tfrac13\\pi r^2 h = ${n(V, 3)}$. Two numbers from a flat pattern (radius and angle) fix a solid's volume.`, `$V = \\tfrac13\\pi r^2 h = ${n(V, 3)}$ です。平らな展開図の 2 つの数（半径と角）で立体の体積が決まります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: [`With radius $3$ fixed, write the central angle $\\theta$ (in degrees) of the unrolled curved surface as a function of the height $h$.`, `半径 $3$ を固定したとき、側面を切り開いた扇形の中心角 $\\theta$（度）を高さ $h$ の関数として表してください。`],
          a: { type: 'expr', v: '1080/sqrt(9+h^2)', vars: ['h'], lhs: ['$\\theta(h)=$', '$\\theta(h)=$'] },
          hint: ['$\\theta = 360^\\circ r/\\ell$ with $\\ell = \\sqrt{9 + h^2}$.', '$\\theta = 360^\\circ r/\\ell$、$\\ell = \\sqrt{9 + h^2}$ です。'],
          sol: [[`The arc $2\\pi r = 6\\pi$ is $\\theta/360$ of the circle of radius $\\ell$.`, `弧 $2\\pi r = 6\\pi$ は、半径 $\\ell$ の円周の $\\theta/360$ です。`],
                [`$\\theta = 360 \\cdot 3/\\ell = \\dfrac{1080}{\\sqrt{9 + h^2}}$. It falls from $360^\\circ$ at $h = 0$ (a flat disc) towards $0^\\circ$ for very tall cones.`, `$\\theta = 360 \\cdot 3/\\ell = \\dfrac{1080}{\\sqrt{9 + h^2}}$ です。$h = 0$（平らな円盤）の $360^\\circ$ から、とても背の高い円錐では $0^\\circ$ へ向かって小さくなります。`]],
          set: undefined,
        };
      }
      if (form === 1) {
        const R = r.int(3, 12);
        const rr = R * Math.sqrt(2 / 3), h = R / Math.sqrt(3);
        const V = (PI * rr * rr * h) / 3;
        return {
          q: [`A cone is made from a circular sector cut from a flat disc of radius ${R} (the sector's radius becomes the slant height). What is the largest volume such a cone can have?`, `半径 ${R} の平らな円盤から扇形を切り取り、それを丸めて円錐をつくります（扇形の半径が母線になります）。つくれる円錐の体積の最大値はいくつですか。`],
          a: { type: 'num', v: V, tol: 0.006 },
          hint: ['With slant height fixed at ${R}, maximise $\\tfrac13\\pi(\\ell^2 - h^2)h$.'.replace('${R}', R), `母線を ${R} に固定して $\\tfrac13\\pi(\\ell^2 - h^2)h$ を最大にします。`],
          sol: [[`The slant height is $\\ell = ${R}$. $V = \\tfrac13\\pi(\\ell^2 - h^2)h$ is largest at $h = \\ell/\\sqrt3 = ${n(h, 4)}$.`, `母線は $\\ell = ${R}$ です。$V = \\tfrac13\\pi(\\ell^2 - h^2)h$ は $h = \\ell/\\sqrt3 = ${n(h, 4)}$ で最大になります。`],
                [`Then $r = \\ell\\sqrt{2/3} = ${n(rr, 4)}$ and $V_{\\max} = \\dfrac{2\\pi}{9\\sqrt3}\\ell^3 = ${n(V, 3)}$.`, `このとき $r = \\ell\\sqrt{2/3} = ${n(rr, 4)}$ で、$V_{\\max} = \\dfrac{2\\pi}{9\\sqrt3}\\ell^3 = ${n(V, 3)}$ です。`],
                [`The sector used has angle $360^\\circ\\sqrt{2/3} \\approx 293.9^\\circ$, about $82\\%$ of the disc.`, `使う扇形の中心角は $360^\\circ\\sqrt{2/3} \\approx 293.9^\\circ$ で、円盤の約 $82\\%$ です。`]],
        };
      }
      const rr = r.int(2, 8);
      return {
        q: [`The unrolled curved surface of a cone with radius ${rr} is exactly a semicircle. How tall is the cone?`, `半径 ${rr} の円錐の側面を切り開くと、ちょうど半円になります。この円錐の高さはいくつですか。`],
        a: { type: 'num', v: rr * Math.sqrt(3), tol: 0.006 },
        hint: ['A semicircle has angle $180^\\circ$, so $\\ell = 2r$.', '半円の中心角は $180^\\circ$ なので $\\ell = 2r$ です。'],
        sol: [[`$\\theta = 360^\\circ r/\\ell = 180^\\circ$ gives $\\ell = 2r = ${2 * rr}$.`, `$\\theta = 360^\\circ r/\\ell = 180^\\circ$ より $\\ell = 2r = ${2 * rr}$ です。`],
              [`$h = \\sqrt{\\ell^2 - r^2} = r\\sqrt3 = ${n(rr * Math.sqrt(3), 4)}$. The axial section is an equilateral triangle.`, `$h = \\sqrt{\\ell^2 - r^2} = r\\sqrt3 = ${n(rr * Math.sqrt(3), 4)}$ です。軸を通る断面は正三角形です。`]],
      };
    },
  ];
})();
