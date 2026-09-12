#!/usr/bin/env python3
"""Check paired editions, matching anchors and local resources without a browser.

Run after tools/update-library.py and tools/site-shell.py.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin
import json,re

ROOT=Path(__file__).resolve().parents[1]
HOST='https://theisegoria.github.io'

class Page(HTMLParser):
    def __init__(self,source):
        super().__init__();self.lang='';self.ids=[];self.alternates={};self.canonical=None;self.links=[];self.assets=[];self.headers=0;self.mobile=[];self.feed(source)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.lang=a.get('lang','')
        if 'id' in a:self.ids.append(a['id'])
        if a.get('id')=='ig-header':self.headers+=1
        if tag=='link' and a.get('rel')=='alternate':self.alternates[a.get('hreflang')]=a.get('href')
        if tag=='link' and a.get('rel')=='canonical':self.canonical=a.get('href')
        if tag=='a' and a.get('href'):self.links.append(a)
        if tag in ['script','img','iframe','source'] and a.get('src'):self.assets.append(a['src'])
        if tag=='link' and a.get('rel') in ['stylesheet','icon']:self.assets.append(a.get('href',''))

def route(p):
    s='/'+p.relative_to(ROOT).as_posix()
    return s[:-10] if s.endswith('index.html') else s

def main():
    pages={route(p):(p,Page(p.read_text())) for p in ROOT.rglob('*.html') if not any(x in p.parts for x in ['node_modules','.git','dist'])}
    errors=[];pairs=0
    for url,(path,p) in pages.items():
        if p.lang!='en':continue
        ja='/watch-mechanisms/ja/' if url=='/watch-mechanisms/' else '/ja'+url
        if ja not in pages:errors.append(f'{url}: missing Japanese edition');continue
        pairs+=1;q=pages[ja][1]
        if q.lang!='ja':errors.append(f'{ja}: wrong document language')
        if p.alternates.get('ja')!=HOST+ja or q.alternates.get('en')!=HOST+url:errors.append(f'{url}: edition links do not match')
        if q.headers!=1:errors.append(f'{ja}: shared header count {q.headers}')
        if len(q.ids)!=len(set(q.ids)):errors.append(f'{ja}: duplicate IDs')
        # Existing editions may have different structures; new translated content
        # retains every original anchor to preserve deep links across languages.
        if 'ig-translation-note' in pages[ja][0].read_text():
            missing=set(p.ids)-set(q.ids)-{'ig-content'}
            if missing:errors.append(f'{ja}: missing original anchors {sorted(missing)}')
    for url,(path,p) in pages.items():
        if p.lang!='ja':continue
        if '@@' in path.read_text():errors.append(f'{url}: unreplaced translation marker')
        source=path.read_text()
        if source.find('src="/assets/lang.js"')<source.find('hreflang="en"'):errors.append(f'{url}: language router precedes alternate metadata')
        for ref in p.assets:
            u=urlsplit(urljoin(HOST+url,ref))
            if u.netloc!='theisegoria.github.io':continue
            target=ROOT/u.path.lstrip('/')
            if u.path.endswith('/'):target/='index.html'
            external=ROOT.parent/'site-unification-projects'/u.path.lstrip('/')
            if not target.exists() and not external.exists():errors.append(f'{url}: missing asset {ref}')
    report={'english_pages_with_japanese_editions':pairs,'japanese_pages':sum(p.lang=='ja' for _,p in pages.values()),'errors':errors}
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(bool(errors))

if __name__=='__main__':main()
