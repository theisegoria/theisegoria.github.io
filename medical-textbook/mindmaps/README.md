# Module mindmaps

One mindmap per TTS module per language. The Markdown outline in `Outlines/` is the only thing written by
hand; everything else is built from it by `build_mindmaps.py`.

## The outline format

YAML front matter, then headings and nothing else. Heading depth is node depth: `#` is the root, `##` its
branches, down to `#####`. A non-heading line is a build error, and so is a depth that jumps by more than
one, because either would mean the file no longer says what the picture shows.

```
---
module: 006-01
language: en
chapter: 6
title: "Clinical Reasoning, History, Examination, and Diagnostic Probability"
module_title: "Foundations"
source_sha256: <digest of the module at authoring time>
---

# Root label

## Branch
### Node
```

`source_sha256` records the state of the manuscript module the outline was written against, using the same
recipe as the Anki exporter. When a module's text is revised, its digest changes and the outline should be
reread before the map is trusted.

## Build

```
python3 build_mindmaps.py            # everything, and rebuild index.html
python3 build_mindmaps.py 006-01     # one module, both languages
python3 build_mindmaps.py --check    # parse and validate only
python3 build_mindmaps.py --no-png   # skip rsvg-convert
```

Outputs are `pdf/`, `png/`, `svg/`, `opml/` and `index.html`, which lists them. PDF and PNG need
`rsvg-convert` from librsvg; without it the SVG and OPML are still produced. `../tools/build_packs.py`
then bundles each module's mindmap with its text and its Anki files into `../packs/`.

## Why the renderer is hand-written

These are files to download and keep, not pages to read on the site, so the renderer has to produce print
and app formats from one geometry rather than a browser widget. A markmap bundle would have given the
browser view and nothing else. The layout follows the shape a mindmap tool would give: a central root,
branches balanced across both sides by leaf count, curved links, depth-coloured nodes. Colours are written
as literal values rather than CSS custom properties, because `rsvg-convert` does not resolve `var()` and
renders an unresolved fill as black. The SVG still carries a dark-scheme block, so it reads correctly if
someone opens it in a browser.

## The colour scheme, and why it is arranged this way

Colour here is doing one job: telling you which branch a node belongs to. Every top-level branch takes its
own hue, and everything hanging off it inherits that hue, so a node's category is legible from the colour
alone before any of the text is read. Depth is carried by fill and weight instead: a branch head is a filled
box with a firm border, a second-level node a paler fill with a soft border, and the leaves are coloured text
with no box at all. Hue and depth never compete for the same channel, which is the mistake that makes most
generated mindmaps hard to read.

That split is the pedagogically useful one. The work a mindmap does is chunking, and a learner recalls the
branch before the leaf. Giving each branch a stable colour gives every fact a second retrieval cue beyond
its position, and keeps the cue consistent between the printed PDF, the PNG in a slide, and the copy opened
in MindNode. Varying hue with depth instead would colour-code something the eye already reads from position
and indentation, and would leave branch membership unmarked.

The hues are the Okabe-Ito colour-blind-safe set, which stays distinguishable under deuteranopia,
protanopia and tritanopia. Its pale yellow is replaced by a dark gold, which the original cannot do because
it will not hold a border or text against a light page, and four further hues are added so a map with ten
branches never has to reuse one. Beyond eleven branches a hue returns at a shifted lightness rather than
identically.

Legibility is enforced rather than assumed. Every text colour is derived from its branch hue and then
darkened, or lightened on the dark page, until it clears WCAG AA at 4.5:1 against the background; borders
are pushed to at least 2.4:1 so a pale hue reads as a category and not as an unfinished box. The root is
deliberately neutral, near-black on paper, so it anchors the map without competing with the branches for
attention. Both schemes are generated, so the same map is readable on a white page and on a dark screen.

## Scope

Four modules of 246 are drawn. A mindmap is a revision aid built from the module, not a substitute for
reading it, and neither the maps nor their Japanese wording have had independent review.
