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
  q('#chem-legend').innerHTML=state.chapter==='acid'?'<span>Atom labels: C · carbon &nbsp; O · oxygen &nbsp; H · hydrogen</span>':'<span><b class="dissolved-dot"></b>Dissolved CO₂ molecules</span><span><b class="bubble-dot"></b>Gas bubbles contain many molecules</span>';
  canvas.setAttribute('aria-label',state.chapter==='acid'?q('#reaction-equation').textContent: `${label}. ${format(closed?data.initial:data.remaining)} grams of dissolved CO₂ per kilogram water at ${state.temperature} degrees Celsius. ${closed?'CO₂ partial pressure '+state.pressure+' bar.':state.progress+' percent toward equilibrium with air.'}`);
  draw();
}
function colour(name){return getComputedStyle(root).getPropertyValue(`--chem-${name}`).trim()}
function text(value,x,y,size=14,align='left',color=colour('ink')){ctx.font=`${size}px "DM Sans", Arial, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t(value),x,y)}
function line(x1,y1,x2,y2,color=colour('line'),width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function dot(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.stroke()}else{ctx.fillStyle=color;ctx.fill()}}
function arrow(x,y,down){const end=y+(down?23:-23);line(x,y,x,end,colour('co2'),1.5);line(x,end,x-4,end+(down?-5:5),colour('co2'),1.5);line(x,end,x+4,end+(down?-5:5),colour('co2'),1.5)}
function atom(symbol,x,y,r=14){dot(x,y,r,colour(symbol==='O'?'oxygen':symbol==='C'?'carbon':'hydrogen'));text(symbol,x,y+4,r<12?11:13,'center',symbol==='H'?colour('ink'):'#ffffff')}
function molecule(type,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);let atoms=[],bonds=[];
  if(type==='co2'){atoms=[['O',-34,0],['C',0,0],['O',34,0]];bonds=[[0,1,2],[1,2,2]]}
  if(type==='water'){atoms=[['O',0,0],['H',-25,22],['H',25,22]];bonds=[[0,1,1],[0,2,1]]}
  if(type==='acid'||type==='bicarbonate'){atoms=[['C',0,0],['O',0,-37],['O',-35,24],['O',35,24],['H',-61,9]];bonds=[[0,1,2],[0,2,1],[0,3,1],[2,4,1]];if(type==='acid'){atoms.push(['H',61,9]);bonds.push([3,5,1])}}
  if(type==='hydronium'){atoms=[['O',0,0],['H',0,-30],['H',-27,20],['H',27,20]];bonds=[[0,1,1],[0,2,1],[0,3,1]]}
  for(const [a,b,order] of bonds){const [,ax,ay]=atoms[a],[,bx,by]=atoms[b];if(order===2){const length=Math.hypot(bx-ax,by-ay),dx=-(by-ay)/length*2,dy=(bx-ax)/length*2;line(ax+dx,ay+dy,bx+dx,by+dy,colour('ink'),1.5);line(ax-dx,ay-dy,bx-dx,by-dy,colour('ink'),1.5)}else line(ax,ay,bx,by,colour('ink'),2)}
  for(const [symbol,ax,ay]of atoms)atom(symbol,ax,ay,symbol==='H'?10:14);
  if(type==='bicarbonate')text('−',48,8,20);if(type==='hydronium')text('+',27,-22,18);ctx.restore();
}
function draw(){
  const width=canvas.clientWidth,height=canvas.clientHeight;if(!width)return;
  const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  if(state.chapter==='acid'){
    const narrow=width<430,scale=narrow?.77:1;const y1=height*.24,y2=height*.72;const acid=state.reaction==='hydrate';
    molecule(acid?'co2':'acid',width*.28,y1,scale);molecule('water',width*.73,y1,scale);text('+',width*.51,y1+5,21,'center');
    text(acid?'CO₂(aq)':'H₂CO₃',width*.28,y1+58,14,'center');text('H₂O',width*.73,y1+58,14,'center');
    text('⇌',width*.5,height*.49,28,'center');
    if(acid){molecule('acid',width*.5,y2,scale);text('H₂CO₃',width*.5,y2+57,14,'center')}
    else{molecule('bicarbonate',width*.28,y2,scale);molecule('hydronium',width*.73,y2,scale);text('+',width*.51,y2+5,21,'center');text('HCO₃⁻',width*.28,y2+57,14,'center');text('H₃O⁺',width*.73,y2+57,14,'center')}
    return;
  }
  const left=12,right=width-12,top=16,bottom=height-16,level=height*.34,isOpen=state.chapter==='open';
  ctx.fillStyle=colour('gas');ctx.fillRect(left,top,right-left,level-top);
  ctx.fillStyle=colour('water');ctx.fillRect(left,level,right-left,bottom-level);
  line(left,top,left,bottom);line(left,bottom,right,bottom);line(right,bottom,right,top);if(!isOpen)line(left,top,right,top);line(left,level,right,level);
  text(isOpen?'Air above the water':'CO₂ gas above the water',left+14,top+24,13);
  text(isOpen?'pCO₂ ≈ 0.00042 bar':`pCO₂ = ${state.pressure.toFixed(1)} bar`,right-13,level-16,12,'right',colour('muted'));
  text(isOpen?(state.progress===100?'Water equilibrated with air':'Supersaturated water → air equilibrium'):'Dissolved, individual CO₂ molecules',left+14,level+27,width<350?11:12);
  const countGas=isOpen?2:Math.round(state.pressure*6);
  for(let i=0;i<countGas;i++){const x=left+22+((i*.61803398875)%1)*(right-left-44),y=top+44+((Math.sin(i*12.9898+78.233)*43758.5453)%1+1)%1*Math.max(12,level-top-76);dot(x,y,2.4,colour('co2'))}
  const d=degas(state.temperature,state.pressure,state.progress),value=isOpen?d.remaining:d.initial;
  const count=Math.round(value/maxCO2*155);
  for(let i=0;i<count;i++){const x=left+22+((i*.754877666)%1)*(right-left-44),y=level+49+((i*.569840291)%1)*(bottom-level-70);dot(x,y,2.5,colour('co2'))}
  if(!isOpen){arrow(width*.47,level-17,true);arrow(width*.54,level+17,false)}
  if(isOpen&&state.progress>0&&state.progress<100){
    for(let i=0;i<5;i++){const x=left+35+(i/5)*(right-left-60),phase=(state.progress/100+i*.173)%1,y=bottom-28-phase*(bottom-top-38),r=4+(bottom-y)/(bottom-top)*7;dot(x,y,r,colour('co2'),true);dot(x-1.4,y,1,colour('co2'));dot(x+2,y-2,1,colour('co2'))}
  }
}
root.querySelectorAll('[data-chem]').forEach(b=>b.onclick=()=>{state.chapter=b.dataset.chem;update()});
q('#chem-pressure').oninput=e=>{state.pressure=+e.target.value;state.progress=0;update()};q('#chem-temperature').oninput=e=>{state.temperature=+e.target.value;state.progress=0;update()};q('#chem-release').oninput=e=>{state.progress=+e.target.value;update()};q('#chem-reaction').onchange=e=>{state.reaction=e.target.value;update()};
new ResizeObserver(draw).observe(canvas);addEventListener('languagechange',draw);update();

if(document.modelContext?.registerTool){const lifecycle=new AbortController();addEventListener('pagehide',()=>lifecycle.abort(),{once:true});try{Promise.resolve(document.modelContext.registerTool({name:'explore_carbonation_chemistry',description:'Update the visible carbonation teaching model: dissolve gas, open to air, or inspect carbonic-acid reactions. No control of a real appliance.',inputSchema:{type:'object',properties:{chapter:{type:'string',enum:['dissolve','open','acid']},temperature:{type:'number',minimum:4,maximum:25},pressure:{type:'number',minimum:1,maximum:6},progress:{type:'number',minimum:0,maximum:100},reaction:{type:'string',enum:['hydrate','dissociate']}},required:['chapter'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Object.hasOwn(copy,input.chapter)||Object.keys(input).some(k=>!Object.hasOwn(state,k)))throw new Error('Invalid chemistry chapter or parameter');for(const [k,min,max] of [['temperature',4,25],['pressure',1,6],['progress',0,100]])if(input[k]!==undefined&&(!Number.isFinite(input[k])||input[k]<min||input[k]>max))throw new Error(`Invalid ${k}`);if(input.reaction!==undefined&&!['hydrate','dissociate'].includes(input.reaction))throw new Error('Invalid reaction');Object.assign(state,input);update();return {...state,...degas(state.temperature,state.pressure,state.progress)}}},{signal:lifecycle.signal})).catch(console.warn)}catch(e){console.warn(e)}}
