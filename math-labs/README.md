# Eight mathematics entries

Eight paired English/Japanese entries with 26 original interactive experiments. Static pages use the site's shared navigation and vendored KaTeX. No runtime network requests or external application dependencies are needed for the experiments.

## Rebuild

From the repository root:

```
python3 math-labs/build.py
python3 math-labs/integrate.py
python3 tools/update-library.py
node math-labs/verify.cjs
```

The generator owns only these sixteen pages and its structured content. Integration appends eight curated records, updates the encyclopedia/homepage lists and sitemap, and applies the existing shared shell only to the new lessons. Latest-work promotion uses the site's existing `tools/latest.py` separately.

## Mathematical scope

- Linear algebra: invertible/singular real 2×2 matrices, area and rank, a real symmetric eigenproblem, orthogonal projection, and SVD constructed from two rotations and nonnegative diagonal scales. Circle samples illustrate input rotation; rank-one error uses the exact discarded singular value. Basis vectors support pointer dragging and keyboard sliders.
- Fourier: analytic square-wave partial sums, exact overlap of symmetric unit pulses, and sinusoidal aliasing. Finite plotted samples do not prove convergence.
- Dynamics: analytic spiral solutions, saddle-node equilibria, and finite logistic-map iterates. Bifurcation scatter discards 210 iterates and shows the final 30 at each sampled parameter. It is an illustration, not a chaos certificate.
- Optimization: exact quadratic contours and recurrences, equality-constrained minimum, exact dual function and sensitivity with the stated Lagrangian sign convention.
- Probability: integer-parameter beta densities evaluated using log-factorials, exact binomial probabilities on a standardized density scale, and exact rectangular event probabilities. The central-limit illustration is deterministic, not Monte Carlo.
- Groups: dihedral vertex permutations, cyclic multiplication table, generated rotation subgroup orbits/cosets. Polygon vertex labels distinguish equal outlines from equal transformations.
- Topology: boundary ranks over F₂. Displayed Vietoris–Rips two-skeleton suffices for H₀/H₁. The tetrahedron is its boundary surface; no interior 3-simplex is included.
- Numerics: explicit Euler and classical RK4 stability polynomial for y′=−5y, native binary64 cancellation, barycentric polynomial interpolation on equally spaced and Chebyshev–Lobatto nodes. Error maxima are sampled. The final ODE step is shortened to reach t=2.

## Sources and provenance

Every experiment cites its reference in both editions; `content.json` records the links. References include MIT OCW linear algebra and nonlinear dynamics, Stanford EE261, Boyd and Vandenberghe, Brown Seeing Theory, Judson, Hatcher, Lebl, Goldberg, and Chebfun. Explanations, diagrams, and implementation are original; no textbook prose or images are copied. Japanese text is labeled as AI translation. Existing vendored KaTeX retains its license and fonts in `/analysis-atlas/vendor/`.

## Validation

`verify.cjs` checks 44 numerical/content properties, including homology ranks, beta normalization and means, logistic bounds and convergence, RK4 refinement, Euler instability, and interpolation-node agreement. Browser review exercises all 26 experiments in both languages at 375 and 1280 CSS pixels, checks KaTeX rendering and page overflow, and checks state-preserving language navigation. Release notes distinguish these local checks from live deployment verification.
