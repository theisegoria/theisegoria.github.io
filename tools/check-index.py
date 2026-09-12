#!/usr/bin/env python3
"""
Check both index pages before pushing.

Three things go wrong on this site, all of them silently:

1. A piece is promoted into Latest and never filed in a catalogue section,
   so it disappears from the site once four newer pieces push it off.
2. A section's count label drifts away from the number of entries under it,
   usually after merging another session's push.
3. A link points at a path that does not exist.

  python3 tools/check-index.py

Exits non-zero if anything fails, so it can gate a commit.
"""

import io
import os
import re
import sys
import subprocess
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACKED = set(subprocess.check_output(["git", "ls-tree", "-r", "--name-only", "-z", "HEAD"], cwd=ROOT, text=True).split("\0"))
PAGES = ["index.html", "ja/index.html"]
ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
        "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}


def word_to_number(word):
    w = word.strip().lower()
    if w in ONES:
        return ONES.index(w)
    parts = w.split("-")
    if parts[0] in TENS:
        return TENS[parts[0]] + (ONES.index(parts[1]) if len(parts) > 1 and parts[1] in ONES else 0)
    return None


def sections(page):
    for m in re.finditer(r'<section class="section"(?: id="([^"]*)")?>.*?</section>',
                         page, re.S):
        yield m.group(1) or "(unnamed)", m.group(0)


def check_page(rel):
    path = os.path.join(ROOT, rel)
    page = io.open(path, encoding="utf-8").read()
    problems = []

    # 1. Latest entries need a permanent home.
    if "<!-- LATEST:START -->" not in page:
        problems.append("no LATEST markers")
    else:
        i = page.index("<!-- LATEST:START -->")
        j = page.index("<!-- LATEST:END -->")
        latest, rest = page[i:j], page[:i] + page[j:]
        for url in re.findall(r'href="([^"#]+)"', latest):
            if url.startswith("#"):
                continue
            if ('href="%s"' % url) not in rest:
                problems.append("in Latest but filed nowhere else: %s" % url)

    # 2. Count labels must match the entries beneath them.
    for name, block in sections(page):
        head = re.search(r'<div class="section-head">.*?</div>', block, re.S)
        idx = re.search(r'<div class="index">(.*?)\n    </div>', block, re.S)
        if not head or not idx:
            continue
        actual = len(re.findall(r'<a href=', idx.group(1)))
        label = re.search(r'<p class="label">([^<]*)</p>', head.group(0))
        if not label:
            continue
        text = label.group(1)
        claimed = None
        jp = re.match(r'^(\d+)編', text)
        if jp:
            claimed = int(jp.group(1))
        else:
            en = re.match(r'^([A-Za-z-]+) (?:&middot;|·) ', text)
            if en:
                claimed = word_to_number(en.group(1))
        if claimed is not None and claimed != actual:
            problems.append("%s: label says %s, section holds %d"
                            % (name, claimed, actual))

    # 3. Internal links must resolve.
    for href in sorted(set(re.findall(r'href="([^"#]+)"', page))):
        if urlsplit(href).scheme or href in ("", "/"):
            continue
        href = unquote(urlsplit(href).path)
        if not href:
            continue
        target = href[1:] if href.startswith("/") else os.path.normpath(
            os.path.join(os.path.dirname(rel), href))
        full = os.path.join(ROOT, target)
        if os.path.isdir(full) or href.endswith("/"):
            full = os.path.join(full, "index.html")
        if not os.path.exists(full) and os.path.relpath(full, ROOT) not in TRACKED:
            problems.append("dead link: %s" % href)

    return problems


def main():
    failed = False
    for rel in PAGES:
        problems = check_page(rel)
        if problems:
            failed = True
            print("%s" % rel)
            for p in problems:
                print("  %s" % p)
        else:
            print("%s  ok" % rel)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
