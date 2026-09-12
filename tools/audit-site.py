#!/usr/bin/env python3
"""Audit navigation, local destinations and fragments across all Pages projects."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
import argparse,json,subprocess

class Document(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[];self.assets=[];self.shells=0;self.refresh=False;self.dynamic=False
 def handle_starttag(self,tag,pairs):
  a=dict(pairs)
  if a.get('id'):self.ids.add(a['id'])
  if a.get('id')=='ig-header':self.shells+=1
  if a.get('id')=='root':self.dynamic=True
  if tag=='meta' and a.get('http-equiv','').lower()=='refresh':self.refresh=True
  if tag=='a' and a.get('href'):self.links.append(a['href'])
  if tag in ['script','img','iframe','source'] and a.get('src'):self.assets.append(a['src'])
  if tag=='link' and a.get('rel') in ['stylesheet','icon','manifest'] and a.get('href'):self.assets.append(a['href'])

def inventory(root,prefix):
 tracked=subprocess.check_output(['git','ls-tree','-r','--name-only','-z','HEAD'],cwd=root,text=True).split("\0")
 paths={prefix+p for p in tracked if p}
 docs={}
 for p in root.rglob('*.html'):
  if any(t in p.parts for t in ['node_modules','dist','.git','.next','.wrangler']):continue
  url=prefix+p.relative_to(root).as_posix();d=Document();d.feed(p.read_text());docs[url]=d;paths.add(url)
 for p in (root/'assets').glob('site-shell.*'):paths.add(prefix+p.relative_to(root).as_posix())
 return paths,docs

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--projects',type=Path);ap.add_argument('--output',type=Path);a=ap.parse_args();root=Path(__file__).resolve().parents[1]
 sites=[(root,'/')]
 if a.projects:
  sites += [(p,'/'+p.name+'/') for p in sorted(a.projects.iterdir()) if (p/'.git').exists() and p.name!='monster-tech-correlation']
 paths=set(json.loads((root/'tools/project-pages.json').read_text())['paths']);docs={}
 for base,prefix in sites:
  pp,dd=inventory(base,prefix);paths|=pp;docs.update(dd)
 # Include the React project's rendered HTML and emitted assets when its build is available.
 paths|={'/monster-tech-correlation/index.html','/monster-tech-correlation/monster-energy-tech-correlation.pdf'}
 if a.projects:
  built=a.projects/'monster-tech-correlation/dist/client'
  for p in built.rglob('*'):
   if not p.is_file():continue
   url='/monster-tech-correlation/'+p.relative_to(built).as_posix();paths.add(url)
   if p.suffix=='.html':
    d=Document();d.feed(p.read_text());docs[url]=d
 def resolve(base,target):
  u=urlsplit(urljoin('https://theisegoria.github.io'+base,target))
  if u.scheme not in ['http','https'] or u.netloc!='theisegoria.github.io':return None
  p=unquote(u.path);p=p+'index.html' if p.endswith('/') else p
  if p not in paths and p+'/index.html' in paths:p+='/index.html'
  return p,unquote(u.fragment)
 problems=[];links=0;assets=0;edges={p:set() for p in docs}
 for url,d in docs.items():
  if not d.refresh and d.shells!=1:problems.append({'page':url,'problem':'shared header count','value':d.shells})
  for kind,refs in [('link',d.links),('asset',d.assets)]:
   for ref in set(refs):
    target=resolve(url,ref)
    if target is None:continue
    if kind=='link':links+=1
    else:assets+=1
    p,frag=target
    if p not in paths:problems.append({'page':url,'problem':'missing '+kind,'target':ref});continue
    if kind=='link' and p in docs:edges[url].add(p)
    if frag and p in docs and frag not in docs[p].ids and not docs[p].dynamic:problems.append({'page':url,'problem':'missing fragment','target':ref})
 reachable=set();queue=['/index.html']
 while queue:
  p=queue.pop()
  if p in reachable:continue
  reachable.add(p);queue.extend(edges.get(p,set())-reachable)
 orphans=[p for p,d in docs.items() if p not in reachable and not p.endswith('/404.html') and not d.refresh]
 result={'pages':len(docs),'internal_links_checked':links,'local_assets_checked':assets,'unreachable_pages':orphans,'problems':problems}
 if a.output:a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2));raise SystemExit(bool(problems or orphans))
if __name__=='__main__':main()
