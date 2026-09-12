import * as math from './models.mjs';
const root=document.getElementById('geometry-lab');
const $=id=>root.querySelector('#'+id);
const fmt=(n,d=3)=>Number(n.toFixed(d)).toLocaleString('en',{maximumFractionDigits:d});
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
 {id:'triangle',tab:'Triangle area',title:'Same height, same area',description:'Move the apex sideways. Watch the area stay fixed while the perimeter changes.',fields:[field('b','Base b',2,10,.1,6,'units'),field('h','Height h',1,8,.1,4,'units'),field('x','Apex position x',-3,12,.1,2,'units')],calc:math.triangle,
  results:(p,m)=>[result('Area',m.area,'units²'),result('Perimeter',m.perimeter,'units'),result('Height',p.h,'units')],formulas:'A = ½bh<br>P = b + √(x² + h²) + √((b − x)² + h²)',insight:'Hold b and h fixed, then slide x. Every triangle has the same area, even when the perpendicular height falls outside it.',condition:'x is measured horizontally from the left end of the base. The dashed line is perpendicular height.',caption:'The scale stays fixed as you change the measurements.',
  draw(p,m,w,h){const u=Math.min((w-90)/15,(h-70)/8),x0=(w-15*u)/2+3*u,y0=h-40;grid(w,h);poly([[x0,y0],[x0+p.b*u,y0],[x0+p.x*u,y0-p.h*u]]);line(x0+p.x*u,y0,x0+p.x*u,y0-p.h*u,'guide');if(p.x<0)line(x0+p.x*u,y0,x0,y0,'guide');if(p.x>p.b)line(x0+p.b*u,y0,x0+p.x*u,y0,'guide');rightAngle(x0+p.x*u,y0,7);text(x0+p.b*u/2,y0+26,`b = ${fmt(p.b)}`);text(x0+p.x*u+13,y0-p.h*u/2,`h = ${fmt(p.h)}`,'start');text(x0+p.x*u,y0-p.h*u-14,`x = ${fmt(p.x)}`);}
 },
 {id:'pythagoras',tab:'Pythagoras',title:'Three squares, one identity',description:'Change the two legs. The square on the hypotenuse always equals the sum of the other two squares.',fields:[field('a','Horizontal leg a',1,8,.1,3,'units'),field('b','Vertical leg b',1,8,.1,4,'units')],calc:math.pythagoras,results:(p,m)=>[result('a²',m.a2,'units²'),result('b²',m.b2,'units²'),result('c²',m.c2,'units²')],formulas:'a² + b² = c²<br>c = √(a² + b²)',insight:'Set a = 3 and b = 4. The square areas are 9, 16 and 25, so the hypotenuse is 5 units long.',condition:'The theorem applies to right triangles. The diagram is fitted to the available space.',caption:'The a² square is below the triangle; b² is to its left; c² lies on the hypotenuse.',
  draw(p,m,w,h){const {a,b}=p,u=Math.min((w-55)/(a+2*b),(h-50)/(2*a+b)),X=x=>(w-(a+2*b)*u)/2+(x+b)*u,Y=y=>(h-(2*a+b)*u)/2+(a+b-y)*u,T=ps=>ps.map(([x,y])=>[X(x),Y(y)]);poly(T([[0,0],[a,0],[a,-a],[0,-a]]),'second');poly(T([[0,0],[0,b],[-b,b],[-b,0]]),'third');poly(T([[a,0],[0,b],[b,a+b],[a+b,a]]));poly(T([[0,0],[a,0],[0,b]]),'dimension');rightAngle(X(0),Y(0),8);if(a*u>27)text(X(a/2),Y(-a/2)+5,'a²');if(b*u>27)text(X(-b/2),Y(b/2)+5,'b²');text(X((a+b)/2),Y((a+b)/2)+5,`c² = ${fmt(m.c2)}`);text(w/2,h-4,`c = ${fmt(m.c)} units`);}
 },
 {id:'circle',tab:'Circle sector',title:'An angle cuts out a fraction',description:'Change the radius and central angle to compare arc length, chord length and sector area.',fields:[field('r','Radius r',1,8,.1,4,'units'),field('angle','Central angle θ',15,180,1,90,'°')],calc:math.sector,results:(p,m)=>[result('Arc length L',m.arc,'units'),result('Sector area',m.area,'units²'),result('Chord c',m.chord,'units')],formulas:'θ<sub>rad</sub> = θ<sub>deg</sub> × π / 180<br>L = rθ<sub>rad</sub> &nbsp; · &nbsp; A = ½r²θ<sub>rad</sub><br>c = 2r sin(θ / 2)',insight:'Double the angle with the radius fixed: arc length and sector area double. Double the radius instead: arc length doubles and area quadruples.',condition:'Use degree mode for the displayed angle in the sine formula. L is the curved arc, not the whole sector perimeter; that perimeter is L + 2r.',caption:'Blue fill: sector. Dashed straight line: chord. L marks the curved arc.',
  draw(p,m,w,h){const u=Math.min((w-70)/16,(h-75)/16),r=p.r*u,cx=w/2,cy=(h-25)/2,t=m.theta/2,dx=r*Math.cos(t),dy=r*Math.sin(t);ellipse(cx,cy,r,r,'guide');path(`M${cx} ${cy}L${cx+dx} ${cy-dy}A${r} ${r} 0 0 1 ${cx+dx} ${cy+dy}Z`);line(cx+dx,cy-dy,cx+dx,cy+dy,'guide');const ar=Math.min(25,r*.3);path(`M${cx+ar*Math.cos(t)} ${cy-ar*Math.sin(t)}A${ar} ${ar} 0 0 1 ${cx+ar*Math.cos(t)} ${cy+ar*Math.sin(t)}`,'dimension');text(cx,Math.max(18,cy-r-15),`θ = ${fmt(p.angle)}°`);if(r>42&&p.angle>55)text(cx+dx+7,cy-9,'c','start');text(cx+r+13,cy+4,'L','start');text(cx,cy+r+28,`r = ${fmt(p.r)} units`);}
 },
 {id:'polygon',tab:'Regular polygon',title:'From triangles toward a circle',description:'Increase the number of sides while keeping the circumradius fixed.',fields:[field('n','Number of sides n',3,16,1,6),field('r','Circumradius R',1,8,.1,4,'units')],calc:math.polygon,results:(p,m)=>[result('Area',m.area,'units²'),result('Perimeter',m.perimeter,'units'),result('Apothem q',m.apothem,'units')],formulas:'a = 2R sin(π/n)<br>q = R cos(π/n) &nbsp; · &nbsp; P = na<br>A = ½Pq = ½nR² sin(2π/n)',insight:'Hold R fixed and increase n. The polygon fills more of the circle; its area approaches πR² and its perimeter approaches 2πR.',condition:'A regular polygon has equal sides and equal angles. q is the perpendicular distance from the centre to a side. Angles in these formulas are radians.',caption:'The dashed circle passes through every vertex. Each centre-to-side triangle contributes ½aq.',
  draw(p,m,w,h){const u=Math.min((w-82)/16,(h-80)/16),r=p.r*u,cx=w/2,cy=(h-24)/2,verts=Array.from({length:p.n},(_,i)=>[cx+r*Math.cos(-Math.PI/2+2*Math.PI*i/p.n),cy+r*Math.sin(-Math.PI/2+2*Math.PI*i/p.n)]);ellipse(cx,cy,r,r,'guide');poly(verts);for(const [x,y] of verts)line(cx,cy,x,y,'guide');const mid=[(verts[0][0]+verts[1][0])/2,(verts[0][1]+verts[1][1])/2];line(cx,cy,...mid);if(r>40){text((cx+mid[0])/2-8,(cy+mid[1])/2+3,'q','end');const vx=mid[0]-cx,vy=mid[1]-cy,len=Math.hypot(vx,vy);text(mid[0]+18*vx/len,mid[1]+18*vy/len,'a');}text(cx,cy+r+27,`a = ${fmt(m.side)} · R = ${fmt(p.r)}`);}
 },
 {id:'cone',tab:'Cone',title:'Height is not slant height',description:'Change radius and height to compare volume, curved area and total area.',fields:[field('r','Radius r',1,6,.1,3,'units'),field('h','Height h',1,10,.1,4,'units')],calc:math.cone,results:(p,m)=>[result('Volume',m.volume,'units³'),result('Curved area',m.curved,'units²'),result('Total area',m.total,'units²')],formulas:'ℓ = √(r² + h²)<br>V = ⅓πr²h<br>L = πrℓ &nbsp; · &nbsp; S = πrℓ + πr²',insight:'Keep the radius fixed and double the height. Volume doubles; curved area changes by a different factor because it depends on slant height.',condition:'This is a right circular cone. Total surface area includes the circular base.',caption:'The vertical dashed line is h; the sloping side is ℓ.',
  draw(p,m,w,h){const u=Math.min((w-110)/12,(h-78)/11.3),cx=w/2,by=h-58,r=p.r*u,top=by-p.h*u,ry=r*.23;path(`M${cx-r} ${by}L${cx} ${top}L${cx+r} ${by}A${r} ${ry} 0 0 1 ${cx-r} ${by}`);path(`M${cx-r} ${by}A${r} ${ry} 0 0 1 ${cx+r} ${by}`,'guide');line(cx,by,cx,top,'guide');line(cx,by,cx+r,by);rightAngle(cx,by,6);text(cx-13,(by+top)/2,`h = ${fmt(p.h)}`,'end');text(cx+r/2+15,(by+top)/2-8,`ℓ = ${fmt(m.slant)}`,'start');text(cx+r/2,by+ry+23,`r = ${fmt(p.r)}`);}
 },
 {id:'solids',tab:'Cylinder & sphere',title:'One radius, two different volumes',description:'Compare a sphere and a closed cylinder with the same radius.',fields:[field('r','Shared radius r',1,6,.1,3,'units'),field('h','Cylinder height h',1,12,.1,6,'units')],calc:math.solids,results:(p,m)=>[result('Cylinder volume',m.cylinder,'units³'),result('Sphere volume',m.sphere,'units³'),result('Sphere / cylinder',m.volumeRatio,'× volume')],formulas:'V<sub>cylinder</sub> = πr²h<br>V<sub>sphere</sub> = ⁴⁄₃πr³<br>V<sub>sphere</sub> / V<sub>cylinder</sub> = 4r / (3h)',insight:'Set h = 2r so the sphere fits exactly inside the cylinder. The sphere takes up two thirds of the cylinder’s volume.',condition:'Only the cylinder responds to h. Both solids respond to the shared radius r.',caption:'The solids share the same length scale. Both have radius r.',height:w=>w<480?540:340,
  draw(p,m,w,h){const stacked=w<480,regionH=stacked?h/2:h,regionW=stacked?w:w/2,u=Math.min((regionW-78)/12,(regionH-85)/13.5),r=p.r*u,ry=r*.22,x1=stacked?w/2:w/4,x2=stacked?w/2:3*w/4,by=regionH-53,top=by-p.h*u; text(x1,20,'Cylinder');path(`M${x1-r} ${top}V${by}A${r} ${ry} 0 0 0 ${x1+r} ${by}V${top}Z`);ellipse(x1,top,r,ry);path(`M${x1-r} ${by}A${r} ${ry} 0 0 1 ${x1+r} ${by}`,'guide');line(x1-r-13,top,x1-r-13,by);text(x1-r-19,(top+by)/2+4,'h','end');text(x1,by+ry+23,`r = ${fmt(p.r)}`);const off=stacked?regionH:0,sy=off+by-r;text(x2,off+20,'Sphere');ellipse(x2,sy,r,r,'second');ellipse(x2,sy,r,ry,'guide');line(x2,sy,x2+r,sy);text(x2,sy+r+26,`r = ${fmt(p.r)}`);}
 },
 {id:'scale',tab:'Scaling',title:'Lengths, areas, volumes',description:'Scale every length by the same factor. Area and volume grow at different rates.',fields:[field('k','Length scale factor k',.5,3,.1,2,'×')],calc:math.scale,results:(p,m)=>[result('Length factor',m.length,'×'),result('Area factor',m.area,'×'),result('Volume factor',m.volume,'×')],formulas:'New length = k × original length<br>New area = k² × original area<br>New volume = k³ × original volume',insight:'Set k = 2. Doubling all lengths gives four times the area and eight times the volume. Halving them gives one quarter and one eighth.',condition:'All corresponding lengths must scale by the same factor. These rules apply to similar figures and solids.',caption:'Dashed outlines: original unit figures. Filled figures: scaled copies.',
  draw(p,m,w,h){const u=Math.min((w/2-42)/(3*1.38),(h-95)/(3*1.3)),s=u*p.k,by=h-42,x1=20,x2=w/2+10;text(w/4,23,'Square');text(3*w/4,23,'Cube');poly([[x1,by],[x1+s,by],[x1+s,by-s],[x1,by-s]]);poly([[x1,by],[x1+u,by],[x1+u,by-u],[x1,by-u]],'guide');cube(x2,by,s,'second');cube(x2,by,u,'guide');text(x1+s/2,by+26,`k = ${fmt(p.k)}`);text(x2+s*.69,by+26,`k = ${fmt(p.k)}`);if(s>48){text(x1+s/2,by-s/2+5,'k²');text(x2+s/2,by-s/2+5,'k³');}}
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
