#!/usr/bin/env python3
"""
Promote a new entry into the "Latest" section of index.html or ja/index.html.

The Latest section on each index page lives between the markers

    <!-- LATEST:START -->  ...  <!-- LATEST:END -->

and holds one featured lead plus four dated rows. This script parses that
block, puts the new entry at the front, demotes the old lead into the first
row, drops whatever falls past the fourth row, and rewrites the block.

Nothing else on the page is touched.

Usage
-----
  python3 tools/latest.py --lang en \
      --url /some-piece/ \
      --title "Some Piece" \
      --desc "One or two sentences saying what it is and why it matters." \
      --tail "English / 日本語" --tail "PDF" \
      --date 2026-09-14

  python3 tools/latest.py --lang ja --url /ja/some-piece/ --title "..." \
      --desc "..." --tail PDF --date 2026-09-14

--date defaults to today. Run it once per language; the two pages are
maintained independently because not every piece has a Japanese edition.

After running, check the diff, then commit both the page and the piece.
If you edited assets/isegoria.css in the same change, bump the ?v= stamp
on the stylesheet links (see tools/bump-css.py) so browsers refetch it.
"""

import argparse
import datetime as dt
import html
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START, END = "<!-- LATEST:START -->", "<!-- LATEST:END -->"
ROWS = 4

JP_MONTH_DAY = "{m}月{d}日"
EN_MONTH_DAY = "{d:02d} {mon}"
EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
EN_FULL = ["January", "February", "March", "April", "May", "June", "July",
           "August", "September", "October", "November", "December"]

STRINGS = {
    "en": {
        "path": "index.html",
        "heading": "Latest",
        "updated": "Updated {stamp}",
        "note": ("What I have been working on most recently, newest first. "
                 "Everything here also lives in the sections below, filed by subject."),
        "new": "New",
        "more": 'All preoccupations &rarr;',
    },
    "ja": {
        "path": "ja/index.html",
        "heading": "最新",
        "updated": "{stamp} 更新",
        "note": "最近取り組んだものを新しい順に並べている。いずれも下の各セクションに主題別で収めてある。",
        "new": "新着",
        "more": "探究をすべて見る &rarr;",
    },
}


def short_date(date, lang):
    if lang == "ja":
        return JP_MONTH_DAY.format(m=date.month, d=date.day)
    return EN_MONTH_DAY.format(d=date.day, mon=EN_MONTHS[date.month - 1])


def full_date(date, lang):
    if lang == "ja":
        return "{y}年{m}月{d}日".format(y=date.year, m=date.month, d=date.day)
    return "{d} {mon} {y}".format(d=date.day, mon=EN_FULL[date.month - 1], y=date.year)


def first_sentence(text, lang):
    """A lead carries a full standfirst; a row wants one line. Trim on demotion."""
    if lang == "ja":
        parts = text.split("\u3002")
        if len(parts) > 2 and parts[0].strip():
            return parts[0].strip() + "\u3002"
        return text
    parts = re.split(r"(?<=[.!?])\s+", text)
    if len(parts) > 1 and len(parts[0]) > 40:
        return parts[0].strip()
    return text


def parse_block(block):
    """Return the list of entries currently in the block, lead first."""
    entries = []

    lead = re.search(
        r'<a class="latest-lead"[^>]*href="([^"]+)"[^>]*data-date="([^"]*)"(.*?)</a>',
        block, re.S)
    if lead:
        entries.append(dict(url=lead.group(1), date=lead.group(2),
                            **parse_inner(lead.group(3))))

    rows = re.search(r'<div class="index dated">(.*?)</div>', block, re.S)
    if rows:
        for m in re.finditer(r'<a href="([^"]+)" data-date="([^"]*)"[^>]*>(.*?)</a>',
                             rows.group(1), re.S):
            entries.append(dict(url=m.group(1), date=m.group(2),
                                **parse_inner(m.group(3))))
    return entries


def parse_inner(chunk):
    title = re.search(r'<span class="t">(.*?)</span>', chunk, re.S)
    desc = re.search(r'<span class="d">(.*?)</span>', chunk, re.S)
    tailblock = re.search(r'<span class="tail">(.*?)</span>\s*$', chunk.strip(), re.S)
    tails = []
    if tailblock:
        tails = re.findall(r'<span>(.*?)</span>', tailblock.group(1), re.S)
    return dict(title=title.group(1).strip() if title else "",
                desc=desc.group(1).strip() if desc else "",
                tails=[t.strip() for t in tails])


def render_tail(tails, indent):
    if not tails:
        return ""
    inner = "".join("<span>%s</span>" % t for t in tails)
    return '\n%s<span class="tail">%s</span>' % (indent, inner)


def render_block(entries, lang, stamp):
    s = STRINGS[lang]
    lead, rows = entries[0], entries[1:1 + ROWS]

    out = [START]
    out.append('  <section class="latest" id="latest">')
    out.append('    <div class="section-head">')
    out.append('      <h2>%s</h2>' % s["heading"])
    out.append('      <p class="label">%s</p>' % s["updated"].format(stamp=stamp))
    out.append('      <p class="section-note">%s</p>' % s["note"])
    out.append('    </div>')
    out.append('')
    out.append('    <a class="latest-lead" href="%s" data-date="%s">'
               % (lead["url"], lead["date"]))
    out.append('      <span class="stamp">%s<span class="sep">&middot;</span>%s</span>'
               % (s["new"], stamp))
    out.append('      <span class="t">%s</span>' % lead["title"])
    out.append('      <span class="d">%s</span>' % lead["desc"])
    if lead["tails"]:
        out.append('      <span class="tail">%s</span>'
                   % "".join("<span>%s</span>" % t for t in lead["tails"]))
    out.append('    </a>')
    out.append('')
    out.append('    <div class="index dated">')
    for e in rows:
        out.append('      <a href="%s" data-date="%s">' % (e["url"], e["date"]))
        out.append('        <span class="t">%s</span>' % e["title"])
        out.append('        <span class="d">%s</span>' % e["desc"])
        if e["tails"]:
            out.append('        <span class="tail">%s</span>'
                       % "".join("<span>%s</span>" % t for t in e["tails"]))
        out.append('      </a>')
    out.append('    </div>')
    out.append('')
    out.append('    <p class="label more"><a href="#preoccupations">%s</a></p>' % s["more"])
    out.append('  </section>')
    out.append('  ' + END)
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description="Promote an entry into the Latest section.")
    ap.add_argument("--lang", choices=["en", "ja"], required=True)
    ap.add_argument("--url", required=True, help="Site-absolute path, e.g. /some-piece/")
    ap.add_argument("--title", required=True)
    ap.add_argument("--desc", required=True)
    ap.add_argument("--tail", action="append", default=[],
                    help="Repeatable, e.g. --tail PDF --tail Interactive")
    ap.add_argument("--date", default=None, help="YYYY-MM-DD, defaults to today")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    date = (dt.date.fromisoformat(a.date) if a.date else dt.date.today())
    path = os.path.join(ROOT, STRINGS[a.lang]["path"])
    page = io.open(path, encoding="utf-8").read()

    if START not in page or END not in page:
        sys.exit("No LATEST markers in %s" % path)

    i, j = page.index(START), page.index(END) + len(END)
    entries = parse_block(page[i:j])
    if not entries:
        sys.exit("Could not parse any entries out of the Latest block in %s" % path)

    if any(e["url"] == a.url for e in entries):
        sys.exit("%s is already in the Latest section of %s" % (a.url, path))

    entries.insert(0, dict(url=a.url, date=short_date(date, a.lang),
                           title=a.title, desc=a.desc, tails=a.tail))

    # The former lead moves into the list, where a one-line description reads better.
    if len(entries) > 1:
        entries[1] = dict(entries[1],
                          desc=first_sentence(entries[1]["desc"], a.lang))

    block = render_block(entries, a.lang, full_date(date, a.lang))
    updated = page[:i] + block + page[j:]

    if a.dry_run:
        sys.stdout.write(block + "\n")
        return

    io.open(path, "w", encoding="utf-8").write(updated)
    dropped = entries[1 + ROWS:]
    print("Updated %s" % STRINGS[a.lang]["path"])
    print("  lead:    %s" % a.title)
    for e in entries[1:1 + ROWS]:
        print("  row:     %s  %s" % (e["date"], e["title"]))
    for e in dropped:
        print("  dropped: %s (still filed in its own section)" % e["title"])


if __name__ == "__main__":
    main()
