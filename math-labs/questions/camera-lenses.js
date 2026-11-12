'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const FS = [24, 35, 50, 85, 135], NS = [1.4, 1.8, 2, 2.8, 4, 5.6, 8, 11, 16, 22], C = 0.03;
  const M = ['m', 'm'], MM = ['mm', 'mm'], UM = ['µm', 'µm（マイクロメートル）'];

  Q['lens-depth-of-field'] = [
    (r) => {
      const fi = r.int(0, 4), ni = r.int(0, 9), f = FS[fi], N = NS[ni], form = r.int(0, 1);
      if (form === 0) return {
        q: [`What is the diameter of the aperture of a $${f}$ mm lens set to $f/${N}$, in millimetres?`, `$${f}$ mm のレンズを $f/${N}$ にしたとき、絞りの直径は何ミリメートルですか。`],
        a: { type: 'num', v: f / N, rel: 0.01, unit: MM }, hint: ['The f-number is focal length divided by aperture diameter.', 'F 値は、焦点距離を絞りの直径で割ったものです。'],
        sol: [[`$D = f/N = ${f}/${N} = ${n(f / N, 1)}$ mm.`, `$D = f/N = ${f}/${N} = ${n(f / N, 1)}$ mm です。`], ['Each full stop (a factor of $\\sqrt2$ in $N$) halves the area and so the light.', '1 段（$N$ が $\\sqrt2$ 倍）ごとに面積が半分になり、光の量も半分になります。']], set: { f: fi, N: ni },
      };
      const s = r.pick([0.5, 0.8, 1, 1.5, 2, 3, 5]), v = (s * 1000 * f) / (s * 1000 - f);
      return {
        q: [`A $${f}$ mm lens is focused on a subject $${n(s, 1)}$ m away. How far behind the lens is the sharp image, in millimetres?`, `$${f}$ mm のレンズを $${n(s, 1)}$ m 先の被写体に合わせます。鮮明な像はレンズの何ミリメートル後ろにできますか。`],
        a: { type: 'num', v, rel: 0.005, unit: MM }, hint: ['$1/s + 1/v = 1/f$, with everything in millimetres.', '$1/s + 1/v = 1/f$ を、すべてミリメートルで使います。'],
        sol: [[`$v = sf/(s-f) = ${n(s * 1000, 0)}\\times${f}/(${n(s * 1000, 0)}-${f})$.`, `$v = sf/(s-f) = ${n(s * 1000, 0)}\\times${f}/(${n(s * 1000, 0)}-${f})$ です。`], [`$v = ${n(v, 2)}$ mm, which is $${n(v - f, 2)}$ mm further back than for a subject at infinity.`, `$v = ${n(v, 2)}$ mm で、無限遠の被写体のときより $${n(v - f, 2)}$ mm 後ろです。`]], set: { f: fi, ls: Math.log10(s) },
      };
    },
    (r) => {
      const fi = r.int(0, 4), ni = r.int(1, 9), f = FS[fi], N = NS[ni], H = (f * f) / (N * C) + f;
      return {
        q: [`Find the hyperfocal distance, in metres, of a $${f}$ mm lens at $f/${N}$, taking the circle of confusion as $0.03$ mm.`, `錯乱円を $0.03$ mm として、$${f}$ mm のレンズの $f/${N}$ での過焦点距離をメートルで求めてください。`],
        a: { type: 'num', v: H / 1000, rel: 0.01, unit: M }, hint: ['$H = f^2/(Nc) + f$.', '$H = f^2/(Nc) + f$ です。'],
        sol: [[`$f^2/(Nc) = ${f * f}/(${N}\\times0.03) = ${n((f * f) / (N * C), 0)}$ mm.`, `$f^2/(Nc) = ${f * f}/(${N}\\times0.03) = ${n((f * f) / (N * C), 0)}$ mm です。`], [`Adding $f$: $H = ${n(H / 1000, 2)}$ m. Focused there, the lens is sharp from $${n(H / 2000, 2)}$ m to infinity.`, `$f$ を足して $H = ${n(H / 1000, 2)}$ m です。ここに合わせると、$${n(H / 2000, 2)}$ m から無限遠まで鮮明です。`]], set: { f: fi, N: ni, ls: Math.min(2, Math.log10(H / 1000)) },
      };
    },
    (r) => {
      const fi = r.int(1, 4), ni = r.int(0, 6), f = FS[fi], N = NS[ni], H = (f * f) / (N * C) + f, s = r.pick([1.5, 2, 3, 4, 5]) * 1000, form = r.int(0, 1);
      const near = (s * (H - f)) / (H + s - 2 * f), far = (s * (H - f)) / (H - s);
      if (s >= H * 0.8) { const s2 = 1500, n2 = (s2 * (H - f)) / (H + s2 - 2 * f); return {
        q: [`A $${f}$ mm lens at $f/${N}$ ($c = 0.03$ mm) is focused at $1.5$ m. What is the nearest distance that is still acceptably sharp, in metres?`, `$${f}$ mm のレンズを $f/${N}$（$c = 0.03$ mm）にして $1.5$ m に合わせます。鮮明に見える最も近い距離は何メートルですか。`],
        a: { type: 'num', v: n2 / 1000, rel: 0.005, unit: M }, hint: ['$D_{\\rm near} = s(H-f)/(H+s-2f)$.', '$D_{\\rm near} = s(H-f)/(H+s-2f)$ です。'],
        sol: [[`$H = ${n(H, 0)}$ mm.`, `$H = ${n(H, 0)}$ mm です。`], [`$D_{\\rm near} = 1500\\times${n(H - f, 0)}/${n(H + s2 - 2 * f, 0)} = ${n(n2 / 1000, 3)}$ m.`, `$D_{\\rm near} = 1500\\times${n(H - f, 0)}/${n(H + s2 - 2 * f, 0)} = ${n(n2 / 1000, 3)}$ m です。`]], set: { f: fi, N: ni, ls: Math.log10(1.5) },
      }; }
      return form === 0 ? {
        q: [`A $${f}$ mm lens at $f/${N}$ ($c = 0.03$ mm) is focused at $${n(s / 1000, 1)}$ m. How deep is the zone of acceptable sharpness, in metres?`, `$${f}$ mm のレンズを $f/${N}$（$c = 0.03$ mm）にして $${n(s / 1000, 1)}$ m に合わせます。鮮明に見える範囲の深さは何メートルですか。`],
        a: { type: 'num', v: (far - near) / 1000, rel: 0.02, unit: M }, hint: ['Find $H$, then both limits, then subtract.', '$H$ を求め、二つの限界を求めて、引き算します。'],
        sol: [[`$H = ${n(H, 0)}$ mm, so $D_{\\rm near} = ${n(near / 1000, 3)}$ m and $D_{\\rm far} = ${n(far / 1000, 3)}$ m.`, `$H = ${n(H, 0)}$ mm なので、$D_{\\rm near} = ${n(near / 1000, 3)}$ m、$D_{\\rm far} = ${n(far / 1000, 3)}$ m です。`], [`Depth of field $= ${n((far - near) / 1000, 3)}$ m, with more of it behind the subject than in front.`, `被写界深度は $${n((far - near) / 1000, 3)}$ m で、被写体の手前より奥のほうが広くなります。`]], set: { f: fi, N: ni, ls: Math.log10(s / 1000) },
      } : (() => { const d = s * r.pick([2, 3, 5]), b = ((f * f) / (N * (s - f))) * ((d - s) / d); return {
        q: [`A $${f}$ mm lens at $f/${N}$ is focused at $${n(s / 1000, 1)}$ m. How large, in millimetres, is the blur disc of a point of light $${n(d / 1000, 1)}$ m away?`, `$${f}$ mm のレンズを $f/${N}$ にして $${n(s / 1000, 1)}$ m に合わせます。$${n(d / 1000, 1)}$ m 先にある光の点のぼけの円は、何ミリメートルになりますか。`],
        a: { type: 'num', v: b, rel: 0.02, unit: MM }, hint: ['$b = \\dfrac{f^2}{N(s-f)}\\cdot\\dfrac{|d-s|}{d}$.', '$b = \\dfrac{f^2}{N(s-f)}\\cdot\\dfrac{|d-s|}{d}$ です。'],
        sol: [[`$f^2/(N(s-f)) = ${f * f}/(${N}\\times${n(s - f, 0)}) = ${n((f * f) / (N * (s - f)), 4)}$ mm.`, `$f^2/(N(s-f)) = ${f * f}/(${N}\\times${n(s - f, 0)}) = ${n((f * f) / (N * (s - f)), 4)}$ mm です。`], [`Times $(d-s)/d = ${n((d - s) / d, 3)}$: $b = ${n(b, 3)}$ mm, ${b > C ? 'well over' : 'under'} the $0.03$ mm that reads as sharp.`, `これに $(d-s)/d = ${n((d - s) / d, 3)}$ を掛けて $b = ${n(b, 3)}$ mm です。鮮明に見える $0.03$ mm を${b > C ? '大きく上回ります' : '下回ります'}。`]], set: { f: fi, N: ni, ls: Math.log10(s / 1000) },
      }; })();
    },
  ];

  Q['lens-cutaway'] = [
    (r) => {
      const ni = r.int(0, 9), N = NS[ni], lam = r.pick([450, 500, 550, 600, 650]), a = 2.44 * lam * 1e-3 * N;
      return {
        q: [`What is the diameter of the Airy disc, in micrometres, for light of wavelength $${lam}$ nm at $f/${N}$?`, `波長 $${lam}$ nm の光で $f/${N}$ のとき、エアリーディスクの直径は何マイクロメートルですか。`],
        a: { type: 'num', v: a, rel: 0.01, unit: UM }, hint: ['$b = 2.44\\,\\lambda N$.', '$b = 2.44\\,\\lambda N$ です。'],
        sol: [[`$2.44\\times${n(lam / 1000, 2)}\\ \\mu\\mathrm{m}\\times${N}$.`, `$2.44\\times${n(lam / 1000, 2)}\\ \\mu\\mathrm{m}\\times${N}$ を計算します。`], [`$b = ${n(a, 2)}$ µm. It depends only on the f-number and the colour, not on the focal length.`, `$b = ${n(a, 2)}$ µm です。F 値と色だけで決まり、焦点距離にはよりません。`]], set: { N: ni },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) { const s = r.pick([0.45, 0.6, 0.8, 1, 1.5, 2, 3, 5, 10]), f = r.pick([35, 50, 85]), e = (f * f) / (s * 1000 - f); return {
        q: [`A $${f}$ mm lens focuses by moving all its glass together. How far forward from its infinity position must it move to focus at $${n(s, 2)}$ m, in millimetres?`, `$${f}$ mm のレンズが、すべてのガラスを一緒に動かしてピントを合わせます。$${n(s, 2)}$ m に合わせるには、無限遠の位置から何ミリメートル前へ動かす必要がありますか。`],
        a: { type: 'num', v: e, rel: 0.01, unit: MM }, hint: ['The image distance exceeds $f$ by $f^2/(s-f)$.', '像までの距離は $f$ より $f^2/(s-f)$ だけ長くなります。'],
        sol: [[`$\\Delta = f^2/(s-f) = ${f * f}/(${n(s * 1000, 0)}-${f})$.`, `$\\Delta = f^2/(s-f) = ${f * f}/(${n(s * 1000, 0)}-${f})$ です。`], [`$\\Delta = ${n(e, 2)}$ mm. Close focus needs far more travel than distant focus, which is why the distance scale on a lens is so crowded towards infinity.`, `$\\Delta = ${n(e, 2)}$ mm です。近くに合わせるには遠くよりはるかに大きな移動が必要です。レンズの距離目盛りが無限遠の近くで詰まっているのはそのためです。`]], set: f === 50 ? { ls: Math.max(-0.35, Math.log10(s)) } : {},
      }; }
      const ni = r.int(0, 6), N = NS[ni], f = r.pick([35, 50, 85, 100]), b = (0.067 * f) / N ** 3;
      return {
        q: [`Using $b \\approx 0.067f/N^3$, estimate the spherical-aberration blur, in micrometres, of a single $${f}$ mm element at $f/${N}$.`, `$b \\approx 0.067f/N^3$ を使って、$${f}$ mm のレンズ 1 枚の $f/${N}$ での球面収差によるぼけを、マイクロメートルで見積もってください。`],
        a: { type: 'num', v: b * 1000, rel: 0.02, unit: UM }, hint: ['Cube the f-number first.', 'まず F 値を 3 乗します。'],
        sol: [[`$N^3 = ${n(N ** 3, 2)}$, so $b = 0.067\\times${f}/${n(N ** 3, 2)}$ mm.`, `$N^3 = ${n(N ** 3, 2)}$ なので、$b = 0.067\\times${f}/${n(N ** 3, 2)}$ mm です。`], [`$b = ${n(b * 1000, 1)}$ µm. One stop down ($N\\times\\sqrt2$) cuts it by $2\\sqrt2\\approx2.8$.`, `$b = ${n(b * 1000, 1)}$ µm です。1 段絞る（$N\\times\\sqrt2$）と $2\\sqrt2\\approx2.8$ 分の 1 になります。`]], set: f === 50 ? { N: ni } : {},
      };
    },
    (r) => {
      const f = r.pick([25, 35, 50, 85, 100, 135]), k = r.pick([1, 10, 20, 40, 100]), lam = 550e-6, N = ((Math.sqrt(3) * 0.067 * f) / (k * 2.44 * lam)) ** 0.25;
      return {
        q: [`A $${f}$ mm lens has spherical-aberration blur $0.067f/(${k}N^3)$ mm and diffraction blur $2.44\\lambda N$ with $\\lambda = 550$ nm. Adding the two in quadrature, at what f-number is the total smallest?`, `$${f}$ mm のレンズの球面収差によるぼけが $0.067f/(${k}N^3)$ mm、回折によるぼけが $2.44\\lambda N$（$\\lambda = 550$ nm）です。二つを二乗和の平方根で合わせるとき、合計が最小になる F 値はいくつですか。`],
        a: { type: 'num', v: N, rel: 0.03 }, hint: ['Minimise $A^2/N^6 + B^2N^2$: set the derivative to zero.', '$A^2/N^6 + B^2N^2$ を最小にします。微分を 0 と置きます。'],
        sol: [[`With $A = 0.067\\times${f}/${k} = ${n((0.067 * f) / k, 4)}$ mm and $B = 2.44\\times0.00055 = 0.001342$ mm, the derivative vanishes when $3A^2/N^8 = B^2$, so $N^4 = \\sqrt3\\,A/B$.`, `$A = 0.067\\times${f}/${k} = ${n((0.067 * f) / k, 4)}$ mm、$B = 2.44\\times0.00055 = 0.001342$ mm と置くと、微分が 0 になるのは $3A^2/N^8 = B^2$ のときで、$N^4 = \\sqrt3\\,A/B$ です。`], [`$N = (${n((Math.sqrt(3) * 0.067 * f) / (k * 2.44 * lam), 1)})^{1/4} = ${n(N, 2)}$. Better correction moves the sharpest aperture wider, but only as the fourth root.`, `$N = (${n((Math.sqrt(3) * 0.067 * f) / (k * 2.44 * lam), 1)})^{1/4} = ${n(N, 2)}$ です。補正が良くなるほど最も鮮明な絞りは開放側へ移りますが、4 乗根でしか変わりません。`]],
      };
    },
  ];

  Q['phase-detect-af'] = [
    (r) => {
      const ni = r.int(0, 8), N = NS[ni], d = r.step(0.1, 1.5, 0.1), b = d / N;
      return {
        q: [`The sensor sits $${n(d, 1)}$ mm away from the plane of sharp focus and the lens is at $f/${N}$. How wide is the blur disc of a point, in micrometres?`, `センサーがピントの合う面から $${n(d, 1)}$ mm ずれていて、レンズは $f/${N}$ です。点のぼけの円の直径は何マイクロメートルですか。`],
        a: { type: 'num', v: b * 1000, rel: 0.01, unit: UM }, hint: ['The cone of light narrows to a point at focus; its width a distance $\\delta$ away is $\\delta/N$.', '光の円錐はピント位置で一点になります。そこから $\\delta$ 離れたところでの幅は $\\delta/N$ です。'],
        sol: [[`$b = \\delta/N = ${n(d, 1)}/${N}$ mm.`, `$b = \\delta/N = ${n(d, 1)}/${N}$ mm です。`], [`$b = ${n(b * 1000, 0)}$ µm.`, `$b = ${n(b * 1000, 0)}$ µm です。`]], set: { N: ni, d },
      };
    },
    (r) => {
      const ni = r.int(0, 6), N = NS[ni], d = r.step(0.1, 1.4, 0.1), px = r.pick([3, 4, 5, 6]), sh = (0.424 * d) / N;
      return {
        q: [`At $f/${N}$ the sensor is $${n(d, 1)}$ mm from focus. By how many pixels of $${px}$ µm are the images from the two halves of the aperture displaced? Use $\\Delta x = 0.424\\,\\delta/N$.`, `$f/${N}$ で、センサーがピントから $${n(d, 1)}$ mm ずれています。開口の二つの半分が作る像は、$${px}$ µm の画素で何個分ずれますか。$\\Delta x = 0.424\\,\\delta/N$ を使ってください。`],
        a: { type: 'num', v: (sh * 1000) / px, rel: 0.02 }, hint: ['Find the displacement in micrometres, then divide by the pixel size.', 'ずれをマイクロメートルで求めてから、画素の大きさで割ります。'],
        sol: [[`$\\Delta x = 0.424\\times${n(d, 1)}/${N} = ${n(sh * 1000, 1)}$ µm.`, `$\\Delta x = 0.424\\times${n(d, 1)}/${N} = ${n(sh * 1000, 1)}$ µm です。`], [`That is $${n((sh * 1000) / px, 1)}$ pixels, and its sign says which way to drive the lens.`, `これは画素 $${n((sh * 1000) / px, 1)}$ 個分で、その符号からレンズを動かす向きが分かります。`]], set: { N: ni, d },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) { const px = r.pick([3, 4, 5, 6]), N = r.pick([1.4, 2, 2.8, 4, 5.6]), k = r.pick([0.25, 0.5, 1]), d = (k * px * N) / 424; return {
        q: [`A phase-detection system can measure a displacement as small as $${k}$ of a $${px}$ µm pixel. At $f/${N}$, what is the smallest focus error it can detect, in micrometres?`, `ある位相差検出の仕組みは、$${px}$ µm の画素の $${k}$ 個分のずれまで測れます。$f/${N}$ で検出できる最小のピントの誤差は何マイクロメートルですか。`],
        a: { type: 'num', v: d * 1000, rel: 0.02, unit: UM }, hint: ['Invert $\\Delta x = 0.424\\,\\delta/N$.', '$\\Delta x = 0.424\\,\\delta/N$ を逆に解きます。'],
        sol: [[`$\\Delta x = ${n(k * px, 2)}$ µm, so $\\delta = \\Delta x\\,N/0.424$.`, `$\\Delta x = ${n(k * px, 2)}$ µm なので、$\\delta = \\Delta x\\,N/0.424$ です。`], [`$\\delta = ${n(d * 1000, 1)}$ µm, which gives a blur of only $${n((d * 1000) / N, 1)}$ µm: finer than the sensor can show.`, `$\\delta = ${n(d * 1000, 1)}$ µm です。このときのぼけはわずか $${n((d * 1000) / N, 1)}$ µm で、センサーが写せる細かさより小さい値です。`]],
      }; }
      const nu = r.pick([10, 20, 30, 40, 50]), N = r.pick([1.4, 2, 2.8, 4, 5.6, 8]), b = 3.8317 / (Math.PI * nu), d = b * N;
      return {
        q: [`A uniform blur disc of diameter $b$ wipes out a pattern of $\\nu$ cycles per millimetre completely when $\\pi\\nu b = 3.83$, the first zero of $J_1$. At $f/${N}$, how far from focus, in millimetres, does a $${nu}$ cycles/mm pattern first vanish?`, `直径 $b$ の一様なぼけの円は、$\\pi\\nu b = 3.83$（$J_1$ の最初の零点）のとき、1 mm あたり $\\nu$ 本の模様を完全に消します。$f/${N}$ で、1 mm あたり $${nu}$ 本の模様が最初に消えるのは、ピントから何ミリメートルずれたときですか。`],
        a: { type: 'num', v: d, rel: 0.02, unit: MM }, hint: ['Find $b$ first, then use $b = \\delta/N$.', 'まず $b$ を求め、$b = \\delta/N$ を使います。'],
        sol: [[`$b = 3.83/(\\pi\\times${nu}) = ${n(b, 4)}$ mm.`, `$b = 3.83/(\\pi\\times${nu}) = ${n(b, 4)}$ mm です。`], [`$\\delta = bN = ${n(d, 3)}$ mm. Beyond this the contrast returns weakly with its light and dark bands exchanged.`, `$\\delta = bN = ${n(d, 3)}$ mm です。これを超えると、明暗が入れ替わった弱いコントラストが戻ってきます。`]],
      };
    },
  ];
})();
