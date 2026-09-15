"""Rebuild the English/Japanese catalogues from page metadata and project-pages.json.

The catalogue is a static list that every reader gets; the filter bar on top of it
is progressive enhancement, so the page still works with JavaScript switched off.
"""
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

# A page counts as interactive when it ships something the reader can operate,
# not merely when it says the word somewhere in its prose.
INTERACTIVE=re.compile(r'<canvas\b|data-course=|/assets/interactive|type="range"|app\.js|<model-viewer|three\.(?:module|webgpu)|lab-kit|data-route-fragments=',re.I)
# Chapter pages of a book belong to the book, which lists them itself.
SUBPAGE=re.compile(r'^/(?:ja/)?game-design-dynamics-of-learning/part-\d+\.html$'
                   r'|^/(?:ja/)?medical-textbook/mindmaps/')

def entries():
 result=[]
 for p in sorted(ROOT.rglob('*.html')):
  if any(x in p.parts for x in ['node_modules','.git','dist','.next']):continue
  source=p.read_text();route=shell.route_for(p.relative_to(ROOT));ja=shell.japanese(source)
  if shell.category(route,ja) is None:continue
  if SUBPAGE.match(route):continue
  meta=Meta();meta.feed(source)
  result.append(dict(route=route,title=shell.title_of(source),ja=ja,description=meta.description,
                     interactive=bool(INTERACTIVE.search(source)),
                     pdf=bool(re.search(r'href="[^"]+\.pdf',source)),
                     alternate=bool(re.search(r'hreflang="(?:ja|en)"',source))))
 for extra in json.loads((ROOT/'tools/project-pages.json').read_text())['pages']:
  extra.setdefault('interactive',False);extra.setdefault('pdf',False);extra.setdefault('alternate',False)
  result.append(extra)
 return result

def controls(ja,groups,total):
 """The search box, the filter chips and the live count."""
 labels=({'search':'タイトルと説明を検索','all':'すべて','interactive':'操作できる',
          'pdf':'PDFつき','bilingual':'日英対訳','showing':'件を表示中','none':'該当するページがありません',
          'clear':'検索条件を解除','heading':'絞り込み'}
         if ja else
         {'search':'Search titles and descriptions','all':'Everything','interactive':'Interactive',
          'pdf':'With a PDF','bilingual':'English and Japanese','showing':'shown','none':'Nothing matches that.',
          'clear':'Clear the filters','heading':'Filter'})
 chips=[f'<button type="button" data-filter="all" aria-pressed="true">{labels["all"]}</button>']
 for slug,name in groups:
  chips.append(f'<button type="button" data-filter="{slug}" aria-pressed="false">{escape(name)}</button>')
 for slug in ['interactive','pdf','bilingual']:
  chips.append(f'<button type="button" data-filter="{slug}" aria-pressed="false">{labels[slug]}</button>')
 return (f'<section class="controls library-controls" aria-label="{labels["heading"]}">'
         f'<div class="search-field"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/>'
         f'<path d="M13.5 13.5 18 18"/></svg>'
         f'<label class="visually-hidden" for="publication-search">{labels["search"]}</label>'
         f'<input id="publication-search" type="search" autocomplete="off" placeholder="{labels["search"]}"></div>'
         f'<div class="filters">'+''.join(chips)+'</div></section>'
         f'<p class="count"><span id="visible-count">{total}</span> <span id="publication-word">'
         f'{"件" if ja else "pages"}</span> {labels["showing"]}</p>'
         f'<div class="no-results" hidden><p>{labels["none"]}</p>'
         f'<button type="button" id="clear-search">{labels["clear"]}</button></div>')

def main():
 pages=entries()
 for ja,file in [(False,'library.html'),(True,'ja/library.html')]:
  parts=[];slugs=[];total=0
  categories=['学習ガイド','研究と解説','書籍','参考シート','プロジェクト'] if ja else ['Guides','Research','Books','Sheets','Projects']
  english=['guides','research','books','sheets','projects']
  for i,category in enumerate(categories):
   group=[p for p in pages if p['ja']==ja and shell.category(p['route'],ja)[0]==category]
   if not group:continue
   slugs.append((english[i],category));total+=len(group)
   count=f'{len(group)}ページ' if ja else f'{len(group)} '+('page' if len(group)==1 else 'pages')
   rows=[]
   for p in sorted(group,key=lambda p:p['route']):
    title=p['title'].replace(' — ',': ')
    description=re.sub(r'\s+',' ',unescape(p.get('description',''))).strip().replace(' — ',': ')
    if len(description)>180:description=description[:177].rsplit(' ',1)[0]+'…'
    if not description:description='解説を開く' if ja else 'Explore this page'
    tags=[english[i]]
    if p.get('interactive'):tags.append('interactive')
    if p.get('pdf'):tags.append('pdf')
    if p.get('alternate'):tags.append('bilingual')
    search=escape(f'{title} {description} {p["route"]}',quote=True)
    rows.append(f'<a class="publication-card" data-tags="{" ".join(tags)}" data-search="{search}" '
                f'href="{escape(p["route"],quote=True)}"><span class="t">{escape(title)}</span>'
                f'<span class="d">{escape(description)}</span></a>')
   parts.append(f'<section class="section" id="group-{i}" data-group><div class="section-head"><h2>{category}</h2>'
                f'<p class="label">{count}</p></div><div class="index">'+''.join(rows)+'</div></section>')
  block=controls(ja,slugs,total)+''.join(parts)
  p=ROOT/file;s=p.read_text()
  s=re.sub(r'<section class="controls library-controls".*(?=</main>)','',s,flags=re.S)
  s=re.sub(r'<section class="section" id="group-\d+".*(?=</main>)','',s,flags=re.S)
  s=re.sub(r'(?=</main>)',block,s,count=1)
  if 'assets/site.js' not in s:
   s=re.sub(r'</body>','<script defer src="/assets/site.js"></script>\n</body>',s,count=1)
  p.write_text(s)
 print(f'Catalogued {len(pages)} content pages in English and Japanese')
if __name__=='__main__':main()
