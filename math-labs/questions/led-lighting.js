'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const LMW = ['lm/W', 'lm/W（ルーメン毎ワット）'], V = ['V', 'V（ボルト）'], PCT = ['%', '%（パーセント）'], DEG = ['°C', '°C（セルシウス度）'], H = ['h', '時間'];

  Q['led-efficacy'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) { const lm = r.pick([470, 806, 1055, 1521]), w = r.pick([4, 5, 6, 7, 8, 9, 10, 12, 13]); return {
        q: [`An LED bulb gives $${lm}$ lumens and draws $${w}$ W. What is its efficacy, in lumens per watt?`, `ある LED 電球は $${lm}$ ルーメンの光を出し、$${w}$ W を消費します。効率は 1 W あたり何ルーメンですか。`],
        a: { type: 'num', v: lm / w, rel: 0.01, unit: LMW }, hint: ['Divide light by power.', '光を電力で割ります。'],
        sol: [[`$${lm}/${w}$.`, `$${lm}/${w}$ を計算します。`], [`$${n(lm / w, 0)}$ lm/W; a filament bulb of the same light output would need about $${n(lm / 15, 0)}$ W.`, `$${n(lm / w, 0)}$ lm/W です。同じ明るさのフィラメント電球なら、約 $${n(lm / 15, 0)}$ W が必要です。`]],
      }; }
      const lam = r.pick([405, 450, 460, 525, 590, 630, 660]), e = 1239.84 / lam;
      return {
        q: [`What is the energy, in electron-volts, of a photon of wavelength $${lam}$ nm? Use $E = 1240\\ \\mathrm{eV\\,nm}/\\lambda$.`, `波長 $${lam}$ nm の光子のエネルギーは何電子ボルトですか。$E = 1240\\ \\mathrm{eV\\,nm}/\\lambda$ を使ってください。`],
        a: { type: 'num', v: e, rel: 0.01, unit: ['eV', 'eV（電子ボルト）'] }, hint: ['Shorter wavelength, more energy.', '波長が短いほどエネルギーは大きくなります。'],
        sol: [[`$1240/${lam}$.`, `$1240/${lam}$ を計算します。`], [`$${n(e, 2)}$ eV, so an LED of this colour needs a forward voltage of at least about $${n(e, 1)}$ V.`, `$${n(e, 2)}$ eV です。この色の LED には、少なくとも約 $${n(e, 1)}$ V の順方向電圧が必要です。`]],
      };
    },
    (r) => {
      const q = r.pick([0.03, 0.04, 0.05, 0.0556, 0.08, 0.1]), x = r.pick([0.2, 0.5, 2, 3, 4, 5, 8]), eta = 1 / (1 + q * (x + 1 / x));
      return {
        q: [`In the ABC model $\\eta = 1/[1 + q(x + 1/x)]$ with $q = ${n(q, 4)}$, where $x$ is the carrier density divided by its value at peak efficiency. What is $\\eta$, as a percentage, at $x = ${n(x, 1)}$?`, `ABC モデル $\\eta = 1/[1 + q(x + 1/x)]$ で $q = ${n(q, 4)}$ とします。$x$ は、キャリア密度を効率が最大になるときの値で割ったものです。$x = ${n(x, 1)}$ での $\\eta$ は何パーセントですか。`],
        a: { type: 'num', v: 100 * eta, rel: 0.01, unit: PCT }, hint: ['Compute $x + 1/x$ first.', 'まず $x + 1/x$ を計算します。'],
        sol: [[`$x + 1/x = ${n(x + 1 / x, 3)}$, so the denominator is $1 + ${n(q, 4)}\\times${n(x + 1 / x, 3)} = ${n(1 + q * (x + 1 / x), 4)}$.`, `$x + 1/x = ${n(x + 1 / x, 3)}$ なので、分母は $1 + ${n(q, 4)}\\times${n(x + 1 / x, 3)} = ${n(1 + q * (x + 1 / x), 4)}$ です。`], [`$\\eta = ${n(100 * eta, 1)}$ %, against a peak of $${n(100 / (1 + 2 * q), 1)}$ % at $x = 1$.`, `$\\eta = ${n(100 * eta, 1)}$ % です。$x = 1$ での最大値は $${n(100 / (1 + 2 * q), 1)}$ % です。`]],
      };
    },
    (r) => {
      const iq = r.pick([0.8, 0.85, 0.9]), ex = r.pick([0.8, 0.85, 0.9]), vf = r.step(2.8, 3.3, 0.05), conv = r.pick([0.68, 0.72, 0.76]), ler = r.pick([300, 310, 320, 330]), eff = (iq * ex * 2.743 / vf) * conv * ler;
      return {
        q: [`A white LED has an internal quantum efficiency of $${n(iq * 100, 0)}$ %, an extraction efficiency of $${n(ex * 100, 0)}$ %, blue photons of $2.743$ eV and a forward voltage of $${n(vf, 2)}$ V. Its phosphor keeps $${n(conv * 100, 0)}$ % of the blue power as light worth $${ler}$ lm per watt of light. What is the efficacy in lm/W?`, `ある白色 LED は、内部量子効率が $${n(iq * 100, 0)}$ %、光取り出し効率が $${n(ex * 100, 0)}$ %、青い光子が $2.743$ eV、順方向電圧が $${n(vf, 2)}$ V です。蛍光体は青のパワーの $${n(conv * 100, 0)}$ % を、光 1 W あたり $${ler}$ lm の光として残します。効率は何 lm/W ですか。`],
        a: { type: 'num', v: eff, rel: 0.02, unit: LMW }, hint: ['Multiply the chain; the voltage step is the ratio of photon energy to $eV$.', '各段階を掛け合わせます。電圧の段階は、光子のエネルギーと $eV$ の比です。'],
        sol: [[`Blue light per electrical watt: $${n(iq, 2)}\\times${n(ex, 2)}\\times2.743/${n(vf, 2)} = ${n((iq * ex * 2.743) / vf, 3)}$.`, `電力 1 W あたりの青い光は $${n(iq, 2)}\\times${n(ex, 2)}\\times2.743/${n(vf, 2)} = ${n((iq * ex * 2.743) / vf, 3)}$ です。`], [`Times $${n(conv, 2)}\\times${ler}$: $${n(eff, 0)}$ lm/W.`, `これに $${n(conv, 2)}\\times${ler}$ を掛けて $${n(eff, 0)}$ lm/W です。`]],
      };
    },
  ];

  Q['led-driver'] = [
    (r) => {
      const v = r.pick([100, 110, 120, 220, 230, 240]), f = r.pick([50, 60]), form = r.int(0, 1);
      return form === 0 ? {
        q: [`What is the peak voltage of a $${v}$ V (rms) mains supply?`, `実効値 $${v}$ V の電源の最大電圧は何ボルトですか。`],
        a: { type: 'num', v: v * Math.SQRT2, rel: 0.01, unit: V }, hint: ['Peak is $\\sqrt2$ times rms for a sine wave.', '正弦波では、最大値は実効値の $\\sqrt2$ 倍です。'],
        sol: [[`$${v}\\times\\sqrt2$.`, `$${v}\\times\\sqrt2$ を計算します。`], [`$${n(v * Math.SQRT2, 0)}$ V: the voltage a capacitor after the rectifier charges to.`, `$${n(v * Math.SQRT2, 0)}$ V です。整流器の後ろのコンデンサーは、この電圧まで充電されます。`]], set: { mains: v > 150 ? 0 : 1 },
      } : {
        q: [`After full-wave rectification of $${f}$ Hz mains, how long is it between one voltage peak and the next, in milliseconds?`, `$${f}$ Hz の電源を全波整流した後、電圧の山から次の山までは何ミリ秒ですか。`],
        a: { type: 'num', v: 500 / f, rel: 0.01, unit: ['ms', 'ms（ミリ秒）'] }, hint: ['Rectifying doubles the frequency.', '整流すると周波数は 2 倍になります。'],
        sol: [[`Peaks come at $${2 * f}$ Hz.`, `山は $${2 * f}$ Hz で来ます。`], [`$1000/${2 * f} = ${n(500 / f, 2)}$ ms, the time the capacitor must carry the lamp alone.`, `$1000/${2 * f} = ${n(500 / f, 2)}$ ms です。この間、コンデンサーだけでランプを点灯させなければなりません。`]], set: { mains: f === 50 ? 0 : 1 },
      };
    },
    (r) => {
      const Pw = r.step(4, 14, 1), C = r.pick([2.2, 3.3, 4.7, 6.8, 10, 15, 22]), m = r.int(0, 1), v = [230, 120][m], f = [50, 60][m], vpk = v * Math.SQRT2, dv = Pw / (2 * f * C * 1e-6 * vpk);
      return {
        q: [`A $${Pw}$ W lamp on $${v}$ V, $${f}$ Hz mains has a $${n(C, 1)}$ µF storage capacitor. Estimate the ripple with $\\Delta V \\approx P/(2fCV)$, taking $V$ as the peak voltage.`, `$${v}$ V、$${f}$ Hz の電源で使う $${Pw}$ W のランプに、$${n(C, 1)}$ µF の平滑コンデンサーがあります。$V$ を最大電圧として、$\\Delta V \\approx P/(2fCV)$ でリップルを見積もってください。`],
        a: { type: 'num', v: dv, rel: 0.03, unit: V }, hint: ['The lamp draws $P/V$ amperes for a time $1/(2f)$.', 'ランプは $1/(2f)$ の間、$P/V$ アンペアを引き込みます。'],
        sol: [[`$V = ${n(vpk, 0)}$ V, so the current is $${Pw}/${n(vpk, 0)} = ${n((Pw / vpk) * 1000, 1)}$ mA for $${n(500 / f, 1)}$ ms: a charge of $${n((Pw / vpk) * (500 / f), 1)}$ µC.`, `$V = ${n(vpk, 0)}$ V なので、電流は $${Pw}/${n(vpk, 0)} = ${n((Pw / vpk) * 1000, 1)}$ mA で、これが $${n(500 / f, 1)}$ ms 流れます。電荷は $${n((Pw / vpk) * (500 / f), 1)}$ µC です。`], [`$\\Delta V = Q/C = ${n(dv, 1)}$ V, or $${n((100 * dv) / vpk, 0)}$ % of the peak. (The estimate is a little high, because the capacitor is recharging for part of that time.)`, `$\\Delta V = Q/C = ${n(dv, 1)}$ V で、最大電圧の $${n((100 * dv) / vpk, 0)}$ % です。（その間の一部ではコンデンサーが充電されているので、この見積もりはやや大きめです。）`]], set: { mains: m, p: Pw, c: Math.round(C * 2) / 2 },
      };
    },
    (r) => {
      const Pw = r.step(5, 15, 1), v = r.pick([120, 230]), ir = r.step(Math.ceil((Pw / v) * 1000 * 1.2 / 5) * 5, Math.ceil((Pw / v) * 1000 * 2.6 / 5) * 5, 5), pf = Pw / (v * ir / 1000), form = r.int(0, 1), hi = r.step(1.05, 1.6, 0.05), lo = r.step(0.3, 0.95, 0.05);
      return form === 0 ? {
        q: [`A lamp takes $${Pw}$ W from a $${v}$ V supply while drawing $${ir}$ mA (rms). What is its power factor?`, `あるランプは、$${v}$ V の電源から $${Pw}$ W を取り出し、実効値で $${ir}$ mA を引き込みます。力率はいくつですか。`],
        a: { type: 'num', v: pf, rel: 0.02 }, hint: ['Power factor is real power over $V_{\\rm rms}I_{\\rm rms}$.', '力率は、有効電力を $V_{\\rm rms}I_{\\rm rms}$ で割ったものです。'],
        sol: [[`$V_{\\rm rms}I_{\\rm rms} = ${v}\\times${n(ir / 1000, 3)} = ${n((v * ir) / 1000, 2)}$ VA.`, `$V_{\\rm rms}I_{\\rm rms} = ${v}\\times${n(ir / 1000, 3)} = ${n((v * ir) / 1000, 2)}$ VA です。`], [`Power factor $= ${Pw}/${n((v * ir) / 1000, 2)} = ${n(pf, 2)}$: the wiring carries $${n(1 / pf, 2)}$ times the current the power alone would need.`, `力率は $${Pw}/${n((v * ir) / 1000, 2)} = ${n(pf, 2)}$ です。配線には、電力だけで決まる電流の $${n(1 / pf, 2)}$ 倍の電流が流れます。`]],
      } : {
        q: [`The light from a lamp swings between $${n(lo, 2)}$ and $${n(hi, 2)}$ of its rated value. What is the flicker, as a percentage?`, `あるランプの光は、定格の $${n(lo, 2)}$ 倍から $${n(hi, 2)}$ 倍の間で変動します。ちらつきは何パーセントですか。`],
        a: { type: 'num', v: (100 * (hi - lo)) / (hi + lo), rel: 0.02, unit: PCT }, hint: ['$(L_{\\max}-L_{\\min})/(L_{\\max}+L_{\\min})$.', '$(L_{\\max}-L_{\\min})/(L_{\\max}+L_{\\min})$ です。'],
        sol: [[`$(${n(hi, 2)}-${n(lo, 2)})/(${n(hi, 2)}+${n(lo, 2)}) = ${n(hi - lo, 2)}/${n(hi + lo, 2)}$.`, `$(${n(hi, 2)}-${n(lo, 2)})/(${n(hi, 2)}+${n(lo, 2)}) = ${n(hi - lo, 2)}/${n(hi + lo, 2)}$ です。`], [`$${n((100 * (hi - lo)) / (hi + lo), 0)}$ %.`, `$${n((100 * (hi - lo)) / (hi + lo), 0)}$ % です。`]],
      };
    },
  ];

  Q['led-bulb-thermal'] = [
    (r) => {
      const Pw = r.step(4, 15, 1), R = r.step(6, 24, 1), Ta = r.pick([20, 25, 30, 40, 50]), heat = 0.65 * Pw, ts = Ta + heat * R;
      return {
        q: [`A $${Pw}$ W LED bulb turns $65$ % of its power into heat and its body has a thermal resistance of $${R}$ K/W to the air at $${Ta}$ °C. What temperature does the body reach?`, `$${Pw}$ W の LED 電球は、電力の $65$ % を熱に変えます。本体から $${Ta}$ °C の空気までの熱抵抗は $${R}$ K/W です。本体は何 °C になりますか。`],
        a: { type: 'num', v: ts, abs: 0.6, unit: DEG }, hint: ['Temperature rise is heat flow times thermal resistance.', '温度上昇は、熱の流れ掛ける熱抵抗です。'],
        sol: [[`Heat: $0.65\\times${Pw} = ${n(heat, 2)}$ W; rise: $${n(heat, 2)}\\times${R} = ${n(heat * R, 1)}$ K.`, `熱は $0.65\\times${Pw} = ${n(heat, 2)}$ W、温度上昇は $${n(heat, 2)}\\times${R} = ${n(heat * R, 1)}$ K です。`], [`$${Ta} + ${n(heat * R, 1)} = ${n(ts, 0)}$ °C.`, `$${Ta} + ${n(heat * R, 1)} = ${n(ts, 0)}$ °C です。`]], set: { p: Pw, r: R, ta: Ta },
      };
    },
    (r) => {
      const heat = r.step(3, 9, 0.5), Rs = r.step(8, 20, 1), Rb = r.pick([0.8, 1, 1.5]), Rc = r.pick([0.5, 0.8, 1.2]), Ta = r.pick([25, 35, 45]), tj = Ta + heat * (Rs + Rb + Rc);
      return {
        q: [`$${n(heat, 1)}$ W of heat flows from an LED junction through $${n(Rc, 1)}$ K/W (chip to board), $${n(Rb, 1)}$ K/W (board to heat sink) and $${Rs}$ K/W (heat sink to air at $${Ta}$ °C). What is the junction temperature?`, `$${n(heat, 1)}$ W の熱が、LED の接合部から $${n(Rc, 1)}$ K/W（チップから基板）、$${n(Rb, 1)}$ K/W（基板からヒートシンク）、$${Rs}$ K/W（ヒートシンクから $${Ta}$ °C の空気）を通って流れます。接合部の温度は何 °C ですか。`],
        a: { type: 'num', v: tj, abs: 0.6, unit: DEG }, hint: ['Thermal resistances in series add.', '直列の熱抵抗は足し合わせます。'],
        sol: [[`Total: $${n(Rc, 1)}+${n(Rb, 1)}+${Rs} = ${n(Rs + Rb + Rc, 1)}$ K/W.`, `合計は $${n(Rc, 1)}+${n(Rb, 1)}+${Rs} = ${n(Rs + Rb + Rc, 1)}$ K/W です。`], [`$T_j = ${Ta} + ${n(heat, 1)}\\times${n(Rs + Rb + Rc, 1)} = ${n(tj, 0)}$ °C; the heat sink to air step alone accounts for $${n(heat * Rs, 0)}$ K.`, `$T_j = ${Ta} + ${n(heat, 1)}\\times${n(Rs + Rb + Rc, 1)} = ${n(tj, 0)}$ °C です。ヒートシンクから空気への段階だけで $${n(heat * Rs, 0)}$ K を占めます。`]],
      };
    },
    (r) => {
      const L0 = r.pick([2000, 3000, 5000, 8000, 10000]), T0 = r.pick([85, 105]), Tc = T0 - r.pick([5, 12, 15, 18, 22, 25, 30, 35]), life = L0 * 2 ** ((T0 - Tc) / 10);
      return {
        q: [`An electrolytic capacitor is rated for $${L0}$ hours at $${T0}$ °C, and its life doubles for every $10$ K cooler. How long does it last at $${Tc}$ °C?`, `ある電解コンデンサーの定格寿命は $${T0}$ °C で $${L0}$ 時間で、温度が $10$ K 下がるごとに寿命は 2 倍になります。$${Tc}$ °C では何時間もちますか。`],
        a: { type: 'num', v: life, rel: 0.02, unit: H }, hint: ['$L = L_0\\,2^{(T_0-T)/10}$.', '$L = L_0\\,2^{(T_0-T)/10}$ です。'],
        sol: [[`$(T_0 - T)/10 = ${n((T0 - Tc) / 10, 1)}$, so the factor is $2^{${n((T0 - Tc) / 10, 1)}} = ${n(2 ** ((T0 - Tc) / 10), 2)}$.`, `$(T_0 - T)/10 = ${n((T0 - Tc) / 10, 1)}$ なので、倍率は $2^{${n((T0 - Tc) / 10, 1)}} = ${n(2 ** ((T0 - Tc) / 10), 2)}$ です。`], [`$L = ${L0}\\times${n(2 ** ((T0 - Tc) / 10), 2)} = ${n(Math.round(life / 10) * 10, 0)}$ hours, about $${n(life / 1095, 1)}$ years at three hours a day.`, `$L = ${L0}\\times${n(2 ** ((T0 - Tc) / 10), 2)} = ${n(Math.round(life / 10) * 10, 0)}$ 時間で、1 日 3 時間なら約 $${n(life / 1095, 1)}$ 年です。`]],
      };
    },
  ];
})();
