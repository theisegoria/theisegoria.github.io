/* Electricity → Quartz → Motor: illustration layer. Restyles the figures drawn by the page script
   with physically based fills (quartz, gold film, soft iron, copper, magnet) from watch-art.js. */
(() => {
'use strict';
const A = window.WatchArt; if (!A) return;
const $ = s => document.querySelector(s);
document.body.insertAdjacentHTML('afterbegin', A.defsSvg().replace('</defs>',
  `<radialGradient id="eq-si" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#ffd2c8"/><stop offset=".35" stop-color="#e07a62"/><stop offset=".8" stop-color="#a3402d"/><stop offset="1" stop-color="#6e2618"/></radialGradient>` +
  `<radialGradient id="eq-o" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#e3f5ff"/><stop offset=".35" stop-color="#6fbfe3"/><stop offset=".8" stop-color="#2f7fa6"/><stop offset="1" stop-color="#1d5470"/></radialGradient></defs>`));
const css = `
#latt circle[fill="#c2685a"]{fill:url(#eq-si)}
#latt circle[fill="#5aa9c8"]{fill:url(#eq-o)}
#latt g circle{filter:drop-shadow(1px 2px 1.5px rgba(0,0,0,.25))}
#xs,#tine{fill:url(#wa-quartz);stroke:#5f7c87}
#bend rect[y="250"]{fill:url(#wa-quartz-v);stroke:#5f7c87}
#e1,#e2,#e3,#e4{stroke:#b98a2a;stroke-width:2}
#core{fill:url(#wa-iron);stroke:#4d555c}
#coil ellipse{display:none}
#rotor>path[fill="#c2685a"],#rotor>path[fill="#5aa9c8"]{opacity:.55}
.eq-coil-live{fill:#ff7a45;opacity:0;transition:opacity .1s}
#motor:has(#coil ellipse[stroke="#c2685a"]) .eq-coil-live{opacity:.35}
.bx{fill:url(#eq-card);}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
// soft iron: brushed texture and a bevel highlight over the stator outline
const core = $('#core');
if (core) {
  const d = core.getAttribute('d');
  core.insertAdjacentHTML('afterend', `<path d="${d}" fill="url(#wa-brushed)" fill-rule="evenodd" pointer-events="none"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" transform="translate(-.6 -.8)" fill-rule="evenodd" pointer-events="none"/>`);
  core.insertAdjacentHTML('beforebegin', `<path d="${d}" fill="#000" opacity=".22" transform="translate(5 8)" fill-rule="evenodd" filter="url(#wa-soft)"/>`);
}
// the coil as a wound bobbin on the core arm
const coil = $('#coil');
if (coil) coil.insertAdjacentHTML('beforebegin', A.coil({ x0: 76, x1: 238, y: 185, rr: 46, flange: 10 }) +
  `<rect class="eq-coil-live" x="76" y="139" width="162" height="92" rx="7"/>`);
// the rotor magnet body under its N and S halves
const rot = $('#rotor');
if (rot) rot.insertAdjacentHTML('afterbegin', `<circle cx="505" cy="185" r="62" fill="url(#wa-magnet)"/>`);
// card gradient for the block diagram boxes
const svg0 = document.querySelector('.wa-defs defs');
if (svg0) svg0.insertAdjacentHTML('beforeend', `<linearGradient id="eq-card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ece1"/><stop offset="1" stop-color="#e2dbcc"/></linearGradient>`);
})();
