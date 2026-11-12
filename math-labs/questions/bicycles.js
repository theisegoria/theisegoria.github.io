'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, G = 9.81, RHO = 1.225, DEG = PI / 180;
  const COGS = [32, 28, 24, 21, 19, 17, 15, 14, 13, 12, 11], CIRC = 2.105, PITCH = 3.74, PULL = 2.7, RATIO = PITCH / PULL, WB = 1.02;

  /* ---------------- bicycle-self-stability ---------------- */
  Q['bicycle-self-stability'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const R = r.pick([0.31, 0.33, 0.34, 0.35]), lam = r.int(15, 22), rake = r.pick([0.04, 0.045, 0.05, 0.055]), c = R * Math.tan(lam * DEG) - rake / Math.cos(lam * DEG);
        return {
          q: [`A front wheel of radius $${n(R, 2)}$ m is held by a fork whose steering axis is tilted $${lam}^\\circ$ back from vertical, with the axle offset $${n(rake * 1000, 0)}$ mm ahead of that axis. What is the trail, in mm? Use $c = R\\tan\\lambda - d/\\cos\\lambda$.`, `半径 $${n(R, 2)}$ m の前輪を、ステアリング軸が鉛直から $${lam}^\\circ$ 後ろへ傾いたフォークが支えていて、車軸はその軸より $${n(rake * 1000, 0)}$ mm 前にずれています。トレールは何 mm ですか。$c = R\\tan\\lambda - d/\\cos\\lambda$ を使ってください。`],
          a: { type: 'num', v: c * 1000, tol: 0.6, unit: ['mm', 'mm'] },
          hint: ['The axis would meet the ground $R\\tan\\lambda$ ahead of the contact if it passed through the axle; the fork offset brings it back.', '軸が車軸を通るなら、接地点より $R\\tan\\lambda$ 前で地面と交わります。フォークのオフセットがそれを戻します。'],
          sol: [[`$R\\tan\\lambda = ${n(R * 1000, 0)}\\times${n(Math.tan(lam * DEG), 4)} = ${n(R * Math.tan(lam * DEG) * 1000, 1)}$ mm.`, `$R\\tan\\lambda = ${n(R * 1000, 0)}\\times${n(Math.tan(lam * DEG), 4)} = ${n(R * Math.tan(lam * DEG) * 1000, 1)}$ mm です。`], [`$d/\\cos\\lambda = ${n(rake * 1000, 0)}/${n(Math.cos(lam * DEG), 4)} = ${n((rake / Math.cos(lam * DEG)) * 1000, 1)}$ mm.`, `$d/\\cos\\lambda = ${n(rake * 1000, 0)}/${n(Math.cos(lam * DEG), 4)} = ${n((rake / Math.cos(lam * DEG)) * 1000, 1)}$ mm です。`], [`Trail $c = ${n(c * 1000, 1)}$ mm: the contact point trails the steering axis like a caster wheel.`, `トレールは $c = ${n(c * 1000, 1)}$ mm です。接地点は、キャスターの車輪のようにステアリング軸の後ろを追いかけます。`]],
          ...(c >= -0.02 && c <= 0.16 ? { set: { c: Math.round(c / 0.005) * 0.005, lam } } : {}),
        };
      }
      const re = [r.real(-15, -8, 1), r.real(-2, 1.5, 2), r.real(-1, 0.6, 2)], im = r.real(2, 6, 1), stable = re.every((x) => x < 0);
      return {
        q: [`At some speed a bicycle’s four eigenvalues are $${n(re[0], 1)}$, $${n(re[1], 2)} \\pm ${n(im, 1)}i$ and $${n(re[2], 2)}$ per second. Is it self-stable at this speed?`, `ある速さで、自転車の四つの固有値が毎秒 $${n(re[0], 1)}$、$${n(re[1], 2)} \\pm ${n(im, 1)}i$、$${n(re[2], 2)}$ です。この速さで自己安定ですか。`],
        a: { type: 'choice', fixed: true, opts: [['Yes: every disturbance dies away', 'はい：どの乱れも減衰する'], ['No: the weave oscillation grows', 'いいえ：ウィーブの振動が成長する'], ['No: it slowly capsizes without oscillating', 'いいえ：振動せずにゆっくり倒れる']], v: stable ? 0 : re[1] >= 0 ? 1 : 2 },
        hint: ['A mode grows when the real part of its eigenvalue is positive.', '固有値の実部が正のとき、そのモードは成長します。'],
        sol: [['Stability needs every real part to be negative.', '安定であるには、すべての実部が負でなければなりません。'], [stable ? 'All four real parts are negative, so the bicycle recovers by itself.' : re[1] >= 0 ? `The complex pair has real part $${n(re[1], 2)} \\ge 0$: the weave grows. This happens below the weave speed.` : `The real eigenvalue $${n(re[2], 2)}$ is positive: a slow, non-oscillating capsize, as above the capsize speed.`, stable ? '四つの実部がすべて負なので、自転車は自分で立ち直ります。' : re[1] >= 0 ? `複素数の対の実部が $${n(re[1], 2)} \\ge 0$ で、ウィーブが成長します。これはウィーブ速度より下で起こります。` : `実の固有値 $${n(re[2], 2)}$ が正です。キャプサイズ速度より上で見られる、振動しないゆっくりした転倒です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const a = r.real(0.2, 1.5, 2), b = r.real(3, 6, 1);
        return {
          q: [`A bicycle’s weave mode has eigenvalue $-${n(a, 2)} \\pm ${n(b, 1)}i$ per second. What is the frequency of the wobble in Hz, and how long does its amplitude take to halve?`, `自転車のウィーブモードの固有値が毎秒 $-${n(a, 2)} \\pm ${n(b, 1)}i$ です。ふらつきの振動数（Hz）と、振幅が半分になるまでの時間を答えてください。`],
          a: { type: 'tuple', v: [b / (2 * PI), Math.LN2 / a], labels: ['$f$ (Hz)', '$t_{1/2}$ (s)'], tol: 0.02 },
          hint: ['Frequency is the imaginary part over $2\\pi$; the amplitude goes as $e^{-at}$.', '振動数は虚部を $2\\pi$ で割ったもので、振幅は $e^{-at}$ のように変わります。'],
          sol: [[`$f = ${n(b, 1)}/2\\pi = ${n(b / (2 * PI), 3)}$ Hz.`, `$f = ${n(b, 1)}/2\\pi = ${n(b / (2 * PI), 3)}$ Hz です。`], [`$e^{-${n(a, 2)}t} = \\tfrac12$ gives $t = \\ln 2/${n(a, 2)} = ${n(Math.LN2 / a, 3)}$ s, about ${n((Math.LN2 / a) * (b / (2 * PI)), 1)} cycles.`, `$e^{-${n(a, 2)}t} = \\tfrac12$ から $t = \\ln 2/${n(a, 2)} = ${n(Math.LN2 / a, 3)}$ s で、約 ${n((Math.LN2 / a) * (b / (2 * PI)), 1)} 周期です。`]],
        };
      }
      const d = r.pick([1, 2, 3, 5, 8]), lam = 18, R = WB / (d * DEG * Math.cos(lam * DEG));
      return {
        q: [`A bicycle with wheelbase 1.02 m and steering axis tilted $18^\\circ$ holds a steady steer angle of $${d}^\\circ$ about that axis. What is the radius of its turn, in metres? Use $\\dot\\psi = v\\,\\delta\\cos\\lambda/w$.`, `ホイールベース 1.02 m、ステアリング軸の傾き $18^\\circ$ の自転車が、その軸のまわりに舵角 $${d}^\\circ$ を保っています。旋回半径は何メートルですか。$\\dot\\psi = v\\,\\delta\\cos\\lambda/w$ を使ってください。`],
        a: { type: 'num', v: R, rel: 0.01, unit: ['m', 'm'] },
        hint: ['The radius is $v/\\dot\\psi$.', '半径は $v/\\dot\\psi$ です。'],
        sol: [['$R = v/\\dot\\psi = w/(\\delta\\cos\\lambda)$, with $\\delta$ in radians.', '$\\delta$ をラジアンで表して、$R = v/\\dot\\psi = w/(\\delta\\cos\\lambda)$ です。'], [`$\\delta = ${n(d * DEG, 4)}$ rad and $\\cos18^\\circ = 0.9511$, so $R = 1.02/(${n(d * DEG, 4)}\\times0.9511) = ${n(R, 2)}$ m. The tilt makes the wheel turn less on the ground than the bars do.`, `$\\delta = ${n(d * DEG, 4)}$ rad、$\\cos18^\\circ = 0.9511$ なので、$R = 1.02/(${n(d * DEG, 4)}\\times0.9511) = ${n(R, 2)}$ m です。軸が傾いているので、路面上での車輪の向きの変化はハンドルの回転より小さくなります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const v = r.int(4, 14), R = r.pick([8, 10, 15, 20, 30, 50]), phi = Math.atan((v * v) / (G * R)) / DEG;
        return {
          q: [`To hold a steady turn of radius $${R}$ m at $${v}$ m/s, how far must bicycle and rider lean from vertical, in degrees?`, `速さ $${v}$ m/s で半径 $${R}$ m の定常旋回を保つには、自転車と乗り手は鉛直から何度傾かなければなりませんか。`],
          a: { type: 'num', v: phi, tol: 0.15, unit: ['°', '°'] },
          hint: ['The resultant of gravity and the centripetal force must pass through the tyre contact line.', '重力と向心力の合力が、タイヤの接地線を通らなければなりません。'],
          sol: [['Balance of moments about the contact line gives $\\tan\\varphi = v^2/(gR)$.', '接地線まわりのモーメントの釣り合いから $\\tan\\varphi = v^2/(gR)$ です。'], [`$\\tan\\varphi = ${v}^2/(9.81\\times${R}) = ${n((v * v) / (G * R), 4)}$, so $\\varphi = ${n(phi, 2)}^\\circ$. The tyres must also supply a sideways force of $${n((v * v) / (G * R), 2)}$ times the weight.`, `$\\tan\\varphi = ${v}^2/(9.81\\times${R}) = ${n((v * v) / (G * R), 4)}$ なので $\\varphi = ${n(phi, 2)}^\\circ$ です。タイヤは重さの $${n((v * v) / (G * R), 2)}$ 倍の横力も出さなければなりません。`]],
        };
      }
      if (form === 1) return {
        q: ['A stationary bicycle balanced upright is an inverted pendulum with its centre of mass at height $h$. A small lean grows like $e^{st}$. Find $s$ in terms of $g$ and $h$ (treat the mass as a point).', '直立して止まっている自転車は、重心が高さ $h$ にある倒立振子です。小さな傾きは $e^{st}$ のように成長します。$s$ を $g$ と $h$ で表してください（質量は点とみなします）。'],
        a: { type: 'expr', v: 'sqrt(g/h)', vars: ['g', 'h'], dom: { g: [5, 15], h: [0.5, 2] }, lhs: ['$s =$', '$s =$'] },
        hint: ['Torque $mgh\\varphi$ about the contact line, moment of inertia $mh^2$.', '接地線まわりのトルクは $mgh\\varphi$、慣性モーメントは $mh^2$ です。'],
        sol: [['$mh^2\\ddot\\varphi = mgh\\varphi$ for small $\\varphi$, so $\\ddot\\varphi = (g/h)\\varphi$.', '小さな $\\varphi$ では $mh^2\\ddot\\varphi = mgh\\varphi$ なので、$\\ddot\\varphi = (g/h)\\varphi$ です。'], ['The growing solution is $e^{st}$ with $s = \\sqrt{g/h}$: about 3 per second for $h = 1$ m, so a lean doubles every 0.22 s.', '成長する解は $e^{st}$ で $s = \\sqrt{g/h}$ です。$h = 1$ m では毎秒約 3 で、傾きは 0.22 s ごとに 2 倍になります。'], ['A moving bicycle beats this by steering: the faster it goes, the quicker the wheels can be brought back under the mass.', '走っている自転車は、舵を切ることでこれに打ち勝ちます。速いほど、車輪を素早く重心の下へ戻せます。']],
      };
      const dir = r.pick([['left', '左'], ['right', '右']]), opp = dir[0] === 'left' ? ['right', '右'] : ['left', '左'];
      return {
        q: [`A rider moving in a straight line wants to turn ${dir[0]}. Which way must the handlebars turn first, and why?`, `まっすぐ走っている乗り手が${dir[1]}へ曲がりたいとします。ハンドルは最初にどちらへ切らなければなりませんか。`],
        a: { type: 'choice', opts: [[`Briefly to the ${opp[0]}, so the wheels move out from under the rider and the bicycle leans ${dir[0]}`, `一瞬${opp[1]}へ。車輪が乗り手の下から外へ出て、自転車が${dir[1]}へ傾く`], [`To the ${dir[0]} at once: the bicycle follows the front wheel`, `すぐに${dir[1]}へ。自転車は前輪についていく`], ['Neither: leaning the body alone turns the bicycle', 'どちらでもない。体を傾けるだけで自転車は曲がる']], v: 0 },
        hint: ['A turn needs a lean into it. How can the wheels create that lean?', '曲がるには内側への傾きが必要です。車輪はその傾きをどう作れるでしょうか。'],
        sol: [[`A steady ${dir[0]} turn needs the bicycle leaning ${dir[0]}, with $\\tan\\varphi = v^2/(gR)$.`, `${dir[1]}への定常旋回には、$\\tan\\varphi = v^2/(gR)$ を満たす${dir[1]}への傾きが必要です。`], [`Steering ${opp[0]} first drives the contact points to the ${opp[0]} of the centre of mass, which then falls to the ${dir[0]}; only then do the bars turn ${dir[0]} to hold the turn.`, `最初に${opp[1]}へ切ると、接地点が重心の${opp[1]}側へ出て、重心は${dir[1]}へ倒れます。その後ではじめて、旋回を保つためにハンドルが${dir[1]}へ切られます。`], ['This is countersteering, the same steer-into-the-fall mechanism the self-stable bicycle uses, run on purpose.', 'これが逆操舵で、自己安定な自転車が使う「倒れる側へ切る」仕組みを意図的に使ったものです。']],
      };
    },
  ];

  /* ---------------- bicycle-gearing ---------------- */
  const pw = (v, grade = 0) => { const th = Math.atan(grade / 100); return (0.5 * RHO * 0.32 * v ** 3 + 0.005 * 80 * G * Math.cos(th) * v + 80 * G * Math.sin(th) * v) / 0.975; };
  Q['bicycle-gearing'] = [
    (r) => {
      const ring = r.int(0, 1), nf = [34, 50][ring], ci = r.int(1, 11), nr = COGS[ci - 1], cad = r.step(60, 110, 5), form = r.int(0, 1);
      if (form === 0) {
        const v = (cad / 60) * (nf / nr) * CIRC * 3.6;
        return {
          q: [`A rider turns the cranks at $${cad}$ rpm on a $${nf}$-tooth chainring and a $${nr}$-tooth sprocket. The wheel’s circumference is 2.105 m. What is the speed in km/h?`, `乗り手が、歯数 $${nf}$ のチェーンリングと歯数 $${nr}$ のスプロケットで、クランクを $${cad}$ rpm で回しています。車輪の周長は 2.105 m です。速さは何 km/h ですか。`],
          a: { type: 'num', v, rel: 0.005, unit: ['km/h', 'km/h'] },
          hint: ['Wheel turns per second = crank turns per second × $N_f/N_r$.', '車輪の毎秒の回転数 = クランクの毎秒の回転数 × $N_f/N_r$ です。'],
          sol: [[`The wheel turns $${n(cad / 60, 3)}\\times${nf}/${nr} = ${n((cad / 60) * (nf / nr), 3)}$ times a second.`, `車輪は毎秒 $${n(cad / 60, 3)}\\times${nf}/${nr} = ${n((cad / 60) * (nf / nr), 3)}$ 回転します。`], [`Times 2.105 m: $${n(v / 3.6, 3)}$ m/s $= ${n(v, 1)}$ km/h.`, `2.105 m を掛けて $${n(v / 3.6, 3)}$ m/s $= ${n(v, 1)}$ km/h です。`]],
          set: { ring, cog: ci, cad },
        };
      }
      return {
        q: [`How far does a bicycle travel for one turn of the cranks with a $${nf}$-tooth chainring, a $${nr}$-tooth sprocket and a wheel circumference of 2.105 m?`, `歯数 $${nf}$ のチェーンリング、歯数 $${nr}$ のスプロケット、車輪の周長 2.105 m のとき、クランク 1 回転で自転車は何 m 進みますか。`],
        a: { type: 'num', v: (nf / nr) * CIRC, rel: 0.004, unit: ['m', 'm'] },
        hint: ['Gear ratio times circumference.', 'ギア比に周長を掛けます。'],
        sol: [[`The ratio is $${nf}/${nr} = ${n(nf / nr, 3)}$.`, `ギア比は $${nf}/${nr} = ${n(nf / nr, 3)}$ です。`], [`Development $= ${n(nf / nr, 3)}\\times2.105 = ${n((nf / nr) * CIRC, 2)}$ m per turn.`, `1 回転で進む距離は $${n(nf / nr, 3)}\\times2.105 = ${n((nf / nr) * CIRC, 2)}$ m です。`]],
        set: { ring, cog: ci },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const kmh = r.step(20, 50, 5), v = kmh / 3.6, aero = 0.5 * RHO * 0.32 * v ** 3, roll = 0.005 * 80 * G * v;
        return {
          q: [`On a flat road, what power must a rider deliver at the cranks to hold $${kmh}$ km/h? Take $C_dA = 0.32$ m², $\\rho = 1.225$ kg/m³, $C_{rr} = 0.005$, total mass 80 kg, drivetrain efficiency 0.975.`, `平らな道で $${kmh}$ km/h を保つには、乗り手はクランクでどれだけのパワーを出さなければなりませんか。$C_dA = 0.32$ m²、$\\rho = 1.225$ kg/m³、$C_{rr} = 0.005$、全質量 80 kg、駆動系の効率 0.975 とします。`],
          a: { type: 'num', v: (aero + roll) / 0.975, rel: 0.01, unit: ['W', 'W'] },
          hint: ['$P = (\\tfrac12\\rho C_dAv^3 + C_{rr}mgv)/\\eta$ with $v$ in m/s.', '$v$ を m/s として $P = (\\tfrac12\\rho C_dAv^3 + C_{rr}mgv)/\\eta$ です。'],
          sol: [[`$v = ${n(v, 3)}$ m/s. Air drag: $\\tfrac12\\times1.225\\times0.32\\times${n(v, 3)}^3 = ${n(aero, 1)}$ W.`, `$v = ${n(v, 3)}$ m/s です。空気抵抗は $\\tfrac12\\times1.225\\times0.32\\times${n(v, 3)}^3 = ${n(aero, 1)}$ W です。`], [`Rolling: $0.005\\times80\\times9.81\\times${n(v, 3)} = ${n(roll, 1)}$ W.`, `転がり抵抗は $0.005\\times80\\times9.81\\times${n(v, 3)} = ${n(roll, 1)}$ W です。`], [`$P = ${n(aero + roll, 1)}/0.975 = ${n((aero + roll) / 0.975, 0)}$ W, of which ${n((100 * aero) / (aero + roll), 0)}% fights the air.`, `$P = ${n(aero + roll, 1)}/0.975 = ${n((aero + roll) / 0.975, 0)}$ W で、その ${n((100 * aero) / (aero + roll), 0)}% が空気との戦いです。`]],
          set: { grade: 0 },
        };
      }
      const grade = r.step(4, 12, 1), kmh = r.step(8, 16, 1), v = kmh / 3.6, th = Math.atan(grade / 100), climb = 80 * G * Math.sin(th) * v;
      return {
        q: [`An 80 kg rider and bicycle climb a $${grade}\\%$ grade at $${kmh}$ km/h. How much power goes into lifting them against gravity alone, in watts?`, `合わせて 80 kg の乗り手と自転車が、勾配 $${grade}\\%$ の坂を $${kmh}$ km/h で登っています。重力に逆らって持ち上げるためだけに使われるパワーは何ワットですか。`],
        a: { type: 'num', v: climb, rel: 0.01, unit: ['W', 'W'] },
        hint: ['$P = mg\\,v\\sin\\theta$ with $\\tan\\theta$ equal to the grade.', '$\\tan\\theta$ が勾配に等しいとして $P = mg\\,v\\sin\\theta$ です。'],
        sol: [[`$\\sin\\theta = \\sin(\\arctan ${n(grade / 100, 2)}) = ${n(Math.sin(th), 4)}$ and $v = ${n(v, 3)}$ m/s.`, `$\\sin\\theta = \\sin(\\arctan ${n(grade / 100, 2)}) = ${n(Math.sin(th), 4)}$、$v = ${n(v, 3)}$ m/s です。`], [`$P = 80\\times9.81\\times${n(v, 3)}\\times${n(Math.sin(th), 4)} = ${n(climb, 0)}$ W; the total at the cranks, with drag and rolling, is $${n(pw(v, grade), 0)}$ W.`, `$P = 80\\times9.81\\times${n(v, 3)}\\times${n(Math.sin(th), 4)} = ${n(climb, 0)}$ W で、空気抵抗と転がり抵抗を含めたクランクでの合計は $${n(pw(v, grade), 0)}$ W です。`]],
        set: { grade },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const ring = r.int(0, 1), nf = [34, 50][ring], ci = r.int(2, 10), nr = COGS[ci - 1], kmh = r.step(15, 45, 5), cad = ((kmh / 3.6) / ((nf / nr) * CIRC)) * 60;
        return {
          q: [`What cadence, in rpm, gives $${kmh}$ km/h in the $${nf}/${nr}$ gear (wheel circumference 2.105 m)?`, `$${nf}/${nr}$ のギア（車輪の周長 2.105 m）で $${kmh}$ km/h になるケイデンスは何 rpm ですか。`],
          a: { type: 'num', v: cad, rel: 0.01, unit: ['rpm', 'rpm'] },
          hint: ['Invert $v = (n/60)(N_f/N_r)C$.', '$v = (n/60)(N_f/N_r)C$ を逆に解きます。'],
          sol: [[`Each crank turn covers $${n((nf / nr) * CIRC, 3)}$ m, and $${kmh}$ km/h is $${n(kmh / 3.6, 3)}$ m/s.`, `クランク 1 回転で $${n((nf / nr) * CIRC, 3)}$ m 進み、$${kmh}$ km/h は $${n(kmh / 3.6, 3)}$ m/s です。`], [`$n = 60\\times${n(kmh / 3.6, 3)}/${n((nf / nr) * CIRC, 3)} = ${n(cad, 0)}$ rpm${cad > 110 ? ', too fast to sustain: shift to a smaller sprocket.' : cad < 60 ? ', a slow grind: shift to a larger sprocket.' : ', inside the comfortable range.'}`, `$n = 60\\times${n(kmh / 3.6, 3)}/${n((nf / nr) * CIRC, 3)} = ${n(cad, 0)}$ rpm です${cad > 110 ? '。保つには速すぎるので、小さいスプロケットへ変速します。' : cad < 60 ? '。重く遅い回転なので、大きいスプロケットへ変速します。' : '。快適な範囲に入っています。'}`]],
          ...(cad >= 40 && cad <= 130 ? { set: { ring, cog: ci, cad: Math.round(cad) } } : {}),
        };
      }
      if (form === 1) {
        const grade = r.step(3, 12, 1), th = Math.atan(grade / 100), v = Math.sqrt((80 * G * (Math.sin(th) - 0.005 * Math.cos(th))) / (0.5 * RHO * 0.32));
        return {
          q: [`A rider coasts down a $${grade}\\%$ hill without pedalling or braking. With $C_dA = 0.32$ m², $C_{rr} = 0.005$, $\\rho = 1.225$ kg/m³ and 80 kg in total, what steady speed is reached, in km/h?`, `乗り手が、勾配 $${grade}\\%$ の下り坂を、ペダルもブレーキも使わずに惰行します。$C_dA = 0.32$ m²、$C_{rr} = 0.005$、$\\rho = 1.225$ kg/m³、全質量 80 kg のとき、到達する一定の速さは何 km/h ですか。`],
          a: { type: 'num', v: v * 3.6, rel: 0.01, unit: ['km/h', 'km/h'] },
          hint: ['At terminal speed gravity along the slope balances drag plus rolling resistance.', '終端速度では、斜面に沿った重力が空気抵抗と転がり抵抗の和と釣り合います。'],
          sol: [['$mg\\sin\\theta = \\tfrac12\\rho C_dAv^2 + C_{rr}mg\\cos\\theta$.', '$mg\\sin\\theta = \\tfrac12\\rho C_dAv^2 + C_{rr}mg\\cos\\theta$ です。'], [`Net driving force: $80\\times9.81\\times(${n(Math.sin(th), 4)} - 0.005\\times${n(Math.cos(th), 4)}) = ${n(80 * G * (Math.sin(th) - 0.005 * Math.cos(th)), 1)}$ N.`, `正味の駆動力は $80\\times9.81\\times(${n(Math.sin(th), 4)} - 0.005\\times${n(Math.cos(th), 4)}) = ${n(80 * G * (Math.sin(th) - 0.005 * Math.cos(th)), 1)}$ N です。`], [`$v = \\sqrt{${n(80 * G * (Math.sin(th) - 0.005 * Math.cos(th)), 1)}/(0.5\\times1.225\\times0.32)} = ${n(v, 2)}$ m/s $= ${n(v * 3.6, 1)}$ km/h.`, `$v = \\sqrt{${n(80 * G * (Math.sin(th) - 0.005 * Math.cos(th)), 1)}/(0.5\\times1.225\\times0.32)} = ${n(v, 2)}$ m/s $= ${n(v * 3.6, 1)}$ km/h です。`]],
          set: { grade: -grade >= -6 ? -grade : -6 },
        };
      }
      return {
        q: ['On a flat road in still air, the power to overcome air drag is $kv^3$. If a rider doubles their power output, by what factor does their speed rise, when air drag dominates? Give the exact factor.', '無風の平らな道で、空気抵抗に打ち勝つパワーは $kv^3$ です。空気抵抗が支配的なとき、乗り手がパワーを 2 倍にすると、速さは何倍になりますか。正確な値を答えてください。'],
        a: { type: 'num', v: Math.cbrt(2), rel: 0.003, show: '\\sqrt[3]{2}' },
        hint: ['$v \\propto P^{1/3}$.', '$v \\propto P^{1/3}$ です。'],
        sol: [['$P = kv^3$ gives $v = (P/k)^{1/3}$.', '$P = kv^3$ から $v = (P/k)^{1/3}$ です。'], ['Doubling $P$ multiplies $v$ by $2^{1/3} = 1.26$: twice the power buys only 26% more speed, which is why aerodynamics matters more than fitness at racing speeds.', '$P$ を 2 倍にすると $v$ は $2^{1/3} = 1.26$ 倍になります。パワーを 2 倍にしても速さは 26% しか増えません。レースの速さでは体力より空気力学が効くのはそのためです。']],
      };
    },
  ];

  /* ---------------- bicycle-shifting ---------------- */
  Q['bicycle-shifting'] = [
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.int(2, 11);
        return {
          q: [`The sprockets of an 11-speed cassette are 3.74 mm apart. How far sideways, in mm, is sprocket $${k}$ from sprocket 1?`, `11 段のカセットのスプロケットは 3.74 mm 間隔で並んでいます。スプロケット $${k}$ は、スプロケット 1 から横に何 mm 離れていますか。`],
          a: { type: 'num', v: (k - 1) * PITCH, tol: 0.03, unit: ['mm', 'mm'] },
          hint: ['There are $k - 1$ gaps.', 'すき間は $k - 1$ 個あります。'],
          sol: [[`$${k - 1}$ gaps of 3.74 mm: $${n((k - 1) * PITCH, 2)}$ mm.`, `3.74 mm のすき間が $${k - 1}$ 個で、$${n((k - 1) * PITCH, 2)}$ mm です。`], ['The guide pulley must travel exactly this far, to within a few tenths of a millimetre.', 'ガイドプーリーは、10 分の数ミリメートルの精度で、ちょうどこの距離を動かなければなりません。']],
          set: { gear: k },
        };
      }
      const pull = r.step(2.4, 3.0, 0.1);
      return {
        q: [`A derailleur’s linkage moves the guide pulley 1.385 mm for each millimetre of cable. How far does the pulley move for a click that pulls $${n(pull, 1)}$ mm of cable?`, `あるディレイラーのリンクは、ケーブル 1 mm あたりガイドプーリーを 1.385 mm 動かします。1 クリックでケーブルを $${n(pull, 1)}$ mm 引くと、プーリーは何 mm 動きますか。`],
        a: { type: 'num', v: RATIO * pull, tol: 0.02, unit: ['mm', 'mm'] },
        hint: ['Movement = ratio × cable pull.', '動き = 比 × ケーブルの引き量 です。'],
        sol: [[`$1.385\\times${n(pull, 1)} = ${n(RATIO * pull, 2)}$ mm.`, `$1.385\\times${n(pull, 1)} = ${n(RATIO * pull, 2)}$ mm です。`], [Math.abs(RATIO * pull - PITCH) < 0.03 ? 'That equals the 3.74 mm sprocket spacing: the shifter and cassette match.' : `The sprockets are 3.74 mm apart, so every click is off by ${n(Math.abs(RATIO * pull - PITCH), 2)} mm and the error builds up.`, Math.abs(RATIO * pull - PITCH) < 0.03 ? 'これは 3.74 mm のスプロケット間隔に等しく、シフターとカセットが合っています。' : `スプロケットは 3.74 mm 間隔なので、1 クリックごとに ${n(Math.abs(RATIO * pull - PITCH), 2)} mm ずれ、誤差が積み重なります。`]],
        set: { mode: 0, pull },
      };
    },
    (r) => {
      const form = r.int(0, 1), slack = r.step(0.2, 1.2, 0.1);
      if (form === 0) return {
        q: [`A gear cable has settled and is effectively $${n(slack, 1)}$ mm too long. With a linkage ratio of 1.385, how far from each sprocket’s centre does the guide pulley now sit, in mm?`, `変速ケーブルがなじんで、実質的に $${n(slack, 1)}$ mm 長くなりました。リンクの比が 1.385 のとき、ガイドプーリーは各スプロケットの中心から何 mm ずれていますか。`],
        a: { type: 'num', v: RATIO * slack, tol: 0.02, unit: ['mm', 'mm'] },
        hint: ['The same slack is multiplied by the linkage in every gear.', 'どの段でも、同じたるみにリンクの比が掛かります。'],
        sol: [[`$1.385\\times${n(slack, 1)} = ${n(RATIO * slack, 2)}$ mm, towards the smaller sprockets, because the spring pulls that way when the cable gives.`, `$1.385\\times${n(slack, 1)} = ${n(RATIO * slack, 2)}$ mm で、小さいスプロケットの側へずれます。ケーブルがゆるむと、ばねがその向きに引くからです。`], [RATIO * slack > 0.4 ? 'That is outside the quiet band of about 0.4 mm: the chain ticks and shifts to larger sprockets hesitate.' : 'That is still inside the quiet band of about 0.4 mm.', RATIO * slack > 0.4 ? 'これは約 0.4 mm の静かな範囲の外です。チェーンが音を立て、大きいスプロケットへの変速がもたつきます。' : 'これはまだ約 0.4 mm の静かな範囲の中です。']],
        set: { mode: 0, slack, adj: 0, pull: 2.7 },
      };
      const pitchT = r.pick([0.5, 0.75, 1.0]), turns = slack / pitchT;
      return {
        q: [`The cable is $${n(slack, 1)}$ mm slack. The barrel adjuster’s thread advances $${n(pitchT, 2)}$ mm per turn. How many turns outward restore the indexing?`, `ケーブルに $${n(slack, 1)}$ mm のたるみがあります。アジャスターのねじは 1 回転で $${n(pitchT, 2)}$ mm 進みます。インデックスを元に戻すには、外側へ何回転回しますか。`],
        a: { type: 'num', v: turns, rel: 0.01 },
        hint: ['Lengthening the housing shortens the free cable by the same amount.', 'アウターを長くすると、その分だけ余ったケーブルが吸収されます。'],
        sol: [['Unscrewing the adjuster lengthens the housing path, which takes up cable slack one for one.', 'アジャスターをゆるめるとアウターの経路が長くなり、ケーブルのたるみを同じ量だけ吸収します。'], [`$${n(slack, 1)}/${n(pitchT, 2)} = ${n(turns, 2)}$ turns.`, `$${n(slack, 1)}/${n(pitchT, 2)} = ${n(turns, 2)}$ 回転です。`]],
        set: { mode: 0, slack, adj: slack },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const pull = r.pick([2.4, 2.5, 2.6, 2.8, 2.9, 3.0]), per = Math.abs(RATIO * pull - PITCH), lim = 1.3, nMax = Math.ceil(lim / per - 1e-9);
        return {
          q: [`A shifter pulling $${n(pull, 1)}$ mm per click is fitted to a derailleur with ratio 1.385 and sprockets 3.74 mm apart. Starting perfectly aligned on sprocket 1, after how many clicks does the error first reach 1.3 mm, where the chain begins to jump?`, `1 クリックで $${n(pull, 1)}$ mm 引くシフターを、比 1.385 のディレイラーと 3.74 mm 間隔のスプロケットに組み合わせました。スプロケット 1 で完全に合わせた状態から始めると、チェーンが跳び始める 1.3 mm に誤差が初めて達するのは何クリック後ですか。`],
          a: { type: 'int', v: nMax },
          hint: ['Each click adds the same error: movement per click minus the spacing.', '1 クリックごとに同じ誤差が加わります。1 クリックの動きから間隔を引いた値です。'],
          sol: [[`Each click moves the pulley $1.385\\times${n(pull, 1)} = ${n(RATIO * pull, 3)}$ mm, off by $${n(per, 3)}$ mm.`, `1 クリックでプーリーは $1.385\\times${n(pull, 1)} = ${n(RATIO * pull, 3)}$ mm 動き、$${n(per, 3)}$ mm ずれます。`], [`$1.3/${n(per, 3)} = ${n(lim / per, 2)}$, so the error reaches the limit on click $${nMax}$${nMax > 10 ? ', beyond the ten clicks of an 11-speed cassette: this mismatch is tolerable.' : ': part of the cassette cannot be used.'}`, `$1.3/${n(per, 3)} = ${n(lim / per, 2)}$ なので、誤差は $${nMax}$ クリック目で限界に達します${nMax > 10 ? '。これは 11 段のカセットの 10 クリックを超えているので、この不一致は許容できます。' : '。カセットの一部が使えません。'}`]],
          set: { mode: 0, pull, slack: 0, adj: 0 },
        };
      }
      const p = r.pick([3.5, 3.6, 3.9, 4.1, 4.3]), ell = r.pick([2.5, 2.7, 3.0, 3.5]);
      return {
        q: [`A designer wants a derailleur for a cassette with sprockets $${n(p, 1)}$ mm apart, driven by a shifter that pulls $${n(ell, 1)}$ mm of cable per click. What linkage ratio is needed?`, `設計者が、スプロケットの間隔が $${n(p, 1)}$ mm のカセット用のディレイラーを、1 クリックで $${n(ell, 1)}$ mm のケーブルを引くシフターで動かしたいと考えています。必要なリンクの比はいくつですか。`],
        a: { type: 'num', v: p / ell, rel: 0.005 },
        hint: ['One click must move the pulley exactly one spacing.', '1 クリックで、プーリーがちょうど 1 間隔だけ動かなければなりません。'],
        sol: [['Matching requires $R\\,\\ell = p$.', '合わせるには $R\\,\\ell = p$ が必要です。'], [`$R = ${n(p, 1)}/${n(ell, 1)} = ${n(p / ell, 3)}$. ${p / ell < 1.2 ? 'A low ratio like this makes the system less sensitive to cable slack and friction, since errors in the cable are multiplied by the same factor.' : 'A high ratio also multiplies every error in the cable, so such a system needs careful cable routing.'}`, `$R = ${n(p, 1)}/${n(ell, 1)} = ${n(p / ell, 3)}$ です。${p / ell < 1.2 ? 'このような低い比では、ケーブルの誤差に掛かる倍率も同じなので、たるみや摩擦の影響を受けにくくなります。' : '高い比はケーブルの誤差もすべて同じ倍率で大きくするので、このような方式ではケーブルの取り回しに注意が必要です。'}`]],
      };
    },
  ];

  /* ---------------- bicycle-braking ---------------- */
  Q['bicycle-braking'] = [
    (r) => {
      const form = r.int(0, 1), lf = r.step(0.5, 0.8, 0.05), h = r.step(0.9, 1.3, 0.05);
      if (form === 0) return {
        q: [`A rider’s centre of mass is $${n(h, 2)}$ m above the road and $${n(lf, 2)}$ m behind the front tyre’s contact point. At what deceleration, in units of $g$, does the rear wheel lift?`, `乗り手の重心が路面から $${n(h, 2)}$ m の高さにあり、前タイヤの接地点から $${n(lf, 2)}$ m 後ろにあります。後輪が浮くのは、$g$ を単位としてどれだけの減速度のときですか。`],
        a: { type: 'num', v: lf / h, tol: 0.006 },
        hint: ['Take moments about the front contact point.', '前輪の接地点まわりのモーメントを考えます。'],
        sol: [['With no load on the rear wheel, weight and inertial force must balance about the front contact: $mg\\,\\ell_f = ma\\,h$.', '後輪の荷重がゼロのとき、重さと慣性力は前輪の接地点まわりで釣り合います。$mg\\,\\ell_f = ma\\,h$ です。'], [`$a/g = ${n(lf, 2)}/${n(h, 2)} = ${n(lf / h, 3)}$.`, `$a/g = ${n(lf, 2)}/${n(h, 2)} = ${n(lf / h, 3)}$ です。`]],
        set: { mode: 0, mu: 1, lf, h },
      };
      const kmh = r.step(15, 50, 5), a = r.step(0.2, 0.6, 0.05), d = (kmh / 3.6) ** 2 / (2 * a * G);
      return {
        q: [`A bicycle brakes from $${kmh}$ km/h at a steady $${n(a, 2)}\\,g$. How far does it travel before stopping, in metres?`, `自転車が $${kmh}$ km/h から、一定の $${n(a, 2)}\\,g$ で制動します。止まるまでに何 m 進みますか。`],
        a: { type: 'num', v: d, rel: 0.01, unit: ['m', 'm'] },
        hint: ['$d = v^2/(2a)$.', '$d = v^2/(2a)$ です。'],
        sol: [[`$v = ${n(kmh / 3.6, 3)}$ m/s and $a = ${n(a * G, 3)}$ m/s².`, `$v = ${n(kmh / 3.6, 3)}$ m/s、$a = ${n(a * G, 3)}$ m/s² です。`], [`$d = ${n(kmh / 3.6, 3)}^2/(2\\times${n(a * G, 3)}) = ${n(d, 2)}$ m. Doubling the speed quadruples it.`, `$d = ${n(kmh / 3.6, 3)}^2/(2\\times${n(a * G, 3)}) = ${n(d, 2)}$ m です。速さを 2 倍にすると 4 倍になります。`]],
        ...(kmh >= 10 ? { set: { v: kmh } } : {}),
      };
    },
    (r) => {
      const form = r.int(0, 1), mu = r.step(0.3, 0.9, 0.1), lf = r.step(0.55, 0.7, 0.05), h = r.step(1.0, 1.2, 0.05);
      if (form === 0) {
        const a = (mu * lf) / (WB + mu * h);
        return {
          q: [`Using only the rear brake, with grip $\\mu = ${n(mu, 1)}$, wheelbase 1.02 m, centre of mass $${n(h, 2)}$ m high and $${n(lf, 2)}$ m behind the front contact, what is the greatest deceleration in units of $g$?`, `後ブレーキだけを使います。グリップ $\\mu = ${n(mu, 1)}$、ホイールベース 1.02 m、重心の高さ $${n(h, 2)}$ m、前輪接地点から重心まで $${n(lf, 2)}$ m のとき、最大の減速度は $g$ を単位としていくらですか。`],
          a: { type: 'num', v: a, tol: 0.004 },
          hint: ['The rear load is $m(g\\ell_f - ah)/w$ and the brake force is at most $\\mu$ times it.', '後輪の荷重は $m(g\\ell_f - ah)/w$ で、制動力は最大でその $\\mu$ 倍です。'],
          sol: [['$ma = \\mu N_r = \\mu m(g\\ell_f - ah)/w$, so $a(w + \\mu h) = \\mu g\\ell_f$.', '$ma = \\mu N_r = \\mu m(g\\ell_f - ah)/w$ なので、$a(w + \\mu h) = \\mu g\\ell_f$ です。'], [`$a/g = ${n(mu, 1)}\\times${n(lf, 2)}/(1.02 + ${n(mu, 1)}\\times${n(h, 2)}) = ${n(a, 3)}$: far below the grip $${n(mu, 1)}$, because braking takes load off the very wheel that is doing it.`, `$a/g = ${n(mu, 1)}\\times${n(lf, 2)}/(1.02 + ${n(mu, 1)}\\times${n(h, 2)}) = ${n(a, 3)}$ です。グリップ $${n(mu, 1)}$ よりずっと小さいのは、制動が、制動している車輪そのものから荷重を抜くからです。`]],
          set: { mode: 1, mu, lf, h },
        };
      }
      const a = r.step(0.2, 0.5, 0.05), Nf = (WB - lf + a * h) / WB;
      return {
        q: [`A bicycle (wheelbase 1.02 m, centre of mass $${n(h, 2)}$ m high and $${n(lf, 2)}$ m behind the front contact) brakes at $${n(a, 2)}\\,g$. What fraction of the total weight does the front wheel carry?`, `自転車（ホイールベース 1.02 m、重心の高さ $${n(h, 2)}$ m、前輪接地点から重心まで $${n(lf, 2)}$ m）が $${n(a, 2)}\\,g$ で制動しています。前輪は全重量のどれだけを支えていますか。`],
        a: { type: 'num', v: Nf, tol: 0.006 },
        hint: ['$N_f = m(g\\ell_r + ah)/w$ with $\\ell_r = w - \\ell_f$.', '$\\ell_r = w - \\ell_f$ として $N_f = m(g\\ell_r + ah)/w$ です。'],
        sol: [[`At rest the front carries $\\ell_r/w = ${n(WB - lf, 2)}/1.02 = ${n((WB - lf) / WB, 3)}$.`, `止まっているとき、前輪は $\\ell_r/w = ${n(WB - lf, 2)}/1.02 = ${n((WB - lf) / WB, 3)}$ を支えます。`], [`Braking adds $ah/(gw) = ${n(a, 2)}\\times${n(h, 2)}/1.02 = ${n((a * h) / WB, 3)}$.`, `制動によって $ah/(gw) = ${n(a, 2)}\\times${n(h, 2)}/1.02 = ${n((a * h) / WB, 3)}$ が加わります。`], [`$N_f/mg = ${n(Nf, 3)}$, leaving $${n(1 - Nf, 3)}$ on the rear.`, `$N_f/mg = ${n(Nf, 3)}$ で、後輪には $${n(1 - Nf, 3)}$ が残ります。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2), lf = r.step(0.55, 0.75, 0.05), h = r.step(0.95, 1.25, 0.05);
      if (form === 0) return {
        q: [`With the front brake alone (wheelbase $w$, centre of mass at height $${n(h, 2)}$ m, $${n(lf, 2)}$ m behind the front contact), above what grip $\\mu$ does the rear wheel lift before the front tyre skids?`, `前ブレーキだけを使うとき（ホイールベース $w$、重心の高さ $${n(h, 2)}$ m、前輪接地点から $${n(lf, 2)}$ m 後ろ）、グリップ $\\mu$ がいくつを超えると、前タイヤが滑るより先に後輪が浮きますか。`],
        a: { type: 'num', v: lf / h, tol: 0.006 },
        hint: ['At the moment the rear wheel lifts, all the weight is on the front tyre.', '後輪が浮く瞬間、重さはすべて前タイヤにかかっています。'],
        sol: [['When the rear wheel lifts, $N_f = mg$ and the deceleration is $g\\ell_f/h$, needing a friction force $mg\\ell_f/h$.', '後輪が浮くとき $N_f = mg$ で、減速度は $g\\ell_f/h$ です。必要な摩擦力は $mg\\ell_f/h$ です。'], [`The tyre can supply $\\mu mg$, so pitch-over comes first when $\\mu > \\ell_f/h = ${n(lf / h, 3)}$, whatever the wheelbase.`, `タイヤが出せるのは $\\mu mg$ なので、ホイールベースによらず、$\\mu > \\ell_f/h = ${n(lf / h, 3)}$ のとき前転が先に起こります。`], ['Dry tarmac gives about 0.8, so on a good road every upright bicycle is limited by pitch-over, not grip.', '乾いた舗装路では約 0.8 なので、よい路面では、どんな普通の自転車もグリップではなく前転で制限されます。']],
        set: { mode: 0, lf, h, mu: Math.min(1.1, Math.round((lf / h) * 50) / 50) },
      };
      if (form === 1) {
        const a = r.step(0.6, 0.9, 0.05), need = a * h;
        return {
          q: [`A rider wants to brake at $${n(a, 2)}\\,g$ without the rear wheel lifting, with the centre of mass $${n(h, 2)}$ m high. How far behind the front contact must the centre of mass be, in metres?`, `乗り手が、重心の高さ $${n(h, 2)}$ m のまま、後輪を浮かせずに $${n(a, 2)}\\,g$ で制動したいと考えています。重心は前輪の接地点から何 m 後ろになければなりませんか。`],
          a: { type: 'num', v: need, tol: 0.006, unit: ['m', 'm'] },
          hint: ['The limit is $a/g = \\ell_f/h$.', '限界は $a/g = \\ell_f/h$ です。'],
          sol: [[`$\\ell_f = (a/g)\\,h = ${n(a, 2)}\\times${n(h, 2)} = ${n(need, 3)}$ m.`, `$\\ell_f = (a/g)\\,h = ${n(a, 2)}\\times${n(h, 2)} = ${n(need, 3)}$ m です。`], [need > 0.85 ? 'That is further back than a rider can reach on a normal bicycle: this deceleration needs a lower centre of mass too, as on a recumbent.' : 'Sliding off the back of the saddle with straight arms gets there, which is the emergency-stop position.', need > 0.85 ? '普通の自転車で乗り手が届く範囲より後ろです。この減速度には、リカンベントのように重心を低くすることも必要です。' : '腕を伸ばしてサドルの後ろへ腰を引くと届きます。これが急制動の姿勢です。']],
          ...(need <= 0.85 && need >= 0.4 ? { set: { mode: 0, mu: 1.1, lf: Math.round(need * 100) / 100, h } } : {}),
        };
      }
      const mu = 0.8, af = Math.min((mu * (WB - lf)) / (WB - mu * h > 0 ? WB - mu * h : 1e-9), lf / h), ar = (mu * lf) / (WB + mu * h);
      return {
        q: [`On dry tarmac ($\\mu = 0.8$), wheelbase 1.02 m, centre of mass $${n(h, 2)}$ m high and $${n(lf, 2)}$ m behind the front contact. How many times longer is the stopping distance with the rear brake alone than with the front brake alone?`, `乾いた舗装路（$\\mu = 0.8$）、ホイールベース 1.02 m、重心の高さ $${n(h, 2)}$ m、前輪接地点から $${n(lf, 2)}$ m 後ろとします。後ブレーキだけの停止距離は、前ブレーキだけの場合の何倍ですか。`],
        a: { type: 'num', v: af / ar, rel: 0.01 },
        hint: ['Distance is inversely proportional to deceleration. Find both limits.', '停止距離は減速度に反比例します。両方の限界を求めます。'],
        sol: [[`Front: skid would need $${n((mu * (WB - lf)) / Math.max(1e-9, WB - mu * h), 2)}\\,g$ but the rear lifts at $${n(lf / h, 3)}\\,g$, so $a_f = ${n(af, 3)}\\,g$.`, `前：滑りには $${n((mu * (WB - lf)) / Math.max(1e-9, WB - mu * h), 2)}\\,g$ が必要ですが、後輪は $${n(lf / h, 3)}\\,g$ で浮くので、$a_f = ${n(af, 3)}\\,g$ です。`], [`Rear: $a_r = 0.8\\times${n(lf, 2)}/(1.02 + 0.8\\times${n(h, 2)}) = ${n(ar, 3)}\\,g$.`, `後：$a_r = 0.8\\times${n(lf, 2)}/(1.02 + 0.8\\times${n(h, 2)}) = ${n(ar, 3)}\\,g$ です。`], [`The ratio of distances is $a_f/a_r = ${n(af / ar, 2)}$.`, `停止距離の比は $a_f/a_r = ${n(af / ar, 2)}$ です。`]],
        set: { mode: 1, mu: 0.8, lf, h },
      };
    },
  ];

  /* ---------------- bicycle-brake-systems ---------------- */
  const ROT = [0.14, 0.16, 0.18, 0.203];
  Q['bicycle-brake-systems'] = [
    (r) => {
      const form = r.int(0, 1), dm = r.pick([9, 10, 11]), ds = r.pick([19, 21, 22, 24]);
      if (form === 0) return {
        q: [`A hydraulic brake has a $${dm}$ mm master piston and $${ds}$ mm caliper pistons. By what factor is the force on each caliper piston larger than the force on the master piston?`, `ある油圧ブレーキのマスターピストンは直径 $${dm}$ mm、キャリパーのピストンは直径 $${ds}$ mm です。キャリパーのピストン 1 個にかかる力は、マスターピストンにかかる力の何倍ですか。`],
        a: { type: 'num', v: (ds / dm) ** 2, rel: 0.005 },
        hint: ['Pascal’s principle: equal pressure, so force is proportional to area.', 'パスカルの原理：圧力が等しいので、力は面積に比例します。'],
        sol: [['The fluid carries the same pressure everywhere, and $F = pA$.', '作動油はどこでも同じ圧力を伝え、$F = pA$ です。'], [`Area goes as diameter squared: $(${ds}/${dm})^2 = ${n((ds / dm) ** 2, 3)}$.`, `面積は直径の二乗に比例するので、$(${ds}/${dm})^2 = ${n((ds / dm) ** 2, 3)}$ です。`]],
        set: { type: 1 },
      };
      const F = r.step(200, 600, 50), p = F / ((PI * (dm / 1000) ** 2) / 4);
      return {
        q: [`A brake lever pushes a $${dm}$ mm master piston with $${F}$ N. What is the pressure in the hose, in bar?`, `ブレーキレバーが、直径 $${dm}$ mm のマスターピストンを $${F}$ N で押しています。ホース内の圧力は何 bar ですか。`],
        a: { type: 'num', v: p / 1e5, rel: 0.01, unit: ['bar', 'bar'] },
        hint: ['$p = F/A$ and 1 bar $= 10^5$ Pa.', '$p = F/A$、1 bar $= 10^5$ Pa です。'],
        sol: [[`$A = \\pi(${n(dm / 2000, 4)})^2 = ${n(((PI * (dm / 1000) ** 2) / 4) * 1e6, 2)}$ mm².`, `$A = \\pi(${n(dm / 2000, 4)})^2 = ${n(((PI * (dm / 1000) ** 2) / 4) * 1e6, 2)}$ mm² です。`], [`$p = ${F}/${n(((PI * (dm / 1000) ** 2) / 4) * 1e6, 2)}\\times10^{6}$ Pa $= ${n(p / 1e5, 1)}$ bar, tens of times the pressure in a car tyre.`, `$p = ${F}/${n(((PI * (dm / 1000) ** 2) / 4) * 1e6, 2)}\\times10^{6}$ Pa $= ${n(p / 1e5, 1)}$ bar で、自動車のタイヤの圧力の数十倍です。`]],
        set: { type: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 1), F = r.step(40, 120, 10);
      if (form === 0) {
        const wet = r.int(0, 1), mu = wet ? 0.3 : 0.7, N = F * 4 * 1.3 * 0.85, T = (2 * mu * N * 0.311) / 0.34;
        return {
          q: [`A rim brake: lever ratio 4, caliper ratio 1.3, cable efficiency 0.85. With $${F}$ N at the lever and pad friction $\\mu = ${mu}$ on a ${wet ? 'wet' : 'dry'} rim (braking radius 0.311 m, tyre radius 0.34 m), what is the braking force at the tyre, in newtons?`, `リムブレーキで、レバー比 4、キャリパー比 1.3、ワイヤーの効率 0.85 とします。レバーに $${F}$ N をかけ、${wet ? '濡れた' : '乾いた'}リムでのパッドの摩擦係数が $\\mu = ${mu}$（制動半径 0.311 m、タイヤ半径 0.34 m）のとき、タイヤでの制動力は何 N ですか。`],
          a: { type: 'num', v: T, rel: 0.01, unit: ['N', 'N'] },
          hint: ['Pad force, then friction on two pads, then the ratio of radii.', 'パッドの力、二枚のパッドの摩擦、そして半径の比の順に計算します。'],
          sol: [[`Each pad: $${F}\\times4\\times1.3\\times0.85 = ${n(N, 1)}$ N.`, `パッド 1 枚あたり $${F}\\times4\\times1.3\\times0.85 = ${n(N, 1)}$ N です。`], [`Friction on both sides of the rim: $2\\times${mu}\\times${n(N, 1)} = ${n(2 * mu * N, 1)}$ N.`, `リムの両側の摩擦は $2\\times${mu}\\times${n(N, 1)} = ${n(2 * mu * N, 1)}$ N です。`], [`At the tyre: $\\times\\,0.311/0.34 = ${n(T, 0)}$ N, a deceleration of $${n(T / (80 * G), 2)}\\,g$ for 80 kg.`, `タイヤでは $0.311/0.34$ を掛けて $${n(T, 0)}$ N で、80 kg に対して $${n(T / (80 * G), 2)}\\,g$ の減速度です。`]],
          set: { type: 0, F, wet },
        };
      }
      const ri = r.int(0, 3), D = ROT[ri], rr = D / 2 - 0.012, N = F * 7 * 4.84 * 0.95, T = (2 * 0.4 * N * rr) / 0.34;
      return {
        q: [`A hydraulic disc brake: lever ratio 7, piston area ratio 4.84, efficiency 0.95, pad friction 0.4. With $${F}$ N at the lever and a $${n(D * 1000, 0)}$ mm rotor (effective radius $${n(rr * 1000, 1)}$ mm, tyre radius 340 mm), what is the braking force at the tyre, in newtons?`, `油圧ディスクブレーキで、レバー比 7、ピストンの面積比 4.84、効率 0.95、パッドの摩擦係数 0.4 とします。レバーに $${F}$ N をかけ、$${n(D * 1000, 0)}$ mm のローター（有効半径 $${n(rr * 1000, 1)}$ mm、タイヤ半径 340 mm）のとき、タイヤでの制動力は何 N ですか。`],
        a: { type: 'num', v: T, rel: 0.01, unit: ['N', 'N'] },
        hint: ['Pad force, friction on two pads, then scale by rotor radius over tyre radius.', 'パッドの力、二枚のパッドの摩擦を求め、ローター半径とタイヤ半径の比を掛けます。'],
        sol: [[`Each pad: $${F}\\times7\\times4.84\\times0.95 = ${n(N, 0)}$ N.`, `パッド 1 枚あたり $${F}\\times7\\times4.84\\times0.95 = ${n(N, 0)}$ N です。`], [`Friction: $2\\times0.4\\times${n(N, 0)} = ${n(0.8 * N, 0)}$ N at the rotor.`, `摩擦はローターで $2\\times0.4\\times${n(N, 0)} = ${n(0.8 * N, 0)}$ N です。`], [`At the tyre: $\\times\\,${n(rr * 1000, 1)}/340 = ${n(T, 0)}$ N. A larger rotor raises this in proportion to its radius.`, `タイヤでは $${n(rr * 1000, 1)}/340$ を掛けて $${n(T, 0)}$ N です。ローターを大きくすると、その半径に比例して増えます。`]],
        set: { type: 1, F, wet: 0, rotor: ri },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const travel = r.pick([15, 20, 25, 30]), lever = r.pick([6, 7, 8]), area = r.pick([4, 4.84, 5.76]);
        return {
          q: [`A hydraulic brake multiplies force by a lever ratio of $${lever}$ and a piston area ratio of $${n(area, 2)}$. If the fingertip moves $${travel}$ mm, how far does each pad move, in mm? (Ignore losses.)`, `ある油圧ブレーキは、レバー比 $${lever}$ とピストンの面積比 $${n(area, 2)}$ で力を増やします。指先が $${travel}$ mm 動くとき、パッドはそれぞれ何 mm 動きますか（損失は無視します）。`],
          a: { type: 'num', v: travel / (lever * area), rel: 0.01, unit: ['mm', 'mm'] },
          hint: ['Work in equals work out: force up by a factor means travel down by the same factor.', '入る仕事と出る仕事は等しいので、力が何倍かになれば、動きは同じ倍率で小さくなります。'],
          sol: [[`The total force ratio is $${lever}\\times${n(area, 2)} = ${n(lever * area, 2)}$.`, `力の倍率は全体で $${lever}\\times${n(area, 2)} = ${n(lever * area, 2)}$ です。`], [`Pad travel $= ${travel}/${n(lever * area, 2)} = ${n(travel / (lever * area), 3)}$ mm. The pads therefore rest only a few tenths of a millimetre from the rotor, and a slightly bent rotor rubs.`, `パッドの動きは $${travel}/${n(lever * area, 2)} = ${n(travel / (lever * area), 3)}$ mm です。そのためパッドはローターから 10 分の数ミリメートルしか離れておらず、少し曲がったローターはこすれます。`]],
          set: { type: 1 },
        };
      }
      if (form === 1) {
        const kmh = r.step(30, 70, 10), mrot = r.pick([0.11, 0.13, 0.16]), E = 0.5 * 80 * (kmh / 3.6) ** 2, dT = E / (mrot * 460);
        return {
          q: [`An 80 kg rider and bicycle stop from $${kmh}$ km/h using one disc brake. If all the kinetic energy heats a $${n(mrot * 1000, 0)}$ g steel rotor ($c = 460$ J/(kg K)), by how many kelvin does it warm?`, `合わせて 80 kg の乗り手と自転車が、ディスクブレーキ一つで $${kmh}$ km/h から止まります。運動エネルギーがすべて $${n(mrot * 1000, 0)}$ g の鋼のローター（$c = 460$ J/(kg K)）を温めるとすると、温度は何 K 上がりますか。`],
          a: { type: 'num', v: dT, rel: 0.01, unit: ['K', 'K'] },
          hint: ['$\\tfrac12mv^2 = m_bc\\,\\Delta T$.', '$\\tfrac12mv^2 = m_bc\\,\\Delta T$ です。'],
          sol: [[`$\\tfrac12\\times80\\times${n(kmh / 3.6, 3)}^2 = ${n(E, 0)}$ J.`, `$\\tfrac12\\times80\\times${n(kmh / 3.6, 3)}^2 = ${n(E, 0)}$ J です。`], [`$\\Delta T = ${n(E, 0)}/(${n(mrot, 2)}\\times460) = ${n(dT, 0)}$ K. On a long descent the rotor must shed this heat to the air as fast as it arrives, which is why rotors are thin, large and slotted.`, `$\\Delta T = ${n(E, 0)}/(${n(mrot, 2)}\\times460) = ${n(dT, 0)}$ K です。長い下りでは、ローターはこの熱を入ってくるのと同じ速さで空気へ逃がさなければなりません。ローターが薄く、大きく、穴が開いているのはそのためです。`]],
          set: { type: 1 },
        };
      }
      const a = r.step(0.3, 0.55, 0.05), ri = r.int(0, 3), rr = ROT[ri] / 2 - 0.012, per = (2 * 0.4 * 7 * 4.84 * 0.95 * rr) / 0.34, F = (a * 80 * G) / per;
      return {
        q: [`What hand force gives an 80 kg rider and bicycle a deceleration of $${n(a, 2)}\\,g$ with one hydraulic disc brake on a $${n(ROT[ri] * 1000, 0)}$ mm rotor? Use lever ratio 7, area ratio 4.84, efficiency 0.95, $\\mu = 0.4$, effective rotor radius $${n(rr * 1000, 1)}$ mm and tyre radius 340 mm.`, `$${n(ROT[ri] * 1000, 0)}$ mm のローターの油圧ディスクブレーキ一つで、合わせて 80 kg の乗り手と自転車に $${n(a, 2)}\\,g$ の減速度を与えるには、手の力はどれだけ必要ですか。レバー比 7、面積比 4.84、効率 0.95、$\\mu = 0.4$、ローターの有効半径 $${n(rr * 1000, 1)}$ mm、タイヤ半径 340 mm とします。`],
        a: { type: 'num', v: F, rel: 0.01, unit: ['N', 'N'] },
        hint: ['Find the tyre force per newton at the lever, then divide the force needed by it.', 'レバーでの 1 N あたりのタイヤでの力を求め、必要な力をそれで割ります。'],
        sol: [[`Force needed at the tyre: $${n(a, 2)}\\times80\\times9.81 = ${n(a * 80 * G, 1)}$ N.`, `タイヤで必要な力は $${n(a, 2)}\\times80\\times9.81 = ${n(a * 80 * G, 1)}$ N です。`], [`Per newton at the lever: $2\\times0.4\\times7\\times4.84\\times0.95\\times${n(rr * 1000, 1)}/340 = ${n(per, 3)}$ N.`, `レバーでの 1 N あたりでは $2\\times0.4\\times7\\times4.84\\times0.95\\times${n(rr * 1000, 1)}/340 = ${n(per, 3)}$ N です。`], [`$F = ${n(a * 80 * G, 1)}/${n(per, 3)} = ${n(F, 1)}$ N, ${F < 60 ? 'a light squeeze with one or two fingers.' : 'a firm squeeze; a larger rotor would reduce it.'}`, `$F = ${n(a * 80 * G, 1)}/${n(per, 3)} = ${n(F, 1)}$ N で、${F < 60 ? '指 1 本か 2 本で軽く握る程度です。' : 'しっかり握る力です。ローターを大きくすれば小さくできます。'}`]],
        set: { type: 1, wet: 0, rotor: ri, F: Math.min(150, Math.round(F / 2) * 2) },
      };
    },
  ];
})();
