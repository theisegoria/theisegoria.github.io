'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, TAU = 2 * PI, DEG = PI / 180, DAY = 86400, G = 9.81;
  const VPH = [18000, 21600, 25200, 28800, 36000];
  const vt = (x) => x.toLocaleString('en-US').replace(/,/g, '{,}');          // 28{,}800 in TeX
  const SD = ['s/day', '秒/日'];
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  const pm = (x, d = 2) => (x >= 0 ? '+' : '') + n(x, d);
  // Bessel J1 by its power series (fine below 12)
  function J1(x) { let s = 0, t = x / 2; for (let k = 0; k < 60; k++) { s += t; t *= -(x * x / 4) / ((k + 1) * (k + 2)); } return s; }
  const I_BAL = 1.2e-9, F0 = 4, W0 = TAU * F0;
  const poiseK = (mr) => mr * 1e-12 * G / (I_BAL * W0 * W0);   // mr in µg·mm
  const airy = (thiDeg, Adeg, Qf) => -(DAY / (2 * Qf)) * Math.tan(Math.asin(thiDeg / Adeg));

  /* ---------------- 1. balance, hairspring, timegrapher ---------------- */
  Q['balance-hairspring'] = [
    (r) => {
      const form = r.int(0, 2), i = r.int(0, 4), V = VPH[i], f = V / 7200;
      if (form === 0) return {
        q: [`A watch is marked ${V.toLocaleString('en-US')} vph (vibrations, or beats, per hour). What is the frequency of its balance in hertz?`, `ある時計の振動数は ${V.toLocaleString('en-US')} vph（1 時間あたりの振動、すなわち刻みの数）です。てんぷの振動数は何ヘルツですか。`],
        a: { type: 'num', v: f, unit: ['Hz', 'Hz'] },
        hint: ['One full oscillation of the balance makes two beats, a tic and a toc.', 'てんぷの一往復でチクとタクの二回の刻みが出ます。'],
        sol: [[`$${vt(V)}/3600 = ${n(V / 3600)}$ beats a second.`, `毎秒 $${vt(V)}/3600 = ${n(V / 3600)}$ 回の刻みです。`], [`Two beats per oscillation, so $f = ${n(V / 3600)}/2 = ${n(f)}$ Hz: the balance swings back and forth ${n(f)} times every second.`, `一往復で二回刻むので $f = ${n(V / 3600)}/2 = ${n(f)}$ Hz です。てんぷは毎秒 ${n(f)} 回往復します。`]],
        set: { vph: i },
      };
      if (form === 1) return {
        q: [`A balance oscillates at $f = ${n(f)}$ Hz. What beat rate, in vibrations per hour, would a timegrapher report?`, `てんぷが $f = ${n(f)}$ Hz で振動しています。タイムグラファーは何振動/時（vph）と表示しますか。`],
        a: { type: 'int', v: V },
        hint: ['Count beats, not oscillations, and an hour has 3600 seconds.', '往復ではなく刻みを数えます。1 時間は 3600 秒です。'],
        sol: [[`Two beats per oscillation give $2 \\times ${n(f)} = ${n(2 * f)}$ beats a second.`, `一往復で二回刻むので毎秒 $2 \\times ${n(f)} = ${n(2 * f)}$ 回です。`], [`Times 3600: $${vt(V)}$ vph, so a ${n(f)} Hz balance is a "${V.toLocaleString('en-US')}" movement.`, `3600 倍して $${vt(V)}$ vph です。${n(f)} Hz のてんぷは「${V.toLocaleString('en-US')} 振動」のムーブメントです。`]],
        set: { vph: i },
      };
      return {
        q: [`What is the period $T$ of a balance beating at ${V.toLocaleString('en-US')} vph, in seconds?`, `${V.toLocaleString('en-US')} vph で刻むてんぷの周期 $T$ は何秒ですか。`],
        a: { type: 'num', v: 1 / f, unit: ['s', '秒'] },
        hint: ['Find the frequency first: two beats make one period.', 'まず振動数を求めます。二回の刻みで一周期です。'],
        sol: [[`$f = ${vt(V)}/7200 = ${n(f)}$ Hz.`, `$f = ${vt(V)}/7200 = ${n(f)}$ Hz です。`], [`$T = 1/f = ${n(1 / f, 4)}$ s, and each beat lasts half of that, $${n(0.5 / f, 4)}$ s. A faster beat divides time more finely, which is why the seconds hand of a high-beat watch sweeps more smoothly.`, `$T = 1/f = ${n(1 / f, 4)}$ 秒で、各刻みはその半分の $${n(0.5 / f, 4)}$ 秒です。刻みが速いほど時間を細かく分けるので、ハイビートの時計の秒針はより滑らかに動きます。`]],
        set: { vph: i },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const Im = r.pick([8, 10, 12, 14, 16]), i = r.int(0, 4), f = VPH[i] / 7200, I = Im * 1e-10, k = I * (TAU * f) ** 2;
        return {
          q: [`A balance has moment of inertia $I = ${Im}\\ \\mathrm{mg\\,cm^2}$ and must oscillate at ${n(f)} Hz. What torsional stiffness $\\kappa$ must its hairspring have, in µN·m/rad?`, `慣性モーメント $I = ${Im}\\ \\mathrm{mg\\,cm^2}$ のてんぷを ${n(f)} Hz で振動させます。ひげぜんまいのねじり剛性 $\\kappa$ は何 µN·m/rad でなければなりませんか。`],
          a: { type: 'num', v: k * 1e6, unit: ['µN·m/rad', 'µN·m/rad'] },
          hint: ['$\\omega_0 = \\sqrt{\\kappa/I}$, so $\\kappa = I\\omega_0^2$. Convert mg·cm² to kg·m² first.', '$\\omega_0 = \\sqrt{\\kappa/I}$ なので $\\kappa = I\\omega_0^2$ です。まず mg·cm² を kg·m² に直します。'],
          sol: [[`$1\\ \\mathrm{mg\\,cm^2} = 10^{-6}\\ \\mathrm{kg} \\times 10^{-4}\\ \\mathrm{m^2}$, so $I = ${sig(I, 3)}\\ \\mathrm{kg\\,m^2}$.`, `$1\\ \\mathrm{mg\\,cm^2} = 10^{-6}\\ \\mathrm{kg} \\times 10^{-4}\\ \\mathrm{m^2}$ なので $I = ${sig(I, 3)}\\ \\mathrm{kg\\,m^2}$ です。`], [`$\\omega_0 = 2\\pi \\times ${n(f)} = ${n(TAU * f, 3)}$ rad/s, $\\kappa = I\\omega_0^2 = ${sig(k, 3)}$ N·m/rad $= ${n(k * 1e6, 3)}$ µN·m/rad.`, `$\\omega_0 = 2\\pi \\times ${n(f)} = ${n(TAU * f, 3)}$ rad/s、$\\kappa = I\\omega_0^2 = ${sig(k, 3)}$ N·m/rad $= ${n(k * 1e6, 3)}$ µN·m/rad です。`], ['That is less than a micronewton-metre per radian: a hairspring is a strip a few hundredths of a millimetre thick, and the whole oscillator stores only microjoules.', '1 ラジアンあたり 1 マイクロニュートンメートルにも満たない値です。ひげぜんまいは厚さ数百分の一ミリの帯で、振動子全体が蓄えるエネルギーは数マイクロジュールにすぎません。']],
          set: { vph: i },
        };
      }
      if (form === 1) {
        const Im = r.pick([9, 10, 11, 12, 13, 15]), kap = r.pick([0.45, 0.5, 0.55, 0.6, 0.7, 0.8, 0.9, 1.0]), I = Im * 1e-10, k = kap * 1e-6, T = TAU * Math.sqrt(I / k), V = 7200 / T;
        return {
          q: [`A balance of $I = ${Im}\\ \\mathrm{mg\\,cm^2}$ is fitted with a hairspring of $\\kappa = ${n(kap)}\\ \\mu\\mathrm{N\\,m/rad}$. What beat rate does the watch have, in vph?`, `$I = ${Im}\\ \\mathrm{mg\\,cm^2}$ のてんぷに $\\kappa = ${n(kap)}\\ \\mu\\mathrm{N\\,m/rad}$ のひげぜんまいを付けました。時計の振動数は何 vph ですか。`],
          a: { type: 'num', v: V, rel: 0.003, unit: ['vph', 'vph'] },
          hint: ['Period first, $T = 2\\pi\\sqrt{I/\\kappa}$; then two beats per period.', 'まず周期 $T = 2\\pi\\sqrt{I/\\kappa}$ を求め、一周期に二回刻むことを使います。'],
          sol: [[`$T = 2\\pi\\sqrt{${sig(I, 3)}/${sig(k, 3)}} = ${n(T, 4)}$ s.`, `$T = 2\\pi\\sqrt{${sig(I, 3)}/${sig(k, 3)}} = ${n(T, 4)}$ 秒です。`], [`Beats per hour $= 2 \\times 3600/T = ${n(V, 0)}$.`, `1 時間あたりの刻み $= 2 \\times 3600/T = ${n(V, 0)}$ です。`], [`A real movement would use a standard rate such as 18,000, 21,600, 25,200 or 28,800 vph, and the hairspring is chosen (vibrated) against the balance until the pair lands on it.`, `実際のムーブメントは 18,000、21,600、25,200、28,800 vph のような標準の振動数を使い、ひげぜんまいをてんぷに合わせて選んで（振動させて）、組がその値になるようにします。`]],
        };
      }
      if (form === 2) {
        let x; do { x = Math.round(r.step(-0.5, 0.5, 0.01) * 100) / 100; } while (Math.abs(x) < 0.03);
        const rate = DAY * (1 / Math.sqrt(1 + x / 1000) - 1);
        return {
          q: [`Moving the regulator index changes the active length of the hairspring by $\\Delta L/L = ${pm(x)}$‰. What is the new rate of the watch, in s/day? (Before, it kept perfect time.)`, `緩急針を動かして、ひげぜんまいの有効長さを $\\Delta L/L = ${pm(x)}$‰ 変えました。時計の新しい歩度は一日何秒ですか（変える前は正確でした）。`],
          a: { type: 'num', v: rate, tol: 0.05, unit: SD },
          hint: ['$\\kappa \\propto 1/L$ and $f \\propto \\sqrt{\\kappa}$, so $f \\propto L^{-1/2}$.', '$\\kappa \\propto 1/L$、$f \\propto \\sqrt{\\kappa}$ なので $f \\propto L^{-1/2}$ です。'],
          sol: [[`The frequency is multiplied by $1/\\sqrt{1 + ${n(x / 1000, 5)}} = ${n(1 / Math.sqrt(1 + x / 1000), 7)}$.`, `振動数は $1/\\sqrt{1 + ${n(x / 1000, 5)}} = ${n(1 / Math.sqrt(1 + x / 1000), 7)}$ 倍になります。`], [`Rate $= 86400 \\times (${n(1 / Math.sqrt(1 + x / 1000), 7)} - 1) = ${pm(rate, 2)}$ s/day, very close to $-43200\\,\\Delta L/L$.`, `歩度 $= 86400 \\times (${n(1 / Math.sqrt(1 + x / 1000), 7)} - 1) = ${pm(rate, 2)}$ 秒/日で、$-43200\\,\\Delta L/L$ にほぼ等しくなります。`], [x < 0 ? 'A shorter spring is stiffer, so the watch gains: the index has moved towards F.' : 'A longer spring is softer, so the watch loses: the index has moved towards S.', x < 0 ? 'ばねが短いほど硬いので時計は進みます。緩急針は F 側へ動いています。' : 'ばねが長いほど柔らかいので時計は遅れます。緩急針は S 側へ動いています。']],
          set: { reg: x },
        };
      }
      const Im = 12, i = r.int(0, 4), f = VPH[i] / 7200, k = Im * 1e-10 * (TAU * f) ** 2, A = r.step(200, 310, 10), Qf = r.pick([200, 250, 300]), E = 0.5 * k * (A * DEG) ** 2, Pw = TAU * f * E / Qf;
      return {
        q: [`A balance of $I = 12\\ \\mathrm{mg\\,cm^2}$ beats ${VPH[i].toLocaleString('en-US')} vph with an amplitude of ${A}° and a quality factor $Q = ${Qf}$. What power must the mainspring deliver to keep it swinging, in µW?`, `$I = 12\\ \\mathrm{mg\\,cm^2}$ のてんぷが ${VPH[i].toLocaleString('en-US')} vph、振り角 ${A}°、品質係数 $Q = ${Qf}$ で振動しています。振動を保つために主ぜんまいが出すべき仕事率は何 µW ですか。`],
        a: { type: 'num', v: Pw * 1e6, unit: ['µW', 'µW'] },
        hint: ['Energy stored $E = \\tfrac12\\kappa A^2$ with $A$ in radians; a resonator loses $2\\pi E/Q$ per cycle.', '蓄えられるエネルギーは $A$ をラジアンとして $E = \\tfrac12\\kappa A^2$ です。共振子は一周期に $2\\pi E/Q$ を失います。'],
        sol: [[`$\\kappa = I(2\\pi f)^2 = ${sig(k, 3)}$ N·m/rad and $A = ${A}° = ${n(A * DEG, 4)}$ rad.`, `$\\kappa = I(2\\pi f)^2 = ${sig(k, 3)}$ N·m/rad、$A = ${A}° = ${n(A * DEG, 4)}$ rad です。`], [`$E = \\tfrac12\\kappa A^2 = ${n(E * 1e6, 3)}\\ \\mu$J.`, `$E = \\tfrac12\\kappa A^2 = ${n(E * 1e6, 3)}\\ \\mu$J です。`], [`Power $= f \\cdot 2\\pi E/Q = \\omega_0 E/Q = ${n(Pw * 1e6, 3)}\\ \\mu$W. A watch runs for two days on a mainspring that stores about a joule, so most of the spring's energy is lost in the train and escapement, not in the balance.`, `仕事率 $= f \\cdot 2\\pi E/Q = \\omega_0 E/Q = ${n(Pw * 1e6, 3)}\\ \\mu$W です。時計は約 1 ジュールを蓄える主ぜんまいで二日動くので、ばねのエネルギーの大部分はてんぷではなく輪列と脱進機で失われます。`]],
        set: { vph: i, amp: A },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        let R; do { R = r.step(-15, 15, 0.5); } while (Math.abs(R) < 2);
        const dL = ((1 + R / DAY) ** 2 - 1) * 1000;
        const show = Math.round((1 / (1 + R / DAY) ** 2 - 1) * 1000 * 100) / 100;
        return {
          q: [`A timegrapher shows that a watch ${R > 0 ? 'gains' : 'loses'} ${n(Math.abs(R))} s/day. By what fraction $\\Delta L/L$ (in ‰, with its sign) must the regulator change the active hairspring length to bring the rate to zero?`, `タイムグラファーによると、時計が一日に ${n(Math.abs(R))} 秒${R > 0 ? '進み' : '遅れ'}ます。歩度を 0 にするには、緩急針でひげぜんまいの有効長さをどれだけ（‰、符号つき）変えればよいですか。`],
          a: { type: 'num', v: dL, tol: 0.003, unit: ['‰', '‰'] },
          hint: ['The frequency has to be divided by $1 + \\text{rate}/86400$, and $f \\propto L^{-1/2}$.', '振動数を $1 + \\text{歩度}/86400$ で割る必要があり、$f \\propto L^{-1/2}$ です。'],
          sol: [[`The balance runs ${R > 0 ? 'fast' : 'slow'} by the factor $1 + ${pn(R, 2)}/86400 = ${n(1 + R / DAY, 7)}$.`, `てんぷの振動数は本来の $1 + ${pn(R, 2)}/86400 = ${n(1 + R / DAY, 7)}$ 倍です。`], [`Since $f \\propto L^{-1/2}$, we need $\\sqrt{1 + \\Delta L/L} = ${n(1 + R / DAY, 7)}$, so $\\Delta L/L = ${n(1 + R / DAY, 7)}^2 - 1 = ${n(dL, 4)}$‰, almost exactly $2 \\times ${pn(R, 2)}/86400 = ${sig(2 * R / DAY, 3)}$.`, `$f \\propto L^{-1/2}$ なので $\\sqrt{1 + \\Delta L/L} = ${n(1 + R / DAY, 7)}$ が必要で、$\\Delta L/L = ${n(1 + R / DAY, 7)}^2 - 1 = ${n(dL, 4)}$‰ です。これは $2 \\times ${pn(R, 2)}/86400 = ${sig(2 * R / DAY, 3)}$ にほぼ等しい値です。`], [R > 0 ? 'Positive: lengthen the spring, moving the index towards S. A few hundredths of a millimetre on a spring 15 cm long are enough, which is why regulators have fine screws.' : 'Negative: shorten the spring, moving the index towards F. A few hundredths of a millimetre on a spring 15 cm long are enough, which is why regulators have fine screws.', R > 0 ? '正なので、ばねを長くする、つまり緩急針を S 側へ動かします。長さ 15 cm のばねで百分の数ミリで足りるので、緩急装置には微調整ねじが付いています。' : '負なので、ばねを短くする、つまり緩急針を F 側へ動かします。長さ 15 cm のばねで百分の数ミリで足りるので、緩急装置には微調整ねじが付いています。']],
          set: Math.abs(show) <= 0.5 ? { reg: show } : undefined,
        };
      }
      if (form === 1) {
        const mat = r.pick([['brass', '真ちゅう', 19], ['steel', '鋼', 11.5], ['nickel silver', '洋白', 18]]), e = r.pick([-240, -240, 0, 30, 40]), dT = r.pick([-15, -10, 10, 15, 20]);
        const ratio = Math.sqrt(1 + e * 1e-6 * dT) / (1 + mat[2] * 1e-6 * dT), rate = DAY * (ratio - 1);
        return {
          q: [`A watch has a ${mat[0]} balance (expansion coefficient $${mat[2]} \\times 10^{-6}$/K, so its moment of inertia grows as the square of its radius) and a hairspring whose stiffness $\\kappa$ changes by $${e}$ ppm per kelvin, all effects included. The temperature changes by $${pm(dT, 0)}$ K. What is the rate error, in s/day?`, `${mat[1]}のてんぷ（線膨張係数 $${mat[2]} \\times 10^{-6}$/K、慣性モーメントは半径の二乗で増える）と、すべての効果を含めて剛性 $\\kappa$ が 1 ケルビンあたり $${e}$ ppm 変わるひげぜんまいをもつ時計があります。温度が $${pm(dT, 0)}$ K 変わると、歩度の誤差は一日何秒ですか。`],
          a: { type: 'num', v: rate, tol: Math.max(0.05, Math.abs(rate) * 0.01), unit: SD },
          hint: ['$f \\propto \\sqrt{\\kappa/I}$ with $\\kappa \\to \\kappa(1 + e\\Delta T)$ and $I \\to I(1 + \\alpha\\Delta T)^2$.', '$f \\propto \\sqrt{\\kappa/I}$ で、$\\kappa \\to \\kappa(1 + e\\Delta T)$、$I \\to I(1 + \\alpha\\Delta T)^2$ です。'],
          sol: [[`The frequency is multiplied by $\\dfrac{\\sqrt{1 + (${e} \\times 10^{-6})(${dT})}}{1 + (${mat[2]} \\times 10^{-6})(${dT})} = ${n(ratio, 7)}$.`, `振動数は $\\dfrac{\\sqrt{1 + (${e} \\times 10^{-6})(${dT})}}{1 + (${mat[2]} \\times 10^{-6})(${dT})} = ${n(ratio, 7)}$ 倍になります。`], [`Rate $= 86400 \\times (${n(ratio, 7)} - 1) = ${pm(rate, 2)}$ s/day; to first order $86400\\,(e/2 - \\alpha)\\Delta T$.`, `歩度 $= 86400 \\times (${n(ratio, 7)} - 1) = ${pm(rate, 2)}$ 秒/日です。一次の近似では $86400\\,(e/2 - \\alpha)\\Delta T$ です。`], [e < 0 ? 'A plain steel spring softens with heat and dominates everything else: this is why watches before compensating alloys drifted by minutes a day between summer and winter.' : `The two effects nearly cancel when $e = 2\\alpha$, here $${2 * mat[2]}$ ppm/K. Self-compensating hairspring alloys are made to sit close to that value for the balance they are paired with.`, e < 0 ? 'ふつうの鋼のばねは熱で柔らかくなり、他のすべての効果を上回ります。補償合金が現れる前の時計が、夏と冬で一日に何分もずれたのはこのためです。' : `二つの効果は $e = 2\\alpha$、ここでは $${2 * mat[2]}$ ppm/K のときにほぼ打ち消し合います。自己補償型のひげぜんまい合金は、組み合わせるてんぷに対してこの値の近くになるように作られます。`]],
        };
      }
      if (form === 2) {
        const mat = r.pick([['brass', '真ちゅう', 19], ['steel', '鋼', 11.5], ['beryllium bronze', 'ベリリウム銅', 17], ['nickel silver', '洋白', 18]]);
        return {
          q: [`A ${mat[0]} balance expands by $${mat[2]} \\times 10^{-6}$ per kelvin. What temperature coefficient of stiffness $e$ (in ppm/K, where $\\kappa \\to \\kappa(1 + e\\Delta T)$) must the hairspring have so that the rate does not change with temperature, to first order?`, `${mat[1]}のてんぷは 1 ケルビンあたり $${mat[2]} \\times 10^{-6}$ だけ膨張します。歩度が温度で変わらない（一次の近似で）ためには、ひげぜんまいの剛性の温度係数 $e$（ppm/K、$\\kappa \\to \\kappa(1 + e\\Delta T)$）はいくつでなければなりませんか。`],
          a: { type: 'num', v: 2 * mat[2], tol: 0.05, unit: ['ppm/K', 'ppm/K'] },
          hint: ['Expand $\\sqrt{\\kappa/I}$ to first order in $\\Delta T$ with $I \\propto r^2$.', '$I \\propto r^2$ として $\\sqrt{\\kappa/I}$ を $\\Delta T$ の一次まで展開します。'],
          sol: [['$f \\propto \\sqrt{\\kappa}/r$, so $\\delta f/f = \\tfrac12 e\\Delta T - \\alpha\\Delta T$.', '$f \\propto \\sqrt{\\kappa}/r$ なので $\\delta f/f = \\tfrac12 e\\Delta T - \\alpha\\Delta T$ です。'], [`Setting this to zero gives $e = 2\\alpha = ${2 * mat[2]}$ ppm/K: the spring must get stiffer as it warms, exactly enough to drive the heavier-feeling balance.`, `これを 0 とおくと $e = 2\\alpha = ${2 * mat[2]}$ ppm/K です。ばねは温まるにつれて、慣性の増えたてんぷをちょうど駆動できるだけ硬くならなければなりません。`], ['Ordinary steel has $e$ near $-240$ ppm/K, the wrong sign; alloys of the Elinvar type were developed to bring $e$ up to this small positive value.', 'ふつうの鋼の $e$ は $-240$ ppm/K 程度で、符号が逆です。エリンバー型の合金は、$e$ をこの小さな正の値まで引き上げるために開発されました。']],
        };
      }
      return {
        q: ['Write the exact rate of a watch, in s/day, as a function of the fractional change $x = \\Delta L/L$ of the active hairspring length (as a plain fraction, not ‰), if it kept perfect time at $x = 0$.', 'ひげぜんまいの有効長さの相対変化 $x = \\Delta L/L$（‰ ではなくそのままの比）の関数として、時計の歩度（秒/日）の厳密な式を書いてください。$x = 0$ のとき時計は正確とします。'],
        a: { type: 'expr', v: '86400*(1/sqrt(1+x)-1)', vars: ['x'], dom: { x: [-0.3, 0.3] }, lhs: ['$\\text{rate} =$', '$\\text{歩度} =$'] },
        hint: ['Stiffness $\\kappa \\propto 1/L$, frequency $\\propto \\sqrt{\\kappa}$; the rate is $86400(f/f_0 - 1)$.', '剛性 $\\kappa \\propto 1/L$、振動数 $\\propto \\sqrt{\\kappa}$ で、歩度は $86400(f/f_0 - 1)$ です。'],
        sol: [['$L \\to L(1 + x)$ divides $\\kappa$ by $1 + x$ and so divides the frequency by $\\sqrt{1 + x}$.', '$L \\to L(1 + x)$ で $\\kappa$ は $1 + x$ で割られ、振動数は $\\sqrt{1 + x}$ で割られます。'], ['Rate $= 86400\\,\\big(1/\\sqrt{1 + x} - 1\\big)$ s/day. For small $x$ this is $-43200\\,x$: one part in ten thousand of length is 4.3 s a day.', '歩度 $= 86400\\,\\big(1/\\sqrt{1 + x} - 1\\big)$ 秒/日です。$x$ が小さければ $-43200\\,x$ で、長さの一万分の一が一日 4.3 秒にあたります。']],
      };
    },
  ];

  /* ---------------- 2. Airy's theorem ---------------- */
  const thiPick = (r) => { let t; do { t = r.step(-10, 10, 0.5); } while (Math.abs(t) < 1); return t; };
  Q['escapement-airy'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const where = r.int(0, 2), d = r.step(1, 6, 0.5);
        const opts = [['It gains', '進む'], ['It loses', '遅れる'], ['Its rate does not change', '歩度は変わらない'], ['It gains or loses depending on Q only', 'Q だけで進むか遅れるかが決まる']];
        const v = where === 0 ? 0 : where === 1 ? 1 : 2;
        const desc = where === 0 ? [`${n(d)}° before the balance reaches its centre (rest) position`, `てんぷが中心（静止位置）に達する ${n(d)}° 手前`] : where === 1 ? [`${n(d)}° after the balance has passed its centre`, `てんぷが中心を ${n(d)}° 過ぎた後`] : ['exactly as the balance passes its centre', 'てんぷがちょうど中心を通過する瞬間'];
        return {
          q: [`An escapement gives the balance its impulse ${desc[0]}. What does that impulse do to the rate of the watch?`, `脱進機がてんぷに衝撃を与えるのが${desc[1]}です。この衝撃は時計の歩度をどうしますか。`],
          a: { type: 'choice', opts, v, fixed: true },
          hint: ['Before the centre the balance is still speeding up towards it; a push there gets it to the end of its swing early.', '中心の手前では、てんぷはまだ中心へ向かって加速しています。そこで押すと振動の端に早く着きます。'],
          sol: [['Airy: a small kick at phase $\\Phi_i$ shifts the phase by $\\delta\\Phi = -\\varepsilon\\sin\\Phi_i$, where $\\sin\\Phi_i = \\theta_i/A$.', 'エアリーの結果では、位相 $\\Phi_i$ での小さな一撃は位相を $\\delta\\Phi = -\\varepsilon\\sin\\Phi_i$ だけずらします。ここで $\\sin\\Phi_i = \\theta_i/A$ です。'], [where === 2 ? 'At the centre $\\sin\\Phi_i = 0$: the kick changes only the amplitude, never the timing. That is the ideal.' : where === 0 ? 'Before the centre $\\theta_i < 0$, so $\\delta\\Phi > 0$: each cycle finishes early and the watch gains.' : 'After the centre $\\theta_i > 0$, so $\\delta\\Phi < 0$: each cycle is held back and the watch loses.', where === 2 ? '中心では $\\sin\\Phi_i = 0$ なので、一撃は振り角だけを変え、時刻には触れません。これが理想です。' : where === 0 ? '中心の手前では $\\theta_i < 0$ なので $\\delta\\Phi > 0$ となり、各周期が早く終わって時計は進みます。' : '中心を過ぎた後では $\\theta_i > 0$ なので $\\delta\\Phi < 0$ となり、各周期が引き戻されて時計は遅れます。']],
          set: { thi: where === 0 ? -d : where === 1 ? d : 0 },
        };
      }
      const t = thiPick(r), A = r.step(150, 320, 10), phi = Math.asin(t / A) / DEG;
      return {
        q: [`The impulse is delivered at $\\theta_i = ${n(t)}^\\circ$ from the centre while the balance swings with amplitude $A = ${A}^\\circ$. At what phase angle $\\Phi_i$ of the oscillation $\\theta = A\\sin\\Phi$ does it arrive, in degrees?`, `てんぷが振り角 $A = ${A}^\\circ$ で振動しているとき、中心から $\\theta_i = ${n(t)}^\\circ$ の位置で衝撃が与えられます。振動 $\\theta = A\\sin\\Phi$ のどの位相角 $\\Phi_i$（度）で届きますか。`],
        a: { type: 'num', v: phi, tol: 0.003, unit: ['°', '°'] },
        hint: ['Solve $A\\sin\\Phi_i = \\theta_i$; the units of the two angles cancel.', '$A\\sin\\Phi_i = \\theta_i$ を解きます。二つの角の単位は打ち消し合います。'],
        sol: [[`$\\sin\\Phi_i = ${n(t)}/${A} = ${n(t / A, 5)}$.`, `$\\sin\\Phi_i = ${n(t)}/${A} = ${n(t / A, 5)}$ です。`], [`$\\Phi_i = ${n(phi, 4)}^\\circ$. A displacement of a few degrees out of a swing of hundreds is a tiny phase, which is why the resulting rate error is only seconds a day.`, `$\\Phi_i = ${n(phi, 4)}^\\circ$ です。数百度の振動のうちの数度の変位はごく小さな位相なので、生じる歩度の誤差も一日数秒にとどまります。`]],
        set: { thi: t, amp: A },
      };
    },
    (r) => {
      const form = r.int(0, 2), t = thiPick(r), A = r.step(150, 320, 10), Qf = r.step(150, 400, 10), s = t / A, phi = Math.asin(s), rate = airy(t, A, Qf), eps = PI / (2 * Qf * Math.cos(phi));
      if (form === 0) return {
        q: [`With $Q = ${Qf}$, amplitude $${A}^\\circ$ and the impulse at $\\theta_i = ${n(t)}^\\circ$ (${t < 0 ? 'before' : 'after'} the centre), what rate error does the escapement cause, in s/day?`, `$Q = ${Qf}$、振り角 $${A}^\\circ$、衝撃の位置 $\\theta_i = ${n(t)}^\\circ$（中心の${t < 0 ? '手前' : '後'}）のとき、脱進機が生む歩度の誤差は一日何秒ですか。`],
        a: { type: 'num', v: rate, tol: 0.01, unit: SD },
        hint: ['The kick must restore the loss $\\pi/(2Q)$ per half cycle, which fixes $\\varepsilon\\cos\\Phi_i$; the rate is then $-(43200/Q)\\tan\\Phi_i$.', '一撃は半周期ごとの損失 $\\pi/(2Q)$ を補わなければならず、それが $\\varepsilon\\cos\\Phi_i$ を決めます。歩度は $-(43200/Q)\\tan\\Phi_i$ です。'],
        sol: [[`$\\sin\\Phi_i = ${n(t)}/${A}$, so $\\tan\\Phi_i = ${n(Math.tan(phi), 6)}$.`, `$\\sin\\Phi_i = ${n(t)}/${A}$ より $\\tan\\Phi_i = ${n(Math.tan(phi), 6)}$ です。`], [`Rate $= -\\dfrac{43200}{${Qf}} \\times ${pn(Math.tan(phi), 6)} = ${pm(rate, 3)}$ s/day.`, `歩度 $= -\\dfrac{43200}{${Qf}} \\times ${pn(Math.tan(phi), 6)} = ${pm(rate, 3)}$ 秒/日です。`], [t < 0 ? 'Impulse before the centre: the watch gains.' : 'Impulse after the centre: the watch loses.', t < 0 ? '中心の手前での衝撃なので時計は進みます。' : '中心の後での衝撃なので時計は遅れます。']],
        set: { thi: t, amp: A, Q: Qf },
      };
      if (form === 1) return {
        q: [`To keep a balance with $Q = ${Qf}$ at amplitude $${A}^\\circ$, the escapement kicks it at $\\theta_i = ${n(t)}^\\circ$. How large must each kick be, as $\\varepsilon = \\delta v/(A\\omega)$?`, `$Q = ${Qf}$ のてんぷを振り角 $${A}^\\circ$ に保つため、脱進機は $\\theta_i = ${n(t)}^\\circ$ で一撃を与えます。一撃の大きさ $\\varepsilon = \\delta v/(A\\omega)$ はいくつでなければなりませんか。`],
        a: { type: 'num', v: eps, rel: 0.003 },
        hint: ['Per half cycle the amplitude decays by the fraction $\\pi/(2Q)$; the kick raises it by $\\varepsilon\\cos\\Phi_i$.', '半周期ごとに振り角は $\\pi/(2Q)$ の割合で減衰し、一撃はそれを $\\varepsilon\\cos\\Phi_i$ だけ増やします。'],
        sol: [[`Loss per half cycle: $\\pi/(2 \\times ${Qf}) = ${n(PI / (2 * Qf), 6)}$.`, `半周期ごとの損失は $\\pi/(2 \\times ${Qf}) = ${n(PI / (2 * Qf), 6)}$ です。`], [`$\\cos\\Phi_i = \\sqrt{1 - (${n(t)}/${A})^2} = ${n(Math.cos(phi), 6)}$, so $\\varepsilon = ${n(PI / (2 * Qf), 6)}/${n(Math.cos(phi), 6)} = ${n(eps, 6)}$.`, `$\\cos\\Phi_i = \\sqrt{1 - (${n(t)}/${A})^2} = ${n(Math.cos(phi), 6)}$ なので $\\varepsilon = ${n(PI / (2 * Qf), 6)}/${n(Math.cos(phi), 6)} = ${n(eps, 6)}$ です。`], [`The kick is only ${n(100 * eps, 2)}% of the balance’s peak speed: a good oscillator needs only a nudge, which is why the escapement can disturb it so little.`, `一撃はてんぷの最大速度のわずか ${n(100 * eps, 2)}% です。よい振動子は軽く押すだけで足り、だから脱進機の乱れもごく小さくできるのです。`]],
        set: { thi: t, amp: A, Q: Qf },
      };
      const drop = r.step(60, 100, 10), A2 = Math.max(100, A - drop), r1 = airy(t, A, Qf), r2 = airy(t, A2, Qf);
      return {
        q: [`A watch with $Q = ${Qf}$ and its impulse at $\\theta_i = ${n(t)}^\\circ$ runs at amplitude $${A}^\\circ$ when fully wound and $${A2}^\\circ$ near the end of its reserve. What are the escapement rate errors in the two states, in s/day?`, `$Q = ${Qf}$ で衝撃の位置が $\\theta_i = ${n(t)}^\\circ$ の時計は、全巻きで振り角 $${A}^\\circ$、持続時間の終わり近くで $${A2}^\\circ$ になります。二つの状態での脱進機による歩度の誤差は一日何秒ですか。`],
        a: { type: 'tuple', v: [r1, r2], labels: [['full', '全巻き'], ['run down', '終わり近く']], tol: 0.01 },
        hint: ['Use $-(43200/Q)\\tan(\\arcsin(\\theta_i/A))$ twice.', '$-(43200/Q)\\tan(\\arcsin(\\theta_i/A))$ を二回使います。'],
        sol: [[`At $${A}^\\circ$: $-\\tfrac{43200}{${Qf}}\\tan\\arcsin\\tfrac{${n(t)}}{${A}} = ${pm(r1, 3)}$ s/day.`, `$${A}^\\circ$ では $-\\tfrac{43200}{${Qf}}\\tan\\arcsin\\tfrac{${n(t)}}{${A}} = ${pm(r1, 3)}$ 秒/日です。`], [`At $${A2}^\\circ$: $${pm(r2, 3)}$ s/day, ${n(r2 / r1, 3)} times as much, close to the ratio of amplitudes $${A}/${A2}$.`, `$${A2}^\\circ$ では $${pm(r2, 3)}$ 秒/日で、${n(r2 / r1, 3)} 倍です。振り角の比 $${A}/${A2}$ に近い値です。`], ['The error grows as the mainspring runs down: the same angle is a larger part of a smaller swing. Watchmakers call this the isochronism error of the escapement.', '主ぜんまいがほどけるにつれて誤差は大きくなります。同じ角度が、小さくなった振動の大きな割合を占めるからです。時計師はこれを脱進機の等時性誤差と呼びます。']],
        set: { thi: t, amp: A2, Q: Qf },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = thiPick(r), Qf = r.step(150, 400, 10), A = r.step(120, 320, 5), R = Math.round(airy(t, A, Qf) * 1000) / 1000;
        const Aans = t / Math.sin(Math.atan(-R * Qf / 43200));
        return {
          q: [`A watch with $Q = ${Qf}$ receives its impulse at $\\theta_i = ${n(t)}^\\circ$. At what amplitude, in degrees, is the escapement error $${pm(R, 3)}$ s/day?`, `$Q = ${Qf}$ の時計が $\\theta_i = ${n(t)}^\\circ$ で衝撃を受けます。脱進機による誤差が $${pm(R, 3)}$ 秒/日になるのは振り角何度のときですか。`],
          a: { type: 'num', v: Aans, tol: 1, unit: ['°', '°'] },
          hint: ['Invert the rate formula for $\\tan\\Phi_i$, then use $A = \\theta_i/\\sin\\Phi_i$.', '歩度の式を $\\tan\\Phi_i$ について解き、$A = \\theta_i/\\sin\\Phi_i$ を使います。'],
          sol: [[`$\\tan\\Phi_i = -\\dfrac{${pn(R, 3)} \\times ${Qf}}{43200} = ${n(-R * Qf / 43200, 6)}$, so $\\Phi_i = ${n(Math.atan(-R * Qf / 43200) / DEG, 4)}^\\circ$.`, `$\\tan\\Phi_i = -\\dfrac{${pn(R, 3)} \\times ${Qf}}{43200} = ${n(-R * Qf / 43200, 6)}$ より $\\Phi_i = ${n(Math.atan(-R * Qf / 43200) / DEG, 4)}^\\circ$ です。`], [`$A = \\theta_i/\\sin\\Phi_i = ${n(t)}/${pn(Math.sin(Math.atan(-R * Qf / 43200)), 6)} = ${n(Aans, 1)}^\\circ$.`, `$A = \\theta_i/\\sin\\Phi_i = ${n(t)}/${pn(Math.sin(Math.atan(-R * Qf / 43200)), 6)} = ${n(Aans, 1)}^\\circ$ です。`], ['The sign of the rate fixes the sign of $\\Phi_i$, and it has to agree with the side of the centre where the kick lands; a smaller amplitude would make the error larger still.', '歩度の符号が $\\Phi_i$ の符号を決め、それは一撃が中心のどちら側に当たるかと一致しなければなりません。振り角がさらに小さければ誤差はもっと大きくなります。']],
          set: { thi: t, Q: Qf, amp: A },
        };
      }
      if (form === 1) {
        const t = thiPick(r), Qf = r.pick([200, 250, 300]), k = 43200 * t * DEG / Qf;
        return {
          q: [`For $\\theta_i \\ll A$ the escapement error simplifies. With the impulse at $\\theta_i = ${n(t)}^\\circ$ and $Q = ${Qf}$, write the rate in s/day as a function of the amplitude $A$ in radians, to leading order.`, `$\\theta_i \\ll A$ のとき脱進機の誤差は簡単になります。衝撃の位置が $\\theta_i = ${n(t)}^\\circ$、$Q = ${Qf}$ のとき、歩度（秒/日）を振り角 $A$（ラジアン）の関数として最低次まで書いてください。`],
          a: { type: 'expr', v: `${-k}/A`, vars: ['A'], dom: { A: [1.8, 5.7] }, lhs: ['$\\text{rate} \\approx$', '$\\text{歩度} \\approx$'] },
          hint: ['For a small angle, $\\tan\\Phi_i \\approx \\sin\\Phi_i = \\theta_i/A$. Put $\\theta_i$ in radians.', '小さな角では $\\tan\\Phi_i \\approx \\sin\\Phi_i = \\theta_i/A$ です。$\\theta_i$ をラジアンにします。'],
          sol: [[`$\\theta_i = ${n(t)}^\\circ = ${n(t * DEG, 6)}$ rad and $\\tan\\Phi_i \\approx \\theta_i/A$.`, `$\\theta_i = ${n(t)}^\\circ = ${n(t * DEG, 6)}$ rad で、$\\tan\\Phi_i \\approx \\theta_i/A$ です。`], [`Rate $\\approx -\\dfrac{43200}{${Qf}} \\cdot \\dfrac{${n(t * DEG, 6)}}{A} = ${n(-k, 5)}/A$.`, `歩度 $\\approx -\\dfrac{43200}{${Qf}} \\cdot \\dfrac{${n(t * DEG, 6)}}{A} = ${n(-k, 5)}/A$ です。`], ['The error is inversely proportional to amplitude: halve the swing and the error doubles, which is the shape of the curve on the right.', '誤差は振り角に反比例します。振動を半分にすると誤差は二倍になり、これが右の曲線の形です。']],
          set: { thi: t, Q: Qf },
        };
      }
      const t = thiPick(r), A1 = r.step(250, 320, 10), A2 = r.step(140, 220, 10), Qf = r.step(150, 400, 10), ratio = Math.tan(Math.asin(t / A2)) / Math.tan(Math.asin(t / A1));
      return {
        q: [`The amplitude of a watch falls from $${A1}^\\circ$ to $${A2}^\\circ$ while the impulse stays at $\\theta_i = ${n(t)}^\\circ$ and $Q = ${Qf}$. By what factor does the escapement error grow? (Does $Q$ matter?)`, `衝撃の位置は $\\theta_i = ${n(t)}^\\circ$、$Q = ${Qf}$ のまま、時計の振り角が $${A1}^\\circ$ から $${A2}^\\circ$ に下がります。脱進機の誤差は何倍になりますか（$Q$ は関係しますか）。`],
        a: { type: 'num', v: ratio, rel: 0.002 },
        hint: ['Take the ratio of the two rates; the factor $43200/Q$ cancels.', '二つの歩度の比をとると、$43200/Q$ の因子は打ち消し合います。'],
        sol: [[`Ratio $= \\dfrac{\\tan\\arcsin(${n(t)}/${A2})}{\\tan\\arcsin(${n(t)}/${A1})} = \\dfrac{${n(Math.tan(Math.asin(t / A2)), 6)}}{${n(Math.tan(Math.asin(t / A1)), 6)}} = ${n(ratio, 4)}$.`, `比 $= \\dfrac{\\tan\\arcsin(${n(t)}/${A2})}{\\tan\\arcsin(${n(t)}/${A1})} = \\dfrac{${n(Math.tan(Math.asin(t / A2)), 6)}}{${n(Math.tan(Math.asin(t / A1)), 6)}} = ${n(ratio, 4)}$ です。`], [`$Q$ cancels: it sets the size of the error but not how it scales. The factor is almost exactly $${A1}/${A2} = ${n(A1 / A2, 4)}$ because the angles are small.`, `$Q$ は打ち消し合います。誤差の大きさは決めますが、変わり方は決めません。角が小さいので、比は $${A1}/${A2} = ${n(A1 / A2, 4)}$ にほぼ等しくなります。`]],
        set: { thi: t, Q: Qf, amp: A2 },
      };
    },
  ];

  /* ---------------- 3. positional error ---------------- */
  const posRate = (mr, alphaDeg, Adeg) => DAY * poiseK(mr) * Math.cos(alphaDeg * DEG) * J1(Adeg * DEG) / (Adeg * DEG);
  Q['positional-error'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const mr = r.int(5, 50), pos = r.pick([0, 0, 1, 2, 3, 4]);
        const opts = [['Zero, whatever the amplitude', '振り角によらず 0'], ['It gains in proportion to the unbalance', '重心のずれに比例して進む'], ['It loses in proportion to the unbalance', '重心のずれに比例して遅れる'], ['It depends on where the heavy spot is', '重い点の位置による']];
        if (pos === 0) return {
          q: [`A balance has an unbalance of $mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$. With the watch lying dial up, what rate error does the unbalance cause?`, `重心のずれが $mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ のてんぷがあります。時計を文字盤上に置いたとき、このずれはどれだけの歩度の誤差を生みますか。`],
          a: { type: 'choice', opts, v: 0, fixed: true },
          hint: ['Which way does gravity point relative to the balance staff when the watch lies flat?', '時計を平らに置いたとき、重力は天真に対してどの向きでしょうか。'],
          sol: [['Dial up, gravity acts along the balance staff. A force along the axis has no moment about it.', '文字盤上では重力は天真に沿って働きます。軸に沿った力は、その軸のまわりのモーメントをもちません。'], ['So the heavy spot adds no torque, the hairspring alone governs the swing, and the rate error is zero in both flat positions. Positional errors from poise appear only in the vertical positions.', 'したがって重い点はトルクを加えず、振動はひげぜんまいだけで決まり、歩度の誤差は平らな二つの姿勢で 0 です。釣り合いの悪さによる姿勢差は縦姿勢でだけ現れます。']],
          set: { mr, pos: 0 },
        };
        const mr2 = r.int(5, 50);
        return {
          q: [`For the balance in the figure ($I = 12\\ \\mathrm{mg\\,cm^2}$, 4 Hz), compute the strength of the gravity torque relative to the hairspring, $mgr/(I\\omega_0^2)$, for an unbalance $mr = ${mr2}\\ \\mu\\mathrm g\\,\\mathrm{mm}$.`, `図のてんぷ（$I = 12\\ \\mathrm{mg\\,cm^2}$、4 Hz）について、重心のずれ $mr = ${mr2}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ のとき、ひげぜんまいに対する重力トルクの強さ $mgr/(I\\omega_0^2)$ を計算してください。`],
          a: { type: 'num', v: poiseK(mr2), rel: 0.005 },
          hint: ['$1\\ \\mu\\mathrm g\\,\\mathrm{mm} = 10^{-9}\\ \\mathrm{kg} \\times 10^{-3}\\ \\mathrm m = 10^{-12}$ kg·m.', '$1\\ \\mu\\mathrm g\\,\\mathrm{mm} = 10^{-9}\\ \\mathrm{kg} \\times 10^{-3}\\ \\mathrm m = 10^{-12}$ kg·m です。'],
          sol: [[`$mgr = ${mr2} \\times 10^{-12} \\times 9.81 = ${sig(mr2 * 1e-12 * G, 3)}$ N·m.`, `$mgr = ${mr2} \\times 10^{-12} \\times 9.81 = ${sig(mr2 * 1e-12 * G, 3)}$ N·m です。`], [`$I\\omega_0^2 = 1.2 \\times 10^{-9} \\times (8\\pi)^2 = ${sig(I_BAL * W0 * W0, 3)}$ N·m/rad, so the ratio is $${sig(poiseK(mr2), 3)}$.`, `$I\\omega_0^2 = 1.2 \\times 10^{-9} \\times (8\\pi)^2 = ${sig(I_BAL * W0 * W0, 3)}$ N·m/rad なので、比は $${sig(poiseK(mr2), 3)}$ です。`], [`Tiny, but multiplied by 86,400 s it becomes seconds a day: at most $${n(DAY * poiseK(mr2) * 0.5, 2)}$ s/day, since $J_1(A)/A \\le \\tfrac12$.`, `小さな値ですが、86,400 秒を掛けると一日数秒になります。$J_1(A)/A \\le \\tfrac12$ なので最大で $${n(DAY * poiseK(mr2) * 0.5, 2)}$ 秒/日です。`]],
          set: { mr: mr2 },
        };
      }
      if (form === 1) {
        const A = r.pick([140, 160, 180, 200, 240, 260, 280, 300, 320]), spot = r.int(0, 1);
        const gain = (spot === 0) === (A < 219.5);
        const opts = [['It gains', '進む'], ['It loses', '遅れる'], ['No change', '変わらない']];
        return {
          q: [`A watch hangs crown down with the heavy spot of its balance at the ${spot === 0 ? 'bottom' : 'top'} of the rim (at rest). The amplitude is ${A}°. Does the unbalance make it gain or lose?`, `りゅうず下に吊るした時計で、てんぷの重い点が（静止時に）縁の${spot === 0 ? '一番下' : '一番上'}にあります。振り角は ${A}° です。重心のずれで時計は進みますか、遅れますか。`],
          a: { type: 'choice', opts, v: gain ? 0 : 1, fixed: true },
          hint: ['The sign is that of $\\cos\\alpha\\,J_1(A)/A$, and $J_1$ changes sign at $A = 219.5^\\circ$.', '符号は $\\cos\\alpha\\,J_1(A)/A$ の符号で、$J_1$ は $A = 219.5^\\circ$ で符号を変えます。'],
          sol: [[`Spot ${spot === 0 ? 'down' : 'up'}: $\\cos\\alpha = ${spot === 0 ? '+1' : '-1'}$. At $${A}^\\circ$, $J_1(A)/A = ${n(J1(A * DEG) / (A * DEG), 4)}$, ${A < 219.5 ? 'positive' : 'negative'} because the amplitude is ${A < 219.5 ? 'below' : 'above'} 219.5°.`, `重い点が${spot === 0 ? '下' : '上'}なので $\\cos\\alpha = ${spot === 0 ? '+1' : '-1'}$ です。$${A}^\\circ$ では $J_1(A)/A = ${n(J1(A * DEG) / (A * DEG), 4)}$ で、振り角が 219.5° ${A < 219.5 ? 'より小さい' : 'より大きい'}ので${A < 219.5 ? '正' : '負'}です。`], [`The product is ${gain ? 'positive: the watch gains' : 'negative: the watch loses'}. ${A < 219.5 ? 'At small amplitude a heavy spot at the bottom behaves like a pendulum adding to the spring.' : 'At large amplitude the balance spends its time far from rest, where the same spot pulls the other way on average.'}`, `積は${gain ? '正なので時計は進みます' : '負なので時計は遅れます'}。${A < 219.5 ? '振り角が小さいと、下にある重い点はばねに加わる振り子のように働きます。' : '振り角が大きいと、てんぷは静止位置から遠い所で長く過ごし、同じ重い点が平均すると逆向きに引きます。'}`]],
          set: { alpha: spot === 0 ? 0 : 180, amp: A, pos: 1 },
        };
      }
      return {
        q: ['The positional error of an unpoised balance is proportional to $J_1(A)/A$. At what amplitude between 120° and 330° does it vanish in every position, in degrees?', '釣り合いのとれていないてんぷの姿勢差は $J_1(A)/A$ に比例します。120° から 330° の間で、どの姿勢でも姿勢差が消える振り角は何度ですか。'],
        a: { type: 'num', v: 3.831705970207512 / DEG, tol: 0.3, unit: ['°', '°'] },
        hint: ['Find the first positive zero of the Bessel function $J_1$ and convert from radians.', 'ベッセル関数 $J_1$ の最初の正の零点を求め、ラジアンから度に直します。'],
        sol: [['$J_1(x) = 0$ first at $x = 3.8317$ (besides $x = 0$).', '$J_1(x) = 0$ となるのは（$x = 0$ を除いて）まず $x = 3.8317$ です。'], ['$3.8317 \\times 180/\\pi = 219.5^\\circ$. Watchmakers aim to have the amplitude in the vertical positions near this value, where poise errors disappear.', '$3.8317 \\times 180/\\pi = 219.5^\\circ$ です。時計師は縦姿勢での振り角をこの値の近くにしようとします。そこでは釣り合いの誤差が消えるからです。']],
        set: { amp: 220 },
      };
    },
    (r) => {
      const form = r.int(0, 1), mr = r.int(10, 50), alpha = r.pick([0, 30, 45, 60, 120, 135, 150, 180, 210, 240, 300, 330]);
      let A; do { A = r.step(120, 330, 10); } while (Math.abs(A - 219.5) < 15);
      const rate = posRate(mr, alpha, A);
      if (form === 0) return {
        q: [`The watch hangs crown down. Its balance ($I = 12\\ \\mathrm{mg\\,cm^2}$, 4 Hz) has an unbalance $mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ with the heavy spot at $\\alpha = ${alpha}^\\circ$ from the bottom, and swings at $${A}^\\circ$. What is the rate error, in s/day?`, `時計はりゅうず下に吊るされています。てんぷ（$I = 12\\ \\mathrm{mg\\,cm^2}$、4 Hz）の重心のずれは $mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ で、重い点は一番下から $\\alpha = ${alpha}^\\circ$ の位置にあり、振り角は $${A}^\\circ$ です。歩度の誤差は一日何秒ですか。`],
        a: { type: 'num', v: rate, tol: 0.03, unit: SD },
        hint: ['Rate $= 86400 \\cdot \\dfrac{mgr}{I\\omega_0^2} \\cos\\alpha \\cdot \\dfrac{J_1(A)}{A}$ with $A$ in radians.', '歩度 $= 86400 \\cdot \\dfrac{mgr}{I\\omega_0^2} \\cos\\alpha \\cdot \\dfrac{J_1(A)}{A}$ で、$A$ はラジアンです。'],
        sol: [[`$mgr/(I\\omega_0^2) = ${sig(poiseK(mr), 3)}$ and $\\cos ${alpha}^\\circ = ${n(Math.cos(alpha * DEG), 4)}$.`, `$mgr/(I\\omega_0^2) = ${sig(poiseK(mr), 3)}$、$\\cos ${alpha}^\\circ = ${n(Math.cos(alpha * DEG), 4)}$ です。`], [`$A = ${n(A * DEG, 4)}$ rad and $J_1(A)/A = ${n(J1(A * DEG) / (A * DEG), 5)}$.`, `$A = ${n(A * DEG, 4)}$ rad、$J_1(A)/A = ${n(J1(A * DEG) / (A * DEG), 5)}$ です。`], [`Rate $= 86400 \\times ${sig(poiseK(mr), 3)} \\times ${pn(Math.cos(alpha * DEG), 4)} \\times ${pn(J1(A * DEG) / (A * DEG), 5)} = ${pm(rate, 3)}$ s/day: the watch ${rate > 0 ? 'gains' : 'loses'} in this position.`, `歩度 $= 86400 \\times ${sig(poiseK(mr), 3)} \\times ${pn(Math.cos(alpha * DEG), 4)} \\times ${pn(J1(A * DEG) / (A * DEG), 5)} = ${pm(rate, 3)}$ 秒/日で、この姿勢では時計は${rate > 0 ? '進み' : '遅れ'}ます。`]],
        set: { mr, alpha, amp: A, pos: 1 },
      };
      const a0 = r.pick([0, 0, 30, 60, 150, 180]), r1 = posRate(mr, a0, A), r3 = posRate(mr, a0 - 180, A);
      return {
        q: [`A balance with $mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ swings at $${A}^\\circ$. With the watch crown down its heavy spot sits at $\\alpha = ${a0}^\\circ$ from the bottom. Find the rate errors crown down and crown up, in s/day.`, `$mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ のてんぷが $${A}^\\circ$ で振動しています。りゅうず下のとき、重い点は一番下から $\\alpha = ${a0}^\\circ$ にあります。りゅうず下とりゅうず上での歩度の誤差を一日何秒で求めてください。`],
        a: { type: 'tuple', v: [r1, r3], labels: [['crown down', 'りゅうず下'], ['crown up', 'りゅうず上']], tol: 0.03 },
        hint: ['Turning the watch over by 180° moves the heavy spot by 180° relative to gravity.', '時計を 180° 回すと、重い点は重力に対して 180° 動きます。'],
        sol: [[`Crown down: $86400 \\times ${sig(poiseK(mr), 3)} \\times \\cos ${a0}^\\circ \\times ${pn(J1(A * DEG) / (A * DEG), 5)} = ${pm(r1, 3)}$ s/day.`, `りゅうず下：$86400 \\times ${sig(poiseK(mr), 3)} \\times \\cos ${a0}^\\circ \\times ${pn(J1(A * DEG) / (A * DEG), 5)} = ${pm(r1, 3)}$ 秒/日です。`], [`Crown up the angle becomes $${a0 - 180}^\\circ$, the cosine changes sign, and the error is $${pm(r3, 3)}$ s/day.`, `りゅうず上では角が $${a0 - 180}^\\circ$ になり、余弦の符号が変わるので、誤差は $${pm(r3, 3)}$ 秒/日です。`], [`Opposite positions always have opposite errors; their difference, $${n(Math.abs(r1 - r3), 3)}$ s/day, is what a timegrapher shows as positional variation.`, `向かい合う姿勢の誤差は常に逆符号です。その差 $${n(Math.abs(r1 - r3), 3)}$ 秒/日が、タイムグラファーが姿勢差として示すものです。`]],
        set: { mr, alpha: a0, amp: A, pos: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let A; do { A = r.step(130, 320, 10); } while (Math.abs(A - 219.5) < 30);
        const X = r.pick([2, 3, 4, 5, 6, 8]), jj = Math.abs(J1(A * DEG) / (A * DEG)), mr = X / (2 * DAY * poiseK(1) * jj);
        return {
          q: [`A specification allows at most ${X} s/day between the crown-down and crown-up rates. If the vertical amplitude is $${A}^\\circ$, what is the largest unbalance $mr$ the balance ($I = 12\\ \\mathrm{mg\\,cm^2}$, 4 Hz) may have, in µg·mm?`, `仕様では、りゅうず下とりゅうず上の歩度の差は一日 ${X} 秒までです。縦姿勢での振り角が $${A}^\\circ$ のとき、てんぷ（$I = 12\\ \\mathrm{mg\\,cm^2}$、4 Hz）に許される最大の重心のずれ $mr$ は何 µg·mm ですか。`],
          a: { type: 'num', v: mr, rel: 0.01, unit: ['µg·mm', 'µg·mm'] },
          hint: ['The worst case is the heavy spot straight down in one position and straight up in the other: the difference is twice the single error.', '最悪の場合は、一方の姿勢で重い点が真下、もう一方で真上にあるときで、差は一つの誤差の二倍です。'],
          sol: [[`Difference $= 2 \\times 86400 \\cdot \\dfrac{mgr}{I\\omega_0^2} \\cdot \\left|\\dfrac{J_1(A)}{A}\\right|$, with $|J_1(A)/A| = ${n(jj, 5)}$.`, `差 $= 2 \\times 86400 \\cdot \\dfrac{mgr}{I\\omega_0^2} \\cdot \\left|\\dfrac{J_1(A)}{A}\\right|$ で、$|J_1(A)/A| = ${n(jj, 5)}$ です。`], [`One µg·mm gives $86400 \\times ${sig(poiseK(1), 3)} = ${n(DAY * poiseK(1), 4)}$ s/day per unit of $J_1/A$, so $mr = ${X}/(2 \\times ${n(DAY * poiseK(1), 4)} \\times ${n(jj, 5)}) = ${n(mr, 3)}\\ \\mu\\mathrm g\\,\\mathrm{mm}$.`, `1 µg·mm あたり $J_1/A$ の単位量につき $86400 \\times ${sig(poiseK(1), 3)} = ${n(DAY * poiseK(1), 4)}$ 秒/日なので、$mr = ${X}/(2 \\times ${n(DAY * poiseK(1), 4)} \\times ${n(jj, 5)}) = ${n(mr, 3)}\\ \\mu\\mathrm g\\,\\mathrm{mm}$ です。`], [`That is a speck of a few micrograms at the rim: poising a balance means removing metal at this scale. Closer to 219.5° the tolerance would be much looser.`, `縁にある数マイクログラムのかけらに相当します。てんぷの釣り合いをとるとは、この規模で金属を取り除くことです。219.5° に近ければ許容値はずっと緩くなります。`]],
          set: { amp: A, alpha: 0, pos: 1, mr: Math.min(50, Math.max(0, Math.round(mr))) },
        };
      }
      if (form === 1) {
        const A1 = r.step(260, 310, 10), A2 = r.step(160, 200, 10), mr = r.int(10, 40), r1 = posRate(mr, 0, A1), r2 = posRate(mr, 0, A2);
        return {
          q: [`A watch hangs crown down with its heavy spot at the bottom ($mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$). Fully wound it swings at $${A1}^\\circ$; a day later at $${A2}^\\circ$. What are the poise errors at the two amplitudes, in s/day?`, `重い点が一番下（$mr = ${mr}\\ \\mu\\mathrm g\\,\\mathrm{mm}$）の時計をりゅうず下に吊るします。全巻きで振り角は $${A1}^\\circ$、一日後には $${A2}^\\circ$ です。二つの振り角での釣り合いの誤差は一日何秒ですか。`],
          a: { type: 'tuple', v: [r1, r2], labels: [[`$${A1}^\\circ$`, `$${A1}^\\circ$`], [`$${A2}^\\circ$`, `$${A2}^\\circ$`]], tol: 0.03 },
          hint: ['Same formula twice; watch the sign of $J_1(A)$ on each side of 219.5°.', '同じ式を二回使います。219.5° の両側で $J_1(A)$ の符号に注意してください。'],
          sol: [[`At $${A1}^\\circ$: $J_1/A = ${n(J1(A1 * DEG) / (A1 * DEG), 5)}$, error $${pm(r1, 3)}$ s/day.`, `$${A1}^\\circ$ では $J_1/A = ${n(J1(A1 * DEG) / (A1 * DEG), 5)}$、誤差は $${pm(r1, 3)}$ 秒/日です。`], [`At $${A2}^\\circ$: $J_1/A = ${n(J1(A2 * DEG) / (A2 * DEG), 5)}$, error $${pm(r2, 3)}$ s/day.`, `$${A2}^\\circ$ では $J_1/A = ${n(J1(A2 * DEG) / (A2 * DEG), 5)}$、誤差は $${pm(r2, 3)}$ 秒/日です。`], ['The watch loses when fully wound and gains as it runs down: the error crosses zero on the way, at 219.5°. A watchmaker can use an unbalance on purpose to offset the escapement’s own amplitude error.', '時計は全巻きでは遅れ、ほどけるにつれて進みます。誤差は途中の 219.5° で 0 を横切ります。時計師は、脱進機自身の振り角による誤差を打ち消すために、わざと重心をずらすこともあります。']],
          set: { mr, alpha: 0, amp: A2, pos: 1 },
        };
      }
      let A; do { A = r.step(150, 310, 10); } while (Math.abs(A - 219.5) < 20);
      const gains = r.chance(0.5), top = gains !== (A < 219.5);
      const opts = [['at the top of the rim', '縁の一番上'], ['at the bottom of the rim', '縁の一番下'], ['level with the staff, to one side', '天真と同じ高さの横'], ['it cannot be told from this', 'これからはわからない']];
      return {
        q: [`On the timegrapher a watch hanging crown down ${gains ? 'gains' : 'loses'} more than in any other vertical position, at an amplitude of ${A}°. Where, at rest, is the heavy spot of its balance most likely to be?`, `タイムグラファーで、りゅうず下に吊るした時計が振り角 ${A}° で、他のどの縦姿勢よりも大きく${gains ? '進み' : '遅れ'}ます。静止時、てんぷの重い点はどこにある可能性が最も高いですか。`],
        a: { type: 'choice', opts, v: top ? 0 : 1 },
        hint: ['The extreme rates come with $\\cos\\alpha = \\pm1$; then use the sign of $J_1(A)$.', '最も極端な歩度は $\\cos\\alpha = \\pm1$ のときです。次に $J_1(A)$ の符号を使います。'],
        sol: [['The largest gain or loss among positions comes with the spot straight up or straight down, where $|\\cos\\alpha| = 1$; a spot level with the staff gives no error at all.', '姿勢の中で最も大きな進みや遅れは、重い点が真上か真下、すなわち $|\\cos\\alpha| = 1$ のときに生じます。天真と同じ高さの重い点は誤差を生みません。'], [`At $${A}^\\circ$, $J_1(A) ${A < 219.5 ? '> 0' : '< 0'}$, so a spot at the bottom makes the watch ${A < 219.5 ? 'gain' : 'lose'}. It ${gains ? 'gains' : 'loses'}, so the spot is at the ${top ? 'top' : 'bottom'}.`, `$${A}^\\circ$ では $J_1(A) ${A < 219.5 ? '> 0' : '< 0'}$ なので、下にある重い点は時計を${A < 219.5 ? '進ませ' : '遅らせ'}ます。時計は${gains ? '進んで' : '遅れて'}いるので、重い点は${top ? '一番上' : '一番下'}にあります。`], ['The watchmaker removes a little metal there, or knows the answer would flip if the amplitude crossed 219.5°.', '時計師はそこの金属を少し削ります。また、振り角が 219.5° をまたぐと答えが逆になることも承知しています。']],
        set: { alpha: top ? 180 : 0, amp: A, pos: 1, mr: 30 },
      };
    },
  ];
})();
