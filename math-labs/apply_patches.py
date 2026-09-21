#!/usr/bin/env python3
"""Apply content patches to the encyclopedia topic pages.

Each math-labs/content-patches/<slug>.json maps a lab id to the fields that
change, in the same shape as content.json: title/body/example/caution/
question/answer are [en, ja] pairs, formula is a TeX string, params is the
full new parameter list. A parameter may carry an eighth element, a list of
[en, ja] option labels, which turns the slider into a segmented choice.

    python3 math-labs/apply_patches.py                 # every patched slug, HTML only
    python3 math-labs/apply_patches.py --slug optics   # one slug, HTML only
    python3 math-labs/apply_patches.py --write-content # also fold patches into content.json

Only the <section class="experiment"> blocks and the lesson navigation are
rewritten; everything else in the page is left as it is.
"""
from pathlib import Path
import argparse, html, json, re

ROOT = Path(__file__).resolve().parents[1]
ML = ROOT / 'math-labs'
FIELDS = ['title', 'body', 'formula', 'example', 'caution', 'question', 'answer', 'params']


def merged():
    data = json.loads((ML / 'content.json').read_text())
    patched = set()
    for pf in sorted((ML / 'content-patches').glob('*.json')):
        patch = json.loads(pf.read_text())
        topic = next(t for t in data if t['slug'] == pf.stem)
        for lab_id, changes in patch.items():
            lab = next(l for l in topic['labs'] if l['id'] == lab_id)
            for k, v in changes.items():
                if k not in FIELDS:
                    raise SystemExit(f'{pf.name}: {lab_id}: unknown field {k}')
                lab[k] = v
        patched.add(pf.stem)
    return data, patched


def section(l, ja):
    esc = html.escape
    lang = 1 if ja else 0
    controls = []
    for a in l['params']:
        opts = ''
        if len(a) > 7 and a[7]:
            opts = f' data-options="{esc(json.dumps(a[7], ensure_ascii=False), quote=True)}"'
        controls.append(f'<label>{esc(a[2 if ja else 1])} <output for="{l["id"]}-{a[0]}">{a[6]}</output><input id="{l["id"]}-{a[0]}" data-key="{a[0]}" type="range" min="{a[3]}" max="{a[4]}" step="{a[5]}" value="{a[6]}"{opts}></label>')
    return (f'<section class="experiment" id="{l["id"]}" data-lab="{l["id"]}"><div class="section-head"><h2>{esc(l["title"][lang])}</h2></div>'
            f'<p>{esc(l["body"][lang])}</p><div class="controls">{"".join(controls)}</div><div class="plot" role="img" aria-label="{esc(l["title"][lang])}"></div>'
            f'<p class="readout" aria-live="polite"></p><div class="formula" data-tex="{esc(l["formula"], quote=True)}"></div>'
            f'<div class="notes"><p><strong>{"計算例" if ja else "Worked example"}.</strong> {esc(l["example"][lang])}</p>'
            f'<p><strong>{"注意点" if ja else "Watch out"}.</strong> {esc(l["caution"][lang])}</p>'
            f'<details><summary>{esc(l["question"][lang])}</summary><p>{esc(l["answer"][lang])}</p></details></div>'
            f'<a class="source" href="{l["url"]}">{"参考文献" if ja else "Reference"}: {esc(l["source"])}</a></section>')


def rewrite(topic):
    for ja in (False, True):
        path = ROOT / (('ja/' if ja else '') + topic['slug']) / 'index.html'
        s = path.read_text()
        for l in topic['labs']:
            pat = re.compile(r'<section class="experiment" id="%s" data-lab="%s">.*?</section>' % (re.escape(l['id']), re.escape(l['id'])), re.S)
            if not pat.search(s):
                raise SystemExit(f'{path}: no section {l["id"]}')
            s = pat.sub(lambda m: section(l, ja), s, count=1)
            s = re.sub(r'(<a href="#%s">)[^<]*(</a>)' % re.escape(l['id']), lambda m: m.group(1) + html.escape(l['title'][1 if ja else 0]) + m.group(2), s, count=1)
        s = re.sub(r'<p class="disclosure">[^<]*</p>', '', s)
        path.write_text(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slug')
    ap.add_argument('--write-content', action='store_true')
    ap.add_argument('--all', action='store_true', help='rewrite every topic, patched or not')
    a = ap.parse_args()
    data, patched = merged()
    slugs = [a.slug] if a.slug else ([t['slug'] for t in data] if a.all else sorted(patched))
    for t in data:
        if t['slug'] in slugs:
            rewrite(t)
            print('rewrote', t['slug'])
    if a.write_content:
        (ML / 'content.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        print('content.json updated')


if __name__ == '__main__':
    main()
