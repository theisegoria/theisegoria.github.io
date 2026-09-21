'use strict';
(()=>{
const TAU=2*Math.PI;
const seq=(n,f)=>Array.from({length:n},(_,i)=>f(i));
function rank2(matrix){if(!matrix.length)return 0;const a=matrix.map(r=>r.slice());let k=0;for(let j=0;j<a[0].length&&k<a.length;j++){let r=a.findIndex((row,i)=>i>=k&&row[j]);if(r<0)continue;[a[k],a[r]]=[a[r],a[k]];for(let i=0;i<a.length;i++)if(i!==k&&a[i][j])for(let q=j;q<a[i].length;q++)a[i][q]^=a[k][q];k++;}return k;}
function homology(v,edges,faces){const d1=seq(v,i=>edges.map(e=>Number(e.includes(i))));const d2=edges.map(e=>faces.map(f=>Number(e.every(i=>f.includes(i)))));const r1=rank2(d1),r2=rank2(d2);return [v-r1,edges.length-r1-r2,faces.length-r2];}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function betaDensity(x,a,b){if((x===0&&a>1)||(x===1&&b>1))return 0;let log=0;for(let k=1;k<a+b;k++)log+=Math.log(k);for(let k=1;k<a;k++)log-=Math.log(k);for(let k=1;k<b;k++)log-=Math.log(k);return Math.exp(log+(a===1?0:(a-1)*Math.log(x))+(b===1?0:(b-1)*Math.log(1-x)));}
function logistic(r,x,n){const out=[x];for(let i=0;i<n;i++){x=r*x*(1-x);out.push(x);}return out;}
function ode(h){let t=0,a=1,b=1;const e=[[0,1]],r=[[0,1]];while(t<2-1e-12){const dt=Math.min(h,2-t),z=-5*dt;a*=1+z;b*=1+z+z*z/2+z**3/6+z**4/24;t+=dt;e.push([t,a]);r.push([t,b]);}return {e,r};}
function interpolation(n,cheb){const xs=seq(n+1,j=>cheb?Math.cos(j*Math.PI/n):-1+2*j/n),ys=xs.map(x=>1/(1+25*x*x)),w=xs.map((x,i)=>1/xs.reduce((a,y,j)=>i===j?a:a*(x-y),1));const f=x=>{let num=0,den=0;for(let i=0;i<=n;i++){if(Math.abs(x-xs[i])<1e-12)return ys[i];const q=w[i]/(x-xs[i]);num+=q*ys[i];den+=q;}return num/den;};return {xs,ys,f};}
window.MathLabs={rank2,homology,betaDensity,logistic,ode,interpolation,gcd};

/*HELPERS-END*/
const VERSION='20260921';
const Lab=window.Lab;
const defs=window.LabDefs=window.LabDefs||{};
const sections=[...document.querySelectorAll('[data-lab]')];
const topic=document.body.dataset.topic;
const params=new URLSearchParams(location.search);

/* Controls: numeric sliders, and segmented choices when an input carries data-options. */
function enhance(section){
 for(const input of section.querySelectorAll('.controls input')){
  const label=input.closest('label');label.classList.add('lab-control');
  const out=label.querySelector('output');
  const key=section.id+'.'+input.dataset.key;
  if(params.has(key)){const x=Number(params.get(key));if(Number.isFinite(x))input.value=String(Math.min(Number(input.max),Math.max(Number(input.min),x)));}
  if(input.dataset.options){
   let opts=[];try{opts=JSON.parse(input.dataset.options);}catch(e){}
   label.classList.add('is-choice');input.hidden=true;if(out)out.hidden=true;
   const seg=document.createElement('span');seg.className='lab-seg';seg.setAttribute('role','radiogroup');
   opts.forEach((o,i)=>{const b=document.createElement('button');b.type='button';b.textContent=Array.isArray(o)?o[Lab.ja?1:0]:o;b.dataset.value=String(Number(input.min)+i*Number(input.step||1));b.setAttribute('role','radio');b.addEventListener('click',()=>{input.value=b.dataset.value;input.dispatchEvent(new Event('input',{bubbles:true}));});seg.appendChild(b);});
   label.appendChild(seg);
  }
  const paint=()=>{const lo=Number(input.min),hi=Number(input.max),x=Number(input.value);label.style.setProperty('--fill',hi>lo?((x-lo)/(hi-lo)*100).toFixed(1)+'%':'0%');if(out)out.textContent=formatValue(input);label.querySelectorAll('.lab-seg button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.value===input.value)));};
  input.__paint=paint;paint();
  input.addEventListener('input',()=>{paint();const url=new URL(location.href);url.searchParams.set(key,input.value);history.replaceState(null,'',url);syncLanguages();run(section);});
 }
}
function formatValue(input){const x=Number(input.value),st=Number(input.step)||1;const d=st>=1?0:Math.min(4,Math.ceil(-Math.log10(st)-1e-9));return x.toFixed(d).replace('-','−');}
function values(section){const v={};section.querySelectorAll('.controls input').forEach(e=>{v[e.dataset.key]=Number(e.value);});return v;}
function ctxFor(section){
 if(section.__ctx)return section.__ctx;
 const host=section.querySelector('.plot'),out=section.querySelector('.readout');host.setAttribute('data-ig-no-math','');out.setAttribute('data-ig-no-math','');
 const ctx={section,host,out,id:section.dataset.lab,T:Lab.T,ja:Lab.ja,Lab,state:{},
  set(key,value,silent){const input=section.querySelector(`.controls input[data-key="${key}"]`);if(!input)return;const lo=Number(input.min),hi=Number(input.max),st=Number(input.step)||0;let x=Math.min(hi,Math.max(lo,value));if(st)x=lo+Math.round((x-lo)/st)*st;input.value=String(Number(x.toFixed(6)));input.__paint?.();const url=new URL(location.href);url.searchParams.set(section.id+'.'+key,input.value);history.replaceState(null,'',url);syncLanguages();if(!silent)run(section);},
  readout(items,note){Lab.readout(out,items,note);},
  redraw(){run(section);},
  width(){return host.clientWidth||section.clientWidth||640;}};
 section.__ctx=ctx;return ctx;
}
function run(section){
 const def=defs[section.dataset.lab];if(!def)return;
 const ctx=ctxFor(section),v=values(section);
 if(!def.persist)ctx.host.replaceChildren();
 try{def.render(ctx,v);}catch(err){console.error(section.dataset.lab,err);ctx.host.replaceChildren();const p=document.createElement('p');p.className='lab-error';p.textContent=Lab.T('This experiment could not be drawn.','この実験を描画できませんでした。');ctx.host.append(p);}
 ctx.host.setAttribute('aria-label',section.querySelector('h2').textContent+'. '+(ctx.out.textContent||''));
}
function tools(section){
 const bar=document.createElement('div');bar.className='lab-tools';
 const reset=document.createElement('button');reset.type='button';reset.textContent=Lab.T('Reset','リセット');
 const copy=document.createElement('button');copy.type='button';copy.textContent=Lab.T('Copy link','リンクをコピー');
 const status=document.createElement('span');status.className='lab-status';status.setAttribute('role','status');
 reset.addEventListener('click',()=>{const url=new URL(location.href);section.querySelectorAll('.controls input').forEach(input=>{input.value=input.defaultValue;input.__paint?.();url.searchParams.delete(section.id+'.'+input.dataset.key);});history.replaceState(null,'',url);const ctx=ctxFor(section);ctx.state={};if(defs[section.dataset.lab]?.persist)ctx.host.replaceChildren();run(section);syncLanguages();});
 copy.addEventListener('click',async()=>{const url=new URL(location.href);url.hash=section.id;try{await navigator.clipboard.writeText(url.href);status.textContent=Lab.T('Copied','コピーしました');}catch(e){status.textContent=Lab.T('Copy the address bar instead','アドレスバーからコピーしてください');}setTimeout(()=>{status.textContent='';},2200);});
 bar.append(reset,copy,status);section.querySelector('.controls').after(bar);
}
function syncLanguages(){document.querySelectorAll('a[hreflang]').forEach(a=>{try{const u=new URL(a.href);u.search=location.search;u.hash=location.hash;a.href=u.href;}catch(e){}});}
function renderTex(){for(const node of document.querySelectorAll('[data-tex]')){if(window.katex&&!node.dataset.done){try{window.katex.render(node.dataset.tex,node,{displayMode:true,throwOnError:false});node.dataset.done='1';}catch(e){}}}}
function start(){
 sections.forEach(s=>{enhance(s);tools(s);});
 const go=()=>{sections.forEach(run);};
 const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting&&!e.target.__drawn){e.target.__drawn=true;run(e.target);}});},{rootMargin:'400px'});
 sections.forEach(s=>io.observe(s));
 Lab.onTheme(()=>sections.forEach(s=>{if(s.__drawn){if(defs[s.dataset.lab]?.persist)ctxFor(s).host.replaceChildren();run(s);}}));
 let lastW=document.querySelector('.math-wrap').clientWidth,timer;
 new ResizeObserver(es=>{const w=Math.round(es[0].contentRect.width);if(Math.abs(w-lastW)<2)return;lastW=w;clearTimeout(timer);timer=setTimeout(()=>sections.forEach(s=>{if(s.__drawn){if(defs[s.dataset.lab]?.persist)ctxFor(s).host.replaceChildren();run(s);}}),120);}).observe(document.querySelector('.math-wrap'));
 syncLanguages();window.addEventListener('hashchange',syncLanguages);
 renderTex();window.addEventListener('load',renderTex);
 void go;
}
if(topic){const sc=document.createElement('script');sc.src=`/math-labs/topics/${topic}.js?v=${VERSION}`;sc.onload=start;sc.onerror=start;document.head.appendChild(sc);}else start();
})();
