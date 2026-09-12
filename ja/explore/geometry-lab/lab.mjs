import * as math from '/explore/geometry-lab/models.mjs';
const root=document.getElementById('geometry-lab');
const $=id=>root.querySelector('#'+id);
const fmt=(n,d=3)=>Number(n.toFixed(d)).toLocaleString('ja-JP',{maximumFractionDigits:d});
const field=(key,label,min,max,step,value,unit='')=>({key,label,min,max,step,value,unit});
const result=(label,value,unit='')=>({label,value,unit});
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let shapes=[];
const line=(x1,y1,x2,y2,cls='dimension')=>shapes.push(`<path class="${cls}" d="M${x1},${y1}L${x2},${y2}"/>`);
const path=(d,cls='figure')=>shapes.push(`<path class="${cls}" d="${d}"/>`);
const poly=(p,cls='figure')=>shapes.push(`<polygon class="${cls}" points="${p.map(v=>v.join(',')).join(' ')}"/>`);
const ellipse=(cx,cy,rx,ry,cls='figure')=>shapes.push(`<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`);
const text=(x,y,s,anchor='middle',cls='')=>shapes.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${escape(s)}</text>`);
const rightAngle=(x,y,size=9)=>path(`M${x} ${y-size}h${size}v${size}`,'dimension');
function grid(w,h){for(let x=20;x<w;x+=25)line(x,10,x,h-10,'grid-line');for(let y=20;y<h;y+=25)line(12,y,w-12,y,'grid-line');}
function cube(x,y,size,cls='figure'){
 const dx=.38*size,dy=-.3*size;
 poly([[x,y],[x+size,y],[x+size,y-size],[x,y-size]],cls);
 poly([[x,y-size],[x+dx,y-size+dy],[x+size+dx,y-size+dy],[x+size,y-size]],cls);
 poly([[x+size,y],[x+size+dx,y+dy],[x+size+dx,y-size+dy],[x+size,y-size]],cls);
}
const experiments=[
 {id:'triangle',tab:"三角形の面積",title:"高さが同じなら、面積も同じ",description:"頂点を左右に動かしてみましょう。周の長さは変わっても、面積は変わりません。",fields:[field('b',"底辺 b",2,10,.1,6,"単位"),field('h',"垂直な高さ h",1,8,.1,4,"単位"),field('x',"頂点の横位置 x",-3,12,.1,2,"単位")],calc:math.triangle,
  results:(p,m)=>[result("面積",m.area,"平方単位"),result("周の長さ",m.perimeter,"単位"),result("高さ",p.h,"単位")],formulas:'A = ½bh<br>P = b + √(x² + h²) + √((b − x)² + h²)',insight:"b と h を固定し、x を動かしてください。高さを示す垂線が三角形の外側に出ても、面積は同じです。",condition:"x は底辺の左端から測った水平方向の距離です。破線は底辺に垂直な高さを示します。",caption:"寸法を変えても、図の縮尺は変わりません。",
  draw(p,m,w,h){const u=Math.min((w-90)/15,(h-70)/8),x0=(w-15*u)/2+3*u,y0=h-40;grid(w,h);poly([[x0,y0],[x0+p.b*u,y0],[x0+p.x*u,y0-p.h*u]]);line(x0+p.x*u,y0,x0+p.x*u,y0-p.h*u,'guide');if(p.x<0)line(x0+p.x*u,y0,x0,y0,'guide');if(p.x>p.b)line(x0+p.b*u,y0,x0+p.x*u,y0,'guide');rightAngle(x0+p.x*u,y0,7);text(x0+p.b*u/2,y0+26,`b = ${fmt(p.b)}`);text(x0+p.x*u+13,y0-p.h*u/2,`h = ${fmt(p.h)}`,'start');text(x0+p.x*u,y0-p.h*u-14,`x = ${fmt(p.x)}`);}
 },
 {id:'pythagoras',tab:"三平方の定理",title:"三つの正方形で見る三平方の定理",description:"直角を挟む二辺を変えてみましょう。斜辺上の正方形の面積は、他の二つの正方形の面積の和に等しくなります。",fields:[field('a',"横の直角辺 a",1,8,.1,3,"単位"),field('b',"縦の直角辺 b",1,8,.1,4,"単位")],calc:math.pythagoras,results:(p,m)=>[result('a²',m.a2,"平方単位"),result('b²',m.b2,"平方単位"),result('c²',m.c2,"平方単位")],formulas:'a² + b² = c²<br>c = √(a² + b²)',insight:"a = 3、b = 4 にすると、三つの正方形の面積は 9、16、25 になります。したがって斜辺の長さは 5 単位です。",condition:"この定理が成り立つのは直角三角形です。図は表示領域に収まるように拡大・縮小されます。",caption:"a² の正方形は三角形の下、b² は左、c² は斜辺上にあります。",
  draw(p,m,w,h){const {a,b}=p,u=Math.min((w-55)/(a+2*b),(h-50)/(2*a+b)),X=x=>(w-(a+2*b)*u)/2+(x+b)*u,Y=y=>(h-(2*a+b)*u)/2+(a+b-y)*u,T=ps=>ps.map(([x,y])=>[X(x),Y(y)]);poly(T([[0,0],[a,0],[a,-a],[0,-a]]),'second');poly(T([[0,0],[0,b],[-b,b],[-b,0]]),'third');poly(T([[a,0],[0,b],[b,a+b],[a+b,a]]));poly(T([[0,0],[a,0],[0,b]]),'dimension');rightAngle(X(0),Y(0),8);if(a*u>27)text(X(a/2),Y(-a/2)+5,'a²');if(b*u>27)text(X(-b/2),Y(b/2)+5,'b²');text(X((a+b)/2),Y((a+b)/2)+5,`c² = ${fmt(m.c2)}`);text(w/2,h-4,`c = ${fmt(m.c)} 単位`);}
 },
 {id:'circle',tab:"扇形",title:"中心角が円のどれだけを切り取るか",description:"半径と中心角を変えて、弧の長さ、弦の長さ、扇形の面積を比べてみましょう。",fields:[field('r',"半径 r",1,8,.1,4,"単位"),field('angle',"中心角 θ",15,180,1,90,'°')],calc:math.sector,results:(p,m)=>[result("弧の長さ L",m.arc,"単位"),result("扇形の面積",m.area,"平方単位"),result("弦の長さ c",m.chord,"単位")],formulas:'θ<sub>rad</sub> = θ<sub>deg</sub> × π / 180<br>L = rθ<sub>rad</sub> &nbsp; · &nbsp; A = ½r²θ<sub>rad</sub><br>c = 2r sin(θ / 2)',insight:"半径を固定して角度を 2 倍にすると、弧の長さと扇形の面積は 2 倍になります。角度を固定して半径を 2 倍にすると、弧の長さは 2 倍、面積は 4 倍になります。",condition:"表示された角度を正弦の式に代入するときは、度数法を使います。L は曲線部分である弧の長さです。扇形全体の周の長さは L + 2r です。",caption:"青い領域が扇形、破線の直線が弦です。L は曲線部分である弧を示します。",
  draw(p,m,w,h){const u=Math.min((w-70)/16,(h-75)/16),r=p.r*u,cx=w/2,cy=(h-25)/2,t=m.theta/2,dx=r*Math.cos(t),dy=r*Math.sin(t);ellipse(cx,cy,r,r,'guide');path(`M${cx} ${cy}L${cx+dx} ${cy-dy}A${r} ${r} 0 0 1 ${cx+dx} ${cy+dy}Z`);line(cx+dx,cy-dy,cx+dx,cy+dy,'guide');const ar=Math.min(25,r*.3);path(`M${cx+ar*Math.cos(t)} ${cy-ar*Math.sin(t)}A${ar} ${ar} 0 0 1 ${cx+ar*Math.cos(t)} ${cy+ar*Math.sin(t)}`,'dimension');text(cx,Math.max(18,cy-r-15),`θ = ${fmt(p.angle)}°`);if(r>42&&p.angle>55)text(cx+dx+7,cy-9,'c','start');text(cx+r+13,cy+4,'L','start');text(cx,cy+r+28,`r = ${fmt(p.r)} 単位`);}
 },
 {id:'polygon',tab:"正多角形",title:"三角形を増やすと円に近づく",description:"外接円の半径を固定して、辺の数を増やしてみましょう。",fields:[field('n',"辺の数 n",3,16,1,6),field('r',"外接円の半径 R",1,8,.1,4,"単位")],calc:math.polygon,results:(p,m)=>[result("面積",m.area,"平方単位"),result("周の長さ",m.perimeter,"単位"),result("内接円の半径 q",m.apothem,"単位")],formulas:'a = 2R sin(π/n)<br>q = R cos(π/n) &nbsp; · &nbsp; P = na<br>A = ½Pq = ½nR² sin(2π/n)',insight:"R を固定して n を増やすと、正多角形は円の内部をより多く埋めるようになります。面積は πR² に、周の長さは 2πR に近づきます。",condition:"正多角形は辺の長さと内角がすべて等しい図形です。q は中心から辺に下ろした垂線の長さです。これらの式の角度にはラジアンを使います。",caption:"破線の円はすべての頂点を通ります。中心と一つの辺でできる三角形の面積は、それぞれ ½aq です。",
  draw(p,m,w,h){const u=Math.min((w-82)/16,(h-80)/16),r=p.r*u,cx=w/2,cy=(h-24)/2,verts=Array.from({length:p.n},(_,i)=>[cx+r*Math.cos(-Math.PI/2+2*Math.PI*i/p.n),cy+r*Math.sin(-Math.PI/2+2*Math.PI*i/p.n)]);ellipse(cx,cy,r,r,'guide');poly(verts);for(const [x,y] of verts)line(cx,cy,x,y,'guide');const mid=[(verts[0][0]+verts[1][0])/2,(verts[0][1]+verts[1][1])/2];line(cx,cy,...mid);if(r>40){text((cx+mid[0])/2-8,(cy+mid[1])/2+3,'q','end');const vx=mid[0]-cx,vy=mid[1]-cy,len=Math.hypot(vx,vy);text(mid[0]+18*vx/len,mid[1]+18*vy/len,'a');}text(cx,cy+r+27,`a = ${fmt(m.side)} · R = ${fmt(p.r)}`);}
 },
 {id:'cone',tab:"円錐",title:"垂直な高さと母線の長さを区別する",description:"半径と高さを変えて、体積、側面積、表面積を比べてみましょう。",fields:[field('r',"半径 r",1,6,.1,3,"単位"),field('h',"垂直な高さ h",1,10,.1,4,"単位")],calc:math.cone,results:(p,m)=>[result("体積",m.volume,"立方単位"),result("側面積",m.curved,"平方単位"),result("表面積",m.total,"平方単位")],formulas:'ℓ = √(r² + h²)<br>V = ⅓πr²h<br>L = πrℓ &nbsp; · &nbsp; S = πrℓ + πr²',insight:"半径を固定して高さを 2 倍にすると、体積は 2 倍になります。側面積は母線の長さに依存するため、同じ倍率では増えません。",condition:"図は直円錐です。表面積には円形の底面も含みます。",caption:"垂直な破線が高さ h、斜めの辺が母線の長さ ℓ です。",
  draw(p,m,w,h){const u=Math.min((w-110)/12,(h-78)/11.3),cx=w/2,by=h-58,r=p.r*u,top=by-p.h*u,ry=r*.23;path(`M${cx-r} ${by}L${cx} ${top}L${cx+r} ${by}A${r} ${ry} 0 0 1 ${cx-r} ${by}`);path(`M${cx-r} ${by}A${r} ${ry} 0 0 1 ${cx+r} ${by}`,'guide');line(cx,by,cx,top,'guide');line(cx,by,cx+r,by);rightAngle(cx,by,6);text(cx-13,(by+top)/2,`h = ${fmt(p.h)}`,'end');text(cx+r/2+15,(by+top)/2-8,`ℓ = ${fmt(m.slant)}`,'start');text(cx+r/2,by+ry+23,`r = ${fmt(p.r)}`);}
 },
 {id:'solids',tab:"円柱と球",title:"同じ半径でも、体積は異なる",description:"半径が同じ球と、上下の底面を含む円柱を比べてみましょう。",fields:[field('r',"共通の半径 r",1,6,.1,3,"単位"),field('h',"円柱の高さ h",1,12,.1,6,"単位")],calc:math.solids,results:(p,m)=>[result("円柱の体積",m.cylinder,"立方単位"),result("球の体積",m.sphere,"立方単位"),result("球と円柱の体積比",m.volumeRatio,'倍')],formulas:'V<sub>円柱</sub> = πr²h<br>V<sub>球</sub> = ⁴⁄₃πr³<br>V<sub>球</sub> / V<sub>円柱</sub> = 4r / (3h)',insight:"h = 2r にすると、球が円柱の内部にぴったり収まります。このとき球の体積は、円柱の体積の 3 分の 2 になります。",condition:"h を変えると円柱だけが変わります。共通の半径 r を変えると、両方の立体が変わります。",caption:"二つの立体は同じ縮尺で描かれ、半径も同じ r です。",height:w=>w<480?540:340,
  draw(p,m,w,h){const stacked=w<480,regionH=stacked?h/2:h,regionW=stacked?w:w/2,u=Math.min((regionW-78)/12,(regionH-85)/13.5),r=p.r*u,ry=r*.22,x1=stacked?w/2:w/4,x2=stacked?w/2:3*w/4,by=regionH-53,top=by-p.h*u; text(x1,20,"円柱");path(`M${x1-r} ${top}V${by}A${r} ${ry} 0 0 0 ${x1+r} ${by}V${top}Z`);ellipse(x1,top,r,ry);path(`M${x1-r} ${by}A${r} ${ry} 0 0 1 ${x1+r} ${by}`,'guide');line(x1-r-13,top,x1-r-13,by);text(x1-r-19,(top+by)/2+4,'h','end');text(x1,by+ry+23,`r = ${fmt(p.r)}`);const off=stacked?regionH:0,sy=off+by-r;text(x2,off+20,"球");ellipse(x2,sy,r,r,'second');ellipse(x2,sy,r,ry,'guide');line(x2,sy,x2+r,sy);text(x2,sy+r+26,`r = ${fmt(p.r)}`);}
 },
 {id:'scale',tab:"相似と拡大・縮小",title:"長さ・面積・体積の増え方",description:"すべての長さを同じ倍率で拡大すると、面積と体積はそれぞれ異なる倍率で増えます。",fields:[field('k',"長さの倍率 k",.5,3,.1,2,'×')],calc:math.scale,results:(p,m)=>[result("長さの倍率",m.length,'×'),result("面積の倍率",m.area,'×'),result("体積の倍率",m.volume,'×')],formulas:'拡大後の長さ = k × 元の長さ<br>拡大後の面積 = k² × 元の面積<br>拡大後の体積 = k³ × 元の体積',insight:"k = 2 にすると、すべての長さが 2 倍になり、面積は 4 倍、体積は 8 倍になります。長さを半分にすると、面積は 4 分の 1、体積は 8 分の 1 になります。",condition:"対応するすべての長さを同じ倍率で変える必要があります。この規則は相似な平面図形と立体に成り立ちます。",caption:"破線は元の単位図形、塗りつぶされた図形は拡大・縮小後の図形です。",
  draw(p,m,w,h){const u=Math.min((w/2-42)/(3*1.38),(h-95)/(3*1.3)),s=u*p.k,by=h-42,x1=20,x2=w/2+10;text(w/4,23,"正方形");text(3*w/4,23,"立方体");poly([[x1,by],[x1+s,by],[x1+s,by-s],[x1,by-s]]);poly([[x1,by],[x1+u,by],[x1+u,by-u],[x1,by-u]],'guide');cube(x2,by,s,'second');cube(x2,by,u,'guide');text(x1+s/2,by+26,`k = ${fmt(p.k)}`);text(x2+s*.69,by+26,`k = ${fmt(p.k)}`);if(s>48){text(x1+s/2,by-s/2+5,'k²');text(x2+s/2,by-s/2+5,'k³');}}
 },
];

const state=new Map(experiments.map(e=>[e.id,Object.fromEntries(e.fields.map(f=>[f.key,f.value]))]));
let active=experiments[0];
let announceTimer;
function update(announce=true){
 const p=state.get(active.id),m=active.calc(p);
 for(const f of active.fields)$(`value-${f.key}`).textContent=`${fmt(p[f.key])}${f.unit?' '+f.unit:''}`;
 const values=active.results(p,m);$('lab-results').innerHTML=values.map(v=>`<div class="result"><dt>${escape(v.label)}</dt><dd>${fmt(v.value)}<small>${escape(v.unit)}</small></dd></div>`).join('');
 const width=$('lab-svg').parentElement.clientWidth,height=active.height?active.height(width):340;
 shapes=[];active.draw(p,m,width,height);
 $('lab-svg').setAttribute('viewBox',`0 0 ${width} ${height}`);
 $('lab-svg').innerHTML=`<title id="diagram-title">${escape(active.title)}</title><desc id="diagram-desc">${escape(values.map(v=>`${v.label}: ${fmt(v.value)} ${v.unit}`).join('. '))}</desc>`+shapes.join('');
 if(announce){clearTimeout(announceTimer);announceTimer=setTimeout(()=>{$('live-results').textContent=values.map(v=>`${v.label} ${fmt(v.value)} ${v.unit}`).join(', ');},220);}
}
function select(id,focus=false){
 active=experiments.find(e=>e.id===id)||experiments[0];
 for(const button of $('lab-tabs').querySelectorAll('button')){const selected=button.id===`tab-${active.id}`;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}
 $('lab-panel').setAttribute('aria-labelledby',`tab-${active.id}`);
 $('experiment-title').textContent=active.title;$('experiment-description').textContent=active.description;
 $('lab-formulas').innerHTML=active.formulas;$('lab-insight').textContent=active.insight;$('lab-condition').textContent=active.condition;$('diagram-caption').textContent=active.caption;
 $('lab-controls').innerHTML=active.fields.map(f=>`<div class="control"><label for="control-${f.key}"><span>${escape(f.label)}</span><output id="value-${f.key}" for="control-${f.key}"></output></label><input id="control-${f.key}" data-key="${f.key}" type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.get(active.id)[f.key]}"></div>`).join('');
 for(const input of $('lab-controls').querySelectorAll('input'))input.addEventListener('input',()=>{state.get(active.id)[input.dataset.key]=Number(input.value);update();});
 if(focus)$(`tab-${active.id}`).focus();update(false);
}
$('lab-tabs').innerHTML=experiments.map(e=>`<button type="button" role="tab" id="tab-${e.id}" aria-controls="lab-panel" aria-selected="false">${escape(e.tab)}</button>`).join('');
$('lab-tabs').addEventListener('click',e=>{const id=e.target.closest('button')?.id?.slice(4);if(id){select(id);history.replaceState(null,'',`#${id}`);}});
$('lab-tabs').addEventListener('keydown',e=>{const index=experiments.indexOf(active);let next;if(e.key==='ArrowRight')next=(index+1)%experiments.length;if(e.key==='ArrowLeft')next=(index+experiments.length-1)%experiments.length;if(e.key==='Home')next=0;if(e.key==='End')next=experiments.length-1;if(next!==undefined){e.preventDefault();select(experiments[next].id,true);history.replaceState(null,'',`#${active.id}`);}});
select(location.hash.slice(1));window.addEventListener('hashchange',()=>select(location.hash.slice(1)));
new ResizeObserver(()=>update(false)).observe($('lab-svg').parentElement);
