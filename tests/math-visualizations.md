# Math encyclopedia interaction audit

Audited 17 September 2026 using the actual public GitHub Pages lessons, followed by a local preview of the fixes. The catalog has 19 entries: 17 interactive collections and two static guide/reference entries. Tested desktop (1280 × 900) and narrow phone layouts (390 px and the in-app browser's default width).

## Reproduced failures and repairs

- **Discrete mathematics:** startup dereferenced a removed `#language` anchor, preventing every simulation and generated control from initializing. Language synchronization now supports the shared header and does not require the old anchor.
- **Lebesgue versus Riemann:** URL synchronization dereferenced the missing old language anchor. The first comparison chart rendered, but initialization stopped before the convergence chart. Both language-header links now receive the selected function, partition, band, sequence and index without blocking drawing.
- **Analysis Atlas:** setup dereferenced removed `.skip` and `.brand` elements. Skip navigation now supports the shared header; the optional old brand is guarded.
- **Analysis Atlas language switch:** the shared header went to the Japanese homepage. Both header switches now point to the matching Atlas lesson with current control values and the correct language label.
- **Mobile canvas geometry:** a 320 px minimum height stretched 720 × 420 plots on narrow screens. The four mathematical canvas collections now preserve their intrinsic aspect ratio.
- **Discrete-math contrast:** the shared light theme replaced text colors but left dark panels and controls. Panels, controls, selected states and rule-table cells now follow the same theme.

Changed script and style references are versioned so previously cached assets do not hide the repairs.

## Browser coverage

408 range/select changes and 140 button checks were recorded, plus manual numeric-input, checkbox, animation, iframe and language-switch checks. Each range/select check compared rendered text and SVG markup before/after; canvas-only effects were separately inspected visually. Canvas changes are not inferred from an unchanged text/SVG signature.

- Set theory: presets, set operations, membership, power sets, products, relation matrices, equivalence classes, function/preimage choices, and diagonal bits.
- Discrete mathematics: elementary-rule presets, rule editor, boundaries, seed, generation count, sets/logic/counting controls, Life presets, step/play/pause/clear/edit. Block: four cells after a step. Blinker: three cells after each of two steps. Glider: five cells after four steps.
- Category theory: all five lessons and their parameters, English/Japanese.
- Structure Before Algebra: all category filters and search, English/Japanese.
- Analysis Atlas: all ten experiments, range endpoints and select alternatives; KaTeX reported no parse errors. A changed operator frequency of 20 survived switching from English to Japanese with `#functional/2` retained.
- Lebesgue/Riemann comparison: both functions, sampling choices, refinement/band controls and both convergence examples, English/Japanese. A spike with index 16 survived a language switch. The restored plot and equations were visually inspected.
- Lebesgue Integration Lab: three shapes, resolution, three simple-function heights, and three convergence examples.
- Gamma/Beta: both kernels, presets, all ten worked examples through their final steps, and all four integral templates. Japanese inputs, including invalid endpoint parameters, produced no KaTeX errors.
- Integrating factors: both modes, English/Japanese.
- Differential geometry: all five lessons, English/Japanese.
- Algebraic varieties: both embedded editions, smooth/node/cusp presets and coefficient editing. Node/cusp discriminant readouts equal zero.
- Geometry/mensuration: all seven experiments, English/Japanese.
- Cone dimensions: embedded height controls in both languages; at radius 3 and height 8, slant height 8.54, volume 75.40 and curved area 80.53.
- Jacobians/Wronskians/Hessians: all three modes, English/Japanese.
- Möbius/Schwarzian: both modes and function choices, English/Japanese.
- Counting/probability: all six modes and all four distribution submodels, English/Japanese.
- Scharr gradient: all five presets and pixel editing, English/Japanese.
- Static Lebesgue guide and reference-sheet index: loaded successfully.

No new application console errors appeared during the final local paired-language review. JavaScript syntax checks and `git diff --check` passed.

The pre-existing homepage checker reports unrelated benchmark-atlas filing and AI-art date-markup issues in the upstream baseline; these pages were not changed by this visualization repair.
