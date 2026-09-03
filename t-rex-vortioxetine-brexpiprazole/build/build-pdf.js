/* Rebuilds the-best-argument-for-t-rex.pdf from index.html.
 *
 * The PDF used to be a separate typeset document with no source in the repo,
 * so when the HTML was corrected the PDF silently kept the old content. This
 * prints the article itself, so the two cannot drift apart again.
 *
 *   npx playwright@1 install chromium   # once, if needed
 *   node build/build-pdf.js             # serves the article and prints it
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');   // repository root
const PAGE = '/t-rex-vortioxetine-brexpiprazole/index.html';
const OUT  = path.resolve(__dirname, '..', 'the-best-argument-for-t-rex.pdf');
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
                '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg' };

const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(8901, r));
  const b = await chromium.launch();
  const p = await (await b.newContext({ colorScheme: 'light' })).newPage();
  await p.goto('http://localhost:8901' + PAGE, { waitUntil: 'networkidle' });
  await p.addStyleTag({ path: path.join(__dirname, 'print.css') });
  await p.emulateMedia({ media: 'print', colorScheme: 'light' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  await p.pdf({ path: OUT, format: 'A4', printBackground: true,
    margin: { top: '20mm', bottom: '18mm', left: '18mm', right: '18mm' },
    displayHeaderFooter: true, headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8pt;color:#6b7075;font-family:Georgia,serif;padding:0 18mm;display:flex;justify-content:space-between"><span>The Best Argument for T-Rex</span><span class="pageNumber"></span></div>' });
  await b.close(); server.close();
  console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes');
})();
