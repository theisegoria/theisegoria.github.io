'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PHI0 = 2.067833848e-15, PI = Math.PI;
  const lamT = (t) => 1 / Math.sqrt(1 - t ** 4);
  const mom = (a) => 1 - 3 / a / Math.tanh(a) + 3 / (a * a);

  /* ---------------- meissner-sphere ---------------- */
  Q['meissner-sphere'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick([0.3, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95]), L = lamT(t);
        return {
          q: [`With the two-fluid law $\\lambda(T) = \\lambda_0/\\sqrt{1 - t^4}$, what is $\\lambda/\\lambda_0$ at $t = T/T_c = ${t}$? Three decimals.`, `二流体の法則 $\\lambda(T) = \\lambda_0/\\sqrt{1 - t^4}$ で、$t = T/T_c = ${t}$ での $\\lambda/\\lambda_0$ はいくらですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: L, tol: 0.0006 },
          hint: ['Raise $t$ to the fourth power first.', 'まず $t$ を四乗します。'],
          sol: [[`$t^4 = ${n(t ** 4, 5)}$, so $1 - t^4 = ${n(1 - t ** 4, 5)}$.`, `$t^4 = ${n(t ** 4, 5)}$ なので $1 - t^4 = ${n(1 - t ** 4, 5)}$ です。`], [`$\\lambda/\\lambda_0 = 1/\\sqrt{${n(1 - t ** 4, 5)}} = ${n(L, 4)}$. The depth barely changes at low temperature and diverges at Tc.`, `$\\lambda/\\lambda_0 = 1/\\sqrt{${n(1 - t ** 4, 5)}} = ${n(L, 4)}$ です。低温ではほとんど変わらず、Tc で発散します。`]],
          set: { t },
        };
      }
      if (form === 1) {
        const lam = r.pick([40, 50, 80, 100, 150, 200]), x = r.pick([20, 50, 100, 150, 200, 300]), f = Math.exp(-x / lam);
        return {
          q: [`A field $B_0$ is applied parallel to the flat surface of a thick superconductor with $\\lambda = ${lam}$ nm. What fraction of $B_0$ remains at a depth of $${x}$ nm? Three significant figures.`, `侵入長 $\\lambda = ${lam}$ nm の厚い超伝導体の平らな表面に平行に磁場 $B_0$ をかけます。深さ $${x}$ nm で $B_0$ の何割が残りますか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: f, rel: 0.005 },
          hint: ['London: $B(x) = B_0 e^{-x/\\lambda}$.', 'ロンドン：$B(x) = B_0 e^{-x/\\lambda}$ です。'],
          sol: [[`$x/\\lambda = ${x}/${lam} = ${n(x / lam, 4)}$.`, `$x/\\lambda = ${x}/${lam} = ${n(x / lam, 4)}$ です。`], [`$e^{-${n(x / lam, 4)}} = ${n(f, 4)}$ of the surface field.`, `表面の磁場の $e^{-${n(x / lam, 4)}} = ${n(f, 4)}$ 倍です。`]],
        };
      }
      return {
        q: ['A sample is cooled through Tc while sitting in a weak field, then the field is switched off. What does a superconductor do that a hypothetical perfect conductor (zero resistance only) would not?', '試料を弱い磁場の中に置いたまま Tc より下に冷やし、そのあと磁場を切ります。超伝導体は、仮想的な完全導体（抵抗がゼロなだけ）がしないどんなことをしますか。'],
        a: { type: 'choice', fixed: true, v: 0, opts: [['It expels the field already on cooling, and is left with no field when it is switched off', '冷やした時点で磁場を追い出し、磁場を切ると何も残らない'], ['It traps the field when it is switched off, keeping the flux it had', '磁場を切ると磁場を閉じ込め、もっていた磁束を保つ'], ['It heats up because currents are induced', '電流が誘導されるので発熱する'], ['Nothing different: both behave the same', '違いはない。どちらも同じようにふるまう']] },
        hint: ['Zero resistance only forbids the flux from changing; the Meissner state forbids it from being there at all.', '抵抗がゼロであることは磁束の変化を禁じるだけですが、マイスナー状態は磁束が存在すること自体を禁じます。'],
        sol: [['A perfect conductor keeps whatever flux it had at the moment its resistance vanished, so it would trap the field.', '完全導体は抵抗が消えた瞬間の磁束を保つので、磁場を閉じ込めます。'], ['A superconductor expels the field as it cools through Tc (the Meissner effect), so its state does not depend on history: it is a thermodynamic phase.', '超伝導体は Tc を通って冷えるときに磁場を追い出します（マイスナー効果）。その状態は履歴によらず、熱力学的な相です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick([3, 5, 8, 12, 20, 30, 50]), f = mom(a);
        return {
          q: [`A London sphere has radius $R = ${a}\\lambda$. Using $m/m_{\\rm perfect} = 1 - \\tfrac{3\\lambda}{R}\\coth\\tfrac R\\lambda + \\tfrac{3\\lambda^2}{R^2}$, what fraction of a perfect diamagnet's moment does it have? Three decimals.`, `半径 $R = ${a}\\lambda$ のロンドン球があります。$m/m_{\\rm perfect} = 1 - \\tfrac{3\\lambda}{R}\\coth\\tfrac R\\lambda + \\tfrac{3\\lambda^2}{R^2}$ を使うと、完全反磁性体のモーメントの何倍ですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: f, tol: 0.0006 },
          hint: ['For $R/\\lambda$ above about 5, $\\coth$ is essentially 1.', '$R/\\lambda$ が 5 程度より大きければ、$\\coth$ はほぼ 1 です。'],
          sol: [[`$\\coth ${a} = ${n(1 / Math.tanh(a), 6)}$, so $3\\coth(${a})/${a} = ${n(3 / a / Math.tanh(a), 5)}$ and $3/${a}^2 = ${n(3 / (a * a), 5)}$.`, `$\\coth ${a} = ${n(1 / Math.tanh(a), 6)}$ なので $3\\coth(${a})/${a} = ${n(3 / a / Math.tanh(a), 5)}$、$3/${a}^2 = ${n(3 / (a * a), 5)}$ です。`], [`$m/m_{\\rm perfect} = ${n(f, 4)}$, roughly $1 - 3\\lambda/R$: a shell about one penetration depth thick is partly penetrated.`, `$m/m_{\\rm perfect} = ${n(f, 4)}$ で、およそ $1 - 3\\lambda/R$ です。厚さが侵入長一つ分ほどの殻に、磁場が一部侵入します。`]],
          set: { t: 0, a0: a },
        };
      }
      if (form === 1) {
        const Bc = r.pick([0.01, 0.02, 0.03, 0.08, 0.2]), B0 = 2 * Bc / 3;
        return {
          q: [`A large type I superconducting sphere has thermodynamic critical field $B_c = ${Bc}$ T. At what applied field does the field at its equator first reach $B_c$? In mT.`, `熱力学的臨界磁場が $B_c = ${Bc}$ T の大きな第一種超伝導体の球があります。加える磁場がいくらのとき、赤道の磁場がはじめて $B_c$ に達しますか。mT で答えてください。`],
          a: { type: 'num', v: B0 * 1000, rel: 0.005, unit: ['mT', 'mT'] },
          hint: ['A perfect diamagnetic sphere raises the equatorial field to $\\tfrac32B_0$.', '完全反磁性の球は赤道の磁場を $\\tfrac32B_0$ に上げます。'],
          sol: [[`The tangential field on the surface is $\\tfrac32B_0\\sin\\theta$, largest at the equator.`, `表面の接線方向の磁場は $\\tfrac32B_0\\sin\\theta$ で、赤道で最大です。`], [`$\\tfrac32B_0 = ${Bc}$ T gives $B_0 = ${n(B0 * 1000, 4)}$ mT. Above this the sphere breaks into an intermediate state of normal and superconducting regions.`, `$\\tfrac32B_0 = ${Bc}$ T より $B_0 = ${n(B0 * 1000, 4)}$ mT です。これを超えると、球は常伝導と超伝導の領域が混ざる中間状態に分かれます。`]],
        };
      }
      const lam = r.pick([50, 80, 100, 150]), d = r.pick([50, 100, 200, 300, 500]), f = 1 / Math.cosh(d / (2 * lam));
      return {
        q: [`A superconducting film $${d}$ nm thick, with $\\lambda = ${lam}$ nm, sits in a field $B_0$ parallel to its faces. Field enters from both faces, so $B(x) = B_0\\cosh(x/\\lambda)/\\cosh(d/2\\lambda)$ with $x$ measured from the middle. What is $B/B_0$ at the middle? Three significant figures.`, `厚さ $${d}$ nm、$\\lambda = ${lam}$ nm の超伝導の膜が、面に平行な磁場 $B_0$ の中にあります。磁場は両面から入るので、中央から測った $x$ で $B(x) = B_0\\cosh(x/\\lambda)/\\cosh(d/2\\lambda)$ です。中央での $B/B_0$ を有効数字三桁で答えてください。`],
        a: { type: 'num', v: f, rel: 0.005 },
        hint: ['At the middle $x = 0$ and $\\cosh 0 = 1$.', '中央では $x = 0$ で $\\cosh 0 = 1$ です。'],
        sol: [[`$d/2\\lambda = ${n(d / (2 * lam), 4)}$ and $\\cosh(${n(d / (2 * lam), 4)}) = ${n(Math.cosh(d / (2 * lam)), 5)}$.`, `$d/2\\lambda = ${n(d / (2 * lam), 4)}$、$\\cosh(${n(d / (2 * lam), 4)}) = ${n(Math.cosh(d / (2 * lam)), 5)}$ です。`], [`$B/B_0 = ${n(f, 4)}$. ${d < 2 * lam ? 'A film thinner than about $2\\lambda$ is barely screened at all.' : 'A film many $\\lambda$ thick screens its interior almost completely.'}`, `$B/B_0 = ${n(f, 4)}$ です。${d < 2 * lam ? '厚さがおよそ $2\\lambda$ より薄い膜はほとんど遮蔽しません。' : '厚さが $\\lambda$ の何倍もある膜は、内部をほぼ完全に遮蔽します。'}`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([1.2, 1.5, 2, 3, 5]), t = Math.pow(1 - 1 / (k * k), 0.25);
        return {
          q: [`At what reduced temperature $t = T/T_c$ has the penetration depth grown to $${k}\\lambda_0$, if $\\lambda = \\lambda_0/\\sqrt{1 - t^4}$? Three decimals.`, `$\\lambda = \\lambda_0/\\sqrt{1 - t^4}$ のとき、侵入長が $${k}\\lambda_0$ になるのは換算温度 $t = T/T_c$ がいくらのときですか。小数第三位まで答えてください。`],
          a: { type: 'num', v: t, tol: 0.0006 },
          hint: ['Invert: $1 - t^4 = (\\lambda_0/\\lambda)^2$.', '逆に解きます：$1 - t^4 = (\\lambda_0/\\lambda)^2$ です。'],
          sol: [[`$1 - t^4 = 1/${k}^2 = ${n(1 / (k * k), 5)}$, so $t^4 = ${n(1 - 1 / (k * k), 5)}$.`, `$1 - t^4 = 1/${k}^2 = ${n(1 / (k * k), 5)}$ なので $t^4 = ${n(1 - 1 / (k * k), 5)}$ です。`], [`$t = ${n(t, 4)}$. Even doubling $\\lambda$ needs $t$ above 0.9: the depth is nearly constant until close to Tc.`, `$t = ${n(t, 4)}$ です。$\\lambda$ を二倍にするだけでも $t$ は 0.9 を超える必要があります。侵入長は Tc の近くまでほぼ一定です。`]],
          set: { t: Math.round(t * 100) / 100 },
        };
      }
      if (form === 1) {
        const a = r.pick([0.2, 0.3, 0.5, 0.7]), f = mom(a), approx = a * a / 15;
        return {
          q: [`A sphere much smaller than the penetration depth, $R = ${a}\\lambda$, barely screens. Expanding the exact moment fraction for small $R/\\lambda$ gives $(R/\\lambda)^2/15$. Evaluate the exact fraction $1 - \\tfrac{3\\lambda}{R}\\coth\\tfrac R\\lambda + \\tfrac{3\\lambda^2}{R^2}$ to three significant figures.`, `侵入長よりずっと小さい球 $R = ${a}\\lambda$ は、ほとんど遮蔽しません。モーメントの比の厳密な式を小さい $R/\\lambda$ で展開すると $(R/\\lambda)^2/15$ になります。厳密な比 $1 - \\tfrac{3\\lambda}{R}\\coth\\tfrac R\\lambda + \\tfrac{3\\lambda^2}{R^2}$ を有効数字三桁で求めてください。`],
          a: { type: 'num', v: f, rel: 0.005 },
          hint: ['The terms nearly cancel; use $\\coth x = 1/x + x/3 - x^3/45 + \\dots$, or compute carefully.', '項がほとんど打ち消し合います。$\\coth x = 1/x + x/3 - x^3/45 + \\dots$ を使うか、注意深く計算します。'],
          sol: [[`With $x = ${a}$: $\\tfrac3x\\coth x = 3/x^2 + 1 - x^2/15 + 2x^4/315 - \\dots$`, `$x = ${a}$ で $\\tfrac3x\\coth x = 3/x^2 + 1 - x^2/15 + 2x^4/315 - \\dots$ です。`], [`So the fraction is $x^2/15 - 2x^4/315 + \\dots = ${n(f, 4)}$, against the leading term $${n(approx, 4)}$. The moment grows as $R^5$, not $R^3$: the interior is almost fully penetrated.`, `したがって比は $x^2/15 - 2x^4/315 + \\dots = ${n(f, 4)}$ で、主要項は $${n(approx, 4)}$ です。モーメントは $R^3$ ではなく $R^5$ で増えます。内部にはほぼ完全に磁場が入っています。`]],
        };
      }
      const target = r.pick([0.5, 0.7, 0.8, 0.9, 0.95]);
      let lo = 0.1, hi = 500; for (let i = 0; i < 100; i++) { const mid = Math.sqrt(lo * hi); if (mom(mid) < target) lo = mid; else hi = mid; }
      const a = Math.sqrt(lo * hi);
      return {
        q: [`How large must a London sphere be, as $R/\\lambda$, to reach $${target}$ of a perfect diamagnet's moment? Three significant figures.`, `ロンドン球が完全反磁性体のモーメントの $${target}$ 倍に達するには、$R/\\lambda$ がいくらでなければなりませんか。有効数字三桁で答えてください。`],
        a: { type: 'num', v: a, rel: 0.005 },
        hint: ['For large spheres the fraction is about $1 - 3\\lambda/R$; solve that, then refine.', '大きな球では比はおよそ $1 - 3\\lambda/R$ です。それを解いてから詰めます。'],
        sol: [[`First estimate: $1 - 3/x = ${target}$ gives $x \\approx ${n(3 / (1 - target), 4)}$.`, `最初の見積もり：$1 - 3/x = ${target}$ より $x \\approx ${n(3 / (1 - target), 4)}$ です。`], [`Including the $3/x^2$ term and $\\coth$, the exact root is $R/\\lambda = ${n(a, 4)}$. Each further 1% of screening needs a sphere about a hundred depths larger in radius.`, `$3/x^2$ の項と $\\coth$ を含めると、厳密な根は $R/\\lambda = ${n(a, 4)}$ です。遮蔽をさらに 1% 上げるごとに、半径が侵入長の約 100 倍ずつ大きな球が必要です。`]],
        ...(a >= 2 && a <= 60 ? { set: { t: 0, a0: Math.round(a * 2) / 2 } } : {}),
      };
    },
  ];

  /* ---------------- gl-transition ---------------- */
  Q['gl-transition'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick([0.2, 0.4, 0.5, 0.6, 0.75, 0.9, 1.1, 1.3]), p2 = Math.max(0, 1 - t);
        return {
          q: [`In units with $a_0T_c = b = 1$, the free energy is $f = (t - 1)|\\psi|^2 + |\\psi|^4/2$. At $t = ${t}$, what is $|\\psi|^2$ at the minimum?`, `$a_0T_c = b = 1$ の単位で自由エネルギーは $f = (t - 1)|\\psi|^2 + |\\psi|^4/2$ です。$t = ${t}$ で、最小での $|\\psi|^2$ はいくらですか。`],
          a: { type: 'num', v: p2, tol: 1e-6 },
          hint: ['Set $df/d(|\\psi|^2) = 0$, or note there is no nonzero minimum when the quadratic coefficient is positive.', '$df/d(|\\psi|^2) = 0$ とおきます。二次の係数が正なら 0 でない最小はありません。'],
          sol: [[`With $m = |\\psi|^2$: $f = (t-1)m + m^2/2$, and $df/dm = t - 1 + m$.`, `$m = |\\psi|^2$ とすると $f = (t-1)m + m^2/2$、$df/dm = t - 1 + m$ です。`], [t < 1 ? `$m = 1 - t = ${n(p2, 3)}$: superconducting.` : `For $t > 1$ the root would be negative, so the minimum is at $m = 0$: normal metal.`, t < 1 ? `$m = 1 - t = ${n(p2, 3)}$ で、超伝導です。` : `$t > 1$ では根が負になるので、最小は $m = 0$ で、常伝導金属です。`]],
          set: { t },
        };
      }
      if (form === 1) {
        const below = r.chance(0.5);
        return {
          q: [`In $f = a|\\psi|^2 + \\tfrac b2|\\psi|^4$ with $b > 0$, what must be true of $a$ for the superconducting state to be stable ${below ? 'below' : 'above'} $T_c$?`, `$b > 0$ の $f = a|\\psi|^2 + \\tfrac b2|\\psi|^4$ で、$T_c$ より${below ? '下' : '上'}で${below ? '超伝導状態が安定' : '常伝導状態が安定'}であるためには、$a$ について何が成り立たなければなりませんか。`],
          a: { type: 'choice', fixed: true, v: below ? 0 : 1, opts: [['a < 0', 'a < 0'], ['a > 0', 'a > 0'], ['a = 0', 'a = 0'], ['a can have either sign', 'a はどちらの符号でもよい']] },
          hint: ['A minimum away from $\\psi = 0$ needs the $|\\psi|^2$ term to pull down.', '$\\psi = 0$ から離れた最小には、$|\\psi|^2$ の項が下へ引くことが必要です。'],
          sol: [['If $a > 0$ both terms are positive and the only minimum is $\\psi = 0$.', '$a > 0$ なら両方の項が正で、最小は $\\psi = 0$ だけです。'], [below ? 'Below Tc, $a < 0$ makes $\\psi = 0$ a hilltop and the minimum moves to $|\\psi|^2 = -a/b$.' : 'Above Tc the normal state ($\\psi = 0$) must be the minimum, so $a > 0$.', below ? 'Tc より下では $a < 0$ で、$\\psi = 0$ は丘の頂上になり、最小は $|\\psi|^2 = -a/b$ に移ります。' : 'Tc より上では常伝導状態（$\\psi = 0$）が最小でなければならないので $a > 0$ です。']],
        };
      }
      return {
        q: ['In zero field, the Ginzburg–Landau free energy is continuous at Tc together with its first temperature derivative, but its second derivative jumps. What kind of transition is this?', '磁場がないとき、ギンツブルグ・ランダウ自由エネルギーは Tc でそれ自身も温度の一階微分も連続ですが、二階微分は跳びます。これはどんな転移ですか。'],
        a: { type: 'choice', fixed: true, v: 1, opts: [['First order, with a latent heat', '潜熱をもつ一次転移'], ['Second order: no latent heat, a jump in the specific heat', '二次転移：潜熱はなく、比熱が跳ぶ'], ['No transition: the change is smooth', '転移ではない：変化はなめらか'], ['Infinite order, like the Kosterlitz–Thouless transition', 'コスタリッツ・サウレス転移のような無限次の転移']] },
        hint: ['Entropy is the first derivative of the free energy; the specific heat comes from the second.', 'エントロピーは自由エネルギーの一階微分、比熱は二階微分から得られます。'],
        sol: [['A continuous first derivative means the entropy does not jump, so there is no latent heat.', '一階微分が連続ということはエントロピーが跳ばないということで、潜熱はありません。'], ['The jump in the second derivative is a jump in $C = -T\\,\\partial^2F/\\partial T^2$: a second-order transition in Ehrenfest\'s scheme.', '二階微分の跳びは $C = -T\\,\\partial^2F/\\partial T^2$ の跳びで、エーレンフェストの分類では二次転移です。']],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const t = r.pick([0.3, 0.5, 0.6, 0.7, 0.8, 0.9]), f = -((1 - t) ** 2) / 2;
        return {
          q: [`With $f = (t - 1)|\\psi|^2 + |\\psi|^4/2$, what is the free energy at the minimum (the condensation energy) for $t = ${t}$?`, `$f = (t - 1)|\\psi|^2 + |\\psi|^4/2$ で、$t = ${t}$ のときの最小での自由エネルギー（凝縮エネルギー）はいくらですか。`],
          a: { type: 'num', v: f, tol: 1e-6 },
          hint: ['Substitute $|\\psi|^2 = 1 - t$ back in.', '$|\\psi|^2 = 1 - t$ を代入し直します。'],
          sol: [[`$|\\psi|^2 = ${n(1 - t, 3)}$, so $f = (${n(t - 1, 3)})(${n(1 - t, 3)}) + ${n(1 - t, 3)}^2/2$.`, `$|\\psi|^2 = ${n(1 - t, 3)}$ なので $f = (${n(t - 1, 3)})(${n(1 - t, 3)}) + ${n(1 - t, 3)}^2/2$ です。`], [`$f = -(1 - t)^2/2 = ${n(f, 5)}$; it equals $-B_c^2/2\\mu_0$, so $B_c \\propto 1 - t$ near Tc.`, `$f = -(1 - t)^2/2 = ${n(f, 5)}$ で、これは $-B_c^2/2\\mu_0$ に等しいので、Tc の近くでは $B_c \\propto 1 - t$ です。`]],
          set: { t },
        };
      }
      if (form === 1) {
        const t1 = r.pick([0.2, 0.4, 0.5, 0.6]), t2 = r.pick([0.8, 0.85, 0.9, 0.95]), ratio = (1 - t1) / (1 - t2);
        return {
          q: [`Near Tc, $|\\psi|^2 \\propto 1 - t$. How many times larger is the superfluid density at $t = ${t1}$ than at $t = ${t2}$?`, `Tc の近くでは $|\\psi|^2 \\propto 1 - t$ です。$t = ${t1}$ での超流動密度は、$t = ${t2}$ での何倍ですか。`],
          a: { type: 'num', v: ratio, rel: 0.005 },
          hint: ['Take the ratio of $1 - t$.', '$1 - t$ の比をとります。'],
          sol: [[`$(1 - ${t1})/(1 - ${t2}) = ${n(1 - t1, 3)}/${n(1 - t2, 3)}$.`, `$(1 - ${t1})/(1 - ${t2}) = ${n(1 - t1, 3)}/${n(1 - t2, 3)}$ です。`], [`$= ${n(ratio, 4)}$. Since $\\lambda^{-2} \\propto |\\psi|^2$, the penetration depth is $\\sqrt{${n(ratio, 3)}} = ${n(Math.sqrt(ratio), 3)}$ times shorter at the lower temperature.`, `$= ${n(ratio, 4)}$ です。$\\lambda^{-2} \\propto |\\psi|^2$ なので、低い温度では侵入長が $\\sqrt{${n(ratio, 3)}} = ${n(Math.sqrt(ratio), 3)}$ 分の一になります。`]],
        };
      }
      const t = r.pick([0.5, 0.75, 0.84, 0.91, 0.96, 0.99]), x = 1 / Math.sqrt(1 - t);
      return {
        q: [`The Ginzburg–Landau coherence length is $\\xi(T) = \\xi_0/\\sqrt{1 - t}$. What is $\\xi/\\xi_0$ at $t = ${t}$? Three significant figures.`, `ギンツブルグ・ランダウのコヒーレンス長は $\\xi(T) = \\xi_0/\\sqrt{1 - t}$ です。$t = ${t}$ での $\\xi/\\xi_0$ を有効数字三桁で答えてください。`],
        a: { type: 'num', v: x, rel: 0.005 },
        hint: ['It is the length over which $\\psi$ can recover from zero.', 'これは $\\psi$ がゼロから回復できる長さです。'],
        sol: [[`$1 - t = ${n(1 - t, 3)}$.`, `$1 - t = ${n(1 - t, 3)}$ です。`], [`$\\xi/\\xi_0 = 1/\\sqrt{${n(1 - t, 3)}} = ${n(x, 4)}$. Both $\\xi$ and $\\lambda$ diverge as $(1 - t)^{-1/2}$, so their ratio $\\kappa$ stays constant near Tc.`, `$\\xi/\\xi_0 = 1/\\sqrt{${n(1 - t, 3)}} = ${n(x, 4)}$ です。$\\xi$ も $\\lambda$ も $(1 - t)^{-1/2}$ で発散するので、その比 $\\kappa$ は Tc の近くで一定です。`]],
        set: { t },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a0 = r.pick([2, 3, 4, 5]), b = r.pick([1, 2, 4]), Tc = r.pick([4, 7, 9, 12]);
        return {
          q: [`Take $a = ${a0}(T - ${Tc})$ and $b = ${b}$ in $f = a|\\psi|^2 + \\tfrac b2|\\psi|^4$ (arbitrary units). Write $|\\psi|^2$ at the minimum as a function of $T$, for $T < ${Tc}$.`, `$f = a|\\psi|^2 + \\tfrac b2|\\psi|^4$ で $a = ${a0}(T - ${Tc})$、$b = ${b}$ とします（任意の単位）。$T < ${Tc}$ について、最小での $|\\psi|^2$ を $T$ の関数として書いてください。`],
          a: { type: 'expr', v: `${a0}*(${Tc}-T)/${b}`, vars: ['T'], dom: { T: [0.5, Tc - 0.5] }, lhs: ['$|\\psi|^2 =$', '$|\\psi|^2 =$'] },
          hint: ['Minimise over $m = |\\psi|^2$: $a + bm = 0$.', '$m = |\\psi|^2$ で最小化すると $a + bm = 0$ です。'],
          sol: [[`$m = -a/b = -${a0}(T - ${Tc})/${b}$.`, `$m = -a/b = -${a0}(T - ${Tc})/${b}$ です。`], [`$|\\psi|^2 = ${n(a0 / b, 3)}(${Tc} - T)$, linear in $T_c - T$: the order parameter itself grows as $(T_c - T)^{1/2}$, the mean-field exponent $\\beta = 1/2$.`, `$|\\psi|^2 = ${n(a0 / b, 3)}(${Tc} - T)$ で、$T_c - T$ について一次です。秩序パラメータそのものは $(T_c - T)^{1/2}$ で増え、これは平均場の指数 $\\beta = 1/2$ です。`]],
        };
      }
      if (form === 1) {
        const Bc1 = r.pick([10, 20, 30, 50, 80]), t1 = r.pick([0.8, 0.85, 0.9]), t2 = r.pick([0.92, 0.95, 0.97]), B2 = Bc1 * (1 - t2) / (1 - t1);
        return {
          q: [`Near Tc the condensation energy $B_c^2/2\\mu_0$ falls as $(1 - t)^2$. A sample has $B_c = ${Bc1}$ mT at $t = ${t1}$. Estimate $B_c$ at $t = ${t2}$, in mT.`, `Tc の近くでは凝縮エネルギー $B_c^2/2\\mu_0$ は $(1 - t)^2$ で下がります。ある試料は $t = ${t1}$ で $B_c = ${Bc1}$ mT です。$t = ${t2}$ での $B_c$ を mT で見積もってください。`],
          a: { type: 'num', v: B2, rel: 0.005, unit: ['mT', 'mT'] },
          hint: ['$B_c^2 \\propto (1 - t)^2$ means $B_c \\propto 1 - t$.', '$B_c^2 \\propto (1 - t)^2$ は $B_c \\propto 1 - t$ を意味します。'],
          sol: [[`$B_c(t_2)/B_c(t_1) = (1 - ${t2})/(1 - ${t1}) = ${n((1 - t2) / (1 - t1), 4)}$.`, `$B_c(t_2)/B_c(t_1) = (1 - ${t2})/(1 - ${t1}) = ${n((1 - t2) / (1 - t1), 4)}$ です。`], [`$B_c = ${n(B2, 4)}$ mT. Far from Tc the empirical law $1 - t^2$ does better than this linear form.`, `$B_c = ${n(B2, 4)}$ mT です。Tc から遠いところでは、この一次の形より経験則 $1 - t^2$ の方がよく合います。`]],
        };
      }
      const a0 = r.pick([1, 2, 3, 4]) * 1e3, b = r.pick([1, 2, 5]) * 1e3, Tc = r.pick([1.2, 4.2, 7.2, 9.2]), dC = a0 * a0 * Tc / b;
      return {
        q: [`A superconductor has GL coefficients $a = a_0(T - T_c)$ with $a_0 = ${a0}$ J m⁻³ K⁻¹, $b = ${b}$ J m⁻³, and $T_c = ${Tc}$ K. What is the jump in specific heat per unit volume at Tc, in J m⁻³ K⁻¹?`, `ある超伝導体の GL 係数は $a = a_0(T - T_c)$ で $a_0 = ${a0}$ J m⁻³ K⁻¹、$b = ${b}$ J m⁻³、$T_c = ${Tc}$ K です。Tc での単位体積あたりの比熱の跳びを J m⁻³ K⁻¹ で求めてください。`],
        a: { type: 'num', v: dC, rel: 0.005, unit: ['J m⁻³ K⁻¹', 'J m⁻³ K⁻¹'] },
        hint: ['$F_s - F_n = -a_0^2(T - T_c)^2/2b$; differentiate twice and multiply by $-T$.', '$F_s - F_n = -a_0^2(T - T_c)^2/2b$ を二回微分して $-T$ をかけます。'],
        sol: [[`$\\partial^2(F_s - F_n)/\\partial T^2 = -a_0^2/b$, so $C_s - C_n = T a_0^2/b$ just below Tc.`, `$\\partial^2(F_s - F_n)/\\partial T^2 = -a_0^2/b$ なので、Tc のすぐ下で $C_s - C_n = T a_0^2/b$ です。`], [`At $T_c$: $\\Delta C = ${a0}^2 \\times ${Tc}/${b} = ${n(dC, 4)}$ J m⁻³ K⁻¹.`, `$T_c$ では $\\Delta C = ${a0}^2 \\times ${Tc}/${b} = ${n(dC, 4)}$ J m⁻³ K⁻¹ です。`]],
      };
    },
  ];

  /* ---------------- vortex-lattice ---------------- */
  Q['vortex-lattice'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const B = r.pick([0.05, 0.1, 0.5, 1, 2, 5]), side = r.pick([1, 2, 5, 10]), N = B * (side * 1e-6) ** 2 / PHI0;
        return {
          q: [`A type II superconductor sits in a mean field of $${B}$ T. How many vortices thread a $${side}\\ \\mu$m $\\times$ $${side}\\ \\mu$m square? Three significant figures.`, `第二種超伝導体が平均磁場 $${B}$ T の中にあります。$${side}\\ \\mu$m $\\times$ $${side}\\ \\mu$m の正方形を何本の渦糸が貫きますか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: N, rel: 0.005 },
          hint: ['Each vortex carries $\\Phi_0 = 2.068\\times10^{-15}$ Wb.', '各渦糸は $\\Phi_0 = 2.068\\times10^{-15}$ Wb を運びます。'],
          sol: [[`Flux through the square: $${B} \\times (${side}\\times10^{-6})^2 = ${n(B * (side * 1e-6) ** 2, 4)}$ Wb.`, `正方形を通る磁束は $${B} \\times (${side}\\times10^{-6})^2 = ${n(B * (side * 1e-6) ** 2, 4)}$ Wb です。`], [`$N = \\Phi/\\Phi_0 = ${n(N, 4)}$ vortices.`, `$N = \\Phi/\\Phi_0 = ${n(N, 4)}$ 本です。`]],
        };
      }
      if (form === 1) {
        const mats = [['aluminium', 'アルミニウム', 16, 1600], ['lead', '鉛', 37, 83], ['niobium', 'ニオブ', 39, 38], ['NbTi', 'NbTi', 300, 5], ['Nb₃Sn', 'Nb₃Sn', 80, 3.5], ['YBCO', 'YBCO', 150, 1.5]];
        const [en, ja, lam, xi] = r.pick(mats), k = lam / xi, type2 = k > 1 / Math.SQRT2;
        return {
          q: [`${en} has $\\lambda \\approx ${lam}$ nm and $\\xi \\approx ${xi}$ nm. Is it type I or type II?`, `${ja} は $\\lambda \\approx ${lam}$ nm、$\\xi \\approx ${xi}$ nm です。第一種と第二種のどちらですか。`],
          a: { type: 'choice', fixed: true, v: type2 ? 1 : 0, opts: [['Type I: κ < 1/√2', '第一種：κ < 1/√2'], ['Type II: κ > 1/√2', '第二種：κ > 1/√2']] },
          hint: ['Compare $\\kappa = \\lambda/\\xi$ with $1/\\sqrt2 \\approx 0.707$.', '$\\kappa = \\lambda/\\xi$ を $1/\\sqrt2 \\approx 0.707$ と比べます。'],
          sol: [[`$\\kappa = ${lam}/${xi} = ${n(k, 3)}$.`, `$\\kappa = ${lam}/${xi} = ${n(k, 3)}$ です。`], [type2 ? 'Above 0.707: the wall between normal and superconducting regions has negative energy, so the field enters as vortices.' : 'Below 0.707: the interface energy is positive, so the field is expelled until it destroys superconductivity all at once.', type2 ? '0.707 より大きいので、常伝導と超伝導の境界の壁のエネルギーが負になり、磁場は渦糸として入ります。' : '0.707 より小さいので境界のエネルギーが正で、磁場は超伝導を一度に壊すまで排除されます。']],
        };
      }
      const xi = r.pick([2, 3, 5, 8, 10, 20, 40]), Hc2 = PHI0 / (2 * PI * (xi * 1e-9) ** 2);
      return {
        q: [`A superconductor has coherence length $\\xi = ${xi}$ nm. What is its upper critical field $H_{c2} = \\Phi_0/(2\\pi\\xi^2)$, in tesla? Three significant figures.`, `コヒーレンス長が $\\xi = ${xi}$ nm の超伝導体があります。上部臨界磁場 $H_{c2} = \\Phi_0/(2\\pi\\xi^2)$ をテスラで求めてください。有効数字三桁で答えてください。`],
        a: { type: 'num', v: Hc2, rel: 0.005, unit: ['T', 'T'] },
        hint: ['At $H_{c2}$ one flux quantum fits in an area of about $2\\pi\\xi^2$, so the cores touch.', '$H_{c2}$ では、一つの磁束量子がおよそ $2\\pi\\xi^2$ の面積に入り、芯が接します。'],
        sol: [[`$2\\pi\\xi^2 = 2\\pi(${xi}\\times10^{-9})^2 = ${n(2 * PI * (xi * 1e-9) ** 2, 4)}$ m².`, `$2\\pi\\xi^2 = 2\\pi(${xi}\\times10^{-9})^2 = ${n(2 * PI * (xi * 1e-9) ** 2, 4)}$ m² です。`], [`$H_{c2} = 2.068\\times10^{-15}/${n(2 * PI * (xi * 1e-9) ** 2, 4)} = ${n(Hc2, 4)}$ T. Short coherence lengths are why cuprates and Nb₃Sn survive enormous fields.`, `$H_{c2} = 2.068\\times10^{-15}/${n(2 * PI * (xi * 1e-9) ** 2, 4)} = ${n(Hc2, 4)}$ T です。銅酸化物や Nb₃Sn が巨大な磁場に耐えるのは、コヒーレンス長が短いからです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const B = r.pick([0.01, 0.05, 0.1, 0.5, 1, 5]), a = Math.sqrt(2 * PHI0 / (Math.sqrt(3) * B)) * 1e9;
        return {
          q: [`In a triangular vortex lattice at mean field $${B}$ T, what is the spacing between neighbouring vortices, in nm? Three significant figures.`, `平均磁場 $${B}$ T の三角渦糸格子で、隣りあう渦糸の間隔を nm で求めてください。有効数字三桁で答えてください。`],
          a: { type: 'num', v: a, rel: 0.005, unit: ['nm', 'nm'] },
          hint: ['One flux quantum per unit cell of area $\\tfrac{\\sqrt3}{2}a^2$.', '面積 $\\tfrac{\\sqrt3}{2}a^2$ の単位胞ごとに磁束量子が一つです。'],
          sol: [[`$\\tfrac{\\sqrt3}{2}a^2 B = \\Phi_0$, so $a = \\sqrt{2\\Phi_0/(\\sqrt3 B)}$.`, `$\\tfrac{\\sqrt3}{2}a^2 B = \\Phi_0$ より $a = \\sqrt{2\\Phi_0/(\\sqrt3 B)}$ です。`], [`$a = \\sqrt{2\\times2.068\\times10^{-15}/(1.732\\times${B})} = ${n(a, 4)}$ nm. The spacing shrinks as $B^{-1/2}$.`, `$a = \\sqrt{2\\times2.068\\times10^{-15}/(1.732\\times${B})} = ${n(a, 4)}$ nm です。間隔は $B^{-1/2}$ で縮みます。`]],
        };
      }
      if (form === 1) {
        const a = r.pick([50, 100, 200, 300, 500, 1000]), B = 2 * PHI0 / (Math.sqrt(3) * (a * 1e-9) ** 2);
        return {
          q: [`A decoration image shows a triangular vortex lattice with spacing $${a}$ nm. What is the mean field in the sample, in mT? Three significant figures.`, `デコレーション像に、間隔 $${a}$ nm の三角渦糸格子が写っています。試料の平均磁場を mT で求めてください。有効数字三桁で答えてください。`],
          a: { type: 'num', v: B * 1000, rel: 0.005, unit: ['mT', 'mT'] },
          hint: ['Count one flux quantum per cell of area $\\tfrac{\\sqrt3}{2}a^2$.', '面積 $\\tfrac{\\sqrt3}{2}a^2$ の単位胞ごとに磁束量子を一つ数えます。'],
          sol: [[`Cell area $\\tfrac{\\sqrt3}{2}(${a}\\times10^{-9})^2 = ${n(Math.sqrt(3) / 2 * (a * 1e-9) ** 2, 4)}$ m².`, `単位胞の面積は $\\tfrac{\\sqrt3}{2}(${a}\\times10^{-9})^2 = ${n(Math.sqrt(3) / 2 * (a * 1e-9) ** 2, 4)}$ m² です。`], [`$\\bar B = \\Phi_0/\\text{area} = ${n(B * 1000, 4)}$ mT.`, `$\\bar B = \\Phi_0/\\text{面積} = ${n(B * 1000, 4)}$ mT です。`]],
        };
      }
      const H = r.pick([5, 10, 15, 25, 40, 100]), xi = Math.sqrt(PHI0 / (2 * PI * H)) * 1e9;
      return {
        q: [`A superconductor has $H_{c2} = ${H}$ T. What is its coherence length, in nm? Three significant figures.`, `$H_{c2} = ${H}$ T の超伝導体のコヒーレンス長を nm で求めてください。有効数字三桁で答えてください。`],
        a: { type: 'num', v: xi, rel: 0.005, unit: ['nm', 'nm'] },
        hint: ['Invert $H_{c2} = \\Phi_0/(2\\pi\\xi^2)$.', '$H_{c2} = \\Phi_0/(2\\pi\\xi^2)$ を逆に解きます。'],
        sol: [[`$\\xi = \\sqrt{\\Phi_0/(2\\pi H_{c2})} = \\sqrt{2.068\\times10^{-15}/(2\\pi\\times${H})}$.`, `$\\xi = \\sqrt{\\Phi_0/(2\\pi H_{c2})} = \\sqrt{2.068\\times10^{-15}/(2\\pi\\times${H})}$ です。`], [`$\\xi = ${n(xi, 4)}$ nm: a measured critical field gives a length scale directly.`, `$\\xi = ${n(xi, 4)}$ nm です。臨界磁場を測ると、長さの尺度が直接得られます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const lam = r.pick([100, 150, 200, 300]), k = r.pick([20, 40, 60, 80, 100]), Hc1 = PHI0 * Math.log(k) / (4 * PI * (lam * 1e-9) ** 2);
        return {
          q: [`Estimate the lower critical field $H_{c1} \\approx \\Phi_0\\ln\\kappa/(4\\pi\\lambda^2)$ for $\\lambda = ${lam}$ nm and $\\kappa = ${k}$, in mT. Three significant figures.`, `$\\lambda = ${lam}$ nm、$\\kappa = ${k}$ のとき、下部臨界磁場 $H_{c1} \\approx \\Phi_0\\ln\\kappa/(4\\pi\\lambda^2)$ を mT で見積もってください。有効数字三桁で答えてください。`],
          a: { type: 'num', v: Hc1 * 1000, rel: 0.005, unit: ['mT', 'mT'] },
          hint: ['The vortex line energy is about $(\\Phi_0^2/4\\pi\\mu_0\\lambda^2)\\ln\\kappa$; Hc1 is where it pays for itself.', '渦糸の線エネルギーはおよそ $(\\Phi_0^2/4\\pi\\mu_0\\lambda^2)\\ln\\kappa$ で、Hc1 はそれが元を取る磁場です。'],
          sol: [[`$\\ln ${k} = ${n(Math.log(k), 4)}$ and $4\\pi\\lambda^2 = ${n(4 * PI * (lam * 1e-9) ** 2, 4)}$ m².`, `$\\ln ${k} = ${n(Math.log(k), 4)}$、$4\\pi\\lambda^2 = ${n(4 * PI * (lam * 1e-9) ** 2, 4)}$ m² です。`], [`$H_{c1} \\approx ${n(Hc1 * 1000, 4)}$ mT, far below $H_{c2}$: a type II material is in the vortex state over almost all of its useful range.`, `$H_{c1} \\approx ${n(Hc1 * 1000, 4)}$ mT で、$H_{c2}$ よりはるかに小さい値です。第二種の物質は、有用な範囲のほとんどで渦糸状態にあります。`]],
          set: { kappa: k, lam },
        };
      }
      if (form === 1) {
        const k = r.pick([5, 10, 20, 50, 100]), ratio = 2 * k * k / Math.log(k);
        return {
          q: [`Using $H_{c2} = \\Phi_0/2\\pi\\xi^2$ and $H_{c1} \\approx \\Phi_0\\ln\\kappa/4\\pi\\lambda^2$, what is $H_{c2}/H_{c1}$ for $\\kappa = ${k}$? Three significant figures.`, `$H_{c2} = \\Phi_0/2\\pi\\xi^2$ と $H_{c1} \\approx \\Phi_0\\ln\\kappa/4\\pi\\lambda^2$ を使うと、$\\kappa = ${k}$ のとき $H_{c2}/H_{c1}$ はいくらですか。有効数字三桁で答えてください。`],
          a: { type: 'num', v: ratio, rel: 0.005 },
          hint: ['Write $\\xi = \\lambda/\\kappa$ and divide.', '$\\xi = \\lambda/\\kappa$ と書いて割ります。'],
          sol: [[`$H_{c2}/H_{c1} = \\dfrac{\\Phi_0\\kappa^2/2\\pi\\lambda^2}{\\Phi_0\\ln\\kappa/4\\pi\\lambda^2} = \\dfrac{2\\kappa^2}{\\ln\\kappa}$.`, `$H_{c2}/H_{c1} = \\dfrac{\\Phi_0\\kappa^2/2\\pi\\lambda^2}{\\Phi_0\\ln\\kappa/4\\pi\\lambda^2} = \\dfrac{2\\kappa^2}{\\ln\\kappa}$ です。`], [`$= 2 \\times ${k}^2/${n(Math.log(k), 4)} = ${n(ratio, 4)}$: the vortex state spans a range of fields ${n(ratio, 3)} times wide.`, `$= 2 \\times ${k}^2/${n(Math.log(k), 4)} = ${n(ratio, 4)}$ で、渦糸状態は ${n(ratio, 3)} 倍の幅の磁場の範囲にわたります。`]],
          set: { kappa: k },
        };
      }
      const lam = r.pick([100, 150, 200, 300, 400]), B = 2 * PHI0 / (Math.sqrt(3) * (lam * 1e-9) ** 2);
      return {
        q: [`At what mean field does the vortex spacing in a triangular lattice equal the penetration depth $\\lambda = ${lam}$ nm, so that neighbouring vortex fields overlap strongly? In mT, three significant figures.`, `三角格子の渦糸の間隔が侵入長 $\\lambda = ${lam}$ nm に等しくなり、隣りあう渦糸の磁場が強く重なりはじめるのは、平均磁場がいくらのときですか。mT で、有効数字三桁で答えてください。`],
        a: { type: 'num', v: B * 1000, rel: 0.005, unit: ['mT', 'mT'] },
        hint: ['Set $a = \\lambda$ in $\\bar B = 2\\Phi_0/(\\sqrt3 a^2)$.', '$\\bar B = 2\\Phi_0/(\\sqrt3 a^2)$ で $a = \\lambda$ とします。'],
        sol: [[`$\\bar B = 2\\Phi_0/(\\sqrt3\\lambda^2) = 2\\times2.068\\times10^{-15}/(1.732\\times(${lam}\\times10^{-9})^2)$.`, `$\\bar B = 2\\Phi_0/(\\sqrt3\\lambda^2) = 2\\times2.068\\times10^{-15}/(1.732\\times(${lam}\\times10^{-9})^2)$ です。`], [`$\\bar B = ${n(B * 1000, 4)}$ mT. Above this the field between vortices barely dips: the modulation shrinks as the vortices crowd.`, `$\\bar B = ${n(B * 1000, 4)}$ mT です。これより上では渦糸の間の磁場はほとんど下がらず、渦糸が密集するにつれて変調は小さくなります。`]],
        set: { lam },
      };
    },
  ];
})();
