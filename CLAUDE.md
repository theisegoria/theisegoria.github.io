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

The English index has six sections: **Latest**, Guides for students,
Interactive explainers, Preoccupations, Books, Selected software. Each of the
last five is a subject-ordered catalogue with a count in its label. Latest is
the only one ordered by time.

**Interactive explainers** (`id="interactive"`) holds the labs: a mechanism or
device taken apart and made operable in the browser. **Preoccupations** holds
written research, which may carry figures but is read rather than driven. The
split exists because Preoccupations had grown past twenty entries and the two
kinds of page are read for different reasons. A piece that is mostly prose with
one diagram is a Preoccupation; a piece whose point is the thing you can turn
is Interactive.

## The Latest section

It lives between `<!-- LATEST:START -->` and `<!-- LATEST:END -->` on both
index pages, and holds one featured lead plus four dated rows. It is
hand-maintained, so **anything published to the site has to be promoted into
it**, or the site goes on claiming something older is the newest work.

On both index pages the block sits inside `<div class="latest-row">`, the
left of two columns. The right column is `<aside class="gh-activity">`, which
lives outside the markers so `tools/latest.py` never touches it; it is filled
in the browser by `assets/github-activity.js` from the public GitHub API, with
a static link to github.com/theisegoria as the no-JavaScript fallback.

Do not hand-edit the block. Run:

```
python3 tools/latest.py --lang en \
    --url /some-piece/ \
    --title "Some Piece" \
    --desc "One or two sentences on what it is and why it matters." \
    --tail "English / 日本語" --tail PDF
```

**Latest and its actual section, in one command.** The script does both,
because Latest holds only five things and a piece with no permanent home
vanishes from the site once four newer ones push it off. It:

- puts the new entry at the front as the featured lead
- demotes the old lead into the first row, trimming its description to one
  sentence, since rows read better short
- drops whatever falls past the fourth row
- restamps the section date
- files the piece at the top of a catalogue section and bumps that section's
  count label

`--section` chooses the catalogue section, default `preoccupations`, also
`guides`, `books` or `interactive`. `--section-desc` overrides the card's description if the
trimmed sentence does not read well. `--no-section` skips filing, and is only
right for a sub-page whose parent is already filed. `--dry-run` prints the
Latest block without writing. `--date YYYY-MM-DD` overrides today.

Run it once per language. The two indexes are maintained independently
because not every piece has a Japanese edition, and a Japanese reader should
never be dropped into an English page from the Japanese index.

## Check before pushing

```
python3 tools/check-index.py
```

Verifies that every Latest entry is also filed in a catalogue section, that
every count label matches the number of entries beneath it, and that no
internal link is dead. It exits non-zero on failure. Run it after merging
another session's push, which is when count labels drift.

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

## Automatic language routing

`assets/lang.js` sends readers to the Japanese edition when the device time
zone is Asia/Tokyo or the browser lists Japanese ahead of English, and to
English otherwise. It only moves pages that declare a counterpart with
`<link rel="alternate" hreflang>`, never redirects crawlers, and any click on
a language link (`a[hreflang]` or `a[data-language-select]`) is remembered in localStorage and overrides
detection. It must be loaded in `<head>` **without** `defer`, after the
alternate links, so the redirect happens before first paint:

```
<script src="/assets/lang.js"></script>
</head>
```

Every new page with an alternate-language edition needs that tag, and its
language switch link needs a `hreflang` (or `data-language-select`) attribute, otherwise a reader's
choice is not remembered and detection bounces them back.

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
that cites its sources and states what was and was not independently
verified. Do **not** add AI-assistance disclosures, "how this was made"
sections, pipeline write-ups or project plans to any page: Ben answers
provenance questions himself, and the site should read as a person's work,
not as process narration. Removed site-wide on 2026-09-15.

## Shared site navigation

Every HTML entry point uses the generated Isegoria header, breadcrumbs and footer.
The common visual tokens and mobile/theme/language controls live in
`assets/site-shell.css` and `assets/site-shell.js`. Preserve application chart
colours and controls when changing the surrounding site theme.

After adding a page or editing the shell, run:

```
python3 tools/update-library.py
python3 tools/site-shell.py
python3 tools/check-index.py
python3 tools/audit-site.py
```

The generator writes static links, requires no runtime framework, and versions
its CSS/JS by content hash. Do not hand-edit the `ISEGORIA` marker blocks.
The library generator keeps every article and companion page discoverable.

## The library is filtered, and the filter is optional

`library.html` and `ja/library.html` carry a search box and a row of filter
chips above the catalogue. Both are progressive enhancement: the full list is
in the HTML, and `assets/site.js` hides rows only once it loads, so a reader
without JavaScript still gets everything. `tools/update-library.py` writes the
controls, and tags every row with `data-tags` and `data-search`.

Three tags are derived from the page itself rather than declared by hand:
`interactive` when the page ships something the reader can operate (a canvas,
a range input, an app.js, a model-viewer), `pdf` when it links one, and
`bilingual` when it declares an alternate-language edition. If a lab is not
showing up under Interactive, widen the `INTERACTIVE` pattern in that script
rather than tagging the page by hand.

Book chapter pages are deliberately left out of the catalogue: the book's own
contents page lists them, and seven part pages beside it read as clutter.
That exclusion lives in `SUBPAGE` in the same script.

Every catalogue row needs a real `<meta name="description">`, because the card
falls back to "Explore this page" without one. `tools/update-library.py` prints
nothing about this, so check for the placeholder after adding a page.

Separate Pages repositories share the same root assets. Their routes and
metadata live in `tools/project-pages.json`; refresh those entries when adding
a project. Apply `site-shell.py --project PATH --prefix /repository-name/` to
static projects. For Monster's React layout, regenerate `app/site-navigation.tsx`
from `shell()` and update the two shell version URLs before `npm run build:pages`.
Run `audit-site.py --projects PATH` against sibling project checkouts to also
check their HTML and Monster's `dist/client` build. Publish the main site's
shared assets first, then the project pages. Verify the live pages after each
Pages deployment completes.

## Interactive explainers: the lab kit

A 3D or simulation piece ("lab") is scaffolded, never hand-assembled:

```
python3 tools/new-lab.py --slug <slug> --title "..." --desc "..." --title-ja "..." --desc-ja "..."
```

It creates `<slug>/{index.html,lab.js,style.css}` and `ja/<slug>/index.html`
wired to the vendored three.js at `vendor/three/rNNN/` (currently r186; a
new release goes in a sibling directory, the old one stays for pages that
use it) and to `assets/lab-kit/`. `lab-kit.js` owns the renderer
(WebGPURenderer with automatic WebGL 2 fallback, and a static SVG fallback
when there is neither), resize at a capped pixel ratio, pausing when
off-screen or hidden, reduced-motion, theme tokens, context loss and
disposal. A lab's own `lab.js` holds only the scene and the model. Do not
copy a fresh three.js into a piece directory; older pieces that did so are
the reason `vendor/` exists. The `lab-kit` skill has the full workflow.

## Analytics on every page

After adding any HTML entry point or changing `assets/analytics.js`, run:

```
python3 tools/track-pages.py
python3 tools/track-pages.py --check
node --test tests/analytics.test.mjs
```

This adds a deferred, versioned collector without changing custom layouts.
The collector handles PDF links and actual document-language changes, so
custom language controls must set `document.documentElement.lang` when the
language changes. It waits for application initialization before recording
the initial language. Shared-shell loading is a compatibility fallback for
separate project repositories; repeated script execution is guarded.
Tests intercept collection locally. Never send synthetic events to production.
