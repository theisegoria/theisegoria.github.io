#!/usr/bin/env python3
"""Validate the paired card source and export every Anki deliverable.

Inputs
------
cards.json                one record per learning objective, English and
                          Japanese question/answer in the same record.

Outputs
-------
Modules/IMF-CCC-MM-xx.tsv per-module imports, one file per language
IMF-en.tsv, IMF-ja.tsv     whole-collection imports
module-coverage.tsv        every canonical module with its card count
module-downloads.json      per-file manifest with digests
card-provenance.json       per-note manuscript association
Packages/*.apkg            native Anki packages, combined and per module
                           (only when genanki is installed)

Every export is derived; cards.json is the only editable source. Stable IDs are
never renumbered after release. Cards are not automatically reversed.

Run from this directory:

    python3 -m unittest test_build_decks.py
    python3 -O -m unittest test_build_decks.py
    python3 build_decks.py

Validation must stay active when assertions are disabled, so this module raises
explicitly and never uses a bare `assert` for a checked condition.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "tools"))

import imf_manuscript as manuscript  # noqa: E402

CARDS_PATH = HERE / "cards.json"
MODULES_DIR = HERE / "Modules"
PACKAGES_DIR = HERE / "Packages"

TSV_HEADER = ("#separator:Tab", "#html:false", "#tags column:5")
FIELD_NAMES = ("ID", "Front", "Back", "Source", "Tags")

HTML_TAG_RE = re.compile(r"</?[A-Za-z][^>]*>")
CJK_RE = re.compile("[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]")

DECK_NAMES = {"en": "Integrated Medical Foundations::English",
              "ja": "Integrated Medical Foundations::日本語"}

MODEL_ID = 1607392319
DECK_IDS = {"en": 1739400001, "ja": 1739400002}

MODEL_FIELDS = [{"name": name} for name in FIELD_NAMES[:4]]
MODEL_TEMPLATE = [{
    "name": "Recall",
    "qfmt": "{{Front}}",
    "afmt": "{{FrontSide}}<hr id=answer>{{Back}}<br>{{Source}}",
}]
MODEL_CSS = (
    ".card { font-family: -apple-system, 'Hiragino Sans', sans-serif;"
    " font-size: 20px; text-align: left; color: #1b1b1b; background: #fbfbf9; }\n"
    ".card hr { border: 0; border-top: 1px solid #d8d4cc; margin: 14px 0; }\n"
)


class ValidationError(RuntimeError):
    """Raised when the card source fails a release check."""


def fail(message: str) -> None:
    raise ValidationError(message)


# ---------------------------------------------------------------- loading


def load_cards(path: Path = CARDS_PATH) -> list[dict]:
    if not path.is_file():
        fail(f"card source not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        fail("cards.json must contain a list of records")
    return data


# ------------------------------------------------------------- validation


REQUIRED_KEYS = ("id", "chapter", "module", "en_front", "en_back", "ja_front", "ja_back")


def validate_cards(cards: list[dict], modules: dict[str, dict[str, object]]) -> None:
    if not cards:
        fail("cards.json is empty")

    seen: set[str] = set()
    per_module: dict[str, list[int]] = {}

    for position, card in enumerate(cards):
        where = f"record {position}"
        for key in REQUIRED_KEYS:
            if key not in card:
                fail(f"{where}: missing field {key!r}")

        card_id = card["id"]
        if not isinstance(card_id, str):
            fail(f"{where}: id must be a string")
        where = f"card {card_id}"

        if card_id in seen:
            fail(f"{where}: duplicate id")
        seen.add(card_id)

        chapter, module = card["chapter"], card["module"]
        if not isinstance(chapter, int) or not isinstance(module, int):
            fail(f"{where}: chapter and module must be integers")

        expected_prefix = f"IMF-{chapter:03d}-{module:02d}-"
        if not card_id.startswith(expected_prefix):
            fail(f"{where}: id does not match chapter {chapter} module {module}")
        tail = card_id[len(expected_prefix):]
        if not (len(tail) == 4 and tail.isdigit()):
            fail(f"{where}: id must end in a four-digit sequence")
        per_module.setdefault(f"{chapter:03d}-{module:02d}", []).append(int(tail))

        key = manuscript.module_id(chapter, module)
        for language in manuscript.LANGUAGES:
            if key not in modules[language]:
                fail(f"{where}: module {key} is absent from the {language} manuscript")

        for field in ("en_front", "en_back", "ja_front", "ja_back"):
            value = card[field]
            if not isinstance(value, str) or not value.strip():
                fail(f"{where}: {field} is empty")
            if "\t" in value or "\n" in value or "\r" in value:
                fail(f"{where}: {field} contains a tab or newline")
            if value != value.strip():
                fail(f"{where}: {field} has leading or trailing whitespace")
            if HTML_TAG_RE.search(value):
                fail(f"{where}: {field} contains an HTML tag; exports set #html:false")

        for field in ("ja_front", "ja_back"):
            if not CJK_RE.search(card[field]):
                fail(f"{where}: {field} contains no Japanese text")
        for field in ("en_front", "en_back"):
            if CJK_RE.search(card[field]):
                fail(f"{where}: {field} contains Japanese text")

        review = card.get("review", "pending")
        if review not in ("pending", "scientific", "translated", "released"):
            fail(f"{where}: unknown review state {review!r}")

    for key, sequence in sorted(per_module.items()):
        ordered = sorted(sequence)
        if ordered != list(range(1, len(ordered) + 1)):
            fail(f"module {key}: sequence numbers are not contiguous from 0001")
        if sequence != ordered:
            fail(f"module {key}: records are not in sequence order")


# ------------------------------------------------------------------ rows


def rows_for_language(
    cards: list[dict],
    language: str,
    modules: dict[str, "manuscript.Module"],
) -> list[list[str]]:
    rows: list[list[str]] = []
    for card in cards:
        module = modules[manuscript.module_id(card["chapter"], card["module"])]
        review = card.get("review", "pending")
        rows.append([
            f"{card['id']}-{language}",
            card[f"{language}_front"],
            card[f"{language}_back"],
            manuscript.source_field(module, review),
            manuscript.tags_field(module, review),
        ])
    return rows


def render_tsv(rows: list[list[str]]) -> str:
    lines = list(TSV_HEADER)
    lines.extend("\t".join(row) for row in rows)
    return "\n".join(lines) + "\n"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def card_digest(row: list[str]) -> str:
    """Digest of one exported note: fields joined by an ASCII unit separator."""
    return sha256_text("\x1f".join(row[:4]))


# ----------------------------------------------------------------- writes


def write_if_changed(path: Path, text: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_file() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def export(root: Path | None = None, write_packages: bool = True) -> dict:
    modules = manuscript.parse_all(root)
    cards = load_cards()
    validate_cards(cards, modules)

    written: list[str] = []
    downloads: list[dict] = []
    provenance: list[dict] = []

    by_module: dict[str, list[dict]] = {}
    for card in cards:
        by_module.setdefault(
            manuscript.module_id(card["chapter"], card["module"]), []
        ).append(card)

    # genanki stamps every note and the ZIP entry with the current time, so an
    # unchanged deck still comes out as different bytes. Record a digest of
    # what each package contains and skip rewriting one whose content has not
    # changed, so a batch only touches the packages it actually alters.
    ledger_path = PACKAGES_DIR / "package-digests.json"
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        ledger = {}

    def write_package(deck, rows: list[list[str]], out: Path, name: str) -> None:
        digest = hashlib.sha256(json.dumps(
            [deck.deck_id, deck.name, MODEL_ID, MODEL_CSS, rows],
            ensure_ascii=False).encode("utf-8")).hexdigest()
        if out.is_file() and ledger.get(name) == digest:
            return
        genanki.Package(deck).write_to_file(str(out))
        ledger[name] = digest

    for language in manuscript.LANGUAGES:
        rows = rows_for_language(cards, language, modules[language])
        combined = HERE / f"IMF-{language}.tsv"
        if write_if_changed(combined, render_tsv(rows)):
            written.append(combined.name)

        for row, card in zip(rows, cards):
            key = manuscript.module_id(card["chapter"], card["module"])
            provenance.append({
                "note_id": row[0],
                "module": key,
                "manuscript_url": manuscript.PUBLISHED_URL[language],
                "module_sha256_at_export": modules[language][key].sha256,
                "card_sha256": card_digest(row),
                "review": card.get("review", "pending"),
                "scope": ("Module association only; not claim-level evidence "
                          "or semantic approval"),
            })

        for key in sorted(by_module):
            module_cards = by_module[key]
            module_rows = rows_for_language(module_cards, language, modules[language])
            name = f"IMF-{key}-{language}.tsv"
            path = MODULES_DIR / name
            text = render_tsv(module_rows)
            if write_if_changed(path, text):
                written.append(f"Modules/{name}")
            downloads.append({
                "chapter": module_cards[0]["chapter"],
                "module": module_cards[0]["module"],
                "language": language,
                "cards": len(module_cards),
                "file": f"Modules/{name}",
                "sha256": sha256_text(text),
            })

    coverage_lines = [
        "chapter\tmodule\tpaired_cards\tcoverage\ten_source_sha256\tja_source_sha256"
    ]
    for key in sorted(modules["en"]):
        count = len(by_module.get(key, []))
        state = "partial" if count else "not_started"
        chapter, module = key.split("-")
        coverage_lines.append("\t".join([
            str(int(chapter)), str(int(module)), str(count), state,
            modules["en"][key].sha256, modules["ja"][key].sha256,
        ]))
    if write_if_changed(HERE / "module-coverage.tsv", "\n".join(coverage_lines) + "\n"):
        written.append("module-coverage.tsv")

    downloads.sort(key=lambda row: (row["language"], row["chapter"], row["module"]))
    if write_if_changed(
        HERE / "module-downloads.json",
        json.dumps(downloads, ensure_ascii=False, indent=2) + "\n",
    ):
        written.append("module-downloads.json")

    if write_if_changed(
        HERE / "card-provenance.json",
        json.dumps(provenance, ensure_ascii=False, indent=2) + "\n",
    ):
        written.append("card-provenance.json")

    packages: list[str] = []
    if write_packages:
        packages = build_packages(cards, modules)

    return {
        "cards": len(cards),
        "modules_with_cards": len(by_module),
        "modules_total": len(modules["en"]),
        "written": written,
        "packages": packages,
    }


# -------------------------------------------------------------- packaging


def build_packages(cards: list[dict], modules: dict) -> list[str]:
    try:
        import genanki
    except ImportError:
        print("genanki not installed: skipping .apkg packages", file=sys.stderr)
        return []

    model = genanki.Model(
        MODEL_ID,
        "IMF paired recall",
        fields=MODEL_FIELDS,
        templates=MODEL_TEMPLATE,
        css=MODEL_CSS,
    )

    PACKAGES_DIR.mkdir(parents=True, exist_ok=True)
    produced: list[str] = []

    def note_for(row: list[str]):
        return genanki.Note(
            model=model,
            fields=row[:4],
            tags=row[4].split(),
            guid=genanki.guid_for(row[0]),
        )

    by_module: dict[str, list[dict]] = {}
    for card in cards:
        by_module.setdefault(
            manuscript.module_id(card["chapter"], card["module"]), []
        ).append(card)

    # genanki stamps every note and the ZIP entry with the current time, so an
    # unchanged deck still comes out as different bytes. Record a digest of
    # what each package contains and skip rewriting one whose content has not
    # changed, so a batch only touches the packages it actually alters.
    ledger_path = PACKAGES_DIR / "package-digests.json"
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        ledger = {}

    def write_package(deck, rows: list[list[str]], out: Path, name: str) -> None:
        digest = hashlib.sha256(json.dumps(
            [deck.deck_id, deck.name, MODEL_ID, MODEL_CSS, rows],
            ensure_ascii=False).encode("utf-8")).hexdigest()
        if out.is_file() and ledger.get(name) == digest:
            return
        genanki.Package(deck).write_to_file(str(out))
        ledger[name] = digest

    for language in manuscript.LANGUAGES:
        rows = rows_for_language(cards, language, modules[language])
        deck = genanki.Deck(DECK_IDS[language], DECK_NAMES[language])
        for row in rows:
            deck.add_note(note_for(row))
        out = PACKAGES_DIR / f"IMF-{language}.apkg"
        write_package(deck, rows, out, out.name)
        produced.append(out.name)

        # One package per module, so a module can be studied on its own. The
        # note GUIDs are the same as the combined deck's, so importing both
        # updates rather than duplicates.
        module_dir = PACKAGES_DIR / "Modules"
        module_dir.mkdir(parents=True, exist_ok=True)
        for key in sorted(by_module):
            chapter, number = (int(part) for part in key.split("-"))
            module_rows = rows_for_language(by_module[key], language, modules[language])
            title = modules[language][key].module_title
            module_deck = genanki.Deck(
                DECK_IDS[language] + chapter * 100 + number,
                f"{DECK_NAMES[language]}::{key} {title}",
            )
            for row in module_rows:
                module_deck.add_note(note_for(row))
            out = module_dir / f"IMF-{key}-{language}.apkg"
            write_package(module_deck, module_rows, out, f"Modules/{out.name}")
            produced.append(f"Modules/{out.name}")

    ledger_path.write_text(
        json.dumps(dict(sorted(ledger.items())), indent=1) + "\n", encoding="utf-8")
    return produced


# ------------------------------------------------------------------- main


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true",
                        help="validate the source without writing exports")
    parser.add_argument("--no-packages", action="store_true",
                        help="skip .apkg packaging")
    args = parser.parse_args(argv)

    if args.check:
        modules = manuscript.parse_all()
        cards = load_cards()
        validate_cards(cards, modules)
        print(f"validated {len(cards)} paired objectives")
        return 0

    result = export(write_packages=not args.no_packages)
    print(f"{result['cards']} paired objectives across "
          f"{result['modules_with_cards']} of {result['modules_total']} modules")
    print(f"{len(result['written'])} export file(s) changed")
    for name in result["written"][:12]:
        print(f"  {name}")
    if len(result["written"]) > 12:
        print(f"  ... and {len(result['written']) - 12} more")
    if result["packages"]:
        print("packages: " + ", ".join(result["packages"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
