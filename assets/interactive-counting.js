(() => {
  const shell = document.querySelector('[data-lesson="counting-probability"]');
  if (!shell) return;
  const mount = shell.querySelector('[data-interactive-mount]');
  if (!mount) return;

  const ja = document.documentElement.lang.startsWith('ja');
  const t = (en, jp) => (ja ? jp : en);
  const loc = ja ? 'ja-JP' : 'en-US';
  const num = (v, d = 0) => v.toLocaleString(loc, { maximumFractionDigits: d });
  const fmt = (v, d = 4) => (Math.abs(v) >= 1e6 ? v.toExponential(3) : v.toLocaleString(loc, { maximumFractionDigits: d }));
  const css = getComputedStyle(document.documentElement);
  const C = () => ({
    ink: css.getPropertyValue('--ink').trim(),
    soft: css.getPropertyValue('--ink-soft').trim(),
    line: css.getPropertyValue('--line').trim(),
    teal: css.getPropertyValue('--teal').trim(),
    coral: css.getPropertyValue('--coral').trim(),
    gold: css.getPropertyValue('--gold').trim(),
    card: css.getPropertyValue('--card').trim(),
  });
  let colors = C();

  const comb = (n, k) => {
    if (k < 0 || n < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return Math.round(r);
  };
  const perm = (n, k) => {
    if (k < 0 || k > n) return 0;
    let r = 1;
    for (let i = 0; i < k; i++) r *= n - i;
    return r;
  };
  const fact = (n) => perm(n, n);
  const SUPS = { '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
  const sup = (n) => String(n).split('').map((c) => SUPS[c] || c).join('');

  const state = {
    mode: 'pascal',
    rows: 10, pn: 5, pk: 2, lens: 'rule',
    n: 10, k: 3, ordered: false, repeat: false,
    bn: 8, bk: 3,
    dist: 'binomial', dn: 20, dp: 0.35, lam: 3, geop: 0.3, hN: 50, hK: 20, hn: 10, normal: false,
    people: 23,
    sn: 9, sr: 5, arrangement: null,
  };

  mount.innerHTML = `
    <div class="workbench-bar">
      <div class="segmented" data-modes>
        <button type="button" data-mode="pascal" aria-pressed="true">${t('Pascal', 'パスカル')}</button>
        <button type="button" data-mode="choose" aria-pressed="false">${t('Choose', '選び方')}</button>
        <button type="button" data-mode="binomial" aria-pressed="false">${t('Binomial theorem', '二項定理')}</button>
        <button type="button" data-mode="dists" aria-pressed="false">${t('Distributions', '分布')}</button>
        <button type="button" data-mode="birthday" aria-pressed="false">${t('Birthdays', '誕生日')}</button>
        <button type="button" data-mode="stars" aria-pressed="false">${t('Stars &amp; bars', '仕切りと星')}</button>
      </div>
      <p data-workbench-hint>${t('Six views of one idea: build by choices, then divide by the repeats.', 'ひとつの考えを六つの見方で。選んで組み立て、重複で割ります。')}</p>
    </div>
    <div class="workbench-grid">
      <div class="workbench-controls" data-controls></div>
      <div class="workbench-stage"><div class="canvas-stage"><canvas class="lesson-canvas" width="720" height="420" data-canvas></canvas><p class="stage-caption" data-caption></p></div></div>
    </div>
    <div class="readout-grid" data-readouts aria-live="polite"></div>
    <div class="equation-strip" data-equation></div>`;

  const controls = mount.querySelector('[data-controls]');
  const canvas = mount.querySelector('[data-canvas]');
  const ctx = canvas.getContext('2d');
  const readouts = mount.querySelector('[data-readouts]');
  const equation = mount.querySelector('[data-equation]');
  const caption = mount.querySelector('[data-caption]');
  const hint = mount.querySelector('[data-workbench-hint]');

  const W = 720, Hgt = 420;
  const clear = () => { ctx.clearRect(0, 0, W, Hgt); };
  const text = (s, x, y, o = {}) => {
    const { size = 13, weight = 600, color = colors.soft, align = 'center' } = o;
    ctx.fillStyle = color; ctx.textAlign = align;
    ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(s, x, y);
  };
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  const alpha = (hex, a) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
  };

  function rangeRow(label, key, min, max, step, decimals = 0) {
    return `<div class="control-group"><label class="control-label" for="cc-${key}">${label}</label><div class="range-row"><input class="lesson-range" id="cc-${key}" data-key="${key}" data-dec="${decimals}" type="range" min="${min}" max="${max}" step="${step}" value="${state[key]}"><output class="range-value" data-value="${key}">${num(state[key], decimals)}</output></div></div>`;
  }
  function wireRanges(update) {
    controls.querySelectorAll('[data-key]').forEach((input) => {
      input.addEventListener('input', () => {
        const d = Number(input.dataset.dec || 0);
        state[input.dataset.key] = Number(input.value);
        const out = controls.querySelector(`[data-value="${input.dataset.key}"]`);
        if (out) out.textContent = num(Number(input.value), d);
        update();
      });
    });
  }
  const readout = (items) => {
    readouts.innerHTML = items.map((it) => `<div class="readout-item"><span>${it[0]}</span><strong>${it[1]}</strong></div>`).join('');
  };
  const legend = (items) => {
    caption.innerHTML = items.map((it) => `<span><i class="legend-swatch ${it[0]}"></i>${it[1]}</span>`).join('');
  };

  function pascal() {
    hint.textContent = t('Click any entry. Every identity in the book is a path through this triangle.', '任意の数をクリックしてください。本書の恒等式はすべて、この三角形の中の道筋です。');
    controls.innerHTML = `
      <h2 class="control-heading">${t("Pascal's triangle", 'パスカルの三角形')}</h2>
      <p class="control-equation">C(n,k) = C(n−1,k−1) + C(n−1,k)</p>
      ${rangeRow(t('Rows shown', '表示する行'), 'rows', 4, 14, 1)}
      <div class="control-group"><label class="control-label" for="cc-lens">${t('Highlight', '強調')}</label>
      <select class="lesson-select" id="cc-lens" data-lens>
        <option value="rule">${t("Pascal's rule", 'パスカルの法則')}</option>
        <option value="symmetry">${t('Symmetry C(n,k) = C(n,n−k)', '対称性 C(n,k) = C(n,n−k)')}</option>
        <option value="hockey">${t('Hockey stick', 'ホッケースティック')}</option>
        <option value="parity">${t('Odd entries (Sierpinski)', '奇数の項（シェルピンスキー）')}</option>
      </select></div>
      <p class="control-note">${t('Selected entry: click a circle on the canvas.', '選択中の項は、図の円をクリックして変えられます。')}</p>`;

    let cells = [];
    const draw = () => {
      colors = C();
      const N = state.rows;
      if (state.pn > N) { state.pn = N; state.pk = Math.min(state.pk, N); }
      const gapY = Math.min(34, (Hgt - 70) / (N + 1));
      const gapX = Math.min(46, (W - 120) / (N + 1));
      const r = Math.min(gapY, gapX) * 0.44;
      const top = 42, cx0 = W / 2 - 40;
      cells = [];
      const maxLog = Math.log(comb(N, Math.floor(N / 2)) + 1);
      const sel = { n: state.pn, k: state.pk };
      const inHockey = (n, k) => state.lens === 'hockey' && k === sel.k - 1 && n <= sel.n - 1 && n >= sel.k - 1;
      const isParent = (n, k) => state.lens === 'rule' && n === sel.n - 1 && (k === sel.k - 1 || k === sel.k);
      const isMirror = (n, k) => state.lens === 'symmetry' && n === sel.n && k === sel.n - sel.k;

      for (let n = 0; n <= N; n++) {
        for (let k = 0; k <= n; k++) {
          const v = comb(n, k);
          const x = cx0 + (k - n / 2) * gapX;
          const y = top + n * gapY;
          cells.push({ n, k, x, y, r });
          const isSel = n === sel.n && k === sel.k;
          let fill, stroke = null, tone = colors.soft;
          if (state.lens === 'parity') {
            fill = v % 2 === 1 ? alpha(colors.teal, 0.85) : alpha(colors.line, 0.35);
            tone = v % 2 === 1 ? colors.card : colors.soft;
          } else {
            const a = 0.07 + 0.55 * (Math.log(v + 1) / maxLog);
            fill = alpha(colors.teal, a);
            tone = a > 0.36 ? colors.card : colors.ink;
          }
          if (isParent(n, k) || inHockey(n, k) || isMirror(n, k)) { fill = alpha(colors.gold, 0.85); tone = colors.ink; }
          if (isSel) { fill = colors.coral; tone = '#ffffff'; stroke = colors.coral; }
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.stroke(); }
          if (r > 9 && v < 1e6) text(String(v), x, y + 4, { size: Math.min(12, r * 0.85), weight: 700, color: tone });
        }
      }
      if (state.lens === 'rule' && sel.n > 0 && sel.k > 0 && sel.k < sel.n) {
        const target = cells.find((c) => c.n === sel.n && c.k === sel.k);
        [[sel.n - 1, sel.k - 1], [sel.n - 1, sel.k]].forEach((pr) => {
          const p = cells.find((c) => c.n === pr[0] && c.k === pr[1]);
          if (!p || !target) return;
          ctx.strokeStyle = colors.gold; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y + r); ctx.lineTo(target.x, target.y - r - 2); ctx.stroke();
        });
      }
      if (state.lens === 'hockey') {
        const target = cells.find((c) => c.n === sel.n && c.k === sel.k);
        const last = cells.find((c) => c.n === sel.n - 1 && c.k === sel.k - 1);
        if (target && last) {
          ctx.strokeStyle = colors.coral; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(last.x, last.y + r); ctx.lineTo(target.x, target.y - r - 2); ctx.stroke();
        }
      }

      const v = comb(sel.n, sel.k);
      const rowSum = Math.pow(2, sel.n);
      readout([
        [`C(${sel.n}, ${sel.k})`, num(v)],
        [t('Row sum', '行の和'), `2^${sel.n} = ${num(rowSum)}`],
        [t('Ordered version P(n,k)', '順序つき P(n,k)'), num(perm(sel.n, sel.k))],
        [t('Share of the row', '行に占める割合'), `${fmt((v / rowSum) * 100, 2)}%`],
      ]);

      let eq;
      if (state.lens === 'rule') {
        eq = `<strong>C(${sel.n},${sel.k})</strong> = C(${sel.n - 1},${sel.k - 1}) + C(${sel.n - 1},${sel.k}) = ${num(comb(sel.n - 1, sel.k - 1))} + ${num(comb(sel.n - 1, sel.k))} = ${num(v)}`;
      } else if (state.lens === 'symmetry') {
        eq = `<strong>C(${sel.n},${sel.k})</strong> = C(${sel.n},${sel.n - sel.k}) = ${num(v)} &nbsp;·&nbsp; ${t('choosing what you keep is choosing what you discard', '残すものを選ぶことは、捨てるものを選ぶことです')}`;
      } else if (state.lens === 'hockey') {
        const terms = []; let s = 0;
        for (let i = sel.k - 1; i <= sel.n - 1; i++) { terms.push(num(comb(i, sel.k - 1))); s += comb(i, sel.k - 1); }
        eq = sel.k > 0
          ? `<strong>${terms.join(' + ')}</strong> = ${num(s)} = C(${sel.n},${sel.k})`
          : t('Pick an entry with k ≥ 1 to see the hockey stick.', 'k ≥ 1 の項を選ぶと、ホッケースティックが現れます。');
      } else {
        let odd = 0;
        for (let n = 0; n <= state.rows; n++) for (let k = 0; k <= n; k++) if (comb(n, k) % 2 === 1) odd++;
        eq = `<strong>${t('Odd entries', '奇数の項')}</strong>: ${odd} / ${((state.rows + 1) * (state.rows + 2)) / 2} &nbsp;·&nbsp; ${t("C(n,k) is odd exactly when the binary digits of k sit inside those of n (Kummer)", 'C(n,k) が奇数になるのは、k の二進表示が n の二進表示に収まるときだけです（クンマー）')}`;
      }
      equation.innerHTML = eq;
      legend([['swatch-coral', t('selected', '選択中')], ['swatch-gold', t('the identity', '恒等式の項')], ['swatch-teal', t('magnitude', '大きさ')]]);
    };

    canvas.style.cursor = 'pointer';
    canvas.onclick = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      const my = ((ev.clientY - rect.top) / rect.height) * Hgt;
      let best = null, bd = 1e9;
      cells.forEach((c) => { const d = (c.x - mx) * (c.x - mx) + (c.y - my) * (c.y - my); if (d < bd) { bd = d; best = c; } });
      if (best && bd < (best.r + 8) * (best.r + 8)) { state.pn = best.n; state.pk = best.k; draw(); }
    };
    const lensEl = controls.querySelector('[data-lens]');
    lensEl.value = state.lens;
    lensEl.addEventListener('change', (e) => { state.lens = e.target.value; draw(); });
    wireRanges(draw);
    draw();
  }

  function choose() {
    hint.textContent = t('Two yes/no questions decide which formula you need.', '二つの「はい／いいえ」が、使うべき式を決めます。');
    controls.innerHTML = `
      <h2 class="control-heading">${t('The fourfold way', '四つの数え方')}</h2>
      <p class="control-equation">${t('choose k from n', 'n から k 個を選ぶ')}</p>
      ${rangeRow('n', 'n', 1, 20, 1)}
      ${rangeRow('k', 'k', 0, 20, 1)}
      <div class="control-group"><span class="control-label">${t('Does order matter?', '順序は重要か')}</span>
        <div class="segmented" data-ord>
          <button type="button" data-ord="0" aria-pressed="true">${t('No', 'いいえ')}</button>
          <button type="button" data-ord="1" aria-pressed="false">${t('Yes', 'はい')}</button>
        </div></div>
      <div class="control-group"><span class="control-label">${t('Repetition allowed?', '重複は許されるか')}</span>
        <div class="segmented" data-rep>
          <button type="button" data-rep="0" aria-pressed="true">${t('No', 'いいえ')}</button>
          <button type="button" data-rep="1" aria-pressed="false">${t('Yes', 'はい')}</button>
        </div></div>
      <p class="control-note">${t('Every elementary counting question is one of these four.', '初等的な数え上げは、この四つのいずれかです。')}</p>`;

    const draw = () => {
      colors = C();
      const n = state.n, k = state.k;
      const vals = {
        '0-0': { v: comb(n, k), f: 'C(n,k) = n! / (k!(n−k)!)', name: t('Subsets', '部分集合') },
        '1-0': { v: perm(n, k), f: 'P(n,k) = n! / (n−k)!', name: t('Sequences', '順列') },
        '1-1': { v: Math.pow(n, k), f: 'n^k', name: t('Strings', '文字列') },
        '0-1': { v: comb(n + k - 1, k), f: 'C(n+k−1, k)', name: t('Multisets', '多重集合') },
      };
      const key = `${state.ordered ? 1 : 0}-${state.repeat ? 1 : 0}`;
      const show = (v) => (Number.isFinite(v) && v < 1e15 ? num(v) : v.toExponential(3));
      controls.querySelectorAll('[data-ord] button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ord) === (state.ordered ? 1 : 0))));
      controls.querySelectorAll('[data-rep] button').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.rep) === (state.repeat ? 1 : 0))));

      clear();
      const bw = 268, bh = 104, x0 = 118, y0 = 96, gx = 20, gy = 18;
      text(t('ORDER MATTERS', '順序が重要'), x0 + bw / 2, y0 - 44, { size: 12, weight: 800, color: colors.soft });
      text(t('ORDER DOES NOT', '順序は無関係'), x0 + bw + gx + bw / 2, y0 - 44, { size: 12, weight: 800, color: colors.soft });
      text(t('NO REPEAT', '重複なし'), 96, y0 + bh / 2, { size: 12, weight: 800, color: colors.soft, align: 'right' });
      text(t('REPEAT OK', '重複あり'), 96, y0 + bh + gy + bh / 2, { size: 12, weight: 800, color: colors.soft, align: 'right' });

      [['1-0', 0, 0], ['0-0', 1, 0], ['1-1', 0, 1], ['0-1', 1, 1]].forEach((cell) => {
        const id = cell[0], col = cell[1], row = cell[2];
        const x = x0 + col * (bw + gx), y = y0 + row * (bh + gy);
        const active = id === key;
        ctx.fillStyle = active ? alpha(colors.coral, 0.14) : alpha(colors.line, 0.22);
        ctx.strokeStyle = active ? colors.coral : colors.line;
        ctx.lineWidth = active ? 2.5 : 1;
        roundRect(x, y, bw, bh, 10); ctx.fill(); ctx.stroke();
        text(vals[id].name, x + bw / 2, y + 24, { size: 12, weight: 800, color: active ? colors.coral : colors.soft });
        text(vals[id].f, x + bw / 2, y + 52, { size: 14, weight: 700, color: colors.ink });
        text(show(vals[id].v), x + bw / 2, y + 82, { size: 20, weight: 800, color: active ? colors.coral : colors.soft });
      });

      const sy = 362;
      text(t('one selection', '選び方の一例'), 118, sy - 22, { size: 11, weight: 800, color: colors.soft, align: 'left' });
      const picked = [];
      for (let i = 0; i < k; i++) picked.push(state.repeat ? (i * 3 + 1) % Math.max(n, 1) : i);
      for (let i = 0; i < Math.min(n, 22); i++) {
        const x = 126 + i * 26;
        const hits = picked.filter((p) => p === i).length;
        ctx.fillStyle = hits ? colors.teal : alpha(colors.line, 0.5);
        ctx.beginPath(); ctx.arc(x, sy, 9, 0, Math.PI * 2); ctx.fill();
        if (hits > 1) text(String(hits), x, sy + 4, { size: 11, weight: 800, color: colors.card });
      }
      if (n > 22) text('…', 126 + 22 * 26, sy + 5, { size: 14, weight: 700, color: colors.soft, align: 'left' });

      readout([
        [t('Your case', '選択中の場合'), vals[key].name],
        [t('Formula', '式'), vals[key].f],
        [t('Count', '個数'), show(vals[key].v)],
        [t('Orderings of one selection', '一つの選び方の並べ方'), `k! = ${num(fact(Math.min(k, 18)))}`],
      ]);
      equation.innerHTML = `<strong>${vals[key].f}</strong> ${t('with', 'に')} n = ${n}, k = ${k} &nbsp;→&nbsp; ${show(vals[key].v)}${k > n && !state.repeat ? ` &nbsp;·&nbsp; ${t('k exceeds n, so there is nothing to choose', 'k が n を超えるため、選び方は存在しない')}` : ''}`;
      legend([['swatch-coral', t('active case', '選択中の場合')], ['swatch-teal', t('items picked', '選ばれた要素')]]);
    };

    controls.querySelector('[data-ord]').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      state.ordered = b.dataset.ord === '1'; draw();
    });
    controls.querySelector('[data-rep]').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      state.repeat = b.dataset.rep === '1'; draw();
    });
    wireRanges(draw);
    draw();
  }

  function binomial() {
    hint.textContent = t('The coefficient counts which factors contributed a y.', '係数は、どの因子が y を出したかを数えています。');
    controls.innerHTML = `
      <h2 class="control-heading">${t('Binomial theorem', '二項定理')}</h2>
      <p class="control-equation">(x + y)^n = Σ C(n,k) x^(n−k) y^k</p>
      ${rangeRow('n', 'bn', 0, 16, 1)}
      ${rangeRow(t('term k', '項 k'), 'bk', 0, 16, 1)}
      <p class="control-note">${t('The row is symmetric, peaks at k = ⌊n/2⌋, and sums to 2^n. Divide by 2^n and it is the Bin(n, ½) distribution.', '行は対称で、k = ⌊n/2⌋ で最大になり、総和は 2^n です。2^n で割れば、Bin(n, ½) 分布そのものになります。')}</p>`;

    const draw = () => {
      colors = C();
      const n = state.bn;
      const k = Math.min(state.bk, n);
      clear();
      const vals = []; for (let i = 0; i <= n; i++) vals.push(comb(n, i));
      const mx = Math.max.apply(null, vals.concat([1]));
      const left = 70, right = W - 40, base = 316, top = 52;
      const bw = Math.min(46, (right - left) / (n + 1));
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left - 12, base); ctx.lineTo(right, base); ctx.stroke();
      for (let i = 0; i <= n; i++) {
        const h = ((base - top) * vals[i]) / mx;
        const x = left + i * bw + bw * 0.12;
        const w = bw * 0.76;
        ctx.fillStyle = i === k ? colors.coral : alpha(colors.teal, 0.45);
        roundRect(x, base - h, w, h, 3); ctx.fill();
        if (bw > 22) text(String(i), x + w / 2, base + 18, { size: 11, weight: 600, color: colors.soft });
        if (bw > 26 && h > 22) text(num(vals[i]), x + w / 2, base - h - 7, { size: 10, weight: 700, color: i === k ? colors.coral : colors.soft });
      }
      text(t('k (number of y factors)', 'k（y を選んだ因子の数）'), (left + right) / 2, base + 38, { size: 12, weight: 700, color: colors.soft });
      text(`C(${n},k)`, left - 26, top + 4, { size: 12, weight: 800, color: colors.soft, align: 'right' });

      const fy = 400;
      text(t('one factor per bracket, x or y:', '括弧ごとに x か y を一つ選ぶ：'), left, fy - 24, { size: 11, weight: 800, color: colors.soft, align: 'left' });
      const step = Math.min(30, (right - left) / Math.max(n, 1));
      for (let i = 0; i < n; i++) {
        const x = left + 12 + i * step;
        const isY = i < k;
        ctx.fillStyle = isY ? colors.coral : alpha(colors.teal, 0.55);
        roundRect(x - 9, fy - 11, 18, 22, 4); ctx.fill();
        text(isY ? 'y' : 'x', x, fy + 5, { size: 12, weight: 800, color: colors.card });
      }

      const term = comb(n, k);
      readout([
        [t('Coefficient', '係数'), num(term)],
        [t('Term', '項'), `${num(term)}·x${sup(n - k)}·y${sup(k)}`],
        [t('Row sum', '行の和'), num(Math.pow(2, n))],
        [t('Probability at k when p = ½', 'p = ½ のときの k の確率'), fmt(term / Math.pow(2, n), 5)],
      ]);

      const parts = [];
      for (let i = 0; i <= n; i++) {
        const c = comb(n, i);
        const cs = c === 1 ? '' : num(c);
        const xs = n - i === 0 ? '' : (n - i === 1 ? 'x' : `x<sup>${n - i}</sup>`);
        const ys = i === 0 ? '' : (i === 1 ? 'y' : `y<sup>${i}</sup>`);
        const body = `${cs}${xs}${ys}` || '1';
        parts.push(i === k ? `<strong>${body}</strong>` : body);
      }
      equation.innerHTML = `(x + y)<sup>${n}</sup> = ${parts.join(' + ')}`;
      legend([['swatch-coral', t('the selected term', '選択中の項')], ['swatch-teal', t('the rest of the row', '行の他の項')]]);
    };
    wireRanges(draw);
    draw();
  }

  function dists() {
    hint.textContent = t('Same experiment, different questions asked of it.', '同じ実験に、異なる問いを立てます。');

    function pmfSet() {
      const d = state.dist;
      if (d === 'binomial') {
        const n = state.dn, p = state.dp;
        return { xs: Array.from({ length: n + 1 }, (_, k) => k), f: (k) => comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k), mean: n * p, varr: n * p * (1 - p), label: `Bin(${n}, ${p.toFixed(2)})`, note: t('n fixed trials, count the successes.', '試行回数 n を固定して、成功数を数えます。') };
      }
      if (d === 'poisson') {
        const l = state.lam, top = Math.max(8, Math.ceil(l + 4 * Math.sqrt(l) + 2));
        let term = Math.exp(-l); const table = [term];
        for (let k = 1; k <= top; k++) { term = (term * l) / k; table.push(term); }
        return { xs: Array.from({ length: top + 1 }, (_, k) => k), f: (k) => table[k], mean: l, varr: l, label: `Poisson(${l.toFixed(1)})`, note: t('Mean equals variance. It is the limit of Bin(n, λ/n).', '平均と分散が一致します。Bin(n, λ/n) の極限です。') };
      }
      if (d === 'geometric') {
        const p = state.geop, top = Math.max(10, Math.ceil(5 / p));
        return { xs: Array.from({ length: top }, (_, i) => i + 1), f: (k) => Math.pow(1 - p, k - 1) * p, mean: 1 / p, varr: (1 - p) / (p * p), label: `Geometric(${p.toFixed(2)})`, note: t('Trials until the first success. Memoryless.', '最初の成功までの試行回数です。無記憶性をもちます。') };
      }
      const N = state.hN, K = Math.min(state.hK, N), n = Math.min(state.hn, N);
      const lo = Math.max(0, n - (N - K)), hi = Math.min(n, K), pi = K / N;
      return {
        xs: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i),
        f: (k) => (comb(K, k) * comb(N - K, n - k)) / comb(N, n),
        mean: n * pi, varr: n * pi * (1 - pi) * ((N - n) / (N - 1)),
        label: `HG(${N}, ${K}, ${n})`,
        note: t('Drawing without replacement. The correction (N−n)/(N−1) shrinks the spread.', '非復元抽出です。補正 (N−n)/(N−1) が広がりを小さくします。'),
      };
    }

    function draw() {
      colors = C();
      const D = pmfSet();
      const ys = D.xs.map(D.f);
      const mx = Math.max.apply(null, ys.concat([1e-9]));
      const sd = Math.sqrt(D.varr);
      clear();
      const left = 62, right = W - 30, base = 350, top = 46;
      ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left - 10, base); ctx.lineTo(right, base); ctx.stroke();
      const span = D.xs.length;
      const bw = (right - left) / span;
      const xPix = (v) => left + (v - D.xs[0] + 0.5) * bw;

      D.xs.forEach((k, i) => {
        const h = ((base - top) * ys[i]) / mx;
        const x = left + i * bw + bw * 0.12;
        ctx.fillStyle = alpha(colors.teal, 0.5);
        roundRect(x, base - h, Math.max(1.5, bw * 0.76), h, 2); ctx.fill();
      });
      const tick = Math.max(1, Math.round(span / 12));
      D.xs.forEach((k, i) => { if (i % tick === 0 && bw > 5) text(String(k), left + i * bw + bw / 2, base + 18, { size: 10, weight: 600, color: colors.soft }); });

      ctx.strokeStyle = colors.coral; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(xPix(D.mean), top - 8); ctx.lineTo(xPix(D.mean), base); ctx.stroke();
      ctx.setLineDash([]);
      text(`μ = ${fmt(D.mean, 2)}`, xPix(D.mean), top - 14, { size: 11, weight: 800, color: colors.coral });
      ctx.strokeStyle = alpha(colors.gold, 0.9); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(xPix(D.mean - sd), base + 30); ctx.lineTo(xPix(D.mean + sd), base + 30); ctx.stroke();
      text(`± 1 SD = ${fmt(sd, 2)}`, xPix(D.mean), base + 48, { size: 11, weight: 700, color: colors.soft });

      if (state.normal && sd > 0) {
        ctx.strokeStyle = colors.coral; ctx.lineWidth = 2; ctx.beginPath();
        for (let px = left; px <= right; px += 2) {
          const v = D.xs[0] - 0.5 + (px - left) / bw;
          const dens = Math.exp(-((v - D.mean) * (v - D.mean)) / (2 * D.varr)) / (sd * Math.sqrt(2 * Math.PI));
          const y = base - ((base - top) * dens) / mx;
          if (px === left) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }
      text(D.label, left, 26, { size: 13, weight: 800, color: colors.ink, align: 'left' });

      const modeIdx = ys.indexOf(mx);
      readout([
        [t('Mean', '平均'), fmt(D.mean, 3)],
        [t('Variance', '分散'), fmt(D.varr, 3)],
        [t('Standard deviation', '標準偏差'), fmt(sd, 3)],
        [t('Most likely value', '最頻値'), `${D.xs[modeIdx]} (${fmt(mx * 100, 2)}%)`],
      ]);
      const note = controls.querySelector('[data-dnote]');
      if (note) note.textContent = D.note;
      const within = ys.filter((y, i) => Math.abs(D.xs[i] - D.mean) <= sd).reduce((a, b) => a + b, 0);
      equation.innerHTML = `<strong>${D.label}</strong> &nbsp;·&nbsp; ${t('mass within one standard deviation', '標準偏差 1 個分に入る確率')} = ${fmt(within * 100, 1)}% &nbsp;·&nbsp; ${t('Chebyshev alone guarantees nothing here; the shape is doing the work.', 'チェビシェフの不等式だけでは何も保証されません。効いているのは分布の形です。')}`;
      legend([['swatch-teal', t('probability mass', '確率質量')], ['swatch-coral', state.normal ? t('mean and normal curve', '平均と正規曲線') : t('mean', '平均')], ['swatch-gold', t('one standard deviation', '標準偏差 1 個分')]]);
    }

    function build() {
      const d = state.dist;
      let sliders = '';
      if (d === 'binomial') sliders = rangeRow('n', 'dn', 1, 60, 1) + rangeRow('p', 'dp', 0.01, 0.99, 0.01, 2);
      if (d === 'poisson') sliders = rangeRow('λ', 'lam', 0.2, 20, 0.2, 1);
      if (d === 'geometric') sliders = rangeRow('p', 'geop', 0.02, 0.9, 0.01, 2);
      if (d === 'hyper') sliders = rangeRow('N', 'hN', 10, 80, 1) + rangeRow('K', 'hK', 1, 60, 1) + rangeRow('n', 'hn', 1, 30, 1);
      controls.innerHTML = `
        <h2 class="control-heading">${t('Discrete distributions', '離散分布')}</h2>
        <div class="control-group"><label class="control-label" for="cc-dist">${t('Distribution', '分布')}</label>
        <select class="lesson-select" id="cc-dist" data-dist>
          <option value="binomial">${t('Binomial(n, p)', '二項分布 Bin(n, p)')}</option>
          <option value="poisson">${t('Poisson(λ)', 'ポアソン分布 Po(λ)')}</option>
          <option value="geometric">${t('Geometric(p)', '幾何分布 Geo(p)')}</option>
          <option value="hyper">${t('Hypergeometric(N, K, n)', '超幾何分布 HG(N, K, n)')}</option>
        </select></div>
        ${sliders}
        <div class="control-group"><button class="lesson-button${state.normal ? ' is-active' : ''}" type="button" data-normal>${t('Normal approximation', '正規近似')}</button></div>
        <p class="control-note" data-dnote></p>`;
      const sel = controls.querySelector('[data-dist]');
      sel.value = d;
      sel.addEventListener('change', (e) => { state.dist = e.target.value; build(); });
      controls.querySelector('[data-normal]').addEventListener('click', () => { state.normal = !state.normal; build(); });
      wireRanges(draw);
      draw();
    }
    build();
  }

  function birthday() {
    hint.textContent = t('Intuition counts people. The problem counts pairs.', '直感は人数を数えます。問題が数えているのは組です。');
    controls.innerHTML = `
      <h2 class="control-heading">${t('The birthday problem', '誕生日問題')}</h2>
      <p class="control-equation">P(match) = 1 − P(365, n) / 365^n</p>
      ${rangeRow(t('people', '人数'), 'people', 1, 90, 1)}
      <p class="control-note">${t('There are C(n,2) pairs, each matching with probability 1/365. Quadratic growth in n is the whole phenomenon: the same argument governs hash collisions after about √N insertions.', '組は C(n,2) 個あり、各組が確率 1/365 で一致します。n について二次で増えることが、この現象のすべてです。同じ議論が、約 √N 回の挿入でハッシュ衝突が生じる理由も説明します。')}</p>`;

    const pMatch = (n) => { let p = 1; for (let i = 0; i < n; i++) p *= (365 - i) / 365; return 1 - p; };

    const draw = () => {
      colors = C();
      clear();
      const left = 64, right = W - 30, base = 356, top = 44;
      const X = (n) => left + (n / 90) * (right - left);
      const Y = (p) => base - p * (base - top);
      ctx.lineWidth = 1;
      [0, 0.25, 0.5, 0.75, 1].forEach((g) => {
        ctx.strokeStyle = colors.line;
        ctx.setLineDash(g === 0 ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(left, Y(g)); ctx.lineTo(right, Y(g)); ctx.stroke();
        text(`${g * 100}%`, left - 10, Y(g) + 4, { size: 10, weight: 600, color: colors.soft, align: 'right' });
      });
      ctx.setLineDash([]);
      ctx.strokeStyle = colors.teal; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let n = 1; n <= 90; n++) { const x = X(n), y = Y(pMatch(n)); if (n === 1) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      for (let n = 0; n <= 90; n += 10) text(String(n), X(n), base + 18, { size: 10, weight: 600, color: colors.soft });
      text(t('number of people', '人数'), (left + right) / 2, base + 34, { size: 12, weight: 700, color: colors.soft });

      const n = state.people, p = pMatch(n);
      ctx.strokeStyle = colors.coral; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(n), base); ctx.lineTo(X(n), Y(p)); ctx.lineTo(left, Y(p)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.coral; ctx.beginPath(); ctx.arc(X(n), Y(p), 5, 0, Math.PI * 2); ctx.fill();
      text(`${fmt(p * 100, 1)}%`, X(n) + (n > 60 ? -12 : 12), Y(p) - 10, { size: 13, weight: 800, color: colors.coral, align: n > 60 ? 'right' : 'left' });

      const pairs = comb(n, 2);
      ctx.fillStyle = alpha(colors.gold, 0.9);
      for (let i = 0; i < Math.min(n, 90); i++) {
        const x = left + 4 + (i % 45) * 5.8;
        const y = 402 + Math.floor(i / 45) * 8;
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      }
      text(t('people', '人'), left - 10, 406, { size: 10, weight: 700, color: colors.soft, align: 'right' });

      readout([
        [t('People', '人数'), String(n)],
        [t('Pairs C(n,2)', '組 C(n,2)'), num(pairs)],
        [t('P(shared birthday)', '一致がある確率'), `${fmt(p * 100, 2)}%`],
        [t('Poisson estimate', 'ポアソン近似'), `${fmt((1 - Math.exp(-pairs / 365)) * 100, 2)}%`],
      ]);
      equation.innerHTML = `<strong>n = ${n}</strong> &nbsp;·&nbsp; ${t('expected matching pairs', '一致する組の期待値')} = C(${n},2)/365 = ${fmt(pairs / 365, 3)} &nbsp;·&nbsp; ${t('the curve crosses 50% at n = 23 and 99% at n = 57', '曲線は n = 23 で 50% を、n = 57 で 99% を超える')}`;
      legend([['swatch-teal', t('probability of a match', '一致する確率')], ['swatch-coral', t('your n', '選択中の n')], ['swatch-gold', t('the people themselves', '人そのもの')]]);
    };
    wireRanges(draw);
    draw();
  }

  function stars() {
    hint.textContent = t('Choose which positions hold bars, and the boxes fill themselves.', '仕切りを置く位置を選べば、箱の中身は自動的に決まります。');
    controls.innerHTML = `
      <h2 class="control-heading">${t('Stars and bars', '仕切りと星')}</h2>
      <p class="control-equation">x₁ + x₂ + ⋯ + x<sub>r</sub> = n</p>
      ${rangeRow(t('objects n', '個数 n'), 'sn', 1, 16, 1)}
      ${rangeRow(t('boxes r', '箱の数 r'), 'sr', 1, 8, 1)}
      <div class="control-group"><button class="lesson-button" type="button" data-shuffle>${t('Another arrangement', '別の配置を見る')}</button></div>
      <p class="control-note">${t('Every arrangement of n stars and r−1 bars is one solution, and every solution is one arrangement. So count the arrangements.', 'n 個の星と r−1 本の仕切りの並べ方は、解と一対一に対応します。ですから、並べ方を数えれば十分です。')}</p>`;

    const reroll = () => {
      const n = state.sn, r = state.sr;
      const slots = n + r - 1;
      const idx = Array.from({ length: slots }, (_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
      const barSet = new Set(idx.slice(0, r - 1));
      state.arrangement = Array.from({ length: slots }, (_, i) => (barSet.has(i) ? 'bar' : 'star'));
    };

    const draw = () => {
      colors = C();
      const n = state.sn, r = state.sr;
      const slots = n + r - 1;
      if (!state.arrangement || state.arrangement.length !== slots) reroll();
      const seq = state.arrangement;
      const counts = []; let cur = 0;
      seq.forEach((s) => { if (s === 'bar') { counts.push(cur); cur = 0; } else cur++; });
      counts.push(cur);

      clear();
      const rowY = 116;
      const step = Math.min(34, (W - 140) / slots);
      const x0 = W / 2 - (slots * step) / 2 + step / 2;
      text(t('one arrangement of stars and bars', '星と仕切りの並べ方（一例）'), W / 2, 62, { size: 12, weight: 800, color: colors.soft });
      seq.forEach((s, i) => {
        const x = x0 + i * step;
        if (s === 'star') {
          ctx.fillStyle = colors.gold;
          ctx.beginPath();
          for (let a = 0; a < 10; a++) {
            const ang = -Math.PI / 2 + (a * Math.PI) / 5;
            const rad = a % 2 === 0 ? 11 : 4.6;
            const px = x + rad * Math.cos(ang), py = rowY + rad * Math.sin(ang);
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.strokeStyle = colors.coral; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, rowY - 14); ctx.lineTo(x, rowY + 14); ctx.stroke();
        }
      });

      const by = 236, bh = 92;
      const bwidth = Math.min(110, (W - 120) / r);
      const bx0 = W / 2 - (r * bwidth) / 2;
      text(t('the solution it encodes', 'それが表す解'), W / 2, by - 22, { size: 12, weight: 800, color: colors.soft });
      counts.forEach((c, i) => {
        const x = bx0 + i * bwidth;
        ctx.strokeStyle = colors.line; ctx.lineWidth = 1.4;
        ctx.fillStyle = alpha(colors.teal, 0.1);
        roundRect(x + 4, by, bwidth - 8, bh, 8); ctx.fill(); ctx.stroke();
        text(`x${'₁₂₃₄₅₆₇₈'[i] || String(i + 1)}`, x + bwidth / 2, by + 20, { size: 12, weight: 700, color: colors.soft });
        text(String(c), x + bwidth / 2, by + 62, { size: 28, weight: 800, color: colors.ink });
        for (let s = 0; s < c; s++) {
          const px = x + bwidth / 2 - ((Math.min(c, 8) - 1) * 8) / 2 + (s % 8) * 8;
          ctx.fillStyle = colors.gold;
          ctx.beginPath(); ctx.arc(px, by + 80, 2.6, 0, Math.PI * 2); ctx.fill();
        }
      });

      const total = comb(n + r - 1, r - 1);
      const positive = n >= r ? comb(n - 1, r - 1) : 0;
      readout([
        [t('Slots', '位置の数'), `${n} + ${r - 1} = ${slots}`],
        [t('Non-negative solutions', '非負整数解'), num(total)],
        [t('Positive solutions', '正整数解'), num(positive)],
        [t('This solution', 'この解'), `(${counts.join(', ')})`],
      ]);
      equation.innerHTML = `<strong>C(n+r−1, r−1)</strong> = C(${n + r - 1}, ${r - 1}) = ${num(total)} &nbsp;·&nbsp; ${t(`choose which ${r - 1} of the ${slots} positions hold bars`, `${slots} 個の位置のうち、どの ${r - 1} 個に仕切りを置くかを選ぶ`)}`;
      legend([['swatch-gold', t('stars: the objects', '星：分ける対象')], ['swatch-coral', t('bars: the dividers', '仕切り：区切り')], ['swatch-teal', t('boxes', '箱')]]);
    };

    controls.querySelector('[data-shuffle]').addEventListener('click', () => { reroll(); draw(); });
    wireRanges(() => { state.arrangement = null; draw(); });
    draw();
  }

  const modes = { pascal, choose, binomial, dists, birthday, stars };
  function activate(name) {
    state.mode = name;
    canvas.onclick = null;
    canvas.style.cursor = 'default';
    mount.querySelectorAll('[data-modes] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === name)));
    modes[name]();
  }
  mount.querySelector('[data-modes]').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    activate(b.dataset.mode);
  });
  const mo = new MutationObserver(() => { colors = C(); activate(state.mode); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  activate('pascal');
})();
