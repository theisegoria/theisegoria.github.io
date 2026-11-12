// Shoot one figure per encyclopedia topic for the catalogue cards: the first 3D scene if the topic has one, else its
// largest 2D figure. Needs the site served at http://localhost:8770 (python3 -m http.server 8770 at the repo root).
//   node tools/shoot-thumbs.cjs <out-dir> <slug> [<slug> ...]      then      python3 tools/thumbs.py <out-dir>
// Existing PNGs in <out-dir> are skipped, so a run can be resumed; delete one to reshoot it.
const { chromium } = require('playwright'); const fs = require('fs');
const out = process.argv[2], slugs = process.argv.slice(3);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const slug of slugs) {
    if (fs.existsSync(`${out}/${slug}.png`)) continue;
    const p = await b.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    try {
      await p.goto(`http://localhost:8770/${slug}/?shadows=0`, { waitUntil: 'load', timeout: 30000 });
      await p.addStyleTag({ content: '.lab3d button,.lab3d [class*="hint"],.lab3d [class*="help"]{visibility:hidden!important}' });
      const ids = await p.$$eval('[data-lab]', (s) => s.map((x) => x.id));
      let done = false;
      for (const pass of ['3d', '2d']) {
        for (const id of ids) {
          await p.locator('#' + id).scrollIntoViewIfNeeded(); await p.waitForTimeout(350);
          const has3d = await p.$eval('#' + id, (s) => !!s.querySelector('.lab3d'));
          if (pass === '3d' && has3d) {
            await p.waitForFunction((i) => { const c = document.querySelector('#' + i + ' .lab3d-canvas'); return !document.querySelector('#' + i + ' .lab3d.is-loading') && (!c || c.dataset.backend); }, id, { timeout: 25000 }).catch(() => {});
            await p.waitForTimeout(1800); await p.locator('#' + id + ' .lab3d').first().screenshot({ path: `${out}/${slug}.png`, timeout: 15000 }); done = true; break;
          }
          if (pass === '2d' && !has3d) {
            const h = await p.$$('#' + id + ' .plot svg'); let best = null, area = 0;
            for (const e of h) { const bb = await e.boundingBox(); if (bb && bb.width * bb.height > area) { area = bb.width * bb.height; best = e; } }
            if (best) { await best.screenshot({ path: `${out}/${slug}.png`, timeout: 15000 }); done = true; break; }
          }
        }
        if (done) break;
      }
      console.log(slug, done ? 'ok' : 'NONE');
    } catch (e) { console.log(slug, 'FAIL', String(e).slice(0, 120)); }
    await p.close();
  }
  await b.close();
})();
