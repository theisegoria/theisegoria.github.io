#!/usr/bin/env python3
"""Scaffold a new interactive explainer (a "lab") from tools/lab-template.

    python3 tools/new-lab.py --slug lavet-motor \
        --title "The Lavet Stepper Motor" \
        --desc "How a quartz watch turns one pulse a second into half a turn of a magnet." \
        --title-ja "ラベット式ステッピングモーター" \
        --desc-ja "クォーツ時計が毎秒一つのパルスを磁石の半回転に変える仕組み。"

Creates <slug>/index.html, <slug>/lab.js, <slug>/style.css and ja/<slug>/index.html,
wired to the vendored three.js build named in THREE_VER below and to
/assets/lab-kit/. It refuses to overwrite an existing piece.

Afterwards, fill in the scene in <slug>/lab.js and the prose in both pages,
then run the usual publishing sequence (see CLAUDE.md):
    python3 tools/site-shell.py && python3 tools/update-library.py
    python3 tools/latest.py --lang en --section interactive --url /<slug>/ --title ... --desc ...
    python3 tools/latest.py --lang ja --section interactive --url /ja/<slug>/ --title ... --desc ...
    python3 tools/track-pages.py && python3 tools/check-index.py && python3 tools/audit-site.py
"""
import argparse, datetime, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'tools' / 'lab-template'
THREE_VER = sorted(p.name for p in (ROOT / 'vendor' / 'three').iterdir() if re.fullmatch(r'r\d+', p.name))[-1]

ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('--slug', required=True, help='directory name, lower-case-hyphenated')
ap.add_argument('--title', required=True)
ap.add_argument('--desc', required=True, help='one or two sentences; becomes the meta description and lede')
ap.add_argument('--title-ja', default=None)
ap.add_argument('--desc-ja', default=None)
ap.add_argument('--no-ja', action='store_true', help='English only (drops the hreflang links too)')
ap.add_argument('--three', default=THREE_VER, help=f'vendored three.js directory (default {THREE_VER})')
a = ap.parse_args()

if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', a.slug):
    sys.exit('slug must be lower-case letters, digits and single hyphens')
if '—' in a.title + a.desc + (a.title_ja or '') + (a.desc_ja or ''):
    sys.exit('house style: no em-dashes')
if not a.no_ja and not (a.title_ja and a.desc_ja):
    sys.exit('give --title-ja and --desc-ja, or --no-ja')

en_dir, ja_dir = ROOT / a.slug, ROOT / 'ja' / a.slug
for d in [en_dir] + ([] if a.no_ja else [ja_dir]):
    if d.exists():
        sys.exit(f'{d.relative_to(ROOT)} already exists; refusing to overwrite')

subs = {
    'SLUG': a.slug, 'TITLE': a.title, 'DESCRIPTION': a.desc,
    'TITLE_JA': a.title_ja or a.title, 'DESCRIPTION_JA': a.desc_ja or a.desc,
    'DATE': datetime.date.today().strftime('%Y%m%d'), 'THREE_VER': a.three,
}
def fill(text):
    text = re.sub(r'\{\{(\w+)\}\}', lambda m: subs[m[1]], text)
    if a.no_ja:
        text = re.sub(r'<link rel="alternate" hreflang="[^"]*"[^>]*>\n', '', text)
        text = text.replace('<script src="/assets/lang.js"></script>\n', '')
    return text

en_dir.mkdir(parents=True)
for name, out in [('index.html', 'index.html'), ('lab.js', 'lab.js'), ('style.css', 'style.css')]:
    (en_dir / out).write_text(fill((TEMPLATE / name).read_text()))
if not a.no_ja:
    ja_dir.mkdir(parents=True)
    (ja_dir / 'index.html').write_text(fill((TEMPLATE / 'ja.html').read_text()))

print(f'created /{a.slug}/ (index.html, lab.js, style.css)' + ('' if a.no_ja else f' and /ja/{a.slug}/index.html'))
print(f'three.js: /vendor/three/{a.three}/   lab-kit: /assets/lab-kit/')
print('next: write the scene in lab.js, the prose in both pages, the static SVG fallback, then the publishing sequence in CLAUDE.md')
