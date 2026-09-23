# Scheduled encyclopedia additions (Wed + Sat)

Each run adds ONE mathematics topic and ONE physics topic to the Math
encyclopedia, in English and Japanese, each with three interactive
experiments, and pushes them live if every gate passes. Read `KIT.md` first:
it is the authority on the kit API, colour tokens, writing rules and the
design bar. This file only adds the procedure.

Repo: `~/DailyWork/Research/site`. Run shell commands on the Mac through
Desktop Commander (zsh; PATH is already set via ~/.zshenv).

## 0. Preflight

1. `cd ~/DailyWork/Research/site`. If `.git/index.lock` exists and `ps aux | grep -c '[g]it '` is 0, remove it.
2. `git fetch origin && git status --short`. Other sessions push here. Merge `origin/main` fast-forward (`git merge --ff-only origin/main`). If the working tree has modified tracked files you did not make, do not touch or commit them; note them in the report. Untracked files (`.stage-*.css`, `kuru-toga/`, etc.) are never yours to add.
3. `node math-labs/verify.cjs` must pass before you start. If it does not, stop and report.

## 1. Pick the topics

`math-labs/queue.json` has two lists, `math` and `physics`. Take the first entry
with `"status": "queued"` from each. Skip (and mark `"status": "skipped", "note": "already exists"`) any whose slug is already in `math-labs/content.json`.
The `labs` field holds starting ideas. Keep them if they are good; replace any
that would be decorative rather than mechanistic. `prereq` and `cross` slugs that
do not exist yet in content.json are simply left out of graph.js.

## 2. Files to write, per topic (slug = S, next number NNN = 1 + highest existing prefix in additions/)

1. `math-labs/additions/NNN-S.py`: exactly one `add_expansion(...)` call in the
   same shape as `batch-six.py` (read it for the argument order: slug, titles,
   descriptions, group, prerequisite text en/ja, source name, source url, then
   three `L(...)` entries). Every lab has body, formula (KaTeX), worked example,
   caution, question and answer, all in both languages, and `p(...)` params.
   Source: a real, reputable, currently reachable reference (lecture notes,
   OCW, a standard textbook site). Check the URL resolves with curl.
2. `math-labs/topics/S.js`: registers `window.LabDefs[<lab-id>]` for the three
   labs AND exports the pure mathematics as `window.LabModels['S'] = {...}`
   (no DOM in models). Read `topics/lie-groups.js` and
   `topics/hamiltonian-mechanics.js` first as the house pattern for new topics.
3. `math-labs/checks/S.cjs`: `module.exports = (M, {ok, near, values}) => {...}`
   with at least 4 (aim for 6+) checks of the models against known closed forms,
   limits, conservation laws or published values (e.g. Wigner semicircle second
   moment, Hasse bound, Gauss–Bonnet angle defect). A check must be able to fail.
4. `math-labs/graph.js`: add S to `PREREQ` (existing prerequisite slugs) and to
   `CROSS` (1 to 3 existing slugs). Keep the comment style.
5. After integrate.py appends the entry to `tools/math-encyclopedia.json`, edit
   its hub `description`/`description_ja` to one short sentence each, and move
   the entry to sit sensibly within its group (the list is ordered).

Lab ids must be unique across ALL topics (grep content.json). Param keys are
plain identifiers.

## 3. The visual standard

This is the point of the exercise: every experiment should be beautiful and
show the mechanism. Beyond KIT.md's design bar:
- At least one experiment per topic uses direct manipulation (`f.handle`).
- At least one uses an animator with a finished static initial frame (`initialT`).
- Prefer two linked views (`lab-row`/`lab-col`) where a picture and its graph
  both matter. Use `f.raster` for fields and densities, `f.stream` for flows.
- Real equations only; if schematic, say so in a caption.
- Readouts quote the quantities the formula names.

## 4. Build (exact order)

```
python3 math-labs/build.py
python3 math-labs/integrate.py
# keep other sessions' unpublished folders out of the library
EXCL=$(git ls-files --others --exclude-standard --directory | grep '/$' | sed 's|/$||' | grep -v -E '^(ja/)?(<S1>|<S2>)$' | paste -sd, -)
LIBRARY_EXCLUDE=$EXCL python3 tools/update-library.py
python3 tools/site-shell.py
python3 tools/track-pages.py
node math-labs/verify.cjs
python3 tools/check-index.py
```

site-shell.py sometimes rewrites unrelated pages with whitespace-only drift
(e.g. `class=" ig-site"`). After the build, `git status --short`: any modified
file outside the paths listed in step 6 is reverted with `git checkout -- <file>`.
The LIBRARY_EXCLUDE line above keeps unpublished folders (kuru-toga, another
session's new page) out of library.html; check the library diff adds only your two topics.

## 5. Visual QA (mandatory)

```
python3 -m http.server 8770 >/dev/null 2>&1 &   # from repo root
export NODE_PATH=$(npm root -g)
for S in <math-slug> <physics-slug>; do
  node math-labs/dev/shoot.cjs $S; node math-labs/dev/shoot.cjs $S --dark
  node math-labs/dev/shoot.cjs $S --ja; node math-labs/dev/shoot.cjs $S --width=390
done
```

Any EMPTY, ERROR, NONFINITE or page error is a failure. Build contact sheets with
`python3 math-labs/dev/sheet.py /tmp/<S>-sheet.png /tmp/labshots/<S>*.png` and LOOK
at them (Desktop Commander read_file shows images). Check: labels not colliding,
nothing leaving the frame, colours legible in dark, Japanese not overflowing,
phone layout stacking. Try the min and max of every slider with `--q=`. Fix and
reshoot until it is right. Kill the server afterwards.

## 6. Gate and ship

Ship only if verify.cjs, check-index.py and the QA all pass. Stage explicit paths only (never `git add -A`):

```
git add math-labs/additions/ math-labs/topics/<S1>.js math-labs/topics/<S2>.js \
  math-labs/checks/ math-labs/graph.js math-labs/content.json math-labs/queue.json \
  <S1>/ ja/<S1>/ <S2>/ ja/<S2>/ tools/math-encyclopedia.json \
  math-encyclopedia/ ja/math-encyclopedia/ index.html ja/index.html sitemap.xml \
  library/ ja/library/        # only those that actually changed
git diff --cached --stat      # review: nothing unrelated
```

Before committing set both queue entries to `"status": "done", "date": "YYYY-MM-DD"`.
Commit message: `Math encyclopedia: add <Math title> and <Physics title>`.
Then `git fetch origin && git merge origin/main` (resolve only index.html,
ja/index.html, sitemap.xml collisions by re-running the build tools; anything
harder: do not push, report), re-run `python3 tools/check-index.py`, and
`git push origin HEAD:main`. Wait ~2 minutes and confirm both EN and JA URLs
return 200 on https://theisegoria.github.io/.

If only one topic passes, ship that one alone: move the other's files out
(`git stash` is not safe with concurrent sessions; delete its additions/topics/checks
files, rebuild), leave its queue entry `queued` with a `"note"` saying what failed.
If neither passes, commit nothing, leave the working tree clean, and report.

Do not promote into the home page Latest section. The hub and the home page
subject cards pick up the new count automatically.

## 7. Report

Send Ben a short message: the two topics with EN and JA links, one line each on
what the experiments show, the commit hash, and anything held back and why.
Then update the project memory file `areas/math-encyclopedia.md` (topic list by
group with lab ids, topic/lab counts, last commit), keeping it concise.

## Writing rules (repeat of KIT.md, because they matter)

No em-dashes anywhere (EN or JA). Japanese in です・ます. No notes about how the
page was made, no AI or tool mentions. Mathematics exact; schematic figures
labelled as such.
