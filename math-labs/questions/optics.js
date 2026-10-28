'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (x) => x * 180 / PI;
  const onStep = (x, step, lo, hi) => x >= lo - 1e-9 && x <= hi + 1e-9 && Math.abs(x / step - Math.round(x / step)) < 1e-6;
  const imageOf = (f, d) => f * d / (d - f);

  /* ---------------- 1. thin lens ---------------- */
  const NATURE = [['real, inverted, reduced', '実像、倒立、縮小'], ['real, inverted, same size', '実像、倒立、等倍'], ['real, inverted, enlarged', '実像、倒立、拡大'], ['virtual, upright, enlarged', '虚像、正立、拡大'], ['virtual, upright, reduced', '虚像、正立、縮小']];
  Q.lens = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let f, d; do { f = r.pick([1, 1.5, 2, 2.5, 3, 4, 5]); d = r.pick([2, 3, 4, 5, 6, 7.5, 8, 9, 10]); } while (d <= f + 0.4);
        const di = imageOf(f, d);
        return {
          q: [`A converging lens has focal length $f = ${n(f)}$. An object stands $d_o = ${n(d)}$ in front of it. Where is the image?`, `焦点距離 $f = ${n(f)}$ の凸レンズの前方 $d_o = ${n(d)}$ に物体があります。像はどこにできますか。`],
          a: { type: 'num', v: di },
          hint: ['Use $1/f = 1/d_o + 1/d_i$.', '$1/f = 1/d_o + 1/d_i$ を使います。'],
          sol: [[`$1/d_i = 1/${n(f)} - 1/${n(d)} = ${n(1 / f - 1 / d, 5)}$.`, `$1/d_i = 1/${n(f)} - 1/${n(d)} = ${n(1 / f - 1 / d, 5)}$ です。`], [`$d_i = ${n(di, 4)}$, positive: a real image on the far side of the lens, where a screen would catch it.`, `$d_i = ${n(di, 4)}$ で正です。レンズの反対側にできる実像で、スクリーンに映すことができます。`]],
          set: { f, object: d, kind: 0 },
        };
      }
      if (form === 1) {
        const d = r.pick([10, 15, 20, 25, 30, 40]), di = r.pick([10, 12, 20, 30, 60]), m = -di / d;
        return {
          q: [`A lens forms a real image $${di}$ cm behind it of an object $${d}$ cm in front. What is the magnification $m$, with its sign?`, `レンズの前方 $${d}$ cm の物体の実像が、レンズの後方 $${di}$ cm にできます。倍率 $m$ を符号つきで求めてください。`],
          a: { type: 'num', v: m },
          hint: ['$m = -d_i/d_o$; a negative $m$ means the image is upside down.', '$m = -d_i/d_o$ です。$m$ が負なら像は倒立しています。'],
          sol: [[`$m = -${di}/${d} = ${n(m, 4)}$.`, `$m = -${di}/${d} = ${n(m, 4)}$ です。`], [`The image is inverted and ${Math.abs(m) > 1 ? `${n(Math.abs(m), 3)} times larger` : Math.abs(m) === 1 ? 'the same size' : `${n(Math.abs(m), 3)} of the object's size`}: by similar triangles through the centre of the lens, sizes scale with distances.`, `像は倒立で、${Math.abs(m) > 1 ? `物体の ${n(Math.abs(m), 3)} 倍の大きさ` : Math.abs(m) === 1 ? '物体と同じ大きさ' : `物体の ${n(Math.abs(m), 3)} 倍の大きさ`}です。レンズの中心を通る相似な三角形から、大きさは距離に比例します。`]],
        };
      }
      const fcm = r.pick([10, 20, 25, 40, 50, -20, -25, -50, -100, 200]), Pd = 100 / fcm;
      return {
        q: [`A ${fcm > 0 ? 'converging' : 'diverging'} lens has focal length $${fcm}$ cm. What is its power in dioptres?`, `焦点距離 $${fcm}$ cm の${fcm > 0 ? '凸' : '凹'}レンズの屈折力は何ディオプトリーですか。`],
        a: { type: 'num', v: Pd, unit: ['D', 'D'] },
        hint: ['Power is $1/f$ with $f$ in metres.', '屈折力は $f$ をメートルで表したときの $1/f$ です。'],
        sol: [[`$P = 1/${n(fcm / 100)}\\ \\text{m} = ${n(Pd, 4)}$ D.`, `$P = 1/${n(fcm / 100)}\\ \\text{m} = ${n(Pd, 4)}$ D です。`], [fcm > 0 ? 'Positive power converges light. Thin lenses in contact simply add their powers, which is why opticians use dioptres.' : 'Negative power spreads light, as in glasses for short sight. Thin lenses in contact add their powers, which is why opticians use dioptres.', fcm > 0 ? '正の屈折力は光を集めます。密着した薄レンズの屈折力は単純に足し算できるので、眼鏡店ではディオプトリーを使います。' : '負の屈折力は光を広げます。近視用の眼鏡がそうです。密着した薄レンズの屈折力は足し算できるので、眼鏡店ではディオプトリーを使います。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([1, 1.5, 2, 3, 4, 5]), d = r.pick([1, 2, 3, 4, 5, 6, 8, 10]);
        const di = -f * d / (d + f), m = -di / d;
        return {
          q: [`A diverging lens has $|f| = ${n(f)}$ (so $f = -${n(f)}$). An object is $d_o = ${n(d)}$ in front of it. Find the image distance and the magnification.`, `$|f| = ${n(f)}$（すなわち $f = -${n(f)}$）の凹レンズの前方 $d_o = ${n(d)}$ に物体があります。像距離と倍率を求めてください。`],
          a: { type: 'tuple', v: [di, m], labels: ['$d_i$', '$m$'], rel: 0.005 },
          hint: ['The same equation works with $f < 0$.', '$f < 0$ としても同じ式が使えます。'],
          sol: [[`$1/d_i = -1/${n(f)} - 1/${n(d)}$, so $d_i = -\\dfrac{${n(f)}\\times${n(d)}}{${n(d)} + ${n(f)}} = ${n(di, 4)}$.`, `$1/d_i = -1/${n(f)} - 1/${n(d)}$ より $d_i = -\\dfrac{${n(f)}\\times${n(d)}}{${n(d)} + ${n(f)}} = ${n(di, 4)}$ です。`], [`$m = -d_i/d_o = ${n(m, 4)}$.`, `$m = -d_i/d_o = ${n(m, 4)}$ です。`], ['A diverging lens always gives a virtual, upright, reduced image between the lens and its focal point, wherever the object is.', '凹レンズは、物体がどこにあっても、レンズと焦点の間に正立で縮小した虚像をつくります。']],
          set: { f, object: d, kind: 1 },
        };
      }
      if (form === 1) {
        const conv = r.chance(0.8), f = r.pick([1.5, 2, 2.5, 3]);
        const zone = conv ? r.int(0, 3) : 4;
        const d = conv ? [2 * f + r.pick([0.5, 1, 2]), 2 * f, f + r.pick([0.3, 0.5, 0.8]) * f, f * r.pick([0.4, 0.5, 0.7])][zone] : r.pick([1, 2, 4, 6]);
        return {
          q: [`A ${conv ? 'converging' : 'diverging'} lens with $|f| = ${n(f)}$ and an object at $d_o = ${n(d)}$. Describe the image.`, `$|f| = ${n(f)}$ の${conv ? '凸' : '凹'}レンズで、物体が $d_o = ${n(d)}$ にあります。像はどのようなものですか。`],
          a: { type: 'choice', v: zone, opts: NATURE, fixed: true },
          hint: ['Compare $d_o$ with $f$ and $2f$; at $d_o = 2f$ the image is also at $2f$.', '$d_o$ を $f$ と $2f$ と比べてください。$d_o = 2f$ なら像も $2f$ にできます。'],
          sol: [conv ? [`With $f = ${n(f)}$: ${['$d_o = ' + n(d) + ' > 2f$', '$d_o = ' + n(d) + ' = 2f$', '$f < d_o = ' + n(d) + ' < 2f$', '$d_o = ' + n(d) + ' < f$'][zone]}.`, `$f = ${n(f)}$ に対して ${['$d_o = ' + n(d) + ' > 2f$', '$d_o = ' + n(d) + ' = 2f$', '$f < d_o = ' + n(d) + ' < 2f$', '$d_o = ' + n(d) + ' < f$'][zone]} です。`] : ['For a diverging lens $d_i = -|f|d_o/(d_o + |f|)$ is always negative and smaller than $d_o$ in size.', '凹レンズでは $d_i = -|f|d_o/(d_o + |f|)$ は常に負で、その大きさは $d_o$ より小さくなります。'], [`$d_i = ${n(conv ? imageOf(f, d) : -f * d / (d + f), 4)}$ and $m = ${n(conv ? -imageOf(f, d) / d : f / (d + f), 4)}$: ${NATURE[zone][0]}.`, `$d_i = ${n(conv ? imageOf(f, d) : -f * d / (d + f), 4)}$、$m = ${n(conv ? -imageOf(f, d) / d : f / (d + f), 4)}$ なので、${NATURE[zone][1]}です。`]],
          set: onStep(d, 0.1, 0.5, 10) ? { f, object: Math.round(d * 10) / 10, kind: conv ? 0 : 1 } : { f, kind: conv ? 0 : 1 },
        };
      }
      let f, d; do { f = r.pick([5, 10, 15, 20]); d = r.pick([8, 12, 15, 25, 30, 40, 60]); } while (Math.abs(d - f) < 2);
      const h = r.pick([1, 2, 3, 5]), di = imageOf(f, d), hi = -di / d * h;
      return {
        q: [`An object $${h}$ cm tall stands $${d}$ cm from a converging lens of focal length $${f}$ cm. How tall is the image? Use a negative sign for an inverted image.`, `高さ $${h}$ cm の物体が、焦点距離 $${f}$ cm の凸レンズから $${d}$ cm の所にあります。像の高さはいくらですか。倒立なら負の符号をつけてください。`],
        a: { type: 'num', v: hi, unit: ['cm', 'cm'] },
        hint: ['Find $d_i$ first, then $h_i = m h_o = -(d_i/d_o)h_o$.', 'まず $d_i$ を求め、$h_i = m h_o = -(d_i/d_o)h_o$ とします。'],
        sol: [[`$d_i = \\dfrac{${f}\\times${d}}{${d} - ${f}} = ${n(di, 4)}$ cm.`, `$d_i = \\dfrac{${f}\\times${d}}{${d} - ${f}} = ${n(di, 4)}$ cm です。`], [`$h_i = -(${n(di, 4)}/${d})\\times${h} = ${n(hi, 4)}$ cm.`, `$h_i = -(${n(di, 4)}/${d})\\times${h} = ${n(hi, 4)}$ cm です。`], [hi < 0 ? 'Negative: a real, inverted image, as on a camera sensor.' : 'Positive: the object is inside the focal length, so the image is virtual and upright, as in a magnifying glass.', hi < 0 ? '負なので倒立の実像です。カメラのセンサーに映る像がそうです。' : '正です。物体が焦点距離の内側にあるので、像は正立の虚像です。虫眼鏡の像がそうです。']],
        set: onStep(f / 5, 0.1, 1, 5) && onStep(d / 5, 0.1, 0.5, 10) ? { f: f / 5, object: d / 5, kind: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([1, 2, 2.5, 3, 4]), m = r.pick([-2, -3, -0.5, -1, 2, 3, 4, -4]);
        const d = f * (1 - 1 / m);
        return {
          q: [`A converging lens has $f = ${n(f)}$. Where must the object be placed to give a magnification of $m = ${n(m)}$?`, `$f = ${n(f)}$ の凸レンズで、倍率 $m = ${n(m)}$ を得るには物体をどこに置けばよいですか。`],
          a: { type: 'num', v: d },
          hint: ['Combine $m = -d_i/d_o$ with the lens equation to get $m = f/(f - d_o)$.', '$m = -d_i/d_o$ とレンズの式を組み合わせると $m = f/(f - d_o)$ になります。'],
          sol: [['From $d_i = fd_o/(d_o - f)$: $m = -d_i/d_o = f/(f - d_o)$, so $d_o = f(1 - 1/m)$.', '$d_i = fd_o/(d_o - f)$ より $m = -d_i/d_o = f/(f - d_o)$ なので $d_o = f(1 - 1/m)$ です。'], [`$d_o = ${n(f)}\\,(1 - 1/(${n(m)})) = ${n(d, 4)}$.`, `$d_o = ${n(f)}\\,(1 - 1/(${n(m)})) = ${n(d, 4)}$ です。`], [m > 0 ? 'An upright magnified image needs the object inside the focal length: a magnifying glass.' : m === -1 ? 'Same size and inverted happens exactly at $2f$.' : m < -1 ? 'An enlarged real image needs the object between $f$ and $2f$, as in a projector.' : 'A reduced real image needs the object beyond $2f$, as in a camera.', m > 0 ? '正立で拡大した像には、物体を焦点距離の内側に置く必要があります。虫眼鏡です。' : m === -1 ? '等倍で倒立になるのはちょうど $2f$ のときです。' : m < -1 ? '拡大した実像には、物体を $f$ と $2f$ の間に置く必要があります。プロジェクターがそうです。' : '縮小した実像には、物体を $2f$ より遠くに置く必要があります。カメラがそうです。']],
          set: onStep(d, 0.1, 0.5, 10) ? { f, object: Math.round(d * 10) / 10, kind: 0 } : { f, kind: 0 },
        };
      }
      if (form === 1) {
        const f = r.pick([1, 2, 3, 4, 5]);
        return {
          q: [`For a converging lens with $f = ${f}$, write the image distance $d_i$ as a function of the object distance $x = d_o$.`, `$f = ${f}$ の凸レンズについて、像距離 $d_i$ を物体距離 $x = d_o$ の関数として書いてください。`],
          a: { type: 'expr', v: `${f}x/(x-${f})`, vars: ['x'], dom: { x: [f + 0.4, f + 6] }, lhs: ['$d_i(x) =$', '$d_i(x) =$'] },
          hint: ['Solve $1/f = 1/x + 1/d_i$ for $d_i$.', '$1/f = 1/x + 1/d_i$ を $d_i$ について解きます。'],
          sol: [[`$1/d_i = 1/${f} - 1/x = (x - ${f})/(${f}x)$.`, `$1/d_i = 1/${f} - 1/x = (x - ${f})/(${f}x)$ です。`], [`$d_i = \\dfrac{${f}x}{x - ${f}}$: a hyperbola with a vertical asymptote at $x = ${f}$ and a horizontal one at $d_i = ${f}$.`, `$d_i = \\dfrac{${f}x}{x - ${f}}$ で、$x = ${f}$ に縦の漸近線、$d_i = ${f}$ に横の漸近線をもつ双曲線です。`], ['This is the curve in the graph under the ray diagram: as the object recedes to infinity the image settles on the focal plane, and as it approaches $F$ the image runs off to infinity.', 'これは光線図の下のグラフの曲線です。物体が無限遠へ遠ざかると像は焦点面に落ち着き、$F$ に近づくと像は無限遠へ逃げていきます。']],
          set: { f, kind: 0 },
        };
      }
      let f1, f2, s, d, d2, di1; do { f1 = r.pick([10, 15, 20]); f2 = r.pick([10, 20, -10, -20, 15]); s = r.pick([20, 30, 40, 50]); d = r.pick([15, 25, 30, 40, 60]); di1 = imageOf(f1, d); d2 = s - di1; } while (Math.abs(d - f1) < 3 || Math.abs(d2 - f2) < 3 || Math.abs(d2) < 2);
      const di2 = imageOf(f2, d2), M = (-di1 / d) * (-di2 / d2);
      return {
        q: [`Two thin lenses share an axis $${s}$ cm apart: the first has $f_1 = ${f1}$ cm, the second $f_2 = ${f2}$ cm. An object is $${d}$ cm in front of the first. Where is the final image, measured from the second lens?`, `2枚の薄レンズが $${s}$ cm 離れて同じ軸上にあります。1枚目は $f_1 = ${f1}$ cm、2枚目は $f_2 = ${f2}$ cm です。物体が1枚目の前方 $${d}$ cm にあるとき、最終的な像は2枚目のレンズから測ってどこにできますか。`],
        a: { type: 'num', v: di2, rel: 0.005, unit: ['cm', 'cm'] },
        hint: ['The image of the first lens is the object of the second. If it lies beyond the second lens, its object distance is negative.', '1枚目の像が2枚目の物体になります。それが2枚目より後ろにあれば、物体距離は負です。'],
        sol: [[`First lens: $d_{i1} = \\dfrac{${f1}\\times${d}}{${d} - ${f1}} = ${n(di1, 4)}$ cm.`, `1枚目：$d_{i1} = \\dfrac{${f1}\\times${d}}{${d} - ${f1}} = ${n(di1, 4)}$ cm です。`], [`Object distance for the second lens: $d_{o2} = ${s} - ${n(di1, 4)} = ${n(d2, 4)}$ cm${d2 < 0 ? ' (a virtual object, since the rays converge towards a point behind it)' : ''}.`, `2枚目の物体距離は $d_{o2} = ${s} - ${n(di1, 4)} = ${n(d2, 4)}$ cm です${d2 < 0 ? '（光線が2枚目の後ろの点へ向かって集まるので、虚物体です）' : ''}。`], [`$d_{i2} = \\dfrac{${f2}\\times(${n(d2, 4)})}{${n(d2, 4)} - (${f2})} = ${n(di2, 4)}$ cm; ${di2 > 0 ? 'a real image behind the second lens' : 'a virtual image in front of the second lens'}, with total magnification $m_1m_2 = ${n(M, 3)}$.`, `$d_{i2} = \\dfrac{${f2}\\times(${n(d2, 4)})}{${n(d2, 4)} - (${f2})} = ${n(di2, 4)}$ cm で、${di2 > 0 ? '2枚目の後ろにできる実像' : '2枚目の前にできる虚像'}です。全体の倍率は $m_1m_2 = ${n(M, 3)}$ です。`]],
      };
    },
  ];

  /* ---------------- 2. slit interference ---------------- */
  Q.interference = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lam = r.step(400, 700, 10), d = r.step(1, 5, 0.1), th = deg(Math.asin(lam / 1000 / d));
        return {
          q: [`Light of wavelength $${lam}$ nm falls on slits $${n(d)}\\ \\mu\\text{m}$ apart. At what angle is the first-order bright fringe? Give two decimals.`, `波長 $${lam}$ nm の光が間隔 $${n(d)}\\ \\mu\\text{m}$ のスリットに当たります。1次の明線は何度の方向に現れますか。小数第2位まで求めてください。`],
          a: { type: 'num', v: th, tol: 0.01, unit: ['°', '°'] },
          hint: ['Bright where the path difference is one wavelength: $d\\sin\\theta = \\lambda$.', '光路差が1波長になる所が明るくなります。$d\\sin\\theta = \\lambda$ です。'],
          sol: [[`$\\sin\\theta_1 = \\lambda/d = ${n(lam / 1000)}/${n(d)} = ${n(lam / 1000 / d, 4)}$.`, `$\\sin\\theta_1 = \\lambda/d = ${n(lam / 1000)}/${n(d)} = ${n(lam / 1000 / d, 4)}$ です。`], [`$\\theta_1 = ${n(th, 3)}^\\circ$, the angle shown in the readout.`, `$\\theta_1 = ${n(th, 3)}^\\circ$ で、読み取り欄の角度と同じです。`]],
          set: { wavelength: lam, spacing: d },
        };
      }
      if (form === 1) {
        const lam = r.pick([450, 500, 550, 589, 633, 650]), dmm = r.pick([0.1, 0.2, 0.25, 0.5, 1]), Lm = r.pick([1, 1.5, 2, 3]);
        const y = lam * 1e-9 * Lm / (dmm * 1e-3);
        return {
          q: [`In a Young's double-slit experiment, $\\lambda = ${lam}$ nm, the slits are $${n(dmm)}$ mm apart and the screen is $${n(Lm)}$ m away. How far apart are neighbouring bright fringes?`, `ヤングの二重スリットの実験で、$\\lambda = ${lam}$ nm、スリット間隔 $${n(dmm)}$ mm、スクリーンまでの距離 $${n(Lm)}$ m です。隣り合う明線の間隔はいくらですか。`],
          a: { type: 'num', v: y * 1000, rel: 0.005, unit: ['mm', 'mm'] },
          hint: ['For small angles $y_m = m\\lambda L/d$, so the spacing is $\\lambda L/d$.', '小角では $y_m = m\\lambda L/d$ なので、間隔は $\\lambda L/d$ です。'],
          sol: [[`$\\Delta y = \\lambda L/d = ${lam}\\times10^{-9}\\times${n(Lm)}/(${n(dmm)}\\times10^{-3})$.`, `$\\Delta y = \\lambda L/d = ${lam}\\times10^{-9}\\times${n(Lm)}/(${n(dmm)}\\times10^{-3})$ です。`], [`$\\Delta y = ${sig(y * 1000, 3)}$ mm: narrow slits far apart in wavelengths give small angles, and the distance to the screen magnifies them.`, `$\\Delta y = ${sig(y * 1000, 3)}$ mm です。波長に比べて広い間隔のスリットは小さな角度を生み、スクリーンまでの距離がそれを拡大します。`]],
        };
      }
      let lam, d; do { lam = r.step(400, 700, 10); d = r.step(1, 5, 0.1); } while (Math.abs(d * 1000 / lam - Math.round(d * 1000 / lam)) < 0.02);
      const mmax = Math.floor(d * 1000 / lam);
      return {
        q: [`How many bright orders (counting $m = 0$ and both sides) appear in the far field for $\\lambda = ${lam}$ nm and slit spacing $d = ${n(d)}\\ \\mu\\text{m}$?`, `$\\lambda = ${lam}$ nm、スリット間隔 $d = ${n(d)}\\ \\mu\\text{m}$ のとき、遠方に現れる明線の次数はいくつありますか（$m = 0$ と両側を含めて数えてください）。`],
        a: { type: 'int', v: 2 * mmax + 1 },
        hint: ['$|\\sin\\theta| \\le 1$, so $|m| \\le d/\\lambda$.', '$|\\sin\\theta| \\le 1$ なので $|m| \\le d/\\lambda$ です。'],
        sol: [[`$d/\\lambda = ${n(d)}/${n(lam / 1000)} = ${n(d * 1000 / lam, 4)}$, so $|m| \\le ${mmax}$.`, `$d/\\lambda = ${n(d)}/${n(lam / 1000)} = ${n(d * 1000 / lam, 4)}$ なので $|m| \\le ${mmax}$ です。`], [`That gives $2\\times${mmax} + 1 = ${2 * mmax + 1}$ orders. A wider spacing or a shorter wavelength fits in more, packed more closely in angle.`, `したがって $2\\times${mmax} + 1 = ${2 * mmax + 1}$ 個です。間隔が広いほど、また波長が短いほど多くの次数が入り、角度の上で詰まって並びます。`]],
        set: { wavelength: lam, spacing: d },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let lam, d, m; do { lam = r.step(400, 700, 10); d = r.step(1.5, 5, 0.1); m = r.int(2, 4); } while (m * lam / 1000 / d >= 0.98);
        const th = deg(Math.asin(m * lam / 1000 / d));
        return {
          q: [`With $\\lambda = ${lam}$ nm and $d = ${n(d)}\\ \\mu\\text{m}$, at what angle is the order $m = ${m}$ bright fringe? Give two decimals; no small-angle approximation.`, `$\\lambda = ${lam}$ nm、$d = ${n(d)}\\ \\mu\\text{m}$ のとき、$m = ${m}$ 次の明線は何度の方向にありますか。小角近似を使わず、小数第2位まで求めてください。`],
          a: { type: 'num', v: th, tol: 0.01, unit: ['°', '°'] },
          hint: ['$\\sin\\theta_m = m\\lambda/d$, then take the arcsine.', '$\\sin\\theta_m = m\\lambda/d$ を求めてから逆正弦をとります。'],
          sol: [[`$\\sin\\theta_${m} = ${m}\\times${n(lam / 1000)}/${n(d)} = ${n(m * lam / 1000 / d, 4)}$.`, `$\\sin\\theta_${m} = ${m}\\times${n(lam / 1000)}/${n(d)} = ${n(m * lam / 1000 / d, 4)}$ です。`], [`$\\theta_${m} = ${n(th, 3)}^\\circ$, which is ${n(th / deg(Math.asin(lam / 1000 / d)), 3)} times $\\theta_1$, not ${m} times: at large angles the orders spread out.`, `$\\theta_${m} = ${n(th, 3)}^\\circ$ で、$\\theta_1$ の ${m} 倍ではなく ${n(th / deg(Math.asin(lam / 1000 / d)), 3)} 倍です。大きな角度では次数どうしが広がります。`]],
          set: { wavelength: lam, spacing: d },
        };
      }
      if (form === 1) {
        const opts = [];
        for (const a of [0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8]) for (let k = 2; k <= 6; k++) { const d = Math.round(k * a * 100) / 100; if (d >= 1 && d <= 5 && onStep(d, 0.1, 1, 5)) opts.push([a, k, d]); }
        const [a, k, d] = r.pick(opts), lam = r.step(400, 600, 10), mm = Math.floor(d * 1000 / lam - 1e-9);
        return {
          q: [`Slits of width $a = ${n(a)}\\ \\mu\\text{m}$ are spaced $d = ${n(d)}\\ \\mu\\text{m}$ apart. Which is the lowest bright order that is missing from the pattern?`, `幅 $a = ${n(a)}\\ \\mu\\text{m}$ のスリットが間隔 $d = ${n(d)}\\ \\mu\\text{m}$ で並んでいます。模様から消える最も低い明線の次数はいくつですか。`],
          a: { type: 'int', v: k },
          hint: ['An order disappears when it lands on a zero of the single-slit envelope, $a\\sin\\theta = \\lambda$.', '明線の方向が単スリットの包絡線の零点 $a\\sin\\theta = \\lambda$ と重なると、その次数は消えます。'],
          sol: [['Order $m$ is at $\\sin\\theta = m\\lambda/d$; the first envelope zero is at $\\sin\\theta = \\lambda/a$.', '$m$ 次の明線は $\\sin\\theta = m\\lambda/d$、包絡線の最初の零点は $\\sin\\theta = \\lambda/a$ にあります。'], [`They coincide when $m = d/a = ${n(d)}/${n(a)} = ${k}$, and every multiple of ${k} is missing too.`, `両者は $m = d/a = ${n(d)}/${n(a)} = ${k}$ で一致し、${k} の倍数の次数もすべて消えます。`], [mm >= k ? `At $\\lambda = ${lam}$ nm the pattern reaches order ${mm}, so the gap at $m = ${k}$ is visible in the graph.` : `At $\\lambda = ${lam}$ nm the pattern only reaches order ${mm}, so you would need a shorter wavelength to see the gap; the condition $d = ${k}a$ does not depend on $\\lambda$.`, mm >= k ? `$\\lambda = ${lam}$ nm では模様は ${mm} 次まで届くので、$m = ${k}$ の欠けがグラフで見えます。` : `$\\lambda = ${lam}$ nm では模様は ${mm} 次までしか届かないので、欠けを見るにはもっと短い波長が必要です。条件 $d = ${k}a$ 自体は $\\lambda$ によりません。`]],
          set: { width: a, spacing: d, wavelength: lam },
        };
      }
      const N = r.int(2, 8), askMin = r.chance(0.5);
      return {
        q: [askMin ? `A grating has $N = ${N}$ slits. How many intensity zeros lie between two neighbouring principal maxima?` : `A grating has $N = ${N}$ slits. How many weak secondary peaks lie between two neighbouring principal maxima?`, askMin ? `$N = ${N}$ 本のスリットがあります。隣り合う主極大の間に、強度が 0 になる点はいくつありますか。` : `$N = ${N}$ 本のスリットがあります。隣り合う主極大の間に、弱い副極大はいくつありますか。`],
        a: { type: 'int', v: askMin ? N - 1 : N - 2 },
        hint: ['The array factor $\\sin^2(N\\varphi/2)/\\sin^2(\\varphi/2)$ vanishes whenever $N\\varphi/2$ is a multiple of $\\pi$ but $\\varphi/2$ is not.', '配列因子 $\\sin^2(N\\varphi/2)/\\sin^2(\\varphi/2)$ は、$N\\varphi/2$ が $\\pi$ の倍数で $\\varphi/2$ がそうでないときに 0 になります。'],
        sol: [[`Between $\\varphi = 0$ and $2\\pi$ the zeros are at $\\varphi = 2\\pi k/N$ for $k = 1, \\dots, ${N - 1}$: that is ${N - 1} zero${N - 1 === 1 ? '' : 's'}.`, `$\\varphi = 0$ と $2\\pi$ の間で零点は $k = 1, \\dots, ${N - 1}$ に対する $\\varphi = 2\\pi k/N$ で、${N - 1} 個です。`], [`Between consecutive zeros the intensity rises again, giving ${N - 2} secondary peak${N - 2 === 1 ? '' : 's'}. ${askMin ? '' : ''}Meanwhile the principal maxima grow as $N^2$ and narrow as $1/N$, which is what makes a grating sharp.`, `隣り合う零点の間で強度は再び上がるので、副極大は ${N - 2} 個です。一方で主極大は $N^2$ に比例して強くなり $1/N$ に比例して細くなります。これが回折格子の鋭さの理由です。`]],
        set: N <= 5 ? { slits: N } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let lam, d, m; do { lam = r.step(400, 700, 10); d = r.step(1.5, 5, 0.1); m = r.int(1, 3); } while (m * lam / 1000 / d >= 0.95);
        const th = Math.round(deg(Math.asin(m * lam / 1000 / d)) * 100) / 100, lamX = d * 1000 * Math.sin(rad(th)) / m;
        return {
          q: [`The order $m = ${m}$ bright fringe from slits $${n(d)}\\ \\mu\\text{m}$ apart is measured at $${n(th)}^\\circ$. What is the wavelength?`, `間隔 $${n(d)}\\ \\mu\\text{m}$ のスリットによる $m = ${m}$ 次の明線が $${n(th)}^\\circ$ に観測されました。波長はいくらですか。`],
          a: { type: 'num', v: lamX, tol: 1, unit: ['nm', 'nm'] },
          hint: ['Turn the grating equation round: $\\lambda = d\\sin\\theta/m$.', '格子の式を逆に使います。$\\lambda = d\\sin\\theta/m$ です。'],
          sol: [[`$\\lambda = ${n(d)}\\ \\mu\\text{m}\\times\\sin ${n(th)}^\\circ/${m} = ${n(lamX / 1000, 4)}\\ \\mu\\text{m}$.`, `$\\lambda = ${n(d)}\\ \\mu\\text{m}\\times\\sin ${n(th)}^\\circ/${m} = ${n(lamX / 1000, 4)}\\ \\mu\\text{m}$ です。`], [`$\\lambda \\approx ${Math.round(lamX)}$ nm. This is how a spectrometer reads wavelengths: from angles and a known spacing.`, `$\\lambda \\approx ${Math.round(lamX)}$ nm です。分光器はこうして、既知の間隔と角度から波長を読み取ります。`]],
          set: { wavelength: lam, spacing: d },
        };
      }
      if (form === 1) {
        const [l1, l2, nm, nj] = r.pick([[589.0, 589.6, 'the sodium D lines', 'ナトリウムの D 線'], [577.0, 579.1, 'the mercury yellow doublet', '水銀の黄色の二重線'], [656.10, 656.28, 'the hydrogen and deuterium Hα lines', '水素と重水素の Hα 線'], [766.5, 769.9, 'the potassium doublet', 'カリウムの二重線']]);
        const m = r.int(1, 3), lam = (l1 + l2) / 2, dl = l2 - l1, Nmin = Math.ceil(lam / (m * dl) - 1e-9);
        return {
          q: [`To resolve ${nm} ($${l1}$ nm and $${l2}$ nm) in order $m = ${m}$, how many slits must a grating have at least?`, `${nj}（$${l1}$ nm と $${l2}$ nm）を $m = ${m}$ 次で分離するには、回折格子には少なくとも何本のスリットが必要ですか。`],
          a: { type: 'int', v: Nmin },
          hint: ['Resolving power: $\\lambda/\\Delta\\lambda = mN$ (Rayleigh: one peak on the first zero of the other).', '分解能は $\\lambda/\\Delta\\lambda = mN$ です（レイリーの基準：一方のピークが他方の最初の零点に重なる）。'],
          sol: [[`$\\lambda/\\Delta\\lambda = ${n(lam, 5)}/${n(dl, 3)} = ${n(lam / dl, 4)}$.`, `$\\lambda/\\Delta\\lambda = ${n(lam, 5)}/${n(dl, 3)} = ${n(lam / dl, 4)}$ です。`], [`$N \\ge ${n(lam / dl, 4)}/${m} = ${n(lam / dl / m, 4)}$, so at least ${Nmin} slits illuminated.`, `$N \\ge ${n(lam / dl, 4)}/${m} = ${n(lam / dl / m, 4)}$ なので、少なくとも ${Nmin} 本のスリットに光が当たる必要があります。`], ['The width of each principal maximum is about $1/N$ of the spacing between orders, which is why more slits separate nearby colours.', '各主極大の幅は次数間の間隔の約 $1/N$ なので、スリットが多いほど近い色を分けられます。']],
        };
      }
      const pairs = [[500, 2.5], [500, 2], [400, 2], [600, 3], [500, 1.5], [400, 1.2], [600, 1.8], [700, 3.5], [500, 4]];
      const [lam, d] = r.pick(pairs), k = d * 1000 / lam;
      return {
        q: [`Two very narrow slits $${n(d)}\\ \\mu\\text{m}$ apart are lit with $${lam}$ nm light. Write the far-field intensity $I/I_0$ as a function of $s = \\sin\\theta$.`, `間隔 $${n(d)}\\ \\mu\\text{m}$ のとても細い2本のスリットを $${lam}$ nm の光で照らします。遠方の強度 $I/I_0$ を $s = \\sin\\theta$ の関数として書いてください。`],
        a: { type: 'expr', v: `cos(${k}*pi*s)^2`, vars: ['s'], dom: { s: [-0.95, 0.95] }, lhs: ['$I/I_0 =$', '$I/I_0 =$'] },
        hint: ['Add two equal waves with phase difference $\\varphi = 2\\pi d s/\\lambda$: $|1 + e^{i\\varphi}|^2/4 = \\cos^2(\\varphi/2)$.', '位相差 $\\varphi = 2\\pi d s/\\lambda$ の等しい二つの波を足します。$|1 + e^{i\\varphi}|^2/4 = \\cos^2(\\varphi/2)$ です。'],
        sol: [[`$\\varphi/2 = \\pi d s/\\lambda = ${n(k)}\\pi s$.`, `$\\varphi/2 = \\pi d s/\\lambda = ${n(k)}\\pi s$ です。`], [`$I/I_0 = \\cos^2(${n(k)}\\pi s)$, with maxima where $${n(k)}s$ is an integer, that is $d\\sin\\theta = m\\lambda$.`, `$I/I_0 = \\cos^2(${n(k)}\\pi s)$ で、$${n(k)}s$ が整数の所、すなわち $d\\sin\\theta = m\\lambda$ で極大になります。`], ['With finite slit width the same fringes are multiplied by the envelope $(\\sin\\beta/\\beta)^2$; with very narrow slits the envelope is flat.', 'スリットに幅があると、同じ縞に包絡線 $(\\sin\\beta/\\beta)^2$ が掛かります。とても細いスリットでは包絡線は平らです。']],
        set: { wavelength: lam, spacing: d, slits: 2, width: 0.1 },
      };
    },
  ];

  /* ---------------- 3. polarization ---------------- */
  Q.polarization = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([0, 15, 30, 45, 60, 75, 90, 120, 135, 150, 20, 70]), I0 = r.step(0.2, 1, 0.05);
        const I = I0 * Math.cos(rad(th)) ** 2;
        return {
          q: [`Polarised light of intensity $I_0 = ${n(I0)}$ meets an analyser at $\\theta = ${th}^\\circ$ to its plane of polarisation. What intensity gets through? Give three decimals.`, `強度 $I_0 = ${n(I0)}$ の偏光が、偏光面と $\\theta = ${th}^\\circ$ をなす検光子に当たります。透過する強度はいくらですか。小数第3位まで求めてください。`],
          a: { type: 'num', v: I, tol: 0.0006 },
          hint: ['Malus: $I = I_0\\cos^2\\theta$.', 'マリュスの法則：$I = I_0\\cos^2\\theta$ です。'],
          sol: [[`$I = ${n(I0)}\\cos^2 ${th}^\\circ = ${n(I0)}\\times${n(Math.cos(rad(th)) ** 2, 4)} = ${n(I, 4)}$.`, `$I = ${n(I0)}\\cos^2 ${th}^\\circ = ${n(I0)}\\times${n(Math.cos(rad(th)) ** 2, 4)} = ${n(I, 4)}$ です。`], ['The field is projected once, multiplying its amplitude by $\\cos\\theta$; intensity goes as the square of the amplitude.', '電場は一度射影されて振幅が $\\cos\\theta$ 倍になり、強度は振幅の二乗に比例します。']],
          set: { angle: th, i0: I0, middle: 0 },
        };
      }
      if (form === 1) {
        const Iin = r.pick([10, 20, 40, 50, 100, 300]), th = r.pick([0, 30, 45, 60, 90, 25, 50]);
        const I = Iin / 2 * Math.cos(rad(th)) ** 2;
        return {
          q: [`Unpolarised light of intensity $${Iin}\\ \\text{W/m}^2$ passes a polariser and then an analyser at $${th}^\\circ$ to it. What intensity emerges?`, `強度 $${Iin}\\ \\text{W/m}^2$ の非偏光が偏光子を通り、それと $${th}^\\circ$ をなす検光子を通ります。出てくる強度はいくらですか。`],
          a: { type: 'num', v: I, tol: 0.01, unit: ['W/m²', 'W/m²'] },
          hint: ['An ideal polariser passes exactly half of unpolarised light, whatever its orientation.', '理想的な偏光子は、向きによらず非偏光のちょうど半分を通します。'],
          sol: [[`After the polariser: $I_0 = ${Iin}/2 = ${n(Iin / 2)}\\ \\text{W/m}^2$, the average of $\\cos^2$ over all directions.`, `偏光子の後では $I_0 = ${Iin}/2 = ${n(Iin / 2)}\\ \\text{W/m}^2$ です。これはあらゆる向きについての $\\cos^2$ の平均です。`], [`After the analyser: $I = ${n(Iin / 2)}\\cos^2 ${th}^\\circ = ${n(I, 4)}\\ \\text{W/m}^2$.`, `検光子の後では $I = ${n(Iin / 2)}\\cos^2 ${th}^\\circ = ${n(I, 4)}\\ \\text{W/m}^2$ です。`]],
          set: { angle: th, middle: 0 },
        };
      }
      const f = r.pick([0.25, 0.5, 0.75, 0.1, 0.9, 0.2]), th = deg(Math.acos(Math.sqrt(f)));
      return {
        q: [`At what analyser angle between $0^\\circ$ and $90^\\circ$ does a fraction $${n(f)}$ of the polarised intensity get through? Give one decimal.`, `$0^\\circ$ から $90^\\circ$ の間で、偏光の強度の $${n(f)}$ の割合が通る検光子の角度はいくつですか。小数第1位まで求めてください。`],
        a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
        hint: ['Solve $\\cos^2\\theta = f$, so $\\cos\\theta = \\sqrt f$.', '$\\cos^2\\theta = f$ を解きます。$\\cos\\theta = \\sqrt f$ です。'],
        sol: [[`$\\cos\\theta = \\sqrt{${n(f)}} = ${n(Math.sqrt(f), 4)}$.`, `$\\cos\\theta = \\sqrt{${n(f)}} = ${n(Math.sqrt(f), 4)}$ です。`], [`$\\theta = ${n(th, 2)}^\\circ$. ${f === 0.5 ? 'Half the light at $45^\\circ$, where the field is split equally between the two axes.' : 'The answer is not linear in $f$: intensity falls slowly near $0^\\circ$ and fast in the middle.'}`, `$\\theta = ${n(th, 2)}^\\circ$ です。${f === 0.5 ? '半分になるのは $45^\\circ$ で、電場が二つの軸に等しく分かれます。' : '答えは $f$ に比例しません。強度は $0^\\circ$ 付近ではゆっくり、中ほどでは速く減ります。'}`]],
        set: { angle: Math.round(th), middle: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const half = r.chance(0.5), th = r.pick([60, 90, 120, 80, 100, 90]), ph = half ? th / 2 : r.pick([20, 30, 60, 70].filter((p) => p !== th / 2));
        const frac = Math.cos(rad(ph)) ** 2 * Math.cos(rad(th - ph)) ** 2;
        return {
          q: [`Between a polariser at $0^\\circ$ and an analyser at $${th}^\\circ$ a third filter is set at $${ph}^\\circ$. What fraction of $I_0$ (the intensity after the first polariser) emerges? Give three decimals.`, `$0^\\circ$ の偏光子と $${th}^\\circ$ の検光子の間に、3枚目のフィルターを $${ph}^\\circ$ に置きます。$I_0$（最初の偏光子の後の強度）のうちどれだけの割合が出てきますか。小数第3位まで求めてください。`],
          a: { type: 'num', v: frac, tol: 0.0006 },
          hint: ['Apply Malus at each filter in turn, using the angle between neighbouring filters.', '隣り合うフィルターの間の角度を使って、マリュスの法則を順に当てはめます。'],
          sol: [[`First step: $\\cos^2 ${ph}^\\circ = ${n(Math.cos(rad(ph)) ** 2, 4)}$. Second: $\\cos^2(${th}^\\circ - ${ph}^\\circ) = ${n(Math.cos(rad(th - ph)) ** 2, 4)}$.`, `一段目は $\\cos^2 ${ph}^\\circ = ${n(Math.cos(rad(ph)) ** 2, 4)}$、二段目は $\\cos^2(${th}^\\circ - ${ph}^\\circ) = ${n(Math.cos(rad(th - ph)) ** 2, 4)}$ です。`], [`$I/I_0 = ${n(frac, 4)}$, compared with $\\cos^2 ${th}^\\circ = ${n(Math.cos(rad(th)) ** 2, 4)}$ without the middle filter.`, `$I/I_0 = ${n(frac, 4)}$ です。中間のフィルターがなければ $\\cos^2 ${th}^\\circ = ${n(Math.cos(rad(th)) ** 2, 4)}$ です。`], ['Each filter re-prepares the polarisation along its own axis, so two small turns lose less than one large turn.', '各フィルターは偏光を自分の軸の向きに作り直すので、小さく二回回す方が大きく一回回すより損失が少なくなります。']],
          set: half ? { angle: th, middle: 1 } : undefined,
        };
      }
      if (form === 1) {
        const [n1, n2, en, ja] = r.pick([[1, 1.5, 'air to glass', '空気からガラス'], [1, 1.33, 'air to water', '空気から水'], [1, 2.42, 'air to diamond', '空気からダイヤモンド'], [1.5, 1, 'glass to air', 'ガラスから空気'], [1.33, 1.5, 'water to glass', '水からガラス'], [1, 1.76, 'air to sapphire', '空気からサファイア']]);
        const tb = deg(Math.atan(n2 / n1));
        return {
          q: [`At what angle of incidence is light reflected from ${en} ($n_1 = ${n1}$, $n_2 = ${n2}$) completely polarised? Give one decimal.`, `${ja}（$n_1 = ${n1}$、$n_2 = ${n2}$）への反射光が完全に偏光する入射角は何度ですか。小数第1位まで求めてください。`],
          a: { type: 'num', v: tb, tol: 0.06, unit: ['°', '°'] },
          hint: ['Brewster: $\\tan\\theta_B = n_2/n_1$.', 'ブリュースターの角：$\\tan\\theta_B = n_2/n_1$ です。'],
          sol: [[`$\\tan\\theta_B = ${n2}/${n1} = ${n(n2 / n1, 4)}$, so $\\theta_B = ${n(tb, 2)}^\\circ$.`, `$\\tan\\theta_B = ${n2}/${n1} = ${n(n2 / n1, 4)}$ より $\\theta_B = ${n(tb, 2)}^\\circ$ です。`], ['There the reflected and refracted rays are at right angles, and the dipoles in the second medium cannot radiate along their own axis, so the polarisation in the plane of incidence is not reflected at all.', 'このとき反射光と屈折光は直交し、第二の媒質の双極子は自分の軸の方向には放射できないので、入射面内の偏光はまったく反射されません。']],
        };
      }
      const sc = r.int(0, 1);
      return {
        q: [sc ? 'Glare from a wet road or a lake is partly polarised by reflection. Which way should the transmission axis of polarising sunglasses point to cut it?' : 'Light reflected from a horizontal pane of glass near Brewster\'s angle is mostly polarised in which direction?', sc ? '濡れた道路や湖面のぎらつきは、反射によって部分的に偏光しています。偏光サングラスの透過軸はどちら向きにすればそれを抑えられますか。' : '水平なガラス板でブリュースター角付近で反射した光は、主にどの向きに偏光していますか。'],
        a: { type: 'choice', v: sc ? 1 : 0, opts: [['Horizontal, parallel to the reflecting surface', '水平、反射面に平行'], ['Vertical, so the horizontally polarised glare is blocked', '鉛直、水平に偏光したぎらつきを遮るため'], ['Along the direction of the reflected beam', '反射光の進む向き'], ['It does not matter: reflection does not polarise light', 'どちらでもよい。反射は光を偏光させない']] },
        hint: ['Near Brewster\'s angle the polarisation lying in the plane of incidence is hardly reflected at all.', 'ブリュースター角の近くでは、入射面内の偏光はほとんど反射されません。'],
        sol: [['For a horizontal surface the plane of incidence is vertical, so what survives reflection is polarised perpendicular to it: horizontally.', '水平な面では入射面は鉛直なので、反射で残るのはそれに垂直な、水平方向の偏光です。'], [sc ? 'A vertical transmission axis is crossed with that glare and blocks it, by Malus\'s law with $\\theta = 90^\\circ$.' : 'That is why glare is horizontally polarised, and why polarising sunglasses have vertical axes.', sc ? '鉛直な透過軸はそのぎらつきと直交するので、$\\theta = 90^\\circ$ のマリュスの法則によって遮ります。' : 'そのためぎらつきは水平に偏光しており、偏光サングラスの軸は鉛直になっています。']],
        set: { angle: 90, middle: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.int(2, 9), frac = Math.cos(rad(90 / N)) ** (2 * N);
        return {
          q: [`A polariser and an analyser are crossed at $90^\\circ$. Between them you insert filters so that the axis turns in $${N}$ equal steps of $${n(90 / N, 3)}^\\circ$. What fraction of $I_0$ now gets through? Give three decimals.`, `偏光子と検光子が $90^\\circ$ で直交しています。その間にフィルターを入れ、軸を $${N}$ 回の等しい $${n(90 / N, 3)}^\\circ$ ずつ回すようにします。$I_0$ のうちどれだけの割合が通りますか。小数第3位まで求めてください。`],
          a: { type: 'num', v: frac, tol: 0.0006 },
          hint: ['Each step multiplies the intensity by the same factor $\\cos^2(90^\\circ/N)$.', '各段で強度は同じ因子 $\\cos^2(90^\\circ/N)$ 倍になります。'],
          sol: [[`$I/I_0 = \\left(\\cos^2 ${n(90 / N, 3)}^\\circ\\right)^{${N}} = ${n(frac, 4)}$.`, `$I/I_0 = \\left(\\cos^2 ${n(90 / N, 3)}^\\circ\\right)^{${N}} = ${n(frac, 4)}$ です。`], ['As $N \\to \\infty$, $\\cos^{2N}(\\pi/2N) \\approx 1 - \\pi^2/4N \\to 1$: turning the polarisation in many tiny steps loses almost nothing, which is how twisted nematic liquid crystals rotate light.', '$N \\to \\infty$ では $\\cos^{2N}(\\pi/2N) \\approx 1 - \\pi^2/4N \\to 1$ です。偏光をごく小さな段階で回せばほとんど何も失いません。ねじれネマティック液晶が光を回す仕組みです。']],
          set: N === 2 ? { angle: 90, middle: 1 } : undefined,
        };
      }
      if (form === 1) {
        const crossed = r.chance(0.5), th = crossed ? 90 : r.pick([60, 120, 70, 110]);
        return {
          q: [crossed ? 'A polariser at $0^\\circ$ and an analyser at $90^\\circ$ are crossed. A third filter between them is set at angle $p$ (in radians). Write the transmitted fraction $I/I_0$ as a function of $p$.' : `A polariser at $0^\\circ$ and an analyser at $${th}^\\circ$ have a third filter between them at angle $p$ (in radians). Write $I/I_0$ as a function of $p$, using $\\theta = ${n(rad(th), 4)}$ rad.`, crossed ? '$0^\\circ$ の偏光子と $90^\\circ$ の検光子が直交しています。その間の3枚目のフィルターを角度 $p$（ラジアン）に置きます。透過する割合 $I/I_0$ を $p$ の関数として書いてください。' : `$0^\\circ$ の偏光子と $${th}^\\circ$ の検光子の間に、3枚目のフィルターを角度 $p$（ラジアン）に置きます。$\\theta = ${n(rad(th), 4)}$ rad として $I/I_0$ を $p$ の関数で書いてください。`],
          a: { type: 'expr', v: crossed ? 'cos(p)^2*sin(p)^2' : `cos(p)^2*cos(${rad(th)}-p)^2`, vars: ['p'], dom: { p: [0.1, 1.5] }, lhs: ['$I/I_0 =$', '$I/I_0 =$'] },
          hint: ['Two Malus factors: one for the turn from $0$ to $p$, one for the turn from $p$ to the analyser.', 'マリュスの因子が二つあります。$0$ から $p$ への回転と、$p$ から検光子への回転です。'],
          sol: crossed ? [['$I/I_0 = \\cos^2 p\\,\\cos^2(\\pi/2 - p) = \\cos^2 p\\,\\sin^2 p = \\tfrac14\\sin^2 2p$.', '$I/I_0 = \\cos^2 p\\,\\cos^2(\\pi/2 - p) = \\cos^2 p\\,\\sin^2 p = \\tfrac14\\sin^2 2p$ です。'], ['It is largest at $p = \\pi/4$, where $I = I_0/4$: the best place for the middle filter is halfway.', '最大は $p = \\pi/4$ で $I = I_0/4$ です。中間のフィルターを置く最良の位置はちょうど真ん中です。']] : [[`$I/I_0 = \\cos^2 p\\,\\cos^2(\\theta - p)$ with $\\theta = ${th}^\\circ$.`, `$\\theta = ${th}^\\circ$ として $I/I_0 = \\cos^2 p\\,\\cos^2(\\theta - p)$ です。`], ['By symmetry it peaks at $p = \\theta/2$, giving $\\cos^4(\\theta/2)$, the curve the figure draws for three filters.', '対称性から $p = \\theta/2$ で最大となり、$\\cos^4(\\theta/2)$ を与えます。図で3枚の場合に描かれる曲線です。']],
          set: { angle: th, middle: 1 },
        };
      }
      const nWant = r.pick([1.33, 1.46, 1.52, 1.65, 1.9, 2.42]), tb = Math.round(deg(Math.atan(nWant)) * 10) / 10, nX = Math.tan(rad(tb));
      const askRefr = r.chance(0.4);
      return {
        q: [askRefr ? `Light hits a surface (from air) at its Brewster angle, $${n(tb)}^\\circ$. What is the angle of refraction inside the material?` : `Reflections from an unknown transparent material (in air) vanish for one polarisation at $${n(tb)}^\\circ$ incidence. What is its refractive index? Give three decimals.`, askRefr ? `光が空気から物質の表面にブリュースター角 $${n(tb)}^\\circ$ で入射します。物質中の屈折角はいくらですか。` : `空気中にある未知の透明な物質で、入射角 $${n(tb)}^\\circ$ のとき一方の偏光の反射が消えます。屈折率はいくらですか。小数第3位まで求めてください。`],
        a: askRefr ? { type: 'num', v: 90 - tb, tol: 0.06, unit: ['°', '°'] } : { type: 'num', v: nX, tol: 0.0015 },
        hint: [askRefr ? 'At Brewster\'s angle the reflected and refracted rays are perpendicular.' : 'Brewster: $n = \\tan\\theta_B$ when the first medium is air.', askRefr ? 'ブリュースター角では反射光と屈折光が直交します。' : '第一の媒質が空気なら、ブリュースターの条件は $n = \\tan\\theta_B$ です。'],
        sol: askRefr ? [['Reflected ray at $\\theta_B$ above the surface normal and refracted ray at $\\theta_t$ below it are perpendicular, so $\\theta_B + \\theta_t = 90^\\circ$.', '反射光と屈折光が直交するので $\\theta_B + \\theta_t = 90^\\circ$ です。'], [`$\\theta_t = 90^\\circ - ${n(tb)}^\\circ = ${n(90 - tb, 3)}^\\circ$. Snell's law agrees: $\\sin\\theta_B = n\\cos\\theta_B$ is exactly $\\tan\\theta_B = n$.`, `$\\theta_t = 90^\\circ - ${n(tb)}^\\circ = ${n(90 - tb, 3)}^\\circ$ です。スネルの法則とも合います。$\\sin\\theta_B = n\\cos\\theta_B$ はまさに $\\tan\\theta_B = n$ です。`]] : [[`$n = \\tan ${n(tb)}^\\circ = ${n(nX, 4)}$.`, `$n = \\tan ${n(tb)}^\\circ = ${n(nX, 4)}$ です。`], ['Measuring Brewster\'s angle is a way to find the refractive index of an opaque-looking or very small sample from reflection alone.', 'ブリュースター角を測ると、反射だけから試料の屈折率がわかります。']],
      };
    },
  ];
})();
