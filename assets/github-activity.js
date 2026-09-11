/* Latest GitHub activity, read live from the public GitHub API.
 *
 * One line per repository, most recently pushed first: the repository, the
 * newest non-merge commit on its default branch, when it was pushed, and its
 * language. Only public, non-fork repositories appear, because the API is
 * called without credentials.
 *
 * Unauthenticated calls are limited to 60 an hour per visitor IP. A full
 * refresh costs 1 + N calls, so the result is cached in localStorage for
 * fifteen minutes and a stale cache is shown while the refresh runs. If the
 * API cannot be reached, the static link already in the page stays put.
 * API text is only ever set through textContent.
 */
(function () {
  'use strict';
  var root = document.querySelector('.gh-activity');
  if (!root || !window.fetch) return;

  var user = root.getAttribute('data-user');
  var list = root.querySelector('.gh-feed');
  var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'ja' ? 'ja' : 'en';
  var N = 5, TTL = 15 * 60 * 1000, KEY = 'isegoria:gh:' + user, API = 'https://api.github.com';

  function get(url) {
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  }
  function readCache() {
    try { var c = JSON.parse(localStorage.getItem(KEY)); return c && c.items && c.items.length ? c : null; }
    catch (e) { return null; }
  }
  function writeCache(items) {
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), items: items })); } catch (e) {}
  }

  function ago(iso) {
    var secs = (new Date(iso).getTime() - Date.now()) / 1000;
    var units = [['year', 31536000], ['month', 2592000], ['week', 604800],
                 ['day', 86400], ['hour', 3600], ['minute', 60]];
    try {
      var rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
      for (var i = 0; i < units.length; i++) {
        if (Math.abs(secs) >= units[i][1]) return rtf.format(Math.round(secs / units[i][1]), units[i][0]);
      }
      return rtf.format(0, 'minute');
    } catch (e) {
      return new Date(iso).toLocaleDateString(lang);
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render(items) {
    var frag = document.createDocumentFragment();
    items.forEach(function (it) {
      var li = el('li');
      var a = el('a');
      a.href = it.url;
      a.appendChild(el('span', 'gh-repo', it.repo));
      if (it.msg) a.appendChild(el('span', 'gh-msg', it.msg));
      var meta = el('span', 'gh-meta');
      var t = el('time', null, ago(it.when));
      t.dateTime = it.when;
      t.title = new Date(it.when).toLocaleString(lang);
      meta.appendChild(el('span')).appendChild(t);
      if (it.language) meta.appendChild(el('span', null, it.language));
      a.appendChild(meta);
      li.appendChild(a);
      frag.appendChild(li);
    });
    list.textContent = '';
    list.appendChild(frag);
  }

  function load() {
    return get(API + '/users/' + encodeURIComponent(user) + '/repos?type=owner&sort=pushed&direction=desc&per_page=' + (N + 5))
      .then(function (repos) {
        repos = repos.filter(function (r) { return !r.fork && !r.archived && !r.private; }).slice(0, N);
        return Promise.all(repos.map(function (r) {
          var base = { repo: r.name, url: r.html_url, msg: r.description || '',
                       when: r.pushed_at, language: r.language };
          return get(API + '/repos/' + r.full_name + '/commits?per_page=5').then(function (commits) {
            var c = null;
            for (var i = 0; i < commits.length; i++) {
              if (!commits[i].parents || commits[i].parents.length < 2) { c = commits[i]; break; }
            }
            if (c) { base.msg = String(c.commit.message).split('\n')[0]; base.url = c.html_url; }
            return base;
          }, function () { return base; });   // empty repository, or rate limited mid-way
        }));
      })
      .then(function (items) {
        items.sort(function (a, b) { return new Date(b.when) - new Date(a.when); });
        return items;
      });
  }

  var cache = readCache();
  if (cache) render(cache.items);
  if (cache && Date.now() - cache.t < TTL) return;

  list.setAttribute('aria-busy', 'true');
  load().then(function (items) {
    if (items.length) { writeCache(items); render(items); }
  }).catch(function () { /* keep the cached or static list */ })
    .then(function () { list.removeAttribute('aria-busy'); });
})();
