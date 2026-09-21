# Apple silicon atlas: evidence and model boundaries

Verified 2026-09-19. The 20-row catalogue covers the announced M1–M6 SoCs, including Pro, Max and Ultra where announced. It is not an inventory of every binned configuration, current stock, or older motion coprocessors. `data.js` contains the bilingual content and primary-source URLs.

- CPU/GPU/Neural Engine counts and memory numbers are published family maxima. Memory is the historical advertised ceiling. M3 Ultra's launch ceiling was 512 GB; later sales configurations can differ. M1 bandwidth remains null because the cited original announcement does not give an exact value.
- Architecture views are functional top-down schematics. No measured die areas, block placements, cache topology or physical wire routes are claimed. Memory is external to the logic die. M5 Pro/Max's two-die architecture and M5 Ultra's four-die structure are shown separately from the aggregate functional blocks; resource placement within those dies is not inferred.
- Small squares count cores. A CPU core, GPU core and Neural Engine core are different units. GPU Neural Accelerators on M5/M6 are not extra GPU cores or the separate Neural Engine.
- CPU P/E/S naming follows launch terminology; base M5 uses the original performance-core name, later called super cores by Apple.
- Comparison bars encode specifications only. No synthetic overall score or inferred benchmark is supplied.
- Memory experiment: weight GB = parameters in billions × bits / 8. Reserve is explicit and user-adjustable. GB is decimal. Historical chip ceiling is not installed RAM, framework allocation capacity or available memory. For a fitting dense batch-one model, bandwidth/weight-size is a weight-streaming ceiling, omitting compute, cache/attention traffic, scheduling, quantization metadata and other overhead. No estimate is presented for a model that exceeds the capacity budget. MoE and batching require different accounting.
- Parallelism experiment: speedup = 1 / (s + (1-s)/N), with hypothetical equal workers. It is not a heterogeneous Apple CPU predictor.
- English/Japanese pages share interaction logic and source data; selections, experiment settings and the fragment survive language switches..
- PDF editions contain 26 pages each, including all 20 architecture plates. Fonts are embedded; pages were rendered and visually inspected.

Detailed topology adds six functional views with per-block sources, zoom, expanded viewing and data-path steps. Firestorm-specific pipeline/port counts are independently measured M1 P-core results, not official Apple disclosures or values for later CPUs. Three original Apple Newsroom package illustrations are included with source links and Apple attribution. Source images were not modified.
