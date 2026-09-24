#!/usr/bin/env python3
"""Build every mindmap deliverable from the canonical Markdown outlines.

Source
------
Outlines/IMF-CCC-MM-xx.md   one constrained Markdown outline per module per
                            language. YAML front matter, then headings only:
                            `#` is the root, `##` its branches, and so on to
                            `#####`. Heading depth is node depth; nothing else
                            in the file is read.

Outputs
-------
svg/IMF-CCC-MM-xx.svg       self-contained figure, light and dark
png/IMF-CCC-MM-xx.png       raster for slide decks and quick viewing
pdf/IMF-CCC-MM-xx.pdf       vector page for printing and for tablets
opml/IMF-CCC-MM-xx.opml     OPML 2.0, imports into MindNode, XMind, iThoughts
These are study materials to download and keep, not pages to read on the site.
The renderer is hand-authored so that one Markdown outline produces every format
from the same geometry. The tree follows the shape a mindmap tool would give:
a central root, branches balanced across both sides, curved links, depth-coloured
nodes.

Usage:

    python3 build_mindmaps.py                 # build everything
    python3 build_mindmaps.py 006-01          # build one module, both languages
    python3 build_mindmaps.py --check         # parse and validate only
"""

from __future__ import annotations

import argparse
import html
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(ROOT / "tools"))

import imf_manuscript as manuscript  # noqa: E402

OUTLINES = HERE / "Outlines"
SVG_DIR = HERE / "svg"
PNG_DIR = HERE / "png"
PDF_DIR = HERE / "pdf"
OPML_DIR = HERE / "opml"

HEADING_RE = re.compile(r"^(#{1,5})\s+(.+?)\s*$")
FRONT_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

MAX_DEPTH = 5
WIDE = re.compile("[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]")

FONT_STACK = {
    "en": "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "ja": "'Hiragino Sans', 'Noto Sans JP', ui-sans-serif, sans-serif",
}

FONT_SIZE = {0: 17.0, 1: 14.5, 2: 13.0, 3: 12.5, 4: 12.0}
WRAP_EN = {0: 26, 1: 30, 2: 34, 3: 36, 4: 38}
WRAP_JA = {0: 14, 1: 17, 2: 19, 3: 20, 4: 21}

PAD_X = 10.0
PAD_Y = 5.5
LINE_GAP = 1.32
ROW_GAP = 8.0
COLUMN_GAP = 40.0
MARGIN = 26.0

# Literal colours rather than custom properties: rsvg-convert, which produces
# the PNG, does not resolve var(), and an unresolved fill renders as black.
LIGHT = {"paper": "#faf8f4", "ink": "#1b1917", "soft": "#5d574f", "rule": "#c9c1b4"}
DARK = {"paper": "#12100e", "ink": "#ece7df", "soft": "#a49c91", "rule": "#3d3833"}

# One hue per top-level branch, so colour carries which branch a node belongs
# to; depth is carried by weight and fill instead. Reusing hue for depth would
# waste the one channel that does the chunking work.
#
# The hues are the Okabe-Ito colour-blind-safe set, with its pale yellow
# replaced by a dark gold (the yellow cannot hold a border or text on paper)
# and two further hues added for maps with more than seven branches. They are
# ordered so that consecutive branches, which is how they are read, are far
# apart in hue. Text colour is derived from the branch hue and then darkened
# or lightened until it clears WCAG AA against the page, so the colour coding
# never costs legibility.
BRANCH_HUES = (
    "#0072B2",  # blue
    "#D55E00",  # vermillion
    "#009E73",  # bluish green
    "#CC79A7",  # reddish purple
    "#A07C00",  # dark gold
    "#56B4E9",  # sky blue
    "#6A4C93",  # purple
    "#6E8B3D",  # moss
    "#E69F00",  # orange
    "#A6272E",  # deep red
    "#4C6472",  # slate
)

CONTRAST_TARGET = 4.5
# A branch hue also has to hold a 1.5px border against the page. Below this
# ratio a pale hue reads as an unfinished box rather than a category, so the
# stroke is darkened (or, on the dark page, lightened) until it clears it.
STROKE_TARGET = 2.4


def _rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def _hex(rgb: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{max(0, min(255, round(channel))):02x}" for channel in rgb)


def mix(first: str, second: str, weight: float) -> str:
    """Blend `weight` of `second` into `first`."""
    a, b = _rgb(first), _rgb(second)
    return _hex(tuple(x + (y - x) * weight for x, y in zip(a, b)))


def _luminance(value: str) -> float:
    channels = []
    for raw in _rgb(value):
        c = raw / 255
        channels.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    red, green, blue = channels
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast(first: str, second: str) -> float:
    a, b = _luminance(first), _luminance(second)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


def readable(hue: str, ground: str, toward: str) -> str:
    """Push `hue` toward `toward` until it clears AA against `ground`."""
    candidate = hue
    for step in range(21):
        if contrast(candidate, ground) >= CONTRAST_TARGET:
            return candidate
        candidate = mix(hue, toward, 0.05 * (step + 1))
    return candidate


def branch_palette(index: int, scheme: dict) -> dict[str, str]:
    """Colours for one branch. Hue says which branch; depth is carried by
    fill and weight, so the two never compete for the same channel."""
    hue = BRANCH_HUES[index % len(BRANCH_HUES)]
    paper, ink = scheme["paper"], scheme["ink"]
    dark_side = paper == DARK["paper"]
    toward = "#ffffff" if dark_side else "#000000"

    # More branches than hues: shift each further cycle in lightness so a
    # reused hue is still told apart from its first appearance.
    cycle = index // len(BRANCH_HUES)
    if cycle:
        hue = mix(hue, toward, min(0.18 * cycle, 0.45))

    base = mix(hue, "#ffffff", 0.22) if dark_side else hue
    stroke = base
    for step in range(1, 13):
        if contrast(stroke, paper) >= STROKE_TARGET:
            break
        stroke = mix(base, toward, 0.06 * step)

    return {
        "stroke": stroke,
        "stroke_soft": mix(stroke, paper, 0.45),
        "fill_branch": mix(base, paper, 0.86),
        "fill_node": mix(base, paper, 0.93),
        "text": readable(mix(stroke, ink, 0.25), paper, toward),
        "link": mix(stroke, paper, 0.3),
    }


LABELS = {
    "en": {
        "print": "Print view",
        "expand": "Expand all",
        "collapse": "Collapse to branches",
        "hint": "Click any branch to fold it. Drag to pan, scroll to zoom.",
        "source": "Source module",
    },
    "ja": {
        "print": "印刷用表示",
        "expand": "すべて展開",
        "collapse": "枝までたたむ",
        "hint": "枝をクリックすると折りたためる。ドラッグで移動、スクロールで拡大縮小。",
        "source": "出典モジュール",
    },
}


class OutlineError(RuntimeError):
    """Raised when an outline file cannot be parsed or fails a check."""


@dataclass
class Node:
    text: str
    depth: int
    children: list["Node"] = field(default_factory=list)
    lines: list[str] = field(default_factory=list)
    width: float = 0.0
    height: float = 0.0
    x: float = 0.0
    y: float = 0.0
    side: int = 1
    branch: int = 0

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()


# ------------------------------------------------------------------ parsing


def parse_front_matter(text: str) -> tuple[dict, str]:
    match = FRONT_RE.match(text)
    if not match:
        raise OutlineError("outline is missing YAML front matter")
    meta: dict = {}
    for line in match.group(1).split("\n"):
        if not line.strip():
            continue
        if ":" not in line:
            raise OutlineError(f"front matter line is not a key/value pair: {line!r}")
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"')
    return meta, text[match.end():]


def parse_outline(path: Path) -> tuple[dict, Node]:
    meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
    for key in ("module", "language", "chapter", "title", "module_title"):
        if key not in meta:
            raise OutlineError(f"{path.name}: front matter is missing {key!r}")
    if meta["language"] not in manuscript.LANGUAGES:
        raise OutlineError(f"{path.name}: unknown language {meta['language']!r}")

    root: Node | None = None
    stack: list[Node] = []
    for number, line in enumerate(body.split("\n"), start=1):
        if not line.strip():
            continue
        match = HEADING_RE.match(line)
        if not match:
            raise OutlineError(
                f"{path.name} line {number}: outlines hold headings only, got {line[:40]!r}"
            )
        depth = len(match.group(1)) - 1
        node = Node(text=match.group(2).strip(), depth=depth)
        if depth == 0:
            if root is not None:
                raise OutlineError(f"{path.name}: more than one root heading")
            root = node
            stack = [node]
            continue
        if root is None:
            raise OutlineError(f"{path.name}: first heading must be the root")
        if depth > len(stack):
            raise OutlineError(
                f"{path.name} line {number}: heading depth jumps by more than one"
            )
        stack = stack[:depth]
        stack[-1].children.append(node)
        stack.append(node)
    if root is None:
        raise OutlineError(f"{path.name}: no headings found")
    if not root.children:
        raise OutlineError(f"{path.name}: the root has no branches")
    return meta, root


# ------------------------------------------------------------------- layout


# Advance widths as a fraction of the font size. The root and branch labels are
# set semibold, which runs wider than the body weight, so they get their own
# factor: underestimating here clips the last letter out of its box.
NARROW_ADVANCE = 0.53
BOLD_ADVANCE = 0.585


def text_width(text: str, size: float, bold: bool = False) -> float:
    advance = BOLD_ADVANCE if bold else NARROW_ADVANCE
    units = 0.0
    for character in text:
        units += 1.0 if WIDE.match(character) else advance
    return units * size


def wrap(text: str, limit: int, wide: bool) -> list[str]:
    if wide:
        return [text[index:index + limit] for index in range(0, len(text), limit)] or [text]
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) <= limit or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [text]


def measure(node: Node, language: str) -> None:
    depth = min(node.depth, MAX_DEPTH - 1)
    size = FONT_SIZE[depth]
    limits = WRAP_JA if language == "ja" else WRAP_EN
    node.lines = wrap(node.text, limits[depth], language == "ja")
    bold = depth < 2
    node.width = max(text_width(line, size, bold) for line in node.lines) + 2 * PAD_X
    node.height = size * LINE_GAP * len(node.lines) + 2 * PAD_Y
    for child in node.children:
        measure(child, language)


def side_columns(nodes: list[Node]) -> dict[int, float]:
    widths: dict[int, float] = {}
    stack = list(nodes)
    while stack:
        node = stack.pop()
        widths[node.depth] = max(widths.get(node.depth, 0.0), node.width)
        stack.extend(node.children)
    return widths


def leaf_count(node: Node) -> int:
    if not node.children:
        return 1
    return sum(leaf_count(child) for child in node.children)


def split_sides(root: Node) -> tuple[list[Node], list[Node]]:
    """Balance the root's branches across two sides, by leaf count."""
    branches = list(root.children)
    if len(branches) < 3:
        return branches, []
    right: list[Node] = []
    left: list[Node] = []
    right_load = left_load = 0
    for branch in sorted(branches, key=leaf_count, reverse=True):
        if right_load <= left_load:
            right.append(branch)
            right_load += leaf_count(branch)
        else:
            left.append(branch)
            left_load += leaf_count(branch)
    order = {id(branch): index for index, branch in enumerate(branches)}
    right.sort(key=lambda node: order[id(node)])
    left.sort(key=lambda node: order[id(node)])
    return right, left


def stack_side(branches: list[Node]) -> float:
    cursor = MARGIN

    def place(node: Node) -> float:
        nonlocal cursor
        if not node.children:
            node.y = cursor + node.height / 2
            cursor += node.height + ROW_GAP
            return node.y
        centres = [place(child) for child in node.children]
        node.y = (centres[0] + centres[-1]) / 2
        return node.y

    for branch in branches:
        place(branch)
    return cursor - ROW_GAP + MARGIN if branches else 0.0


def assign(root: Node, language: str) -> tuple[float, float]:
    measure(root, language)
    right, left = split_sides(root)

    def mark(nodes: list[Node], side: int) -> None:
        for node in nodes:
            node.side = side
            mark(node.children, side)

    mark(right, 1)
    mark(left, -1)
    root.side = 1

    # Every node inherits the branch index of the top-level branch it hangs
    # from, which is what the colour then encodes.
    for index, branch in enumerate(root.children):
        stack = [branch]
        while stack:
            node = stack.pop()
            node.branch = index
            stack.extend(node.children)

    total_height = max(stack_side(right), stack_side(left),
                       root.height + 2 * MARGIN)

    right_columns = side_columns(right)
    left_columns = side_columns(left)
    right_span = sum(right_columns.values()) + COLUMN_GAP * len(right_columns)
    left_span = sum(left_columns.values()) + COLUMN_GAP * len(left_columns)

    root.x = MARGIN + left_span
    root.y = total_height / 2

    def lay(nodes: list[Node], columns: dict[int, float], side: int) -> None:
        offsets: dict[int, float] = {}
        if side == 1:
            running = root.x + root.width + COLUMN_GAP
            for depth in sorted(columns):
                offsets[depth] = running
                running += columns[depth] + COLUMN_GAP
        else:
            running = root.x - COLUMN_GAP
            for depth in sorted(columns):
                offsets[depth] = running - columns[depth]
                running -= columns[depth] + COLUMN_GAP
        stack = list(nodes)
        while stack:
            node = stack.pop()
            base = offsets[node.depth]
            node.x = base if side == 1 else base + columns[node.depth] - node.width
            stack.extend(node.children)

    lay(right, right_columns, 1)
    lay(left, left_columns, -1)

    return root.x + root.width + right_span + MARGIN, total_height


# ----------------------------------------------------------------- rendering


def palette_css(font: str, branches: int) -> str:
    def rules(scheme: dict) -> str:
        out = [f"""
  .mm-bg {{ fill: {scheme['paper']}; }}
  .mm text {{ font-family: {font}; fill: {scheme['ink']}; }}
  .mm .link {{ fill: none; stroke: {scheme['rule']}; }}
  .mm .box {{ fill: none; stroke: none; }}
  .mm .d0 .box {{ fill: {scheme['ink']}; stroke: {scheme['ink']}; }}
  .mm .d0 text {{ fill: {scheme['paper']}; font-weight: 650; }}
  .mm .d1 text {{ font-weight: 600; }}
"""]
        for index in range(max(branches, 1)):
            colour = branch_palette(index, scheme)
            out.append(f"""
  .mm .link.b{index} {{ stroke: {colour['link']}; }}
  .mm .b{index}.d1 .box {{ fill: {colour['fill_branch']}; stroke: {colour['stroke']}; stroke-width: 1.5; }}
  .mm .b{index}.d1 text {{ fill: {colour['text']}; }}
  .mm .b{index}.d2 .box {{ fill: {colour['fill_node']}; stroke: {colour['stroke_soft']}; }}
  .mm .b{index}.d3 text, .mm .b{index}.d4 text {{ fill: {colour['text']}; }}
""")
        return "".join(out)

    return (rules(LIGHT)
            + "@media (prefers-color-scheme: dark) {" + rules(DARK) + "}\n")


def curve(x1: float, y1: float, x2: float, y2: float) -> str:
    midpoint = (x1 + x2) / 2
    return (f"M{x1:.1f},{y1:.1f} C{midpoint:.1f},{y1:.1f} "
            f"{midpoint:.1f},{y2:.1f} {x2:.1f},{y2:.1f}")


def render_nodes(node: Node, parts: list[str]) -> None:
    depth = min(node.depth, MAX_DEPTH - 1)
    size = FONT_SIZE[depth]
    out = node.x + node.width if node.side == 1 else node.x
    for child in node.children:
        into = child.x if node.side == 1 else child.x + child.width
        parts.append(
            f'  <path class="link b{child.branch}" data-depth="{child.depth}" '
            f'stroke-width="{max(2.2 - depth * 0.45, 0.9):.1f}" '
            f'd="{curve(out, node.y, into, child.y)}"/>'
        )
    top = node.y - node.height / 2
    radius = 9 if depth < 2 else 6
    parts.append(
        f'  <g class="node d{depth} b{node.branch}" data-depth="{depth}">'
    )
    parts.append(
        f'    <rect class="box" x="{node.x:.1f}" y="{top:.1f}" '
        f'width="{node.width:.1f}" height="{node.height:.1f}" rx="{radius}"/>'
    )
    first = top + PAD_Y + size * LINE_GAP / 2 + size * 0.34
    for index, line in enumerate(node.lines):
        parts.append(
            f'    <text x="{node.x + PAD_X:.1f}" '
            f'y="{first + index * size * LINE_GAP:.1f}" '
            f'font-size="{size:.1f}">{html.escape(line)}</text>'
        )
    parts.append("  </g>")
    for child in node.children:
        render_nodes(child, parts)


def render_svg(root: Node, meta: dict, standalone: bool = True) -> str:
    language = meta["language"]
    width, height = assign(root, language)
    parts: list[str] = []
    render_nodes(root, parts)
    opening = (
        f'<svg xmlns="http://www.w3.org/2000/svg" class="mm" '
        f'viewBox="0 0 {width:.0f} {height:.0f}" '
        f'width="{width:.0f}" height="{height:.0f}" '
        f'role="img" aria-label="{html.escape(root.text)}">'
    )
    style = f"<style>{palette_css(FONT_STACK[language], len(root.children))}</style>"
    background = f'  <rect class="mm-bg" width="{width:.0f}" height="{height:.0f}"/>'
    return "\n".join([opening, style, background, *parts]) + "\n</svg>\n"


def render_opml(root: Node, meta: dict) -> str:
    def branch(node: Node, indent: int) -> list[str]:
        pad = "  " * indent
        text = html.escape(node.text, quote=True)
        if not node.children:
            return [f'{pad}<outline text="{text}"/>']
        lines = [f'{pad}<outline text="{text}">']
        for child in node.children:
            lines.extend(branch(child, indent + 1))
        lines.append(f"{pad}</outline>")
        return lines

    title = html.escape(f"{meta['module']} {meta['module_title']}", quote=True)
    head = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<opml version="2.0">',
        "  <head>",
        f"    <title>{title}</title>",
        f"    <ownerName>Integrated Medical Foundations</ownerName>",
        "  </head>",
        "  <body>",
    ]
    head.extend(branch(root, 2))
    head.extend(["  </body>", "</opml>", ""])
    return "\n".join(head)


# --------------------------------------------------------------------- build


def write(path: Path, text: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_file() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def build_one(path: Path, modules: dict, make_png: bool = True) -> dict:
    meta, root = parse_outline(path)
    key, language = meta["module"], meta["language"]
    if key not in modules[language]:
        raise OutlineError(f"{path.name}: module {key} is not in the {language} manuscript")
    stem = f"IMF-{key}-{language}"
    if path.stem != stem:
        raise OutlineError(f"{path.name}: front matter says it should be named {stem}.md")

    changed = []
    if write(SVG_DIR / f"{stem}.svg", render_svg(root, meta)):
        changed.append(f"svg/{stem}.svg")
    if write(OPML_DIR / f"{stem}.opml", render_opml(root, meta)):
        changed.append(f"opml/{stem}.opml")

    if make_png:
        converter = shutil.which("rsvg-convert")
        if converter:
            source = str(SVG_DIR / f"{stem}.svg")
            PNG_DIR.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [converter, "--zoom", "2", "-b", "#faf8f4",
                 "-o", str(PNG_DIR / f"{stem}.png"), source],
                check=True,
            )
            shrink_png(PNG_DIR / f"{stem}.png")
            changed.append(f"png/{stem}.png")
            PDF_DIR.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [converter, "-f", "pdf", "-b", "#faf8f4",
                 "-o", str(PDF_DIR / f"{stem}.pdf"), source],
                check=True,
            )
            changed.append(f"pdf/{stem}.pdf")
        else:
            print("rsvg-convert not found: skipping PNG and PDF", file=sys.stderr)

    nodes = sum(1 for _ in root.walk())
    depth = max(node.depth for node in root.walk()) + 1
    return {"stem": stem, "nodes": nodes, "depth": depth, "changed": changed,
            "module": key, "language": language,
            "module_title": meta["module_title"]}


def shrink_png(path: Path) -> None:
    """Re-encode a rendered map as a 256-colour palette PNG.

    A map is flat fills, thin lines and anti-aliased text in about a dozen
    hues, so a 256-entry palette with no dithering holds every colour the
    scheme uses while cutting the file to roughly a quarter. Pillow is
    optional: without it the full RGB render is kept.
    """
    try:
        from PIL import Image
    except ImportError:
        print("Pillow not found: PNG left unquantised", file=sys.stderr)
        return
    with Image.open(path) as image:
        palette = image.convert("RGB").quantize(
            256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    palette.save(path, optimize=True)


INDEX_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mindmap downloads · Integrated Medical Foundations</title>
<meta name="description" content="Downloadable bilingual mindmaps for the Integrated Medical Foundations TTS modules: PDF, PNG, OPML for mindmap apps, SVG, the Markdown outlines, and a study pack ZIP per module.">
<link rel="stylesheet" href="/assets/isegoria.css?v=20260915">
<style>
  body {{ margin: 0; background: var(--paper); color: var(--ink); }}
  main {{ max-width: 62rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }}
  h1 {{ line-height: 1.15; margin-bottom: .4rem; }}
  .lead {{ max-width: 64ch; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: .9375rem; }}
  th, td {{ text-align: left; padding: .55rem .5rem; border-bottom: 1px solid var(--rule); vertical-align: top; }}
  th {{ font-size: .8125rem; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-faint); }}
  td.links a {{ margin-right: .55rem; white-space: nowrap; }}
  .wrap {{ overflow-x: auto; }}
</style>
</head>
<body>
<main>
<h1>Mindmap downloads</h1>
<p class="lead">One mindmap per TTS module of <a href="../">Integrated Medical Foundations</a>, in English and
Japanese. These are files to download and keep, not pages to read here. The Markdown outline is the source;
the PDF, PNG, SVG and the OPML that imports into MindNode, XMind or iThoughts are all built from it, so they
cannot drift apart. The study pack collects one module's mindmaps and Anki files in both languages as a
single ZIP.</p>
<p><a href="{pack_base}IMF-mindmaps-all.zip">Every mindmap in every format, as one ZIP</a> &middot;
<a href="README.md" download>How the outlines and the build work</a></p>
<div class="wrap">
<table>
<thead><tr><th>Module</th><th>Language</th><th>Nodes</th><th>Download</th></tr></thead>
<tbody>
{rows}
</tbody>
</table>
</div>
<p><a href="../">Back to Integrated Medical Foundations</a></p>
</main>
</body>
</html>
"""


def write_index(results: list[dict]) -> bool:
    rows = []
    for item in sorted(results, key=lambda r: (r["module"], r["language"])):
        stem = item["stem"]
        language = "English" if item["language"] == "en" else "日本語"
        rows.append(
            f'<tr><td>{item["module"]} {html.escape(item["module_title"])}</td>'
            f'<td>{language}</td><td>{item["nodes"]}</td>'
            f'<td class="links">'
            f'<a href="pdf/{stem}.pdf" download>PDF</a>'
            f'<a href="png/{stem}.png" download>PNG</a>'
            f'<a href="opml/{stem}.opml" download>OPML</a>'
            f'<a href="svg/{stem}.svg" download>SVG</a>'
            f'<a href="Outlines/{stem}.md" download>Markdown</a>'
            f'<a href="{manuscript.PACK_BASE}IMF-{item["module"]}-study-pack.zip">Study pack</a>'
            f'</td></tr>'
        )
    changed = write(HERE / "index.html", INDEX_TEMPLATE.format(rows="\n".join(rows), pack_base=manuscript.PACK_BASE))
    # The template has no site header or analytics tag; add both to this one page, as the
    # repo's CI requires, without touching any other page.
    tools = HERE.parents[1] / "tools"
    for tool in ("site-shell.py", "track-pages.py"):
        subprocess.run([sys.executable, str(tools / tool), "--only", str(HERE / "index.html")], check=True)
    return changed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("modules", nargs="*", help="module keys such as 006-01")
    parser.add_argument("--check", action="store_true", help="parse without writing")
    parser.add_argument("--no-png", action="store_true")
    args = parser.parse_args(argv)

    paths = sorted(OUTLINES.glob("IMF-*.md"))
    if args.modules:
        wanted = set(args.modules)
        paths = [p for p in paths if p.stem.split("-", 1)[1].rsplit("-", 1)[0] in wanted]
    if not paths:
        print("no outlines matched", file=sys.stderr)
        return 1

    modules = manuscript.parse_all()
    results: list[dict] = []
    total_changed = 0
    for path in paths:
        if args.check:
            meta, root = parse_outline(path)
            nodes = sum(1 for _ in root.walk())
            print(f"{path.name}: {nodes} nodes, ok")
            continue
        result = build_one(path, modules, make_png=not args.no_png)
        results.append(result)
        total_changed += len(result["changed"])
        print(f"{result['stem']}: {result['nodes']} nodes, depth {result['depth']}, "
              f"{len(result['changed'])} file(s) written")
    if not args.check:
        every = sorted(OUTLINES.glob("IMF-*.md"))
        if len(paths) == len(every) and write_index(results):
            total_changed += 1
            print("index.html: rebuilt")
        elif len(paths) != len(every):
            print("index.html not rebuilt: run without module arguments to refresh it")
        print(f"{total_changed} file(s) written in total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
