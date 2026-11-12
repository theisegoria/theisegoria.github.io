'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const RPMS = [5400, 7200, 10000, 15000], SEEK = 0.0008 + 0.0152 * (8 / 15);
  const Qf = (x) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x >= 0 ? p : 1 - p; };

  Q['hdd-seek'] = [
    (r) => {
      const i = r.int(0, 3), rpm = RPMS[i], form = r.int(0, 1);
      if (form === 0) return {
        q: [`A disc spins at $${rpm}$ rpm. How long, in milliseconds, is the average wait for a block to come round to the head?`, `ディスクが $${rpm}$ rpm で回っています。ブロックがヘッドの下に来るまでの平均の待ち時間は何ミリ秒ですか。`],
        a: { type: 'num', v: 30000 / rpm, rel: 0.01, unit: ['ms', 'ms'] }, hint: ['On average, half a revolution.', '平均して半回転です。'],
        sol: [[`One turn takes $60/${rpm}$ s $= ${n(60000 / rpm, 2)}$ ms.`, `1 回転は $60/${rpm}$ s $= ${n(60000 / rpm, 2)}$ ms です。`], [`Half of that: $${n(30000 / rpm, 2)}$ ms.`, `その半分で $${n(30000 / rpm, 2)}$ ms です。`]], set: { rpm: i },
      };
      const rr = r.step(21, 46, 1), v = (rpm / 60) * 2 * Math.PI * (rr / 1000);
      return {
        q: [`At $${rpm}$ rpm, how fast does a track of radius $${rr}$ mm move under the head, in m/s?`, `$${rpm}$ rpm のとき、半径 $${rr}$ mm のトラックはヘッドの下を何 m/s で通りますか。`],
        a: { type: 'num', v, rel: 0.01, unit: ['m/s', 'm/s'] }, hint: ['$v = 2\\pi r\\,n/60$.', '$v = 2\\pi r\\,n/60$ です。'],
        sol: [[`The disc turns $${n(rpm / 60, 1)}$ times a second and the track is $2\\pi\\times${n(rr / 1000, 3)} = ${n(2 * Math.PI * rr / 1000, 4)}$ m round.`, `ディスクは毎秒 $${n(rpm / 60, 1)}$ 回転し、トラックの 1 周は $2\\pi\\times${n(rr / 1000, 3)} = ${n(2 * Math.PI * rr / 1000, 4)}$ m です。`], [`$v = ${n(v, 2)}$ m/s, or $${n(v * 3.6, 0)}$ km/h, a few nanometres under the head.`, `$v = ${n(v, 2)}$ m/s、すなわち時速 $${n(v * 3.6, 0)}$ km で、ヘッドの数ナノメートル下を通ります。`]], set: { rpm: i, r: rr },
      };
    },
    (r) => {
      const i = r.int(0, 3), rpm = RPMS[i], seek = r.step(4, 12, 0.5), iops = 1 / (seek / 1000 + 30 / rpm);
      return {
        q: [`A drive has a mean seek time of $${n(seek, 1)}$ ms and spins at $${rpm}$ rpm. About how many random reads can it complete per second?`, `平均シーク時間が $${n(seek, 1)}$ ms で、$${rpm}$ rpm で回るドライブがあります。毎秒およそ何回のランダム読み出しをこなせますか。`],
        a: { type: 'num', v: iops, rel: 0.02 }, hint: ['Each read costs a seek plus half a turn.', '読み出し 1 回には、シークと半回転がかかります。'],
        sol: [[`Wait for the disc: $${n(30000 / rpm, 2)}$ ms. Total per read: $${n(seek + 30000 / rpm, 2)}$ ms.`, `円盤の待ち時間は $${n(30000 / rpm, 2)}$ ms で、読み出し 1 回の合計は $${n(seek + 30000 / rpm, 2)}$ ms です。`], [`$1000/${n(seek + 30000 / rpm, 2)} = ${n(iops, 0)}$ reads a second: the size of the drive does not enter.`, `$1000/${n(seek + 30000 / rpm, 2)} = ${n(iops, 0)}$ 回です。ドライブの容量は関係しません。`]], set: { rpm: i },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.pick([4, 9, 16, 25]);
        return {
          q: [`A voice-coil actuator accelerates at a constant rate for the first half of a seek and brakes at the same rate for the second half. If the head must travel $${k}$ times as far, by what factor does the travel time grow (ignoring settling)?`, `ボイスコイルのアクチュエータは、シークの前半を一定の加速度で加速し、後半を同じ加速度で減速します。ヘッドが動く距離が $${k}$ 倍になると、移動時間は何倍になりますか（整定時間は無視します）。`],
          a: { type: 'num', v: Math.sqrt(k), rel: 0.005 }, hint: ['Distance under constant acceleration goes as $t^2$.', '一定の加速度での移動距離は $t^2$ に比例します。'],
          sol: [['Each half covers $\\tfrac12a(t/2)^2$, so the distance is $at^2/4$ and $t = 2\\sqrt{d/a}$.', '前半と後半はそれぞれ $\\tfrac12a(t/2)^2$ 進むので、距離は $at^2/4$、$t = 2\\sqrt{d/a}$ です。'], [`Time goes as the square root of distance: $\\sqrt{${k}} = ${Math.sqrt(k)}$. Long seeks are cheap per millimetre, short ones are dominated by settling.`, `時間は距離の平方根に比例するので、$\\sqrt{${k}} = ${Math.sqrt(k)}$ 倍です。長いシークは 1 ミリメートルあたりでは安く、短いシークは整定時間が支配します。`]],
        };
      }
      const rate = r.step(120, 280, 10), rpm = 7200, rr = 46, dens = (rate * 8e6) / ((rpm / 60) * 2 * Math.PI * (rr / 1000)) / 1e6;
      return {
        q: [`A $7200$ rpm drive reads $${rate}$ MB/s on its outermost track, radius $46$ mm. How many megabits are stored along each metre of that track? (1 MB $= 8\\times10^6$ bits.)`, `$7200$ rpm のドライブが、最も外側の半径 $46$ mm のトラックで $${rate}$ MB/s で読めます。そのトラックの 1 メートルあたりに何メガビット記憶されていますか（1 MB $= 8\\times10^6$ ビット）。`],
        a: { type: 'num', v: dens, rel: 0.01, unit: ['Mbit/m', 'Mbit/m（メガビット毎メートル）'] }, hint: ['Bits per second divided by metres per second.', '毎秒のビット数を、毎秒進むメートル数で割ります。'],
        sol: [[`The track passes at $120\\times2\\pi\\times0.046 = ${n(120 * 2 * Math.PI * 0.046, 2)}$ m/s.`, `トラックは $120\\times2\\pi\\times0.046 = ${n(120 * 2 * Math.PI * 0.046, 2)}$ m/s で通ります。`], [`$${rate}\\times8\\times10^6/${n(120 * 2 * Math.PI * 0.046, 2)} = ${n(dens, 1)}$ Mbit per metre: one bit every $${n(1000 / dens, 1)}$ nm.`, `$${rate}\\times8\\times10^6/${n(120 * 2 * Math.PI * 0.046, 2)} = ${n(dens, 1)}$ Mbit/m で、ビット 1 個は $${n(1000 / dens, 1)}$ nm ごとに並びます。`]], set: { rpm: 1, r: 46 },
      };
    },
  ];

  Q['nand-levels'] = [
    (r) => {
      const b = r.int(1, 5), form = r.int(0, 1);
      if (form === 0) return {
        q: [`How many distinct threshold-voltage levels must a flash cell hold to store $${b}$ bit${b > 1 ? 's' : ''}?`, `フラッシュセルが $${b}$ ビットを記憶するには、何通りのしきい値電圧レベルが必要ですか。`],
        a: { type: 'int', v: 2 ** b }, hint: ['Each extra bit doubles the count.', 'ビットが 1 つ増えるごとに 2 倍になります。'],
        sol: [[`$2^{${b}} = ${2 ** b}$ levels.`, `$2^{${b}} = ${2 ** b}$ レベルです。`], [`They need $${2 ** b - 1}$ reference voltages between them.`, `その間に $${2 ** b - 1}$ 個の参照電圧が必要です。`]], ...(b <= 4 ? { set: { bits: b } } : {}),
      };
      const W = r.pick([4.2, 4.8, 5.6]);
      return {
        q: [`The programmed levels of a cell storing $${Math.min(b + 1, 4)}$ bits are spread evenly over a window of $${n(W, 1)}$ V (the erased level lies outside it). How far apart are neighbouring programmed levels, in volts?`, `$${Math.min(b + 1, 4)}$ ビットを記憶するセルの書き込みレベルが、$${n(W, 1)}$ V の窓に等間隔で並んでいます（消去レベルは窓の外です）。隣どうしの書き込みレベルの間隔は何 V ですか。`],
        a: { type: 'num', v: W / (2 ** Math.min(b + 1, 4) - 2), rel: 0.01, unit: ['V', 'V'] }, hint: ['One level is the erased one; the rest span the window end to end.', '1 つは消去レベルで、残りが窓の端から端まで並びます。'],
        sol: [[`There are $${2 ** Math.min(b + 1, 4) - 1}$ programmed levels, so $${2 ** Math.min(b + 1, 4) - 2}$ gaps.`, `書き込みレベルは $${2 ** Math.min(b + 1, 4) - 1}$ 個で、すき間は $${2 ** Math.min(b + 1, 4) - 2}$ 個です。`], [`$${n(W, 1)}/${2 ** Math.min(b + 1, 4) - 2} = ${n(W / (2 ** Math.min(b + 1, 4) - 2), 3)}$ V.`, `$${n(W, 1)}/${2 ** Math.min(b + 1, 4) - 2} = ${n(W / (2 ** Math.min(b + 1, 4) - 2), 3)}$ V です。`]], set: { bits: Math.min(b + 1, 4) },
      };
    },
    (r) => {
      const gap = r.pick([0.4, 0.6, 0.8, 1.0]), sig = r.pick([0.1, 0.125, 0.15, 0.2]), z = gap / 2 / sig, pr = Qf(z);
      return {
        q: [`Two neighbouring levels are $${n(gap, 1)}$ V apart and each is a normal distribution with standard deviation $${n(sig * 1000, 0)}$ mV. With the reference halfway between them, how many standard deviations is it from each level's centre?`, `隣り合う二つのレベルが $${n(gap, 1)}$ V 離れていて、それぞれ標準偏差 $${n(sig * 1000, 0)}$ mV の正規分布です。参照電圧をちょうど中間に置くと、各レベルの中心から標準偏差の何倍離れていますか。`],
        a: { type: 'num', v: z, rel: 0.01 }, hint: ['Half the gap divided by the standard deviation.', 'すき間の半分を標準偏差で割ります。'],
        sol: [[`Half the gap is $${n(gap * 500, 0)}$ mV, which is $${n(gap * 500, 0)}/${n(sig * 1000, 0)} = ${n(z, 2)}$ standard deviations.`, `すき間の半分は $${n(gap * 500, 0)}$ mV で、$${n(gap * 500, 0)}/${n(sig * 1000, 0)} = ${n(z, 2)}$ 標準偏差です。`], [`A fraction $Q(${n(z, 2)}) \\approx ${pr < 1e-3 ? pr.toExponential(1).replace('e', '\\times10^{') + '}' : n(pr, 4)}$ of the cells in each level falls on the wrong side and is misread.`, `各レベルのセルのうち $Q(${n(z, 2)}) \\approx ${pr < 1e-3 ? pr.toExponential(1).replace('e', '\\times10^{') + '}' : n(pr, 4)}$ の割合が反対側に落ち、読み誤られます。`]],
      };
    },
    (r) => {
      const cap = r.pick([250, 500, 1000, 2000]), cyc = r.pick([600, 1000, 3000]), wa = r.pick([2, 3, 4]), perDay = r.pick([20, 40, 80]), years = (cap * cyc) / wa / perDay / 365;
      return {
        q: [`A $${cap}$ GB drive uses cells rated for $${cyc}$ program/erase cycles. Its controller writes $${wa}$ GB to flash for every GB the computer sends (write amplification $${wa}$). If the computer writes $${perDay}$ GB a day, how many years until the cells reach their rating?`, `$${cap}$ GB のドライブが、書き込み・消去 $${cyc}$ 回の定格のセルを使っています。コントローラは、コンピュータが送る 1 GB ごとにフラッシュへ $${wa}$ GB 書き込みます（ライトアンプリフィケーション $${wa}$）。コンピュータが 1 日に $${perDay}$ GB 書き込むとき、セルが定格に達するまで何年かかりますか。`],
        a: { type: 'num', v: years, rel: 0.02, unit: ['years', '年'] }, hint: ['Total flash writes available = capacity × cycles; divide by the flash writes per day.', 'フラッシュに書ける総量は、容量 × 回数です。それを 1 日あたりのフラッシュへの書き込み量で割ります。'],
        sol: [[`The flash can absorb $${cap}\\times${cyc} = ${n(cap * cyc / 1000, 0)}$ TB of writes, spread evenly by wear levelling.`, `ウェアレベリングで均等に分散すると、フラッシュは $${cap}\\times${cyc} = ${n(cap * cyc / 1000, 0)}$ TB の書き込みを受けられます。`], [`Each day costs $${perDay}\\times${wa} = ${perDay * wa}$ GB of flash writes.`, `1 日あたりのフラッシュへの書き込みは $${perDay}\\times${wa} = ${perDay * wa}$ GB です。`], [`$${n(cap * cyc, 0)}/${perDay * wa} = ${n(cap * cyc / wa / perDay, 0)}$ days, about $${n(years, 1)}$ years.`, `$${n(cap * cyc, 0)}/${perDay * wa} = ${n(cap * cyc / wa / perDay, 0)}$ 日、およそ $${n(years, 1)}$ 年です。`]], set: { lc: Math.round(Math.log10(cyc) * 20) / 20 },
      };
    },
  ];

  Q['storage-latency'] = [
    (r) => {
      const gb = r.pick([1, 2, 4, 8, 16, 32]), dev = r.int(0, 2), rate = [200, 550, 7000][dev], nm = [['hard disc', 'ハードディスク'], ['SATA SSD', 'SATA SSD'], ['NVMe SSD', 'NVMe SSD']][dev], t = (gb * 2 ** 30) / (rate * 1e6);
      return {
        q: [`How many seconds does a ${nm[0]} reading sequentially at $${rate}$ MB/s take to read a $${gb}$ GiB file stored in one run? (1 GiB $= 2^{30}$ bytes, 1 MB $= 10^6$ bytes.)`, `$${rate}$ MB/s で連続読み出しをする${nm[1]}が、一続きに保存された $${gb}$ GiB のファイルを読むのに何秒かかりますか（1 GiB $= 2^{30}$ バイト、1 MB $= 10^6$ バイト）。`],
        a: { type: 'num', v: t, rel: 0.01, unit: ['s', 's'] }, hint: ['Bytes divided by bytes per second.', 'バイト数を毎秒のバイト数で割ります。'],
        sol: [[`$${gb}\\times2^{30} = ${n(gb * 2 ** 30 / 1e9, 3)}\\times10^9$ bytes.`, `$${gb}\\times2^{30} = ${n(gb * 2 ** 30 / 1e9, 3)}\\times10^9$ バイトです。`], [`Divided by $${rate}\\times10^6$: $${n(t, 2)}$ s.`, `$${rate}\\times10^6$ で割って $${n(t, 2)}$ s です。`]], set: { lg: 30 + Math.log2(gb), rnd: 0, lq: 0 },
      };
    },
    (r) => {
      const mb = r.pick([64, 128, 256, 512, 1024]), dev = r.int(0, 2), iops = [76, 11111, 40000][dev], nm = [['hard disc (76 random reads a second)', 'ハードディスク（毎秒 76 回のランダム読み出し）'], ['SATA SSD (90 µs per read)', 'SATA SSD（1 回の読み出しに 90 µs）'], ['NVMe SSD (25 µs per read)', 'NVMe SSD（1 回の読み出しに 25 µs）']][dev], blocks = (mb * 2 ** 20) / 4096, t = blocks / iops;
      return {
        q: [`A program reads $${mb}$ MiB as scattered 4 KiB blocks, one at a time, from a ${nm[0]}. How long does it take, in seconds?`, `あるプログラムが、${nm[1]}から、散らばった 4 KiB のブロックとして $${mb}$ MiB を 1 個ずつ読みます。何秒かかりますか。`],
        a: { type: 'num', v: t, rel: 0.02, unit: ['s', 's'] }, hint: ['Count the blocks, then divide by reads per second.', 'ブロックの数を数え、毎秒の読み出し回数で割ります。'],
        sol: [[`$${mb}\\times2^{20}/4096 = ${n(blocks, 0)}$ blocks.`, `$${mb}\\times2^{20}/4096 = ${n(blocks, 0)}$ ブロックです。`], [`At $${n(iops, 0)}$ reads a second: $${n(t, t < 10 ? 2 : 0)}$ s${t > 600 ? `, which is ${n(t / 60, 0)} minutes` : ''}.`, `毎秒 $${n(iops, 0)}$ 回で $${n(t, t < 10 ? 2 : 0)}$ s です${t > 600 ? `。これは ${n(t / 60, 0)} 分です` : ''}。`]], set: { lg: Math.round(Math.log2(mb * 2 ** 20)), rnd: 100, lq: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 1);
      if (form === 0) {
        const lat = r.pick([20, 25, 50, 80, 100]), q = r.pick([4, 8, 16, 32, 64]);
        return {
          q: [`A solid-state drive completes each read in $${lat}$ µs and can work on up to 256 requests at once. How many reads per second does it deliver when the computer keeps $${q}$ requests in flight?`, `あるソリッドステートドライブは、1 回の読み出しを $${lat}$ µs で終え、同時に 256 個まで要求を処理できます。コンピュータが常に $${q}$ 個の要求を出しているとき、毎秒何回の読み出しをこなしますか。`],
          a: { type: 'num', v: q / (lat * 1e-6), rel: 0.01 }, hint: ['Independent requests proceed in parallel.', '独立した要求は並列に進みます。'],
          sol: [[`One request at a time gives $1/${lat}\\,\\mu\\mathrm{s} = ${n(1e6 / lat, 0)}$ reads a second.`, `1 個ずつなら $1/${lat}\\,\\mu\\mathrm{s} = ${n(1e6 / lat, 0)}$ 回です。`], [`With $${q}$ in parallel: $${n(q * 1e6 / lat, 0)}$. A disc cannot do this, because it has a single arm.`, `$${q}$ 個並列で $${n(q * 1e6 / lat, 0)}$ 回です。アームが一本しかないディスクには、これができません。`]], set: { lq: Math.log2(q), rnd: 100 },
        };
      }
      const f = r.pick([1, 2, 5, 10, 20]);
      return {
        q: [`A hard disc reads 200 MB/s sequentially and 76 random 4 KiB blocks a second. What percentage of a file's data, if scattered, makes the scattered part take as long as the remaining sequential part when it is $${f}$ GB in total? Give the percentage to two decimals.`, `あるハードディスクは、連続読み出しで 200 MB/s、ランダムな 4 KiB のブロックを毎秒 76 個読みます。合計 $${f}$ GB のファイルで、散らばった部分にかかる時間が残りの連続部分と等しくなるのは、データの何パーセントが散らばっているときですか。小数第 2 位まで答えてください。`],
        a: { type: 'num', v: 100 * (1 / 200e6) / (1 / 200e6 + 1 / (76 * 4096)), tol: 0.006, unit: ['%', '%'] }, hint: ['Compare time per byte: sequential $1/(200\\times10^6)$ s, random $1/(76\\times4096)$ s.', '1 バイトあたりの時間を比べます。連続は $1/(200\\times10^6)$ s、ランダムは $1/(76\\times4096)$ s です。'],
        sol: [['Random bytes cost $1/(76\\times4096) = 3.21\\times10^{-6}$ s each; sequential bytes cost $5\\times10^{-9}$ s each.', 'ランダムなバイトは 1 個あたり $1/(76\\times4096) = 3.21\\times10^{-6}$ s、連続のバイトは $5\\times10^{-9}$ s です。'], ['Equal times need $x\\cdot3.21\\times10^{-6} = (1-x)\\cdot5\\times10^{-9}$, so $x = 0.156\\%$.', '時間が等しくなるには $x\\cdot3.21\\times10^{-6} = (1-x)\\cdot5\\times10^{-9}$ で、$x = 0.156\\%$ です。'], ['The answer does not depend on the file size: a sixth of one percent of scattered data doubles the time on a disc.', '答えはファイルの大きさによりません。0.16% のデータが散らばるだけで、ディスクでは時間が 2 倍になります。']],
      };
    },
  ];
})();
