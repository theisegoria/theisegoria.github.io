'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, terms } = P.util;

  /* ---------- exact rationals [num, den] for the real chord law ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const F = (p, q = 1) => { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q) || 1; return [p / g, q / g]; };
  const fadd = (x, y) => F(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const fsub = (x, y) => F(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
  const fmul = (x, y) => F(x[0] * y[0], x[1] * y[1]);
  const fdiv = (x, y) => F(x[0] * y[1], x[1] * y[0]);
  const fv = (x) => x[0] / x[1];
  const fT = (x) => frac(x[0], x[1]);
  const isInt = (x) => x[1] === 1;
  const ptT = (Pt) => (Pt ? `(${fT(Pt[0])}, ${fT(Pt[1])})` : '\\mathcal O');
  // P + Q on y^2 = x^3 + a x + b with exact rationals; null is O
  function addF(P1, P2, a) {
    if (!P1) return { S: P2 }; if (!P2) return { S: P1 };
    let lam;
    if (P1[0][0] * P2[0][1] === P2[0][0] * P1[0][1]) {
      if (fv(fadd(P1[1], P2[1])) === 0) return { S: null, lam: null };
      lam = fdiv(fadd(fmul(F(3), fmul(P1[0], P1[0])), F(a)), fmul(F(2), P1[1]));
    } else lam = fdiv(fsub(P2[1], P1[1]), fsub(P2[0], P1[0]));
    const x3 = fsub(fsub(fmul(lam, lam), P1[0]), P2[0]);
    return { S: [x3, fsub(fmul(lam, fsub(P1[0], x3)), P1[1])], lam };
  }
  const cub = (x, a, b) => x * x * x + a * x + b;
  function intPoints(a, b, X0 = -12, X1 = 40) {
    const out = [];
    for (let x = X0; x <= X1; x++) { const s = cub(x, a, b); if (s < 0) continue; const y = Math.round(Math.sqrt(s)); if (y * y === s) out.push([x, y]); }
    return out;
  }
  const nonsing = (a, b) => 4 * a * a * a + 27 * b * b !== 0;
  // curves with at least two integer points off the x axis (distinct x)
  const RICH = [];
  for (let a = -10; a <= 10; a++) for (let b = -10; b <= 16; b++) {
    if (!nonsing(a, b)) continue;
    const pts = intPoints(a, b).filter(([, y]) => y > 0);
    if (pts.length >= 2) RICH.push({ a, b, pts });
  }
  const settable = (c) => c.a >= -3 && c.a <= 2 && c.b >= -2 && c.b <= 3;
  // integer points with their order: finite order found by Nagell-Lutz (multiples stay integral until O)
  function orderOf(Pt, a, kmax = 12) {
    const P0 = [F(Pt[0]), F(Pt[1])];
    let R = P0; const seq = [R];
    for (let k = 2; k <= kmax; k++) {
      const { S } = addF(R, P0, a);
      if (!S) return { order: k, seq };
      if (!isInt(S[0]) || !isInt(S[1]) || Math.abs(fv(S[0])) > 1e6) return { order: 0, seq: seq.concat([S]), k };
      R = S; seq.push(R);
    }
    return { order: 0, seq, k: kmax };
  }
  const TORSION = [], FREE = [];
  // curves with points of order 4 to 9, from Kubert's families moved to short Weierstrass form
  const EXTRA = [[-107, 806, 7, 20], [-11, 70, 3, 8], [-11, 6, -1, 4], [-107, -154, -5, 16], [0, 4, 0, 2], [4, 0, 2, 4], [-432, 8208, 24, 108], [-432, 8208, -12, 108], [-1080, 297, -6, 81], [-108, 297, -6, 27], [0, 1, 2, 3], [-43, 166, 3, 8], [-43, 166, -5, 16], [-43, 166, 11, 32], [-219, 1654, 11, 24], [-219, 1654, -13, 48]].map(([a, b, x, y]) => ({ a, b, pts: [[x, y]] }));
  for (const c of RICH.concat(EXTRA)) {
    for (const p of c.pts) {
      const o = orderOf(p, c.a);
      if (o.order >= 3) TORSION.push({ a: c.a, b: c.b, p, order: o.order, seq: o.seq });
      else if (o.order === 0 && o.seq.length <= 3) FREE.push({ a: c.a, b: c.b, p, seq: o.seq });
    }
  }
  const curveT = (a, b) => `y^2 = ${terms([[1, 'x^3'], [a, 'x'], [b, '']])}`;
  const largestRoot = (a, b) => { let lo = -20, hi = 20; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (cub(m, a, b) > 0 && [m + 0.01, m + 1, m + 5].every((t) => cub(t, a, b) > 0)) hi = m; else lo = m; } return hi; };
  const inSet = (x) => x >= -3 && x <= 3.4;

  /* ---------- 1. chord and tangent ---------- */
  Q['chord-tangent'] = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const a = r.int(-5, 5), b = r.int(-5, 5), s = 4 * a * a * a + 27 * b * b, D = -16 * s;
        return {
          q: [`Compute the discriminant $\\Delta = -16(4a^3 + 27b^2)$ of $${curveT(a, b)}$.`, `$${curveT(a, b)}$ の判別式 $\\Delta = -16(4a^3 + 27b^2)$ を求めてください。`],
          a: { type: 'int', v: D },
          hint: ['Substitute $a$ and $b$; mind the signs of the cube.', '$a$ と $b$ を代入します。三乗の符号に注意してください。'],
          sol: [[`$4a^3 + 27b^2 = 4\\cdot(${a * a * a}) + 27\\cdot ${b * b} = ${s}$.`, `$4a^3 + 27b^2 = 4\\cdot(${a * a * a}) + 27\\cdot ${b * b} = ${s}$ です。`], [`$\\Delta = -16\\cdot ${s < 0 ? `(${s})` : s} = ${D}$. ${D === 0 ? 'Zero: the cubic has a repeated root, so the curve is singular and not an elliptic curve.' : D > 0 ? 'Positive: three real roots, so the real curve has two components.' : 'Negative: one real root, so the real curve is one piece.'}`, `$\\Delta = -16\\cdot ${s < 0 ? `(${s})` : s} = ${D}$ です。${D === 0 ? '0 なので三次式は重根をもち、曲線は特異で楕円曲線ではありません。' : D > 0 ? '正なので実根が三つあり、実曲線は二つの成分からなります。' : '負なので実根は一つで、実曲線はひとつながりです。'}`]],
          set: a >= -3 && a <= 2 && b >= -2 && b <= 3 ? { a, b } : undefined,
        };
      }
      if (kind === 1) {
        const c = r.pick(RICH), p = r.pick(c.pts), on = r.chance(0.5), y = on ? p[1] * r.sign() : p[1] + r.pick([1, -1, 2]) * (p[1] === 0 ? 1 : 1);
        const lhs = y * y, rhs = cub(p[0], c.a, c.b);
        return {
          q: [`Is $(${p[0]}, ${y})$ a point of $${curveT(c.a, c.b)}$?`, `$(${p[0]}, ${y})$ は $${curveT(c.a, c.b)}$ 上の点ですか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: lhs === rhs ? 0 : 1, fixed: true },
          hint: ['Compare $y^2$ with $x^3 + ax + b$.', '$y^2$ と $x^3 + ax + b$ を比べてください。'],
          sol: [[`$y^2 = ${lhs}$ and $x^3 + ax + b = ${rhs}$.`, `$y^2 = ${lhs}$、$x^3 + ax + b = ${rhs}$ です。`], [lhs === rhs ? `They agree, so the point is on the curve, and so is its mirror image $(${p[0]}, ${-y})$.` : 'They differ, so the point is off the curve.', lhs === rhs ? `一致するので曲線上の点で、鏡像 $(${p[0]}, ${-y})$ も曲線上にあります。` : '一致しないので、曲線上の点ではありません。']],
        };
      }
      let a, b, s; do { a = r.step(-3, 2, 0.05); b = r.step(-2, 3, 0.05); s = 4 * a * a * a + 27 * b * b; } while (Math.abs(s) < 1);
      const two = s < 0;
      return {
        q: [`How many connected pieces does the real curve $${curveT(a, b)}$ have?`, `実曲線 $${curveT(a, b)}$ はいくつの連結成分からなりますか。`],
        a: { type: 'choice', opts: [['One', '一つ'], ['Two', '二つ']], v: two ? 1 : 0, fixed: true },
        hint: ['Count the real roots of the cubic; the sign of $4a^3 + 27b^2$ decides.', '三次式の実根の個数を数えます。$4a^3 + 27b^2$ の符号で決まります。'],
        sol: [[`$4a^3 + 27b^2 = ${n(s, 3)}$, ${two ? 'negative' : 'positive'}, so the cubic has ${two ? 'three real roots' : 'one real root'}.`, `$4a^3 + 27b^2 = ${n(s, 3)}$ は${two ? '負' : '正'}なので、三次式の実根は${two ? '三つ' : '一つ'}です。`], [two ? 'The cubic is non-negative on a bounded interval and on a half-line: an oval and an unbounded branch.' : 'The cubic is non-negative only on one half-line: a single unbounded branch.', two ? '三次式が非負になるのは有界な区間と半直線なので、楕円形の閉曲線と非有界な枝ができます。' : '三次式が非負になるのは一本の半直線だけなので、非有界な枝が一つだけです。']],
        set: { a, b },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      let c, P1, P2, res;
      const pool = r.chance(0.4) ? RICH.filter((cc) => settable(cc) && cc.pts.filter((p) => inSet(p[0])).length >= 2) : RICH;
      for (let tries = 0; tries < 60; tries++) {
        c = r.pick(pool);
        const pts = pool === RICH ? c.pts : c.pts.filter((p) => inSet(p[0]));
        if (kind === 1) { const p = r.pick(pts); P1 = [p[0], p[1] * r.sign()]; P2 = P1; }
        else { const [p, q] = r.sample(pts, 2); P1 = [p[0], p[1] * r.sign()]; P2 = [q[0], q[1] * r.sign()]; }
        res = addF([F(P1[0]), F(P1[1])], [F(P2[0]), F(P2[1])], c.a);
        if (res.S && Math.abs(fv(res.S[0])) < 200 && res.S[0][1] <= 400 && Math.abs(fv(res.S[1])) < 3000) break;
      }
      const { S, lam } = res, a = c.a, b = c.b;
      const set = settable(c) && inSet(P1[0]) && inSet(P2[0]) ? { a, b, px: P1[0], ps: P1[1] < 0 ? 1 : 0, qx: P2[0], qs: P2[1] < 0 ? 1 : 0, op: kind === 1 ? 1 : 0 } : undefined;
      const lamStep = kind === 1 ? [`Tangent slope: $\\lambda = \\dfrac{3x_P^2 + a}{2y_P} = \\dfrac{${3 * P1[0] * P1[0] + a}}{${2 * P1[1]}}${gcd(3 * P1[0] * P1[0] + a, 2 * P1[1]) === 1 && 2 * P1[1] > 0 ? '' : ` = ${fT(lam)}`}$.`, `接線の傾き：$\\lambda = \\dfrac{3x_P^2 + a}{2y_P} = \\dfrac{${3 * P1[0] * P1[0] + a}}{${2 * P1[1]}}${gcd(3 * P1[0] * P1[0] + a, 2 * P1[1]) === 1 && 2 * P1[1] > 0 ? '' : ` = ${fT(lam)}`}$ です。`] : [`Chord slope: $\\lambda = \\dfrac{${P2[1]} - (${P1[1]})}{${P2[0]} - (${P1[0]})} = ${fT(lam)}$.`, `弦の傾き：$\\lambda = \\dfrac{${P2[1]} - (${P1[1]})}{${P2[0]} - (${P1[0]})} = ${fT(lam)}$ です。`];
      if (kind === 2) {
        return {
          q: [`On $${curveT(a, b)}$, find the slope of the line through $P = (${P1[0]}, ${P1[1]})$ and $Q = (${P2[0]}, ${P2[1]})$, and the $x$ coordinate of the third point where it meets the curve.`, `$${curveT(a, b)}$ 上の $P = (${P1[0]}, ${P1[1]})$ と $Q = (${P2[0]}, ${P2[1]})$ を通る直線の傾きと、その直線が曲線と交わる三つ目の点の $x$ 座標を求めてください。`],
          a: { type: 'tuple', v: [fv(lam), fv(S[0])], labels: ['$\\lambda$', '$x_3$'], tol: 0.002 },
          hint: ['Substituting $y = \\lambda x + \\nu$ into the cubic, the three roots sum to $\\lambda^2$.', '$y = \\lambda x + \\nu$ を三次式に代入すると、三つの根の和は $\\lambda^2$ になります。'],
          sol: [lamStep, [`$x_P + x_Q + x_3 = \\lambda^2$, so $x_3 = ${fT(fmul(lam, lam))} - (${P1[0]}) - (${P2[0]}) = ${fT(S[0])}$.`, `$x_P + x_Q + x_3 = \\lambda^2$ より $x_3 = ${fT(fmul(lam, lam))} - (${P1[0]}) - (${P2[0]}) = ${fT(S[0])}$ です。`], ['The coefficient of $x^2$ in $x^3 - (\\lambda x + \\nu)^2 + ax + b$ is $-\\lambda^2$, and it is minus the sum of the roots: this is why one more point always exists.', '$x^3 - (\\lambda x + \\nu)^2 + ax + b$ の $x^2$ の係数は $-\\lambda^2$ で、これは根の和の符号を変えたものです。もう一点が必ず存在するのはこのためです。']],
          set,
        };
      }
      return {
        q: kind === 1 ? [`On $${curveT(a, b)}$, compute $2P$ for $P = (${P1[0]}, ${P1[1]})$.`, `$${curveT(a, b)}$ 上で $P = (${P1[0]}, ${P1[1]})$ に対する $2P$ を求めてください。`] : [`On $${curveT(a, b)}$, compute $P + Q$ for $P = (${P1[0]}, ${P1[1]})$ and $Q = (${P2[0]}, ${P2[1]})$.`, `$${curveT(a, b)}$ 上で $P = (${P1[0]}, ${P1[1]})$ と $Q = (${P2[0]}, ${P2[1]})$ の和 $P + Q$ を求めてください。`],
        a: { type: 'tuple', v: [fv(S[0]), fv(S[1])], labels: ['$x$', '$y$'], tol: 0.002 },
        hint: kind === 1 ? ['Use the tangent: $\\lambda = (3x^2 + a)/(2y)$, then reflect the third point.', '接線 $\\lambda = (3x^2 + a)/(2y)$ を使い、三つ目の点を折り返します。'] : ['Slope of the chord, then $x_3 = \\lambda^2 - x_P - x_Q$, then reflect.', '弦の傾きを求め、$x_3 = \\lambda^2 - x_P - x_Q$、最後に折り返します。'],
        sol: [lamStep, kind === 1 ? [`$x = \\lambda^2 - 2x_P = ${fT(fmul(lam, lam))} - ${2 * P1[0] < 0 ? `(${2 * P1[0]})` : 2 * P1[0]} = ${fT(S[0])}$.`, `$x = \\lambda^2 - 2x_P = ${fT(fmul(lam, lam))} - ${2 * P1[0] < 0 ? `(${2 * P1[0]})` : 2 * P1[0]} = ${fT(S[0])}$ です。`] : [`$x = \\lambda^2 - x_P - x_Q = ${fT(fmul(lam, lam))} - (${P1[0]}) - (${P2[0]}) = ${fT(S[0])}$.`, `$x = \\lambda^2 - x_P - x_Q = ${fT(fmul(lam, lam))} - (${P1[0]}) - (${P2[0]}) = ${fT(S[0])}$ です。`], [`$y = \\lambda(x_P - x) - y_P = ${fT(S[1])}$, so ${kind === 1 ? '$2P' : 'the sum is $'}${kind === 1 ? ' = ' : ''}${ptT(S)}$${isInt(S[0]) ? '' : ': rational, not integral, as the chord law allows'}.`, `$y = \\lambda(x_P - x) - y_P = ${fT(S[1])}$ で、${kind === 1 ? '$2P' : '和は $'}${kind === 1 ? ' = ' : ''}${ptT(S)}$ です${isInt(S[0]) ? '' : '。弦の法則が許すとおり、有理数ですが整数ではありません'}。`]],
        set,
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let a, b; do { a = r.int(-4, 3); b = r.int(-3, 4); } while (!nonsing(a, b) || (a === 0 && b === 0));
        const x0 = largestRoot(a, b);
        const num = terms([[1, 'x^4'], [-2 * a, 'x^2'], [-8 * b, 'x'], [a * a, '']]), tq = terms([[3, 'x^2'], [a, '']]);
        return {
          q: [`On $${curveT(a, b)}$, write the $x$ coordinate of $2P$ as a function of the $x$ coordinate of $P = (x, y)$.`, `$${curveT(a, b)}$ 上で、$P = (x, y)$ の $x$ 座標の関数として $2P$ の $x$ 座標を表してください。`],
          a: { type: 'expr', v: `(${terms([[1, 'x^4'], [-2 * a, 'x^2'], [-8 * b, 'x'], [a * a, '']])})/(4(${terms([[1, 'x^3'], [a, 'x'], [b, '']])}))`, vars: ['x'], dom: { x: [x0 + 0.3, x0 + 2.5] }, lhs: ['$x(2P) =$', '$x(2P) =$'] },
          hint: ['$x(2P) = \\lambda^2 - 2x$ with $\\lambda = (3x^2 + a)/(2y)$; replace $y^2$ by the cubic.', '$x(2P) = \\lambda^2 - 2x$、$\\lambda = (3x^2 + a)/(2y)$ です。$y^2$ を三次式で置き換えます。'],
          sol: [[`$\\lambda^2 = \\dfrac{(${tq})^2}{4y^2} = \\dfrac{(${tq})^2}{4(${terms([[1, 'x^3'], [a, 'x'], [b, '']])})}$.`, `$\\lambda^2 = \\dfrac{(${tq})^2}{4y^2} = \\dfrac{(${tq})^2}{4(${terms([[1, 'x^3'], [a, 'x'], [b, '']])})}$ です。`], [`Subtracting $2x$ over the common denominator: $x(2P) = \\dfrac{${num}}{4(${terms([[1, 'x^3'], [a, 'x'], [b, '']])})}$.`, `通分して $2x$ を引くと $x(2P) = \\dfrac{${num}}{4(${terms([[1, 'x^3'], [a, 'x'], [b, '']])})}$ です。`], ['The denominator vanishes exactly at the roots of the cubic, the points with $y = 0$: their tangent is vertical and $2P = \\mathcal O$, so they have order 2.', '分母は三次式の根、つまり $y = 0$ の点でちょうど 0 になります。そこでは接線が垂直で $2P = \\mathcal O$、つまり位数 2 の点です。']],
          set: a >= -3 && a <= 2 && b >= -2 && b <= 3 ? { a, b, op: 1 } : undefined,
        };
      }
      if (kind === 1) {
        const ords = [...new Set(TORSION.map((x) => x.order))], ow = r.pick(ords), T = r.pick(TORSION.filter((x) => x.order === ow)), { a, b, p, order, seq } = T, sgn = r.sign(), y = p[1] * sgn;
        const shown = seq.slice(1, Math.min(order - 1, 5)).map((S, i) => `${i + 2}P = (${fT(S[0])}, ${fT(fmul(S[1], F(sgn)))})`).join(',\\ ');
        return {
          q: [`On $${curveT(a, b)}$, what is the order of the point $P = (${p[0]}, ${y})$?`, `$${curveT(a, b)}$ 上の点 $P = (${p[0]}, ${y})$ の位数はいくつですか。`],
          a: { type: 'int', v: order },
          hint: ['Add $P$ to itself repeatedly until you reach $\\mathcal O$, which happens when you meet the reflection of $P$.', '$\\mathcal O$ に達するまで $P$ を足し続けます。$P$ の鏡像に出会ったときがそれです。'],
          sol: (order > 3 ? [[`$${shown}${order > 5 ? ',\\ \\dots' : ''}$.`, `$${shown}${order > 5 ? ',\\ \\dots' : ''}$ です。`]] : []).concat([[`$${order - 1}P = (${fT(seq[order - 2][0])}, ${fT(fmul(seq[order - 2][1], F(sgn)))}) = -P$, so $${order}P = \\mathcal O$: the order is $${order}$.`, `$${order - 1}P = (${fT(seq[order - 2][0])}, ${fT(fmul(seq[order - 2][1], F(sgn)))}) = -P$ なので $${order}P = \\mathcal O$、位数は $${order}$ です。`], [`Every multiple stays integral, as Nagell and Lutz require of torsion points, and Mazur's theorem caps the order of a rational torsion point at 12.`, `ナゲル・ルッツの定理がねじれ点に要求するとおり、どの倍数も整数座標のままです。マズールの定理により、有理ねじれ点の位数は 12 以下です。`]]),
          set: a >= -3 && a <= 2 && b >= -2 && b <= 3 && inSet(p[0]) ? { a, b, px: p[0], ps: y < 0 ? 1 : 0, op: 1 } : undefined,
        };
      }
      const torsion = r.chance(0.4), T = torsion ? r.pick(TORSION) : r.pick(FREE), { a, b, p } = T;
      const twoP = T.seq[1];
      return {
        q: [`On $${curveT(a, b)}$, does $P = (${p[0]}, ${p[1]})$ have finite order?`, `$${curveT(a, b)}$ 上の $P = (${p[0]}, ${p[1]})$ は有限位数をもちますか。`],
        a: { type: 'choice', opts: [['Yes: some multiple of $P$ is $\\mathcal O$.', 'はい。$P$ のある倍数が $\\mathcal O$ になります。'], ['No: its multiples never return to $\\mathcal O$.', 'いいえ。倍数が $\\mathcal O$ に戻ることはありません。']], v: torsion ? 0 : 1, fixed: true },
        hint: ['Nagell and Lutz: on a curve with integer $a$, $b$, every point of finite order has integer coordinates, and so do all its multiples.', 'ナゲル・ルッツの定理：$a$、$b$ が整数の曲線では、有限位数の点は整数座標をもち、その倍数もすべてそうです。'],
        sol: torsion
          ? [[`$2P = ${ptT(twoP)}$, and continuing, the multiples stay integral and reach $\\mathcal O$ at $${T.order}P$.`, `$2P = ${ptT(twoP)}$ で、続けると倍数は整数座標のまま $${T.order}P$ で $\\mathcal O$ に達します。`], [`So $P$ has order $${T.order}$.`, `したがって $P$ の位数は $${T.order}$ です。`]]
          : [[`Compute ${T.seq.length - 1 === 1 ? '$2P$' : 'the multiples'}: $${T.seq.slice(1).map((S, i) => `${i + 2}P = ${ptT(S)}`).join(',\\ ')}$.`, `倍数を計算します：$${T.seq.slice(1).map((S, i) => `${i + 2}P = ${ptT(S)}`).join(',\\ ')}$。`], ['A multiple has non-integer coordinates, so by Nagell and Lutz it is not a torsion point, and neither is $P$.', 'ある倍数が整数でない座標をもつので、ナゲル・ルッツの定理によりそれはねじれ点ではなく、$P$ もねじれ点ではありません。'], ['Its multiples are infinitely many distinct rational points, with denominators that grow without bound.', 'その倍数は互いに異なる無限個の有理点で、分母は限りなく大きくなります。']],
        set: a >= -3 && a <= 2 && b >= -2 && b <= 3 && inSet(p[0]) ? { a, b, px: p[0], ps: 0, op: 1 } : undefined,
      };
    },
  ];

  /* ---------- 2. curves over F_p ---------- */
  const PR = [7, 13, 23, 31, 47, 61, 83, 97];
  const md = (x, p) => ((x % p) + p) % p;
  const inv = (x, p) => { let a = md(x, p), b = p, u = 1, v = 0; while (b) { const q = Math.floor(a / b); [a, b] = [b, a - q * b]; [u, v] = [v, u - q * v]; } return md(u, p); };
  function addP(P1, P2, a, p) {
    if (!P1) return { S: P2 }; if (!P2) return { S: P1 };
    let lam, num, den;
    if (P1[0] === P2[0]) { if (md(P1[1] + P2[1], p) === 0) return { S: null }; num = md(3 * P1[0] * P1[0] + a, p); den = md(2 * P1[1], p); }
    else { num = md(P2[1] - P1[1], p); den = md(P2[0] - P1[0], p); }
    lam = md(num * inv(den, p), p);
    const x3 = md(lam * lam - P1[0] - P2[0], p);
    return { S: [x3, md(lam * (P1[0] - x3) - P1[1], p)], lam, num, den, di: inv(den, p) };
  }
  const singP = (a, b, p) => md(4 * a * a * a + 27 * b * b, p) === 0;
  function ptsP(a, b, p) { const out = []; for (let x = 0; x < p; x++) for (let y = 0; y < p; y++) if (md(y * y - (x * x * x + a * x + b), p) === 0) out.push([x, y]); return out; }
  function multiples(G, a, p) { const out = [G]; let R = G; for (let k = 2; k < 4 * p + 10; k++) { R = addP(R, G, a, p).S; if (!R) break; out.push(R); } return out; }
  const curveP = (a, b, p) => `y^2 = ${terms([[1, 'x^3'], [a, 'x'], [b, '']])}`;
  const over = (p) => `\\mathbb F_{${p}}`;
  const pickCurve = (r, p, minPts = 2) => { let a, b, pts; do { a = r.int(0, p - 1); b = r.int(0, p - 1); pts = singP(a, b, p) ? [] : ptsP(a, b, p); } while (pts.filter(([, y]) => y).length < minPts); return { a, b, pts }; };
  const setP = (p, a, b) => (PR.includes(p) ? { pk: PR.indexOf(p), a, b } : undefined);
  const addSol = (res, P1, P2, p, dbl) => [
    dbl ? [`$\\lambda = (3x^2 + a)/(2y) = ${res.num}\\cdot ${res.den}^{-1}$, and $${res.den}^{-1} \\equiv ${res.di} \\pmod{${p}}$, so $\\lambda \\equiv ${res.lam}$.`, `$\\lambda = (3x^2 + a)/(2y) = ${res.num}\\cdot ${res.den}^{-1}$ で、$${res.den}^{-1} \\equiv ${res.di} \\pmod{${p}}$ なので $\\lambda \\equiv ${res.lam}$ です。`]
      : [`$\\lambda = (${P2[1]} - ${P1[1]})/(${P2[0]} - ${P1[0]}) \\equiv ${res.num}\\cdot ${res.den}^{-1}$, and $${res.den}^{-1} \\equiv ${res.di} \\pmod{${p}}$, so $\\lambda \\equiv ${res.lam}$.`, `$\\lambda = (${P2[1]} - ${P1[1]})/(${P2[0]} - ${P1[0]}) \\equiv ${res.num}\\cdot ${res.den}^{-1}$ で、$${res.den}^{-1} \\equiv ${res.di} \\pmod{${p}}$ なので $\\lambda \\equiv ${res.lam}$ です。`],
    [`$x = \\lambda^2 - x_1 - x_2 \\equiv ${res.S[0]}$, $y = \\lambda(x_1 - x) - y_1 \\equiv ${res.S[1]} \\pmod{${p}}$.`, `$x = \\lambda^2 - x_1 - x_2 \\equiv ${res.S[0]}$、$y = \\lambda(x_1 - x) - y_1 \\equiv ${res.S[1]} \\pmod{${p}}$ です。`],
    ['The formulas are the real chord-and-tangent formulas, with division replaced by multiplication by an inverse mod $p$.', '式は実数の弦と接線の公式そのもので、割り算を $p$ を法とする逆元の掛け算に置き換えただけです。'],
  ];
  Q['curves-mod-p'] = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const p = r.pick([7, 13, 23]), { a, b, pts } = pickCurve(r, p), on = r.chance(0.5);
        let x, y;
        if (on) [x, y] = r.pick(pts); else { do { x = r.int(0, p - 1); y = r.int(0, p - 1); } while (md(y * y - (x * x * x + a * x + b), p) === 0); }
        const l = md(y * y, p), rr = md(x * x * x + a * x + b, p);
        return {
          q: [`Is $(${x}, ${y})$ a point of $${curveP(a, b, p)}$ over $${over(p)}$?`, `$(${x}, ${y})$ は $${over(p)}$ 上の曲線 $${curveP(a, b, p)}$ の点ですか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: on ? 0 : 1, fixed: true },
          hint: [`Reduce both $y^2$ and $x^3 + ax + b$ modulo $${p}$.`, `$y^2$ と $x^3 + ax + b$ をどちらも $${p}$ で割った余りにします。`],
          sol: [[`$y^2 = ${y * y} \\equiv ${l}$ and $x^3 + ${a}x + ${b} = ${x * x * x + a * x + b} \\equiv ${rr} \\pmod{${p}}$.`, `$y^2 = ${y * y} \\equiv ${l}$、$x^3 + ${a}x + ${b} = ${x * x * x + a * x + b} \\equiv ${rr} \\pmod{${p}}$ です。`], [on ? `Equal, so the point is on the curve; so is $(${x}, ${md(-y, p)})$, its reflection.` : 'Different, so it is not on the curve.', on ? `等しいので曲線上の点です。鏡像の $(${x}, ${md(-y, p)})$ も曲線上にあります。` : '異なるので、曲線上の点ではありません。']],
          set: setP(p, a, b),
        };
      }
      if (kind === 1) {
        const p = r.pick([7, 13, 23, 31, 47, 61, 83, 97, 101, 199, 1009]), s = Math.floor(2 * Math.sqrt(p)), hi = r.chance(0.5);
        return {
          q: [hi ? `What is the largest number of points (including $\\mathcal O$) an elliptic curve over $${over(p)}$ can have?` : `What is the smallest number of points (including $\\mathcal O$) an elliptic curve over $${over(p)}$ can have?`, hi ? `$${over(p)}$ 上の楕円曲線がもちうる点の個数（$\\mathcal O$ を含む）の最大値はいくつですか。` : `$${over(p)}$ 上の楕円曲線がもちうる点の個数（$\\mathcal O$ を含む）の最小値はいくつですか。`],
          a: { type: 'int', v: hi ? p + 1 + s : p + 1 - s },
          hint: ['Hasse: $|p + 1 - \\#E| \\le 2\\sqrt p$.', 'ハッセの定理：$|p + 1 - \\#E| \\le 2\\sqrt p$ です。'],
          sol: [[`$2\\sqrt{${p}} \\approx ${n(2 * Math.sqrt(p), 3)}$, so the trace satisfies $|t| \\le ${s}$.`, `$2\\sqrt{${p}} \\approx ${n(2 * Math.sqrt(p), 3)}$ なので、トレースは $|t| \\le ${s}$ を満たします。`], [`$\\#E = p + 1 - t$ ${hi ? 'is at most' : 'is at least'} $${p + 1} ${hi ? '+' : '-'} ${s} = ${hi ? p + 1 + s : p + 1 - s}$, and for a prime field every such value is attained by some curve.`, `$\\#E = p + 1 - t$ は${hi ? '最大で' : '最小で'} $${p + 1} ${hi ? '+' : '-'} ${s} = ${hi ? p + 1 + s : p + 1 - s}$ で、素体ではこの範囲のどの値もある曲線で実現されます。`]],
          set: PR.includes(p) ? { pk: PR.indexOf(p) } : undefined,
        };
      }
      const p = r.pick([7, 13, 23, 31]), sing = r.chance(0.4);
      let a, b; if (sing) { const k = r.int(1, p - 1); a = md(-3 * k * k, p); b = md(2 * k * k * k, p); } else { do { a = r.int(0, p - 1); b = r.int(0, p - 1); } while (singP(a, b, p)); }
      const v = md(4 * a * a * a + 27 * b * b, p);
      return {
        q: [`Is $${curveP(a, b, p)}$ over $${over(p)}$ an elliptic curve, that is, non-singular?`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ は楕円曲線（特異点をもたない曲線）ですか。`],
        a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: v ? 0 : 1, fixed: true },
        hint: ['Compute $4a^3 + 27b^2$ modulo $p$.', '$4a^3 + 27b^2$ を $p$ を法として計算します。'],
        sol: [[`$4\\cdot ${a}^3 + 27\\cdot ${b}^2 = ${4 * a * a * a + 27 * b * b} \\equiv ${v} \\pmod{${p}}$.`, `$4\\cdot ${a}^3 + 27\\cdot ${b}^2 = ${4 * a * a * a + 27 * b * b} \\equiv ${v} \\pmod{${p}}$ です。`], [v ? 'Non-zero, so the cubic has distinct roots and the curve is elliptic.' : 'Zero, so the cubic has a repeated root mod $p$: the curve has a node or cusp and the group law breaks down there.', v ? '0 でないので三次式の根は相異なり、曲線は楕円曲線です。' : '0 なので三次式は $p$ を法として重根をもちます。曲線には結節点か尖点があり、そこでは群の演算が成り立ちません。']],
        set: setP(p, a, b),
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const p = r.pick([7, 11, 13]), { a, b, pts } = pickCurve(r, p, 1);
        const sq = new Set(); for (let y = 1; y < p; y++) sq.add(y * y % p);
        const vals = Array.from({ length: p }, (_, x) => md(x * x * x + a * x + b, p));
        const nz = vals.filter((v) => sq.has(v)).length, z = vals.filter((v) => v === 0).length;
        return {
          q: [`How many points, including $\\mathcal O$, does $${curveP(a, b, p)}$ have over $${over(p)}$?`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ は、$\\mathcal O$ を含めていくつの点をもちますか。`],
          a: { type: 'int', v: pts.length + 1 },
          hint: ['List the non-zero squares mod $p$. Each $x$ with $f(x)$ a non-zero square gives two points, each root of $f$ gives one.', '$p$ を法とする 0 でない平方数を書き出します。$f(x)$ が 0 でない平方数となる $x$ は二点、$f$ の根は一点を与えます。'],
          sol: [[`Non-zero squares mod $${p}$: $\\{${[...sq].sort((u, w) => u - w).join(', ')}\\}$. Values of $f(x)$ for $x = 0, \\dots, ${p - 1}$: $${vals.join(', ')}$.`, `$${p}$ を法とする 0 でない平方数は $\\{${[...sq].sort((u, w) => u - w).join(', ')}\\}$ です。$x = 0, \\dots, ${p - 1}$ に対する $f(x)$ の値は $${vals.join(', ')}$ です。`], [`$${nz}$ values are non-zero squares and $${z}$ are zero: $2\\cdot ${nz} + ${z} + 1 = ${pts.length + 1}$ points.`, `0 でない平方数が $${nz}$ 個、0 が $${z}$ 個なので、$2\\cdot ${nz} + ${z} + 1 = ${pts.length + 1}$ 点です。`], [`Hasse's window for $p = ${p}$ is $${p + 1} \\pm ${n(2 * Math.sqrt(p), 2)}$, and the trace here is $${p + 1 - pts.length - 1}$.`, `$p = ${p}$ に対するハッセの範囲は $${p + 1} \\pm ${n(2 * Math.sqrt(p), 2)}$ で、ここでのトレースは $${p + 1 - pts.length - 1}$ です。`]],
          set: setP(p, a, b),
        };
      }
      const p = r.pick([13, 23, 31, 47]), dbl = kind === 2;
      let a, b, P1, P2, res;
      do {
        ({ a, b } = pickCurve(r, p));
        const pts = ptsP(a, b, p).filter(([, y]) => y);
        P1 = r.pick(pts); P2 = dbl ? P1 : r.pick(pts);
        res = (dbl || P1[0] !== P2[0]) ? addP(P1, P2, a, p) : { S: null };
      } while (!res.S);
      return {
        q: dbl ? [`On $${curveP(a, b, p)}$ over $${over(p)}$, compute $2P$ for $P = (${P1[0]}, ${P1[1]})$.`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ で、$P = (${P1[0]}, ${P1[1]})$ に対する $2P$ を求めてください。`] : [`On $${curveP(a, b, p)}$ over $${over(p)}$, add $P = (${P1[0]}, ${P1[1]})$ and $Q = (${P2[0]}, ${P2[1]})$.`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ で、$P = (${P1[0]}, ${P1[1]})$ と $Q = (${P2[0]}, ${P2[1]})$ を足してください。`],
        a: { type: 'tuple', v: res.S, labels: ['$x$', '$y$'], tol: 0 },
        hint: ['Same formulas as over the reals; divide by multiplying with an inverse mod $p$.', '実数のときと同じ公式です。割り算は $p$ を法とする逆元をかけて行います。'],
        sol: addSol(res, P1, P2, p, dbl),
        set: setP(p, a, b),
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 2) {
        const p = r.pick([31, 47, 61, 83, 97, 101, 127, 199]), s = 2 * Math.sqrt(p), ok = r.chance(0.5);
        const N = ok ? p + 1 + r.int(-Math.floor(s), Math.floor(s)) : p + 1 + r.sign() * (Math.floor(s) + r.int(1, 4));
        return {
          q: [`Can an elliptic curve over $${over(p)}$ have exactly $${N}$ points (counting $\\mathcal O$)?`, `$${over(p)}$ 上の楕円曲線が、$\\mathcal O$ を含めてちょうど $${N}$ 個の点をもつことはありますか。`],
          a: { type: 'choice', opts: [['Yes', 'はい'], ['No', 'いいえ']], v: ok ? 0 : 1, fixed: true },
          hint: ['Compare $|p + 1 - N|$ with $2\\sqrt p$.', '$|p + 1 - N|$ と $2\\sqrt p$ を比べてください。'],
          sol: [[`$|p + 1 - N| = |${p + 1} - ${N}| = ${Math.abs(p + 1 - N)}$ and $2\\sqrt{${p}} \\approx ${n(s, 3)}$.`, `$|p + 1 - N| = |${p + 1} - ${N}| = ${Math.abs(p + 1 - N)}$、$2\\sqrt{${p}} \\approx ${n(s, 3)}$ です。`], [ok ? 'Inside the Hasse bound, and over a prime field Deuring showed every trace in that range occurs, so such a curve exists.' : 'Outside the Hasse bound, so no curve over this field has that many points.', ok ? 'ハッセの限界の内側です。素体ではその範囲のどのトレースも実現されることをドイリングが示しているので、そのような曲線は存在します。' : 'ハッセの限界の外側なので、この体上でその個数の点をもつ曲線はありません。']],
          set: PR.includes(p) ? { pk: PR.indexOf(p) } : undefined,
        };
      }
      const p = r.pick([7, 13, 23]);
      let a, b, G, mult;
      do { ({ a, b } = pickCurve(r, p)); G = r.pick(ptsP(a, b, p).filter(([, y]) => y)); mult = multiples(G, a, p); } while (mult.length < (kind === 1 ? 5 : 3) || mult.length > 18);
      const ord = mult.length + 1, NE = ptsP(a, b, p).length + 1;
      const list = mult.map((M, i) => `${i + 1}G = (${M[0]}, ${M[1]})`);
      if (kind === 0) {
        return {
          q: [`On $${curveP(a, b, p)}$ over $${over(p)}$, find the order of $G = (${G[0]}, ${G[1]})$. The curve has $${NE}$ points.`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ で、$G = (${G[0]}, ${G[1]})$ の位数を求めてください。曲線は $${NE}$ 個の点をもちます。`],
          a: { type: 'int', v: ord },
          hint: [`By Lagrange the order divides $${NE}$; compute multiples until you hit $-G$.`, `ラグランジュの定理により位数は $${NE}$ を割り切ります。$-G$ に出会うまで倍数を計算します。`],
          sol: [[`$${list.slice(0, 6).join(',\\ ')}${list.length > 6 ? ',\\ \\dots' : ''}$.`, `$${list.slice(0, 6).join(',\\ ')}${list.length > 6 ? ',\\ \\dots' : ''}$ です。`], [`$${ord - 1}G = (${G[0]}, ${md(-G[1], p)}) = -G$, so $${ord}G = \\mathcal O$ and the order is $${ord}$, a divisor of $${NE}$.`, `$${ord - 1}G = (${G[0]}, ${md(-G[1], p)}) = -G$ なので $${ord}G = \\mathcal O$、位数は $${ord}$ で $${NE}$ の約数です。`], [ord === NE ? 'Here $G$ generates the whole group, which is therefore cyclic.' : `$G$ generates a subgroup of index $${NE / ord}$.`, ord === NE ? 'ここでは $G$ が群全体を生成するので、群は巡回群です。' : `$G$ は指数 $${NE / ord}$ の部分群を生成します。`]],
          set: setP(p, a, b),
        };
      }
      const k = r.int(3, ord - 2), Qp = mult[k - 1];
      return {
        q: [`On $${curveP(a, b, p)}$ over $${over(p)}$, with $G = (${G[0]}, ${G[1]})$, find the smallest $k \\ge 1$ with $kG = (${Qp[0]}, ${Qp[1]})$.`, `$${over(p)}$ 上の $${curveP(a, b, p)}$ で $G = (${G[0]}, ${G[1]})$ とします。$kG = (${Qp[0]}, ${Qp[1]})$ となる最小の $k \\ge 1$ を求めてください。`],
        a: { type: 'int', v: k },
        hint: ['There is no shortcut on a small curve: walk $G, 2G, 3G, \\dots$', '小さな曲線では近道はありません。$G, 2G, 3G, \\dots$ とたどります。'],
        sol: [[`$${list.slice(0, Math.min(list.length, k + 1)).join(',\\ ')}$.`, `$${list.slice(0, Math.min(list.length, k + 1)).join(',\\ ')}$ です。`], [`The target appears at $k = ${k}$.`, `目標の点は $k = ${k}$ で現れます。`], ['This is the elliptic-curve discrete logarithm. With a group of size near $2^{256}$, the walk is hopeless, which is what elliptic-curve cryptography relies on.', 'これが楕円曲線上の離散対数です。群の大きさが $2^{256}$ 程度になるとこの歩みは絶望的で、楕円曲線暗号はそれに依拠しています。']],
        set: setP(p, a, b),
      };
    },
  ];

  /* ---------- 3. the complex torus (t 0.7..2, u, v on Im z = 0 or t/2) ---------- */
  const jordan2 = (k) => { let r = k * k, m = k; for (let p = 2; p * p <= m; p++) if (m % p === 0) { while (m % p === 0) m /= p; r = r / (p * p) * (p * p - 1); } if (m > 1) r = r / (m * m) * (m * m - 1); return r; };
  const red = (x) => { let s = x - Math.round(x); if (s <= -0.5 + 1e-9) s += 1; return Math.round(s * 1000) / 1000; };
  Q['lattice-torus'] = [
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const k = r.int(2, 9), form = r.int(0, 1);
        return {
          q: form ? [`How many points $P$ of the complex elliptic curve satisfy $${k}P = \\mathcal O$ (including $\\mathcal O$)?`, `複素楕円曲線の点 $P$ で $${k}P = \\mathcal O$ を満たすものは（$\\mathcal O$ を含めて）いくつありますか。`] : [`How many points $z$ of the torus $\\mathbb C/\\Lambda$ satisfy $${k}z \\in \\Lambda$?`, `トーラス $\\mathbb C/\\Lambda$ の点 $z$ で $${k}z \\in \\Lambda$ を満たすものはいくつありますか。`],
          a: { type: 'int', v: k * k },
          hint: ['Write $z = s + t\\tau$ with real $s, t \\in [0, 1)$.', '$z = s + t\\tau$（$s, t \\in [0, 1)$ は実数）と書きます。'],
          sol: [[`$${k}z \\in \\Lambda$ means $${k}s$ and $${k}t$ are integers: $s, t \\in \\{0, \\tfrac1{${k}}, \\dots, \\tfrac{${k - 1}}{${k}}\\}$.`, `$${k}z \\in \\Lambda$ は $${k}s$ と $${k}t$ が整数であることなので、$s, t \\in \\{0, \\tfrac1{${k}}, \\dots, \\tfrac{${k - 1}}{${k}}\\}$ です。`], [`That is $${k}\\cdot ${k} = ${k * k}$ points, a grid on the period parallelogram${form ? ', and $z \\mapsto (\\wp(z), \\wp\'(z))$ carries them to the points of order dividing ' + k : ''}.`, `これは $${k}\\cdot ${k} = ${k * k}$ 個で、周期平行四辺形の上の格子をなします${form ? `。$z \\mapsto (\\wp(z), \\wp'(z))$ はこれらを位数が ${k} を割り切る点に写します` : ''}。`]],
        };
      }
      const t = r.step(0.7, 2, 0.01), ux = r.step(-0.45, 0.45, 0.005), vx = r.step(-0.45, 0.45, 0.005), ul = r.int(0, 1), vl = r.int(0, 1), sl = (ul + vl) % 2;
      if (kind === 1) {
        return {
          q: [`$u$ lies on the line ${ul ? '$\\operatorname{Im} z = t/2$' : '$\\operatorname{Im} z = 0$'} and $v$ on ${vl ? '$\\operatorname{Im} z = t/2$' : '$\\operatorname{Im} z = 0$'}. On which line of the torus does $u + v$ lie?`, `$u$ は直線 ${ul ? '$\\operatorname{Im} z = t/2$' : '$\\operatorname{Im} z = 0$'} 上に、$v$ は ${vl ? '$\\operatorname{Im} z = t/2$' : '$\\operatorname{Im} z = 0$'} 上にあります。$u + v$ はトーラスのどちらの直線上にありますか。`],
          a: { type: 'choice', opts: [['$\\operatorname{Im} z = 0$: its image is on the unbounded branch', '$\\operatorname{Im} z = 0$：像は非有界な枝の上'], ['$\\operatorname{Im} z = t/2$: its image is on the oval', '$\\operatorname{Im} z = t/2$：像は楕円形の閉曲線の上']], v: sl, fixed: true },
          hint: ['Add the imaginary parts and reduce modulo $t$.', '虚部を足して $t$ を法として考えます。'],
          sol: [[`$\\operatorname{Im}(u + v) = ${ul ? 't/2' : '0'} + ${vl ? 't/2' : '0'} = ${ul + vl === 2 ? 't \\equiv 0' : ul + vl === 1 ? 't/2' : '0'} \\pmod t$.`, `$\\operatorname{Im}(u + v) = ${ul ? 't/2' : '0'} + ${vl ? 't/2' : '0'} = ${ul + vl === 2 ? 't \\equiv 0' : ul + vl === 1 ? 't/2' : '0'} \\pmod t$ です。`], ['On the curve: two points of the oval, or two of the branch, add to a point of the branch; mixed pairs land on the oval. The branch is a subgroup and the oval its other coset.', '曲線の上では、楕円形の二点どうし、あるいは枝の二点どうしの和は枝の上に、混ざった組の和は楕円形の上に来ます。枝は部分群で、楕円形はもう一つの剰余類です。']],
          set: { t, ux, ul, vx, vl },
        };
      }
      const k = r.pick([2, 3, 4]);
      return {
        q: [`How many points of the complex elliptic curve have order exactly $2$${k > 2 ? `, and how many have order exactly $${k}$` : ''}?`, `複素楕円曲線で位数がちょうど $2$ の点はいくつありますか${k > 2 ? `。また、位数がちょうど $${k}$ の点はいくつありますか` : ''}。`],
        a: k > 2 ? { type: 'tuple', v: [3, jordan2(k)], labels: ['$2$', `$${k}$`], tol: 0 } : { type: 'int', v: 3 },
        hint: ['Count the solutions of $kz \\in \\Lambda$, then remove those of smaller order.', '$kz \\in \\Lambda$ の解を数え、それより小さい位数のものを除きます。'],
        sol: [['$2z \\in \\Lambda$ has $4$ solutions: $0, \\tfrac12, \\tfrac\\tau2, \\tfrac{1 + \\tau}2$. Removing $0$ leaves $3$, which map to $(e_1, 0), (e_2, 0), (e_3, 0)$: the roots of the cubic, where $\\wp\' = 0$.', '$2z \\in \\Lambda$ の解は $0, \\tfrac12, \\tfrac\\tau2, \\tfrac{1 + \\tau}2$ の $4$ 個です。$0$ を除いた $3$ 個は $(e_1, 0), (e_2, 0), (e_3, 0)$、つまり $\\wp\' = 0$ となる三次式の根に写ります。']].concat(k > 2 ? [[`$${k}z \\in \\Lambda$ has $${k * k}$ solutions; those of exact order $${k}$ number $${k}^2\\prod_{p \\mid ${k}}(1 - p^{-2}) = ${jordan2(k)}$.`, `$${k}z \\in \\Lambda$ の解は $${k * k}$ 個で、位数がちょうど $${k}$ のものは $${k}^2\\prod_{p \\mid ${k}}(1 - p^{-2}) = ${jordan2(k)}$ 個です。`]] : []),
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        let g2, g3, D; do { g2 = r.int(-6, 12); g3 = r.int(-6, 6); D = g2 ** 3 - 27 * g3 * g3; } while (D === 0);
        const j = 1728 * g2 ** 3 / D;
        return {
          q: [`For $y^2 = 4x^3 - g_2x - g_3$ with $g_2 = ${g2}$, $g_3 = ${g3}$, compute $\\Delta = g_2^3 - 27g_3^2$ and the $j$-invariant $j = 1728\\,g_2^3/\\Delta$.`, `$y^2 = 4x^3 - g_2x - g_3$、$g_2 = ${g2}$、$g_3 = ${g3}$ について、$\\Delta = g_2^3 - 27g_3^2$ と $j$ 不変量 $j = 1728\\,g_2^3/\\Delta$ を求めてください。`],
          a: { type: 'tuple', v: [D, j], labels: ['$\\Delta$', '$j$'], rel: 0.002 },
          hint: ['Compute $g_2^3$ once and use it twice.', '$g_2^3$ を一度計算して二回使います。'],
          sol: [[`$g_2^3 = ${g2 ** 3}$, $27g_3^2 = ${27 * g3 * g3}$, so $\\Delta = ${D}$.`, `$g_2^3 = ${g2 ** 3}$、$27g_3^2 = ${27 * g3 * g3}$ なので $\\Delta = ${D}$ です。`], [`$j = 1728\\cdot ${g2 ** 3}/${D < 0 ? `(${D})` : D} = ${n(j, 4)}$.`, `$j = 1728\\cdot ${g2 ** 3}/${D < 0 ? `(${D})` : D} = ${n(j, 4)}$ です。`], ['$\\Delta \\ne 0$ is exactly the condition for distinct roots, and $j$ classifies the curve up to isomorphism over $\\mathbb C$: two lattices give the same $j$ exactly when one is a rotated, scaled copy of the other.', '$\\Delta \\ne 0$ は根が相異なるための条件そのもので、$j$ は $\\mathbb C$ 上の同型を除いて曲線を分類します。二つの格子が同じ $j$ を与えるのは、一方が他方を回転・拡大したものであるときに限ります。']],
        };
      }
      if (kind === 1) {
        let e1, e2; do { e1 = r.int(-6, 6); e2 = r.int(-6, 6); } while (e1 === e2 || e1 === -2 * e2 || e2 === -2 * e1 || e1 === -e1 - e2 || e2 === -e1 - e2);
        const e3 = -e1 - e2, g2 = -4 * (e1 * e2 + e1 * e3 + e2 * e3), g3 = 4 * e1 * e2 * e3;
        return {
          q: [`The cubic $4x^3 - g_2x - g_3$ has roots $${e1}, ${e2}, ${e3}$. Find $g_2$ and $g_3$.`, `三次式 $4x^3 - g_2x - g_3$ の根は $${e1}, ${e2}, ${e3}$ です。$g_2$ と $g_3$ を求めてください。`],
          a: { type: 'tuple', v: [g2, g3], labels: ['$g_2$', '$g_3$'], tol: 0 },
          hint: ['$4x^3 - g_2x - g_3 = 4(x - e_1)(x - e_2)(x - e_3)$; compare coefficients.', '$4x^3 - g_2x - g_3 = 4(x - e_1)(x - e_2)(x - e_3)$ として係数を比べます。'],
          sol: [[`No $x^2$ term means $e_1 + e_2 + e_3 = 0$, which holds. The $x$ coefficient: $-g_2 = 4(e_1e_2 + e_1e_3 + e_2e_3) = 4\\cdot(${e1 * e2 + e1 * e3 + e2 * e3})$, so $g_2 = ${g2}$.`, `$x^2$ の項がないので $e_1 + e_2 + e_3 = 0$ で、確かに成り立っています。$x$ の係数から $-g_2 = 4(e_1e_2 + e_1e_3 + e_2e_3) = 4\\cdot(${e1 * e2 + e1 * e3 + e2 * e3})$、よって $g_2 = ${g2}$ です。`], [`The constant: $-g_3 = -4e_1e_2e_3$, so $g_3 = 4\\cdot(${e1 * e2 * e3}) = ${g3}$.`, `定数項から $-g_3 = -4e_1e_2e_3$、よって $g_3 = 4\\cdot(${e1 * e2 * e3}) = ${g3}$ です。`], ['On the torus the roots are the values of $\\wp$ at the three half-periods.', 'トーラスの上では、根は三つの半周期における $\\wp$ の値です。']],
        };
      }
      const t = r.step(0.7, 2, 0.01), ul = r.int(0, 1), vl = r.int(0, 1);
      let ux, vx, s; do { ux = r.step(-0.5, 0.5, 0.005); vx = r.step(-0.5, 0.5, 0.005); s = red(ux + vx); } while (Math.abs(Math.abs(ux + vx) - 0.5) < 0.01 || Math.abs(s) < 0.02);
      const w = red(-s), third = r.chance(0.5);
      return {
        q: third ? [`$u = ${n(ux)} ${ul ? '+ \\tfrac t2 i' : ''}$ and $v = ${n(vx)} ${vl ? '+ \\tfrac t2 i' : ''}$ on the torus $\\mathbb C/(\\mathbb Z + ti\\mathbb Z)$. The line through $P = (\\wp(u), \\wp'(u))$ and $Q$ meets the curve a third time at the image of $w$. Find $\\operatorname{Re} w$ in $[-\\tfrac12, \\tfrac12]$.`, `トーラス $\\mathbb C/(\\mathbb Z + ti\\mathbb Z)$ 上で $u = ${n(ux)} ${ul ? '+ \\tfrac t2 i' : ''}$、$v = ${n(vx)} ${vl ? '+ \\tfrac t2 i' : ''}$ とします。$P = (\\wp(u), \\wp'(u))$ と $Q$ を通る直線は、ある $w$ の像で曲線と三度目に交わります。$[-\\tfrac12, \\tfrac12]$ の範囲で $\\operatorname{Re} w$ を求めてください。`] : [`$u = ${n(ux)} ${ul ? '+ \\tfrac t2 i' : ''}$ and $v = ${n(vx)} ${vl ? '+ \\tfrac t2 i' : ''}$ on the torus $\\mathbb C/(\\mathbb Z + ti\\mathbb Z)$. Find $\\operatorname{Re}(u + v)$, reduced to $[-\\tfrac12, \\tfrac12]$.`, `トーラス $\\mathbb C/(\\mathbb Z + ti\\mathbb Z)$ 上で $u = ${n(ux)} ${ul ? '+ \\tfrac t2 i' : ''}$、$v = ${n(vx)} ${vl ? '+ \\tfrac t2 i' : ''}$ とします。$[-\\tfrac12, \\tfrac12]$ に還元した $\\operatorname{Re}(u + v)$ を求めてください。`],
        a: { type: 'num', v: third ? w : s, tol: 0.003 },
        hint: third ? ['Three points on a line add to $\\mathcal O$, so $u + v + w \\in \\Lambda$.', '一直線上の三点の和は $\\mathcal O$ なので、$u + v + w \\in \\Lambda$ です。'] : ['On the torus, addition is addition of complex numbers, then subtract the nearest lattice point.', 'トーラスの上の足し算は複素数の足し算で、そのあと最も近い格子点を引きます。'],
        sol: [[`$${n(ux)} + ${n(vx)} = ${n(ux + vx)}$, which reduces to $${n(s)}$ modulo $1$.`, `$${n(ux)} + ${n(vx)} = ${n(ux + vx)}$ で、$1$ を法として $${n(s)}$ に還元されます。`]].concat(third ? [[`$w \\equiv -(u + v)$, so $\\operatorname{Re} w = ${n(w)}$, on the same line as $u + v$ since $-t/2 \\equiv t/2$.`, `$w \\equiv -(u + v)$ なので $\\operatorname{Re} w = ${n(w)}$ です。$-t/2 \\equiv t/2$ なので、$u + v$ と同じ直線上にあります。`], ['Reflecting $w$\'s image in the $x$ axis gives $P + Q$: the reflection is $z \\mapsto -z$, because $\\wp$ is even and $\\wp\'$ odd.', '$w$ の像を $x$ 軸で折り返すと $P + Q$ になります。$\\wp$ は偶関数、$\\wp\'$ は奇関数なので、折り返しは $z \\mapsto -z$ にあたります。']] : [['Its image under $(\\wp, \\wp\')$ is exactly the point the chord construction gives for $P + Q$.', '$(\\wp, \\wp\')$ によるその像は、弦の作図が $P + Q$ として与える点そのものです。']]),
        set: { t, ux, ul, vx, vl },
      };
    },
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 0) {
        const g2 = r.pick([4, 8, 12, 20, 40, 60, 100, 140, 142]), g3 = r.pick([0, 7, 14, 28, 56, 84, 140, 228]);
        return {
          q: [`The Laurent expansion is $\\wp(z) = z^{-2} + c_2z^2 + c_4z^4 + \\cdots$. Find $c_2$ and $c_4$ when $g_2 = ${g2}$ and $g_3 = ${g3}$.`, `ローラン展開を $\\wp(z) = z^{-2} + c_2z^2 + c_4z^4 + \\cdots$ とします。$g_2 = ${g2}$、$g_3 = ${g3}$ のとき $c_2$ と $c_4$ を求めてください。`],
          a: { type: 'tuple', v: [g2 / 20, g3 / 28], labels: ['$c_2$', '$c_4$'], tol: 0.0005 },
          hint: ['Substitute the expansion into $\\wp\'^2 = 4\\wp^3 - g_2\\wp - g_3$ and match the $z^{-2}$ and constant terms.', '展開を $\\wp\'^2 = 4\\wp^3 - g_2\\wp - g_3$ に代入し、$z^{-2}$ の項と定数項を比べます。'],
          sol: [['$\\wp\'^2 = 4z^{-6} - 8c_2z^{-2} - 16c_4 + \\cdots$ and $4\\wp^3 = 4z^{-6} + 12c_2z^{-2} + 12c_4 + \\cdots$.', '$\\wp\'^2 = 4z^{-6} - 8c_2z^{-2} - 16c_4 + \\cdots$、$4\\wp^3 = 4z^{-6} + 12c_2z^{-2} + 12c_4 + \\cdots$ です。'], [`Matching $z^{-2}$: $-8c_2 = 12c_2 - g_2$, so $c_2 = g_2/20 = ${n(g2 / 20)}$. Constants: $-16c_4 = 12c_4 - g_3$, so $c_4 = g_3/28 = ${n(g3 / 28, 4)}$.`, `$z^{-2}$ の係数から $-8c_2 = 12c_2 - g_2$、よって $c_2 = g_2/20 = ${n(g2 / 20)}$ です。定数項から $-16c_4 = 12c_4 - g_3$、よって $c_4 = g_3/28 = ${n(g3 / 28, 4)}$ です。`], ['So $g_2 = 60G_4$ and $g_3 = 140G_6$, where $G_{2k} = \\sum_{\\omega \\ne 0}\\omega^{-2k}$ are the Eisenstein series of the lattice.', 'したがって $g_2 = 60G_4$、$g_3 = 140G_6$ で、$G_{2k} = \\sum_{\\omega \\ne 0}\\omega^{-2k}$ は格子のアイゼンシュタイン級数です。']],
        };
      }
      if (kind === 1) {
        const k = r.int(3, 12);
        return {
          q: [`How many points of the torus $\\mathbb C/\\Lambda$ have order exactly $${k}$?`, `トーラス $\\mathbb C/\\Lambda$ の点で、位数がちょうど $${k}$ のものはいくつありますか。`],
          a: { type: 'int', v: jordan2(k) },
          hint: [`The $${k}$-torsion is $(\\mathbb Z/${k})^2$. Remove the points whose order is a proper divisor of $${k}$.`, `$${k}$ ねじれ部分は $(\\mathbb Z/${k})^2$ です。位数が $${k}$ の真の約数である点を除きます。`],
          sol: [[`$${k}z \\in \\Lambda$ has $${k * k}$ solutions, forming $(\\mathbb Z/${k})^2$.`, `$${k}z \\in \\Lambda$ の解は $${k * k}$ 個で、$(\\mathbb Z/${k})^2$ をなします。`], [`By inclusion and exclusion over the primes dividing $${k}$, the elements of exact order $${k}$ number $${k}^2\\prod_{p \\mid ${k}}(1 - 1/p^2) = ${jordan2(k)}$.`, `$${k}$ を割り切る素数について包除原理を使うと、位数がちょうど $${k}$ の元は $${k}^2\\prod_{p \\mid ${k}}(1 - 1/p^2) = ${jordan2(k)}$ 個です。`], [`Each gives a point of exact order $${k}$ on the curve, and they are permuted by the Galois action that defines the $${k}$-division field.`, `それぞれが曲線上の位数ちょうど $${k}$ の点を与え、それらは $${k}$ 等分体を定めるガロア作用によって置換されます。`]],
        };
      }
      const lamb = r.pick([2, 3, 0.5, 1.5]), g2 = r.pick([8, 12, 40, 60, 140]), which = r.int(0, 1);
      const g3 = r.pick([14, 28, 56, 84]);
      const v = which ? g3 * lamb ** -6 : g2 * lamb ** -4;
      return {
        q: [`A lattice $\\Lambda$ has $g_2 = ${g2}$ and $g_3 = ${g3}$. What is ${which ? '$g_3$' : '$g_2$'} for the scaled lattice $${n(lamb)}\\Lambda$?`, `格子 $\\Lambda$ は $g_2 = ${g2}$、$g_3 = ${g3}$ をもちます。拡大した格子 $${n(lamb)}\\Lambda$ の ${which ? '$g_3$' : '$g_2$'} はいくつですか。`],
        a: { type: 'num', v, rel: 0.002 },
        hint: ['$g_2 = 60\\sum\\omega^{-4}$ and $g_3 = 140\\sum\\omega^{-6}$; scale every $\\omega$.', '$g_2 = 60\\sum\\omega^{-4}$、$g_3 = 140\\sum\\omega^{-6}$ です。すべての $\\omega$ を拡大します。'],
        sol: [[`Replacing $\\omega$ by $\\lambda\\omega$ multiplies $g_2$ by $\\lambda^{-4}$ and $g_3$ by $\\lambda^{-6}$.`, `$\\omega$ を $\\lambda\\omega$ に置き換えると、$g_2$ は $\\lambda^{-4}$ 倍、$g_3$ は $\\lambda^{-6}$ 倍になります。`], [which ? `$g_3 = ${g3}\\cdot ${n(lamb)}^{-6} = ${n(v, 5)}$.` : `$g_2 = ${g2}\\cdot ${n(lamb)}^{-4} = ${n(v, 5)}$.`, which ? `$g_3 = ${g3}\\cdot ${n(lamb)}^{-6} = ${n(v, 5)}$ です。` : `$g_2 = ${g2}\\cdot ${n(lamb)}^{-4} = ${n(v, 5)}$ です。`], ['Then $g_2^3$ and $g_3^2$ both scale by $\\lambda^{-12}$, so $j = 1728g_2^3/(g_2^3 - 27g_3^2)$ is unchanged: scaling the lattice does not change the curve up to isomorphism.', 'すると $g_2^3$ と $g_3^2$ はどちらも $\\lambda^{-12}$ 倍になるので、$j = 1728g_2^3/(g_2^3 - 27g_3^2)$ は変わりません。格子の拡大は、同型を除いて曲線を変えないのです。']],
      };
    },
  ];
})();
