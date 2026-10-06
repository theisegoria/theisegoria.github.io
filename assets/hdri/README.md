Studio HDRIs used as image-based light by assets/lab-kit/studio-look.js.
All are from Poly Haven (https://polyhaven.com) and released under CC0:
photo_studio_01, studio_small_09, studio_small_08, photo_studio_loft_hall (1k .hdr).

2k versions (createStudio({ hdriRes: '2k' }), desktop only) of photo_studio_01 and
studio_small_09 are stored compactly as an sRGB base JPEG (<name>_2k.jpg), a smooth
log2 gain map (<name>_2k-gain.png) and its range (<name>_2k.json):
linear = pow(base, gamma) * exp2(mix(lo, hi, gain)). About 0.5 MB each instead of
6 MB for the 2k .hdr; studio-look decodes them on the GPU while it prefilters the
environment, and falls back to the 1k .hdr if they are missing.
