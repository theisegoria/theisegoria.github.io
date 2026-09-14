# Full expanded reading editions — draft status

The expanded English and Japanese EPUBs each contain the complete corresponding current Markdown master, not selected sample chapters. The 2026-09-14 chemistry batch contains 105 chapters and 246 explicit TTS modules per language; each EPUB has 106 content documents including front matter. Existing concise EPUBs/PDFs remain separate earlier editions and are not silently replaced.

The builder checks text per block, including word boundaries, and all generated navigation targets, XML and ZIP integrity. Optional `--epubcheck-jar PATH --java PATH` additionally runs the official EPUBCheck validator and records its exact JAR fingerprint and messages against each EPUB fingerprint in `Expanded EPUB verification.json`. The release uses W3C EPUBCheck 5.3.0, obtained from its official repository. Check that the reported EPUB hash matches the downloaded file before relying on that evidence.

EPUB conformance does not prove every reading-system behaviour. Kobo rendering, Japanese typography on actual readers and Kindle conversion/delivery remain untested. Use these as reflowable EPUB drafts intended for those workflows, not as device-certified files or native AZW/KFX downloads. Scientific and translation review, full curriculum coverage and voice-calibrated narration lengths also remain unfinished. The text is educational study material, not clinical instructions.

The Markdown contains plain-text narration; source/coverage tables live in companion documents and are not appended to narration. Headings become EPUB headings and navigation entries. No diagrams, new PDFs, audio playback or ElevenLabs credit use is part of this release.

日本語版も、現在の対応するMarkdown本文全体を含む拡張草稿である。EPUBの形式検証、本文一致、目次リンクの確認と、Koboの実機表示やKindle変換の確認は別の作業であり、後者は未実施である。内容、翻訳、カリキュラム全体の完成度についても未完了の確認事項が残る。
