/* Watch Art: illustration-grade SVG parts for the watch explainers.
   Returns SVG markup strings. Works in the browser (window.WatchArt) and in Node (module.exports).
   Lighting convention: one soft key light from the upper left. Rotating parts use
   rotation-invariant fills; the light-dependent sheen sits in a static overlay so the
   highlight stays put while the part turns, as it does on a real polished wheel. */
(function (root) {
'use strict';
const TAU = Math.PI * 2, D2R = Math.PI / 180;
const f = n => (Math.round(n * 100) / 100).toString();
const P = (x, y) => f(x) + ' ' + f(y);
const pathFrom = (pts, close = true) => pts.map((p, i) => (i ? 'L' : 'M') + P(p[0], p[1])).join('') + (close ? 'Z' : '');
const polar = (cx, cy, r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrs = o => Object.keys(o || {}).filter(k => o[k] !== undefined && o[k] !== null && o[k] !== false)
  .map(k => ` ${k}="${esc(o[k])}"`).join('');

/* ------------------------------------------------------------------ materials */
/* Each material: base fill (rotation invariant radial) and an edge stroke. */
const MAT = {
  gilt:   { fill: 'url(#wa-gilt)',   edge: '#6d4c19' },
  brass:  { fill: 'url(#wa-brass)',  edge: '#6a4a1c' },
  gold:   { fill: 'url(#wa-gold)',   edge: '#7a5414' },
  steel:  { fill: 'url(#wa-steel)',  edge: '#4a5058' },
  nickel: { fill: 'url(#wa-nickel)', edge: '#5d6166' },
  blued:  { fill: 'url(#wa-blued)',  edge: '#0d1f4d' },
  red:    { fill: 'url(#wa-redgilt)', edge: '#5e2a12' },
  white:  { fill: 'url(#wa-polymer)', edge: '#8c8a83' }
};

function defs() {
  return `
<radialGradient id="wa-gilt" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f6e2a8"/><stop offset=".42" stop-color="#e2bf6e"/><stop offset=".78" stop-color="#c79b48"/><stop offset=".93" stop-color="#a77a30"/><stop offset="1" stop-color="#7e5a22"/></radialGradient>
<radialGradient id="wa-brass" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f1d79a"/><stop offset=".55" stop-color="#d6ae5e"/><stop offset=".9" stop-color="#b2873b"/><stop offset="1" stop-color="#8d6628"/></radialGradient>
<radialGradient id="wa-redgilt" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4c9a0"/><stop offset=".6" stop-color="#d79565"/><stop offset="1" stop-color="#9c5a33"/></radialGradient>
<radialGradient id="wa-gold" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#ecc55c"/><stop offset=".85" stop-color="#c9952c"/><stop offset="1" stop-color="#94671b"/></radialGradient>
<radialGradient id="wa-steel" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fbfcfd"/><stop offset=".45" stop-color="#d9dde2"/><stop offset=".85" stop-color="#a9b0b8"/><stop offset="1" stop-color="#7d848c"/></radialGradient>
<radialGradient id="wa-nickel" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f1f2f0"/><stop offset=".6" stop-color="#d4d6d3"/><stop offset="1" stop-color="#a3a6a3"/></radialGradient>
<radialGradient id="wa-blued" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#8fb4ff"/><stop offset=".35" stop-color="#3a63c9"/><stop offset=".8" stop-color="#1b347f"/><stop offset="1" stop-color="#0f1f52"/></radialGradient>
<radialGradient id="wa-polymer" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#ecebe5"/><stop offset="1" stop-color="#c9c7bf"/></radialGradient>
<linearGradient id="wa-steel-lin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset=".35" stop-color="#c3c9cf"/><stop offset=".55" stop-color="#eef1f4"/><stop offset=".8" stop-color="#9aa2ab"/><stop offset="1" stop-color="#d5dade"/></linearGradient>
<linearGradient id="wa-gilt-lin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e6b2"/><stop offset=".4" stop-color="#d2a85a"/><stop offset=".6" stop-color="#f0d697"/><stop offset="1" stop-color="#a47a33"/></linearGradient>
<linearGradient id="wa-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".65" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
<radialGradient id="wa-wedge" cx="50%" cy="50%" r="50%"><stop offset=".15" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="wa-wedge-ring" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></radialGradient>
<radialGradient id="wa-shadow" cx="50%" cy="50%" r="50%"><stop offset=".6" stop-color="#000" stop-opacity=".06"/><stop offset=".84" stop-color="#000" stop-opacity=".3"/><stop offset=".93" stop-color="#000" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<radialGradient id="wa-ruby" cx="36%" cy="32%" r="72%" fx="34%" fy="28%"><stop offset="0" stop-color="#ffe3e8"/><stop offset=".12" stop-color="#ff7d93"/><stop offset=".42" stop-color="#d4213f"/><stop offset=".8" stop-color="#8e0b25"/><stop offset="1" stop-color="#4f0413"/></radialGradient>
<linearGradient id="wa-ruby-lin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9fb0"/><stop offset=".35" stop-color="#d81f40"/><stop offset=".7" stop-color="#9d0d2a"/><stop offset="1" stop-color="#5a0516"/></linearGradient>
<radialGradient id="wa-sink" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#7d8288"/><stop offset=".7" stop-color="#f4f6f8"/><stop offset=".86" stop-color="#b9bec4"/><stop offset="1" stop-color="#e9ecef"/></radialGradient>
<radialGradient id="wa-sink-gilt" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#8a6a2c"/><stop offset=".72" stop-color="#fbeab9"/><stop offset=".88" stop-color="#c39745"/><stop offset="1" stop-color="#f0d89c"/></radialGradient>
<radialGradient id="wa-screwhead" cx="40%" cy="34%" r="70%"><stop offset="0" stop-color="#b9d0ff"/><stop offset=".3" stop-color="#4f7be0"/><stop offset=".75" stop-color="#1c3a91"/><stop offset="1" stop-color="#0c1a45"/></radialGradient>
<radialGradient id="wa-screwsteel" cx="40%" cy="34%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#d6dbe0"/><stop offset=".85" stop-color="#8b939b"/><stop offset="1" stop-color="#5f666d"/></radialGradient>
<radialGradient id="wa-screwgold" cx="40%" cy="34%" r="70%"><stop offset="0" stop-color="#fff6cf"/><stop offset=".4" stop-color="#eac564"/><stop offset=".85" stop-color="#a87b25"/><stop offset="1" stop-color="#6e4d12"/></radialGradient>
<radialGradient id="wa-perl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#cdd0d2"/><stop offset=".3" stop-color="#e4e6e7"/><stop offset=".5" stop-color="#c3c7c9"/><stop offset=".78" stop-color="#d8dbdc"/><stop offset="1" stop-color="#bcc0c2"/></radialGradient>
<pattern id="wa-perlage" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#c4c8ca"/><circle cx="0" cy="0" r="12.5" fill="url(#wa-perl)"/><circle cx="22" cy="0" r="12.5" fill="url(#wa-perl)"/><circle cx="11" cy="11" r="12.5" fill="url(#wa-perl)"/><circle cx="0" cy="22" r="12.5" fill="url(#wa-perl)"/><circle cx="22" cy="22" r="12.5" fill="url(#wa-perl)"/></pattern>
<linearGradient id="wa-stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9bdc1"/><stop offset=".3" stop-color="#f6f7f8"/><stop offset=".55" stop-color="#d5d8db"/><stop offset=".85" stop-color="#a7acb1"/><stop offset="1" stop-color="#bfc3c7"/></linearGradient>
<pattern id="wa-cotes" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="26" height="26" fill="url(#wa-stripe)"/></pattern>
<linearGradient id="wa-stripe-gilt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98d3f"/><stop offset=".3" stop-color="#f9e4ad"/><stop offset=".55" stop-color="#ddb769"/><stop offset=".85" stop-color="#a77d33"/><stop offset="1" stop-color="#c0974a"/></linearGradient>
<pattern id="wa-cotes-gilt" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><rect width="26" height="26" fill="url(#wa-stripe-gilt)"/></pattern>
<linearGradient id="wa-bevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9cdd1"/><stop offset="1" stop-color="#6f767d"/></linearGradient>
<linearGradient id="wa-bevel-gilt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3cc"/><stop offset=".5" stop-color="#d4ad60"/><stop offset="1" stop-color="#7b5821"/></linearGradient>
<linearGradient id="wa-quartz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9d4de" stop-opacity=".95"/><stop offset=".18" stop-color="#eef7fa" stop-opacity=".95"/><stop offset=".35" stop-color="#d3e6ed" stop-opacity=".9"/><stop offset=".8" stop-color="#c1dae3" stop-opacity=".9"/><stop offset="1" stop-color="#97b9c6" stop-opacity=".95"/></linearGradient>
<linearGradient id="wa-quartz-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f4f8"/><stop offset=".5" stop-color="#c6dde6"/><stop offset="1" stop-color="#a3c3cf"/></linearGradient>
<linearGradient id="wa-goldfilm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b98a2a"/><stop offset=".35" stop-color="#f7dc8a"/><stop offset=".6" stop-color="#e2b955"/><stop offset="1" stop-color="#a77a22"/></linearGradient>
<linearGradient id="wa-goldfilm-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dc8a"/><stop offset=".6" stop-color="#d9ac45"/><stop offset="1" stop-color="#a77a22"/></linearGradient>
<linearGradient id="wa-can" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6f7378"/><stop offset=".12" stop-color="#a9adb2"/><stop offset=".3" stop-color="#f3f5f6"/><stop offset=".42" stop-color="#d3d6d9"/><stop offset=".75" stop-color="#9a9fa4"/><stop offset=".92" stop-color="#c6c9cc"/><stop offset="1" stop-color="#6d7176"/></linearGradient>
<linearGradient id="wa-can-in" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b3f44"/><stop offset=".25" stop-color="#6a6f75"/><stop offset=".55" stop-color="#8d9298"/><stop offset=".8" stop-color="#5c6166"/><stop offset="1" stop-color="#34383c"/></linearGradient>
<linearGradient id="wa-lead" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d9196"/><stop offset=".45" stop-color="#f2f3f4"/><stop offset="1" stop-color="#7c8085"/></linearGradient>
<linearGradient id="wa-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f4a3f"/><stop offset=".4" stop-color="#5d8a78"/><stop offset=".6" stop-color="#3e6556"/><stop offset="1" stop-color="#22362e"/></linearGradient>
<linearGradient id="wa-copper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a3a14"/><stop offset=".45" stop-color="#e59a5c"/><stop offset=".6" stop-color="#c46d34"/><stop offset="1" stop-color="#6e3311"/></linearGradient>
<pattern id="wa-wire" width="3" height="40" patternUnits="userSpaceOnUse"><rect width="3" height="40" fill="url(#wa-copper)"/></pattern>
<linearGradient id="wa-cyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".2" stop-color="#000" stop-opacity=".05"/><stop offset=".32" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
<linearGradient id="wa-cyl-x" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".2" stop-color="#000" stop-opacity=".05"/><stop offset=".32" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>
<linearGradient id="wa-iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d8dde2"/><stop offset=".4" stop-color="#9ea6ae"/><stop offset=".6" stop-color="#b9c0c7"/><stop offset="1" stop-color="#6d757d"/></linearGradient>
<pattern id="wa-brushed" width="120" height="3" patternUnits="userSpaceOnUse"><rect width="120" height="3" fill="url(#wa-iron)" opacity="0"/><path d="M0 .5h120" stroke="#fff" stroke-opacity=".16" stroke-width=".6"/><path d="M0 2h120" stroke="#000" stroke-opacity=".07" stroke-width=".6"/></pattern>
<radialGradient id="wa-magnet" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#7c818a"/><stop offset=".5" stop-color="#4a4e56"/><stop offset="1" stop-color="#26282d"/></radialGradient>
<linearGradient id="wa-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d5a46"/><stop offset="1" stop-color="#173527"/></linearGradient>
<linearGradient id="wa-chip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4d52"/><stop offset=".5" stop-color="#1f2125"/><stop offset="1" stop-color="#121316"/></linearGradient>
<radialGradient id="wa-cell" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#dde1e5"/><stop offset=".7" stop-color="#a4abb2"/><stop offset=".9" stop-color="#c7ccd1"/><stop offset="1" stop-color="#7a8188"/></radialGradient>
<radialGradient id="wa-velvet" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#2a3531"/><stop offset="1" stop-color="#0d1311"/></radialGradient>
<radialGradient id="wa-dial" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fbfaf6"/><stop offset=".8" stop-color="#ebe7dc"/><stop offset="1" stop-color="#d6d0c2"/></radialGradient>
<linearGradient id="wa-case" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".3" stop-color="#9aa1a8"/><stop offset=".5" stop-color="#e9ecef"/><stop offset=".75" stop-color="#7b838b"/><stop offset="1" stop-color="#c9ced3"/></linearGradient>
<linearGradient id="wa-hand" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a2028"/><stop offset=".5" stop-color="#5c6774"/><stop offset="1" stop-color="#151a20"/></linearGradient>
<filter id="wa-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
<marker id="wa-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="context-stroke"/></marker>
<marker id="wa-arrow-gold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="#c49a54"/></marker>
<marker id="wa-arrow-sig" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="#5aa9c8"/></marker>
<marker id="wa-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="#c2685a"/></marker>
<marker id="wa-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="#25483d"/></marker>
<marker id="wa-arrow-ink" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0l10 5-10 5z" fill="#17201d"/></marker>
<marker id="wa-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5"><circle cx="5" cy="5" r="4" fill="context-stroke"/></marker>`;
}
/* A hidden <svg> that carries the defs, for pages with many inline figures. */
const defsSvg = () => `<svg class="wa-defs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>${defs()}</defs></svg>`;

/* ------------------------------------------------------------------ geometry */
/* Watch-style ogival (cycloidal) tooth ring. r = pitch radius. Returns a closed path.
   opts: ha, hf (addendum / dedendum in modules), s (tooth thickness at pitch, in modules),
   tip: 'ogival' | 'round' (pinion leaves), rot (deg). */
function teethPoints(cx, cy, z, r, o = {}) {
  const m = 2 * r / z, ha = (o.ha ?? 1.35) * m, hf = (o.hf ?? 1.65) * m, s = (o.s ?? 1.45) * m;
  const rot = (o.rot || 0) * D2R, ra = r + ha, rf = r - hf;
  const pts = [], aS = (s / 2) / r, pitchA = TAU / z, N = 7;
  for (let i = 0; i < z; i++) {
    const c = rot + i * pitchA;
    // root arc from previous gap centre to this tooth's root corner
    const rootStart = c - pitchA / 2, rootEnd = c - aS * 1.02;
    for (let k = 0; k <= 3; k++) { const a = rootStart + (rootEnd - rootStart) * k / 3; pts.push(polar(cx, cy, rf, a)); }
    // leading flank (radial) up to pitch circle, then ogive to the tip
    pts.push(polar(cx, cy, r, c - aS));
    for (let k = 1; k <= N; k++) {
      const t = k / N, q = t * Math.PI / 2;
      const rr = o.tip === 'round' ? r + ha * Math.sin(q) : r + ha * Math.pow(Math.sin(q), 0.85);
      const half = o.tip === 'round' ? aS * Math.cos(q) : aS * Math.pow(Math.cos(q), 0.75) * (1 - 0.04 * t);
      pts.push(polar(cx, cy, rr, c - Math.max(half, 0.0001)));
    }
    for (let k = N - 1; k >= 1; k--) {
      const t = k / N, q = t * Math.PI / 2;
      const rr = o.tip === 'round' ? r + ha * Math.sin(q) : r + ha * Math.pow(Math.sin(q), 0.85);
      const half = o.tip === 'round' ? aS * Math.cos(q) : aS * Math.pow(Math.cos(q), 0.75) * (1 - 0.04 * t);
      pts.push(polar(cx, cy, rr, c + Math.max(half, 0.0001)));
    }
    pts.push(polar(cx, cy, r, c + aS));
    const r2s = c + aS * 1.02, r2e = c + pitchA / 2;
    for (let k = 0; k <= 3; k++) { const a = r2s + (r2e - r2s) * k / 3; pts.push(polar(cx, cy, rf, a)); }
  }
  return { pts, ra, rf, m };
}
const teethPath = (cx, cy, z, r, o) => pathFrom(teethPoints(cx, cy, z, r, o).pts);

/* Windows ("crossings") between n arms, as sub-paths to combine with evenodd. */
function crossings(cx, cy, n, rIn, rOut, armW, rot = 0, curved = 0) {
  if (n <= 0 || rOut - rIn < 4) return '';
  let d = '';
  const ptOn = (phi, off, R) => { const dd = Math.sqrt(Math.max(R * R - off * off, 0));
    return [cx + dd * Math.cos(phi) - off * Math.sin(phi), cy + dd * Math.sin(phi) + off * Math.cos(phi)]; };
  for (let k = 0; k < n; k++) {
    const p1 = rot * D2R + k * TAU / n, p2 = p1 + TAU / n, w = armW / 2;
    const a = ptOn(p1, w, rIn), b = ptOn(p1, w, rOut), c = ptOn(p2, -w, rOut), e = ptOn(p2, -w, rIn);
    const big = (TAU / n) > Math.PI ? 1 : 0;
    const mid = curved ? polar(cx, cy, (rIn + rOut) / 2, p1 + TAU / n * 0.18) : null;
    d += 'M' + P(a[0], a[1]) + (curved ? 'Q' + P(mid[0], mid[1]) + ' ' + P(b[0], b[1]) : 'L' + P(b[0], b[1])) +
      `A${f(rOut)} ${f(rOut)} 0 ${big} 1 ${P(c[0], c[1])}` + 'L' + P(e[0], e[1]) +
      `A${f(rIn)} ${f(rIn)} 0 ${big} 0 ${P(a[0], a[1])}Z`;
  }
  return d;
}
const circ = (cx, cy, r) => `M${P(cx - r, cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/* ------------------------------------------------------------------ parts */
/* Static shadow under a round part. */
const shadow = (cx, cy, r, dx = 4, dy = 6) => `<circle cx="${f(cx + dx)}" cy="${f(cy + dy)}" r="${f(r * 1.08)}" fill="url(#wa-shadow)"/>`;

/* Anisotropic sheen of a circular-grained surface: two bright wedges that stay put
   relative to the light while the part turns. Rotation invariant clip (a disc). */
function sheen(cx, cy, r, o = {}) {
  const a0 = (o.angle ?? -135) * D2R, w = (o.width ?? 22) * D2R, op = o.opacity ?? 0.85, ri = o.inner || 0;
  const wedge = a => { const p1 = polar(cx, cy, r, a - w), p2 = polar(cx, cy, r, a + w);
    if (!ri) return `M${P(cx, cy)}L${P(p1[0], p1[1])}A${f(r)} ${f(r)} 0 0 1 ${P(p2[0], p2[1])}Z`;
    const q1 = polar(cx, cy, ri, a + w), q2 = polar(cx, cy, ri, a - w);
    return `M${P(q2[0], q2[1])}L${P(p1[0], p1[1])}A${f(r)} ${f(r)} 0 0 1 ${P(p2[0], p2[1])}L${P(q1[0], q1[1])}A${f(ri)} ${f(ri)} 0 0 0 ${P(q2[0], q2[1])}Z`; };
  const fill = ri ? `fill="#fff" fill-opacity="${f(op * .34)}"` : `fill="url(#wa-wedge)" opacity="${f(op)}"`;
  return `<path d="${wedge(a0)}${wedge(a0 + Math.PI)}" ${fill} pointer-events="none"/>`;
}
/* Jewel in a polished countersink (static). size = jewel radius. */
function jewel(cx, cy, r, o = {}) {
  const sink = o.gilt ? 'url(#wa-sink-gilt)' : 'url(#wa-sink)';
  return `<g class="wa-jewel"${attrs({ 'data-part': o.part })}>` +
    (o.sink === false ? '' : `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 1.85)}" fill="${sink}"/>`) +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#wa-ruby)" stroke="#4a0512" stroke-width="${f(Math.max(.4, r * .06))}"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .62)}" fill="none" stroke="#ff9fb0" stroke-opacity=".45" stroke-width="${f(r * .1)}"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * .26)}" fill="#3a0410"/>` +
    `<circle cx="${f(cx - r * .05)}" cy="${f(cy - r * .07)}" r="${f(r * .12)}" fill="#c8c9cc"/>` +
    `<path d="M${P(cx - r * .72, cy - r * .1)}A${f(r * .74)} ${f(r * .74)} 0 0 1 ${P(cx - r * .05, cy - r * .74)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${f(r * .14)}" stroke-linecap="round"/>` +
    `</g>`;
}

/* Screw head with slot. kind: 'blued' | 'steel' | 'gold'. */
function screw(cx, cy, r, ang = 30, kind = 'blued') {
  const fill = kind === 'gold' ? 'url(#wa-screwgold)' : kind === 'steel' ? 'url(#wa-screwsteel)' : 'url(#wa-screwhead)';
  const a = ang * D2R, dx = Math.cos(a) * r * .92, dy = Math.sin(a) * r * .92;
  return `<g class="wa-screw"><circle cx="${f(cx + r * .12)}" cy="${f(cy + r * .18)}" r="${f(r * 1.08)}" fill="#000" opacity=".28"/>` +
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="#0a0f1a" stroke-opacity=".55" stroke-width="${f(r * .08)}"/>` +
    `<path d="M${P(cx - dx, cy - dy)}L${P(cx + dx, cy + dy)}" stroke="#0b0e14" stroke-width="${f(r * .3)}" stroke-linecap="butt"/>` +
    `<path d="M${P(cx - dx, cy - dy + r * .1)}L${P(cx + dx, cy + dy + r * .1)}" stroke="#fff" stroke-opacity=".25" stroke-width="${f(r * .08)}"/></g>`;
}

/* A wheel: tooth ring + crossings + optional pinion and arbor. The rotating group gets `id`.
   Returns markup. Static sheen and jewel are drawn above the rotating group. */
function wheel(o) {
  const { x, y, z, r } = o, mat = MAT[o.mat || 'gilt'];
  const tp = teethPoints(x, y, z, r, o.tooth || {});
  const rimIn = tp.rf - Math.max(2.2, r * (o.rim ?? 0.11));
  const hubR = o.hub ?? Math.max(4, r * 0.2);
  const arms = o.arms ?? (r > 22 ? (o.armsN || 4) : 0);
  const armW = o.armW ?? Math.max(2.4, r * 0.1);
  const body = pathFrom(tp.pts) + (arms ? crossings(x, y, arms, hubR, rimIn, armW, o.armRot || 0, o.curved ? 1 : 0) : '');
  let rot = `<path d="${body}" fill="${mat.fill}" fill-rule="evenodd" stroke="${mat.edge}" stroke-width="${f(o.sw ?? Math.max(.5, r * .012))}" stroke-linejoin="round"/>`;
  if (arms) rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rimIn)}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="${f(Math.max(.6, r * .012))}"/>`;
  if (o.pinion) {
    const pz = o.pinion.z, pr = o.pinion.r, pm = MAT[o.pinion.mat || 'steel'];
    rot += `<path d="${teethPath(x, y, pz, pr, { ha: .75, hf: 1.3, s: 1.05, tip: 'round', rot: o.pinion.rot || 0 })}" fill="${pm.fill}" stroke="${pm.edge}" stroke-width="${f(Math.max(.4, pr * .03))}"/>`;
  }
  if (o.marker !== false && r > 14) { // tiny engraved index so rotation reads clearly
    const p = polar(x, y, (hubR + rimIn) / 2, (o.armRot || 0) * D2R);
    if (!arms) rot += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${f(Math.max(1.2, r * .035))}" fill="#000" opacity=".25"/>`;
  }
  rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(hubR)}" fill="${mat.fill}" stroke="${mat.edge}" stroke-width="${f(Math.max(.4, r * .01))}"/>`;
  rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(hubR * .55)}" fill="url(#wa-steel)" stroke="#4b525a" stroke-width=".5"/>`;
  let out = `<g${attrs({ class: 'wa-wheel ' + (o.cls || ''), 'data-part': o.part, 'data-x': x, 'data-y': y })}>`;
  if (o.shadow !== false) out += shadow(x, y, tp.ra, o.sx ?? r * .06, o.sy ?? r * .1);
  out += `<g${attrs({ id: o.id, class: 'wa-rot' })}>${rot}</g>`;
  if (o.sheen !== false) out += arms ? sheen(x, y, tp.rf, { inner: rimIn, opacity: o.sheenOp ?? .9 }) + sheen(x, y, hubR, { opacity: .6 }) : sheen(x, y, tp.rf, { opacity: o.sheenOp ?? .75 });
  if (o.jewel !== false) out += jewel(x, y, Math.max(2.2, Math.min(hubR * .7, 9)), { gilt: o.mat === 'gilt' || o.mat === 'brass' });
  return out + '</g>';
}

/* A pinion alone (e.g. on the Lavet rotor). */
const pinion = (x, y, z, r, o = {}) => {
  const m = MAT[o.mat || 'steel'];
  return `<path${attrs({ id: o.id })} d="${teethPath(x, y, z, r, { ha: .75, hf: 1.3, s: 1.05, tip: 'round', rot: o.rot || 0 })}" fill="${m.fill}" stroke="${m.edge}" stroke-width="${f(Math.max(.4, r * .04))}"/>`;
};

/* Flat spiral (hairspring or mainspring). Returns path d.
   r0 inner radius, r1 outer radius, turns, phase (rad), twist (rad added at inner end,
   fading to 0 at the outer end, which is how a hairspring breathes). */
function spiral(cx, cy, r0, r1, turns, phase = 0, twist = 0, steps) {
  const n = steps || Math.max(120, Math.round(turns * 48)), pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n, th = s * turns * TAU, rr = r0 + (r1 - r0) * s;
    const a = th + phase + twist * (1 - s);
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return pathFrom(pts, false);
}

/* Mainspring inside a barrel at state of wind w (0 = run down, lying on the wall;
   1 = fully wound, wrapped round the arbor). Returns path d of the strip centre-line. */
function mainspringPath(cx, cy, rArbor, rWall, turns, w, phase = 0) {
  const pitch = (rWall - rArbor) / (turns * 1.85 + 2);
  const na = Math.max(0, Math.min(turns, w * turns));
  const n = Math.round(turns * 64), pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n * turns;                  // turn index along the strip from the arbor
    const inner = rArbor + pitch * (0.7 + u);
    const outer = rWall - pitch * (0.7 + (turns - u));
    const k = Math.min(1, Math.max(0, (u - na + 0.4) / 1.4));
    const sm = k * k * (3 - 2 * k);
    const rr = inner * (1 - sm) + outer * sm;
    const a = -u * TAU + phase;
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return pathFrom(pts, false);
}

/* Barrel with toothed rim and the coiled mainspring visible (cover cut away).
   Returns markup; rotating drum gets id `${id}`, the spring path gets id `${id}-spring`. */
function barrel(o) {
  const { x, y, r } = o, z = o.z || 80;
  const tp = teethPoints(x, y, z, r, { ha: 1.2, hf: 1.4, s: 1.4 });
  const wall = tp.rf - r * .07, arb = r * .2;
  let rot = `<path d="${pathFrom(tp.pts)}${circ(x, y, wall)}" fill="url(#wa-gilt)" fill-rule="evenodd" stroke="#6d4c19" stroke-width="${f(r * .012)}"/>`;
  rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(wall)}" fill="#1a1d20"/>`;
  rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(wall)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${f(r * .03)}"/>`;
  const spring = mainspringPath(x, y, arb, wall, o.turns || 9, o.wind ?? .6);
  let out = `<g${attrs({ class: 'wa-barrel ' + (o.cls || ''), 'data-part': o.part })}>` + shadow(x, y, tp.ra, r * .05, r * .08);
  out += `<g${attrs({ id: o.id, class: 'wa-rot' })}>${rot}</g>`;
  out += `<path${attrs({ id: o.id ? o.id + '-spring' : undefined })} d="${spring}" fill="none" stroke="#5f6870" stroke-width="${f(Math.max(1.1, (wall - arb) / ((o.turns || 9) * 1.85 + 2) * .78))}" stroke-linecap="round"/>`;
  out += `<path${attrs({ id: o.id ? o.id + '-spring-hi' : undefined })} d="${spring}" fill="none" stroke="url(#wa-steel-lin)" stroke-width="${f(Math.max(.7, (wall - arb) / ((o.turns || 9) * 1.85 + 2) * .45))}" stroke-linecap="round"/>`;
  out += `<g${attrs({ id: o.id ? o.id + '-arbor' : undefined })}><circle cx="${f(x)}" cy="${f(y)}" r="${f(arb)}" fill="url(#wa-steel)" stroke="#4a5058" stroke-width=".8"/>` +
    `<path d="M${P(x - arb * .55, y - arb * .55)}h${f(arb * 1.1)}v${f(arb * 1.1)}h${f(-arb * 1.1)}z" fill="#8a929a" stroke="#4a5058" stroke-width=".6"/></g>`;
  out += sheen(x, y, tp.rf, { inner: wall, opacity: .9, width: 18 });
  return out + '</g>';
}

/* Swiss-lever escape wheel: club teeth. z teeth, r = tip radius. */
function escapeWheelPath(cx, cy, z, r, rot = 0) {
  const pts = [], pitch = TAU / z;
  const T = [[-.34, .79], [-.2, .815], [-.08, .86], [.02, .925], [.06, .962], [.1, .975], [.24, 1], [.27, .992], [.25, .955], [.17, .875], [.11, .815], [.08, .79]];
  for (let i = 0; i < z; i++) {
    const c = rot * D2R + i * pitch;
    for (const [da, rf] of T) pts.push(polar(cx, cy, r * rf, c + da * pitch));
  }
  return pathFrom(pts);
}
function escapeWheel(o) {
  const { x, y, r } = o, z = o.z || 20;
  const hub = r * .2, rimIn = r * .62;
  const d = escapeWheelPath(x, y, z, r, o.rot || 0) + crossings(x, y, o.arms || 4, hub, rimIn, r * .08);
  let out = `<g${attrs({ class: 'wa-escape ' + (o.cls || ''), 'data-part': o.part })}>` + shadow(x, y, r, r * .05, r * .08);
  out += `<g${attrs({ id: o.id, class: 'wa-rot' })}><path d="${d}" fill="url(#wa-steel)" fill-rule="evenodd" stroke="#4a5058" stroke-width="${f(Math.max(.5, r * .012))}" stroke-linejoin="round"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rimIn)}" fill="none" stroke="#000" stroke-opacity=".15"/>` +
    (o.pinion ? `<path d="${teethPath(x, y, o.pinion.z || 7, o.pinion.r || r * .18, { ha: .75, hf: 1.3, s: 1.05, tip: 'round' })}" fill="url(#wa-steel)" stroke="#4a5058" stroke-width=".5"/>` : '') +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(hub * .55)}" fill="url(#wa-steel)" stroke="#4a5058" stroke-width=".5"/></g>`;
  out += sheen(x, y, r * .78, { inner: rimIn, opacity: .9 });
  if (o.jewel !== false) out += jewel(x, y, Math.max(2.2, r * .07));
  return out + '</g>';
}

/* Swiss lever pallet fork. (x,y) = pivot. R = escape wheel tip radius it works with.
   dir = angle (deg) from the pivot toward the fork end, i.e. away from the escape wheel.
   Geometry: pivot sits 1.082 R from the wheel centre so the stones embrace 2.5 teeth. */
function palletFork(o) {
  const { x, y } = o, s = (o.R || 60) / 60, a = (o.dir ?? 0) * D2R, L = o.lever || 72;
  const T = (u, v) => [x + (u * Math.cos(a) - v * Math.sin(a)) * s, y + (u * Math.sin(a) + v * Math.cos(a)) * s];
  const poly = arr => pathFrom(arr.map(p => T(p[0], p[1])));
  const k = L / 72;
  const body = poly([[-7, -5], [-12, -14], [-15, -27], [-9, -31], [-4, -27], [-1, -15], [5, -6], [56 * k, -3], [62 * k, -8], [76 * k, -6.5], [78 * k, -2.4],
    [69 * k, -2.4], [69 * k, 2.4], [78 * k, 2.4], [76 * k, 6.5], [62 * k, 8], [56 * k, 3], [5, 6], [-1, 15], [-4, 27], [-9, 31], [-15, 27], [-12, 14], [-7, 5]]);
  const stone = (u, v) => { const ang = Math.atan2(-v, -65 - u), Ls = 13, W = 4.6, c = Math.cos(ang), sn = Math.sin(ang);
    const q = [[-2, -W / 2], [Ls, -W / 2], [Ls, W / 2], [-2, W / 2]].map(([p, q2]) => [u + p * c - q2 * sn, v + p * sn + q2 * c]);
    return poly(q); };
  let out = `<g${attrs({ class: 'wa-pallet ' + (o.cls || ''), id: o.id, 'data-part': o.part })}>`;
  out += `<path d="${body}" fill="#000" opacity=".25" transform="translate(${f(2 * s)} ${f(3.5 * s)})"/>`;
  out += `<path d="${stone(-11, -27)}" fill="url(#wa-ruby-lin)" stroke="#4f0413" stroke-width="${f(.5 * s)}"/>`;
  out += `<path d="${stone(-11, 27)}" fill="url(#wa-ruby-lin)" stroke="#4f0413" stroke-width="${f(.5 * s)}"/>`;
  out += `<path d="${body}" fill="url(#wa-steel-lin)" stroke="#3f454c" stroke-width="${f(.7 * s)}" stroke-linejoin="round"/>`;
  out += `<path d="${poly([[8, -3.4], [54 * k, -1.6], [54 * k, 1.6], [8, 3.4]])}" fill="#fff" opacity=".35"/>`;
  const g = T(66 * k, 0);
  out += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(1.4 * s)}" fill="url(#wa-steel)" stroke="#3f454c" stroke-width=".4"/>`;
  const pv = T(0, 0);
  out += jewel(pv[0], pv[1], 3.4 * s, { sink: false });
  return out + '</g>';
}
/* Balance wheel. Rotating group id. Style 'screws' (traditional) or 'smooth'.
   Includes hairspring path with id `${id}-spring` drawn separately so callers can breathe it. */
function balanceWheel(o) {
  const { x, y, r } = o, rim = Math.max(3, r * (o.rimW ?? .085)), arms = o.arms ?? 3;
  const rIn = r - rim, mat = o.mat === 'gold' ? 'url(#wa-gold)' : 'url(#wa-gilt)';
  let rot = `<path d="${circ(x, y, r)}${circ(x, y, rIn)}" fill="${mat}" fill-rule="evenodd" stroke="#6d4c19" stroke-width="${f(Math.max(.5, r * .008))}"/>`;
  for (let k = 0; k < arms; k++) {
    const a = (o.armRot ?? -90) * D2R + k * TAU / arms, w = Math.max(2, r * .07);
    const p0 = polar(x, y, r * .1, a), p1 = polar(x, y, rIn + 1, a), nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
    rot += `<path d="M${P(p0[0] + nx, p0[1] + ny)}L${P(p1[0] + nx * .8, p1[1] + ny * .8)}L${P(p1[0] - nx * .8, p1[1] - ny * .8)}L${P(p0[0] - nx, p0[1] - ny)}Z" fill="${mat}" stroke="#6d4c19" stroke-width="${f(Math.max(.4, r * .006))}"/>`;
  }
  if (o.screws !== false) {
    const n = o.screwsN || 12;
    for (let k = 0; k < n; k++) { const a = k * TAU / n + TAU / n / 2, p = polar(x, y, r + rim * .45, a);
      rot += screw(p[0], p[1], Math.max(1.6, rim * .62), (a / D2R) + 90, 'gold'); }
  }
  // roller with impulse jewel
  if (o.roller !== false) {
    const rr = r * .16, ip = polar(x, y, rr * .9, (o.pinAngle ?? 90) * D2R);
    rot += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="url(#wa-steel)" stroke="#4a5058" stroke-width=".6"/>`;
    rot += `<rect x="${f(ip[0] - rr * .16)}" y="${f(ip[1] - rr * .3)}" width="${f(rr * .32)}" height="${f(rr * .6)}" rx="${f(rr * .1)}" fill="url(#wa-ruby-lin)" stroke="#4f0413" stroke-width=".4" transform="rotate(${f((o.pinAngle ?? 90) - 90)} ${f(ip[0])} ${f(ip[1])})"/>`;
  }
  let out = `<g${attrs({ class: 'wa-balance ' + (o.cls || ''), 'data-part': o.part })}>` + (o.shadow === false ? '' : `<circle cx="${f(x + r * .05)}" cy="${f(y + r * .08)}" r="${f(r - rim / 2)}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="${f(rim * 1.6)}" filter="url(#wa-soft)"/>`);
  out += `<g${attrs({ id: o.id, class: 'wa-rot' })}>${rot}</g>`;
  out += sheen(x, y, r, { opacity: .5, width: 16 });
  return out + '</g>';
}
/* Hairspring as two stacked strokes (dark body + bright edge) for a metallic read. */
function hairspring(o) {
  const d = spiral(o.x, o.y, o.r0, o.r1, o.turns || 11, o.phase || 0, o.twist || 0);
  const w = o.w || 1.1, col = o.blued ? '#1f3a8a' : '#58626b', hi = o.blued ? '#9fc0ff' : '#f2f5f7';
  return `<g class="wa-hairspring" pointer-events="none"><path${attrs({ id: o.id })} d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round"/>` +
    `<path${attrs({ id: o.id ? o.id + '-hi' : undefined })} d="${d}" fill="none" stroke="${hi}" stroke-opacity=".55" stroke-width="${f(w * .4)}" stroke-linecap="round" transform="translate(-.3 -.3)"/></g>`;
}

/* Bridge/cock: a polished-bevel plate outline filled with Côtes de Genève. */
function bridge(d, o = {}) {
  const fill = o.gilt ? 'url(#wa-cotes-gilt)' : 'url(#wa-cotes)', bev = o.gilt ? 'url(#wa-bevel-gilt)' : 'url(#wa-bevel)';
  return `<g${attrs({ class: 'wa-bridge ' + (o.cls || ''), 'data-part': o.part, opacity: o.opacity })}>` +
    `<path d="${d}" fill="#000" opacity=".3" transform="translate(4 7)" filter="url(#wa-soft)"/>` +
    `<path d="${d}" fill="${bev}" stroke="#4a5058" stroke-width="1"/>` +
    `<path d="${d}" fill="${fill}" transform="${o.inset || ''}" stroke="none" opacity=".96"/>` +
    `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.4" transform="translate(-.6 -.8)"/>` +
    `<path d="${d}" fill="none" stroke="#2c3238" stroke-opacity=".7" stroke-width="1"/></g>`;
}

/* Oscillating weight (rotor): sector with Côtes de Genève and a heavy rim. */
function rotor(o) {
  const { x, y, r } = o, a0 = (o.from ?? 10) * D2R, a1 = (o.to ?? 170) * D2R, rh = r * .12;
  const p0 = polar(x, y, r, a0), p1 = polar(x, y, r, a1), q0 = polar(x, y, r * .78, a1), q1 = polar(x, y, r * .78, a0);
  const plate = `M${P(x + rh * Math.cos(a0 - .5), y + rh * Math.sin(a0 - .5))}L${P(p0[0], p0[1])}A${f(r)} ${f(r)} 0 0 1 ${P(p1[0], p1[1])}L${P(x + rh * Math.cos(a1 + .5), y + rh * Math.sin(a1 + .5))}A${f(rh)} ${f(rh)} 0 1 1 ${P(x + rh * Math.cos(a0 - .5), y + rh * Math.sin(a0 - .5))}Z`;
  const mass = `M${P(p0[0], p0[1])}A${f(r)} ${f(r)} 0 0 1 ${P(p1[0], p1[1])}L${P(q0[0], q0[1])}A${f(r * .78)} ${f(r * .78)} 0 0 0 ${P(q1[0], q1[1])}Z`;
  const op = o.opacity ?? 1;
  return `<g${attrs({ class: 'wa-rotor ' + (o.cls || ''), id: o.id, 'data-part': o.part })} opacity="${op}">` +
    `<path d="${plate}" fill="#000" opacity=".28" transform="translate(5 9)" filter="url(#wa-soft)"/>` +
    `<path d="${plate}" fill="url(#wa-cotes)" stroke="#4a5058" stroke-width="1.2"/>` +
    `<path d="${mass}" fill="url(#wa-cotes-gilt)" stroke="#6d4c19" stroke-width="1.2"/>` +
    `<path d="${mass}" fill="url(#wa-sheen)" opacity=".55"/>` +
    `<path d="${plate}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" transform="translate(-.6 -.8)"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rh * 1.05)}" fill="url(#wa-steel)" stroke="#4a5058"/>` +
    screw(x, y, rh * .55, 20, 'blued') + `</g>`;
}

/* Main plate with perlage, as a disc. */
const plate = (x, y, r, o = {}) => `<g class="wa-plate"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#wa-perlage)"/>` +
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#wa-sheen)" opacity=".35"/>` +
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r - 1)}" fill="none" stroke="#8b9096" stroke-width="2"/></g>`;

/* Case ring (polished steel) around a movement. */
const caseRing = (x, y, r, w = 16) => `<g class="wa-case"><circle cx="${f(x + 5)}" cy="${f(y + 9)}" r="${f(r + w / 2)}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="${f(w + 6)}" filter="url(#wa-soft)"/>` +
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + w / 2)}" fill="none" stroke="url(#wa-case)" stroke-width="${f(w)}"/>` +
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="#3b4148" stroke-width="1.2"/>` +
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + w)}" fill="none" stroke="#3b4148" stroke-width="1.2"/></g>`;

/* ------------------------------------------------------------------ quartz parts */
/* Tine outline following a bent centre line. cx = rest x of the tine centre, y0 base, y1 tip,
   u(s) lateral displacement (s from 0 at base to 1 at tip), lateral band [o1, o2] from centre. */
function bentBand(cx, y0, y1, u, o1, o2, N = 28, tipRound = 0) {
  const L = [], R = [];
  for (let i = 0; i <= N; i++) { const s = i / N, y = y0 - s * (y0 - y1), d = u(s); L.push([cx + d + o1, y]); R.push([cx + d + o2, y]); }
  if (tipRound) {
    const tl = L[N], tr = R[N];
    return pathFrom(L, false) + `Q${P(tl[0], tl[1] - tipRound)} ${P((tl[0] + tr[0]) / 2, tl[1] - tipRound)}Q${P(tr[0], tr[1] - tipRound)} ${P(tr[0], tr[1])}` + pathFrom(R.slice().reverse(), false).replace('M', 'L') + 'Z';
  }
  return pathFrom(L, false) + pathFrom(R.slice().reverse(), false).replace('M', 'L') + 'Z';
}

/* Tubular crystal can, cut open, with the fork on its mount. Static illustration.
   Can axis vertical, (x,y) = top centre of the can, w width, h height. */
function crystalCan(o) {
  const { x, y, w, h } = o, r = w / 2, inner = r * .82, sealH = h * .17, top = y, bot = y + h;
  let s = `<g class="wa-can">`;
  s += `<ellipse cx="${f(x + 6)}" cy="${f(bot + h * .24)}" rx="${f(r * 1.4)}" ry="${f(r * .3)}" fill="#000" opacity=".25" filter="url(#wa-soft)"/>`;
  // leads
  for (const dx of [-r * .42, r * .42]) s += `<rect x="${f(x + dx - r * .07)}" y="${f(bot - 4)}" width="${f(r * .14)}" height="${f(h * .28)}" rx="1" fill="url(#wa-lead)" stroke="#5c6166" stroke-width=".5"/>`;
  // body (back half visible as the dark interior)
  s += `<path d="M${P(x - r, top + r * .35)}A${f(r)} ${f(r * .35)} 0 0 1 ${P(x + r, top + r * .35)}V${f(bot - sealH)}H${f(x - r)}Z" fill="url(#wa-can)" stroke="#55595e" stroke-width=".9"/>`;
  // cut window
  const wy0 = top + h * .08, wy1 = bot - sealH - h * .02;
  s += `<rect x="${f(x - inner)}" y="${f(wy0)}" width="${f(inner * 2)}" height="${f(wy1 - wy0)}" rx="${f(inner * .25)}" fill="url(#wa-can-in)"/>`;
  s += `<rect x="${f(x - inner)}" y="${f(wy0)}" width="${f(inner * 2)}" height="${f(wy1 - wy0)}" rx="${f(inner * .25)}" fill="none" stroke="#2c3034" stroke-width="1.2"/>`;
  s += `<path d="M${P(x - inner + 1, wy0 + 2)}V${f(wy1 - 2)}" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>`;
  // seal plug (glass in metal ring)
  s += `<rect x="${f(x - r)}" y="${f(bot - sealH)}" width="${f(w)}" height="${f(sealH)}" fill="url(#wa-can)" stroke="#55595e" stroke-width=".9"/>`;
  s += `<rect x="${f(x - r * .78)}" y="${f(bot - sealH + sealH * .22)}" width="${f(r * 1.56)}" height="${f(sealH * .56)}" rx="2" fill="url(#wa-glass)" opacity=".85"/>`;
  // fork inside: base on two posts from the seal, tines up
  const fy = wy1 - h * .04, fw = inner * 1.1, tineW = fw * .3, gap = fw - 2 * tineW, tl = (wy1 - wy0) * .64;
  const postY = bot - sealH;
  for (const dx of [-r * .42, r * .42]) s += `<rect x="${f(x + dx - 1.2)}" y="${f(fy - 2)}" width="2.4" height="${f(postY - fy + 2)}" fill="url(#wa-lead)"/>`;
  const by = fy - h * .1;
  s += `<rect x="${f(x - fw / 2)}" y="${f(by)}" width="${f(fw)}" height="${f(fy - by)}" rx="1" fill="url(#wa-quartz)" stroke="#5f7c87" stroke-width=".6"/>`;
  s += `<rect x="${f(x - fw / 2)}" y="${f(by - tl)}" width="${f(tineW)}" height="${f(tl + 1)}" rx="1" fill="url(#wa-quartz)" stroke="#5f7c87" stroke-width=".6"/>`;
  s += `<rect x="${f(x + gap / 2)}" y="${f(by - tl)}" width="${f(tineW)}" height="${f(tl + 1)}" rx="1" fill="url(#wa-quartz)" stroke="#5f7c87" stroke-width=".6"/>`;
  for (const tx of [x - fw / 2, x + gap / 2]) {
    s += `<rect x="${f(tx + tineW * .3)}" y="${f(by - tl * .78)}" width="${f(tineW * .4)}" height="${f(tl * .78)}" fill="url(#wa-goldfilm-v)" opacity=".9"/>`;
    s += `<rect x="${f(tx + tineW * .1)}" y="${f(by - tl)}" width="${f(tineW * .8)}" height="${f(tl * .14)}" fill="url(#wa-goldfilm)"/>`;
  }
  s += `<rect x="${f(x - fw * .42)}" y="${f(by + (fy - by) * .35)}" width="${f(fw * .26)}" height="${f((fy - by) * .45)}" fill="url(#wa-goldfilm)"/>`;
  s += `<rect x="${f(x + fw * .16)}" y="${f(by + (fy - by) * .35)}" width="${f(fw * .26)}" height="${f((fy - by) * .45)}" fill="url(#wa-goldfilm)"/>`;
  // front lip of the can (cut edge highlight)
  s += `<ellipse cx="${f(x)}" cy="${f(top + r * .35)}" rx="${f(r)}" ry="${f(r * .35)}" fill="url(#wa-can)" stroke="#55595e" stroke-width=".9"/>`;
  s += `<path d="M${P(x - r * .6, top + r * .2)}A${f(r * .7)} ${f(r * .2)} 0 0 1 ${P(x + r * .4, top + r * .14)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`;
  return s + `</g>`;
}

/* Coin cell, seen from the top at a slight angle. */
const coinCell = (x, y, r) => `<g class="wa-cell"><ellipse cx="${f(x + 4)}" cy="${f(y + r * .55)}" rx="${f(r * 1.04)}" ry="${f(r * .5)}" fill="#000" opacity=".25" filter="url(#wa-soft)"/>` +
  `<ellipse cx="${f(x)}" cy="${f(y + r * .14)}" rx="${f(r)}" ry="${f(r * .42)}" fill="#7d848b"/>` +
  `<rect x="${f(x - r)}" y="${f(y)}" width="${f(r * 2)}" height="${f(r * .14)}" fill="url(#wa-can)"/>` +
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * .42)}" fill="url(#wa-cell)" stroke="#6b7279" stroke-width=".8"/>` +
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * .78)}" ry="${f(r * .32)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/></g>`;

/* Coil on a bobbin, axis horizontal from x0 to x1 at y, radius rr. Turns drawn as fine copper stripes. */
function coil(o) {
  const { x0, x1, y, rr } = o, fl = o.flange ?? rr * .35;
  let s = `<g class="wa-coil"${attrs({ id: o.id })}>`;
  s += `<rect x="${f(x0 + 4)}" y="${f(y - rr + 8)}" width="${f(x1 - x0)}" height="${f(rr * 2)}" rx="${f(rr * .3)}" fill="#000" opacity=".25" filter="url(#wa-soft)"/>`;
  s += `<rect x="${f(x0)}" y="${f(y - rr)}" width="${f(x1 - x0)}" height="${f(rr * 2)}" rx="${f(rr * .18)}" fill="url(#wa-wire)"/>`;
  s += `<rect class="wa-coil-glow" x="${f(x0)}" y="${f(y - rr)}" width="${f(x1 - x0)}" height="${f(rr * 2)}" rx="${f(rr * .18)}" fill="#ff6a3d" opacity="0"/>`;
  s += `<rect x="${f(x0)}" y="${f(y - rr)}" width="${f(x1 - x0)}" height="${f(rr * 2)}" rx="${f(rr * .18)}" fill="url(#wa-cyl)"/>`;
  for (const fx of [x0 - fl, x1]) s += `<rect x="${f(fx)}" y="${f(y - rr * 1.18)}" width="${f(fl)}" height="${f(rr * 2.36)}" rx="1.5" fill="#2b2622" stroke="#121010" stroke-width=".6"/>` +
    `<rect x="${f(fx)}" y="${f(y - rr * 1.18)}" width="${f(fl)}" height="${f(rr * 2.36)}" rx="1.5" fill="url(#wa-cyl)" opacity=".7"/>`;
  return s + `</g>`;
}

/* ------------------------------------------------------------------ annotation */
/* Leader line from a part anchor (ax,ay) to a label at (lx,ly) with an elbow; text anchored by side. */
function leader(ax, ay, lx, ly, text, o = {}) {
  const side = o.side || (lx < ax ? 'end' : 'start'), ex = side === 'end' ? lx + 4 : lx - 4;
  const lines = Array.isArray(text) ? text : [text];
  let s = `<g class="wa-leader${o.cls ? ' ' + o.cls : ''}"${attrs({ 'data-for': o.part })}>`;
  s += `<path d="M${P(ax, ay)}L${P(ex + (side === 'end' ? 10 : -10), ly - 4)}H${f(ex)}" class="wa-leader-line" fill="none"/>`;
  s += `<circle cx="${f(ax)}" cy="${f(ay)}" r="2.6" class="wa-leader-dot"/>`;
  lines.forEach((t, i) => { s += `<text x="${f(lx)}" y="${f(ly + i * (o.lh || 14))}" text-anchor="${side}" class="${i ? 'wa-leader-sub' : 'wa-leader-text'}">${esc(t)}</text>`; });
  return s + '</g>';
}

/* Gear-mesh helper: centre distance between a wheel of pitch radius R and pinion pitch radius r. */
const meshDist = (R, r) => R + r;

const API = { defs, defsSvg, teethPath, teethPoints, crossings, circ, wheel, pinion, spiral, mainspringPath, barrel,
  escapeWheel, escapeWheelPath, palletFork, balanceWheel, hairspring, bridge, rotor, plate, caseRing, jewel, screw,
  sheen, shadow, bentBand, crystalCan, coinCell, coil, leader, meshDist, pathFrom, polar, f, P, esc, attrs, MAT };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.WatchArt = API;
})(typeof window !== 'undefined' ? window : globalThis);
