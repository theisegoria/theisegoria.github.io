#!/usr/bin/env python3
"""Release checks for the Integrated Medical Foundations card source.

Run both of these; validation must stay active with assertions disabled:

    python3 -m unittest test_build_decks.py
    python3 -O -m unittest test_build_decks.py

These tests check the exporter and the source's internal consistency. They are
not evidence that Anki imports the exported files, and not evidence that any
card is scientifically or linguistically correct. See `import-acceptance.md`.
"""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "tools"))

import build_decks  # noqa: E402
import imf_manuscript as manuscript  # noqa: E402


def sample_card(**overrides) -> dict:
    card = {
        "id": "IMF-001-01-0001",
        "chapter": 1,
        "module": 1,
        "en_front": "What does negative feedback do to a disturbance?",
        "en_back": "It opposes the disturbance and stabilises the variable.",
        "ja_front": "負のフィードバックは外乱に対して何をするか。",
        "ja_back": "外乱に対抗し、調節される変数を安定させる。",
    }
    card.update(overrides)
    return card


class ManuscriptStructure(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules = manuscript.parse_all()

    def test_both_languages_parse(self) -> None:
        for language in manuscript.LANGUAGES:
            self.assertGreater(len(self.modules[language]), 0)

    def test_module_sets_are_identical(self) -> None:
        self.assertEqual(set(self.modules["en"]), set(self.modules["ja"]))

    def test_modules_exclude_chapter_tail_sections(self) -> None:
        for language in manuscript.LANGUAGES:
            tails = manuscript.CHAPTER_TAIL_HEADINGS[language]
            for key, module in self.modules[language].items():
                for heading in tails:
                    self.assertNotIn(
                        "\n" + heading, module.text,
                        msg=f"{language} {key} swallowed {heading!r}",
                    )

    def test_module_text_starts_with_its_own_heading(self) -> None:
        for language in manuscript.LANGUAGES:
            for key, module in self.modules[language].items():
                first = module.text.split("\n", 1)[0]
                self.assertTrue(
                    manuscript.MODULE_RE[language].match(first),
                    msg=f"{language} {key} does not start at its heading",
                )

    def test_digests_are_distinct_per_module(self) -> None:
        for language in manuscript.LANGUAGES:
            digests = {m.sha256 for m in self.modules[language].values()}
            self.assertEqual(len(digests), len(self.modules[language]))

    def test_no_module_is_trivially_short(self) -> None:
        for language in manuscript.LANGUAGES:
            for key, module in self.modules[language].items():
                self.assertGreater(len(module.text), 400, msg=f"{language} {key}")


class Validation(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules = manuscript.parse_all()

    def assert_rejected(self, cards, fragment: str) -> None:
        with self.assertRaises(build_decks.ValidationError) as caught:
            build_decks.validate_cards(cards, self.modules)
        self.assertIn(fragment, str(caught.exception))

    def test_accepts_a_well_formed_card(self) -> None:
        build_decks.validate_cards([sample_card()], self.modules)

    def test_rejects_empty_source(self) -> None:
        self.assert_rejected([], "empty")

    def test_rejects_missing_field(self) -> None:
        card = sample_card()
        del card["ja_back"]
        self.assert_rejected([card], "missing field")

    def test_rejects_duplicate_id(self) -> None:
        self.assert_rejected([sample_card(), sample_card()], "duplicate id")

    def test_rejects_id_that_disagrees_with_chapter(self) -> None:
        self.assert_rejected([sample_card(chapter=2)], "does not match")

    def test_rejects_unknown_module(self) -> None:
        card = sample_card(id="IMF-001-09-0001", module=9)
        self.assert_rejected([card], "absent from")

    def test_rejects_tab_in_a_field(self) -> None:
        self.assert_rejected([sample_card(en_back="a\tb")], "tab or newline")

    def test_rejects_newline_in_a_field(self) -> None:
        self.assert_rejected([sample_card(en_back="a\nb")], "tab or newline")

    def test_rejects_untrimmed_field(self) -> None:
        self.assert_rejected([sample_card(en_front=" padded? ")], "whitespace")

    def test_rejects_html_tag(self) -> None:
        self.assert_rejected(
            [sample_card(en_back="It opposes the disturbance.</div>")], "HTML tag"
        )

    def test_rejects_orphaned_closing_tag_in_japanese(self) -> None:
        self.assert_rejected([sample_card(ja_back="外乱に対抗する。</b>")], "HTML tag")

    def test_rejects_japanese_field_without_japanese(self) -> None:
        self.assert_rejected(
            [sample_card(ja_front="What does negative feedback do?")],
            "no Japanese text",
        )

    def test_rejects_english_field_containing_japanese(self) -> None:
        self.assert_rejected([sample_card(en_front="外乱とは何か?")], "contains Japanese")

    def test_rejects_unknown_review_state(self) -> None:
        self.assert_rejected([sample_card(review="approved")], "unknown review state")

    def test_rejects_non_contiguous_sequence(self) -> None:
        cards = [sample_card(), sample_card(id="IMF-001-01-0003")]
        self.assert_rejected(cards, "not contiguous")

    def test_rejects_out_of_order_records(self) -> None:
        cards = [sample_card(id="IMF-001-01-0002"), sample_card(id="IMF-001-01-0001")]
        self.assert_rejected(cards, "sequence order")

    def test_validation_survives_assertion_removal(self) -> None:
        """The -O run exercises this: a bare assert would be compiled out."""
        card = sample_card()
        del card["en_front"]
        self.assert_rejected([card], "missing field")


class Export(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.modules = manuscript.parse_all()
        cls.cards = build_decks.load_cards()

    def test_live_source_validates(self) -> None:
        build_decks.validate_cards(self.cards, self.modules)

    def test_rows_carry_five_columns(self) -> None:
        rows = build_decks.rows_for_language(
            [sample_card()], "en", self.modules["en"]
        )
        self.assertEqual(len(rows[0]), 5)
        self.assertEqual(rows[0][0], "IMF-001-01-0001-en")

    def test_tsv_header_is_exact(self) -> None:
        text = build_decks.render_tsv(
            build_decks.rows_for_language([sample_card()], "en", self.modules["en"])
        )
        self.assertEqual(
            text.split("\n")[:3],
            ["#separator:Tab", "#html:false", "#tags column:5"],
        )
        self.assertTrue(text.endswith("\n"))

    def test_source_field_names_the_module_digest(self) -> None:
        module = self.modules["en"]["001-01"]
        field = manuscript.source_field(module)
        self.assertIn(module.sha256, field)
        self.assertIn("chapter 1, TTS module 1", field)

    def test_tags_field_shape(self) -> None:
        module = self.modules["ja"]["001-01"]
        self.assertEqual(
            manuscript.tags_field(module),
            "imf lang::ja chapter::001 module::001-01 review::pending",
        )

    def test_card_digest_changes_with_content(self) -> None:
        first = build_decks.rows_for_language(
            [sample_card()], "en", self.modules["en"]
        )[0]
        altered = copy.deepcopy(sample_card())
        altered["en_back"] = "Something else entirely."
        second = build_decks.rows_for_language(
            [altered], "en", self.modules["en"]
        )[0]
        self.assertNotEqual(
            build_decks.card_digest(first), build_decks.card_digest(second)
        )

    def test_every_carded_module_exists_in_both_manuscripts(self) -> None:
        for card in self.cards:
            key = manuscript.module_id(card["chapter"], card["module"])
            self.assertIn(key, self.modules["en"])
            self.assertIn(key, self.modules["ja"])


if __name__ == "__main__":
    unittest.main()
