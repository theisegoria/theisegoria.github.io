import {t} from './i18n.js';
import {equilibrium, degas, AIR_CO2_BAR} from './carbonation-model.js';
const root=document.getElementById('chemistry');
const q=s=>root.querySelector(s),canvas=q('#chem-canvas'),ctx=canvas.getContext('2d');
const state={chapter:'dissolve',temperature:10,pressure:3,progress:0,reaction:'hydrate'};
const maxCO2=equilibrium(4,6);
const copy={
  dissolve:['WATER AT EQUILIBRIUM','Higher pressure. More dissolved gas.','CO₂ molecules move between gas and water. At equilibrium, increasing CO₂ pressure increases the amount dissolved. Cooling the water also increases its capacity to hold CO₂.'],
  open:['OPEN TO AIR','Opening changes the balance.','The liquid initially retains its dissolved CO₂. With much less CO₂ in the surrounding air, the water is supersaturated. Gas can escape at the surface and into growing bubbles, until a new equilibrium is approached.'],
  acid:['TWO DIFFERENT CHEMICAL REACTIONS','A small reaction makes an acid.','Dissolved CO₂ is mostly individual molecules, not tiny bubbles and not all carbonic acid. A small fraction reacts with water; carbonic acid can then transfer a proton to water, increasing hydronium and lowering pH.']
};
const format=x=>x<.01?x.toFixed(4):x.toFixed(2);
function update(){
  const [label,title,description]=copy[state.chapter];
  q('#chem-state').textContent=label;q('#chem-title').textContent=title;q('#chem-copy').textContent=description;
  q('#chem-scene-label').textContent=state.chapter==='acid'?'ATOM CONNECTIVITY · NOT TO SCALE':'MOLECULAR VIEW · NOT TO SCALE';
  root.querySelectorAll('[data-chem]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chem===state.chapter)));
  q('#equilibrium-controls').hidden=state.chapter!=='dissolve';q('#opening-controls').hidden=state.chapter!=='open';q('#reaction-controls').hidden=state.chapter!=='acid';q('#chem-numbers').hidden=state.chapter==='acid';q('#chem-boundary').hidden=state.chapter==='acid';q('#release-readout').hidden=state.chapter!=='open';
  q('#pressure-value').textContent=`${state.pressure.toFixed(1)} bar`;q('#temperature-value').textContent=`${state.temperature} °C`;q('#release-value').textContent=`${state.progress}%`;
  q('#chem-pressure').value=state.pressure;q('#chem-temperature').value=state.temperature;q('#chem-release').value=state.progress;q('#chem-reaction').value=state.reaction;
  const data=degas(state.temperature,state.pressure,state.progress),closed=state.chapter==='dissolve';
  q('#initial-conditions').textContent=`Started at ${state.temperature} °C and ${state.pressure.toFixed(1)} bar CO₂: ${format(data.initial)} g dissolved per kg water.`;
  q('#co2-label').textContent=closed?'Dissolved CO₂ at equilibrium':'Dissolved CO₂ remaining';
  q('#co2-value').innerHTML=`${format(closed?data.initial:data.remaining)} <small>g / kg water</small>`;
  q('#released-value').innerHTML=`${format(data.released)} <small>g / kg water</small>`;
  const ratio=equilibrium(state.temperature,1)/equilibrium(25,1);
  q('#chem-insight').textContent=closed?(state.temperature===25?'At the same temperature, doubling CO₂ partial pressure doubles the equilibrium concentration.':`At ${state.temperature} °C, capacity is ${ratio.toFixed(2)}× the capacity at 25 °C, at the same CO₂ pressure.`):state.chapter==='open'?(state.progress===0?'Just opened: pressure changes before the dissolved gas has time to escape.':state.progress===100?`Air-equilibrium target: ${format(data.target)} g/kg. “Flat” does not mean absolutely zero CO₂.`:'Dissolved gas remaining + gas released = the initial dissolved amount.'):'Bubbles are a gas phase. Acidity is an aqueous chemical equilibrium.';
  if(state.reaction==='hydrate'){
    q('#reaction-equation').textContent='CO₂(aq) + H₂O ⇌ H₂CO₃';
    q('#reaction-detail').textContent='Most dissolved CO₂ stays as CO₂(aq). A small fraction reacts with water to form carbonic acid. Dissolving and reacting are different processes.';
  }else{
    q('#reaction-equation').textContent='H₂CO₃ + H₂O ⇌ HCO₃⁻ + H₃O⁺';
    q('#reaction-detail').textContent='Carbonic acid donates a proton to a water molecule. Bicarbonate and hydronium form. More hydronium means a lower pH; no CO₂ gas bubble is created by this step.';
  }
  q('#chem-legend').innerHTML=state.chapter==='acid'?'<span><b class="atom-key atom-c"></b>C · carbon</span><span><b class="atom-key atom-o"></b>O · oxygen</span><span><b class="atom-key atom-h"></b>H · hydrogen</span><span><b class="atom-key atom-p"></b>'+(state.reaction==='hydrate'?'Atoms that form the new bond':'The proton (H⁺) that moves')+'</span>':'<span><b class="dissolved-dot"></b>Dissolved CO₂ molecules</span><span><b class="bubble-dot"></b>Gas bubbles contain many molecules</span><span><b class="arrow-key"></b>Direction CO₂ moves</span>';
  canvas.setAttribute('aria-label',state.chapter==='acid'?q('#reaction-equation').textContent: `${label}. ${format(closed?data.initial:data.remaining)} grams of dissolved CO₂ per kilogram water at ${state.temperature} degrees Celsius. ${closed?'CO₂ partial pressure '+state.pressure+' bar.':state.progress+' percent toward equilibrium with air.'}`);
  draw();
}
function colour(name){return getComputedStyle(root).getPropertyValue(`--chem-${name}`).trim()}
function text(value,x,y,size=14,align='left',color=colour('ink')){ctx.font=`${size}px "DM Sans", Arial, sans-serif`;ctx.textAlign=align;ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle=colour('gas');ctx.globalAlpha=.85;ctx.strokeText(t(value),x,y);ctx.globalAlpha=1;ctx.fillStyle=color;ctx.fillText(t(value),x,y)}
function line(x1,y1,x2,y2,color=colour('line'),width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function dot(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.stroke()}else{ctx.fillStyle=color;ctx.fill()}}
function arrow(x,y,down){const end=y+(down?23:-23);line(x,y,x,end,colour('co2'),1.5);line(x,end,x-4,end+(down?-5:5),colour('co2'),1.5);line(x,end,x+4,end+(down?-5:5),colour('co2'),1.5)}
// a lit sphere: a radial gradient from a specular highlight through the atom's colour to a dark rim
function shade(hex,k){const n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255,f=k<0?0:255,a=Math.abs(k);return `rgb(${Math.round(r+(f-r)*a)},${Math.round(g+(f-g)*a)},${Math.round(b+(f-b)*a)})`}
const sprites=new Map();
function sprite(r,hex){const dpr=Math.min(devicePixelRatio,2),k=`${r}${hex}${dpr}`;let c=sprites.get(k);if(!c){c=document.createElement('canvas');const n=Math.ceil(2*r*dpr)+2;c.width=c.height=n;const g=c.getContext('2d');g.scale(dpr,dpr);const o=r+1/dpr,gr=g.createRadialGradient(o-r*.38,o-r*.42,r*.08,o,o,r);gr.addColorStop(0,shade(hex,.72));gr.addColorStop(.32,shade(hex,.12));gr.addColorStop(.82,hex);gr.addColorStop(1,shade(hex,-.45));g.beginPath();g.arc(o,o,r,0,Math.PI*2);g.fillStyle=gr;g.fill();sprites.set(k,c)}return c}
function sball(x,y,r,hex,alpha=1){const c=sprite(r,hex),w=c.width/Math.min(devicePixelRatio,2);ctx.globalAlpha=alpha;ctx.drawImage(c,x-w/2,y-w/2,w,w);ctx.globalAlpha=1}
function ball(x,y,r,hex,alpha=1){const g=ctx.createRadialGradient(x-r*.38,y-r*.42,r*.08,x,y,r);g.addColorStop(0,shade(hex,.72));g.addColorStop(.32,shade(hex,.12));g.addColorStop(.82,hex);g.addColorStop(1,shade(hex,-.45));ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.globalAlpha=1}
const CPK={O:'#d8352a',C:'#3b3f46',H:'#f1f3f4'};
function atom(symbol,x,y,r=14,hl=false){if(hl){ctx.save();ctx.globalAlpha=.28;dot(x,y,r+7,colour('proton'));ctx.restore()}ball(x,y,r,hl&&symbol==='H'?'#e8962e':CPK[symbol]);if(hl&&symbol!=='H'){ctx.beginPath();ctx.arc(x,y,r+2.5,0,Math.PI*2);ctx.strokeStyle=colour('proton');ctx.lineWidth=2.5;ctx.stroke()}ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=symbol==='H'?0:3;ctx.font=`600 ${r<12?11:13}px "DM Sans", Arial, sans-serif`;ctx.textAlign='center';ctx.fillStyle=symbol==='H'?'#1b2a30':'#ffffff';ctx.fillText(symbol,x,y+4.5);ctx.restore()}
function curve(x1,y1,x2,y2,bend,color,label,lx,ly){const mx=(x1+x2)/2,my=(y1+y2)/2,nx=-(y2-y1),ny=x2-x1,l=Math.hypot(nx,ny)||1,cx=mx+nx/l*bend,cy=my+ny/l*bend;ctx.beginPath();ctx.moveTo(x1,y1);ctx.quadraticCurveTo(cx,cy,x2,y2);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);const a=Math.atan2(y2-cy,x2-cx);ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-9*Math.cos(a-.45),y2-9*Math.sin(a-.45));ctx.lineTo(x2-9*Math.cos(a+.45),y2-9*Math.sin(a+.45));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(label)text(label,lx??cx,ly??cy,12,'center',color)}
function molecule(type,x,y,scale=1,hl=[]){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);let atoms=[],bonds=[];
  if(type==='co2'){atoms=[['O',-34,0],['C',0,0],['O',34,0]];bonds=[[0,1,2],[1,2,2]]}
  if(type==='water'){atoms=[['O',0,0],['H',-25,22],['H',25,22]];bonds=[[0,1,1],[0,2,1]]}
  if(type==='acid'||type==='bicarbonate'){atoms=[['C',0,0],['O',0,-37],['O',-35,24],['O',35,24],['H',-61,9]];bonds=[[0,1,2],[0,2,1],[0,3,1],[2,4,1]];if(type==='acid'){atoms.push(['H',61,9]);bonds.push([3,5,1])}}
  if(type==='hydronium'){atoms=[['O',0,0],['H',0,-30],['H',-27,20],['H',27,20]];bonds=[[0,1,1],[0,2,1],[0,3,1]]}
  for(const [a,b,order] of bonds){const [,ax,ay]=atoms[a],[,bx,by]=atoms[b],length=Math.hypot(bx-ax,by-ay),nx=-(by-ay)/length,ny=(bx-ax)/length;for(const o of order===2?[-3.2,3.2]:[0]){ctx.lineCap='round';line(ax+nx*o,ay+ny*o,bx+nx*o,by+ny*o,'#7d868c',order===2?3.2:4.4);line(ax+nx*(o-.8),ay+ny*(o-.8),bx+nx*(o-.8),by+ny*(o-.8),'rgba(255,255,255,.55)',1)}}
  atoms.forEach(([symbol,ax,ay],i)=>atom(symbol,ax,ay,symbol==='H'?10:14,hl.includes(i)));
  if(type==='bicarbonate')text('−',48,8,20);if(type==='hydronium')text('+',27,-22,18);ctx.restore();
}
function draw(){
  const width=canvas.clientWidth,height=canvas.clientHeight;if(!width)return;
  const dpr=Math.min(devicePixelRatio,2),cw=Math.round(width*dpr),chh=Math.round(height*dpr);if(canvas.width!==cw||canvas.height!==chh){canvas.width=cw;canvas.height=chh}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  if(state.chapter==='acid'){
    const narrow=width<430,scale=narrow?.74:1;const y1=height*.24,y2=height*.74;const acid=state.reaction==='hydrate';
    const lx=width*.27,rx=width*.73;
    // Reactants: highlight the atoms that change partners.
    molecule(acid?'co2':'acid',lx,y1,scale,acid?[1]:[5]);molecule('water',rx,y1,scale,acid?[0]:[0]);text('+',width*.5,y1+5,21,'center');
    text(acid?'CO₂(aq)':'H₂CO₃',lx,y1+58,14,'center');text('H₂O',rx,y1+58,14,'center');
    if(acid)curve(rx-4*scale,y1-16*scale,lx+6*scale,y1-18*scale,-46*scale,colour('proton'),'new bond to carbon',width*.5,y1-56*scale);
    else curve(lx+61*scale,y1+9*scale,rx-14*scale,y1-6*scale,-40*scale,colour('proton'),'proton moves',width*.5,y1-44*scale);
    text('⇌',width*.5,height*.5,28,'center');
    text(acid?'a small fraction reacts':'an acid-base equilibrium',width*.5,height*.5+24,11.5,'center',colour('muted'));
    if(acid){molecule('acid',width*.5,y2,scale,[0,3]);text('H₂CO₃',width*.5,y2+57,14,'center');text('carbonic acid',width*.5,y2+75,12,'center',colour('muted'))}
    else{molecule('bicarbonate',lx,y2,scale);molecule('hydronium',rx,y2,scale,[1]);text('+',width*.51,y2+5,21,'center');text('HCO₃⁻',lx,y2+57,14,'center');text('H₃O⁺',rx,y2+57,14,'center');text('bicarbonate',lx,y2+75,12,'center',colour('muted'));text('hydronium: lowers pH',rx,y2+75,12,'center',colour('muted'))}
    return;
  }
  const left=12,right=width-12,top=16,bottom=height-16,level=height*.34,isOpen=state.chapter==='open';
  scene.box={left,right,top,bottom,level,width,height,isOpen};
  const dark=matchMedia('(prefers-color-scheme: dark)').matches&&document.documentElement.dataset.theme!=='light'||document.documentElement.dataset.theme==='dark';
  scene.dark=dark;
  // gas above: a faint cool tint; water below: depth gradient with the packed solvent drawn as a texture
  const gg=ctx.createLinearGradient(0,top,0,level);gg.addColorStop(0,dark?'#141b1e':'#f7fafb');gg.addColorStop(1,dark?'#1a2428':'#eef5f7');ctx.fillStyle=gg;ctx.fillRect(left,top,right-left,level-top);
  const wg=ctx.createLinearGradient(0,level,0,bottom);wg.addColorStop(0,dark?'#17404d':'#cfeaf1');wg.addColorStop(1,dark?'#0b2129':'#a9d6e3');ctx.fillStyle=wg;ctx.fillRect(left,level,right-left,bottom-level);
  ctx.drawImage(solvent(right-left,bottom-level,dark),left,level);
  // the free surface: a meniscus that climbs the walls, a bright line where light skims it, a darker band just under it
  ctx.beginPath();ctx.moveTo(left,level-7);ctx.bezierCurveTo(left+16,level+1,left+30,level,left+44,level);ctx.lineTo(right-44,level);ctx.bezierCurveTo(right-30,level,right-16,level+1,right,level-7);ctx.lineTo(right,level+5);ctx.lineTo(left,level+5);ctx.closePath();
  ctx.fillStyle=dark?'rgba(120,200,220,.25)':'rgba(255,255,255,.55)';ctx.fill();
  line(left+40,level,right-40,level,dark?'rgba(170,230,245,.7)':'rgba(255,255,255,.95)',1.6);
  const sg=ctx.createLinearGradient(0,level,0,level+22);sg.addColorStop(0,dark?'rgba(0,0,0,.25)':'rgba(40,110,130,.16)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.fillRect(left,level+1,right-left,22);
  // the vessel: glass walls with a highlight
  ctx.lineWidth=3;ctx.strokeStyle=dark?'rgba(190,220,230,.35)':'rgba(120,160,175,.55)';ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.lineTo(right,top);if(!isOpen)ctx.closePath();ctx.stroke();
  line(left+4,top+4,left+4,bottom-6,'rgba(255,255,255,.6)',1.2);
  const d=degas(state.temperature,state.pressure,state.progress),value=isOpen?d.remaining:d.initial;
  sync(scene.gas,isOpen?2:Math.round(state.pressure*6));sync(scene.liq,Math.round(value/maxCO2*155));
  for(const m of scene.gas)co2(left+18+m.x*(right-left-36),top+40+m.y*Math.max(12,level-top-58),m.a,m.t,1);
  for(const m of scene.liq)co2(left+18+m.x*(right-left-36),level+44+m.y*(bottom-level-60),m.a,m.t,.95);
  text(isOpen?'Air above the water':'CO₂ gas above the water',left+14,top+24,13);
  text(isOpen?'pCO₂ ≈ 0.00042 bar':`pCO₂ = ${state.pressure.toFixed(1)} bar`,right-13,level-16,12,'right',colour('muted'));
  text(isOpen?(state.progress===100?'Water equilibrated with air':'Supersaturated water → air equilibrium'):'Dissolved, individual CO₂ molecules',left+14,level+27,width<350?11:12);
  if(!isOpen){arrow(width*.44,level-17,true);arrow(width*.56,level+17,false);text('dissolves',width*.44-8,level-24,12,'right',colour('co2'));text('escapes',width*.56+8,level+30,12,'left',colour('co2'));text('Equal rates at equilibrium',width*.5,level+62,11.5,'center',colour('muted'))}
  if(isOpen&&state.progress<100){for(const f of [.3,.5,.7])arrow(width*f,level+14,false);text(state.progress===0?'net escape begins':'net escape',width*.7+10,level+2,12,'left',colour('co2'))}
  if(isOpen&&state.progress>0&&state.progress<100){
    for(let i=0;i<5;i++){const x=left+35+(i/5)*(right-left-60),phase=(state.progress/100+i*.173+scene.t*.02)%1,y=bottom-28-phase*(bottom-level-30),r=5+(bottom-y)/(bottom-top)*9;bubble(x+3*Math.sin(scene.t*.9+i),y,r)}
  }
}
// a CO2 molecule, space-filling: two oxygens either side of the carbon, 116 pm bonds, foreshortened by its tilt t
function co2(x,y,a,t,alpha){const L=5.4*Math.cos(t),dx=L*Math.cos(a),dy=L*Math.sin(a),front=Math.sin(t)>0?1:-1;sball(x-front*dx,y-front*dy,4.1,'#d8352a',alpha);sball(x,y,4.3,'#3b3f46',alpha);sball(x+front*dx,y+front*dy,4.1,'#d8352a',alpha)}
// a gas bubble: thin film, bright rim and a window highlight, a few CO2 molecules inside
function bubble(x,y,r){const g=ctx.createRadialGradient(x,y,r*.55,x,y,r);g.addColorStop(0,'rgba(255,255,255,.04)');g.addColorStop(.86,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,.75)');ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(30,110,130,.45)';ctx.lineWidth=.8;ctx.stroke();ctx.beginPath();ctx.ellipse(x-r*.38,y-r*.42,r*.26,r*.14,-.6,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fill();if(r>8){ctx.save();ctx.translate(x,y);ctx.scale(.45,.45);co2(-r*.6,r*.3,.4,.3,1);co2(r*.7,-r*.1,1.9,.9,1);ctx.restore()}}
// the packed liquid: water molecules nearly touching, drawn faint as a texture behind the solute
let solventCache=null;
function solvent(w,h,dark){const key=`${Math.round(w)}x${Math.round(h)}${dark}`;if(solventCache?.key===key)return solventCache.cv;const cv=document.createElement('canvas'),dpr=Math.min(devicePixelRatio,2);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);const c=cv.getContext('2d');c.scale(dpr,dpr);let s=7;const rnd=()=>((s=(s*16807)%2147483647)/2147483647);
  for(let y=4;y<h;y+=8.2)for(let x=(Math.round(y/8.2)%2)*4;x<w;x+=8.6){const px=x+(rnd()-.5)*3,py=y+(rnd()-.5)*3,a=rnd()*Math.PI*2;c.globalAlpha=dark?.22:.2;c.fillStyle='#d8352a';c.beginPath();c.arc(px,py,2.4,0,7);c.fill();c.fillStyle=dark?'#cfdde2':'#ffffff';for(const o of [-.91,.91]){c.beginPath();c.arc(px+2.6*Math.cos(a+o),py+2.6*Math.sin(a+o),1.5,0,7);c.fill()}}
  solventCache={key,cv};return cv}
// molecules keep their identity as counts change; gas molecules fly, dissolved ones diffuse slowly
const scene={gas:[],liq:[],t:0,box:null};let seed=11;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
function sync(arr,n){while(arr.length<n)arr.push({x:rnd(),y:rnd(),a:rnd()*Math.PI*2,t:rnd()*Math.PI,vx:rnd()-.5,vy:rnd()-.5,wa:(rnd()-.5)*2,wt:(rnd()-.5)*2});arr.length=n}
function step(dt){scene.t+=dt;for(const m of scene.gas){m.x+=m.vx*dt*.18;m.y+=m.vy*dt*.3;if(m.x<0||m.x>1){m.vx*=-1;m.x=Math.min(1,Math.max(0,m.x))}if(m.y<0||m.y>1){m.vy*=-1;m.y=Math.min(1,Math.max(0,m.y))}m.a+=m.wa*dt*2;m.t+=m.wt*dt*2}
  for(const m of scene.liq){m.x=Math.min(1,Math.max(0,m.x+(rnd()-.5)*dt*.05));m.y=Math.min(1,Math.max(0,m.y+(rnd()-.5)*dt*.07));m.a+=(rnd()-.5)*dt*3;m.t+=(rnd()-.5)*dt*3}}
let visible=false,last=0;const still=matchMedia('(prefers-reduced-motion: reduce)');
new IntersectionObserver((es)=>{visible=es[0].isIntersecting;if(visible&&!still.matches)requestAnimationFrame(loop)}).observe(canvas);
function loop(now){if(!visible||still.matches||state.chapter==='acid'){last=0;return}if(last&&now-last<30){requestAnimationFrame(loop);return}const dt=last?Math.min(.06,(now-last)/1000):0;last=now;step(dt);draw();requestAnimationFrame(loop)}
root.querySelectorAll('[data-chem]').forEach(b=>b.onclick=()=>{state.chapter=b.dataset.chem;update();if(visible&&!still.matches&&!last)requestAnimationFrame(loop)});
q('#chem-pressure').oninput=e=>{state.pressure=+e.target.value;state.progress=0;update()};q('#chem-temperature').oninput=e=>{state.temperature=+e.target.value;state.progress=0;update()};q('#chem-release').oninput=e=>{state.progress=+e.target.value;update()};q('#chem-reaction').onchange=e=>{state.reaction=e.target.value;update()};
new ResizeObserver(draw).observe(canvas);addEventListener('languagechange',update);new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});update();

if(document.modelContext?.registerTool){const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'explore_carbonation_chemistry',description:'Update the visible carbonation teaching model: dissolve gas, open to air, or inspect carbonic-acid reactions. No control of a real appliance.',inputSchema:{type:'object',properties:{chapter:{type:'string',enum:['dissolve','open','acid']},temperature:{type:'number',minimum:4,maximum:25},pressure:{type:'number',minimum:1,maximum:6},progress:{type:'number',minimum:0,maximum:100},reaction:{type:'string',enum:['hydrate','dissociate']}},required:['chapter'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Object.hasOwn(copy,input.chapter)||Object.keys(input).some(k=>!Object.hasOwn(state,k)))throw new Error('Invalid chemistry chapter or parameter');for(const [k,min,max] of [['temperature',4,25],['pressure',1,6],['progress',0,100]])if(input[k]!==undefined&&(!Number.isFinite(input[k])||input[k]<min||input[k]>max))throw new Error(`Invalid ${k}`);if(input.reaction!==undefined&&!['hydrate','dissociate'].includes(input.reaction))throw new Error('Invalid reaction');Object.assign(state,input);update();return {...state,...degas(state.temperature,state.pressure,state.progress)}}},{signal:lifecycle.signal})).catch(console.warn)}catch(e){console.warn(e)}}
