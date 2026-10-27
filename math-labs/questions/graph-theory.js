'use strict';
(() => {
  const Q = (typeof window !== 'undefined' ? window : globalThis).LabQuestions ||= {};
  const P = (typeof window !== 'undefined' && window.Practice) || globalThis.Practice;
  const { fmtNum: n, frac, mat } = P.util;

  /* ---------- shared graph helpers (pure) ---------- */
  const seq = (k, f) => Array.from({ length: k }, (_, i) => f(i));
  // edges [a, b, w]; returns distances, predecessor vertex, settling order and number of shortest paths
  function dijkstra(N, E, s) {
    const adj = seq(N, () => []);
    E.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
    const d = new Array(N).fill(Infinity), pr = new Array(N).fill(-1), done = new Array(N).fill(false), cnt = new Array(N).fill(0), order = [];
    d[s] = 0; cnt[s] = 1;
    for (let k = 0; k < N; k++) {
      let u = -1;
      for (let i = 0; i < N; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
      if (u < 0) break;
      done[u] = true; order.push(u);
      for (const [x, w] of adj[u]) {
        if (done[x]) continue;
        if (d[u] + w < d[x]) { d[x] = d[u] + w; pr[x] = u; cnt[x] = cnt[u]; } else if (d[u] + w === d[x]) cnt[x] += cnt[u];
      }
    }
    return { d, pr, order, cnt };
  }
  const route = (pr, t) => { const out = [t]; while (pr[out[0]] >= 0) out.unshift(pr[out[0]]); return out; };
  function kruskal(N, E) {
    const par = seq(N, (i) => i), find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
    const idx = E.map((e, i) => i).sort((i, j) => E[i][2] - E[j][2] || i - j), acc = [], rej = [];
    for (const i of idx) { const [a, b] = E[i], ra = find(a), rb = find(b); if (ra !== rb) { par[ra] = rb; acc.push(i); } else rej.push(i); }
    return { acc, rej, w: acc.reduce((s, i) => s + E[i][2], 0) };
  }
  function prim(N, E, s) {
    const inT = new Array(N).fill(false), added = []; inT[s] = true;
    for (let k = 1; k < N; k++) {
      let best = -1;
      E.forEach(([a, b, w], i) => { if (inT[a] !== inT[b] && (best < 0 || w < E[best][2])) best = i; });
      added.push(best); inT[E[best][0]] = true; inT[E[best][1]] = true;
    }
    return added;
  }
  // exact determinant of an integer matrix (Bareiss)
  function det(M) {
    const A = M.map((r) => r.slice()), k = A.length; let sign = 1, prev = 1;
    for (let i = 0; i < k - 1; i++) {
      if (A[i][i] === 0) { const j = A.findIndex((r, jj) => jj > i && r[i] !== 0); if (j < 0) return 0; [A[i], A[j]] = [A[j], A[i]]; sign = -sign; }
      for (let j = i + 1; j < k; j++) for (let l = i + 1; l < k; l++) A[j][l] = (A[j][l] * A[i][i] - A[j][i] * A[i][l]) / prev;
      prev = A[i][i];
    }
    return sign * A[k - 1][k - 1];
  }
  // a connected random graph: a random spanning tree plus extra edges, no multi-edges
  function randGraph(r, N, extra, wlo, whi) {
    const E = [], has = new Set(), key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
    const perm = r.shuffle(seq(N, (i) => i).slice(1)); perm.unshift(0);
    for (let i = 1; i < N; i++) { const a = perm[i], b = perm[r.int(Math.max(0, i - 2), i - 1)]; E.push([Math.min(a, b), Math.max(a, b), r.int(wlo, whi)]); has.add(key(a, b)); }
    let guard = 0;
    while (E.length < N - 1 + extra && guard++ < 200) { const a = r.int(0, N - 1), b = r.int(0, N - 1); if (a === b || has.has(key(a, b))) continue; has.add(key(a, b)); E.push([Math.min(a, b), Math.max(a, b), r.int(wlo, whi)]); }
    return E.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  }
  const edgeList = (E, nm, withW = true) => E.map(([a, b, w]) => `${nm[a]}–${nm[b]}${withW ? ` (${w})` : ''}`).join(', ');
  const pathStr = (p, nm) => p.map((i) => nm[i]).join(' → ');

  /* ---------- 1. shortest paths (Dijkstra) on the lab's road map ---------- */
  const SN = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'T'];
  const SE = [[0, 1, 4, 0], [0, 2, 3, 0], [1, 3, 2, 1], [2, 3, 3, 1], [1, 4, 3, 0], [2, 5, 4, 0], [3, 4, 2, 1], [3, 5, 3, 1], [3, 6, 3, 1], [3, 7, 3, 1], [4, 6, 4, 0], [5, 7, 2, 0], [6, 8, 3, 0], [7, 8, 4, 0], [6, 7, 2, 0]];
  const labEdges = (traffic, shortcut) => { const E = SE.map(([a, b, w, c]) => [a, b, c ? w * traffic : w, c]); if (shortcut) E.push([1, 6, 4, 0]); return E; };
  const settingEn = (t, s) => `traffic weight ${t}, shortcut ${s ? 'on' : 'off'}`;
  const settingJa = (t, s) => `混雑重み ${t}、近道${s ? 'あり' : 'なし'}`;
  const GN = ['S', 'A', 'B', 'C', 'D', 'T'];

  Q.shortest = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const du = r.int(2, 12), w = r.int(1, 9), dv = r.chance(0.3) ? Infinity : r.int(du + 1, du + 12);
        const res = Math.min(dv, du + w), dvs = dv === Infinity ? '\\infty' : String(dv);
        return {
          q: [`Dijkstra's algorithm has just settled $u$ with $d(u) = ${du}$. Its unsettled neighbour $v$ carries the label $d(v) = ${dvs}$, and the edge $u$–$v$ has weight $${w}$. What is $d(v)$ after the edge is relaxed?`, `ダイクストラ法でちょうど $u$ が $d(u) = ${du}$ で確定しました。未確定の隣 $v$ のラベルは $d(v) = ${dvs}$ で、辺 $u$–$v$ の重みは $${w}$ です。この辺を緩和した後の $d(v)$ はいくつですか。`],
          a: { type: 'int', v: res },
          hint: ['Relaxing keeps the smaller of the old label and the route through $u$.', '緩和では、古いラベルと $u$ を経由する経路の長さのうち小さい方を残します。'],
          sol: [[`The route through $u$ has length $d(u) + w = ${du} + ${w} = ${du + w}$.`, `$u$ を経由する経路の長さは $d(u) + w = ${du} + ${w} = ${du + w}$ です。`], [`$\\min(${dvs},\\ ${du + w}) = ${res}$${res === du + w && dv !== du + w ? ', so the label improves and $u$ becomes the predecessor of $v$' : ', so the label stays as it was'}.`, `$\\min(${dvs},\\ ${du + w}) = ${res}$ なので、${res === du + w && dv !== du + w ? 'ラベルは改善され、$u$ が $v$ の直前の頂点になります' : 'ラベルはそのままです'}。`], ['A label is only ever lowered, and it becomes final once its node is settled.', 'ラベルは下がることしかなく、そのノードが確定した時点で最終値になります。']],
        };
      }
      if (form === 1) {
        let ws, labs;
        do { ws = r.shuffle([r.int(1, 9), r.int(1, 9), r.int(1, 9)]); } while (new Set(ws).size < 3);
        labs = r.sample(['A', 'B', 'C', 'D'], 3);
        const k = ws.indexOf(Math.min(...ws));
        return {
          q: [`From the source $S$ the edges go to ${labs[0]} (weight ${ws[0]}), ${labs[1]} (weight ${ws[1]}) and ${labs[2]} (weight ${ws[2]}). After $S$ is settled, which node does Dijkstra's algorithm settle next?`, `始点 $S$ から ${labs[0]}（重み ${ws[0]}）、${labs[1]}（重み ${ws[1]}）、${labs[2]}（重み ${ws[2]}）へ辺が出ています。$S$ を確定した後、ダイクストラ法が次に確定するノードはどれですか。`],
          a: { type: 'choice', opts: labs.map((s, i) => [`${s}, at distance ${ws[i]}`, `${s}（距離 ${ws[i]}）`]), v: k, fixed: true },
          hint: ['The next node settled is the frontier node with the smallest tentative label.', '次に確定するのは、前線のうち暫定ラベルが最小のノードです。'],
          sol: [[`After relaxing the edges out of $S$, the labels are ${labs.map((s, i) => `$d(${s}) = ${ws[i]}$`).join(', ')}.`, `$S$ からの辺を緩和すると、ラベルは ${labs.map((s, i) => `$d(${s}) = ${ws[i]}$`).join('、')} です。`], [`The smallest is ${labs[k]} with ${ws[k]}. No detour can beat it: any other route already spends at least ${Math.min(...ws.filter((x, i) => i !== k))} on its first edge, and weights are nonnegative.`, `最小は ${labs[k]} の ${ws[k]} です。ほかの経路は最初の辺だけで少なくとも ${Math.min(...ws.filter((x, i) => i !== k))} を使い、重みは非負なので、回り道がこれより短くなることはありません。`]],
        };
      }
      const t = r.int(1, 4), s = r.int(0, 1), E = labEdges(t, s);
      const routes = [[0, 1, 3, 8], [0, 2, 5, 7, 8], [0, 1, 4, 6, 8], [0, 2, 3, 6, 8], [0, 1, 3, 7, 8], [0, 2, 3, 7, 8]].concat(s ? [[0, 1, 6, 8]] : []);
      const p = r.pick(routes.filter((q) => q.every((x, i) => i === 0 || E.some(([a, b]) => (a === q[i - 1] && b === x) || (b === q[i - 1] && a === x)))));
      const segs = p.slice(1).map((x, i) => E.find(([a, b]) => (a === p[i] && b === x) || (b === p[i] && a === x)));
      const tot = segs.reduce((acc, e) => acc + e[2], 0), city = segs.some((e) => e[3]);
      return {
        q: [`On the road map in the figure (${settingEn(t, s)}), how long is the route ${pathStr(p, SN)}? Downtown roads cost their printed base weight times the traffic weight.`, `図の道路地図（${settingJa(t, s)}）で、経路 ${pathStr(p, SN)} の長さはいくつですか。中心街の道路は、基本の重みに混雑重みを掛けた値になります。`],
        a: { type: 'int', v: tot },
        hint: ['Add the weights edge by edge; multiply only the downtown ones by the traffic weight.', '辺ごとに重みを足します。混雑重みを掛けるのは中心街の道路だけです。'],
        sol: [[`The edges are ${segs.map((e) => `${SN[e[0]]}–${SN[e[1]]} ${e[3] ? `$${e[2] / t}\\times${t} = ${e[2]}$` : `$${e[2]}$`}`).join(', ')}.`, `辺は ${segs.map((e) => `${SN[e[0]]}–${SN[e[1]]} ${e[3] ? `$${e[2] / t}\\times${t} = ${e[2]}$` : `$${e[2]}$`}`).join('、')} です。`], [`Total: $${segs.map((e) => e[2]).join(' + ')} = ${tot}$.${city ? ' The route passes downtown, so its length grows with the traffic weight.' : ' The route avoids downtown, so its length does not depend on the traffic weight.'}`, `合計は $${segs.map((e) => e[2]).join(' + ')} = ${tot}$ です。${city ? 'この経路は中心街を通るので、長さは混雑重みとともに増えます。' : 'この経路は中心街を避けるので、長さは混雑重みによりません。'}`]],
        set: { traffic: t, shortcut: s },
      };
    },
    (r) => {
      if (r.chance(0.5)) {
        const t = r.int(1, 4), s = r.int(0, 1), E = labEdges(t, s), tg = r.pick([3, 4, 5, 6, 7, 8]);
        const { d, pr, order } = dijkstra(9, E, 0), p = route(pr, tg);
        return {
          q: [`On the road map in the figure with ${settingEn(t, s)}, what is the shortest distance $d(${SN[tg]})$ from $S$?`, `図の道路地図（${settingJa(t, s)}）で、$S$ からの最短距離 $d(${SN[tg]})$ はいくつですか。`],
          a: { type: 'int', v: d[tg] },
          hint: ['Run Dijkstra from $S$: settle the smallest label, relax its edges, repeat until $' + SN[tg] + '$ is settled.', '$S$ からダイクストラ法を実行します。最小のラベルを確定し、その辺を緩和することを $' + SN[tg] + '$ が確定するまで繰り返します。'],
          sol: [[`Downtown roads now cost ${t}× their base weight${s ? ', and the shortcut A–F (weight 4) is open' : ''}.`, `中心街の道路は基本の重みの ${t} 倍で${s ? '、近道 A–F（重み 4）が開いています' : 'す'}。`], [`Dijkstra settles ${order.slice(0, order.indexOf(tg) + 1).map((i) => `${SN[i]} (${d[i]})`).join(', ')}.`, `ダイクストラ法は ${order.slice(0, order.indexOf(tg) + 1).map((i) => `${SN[i]} (${d[i]})`).join('、')} の順に確定します。`], [`So $d(${SN[tg]}) = ${d[tg]}$, along ${pathStr(p, SN)}. Click ${SN[tg]} in the figure to see the route.`, `したがって $d(${SN[tg]}) = ${d[tg]}$ で、経路は ${pathStr(p, SN)} です。図で ${SN[tg]} をクリックすると経路が表示されます。`]],
          set: { traffic: t, shortcut: s },
        };
      }
      const N = 6, E = randGraph(r, N, r.int(3, 4), 1, 9), { d, pr, order } = dijkstra(N, E, 0), p = route(pr, 5);
      return {
        q: [`An undirected graph has the weighted edges ${edgeList(E, GN)}. Find the shortest distance from $S$ to $T$.`, `無向グラフの重み付きの辺は ${edgeList(E, GN)} です。$S$ から $T$ への最短距離を求めてください。`],
        a: { type: 'int', v: d[5] },
        hint: ['Keep a table of tentative labels; each round, settle the smallest and relax its edges.', '暫定ラベルの表を作り、毎回最小のものを確定してその辺を緩和します。'],
        sol: [[`Settling order with final labels: ${order.map((i) => `${GN[i]} (${d[i]})`).join(', ')}.`, `確定の順と最終ラベルは ${order.map((i) => `${GN[i]} (${d[i]})`).join('、')} です。`], [`$d(T) = ${d[5]}$, along ${pathStr(p, GN)}. Each label was final the moment it was the smallest on the frontier, because every other route must still add nonnegative weight.`, `$d(T) = ${d[5]}$ で、経路は ${pathStr(p, GN)} です。各ラベルは前線で最小になった瞬間に最終値です。ほかの経路はまだ非負の重みを足すしかないからです。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const s = r.chance(0.7) ? 0 : 1, tg = r.pick(s ? [4, 5, 7] : [4, 5, 6, 7, 8]), E = labEdges(1, s);
        const adj = seq(9, () => []); E.forEach(([a, b, w, c]) => { adj[a].push([b, w, c]); adj[b].push([a, w, c]); });
        const paths = [], vis = new Array(9).fill(false);
        const rec = (u, f, k, pth) => { if (u === tg) { paths.push([f, k, pth.slice()]); return; } vis[u] = true; for (const [x, w, c] of adj[u]) if (!vis[x]) { pth.push(x); rec(x, c ? f : f + w, c ? k + w : k, pth); pth.pop(); } vis[u] = false; };
        rec(0, 0, 0, [0]);
        const avoid = paths.filter((p) => p[1] === 0).sort((a, b) => a[0] - b[0])[0];
        let best = null; for (const p of paths) if (p[1] > 0) { const ts = (avoid[0] - p[0]) / p[1]; if (!best || ts > best.ts + 1e-12) best = { ts, p }; }
        const num = avoid[0] - best.p[0], den = best.p[1];
        const tSet = Math.max(1, Math.min(4, Math.floor(best.ts + 1e-9)));
        return {
          q: [`On the road map (shortcut ${s ? 'on' : 'off'}), each downtown road costs its base weight times a traffic weight $t$. Treating $t$ as a real number, find the largest $t$ at which a shortest route from $S$ to ${SN[tg]} can still use a downtown road.`, `道路地図（近道${s ? 'あり' : 'なし'}）で、中心街の道路は基本の重みに混雑重み $t$ を掛けた値になります。$t$ を実数とみなして、$S$ から ${SN[tg]} への最短経路がまだ中心街の道路を使い得る最大の $t$ を求めてください。`],
          a: { type: 'num', v: best.ts, show: frac(num, den) },
          hint: ['A route costs $f + kt$, where $f$ is its weight outside downtown and $k$ the base weight inside. Compare each downtown route with the best route that avoids downtown entirely.', '経路の長さは $f + kt$ と書けます。$f$ は中心街の外の重み、$k$ は中心街の中の基本の重みです。中心街を使う各経路を、中心街をまったく通らない最良の経路と比べます。'],
          sol: [[`The best route avoiding downtown is ${pathStr(avoid[2], SN)}, of length $${avoid[0]}$ whatever $t$ is.`, `中心街を避ける最良の経路は ${pathStr(avoid[2], SN)} で、長さは $t$ によらず $${avoid[0]}$ です。`], [`The downtown route that stays competitive longest is ${pathStr(best.p[2], SN)}, of length $${best.p[0]} + ${best.p[1]}t$.`, `最も長く競り合える中心街経由の経路は ${pathStr(best.p[2], SN)} で、長さは $${best.p[0]} + ${best.p[1]}t$ です。`], [`It ties when $${best.p[0]} + ${best.p[1]}t = ${avoid[0]}$, so $t = ${frac(num, den)}${Number.isInteger(best.ts) ? '' : ` \\approx ${n(best.ts, 3)}`}$.`, `$${best.p[0]} + ${best.p[1]}t = ${avoid[0]}$ で同点になるので $t = ${frac(num, den)}${Number.isInteger(best.ts) ? '' : ` \\approx ${n(best.ts, 3)}`}$ です。`], best.ts < 1 ? [`Above this traffic weight every shortest route to ${SN[tg]} skirts downtown, so already at the slider's smallest value $t = 1$ the figure routes around it.`, `これより混雑重みが大きいと、${SN[tg]} への最短経路はすべて中心街を迂回します。したがってスライダーの最小値 $t = 1$ でも、図の経路はすでに中心街を避けます。`] : [`Above this traffic weight every shortest route to ${SN[tg]} skirts downtown. The slider only takes whole values, so compare the routes at $t = ${tSet}$ and $t = ${Math.min(4, tSet + 1)}$.`, `これより混雑重みが大きいと、${SN[tg]} への最短経路はすべて中心街を迂回します。スライダーは整数値だけなので、$t = ${tSet}$ と $t = ${Math.min(4, tSet + 1)}$ で経路を比べてください。`]],
          set: { traffic: tSet, shortcut: s },
        };
      }
      if (form === 1) {
        let a, b, c;
        do { a = r.int(2, 6); b = r.int(a + 1, a + 5); c = r.int(2, 8); } while (b - c >= a);
        return {
          q: [`A directed graph has $S \\to A$ with weight $${a}$, $S \\to B$ with weight $${b}$ and $B \\to A$ with weight $${-c}$. Dijkstra's algorithm is run from $S$ anyway. What label does it leave on $A$, and what is the true shortest distance to $A$?`, `有向グラフに、重み $${a}$ の $S \\to A$、重み $${b}$ の $S \\to B$、重み $${-c}$ の $B \\to A$ があります。それでもダイクストラ法を $S$ から実行します。$A$ に残るラベルと、$A$ への本当の最短距離を答えてください。`],
          a: { type: 'tuple', v: [a, b - c], labels: [['Dijkstra', 'ダイクストラ'], ['true', '真の値']] },
          hint: ['Follow the settling order: which of $A$ and $B$ is settled first, and can a settled label change?', '確定の順をたどります。$A$ と $B$ のどちらが先に確定し、確定したラベルは変わり得るでしょうか。'],
          sol: [[`After $S$, the labels are $d(A) = ${a}$ and $d(B) = ${b}$, so $A$ is settled first, at $${a}$.`, `$S$ の後のラベルは $d(A) = ${a}$、$d(B) = ${b}$ なので、先に $A$ が $${a}$ で確定します。`], [`Settling $B$ then offers $${b} + (${-c}) = ${b - c}$ for $A$, but $A$ is already settled and its label is never revisited.`, `次に $B$ を確定すると $A$ に $${b} + (${-c}) = ${b - c}$ が提示されますが、$A$ はすでに確定していて、そのラベルは見直されません。`], [`The true distance is $${b - c}$ via $S \\to B \\to A$. The proof that a settled label is final assumed that extending a route never shortens it, which a negative edge breaks; Bellman-Ford handles this case.`, `本当の距離は $S \\to B \\to A$ を通る $${b - c}$ です。確定したラベルが最終値だという証明は、経路を延ばしても短くならないことを前提にしており、負の辺はそれを破ります。この場合はベルマン・フォード法を使います。`]],
        };
      }
      let E, res, guard = 0;
      do { E = randGraph(r, 6, r.int(4, 6), 1, 3); res = dijkstra(6, E, 0); } while ((res.cnt[5] < 2 || res.cnt[5] > 6) && guard++ < 60);
      const { d, cnt, order } = res;
      return {
        q: [`An undirected graph has the weighted edges ${edgeList(E, GN)}. How many different shortest routes are there from $S$ to $T$?`, `無向グラフの重み付きの辺は ${edgeList(E, GN)} です。$S$ から $T$ への最短経路は何通りありますか。`],
        a: { type: 'int', v: cnt[5] },
        hint: ['Alongside each label, keep a count: when a route ties the label, add the counts; when it beats the label, replace the count.', '各ラベルと一緒に個数を記録します。経路がラベルと同点なら個数を足し、ラベルを下回るなら個数を置き換えます。'],
        sol: [[`Final labels: ${order.map((i) => `$d(${GN[i]}) = ${d[i]}$`).join(', ')}.`, `最終ラベルは ${order.map((i) => `$d(${GN[i]}) = ${d[i]}$`).join('、')} です。`], [`Counts of shortest routes, in settling order: ${order.map((i) => `${GN[i]}: ${cnt[i]}`).join(', ')}. Each count is the sum over the neighbours $u$ with $d(u) + w = d(v)$.`, `確定の順に最短経路の個数は ${order.map((i) => `${GN[i]}: ${cnt[i]}`).join('、')} です。各個数は $d(u) + w = d(v)$ を満たす隣 $u$ の個数の和です。`], [`So there are $${cnt[5]}$ shortest routes of length $${d[5]}$ to $T$: the shortest distance is unique, the shortest route need not be.`, `したがって $T$ への長さ $${d[5]}$ の最短経路は $${cnt[5]}$ 通りです。最短距離は一つでも、最短経路は一つとは限りません。`]],
      };
    },
  ];

  /* ---------- 2. minimum spanning trees ---------- */
  const KP = [[1, 1.2], [1, 4.4], [3, 0.6], [3, 3.6], [5, 1.6], [5, 4.8], [7, 0.8], [7, 3.8], [9, 1.6], [9, 4.6]];
  const KE = [[0, 1, 4], [0, 2, 3], [1, 3, 5], [0, 3, 6], [2, 3, 2], [2, 4, 7], [3, 4, 4], [3, 5, 6], [1, 5, 8], [4, 5, 3], [4, 6, 5], [5, 7, 7], [4, 7, null], [6, 7, 2], [6, 8, 4], [7, 9, 3], [8, 9, 5], [7, 8, 6]];
  const CAND = 12;
  const kEdges = (w) => KE.map(([a, b, x]) => [a, b, x ?? w]);
  const one = (i) => String(i + 1);
  const NN = ['1', '2', '3', '4', '5', '6', '7'];

  Q.spanning = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const V = r.int(5, 40), E = r.int(V, V * 3);
        const ask = r.int(0, 1);
        return ask
          ? {
            q: [`A connected graph has $${V}$ vertices and $${E}$ edges. How many edges does Kruskal's algorithm reject as closing a cycle?`, `連結グラフの頂点は $${V}$ 個、辺は $${E}$ 本です。クラスカル法が閉路を作るとして除外する辺は何本ですか。`],
            a: { type: 'int', v: E - V + 1 },
            hint: ['Every spanning tree of a connected graph on $V$ vertices has the same number of edges.', '$V$ 頂点の連結グラフの全域木は、どれも同じ本数の辺をもちます。'],
            sol: [[`The tree keeps $V - 1 = ${V - 1}$ edges.`, `木に残るのは $V - 1 = ${V - 1}$ 本です。`], [`The other $E - V + 1 = ${E - V + 1}$ are rejected. That number is the cycle rank: each rejected edge would close exactly one independent cycle.`, `残りの $E - V + 1 = ${E - V + 1}$ 本が除外されます。この数は閉路階数で、除外された各辺はちょうど一つの独立な閉路を閉じます。`]],
          }
          : {
            q: [`How many edges does a spanning tree of a connected graph with $${V}$ vertices have?`, `頂点が $${V}$ 個の連結グラフの全域木は、何本の辺をもちますか。`],
            a: { type: 'int', v: V - 1 },
            hint: ['Start from $V$ isolated vertices: each tree edge joins two components into one.', '$V$ 個の孤立した頂点から始めます。木の辺は一本ごとに二つの成分を一つにします。'],
            sol: [[`Each accepted edge reduces the number of components by one, from $${V}$ to $1$.`, `採用した辺は一本ごとに成分の数を一つ減らし、$${V}$ から $1$ にします。`], [`So the tree has $${V} - 1 = ${V - 1}$ edges, whatever the weights: the minimum spanning tree differs from other spanning trees in which edges it uses, not how many.`, `したがって木の辺は重みによらず $${V} - 1 = ${V - 1}$ 本です。最小全域木がほかの全域木と違うのは、使う辺の種類であって本数ではありません。`]],
          };
      }
      if (form === 1) {
        const cut = r.int(1, 4), w = r.int(1, 9), E = kEdges(w), left = (i) => KP[i][0] < 2 * cut;
        const cr = E.map((e, i) => i).filter((i) => left(E[i][0]) !== left(E[i][1])), mw = Math.min(...cr.map((i) => E[i][2]));
        return {
          q: [`In the figure, put the cut at position $${cut}$ and the candidate edge 5–8 at weight $${w}$. What is the weight of the lightest edge crossing the cut?`, `図でカットの位置を $${cut}$、候補の辺 5–8 の重みを $${w}$ にします。カットを横切る最も軽い辺の重みはいくつですか。`],
          a: { type: 'int', v: mw },
          hint: ['List the edges with one end on each side of the dashed line.', '破線の両側に端点を一つずつもつ辺を書き出します。'],
          sol: [[`The crossing edges are ${cr.map((i) => `${one(E[i][0])}–${one(E[i][1])} (${E[i][2]})`).join(', ')}.`, `横切る辺は ${cr.map((i) => `${one(E[i][0])}–${one(E[i][1])} (${E[i][2]})`).join('、')} です。`], [`The lightest weighs $${mw}$. By the cut property it belongs to a minimum spanning tree: any tree must cross the cut somewhere, and crossing it more cheaply is impossible.`, `最も軽いのは $${mw}$ です。カット性質により、この辺はある最小全域木に含まれます。どの木もどこかでカットを横切らねばならず、これより安く横切ることはできないからです。`]],
          set: { cut, w },
        };
      }
      const k = r.int(3, 9);
      return {
        q: [`Which graph has exactly one spanning tree: the cycle $C_{${k}}$, the path $P_{${k}}$, or the complete graph $K_{${k}}$?`, `全域木をちょうど一つもつのはどれですか。閉路 $C_{${k}}$、道 $P_{${k}}$、完全グラフ $K_{${k}}$ のうちから選んでください。`],
        a: { type: 'choice', opts: [[`$P_{${k}}$: it is already a tree`, `$P_{${k}}$：それ自身がすでに木だから`], [`$C_{${k}}$: it has the fewest edges after a path`, `$C_{${k}}$：道の次に辺が少ないから`], [`$K_{${k}}$: it is the most symmetric`, `$K_{${k}}$：最も対称性が高いから`]], v: 0 },
        hint: ['A spanning tree uses every vertex and $V - 1$ edges. How many edges does each graph have?', '全域木はすべての頂点と $V - 1$ 本の辺を使います。各グラフの辺は何本でしょうか。'],
        sol: [[`$P_{${k}}$ has $${k - 1}$ edges, exactly $V - 1$, so its only spanning tree is itself.`, `$P_{${k}}$ の辺は $${k - 1}$ 本でちょうど $V - 1$ なので、全域木はそれ自身だけです。`], [`$C_{${k}}$ has $${k}$ spanning trees (delete any one edge), and $K_{${k}}$ has $${k}^{${k - 2}} = ${k ** (k - 2)}$ by Cayley's formula.`, `$C_{${k}}$ の全域木は $${k}$ 個（どれか一辺を除く）、$K_{${k}}$ はケイリーの公式により $${k}^{${k - 2}} = ${k ** (k - 2)}$ 個です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const w = r.int(1, 9), E = kEdges(w), { acc, w: W } = kruskal(10, E);
        return {
          q: [`In the figure, set the candidate edge 5–8 to weight $${w}$. What is the total weight $w(T)$ of the minimum spanning tree?`, `図で候補の辺 5–8 の重みを $${w}$ にします。最小全域木の重みの合計 $w(T)$ はいくつですか。`],
          a: { type: 'int', v: W },
          hint: ['Run Kruskal: sort the edges by weight and keep each one that joins two different components.', 'クラスカル法を実行します。辺を重みの順に並べ、異なる成分を結ぶものだけを残します。'],
          sol: [[`Kruskal accepts, in order: ${acc.map((i) => `${one(E[i][0])}–${one(E[i][1])} (${E[i][2]})`).join(', ')}.`, `クラスカル法は ${acc.map((i) => `${one(E[i][0])}–${one(E[i][1])} (${E[i][2]})`).join('、')} の順に採用します。`], [`That is $${acc.length}$ edges, as a tree on 10 vertices must have, with $w(T) = ${acc.map((i) => E[i][2]).join(' + ')} = ${W}$.`, `10 頂点の木に必要な $${acc.length}$ 本で、$w(T) = ${acc.map((i) => E[i][2]).join(' + ')} = ${W}$ です。`], [acc.includes(CAND) ? 'The candidate 5–8 is in the tree at this weight.' : 'The candidate 5–8 is not in the tree at this weight: a lighter route between 5 and 8 already exists.', acc.includes(CAND) ? 'この重みでは候補 5–8 は木に含まれます。' : 'この重みでは候補 5–8 は木に含まれません。5 と 8 の間にもっと軽い経路がすでにあるからです。']],
          set: { w },
        };
      }
      let E, N = r.int(5, 6), wts;
      do { E = randGraph(r, N, r.int(2, 4), 1, 12); wts = E.map((e) => e[2]); } while (new Set(wts).size < wts.length);
      if (form === 1) {
        const { acc, rej, w: W } = kruskal(N, E);
        return {
          q: [`A graph on the vertices ${NN.slice(0, N).join(', ')} has the weighted edges ${edgeList(E, NN)}. What is the weight of its minimum spanning tree?`, `頂点 ${NN.slice(0, N).join('、')} のグラフの重み付きの辺は ${edgeList(E, NN)} です。最小全域木の重みはいくつですか。`],
          a: { type: 'int', v: W },
          hint: ['Kruskal: lightest edge first, skipping any edge whose ends are already connected.', 'クラスカル法：軽い辺から順に取り、両端がすでにつながっている辺は飛ばします。'],
          sol: [[`Accepted: ${acc.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join(', ')}. Rejected as closing a cycle: ${rej.length ? rej.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join(', ') : 'none'}.`, `採用：${acc.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join('、')}。閉路を作るので除外：${rej.length ? rej.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join('、') : 'なし'}。`], [`$w(T) = ${acc.map((i) => E[i][2]).join(' + ')} = ${W}$. The weights are all different, so this minimum tree is the only one.`, `$w(T) = ${acc.map((i) => E[i][2]).join(' + ')} = ${W}$ です。重みがすべて異なるので、最小全域木はこれ一つだけです。`]],
        };
      }
      const s = r.int(0, N - 1), added = prim(N, E, s), k = r.int(2, Math.min(4, N - 1));
      const e = E[added[k - 1]];
      return {
        q: [`A graph on the vertices ${NN.slice(0, N).join(', ')} has the weighted edges ${edgeList(E, NN)}. Prim's algorithm starts at vertex ${NN[s]}. What is the weight of the edge it adds ${k === 2 ? 'second' : k === 3 ? 'third' : 'fourth'}?`, `頂点 ${NN.slice(0, N).join('、')} のグラフの重み付きの辺は ${edgeList(E, NN)} です。プリム法を頂点 ${NN[s]} から始めます。${k} 番目に加わる辺の重みはいくつですか。`],
        a: { type: 'int', v: e[2] },
        hint: ['Prim grows one tree: each step adds the lightest edge with exactly one end in the tree so far.', 'プリム法は一本の木を育てます。各段階で、片方の端だけが今の木にある辺のうち最も軽いものを加えます。'],
        sol: [[`The edges are added in the order ${added.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join(', ')}.`, `辺は ${added.map((i) => `${NN[E[i][0]]}–${NN[E[i][1]]} (${E[i][2]})`).join('、')} の順に加わります。`], [`Edge number ${k} is ${NN[e[0]]}–${NN[e[1]]} with weight $${e[2]}$. Every Prim step is the cut property applied to the cut between the tree so far and the rest, which is why Prim and Kruskal end at the same tree here.`, `${k} 番目の辺は重み $${e[2]}$ の ${NN[e[0]]}–${NN[e[1]]} です。プリム法の各段階は、今の木と残りの間のカットにカット性質を当てはめたものなので、ここではプリム法とクラスカル法は同じ木に行き着きます。`]],
      };
    },
    (r) => {
      const form = r.int(0, 3);
      if (form === 0) {
        // the cycle property: 5-8 enters every MST iff its weight is below the heaviest edge on the tree path joining 5 and 8 without it
        const E = KE.map(([a, b, x]) => [a, b, x ?? 99]).filter((e, i) => i !== CAND), { acc } = kruskal(10, E);
        const adj = seq(10, () => []); acc.forEach((i) => { const [a, b, w] = E[i]; adj[a].push([b, w]); adj[b].push([a, w]); });
        const path = (u, t, prev) => { if (u === t) return []; for (const [x, w] of adj[u]) if (x !== prev) { const p = path(x, t, u); if (p) return [[u, x, w], ...p]; } return null; };
        const pth = path(4, 7, -1), M = Math.max(...pth.map((e) => e[2]));
        const ask = r.int(0, 1);
        return {
          q: [ask ? 'In the figure, what is the largest integer weight of the candidate edge 5–8 for which it belongs to every minimum spanning tree?' : 'In the figure, what is the smallest integer weight of the candidate edge 5–8 for which some minimum spanning tree avoids it?', ask ? '図で、候補の辺 5–8 がすべての最小全域木に含まれるような最大の整数の重みはいくつですか。' : '図で、候補の辺 5–8 を含まない最小全域木が存在するような最小の整数の重みはいくつですか。'],
          a: { type: 'int', v: ask ? M - 1 : M },
          hint: ['Build the minimum tree without 5–8 and look at the path it uses to join 5 and 8. The cycle property compares 5–8 with the heaviest edge on that path.', '5–8 を除いた最小全域木を作り、それが 5 と 8 を結ぶ経路を見ます。閉路性質は、5–8 をその経路上で最も重い辺と比べます。'],
          sol: [[`Without 5–8, the minimum tree joins 5 and 8 by ${pth.map((e) => `${one(e[0])}–${one(e[1])} (${e[2]})`).join(', ')}; the heaviest of these weighs $${M}$.`, `5–8 を除くと、最小全域木は 5 と 8 を ${pth.map((e) => `${one(e[0])}–${one(e[1])} (${e[2]})`).join('、')} で結び、その中で最も重いのは $${M}$ です。`], [`Adding 5–8 closes a cycle with that path. If $w < ${M}$, swapping 5–8 in for the weight-$${M}$ edge makes the tree lighter, so 5–8 is in every minimum tree; if $w = ${M}$ the swap ties and both trees are minimum; if $w > ${M}$, 5–8 is the heaviest edge on a cycle and no minimum tree uses it.`, `5–8 を加えるとその経路と閉路ができます。$w < ${M}$ なら重さ $${M}$ の辺と入れ替えて木が軽くなるので、5–8 はすべての最小全域木に入ります。$w = ${M}$ なら入れ替えても同点で、どちらの木も最小です。$w > ${M}$ なら 5–8 は閉路の中で最も重く、どの最小全域木も使いません。`], [ask ? `So the answer is $${M - 1}$.` : `So the answer is $${M}$, the tie.`, ask ? `したがって答えは $${M - 1}$ です。` : `したがって答えは同点となる $${M}$ です。`]],
          set: { w: ask ? M - 1 : M },
        };
      }
      if (form === 1) {
        let N, E, Lp, tau;
        do {
          N = r.int(4, 5); E = randGraph(r, N, r.int(1, N === 4 ? 2 : 4), 1, 1);
          Lp = seq(N, (i) => seq(N, (j) => (i === j ? E.filter((e) => e[0] === i || e[1] === i).length : E.some((e) => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i)) ? -1 : 0)));
          tau = det(Lp.slice(1).map((row) => row.slice(1)));
        } while (tau < 3);
        return {
          q: [`How many spanning trees does the graph on the vertices ${NN.slice(0, N).join(', ')} with the edges ${edgeList(E, NN, false)} have?`, `頂点 ${NN.slice(0, N).join('、')}、辺 ${edgeList(E, NN, false)} のグラフの全域木はいくつありますか。`],
          a: { type: 'int', v: tau },
          hint: ['Matrix-tree theorem: delete one row and the matching column of the Laplacian $L = D - A$ and take the determinant.', '行列木定理：ラプラシアン $L = D - A$ から一つの行と対応する列を除き、行列式をとります。'],
          sol: [[`The Laplacian (degrees on the diagonal, $-1$ for each edge) is $${mat(Lp)}$.`, `ラプラシアン（対角に次数、辺ごとに $-1$）は $${mat(Lp)}$ です。`], [`Deleting the first row and column leaves a ${N - 1}×${N - 1} matrix whose determinant is $${tau}$.`, `第1行と第1列を除いた ${N - 1}×${N - 1} 行列の行列式は $${tau}$ です。`], [`So there are $${tau}$ spanning trees. Any row and column give the same answer, because the Laplacian's rows sum to zero.`, `したがって全域木は $${tau}$ 個です。ラプラシアンの各行の和は 0 なので、どの行と列を除いても同じ答えになります。`]],
        };
      }
      if (form === 2) {
        const p = r.int(1, 4), q = r.int(2, 5), s = r.int(2, 5);
        const tau = p * q + q * s + s * p;
        return {
          q: [`Two vertices $u$ and $v$ are joined by three internally disjoint paths with $${p}$, $${q}$ and $${s}$ edges. How many spanning trees does this graph have?`, `二つの頂点 $u$ と $v$ が、辺の数が $${p}$、$${q}$、$${s}$ の互いに内部で交わらない三本の道で結ばれています。このグラフの全域木はいくつありますか。`],
          a: { type: 'int', v: tau },
          hint: ['The graph has two independent cycles, so a spanning tree deletes exactly two edges. They must lie on different paths.', 'このグラフには独立な閉路が二つあるので、全域木はちょうど二本の辺を除きます。その二本は異なる道の上にあるはずです。'],
          sol: [[`Edges minus vertices plus one: $${p + q + s} - ${p + q + s - 1} + 1 = 2$ edges must go.`, `辺の数 − 頂点の数 + 1 は $${p + q + s} - ${p + q + s - 1} + 1 = 2$ なので、除く辺は二本です。`], ['Removing two edges from the same path cuts off its middle; removing one edge from each of two different paths leaves a tree.', '同じ道から二本除くとその途中が切り離されます。異なる二本の道から一本ずつ除くと木が残ります。'], [`So $\\tau = ${p}\\cdot${q} + ${q}\\cdot${s} + ${s}\\cdot${p} = ${tau}$, which the matrix-tree theorem confirms.`, `したがって $\\tau = ${p}\\cdot${q} + ${q}\\cdot${s} + ${s}\\cdot${p} = ${tau}$ で、行列木定理でも確かめられます。`]],
        };
      }
      const m = r.int(2, 3);
      const forms = [
        { g: 'K_n', v: 'n^(n-2)', en: 'the complete graph $K_n$', ja: '完全グラフ $K_n$', dom: [3, 7] },
        { g: `K_{${m},n}`, v: `n^(${m}-1)*${m}^(n-1)`, tex: `${m === 2 ? 'n' : `n^{${m - 1}}`}\\cdot ${m}^{n-1}`, en: `the complete bipartite graph $K_{${m},n}$`, ja: `完全二部グラフ $K_{${m},n}$`, dom: [2, 6] },
      ];
      const F = forms[r.int(0, 1)];
      return {
        q: [`Write the number of spanning trees of ${F.en} as a function of $n$.`, `${F.ja} の全域木の個数を $n$ の式で表してください。`],
        a: { type: 'expr', v: F.v, vars: ['n'], dom: { n: F.dom }, lhs: ['$\\tau =$', '$\\tau =$'] },
        hint: ['Use the matrix-tree theorem, or check small cases and guess: count the trees for $n = 2, 3, 4$.', '行列木定理を使うか、$n = 2, 3, 4$ の場合を数えて形を推測します。'],
        sol: F.g === 'K_n'
          ? [['The Laplacian of $K_n$ is $nI - J$. Its eigenvalues are $0$ once and $n$ with multiplicity $n - 1$.', '$K_n$ のラプラシアンは $nI - J$ で、固有値は $0$ が一回、$n$ が $n - 1$ 回です。'], ['The matrix-tree theorem in eigenvalue form gives $\\tau = \\tfrac1n\\prod_{\\lambda\\ne0}\\lambda = \\tfrac1n n^{n-1} = n^{n-2}$.', '固有値による行列木定理から $\\tau = \\tfrac1n\\prod_{\\lambda\\ne0}\\lambda = \\tfrac1n n^{n-1} = n^{n-2}$ です。'], ['This is Cayley\'s formula: $3$ trees on 3 labelled vertices, $16$ on 4, $125$ on 5. It counts labelled trees, so the same shape is counted once for each labelling.', 'これがケイリーの公式で、ラベル付き頂点 3 個で $3$、4 個で $16$、5 個で $125$ です。ラベル付きの木を数えるので、同じ形でもラベルの付け方ごとに数えます。']]
          : [[`The Laplacian of $K_{${m},n}$ has eigenvalues $0$, $${m} + n$ once, $n$ with multiplicity $${m - 1}$ and $${m}$ with multiplicity $n - 1$.`, `$K_{${m},n}$ のラプラシアンの固有値は $0$、$${m} + n$ が一回、$n$ が $${m - 1}$ 回、$${m}$ が $n - 1$ 回です。`], [`$\\tau = \\dfrac{1}{${m} + n}(${m} + n)\\,n^{${m - 1}}\\,${m}^{n-1} = ${F.tex}$.`, `$\\tau = \\dfrac{1}{${m} + n}(${m} + n)\\,n^{${m - 1}}\\,${m}^{n-1} = ${F.tex}$ です。`], [m === 1 ? 'Check: $K_{1,n}$ is a star, already a tree, and the formula gives $1$.' : `Check: $K_{2,2}$ is a 4-cycle with $4$ spanning trees, and the formula gives $2\\cdot2 = 4$.`, m === 1 ? '確認：$K_{1,n}$ は星形ですでに木であり、式も $1$ を与えます。' : '確認：$K_{2,2}$ は全域木が $4$ 個の 4 閉路で、式も $2\\cdot2 = 4$ を与えます。']],
      };
    },
  ];

  /* ---------- 3. centrality on the lab's two-group network ---------- */
  function buildNet(hub, extra) {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'X'], E = [];
    const inner = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [1, 3], [2, 4]];
    inner.forEach(([a, b]) => { E.push([a, b]); E.push([a + 5, b + 5]); });
    E.push([1, 10], [4, 10], [6, 10], [9, 10]);
    for (let k = 0; k < hub; k++) { names.push(['p', 'q', 'r', 's'][k]); E.push([2, names.length - 1]); }
    [[1, 6], [4, 9], [0, 5]].slice(0, extra).forEach(([a, b]) => E.push([a, b]));
    return { names, E };
  }
  function measures(N, E) {
    const adj = seq(N, () => []); E.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const deg = adj.map((a) => a.length), sumd = [], bet = new Array(N).fill(0);
    for (let s = 0; s < N; s++) {
      const d = new Array(N).fill(-1), sg = new Array(N).fill(0), Pr = seq(N, () => []), S = [], q = [s];
      d[s] = 0; sg[s] = 1;
      while (q.length) { const u = q.shift(); S.push(u); for (const w of adj[u]) { if (d[w] < 0) { d[w] = d[u] + 1; q.push(w); } if (d[w] === d[u] + 1) { sg[w] += sg[u]; Pr[w].push(u); } } }
      sumd.push(d.reduce((a, b) => a + b, 0));
      const del = new Array(N).fill(0);
      while (S.length) { const w = S.pop(); for (const u of Pr[w]) del[u] += sg[u] / sg[w] * (1 + del[w]); if (w !== s) bet[w] += del[w]; }
    }
    return { deg, sumd, bet: bet.map((b) => b / 2) }; // bet: unnormalized, unordered pairs
  }
  const pl = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const withEn = (hub, extra) => `${pl(hub, 'leaf', 'leaves')} on C and ${pl(extra, 'extra link', 'extra links')}`;
  const net = (hub, extra) => { const { names, E } = buildNet(hub, extra), N = names.length; return Object.assign({ names, E, N }, measures(N, E)); };

  Q.centrality = [
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        const hub = r.int(0, 4), extra = r.int(0, 3), G = net(hub, extra), i = r.pick([1, 2, 4, 10, 0, 6]);
        return {
          q: [`In the figure with ${withEn(hub, extra)}, what is the degree centrality $C_D = \\deg v/(n-1)$ of node ${G.names[i]}?`, `図で C の葉が ${hub} 個、追加リンクが ${extra} 本のとき、ノード ${G.names[i]} の次数中心性 $C_D = \\deg v/(n-1)$ はいくつですか。`],
          a: { type: 'num', v: G.deg[i] / (G.N - 1), show: frac(G.deg[i], G.N - 1) },
          hint: ['Count the edges at the node, and count all the nodes in the drawing.', 'そのノードの辺の数と、図のすべてのノードの数を数えます。'],
          sol: [[`The graph has $n = 11 + ${hub} = ${G.N}$ nodes, and ${G.names[i]} has degree $${G.deg[i]}$.`, `グラフのノードは $n = 11 + ${hub} = ${G.N}$ 個で、${G.names[i]} の次数は $${G.deg[i]}$ です。`], [`$C_D = ${G.deg[i]}/${G.N - 1} = ${n(G.deg[i] / (G.N - 1), 4)}$, the fraction of the other nodes it touches directly.`, `$C_D = ${G.deg[i]}/${G.N - 1} = ${n(G.deg[i] / (G.N - 1), 4)}$ で、ほかのノードのうち直接つながっている割合です。`]],
          set: { hub, bridge: extra, measure: 0 },
        };
      }
      if (form === 1) {
        let ds, sum;
        do { ds = seq(r.int(5, 8), () => r.int(1, 5)); sum = ds.reduce((a, b) => a + b, 0); } while (sum % 2);
        return {
          q: [`A graph has the degree sequence $${ds.join(', ')}$. How many edges does it have?`, `グラフの次数列は $${ds.join(', ')}$ です。辺は何本ありますか。`],
          a: { type: 'int', v: sum / 2 },
          hint: ['Each edge has two ends, and each end adds one to some degree.', '辺には端が二つあり、端一つが次数を一つずつ増やします。'],
          sol: [[`The degrees add up to $${ds.join(' + ')} = ${sum}$.`, `次数の和は $${ds.join(' + ')} = ${sum}$ です。`], [`By the handshake lemma $\\sum \\deg v = 2|E|$, so $|E| = ${sum / 2}$. The same lemma says the number of odd-degree vertices is always even.`, `握手補題 $\\sum \\deg v = 2|E|$ より $|E| = ${sum / 2}$ です。同じ補題から、次数が奇数の頂点の数は常に偶数です。`]],
        };
      }
      const k = r.int(3, 12), who = r.int(0, 1), N = k + 1;
      const v = who ? 1 : k / (2 * k - 1);
      return {
        q: [`A star has one centre joined to $${k}$ leaves. What is the closeness centrality $C_C = (n-1)/\\sum_u d(u, v)$ of ${who ? 'the centre' : 'a leaf'}?`, `星形グラフは中心一つが $${k}$ 個の葉とつながったものです。${who ? '中心' : '葉の一つ'}の近接中心性 $C_C = (n-1)/\\sum_u d(u, v)$ はいくつですか。`],
        a: { type: 'num', v, show: who ? '1' : frac(k, 2 * k - 1) },
        hint: ['List the distances from the node to every other node.', 'そのノードからほかのすべてのノードへの距離を書き出します。'],
        sol: who
          ? [[`The centre is at distance $1$ from all $${k}$ leaves, so $\\sum d = ${k}$ and $n - 1 = ${k}$.`, `中心は $${k}$ 個の葉すべてから距離 $1$ なので $\\sum d = ${k}$、$n - 1 = ${k}$ です。`], ['$C_C = 1$, the largest value possible: the centre is one step from everyone.', '$C_C = 1$ で、とり得る最大値です。中心は誰からも一歩です。']]
          : [[`A leaf is $1$ from the centre and $2$ from each of the other $${k - 1}$ leaves: $\\sum d = 1 + 2\\cdot${k - 1} = ${2 * k - 1}$.`, `葉は中心から $1$、ほかの $${k - 1}$ 個の葉からそれぞれ $2$ なので $\\sum d = 1 + 2\\cdot${k - 1} = ${2 * k - 1}$ です。`], [`$C_C = ${N - 1}/${2 * k - 1} = ${n(v, 4)}$, which tends to $1/2$ as the star grows: every leaf is two steps from almost everyone.`, `$C_C = ${N - 1}/${2 * k - 1} = ${n(v, 4)}$ で、星が大きくなると $1/2$ に近づきます。どの葉もほとんど全員から二歩です。`]],
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 2) {
        const N = r.int(4, 11), i = r.int(2, N - 1), b = (i - 1) * (N - i);
        return {
          q: [`In the path $P_{${N}}$ with vertices $1, 2, \\dots, ${N}$ in order, what is the (unnormalized) betweenness of vertex $${i}$, the number of pairs whose shortest path passes through it?`, `頂点が順に $1, 2, \\dots, ${N}$ と並ぶ道 $P_{${N}}$ で、頂点 $${i}$ の（規格化しない）媒介中心性、つまり最短経路がそこを通る組の数はいくつですか。`],
          a: { type: 'int', v: b },
          hint: ['In a path each pair has exactly one shortest path. It passes through vertex $i$ exactly when the pair lies on opposite sides of $i$.', '道では各組の最短経路はちょうど一本です。それが頂点 $i$ を通るのは、組が $i$ の両側にあるときだけです。'],
          sol: [[`There are $${i - 1}$ vertices to the left of $${i}$ and $${N - i}$ to the right.`, `$${i}$ の左に $${i - 1}$ 個、右に $${N - i}$ 個の頂点があります。`], [`Each left-right pair contributes $1$, so the betweenness is $${i - 1}\\cdot${N - i} = ${b}$, largest in the middle of the path.`, `左右の組がそれぞれ $1$ を与えるので、媒介中心性は $${i - 1}\\cdot${N - i} = ${b}$ で、道の中央で最大になります。`]],
        };
      }
      const hub = r.int(0, 4), extra = r.int(0, 3), G = net(hub, extra), N = G.N;
      if (form === 0) {
        const i = r.pick([10, 2, 1, 4]), c = (N - 1) / G.sumd[i];
        return {
          q: [`In the figure with ${withEn(hub, extra)}, find the closeness centrality of node ${G.names[i]}. Give three decimals.`, `図で C の葉が ${hub} 個、追加リンクが ${extra} 本のとき、ノード ${G.names[i]} の近接中心性を求めてください（小数第3位まで）。`],
          a: { type: 'num', v: c, tol: 6e-4, show: frac(N - 1, G.sumd[i]) },
          hint: ['Find the distance from the node to every other node by breadth-first search, add them, and divide $n - 1$ by the sum.', '幅優先探索でそのノードからほかの各ノードへの距離を求めて足し、$n - 1$ をその和で割ります。'],
          sol: [[`There are $n = ${N}$ nodes. Breadth-first search from ${G.names[i]} gives distances adding up to $\\sum d = ${G.sumd[i]}$.`, `ノードは $n = ${N}$ 個です。${G.names[i]} からの幅優先探索で、距離の和は $\\sum d = ${G.sumd[i]}$ です。`], [`$C_C = ${N - 1}/${G.sumd[i]} = ${n(c, 4)}$: the reciprocal of the average distance from ${G.names[i]} to the others.`, `$C_C = ${N - 1}/${G.sumd[i]} = ${n(c, 4)}$ で、${G.names[i]} からほかのノードへの平均距離の逆数です。`]],
          set: { hub, bridge: extra, measure: 1 },
        };
      }
      const i = r.pick([10, 2]), bn = G.bet[i] / ((N - 1) * (N - 2) / 2);
      return {
        q: [`In the figure with ${withEn(hub, extra)}, the unnormalized betweenness of ${G.names[i]} is $${n(G.bet[i], 4)}$. What is its normalized betweenness, as in the readout? Give three decimals.`, `図で C の葉が ${hub} 個、追加リンクが ${extra} 本のとき、${G.names[i]} の規格化しない媒介中心性は $${n(G.bet[i], 4)}$ です。読み取り欄と同じ規格化をした媒介中心性はいくつですか（小数第3位まで）。`],
        a: { type: 'num', v: bn, tol: 6e-4 },
        hint: ['Divide by the number of unordered pairs of nodes that do not include the node itself.', 'そのノード自身を含まない、順序のないノードの組の数で割ります。'],
        sol: [[`With $n = ${N}$ there are $\\binom{${N - 1}}{2} = ${(N - 1) * (N - 2) / 2}$ pairs not involving ${G.names[i]}.`, `$n = ${N}$ なので、${G.names[i]} を含まない組は $\\binom{${N - 1}}{2} = ${(N - 1) * (N - 2) / 2}$ 個です。`], [`$${n(G.bet[i], 4)}/${(N - 1) * (N - 2) / 2} = ${n(bn, 4)}$: the share of all such pairs whose shortest paths run through ${G.names[i]}${i === 10 ? ', which drops as the extra links give the two groups routes that avoid X' : ''}.`, `$${n(G.bet[i], 4)}/${(N - 1) * (N - 2) / 2} = ${n(bn, 4)}$ で、そうした組のうち最短経路が ${G.names[i]} を通る割合です${i === 10 ? '。追加リンクが X を避ける経路を与えると、この値は下がります' : ''}。`]],
        set: { hub, bridge: extra, measure: 2 },
      };
    },
    (r) => {
      const form = r.int(0, 2);
      if (form === 0) {
        let hub, extra, G, mx, top, guard = 0;
        do { hub = r.int(0, 4); extra = r.int(0, 3); G = net(hub, extra); mx = Math.max(...G.bet); top = G.bet.indexOf(mx); } while (G.bet.filter((b) => b > mx - 0.5).length > 1 && guard++ < 50);
        const cands = [10, 2, 1, 4].filter((i, k, a) => a.indexOf(i) === k);
        if (!cands.includes(top)) cands.push(top);
        const opts = cands.map((i) => [`${G.names[i]}`, `${G.names[i]}`]);
        return {
          q: [`With ${withEn(hub, extra)} between the groups, which node has the highest betweenness?`, `C の葉が ${hub} 個、群の間の追加リンクが ${extra} 本のとき、媒介中心性が最も高いノードはどれですか。`],
          a: { type: 'choice', opts, v: cands.indexOf(top) },
          hint: ['Betweenness rewards lying on shortest paths between many pairs. Ask which pairs have no way around a node, and how many such pairs there are.', '媒介中心性は、多くの組の最短経路上にあることを評価します。どの組がそのノードを避けられないか、その組がいくつあるかを考えます。'],
          sol: [[`Unnormalized betweenness: ${cands.map((i) => `${G.names[i]} ${n(G.bet[i], 3)}`).join(', ')}.`, `規格化しない媒介中心性は ${cands.map((i) => `${G.names[i]} ${n(G.bet[i], 3)}`).join('、')} です。`], top === 10
            ? [`X wins: the ${5 + hub}·5 = ${5 * (5 + hub)} pairs split between the groups ${extra ? 'mostly still' : 'all'} have to cross it${extra ? ', even with the extra links' : ''}.`, `X が最大です。群をまたぐ ${5 + hub}·5 = ${5 * (5 + hub)} 組${extra ? 'の多くは、追加リンクがあってもまだ' : 'はすべて'} X を通らざるを得ません。`]
            : top === 2
              ? [`C wins: each of its ${hub} leaves can reach the rest of the graph only through C, ${extra ? 'and the extra links let cross-group pairs bypass X' : 'which outweighs even the cross-group traffic through X'}.`, `C が最大です。${hub} 個の葉はそれぞれ C を通ってしかグラフの残りへ行けず、${extra ? '追加リンクによって群をまたぐ組は X を迂回できるからです' : 'それが X を通る群間の流れさえ上回ります'}。`]
              : [`${G.names[top]} wins: the extra links let cross-group pairs bypass X, and ${G.names[top]} sits on many of the new routes.`, `${G.names[top]} が最大です。追加リンクによって群をまたぐ組は X を迂回でき、${G.names[top]} はその新しい経路の多くの上にあります。`], ['High degree and high betweenness are different things: a node with few links can still be the only door between two communities.', '次数が高いことと媒介中心性が高いことは別物です。リンクが少なくても、二つの共同体の間の唯一の扉になり得ます。']],
          set: { hub, bridge: extra, measure: 2 },
        };
      }
      const which = r.int(0, 2);
      const F = [
        { v: 'n*(n-1)/2', en: 'the centre of a star with $n$ leaves', ja: '$n$ 個の葉をもつ星形グラフの中心', dom: [2, 9], sol: [['Every pair of leaves is joined only through the centre, by a path of length 2.', '葉の組はすべて、中心を通る長さ 2 の道でしか結ばれていません。'], ['There are $\\binom n2 = n(n-1)/2$ such pairs, each contributing $1$.', 'そうした組は $\\binom n2 = n(n-1)/2$ 個で、それぞれ $1$ を与えます。']] },
        { v: 'm^2', en: 'a vertex $x$ joined to every vertex of two disjoint complete graphs $K_m$ (and to nothing else)', ja: '互いに交わらない二つの完全グラフ $K_m$ のすべての頂点とつながる頂点 $x$（ほかとはつながらない）', dom: [1, 8], vn: 'm', sol: [['Two vertices in the same $K_m$ are adjacent, so they contribute nothing.', '同じ $K_m$ の二頂点は隣接しているので何も与えません。'], ['A vertex in one clique and a vertex in the other are joined only by the path through $x$, and there are $m\\cdot m$ such pairs, so the betweenness is $m^2$.', '別々の完全グラフの二頂点は $x$ を通る道でしか結ばれず、そうした組は $m\\cdot m$ 個なので、媒介中心性は $m^2$ です。']] },
        { v: '(m-1)^2/4', en: 'the middle vertex of the path $P_m$ ($m$ odd)', ja: '道 $P_m$（$m$ は奇数）の中央の頂点', dom: [3, 11], vn: 'm', sol: [['The middle vertex has $(m-1)/2$ vertices on each side.', '中央の頂点の両側にはそれぞれ $(m-1)/2$ 個の頂点があります。'], ['Every pair with one vertex on each side has its unique shortest path through it: $\\left(\\tfrac{m-1}{2}\\right)^2$.', '両側に一つずつ頂点をもつ組の最短経路はただ一つで、そこを通るので $\\left(\\tfrac{m-1}{2}\\right)^2$ です。']] },
      ][which];
      const vn = F.vn || 'n';
      return {
        q: [`Write the unnormalized betweenness of ${F.en} as a function of $${vn}$.`, `${F.ja}の規格化しない媒介中心性を $${vn}$ の式で表してください。`],
        a: { type: 'expr', v: F.v, vars: [vn], dom: { [vn]: F.dom }, lhs: ['$C_B =$', '$C_B =$'] },
        hint: ['Count the pairs of other vertices whose every shortest path must pass through the vertex.', 'ほかの頂点の組のうち、最短経路がすべてその頂点を通らざるを得ないものを数えます。'],
        sol: F.sol.concat([[which === 1 ? 'That is the lab\'s bridge X in its purest form: degree $2m$, but every cross-group conversation runs through it.' : 'Betweenness grows quadratically, because it counts pairs, while degree grows only linearly.', which === 1 ? 'これは実験の橋 X の最も純粋な形です。次数は $2m$ ですが、群をまたぐすべてのやりとりがそこを通ります。' : '媒介中心性は組を数えるので二次で増え、次数は一次でしか増えません。']]),
      };
    },
  ];
})();
