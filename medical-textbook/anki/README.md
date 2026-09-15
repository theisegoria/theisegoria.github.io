# Integrated Medical Foundations — bilingual Anki

Priority: bring English and Japanese retrieval cards into parity with every canonical chapter/TTS module while the textbook continues expanding. Existing prose remains unchanged.

## Deliverables and identifiers

`cards.json` is the editable paired source. One record represents one learning objective, with separate English and Japanese question/answer fields. Stable IDs must not be renumbered after release. Cards are deliberately not automatically reversed: a reverse question often tests a different or ambiguous fact.

`build_decks.py` validates paired fields and module membership, then exports UTF-8 tab-separated imports, a complete module coverage ledger, the download manifest, per-note provenance, and native APKG packages under `Packages/`. Module boundaries and content digests come from `../tools/imf_manuscript.py`, which documents the slicing recipe; the packages need `genanki`, and the TSV exports are produced without it. Each import uses an ID-first custom note type with fields ID, Front, Back, Source. Front template: `{{Front}}`; back template: `{{FrontSide}}<hr id=answer>{{Back}}<br>{{Source}}`. Map the fifth column to Tags. Import English and Japanese into separate decks. Keep ID as the first matching field when updating existing notes; test a repeat import on a disposable Anki profile before using a personal collection. TSV export validation is not proof of Anki application import or scheduling preservation.

## Content quality and completion

Each module needs cards for its substantive learning objectives, not a fixed quota: mechanisms, anatomy/localisation, pathology, discriminating findings, calculations where appropriate, and common reasoning errors. Keep answers focused; split multi-part lists. Use short clinical vignettes after prerequisite cards. Avoid patient-specific prescribing. Track source modules and review changed text before updating cards. Semantic bilingual review and actual Anki import tests remain required.

Local source snapshot, 2026-09-15: 326 paired objectives across 18 populated modules, adding chapters 6 and 7 as 06-1 (24), 06-2 (12), 07-1 (24) and 07-2 (12). These are 326 English plus 326 Japanese notes. The coverage ledger inventories 246 modules; 228 still have no cards. No claim of whole-module or curriculum completeness is made. See `105 coverage and sources.md` for the chemistry teaching and source crosswalk and its limitations. Local exports may be ahead of public downloads.

## Release checks

Run `python3 -m unittest test_build_decks.py` and `python3 -O -m unittest test_build_decks.py` from this directory, then `python3 build_decks.py`. Validation must remain active when Python assertions are disabled. Source fingerprints describe the manuscript used at export, not independent scientific approval. See `Import acceptance.md` for the separate application checks, which remain pending.

## Provenance, rebuilt 2026-09-15

The exporter documented in earlier versions of this file was not present in the repository, and could not
be recovered from history. The `module SHA256 at export` values it had written match no contiguous slice
of either published manuscript under any normalisation tested, so they could not be reproduced and cannot
be checked. `build_decks.py` has been rewritten with an explicit, documented recipe (see the module
docstring of `../tools/imf_manuscript.py`) and every fingerprint restamped from the current masters.
Earlier fingerprints should be treated as unverifiable rather than as evidence of anything.

Restamping changed the Source field of all 254 previously released notes while leaving every question,
answer and ID untouched. An ID-matched reimport therefore updates Source and preserves scheduling, but
that behaviour is part of what `import-acceptance.md` still has to test.
