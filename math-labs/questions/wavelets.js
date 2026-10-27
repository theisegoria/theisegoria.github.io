'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const PI = Math.PI, S2 = Math.SQRT2;
  // Morlet with centre frequency w0: the Fourier frequency of scale s is 1/lambda with lambda = 4 pi s / (w0 + sqrt(2 + w0^2))
  const kk = (w0) => w0 + Math.sqrt(2 + w0 * w0);
  const scaleOf = (f, w0) => kk(w0) / (4 * PI * f);
  const freqOf = (s, w0) => kk(w0) / (4 * PI * s);
  // complementary error function by Simpson's rule on [x, x + 12] (accurate to ~1e-12 relative for x in [0, 6])
  function erfc(x) {
    const N = 4000, h = 12 / N; let s = Math.exp(-x * x) + Math.exp(-(x + 12) * (x + 12));
    for (let i = 1; i < N; i++) { const t = x + i * h; s += (i % 2 ? 4 : 2) * Math.exp(-t * t); }
    return (2 / Math.sqrt(PI)) * s * h / 3;
  }
  const clampSet = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  /* ---------------- 1. the continuous wavelet transform ---------------- */
  Q['wavelet-transform'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const st = r.pick([1, 2, 5, 10, 20, 50]), unit = r.int(0, 1);
        const sw = 1 / (2 * st * 1e-3), sf = sw / (2 * PI);
        return {
          q: [unit ? `A Gaussian window has time spread $\\sigma_t = ${st}$ ms. What is its spread in ordinary frequency, $\\sigma_f = \\sigma_\\omega/2\\pi$, in Hz?` : `A Gaussian window has time spread $\\sigma_t = ${st}$ ms. What is its angular-frequency spread $\\sigma_\\omega$ in rad/s?`, unit ? `ガウス窓の時間の広がりが $\\sigma_t = ${st}$ ms です。通常の周波数での広がり $\\sigma_f = \\sigma_\\omega/2\\pi$ は何 Hz ですか。` : `ガウス窓の時間の広がりが $\\sigma_t = ${st}$ ms です。角周波数の広がり $\\sigma_\\omega$ は何 rad/s ですか。`],
          a: { type: 'num', v: unit ? sf : sw, unit: unit ? ['Hz', 'Hz'] : ['rad/s', 'rad/s'] },
          hint: ['A Gaussian is the one shape that attains the bound $\\sigma_t\\sigma_\\omega = \\tfrac12$ exactly.', 'ガウス関数は $\\sigma_t\\sigma_\\omega = \\tfrac12$ の下限をちょうど達成する唯一の形です。'],
          sol: [[`$\\sigma_\\omega = 1/(2\\sigma_t) = 1/(2 \\times ${sig(st * 1e-3)}\\ \\text{s}) = ${sig(sw, 4)}$ rad/s.`, `$\\sigma_\\omega = 1/(2\\sigma_t) = 1/(2 \\times ${sig(st * 1e-3)}\\ \\text{s}) = ${sig(sw, 4)}$ rad/s です。`]].concat(unit ? [[`$\\sigma_f = \\sigma_\\omega/2\\pi = ${sig(sf, 4)}$ Hz. A shorter window would locate an event more sharply and smear its pitch more.`, `$\\sigma_f = \\sigma_\\omega/2\\pi = ${sig(sf, 4)}$ Hz です。窓を短くすると出来事の時刻はより鋭く決まり、音の高さはよりぼけます。`]] : [[`Halve the window and $\\sigma_\\omega$ doubles: the product is fixed at $\\tfrac12$.`, `窓を半分にすると $\\sigma_\\omega$ は2倍になり、積は $\\tfrac12$ に固定されたままです。`]]),
        };
      }
      if (form === 1) {
        const w0 = r.int(4, 14), s = r.pick([0.005, 0.01, 0.02, 0.05, 0.1]);
        const f = freqOf(s, w0);
        return {
          q: [`A Morlet wavelet with $\\omega_0 = ${w0}$ is stretched to scale $s = ${n(s)}$. Which frequency (cycles per unit time) does it respond to most, $f = 1/\\lambda$ with $\\lambda = 4\\pi s/(\\omega_0 + \\sqrt{2 + \\omega_0^2})$?`, `$\\omega_0 = ${w0}$ のモルレ・ウェーブレットをスケール $s = ${n(s)}$ に伸ばします。最もよく反応する周波数（単位時間あたりのサイクル数）$f = 1/\\lambda$、$\\lambda = 4\\pi s/(\\omega_0 + \\sqrt{2 + \\omega_0^2})$ はいくつですか。`],
          a: { type: 'num', v: f, tol: 2e-3 * f },
          hint: ['Compute $\\omega_0 + \\sqrt{2 + \\omega_0^2}$ first; it is a little more than $2\\omega_0$.', 'まず $\\omega_0 + \\sqrt{2 + \\omega_0^2}$ を計算してください。$2\\omega_0$ より少し大きい値です。'],
          sol: [[`$\\omega_0 + \\sqrt{2 + ${w0 * w0}} = ${n(kk(w0), 5)}$, so $\\lambda = 4\\pi \\cdot ${n(s)}/${n(kk(w0), 5)} = ${n(1 / f, 5)}$.`, `$\\omega_0 + \\sqrt{2 + ${w0 * w0}} = ${n(kk(w0), 5)}$ なので $\\lambda = 4\\pi \\cdot ${n(s)}/${n(kk(w0), 5)} = ${n(1 / f, 5)}$ です。`], [`$f = ${n(f, 4)}$. Almost exactly $\\omega_0/(2\\pi s)$: the wavelet's carrier frequency, slightly corrected for the envelope.`, `$f = ${n(f, 4)}$ です。ほぼ $\\omega_0/(2\\pi s)$、つまりウェーブレットの搬送周波数で、包絡線の分だけわずかに補正されています。`]],
          set: f >= 2 && f <= 200 ? { mode: 0, w0, pf: Math.round(f) } : { mode: 0, w0 },
        };
      }
      const w0 = r.int(4, 14), N = S2 * w0 / PI;
      return {
        q: [`How many cycles of the carrier fit under the Morlet envelope between $b - 2\\sigma_t$ and $b + 2\\sigma_t$ when $\\omega_0 = ${w0}$? ($\\sigma_t = s/\\sqrt2$, carrier $\\omega_0/s$.)`, `$\\omega_0 = ${w0}$ のとき、モルレの包絡線の $b - 2\\sigma_t$ から $b + 2\\sigma_t$ の間に搬送波は何サイクル入りますか（$\\sigma_t = s/\\sqrt2$、搬送波は $\\omega_0/s$）。`],
        a: { type: 'num', v: N, tol: 2e-3, show: `\\tfrac{${w0}\\sqrt2}{\\pi}` },
        hint: ['Cycles = (angular frequency × duration)/(2π). Watch the scale $s$ cancel.', 'サイクル数 = 角周波数 × 時間 / 2π です。スケール $s$ が消えることに注目してください。'],
        sol: [[`Duration $4\\sigma_t = 4s/\\sqrt2 = 2\\sqrt2\\,s$; carrier $\\omega_0/s$.`, `時間幅は $4\\sigma_t = 4s/\\sqrt2 = 2\\sqrt2\\,s$、搬送波は $\\omega_0/s$ です。`], [`Cycles $= \\dfrac{(\\omega_0/s)(2\\sqrt2\\,s)}{2\\pi} = \\dfrac{\\sqrt2\\,\\omega_0}{\\pi} = ${n(N, 4)}$, whatever the scale. That is what “stretched, not refilled” means: the readout's cycle count stays put as you drag the probe up and down.`, `サイクル数は $\\dfrac{(\\omega_0/s)(2\\sqrt2\\,s)}{2\\pi} = \\dfrac{\\sqrt2\\,\\omega_0}{\\pi} = ${n(N, 4)}$ で、スケールによりません。「詰め替えずに伸ばす」とはこのことで、プローブを上下に動かしても読み取り欄のサイクル数は変わりません。`]],
        set: { mode: 0, w0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w0 = r.int(4, 14), f = r.pick([4, 8, 10, 16, 20, 32, 40, 50, 64, 100, 128]);
        const s = scaleOf(f, w0);
        return {
          q: [`In the scalogram, which scale $s$ does the Morlet wavelet with $\\omega_0 = ${w0}$ use to measure $f = ${f}$ cycles per unit?`, `スカログラムで、$\\omega_0 = ${w0}$ のモルレ・ウェーブレットが $f = ${f}$（単位あたりサイクル）を測るのに使うスケール $s$ はいくつですか。`],
          a: { type: 'num', v: s, tol: 2e-3 * s },
          hint: ['Invert $f = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi s)$.', '$f = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi s)$ を $s$ について解いてください。'],
          sol: [[`$s = \\dfrac{\\omega_0 + \\sqrt{2 + \\omega_0^2}}{4\\pi f} = \\dfrac{${n(kk(w0), 5)}}{4\\pi \\cdot ${f}}$.`, `$s = \\dfrac{\\omega_0 + \\sqrt{2 + \\omega_0^2}}{4\\pi f} = \\dfrac{${n(kk(w0), 5)}}{4\\pi \\cdot ${f}}$ です。`], [`$s = ${n(s, 5)}$: the readout's scale at this probe. Scale and frequency are reciprocal, so each octave up halves $s$.`, `$s = ${n(s, 5)}$ で、このプローブでの読み取り欄のスケールです。スケールと周波数は逆数の関係なので、1オクターブ上がるごとに $s$ は半分になります。`]],
          set: { mode: 0, w0, pf: f },
        };
      }
      if (form === 1) {
        const w0 = r.int(4, 14), f = r.pick([4, 8, 16, 20, 32, 50, 64, 100]);
        const s = scaleOf(f, w0), st = s / S2, sf = 1 / (S2 * s) / (2 * PI);
        if (r.chance(0.4)) {
          const c = kk(w0) / (4 * S2 * PI);
          return {
            q: [`For the Morlet wavelet with $\\omega_0 = ${w0}$, write its time spread $\\sigma_t = s/\\sqrt2$ as a function of the frequency $f$ it measures.`, `$\\omega_0 = ${w0}$ のモルレ・ウェーブレットについて、時間の広がり $\\sigma_t = s/\\sqrt2$ を、測る周波数 $f$ の関数として表してください。`],
            a: { type: 'expr', v: `${c}/f`, vars: ['f'], dom: { f: [2, 200] }, lhs: ['$\\sigma_t(f) =$', '$\\sigma_t(f) =$'] },
            hint: ['Substitute $s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$.', '$s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$ を代入してください。'],
            sol: [[`$\\sigma_t = \\dfrac{s}{\\sqrt2} = \\dfrac{${n(kk(w0), 5)}}{4\\sqrt2\\,\\pi f}$.`, `$\\sigma_t = \\dfrac{s}{\\sqrt2} = \\dfrac{${n(kk(w0), 5)}}{4\\sqrt2\\,\\pi f}$ です。`], [`$\\sigma_t \\approx ${n(c, 4)}/f$: inversely proportional to frequency, so the Heisenberg box gets thinner as you go up, and $\\sigma_f \\propto f$ makes it taller by the same factor.`, `$\\sigma_t \\approx ${n(c, 4)}/f$ で、周波数に反比例します。上へ行くほどハイゼンベルクの枠は細くなり、$\\sigma_f \\propto f$ なので同じ割合で高くなります。`]],
            set: { mode: 0, w0, pf: f },
          };
        }
        return {
          q: [`At the probe frequency $f = ${f}$ with $\\omega_0 = ${w0}$, find the Morlet atom's spreads $\\sigma_t = s/\\sqrt2$ and $\\sigma_f = 1/(2\\sqrt2\\,\\pi s)$.`, `プローブの周波数 $f = ${f}$、$\\omega_0 = ${w0}$ のとき、モルレ原子の広がり $\\sigma_t = s/\\sqrt2$ と $\\sigma_f = 1/(2\\sqrt2\\,\\pi s)$ を求めてください。`],
          a: { type: 'tuple', v: [st, sf], labels: ['$\\sigma_t$', '$\\sigma_f$'], rel: 3e-3 },
          hint: ['First find the scale $s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$.', 'まずスケール $s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$ を求めてください。'],
          sol: [[`$s = ${n(kk(w0), 5)}/(4\\pi\\cdot ${f}) = ${n(s, 5)}$.`, `$s = ${n(kk(w0), 5)}/(4\\pi\\cdot ${f}) = ${n(s, 5)}$ です。`], [`$\\sigma_t = ${n(st, 5)}$, $\\sigma_f = ${n(sf, 4)}$; their product is $\\sigma_t\\sigma_f = 1/(4\\pi) = ${n(1 / (4 * PI), 4)}$, the minimum, at every probe.`, `$\\sigma_t = ${n(st, 5)}$、$\\sigma_f = ${n(sf, 4)}$ で、積は $\\sigma_t\\sigma_f = 1/(4\\pi) = ${n(1 / (4 * PI), 4)}$ と、どのプローブでも最小値です。`]],
          set: { mode: 0, w0, pf: f },
        };
      }
      const f1 = r.pick([5, 10, 20, 25]), m = r.pick([2, 4, 8]), f2 = f1 * m, which = r.int(0, 2);
      const ans = which === 0 ? 1 / m : which === 1 ? m : 1;
      return {
        q: [`Move the wavelet probe from $f = ${f1}$ to $f = ${f2}$. By what factor does ${which === 0 ? 'the box width $\\sigma_t$' : which === 1 ? 'the box height $\\sigma_f$' : 'the box area $\\sigma_t\\sigma_f$'} change?`, `ウェーブレットのプローブを $f = ${f1}$ から $f = ${f2}$ に動かします。${which === 0 ? '枠の幅 $\\sigma_t$' : which === 1 ? '枠の高さ $\\sigma_f$' : '枠の面積 $\\sigma_t\\sigma_f$'}は何倍になりますか。`],
        a: { type: 'num', v: ans, tol: 1e-6, show: which === 0 ? `\\tfrac{1}{${m}}` : String(ans) },
        hint: ['The scale is inversely proportional to frequency; $\\sigma_t \\propto s$ and $\\sigma_f \\propto 1/s$.', 'スケールは周波数に反比例し、$\\sigma_t \\propto s$、$\\sigma_f \\propto 1/s$ です。'],
        sol: [[`Raising $f$ by ${m} divides $s$ by ${m}.`, `$f$ を ${m} 倍にすると $s$ は ${m} 分の 1 になります。`], [which === 0 ? `So $\\sigma_t$ is divided by ${m}: high frequencies are timed ${m} times more sharply.` : which === 1 ? `So $\\sigma_f$ is multiplied by ${m}: the absolute frequency blur grows, though the relative blur $\\sigma_f/f$ stays the same.` : 'The width shrinks and the height grows by the same factor, so the area is unchanged at the Heisenberg minimum.', which === 0 ? `したがって $\\sigma_t$ は ${m} 分の 1 になり、高い周波数ほど時刻が ${m} 倍鋭く決まります。` : which === 1 ? `したがって $\\sigma_f$ は ${m} 倍になります。周波数の絶対的なぼけは大きくなりますが、相対的なぼけ $\\sigma_f/f$ は変わりません。` : '幅が縮むのと同じ割合で高さが伸びるので、面積はハイゼンベルクの最小値のまま変わりません。']],
        set: { mode: 0, pf: f2 <= 200 ? f2 : f1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w0 = r.int(4, 14), rel = 2 * S2 / kk(w0);
        return {
          q: [`Call two tones resolved by the Morlet transform when they are more than $2\\sigma_f$ apart. With $\\omega_0 = ${w0}$, what is the smallest resolvable relative separation $\\Delta f/f$?`, `モルレ変換で2つの音が $2\\sigma_f$ より離れていれば分解できるとします。$\\omega_0 = ${w0}$ のとき、分解できる最小の相対間隔 $\\Delta f/f$ はいくつですか。`],
          a: { type: 'num', v: rel, tol: 1e-3, show: `\\tfrac{2\\sqrt2}{${w0} + \\sqrt{${2 + w0 * w0}}}` },
          hint: ['Write $\\sigma_f = 1/(2\\sqrt2\\,\\pi s)$ in terms of $f$, then divide by $f$.', '$\\sigma_f = 1/(2\\sqrt2\\,\\pi s)$ を $f$ で表し、$f$ で割ってください。'],
          sol: [[`With $s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$: $\\sigma_f = \\dfrac{\\sqrt2 f}{\\omega_0 + \\sqrt{2 + \\omega_0^2}}$.`, `$s = (\\omega_0 + \\sqrt{2 + \\omega_0^2})/(4\\pi f)$ より $\\sigma_f = \\dfrac{\\sqrt2 f}{\\omega_0 + \\sqrt{2 + \\omega_0^2}}$ です。`], [`$\\Delta f/f = 2\\sigma_f/f = 2\\sqrt2/${n(kk(w0), 5)} = ${n(rel, 4)}$, the same at every frequency.`, `$\\Delta f/f = 2\\sigma_f/f = 2\\sqrt2/${n(kk(w0), 5)} = ${n(rel, 4)}$ で、どの周波数でも同じです。`], ['The wavelet transform has constant relative bandwidth, like the semitones of a piano or the filters of the cochlea. Raising $\\omega_0$ sharpens it at the price of longer atoms.', 'ウェーブレット変換は相対帯域幅が一定で、ピアノの半音や蝸牛のフィルタに似ています。$\\omega_0$ を上げると鋭くなりますが、原子は長くなります。']],
          set: { mode: 0, w0 },
        };
      }
      if (form === 1) {
        const Nc = r.pick([2, 3, 4, 5, 6]);
        const need = Math.ceil(PI * Nc / S2 - 1e-12);
        return {
          q: [`What is the smallest integer $\\omega_0$ for which the Morlet envelope (between $\\pm 2\\sigma_t$) holds at least ${Nc} cycles of the carrier?`, `モルレの包絡線（$\\pm 2\\sigma_t$ の間）に搬送波が少なくとも ${Nc} サイクル入るような、最小の整数 $\\omega_0$ はいくつですか。`],
          a: { type: 'int', v: need },
          hint: ['The cycle count is $\\sqrt2\\,\\omega_0/\\pi$, independent of scale.', 'サイクル数はスケールによらず $\\sqrt2\\,\\omega_0/\\pi$ です。'],
          sol: [[`Need $\\sqrt2\\,\\omega_0/\\pi \\ge ${Nc}$, that is $\\omega_0 \\ge ${Nc}\\pi/\\sqrt2 = ${n(PI * Nc / S2, 4)}$.`, `$\\sqrt2\\,\\omega_0/\\pi \\ge ${Nc}$、つまり $\\omega_0 \\ge ${Nc}\\pi/\\sqrt2 = ${n(PI * Nc / S2, 4)}$ が必要です。`], [`So $\\omega_0 = ${need}$, giving $${n(S2 * need / PI, 3)}$ cycles. More cycles mean finer frequency resolution and coarser time resolution at every scale.`, `したがって $\\omega_0 = ${need}$ で、$${n(S2 * need / PI, 3)}$ サイクルになります。サイクルが多いほど、どのスケールでも周波数分解能は細かく、時間分解能は粗くなります。`]],
          set: need >= 4 && need <= 14 ? { mode: 0, w0: need } : undefined,
        };
      }
      const w0 = r.int(4, 14), T0 = r.pick([1, 2, 0.5, 10]);
      const sMax = T0 / (2 * S2), fMin = freqOf(sMax, w0);
      return {
        q: [`The cone of influence of the Morlet transform reaches $\\sqrt2\\,s$ in from each end of a record. For a record of length $${n(T0)}$ and $\\omega_0 = ${w0}$, below which frequency $f$ does the cone cover the whole record?`, `モルレ変換の影響円錐は、記録の両端からそれぞれ $\\sqrt2\\,s$ だけ内側に及びます。長さ $${n(T0)}$ の記録、$\\omega_0 = ${w0}$ のとき、どの周波数 $f$ より下で円錐が記録全体を覆いますか。`],
        a: { type: 'num', v: fMin, tol: 2e-3 * fMin },
        hint: ['The two cones meet in the middle when $\\sqrt2\\,s = T/2$. Convert that scale to a frequency.', '2つの円錐は $\\sqrt2\\,s = T/2$ のとき中央で出会います。そのスケールを周波数に直してください。'],
        sol: [[`$\\sqrt2\\,s = ${n(T0 / 2)}$ gives $s = ${n(sMax, 5)}$.`, `$\\sqrt2\\,s = ${n(T0 / 2)}$ より $s = ${n(sMax, 5)}$ です。`], [`$f = ${n(kk(w0), 5)}/(4\\pi\\cdot ${n(sMax, 5)}) = ${n(fMin, 4)}$.`, `$f = ${n(kk(w0), 5)}/(4\\pi\\cdot ${n(sMax, 5)}) = ${n(fMin, 4)}$ です。`], ['Below it, every coefficient feels the ends of the record (wrapped round, in the periodic transform), so slow oscillations need records many periods long to be trusted.', 'それより下では、すべての係数が記録の端（周期的な変換では折り返し）の影響を受けます。ゆっくりした振動を信頼するには、何周期分も長い記録が必要です。']],
        set: T0 === 1 ? { mode: 0, w0, pf: clampSet(Math.round(fMin), 2, 200) } : undefined,
      };
    },
  ];

  /* ---------------- 2. the multiresolution ladder (orthonormal Haar: a = (x0 + x1)/sqrt2, d = (x0 - x1)/sqrt2) ---------------- */
  function haarFull(x) {
    let a = x.slice(); const ds = [];
    while (a.length > 1) { const na = [], d = []; for (let k = 0; k < a.length / 2; k++) { na.push((a[2 * k] + a[2 * k + 1]) / S2); d.push((a[2 * k] - a[2 * k + 1]) / S2); } ds.unshift(d); a = na; }
    return { a: a[0], d: ds };
  }
  const v2 = (m) => { let k = 0; while (m % 2 === 0 && m > 0) { m /= 2; k++; } return k; };
  Q['haar-multiresolution'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let x0, x1; do { x0 = r.int(-5, 9); x1 = r.int(-5, 9); } while (x0 === x1);
        return {
          q: [`One orthonormal Haar step turns the pair $(${x0}, ${x1})$ into an average $a = (x_0 + x_1)/\\sqrt2$ and a detail $d = (x_0 - x_1)/\\sqrt2$. Find $a$ and $d$.`, `正規直交ハールの一段は、組 $(${x0}, ${x1})$ を平均 $a = (x_0 + x_1)/\\sqrt2$ と詳細 $d = (x_0 - x_1)/\\sqrt2$ に変えます。$a$ と $d$ を求めてください。`],
          a: { type: 'tuple', v: [(x0 + x1) / S2, (x0 - x1) / S2], labels: ['$a$', '$d$'], tol: 1e-3 },
          sol: [[`$a = ${x0 + x1}/\\sqrt2 = ${n((x0 + x1) / S2, 4)}$, $d = ${x0 - x1}/\\sqrt2 = ${n((x0 - x1) / S2, 4)}$.`, `$a = ${x0 + x1}/\\sqrt2 = ${n((x0 + x1) / S2, 4)}$、$d = ${x0 - x1}/\\sqrt2 = ${n((x0 - x1) / S2, 4)}$ です。`], [`Check: $a^2 + d^2 = ${x0 * x0 + x1 * x1} = x_0^2 + x_1^2$. The $1/\\sqrt2$ makes the step a rotation, so energy is preserved.`, `確認：$a^2 + d^2 = ${x0 * x0 + x1 * x1} = x_0^2 + x_1^2$ です。$1/\\sqrt2$ があるのでこの一段は回転になり、エネルギーが保存されます。`]],
          set: { basis: 0 },
        };
      }
      if (form === 1) {
        const which = r.int(0, 1), j = r.int(1, 8), l = r.int(0, 7);
        if (which === 0) return {
          q: [`A signal of $256$ samples is projected onto $V_${j}$, keeping the scaling coefficient and detail levels $0$ to $${j - 1}$. How many coefficients are kept?`, `$256$ 標本の信号を $V_${j}$ に射影し、スケーリング係数と段 $0$ から $${j - 1}$ までの詳細を残します。残る係数はいくつですか。`],
          a: { type: 'int', v: 2 ** j },
          hint: ['Level $l$ has $2^l$ detail coefficients; add the one scaling coefficient.', '段 $l$ には $2^l$ 個の詳細係数があります。スケーリング係数1個を加えてください。'],
          sol: [[`$1 + (1 + 2 + \\cdots + 2^{${j - 1}}) = 2^{${j}}$.`, `$1 + (1 + 2 + \\cdots + 2^{${j - 1}}) = 2^{${j}}$ です。`], [`So $${2 ** j}$ of the $256$ numbers, a piecewise approximation on cells of width $1/${2 ** j}$: the readout's coefficient count at $j = ${j}$.`, `したがって $256$ 個のうち $${2 ** j}$ 個で、幅 $1/${2 ** j}$ のセルの上の近似です。$j = ${j}$ での読み取り欄の係数の数です。`]],
          set: { j },
        };
        return {
          q: [`In a full Haar decomposition of $256$ samples, how many detail coefficients does level $l = ${l}$ have?`, `$256$ 標本の完全なハール分解で、段 $l = ${l}$ の詳細係数はいくつありますか。`],
          a: { type: 'int', v: 2 ** l },
          hint: ['Level $0$ is the coarsest: one wavelet spanning the whole record.', '段 $0$ が最も粗く、記録全体にわたるウェーブレット1つです。'],
          sol: [[`Each level halves the support, so level $${l}$ has $2^{${l}} = ${2 ** l}$ wavelets.`, `段が進むごとに台は半分になるので、段 $${l}$ には $2^{${l}} = ${2 ** l}$ 個のウェーブレットがあります。`], [`Each spans $1/${2 ** l}$ of the record, which is the cell width in row $${l}$ of the coefficient picture.`, `それぞれ記録の $1/${2 ** l}$ にわたり、係数の図の行 $${l}$ のセルの幅です。`]],
        };
      }
      const b = r.int(0, 1), deg = r.int(0, 1 + b);
      const kills = deg < b + 1;
      const poly = ['a constant', 'a straight line', 'a parabola'][deg], polyJ = ['定数', '直線', '放物線'][deg];
      return {
        q: [`Away from the ends, are the ${b ? 'Daubechies-4' : 'Haar'} detail coefficients of ${poly} all zero?`, `端から離れたところで、${polyJ}の${b ? 'ドブシー 4' : 'ハール'}詳細係数はすべて 0 ですか。`],
        a: { type: 'choice', fixed: true, v: kills ? 0 : 1, opts: [[`Yes: ${b ? 'D4 has two vanishing moments' : 'Haar has one vanishing moment'}`, `はい。${b ? 'D4 は消失モーメントを2つもつ' : 'ハールは消失モーメントを1つもつ'}`], [`No: the wavelet has only ${b ? 'two vanishing moments' : 'one vanishing moment'}`, `いいえ。ウェーブレットの消失モーメントは${b ? '2つ' : '1つ'}だけ`]] },
        hint: ['A wavelet with $p$ vanishing moments satisfies $\\sum_n n^k g_n = 0$ for $k < p$, so it cannot see polynomials of degree below $p$.', '消失モーメントを $p$ 個もつウェーブレットは $k < p$ で $\\sum_n n^k g_n = 0$ を満たすので、次数 $p$ 未満の多項式を見ることができません。'],
        sol: [[`${b ? 'D4' : 'Haar'} has $p = ${b + 1}$, so it is blind to polynomials of degree below ${b + 1}; ${poly} has degree ${deg}.`, `${b ? 'D4' : 'ハール'}は $p = ${b + 1}$ なので、次数 ${b + 1} 未満の多項式は見えません。${polyJ}の次数は ${deg} です。`], [kills ? 'So every interior detail is exactly zero; only the wrap-around at the ends of the periodic transform shows up.' : 'So the details are not zero: along each level they take one constant value, and that value shrinks geometrically from level to level.', kills ? 'したがって内部の詳細はすべて 0 で、周期的な変換の両端の折り返しだけが現れます。' : 'したがって詳細は 0 ではなく、各段の中で一定の値をとり、その大きさは段とともに等比的にしか小さくなりません。']],
        set: deg === 1 && b === 1 ? { basis: b, sig: 2 } : { basis: b },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const x = [r.int(-4, 8), r.int(-4, 8), r.int(-4, 8), r.int(-4, 8)];
        const H = haarFull(x);
        return {
          q: [`Take the full orthonormal Haar transform of $(${x.join(', ')})$. Give the scaling coefficient $a$, the coarse detail $d_{0}$, and the two fine details $d_{1,0}$, $d_{1,1}$.`, `$(${x.join(', ')})$ の完全な正規直交ハール変換をとります。スケーリング係数 $a$、粗い詳細 $d_{0}$、2つの細かい詳細 $d_{1,0}$、$d_{1,1}$ を答えてください。`],
          a: { type: 'tuple', v: [H.a, H.d[0][0], H.d[1][0], H.d[1][1]], labels: ['$a$', '$d_0$', '$d_{1,0}$', '$d_{1,1}$'], tol: 1e-3 },
          hint: ['Pairs first: $((x_0 \\pm x_1)/\\sqrt2)$, $((x_2 \\pm x_3)/\\sqrt2)$; then repeat on the two averages.', 'まず組ごとに $((x_0 \\pm x_1)/\\sqrt2)$、$((x_2 \\pm x_3)/\\sqrt2)$ を作り、2つの平均について繰り返します。'],
          sol: [[`Fine level: $d_{1,0} = (${x[0]} - ${x[1]})/\\sqrt2 = ${n(H.d[1][0], 4)}$, $d_{1,1} = (${x[2]} - ${x[3]})/\\sqrt2 = ${n(H.d[1][1], 4)}$; averages $${n((x[0] + x[1]) / S2, 4)}$, $${n((x[2] + x[3]) / S2, 4)}$.`.replace(/- -/g, '+ '), `細かい段：$d_{1,0} = (${x[0]} - ${x[1]})/\\sqrt2 = ${n(H.d[1][0], 4)}$、$d_{1,1} = (${x[2]} - ${x[3]})/\\sqrt2 = ${n(H.d[1][1], 4)}$、平均は $${n((x[0] + x[1]) / S2, 4)}$、$${n((x[2] + x[3]) / S2, 4)}$ です。`.replace(/- -/g, '+ ')], [`Coarse level: $a = (x_0 + x_1 + x_2 + x_3)/2 = ${n(H.a, 4)}$, $d_0 = (x_0 + x_1 - x_2 - x_3)/2 = ${n(H.d[0][0], 4)}$.`, `粗い段：$a = (x_0 + x_1 + x_2 + x_3)/2 = ${n(H.a, 4)}$、$d_0 = (x_0 + x_1 - x_2 - x_3)/2 = ${n(H.d[0][0], 4)}$ です。`], [`Four numbers in, four out, and the sum of squares is still $${x.reduce((s, q) => s + q * q, 0)}$.`, `4つの数を入れて4つの数が出て、2乗和は $${x.reduce((s, q) => s + q * q, 0)}$ のままです。`]],
          set: { basis: 0 },
        };
      }
      if (form === 1) {
        const x = [r.int(-4, 8), r.int(-4, 8), r.int(-4, 8), r.int(-4, 8)];
        const err = ((x[0] - x[1]) ** 2 + (x[2] - x[3]) ** 2) / 2;
        return {
          q: [`Project $(${x.join(', ')})$ onto $V_1$ with the Haar basis (keep $a$ and $d_0$, discard the two fine details). What is the squared error $\\|x - P_{V_1}x\\|^2$?`, `$(${x.join(', ')})$ をハール基底で $V_1$ に射影します（$a$ と $d_0$ を残し、2つの細かい詳細を捨てます）。2乗誤差 $\\|x - P_{V_1}x\\|^2$ はいくつですか。`],
          a: { type: 'num', v: err, tol: 1e-6 },
          hint: ['By Parseval, the squared error is the energy of the discarded coefficients.', 'パーセバルの等式により、2乗誤差は捨てた係数のエネルギーです。'],
          sol: [[`$P_{V_1}x$ replaces each pair by its mean: $(${n((x[0] + x[1]) / 2)}, ${n((x[0] + x[1]) / 2)}, ${n((x[2] + x[3]) / 2)}, ${n((x[2] + x[3]) / 2)})$.`, `$P_{V_1}x$ は各組をその平均で置き換えます：$(${n((x[0] + x[1]) / 2)}, ${n((x[0] + x[1]) / 2)}, ${n((x[2] + x[3]) / 2)}, ${n((x[2] + x[3]) / 2)})$ です。`], [`Error $= d_{1,0}^2 + d_{1,1}^2 = \\tfrac{(${x[0] - x[1]})^2 + (${x[2] - x[3]})^2}{2} = ${n(err)}$, the same as summing the squared differences directly.`, `誤差は $d_{1,0}^2 + d_{1,1}^2 = \\tfrac{(${x[0] - x[1]})^2 + (${x[2] - x[3]})^2}{2} = ${n(err)}$ で、差の2乗を直接足しても同じです。`]],
          set: { basis: 0 },
        };
      }
      const al = r.pick([1, 2, 3, -1, -2, 0.5]), be = r.int(-3, 3);
      const d = -al / S2;
      return {
        q: [`The finest-level Haar detail of the line $x_n = ${al === 1 ? '' : al === -1 ? '-' : n(al)}n ${be < 0 ? '-' : '+'} ${Math.abs(be)}$ is $d_k = (x_{2k} - x_{2k+1})/\\sqrt2$. What is it?`, `直線 $x_n = ${al === 1 ? '' : al === -1 ? '-' : n(al)}n ${be < 0 ? '-' : '+'} ${Math.abs(be)}$ の最も細かい段のハール詳細は $d_k = (x_{2k} - x_{2k+1})/\\sqrt2$ です。その値はいくつですか。`],
        a: { type: 'num', v: d, tol: 1e-4, show: al > 0 ? `-\\tfrac{${n(al)}}{\\sqrt2}` : `\\tfrac{${n(-al)}}{\\sqrt2}` },
        hint: ['Neighbouring samples of a line differ by the slope.', '直線の隣り合う標本は傾きだけ違います。'],
        sol: [[`$x_{2k} - x_{2k+1} = -${al < 0 ? `(${n(al)})` : n(al)}$ for every $k$; the constant $${be}$ cancels.`, `どの $k$ でも $x_{2k} - x_{2k+1} = -${al < 0 ? `(${n(al)})` : n(al)}$ で、定数 $${be}$ は消えます。`], [`$d_k = ${n(d, 4)}$: the same at every position. Haar removes constants but not slopes, while D4, with two vanishing moments, would give exactly zero here.`, `$d_k = ${n(d, 4)}$ で、どの位置でも同じです。ハールは定数を消しますが傾きは消しません。消失モーメントが2つの D4 なら、ここでちょうど 0 になります。`]],
        set: { basis: 0, sig: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const kind = r.int(0, 2);
        const p = kind === 0 ? 1 : kind === 1 ? 2 : 0;
        const ratio = kind === 2 ? 1 / S2 : 2 ** -(p + 0.5);
        return {
          q: [kind === 2 ? 'Near a jump, by what factor does the largest Haar detail coefficient shrink from one level to the next finer one?' : `For a smooth signal analysed with ${kind ? 'Daubechies-4' : 'Haar'}, the details decay like $|d_{l,k}| \\sim 2^{-l(p + 1/2)}$. By what factor do they shrink per level?`, kind === 2 ? '跳びの近くで、最大のハール詳細係数は1段細かくなるごとに何倍に縮みますか。' : `滑らかな信号を${kind ? 'ドブシー 4' : 'ハール'}で解析すると、詳細は $|d_{l,k}| \\sim 2^{-l(p + 1/2)}$ のように減衰します。1段ごとに何倍に縮みますか。`],
          a: { type: 'num', v: ratio, tol: 1e-3, show: kind === 2 ? '2^{-1/2}' : `2^{-${p === 1 ? '3/2' : '5/2'}}` },
          hint: [kind === 2 ? 'The wavelet straddling the jump sees a fixed step at every level; only its normalisation $2^{l/2}$ and support $2^{-l}$ change.' : `$p$ is the number of vanishing moments: ${kind ? '2 for D4' : '1 for Haar'}.`, kind === 2 ? '跳びをまたぐウェーブレットは、どの段でも一定の段差を見ます。変わるのは規格化 $2^{l/2}$ と台 $2^{-l}$ だけです。' : `$p$ は消失モーメントの数で、${kind ? 'D4 では 2' : 'ハールでは 1'}です。`],
          sol: kind === 2
            ? [['$d \\approx \\int \\psi_{l,k}\\,x$ with $\\psi_{l,k} = 2^{l/2}\\psi(2^l t - k)$: a step of height $h$ gives $d \\approx h\\,2^{l/2}\\cdot c\\,2^{-l} = c\\,h\\,2^{-l/2}$.', '$\\psi_{l,k} = 2^{l/2}\\psi(2^l t - k)$ として $d \\approx \\int \\psi_{l,k}\\,x$ です。高さ $h$ の段差では $d \\approx h\\,2^{l/2}\\cdot c\\,2^{-l} = c\\,h\\,2^{-l/2}$ となります。'], [`Per level: $2^{-1/2} = ${n(ratio, 4)}$. Slow decay, which is why the column above a jump stays bright all the way up.`, `1段ごとに $2^{-1/2} = ${n(ratio, 4)}$ 倍です。減衰が遅いので、跳びの上の列は上の段まで明るいままです。`]]
            : [[`With $p = ${p}$: one level multiplies $|d|$ by $2^{-(${p} + 1/2)}$.`, `$p = ${p}$ では、1段で $|d|$ は $2^{-(${p} + 1/2)}$ 倍になります。`], [`$= ${n(ratio, 4)}$. Compare $2^{-1/2} \\approx 0.707$ at a jump: smooth stretches go dark quickly, so the coefficients that matter are those above the singularities.`, `$= ${n(ratio, 4)}$ です。跳びでの $2^{-1/2} \\approx 0.707$ と比べると、滑らかな部分はすぐに暗くなるので、重要な係数は特異点の上にあるものだけです。`]],
          set: kind === 2 ? { basis: 0, sig: 0 } : { basis: kind },
        };
      }
      if (form === 1) {
        const J = r.pick([4, 5, 6, 8]), N = 2 ** J;
        let m; do { m = r.int(1, N - 1); } while (r.chance(0.5) && v2(m) === 0);
        const H = haarFull(Array.from({ length: N }, (_, i) => (i >= m ? 1 : 0)));
        const cnt = H.d.reduce((s, d) => s + d.filter((q) => Math.abs(q) > 1e-12).length, 0);
        return {
          q: [`A step $x_i = 0$ for $i < ${m}$, $x_i = 1$ for $i \\ge ${m}$ is sampled at $N = ${N}$ points ($i = 0, \\ldots, ${N - 1}$). How many of its Haar detail coefficients are non-zero?`, `段差 $x_i = 0$（$i < ${m}$）、$x_i = 1$（$i \\ge ${m}$）を $N = ${N}$ 点（$i = 0, \\ldots, ${N - 1}$）で標本化します。ハール詳細係数のうち 0 でないものはいくつですか。`],
          a: { type: 'int', v: cnt },
          hint: ['At level $l$ the blocks have length $N/2^l$. A detail is non-zero only for the block containing the jump, and only if the jump is not on the block\'s edge.', '段 $l$ のブロックの長さは $N/2^l$ です。詳細が 0 でないのは跳びを含むブロックだけで、しかも跳びがブロックの端にない場合に限ります。'],
          sol: [[`Blocks entirely on one side of the jump are constant, so their details vanish. The block containing position ${m} has a non-zero detail unless ${m} is a multiple of its length.`, `跳びの片側に完全に入るブロックは一定なので、詳細は 0 です。位置 ${m} を含むブロックは、${m} がその長さの倍数でない限り 0 でない詳細をもちます。`], [`$${m} = 2^{${v2(m)}}\\times ${m / 2 ** v2(m)}$, so the jump lies on block edges for the ${v2(m)} finest level${v2(m) === 1 ? '' : 's'}, leaving $${J} - ${v2(m)} = ${cnt}$ non-zero details out of $${N - 1}$.`, `$${m} = 2^{${v2(m)}}\\times ${m / 2 ** v2(m)}$ なので、最も細かい ${v2(m)} 段では跳びがブロックの端にあり、0 でない詳細は $${N - 1}$ 個のうち $${J} - ${v2(m)} = ${cnt}$ 個です。`], ['At most one per level: a jump costs about $\\log_2 N$ coefficients in the Haar basis, against all $N$ in the Fourier basis.', '1段に高々1個なので、跳びはハール基底ではおよそ $\\log_2 N$ 個の係数で済み、フーリエ基底ではすべての $N$ 個を必要とします。']],
        };
      }
      const c = r.pick([1, 2, -1, 0.5, 3]);
      const C = -c * Math.sqrt(6) / 2;
      return {
        q: [`D4 is blind to lines but not to parabolas. For $x_n = ${c === 1 ? '' : c === -1 ? '-' : n(c)}n^2$, every interior finest-level D4 detail $d_k = \\sum_m g_m x_{2k+m}$ has the same value. Find it. ($h = \\tfrac{1}{4\\sqrt2}(1 + \\sqrt3,\\ 3 + \\sqrt3,\\ 3 - \\sqrt3,\\ 1 - \\sqrt3)$, $g_m = (-1)^m h_{3-m}$.)`, `D4 は直線は見えませんが、放物線は見えます。$x_n = ${c === 1 ? '' : c === -1 ? '-' : n(c)}n^2$ について、内部の最も細かい段の D4 詳細 $d_k = \\sum_m g_m x_{2k+m}$ はすべて同じ値です。それを求めてください（$h = \\tfrac{1}{4\\sqrt2}(1 + \\sqrt3,\\ 3 + \\sqrt3,\\ 3 - \\sqrt3,\\ 1 - \\sqrt3)$、$g_m = (-1)^m h_{3-m}$）。`],
        a: { type: 'num', v: C, tol: 1e-4, show: `${c > 0 ? '-' : ''}\\tfrac{${Math.abs(c) === 1 ? '' : n(Math.abs(c))}\\sqrt6}{2}` },
        hint: ['Expand $(2k + m)^2$. The moments $\\sum g_m$ and $\\sum m\\,g_m$ vanish, so only $\\sum m^2 g_m$ survives.', '$(2k + m)^2$ を展開します。モーメント $\\sum g_m$ と $\\sum m\\,g_m$ は 0 なので、$\\sum m^2 g_m$ だけが残ります。'],
        sol: [[`$d_k = ${c === 1 ? '' : n(c)}\\big(4k^2\\textstyle\\sum g_m + 4k\\sum m g_m + \\sum m^2 g_m\\big) = ${c === 1 ? '' : n(c)}\\sum m^2 g_m$.`.replace('= -1\\big', '= -\\big').replace('= -1\\sum', '= -\\sum'), `$d_k = ${c === 1 ? '' : n(c)}\\big(4k^2\\textstyle\\sum g_m + 4k\\sum m g_m + \\sum m^2 g_m\\big) = ${c === 1 ? '' : n(c)}\\sum m^2 g_m$ です。`.replace('= -1\\big', '= -\\big').replace('= -1\\sum', '= -\\sum')], ['$g = (h_3, -h_2, h_1, -h_0)$, so $\\sum m^2 g_m = -h_2 + 4h_1 - 9h_0 = \\dfrac{-(3 - \\sqrt3) + 4(3 + \\sqrt3) - 9(1 + \\sqrt3)}{4\\sqrt2} = -\\dfrac{\\sqrt3}{\\sqrt2}$.', '$g = (h_3, -h_2, h_1, -h_0)$ なので $\\sum m^2 g_m = -h_2 + 4h_1 - 9h_0 = \\dfrac{-(3 - \\sqrt3) + 4(3 + \\sqrt3) - 9(1 + \\sqrt3)}{4\\sqrt2} = -\\dfrac{\\sqrt3}{\\sqrt2}$ です。'], [`$d_k = ${n(C, 5)}$ at every $k$: the curvature is the first thing D4 can see, which is why its details of a smooth signal decay like $2^{-5l/2}$.`, `どの $k$ でも $d_k = ${n(C, 5)}$ です。D4 が最初に見えるのは曲がり具合で、滑らかな信号の詳細が $2^{-5l/2}$ のように減衰するのはこのためです。`]],
        set: { basis: 1 },
      };
    },
  ];

  /* ---------------- 3. keep the big coefficients ---------------- */
  Q['wavelet-compression'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form < 2) {
        const lam = r.pick([0.2, 0.3, 0.5, 1, 1.5]), c = r.pick([-2.4, -1.2, -0.7, -0.25, 0.1, 0.4, 0.8, 1.6, 2.5, 3]) * r.pick([1, 0.5]);
        const hard = Math.abs(c) > lam ? c : 0, soft = Math.sign(c) * Math.max(0, Math.abs(c) - lam);
        const v = form === 0 ? hard : soft;
        return {
          q: [`Apply ${form === 0 ? 'hard' : 'soft'} thresholding with $\\lambda = ${n(lam)}$ to the coefficient $c = ${n(c)}$.`, `係数 $c = ${n(c)}$ に $\\lambda = ${n(lam)}$ の${form === 0 ? 'ハード' : 'ソフト'}しきい値処理を施してください。`],
          a: { type: 'num', v, tol: 1e-6 },
          hint: [form === 0 ? 'Hard: keep it unchanged if $|c| > \\lambda$, otherwise set it to $0$.' : 'Soft: shrink $|c|$ by $\\lambda$, keeping the sign, and stop at $0$.', form === 0 ? 'ハード：$|c| > \\lambda$ ならそのまま残し、そうでなければ $0$ にします。' : 'ソフト：符号を保って $|c|$ を $\\lambda$ だけ縮め、$0$ で止めます。'],
          sol: [[`$|c| = ${n(Math.abs(c))} ${Math.abs(c) > lam ? '>' : '\\le'} ${n(lam)}$.`, `$|c| = ${n(Math.abs(c))} ${Math.abs(c) > lam ? '>' : '\\le'} ${n(lam)}$ です。`], [form === 0 ? (Math.abs(c) > lam ? `Kept: $${n(c)}$.` : 'Discarded: $0$.') : (Math.abs(c) > lam ? `Shrunk: $\\operatorname{sgn}(c)(|c| - \\lambda) = ${n(soft)}$. Soft thresholding biases every survivor towards zero by $\\lambda$, which smooths but slightly flattens sharp features.` : 'Below the threshold: $0$.'), form === 0 ? (Math.abs(c) > lam ? `そのまま残り $${n(c)}$ です。` : '捨てられて $0$ です。') : (Math.abs(c) > lam ? `縮めて $\\operatorname{sgn}(c)(|c| - \\lambda) = ${n(soft)}$ です。ソフトしきい値は残った係数すべてを $\\lambda$ だけ 0 に寄せるので、滑らかになる一方で鋭い特徴が少し平らになります。` : 'しきい値以下なので $0$ です。')]],
          set: { rule: form },
        };
      }
      const sigma = r.step(0.05, 0.5, 0.01), N = r.pick([512, 512, 256, 1024, 4096]);
      const lu = sigma * Math.sqrt(2 * Math.log(N));
      return {
        q: [`Noise level $\\sigma = ${n(sigma)}$, $N = ${N}$ coefficients. What is the universal threshold $\\lambda_U = \\sigma\\sqrt{2\\ln N}$?`, `ノイズの大きさ $\\sigma = ${n(sigma)}$、係数 $N = ${N}$ 個です。普遍しきい値 $\\lambda_U = \\sigma\\sqrt{2\\ln N}$ はいくつですか。`],
        a: { type: 'num', v: lu, tol: 1e-3 },
        sol: [[`$\\sqrt{2\\ln ${N}} = ${n(Math.sqrt(2 * Math.log(N)), 4)}$.`, `$\\sqrt{2\\ln ${N}} = ${n(Math.sqrt(2 * Math.log(N)), 4)}$ です。`], [`$\\lambda_U = ${n(sigma)}\\times ${n(Math.sqrt(2 * Math.log(N)), 4)} = ${n(lu, 4)}$, just above the largest of ${N} pure-noise coefficients you should expect.`, `$\\lambda_U = ${n(sigma)}\\times ${n(Math.sqrt(2 * Math.log(N)), 4)} = ${n(lu, 4)}$ で、${N} 個の純粋なノイズ係数の最大値として予想される値のすぐ上です。`]],
        set: N === 512 ? { sigma, lam: Math.round(lu * 1000) / 1000 } : { sigma },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const c = Array.from({ length: 8 }, () => r.pick([-3, -1.5, -0.6, -0.3, -0.1, 0.05, 0.2, 0.4, 0.9, 2.2, 4]));
        const lam = r.pick([0.25, 0.5, 1]);
        const kept = c.filter((q) => Math.abs(q) > lam);
        const disc = c.filter((q) => Math.abs(q) <= lam);
        const errE = disc.reduce((s, q) => s + q * q, 0);
        const ask = r.int(0, 1);
        return {
          q: [ask ? `An orthonormal transform gives the coefficients $(${c.map((q) => n(q)).join(', ')})$. Hard-threshold them at $\\lambda = ${n(lam)}$ and invert. What is the squared error $\\|x - \\hat x\\|^2$ of the reconstruction?` : `The coefficients $(${c.map((q) => n(q)).join(', ')})$ are hard-thresholded at $\\lambda = ${n(lam)}$. How many survive?`, ask ? `正規直交変換で係数 $(${c.map((q) => n(q)).join(', ')})$ が得られました。$\\lambda = ${n(lam)}$ でハードしきい値処理をして逆変換します。再構成の2乗誤差 $\\|x - \\hat x\\|^2$ はいくつですか。` : `係数 $(${c.map((q) => n(q)).join(', ')})$ を $\\lambda = ${n(lam)}$ でハードしきい値処理します。いくつ残りますか。`],
          a: ask ? { type: 'num', v: errE, tol: 1e-6 } : { type: 'int', v: kept.length },
          hint: [ask ? 'An orthonormal transform preserves distances (Parseval), so the error is the energy of what you threw away.' : 'Keep exactly those with $|c| > \\lambda$.', ask ? '正規直交変換は距離を保つ（パーセバル）ので、誤差は捨てたもののエネルギーです。' : '$|c| > \\lambda$ のものだけを残します。'],
          sol: [[`Discarded: $${disc.length ? disc.map((q) => n(q)).join(', ') : '\\text{none}'}$; kept: ${kept.length} of 8.`, `捨てられるのは $${disc.length ? disc.map((q) => n(q)).join(', ') : '\\text{なし}'}$ で、残るのは 8 個中 ${kept.length} 個です。`], ask ? [`$\\|x - \\hat x\\|^2 = \\sum_{\\text{discarded}} c^2 = ${n(errE, 4)}$, out of a total energy $${n(c.reduce((s, q) => s + q * q, 0), 4)}$.`, `$\\|x - \\hat x\\|^2 = \\sum_{\\text{捨てた}} c^2 = ${n(errE, 4)}$ で、全エネルギー $${n(c.reduce((s, q) => s + q * q, 0), 4)}$ のうちのわずかです。`] : [`Compression ratio $8/${kept.length} = ${n(8 / Math.max(1, kept.length), 3)}$, and by Parseval the squared error is just the sum of the discarded squares, $${n(errE, 4)}$.`, `圧縮率は $8/${kept.length} = ${n(8 / Math.max(1, kept.length), 3)}$ で、パーセバルにより2乗誤差は捨てた係数の2乗和 $${n(errE, 4)}$ にすぎません。`]],
          set: { rule: 0 },
        };
      }
      if (form === 1) {
        const N = r.pick([512, 1024, 256]), sigma = r.pick([0.1, 0.2, 0.05]), m = r.pick([1, 2, 2.5, 3]);
        const lam = m * sigma, cnt = N * erfc(m / S2);
        return {
          q: [`Pure white noise with $\\sigma = ${n(sigma)}$ is transformed into $N = ${N}$ orthonormal coefficients. On average, how many exceed $\\lambda = ${n(lam)}$ in absolute value?`, `$\\sigma = ${n(sigma)}$ の純粋な白色ノイズを $N = ${N}$ 個の正規直交係数に変換します。絶対値が $\\lambda = ${n(lam)}$ を超えるものは平均いくつありますか。`],
          a: { type: 'num', v: cnt, rel: 0.01 },
          hint: ['Each coefficient is an independent $N(0, \\sigma^2)$ variable. $\\Pr(|Z| > z) = \\operatorname{erfc}(z/\\sqrt2)$ for a standard normal.', '各係数は独立な $N(0, \\sigma^2)$ の変数です。標準正規分布では $\\Pr(|Z| > z) = \\operatorname{erfc}(z/\\sqrt2)$ です。'],
          sol: [[`$\\lambda/\\sigma = ${n(m)}$, and $\\Pr(|Z| > ${n(m)}) = ${n(erfc(m / S2), 4)}$.`, `$\\lambda/\\sigma = ${n(m)}$ で、$\\Pr(|Z| > ${n(m)}) = ${n(erfc(m / S2), 4)}$ です。`], [`Expected count $= ${N}\\times ${n(erfc(m / S2), 4)} = ${n(cnt, 4)}$. Each of these is a noise spike that survives thresholding, which is why the universal threshold sits higher, at $\\sigma\\sqrt{2\\ln N} = ${n(Math.sqrt(2 * Math.log(N)), 3)}\\sigma$.`, `期待される個数は $${N}\\times ${n(erfc(m / S2), 4)} = ${n(cnt, 4)}$ です。これらはしきい値処理を生き残るノイズのとげで、普遍しきい値がもっと高い $\\sigma\\sqrt{2\\ln N} = ${n(Math.sqrt(2 * Math.log(N)), 3)}\\sigma$ にあるのはこのためです。`]],
          set: N === 512 ? { sigma, lam } : undefined,
        };
      }
      const N = r.pick([512, 1024, 256]), K = r.pick([8, 16, 32, 64, 5, 20]);
      return {
        q: [`A signal of $N = ${N}$ samples is stored with only its $K = ${K}$ largest wavelet coefficients (plus their positions). What fraction of the coefficients is kept, and what is the compression ratio $N/K$? Give $N/K$.`, `$N = ${N}$ 標本の信号を、最大の $K = ${K}$ 個のウェーブレット係数（とその位置）だけで保存します。係数の何割を残し、圧縮率 $N/K$ はいくつですか。$N/K$ を答えてください。`],
        a: { type: 'num', v: N / K, tol: 1e-3 },
        sol: [[`Kept fraction $K/N = ${K}/${N} = ${n((100 * K) / N, 3)}\\%$.`, `残す割合は $K/N = ${K}/${N} = ${n((100 * K) / N, 3)}\\%$ です。`], [`$N/K = ${n(N / K, 4)}$. The positions cost bits too, so real coders gain a little less; still, a piecewise-smooth signal needs only a few coefficients per jump per level.`, `$N/K = ${n(N / K, 4)}$ です。位置の記録にもビットが要るので実際の符号化の利得は少し小さくなりますが、区分的に滑らかな信号は跳びごと、段ごとにわずかな係数しか必要としません。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const N = r.pick([64, 256, 512, 1024, 4096, 65536]);
        const p = erfc(Math.sqrt(Math.log(N))), any = 1 - Math.pow(1 - p, N);
        return {
          q: [`$N = ${N}$ independent $N(0, \\sigma^2)$ noise coefficients are thresholded at $\\lambda_U = \\sigma\\sqrt{2\\ln N}$. What is the probability that at least one survives?`, `$N = ${N}$ 個の独立な $N(0, \\sigma^2)$ ノイズ係数を $\\lambda_U = \\sigma\\sqrt{2\\ln N}$ でしきい値処理します。少なくとも1つが生き残る確率はいくつですか。`],
          a: { type: 'num', v: any, rel: 0.01 },
          hint: ['Find $p = \\Pr(|Z| > \\sqrt{2\\ln N}) = \\operatorname{erfc}(\\sqrt{\\ln N})$ for one coefficient, then use independence.', 'まず1つの係数について $p = \\Pr(|Z| > \\sqrt{2\\ln N}) = \\operatorname{erfc}(\\sqrt{\\ln N})$ を求め、独立性を使ってください。'],
          sol: [[`$\\sqrt{\\ln ${N}} = ${n(Math.sqrt(Math.log(N)), 4)}$, so $p = \\operatorname{erfc}(${n(Math.sqrt(Math.log(N)), 4)}) = ${sig(p, 4)}$.`, `$\\sqrt{\\ln ${N}} = ${n(Math.sqrt(Math.log(N)), 4)}$ なので $p = \\operatorname{erfc}(${n(Math.sqrt(Math.log(N)), 4)}) = ${sig(p, 4)}$ です。`], [`$\\Pr(\\text{any}) = 1 - (1 - p)^{${N}} = ${n(any, 4)}$ (close to $Np = ${n(N * p, 4)}$).`, `$\\Pr(\\text{少なくとも1つ}) = 1 - (1 - p)^{${N}} = ${n(any, 4)}$ です（$Np = ${n(N * p, 4)}$ に近い値）。`], ['It falls slowly towards $0$ as $N$ grows, roughly like $1/\\sqrt{\\pi\\ln N}$: the universal threshold almost always removes all the noise, at the cost of also removing signal coefficients smaller than about $\\lambda_U$.', '$N$ が大きくなるにつれ、およそ $1/\\sqrt{\\pi\\ln N}$ のようにゆっくり $0$ に近づきます。普遍しきい値はほとんど常にノイズをすべて取り除きますが、その代わり $\\lambda_U$ 程度より小さな信号係数も取り除いてしまいます。']],
          set: N === 512 ? { lam: Math.round(0.1 * Math.sqrt(2 * Math.log(512)) * 1000) / 1000, sigma: 0.1 } : undefined,
        };
      }
      if (form === 1) {
        const J = r.pick([8, 9, 10, 12]), s = r.int(1, 6);
        return {
          q: [`A piecewise-constant signal with ${s} jump${s > 1 ? 's' : ''} is sampled at $N = 2^{${J}} = ${2 ** J}$ points. At most how many of its Haar coefficients (details and the one scaling coefficient) are non-zero?`, `跳びを ${s} 個もつ区分的に一定な信号を $N = 2^{${J}} = ${2 ** J}$ 点で標本化します。そのハール係数（詳細とスケーリング係数1個）のうち 0 でないものは最大でいくつですか。`],
          a: { type: 'int', v: s * J + 1 },
          hint: ['Between jumps the signal is constant, invisible to every Haar detail. At each of the $' + J + '$ levels, each jump touches at most one wavelet.', '跳びの間では信号は一定で、どのハール詳細にも見えません。$' + J + '$ 段のそれぞれで、各跳びは高々1つのウェーブレットにしか触れません。'],
          sol: [[`Details: at most ${s} per level, over ${J} levels: $${s}\\times ${J} = ${s * J}$.`, `詳細は1段に高々 ${s} 個で、${J} 段あるので $${s}\\times ${J} = ${s * J}$ 個です。`], [`Plus the scaling coefficient: at most $${s * J + 1}$ of ${2 ** J}. The count grows like $\\log_2 N$, while a Fourier series of the same signal has non-zero coefficients at almost every frequency.`, `スケーリング係数を加えて、${2 ** J} 個のうち最大 $${s * J + 1}$ 個です。この数は $\\log_2 N$ のようにしか増えませんが、同じ信号のフーリエ級数はほぼすべての周波数に 0 でない係数をもちます。`]],
        };
      }
      const F = r.pick([2, 3, 10, 4, 5]);
      return {
        q: [`The Fourier coefficients of a signal with a jump decay like $1/k$, so truncating after $K$ terms leaves a squared error $\\sum_{k > K} 1/k^2 \\approx 1/K$. By what factor must $K$ grow to cut the RMS error by a factor of ${F}?`, `跳びのある信号のフーリエ係数は $1/k$ のように減衰するので、$K$ 項で打ち切ると2乗誤差は $\\sum_{k > K} 1/k^2 \\approx 1/K$ だけ残ります。RMS 誤差を ${F} 分の 1 にするには、$K$ を何倍にする必要がありますか。`],
        a: { type: 'num', v: F * F, tol: 1e-6 },
        hint: ['RMS error is the square root of the squared error.', 'RMS 誤差は2乗誤差の平方根です。'],
        sol: [['RMS error $\\approx K^{-1/2}$.', 'RMS 誤差は $\\approx K^{-1/2}$ です。'], [`To divide it by ${F}, multiply $K$ by $${F}^2 = ${F * F}$. In a wavelet basis each extra level costs only a few coefficients per jump and the error falls geometrically with the level, which is the gap the figure's two error readouts show.`, `${F} 分の 1 にするには $K$ を $${F}^2 = ${F * F}$ 倍にします。ウェーブレット基底では、段を1つ増やしても跳びごとにわずかな係数しか要らず、誤差は段とともに等比的に減ります。図の2つの誤差の読み取りが示す差はこれです。`]],
      };
    },
  ];
})();
