'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const fig = (host, o) => { const f = L.fig(host, o); f.svg.setAttribute('data-ig-tex', 'off'); return f; };
  const noStroke = (t) => { t.style.stroke = 'none'; return t; };
  const mod = (a, n) => ((a % n) + n) % n;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const powmod = (b, e, m) => { let r = 1 % m; b = mod(b, m); while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e >>= 1; } return r; };
  const sup = (n) => String(n).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };

  D.modular = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const n = Math.round(v.n), a = Math.round(v.a), b = Math.round(v.b), top = Math.max(a, b, n);
      const ang = (m) => Math.PI / 2 - L.TAU * m / n; // clockwise, 0 at the top, like a clock
      const R0 = 0.5, dR = 0.75 / Math.max(1, Math.ceil((top + 1) / n)), rad = (m) => R0 + dR * (m / n) + 0.05;
      const P = (m, r = rad(m)) => [r * Math.cos(ang(m)), r * Math.sin(ang(m))];
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The integers wound onto a clock with ${n} hours: one turn of the spiral per ${n} integers.`, `整数を ${n} 時間の時計に巻き付けたもの。${n} 個ごとに螺旋が1周します。`));
      const f = fig(c1, { axes: false, x: [-1.62, 1.62], y: [-1.62, 1.62], equal: true, maxH: 380 });
      const ra = mod(a, n), rb = mod(b, n), same = ra === rb;
      for (let r = 0; r < n; r++) { const q = P(r, 1.42); f.seg([0, 0], q, { c: r === ra || r === rb ? (same || r === ra ? 'c1' : 'c2') : 'muted', w: r === ra || r === rb ? 1.8 : 0.7, op: r === ra || r === rb ? 0.8 : 0.25, layer: 'under' }); noStroke(f.text(...P(r, 1.56), String(r), { small: n > 14, dy: 4, c: r === ra || r === rb ? 'ink' : 'muted' })); }
      f.line(L.sample(0, top, top * 12, (m) => P(m)), { c: 'muted', w: 1, op: 0.55 });
      for (let m = 0; m <= top; m++) {
        const q = P(m), hot = m === a || m === b;
        f.dot(q[0], q[1], { c: m === a ? 'c1' : m === b ? (same ? 'c1' : 'c2') : 'muted', r: hot ? 7 : 2.4, op: hot ? 1 : 0.7 });
      }
      [[a, 'c1'], [b, same ? 'c1' : 'c2']].forEach(([m, c], i) => { if (a === b && i) return; const q = P(m); f.text(q[0], q[1], String(m), { c, dx: i ? -10 : 10, anchor: i ? 'end' : 'start', dy: 4 }); });
      // right: repeated addition vs multiplication
      L.h('p', 'lab-cap', c2, T(`a·b mod n as repeated addition: ${b} steps of size ${a} from 0 land on the same hour as ${b} steps of size ${ra}.`, `繰り返しの足し算としての a·b mod n：0 から大きさ ${a} の歩幅で ${b} 歩進むと、大きさ ${ra} の歩幅で ${b} 歩進むのと同じ時刻に着きます。`));
      const g = fig(c2, { axes: false, x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, maxH: 380 });
      const Q = (r, s = 1) => [s * Math.cos(ang(r)), s * Math.sin(ang(r))];
      g.circle(0, 0, 1, { c: 'muted', w: 1, op: 0.5, layer: 'under' });
      for (let r = 0; r < n; r++) { g.dot(...Q(r), { c: 'muted', r: 3, layer: 'under' }); noStroke(g.text(...Q(r, 1.2), String(r), { small: true, dy: 4, c: 'muted', layer: 'under' })); }
      const ab = mod(a * b, n);
      const hops = L.seq(b + 1, (j) => mod(j * ra, n));
      const draw = (t) => {
        g.clear('main'); g.clear('over');
        const k = Math.min(b, Math.floor(t));
        for (let j = 0; j < k; j++) {
          const p = Q(hops[j], 0.97), q = Q(hops[j + 1], 0.97);
          if (hops[j] === hops[j + 1]) continue;
          g.arrow(p, q, { c: 'c3', w: 1.8, op: 0.35 + 0.65 * (j + 1) / Math.max(1, k) });
        }
        g.dot(0, 1, { c: 'ink', r: 4 });
        const end = Q(hops[k]);
        g.dot(end[0], end[1], { c: k === b ? 'hl' : 'c3', r: 8 });
        if (k === b) g.text(0, 0, `a·b ≡ ${ab} (mod ${n})`, { dy: 5, c: 'ink' });
        return k;
      };
      const DUR = b + 0.6;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => { const k = draw(t / 0.45); label.textContent = t / 0.45 < DUR ? `${k} × ${ra} ≡ ${mod(k * ra, n)} (mod ${n})` : ''; return t / 0.45 < DUR; }, { autoplay: false, once: true, duration: DUR * 0.45, initialT: 1e6, playLabel: T('Walk the steps', '歩みを再生') });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: `a = ${a}` }, { kind: 'dot', c: same ? 'c1' : 'c2', label: `b = ${b}` }, { c: 'c3', label: T(`steps of size a mod n = ${ra}`, `歩幅 a mod n = ${ra}`) }, { kind: 'dot', c: 'hl', label: T('landing hour a·b mod n', '到着する時刻 a·b mod n') }]);
      ctx.readout([
        { k: T('a mod n, b mod n', 'a mod n、b mod n'), v: `${ra}, ${rb}` },
        { k: 'a − b', v: `${a - b} = ${n} × ${fmt((a - b - mod(a - b, n)) / n, 0)} + ${mod(a - b, n)}` },
        { k: `a ≡ b (mod ${n})`, v: same ? T('yes', 'はい') : T('no', 'いいえ'), tone: same ? 'good' : 'warn' },
        { k: 'a + b, a·b mod n', v: `${mod(a + b, n)}, ${ab}`, tone: 'key' },
      ], same ? T('Congruent integers sit on the same ray of the spiral, so they are the same residue class.', '合同な整数は螺旋の同じ半直線上にあり、同じ剰余類に属します。') : T('Different rays: n does not divide a − b.', '半直線が異なるので、n は a − b を割り切りません。'));
    },
  };

  D.sieve = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const N = Math.round(v.limit), COLS = 10, rows = Math.ceil(N / COLS);
      const primesUsed = [2, 3, 5, 7].filter((p) => p * p <= N);
      const PC = { 2: 'c1', 3: 'c2', 5: 'c3', 7: 'c4' };
      const spf = L.seq(N + 1, (x) => { for (const p of [2, 3, 5, 7]) if (x % p === 0 && x > p) return p; return 0; });
      const row = L.h('div', 'lab-row', ctx.host);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`The numbers 1 to ${N}. Each prime p ≤ √${N} crosses out its multiples from p² on, in its own colour.`, `1 から ${N} までの数。√${N} 以下の各素数 p が p² 以降の倍数を自分の色で消します。`));
      const f = fig(c1, { axes: false, x: [0, COLS], y: [0, rows], equal: true, maxH: 460, pad: { l: 4, r: 4, t: 4, b: 4 } });
      const cp = f.X(1) - f.X(0);
      const cell = (x) => [(x - 1) % COLS, rows - 1 - Math.floor((x - 1) / COLS)];
      const draw = (stage, frac) => {
        // stage: how many sieving primes are finished; frac: progress within the current one
        f.clear('main'); f.clear('over');
        for (let x = 1; x <= N; x++) {
          const [cx, cy] = cell(x), p = spf[x], pi = primesUsed.indexOf(p);
          const struck = p && (pi < stage || (pi === stage && x <= p * p + frac * (N - p * p)));
          const prime = isPrime(x), revealed = prime && (stage >= primesUsed.length || x <= primesUsed[stage]);
          f.rect(cx + 0.06, cy + 0.06, 0.88, 0.88, { c: struck ? PC[p] : revealed ? 'hl' : 'muted', fo: struck ? 0.18 : revealed ? 0.32 : 0.04, w: revealed ? 1.6 : 0.8, op: struck ? 0.55 : 1, rx: 3 });
          const t = noStroke(f.text(cx + 0.5, cy + 0.5, String(x), { dy: 4, small: cp < 36, c: struck ? 'muted' : 'ink' }));
          if (struck) { t.style.opacity = '0.55'; f.seg([cx + 0.2, cy + 0.2], [cx + 0.8, cy + 0.8], { c: PC[p], w: 1.6, layer: 'over' }); }
          else if (prime) t.style.fontWeight = '700';
        }
      };
      const NP = primesUsed.length, SEG = 1.1, DUR = NP * SEG + 0.3;
      // right: pi(x) against x / ln x and li(x)
      const primes = L.seq(N, (i) => i + 1).filter(isPrime);
      L.h('p', 'lab-cap', c2, T('The count π(x) of primes up to x, with two classical approximations.', 'x 以下の素数の個数 π(x) と、2つの古典的な近似。'));
      const li = (x) => { let s = 0; const h = (x - 2) / 400; for (let i = 0; i < 400; i++) { const t = 2 + (i + 0.5) * h; s += h / Math.log(t); } return s + 1.045; };
      const ymax = Math.max(primes.length, li(N)) * 1.1;
      const g = fig(c2, { x: [0, N], y: [0, ymax], aspect: 0.8, maxH: 460, xlabel: 'x', ylabel: 'π(x)' });
      const step = []; let c = 0; for (let x = 0; x <= N; x++) { if (isPrime(x)) { step.push([x, c]); c++; } step.push([x, c]); }
      g.line(step, { c: 'c1', w: 2.4 });
      g.line(L.sample(3, N, 200, (x) => x / Math.log(x)), { c: 'c2', w: 1.8, dash: '6 4' });
      g.line(L.sample(2, N, 200, li), { c: 'c3', w: 1.8, dash: '2 3' });
      g.dot(N, primes.length, { c: 'hl', r: 6 });
      g.text(N, primes.length, `π(${N}) = ${primes.length}`, { anchor: 'end', dx: -10, dy: 20 });
      g.hover((x) => { const xi = Math.round(x); if (xi < 1 || xi > N) return null; const pc = primes.filter((p) => p <= xi).length; return { x: xi, y: pc, text: `π(${xi}) = ${pc}, x/ln x = ${fmt(xi / Math.log(Math.max(2, xi)), 1)}` }; });
      ctx.state.anim = L.animator(c1, (dt, t, label) => {
        const st = Math.min(NP, Math.floor(t / SEG)), fr = Math.min(1, (t - st * SEG) / (SEG * 0.8));
        draw(st, fr);
        label.textContent = st < NP ? T(`crossing out multiples of ${primesUsed[st]}`, `${primesUsed[st]} の倍数を消しています`) : '';
        return t < DUR;
      }, { autoplay: false, once: true, duration: DUR, initialT: DUR, playLabel: T('Run the sieve', '篩を実行') });
      L.legend(ctx.host, primesUsed.map((p) => ({ kind: 'fill', c: PC[p], label: T(`multiple of ${p}`, `${p} の倍数`) })).concat([{ kind: 'fill', c: 'hl', label: T('prime', '素数') }, { c: 'c1', label: 'π(x)' }, { c: 'c2', dash: true, label: 'x / ln x' }, { c: 'c3', dash: true, label: 'li(x)' }]));
      ctx.readout([
        { k: `π(${N})`, v: String(primes.length), tone: 'key' },
        { k: `√${N}`, v: fmt(Math.sqrt(N), 2) },
        { k: T('sieving primes', 'ふるいに使う素数'), v: primesUsed.join(', ') },
        { k: `${N} / ln ${N}`, v: fmt(N / Math.log(N), 1) },
        { k: `li(${N})`, v: fmt(li(N), 1) },
      ], T(`Every composite up to ${N} has a prime factor at most √${N} ≈ ${fmt(Math.sqrt(N), 2)}, so after ${primesUsed[primesUsed.length - 1]} nothing is left to cross out. Each composite is coloured by its smallest prime factor.`, `${N} 以下の合成数はすべて √${N} ≈ ${fmt(Math.sqrt(N), 2)} 以下の素因数をもつので、${primesUsed[primesUsed.length - 1]} の後には消すものが残りません。合成数は最小の素因数の色で塗っています。`));
    },
  };

  D.rsa = {
    render(ctx, v) {
      const PS = [3, 5, 7, 11, 13], QS = [5, 7, 11, 13, 17];
      const p = PS[L.clamp(Math.round(v.p), 0, 4)], q = QS[L.clamp(Math.round(v.q), 0, 4)];
      const row = L.h('div', 'lab-row', ctx.host);
      if (p === q) {
        L.h('p', 'lab-cap', ctx.host, T('Choose two different primes: with p = q the modulus is a square and decryption fails for multiples of p.', '異なる2つの素数を選んでください。p = q では法が平方数になり、p の倍数で復号に失敗します。'));
        ctx.readout([{ k: 'p = q', v: String(p), tone: 'warn' }]);
        return;
      }
      const N = p * q, phi = (p - 1) * (q - 1);
      let e = 3; while (gcd(e, phi) !== 1) e += 2;
      let d = 1; while ((e * d) % phi !== 1) d++;
      const m0 = Math.round(v.m), m = mod(m0, N), c = powmod(m, e, N), back = powmod(c, d, N);
      const c1 = L.h('div', 'lab-col', row), c2 = L.h('div', 'lab-col', row);
      L.h('p', 'lab-cap', c1, T(`Encryption c = mᵉ mod ${N} for every message m. One dot per column and per row: it is a permutation.`, `すべてのメッセージ m に対する暗号化 c = mᵉ mod ${N}。各列・各行に点がちょうど1つあり、置換になっています。`));
      const f = fig(c1, { x: [-1, N], y: [-1, N], equal: true, maxH: 380, xlabel: T('message m', 'メッセージ m'), ylabel: T('cipher c', '暗号 c') });
      for (let x = 0; x < N; x++) { const y = powmod(x, e, N); f.dot(x, y, { c: gcd(x, N) === 1 ? 'c1' : 'c2', r: N > 100 ? 1.8 : 2.6, op: 0.8 }); }
      f.seg([m, -1], [m, c], { c: 'hl', w: 1.4, dash: '3 3' }); f.seg([-1, c], [m, c], { c: 'hl', w: 1.4, dash: '3 3' });
      f.dot(m, c, { c: 'hl', r: 7 });
      f.text(m, c, `(${m}, ${c})`, { dx: m > N * 0.7 ? -10 : 10, anchor: m > N * 0.7 ? 'end' : 'start', dy: -8 });
      // right: powers of m cycle, so m^(ed) returns to m
      const K = e * d, ord = (() => { if (gcd(m, N) !== 1) return null; let k = 1, x = m % N; while (x !== 1) { x = (x * m) % N; k++; } return k; })();
      L.h('p', 'lab-cap', c2, T(`The powers mᵏ mod ${N} repeat. Step e gives the cipher; step ed = ${K} = 1 + ${(K - 1) / phi}·φ(N) lands on m again.`, `べき mᵏ mod ${N} は繰り返します。e 番目が暗号、ed = ${K} = 1 + ${(K - 1) / phi}·φ(N) 番目で再び m に戻ります。`));
      const g = fig(c2, { x: [0, K + 1], y: [-1, N], aspect: 0.8, maxH: 380, xlabel: 'k', ylabel: 'mᵏ mod N' });
      const pts = L.seq(K + 1, (k) => [k, powmod(m, k, N)]);
      if (K <= 400) g.line(pts, { c: 'c1', w: 0.8, op: 0.35 });
      pts.forEach(([k, y]) => g.dot(k, y, { c: 'c1', r: K > 200 ? 1.5 : 2.4, op: 0.8 }));
      if (ord) for (let k = ord; k < K; k += ord) g.vline(k, { c: 'muted', w: 0.8, dash: '2 4', op: 0.6 });
      g.hline(m, { c: 'hl', w: 1, dash: '4 4' });
      g.dot(e, c, { c: 'c2', r: 6.5 }); g.text(e, c, `k = e = ${e}`, { dx: 8, dy: -10, anchor: 'start', small: true, c: 'c2' });
      g.dot(K, back, { c: 'hl', r: 7 }); g.text(K, back, `k = ed`, { dx: -10, dy: -10, anchor: 'end', small: true });
      g.dot(1, m, { c: 'hl', r: 5 });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('m coprime to N', 'N と互いに素な m') }, { kind: 'dot', c: 'c2', label: T('m sharing a factor with N (still decrypts)', 'N と共通因数をもつ m（それでも復号できる）') }, { kind: 'dot', c: 'hl', label: T('your message', '選んだメッセージ') }].concat(ord ? [{ c: 'muted', dash: true, label: T(`period ${ord}: the order of m`, `周期 ${ord}：m の位数`) }] : []));
      ctx.readout([
        { k: 'N = pq', v: `${p}·${q} = ${N}` }, { k: 'φ(N)', v: `${p - 1}·${q - 1} = ${phi}` },
        { k: T('public e', '公開指数 e'), v: String(e) }, { k: T('private d', '秘密指数 d'), v: `${d}  (ed = ${K} ≡ 1 mod ${phi})` },
        { k: 'c = mᵉ mod N', v: `${m}${sup(e)} ≡ ${c}`, tone: 'key' },
        { k: 'cᵈ mod N', v: String(back), tone: back === m ? 'good' : 'warn' },
      ], (m0 >= N ? T(`The message must be smaller than N, so m = ${m0} is read as ${m0} mod ${N} = ${m}. `, `メッセージは N より小さくなければならないので、m = ${m0} を ${m0} mod ${N} = ${m} として扱います。`) : '') + T('e is the smallest odd exponent coprime to φ(N), and d is its inverse modulo φ(N).', 'e は φ(N) と互いに素な最小の奇数、d は φ(N) を法とする e の逆元です。'));
    },
  };
})();
