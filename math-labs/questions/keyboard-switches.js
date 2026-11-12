'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const CN = ['cN', 'cN（センチニュートン）'], MJ = ['mJ', 'mJ（ミリジュール）'], MS = ['ms', 'ms（ミリ秒）'];

  Q['switch-force-curve'] = [
    (r) => {
      const f0 = r.step(20, 45, 5), k = r.step(5, 15, 0.5), x = r.step(1, 4, 0.5);
      return {
        q: [`A switch spring gives $${f0}$ cN at rest and $${n(k, 1)}$ cN more for each millimetre of travel. What force does it give at $${n(x, 1)}$ mm?`, `あるスイッチのばねは、静止時に $${f0}$ cN、押し下げ 1 mm ごとにさらに $${n(k, 1)}$ cN の力を出します。$${n(x, 1)}$ mm での力は何 cN ですか。`],
        a: { type: 'num', v: f0 + k * x, rel: 0.01, unit: CN }, hint: ['$F = F_0 + kx$.', '$F = F_0 + kx$ です。'],
        sol: [[`$${f0} + ${n(k, 1)}\\times${n(x, 1)}$.`, `$${f0} + ${n(k, 1)}\\times${n(x, 1)}$ を計算します。`], [`$${n(f0 + k * x, 1)}$ cN, close to the weight of $${n(f0 + k * x, 0)}$ grams.`, `$${n(f0 + k * x, 1)}$ cN で、$${n(f0 + k * x, 0)}$ グラムの重さにほぼ等しい力です。`]],
      };
    },
    (r) => {
      const f0 = r.step(25, 45, 5), k = r.step(5, 12, 0.5), fr = r.pick([2, 3, 4]), W = 0.01 * ((f0 + fr) * 4 + k * 8), form = r.int(0, 1);
      return form === 0 ? {
        q: [`A linear switch has a spring force of $${f0} + ${n(k, 1)}x$ cN ($x$ in mm) and $${fr}$ cN of friction. How much work, in millijoules, does a full press of $4$ mm take? ($1$ cN mm $= 0.01$ mJ.)`, `あるリニアスイッチのばねの力は $${f0} + ${n(k, 1)}x$ cN（$x$ は mm）、摩擦は $${fr}$ cN です。$4$ mm の底まで押すのに、何ミリジュールの仕事が必要ですか。（$1$ cN mm $= 0.01$ mJ）`],
        a: { type: 'num', v: W, rel: 0.02, unit: MJ }, hint: ['Area under a straight line: mean force times distance.', '直線の下の面積は、平均の力掛ける距離です。'],
        sol: [[`Force runs from $${f0 + fr}$ to $${n(f0 + fr + 4 * k, 1)}$ cN, mean $${n(f0 + fr + 2 * k, 1)}$ cN.`, `力は $${f0 + fr}$ cN から $${n(f0 + fr + 4 * k, 1)}$ cN まで変わり、平均は $${n(f0 + fr + 2 * k, 1)}$ cN です。`], [`$${n(f0 + fr + 2 * k, 1)}\\times4 = ${n(W * 100, 0)}$ cN mm $= ${n(W, 2)}$ mJ.`, `$${n(f0 + fr + 2 * k, 1)}\\times4 = ${n(W * 100, 0)}$ cN mm $= ${n(W, 2)}$ mJ です。`]],
      } : {
        q: [`A switch has $${fr}$ cN of friction, which opposes motion both on the way down and on the way up over $4$ mm of travel. How much energy is lost to friction in one full keystroke, in millijoules?`, `あるスイッチの摩擦は $${fr}$ cN で、$4$ mm の押し下げと戻りの両方で動きに逆らいます。底まで押して戻す 1 回の打鍵で、摩擦によって失われるエネルギーは何ミリジュールですか。`],
        a: { type: 'num', v: 0.01 * 2 * fr * 4, rel: 0.02, unit: MJ }, hint: ['The friction force acts over $8$ mm in all.', '摩擦力は、合わせて $8$ mm にわたって働きます。'],
        sol: [[`$2\\times${fr}\\times4 = ${8 * fr}$ cN mm.`, `$2\\times${fr}\\times4 = ${8 * fr}$ cN mm です。`], [`$${n(0.08 * fr, 2)}$ mJ: the area between the press and release curves.`, `$${n(0.08 * fr, 2)}$ mJ です。押すときと戻るときの曲線の間の面積に当たります。`]],
      };
    },
    (r) => {
      const fa = r.step(35, 80, 5), xa = r.pick([1.2, 1.5, 2.0]), f0 = (fa / 45) * 30, k = (fa / 45) * 7.5, Wact = 0.01 * (f0 * xa + 0.5 * k * xa * xa), Wfull = 0.01 * (f0 * 4 + 8 * k);
      return {
        q: [`A switch spring gives $${n(f0, 1)} + ${n(k, 2)}x$ cN and the contacts close at $${n(xa, 1)}$ mm. Ignoring friction, what fraction of the work of a full $4$ mm press is spent by the time the key registers? Give a percentage.`, `あるスイッチのばねの力は $${n(f0, 1)} + ${n(k, 2)}x$ cN で、接点は $${n(xa, 1)}$ mm で閉じます。摩擦を無視すると、キーが入力された時点までに、$4$ mm の底まで押す仕事の何パーセントが使われていますか。`],
        a: { type: 'num', v: (100 * Wact) / Wfull, rel: 0.02, unit: ['%', '%（パーセント）'] }, hint: ['Integrate $F_0 + kx$ to each depth.', '$F_0 + kx$ をそれぞれの深さまで積分します。'],
        sol: [[`To $${n(xa, 1)}$ mm: $${n(f0, 1)}\\times${n(xa, 1)} + \\tfrac12\\times${n(k, 2)}\\times${n(xa * xa, 2)} = ${n(Wact * 100, 1)}$ cN mm. To $4$ mm: $${n(Wfull * 100, 1)}$ cN mm.`, `$${n(xa, 1)}$ mm までは $${n(f0, 1)}\\times${n(xa, 1)} + \\tfrac12\\times${n(k, 2)}\\times${n(xa * xa, 2)} = ${n(Wact * 100, 1)}$ cN mm、$4$ mm までは $${n(Wfull * 100, 1)}$ cN mm です。`], [`$${n((100 * Wact) / Wfull, 0)}$ %: stopping at the actuation point saves more than half the effort.`, `$${n((100 * Wact) / Wfull, 0)}$ % です。作動点で止めれば、労力の半分以上を節約できます。`]], set: { type: 0, fa, xa, x: xa },
      };
    },
  ];

  Q['contact-bounce'] = [
    (r) => {
      const hz = r.pick([125, 250, 500, 1000, 2000, 4000, 8000]);
      return {
        q: [`A keyboard scans its keys at $${hz}$ Hz. What is the longest a key press can wait before the next scan sees it, in milliseconds?`, `あるキーボードは $${hz}$ Hz でキーを走査します。キーを押してから次の走査で読まれるまで、最も長くて何ミリ秒待ちますか。`],
        a: { type: 'num', v: 1000 / hz, rel: 0.01, unit: MS }, hint: ['One scan interval.', '走査の間隔 1 回分です。'],
        sol: [[`$1000/${hz}$.`, `$1000/${hz}$ を計算します。`], [`$${n(1000 / hz, 3)}$ ms at worst, half that on average.`, `最も長くて $${n(1000 / hz, 3)}$ ms、平均ではその半分です。`]], set: { scan: [125, 500, 1000, 4000, 8000].indexOf(hz) >= 0 ? [125, 500, 1000, 4000, 8000].indexOf(hz) : 2 },
      };
    },
    (r) => {
      const t0 = r.step(0.4, 2.4, 0.2), e = r.pick([0.4, 0.5, 0.6, 0.7, 0.75, 0.8]), tot = t0 / (1 - e);
      return {
        q: [`A contact's first rebound keeps it open for $${n(t0, 1)}$ ms and each later rebound lasts $${n(e, 2)}$ times the one before. Ignoring the brief contacts in between, how long is it open in total?`, `ある接点は、最初のはね返りで $${n(t0, 1)}$ ms 開き、その後のはね返りはそれぞれ前の $${n(e, 2)}$ 倍の長さです。間の短い接触を無視すると、開いている時間の合計は何ミリ秒ですか。`],
        a: { type: 'num', v: tot, rel: 0.02, unit: MS }, hint: ['A geometric series: $\\tau_0/(1-e)$.', '等比級数です。$\\tau_0/(1-e)$ になります。'],
        sol: [[`$\\tau_0(1 + e + e^2 + \\dots) = \\tau_0/(1-e)$.`, `$\\tau_0(1 + e + e^2 + \\dots) = \\tau_0/(1-e)$ です。`], [`$${n(t0, 1)}/${n(1 - e, 2)} = ${n(tot, 2)}$ ms.`, `$${n(t0, 1)}/${n(1 - e, 2)} = ${n(tot, 2)}$ ms です。`]], set: { t0, e },
      };
    },
    (r) => {
      const t0 = r.step(0.6, 2.4, 0.2), e = r.pick([0.5, 0.6, 0.7, 0.8]), lim = r.pick([0.05, 0.1, 0.2]), nb = Math.ceil(Math.log(lim / t0) / Math.log(e));
      return {
        q: [`Rebounds last $${n(t0, 1)}$ ms, then $${n(e, 1)}$ times as long each time. How many rebounds occur before one is shorter than $${n(lim, 2)}$ ms?`, `はね返りは最初が $${n(t0, 1)}$ ms で、その後は毎回 $${n(e, 1)}$ 倍の長さになります。はね返りが $${n(lim, 2)}$ ms より短くなるまでに、何回のはね返りが起こりますか。`],
        a: { type: 'num', v: nb, abs: 0.5 }, hint: ['Find the smallest $n$ with $\\tau_0e^{\\,n} < $ the limit, using logarithms.', '$\\tau_0e^{\\,n}$ が限界より小さくなる最小の $n$ を、対数を使って求めます。'],
        sol: [[`$e^{\\,n} < ${n(lim, 2)}/${n(t0, 1)} = ${n(lim / t0, 4)}$, so $n > \\ln(${n(lim / t0, 4)})/\\ln(${n(e, 1)}) = ${n(Math.log(lim / t0) / Math.log(e), 2)}$.`, `$e^{\\,n} < ${n(lim, 2)}/${n(t0, 1)} = ${n(lim / t0, 4)}$ なので、$n > \\ln(${n(lim / t0, 4)})/\\ln(${n(e, 1)}) = ${n(Math.log(lim / t0) / Math.log(e), 2)}$ です。`], [`$${nb}$ rebounds (numbered $0$ to $${nb - 1}$) are at least that long.`, `その長さ以上のはね返りは $${nb}$ 回（$0$ 番から $${nb - 1}$ 番）です。`]], set: { t0, e },
      };
    },
  ];

  Q['key-matrix'] = [
    (r) => {
      const rows = r.int(3, 8), cols = r.int(4, 18);
      return {
        q: [`A keyboard matrix has $${rows}$ rows and $${cols}$ columns. How many controller pins does it need, and how many keys can it read? Give the number of keys per pin.`, `あるキーボードのマトリクスは $${rows}$ 行 $${cols}$ 列です。コントローラーの端子は何本必要で、何個のキーを読めますか。端子 1 本あたりのキーの数を答えてください。`],
        a: { type: 'num', v: (rows * cols) / (rows + cols), rel: 0.01 }, hint: ['Pins: rows plus columns. Keys: rows times columns.', '端子は行と列の和、キーは行と列の積です。'],
        sol: [[`$${rows + cols}$ pins read $${rows * cols}$ keys.`, `$${rows + cols}$ 本の端子で $${rows * cols}$ 個のキーを読みます。`], [`$${rows * cols}/${rows + cols} = ${n((rows * cols) / (rows + cols), 2)}$ keys per pin.`, `$${rows * cols}/${rows + cols} = ${n((rows * cols) / (rows + cols), 2)}$ で、端子 1 本あたり $${n((rows * cols) / (rows + cols), 2)}$ 個です。`]],
      };
    },
    (r) => {
      const N = r.pick([16, 36, 61, 68, 87, 104, 108, 120]), rr = Math.ceil(Math.sqrt(N)), pins = rr + Math.ceil(N / rr);
      return {
        q: [`What is the smallest number of pins that can read $${N}$ keys as a matrix of rows and columns?`, `$${N}$ 個のキーを行と列のマトリクスとして読むのに必要な端子は、最も少なくて何本ですか。`],
        a: { type: 'num', v: pins, abs: 0.5 }, hint: ['Make the matrix as square as possible: start from $\\lceil\\sqrt N\\rceil$ rows.', 'マトリクスをできるだけ正方形に近づけます。$\\lceil\\sqrt N\\rceil$ 行から考えます。'],
        sol: [[`$\\sqrt{${N}} = ${n(Math.sqrt(N), 2)}$, so use $${rr}$ rows; then $\\lceil ${N}/${rr}\\rceil = ${Math.ceil(N / rr)}$ columns are enough.`, `$\\sqrt{${N}} = ${n(Math.sqrt(N), 2)}$ なので $${rr}$ 行にします。すると列は $\\lceil ${N}/${rr}\\rceil = ${Math.ceil(N / rr)}$ 本で足ります。`], [`$${rr} + ${Math.ceil(N / rr)} = ${pins}$ pins, against $${N}$ wired singly.`, `$${rr} + ${Math.ceil(N / rr)} = ${pins}$ 本です。1 本ずつ配線すれば $${N}$ 本です。`]],
      };
    },
    (r) => {
      const rows = r.int(3, 6), cols = r.int(4, 8), kr = r.int(2, Math.min(rows, 4)), kc = r.int(2, Math.min(cols, 4)), ghosts = kr * kc - (kr + kc - 1);
      return {
        q: [`In a $${rows}\\times${cols}$ matrix without diodes, $${kr + kc - 1}$ keys are held: all $${kc}$ keys of one row that lie in a block of $${kc}$ columns, and $${kr - 1}$ more keys in one of those columns, each in a different row. How many keys that are not pressed does the controller read as pressed?`, `ダイオードのない $${rows}\\times${cols}$ のマトリクスで、$${kr + kc - 1}$ 個のキーを押しています。ある行のうち $${kc}$ 列分の $${kc}$ 個のキーすべてと、その列のうちの一つにある、それぞれ別の行の $${kr - 1}$ 個のキーです。押されていないのに押されたと読まれるキーは何個ですか。`],
        a: { type: 'num', v: ghosts, abs: 0.5 }, hint: ['Every row touched is joined to every column touched.', '関わるすべての行が、関わるすべての列とつながります。'],
        sol: [[`The pressed keys join $${kr}$ rows and $${kc}$ columns into one connected net, so all $${kr}\\times${kc} = ${kr * kc}$ crossings read as pressed.`, `押されたキーは、$${kr}$ 本の行と $${kc}$ 本の列を一つのつながった網にします。そのため $${kr}\\times${kc} = ${kr * kc}$ 個の交点すべてが押されたと読まれます。`], [`$${kr * kc} - ${kr + kc - 1} = ${ghosts}$ of them are ghosts.`, `そのうち $${kr * kc} - ${kr + kc - 1} = ${ghosts}$ 個がゴーストです。`]],
      };
    },
  ];
})();
