#!/usr/bin/env python3
"""Upload study packs to the GitHub Release that hosts them.

The per-module study packs and the combined mindmap archive are too heavy
for the Pages site, which GitHub caps at 1 GB, so packs/ is not committed.
tools/build_packs.py still writes them locally; this uploads them as assets
of one release (imf_manuscript.PACK_RELEASE), replacing any asset of the
same name, and the index pages link to imf_manuscript.PACK_BASE.

    python3 tools/publish_packs.py              # every ZIP in packs/
    python3 tools/publish_packs.py 021-01 ...   # these modules plus the archive

Needs the GitHub CLI (gh), signed in with push rights to the site repo.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import imf_manuscript as manuscript  # noqa: E402

REPO = "theisegoria/theisegoria.github.io"
PACKS = ROOT / "packs"


def gh(*args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["gh", *args, "--repo", REPO], check=check,
                          capture_output=True, text=True)


def main(argv: list[str]) -> int:
    if argv:
        files = [PACKS / f"IMF-{key}-study-pack.zip" for key in argv]
        files.append(PACKS / "IMF-mindmaps-all.zip")
    else:
        files = sorted(PACKS.glob("IMF-*.zip"))
    missing = [f.name for f in files if not f.is_file()]
    if missing:
        raise SystemExit("not built: " + ", ".join(missing))
    if gh("release", "view", manuscript.PACK_RELEASE, check=False).returncode:
        gh("release", "create", manuscript.PACK_RELEASE,
           "--title", "Integrated Medical Foundations study packs",
           "--notes", "One ZIP per TTS module (text, mindmap and Anki cards in "
           "English and Japanese), plus every mindmap in one archive. "
           "Linked from https://theisegoria.github.io/medical-textbook/.",
           "--latest=false")
    for start in range(0, len(files), 20):
        batch = [str(f) for f in files[start:start + 20]]
        gh("release", "upload", manuscript.PACK_RELEASE, *batch, "--clobber")
        print(f"uploaded {start + len(batch)}/{len(files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
