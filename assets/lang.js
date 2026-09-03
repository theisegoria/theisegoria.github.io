/* Offers the other language version. Deliberately does NOT redirect.
 *
 * GitHub Pages serves static files, so there is no server-side access to the
 * visitor's IP or Accept-Language header; geolocation is not available here.
 * navigator.languages is a better signal anyway: it reports what the reader
 * actually wants to read, not where they happen to be sitting.
 *
 * Google's multi-regional guidance advises against automatically redirecting
 * between language versions, because it stops readers and crawlers reaching
 * every version. So this suggests, remembers the answer, and never moves you.
 */
(function () {
  'use strict';
  var KEY = 'isegoria:lang';

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var here = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var other = here === 'ja' ? 'en' : 'ja';

  var alt = document.querySelector('link[rel="alternate"][hreflang="' + other + '"]');
  if (!alt || !alt.href) return;                 // no counterpart published yet

  var saved = read(KEY);
  if (saved === here || saved === 'dismissed') return;
  if (saved === other) { location.replace(alt.href); return; }  // they chose it before

  var prefs = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || 'en'];
  var want = null;
  for (var i = 0; i < prefs.length; i++) {
    var p = String(prefs[i]).slice(0, 2).toLowerCase();
    if (p === 'ja' || p === 'en') { want = p; break; }
  }
  if (!want || want === here) return;            // already on their language

  var copy = want === 'ja'
    ? { msg: 'このページは日本語でも読めます。', go: '日本語で読む', off: '閉じる', lang: 'ja' }
    : { msg: 'This page is also available in English.', go: 'Read in English', off: 'Dismiss', lang: 'en' };

  var css = document.createElement('style');
  css.textContent =
    '.lang-notice{border-bottom:1px solid var(--line-firm,#c9c1b4);background:var(--paper-sunk,#f3f0e9);' +
    'font-family:var(--sans,ui-sans-serif,system-ui,sans-serif);font-size:.8125rem;color:var(--ink-soft,#5d574f)}' +
    '.lang-notice>div{width:min(68rem,100% - clamp(2.5rem,10vw,8rem));margin-inline:auto;' +
    'display:flex;gap:1rem 1.5rem;align-items:baseline;flex-wrap:wrap;padding:.7rem 0}' +
    '.lang-notice p{margin:0;flex:1 1 auto}' +
    '.lang-notice a{color:var(--ink,#1b1917);text-decoration:none;border-bottom:1px solid var(--accent,#8a4b26);padding-bottom:.15rem}' +
    '.lang-notice a:hover{color:var(--accent,#8a4b26)}' +
    '.lang-notice button{background:none;border:0;padding:0;cursor:pointer;color:var(--ink-faint,#736c62);' +
    'font:inherit;text-decoration:underline;text-underline-offset:.2em}' +
    '.lang-notice button:hover{color:var(--ink,#1b1917)}';
  document.head.appendChild(css);

  var bar = document.createElement('aside');
  bar.className = 'lang-notice';
  bar.setAttribute('aria-label', want === 'ja' ? '言語' : 'Language');
  bar.lang = copy.lang;

  var inner = document.createElement('div');
  var p = document.createElement('p'); p.textContent = copy.msg;
  var a = document.createElement('a'); a.href = alt.href; a.textContent = copy.go + ' →'; a.hreflang = other;
  var b = document.createElement('button'); b.type = 'button'; b.textContent = copy.off;

  a.addEventListener('click', function () { store(KEY, other); });
  b.addEventListener('click', function () { store(KEY, 'dismissed'); bar.remove(); });

  inner.appendChild(p); inner.appendChild(a); inner.appendChild(b);
  bar.appendChild(inner);
  document.body.insertBefore(bar, document.body.firstChild);
})();
