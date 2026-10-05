/* Callouts: labels that sit in two clean columns beside a 3D stage, each tied
 * to its point on the model by a leader line, and never overlapping.
 *
 *   const co = createCallouts(host, { top: 70, bottom: 110 });
 *   co.set([{ id, text, world: () => Vector3, side?: 'left'|'right', priority? }]);
 *   co.update(camera);             // every frame the camera or the model moves
 *   co.setHidden(id => bool);      // e.g. occlusion
 * opts.bounds(camera, W, H) -> { minX, maxX } in stage pixels: the model's silhouette, which the columns avoid
 */
const SVGNS = 'http://www.w3.org/2000/svg';

export function createCallouts(host, opts = {}) {
  const layer = document.createElement('div'); layer.className = 'callouts'; layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('class', 'callout-lines'); layer.appendChild(svg);
  host.appendChild(layer);
  let items = [], hidden = () => false, visible = true;
  const v = { x: 0, y: 0, z: 0 };

  function set(list) {
    for (const it of items) it.el.remove();
    items = list.map((it, i) => {
      const el = document.createElement('div'); el.className = 'callout'; el.textContent = it.text; layer.appendChild(el);
      return { priority: i, ...it, el, w: 0, h: 0 };
    });
    svg.replaceChildren();
    for (const it of items) {
      it.line = document.createElementNS(SVGNS, 'polyline'); it.dot = document.createElementNS(SVGNS, 'circle'); it.dot.setAttribute('r', '3');
      svg.append(it.line, it.dot);
    }
    measure();
  }
  function measure() { for (const it of items) { const d = it.el.style.display; it.el.style.display = ''; it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; it.el.style.display = d; } }

  function update(camera) {
    const W = host.clientWidth, H = host.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H);
    if (!visible || !items.length) { layer.hidden = true; return; }
    layer.hidden = false;
    if (items.some((it) => !it.w)) measure();
    const compact = W < (opts.compactBelow ?? 560);
    const maxN = compact ? (opts.compactMax ?? 5) : 99;
    const top = typeof opts.top === 'function' ? opts.top() : (opts.top ?? 12), bottom = H - (typeof opts.bottom === 'function' ? opts.bottom() : (opts.bottom ?? 12));
    const pad = compact ? 6 : 14, gap = compact ? 4 : 7;
    const live = [];
    for (const it of items) {
      const p = typeof it.world === 'function' ? it.world() : it.world;
      if (!p) { it.on = false; continue; }
      const q = p.clone().project(camera);
      it.sx = (q.x * 0.5 + 0.5) * W; it.sy = (-q.y * 0.5 + 0.5) * H;
      it.on = q.z < 1 && it.priority < maxN && !hidden(it.id) && it.sx > 0 && it.sx < W && it.sy > top - 20 && it.sy < bottom + 20;
      if (it.on) live.push(it);
    }
    // columns: a label goes to the side of the model its point is on (so leaders do not cross the model);
    // without a silhouette, split about the median anchor
    const bb = opts.bounds?.(camera, W, H);
    const xs = live.map((it) => it.sx).sort((a, b) => a - b);
    const mid = bb ? (bb.minX + bb.maxX) / 2 : xs.length ? xs[Math.floor(xs.length / 2)] : W / 2;
    const cols = { left: [], right: [] };
    for (const it of live) cols[it.side || (it.sx < mid ? 'left' : 'right')].push(it);
    let anchorsMin = Math.min(...cols.left.map((it) => it.sx), W), anchorsMax = Math.max(...cols.right.map((it) => it.sx), 0);
    // keep the columns clear of the model's own silhouette when it leaves room
    if (bb) { anchorsMin = Math.min(anchorsMin, bb.minX + 6); anchorsMax = Math.max(anchorsMax, bb.maxX - 6); }
    for (const side of ['left', 'right']) {
      const col = cols[side].sort((a, b) => a.sy - b.sy);
      // stack without overlap: push down, then pull back up from the bottom edge
      let y = top;
      for (const it of col) { it.y = Math.max(it.sy - it.h / 2, y); y = it.y + it.h + gap; }
      let lim = bottom;
      for (let i = col.length - 1; i >= 0; i--) { const it = col[i]; it.y = Math.min(it.y, lim - it.h); lim = it.y - gap; }
      for (const it of col) it.y = Math.max(top, it.y);
      const colW = Math.max(0, ...col.map((it) => it.w));
      // untangle: where two neighbours' leaders cross, swap their slots
      const ex0 = side === 'left' ? Math.max(pad + colW, Math.min(anchorsMin - 22, W * 0.5 - 30)) : Math.min(W - pad - colW, Math.max(anchorsMax + 22, W * 0.5 + 30));
      const cross = (a, b) => { const d = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
        const A = [a.sx, a.sy], B = [ex0, a.y + a.h / 2], C = [b.sx, b.sy], D = [ex0, b.y + b.h / 2];
        return d(A, B, C) * d(A, B, D) < 0 && d(C, D, A) * d(C, D, B) < 0; };
      for (let pass = 0; pass < 6; pass++) {
        let swapped = false;
        for (let i = 0; i + 1 < col.length; i++) {
          const a_ = col[i], b_ = col[i + 1];
          if (cross(a_, b_)) { const ya = a_.y; b_.y = ya; a_.y = ya + b_.h + gap; col[i] = b_; col[i + 1] = a_; swapped = true; }
        }
        if (!swapped) break;
      }
      for (const it of col) {
        // the label goes in a column just outside the model, not glued to the stage edge
        let x;
        if (side === 'left') { const edge = Math.max(pad + colW, Math.min(anchorsMin - 22, W * 0.5 - 30)); x = edge - it.w; }
        else { const edge = Math.min(W - pad - colW, Math.max(anchorsMax + 22, W * 0.5 + 30)); x = edge; }
        x = Math.max(pad, Math.min(W - pad - it.w, x));
        it.el.style.transform = `translate(${x.toFixed(1)}px, ${it.y.toFixed(1)}px)`;
        it.el.dataset.side = side;
        const ly = it.y + it.h / 2, lx = side === 'left' ? x + it.w : x;
        const ex = side === 'left' ? lx + 10 : lx - 10;
        it.line.setAttribute('points', `${it.sx.toFixed(1)},${it.sy.toFixed(1)} ${ex.toFixed(1)},${ly.toFixed(1)} ${lx.toFixed(1)},${ly.toFixed(1)}`);
        it.dot.setAttribute('cx', it.sx.toFixed(1)); it.dot.setAttribute('cy', it.sy.toFixed(1));
      }
    }
    for (const it of items) { const s = it.on ? '' : 'none'; it.el.style.display = s; it.line.style.display = s; it.dot.style.display = s; }
  }
  return {
    set, update, measure, layer,
    setHidden(fn) { hidden = fn || (() => false); },
    show(on) { visible = on; layer.hidden = !on; },
    get items() { return items; },
  };
}
