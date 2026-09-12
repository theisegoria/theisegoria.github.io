# Integrated Medical Foundations — bilingual Anki

Priority: bring English and Japanese retrieval cards into parity with every canonical chapter/TTS module while the textbook continues expanding. Existing prose remains unchanged.

## Deliverables and identifiers

`cards.json` is the editable paired source. One record represents one learning objective, with separate English and Japanese question/answer fields. Stable IDs must not be renumbered after release. Cards are deliberately not automatically reversed: a reverse question often tests a different or ambiguous fact.

`build_decks.py` validates paired fields and module membership, then exports UTF-8 tab-separated imports and a complete module coverage ledger. Each import uses an ID-first custom note type with fields ID, Front, Back, Source. Front template: `{{Front}}`; back template: `{{FrontSide}}<hr id=answer>{{Back}}<br>{{Source}}`. Map the fifth column to Tags. Import English and Japanese into separate decks. Keep ID as the first matching field when updating existing notes; test a repeat import on a disposable Anki profile before using a personal collection. TSV export validation is not proof of Anki application import or scheduling preservation.

## Content quality and completion

Each module needs cards for its substantive learning objectives, not a fixed quota: mechanisms, anatomy/localisation, pathology, discriminating findings, calculations where appropriate, and common reasoning errors. Keep answers focused; split multi-part lists. Use short clinical vignettes after prerequisite cards. Avoid patient-specific prescribing. Track source modules and review changed text before updating cards. Semantic bilingual review and actual Anki import tests remain required.

Local source snapshot, 2026-09-13: 182 paired objectives across 11 populated modules, including 16 in module 101-1. No claim of whole-module or curriculum completeness is made. The coverage ledger inventories 244 modules, including those with zero cards. GAMSAT/MCAT prerequisites now take priority while existing clinical material is preserved. Local exports may be ahead of public downloads. Publish downloadable packages only after package/import QA; retain editable source alongside them.

## Release checks

Run `python3 -m unittest test_build_decks.py` and `python3 -O -m unittest test_build_decks.py` from this directory, then `python3 build_decks.py`. Validation must remain active when Python assertions are disabled. Source fingerprints describe the manuscript used at export, not independent scientific approval. See `Import acceptance.md` for the separate application checks, which remain pending.
