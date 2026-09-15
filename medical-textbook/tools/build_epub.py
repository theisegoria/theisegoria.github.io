#!/usr/bin/env python3
"""Build the expanded EPUB editions from the Markdown masters.

The Markdown is canonical; the EPUB is derived. No builder was preserved with
the releases before 2026-09-15, so this one reproduces the published structure
exactly rather than inventing a new one:

    mimetype                 stored, uncompressed, first entry
    META-INF/container.xml
    EPUB/style.css
    EPUB/chapter-000.xhtml   front matter, then one document per chapter
    EPUB/chapter-001.xhtml   ... through chapter-105.xhtml
    EPUB/nav.xhtml           table of contents, chapters and their level-2 headings
    EPUB/package.opf

Every non-blank line of the master becomes one block. Blocks are numbered from
zero within their document and headings carry `id="sN"`, which is what the
navigation and any external deep link rely on, so the numbering must not change
for unrelated reasons.

    python3 tools/build_epub.py            # both languages
    python3 tools/build_epub.py --lang en
    python3 tools/build_epub.py --verify   # rebuild, then check and record

`--verify` re-reads each built file and checks that every block of the master
survives in the right document, that every navigation target exists, that the
XML parses and the zip is well formed, and, when `epubcheck` is on the path,
runs it. Results are written to expanded-epub-verification.json.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import imf_manuscript as manuscript  # noqa: E402

OUTPUT = {
    "en": ROOT / "integrated-medical-foundations-expanded-english.epub",
    "ja": ROOT / "integrated-medical-foundations-expanded-japanese.epub",
}

TITLE = {
    "en": "Integrated Medical Foundations — Expanded Draft",
    "ja": "統合的医療基盤 — 拡張草稿",
}

IDENTIFIER = {"en": "urn:imf:expanded:en", "ja": "urn:imf:expanded:ja"}

STYLE = ("body { line-height: 1.6; } p { overflow-wrap: anywhere; } "
         "h1,h2 { break-after: avoid; }")

CONTAINER = ('<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument'
             ':xmlns:container" version="1.0"><rootfiles><rootfile '
             'full-path="EPUB/package.opf" '
             'media-type="application/oebps-package+xml"/></rootfiles></container>')

DOC_HEAD = ('<?xml version="1.0" encoding="utf-8"?><html '
            'xmlns="http://www.w3.org/1999/xhtml" '
            'xmlns:epub="http://www.idpf.org/2007/ops" '
            'xml:lang="{lang}" lang="{lang}"><head><title>{title}</title>'
            '<link rel="stylesheet" href="style.css"/></head><body>')


def documents(language: str) -> list[list[str]]:
    """Split a master into its front matter and chapters, as block lists."""
    raw = manuscript.read_manuscript(language)
    blocks = [line for line in raw.split("\n") if line.strip()]
    out: list[list[str]] = []
    for block in blocks:
        if block.startswith("# "):
            out.append([])
        if not out:
            raise RuntimeError("the master does not begin with a level-1 heading")
        out[-1].append(block)
    return out


def render(blocks: list[str], language: str) -> tuple[str, str, list[tuple[str, str]]]:
    """Return the document, its title, and its level-2 headings as (id, text)."""
    body: list[str] = []
    headings: list[tuple[str, str]] = []
    title = ""
    for index, block in enumerate(blocks):
        level = len(block) - len(block.lstrip("#"))
        if level:
            text = block[level:].strip()
            if level == 1:
                title = text
            if level == 2:
                headings.append((f"s{index}", text))
            body.append(f'<h{level} id="s{index}">{escape(text)}</h{level}>')
        else:
            body.append(f"<p>{escape(block)}</p>")
    document = (DOC_HEAD.format(lang=language, title=escape(title))
                + "\n".join(body) + "</body></html>")
    return document, title, headings


def build(language: str) -> Path:
    docs = documents(language)
    rendered = [render(blocks, language) for blocks in docs]

    manifest = []
    spine = []
    nav_items = []
    for index, (_, title, headings) in enumerate(rendered):
        name = f"chapter-{index:03d}.xhtml"
        manifest.append(f'<item id="c{index}" href="{name}" '
                        f'media-type="application/xhtml+xml"/>')
        spine.append(f'<itemref idref="c{index}"/>')
        children = "".join(
            f'<li><a href="{name}#{anchor}">{escape(text)}</a></li>'
            for anchor, text in headings
        )
        nav_items.append(
            f'<li><a href="{name}">{escape(title)}</a>'
            + (f"<ol>{children}</ol>" if children else "")
            + "</li>"
        )

    nav = (DOC_HEAD.format(lang=language, title=escape(TITLE[language]))
           + f'<nav epub:type="toc"><h1>{escape(TITLE[language])}</h1><ol>'
           + "".join(nav_items) + "</ol></nav></body></html>")

    modified = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    opf = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" '
        'unique-identifier="id">\n'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:identifier id="id">{IDENTIFIER[language]}</dc:identifier>'
        f'<dc:title>{escape(TITLE[language])}</dc:title>'
        f'<dc:language>{language}</dc:language>'
        f'<meta property="dcterms:modified">{modified}</meta></metadata>\n'
        '<manifest>' + "".join(manifest)
        + '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" '
          'properties="nav"/>'
          '<item id="css" href="style.css" media-type="text/css"/></manifest>\n'
        '<spine>' + "".join(spine) + '</spine></package>'
    )

    target = OUTPUT[language]
    with zipfile.ZipFile(target, "w") as archive:
        archive.writestr(
            zipfile.ZipInfo("mimetype"), "application/epub+zip",
            compress_type=zipfile.ZIP_STORED,
        )
        archive.writestr("EPUB/style.css", STYLE, zipfile.ZIP_DEFLATED)
        for index, (document, _, _) in enumerate(rendered):
            archive.writestr(f"EPUB/chapter-{index:03d}.xhtml", document,
                             zipfile.ZIP_DEFLATED)
        archive.writestr("EPUB/nav.xhtml", nav, zipfile.ZIP_DEFLATED)
        archive.writestr("EPUB/package.opf", opf, zipfile.ZIP_DEFLATED)
        archive.writestr("META-INF/container.xml", CONTAINER, zipfile.ZIP_DEFLATED)
    return target


# ------------------------------------------------------------------ verify


def verify(language: str) -> dict:
    from xml.etree import ElementTree

    target = OUTPUT[language]
    docs = documents(language)
    result: dict = {
        "language": language,
        "file": target.name,
        "source": manuscript.MANUSCRIPTS[language],
        "source_sha256": hashlib.sha256(
            manuscript.manuscript_path(language).read_bytes()).hexdigest(),
        "epub_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "content_documents": len(docs),
    }

    with zipfile.ZipFile(target) as archive:
        broken = archive.testzip()
        names = set(archive.namelist())

        missing_blocks = 0
        for index, blocks in enumerate(docs):
            document = archive.read(f"EPUB/chapter-{index:03d}.xhtml").decode()
            ElementTree.fromstring(document)
            for block in blocks:
                text = block.lstrip("#").strip()
                if escape(text) not in document:
                    missing_blocks += 1
        result["text_parity"] = (
            "passed per block" if not missing_blocks
            else f"FAILED, {missing_blocks} blocks missing"
        )

        nav = archive.read("EPUB/nav.xhtml").decode()
        ElementTree.fromstring(nav)
        dangling = 0
        import re
        for href in re.findall(r'href="([^"]+)"', nav):
            name, _, anchor = href.partition("#")
            if f"EPUB/{name}" not in names:
                dangling += 1
            elif anchor and f'id="{anchor}"' not in archive.read(
                    f"EPUB/{name}").decode():
                dangling += 1
        result["navigation_targets"] = "passed" if not dangling else f"FAILED, {dangling}"
        ElementTree.fromstring(archive.read("EPUB/package.opf").decode())
        result["xml_zip"] = "passed" if broken is None else f"FAILED at {broken}"

    checker = shutil.which("epubcheck")
    if checker:
        run = subprocess.run([checker, str(target)], capture_output=True, text=True)
        output = (run.stdout + run.stderr).strip()
        result["epubcheck"] = {
            "status": "passed" if run.returncode == 0 else "FAILED",
            "returncode": run.returncode,
            "messages": output[-800:],
        }
    else:
        result["epubcheck"] = {"status": "not_run", "reason": "epubcheck not installed"}

    result["kobo_rendering"] = "not_tested"
    result["kindle_conversion"] = "not_tested"
    result["curriculum_coverage"] = (
        "incomplete; full current manuscript, not finished curriculum")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--lang", choices=manuscript.LANGUAGES)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args(argv)

    languages = [args.lang] if args.lang else list(manuscript.LANGUAGES)
    results = []
    for language in languages:
        target = build(language)
        size = target.stat().st_size / 1024
        print(f"{target.name}: {size:.0f} KB")
        if args.verify:
            results.append(verify(language))

    if args.verify:
        (ROOT / "expanded-epub-verification.json").write_text(
            json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for entry in results:
            print(f"  {entry['language']}: text {entry['text_parity']}, "
                  f"nav {entry['navigation_targets']}, "
                  f"epubcheck {entry['epubcheck']['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
