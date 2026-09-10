#!/usr/bin/env python3
"""
Bump the ?v= stamp on every stylesheet link in the site.

Browsers cache assets/isegoria.css aggressively, so a style change can land
on the server and still not reach a returning reader. Every page therefore
links the stylesheet as assets/isegoria.css?v=YYYYMMDD. Run this after any
edit to the stylesheet and commit the result alongside it.

  python3 tools/bump-css.py            # stamp with today's date
  python3 tools/bump-css.py 20260914   # stamp with a specific value
"""

import datetime as dt
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATTERN = re.compile(r'(isegoria\.css)(\?v=[0-9]+)?')


def main():
    stamp = sys.argv[1] if len(sys.argv) > 1 else dt.date.today().strftime("%Y%m%d")
    changed = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d != ".git"]
        for f in files:
            if not f.endswith(".html"):
                continue
            p = os.path.join(base, f)
            s = io.open(p, encoding="utf-8").read()
            if "isegoria.css" not in s:
                continue
            s2 = PATTERN.sub(r"\1?v=" + stamp, s)
            if s2 != s:
                io.open(p, "w", encoding="utf-8").write(s2)
                changed.append(os.path.relpath(p, ROOT))
    print("Stamped %d file(s) with ?v=%s" % (len(changed), stamp))
    for c in sorted(changed):
        print("  " + c)


if __name__ == "__main__":
    main()
