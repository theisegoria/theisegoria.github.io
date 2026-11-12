'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const UM = ['µm', 'µm（マイクロメートル）'], RPM = ['rpm', 'rpm（毎分回転数）'], W = ['W', 'W（ワット）'], VV = ['V', 'V（ボルト）'];
  const DPI = [300, 600, 1200, 2400];

  Q['inkjet-dots'] = [
    (r) => {
      const i = r.int(0, 3), dpi = DPI[i], form = r.int(0, 1);
      return form === 0 ? {
        q: [`How far apart are neighbouring dots at $${dpi}$ dots per inch, in micrometres? (One inch is $25.4$ mm.)`, `$${dpi}$ dpi では、隣り合うドットの間隔は何マイクロメートルですか。（1 インチは $25.4$ mm です。）`],
        a: { type: 'num', v: 25400 / dpi, rel: 0.01, unit: UM }, hint: ['Divide the inch by the number of dots.', '1 インチをドットの数で割ります。'],
        sol: [[`$25\\,400\\ \\mu\\mathrm{m}/${dpi}$.`, `$25\\,400\\ \\mu\\mathrm{m}/${dpi}$ を計算します。`], [`$${n(25400 / dpi, 1)}$ µm; a human hair is about $70$ µm.`, `$${n(25400 / dpi, 1)}$ µm です。人の髪の毛は約 $70$ µm です。`]], set: { dpi: i },
      } : {
        q: [`How many dots are there in one square inch printed at $${dpi}$ dpi, in millions?`, `$${dpi}$ dpi で印刷した 1 平方インチには、何百万個のドットがありますか。`],
        a: { type: 'num', v: (dpi * dpi) / 1e6, rel: 0.01, unit: ['million', '百万個'] }, hint: ['Square the resolution.', '解像度を 2 乗します。'],
        sol: [[`$${dpi}^2 = ${dpi * dpi}$.`, `$${dpi}^2 = ${dpi * dpi}$ です。`], [`$${n((dpi * dpi) / 1e6, 2)}$ million: doubling the resolution quadruples the work.`, `$${n((dpi * dpi) / 1e6, 2)}$ 百万個です。解像度を 2 倍にすると、仕事は 4 倍になります。`]], set: { dpi: i },
      };
    },
    (r) => {
      const V = r.pick([1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 20, 30]), d = Math.cbrt((6000 * V) / Math.PI);
      return {
        q: [`What is the diameter, in micrometres, of a spherical ink drop of volume $${n(V, 1)}$ pL? ($1$ pL $= 1000\\ \\mu\\mathrm{m}^3$.)`, `体積 $${n(V, 1)}$ pL の球形のインクの液滴の直径は、何マイクロメートルですか。（$1$ pL $= 1000\\ \\mu\\mathrm{m}^3$）`],
        a: { type: 'num', v: d, rel: 0.01, unit: UM }, hint: ['$V = \\pi d^3/6$.', '$V = \\pi d^3/6$ です。'],
        sol: [[`$d^3 = 6V/\\pi = 6\\times${n(V * 1000, 0)}/\\pi = ${n((6000 * V) / Math.PI, 0)}\\ \\mu\\mathrm{m}^3$.`, `$d^3 = 6V/\\pi = 6\\times${n(V * 1000, 0)}/\\pi = ${n((6000 * V) / Math.PI, 0)}\\ \\mu\\mathrm{m}^3$ です。`], [`$d = ${n(d, 1)}$ µm.`, `$d = ${n(d, 1)}$ µm です。`]], set: { vol: V },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) { const i = r.int(0, 3), dpi = DPI[i], beta = r.pick([1.5, 1.8, 2, 2.2, 2.5]), need = (Math.SQRT2 * 25400) / dpi, dd = need / beta, V = (Math.PI * dd ** 3) / 6000; return {
        q: [`On paper where a drop spreads to $${n(beta, 1)}$ times its diameter, what is the smallest drop, in picolitres, whose dots leave no white on a $${dpi}$ dpi grid?`, `液滴が直径の $${n(beta, 1)}$ 倍に広がる紙の上で、$${dpi}$ dpi の格子に白を残さない最小の液滴は何ピコリットルですか。`],
        a: { type: 'num', v: V, rel: 0.04, unit: ['pL', 'pL（ピコリットル）'] }, hint: ['The dot must reach the centre of the square between four grid points: $d_{\\rm dot} = \\sqrt2\\,p$.', 'ドットは、四つの格子点の間の正方形の中心に届かなければなりません。$d_{\\rm dot} = \\sqrt2\\,p$ です。'],
        sol: [[`$p = ${n(25400 / dpi, 1)}$ µm, so the dot must be $${n(need, 1)}$ µm and the drop $${n(dd, 1)}$ µm.`, `$p = ${n(25400 / dpi, 1)}$ µm なので、ドットは $${n(need, 1)}$ µm、液滴は $${n(dd, 1)}$ µm でなければなりません。`], [`$V = \\pi d^3/6 = ${n(V * 1000, 0)}\\ \\mu\\mathrm{m}^3 = ${n(V, 2)}$ pL.`, `$V = \\pi d^3/6 = ${n(V * 1000, 0)}\\ \\mu\\mathrm{m}^3 = ${n(V, 2)}$ pL です。`]], set: { dpi: i, beta },
      }; }
      const u = r.step(0.4, 1.5, 0.1), h = r.step(0.8, 2, 0.1), v = r.step(5, 12, 1), off = (u * h) / v * 1000;
      return {
        q: [`A head moving at $${n(u, 1)}$ m/s fires drops at $${v}$ m/s across a $${n(h, 1)}$ mm gap. By how much do drops fired on the outward pass and on the return pass, from the same head position, miss each other on the paper? Answer in micrometres.`, `$${n(u, 1)}$ m/s で動くヘッドが、$${n(h, 1)}$ mm のすき間を隔てて $${v}$ m/s で液滴を打ちます。同じヘッドの位置から行きと戻りで打った液滴は、紙の上でどれだけずれますか。マイクロメートルで答えてください。`],
        a: { type: 'num', v: 2 * off, rel: 0.02, unit: UM }, hint: ['Each drop drifts $uh/v$, in opposite directions on the two passes.', '液滴は $uh/v$ だけずれ、行きと戻りで逆向きになります。'],
        sol: [[`Flight time: $${n(h, 1)}\\ \\mathrm{mm}/${v}\\ \\mathrm{m/s} = ${n((h / v) * 1000, 0)}$ µs; drift: $${n(u, 1)}\\times${n((h / v) * 1000, 0)} = ${n(off, 0)}$ µm.`, `飛行時間は $${n(h, 1)}\\ \\mathrm{mm}/${v}\\ \\mathrm{m/s} = ${n((h / v) * 1000, 0)}$ µs、ずれは $${n(u, 1)}\\times${n((h / v) * 1000, 0)} = ${n(off, 0)}$ µm です。`], [`The two passes differ by twice that: $${n(2 * off, 0)}$ µm.`, `行きと戻りの差はその 2 倍で、$${n(2 * off, 0)}$ µm です。`]], set: { u, h, vd: v },
      };
    },
  ];

  Q['laser-latent-image'] = [
    (r) => {
      const v0 = r.pick([500, 600, 700, 800]), vr = r.pick([40, 60, 80, 100]), E = r.step(0.5, 4, 0.5), V = vr + (v0 - vr) * Math.exp(-E);
      return {
        q: [`A drum charged to $${v0}$ V discharges as $V = V_r + (V_0 - V_r)e^{-E/E_0}$ with $V_r = ${vr}$ V. What is the surface voltage after an exposure of $E = ${n(E, 1)}\\,E_0$?`, `$${v0}$ V に帯電したドラムは、$V = V_r + (V_0 - V_r)e^{-E/E_0}$（$V_r = ${vr}$ V）に従って放電します。露光量 $E = ${n(E, 1)}\\,E_0$ の後の表面電圧は何ボルトですか。`],
        a: { type: 'num', v: V, rel: 0.02, unit: VV }, hint: ['Only the part above the residual decays.', '減衰するのは、残留電圧より上の部分だけです。'],
        sol: [[`$V_0 - V_r = ${v0 - vr}$ V and $e^{-${n(E, 1)}} = ${n(Math.exp(-E), 4)}$.`, `$V_0 - V_r = ${v0 - vr}$ V、$e^{-${n(E, 1)}} = ${n(Math.exp(-E), 4)}$ です。`], [`$V = ${vr} + ${v0 - vr}\\times${n(Math.exp(-E), 4)} = ${n(V, 0)}$ V.`, `$V = ${vr} + ${v0 - vr}\\times${n(Math.exp(-E), 4)} = ${n(V, 0)}$ V です。`]], set: { e: E },
      };
    },
    (r) => {
      const v0 = r.pick([600, 700, 800]), vr = r.pick([50, 60, 80]), vb = r.step(200, 450, 50), E = Math.log((v0 - vr) / (vb - vr));
      return {
        q: [`With $V = ${vr} + ${v0 - vr}\\,e^{-E/E_0}$ volts and the developer held at $${vb}$ V, what is the smallest exposure, in units of $E_0$, at which a large exposed area takes toner?`, `$V = ${vr} + ${v0 - vr}\\,e^{-E/E_0}$ ボルトで、現像器が $${vb}$ V に保たれているとき、露光した広い領域にトナーが付く最小の露光量は、$E_0$ を単位としていくつですか。`],
        a: { type: 'num', v: E, rel: 0.02 }, hint: ['Toner is taken once $V$ falls to the developer voltage.', '$V$ が現像器の電圧まで下がると、トナーが付きます。'],
        sol: [[`$${vr} + ${v0 - vr}e^{-E/E_0} = ${vb}$ gives $e^{-E/E_0} = ${n((vb - vr) / (v0 - vr), 4)}$.`, `$${vr} + ${v0 - vr}e^{-E/E_0} = ${vb}$ から $e^{-E/E_0} = ${n((vb - vr) / (v0 - vr), 4)}$ です。`], [`$E/E_0 = \\ln(${n((v0 - vr) / (vb - vr), 3)}) = ${n(E, 2)}$.`, `$E/E_0 = \\ln(${n((v0 - vr) / (vb - vr), 3)}) = ${n(E, 2)}$ です。`]], set: { bias: vb },
      };
    },
    (r) => {
      const w = r.pick([25, 30, 35, 40, 50, 60]), pix = r.pick([21.2, 42.3, 84.7]), x = Math.SQRT2 * (pix / 2) / w, frac = (() => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-a * a)); })();
      return {
        q: [`A Gaussian laser spot of $1/e^2$ radius $${w}$ µm is switched on for one pixel $${n(pix, 1)}$ µm wide. The exposure at the centre of that pixel is the fraction $\\operatorname{erf}(\\sqrt2\\,(p/2)/w)$ of the full value. Given $\\operatorname{erf}(${n(x, 3)}) = ${n(frac, 3)}$, what percentage of full exposure does the centre of a single pixel receive?`, `$1/e^2$ 半径が $${w}$ µm のガウス型のレーザースポットを、幅 $${n(pix, 1)}$ µm の 1 画素の間だけ点灯させます。その画素の中心での露光量は、最大値の $\\operatorname{erf}(\\sqrt2\\,(p/2)/w)$ 倍です。$\\operatorname{erf}(${n(x, 3)}) = ${n(frac, 3)}$ として、1 画素の中心が受ける露光量は最大値の何パーセントですか。`],
        a: { type: 'num', v: 100 * frac, rel: 0.02, unit: ['%', '%（パーセント）'] }, hint: ['Check that the argument matches, then read off the value.', '引数が合っていることを確かめて、値を読み取ります。'],
        sol: [[`$\\sqrt2\\times${n(pix / 2, 2)}/${w} = ${n(x, 3)}$, the argument given.`, `$\\sqrt2\\times${n(pix / 2, 2)}/${w} = ${n(x, 3)}$ で、与えられた引数と一致します。`], [`$${n(100 * frac, 0)}$ %: ${frac < 0.75 ? 'a single pixel is under-exposed, so isolated dots print thin or not at all' : 'nearly the full exposure'}.`, `$${n(100 * frac, 0)}$ % です。${frac < 0.75 ? '1 画素だけでは露光が不足するので、孤立した点は細く印刷されるか、まったく印刷されません' : 'ほぼ最大の露光量です'}。`]], set: { w },
      };
    },
  ];

  Q['laser-engine'] = [
    (r) => {
      const ppm = r.step(10, 60, 5), gap = r.pick([30, 40, 50]), v = (ppm * (297 + gap)) / 60;
      return {
        q: [`A printer feeds A4 sheets ($297$ mm long) with $${gap}$ mm between them at $${ppm}$ pages a minute. How fast does the paper move, in mm/s?`, `あるプリンターは、長さ $297$ mm の A4 用紙を $${gap}$ mm の間隔を空けて、毎分 $${ppm}$ 枚送ります。紙の速さは何 mm/s ですか。`],
        a: { type: 'num', v, rel: 0.01, unit: ['mm/s', 'mm/s'] }, hint: ['Each page needs its own length plus the gap.', '1 枚ごとに、用紙の長さと間隔の和が必要です。'],
        sol: [[`Per page: $${297 + gap}$ mm; per minute: $${ppm}\\times${297 + gap} = ${ppm * (297 + gap)}$ mm.`, `1 枚あたり $${297 + gap}$ mm、1 分あたり $${ppm}\\times${297 + gap} = ${ppm * (297 + gap)}$ mm です。`], [`$v = ${n(v, 1)}$ mm/s.`, `$v = ${n(v, 1)}$ mm/s です。`]], set: { ppm },
      };
    },
    (r) => {
      const v = r.step(60, 360, 20), i = r.int(0, 2), dpi = DPI[i], fi = r.int(0, 2), fac = [4, 6, 8][fi], lines = (v / 25.4) * dpi, rpm = (60 * lines) / fac;
      return {
        q: [`Paper moves at $${v}$ mm/s through a $${dpi}$ dpi laser printer whose mirror has $${fac}$ faces, with one beam. How fast must the mirror spin, in rpm?`, `$${dpi}$ dpi のレーザープリンターの中を、紙が $${v}$ mm/s で動きます。鏡の面は $${fac}$ 個で、ビームは 1 本です。鏡は何 rpm で回らなければなりませんか。`],
        a: { type: 'num', v: rpm, rel: 0.01, unit: RPM }, hint: ['Lines per second $= v\\times\\text{dpi}/25.4$; each face draws one.', '毎秒の線の数は $v\\times\\text{dpi}/25.4$ で、面一つが 1 本を描きます。'],
        sol: [[`Lines per second: $${v}/25.4\\times${dpi} = ${n(lines, 0)}$.`, `毎秒の線の数は $${v}/25.4\\times${dpi} = ${n(lines, 0)}$ です。`], [`Turns per second: $${n(lines, 0)}/${fac} = ${n(lines / fac, 0)}$, so $${n(Math.round(rpm / 10) * 10, 0)}$ rpm.`, `毎秒の回転数は $${n(lines, 0)}/${fac} = ${n(lines / fac, 0)}$ なので、$${n(Math.round(rpm / 10) * 10, 0)}$ rpm です。`]], set: { dpi: i, fac: fi },
      };
    },
    (r) => {
      const v = r.step(80, 360, 20), gsm = r.pick([64, 75, 80, 90, 100, 120]), dT = r.pick([140, 150, 160, 170]), Pw = (v / 1000) * 0.21 * (gsm / 1000) * 1340 * dT;
      return {
        q: [`Paper of $${gsm}$ g/m², $210$ mm wide, passes a fuser at $${v}$ mm/s and must be heated by $${dT}$ K. Taking the specific heat of paper as $1340$ J/(kg K), how much power goes into the paper?`, `$${gsm}$ g/m²、幅 $210$ mm の紙が、$${v}$ mm/s で定着器を通り、$${dT}$ K 温めなければなりません。紙の比熱を $1340$ J/(kg K) として、紙に入る電力は何ワットですか。`],
        a: { type: 'num', v: Pw, rel: 0.02, unit: W }, hint: ['Mass per second is speed times width times mass per area.', '毎秒の質量は、速さ掛ける幅掛ける面積あたりの質量です。'],
        sol: [[`Area per second: $${n(v / 1000, 2)}\\times0.21 = ${n((v / 1000) * 0.21, 4)}$ m²; mass per second: $${n((v / 1000) * 0.21 * gsm, 2)}$ g.`, `毎秒の面積は $${n(v / 1000, 2)}\\times0.21 = ${n((v / 1000) * 0.21, 4)}$ m²、毎秒の質量は $${n((v / 1000) * 0.21 * gsm, 2)}$ g です。`], [`$P = ${n((v / 1000) * 0.21 * (gsm / 1000), 5)}\\times1340\\times${dT} = ${n(Pw, 0)}$ W.`, `$P = ${n((v / 1000) * 0.21 * (gsm / 1000), 5)}\\times1340\\times${dT} = ${n(Pw, 0)}$ W です。`]],
      };
    },
  ];
})();
