'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, sig } = P.util;
  const CKM = 299792.458, GYRH = (H0) => 977.792 / H0; // 1/H0 in Gyr (and c/H0 in Gly)
  const E2 = (a, Om, OL) => Om / (a * a * a) + (1 - Om - OL) / (a * a) + OL;
  const r2 = (x) => Math.round(x * 100) / 100;
  const minE2 = (Om, OL, lo, hi) => { let m = Infinity; for (let i = 0; i <= 600; i++) { const a = Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * i / 600); m = Math.min(m, E2(a, Om, OL)); } return m; };
  const fate = (Om, OL) => (minE2(Om, OL, 1e-4, 1) <= 0 ? 0 : OL < 0 || minE2(Om, OL, 1, 1e4) <= 0 ? 1 : 2);
  const simpson = (f, lo, hi, k = 400) => { const h = (hi - lo) / k; let s = f(lo) + f(hi); for (let i = 1; i < k; i++) s += (i % 2 ? 4 : 2) * f(lo + i * h); return s * h / 3; };

  /* ---------- 1. The Friedmann equation ---------- */
  Q.friedmann = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 2) {
        const H0 = r.pick([50, 60, 67.7, 70, 73, 100]);
        return {
          q: [`If $H_0 = ${H0}$ km/s/Mpc, what is the Hubble time $1/H_0$ in billions of years? (1 Mpc $= 3.086\\times10^{19}$ km, 1 Gyr $= 3.156\\times10^{16}$ s.)`, `$H_0 = ${H0}$ km/s/Mpc のとき、ハッブル時間 $1/H_0$ は何十億年ですか（1 Mpc $= 3.086\\times10^{19}$ km、1 Gyr $= 3.156\\times10^{16}$ s）。`],
          a: { type: 'num', v: GYRH(H0), rel: 0.005, unit: ['Gyr', '十億年'] },
          hint: ['Convert $H_0$ to s⁻¹ by dividing by the number of km in a Mpc.', '$H_0$ を 1 Mpc の km 数で割って s⁻¹ に直します。'],
          sol: [[`$H_0 = ${H0}/3.086\\times10^{19} = ${sig(H0 / 3.0857e19, 4)}$ s⁻¹, so $1/H_0 = ${sig(3.0857e19 / H0, 4)}$ s.`, `$H_0 = ${H0}/3.086\\times10^{19} = ${sig(H0 / 3.0857e19, 4)}$ s⁻¹ なので $1/H_0 = ${sig(3.0857e19 / H0, 4)}$ s です。`], [`Divide by $3.156\\times10^{16}$: $1/H_0 = ${n(GYRH(H0), 3)}$ Gyr, which is $977.8/H_0$. It is the age of an empty universe, and sets the scale of every age in the figure.`, `$3.156\\times10^{16}$ で割ると $1/H_0 = ${n(GYRH(H0), 3)}$ 十億年で、$977.8/H_0$ に等しくなります。これは空の宇宙の年齢で、図のすべての年齢の目安になります。`]],
        };
      }
      const Om = r.pick([0.3, 0.31, 0.5, 1, 2, 0.1, 0.25]), OL = r.pick([0, 0.7, 0.69, 0.5, 1.2, -0.3, 0.25]);
      if (form === 0) {
        const q = Om / 2 - OL;
        return {
          q: [`For $\\Omega_m = ${n(Om)}$ and $\\Omega_\\Lambda = ${n(OL)}$, what is the deceleration parameter $q_0 = \\Omega_m/2 - \\Omega_\\Lambda$? Is the expansion speeding up today?`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$ のとき、減速パラメータ $q_0 = \\Omega_m/2 - \\Omega_\\Lambda$ はいくつですか。現在の膨張は加速していますか。`],
          a: { type: 'num', v: q, tol: 1e-6 },
          hint: ['Matter pulls (counts half), the cosmological constant pushes.', '物質は引き戻し（半分の重みで効き）、宇宙定数は押し広げます。'],
          sol: [[`$q_0 = ${n(Om)}/2 - ${n(OL)} = ${n(q)}$.`, `$q_0 = ${n(Om)}/2 - ${n(OL)} = ${n(q)}$ です。`], [q < 0 ? 'Negative: $\\ddot a > 0$, the expansion is accelerating today.' : q > 0 ? 'Positive: $\\ddot a < 0$, the expansion is slowing down today.' : 'Zero: the expansion neither speeds up nor slows down at this moment.', q < 0 ? '負なので $\\ddot a > 0$、現在の膨張は加速しています。' : q > 0 ? '正なので $\\ddot a < 0$、現在の膨張は減速しています。' : '0 なので、この瞬間の膨張は加速も減速もしていません。']],
          set: { om: Om, ol: OL },
        };
      }
      const Ok = 1 - Om - OL;
      return {
        q: [`What is the curvature density $\\Omega_k$ for $\\Omega_m = ${n(Om)}$, $\\Omega_\\Lambda = ${n(OL)}$, and is space open, flat or closed?`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$ のときの曲率密度 $\\Omega_k$ はいくつですか。空間は開いている、平坦、閉じているのどれですか。`],
        a: { type: 'num', v: Ok, tol: 1e-6 },
        hint: ['At $a = 1$ the Friedmann equation reads $1 = \\Omega_m + \\Omega_k + \\Omega_\\Lambda$.', '$a = 1$ ではフリードマン方程式は $1 = \\Omega_m + \\Omega_k + \\Omega_\\Lambda$ となります。'],
        sol: [[`$\\Omega_k = 1 - ${n(Om)} - ${n(OL)} = ${n(r2(Ok))}$.`, `$\\Omega_k = 1 - ${n(Om)} - ${n(OL)} = ${n(r2(Ok))}$ です。`], [Math.abs(Ok) < 1e-9 ? 'Zero: the point is on the dashed diagonal, flat space.' : Ok > 0 ? 'Positive: open, negatively curved space, below the dashed diagonal.' : 'Negative: closed, positively curved space, above the dashed diagonal.', Math.abs(Ok) < 1e-9 ? '0 なので点は破線の対角線上にあり、空間は平坦です。' : Ok > 0 ? '正なので開いた（負に曲がった）空間で、破線の対角線より下です。' : '負なので閉じた（正に曲がった）空間で、破線の対角線より上です。']],
        set: { om: Om, ol: OL },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const Om = r.pick([0.31, 0.3, 0.25, 0.4, 0.2, 0.5]), OL = r.pick([0.69, 0.7, 0.75, 0.6, 1]);
        const a = Math.cbrt(Om / (2 * OL)), z = 1 / a - 1;
        return {
          q: [`With $\\Omega_m = ${n(Om)}$ and $\\Omega_\\Lambda = ${n(OL)}$, at what redshift did the expansion switch from slowing to speeding up?`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$ のとき、膨張が減速から加速に転じたのはどの赤方偏移ですか。`],
          a: { type: 'num', v: z, tol: 2e-3 },
          hint: ['$\\ddot a = 0$ when $\\tfrac12\\Omega_m a^{-3} = \\Omega_\\Lambda$; curvature does not enter.', '$\\ddot a = 0$ となるのは $\\tfrac12\\Omega_m a^{-3} = \\Omega_\\Lambda$ のときで、曲率は関係しません。'],
          sol: [[`$a^3 = \\Omega_m/(2\\Omega_\\Lambda) = ${n(Om / (2 * OL), 4)}$, so $a = ${n(a, 4)}$.`, `$a^3 = \\Omega_m/(2\\Omega_\\Lambda) = ${n(Om / (2 * OL), 4)}$ より $a = ${n(a, 4)}$ です。`], [`$z = 1/a - 1 = ${n(z, 3)}$. Light from beyond this redshift left during the decelerating era; supernovae on both sides of it revealed the switch.`, `$z = 1/a - 1 = ${n(z, 3)}$ です。これより遠い赤方偏移からの光は減速期に出たもので、その両側の超新星が転換を明らかにしました。`]],
          set: { om: Om, ol: OL },
        };
      }
      if (form === 1) {
        const H0 = r.pick([50, 60, 67.7, 70, 73]);
        return {
          q: [`A flat universe of matter only (Einstein–de Sitter, $a \\propto t^{2/3}$) has $H_0 = ${H0}$ km/s/Mpc. How old is it, in Gyr?`, `物質だけの平坦な宇宙（アインシュタイン・ド・ジッター、$a \\propto t^{2/3}$）で $H_0 = ${H0}$ km/s/Mpc です。年齢は何十億年ですか。`],
          a: { type: 'num', v: GYRH(H0) * 2 / 3, rel: 0.005, unit: ['Gyr', '十億年'] },
          hint: ['For $a \\propto t^{2/3}$, $H = \\dot a/a = 2/(3t)$.', '$a \\propto t^{2/3}$ では $H = \\dot a/a = 2/(3t)$ です。'],
          sol: [[`$t_0 = \\tfrac{2}{3H_0}$, and $1/H_0 = ${n(GYRH(H0), 3)}$ Gyr.`, `$t_0 = \\tfrac{2}{3H_0}$ で、$1/H_0 = ${n(GYRH(H0), 3)}$ 十億年です。`], [`$t_0 = ${n(GYRH(H0) * 2 / 3, 3)}$ Gyr. ${H0 >= 60 ? 'Younger than the oldest stars (about 12 to 13 Gyr): one of the clues that matter alone cannot describe our universe.' : 'With a low $H_0$ the age conflict eases, but other data rule this model out.'}`, `$t_0 = ${n(GYRH(H0) * 2 / 3, 3)}$ 十億年です。${H0 >= 60 ? '最古の星（約120億から130億年）より若く、物質だけでは私たちの宇宙を説明できない手がかりの一つです。' : '$H_0$ が小さければ年齢の矛盾は和らぎますが、他のデータがこの模型を否定します。'}`]],
          set: { om: 1, ol: 0 },
        };
      }
      const Om = r.pick([0.3, 0.31, 0.25, 0.2, 0.4, 0.5]), OL = 1 - Om, H0 = 67.7;
      const t0 = 2 / (3 * Math.sqrt(OL)) * Math.asinh(Math.sqrt(OL / Om)) * GYRH(H0);
      return {
        q: [`For a flat universe with $\\Omega_m = ${n(Om)}$, $\\Omega_\\Lambda = ${n(OL)}$ and $H_0 = 67.7$ km/s/Mpc, use $t_0 = \\dfrac{2}{3H_0\\sqrt{\\Omega_\\Lambda}}\\operatorname{arsinh}\\sqrt{\\Omega_\\Lambda/\\Omega_m}$ to find its age in Gyr.`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$、$H_0 = 67.7$ km/s/Mpc の平坦な宇宙の年齢を、$t_0 = \\dfrac{2}{3H_0\\sqrt{\\Omega_\\Lambda}}\\operatorname{arsinh}\\sqrt{\\Omega_\\Lambda/\\Omega_m}$ を使って十億年単位で求めてください。`],
        a: { type: 'num', v: t0, rel: 0.003, unit: ['Gyr', '十億年'] },
        hint: ['$1/H_0 = 14.44$ Gyr for $H_0 = 67.7$.', '$H_0 = 67.7$ では $1/H_0 = 14.44$ 十億年です。'],
        sol: [[`$\\sqrt{\\Omega_\\Lambda/\\Omega_m} = ${n(Math.sqrt(OL / Om), 4)}$, $\\operatorname{arsinh} = ${n(Math.asinh(Math.sqrt(OL / Om)), 4)}$.`, `$\\sqrt{\\Omega_\\Lambda/\\Omega_m} = ${n(Math.sqrt(OL / Om), 4)}$、$\\operatorname{arsinh} = ${n(Math.asinh(Math.sqrt(OL / Om)), 4)}$ です。`], [`$t_0 = \\dfrac{2 \\times 14.44}{3 \\times ${n(Math.sqrt(OL), 4)}} \\times ${n(Math.asinh(Math.sqrt(OL / Om)), 4)} = ${n(t0, 3)}$ Gyr.`, `$t_0 = \\dfrac{2 \\times 14.44}{3 \\times ${n(Math.sqrt(OL), 4)}} \\times ${n(Math.asinh(Math.sqrt(OL / Om)), 4)} = ${n(t0, 3)}$ 十億年です。`], ['Less matter means less deceleration in the past, so a longer history for the same expansion rate today.', '物質が少ないほど過去の減速が小さいので、同じ現在の膨張率に対して歴史が長くなります。']],
        set: { om: Om, ol: OL },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [Om, OL] = r.pick([[0.25, 0.75], [0.5, 0.5], [0.2, 0.8], [0.4, 0.6]]), k = Math.cbrt(Om / OL), w = 1.5 * Math.sqrt(OL);
        return {
          q: [`For a flat universe with $\\Omega_m = ${n(Om)}$, $\\Omega_\\Lambda = ${n(OL)}$, write $a(t)$ with $t$ in units of $1/H_0$, measured from the big bang.`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$ の平坦な宇宙で、ビッグバンから測った時間 $t$（単位 $1/H_0$）の関数として $a(t)$ を書いてください。`],
          a: { type: 'expr', v: `${k}*sinh(${w}*t)^(2/3)`, vars: ['t'], dom: { t: [0.2, 2] }, lhs: ['$a(t) =$', '$a(t) =$'] },
          hint: ['Try $a = A\\sinh^{2/3}(Bt)$: matter-like ($t^{2/3}$) early, exponential late.', '$a = A\\sinh^{2/3}(Bt)$ と置いてみます。初期は物質的（$t^{2/3}$）、後期は指数的です。'],
          sol: [['With $a = A\\sinh^{2/3}(Bt)$, $(\\dot a/a)^2 = \\tfrac49B^2\\coth^2(Bt) = \\tfrac49B^2(1 + 1/\\sinh^2 Bt)$.', '$a = A\\sinh^{2/3}(Bt)$ とすると $(\\dot a/a)^2 = \\tfrac49B^2\\coth^2(Bt) = \\tfrac49B^2(1 + 1/\\sinh^2 Bt)$ です。'], [`Matching $\\Omega_\\Lambda + \\Omega_m a^{-3}$: $B = \\tfrac32\\sqrt{\\Omega_\\Lambda} = ${n(w, 4)}$ and $A^3 = \\Omega_m/\\Omega_\\Lambda$, so $A = ${n(k, 4)}$.`, `$\\Omega_\\Lambda + \\Omega_m a^{-3}$ と比べると $B = \\tfrac32\\sqrt{\\Omega_\\Lambda} = ${n(w, 4)}$、$A^3 = \\Omega_m/\\Omega_\\Lambda$ なので $A = ${n(k, 4)}$ です。`], [`$a(t) = ${n(k, 4)}\\sinh^{2/3}(${n(w, 4)}\\,t)$. Setting $a = 1$ recovers the age formula with the arsinh.`, `$a(t) = ${n(k, 4)}\\sinh^{2/3}(${n(w, 4)}\\,t)$ です。$a = 1$ とおくと arsinh を含む年齢の式が得られます。`]],
          set: { om: Om, ol: OL },
        };
      }
      if (form === 1) {
        let Om, OL, f;
        do { Om = r.pick([0.3, 1, 2, 3, 0.5, 1.5, 0.1]); OL = r.pick([-0.5, -0.2, 0, 0.7, 1.5, 2.5, 3, 0.1]); f = fate(Om, OL); } while (Math.abs(minE2(Om, OL, 1e-4, 1)) < 0.02 || (OL >= 0 && Math.abs(minE2(Om, OL, 1, 1e4)) < 0.01));
        const opts = [['It never had a big bang: $a(t)$ bounces off a minimum.', 'ビッグバンがなく、$a(t)$ は最小値で跳ね返ります。'], ['It recollapses to a big crunch.', 'ビッグクランチへ再収縮します。'], ['It expands forever.', '永遠に膨張します。']];
        return {
          q: [`Classify the universe with $\\Omega_m = ${n(Om)}$, $\\Omega_\\Lambda = ${n(OL)}$.`, `$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$ の宇宙を分類してください。`],
          a: { type: 'choice', opts, v: f, fixed: true },
          hint: ['Ask whether $E^2(a) = \\Omega_m a^{-3} + \\Omega_k a^{-2} + \\Omega_\\Lambda$ reaches zero for some $a < 1$ (no big bang) or some $a > 1$ (turnaround).', '$E^2(a) = \\Omega_m a^{-3} + \\Omega_k a^{-2} + \\Omega_\\Lambda$ が $a < 1$ で 0 になるか（ビッグバンなし）、$a > 1$ で 0 になるか（折り返し）を調べます。'],
          sol: [[`$\\Omega_k = ${n(r2(1 - Om - OL))}$, so $E^2(a) = ${n(Om)}a^{-3} ${1 - Om - OL < 0 ? '-' : '+'} ${n(Math.abs(r2(1 - Om - OL)))}a^{-2} ${OL < 0 ? '-' : '+'} ${n(Math.abs(OL))}$.`, `$\\Omega_k = ${n(r2(1 - Om - OL))}$ なので $E^2(a) = ${n(Om)}a^{-3} ${1 - Om - OL < 0 ? '-' : '+'} ${n(Math.abs(r2(1 - Om - OL)))}a^{-2} ${OL < 0 ? '-' : '+'} ${n(Math.abs(OL))}$ です。`], [f === 0 ? 'It vanishes at some $a < 1$: running backwards, the expansion stops and reverses before $a$ reaches 0, so there was no big bang.' : f === 1 ? (OL < 0 ? 'A negative $\\Omega_\\Lambda$ always wins at large $a$, so $E^2$ reaches zero for some $a > 1$: the expansion halts and reverses.' : 'Matter and positive curvature outweigh the small $\\Lambda$, so $E^2$ reaches zero for some $a > 1$: the expansion halts and reverses.') : '$E^2$ stays positive for all $a$, so $\\dot a$ never vanishes: from a big bang it expands forever.', f === 0 ? '$a < 1$ のある点で 0 になります。過去にさかのぼると、$a$ が 0 になる前に膨張が止まって反転するので、ビッグバンはありませんでした。' : f === 1 ? (OL < 0 ? '負の $\\Omega_\\Lambda$ は大きな $a$ で必ず勝つので、$E^2$ は $a > 1$ のある点で 0 になり、膨張は止まって反転します。' : '物質と正の曲率が小さな $\\Lambda$ に勝るので、$E^2$ は $a > 1$ のある点で 0 になり、膨張は止まって反転します。') : '$E^2$ はすべての $a$ で正なので $\\dot a$ は 0 にならず、ビッグバンから永遠に膨張します。']],
          set: { om: Om, ol: OL },
        };
      }
      const zt = r.pick([0.5, 0.6, 0.7, 0.8, 1, 0.4]), a3 = (1 / (1 + zt)) ** 3, Om = 2 * a3 / (1 + 2 * a3);
      return {
        q: [`In a flat universe ($\\Omega_m + \\Omega_\\Lambda = 1$), what $\\Omega_m$ makes the expansion start accelerating at redshift $z = ${n(zt)}$?`, `平坦な宇宙（$\\Omega_m + \\Omega_\\Lambda = 1$）で、膨張が赤方偏移 $z = ${n(zt)}$ で加速に転じるには $\\Omega_m$ はいくつであればよいですか。`],
        a: { type: 'num', v: Om, tol: 2e-3 },
        hint: ['Set $a^3 = \\Omega_m/(2(1 - \\Omega_m))$ with $a = 1/(1 + z)$ and solve for $\\Omega_m$.', '$a = 1/(1 + z)$ として $a^3 = \\Omega_m/(2(1 - \\Omega_m))$ とおき、$\\Omega_m$ について解きます。'],
        sol: [[`$a = 1/${n(1 + zt)}$, $a^3 = ${n(a3, 4)}$.`, `$a = 1/${n(1 + zt)}$、$a^3 = ${n(a3, 4)}$ です。`], [`$\\Omega_m = 2a^3/(1 + 2a^3) = ${n(2 * a3, 4)}/${n(1 + 2 * a3, 4)} = ${n(Om, 4)}$.`, `$\\Omega_m = 2a^3/(1 + 2a^3) = ${n(2 * a3, 4)}/${n(1 + 2 * a3, 4)} = ${n(Om, 4)}$ です。`], ['The measured transition near $z \\approx 0.6$ is one of the ways the matter density is pinned at about 0.3.', '観測された $z \\approx 0.6$ 付近の転換は、物質密度を約 0.3 に絞り込む方法の一つです。']],
        set: { om: r2(Om), ol: r2(1 - Om) },
      };
    },
  ];

  /* ---------- 2. Distances and redshift ---------- */
  Q.distances = [
    (r) => {
      const form = r.int(0, 2);
      const H0 = r.pick([67.7, 70, 73, 60]);
      if (form === 0) {
        const d = r.pick([10, 20, 50, 100, 16.5, 40]);
        return {
          q: [`With $H_0 = ${H0}$ km/s/Mpc, how fast does a galaxy $${d}$ Mpc away recede, by Hubble's law?`, `$H_0 = ${H0}$ km/s/Mpc のとき、ハッブルの法則によると $${d}$ Mpc 先の銀河の後退速度はいくつですか。`],
          a: { type: 'num', v: H0 * d, rel: 0.005, unit: ['km/s', 'km/s'] },
          hint: ['$v = H_0 d$.', '$v = H_0 d$ です。'],
          sol: [[`$v = ${H0} \\times ${d} = ${n(H0 * d, 4)}$ km/s.`, `$v = ${H0} \\times ${d} = ${n(H0 * d, 4)}$ km/s です。`], [d <= 20 ? 'At this distance peculiar velocities of a few hundred km/s are comparable, so a single galaxy is a poor measure of $H_0$.' : `That is $z \\approx v/c = ${n(H0 * d / CKM, 4)}$, small enough for the linear law.`, d <= 20 ? 'この距離では数百 km/s の特異速度が同程度になるので、1つの銀河では $H_0$ をうまく測れません。' : `$z \\approx v/c = ${n(H0 * d / CKM, 4)}$ で、線形の法則が使えるほど小さい値です。`]],
          set: { h0: H0 },
        };
      }
      if (form === 1) {
        const z = r.pick([0.01, 0.02, 0.005, 0.03, 0.015]);
        return {
          q: [`A galaxy has redshift $z = ${z}$. With $H_0 = ${H0}$ km/s/Mpc, roughly how far away is it, in Mpc?`, `銀河の赤方偏移が $z = ${z}$ です。$H_0 = ${H0}$ km/s/Mpc のとき、およそ何 Mpc 先にありますか。`],
          a: { type: 'num', v: CKM * z / H0, rel: 0.01, unit: ['Mpc', 'Mpc'] },
          hint: ['For small $z$, $v \\approx cz$ and $d = v/H_0$.', '$z$ が小さいときは $v \\approx cz$、$d = v/H_0$ です。'],
          sol: [[`$cz = ${n(CKM * z, 4)}$ km/s.`, `$cz = ${n(CKM * z, 4)}$ km/s です。`], [`$d = ${n(CKM * z, 4)}/${H0} = ${n(CKM * z / H0, 3)}$ Mpc. All three distances in the figure agree at this redshift to about ${n(z * 100)}%.`, `$d = ${n(CKM * z, 4)}/${H0} = ${n(CKM * z / H0, 3)}$ Mpc です。この赤方偏移では、図の3つの距離はおよそ ${n(z * 100)}% の範囲で一致します。`]],
          set: { h0: H0, scale: 1 },
        };
      }
      const z = r.pick([0.5, 1, 2, 3, 1.5, 4]), DM = r.pick([1.9, 3.4, 5.2, 2.5, 4.4]);
      const want = r.int(0, 1);
      return {
        q: [`A source at $z = ${n(z)}$ has transverse comoving distance $D_M = ${n(DM)}$ Gpc. What is its ${want ? 'angular-diameter distance $D_A$' : 'luminosity distance $D_L$'}?`, `$z = ${n(z)}$ の天体の横方向共動距離が $D_M = ${n(DM)}$ Gpc です。${want ? '角径距離 $D_A$' : '光度距離 $D_L$'} はいくつですか。`],
        a: { type: 'num', v: want ? DM / (1 + z) : DM * (1 + z), unit: ['Gpc', 'Gpc'] },
        hint: [want ? 'The ruler was emitted when the universe was $1 + z$ times smaller.' : 'Each photon loses energy and photons arrive less often: two factors of $1 + z$ in the flux.', want ? '物差しの光が出たとき、宇宙は $1 + z$ 倍小さかったのです。' : '光子はエネルギーを失い、到着頻度も下がります。フラックスには $1 + z$ が2つ掛かります。'],
        sol: [[want ? `$D_A = D_M/(1 + z) = ${n(DM)}/${n(1 + z)} = ${n(DM / (1 + z), 4)}$ Gpc.` : `$D_L = (1 + z)D_M = ${n(1 + z)} \\times ${n(DM)} = ${n(DM * (1 + z), 4)}$ Gpc.`, want ? `$D_A = D_M/(1 + z) = ${n(DM)}/${n(1 + z)} = ${n(DM / (1 + z), 4)}$ Gpc です。` : `$D_L = (1 + z)D_M = ${n(1 + z)} \\times ${n(DM)} = ${n(DM * (1 + z), 4)}$ Gpc です。`], [`Either way $D_L/D_A = (1 + z)^2 = ${n((1 + z) ** 2)}$, in any Friedmann universe.`, `いずれにせよ、どのフリードマン宇宙でも $D_L/D_A = (1 + z)^2 = ${n((1 + z) ** 2)}$ です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      const H0 = r.pick([67.7, 70, 60]), cH = CKM / H0; // Mpc
      if (form === 0) {
        const z = r.pick([0.05, 0.1, 0.15, 0.2]), [Om, OL] = r.pick([[0.31, 0.69], [1, 0], [0.3, 0], [0.3, 0.7]]), q0 = Om / 2 - OL;
        const dl = cH * z * (1 + 0.5 * (1 - q0) * z);
        return {
          q: [`Using $D_L \\approx \\dfrac{cz}{H_0}\\Big[1 + \\tfrac12(1 - q_0)z\\Big]$, find the luminosity distance at $z = ${z}$ for $\\Omega_m = ${n(Om)}$, $\\Omega_\\Lambda = ${n(OL)}$, $H_0 = ${H0}$ km/s/Mpc. Answer in Mpc.`, `$D_L \\approx \\dfrac{cz}{H_0}\\Big[1 + \\tfrac12(1 - q_0)z\\Big]$ を使い、$\\Omega_m = ${n(Om)}$、$\\Omega_\\Lambda = ${n(OL)}$、$H_0 = ${H0}$ km/s/Mpc の $z = ${z}$ での光度距離を Mpc で求めてください。`],
          a: { type: 'num', v: dl, rel: 0.005, unit: ['Mpc', 'Mpc'] },
          hint: ['First $q_0 = \\Omega_m/2 - \\Omega_\\Lambda$.', 'まず $q_0 = \\Omega_m/2 - \\Omega_\\Lambda$ を求めます。'],
          sol: [[`$q_0 = ${n(q0)}$ and $cz/H_0 = ${n(cH * z, 4)}$ Mpc.`, `$q_0 = ${n(q0)}$、$cz/H_0 = ${n(cH * z, 4)}$ Mpc です。`], [`$D_L \\approx ${n(cH * z, 4)} \\times (1 + ${n(0.5 * (1 - q0) * z, 4)}) = ${n(dl, 4)}$ Mpc.`, `$D_L \\approx ${n(cH * z, 4)} \\times (1 + ${n(0.5 * (1 - q0) * z, 4)}) = ${n(dl, 4)}$ Mpc です。`], ['A smaller $q_0$ (acceleration) makes distant supernovae farther, hence fainter, than in a decelerating universe: exactly what was seen in 1998.', '$q_0$ が小さい（加速している）ほど遠方の超新星は減速する宇宙より遠く、したがって暗くなります。1998年に観測されたのはまさにこれでした。']],
          set: { om: Om, ol: OL, h0: H0, scale: 1 },
        };
      }
      if (form === 1) {
        const z = r.pick([1, 3, 0.5, 8, 2]), dc = 2 * cH * (1 - 1 / Math.sqrt(1 + z)), want = r.int(0, 2);
        const val = [dc, dc * (1 + z), dc / (1 + z)][want] / 1000;
        const nm = [['comoving distance $D_C$', '共動距離 $D_C$'], ['luminosity distance $D_L$', '光度距離 $D_L$'], ['angular-diameter distance $D_A$', '角径距離 $D_A$']][want];
        return {
          q: [`In the Einstein–de Sitter universe ($\\Omega_m = 1$, $H_0 = ${H0}$), $D_C = \\dfrac{2c}{H_0}\\Big(1 - \\dfrac{1}{\\sqrt{1 + z}}\\Big)$. Find the ${nm[0]} at $z = ${z}$, in Gpc.`, `アインシュタイン・ド・ジッター宇宙（$\\Omega_m = 1$、$H_0 = ${H0}$）では $D_C = \\dfrac{2c}{H_0}\\Big(1 - \\dfrac{1}{\\sqrt{1 + z}}\\Big)$ です。$z = ${z}$ での${nm[1]}を Gpc で求めてください。`],
          a: { type: 'num', v: val, rel: 0.005, unit: ['Gpc', 'Gpc'] },
          hint: ['Space is flat here, so $D_M = D_C$; then multiply or divide by $1 + z$.', 'この宇宙は平坦なので $D_M = D_C$ です。あとは $1 + z$ を掛けるか割ります。'],
          sol: [[`$c/H_0 = ${n(cH / 1000, 4)}$ Gpc, so $D_C = 2 \\times ${n(cH / 1000, 4)} \\times (1 - 1/\\sqrt{${n(1 + z)}}) = ${n(dc / 1000, 4)}$ Gpc.`, `$c/H_0 = ${n(cH / 1000, 4)}$ Gpc なので $D_C = 2 \\times ${n(cH / 1000, 4)} \\times (1 - 1/\\sqrt{${n(1 + z)}}) = ${n(dc / 1000, 4)}$ Gpc です。`], [want === 0 ? `That is the answer. Even at infinite $z$ it only reaches $2c/H_0 = ${n(2 * cH / 1000, 3)}$ Gpc: the particle horizon.` : `${want === 1 ? '$D_L = (1 + z)D_C' : '$D_A = D_C/(1 + z)'} = ${n(val, 4)}$ Gpc.`, want === 0 ? `これが答えです。$z$ が無限大でも $2c/H_0 = ${n(2 * cH / 1000, 3)}$ Gpc にしか届かず、これが粒子的地平線です。` : `${want === 1 ? '$D_L = (1 + z)D_C' : '$D_A = D_C/(1 + z)'} = ${n(val, 4)}$ Gpc です。`]],
          set: { om: 1, ol: 0, h0: H0 },
        };
      }
      const z = r.pick([0.5, 1, 2, 3, 9]), tH = GYRH(H0), tl = 2 / 3 * tH * (1 - (1 + z) ** -1.5);
      return {
        q: [`In the Einstein–de Sitter universe with $H_0 = ${H0}$, how long ago did light from $z = ${z}$ set out? ($t \\propto a^{3/2}$, $t_0 = 2/(3H_0)$.)`, `$H_0 = ${H0}$ のアインシュタイン・ド・ジッター宇宙で、$z = ${z}$ からの光はどれだけ前に出発しましたか（$t \\propto a^{3/2}$、$t_0 = 2/(3H_0)$）。`],
        a: { type: 'num', v: tl, rel: 0.005, unit: ['Gyr', '十億年'] },
        hint: ['The emission time is $t_0(1 + z)^{-3/2}$.', '放射時刻は $t_0(1 + z)^{-3/2}$ です。'],
        sol: [[`$t_0 = \\tfrac23 \\times ${n(tH, 4)} = ${n(2 / 3 * tH, 4)}$ Gyr; emission at $t_0 \\times ${n(1 + z)}^{-3/2} = ${n(2 / 3 * tH * (1 + z) ** -1.5, 4)}$ Gyr.`, `$t_0 = \\tfrac23 \\times ${n(tH, 4)} = ${n(2 / 3 * tH, 4)}$ 十億年、放射時刻は $t_0 \\times ${n(1 + z)}^{-3/2} = ${n(2 / 3 * tH * (1 + z) ** -1.5, 4)}$ 十億年です。`], [`Lookback $= ${n(tl, 4)}$ Gyr. Compare with the comoving distance: in light years it is larger, because space expanded while the light travelled.`, `過去を見ている時間は $${n(tl, 4)}$ 十億年です。光年で表した共動距離はこれより大きくなります。光が旅する間に空間が膨張したからです。`]],
        set: { om: 1, ol: 0, h0: H0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const H0 = r.pick([67.7, 70, 60, 50]), cH = CKM / H0;
        const daMax = 2 * cH * (1 - 1 / 1.5) / 2.25;
        if (r.chance(0.5)) {
          return {
            q: ['In the Einstein–de Sitter universe, at what redshift does the angular-diameter distance $D_A = \\dfrac{2c}{H_0}\\dfrac{1 - (1 + z)^{-1/2}}{1 + z}$ reach its maximum?', 'アインシュタイン・ド・ジッター宇宙で、角径距離 $D_A = \\dfrac{2c}{H_0}\\dfrac{1 - (1 + z)^{-1/2}}{1 + z}$ が最大になる赤方偏移はいくつですか。'],
            a: { type: 'num', v: 1.25, tol: 2e-3, show: '\\tfrac54' },
            hint: ['Write it in $s = (1 + z)^{-1/2}$: $D_A \\propto s^2(1 - s)$, and maximise.', '$s = (1 + z)^{-1/2}$ とおくと $D_A \\propto s^2(1 - s)$ となるので、これを最大化します。'],
            sol: [['$\\dfrac{d}{ds}\\big(s^2 - s^3\\big) = 2s - 3s^2 = 0$ gives $s = \\tfrac23$.', '$\\dfrac{d}{ds}\\big(s^2 - s^3\\big) = 2s - 3s^2 = 0$ から $s = \\tfrac23$ です。'], ['$1 + z = 1/s^2 = \\tfrac94$, so $z = \\tfrac54$.', '$1 + z = 1/s^2 = \\tfrac94$ なので $z = \\tfrac54$ です。'], [`There $D_A = \\tfrac{8}{27}\\,c/H_0 = ${n(daMax / 1000, 3)}$ Gpc for $H_0 = ${H0}$. Beyond it, more distant objects look larger again.`, `そこで $H_0 = ${H0}$ のとき $D_A = \\tfrac{8}{27}\\,c/H_0 = ${n(daMax / 1000, 3)}$ Gpc です。それより遠い天体は再び大きく見えます。`]],
            set: { om: 1, ol: 0, h0: H0 },
          };
        }
        const z = r.pick([0.5, 1.25, 3, 6, 10]), da = 2 * cH * (1 - 1 / Math.sqrt(1 + z)) / (1 + z), th = 0.1 / da * 206264.806;
        return {
          q: [`In the Einstein–de Sitter universe with $H_0 = ${H0}$, what angle in arcseconds does a galaxy $100$ kpc across subtend at $z = ${z}$?`, `$H_0 = ${H0}$ のアインシュタイン・ド・ジッター宇宙で、差し渡し $100$ kpc の銀河は $z = ${z}$ で何秒角に見えますか。`],
          a: { type: 'num', v: th, rel: 0.01, unit: ['″', '″'] },
          hint: ['$\\theta = \\ell/D_A$ with $D_A = D_C/(1 + z)$ and $D_C = \\tfrac{2c}{H_0}(1 - (1 + z)^{-1/2})$.', '$\\theta = \\ell/D_A$、$D_A = D_C/(1 + z)$、$D_C = \\tfrac{2c}{H_0}(1 - (1 + z)^{-1/2})$ です。'],
          sol: [[`$D_A = ${n(da, 4)}$ Mpc.`, `$D_A = ${n(da, 4)}$ Mpc です。`], [`$\\theta = 0.1/${n(da, 4)} = ${sig(0.1 / da, 3)}$ rad $= ${n(th, 3)}$ arcseconds.`, `$\\theta = 0.1/${n(da, 4)} = ${sig(0.1 / da, 3)}$ rad $= ${n(th, 3)}$ 秒角です。`], [z > 1.25 ? 'Past the turnover at $z = 1.25$, so this galaxy looks larger than one at the turnover would.' : 'Before the turnover at $z = 1.25$, so the angle is still shrinking with distance.', z > 1.25 ? '$z = 1.25$ の折り返し点を越えているので、この銀河は折り返し点にある銀河より大きく見えます。' : '$z = 1.25$ の折り返し点より手前なので、角度はまだ距離とともに小さくなっています。']],
          set: { om: 1, ol: 0, h0: H0 },
        };
      }
      if (form === 1) {
        return r.chance(0.5) ? {
          q: ['In the empty universe ($\\Omega_m = \\Omega_\\Lambda = 0$, so $a \\propto t$ and $\\Omega_k = 1$), write the luminosity distance $D_L$ in units of $c/H_0$ as a function of $z$.', '空の宇宙（$\\Omega_m = \\Omega_\\Lambda = 0$、したがって $a \\propto t$、$\\Omega_k = 1$）で、光度距離 $D_L$ を $c/H_0$ 単位で $z$ の関数として書いてください。'],
          a: { type: 'expr', v: 'z*(1+z/2)', vars: ['z'], dom: { z: [0.1, 5] }, lhs: ['$D_L H_0/c =$', '$D_L H_0/c =$'] },
          hint: ['Here $E(z) = 1 + z$, so $D_C = \\ln(1 + z)$; space is open, so $D_M = \\sinh D_C$.', 'ここでは $E(z) = 1 + z$ なので $D_C = \\ln(1 + z)$ です。空間は開いているので $D_M = \\sinh D_C$ です。'],
          sol: [['$D_C = \\int_0^z dz\'/(1 + z\') = \\ln(1 + z)$.', '$D_C = \\int_0^z dz\'/(1 + z\') = \\ln(1 + z)$ です。'], ['$D_M = \\sinh\\ln(1 + z) = \\tfrac12\\big((1 + z) - (1 + z)^{-1}\\big)$.', '$D_M = \\sinh\\ln(1 + z) = \\tfrac12\\big((1 + z) - (1 + z)^{-1}\\big)$ です。'], ['$D_L = (1 + z)D_M = \\tfrac12\\big((1 + z)^2 - 1\\big) = z + z^2/2$: exact, and equal to the small-$z$ formula with $q_0 = 0$.', '$D_L = (1 + z)D_M = \\tfrac12\\big((1 + z)^2 - 1\\big) = z + z^2/2$ で、厳密に $q_0 = 0$ の小さな $z$ の式と一致します。']],
          set: { om: 0, ol: 0 },
        } : {
          q: ['In the Einstein–de Sitter universe, write the comoving distance $D_C$ in units of $c/H_0$ as a function of $z$.', 'アインシュタイン・ド・ジッター宇宙で、共動距離 $D_C$ を $c/H_0$ 単位で $z$ の関数として書いてください。'],
          a: { type: 'expr', v: '2*(1-1/sqrt(1+z))', vars: ['z'], dom: { z: [0.1, 5] }, lhs: ['$D_C H_0/c =$', '$D_C H_0/c =$'] },
          hint: ['$E(z) = (1 + z)^{3/2}$; integrate $1/E$.', '$E(z) = (1 + z)^{3/2}$ なので $1/E$ を積分します。'],
          sol: [['$D_C = \\int_0^z (1 + z\')^{-3/2}\\,dz\' = \\Big[-2(1 + z\')^{-1/2}\\Big]_0^z$.', '$D_C = \\int_0^z (1 + z\')^{-3/2}\\,dz\' = \\Big[-2(1 + z\')^{-1/2}\\Big]_0^z$ です。'], ['$D_C = 2\\big(1 - (1 + z)^{-1/2}\\big)$, which tends to $2$ as $z \\to \\infty$: the particle horizon at $2c/H_0$.', '$D_C = 2\\big(1 - (1 + z)^{-1/2}\\big)$ で、$z \\to \\infty$ で 2 に近づきます。これが $2c/H_0$ の粒子的地平線です。']],
          set: { om: 1, ol: 0 },
        };
      }
      const H0 = r.pick([67.7, 70, 73]), d = r.pick([30, 50, 80, 100, 150]), mu = 5 * Math.log10(d * 1e5);
      const z = d * H0 / CKM;
      return {
        q: [`A type Ia supernova (peak absolute magnitude $M = -19.3$) is seen at apparent magnitude $m = ${n(mu - 19.3, 3)}$ in a galaxy with redshift $z = ${n(z, 4)}$. Ignoring curvature terms, what $H_0$ does it imply?`, `Ia 型超新星（最大光度の絶対等級 $M = -19.3$）が、赤方偏移 $z = ${n(z, 4)}$ の銀河で見かけの等級 $m = ${n(mu - 19.3, 3)}$ に見えます。曲率の項を無視すると、どんな $H_0$ が導かれますか。`],
        a: { type: 'num', v: H0, rel: 0.01, unit: ['km/s/Mpc', 'km/s/Mpc'] },
        hint: ['Distance modulus $m - M = 5\\log_{10}(D_L/10\\ \\text{pc})$, then $H_0 = cz/D_L$.', '距離指数 $m - M = 5\\log_{10}(D_L/10\\ \\text{pc})$ から $D_L$ を求め、$H_0 = cz/D_L$ とします。'],
        sol: [[`$m - M = ${n(mu, 3)}$, so $D_L = 10^{${n(mu, 3)}/5 + 1}$ pc $= ${n(d, 4)}$ Mpc.`, `$m - M = ${n(mu, 3)}$ なので $D_L = 10^{${n(mu, 3)}/5 + 1}$ pc $= ${n(d, 4)}$ Mpc です。`], [`$cz = ${n(CKM * z, 4)}$ km/s, so $H_0 = ${n(CKM * z, 4)}/${n(d, 4)} \\approx ${n(H0, 3)}$ km/s/Mpc.`, `$cz = ${n(CKM * z, 4)}$ km/s なので $H_0 = ${n(CKM * z, 4)}/${n(d, 4)} \\approx ${n(H0, 3)}$ km/s/Mpc です。`], ['This is how the distance ladder measures $H_0$; its value near 73 disagrees with the 67.7 inferred from the cosmic microwave background, the "Hubble tension".', 'これが距離はしごによる $H_0$ の測定法です。その値は73付近で、宇宙マイクロ波背景放射から推定される67.7と食い違っています。これが「ハッブル・テンション」です。']],
        set: { h0: H0 },
      };
    },
  ];

  /* ---------- 3. Horizons and light cones ---------- */
  Q.horizons = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const H0 = r.pick([67.7, 70, 73, 60]);
        return {
          q: [`With $H_0 = ${H0}$ km/s/Mpc, how far away is the Hubble sphere today, where recession equals $c$? Answer in billions of light years.`, `$H_0 = ${H0}$ km/s/Mpc のとき、後退速度が $c$ に等しいハッブル球は現在どれだけ遠くにありますか。十億光年単位で答えてください。`],
          a: { type: 'num', v: GYRH(H0), rel: 0.005, unit: ['Gly', '十億光年'] },
          hint: ['$d_H = c/H_0$; in light years it equals the Hubble time in years.', '$d_H = c/H_0$ で、光年で表すとハッブル時間の年数と同じ値になります。'],
          sol: [[`$c/H_0 = ${n(CKM / H0, 4)}$ Mpc $= ${n(GYRH(H0), 3)}$ Gly, since 1 Mpc $= 3.262$ million ly.`, `1 Mpc $= 326.2$ 万光年なので $c/H_0 = ${n(CKM / H0, 4)}$ Mpc $= ${n(GYRH(H0), 3)}$ 十億光年です。`], ['Galaxies beyond it recede faster than light today, yet many of them are visible: the Hubble sphere is not a horizon.', 'それより外の銀河は現在光より速く後退していますが、その多くは見えています。ハッブル球は地平線ではありません。']],
        };
      }
      if (form === 1) {
        const chi = r.pick([5, 10, 14.4, 20, 30, 40]);
        return {
          q: [`In ΛCDM ($H_0 = 67.7$, so $c/H_0 = 14.44$ Gly), a galaxy is $${chi}$ Gly away today. What is its recession speed now, in units of $c$?`, `ΛCDM（$H_0 = 67.7$、したがって $c/H_0 = 14.44$ 十億光年）で、銀河が現在 $${chi}$ 十億光年先にあります。現在の後退速度は $c$ の何倍ですか。`],
          a: { type: 'num', v: chi / 14.443, rel: 0.005 },
          hint: ['$v = H_0 d$ holds exactly for proper distance today, at any distance.', '$v = H_0 d$ は現在の固有距離について、どんな距離でも厳密に成り立ちます。'],
          sol: [[`$v/c = d/(c/H_0) = ${chi}/14.44 = ${n(chi / 14.443, 3)}$.`, `$v/c = d/(c/H_0) = ${chi}/14.44 = ${n(chi / 14.443, 3)}$ です。`], [chi > 14.45 ? 'Faster than light. That breaks no rule: it is the rate of change of distance between galaxies, not motion through space past a local observer.' : 'Slower than light, inside the Hubble sphere.', chi > 14.45 ? '光より速いのですが、規則には反しません。これは銀河間の距離の変化率であって、局所的な観測者のそばを空間を通って動く速さではないからです。' : '光より遅く、ハッブル球の内側です。']],
          set: { model: 0 },
        };
      }
      const H0 = r.pick([67.7, 70, 50]);
      return {
        q: [`In the Einstein–de Sitter universe the particle horizon today is $2c/H_0$. With $H_0 = ${H0}$, how far is that in Gly?`, `アインシュタイン・ド・ジッター宇宙の現在の粒子的地平線は $2c/H_0$ です。$H_0 = ${H0}$ のとき、何十億光年ですか。`],
        a: { type: 'num', v: 2 * GYRH(H0), rel: 0.005, unit: ['Gly', '十億光年'] },
        hint: ['The particle horizon equals the conformal age $\\eta_0 = 2/H_0$ times $c$.', '粒子的地平線は共形時間での年齢 $\\eta_0 = 2/H_0$ に $c$ を掛けたものです。'],
        sol: [[`$2c/H_0 = 2 \\times ${n(GYRH(H0), 4)} = ${n(2 * GYRH(H0), 4)}$ Gly.`, `$2c/H_0 = 2 \\times ${n(GYRH(H0), 4)} = ${n(2 * GYRH(H0), 4)}$ 十億光年です。`], [`The age is only $\\tfrac23/H_0 = ${n(2 / 3 * GYRH(H0), 3)}$ Gyr, so the horizon is three times $ct_0$: the light from the edge left matter that has since moved away.`, `年齢は $\\tfrac23/H_0 = ${n(2 / 3 * GYRH(H0), 3)}$ 十億年しかないので、地平線は $ct_0$ の3倍です。果ての光を出した物質は、その後遠ざかったのです。`]],
        set: { model: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const chi = r.pick([1, 2, 0.5, 4, 0.2]), tf = 2 / 3 * (1 + chi / 2) ** 3, G = GYRH(67.7);
        return {
          q: [`Einstein–de Sitter universe, $H_0 = 67.7$ ($1/H_0 = 14.44$ Gyr). A galaxy at comoving distance $\\chi = ${chi}\\,c/H_0$ emits a photon today. When does it reach us, in Gyr after the big bang? ($\\eta = 2\\sqrt a/H_0$.)`, `$H_0 = 67.7$（$1/H_0 = 14.44$ 十億年）のアインシュタイン・ド・ジッター宇宙です。共動距離 $\\chi = ${chi}\\,c/H_0$ の銀河が今日光子を放ちます。それはビッグバンから何十億年後に届きますか（$\\eta = 2\\sqrt a/H_0$）。`],
          a: { type: 'num', v: tf * G, rel: 0.005, unit: ['Gyr', '十億年'] },
          hint: ['On the conformal diagram the photon arrives at $\\eta = \\eta_0 + \\chi$. Convert back to $a$, then to $t = \\tfrac{2}{3H_0}a^{3/2}$.', '共形図では光子は $\\eta = \\eta_0 + \\chi$ に到着します。それを $a$ に戻し、さらに $t = \\tfrac{2}{3H_0}a^{3/2}$ に換算します。'],
          sol: [[`$\\eta_0 = 2$ (units $1/H_0$), so arrival at $\\eta = ${n(2 + chi)}$, i.e. $a = (\\eta/2)^2 = ${n((1 + chi / 2) ** 2, 4)}$.`, `$\\eta_0 = 2$（単位 $1/H_0$）なので到着は $\\eta = ${n(2 + chi)}$、つまり $a = (\\eta/2)^2 = ${n((1 + chi / 2) ** 2, 4)}$ です。`], [`$t = \\tfrac23 a^{3/2}/H_0 = \\tfrac23 \\times ${n((1 + chi / 2) ** 3, 4)} \\times 14.44 = ${n(tf * G, 4)}$ Gyr.`, `$t = \\tfrac23 a^{3/2}/H_0 = \\tfrac23 \\times ${n((1 + chi / 2) ** 3, 4)} \\times 14.44 = ${n(tf * G, 4)}$ 十億年です。`], ['The wait grows like $\\chi^3$ but stays finite: with no event horizon, every galaxy\'s light eventually arrives.', '待ち時間は $\\chi^3$ のように増えますが有限です。事象の地平線がないので、どの銀河の光もいつかは届きます。']],
          set: { model: 1 },
        };
      }
      if (form === 1) {
        const ae = r.pick([1 / 1100, 0.1, 0.25, 0.5]), aeT = { [1 / 1100]: '1/1100', 0.1: '0.1', 0.25: '0.25', 0.5: '0.5' }[ae];
        const G = GYRH(67.7), com = 2 * Math.sqrt(ae) * G, prop = ae * com;
        const want = r.int(0, 1);
        return {
          q: [`Einstein–de Sitter, $c/H_0 = 14.44$ Gly. When the scale factor was $a = ${aeT}$, how large was the particle horizon, measured as ${want ? 'a proper distance at that time' : 'a comoving distance (today\'s units)'}? Answer in ${want ? 'millions' : 'billions'} of light years.`, `アインシュタイン・ド・ジッター、$c/H_0 = 14.44$ 十億光年です。スケール因子が $a = ${aeT}$ のとき、粒子的地平線は${want ? 'その時点の固有距離' : '共動距離（現在の単位）'}でどれだけでしたか。${want ? '百万光年' : '十億光年'}単位で答えてください。`],
          a: { type: 'num', v: want ? prop * 1000 : com, rel: 0.005, unit: want ? ['Mly', '百万光年'] : ['Gly', '十億光年'] },
          hint: ['The comoving particle horizon is $c\\eta = 2\\sqrt a\\,c/H_0$; multiply by $a$ for the proper size then.', '共動粒子的地平線は $c\\eta = 2\\sqrt a\\,c/H_0$ です。その時点の固有の大きさには $a$ を掛けます。'],
          sol: [[`Comoving: $2\\sqrt{${aeT}} \\times 14.44 = ${n(com, 4)}$ Gly.`, `共動距離：$2\\sqrt{${aeT}} \\times 14.44 = ${n(com, 4)}$ 十億光年です。`], [want ? `Proper: $a \\times ${n(com, 4)} = ${n(prop * 1000, 4)}$ Mly.` : `The proper size then was $a$ times this, $${n(prop * 1000, 4)}$ Mly.`, want ? `固有距離：$a \\times ${n(com, 4)} = ${n(prop * 1000, 4)}$ 百万光年です。` : `当時の固有の大きさはこの $a$ 倍で、$${n(prop * 1000, 4)}$ 百万光年です。`], [ae < 0.01 ? 'At recombination the horizon spanned only a degree or two of today\'s sky, yet the microwave background is uniform in every direction: the horizon problem that inflation addresses.' : 'Since $\\chi_p \\propto \\sqrt a$, the horizon keeps growing: we see more of the universe every year.', ae < 0.01 ? '再結合の時点で地平線は現在の空で1度か2度にしか広がっていませんでしたが、マイクロ波背景放射はどの方向でも一様です。これがインフレーションが扱う地平線問題です。' : '$\\chi_p \\propto \\sqrt a$ なので地平線は広がり続け、私たちは毎年より多くの宇宙を見ています。']],
          set: { model: 1 },
        };
      }
      const OL = r.pick([0.69, 0.7, 0.75, 0.6]), G = GYRH(67.7);
      return {
        q: [`In a flat ΛCDM universe with $\\Omega_\\Lambda = ${n(OL)}$ and $c/H_0 = 14.44$ Gly, the Hubble radius $c/H$ approaches a final value as $a \\to \\infty$. What is it, in Gly?`, `$\\Omega_\\Lambda = ${n(OL)}$、$c/H_0 = 14.44$ 十億光年の平坦な ΛCDM 宇宙で、ハッブル半径 $c/H$ は $a \\to \\infty$ で最終的な値に近づきます。何十億光年ですか。`],
        a: { type: 'num', v: G / Math.sqrt(OL), rel: 0.005, unit: ['Gly', '十億光年'] },
        hint: ['As $a \\to \\infty$ only $\\Omega_\\Lambda$ survives in $H^2 = H_0^2(\\Omega_m a^{-3} + \\Omega_\\Lambda)$.', '$a \\to \\infty$ では $H^2 = H_0^2(\\Omega_m a^{-3} + \\Omega_\\Lambda)$ のうち $\\Omega_\\Lambda$ だけが残ります。'],
        sol: [[`$H_\\infty = H_0\\sqrt{${n(OL)}} = ${n(Math.sqrt(OL), 4)}H_0$.`, `$H_\\infty = H_0\\sqrt{${n(OL)}} = ${n(Math.sqrt(OL), 4)}H_0$ です。`], [`$c/H_\\infty = 14.44/${n(Math.sqrt(OL), 4)} = ${n(G / Math.sqrt(OL), 3)}$ Gly. The proper event horizon tends to the same value, so far in the future the two coincide.`, `$c/H_\\infty = 14.44/${n(Math.sqrt(OL), 4)} = ${n(G / Math.sqrt(OL), 3)}$ 十億光年です。固有の事象の地平線も同じ値に近づくので、遠い未来には両者が一致します。`]],
        set: { model: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const k = r.pick([2, 3, 8, 10, 27]), chi = 2 * (Math.cbrt(k) - 1), G = GYRH(67.7);
        return {
          q: [`Einstein–de Sitter, $c/H_0 = 14.44$ Gly. How far away (comoving, in Gly) is a galaxy whose light emitted today reaches us when the universe is $${k}$ times its present age?`, `アインシュタイン・ド・ジッター、$c/H_0 = 14.44$ 十億光年です。今日出した光が、宇宙が現在の年齢の $${k}$ 倍になったときに届く銀河は、共動距離で何十億光年先にありますか。`],
          a: { type: 'num', v: chi * G, rel: 0.005, unit: ['Gly', '十億光年'] },
          hint: ['$t \\propto a^{3/2} \\propto \\eta^3$, so $\\eta$ grows by $k^{1/3}$; the photon covers $\\Delta\\eta$ in comoving distance.', '$t \\propto a^{3/2} \\propto \\eta^3$ なので $\\eta$ は $k^{1/3}$ 倍になります。光子が進む共動距離は $\\Delta\\eta$ です。'],
          sol: [[`$\\eta_{\\text{arr}} = \\eta_0 k^{1/3} = 2 \\times ${n(Math.cbrt(k), 4)}$ (units $1/H_0$).`, `$\\eta_{\\text{arr}} = \\eta_0 k^{1/3} = 2 \\times ${n(Math.cbrt(k), 4)}$（単位 $1/H_0$）です。`], [`$\\chi = \\eta_{\\text{arr}} - \\eta_0 = 2(${n(Math.cbrt(k), 4)} - 1) = ${n(chi, 4)}\\,c/H_0 = ${n(chi * G, 4)}$ Gly.`, `$\\chi = \\eta_{\\text{arr}} - \\eta_0 = 2(${n(Math.cbrt(k), 4)} - 1) = ${n(chi, 4)}\\,c/H_0 = ${n(chi * G, 4)}$ 十億光年です。`], ['Doubling the age only buys about $0.52\\,c/H_0$ of reach: the conformal diagram compresses the future.', '年齢を2倍にしても届く範囲は約 $0.52\\,c/H_0$ しか増えません。共形図は未来を圧縮して描くのです。']],
          set: { model: 1 },
        };
      }
      if (form === 1) {
        const f = r.pick([0.5, 0.75, 0.9, 0.99, 0.2]), t = Math.log(1 / (1 - f));
        return {
          q: [`In pure de Sitter space ($a = e^{Ht}$, $a = 1$ now), a galaxy is at proper distance $${n(f)}\\,c/H$ today and emits a photon toward us. After how long, in units of $1/H$, does it arrive?`, `純粋なド・ジッター空間（$a = e^{Ht}$、現在 $a = 1$）で、銀河が現在の固有距離 $${n(f)}\\,c/H$ にあり、私たちに向けて光子を放ちます。単位 $1/H$ でどれだけ後に届きますか。`],
          a: { type: 'num', v: t, tol: 2e-3 },
          hint: ['The comoving distance covered is $\\int_0^t c\\,dt\'/a = \\tfrac{c}{H}(1 - e^{-Ht})$; set it equal to the galaxy\'s comoving distance.', '進む共動距離は $\\int_0^t c\\,dt\'/a = \\tfrac{c}{H}(1 - e^{-Ht})$ です。これを銀河の共動距離と等しくおきます。'],
          sol: [[`$1 - e^{-Ht} = ${n(f)}$, so $e^{-Ht} = ${n(1 - f)}$.`, `$1 - e^{-Ht} = ${n(f)}$ より $e^{-Ht} = ${n(1 - f)}$ です。`], [`$Ht = \\ln(1/${n(1 - f)}) = ${n(t, 4)}$.`, `$Ht = \\ln(1/${n(1 - f)}) = ${n(t, 4)}$ です。`], ['The time diverges as the distance approaches $c/H$: in de Sitter space the Hubble sphere is exactly the event horizon, and light from beyond it never arrives.', '距離が $c/H$ に近づくと時間は発散します。ド・ジッター空間ではハッブル球がちょうど事象の地平線であり、その外からの光は決して届きません。']],
          set: { model: 2 },
        };
      }
      const ae = r.pick([0.25, 0.04, 0.16, 0.01]);
      return {
        q: [`Einstein–de Sitter universe, units $c = H_0 = 1$. A photon emitted at scale factor $a_e = ${n(ae)}$ travels toward us. Write the comoving distance it has covered as a function of the scale factor $a$.`, `アインシュタイン・ド・ジッター宇宙で $c = H_0 = 1$ の単位をとります。スケール因子 $a_e = ${n(ae)}$ で放たれた光子が私たちに向かいます。進んだ共動距離をスケール因子 $a$ の関数として書いてください。`],
        a: { type: 'expr', v: `2*(sqrt(a)-${Math.sqrt(ae)})`, vars: ['a'], dom: { a: [0.35, 2] }, lhs: ['$\\chi(a) =$', '$\\chi(a) =$'] },
        hint: ['$d\\chi = c\\,dt/a = c\\,da/(a^2H)$ with $H = H_0a^{-3/2}$.', '$d\\chi = c\\,dt/a = c\\,da/(a^2H)$、$H = H_0a^{-3/2}$ です。'],
        sol: [['$d\\chi = da/(a^2 \\cdot a^{-3/2}) = a^{-1/2}\\,da$.', '$d\\chi = da/(a^2 \\cdot a^{-3/2}) = a^{-1/2}\\,da$ です。'], [`$\\chi(a) = 2\\sqrt a - 2\\sqrt{${n(ae)}} = 2\\sqrt a - ${n(2 * Math.sqrt(ae))}$.`, `$\\chi(a) = 2\\sqrt a - 2\\sqrt{${n(ae)}} = 2\\sqrt a - ${n(2 * Math.sqrt(ae))}$ です。`], ['It grows without bound, so in this universe any source is eventually seen, however far: there is no event horizon.', 'これは限りなく大きくなるので、この宇宙ではどんなに遠い光源もいつかは見えます。事象の地平線はありません。']],
        set: { model: 1 },
      };
    },
  ];
})();
