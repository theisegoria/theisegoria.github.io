'use strict';
/* Shared 2D experience layer for the mathematics encyclopedia.
 * Model values stay in mathematical coordinates; this module owns the responsive
 * SVG surface, scales, semantic labels, and small state transitions.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const el = (tag, attrs = {}, text) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  };
  let surfaceId = 0;

  function transition(node, kind = 'draw') {
    node.dataset.motion = reduced() ? 'reduced' : kind;
    if (reduced()) return;
    node.animate(
      kind === 'draw' ? [{ opacity: 0.35 }, { opacity: 1 }] : [{ transform: 'scale(.96)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 220, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'both' },
    );
  }

  function createSurface(host, options = {}) {
    const {
      domain = [-1, 1, -1, 1],
      xlabel = '',
      ylabel = '',
      height = 310,
      equal = false,
      label = `${xlabel}; ${ylabel}`,
      description = 'Interactive mathematical graphic',
      ticks: requestedTicks,
    } = options;
    const width = Math.max(260, equal ? Math.min(640, host.clientWidth || 640) : host.clientWidth || 640);
    const h = equal ? Math.max(height, Math.min(480, width * .8)) : height;
    const margin = { l: 64, r: 22, t: 22, b: 46 };
    let [xmin, xmax, ymin, ymax] = domain;
    if (equal) {
      const unit = Math.max((xmax - xmin) / (width - margin.l - margin.r), (ymax - ymin) / (h - margin.t - margin.b));
      const cx = (xmin + xmax) / 2, cy = (ymin + ymax) / 2;
      xmin = cx - unit * (width - margin.l - margin.r) / 2;
      xmax = cx + unit * (width - margin.l - margin.r) / 2;
      ymin = cy - unit * (h - margin.t - margin.b) / 2;
      ymax = cy + unit * (h - margin.t - margin.b) / 2;
    }
    const X = (x) => margin.l + (x - xmin) / (xmax - xmin) * (width - margin.l - margin.r);
    const Y = (y) => h - margin.b - (y - ymin) / (ymax - ymin) * (h - margin.t - margin.b);
    const id = `math-surface-${++surfaceId}`;
    const svg = el('svg', { viewBox: `0 0 ${width} ${h}`, role: 'img', 'aria-labelledby': `${id}-title ${id}-desc`, tabindex: '0', class: 'math-experience-surface' });
    svg.append(el('title', { id: `${id}-title` }, label), el('desc', { id: `${id}-desc` }, description));
    if (equal) { svg.style.maxWidth = '640px'; svg.style.margin = '0 auto'; }
    const defs = el('defs');
    const clipId = `${id}-clip`;
    const clip = el('clipPath', { id: clipId });
    clip.append(el('rect', { x: margin.l, y: margin.t, width: width - margin.l - margin.r, height: h - margin.t - margin.b }));
    defs.append(clip); svg.append(defs);
    const plot = el('g', { class: 'math-experience-plot', 'clip-path': `url(#${clipId})` });
    const chrome = el('g', { class: 'math-experience-chrome' });
    svg.append(chrome, plot); host.append(svg);
    const ticks = requestedTicks || (width < 420 ? 3 : 5);
    for (let i = 0; i < ticks; i += 1) {
      const xv = xmin + (xmax - xmin) * i / (ticks - 1), yv = ymin + (ymax - ymin) * i / (ticks - 1);
      chrome.append(
        el('line', { x1: X(xv), x2: X(xv), y1: margin.t, y2: h - margin.b, class: 'grid' }),
        el('line', { x1: margin.l, x2: width - margin.r, y1: Y(yv), y2: Y(yv), class: 'grid' }),
        el('text', { x: X(xv), y: h - margin.b + 20, 'text-anchor': i === 0 ? 'start' : i === ticks - 1 ? 'end' : 'middle', class: 'axis-label' }, Number(xv.toPrecision(3)).toString()),
        el('text', { x: margin.l - 8, y: Y(yv) + 4, 'text-anchor': 'end', class: 'axis-label' }, Number(yv.toPrecision(3)).toString()),
      );
    }
    chrome.append(
      el('rect', { x: margin.l, y: margin.t, width: width - margin.l - margin.r, height: h - margin.t - margin.b, class: 'frame' }),
      el('text', { x: (width + margin.l - margin.r) / 2, y: h - 5, 'text-anchor': 'middle', class: 'axis-title' }, xlabel),
      el('text', { transform: `translate(13 ${(h - margin.b + margin.t) / 2}) rotate(-90)`, 'text-anchor': 'middle', class: 'axis-title' }, ylabel),
    );
    const path = (points, className = 'curve', close = false) => {
      const node = el('path', { d: points.map((point, index) => `${index ? 'L' : 'M'}${X(point[0]).toFixed(3)},${Y(point[1]).toFixed(3)}`).join(' ') + (close ? ' Z' : ''), class: className, 'data-geometry': 'path' });
      plot.append(node); transition(node); return node;
    };
    const dot = (x, y, className = 'point', radius = 4, accessibleLabel = '') => {
      const node = el('circle', { cx: X(x), cy: Y(y), r: radius, class: className, 'data-geometry': 'point', tabindex: accessibleLabel ? '0' : '-1' });
      if (accessibleLabel) { node.setAttribute('role', 'img'); node.setAttribute('aria-label', accessibleLabel); }
      plot.append(node); transition(node, 'point'); return node;
    };
    const text = (x, y, value, attrs = {}) => {
      const node = el('text', { x: X(x) + 6, y: Y(y) - 7, ...attrs }, value);
      plot.append(node); return node;
    };
    const line = (a, b, className = 'curve') => path([a, b], className);
    return { svg, plot, chrome, g: plot, s: svg, X, Y, path, dot, text, line, width, height: h, bounds: { xmin, xmax, ymin, ymax }, reduced: reduced() };
  }

  function createDiagram(host, options = {}) {
    const { name = 'Interactive diagram', description = 'Interactive mathematical diagram', height = 300 } = options;
    const width = Math.max(260, host.clientWidth || 640), h = height;
    const scale = Math.min((width - 55) / 3, (h - 55) / 3);
    const X = (x) => width / 2 + x * scale, Y = (y) => h / 2 - y * scale;
    const id = `math-diagram-${++surfaceId}`;
    const svg = el('svg', { viewBox: `0 0 ${width} ${h}`, role: 'img', 'aria-labelledby': `${id}-title ${id}-desc`, tabindex: '0', class: 'math-experience-surface' });
    svg.append(el('title', { id: `${id}-title` }, name), el('desc', { id: `${id}-desc` }, description));
    const plot = el('g', { class: 'math-experience-plot' }); svg.append(plot); host.append(svg);
    const path = (points, className = 'curve', close = false) => { const node = el('path', { d: points.map((point, index) => `${index ? 'L' : 'M'}${X(point[0])},${Y(point[1])}`).join(' ') + (close ? ' Z' : ''), class: className, 'data-geometry': 'path' }); plot.append(node); transition(node); return node; };
    const dot = (x, y, className = 'point', radius = 4, accessibleLabel = '') => { const node = el('circle', { cx: X(x), cy: Y(y), r: radius, class: className, tabindex: accessibleLabel ? '0' : '-1' }); if (accessibleLabel) node.setAttribute('aria-label', accessibleLabel); plot.append(node); transition(node, 'point'); return node; };
    const text = (x, y, value) => { const node = el('text', { x: X(x) + 7, y: Y(y) - 8 }, value); plot.append(node); return node; };
    return { svg, plot, g: plot, s: svg, X, Y, path, line: (a, b, className = 'curve') => path([a, b], className), dot, text, width, height: h, reduced: reduced() };
  }

  window.MathExperience = { createSurface, createDiagram, reducedMotion: reduced, escape: esc };
})();
