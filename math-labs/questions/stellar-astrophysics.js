'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, lg = Math.log10, rd = (x, k = 3) => Number(x.toPrecision(k)), r2 = (x) => Math.round(x * 100) / 100;
  const G = 6.6743e-11, CL = 299792458, HP = 6.62607015e-34, HB = HP / (2 * PI), ME = 9.1093837015e-31, MU = 1.66053906660e-27, KB = 1.380649e-23;
  const MSUN = 1.98847e30, RSUN = 6.957e8, LSUN = 3.828e26, TSUN = 5772, REARTH = 6.371e6, WIEN = 2.897771955e-3;

  /* Lane-Emden: xi_1 and D = -xi_1^2 theta'(xi_1) by RK4 (cached) */
  const leC = new Map();
  function lane(nn) {
    nn = Math.round(nn * 1000) / 1000;
    if (leC.has(nn)) return leC.get(nn);
    const h = 0.002, f = (x, t, d) => [d, -Math.pow(Math.max(t, 0), nn) - 2 * d / x];
    let xi = 1e-4, th = 1 - xi * xi / 6 + nn * xi ** 4 / 120, dt = -xi / 3 + nn * xi ** 3 / 30, out = null;
    for (let i = 0; i < 100000; i++) {
      const k1 = f(xi, th, dt), k2 = f(xi + h / 2, th + h / 2 * k1[0], dt + h / 2 * k1[1]), k3 = f(xi + h / 2, th + h / 2 * k2[0], dt + h / 2 * k2[1]), k4 = f(xi + h, th + h * k3[0], dt + h * k3[1]);
      const th2 = th + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), dt2 = dt + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (th2 <= 0) { const s = th / (th - th2); const x1 = xi + s * h, d1 = dt + s * (dt2 - dt); out = { xi1: x1, D: -x1 * x1 * d1 }; break; }
      xi += h; th = th2; dt = dt2;
    }
    leC.set(nn, out); return out;
  }
  const ratioC = (nn) => { const e = lane(nn); return e.xi1 ** 3 / (3 * e.D); };                                  // rho_c / mean density
  const wCoef = (nn) => { const e = lane(nn); return e.xi1 ** 4 / (4 * PI * (nn + 1) * e.D ** 2); };               // P_c / (G M^2 / R^4)
  const tCoef = (nn) => 4 * PI / 3 * wCoef(nn) / ratioC(nn);                                                          // k T_c / (mu m_u) / (G M / R)

  /* cold white dwarf (Chandrasekhar), SI; rho in kg/m^3 */
  const ACH = PI * ME ** 4 * CL ** 5 / (3 * HP ** 3);
  const rho0 = (mue) => mue * MU * Math.pow(ME * CL / HB, 3) / (3 * PI ** 2);             // density at x = 1
  function wd(rhoc, mue) {
    const B = rho0(mue), uc = Math.cbrt(rhoc / B) ** 2, Rest = Math.sqrt(4e13 / (G * rhoc)) * 0.5, h = Math.max(2e3, Rest / 250);
    let r = h * 0.01, m = 4 / 3 * PI * r ** 3 * rhoc, u = uc;
    const du = (rr, mm, uu) => -G * mm * B * Math.sqrt(1 + Math.max(uu, 0)) / (4 * ACH * rr * rr), dm = (rr, uu) => 4 * PI * rr * rr * B * Math.pow(Math.max(uu, 0), 1.5);
    for (let i = 0; i < 400000; i++) {
      const a1 = du(r, m, u), b1 = dm(r, u), a2 = du(r + h / 2, m + h / 2 * b1, u + h / 2 * a1), b2 = dm(r + h / 2, u + h / 2 * a1);
      const a3 = du(r + h / 2, m + h / 2 * b2, u + h / 2 * a2), b3 = dm(r + h / 2, u + h / 2 * a2), a4 = du(r + h, m + h * b3, u + h * a3), b4 = dm(r + h, u + h * a3);
      const u2 = u + h / 6 * (a1 + 2 * a2 + 2 * a3 + a4), m2 = m + h / 6 * (b1 + 2 * b2 + 2 * b3 + b4);
      if (u2 <= 0) { const s = u / (u - u2); r += s * h; m += s * (m2 - m); break; }
      r += h; m = m2; u = u2;
    }
    return { M: m, R: r, Msun: m / MSUN, Rearth: r / REARTH };
  }
  const Mch = (mue) => 4 * PI * lane(3).D * Math.pow(Math.cbrt(3 / PI) * HP * CL / (8 * Math.pow(mue * MU, 4 / 3)) / (PI * G), 1.5) / MSUN;
  const msL = (m) => (m < 0.43 ? 0.23 * Math.pow(m, 2.3) : m < 2 ? Math.pow(m, 4) : m < 55 ? 1.4 * Math.pow(m, 3.5) : 32000 * m);
  const CLASSES = [['O', 30000, 50000], ['B', 10000, 30000], ['A', 7500, 10000], ['F', 6000, 7500], ['G', 5200, 6000], ['K', 3700, 5200], ['M', 2400, 3700]];

  /* ---------------- 1. the Hertzsprung-Russell diagram ---------------- */
  Q['star-hr'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Tk = r.pick([3000, 4000, 5000, 5772, 7500, 10000, 15000, 25000]), lam = WIEN * 1e9 / Tk;
        return {
          q: [`A star has surface temperature $T_{\\rm eff} = ${n(Tk)}$ K. At what wavelength, in nm, does its black-body spectrum $B_\\lambda$ peak?`, `星の表面温度は $T_{\\rm eff} = ${n(Tk)}$ K です。黒体スペクトル $B_\\lambda$ が最大になる波長は何 nm ですか。`],
          a: { type: 'num', v: lam, rel: 0.01, unit: ['nm', 'nm'] },
          hint: ['Wien\'s displacement law: $\\lambda_{\\max}T = 2.898$ mm K.', 'ウィーンの変位則 $\\lambda_{\\max}T = 2.898$ mm K を使います。'],
          sol: [[`$\\lambda_{\\max} = 2.898\\times10^{-3}\\ \\text{m K} / ${n(Tk)}\\ \\text{K} = ${sig(lam / 1e9, 3)}$ m.`, `$\\lambda_{\\max} = 2.898\\times10^{-3}\\ \\text{m K} / ${n(Tk)}\\ \\text{K} = ${sig(lam / 1e9, 3)}$ m です。`], [`That is $${sig(lam, 3)}$ nm, ${lam > 750 ? 'in the infrared' : lam < 380 ? 'in the ultraviolet' : 'inside the visible band (380 to 750 nm)'}: hotter stars peak at shorter wavelengths.`, `これは $${sig(lam, 3)}$ nm で、${lam > 750 ? '赤外線' : lam < 380 ? '紫外線' : '可視光の帯（380 から 750 nm）の中'}にあります。高温の星ほど短い波長にピークがあります。`]],
          set: { mode: 1, logT: r2(lg(Tk)), logR: 0 },
        };
      }
      if (form === 1) {
        const lr = r.step(-1, 2, 0.5), R = Math.pow(10, lr), Tk = r.pick([3500, 4500, 5772, 8000, 12000, 20000]);
        const Lr = rd(R * R * Math.pow(Tk / TSUN, 4)), Rans = Math.sqrt(Lr) * Math.pow(TSUN / Tk, 2);
        return {
          q: [`A star has luminosity $L = ${sig(Lr, 3)}\\,L_\\odot$ and surface temperature $T_{\\rm eff} = ${n(Tk)}$ K. What is its radius, in solar radii? (Sun: $T_\\odot = 5772$ K.)`, `ある星の光度は $L = ${sig(Lr, 3)}\\,L_\\odot$、表面温度は $T_{\\rm eff} = ${n(Tk)}$ K です。半径は太陽半径の何倍ですか。（太陽は $T_\\odot = 5772$ K です。）`],
          a: { type: 'num', v: Rans, rel: 0.02, unit: ['$R_\\odot$', '$R_\\odot$'] },
          hint: ['$L = 4\\pi R^2\\sigma T^4$ in solar units reads $L = R^2(T/T_\\odot)^4$.', '$L = 4\\pi R^2\\sigma T^4$ を太陽単位で書くと $L = R^2(T/T_\\odot)^4$ です。'],
          sol: [['Solve the Stefan–Boltzmann law for the radius: $R = \\sqrt{L}\\,(T_\\odot/T)^2$.', 'ステファン・ボルツマンの法則を半径について解くと $R = \\sqrt{L}\\,(T_\\odot/T)^2$ です。'], [`$R = \\sqrt{${sig(Lr, 3)}}\\times(5772/${n(Tk)})^2 = ${sig(Rans, 3)}\\,R_\\odot$.`, `$R = \\sqrt{${sig(Lr, 3)}}\\times(5772/${n(Tk)})^2 = ${sig(Rans, 3)}\\,R_\\odot$ です。`], [Rans > 20 ? 'A cool, luminous star must be huge: a giant.' : Rans < 0.05 ? 'A hot, faint star must be tiny: a white dwarf.' : 'A star of roughly solar size, as on the main sequence.', Rans > 20 ? '冷たくて明るい星は巨大でなければならず、巨星です。' : Rans < 0.05 ? '熱くて暗い星は小さくなければならず、白色矮星です。' : '太陽と同程度の大きさで、主系列の星に当たります。']],
          set: { mode: 1, logT: r2(lg(Tk)), logR: lr },
        };
      }
      const k = r.int(0, 6), c = CLASSES[k], T0 = r.step(Math.ceil(c[1] / 100) * 100 + 200, Math.floor(c[2] / 100) * 100 - 200, 100);
      return {
        q: [`Which spectral class has a surface temperature of about $${n(T0)}$ K?`, `表面温度がおよそ $${n(T0)}$ K の星は、どのスペクトル型ですか。`],
        a: { type: 'choice', fixed: true, v: k, opts: CLASSES.map((x) => [x[0], x[0]]) },
        hint: ['The sequence O B A F G K M runs from hot to cool; the Sun (5772 K) is G.', 'O B A F G K M の順に高温から低温になります。太陽（5772 K）は G 型です。'],
        sol: [[`The classes cover O above 30000 K, B 10000 to 30000, A 7500 to 10000, F 6000 to 7500, G 5200 to 6000, K 3700 to 5200 and M below 3700 K.`, `O 型は 30000 K 以上、B 型は 10000 から 30000 K、A 型は 7500 から 10000 K、F 型は 6000 から 7500 K、G 型は 5200 から 6000 K、K 型は 3700 から 5200 K、M 型は 3700 K 以下です。`], [`$${n(T0)}$ K lies in class ${c[0]}.`, `$${n(T0)}$ K は ${c[0]} 型の範囲にあります。`]],
        set: { mode: 1, logT: r2(lg(T0)), logR: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const m = r.pick([1.2, 1.4, 1.5, 1.6, 1.8, 1.9]), Tk = TSUN * Math.pow(m, 0.7);
        return {
          q: [`On the main sequence between 1 and 2 solar masses take $L/L_\\odot = (M/M_\\odot)^4$ and $R/R_\\odot = (M/M_\\odot)^{0.6}$. What is the surface temperature of a $${n(m)}\\,M_\\odot$ star, in K?`, `主系列で太陽質量の 1 倍から 2 倍の間では、$L/L_\\odot = (M/M_\\odot)^4$、$R/R_\\odot = (M/M_\\odot)^{0.6}$ とします。$${n(m)}\\,M_\\odot$ の星の表面温度は何 K ですか。`],
          a: { type: 'num', v: Tk, rel: 0.01, unit: ['K', 'K'] },
          hint: ['$T = T_\\odot\\,(L/R^2)^{1/4}$ in solar units.', '太陽単位では $T = T_\\odot\\,(L/R^2)^{1/4}$ です。'],
          sol: [[`$L = ${n(m)}^4 = ${n(Math.pow(m, 4), 4)}$ and $R = ${n(m)}^{0.6} = ${n(Math.pow(m, 0.6), 4)}$.`, `$L = ${n(m)}^4 = ${n(Math.pow(m, 4), 4)}$、$R = ${n(m)}^{0.6} = ${n(Math.pow(m, 0.6), 4)}$ です。`], [`$T = 5772\\,(${n(Math.pow(m, 4), 4)}/${n(Math.pow(m, 1.2), 4)})^{1/4} = 5772\\times${n(m)}^{0.7} = ${sig(Tk, 4)}$ K.`, `$T = 5772\\,(${n(Math.pow(m, 4), 4)}/${n(Math.pow(m, 1.2), 4)})^{1/4} = 5772\\times${n(m)}^{0.7} = ${sig(Tk, 4)}$ K です。`], ['Heavier main-sequence stars are hotter, though temperature rises only as $M^{0.7}$ while luminosity rises as $M^4$.', '重い主系列星ほど高温ですが、温度は $M^{0.7}$ でしか上がらず、光度は $M^4$ で上がります。']],
          set: { mode: 0, logM: r2(lg(m)) },
        };
      }
      if (form === 1) {
        const m = r.pick([2.5, 3, 4, 5, 8, 10, 15, 20, 30]), Lr = rd(msL(m)), t = 1e4 * m / Lr;
        return {
          q: [`A main-sequence star of $${n(m)}\\,M_\\odot$ has luminosity $L = ${sig(Lr, 3)}\\,L_\\odot$. Using $t_{\\rm MS} \\approx 10\\ \\text{Gyr}\\times (M/M_\\odot)/(L/L_\\odot)$, estimate its hydrogen-burning lifetime in millions of years.`, `質量 $${n(m)}\\,M_\\odot$ の主系列星の光度は $L = ${sig(Lr, 3)}\\,L_\\odot$ です。$t_{\\rm MS} \\approx 10\\ \\text{Gyr}\\times (M/M_\\odot)/(L/L_\\odot)$ を使って、水素燃焼の寿命を百万年単位で見積もってください。`],
          a: { type: 'num', v: t, rel: 0.03, unit: ['Myr', 'Myr'] },
          hint: ['Fuel supply divided by burning rate: the star has $M$ times the Sun\'s fuel but spends it $L$ times faster.', '燃料の量を燃やす速さで割ります。燃料は太陽の $M$ 倍ですが、$L$ 倍の速さで使います。'],
          sol: [[`$t = 10\\ \\text{Gyr}\\times ${n(m)}/${sig(Lr, 3)} = ${sig(t / 1000, 3)}$ Gyr.`, `$t = 10\\ \\text{Gyr}\\times ${n(m)}/${sig(Lr, 3)} = ${sig(t / 1000, 3)}$ Gyr です。`], [`That is $${sig(t, 3)}$ Myr, ${sig(1e4 / t, 2)} times shorter than the Sun\'s 10 Gyr.`, `これは $${sig(t, 3)}$ Myr で、太陽の 10 Gyr の約 ${sig(1e4 / t, 2)} 分の 1 です。`]],
          set: { mode: 0, logM: r2(lg(m)) },
        };
      }
      const lam = r.pick([300, 400, 500, 600, 800]), lr = r.step(-1, 1, 0.5), R = rd(Math.pow(10, lr)), Tk = WIEN * 1e9 / lam, Lans = R * R * Math.pow(Tk / TSUN, 4);
      return {
        q: [`A star\'s spectrum peaks at $${n(lam)}$ nm and its radius is $${sig(R, 3)}\\,R_\\odot$. What is its luminosity in solar units? (Sun: $T_\\odot = 5772$ K.)`, `ある星のスペクトルは $${n(lam)}$ nm にピークをもち、半径は $${sig(R, 3)}\\,R_\\odot$ です。光度は太陽の何倍ですか。（太陽は $T_\\odot = 5772$ K です。）`],
        a: { type: 'num', v: Lans, rel: 0.04, unit: ['$L_\\odot$', '$L_\\odot$'] },
        hint: ['First the temperature from Wien\'s law, then $L = R^2(T/T_\\odot)^4$.', 'まずウィーンの法則で温度を求め、次に $L = R^2(T/T_\\odot)^4$ を使います。'],
        sol: [[`$T = 2.898\\times10^{-3}/(${n(lam)}\\times10^{-9}) = ${sig(Tk, 3)}$ K.`, `$T = 2.898\\times10^{-3}/(${n(lam)}\\times10^{-9}) = ${sig(Tk, 3)}$ K です。`], [`$L = ${sig(R, 3)}^2\\times(${sig(Tk, 3)}/5772)^4 = ${sig(Lans, 3)}\\,L_\\odot$.`, `$L = ${sig(R, 3)}^2\\times(${sig(Tk, 3)}/5772)^4 = ${sig(Lans, 3)}\\,L_\\odot$ です。`], ['Luminosity depends on the fourth power of temperature, so a modest change in the peak wavelength moves $L$ a great deal.', '光度は温度の 4 乗に依存するので、ピーク波長が少し変わるだけで $L$ は大きく変わります。']],
        set: { mode: 1, logT: r2(lg(Tk)), logR: lr },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const rng = r.int(0, 1), ex = rng ? (3.5 - 1.2) / 4 : (4 - 1.8) / 4;
        return {
          q: [rng ? 'On the main sequence between 2 and 55 solar masses, $L \\propto M^{3.5}$ and $R \\propto M^{0.6}$. The surface temperature then scales as $T_{\\rm eff} \\propto M^a$. Find $a$.' : 'On the main sequence between 0.43 and 1 solar mass, $L \\propto M^{4}$ and $R \\propto M^{0.9}$. The surface temperature then scales as $T_{\\rm eff} \\propto M^a$. Find $a$.', rng ? '主系列で太陽質量の 2 倍から 55 倍の間では $L \\propto M^{3.5}$、$R \\propto M^{0.6}$ です。このとき表面温度は $T_{\\rm eff} \\propto M^a$ と変わります。$a$ を求めてください。' : '主系列で太陽質量の 0.43 倍から 1 倍の間では $L \\propto M^{4}$、$R \\propto M^{0.9}$ です。このとき表面温度は $T_{\\rm eff} \\propto M^a$ と変わります。$a$ を求めてください。'],
          a: { type: 'num', v: ex, tol: 0.003 },
          hint: ['Take logarithms of $T^4 = L/(4\\pi\\sigma R^2)$.', '$T^4 = L/(4\\pi\\sigma R^2)$ の対数をとります。'],
          sol: [['$T^4 \\propto L/R^2$, so the exponent of $M$ in $T^4$ is the exponent in $L$ minus twice the exponent in $R$.', '$T^4 \\propto L/R^2$ なので、$T^4$ における $M$ の指数は、$L$ の指数から $R$ の指数の 2 倍を引いたものです。'], [rng ? '$4a = 3.5 - 2\\times0.6 = 2.3$, so $a = 0.575$.' : '$4a = 4 - 2\\times0.9 = 2.2$, so $a = 0.55$.', rng ? '$4a = 3.5 - 2\\times0.6 = 2.3$ より $a = 0.575$ です。' : '$4a = 4 - 2\\times0.9 = 2.2$ より $a = 0.55$ です。'], ['Temperature grows much more slowly than luminosity: the main sequence is a diagonal band, not a vertical one.', '温度は光度よりずっとゆっくり上がります。そのため主系列は垂直ではなく斜めの帯になります。']],
          set: { mode: 0, logM: rng ? 0.7 : -0.15 },
        };
      }
      if (form === 1) {
        return {
          q: ['For a main-sequence star between 2 and 55 solar masses, $L/L_\\odot = 1.4\\,(M/M_\\odot)^{3.5}$. Write its lifetime $t_{\\rm MS}/(10\\ \\text{Gyr})$ as a function of $m = M/M_\\odot$ (type m).', '主系列で太陽質量の 2 倍から 55 倍の星では $L/L_\\odot = 1.4\\,(M/M_\\odot)^{3.5}$ です。寿命 $t_{\\rm MS}/(10\\ \\text{Gyr})$ を $m = M/M_\\odot$ の関数で書いてください（$m$ は m と入力）。'],
          a: { type: 'expr', v: '1/(1.4*m^2.5)', vars: ['m'], dom: { m: [2, 20] }, lhs: ['$\\dfrac{t_{\\rm MS}}{10\\ \\text{Gyr}} =$', '$\\dfrac{t_{\\rm MS}}{10\\ \\text{Gyr}} =$'] },
          hint: ['Lifetime is fuel over burn rate: $m/(L/L_\\odot)$.', '寿命は燃料を燃焼率で割ったもので、$m/(L/L_\\odot)$ です。'],
          sol: [['$t_{\\rm MS}/(10\\ \\text{Gyr}) = m/(L/L_\\odot) = m/(1.4\\,m^{3.5})$.', '$t_{\\rm MS}/(10\\ \\text{Gyr}) = m/(L/L_\\odot) = m/(1.4\\,m^{3.5})$ です。'], ['$= 1/(1.4\\,m^{2.5})$.', '$= 1/(1.4\\,m^{2.5})$ です。'], ['Doubling the mass shortens the life by a factor $2^{2.5} = 5.7$: lifetime falls as $M^{-2.5}$ even though the fuel supply grows as $M$.', '質量を 2 倍にすると寿命は $2^{2.5} = 5.7$ 分の 1 になります。燃料は $M$ に比例して増えるのに、寿命は $M^{-2.5}$ で短くなります。']],
          set: { mode: 0, logM: 0.7 },
        };
      }
      if (form === 2) {
        const choice = r.int(0, 1);
        if (choice === 0) {
          const kk = r.pick([100, 400, 900, 2500]), s = Math.sqrt(kk);
          return {
            q: [`Two stars have the same surface temperature, but star A is $${n(kk)}$ times as luminous as star B. How many times larger is the radius of A?`, `二つの星の表面温度は同じですが、星 A の光度は星 B の $${n(kk)}$ 倍です。A の半径は B の何倍ですか。`],
            a: { type: 'num', v: s, rel: 0.005 },
            hint: ['At fixed $T$, $L \\propto R^2$.', '温度が一定なら $L \\propto R^2$ です。'],
            sol: [['$L = 4\\pi R^2\\sigma T^4$, so at equal $T$ the ratio of luminosities is the ratio of surface areas, $(R_A/R_B)^2$.', '$L = 4\\pi R^2\\sigma T^4$ なので、$T$ が等しければ光度の比は表面積の比 $(R_A/R_B)^2$ です。'], [`$R_A/R_B = \\sqrt{${n(kk)}} = ${n(s)}$.`, `$R_A/R_B = \\sqrt{${n(kk)}} = ${n(s)}$ です。`], ['On the diagram this is the vertical gap between two stars of the same temperature, and lines of constant radius are what make it readable.', '図では同じ温度の二つの星の縦方向の隔たりに当たり、等半径線がそれを読み取りやすくしています。']],
          };
        }
        const wd = r.chance(0.5);
        const T0 = wd ? r.pick([16000, 20000, 25000, 30000]) : r.pick([3400, 3600, 3800]), L0 = wd ? r.pick([0.01, 0.03, 0.06, 0.1]) : r.pick([5e4, 1e5, 2e5]);
        const R0 = Math.sqrt(L0) * Math.pow(TSUN / T0, 2);
        const ans = wd ? R0 * RSUN / REARTH : R0;
        return {
          q: wd ? [`A star has $T_{\\rm eff} = ${n(T0)}$ K and $L = ${sig(L0, 2)}\\,L_\\odot$. Find its radius in Earth radii (1 $R_\\odot$ = 109.2 $R_\\oplus$).`, `ある星は $T_{\\rm eff} = ${n(T0)}$ K、$L = ${sig(L0, 2)}\\,L_\\odot$ です。半径を地球半径の単位で求めてください（1 $R_\\odot$ = 109.2 $R_\\oplus$）。`]
            : [`A red supergiant has $T_{\\rm eff} = ${n(T0)}$ K and $L = ${sig(L0, 2)}\\,L_\\odot$. Find its radius in solar radii.`, `ある赤色超巨星は $T_{\\rm eff} = ${n(T0)}$ K、$L = ${sig(L0, 2)}\\,L_\\odot$ です。半径を太陽半径の単位で求めてください。`],
          a: { type: 'num', v: ans, rel: 0.02, unit: wd ? ['$R_\\oplus$', '$R_\\oplus$'] : ['$R_\\odot$', '$R_\\odot$'] },
          hint: ['$R/R_\\odot = \\sqrt{L/L_\\odot}\\,(T_\\odot/T)^2$.', '$R/R_\\odot = \\sqrt{L/L_\\odot}\\,(T_\\odot/T)^2$ です。'],
          sol: [[`$R = \\sqrt{${sig(L0, 2)}}\\times(5772/${n(T0)})^2 = ${sig(R0, 3)}\\,R_\\odot$.`, `$R = \\sqrt{${sig(L0, 2)}}\\times(5772/${n(T0)})^2 = ${sig(R0, 3)}\\,R_\\odot$ です。`], wd ? [`In Earth radii: $${sig(R0, 3)}\\times109.2 = ${sig(ans, 3)}\\,R_\\oplus$, a white dwarf about the size of the Earth.`, `地球半径では $${sig(R0, 3)}\\times109.2 = ${sig(ans, 3)}\\,R_\\oplus$ で、地球ほどの大きさの白色矮星です。`] : [`That is about ${n(Math.round(R0 / 215 * 10) / 10)} AU: roughly the orbit of ${R0 / 215 > 2 ? 'Jupiter' : 'Mars'}.`, `約 ${n(Math.round(R0 / 215 * 10) / 10)} AU で、${R0 / 215 > 2 ? '木星' : '火星'}の軌道ほどの大きさです。`]],
          set: { mode: 1, logT: r2(lg(T0)), logR: Math.max(-2, Math.min(3, Math.round(lg(R0) * 20) / 20)) },
        };
      }
      return {
        q: ['In solar units ($L = L/L_\\odot$, $R = R/R_\\odot$, $T = T_{\\rm eff}/5772$ K) write the luminosity of a star as a function of its radius R and temperature T (type R and T).', '太陽単位（$L = L/L_\\odot$、$R = R/R_\\odot$、$T = T_{\\rm eff}/5772$ K）で、星の光度を半径 R と温度 T の関数として書いてください（R と T で入力）。'],
        a: { type: 'expr', v: 'R^2*T^4', vars: ['R', 'T'], lhs: ['$L =$', '$L =$'] },
        hint: ['Divide $4\\pi R^2\\sigma T^4$ by the same expression for the Sun.', '$4\\pi R^2\\sigma T^4$ を太陽の同じ式で割ります。'],
        sol: [['$L = 4\\pi R^2\\sigma T_{\\rm eff}^4$ and the same for the Sun; the constants cancel in the ratio.', '$L = 4\\pi R^2\\sigma T_{\\rm eff}^4$ で、太陽についても同じ式が成り立ち、比をとると定数が消えます。'], ['$L = R^2T^4$ in these units.', 'この単位では $L = R^2T^4$ です。'], [`Check: doubling the temperature at fixed radius multiplies $L$ by 16; doubling the radius at fixed temperature multiplies it by 4.`, `確かめ：半径を固定して温度を 2 倍にすると $L$ は 16 倍に、温度を固定して半径を 2 倍にすると $L$ は 4 倍になります。`]],
        set: { mode: 1 },
      };
    },
  ];

  /* ---------------- 2. hydrostatic equilibrium and the polytrope ---------------- */
  Q['star-polytrope'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        return {
          q: ['For $n = 0$ (a constant-density star) the Lane–Emden solution is $\\theta(\\xi) = 1 - \\xi^2/6$. At what $\\xi_1$ does the density reach its surface value $\\theta = 0$?', '$n = 0$（密度が一様な星）のレーン・エムデン方程式の解は $\\theta(\\xi) = 1 - \\xi^2/6$ です。密度が表面の値 $\\theta = 0$ になる $\\xi_1$ はいくつですか。'],
          a: { type: 'num', v: Math.sqrt(6), rel: 0.002, show: '\\sqrt6' },
          hint: ['Set $1 - \\xi^2/6 = 0$.', '$1 - \\xi^2/6 = 0$ とおきます。'],
          sol: [['$\\xi_1^2 = 6$, so $\\xi_1 = \\sqrt6 = 2.449$.', '$\\xi_1^2 = 6$ より $\\xi_1 = \\sqrt6 = 2.449$ です。'], ['The radius is $R = a\\xi_1$ where $a$ is the scale length set by the central density.', '半径は $R = a\\xi_1$ で、$a$ は中心密度で決まる尺度の長さです。']],
          set: { n: 0 },
        };
      }
      if (form === 1) {
        const xi = r.pick([0.5, 1, 1.5, 2, 2.5, 3]);
        return {
          q: [`For $n = 1$ the solution is $\\theta(\\xi) = \\sin\\xi/\\xi$. Find $\\rho/\\rho_c$ at $\\xi = ${n(xi)}$.`, `$n = 1$ の解は $\\theta(\\xi) = \\sin\\xi/\\xi$ です。$\\xi = ${n(xi)}$ での $\\rho/\\rho_c$ を求めてください。`],
          a: { type: 'num', v: Math.sin(xi) / xi, tol: 0.002 },
          hint: ['For $n = 1$, $\\rho/\\rho_c = \\theta^1$.', '$n = 1$ では $\\rho/\\rho_c = \\theta^1$ です。'],
          sol: [[`$\\rho/\\rho_c = \\theta^n = \\theta = \\sin ${n(xi)}/${n(xi)} = ${n(Math.sin(xi) / xi, 4)}$.`, `$\\rho/\\rho_c = \\theta^n = \\theta = \\sin ${n(xi)}/${n(xi)} = ${n(Math.sin(xi) / xi, 4)}$ です。`], ['The surface is at $\\xi_1 = \\pi$, where $\\sin\\xi$ first returns to zero.', '表面は $\\xi_1 = \\pi$、つまり $\\sin\\xi$ が初めて 0 に戻るところです。']],
          set: { n: 1 },
        };
      }
      const nn = r.pick([1.5, 2, 3]), th = r.pick([0.5, 0.7, 0.8, 0.9]), askP = r.chance(0.5);
      const v = Math.pow(th, askP ? nn + 1 : nn);
      return {
        q: [`In a polytrope of index $n = ${n(nn)}$ the Lane–Emden function has fallen to $\\theta = ${n(th)}$ at some radius. What is ${askP ? '$P/P_c$' : '$\\rho/\\rho_c$'} there?`, `指数 $n = ${n(nn)}$ のポリトロープで、ある半径においてレーン・エムデン関数が $\\theta = ${n(th)}$ に下がっています。そこでの ${askP ? '$P/P_c$' : '$\\rho/\\rho_c$'} はいくつですか。`],
        a: { type: 'num', v, tol: 0.002 },
        hint: askP ? ['$P = P_c\\,\\theta^{n+1}$.', '$P = P_c\\,\\theta^{n+1}$ です。'] : ['$\\rho = \\rho_c\\,\\theta^{n}$.', '$\\rho = \\rho_c\\,\\theta^{n}$ です。'],
        sol: [[askP ? `$P/P_c = \\theta^{n+1} = ${n(th)}^{${n(nn + 1)}} = ${n(v, 4)}$.` : `$\\rho/\\rho_c = \\theta^{n} = ${n(th)}^{${n(nn)}} = ${n(v, 4)}$.`, askP ? `$P/P_c = \\theta^{n+1} = ${n(th)}^{${n(nn + 1)}} = ${n(v, 4)}$ です。` : `$\\rho/\\rho_c = \\theta^{n} = ${n(th)}^{${n(nn)}} = ${n(v, 4)}$ です。`], ['Pressure falls faster than density, and temperature $T \\propto P/\\rho = \\theta$ falls slowest of the three.', '圧力は密度より速く下がり、温度 $T \\propto P/\\rho = \\theta$ は三つの中で最もゆっくり下がります。']],
        set: { n: nn },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const nn = r.pick([1.5, 2, 2.5, 3, 3.5, 4]), M = r.pick([0.5, 1, 2, 5]), R = r.pick([0.5, 1, 2, 3]);
        const rb = 3 * M * MSUN / (4 * PI * Math.pow(R * RSUN, 3)) / 1000, rc = ratioC(nn) * rb;
        return {
          q: [`A star of $${n(M)}\\,M_\\odot$ and radius $${n(R)}\\,R_\\odot$ is modelled as a polytrope of index $n = ${n(nn)}$. Find its central density in g/cm³. (The ratio $\\rho_c/\\bar\\rho$ is shown in the figure's readout.)`, `質量 $${n(M)}\\,M_\\odot$、半径 $${n(R)}\\,R_\\odot$ の星を指数 $n = ${n(nn)}$ のポリトロープとしてモデル化します。中心密度は何 g/cm³ ですか。（比 $\\rho_c/\\bar\\rho$ は図の読み出しに表示されます。）`],
          a: { type: 'num', v: rc, rel: 0.01, unit: ['g/cm³', 'g/cm³'] },
          hint: ['Mean density $\\bar\\rho = 3M/4\\pi R^3$; then multiply by $\\rho_c/\\bar\\rho = \\xi_1/(3|\\theta_1\'|)$.', '平均密度 $\\bar\\rho = 3M/4\\pi R^3$ に $\\rho_c/\\bar\\rho = \\xi_1/(3|\\theta_1\'|)$ をかけます。'],
          sol: [[`$\\bar\\rho = 3M/(4\\pi R^3) = ${sig(rb, 3)}$ g/cm³.`, `$\\bar\\rho = 3M/(4\\pi R^3) = ${sig(rb, 3)}$ g/cm³ です。`], [`For $n = ${n(nn)}$, $\\xi_1 = ${n(lane(nn).xi1, 4)}$ and $\\rho_c/\\bar\\rho = ${n(ratioC(nn), 4)}$.`, `$n = ${n(nn)}$ では $\\xi_1 = ${n(lane(nn).xi1, 4)}$、$\\rho_c/\\bar\\rho = ${n(ratioC(nn), 4)}$ です。`], [`$\\rho_c = ${n(ratioC(nn), 4)}\\times${sig(rb, 3)} = ${sig(rc, 3)}$ g/cm³.`, `$\\rho_c = ${n(ratioC(nn), 4)}\\times${sig(rb, 3)} = ${sig(rc, 3)}$ g/cm³ です。`]],
          set: { n: nn, mass: M, rad: R },
        };
      }
      if (form === 1) {
        const nn = r.pick([1.5, 2, 3, 4]), M = r.pick([0.5, 1, 2, 5]), R = r.pick([0.5, 1, 2]), mu = r.pick([0.5, 0.6, 0.62, 1]);
        const Tc = tCoef(nn) * mu * MU * G * M * MSUN / (R * RSUN * KB) / 1e6;
        const Pc = wCoef(nn) * G * Math.pow(M * MSUN, 2) / Math.pow(R * RSUN, 4), rc = ratioC(nn) * 3 * M * MSUN / (4 * PI * Math.pow(R * RSUN, 3));
        return {
          q: [`A star of $${n(M)}\\,M_\\odot$ and $${n(R)}\\,R_\\odot$ with mean molecular weight $\\mu = ${n(mu)}$ is an $n = ${n(nn)}$ polytrope with central pressure $P_c = ${sig(Pc, 3)}$ Pa and central density $\\rho_c = ${sig(rc, 3)}$ kg/m³. What is its central temperature in millions of kelvin? (Ideal gas: $P = \\rho kT/\\mu m_u$.)`, `質量 $${n(M)}\\,M_\\odot$、半径 $${n(R)}\\,R_\\odot$、平均分子量 $\\mu = ${n(mu)}$ の星は、中心圧力 $P_c = ${sig(Pc, 3)}$ Pa、中心密度 $\\rho_c = ${sig(rc, 3)}$ kg/m³ の $n = ${n(nn)}$ のポリトロープです。中心温度は百万 K 単位でいくつですか。（理想気体 $P = \\rho kT/\\mu m_u$ を使います。）`],
          a: { type: 'num', v: Tc, rel: 0.015, unit: ['MK', 'MK'] },
          hint: ['Solve the ideal gas law for $T$: $T_c = \\mu m_u P_c/(k\\rho_c)$.', '理想気体の式を $T$ について解くと $T_c = \\mu m_u P_c/(k\\rho_c)$ です。'],
          sol: [[`$T_c = \\mu m_u P_c/(k\\rho_c) = ${n(mu)}\\times1.661\\times10^{-27}\\times${sig(Pc, 3)}/(1.381\\times10^{-23}\\times${sig(rc, 3)})$.`, `$T_c = \\mu m_u P_c/(k\\rho_c) = ${n(mu)}\\times1.661\\times10^{-27}\\times${sig(Pc, 3)}/(1.381\\times10^{-23}\\times${sig(rc, 3)})$ です。`], [`$T_c = ${sig(Tc, 3)}$ MK.`, `$T_c = ${sig(Tc, 3)}$ MK です。`], ['The virial scaling $T_c \\propto \\mu M/R$ says why: a heavier or more compact star must be hotter inside to be held up.', 'ビリアル則 $T_c \\propto \\mu M/R$ が理由を示します。重い星やコンパクトな星ほど、支えるために内部が熱くなければなりません。']],
          set: { n: nn, mass: M, rad: R, mu },
        };
      }
      const s = r.pick([0.25, 0.5, 0.75]), xi = PI * s, f = (Math.sin(xi) - xi * Math.cos(xi)) / PI;
      return {
        q: [`For $n = 1$ the enclosed mass fraction is $m/M = (\\sin\\xi - \\xi\\cos\\xi)/\\pi$ with $\\xi = \\pi\\,r/R$. What fraction of the star\'s mass lies inside $r = ${n(s)}\\,R$?`, `$n = 1$ では内側の質量の割合は $m/M = (\\sin\\xi - \\xi\\cos\\xi)/\\pi$ で、$\\xi = \\pi\\,r/R$ です。$r = ${n(s)}\\,R$ の内側には質量の何割がありますか。`],
        a: { type: 'num', v: f, tol: 0.002 },
        hint: [`Here $\\xi = ${n(s)}\\pi$.`, `ここでは $\\xi = ${n(s)}\\pi$ です。`],
        sol: [[`$\\xi = ${n(s)}\\pi = ${n(xi, 4)}$.`, `$\\xi = ${n(s)}\\pi = ${n(xi, 4)}$ です。`], [`$m/M = (\\sin ${n(xi, 4)} - ${n(xi, 4)}\\cos ${n(xi, 4)})/\\pi = ${n(f, 4)}$.`, `$m/M = (\\sin ${n(xi, 4)} - ${n(xi, 4)}\\cos ${n(xi, 4)})/\\pi = ${n(f, 4)}$ です。`], [`A uniform ball would have $${n(Math.pow(s, 3), 4)}$ there; the centrally condensed star has ${f > Math.pow(s, 3) ? 'more' : 'less'} mass inside.`, `一様な球ならそこで $${n(Math.pow(s, 3), 4)}$ ですが、中心に集中した星の内側にはより${f > Math.pow(s, 3) ? '多く' : '少なく'}の質量があります。`]],
        set: { n: 1, s },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        return {
          q: ['A uniform sphere ($n = 0$) of mass $M$ and radius $R$ is in hydrostatic equilibrium, $dP/dr = -Gm\\rho/r^2$. Find its central pressure as a function of G, M and R (type G, M, R).', '質量 $M$、半径 $R$ の一様な球（$n = 0$）が流体静力学的平衡 $dP/dr = -Gm\\rho/r^2$ にあります。中心圧力を G、M、R の関数で書いてください（G、M、R で入力）。'],
          a: { type: 'expr', v: '3*G*M^2/(8*pi*R^4)', vars: ['G', 'M', 'R'], lhs: ['$P_c =$', '$P_c =$'] },
          hint: ['Inside a uniform ball $m(r) = M r^3/R^3$ and $\\rho = 3M/4\\pi R^3$; integrate $dP/dr$ from the centre to the surface where $P = 0$.', '一様な球の内部では $m(r) = M r^3/R^3$、$\\rho = 3M/4\\pi R^3$ です。中心から $P = 0$ の表面まで $dP/dr$ を積分します。'],
          sol: [['$dP/dr = -G\\,(M r^3/R^3)(3M/4\\pi R^3)/r^2 = -\\dfrac{3GM^2}{4\\pi R^6}\\,r$.', '$dP/dr = -G\\,(M r^3/R^3)(3M/4\\pi R^3)/r^2 = -\\dfrac{3GM^2}{4\\pi R^6}\\,r$ です。'], ['Integrate from $0$ to $R$ with $P(R) = 0$: $P_c = \\dfrac{3GM^2}{4\\pi R^6}\\cdot\\dfrac{R^2}{2} = \\dfrac{3GM^2}{8\\pi R^4}$.', '$P(R) = 0$ のもとで $0$ から $R$ まで積分すると $P_c = \\dfrac{3GM^2}{4\\pi R^6}\\cdot\\dfrac{R^2}{2} = \\dfrac{3GM^2}{8\\pi R^4}$ です。'], ['This is the $0.119\\,GM^2/R^4$ the figure\'s central-pressure readout gives for $n = 0$.', '$n = 0$ で図の中心圧力の読み出しが与える $0.119\\,GM^2/R^4$ です。']],
          set: { n: 0 },
        };
      }
      if (form === 1) {
        return {
          q: ['For $n = 1$ the Lane–Emden solution is $\\theta = \\sin\\xi/\\xi$ and $m/M = (\\sin\\xi - \\xi\\cos\\xi)/\\pi$. Write the pressure ratio $P/P_c$ as a function of $\\xi$ (type x for $\\xi$).', '$n = 1$ のレーン・エムデン方程式の解は $\\theta = \\sin\\xi/\\xi$ です。圧力の比 $P/P_c$ を $\\xi$ の関数で書いてください（$\\xi$ は x と入力）。'],
          a: { type: 'expr', v: '(sin(x)/x)^2', vars: ['x'], dom: { x: [0.4, 2.8] }, lhs: ['$P/P_c =$', '$P/P_c =$'] },
          hint: ['$P = P_c\\,\\theta^{n+1}$ with $n = 1$.', '$n = 1$ で $P = P_c\\,\\theta^{n+1}$ です。'],
          sol: [['$P/P_c = \\theta^{n+1} = \\theta^2$.', '$P/P_c = \\theta^{n+1} = \\theta^2$ です。'], ['So $P/P_c = (\\sin\\xi/\\xi)^2$, which reaches zero at the surface $\\xi_1 = \\pi$.', '$P/P_c = (\\sin\\xi/\\xi)^2$ で、表面 $\\xi_1 = \\pi$ でゼロになります。'], ['Pressure is the square of the density profile here, so it is more sharply peaked at the centre.', 'ここでは圧力は密度分布の 2 乗なので、中心でより鋭いピークをもちます。']],
          set: { n: 1 },
        };
      }
      if (form === 2) {
        const nn = r.pick([1.5, 2, 2.5, 3, 3.5, 4]), v = ratioC(nn);
        return {
          q: [`A model of a star has a central density ${n(Number(sig(v, 3)))} times its mean density. Which polytropic index $n$ (to the nearest 0.5) does this correspond to?`, `ある星のモデルでは、中心密度が平均密度の ${n(Number(sig(v, 3)))} 倍です。これに対応するポリトロープ指数 $n$ はいくつですか（0.5 刻みで）。`],
          a: { type: 'num', v: nn, tol: 0.26 },
          hint: ['Slide $n$ in the figure and watch $\\rho_c/\\bar\\rho$: it grows quickly with $n$ (1 at $n = 0$).', '図で $n$ を動かして $\\rho_c/\\bar\\rho$ を見てください。$n$ とともに急に大きくなります（$n = 0$ で 1 です）。'],
          sol: [[`The ratio is a steeply rising function of $n$: 1 for $n = 0$, 3.29 for $n = 1$, ${n(ratioC(1.5), 3)} for $n = 1.5$, ${n(ratioC(2), 3)} for $n = 2$, ${n(ratioC(3), 3)} for $n = 3$.`, `この比は $n$ とともに急激に増えます。$n = 0$ で 1、$n = 1$ で 3.29、$n = 1.5$ で ${n(ratioC(1.5), 3)}、$n = 2$ で ${n(ratioC(2), 3)}、$n = 3$ で ${n(ratioC(3), 3)} です。`], [`A ratio of ${n(Number(sig(v, 3)))} matches $n = ${n(nn)}$ (where $\\xi_1 = ${n(lane(nn).xi1, 4)}$).`, `比 ${n(Number(sig(v, 3)))} は $n = ${n(nn)}$（$\\xi_1 = ${n(lane(nn).xi1, 4)}$）に対応します。`]],
          set: { n: nn },
        };
      }
      const nn = 3, mu = r.pick([0.6, 0.62, 0.5]), Rr = r.pick([0.5, 1, 2, 4]), Tt = r.pick([10, 12, 15, 20]);
      const Mneed = Tt * 1e6 * KB * Rr * RSUN / (tCoef(nn) * mu * MU * G) / MSUN;
      return {
        q: [`An $n = 3$ star of radius $${n(Rr)}\\,R_\\odot$ and mean molecular weight $\\mu = ${n(mu)}$ is to have a central temperature of $${n(Tt)}$ million K. What mass, in solar masses, does it need? (For $n = 3$, $kT_c\\,R/(\\mu m_u GM) = ${n(tCoef(nn), 4)}$.)`, `半径 $${n(Rr)}\\,R_\\odot$、平均分子量 $\\mu = ${n(mu)}$ の $n = 3$ の星の中心温度を $${n(Tt)}$ 百万 K にするには、質量が太陽質量の何倍必要ですか。（$n = 3$ では $kT_c\\,R/(\\mu m_u GM) = ${n(tCoef(nn), 4)}$ です。）`],
        a: { type: 'num', v: Mneed, rel: 0.015, unit: ['$M_\\odot$', '$M_\\odot$'] },
        hint: ['Solve $T_c = c_T\\,\\mu m_u GM/(kR)$ for $M$.', '$T_c = c_T\\,\\mu m_u GM/(kR)$ を $M$ について解きます。'],
        sol: [[`$M = kT_cR/(c_T\\,\\mu m_u G)$ with $T_c = ${n(Tt)}\\times10^6$ K and $R = ${n(Rr)}\\times6.957\\times10^8$ m.`, `$M = kT_cR/(c_T\\,\\mu m_u G)$ で、$T_c = ${n(Tt)}\\times10^6$ K、$R = ${n(Rr)}\\times6.957\\times10^8$ m です。`], [`$M = ${sig(Mneed * MSUN, 3)}$ kg $= ${sig(Mneed, 3)}\\,M_\\odot$.`, `$M = ${sig(Mneed * MSUN, 3)}$ kg $= ${sig(Mneed, 3)}\\,M_\\odot$ です。`], ['At fixed radius the required mass is proportional to the central temperature; this is how the minimum mass for hydrogen burning arises.', '半径を固定すると必要な質量は中心温度に比例します。水素燃焼に必要な最小質量が現れるのはこのためです。']],
        set: { n: nn, rad: Rr, mu },
      };
    },
  ];

  /* ---------------- 3. degeneracy pressure and the Chandrasekhar limit ---------------- */
  const SPECIES = [['helium-4', 2, 4, 0], ['carbon-12', 6, 12, 0], ['oxygen-16', 8, 16, 0], ['iron-56', 26, 56, 1], ['hydrogen-1', 1, 1, 2]];
  Q['star-degenerate'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lgr = r.step(5, 10, 0.5), mi = r.int(0, 2), mue = [2, 56 / 26, 1][mi], x = Math.cbrt(Math.pow(10, lgr + 3) / rho0(mue));
        return {
          q: [`The momentum of the fastest electrons in a white dwarf, in units of $m_ec$, is $x = (\\rho/\\mu_e\\rho_0)^{1/3}$ with $\\rho_0 = 9.74\\times10^5$ g/cm³. Find $x$ for $\\rho = 10^{${n(lgr)}}$ g/cm³ and $\\mu_e = ${n(Number(sig(mue, 3)))}$.`, `白色矮星の中で最も速い電子の運動量を $m_ec$ の単位で表したものは $x = (\\rho/\\mu_e\\rho_0)^{1/3}$ で、$\\rho_0 = 9.74\\times10^5$ g/cm³ です。$\\rho = 10^{${n(lgr)}}$ g/cm³、$\\mu_e = ${n(Number(sig(mue, 3)))}$ のときの $x$ を求めてください。`],
          a: { type: 'num', v: x, rel: 0.01 },
          hint: ['Divide the density by $\\mu_e\\rho_0$, then take the cube root.', '密度を $\\mu_e\\rho_0$ で割って、立方根をとります。'],
          sol: [[`$\\rho/(\\mu_e\\rho_0) = 10^{${n(lgr)}}/(${n(Number(sig(mue, 3)))}\\times9.74\\times10^5) = ${sig(Math.pow(10, lgr) / (mue * 9.74e5), 3)}$.`, `$\\rho/(\\mu_e\\rho_0) = 10^{${n(lgr)}}/(${n(Number(sig(mue, 3)))}\\times9.74\\times10^5) = ${sig(Math.pow(10, lgr) / (mue * 9.74e5), 3)}$ です。`], [`$x = ${sig(x, 3)}$: ${x < 0.5 ? 'the electrons are slow (non-relativistic)' : x < 3 ? 'they are mildly relativistic' : 'they are ultra-relativistic'}.`, `$x = ${sig(x, 3)}$ で、${x < 0.5 ? '電子は遅く（非相対論的）' : x < 3 ? '電子は軽い相対論的' : '電子は超相対論的'}です。`]],
          set: { logrho: lgr, mue: mi },
        };
      }
      if (form === 1) {
        const sp = r.pick(SPECIES), mue = sp[2] / sp[1];
        return {
          q: [`A white dwarf is made of fully ionised ${sp[0]} (${sp[1]} protons and ${sp[2] - sp[1]} neutrons per nucleus). How many nucleons are there per electron, $\\mu_e$?`, `白色矮星が完全電離した${{ 'helium-4': 'ヘリウム 4', 'carbon-12': '炭素 12', 'oxygen-16': '酸素 16', 'iron-56': '鉄 56', 'hydrogen-1': '水素 1' }[sp[0]]}でできています（原子核 1 個あたり陽子 ${sp[1]} 個、中性子 ${sp[2] - sp[1]} 個）。電子 1 個あたりの核子数 $\\mu_e$ はいくつですか。`],
          a: { type: 'num', v: mue, rel: 0.005 },
          hint: ['Each ionised atom gives $Z$ electrons and has $A$ nucleons.', '電離した原子は電子を $Z$ 個出し、核子を $A$ 個もっています。'],
          sol: [[`$\\mu_e = A/Z = ${sp[2]}/${sp[1]} = ${n(Number(sig(mue, 4)))}$.`, `$\\mu_e = A/Z = ${sp[2]}/${sp[1]} = ${n(Number(sig(mue, 4)))}$ です。`], ['Helium, carbon and oxygen all have equal numbers of protons and neutrons, so $\\mu_e = 2$; iron has a neutron excess and a slightly higher $\\mu_e$.', 'ヘリウム・炭素・酸素は陽子と中性子が同数なので $\\mu_e = 2$ で、鉄は中性子が多く $\\mu_e$ がわずかに大きくなります。']],
          set: { mue: sp[3] },
        };
      }
      return {
        q: ['In the regime where the electrons are slow (non-relativistic), what happens to the radius of a white dwarf as its mass increases?', '電子が遅い（非相対論的な）領域では、白色矮星の質量が増えると半径はどうなりますか。'],
        a: { type: 'choice', v: 0, opts: [['It shrinks, $R \\propto M^{-1/3}$', '縮みます。$R \\propto M^{-1/3}$ です'], ['It grows, $R \\propto M^{1/3}$ like an ordinary planet', '大きくなります。普通の惑星と同じ $R \\propto M^{1/3}$ です'], ['It stays the same', '変わりません'], ['It grows, $R \\propto M$', '大きくなります。$R \\propto M$ です']] },
        hint: ['More weight must be carried by a pressure that rises only with density, $P \\propto \\rho^{5/3}$.', 'より大きな重さを、密度でしか上がらない圧力 $P \\propto \\rho^{5/3}$ で支えなければなりません。'],
        sol: [['Hydrostatic balance gives $P_c \\sim GM^2/R^4$, and degeneracy pressure gives $P \\propto \\rho^{5/3} \\propto (M/R^3)^{5/3}$.', '流体静力学的つり合いから $P_c \\sim GM^2/R^4$、縮退圧から $P \\propto \\rho^{5/3} \\propto (M/R^3)^{5/3}$ です。'], ['Equating, $M^2R^{-4} \\propto M^{5/3}R^{-5}$, so $R \\propto M^{-1/3}$.', '等しいとおくと $M^2R^{-4} \\propto M^{5/3}R^{-5}$ より $R \\propto M^{-1/3}$ です。'], ['Mass makes the dwarf smaller, the opposite of ordinary matter.', '質量が増えると小さくなり、普通の物質とは逆になります。']],
        set: { logrho: 5.5, mue: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const sp = r.pick([['carbon–oxygen (helium, carbon, oxygen)', '炭素・酸素（ヘリウム・炭素・酸素）', 2, 0], ['iron', '鉄', 56 / 26, 1], ['pure hydrogen (hypothetical)', '純水素（仮想）', 1, 2]]);
        const m = Mch(sp[2]);
        return {
          q: [`Find the Chandrasekhar mass, in solar masses, for a star made of ${sp[0]}, with $\\mu_e = ${n(Number(sig(sp[2], 4)))}$. (Use $M_{\\rm Ch} = 4\\pi\\,|\\xi^2\\theta\'|_{n=3}\\,(K/\\pi G)^{3/2}$ with $K = \\tfrac18(3/\\pi)^{1/3}hc/(\\mu_em_u)^{4/3}$, or read it from the figure.)`, `${sp[1]}でできた星のチャンドラセカール質量を太陽質量の単位で求めてください。$\\mu_e = ${n(Number(sig(sp[2], 4)))}$ です。（$M_{\\rm Ch} = 4\\pi\\,|\\xi^2\\theta\'|_{n=3}\\,(K/\\pi G)^{3/2}$、$K = \\tfrac18(3/\\pi)^{1/3}hc/(\\mu_em_u)^{4/3}$ を使うか、図から読み取ってください。）`],
          a: { type: 'num', v: m, rel: 0.01, unit: ['$M_\\odot$', '$M_\\odot$'] },
          hint: ['It scales as $\\mu_e^{-2}$: $M_{\\rm Ch} = 5.83\\,M_\\odot/\\mu_e^2$.', '$\\mu_e^{-2}$ に比例し、$M_{\\rm Ch} = 5.83\\,M_\\odot/\\mu_e^2$ です。'],
          sol: [['The relativistic electron gas is the $n = 3$ polytrope, for which the central density drops out of the mass: $M = 4\\pi\\,|\\xi^2\\theta\'|\\,(K/\\pi G)^{3/2} = 5.83\\,M_\\odot/\\mu_e^2$.', '相対論的な電子ガスは $n = 3$ のポリトロープで、質量から中心密度が消えます。$M = 4\\pi\\,|\\xi^2\\theta\'|\\,(K/\\pi G)^{3/2} = 5.83\\,M_\\odot/\\mu_e^2$ です。'], [`$M_{\\rm Ch} = 5.83/${n(Number(sig(sp[2], 4)))}^2 = ${n(m, 3)}\\,M_\\odot$.`, `$M_{\\rm Ch} = 5.83/${n(Number(sig(sp[2], 4)))}^2 = ${n(m, 3)}\\,M_\\odot$ です。`], ['The limit depends only on constants of nature and on how many nucleons accompany each electron.', 'この限界は自然定数と、電子 1 個あたりの核子数にしかよりません。']],
          set: { mue: sp[3], logrho: 11 },
        };
      }
      if (form === 1) {
        const lgr = r.step(6, 8, 0.5), w = wd(Math.pow(10, lgr + 3), 2), g = G * w.M / (w.R * w.R) * 100, ve = Math.sqrt(2 * G * w.M / w.R) / CL;
        const askG = r.chance(0.5);
        return {
          q: askG ? [`A white dwarf of $${sig(w.Msun, 3)}\\,M_\\odot$ has radius $${sig(w.Rearth, 3)}\\,R_\\oplus$ ($R_\\oplus = 6371$ km). What is its surface gravity as $\\log_{10} g$ with $g$ in cm/s²? ($M_\\odot = 1.989\\times10^{30}$ kg.)`, `質量 $${sig(w.Msun, 3)}\\,M_\\odot$ の白色矮星の半径は $${sig(w.Rearth, 3)}\\,R_\\oplus$（$R_\\oplus = 6371$ km）です。表面重力を、$g$ を cm/s² として $\\log_{10} g$ で求めてください。（$M_\\odot = 1.989\\times10^{30}$ kg です。）`]
            : [`A white dwarf of $${sig(w.Msun, 3)}\\,M_\\odot$ has radius $${sig(w.Rearth, 3)}\\,R_\\oplus$. What is its escape speed as a fraction of the speed of light?`, `質量 $${sig(w.Msun, 3)}\\,M_\\odot$ の白色矮星の半径は $${sig(w.Rearth, 3)}\\,R_\\oplus$ です。脱出速度は光速の何倍ですか。`],
          a: askG ? { type: 'num', v: lg(g), tol: 0.03 } : { type: 'num', v: ve, rel: 0.03 },
          hint: askG ? ['$g = GM/R^2$ in SI, then multiply by 100 for cm/s².', 'SI で $g = GM/R^2$ を求め、100 倍して cm/s² にします。'] : ['$v_{\\rm esc} = \\sqrt{2GM/R}$.', '$v_{\\rm esc} = \\sqrt{2GM/R}$ です。'],
          sol: askG ? [[`$g = GM/R^2 = 6.674\\times10^{-11}\\times${sig(w.M, 3)}/(${sig(w.R, 3)})^2 = ${sig(g / 100, 3)}$ m/s².`, `$g = GM/R^2 = 6.674\\times10^{-11}\\times${sig(w.M, 3)}/(${sig(w.R, 3)})^2 = ${sig(g / 100, 3)}$ m/s² です。`], [`In cgs that is $${sig(g, 3)}$ cm/s², so $\\log_{10} g = ${n(lg(g), 2)}$, tens of thousands of times the Earth\'s 981 cm/s².`, `cgs では $${sig(g, 3)}$ cm/s² で、$\\log_{10} g = ${n(lg(g), 2)}$ です。地球の 981 cm/s² の数万倍にあたります。`]]
            : [[`$v_{\\rm esc} = \\sqrt{2GM/R} = \\sqrt{2\\times6.674\\times10^{-11}\\times${sig(w.M, 3)}/${sig(w.R, 3)}} = ${sig(ve * CL, 3)}$ m/s.`, `$v_{\\rm esc} = \\sqrt{2GM/R} = \\sqrt{2\\times6.674\\times10^{-11}\\times${sig(w.M, 3)}/${sig(w.R, 3)}} = ${sig(ve * CL, 3)}$ m/s です。`], [`Divided by $c$: $${sig(ve, 3)}\\,c$, about ${n(Math.round(ve * 1000) / 10)}% of the speed of light.`, `$c$ で割ると $${sig(ve, 3)}\\,c$ で、光速の約 ${n(Math.round(ve * 1000) / 10)}% です。`]],
          set: { logrho: lgr, mue: 0 },
        };
      }
      const Mt = r.pick([0.4, 0.5, 0.6, 0.8, 1.0, 1.2]);
      let lo = 5, hi = 11;
      for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (wd(Math.pow(10, mid + 3), 2).Msun < Mt) lo = mid; else hi = mid; }
      const lgAns = (lo + hi) / 2, w = wd(Math.pow(10, lgAns + 3), 2);
      return {
        q: [`A carbon–oxygen white dwarf ($\\mu_e = 2$) has a mass of $${n(Mt)}\\,M_\\odot$. Use the mass–radius curve to find $\\log_{10}$ of its central density in g/cm³ (to within 0.1).`, `炭素・酸素の白色矮星（$\\mu_e = 2$）の質量は $${n(Mt)}\\,M_\\odot$ です。質量半径曲線を使って、その中心密度の常用対数 $\\log_{10}$（g/cm³）を 0.1 の精度で求めてください。`],
        a: { type: 'num', v: lgAns, tol: 0.1 },
        hint: ['Drag the point along the curve until the mass readout reads the target value.', '質量の読み出しが目標の値になるまで、点を曲線に沿ってドラッグします。'],
        sol: [['Mass rises monotonically with central density, so exactly one density gives each mass below the limit.', '質量は中心密度とともに単調に増えるので、限界より小さい質量にはそれぞれ密度がちょうど一つ対応します。'], [`Integrating hydrostatic equilibrium, $M = ${n(Mt)}\\,M_\\odot$ needs $\\rho_c = 10^{${n(lgAns, 2)}}$ g/cm³, giving a radius of $${n(w.Rearth, 2)}\\,R_\\oplus$.`, `流体静力学的平衡を積分すると、$M = ${n(Mt)}\\,M_\\odot$ には $\\rho_c = 10^{${n(lgAns, 2)}}$ g/cm³ が必要で、半径は $${n(w.Rearth, 2)}\\,R_\\oplus$ になります。`]],
        set: { logrho: Math.round(lgAns * 20) / 20, mue: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([1.2, 1.5, 2, 3]), askP = r.chance(0.5), ex = askP ? 10 / 3 : 2;
        return {
          q: [askP ? `A low-mass white dwarf (non-relativistic electrons) accretes matter until its mass is multiplied by ${n(k)}. By what factor does its central pressure change? (Use $R \\propto M^{-1/3}$.)` : `A low-mass white dwarf (non-relativistic electrons) accretes matter until its mass is multiplied by ${n(k)}. By what factor does its mean density change? (Use $R \\propto M^{-1/3}$.)`, askP ? `低質量の白色矮星（電子は非相対論的）が物質を降着し、質量が ${n(k)} 倍になります。中心圧力は何倍になりますか。（$R \\propto M^{-1/3}$ を使います。）` : `低質量の白色矮星（電子は非相対論的）が物質を降着し、質量が ${n(k)} 倍になります。平均密度は何倍になりますか。（$R \\propto M^{-1/3}$ を使います。）`],
          a: { type: 'num', v: Math.pow(k, ex), rel: 0.01 },
          hint: askP ? ['Hydrostatic balance: $P_c \\propto M^2/R^4$.', '流体静力学的つり合いから $P_c \\propto M^2/R^4$ です。'] : ['Mean density $\\propto M/R^3$.', '平均密度は $M/R^3$ に比例します。'],
          sol: askP ? [['$P_c \\propto M^2/R^4$ and $R \\propto M^{-1/3}$ give $P_c \\propto M^{2 + 4/3} = M^{10/3}$.', '$P_c \\propto M^2/R^4$ と $R \\propto M^{-1/3}$ から $P_c \\propto M^{2 + 4/3} = M^{10/3}$ です。'], [`Factor $${n(k)}^{10/3} = ${n(Math.pow(k, 10 / 3), 4)}$.`, `倍率は $${n(k)}^{10/3} = ${n(Math.pow(k, 10 / 3), 4)}$ です。`]]
            : [['$\\bar\\rho \\propto M/R^3 \\propto M\\cdot M = M^2$ because $R^3 \\propto M^{-1}$.', '$R^3 \\propto M^{-1}$ なので $\\bar\\rho \\propto M/R^3 \\propto M\\cdot M = M^2$ です。'], [`Factor $${n(k)}^2 = ${n(k * k, 4)}$.`, `倍率は $${n(k)}^2 = ${n(k * k, 4)}$ です。`]],
          set: { logrho: 5.5, mue: 0 },
        };
      }
      if (form === 1) {
        const mi = r.int(0, 2), mue = [2, 56 / 26, 1][mi], rho1 = rho0(mue) / 1000;
        return {
          q: [`At what central density (in g/cm³) do the electrons in a white dwarf with $\\mu_e = ${n(Number(sig(mue, 3)))}$ reach $x = p_F/m_ec = 1$, where relativistic effects become important? Use $\\rho = \\mu_e m_u\\,x^3/(3\\pi^2\\lambda_C^3)$ with $\\lambda_C = \\hbar/m_ec = 3.862\\times10^{-13}$ m.`, `$\\mu_e = ${n(Number(sig(mue, 3)))}$ の白色矮星で、電子が $x = p_F/m_ec = 1$ に達し、相対論的効果が重要になる中心密度は何 g/cm³ ですか。$\\rho = \\mu_e m_u\\,x^3/(3\\pi^2\\lambda_C^3)$、$\\lambda_C = \\hbar/m_ec = 3.862\\times10^{-13}$ m を使います。`],
          a: { type: 'num', v: rho1, rel: 0.015, unit: ['g/cm³', 'g/cm³'] },
          hint: ['Put $x = 1$ and convert kg/m³ to g/cm³ by dividing by 1000.', '$x = 1$ とおき、kg/m³ を 1000 で割って g/cm³ にします。'],
          sol: [[`$\\rho = ${n(Number(sig(mue, 3)))}\\times1.661\\times10^{-27}/(3\\pi^2\\times(3.862\\times10^{-13})^3) = ${sig(rho1 * 1000, 3)}$ kg/m³.`, `$\\rho = ${n(Number(sig(mue, 3)))}\\times1.661\\times10^{-27}/(3\\pi^2\\times(3.862\\times10^{-13})^3) = ${sig(rho1 * 1000, 3)}$ kg/m³ です。`], [`That is $${sig(rho1, 3)}$ g/cm³, with $\\log_{10}\\rho = ${n(lg(rho1), 2)}$. Above this density the pressure stiffens less than $\\rho^{5/3}$.`, `これは $${sig(rho1, 3)}$ g/cm³ で、$\\log_{10}\\rho = ${n(lg(rho1), 2)}$ です。この密度を超えると、圧力は $\\rho^{5/3}$ ほど硬くならなくなります。`]],
          set: { logrho: Math.round(lg(rho1) * 20) / 20, mue: mi },
        };
      }
      return {
        q: ['Because $M_{\\rm Ch} \\propto \\mu_e^{-2}$, the ratio $M_{\\rm Ch}(\\mu_e)/M_{\\rm Ch}(2)$ is a function of $\\mu_e$ alone. Write it (type m for $\\mu_e$).', '$M_{\\rm Ch} \\propto \\mu_e^{-2}$ なので、比 $M_{\\rm Ch}(\\mu_e)/M_{\\rm Ch}(2)$ は $\\mu_e$ だけの関数です。書いてください（$\\mu_e$ は m と入力）。'],
        a: { type: 'expr', v: '4/m^2', vars: ['m'], dom: { m: [1, 2.3] }, lhs: ['$\\dfrac{M_{\\rm Ch}(\\mu_e)}{M_{\\rm Ch}(2)} =$', '$\\dfrac{M_{\\rm Ch}(\\mu_e)}{M_{\\rm Ch}(2)} =$'] },
        hint: ['Form the ratio $\\mu_e^{-2}/2^{-2}$.', '比 $\\mu_e^{-2}/2^{-2}$ をつくります。'],
        sol: [['$M_{\\rm Ch} \\propto \\mu_e^{-2}$ because the ultra-relativistic gas has $P = K\\rho^{4/3}$ with $K \\propto \\mu_e^{-4/3}$, and $M \\propto K^{3/2}$.', '超相対論的なガスでは $P = K\\rho^{4/3}$、$K \\propto \\mu_e^{-4/3}$ で、$M \\propto K^{3/2}$ だから $M_{\\rm Ch} \\propto \\mu_e^{-2}$ です。'], ['The ratio is $\\mu_e^{-2}/2^{-2} = 4/\\mu_e^2$.', '比は $\\mu_e^{-2}/2^{-2} = 4/\\mu_e^2$ です。'], ['For iron ($\\mu_e = 2.15$) this gives 0.86, a limit of 1.26 solar masses.', '鉄（$\\mu_e = 2.15$）では 0.86 となり、限界は太陽質量の 1.26 倍です。']],
        set: { mue: 1, logrho: 11 },
      };
    },
  ];
})();
