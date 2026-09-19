from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
s=(root/'analysis-atlas/vendor/katex.min.css').read_text().replace('url(fonts/','url(/analysis-atlas/vendor/fonts/')
def scope(m):
 selectors,body=m.groups()
 if selectors.lstrip().startswith('@'):return m[0]
 return ','.join('.ig-latex '+x.strip() for x in selectors.split(','))+'{'+body+'}'
s=re.sub(r'([^{}]+)\{([^{}]*)\}',scope,s)
reset='''/* Isolate KaTeX from legacy article rules such as .readouts span. */
.ig-latex span{display:inline;position:static;float:none;margin:0;padding:0;border:0;border-radius:0;background:none;min-height:0;min-width:0;max-width:none;width:auto;height:auto;letter-spacing:normal;text-transform:none;font-size:inherit;font-weight:normal;color:inherit;box-shadow:none;text-align:initial;}
.readout-item .ig-latex,.control-equation .ig-latex,.equation-strip .ig-latex{display:inline-block;white-space:nowrap;vertical-align:baseline;}
.ig-latex-display{box-sizing:border-box;max-width:100%;overflow-x:auto;overflow-y:hidden;}
.math-wrap .source,.math-wrap .notes,.math-wrap .lesson-nav{overflow-wrap:anywhere;}
'''
(root/'assets/math-notation.css').write_text(reset+s+'\n')
