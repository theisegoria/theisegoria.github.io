# Usage: python3 sheet.py out.png img1 img2 ... (tiles at 560px wide, 2 columns)
import sys
from PIL import Image
out,files=sys.argv[1],sys.argv[2:]
W=560;tiles=[]
for f in files:
    im=Image.open(f).convert('RGB');h=int(im.height*W/im.width);tiles.append(im.resize((W,h)))
cols=2;rows=(len(tiles)+1)//2
hs=[max(t.height for t in tiles[r*2:r*2+2]) for r in range(rows)]
sheet=Image.new('RGB',(W*cols+10,sum(hs)+10*rows),'white');y=0
for r in range(rows):
    for c in range(2):
        k=r*2+c
        if k<len(tiles):sheet.paste(tiles[k],(c*(W+10),y))
    y+=hs[r]+10
sheet.save(out);print(sheet.size)
