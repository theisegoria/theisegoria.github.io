# theisegoria.github.io

A static site. No build step: what is committed is what is served. Edit the
HTML directly, commit, push, and GitHub Pages publishes it.

## Layout

```
index.html            English index
ja/index.html         Japanese index
assets/isegoria.css   The whole site's stylesheet
sitemap.xml           Flat list of every public URL
tools/                Maintenance scripts (see below)
<piece>/index.html    One directory per piece, English
ja/<piece>/index.html Its Japanese edition, where one exists
```

The English index has five sections: **Latest**, Guides for students,
Preoccupations, Books, Selected software. Each of the last four is a
subject-ordered catalogue with a count in its label. Latest is the only
one ordered by time.

## The Latest section

It lives between `<!-- LATEST:START -->` and `<!-- LATEST:END -->` on both
index pages, and holds one featured lead plus four dated rows. It is
hand-maintained, so **anything published to the site has to be promoted into
it**, or the site goes on claiming something older is the newest work.

Do not hand-edit the block. Run:

```
python3 tools/latest.py --lang en \
    --url /some-piece/ \
    --title "Some Piece" \
    --desc "One or two sentences on what it is and why it matters." \
    --tail "English / 日本語" --tail PDF
```

The script puts the new entry at the front, demotes the old lead into the
first row (trimming its description to one sentence, since rows read better
short), drops whatever falls past the fourth row, and restamps the section
date. `--dry-run` prints the block without writing. `--date YYYY-MM-DD`
overrides today.

Run it once per language. The two indexes are maintained independently
because not every piece has a Japanese edition, and a Japanese reader should
never be dropped into an English page from the Japanese index.

Falling off the Latest list is not a problem **provided the piece also has a
permanent home** in Preoccupations, Books or Guides. Add it there in the same
change, and update that section's count label.

## The stylesheet is cache-busted

Every page links the stylesheet as `assets/isegoria.css?v=YYYYMMDD`.
Browsers hold the old file otherwise, and a style change then lands on the
server while returning readers see the page rendered against a stylesheet
that has no rules for it. After **any** edit to `assets/isegoria.css`:

```
python3 tools/bump-css.py
```

and commit the stamped pages alongside the stylesheet.

## Bilingual convention

A piece published in both languages needs, on both editions:

- `<link rel="alternate" hreflang="en|ja|x-default">` pointing at each other
- a language switch in the page nav
- an entry in `sitemap.xml` for each URL
- the Japanese edition written in である調, not です・ます調

Japanese pages use `--f-display: "Hiragino Mincho ProN"` and set
`line-height` around 1.85. Long-form Japanese in LaTeX needs
`\XeTeXlinebreaklocale "ja"`, otherwise nothing wraps.

## Other sessions push here

Several Claude sessions work on this repo concurrently. Always
`git fetch origin && git merge origin/main` before touching `index.html`,
`ja/index.html` or `sitemap.xml`; those are the three files that collide.
Merge, never force-push. After a merge, recheck the section count labels,
which are the thing that silently goes wrong.

From a Cowork session the device shell cannot reach GitHub (the proxy
returns 403). Desktop Commander runs natively on macOS and can push.

## House style

No em-dashes in prose. Use a comma, a colon, or a full stop.
Figures are hand-authored SVG using the stylesheet's theme tokens, so they
work in both light and dark. Every long-form piece carries a Sources block
that discloses AI assistance and states what was and was not independently
verified.
