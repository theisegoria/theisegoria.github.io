#!/usr/bin/env python3
"""Apply the shared, static navigation to every published HTML page.

Run from the main checkout after adding a page. External Pages projects:
  python3 tools/site-shell.py --project PATH --prefix /project-name/
The header works without JavaScript. CSS and enhancements live on the root site.
"""
from pathlib import Path
from html import escape, unescape
import argparse, hashlib, re

ROOT=Path(__file__).resolve().parents[1]
VERSION=hashlib.sha256((ROOT/'assets/site-shell.css').read_bytes()+(ROOT/'assets/site-shell.js').read_bytes()).hexdigest()[:10]
HEAD_START='<!-- ISEGORIA:HEAD -->'; HEAD_END='<!-- /ISEGORIA:HEAD -->'
NAV_START='<!-- ISEGORIA:NAV -->'; NAV_END='<!-- /ISEGORIA:NAV -->'
FOOT_START='<!-- ISEGORIA:FOOT -->'; FOOT_END='<!-- /ISEGORIA:FOOT -->'

def plain(s):return re.sub(r'\s+',' ',unescape(re.sub('<[^>]*>','',s))).strip()
def route_for(rel,prefix='/'):
    s=prefix+str(rel)
    return s[:-10] if s.endswith('index.html') else s
def title_of(s):
    m=re.search(r'<title\b[^>]*>(.*?)</title>',s,re.S|re.I)
    return re.split(r'\s+[|·]\s+(?:Benjamin|Isegoria)',plain(m[1]))[0] if m else 'Isegoria'
def japanese(s):return bool(re.search(r'<html\b[^>]*\blang=["\']ja',s,re.I))
def category(route,ja=False):
    r=route.removeprefix('/ja')
    if r in ['/','/index.html','/about.html','/projects.html','/library.html','/404.html']:return None
    if r.startswith('/sheets/'):return ('参考シート' if ja else 'Sheets',('/ja' if ja else '')+'/sheets/')
    if r.startswith(('/medical-textbook/','/game-design-dynamics-of-learning/')):return ('書籍' if ja else 'Books',('/ja' if ja else '')+'/#books')
    if r.startswith('/stem-genius/'):return ('プロジェクト' if ja else 'Projects',('/ja' if ja else '')+'/projects.html')
    if r.startswith('/algebraic-varieties-introduction/') or r.startswith('/lebesgue-integration/') or r.startswith('/gamma-beta/') or (r.startswith('/explore/') and not any(x in r for x in ['automatic-watch','apple-silicon'])):
        return ('学習ガイド' if ja else 'Guides',('/ja' if ja else '')+'/#guides')
    return ('研究と解説' if ja else 'Research',('/ja' if ja else '')+'/#preoccupations')

def shell(route,title,ja,alternate=None,parent=None):
    home='/ja/' if ja else '/'; cat=category(route,ja)
    labels=['ホーム','全コンテンツ','学習ガイド','研究と解説','書籍','プロジェクト','このサイトについて'] if ja else ['Home','Library','Guides','Research','Books','Projects','About']
    urls=[home,home+'library.html',home+'#guides',home+'#preoccupations',home+'#books',home+'projects.html',home+'about.html']
    links=[]
    for label,url in zip(labels,urls):
        current='page' if route==url else 'location' if cat and cat[1]==url else None
        links.append(f'<a href="{url}"'+(f' aria-current="{current}"' if current else '')+f'>{label}</a>')
    other='en' if ja else 'ja'; other_url=(alternate or ('/' if ja else '/ja/')).replace('https://theisegoria.github.io','')
    links.append(f'<a class="ig-language" href="{escape(other_url,quote=True)}" hreflang="{other}" lang="{other}">'+('English' if ja else '日本語')+'</a>')
    links.append('<button class="ig-theme" type="button" hidden>'+('表示切替' if ja else 'Theme')+'</button>')
    nav=f'''{NAV_START}
<a class="ig-skip" href="#ig-content">{'本文へ移動' if ja else 'Skip to content'}</a>
<header id="ig-header"><div class="ig-nav-inner">
<a class="ig-brand" href="{home}" aria-label="Isegoria, {'ホーム' if ja else 'home'}"><strong>ISEGORIA</strong><span>Benjamin Haire</span></a>
<button class="ig-menu" type="button" aria-expanded="false" aria-controls="ig-primary">{'メニュー' if ja else 'Menu'}</button>
<nav id="ig-primary" aria-label="{'メインナビゲーション' if ja else 'Primary navigation'}">{''.join(links)}</nav>
</div></header>'''
    if route not in ['/', '/ja/']:
        crumbs=[f'<a href="{home}">{labels[0]}</a>']
        if cat and cat[1]!=route:crumbs.append(f'<a href="{cat[1]}">{cat[0]}</a>')
        if parent and parent[1]!=route:crumbs.append(f'<a href="{parent[1]}">{escape(parent[0])}</a>')
        crumbs.append(f'<span aria-current="page">{escape(title)}</span>')
        nav+='\n<nav id="ig-breadcrumb" aria-label="'+('パンくずリスト' if ja else 'Breadcrumb')+'">'+('<span aria-hidden="true">/</span>'.join(crumbs))+'</nav>'
    nav+='\n<span id="ig-content" tabindex="-1"></span>\n'+NAV_END
    foot=f'''{FOOT_START}
<footer id="ig-footer"><div><a href="{home}">Isegoria · Benjamin Haire</a><nav aria-label="{'サイト内リンク' if ja else 'Site links'}"><a href="{home}">{'ホームに戻る' if ja else 'Back to home'}</a><a href="{home}library.html">{'全コンテンツ' if ja else 'Browse the library'}</a><a href="#ig-content">{'ページ上部へ' if ja else 'Back to top'}</a></nav></div></footer>
{FOOT_END}'''
    return nav,foot

def local_links(block):
    keep=[]
    global_routes={'/','/ja/','/index.html','/ja/index.html','/library.html','/ja/library.html','/about.html','/ja/about.html','/projects.html','/ja/projects.html','/sheets/','/ja/sheets/','https://github.com/theisegoria'}
    for m in re.finditer(r'<a\b[^>]*href=["\']([^"\']*)["\'][^>]*>.*?</a>',block,re.S|re.I):
        href=m[1].replace('https://theisegoria.github.io','')
        if plain(m[0]).lower() in ['en','ja','english','日本語']:continue
        if href in global_routes or href in ['../','../../','#main','#top'] or re.search(r'\bhreflang=|data-language-select=',m[0]):continue
        if href.startswith('/#') or href.startswith('/ja/#'):continue
        keep.append(m[0])
    return '<nav class="ig-page-nav" aria-label="On this page">'+''.join(keep)+'</nav>' if keep else ''

def apply(path,route,known):
    s=path.read_text();ja=japanese(s);title=title_of(s)
    if re.search(r'http-equiv=["\']refresh',s,re.I):return False
    for a,b in [(HEAD_START,HEAD_END),(NAV_START,NAV_END),(FOOT_START,FOOT_END)]:s=re.sub(r'\s*'+re.escape(a)+r'.*?'+re.escape(b)+r'\s*', '',s,flags=re.S)
    s=re.sub(r'<a\b[^>]*class=["\']skip["\'][^>]*>.*?</a>','',s,flags=re.S)
    # Replace previous site-only bars, retaining local chapter/PDF actions.
    def old_header(m):
        block=m[0];tag=block.split('>',1)[0]
        eligible=bool(re.search(r'class=["\'](?:site-header|site|bar|sitebar|isegoria-bar)["\']',tag))
        if not re.search(r'\bclass=',tag) and re.search(r'<a\b[^>]*href=["\'](?:/|\.\./)["\']',block):eligible=True
        return local_links(block) if eligible else block
    s=re.sub(r'<header\b[^>]*>.*?</header>',old_header,s,flags=re.S|re.I)
    s=re.sub(r'<nav\b[^>]*class=["\']home-bar["\'][^>]*>.*?</nav>','',s,flags=re.S|re.I)
    s=re.sub(r'<nav><a href="/">(?:←\s*)?Home</a></nav>','',s)
    s=re.sub(r'<nav class="ig-page-nav"[^>]*>.*?</nav>',lambda n:local_links(n[0]),s,flags=re.S)
    alt=None
    for m in re.finditer(r'<link\b[^>]*>',s,re.I):
        if re.search(r'hreflang=["\']'+('en' if ja else 'ja')+r'["\']',m[0]):
            a=re.search(r'href=["\']([^"\']+)',m[0]);alt=a[1] if a else None
    parent=None
    candidate=route.rsplit('/',1)[0]+'/' if not route.endswith('/') else route.rstrip('/').rsplit('/',1)[0]+'/'
    if candidate in known and candidate not in ['/','/ja/'] and known[candidate][1]==ja:parent=(known[candidate][0],candidate)
    if ja:s=s.replace('aria-label="On this page"','aria-label="このページの目次"')
    nav,foot=shell(route,title,ja,alt,parent)
    kind='app' if route in ['/kef-coda-w/','/carrera-panda/','/neuron-action-potential/','/watch-mechanisms/','/watch-mechanisms/ja/','/monster-tech-correlation/'] else 'embed' if 'srcdoc=' in s or route.endswith(('/curves.html','/selected.html')) else 'editorial'
    fixed=route.startswith(('/watch-lab/','/quartz-lab/','/ja/quartz-lab/','/real-time-natural-worlds/','/concerta-catecholamine-model/'))
    def html_attrs(m):
        t=m[0];t=re.sub(r'\sclass=["\']([^"\']*)["\']',lambda c:' class="'+re.sub(r'\big-(?:document|editorial)\b','',c[1]).strip()+'"',t)
        classes='ig-document'+(' ig-editorial' if kind=='editorial' and not fixed else '')
        return re.sub(r'class="([^"]*)"',lambda c:f'class="{c[1]} {classes}"',t) if 'class=' in t else t[:-1]+f' class="{classes}">'
    s=re.sub(r'<html\b[^>]*>',html_attrs,s,count=1,flags=re.I)
    def body_attrs(m):
        t=re.sub(r'\sdata-site-(?:kind|route)="[^"]*"','',m[0]);t=re.sub(r'\sclass="([^"]*)"',lambda c:' class="'+re.sub(r'\big-site\b','',c[1]).strip()+'"',t)
        t=re.sub(r'class="([^"]*)"',lambda c:f'class="{c[1]} ig-site"',t) if 'class=' in t else t[:-1]+' class="ig-site">'
        return t[:-1]+f' data-site-kind="{kind}" data-site-route="{escape(route)}">\n'+nav
    s=re.sub(r'<body\b[^>]*>',body_attrs,s,count=1,flags=re.I)
    head=f'{HEAD_START}\n<link rel="stylesheet" href="/assets/site-shell.css?v={VERSION}">\n<script src="/assets/site-shell.js?v={VERSION}" ></script>\n{HEAD_END}'
    s=re.sub(r'</head>',head+'\n</head>',s,count=1,flags=re.I)
    s=re.sub(r'</body>',foot+'\n</body>',s,count=1,flags=re.I)
    # Allow the shared first-party shell in wrapper CSPs without changing iframe sandboxing.
    def csp(m):
        return re.sub(r'(script-src|style-src|font-src) (?!\x27self\x27)',r"\1 'self' ",m[0])
    s=re.sub(r'<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>',csp,s,flags=re.I)
    # A document opens beside its containing page, keeping the site's navigation available.
    def pdf(m):
        t=m[0]
        if re.search(r'\btarget=',t):return t
        return t[:-1]+' target="_blank" rel="noopener" title="'+('PDF、新しいタブで開く' if ja else 'PDF, opens in a new tab')+'">'
    s=re.sub(r'<a\b[^>]*href=["\'][^"\']*\.pdf(?:[?#][^"\']*)?["\'][^>]*>',pdf,s,flags=re.I)
    s=re.sub(r'(?m)^[ \t]+$', '', s)
    if s!=path.read_text():path.write_text(s);return True
    return False

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--project',type=Path,default=ROOT);ap.add_argument('--prefix',default='/');args=ap.parse_args()
    files=[p for p in args.project.rglob('*.html') if not any(x in p.parts for x in ['node_modules','.git','dist','.next','.wrangler'])]
    known={route_for(p.relative_to(args.project),args.prefix):(title_of(p.read_text()),japanese(p.read_text())) for p in files}
    count=sum(apply(p,route_for(p.relative_to(args.project),args.prefix),known) for p in files)
    print(f'{len(files)} HTML pages reviewed; {count} updated; shell {VERSION}')
if __name__=='__main__':main()
