'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const G = 6.674e-11, C = 299792458, MSUN = 1.989e30, RSUN = 6.957e8;
  const rsOf = (M) => 2 * G * M / (C * C);
  const ARCSEC = 180 / Math.PI * 3600;
  const snap = (x, step, lo, hi) => Math.min(hi, Math.max(lo, Math.round(x / step) * step));
  // proper radial distance from the horizon to r = x rs, in units of rs
  const ell = (x) => Math.sqrt(x * (x - 1)) + Math.log(Math.sqrt(x) + Math.sqrt(x - 1));
  const BODIES = [['the Sun', '太陽', 1], ['the Earth', '地球', 3.003e-6], ['Jupiter', '木星', 9.546e-4], ['Sagittarius A*', 'いて座 A*', 4.3e6], ['a 10 solar-mass black hole', '太陽質量の10倍のブラックホール', 10], ['M87*', 'M87*', 6.5e9]];

  /* ---------- 1. Flamm's paraboloid ---------- */
  Q['gravity-well'] = [
    (r) => {
      if (r.chance(0.5)) {
        const [name, nameJ, m] = r.pick(BODIES), rs = rsOf(m * MSUN);
        const k = rs > 1e9 ? 0 : rs > 1000 ? 1 : rs > 1 ? 2 : 3;
        const unit = [['AU', 'au'], ['km', 'km'], ['m', 'm'], ['mm', 'mm']][k];
        const val = rs / [1.496e11, 1000, 1, 1e-3][k];
        return {
          q: [`What is the Schwarzschild radius $r_s = 2GM/c^2$ of ${name} ($M = ${sig(m * MSUN, 4)}$ kg)? Answer in ${unit[0]}.`, `${nameJ}（$M = ${sig(m * MSUN, 4)}$ kg）のシュワルツシルト半径 $r_s = 2GM/c^2$ はいくつですか。${unit[1]} で答えてください。`],
          a: { type: 'num', v: val, rel: 0.01, unit },
          hint: ['$2G/c^2 = 1.485 \\times 10^{-27}$ m/kg, so the Sun\'s is about 2.95 km and it scales linearly with mass.', '$2G/c^2 = 1.485 \\times 10^{-27}$ m/kg なので、太陽ではおよそ 2.95 km で、質量に比例します。'],
          sol: [[`$r_s = 2 \\times 6.674\\times10^{-11} \\times ${sig(m * MSUN, 4)} / (2.998\\times10^{8})^2 = ${sig(rs, 3)}$ m.`, `$r_s = 2 \\times 6.674\\times10^{-11} \\times ${sig(m * MSUN, 4)} / (2.998\\times10^{8})^2 = ${sig(rs, 3)}$ m です。`], [`That is $${sig(val, 3)}$ ${unit[0]}. Squeezing the whole mass inside this radius would make a black hole; the real body is ${m >= 10 ? 'already one' : 'far larger, so the embedding diagram applies only outside its surface'}.`, `$${sig(val, 3)}$ ${unit[1]} です。全質量をこの半径の内側に押し込めばブラックホールになります。${m >= 10 ? 'この天体はすでにブラックホールです。' : '実際の天体ははるかに大きいので、埋め込み図は表面の外側にだけ当てはまります。'}`]],
        };
      }
      const rs = r.pick([0.5, 1, 1.5, 2]), x = r.pick([1.25, 1.5, 2, 3, 5, 2.5, 4]);
      const z = 2 * Math.sqrt(rs * (x * rs - rs));
      return {
        q: [`On Flamm's paraboloid $z = 2\\sqrt{r_s(r - r_s)}$ with $r_s = ${n(rs)}$, how high is the ring at $r = ${n(x)}r_s$?`, `$r_s = ${n(rs)}$ のフラムの放物面 $z = 2\\sqrt{r_s(r - r_s)}$ で、$r = ${n(x)}r_s$ の輪の高さはいくつですか。`],
        a: { type: 'num', v: z },
        hint: ['Substitute $r = ' + n(x * rs) + '$ directly.', `$r = ${n(x * rs)}$ をそのまま代入します。`],
        sol: [[`$r - r_s = ${n(x * rs - rs)}$, so $z = 2\\sqrt{${n(rs)} \\times ${n(x * rs - rs)}} = ${n(z, 4)}$.`, `$r - r_s = ${n(x * rs - rs)}$ なので $z = 2\\sqrt{${n(rs)} \\times ${n(x * rs - rs)}} = ${n(z, 4)}$ です。`], ['The height has no physical meaning by itself; what matters is the length measured along the surface, which is the proper distance.', '高さそのものに物理的な意味はありません。意味をもつのは曲面に沿って測った長さ、つまり固有距離です。']],
        set: { radius: rs, distance: x },
      };
    },
    (r) => {
      if (r.chance(0.6)) {
        const x = r.pick([1.5, 2, 3, 4, 5, 1.25, 2.5]), l = ell(x);
        return {
          q: [`How far is it, measured with rulers laid end to end along a radius, from the horizon to $r = ${n(x)}r_s$? Give the answer in units of $r_s$.`, `動径方向に物差しを並べて測ると、地平面から $r = ${n(x)}r_s$ までの距離はいくつですか。$r_s$ を単位として答えてください。`],
          a: { type: 'num', v: l, tol: 2e-3, unit: ['$r_s$', '$r_s$'] },
          hint: ['$\\int_{r_s}^{r} dr/\\sqrt{1 - r_s/r} = \\sqrt{r(r - r_s)} + r_s\\ln\\dfrac{\\sqrt r + \\sqrt{r - r_s}}{\\sqrt{r_s}}$.', '$\\int_{r_s}^{r} dr/\\sqrt{1 - r_s/r} = \\sqrt{r(r - r_s)} + r_s\\ln\\dfrac{\\sqrt r + \\sqrt{r - r_s}}{\\sqrt{r_s}}$ です。'],
          sol: [[`With $x = ${n(x)}$: $\\sqrt{x(x - 1)} = ${n(Math.sqrt(x * (x - 1)), 4)}$ and $\\ln(\\sqrt x + \\sqrt{x - 1}) = ${n(Math.log(Math.sqrt(x) + Math.sqrt(x - 1)), 4)}$.`, `$x = ${n(x)}$ で $\\sqrt{x(x - 1)} = ${n(Math.sqrt(x * (x - 1)), 4)}$、$\\ln(\\sqrt x + \\sqrt{x - 1}) = ${n(Math.log(Math.sqrt(x) + Math.sqrt(x - 1)), 4)}$ です。`], [`$\\ell = ${n(l, 4)}\\,r_s$, against a coordinate difference of only $${n(x - 1)}\\,r_s$.`, `$\\ell = ${n(l, 4)}\\,r_s$ で、座標の差 $${n(x - 1)}\\,r_s$ よりも長くなります。`], ['Space near the hole has more room radially than the circumferences suggest: that excess is exactly what the funnel shape of the surface draws.', 'ブラックホールの近くでは、円周から想像されるより動径方向に多くの空間があります。その余分を描いているのが曲面の漏斗の形です。']],
          set: { radius: 1, distance: x },
        };
      }
      const x = r.pick([1.25, 1.5, 2, 3, 5, 4]), s = Math.sqrt(1 / (x - 1));
      return {
        q: [`How steep is Flamm's paraboloid at $r = ${n(x)}r_s$? Give the slope $dz/dr$.`, `$r = ${n(x)}r_s$ でのフラムの放物面の傾き $dz/dr$ はいくつですか。`],
        a: { type: 'num', v: s },
        hint: ['Differentiate $z = 2\\sqrt{r_s(r - r_s)}$.', '$z = 2\\sqrt{r_s(r - r_s)}$ を微分します。'],
        sol: [[`$dz/dr = \\sqrt{r_s/(r - r_s)} = \\sqrt{1/${n(x - 1)}} = ${n(s, 4)}$.`, `$dz/dr = \\sqrt{r_s/(r - r_s)} = \\sqrt{1/${n(x - 1)}} = ${n(s, 4)}$ です。`], [`A ruler along the surface is longer than its shadow on the plane by $\\sqrt{1 + (dz/dr)^2} = 1/\\sqrt{1 - r_s/r} = ${n(Math.sqrt(1 + s * s), 4)}$, which is the factor in the proper-distance integral.`, `曲面に沿った物差しは平面への影より $\\sqrt{1 + (dz/dr)^2} = 1/\\sqrt{1 - r_s/r} = ${n(Math.sqrt(1 + s * s), 4)}$ 倍長く、これが固有距離の積分に現れる因子です。`]],
        set: { radius: 1, distance: x },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['Write the proper radial distance from the horizon to $r = x\\,r_s$, in units of $r_s$, as a function of $x$.', '地平面から $r = x\\,r_s$ までの固有動径距離を、$r_s$ を単位として $x$ の関数で書いてください。'],
          a: { type: 'expr', v: 'sqrt(x*(x-1))+ln(sqrt(x)+sqrt(x-1))', vars: ['x'], dom: { x: [1.2, 5] }, lhs: ['$\\ell(x)/r_s =$', '$\\ell(x)/r_s =$'] },
          hint: ['Substitute $r = r_s\\cosh^2 u$ in $\\int dr/\\sqrt{1 - r_s/r}$.', '$\\int dr/\\sqrt{1 - r_s/r}$ に $r = r_s\\cosh^2 u$ を代入します。'],
          sol: [['With $r = r_s\\cosh^2 u$, $dr = 2r_s\\cosh u\\sinh u\\,du$ and $\\sqrt{1 - r_s/r} = \\tanh u$, so the integrand becomes $2r_s\\cosh^2 u$.', '$r = r_s\\cosh^2 u$ とおくと $dr = 2r_s\\cosh u\\sinh u\\,du$、$\\sqrt{1 - r_s/r} = \\tanh u$ なので、被積分関数は $2r_s\\cosh^2 u$ になります。'], ['$\\int_0^{U} 2\\cosh^2 u\\,du = U + \\sinh U\\cosh U$ with $\\cosh U = \\sqrt x$: $\\ell/r_s = \\sqrt{x(x - 1)} + \\ln(\\sqrt x + \\sqrt{x - 1})$.', '$\\cosh U = \\sqrt x$ として $\\int_0^{U} 2\\cosh^2 u\\,du = U + \\sinh U\\cosh U$ なので、$\\ell/r_s = \\sqrt{x(x - 1)} + \\ln(\\sqrt x + \\sqrt{x - 1})$ です。'], ['Far away $\\ell \\approx x + \\tfrac12\\ln x$: the excess over the coordinate difference keeps growing, but only logarithmically.', '遠方では $\\ell \\approx x + \\tfrac12\\ln x$ で、座標の差に対する余分は増え続けますが、対数的にしか増えません。']],
        };
      }
      if (form === 1) {
        const s = r.pick([1, 2, 0.5, Math.sqrt(2), 1 / Math.sqrt(3), 4 / 3]), x = 1 + 1 / (s * s);
        const sT = { 1: '1', 2: '2', 0.5: '\\tfrac12' }[s] || (Math.abs(s - Math.SQRT2) < 1e-9 ? '\\sqrt2' : Math.abs(s - 1 / Math.sqrt(3)) < 1e-9 ? '1/\\sqrt3' : '\\tfrac43');
        return {
          q: [`At what radius $r/r_s$ is Flamm's paraboloid inclined with slope $dz/dr = ${sT}$?`, `フラムの放物面の傾きが $dz/dr = ${sT}$ になるのは、どの半径 $r/r_s$ ですか。`],
          a: { type: 'num', v: x, tol: 1e-3 },
          hint: ['$dz/dr = \\sqrt{r_s/(r - r_s)}$; invert it.', '$dz/dr = \\sqrt{r_s/(r - r_s)}$ を逆に解きます。'],
          sol: [[`$s^2 = r_s/(r - r_s)$ gives $r/r_s = 1 + 1/s^2 = 1 + ${n(1 / (s * s), 4)} = ${n(x, 4)}$.`, `$s^2 = r_s/(r - r_s)$ から $r/r_s = 1 + 1/s^2 = 1 + ${n(1 / (s * s), 4)} = ${n(x, 4)}$ です。`], ['The surface is vertical at the horizon and flattens like $1/\\sqrt r$ far away, so space is nearly Euclidean a few $r_s$ out.', '曲面は地平面で垂直になり、遠方では $1/\\sqrt r$ のように平らになるので、数 $r_s$ 離れれば空間はほぼユークリッド的です。']],
          set: x <= 5 ? { radius: 1, distance: snap(x, 0.05, 1.05, 5) } : undefined,
        };
      }
      const a = r.pick([1.5, 2, 3]), b = r.pick([3, 4, 5].filter((y) => y > a)), d = ell(b) - ell(a);
      return {
        q: [`Two spherical shells around a black hole have circumferences $2\\pi \\times ${n(a)}r_s$ and $2\\pi \\times ${n(b)}r_s$. How far apart are they, measured radially? Give $\\ell/r_s$, and compare with $${n(b - a)}$.`, `ブラックホールを囲む2つの球殻の円周が $2\\pi \\times ${n(a)}r_s$ と $2\\pi \\times ${n(b)}r_s$ です。動径方向に測った間隔 $\\ell/r_s$ はいくつですか。$${n(b - a)}$ と比べてください。`],
        a: { type: 'num', v: d, tol: 2e-3 },
        hint: ['Subtract the two proper distances from the horizon.', '地平面からの2つの固有距離を引き算します。'],
        sol: [[`$\\ell(${n(b)}) = ${n(ell(b), 4)}$ and $\\ell(${n(a)}) = ${n(ell(a), 4)}$, both in $r_s$.`, `$\\ell(${n(b)}) = ${n(ell(b), 4)}$、$\\ell(${n(a)}) = ${n(ell(a), 4)}$ で、どちらも $r_s$ 単位です。`], [`Separation $${n(d, 4)}\\,r_s$, which is $${n((d / (b - a) - 1) * 100, 3)}\\%$ more than the $${n(b - a)}\\,r_s$ a flat-space geometer would infer from the circumferences.`, `間隔は $${n(d, 4)}\\,r_s$ で、平らな空間の幾何で円周から推定される $${n(b - a)}\\,r_s$ より $${n((d / (b - a) - 1) * 100, 3)}\\%$ 長くなります。`]],
        set: { radius: 1, distance: b },
      };
    },
  ];

  /* ---------- 2. Gravitational time dilation ---------- */
  Q['time-dilation'] = [
    (r) => {
      const x = r.pick([1.25, 2, 4, 5, 1.5, 3, 8]), f = Math.sqrt(1 - 1 / x);
      if (r.chance(0.6)) {
        return {
          q: [`A clock is held at rest at $r = ${n(x)}r_s$. How fast does it run compared with a clock far away? Give $d\\tau/dt$.`, `時計を $r = ${n(x)}r_s$ に静止させます。遠方の時計と比べてどれだけの速さで進みますか。$d\\tau/dt$ を答えてください。`],
          a: { type: 'num', v: f },
          hint: ['$d\\tau/dt = \\sqrt{1 - r_s/r}$.', '$d\\tau/dt = \\sqrt{1 - r_s/r}$ です。'],
          sol: [[`$d\\tau/dt = \\sqrt{1 - 1/${n(x)}} = \\sqrt{${n(1 - 1 / x, 4)}} = ${n(f, 4)}$.`, `$d\\tau/dt = \\sqrt{1 - 1/${n(x)}} = \\sqrt{${n(1 - 1 / x, 4)}} = ${n(f, 4)}$ です。`], [`For every hour far away it advances $${n(60 * f, 3)}$ minutes.`, `遠方の1時間ごとに $${n(60 * f, 3)}$ 分だけ進みます。`]],
          set: { distance: x },
        };
      }
      return {
        q: [`Light leaves a static source at $r = ${n(x)}r_s$ and is received far away. What is $1 + z$, the ratio of received to emitted wavelength?`, `$r = ${n(x)}r_s$ に静止した光源から出た光を遠方で受け取ります。受信波長と放射波長の比 $1 + z$ はいくつですか。`],
        a: { type: 'num', v: 1 / f },
        hint: ['The wave crests are counted by clocks at each end; the ratio is the inverse of the clock rate.', '波の山はそれぞれの場所の時計で数えます。比は時計の進み方の逆数です。'],
        sol: [[`$1 + z = 1/\\sqrt{1 - r_s/r} = 1/${n(f, 4)} = ${n(1 / f, 4)}$.`, `$1 + z = 1/\\sqrt{1 - r_s/r} = 1/${n(f, 4)} = ${n(1 / f, 4)}$ です。`], ['The light is redshifted on the way out; at the horizon $1 + z$ would be infinite.', '光は外へ出る途中で赤方偏移します。地平面では $1 + z$ は無限大になります。']],
        set: { distance: x },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = r.pick([1.5, 2, 3, 4, 1.1, 1.05]), lost = 60 * (1 - Math.sqrt(1 - 1 / x));
        return {
          q: [`A clock hovers at $r = ${n(x)}r_s$. How many minutes does it lose for every hour that passes far away?`, `時計が $r = ${n(x)}r_s$ で静止しています。遠方で1時間経つごとに何分遅れますか。`],
          a: { type: 'num', v: lost, tol: 0.01, unit: ['min', '分'] },
          hint: ['Lost fraction is $1 - \\sqrt{1 - r_s/r}$.', '遅れる割合は $1 - \\sqrt{1 - r_s/r}$ です。'],
          sol: [[`$\\sqrt{1 - 1/${n(x)}} = ${n(Math.sqrt(1 - 1 / x), 4)}$.`, `$\\sqrt{1 - 1/${n(x)}} = ${n(Math.sqrt(1 - 1 / x), 4)}$ です。`], [`Lost: $60 \\times (1 - ${n(Math.sqrt(1 - 1 / x), 4)}) = ${n(lost, 3)}$ minutes per hour.`, `遅れは $60 \\times (1 - ${n(Math.sqrt(1 - 1 / x), 4)}) = ${n(lost, 3)}$ 分／時間です。`]],
          set: { distance: x },
        };
      }
      if (form === 1) {
        const R = 6.371e6, rr = r.pick([[2.6561e7, 'a GPS satellite orbit', 'GPS 衛星の軌道'], [4.2164e7, 'geostationary orbit', '静止軌道'], [6.771e6, 'the International Space Station orbit', '国際宇宙ステーションの軌道']]);
        const GM = 3.986e14, gain = GM / (C * C) * (1 / R - 1 / rr[0]) * 86400 * 1e6;
        return {
          q: [`Using the weak-field rate $1 - GM/(rc^2)$ with $GM_\\oplus = 3.986\\times10^{14}$ m³/s², how many microseconds per day does a clock at ${rr[1]} ($r = ${sig(rr[0] / 1000, 5)}$ km) gain over one on the ground ($R = 6371$ km), from gravity alone?`, `弱重力場の進み方 $1 - GM/(rc^2)$ と $GM_\\oplus = 3.986\\times10^{14}$ m³/s² を使うと、${rr[2]}（$r = ${sig(rr[0] / 1000, 5)}$ km）の時計は地上（$R = 6371$ km）の時計より、重力の効果だけで1日あたり何マイクロ秒進みますか。`],
          a: { type: 'num', v: gain, rel: 0.01, unit: ['µs', 'µs'] },
          hint: ['Subtract the two rates: $\\frac{GM}{c^2}\\left(\\frac1R - \\frac1r\\right)$, then multiply by 86 400 s.', '2つの進み方の差 $\\frac{GM}{c^2}\\left(\\frac1R - \\frac1r\\right)$ を求め、86 400 s を掛けます。'],
          sol: [[`$GM/c^2 = ${sig(GM / (C * C), 4)}$ m. $1/R - 1/r = ${sig(1 / R - 1 / rr[0], 4)}$ m⁻¹.`, `$GM/c^2 = ${sig(GM / (C * C), 4)}$ m、$1/R - 1/r = ${sig(1 / R - 1 / rr[0], 4)}$ m⁻¹ です。`], [`Rate difference $${sig(gain / 86400 / 1e6, 3)}$, times 86 400 s: $${sig(gain, 3)}\\ \\mu$s per day.`, `進み方の差は $${sig(gain / 86400 / 1e6, 3)}$ で、86 400 s を掛けると1日あたり $${sig(gain, 3)}\\ \\mu$s です。`], ['The orbiting clock runs fast because it sits higher in the potential. For GPS this is partly offset by the speed effect of special relativity, and both are corrected in the satellites.', '軌道上の時計はポテンシャルの高い所にあるので速く進みます。GPS ではこれが特殊相対論の速さの効果で一部打ち消され、両方とも衛星側で補正されています。']],
        };
      }
      const [name, nameJ, M, R] = r.pick([['a neutron star', '中性子星', 1.4, 12e3], ['a heavy neutron star', '重い中性子星', 2.0, 12.5e3], ['a white dwarf', '白色矮星', 0.6, 8.7e6], ['the Sun', '太陽', 1, RSUN]]);
      const rs = rsOf(M * MSUN), z1 = 1 / Math.sqrt(1 - rs / R);
      return {
        q: [`Light leaves the surface of ${name} ($M = ${M}M_\\odot$, $R = ${sig(R / 1000, 4)}$ km). What is its gravitational redshift $z$ when it reaches a distant telescope?`, `${nameJ}（$M = ${M}M_\\odot$、$R = ${sig(R / 1000, 4)}$ km）の表面から出た光が遠方の望遠鏡に届きます。重力赤方偏移 $z$ はいくつですか。`],
        a: { type: 'num', v: z1 - 1, rel: 0.01 },
        hint: ['Compute $r_s$ first ($2.95$ km per solar mass), then $1 + z = 1/\\sqrt{1 - r_s/R}$.', 'まず $r_s$（太陽質量あたり $2.95$ km）を求め、次に $1 + z = 1/\\sqrt{1 - r_s/R}$ を計算します。'],
        sol: [[`$r_s = ${sig(rs / 1000, 4)}$ km, so $r_s/R = ${sig(rs / R, 4)}$.`, `$r_s = ${sig(rs / 1000, 4)}$ km なので $r_s/R = ${sig(rs / R, 4)}$ です。`], [`$1 + z = 1/\\sqrt{1 - ${sig(rs / R, 4)}} = ${n(z1, 6)}$, so $z = ${sig(z1 - 1, 3)}$.`, `$1 + z = 1/\\sqrt{1 - ${sig(rs / R, 4)}} = ${n(z1, 6)}$ なので $z = ${sig(z1 - 1, 3)}$ です。`], [rs / R > 0.1 ? 'A redshift this large shifts X-ray absorption lines measurably, one way to weigh neutron stars.' : 'Tiny, but measured: the solar and white-dwarf redshifts were early tests of general relativity.', rs / R > 0.1 ? 'これほど大きな赤方偏移は X 線の吸収線を測定できるほどずらし、中性子星の質量を測る方法の一つになります。' : 'ごく小さいですが測定されています。太陽や白色矮星の赤方偏移は一般相対論の初期の検証でした。']],
        set: rs / R > 0.13 ? { distance: snap(R / rs, 0.05, 1.05, 8) } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const f = r.pick([0.5, 0.6, 0.8, 0.9, 0.75, 0.3]), x = 1 / (1 - f * f);
        return {
          q: [`At what radius $r/r_s$ must a static clock sit to run at $${n(f)}$ times the rate of a distant clock?`, `静止した時計が遠方の時計の $${n(f)}$ 倍の速さで進むのは、どの半径 $r/r_s$ ですか。`],
          a: { type: 'num', v: x, tol: 2e-3 },
          hint: ['Square $\\sqrt{1 - r_s/r} = f$ and solve.', '$\\sqrt{1 - r_s/r} = f$ を2乗して解きます。'],
          sol: [[`$1 - r_s/r = ${n(f * f)}$, so $r_s/r = ${n(1 - f * f)}$.`, `$1 - r_s/r = ${n(f * f)}$ より $r_s/r = ${n(1 - f * f)}$ です。`], [`$r/r_s = 1/${n(1 - f * f)} = ${n(x, 4)}$. ${f >= 0.8 ? 'Already a modest slowing needs you within a few $r_s$.' : 'Strong slowing needs you close to the horizon.'}`, `$r/r_s = 1/${n(1 - f * f)} = ${n(x, 4)}$ です。${f >= 0.8 ? 'ほどほどの遅れでも数 $r_s$ 以内に入る必要があります。' : '大きな遅れには地平面のすぐ近くまで行く必要があります。'}`]],
          set: x <= 8 ? { distance: snap(x, 0.05, 1.05, 8) } : undefined,
        };
      }
      if (form === 1) {
        const a = r.pick([1.5, 2, 3]), b = r.pick([4, 6, 8]), ratio = Math.sqrt(1 - 1 / a) / Math.sqrt(1 - 1 / b);
        return {
          q: [`Two static clocks hover at $r = ${n(a)}r_s$ and $r = ${n(b)}r_s$. While the outer clock advances one hour, how many minutes does the inner one advance?`, `2つの時計が $r = ${n(a)}r_s$ と $r = ${n(b)}r_s$ に静止しています。外側の時計が1時間進む間に、内側の時計は何分進みますか。`],
          a: { type: 'num', v: 60 * ratio, tol: 0.02, unit: ['min', '分'] },
          hint: ['Compare each with the far-away clock, then take the ratio.', 'それぞれを遠方の時計と比べ、その比をとります。'],
          sol: [[`Inner rate $\\sqrt{1 - 1/${n(a)}} = ${n(Math.sqrt(1 - 1 / a), 4)}$; outer rate $\\sqrt{1 - 1/${n(b)}} = ${n(Math.sqrt(1 - 1 / b), 4)}$.`, `内側の進み方は $\\sqrt{1 - 1/${n(a)}} = ${n(Math.sqrt(1 - 1 / a), 4)}$、外側は $\\sqrt{1 - 1/${n(b)}} = ${n(Math.sqrt(1 - 1 / b), 4)}$ です。`], [`Ratio $${n(ratio, 4)}$, so $${n(60 * ratio, 3)}$ minutes. Both observers agree on this, because light signals between static clocks take the same time for every cycle.`, `比は $${n(ratio, 4)}$ なので $${n(60 * ratio, 3)}$ 分です。静止した時計の間の光信号はどの周期でも同じ時間がかかるので、両方の観測者がこの値に同意します。`]],
          set: { distance: a },
        };
      }
      const x = r.pick([2, 3, 5, 8, 1.5]), ex = Math.sqrt(1 - 1 / x), wk = 1 - 0.5 / x;
      return {
        q: [`At $r = ${n(x)}r_s$, by how many percent does the weak-field estimate $1 - r_s/(2r)$ overestimate the exact clock rate $\\sqrt{1 - r_s/r}$?`, `$r = ${n(x)}r_s$ では、弱重力場の近似 $1 - r_s/(2r)$ は厳密な進み方 $\\sqrt{1 - r_s/r}$ を何パーセント過大に見積もりますか。`],
        a: { type: 'num', v: (wk / ex - 1) * 100, tol: 0.01, unit: ['%', '%'] },
        hint: ['The estimate is the first two terms of $\\sqrt{1 - u} = 1 - u/2 - u^2/8 - \\dots$ with $u = r_s/r$.', '近似は $u = r_s/r$ としたときの $\\sqrt{1 - u} = 1 - u/2 - u^2/8 - \\dots$ の最初の2項です。'],
        sol: [[`Exact: $${n(ex, 5)}$. Estimate: $1 - 1/${n(2 * x)} = ${n(wk, 5)}$.`, `厳密値 $${n(ex, 5)}$、近似値 $1 - 1/${n(2 * x)} = ${n(wk, 5)}$ です。`], [`Overestimate: $${n(wk, 5)}/${n(ex, 5)} - 1 = ${n((wk / ex - 1) * 100, 3)}\\%$.`, `過大評価は $${n(wk, 5)}/${n(ex, 5)} - 1 = ${n((wk / ex - 1) * 100, 3)}\\%$ です。`], ['The missing term $-u^2/8$ is second order, so the error falls like $1/r^2$: negligible for the Earth, large near a black hole.', '抜けている項 $-u^2/8$ は2次なので、誤差は $1/r^2$ のように減ります。地球では無視できますが、ブラックホールの近くでは大きくなります。']],
        set: { distance: x },
      };
    },
  ];

  /* ---------- 3. Light bending ---------- */
  Q['light-deflection'] = [
    (r) => {
      if (r.chance(0.6)) {
        const b = r.pick([4, 5, 8, 10, 12.5, 16, 20]), a = 2 / b;
        return {
          q: [`A light ray passes a mass with impact parameter $b = ${n(b)}r_s$. What deflection angle (in radians) does the weak-field formula $\\alpha = 2r_s/b$ predict?`, `光線が衝突パラメータ $b = ${n(b)}r_s$ で質量のそばを通ります。弱重力場の式 $\\alpha = 2r_s/b$ が予言する偏向角（ラジアン）はいくつですか。`],
          a: { type: 'num', v: a, unit: ['rad', 'rad'] },
          hint: ['$2r_s/b = 4GM/(bc^2)$; here $r_s/b$ is given directly.', '$2r_s/b = 4GM/(bc^2)$ で、ここでは $r_s/b$ が直接与えられています。'],
          sol: [[`$\\alpha = 2/${n(b)} = ${n(a, 4)}$ rad $= ${n(a * 180 / Math.PI, 3)}^\\circ$.`, `$\\alpha = 2/${n(b)} = ${n(a, 4)}$ rad $= ${n(a * 180 / Math.PI, 3)}^\\circ$ です。`], [b < 10 ? 'This close the true angle is noticeably larger; compare with the exact curve in the figure.' : 'At this distance the exact angle is within a few per cent of this.', b < 10 ? 'これほど近いと本当の角度はかなり大きくなります。図の厳密な曲線と比べてください。' : 'この距離では、厳密な角度との差は数パーセント以内です。']],
          set: { impact: b },
        };
      }
      const b = r.pick([2.2, 2.5, 2.7, 3, 4, 2.4]), cap = b < 1.5 * Math.sqrt(3);
      return {
        q: [`A light ray aimed at a black hole has impact parameter $b = ${n(b)}r_s$. Is it captured?`, `ブラックホールに向かう光線の衝突パラメータが $b = ${n(b)}r_s$ です。捕獲されますか。`],
        a: { type: 'choice', opts: [['Yes: $b < \\tfrac{3\\sqrt3}{2}r_s \\approx 2.598r_s$', 'はい。$b < \\tfrac{3\\sqrt3}{2}r_s \\approx 2.598r_s$ です'], ['No: $b > \\tfrac{3\\sqrt3}{2}r_s \\approx 2.598r_s$', 'いいえ。$b > \\tfrac{3\\sqrt3}{2}r_s \\approx 2.598r_s$ です'], ['Only if $b < r_s$, the horizon itself', '$b < r_s$、つまり地平面そのものより内側のときだけです']], v: cap ? 0 : 1 },
        hint: ['The critical impact parameter belongs to the photon sphere at $r = 1.5r_s$, not to the horizon.', '臨界衝突パラメータは地平面ではなく、$r = 1.5r_s$ の光子球に対応します。'],
        sol: [['Light orbiting on the photon sphere $r = 1.5r_s$ has $b_c = r/\\sqrt{1 - r_s/r} = 1.5/\\sqrt{1/3} = \\tfrac{3\\sqrt3}{2} \\approx 2.598$ in units of $r_s$.', '光子球 $r = 1.5r_s$ を回る光は $b_c = r/\\sqrt{1 - r_s/r} = 1.5/\\sqrt{1/3} = \\tfrac{3\\sqrt3}{2} \\approx 2.598$（$r_s$ 単位）です。'], [cap ? `$${n(b)} < 2.598$, so the ray spirals in: the black hole looks $2.6$ times larger than its horizon.` : `$${n(b)} > 2.598$, so the ray reaches a closest approach and escapes, bent.`, cap ? `$${n(b)} < 2.598$ なので光線は渦を巻いて落ち込みます。ブラックホールは地平面の $2.6$ 倍の大きさに見えます。` : `$${n(b)} > 2.598$ なので光線は最接近点を通って曲げられ、抜け出します。`]],
        set: { impact: b },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [name, nameJ, M, R] = r.pick([['the Sun', '太陽', MSUN, RSUN], ['Jupiter', '木星', 1.898e27, 7.149e7], ['the Earth', '地球', 5.972e24, 6.371e6], ['a white dwarf of $0.6M_\\odot$ and radius 8700 km', '質量 $0.6M_\\odot$、半径 8700 km の白色矮星', 0.6 * MSUN, 8.7e6]]);
        const k = r.pick([1, 2, 5]), b = k * R, a = 4 * G * M / (C * C * b) * ARCSEC;
        const mas = a < 0.01;
        return {
          q: [`Starlight passes ${name} at ${k === 1 ? 'its limb' : `$${k}$ radii from its centre`}. What is the deflection $\\alpha = 4GM/(bc^2)$ in ${mas ? 'milliarcseconds' : 'arcseconds'}?`, `星の光が${nameJ}の${k === 1 ? '縁をかすめて' : `中心から半径の $${k}$ 倍の所を`}通ります。偏向角 $\\alpha = 4GM/(bc^2)$ は何${mas ? 'ミリ秒角' : '秒角'}ですか。`],
          a: { type: 'num', v: mas ? a * 1000 : a, rel: 0.01, unit: mas ? ['mas', 'mas'] : ['″', '″'] },
          hint: ['Compute in radians, then multiply by $206\\,265$ to get arcseconds.', 'ラジアンで計算し、$206\\,265$ を掛けて秒角にします。'],
          sol: [[`$\\alpha = \\dfrac{4 \\times 6.674\\times10^{-11} \\times ${sig(M, 4)}}{${sig(b, 4)} \\times (2.998\\times10^8)^2} = ${sig(a / ARCSEC, 3)}$ rad.`, `$\\alpha = \\dfrac{4 \\times 6.674\\times10^{-11} \\times ${sig(M, 4)}}{${sig(b, 4)} \\times (2.998\\times10^8)^2} = ${sig(a / ARCSEC, 3)}$ rad です。`], [`That is $${sig(a, 3)}{}^{\\prime\\prime}$${mas ? ` $= ${sig(a * 1000, 3)}$ mas` : ''}.`, `これは $${sig(a, 3)}{}^{\\prime\\prime}$${mas ? ` $= ${sig(a * 1000, 3)}$ mas` : ''} です。`], ['Half of this comes from the bending of space and half from the bending of time; Newtonian reasoning alone gives only half.', 'この半分は空間の曲がりから、残り半分は時間の曲がりから来ます。ニュートン的な考えだけでは半分しか得られません。']],
        };
      }
      if (form === 1) {
        const b = r.pick([5, 6, 8, 10, 4, 15]), a1 = 2 / b, a2 = 2 / b + 15 * Math.PI / (16 * b * b);
        return {
          q: [`The deflection to second order is $\\alpha \\approx 2\\dfrac{r_s}{b} + \\dfrac{15\\pi}{16}\\dfrac{r_s^2}{b^2}$. At $b = ${b}r_s$, by how many degrees does the second term raise the estimate?`, `2次までの偏向角は $\\alpha \\approx 2\\dfrac{r_s}{b} + \\dfrac{15\\pi}{16}\\dfrac{r_s^2}{b^2}$ です。$b = ${b}r_s$ では、第2項は見積もりを何度増やしますか。`],
          a: { type: 'num', v: (a2 - a1) * 180 / Math.PI, rel: 0.005, unit: ['°', '°'] },
          hint: ['Evaluate the second term alone and convert radians to degrees.', '第2項だけを計算し、ラジアンを度に直します。'],
          sol: [[`Second term: $\\dfrac{15\\pi}{16 \\times ${b * b}} = ${n(a2 - a1, 5)}$ rad $= ${n((a2 - a1) * 180 / Math.PI, 4)}^\\circ$.`, `第2項：$\\dfrac{15\\pi}{16 \\times ${b * b}} = ${n(a2 - a1, 5)}$ rad $= ${n((a2 - a1) * 180 / Math.PI, 4)}^\\circ$ です。`], [`Total $${n(a2 * 180 / Math.PI, 4)}^\\circ$ against $${n(a1 * 180 / Math.PI, 4)}^\\circ$ from the first term: a ${n((a2 / a1 - 1) * 100, 3)}% correction. The figure's exact angle is larger still, since higher terms are all positive.`, `第1項の $${n(a1 * 180 / Math.PI, 4)}^\\circ$ に対して合計 $${n(a2 * 180 / Math.PI, 4)}^\\circ$ で、${n((a2 / a1 - 1) * 100, 3)}% の補正です。高次の項はすべて正なので、図の厳密な角度はさらに大きくなります。`]],
          set: { impact: b },
        };
      }
      const [name, nameJ, m] = r.pick([['the Sun, if it were squeezed into a black hole', '太陽をブラックホールまで圧縮した場合', 1], ['a 10 solar-mass black hole', '太陽質量の10倍のブラックホール', 10], ['Sagittarius A* ($4.3\\times10^6 M_\\odot$)', 'いて座 A*（$4.3\\times10^6 M_\\odot$）', 4.3e6]]);
      const rs = rsOf(m * MSUN), bc = 1.5 * Math.sqrt(3) * rs;
      const big = bc > 1e7;
      return {
        q: [`What is the critical impact parameter $b_c = \\tfrac{3\\sqrt3}{2}r_s$ for capture of light by ${name}? Answer in ${big ? 'millions of km' : 'km'}.`, `${nameJ}について、光が捕獲される臨界衝突パラメータ $b_c = \\tfrac{3\\sqrt3}{2}r_s$ はいくつですか。${big ? '百万 km' : 'km'} 単位で答えてください。`],
        a: { type: 'num', v: big ? bc / 1e9 : bc / 1000, rel: 0.01, unit: big ? ['× 10⁶ km', '× 10⁶ km'] : ['km', 'km'] },
        hint: ['Find $r_s = 2GM/c^2$ first; $b_c = 2.598\\,r_s$.', 'まず $r_s = 2GM/c^2$ を求めます。$b_c = 2.598\\,r_s$ です。'],
        sol: [[`$r_s = ${sig(rs / 1000, 4)}$ km.`, `$r_s = ${sig(rs / 1000, 4)}$ km です。`], [`$b_c = 2.598 \\times ${sig(rs / 1000, 4)} = ${sig(bc / 1000, 4)}$ km.`, `$b_c = 2.598 \\times ${sig(rs / 1000, 4)} = ${sig(bc / 1000, 4)}$ km です。`], ['This sets the size of the shadow: the dark disc imaged by the Event Horizon Telescope has radius $b_c$, not $r_s$.', 'これが影の大きさを決めます。イベント・ホライズン・テレスコープが撮像した暗い円盤の半径は $r_s$ ではなく $b_c$ です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Ms = r.pick([0.5, 1, 0.3]), DL = r.pick([2, 4, 1]) * 3.086e19, DS = 8 * 3.086e19;
        const thE = Math.sqrt(4 * G * Ms * MSUN / (C * C) * (DS - DL) / (DL * DS)) * ARCSEC * 1000;
        return {
          q: [`A star of $${Ms}M_\\odot$ at $${n(DL / 3.086e19)}$ kpc lies exactly in front of a star at $8$ kpc. What is the angular radius of the Einstein ring, $\\theta_E = \\sqrt{\\dfrac{4GM}{c^2}\\dfrac{D_{LS}}{D_LD_S}}$, in milliarcseconds?`, `$${n(DL / 3.086e19)}$ kpc にある $${Ms}M_\\odot$ の星が、$8$ kpc の星のちょうど手前にあります。アインシュタイン・リングの角半径 $\\theta_E = \\sqrt{\\dfrac{4GM}{c^2}\\dfrac{D_{LS}}{D_LD_S}}$ は何ミリ秒角ですか。`],
          a: { type: 'num', v: thE, rel: 0.01, unit: ['mas', 'mas'] },
          hint: ['A ray at angle $\\theta$ has $b = \\theta D_L$ and is bent by $4GM/(bc^2)$; it must hit the observer. Use $D_{LS} = D_S - D_L$ and 1 kpc $= 3.086\\times10^{19}$ m.', '角度 $\\theta$ の光線は $b = \\theta D_L$ で、$4GM/(bc^2)$ だけ曲げられて観測者に届く必要があります。$D_{LS} = D_S - D_L$、1 kpc $= 3.086\\times10^{19}$ m を使います。'],
          sol: [[`$4GM/c^2 = ${sig(4 * G * Ms * MSUN / (C * C), 4)}$ m and $D_{LS}/(D_LD_S) = ${sig((DS - DL) / (DL * DS), 4)}$ m⁻¹.`, `$4GM/c^2 = ${sig(4 * G * Ms * MSUN / (C * C), 4)}$ m、$D_{LS}/(D_LD_S) = ${sig((DS - DL) / (DL * DS), 4)}$ m⁻¹ です。`], [`$\\theta_E = ${sig(thE / ARCSEC / 1000, 3)}$ rad $= ${sig(thE, 3)}$ mas.`, `$\\theta_E = ${sig(thE / ARCSEC / 1000, 3)}$ rad $= ${sig(thE, 3)}$ mas です。`], ['Far too small to resolve, but as the lens drifts across, the two images brighten the source: microlensing, used to find dark objects and planets.', '分解するには小さすぎますが、レンズ天体が横切ると2つの像が光源を明るくします。これがマイクロレンズ現象で、暗い天体や惑星の探索に使われます。']],
        };
      }
      if (form === 1) {
        const target = r.pick([1, 0.5, 0.1, 0.01]), b = 4 * G * MSUN / (C * C * (target / ARCSEC));
        return {
          q: [`At what distance from the Sun's centre, in solar radii, is starlight deflected by $${n(target)}''$ (weak field)?`, `太陽の中心からどれだけの距離（太陽半径の単位）を通る星の光が、$${n(target)}''$ だけ曲げられますか（弱重力場）。`],
          a: { type: 'num', v: b / RSUN, rel: 0.01, unit: ['$R_\\odot$', '$R_\\odot$'] },
          hint: ['Invert $\\alpha = 4GM/(bc^2)$; at the limb $\\alpha = 1.75\\,\'\'$.', '$\\alpha = 4GM/(bc^2)$ を逆に解きます。縁では $\\alpha = 1.75\\,\'\'$ です。'],
          sol: [['Since $\\alpha \\propto 1/b$ and $\\alpha = 1.751\'\'$ at $b = R_\\odot$:', '$\\alpha \\propto 1/b$ で、$b = R_\\odot$ では $\\alpha = 1.751\'\'$ なので、'], [`$b = R_\\odot \\times 1.751/${n(target)} = ${sig(b / RSUN, 3)}\\,R_\\odot$${b / RSUN > 200 ? `, about $${sig(b / 1.496e11, 3)}$ AU` : ''}.`, `$b = R_\\odot \\times 1.751/${n(target)} = ${sig(b / RSUN, 3)}\\,R_\\odot$${b / RSUN > 200 ? `（約 $${sig(b / 1.496e11, 3)}$ au）` : ''} です。`], ['The bending falls off only as $1/b$, which is why astrometric satellites must correct for the Sun even far from it.', '曲がりは $1/b$ でしか減らないので、位置天文衛星は太陽から遠く離れた方向でもその補正が必要です。']],
        };
      }
      const k = r.pick([2, 4, 8]);
      return {
        q: [`In the weak-field regime, the impact parameter of a ray is multiplied by $${k}$. What happens to its deflection, and by how much does the error of the formula $2r_s/b$ shrink?`, `弱重力場の領域で、光線の衝突パラメータを $${k}$ 倍にします。偏向角はどうなり、式 $2r_s/b$ の誤差はどれだけ小さくなりますか。`],
        a: { type: 'choice', opts: [[`$\\alpha$ falls by $${k}$; the relative error falls by about $${k}$, the absolute error by about $${k * k}$`, `$\\alpha$ は $${k}$ 分の1、相対誤差はおよそ $${k}$ 分の1、絶対誤差はおよそ $${k * k}$ 分の1になります`], [`$\\alpha$ falls by $${k * k}$, like an inverse-square force; the error is unchanged`, `逆2乗の力のように $\\alpha$ は $${k * k}$ 分の1になり、誤差は変わりません`], [`$\\alpha$ falls by $${k}$; the relative error stays the same, since both terms scale alike`, `$\\alpha$ は $${k}$ 分の1になり、両方の項が同じように変わるので相対誤差は変わりません`]], v: 0 },
        hint: ['The next term in the expansion is proportional to $(r_s/b)^2$.', '展開の次の項は $(r_s/b)^2$ に比例します。'],
        sol: [[`Leading term: $2r_s/b$, so $\\alpha$ falls by $${k}$.`, `第1項は $2r_s/b$ なので、$\\alpha$ は $${k}$ 分の1になります。`], [`The error is the next term, $\\tfrac{15\\pi}{16}(r_s/b)^2$: it falls by $${k * k}$, and relative to $\\alpha$ by $${k}$. This is why the formula is excellent for the Sun ($r_s/b \\approx 4\\times10^{-6}$) and useless near a black hole.`, `誤差は次の項 $\\tfrac{15\\pi}{16}(r_s/b)^2$ なので $${k * k}$ 分の1、$\\alpha$ に対する比では $${k}$ 分の1になります。太陽（$r_s/b \\approx 4\\times10^{-6}$）ではこの式が非常によく、ブラックホールの近くでは役に立たないのはこのためです。`]],
        set: { impact: 5 * k <= 20 ? 5 * k : 20 },
      };
    },
  ];
})();
