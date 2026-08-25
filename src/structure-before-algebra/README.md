# Structure Before Algebra

LaTeX source for *Structure Before Algebra: A complete textbook of solution
technique*, Volume II of the Isegoria mathematics series.

568 pages, 54 chapters, roughly 440 numbered techniques across limits and
series, derivatives, integrals, differential equations, and logic. Every
technique is presented as a recognition cue, a method, a worked example, a
failure mode, and a set of siblings; every chapter closes with a recognition
matrix, and Chapter 53 consolidates those matrices across all five domains.

## Building

```sh
./build.sh
```

Requires XeLaTeX with the TeX Gyre families (Pagella, Pagella Math, Heros).
The build runs XeLaTeX twice, then `makeindex`, then XeLaTeX once more so that
the table of contents, cross-references and the technique index all resolve.

## Layout

- `main.tex` — the master file; the part and chapter order lives here.
- `preamble.tex` — page geometry, palette, fonts, and the technique apparatus
  (`\tech`, `\cue`, `\method`, the `worked`, `trap`, `keynote` and `orient`
  boxes, the TikZ decision-tree styles, and the `recog` matrix environment).
- `frontmatter.tex` — title page, colophon, and the "How to use this book"
  chapter.
- `chapters/` — one file per chapter, `chNN-slug.tex`, each a fragment
  beginning at `\chapter`.

## Editorial standard

Every closed form, limit, derivative, ODE solution, count and probability in
the text was verified numerically or by exhaustive enumeration before being
typeset. Where a source catalogue disagreed with the verification, the
verification won and the correction is silent in the text.

The prose uses no em-dashes or en-dashes as punctuation anywhere. This is
deliberate and is enforced by a check over the source.

Published at <https://isegoria.io/publications/structure-before-algebra/>.
