'use strict';
(() => {
  const L = window.Lab, T = L.T, fmt = L.fmt, D = window.LabDefs = window.LabDefs || {};
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  // Shorten a segment so it stops at the node circles.
  const trim = (a, b, r) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [[a[0] + dx / l * r, a[1] + dy / l * r], [b[0] - dx / l * r, b[1] - dy / l * r]]; };
  const weightTag = (f, p, w, o = {}) => { f.rect(p[0] - 0.2, p[1] - 0.27, 0.4, 0.36, { c: o.c || 'muted', fill: 'plate', fo: 1, w: o.strong ? 1.6 : 0.8, rx: 3, layer: 'main' }); f.text(p[0], p[1], String(w), { dy: 2, small: true, c: o.c || 'ink' }); };
  const clickable = (el, label, fn) => { el.style.cursor = 'pointer'; el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-label', label); el.addEventListener('click', fn); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); };

  /* ---------- 1. Dijkstra ---------- */
  const SN = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'T'];
  const SP = [[0.7, 3], [2.8, 5.2], [2.8, 0.8], [5, 3], [5.2, 5.5], [5.2, 0.5], [7.4, 4.8], [7.4, 1.2], [9.3, 3]];
  const SE = [[0, 1, 4, 0], [0, 2, 3, 0], [1, 3, 2, 1], [2, 3, 3, 1], [1, 4, 3, 0], [2, 5, 4, 0], [3, 4, 2, 1], [3, 5, 3, 1], [3, 6, 3, 1], [3, 7, 3, 1], [4, 6, 4, 0], [5, 7, 2, 0], [6, 8, 3, 0], [7, 8, 4, 0], [6, 7, 2, 0]];
  const LABDIR = [[-1, 0], [0, 1], [0, -1], [1, 0], [0, 1], [0, -1], [0, 1], [0, -1], [1, 0]];
  function dijkstra(n, edges, src) {
    const adj = L.seq(n, () => []);
    edges.forEach(([a, b, w], i) => { adj[a].push([b, w, i]); adj[b].push([a, w, i]); });
    const dist = new Array(n).fill(Infinity), pred = new Array(n).fill(-1), done = new Array(n).fill(false);
    dist[src] = 0;
    const frames = [{ dist: dist.slice(), pred: pred.slice(), done: done.slice(), cur: -1 }];
    let relax = 0;
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0) break;
      done[u] = true;
      for (const [x, w, ei] of adj[u]) if (!done[x] && dist[u] + w < dist[x]) { dist[x] = dist[u] + w; pred[x] = ei; relax++; }
      frames.push({ dist: dist.slice(), pred: pred.slice(), done: done.slice(), cur: u });
    }
    return { frames, dist, pred, relax };
  }
  D.shortest = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const st = ctx.state, tgt = st.target ?? 8, traffic = v.traffic;
      const edges = SE.map(([a, b, w, city]) => [a, b, city ? w * traffic : w, city]);
      if (v.shortcut) edges.push([1, 6, 4, 0]);
      const { frames, dist, pred, relax } = dijkstra(9, edges, 0);
      const route = []; for (let x = tgt; x !== 0 && pred[x] >= 0; ) { const e = edges[pred[x]]; route.push(pred[x]); x = e[0] === x ? e[1] : e[0]; }
      const f = L.fig(ctx.host, { axes: false, x: [-0.3, 10.3], y: [-0.3, 6.4], equal: true, maxH: 440 });
      f.circle(5, 3, 1.35, { c: 'c2', fill: true, fo: 0.07, w: 1, dash: '3 4', layer: 'under' });
      f.text(5, 3, T('downtown', '中心街'), { dy: 42, small: true, c: 'c2' });
      const R = 0.42;
      const draw = (k) => {
        const fr0 = frames[Math.min(k, frames.length - 1)], fin = k >= frames.length - 1, fr = fin ? Object.assign({}, fr0, { cur: -1 }) : fr0;
        f.clear('main'); f.clear('over');
        edges.forEach(([a, b, w, city], i) => {
          const inTree = fr.pred.includes(i) && (fr.done[a] || fr.done[b]);
          const onRoute = fin && route.includes(i);
          const sty = { c: onRoute ? 'hl' : inTree ? 'c1' : 'muted', w: onRoute ? 6 : inTree ? 3.2 : 1.6, op: onRoute || inTree ? 1 : 0.7 };
          if (i === 15) {
            const A = SP[a], B = SP[b], C = [5, 3.9], bz = (t) => { const u = 1 - t; return [u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]; };
            f.line(L.seq(41, (j) => bz(0.08 + 0.84 * j / 40)), Object.assign(sty, { dash: '7 4' }));
            weightTag(f, bz(0.3), w);
          } else {
            const [p, q] = trim(SP[a], SP[b], R);
            f.line([p, q], sty);
            const t = a === 3 && b === 4 ? 0.3 : 0.5;
            weightTag(f, [SP[a][0] + (SP[b][0] - SP[a][0]) * t, SP[a][1] + (SP[b][1] - SP[a][1]) * t], w, { c: city && traffic > 1 ? 'c2' : undefined });
          }
        });
        SP.forEach((P, i) => {
          const done = fr.done[i], front = !done && fr.dist[i] < Infinity, cur = fr.cur === i;
          const el = f.circle(P[0], P[1], R, { c: cur ? 'hl' : done ? 'c1' : front ? 'c2' : 'muted', fill: cur ? 'hl' : done ? 'c1' : 'plate', fo: done || cur ? 0.9 : 1, w: i === tgt ? 3.4 : 2 });
          f.text(P[0], P[1], SN[i], { dy: 5, c: done || cur ? 'plate' : 'ink' });
          const dlab = fr.dist[i] < Infinity ? String(fr.dist[i]) : '∞';
          const dir = LABDIR[i], off = R + 0.12;
          f.text(P[0] + dir[0] * off, P[1] + dir[1] * off, dlab, { anchor: dir[0] > 0 ? 'start' : dir[0] < 0 ? 'end' : 'middle', dy: dir[1] > 0 ? -2 : dir[1] < 0 ? 14 : 5, dx: dir[0] * 2, c: front ? 'c2' : done ? 'c1' : 'muted' });
          if (i !== 0) clickable(el, T(`Route to ${SN[i]}`, `${SN[i]} までの経路`), () => { st.target = i; ctx.redraw(); });
        });
      };
      const STEP = 0.8;
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const k = Math.min(frames.length - 1, Math.floor(t / STEP));
        draw(k);
        const fr = frames[k];
        label.textContent = k < frames.length - 1 ? (fr.cur >= 0 ? T(`settled ${SN[fr.cur]} at distance ${fr.dist[fr.cur]}`, `${SN[fr.cur]} を距離 ${fr.dist[fr.cur]} で確定`) : T('start: d(S) = 0', '開始：d(S) = 0')) : '';
        return k < frames.length - 1;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Run Dijkstra step by step', 'ダイクストラ法を1段ずつ実行') });
      L.legend(ctx.host, [{ kind: 'dot', c: 'c1', label: T('settled: distance is final', '確定：距離は最終値') }, { kind: 'dot', c: 'c2', label: T('frontier: tentative distance', '前線：暫定距離') }, { c: 'c1', label: T('shortest-path tree', '最短経路木') }, { c: 'hl', label: T(`route S to ${SN[tgt]}`, `S から ${SN[tgt]} への経路`) }]);
      const names = []; for (let x = tgt; ; ) { names.unshift(SN[x]); if (x === 0 || pred[x] < 0) break; const e = edges[pred[x]]; x = e[0] === x ? e[1] : e[0]; }
      const order = frames.slice(1).map((fr) => SN[fr.cur]).join(' ');
      ctx.readout([{ k: `d(${SN[tgt]})`, v: String(dist[tgt]), tone: 'key' }, { k: T('route', '経路'), v: names.join(' → ') }, { k: T('settling order', '確定の順'), v: order }, { k: T('label improvements', 'ラベルの更新回数'), v: String(relax) }],
        T('Click any node to route to it. Orange weights are downtown roads, multiplied by the traffic weight.', 'ノードをクリックするとそこへの経路を表示します。橙の重みは中心街の道路で、混雑重みが掛かっています。'));
    },
  };

  /* ---------- 2. Kruskal and the cut property ---------- */
  const KP = [[1, 1.2], [1, 4.4], [3, 0.6], [3, 3.6], [5, 1.6], [5, 4.8], [7, 0.8], [7, 3.8], [9, 1.6], [9, 4.6]];
  const KE = [[0, 1, 4], [0, 2, 3], [1, 3, 5], [0, 3, 6], [2, 3, 2], [2, 4, 7], [3, 4, 4], [3, 5, 6], [1, 5, 8], [4, 5, 3], [4, 6, 5], [5, 7, 7], [4, 7, null], [6, 7, 2], [6, 8, 4], [7, 9, 3], [8, 9, 5], [7, 8, 6]];
  const CAND = 12;
  D.spanning = {
    render(ctx, v) {
      ctx.state.anim?.stop();
      const cut = Math.round(v.cut), edges = KE.map(([a, b, w]) => [a, b, w ?? v.w]);
      const order = edges.map((e, i) => i).sort((i, j) => edges[i][2] - edges[j][2] || i - j);
      const parent = L.seq(10, (i) => i), find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      const steps = order.map((i) => { const [a, b] = edges[i], ra = find(a), rb = find(b); if (ra !== rb) { parent[ra] = rb; return [i, true]; } return [i, false]; });
      const tree = new Set(steps.filter((s) => s[1]).map((s) => s[0]));
      const wT = [...tree].reduce((s, i) => s + edges[i][2], 0);
      const left = (i) => KP[i][0] < 2 * cut;
      const crossing = edges.map((e, i) => i).filter((i) => left(edges[i][0]) !== left(edges[i][1]));
      const minW = Math.min(...crossing.map((i) => edges[i][2]));
      const lightest = crossing.filter((i) => edges[i][2] === minW);
      const f = L.fig(ctx.host, { axes: false, x: [0, 10], y: [-0.4, 5.6], equal: true, maxH: 420 });
      f.rect(0, -0.4, 2 * cut, 6, { c: 'c4', fo: 0.06, nostroke: true, layer: 'under' });
      f.line([[2 * cut, -0.4], [2 * cut, 5.6]], { c: 'c4', w: 2, dash: '7 5', layer: 'under' });
      f.text(2 * cut, 5.6, T('cut', 'カット'), { dy: 14, dx: 6, anchor: 'start', small: true, c: 'c4' });
      const R = 0.4;
      const draw = (k) => {
        f.clear('main'); f.clear('over');
        const status = new Map(steps.slice(0, k).map(([i, ok]) => [i, ok])), cur = k < steps.length ? steps[k][0] : -1, fin = k >= steps.length;
        edges.forEach(([a, b, w], i) => {
          const [p, q] = trim(KP[a], KP[b], R), s = status.get(i), cross = crossing.includes(i);
          const style = i === cur ? { c: 'hl', w: 4.5 } : s === true ? { c: 'c1', w: 4.2 } : s === false ? { c: cross ? 'c2' : 'muted', w: 1.2, dash: '3 4', op: 0.7 } : { c: cross ? 'c2' : 'muted', w: cross ? 2 : 1.4, op: 0.75 };
          f.line([p, q], style);
          weightTag(f, mid(KP[a], KP[b]), w, { c: i === CAND ? 'c3' : cross ? 'c2' : undefined, strong: i === CAND || (fin && lightest.includes(i)) });
        });
        KP.forEach((P, i) => { f.circle(P[0], P[1], R, { c: 'ink', fill: left(i) ? 'c4' : 'plate', fo: left(i) ? 0.45 : 1, w: 2 }); f.text(P[0], P[1], String(i + 1), { dy: 5 }); });
        if (fin) lightest.forEach((i) => { const m = mid(KP[edges[i][0]], KP[edges[i][1]]); f.circle(m[0], m[1] - 0.09, 0.36, { c: 'hl', w: 2.6 }); });
      };
      ctx.state.anim = L.animator(ctx.host, (dt, t, label) => {
        const k = Math.min(steps.length, Math.floor(t / 0.55));
        draw(k);
        if (k < steps.length) { const [i, ok] = steps[k]; const [a, b, w] = edges[i]; label.textContent = `${a + 1}–${b + 1} (${w}): ${ok ? T('added', '追加') : T('rejected, it would close a cycle', '閉路ができるので除外')}`; } else label.textContent = '';
        return k < steps.length;
      }, { autoplay: false, once: true, initialT: 1e6, playLabel: T('Run Kruskal, lightest edge first', 'クラスカル法を軽い辺から実行') });
      L.legend(ctx.host, [{ c: 'c1', label: T('minimum spanning tree', '最小全域木') }, { c: 'c2', label: T('edges crossing the cut', 'カットを横切る辺') }, { kind: 'dot', c: 'hl', label: T('lightest crossing edge', '最軽量の横断辺') }, { kind: 'fill', c: 'c4', label: T('one side of the cut', 'カットの片側') }, { kind: 'dot', c: 'c3', label: T('candidate edge 5–8', '候補の辺 5–8') }]);
      const allIn = lightest.every((i) => tree.has(i));
      ctx.readout([{ k: 'w(T)', v: String(wT), tone: 'key' }, { k: '|T|', v: `${tree.size} = |V| − 1` }, { k: T('lightest crossing weight', '最軽量の横断辺の重み'), v: String(minW) }, { k: T('in the tree?', '木に含まれる？'), v: allIn ? T('yes', 'はい') : T('one of the tied edges', '同点の辺の一つ'), tone: allIn ? 'good' : undefined }, { k: T('candidate 5–8 in the tree?', '候補 5–8 は木に？'), v: tree.has(CAND) ? T('yes', 'はい') : T('no', 'いいえ') }],
        lightest.length > 1 ? T('Several crossing edges tie for lightest, so more than one minimum tree exists.', '最軽量の横断辺が複数あるため、最小全域木は1つに限りません。') : '');
    },
  };

  /* ---------- 3. centrality ---------- */
  function buildNet(hub, extra) {
    const pos = [], names = [], E = [];
    const ring = (cx, dir, labs) => labs.forEach((s, k) => { const th = Math.PI * (dir > 0 ? 0 : 1) + dir * (k * 2 * Math.PI) / 5; pos.push([cx + 1.25 * Math.cos(th), 3 + 1.25 * Math.sin(th)]); names.push(s); });
    ring(2.9, 1, ['A', 'B', 'C', 'D', 'E']);
    ring(9.1, -1, ['F', 'G', 'H', 'J', 'K']);
    pos.push([6, 3]); names.push('X');
    const inner = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3], [2, 4]];
    inner.forEach(([a, b]) => { E.push([a, b]); E.push([a + 5, b + 5]); });
    E.push([1, 10], [4, 10], [6, 10], [9, 10]);
    const hubI = 2;
    for (let k = 0; k < hub; k++) { const th = Math.PI * (0.8 + (k - 1.5) * 0.24); pos.push([pos[hubI][0] + 1.35 * Math.cos(th), pos[hubI][1] + 1.35 * Math.sin(th)]); names.push(['p', 'q', 'r', 's'][k]); E.push([hubI, pos.length - 1]); }
    [[1, 6], [4, 9], [0, 5]].slice(0, extra).forEach(([a, b]) => E.push([a, b, 'long']));
    return { pos, names, E };
  }
  function measures(n, E) {
    const adj = L.seq(n, () => []); E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const deg = adj.map((a) => a.length / (n - 1));
    const clo = [], bet = new Array(n).fill(0);
    for (let s = 0; s < n; s++) {
      const d = new Array(n).fill(-1), sig = new Array(n).fill(0), P = L.seq(n, () => []), S = [], Q = [s];
      d[s] = 0; sig[s] = 1;
      while (Q.length) { const u = Q.shift(); S.push(u); for (const w of adj[u]) { if (d[w] < 0) { d[w] = d[u] + 1; Q.push(w); } if (d[w] === d[u] + 1) { sig[w] += sig[u]; P[w].push(u); } } }
      clo.push((n - 1) / d.reduce((a, b) => a + b, 0));
      const del = new Array(n).fill(0);
      while (S.length) { const w = S.pop(); for (const u of P[w]) del[u] += sig[u] / sig[w] * (1 + del[w]); if (w !== s) bet[w] += del[w]; }
    }
    const norm = (n - 1) * (n - 2); // ordered pairs count twice
    return { deg, clo, bet: bet.map((b) => b / norm) };
  }
  D.centrality = {
    render(ctx, v) {
      const hub = Math.round(v.hub), extra = Math.round(v.bridge), mode = Math.round(v.measure ?? 2);
      const { pos, names, E } = buildNet(hub, extra), n = pos.length, M = measures(n, E);
      const keys = ['deg', 'clo', 'bet'], cols = ['c1', 'c3', 'c2'];
      const lab = [T('degree', '次数'), T('closeness', '近接'), T('betweenness', '媒介')];
      const val = M[keys[mode]], mx = Math.max(...val) || 1;
      const f = L.fig(ctx.host, { axes: false, x: [0, 12], y: [0.9, 5.5], equal: true, maxH: 380 });
      E.forEach(([a, b, long]) => {
        if (long) { const c = [(pos[a][0] + pos[b][0]) / 2, (pos[a][1] + pos[b][1]) / 2 + (pos[a][1] > 3.1 ? 1.7 : pos[a][1] < 2.9 ? -1.7 : 1.9)]; f.line(L.seq(31, (i) => { const t = i / 30, u = 1 - t; return [u * u * pos[a][0] + 2 * u * t * c[0] + t * t * pos[b][0], u * u * pos[a][1] + 2 * u * t * c[1] + t * t * pos[b][1]]; }), { c: 'c4', w: 1.8, op: 0.8, layer: 'under' }); } else f.line([pos[a], pos[b]], { c: 'muted', w: 1.6, op: 0.8, layer: 'under' });
      });
      const top = val.indexOf(mx);
      pos.forEach((P, i) => {
        const r = 0.2 + 0.3 * val[i] / mx;
        f.circle(P[0], P[1], r, { c: 'plate', fill: 'plate', fo: 1, w: 0 });
        f.circle(P[0], P[1], r, { c: i === top ? 'hl' : cols[mode], fill: true, fo: 0.2 + 0.5 * val[i] / mx, w: i === top ? 2.6 : 1.6 });
        f.text(P[0], P[1], names[i], { dy: 5 });
      });
      L.h('p', 'lab-cap', ctx.host, T('All three measures for every node, each scaled so its largest value is 1', '全ノードの3つの指標（各指標の最大値を1に揃えています）'));
      const g = L.fig(ctx.host, { x: [-0.6, n - 0.4], y: [0, 1.08], aspect: 0.26, minH: 170, maxH: 230, ticksX: names.map((s, i) => [i, s]), ticksY: [[0, '0'], [0.5, '0.5'], [1, '1']] });
      keys.forEach((k, j) => { const m = Math.max(...M[k]) || 1; M[k].forEach((x, i) => g.rect(i - 0.36 + j * 0.24, 0, 0.22, x / m, { c: cols[j], fo: j === mode ? 0.8 : 0.3, w: j === mode ? 1.4 : 0.6 })); });
      g.hover((x) => { const i = Math.round(x); if (i < 0 || i >= n) return null; return { x: i, text: `${names[i]}: ${lab[0]} ${fmt(M.deg[i], 3)}, ${lab[1]} ${fmt(M.clo[i], 3)}, ${lab[2]} ${fmt(M.bet[i], 3)}` }; });
      L.legend(ctx.host, keys.map((k, j) => ({ kind: 'fill', c: cols[j], label: lab[j] + (j === mode ? T(' (node size above)', '（上図のノードの大きさ）') : '') })).concat(extra ? [{ c: 'c4', label: T('extra links between the groups', '群の間の追加リンク') }] : []));
      const iX = names.indexOf('X'), iC = names.indexOf('C');
      ctx.readout([{ k: T(`top by ${lab[mode]}`, `${lab[mode]}の最上位`), v: names[top], tone: 'key' }, { k: T('bridge X: degree, betweenness', '橋 X：次数、媒介'), v: `${fmt(M.deg[iX], 3)}, ${fmt(M.bet[iX], 3)}` }, { k: T('hub C: degree, betweenness', 'ハブ C：次数、媒介'), v: `${fmt(M.deg[iC], 3)}, ${fmt(M.bet[iC], 3)}` }],
        T('Values are normalized: degree by n − 1, closeness as (n − 1)/Σd, betweenness by the number of pairs not involving the node.', '値は規格化しています。次数は n − 1 で割り、近接は (n − 1)/Σd、媒介はそのノードを含まない組の数で割っています。'));
    },
  };
})();
