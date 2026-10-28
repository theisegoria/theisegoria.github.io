'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, C = 299792458, LAM = 632.8e-9, FWHM = 1.5e9;
  const s3 = (x) => sig(x, 3);
  const steadyP = (r, b) => ((r - 1) + Math.sqrt((r - 1) ** 2 + 4 * b * r)) / 2;
  const sup = (e) => `10^{${e}}`;

  /* ---------------- 1. rate equations ---------------- */
  Q['rate-equations'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const rr = r.step(0.2, 6, 0.05), above = rr > 1, askP = r.chance(0.5) && above;
        return {
          q: [askP ? `Ignoring spontaneous emission into the mode ($\\beta \\to 0$), the laser is pumped at $r = ${n(rr)}$ times threshold. What is the steady photon number $p$ in units of saturation?` : `With $\\beta \\to 0$ and pump $r = ${n(rr)}$ times threshold, what is the steady inversion $n = N/N_{\\text{th}}$?`, askP ? `モードへの自然放出を無視して（$\\beta \\to 0$）、レーザーをしきい値の $r = ${n(rr)}$ 倍で励起します。定常の光子数 $p$（飽和単位）はいくらですか。` : `$\\beta \\to 0$、ポンプがしきい値の $r = ${n(rr)}$ 倍のとき、定常の反転分布 $n = N/N_{\\text{th}}$ はいくらですか。`],
          a: { type: 'num', v: askP ? rr - 1 : Math.min(rr, 1) },
          hint: ['In the steady state $dp/dt = 0$ means either $p = 0$ or gain equals loss, $n = 1$.', '定常状態で $dp/dt = 0$ となるのは、$p = 0$ か、利得が損失に等しい $n = 1$ のときです。'],
          sol: [[above ? `Above threshold the lasing solution $n = 1$ holds, and $dn/dt = 0$ gives $r - 1 - p = 0$.` : `Below threshold $p = 0$, so $dn/dt = r - n = 0$ gives $n = r$.`, above ? 'しきい値より上では発振解 $n = 1$ が成り立ち、$dn/dt = 0$ から $r - 1 - p = 0$ です。' : 'しきい値より下では $p = 0$ なので、$dn/dt = r - n = 0$ から $n = r$ です。'], [askP ? `$p = r - 1 = ${n(rr - 1)}$: every pump event beyond threshold becomes a laser photon.` : above ? `$n = 1$: the inversion is clamped at threshold however hard you pump.` : `$n = ${n(rr)}$: the inversion simply follows the pump, and the gain never reaches the loss.`, askP ? `$p = r - 1 = ${n(rr - 1)}$ です。しきい値を超えた分のポンプはすべてレーザー光子になります。` : above ? '$n = 1$ です。どれほど強く励起しても、反転分布はしきい値に固定されます。' : `$n = ${n(rr)}$ です。反転分布はポンプにそのまま従い、利得は損失に届きません。`]],
          set: { r: rr },
        };
      }
      if (form === 1) {
        const eta = r.pick([0.2, 0.3, 0.4, 0.5, 0.6]), Pth = r.pick([0.5, 1, 1.5, 2, 3]), Pp = Pth + r.pick([1, 2, 3, 5, 8]);
        const Po = eta * (Pp - Pth);
        return {
          q: [`A diode-pumped laser has threshold $${n(Pth)}$ W and slope efficiency $${n(eta * 100)}\\%$. What output power does it give at $${n(Pp)}$ W of pump?`, `しきい値 $${n(Pth)}$ W、スロープ効率 $${n(eta * 100)}\\%$ の半導体励起レーザーがあります。ポンプ $${n(Pp)}$ W のときの出力はいくらですか。`],
          a: { type: 'num', v: Po, unit: ['W', 'W'] },
          hint: ['Above threshold the output is a straight line: $P_{\\text{out}} = \\eta(P_{\\text{pump}} - P_{\\text{th}})$.', 'しきい値より上では出力は直線です。$P_{\\text{out}} = \\eta(P_{\\text{pump}} - P_{\\text{th}})$ です。'],
          sol: [[`$P_{\\text{out}} = ${n(eta)}\\times(${n(Pp)} - ${n(Pth)}) = ${n(Po, 4)}$ W.`, `$P_{\\text{out}} = ${n(eta)}\\times(${n(Pp)} - ${n(Pth)}) = ${n(Po, 4)}$ W です。`], ['The pump below threshold only pays for the losses; that is the kink at $r = 1$ in the left-hand graph.', 'しきい値までのポンプは損失を補うだけです。左のグラフで $r = 1$ にある折れ目がそれです。']],
        };
      }
      return {
        q: ['Above threshold, the pump is raised further. What happens to the inversion and to the output?', 'しきい値より上で、さらにポンプを強めます。反転分布と出力はどうなりますか。'],
        a: { type: 'choice', v: 0, opts: [['The inversion stays at its threshold value and all the extra pump becomes light', '反転分布はしきい値の値にとどまり、余分なポンプはすべて光になる'], ['The inversion keeps rising in proportion to the pump, and so does the gain', '反転分布はポンプに比例して増え続け、利得も増える'], ['The output saturates at a fixed level and the inversion grows instead', '出力は一定値で飽和し、代わりに反転分布が増える'], ['Both the inversion and the output grow, each by half of the extra pump', '反転分布と出力が、余分なポンプを半分ずつ分け合って増える']] },
        hint: ['In steady state the round-trip gain must equal the loss exactly, or the photon number would grow or decay forever.', '定常状態では一往復の利得が損失にちょうど等しくなければなりません。そうでないと光子数は際限なく増えるか減るかします。'],
        sol: [['Gain is proportional to the inversion, and a steady photon number needs gain = loss, which fixes $n = 1$.', '利得は反転分布に比例し、光子数が定常であるには利得 = 損失が必要なので、$n = 1$ に固定されます。'], ['Then $dn/dt = r - 1 - p = 0$ gives $p = r - 1$: the extra pump is converted by stimulated emission as fast as it arrives. This is gain clamping.', 'すると $dn/dt = r - 1 - p = 0$ から $p = r - 1$ です。余分なポンプは、来るそばから誘導放出で光に変わります。これが利得のクランプです。']],
        set: { r: 4 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        if (r.chance(0.5)) {
          const lrho = r.pick([2, 2.5, 3]), rho = Math.round(10 ** lrho), rr = r.step(1.5, 5, 0.5), w = Math.sqrt(rho * (rr - 1));
          return {
            q: [`In the figure's units (time in $\\tau$), $\\rho = \\tau/\\tau_c = ${rho}$ and $r = ${n(rr)}$. What is the predicted relaxation-oscillation frequency $\\omega_R\\tau$?`, `図の単位（時間は $\\tau$ 単位）で $\\rho = \\tau/\\tau_c = ${rho}$、$r = ${n(rr)}$ です。緩和振動の角周波数の予測値 $\\omega_R\\tau$ はいくらですか。`],
            a: { type: 'num', v: w },
            hint: ['Linearise about the steady state: $\\omega_R^2 = (r - 1)/(\\tau\\tau_c)$.', '定常状態のまわりで線形化すると $\\omega_R^2 = (r - 1)/(\\tau\\tau_c)$ です。'],
            sol: [[`$\\omega_R\\tau = \\sqrt{\\rho(r - 1)} = \\sqrt{${rho}\\times${n(rr - 1)}} = ${n(w, 4)}$.`, `$\\omega_R\\tau = \\sqrt{\\rho(r - 1)} = \\sqrt{${rho}\\times${n(rr - 1)}} = ${n(w, 4)}$ です。`], [`That is $${n(w / (2 * PI), 3)}$ spikes per upper-level lifetime, while they die away at $\\gamma\\tau = r/2 = ${n(rr / 2)}$: the measured value in the readout comes close.`, `上準位の寿命あたり $${n(w / (2 * PI), 3)}$ 回のスパイクで、それらは $\\gamma\\tau = r/2 = ${n(rr / 2)}$ で減衰します。読み取り欄の測定値はこれに近くなります。`]],
            set: { r: rr, lrho },
          };
        }
        const tau = r.pick([230, 100, 1000]) * 1e-6, tc = r.pick([5, 10, 20, 50]) * 1e-9, rr = r.pick([1.5, 2, 3, 4]);
        const f = Math.sqrt((rr - 1) / (tau * tc)) / (2 * PI);
        return {
          q: [`A solid-state laser has upper-level lifetime $\\tau = ${n(tau * 1e6)}\\ \\mu\\text{s}$ and photon lifetime $\\tau_c = ${n(tc * 1e9)}$ ns, pumped at $r = ${n(rr)}$. At what frequency does its output ring after switch-on?`, `上準位の寿命 $\\tau = ${n(tau * 1e6)}\\ \\mu\\text{s}$、光子寿命 $\\tau_c = ${n(tc * 1e9)}$ ns の固体レーザーを $r = ${n(rr)}$ で励起します。点灯後、出力はどんな周波数で振動しますか。`],
          a: { type: 'num', v: f / 1e3, rel: 0.01, unit: ['kHz', 'kHz'] },
          hint: ['$f_R = \\dfrac{1}{2\\pi}\\sqrt{\\dfrac{r - 1}{\\tau\\tau_c}}$.', '$f_R = \\dfrac{1}{2\\pi}\\sqrt{\\dfrac{r - 1}{\\tau\\tau_c}}$ です。'],
          sol: [[`$\\omega_R = \\sqrt{${n(rr - 1)}/(${s3(tau)}\\times${s3(tc)})} = ${s3(2 * PI * f)}$ rad/s.`, `$\\omega_R = \\sqrt{${n(rr - 1)}/(${s3(tau)}\\times${s3(tc)})} = ${s3(2 * PI * f)}$ rad/s です。`], [`$f_R = \\omega_R/2\\pi = ${s3(f / 1e3)}$ kHz: the geometric mean of the two very different time scales sets the ringing.`, `$f_R = \\omega_R/2\\pi = ${s3(f / 1e3)}$ kHz です。大きく異なる二つの時間尺度の幾何平均が振動を決めます。`]],
          set: { r: rr },
        };
      }
      if (form === 1) {
        const rr = r.step(1.1, 6, 0.05), t = -Math.log(1 - 1 / rr);
        return {
          q: [`The pump is switched on at $t = 0$ with $r = ${n(rr)}$. Before any light builds up, $n(t) = r(1 - e^{-t/\\tau})$. When does the inversion reach threshold? Give $t/\\tau$ to three decimals.`, `$t = 0$ で $r = ${n(rr)}$ のポンプを入れます。光が立ち上がる前は $n(t) = r(1 - e^{-t/\\tau})$ です。反転分布がしきい値に達するのはいつですか。$t/\\tau$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: t, tol: 0.0006 },
          hint: ['Solve $r(1 - e^{-t/\\tau}) = 1$.', '$r(1 - e^{-t/\\tau}) = 1$ を解きます。'],
          sol: [[`$e^{-t/\\tau} = 1 - 1/r = ${n(1 - 1 / rr, 4)}$.`, `$e^{-t/\\tau} = 1 - 1/r = ${n(1 - 1 / rr, 4)}$ です。`], [`$t/\\tau = -\\ln ${n(1 - 1 / rr, 4)} = ${n(t, 4)}$, as in the readout. The photons only start to grow after this, so harder pumping shortens the delay before the first spike.`, `$t/\\tau = -\\ln ${n(1 - 1 / rr, 4)} = ${n(t, 4)}$ で、読み取り欄と同じです。光子はこの後でようやく増え始めるので、強く励起するほど最初のスパイクまでの遅れは短くなります。`]],
          set: { r: rr },
        };
      }
      const rr = r.step(1.5, 6, 0.5), tau = r.pick([100, 230, 500]);
      return {
        q: [`The relaxation oscillations decay at $\\gamma_R = r/2\\tau$. For $r = ${n(rr)}$ and $\\tau = ${tau}\\ \\mu\\text{s}$, how long does it take for their amplitude to fall by a factor $e$?`, `緩和振動は $\\gamma_R = r/2\\tau$ で減衰します。$r = ${n(rr)}$、$\\tau = ${tau}\\ \\mu\\text{s}$ のとき、振幅が $1/e$ になるまでの時間はいくらですか。`],
        a: { type: 'num', v: 2 * tau / rr, unit: ['µs', 'µs'] },
        hint: ['The $1/e$ time is $1/\\gamma_R$.', '$1/e$ になる時間は $1/\\gamma_R$ です。'],
        sol: [[`$1/\\gamma_R = 2\\tau/r = 2\\times${tau}/${n(rr)} = ${n(2 * tau / rr, 4)}\\ \\mu\\text{s}$.`, `$1/\\gamma_R = 2\\tau/r = 2\\times${tau}/${n(rr)} = ${n(2 * tau / rr, 4)}\\ \\mu\\text{s}$ です。`], ['The damping depends only on the pump and the slow lifetime, while the frequency also involves the fast photon lifetime, so the laser rings for many cycles before it settles.', '減衰はポンプと遅い寿命だけで決まり、周波数には速い光子寿命も入るので、レーザーは落ち着くまでに何周期も振動します。']],
        set: { r: rr },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lb = r.step(-6, -1, 0.5), b = 10 ** lb, pth = steadyP(1, b), askJump = r.chance(0.4);
        const p2 = steadyP(2, b);
        return {
          q: [askJump ? `With $\\beta = ${sup(n(lb))}$, by what factor does the steady output grow between $r = 1$ and $r = 2$?` : `With spontaneous fraction $\\beta = ${sup(n(lb))}$, what is the steady photon number exactly at threshold, $r = 1$?`, askJump ? `$\\beta = ${sup(n(lb))}$ のとき、定常出力は $r = 1$ から $r = 2$ の間に何倍になりますか。` : `自然放出の割合が $\\beta = ${sup(n(lb))}$ のとき、ちょうどしきい値 $r = 1$ での定常光子数はいくらですか。`],
          a: { type: 'num', v: askJump ? p2 / pth : pth, rel: 0.005 },
          hint: ['Setting both derivatives to zero gives $p^2 - (r - 1)p - \\beta r = 0$.', '両方の導関数を 0 とおくと $p^2 - (r - 1)p - \\beta r = 0$ になります。'],
          sol: [['$dn/dt = 0$ gives $n = r/(1 + p)$; putting it into $dp/dt = 0$ gives $p^2 - (r - 1)p - \\beta r = 0$.', '$dn/dt = 0$ から $n = r/(1 + p)$、これを $dp/dt = 0$ に入れると $p^2 - (r - 1)p - \\beta r = 0$ です。'], askJump ? [`$p(1) = \\sqrt\\beta = ${s3(pth)}$ and $p(2) = \\tfrac12(1 + \\sqrt{1 + 8\\beta}) = ${n(p2, 5)}$, a factor $${s3(p2 / pth)}$.`, `$p(1) = \\sqrt\\beta = ${s3(pth)}$、$p(2) = \\tfrac12(1 + \\sqrt{1 + 8\\beta}) = ${n(p2, 5)}$ で、$${s3(p2 / pth)}$ 倍です。`] : [`At $r = 1$: $p^2 = \\beta$, so $p = \\sqrt\\beta = ${s3(pth)}$.`, `$r = 1$ では $p^2 = \\beta$ なので $p = \\sqrt\\beta = ${s3(pth)}$ です。`], ['The smaller $\\beta$, the sharper the threshold: on the logarithmic axis the output jumps by about $1/\\sqrt\\beta$ around $r = 1$, and by about $1/\\beta$ between well below and well above it.', '$\\beta$ が小さいほどしきい値は鋭くなります。対数軸では出力は $r = 1$ の付近で約 $1/\\sqrt\\beta$ 倍、十分下から十分上までで約 $1/\\beta$ 倍跳ね上がります。']],
          set: { lb, r: askJump ? 2 : 1, scale: 1 },
        };
      }
      if (form === 1) {
        const lb = r.pick([-1, -2]), b = 10 ** lb;
        return {
          q: [`With $\\beta = ${n(b)}$, write the steady photon number $p$ as a function of the pump $r$.`, `$\\beta = ${n(b)}$ のとき、定常の光子数 $p$ をポンプ $r$ の関数として書いてください。`],
          a: { type: 'expr', v: `((r-1)+sqrt((r-1)^2+${4 * b}*r))/2`, vars: ['r'], dom: { r: [0.2, 4] }, lhs: ['$p(r) =$', '$p(r) =$'] },
          hint: ['Eliminate $n$ between $dn/dt = 0$ and $dp/dt = 0$, then take the positive root.', '$dn/dt = 0$ と $dp/dt = 0$ から $n$ を消去し、正の根をとります。'],
          sol: [[`$n = r/(1 + p)$ and $(n - 1)p + \\beta n = 0$ give $p^2 - (r - 1)p - ${n(b)}r = 0$.`, `$n = r/(1 + p)$ と $(n - 1)p + \\beta n = 0$ から $p^2 - (r - 1)p - ${n(b)}r = 0$ です。`], [`$p(r) = \\tfrac12\\left[(r - 1) + \\sqrt{(r - 1)^2 + ${n(4 * b)}r}\\right]$.`, `$p(r) = \\tfrac12\\left[(r - 1) + \\sqrt{(r - 1)^2 + ${n(4 * b)}r}\\right]$ です。`], ['Far below threshold this is $\\approx \\beta r/(1 - r)$, far above it $\\approx r - 1$; the square root smooths the corner between the two lines.', 'しきい値より十分下では $\\approx \\beta r/(1 - r)$、十分上では $\\approx r - 1$ です。平方根が二本の直線の間の角を丸めます。']],
          set: { lb, scale: 0 },
        };
      }
      const lrho = r.pick([2, 2.5, 3]), rho = Math.round(10 ** lrho), w = r.pick([10, 15, 20, 30, 40]);
      const rr = 1 + w * w / rho;
      return {
        q: [`With $\\rho = \\tau/\\tau_c = ${rho}$, what pump $r$ makes the relaxation oscillations run at $\\omega_R\\tau = ${w}$?`, `$\\rho = \\tau/\\tau_c = ${rho}$ のとき、緩和振動が $\\omega_R\\tau = ${w}$ になるポンプ $r$ はいくらですか。`],
        a: { type: 'num', v: rr },
        hint: ['Invert $(\\omega_R\\tau)^2 = \\rho(r - 1)$.', '$(\\omega_R\\tau)^2 = \\rho(r - 1)$ を逆に解きます。'],
        sol: [[`$r = 1 + (\\omega_R\\tau)^2/\\rho = 1 + ${w * w}/${rho} = ${n(rr, 4)}$.`, `$r = 1 + (\\omega_R\\tau)^2/\\rho = 1 + ${w * w}/${rho} = ${n(rr, 4)}$ です。`], [rr > 6 ? 'That is beyond the slider: with this $\\rho$, ringing that fast needs very hard pumping.' : 'The frequency grows only as the square root of the excess pump, so doubling it takes four times the excess.', rr > 6 ? 'これはスライダーの範囲を超えます。この $\\rho$ でそれほど速く振動させるには、非常に強い励起が必要です。' : '周波数は余剰ポンプの平方根でしか増えないので、2倍にするには余剰を4倍にする必要があります。']],
        set: rr <= 6 ? { lrho, r: Math.round(rr * 20) / 20 } : { lrho },
      };
    },
  ];

  /* ---------------- 2. cavity modes ---------------- */
  const fsr = (Lm) => C / (2 * Lm), fin = (R) => PI * Math.sqrt(R) / (1 - R);
  Q['laser-cavity-modes'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.step(10, 100, 0.5);
        return {
          q: [`What is the free spectral range $c/2L$ of a cavity $${n(L)}$ cm long?`, `長さ $${n(L)}$ cm の共振器の自由スペクトル領域 $c/2L$ はいくらですか。`],
          a: { type: 'num', v: fsr(L / 100) / 1e6, unit: ['MHz', 'MHz'] },
          hint: ['A standing wave needs a whole number of half wavelengths in $L$, so neighbouring modes differ by $c/2L$.', '定在波には $L$ に半波長が整数個入る必要があるので、隣り合うモードは $c/2L$ だけ離れています。'],
          sol: [[`$c/2L = 2.998\\times10^8/(2\\times${n(L / 100)}) = ${s3(fsr(L / 100))}$ Hz $= ${n(fsr(L / 100) / 1e6, 4)}$ MHz.`, `$c/2L = 2.998\\times10^8/(2\\times${n(L / 100)}) = ${s3(fsr(L / 100))}$ Hz $= ${n(fsr(L / 100) / 1e6, 4)}$ MHz です。`], ['It is also the inverse of the round-trip time $2L/c$: the comb spacing and the round trip are two views of the same thing.', 'これは往復時間 $2L/c$ の逆数でもあります。櫛の間隔と往復時間は同じものを二つの面から見たものです。']],
          set: { L },
        };
      }
      if (form === 1) {
        const R = r.pick([0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 0.999]);
        return {
          q: [`What is the finesse $\\mathcal F = \\pi\\sqrt R/(1 - R)$ of a cavity whose mirrors have reflectivity $R = ${n(R)}$?`, `反射率 $R = ${n(R)}$ の鏡でできた共振器のフィネス $\\mathcal F = \\pi\\sqrt R/(1 - R)$ はいくらですか。`],
          a: { type: 'num', v: fin(R) },
          hint: ['Roughly, $\\mathcal F$ is $2\\pi$ divided by the fraction of light lost per round trip.', 'おおまかには、$\\mathcal F$ は一往復で失われる光の割合で $2\\pi$ を割ったものです。'],
          sol: [[`$\\mathcal F = \\pi\\sqrt{${n(R)}}/${n(1 - R)} = ${n(fin(R), 4)}$.`, `$\\mathcal F = \\pi\\sqrt{${n(R)}}/${n(1 - R)} = ${n(fin(R), 4)}$ です。`], ['The resonances are $\\mathcal F$ times narrower than their spacing, so better mirrors carve a finer comb.', '共鳴の幅は間隔の $1/\\mathcal F$ なので、よい鏡ほど細かい櫛を刻みます。']],
          set: { R },
        };
      }
      const R = r.step(0.8, 0.999, 0.001), g = -Math.log(R) * 100;
      return {
        q: [`Both mirrors have reflectivity $R = ${n(R)}$. What single-pass gain (in %) does the medium need to reach threshold, $R^2e^{2G} = 1$?`, `両方の鏡の反射率が $R = ${n(R)}$ です。しきい値 $R^2e^{2G} = 1$ に達するには、媒質に一往路あたり何 % の利得が必要ですか。`],
        a: { type: 'num', v: g, rel: 0.005, unit: ['%', '%'] },
        hint: ['Take logarithms: $G_{\\text{th}} = -\\ln R$.', '対数をとると $G_{\\text{th}} = -\\ln R$ です。'],
        sol: [[`$G_{\\text{th}} = -\\ln ${n(R)} = ${n(-Math.log(R), 5)}$, or $${n(g, 4)}\\%$ per pass.`, `$G_{\\text{th}} = -\\ln ${n(R)} = ${n(-Math.log(R), 5)}$、すなわち一往路あたり $${n(g, 4)}\\%$ です。`], ['For good mirrors $-\\ln R \\approx 1 - R$: the gain only has to replace what one mirror lets out per pass. That is the dashed line in the spectrum.', 'よい鏡では $-\\ln R \\approx 1 - R$ で、利得は一往路ごとに鏡一枚が逃がす分を補えば足ります。スペクトルの破線がそれです。']],
        set: { R },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const L = r.step(10, 100, 0.5), R = r.pick([0.9, 0.95, 0.98, 0.99, 0.995]), dnu = fsr(L / 100) / fin(R);
        return {
          q: [`A cavity $${n(L)}$ cm long has mirrors with $R = ${n(R)}$. How wide (full width at half maximum) is each resonance?`, `長さ $${n(L)}$ cm、鏡の反射率 $R = ${n(R)}$ の共振器があります。各共鳴の幅（半値全幅）はいくらですか。`],
          a: { type: 'num', v: dnu / 1e6, rel: 0.005, unit: ['MHz', 'MHz'] },
          hint: ['$\\delta\\nu = \\nu_F/\\mathcal F$.', '$\\delta\\nu = \\nu_F/\\mathcal F$ です。'],
          sol: [[`$\\nu_F = ${n(fsr(L / 100) / 1e6, 4)}$ MHz and $\\mathcal F = ${n(fin(R), 4)}$.`, `$\\nu_F = ${n(fsr(L / 100) / 1e6, 4)}$ MHz、$\\mathcal F = ${n(fin(R), 4)}$ です。`], [`$\\delta\\nu = ${n(fsr(L / 100) / 1e6, 4)}/${n(fin(R), 4)} = ${n(dnu / 1e6, 4)}$ MHz, the mode linewidth in the readout.`, `$\\delta\\nu = ${n(fsr(L / 100) / 1e6, 4)}/${n(fin(R), 4)} = ${n(dnu / 1e6, 4)}$ MHz で、読み取り欄のモード線幅です。`]],
          set: { L, R },
        };
      }
      if (form === 1) {
        const R = r.pick([0.95, 0.97, 0.98, 0.99]), Gth = -Math.log(R), G = r.step(Math.ceil(Gth * 1200) / 10, 15, 0.1);
        const band = FWHM * Math.sqrt(Math.log(G / 100 / Gth) / Math.LN2);
        return {
          q: [`The He-Ne gain curve is Gaussian with Doppler width $1.5$ GHz and peak $${n(G)}\\%$ per pass. With $R = ${n(R)}$ mirrors, how wide is the band of frequencies where gain exceeds loss?`, `ヘリウムネオンの利得曲線はドップラー幅 $1.5$ GHz、ピーク一往路 $${n(G)}\\%$ のガウス型です。鏡が $R = ${n(R)}$ のとき、利得が損失を上回る周波数帯の幅はいくらですか。`],
          a: { type: 'num', v: band / 1e9, rel: 0.005, unit: ['GHz', 'GHz'] },
          hint: ['Solve $G_0e^{-4\\ln2\\,\\nu^2/\\Delta\\nu_D^2} = -\\ln R$ for $\\nu$; the band is $2\\nu$.', '$G_0e^{-4\\ln2\\,\\nu^2/\\Delta\\nu_D^2} = -\\ln R$ を $\\nu$ について解きます。帯の幅は $2\\nu$ です。'],
          sol: [[`Loss per pass: $-\\ln ${n(R)} = ${n(Gth * 100, 4)}\\%$.`, `一往路あたりの損失は $-\\ln ${n(R)} = ${n(Gth * 100, 4)}\\%$ です。`], [`$2\\nu = \\Delta\\nu_D\\sqrt{\\ln(G_0/G_{\\text{th}})/\\ln 2} = 1.5\\sqrt{\\ln(${n(G / 100 / Gth, 4)})/\\ln 2} = ${n(band / 1e9, 4)}$ GHz.`, `$2\\nu = \\Delta\\nu_D\\sqrt{\\ln(G_0/G_{\\text{th}})/\\ln 2} = 1.5\\sqrt{\\ln(${n(G / 100 / Gth, 4)})/\\ln 2} = ${n(band / 1e9, 4)}$ GHz です。`], ['Every cavity resonance that falls inside this band lases, so dividing it by $c/2L$ tells you roughly how many modes to expect.', 'この帯に入る共振器の共鳴はすべて発振するので、これを $c/2L$ で割るとおよそのモード数がわかります。']],
          set: { G, R },
        };
      }
      const L = r.step(10, 100, 0.5), R = r.pick([0.9, 0.95, 0.98, 0.99, 0.995, 0.999]), dnu = fsr(L / 100) / fin(R), tc = 1 / (2 * PI * dnu);
      return {
        q: [`A cavity $${n(L)}$ cm long has $R = ${n(R)}$ mirrors. What is the photon lifetime $\\tau_c = 1/(2\\pi\\,\\delta\\nu)$?`, `長さ $${n(L)}$ cm、反射率 $R = ${n(R)}$ の鏡の共振器があります。光子寿命 $\\tau_c = 1/(2\\pi\\,\\delta\\nu)$ はいくらですか。`],
        a: { type: 'num', v: tc * 1e9, rel: 0.005, unit: ['ns', 'ns'] },
        hint: ['First the linewidth $\\delta\\nu = (c/2L)/\\mathcal F$.', 'まず線幅 $\\delta\\nu = (c/2L)/\\mathcal F$ を求めます。'],
        sol: [[`$\\delta\\nu = ${n(fsr(L / 100) / 1e6, 4)}\\ \\text{MHz}/${n(fin(R), 4)} = ${n(dnu / 1e6, 4)}$ MHz.`, `$\\delta\\nu = ${n(fsr(L / 100) / 1e6, 4)}\\ \\text{MHz}/${n(fin(R), 4)} = ${n(dnu / 1e6, 4)}$ MHz です。`], [`$\\tau_c = 1/(2\\pi\\times${s3(dnu)}) = ${n(tc * 1e9, 4)}$ ns, about $${n(tc * C / (2 * L / 100), 3)}$ round trips: a narrow line and a long-lived photon are the same statement.`, `$\\tau_c = 1/(2\\pi\\times${s3(dnu)}) = ${n(tc * 1e9, 4)}$ ns で、往復にして約 $${n(tc * C / (2 * L / 100), 3)}$ 回分です。線が細いことと光子が長生きすることは同じことです。`]],
        set: { L, R },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const G = r.pick([4, 5, 6, 8, 10]), R = r.pick([0.97, 0.98, 0.99]), Gth = -Math.log(R);
        const nu = FWHM / 2 * Math.sqrt(Math.log(G / 100 / Gth) / Math.LN2), Lmax = C / (4 * nu);
        return {
          q: [`With peak gain $${G}\\%$ per pass, Doppler width $1.5$ GHz and $R = ${n(R)}$, what is the longest cavity that can never hold two lasing modes at once?`, `ピーク利得が一往路 $${G}\\%$、ドップラー幅 $1.5$ GHz、$R = ${n(R)}$ のとき、二つのモードが同時に発振することが決してない最長の共振器長はいくらですか。`],
          a: { type: 'num', v: Lmax * 100, rel: 0.01, unit: ['cm', 'cm'] },
          hint: ['Two modes can both sit in the band above threshold only if the band is wider than their spacing $c/2L$.', '二つのモードがしきい値を超える帯に同時に入れるのは、帯の幅が間隔 $c/2L$ より広いときだけです。'],
          sol: [[`Band above threshold: $2\\nu_c = 1.5\\sqrt{\\ln(${n(G / 100 / Gth, 4)})/\\ln 2} = ${n(2 * nu / 1e9, 4)}$ GHz.`, `しきい値を超える帯の幅は $2\\nu_c = 1.5\\sqrt{\\ln(${n(G / 100 / Gth, 4)})/\\ln 2} = ${n(2 * nu / 1e9, 4)}$ GHz です。`], [`Require $c/2L \\ge 2\\nu_c$: $L \\le c/(4\\nu_c) = ${n(Lmax * 100, 4)}$ cm.`, `$c/2L \\ge 2\\nu_c$ が必要なので $L \\le c/(4\\nu_c) = ${n(Lmax * 100, 4)}$ cm です。`], ['Shorter than this, at most one resonance fits under the gain; as the mirror is nudged the laser hops from mode to mode instead of running on two.', 'これより短ければ、利得の下に入る共鳴は多くても一つです。鏡を動かすとレーザーは二つで発振する代わりに、モードからモードへ跳び移ります。']],
          set: Lmax * 100 >= 10 && Lmax * 100 <= 100 ? { G, R, L: Math.floor(Lmax * 200) / 2 } : { G, R },
        };
      }
      if (form === 1) {
        const L = r.step(20, 100, 10), full = r.chance(0.4), dnuMHz = full ? fsr(L / 100) / 1e6 : r.pick([10, 50, 100, 200]);
        const dL = (L / 100) * dnuMHz * 1e6 * LAM / C;
        return {
          q: [full ? `By how far must one mirror of a $${L}$ cm He-Ne cavity ($\\lambda = 632.8$ nm) move to slide the mode comb by exactly one free spectral range?` : `By how far must one mirror of a $${L}$ cm He-Ne cavity ($\\lambda = 632.8$ nm) move to shift every mode frequency by $${dnuMHz}$ MHz?`, full ? `長さ $${L}$ cm のヘリウムネオン共振器（$\\lambda = 632.8$ nm）で、モードの櫛をちょうど自由スペクトル領域一つ分ずらすには、片方の鏡をどれだけ動かせばよいですか。` : `長さ $${L}$ cm のヘリウムネオン共振器（$\\lambda = 632.8$ nm）で、すべてのモードの周波数を $${dnuMHz}$ MHz ずらすには、片方の鏡をどれだけ動かせばよいですか。`],
          a: { type: 'num', v: dL * 1e9, rel: 0.005, unit: ['nm', 'nm'] },
          hint: ['For a mode with $q$ half wavelengths, $\\nu = qc/2L$, so $\\Delta\\nu/\\nu = -\\Delta L/L$.', '半波長が $q$ 個のモードでは $\\nu = qc/2L$ なので $\\Delta\\nu/\\nu = -\\Delta L/L$ です。'],
          sol: [[`$\\nu = c/\\lambda = ${s3(C / LAM)}$ Hz, so $\\Delta L = L\\,\\Delta\\nu/\\nu = ${n(L / 100)}\\times${s3(dnuMHz * 1e6)}/${s3(C / LAM)}$.`, `$\\nu = c/\\lambda = ${s3(C / LAM)}$ Hz なので $\\Delta L = L\\,\\Delta\\nu/\\nu = ${n(L / 100)}\\times${s3(dnuMHz * 1e6)}/${s3(C / LAM)}$ です。`], [`$\\Delta L = ${n(dL * 1e9, 4)}$ nm.${full ? ' That is $\\lambda/2$ whatever the length: adding half a wavelength turns mode $q$ into mode $q + 1$, which is why the nudge slider stops at 316 nm.' : ' A few nanometres, so thermal expansion of the cavity easily drags the modes by this much.'}`, `$\\Delta L = ${n(dL * 1e9, 4)}$ nm です。${full ? '長さによらず $\\lambda/2$ です。半波長を加えるとモード $q$ がモード $q + 1$ になるからで、微調整のスライダーが 316 nm までなのはこのためです。' : 'ほんの数ナノメートルなので、共振器の熱膨張でもモードは簡単にこれだけ引きずられます。'}`]],
          set: { L, dz: Math.min(316, Math.round(dL * 1e9)) },
        };
      }
      const G = r.step(1, 10, 0.5), Rmin = Math.exp(-G / 100);
      return {
        q: [`The gain medium gives at most $${n(G)}\\%$ per pass at line centre. What is the lowest mirror reflectivity (both mirrors equal) that still lets the laser run? Give four decimals.`, `利得媒質の利得は線中心で最大一往路 $${n(G)}\\%$ です。レーザーが発振できる最小の鏡の反射率（両方等しいとします）はいくらですか。小数第4位まで求めてください。`],
        a: { type: 'num', v: Rmin, tol: 0.00006 },
        hint: ['At threshold the peak gain just equals the loss, $G_0 = -\\ln R$.', 'しきい値ではピーク利得がちょうど損失に等しく、$G_0 = -\\ln R$ です。'],
        sol: [[`$R_{\\min} = e^{-G_0} = e^{-${n(G / 100)}} = ${n(Rmin, 5)}$.`, `$R_{\\min} = e^{-G_0} = e^{-${n(G / 100)}} = ${n(Rmin, 5)}$ です。`], ['A He-Ne tube has only a few percent of gain per pass, which is why it needs mirrors above 98 or 99 percent, while a high-gain dye or semiconductor laser can work with far leakier ones.', 'ヘリウムネオン管の利得は一往路わずか数パーセントなので、98 か 99 パーセントを超える鏡が必要です。利得の高い色素レーザーや半導体レーザーなら、ずっと漏れの多い鏡でも発振します。']],
        set: { G, R: Math.min(0.999, Math.max(0.8, Math.ceil(Rmin * 1000) / 1000)) },
      };
    },
  ];

  /* ---------------- 3. mode locking ---------------- */
  Q['mode-locking'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([3, 5, 7, 9, 11, 15, 21, 25, 31, 41]);
        return {
          q: [`$${N}$ equal-amplitude modes are locked in phase. What is the peak intensity divided by the mean intensity?`, `振幅の等しい $${N}$ 個のモードの位相がそろっています。ピーク強度は平均強度の何倍ですか。`],
          a: { type: 'num', v: N },
          hint: ['At the peak the amplitudes add: $N$ times one field, $N^2$ times one intensity. The mean is the sum of the intensities.', 'ピークでは振幅が足し合わさり、場は1つの $N$ 倍、強度は $N^2$ 倍です。平均は強度の和です。'],
          sol: [[`Peak: $|N a|^2 = ${N * N}a^2$. Mean: $\\sum a^2 = ${N}a^2$.`, `ピークは $|N a|^2 = ${N * N}a^2$、平均は $\\sum a^2 = ${N}a^2$ です。`], [`Ratio $= ${N}$: the same energy squeezed into a fraction about $1/${N}$ of the round trip.`, `比は $${N}$ です。同じエネルギーが往復時間の約 $1/${N}$ に押し込められています。`]],
          set: { N, lock: 1, shape: 0 },
        };
      }
      if (form === 1) {
        const ring = r.chance(0.3), L = ring ? r.pick([1, 2, 3, 4]) : r.pick([0.5, 1, 1.5, 1.875, 2]);
        const f = ring ? C / L : C / (2 * L);
        return {
          q: [ring ? `A mode-locked ring laser has a round-trip path of $${n(L)}$ m. At what rate does it emit pulses?` : `A mode-locked laser has a linear cavity $${n(L)}$ m long. At what rate does it emit pulses?`, ring ? `一周の光路長が $${n(L)}$ m のモード同期リングレーザーがあります。パルスの繰り返し周波数はいくらですか。` : `長さ $${n(L)}$ m の直線型共振器のモード同期レーザーがあります。パルスの繰り返し周波数はいくらですか。`],
          a: { type: 'num', v: f / 1e6, unit: ['MHz', 'MHz'] },
          hint: ['One pulse circulates and leaks out once per round trip.', 'パルスは一つだけ周回し、一往復に一度漏れ出ます。'],
          sol: [[`The round trip is ${ring ? `$L/c$` : `$2L/c$`} $= ${s3(ring ? L / C : 2 * L / C)}$ s.`, `一往復の時間は ${ring ? '$L/c$' : '$2L/c$'} $= ${s3(ring ? L / C : 2 * L / C)}$ s です。`], [`$f_{\\text{rep}} = ${n(f / 1e6, 4)}$ MHz, which is also the spacing of the mode comb.`, `$f_{\\text{rep}} = ${n(f / 1e6, 4)}$ MHz で、これはモードの櫛の間隔でもあります。`]],
        };
      }
      const N = r.pick([5, 11, 21, 41, 101, 1001]), Tns = r.pick([4, 10, 12.5, 6.67]), dt = 0.886 * Tns / N;
      return {
        q: [`$${N}$ equal modes are locked in a cavity with round-trip time $T = ${n(Tns)}$ ns. Roughly how long is each pulse (full width at half maximum)?`, `往復時間 $T = ${n(Tns)}$ ns の共振器で、等しい $${N}$ 個のモードがロックされています。各パルスの長さ（半値全幅）はおよそいくらですか。`],
        a: { type: 'num', v: dt * 1000, rel: 0.01, unit: ['ps', 'ps'] },
        hint: ['$\\Delta t \\approx 0.886\\,T/N$ for a flat spectrum.', '平坦なスペクトルでは $\\Delta t \\approx 0.886\\,T/N$ です。'],
        sol: [[`$\\Delta t \\approx 0.886\\times${n(Tns)}\\ \\text{ns}/${N} = ${s3(dt)}$ ns $= ${s3(dt * 1000)}$ ps.`, `$\\Delta t \\approx 0.886\\times${n(Tns)}\\ \\text{ns}/${N} = ${s3(dt)}$ ns $= ${s3(dt * 1000)}$ ps です。`], ['More modes means a wider spectrum and a shorter pulse: duration and bandwidth are Fourier partners.', 'モードが多いほどスペクトルは広く、パルスは短くなります。時間幅と帯域幅はフーリエの関係にあります。']],
        set: N <= 41 ? { N, lock: 1, shape: 0 } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const dnuTHz = r.pick([5, 10, 20, 40, 100]), frep = r.pick([80, 100, 250]);
        const Nm = dnuTHz * 1e12 / (frep * 1e6), dt = 0.886 / (dnuTHz * 1e12);
        return {
          q: [`A Ti:sapphire laser locks modes across $${dnuTHz}$ THz of spectrum at a repetition rate of $${frep}$ MHz. How short can its pulses be, treating the spectrum as flat?`, `チタンサファイアレーザーが繰り返し $${frep}$ MHz で、$${dnuTHz}$ THz のスペクトル全体のモードをロックします。スペクトルを平坦とみなすと、パルスはどこまで短くなりますか。`],
          a: { type: 'num', v: dt * 1e15, rel: 0.01, unit: ['fs', 'fs'] },
          hint: ['Count the modes $N = \\Delta\\nu/f_{\\text{rep}}$, then use $\\Delta t \\approx 0.886\\,T/N$ with $T = 1/f_{\\text{rep}}$.', 'モード数 $N = \\Delta\\nu/f_{\\text{rep}}$ を数え、$T = 1/f_{\\text{rep}}$ として $\\Delta t \\approx 0.886\\,T/N$ を使います。'],
          sol: [[`$N = ${dnuTHz}\\times10^{12}/${frep}\\times10^{6} = ${s3(Nm)}$ modes.`, `$N = ${dnuTHz}\\times10^{12}/${frep}\\times10^{6} = ${s3(Nm)}$ 個のモードです。`], [`$\\Delta t \\approx 0.886/(N f_{\\text{rep}}) = 0.886/\\Delta\\nu = ${s3(dt * 1e15)}$ fs.`, `$\\Delta t \\approx 0.886/(N f_{\\text{rep}}) = 0.886/\\Delta\\nu = ${s3(dt * 1e15)}$ fs です。`], ['The repetition rate cancels: the pulse length is set by the bandwidth alone, which is why broadband media make the shortest pulses.', '繰り返し周波数は打ち消し合い、パルス幅は帯域幅だけで決まります。広帯域の媒質が最も短いパルスをつくるのはこのためです。']],
        };
      }
      if (form === 1) {
        const Pavg = r.pick([0.5, 1, 2, 5]), frep = r.pick([80, 100, 1]), dt = r.pick([10, 50, 100, 1000]) * 1e-15;
        const Pk = Pavg / (frep * 1e6 * dt);
        return {
          q: [`A mode-locked laser gives $${n(Pavg)}$ W average power as $${n(dt * 1e15)}$ fs pulses at $${frep}$ MHz. Roughly what is the peak power?`, `モード同期レーザーが、平均出力 $${n(Pavg)}$ W を $${frep}$ MHz、$${n(dt * 1e15)}$ fs のパルスとして出します。ピーク出力はおよそいくらですか。`],
          a: { type: 'num', v: Pk / 1e3, rel: 0.01, unit: ['kW', 'kW'] },
          hint: ['Energy per pulse $= P_{\\text{avg}}/f_{\\text{rep}}$; spread over the pulse length.', 'パルス1発のエネルギーは $P_{\\text{avg}}/f_{\\text{rep}}$ で、それをパルス幅に割り振ります。'],
          sol: [[`Pulse energy: $${n(Pavg)}/${frep}\\times10^6 = ${s3(Pavg / (frep * 1e6))}$ J.`, `パルスエネルギーは $${n(Pavg)}/${frep}\\times10^6 = ${s3(Pavg / (frep * 1e6))}$ J です。`], [`$P_{\\text{peak}} \\approx ${s3(Pavg / (frep * 1e6))}/${s3(dt)} = ${s3(Pk)}$ W $= ${s3(Pk / 1e3)}$ kW.`, `$P_{\\text{peak}} \\approx ${s3(Pavg / (frep * 1e6))}/${s3(dt)} = ${s3(Pk)}$ W $= ${s3(Pk / 1e3)}$ kW です。`], ['Locking leaves the average power unchanged and concentrates it in time, which is why a modest laser can reach intensities that drive nonlinear optics.', 'ロックは平均出力を変えずに時間的に集中させるだけです。控えめなレーザーでも非線形光学を起こすほどの強度に届くのはこのためです。']],
        };
      }
      const N = r.pick([3, 5, 7, 9, 11, 15, 21]);
      return {
        q: [`In units where one mode alone has intensity $1$, what is the peak intensity of $${N}$ equal modes locked in phase?`, `一つのモードだけの強度を $1$ とする単位で、位相のそろった等しい $${N}$ 個のモードのピーク強度はいくらですか。`],
        a: { type: 'int', v: N * N },
        hint: ['Add the fields, then square.', '場を足してから二乗します。'],
        sol: [[`$|E|_{\\max} = ${N}$, so $I_{\\max} = ${N}^2 = ${N * N}$.`, `$|E|_{\\max} = ${N}$ なので $I_{\\max} = ${N}^2 = ${N * N}$ です。`], [`The mean stays $${N}$ (each mode contributes $1$); the factor $${N}$ between peak and mean is bought by leaving the light dark for most of the round trip.`, `平均は $${N}$ のままです（各モードが $1$ ずつ寄与）。ピークと平均の間の $${N}$ 倍は、往復時間の大半を暗くすることで得られています。`]],
        set: { N, lock: 1, shape: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([2, 3, 4, 5]);
        return {
          q: [`$${N}$ equal modes are locked with zero phases. With time in units of the round trip ($T = 1$), write the intensity $I(t)$ in units of one mode.`, `等しい $${N}$ 個のモードが位相 0 でロックされています。時間を往復時間を単位として（$T = 1$）、強度 $I(t)$ を一つのモードの強度を単位として書いてください。`],
          a: { type: 'expr', v: `(sin(${N}*pi*t)/sin(pi*t))^2`, vars: ['t'], dom: { t: [0.06, 0.94] }, lhs: ['$I(t) =$', '$I(t) =$'] },
          hint: ['Sum the geometric series $\\sum_{q} e^{2\\pi i q t}$ over $N$ consecutive $q$.', '連続する $N$ 個の $q$ について等比級数 $\\sum_{q} e^{2\\pi i q t}$ を足します。'],
          sol: [[`$\\left|\\sum_{q=0}^{${N - 1}} e^{2\\pi i q t}\\right| = \\left|\\dfrac{1 - e^{2\\pi i ${N} t}}{1 - e^{2\\pi i t}}\\right| = \\left|\\dfrac{\\sin ${N}\\pi t}{\\sin \\pi t}\\right|$.`, `$\\left|\\sum_{q=0}^{${N - 1}} e^{2\\pi i q t}\\right| = \\left|\\dfrac{1 - e^{2\\pi i ${N} t}}{1 - e^{2\\pi i t}}\\right| = \\left|\\dfrac{\\sin ${N}\\pi t}{\\sin \\pi t}\\right|$ です。`], [`$I(t) = \\dfrac{\\sin^2 ${N}\\pi t}{\\sin^2\\pi t}${N === 2 ? ' = 4\\cos^2\\pi t' : N === 3 ? ' = (1 + 2\\cos 2\\pi t)^2' : ''}$, peaking at $${N * N}$ when $t$ is an integer.`, `$I(t) = \\dfrac{\\sin^2 ${N}\\pi t}{\\sin^2\\pi t}${N === 2 ? ' = 4\\cos^2\\pi t' : N === 3 ? ' = (1 + 2\\cos 2\\pi t)^2' : ''}$ で、$t$ が整数のとき最大値 $${N * N}$ になります。`], [`Between peaks it has $${N - 1}$ zeros per round trip, like an $N$-slit grating in time.`, `ピークの間には一往復あたり $${N - 1}$ 個の零点があり、時間の上の $N$ スリット格子のようです。`]],
          set: N % 2 ? { N, lock: 1, shape: 0 } : undefined,
        };
      }
      if (form === 1) {
        const Tns = r.pick([4, 10, 12.5, 6.67]), want = r.pick([50, 100, 200, 500, 1000]), Nm = Math.ceil(0.886 * Tns * 1000 / want - 1e-9);
        return {
          q: [`A cavity has round-trip time $${n(Tns)}$ ns. At least how many equal, locked modes are needed for pulses no longer than $${want}$ ps?`, `往復時間 $${n(Tns)}$ ns の共振器があります。パルス幅を $${want}$ ps 以下にするには、等しくロックされたモードが少なくとも何個必要ですか。`],
          a: { type: 'int', v: Nm },
          hint: ['Invert $\\Delta t \\approx 0.886\\,T/N$.', '$\\Delta t \\approx 0.886\\,T/N$ を逆に解きます。'],
          sol: [[`$N \\ge 0.886\\,T/\\Delta t = 0.886\\times${n(Tns * 1000)}/${want} = ${n(0.886 * Tns * 1000 / want, 4)}$.`, `$N \\ge 0.886\\,T/\\Delta t = 0.886\\times${n(Tns * 1000)}/${want} = ${n(0.886 * Tns * 1000 / want, 4)}$ です。`], [`So $N = ${Nm}$, spanning $${s3(Nm / (Tns * 1e-9) / 1e9)}$ GHz of gain bandwidth: a pulse this short needs a gain medium at least this broad.`, `したがって $N = ${Nm}$ で、利得の帯域幅 $${s3(Nm / (Tns * 1e-9) / 1e9)}$ GHz にわたります。これだけ短いパルスには、少なくともこれだけ広い利得媒質が必要です。`]],
        };
      }
      const which = r.int(0, 2);
      const qs = [['The phases of a multimode laser drift from random to locked. What happens to the average output power?', '多モードレーザーの位相がランダムからロックされた状態へ移ります。平均出力はどうなりますか。'], ['With random phases, $N$ modes give a noisy output. How often does the noise pattern repeat?', '位相がランダムなとき、$N$ 個のモードは雑音のような出力を出します。その模様はどのくらいの間隔で繰り返しますか。'], ['A spectrum with Gaussian amplitudes is locked instead of a flat one with the same number of modes. What changes in the pulse?', '同じ数のモードで、平坦なスペクトルの代わりにガウス型の振幅のスペクトルをロックします。パルスはどう変わりますか。']][which];
      const opts = [[['It stays the same: locking only rearranges the energy in time', '変わらない。ロックはエネルギーを時間の上で並べ替えるだけ'], ['It grows by a factor $N$', '$N$ 倍になる'], ['It grows by a factor $N^2$', '$N^2$ 倍になる'], ['It drops, because the light is dark most of the time', '光がほとんどの時間暗いので減る']], [['Every round trip $T$, because all mode frequencies are multiples of $1/T$', 'すべてのモード周波数が $1/T$ の倍数なので、往復時間 $T$ ごと'], ['Never: random phases make it truly random', '繰り返さない。位相がランダムなので本当にランダム'], ['Every $T/N$', '$T/N$ ごと'], ['Every $NT$', '$NT$ ごと']], [['The side lobes between pulses disappear and the pulse gets a little longer', 'パルス間の副ピークが消え、パルスは少し長くなる'], ['The pulse becomes $N$ times shorter', 'パルスが $N$ 分の 1 に短くなる'], ['Pulses no longer form at all', 'パルスがまったくできなくなる'], ['The repetition rate doubles', '繰り返し周波数が 2 倍になる']]][which];
      const sols = [[['The mean intensity is $\\sum a_q^2$ whatever the phases, because cross terms between different frequencies average to zero over a round trip.', '平均強度は位相によらず $\\sum a_q^2$ です。異なる周波数どうしの交差項は一往復で平均すると 0 になるからです。'], ['Locking moves energy from the dark stretches into the pulse; the readout\'s mean intensity does not move.', 'ロックは暗い区間のエネルギーをパルスへ移すだけで、読み取り欄の平均強度は動きません。']], [['Shifting $t$ by $T$ changes each term\'s phase by $2\\pi q$, a whole number of turns.', '$t$ を $T$ ずらすと各項の位相は $2\\pi q$、つまり整数回転だけ変わります。'], ['So the speckle is periodic with the round trip, exactly like the locked pulse train; only its shape within one period differs.', 'したがってスペックルは往復時間で周期的で、ロックしたパルス列とまったく同じです。違うのは一周期の中の形だけです。']], [['A Gaussian spectrum transforms into a Gaussian pulse, with no sharp spectral edges to produce ringing between pulses.', 'ガウス型のスペクトルはガウス型のパルスに変換され、パルス間の振動を生む鋭いスペクトルの端がありません。'], ['The effective bandwidth is narrower than the flat comb with the same $N$, so the pulse is somewhat longer and its peak/mean ratio lower.', '同じ $N$ の平坦な櫛より実効的な帯域幅が狭いので、パルスはやや長く、ピークと平均の比は小さくなります。']]][which];
      return {
        q: qs,
        a: { type: 'choice', v: 0, opts },
        hint: [['Average $|\\sum a_q e^{i(\\omega_q t + \\varphi_q)}|^2$ over one round trip.', '$|\\sum a_q e^{i(\\omega_q t + \\varphi_q)}|^2$ を一往復で平均してください。'], ['The mode frequencies are $q/T$.', 'モード周波数は $q/T$ です。'], ['The pulse is the Fourier transform of the spectrum.', 'パルスはスペクトルのフーリエ変換です。']][which],
        sol: sols,
        set: [{ lock: 0 }, { lock: 0 }, { shape: 1, lock: 1 }][which],
      };
    },
  ];
})();
