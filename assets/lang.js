/* Language routing: Japanese for readers in Japan or reading in Japanese,
 * English for everyone else.
 *
 * GitHub Pages serves static files, so there is no server-side access to the
 * visitor's IP address. Location is approximated in the browser instead, with
 * no network request and nothing sent anywhere:
 *
 *   1. the device time zone: Asia/Tokyo means the device is set to Japan time
 *   2. the browser's language list: Japanese ahead of English means a
 *      Japanese reader, wherever they are
 *
 * Either signal selects Japanese. Everything else selects English.
 *
 * Rules that keep this from getting in the way:
 *   - Only pages with a published counterpart move. The counterpart is read
 *     from <link rel="alternate" hreflang="..">, so a page with no edition in
 *     the other language is never redirected.
 *   - A reader's own choice always wins. Clicking any language link (the nav
 *     switch, the footer, the banner) is remembered and detection stops.
 *   - Crawlers are never redirected, so search engines index both editions.
 *   - When the two signals disagree (a Japan time zone on an English-language
 *     browser), the reader lands on Japanese with a banner one click from
 *     English.
 *
 * This file is loaded in <head> without defer, so the redirect happens before
 * the first paint and nobody sees a flash of the wrong language.
 */
(function () {
  'use strict';
  var KEY = 'isegoria:lang';

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  // Remember explicit choices from any language link on any page.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest
      ? e.target.closest('a[hreflang], a[data-language-select]') : null;
    if (!a) return;
    var l = String(a.getAttribute('hreflang') || a.getAttribute('data-language-select'))
      .slice(0, 2).toLowerCase();
    if (l === 'ja' || l === 'en') store(l);
  }, true);

  var here = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var other = here === 'ja' ? 'en' : 'ja';
  var alt = document.querySelector('link[rel="alternate"][hreflang="' + other + '"]');
  if (!alt || !alt.href) return;                       // no counterpart published

  var ua = navigator.userAgent || '';
  if (navigator.webdriver ||
      /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|preview|lighthouse|pagespeed/i.test(ua)) return;

  var saved = read();
  if (saved === here || saved === 'dismissed') return; // chose this language
  if (saved === other) { location.replace(alt.href); return; }

  // Signal 1: time zone.
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  var inJapan = tz === 'Asia/Tokyo' || tz === 'Japan';

  // Signal 2: whichever of Japanese or English comes first in the browser's list.
  var prefs = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || 'en'];
  var reads = null;
  for (var i = 0; i < prefs.length; i++) {
    var p = String(prefs[i]).slice(0, 2).toLowerCase();
    if (p === 'ja' || p === 'en') { reads = p; break; }
  }

  var target = (inJapan || reads === 'ja') ? 'ja' : 'en';
  if (target !== here) { location.replace(alt.href); return; }

  // Staying put. Offer the other edition only if the browser prefers it.
  if (reads !== other) return;

  function banner() {
    var copy = other === 'ja'
      ? { msg: 'このページは日本語でも読めます。', go: '日本語で読む', off: '閉じる' }
      : { msg: 'This page is also available in English.', go: 'Read in English', off: 'Dismiss' };

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
    bar.setAttribute('aria-label', other === 'ja' ? '言語' : 'Language');
    bar.lang = other;

    var inner = document.createElement('div');
    var msg = document.createElement('p'); msg.textContent = copy.msg;
    var a = document.createElement('a'); a.href = alt.href; a.textContent = copy.go + ' →'; a.hreflang = other;
    var b = document.createElement('button'); b.type = 'button'; b.textContent = copy.off;
    b.addEventListener('click', function () { store(here); bar.remove(); });

    inner.appendChild(msg); inner.appendChild(a); inner.appendChild(b);
    bar.appendChild(inner);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.body) banner();
  else document.addEventListener('DOMContentLoaded', banner);
})();
