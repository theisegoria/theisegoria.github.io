#!/usr/bin/env python3
"""Regenerate the per-module lists on the textbook's index page.

Three lists on index.html name every module that has material: the Anki
downloads, the mindmaps, and the study packs. They grow with every batch, so
they are generated from what is actually on disk rather than hand-edited, and
each sits between a pair of HTML comment markers:

    <!-- MODULES:ANKI:START -->   ...   <!-- MODULES:ANKI:END -->
    <!-- MODULES:MINDMAPS:START -->  ...  <!-- MODULES:MINDMAPS:END -->
    <!-- MODULES:PACKS:START -->  ...  <!-- MODULES:PACKS:END -->

The counts in the surrounding prose are regenerated too, between inline
markers, so the page cannot claim a stale number.

    python3 tools/update_index.py
"""

from __future__ import annotations

import html
import json
import re
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import imf_manuscript as manuscript  # noqa: E402

INDEX = ROOT / "index.html"
ANKI = ROOT / "anki"
MINDMAPS = ROOT / "mindmaps"
PACKS = ROOT / "packs"

# Short labels for the module lists. A module with no entry falls back to its
# manuscript module title, which is accurate but often long.
SHORT = {
    "001-01": "Homeostasis", "001-02": "Control and reserve",
    "002-01": "Membranes and signalling", "002-02": "Gradients and synapses",
    "003-01": "Genetics and cell injury", "003-02": "Variant mechanisms and organelle stress",
    "004-01": "Inflammation and immunity", "004-02": "Resolution and immune tolerance",
    "005-01": "Pharmacokinetics and pharmacodynamics", "005-02": "Exposure and variability",
    "006-01": "Clinical reasoning and diagnostic probability",
    "006-02": "Bayesian updating and diagnostic safety",
    "007-01": "Cardiac electrophysiology and the cardiac cycle",
    "007-02": "Pressure-volume loops and arrhythmia mechanisms",
    "008-01": "Haemodynamics and vascular control",
    "008-02": "Impedance and pressure phenotypes",
    "009-01": "Ischaemia, heart failure and valve disease",
    "009-02": "Coronary flow and congestion phenotypes",
    "010-01": "Shock and vasoactive therapy",
    "010-02": "Haemodynamic phenotyping and staged resuscitation",
    "011-01": "Red cells, haemostasis and thrombosis",
    "011-02": "Marrow response, clot architecture and transfusion",
    "012-01": "Cardiovascular history and examination",
    "012-02": "Bedside haemodynamics and test selection",
    "101-01": "Quantitative reasoning", "102-01": "Experimental methods",
    "105-01": "Quantitative chemistry", "105-02": "Acid-base foundations",
}

EXTRA_LINK = {
    "102-01": '; <a href="anki/102-1-coverage.md">coverage notes</a>',
    "105-02": '; <a href="anki/105%20coverage%20and%20sources.md">chemistry teaching/source crosswalk</a>',
}


def label(key: str, modules: dict) -> str:
    return SHORT.get(key) or modules["en"][key].module_title


def display(key: str) -> str:
    chapter, number = key.split("-")
    return f"{int(chapter):02d}-{int(number)}"


def replace_block(text: str, name: str, body: str) -> str:
    start, end = f"<!-- MODULES:{name}:START -->", f"<!-- MODULES:{name}:END -->"
    if start not in text or end not in text:
        raise SystemExit(f"index.html is missing the {name} markers")
    head = text[: text.index(start) + len(start)]
    tail = text[text.index(end):]
    return f"{head}\n{body}\n      {tail}"


def replace_count(text: str, name: str, value: str) -> str:
    pattern = re.compile(
        rf"(<!-- COUNT:{name}:START -->).*?(<!-- COUNT:{name}:END -->)", re.DOTALL
    )
    if not pattern.search(text):
        raise SystemExit(f"index.html is missing the {name} count markers")
    return pattern.sub(lambda m: m.group(1) + value + m.group(2), text)


def main() -> int:
    modules = manuscript.parse_all()
    cards = json.loads((ANKI / "cards.json").read_text(encoding="utf-8"))
    per_module = Counter(
        manuscript.module_id(c["chapter"], c["module"]) for c in cards
    )

    carded = sorted(per_module)
    mapped = sorted({
        path.stem.split("-", 1)[1].rsplit("-", 1)[0]
        for path in (MINDMAPS / "Outlines").glob("IMF-*.md")
    })
    packed = sorted({
        path.stem.replace("IMF-", "").replace("-study-pack", "")
        for path in PACKS.glob("IMF-*-study-pack.zip")
    })

    anki_rows = "\n".join(
        f'        <li>{display(k)} {html.escape(label(k, modules))}: '
        f'<a href="anki/Modules/IMF-{k}-en.tsv">English</a> &middot; '
        f'<a href="anki/Modules/IMF-{k}-ja.tsv">日本語</a> &middot; '
        f'<a href="anki/Packages/Modules/IMF-{k}-en.apkg" download>APKG</a> &middot; '
        f'<a href="anki/Packages/Modules/IMF-{k}-ja.apkg" download>日本語 APKG</a> '
        f'({per_module[k]} each){EXTRA_LINK.get(k, "")}</li>'
        for k in carded
    )

    mindmap_rows = "\n".join(
        f'      <li>{display(k)} {html.escape(label(k, modules))}: '
        f'<a href="mindmaps/pdf/IMF-{k}-en.pdf" download>English PDF</a> &middot; '
        f'<a href="mindmaps/pdf/IMF-{k}-ja.pdf" download>日本語 PDF</a> &middot; '
        f'<a href="mindmaps/png/IMF-{k}-en.png" download>PNG</a> &middot; '
        f'<a href="mindmaps/opml/IMF-{k}-en.opml" download>OPML</a></li>'
        for k in mapped
    )

    pack_rows = "\n".join(
        f'      <li>{display(k)} {html.escape(label(k, modules))}: '
        f'<a href="packs/IMF-{k}-study-pack.zip" download>study pack</a></li>'
        for k in packed
    )

    text = INDEX.read_text(encoding="utf-8")
    text = replace_block(text, "ANKI", anki_rows)
    text = replace_block(text, "MINDMAPS", mindmap_rows)
    text = replace_block(text, "PACKS", pack_rows)
    text = replace_count(text, "OBJECTIVES", str(len(cards)))
    text = replace_count(text, "CARDED", str(len(carded)))
    text = replace_count(text, "UNCARDED", str(len(modules["en"]) - len(carded)))
    text = replace_count(text, "MAPPED", str(len(mapped)))
    text = replace_count(text, "PACKED", str(len(packed)))
    INDEX.write_text(text, encoding="utf-8")

    print(f"{len(cards)} objectives, {len(carded)} carded modules, "
          f"{len(mapped)} mapped, {len(packed)} packed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
