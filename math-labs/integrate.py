"""Wire the generated topic pages into the site.

1. Any topic in content.json that is missing from tools/math-encyclopedia.json is
   appended there under its own group (edit the JSON afterwards to place it and
   to give it a short hub description).
2. The shared site shell is applied to every generated topic page.
3. Both encyclopedia hubs are rebuilt from the JSON by tools/build-math-hub.py.
4. Missing topic URLs are added to sitemap.xml.

The home page is not touched: its Math encyclopedia section is a short
selection that links through to the hub.
"""
from pathlib import Path
import json, importlib.util, subprocess, sys, datetime

R = Path(__file__).resolve().parents[1]
data = json.loads((R / 'math-labs/content.json').read_text())
p = R / 'tools/math-encyclopedia.json'
entries = json.loads(p.read_text())
added = 0
for t in data:
    route = '/' + t['slug'] + '/'
    if not any(e['route'] == route for e in entries):
        entries.append(dict(title=t['title'][0], title_ja=t['title'][1], route=route, route_ja='/ja' + route,
                            description=t['description'][0], description_ja=t['description'][1], group=t['group']))
        added += 1
p.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')

spec = importlib.util.spec_from_file_location('shell', R / 'tools/site-shell.py')
shell = importlib.util.module_from_spec(spec); spec.loader.exec_module(shell)
for t in data:
    for prefix in ['', '/ja']:
        route = prefix + '/' + t['slug'] + '/'
        shell.apply(R / route.strip('/') / 'index.html', route, {})

subprocess.run([sys.executable, str(R / 'tools/build-math-hub.py')], check=True)

s = (R / 'sitemap.xml').read_text()
today = datetime.date.today().isoformat()
for t in data:
    for prefix in ['', '/ja']:
        url = 'https://theisegoria.github.io' + prefix + '/' + t['slug'] + '/'
        if '<loc>' + url + '</loc>' not in s:
            s = s.replace('</urlset>', '<url><loc>' + url + '</loc><lastmod>' + today + '</lastmod></url>\n</urlset>')
(R / 'sitemap.xml').write_text(s)
print(f'Integrated {len(data)} topics ({added} new in the hub list)')
