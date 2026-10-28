'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI, D = PI / 180, SQ2 = Math.SQRT2;
  const cosd = (x) => Math.cos(x * D), sind = (x) => Math.sin(x * D);
  const mod360 = (x) => ((x % 360) + 360) % 360;
  const H2 = (p) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const ket2 = (v) => {
    const lab = ['00', '01', '10', '11'];
    let s = '';
    v.forEach((c, i) => { if (!c) return; const m = Math.abs(c); s += (s ? (c < 0 ? ' - ' : ' + ') : (c < 0 ? '-' : '')) + (m === 1 ? '' : m) + `|${lab[i]}\\rangle`; });
    return s;
  };

  /* ---------- 1. CHSH ---------- */
  const NICE = [0, 30, 45, 60, 90, 120, 135, 150, 180, 225, 270, 300, 315];
  Q.chsh = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const a = r.pick(NICE), b = r.pick(NICE.filter((x) => x !== a));
        return {
          q: [`Alice measures at $a = ${a}^\\circ$ and Bob at $b = ${b}^\\circ$ on the pair $\\Phi^+$. What is the correlation $E(a, b)$ of their $\\pm1$ outcomes?`, `ペア $\\Phi^+$ に対して、アリスは $a = ${a}^\\circ$、ボブは $b = ${b}^\\circ$ で測定します。二人の $\\pm1$ の結果の相関 $E(a, b)$ はいくつですか。`],
          a: { type: 'num', v: cosd(a - b), tol: 0.003 },
          hint: ['For $\\Phi^+$ with directions in the x-z plane, $E(a, b) = \\cos(a - b)$.', 'x-z 平面内の方向で測る $\\Phi^+$ では $E(a, b) = \\cos(a - b)$ です。'],
          sol: [[`$E = \\cos(${a}^\\circ - ${b}^\\circ) = \\cos(${a - b}^\\circ) = ${n(cosd(a - b), 4)}$.`, `$E = \\cos(${a}^\\circ - ${b}^\\circ) = \\cos(${a - b}^\\circ) = ${n(cosd(a - b), 4)}$ です。`], [Math.abs(cosd(a - b)) < 1e-9 ? 'Zero: the outcomes are uncorrelated, agreeing exactly half the time.' : `The outcomes agree with probability $(1 + E)/2 = ${n((1 + cosd(a - b)) / 2, 4)}$.`, Math.abs(cosd(a - b)) < 1e-9 ? '0 なので結果は無相関で、ちょうど半分の確率で一致します。' : `結果が一致する確率は $(1 + E)/2 = ${n((1 + cosd(a - b)) / 2, 4)}$ です。`]],
          set: { a, b },
        };
      }
      if (form === 1) {
        const ask = r.int(0, 2);
        const opts = [['$2$', '$2$'], ['$2\\sqrt2$', '$2\\sqrt2$'], ['$4$', '$4$'], ['$\\sqrt2$', '$\\sqrt2$']];
        const qs = [['What is the largest $|S|$ that any local hidden-variable theory can produce?', '局所的な隠れた変数の理論が出せる $|S|$ の最大値はいくつですか。'], ['What is the largest $|S|$ that quantum mechanics allows (Tsirelson\'s bound)?', '量子力学が許す $|S|$ の最大値（ツィレルソン限界）はいくつですか。'], ['$S$ is a sum of four correlations, each between $-1$ and $1$. Ignoring physics, what is its largest conceivable value?', '$S$ は $-1$ から $1$ の相関四つの和です。物理を無視すると、考えられる最大値はいくつですか。']];
        const sols = [[['Each outcome is fixed in advance, so $A(B - B\') + A\'(B + B\')$ is $\\pm 2$ in every run.', '各結果は前もって決まっているので、$A(B - B\') + A\'(B + B\')$ はどの回でも $\\pm 2$ です。'], ['Averaging cannot exceed the largest single value, so $|S| \\le 2$.', '平均は個々の値の最大を超えられないので $|S| \\le 2$ です。']], [['$S$ is the expectation of the operator $A\\otimes(B - B\') + A\'\\otimes(B + B\')$, whose square is at most $8$.', '$S$ は演算子 $A\\otimes(B - B\') + A\'\\otimes(B + B\')$ の期待値で、その二乗は高々 $8$ です。'], ['So $|S| \\le 2\\sqrt2 \\approx 2.83$, reached by $\\Phi^+$ with the settings $0^\\circ, 90^\\circ, 45^\\circ, 135^\\circ$.', 'よって $|S| \\le 2\\sqrt2 \\approx 2.83$ で、$\\Phi^+$ と設定 $0^\\circ, 90^\\circ, 45^\\circ, 135^\\circ$ で到達します。']], [['Four terms each of size at most 1 give at most $4$.', '大きさ 1 以下の項が四つなので高々 $4$ です。'], ['No physical theory obeying no-signalling and quantum rules reaches it; quantum mechanics stops at $2\\sqrt2$.', '量子力学は $2\\sqrt2$ で止まり、$4$ には届きません。']]];
        return {
          q: qs[ask],
          a: { type: 'choice', opts, v: ask },
          hint: [['Think of each run: $B - B\'$ and $B + B\'$ cannot both be nonzero.', '1回ごとに考えてください。$B - B\'$ と $B + B\'$ が同時に 0 でないことはありません。'], ['It is the bound the right-hand plot\'s violet line marks.', '右の図の紫の線が示す上限です。'], ['Just add the extremes.', '端の値を足すだけです。']][ask],
          sol: sols[ask],
        };
      }
      const a = r.pick(NICE), b = r.pick(NICE.filter((x) => x !== a)), d = Math.abs(a - b) % 360, dd = d > 180 ? 360 - d : d;
      return {
        q: [`In the lab's local hidden-variable model, $E(a, b) = 1 - 2\\,\\Delta/\\pi$ where $\\Delta$ is the angle between the settings. Find $E$ for $a = ${a}^\\circ$, $b = ${b}^\\circ$.`, `この実験の局所隠れた変数モデルでは、設定のなす角を $\\Delta$ として $E(a, b) = 1 - 2\\,\\Delta/\\pi$ です。$a = ${a}^\\circ$、$b = ${b}^\\circ$ のときの $E$ を求めてください。`],
        a: { type: 'num', v: 1 - dd / 90, tol: 0.003 },
        hint: ['In degrees this is $1 - \\Delta/90^\\circ$, with $\\Delta$ taken between $0^\\circ$ and $180^\\circ$.', '度で書くと $1 - \\Delta/90^\\circ$ で、$\\Delta$ は $0^\\circ$ から $180^\\circ$ の間でとります。'],
        sol: [[`$\\Delta = ${dd}^\\circ$, so $E = 1 - ${dd}/90 = ${n(1 - dd / 90, 4)}$.`, `$\\Delta = ${dd}^\\circ$ なので $E = 1 - ${dd}/90 = ${n(1 - dd / 90, 4)}$ です。`], [`The quantum value is $\\cos ${dd}^\\circ = ${n(cosd(dd), 4)}$: ${Math.abs(cosd(dd)) > Math.abs(1 - dd / 90) + 1e-9 ? 'stronger' : Math.abs(cosd(dd) - (1 - dd / 90)) < 1e-9 ? 'the same here' : 'weaker'}. The two models agree at $0^\\circ$, $90^\\circ$ and $180^\\circ$ and differ in between.`, `量子の値は $\\cos ${dd}^\\circ = ${n(cosd(dd), 4)}$ で、${Math.abs(cosd(dd)) > Math.abs(1 - dd / 90) + 1e-9 ? 'こちらのほうが強い相関です' : Math.abs(cosd(dd) - (1 - dd / 90)) < 1e-9 ? 'ここでは同じです' : 'こちらのほうが弱い相関です'}。二つのモデルは $0^\\circ$、$90^\\circ$、$180^\\circ$ で一致し、その間で異なります。`]],
        set: { a, b, model: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const Sq = (a, ap, b, bp) => cosd(a - b) - cosd(a - bp) + cosd(ap - b) + cosd(ap - bp);
      const El = (x, y) => { const d = Math.abs(x - y) % 360, dd = d > 180 ? 360 - d : d; return 1 - dd / 90; };
      if (form === 0 || form === 1) {
        const lhv = form === 1;
        const a = r.pick([0, 30, 45, 60]), ap = a + r.pick([60, 90, 120]), b = a + r.pick([30, 45, 60]), bp = mod360(b + r.pick([60, 90, 120, 135]));
        const E = lhv ? El : (x, y) => cosd(x - y);
        const terms4 = [E(a, b), E(a, bp), E(ap, b), E(ap, bp)], s = terms4[0] - terms4[1] + terms4[2] + terms4[3];
        return {
          q: [`With settings $a = ${a}^\\circ$, $a' = ${ap}^\\circ$, $b = ${b}^\\circ$, $b' = ${bp}^\\circ$, compute $S = E(a,b) - E(a,b') + E(a',b) + E(a',b')$ ${lhv ? 'for the hidden-variable model $E = 1 - \\Delta/90^\\circ$' : 'for $\\Phi^+$, where $E = \\cos(a - b)$'}.`, `設定 $a = ${a}^\\circ$、$a' = ${ap}^\\circ$、$b = ${b}^\\circ$、$b' = ${bp}^\\circ$ で、${lhv ? '隠れた変数モデル $E = 1 - \\Delta/90^\\circ$' : '$E = \\cos(a - b)$ となる $\\Phi^+$'} の $S = E(a,b) - E(a,b') + E(a',b) + E(a',b')$ を計算してください。`],
          a: { type: 'num', v: s, tol: 0.004 },
          hint: ['Work out the four angle differences first.', 'まず四つの角度差を求めてください。'],
          sol: [[`Differences: $a - b = ${a - b}^\\circ$, $a - b' = ${a - bp}^\\circ$, $a' - b = ${ap - b}^\\circ$, $a' - b' = ${ap - bp}^\\circ$.`, `角度差は $a - b = ${a - b}^\\circ$、$a - b' = ${a - bp}^\\circ$、$a' - b = ${ap - b}^\\circ$、$a' - b' = ${ap - bp}^\\circ$ です。`], [`$S = ${n(terms4[0], 4)} - (${n(terms4[1], 4)}) + ${n(terms4[2], 4)} + ${n(terms4[3], 4)} = ${n(s, 4)}$.`, `$S = ${n(terms4[0], 4)} - (${n(terms4[1], 4)}) + ${n(terms4[2], 4)} + ${n(terms4[3], 4)} = ${n(s, 4)}$ です。`], [Math.abs(s) > 2 + 1e-9 ? `$|S| > 2$: no local hidden-variable theory can produce this.` : lhv ? 'As it must be, $|S| \\le 2$: the hidden-variable model never escapes the classical band.' : '$|S| \\le 2$ here: these settings do not show a violation, even though the state could.', Math.abs(s) > 2 + 1e-9 ? '$|S| > 2$ なので、どの局所隠れた変数の理論でもこの値は出せません。' : lhv ? '当然 $|S| \\le 2$ で、隠れた変数モデルは古典的な帯から出られません。' : 'ここでは $|S| \\le 2$ で、状態としては破れを示せるのに、この設定では示せていません。']],
          set: { a, ap: mod360(ap), b: mod360(b), bp, model: lhv ? 1 : 0 },
        };
      }
      const dlt = r.pick([0, 10, 20, 30, 40, 50, 60, 75, 100, 150, 200]);
      const a = dlt, ap = dlt + 90, b = dlt + 45, bp = mod360(dlt + 135);
      return {
        q: [`Alice uses $a = ${a}^\\circ$ and $a' = ${mod360(ap)}^\\circ$, Bob uses $b = ${mod360(b)}^\\circ$. Which $b'$ (between $0^\\circ$ and $360^\\circ$) makes $S$ as large as possible for $\\Phi^+$?`, `アリスは $a = ${a}^\\circ$ と $a' = ${mod360(ap)}^\\circ$、ボブは $b = ${mod360(b)}^\\circ$ を使います。$\\Phi^+$ で $S$ を最大にする $b'$（$0^\\circ$ から $360^\\circ$）はいくつですか。`],
        a: { type: 'num', v: bp, tol: 0.6, unit: ['°', '°'] },
        hint: ['Only $-\\cos(a - b\') + \\cos(a\' - b\')$ depends on $b\'$: write it as one cosine.', '$b\'$ に依存するのは $-\\cos(a - b\') + \\cos(a\' - b\')$ だけです。一つの余弦にまとめてください。'],
        sol: [[`With $a' = a + 90^\\circ$: $\\cos(a' - b') - \\cos(a - b') = \\sin(b' - a) - \\cos(b' - a) = \\sqrt2\\sin(b' - a - 45^\\circ)$.`, `$a' = a + 90^\\circ$ なので $\\cos(a' - b') - \\cos(a - b') = \\sin(b' - a) - \\cos(b' - a) = \\sqrt2\\sin(b' - a - 45^\\circ)$ です。`], [`It peaks when $b' - a - 45^\\circ = 90^\\circ$, so $b' = a + 135^\\circ = ${bp}^\\circ$.`, `これは $b' - a - 45^\\circ = 90^\\circ$ で最大なので、$b' = a + 135^\\circ = ${bp}^\\circ$ です。`], ['Then $S = \\sqrt2/2\\cdot 2 + \\sqrt2 = 2\\sqrt2$, Tsirelson\'s bound: the four settings sit $45^\\circ$ apart around the circle.', 'このとき $S = \\sqrt2/2\\cdot 2 + \\sqrt2 = 2\\sqrt2$ でツィレルソン限界です。四つの設定が円周上に $45^\\circ$ ずつ並びます。']],
        set: { a, ap: mod360(ap), b: mod360(b), bp, model: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const sgn = r.sign();
        return {
          q: [`Take $a = 0$, $b = ${sgn < 0 ? '-' : ''}x$, $a' = ${sgn < 0 ? '-' : ''}2x$, $b' = ${sgn < 0 ? '-' : ''}3x$ for $\\Phi^+$. Write $S(x) = E(a,b) - E(a,b') + E(a',b) + E(a',b')$ as a function of $x$ (radians).`, `$\\Phi^+$ で $a = 0$、$b = ${sgn < 0 ? '-' : ''}x$、$a' = ${sgn < 0 ? '-' : ''}2x$、$b' = ${sgn < 0 ? '-' : ''}3x$ とします。$S(x) = E(a,b) - E(a,b') + E(a',b) + E(a',b')$ を $x$（ラジアン）の式で表してください。`],
          a: { type: 'expr', v: '3*cos(x)-cos(3*x)', vars: ['x'], dom: { x: [0.05, 1.5] }, lhs: ['$S(x) =$', '$S(x) =$'] },
          hint: ['Three of the four pairs are $x$ apart; one pair is $3x$ apart.', '四組のうち三組の角度差は $x$、一組は $3x$ です。'],
          sol: [['$a - b$, $a\' - b$ and $a\' - b\'$ all differ by $\\pm x$; $a - b\'$ differs by $\\pm 3x$. Cosine is even, so signs do not matter.', '$a - b$、$a\' - b$、$a\' - b\'$ の差はどれも $\\pm x$、$a - b\'$ の差は $\\pm 3x$ です。余弦は偶関数なので符号は関係ありません。'], ['$S(x) = 3\\cos x - \\cos 3x$.', '$S(x) = 3\\cos x - \\cos 3x$ です。'], ['$S\'(x) = -3\\sin x + 3\\sin 3x = 0$ at $x = \\pi/4$, where $S = 3/\\sqrt2 + 1/\\sqrt2 = 2\\sqrt2$: the settings $0^\\circ, 45^\\circ, 90^\\circ, 135^\\circ$.', '$S\'(x) = -3\\sin x + 3\\sin 3x = 0$ となる $x = \\pi/4$ で $S = 3/\\sqrt2 + 1/\\sqrt2 = 2\\sqrt2$ になります。設定 $0^\\circ, 45^\\circ, 90^\\circ, 135^\\circ$ です。']],
          set: { a: 0, b: sgn > 0 ? 45 : 315, ap: sgn > 0 ? 90 : 270, bp: sgn > 0 ? 135 : 225, model: 0 },
        };
      }
      if (form === 1) {
        const ask = r.int(0, 1);
        if (ask === 0) {
          return {
            q: ['Noise in the source turns every correlation into $V\\cos(a - b)$ with visibility $0 \\le V \\le 1$. What is the smallest $V$ for which a CHSH violation is still possible?', '光源の雑音で、どの相関も可視度 $0 \\le V \\le 1$ を掛けた $V\\cos(a - b)$ になります。CHSH の破れがまだ起こり得る最小の $V$ はいくつですか。'],
            a: { type: 'num', v: 1 / SQ2, tol: 0.002, show: '1/\\sqrt2' },
            hint: ['Every term scales by $V$, so the best $S$ does too.', 'どの項も $V$ 倍されるので、最良の $S$ も $V$ 倍されます。'],
            sol: [['The best settings give $S = 2\\sqrt2\\,V$.', '最良の設定では $S = 2\\sqrt2\\,V$ です。'], ['Violation needs $2\\sqrt2\\,V > 2$, so $V > 1/\\sqrt2 \\approx 0.707$.', '破れには $2\\sqrt2\\,V > 2$ が必要なので $V > 1/\\sqrt2 \\approx 0.707$ です。'], ['Real Bell tests need visibilities above about 71%, which is why early experiments with lossy optics struggled.', '実際のベル実験には約 71% を超える可視度が必要で、損失の多い初期の光学実験が苦労したのはこのためです。']],
          };
        }
        const V = r.pick([0.6, 0.65, 0.68, 0.72, 0.75, 0.8, 0.85, 0.9, 0.95]);
        return {
          q: [`With visibility $V = ${V}$ (correlations $V\\cos(a - b)$), what is the largest $S$ any choice of settings can reach?`, `可視度 $V = ${V}$（相関は $V\\cos(a - b)$）のとき、設定をどう選んでも到達できる最大の $S$ はいくつですか。`],
          a: { type: 'num', v: 2 * SQ2 * V, tol: 0.003 },
          hint: ['Scale Tsirelson\'s bound.', 'ツィレルソン限界を $V$ 倍してください。'],
          sol: [[`$S_{\\max} = 2\\sqrt2 \\times ${V} = ${n(2 * SQ2 * V, 4)}$.`, `$S_{\\max} = 2\\sqrt2 \\times ${V} = ${n(2 * SQ2 * V, 4)}$ です。`], [2 * SQ2 * V > 2 ? 'Above 2: the violation survives this much noise.' : 'Not above 2: with this much noise the data could be explained by local hidden variables.', 2 * SQ2 * V > 2 ? '2 を超えるので、この程度の雑音では破れは残ります。' : '2 を超えないので、この雑音ではデータは局所隠れた変数で説明できてしまいます。']],
        };
      }
      const a = r.pick([0, 15, 30, 45, 60]), ap = a + r.pick([45, 60, 90, 120, 150]), b = r.pick([0, 20, 30, 45, 60, 75, 90]);
      const amp = 2 * Math.abs(sind((ap - a) / 2)), Smax = cosd(a - b) + cosd(ap - b) + amp;
      const bp = Math.round(mod360(Math.atan2(sind(ap) - sind(a), cosd(ap) - cosd(a)) / D));
      return {
        q: [`Alice's settings are $a = ${a}^\\circ$ and $a' = ${ap}^\\circ$, and Bob's first is $b = ${b}^\\circ$. If Bob chooses $b'$ freely, what is the largest $S$ he can reach with $\\Phi^+$?`, `アリスの設定は $a = ${a}^\\circ$ と $a' = ${ap}^\\circ$、ボブの一つ目は $b = ${b}^\\circ$ です。ボブが $b'$ を自由に選べるとき、$\\Phi^+$ で到達できる最大の $S$ はいくつですか。`],
        a: { type: 'num', v: Smax, tol: 0.004 },
        hint: ['$\\cos(a\' - b\') - \\cos(a - b\')$ is a sinusoid in $b\'$; its amplitude is $|e^{ia\'} - e^{ia}| = 2|\\sin\\tfrac{a\' - a}{2}|$.', '$\\cos(a\' - b\') - \\cos(a - b\')$ は $b\'$ の正弦波で、振幅は $|e^{ia\'} - e^{ia}| = 2|\\sin\\tfrac{a\' - a}{2}|$ です。'],
        sol: [[`The fixed part: $\\cos(a - b) + \\cos(a' - b) = ${n(cosd(a - b), 4)} + ${n(cosd(ap - b), 4)}$.`, `固定部分は $\\cos(a - b) + \\cos(a' - b) = ${n(cosd(a - b), 4)} + ${n(cosd(ap - b), 4)}$ です。`], [`The $b'$ part peaks at $2\\sin(${(ap - a) / 2}^\\circ) = ${n(amp, 4)}$, at $b' \\approx ${bp}^\\circ$.`, `$b'$ の部分の最大は $2\\sin(${(ap - a) / 2}^\\circ) = ${n(amp, 4)}$ で、$b' \\approx ${bp}^\\circ$ のときです。`], [`$S_{\\max} = ${n(Smax, 4)}$${Smax > 2 ? ', a violation' : ', no violation: no $b\'$ rescues these three settings'}. This is the "max S over b′" in the readout.`, `$S_{\\max} = ${n(Smax, 4)}$ で、${Smax > 2 ? '破れています' : '破れていません。この三つの設定ではどの $b\'$ でも救えません'}。読み取り欄の「b′ についての最大 S」がこれです。`]],
        set: { a, ap, b, bp, model: 0 },
      };
    },
  ];

  /* ---------- 2. teleportation ---------- */
  const PAULI = [['I', 'I'], ['X', 'X'], ['Z', 'Z'], ['XZ', 'XZ']];
  // Bob's Bloch vector before the correction: X^{m2} Z^{m1} applied to r
  const bobVec = ([x, y, z], m1, m2) => { let v = [x, y, z]; if (m1) v = [-v[0], -v[1], v[2]]; if (m2) v = [v[0], -v[1], -v[2]]; return v; };
  const bloch = (th, ph) => [sind(th) * cosd(ph), sind(th) * sind(ph), cosd(th)];
  const bits = (o) => [o >> 1, o & 1];
  Q.teleportation = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.int(10, 170), ph = r.int(0, 359), o = r.int(0, 3);
        return {
          q: [`Alice teleports $|\\psi\\rangle$ with $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$. What is the probability that her two measured bits are $m_1m_2 = ${o >> 1}${o & 1}$?`, `アリスが $\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ の $|\\psi\\rangle$ をテレポートします。測定した二つのビットが $m_1m_2 = ${o >> 1}${o & 1}$ となる確率はいくつですか。`],
          a: { type: 'num', v: 0.25, show: '\\tfrac14' },
          hint: ['After the CNOT and H the state is $\\tfrac12\\sum |m_1m_2\\rangle\\otimes X^{m_2}Z^{m_1}|\\psi\\rangle$.', 'CNOT と H の後の状態は $\\tfrac12\\sum |m_1m_2\\rangle\\otimes X^{m_2}Z^{m_1}|\\psi\\rangle$ です。'],
          sol: [['Each of the four branches has amplitude $\\tfrac12$ times a normalised state of Bob\'s qubit.', '四つの枝はどれも振幅 $\\tfrac12$ に規格化されたボブの状態を掛けたものです。'], ['So every outcome has probability $\\tfrac14$, whatever $|\\psi\\rangle$ is: the bits Alice sends carry no information about $\\theta$ or $\\varphi$.', 'よって $|\\psi\\rangle$ によらずどの結果も確率 $\\tfrac14$ です。アリスが送るビットには $\\theta$ や $\\varphi$ の情報は含まれません。']],
          set: { theta: th, phi: ph, outcome: o, step: 3 },
        };
      }
      if (form === 1) {
        const o = r.int(0, 3), [m1, m2] = bits(o);
        const opts = [['$I$ (do nothing)', '$I$（何もしない）'], ['$X$', '$X$'], ['$Z$', '$Z$'], ['$X$, then $Z$', '$X$ の後に $Z$']];
        const v = m1 && m2 ? 3 : m1 ? 2 : m2 ? 1 : 0;
        return {
          q: [`Alice reports $m_1m_2 = ${m1}${m2}$. Which correction must Bob apply to his qubit?`, `アリスが $m_1m_2 = ${m1}${m2}$ と知らせてきました。ボブは自分の量子ビットにどの補正をかけるべきですか。`],
          a: { type: 'choice', opts, v, fixed: true },
          hint: ['Bob holds $X^{m_2}Z^{m_1}|\\psi\\rangle$; undo the outer gate first.', 'ボブが持つのは $X^{m_2}Z^{m_1}|\\psi\\rangle$ です。外側のゲートから先に打ち消します。'],
          sol: [[`Bob holds $${m2 ? 'X' : ''}${m1 ? 'Z' : ''}${m1 || m2 ? '' : ''}|\\psi\\rangle$${!m1 && !m2 ? ', which is already $|\\psi\\rangle$' : ''}.`, `ボブは $${m2 ? 'X' : ''}${m1 ? 'Z' : ''}|\\psi\\rangle$ を持っています${!m1 && !m2 ? '。これはすでに $|\\psi\\rangle$ です' : ''}。`], [`Since $X^2 = Z^2 = I$, applying ${m1 && m2 ? '$X$ and then $Z$' : m1 ? '$Z$' : m2 ? '$X$' : 'nothing'} returns $|\\psi\\rangle$ exactly.`, `$X^2 = Z^2 = I$ なので、${m1 && m2 ? '$X$ の後に $Z$ をかける' : m1 ? '$Z$ をかける' : m2 ? '$X$ をかける' : '何もしない'}とちょうど $|\\psi\\rangle$ に戻ります。`]],
          set: { outcome: o, step: 4 },
        };
      }
      const ask = r.int(0, 1);
      return {
        q: ask ? ['Before Alice\'s bits arrive, how long is the Bloch vector of Bob\'s qubit (averaged over her possible outcomes)?', 'アリスのビットが届く前、ボブの量子ビットのブロッホベクトルの長さ（アリスの可能な結果について平均したもの）はいくつですか。'] : ['How many classical bits must Alice send to Bob for him to recover $|\\psi\\rangle$?', 'ボブが $|\\psi\\rangle$ を取り戻すために、アリスは古典ビットをいくつ送らなければなりませんか。'],
        a: ask ? { type: 'num', v: 0, tol: 0.001 } : { type: 'int', v: 2 },
        hint: ask ? ['The four possible states $X^{m_2}Z^{m_1}|\\psi\\rangle$ are equally likely; average their Bloch vectors.', '四つの可能な状態 $X^{m_2}Z^{m_1}|\\psi\\rangle$ は等確率です。ブロッホベクトルを平均してください。'] : ['Bob must know which of four corrections to apply.', 'ボブは四つの補正のどれを使うかを知る必要があります。'],
        sol: ask ? [['The four vectors are $(x, y, z)$, $(-x, -y, z)$, $(x, -y, -z)$, $(-x, y, -z)$; they sum to zero.', '四つのベクトルは $(x, y, z)$、$(-x, -y, z)$、$(x, -y, -z)$、$(-x, y, -z)$ で、和は 0 です。'], ['Length $0$: Bob\'s qubit is maximally mixed, $I/2$, so nothing travels faster than the classical message.', '長さは $0$ で、ボブの量子ビットは完全混合 $I/2$ です。古典的な通信より速く伝わるものは何もありません。']] : [['There are four equally likely outcomes, so $\\log_2 4 = 2$ bits.', '等確率の結果が四つあるので $\\log_2 4 = 2$ ビットです。'], ['Two bits plus one shared Bell pair transmit one qubit: and the bits alone, with probability $\\tfrac14$ each, reveal nothing about it.', '2 ビットと共有したベルペア一つで 1 量子ビットが伝わります。しかもビットだけでは、どれも確率 $\\tfrac14$ なので量子ビットについて何も分かりません。']],
        set: { step: ask ? 2 : 4 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick([30, 45, 60, 90, 120, 135]), ph = r.pick([0, 45, 90, 180, 270, 300]), o = r.int(1, 3), [m1, m2] = bits(o);
        const v = bobVec(bloch(th, ph), m1, m2).map((x) => (Math.abs(x) < 1e-12 ? 0 : x));
        return {
          q: [`$|\\psi\\rangle$ has $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$ and Alice gets $m_1m_2 = ${m1}${m2}$. Give the Bloch vector of Bob's qubit before he corrects it.`, `$|\\psi\\rangle$ は $\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ で、アリスの結果は $m_1m_2 = ${m1}${m2}$ です。補正前のボブの量子ビットのブロッホベクトルを答えてください。`],
          a: { type: 'tuple', v, labels: ['$x$', '$y$', '$z$'], tol: 0.006 },
          hint: ['$Z$ rotates the Bloch sphere by $180^\\circ$ about $z$, $X$ by $180^\\circ$ about $x$.', '$Z$ はブロッホ球を $z$ 軸のまわりに $180^\\circ$、$X$ は $x$ 軸のまわりに $180^\\circ$ 回します。'],
          sol: [[`$|\\psi\\rangle$ points along $(\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta) = (${bloch(th, ph).map((x) => n(x, 3)).join(', ')})$.`, `$|\\psi\\rangle$ の向きは $(\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta) = (${bloch(th, ph).map((x) => n(x, 3)).join(', ')})$ です。`], [`Bob holds $${m2 ? 'X' : ''}${m1 ? 'Z' : ''}|\\psi\\rangle$: ${m1 ? '$Z$ flips $x$ and $y$' : ''}${m1 && m2 ? ', then ' : ''}${m2 ? '$X$ flips $y$ and $z$' : ''}.`, `ボブが持つのは $${m2 ? 'X' : ''}${m1 ? 'Z' : ''}|\\psi\\rangle$ です。${m1 ? '$Z$ は $x$ と $y$ を反転し' : ''}${m1 && m2 ? '、続いて' : ''}${m2 ? '$X$ は $y$ と $z$ を反転します' : 'ます'}。`], [`Result $(${v.map((x) => n(x, 3)).join(', ')})$: a pure state, but the wrong one until the correction rotates it back.`, `結果は $(${v.map((x) => n(x, 3)).join(', ')})$ です。純粋状態ですが、補正で回し戻すまでは別の状態です。`]],
          set: { theta: th, phi: ph, outcome: o, step: 3 },
        };
      }
      if (form === 1) {
        const th = r.int(15, 165), ph = r.int(0, 359), o = r.int(1, 3), [m1, m2] = bits(o);
        const p = bloch(th, ph), v = bobVec(p, m1, m2), F = (1 + p[0] * v[0] + p[1] * v[1] + p[2] * v[2]) / 2;
        return {
          q: [`With $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$ and outcome $m_1m_2 = ${m1}${m2}$, what is the fidelity $|\\langle\\psi|\\phi_B\\rangle|^2$ of Bob's uncorrected qubit with $|\\psi\\rangle$? Give three decimals.`, `$\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$、結果 $m_1m_2 = ${m1}${m2}$ のとき、補正前のボブの量子ビットと $|\\psi\\rangle$ の忠実度 $|\\langle\\psi|\\phi_B\\rangle|^2$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: F, tol: 0.0015 },
          hint: ['For two pure qubit states, fidelity $= (1 + \\vec r_1\\cdot\\vec r_2)/2$.', '二つの純粋状態の忠実度は $(1 + \\vec r_1\\cdot\\vec r_2)/2$ です。'],
          sol: [[`$\\vec r_\\psi = (${p.map((x) => n(x, 3)).join(', ')})$ and Bob's vector is $(${v.map((x) => n(x, 3)).join(', ')})$.`, `$\\vec r_\\psi = (${p.map((x) => n(x, 3)).join(', ')})$、ボブのベクトルは $(${v.map((x) => n(x, 3)).join(', ')})$ です。`], [`$F = \\tfrac12(1 + ${n(F * 2 - 1, 4)}) = ${n(F, 4)}$.`, `$F = \\tfrac12(1 + ${n(F * 2 - 1, 4)}) = ${n(F, 4)}$ です。`], ['This is the "fidelity now" in the readout at step 3; after the correction it is exactly 1.', 'ステップ 3 の読み取り欄の「現在の忠実度」がこれで、補正後はちょうど 1 になります。']],
          set: { theta: th, phi: ph, outcome: o, step: 3 },
        };
      }
      const th = r.pick([30, 60, 90, 120, 150, 45, 135]), neg = r.chance(0.4), ph = neg ? 180 : 0;
      const al = cosd(th / 2), be = (neg ? -1 : 1) * sind(th / 2);
      const m1 = r.int(0, 1), m2 = r.int(0, 1), bb = r.int(0, 1);
      // branch m1 m2: 00 -> a|0> + b|1>, 01 -> b|0> + a|1>, 10 -> a|0> - b|1>, 11 -> -b|0> + a|1>
      const br = [[al, be], [be, al], [al, -be], [-be, al]][2 * m1 + m2];
      const amp = br[bb] / 2;
      return {
        q: [`$|\\psi\\rangle = \\cos(${th / 2}^\\circ)|0\\rangle ${neg ? '-' : '+'} \\sin(${th / 2}^\\circ)|1\\rangle$. After the CNOT and the Hadamard (step 2), what is the amplitude of $|${m1}${m2}${bb}\\rangle$ (qubits $\\psi$, $A$, $B$)?`, `$|\\psi\\rangle = \\cos(${th / 2}^\\circ)|0\\rangle ${neg ? '-' : '+'} \\sin(${th / 2}^\\circ)|1\\rangle$ です。CNOT とアダマールの後（ステップ 2）、$|${m1}${m2}${bb}\\rangle$（量子ビット $\\psi$、$A$、$B$ の順）の振幅はいくつですか。`],
        a: { type: 'num', v: amp, tol: 0.002 },
        hint: ['Use $\\tfrac12\\sum|m_1m_2\\rangle X^{m_2}Z^{m_1}|\\psi\\rangle$ and read off Bob\'s component.', '$\\tfrac12\\sum|m_1m_2\\rangle X^{m_2}Z^{m_1}|\\psi\\rangle$ を使い、ボブの成分を読み取ってください。'],
        sol: [[`Write $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ with $\\alpha = ${n(al, 4)}$, $\\beta = ${n(be, 4)}$.`, `$|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$、$\\alpha = ${n(al, 4)}$、$\\beta = ${n(be, 4)}$ とします。`], [`The branch $|${m1}${m2}\\rangle$ carries $\\tfrac12 X^{${m2}}Z^{${m1}}|\\psi\\rangle = \\tfrac12(${n(br[0], 4)}|0\\rangle + ${n(br[1], 4)}|1\\rangle)$.`.replace('+ -', '- '), `枝 $|${m1}${m2}\\rangle$ には $\\tfrac12 X^{${m2}}Z^{${m1}}|\\psi\\rangle = \\tfrac12(${n(br[0], 4)}|0\\rangle + ${n(br[1], 4)}|1\\rangle)$ がついています。`.replace('+ -', '- ')], [`So the amplitude of $|${m1}${m2}${bb}\\rangle$ is $${n(amp, 4)}$: in the bar chart, the bar over $|${m1}${m2}${bb}\\rangle$.`, `よって $|${m1}${m2}${bb}\\rangle$ の振幅は $${n(amp, 4)}$ で、棒グラフの $|${m1}${m2}${bb}\\rangle$ の棒がこれです。`]],
        set: { theta: th, phi: ph, step: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.int(10, 170), ph = r.int(0, 359);
        return {
          q: [`Suppose Bob ignores Alice's bits and never corrects. Averaged over her four outcomes, what fidelity with $|\\psi\\rangle$ ($\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$) does he end up with?`, `ボブがアリスのビットを無視して補正をまったくしないとします。四つの結果について平均すると、$|\\psi\\rangle$（$\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$）との忠実度はいくらになりますか。`],
          a: { type: 'num', v: 0.5, show: '\\tfrac12' },
          hint: ['Average $(1 + \\vec r\\cdot\\vec r_k)/2$ over the four Pauli images $\\vec r_k$ of $\\vec r$.', '$\\vec r$ の四つのパウリ像 $\\vec r_k$ について $(1 + \\vec r\\cdot\\vec r_k)/2$ を平均してください。'],
          sol: [['$\\sum_k \\vec r\\cdot\\vec r_k = (x^2 + y^2 + z^2) + (-x^2 - y^2 + z^2) + (x^2 - y^2 - z^2) + (-x^2 + y^2 - z^2) = 0$.', '$\\sum_k \\vec r\\cdot\\vec r_k = (x^2 + y^2 + z^2) + (-x^2 - y^2 + z^2) + (x^2 - y^2 - z^2) + (-x^2 + y^2 - z^2) = 0$ です。'], ['So the average fidelity is $\\tfrac14\\sum\\tfrac12(1 + \\vec r\\cdot\\vec r_k) = \\tfrac12$ for every $|\\psi\\rangle$.', 'よって平均の忠実度はどの $|\\psi\\rangle$ でも $\\tfrac14\\sum\\tfrac12(1 + \\vec r\\cdot\\vec r_k) = \\tfrac12$ です。'], ['That is what a random guess achieves: without the two classical bits, the shared pair alone transmits nothing.', 'これは当てずっぽうと同じで、二つの古典ビットがなければ共有したペアだけでは何も伝わりません。']],
          set: { theta: th, phi: ph, step: 3 },
        };
      }
      if (form === 1) {
        const th = r.int(15, 165), ph = r.int(0, 359), which = r.int(0, 2);
        const [x, y, z] = bloch(th, ph);
        const v = which === 0 ? [x, -y, -z] : which === 1 ? [-x, -y, z] : [-x, y, -z];
        const F = (1 + x * v[0] + y * v[1] + z * v[2]) / 2;
        return {
          q: [`A noisy channel flips ${which === 2 ? 'both of Alice\'s bits' : `Alice's bit $${which === 0 ? 'm_2' : 'm_1'}$`} on the way, and Bob corrects with the wrong bits. For $\\theta = ${th}^\\circ$, $\\varphi = ${ph}^\\circ$, what fidelity does his qubit have with $|\\psi\\rangle$? Give three decimals.`, `雑音のある通信路で${which === 2 ? 'アリスのビットが両方とも' : `アリスのビット $${which === 0 ? 'm_2' : 'm_1'}$ が`}途中で反転し、ボブは誤ったビットで補正します。$\\theta = ${th}^\\circ$、$\\varphi = ${ph}^\\circ$ のとき、ボブの量子ビットと $|\\psi\\rangle$ の忠実度はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: F, tol: 0.0015 },
          hint: ['Combine Bob\'s state $X^{m_2}Z^{m_1}|\\psi\\rangle$ with the wrong correction: what single Pauli is left over?', 'ボブの状態 $X^{m_2}Z^{m_1}|\\psi\\rangle$ と誤った補正を合わせると、どのパウリ演算子が一つ残るでしょうか。'],
          sol: [[`The leftover operator is ${which === 0 ? '$X$' : which === 1 ? '$Z$' : '$XZ \\propto Y$'}, so Bob holds it applied to $|\\psi\\rangle$, Bloch vector $(${v.map((q) => n(q, 3)).join(', ')})$.`, `残る演算子は ${which === 0 ? '$X$' : which === 1 ? '$Z$' : '$XZ \\propto Y$'} で、ボブはそれを $|\\psi\\rangle$ にかけた状態を持ちます。ブロッホベクトルは $(${v.map((q) => n(q, 3)).join(', ')})$ です。`], [`$F = \\tfrac12(1 + \\vec r\\cdot\\vec r_B) = ${n(F, 4)}$.`, `$F = \\tfrac12(1 + \\vec r\\cdot\\vec r_B) = ${n(F, 4)}$ です。`], [`A state on the ${which === 0 ? '$x$' : which === 1 ? '$z$' : '$y$'} axis would survive this error untouched, since a $180^\\circ$ turn about its own axis leaves it fixed.`, `${which === 0 ? '$x$' : which === 1 ? '$z$' : '$y$'} 軸上の状態なら、この誤りでも影響を受けません。自分の軸のまわりの $180^\\circ$ 回転では動かないからです。`]],
          set: { theta: th, phi: ph, step: 4 },
        };
      }
      const cases = [[0, 0, 'sin(theta)^2', '\\sin^2\\theta'], [0, 1, 'cos(theta)^2', '\\cos^2\\theta'], [90, 1, 'cos(theta)^2', '\\cos^2\\theta'], [90, 2, 'sin(theta)^2', '\\sin^2\\theta']];
      const [ph, which, ex, tex] = r.pick(cases);
      const names = [['$m_2$', '$m_2$'], ['$m_1$', '$m_1$'], ['both bits', '両方のビット']];
      return {
        q: [`Take $\\varphi = ${ph}^\\circ$. If ${which === 2 ? 'both bits are' : `the bit ${names[which][0]} is`} flipped in transit, write Bob's final fidelity $F(\\theta)$ with $|\\psi\\rangle$ as a function of $\\theta$ (radians).`, `$\\varphi = ${ph}^\\circ$ とします。途中で${which === 2 ? '両方のビットが' : `ビット ${names[which][1]} が`}反転するとき、ボブの最終的な $|\\psi\\rangle$ との忠実度 $F(\\theta)$ を $\\theta$（ラジアン）の式で表してください。`],
        a: { type: 'expr', v: ex, vars: ['theta'], dom: { theta: [0.1, 3] }, lhs: ['$F(\\theta) =$', '$F(\\theta) =$'] },
        hint: ['Find the leftover Pauli, then use $F = (1 + \\vec r\\cdot\\vec r_B)/2$ with $\\vec r = (\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta)$.', '残るパウリ演算子を求め、$\\vec r = (\\sin\\theta\\cos\\varphi, \\sin\\theta\\sin\\varphi, \\cos\\theta)$ で $F = (1 + \\vec r\\cdot\\vec r_B)/2$ を使ってください。'],
        sol: [[`The leftover operator is ${which === 0 ? '$X$, which maps $(x, y, z) \\to (x, -y, -z)$' : which === 1 ? '$Z$, which maps $(x, y, z) \\to (-x, -y, z)$' : '$XZ \\propto Y$, which maps $(x, y, z) \\to (-x, y, -z)$'}.`, `残る演算子は ${which === 0 ? '$X$ で、$(x, y, z) \\to (x, -y, -z)$ と写します' : which === 1 ? '$Z$ で、$(x, y, z) \\to (-x, -y, z)$ と写します' : '$XZ \\propto Y$ で、$(x, y, z) \\to (-x, y, -z)$ と写します'}。`], [`With $\\varphi = ${ph}^\\circ$, $\\vec r = ${ph ? '(0, \\sin\\theta, \\cos\\theta)' : '(\\sin\\theta, 0, \\cos\\theta)'}$, so $F = ${tex}$.`, `$\\varphi = ${ph}^\\circ$ では $\\vec r = ${ph ? '(0, \\sin\\theta, \\cos\\theta)' : '(\\sin\\theta, 0, \\cos\\theta)'}$ なので $F = ${tex}$ です。`], [`The error is harmless for states on the rotation axis and worst for states perpendicular to it, where $F = 0$.`, `この誤りは回転軸上の状態には無害で、軸に垂直な状態で最悪となり $F = 0$ です。`]],
        set: { phi: ph, step: 4 },
      };
    },
  ];

  /* ---------- 3. entanglement entropy ---------- */
  const THS = [10, 15, 20, 22.5, 30, 35, 40, 50, 60, 67.5, 70, 75, 80];
  Q['entanglement-entropy'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick(THS), c2 = cosd(th) ** 2, s2 = sind(th) ** 2;
        return {
          q: [`For $|\\psi\\rangle = \\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ with $\\theta = ${th}^\\circ$, give the two eigenvalues of $\\rho_A$, larger first.`, `$|\\psi\\rangle = \\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$、$\\theta = ${th}^\\circ$ のとき、$\\rho_A$ の二つの固有値を大きい順に答えてください。`],
          a: { type: 'tuple', v: [Math.max(c2, s2), Math.min(c2, s2)], labels: ['$\\lambda_1$', '$\\lambda_2$'], tol: 0.002 },
          hint: ['In Schmidt form, $\\rho_A$ is diagonal with the squared coefficients.', 'シュミット形では $\\rho_A$ は係数の二乗を並べた対角行列です。'],
          sol: [[`$\\rho_A = \\mathrm{diag}(\\cos^2\\theta, \\sin^2\\theta) = \\mathrm{diag}(${n(c2, 4)}, ${n(s2, 4)})$.`, `$\\rho_A = \\mathrm{diag}(\\cos^2\\theta, \\sin^2\\theta) = \\mathrm{diag}(${n(c2, 4)}, ${n(s2, 4)})$ です。`], ['They sum to 1, as probabilities must; these are the two bars.', '確率なので和は 1 で、これが二本の棒です。']],
          set: { theta: th, preset: 0 },
        };
      }
      if (form === 1) {
        const k = r.int(0, 2);
        const items = [[['$(|00\\rangle + |11\\rangle)/\\sqrt2$', '$(|00\\rangle + |11\\rangle)/\\sqrt2$'], 1, { theta: 45, preset: 1 }], [['$|00\\rangle$', '$|00\\rangle$'], 0, { theta: 0, preset: 2 }], [['$(|01\\rangle - |10\\rangle)/\\sqrt2$', '$(|01\\rangle - |10\\rangle)/\\sqrt2$'], 1, undefined]][k];
        return {
          q: [`What is the entanglement entropy $S(\\rho_A)$, in bits, of ${items[0][0]}?`, `${items[0][1]} のもつれエントロピー $S(\\rho_A)$ は何ビットですか。`],
          a: { type: 'num', v: items[1], tol: 0.001 },
          hint: ['Find $\\rho_A$ by tracing out $B$, then $S = -\\sum\\lambda\\log_2\\lambda$.', '$B$ についてトレースをとって $\\rho_A$ を求め、$S = -\\sum\\lambda\\log_2\\lambda$ を使います。'],
          sol: items[1] ? [['$\\rho_A = I/2$: both eigenvalues are $\\tfrac12$.', '$\\rho_A = I/2$ で、固有値はどちらも $\\tfrac12$ です。'], ['$S = -2\\cdot\\tfrac12\\log_2\\tfrac12 = 1$ bit, the most a qubit can have: knowing the pair perfectly tells you nothing about either half.', '$S = -2\\cdot\\tfrac12\\log_2\\tfrac12 = 1$ ビットで、1 量子ビットの最大値です。ペア全体を完全に知っていても、片方については何も分かりません。']] : [['$\\rho_A = |0\\rangle\\langle0|$, a pure state with eigenvalues 1 and 0.', '$\\rho_A = |0\\rangle\\langle0|$ は純粋状態で、固有値は 1 と 0 です。'], ['$S = 0$: a product state carries no entanglement.', '$S = 0$ で、積状態にはもつれがありません。']],
          set: items[2],
        };
      }
      const th = r.pick(THS);
      return {
        q: [`How long is the Bloch vector of $\\rho_A$ for $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ with $\\theta = ${th}^\\circ$?`, `$\\theta = ${th}^\\circ$ の $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ について、$\\rho_A$ のブロッホベクトルの長さはいくつですか。`],
        a: { type: 'num', v: Math.abs(cosd(2 * th)), tol: 0.002 },
        hint: ['$\\rho_A = (I + r_z\\sigma_z)/2$ with $r_z = \\lambda_1 - \\lambda_2$.', '$\\rho_A = (I + r_z\\sigma_z)/2$ で $r_z = \\lambda_1 - \\lambda_2$ です。'],
        sol: [[`$r_z = \\cos^2\\theta - \\sin^2\\theta = \\cos 2\\theta = ${n(cosd(2 * th), 4)}$.`, `$r_z = \\cos^2\\theta - \\sin^2\\theta = \\cos 2\\theta = ${n(cosd(2 * th), 4)}$ です。`], [`$|\\vec r_A| = ${n(Math.abs(cosd(2 * th)), 4)}$: the more entangled, the closer to the centre of the ball.`, `$|\\vec r_A| = ${n(Math.abs(cosd(2 * th)), 4)}$ です。もつれが強いほどブロッホ球の中心に近づきます。`]],
        set: { theta: th, preset: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const th = r.pick(THS), p = cosd(th) ** 2;
        return {
          q: [`Find the entanglement entropy $S(\\rho_A)$ of $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ for $\\theta = ${th}^\\circ$, in bits to three decimals.`, `$\\theta = ${th}^\\circ$ の $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ のもつれエントロピー $S(\\rho_A)$ をビットで求めてください（小数第3位まで）。`],
          a: { type: 'num', v: H2(p), tol: 0.0015, unit: ['bits', 'ビット'] },
          hint: ['The eigenvalues are $\\cos^2\\theta$ and $\\sin^2\\theta$.', '固有値は $\\cos^2\\theta$ と $\\sin^2\\theta$ です。'],
          sol: [[`$\\lambda_1 = ${n(p, 4)}$, $\\lambda_2 = ${n(1 - p, 4)}$.`, `$\\lambda_1 = ${n(p, 4)}$、$\\lambda_2 = ${n(1 - p, 4)}$ です。`], [`$S = -${n(p, 4)}\\log_2 ${n(p, 4)} - ${n(1 - p, 4)}\\log_2 ${n(1 - p, 4)} = ${n(H2(p), 4)}$ bits.`, `$S = -${n(p, 4)}\\log_2 ${n(p, 4)} - ${n(1 - p, 4)}\\log_2 ${n(1 - p, 4)} = ${n(H2(p), 4)}$ ビットです。`], [`Between 0 (product) and 1 (maximally entangled); the curve is symmetric about $45^\\circ$, so $\\theta = ${90 - th}^\\circ$ gives the same.`, `0（積状態）と 1（最大のもつれ）の間の値です。曲線は $45^\\circ$ について対称なので、$\\theta = ${90 - th}^\\circ$ でも同じ値になります。`]],
          set: { theta: th, preset: 0 },
        };
      }
      if (form === 1) {
        let v, N2;
        do { v = [r.int(-2, 3), r.int(-2, 2), r.int(-2, 2), r.int(-2, 3)]; N2 = v.reduce((s, x) => s + x * x, 0); } while (N2 === 0 || v.filter((x) => x).length < 2);
        const det = v[0] * v[3] - v[1] * v[2], C = 2 * Math.abs(det) / N2;
        return {
          q: [`Find the concurrence $C = 2|\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10}|$ of the normalised state $\\propto ${ket2(v)}$.`, `規格化した状態 $\\propto ${ket2(v)}$ のコンカレンス $C = 2|\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10}|$ を求めてください。`],
          a: { type: 'num', v: C, show: frac(2 * Math.abs(det), N2) },
          hint: ['Normalise first: divide every amplitude by $\\sqrt{N}$ with $N$ the sum of squares.', 'まず規格化します。二乗和 $N$ の平方根 $\\sqrt{N}$ ですべての振幅を割ってください。'],
          sol: [[`$N = ${N2}$, so $\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10} = (${v[0]}\\cdot${v[3]} - ${v[1]}\\cdot${v[2]})/${N2} = ${frac(det, N2)}$.`, `$N = ${N2}$ なので $\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10} = (${v[0]}\\cdot${v[3]} - ${v[1]}\\cdot${v[2]})/${N2} = ${frac(det, N2)}$ です。`], [`$C = 2\\cdot${frac(Math.abs(det), N2)} = ${frac(2 * Math.abs(det), N2)}$${det === 0 ? ': a product state' : C === 1 ? ': maximally entangled' : ''}.`, `$C = 2\\cdot${frac(Math.abs(det), N2)} = ${frac(2 * Math.abs(det), N2)}$${det === 0 ? 'で、積状態です' : C === 1 ? 'で、最大にもつれています' : 'です'}。`], ['$C = 0$ exactly when the $2\\times2$ matrix of amplitudes has rank one, that is when the state factorises.', '$C = 0$ となるのは振幅の $2\\times2$ 行列の階数が 1、すなわち状態が積に分解できるときに限ります。']],
        };
      }
      const th = r.pick(THS), pur = cosd(th) ** 4 + sind(th) ** 4;
      return {
        q: [`The purity $\\operatorname{Tr}\\rho_A^2$ measures how mixed $\\rho_A$ is. Find it for $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ with $\\theta = ${th}^\\circ$.`, `純度 $\\operatorname{Tr}\\rho_A^2$ は $\\rho_A$ の混ざり具合を測ります。$\\theta = ${th}^\\circ$ の $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ について求めてください。`],
        a: { type: 'num', v: pur, tol: 0.002 },
        hint: ['$\\operatorname{Tr}\\rho^2 = \\lambda_1^2 + \\lambda_2^2$; it also equals $(1 + |\\vec r|^2)/2$.', '$\\operatorname{Tr}\\rho^2 = \\lambda_1^2 + \\lambda_2^2$ で、$(1 + |\\vec r|^2)/2$ にも等しくなります。'],
        sol: [[`$\\cos^4\\theta + \\sin^4\\theta = ${n(cosd(th) ** 4, 4)} + ${n(sind(th) ** 4, 4)} = ${n(pur, 4)}$.`, `$\\cos^4\\theta + \\sin^4\\theta = ${n(cosd(th) ** 4, 4)} + ${n(sind(th) ** 4, 4)} = ${n(pur, 4)}$ です。`], [`Equivalently $1 - C^2/2$ with $C = \\sin 2\\theta = ${n(sind(2 * th), 4)}$. It runs from 1 (pure) down to $\\tfrac12$ (maximally mixed).`, `同じことですが、$C = \\sin 2\\theta = ${n(sind(2 * th), 4)}$ として $1 - C^2/2$ です。1（純粋）から $\\tfrac12$（完全混合）まで変わります。`]],
        set: { theta: th, preset: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const S = r.pick([0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 0.9, 0.95]);
        let lo = 0, hi = 45; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (H2(cosd(m) ** 2) < S) lo = m; else hi = m; }
        const th = (lo + hi) / 2;
        return {
          q: [`For which angle $0 < \\theta < 45^\\circ$ does $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ carry exactly $${S}$ bits of entanglement? Give degrees to one decimal.`, `$0 < \\theta < 45^\\circ$ のどの角で、$\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ のもつれがちょうど $${S}$ ビットになりますか（度、小数第1位まで）。`],
          a: { type: 'num', v: th, tol: 0.06, unit: ['°', '°'] },
          hint: ['Solve $H_2(p) = ' + S + '$ for the smaller eigenvalue $p = \\sin^2\\theta$; the binary entropy rises steeply near $p = 0$.', '小さいほうの固有値 $p = \\sin^2\\theta$ について $H_2(p) = ' + S + '$ を解きます。二値エントロピーは $p = 0$ の近くで急に増えます。'],
          sol: [[`Solve $-p\\log_2 p - (1 - p)\\log_2(1 - p) = ${S}$ numerically: $p = ${n(sind(th) ** 2, 4)}$.`, `$-p\\log_2 p - (1 - p)\\log_2(1 - p) = ${S}$ を数値的に解くと $p = ${n(sind(th) ** 2, 4)}$ です。`], [`$\\theta = \\arcsin\\sqrt p = ${n(th, 3)}^\\circ$.`, `$\\theta = \\arcsin\\sqrt p = ${n(th, 3)}^\\circ$ です。`], [`A small tilt away from the product state already buys a lot: ${S} bits needs only $${n(th, 1)}^\\circ$ of the $45^\\circ$ to full entanglement.`, `積状態からわずかに傾けるだけで大きなもつれが得られます。${S} ビットに必要なのは、完全なもつれまでの $45^\\circ$ のうち $${n(th, 1)}^\\circ$ だけです。`]],
          set: { theta: Math.round(th * 2) / 2, preset: 0 },
        };
      }
      if (form === 1) {
        const which = r.int(0, 1);
        if (which === 0) {
          return {
            q: ['Write the entanglement entropy (in bits) of a two-qubit pure state as a function of the larger Schmidt eigenvalue $p$.', '2 量子ビットの純粋状態のもつれエントロピー（ビット）を、大きいほうのシュミット固有値 $p$ の式で表してください。'],
            a: { type: 'expr', v: '-p*log2(p)-(1-p)*log2(1-p)', vars: ['p'], dom: { p: [0.5, 0.97] }, lhs: ['$S(p) =$', '$S(p) =$'] },
            hint: ['The other eigenvalue is $1 - p$.', 'もう一つの固有値は $1 - p$ です。'],
            sol: [['$\\rho_A$ has eigenvalues $p$ and $1 - p$.', '$\\rho_A$ の固有値は $p$ と $1 - p$ です。'], ['$S(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$, the binary entropy: 0 at $p = 1$, 1 bit at $p = \\tfrac12$.', '$S(p) = -p\\log_2 p - (1 - p)\\log_2(1 - p)$ で、二値エントロピーです。$p = 1$ で 0、$p = \\tfrac12$ で 1 ビットです。']],
          };
        }
        return {
          q: ['For a two-qubit pure state, write the length $|\\vec r_A|$ of the reduced Bloch vector as a function of the concurrence $C$.', '2 量子ビットの純粋状態で、縮約したブロッホベクトルの長さ $|\\vec r_A|$ をコンカレンス $C$ の式で表してください。'],
          a: { type: 'expr', v: 'sqrt(1-C^2)', vars: ['C'], dom: { C: [0, 0.98] }, lhs: ['$|\\vec r_A| =$', '$|\\vec r_A| =$'] },
          hint: ['In Schmidt form $C = \\sin 2\\theta$ and $|\\vec r_A| = |\\cos 2\\theta|$.', 'シュミット形では $C = \\sin 2\\theta$、$|\\vec r_A| = |\\cos 2\\theta|$ です。'],
          sol: [['Every pure two-qubit state can be rotated locally to $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$, which changes neither quantity.', 'どの 2 量子ビットの純粋状態も局所回転で $\\cos\\theta|00\\rangle + \\sin\\theta|11\\rangle$ にでき、どちらの量も変わりません。'], ['$|\\vec r_A|^2 + C^2 = \\cos^2 2\\theta + \\sin^2 2\\theta = 1$, so $|\\vec r_A| = \\sqrt{1 - C^2}$.', '$|\\vec r_A|^2 + C^2 = \\cos^2 2\\theta + \\sin^2 2\\theta = 1$ なので $|\\vec r_A| = \\sqrt{1 - C^2}$ です。'], ['The more entangled the pair, the deeper inside the Bloch ball each half sits.', 'ペアのもつれが強いほど、それぞれの半分はブロッホ球の奥深くに位置します。']],
        };
      }
      // product or entangled?
      const prod = r.chance(0.5);
      let v;
      if (prod) { let a, b, c, d; do { a = r.int(-2, 2); b = r.int(-2, 2); c = r.int(-2, 2); d = r.int(-2, 2); } while ((a === 0 && b === 0) || (c === 0 && d === 0) || [a * c, a * d, b * c, b * d].filter((x) => x).length < 3); v = [a * c, a * d, b * c, b * d]; }
      else { do { v = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; } while (v.filter((x) => x).length < 3 || v[0] * v[3] === v[1] * v[2]); }
      const g = v.reduce((s, x) => gcd(s, x), 0) || 1; v = v.map((x) => x / g);
      const det = v[0] * v[3] - v[1] * v[2];
      return {
        q: [`Is the state $\\propto ${ket2(v)}$ entangled?`, `状態 $\\propto ${ket2(v)}$ はもつれていますか。`],
        a: { type: 'choice', opts: [['No: it factorises, so $C = 0$ and $S(\\rho_A) = 0$.', 'いいえ。積に分解できるので $C = 0$、$S(\\rho_A) = 0$ です。'], ['Yes: $\\psi_{00}\\psi_{11} \\ne \\psi_{01}\\psi_{10}$, so $C > 0$.', 'はい。$\\psi_{00}\\psi_{11} \\ne \\psi_{01}\\psi_{10}$ なので $C > 0$ です。']], v: prod ? 0 : 1, fixed: true },
        hint: ['Arrange the amplitudes in a $2\\times2$ matrix and check its determinant.', '振幅を $2\\times2$ 行列に並べ、行列式を調べてください。'],
        sol: [[`$\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10} \\propto ${v[0]}\\cdot${v[3]} - (${v[1]})(${v[2]}) = ${det}$.`, `$\\psi_{00}\\psi_{11} - \\psi_{01}\\psi_{10} \\propto ${v[0]}\\cdot${v[3]} - (${v[1]})(${v[2]}) = ${det}$ です。`], [prod ? 'Zero, so the matrix has rank one and the state is $(a|0\\rangle + b|1\\rangle)\\otimes(c|0\\rangle + d|1\\rangle)$: no entanglement, despite having several terms.' : 'Nonzero, so no product $(a|0\\rangle + b|1\\rangle)\\otimes(c|0\\rangle + d|1\\rangle)$ can produce it: the qubits are entangled.', prod ? '0 なので行列の階数は 1 で、状態は $(a|0\\rangle + b|1\\rangle)\\otimes(c|0\\rangle + d|1\\rangle)$ と書けます。項がいくつあってももつれはありません。' : '0 でないので、どんな積 $(a|0\\rangle + b|1\\rangle)\\otimes(c|0\\rangle + d|1\\rangle)$ でも作れません。二つの量子ビットはもつれています。']],
      };
    },
  ];
})();
