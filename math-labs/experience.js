'use strict';
/* Lab kit for the mathematics encyclopedia.
 * Figures are drawn in mathematical coordinates on crisp, theme-aware SVG,
 * with an optional canvas raster layer underneath for fields and densities.
 * See math-labs/KIT.md for the API.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const ja = document.documentElement.lang === 'ja';
  const T = (en, jp) => (ja ? jp : en);
  const TAU = Math.PI * 2;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const fmt = (x, d = 3) => {
    if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'n/a';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) { const [m, e] = x.toExponential(2).split('e'); return `${m}×10${sup(Number(e))}`; }
    return Number(x.toFixed(d)).toString().replace('-', '−');
  };
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
  const el = (tag, attrs = {}, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };
  const h = (tag, cls, parent, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  };
  const seq = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const sample = (lo, hi, n, f) => seq(n + 1, (i) => { const x = lo + (hi - lo) * i / n; const y = f(x); return Array.isArray(y) ? y : [x, y]; });

  /* ---------- colour ---------- */
  const TOKENS = ['c1', 'c2', 'c3', 'c4', 'hl', 'ink', 'muted', 'plate', 'grid', 'pos', 'neg', 'zero'];
  let colourCache = null;
  function colours() {
    if (colourCache) return colourCache;
    const probe = h('span', 'lab-probe', document.querySelector('.math-wrap') || document.body);
    const out = {};
    for (const t of TOKENS) {
      probe.style.color = `var(--lab-${t})`;
      const m = getComputedStyle(probe).color.match(/[\d.]+/g) || ['0', '0', '0'];
      out[t] = m.slice(0, 3).map(Number);
    }
    probe.remove();
    colourCache = out;
    return out;
  }
  const invalidate = [];
  const onTheme = () => { colourCache = null; invalidate.forEach((f) => f()); };
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', onTheme);
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const cmaps = {
    div: (v) => { const c = colours(); return v >= 0 ? mix(c.plate, c.pos, clamp(v, 0, 1)) : mix(c.plate, c.neg, clamp(-v, 0, 1)); },
    seq: (v) => { const c = colours(); return mix(c.plate, c.c1, clamp(v, 0, 1)); },
    warm: (v) => { const c = colours(); const t = clamp(v, 0, 1); return t < 0.5 ? mix(c.plate, c.c2, t * 2) : mix(c.c2, c.hl, (t - 0.5) * 2); },
    phase: (arg, mag) => {
      const hue = ((arg / TAU) % 1 + 1) % 1;
      const band = mag > 0 ? (Math.log2(mag) % 1 + 1) % 1 : 0;
      const l = 0.42 + 0.16 * band;
      return hsl(hue, 0.62, l);
    },
  };
  function hsl(hh, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + hh * 12) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    return [f(0), f(8), f(4)];
  }

  /* ---------- ticks ---------- */
  function niceStep(span, count) {
    const raw = span / Math.max(1, count);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function ticks(lo, hi, count) {
    const step = niceStep(hi - lo, count);
    const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }
  const tickText = (v) => {
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e4 || a < 1e-2)) return fmt(v, 2);
    return String(Number(v.toPrecision(6))).replace('-', '−');
  };

  /* ---------- figure ---------- */
  let figId = 0;
  function fig(host, o = {}) {
    const opt = Object.assign({ x: [-1, 1], y: [-1, 1], equal: false, aspect: 0.6, axes: true, grid: true, xlabel: '', ylabel: '', maxH: 540, minH: 220, ticksX: null, ticksY: null, frame: true, pad: null, piX: false }, o);
    const wrap = h('div', 'lab-fig' + (opt.dark ? ' is-dark' : ''), host);
    let W = Math.max(280, Math.round((host.clientWidth || wrap.clientWidth || 640) - 2));
    const small = W < 520;
    const pad = opt.pad || (opt.axes ? { l: small ? 38 : 48, r: small ? 10 : 16, t: 14, b: opt.xlabel ? 44 : 30 } : { l: 10, r: 10, t: 10, b: 10 });
    let [x0, x1] = opt.x, [y0, y1] = opt.y;
    let pw = W - pad.l - pad.r;
    let ph;
    if (opt.equal) {
      ph = pw * (y1 - y0) / (x1 - x0);
      if (ph > opt.maxH - pad.t - pad.b) {
        // too tall: narrow the figure instead of widening the domain
        ph = opt.maxH - pad.t - pad.b;
        pw = ph * (x1 - x0) / (y1 - y0);
        W = Math.round(pw + pad.l + pad.r);
        wrap.style.maxWidth = (W + 2) + 'px';
      }
    } else ph = clamp(pw * opt.aspect, opt.minH, opt.maxH) - pad.t - pad.b;
    const H = Math.round(ph + pad.t + pad.b);
    const X = (x) => pad.l + (x - x0) / (x1 - x0) * pw;
    const Y = (y) => pad.t + (y1 - y) / (y1 - y0) * ph;
    const IX = (px) => x0 + (px - pad.l) / pw * (x1 - x0);
    const IY = (py) => y1 - (py - pad.t) / ph * (y1 - y0);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'lab-svg', role: 'presentation', 'data-ig-tex': 'off' }, wrap);
    const id = `lf${++figId}`;
    const defs = el('defs', {}, svg);
    const clip = el('clipPath', { id: `${id}c` }, defs);
    el('rect', { x: pad.l, y: pad.t, width: pw, height: ph }, clip);
    ['c1', 'c2', 'c3', 'c4', 'hl', 'ink', 'muted'].forEach((c) => {
      const m = el('marker', { id: `${id}a${c}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' }, defs);
      el('path', { d: 'M0 1L9 5L0 9z', style: `fill:var(--lab-${c})` }, m);
    });
    let canvas = null;
    const layers = {};
    const gridG = el('g', { class: 'lab-grid' }, svg);
    layers.under = el('g', { 'clip-path': `url(#${id}c)` }, svg);
    layers.main = el('g', { 'clip-path': opt.noclip ? null : `url(#${id}c)` }, svg);
    const axisG = el('g', { class: 'lab-axis' }, svg);
    layers.over = el('g', {}, svg);
    layers.ui = el('g', {}, svg);

    if (opt.axes) {
      const tx = opt.ticksX || (opt.piX ? piTicks(x0, x1) : ticks(x0, x1, small ? 4 : 7).map((v) => [v, tickText(v)]));
      const ty = opt.ticksY || ticks(y0, y1, Math.max(3, Math.round(ph / 60))).map((v) => [v, tickText(v)]);
      if (opt.grid) {
        tx.forEach(([v]) => el('line', { x1: X(v), x2: X(v), y1: pad.t, y2: pad.t + ph }, gridG));
        ty.forEach(([v]) => el('line', { y1: Y(v), y2: Y(v), x1: pad.l, x2: pad.l + pw }, gridG));
      }
      if (opt.frame) el('rect', { x: pad.l, y: pad.t, width: pw, height: ph, class: 'lab-frame' }, axisG);
      if (x0 < 0 && x1 > 0) el('line', { x1: X(0), x2: X(0), y1: pad.t, y2: pad.t + ph, class: 'lab-zero' }, axisG);
      if (y0 < 0 && y1 > 0) el('line', { y1: Y(0), y2: Y(0), x1: pad.l, x2: pad.l + pw, class: 'lab-zero' }, axisG);
      tx.forEach(([v, s]) => { const t = el('text', { x: X(v), y: pad.t + ph + 16, 'text-anchor': 'middle', class: 'lab-tick' }, axisG); t.textContent = s; });
      ty.forEach(([v, s]) => { const t = el('text', { x: pad.l - 7, y: Y(v) + 4, 'text-anchor': 'end', class: 'lab-tick' }, axisG); t.textContent = s; });
      if (opt.xlabel) { const t = el('text', { x: pad.l + pw / 2, y: H - 6, 'text-anchor': 'middle', class: 'lab-axlabel' }, axisG); t.textContent = opt.xlabel; }
      if (opt.ylabel) { const t = el('text', { x: pad.l + 6, y: pad.t + 14, class: 'lab-axlabel lab-ylabel' }, axisG); t.textContent = opt.ylabel; }
    }

    const style = (o2, kind) => {
      const c = o2.c || 'c1';
      const s = [];
      if (kind !== 'fill') s.push(`stroke:var(--lab-${c})`);
      if (o2.fill) s.push(`fill:var(--lab-${o2.fill === true ? c : o2.fill})`, `fill-opacity:${o2.fo ?? 0.16}`);
      else if (kind === 'fill') s.push(`fill:var(--lab-${c})`, `fill-opacity:${o2.fo ?? 0.16}`);
      else s.push('fill:none');
      if (o2.op !== undefined) s.push(`opacity:${o2.op}`);
      return s.join(';');
    };
    const pathD = (pts, closed) => {
      let d = '', pen = false;
      for (const p of pts) {
        if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) { pen = false; continue; }
        const px = X(p[0]), py = Y(p[1]);
        if (Math.abs(py) > 1e5 || Math.abs(px) > 1e5) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + px.toFixed(2) + ' ' + py.toFixed(2);
        pen = true;
      }
      return d + (closed && d ? 'Z' : '');
    };
    const f = {
      svg, wrap, W, H, pad, pw, ph, X, Y, IX, IY, layers, x: [x0, x1], y: [y0, y1], small,
      line(pts, o2 = {}) {
        return el('path', { d: pathD(pts, o2.closed), class: 'lab-line' + (o2.cls ? ' ' + o2.cls : ''), style: style(o2) + `;stroke-width:${o2.w ?? 2.25}` + (o2.dash ? `;stroke-dasharray:${o2.dash === true ? '5 5' : o2.dash}` : ''), 'marker-end': o2.arrow ? `url(#${id}a${o2.c || 'c1'})` : null }, o2.layer ? layers[o2.layer] : layers.main);
      },
      area(pts, o2 = {}) {
        const base = o2.base ?? 0;
        const full = pts.concat([[pts[pts.length - 1][0], base], [pts[0][0], base]]);
        return el('path', { d: pathD(full, true), style: style(o2, 'fill') + ';stroke:none' }, o2.layer ? layers[o2.layer] : layers.under);
      },
      poly(pts, o2 = {}) {
        return el('path', { d: pathD(pts, true), class: 'lab-line', style: style(Object.assign({ fill: true }, o2)) + `;stroke-width:${o2.w ?? 1.6}` + (o2.dash ? `;stroke-dasharray:${o2.dash === true ? '5 5' : o2.dash}` : ''), 'stroke-linejoin': 'round' }, o2.layer ? layers[o2.layer] : layers.main);
      },
      seg(a, b, o2 = {}) { return f.line([a, b], o2); },
      arrow(a, b, o2 = {}) { return f.line([a, b], Object.assign({ arrow: true }, o2)); },
      rect(x, y, w, hh, o2 = {}) {
        const px = X(Math.min(x, x + w)), py = Y(Math.max(y, y + hh));
        return el('rect', { x: px, y: py, width: Math.abs(X(x + w) - X(x)), height: Math.abs(Y(y + hh) - Y(y)), rx: o2.rx ?? 0, style: style(Object.assign({ fill: true }, o2)) + `;stroke-width:${o2.w ?? 1}` + (o2.nostroke ? ';stroke:none' : '') }, o2.layer ? layers[o2.layer] : layers.main);
      },
      circle(x, y, r, o2 = {}) {
        return el('ellipse', { cx: X(x), cy: Y(y), rx: Math.abs(X(x + r) - X(x)), ry: Math.abs(Y(y + r) - Y(y)), style: style(o2) + `;stroke-width:${o2.w ?? 1.6}` + (o2.dash ? `;stroke-dasharray:${o2.dash === true ? '5 5' : o2.dash}` : '') }, o2.layer ? layers[o2.layer] : layers.main);
      },
      dot(x, y, o2 = {}) {
        const c = o2.c || 'c1';
        return el('circle', { cx: X(x), cy: Y(y), r: o2.r ?? 4.5, class: 'lab-dot' + (o2.hollow ? ' is-hollow' : ''), style: o2.hollow ? `stroke:var(--lab-${c});fill:var(--lab-plate)` : `fill:var(--lab-${c})` + (o2.op !== undefined ? `;opacity:${o2.op}` : '') }, o2.layer ? layers[o2.layer] : layers.over);
      },
      text(x, y, s, o2 = {}) {
        const t = el('text', { x: X(x) + (o2.dx ?? 0), y: Y(y) + (o2.dy ?? 0), 'text-anchor': o2.anchor || 'middle', class: 'lab-label' + (o2.math ? ' is-math' : '') + (o2.small ? ' is-small' : ''), style: o2.c ? `fill:var(--lab-${o2.c})` : null }, o2.layer ? layers[o2.layer] : layers.over);
        t.textContent = s;
        return t;
      },
      vline(x, o2 = {}) { return f.line([[x, y0 - 2 * (y1 - y0)], [x, y1 + 2 * (y1 - y0)]], Object.assign({ w: 1.2, c: 'muted', dash: '4 4' }, o2)); },
      hline(y, o2 = {}) { return f.line([[x0 - 2 * (x1 - x0), y], [x1 + 2 * (x1 - x0), y]], Object.assign({ w: 1.2, c: 'muted', dash: '4 4' }, o2)); },
      raster(fn, o2 = {}) {
        if (!canvas) {
          canvas = h('canvas', 'lab-raster', wrap);
          wrap.insertBefore(canvas, svg);
        }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const res = o2.res ?? (small ? 2 : 3);
        const cw = Math.max(1, Math.round(pw / res)), chh = Math.max(1, Math.round(ph / res));
        canvas.width = cw; canvas.height = chh;
        canvas.style.left = (pad.l / W * 100) + '%'; canvas.style.top = (pad.t / H * 100) + '%';
        canvas.style.width = (pw / W * 100) + '%'; canvas.style.height = (ph / H * 100) + '%';
        canvas.style.imageRendering = o2.pixel ? 'pixelated' : 'auto';
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(cw, chh);
        const cmap = typeof o2.cmap === 'function' ? o2.cmap : cmaps[o2.cmap || 'div'];
        for (let j = 0; j < chh; j++) {
          const y = y1 - (j + 0.5) / chh * (y1 - y0);
          for (let i = 0; i < cw; i++) {
            const x = x0 + (i + 0.5) / cw * (x1 - x0);
            const v = fn(x, y);
            const col = Array.isArray(v) ? v : cmap(v);
            const k = (j * cw + i) * 4;
            img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
          }
        }
        ctx.putImageData(img, 0, 0);
        void dpr;
        return canvas;
      },
      field(fn, o2 = {}) {
        const n = o2.n ?? (small ? 13 : 19);
        const step = (x1 - x0) / n;
        const rows = Math.round((y1 - y0) / step);
        const len = step * (o2.len ?? 0.8);
        const vals = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
          const x = x0 + (i + 0.5) * step, y = y0 + (j + 0.5) * (y1 - y0) / rows;
          const [u, v] = fn(x, y); const m = Math.hypot(u, v);
          if (Number.isFinite(m) && m > 1e-12) vals.push([x, y, u / m, v / m, m]);
        }
        const mags = vals.map((v) => v[4]).sort((a, b) => a - b);
        const ref = mags[Math.floor(mags.length * 0.85)] || 1;
        const g = el('g', { class: 'lab-field' }, layers.under);
        for (const [x, y, u, v, m] of vals) {
          const s = o2.scaled === false ? 1 : clamp(Math.sqrt(m / ref), 0.25, 1);
          const a = [x - u * len * s / 2, y - v * len * s / 2], b = [x + u * len * s / 2, y + v * len * s / 2];
          const p = el('path', { d: pathD([a, b]), style: `stroke:var(--lab-${o2.c || 'muted'});opacity:${(0.35 + 0.6 * s).toFixed(2)};stroke-width:1.3`, 'marker-end': `url(#${id}a${o2.c || 'muted'})` }, g);
          void p;
        }
        return g;
      },
      stream(fn, seeds, o2 = {}) {
        const out = [];
        const h0 = o2.h ?? (x1 - x0) / 300, steps = o2.steps ?? 600;
        const inside = ([x, y]) => x >= x0 - 0.05 * (x1 - x0) && x <= x1 + 0.05 * (x1 - x0) && y >= y0 - 0.05 * (y1 - y0) && y <= y1 + 0.05 * (y1 - y0);
        const unit = (p) => { const [u, v] = fn(p[0], p[1]); const m = Math.hypot(u, v); return m > 1e-9 && Number.isFinite(m) ? [u / m, v / m] : null; };
        for (const s of seeds) {
          for (const dir of o2.both === false ? [1] : [1, -1]) {
            let p = s.slice(); const pts = [p];
            for (let k = 0; k < steps; k++) {
              const k1 = unit(p); if (!k1) break;
              const k2 = unit([p[0] + dir * h0 * k1[0] / 2, p[1] + dir * h0 * k1[1] / 2]); if (!k2) break;
              const k3 = unit([p[0] + dir * h0 * k2[0] / 2, p[1] + dir * h0 * k2[1] / 2]); if (!k3) break;
              const k4 = unit([p[0] + dir * h0 * k3[0], p[1] + dir * h0 * k3[1]]); if (!k4) break;
              p = [p[0] + dir * h0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6, p[1] + dir * h0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6];
              if (!inside(p) || (o2.stop && o2.stop(p))) break;
              pts.push(p);
            }
            out.push(dir > 0 ? pts : pts.reverse());
          }
        }
        const g = el('g', { class: 'lab-stream' + (o2.flow && !reduced() ? ' is-flowing' : '') }, layers.under);
        out.forEach((pts) => { if (pts.length > 2) el('path', { d: pathD(pts), style: `stroke:var(--lab-${o2.c || 'c1'});stroke-width:${o2.w ?? 1.4};opacity:${o2.op ?? 0.7};fill:none` }, g); });
        return g;
      },
      handle(x, y, o2 = {}) {
        const c = o2.c || 'c2';
        const g = el('g', { class: 'lab-handle', tabindex: 0, role: 'slider', 'aria-label': o2.label || T('Draggable point', 'ドラッグできる点'), 'aria-valuetext': `(${fmt(x, 2)}, ${fmt(y, 2)})` }, layers.ui);
        el('circle', { cx: X(x), cy: Y(y), r: 18, class: 'lab-handle-hit' }, g);
        el('circle', { cx: X(x), cy: Y(y), r: o2.r ?? 8, class: 'lab-handle-dot', style: `fill:var(--lab-${c})` }, g);
        const lim = o2.bounds || [x0, x1, y0, y1];
        const snap = o2.snap ?? 0;
        const set = (nx, ny) => {
          nx = clamp(nx, lim[0], lim[1]); ny = clamp(ny, lim[2], lim[3]);
          if (snap) { nx = Math.round(nx / snap) * snap; ny = Math.round(ny / snap) * snap; }
          if (o2.axis === 'x') ny = y; if (o2.axis === 'y') nx = x;
          o2.onDrag?.(nx, ny);
        };
        g.addEventListener('pointerdown', (e) => {
          e.preventDefault(); g.classList.add('is-dragging');
          const r = svg.getBoundingClientRect(), sx = W / r.width, sy = H / r.height;
          const move = (ev) => set(IX((ev.clientX - r.left) * sx), IY((ev.clientY - r.top) * sy));
          const end = () => { g.classList.remove('is-dragging'); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end); };
          document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
        });
        g.addEventListener('keydown', (e) => {
          const st = (e.shiftKey ? 5 : 1) * (snap || (x1 - x0) / 100);
          const d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, st], ArrowDown: [0, -st] }[e.key];
          if (!d) return; e.preventDefault(); set(x + d[0], y + d[1]);
        });
        return g;
      },
      hover(fn) {
        const g = el('g', { class: 'lab-hover', style: 'display:none' }, layers.ui);
        const vl = el('line', { y1: pad.t, y2: pad.t + ph }, g);
        const tip = el('g', {}, g); const bg = el('rect', { rx: 4 }, tip); const tx = el('text', { class: 'lab-tip' }, tip);
        const hit = el('rect', { x: pad.l, y: pad.t, width: pw, height: ph, class: 'lab-hit' }, layers.ui);
        layers.ui.insertBefore(hit, layers.ui.firstChild);
        const show = (e) => {
          const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * W / r.width, py = (e.clientY - r.top) * H / r.height;
          const res = fn(IX(px), IY(py)); if (!res) { g.style.display = 'none'; return; }
          g.style.display = ''; const cx = res.x !== undefined ? X(res.x) : px;
          vl.setAttribute('x1', cx); vl.setAttribute('x2', cx);
          tx.textContent = res.text; const bw = tx.getComputedTextLength() + 14;
          const left = cx + 10 + bw > W - 4 ? cx - 10 - bw : cx + 10;
          const top = clamp((res.y !== undefined ? Y(res.y) : py) - 30, pad.t + 2, pad.t + ph - 26);
          bg.setAttribute('x', left); bg.setAttribute('y', top); bg.setAttribute('width', bw); bg.setAttribute('height', 22);
          tx.setAttribute('x', left + 7); tx.setAttribute('y', top + 15);
        };
        hit.addEventListener('pointermove', show); hit.addEventListener('pointerleave', () => { g.style.display = 'none'; });
        return g;
      },
      group(layer = 'main') { return el('g', {}, layers[layer]); },
      clear(layer) { const L = layers[layer]; while (L.firstChild) L.removeChild(L.firstChild); },
    };
    return f;
  }
  function piTicks(lo, hi) {
    const out = [];
    const names = { '-2': '−2π', '-1.5': '−3π/2', '-1': '−π', '-0.5': '−π/2', 0: '0', 0.5: 'π/2', 1: 'π', 1.5: '3π/2', 2: '2π' };
    for (let k = -4; k <= 4; k++) { const v = k * Math.PI / 2; if (v >= lo - 1e-9 && v <= hi + 1e-9) out.push([v, names[String(k / 2)] ?? `${k / 2}π`]); }
    return out;
  }

  /* ---------- plain diagram stage (pixel coordinates, fixed aspect) ---------- */
  function stage(host, o = {}) {
    return fig(host, Object.assign({ axes: false, equal: true, x: [0, o.w ?? 100], y: [0, o.h ?? 60], maxH: o.maxH ?? 520 }, o));
  }

  /* ---------- panels, legends, readouts ---------- */
  function legend(host, items) {
    const row = h('div', 'lab-legend', host);
    for (const it of items) {
      const s = h('span', '', row);
      const sw = h('i', 'sw ' + (it.kind || 'line') + (it.dash ? ' is-dash' : ''), s);
      sw.style.setProperty('--sw', `var(--lab-${it.c || 'c1'})`);
      s.appendChild(document.createTextNode(it.label));
    }
    return row;
  }
  function readout(node, items, note) {
    node.replaceChildren();
    node.classList.add('lab-readout');
    for (const it of items) {
      const chip = h('span', 'lab-chip' + (it.tone ? ' is-' + it.tone : ''), node);
      h('span', 'k', chip, it.k);
      h('span', 'v', chip, it.v);
    }
    if (note) h('span', 'lab-note', node, note);
  }

  /* ---------- animation ---------- */
  function animator(host, step, o = {}) {
    // step(dt, t, label) draws the frame for time t; returning false ends the run.
    // o.autoplay (default true, never under reduced motion), o.once (Play restarts a finished run),
    // o.initialT (time of the first frame drawn), o.playLabel, o.restart (show a Restart button).
    const bar = h('div', 'lab-anim', host);
    const btn = h('button', 'lab-play', bar); btn.type = 'button';
    const extra = o.restart ? h('button', 'lab-restart', bar, T('Restart', '最初から')) : null;
    if (extra) extra.type = 'button';
    const label = h('span', 'lab-anim-t', bar);
    let playing = (o.autoplay ?? true) && !reduced(), raf = 0, last = 0, t = o.initialT ?? 0, visible = true, finished = false;
    const draw = () => {
      btn.textContent = playing ? T('Pause', '一時停止') : (o.playLabel || T('Play', '再生'));
      btn.setAttribute('aria-pressed', String(playing));
    };
    const tick = (now) => {
      raf = 0;
      if (!playing || !visible || document.hidden) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; t += dt;
      if (step(dt, t, label) === false) { playing = false; finished = true; draw(); return; }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && playing) { last = 0; raf = requestAnimationFrame(tick); } };
    btn.addEventListener('click', () => {
      if (!playing && (finished || o.once) && (finished || t >= (o.duration ?? Infinity))) { t = 0; finished = false; o.onRestart?.(); }
      playing = !playing; draw(); start();
    });
    extra?.addEventListener('click', () => { t = 0; finished = false; o.onRestart?.(); step(0, 0, label); if (!playing) { playing = true; draw(); } start(); });
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); });
    io.observe(host);
    draw(); if (step(0, t, label) === false) finished = true; start();
    return {
      stop() { playing = false; io.disconnect(); if (raf) cancelAnimationFrame(raf); },
      get t() { return t; }, set t(v) { t = v; },
      play() { playing = true; finished = false; draw(); start(); }, pause() { playing = false; draw(); },
      redraw() { step(0, t, label); },
    };
  }

  window.MathExperience = window.Lab = { fig, stage, legend, readout, animator, colours, cmaps, fmt, seq, sample, clamp, el, h, T, ja, TAU, reduced, ticks, onTheme: (f) => invalidate.push(f) };
})();
