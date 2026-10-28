'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const FS = 200e3, CAP = 47e-6;   // the figure's switching frequency and output capacitor
  const r2 = (x) => Math.round(x * 100) / 100;

  /* ---------- 1. the buck converter ---------- */
  // a continuous-conduction case of the figure (diode stays on: valley current above zero)
  function buckCase(r) {
    for (;;) {
      const Vin = r.int(5, 48), D = r.step(0.15, 0.85, 0.01), L = r.pick([4, 5, 8, 10, 15, 20, 22, 33, 47]), R = r.step(0.5, 10, 0.1);
      const V = D * Vin, I = V / R, dI = (Vin - V) * D / (L * 1e-6 * FS);
      if (I - dI / 2 > 0.05 && I < 25) return { Vin, D, L, R, V, I, dI };
    }
  }
  Q['buck-converter'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Vin = r.int(5, 48), D = r.step(0.05, 0.95, 0.01);
        return {
          q: [`An ideal buck converter runs from $${Vin}$ V at duty cycle $D = ${n(D)}$. What is its average output voltage?`, `理想的な降圧変換器を $${Vin}$ V からデューティ比 $D = ${n(D)}$ で動かします。出力電圧の平均はいくつですか。`],
          a: { type: 'num', v: D * Vin, rel: 0.002, unit: ['V', 'V'] },
          hint: ['The inductor averages the chopped switch-node voltage.', 'インダクタは、刻まれたスイッチ節点の電圧を平均します。'],
          sol: [[`The switch node sits at $${Vin}$ V for a fraction $${n(D)}$ of the time and at $0$ V otherwise, and an inductor carries no average voltage.`, `スイッチ節点は時間の $${n(D)}$ の割合で $${Vin}$ V、残りは $0$ V で、インダクタには平均の電圧がかかりません。`], [`So $V = D\\,V_{\\rm in} = ${n(D)} \\times ${Vin} = ${n(D * Vin, 4)}$ V, set by timing alone, not by any resistor dropping voltage.`, `したがって $V = D\\,V_{\\rm in} = ${n(D)} \\times ${Vin} = ${n(D * Vin, 4)}$ V です。電圧を落とす抵抗ではなく、タイミングだけで決まります。`]],
          set: { Vin, D, sync: 1 },
        };
      }
      if (form === 1) {
        const [Vin, V] = r.pick([[12, 3.3], [12, 5], [12, 1.8], [24, 5], [24, 12], [48, 12], [5, 3.3], [5, 1.2], [20, 5], [36, 12], [48, 5], [9, 3.3]]), D = V / Vin;
        return {
          q: [`What duty cycle does a buck converter need to make $${n(V)}$ V from $${Vin}$ V?`, `降圧変換器で $${Vin}$ V から $${n(V)}$ V を作るには、デューティ比はいくつ必要ですか。`],
          a: { type: 'num', v: D, tol: 0.001 },
          hint: ['Invert $V = D\\,V_{\\rm in}$.', '$V = D\\,V_{\\rm in}$ を逆に解きます。'],
          sol: [[`$D = V/V_{\\rm in} = ${n(V)}/${Vin} = ${n(D, 4)}$.`, `$D = V/V_{\\rm in} = ${n(V)}/${Vin} = ${n(D, 4)}$ です。`], [`The switch is on $${n(100 * D, 3)}\\%$ of each period. Very small duty cycles (big step-downs) mean very short on times, which is what limits how far one stage can step down at high frequency.`, `スイッチは各周期の $${n(100 * D, 3)}\\%$ だけオンです。デューティ比が非常に小さい（大きく降圧する）とオン時間が非常に短くなり、高い周波数で一段で降圧できる幅はそれで制限されます。`]],
          set: { Vin, D: Math.min(0.95, Math.max(0.05, r2(D))), sync: 1 },
        };
      }
      const c = buckCase(r);
      return {
        q: [`A buck converter makes $${n(c.V, 4)}$ V into a $${n(c.R)}\\ \\Omega$ load. What is the average current in its inductor?`, `降圧変換器が $${n(c.R)}\\ \\Omega$ の負荷に $${n(c.V, 4)}$ V を出しています。インダクタの平均電流はいくつですか。`],
        a: { type: 'num', v: c.I, rel: 0.003, unit: ['A', 'A'] },
        hint: ['In steady state the capacitor carries no average current.', '定常状態ではコンデンサの平均電流は 0 です。'],
        sol: [['The inductor current splits between capacitor and load; the capacitor only takes the ripple, so all the average goes to the load.', 'インダクタ電流はコンデンサと負荷に分かれますが、コンデンサはリプルだけを受け持つので、平均はすべて負荷に流れます。'], [`$I_L = V/R = ${n(c.V, 4)}/${n(c.R)} = ${n(c.I, 4)}$ A, more than the input draws: a buck trades voltage for current, $I_{\\rm in} = D\\,I_L = ${n(c.D * c.I, 4)}$ A.`, `$I_L = V/R = ${n(c.V, 4)}/${n(c.R)} = ${n(c.I, 4)}$ A で、入力電流より大きくなります。降圧変換器は電圧と電流を交換し、$I_{\\rm in} = D\\,I_L = ${n(c.D * c.I, 4)}$ A です。`]],
        set: { Vin: c.Vin, D: c.D, R: c.R, L: c.L, sync: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2), c = buckCase(r), set = { Vin: c.Vin, D: c.D, L: c.L, R: c.R, sync: 0 };
      const given = [`A buck converter switching at $200$ kHz takes $${c.Vin}$ V in at $D = ${n(c.D)}$ with $L = ${c.L}\\ \\mu$H`, `$200$ kHz でスイッチングする降圧変換器に $${c.Vin}$ V を入れ、$D = ${n(c.D)}$、$L = ${c.L}\\ \\mu$H`];
      if (form === 0) {
        return {
          q: [`${given[0]}. What is the peak-to-peak ripple of the inductor current?`, `${given[1]}とします。インダクタ電流のリプルの山から谷までの大きさはいくつですか。`],
          a: { type: 'num', v: c.dI, rel: 0.004, unit: ['A', 'A'] },
          hint: ['During the on time the inductor sees $V_{\\rm in} - V$ for $D/f_s$ seconds.', 'オン時間 $D/f_s$ 秒の間、インダクタには $V_{\\rm in} - V$ がかかります。'],
          sol: [[`$V = D\\,V_{\\rm in} = ${n(c.V, 4)}$ V, so the inductor sees $${n(c.Vin - c.V, 4)}$ V while the switch is on, for $${n(c.D / FS * 1e6, 4)}\\ \\mu$s.`, `$V = D\\,V_{\\rm in} = ${n(c.V, 4)}$ V なので、スイッチがオンの $${n(c.D / FS * 1e6, 4)}\\ \\mu$s の間、インダクタには $${n(c.Vin - c.V, 4)}$ V がかかります。`], [`$\\Delta I = \\dfrac{(V_{\\rm in} - V)D}{L f_s} = \\dfrac{${n(c.Vin - c.V, 4)} \\times ${n(c.D)}}{${c.L} \\times 10^{-6} \\times 2 \\times 10^5} = ${n(c.dI, 4)}$ A.`, `$\\Delta I = \\dfrac{(V_{\\rm in} - V)D}{L f_s} = \\dfrac{${n(c.Vin - c.V, 4)} \\times ${n(c.D)}}{${c.L} \\times 10^{-6} \\times 2 \\times 10^5} = ${n(c.dI, 4)}$ A です。`], ['The ripple does not depend on the load at all: halve $L$ or the frequency and it doubles.', 'リプルは負荷にはまったく依存しません。$L$ か周波数を半分にすると二倍になります。']],
          set,
        };
      }
      if (form === 1) {
        return {
          q: [`${given[0]}, into a $${n(c.R)}\\ \\Omega$ load. Find the peak and the valley of the inductor current.`, `${given[1]}、負荷は $${n(c.R)}\\ \\Omega$ です。インダクタ電流の最大値と最小値を求めてください。`],
          a: { type: 'tuple', v: [c.I + c.dI / 2, c.I - c.dI / 2], labels: [['peak (A)', '最大（A）'], ['valley (A)', '最小（A）']], rel: 0.005 },
          hint: ['The current ramps symmetrically about its average, the load current, by $\\Delta I/2$ each way.', '電流は平均値、つまり負荷電流のまわりを上下に $\\Delta I/2$ ずつ対称に動きます。'],
          sol: [[`Average: $I = D\\,V_{\\rm in}/R = ${n(c.V, 4)}/${n(c.R)} = ${n(c.I, 4)}$ A.`, `平均は $I = D\\,V_{\\rm in}/R = ${n(c.V, 4)}/${n(c.R)} = ${n(c.I, 4)}$ A です。`], [`Ripple: $\\Delta I = (V_{\\rm in} - V)D/(L f_s) = ${n(c.dI, 4)}$ A.`, `リプルは $\\Delta I = (V_{\\rm in} - V)D/(L f_s) = ${n(c.dI, 4)}$ A です。`], [`Peak $${n(c.I + c.dI / 2, 4)}$ A, valley $${n(c.I - c.dI / 2, 4)}$ A. The switch and inductor must be rated for the peak, and the valley staying above zero means continuous conduction.`, `最大 $${n(c.I + c.dI / 2, 4)}$ A、最小 $${n(c.I - c.dI / 2, 4)}$ A です。スイッチとインダクタは最大値に耐える必要があり、最小値が 0 より上にあるのが連続モードです。`]],
          set,
        };
      }
      const dV = c.dI / (8 * FS * CAP);
      return {
        q: [`${given[0]} and an output capacitor of $47\\ \\mu$F. Estimate the peak-to-peak output voltage ripple, in millivolts.`, `${given[1]}、出力コンデンサは $47\\ \\mu$F です。出力電圧のリプルの山から谷までをミリボルトで見積もってください。`],
        a: { type: 'num', v: 1000 * dV, rel: 0.005, unit: ['mV', 'mV'] },
        hint: ['The capacitor absorbs the triangular ripple current; the charge in one positive half of the triangle is $\\Delta I\\,T_s/8$.', 'コンデンサは三角形のリプル電流を吸収します。三角形の正の半分の電荷は $\\Delta I\\,T_s/8$ です。'],
        sol: [[`First $\\Delta I = (V_{\\rm in} - V)D/(L f_s) = ${n(c.dI, 4)}$ A.`, `まず $\\Delta I = (V_{\\rm in} - V)D/(L f_s) = ${n(c.dI, 4)}$ A です。`], [`$\\Delta V \\approx \\dfrac{\\Delta I}{8 f_s C} = \\dfrac{${n(c.dI, 4)}}{8 \\times 2 \\times 10^5 \\times 47 \\times 10^{-6}} = ${n(1000 * dV, 4)}$ mV.`, `$\\Delta V \\approx \\dfrac{\\Delta I}{8 f_s C} = \\dfrac{${n(c.dI, 4)}}{8 \\times 2 \\times 10^5 \\times 47 \\times 10^{-6}} = ${n(1000 * dV, 4)}$ mV です。`], [`That is $${sig(100 * dV / c.V, 2)}\\%$ of the output: the LC pair filters twice, which is why the ripple falls as $1/f_s^2$.`, `出力の $${sig(100 * dV / c.V, 2)}\\%$ です。LC が二重にフィルタするので、リプルは $1/f_s^2$ で小さくなります。`]],
        set,
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const D = r.step(0.1, 0.9, 0.05), R = r.step(1, 20, 0.5), Lc = (1 - D) * R / (2 * FS) * 1e6;
        return {
          q: [`A buck converter with a freewheeling diode switches at $200$ kHz at $D = ${n(D)}$ into $${n(R)}\\ \\Omega$. What is the smallest inductance, in $\\mu$H, that keeps it in continuous conduction?`, `還流ダイオードを使う降圧変換器が $200$ kHz、$D = ${n(D)}$ で $${n(R)}\\ \\Omega$ に出力しています。電流連続モードを保つ最小のインダクタンスは何 $\\mu$H ですか。`],
          a: { type: 'num', v: Lc, rel: 0.004, unit: ['µH', 'µH'] },
          hint: ['At the boundary the valley touches zero: $\\Delta I = 2I$.', '境界では谷がちょうど 0 に触れます。$\\Delta I = 2I$ です。'],
          sol: [['$\\Delta I = \\dfrac{V(1 - D)}{L f_s}$ and $I = V/R$; setting $\\Delta I = 2I$ gives $L_{\\rm crit} = \\dfrac{(1 - D)R}{2 f_s}$.', '$\\Delta I = \\dfrac{V(1 - D)}{L f_s}$、$I = V/R$ で、$\\Delta I = 2I$ とおくと $L_{\\rm crit} = \\dfrac{(1 - D)R}{2 f_s}$ です。'], [`$L_{\\rm crit} = ${n(1 - D)} \\times ${n(R)}/(4 \\times 10^5) = ${n(Lc, 4)}\\ \\mu$H, independent of the input voltage.`, `$L_{\\rm crit} = ${n(1 - D)} \\times ${n(R)}/(4 \\times 10^5) = ${n(Lc, 4)}\\ \\mu$H で、入力電圧によりません。`], ['A lighter load (larger $R$) needs more inductance; designers size $L$ for the lightest load they must regulate, or use a synchronous switch and let the current go negative.', '負荷が軽い（$R$ が大きい）ほど大きなインダクタンスが必要です。設計者は調整すべき最も軽い負荷に合わせて $L$ を選ぶか、同期スイッチで電流が負になるのを許します。']],
          set: { D, R, L: Math.max(2, Math.ceil(Lc)), sync: 0 },
        };
      }
      if (form === 1) {
        let D, L, Rc;
        do { D = r.step(0.1, 0.9, 0.05); L = r.pick([2, 3, 4, 5, 8, 10, 15, 20, 22]); Rc = 2 * L * 1e-6 * FS / (1 - D); } while (Rc > 20 || Rc < 0.8);
        return {
          q: [`A diode buck converter at $200$ kHz has $L = ${L}\\ \\mu$H and runs at $D = ${n(D)}$. Above what load resistance does it fall into discontinuous conduction?`, `ダイオードを使う $200$ kHz の降圧変換器は $L = ${L}\\ \\mu$H、$D = ${n(D)}$ で動いています。負荷抵抗がいくつを超えると電流不連続モードに入りますか。`],
          a: { type: 'num', v: Rc, rel: 0.004, unit: ['Ω', 'Ω'] },
          hint: ['Write the boundary as $K = 2L/(R T_s) = 1 - D$ and solve for $R$.', '境界を $K = 2L/(R T_s) = 1 - D$ と書き、$R$ について解きます。'],
          sol: [['At the boundary $K = 1 - D$, so $R_{\\rm crit} = \\dfrac{2 L f_s}{1 - D}$.', '境界では $K = 1 - D$ なので $R_{\\rm crit} = \\dfrac{2 L f_s}{1 - D}$ です。'], [`$R_{\\rm crit} = \\dfrac{2 \\times ${L} \\times 10^{-6} \\times 2 \\times 10^5}{${n(1 - D)}} = ${n(Rc, 4)}\\ \\Omega$.`, `$R_{\\rm crit} = \\dfrac{2 \\times ${L} \\times 10^{-6} \\times 2 \\times 10^5}{${n(1 - D)}} = ${n(Rc, 4)}\\ \\Omega$ です。`], ['Any lighter load (larger $R$, less current) lets the current run dry each cycle, and the output creeps above $D\\,V_{\\rm in}$.', 'それより軽い負荷（$R$ が大きく電流が小さい）では電流が毎周期尽き、出力は $D\\,V_{\\rm in}$ より上にずれていきます。']],
          set: { D, L, R: Math.min(20, r2(Math.ceil(Rc * 10) / 10 + 0.5)), sync: 0 },
        };
      }
      if (form === 2) {
        const [Vin, L] = r.pick([[12, 10], [24, 20], [20, 10], [48, 40], [12, 5], [24, 10], [36, 20], [16, 8]]), k = Vin * 5 / L;
        return {
          q: [`A buck converter at $200$ kHz runs from $${Vin}$ V with $L = ${L}\\ \\mu$H in continuous conduction. Write the inductor ripple $\\Delta I$ in amperes as a function of the duty cycle $D$.`, `$200$ kHz の降圧変換器が $${Vin}$ V、$L = ${L}\\ \\mu$H で連続モードで動いています。インダクタ電流のリプル $\\Delta I$（A）をデューティ比 $D$ の関数として書いてください。`],
          a: { type: 'expr', v: `${n(k)}D(1-D)`, vars: ['D'], dom: { D: [0.05, 0.95] }, lhs: ['$\\Delta I(D) =$', '$\\Delta I(D) =$'] },
          hint: ['Substitute $V = D\\,V_{\\rm in}$ into $\\Delta I = (V_{\\rm in} - V)D/(L f_s)$.', '$\\Delta I = (V_{\\rm in} - V)D/(L f_s)$ に $V = D\\,V_{\\rm in}$ を代入します。'],
          sol: [['$\\Delta I = \\dfrac{V_{\\rm in}(1 - D)D}{L f_s}$.', '$\\Delta I = \\dfrac{V_{\\rm in}(1 - D)D}{L f_s}$ です。'], [`$V_{\\rm in}/(L f_s) = ${Vin}/(${L} \\times 10^{-6} \\times 2 \\times 10^5) = ${n(k)}$, so $\\Delta I = ${n(k)}\\,D(1 - D)$.`, `$V_{\\rm in}/(L f_s) = ${Vin}/(${L} \\times 10^{-6} \\times 2 \\times 10^5) = ${n(k)}$ なので $\\Delta I = ${n(k)}\\,D(1 - D)$ です。`], [`It is largest, $${n(k / 4)}$ A, at $D = 0.5$, and small at both ends: an inductor sized for half the input voltage out covers the worst case.`, `$D = 0.5$ で最大の $${n(k / 4)}$ A になり、両端では小さくなります。入力の半分の電圧を出すときに合わせてインダクタを選べば、最悪の場合を押さえられます。`]],
          set: { Vin, L, D: 0.5, sync: 1 },
        };
      }
      return {
        q: ['A buck converter with a diode is unloaded until its inductor current runs dry every cycle. What happens to the output voltage, with the duty cycle held fixed?', 'ダイオードを使う降圧変換器の負荷を軽くしていき、インダクタ電流が毎周期尽きるようになりました。デューティ比を固定したとき、出力電圧はどうなりますか。'],
        a: { type: 'choice', v: 0, opts: [['It rises above $D\\,V_{\\rm in}$, towards $V_{\\rm in}$ at no load', '$D\\,V_{\\rm in}$ より上がり、無負荷では $V_{\\rm in}$ に近づく'], ['It falls below $D\\,V_{\\rm in}$, because less current reaches the load', '負荷に届く電流が減るので $D\\,V_{\\rm in}$ より下がる'], ['It stays at $D\\,V_{\\rm in}$, because volt-seconds still balance', 'ボルト秒がやはり釣り合うので $D\\,V_{\\rm in}$ のまま'], ['It drops to zero once the current stops', '電流が止まると 0 になる']] },
        hint: ['Volt-seconds still balance, $(V_{\\rm in} - V)D = V D_2$, but the falling interval $D_2$ is now shorter than $1 - D$.', 'ボルト秒はやはり $(V_{\\rm in} - V)D = V D_2$ と釣り合いますが、下りの区間 $D_2$ が $1 - D$ より短くなります。'],
        sol: [['$V/V_{\\rm in} = D/(D + D_2)$, and with $D_2 < 1 - D$ this exceeds $D$.', '$V/V_{\\rm in} = D/(D + D_2)$ で、$D_2 < 1 - D$ ならこれは $D$ を超えます。'], ['During the idle interval the switch node floats at the output instead of being held at zero, so its average rises. Regulation loops cope by cutting the duty cycle, which is why light-load behaviour needs its own design.', '休止の区間ではスイッチ節点が 0 に押さえられず出力の電圧に浮くので、その平均が上がります。制御ループはデューティ比を下げて対応するので、軽負荷時のふるまいは別に設計が必要です。']],
        set: { Vin: 12, D: 0.42, L: 4, R: 20, sync: 0 },
      };
    },
  ];

  /* ---------- 2. conversion ratios ---------- */
  const NAMES = [['buck', '降圧'], ['boost', '昇圧'], ['buck-boost', '昇降圧']];
  const ideal = (t, D) => (t === 0 ? D : t === 1 ? 1 / (1 - D) : -D / (1 - D));
  const lossy = (t, D, a) => { const u = 1 - D; if (t === 0) return { M: D / (1 + a), eta: 1 / (1 + a) }; const eta = 1 / (1 + a / (u * u)); return { M: (t === 1 ? 1 : -D) * eta / u, eta }; };
  const ratioTeX = ['D', '\\dfrac{1}{1 - D}', '-\\dfrac{D}{1 - D}'];
  Q['conversion-ratios'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.int(0, 2), D = r.step(0.1, 0.9, 0.05), M = ideal(t, D);
        return {
          q: [`What is the ideal conversion ratio $M = V/V_{\\rm in}$ of a ${NAMES[t][0]} converter at $D = ${n(D)}$?`, `${NAMES[t][1]}変換器の $D = ${n(D)}$ での理想的な変換比 $M = V/V_{\\rm in}$ はいくつですか。`],
          a: { type: 'num', v: M, rel: 0.002 },
          hint: ['Balance the volt-seconds on the inductor over one period.', '一周期のインダクタのボルト秒を釣り合わせます。'],
          sol: [[`For the ${NAMES[t][0]}, $M = ${ratioTeX[t]}$.`, `${NAMES[t][1]}では $M = ${ratioTeX[t]}$ です。`], [`$M = ${n(M, 4)}$${t === 2 ? ', negative because the output is inverted' : ''}. ${t === 0 ? 'A buck can only step down.' : t === 1 ? 'A boost can only step up.' : 'Its size is below 1 for $D < 0.5$ and above 1 for $D > 0.5$.'}`, `$M = ${n(M, 4)}$ です${t === 2 ? '。出力が反転するので負です' : ''}。${t === 0 ? '降圧変換器は電圧を下げることしかできません。' : t === 1 ? '昇圧変換器は電圧を上げることしかできません。' : '大きさは $D < 0.5$ で 1 未満、$D > 0.5$ で 1 を超えます。'}`]],
          set: { type: t, D, a: 0 },
        };
      }
      if (form === 1) {
        const [Vin, V] = r.pick([[5, 12], [3.3, 5], [12, 24], [12, 48], [5, 20], [24, 48], [3.7, 5], [12, 15], [9, 36], [5, 10]]), D = 1 - Vin / V;
        return {
          q: [`What duty cycle does an ideal boost converter need to make $${n(V)}$ V from $${n(Vin)}$ V?`, `理想的な昇圧変換器で $${n(Vin)}$ V から $${n(V)}$ V を作るには、デューティ比はいくつ必要ですか。`],
          a: { type: 'num', v: D, tol: 0.001 },
          hint: ['Invert $V = V_{\\rm in}/(1 - D)$.', '$V = V_{\\rm in}/(1 - D)$ を逆に解きます。'],
          sol: [[`$1 - D = V_{\\rm in}/V = ${n(Vin)}/${n(V)} = ${n(Vin / V, 4)}$.`, `$1 - D = V_{\\rm in}/V = ${n(Vin)}/${n(V)} = ${n(Vin / V, 4)}$ です。`], [`$D = ${n(D, 4)}$: the switch is closed, storing energy in the inductor, for $${n(100 * D, 3)}\\%$ of each period.`, `$D = ${n(D, 4)}$ です。スイッチは各周期の $${n(100 * D, 3)}\\%$ の間閉じて、インダクタにエネルギーを蓄えます。`]],
          set: { type: 1, D: r2(D), a: 0 },
        };
      }
      return {
        q: ['An ideal buck-boost converter runs at $D = 0.5$ from $12$ V. What is its output?', '理想的な昇降圧変換器を $12$ V から $D = 0.5$ で動かします。出力はどうなりますか。'],
        a: { type: 'choice', v: 0, opts: [['$-12$ V: the same size, inverted', '$-12$ V：同じ大きさで反転'], ['$+12$ V: unity gain', '$+12$ V：利得 1'], ['$+6$ V, as in a buck', '$+6$ V（降圧と同じ）'], ['$+24$ V, as in a boost', '$+24$ V（昇圧と同じ）']] },
        hint: ['$M = -D/(1 - D)$; the inductor empties into the output with its polarity reversed.', '$M = -D/(1 - D)$ です。インダクタは極性を反転して出力へ放出します。'],
        sol: [['$M = -0.5/0.5 = -1$, so $V = -12$ V.', '$M = -0.5/0.5 = -1$ なので $V = -12$ V です。'], ['The inductor is charged from the input and then connected only to the output, upside down, so the output is negative whatever $D$ is.', 'インダクタは入力から蓄えた後、出力だけに逆向きにつながるので、出力は $D$ によらず負です。']],
        set: { type: 2, D: 0.5, a: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const D = r.step(0.3, 0.9, 0.05), ap = r.pick([0.5, 1, 1.5, 2, 3, 5]), a = ap / 100, L = lossy(1, D, a);
        return {
          q: [`A boost converter runs at $D = ${n(D)}$; its inductor's winding resistance is $${n(ap)}\\%$ of the load. Find the actual conversion ratio and the efficiency.`, `昇圧変換器が $D = ${n(D)}$ で動いています。インダクタの巻線抵抗は負荷の $${n(ap)}\\%$ です。実際の変換比と効率を求めてください。`],
          a: { type: 'tuple', v: [L.M, 100 * L.eta], labels: ['$M$', ['$\\eta$ (%)', '$\\eta$（%）']], rel: 0.004 },
          hint: ['The inductor carries the input current, $I/(1 - D)$, so its loss is $I^2 R_L/(1 - D)^2$.', 'インダクタは入力電流 $I/(1 - D)$ を流すので、その損失は $I^2 R_L/(1 - D)^2$ です。'],
          sol: [[`Loss over output power: $\\dfrac{R_L/(1 - D)^2}{R} = \\dfrac{${n(a)}}{${n((1 - D) ** 2, 4)}} = ${n(a / (1 - D) ** 2, 4)}$, so $\\eta = 1/(1 + ${n(a / (1 - D) ** 2, 4)}) = ${n(100 * L.eta, 3)}\\%$.`, `損失と出力の比は $\\dfrac{R_L/(1 - D)^2}{R} = \\dfrac{${n(a)}}{${n((1 - D) ** 2, 4)}} = ${n(a / (1 - D) ** 2, 4)}$ なので $\\eta = 1/(1 + ${n(a / (1 - D) ** 2, 4)}) = ${n(100 * L.eta, 3)}\\%$ です。`], [`$M = \\eta/(1 - D) = ${n(L.eta, 4)} \\times ${n(1 / (1 - D), 4)} = ${n(L.M, 4)}$, against the ideal $${n(1 / (1 - D), 4)}$.`, `$M = \\eta/(1 - D) = ${n(L.eta, 4)} \\times ${n(1 / (1 - D), 4)} = ${n(L.M, 4)}$ で、理想の $${n(1 / (1 - D), 4)}$ と比べられます。`], ['The loss fraction grows as $1/(1 - D)^2$: a boost asked for a large gain spends most of its effort heating its own inductor.', '損失の割合は $1/(1 - D)^2$ で増えます。大きな利得を求められた昇圧変換器は、努力の大半を自分のインダクタを熱するのに使います。']],
          set: { type: 1, D, a: ap },
        };
      }
      if (form === 1) {
        const D = r.step(0.2, 0.85, 0.05), ap = r.pick([0.5, 1, 2, 3]), Vin = r.pick([5, 9, 12, 24]), L = lossy(2, D, ap / 100);
        return {
          q: [`A buck-boost converter runs from $${Vin}$ V at $D = ${n(D)}$, with winding resistance $${n(ap)}\\%$ of the load. What is the output voltage?`, `昇降圧変換器を $${Vin}$ V、$D = ${n(D)}$ で動かします。巻線抵抗は負荷の $${n(ap)}\\%$ です。出力電圧はいくつですか。`],
          a: { type: 'num', v: Vin * L.M, rel: 0.004, unit: ['V', 'V'] },
          hint: ['As in the boost, the inductor carries $I/(1 - D)$, so $M = -\\dfrac{D}{1 - D}\\cdot\\dfrac{1}{1 + a/(1 - D)^2}$.', '昇圧と同じくインダクタは $I/(1 - D)$ を流すので $M = -\\dfrac{D}{1 - D}\\cdot\\dfrac{1}{1 + a/(1 - D)^2}$ です。'],
          sol: [[`Ideal: $M_0 = -${n(D)}/${n(1 - D)} = ${n(ideal(2, D), 4)}$.`, `理想は $M_0 = -${n(D)}/${n(1 - D)} = ${n(ideal(2, D), 4)}$ です。`], [`Loss factor: $1/(1 + ${n(ap / 100)}/${n((1 - D) ** 2, 4)}) = ${n(L.eta, 4)}$, so $M = ${n(L.M, 4)}$ and $V = ${n(Vin * L.M, 4)}$ V.`, `損失の係数は $1/(1 + ${n(ap / 100)}/${n((1 - D) ** 2, 4)}) = ${n(L.eta, 4)}$ なので $M = ${n(L.M, 4)}$、$V = ${n(Vin * L.M, 4)}$ V です。`], ['The minus sign is real: the output is negative with respect to the input\'s ground.', '負の符号は本物で、出力は入力の接地に対して負です。']],
          set: { type: 2, D, a: ap },
        };
      }
      const t = r.int(1, 2), D = r.step(0.2, 0.8, 0.05), Vin = r.pick([5, 12, 24]), R = r.pick([5, 10, 20, 50]), V = Math.abs(ideal(t, D)) * Vin, Io = V / R, IL = Io / (1 - D);
      return {
        q: [`An ideal ${NAMES[t][0]} converter runs from $${Vin}$ V at $D = ${n(D)}$ into a $${R}\\ \\Omega$ load. What is the average inductor current?`, `理想的な${NAMES[t][1]}変換器を $${Vin}$ V、$D = ${n(D)}$ で $${R}\\ \\Omega$ の負荷に使います。インダクタの平均電流はいくつですか。`],
        a: { type: 'num', v: IL, rel: 0.004, unit: ['A', 'A'] },
        hint: ['The inductor delivers current to the output only while the switch is off, a fraction $1 - D$ of the time.', 'インダクタが出力に電流を送るのは、スイッチがオフの時間、つまり割合 $1 - D$ の間だけです。'],
        sol: [[`$|V| = ${n(Math.abs(ideal(t, D)), 4)} \\times ${Vin} = ${n(V, 4)}$ V, so the load takes $${n(Io, 4)}$ A.`, `$|V| = ${n(Math.abs(ideal(t, D)), 4)} \\times ${Vin} = ${n(V, 4)}$ V なので、負荷電流は $${n(Io, 4)}$ A です。`], [`Through the diode the output receives $I_L(1 - D)$ on average, so $I_L = ${n(Io, 4)}/${n(1 - D)} = ${n(IL, 4)}$ A.`, `出力はダイオードを通して平均 $I_L(1 - D)$ を受け取るので $I_L = ${n(Io, 4)}/${n(1 - D)} = ${n(IL, 4)}$ A です。`], ['That inductor current, larger than the load current, is what makes winding resistance so costly at high duty cycle.', '負荷電流より大きいこのインダクタ電流のために、デューティ比が大きいと巻線抵抗の損失が重くなるのです。']],
        set: { type: t, D, a: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const ap = r.pick([0.5, 1, 2, 4, 5, 8]), a = ap / 100, Dm = 1 - Math.sqrt(a), Mm = 1 / (2 * Math.sqrt(a));
        return {
          q: [`A boost converter's inductor has winding resistance $${n(ap)}\\%$ of the load. What is the largest gain it can ever reach, and at what duty cycle?`, `昇圧変換器のインダクタの巻線抵抗は負荷の $${n(ap)}\\%$ です。到達できる最大の利得と、そのときのデューティ比を求めてください。`],
          a: { type: 'tuple', v: [Mm, Dm], labels: ['$M_{\\max}$', '$D$'], tol: 0.002 },
          hint: ['With $u = 1 - D$, $M = \\dfrac{u}{u^2 + a}$. Maximise over $u$.', '$u = 1 - D$ とおくと $M = \\dfrac{u}{u^2 + a}$ です。$u$ について最大化します。'],
          sol: [['$\\dfrac{d}{du}\\dfrac{u}{u^2 + a} = \\dfrac{a - u^2}{(u^2 + a)^2} = 0$ at $u = \\sqrt a$.', '$\\dfrac{d}{du}\\dfrac{u}{u^2 + a} = \\dfrac{a - u^2}{(u^2 + a)^2}$ は $u = \\sqrt a$ で 0 になります。'], [`$\\sqrt a = ${n(Math.sqrt(a), 4)}$, so $D = ${n(Dm, 4)}$ and $M_{\\max} = \\dfrac{1}{2\\sqrt a} = ${n(Mm, 4)}$.`, `$\\sqrt a = ${n(Math.sqrt(a), 4)}$ なので $D = ${n(Dm, 4)}$、$M_{\\max} = \\dfrac{1}{2\\sqrt a} = ${n(Mm, 4)}$ です。`], ['Past that duty cycle the output falls, and a control loop that keeps raising $D$ to chase the voltage will collapse it: practical boosts stay well below $M_{\\max}$.', 'そのデューティ比を超えると出力は下がり、電圧を追ってデューティ比を上げ続ける制御ループは出力を崩してしまいます。実用の昇圧変換器は $M_{\\max}$ よりずっと下で使います。']],
          set: { type: 1, a: ap, D: r2(Dm) },
        };
      }
      if (form === 1) {
        const M = r.pick([3, 4, 5, 6, 8, 10]), a = 1 / (4 * M * M);
        return {
          q: [`A boost stage must be able to reach a gain of at least $${M}$. What is the largest winding resistance it can tolerate, as a percentage of the load resistance?`, `昇圧段は少なくとも $${M}$ の利得に到達できなければなりません。許される最大の巻線抵抗は、負荷抵抗の何パーセントですか。`],
          a: { type: 'num', v: 100 * a, rel: 0.004, unit: ['%', '%'] },
          hint: ['The ceiling of a lossy boost is $M_{\\max} = 1/(2\\sqrt{R_L/R})$.', '損失のある昇圧変換器の上限は $M_{\\max} = 1/(2\\sqrt{R_L/R})$ です。'],
          sol: [[`$M_{\\max} \\ge ${M}$ requires $\\sqrt a \\le 1/${2 * M}$, so $a \\le 1/${4 * M * M} = ${n(a, 5)}$.`, `$M_{\\max} \\ge ${M}$ には $\\sqrt a \\le 1/${2 * M}$、すなわち $a \\le 1/${4 * M * M} = ${n(a, 5)}$ が必要です。`], [`That is $${n(100 * a, 4)}\\%$ of the load, and even then the converter would only just touch $${M}$ at very low efficiency (50% at the peak). High step-up ratios are done with transformers or cascaded stages instead.`, `これは負荷の $${n(100 * a, 4)}\\%$ で、それでもピークでやっと $${M}$ に届くだけで効率はとても低く（ピークで 50%）なります。大きな昇圧比は、代わりに変圧器や多段構成で実現します。`]],
          set: { type: 1, a: Math.min(10, Math.max(0.1, Math.round(1000 * a) / 10)) },
        };
      }
      const ap = r.pick([1, 2, 3, 4, 5]), a = ap / 100;
      return {
        q: [`For a boost converter whose winding resistance is $${ap}\\%$ of the load, write the efficiency $\\eta$ as a function of the duty cycle $D$.`, `巻線抵抗が負荷の $${ap}\\%$ の昇圧変換器について、効率 $\\eta$ をデューティ比 $D$ の関数として書いてください。`],
        a: { type: 'expr', v: `1/(1+${n(a)}/(1-D)^2)`, vars: ['D'], dom: { D: [0.05, 0.95] }, lhs: ['$\\eta(D) =$', '$\\eta(D) =$'] },
        hint: ['Compare the inductor loss $I_L^2R_L$ with the output power $I^2R$, using $I_L = I/(1 - D)$.', '$I_L = I/(1 - D)$ を使って、インダクタの損失 $I_L^2R_L$ と出力 $I^2R$ を比べます。'],
        sol: [['$\\dfrac{P_{\\rm loss}}{P_{\\rm out}} = \\dfrac{I^2R_L/(1 - D)^2}{I^2R} = \\dfrac{a}{(1 - D)^2}$.', '$\\dfrac{P_{\\rm loss}}{P_{\\rm out}} = \\dfrac{I^2R_L/(1 - D)^2}{I^2R} = \\dfrac{a}{(1 - D)^2}$ です。'], [`$\\eta = \\dfrac{1}{1 + ${n(a)}/(1 - D)^2}$, which is $${n(100 / (1 + a), 3)}\\%$ at $D = 0$ and $${n(100 / (1 + a / 0.01), 3)}\\%$ at $D = 0.9$: the teal curve in the figure.`, `$\\eta = \\dfrac{1}{1 + ${n(a)}/(1 - D)^2}$ で、$D = 0$ では $${n(100 / (1 + a), 3)}\\%$、$D = 0.9$ では $${n(100 / (1 + a / 0.01), 3)}\\%$ です。図の青緑の曲線です。`]],
        set: { type: 1, a: ap },
      };
    },
  ];

  /* ---------- 3. continuous and discontinuous conduction ---------- */
  const Mdcm = (D, K) => 2 / (1 + Math.sqrt(1 + 4 * K / (D * D)));
  const Mbuck = (D, K) => (K >= 1 - D ? D : Mdcm(D, K));
  // a point (D, lk) on the figure's grid in discontinuous conduction
  function dcmCase(r) {
    for (;;) {
      const D = r.step(0.1, 0.9, 0.05), lk = r.step(-2, 0, 0.01), K = Math.pow(10, lk);
      if (K < 0.9 * (1 - D)) return { D, lk, K: Number(K.toPrecision(3)) };
    }
  }
  Q['ccm-dcm'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.pick([2, 4.7, 10, 22, 47, 100]), R = r.pick([1, 2, 5, 10, 20, 50]), f = r.pick([100, 200, 400, 500, 1000]), K = 2 * L * 1e-6 * f * 1e3 / R;
        return {
          q: [`A buck converter has $L = ${n(L)}\\ \\mu$H, load $R = ${R}\\ \\Omega$ and switches at $${f}$ kHz. What is its dimensionless parameter $K = 2L/(R\\,T_s)$?`, `降圧変換器は $L = ${n(L)}\\ \\mu$H、負荷 $R = ${R}\\ \\Omega$、スイッチング周波数 $${f}$ kHz です。無次元のパラメータ $K = 2L/(R\\,T_s)$ はいくつですか。`],
          a: { type: 'num', v: K, rel: 0.003 },
          hint: ['$1/T_s$ is the switching frequency.', '$1/T_s$ はスイッチング周波数です。'],
          sol: [[`$K = 2 L f_s/R = 2 \\times ${n(L)} \\times 10^{-6} \\times ${f} \\times 10^3/${R} = ${n(K, 4)}$.`, `$K = 2 L f_s/R = 2 \\times ${n(L)} \\times 10^{-6} \\times ${f} \\times 10^3/${R} = ${n(K, 4)}$ です。`], ['$K$ compares the inductor\'s time constant $L/R$ with the switching period: large $K$ means a stiff current with small relative ripple.', '$K$ はインダクタの時定数 $L/R$ とスイッチング周期を比べたもので、$K$ が大きいとリプルが相対的に小さい、硬い電流になります。']],
          ...(Math.log10(K) >= -2 && Math.log10(K) <= 0.5 ? { set: { lk: r2(Math.log10(K)) } } : {}),
        };
      }
      if (form === 1) {
        let D, lk, K;
        do { D = r.step(0.1, 0.9, 0.05); lk = r.step(-1.5, 0.3, 0.01); K = Math.pow(10, lk); } while (Math.abs(K - (1 - D)) < 0.06);
        const Ks = Number(K.toPrecision(3)), dcm = Ks < 1 - D;
        return {
          q: [`A diode buck converter runs at $D = ${n(D)}$ with $K = ${n(Ks)}$. Is its inductor current continuous or discontinuous?`, `ダイオードを使う降圧変換器が $D = ${n(D)}$、$K = ${n(Ks)}$ で動いています。インダクタ電流は連続ですか、不連続ですか。`],
          a: { type: 'choice', v: dcm ? 1 : 0, fixed: true, opts: [['Continuous', '連続'], ['Discontinuous', '不連続']] },
          hint: ['Compare $K$ with $K_{\\rm crit} = 1 - D$.', '$K$ を $K_{\\rm crit} = 1 - D$ と比べます。'],
          sol: [[`$K_{\\rm crit} = 1 - ${n(D)} = ${n(1 - D)}$, and $K = ${n(Ks)}$ is ${dcm ? 'below' : 'above'} it.`, `$K_{\\rm crit} = 1 - ${n(D)} = ${n(1 - D)}$ で、$K = ${n(Ks)}$ はそれより${dcm ? '小さい' : '大きい'}です。`], [dcm ? 'So the ripple is more than twice the average current, the valley would go negative, and the diode cuts the current off each cycle: discontinuous.' : 'So the valley of the ripple stays above zero: continuous, and $M = D$.', dcm ? 'したがってリプルが平均電流の二倍を超え、谷が負になろうとするので、ダイオードが毎周期電流を断ちます。不連続です。' : 'したがってリプルの谷は 0 より上にとどまります。連続で、$M = D$ です。']],
          set: { D, lk },
        };
      }
      const D = r.step(0.05, 0.95, 0.05), L = r.pick([5, 10, 20]), Rc = 2 * L * 1e-6 * 2e5 / (1 - D);
      return {
        q: [`At $D = ${n(D)}$, what is the smallest $K$ for which a diode buck converter stays in continuous conduction?`, `$D = ${n(D)}$ で、ダイオードを使う降圧変換器が連続モードにとどまる最小の $K$ はいくつですか。`],
        a: { type: 'num', v: 1 - D, tol: 0.001 },
        hint: ['At the boundary the valley of the ripple just touches zero.', '境界では、リプルの谷がちょうど 0 に触れます。'],
        sol: [[`The boundary is $K_{\\rm crit} = 1 - D = ${n(1 - D)}$.`, `境界は $K_{\\rm crit} = 1 - D = ${n(1 - D)}$ です。`], [`For example with $L = ${L}\\ \\mu$H at $200$ kHz this means a load of at most $${n(Rc, 4)}\\ \\Omega$. High duty cycles tolerate light loads better because the ripple $\\propto D(1 - D)$ shrinks.`, `たとえば $L = ${L}\\ \\mu$H、$200$ kHz なら負荷は $${n(Rc, 4)}\\ \\Omega$ 以下です。大きなデューティ比ほどリプル $\\propto D(1 - D)$ が小さくなるので、軽い負荷に強くなります。`]],
        set: { D, lk: r2(Math.log10(1 - D)) },
      };
    },
    (r) => {
      const form = r.int(0, 2), c = dcmCase(r), M = Mdcm(c.D, c.K), D2 = c.D * (1 - M) / M;
      if (form === 0) {
        return {
          q: [`A diode buck converter in discontinuous conduction runs at $D = ${n(c.D)}$ with $K = ${n(c.K)}$. What is its conversion ratio $M$?`, `不連続モードの、ダイオードを使う降圧変換器が $D = ${n(c.D)}$、$K = ${n(c.K)}$ で動いています。変換比 $M$ はいくつですか。`],
          a: { type: 'num', v: M, tol: 0.001 },
          hint: ['$M = \\dfrac{2}{1 + \\sqrt{1 + 4K/D^2}}$.', '$M = \\dfrac{2}{1 + \\sqrt{1 + 4K/D^2}}$ です。'],
          sol: [[`$4K/D^2 = 4 \\times ${n(c.K)}/${n(c.D * c.D, 4)} = ${n(4 * c.K / (c.D * c.D), 4)}$.`, `$4K/D^2 = 4 \\times ${n(c.K)}/${n(c.D * c.D, 4)} = ${n(4 * c.K / (c.D * c.D), 4)}$ です。`], [`$M = 2/(1 + ${n(Math.sqrt(1 + 4 * c.K / (c.D * c.D)), 4)}) = ${n(M, 4)}$, above the continuous value $D = ${n(c.D)}$: the output now depends on the load.`, `$M = 2/(1 + ${n(Math.sqrt(1 + 4 * c.K / (c.D * c.D)), 4)}) = ${n(M, 4)}$ で、連続モードの値 $D = ${n(c.D)}$ より大きくなります。出力が負荷に依存するようになります。`]],
          set: { D: c.D, lk: c.lk },
        };
      }
      if (form === 1) {
        return {
          q: [`In discontinuous conduction at $D = ${n(c.D)}$ and $K = ${n(c.K)}$, find $M$ and the fraction $D_2$ of the period during which the current ramps down.`, `$D = ${n(c.D)}$、$K = ${n(c.K)}$ の不連続モードで、$M$ と、電流が下がっていく区間の周期に対する割合 $D_2$ を求めてください。`],
          a: { type: 'tuple', v: [M, D2], labels: ['$M$', '$D_2$'], tol: 0.002 },
          hint: ['Volt-seconds: $(V_{\\rm in} - V)D = V D_2$.', 'ボルト秒の釣り合い $(V_{\\rm in} - V)D = V D_2$ を使います。'],
          sol: [[`$M = 2/(1 + \\sqrt{1 + 4K/D^2}) = ${n(M, 4)}$.`, `$M = 2/(1 + \\sqrt{1 + 4K/D^2}) = ${n(M, 4)}$ です。`], [`$D_2 = D(1 - M)/M = ${n(c.D)} \\times ${n(1 - M, 4)}/${n(M, 4)} = ${n(D2, 4)}$.`, `$D_2 = D(1 - M)/M = ${n(c.D)} \\times ${n(1 - M, 4)}/${n(M, 4)} = ${n(D2, 4)}$ です。`], [`The current is zero for the remaining $D_3 = ${n(1 - c.D - D2, 4)}$ of the period, while the capacitor alone feeds the load.`, `残りの $D_3 = ${n(1 - c.D - D2, 4)}$ の間は電流が 0 で、コンデンサだけが負荷に供給します。`]],
          set: { D: c.D, lk: c.lk },
        };
      }
      const Vin = r.pick([5, 12, 24, 48]);
      return {
        q: [`A $${Vin}$ V diode buck converter is set to $D = ${n(c.D)}$ and its load gives $K = ${n(c.K)}$. What output voltage does it actually produce?`, `$${Vin}$ V のダイオード降圧変換器を $D = ${n(c.D)}$ に設定し、負荷から $K = ${n(c.K)}$ となっています。実際の出力電圧はいくつですか。`],
        a: { type: 'num', v: Vin * Mbuck(c.D, c.K), rel: 0.003, unit: ['V', 'V'] },
        hint: ['First check which mode it is in: compare $K$ with $1 - D$.', 'まずモードを確かめます。$K$ を $1 - D$ と比べます。'],
        sol: [[`$K = ${n(c.K)} < 1 - D = ${n(1 - c.D)}$: discontinuous.`, `$K = ${n(c.K)} < 1 - D = ${n(1 - c.D)}$ なので不連続です。`], [`$M = ${n(M, 4)}$, so $V = ${n(Vin * M, 4)}$ V instead of $D\\,V_{\\rm in} = ${n(c.D * Vin, 4)}$ V, an error of $${n(100 * (M / c.D - 1), 3)}\\%$ that the feedback loop must correct.`, `$M = ${n(M, 4)}$ なので $V = ${n(Vin * M, 4)}$ V となり、$D\\,V_{\\rm in} = ${n(c.D * Vin, 4)}$ V ではありません。帰還ループが補正すべき $${n(100 * (M / c.D - 1), 3)}\\%$ のずれです。`]],
        set: { D: c.D, lk: c.lk },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        let K, M, D;
        do { K = r.pick([0.01, 0.02, 0.05, 0.1, 0.2]); M = r.pick([0.3, 0.4, 0.5, 0.6, 0.75, 0.8]); D = M * Math.sqrt(K / (1 - M)); } while (K >= 1 - D || D < 0.05);
        return {
          q: [`A diode buck converter with $K = ${n(K)}$ must give $M = ${n(M)}$, and runs in discontinuous conduction. What duty cycle does it need?`, `$K = ${n(K)}$ の、ダイオードを使う降圧変換器で $M = ${n(M)}$ を得たい。不連続モードで動いています。必要なデューティ比はいくつですか。`],
          a: { type: 'num', v: D, tol: 0.001 },
          hint: ['Solve $M = 2/(1 + \\sqrt{1 + 4K/D^2})$ for $D$.', '$M = 2/(1 + \\sqrt{1 + 4K/D^2})$ を $D$ について解きます。'],
          sol: [['$\\sqrt{1 + 4K/D^2} = 2/M - 1$, so $4K/D^2 = (2/M - 1)^2 - 1 = 4(1 - M)/M^2$, giving $D = M\\sqrt{K/(1 - M)}$.', '$\\sqrt{1 + 4K/D^2} = 2/M - 1$ より $4K/D^2 = (2/M - 1)^2 - 1 = 4(1 - M)/M^2$ で、$D = M\\sqrt{K/(1 - M)}$ です。'], [`$D = ${n(M)}\\sqrt{${n(K)}/${n(1 - M)}} = ${n(D, 4)}$, much less than the $${n(M)}$ continuous conduction would need. Check: $K = ${n(K)} < 1 - D = ${n(1 - D, 4)}$, so it is indeed discontinuous.`, `$D = ${n(M)}\\sqrt{${n(K)}/${n(1 - M)}} = ${n(D, 4)}$ で、連続モードで必要な $${n(M)}$ よりずっと小さくなります。確認：$K = ${n(K)} < 1 - D = ${n(1 - D, 4)}$ なので、確かに不連続です。`]],
          set: { D: Math.max(0.05, r2(D)), lk: r2(Math.log10(K)) },
        };
      }
      if (form === 1) {
        const K = r.pick([0.02, 0.04, 0.05, 0.1, 0.2]);
        return {
          q: [`At fixed $K = ${n(K)}$, write the buck converter's conversion ratio $M$ as a function of $D$ in the discontinuous region $D < ${n(1 - K)}$.`, `$K = ${n(K)}$ に固定したとき、不連続の領域 $D < ${n(1 - K)}$ における降圧変換器の変換比 $M$ を $D$ の関数として書いてください。`],
          a: { type: 'expr', v: `2/(1+sqrt(1+${n(4 * K)}/D^2))`, vars: ['D'], dom: { D: [0.05, 0.95 * (1 - K)] }, lhs: ['$M(D) =$', '$M(D) =$'] },
          hint: ['Charge balance on the capacitor plus volt-second balance on the inductor give a quadratic for $M$.', 'コンデンサの電荷の釣り合いとインダクタのボルト秒の釣り合いから、$M$ の二次方程式が出ます。'],
          sol: [['The average inductor current $\\tfrac12 i_{\\rm pk}(D + D_2)$ must equal $V/R$, with $i_{\\rm pk} = (V_{\\rm in} - V)DT_s/L$ and $D_2 = D(1 - M)/M$; this reduces to $M^2 + \\dfrac{K}{D^2}M - \\dfrac{K}{D^2} = 0$.', 'インダクタの平均電流 $\\tfrac12 i_{\\rm pk}(D + D_2)$ が $V/R$ に等しく、$i_{\\rm pk} = (V_{\\rm in} - V)DT_s/L$、$D_2 = D(1 - M)/M$ なので、$M^2 + \\dfrac{K}{D^2}M - \\dfrac{K}{D^2} = 0$ になります。'], [`Its positive root is $M = \\dfrac{2}{1 + \\sqrt{1 + 4K/D^2}} = \\dfrac{2}{1 + \\sqrt{1 + ${n(4 * K)}/D^2}}$.`, `その正の根は $M = \\dfrac{2}{1 + \\sqrt{1 + 4K/D^2}} = \\dfrac{2}{1 + \\sqrt{1 + ${n(4 * K)}/D^2}}$ です。`], [`At $D = ${n(1 - K)}$ it equals $D$ and joins the continuous line $M = D$ smoothly; below that it bows above it, as the solid curve in the right-hand figure shows.`, `$D = ${n(1 - K)}$ では $D$ に等しく、連続モードの直線 $M = D$ になめらかにつながります。それより下では直線より上にふくらみます。右の図の実線です。`]],
          set: { lk: r2(Math.log10(K)) },
        };
      }
      if (form === 2) {
        const Vin = r.pick([5, 12, 24, 48]), L = r.pick([4.7, 10, 22, 47]), D = r.step(0.1, 0.9, 0.05), Ic = Vin * D * (1 - D) / (2 * L * 1e-6 * 2e5);
        return {
          q: [`A $${Vin}$ V diode buck converter at $200$ kHz has $L = ${n(L)}\\ \\mu$H and runs at $D = ${n(D)}$. Below what load current does it enter discontinuous conduction?`, `$${Vin}$ V、$200$ kHz のダイオード降圧変換器は $L = ${n(L)}\\ \\mu$H、$D = ${n(D)}$ で動いています。負荷電流がいくつより小さくなると不連続モードに入りますか。`],
          a: { type: 'num', v: Ic, rel: 0.004, unit: ['A', 'A'] },
          hint: ['The current runs dry when its average falls to half the ripple.', '平均がリプルの半分まで下がると電流が尽きます。'],
          sol: [[`$\\Delta I = V_{\\rm in}D(1 - D)/(L f_s) = ${n(2 * Ic, 4)}$ A.`, `$\\Delta I = V_{\\rm in}D(1 - D)/(L f_s) = ${n(2 * Ic, 4)}$ A です。`], [`$I_{\\rm crit} = \\Delta I/2 = ${n(Ic, 4)}$ A. At lighter loads the valley would go negative, which the diode forbids.`, `$I_{\\rm crit} = \\Delta I/2 = ${n(Ic, 4)}$ A です。これより軽い負荷では谷が負になろうとし、ダイオードがそれを許しません。`], ['This is why phone chargers and laptop supplies spend most of their life in discontinuous conduction, and why their control is designed for it.', 'このため携帯電話の充電器やノートパソコンの電源は、大半の時間を不連続モードで過ごし、制御もそれに合わせて設計されています。']],
        };
      }
      return {
        q: ['Take a diode buck converter at fixed $D$ and remove the load entirely ($K \\to 0$). What does the conversion ratio $M$ tend to?', 'ダイオードを使う降圧変換器で $D$ を固定し、負荷を完全に外します（$K \\to 0$）。変換比 $M$ は何に近づきますか。'],
        a: { type: 'choice', v: 0, opts: [['$1$: the output charges up to the input voltage', '$1$：出力が入力電圧まで充電される'], ['$D$: the ideal ratio still holds', '$D$：理想の比がそのまま成り立つ'], ['$0$: with no load current there is no output', '$0$：負荷電流がなければ出力もない'], ['$2D$: the ripple doubles the average', '$2D$：リプルが平均を二倍にする']] },
        hint: ['Look at $M = 2/(1 + \\sqrt{1 + 4K/D^2})$ as $K \\to 0$.', '$K \\to 0$ での $M = 2/(1 + \\sqrt{1 + 4K/D^2})$ を見ます。'],
        sol: [['$\\sqrt{1 + 4K/D^2} \\to 1$, so $M \\to 2/2 = 1$.', '$\\sqrt{1 + 4K/D^2} \\to 1$ なので $M \\to 2/2 = 1$ です。'], ['Each pulse dumps a little charge into the capacitor and nothing takes it away, so the output climbs to $V_{\\rm in}$. Real controllers skip pulses at light load to prevent this.', '各パルスがコンデンサに少しずつ電荷を入れ、それを取り去るものがないので、出力は $V_{\\rm in}$ まで上がります。実際の制御器は軽負荷でパルスを間引いてこれを防ぎます。']],
        set: { lk: -2 },
      };
    },
  ];
})();
