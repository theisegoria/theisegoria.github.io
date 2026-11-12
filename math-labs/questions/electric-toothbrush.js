'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const DEG = ['°', '度'], MS = ['m/s', 'm/s'], PCT = ['%', '%（パーセント）'], WU = ['W', 'W（ワット）'];

  Q['brush-resonance'] = [
    (r) => {
      const f = r.pick([200, 220, 240, 250, 260, 280, 300, 320]), form = r.int(0, 1), th = r.step(3, 8, 0.5), rt = r.pick([9, 10, 11, 12]);
      return form === 0 ? {
        q: [`A brush head swings back and forth at $${f}$ Hz. Counting each swing in either direction as one stroke, how many strokes does it make in a minute?`, `ブラシヘッドが $${f}$ Hz で往復します。どちら向きの動きも 1 ストロークと数えると、1 分間に何ストロークしますか。`],
        a: { type: 'num', v: 2 * f * 60, rel: 0.005 }, hint: ['Two strokes per cycle.', '1 周期に 2 ストロークです。'],
        sol: [[`$2\\times${f} = ${2 * f}$ strokes a second.`, `毎秒 $2\\times${f} = ${2 * f}$ ストロークです。`], [`$${2 * f}\\times60 = ${2 * f * 60}$ a minute.`, `1 分間では $${2 * f}\\times60 = ${2 * f * 60}$ ストロークです。`]], set: { f },
      } : {
        q: [`A brush head swings $${n(th, 1)}^\\circ$ each way about its shaft. How far does a bristle tip $${rt}$ mm from the axis sweep from one extreme to the other, in millimetres?`, `ブラシヘッドが、軸の周りに片側 $${n(th, 1)}^\\circ$ ずつ振れます。軸から $${rt}$ mm の毛先は、端から端まで何ミリメートル動きますか。`],
        a: { type: 'num', v: 2 * rt * (th * Math.PI / 180), rel: 0.02, unit: ['mm', 'mm（ミリメートル）'] }, hint: ['Arc length is radius times angle in radians; the full sweep is twice the amplitude.', '弧の長さは、半径掛けるラジアンで表した角度です。端から端までは振幅の 2 倍です。'],
        sol: [[`$${n(th, 1)}^\\circ = ${n(th * Math.PI / 180, 4)}$ rad.`, `$${n(th, 1)}^\\circ = ${n(th * Math.PI / 180, 4)}$ rad です。`], [`$2\\times${rt}\\times${n(th * Math.PI / 180, 4)} = ${n(2 * rt * (th * Math.PI / 180), 2)}$ mm.`, `$2\\times${rt}\\times${n(th * Math.PI / 180, 4)} = ${n(2 * rt * (th * Math.PI / 180), 2)}$ mm です。`]],
      };
    },
    (r) => {
      const Qf = r.pick([6, 8, 10, 12, 15, 20]), st = r.step(0.2, 1, 0.1), f = r.pick([230, 260, 290]), rt = r.pick([10, 11, 12]), th = Qf * st, v = 2 * Math.PI * f * (rt / 1000) * (th * Math.PI / 180);
      return {
        q: [`A torque that would twist a brush head $${n(st, 1)}^\\circ$ if applied slowly is applied at the head's natural frequency of $${f}$ Hz. The quality factor is $${Qf}$. What is the top speed of a bristle tip $${rt}$ mm from the axis?`, `ゆっくり加えればブラシヘッドを $${n(st, 1)}^\\circ$ ねじるトルクを、ヘッドの固有振動数 $${f}$ Hz で加えます。品質係数は $${Qf}$ です。軸から $${rt}$ mm の毛先の最大の速さは何 m/s ですか。`],
        a: { type: 'num', v, rel: 0.02, unit: MS }, hint: ['At resonance the swing is $Q$ times the slow deflection; then $v = 2\\pi f\\,r\\,\\theta_0$.', '共振では、振れはゆっくり加えたときの $Q$ 倍です。その後 $v = 2\\pi f\\,r\\,\\theta_0$ を使います。'],
        sol: [[`$\\theta_0 = ${Qf}\\times${n(st, 1)}^\\circ = ${n(th, 1)}^\\circ = ${n(th * Math.PI / 180, 4)}$ rad.`, `$\\theta_0 = ${Qf}\\times${n(st, 1)}^\\circ = ${n(th, 1)}^\\circ = ${n(th * Math.PI / 180, 4)}$ rad です。`], [`$v = 2\\pi\\times${f}\\times${n(rt / 1000, 3)}\\times${n(th * Math.PI / 180, 4)} = ${n(v, 2)}$ m/s.`, `$v = 2\\pi\\times${f}\\times${n(rt / 1000, 3)}\\times${n(th * Math.PI / 180, 4)} = ${n(v, 2)}$ m/s です。`]],
      };
    },
    (r) => {
      const f0 = r.pick([240, 250, 260, 270]), Qf = r.pick([6, 8, 10, 12, 15]), df = r.pick([-30, -20, -10, 10, 20, 30]), f = f0 + df, ratio = (f0 * f0 / Qf) / Math.sqrt((f0 * f0 - f * f) ** 2 + ((f * f0) / Qf) ** 2);
      return {
        q: [`A brush with natural frequency $${f0}$ Hz and quality factor $${Qf}$ is driven at $${f}$ Hz instead. What percentage of its on-resonance swing does it reach? Use $\\theta_0 \\propto 1/\\sqrt{(f_0^2-f^2)^2+(ff_0/Q)^2}$.`, `固有振動数 $${f0}$ Hz、品質係数 $${Qf}$ のブラシを、$${f}$ Hz で駆動します。共振のときの振れの何パーセントに達しますか。$\\theta_0 \\propto 1/\\sqrt{(f_0^2-f^2)^2+(ff_0/Q)^2}$ を使ってください。`],
        a: { type: 'num', v: 100 * ratio, rel: 0.02, unit: PCT }, hint: ['On resonance the denominator is $f_0^2/Q$.', '共振のとき、分母は $f_0^2/Q$ です。'],
        sol: [[`$f_0^2 - f^2 = ${f0 * f0 - f * f}$ and $ff_0/Q = ${n((f * f0) / Qf, 0)}$, so the denominator is $${n(Math.sqrt((f0 * f0 - f * f) ** 2 + ((f * f0) / Qf) ** 2), 0)}$.`, `$f_0^2 - f^2 = ${f0 * f0 - f * f}$、$ff_0/Q = ${n((f * f0) / Qf, 0)}$ なので、分母は $${n(Math.sqrt((f0 * f0 - f * f) ** 2 + ((f * f0) / Qf) ** 2), 0)}$ です。`], [`On resonance it is $${n(f0 * f0 / Qf, 0)}$; the ratio is $${n(100 * ratio, 0)}$ %.`, `共振のときは $${n(f0 * f0 / Qf, 0)}$ なので、比は $${n(100 * ratio, 0)}$ % です。`]], set: { f: Math.max(120, Math.min(420, f)) },
      };
    },
  ];

  Q['induction-charging'] = [
    (r) => {
      const eta = r.step(20, 85, 5), pb = r.step(0.5, 3, 0.25);
      return {
        q: [`A wireless charger is $${eta}$ % efficient and delivers $${n(pb, 2)}$ W to the battery. How much power is lost as heat?`, `あるワイヤレス充電器の効率は $${eta}$ % で、電池に $${n(pb, 2)}$ W を届けます。熱として失われる電力は何ワットですか。`],
        a: { type: 'num', v: pb / (eta / 100) - pb, rel: 0.02, unit: WU }, hint: ['Find the input power first.', 'まず入力電力を求めます。'],
        sol: [[`Input: $${n(pb, 2)}/${n(eta / 100, 2)} = ${n(pb / (eta / 100), 2)}$ W.`, `入力は $${n(pb, 2)}/${n(eta / 100, 2)} = ${n(pb / (eta / 100), 2)}$ W です。`], [`Lost: $${n(pb / (eta / 100) - pb, 2)}$ W.`, `失われるのは $${n(pb / (eta / 100) - pb, 2)}$ W です。`]], set: { pb: Math.round(pb * 10) / 10 },
      };
    },
    (r) => {
      const k = r.step(0.1, 0.6, 0.05), Q1 = r.pick([5, 8, 10, 15, 20, 30]), Q2 = r.pick([5, 8, 10, 15, 20]), x = k * k * Q1 * Q2, eta = x / (1 + Math.sqrt(1 + x)) ** 2;
      return {
        q: [`Two coils have coupling $k = ${n(k, 2)}$ and quality factors $${Q1}$ and $${Q2}$. What is the best possible efficiency, as a percentage? Use $\\eta = x/(1+\\sqrt{1+x})^2$ with $x = k^2Q_1Q_2$.`, `二つのコイルの結合が $k = ${n(k, 2)}$、品質係数が $${Q1}$ と $${Q2}$ です。到達できる最高の効率は何パーセントですか。$x = k^2Q_1Q_2$ として $\\eta = x/(1+\\sqrt{1+x})^2$ を使ってください。`],
        a: { type: 'num', v: 100 * eta, rel: 0.02, unit: PCT }, hint: ['Compute $x$ first.', 'まず $x$ を計算します。'],
        sol: [[`$x = ${n(k * k, 4)}\\times${Q1}\\times${Q2} = ${n(x, 2)}$.`, `$x = ${n(k * k, 4)}\\times${Q1}\\times${Q2} = ${n(x, 2)}$ です。`], [`$\\sqrt{1+x} = ${n(Math.sqrt(1 + x), 3)}$, so $\\eta = ${n(x, 2)}/${n((1 + Math.sqrt(1 + x)) ** 2, 2)} = ${n(100 * eta, 0)}$ %.`, `$\\sqrt{1+x} = ${n(Math.sqrt(1 + x), 3)}$ なので、$\\eta = ${n(x, 2)}/${n((1 + Math.sqrt(1 + x)) ** 2, 2)} = ${n(100 * eta, 0)}$ % です。`]],
      };
    },
    (r) => {
      const eta = r.pick([0.5, 0.6, 0.7, 0.8, 0.9]), k = r.step(0.1, 0.5, 0.05), u = (1 + eta) / (1 - eta), Qn = Math.sqrt(u * u - 1) / k;
      return {
        q: [`Two identical coils have coupling $k = ${n(k, 2)}$. What quality factor must each have for the best possible efficiency to reach $${n(eta * 100, 0)}$ %? ($\\eta = x/(1+\\sqrt{1+x})^2$, $x = k^2Q^2$.)`, `同じコイル二つの結合が $k = ${n(k, 2)}$ です。最高の効率が $${n(eta * 100, 0)}$ % に達するには、それぞれの品質係数はいくつ必要ですか。（$\\eta = x/(1+\\sqrt{1+x})^2$、$x = k^2Q^2$）`],
        a: { type: 'num', v: Qn, rel: 0.03 }, hint: ['Put $u = \\sqrt{1+x}$; then $\\eta = (u-1)/(u+1)$.', '$u = \\sqrt{1+x}$ と置くと、$\\eta = (u-1)/(u+1)$ です。'],
        sol: [[`$x = u^2 - 1 = (u-1)(u+1)$, so $\\eta = (u-1)/(u+1)$ and $u = (1+\\eta)/(1-\\eta) = ${n((1 + eta) / (1 - eta), 3)}$.`, `$x = u^2 - 1 = (u-1)(u+1)$ なので $\\eta = (u-1)/(u+1)$、$u = (1+\\eta)/(1-\\eta) = ${n((1 + eta) / (1 - eta), 3)}$ です。`], [`$x = u^2 - 1 = ${n(((1 + eta) / (1 - eta)) ** 2 - 1, 2)}$ and $Q = \\sqrt{x}/k = ${n(Math.sqrt(((1 + eta) / (1 - eta)) ** 2 - 1) / k, 1)}$.`, `$x = u^2 - 1 = ${n(((1 + eta) / (1 - eta)) ** 2 - 1, 2)}$、$Q = \\sqrt{x}/k = ${n(Math.sqrt(((1 + eta) / (1 - eta)) ** 2 - 1) / k, 1)}$ です。`]],
      };
    },
  ];
  Q['toothbrush-cutaway'] = [
    (r) => {
      const spm = r.pick([200, 300, 400, 4000, 7600, 8800, 24000, 31000, 40000]), len = spm < 1000 ? r.pick([10, 15, 20, 25]) : spm < 10000 ? r.step(4, 7, 0.5) : r.step(1, 3, 0.25), v = (spm / 60) * len / 1000;
      return {
        q: [`Bristles make $${spm}$ strokes a minute, each $${n(len, 2)}$ mm long. What is their average speed over the tooth, in m/s?`, `毛が毎分 $${spm}$ ストローク、1 ストローク $${n(len, 2)}$ mm で動きます。歯の上での平均の速さは何 m/s ですか。`],
        a: { type: 'num', v, rel: 0.02, unit: MS }, hint: ['Strokes per second times stroke length.', '毎秒のストローク数にストロークの長さを掛けます。'],
        sol: [[`$${spm}/60 = ${n(spm / 60, 1)}$ strokes a second.`, `毎秒 $${spm}/60 = ${n(spm / 60, 1)}$ ストロークです。`], [`$${n(spm / 60, 1)}\\times${n(len, 2)}$ mm $= ${n(v, 3)}$ m/s.`, `$${n(spm / 60, 1)}\\times${n(len, 2)}$ mm $= ${n(v, 3)}$ m/s です。`]],
      };
    },
    (r) => {
      const mah = r.pick([500, 700, 800, 1000, 2000]), vv = 3.7, pw = r.step(1, 3, 0.25), mins = r.pick([2, 3]), ses = (mah / 1000 * vv) / (pw * mins / 60);
      return {
        q: [`A toothbrush has a $${mah}$ mAh lithium-ion cell at $3.7$ V and uses $${n(pw, 2)}$ W while running. How many $${mins}$-minute sessions does one charge give?`, `ある歯ブラシは、$3.7$ V、$${mah}$ mAh のリチウムイオンセルをもち、動作中に $${n(pw, 2)}$ W を使います。1 回の充電で、$${mins}$ 分間の使用が何回できますか。`],
        a: { type: 'num', v: ses, rel: 0.03 }, hint: ['Energy in watt-hours is ampere-hours times volts.', 'ワット時で表したエネルギーは、アンペア時掛けるボルトです。'],
        sol: [[`Stored: $${n(mah / 1000, 1)}\\times3.7 = ${n(mah / 1000 * vv, 2)}$ Wh. One session: $${n(pw, 2)}\\times${mins}/60 = ${n(pw * mins / 60, 4)}$ Wh.`, `蓄えるエネルギーは $${n(mah / 1000, 1)}\\times3.7 = ${n(mah / 1000 * vv, 2)}$ Wh、1 回の使用は $${n(pw, 2)}\\times${mins}/60 = ${n(pw * mins / 60, 4)}$ Wh です。`], [`$${n(ses, 0)}$ sessions, about $${n(ses / 2, 0)}$ days at twice a day.`, `$${n(ses, 0)}$ 回で、1 日 2 回なら約 $${n(ses / 2, 0)}$ 日分です。`]],
      };
    },
    (r) => {
      const Jv = r.pick([1, 2, 3, 4]), f = r.pick([240, 260, 280]), th = r.step(3, 7, 0.5), Qf = r.pick([6, 8, 10, 12]), w = 2 * Math.PI * f, a = th * Math.PI / 180, Pw = (Jv * 1e-7 * w * w * w * a * a) / (2 * Qf);
      return {
        q: [`A brush head with moment of inertia $${Jv}\\times10^{-7}$ kg m² swings $${n(th, 1)}^\\circ$ each way at its natural frequency of $${f}$ Hz with quality factor $${Qf}$. How much power is needed to keep it going? Use $P = J\\omega^3\\theta_0^2/(2Q)$.`, `慣性モーメント $${Jv}\\times10^{-7}$ kg m² のブラシヘッドが、固有振動数 $${f}$ Hz、品質係数 $${Qf}$ で、片側 $${n(th, 1)}^\\circ$ ずつ振れています。この振動を保つのに必要な電力は何ワットですか。$P = J\\omega^3\\theta_0^2/(2Q)$ を使ってください。`],
        a: { type: 'num', v: Pw, rel: 0.03, unit: WU }, hint: ['$\\omega = 2\\pi f$ and the angle in radians.', '$\\omega = 2\\pi f$ とし、角度はラジアンで表します。'],
        sol: [[`$\\omega = ${n(w, 0)}$ rad/s and $\\theta_0 = ${n(a, 4)}$ rad, so the stored energy is $\\tfrac12J\\omega^2\\theta_0^2 = ${n(0.5 * Jv * 1e-7 * w * w * a * a * 1000, 3)}$ mJ.`, `$\\omega = ${n(w, 0)}$ rad/s、$\\theta_0 = ${n(a, 4)}$ rad なので、蓄えられたエネルギーは $\\tfrac12J\\omega^2\\theta_0^2 = ${n(0.5 * Jv * 1e-7 * w * w * a * a * 1000, 3)}$ mJ です。`], [`A fraction $2\\pi/Q$ of that is lost each cycle: $P = ${n(Pw, 3)}$ W.`, `1 周期ごとにその $2\\pi/Q$ が失われるので、$P = ${n(Pw, 3)}$ W です。`]],
      };
    },
  ];
})();
