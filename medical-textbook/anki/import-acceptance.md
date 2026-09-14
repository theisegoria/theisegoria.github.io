# Anki import acceptance — English / 日本語

Status: NOT EXECUTED. This document is a test protocol, not evidence that imports work. No Anki app was found at `/Applications/Anki.app` on 2026-09-13; other installation locations have not been excluded. Do not use the personal collection for these tests. Do not enable syncing in the disposable test profile.

状態：未実施。この文書は試験手順であり、取り込み成功の証拠ではない。普段使うコレクションでは試験しない。試験用の一時プロファイルでは同期を有効にしない。

## Fixed setup / 固定する設定

Create one custom note type with fields in this order: ID, Front, Back, Source. Use one card template, not automatic reverse cards. Front: `{{Front}}`. Back: `{{FrontSide}}<hr id=answer>{{Back}}<br>{{Source}}`. Map TSV column five to Tags, not an extra text field. Use separate English and Japanese decks with the same note type; IDs include a language suffix. Record the Anki version and actual import options rather than assuming UI labels are unchanged.

フィールド順はID、Front、Back、Source。カードテンプレートは一つとし、裏表を自動で逆転したカードは作らない。TSVの第5列はタグに対応させる。英語と日本語は同じノートタイプを使い、デッキは分ける。IDには言語の接尾辞が付く。Ankiの版と実際の取り込み設定を記録する。

## Acceptance cases / 合格条件

1. Import module 101-1 EN and JA: expect 16 notes and 16 cards in each language for this release. Inspect Japanese text, punctuation, source text and tags. No ID should appear as the question.
2. Import the same two files again using existing-note update matching: expect zero additional notes/cards. Record the result screen.
3. Import combined EN and JA files: expect 254 notes per language, not 270. This checks module-to-combined deduplication with unchanged IDs. The two chemistry module files each contain 22 notes per language, also already included in the combined total.
4. Repeat in a fresh disposable profile with combined files first, then module files. Expect the same final totals.
5. Review one test card. Record its card ID, due value, interval, repetitions and review-history count. Edit only its answer in a temporary input copy, preserving ID. Reimport. The answer must change while card identity and scheduling/history remain unchanged. Do not edit the canonical source for this test.
6. Confirm the corresponding card in the other language is unchanged by the single-language update.
7. Export a backup of the disposable collection only if needed as acceptance evidence. Never publish a personal collection or profile data.

日本語の確認点：同じファイルの再取り込みでカードが増えないこと。モジュール版と全体版をどちらの順で取り込んでも合計が一致すること。IDを維持して解答だけを更新した場合、カードの同一性、復習予定、履歴が変わらないこと。英語だけの更新で日本語のカードが変わらないこと。

## Evidence record

For each case record date, Anki version, input SHA-256, note-type fields, matching/update options, counts before and after, observed result and screenshot or exported diagnostic evidence. Mark failures explicitly. A TSV parser or a simulated database upsert is not a substitute for these application tests. APKG delivery requires its own import/update run; this protocol does not approve an untested package.
