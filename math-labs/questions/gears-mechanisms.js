'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;
  const PI = Math.PI, DEG = PI / 180;
  const ALPHAS = [14.5, 20, 25];
  const VPH = [18000, 21600, 25200, 28800, 36000];
  const pn = (x, d = 4) => (x < 0 ? `(${n(x, d)})` : n(x, d));
  function mesh(z1, z2, a0deg, da = 0, m = 1) {
    const a0 = a0deg * DEG, r1 = m * z1 / 2, r2 = m * z2 / 2, rb1 = r1 * Math.cos(a0), rb2 = r2 * Math.cos(a0), ra1 = r1 + m, ra2 = r2 + m;
    const ad = r1 + r2, a = ad + da * m, ap = Math.acos(ad * Math.cos(a0) / a);
    const s1 = Math.sqrt(ra1 * ra1 - rb1 * rb1), s2 = Math.sqrt(ra2 * ra2 - rb2 * rb2), pb = PI * m * Math.cos(a0);
    return { r1, r2, rb1, rb2, ra1, ra2, ad, a, ap, s1, s2, pb, eps: (s1 + s2 - a * Math.sin(ap)) / pb, backlash: 2 * da * m * Math.tan(ap) };
  }

  /* ---------------- 1. involute gearing ---------------- */
  Q['involute-gearing'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const z1 = r.int(12, 40); let z2; do { z2 = r.int(12, 60); } while (z2 === z1);
        const N = r.pick([600, 900, 1200, 1500, 1800, 3000]), N2 = N * z1 / z2;
        return {
          q: [`A driving gear of $z_1 = ${z1}$ teeth turns at ${N} rpm and meshes with a gear of $z_2 = ${z2}$ teeth. How fast does the driven gear turn, in rpm?`, `歯数 $z_1 = ${z1}$ の駆動歯車が ${N} rpm で回り、歯数 $z_2 = ${z2}$ の歯車とかみ合っています。被動歯車は何 rpm で回りますか。`],
          a: { type: 'num', v: N2, rel: 0.002, unit: ['rpm', 'rpm'] },
          hint: ['Teeth pass the mesh at the same rate on both gears.', 'かみ合い部を通過する歯の数は両方の歯車で同じです。'],
          sol: [[`Teeth per minute through the mesh: $${N} \\times ${z1} = ${N * z1}$.`, `毎分かみ合い部を通過する歯の数は $${N} \\times ${z1} = ${N * z1}$ です。`], [`The driven gear needs $${z2}$ of them per turn: $${N * z1}/${z2} = ${n(N2, 3)}$ rpm, in the opposite direction. ${z2 > z1 ? 'A larger driven gear slows the output and multiplies the torque.' : 'A smaller driven gear speeds the output up.'}`, `被動歯車は一回転に $${z2}$ 歯を必要とするので $${N * z1}/${z2} = ${n(N2, 3)}$ rpm で、向きは逆です。${z2 > z1 ? '被動歯車が大きいと出力は遅くなり、トルクは増えます。' : '被動歯車が小さいと出力は速くなります。'}`]],
          set: { z1, z2 },
        };
      }
      if (form === 1) {
        const m = r.pick([0.5, 1, 1.25, 1.5, 2, 2.5, 3, 4]), z = r.int(12, 60);
        return {
          q: [`A standard spur gear has module $m = ${n(m)}$ mm and $z = ${z}$ teeth. What are its pitch diameter and its tip (outside) diameter, in mm?`, `モジュール $m = ${n(m)}$ mm、歯数 $z = ${z}$ の標準平歯車があります。ピッチ円直径と歯先円直径は何 mm ですか。`],
          a: { type: 'tuple', v: [m * z, m * (z + 2)], labels: [['pitch', 'ピッチ円'], ['tip', '歯先円']], tol: 0.001 },
          hint: ['The module is pitch diameter per tooth; a standard tooth stands one module above the pitch circle.', 'モジュールは歯 1 枚あたりのピッチ円直径です。標準の歯はピッチ円から 1 モジュール突き出します。'],
          sol: [[`Pitch diameter $d = mz = ${n(m)} \\times ${z} = ${n(m * z)}$ mm.`, `ピッチ円直径は $d = mz = ${n(m)} \\times ${z} = ${n(m * z)}$ mm です。`], [`The addendum is $m$ on each side: $d_a = m(z + 2) = ${n(m * (z + 2))}$ mm. Two gears mesh only if they share the same module.`, `歯末のたけは両側とも $m$ なので $d_a = m(z + 2) = ${n(m * (z + 2))}$ mm です。二つの歯車は同じモジュールのときにだけかみ合います。`]],
        };
      }
      const m = r.pick([1, 1.5, 2, 2.5, 3]), z1 = r.int(12, 40), z2 = r.int(12, 60);
      return {
        q: [`Two standard gears of module $${n(m)}$ mm have $${z1}$ and $${z2}$ teeth. At what centre distance should their axles be placed, in mm?`, `モジュール $${n(m)}$ mm の二つの標準歯車の歯数は $${z1}$ と $${z2}$ です。軸の中心距離を何 mm にすればよいですか。`],
        a: { type: 'num', v: m * (z1 + z2) / 2, tol: 0.001, unit: ['mm', 'mm'] },
        hint: ['At the standard distance the pitch circles just touch.', '標準の中心距離ではピッチ円どうしがちょうど接します。'],
        sol: [[`Pitch radii $${n(m)} \\times ${z1}/2 = ${n(m * z1 / 2)}$ and $${n(m)} \\times ${z2}/2 = ${n(m * z2 / 2)}$ mm.`, `ピッチ円半径は $${n(m)} \\times ${z1}/2 = ${n(m * z1 / 2)}$ と $${n(m)} \\times ${z2}/2 = ${n(m * z2 / 2)}$ mm です。`], [`$a = m(z_1 + z_2)/2 = ${n(m * (z1 + z2) / 2)}$ mm. Place them farther apart and they still mesh at the same ratio, only with backlash and a larger pressure angle.`, `$a = m(z_1 + z_2)/2 = ${n(m * (z1 + z2) / 2)}$ mm です。これより離しても同じ比でかみ合いますが、バックラッシュが生じ圧力角が大きくなります。`]],
        set: m === 1 ? { z1, z2, da: 0 } : { z1, z2 },
      };
    },
    (r) => {
      const form = r.int(0, 2), ai = r.int(0, 2), a0 = ALPHAS[ai], z1 = r.int(12, 40), z2 = r.int(12, 60);
      if (form === 0) {
        const M = mesh(z1, z2, a0);
        return {
          q: [`Two standard gears of module 1 with $z_1 = ${z1}$, $z_2 = ${z2}$ and pressure angle $${a0}^\\circ$ run at the standard centre distance. What is their contact ratio $\\varepsilon$?`, `モジュール 1、$z_1 = ${z1}$、$z_2 = ${z2}$、圧力角 $${a0}^\\circ$ の二つの標準歯車が標準の中心距離でかみ合っています。かみ合い率 $\\varepsilon$ はいくつですか。`],
          a: { type: 'num', v: M.eps, tol: 0.004 },
          hint: ['Length of contact along the line of action, $\\sqrt{r_{a1}^2 - r_{b1}^2} + \\sqrt{r_{a2}^2 - r_{b2}^2} - a\\sin\\alpha$, divided by the base pitch $\\pi m\\cos\\alpha$.', '作用線に沿った接触の長さ $\\sqrt{r_{a1}^2 - r_{b1}^2} + \\sqrt{r_{a2}^2 - r_{b2}^2} - a\\sin\\alpha$ を基礎ピッチ $\\pi m\\cos\\alpha$ で割ります。'],
          sol: [[`Base radii $r_{b} = r\\cos ${a0}^\\circ$: $${n(M.rb1, 4)}$ and $${n(M.rb2, 4)}$; tip radii $${n(M.ra1)}$ and $${n(M.ra2)}$; $a = ${n(M.a)}$.`, `基礎円半径 $r_{b} = r\\cos ${a0}^\\circ$ は $${n(M.rb1, 4)}$ と $${n(M.rb2, 4)}$、歯先円半径は $${n(M.ra1)}$ と $${n(M.ra2)}$、$a = ${n(M.a)}$ です。`], [`Length of contact $${n(M.s1, 4)} + ${n(M.s2, 4)} - ${n(M.a)}\\sin ${a0}^\\circ = ${n(M.s1 + M.s2 - M.a * Math.sin(M.ap), 4)}$; base pitch $\\pi\\cos ${a0}^\\circ = ${n(M.pb, 4)}$.`, `接触の長さは $${n(M.s1, 4)} + ${n(M.s2, 4)} - ${n(M.a)}\\sin ${a0}^\\circ = ${n(M.s1 + M.s2 - M.a * Math.sin(M.ap), 4)}$、基礎ピッチは $\\pi\\cos ${a0}^\\circ = ${n(M.pb, 4)}$ です。`], [`$\\varepsilon = ${n(M.eps, 3)}$: on average ${n(M.eps, 2)} pairs of teeth share the load, so a new pair always engages before the old one lets go.`, `$\\varepsilon = ${n(M.eps, 3)}$ です。平均 ${n(M.eps, 2)} 組の歯が荷重を分担するので、古い組が離れる前に必ず新しい組がかみ合います。`]],
          set: { z1, z2, alpha: ai, da: 0 },
        };
      }
      if (form === 1) {
        const da = r.step(0.1, 0.6, 0.02), M = mesh(z1, z2, a0, da);
        return {
          q: [`Gears of module 1 with $${z1}$ and $${z2}$ teeth and $\\alpha_0 = ${a0}^\\circ$ are mounted $\\Delta a = ${n(da)}$ mm farther apart than standard. What is the operating pressure angle $\\alpha'$, in degrees?`, `モジュール 1、歯数 $${z1}$ と $${z2}$、$\\alpha_0 = ${a0}^\\circ$ の歯車を標準より $\\Delta a = ${n(da)}$ mm 離して取り付けました。運転圧力角 $\\alpha'$ は何度ですか。`],
          a: { type: 'num', v: M.ap / DEG, tol: 0.02, unit: ['°', '°'] },
          hint: ['The base circles do not change, and the line of action stays tangent to both: $a\'\\cos\\alpha\' = a_0\\cos\\alpha_0$.', '基礎円は変わらず、作用線は両方に接したままです。$a\'\\cos\\alpha\' = a_0\\cos\\alpha_0$ です。'],
          sol: [[`$a_0 = (${z1} + ${z2})/2 = ${n(M.ad)}$ and $a' = ${n(M.a)}$.`, `$a_0 = (${z1} + ${z2})/2 = ${n(M.ad)}$、$a' = ${n(M.a)}$ です。`], [`$\\cos\\alpha' = ${n(M.ad)}\\cos ${a0}^\\circ/${n(M.a)} = ${n(Math.cos(M.ap), 5)}$, so $\\alpha' = ${n(M.ap / DEG, 3)}^\\circ$.`, `$\\cos\\alpha' = ${n(M.ad)}\\cos ${a0}^\\circ/${n(M.a)} = ${n(Math.cos(M.ap), 5)}$ より $\\alpha' = ${n(M.ap / DEG, 3)}^\\circ$ です。`], ['The line of action tilts, pushing the shafts apart a little harder, but the ratio is still $z_2/z_1$ exactly: the base circles fix it.', '作用線が傾いて軸を押し離す力が少し強くなりますが、比はなお正確に $z_2/z_1$ です。基礎円がそれを決めているからです。']],
          set: { z1, z2, alpha: ai, da },
        };
      }
      const m = r.pick([1, 1.5, 2, 3, 4]), z = r.int(12, 60), rb = m * z / 2 * Math.cos(a0 * DEG);
      return {
        q: [`A gear of module $${n(m)}$ mm with $${z}$ teeth is cut with pressure angle $${a0}^\\circ$. What is the radius of its base circle, the circle its involute flanks unwind from, in mm?`, `モジュール $${n(m)}$ mm、歯数 $${z}$ の歯車を圧力角 $${a0}^\\circ$ で切りました。インボリュートの歯面がほどけ出す円、すなわち基礎円の半径は何 mm ですか。`],
        a: { type: 'num', v: rb, tol: 0.002, unit: ['mm', 'mm'] },
        hint: ['The line of action makes the pressure angle with the pitch-circle tangent, and it is tangent to the base circle.', '作用線はピッチ円の接線と圧力角をなし、基礎円に接します。'],
        sol: [[`Pitch radius $r = mz/2 = ${n(m * z / 2)}$ mm.`, `ピッチ円半径は $r = mz/2 = ${n(m * z / 2)}$ mm です。`], [`$r_b = r\\cos\\alpha_0 = ${n(m * z / 2)}\\cos ${a0}^\\circ = ${n(rb, 4)}$ mm. Below the base circle there is no involute, which is why small gears with a small pressure angle risk undercut roots.`, `$r_b = r\\cos\\alpha_0 = ${n(m * z / 2)}\\cos ${a0}^\\circ = ${n(rb, 4)}$ mm です。基礎円より内側にはインボリュートがないので、圧力角の小さい小歯車は歯元の切り下げを起こしやすくなります。`]],
        set: m === 1 ? { z2: z, alpha: ai } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const ai = r.int(0, 2), a0 = ALPHAS[ai], z1 = r.int(14, 40), z2 = r.int(20, 60), da = r.step(0.1, 0.6, 0.02), M0 = mesh(z1, z2, a0), M = mesh(z1, z2, a0, da);
        return {
          q: [`Module-1 gears with $${z1}$ and $${z2}$ teeth ($\\alpha_0 = ${a0}^\\circ$) have contact ratio $${n(M0.eps, 3)}$ at the standard distance. What does it become when the centres are pulled $${n(da)}$ mm apart?`, `モジュール 1、歯数 $${z1}$ と $${z2}$（$\\alpha_0 = ${a0}^\\circ$）の歯車の、標準の中心距離でのかみ合い率は $${n(M0.eps, 3)}$ です。中心を $${n(da)}$ mm 離すといくつになりますか。`],
          a: { type: 'num', v: M.eps, tol: 0.004 },
          hint: ['The tip and base circles stay; only $a$ and the operating angle $\\alpha\'$ change in the term $a\\sin\\alpha\'$. The base pitch is unchanged.', '歯先円と基礎円は変わらず、$a\\sin\\alpha\'$ の項の $a$ と運転圧力角 $\\alpha\'$ だけが変わります。基礎ピッチも変わりません。'],
          sol: [[`$\\cos\\alpha' = ${n(M.ad)}\\cos ${a0}^\\circ/${n(M.a)}$ gives $\\alpha' = ${n(M.ap / DEG, 3)}^\\circ$ and $a'\\sin\\alpha' = ${n(M.a * Math.sin(M.ap), 4)}$, up from $${n(M0.a * Math.sin(M0.ap), 4)}$.`, `$\\cos\\alpha' = ${n(M.ad)}\\cos ${a0}^\\circ/${n(M.a)}$ から $\\alpha' = ${n(M.ap / DEG, 3)}^\\circ$、$a'\\sin\\alpha' = ${n(M.a * Math.sin(M.ap), 4)}$ で、$${n(M0.a * Math.sin(M0.ap), 4)}$ から増えています。`], [`$\\varepsilon = (${n(M.s1, 4)} + ${n(M.s2, 4)} - ${n(M.a * Math.sin(M.ap), 4)})/${n(M.pb, 4)} = ${n(M.eps, 3)}$.`, `$\\varepsilon = (${n(M.s1, 4)} + ${n(M.s2, 4)} - ${n(M.a * Math.sin(M.ap), 4)})/${n(M.pb, 4)} = ${n(M.eps, 3)}$ です。`], [M.eps < 1.2 ? 'Below about 1.2 the mesh becomes rough: for part of each cycle a single pair carries everything, and any tooth error shows up as noise.' : 'The overlap shrinks because the tips meet the line of action later and leave it earlier, but there is still margin above 1.', M.eps < 1.2 ? '約 1.2 を下回るとかみ合いは粗くなります。各周期の一部で一組の歯がすべてを担い、歯の誤差が騒音として現れます。' : '歯先が作用線に入るのが遅く、出るのが早くなるので重なりは減りますが、1 を上回る余裕はまだあります。']],
          set: { z1, z2, alpha: ai, da },
        };
      }
      if (form === 1) {
        const ai = r.int(0, 2), a0 = ALPHAS[ai], zmin = 2 / Math.sin(a0 * DEG) ** 2;
        return {
          q: [`A gear generated by a standard rack (addendum one module) has its flanks undercut when it has fewer than $2/\\sin^2\\alpha_0$ teeth. Evaluate this limit for $\\alpha_0 = ${a0}^\\circ$.`, `標準ラック（歯末のたけ 1 モジュール）で創成した歯車は、歯数が $2/\\sin^2\\alpha_0$ より少ないと歯面が切り下げられます。$\\alpha_0 = ${a0}^\\circ$ についてこの限界を求めてください。`],
          a: { type: 'num', v: zmin, tol: 0.05 },
          hint: ['The rack’s tip line must not cross the line of action beyond the interference point, where it touches the base circle.', 'ラックの歯先線が、作用線と基礎円の接点（干渉点）を越えて作用線と交わってはいけません。'],
          sol: [['The interference point lies $r\\sin^2\\alpha_0$ below the pitch line, measured along the radius; the rack addendum $m$ must not exceed it, so $m \\le (mz/2)\\sin^2\\alpha_0$.', '干渉点は、半径に沿って測ってピッチ線から $r\\sin^2\\alpha_0$ だけ内側にあります。ラックの歯末のたけ $m$ はこれを超えてはならないので $m \\le (mz/2)\\sin^2\\alpha_0$ です。'], [`$z \\ge 2/\\sin^2 ${a0}^\\circ = ${n(zmin, 2)}$. ${a0 === 14.5 ? 'The old 14.5° standard needs about 32 teeth, which is why it gave way to 20°.' : a0 === 20 ? 'For 20° the limit is 17.1: gears of 17 teeth are used with a negligible undercut, fewer need a profile shift.' : 'A 25° pressure angle allows pinions down to about 12 teeth, at the cost of larger bearing loads.'}`, `$z \\ge 2/\\sin^2 ${a0}^\\circ = ${n(zmin, 2)}$ です。${a0 === 14.5 ? '古い 14.5° の規格では約 32 歯が必要で、それが 20° に置き換えられた理由です。' : a0 === 20 ? '20° では限界は 17.1 で、17 歯の歯車はわずかな切り下げのまま使われ、それより少ない場合は転位が必要です。' : '25° の圧力角ではおよそ 12 歯までのピニオンが使えますが、軸受の荷重は大きくなります。'}`]],
          set: { alpha: ai },
        };
      }
      if (form === 2) {
        let z1, i, z2; do { z1 = r.int(12, 30); i = r.pick([1.5, 2, 2.5, 3, 4 / 3, 5 / 3]); z2 = z1 * i; } while (Math.abs(z2 - Math.round(z2)) > 1e-9 || z2 > 60);
        z2 = Math.round(z2); const m = r.pick([1, 1.5, 2, 2.5, 3]), a = m * (z1 + z2) / 2;
        return {
          q: [`Design a standard spur pair of module $${n(m)}$ mm with speed ratio $\\omega_1/\\omega_2 = ${frac(z2, z1)}$ for shafts exactly $${n(a)}$ mm apart. How many teeth must each gear have?`, `モジュール $${n(m)}$ mm、速度比 $\\omega_1/\\omega_2 = ${frac(z2, z1)}$ の標準平歯車の組を、ちょうど $${n(a)}$ mm 離れた軸に設計します。それぞれの歯数はいくつですか。`],
          a: { type: 'tuple', v: [z1, z2], labels: ['$z_1$', '$z_2$'], tol: 0.01 },
          hint: ['The centre distance fixes $z_1 + z_2 = 2a/m$; the ratio fixes $z_2/z_1$.', '中心距離から $z_1 + z_2 = 2a/m$、比から $z_2/z_1$ が決まります。'],
          sol: [[`$z_1 + z_2 = 2 \\times ${n(a)}/${n(m)} = ${z1 + z2}$.`, `$z_1 + z_2 = 2 \\times ${n(a)}/${n(m)} = ${z1 + z2}$ です。`], [`With $z_2 = ${frac(z2, z1)}\\,z_1$: $z_1(1 + ${frac(z2, z1)}) = ${z1 + z2}$, so $z_1 = ${z1}$ and $z_2 = ${z2}$.`, `$z_2 = ${frac(z2, z1)}\\,z_1$ とすると $z_1(1 + ${frac(z2, z1)}) = ${z1 + z2}$ なので $z_1 = ${z1}$、$z_2 = ${z2}$ です。`], ['Both counts must be whole numbers, which is why designers juggle module, ratio and centre distance together, or shift the profiles to fit an awkward distance.', 'どちらの歯数も整数でなければならないので、設計者はモジュール、比、中心距離を一緒に調整するか、半端な距離に合わせて転位します。']],
          set: { z1, z2 },
        };
      }
      const rb = r.pick([6, 8, 9, 10, 12, 15]);
      return {
        q: [`The involute of a base circle of radius $r_b = ${rb}$ is $x = r_b(\\cos t + t\\sin t)$, $y = r_b(\\sin t - t\\cos t)$, where $t$ is the roll angle. Write the distance $r(t)$ of the involute point from the centre.`, `半径 $r_b = ${rb}$ の基礎円のインボリュートは、ころがり角 $t$ を使って $x = r_b(\\cos t + t\\sin t)$、$y = r_b(\\sin t - t\\cos t)$ です。インボリュート上の点の中心からの距離 $r(t)$ を書いてください。`],
        a: { type: 'expr', v: `${rb}*sqrt(1+t^2)`, vars: ['t'], lhs: ['$r(t) =$', '$r(t) =$'] },
        hint: ['The point is the end of a taut string: a radius $r_b$ to the tangent point, plus an unwound length $r_b t$ at right angles.', '点は張った糸の端です。接点までの半径 $r_b$ と、それに直角にほどけた長さ $r_b t$ からなります。'],
        sol: [['$x^2 + y^2 = r_b^2\\big[(\\cos t + t\\sin t)^2 + (\\sin t - t\\cos t)^2\\big] = r_b^2(1 + t^2)$: the cross terms cancel.', '$x^2 + y^2 = r_b^2\\big[(\\cos t + t\\sin t)^2 + (\\sin t - t\\cos t)^2\\big] = r_b^2(1 + t^2)$ で、交差項は打ち消し合います。'], [`So $r(t) = ${rb}\\sqrt{1 + t^2}$: Pythagoras on the radius and the unwound string. Inverting it, the flank reaches radius $R$ at roll angle $\\sqrt{R^2/r_b^2 - 1}$, which is how the tooth thickness at any radius is computed.`, `したがって $r(t) = ${rb}\\sqrt{1 + t^2}$ で、半径とほどけた糸にピタゴラスの定理を使ったものです。逆に解くと、歯面はころがり角 $\\sqrt{R^2/r_b^2 - 1}$ で半径 $R$ に達し、任意の半径での歯厚はこうして計算します。`]],
      };
    },
  ];

  /* ---------------- 2. the going train ---------------- */
  // fourth wheel period T4 = ze z4 / (f pe); centre = 60 T4; barrel = 7 x centre
  const trainCombos = [];
  for (let i = 0; i < 5; i++) for (let ze = 12; ze <= 24; ze++) for (let pe = 6; pe <= 12; pe++) { const z4 = 60 * (VPH[i] / 7200) * pe / ze; if (Math.abs(z4 - Math.round(z4)) < 1e-9 && z4 >= 60 && z4 <= 120) trainCombos.push([i, ze, pe, Math.round(z4)]); }
  Q['gear-train'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const i = r.int(0, 4), f = VPH[i] / 7200, ze = r.int(12, 24), rpm = 60 * f / ze;
        return {
          q: [`A ${VPH[i].toLocaleString('en-US')} vph balance releases a ${ze}-tooth escape wheel one tooth per oscillation. How fast does the escape wheel turn, in rpm?`, `${VPH[i].toLocaleString('en-US')} vph のてんぷが、一往復ごとに歯数 ${ze} のがんぎ車を一歯ずつ進めます。がんぎ車は何 rpm で回りますか。`],
          a: { type: 'num', v: rpm, rel: 0.002, unit: ['rpm', 'rpm'] },
          hint: ['Find oscillations per minute; each one advances one tooth.', '毎分の往復の回数を求めます。一往復で一歯進みます。'],
          sol: [[`$f = ${vt(VPH[i])}/7200 = ${n(f)}$ Hz, so $${n(60 * f)}$ oscillations a minute.`, `$f = ${vt(VPH[i])}/7200 = ${n(f)}$ Hz なので、毎分 $${n(60 * f)}$ 往復です。`], [`$${n(60 * f)}/${ze} = ${n(rpm, 4)}$ rpm: the escape wheel is the fastest arbor in the train, and its speed is set by the balance, not by the mainspring.`, `$${n(60 * f)}/${ze} = ${n(rpm, 4)}$ rpm です。がんぎ車は輪列で最も速い軸で、その速さは主ぜんまいではなくてんぷで決まります。`]],
          set: { vph: i, ze },
        };
      }
      if (form === 1) {
        const ze = r.int(12, 24);
        return {
          q: [`How many beats (tics and tocs) does the balance make while a ${ze}-tooth escape wheel turns once?`, `歯数 ${ze} のがんぎ車が一回転する間に、てんぷは何回刻み（チクとタク）ますか。`],
          a: { type: 'int', v: 2 * ze },
          hint: ['Each tooth is released in two steps, one per beat.', '各歯は二段階、つまり刻み一回ごとに半歯ずつ解放されます。'],
          sol: [['A lever escapement lets the wheel advance half a tooth at each beat: one tooth per full oscillation.', 'アンクル脱進機は刻みごとにがんぎ車を半歯ずつ進めます。一往復で一歯です。'], [`So one turn takes $2 \\times ${ze} = ${2 * ze}$ beats. That is why the escape wheel moves in visible steps in the animation.`, `したがって一回転には $2 \\times ${ze} = ${2 * ze}$ 回の刻みが要ります。アニメーションでがんぎ車が目に見えて段階的に動くのはこのためです。`]],
          set: { ze },
        };
      }
      const zb = r.pick([72, 78, 80, 84, 90, 96]), p = r.pick([10, 12, 14]), Tb = zb / p;
      return {
        q: [`The centre wheel turns once an hour. Its pinion of ${p} leaves is driven by the mainspring barrel, which has ${zb} teeth. How long does the barrel take to turn once, in hours?`, `二番車は 1 時間に一回転します。その ${p} 葉のかなを、歯数 ${zb} の香箱が駆動します。香箱が一回転するのに何時間かかりますか。`],
        a: { type: 'num', v: Tb, rel: 0.002, unit: ['h', '時間'] },
        hint: ['Down the train every mesh divides the speed by teeth over leaves.', '輪列を遡る向きには、各かみ合いで速さが歯数を葉数で割った分だけ遅くなります。'],
        sol: [[`The barrel turns $${p}/${zb}$ as fast as the centre pinion.`, `香箱は二番かなの $${p}/${zb}$ の速さで回ります。`], [`One turn takes $${zb}/${p} = ${n(Tb, 3)}$ h. A mainspring that unwinds about six or seven turns therefore lasts about two days.`, `一回転に $${zb}/${p} = ${n(Tb, 3)}$ 時間かかります。ほぼ六、七回転ほどける主ぜんまいは、したがって二日ほどもちます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const i = r.int(0, 4), f = VPH[i] / 7200, ze = r.int(12, 24), pe = r.int(6, 12), z4 = r.int(60, 120), T4 = ze * z4 / (f * pe);
        return {
          q: [`At ${VPH[i].toLocaleString('en-US')} vph, an escape wheel of ${ze} teeth sits on a pinion of ${pe} leaves, driven by a fourth wheel of ${z4} teeth. How long does the fourth wheel take to turn once, in seconds?`, `${VPH[i].toLocaleString('en-US')} vph で、歯数 ${ze} のがんぎ車が ${pe} 葉のかなに付き、それを歯数 ${z4} の四番車が駆動します。四番車が一回転するのに何秒かかりますか。`],
          a: { type: 'num', v: T4, rel: 0.002, unit: ['s', '秒'] },
          hint: ['$T_4 = z_{\\rm esc}\\,z_4/(f\\,p_{\\rm esc})$: escape wheel period times the mesh ratio.', '$T_4 = z_{\\rm esc}\\,z_4/(f\\,p_{\\rm esc})$ で、がんぎ車の周期にかみ合いの比を掛けたものです。'],
          sol: [[`Escape wheel period $${ze}/${n(f)} = ${n(ze / f, 4)}$ s.`, `がんぎ車の周期は $${ze}/${n(f)} = ${n(ze / f, 4)}$ 秒です。`], [`The fourth wheel turns $${pe}/${z4}$ as fast, so $T_4 = ${n(ze / f, 4)} \\times ${z4}/${pe} = ${n(T4, 4)}$ s. ${Math.abs(T4 - 60) < 1e-9 ? 'Exactly a minute: it can carry the seconds hand.' : 'Not 60 s, so a seconds hand on it would not keep time, however well the watch is regulated.'}`, `四番車は $${pe}/${z4}$ の速さで回るので $T_4 = ${n(ze / f, 4)} \\times ${z4}/${pe} = ${n(T4, 4)}$ 秒です。${Math.abs(T4 - 60) < 1e-9 ? 'ちょうど 1 分なので秒針を運べます。' : '60 秒ではないので、どれほどよく調整しても、そこに付けた秒針は正しく時を刻みません。'}`]],
          set: { vph: i, ze, pe, z4 },
        };
      }
      if (form === 1) {
        const [i, ze, pe, z4] = r.pick(trainCombos), f = VPH[i] / 7200;
        return {
          q: [`A ${VPH[i].toLocaleString('en-US')} vph movement has an escape wheel of ${ze} teeth on a pinion of ${pe} leaves. How many teeth must the fourth wheel have so that it turns exactly once a minute?`, `${VPH[i].toLocaleString('en-US')} vph のムーブメントで、歯数 ${ze} のがんぎ車が ${pe} 葉のかなに付いています。四番車がちょうど毎分一回転するには、歯数はいくつでなければなりませんか。`],
          a: { type: 'int', v: z4 },
          hint: ['Set $z_{\\rm esc}z_4/(f\\,p_{\\rm esc}) = 60$ and solve for $z_4$.', '$z_{\\rm esc}z_4/(f\\,p_{\\rm esc}) = 60$ とおいて $z_4$ について解きます。'],
          sol: [[`$z_4 = 60\\,f\\,p_{\\rm esc}/z_{\\rm esc} = 60 \\times ${n(f)} \\times ${pe}/${ze}$.`, `$z_4 = 60\\,f\\,p_{\\rm esc}/z_{\\rm esc} = 60 \\times ${n(f)} \\times ${pe}/${ze}$ です。`], [`$= ${z4}$ teeth. It has to come out a whole number, which constrains which escape wheels and pinions a movement designer can pair with a given beat rate.`, `$= ${z4}$ 歯です。整数にならなければならないので、ある振動数に組み合わせられるがんぎ車とかなは限られます。`]],
          set: { vph: i, ze, pe, z4 },
        };
      }
      const turns = r.step(4, 10, 0.5), zb = r.pick([78, 84, 90]), Tb = zb / 12, res = turns * Tb;
      return {
        q: [`The centre wheel turns once an hour, its 12-leaf pinion driven by a barrel of ${zb} teeth. The mainspring gives $${n(turns)}$ turns of the barrel from fully wound to stopped. What is the power reserve, in hours?`, `二番車は毎時一回転し、その 12 葉のかなを歯数 ${zb} の香箱が駆動します。主ぜんまいは全巻きから止まるまでに香箱を $${n(turns)}$ 回転させます。パワーリザーブは何時間ですか。`],
        a: { type: 'num', v: res, rel: 0.002, unit: ['h', '時間'] },
        hint: ['Find the barrel’s period first.', 'まず香箱の周期を求めます。'],
        sol: [[`Barrel period $${zb}/12 = ${n(Tb, 3)}$ h.`, `香箱の周期は $${zb}/12 = ${n(Tb, 3)}$ 時間です。`], [`Reserve $= ${n(turns)} \\times ${n(Tb, 3)} = ${n(res, 3)}$ h. More turns need a longer, thinner spring, or a second barrel.`, `パワーリザーブ $= ${n(turns)} \\times ${n(Tb, 3)} = ${n(res, 3)}$ 時間です。回転数を増やすには、より長く薄いばねか二つ目の香箱が必要です。`]],
        set: zb === 84 ? { turns } : undefined,
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const [i, ze, pe, z4] = r.pick(trainCombos), f = VPH[i] / 7200; let z4b; do { z4b = z4 + r.pick([-3, -2, -1, 1, 2, 3]); } while (z4b < 60 || z4b > 120);
        const T4 = ze * z4b / (f * pe), err = 86400 * (60 / T4 - 1);
        return {
          q: [`A ${VPH[i].toLocaleString('en-US')} vph movement with a ${ze}-tooth escape wheel and ${pe}-leaf pinion is assembled by mistake with a fourth wheel of ${z4b} teeth instead of ${z4}. Even with the balance perfectly regulated, by how many seconds a day are the hands wrong? (Positive means gaining.)`, `歯数 ${ze} のがんぎ車と ${pe} 葉のかなをもつ ${VPH[i].toLocaleString('en-US')} vph のムーブメントを、誤って歯数 ${z4} ではなく ${z4b} の四番車で組み立てました。てんぷが完全に調整されていても、針は一日何秒ずれますか（進みを正とします）。`],
          a: { type: 'num', v: err, rel: 0.002, unit: ['s/day', '秒/日'] },
          hint: ['The hands are driven by the train, so the error is $86400\\,(60/T_4 - 1)$.', '針は輪列で駆動されるので、誤差は $86400\\,(60/T_4 - 1)$ です。'],
          sol: [[`$T_4 = ${ze} \\times ${z4b}/(${n(f)} \\times ${pe}) = ${n(T4, 4)}$ s instead of 60.`, `$T_4 = ${ze} \\times ${z4b}/(${n(f)} \\times ${pe}) = ${n(T4, 4)}$ 秒で、60 秒ではありません。`], [`The hands run at $60/T_4 = ${n(60 / T4, 6)}$ of true speed: $86400 \\times (${n(60 / T4, 6)} - 1) = ${n(err, 1)}$ s/day.`, `針は本来の $60/T_4 = ${n(60 / T4, 6)}$ 倍の速さで進むので $86400 \\times (${n(60 / T4, 6)} - 1) = ${n(err, 1)}$ 秒/日です。`], ['Minutes a day: a wrong tooth count is a gross error that no regulator can reach, since the regulator only changes the balance, not the gearing.', '一日に何分ものずれです。歯数の誤りは緩急針では届かない大きな誤差です。緩急針はてんぷを変えるだけで、歯車の比は変えないからです。']],
          set: { vph: i, ze, pe, z4: z4b },
        };
      }
      if (form === 1) {
        const cands = trainCombos.filter(([i, ze, pe, z4]) => trainCombos.some(([j, a, b, c]) => j !== i && a === ze && b === pe));
        const [i, ze, pe, z4] = r.pick(cands), others = trainCombos.filter(([j, a, b]) => j !== i && a === ze && b === pe), [j, , , z4b] = r.pick(others);
        return {
          q: [`A movement beats ${VPH[i].toLocaleString('en-US')} vph with escape wheel ${ze}, escape pinion ${pe} and fourth wheel ${z4}. It is converted to ${VPH[j].toLocaleString('en-US')} vph keeping the escape wheel and pinion. What fourth wheel does the seconds hand now need?`, `振動数 ${VPH[i].toLocaleString('en-US')} vph、がんぎ車 ${ze} 歯、がんぎかな ${pe} 葉、四番車 ${z4} 歯のムーブメントを、がんぎ車とかなはそのままで ${VPH[j].toLocaleString('en-US')} vph に変えます。秒針のためには四番車は何歯必要ですか。`],
          a: { type: 'int', v: z4b },
          hint: ['$z_4$ is proportional to the frequency when everything else stays.', '他が同じなら $z_4$ は振動数に比例します。'],
          sol: [[`From $z_{\\rm esc}z_4 = 60 f p_{\\rm esc}$, $z_4 \\propto f$: multiply by $${vt(VPH[j])}/${vt(VPH[i])}$.`, `$z_{\\rm esc}z_4 = 60 f p_{\\rm esc}$ より $z_4 \\propto f$ なので、$${vt(VPH[j])}/${vt(VPH[i])}$ を掛けます。`], [`$${z4} \\times ${n(VPH[j] / VPH[i], 4)} = ${z4b}$ teeth. A faster balance needs a faster escape wheel for the same seconds hand, so the reduction to the fourth wheel must grow.`, `$${z4} \\times ${n(VPH[j] / VPH[i], 4)} = ${z4b}$ 歯です。てんぷが速いと、同じ秒針のためにがんぎ車も速く回るので、四番車までの減速比を大きくしなければなりません。`]],
          set: { vph: j, ze, pe, z4: z4b },
        };
      }
      const i = r.int(0, 4), V = VPH[i];
      return {
        q: [`In a correctly geared ${V.toLocaleString('en-US')} vph watch, how many beats does the balance make while the minute hand goes once round the dial?`, `正しく歯車が組まれた ${V.toLocaleString('en-US')} vph の時計で、分針が文字盤を一周する間に、てんぷは何回刻みますか。`],
        a: { type: 'int', v: V },
        hint: ['How long does the minute hand take to go round?', '分針が一周するのにどれだけかかるでしょうか。'],
        sol: [['The centre wheel carries the minute hand and turns once an hour.', '二番車が分針を運び、1 時間に一回転します。'], [`So the answer is the beats per hour, $${vt(V)}$: the vph figure is literally the number of tics and tocs per turn of the minute hand.`, `したがって答えは 1 時間あたりの刻みの数 $${vt(V)}$ です。vph の数値は、文字どおり分針一周あたりのチクとタクの数なのです。`]],
        set: { vph: i },
      };
    },
  ];
  function vt(x) { return x.toLocaleString('en-US').replace(/,/g, '{,}'); }

  /* ---------------- 3. epicyclic gears ---------------- */
  const sunPlanet = (r) => [r.int(12, 40), r.int(8, 30)];
  Q.epicyclic = [
    (r) => {
      const form = r.int(0, 2), [zs, zp] = sunPlanet(r), zr = zs + 2 * zp;
      if (form === 0) return {
        q: [`An epicyclic set has a sun of ${zs} teeth and planets of ${zp} teeth, all of the same module. How many teeth must the ring gear have?`, `遊星歯車列の太陽歯車は ${zs} 歯、遊星は ${zp} 歯で、すべて同じモジュールです。内歯車の歯数はいくつでなければなりませんか。`],
        a: { type: 'int', v: zr },
        hint: ['Across a diameter the ring’s pitch circle spans the sun’s plus two planets’.', '直径方向に見ると、内歯車のピッチ円は太陽のピッチ円と遊星二つ分にわたります。'],
        sol: [['Pitch diameters are proportional to tooth counts, and $d_r = d_s + 2d_p$.', 'ピッチ円直径は歯数に比例し、$d_r = d_s + 2d_p$ です。'], [`$z_r = ${zs} + 2 \\times ${zp} = ${zr}$. The planets just fill the gap between sun and ring.`, `$z_r = ${zs} + 2 \\times ${zp} = ${zr}$ です。遊星は太陽と内歯車の間をちょうど埋めます。`]],
        set: { zs, zp },
      };
      if (form === 1) return {
        q: [`Sun ${zs}, planets ${zp}. The carrier is held still and the sun turns once forwards. How many turns does the ring make (signed)?`, `太陽 ${zs} 歯、遊星 ${zp} 歯です。キャリアを固定し、太陽を正の向きに一回転させます。内歯車は何回転しますか（符号つき）。`],
        a: { type: 'num', v: -zs / zr, rel: 0.002 },
        hint: ['With the carrier fixed, the planets are idlers: the sun drives the ring through them.', 'キャリアを固定すると遊星は中間車で、太陽はそれを介して内歯車を駆動します。'],
        sol: [[`The ring has $z_r = ${zr}$ teeth; an idler does not change the tooth ratio, only the direction twice (external, then internal mesh).`, `内歯車の歯数は $z_r = ${zr}$ です。中間車は歯数比を変えず、向きを（外歯、次に内歯のかみ合いで）変えるだけです。`], [`$\\omega_r/\\omega_s = -${zs}/${zr} = ${n(-zs / zr, 4)}$: the ring turns backwards, slowly.`, `$\\omega_r/\\omega_s = -${zs}/${zr} = ${n(-zs / zr, 4)}$ で、内歯車はゆっくり逆向きに回ります。`]],
        set: { zs, zp, fixed: 1 },
      };
      const nP = r.int(3, 4), ok = (zs + zr) % nP === 0;
      return {
        q: [`Sun ${zs}, planets ${zp}, ring ${zr}. Can ${nP} planets be spaced exactly equally round the sun?`, `太陽 ${zs} 歯、遊星 ${zp} 歯、内歯車 ${zr} 歯です。${nP} 個の遊星を太陽のまわりに正確に等間隔に置けますか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: ok ? 0 : 1, fixed: true },
        hint: ['Equal spacing needs $(z_s + z_r)/n$ to be a whole number.', '等間隔配置には $(z_s + z_r)/n$ が整数である必要があります。'],
        sol: [[`$(z_s + z_r)/n = ${zs + zr}/${nP} = ${n((zs + zr) / nP, 3)}$.`, `$(z_s + z_r)/n = ${zs + zr}/${nP} = ${n((zs + zr) / nP, 3)}$ です。`], [ok ? 'A whole number: every planet finds sun and ring teeth in the same relation, so all of them mesh.' : 'Not a whole number: the second planet would land with its teeth against the sun’s or ring’s, and would not go in.', ok ? '整数なので、どの遊星も太陽と内歯車の歯と同じ関係になり、すべてかみ合います。' : '整数ではないので、二つ目の遊星の歯が太陽や内歯車の歯とぶつかり、入りません。']],
        set: { zs, zp, n: nP },
      };
    },
    (r) => {
      const form = r.int(0, 2), [zs, zp] = sunPlanet(r), zr = zs + 2 * zp;
      if (form === 0) {
        const red = (zs + zr) / zs;
        return {
          q: [`Ring fixed, sun driving: a set with sun ${zs} and planets ${zp}. What is the reduction ratio $\\omega_s/\\omega_c$?`, `内歯車を固定し太陽で駆動します。太陽 ${zs} 歯、遊星 ${zp} 歯の組の減速比 $\\omega_s/\\omega_c$ はいくつですか。`],
          a: { type: 'num', v: red, rel: 0.002 },
          hint: ['Willis: $(\\omega_s - \\omega_c)/(\\omega_r - \\omega_c) = -z_r/z_s$ with $\\omega_r = 0$.', 'ウィリスの式 $(\\omega_s - \\omega_c)/(\\omega_r - \\omega_c) = -z_r/z_s$ で $\\omega_r = 0$ とします。'],
          sol: [[`$z_r = ${zr}$. With $\\omega_r = 0$: $\\omega_s - \\omega_c = (z_r/z_s)\\,\\omega_c$.`, `$z_r = ${zr}$ です。$\\omega_r = 0$ とすると $\\omega_s - \\omega_c = (z_r/z_s)\\,\\omega_c$ です。`], [`$\\omega_s/\\omega_c = 1 + z_r/z_s = 1 + ${zr}/${zs} = ${n(red, 4)}$. One stage of this size gives what two ordinary meshes would, with the load shared among the planets.`, `$\\omega_s/\\omega_c = 1 + z_r/z_s = 1 + ${zr}/${zs} = ${n(red, 4)}$ です。この一段で普通のかみ合い二段分の減速が得られ、荷重は遊星で分担されます。`]],
          set: { zs, zp, fixed: 0 },
        };
      }
      if (form === 1) {
        const k = zr / (zs + zr);
        return {
          q: [`Sun ${zs} held fixed, planets ${zp}; the ring drives. How many turns does the carrier make per turn of the ring?`, `太陽 ${zs} 歯を固定し、遊星は ${zp} 歯、内歯車で駆動します。内歯車一回転あたりキャリアは何回転しますか。`],
          a: { type: 'num', v: k, rel: 0.002 },
          hint: ['Willis with $\\omega_s = 0$.', 'ウィリスの式で $\\omega_s = 0$ とします。'],
          sol: [[`$(0 - \\omega_c)/(\\omega_r - \\omega_c) = -${zr}/${zs}$ gives $${zs}\\,\\omega_c = ${zr}(\\omega_r - \\omega_c)$.`, `$(0 - \\omega_c)/(\\omega_r - \\omega_c) = -${zr}/${zs}$ から $${zs}\\,\\omega_c = ${zr}(\\omega_r - \\omega_c)$ です。`], [`$\\omega_c/\\omega_r = ${zr}/${zs + zr} = ${n(k, 4)}$, the same direction as the ring and somewhat slower: a mild reduction.`, `$\\omega_c/\\omega_r = ${zr}/${zs + zr} = ${n(k, 4)}$ で、内歯車と同じ向きに少し遅く回ります。穏やかな減速です。`]],
          set: { zs, zp, fixed: 2 },
        };
      }
      const wc = zs / (zs + zr), wp = wc - (zs / zp) * (1 - wc);
      return {
        q: [`Ring fixed, sun (${zs} teeth) turning once forwards, planets of ${zp} teeth. How many turns does each planet make about its own axle, seen from the fixed frame (signed)?`, `内歯車を固定し、太陽（${zs} 歯）を正の向きに一回転させます。遊星は ${zp} 歯です。固定した座標から見て、各遊星は自分の軸のまわりに何回転しますか（符号つき）。`],
        a: { type: 'num', v: wp, rel: 0.003 },
        hint: ['Relative to the carrier the planet turns $-(z_s/z_p)(\\omega_s - \\omega_c)$; add the carrier’s own rotation back.', 'キャリアに対して遊星は $-(z_s/z_p)(\\omega_s - \\omega_c)$ 回り、そこにキャリア自身の回転を足し戻します。'],
        sol: [[`Carrier: $\\omega_c = ${zs}/${zs + zr} = ${n(wc, 4)}$.`, `キャリアは $\\omega_c = ${zs}/${zs + zr} = ${n(wc, 4)}$ です。`], [`Relative to the carrier: $-(${zs}/${zp})(1 - ${n(wc, 4)}) = ${n(-(zs / zp) * (1 - wc), 4)}$.`, `キャリアに対しては $-(${zs}/${zp})(1 - ${n(wc, 4)}) = ${n(-(zs / zp) * (1 - wc), 4)}$ です。`], [`Absolute: $${n(wc, 4)} + ${pn(-(zs / zp) * (1 - wc))} = ${n(wp, 4)}$. The planet spins backwards while its axle goes forwards, like a wheel rolling round the inside of a hoop.`, `絶対的には $${n(wc, 4)} + ${pn(-(zs / zp) * (1 - wc))} = ${n(wp, 4)}$ です。軸は前へ進みながら遊星は逆向きに自転します。輪の内側を転がる車輪と同じです。`]],
        set: { zs, zp, fixed: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const zf = r.pick([60, 70, 72, 75, 80, 84, 90]), zpn = r.pick([6, 7, 8, 9, 10, 12]), ze = r.pick([15, 18, 20, 21]);
        const rel = zf / zpn, f = ze * rel / 60, V = 7200 * f;
        return {
          q: [`In a tourbillon the cage turns once a minute. Its escape pinion of ${zpn} leaves rolls round a fixed fourth wheel of ${zf} teeth, and carries an escape wheel of ${ze} teeth. Relative to the cage, how many turns does the escape pinion make per minute, and what beat rate (vph) does that imply?`, `トゥールビヨンのかごは毎分一回転します。${zpn} 葉のがんぎかなは歯数 ${zf} の固定された四番車のまわりを転がり、歯数 ${ze} のがんぎ車を運びます。かごに対してがんぎかなは毎分何回転し、それはどの振動数（vph）に対応しますか。`],
          a: { type: 'tuple', v: [rel, V], labels: [['turns per minute', '毎分の回転数'], ['vph', 'vph']], tol: 0.01 },
          hint: ['Relative to the cage, the pinion simply rolls round a fixed wheel: $z_f/z_p$ turns per cage turn. The escape wheel advances one tooth per oscillation.', 'かごに対しては、かなは固定車のまわりを転がるだけで、かご一回転あたり $z_f/z_p$ 回転します。がんぎ車は一往復で一歯進みます。'],
          sol: [[`Relative turns $= ${zf}/${zpn} = ${n(rel, 4)}$ per minute.`, `相対的な回転数は毎分 $${zf}/${zpn} = ${n(rel, 4)}$ 回です。`], [`Teeth released per minute $= ${ze} \\times ${n(rel, 4)} = ${n(ze * rel, 4)}$, one per oscillation, so $f = ${n(f, 4)}$ Hz and $${n(V, 1)}$ vph.`, `毎分解放される歯は $${ze} \\times ${n(rel, 4)} = ${n(ze * rel, 4)}$ で、一往復に一歯なので $f = ${n(f, 4)}$ Hz、$${n(V, 1)}$ vph です。`], [`Seen from outside, the pinion turns once more with the cage, $${n(1 + rel, 4)}$ times a minute; but the escapement only cares about motion relative to the cage it lives in.`, `外から見るとかなはかごと一緒にもう一回転するので毎分 $${n(1 + rel, 4)}$ 回ですが、脱進機にとって大事なのは、自分が載っているかごに対する動きだけです。`]],
        };
      }
      if (form === 1) {
        const [zs, zp] = sunPlanet(r), zr = zs + 2 * zp, ws = r.pick([-3, -2, -1, 1, 2, 3, 4]), wr = r.pick([-2, -1, 1, 2, 3].filter((x) => x !== ws)), wc = (zs * ws + zr * wr) / (zs + zr);
        return {
          q: [`Sun ${zs}, planets ${zp}, ring ${zr}. The sun is driven at $${ws}$ rev/s and the ring at $${wr}$ rev/s (signs give direction). How fast does the carrier turn, in rev/s?`, `太陽 ${zs} 歯、遊星 ${zp} 歯、内歯車 ${zr} 歯です。太陽を $${ws}$ rev/s、内歯車を $${wr}$ rev/s で駆動します（符号は向き）。キャリアは何 rev/s で回りますか。`],
          a: { type: 'num', v: wc, tol: 0.002, unit: ['rev/s', 'rev/s'] },
          hint: ['Willis’s relation holds for any pair of inputs; solve it for $\\omega_c$.', 'ウィリスの関係は任意の二つの入力について成り立ちます。$\\omega_c$ について解きます。'],
          sol: [[`$(\\omega_s - \\omega_c)\\,z_s = -(\\omega_r - \\omega_c)\\,z_r$, so $\\omega_c = \\dfrac{z_s\\omega_s + z_r\\omega_r}{z_s + z_r}$.`, `$(\\omega_s - \\omega_c)\\,z_s = -(\\omega_r - \\omega_c)\\,z_r$ より $\\omega_c = \\dfrac{z_s\\omega_s + z_r\\omega_r}{z_s + z_r}$ です。`], [`$\\omega_c = \\dfrac{${zs} \\times ${pn(ws)} + ${zr} \\times ${pn(wr)}}{${zs + zr}} = ${n(wc, 4)}$ rev/s.`, `$\\omega_c = \\dfrac{${zs} \\times ${pn(ws)} + ${zr} \\times ${pn(wr)}}{${zs + zr}} = ${n(wc, 4)}$ rev/s です。`], ['The carrier speed is a weighted average of the other two, weighted by tooth counts. That is what makes an epicyclic set a differential: it adds two motions.', 'キャリアの速さは他の二つを歯数で重み付けした平均です。これが遊星歯車列を差動装置にしています。二つの運動を足し合わせるのです。']],
        };
      }
      if (form === 2) {
        const [zs, zp] = sunPlanet(r), zr = zs + 2 * zp;
        return {
          q: [`For sun ${zs}, planets ${zp} and ring ${zr}, write the carrier speed $\\omega_c$ as a function of the sun speed $s$ and the ring speed $u$.`, `太陽 ${zs} 歯、遊星 ${zp} 歯、内歯車 ${zr} 歯について、キャリアの速さ $\\omega_c$ を太陽の速さ $s$ と内歯車の速さ $u$ の関数として書いてください。`],
          a: { type: 'expr', v: `(${zs}*s+${zr}*u)/${zs + zr}`, vars: ['s', 'u'], lhs: ['$\\omega_c =$', '$\\omega_c =$'] },
          hint: ['Subtract the carrier’s rotation from everything; then the set is an ordinary train with ratio $-z_r/z_s$.', 'すべてからキャリアの回転を引くと、比 $-z_r/z_s$ の普通の歯車列になります。'],
          sol: [[`Willis: $(s - \\omega_c)/(u - \\omega_c) = -${zr}/${zs}$.`, `ウィリスの式は $(s - \\omega_c)/(u - \\omega_c) = -${zr}/${zs}$ です。`], [`$${zs}(s - \\omega_c) = -${zr}(u - \\omega_c)$, so $\\omega_c = (${zs}s + ${zr}u)/${zs + zr}$. Setting $u = 0$ recovers the ring-fixed reduction $${zs}/${zs + zr}$.`, `$${zs}(s - \\omega_c) = -${zr}(u - \\omega_c)$ より $\\omega_c = (${zs}s + ${zr}u)/${zs + zr}$ です。$u = 0$ とすると内歯車固定の減速 $${zs}/${zs + zr}$ に戻ります。`]],
        };
      }
      let zs, k, zp; do { zs = r.pick([12, 14, 16, 18, 20, 24, 30, 36, 40]); k = r.pick([3, 3.5, 4, 4.5, 5, 6]); zp = zs * (k - 2) / 2; } while (Math.abs(zp - Math.round(zp)) > 1e-9 || zp < 8 || zp > 30);
      return {
        q: [`With the ring fixed and the sun driving, you want a reduction $\\omega_s/\\omega_c = ${n(k)}$ from a sun of ${zs} teeth. How many teeth must each planet have?`, `内歯車を固定し太陽で駆動して、歯数 ${zs} の太陽から減速比 $\\omega_s/\\omega_c = ${n(k)}$ を得たいとします。遊星の歯数はいくつでなければなりませんか。`],
        a: { type: 'int', v: Math.round(zp) },
        hint: ['$\\omega_s/\\omega_c = 1 + z_r/z_s$ and $z_r = z_s + 2z_p$.', '$\\omega_s/\\omega_c = 1 + z_r/z_s$、$z_r = z_s + 2z_p$ です。'],
        sol: [[`$1 + z_r/z_s = ${n(k)}$ gives $z_r = ${n(k - 1)} \\times ${zs} = ${n((k - 1) * zs)}$.`, `$1 + z_r/z_s = ${n(k)}$ より $z_r = ${n(k - 1)} \\times ${zs} = ${n((k - 1) * zs)}$ です。`], [`$z_p = (z_r - z_s)/2 = ${Math.round(zp)}$. Ratios near 2 would need tiny planets and very large ones a tiny sun, so a single stage usually stays between about 3 and 10.`, `$z_p = (z_r - z_s)/2 = ${Math.round(zp)}$ です。比が 2 に近いと遊星がごく小さくなり、非常に大きな比には小さな太陽が必要になるので、一段の比はふつうおよそ 3 から 10 の間です。`]],
        set: { zs, zp: Math.round(zp), fixed: 0 },
      };
    },
  ];
})();
