'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac } = P.util;

  /* ---------- arithmetic helpers (pure) ---------- */
  const mod = (a, m) => ((a % m) + m) % m;
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const powmod = (b, e, m) => { let r = 1 % m; b = mod(b, m); while (e > 0) { if (e % 2 === 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; };
  const isPrime = (x) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
  const primesUpTo = (x) => { const out = []; for (let k = 2; k <= x; k++) if (isPrime(k)) out.push(k); return out; };
  const phi = (x) => { let r = x; for (let p = 2; p * p <= x; p++) if (x % p === 0) { while (x % p === 0) x /= p; r -= r / p; } if (x > 1) r -= r / x; return r; };
  const spf = (x) => { for (let d = 2; d * d <= x; d++) if (x % d === 0) return d; return x; };
  // extended Euclid with the division steps, for worked solutions
  function euclid(a, m) {
    const rows = []; let r0 = m, r1 = mod(a, m), s0 = 0, s1 = 1;
    while (r1) { const q = Math.floor(r0 / r1); rows.push([r0, q, r1, r0 - q * r1]); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
    return { g: r0, inv: r0 === 1 ? mod(s0, m) : null, rows };
  }
  const euclidTeX = (rows) => rows.slice(0, 5).map(([x, q, y, rr]) => `${x} = ${q}\\cdot ${y} + ${rr}`).join(',\\ ') + (rows.length > 5 ? ',\\ \\dots' : '');
  // square and multiply: the table a^(2^j) mod m and the factors used
  function sqm(a, e, m) {
    const tab = []; let p = 1, v = mod(a, m);
    while (p <= e) { tab.push([p, v]); p *= 2; v = (v * v) % m; }
    const used = tab.filter(([pp]) => Math.floor(e / pp) % 2 === 1);
    return { tab, used, val: powmod(a, e, m) };
  }
  const sqmTeX = (a, s, m) => s.tab.slice(0, 7).map(([p, v]) => `${a}^{${p}} \\equiv ${v}`).join(',\\ ') + (s.tab.length > 7 ? ',\\ \\dots' : '') + ` \\pmod{${m}}`;
  const YN = (yes, enY, jaY, enN, jaN) => ({ type: 'choice', opts: [[enY, jaY], [enN, jaN]], v: yes ? 0 : 1, fixed: true });

  /* ---------- 1. modular clocks (n 3..20, a, b 0..40) ---------- */
  Q.modular = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const m = r.int(3, 20), neg = r.chance(0.3), a = neg ? -r.int(5, 40) : r.int(m + 1, 40), res = mod(a, m), qq = Math.floor(a / m);
        return {
          q: [`What is the least non-negative residue of $${a}$ modulo $${m}$?`, `$${a}$ を $${m}$ で割った最小の非負剰余はいくつですか。`],
          a: { type: 'int', v: res },
          hint: neg ? ['Add multiples of the modulus until you land in $0, 1, \\dots, n - 1$.', '$0, 1, \\dots, n - 1$ に入るまで法の倍数を足してください。'] : ['Divide and keep the remainder.', '割り算をして余りを残します。'],
          sol: [[`$${a} = ${m}\\cdot(${qq}) + ${res}$ with $0 \\le ${res} < ${m}$.`, `$${a} = ${m}\\cdot(${qq}) + ${res}$ で、$0 \\le ${res} < ${m}$ です。`], [neg ? `A negative integer still lands on one of the ${m} hours: $${a}$ sits on the same ray as $${res}$.` : `On the clock, $${a}$ sits on the same ray as $${res}$, ${qq} turn${qq === 1 ? '' : 's'} further out.`, neg ? `負の整数も ${m} 個の時刻のどれかに着きます。$${a}$ は $${res}$ と同じ半直線上にあります。` : `時計の上では $${a}$ は $${res}$ と同じ半直線上にあり、${qq} 周だけ外側にあります。`]],
          set: neg ? { n: m, a: res } : { n: m, a },
        };
      }
      if (kind === 1) {
        const m = r.int(4, 15), a = r.int(m, 40), same = r.chance(0.5);
        let b; do { b = r.int(0, 40); } while (b === a || (mod(b - a, m) === 0) !== same);
        const d = a - b;
        return {
          q: [`Is $${a} \\equiv ${b} \\pmod{${m}}$?`, `$${a} \\equiv ${b} \\pmod{${m}}$ は成り立ちますか。`],
          a: YN(same, `Yes: $${m}$ divides $${a} - ${b}$.`, `はい。$${m}$ は $${a} - ${b}$ を割り切ります。`, `No: $${m}$ does not divide $${a} - ${b}$.`, `いいえ。$${m}$ は $${a} - ${b}$ を割り切りません。`),
          hint: ['Look at the difference, not at the numbers themselves.', '数そのものではなく、差を見てください。'],
          sol: [[`$${a} - ${b} = ${d}$, and $${d} = ${m}\\cdot ${Math.floor(d / m)} + ${mod(d, m)}$.`, `$${a} - ${b} = ${d}$ で、$${d} = ${m}\\cdot ${Math.floor(d / m)} + ${mod(d, m)}$ です。`], [same ? `The remainder is $0$, so both numbers have residue $${mod(a, m)}$ and lie on the same ray.` : `The remainder is not $0$: the residues are $${mod(a, m)}$ and $${mod(b, m)}$, different rays of the clock.`, same ? `余りが $0$ なので、どちらも剰余 $${mod(a, m)}$ をもち、同じ半直線上にあります。` : `余りが $0$ でないので、剰余は $${mod(a, m)}$ と $${mod(b, m)}$ で、時計の別の半直線上にあります。`]],
          set: { n: m, a, b },
        };
      }
      const m = r.int(5, 20), h = r.int(0, m - 1), k = r.int(m + 3, 60), res = mod(h + k, m);
      return {
        q: [`A clock with $${m}$ hours (numbered $0$ to $${m - 1}$) shows $${h}$. What does it show $${k}$ hours later?`, `$0$ から $${m - 1}$ までの $${m}$ 時間の時計が $${h}$ を指しています。$${k}$ 時間後には何を指しますか。`],
        a: { type: 'int', v: res },
        hint: ['Only $k \\bmod n$ matters: whole turns bring the hand back.', '$k \\bmod n$ だけが効きます。ちょうど一周すると針は元に戻ります。'],
        sol: [[`$${k} = ${m}\\cdot ${Math.floor(k / m)} + ${mod(k, m)}$, so ${k} hours is ${Math.floor(k / m)} full turn${Math.floor(k / m) === 1 ? '' : 's'} and $${mod(k, m)}$ more hours.`, `$${k} = ${m}\\cdot ${Math.floor(k / m)} + ${mod(k, m)}$ なので、${k} 時間は ${Math.floor(k / m)} 周と $${mod(k, m)}$ 時間です。`], [`$${h} + ${mod(k, m)} = ${h + mod(k, m)} \\equiv ${res} \\pmod{${m}}$.`, `$${h} + ${mod(k, m)} = ${h + mod(k, m)} \\equiv ${res} \\pmod{${m}}$ です。`]],
        set: h + k <= 40 ? { n: m, a: h + k } : { n: m },
      };
    },
    (r) => {
      const kind = r.int(0, 3);
      if (kind === 0) {
        const m = r.int(5, 20), a = r.int(m + 1, 40), b = r.int(m + 1, 40), ra = mod(a, m), rb = mod(b, m), res = mod(a * b, m);
        return {
          q: [`Compute $${a}\\cdot ${b} \\bmod ${m}$ without multiplying the large numbers.`, `大きな数をかけずに $${a}\\cdot ${b} \\bmod ${m}$ を求めてください。`],
          a: { type: 'int', v: res },
          hint: ['Replace each factor by its residue first.', 'まず各因数を剰余に置き換えます。'],
          sol: [[`$${a} \\equiv ${ra}$ and $${b} \\equiv ${rb} \\pmod{${m}}$.`, `$${a} \\equiv ${ra}$、$${b} \\equiv ${rb} \\pmod{${m}}$ です。`], [`$${ra}\\cdot ${rb} = ${ra * rb} \\equiv ${res} \\pmod{${m}}$; check: $${a * b} = ${m}\\cdot ${Math.floor(a * b / m)} + ${res}$.`, `$${ra}\\cdot ${rb} = ${ra * rb} \\equiv ${res} \\pmod{${m}}$ です。確認：$${a * b} = ${m}\\cdot ${Math.floor(a * b / m)} + ${res}$。`], ['Multiplication respects congruence, which is exactly why the steps of size $a$ and of size $a \\bmod n$ land on the same hour in the figure.', '乗法は合同を保ちます。図で歩幅 $a$ と歩幅 $a \\bmod n$ が同じ時刻に着くのはこのためです。']],
          set: { n: m, a, b },
        };
      }
      if (kind === 1) {
        const m = r.int(5, 20), a = r.int(2, 9), e = r.int(10, 40), s = sqm(a, e, m);
        return {
          q: [`Find $${a}^{${e}} \\bmod ${m}$.`, `$${a}^{${e}} \\bmod ${m}$ を求めてください。`],
          a: { type: 'int', v: s.val },
          hint: ['Square repeatedly, reducing each time, then multiply the powers that make up the exponent in binary.', '毎回剰余をとりながら二乗を繰り返し、指数の二進表示に現れるべきをかけ合わせます。'],
          sol: [[`Repeated squaring: $${sqmTeX(a, s, m)}$.`, `二乗の繰り返し：$${sqmTeX(a, s, m)}$。`], [`$${e} = ${s.used.map(([p]) => p).join(' + ')}$, so $${a}^{${e}} \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${s.val} \\pmod{${m}}$.`, `$${e} = ${s.used.map(([p]) => p).join(' + ')}$ なので $${a}^{${e}} \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${s.val} \\pmod{${m}}$ です。`], ['About $\\log_2 e$ squarings suffice, which is what makes modular powers with huge exponents cheap.', '必要な二乗はおよそ $\\log_2 e$ 回で、巨大な指数のべきでも安く計算できるのはこのためです。']],
          set: { n: m, a },
        };
      }
      if (kind === 2) {
        const a = r.pick([2, 3, 7, 8, 9, 13, 17]), e = r.int(50, 999), M = 10;
        const cyc = []; let x = a % M; while (!cyc.includes(x)) { cyc.push(x); x = (x * a) % M; }
        const L0 = cyc.length, res = powmod(a, e, M), k = mod(e - 1, L0) + 1;
        return {
          q: [`What is the last digit of $${a}^{${e}}$?`, `$${a}^{${e}}$ の一の位はいくつですか。`],
          a: { type: 'int', v: res },
          hint: ['The last digit is the residue mod 10; the powers cycle.', '一の位は 10 を法とする剰余で、べきは周期的に繰り返します。'],
          sol: [[`Powers of $${a}$ mod $10$: $${cyc.join(', ')}$, then they repeat with period $${L0}$.`, `$${a}$ のべきを 10 で割った余りは $${cyc.join(', ')}$ で、以後は周期 $${L0}$ で繰り返します。`], [`$${e} \\equiv ${k} \\pmod{${L0}}$ (counting from 1), so the last digit is the ${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'} entry, $${res}$.`, `$${e}$ を周期 $${L0}$ で数えると ${k} 番目にあたるので、一の位は $${res}$ です。`]],
        };
      }
      let m, a; do { m = r.int(7, 20); a = r.int(2, m - 1); } while (gcd(a, m) !== 1);
      const x = r.int(1, m - 1), c = mod(a * x, m), E = euclid(a, m);
      return {
        q: [`Solve $${a}x \\equiv ${c} \\pmod{${m}}$ for $0 \\le x < ${m}$.`, `$0 \\le x < ${m}$ の範囲で $${a}x \\equiv ${c} \\pmod{${m}}$ を解いてください。`],
        a: { type: 'int', v: x },
        hint: [`Since $\\gcd(${a}, ${m}) = 1$, multiply both sides by the inverse of $${a}$.`, `$\\gcd(${a}, ${m}) = 1$ なので、両辺に $${a}$ の逆元をかけます。`],
        sol: [[`The inverse of $${a}$ mod $${m}$ is $${E.inv}$: $${a}\\cdot ${E.inv} = ${a * E.inv} \\equiv 1$.`, `$${m}$ を法とする $${a}$ の逆元は $${E.inv}$ です：$${a}\\cdot ${E.inv} = ${a * E.inv} \\equiv 1$。`], [`$x \\equiv ${E.inv}\\cdot ${c} = ${E.inv * c} \\equiv ${x} \\pmod{${m}}$; check $${a}\\cdot ${x} = ${a * x} \\equiv ${c}$.`, `$x \\equiv ${E.inv}\\cdot ${c} = ${E.inv * c} \\equiv ${x} \\pmod{${m}}$ です。確認：$${a}\\cdot ${x} = ${a * x} \\equiv ${c}$。`], ['Because $a$ is a unit, $x \\mapsto ax$ permutes the residues and the solution is unique.', '$a$ は単元なので $x \\mapsto ax$ は剰余の置換であり、解はただ一つです。']],
        set: { n: m, a, b: x },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const three = r.chance(0.3);
        const ms = three ? r.pick([[3, 5, 7], [3, 4, 5], [2, 3, 5], [3, 5, 8]]) : (() => { let a, b; do { a = r.int(3, 13); b = r.int(3, 13); } while (a === b || gcd(a, b) !== 1); return [a, b]; })();
        const M = ms.reduce((s, x) => s * x, 1), x = r.int(1, M - 1), rs = ms.map((m) => x % m);
        // build up the solution modulus by modulus
        const steps = []; let cur = rs[0], cm = ms[0];
        for (let i = 1; i < ms.length; i++) { let k = 0; while (mod(cur + cm * k, ms[i]) !== rs[i]) k++; const nx = cur + cm * k; steps.push([cur, cm, k, nx, ms[i], rs[i]]); cur = nx; cm *= ms[i]; }
        return {
          q: [`Find the smallest non-negative $x$ with ${ms.map((m, i) => `$x \\equiv ${rs[i]} \\pmod{${m}}$`).join(', ')}.`, `${ms.map((m, i) => `$x \\equiv ${rs[i]} \\pmod{${m}}$`).join('、')} をすべて満たす最小の非負整数 $x$ を求めてください。`],
          a: { type: 'int', v: x },
          hint: ['Write $x = r_1 + m_1 k$ and choose $k$ to satisfy the next congruence; repeat.', '$x = r_1 + m_1 k$ とおき、次の合同式を満たすように $k$ を選びます。これを繰り返します。'],
          sol: steps.map(([c0, m0, k, nx, mi, ri]) => [`From $x = ${c0} + ${m0}k$: we need $${c0} + ${m0}k \\equiv ${ri} \\pmod{${mi}}$, which holds first at $k = ${k}$, giving $x \\equiv ${nx} \\pmod{${m0 * mi}}$.`, `$x = ${c0} + ${m0}k$ について $${c0} + ${m0}k \\equiv ${ri} \\pmod{${mi}}$ が必要で、最初に成り立つのは $k = ${k}$ です。よって $x \\equiv ${nx} \\pmod{${m0 * mi}}$ です。`]).concat([[`The moduli are pairwise coprime, so by the Chinese remainder theorem there is exactly one solution mod $${M}$: $x = ${x}$.`, `法が互いに素なので、中国剰余定理により $${M}$ を法として解はただ一つで、$x = ${x}$ です。`]]),
        };
      }
      if (kind === 1) {
        let m, a, d; do { m = r.int(8, 40); a = r.int(2, m - 1); d = gcd(a, m); } while (d === 1);
        const solvable = r.chance(0.6), c = solvable ? mod(d * r.int(1, m), m) : mod(d * r.int(1, m) + r.int(1, d - 1), m);
        const cnt = c % d === 0 ? d : 0;
        return {
          q: [`How many solutions $x \\in \\{0, 1, \\dots, ${m - 1}\\}$ does $${a}x \\equiv ${c} \\pmod{${m}}$ have?`, `$${a}x \\equiv ${c} \\pmod{${m}}$ は $x \\in \\{0, 1, \\dots, ${m - 1}\\}$ にいくつ解をもちますか。`],
          a: { type: 'int', v: cnt },
          hint: ['Let $d = \\gcd(a, n)$. Every value of $ax \\bmod n$ is a multiple of $d$.', '$d = \\gcd(a, n)$ とおきます。$ax \\bmod n$ の値はすべて $d$ の倍数です。'],
          sol: [[`$d = \\gcd(${a}, ${m}) = ${d}$, so $${a}x$ only reaches the multiples of $${d}$ modulo $${m}$.`, `$d = \\gcd(${a}, ${m}) = ${d}$ なので、$${a}x$ は $${m}$ を法として $${d}$ の倍数にしか届きません。`], cnt ? [`$${d} \\mid ${c}$, so divide through: $${a / d}x \\equiv ${c / d} \\pmod{${m / d}}$ has one solution mod $${m / d}$, which gives $${d}$ solutions mod $${m}$.`, `$${d} \\mid ${c}$ なので両辺を割ると $${a / d}x \\equiv ${c / d} \\pmod{${m / d}}$ となり、$${m / d}$ を法として解は一つ、$${m}$ を法とすると $${d}$ 個です。`] : [`$${d} \\nmid ${c}$, so there is no solution at all.`, `$${d} \\nmid ${c}$ なので、解はまったくありません。`], ['On the clock, steps of size $a$ visit only $n/d$ of the hours, each exactly $d$ times.', '時計の上では、歩幅 $a$ の歩みは $n/d$ 個の時刻だけを、それぞれちょうど $d$ 回ずつ訪れます。']],
          set: m <= 20 ? { n: m, a } : undefined,
        };
      }
      let m, a; do { m = r.int(26, 97); a = r.int(5, m - 2); } while (gcd(a, m) !== 1 || euclid(a, m).rows.length < 3);
      const E = euclid(a, m);
      return {
        q: [`Find the inverse of $${a}$ modulo $${m}$, as a number in $\\{1, \\dots, ${m - 1}\\}$.`, `$${m}$ を法とする $${a}$ の逆元を $\\{1, \\dots, ${m - 1}\\}$ の数で答えてください。`],
        a: { type: 'int', v: E.inv },
        hint: ['Run the Euclidean algorithm on $n$ and $a$, then work back up to write $1 = sa + tn$.', '$n$ と $a$ にユークリッドの互除法を適用し、逆にたどって $1 = sa + tn$ の形にします。'],
        sol: [[`Euclid: $${euclidTeX(E.rows)}$, so $\\gcd = 1$.`, `互除法：$${euclidTeX(E.rows)}$ より最大公約数は 1 です。`], [`Back-substituting gives $1 = ${E.inv}\\cdot ${a} - ${(a * E.inv - 1) / m}\\cdot ${m}$, so $${a}^{-1} \\equiv ${E.inv} \\pmod{${m}}$.`, `逆にたどると $1 = ${E.inv}\\cdot ${a} - ${(a * E.inv - 1) / m}\\cdot ${m}$ となるので、$${a}^{-1} \\equiv ${E.inv} \\pmod{${m}}$ です。`], [`Check: $${a}\\cdot ${E.inv} = ${a * E.inv} = ${m}\\cdot ${Math.floor(a * E.inv / m)} + 1$.`, `確認：$${a}\\cdot ${E.inv} = ${a * E.inv} = ${m}\\cdot ${Math.floor(a * E.inv / m)} + 1$ です。`]],
      };
    },
  ];

  /* ---------- 2. the sieve (limit 20..120) ---------- */
  const PI_TABLE = [[1e3, 168], [1e4, 1229], [1e5, 9592], [1e6, 78498], [1e7, 664579], [1e8, 5761455]];
  Q.sieve = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.int(20, 60), ps = primesUpTo(N);
        return {
          q: [`How many primes are there up to $${N}$, that is, what is $\\pi(${N})$?`, `$${N}$ 以下の素数はいくつありますか。つまり $\\pi(${N})$ はいくつですか。`],
          a: { type: 'int', v: ps.length },
          hint: [`Sieve with the primes up to $\\sqrt{${N}} \\approx ${n(Math.sqrt(N), 2)}$ and count what survives.`, `$\\sqrt{${N}} \\approx ${n(Math.sqrt(N), 2)}$ 以下の素数でふるい、残ったものを数えます。`],
          sol: [[`The survivors are $${ps.join(', ')}$.`, `残る数は $${ps.join(', ')}$ です。`], [`So $\\pi(${N}) = ${ps.length}$, compared with $${N}/\\ln ${N} \\approx ${n(N / Math.log(N), 1)}$.`, `したがって $\\pi(${N}) = ${ps.length}$ です。比較すると $${N}/\\ln ${N} \\approx ${n(N / Math.log(N), 1)}$ です。`]],
          set: { limit: N },
        };
      }
      if (kind === 1) {
        const N = r.chance(0.6) ? r.int(20, 120) : r.int(121, 1000), ps = primesUpTo(Math.floor(Math.sqrt(N))), top = ps[ps.length - 1];
        return {
          q: [`To sieve the numbers up to $${N}$, what is the largest prime whose multiples you must cross out?`, `$${N}$ までの数をふるうとき、倍数を消す必要がある最大の素数はいくつですか。`],
          a: { type: 'int', v: top },
          hint: ['A composite $m \\le N$ always has a prime factor at most $\\sqrt{m}$.', '合成数 $m \\le N$ は必ず $\\sqrt{m}$ 以下の素因数をもちます。'],
          sol: [[`$\\sqrt{${N}} \\approx ${n(Math.sqrt(N), 3)}$, and the largest prime not above it is $${top}$.`, `$\\sqrt{${N}} \\approx ${n(Math.sqrt(N), 3)}$ で、これを超えない最大の素数は $${top}$ です。`], [`Any composite up to $${N}$ has a factor $\\le ${top}$, so after crossing out multiples of $${top}$ only primes are left.`, `$${N}$ 以下の合成数はすべて $${top}$ 以下の因数をもつので、$${top}$ の倍数を消した後には素数だけが残ります。`]],
          set: N <= 120 ? { limit: N } : undefined,
        };
      }
      const prime = r.chance(0.45);
      let k; do { k = r.int(51, 299); } while (isPrime(k) !== prime || k % 2 === 0 || k % 5 === 0 || (!prime && spf(k) < 7 && r.chance(0.6)));
      const s = Math.floor(Math.sqrt(k)), f = spf(k);
      return {
        q: [`Is $${k}$ prime?`, `$${k}$ は素数ですか。`],
        a: YN(prime, 'Yes', 'はい', `No: $${k} = ${f}\\cdot ${k / f}$`, `いいえ：$${k} = ${f}\\cdot ${k / f}$`),
        hint: [`You only need to try primes up to $\\sqrt{${k}}$.`, `$\\sqrt{${k}}$ 以下の素数だけを試せば十分です。`],
        sol: [[`$\\sqrt{${k}} \\approx ${n(Math.sqrt(k), 2)}$, so try the primes $${primesUpTo(s).join(', ')}$.`, `$\\sqrt{${k}} \\approx ${n(Math.sqrt(k), 2)}$ なので、素数 $${primesUpTo(s).join(', ')}$ を試します。`], [prime ? `None of them divides $${k}$, so $${k}$ is prime.` : `$${f}$ divides it: $${k} = ${f}\\cdot ${k / f}$, so it is composite.`, prime ? `どれも $${k}$ を割り切らないので、$${k}$ は素数です。` : `$${f}$ で割り切れて $${k} = ${f}\\cdot ${k / f}$ なので、合成数です。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.int(30, 120), ps = primesUpTo(Math.floor(Math.sqrt(N))), p = r.pick(ps);
        const list = []; for (let x = p * p; x <= N; x++) if (x % p === 0 && spf(x) === p) list.push(x);
        return {
          q: [`Sieving up to $${N}$, how many numbers are crossed out by $${p}$ for the first time (composites whose smallest prime factor is $${p}$)?`, `$${N}$ までふるうとき、$${p}$ によって初めて消される数（最小の素因数が $${p}$ の合成数）はいくつありますか。`],
          a: { type: 'int', v: list.length },
          hint: [`Start at $${p}^2 = ${p * p}$ and keep only multiples of $${p}$ with no smaller prime factor.`, `$${p}^2 = ${p * p}$ から始め、より小さい素因数をもたない $${p}$ の倍数だけを残します。`],
          sol: [[`Smaller multiples $k\\cdot ${p}$ with $k < ${p}$ were already crossed out by a smaller prime, so the first new one is $${p * p}$.`, `$k < ${p}$ の倍数 $k\\cdot ${p}$ はすでに小さい素数で消されているので、新しく消す最初の数は $${p * p}$ です。`], [`They are ${list.length ? `$${list.join(', ')}$` : 'none'}: $${list.length}$ in all.`, `該当するのは ${list.length ? `$${list.join(', ')}$` : 'なし'} で、全部で $${list.length}$ 個です。`]],
          set: { limit: N },
        };
      }
      if (kind === 1) {
        const ps = r.pick([[2, 3], [2, 5], [3, 5], [2, 3, 5], [2, 3, 7], [3, 5, 7]]), N = r.int(50, 200);
        let count = 0; for (let x = 1; x <= N; x++) if (ps.every((p) => x % p)) count++;
        const subsets = []; for (let mask = 1; mask < 1 << ps.length; mask++) { const sub = ps.filter((_, i) => mask >> i & 1); subsets.push(sub); }
        const termsTeX = subsets.map((s) => `${s.length % 2 ? '-' : '+'} \\lfloor ${N}/${s.reduce((a, b) => a * b, 1)} \\rfloor`).join(' ');
        return {
          q: [`How many integers in $1, \\dots, ${N}$ are divisible by none of $${ps.join(', ')}$?`, `$1, \\dots, ${N}$ のうち、$${ps.join(', ')}$ のどれでも割り切れない整数はいくつありますか。`],
          a: { type: 'int', v: count },
          hint: ['Inclusion and exclusion: subtract the multiples of each prime, add back the multiples of each product of two, and so on.', '包除原理：各素数の倍数を引き、二つの積の倍数を足し戻し、以下同様にします。'],
          sol: [[`$${N} ${termsTeX}$.`, `$${N} ${termsTeX}$ です。`], [`$= ${N} ${subsets.map((s) => `${s.length % 2 ? '-' : '+'} ${Math.floor(N / s.reduce((a, b) => a * b, 1))}`).join(' ')} = ${count}$.`, `$= ${N} ${subsets.map((s) => `${s.length % 2 ? '-' : '+'} ${Math.floor(N / s.reduce((a, b) => a * b, 1))}`).join(' ')} = ${count}$ です。`], [`The fraction surviving is close to $${ps.map((p) => `(1 - \\tfrac1{${p}})`).join('')} \\approx ${n(ps.reduce((s, p) => s * (1 - 1 / p), 1), 3)}$, the density the sieve leaves behind.`, `残る割合は $${ps.map((p) => `(1 - \\tfrac1{${p}})`).join('')} \\approx ${n(ps.reduce((s, p) => s * (1 - 1 / p), 1), 3)}$ に近く、これがふるいの残す密度です。`]],
          set: N <= 120 ? { limit: N } : undefined,
        };
      }
      const [x, pix] = r.pick(PI_TABLE), est = x / Math.log(x), ratio = pix / est;
      return {
        q: [`$\\pi(${n(x)}) = ${pix}$. Compute the ratio $\\pi(x)/(x/\\ln x)$ at $x = ${n(x)}$, to three decimals.`, `$\\pi(${n(x)}) = ${pix}$ です。$x = ${n(x)}$ における比 $\\pi(x)/(x/\\ln x)$ を小数第3位まで求めてください。`],
        a: { type: 'num', v: ratio, tol: 0.0015 },
        hint: ['Compute $x/\\ln x$ first.', 'まず $x/\\ln x$ を計算します。'],
        sol: [[`$\\ln ${n(x)} = ${n(Math.log(x), 4)}$, so $x/\\ln x \\approx ${n(est, 1)}$.`, `$\\ln ${n(x)} = ${n(Math.log(x), 4)}$ なので $x/\\ln x \\approx ${n(est, 1)}$ です。`], [`Ratio $= ${pix}/${n(est, 1)} \\approx ${n(ratio, 4)}$.`, `比は $${pix}/${n(est, 1)} \\approx ${n(ratio, 4)}$ です。`], ['The prime number theorem says this ratio tends to 1, but slowly: $x/\\ln x$ undercounts by roughly a factor $1 + 1/\\ln x$.', '素数定理によればこの比は 1 に近づきますが、その歩みは遅く、$x/\\ln x$ はおよそ $1 + 1/\\ln x$ 倍だけ少なく数えます。']],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const N = r.int(121, 360), ps = primesUpTo(Math.floor(Math.sqrt(N)));
        let surv = 0; for (let x = 1; x <= N; x++) if (ps.every((p) => x % p)) surv++;
        const pi = primesUpTo(N).length;
        return {
          q: [`Without listing primes, use the sieve count: the integers in $1, \\dots, ${N}$ divisible by none of the primes $${ps.join(', ')}$ number $${surv}$. What is $\\pi(${N})$?`, `素数を書き出さずに、ふるいの個数を使います。$1, \\dots, ${N}$ のうち素数 $${ps.join(', ')}$ のどれでも割り切れない整数は $${surv}$ 個です。$\\pi(${N})$ はいくつですか。`],
          a: { type: 'int', v: pi },
          hint: ['Which numbers survive the sieve? Which primes did it remove, and which survivor is not a prime?', 'ふるいで残るのはどんな数でしょうか。ふるいが取り除いた素数はどれで、残った数のうち素数でないものはどれでしょうか。'],
          sol: [[`The survivors are $1$ and the primes in $(\\sqrt{${N}}, ${N}]$, because any composite up to $${N}$ has a prime factor $\\le \\sqrt{${N}}$.`, `残るのは $1$ と $(\\sqrt{${N}}, ${N}]$ の素数です。$${N}$ 以下の合成数は必ず $\\sqrt{${N}}$ 以下の素因数をもつからです。`], [`The sieving primes themselves were removed, and there are $${ps.length}$ of them.`, `ふるいに使った素数自身は取り除かれており、それは $${ps.length}$ 個です。`], [`Legendre: $\\pi(${N}) = ${surv} - 1 + ${ps.length} = ${pi}$.`, `ルジャンドルの公式：$\\pi(${N}) = ${surv} - 1 + ${ps.length} = ${pi}$ です。`]],
        };
      }
      if (kind === 1) {
        const k = r.int(1, 5), ps = primesUpTo(20).slice(0, k), next = primesUpTo(30)[k];
        const ask = r.int(0, 1);
        return {
          q: ask === 0 ? [`Sieve the integers above 1 by the primes $${ps.join(', ')}$ only. What is the smallest composite number that survives?`, `1 より大きい整数を素数 $${ps.join(', ')}$ だけでふるいます。生き残る最小の合成数はいくつですか。`] : [`You sieve with the primes $${ps.join(', ')}$ only. What is the largest $N$ for which every survivor in $2, \\dots, N$ is guaranteed to be prime?`, `素数 $${ps.join(', ')}$ だけでふるいます。$2, \\dots, N$ で生き残る数がすべて素数であると保証される最大の $N$ はいくつですか。`],
          a: { type: 'int', v: ask === 0 ? next * next : next * next - 1 },
          hint: ['A surviving composite has all its prime factors beyond the sieving primes.', '生き残る合成数は、すべての素因数がふるいに使った素数より大きいものです。'],
          sol: [[`A survivor has no prime factor among $${ps.join(', ')}$, so a composite survivor is a product of at least two primes $\\ge ${next}$.`, `生き残る数は $${ps.join(', ')}$ の中に素因数をもたないので、生き残る合成数は $${next}$ 以上の素数を少なくとも二つかけたものです。`], [`The smallest such is $${next}^2 = ${next * next}$${ask ? `, so the sieve is complete up to $${next * next - 1}$` : ''}.`, `その最小は $${next}^2 = ${next * next}$ です${ask ? `。したがってふるいは $${next * next - 1}$ まで完全です` : ''}。`], ['This is why the sieve may stop at $\\sqrt N$ and why each prime starts crossing out at its square.', 'ふるいが $\\sqrt N$ で止まってよいのも、各素数が自分の平方から消し始めるのもこのためです。']],
          set: ask && next * next - 1 >= 20 && next * next - 1 <= 120 ? { limit: next * next - 1 } : undefined,
        };
      }
      const ps = r.pick([[2, 3], [2, 3, 5], [2, 5], [3, 5, 7], [2, 3, 5, 7], [2, 7], [2, 3, 7]]);
      const num = ps.reduce((s, p) => s * (p - 1), 1), den = ps.reduce((s, p) => s * p, 1);
      return {
        q: [`What fraction of all integers survives sieving by $${ps.join(', ')}$ (in the long run)?`, `$${ps.join(', ')}$ でふるったあと、長い目で見て全整数のうちどれだけの割合が残りますか。`],
        a: { type: 'num', v: num / den, show: frac(num, den) },
        hint: ['Divisibility by different primes is independent in the long run, by the Chinese remainder theorem.', '中国剰余定理により、長い目で見れば異なる素数で割り切れるかどうかは独立です。'],
        sol: [[`A fraction $1/p$ of integers is divisible by $p$, and the residues modulo $${den}$ are spread evenly.`, `整数のうち割合 $1/p$ が $p$ で割り切れ、$${den}$ を法とする剰余は均等に分布します。`], [`Survivors: $${ps.map((p) => `(1 - \\tfrac1{${p}})`).join('')} = ${frac(num, den)} \\approx ${n(num / den, 4)}$.`, `残る割合：$${ps.map((p) => `(1 - \\tfrac1{${p}})`).join('')} = ${frac(num, den)} \\approx ${n(num / den, 4)}$ です。`], [`This equals $\\varphi(${den})/${den}$. Mertens showed the product over all $p \\le x$ shrinks like $e^{-\\gamma}/\\ln x$, which is why primes thin out.`, `これは $\\varphi(${den})/${den}$ に等しくなります。メルテンスは $p \\le x$ すべてにわたる積が $e^{-\\gamma}/\\ln x$ のように小さくなることを示しました。素数がまばらになるのはこのためです。`]],
      };
    },
  ];

  /* ---------- 3. RSA (p in 3,5,7,11,13; q in 5,7,11,13,17; m 2..40) ---------- */
  const PS = [3, 5, 7, 11, 13], QS = [5, 7, 11, 13, 17];
  const labE = (ph) => { let e = 3; while (gcd(e, ph) !== 1) e += 2; return e; };
  const pickPQ = (r) => { let i, j; do { i = r.int(0, 4); j = r.int(0, 4); } while (PS[i] === QS[j]); return { p: PS[i], q: QS[j], i, j }; };
  Q.rsa = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const { p, q, i, j } = pickPQ(r), N = p * q;
        return {
          q: [`$p = ${p}$, $q = ${q}$. What is $\\varphi(N)$ for $N = pq$?`, `$p = ${p}$、$q = ${q}$ のとき、$N = pq$ の $\\varphi(N)$ はいくつですか。`],
          a: { type: 'int', v: (p - 1) * (q - 1) },
          hint: ['For distinct primes, $\\varphi(pq) = (p - 1)(q - 1)$.', '異なる素数では $\\varphi(pq) = (p - 1)(q - 1)$ です。'],
          sol: [[`$N = ${N}$. The residues sharing a factor with $N$ are the multiples of $${p}$ or of $${q}$: $${q} + ${p} - 1 = ${p + q - 1}$ of them.`, `$N = ${N}$ です。$N$ と共通因数をもつ剰余は $${p}$ か $${q}$ の倍数で、$${q} + ${p} - 1 = ${p + q - 1}$ 個です。`], [`$\\varphi(${N}) = ${N} - ${p + q - 1} = ${p - 1}\\cdot ${q - 1} = ${(p - 1) * (q - 1)}$.`, `$\\varphi(${N}) = ${N} - ${p + q - 1} = ${p - 1}\\cdot ${q - 1} = ${(p - 1) * (q - 1)}$ です。`]],
          set: { p: i, q: j },
        };
      }
      if (kind === 1) {
        let p, q; do { p = r.pick([11, 13, 17, 19, 23, 29, 31, 37]); q = r.pick([7, 11, 13, 17, 19, 23, 29, 31, 41, 43]); } while (p === q);
        const N = p * q;
        return {
          q: [`$N = ${N}$ is a product of two primes. Find $\\varphi(N)$.`, `$N = ${N}$ は二つの素数の積です。$\\varphi(N)$ を求めてください。`],
          a: { type: 'int', v: (p - 1) * (q - 1) },
          hint: ['Factor $N$ first; for a toy key, trial division is quick.', 'まず $N$ を素因数分解します。小さな鍵なら試し割りですぐです。'],
          sol: [[`$${N} = ${Math.min(p, q)}\\cdot ${Math.max(p, q)}$.`, `$${N} = ${Math.min(p, q)}\\cdot ${Math.max(p, q)}$ です。`], [`$\\varphi(N) = ${Math.min(p, q) - 1}\\cdot ${Math.max(p, q) - 1} = ${(p - 1) * (q - 1)}$. Knowing $\\varphi(N)$ is as hard as factoring $N$, which is the whole security of RSA.`, `$\\varphi(N) = ${Math.min(p, q) - 1}\\cdot ${Math.max(p, q) - 1} = ${(p - 1) * (q - 1)}$ です。$\\varphi(N)$ を知ることは $N$ の素因数分解と同じくらい難しく、RSA の安全性はそこにかかっています。`]],
        };
      }
      const { p, q, i, j } = pickPQ(r), ph = (p - 1) * (q - 1), e = r.pick([3, 5, 7, 9, 11, 13, 15]), g = gcd(e, ph), ok = g === 1;
      return {
        q: [`For $p = ${p}$, $q = ${q}$, can $e = ${e}$ be used as the public exponent?`, `$p = ${p}$、$q = ${q}$ のとき、$e = ${e}$ を公開指数として使えますか。`],
        a: YN(ok, `Yes: $\\gcd(${e}, ${ph}) = 1$, so $e$ has an inverse mod $\\varphi(N)$.`, `はい。$\\gcd(${e}, ${ph}) = 1$ なので $e$ は $\\varphi(N)$ を法とする逆元をもちます。`, `No: $e$ shares a factor with $\\varphi(N)$, so no $d$ undoes it.`, `いいえ。$e$ は $\\varphi(N)$ と共通因数をもつので、それを打ち消す $d$ がありません。`),
        hint: ['$e$ must be invertible modulo $\\varphi(N)$.', '$e$ は $\\varphi(N)$ を法として逆元をもたなければなりません。'],
        sol: [[`$\\varphi(N) = ${p - 1}\\cdot ${q - 1} = ${ph}$ and $\\gcd(${e}, ${ph}) = ${g}$.`, `$\\varphi(N) = ${p - 1}\\cdot ${q - 1} = ${ph}$ で、$\\gcd(${e}, ${ph}) = ${g}$ です。`], [ok ? `Coprime, so $d = e^{-1} \\bmod ${ph}$ exists and $m \\mapsto m^e$ is a permutation of the residues.` : `Not coprime: $m \\mapsto m^e$ is then not one to one on the residues, so decryption would be ambiguous.`, ok ? `互いに素なので $d = e^{-1} \\bmod ${ph}$ が存在し、$m \\mapsto m^e$ は剰余の置換になります。` : `互いに素でないので、$m \\mapsto m^e$ は剰余の上で一対一にならず、復号が一意に決まりません。`]],
        set: { p: i, q: j },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      const { p, q, i, j } = pickPQ(r), N = p * q, ph = (p - 1) * (q - 1), e = labE(ph), d = euclid(e, ph).inv;
      if (kind === 0) {
        const E = euclid(e, ph);
        return {
          q: [`$p = ${p}$, $q = ${q}$, public exponent $e = ${e}$. Find the private exponent $d = e^{-1} \\bmod \\varphi(N)$.`, `$p = ${p}$、$q = ${q}$、公開指数 $e = ${e}$ です。秘密指数 $d = e^{-1} \\bmod \\varphi(N)$ を求めてください。`],
          a: { type: 'int', v: d },
          hint: ['Compute $\\varphi(N)$, then solve $ed \\equiv 1$ with Euclid or by trying multiples.', '$\\varphi(N)$ を求め、$ed \\equiv 1$ を互除法か倍数を試して解きます。'],
          sol: [[`$\\varphi(N) = ${p - 1}\\cdot ${q - 1} = ${ph}$.`, `$\\varphi(N) = ${p - 1}\\cdot ${q - 1} = ${ph}$ です。`], [`Euclid: $${euclidTeX(E.rows)}$; working back gives $d = ${d}$.`, `互除法：$${euclidTeX(E.rows)}$。逆にたどると $d = ${d}$ です。`], [`Check: $ed = ${e * d} = 1 + ${(e * d - 1) / ph}\\cdot ${ph}$, which is what makes $(m^e)^d = m$.`, `確認：$ed = ${e * d} = 1 + ${(e * d - 1) / ph}\\cdot ${ph}$ で、これが $(m^e)^d = m$ を保証します。`]],
          set: { p: i, q: j },
        };
      }
      const m = r.int(2, Math.min(40, N - 1)), c = powmod(m, e, N);
      if (kind === 1) {
        const s = sqm(m, e, N);
        return {
          q: [`Public key $N = ${N}$, $e = ${e}$. Encrypt the message $m = ${m}$: find $c = m^e \\bmod N$.`, `公開鍵は $N = ${N}$、$e = ${e}$ です。メッセージ $m = ${m}$ を暗号化して $c = m^e \\bmod N$ を求めてください。`],
          a: { type: 'int', v: c },
          hint: ['Reduce after every multiplication.', '掛け算のたびに剰余をとります。'],
          sol: [[`$${sqmTeX(m, s, N)}$.`, `$${sqmTeX(m, s, N)}$ です。`], [`$${e} = ${s.used.map(([pp]) => pp).join(' + ')}$, so $c \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${c} \\pmod{${N}}$.`, `$${e} = ${s.used.map(([pp]) => pp).join(' + ')}$ なので $c \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${c} \\pmod{${N}}$ です。`], ['In the left plot this is the dot above $m$: encryption is a shuffle of the residues.', '左の図では $m$ の真上の点にあたります。暗号化は剰余の並べ替えです。']],
          set: { p: i, q: j, m },
        };
      }
      const s = sqm(c, d, N);
      return {
        q: [`Key $N = ${N}$, private exponent $d = ${d}$. Decrypt the ciphertext $c = ${c}$.`, `鍵は $N = ${N}$、秘密指数は $d = ${d}$ です。暗号文 $c = ${c}$ を復号してください。`],
        a: { type: 'int', v: m },
        hint: ['$m = c^d \\bmod N$; use repeated squaring.', '$m = c^d \\bmod N$ です。二乗の繰り返しを使います。'],
        sol: [[`$${sqmTeX(c, s, N)}$.`, `$${sqmTeX(c, s, N)}$ です。`], [`$${d} = ${s.used.map(([pp]) => pp).join(' + ')}$, so $c^d \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${m} \\pmod{${N}}$.`, `$${d} = ${s.used.map(([pp]) => pp).join(' + ')}$ なので $c^d \\equiv ${s.used.map(([, v]) => v).join('\\cdot ')} \\equiv ${m} \\pmod{${N}}$ です。`], [`Since $ed = 1 + t\\varphi(N)$, Euler's theorem gives $c^d = m^{ed} = m\\cdot (m^{\\varphi(N)})^t \\equiv m$.`, `$ed = 1 + t\\varphi(N)$ なので、オイラーの定理から $c^d = m^{ed} = m\\cdot (m^{\\varphi(N)})^t \\equiv m$ となります。`]],
        set: { p: i, q: j, m },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let p, q; do { p = r.pick([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]); q = r.pick([53, 59, 61, 67, 71, 73, 79, 83, 89, 97]); } while (p === q);
        const N = p * q, ph = (p - 1) * (q - 1), s = N - ph + 1, D = s * s - 4 * N;
        return {
          q: [`An RSA modulus $N = ${N}$ leaks together with $\\varphi(N) = ${ph}$. Recover the primes $p < q$.`, `RSA の法 $N = ${N}$ が $\\varphi(N) = ${ph}$ とともに漏れました。素数 $p < q$ を復元してください。`],
          a: { type: 'tuple', v: [p, q], labels: ['$p$', '$q$'], tol: 0 },
          hint: ['$\\varphi(N) = N - (p + q) + 1$ gives $p + q$; then $p$ and $q$ are the roots of a quadratic.', '$\\varphi(N) = N - (p + q) + 1$ から $p + q$ がわかり、$p$ と $q$ は二次方程式の根です。'],
          sol: [[`$p + q = N - \\varphi(N) + 1 = ${s}$ and $pq = ${N}$.`, `$p + q = N - \\varphi(N) + 1 = ${s}$、$pq = ${N}$ です。`], [`So $p, q$ are the roots of $x^2 - ${s}x + ${N} = 0$: discriminant $${s}^2 - 4\\cdot ${N} = ${D} = ${Math.round(Math.sqrt(D))}^2$.`, `よって $p, q$ は $x^2 - ${s}x + ${N} = 0$ の根で、判別式は $${s}^2 - 4\\cdot ${N} = ${D} = ${Math.round(Math.sqrt(D))}^2$ です。`], [`$p, q = (${s} \\mp ${Math.round(Math.sqrt(D))})/2 = ${p}, ${q}$: knowing $\\varphi(N)$ breaks the key as completely as knowing the factors.`, `$p, q = (${s} \\mp ${Math.round(Math.sqrt(D))})/2 = ${p}, ${q}$ です。$\\varphi(N)$ を知れば、素因数を知るのと同じく鍵は完全に破られます。`]],
        };
      }
      if (kind === 1) {
        const { p, q, i, j } = pickPQ(r), N = p * q, ph = (p - 1) * (q - 1);
        let m; do { m = r.int(2, Math.min(40, N - 1)); } while (gcd(m, N) !== 1);
        const K = r.int(1000, 99999) * 10 + r.int(0, 9), red = K % ph, ans = powmod(m, K, N);
        return {
          q: [`Compute $${m}^{${K}} \\bmod ${N}$.`, `$${m}^{${K}} \\bmod ${N}$ を求めてください。`],
          a: { type: 'int', v: ans },
          hint: [`$\\gcd(${m}, ${N}) = 1$, so Euler's theorem lets you reduce the exponent modulo $\\varphi(${N})$.`, `$\\gcd(${m}, ${N}) = 1$ なので、オイラーの定理により指数を $\\varphi(${N})$ で割った余りに置き換えられます。`],
          sol: [[`$\\varphi(${N}) = ${p - 1}\\cdot ${q - 1} = ${ph}$, and $${m}^{${ph}} \\equiv 1 \\pmod{${N}}$.`, `$\\varphi(${N}) = ${p - 1}\\cdot ${q - 1} = ${ph}$ で、$${m}^{${ph}} \\equiv 1 \\pmod{${N}}$ です。`], [`$${K} = ${ph}\\cdot ${Math.floor(K / ph)} + ${red}$, so $${m}^{${K}} \\equiv ${m}^{${red}}$.`, `$${K} = ${ph}\\cdot ${Math.floor(K / ph)} + ${red}$ なので $${m}^{${K}} \\equiv ${m}^{${red}}$ です。`], [`$${m}^{${red}} \\equiv ${ans} \\pmod{${N}}$. The same reduction is why $c^d$ returns $m$: only $ed \\bmod \\varphi(N) = 1$ matters.`, `$${m}^{${red}} \\equiv ${ans} \\pmod{${N}}$ です。$c^d$ が $m$ に戻るのも同じ理由で、効くのは $ed \\bmod \\varphi(N) = 1$ だけです。`]],
          set: { p: i, q: j, m },
        };
      }
      const { p, q, i, j } = pickPQ(r), N = p * q, ph = (p - 1) * (q - 1);
      const es = []; for (let e = 3; e < ph; e += 2) if (gcd(e, ph) === 1) es.push(e);
      const e = r.pick(es.slice(0, 6)), d = euclid(e, ph).inv, m = r.int(2, Math.min(40, N - 1)), c = powmod(m, e, N);
      return {
        q: [`Public key $(N, e) = (${N}, ${e})$, ciphertext $c = ${c}$. You have learned that $p = ${p}$. Recover the message $m$.`, `公開鍵は $(N, e) = (${N}, ${e})$、暗号文は $c = ${c}$ です。$p = ${p}$ であることがわかりました。メッセージ $m$ を復元してください。`],
        a: { type: 'int', v: m },
        hint: ['From $p$ get $q$, then $\\varphi(N)$, then $d$, then $c^d$.', '$p$ から $q$、次に $\\varphi(N)$、$d$、そして $c^d$ を求めます。'],
        sol: [[`$q = ${N}/${p} = ${q}$ and $\\varphi(N) = ${ph}$.`, `$q = ${N}/${p} = ${q}$、$\\varphi(N) = ${ph}$ です。`], [`$d = ${e}^{-1} \\bmod ${ph} = ${d}$ (check: $${e}\\cdot ${d} = ${e * d} \\equiv 1$).`, `$d = ${e}^{-1} \\bmod ${ph} = ${d}$ です（確認：$${e}\\cdot ${d} = ${e * d} \\equiv 1$）。`], [`$m = ${c}^{${d}} \\bmod ${N} = ${m}$; re-encrypting gives $${m}^{${e}} \\equiv ${c}$, as it should.`, `$m = ${c}^{${d}} \\bmod ${N} = ${m}$ です。再び暗号化すると $${m}^{${e}} \\equiv ${c}$ となり、確かに一致します。`]],
        set: e === labE(ph) ? { p: i, q: j, m } : { p: i, q: j },
      };
    },
  ];
})();
