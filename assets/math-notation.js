/* Shared mathematical typography. Authored LaTeX takes priority over legacy notation.
 * Numeric inputs, code, URLs, existing KaTeX/MathJax, and semantic attributes remain untouched.
 */
(()=>{
'use strict';if(window.IsegoriaMath)return;
const greek={α:'alpha',β:'beta',γ:'gamma',δ:'delta',ε:'varepsilon',ζ:'zeta',η:'eta',θ:'theta',ι:'iota',κ:'kappa',λ:'lambda',μ:'mu',ν:'nu',ξ:'xi',π:'pi',ρ:'rho',σ:'sigma',τ:'tau',υ:'upsilon',φ:'varphi',χ:'chi',ψ:'psi',ω:'omega',Γ:'Gamma',Δ:'Delta',Θ:'Theta',Λ:'Lambda',Ξ:'Xi',Π:'Pi',Σ:'Sigma',Φ:'Phi',Ψ:'Psi',Ω:'Omega'};
const symbols={'½':'\\frac{1}{2}','⅓':'\\frac{1}{3}','⅔':'\\frac{2}{3}','¼':'\\frac{1}{4}','¾':'\\frac{3}{4}','ℓ':'\\ell ','𝒫':'\\mathcal{P}','∫':'\\int ','∑':'\\sum ','∏':'\\prod ','√':'\\sqrt ','∂':'\\partial ','∇':'\\nabla ','∞':'\\infty ','ℝ':'\\mathbb{R}','ℂ':'\\mathbb{C}','ℕ':'\\mathbb{N}','ℤ':'\\mathbb{Z}','ℚ':'\\mathbb{Q}','∅':'\\varnothing ','∈':'\\in ','∉':'\\notin ','⊆':'\\subseteq ','⊂':'\\subset ','⊊':'\\subsetneq ','∩':'\\cap ','∪':'\\cup ','∖':'\\setminus ','∀':'\\forall ','∃':'\\exists ','≠':'\\ne ','≤':'\\le ','≥':'\\ge ','≈':'\\approx ','≃':'\\simeq ','∝':'\\propto ','→':'\\to ','↦':'\\mapsto ','⇔':'\\iff ','⇒':'\\implies ','⇌':'\\rightleftharpoons ','×':'\\times ','·':'\\cdot ','⋅':'\\cdot ','−':'-','‖':'\\Vert ','∘':'\\circ ','⋯':'\\cdots ','…':'\\ldots ','′':"'",'″':"''",'°':'^{\\circ}','±':'\\pm ','∣':'\\mid ','∥':'\\parallel ','∼':'\\sim ','≡':'\\equiv ','∧':'\\land ','∨':'\\lor ','¬':'\\neg ','⊕':'\\oplus ','⊗':'\\otimes '};
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱˣʸᶻᵃᵇᶜᵈᵉᶠᵍʰʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷ',superPlain='0123456789+-=()nixyzabcdefghijklmnopqrstuvw';
const subMap={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'-','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x','ᵧ':'y','ᶻ':'z'};
const superMap={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i','ˣ':'x','ʸ':'y','ᶻ':'z','ᵃ':'a','ᵇ':'b','ᶜ':'c','ᵈ':'d','ᵉ':'e','ᶠ':'f','ᵍ':'g','ʰ':'h','ʲ':'j','ᵏ':'k','ˡ':'l','ᵐ':'m','ᵒ':'o','ᵖ':'p','ʳ':'r','ˢ':'s','ᵗ':'t','ᵘ':'u','ᵛ':'v','ʷ':'w'};
const words=new Set(['sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','exp','log','ln','det','rank','diag','gcd','lcm','min','max','sup','inf','lim','mod','Beta','Gamma','Var','Cov','Re','Im','atan2','arctan','arcsin','arccos','Pr','dim','ker','span','tr','sgn']);
const exact=new Map([
 ['μ = e∫P',String.raw`\mu=e^{\int P(x)\,dx}`],
 ['μ(x) = exp(∫[(Mᵧ − Nₓ)/N] dx)',String.raw`\mu(x)=\exp\!\left(\int\frac{M_y-N_x}{N}\,dx\right)`],
 ['μ(x) = exp(∫P(x)dx)',String.raw`\mu(x)=\exp\!\left(\int P(x)\,dx\right)`],
 ['f ∝ √(k/I)',String.raw`f\propto\sqrt{\frac{k}{I}}`],
 ['f ∝ (t/L²)√(E/ρ)',String.raw`f\propto\frac{t}{L^2}\sqrt{\frac{E}{\rho}}`],
 ['f ≈ 0.162 · (t / L²) · √(E / ρ)',String.raw`f\approx0.162\,\frac{t}{L^2}\sqrt{\frac{E}{\rho}}`],
 ['T(z) = (az + b)/(cz + d)',String.raw`T(z)=\frac{az+b}{cz+d}`],
 ['S(zⁿ) = (1 − n²)/(2z²)',String.raw`S(z^n)=\frac{1-n^2}{2z^2}`],
 ['S(eᵃᶻ) = −a²/2',String.raw`S(e^{az})=-\frac{a^2}{2}`],
 ['S(log z) = 1/(2z²)',String.raw`S(\log z)=\frac{1}{2z^2}`],
 ['CO₂(aq) + H₂O ⇌ H₂CO₃',String.raw`\mathrm{CO_2(aq)+H_2O\rightleftharpoons H_2CO_3}`],
]);
const cache=new Map(),errors=[];
function convert(raw){
 raw=raw.replace(/\u00a0/g,' ').trim();if(exact.has(raw))return exact.get(raw);
 if(/\\(?:frac|sqrt|sum|int|begin|math|operatorname|alpha|beta|mu|sigma|left|right|cdot|times|le|ge)/.test(raw))return raw;
 let result='';for(let i=0;i<raw.length;){const c=raw[i];if(raw.slice(i,i+3)==='⁴⁄₃'){result+='\\frac{4}{3}';i+=3;continue;}
  if(superMap[c]||subMap[c]){const map=superMap[c]?superMap:subMap;let p='';while(i<raw.length&&map[raw[i]])p+=map[raw[i++]];result+=(map===superMap?'^':'_')+'{'+p+'}';continue;}
  if(c==='√'){i++;while(raw[i]===' ')i++;if(raw[i]==='('){let depth=1,start=++i;while(i<raw.length&&depth){if(raw[i]==='(')depth++;if(raw[i]===')')depth--;i++;}result+='\\sqrt{'+convert(raw.slice(start,i-1))+'}';}else if(i<raw.length){result+='\\sqrt{'+convert(raw[i++])+'}';}continue;}
  if(greek[c]){result+='\\'+greek[c]+' ';i++;continue;}
  if(symbols[c]){result+=symbols[c];i++;continue;}
  const word=raw.slice(i).match(/^[A-Za-z]+/);if(word){let w=word[0];if(words.has(w))result+=['sin','cos','tan','cot','sec','csc','sinh','cosh','tanh','exp','log','ln','det','gcd','min','max','sup','inf','lim','dim','ker'].includes(w)?'\\'+w+' ':'\\operatorname{'+w+'}';else if(w.length>1&&!['dx','dy','dt','df','px','az','bc','cz','ad','bh','aq','Pq','na','xy','xz','yz','Py','DF','pq'].includes(w))result+='\\text{'+w+'}';else result+=w;i+=w.length;continue;}
  if((c==='^'||c==='_')&&raw[i+1]==='{'){let depth=1,start=i+2;i+=2;while(i<raw.length&&depth){if(raw[i]==='{')depth++;if(raw[i]==='}')depth--;i++;}result+=c+'{'+convert(raw.slice(start,i-1))+'}';continue;}
  if(c==='%'){result+='\\%';i++;continue;}if(c==='{'){result+='\\{';i++;continue;}if(c==='}'){result+='\\}';i++;continue;}if(c==='&'){result+='\\&';i++;continue;}if(c==='#'){result+='\\#';i++;continue;}
  result+=c;i++;
 }
 return result;
}
const ESC=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function mathHTML(raw,authored=false){const tex=authored?raw:convert(raw),key=tex;if(cache.has(key))return cache.get(key);try{const html=katex.renderToString(tex,{throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml'});cache.set(key,html);return html;}catch(e){errors.push({raw,tex,message:e.message});return ESC(raw);}}
function runs(s){
 const list=[];const re=/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|(?:[A-Za-z]+|[0-9]+(?:[.,][0-9]+)*(?:[eE][+−-]?[0-9]+)?|[α-ωΑ-Ωℝℂℕℤℚ∅∞∫∑∏∂∇√ℓ½⅓⅔¼¾]|[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱˣʸᶻᵃᵇᶜᵈᵉᶠᵍʰʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷ₀-₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵧ]+|[⁄=<>≤≥≠≈≃∝+−*/^_:→↦∈∉∩∪⊆⊂⊊∖∀∃⇔⇒×·⋅∘⋯…′″°±∣∥∼≡∧∨¬⊕⊗%()[\]{},|.-])/g;
 let current=null;
 const finish=()=>{if(!current)return;let raw=s.slice(current.start,current.end).replace(/[\s,:;.!]+$/,'');let prefix=raw.match(/^[\s,.:]+/)?.[0]||'';raw=raw.slice(prefix.length);const a=current.start+prefix.length;
  if(raw&&( /\d|[α-ωΑ-Ωℝℂℕℤℚ∅∞∫∑∏∂∇√ℓ½⅓⅔¼¾]|[⁰¹²³⁴⁵⁶⁷⁸⁹₀-₉]/.test(raw)||/[A-Za-z].*[=<>≤≥≠≈∝+−*/^→↦∈]/.test(raw)||/^[A-HJ-Zb-z]$/.test(raw))){
   // Keep prose punctuation and unmatched parentheses outside the formula.
   let start=a,end=a+raw.length;while(raw.startsWith('(')&&!raw.includes(')')){raw=raw.slice(1);start++;}while(raw.endsWith(')')&&(raw.match(/\)/g)||[]).length>(raw.match(/\(/g)||[]).length){raw=raw.slice(0,-1);end--;}
   if(raw)list.push({start,end,raw});
  }current=null;};
 for(const m of s.matchAll(re)){if(m[1]!==undefined||m[2]!==undefined||m[3]!==undefined){finish();list.push({start:m.index,end:m.index+m[0].length,raw:m[1]??m[2]??m[3],authored:true,display:m[1]!==undefined||m[3]!==undefined});continue;}
  const token=m[0],isWord=/^[A-Za-z]+$/.test(token),valid=!isWord||token.length===1||words.has(token)||/^[A-Z]{1,3}$/.test(token)||['dx','dy','dt','df','px','az','bc','cz','ad','dxdy','bh','aq','Pq','na','xy','xz','yz','xyy','Py','Pμ','Qx','Qy'].includes(token);
  if(!valid){finish();continue;}const gap=current?s.slice(current.end,m.index):'';if(current&&(!/^\s*$/.test(gap)||gap.includes('\n\n')))finish();
  if(!current)current={start:m.index,end:m.index+token.length};else current.end=m.index+token.length;
 }finish();return list;
}
function inlineHTML(text){let result='',last=0;for(const r of runs(text)){result+=ESC(text.slice(last,r.start))+'<span class="ig-latex'+(r.display?' ig-latex-display':'')+'" data-ig-tex="'+ESC(r.authored?r.raw:convert(r.raw))+'">'+mathHTML(r.raw,r.authored)+'</span>';last=r.end;}return result+ESC(text.slice(last));}
const skip='script,style,pre,code,textarea,input,select,option,noscript,.katex,.MathJax,mjx-container,[data-ig-tex],[data-ig-no-math],.ig-canvas-math,[contenteditable="true"]';
const sourceNodes=new Map(),svgNodes=new WeakMap();let ready=!!window.katex,observer,timer;
function richRaw(node){if(node.nodeType===3)return node.data;if(node.nodeType!==1)return '';if(node.tagName==='BR')return '\n';if(node.tagName==='SUB')return '_{'+node.textContent+'}';if(node.tagName==='SUP')return '^{'+node.textContent+'}';return [...node.childNodes].map(richRaw).join('');}
function svgMath(node){const text=node.textContent;if(!runs(text).length)return;let state=svgNodes.get(node);if(state&&state.text===text&&state.x===node.getAttribute('x')&&state.y===node.getAttribute('y'))return;if(state)state.fo.remove();
 const box=node.getBBox();if(!box.width&&!box.height)return;const ns='http://www.w3.org/2000/svg',fo=document.createElementNS(ns,'foreignObject'),span=document.createElement('span'),style=getComputedStyle(node);span.className='ig-svg-math';span.innerHTML=inlineHTML(text);span.style.fontSize=style.fontSize;span.style.fontFamily=style.fontFamily;span.style.whiteSpace='nowrap';fo.setAttribute('data-ig-tex','svg');
 const anchor=node.getAttribute('text-anchor')||style.textAnchor,x=Number(node.getAttribute('x'))||0,y=Number(node.getAttribute('y'))||0;
 fo.setAttribute('x',String(x));fo.setAttribute('y',String(y-parseFloat(style.fontSize)));fo.setAttribute('width','1');fo.setAttribute('height',String(Math.max(24,box.height+10)));fo.style.overflow='visible';if(node.hasAttribute('transform'))fo.setAttribute('transform',node.getAttribute('transform'));span.style.display='inline-block';span.style.transform=anchor==='middle'?'translateX(-50%)':anchor==='end'?'translateX(-100%)':'';fo.append(span);node.after(fo);node.style.visibility='hidden';node.setAttribute('aria-hidden','true');svgNodes.set(node,{fo,text,x:node.getAttribute('x'),y:node.getAttribute('y')});}
function scan(root=document.body){if(!ready||!root)return;observer?.disconnect();
 // Handle deliberately authored legacy equation containers as complete expressions.
 root.querySelectorAll?.('.formula:not([data-tex]),.control-equation,.equation-strip,.equation>strong,.formula>strong,.reaction-equation,.eq,.lab-formulas').forEach(e=>{
  if(e.closest(skip)||e.querySelector('p,div,input,select,canvas,svg,a,.katex'))return;
  const raw=richRaw(e);if(raw.length>450||!runs(raw).length)return;const chunks=raw.split('\n').filter(x=>x.trim());const content=chunks.map(x=>'<span class="ig-latex" data-ig-tex="'+ESC(convert(x))+'">'+mathHTML(x)+'</span>').join('<br>');e.innerHTML=content;
 });
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.data.trim()&&!n.parentElement?.closest(skip+',svg')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});const text=[];while(walker.nextNode())text.push(walker.currentNode);
 for(const node of text){if(!node.isConnected)continue;const raw=node.data;if(!runs(raw).length)continue;const old=sourceNodes.get(node);if(old)old.remove();const span=document.createElement('span');span.className='ig-math-copy';span.setAttribute('data-ig-tex','prose');span.innerHTML=inlineHTML(raw);node.after(span);node.data='';sourceNodes.set(node,span);}
 for(const [node,span] of sourceNodes)if(!node.isConnected){span.remove();sourceNodes.delete(node);}
 root.querySelectorAll?.('svg text').forEach(e=>{if(!e.closest('[data-ig-tex]'))try{svgMath(e);}catch(err){errors.push({svg:e.textContent,message:err.message});}});
 observer?.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>scan(),45);}
// Canvas tick marks and formula labels use DOM mathematics at the same coordinates.
const proto=window.CanvasRenderingContext2D?.prototype;
if(proto){const fill=proto.fillText,clear=proto.clearRect;const layers=new WeakMap();
 proto.fillText=function(text,x,y,maxWidth){const str=String(text);if(!ready||!runs(str).length)return fill.apply(this,arguments);const c=this.canvas;if(!c.isConnected||!c.clientWidth)return fill.apply(this,arguments);let layer=layers.get(c);if(!layer){layer=document.createElement('div');layer.className='ig-canvas-math';layer.setAttribute('aria-hidden','true');const parent=c.parentElement;if(getComputedStyle(parent).position==='static')parent.style.position='relative';parent.append(layer);layers.set(c,layer);}Object.assign(layer.style,{left:c.offsetLeft+'px',top:c.offsetTop+'px',width:c.clientWidth+'px',height:c.clientHeight+'px'});
 const m=this.getTransform(),sx=c.clientWidth/c.width,sy=c.clientHeight/c.height,px=(m.a*x+m.c*y+m.e)*sx,py=(m.b*x+m.d*y+m.f)*sy,label=document.createElement('span'),size=parseFloat(this.font.match(/([\d.]+)px/)?.[1]||'12')*Math.hypot(m.c,m.d)*sy;
 label.innerHTML=inlineHTML(str);label.dataset.x=String(px);label.dataset.y=String(py);const align=this.textAlign,baseline=this.textBaseline,dx=align==='center'?'-50%':align==='right'||align==='end'?'-100%':'0',dy=baseline==='top'||baseline==='hanging'?'0':baseline==='middle'?'-50%':baseline==='bottom'||baseline==='ideographic'?'-100%':'-80%';Object.assign(label.style,{left:px+'px',top:py+'px',fontSize:size+'px',color:typeof this.fillStyle==='string'?this.fillStyle:'inherit',transform:`translate(${dx},${dy}) rotate(${Math.atan2(m.b,m.a)}rad)`});if(maxWidth)label.style.maxWidth=maxWidth*sx+'px';layer.append(label);};
 proto.clearRect=function(x,y,w,h){const layer=layers.get(this.canvas);if(layer){const c=this.canvas,m=this.getTransform(),sx=c.clientWidth/c.width,sy=c.clientHeight/c.height,x0=(m.a*x+m.c*y+m.e)*sx,y0=(m.b*x+m.d*y+m.f)*sy,x1=x0+w*m.a*sx,y1=y0+h*m.d*sy;for(const label of [...layer.children])if(Number(label.dataset.x)>=x0-3&&Number(label.dataset.x)<=x1+3&&Number(label.dataset.y)>=y0-3&&Number(label.dataset.y)<=y1+3)label.remove();}return clear.apply(this,arguments);};
}
window.IsegoriaMath={convert,runs,inlineHTML,scan,errors};
function start(){ready=true;const isolated=document.createElement('link');isolated.rel='stylesheet';isolated.href='/assets/math-notation.css?v=20260919';document.head.append(isolated);const css=document.createElement('style');css.textContent='.ig-latex{display:inline-block;max-width:100%;vertical-align:baseline}.ig-latex>.katex{font-size:1em}.ig-latex-display{display:block;box-sizing:border-box;max-width:100%;overflow-x:auto;overflow-y:hidden;padding:.5em 0}.ig-svg-math .katex{font-size:1em}.ig-svg-math{line-height:1.25;color:inherit}.ig-canvas-math{position:absolute;pointer-events:none;overflow:visible}.ig-canvas-math>span{position:absolute;white-space:nowrap;line-height:1.2;transform-origin:0 0}.ig-canvas-math .katex{font-size:1em}.readout-item .ig-latex,.control-equation .ig-latex,.equation-strip .ig-latex{display:inline-block;white-space:nowrap;vertical-align:baseline}.ig-math-copy{font:inherit;color:inherit}.ig-latex .katex-html{white-space:nowrap}';document.head.append(css);observer=new MutationObserver(records=>{if(records.some(r=>!(r.target.nodeType===1?r.target:r.target.parentElement)?.closest(skip)))schedule();});scan();window.addEventListener('resize',schedule);document.addEventListener('input',schedule,true);document.addEventListener('change',schedule,true);window.dispatchEvent(new Event('resize'));document.documentElement.dataset.mathNotation='ready';}
function domReady(){if(window.katex)start();else{const link=document.createElement('link');link.rel='stylesheet';link.href='/analysis-atlas/vendor/katex.min.css';document.head.append(link);const script=document.createElement('script');script.src='/analysis-atlas/vendor/katex.min.js';script.onload=start;script.onerror=()=>errors.push({message:'KaTeX could not load'});document.head.append(script);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',domReady);else domReady();
})();
