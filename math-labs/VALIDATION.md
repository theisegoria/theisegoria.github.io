# Release validation · 19 September 2026

- Eight topics; sixteen language routes; twenty-six experiments.
- 44 mathematical/content checks passed using `node math-labs/verify.cjs`.
- Browser: all sixteen routes at 375 px and 1280 px; 32 page/viewport combinations, 104 experiment-control checks. The rebuilt experiments use the shared semantic SVG 2D surface with responsive transforms and reduced-motion CSS. No page errors, failed assets, non-finite SVG paths, missing rendered formulas, or document-level horizontal overflow.
- All 26 local reset controls restored the initial readout. Pointer dragging changed the first basis coordinate from 1 to 1.6. Singular-matrix state was checked explicitly.
- English-to-Japanese navigation preserved `basis.a=1.7` and `#basis`.
- Desktop/phone screenshots were reviewed, with graph-width, tick-label, legend, and stacked-symmetry refinements incorporated. Long mathematical expressions scroll locally on phones.
- Site navigation audit: none of the sixteen new routes has a missing asset, broken internal link, missing shared header, or reachability problem. The full-site audit retains unrelated pre-existing issues in model-benchmark-atlas, uni-writing-lab, uninstantiated lab templates, and two existing Japanese algebraic-varieties routes.

Live deployment verification is recorded separately after the Pages build completes.
