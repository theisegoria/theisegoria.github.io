'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;

  /* ---------- helpers (pure) ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const fact = (k) => (k <= 1 ? 1 : k * fact(k - 1));
  const phi = (x) => { let r = x; for (let p = 2; p * p <= x; p++) if (x % p === 0) { while (x % p === 0) x /= p; r -= r / p; } if (x > 1) r -= r / x; return r; };
  const isPow2 = (x) => x > 0 && (x & (x - 1)) === 0;
  const factor = (x) => { const f = []; for (let p = 2; p * p <= x; p++) while (x % p === 0) { f.push(p); x /= p; } if (x > 1) f.push(x); return f; };
  const factTeX = (x) => { const f = factor(x), m = new Map(); f.forEach((p) => m.set(p, (m.get(p) || 0) + 1)); return [...m].map(([p, e]) => (e > 1 ? `${p}^{${e}}` : String(p))).join('\\cdot '); };
  const isSq = (x) => x >= 0 && Math.round(Math.sqrt(x)) ** 2 === x;
  const sqfree = (x) => { let s = 1; for (const [p, e] of factor(x).reduce((m, p) => m.set(p, (m.get(p) || 0) + 1), new Map())) if (e % 2) s *= p; return s; };
  const ndiv = (x) => { let c = 0; for (let d = 1; d <= x; d++) if (x % d === 0) c++; return c; };
  // permutations: sigma[k] = image of k (0-based); index in lexicographic order, as the lab's table
  const permIndex = (s) => { let idx = 0; const rest = s.map((_, i) => i); s.forEach((v, i) => { const pos = rest.indexOf(v); idx += pos * fact(s.length - 1 - i); rest.splice(pos, 1); }); return idx; };
  const randPerm = (r, k) => r.shuffle(Array.from({ length: k }, (_, i) => i));
  const cycles = (s) => { const seen = [], out = []; for (let i = 0; i < s.length; i++) { if (seen[i]) continue; const c = []; let k = i; while (!seen[k]) { seen[k] = true; c.push(k); k = s[k]; } out.push(c); } return out; };
  const cycT = (s) => { const cs = cycles(s).filter((c) => c.length > 1); return cs.length ? cs.map((c) => '(' + c.map((k) => k + 1).join('\\,') + ')').join('') : 'e'; };
  const lcm = (a, b) => a * b / gcd(a, b);
  const permOrder = (s) => cycles(s).reduce((a, c) => lcm(a, c.length), 1);
  const isEven = (s) => cycles(s).reduce((t, c) => t + c.length - 1, 0) % 2 === 0;
  const oneLine = (s) => s.map((v) => v + 1).join('');
  const SUB = ['_1', '_2', '_3', '_4', '_5'];
  const rootMap = (s) => s.map((v, k) => `r${SUB[k]} \\mapsto r${SUB[v]}`).join(',\\ ');
  // cubics x^3 + px + q
  const intRoots = (p, q) => { const out = []; for (let x = -Math.abs(q) - 1; x <= Math.abs(q) + 1; x++) if (x * x * x + p * x + q === 0) out.push(x); return out; };
  const cubT = (p, q) => terms([[1, 'x^3'], [p, 'x'], [q, '']]);
  const C3CUBICS = []; for (let p = -40; p <= -1; p++) for (let q = -40; q <= 40; q++) if (q && !intRoots(p, q).length && isSq(-4 * p * p * p - 27 * q * q)) C3CUBICS.push([p, q]);

  /* ---------- 1. roots and automorphisms ---------- */
  // the lab's six polynomials: index, degree, group order and name
  const LAB = [{ name: 'x^3 - 2', n: 3, order: 6 }, { name: 'x^4 - 2', n: 4, order: 8 }, { name: 'x^4 + 1', n: 4, order: 4 }, { name: 'x^4 + x^3 + x^2 + x + 1', n: 4, order: 4 }, { name: 'x^3 - 3x + 1', n: 3, order: 3 }, { name: 'x^5 - x - 1', n: 5, order: 120 }];
  // membership tests for the labelled roots of the lab
  const inD4 = (s) => (s[0] + 2) % 4 === s[2] && (s[1] + 2) % 4 === s[3]; // x^4 - 2: r1 + r3 = 0 and r2 + r4 = 0 survive
  const inC4 = (s) => { const j = s[0] + 1; return s.every((v, k) => v + 1 === ((k + 1) * j) % 5); }; // Phi_5: zeta^k -> zeta^(jk)
  Q['roots-automorphisms'] = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const fam = r.int(0, 4);
        let poly, ord, why, set;
        if (fam === 0) { const k = r.pick([2, 3, 5, 6, 7, 10, 11, 12]); poly = `x^3 - ${k}`; ord = 6; set = k === 2 ? { poly: 0 } : undefined; why = [`The splitting field is $\\mathbb Q(\\sqrt[3]{${k}}, \\omega)$: degree $3$ for the real cube root times $2$ for $\\omega = e^{2\\pi i/3}$, which is not real.`, `分解体は $\\mathbb Q(\\sqrt[3]{${k}}, \\omega)$ です。実の三乗根で次数 $3$、実数でない $\\omega = e^{2\\pi i/3}$ でさらに $2$ 倍になります。`]; }
        else if (fam === 1) { const k = r.pick([2, 3, 5, 6, 7, 10]); poly = `x^4 - ${k}`; ord = 8; set = k === 2 ? { poly: 1 } : undefined; why = [`The splitting field is $\\mathbb Q(\\sqrt[4]{${k}}, i)$: degree $4$ for the real fourth root times $2$ for $i$.`, `分解体は $\\mathbb Q(\\sqrt[4]{${k}}, i)$ です。実の四乗根で次数 $4$、$i$ でさらに $2$ 倍になります。`]; }
        else if (fam === 2) { const p = r.pick([5, 7, 11, 13]); poly = `x^{${p - 1}} + x^{${p - 2}} + \\cdots + x + 1`; ord = p - 1; set = p === 5 ? { poly: 3 } : undefined; why = [`Its roots are the primitive $${p}$th roots of unity; all are powers of one $\\zeta$, and $\\zeta \\mapsto \\zeta^j$ for $j = 1, \\dots, ${p - 1}$ are the automorphisms.`, `根は 1 の原始 $${p}$ 乗根で、すべて一つの $\\zeta$ のべきです。自己同型は $j = 1, \\dots, ${p - 1}$ に対する $\\zeta \\mapsto \\zeta^j$ です。`]; }
        else if (fam === 3) { poly = 'x^4 + 1'; ord = 4; set = { poly: 2 }; why = ['Its roots are the primitive 8th roots of unity $\\zeta^{1, 3, 5, 7}$, and $\\zeta \\mapsto \\zeta^j$ for $j \\in \\{1, 3, 5, 7\\}$ are the automorphisms.', '根は 1 の原始 8 乗根 $\\zeta^{1, 3, 5, 7}$ で、自己同型は $j \\in \\{1, 3, 5, 7\\}$ に対する $\\zeta \\mapsto \\zeta^j$ です。']; }
        else { const k = r.pick([2, 3, 5, 6, 7, 10, 11]); poly = `x^2 - ${k}`; ord = 2; set = undefined; why = [`The splitting field is $\\mathbb Q(\\sqrt{${k}})$, of degree 2: the only non-trivial automorphism swaps $\\pm\\sqrt{${k}}$.`, `分解体は次数 2 の $\\mathbb Q(\\sqrt{${k}})$ で、自明でない自己同型は $\\pm\\sqrt{${k}}$ を入れ替えるものだけです。`]; }
        return {
          q: [`What is the order of the Galois group of $${poly}$ over $\\mathbb Q$?`, `$${poly}$ の $\\mathbb Q$ 上のガロア群の位数はいくつですか。`],
          a: { type: 'int', v: ord },
          hint: ['The order of the Galois group equals the degree of the splitting field over $\\mathbb Q$.', 'ガロア群の位数は、分解体の $\\mathbb Q$ 上の次数に等しくなります。'],
          sol: [why, [`So $|\\mathrm{Gal}| = ${ord}$.`, `したがって $|\\mathrm{Gal}| = ${ord}$ です。`]],
          set,
        };
      }
      const pi = r.pick([0, 1, 2, 3, 4, 5]), L0 = LAB[pi], s = randPerm(r, L0.n), idx = permIndex(s);
      if (kind === 1) {
        return {
          q: [`The permutation $\\sigma$ sends $${rootMap(s)}$. What is its order?`, `置換 $\\sigma$ は $${rootMap(s)}$ と送ります。その位数はいくつですか。`],
          a: { type: 'int', v: permOrder(s) },
          hint: ['Write $\\sigma$ as disjoint cycles; the order is the lcm of the cycle lengths.', '$\\sigma$ を互いに素な巡回置換の積に書きます。位数は巡回の長さの最小公倍数です。'],
          sol: [[`In cycle notation $\\sigma = ${cycT(s)}$.`, `巡回記法では $\\sigma = ${cycT(s)}$ です。`], [`The cycle lengths are $${cycles(s).map((c) => c.length).join(', ')}$, so the order is their lcm, $${permOrder(s)}$.`, `巡回の長さは $${cycles(s).map((c) => c.length).join(', ')}$ なので、位数はその最小公倍数 $${permOrder(s)}$ です。`]],
          set: { poly: pi, perm: idx },
        };
      }
      const ev = isEven(s);
      return {
        q: [`Is the permutation $\\sigma = ${cycT(s)}$ of the roots of $${L0.name}$ even or odd?`, `$${L0.name}$ の根の置換 $\\sigma = ${cycT(s)}$ は偶置換ですか、奇置換ですか。`],
        a: { type: 'choice', opts: [['Even', '偶置換'], ['Odd', '奇置換']], v: ev ? 0 : 1, fixed: true },
        hint: ['A cycle of length $\\ell$ is a product of $\\ell - 1$ transpositions.', '長さ $\\ell$ の巡回置換は $\\ell - 1$ 個の互換の積です。'],
        sol: [[`The cycles have lengths $${cycles(s).map((c) => c.length).join(', ')}$, giving $${cycles(s).map((c) => c.length - 1).join(' + ')} = ${cycles(s).reduce((t, c) => t + c.length - 1, 0)}$ transpositions.`, `巡回の長さは $${cycles(s).map((c) => c.length).join(', ')}$ で、互換の個数は $${cycles(s).map((c) => c.length - 1).join(' + ')} = ${cycles(s).reduce((t, c) => t + c.length - 1, 0)}$ です。`], [ev ? 'An even number: $\\sigma \\in A_n$, and it fixes $\\sqrt\\Delta = \\prod_{i<j}(r_i - r_j)$.' : 'An odd number: $\\sigma \\notin A_n$, and it sends $\\sqrt\\Delta = \\prod_{i<j}(r_i - r_j)$ to $-\\sqrt\\Delta$.', ev ? '偶数なので $\\sigma \\in A_n$ で、$\\sqrt\\Delta = \\prod_{i<j}(r_i - r_j)$ を固定します。' : '奇数なので $\\sigma \\notin A_n$ で、$\\sqrt\\Delta = \\prod_{i<j}(r_i - r_j)$ を $-\\sqrt\\Delta$ に送ります。']],
        set: { poly: pi, perm: idx },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let p, q; if (r.chance(0.3)) [p, q] = r.pick([[0, -2], [-3, 1], [-3, -1], [-7, 7], [0, 3]]); else { do { p = r.int(-9, 6); q = r.int(-9, 9); } while (!q); }
        const D = -4 * p * p * p - 27 * q * q, sq = isSq(D);
        return {
          q: [`Compute the discriminant $\\Delta = -4p^3 - 27q^2$ of $${cubT(p, q)}$.`, `$${cubT(p, q)}$ の判別式 $\\Delta = -4p^3 - 27q^2$ を求めてください。`],
          a: { type: 'int', v: D },
          hint: ['For $x^3 + px + q$, $\\Delta = \\prod_{i<j}(r_i - r_j)^2 = -4p^3 - 27q^2$.', '$x^3 + px + q$ では $\\Delta = \\prod_{i<j}(r_i - r_j)^2 = -4p^3 - 27q^2$ です。'],
          sol: [[`$-4\\cdot(${p ** 3}) - 27\\cdot ${q * q} = ${-4 * p ** 3} - ${27 * q * q} = ${D}$.`, `$-4\\cdot(${p ** 3}) - 27\\cdot ${q * q} = ${-4 * p ** 3} - ${27 * q * q} = ${D}$ です。`], [D < 0 ? 'Negative: one real root and two complex conjugates, and $\\sqrt\\Delta$ is not even real, so the group contains an odd permutation (complex conjugation).' : sq ? `A perfect square, $${Math.round(Math.sqrt(D))}^2$: every automorphism fixes $\\sqrt\\Delta$, so the group lies in $A_3$.` : 'Positive but not a square: three real roots, and the group contains an odd permutation.', D < 0 ? '負なので実根は一つで残り二つは共役な複素数です。$\\sqrt\\Delta$ は実数ですらなく、群は奇置換（複素共役）を含みます。' : sq ? `完全平方数 $${Math.round(Math.sqrt(D))}^2$ なので、どの自己同型も $\\sqrt\\Delta$ を固定し、群は $A_3$ に含まれます。` : '正ですが平方数ではないので、実根は三つで、群は奇置換を含みます。']],
          set: p === 0 && q === -2 ? { poly: 0 } : p === -3 && q === 1 ? { poly: 4 } : undefined,
        };
      }
      if (kind === 1) {
        const which = r.chance(0.6) ? 1 : 3, want = r.chance(0.45);
        let s; do { s = randPerm(r, 4); } while ((which === 1 ? inD4(s) : inC4(s)) !== want);
        const L0 = LAB[which];
        const why = which === 1
          ? (want ? ['$\\sigma$ sends the pair $\\{r_1, r_3\\}$ of opposite roots to a pair of opposite roots, and likewise $\\{r_2, r_4\\}$, so $r_1 + r_3 = 0$ and $r_2 + r_4 = 0$ survive.', '$\\sigma$ は向かい合う根の組 $\\{r_1, r_3\\}$ を向かい合う根の組へ、$\\{r_2, r_4\\}$ も同様に送るので、$r_1 + r_3 = 0$ と $r_2 + r_4 = 0$ は保たれます。'] : [`$\\sigma$ sends $r_1, r_3$ to $r${SUB[s[0]]}, r${SUB[s[2]]}$, which are not opposite, so $r_1 + r_3 = 0$ would become $r${SUB[s[0]]} + r${SUB[s[2]]} = 0$, which is false.`, `$\\sigma$ は $r_1, r_3$ を向かい合わない $r${SUB[s[0]]}, r${SUB[s[2]]}$ に送るので、$r_1 + r_3 = 0$ は偽の式 $r${SUB[s[0]]} + r${SUB[s[2]]} = 0$ になってしまいます。`])
          : (want ? [`$\\sigma(\\zeta) = \\zeta^{${s[0] + 1}}$ and every $\\zeta^k$ goes to $\\zeta^{${s[0] + 1}k}$, so $r_k = r_1^k$ survives.`, `$\\sigma(\\zeta) = \\zeta^{${s[0] + 1}}$ で、各 $\\zeta^k$ は $\\zeta^{${s[0] + 1}k}$ に移るので、$r_k = r_1^k$ は保たれます。`] : [`$\\sigma(\\zeta) = \\zeta^{${s[0] + 1}}$ forces $\\sigma(\\zeta^k) = \\zeta^{${s[0] + 1}k}$, but $\\sigma$ does something else to some root, breaking a relation $r_k = r_1^k$.`, `$\\sigma(\\zeta) = \\zeta^{${s[0] + 1}}$ なら $\\sigma(\\zeta^k) = \\zeta^{${s[0] + 1}k}$ でなければなりませんが、$\\sigma$ はある根を別の場所へ送り、関係 $r_k = r_1^k$ を壊します。`]);
        return {
          q: [`Label the roots of $${L0.name}$ as in the figure${which === 1 ? ' ($r_1 = \\alpha$, $r_2 = i\\alpha$, $r_3 = -\\alpha$, $r_4 = -i\\alpha$)' : ' ($r_k = \\zeta^k$, $\\zeta = e^{2\\pi i/5}$)'}. Is $\\sigma: ${rootMap(s)}$ in the Galois group?`, `$${L0.name}$ の根に図と同じ名前を付けます${which === 1 ? '（$r_1 = \\alpha$、$r_2 = i\\alpha$、$r_3 = -\\alpha$、$r_4 = -i\\alpha$）' : '（$r_k = \\zeta^k$、$\\zeta = e^{2\\pi i/5}$）'}。$\\sigma: ${rootMap(s)}$ はガロア群に属しますか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: want ? 0 : 1, fixed: true },
          hint: [which === 1 ? 'An automorphism must preserve $r_1 + r_3 = 0$ and $r_2 + r_4 = 0$.' : 'An automorphism is determined by where it sends $\\zeta$, and must preserve $r_k = r_1^k$.', which === 1 ? '自己同型は $r_1 + r_3 = 0$ と $r_2 + r_4 = 0$ を保たなければなりません。' : '自己同型は $\\zeta$ の行き先で決まり、$r_k = r_1^k$ を保たなければなりません。'],
          sol: [why, [want ? `So $\\sigma$ is one of the ${L0.order} elements of the group.` : `So $\\sigma$ is one of the ${24 - L0.order} permutations the field structure rules out.`, want ? `したがって $\\sigma$ は群の ${L0.order} 個の元の一つです。` : `したがって $\\sigma$ は体の構造が排除する ${24 - L0.order} 個の置換の一つです。`]],
          set: { poly: which, perm: permIndex(s) },
        };
      }
      const c3 = r.chance(0.5);
      let p, q; if (c3) [p, q] = r.pick(C3CUBICS); else { do { p = r.int(-12, 8); q = r.int(-12, 12); } while (!q || intRoots(p, q).length || isSq(-4 * p * p * p - 27 * q * q)); }
      const D = -4 * p * p * p - 27 * q * q;
      return {
        q: [`$${cubT(p, q)}$ is irreducible over $\\mathbb Q$. Is its Galois group $A_3 \\cong C_3$ or $S_3$?`, `$${cubT(p, q)}$ は $\\mathbb Q$ 上既約です。そのガロア群は $A_3 \\cong C_3$ と $S_3$ のどちらですか。`],
        a: { type: 'choice', opts: [['$A_3 \\cong C_3$, order 3', '$A_3 \\cong C_3$（位数 3）'], ['$S_3$, order 6', '$S_3$（位数 6）']], v: c3 ? 0 : 1, fixed: true },
        hint: ['Irreducible means the group is transitive, so it is $A_3$ or $S_3$; the discriminant decides.', '既約なので群は推移的で、$A_3$ か $S_3$ です。判別式で決まります。'],
        sol: [[`$\\Delta = -4\\cdot(${p ** 3}) - 27\\cdot ${q * q} = ${D}$.`, `$\\Delta = -4\\cdot(${p ** 3}) - 27\\cdot ${q * q} = ${D}$ です。`], [c3 ? `$${D} = ${Math.round(Math.sqrt(D))}^2$ is a square, so $\\sqrt\\Delta \\in \\mathbb Q$ is fixed by every automorphism and the group is $A_3$: adjoining one root gives all three.` : `$${D}$ is not a square, so some automorphism moves $\\sqrt\\Delta$ and the group is $S_3$: the splitting field has degree 6.`, c3 ? `$${D} = ${Math.round(Math.sqrt(D))}^2$ は平方数なので、$\\sqrt\\Delta \\in \\mathbb Q$ はどの自己同型でも固定され、群は $A_3$ です。根を一つ添加すれば三つとも得られます。` : `$${D}$ は平方数ではないので、ある自己同型が $\\sqrt\\Delta$ を動かし、群は $S_3$ です。分解体の次数は 6 です。`]],
        set: p === -3 && q === 1 ? { poly: 4 } : undefined,
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const red = r.chance(0.4);
        let p, q, ans, why;
        if (red) {
          let root; do { root = r.nz(-4, 4); p = r.int(-12, 6); q = -(root ** 3 + p * root); } while (!q || Math.abs(q) > 30);
          const c = root * root + p, dq = root * root - 4 * c;
          ans = isSq(dq) ? 3 : 2;
          why = [[`$x = ${root}$ is a root: $${cubT(p, q)} = (x ${root < 0 ? '+' : '-'} ${Math.abs(root)})(${terms([[1, 'x^2'], [root, 'x'], [c, '']])})$.`, `$x = ${root}$ が根なので、$${cubT(p, q)} = (x ${root < 0 ? '+' : '-'} ${Math.abs(root)})(${terms([[1, 'x^2'], [root, 'x'], [c, '']])})$ です。`], [`The quadratic has discriminant $${dq}$, ${isSq(dq) ? 'a square: everything splits over $\\mathbb Q$ and the group is trivial' : 'not a square: the splitting field is quadratic and the group has order 2'}.`, `二次式の判別式は $${dq}$ で、${isSq(dq) ? '平方数です。すべて $\\mathbb Q$ 上で分解し、群は自明です' : '平方数ではありません。分解体は二次体で、群の位数は 2 です'}。`]];
        } else {
          const c3 = r.chance(0.5);
          if (c3) [p, q] = r.pick(C3CUBICS); else { do { p = r.int(-12, 8); q = r.int(-12, 12); } while (!q || intRoots(p, q).length || isSq(-4 * p * p * p - 27 * q * q)); }
          const D = -4 * p * p * p - 27 * q * q; ans = c3 ? 0 : 1;
          const cands = [...new Set([1, -1, q, -q].concat(factor(Math.abs(q)).flatMap((d) => [d, -d])))].sort((u, v) => u - v);
          why = [[`Rational roots must divide $${q}$; none of $${cands.join(', ')}$ is a root, so the cubic is irreducible.`, `有理根は $${q}$ の約数でなければなりませんが、$${cands.join(', ')}$ はどれも根でないので、三次式は既約です。`], [`$\\Delta = ${D}${c3 ? ` = ${Math.round(Math.sqrt(D))}^2$, a square: the group is $A_3$` : '$ is not a square: the group is $S_3$'}.`, `$\\Delta = ${D}${c3 ? ` = ${Math.round(Math.sqrt(D))}^2$ は平方数なので、群は $A_3$ です` : '$ は平方数でないので、群は $S_3$ です'}。`]];
        }
        return {
          q: [`What is the Galois group of $${cubT(p, q)}$ over $\\mathbb Q$?`, `$${cubT(p, q)}$ の $\\mathbb Q$ 上のガロア群は何ですか。`],
          a: { type: 'choice', opts: [['$C_3 \\cong A_3$', '$C_3 \\cong A_3$'], ['$S_3$', '$S_3$'], ['$C_2$: one rational root and an irreducible quadratic factor', '$C_2$：有理根が一つと既約な二次因子'], ['trivial: all three roots are rational', '自明：三つの根がすべて有理数']], v: ans },
          hint: ['First test for a rational root (it must divide the constant term), then use the discriminant.', 'まず有理根を調べ（定数項の約数でなければなりません）、次に判別式を使います。'],
          sol: why,
        };
      }
      if (kind === 1) {
        let b, c, D2, kindG;
        const irreducible = (bb, cc) => { const d = bb * bb - 4 * cc; if (isSq(d)) return false; if (isSq(cc)) { const s = Math.round(Math.sqrt(cc)); for (const beta of [s, -s]) { const a2 = 2 * beta - bb; if (a2 >= 0 && isSq(a2)) return false; } } return true; };
        const want = r.int(0, 2);
        do { b = r.int(-10, 10); c = r.nz(-12, 30); D2 = b * b - 4 * c; kindG = isSq(c) ? 0 : isSq(c * D2) ? 1 : 2; } while (!irreducible(b, c) || kindG !== want);
        const poly = terms([[1, 'x^4'], [b, 'x^2'], [c, '']]);
        return {
          q: [`$${poly}$ is irreducible over $\\mathbb Q$. What is its Galois group?`, `$${poly}$ は $\\mathbb Q$ 上既約です。そのガロア群は何ですか。`],
          a: { type: 'choice', opts: [['$C_2 \\times C_2$, order 4', '$C_2 \\times C_2$（位数 4）'], ['$C_4$, order 4', '$C_4$（位数 4）'], ['$D_4$, order 8', '$D_4$（位数 8）'], ['$S_4$, order 24', '$S_4$（位数 24）']], v: kindG },
          hint: ['For $x^4 + bx^2 + c$ the roots are $\\pm\\alpha, \\pm\\beta$ with $\\alpha^2\\beta^2 = c$ and $(\\alpha^2 - \\beta^2)^2 = b^2 - 4c$. Ask whether $c$ or $c(b^2 - 4c)$ is a square.', '$x^4 + bx^2 + c$ の根は $\\pm\\alpha, \\pm\\beta$ で、$\\alpha^2\\beta^2 = c$、$(\\alpha^2 - \\beta^2)^2 = b^2 - 4c$ です。$c$ や $c(b^2 - 4c)$ が平方数かどうかを調べます。'],
          sol: [[`$c = ${c}$ and $b^2 - 4c = ${D2}$, so $c(b^2 - 4c) = ${c * D2}$.`, `$c = ${c}$、$b^2 - 4c = ${D2}$ なので $c(b^2 - 4c) = ${c * D2}$ です。`], [kindG === 0 ? `$c$ is a square, so $\\alpha\\beta \\in \\mathbb Q$: once $\\alpha$ is known, $\\beta = (\\alpha\\beta)/\\alpha$ follows, the field has degree 4 and every non-trivial element has order 2.` : kindG === 1 ? `$c(b^2 - 4c)$ is a square while $c$ is not: the splitting field still has degree 4, but an automorphism cycles $\\alpha \\to \\beta \\to -\\alpha \\to -\\beta$, so the group is cyclic.` : `Neither $c$ nor $c(b^2 - 4c)$ is a square, so the splitting field has degree 8 and the group is the symmetry group of a square, preserving the pairs $\\{\\pm\\alpha\\}$, $\\{\\pm\\beta\\}$.`, kindG === 0 ? '$c$ が平方数なので $\\alpha\\beta \\in \\mathbb Q$ です。$\\alpha$ がわかれば $\\beta = (\\alpha\\beta)/\\alpha$ も決まり、体の次数は 4 で、自明でない元の位数はすべて 2 です。' : kindG === 1 ? '$c$ は平方数ではなく $c(b^2 - 4c)$ が平方数です。分解体の次数は 4 のままですが、$\\alpha \\to \\beta \\to -\\alpha \\to -\\beta$ と巡回させる自己同型があり、群は巡回群です。' : '$c$ も $c(b^2 - 4c)$ も平方数ではないので、分解体の次数は 8 で、群は組 $\\{\\pm\\alpha\\}$、$\\{\\pm\\beta\\}$ を保つ正方形の対称性の群です。'], ['$S_4$ is impossible here: every automorphism must respect the pairing of each root with its negative.', 'ここで $S_4$ はありえません。どの自己同型も、各根とその符号を変えた根の組を保たなければならないからです。']],
          set: b === 0 && c === -2 ? { poly: 1 } : b === 0 && c === 1 ? { poly: 2 } : undefined,
        };
      }
      const nn = r.pick([5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18, 20, 21, 24]);
      const cyc = nn === 4 || nn === 2 || (nn % 2 === 1 && new Set(factor(nn)).size === 1) || (nn % 2 === 0 && nn % 4 !== 0 && new Set(factor(nn / 2)).size === 1);
      const ph = phi(nn);
      return {
        q: [`What is $\\mathrm{Gal}(\\mathbb Q(\\zeta_{${nn}})/\\mathbb Q)$, where $\\zeta_{${nn}} = e^{2\\pi i/${nn}}$?`, `$\\zeta_{${nn}} = e^{2\\pi i/${nn}}$ とするとき、$\\mathrm{Gal}(\\mathbb Q(\\zeta_{${nn}})/\\mathbb Q)$ は何ですか。`],
        a: { type: 'choice', opts: [[`cyclic of order $${ph}$`, `位数 $${ph}$ の巡回群`], [`order $${ph}$, not cyclic`, `位数 $${ph}$ で巡回群ではない`], [`cyclic of order $${nn}$`, `位数 $${nn}$ の巡回群`], [`$S_{${ph}}$`, `$S_{${ph}}$`]], v: cyc ? 0 : 1 },
        hint: ['$\\sigma_j: \\zeta \\mapsto \\zeta^j$ for $j$ coprime to $n$; the group is $(\\mathbb Z/n)^\\times$.', '$n$ と互いに素な $j$ に対する $\\sigma_j: \\zeta \\mapsto \\zeta^j$ が自己同型で、群は $(\\mathbb Z/n)^\\times$ です。'],
        sol: [[`The automorphisms are $\\zeta \\mapsto \\zeta^j$ with $\\gcd(j, ${nn}) = 1$, composing like multiplication of $j$: the group is $(\\mathbb Z/${nn})^\\times$, of order $\\varphi(${nn}) = ${ph}$.`, `自己同型は $\\gcd(j, ${nn}) = 1$ に対する $\\zeta \\mapsto \\zeta^j$ で、合成は $j$ の掛け算にあたります。群は位数 $\\varphi(${nn}) = ${ph}$ の $(\\mathbb Z/${nn})^\\times$ です。`], [cyc ? `$${nn}$ is $2$, $4$, $p^k$ or $2p^k$ for an odd prime $p$, exactly the moduli with a primitive root, so the group is cyclic.` : `$${nn}$ is not $2$, $4$, $p^k$ or $2p^k$, so there is no primitive root mod $${nn}$ and the group is not cyclic.`, cyc ? `$${nn}$ は $2$、$4$、$p^k$、$2p^k$（$p$ は奇素数）のいずれかで、原始根をもつ法なので、群は巡回群です。` : `$${nn}$ は $2$、$4$、$p^k$、$2p^k$ のどれでもないので、$${nn}$ を法とする原始根はなく、群は巡回群ではありません。`], ['Either way it is abelian, so every intermediate field is Galois over $\\mathbb Q$.', 'いずれにせよ可換群なので、すべての中間体は $\\mathbb Q$ 上ガロアです。']],
      };
    },
  ];

  /* ---------- 2. the Galois correspondence ---------- */
  const SQF = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];
  const sq = (k) => `\\sqrt{${k}}`;
  const D4F = (k) => {
    const al = `\\sqrt[4]{${k}}`;
    return [
      { H: '\\langle\\tau\\rangle', F: `\\mathbb Q(${al})`, deg: 4, normal: false, why: [`$\\tau$ is complex conjugation, which fixes the real number $${al}$.`, `$\\tau$ は複素共役で、実数 $${al}$ を固定します。`] },
      { H: '\\langle\\rho^2\\tau\\rangle', F: `\\mathbb Q(i${al})`, deg: 4, normal: false, why: [`$\\rho^2\\tau$ sends $\\alpha \\mapsto -\\alpha$, $i \\mapsto -i$, so $i\\alpha \\mapsto (-i)(-\\alpha) = i\\alpha$.`, `$\\rho^2\\tau$ は $\\alpha \\mapsto -\\alpha$、$i \\mapsto -i$ と送るので、$i\\alpha \\mapsto (-i)(-\\alpha) = i\\alpha$ です。`] },
      { H: '\\langle\\rho\\tau\\rangle', F: `\\mathbb Q((1+i)${al})`, deg: 4, normal: false, why: ['$\\rho\\tau$ sends $\\alpha \\mapsto i\\alpha$, $i \\mapsto -i$, so $(1 + i)\\alpha \\mapsto (1 - i)i\\alpha = (1 + i)\\alpha$.', '$\\rho\\tau$ は $\\alpha \\mapsto i\\alpha$、$i \\mapsto -i$ と送るので、$(1 + i)\\alpha \\mapsto (1 - i)i\\alpha = (1 + i)\\alpha$ です。'] },
      { H: '\\langle\\rho^2\\rangle', F: `\\mathbb Q(${sq(k)}, i)`, deg: 4, normal: true, why: ['$\\rho^2$ sends $\\alpha \\mapsto -\\alpha$ and fixes $i$, so it fixes $\\alpha^2$ and $i$.', '$\\rho^2$ は $\\alpha \\mapsto -\\alpha$ と送り $i$ を固定するので、$\\alpha^2$ と $i$ を固定します。'] },
      { H: '\\langle\\rho\\rangle', F: '\\mathbb Q(i)', deg: 2, normal: true, why: ['$\\rho$ sends $\\alpha \\mapsto i\\alpha$ and fixes $i$; no power of $\\alpha$ below the fourth is fixed by all of $\\langle\\rho\\rangle$.', '$\\rho$ は $\\alpha \\mapsto i\\alpha$ と送り $i$ を固定します。$\\langle\\rho\\rangle$ 全体が固定する $\\alpha$ のべきは四乗より下にはありません。'] },
      { H: '\\langle\\rho^2, \\tau\\rangle', F: `\\mathbb Q(${sq(k)})`, deg: 2, normal: true, why: [`Both $\\rho^2$ and $\\tau$ fix $\\alpha^2 = ${sq(k)}$, while $\\tau$ moves $i$.`, `$\\rho^2$ と $\\tau$ はどちらも $\\alpha^2 = ${sq(k)}$ を固定し、$\\tau$ は $i$ を動かします。`] },
      { H: '\\langle\\rho^2, \\rho\\tau\\rangle', F: `\\mathbb Q(i${sq(k)})`, deg: 2, normal: true, why: [`$\\rho\\tau$ sends $i\\alpha^2 \\mapsto (-i)(i\\alpha)^2 = i\\alpha^2$, and $\\rho^2$ fixes it too.`, `$\\rho\\tau$ は $i\\alpha^2 \\mapsto (-i)(i\\alpha)^2 = i\\alpha^2$ と送り、$\\rho^2$ もこれを固定します。`] },
    ];
  };
  const S3F = (k) => {
    const al = `\\sqrt[3]{${k}}`;
    return [
      { H: '\\langle\\tau\\rangle', F: `\\mathbb Q(${al})`, deg: 3, normal: false, why: [`$\\tau$ is complex conjugation, which fixes the real cube root $${al}$.`, `$\\tau$ は複素共役で、実の三乗根 $${al}$ を固定します。`] },
      { H: '\\langle\\rho\\tau\\rangle', F: `\\mathbb Q(\\omega^2${al})`, deg: 3, normal: false, why: ['$\\rho\\tau$ sends $\\alpha \\mapsto \\omega\\alpha$, $\\omega \\mapsto \\omega^2$, so $\\omega^2\\alpha \\mapsto \\omega^4\\cdot\\omega\\alpha = \\omega^2\\alpha$.', '$\\rho\\tau$ は $\\alpha \\mapsto \\omega\\alpha$、$\\omega \\mapsto \\omega^2$ と送るので、$\\omega^2\\alpha \\mapsto \\omega^4\\cdot\\omega\\alpha = \\omega^2\\alpha$ です。'] },
      { H: '\\langle\\rho^2\\tau\\rangle', F: `\\mathbb Q(\\omega${al})`, deg: 3, normal: false, why: ['$\\rho^2\\tau$ sends $\\alpha \\mapsto \\omega^2\\alpha$, $\\omega \\mapsto \\omega^2$, so $\\omega\\alpha \\mapsto \\omega^2\\cdot\\omega^2\\alpha = \\omega\\alpha$.', '$\\rho^2\\tau$ は $\\alpha \\mapsto \\omega^2\\alpha$、$\\omega \\mapsto \\omega^2$ と送るので、$\\omega\\alpha \\mapsto \\omega^2\\cdot\\omega^2\\alpha = \\omega\\alpha$ です。'] },
      { H: '\\langle\\rho\\rangle', F: '\\mathbb Q(\\omega)', deg: 2, normal: true, why: ['$\\rho$ sends $\\alpha \\mapsto \\omega\\alpha$ and fixes $\\omega$.', '$\\rho$ は $\\alpha \\mapsto \\omega\\alpha$ と送り、$\\omega$ を固定します。'] },
    ];
  };
  Q.correspondence = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const [N, nm, ext] = r.pick([[8, '\\mathbb Q(\\sqrt[4]{2}, i)', 0], [6, '\\mathbb Q(\\sqrt[3]{2}, \\omega)', 1], [24, '\\text{the splitting field of a generic quartic}', -1], [12, '\\mathbb Q(\\zeta_{13})', -1], [16, '\\mathbb Q(\\zeta_{17})', -1]]);
        const divs = []; for (let d = 1; d <= N; d++) if (N % d === 0) divs.push(d);
        const m = r.pick(divs.filter((d) => d > 1 && d < N));
        return {
          q: [`$K = ${nm}$ has Galois group of order $${N}$. A subgroup $H$ has order $${m}$. What is $[K^H : \\mathbb Q]$?`, `$K = ${nm}$ のガロア群の位数は $${N}$ です。部分群 $H$ の位数は $${m}$ です。$[K^H : \\mathbb Q]$ はいくつですか。`],
          a: { type: 'int', v: N / m },
          hint: ['$[K : K^H] = |H|$, and degrees multiply in a tower.', '$[K : K^H] = |H|$ で、塔では次数がかけ算になります。'],
          sol: [[`$[K : K^H] = |H| = ${m}$ and $[K : \\mathbb Q] = ${N}$.`, `$[K : K^H] = |H| = ${m}$、$[K : \\mathbb Q] = ${N}$ です。`], [`So $[K^H : \\mathbb Q] = ${N}/${m} = ${N / m} = [G : H]$: bigger subgroups fix smaller fields.`, `よって $[K^H : \\mathbb Q] = ${N}/${m} = ${N / m} = [G : H]$ です。大きな部分群ほど小さな体を固定します。`]],
          set: ext >= 0 ? { ext } : undefined,
        };
      }
      if (kind === 1) {
        const a = r.pick([2, 3, 5, 6, 7, 8, 12, 18, 20, 27, 10, 50]); let b; do { b = r.pick([2, 3, 5, 6, 7, 8, 12, 18, 20, 27, 10, 45, 24]); } while (b === a);
        const sa = sqfree(a), sb = sqfree(b), d = sa === sb ? 2 : 4;
        return {
          q: [`What is $[\\mathbb Q(\\sqrt{${a}}, \\sqrt{${b}}) : \\mathbb Q]$?`, `$[\\mathbb Q(\\sqrt{${a}}, \\sqrt{${b}}) : \\mathbb Q]$ はいくつですか。`],
          a: { type: 'int', v: d },
          hint: ['Pull square factors out of each root first.', 'まずそれぞれの根から平方因子をくくり出します。'],
          sol: [[`$\\sqrt{${a}} = ${a === sa ? '' : Math.round(Math.sqrt(a / sa))}\\sqrt{${sa}}$ and $\\sqrt{${b}} = ${b === sb ? '' : Math.round(Math.sqrt(b / sb))}\\sqrt{${sb}}$.`, `$\\sqrt{${a}} = ${a === sa ? '' : Math.round(Math.sqrt(a / sa))}\\sqrt{${sa}}$、$\\sqrt{${b}} = ${b === sb ? '' : Math.round(Math.sqrt(b / sb))}\\sqrt{${sb}}$ です。`], [d === 2 ? `Both are rational multiples of $\\sqrt{${sa}}$, so the field is $\\mathbb Q(\\sqrt{${sa}})$, of degree 2.` : `$\\sqrt{${sb}} \\notin \\mathbb Q(\\sqrt{${sa}})$, since $${sa}\\cdot ${sb}$ is not a square, so the degree is $2\\cdot 2 = 4$ with group $C_2 \\times C_2$.`, d === 2 ? `どちらも $\\sqrt{${sa}}$ の有理数倍なので、体は次数 2 の $\\mathbb Q(\\sqrt{${sa}})$ です。` : `$${sa}\\cdot ${sb}$ は平方数ではないので $\\sqrt{${sb}} \\notin \\mathbb Q(\\sqrt{${sa}})$ で、次数は $2\\cdot 2 = 4$、群は $C_2 \\times C_2$ です。`]],
        };
      }
      const [lab, G, cnt, ext] = r.pick([['\\mathbb Q(\\sqrt[4]{2}, i)', 'D_4', 10, 0], ['\\mathbb Q(\\sqrt[3]{2}, \\omega)', 'S_3', 6, 1], ['\\mathbb Q(\\sqrt2, \\sqrt3)', 'C_2 \\times C_2', 5, -1], ['\\mathbb Q(\\zeta_7)', 'C_6', 4, -1], ['\\mathbb Q(\\zeta_5)', 'C_4', 3, -1], ['\\mathbb Q(\\zeta_{13})', 'C_{12}', 6, -1], ['\\mathbb Q(\\zeta_{11})', 'C_{10}', 4, -1]]);
      return {
        q: [`How many fields $F$ with $\\mathbb Q \\subseteq F \\subseteq K$ are there for $K = ${lab}$, counting both ends? Its group is $${G}$.`, `$K = ${lab}$ について、$\\mathbb Q \\subseteq F \\subseteq K$ となる体 $F$ は両端を含めていくつありますか。群は $${G}$ です。`],
        a: { type: 'int', v: cnt },
        hint: ['Count subgroups instead: the correspondence is a bijection.', '代わりに部分群を数えます。対応は全単射です。'],
        sol: [[`By the fundamental theorem, intermediate fields correspond one to one with subgroups of $${G}$.`, `基本定理により、中間体は $${G}$ の部分群と一対一に対応します。`], [G.startsWith('C_') && G !== 'C_2 \\times C_2' ? `A cyclic group has exactly one subgroup for each divisor of its order, so there are $${cnt}$.` : G === 'D_4' ? 'The dihedral group of order 8 has $1 + 5 + 3 + 1 = 10$ subgroups: trivial, five of order 2, three of order 4, and itself.' : G === 'S_3' ? '$S_3$ has $1 + 3 + 1 + 1 = 6$ subgroups: trivial, three of order 2, $A_3$, and itself.' : '$C_2 \\times C_2$ has the trivial group, three of order 2, and itself: $5$.', G.startsWith('C_') && G !== 'C_2 \\times C_2' ? `巡回群は位数の各約数に対してちょうど一つの部分群をもつので、$${cnt}$ 個です。` : G === 'D_4' ? '位数 8 の二面体群の部分群は、自明なもの、位数 2 が五つ、位数 4 が三つ、全体で $1 + 5 + 3 + 1 = 10$ 個です。' : G === 'S_3' ? '$S_3$ の部分群は、自明なもの、位数 2 が三つ、$A_3$、全体で $1 + 3 + 1 + 1 = 6$ 個です。' : '$C_2 \\times C_2$ の部分群は、自明なもの、位数 2 が三つ、全体で $5$ 個です。']],
        set: ext >= 0 ? { ext } : undefined,
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const [a, b] = r.sample(SQF.filter((x) => x <= 11), 2).sort((u, v) => u - v), mode = r.int(0, 2);
        const ab = sqfree(a * b), co = Math.round(Math.sqrt(a * b / ab));
        const sigma = mode === 0 ? [`\\sqrt{${a}} \\mapsto -\\sqrt{${a}},\\ \\sqrt{${b}} \\mapsto \\sqrt{${b}}`, b] : mode === 1 ? [`\\sqrt{${a}} \\mapsto \\sqrt{${a}},\\ \\sqrt{${b}} \\mapsto -\\sqrt{${b}}`, a] : [`\\sqrt{${a}} \\mapsto -\\sqrt{${a}},\\ \\sqrt{${b}} \\mapsto -\\sqrt{${b}}`, ab];
        const opts = [[`$\\mathbb Q(\\sqrt{${a}})$`, `$\\mathbb Q(\\sqrt{${a}})$`], [`$\\mathbb Q(\\sqrt{${b}})$`, `$\\mathbb Q(\\sqrt{${b}})$`], [`$\\mathbb Q(\\sqrt{${ab}})$`, `$\\mathbb Q(\\sqrt{${ab}})$`], ['$\\mathbb Q$', '$\\mathbb Q$']];
        return {
          q: [`In $K = \\mathbb Q(\\sqrt{${a}}, \\sqrt{${b}})$, let $\\sigma$ act by $${sigma[0]}$. What is the fixed field of $\\langle\\sigma\\rangle$?`, `$K = \\mathbb Q(\\sqrt{${a}}, \\sqrt{${b}})$ で、$\\sigma$ が $${sigma[0]}$ と作用するとします。$\\langle\\sigma\\rangle$ の固定体は何ですか。`],
          a: { type: 'choice', opts, v: mode === 0 ? 1 : mode === 1 ? 0 : 2 },
          hint: ['Check the basis $1, \\sqrt a, \\sqrt b, \\sqrt{ab}$ one by one.', '基底 $1, \\sqrt a, \\sqrt b, \\sqrt{ab}$ を一つずつ調べてください。'],
          sol: [[`$\\sigma(\\sqrt{${a * b}}) = \\sigma(\\sqrt{${a}})\\sigma(\\sqrt{${b}}) = ${mode === 2 ? '+' : '-'}\\sqrt{${a * b}}$${co > 1 ? `, and $\\sqrt{${a * b}} = ${co}\\sqrt{${ab}}$` : ''}.`, `$\\sigma(\\sqrt{${a * b}}) = \\sigma(\\sqrt{${a}})\\sigma(\\sqrt{${b}}) = ${mode === 2 ? '+' : '-'}\\sqrt{${a * b}}$ です${co > 1 ? `。また $\\sqrt{${a * b}} = ${co}\\sqrt{${ab}}$ です` : ''}。`], [`Of the basis $1, \\sqrt{${a}}, \\sqrt{${b}}, \\sqrt{${a * b}}$ only $1$ and $\\sqrt{${sigma[1] === ab ? a * b : sigma[1]}}$ are fixed, so $K^{\\langle\\sigma\\rangle} = \\mathbb Q(\\sqrt{${sigma[1]}})$, of degree $2 = [G : \\langle\\sigma\\rangle]$.`, `基底 $1, \\sqrt{${a}}, \\sqrt{${b}}, \\sqrt{${a * b}}$ のうち固定されるのは $1$ と $\\sqrt{${sigma[1] === ab ? a * b : sigma[1]}}$ だけなので、$K^{\\langle\\sigma\\rangle} = \\mathbb Q(\\sqrt{${sigma[1]}})$ で、次数は $2 = [G : \\langle\\sigma\\rangle]$ です。`]],
        };
      }
      const d4 = r.chance(0.6), k = d4 ? r.pick([2, 3, 5]) : r.pick([2, 3, 5, 7]), list = d4 ? D4F(k) : S3F(k);
      const item = r.pick(list);
      const K = d4 ? `\\mathbb Q(\\sqrt[4]{${k}}, i)` : `\\mathbb Q(\\sqrt[3]{${k}}, \\omega)`;
      const gens = d4 ? `$\\rho: \\alpha \\mapsto i\\alpha,\\ i \\mapsto i$ and $\\tau$ = complex conjugation, $\\alpha = \\sqrt[4]{${k}}$` : `$\\rho: \\alpha \\mapsto \\omega\\alpha,\\ \\omega \\mapsto \\omega$ and $\\tau$ = complex conjugation, $\\alpha = \\sqrt[3]{${k}}$`;
      const gensJ = d4 ? `$\\rho: \\alpha \\mapsto i\\alpha,\\ i \\mapsto i$、$\\tau$ は複素共役、$\\alpha = \\sqrt[4]{${k}}$` : `$\\rho: \\alpha \\mapsto \\omega\\alpha,\\ \\omega \\mapsto \\omega$、$\\tau$ は複素共役、$\\alpha = \\sqrt[3]{${k}}$`;
      const set = k === 2 ? { ext: d4 ? 0 : 1 } : undefined;
      if (kind === 1) {
        const same = list.filter((x) => x.deg === item.deg && x !== item), other = list.filter((x) => x.deg !== item.deg);
        const opts = [item].concat(r.sample(same, Math.min(3, same.length))).concat(r.sample(other, Math.max(0, 3 - same.length))).map((x) => [`$${x.F}$`, `$${x.F}$`]);
        return {
          q: [`In $K = ${K}$ with ${gens}, what is the fixed field of $H = ${item.H}$?`, `$K = ${K}$ で ${gensJ} とします。$H = ${item.H}$ の固定体は何ですか。`],
          a: { type: 'choice', opts, v: 0 },
          hint: [`$[K^H : \\mathbb Q] = [G : H] = ${item.deg}$; find an element of that degree that $H$ leaves alone.`, `$[K^H : \\mathbb Q] = [G : H] = ${item.deg}$ です。$H$ が動かさない、その次数の元を探します。`],
          sol: [item.why, [`So $${item.F} \\subseteq K^H$, and both have degree $${item.deg}$ over $\\mathbb Q$, so $K^H = ${item.F}$.`, `よって $${item.F} \\subseteq K^H$ で、どちらも $\\mathbb Q$ 上の次数が $${item.deg}$ なので $K^H = ${item.F}$ です。`]],
          set,
        };
      }
      return {
        q: [`In $K = ${K}$, is the intermediate field $${item.F}$ Galois (normal) over $\\mathbb Q$?`, `$K = ${K}$ の中間体 $${item.F}$ は $\\mathbb Q$ 上ガロア（正規）ですか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: item.normal ? 0 : 1, fixed: true },
        hint: ['It is Galois exactly when its subgroup is normal, that is, when every automorphism maps the field to itself.', '対応する部分群が正規であるとき、すなわちすべての自己同型が体を自分自身に写すときに限りガロアです。'],
        sol: [[`The field corresponds to $H = ${item.H}$, of index $${item.deg}$.`, `この体は指数 $${item.deg}$ の $H = ${item.H}$ に対応します。`], item.normal ? [item.deg === 2 ? 'A subgroup of index 2 is always normal, so the field is Galois: it is the splitting field of a quadratic.' : '$\\langle\\rho^2\\rangle$ is the centre of $D_4$, so every conjugate of $H$ is $H$ and the field is Galois: it is the splitting field of $(x^2 - k)(x^2 + 1)$.', item.deg === 2 ? '指数 2 の部分群は常に正規なので、体はガロアです。二次式の分解体になっています。' : '$\\langle\\rho^2\\rangle$ は $D_4$ の中心なので、$H$ の共役はすべて $H$ で、体はガロアです。$(x^2 - k)(x^2 + 1)$ の分解体になっています。'] : [`$H$ is not normal: some automorphism moves the generator to a conjugate root that is not in $${item.F}$, so the field contains one root of its minimal polynomial without the others.`, `$H$ は正規ではありません。ある自己同型が生成元を $${item.F}$ に入っていない共役な根へ動かすので、この体は最小多項式の根を一つだけ含み、残りを含みません。`]],
        set,
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const k = r.int(2, 5), deg = r.chance(0.6) ? 2 : 4;
        const ps = [2, 3, 5, 7, 11].slice(0, k);
        const v = deg === 2 ? 2 ** k - 1 : (2 ** k - 1) * (2 ** k - 2) / 6;
        return {
          q: [`How many subfields of degree $${deg}$ over $\\mathbb Q$ does $K = \\mathbb Q(${ps.map((p) => `\\sqrt{${p}}`).join(', ')})$ have?`, `$K = \\mathbb Q(${ps.map((p) => `\\sqrt{${p}}`).join(', ')})$ は、$\\mathbb Q$ 上の次数が $${deg}$ の部分体をいくつもちますか。`],
          a: { type: 'int', v },
          hint: [`The group is $(C_2)^{${k}}$, a vector space over $\\mathbb F_2$. A subfield of degree $${deg}$ corresponds to a subgroup of index $${deg}$.`, `群は $(C_2)^{${k}}$ で、$\\mathbb F_2$ 上のベクトル空間です。次数 $${deg}$ の部分体は指数 $${deg}$ の部分群に対応します。`],
          sol: [[`$[K : \\mathbb Q] = 2^{${k}}$ and $G \\cong (\\mathbb F_2)^{${k}}$: each automorphism flips the signs of some of the square roots.`, `$[K : \\mathbb Q] = 2^{${k}}$ で $G \\cong (\\mathbb F_2)^{${k}}$ です。各自己同型はいくつかの平方根の符号を反転させます。`], deg === 2 ? [`Index-2 subgroups are kernels of non-zero linear maps $G \\to \\mathbb F_2$: there are $2^{${k}} - 1 = ${v}$, matching the fields $\\mathbb Q(\\sqrt d)$ for the $${v}$ products $d$ of a non-empty set of the primes.`, `指数 2 の部分群は 0 でない線形写像 $G \\to \\mathbb F_2$ の核で、$2^{${k}} - 1 = ${v}$ 個あります。これは素数の空でない集合の積 $d$ に対する $${v}$ 個の体 $\\mathbb Q(\\sqrt d)$ に対応します。`] : [`Index-4 subgroups are the kernels of surjections onto $\\mathbb F_2^2$, one for each 2-dimensional subspace of the dual: $\\dfrac{(2^{${k}} - 1)(2^{${k}} - 2)}{(2^2 - 1)(2^2 - 2)} = ${v}$.`, `指数 4 の部分群は $\\mathbb F_2^2$ への全射の核で、双対空間の 2 次元部分空間に一つずつ対応します：$\\dfrac{(2^{${k}} - 1)(2^{${k}} - 2)}{(2^2 - 1)(2^2 - 2)} = ${v}$ です。`]],
        };
      }
      if (kind === 1) {
        const form = r.int(0, 1), p = r.pick(form ? [5, 7, 11, 13, 17, 19, 23, 29] : [3, 5, 7, 11, 13, 17, 19, 23, 29]), pstar = (p - 1) % 4 === 0 ? p : -p;
        return {
          q: form ? [`What is the degree $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${p}}) : \\mathbb Q]$, the fixed field of complex conjugation in $\\mathbb Q(\\zeta_{${p}})$?`, `$\\mathbb Q(\\zeta_{${p}})$ における複素共役の固定体 $\\mathbb Q(\\cos\\tfrac{2\\pi}{${p}})$ の次数 $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${p}}) : \\mathbb Q]$ はいくつですか。`] : [`$\\mathbb Q(\\zeta_{${p}})$ contains exactly one quadratic field $\\mathbb Q(\\sqrt d)$ with $d$ a squarefree integer. Find $d$.`, `$\\mathbb Q(\\zeta_{${p}})$ はただ一つの二次体 $\\mathbb Q(\\sqrt d)$（$d$ は平方因子をもたない整数）を含みます。$d$ を求めてください。`],
          a: { type: 'int', v: form ? (p - 1) / 2 : pstar },
          hint: form ? ['Complex conjugation is $\\zeta \\mapsto \\zeta^{-1}$, a subgroup of order 2.', '複素共役は $\\zeta \\mapsto \\zeta^{-1}$ で、位数 2 の部分群をなします。'] : ['The group is cyclic of order $p - 1$, so it has one subgroup of index 2: the squares. A Gauss sum generates its fixed field.', '群は位数 $p - 1$ の巡回群なので、指数 2 の部分群は平方元の部分群ただ一つです。その固定体はガウス和で生成されます。'],
          sol: form ? [[`$G \\cong (\\mathbb Z/${p})^\\times$ has order $${p - 1}$, and complex conjugation generates $H = \\{\\pm 1\\}$.`, `$G \\cong (\\mathbb Z/${p})^\\times$ の位数は $${p - 1}$ で、複素共役は $H = \\{\\pm 1\\}$ を生成します。`], [`$\\zeta + \\zeta^{-1} = 2\\cos\\tfrac{2\\pi}{${p}}$ is fixed by $H$, so the fixed field is $\\mathbb Q(\\cos\\tfrac{2\\pi}{${p}})$, of degree $[G : H] = ${(p - 1) / 2}$.`, `$\\zeta + \\zeta^{-1} = 2\\cos\\tfrac{2\\pi}{${p}}$ は $H$ で固定されるので、固定体は $\\mathbb Q(\\cos\\tfrac{2\\pi}{${p}})$ で、次数は $[G : H] = ${(p - 1) / 2}$ です。`]] : [[`The Gauss sum $g = \\sum_{a=1}^{${p - 1}}\\bigl(\\tfrac a{${p}}\\bigr)\\zeta^a$ is fixed exactly by the squares, and $g^2 = (-1)^{(p-1)/2}p = ${pstar}$.`, `ガウス和 $g = \\sum_{a=1}^{${p - 1}}\\bigl(\\tfrac a{${p}}\\bigr)\\zeta^a$ を固定するのはちょうど平方元で、$g^2 = (-1)^{(p-1)/2}p = ${pstar}$ です。`], [`So the quadratic subfield is $\\mathbb Q(\\sqrt{${pstar}})$: ${pstar < 0 ? 'imaginary, because' : 'real, because'} $${p} \\equiv ${p % 4} \\pmod 4$.`, `よって二次部分体は $\\mathbb Q(\\sqrt{${pstar}})$ で、$${p} \\equiv ${p % 4} \\pmod 4$ なので${pstar < 0 ? '虚' : '実'}二次体です。`]],
        };
      }
      const [K, G, v, ext, why] = r.pick([
        ['\\mathbb Q(\\sqrt[4]{2}, i)', 'D_4', 6, 0, ['', '']],
        ['\\mathbb Q(\\sqrt[3]{2}, \\omega)', 'S_3', 3, 1, ['$S_3$ has 3 normal subgroups: $\\{e\\}$, $A_3$ and $S_3$; the three subgroups of order 2 are conjugate to each other.', '$S_3$ の正規部分群は $\\{e\\}$、$A_3$、$S_3$ の 3 個です。位数 2 の三つの部分群は互いに共役です。']],
        ['\\mathbb Q(\\zeta_{7})', 'C_6', 4, -1, ['$C_6$ is abelian, so all of its $4$ subgroups are normal.', '$C_6$ は可換なので、$4$ 個の部分群はすべて正規です。']],
        ['\\mathbb Q(\\zeta_{13})', 'C_{12}', 6, -1, ['$C_{12}$ is abelian, so all of its $6$ subgroups (one per divisor of 12) are normal.', '$C_{12}$ は可換なので、$6$ 個の部分群（12 の約数ごとに一つ）はすべて正規です。']],
      ]);
      return {
        q: [`How many intermediate fields of $K = ${K}$ (counting $\\mathbb Q$ and $K$) are Galois over $\\mathbb Q$? The group is $${G}$.`, `$K = ${K}$ の中間体（$\\mathbb Q$ と $K$ を含む）のうち、$\\mathbb Q$ 上ガロアなものはいくつありますか。群は $${G}$ です。`],
        a: { type: 'int', v },
        hint: ['$K^H/\\mathbb Q$ is Galois exactly when $H$ is a normal subgroup.', '$K^H/\\mathbb Q$ がガロアであるのは、$H$ が正規部分群であるときに限ります。'],
        sol: [['By the fundamental theorem, count normal subgroups.', '基本定理により、正規部分群を数えます。'], G === 'D_4' ? ['$D_4$ has 6 normal subgroups: $\\{e\\}$, the centre $\\langle\\rho^2\\rangle$, the three subgroups of order 4 (index 2), and $D_4$. The other four subgroups of order 2 are not normal.', '$D_4$ の正規部分群は 6 個です：$\\{e\\}$、中心 $\\langle\\rho^2\\rangle$、指数 2 の位数 4 の部分群三つ、そして $D_4$ です。残りの位数 2 の部分群四つは正規ではありません。'] : why, [`So $${v}$ intermediate fields are Galois over $\\mathbb Q$.`, `したがって $\\mathbb Q$ 上ガロアな中間体は $${v}$ 個です。`]],
        set: ext >= 0 ? { ext } : undefined,
      };
    },
  ];

  /* ---------- 3. constructions (problem 0: n-gon, n 3..64; problem 1: theta 3..180 step 3) ---------- */
  const constructible = (k) => isPow2(phi(k));
  const cosDeg = (a) => { const m = 360 / gcd(((a % 360) + 360) % 360 || 360, 360); return m <= 2 ? 1 : phi(m) / 2; };
  Q.constructions = [
    (r) => {
      const kind = r.int(0, 2), k = r.int(3, 64), ph = phi(k), ok = isPow2(ph);
      if (kind === 0) {
        return {
          q: [`Compute Euler's $\\varphi(${k})$.`, `オイラーの $\\varphi(${k})$ を求めてください。`],
          a: { type: 'int', v: ph },
          hint: ['$\\varphi(n) = n\\prod_{p \\mid n}(1 - 1/p)$.', '$\\varphi(n) = n\\prod_{p \\mid n}(1 - 1/p)$ です。'],
          sol: [[`$${k} = ${factTeX(k)}$, so $\\varphi(${k}) = ${k}${[...new Set(factor(k))].map((p) => `(1 - \\tfrac1{${p}})`).join('')} = ${ph}$.`, `$${k} = ${factTeX(k)}$ なので $\\varphi(${k}) = ${k}${[...new Set(factor(k))].map((p) => `(1 - \\tfrac1{${p}})`).join('')} = ${ph}$ です。`], [ok ? `$${ph}$ is a power of 2, so the regular ${k}-gon is constructible.` : `$${ph}$ is not a power of 2, so the regular ${k}-gon is not constructible.`, ok ? `$${ph}$ は 2 のべきなので、正 ${k} 角形は作図可能です。` : `$${ph}$ は 2 のべきではないので、正 ${k} 角形は作図不可能です。`]],
          set: { problem: 0, n: k },
        };
      }
      if (kind === 1) {
        return {
          q: [`Can the regular ${k}-gon be constructed with ruler and compass?`, `正 ${k} 角形は定規とコンパスで作図できますか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: ok ? 0 : 1, fixed: true },
          hint: ['Gauss and Wantzel: exactly when $\\varphi(n)$ is a power of 2.', 'ガウスとヴァンツェル：$\\varphi(n)$ が 2 のべきであるときに限ります。'],
          sol: [[`$${k} = ${factTeX(k)}$ and $\\varphi(${k}) = ${ph}$.`, `$${k} = ${factTeX(k)}$、$\\varphi(${k}) = ${ph}$ です。`], [ok ? `A power of 2: $${k}$ is a power of 2 times distinct Fermat primes, and $\\cos(2\\pi/${k})$ sits at the top of a tower of quadratic extensions.` : `Not a power of 2: ${[...new Set(factor(k))].some((p) => p > 2 && ![3, 5, 17].includes(p)) ? `the odd prime ${[...new Set(factor(k))].find((p) => p > 2 && ![3, 5, 17].includes(p))} is not a Fermat prime` : 'an odd prime appears squared'}, so $\\varphi(${k})$ has an odd factor.`, ok ? `2 のべきです。$${k}$ は 2 のべきと相異なるフェルマー素数の積で、$\\cos(2\\pi/${k})$ は二次拡大の塔の頂上にあります。` : `2 のべきではありません。${[...new Set(factor(k))].some((p) => p > 2 && ![3, 5, 17].includes(p)) ? `奇素数 ${[...new Set(factor(k))].find((p) => p > 2 && ![3, 5, 17].includes(p))} はフェルマー素数ではない` : '奇素数が二乗で現れる'}ので、$\\varphi(${k})$ は奇数の因子をもちます。`]],
          set: { problem: 0, n: k },
        };
      }
      return {
        q: [`What is the degree $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q]$?`, `次数 $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q]$ はいくつですか。`],
        a: { type: 'int', v: k <= 2 ? 1 : ph / 2 },
        hint: ['$\\mathbb Q(\\zeta_n)$ has degree $\\varphi(n)$, and $\\cos(2\\pi/n)$ generates the fixed field of complex conjugation.', '$\\mathbb Q(\\zeta_n)$ の次数は $\\varphi(n)$ で、$\\cos(2\\pi/n)$ は複素共役の固定体を生成します。'],
        sol: [[`$\\varphi(${k}) = ${ph}$, and complex conjugation $\\zeta \\mapsto \\zeta^{-1}$ has order 2 for $n \\ge 3$.`, `$\\varphi(${k}) = ${ph}$ で、$n \\ge 3$ では複素共役 $\\zeta \\mapsto \\zeta^{-1}$ の位数は 2 です。`], [`So $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q] = ${ph}/2 = ${ph / 2}$.`, `よって $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q] = ${ph}/2 = ${ph / 2}$ です。`]],
        set: { problem: 0, n: k },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const m = r.int(3, 60); let k = m + 1; while (!constructible(k)) k++;
        return {
          q: [`What is the smallest $n > ${m}$ for which the regular $n$-gon is constructible?`, `正 $n$ 角形が作図可能となる $n > ${m}$ のうち、最小のものはいくつですか。`],
          a: { type: 'int', v: k },
          hint: ['Constructible $n$ are $2^a$ times a product of distinct Fermat primes $3, 5, 17, 257, 65537$.', '作図可能な $n$ は、$2^a$ と相異なるフェルマー素数 $3, 5, 17, 257, 65537$ の積です。'],
          sol: [[`Check upward from $${m + 1}$: ${Array.from({ length: k - m }, (_, i) => m + 1 + i).slice(0, 6).map((x) => `$\\varphi(${x}) = ${phi(x)}$`).join(', ')}${k - m > 6 ? ', ...' : ''}.`, `$${m + 1}$ から順に調べます：${Array.from({ length: k - m }, (_, i) => m + 1 + i).slice(0, 6).map((x) => `$\\varphi(${x}) = ${phi(x)}$`).join('、')}${k - m > 6 ? '、…' : ''}。`], [`The first power of 2 occurs at $n = ${k} = ${factTeX(k)}$.`, `最初に 2 のべきになるのは $n = ${k} = ${factTeX(k)}$ です。`]],
          set: k <= 64 ? { problem: 0, n: k } : undefined,
        };
      }
      if (kind === 1) {
        const th = r.step(3, 180, 3), d = cosDeg(th), m = 360 / gcd(th, 360);
        return {
          q: [`What is the degree of $\\cos ${th}^\\circ$ over $\\mathbb Q$?`, `$\\cos ${th}^\\circ$ の $\\mathbb Q$ 上の次数はいくつですか。`],
          a: { type: 'int', v: d },
          hint: [`Write $${th}^\\circ = 2\\pi k/m$ in lowest terms; then $\\cos$ has degree $\\varphi(m)/2$ for $m \\ge 3$.`, `$${th}^\\circ = 2\\pi k/m$ を既約分数で表します。$m \\ge 3$ なら $\\cos$ の次数は $\\varphi(m)/2$ です。`],
          sol: [[`$${th}^\\circ = 360^\\circ\\cdot ${frac(th, 360)}$, so $m = ${m}$.`, `$${th}^\\circ = 360^\\circ\\cdot ${frac(th, 360)}$ なので $m = ${m}$ です。`], [m <= 2 ? `$\\cos ${th}^\\circ = ${th === 180 ? '-1' : '1'}$ is rational: degree 1.` : `$[\\mathbb Q(\\cos ${th}^\\circ) : \\mathbb Q] = \\varphi(${m})/2 = ${phi(m)}/2 = ${d}$.`, m <= 2 ? `$\\cos ${th}^\\circ = ${th === 180 ? '-1' : '1'}$ は有理数で、次数は 1 です。` : `$[\\mathbb Q(\\cos ${th}^\\circ) : \\mathbb Q] = \\varphi(${m})/2 = ${phi(m)}/2 = ${d}$ です。`], [isPow2(d) ? 'A power of 2, as constructibility requires.' : 'Not a power of 2, so this angle cannot be constructed from scratch.', isPow2(d) ? '作図可能性が要求するとおり、2 のべきです。' : '2 のべきではないので、この角は一から作図することはできません。']],
          set: { problem: 1, theta: th },
        };
      }
      const [pn, qd] = r.pick([[1, 4], [1, 3], [2, 5], [-1, 3], [3, 5], [1, 5], [-1, 4], [2, 3], [-2, 5], [3, 4]]);
      const c = pn / qd;
      return {
        q: [`An angle has $\\cos\\theta = ${frac(pn, qd)}$. Write the monic cubic $p(x)$ whose roots include $x = \\cos(\\theta/3)$.`, `ある角が $\\cos\\theta = ${frac(pn, qd)}$ を満たします。$x = \\cos(\\theta/3)$ を根にもつモニックな三次式 $p(x)$ を書いてください。`],
        a: { type: 'expr', v: `x^3 - 3/4 x - ${pn}/${4 * qd}`, vars: ['x'], dom: { x: [-1.2, 1.2] }, lhs: ['$p(x) =$', '$p(x) =$'] },
        hint: ['Use $\\cos 3\\varphi = 4\\cos^3\\varphi - 3\\cos\\varphi$ with $\\varphi = \\theta/3$.', '$\\varphi = \\theta/3$ として $\\cos 3\\varphi = 4\\cos^3\\varphi - 3\\cos\\varphi$ を使います。'],
        sol: [[`$4x^3 - 3x = ${frac(pn, qd)}$, so dividing by 4: $p(x) = x^3 - \\tfrac34 x ${pn < 0 ? '+' : '-'} ${frac(Math.abs(pn), 4 * qd)}$.`, `$4x^3 - 3x = ${frac(pn, qd)}$ なので、4 で割って $p(x) = x^3 - \\tfrac34 x ${pn < 0 ? '+' : '-'} ${frac(Math.abs(pn), 4 * qd)}$ です。`], [`Its three roots are $\\cos(\\theta/3)$, $\\cos(\\theta/3 + 120^\\circ)$, $\\cos(\\theta/3 + 240^\\circ)$. Multiplied by $${4 * qd}$ it has integer coefficients and no rational root, so it is irreducible: trisecting this angle needs a cube root, out of reach of ruler and compass.`, `三つの根は $\\cos(\\theta/3)$、$\\cos(\\theta/3 + 120^\\circ)$、$\\cos(\\theta/3 + 240^\\circ)$ です。$${4 * qd}$ 倍すると整数係数で有理根をもたないので既約です。この角の三等分には立方根が必要で、定規とコンパスでは届きません。`]],
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const th = r.step(3, 180, 3), d1 = cosDeg(th), d3 = cosDeg(th / 3), rel = d3 / d1, ok = rel !== 3;
        return {
          q: [`Can the angle $${th}^\\circ$ be trisected with ruler and compass (starting from the angle itself)?`, `角 $${th}^\\circ$ を（その角自身から出発して）定規とコンパスで三等分できますか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: ok ? 0 : 1, fixed: true },
          hint: ['Compare the degrees of $\\cos\\theta$ and $\\cos(\\theta/3)$: the ratio is 1, 2 or 3, and only 3 is fatal.', '$\\cos\\theta$ と $\\cos(\\theta/3)$ の次数を比べます。比は 1、2、3 のいずれかで、3 だけが致命的です。'],
          sol: [[`$[\\mathbb Q(\\cos ${th}^\\circ) : \\mathbb Q] = ${d1}$ and $[\\mathbb Q(\\cos ${th / 3}^\\circ) : \\mathbb Q] = ${d3}$.`, `$[\\mathbb Q(\\cos ${th}^\\circ) : \\mathbb Q] = ${d1}$、$[\\mathbb Q(\\cos ${th / 3}^\\circ) : \\mathbb Q] = ${d3}$ です。`], [`The relative degree is $${d3}/${d1} = ${rel}$.`, `相対次数は $${d3}/${d1} = ${rel}$ です。`], [ok ? (rel === 1 ? `$\\cos ${th / 3}^\\circ$ already lies in $\\mathbb Q(\\cos ${th}^\\circ)$, so the trisection is possible.` : `One square root reaches $\\cos ${th / 3}^\\circ$, so the trisection is a ruler-and-compass step.`) : `Degree 3 does not divide any power of 2, so no sequence of ruler and compass steps reaches $${th / 3}^\\circ$ from $${th}^\\circ$.`, ok ? (rel === 1 ? `$\\cos ${th / 3}^\\circ$ はすでに $\\mathbb Q(\\cos ${th}^\\circ)$ に含まれるので、三等分は可能です。` : `平方根一つで $\\cos ${th / 3}^\\circ$ に届くので、三等分は定規とコンパスの一手です。`) : `次数 3 はどの 2 のべきも割り切らないので、定規とコンパスの手順を何度重ねても $${th}^\\circ$ から $${th / 3}^\\circ$ には届きません。`]],
          set: { problem: 1, theta: th },
        };
      }
      if (kind === 1) {
        const N = r.int(20, 120);
        const list = []; for (let k = 3; k <= N; k++) if (constructible(k)) list.push(k);
        return {
          q: [`How many regular $n$-gons with $3 \\le n \\le ${N}$ are constructible?`, `$3 \\le n \\le ${N}$ の正 $n$ 角形のうち、作図可能なものはいくつありますか。`],
          a: { type: 'int', v: list.length },
          hint: ['List the odd parts first: products of distinct Fermat primes $1, 3, 5, 15, 17, 51, 85, 255, \\dots$, then multiply by powers of 2.', 'まず奇数部分を書き出します：相異なるフェルマー素数の積 $1, 3, 5, 15, 17, 51, 85, 255, \\dots$。それに 2 のべきをかけます。'],
          sol: [[`Odd parts up to $${N}$: $${[1, 3, 5, 15, 17, 51, 85].filter((x) => x <= N).join(', ')}$; times powers of 2.`, `$${N}$ 以下の奇数部分は $${[1, 3, 5, 15, 17, 51, 85].filter((x) => x <= N).join(', ')}$ で、これに 2 のべきをかけます。`], [`The list is $${list.join(', ')}$: $${list.length}$ values.`, `一覧は $${list.join(', ')}$ で、$${list.length}$ 個です。`]],
          set: N <= 64 ? { problem: 0, n: list[list.length - 1] } : undefined,
        };
      }
      const pool = []; for (let k = 5; k <= 1100; k++) if (constructible(k) && k % 2 === 1) pool.push(k);
      const form = r.int(0, 1);
      if (form === 0) {
        const k = r.pick(pool.concat([16, 32, 34, 40, 60, 68, 96, 102, 136, 170, 510])), d = phi(k) / 2, steps = Math.log2(d);
        return {
          q: [`The regular ${k}-gon is constructible. How many successive quadratic extensions lead from $\\mathbb Q$ to $\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}})$?`, `正 ${k} 角形は作図可能です。$\\mathbb Q$ から $\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}})$ までは、二次拡大を何段重ねる必要がありますか。`],
          a: { type: 'int', v: steps },
          hint: ['The degree of $\\cos(2\\pi/n)$ is $\\varphi(n)/2$; each quadratic step doubles the degree.', '$\\cos(2\\pi/n)$ の次数は $\\varphi(n)/2$ で、二次拡大を一段重ねるごとに次数は 2 倍になります。'],
          sol: [[`$${k} = ${factTeX(k)}$, $\\varphi(${k}) = ${phi(k)}$, so $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q] = ${d} = 2^{${steps}}$.`, `$${k} = ${factTeX(k)}$、$\\varphi(${k}) = ${phi(k)}$ なので $[\\mathbb Q(\\cos\\tfrac{2\\pi}{${k}}) : \\mathbb Q] = ${d} = 2^{${steps}}$ です。`], [`The Galois group is abelian of order $2^{${steps}}$, so it has a chain of subgroups each of index 2, and the fixed fields form a tower of $${steps}$ quadratic steps: each one is a square root, which ruler and compass can take.`, `ガロア群は位数 $2^{${steps}}$ の可換群なので、指数 2 ずつの部分群の鎖をもち、その固定体は $${steps}$ 段の二次拡大の塔になります。各段は平方根一つで、定規とコンパスで取れます。`]],
          set: k <= 64 ? { problem: 0, n: k } : undefined,
        };
      }
      const cands = [45, 51, 63, 75, 85, 99, 105, 119, 153, 255, 257, 289, 340, 341, 390, 425, 510, 765, 771, 1020];
      const k = r.pick(cands), ok = constructible(k), f = [...new Set(factor(k))];
      return {
        q: [`Is the regular ${k}-gon constructible?`, `正 ${k} 角形は作図可能ですか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: ok ? 0 : 1, fixed: true },
        hint: ['Factor $n$: allowed are a power of 2 and distinct Fermat primes $3, 5, 17, 257, 65537$, each at most once.', '$n$ を素因数分解します。許されるのは 2 のべきと、相異なるフェルマー素数 $3, 5, 17, 257, 65537$ をそれぞれ高々一回ずつです。'],
        sol: [[`$${k} = ${factTeX(k)}$.`, `$${k} = ${factTeX(k)}$ です。`], [ok ? 'Only a power of 2 and distinct Fermat primes appear, so $\\varphi(n)$ is a power of 2 and the polygon is constructible.' : f.some((p) => p > 2 && ![3, 5, 17, 257].includes(p)) ? `$${f.find((p) => p > 2 && ![3, 5, 17, 257].includes(p))}$ is not a Fermat prime, so $\\varphi(n)$ has an odd factor: not constructible.` : 'A Fermat prime appears squared, contributing that prime to $\\varphi(n)$: not constructible.', ok ? '2 のべきと相異なるフェルマー素数しか現れないので、$\\varphi(n)$ は 2 のべきで、多角形は作図可能です。' : f.some((p) => p > 2 && ![3, 5, 17, 257].includes(p)) ? `$${f.find((p) => p > 2 && ![3, 5, 17, 257].includes(p))}$ はフェルマー素数ではないので、$\\varphi(n)$ は奇数の因子をもち、作図不可能です。` : 'フェルマー素数が二乗で現れ、その素数が $\\varphi(n)$ に入り込むので、作図不可能です。']],
      };
    },
  ];
})();
