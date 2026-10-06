# Studio HDRIs at 2k, gain-map encoded

Poly Haven HDRIs (CC0 1.0): photo_studio_01, studio_small_09, photo_studio_loft_hall (https://polyhaven.com/hdris). Each is stored as an sRGB base JPEG (<name>.jpg, gamma in <name>.json) and a smooth log2 gain map (<name>-gain.png, range lo..hi in the JSON): linear = pow(base, gamma) * exp2(mix(lo, hi, gain)). About 0.5 MB each instead of 6 MB. Encoder: viz-audit/work-p2/hdr_gainmap.py in the working tree.
