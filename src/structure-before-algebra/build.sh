#!/usr/bin/env bash
# Build Structure Before Algebra (Volume II of the Isegoria mathematics series).
# Requires XeLaTeX with TeX Gyre Pagella, TeX Gyre Pagella Math and TeX Gyre Heros.
set -euo pipefail
cd "$(dirname "$0")"
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex
makeindex main.idx
xelatex -interaction=nonstopmode main.tex
echo "Built main.pdf ($(pdfinfo main.pdf | awk '/Pages/{print $2}') pages)"
