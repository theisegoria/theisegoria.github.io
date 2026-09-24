"""Shared manuscript access for Integrated Medical Foundations.

Both the Anki exporter and the mindmap builder read the bilingual masters
through this module so that chapter/module boundaries and content hashes are
defined in exactly one place.

Module slicing recipe (canonical, 2026-09-15)
---------------------------------------------
1. A chapter begins at a level-1 heading matching the chapter pattern for its
   language and ends immediately before the next chapter heading, or at end of
   file.
2. Within a chapter, TTS module k begins at its own level-2 heading (inclusive)
   and ends immediately before whichever comes first: the next TTS module
   heading, the first chapter-tail heading (retrieval prompts / concise answers
   / source map), or the end of the chapter.
3. The hashed text is that slice with trailing whitespace stripped from every
   line, lines rejoined with "\\n", and leading/trailing blank lines removed.
   The digest is SHA-256 over the UTF-8 encoding of that normalised text.

This recipe is deterministic and reproducible from the published masters. Note
that it does NOT reproduce the "module SHA256 at export" values carried by the
decks released before 2026-09-15: those values match no contiguous slice of
either master under any normalisation tried, and the exporter that produced
them was not preserved in the repository. Treat pre-2026-09-15 provenance
digests as unverifiable rather than as evidence.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

LANGUAGES = ("en", "ja")

MANUSCRIPTS = {
    "en": "integrated-medical-foundations-expanded-english.md",
    "ja": "integrated-medical-foundations-expanded-japanese.md",
}

PUBLISHED_URL = {
    "en": (
        "https://theisegoria.github.io/medical-textbook/"
        "integrated-medical-foundations-expanded-english.md"
    ),
    "ja": (
        "https://theisegoria.github.io/medical-textbook/"
        "integrated-medical-foundations-expanded-japanese.md"
    ),
}

# Study packs are too heavy for the Pages site (GitHub Pages caps a site at
# 1 GB), so they are published as assets of one GitHub Release and linked
# from there. tools/publish_packs.py uploads them.
PACK_RELEASE = "imf-study-packs"
PACK_BASE = (
    "https://github.com/theisegoria/theisegoria.github.io/releases/download/"
    + PACK_RELEASE + "/"
)

CHAPTER_RE = {
    "en": re.compile(r"^# Chapter (\d+)\s*[:：]\s*(.+)$"),
    "ja": re.compile(r"^# 第(\d+)章\s*[:：]\s*(.+)$"),
}

MODULE_RE = {
    "en": re.compile(r"^## TTS module (\d+)\s*[:：]\s*(.+)$"),
    "ja": re.compile(r"^## TTS ?モジュール(\d+)\s*[:：]\s*(.+)$"),
}

CHAPTER_TAIL_HEADINGS = {
    "en": ("## Retrieval prompts", "## Concise answers", "## Source map"),
    "ja": ("## 想起問題", "## 簡潔な解答", "## 出典対応表"),
}


class ManuscriptError(RuntimeError):
    """Raised when a manuscript cannot be parsed or a module is missing."""


@dataclass(frozen=True)
class Module:
    chapter: int
    module: int
    chapter_title: str
    module_title: str
    text: str
    language: str

    @property
    def module_id(self) -> str:
        return f"{self.chapter:03d}-{self.module:02d}"

    @property
    def sha256(self) -> str:
        return hashlib.sha256(self.text.encode("utf-8")).hexdigest()

    @property
    def body(self) -> str:
        """The module text with its own heading line removed."""
        lines = self.text.split("\n")
        return "\n".join(lines[1:]).strip("\n")


def normalise(text: str) -> str:
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines).strip("\n")


def manuscript_path(language: str, root: Path | None = None) -> Path:
    if language not in MANUSCRIPTS:
        raise ManuscriptError(f"unknown language {language!r}")
    return (root or REPO_ROOT) / MANUSCRIPTS[language]


def read_manuscript(language: str, root: Path | None = None) -> str:
    path = manuscript_path(language, root)
    if not path.is_file():
        raise ManuscriptError(f"manuscript not found: {path}")
    return path.read_text(encoding="utf-8")


def parse_modules(language: str, root: Path | None = None) -> dict[str, Module]:
    """Return every module of one language, keyed by 'CCC-MM'."""
    if language not in LANGUAGES:
        raise ManuscriptError(f"unknown language {language!r}")
    raw = read_manuscript(language, root)
    lines = raw.split("\n")
    chapter_re = CHAPTER_RE[language]
    module_re = MODULE_RE[language]
    tails = CHAPTER_TAIL_HEADINGS[language]

    chapter_starts: list[tuple[int, int, str]] = []
    for index, line in enumerate(lines):
        match = chapter_re.match(line)
        if match:
            chapter_starts.append((index, int(match.group(1)), match.group(2).strip()))
    if not chapter_starts:
        raise ManuscriptError(f"no chapter headings found in the {language} manuscript")

    modules: dict[str, Module] = {}
    for position, (start, number, title) in enumerate(chapter_starts):
        end = (
            chapter_starts[position + 1][0]
            if position + 1 < len(chapter_starts)
            else len(lines)
        )
        chapter_lines = lines[start:end]

        tail_at = len(chapter_lines)
        for index, line in enumerate(chapter_lines):
            if line.strip() in tails:
                tail_at = index
                break

        heads: list[tuple[int, int, str]] = []
        for index, line in enumerate(chapter_lines):
            match = module_re.match(line)
            if match:
                heads.append((index, int(match.group(1)), match.group(2).strip()))

        for order, (head_at, module_number, module_title) in enumerate(heads):
            if order + 1 < len(heads):
                stop = heads[order + 1][0]
            else:
                stop = tail_at if tail_at > head_at else len(chapter_lines)
            text = normalise("\n".join(chapter_lines[head_at:stop]))
            key = f"{number:03d}-{module_number:02d}"
            if key in modules:
                raise ManuscriptError(
                    f"duplicate module {key} in the {language} manuscript"
                )
            modules[key] = Module(
                chapter=number,
                module=module_number,
                chapter_title=title,
                module_title=module_title,
                text=text,
                language=language,
            )
    return modules


def parse_all(root: Path | None = None) -> dict[str, dict[str, Module]]:
    return {language: parse_modules(language, root) for language in LANGUAGES}


def module_id(chapter: int, module: int) -> str:
    return f"{chapter:03d}-{module:02d}"


def card_id(chapter: int, module: int, sequence: int) -> str:
    return f"IMF-{module_id(chapter, module)}-{sequence:04d}"


def note_id(chapter: int, module: int, sequence: int, language: str) -> str:
    return f"{card_id(chapter, module, sequence)}-{language}"


def source_field(module: Module, review: str = "pending") -> str:
    state = (
        "editorial review pending"
        if review == "pending"
        else f"editorial review: {review}"
    )
    return (
        "Integrated Medical Foundations; "
        f"chapter {module.chapter}, TTS module {module.module}; "
        f"{PUBLISHED_URL[module.language]}; "
        f"module SHA256 at export: {module.sha256}; {state}"
    )


def tags_field(module: Module, review: str = "pending") -> str:
    return (
        f"imf lang::{module.language} chapter::{module.chapter:03d} "
        f"module::{module.module_id} review::{review}"
    )
