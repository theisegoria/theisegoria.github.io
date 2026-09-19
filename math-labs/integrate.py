from pathlib import Path
import json,re,html,importlib.util
R=Path(__file__).resolve().parents[1];data=json.loads((R/'math-labs/content.json').read_text());p=R/'tools/math-encyclopedia.json';entries=json.loads(p.read_text())
for t in data:
 route='/'+t['slug']+'/'
 if not any(e['route']==route for e in entries):entries.append(dict(title=t['title'][0],title_ja=t['title'][1],route=route,route_ja='/ja'+route,description=t['description'][0],description_ja=t['description'][1],group=t['group']))
p.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
spec=importlib.util.spec_from_file_location('shell',R/'tools/site-shell.py');shell=importlib.util.module_from_spec(spec);spec.loader.exec_module(shell)
for t in data:
 for prefix in ['', '/ja']:
  route=prefix+'/'+t['slug']+'/';shell.apply(R/route.strip('/')/'index.html',route,{})
for ja in [False,True]:
 prefix='ja/' if ja else '';idx=1 if ja else 0
 for filename in [prefix+'math-encyclopedia/index.html',prefix+'index.html']:
  p=R/filename;s=p.read_text()
  def row(t):return '<a href="/'+prefix+t['slug']+'/"><span class="t">'+html.escape(t['title'][idx])+'</span><span class="d">'+html.escape(t['description'][idx])+'</span></a>'
  if 'math-encyclopedia/index' in filename:
   for group in ['foundations','analysis','geometry','applications']:
    rows=''.join(row(t) for t in data if t['group']==group and 'href="/'+prefix+t['slug']+'/"' not in s)
    pattern='(<section class="section" id="'+group+'">.*?<div class="index">)';s=re.sub(pattern,lambda m:m[1]+rows,s,count=1,flags=re.S)
  else:
   rows=''.join(row(t) for t in data if 'href="/'+prefix+t['slug']+'/"' not in s)
   s=re.sub(r'(<section class="section" id="math-encyclopedia">.*?<div class="index">)',lambda m:m[1]+rows,s,count=1,flags=re.S)
   s=s.replace('19 guides and collections','27 guides and collections').replace('19のガイドとコレクション','27のガイドとコレクション').replace('19件のガイド','27件のガイド').replace('19のガイドと実験','27のガイドと実験')
  p.write_text(s)
# Add only the new URLs to the sitemap, preserving prior entries.
p=R/'sitemap.xml';s=p.read_text()
for t in data:
 for prefix in ['', '/ja']:
  url='https://theisegoria.github.io'+prefix+'/'+t['slug']+'/'
  if '<loc>'+url+'</loc>' not in s:s=s.replace('</urlset>','<url><loc>'+url+'</loc><lastmod>2026-09-19</lastmod></url>\n</urlset>')
p.write_text(s)
print('Integrated eight topics and their paired language routes')
