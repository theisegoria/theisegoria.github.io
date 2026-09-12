#!/usr/bin/env python3
"""Rebuild the English/Japanese catalogues from page metadata and project-pages.json."""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
import importlib.util, json, re

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('shell',ROOT/'tools/site-shell.py')
shell=importlib.util.module_from_spec(spec);spec.loader.exec_module(shell)
class Meta(HTMLParser):
 def __init__(self):super().__init__();self.description=''
 def handle_starttag(self,tag,pairs):
  a=dict(pairs)
  if tag=='meta' and a.get('name')=='description':self.description=a.get('content','')

def entries():
 result=[]
 for p in sorted(ROOT.rglob('*.html')):
  if any(x in p.parts for x in ['node_modules','.git','dist','.next']):continue
  source=p.read_text();route=shell.route_for(p.relative_to(ROOT));ja=shell.japanese(source)
  if shell.category(route,ja) is None:continue
  meta=Meta();meta.feed(source)
  result.append(dict(route=route,title=shell.title_of(source),ja=ja,description=meta.description))
 result.extend(json.loads((ROOT/'tools/project-pages.json').read_text())['pages'])
 return result

def main():
 pages=entries()
 for ja,file in [(False,'library.html'),(True,'ja/library.html')]:
  parts=[]
  categories=['学習ガイド','研究と解説','書籍','参考シート','プロジェクト'] if ja else ['Guides','Research','Books','Sheets','Projects']
  for i,category in enumerate(categories):
   group=[p for p in pages if p['ja']==ja and shell.category(p['route'],ja)[0]==category]
   if not group:continue
   count=f'{len(group)}ページ' if ja else f'{len(group)} '+('page' if len(group)==1 else 'pages')
   rows=[]
   for p in sorted(group,key=lambda p:p['route']):
    title=p['title'].replace(' — ',': ')
    description=re.sub(r'\s+',' ',unescape(p.get('description',''))).strip().replace(' — ',': ')
    if len(description)>180:description=description[:177].rsplit(' ',1)[0]+'…'
    if not description:description='解説を開く' if ja else 'Explore this page'
    rows.append(f'<a href="{escape(p["route"],quote=True)}"><span class="t">{escape(title)}</span><span class="d">{escape(description)}</span></a>')
   parts.append(f'<section class="section" id="group-{i}"><div class="section-head"><h2>{category}</h2><p class="label">{count}</p></div><div class="index">'+''.join(rows)+'</div></section>')
  p=ROOT/file;s=p.read_text();s=re.sub(r'<section class="section" id="group-\d+">.*(?=</main>)',''.join(parts),s,flags=re.S);p.write_text(s)
 print(f'Catalogued {len(pages)} content pages in English and Japanese')
if __name__=='__main__':main()
