#!/usr/bin/env python3
"""Assemble one downloadable study pack per TTS module.

The site hosts study material to download, not to read in a browser, and the
unit people work in is a module. Each pack is a single ZIP holding that
module in every form it exists in:

    text/       the module's own Markdown, English and Japanese
    mindmap/    PDF, PNG, SVG, OPML and the Markdown outline, both languages
    anki/       the module's TSV imports and APKG packages, both languages
    README.txt  what is inside, what it was built from, and what is missing

Narration MP3s are not packed. They are tens of megabytes each and already
published beside the manuscripts, so the README links them instead.

    python3 tools/build_packs.py            # every module that has material
    python3 tools/build_packs.py 006-01     # one module

Outputs go to packs/. A pack is written only when a module has at least a
mindmap or a card set, so the empty modules produce nothing.
"""

from __future__ import annotations

import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import imf_manuscript as manuscript  # noqa: E402

PACKS = ROOT / "packs"
MINDMAPS = ROOT / "mindmaps"
ANKI = ROOT / "anki"
AUDIO = ROOT / "audio"

BASE_URL = "https://theisegoria.github.io/medical-textbook"

# Every format the mindmap builder produces goes into the pack, so a pack is a
# complete offline copy of the module. PNG is the largest by an order of
# magnitude and is kept because it is the one that drops straight into slides
# and notes without conversion.
MINDMAP_FORMATS = (("pdf", "pdf"), ("png", "png"), ("svg", "svg"),
                   ("opml", "opml"), ("Outlines", "md"))

README = """Integrated Medical Foundations
Module {key}: chapter {chapter}, TTS module {number}

  English : {en_chapter}
            TTS module {number}: {en_module}
  日本語   : {ja_chapter}
            TTSモジュール{number}：{ja_module}

WHAT IS IN THIS PACK

  text/      The module's own Markdown, exactly as it appears in the published
             master manuscripts.
  mindmap/   The same module as a mindmap. Open the PDF to print or read it,
             the PNG to drop into slides or notes, the SVG to scale it into a
             document, or the OPML in MindNode, XMind, iThoughts or Freeplane
             to edit it. The .md outline is the source all of them are built
             from: headings are nodes, and heading depth is node depth.
  anki/      Retrieval cards. Import the .apkg directly, or the .tsv if you want
             to map the fields yourself. English and Japanese are separate
             decks; the note IDs carry a language suffix and are stable across
             releases, so re-importing updates notes rather than duplicating
             them.

WHAT IS NOT IN IT

  Narration. The MP3s run to tens of megabytes each, so they are linked rather
  than packed:
{audio}

  Review. Nothing here has had independent scientific or translation review, and
  the Anki imports have not yet been tested in the Anki application itself. This
  is study material written by a medical student, not clinical guidance.

SOURCE FINGERPRINTS

  Every file in this pack was built from these two manuscript modules. If a
  digest below no longer matches the published master, the master has been
  revised since this pack was built.

  English  {en_sha}
  日本語    {ja_sha}

  Masters: {base}/integrated-medical-foundations-expanded-english.md
           {base}/integrated-medical-foundations-expanded-japanese.md

Built {built}. {base}/
"""


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audio_links(key: str) -> str:
    chapter, number = key.split("-")
    prefix = f"{int(chapter):02d}-{int(number)}"
    found = sorted(
        path for path in AUDIO.glob("*.mp3") if f"_{prefix}_" in path.name
    ) if AUDIO.is_dir() else []
    if not found:
        return "    Not recorded for this module yet."
    return "\n".join(f"    {BASE_URL}/audio/{path.name}" for path in found)


def gather(key: str, modules: dict) -> list[tuple[str, Path]]:
    """Return (name inside the zip, file on disk) for everything this module has."""
    members: list[tuple[str, Path]] = []
    for language in manuscript.LANGUAGES:
        stem = f"IMF-{key}-{language}"
        for folder, suffix in MINDMAP_FORMATS:
            path = MINDMAPS / folder / f"{stem}.{suffix}"
            if path.is_file():
                members.append((f"mindmap/{stem}.{suffix}", path))
        tsv = ANKI / "Modules" / f"{stem}.tsv"
        if tsv.is_file():
            members.append((f"anki/{stem}.tsv", tsv))
        apkg = ANKI / "Packages" / "Modules" / f"{stem}.apkg"
        if apkg.is_file():
            members.append((f"anki/{stem}.apkg", apkg))
    return members


def build(key: str, modules: dict, built: str) -> Path | None:
    members = gather(key, modules)
    if not members:
        return None

    english = modules["en"][key]
    japanese = modules["ja"][key]
    readme = README.format(
        key=key,
        chapter=english.chapter,
        number=english.module,
        en_chapter=english.chapter_title,
        ja_chapter=japanese.chapter_title,
        en_module=english.module_title,
        ja_module=japanese.module_title,
        audio=audio_links(key),
        en_sha=english.sha256,
        ja_sha=japanese.sha256,
        base=BASE_URL,
        built=built,
    )

    PACKS.mkdir(parents=True, exist_ok=True)
    target = PACKS / f"IMF-{key}-study-pack.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(f"IMF-{key}/README.txt", readme)
        archive.writestr(f"IMF-{key}/text/IMF-{key}-en.md", english.text + "\n")
        archive.writestr(f"IMF-{key}/text/IMF-{key}-ja.md", japanese.text + "\n")
        for name, path in members:
            archive.write(path, f"IMF-{key}/{name}")
    return target


# The combined archive carries only the formats a reader opens or imports. PNG
# and SVG are excluded from it: at one megabyte each they would take the file
# past GitHub's 100 MB hard limit well before all 246 modules are drawn, and
# every rebuild would add that much to the repository's history for good. Each
# module's own study pack still carries every format, and the PNGs are served
# individually.
ARCHIVE_FORMATS = (("pdf", "pdf"), ("opml", "opml"), ("Outlines", "md"))


def build_mindmap_archive(keys: list[str]) -> Path | None:
    files = []
    for key in keys:
        for language in manuscript.LANGUAGES:
            stem = f"IMF-{key}-{language}"
            for folder, suffix in ARCHIVE_FORMATS:
                path = MINDMAPS / folder / f"{stem}.{suffix}"
                if path.is_file():
                    files.append((f"mindmaps/{suffix}/{stem}.{suffix}", path))
    if not files:
        return None
    PACKS.mkdir(parents=True, exist_ok=True)
    target = PACKS / "IMF-mindmaps-all.zip"
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as archive:
        readme = MINDMAPS / "README.md"
        if readme.is_file():
            archive.write(readme, "mindmaps/README.md")
        for name, path in files:
            archive.write(path, name)
    return target


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("modules", nargs="*", help="module keys such as 006-01")
    parser.add_argument("--date", default=None, help="build date recorded in each README")
    args = parser.parse_args(argv)

    from datetime import date
    built = args.date or date.today().isoformat()

    modules = manuscript.parse_all()
    keys = sorted(args.modules) if args.modules else sorted(modules["en"])

    made: list[str] = []
    for key in keys:
        if key not in modules["en"]:
            print(f"unknown module {key}", file=sys.stderr)
            return 1
        target = build(key, modules, built)
        if target:
            made.append(key)
            print(f"{target.name}: {target.stat().st_size / 1024:.0f} KB")

    archive = build_mindmap_archive([k for k in made])
    if archive:
        print(f"{archive.name}: {archive.stat().st_size / 1024:.0f} KB")
    print(f"{len(made)} study pack(s) with material")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
