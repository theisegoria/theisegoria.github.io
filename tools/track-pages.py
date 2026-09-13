#!/usr/bin/env python3
"""Install or verify standalone analytics on every published HTML entry point.
Only analytics tags are changed; custom page layouts and controls are preserved.
"""
from pathlib import Path
from html.parser import HTMLParser
import argparse,hashlib,re
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.scripts=[];self.policies=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='script':self.scripts.append(a)
  if tag=='meta' and a.get('http-equiv','').lower()=='content-security-policy':self.policies.append(a.get('content',''))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args();version=hashlib.sha256((ROOT/'assets/analytics.js').read_bytes()).hexdigest()[:12];tag=f'<script defer data-isegoria-analytics src="/assets/analytics.js?v={version}"></script>';issues=[];count=0
 for p in sorted(ROOT.rglob('*.html')):
  if any(x in p.parts for x in ['node_modules','.git','dist','tests']):continue
  count+=1;s=p.read_text()
  if not args.check:
   s=re.sub(r'<script\b[^>]*\bsrc=["\']/assets/analytics\.js(?:\?[^"\']*)?["\'][^>]*>\s*</script>\s*','',s,flags=re.I)
   s=re.sub(r'</head>',tag+'\n</head>',s,count=1,flags=re.I);p.write_text(s)
  page=Page();page.feed(s);scripts=[a for a in page.scripts if a.get('src','').startswith('/assets/analytics.js')]
  if len(scripts)!=1 or scripts[0].get('src')!=f'/assets/analytics.js?v={version}' or 'defer' not in scripts[0]:issues.append(f'{p.relative_to(ROOT)}: missing, duplicated or stale collector')
  for policy in page.policies:
   directives={part.split()[0]:part.split()[1:] for part in policy.split(';') if part.split()}
   for directive,source in [('script-src-elem',"'self'"),('connect-src','https://isegoria-analytics.isegoria-analytics.workers.dev')]:
    sources=directives.get(directive,directives.get('script-src' if directive=='script-src-elem' else directive,directives.get('default-src')))
    if sources is not None and source not in sources and '*' not in sources:issues.append(f'{p.relative_to(ROOT)}: {directive} blocks analytics')
 print(f'{count} HTML entry points checked; collector {version}; {len(issues)} issues')
 if issues:print('\n'.join(issues));raise SystemExit(1)
if __name__=='__main__':main()
