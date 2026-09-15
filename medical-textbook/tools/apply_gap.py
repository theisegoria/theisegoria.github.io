#!/usr/bin/env python3
"""Insert the missing English paragraphs into the English master.

The Japanese edition carries paragraphs the English does not. This script takes
the written English for those gaps and puts each paragraph at the position its
Japanese counterpart occupies, rather than appending to the end of the section:
in most affected modules the gaps are interleaved, and appending would both
misorder the module and leave the argument discontinuous.

Inputs, produced during the gap-filling pass:

    gap.json    {"CCC-MM": ["paragraph", ...]}          the English to insert
    map.json    {"CCC-MM": [after_index, ...]}          where each one goes

`after_index` is the 0-based index of the paragraph in that module's FINAL
SECTION after which the new paragraph belongs, counted over non-blank,
non-heading lines and evaluated against the section as it stands before any
insertion. -1 places a paragraph before the section's first paragraph.

    python3 tools/apply_gap.py --gap /tmp/gaps.json --map /tmp/maps.json
    python3 tools/apply_gap.py ... --dry-run

The script refuses to run twice over the same content: if a paragraph it is
about to insert is already present in the module, it stops rather than
duplicating it.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import imf_manuscript as manuscript  # noqa: E402


class ApplyError(RuntimeError):
    pass


def module_span(lines: list[str], chapter: int, number: int) -> tuple[int, int]:
    """Line range [start, stop) of one module inside the English master."""
    chapter_re = manuscript.CHAPTER_RE["en"]
    module_re = manuscript.MODULE_RE["en"]
    tails = manuscript.CHAPTER_TAIL_HEADINGS["en"]

    starts = [i for i, l in enumerate(lines) if chapter_re.match(l)]
    here = None
    for position, index in enumerate(starts):
        if int(chapter_re.match(lines[index]).group(1)) == chapter:
            here = (index, starts[position + 1] if position + 1 < len(starts) else len(lines))
            break
    if here is None:
        raise ApplyError(f"chapter {chapter} not found")
    start, end = here

    heads = [i for i in range(start, end) if module_re.match(lines[i])]
    tail_at = next((i for i in range(start, end) if lines[i].strip() in tails), end)

    for position, index in enumerate(heads):
        if int(module_re.match(lines[index]).group(1)) == number:
            if position + 1 < len(heads):
                stop = heads[position + 1]
            else:
                stop = tail_at if tail_at > index else end
            return index, stop
    raise ApplyError(f"module {chapter}-{number} not found")


def final_section_paragraphs(lines: list[str], start: int, stop: int) -> list[int]:
    """Line numbers of the paragraphs in the module's last section."""
    heading_at = max(
        (i for i in range(start, stop) if lines[i].startswith("#")), default=start
    )
    return [
        i for i in range(heading_at + 1, stop)
        if lines[i].strip() and not lines[i].startswith("#")
    ]


def apply(gap: dict[str, list[str]], positions: dict[str, list[int]],
          dry_run: bool = False) -> dict:
    path = manuscript.manuscript_path("en")
    lines = path.read_text(encoding="utf-8").split("\n")

    plan = []
    for key in sorted(gap):
        if key not in positions:
            raise ApplyError(f"{key}: no insertion map")
        paragraphs, after = gap[key], positions[key]
        if len(paragraphs) != len(after):
            raise ApplyError(f"{key}: {len(paragraphs)} paragraphs, {len(after)} positions")

        chapter, number = (int(part) for part in key.split("-"))
        start, stop = module_span(lines, chapter, number)
        body = "\n".join(lines[start:stop])
        for paragraph in paragraphs:
            if paragraph[:60] in body:
                raise ApplyError(f"{key}: already applied, refusing to duplicate")

        para_lines = final_section_paragraphs(lines, start, stop)
        for index in after:
            if index < -1 or index >= len(para_lines):
                raise ApplyError(
                    f"{key}: position {index} outside 0..{len(para_lines) - 1}"
                )
        for paragraph, index in zip(paragraphs, after):
            anchor = para_lines[index] if index >= 0 else para_lines[0] - 1
            plan.append((anchor, index < 0, paragraph, key))

    # Apply from the bottom up so earlier line numbers stay valid.
    inserted = 0
    for anchor, before, paragraph, key in sorted(plan, key=lambda p: (-p[0], p[1])):
        if before:
            at = anchor
            block = [paragraph, ""]
        else:
            at = anchor + 1
            block = ["", paragraph]
        if not dry_run:
            lines[at:at] = block
        inserted += 1

    if not dry_run:
        path.write_text("\n".join(lines), encoding="utf-8")
    return {"modules": len(gap), "paragraphs": inserted}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--gap", required=True)
    parser.add_argument("--map", required=True, dest="positions")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    gap = json.loads(Path(args.gap).read_text(encoding="utf-8"))
    positions = json.loads(Path(args.positions).read_text(encoding="utf-8"))
    result = apply(gap, positions, dry_run=args.dry_run)
    verb = "would insert" if args.dry_run else "inserted"
    print(f"{verb} {result['paragraphs']} paragraphs across {result['modules']} modules")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
