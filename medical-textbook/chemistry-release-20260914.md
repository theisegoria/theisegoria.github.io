# Bilingual chemistry and full-book reading release — 2026-09-14

This release adds two full paired narration modules, 105-1 and 105-2, and 44 new paired card objectives. It also publishes eight previously local experimental-methods objectives, so the public combined decks move from 202 to 254 notes per language. The full manuscripts now have 105 chapters and 246 modules per language. Fourteen modules have cards; 232 still have none. These counts describe a draft, not curriculum completion.

## Downloads

- [Complete expanded English Markdown](integrated-medical-foundations-expanded-english.md) and [Japanese Markdown](integrated-medical-foundations-expanded-japanese.md).
- [Complete expanded English EPUB](integrated-medical-foundations-expanded-english.epub) and [Japanese EPUB](integrated-medical-foundations-expanded-japanese.epub).
- [English Anki TSV](anki/IMF-en.tsv) and [Japanese Anki TSV](anki/IMF-ja.tsv); [module download manifest](anki/module-downloads.json).
- [Chemistry teaching/source crosswalk](anki/105%20coverage%20and%20sources.md), [curriculum framework](completion-framework.md), and [pre-med coverage ledger](premed/coverage-ledger.md).

## Checks actually performed

The entire previous local English and Japanese manuscripts were preserved as prefixes before adding Chapter 105. All 210 previous local paired note records were preserved; 44 were appended. Public release validation separately checks preservation of previously published note records and that every exported module fingerprint matches the released manuscript. No source-library PDFs are included.

Anki exporter tests passed normally and with Python assertions disabled: six tests in each run. Four module-boundary tests passed. Five new chemistry tests passed, covering amount/concentration/density arithmetic; limiting-reactant and mass conservation; weak-acid approximation and water contribution; buffer, titration and mixing calculations; and new module/card crosswalk structure.

Both full EPUBs have 106 content documents and pass per-block text, word-boundary, navigation-target and XML/ZIP checks. W3C EPUBCheck 5.3.0 reports zero fatal errors, errors, warnings or informational messages for both. [Verification JSON](expanded-epub-verification.json) records the exact book and validator fingerprints. This does not establish actual device rendering or Kindle conversion.

## Work still pending

Scientific and Japanese editorial review remain pending. Timing uses planning estimates, not generated audio. Native Anki packages and real first import/reimport/update tests with scheduling preservation remain required. Kobo rendering, Kindle conversion and delivery remain untested. Broad prerequisite and preclinical content and most module decks still need expansion. Earlier concise reading editions, PDFs and audio are unchanged by this release. No new audio was generated or played.

日本語：定量化学と酸塩基の2モジュールを英日で追加し、既存の本文とカードIDを維持した。EPUBの形式検証と本文一致は確認済みだが、実機表示、Kindle変換、Ankiでの実際の取り込み、独立した内容・翻訳確認は未完了である。教材全体の完成を意味する公開ではない。
