'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n } = P.util;
  const PI = Math.PI, rad = (d) => d * PI / 180, deg = (r) => r * 180 / PI;

  /* ---------- quaternion arithmetic, [w, x, y, z] ---------- */
  const qmul = (a, b) => [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const conj = (q) => [q[0], -q[1], -q[2], -q[3]];
  const axisAngle = (u, th) => { const l = Math.hypot(...u), s = Math.sin(th / 2); return [Math.cos(th / 2), s * u[0] / l, s * u[1] / l, s * u[2] / l]; };
  const rotate = (q, v) => { const r = qmul(qmul(q, [0, ...v]), conj(q)); return [r[1], r[2], r[3]]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const clean = (x) => (Math.abs(x) < 1e-12 ? 0 : x);

  /* exact-looking TeX for the numbers these questions produce */
  function nice(x) {
    x = clean(x);
    const s = x < 0 ? '-' : '', a = Math.abs(x);
    const tries = [[1, ''], [2, '\\tfrac12'], [Math.SQRT2, '\\tfrac{\\sqrt2}{2}'], [Math.sqrt(3), '\\tfrac{\\sqrt3}{2}']];
    if (Math.abs(a - Math.round(a)) < 1e-9) return String(Math.round(x));
    if (Math.abs(a - 0.5) < 1e-9) return s + '\\tfrac12';
    if (Math.abs(a - Math.SQRT1_2) < 1e-9) return s + '\\tfrac{\\sqrt2}{2}';
    if (Math.abs(a - Math.sqrt(3) / 2) < 1e-9) return s + '\\tfrac{\\sqrt3}{2}';
    if (Math.abs(a - 1 / Math.sqrt(3)) < 1e-9) return s + '\\tfrac{1}{\\sqrt3}';
    void tries;
    return n(x, 4);
  }
  const UNITS = ['', '\\mathbf i', '\\mathbf j', '\\mathbf k'];
  function qTeX(q) {
    let out = '';
    q.forEach((c, i) => {
      c = clean(c); if (c === 0) return;
      const t = nice(c), neg = t.startsWith('-'), mag = neg ? t.slice(1) : t;
      const body = i === 0 ? mag : (mag === '1' ? UNITS[i] : mag + UNITS[i]);
      out += out ? (neg ? ' - ' : ' + ') + body : (neg ? '-' : '') + body;
    });
    return out || '0';
  }
  const vTeX = (v) => `(${v.map((x) => nice(x)).join(',\\ ')})`;
  const AX = [{ v: [1, 0, 0], t: '\\mathbf i', name: ['the $x$ axis', '$x$ 軸'], az: 0, el: 0 }, { v: [0, 1, 0], t: '\\mathbf j', name: ['the $y$ axis', '$y$ 軸'], az: 90, el: 0 }, { v: [0, 0, 1], t: '\\mathbf k', name: ['the $z$ axis', '$z$ 軸'], az: 0, el: 90 }];
  // azimuth and elevation (degrees) of a direction, if they are whole degrees
  const azel = (v) => { const l = Math.hypot(...v), az = deg(Math.atan2(v[1], v[0])), el = deg(Math.asin(v[2] / l)); return Math.abs(az - Math.round(az)) < 1e-6 && Math.abs(el - Math.round(el)) < 1e-6 ? [Math.round(az) === -180 ? 180 : Math.round(az), Math.round(el)] : null; };
  const vset = (v) => { const p = azel(v); return p ? { vaz: p[0], vel: p[1] } : {}; };

  /* ---------- 1. the sandwich ---------- */
  Q['quat-sandwich'] = [
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const ax = r.pick(AX), th = r.pick([60, 90, 120, 180, 240, 270, 300]);
        const w = Math.cos(rad(th / 2)), s = Math.sin(rad(th / 2));
        return {
          q: [`Write the unit quaternion that rotates by $${th}^\\circ$ about ${ax.name[0]} as $q = w + s\\,${ax.t}$. Find $w$ and $s$.`, `${ax.name[1]}のまわりに $${th}^\\circ$ 回転させる単位四元数を $q = w + s\\,${ax.t}$ と書きます。$w$ と $s$ を求めてください。`],
          a: { type: 'tuple', v: [w, s], labels: ['$w$', '$s$'], tol: 0.002 },
          hint: ['The quaternion carries half the angle: $q = \\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf n$.', '四元数には角度の半分が入ります。$q = \\cos\\tfrac\\theta2 + \\sin\\tfrac\\theta2\\,\\mathbf n$ です。'],
          sol: [[`Half the angle is $${th / 2}^\\circ$, so $w = \\cos ${th / 2}^\\circ = ${nice(w)}$ and $s = \\sin ${th / 2}^\\circ = ${nice(s)}$.`, `角度の半分は $${th / 2}^\\circ$ なので、$w = \\cos ${th / 2}^\\circ = ${nice(w)}$、$s = \\sin ${th / 2}^\\circ = ${nice(s)}$ です。`], [`So $q = ${qTeX([w, s * ax.v[0], s * ax.v[1], s * ax.v[2]])}$. ${th > 180 ? 'Past $180^\\circ$ the real part turns negative; $-q$ would describe the same rotation.' : 'The sandwich $q\\,v\\,q^*$ applies the half angle twice, which is why the full angle comes out.'}`, `よって $q = ${qTeX([w, s * ax.v[0], s * ax.v[1], s * ax.v[2]])}$ です。${th > 180 ? '$180^\\circ$ を超えると実部は負になります。$-q$ も同じ回転を表します。' : 'サンドイッチ $q\\,v\\,q^*$ は半分の角度を二回施すので、全体の角度が現れます。'}`]],
          set: { th, naz: ax.az, nel: ax.el },
        };
      }
      if (form === 1) {
        const a = r.int(1, 3), b = r.int(1, 3);
        const prod = qmul(UNITS.map((_, i) => (i === a ? 1 : 0)), UNITS.map((_, i) => (i === b ? 1 : 0)));
        const idx = prod.findIndex((x) => Math.abs(x) > 0.5), sg = prod[idx];
        const lab = (k, s) => (s < 0 ? '-' : '') + (k === 0 ? '1' : UNITS[k]);
        const opts = a === b ? [[-1, 0], [1, 0], [1, a], [-1, a]] : [[sg, idx], [-sg, idx], [-1, 0], [1, 0]];
        return {
          q: [`Compute the product $${UNITS[a]}${UNITS[b]}$.`, `積 $${UNITS[a]}${UNITS[b]}$ を計算してください。`],
          a: { type: 'choice', opts: opts.map(([s, k]) => [`$${lab(k, s)}$`, `$${lab(k, s)}$`]), v: 0 },
          hint: ['Hamilton\'s rules: $\\mathbf i^2 = \\mathbf j^2 = \\mathbf k^2 = \\mathbf{ijk} = -1$, so $\\mathbf{ij} = \\mathbf k$ and going against the cycle $\\mathbf i \\to \\mathbf j \\to \\mathbf k$ costs a sign.', 'ハミルトンの規則 $\\mathbf i^2 = \\mathbf j^2 = \\mathbf k^2 = \\mathbf{ijk} = -1$ から $\\mathbf{ij} = \\mathbf k$ で、巡回 $\\mathbf i \\to \\mathbf j \\to \\mathbf k$ に逆らうと符号が変わります。'],
          sol: [[a === b ? `Every unit squares to $-1$: $${UNITS[a]}^2 = -1$.` : `For pure quaternions $uv = -u\\cdot v + u\\times v$. Here $u\\cdot v = 0$ and $${UNITS[a]}\\times${UNITS[b]} = ${lab(idx, sg)}$.`, a === b ? `どの単位も二乗すると $-1$ です。$${UNITS[a]}^2 = -1$ です。` : `純粋四元数では $uv = -u\\cdot v + u\\times v$ です。ここで $u\\cdot v = 0$、$${UNITS[a]}\\times${UNITS[b]} = ${lab(idx, sg)}$ です。`], [a === b ? 'This is the rotation by $180^\\circ$ done twice, a full turn, which the quaternions record as $-1$.' : 'Reversing the order flips the sign: quaternion multiplication does not commute, just like rotations.', a === b ? 'これは $180^\\circ$ の回転を二回、つまり一回転で、四元数ではそれが $-1$ として記録されます。' : '順序を逆にすると符号が変わります。回転と同じく、四元数の積は可換ではありません。']],
        };
      }
      if (form === 2) {
        const w = r.pick([Math.sqrt(3) / 2, Math.SQRT1_2, 0.5, 0, -0.5, -Math.SQRT1_2, -Math.sqrt(3) / 2]);
        const ax = r.pick(AX), s = Math.sqrt(1 - w * w), th = 2 * deg(Math.acos(w));
        return {
          q: [`The unit quaternion $q = ${qTeX([w, s * ax.v[0], s * ax.v[1], s * ax.v[2]])}$ rotates space about ${ax.name[0]}. By what angle, measured anticlockwise about the positive axis, in degrees?`, `単位四元数 $q = ${qTeX([w, s * ax.v[0], s * ax.v[1], s * ax.v[2]])}$ は${ax.name[1]}のまわりに空間を回転させます。正の軸のまわりに反時計回りに測った角度は何度ですか。`],
          a: { type: 'num', v: th, tol: 0.5, unit: ['°', '°'] },
          hint: ['The real part is $\\cos\\tfrac\\theta2$.', '実部が $\\cos\\tfrac\\theta2$ です。'],
          sol: [[`$\\cos\\tfrac\\theta2 = ${nice(w)}$ with $\\sin\\tfrac\\theta2 = ${nice(s)} \\ge 0$, so $\\tfrac\\theta2 = ${n(th / 2)}^\\circ$.`, `$\\cos\\tfrac\\theta2 = ${nice(w)}$ で $\\sin\\tfrac\\theta2 = ${nice(s)} \\ge 0$ なので、$\\tfrac\\theta2 = ${n(th / 2)}^\\circ$ です。`], [`$\\theta = ${n(th)}^\\circ$.${th > 180 ? ` The same rotation is $${n(360 - th)}^\\circ$ the other way, and $-q$ writes it that way.` : ''}`, `$\\theta = ${n(th)}^\\circ$ です。${th > 180 ? `同じ回転を逆向きに $${n(360 - th)}^\\circ$ と見ることもでき、$-q$ がその書き方です。` : ''}`]],
          set: { th: Math.round(th), naz: ax.az, nel: ax.el },
        };
      }
      const th = r.pick([40, 60, 90, 120, 150]), ax = r.pick(AX);
      return {
        q: [`$q$ rotates by $${th}^\\circ$ about ${ax.name[0]}. What does $-q$ do to a vector $v$ through $v \\mapsto (-q)\\,v\\,(-q)^*$?`, `$q$ は${ax.name[1]}のまわりに $${th}^\\circ$ 回転させます。$v \\mapsto (-q)\\,v\\,(-q)^*$ によって $-q$ はベクトル $v$ に何をしますか。`],
        a: { type: 'choice', opts: [[`The same rotation by $${th}^\\circ$`, `同じ $${th}^\\circ$ の回転`], [`The rotation by $${th}^\\circ$ the other way`, `逆向きの $${th}^\\circ$ の回転`], [`It reverses $v$, then rotates by $${th}^\\circ$`, `$v$ を反転してから $${th}^\\circ$ 回転させる`], [`The rotation by $${360 - th}^\\circ$ the same way`, `同じ向きの $${360 - th}^\\circ$ の回転`]], v: 0 },
        hint: ['Pull the two minus signs out of the product.', '積から二つのマイナス符号をくくり出してください。'],
        sol: [['$(-q)\\,v\\,(-q)^* = (-1)(-1)\\,q\\,v\\,q^* = q\\,v\\,q^*$: the signs cancel.', '$(-q)\\,v\\,(-q)^* = (-1)(-1)\\,q\\,v\\,q^* = q\\,v\\,q^*$ で、符号は打ち消し合います。'], [`$-q = \\cos(\\tfrac{${th}^\\circ}{2} + 180^\\circ) + \\sin(\\tfrac{${th}^\\circ}{2} + 180^\\circ)\\,${ax.t}$ is the angle $${th}^\\circ + 360^\\circ$: the same rotation. Each rotation appears twice among unit quaternions.`, `$-q = \\cos(\\tfrac{${th}^\\circ}{2} + 180^\\circ) + \\sin(\\tfrac{${th}^\\circ}{2} + 180^\\circ)\\,${ax.t}$ は角度 $${th}^\\circ + 360^\\circ$ にあたり、同じ回転です。どの回転も単位四元数の中に二回現れます。`]],
        set: { th, naz: ax.az, nel: ax.el },
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        const ax = r.pick(AX), th = r.pick([90, 180, 270]);
        let v; do { v = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (Math.hypot(...v) < 1 || Math.abs(dot3(v, ax.v)) === Math.hypot(...v));
        const q = axisAngle(ax.v, rad(th)), vr = rotate(q, v).map((x) => Math.round(x * 1e9) / 1e9);
        return {
          q: [`Rotate $v = ${vTeX(v)}$ by $${th}^\\circ$ about ${ax.name[0]} using $q\\,v\\,q^*$. What is the image?`, `$v = ${vTeX(v)}$ を $q\\,v\\,q^*$ で${ax.name[1]}のまわりに $${th}^\\circ$ 回転させます。像を求めてください。`],
          a: { type: 'tuple', v: vr, labels: ['$x\'$', '$y\'$', '$z\'$'], tol: 0.01 },
          hint: ['Split $v$ into its part along the axis, which stays, and its part across, which turns by $\\theta$.', '$v$ を軸方向の成分（動かない）と、それに垂直な成分（$\\theta$ 回る）に分けてください。'],
          sol: [[`$q = ${qTeX(q)}$. The component along ${ax.name[0]} is $${n(dot3(v, ax.v))}$ and does not move.`, `$q = ${qTeX(q)}$ です。${ax.name[1]}方向の成分は $${n(dot3(v, ax.v))}$ で、動きません。`], [`The perpendicular part turns by $${th}^\\circ$ anticlockwise seen from the tip of the axis, giving $${vTeX(vr)}$.`, `垂直な成分は軸の先端から見て反時計回りに $${th}^\\circ$ 回り、$${vTeX(vr)}$ になります。`], [`The length is unchanged, $|v| = \\sqrt{${dot3(v, v)}}$, as it must be for a rotation.`, `長さは $|v| = \\sqrt{${dot3(v, v)}}$ のまま変わりません。回転なので当然です。`]],
          set: { th, naz: ax.az, nel: ax.el, ...vset(v) },
        };
      }
      if (form === 1) {
        const th = r.pick([120, 240]);
        let v; do { v = [r.int(-3, 3), r.int(-3, 3), r.int(-3, 3)]; } while (v[0] === v[1] && v[1] === v[2]);
        const q = axisAngle([1, 1, 1], rad(th)), vr = rotate(q, v).map((x) => Math.round(x * 1e9) / 1e9);
        return {
          q: [`$q = ${th === 120 ? '\\tfrac12(1 + \\mathbf i + \\mathbf j + \\mathbf k)' : '\\tfrac12(-1 + \\mathbf i + \\mathbf j + \\mathbf k)'}$. Compute $q\\,v\\,q^*$ for $v = ${vTeX(v)}$.`, `$q = ${th === 120 ? '\\tfrac12(1 + \\mathbf i + \\mathbf j + \\mathbf k)' : '\\tfrac12(-1 + \\mathbf i + \\mathbf j + \\mathbf k)'}$ のとき、$v = ${vTeX(v)}$ に対する $q\\,v\\,q^*$ を求めてください。`],
          a: { type: 'tuple', v: vr, labels: ['$x\'$', '$y\'$', '$z\'$'], tol: 0.01 },
          hint: ['Read off the axis and the angle first: $\\cos\\tfrac\\theta2$ is the real part.', 'まず軸と角度を読み取ります。実部が $\\cos\\tfrac\\theta2$ です。'],
          sol: [[`$\\cos\\tfrac\\theta2 = ${th === 120 ? '\\tfrac12' : '-\\tfrac12'}$ and the vector part points along $(1, 1, 1)$, so this is a turn by $${th}^\\circ$ about the main diagonal.`, `$\\cos\\tfrac\\theta2 = ${th === 120 ? '\\tfrac12' : '-\\tfrac12'}$ で、ベクトル部は $(1, 1, 1)$ 方向なので、主対角線のまわりの $${th}^\\circ$ 回転です。`], [`That turn carries the cube's axes into one another: ${th === 120 ? '$x \\to y \\to z \\to x$, so $(a, b, c) \\mapsto (c, a, b)$' : '$x \\to z \\to y \\to x$, so $(a, b, c) \\mapsto (b, c, a)$'}.`, `この回転は立方体の軸を互いに移します。${th === 120 ? '$x \\to y \\to z \\to x$ なので $(a, b, c) \\mapsto (c, a, b)$' : '$x \\to z \\to y \\to x$ なので $(a, b, c) \\mapsto (b, c, a)$'} です。`], [`So $q\\,v\\,q^* = ${vTeX(vr)}$: three such turns bring every vector back.`, `よって $q\\,v\\,q^* = ${vTeX(vr)}$ です。この回転を三回行うと、どのベクトルも元に戻ります。`]],
          set: { th, naz: 45, nel: 35, ...vset(v) },
        };
      }
      if (form === 2) {
        const a = [r.int(-2, 3), r.nz(-2, 2), r.int(-2, 2), r.int(-2, 2)], b = [r.int(-2, 3), r.int(-2, 2), r.nz(-2, 2), r.int(-2, 2)];
        const ab = qmul(a, b);
        return {
          q: [`Multiply $(${qTeX(a)})(${qTeX(b)})$. Give the components $(w, x, y, z)$ of the product $w + x\\mathbf i + y\\mathbf j + z\\mathbf k$.`, `$(${qTeX(a)})(${qTeX(b)})$ を計算し、積 $w + x\\mathbf i + y\\mathbf j + z\\mathbf k$ の成分 $(w, x, y, z)$ を答えてください。`],
          a: { type: 'tuple', v: ab, labels: ['$w$', '$x$', '$y$', '$z$'], tol: 1e-6 },
          hint: ['Write each as a scalar plus a vector: $(a, \\mathbf u)(b, \\mathbf v) = (ab - \\mathbf u\\cdot\\mathbf v,\\ a\\mathbf v + b\\mathbf u + \\mathbf u\\times\\mathbf v)$.', 'それぞれをスカラーとベクトルの和に書きます。$(a, \\mathbf u)(b, \\mathbf v) = (ab - \\mathbf u\\cdot\\mathbf v,\\ a\\mathbf v + b\\mathbf u + \\mathbf u\\times\\mathbf v)$ です。'],
          sol: [[`Scalars $${a[0]}$ and $${b[0]}$, vectors $\\mathbf u = (${a.slice(1).join(', ')})$ and $\\mathbf v = (${b.slice(1).join(', ')})$; $\\mathbf u\\cdot\\mathbf v = ${dot3(a.slice(1), b.slice(1))}$.`, `スカラーは $${a[0]}$ と $${b[0]}$、ベクトルは $\\mathbf u = (${a.slice(1).join(', ')})$ と $\\mathbf v = (${b.slice(1).join(', ')})$ で、$\\mathbf u\\cdot\\mathbf v = ${dot3(a.slice(1), b.slice(1))}$ です。`], [`$\\mathbf u\\times\\mathbf v = (${[a[2] * b[3] - a[3] * b[2], a[3] * b[1] - a[1] * b[3], a[1] * b[2] - a[2] * b[1]].join(', ')})$, so the product is $${qTeX(ab)}$.`, `$\\mathbf u\\times\\mathbf v = (${[a[2] * b[3] - a[3] * b[2], a[3] * b[1] - a[1] * b[3], a[1] * b[2] - a[2] * b[1]].join(', ')})$ なので、積は $${qTeX(ab)}$ です。`], ['The cross product term is what changes sign if the factors are swapped: that is the non-commutativity.', '因子を入れ替えると符号が変わるのは外積の項です。これが非可換性の正体です。']],
        };
      }
      const ax = r.pick(AX), th = r.pick([60, 90, 120, 180, 240, 300]);
      let v; do { v = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; } while (dot3(v, ax.v) === 0);
      const q = axisAngle(ax.v, rad(th)), re = -Math.sin(rad(th / 2)) * dot3(ax.v, v);
      return {
        q: [`$q$ rotates by $${th}^\\circ$ about ${ax.name[0]}, and $v = ${vTeX(v)}$. What is the real part of the one-sided product $q\\,v$? Give three decimals.`, `$q$ は${ax.name[1]}のまわりに $${th}^\\circ$ 回転させ、$v = ${vTeX(v)}$ です。片側だけの積 $q\\,v$ の実部を小数第3位まで求めてください。`],
        a: { type: 'num', v: re, tol: 0.002 },
        hint: ['For $q = (c, s\\mathbf n)$ and pure $v$, the real part of $qv$ is $-s\\,\\mathbf n\\cdot v$.', '$q = (c, s\\mathbf n)$ と純粋な $v$ に対し、$qv$ の実部は $-s\\,\\mathbf n\\cdot v$ です。'],
        sol: [[`$q = ${qTeX(q)}$, so $s = \\sin ${th / 2}^\\circ = ${nice(Math.sin(rad(th / 2)))}$ and $\\mathbf n\\cdot v = ${dot3(ax.v, v)}$.`, `$q = ${qTeX(q)}$ なので $s = \\sin ${th / 2}^\\circ = ${nice(Math.sin(rad(th / 2)))}$、$\\mathbf n\\cdot v = ${dot3(ax.v, v)}$ です。`], [`Real part $= -${nice(Math.sin(rad(th / 2)))}\\cdot(${dot3(ax.v, v)}) = ${n(re, 4)}$.`, `実部 $= -${nice(Math.sin(rad(th / 2)))}\\cdot(${dot3(ax.v, v)}) = ${n(re, 4)}$ です。`], ['Not zero, so $qv$ is not a 3D vector at all. Multiplying by $q^*$ on the right cancels this real part; the panel of the parallel part shows it tipping out and back.', '0 ではないので、$qv$ はもはや三次元ベクトルではありません。右から $q^*$ を掛けるとこの実部が打ち消されます。平行成分のパネルで、それが傾いて戻る様子が見えます。']],
        set: { th, naz: ax.az, nel: ax.el, ...vset(v) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let i1, i2, t1, t2, q;
        do { i1 = r.int(0, 2); i2 = (i1 + r.int(1, 2)) % 3; t1 = r.pick([90, 180, -90]); t2 = r.pick([90, 180, -90]); q = qmul(axisAngle(AX[i2].v, rad(t2)), axisAngle(AX[i1].v, rad(t1))); } while (Math.abs(Math.abs(q[0]) - 1) < 1e-9);
        if (q[0] < 0) q = q.map((x) => -x);
        const ang = 2 * deg(Math.acos(Math.min(1, q[0]))), s = Math.sqrt(Math.max(0, 1 - q[0] * q[0])), axis = q.slice(1).map((x) => x / s);
        const p = azel(axis), tn = (t) => `${t}^\\circ`;
        return {
          q: [`First rotate by $${tn(t1)}$ about ${AX[i1].name[0]}, then by $${tn(t2)}$ about ${AX[i2].name[0]}. The result is one rotation. Through what angle $\\theta \\in [0^\\circ, 180^\\circ]$?`, `まず${AX[i1].name[1]}のまわりに $${tn(t1)}$、次に${AX[i2].name[1]}のまわりに $${tn(t2)}$ 回転させます。結果は一つの回転です。その角度 $\\theta \\in [0^\\circ, 180^\\circ]$ を求めてください。`],
          a: { type: 'num', v: ang, tol: 0.3, unit: ['°', '°'] },
          hint: ['Multiply the quaternions, the second one on the left, and read $\\cos\\tfrac\\theta2$ from the real part.', '二つ目を左にして四元数を掛け、実部から $\\cos\\tfrac\\theta2$ を読み取ります。'],
          sol: [[`$q_1 = ${qTeX(axisAngle(AX[i1].v, rad(t1)))}$, $q_2 = ${qTeX(axisAngle(AX[i2].v, rad(t2)))}$, and $q_2 q_1 = ${qTeX(q)}$ (up to sign).`, `$q_1 = ${qTeX(axisAngle(AX[i1].v, rad(t1)))}$、$q_2 = ${qTeX(axisAngle(AX[i2].v, rad(t2)))}$ で、$q_2 q_1 = ${qTeX(q)}$（符号を除いて）です。`], [`$\\cos\\tfrac\\theta2 = ${nice(q[0])}$ gives $\\theta = ${n(ang, 2)}^\\circ$, about the axis $${vTeX(axis)}$.`, `$\\cos\\tfrac\\theta2 = ${nice(q[0])}$ から $\\theta = ${n(ang, 2)}^\\circ$ で、軸は $${vTeX(axis)}$ です。`], ['Turns about two different axes compose to a turn about a third, slanted axis: the quaternion product does this bookkeeping in one line.', '異なる軸のまわりの回転を合成すると、斜めの第三の軸のまわりの回転になります。四元数の積はこの計算を一行で済ませます。']],
          set: p ? { th: Math.round(ang), naz: p[0], nel: p[1] } : { th: Math.round(ang) },
        };
      }
      if (form === 1) {
        // a rotation matrix that permutes and signs the axes
        let M, tr;
        do {
          const perm = r.shuffle([0, 1, 2]), sg = [r.sign(), r.sign(), r.sign()];
          M = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (perm[i] === j ? sg[i] : 0)));
          const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
          if (det < 0) M[2] = M[2].map((x) => -x);
          tr = M[0][0] + M[1][1] + M[2][2];
        } while (tr === 3);
        const th = deg(Math.acos((tr - 1) / 2)), w = Math.sqrt(1 + tr) / 2;
        const mt = `\\begin{pmatrix}${M.map((row) => row.join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
        if (r.chance(0.5)) return {
          q: [`The rotation matrix $${mt}$ is a rotation by some angle $\\theta \\in [0^\\circ, 180^\\circ]$. Find $\\theta$.`, `回転行列 $${mt}$ はある角度 $\\theta \\in [0^\\circ, 180^\\circ]$ の回転です。$\\theta$ を求めてください。`],
          a: { type: 'num', v: th, tol: 0.3, unit: ['°', '°'] },
          hint: ['The trace of a rotation by $\\theta$ is $1 + 2\\cos\\theta$, in any basis.', '角度 $\\theta$ の回転のトレースは、どの基底でも $1 + 2\\cos\\theta$ です。'],
          sol: [[`The trace is $${tr}$, so $\\cos\\theta = (${tr} - 1)/2 = ${nice((tr - 1) / 2)}$.`, `トレースは $${tr}$ なので $\\cos\\theta = (${tr} - 1)/2 = ${nice((tr - 1) / 2)}$ です。`], [`$\\theta = ${n(th)}^\\circ$. In quaternion terms $|w| = \\tfrac12\\sqrt{1 + \\operatorname{tr}} = ${nice(w)}$, the same angle.`, `$\\theta = ${n(th)}^\\circ$ です。四元数でいえば $|w| = \\tfrac12\\sqrt{1 + \\operatorname{tr}} = ${nice(w)}$ で、同じ角度になります。`]],
        };
        return {
          q: [`Extract the real part $w \\ge 0$ of the unit quaternion of the rotation matrix $${mt}$.`, `回転行列 $${mt}$ を表す単位四元数の実部 $w \\ge 0$ を求めてください。`],
          a: { type: 'num', v: w, tol: 0.002, show: nice(w) },
          hint: ['The diagonal of the matrix sums to $4w^2 - 1$.', '行列の対角成分の和は $4w^2 - 1$ です。'],
          sol: [[`From the Euler-Rodrigues matrix, $\\operatorname{tr} R = 3 - 4(x^2 + y^2 + z^2) = 4w^2 - 1$.`, `オイラー・ロドリゲスの行列から $\\operatorname{tr} R = 3 - 4(x^2 + y^2 + z^2) = 4w^2 - 1$ です。`], [`Here $\\operatorname{tr} R = ${tr}$, so $w = \\tfrac12\\sqrt{${tr + 1}} = ${nice(w)}$${w < 1e-9 ? ': a half turn, where $w$ vanishes and the trace method cannot find the axis; the largest diagonal entry must be used instead (Shepperd\'s method)' : ''}.`, `ここでは $\\operatorname{tr} R = ${tr}$ なので $w = \\tfrac12\\sqrt{${tr + 1}} = ${nice(w)}$ です。${w < 1e-9 ? '半回転では $w$ が 0 になり、トレースからは軸が求まりません。対角成分の最大のものを使う必要があります（シェパードの方法）。' : ''}`], [`That is the angle $\\theta = 2\\arccos w = ${n(2 * deg(Math.acos(w)))}^\\circ$.`, `これは角度 $\\theta = 2\\arccos w = ${n(2 * deg(Math.acos(w)))}^\\circ$ にあたります。`]],
        };
      }
      const k = r.int(0, 2), ax = AX[k], vv = AX[(k + 1) % 3], w3 = AX[(k + 2) % 3], sub = r.int(0, 2);
      const lhs = sub === 0 ? `$${vv.t}$-component` : sub === 1 ? `$${w3.t}$-component` : 'real part';
      const ans = sub === 0 ? 'cos(2t)' : sub === 1 ? 'sin(2t)' : '0';
      if (sub === 2) {
        return {
          q: [`Let $q = \\cos t + \\sin t\\,${ax.t}$. Write the real part of the one-sided product $q\\,${ax.t}$ as a function of $t$.`, `$q = \\cos t + \\sin t\\,${ax.t}$ とします。片側だけの積 $q\\,${ax.t}$ の実部を $t$ の式で表してください。`],
          a: { type: 'expr', v: '-sin(t)', vars: ['t'], dom: { t: [0.2, 3] }, lhs: ['$\\operatorname{Re}(q\\,' + ax.t + ') =$', '$\\operatorname{Re}(q\\,' + ax.t + ') =$'] },
          hint: [`$${ax.t}^2 = -1$.`, `$${ax.t}^2 = -1$ です。`],
          sol: [[`$q\\,${ax.t} = \\cos t\\,${ax.t} + \\sin t\\,${ax.t}^2 = -\\sin t + \\cos t\\,${ax.t}$.`, `$q\\,${ax.t} = \\cos t\\,${ax.t} + \\sin t\\,${ax.t}^2 = -\\sin t + \\cos t\\,${ax.t}$ です。`], ['The vector along the axis is tipped into the real direction by the angle $t$; the right factor $q^*$ tips it back, so the axis is left fixed.', '軸方向のベクトルは角度 $t$ だけ実数方向へ傾きます。右の因子 $q^*$ がそれを戻すので、軸は固定されたままです。']],
        };
      }
      return {
        q: [`Let $q = \\cos t + \\sin t\\,${ax.t}$. Write the ${lhs} of $q\\,${vv.t}\\,q^*$ as a function of $t$.`, `$q = \\cos t + \\sin t\\,${ax.t}$ とします。$q\\,${vv.t}\\,q^*$ の${sub === 0 ? `$${vv.t}$ 成分` : `$${w3.t}$ 成分`}を $t$ の式で表してください。`],
        a: { type: 'expr', v: ans, vars: ['t'], dom: { t: [0.2, 3] }, lhs: [`$${sub === 0 ? vv.t : w3.t}\\text{-component} =$`, `$${sub === 0 ? vv.t : w3.t}\\text{ 成分} =$`] },
        hint: [`$${ax.t}${vv.t} = ${w3.t}$ and $${vv.t}${ax.t} = -${w3.t}$. Multiply out, or recall which angle $q$ rotates by.`, `$${ax.t}${vv.t} = ${w3.t}$、$${vv.t}${ax.t} = -${w3.t}$ です。展開するか、$q$ が何度回転させるかを思い出してください。`],
        sol: [[`$q\\,${vv.t} = \\cos t\\,${vv.t} + \\sin t\\,${w3.t}$, already turned by $t$.`, `$q\\,${vv.t} = \\cos t\\,${vv.t} + \\sin t\\,${w3.t}$ で、すでに $t$ 回っています。`], [`Multiplying by $q^* = \\cos t - \\sin t\\,${ax.t}$ on the right turns it by $t$ again: $q\\,${vv.t}\\,q^* = \\cos 2t\\,${vv.t} + \\sin 2t\\,${w3.t}$.`, `右から $q^* = \\cos t - \\sin t\\,${ax.t}$ を掛けるとさらに $t$ 回ります。$q\\,${vv.t}\\,q^* = \\cos 2t\\,${vv.t} + \\sin 2t\\,${w3.t}$ です。`], ['So $q = \\cos t + \\sin t\\,\\mathbf n$ rotates by $2t$: the angle in the quaternion is half the angle of the rotation.', 'つまり $q = \\cos t + \\sin t\\,\\mathbf n$ は $2t$ だけ回転させます。四元数の中の角度は回転角の半分です。']],
      };
    },
  ];

  /* ---------- 2. slerp ---------- */
  const slerpW = (phi, t) => [Math.sin((1 - t) * phi) / Math.sin(phi), Math.sin(t * phi) / Math.sin(phi)];
  Q.slerp = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const d = r.pick([[Math.sqrt(3) / 2, 60], [Math.SQRT1_2, 90], [0.5, 120], [0, 180], [Math.cos(rad(20)), 40], [Math.cos(rad(75)), 150]]);
        return {
          q: [`Two unit quaternions have dot product $q_A\\cdot q_B = ${nice(d[0])}$. Through what angle $\\Omega$ must the body turn to get from orientation $A$ to orientation $B$?`, `二つの単位四元数の内積が $q_A\\cdot q_B = ${nice(d[0])}$ です。姿勢 $A$ から姿勢 $B$ へ移るのに物体は何度 $\\Omega$ 回らなければなりませんか。`],
          a: { type: 'num', v: d[1], tol: 0.3, unit: ['°', '°'] },
          hint: ['The angle on the 3-sphere is half the rotation angle.', '3 次元球面上の角度は回転角の半分です。'],
          sol: [[`$\\cos\\varphi = ${nice(d[0])}$ gives $\\varphi = ${d[1] / 2}^\\circ$ on the 3-sphere.`, `$\\cos\\varphi = ${nice(d[0])}$ より、3 次元球面上で $\\varphi = ${d[1] / 2}^\\circ$ です。`], [`The rotation angle is twice that: $\\Omega = 2\\varphi = ${d[1]}^\\circ$, and slerp turns through it at a constant rate.`, `回転角はその 2 倍で $\\Omega = 2\\varphi = ${d[1]}^\\circ$ です。slerp はこれを一定の速さで回ります。`]],
          set: { om: d[1], path: 0 },
        };
      }
      if (form === 1) {
        const om = r.pick([30, 60, 90, 100, 120, 150, 170]);
        return {
          q: [`Orientations $A$ and $B$ differ by a rotation of $\\Omega = ${om}^\\circ$, and $q_A\\cdot q_B \\ge 0$. What is $q_A\\cdot q_B$? Give three decimals.`, `姿勢 $A$ と $B$ は $\\Omega = ${om}^\\circ$ の回転だけ異なり、$q_A\\cdot q_B \\ge 0$ です。$q_A\\cdot q_B$ を小数第3位まで求めてください。`],
          a: { type: 'num', v: Math.cos(rad(om / 2)), tol: 0.002 },
          hint: ['The rotation from $A$ to $B$ is $q_B q_A^*$, whose real part equals $q_A\\cdot q_B$.', '$A$ から $B$ への回転は $q_B q_A^*$ で、その実部が $q_A\\cdot q_B$ に等しくなります。'],
          sol: [[`$q_B q_A^*$ rotates by $\\Omega$, so its real part is $\\cos\\tfrac\\Omega2$; that real part is exactly $q_A\\cdot q_B$.`, `$q_B q_A^*$ は $\\Omega$ の回転なので実部は $\\cos\\tfrac\\Omega2$ で、それがちょうど $q_A\\cdot q_B$ です。`], [`$q_A\\cdot q_B = \\cos ${om / 2}^\\circ = ${n(Math.cos(rad(om / 2)), 4)}$.`, `$q_A\\cdot q_B = \\cos ${om / 2}^\\circ = ${n(Math.cos(rad(om / 2)), 4)}$ です。`]],
          set: { om, path: 0 },
        };
      }
      const om = r.pick([40, 80, 120, 160]);
      return {
        q: [`An animation system finds $q_A\\cdot q_B = ${n(-Math.cos(rad(om / 2)), 3)} < 0$ for two keyframes. What should it do before interpolating?`, `アニメーションのシステムが二つのキーフレームで $q_A\\cdot q_B = ${n(-Math.cos(rad(om / 2)), 3)} < 0$ を得ました。補間の前に何をすべきですか。`],
        a: { type: 'choice', opts: [['Replace $q_B$ by $-q_B$', '$q_B$ を $-q_B$ に置き換える'], ['Replace $q_B$ by its conjugate $q_B^*$', '$q_B$ を共役 $q_B^*$ に置き換える'], ['Negate both $q_A$ and $q_B$', '$q_A$ と $q_B$ の両方の符号を反転する'], ['Nothing: the dot product does not affect the motion', '何もしない（内積は動きに影響しない）']], v: 0 },
        hint: ['$q$ and $-q$ are the same orientation. Which one is closer to $q_A$ on the 3-sphere?', '$q$ と $-q$ は同じ姿勢です。3 次元球面上で $q_A$ に近いのはどちらでしょうか。'],
        sol: [['$-q_B$ is the same orientation as $q_B$, and $q_A\\cdot(-q_B) > 0$, so the arc to it is the short one.', '$-q_B$ は $q_B$ と同じ姿勢で、$q_A\\cdot(-q_B) > 0$ なので、そこへの弧が短い方です。'], [`Left alone, the interpolation turns through $360^\\circ - ${om}^\\circ = ${360 - om}^\\circ$ instead of $${om}^\\circ$. The conjugate is a different (inverse) rotation, and negating both changes nothing.`, `そのままでは $${om}^\\circ$ ではなく $360^\\circ - ${om}^\\circ = ${360 - om}^\\circ$ 回ってしまいます。共役は別の（逆の）回転で、両方を反転しても何も変わりません。`]],
        set: { om, path: 1 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const om = r.pick([60, 90, 120, 180]), t = r.pick([0.25, 0.5, 0.75, 1 / 3]), ax = r.pick(AX);
        const w = Math.cos(rad(om * t / 2)), s = Math.sin(rad(om * t / 2));
        return {
          q: [`Slerp from $q_A = 1$ to the rotation by $${om}^\\circ$ about ${ax.name[0]}. At $t = ${t === 1 / 3 ? '\\tfrac13' : n(t)}$, the result is $w + s\\,${ax.t}$. Find $w$ and $s$.`, `$q_A = 1$ から${ax.name[1]}のまわりの $${om}^\\circ$ 回転へ slerp します。$t = ${t === 1 / 3 ? '\\tfrac13' : n(t)}$ での結果を $w + s\\,${ax.t}$ とするとき、$w$ と $s$ を求めてください。`],
          a: { type: 'tuple', v: [w, s], labels: ['$w$', '$s$'], tol: 0.002 },
          hint: ['Slerp from 1 moves along the great circle $\\cos\\alpha + \\sin\\alpha\\,\\mathbf n$ at a constant rate.', '1 からの slerp は大円 $\\cos\\alpha + \\sin\\alpha\\,\\mathbf n$ に沿って一定の速さで進みます。'],
          sol: [[`$q_B = \\cos ${om / 2}^\\circ + \\sin ${om / 2}^\\circ\\,${ax.t}$, so $\\varphi = ${om / 2}^\\circ$ and slerp gives $\\cos(t\\varphi) + \\sin(t\\varphi)\\,${ax.t}$.`, `$q_B = \\cos ${om / 2}^\\circ + \\sin ${om / 2}^\\circ\\,${ax.t}$ なので $\\varphi = ${om / 2}^\\circ$ で、slerp は $\\cos(t\\varphi) + \\sin(t\\varphi)\\,${ax.t}$ を与えます。`], [`$t\\varphi = ${n(om * t / 2, 3)}^\\circ$: $w = ${n(w, 4)}$, $s = ${n(s, 4)}$.`, `$t\\varphi = ${n(om * t / 2, 3)}^\\circ$ より $w = ${n(w, 4)}$、$s = ${n(s, 4)}$ です。`], [`The body has turned through $t\\Omega = ${n(om * t, 3)}^\\circ$: the fraction $t$ of the whole turn, exactly.`, `物体は $t\\Omega = ${n(om * t, 3)}^\\circ$ 回っています。全体の回転のちょうど $t$ の割合です。`]],
          set: { om, path: 0 },
        };
      }
      if (form === 1) {
        const om = r.pick([60, 90, 120, 150, 180]), t = r.pick([0.2, 0.25, 0.3, 0.4, 0.6, 0.75]), phi = rad(om / 2);
        const [a, b] = slerpW(phi, t);
        return {
          q: [`$A$ and $B$ are $\\Omega = ${om}^\\circ$ apart. Slerp writes $q(t) = a\\,q_A + b\\,q_B$. Find the weights $a$ and $b$ at $t = ${n(t)}$.`, `$A$ と $B$ は $\\Omega = ${om}^\\circ$ 離れています。slerp は $q(t) = a\\,q_A + b\\,q_B$ と書けます。$t = ${n(t)}$ での重み $a$ と $b$ を求めてください。`],
          a: { type: 'tuple', v: [a, b], labels: ['$a$', '$b$'], tol: 0.002 },
          hint: ['The weights are $\\sin((1-t)\\varphi)/\\sin\\varphi$ and $\\sin(t\\varphi)/\\sin\\varphi$, with $\\varphi = \\Omega/2$.', '重みは $\\sin((1-t)\\varphi)/\\sin\\varphi$ と $\\sin(t\\varphi)/\\sin\\varphi$ で、$\\varphi = \\Omega/2$ です。'],
          sol: [[`$\\varphi = ${om / 2}^\\circ$, $\\sin\\varphi = ${n(Math.sin(phi), 4)}$.`, `$\\varphi = ${om / 2}^\\circ$、$\\sin\\varphi = ${n(Math.sin(phi), 4)}$ です。`], [`$a = \\sin ${n((1 - t) * om / 2, 3)}^\\circ / ${n(Math.sin(phi), 4)} = ${n(a, 4)}$ and $b = \\sin ${n(t * om / 2, 3)}^\\circ / ${n(Math.sin(phi), 4)} = ${n(b, 4)}$.`, `$a = \\sin ${n((1 - t) * om / 2, 3)}^\\circ / ${n(Math.sin(phi), 4)} = ${n(a, 4)}$、$b = \\sin ${n(t * om / 2, 3)}^\\circ / ${n(Math.sin(phi), 4)} = ${n(b, 4)}$ です。`], [`$a + b = ${n(a + b, 4)} > 1$: the plain average $(1-t)q_A + tq_B$ would cut the chord inside the sphere, and slerp stays on it.`, `$a + b = ${n(a + b, 4)} > 1$ です。単なる平均 $(1-t)q_A + tq_B$ は球の内側の弦を通りますが、slerp は球面上にとどまります。`]],
          set: { om, path: 0 },
        };
      }
      const om = r.pick([60, 90, 120, 150, 170, 180]), phi = rad(om / 2), ratio = 2 * Math.tan(phi / 2) / phi;
      return {
        q: [`Normalised lerp between orientations $\\Omega = ${om}^\\circ$ apart (short way). At $t = \\tfrac12$, how many times faster than its average does it turn?`, `$\\Omega = ${om}^\\circ$ 離れた姿勢の間の正規化線形補間（近い方）で、$t = \\tfrac12$ では平均の何倍の速さで回りますか。`],
        a: { type: 'num', v: ratio, tol: 0.003 },
        hint: ['On the 3-sphere, nlerp at the midpoint moves at $2\\tan(\\varphi/2)$ against an average of $\\varphi$.', '3 次元球面上で、中点での nlerp の速さは $2\\tan(\\varphi/2)$、平均は $\\varphi$ です。'],
        sol: [[`$\\varphi = \\Omega/2 = ${om / 2}^\\circ = ${n(phi, 4)}$ rad.`, `$\\varphi = \\Omega/2 = ${om / 2}^\\circ = ${n(phi, 4)}$ rad です。`], [`The chord point $(q_A + q_B)/2$ is closest to the centre, so the projection sweeps fastest there: $2\\tan(\\varphi/2)/\\varphi = 2\\tan ${n(om / 4, 3)}^\\circ / ${n(phi, 4)} = ${n(ratio, 4)}$.`, `弦上の点 $(q_A + q_B)/2$ は中心に最も近いので、そこで射影が最も速く動きます。$2\\tan(\\varphi/2)/\\varphi = 2\\tan ${n(om / 4, 3)}^\\circ / ${n(phi, 4)} = ${n(ratio, 4)}$ です。`], [`About ${n((ratio - 1) * 100, 2)}% above average: small for small angles, which is why games often use nlerp for nearby keyframes.`, `平均より約 ${n((ratio - 1) * 100, 2)}% 速いだけです。角度が小さければ差も小さいので、近いキーフレームにはよく nlerp が使われます。`]],
        set: { om, path: 0 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const om = r.pick([40, 60, 90, 100, 120, 140]), phi = rad(180 - om / 2), ratio = 2 * Math.tan(phi / 2) / phi;
        return {
          q: [`Keyframes $\\Omega = ${om}^\\circ$ apart, but $q_B$ was stored with the wrong sign, so $q_A\\cdot q_B < 0$. Without fixing it, how far does slerp turn the body, and how many times its average speed does nlerp reach at $t = \\tfrac12$?`, `キーフレームは $\\Omega = ${om}^\\circ$ 離れていますが、$q_B$ が逆の符号で保存されていたため $q_A\\cdot q_B < 0$ です。修正しないとき、slerp で物体は何度回り、nlerp は $t = \\tfrac12$ で平均の何倍の速さになりますか。`],
          a: { type: 'tuple', v: [360 - om, ratio], labels: [['angle (°)', '角度（°）'], ['speed ratio', '速さの比']], tol: 0.02 },
          hint: ['On the 3-sphere the two points are now $\\varphi = 180^\\circ - \\Omega/2$ apart.', '3 次元球面上で二点は $\\varphi = 180^\\circ - \\Omega/2$ 離れています。'],
          sol: [[`$\\varphi = 180^\\circ - ${om / 2}^\\circ = ${180 - om / 2}^\\circ$, so the body turns $2\\varphi = ${360 - om}^\\circ$, the long way round.`, `$\\varphi = 180^\\circ - ${om / 2}^\\circ = ${180 - om / 2}^\\circ$ なので、物体は遠回りに $2\\varphi = ${360 - om}^\\circ$ 回ります。`], [`nlerp at the midpoint: $2\\tan(\\varphi/2)/\\varphi = 2\\tan ${n(90 - om / 4, 3)}^\\circ / ${n(phi, 4)} = ${n(ratio, 3)}$.`, `中点での nlerp：$2\\tan(\\varphi/2)/\\varphi = 2\\tan ${n(90 - om / 4, 3)}^\\circ / ${n(phi, 4)} = ${n(ratio, 3)}$ です。`], om <= 90 ? ['The chord nearly passes through the origin, so the normalised point whips round: the visible jerk in the middle of a badly signed animation.', '弦がほぼ原点を通るので、正規化した点が急に回り込みます。符号を誤ったアニメーションの中央で見えるガクッとした動きはこれです。'] : ['The long chord passes much closer to the origin than the short one, so the normalised point speeds up in the middle; for small $\\Omega$ the effect becomes a violent jerk.', '長い弦は短い弦よりずっと原点の近くを通るので、正規化した点は中央で速くなります。$\\Omega$ が小さいと、これが激しいガクッとした動きになります。']],
          set: { om, path: 1 },
        };
      }
      if (form === 1) {
        const om = r.pick([60, 90, 120, 180]), phi = om / 2, s = Math.sin(rad(phi));
        const k = 180 / phi;  // phi = pi / k
        const sTeX = nice(s);
        return {
          q: [`For keyframes $\\Omega = ${om}^\\circ$ apart, write the slerp weight $b(t)$ on $q_B$ as a function of $t$.`, `$\\Omega = ${om}^\\circ$ 離れたキーフレームについて、$q_B$ にかかる slerp の重み $b(t)$ を $t$ の式で表してください。`],
          a: { type: 'expr', v: `sin(pi*t/${k})/${n(s, 12)}`, vars: ['t'], dom: { t: [0.05, 0.95] }, lhs: ['$b(t) =$', '$b(t) =$'] },
          hint: ['$b(t) = \\sin(t\\varphi)/\\sin\\varphi$ with $\\varphi$ half the rotation angle, in radians.', '$b(t) = \\sin(t\\varphi)/\\sin\\varphi$ で、$\\varphi$ は回転角の半分（ラジアン）です。'],
          sol: [[`$\\varphi = ${phi}^\\circ = \\pi/${k}$ and $\\sin\\varphi = ${sTeX}$.`, `$\\varphi = ${phi}^\\circ = \\pi/${k}$、$\\sin\\varphi = ${sTeX}$ です。`], [`$b(t) = \\dfrac{\\sin(\\pi t/${k})}{${sTeX}}$, which rises from 0 to 1 but not in a straight line.`, `$b(t) = \\dfrac{\\sin(\\pi t/${k})}{${sTeX}}$ で、0 から 1 へ増えますが直線的ではありません。`], ['That bend is exactly what keeps $|q(t)| = 1$ and the angular speed constant.', 'この曲がり具合こそが $|q(t)| = 1$ と角速度一定を保つものです。']],
          set: { om, path: 0 },
        };
      }
      const om = r.pick([60, 90, 120, 180]), t = r.pick([0.25, 0.5, 0.75]);
      // slerp from a rotation about z by alpha to the rotation about z by alpha + om
      const a0 = r.pick([0, 30, 45, 90, -60]), ang = a0 + t * om;
      return {
        q: [`$q_A$ rotates by $${a0}^\\circ$ about the $z$ axis and $q_B$ by $${a0 + om}^\\circ$ about the same axis, with $q_A\\cdot q_B \\ge 0$. What rotation angle about $z$ does $\\operatorname{slerp}(q_A, q_B; ${n(t)})$ represent?`, `$q_A$ は $z$ 軸のまわりの $${a0}^\\circ$ 回転、$q_B$ は同じ軸のまわりの $${a0 + om}^\\circ$ 回転で、$q_A\\cdot q_B \\ge 0$ です。$\\operatorname{slerp}(q_A, q_B; ${n(t)})$ は $z$ 軸のまわりの何度の回転を表しますか。`],
        a: { type: 'num', v: ang, tol: 0.3, unit: ['°', '°'] },
        hint: ['Both lie on the great circle $\\cos\\alpha + \\sin\\alpha\\,\\mathbf k$; slerp moves along it at a constant rate.', 'どちらも大円 $\\cos\\alpha + \\sin\\alpha\\,\\mathbf k$ 上にあり、slerp はそれに沿って一定の速さで動きます。'],
        sol: [[`$q_A = \\cos ${n(a0 / 2)}^\\circ + \\sin ${n(a0 / 2)}^\\circ\\,\\mathbf k$ and $q_B = \\cos ${n((a0 + om) / 2)}^\\circ + \\sin ${n((a0 + om) / 2)}^\\circ\\,\\mathbf k$: they are $\\varphi = ${om / 2}^\\circ$ apart along that circle.`, `$q_A = \\cos ${n(a0 / 2)}^\\circ + \\sin ${n(a0 / 2)}^\\circ\\,\\mathbf k$、$q_B = \\cos ${n((a0 + om) / 2)}^\\circ + \\sin ${n((a0 + om) / 2)}^\\circ\\,\\mathbf k$ で、この円に沿って $\\varphi = ${om / 2}^\\circ$ 離れています。`], [`At $t = ${n(t)}$ the half angle is $${n(a0 / 2)}^\\circ + ${n(t)}\\cdot ${om / 2}^\\circ = ${n(ang / 2)}^\\circ$, so the rotation angle is $${n(ang)}^\\circ$.`, `$t = ${n(t)}$ での半角は $${n(a0 / 2)}^\\circ + ${n(t)}\\cdot ${om / 2}^\\circ = ${n(ang / 2)}^\\circ$ なので、回転角は $${n(ang)}^\\circ$ です。`], ['For rotations about one axis slerp is just linear interpolation of the angle; its power is that it does the same thing for any pair of orientations.', '同じ軸のまわりの回転なら slerp は角度の線形補間にすぎません。その強みは、どんな二つの姿勢に対しても同じことをする点にあります。']],
      };
    },
  ];

  /* ---------- 3. gimbal lock ---------- */
  const pc = (c) => (c < 0 ? `(${c})` : String(c));
  const wrap180 = (a) => { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : a; };
  Q['gimbal-lock'] = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([0, 30, 45, 60, 75, 85, 89, -30, -60, -80]);
        return {
          q: [`At pitch $\\theta = ${p}^\\circ$, what is $|\\det J| = \\cos\\theta$ for the map from Euler rates to angular velocity? Give three decimals.`, `ピッチ $\\theta = ${p}^\\circ$ で、オイラー角速度から角速度への写像の $|\\det J| = \\cos\\theta$ はいくつですか（小数第3位まで）。`],
          a: { type: 'num', v: Math.cos(rad(p)), tol: 0.002 },
          hint: ['Only the pitch matters; yaw and roll do not appear in $\\det J$.', '効くのはピッチだけで、ヨーとロールは $\\det J$ に現れません。'],
          sol: [[`$|\\det J| = \\cos ${p}^\\circ = ${n(Math.cos(rad(p)), 4)}$.`, `$|\\det J| = \\cos ${p}^\\circ = ${n(Math.cos(rad(p)), 4)}$ です。`], [Math.abs(p) > 80 ? 'Close to zero: the three gimbal axes nearly lie in one plane, and some turns need huge Euler rates.' : 'Far from zero: the three gimbal axes are still well spread and every turn is easy to make.', Math.abs(p) > 80 ? '0 に近いので、三つのジンバルの軸がほぼ一つの平面に入り、ある向きの回転には巨大なオイラー角速度が必要です。' : '0 から遠いので、三つのジンバルの軸はまだ十分に広がっていて、どの回転も容易です。']],
          set: { pitch: p },
        };
      }
      if (form === 1) {
        const p = r.pick([0, 20, 40, 55, 70, 80, -25, -50, -75]);
        return {
          q: [`With pitch $\\theta = ${p}^\\circ$, what angle separates the yaw axis from the roll axis?`, `ピッチ $\\theta = ${p}^\\circ$ のとき、ヨー軸とロール軸のなす角は何度ですか。`],
          a: { type: 'num', v: 90 - Math.abs(p), tol: 0.3, unit: ['°', '°'] },
          hint: ['The roll axis is the body\'s nose direction; pitch tips it towards the vertical yaw axis.', 'ロール軸は機首の向きで、ピッチはそれを鉛直なヨー軸へ傾けます。'],
          sol: [[`The roll axis is $(\\cos\\psi\\cos\\theta, \\sin\\psi\\cos\\theta, -\\sin\\theta)$; its dot product with $\\hat z$ is $-\\sin\\theta$.`, `ロール軸は $(\\cos\\psi\\cos\\theta, \\sin\\psi\\cos\\theta, -\\sin\\theta)$ で、$\\hat z$ との内積は $-\\sin\\theta$ です。`], [`The angle between the lines is $\\arccos|\\sin\\theta| = 90^\\circ - |\\theta| = ${90 - Math.abs(p)}^\\circ$. It reaches zero at $|\\theta| = 90^\\circ$: gimbal lock.`, `二直線のなす角は $\\arccos|\\sin\\theta| = 90^\\circ - |\\theta| = ${90 - Math.abs(p)}^\\circ$ です。$|\\theta| = 90^\\circ$ で 0 になり、これがジンバルロックです。`]],
          set: { pitch: p },
        };
      }
      return {
        q: ['With yaw-pitch-roll Euler angles (yaw about $z$, pitch about the carried $y$ axis, roll about the body $x$ axis), at which angles do the gimbals lock?', 'ヨー・ピッチ・ロールのオイラー角（$z$ まわりのヨー、運ばれた $y$ 軸まわりのピッチ、機体の $x$ 軸まわりのロール）で、ジンバルがロックするのはどの角度ですか。'],
        a: { type: 'choice', opts: [['Pitch $= \\pm 90^\\circ$, whatever the yaw and roll', 'ピッチ $= \\pm 90^\\circ$（ヨーとロールによらない）'], ['Pitch $= 0^\\circ$', 'ピッチ $= 0^\\circ$'], ['Yaw $= \\pm 180^\\circ$', 'ヨー $= \\pm 180^\\circ$'], ['Roll $= \\pm 90^\\circ$', 'ロール $= \\pm 90^\\circ$']], v: 0 },
        hint: ['Lock means two of the three rotation axes line up. Which angle moves the roll axis towards the yaw axis?', 'ロックとは三つの回転軸のうち二つが揃うことです。どの角度がロール軸をヨー軸に近づけるでしょうか。'],
        sol: [['The roll axis is the nose; pitching the nose straight up or down puts it along the yaw axis $z$.', 'ロール軸は機首です。機首を真上か真下に向けると、それがヨー軸 $z$ に重なります。'], ['Then $|\\det J| = \\cos\\theta = 0$: yaw and roll turn about the same line and one direction of turning is lost. The middle angle is always the one that locks.', 'このとき $|\\det J| = \\cos\\theta = 0$ で、ヨーとロールが同じ直線のまわりに回り、回転の一方向が失われます。ロックを起こすのは常に真ん中の角度です。']],
        set: { pitch: r.pick([90, -90]) },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([30, 45, 60, 70, 80, 85, -40, -65]), sm = Math.sqrt(1 - Math.abs(Math.sin(rad(p))));
        return {
          q: [`At pitch $\\theta = ${p}^\\circ$, the smallest singular value of $J$ is $\\sigma_{\\min} = \\sqrt{1 - |\\sin\\theta|}$. To turn the aircraft at $1$ rad/s in the worst direction, how large must the Euler rate vector be, in rad/s?`, `ピッチ $\\theta = ${p}^\\circ$ で、$J$ の最小特異値は $\\sigma_{\\min} = \\sqrt{1 - |\\sin\\theta|}$ です。最悪の方向に機体を $1$ rad/s で回すには、オイラー角速度ベクトルの大きさはいくら必要ですか（rad/s）。`],
          a: { type: 'num', v: 1 / sm, tol: 0.005, unit: ['rad/s', 'rad/s'] },
          hint: ['Inverting $J$ stretches the worst direction by $1/\\sigma_{\\min}$.', '$J$ の逆写像は最悪の方向を $1/\\sigma_{\\min}$ 倍に引き伸ばします。'],
          sol: [[`$\\sigma_{\\min} = \\sqrt{1 - \\sin ${Math.abs(p)}^\\circ} = \\sqrt{${n(1 - Math.abs(Math.sin(rad(p))), 4)}} = ${n(sm, 4)}$.`, `$\\sigma_{\\min} = \\sqrt{1 - \\sin ${Math.abs(p)}^\\circ} = \\sqrt{${n(1 - Math.abs(Math.sin(rad(p))), 4)}} = ${n(sm, 4)}$ です。`], [`Euler rates of size $1/\\sigma_{\\min} = ${n(1 / sm, 3)}$ rad/s are needed. ${Math.abs(p) >= 80 ? 'Already several times the turning rate itself, and it diverges at $90^\\circ$.' : 'Still moderate; it diverges only as the pitch approaches $90^\\circ$.'}`, `大きさ $1/\\sigma_{\\min} = ${n(1 / sm, 3)}$ rad/s のオイラー角速度が必要です。${Math.abs(p) >= 80 ? 'すでに回転の速さそのものの数倍で、$90^\\circ$ で発散します。' : 'まだ穏やかですが、ピッチが $90^\\circ$ に近づくと発散します。'}`]],
          set: { pitch: p },
        };
      }
      if (form === 1) {
        const p = r.pick([0, 30, 45, 60, 90]), rates = [r.int(-2, 2), r.int(-2, 2), r.nz(-2, 2)];
        const x2 = [Math.cos(rad(p)), 0, -Math.sin(rad(p))];
        const w = [rates[2] * x2[0], rates[1], rates[0] + rates[2] * x2[2]];
        return {
          q: [`Yaw $\\psi = 0^\\circ$, pitch $\\theta = ${p}^\\circ$. The Euler angles change at $(\\dot\\psi, \\dot\\theta, \\dot\\varphi) = (${rates.join(', ')})$ rad/s. Find the angular velocity $\\omega$ in world coordinates.`, `ヨー $\\psi = 0^\\circ$、ピッチ $\\theta = ${p}^\\circ$ です。オイラー角が $(\\dot\\psi, \\dot\\theta, \\dot\\varphi) = (${rates.join(', ')})$ rad/s で変化するとき、世界座標での角速度 $\\omega$ を求めてください。`],
          a: { type: 'tuple', v: w, labels: ['$\\omega_x$', '$\\omega_y$', '$\\omega_z$'], tol: 0.005 },
          hint: ['$\\omega = \\dot\\psi\\,\\hat z + \\dot\\theta\\,(\\text{pitch axis}) + \\dot\\varphi\\,(\\text{roll axis})$, each axis where its gimbal holds it now.', '$\\omega = \\dot\\psi\\,\\hat z + \\dot\\theta\\,(\\text{ピッチ軸}) + \\dot\\varphi\\,(\\text{ロール軸})$ で、各軸は今ジンバルが保持している向きです。'],
          sol: [[`With $\\psi = 0$: yaw axis $(0, 0, 1)$, pitch axis $(0, 1, 0)$, roll axis $(\\cos\\theta, 0, -\\sin\\theta) = (${n(x2[0], 4)}, 0, ${n(x2[2], 4)})$.`, `$\\psi = 0$ ではヨー軸 $(0, 0, 1)$、ピッチ軸 $(0, 1, 0)$、ロール軸 $(\\cos\\theta, 0, -\\sin\\theta) = (${n(x2[0], 4)}, 0, ${n(x2[2], 4)})$ です。`], [`$\\omega = ${pc(rates[0])}(0, 0, 1) + ${pc(rates[1])}(0, 1, 0) + ${pc(rates[2])}(${n(x2[0], 4)}, 0, ${n(x2[2], 4)}) = (${n(w[0], 4)}, ${n(w[1], 4)}, ${n(w[2], 4)})$.`, `$\\omega = ${pc(rates[0])}(0, 0, 1) + ${pc(rates[1])}(0, 1, 0) + ${pc(rates[2])}(${n(x2[0], 4)}, 0, ${n(x2[2], 4)}) = (${n(w[0], 4)}, ${n(w[1], 4)}, ${n(w[2], 4)})$ です。`], [p === 90 ? 'At $90^\\circ$ the roll axis is $-\\hat z$: yaw and roll rates only ever add up along $z$, and no rate makes $\\omega_x \\ne 0$.' : 'The columns of $J$ are these three axes; while they are independent every $\\omega$ can be produced.', p === 90 ? '$90^\\circ$ ではロール軸は $-\\hat z$ で、ヨーとロールの角速度は $z$ 方向にしか足し合わされず、どんな角速度でも $\\omega_x \\ne 0$ にできません。' : '$J$ の列はこの三つの軸です。それらが独立である限り、どんな $\\omega$ も作れます。']],
          set: { yaw: 0, pitch: p },
        };
      }
      const ang = [r.pick([90, -90, 180]), r.pick([90, 0, -90]), r.pick([90, -90, 180])];
      const qz = axisAngle([0, 0, 1], rad(ang[0])), qy = axisAngle([0, 1, 0], rad(ang[1])), qx = axisAngle([1, 0, 0], rad(ang[2]));
      let q = qmul(qmul(qz, qy), qx); if (q[0] < -1e-9 || (Math.abs(q[0]) < 1e-9 && q.find((x) => Math.abs(x) > 1e-9) < 0)) q = q.map((x) => -x);
      q = q.map(clean);
      return {
        q: [`Compute the quaternion $q = q_z(\\psi)\\,q_y(\\theta)\\,q_x(\\varphi)$ for yaw $\\psi = ${ang[0]}^\\circ$, pitch $\\theta = ${ang[1]}^\\circ$, roll $\\varphi = ${ang[2]}^\\circ$. Give $(w, x, y, z)$, choosing the sign that makes the first non-zero component positive.`, `ヨー $\\psi = ${ang[0]}^\\circ$、ピッチ $\\theta = ${ang[1]}^\\circ$、ロール $\\varphi = ${ang[2]}^\\circ$ に対する四元数 $q = q_z(\\psi)\\,q_y(\\theta)\\,q_x(\\varphi)$ を求め、$(w, x, y, z)$ で答えてください。符号は最初の 0 でない成分が正になるように選びます。`],
        a: { type: 'tuple', v: q, labels: ['$w$', '$x$', '$y$', '$z$'], tol: 0.003 },
        hint: ['Each factor is $\\cos\\tfrac\\alpha2 + \\sin\\tfrac\\alpha2\\,(\\text{axis})$; multiply them in the order written.', '各因子は $\\cos\\tfrac\\alpha2 + \\sin\\tfrac\\alpha2\\,(\\text{軸})$ です。書かれた順に掛けます。'],
        sol: [[`$q_z = ${qTeX(qz)}$, $q_y = ${qTeX(qy)}$, $q_x = ${qTeX(qx)}$.`, `$q_z = ${qTeX(qz)}$、$q_y = ${qTeX(qy)}$、$q_x = ${qTeX(qx)}$ です。`], [`Multiplying, $q = ${qTeX(q)}$ (up to the overall sign).`, `掛け合わせると $q = ${qTeX(q)}$（全体の符号を除いて）です。`], ['Unlike the Euler angles, these four numbers depend smoothly on the orientation everywhere, including at a pitch of $90^\\circ$.', 'オイラー角と違い、この四つの数はピッチ $90^\\circ$ を含めて至るところで姿勢になめらかに依存します。']],
        set: { yaw: ang[0], pitch: ang[1], roll: ang[2] },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const p = r.pick([90, -90]), y0 = r.step(-150, 150, 10), f0 = r.step(-150, 150, 10);
        let y1; do { y1 = r.step(-150, 150, 10); } while (y1 === y0);
        const f1 = wrap180(p > 0 ? f0 + (y1 - y0) : f0 - (y1 - y0));
        return {
          q: [`An aircraft sits at yaw $${y0}^\\circ$, pitch $${p}^\\circ$, roll $${f0}^\\circ$. The same orientation can be written with yaw $${y1}^\\circ$ and pitch $${p}^\\circ$. Which roll, in $(-180^\\circ, 180^\\circ]$?`, `機体がヨー $${y0}^\\circ$、ピッチ $${p}^\\circ$、ロール $${f0}^\\circ$ の姿勢にあります。同じ姿勢をヨー $${y1}^\\circ$、ピッチ $${p}^\\circ$ でも表せます。ロールはいくつですか（$(-180^\\circ, 180^\\circ]$ の範囲で）。`],
          a: { type: 'num', v: f1, tol: 0.5, unit: ['°', '°'] },
          hint: [`At pitch $${p}^\\circ$ the roll axis lies along the yaw axis. Which combination of $\\psi$ and $\\varphi$ is all that matters?`, `ピッチ $${p}^\\circ$ ではロール軸がヨー軸に沿います。$\\psi$ と $\\varphi$ のどんな組み合わせだけが効くでしょうか。`],
          sol: [[`$R_y(${p}^\\circ)$ carries $\\hat x$ to $${p > 0 ? '-' : ''}\\hat z$, so $R_y(${p}^\\circ)R_x(\\varphi) = R_z(${p > 0 ? '-' : ''}\\varphi)R_y(${p}^\\circ)$ and $R = R_z(\\psi ${p > 0 ? '-' : '+'} \\varphi)R_y(${p}^\\circ)$.`, `$R_y(${p}^\\circ)$ は $\\hat x$ を $${p > 0 ? '-' : ''}\\hat z$ に移すので、$R_y(${p}^\\circ)R_x(\\varphi) = R_z(${p > 0 ? '-' : ''}\\varphi)R_y(${p}^\\circ)$、よって $R = R_z(\\psi ${p > 0 ? '-' : '+'} \\varphi)R_y(${p}^\\circ)$ です。`], [`Keep $\\psi ${p > 0 ? '-' : '+'} \\varphi = ${y0 + (p > 0 ? -f0 : f0)}^\\circ$: with $\\psi = ${y1}^\\circ$, $\\varphi = ${f1}^\\circ$ (mod $360^\\circ$).`, `$\\psi ${p > 0 ? '-' : '+'} \\varphi = ${y0 + (p > 0 ? -f0 : f0)}^\\circ$ を保てばよいので、$\\psi = ${y1}^\\circ$ なら $\\varphi = ${f1}^\\circ$（$360^\\circ$ を法として）です。`], ['A whole line of Euler angles gives one orientation: that lost uniqueness is the lost dimension, seen from the other side.', 'オイラー角の一本の直線全体が一つの姿勢を与えます。一意性が失われることは、失われた次元を反対側から見たものです。']],
          set: { yaw: y0, pitch: p, roll: f0 },
        };
      }
      if (form === 1) {
        const s = r.pick([0.1, 0.2, 0.3, 0.5, 0.6, 0.8]), p = deg(Math.asin(1 - s * s));
        return {
          q: [`A flight controller can only command Euler rates up to ${n(1 / s, 3)} times the turning rate it needs. Up to what pitch $|\\theta|$ (degrees) can it still turn the aircraft in every direction?`, `ある飛行制御装置は、必要な回転速度の ${n(1 / s, 3)} 倍までのオイラー角速度しか出せません。機体をどの方向にも回せるのは、ピッチ $|\\theta|$ が何度までですか。`],
          a: { type: 'num', v: p, tol: 0.1, unit: ['°', '°'] },
          hint: ['The worst case needs $1/\\sigma_{\\min}$ times the turning rate, with $\\sigma_{\\min} = \\sqrt{1 - |\\sin\\theta|}$.', '最悪の場合は回転速度の $1/\\sigma_{\\min}$ 倍が必要で、$\\sigma_{\\min} = \\sqrt{1 - |\\sin\\theta|}$ です。'],
          sol: [[`Require $1/\\sigma_{\\min} \\le ${n(1 / s, 3)}$, i.e. $\\sigma_{\\min} \\ge ${n(s)}$, so $1 - |\\sin\\theta| \\ge ${n(s * s)}$.`, `$1/\\sigma_{\\min} \\le ${n(1 / s, 3)}$、すなわち $\\sigma_{\\min} \\ge ${n(s)}$ が必要なので、$1 - |\\sin\\theta| \\ge ${n(s * s)}$ です。`], [`$|\\sin\\theta| \\le ${n(1 - s * s)}$ gives $|\\theta| \\le ${n(p, 2)}^\\circ$.`, `$|\\sin\\theta| \\le ${n(1 - s * s)}$ より $|\\theta| \\le ${n(p, 2)}^\\circ$ です。`], ['Because $\\sigma_{\\min}$ falls like a square root near $90^\\circ$, even a generous rate limit leaves a cone of forbidden attitudes around straight up and down.', '$\\sigma_{\\min}$ は $90^\\circ$ の近くで平方根のように落ちるので、余裕のある上限でも真上と真下のまわりに禁じられた姿勢の円錐が残ります。']],
          set: { pitch: Math.round(p) },
        };
      }
      const yaw = r.pick([0, 90, 180, -90, 45]), p = r.pick([90, -90]);
      const dirs = { 0: ['the world $x$ axis', '世界の $x$ 軸'], 90: ['the world $y$ axis', '世界の $y$ 軸'], 180: ['the world $x$ axis', '世界の $x$ 軸'], '-90': ['the world $y$ axis', '世界の $y$ 軸'], 45: ['the horizontal direction $(1, 1, 0)/\\sqrt2$', '水平方向 $(1, 1, 0)/\\sqrt2$'] };
      const wrong = yaw === 0 || yaw === 180 ? [['the world $y$ axis', '世界の $y$ 軸']] : yaw === 45 ? [['the horizontal direction $(-1, 1, 0)/\\sqrt2$', '水平方向 $(-1, 1, 0)/\\sqrt2$']] : [['the world $x$ axis', '世界の $x$ 軸']];
      return {
        q: [`Yaw $\\psi = ${yaw}^\\circ$, pitch $\\theta = ${p}^\\circ$: the gimbals are locked. About which axis can no combination of Euler rates turn the aircraft?`, `ヨー $\\psi = ${yaw}^\\circ$、ピッチ $\\theta = ${p}^\\circ$ で、ジンバルはロックしています。どんなオイラー角速度の組み合わせでも機体を回せないのは、どの軸のまわりですか。`],
        a: { type: 'choice', opts: [dirs[yaw], ...wrong, ['the world $z$ axis', '世界の $z$ 軸'], ['none: three angles always give three directions', 'ない（三つの角度は常に三方向を与える）']], v: 0 },
        hint: ['The reachable $\\omega$ are combinations of the yaw axis $\\hat z$ and the pitch axis $(-\\sin\\psi, \\cos\\psi, 0)$. What is perpendicular to both?', '作れる $\\omega$ はヨー軸 $\\hat z$ とピッチ軸 $(-\\sin\\psi, \\cos\\psi, 0)$ の一次結合です。その両方に垂直なのは何でしょうか。'],
        sol: [[`At $\\theta = ${p}^\\circ$ the roll axis is $${p > 0 ? '-' : ''}\\hat z$, so the columns of $J$ span only $\\hat z$ and the pitch axis $(-\\sin\\psi, \\cos\\psi, 0)$.`, `$\\theta = ${p}^\\circ$ ではロール軸が $${p > 0 ? '-' : ''}\\hat z$ なので、$J$ の列は $\\hat z$ とピッチ軸 $(-\\sin\\psi, \\cos\\psi, 0)$ しか張りません。`], [`The missing direction is perpendicular to both: $(\\cos\\psi, \\sin\\psi, 0)$, the horizontal heading, here ${dirs[yaw][0]}.`, `欠けている方向はその両方に垂直な $(\\cos\\psi, \\sin\\psi, 0)$、つまり水平な進行方向で、ここでは${dirs[yaw][1]}です。`], ['The aircraft can still physically turn that way, but the Euler angles cannot follow it smoothly: the problem lies in the coordinates, not in the rotation.', '機体は物理的にはその向きにも回れますが、オイラー角がなめらかに追従できません。問題は回転そのものではなく座標にあります。']],
        set: { yaw, pitch: p },
      };
    },
  ];
})();
