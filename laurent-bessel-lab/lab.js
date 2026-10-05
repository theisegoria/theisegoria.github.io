/* Series lab: Laurent expansions on a domain-coloured plane, Bessel partial sums,
   and circular-membrane modes built from Bessel zeros. Bilingual through the
   in-page language buttons; theme-aware through the site's data-theme. */
(()=>{'use strict';
const $=s=>document.querySelector(s), NS='http://www.w3.org/2000/svg';
const RM=matchMedia('(prefers-reduced-motion: reduce)');
let lang=(document.documentElement.lang||'en').startsWith('ja')?'ja':'en';
const T=(en,ja)=>lang==='ja'?ja:en;
const fmt=(n,d=2)=>Number(n).toFixed(d);
function el(tag,attrs,parent,txt){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);if(txt!==undefined)e.textContent=txt;if(parent)parent.appendChild(e);return e;}
let PR=null;function col(n){if(!PR){PR=document.createElement('i');PR.style.display='none';document.body.appendChild(PR);}PR.style.color=`var(${n})`;return getComputedStyle(PR).color;}
const dark=()=>document.documentElement.dataset.theme==='dark';
const FK=svg=>{const w=svg.getBoundingClientRect().width||760;return Math.max(1,Math.min(1.9,760/w*0.62));};

/* ---------- special functions (the truncated series is the original model) ---------- */
function gamma(z){if(z<0.5)return Math.PI/(Math.sin(Math.PI*z)*gamma(1-z));z-=1;let x=0.9999999999998099;const c=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];for(let i=0;i<c.length;i++)x+=c[i]/(z+i+1);const t=z+c.length-.5;return Math.sqrt(2*Math.PI)*Math.pow(t,z+.5)*Math.exp(-t)*x;}
function factorial(n){let p=1;for(let i=2;i<=n;i++)p*=i;return p;}
function bessel(x,nu,terms){let s=0;for(let m=0;m<terms;m++)s+=((m%2?-1:1)*Math.pow(x/2,2*m+nu))/(factorial(m)*gamma(m+nu+1));return s;}
/* reference J_nu: same series, summed by term recurrence to 90 terms */
function besselRef(x,nu){if(x===0)return nu===0?1:0;let t=Math.pow(x/2,nu)/gamma(nu+1),s=t;const q=(x/2)*(x/2);for(let m=0;m<90;m++){t*=-q/((m+1)*(m+1+nu));s+=t;if(Math.abs(t)<1e-17*Math.max(1,Math.abs(s))&&m>x)break;}return s;}
function zerosOf(nu,xmax,count){const z=[];let a=0.05,fa=besselRef(a,nu);for(let x=0.05;x<=xmax&&z.length<count;x+=0.01){const fb=besselRef(x,nu);if(fa*fb<0){let lo=x-0.01,hi=x,flo=fa;for(let k=0;k<50;k++){const m=(lo+hi)/2,fm=besselRef(m,nu);if(flo*fm<=0)hi=m;else{lo=m;flo=fm;}}z.push((lo+hi)/2);}fa=fb;}return z;}

/* =====================  01  LAURENT  ===================== */
/* f(z) = 1 / [z(z - 1)], the function of worked example A.
   0 < |z| < 1 :  f = -sum_{n>=0} z^(n-1)        |z| > 1 :  f = sum_{n>=0} z^(-n-2) */
const LW=760,LH=470,LCX=300,LCY=235,LS=80;
const lz=(px,py)=>[(px-LCX)/LS,(LCY-py)/LS];
let domainCache=null,domainKey='';
function paintDomain(){
  const cv=$('#laurentCanvas'),dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(LW*dpr),H=Math.round(LH*dpr),key=W+'x'+H+(dark()?'d':'l');
  if(domainKey===key)return; domainKey=key; cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d'),img=ctx.createImageData(W,H),d=img.data,dk=dark();
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const [x,y]=lz(i/dpr,j/dpr);
    /* den = z(z-1) */
    const dr=x*x-y*y-x, di=2*x*y-y, q=dr*dr+di*di;
    const fr=dr/q, fi=-di/q, mag=Math.sqrt(fr*fr+fi*fi), arg=Math.atan2(fi,fr);
    const h=((arg/(2*Math.PI))+1)%1;
    const lg=Math.log2(mag), band=lg-Math.floor(lg);                 /* modulus contours */
    const ph=(arg/(Math.PI/6)); const pb=ph-Math.floor(ph);           /* phase contours every 30 deg */
    let L=(dk?0.38:0.56)+0.16*(band-0.5);
    L*=0.9+0.1*Math.min(1,Math.min(pb,1-pb)*8);
    if(!isFinite(mag))L=1;
    const S=dk?0.62:0.58;
    /* hsl -> rgb */
    const a=S*Math.min(L,1-L),f=n=>{const k=(n+h*12)%12;return L-a*Math.max(-1,Math.min(k-3,9-k,1));};
    const o=(j*W+i)*4;d[o]=255*f(0);d[o+1]=255*f(8);d[o+2]=255*f(4);d[o+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function lauSum(x,y,r,terms){ /* partial sum at z = x + iy on |z| = r */
  const a=Math.atan2(y,x);let sr=0,si=0;
  for(let n=0;n<terms;n++){const p=r<1?n-1:-n-2,mag=Math.pow(r,p),ang=p*a;sr+=mag*Math.cos(ang);si+=mag*Math.sin(ang);}
  return r<1?[-sr,-si]:[sr,si];
}
function lauExact(x,y){const dr=x*x-y*y-x,di=2*x*y-y,q=dr*dr+di*di;return [dr/q,-di/q];}
let sweeping=false,sweepT0=0;
function drawLaurent(){
  paintDomain();
  const r=+$('#radius').value,terms=+$('#laurentTerms').value,onB=Math.abs(r-1)<0.005,inner=r<1;
  $('#radiusOut').value=fmt(r);$('#termsOut').value=terms;
  const svg=$('#laurentSvg');svg.replaceChildren();
  const ink=dark()?'#f4f6fb':'#14181f',halo=dark()?'#0b0e13':'#ffffff';
  /* veil the region where the chosen expansion does not converge */
  const U=LS,veil=dark()?'rgba(8,10,14,.62)':'rgba(250,250,247,.66)';
  if(!onB){if(inner)el('path',{d:`M0 0H${LW}V${LH}H0Z M${LCX+U} ${LCY}A${U} ${U} 0 1 0 ${LCX-U} ${LCY}A${U} ${U} 0 1 0 ${LCX+U} ${LCY}Z`,fill:veil,'fill-rule':'evenodd'},svg);
    else el('circle',{cx:LCX,cy:LCY,r:U,fill:veil},svg);}
  else el('rect',{width:LW,height:LH,fill:veil},svg);
  /* grid and axes */
  const g=el('g',{stroke:ink,'stroke-opacity':.14},svg);
  for(let k=-4;k<=6;k++)el('line',{x1:LCX+k*LS,y1:0,x2:LCX+k*LS,y2:LH},g);
  for(let k=-3;k<=3;k++)el('line',{x1:0,y1:LCY+k*LS,x2:LW,y2:LCY+k*LS},g);
  el('line',{x1:0,y1:LCY,x2:LW,y2:LCY,stroke:ink,'stroke-opacity':.55,'stroke-width':1.2},svg);
  el('line',{x1:LCX,y1:0,x2:LCX,y2:LH,stroke:ink,'stroke-opacity':.55,'stroke-width':1.2},svg);
  const k=FK(svg);const lab=(x,y,s,o={})=>{if(o['font-size'])o['font-size']*=k;const t=el('text',Object.assign({x,y,fill:ink,'font-size':12*k,'paint-order':'stroke',stroke:halo,'stroke-width':3,'stroke-linejoin':'round'},o),svg,s);return t;};
  [-3,-2,-1,1,2,3,4,5].forEach(k=>lab(LCX+k*LS,LCY+16,String(k),{'text-anchor':'middle','font-size':10.5,'fill-opacity':.8}));
  [-2,-1,1,2].forEach(k=>lab(LCX-8,LCY-k*LS+4,k+'i',{'text-anchor':'end','font-size':10.5,'fill-opacity':.8}));
  lab(LW-10,LCY-10,'Re z',{'text-anchor':'end'});lab(LCX+8,16,'Im z');
  /* the boundary |z| = 1 between the two annuli */
  el('circle',{cx:LCX,cy:LCY,r:U,fill:'none',stroke:ink,'stroke-width':1.4,'stroke-dasharray':'2 5','stroke-opacity':.9},svg);
  lab(LCX-U*0.74,LCY-U*0.74,'|z| = 1',{'text-anchor':'end','font-size':11.5});
  /* poles */
  [[0,T('pole z = 0','極 z = 0'),34],[1,T('pole z = 1','極 z = 1'),-12]].forEach(([p,s,dy])=>{const x=LCX+p*LS;
    el('circle',{cx:x,cy:LCY,r:7.5,fill:'none',stroke:halo,'stroke-width':4},svg);el('circle',{cx:x,cy:LCY,r:7.5,fill:'none',stroke:ink,'stroke-width':2},svg);
    el('path',{d:`M${x-4} ${LCY-4}L${x+4} ${LCY+4}M${x+4} ${LCY-4}L${x-4} ${LCY+4}`,stroke:ink,'stroke-width':1.6},svg);
    lab(x+(p?12:-12),LCY+dy-6,s,{'text-anchor':p?'start':'end','font-size':11.5,'font-weight':600});});
  /* inspection circle and partial-sum samples coloured by error */
  const rc=r*LS,ring=onB?col('--lb-rose'):inner?col('--lb-blue'):col('--lb-orange');
  el('circle',{cx:LCX,cy:LCY,r:rc,fill:'none',stroke:halo,'stroke-width':5,'stroke-opacity':.8},svg);
  el('circle',{cx:LCX,cy:LCY,r:rc,fill:'none',stroke:ring,'stroke-width':2.6},svg);
  const N=60,errs=[];
  for(let i=0;i<N;i++){const a=(i+.5)*2*Math.PI/N,x=r*Math.cos(a),y=r*Math.sin(a);
    const s=lauSum(x,y,r,terms),e=lauExact(x,y),err=Math.hypot(s[0]-e[0],s[1]-e[1]);errs.push([a,err]);
    const t=Math.max(0,Math.min(1,(Math.log10(Math.max(err,1e-9))+6)/6)); /* 1e-6 green ... 1 red */
    const hue=130-130*t;el('circle',{cx:LCX+x*LS,cy:LCY-y*LS,r:3.6,fill:`hsl(${hue} 85% ${dark()?58:44}%)`,stroke:halo,'stroke-width':1.2},svg);}
  const worst=Math.max(...errs.map(e=>e[1]));
  /* status banner */
  const msg=onB?T('|z| = 1: on the boundary, neither series converges','|z| = 1：境界上。どちらの級数も収束しない'):inner?T('inner annulus 0 < |z| < 1: powers z⁻¹, z⁰, z¹, …','内側の環状領域 0 < |z| < 1：べき z⁻¹, z⁰, z¹, …'):T('outer region |z| > 1: powers z⁻², z⁻³, …','外側の領域 |z| > 1：べき z⁻², z⁻³, …');
  const bw=Math.min(LW-28,msg.length*7.3*k+24);el('rect',{x:14,y:LH-14-26*k,width:bw,height:26*k,rx:8,fill:halo,'fill-opacity':.85},svg);
  el('text',{x:26,y:LH-14-8*k,fill:ink,'font-size':12.5*k},svg,msg);
  /* error strip */
  drawErrStrip(errs,onB,ring);
  /* readouts */
  if(onB){$('#laurentFormula').innerHTML=`|z| = 1<small>${T('both expansions diverge on the circle through the pole','極を通る円上では、どちらの展開も発散する')}</small>`;$('#laurentStatus').textContent=T('On the boundary','境界上');$('#laurentInsight').textContent=T('The circle passes through the pole at z = 1. Move a little inside or outside and one of the two series takes over.','円が z = 1 の極を通ります。少し内側か外側へ動かすと、どちらかの級数が成り立ちます。');}
  else if(inner){$('#laurentFormula').innerHTML=`f(z) = −Σ z<sup>n−1</sup><small>${T('valid when 0 &lt; |z| &lt; 1 · one negative power, the pole at 0','0 &lt; |z| &lt; 1 で有効 · 負のべきは1つ（z = 0 の極）')}</small>`;$('#laurentStatus').textContent=T('Inside the pole','極の内側');$('#laurentInsight').textContent=T('The circle stays in the inner annulus, so powers z⁻¹, z⁰, z¹, … are the natural coordinates. The error grows near z = 1, where the geometric series is slowest.','円は内側の環状領域にあるので、z⁻¹, z⁰, z¹, … が自然な座標です。等比級数の収束が最も遅い z = 1 の近くで誤差が大きくなります。');}
  else{$('#laurentFormula').innerHTML=`f(z) = Σ z<sup>−n−2</sup><small>${T('valid when |z| &gt; 1 · only negative powers at infinity','|z| &gt; 1 で有効 · 無限遠では負のべきのみ')}</small>`;$('#laurentStatus').textContent=T('Outside the pole','極の外側');$('#laurentInsight').textContent=T('The circle encloses both poles, so expand in 1/z: the tail is made only of negative powers, and it converges fastest far from z = 1.','円は2つの極を囲むので、1/z で展開します。末尾は負のべきだけで、z = 1 から遠いほど速く収束します。');}
  $('#laurentErr').textContent=onB?'∞':worst<1e-3?worst.toExponential(1):fmt(worst,3);
  $('#laurentTermsStat').textContent=terms;
}
function drawErrStrip(errs,onB,ring){
  const svg=$('#laurentErrSvg');svg.replaceChildren();const k=FK(svg),W=760,H=120,l=56,r=14,t=14*k,b=24*k,ink=col('--lb-ink'),mut=col('--lb-muted'),grid=col('--lb-grid');
  const lv=errs.map(e=>Math.log10(Math.max(e[1],1e-12)));let lo=Math.floor(Math.min(...lv)-0.3),hi=Math.ceil(Math.max(...lv)+0.3);if(hi-lo<2){lo-=1;hi+=1;}
  const X=a=>l+a/(2*Math.PI)*(W-l-r),Y=v=>t+(1-(Math.log10(Math.max(v,1e-12))-lo)/(hi-lo))*(H-t-b);
  const sup={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  const st=Math.max(1,Math.ceil((hi-lo)/4));
  for(let e=lo;e<=hi;e+=st){const v=Math.pow(10,e);el('line',{x1:l,x2:W-r,y1:Y(v),y2:Y(v),stroke:grid},svg);el('text',{x:l-6,y:Y(v)+4,'text-anchor':'end',fill:mut,'font-size':10*k},svg,e===0?'1':e===1?'10':e===2?'100':'10'+String(e).split('').map(c=>sup[c]).join(''));}
  [[0,'0'],[Math.PI/2,'π/2'],[Math.PI,'π'],[1.5*Math.PI,'3π/2'],[2*Math.PI,'2π']].forEach(([a,s2])=>el('text',{x:X(a),y:H-6,'text-anchor':'middle',fill:mut,'font-size':10*k},svg,s2));
  el('text',{x:l,y:10*k,fill:mut,'font-size':10*k},svg,T('error |S_N − f| around the circle, by angle θ (log scale)','円周上の誤差 |S_N − f|（角度 θ ごと、対数目盛）'));
  if(onB){svg.replaceChildren();el('text',{x:W/2,y:H/2,'text-anchor':'middle',fill:ink,'font-size':12*k},svg,T('no convergence on |z| = 1','|z| = 1 では収束しない'));return;}
  const d=errs.map((e,i)=>(i?'L':'M')+X(e[0]).toFixed(1)+','+Y(e[1]).toFixed(1)).join('');
  el('path',{d:d+`L${X(errs[errs.length-1][0])},${H-b}L${X(errs[0][0])},${H-b}Z`,fill:ring,'fill-opacity':.14},svg);
  el('path',{d,fill:'none',stroke:ring,'stroke-width':2},svg);
  const iw=errs.reduce((m,e,i)=>e[1]>errs[m][1]?i:m,0);el('circle',{cx:X(errs[iw][0]),cy:Y(errs[iw][1]),r:3.5,fill:ring},svg);
}
function sweep(){
  const b=$('#laurentSweep');
  if(sweeping){sweeping=false;b.setAttribute('aria-pressed','false');b.textContent=T('Sweep the radius','半径を走査');return;}
  sweeping=true;b.setAttribute('aria-pressed','true');b.textContent=T('Stop','停止');sweepT0=performance.now();
  const r0=+$('#radius').value;
  const step=now=>{if(!sweeping)return;const u=((now-sweepT0)/7000+Math.asin((r0-1.4)/1.15)/(2*Math.PI)+1)%1;const r=1.4+1.15*Math.sin(u*2*Math.PI);
    $('#radius').value=Math.round(r*100)/100;drawLaurent();requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

/* =====================  02  BESSEL  ===================== */
const BW=760,BH=470,bx0=64,by0=30,bw=664,bh=360,xMax=20,yMin=-.65,yMax=1.05;
const BX=x=>bx0+bw*x/xMax,BY=y=>by0+bh*(yMax-y)/(yMax-yMin);
let bModel=null;
function drawBessel(){
  const nu=+$('#nu').value,terms=+$('#besselTerms').value;$('#nuOut').value=fmt(nu,1);$('#besselTermsOut').value=terms;
  const svg=$('#besselSvg');svg.replaceChildren();const k=FK(svg);
  const ink=col('--lb-ink'),mut=col('--lb-muted'),grid=col('--lb-grid'),blue=col('--lb-blue'),orange=col('--lb-orange'),violet=col('--lb-violet'),plot=col('--lb-plot');
  el('rect',{width:BW,height:BH,fill:plot},svg);
  const defs=el('defs',null,svg),cp=el('clipPath',{id:'bclip'},defs);el('rect',{x:bx0,y:by0,width:bw,height:bh},cp);
  const lg=el('linearGradient',{id:'bfill',x1:0,y1:0,x2:0,y2:1},defs);el('stop',{offset:0,'stop-color':blue,'stop-opacity':.22},lg);el('stop',{offset:1,'stop-color':blue,'stop-opacity':0},lg);
  for(let i=0;i<=10;i++){const x=BX(i*2);el('line',{x1:x,y1:by0,x2:x,y2:by0+bh,stroke:grid},svg);el('text',{x,y:by0+bh+20,'text-anchor':'middle',fill:mut,'font-size':11*k},svg,String(i*2));}
  [-.5,0,.5,1].forEach(v=>{el('line',{x1:bx0,x2:bx0+bw,y1:BY(v),y2:BY(v),stroke:v===0?mut:grid,'stroke-width':v===0?1.2:1},svg);el('text',{x:bx0-10,y:BY(v)+4,'text-anchor':'end',fill:mut,'font-size':11*k},svg,v.toFixed(1));});
  el('text',{x:bx0+bw,y:by0+bh+38,'text-anchor':'end',fill:mut,'font-size':11},svg,'x');
  const N=500,xs=[],tr=[],rf=[];for(let i=0;i<=N;i++){const x=xMax*i/N;xs.push(x);tr.push(bessel(x,nu,terms));rf.push(besselRef(x,nu));}
  bModel={nu,terms,xs,tr,rf};
  const gc=el('g',{'clip-path':'url(#bclip)'},svg);
  /* where truncation has visibly failed */
  let xf=null;for(let i=0;i<=N;i++)if(Math.abs(tr[i]-rf[i])>0.02){xf=xs[i];break;}
  if(xf!==null){el('rect',{x:BX(xf),y:by0,width:bx0+bw-BX(xf),height:bh,fill:orange,'fill-opacity':.09},gc);
    el('line',{x1:BX(xf),x2:BX(xf),y1:by0,y2:by0+bh,stroke:orange,'stroke-dasharray':'3 4','stroke-width':1.2},gc);}
  /* envelope */
  const env=s=>{let d='';for(let i=0;i<=N;i++){const x=xs[i];if(x<0.8)continue;d+=(d?'L':'M')+BX(x).toFixed(1)+','+BY(s*Math.sqrt(2/(Math.PI*x))).toFixed(1);}return d;};
  [1,-1].forEach(s=>el('path',{d:env(s),fill:'none',stroke:violet,'stroke-width':1.3,'stroke-dasharray':'2 4','stroke-opacity':.9},gc));
  const path=a=>a.map((y,i)=>(i?'L':'M')+BX(xs[i]).toFixed(1)+','+BY(Math.max(-5,Math.min(5,y))).toFixed(1)).join('');
  el('path',{d:path(rf),fill:'none',stroke:ink,'stroke-width':1.4,'stroke-opacity':.45},gc);
  el('path',{d:path(tr)+`L${BX(xMax)},${BY(0)}L${BX(0)},${BY(0)}Z`,fill:'url(#bfill)'},gc);
  el('path',{d:path(tr),fill:'none',stroke:blue,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'},gc);
  /* zeros: filled = truncated series (counted), rings = reference zeros */
  const zt=[];for(let i=1;i<=N;i++)if(tr[i]*tr[i-1]<0)zt.push(xs[i]);
  const zr=zerosOf(nu,xMax,12);
  zr.forEach(x=>el('circle',{cx:BX(x),cy:BY(0),r:6.5,fill:'none',stroke:ink,'stroke-opacity':.55,'stroke-width':1.2},svg));
  zt.forEach(x=>el('circle',{cx:BX(x),cy:BY(0),r:4.2,fill:orange,stroke:plot,'stroke-width':1.2},svg));
  if(xf!==null){const t=T(`truncation error > 0.02 from x ≈ ${xf.toFixed(1)}`,`x ≈ ${xf.toFixed(1)} 以降で打ち切り誤差 > 0.02`);el('text',{x:Math.min(BX(xf)+8,bx0+bw-8),y:by0+18,'text-anchor':BX(xf)>bx0+bw-240?'end':'start',fill:orange,'font-size':11.5*k,'font-weight':600},svg,t);}
  el('text',{x:bx0+8,y:BH-12,fill:ink,'font-size':12.5*k},svg,`J${nu.toFixed(1)}(x) · ${terms} ${T('terms','項')} · ${zt.length} ${T('visible zero crossings','個の零点（表示範囲）')}`);
  el('line',{id:'bcross',x1:0,x2:0,y1:by0,y2:by0+bh,stroke:ink,'stroke-opacity':.5,visibility:'hidden'},svg);
  /* ledger and readouts */
  const ledger=$('#termLedger');ledger.innerHTML='';
  for(let m=0;m<Math.min(terms,8);m++){const v=((m%2?-1:1)*Math.pow(2,2*m+nu))/(factorial(m)*gamma(m+nu+1));const s=document.createElement('span');s.className='term '+(v<0?'neg':'pos');s.textContent=`m${m}: ${v.toExponential(1)}`;ledger.appendChild(s);}
  $('#zeroCount').textContent=zt.length;$('#zeroCap').textContent=T(`visible zero crossings at ν = ${nu.toFixed(1)}`,`ν = ${nu.toFixed(1)} で表示範囲にある零点の数`);
  $('#besselInsight').textContent=terms<7?T('The early terms capture the centre; the far oscillations are still being assembled.','初めの項は中心付近を捉えます。遠くの振動はまだ組み立て途中です。'):xf!==null?T(`Filled dots are zeros of the truncated series; rings are the true zeros. Past x ≈ ${xf.toFixed(1)} the truncated sum leaves the true curve, so add terms to push that edge right.`,`塗りの点は打ち切った級数の零点、輪は真の零点です。x ≈ ${xf.toFixed(1)} を過ぎると部分和が真の曲線から離れるので、項を増やすとその境界が右へ移ります。`):T('With this many terms the partial sum matches the true curve across the whole window; filled dots and rings coincide.','この項数なら、表示範囲全体で部分和が真の曲線と一致します。塗りの点と輪が重なります。');
}
function besselHover(ev){
  if(!bModel)return;const svg=$('#besselSvg'),r=svg.getBoundingClientRect(),sx=(ev.clientX-r.left)/r.width*BW;
  const tip=$('#besselTip'),cr=svg.querySelector('#bcross');
  if(sx<bx0||sx>bx0+bw){tip.classList.remove('on');cr.setAttribute('visibility','hidden');return;}
  const i=Math.round((sx-bx0)/bw*500),x=bModel.xs[i];
  cr.setAttribute('x1',BX(x));cr.setAttribute('x2',BX(x));cr.setAttribute('visibility','visible');
  tip.innerHTML=`x = ${x.toFixed(2)}<br>${T('series','部分和')} ${bModel.tr[i].toFixed(4)}<br>${T('true','真値')} ${bModel.rf[i].toFixed(4)}`;
  tip.classList.add('on');const left=(ev.clientX-r.left)+14;tip.style.left=(left>r.width-150?left-170:left)+'px';tip.style.top='14px';
}

/* =====================  03  MEMBRANE  ===================== */
const MEM={n:1,m:2,play:!RM.matches,t:0,az:-0.62,el:0.5,drag:null,vis:true,last:0,j:0,prof:null,zs:null};
const NR=30,NT=88;
function memSetup(){
  const z=zerosOf(MEM.n,24,MEM.m);MEM.zs=z;MEM.j=z[MEM.m-1];
  const prof=[];let mx=0;for(let i=0;i<=NR;i++){const v=besselRef(MEM.j*i/NR,MEM.n);prof.push(v);mx=Math.max(mx,Math.abs(v));}
  MEM.prof=prof.map(v=>v/mx);
  const j01=zerosOf(0,4,1)[0];
  $('#memJ').textContent=MEM.j.toFixed(4);$('#memRatio').textContent=(MEM.j/j01).toFixed(3);
  $('#memNodal').textContent=T(`${MEM.n} ${MEM.n===1?'diameter':'diameters'}, ${MEM.m-1} ${MEM.m-1===1?'circle':'circles'}`,`直径 ${MEM.n} 本、円 ${MEM.m-1} 本`);
  $('#memCap').innerHTML=T(`Mode (n, m) = (<b>${MEM.n}</b>, <b>${MEM.m}</b>). The radial shape is J<sub>${MEM.n}</sub>(j r) with j = j<sub>${MEM.n},${MEM.m}</sub> = ${MEM.j.toFixed(4)}, the ${['first','second','third'][MEM.m-1]} zero of J<sub>${MEM.n}</sub>, so the rim at r = 1 stays still. The white lines are nodes that never move. The drum sounds at ${(MEM.j/j01).toFixed(3)} times its fundamental, and because these ratios are not whole numbers a drum has no clean harmonic series.`,`モード (n, m) = (<b>${MEM.n}</b>, <b>${MEM.m}</b>)。半径方向の形は J<sub>${MEM.n}</sub>(j r) で、j = j<sub>${MEM.n},${MEM.m}</sub> = ${MEM.j.toFixed(4)} は J<sub>${MEM.n}</sub> の第${MEM.m}零点です。そのため r = 1 の縁は動きません。白い線は動かない節です。振動数は基本音の ${(MEM.j/j01).toFixed(3)} 倍で、この比が整数ではないため、太鼓にはきれいな倍音列がありません。`);
  ['#memN','#memM'].forEach((s,k)=>$(s).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===(k?MEM.m:MEM.n)))));
  drawProfile();
}
function drawProfile(){
  const svg=$('#memProfile');svg.replaceChildren();const W=300,H=110,l=8,r=8,t=10,b=18,ink=col('--lb-ink'),mut=col('--lb-muted'),blue=col('--lb-blue'),orange=col('--lb-orange');
  const xm=MEM.j*1.08,X=x=>l+x/xm*(W-l-r),Y=v=>t+(1-(v+0.65)/1.7)*(H-t-b);
  el('line',{x1:l,x2:W-r,y1:Y(0),y2:Y(0),stroke:mut,'stroke-opacity':.6},svg);
  let d='';for(let i=0;i<=160;i++){const x=xm*i/160;d+=(i?'L':'M')+X(x).toFixed(1)+','+Y(besselRef(x,MEM.n)).toFixed(1);}
  el('path',{d,fill:'none',stroke:blue,'stroke-width':2},svg);
  el('rect',{x:X(MEM.j),y:t,width:W-r-X(MEM.j),height:H-t-b,fill:mut,'fill-opacity':.12},svg);
  MEM.zs.forEach((z,k)=>{el('circle',{cx:X(z),cy:Y(0),r:k===MEM.m-1?4.5:3.2,fill:k===MEM.m-1?orange:'none',stroke:orange,'stroke-width':1.4},svg);});
  el('text',{x:X(MEM.j)-4,y:H-4,'text-anchor':'end',fill:ink,'font-size':10},svg,`j${MEM.n},${MEM.m} = ${MEM.j.toFixed(3)} → r = 1`);
  el('text',{x:l,y:H-4,fill:mut,'font-size':10},svg,`J${MEM.n}(x)`);
}
function hsv(h,s,v){const f=(n,k=(n+h/60)%6)=>v-v*s*Math.max(Math.min(k,4-k,1),0);return [f(5),f(3),f(1)];}
function drawMembrane(now){
  const cv=$('#memCanvas'),dpr=Math.min(2,window.devicePixelRatio||1),W=760,H=470;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const dk=dark();
  const bg=c.createRadialGradient(W*.5,H*.45,40,W*.5,H*.5,W*.7);bg.addColorStop(0,dk?'#1a2230':'#fbfbf8');bg.addColorStop(1,dk?'#0d1118':'#e9ebee');
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  const amp=0.34*Math.cos(MEM.t),cx=W/2,cy=H*0.56,S=Math.min(W,H)*0.6;
  const ca=Math.cos(MEM.az),sa=Math.sin(MEM.az),ce=Math.cos(MEM.el),se=Math.sin(MEM.el);
  const P=(x,y,z)=>{const x1=x*ca-y*sa,y1=x*sa+y*ca;return [cx+S*x1,cy-S*(y1*se+z*ce),y1*ce-z*se];};
  /* shadow on the ground */
  c.save();c.translate(cx,cy+S*0.55*ce+16);c.scale(1,0.22);const sg=c.createRadialGradient(0,0,10,0,0,S*1.05);sg.addColorStop(0,dk?'rgba(0,0,0,.55)':'rgba(30,35,45,.22)');sg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sg;c.beginPath();c.arc(0,0,S*1.05,0,7);c.fill();c.restore();
  /* vertices */
  const V=[];for(let i=0;i<=NR;i++){const r=i/NR,row=[];for(let k=0;k<=NT;k++){const th=k/NT*2*Math.PI,z=amp*MEM.prof[i]*Math.cos(MEM.n*th);row.push([r*Math.cos(th),r*Math.sin(th),z]);}V.push(row);}
  const quads=[];
  for(let i=0;i<NR;i++)for(let k=0;k<NT;k++){const a=V[i][k],b=V[i+1][k],cc=V[i+1][k+1],d=V[i][k+1];
    const pa=P(...a),pb=P(...b),pc=P(...cc),pd=P(...d);
    /* normal */
    const ux=cc[0]-a[0],uy=cc[1]-a[1],uz=cc[2]-a[2],vx=d[0]-b[0],vy=d[1]-b[1],vz=d[2]-b[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;if(nz<0){nx=-nx;ny=-ny;nz=-nz;}
    const zc=(a[2]+b[2]+cc[2]+d[2])/4;
    quads.push([(pa[2]+pb[2]+pc[2]+pd[2])/4,pa,pb,pc,pd,nx,ny,nz,zc]);}
  quads.sort((p,q)=>q[0]-p[0]);
  const L=[-0.45,-0.55,0.7],ll=Math.hypot(...L);L[0]/=ll;L[1]/=ll;L[2]/=ll;
  const Hh=[L[0],L[1]-0.0,L[2]+1];const hl=Math.hypot(...Hh);Hh[0]/=hl;Hh[1]/=hl;Hh[2]/=hl;
  for(const q of quads){const [,pa,pb,pc,pd,nx,ny,nz,zc]=q;
    const lam=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]),spec=Math.pow(Math.max(0,nx*Hh[0]+ny*Hh[1]+nz*Hh[2]),40);
    const u=Math.max(-1,Math.min(1,zc/0.34));
    /* diverging: cool below, warm above, pale membrane at rest */
    const hue=u>=0?28-8*u:212+8*(-u),sat=0.12+0.62*Math.abs(u),val=(dk?0.78:0.9);
    let [r,g,b]=hsv(hue,sat,val);const sh=0.38+0.62*lam;r=r*sh+spec*0.55;g=g*sh+spec*0.55;b=b*sh+spec*0.55;
    c.fillStyle=`rgb(${Math.min(255,r*255)|0},${Math.min(255,g*255)|0},${Math.min(255,b*255)|0})`;
    c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1]);c.lineTo(pc[0],pc[1]);c.lineTo(pd[0],pd[1]);c.closePath();c.fill();c.strokeStyle=c.fillStyle;c.lineWidth=.6;c.stroke();}
  /* nodal lines (they sit at z = 0 and never move) */
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.3;c.setLineDash([4,3]);
  for(let k=0;k<MEM.m-1;k++){const rr=MEM.zs[k]/MEM.j;c.beginPath();for(let s=0;s<=96;s++){const th=s/96*2*Math.PI,p=P(rr*Math.cos(th),rr*Math.sin(th),0);s?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();}
  for(let k=0;k<MEM.n;k++){const th=(k+.5)*Math.PI/MEM.n,p1=P(Math.cos(th),Math.sin(th),0),p2=P(-Math.cos(th),-Math.sin(th),0);c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.stroke();}
  c.setLineDash([]);
  /* rim: a turned metal hoop */
  for(const [w,colr] of [[7,dk?'#2a2f37':'#55595f'],[4,dk?'#9aa3ae':'#c9cdd2'],[1.2,'rgba(255,255,255,.8)']]){c.strokeStyle=colr;c.lineWidth=w;c.beginPath();for(let s=0;s<=128;s++){const th=s/128*2*Math.PI,p=P(Math.cos(th),Math.sin(th),0);s?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();}
  c.fillStyle=dk?'#c9d2dd':'#3b4350';c.font="500 12px 'DM Mono', monospace";c.fillText(`(n, m) = (${MEM.n}, ${MEM.m})`,18,26);
  c.fillStyle=dk?'#8f9aa8':'#6a7380';c.font="11px 'DM Mono', monospace";c.fillText(T('drag to turn','ドラッグで回転'),18,H-16);
}
function memLoop(now){
  if(MEM.play&&MEM.vis){const dt=Math.min(0.05,(now-(MEM.last||now))/1000);MEM.t+=dt*2.4*MEM.j/4.8;}
  MEM.last=now;
  if(MEM.vis&&(MEM.play||MEM.dirty)){drawMembrane(now);MEM.dirty=false;}
  requestAnimationFrame(memLoop);
}

/* =====================  language, theme, wiring  ===================== */
function texts(){
  document.querySelectorAll('[data-'+lang+']').forEach(e=>e.innerHTML=e.dataset[lang]);
  $('#enBtn').setAttribute('aria-pressed',String(lang==='en'));$('#jaBtn').setAttribute('aria-pressed',String(lang==='ja'));
  $('#laurentSweep').textContent=sweeping?T('Stop','停止'):T('Sweep the radius','半径を走査');
  $('#memPlay').textContent=MEM.play?T('Pause','一時停止'):T('Play','再生');
}
function setLang(next){lang=next;document.documentElement.lang=next;texts();drawAll();if(window.MathJax&&MathJax.typesetPromise)MathJax.typesetPromise().catch(()=>{});}
function drawAll(){domainKey='';drawLaurent();drawBessel();memSetup();MEM.dirty=true;}
['radius','laurentTerms'].forEach(id=>$('#'+id).addEventListener('input',drawLaurent));
['nu','besselTerms'].forEach(id=>$('#'+id).addEventListener('input',drawBessel));
$('#laurentSweep').addEventListener('click',sweep);
$('#besselSvg').addEventListener('pointermove',besselHover);
$('#besselSvg').addEventListener('pointerleave',()=>{$('#besselTip').classList.remove('on');const c=$('#bcross');if(c)c.setAttribute('visibility','hidden');});
$('#memN').addEventListener('click',e=>{const b=e.target.closest('button');if(b){MEM.n=+b.dataset.v;memSetup();MEM.dirty=true;}});
$('#memM').addEventListener('click',e=>{const b=e.target.closest('button');if(b){MEM.m=+b.dataset.v;memSetup();MEM.dirty=true;}});
$('#memPlay').addEventListener('click',()=>{MEM.play=!MEM.play;$('#memPlay').setAttribute('aria-pressed',String(MEM.play));texts();MEM.dirty=true;});
const mc=$('#memCanvas');
mc.addEventListener('pointerdown',e=>{MEM.drag=[e.clientX,e.clientY,MEM.az,MEM.el];mc.setPointerCapture(e.pointerId);});
mc.addEventListener('pointermove',e=>{if(!MEM.drag)return;const r=mc.getBoundingClientRect(),k=760/r.width;MEM.az=MEM.drag[2]+(e.clientX-MEM.drag[0])*k*0.008;MEM.el=Math.max(0.15,Math.min(1.25,MEM.drag[3]+(e.clientY-MEM.drag[1])*k*0.006));MEM.dirty=true;});
mc.addEventListener('pointerup',()=>{MEM.drag=null;});
mc.addEventListener('keydown',e=>{const s=0.12;if(e.key==='ArrowLeft')MEM.az-=s;else if(e.key==='ArrowRight')MEM.az+=s;else if(e.key==='ArrowUp')MEM.el=Math.min(1.25,MEM.el+s/2);else if(e.key==='ArrowDown')MEM.el=Math.max(.15,MEM.el-s/2);else return;e.preventDefault();MEM.dirty=true;});
if('IntersectionObserver' in window)new IntersectionObserver(es=>es.forEach(en=>{MEM.vis=en.isIntersecting;if(MEM.vis)MEM.dirty=true;}),{rootMargin:'100px'}).observe(mc);
RM.addEventListener&&RM.addEventListener('change',()=>{if(RM.matches){MEM.play=false;sweeping=false;texts();MEM.dirty=true;}});
$('#enBtn').onclick=()=>setLang('en');$('#jaBtn').onclick=()=>setLang('ja');
new MutationObserver(()=>{drawAll();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(RM.matches){$('#laurentSweep').disabled=true;MEM.t=0;}
$('#memPlay').setAttribute('aria-pressed',String(MEM.play));
let rzT=0,rzW=innerWidth;addEventListener('resize',()=>{clearTimeout(rzT);rzT=setTimeout(()=>{if(innerWidth!==rzW){rzW=innerWidth;drawLaurent();drawBessel();}},150);});
texts();drawAll();requestAnimationFrame(memLoop);
})();
