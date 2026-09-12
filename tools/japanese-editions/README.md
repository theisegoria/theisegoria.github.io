# Japanese editions · 13 September 2026

The site contains 58 Japanese HTML pages. This release adds 33 editions,
including seven counterparts of pages published from separate GitHub projects.
Every English HTML page in the root repository has a Japanese counterpart.
`manifest.json` records the paired routes and Japanese file hashes for this release.

New prose was drafted with a local Qwen3 translation model and then checked for
coverage, links, retained anchors, protected mathematical notation, numeric
changes, and scientific terminology. Selected technical passages and the geometry
lab explanations were revised manually. This is not a claim of expert or native
speaker review of every passage. New pages disclose AI translation and link to
their English originals. Original-language PDF downloads are labelled accordingly;
source screenshots and cover images remain original-language artifacts.

## Updating an edition

Static Japanese HTML, JavaScript and SVG files are editable directly at their
published paths. Preserve element IDs, control values, formulas, numerical data,
module imports, and links to shared models when translating labels. English pages
under separate project repositories link to their counterparts under `/ja/` on
the root site.

The three patches here preserve the Japanese changes to the editable React
applications. Apply a patch to a copy of the corresponding English source project,
using `git apply --check` first. They are translation overlays, not complete
application scaffolds; use the original project's package manifest, lockfile,
assets and unchanged source files. Carrera uses its `vite.pages.config.ts` with
base `/carrera-panda/`; Neuron uses `vite.static.config.ts` with base
`/neuron-action-potential/`. Monster's patch includes a static Japanese entry point
and `vite.japanese.config.ts`, with base `/ja/monster-tech-correlation/`.
Publish Carrera/Neuron output assets alongside their English bundles and update
only the Japanese entry HTML to use the new hashes. Preserve shared model assets.

For changes to navigation or content listings, run:

```sh
python3 tools/update-library.py
python3 tools/site-shell.py
python3 tools/check-index.py
python3 tools/check-translations.py
python3 tools/audit-site.py --projects ../site-unification-projects
```

Apply the shared shell separately to the external project repositories. The
language router must follow the alternate metadata in the document head, and
both the header switch and automatic routing preserve query settings and fragments.

Release checks passed: three production app builds; parsing of 40 JavaScript
sources including embedded diagrams; 21 matching English/Japanese geometry
calculation scenarios and 42 generated diagrams; six language-routing scenarios;
and a 116-page navigation audit with 1,921 local links and 658 assets, without
missing targets or unreachable pages. Browser visual testing was not performed.
Two translated scientific SVGs were rendered and inspected, including correction
of logarithmic-axis labels. The new circuit figure was redrawn in Japanese.
