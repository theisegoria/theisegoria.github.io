#!/usr/bin/env python3
"""Rebuild the <main> of both math encyclopedia hubs, and the Math encyclopedia
section of both home pages, from tools/math-encyclopedia.json.

The JSON is the single list of encyclopedia entries: one record per page, in
reading order, each with a group. This script writes the page-contents nav and
one section per group, so an entry appears exactly once and every group has a
jump link. Everything outside <main> (head, shell, footer) is left alone.

    python3 tools/build-math-hub.py            # write both hubs
    python3 tools/build-math-hub.py --check    # exit 1 if either hub is stale
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'tools/math-encyclopedia.json').read_text())

GROUPS = [
    ('foundations', 'Foundations and algebra', '基礎と代数'),
    ('analysis', 'Topology and analysis', '位相と解析'),
    ('geometry', 'Geometry and transformations', '幾何と変換'),
    ('applications', 'Probability, computation, and reference', '確率・計算・参考資料'),
    ('physics', 'Physics', '物理'),
]
ATLAS = [('topology', 'Topology', '位相空間'), ('metric', 'Metric spaces', '距離空間'), ('real', 'Real analysis', '実解析'),
         ('complex', 'Complex analysis', '複素解析'), ('functional', 'Functional analysis', '関数解析')]
PDFS = [('/structure-before-algebra.pdf', 'Structure Before Algebra'), ('/jacobians-wronskians-hessians.pdf', 'Jacobians, Wronskians &amp; Hessians'),
        ('/counting-and-probability.pdf', 'Counting &amp; Probability')]


def card(e, ja):
    esc = html.escape
    href = e['route_ja'] if ja else e.get('href', e['route'])
    tail = f'<span class="tail"><span>{esc(e["tail_ja"])}</span></span>' if ja and e.get('tail_ja') else ''
    return (f'<a href="{esc(href)}"><span class="t">{esc(e["title_ja" if ja else "title"])}</span>'
            f'<span class="d">{esc(e["description_ja" if ja else "description"])}</span>{tail}</a>')


def main_html(ja):
    esc = html.escape
    count = len(DATA)
    graph = '/ja/math-encyclopedia/graph.html' if ja else '/math-encyclopedia/graph.html'
    out = ['<main id="main"><section class="hero encyclopedia-intro"><p class="label">ISEGORIA / MATHEMATICS</p>',
           f'<h1>{"数学百科事典" if ja else "Math encyclopedia"}</h1>',
           '<p class="deck">' + (f'集合から関数空間、そして物理まで。{count}件の解説と実験を分野別に探せます。' if ja else
                                 f'From sets to spaces of functions, and on into physics. {count} explainers and experiments, by subject.') + '</p>',
           f'<p class="graph-link"><a href="{graph}">{"つながった知識グラフを開く" if ja else "Open the connected knowledge graph"}</a></p></section>',
           f'<nav class="ig-page-nav" aria-label="{"このページの目次" if ja else "On this page"}">']
    groups = [g for g in GROUPS if any(e['group'] == g[0] for e in DATA)]
    out += [f'<a href="#{g}">{esc(j if ja else en)}</a>' for g, en, j in groups]
    out.append('</nav>')
    for g, en, j in groups:
        items = [e for e in DATA if e['group'] == g]
        out.append(f'<section class="section" id="{g}"><div class="section-head"><h2>{esc(j if ja else en)}</h2>'
                   f'<p class="label">{len(items)}{"件" if ja else " entries"}</p></div><div class="index">')
        out += [card(e, ja) for e in items]
        out.append('</div>')
        if g == 'analysis':
            base = '/analysis-atlas/?lang=ja' if ja else '/analysis-atlas/'
            links = ' · '.join(f'<a href="{base}#{k}">{esc(jj if ja else ee)}</a>' for k, ee, jj in ATLAS)
            out.append(f'<p>{"解析学アトラスの各レッスン：" if ja else "Jump to an Analysis Atlas lesson: "}{links}</p>')
        out.append('</section>')
    title = 'PDF、新しいタブで開く' if ja else 'PDF, opens in a new tab'
    out.append(f'<section class="section"><div class="section-head"><h2>{"関連する PDF" if ja else "Companion PDFs"}</h2></div>'
               f'<p>{"以下の PDF は英語版です。" if ja else "English-language companions to the interactive guides."}</p><div class="index">')
    out += [f'<a href="{u}" target="_blank" rel="noopener" title="{title}"><span class="t">{t}</span><span class="d">PDF · English</span></a>' for u, t in PDFS]
    out.append('</div></section></main>')
    return ''.join(out)


def home_section(page, ja):
    """The home page's Math encyclopedia section: one card per subject, linking
    into the hub, so it stays current without listing every entry twice."""
    esc = html.escape
    prefix = '/ja' if ja else ''
    cards = []
    groups = [g for g in GROUPS if any(e['group'] == g[0] for e in DATA)]
    for g, en, j in groups:
        items = [e for e in DATA if e['group'] == g]
        names = [re.split('[:：]', e['title_ja' if ja else 'title'])[0].strip() for e in items]
        shown = names[:5]
        if ja:
            d = '・'.join(shown) + (f'ほか{len(names) - len(shown)}件' if len(names) > len(shown) else '')
            d = f'{len(items)}件：' + d
        else:
            rest = len(names) - len(shown)
            d = f'{len(items)} entries: ' + ', '.join(shown) + (f', and {rest} more' if rest else '')
        cards.append(f'<a href="{prefix}/math-encyclopedia/#{g}"><span class="t">{esc(j if ja else en)}</span><span class="d">{esc(d)}</span></a>')
    words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    label = f'{len(groups)}分野・{len(DATA)}件' if ja else f'{words[len(groups)]} subjects · {len(DATA)} entries'
    m = re.search(r'(<section class="section" id="math-encyclopedia">.*?<p class="label">)[^<]*(</p>.*?<div class="index">).*?(\n    </div></section>)', page, re.S)
    if not m:
        sys.exit('home page Math encyclopedia section not found')
    note = ('数学の解説・実験・参考資料を、一か所にまとめました。 <a href="/ja/math-encyclopedia/">分野別に見る</a>・<a href="/ja/sheets/">参考シート</a>' if ja else
            'Mathematical explainers, experiments, and reference material in one place. <a href="/math-encyclopedia/">Browse by subject</a> or open the <a href="/sheets/">reference sheets</a>.')
    head = re.sub(r'<p class="section-note">.*?</p>', '<p class="section-note">' + note + '</p>', m.group(2), count=1, flags=re.S)
    return page[:m.start()] + m.group(1) + label + head + ''.join(cards) + m.group(3) + page[m.end():]


def rebuild(path, ja):
    s = path.read_text()
    new = re.sub(r'<main id="main">.*?</main>', lambda m: main_html(ja), s, count=1, flags=re.S)
    return s, new


if __name__ == '__main__':
    check = '--check' in sys.argv
    stale = False
    routes = [e['route'] for e in DATA]
    dup = {r for r in routes if routes.count(r) > 1}
    if dup:
        sys.exit(f'duplicate routes in math-encyclopedia.json: {sorted(dup)}')
    jobs = [('math-encyclopedia/index.html', False, rebuild), ('ja/math-encyclopedia/index.html', True, rebuild),
            ('index.html', False, lambda p, ja: (p.read_text(), home_section(p.read_text(), ja))),
            ('ja/index.html', True, lambda p, ja: (p.read_text(), home_section(p.read_text(), ja)))]
    for rel, ja, fn in jobs:
        p = ROOT / rel
        old, new = fn(p, ja)
        if old != new:
            stale = True
            if not check:
                p.write_text(new)
                print(f'wrote {rel}')
    if check and stale:
        sys.exit('math encyclopedia hub is out of date: run python3 tools/build-math-hub.py')
    print(f'{len(DATA)} entries in {len(GROUPS)} groups')
