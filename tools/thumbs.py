#!/usr/bin/env python3
"""Turn the PNGs from tools/shoot-thumbs.cjs into the 640 x 400 WebP tiles in
assets/thumbs/ that tools/build-math-hub.py puts on the encyclopedia cards.

    python3 tools/thumbs.py <dir-of-pngs>

A figure close to 16:10 is cropped to fill the tile; anything taller or wider
is fitted inside it on its own background colour, so nothing is cut off.
Run tools/build-math-hub.py afterwards so new tiles appear on the cards.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/thumbs'
W, H = 640, 400


def tile(src):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    ratio = w / h
    if 1.35 <= ratio <= 1.9:                       # close enough: fill the tile
        if ratio > W / H:
            nw = round(h * W / H); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = round(w * H / W); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
        return im.resize((W, H), Image.LANCZOS)
    bg = Image.new('RGB', (W, H), im.getpixel((3, 3)))
    k = min((W - 28) / w, (H - 28) / h)
    im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    bg.paste(im, ((W - im.size[0]) // 2, (H - im.size[1]) // 2))
    return bg


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    n = 0
    for src in sorted(Path(sys.argv[1]).glob('*.png')):
        tile(src).save(OUT / (src.stem + '.webp'), 'WEBP', quality=80, method=6)
        n += 1
    print(f'{n} tiles written to {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
