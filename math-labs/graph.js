'use strict';
(() => {
  const ja = document.documentElement.lang === 'ja';
  const root = document.querySelector('[data-knowledge-graph]');
  if (!root) return;
  const svg = root.querySelector('svg');
  const viewport = svg.querySelector('.graph-viewport');
  const edges = svg.querySelector('.graph-edges');
  const nodes = svg.querySelector('.graph-nodes');
  const list = root.querySelector('.graph-list');
  const search = root.querySelector('#graph-search');
  const filter = root.querySelector('#graph-filter');
  const title = root.querySelector('.graph-selection-title');
  const copy = root.querySelector('.graph-selection-copy');
  const open = root.querySelector('.graph-selection-open');
  const status = root.querySelector('.graph-status');
  const groups = ['all','foundations','analysis','geometry','applications','physics'];
  const groupNames = ja ? {all:'すべて',foundations:'基礎',analysis:'解析',geometry:'幾何',applications:'応用',physics:'物理'} : {all:'All',foundations:'Foundations',analysis:'Analysis',geometry:'Geometry',applications:'Applications',physics:'Physics'};
  let data=[], scale=1, tx=0, ty=0, selected=null, dragging=false, last=[0,0];
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function apply(){viewport.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);}
  function layout(){const by={}; groups.slice(1).forEach(g=>by[g]=data.filter(d=>d.group===g)); const coords={}; let col=0; groups.slice(1).forEach(g=>{const arr=by[g];arr.forEach((d,i)=>coords[d.slug]={x:170+col*235,y:72+i*88});col++;}); return coords;}
  function link(a,b){return `${a.x},${a.y} ${b.x},${b.y}`;}
  function draw(){const q=search.value.trim().toLowerCase(), g=filter.value; const coords=layout(); const visible=d=> (!q||`${d.title[0]} ${d.title[1]} ${d.slug}`.toLowerCase().includes(q)) && (g==='all'||d.group===g); const active=data.filter(visible); nodes.replaceChildren(); edges.replaceChildren(); const shown=new Set(active.map(d=>d.slug));
    const edgePairs=[]; data.forEach(d=>{(d.related||[]).forEach(r=>{if(shown.has(d.slug)&&shown.has(r)&&d.slug<r)edgePairs.push([d.slug,r]);});}); edgePairs.forEach(([a,b])=>{const pa=coords[a],pb=coords[b]; if(!pa||!pb)return; const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',pa.x);line.setAttribute('y1',pa.y);line.setAttribute('x2',pb.x);line.setAttribute('y2',pb.y);line.classList.add('graph-edge');edges.append(line);});
    active.forEach(d=>{const p=coords[d.slug],group=document.createElementNS('http://www.w3.org/2000/svg','g');group.classList.add('graph-node');if(d.slug===selected)group.classList.add('is-selected');group.setAttribute('transform',`translate(${p.x} ${p.y})`);group.setAttribute('tabindex','0');group.setAttribute('role','button');group.setAttribute('aria-label',d.title[ja?1:0]);const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',d.group==='physics'?22:19);c.classList.add(`node-${d.group}`);const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('y',37);t.textContent=d.title[ja?1:0];group.append(c,t);group.addEventListener('click',()=>select(d.slug));group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(d.slug)}});nodes.append(group);});
    list.replaceChildren();active.forEach(d=>{const a=document.createElement('a');a.href=`${ja?'/ja':''}/${d.slug}/`;a.dataset.slug=d.slug;a.textContent=d.title[ja?1:0];a.addEventListener('click',()=>select(d.slug));list.append(a)}); status.textContent=ja?`${active.length}件のトピック`:`${active.length} topics`;
  }
  function select(slug){selected=slug;const d=data.find(x=>x.slug===slug);if(!d)return;title.textContent=d.title[ja?1:0];copy.textContent=d.description[ja?1:0];open.href=`${ja?'/ja':''}/${d.slug}/`;root.querySelectorAll('.graph-node').forEach(n=>n.classList.toggle('is-selected',n.getAttribute('aria-label')===d.title[ja?1:0]));history.replaceState(null,'',`?topic=${encodeURIComponent(slug)}`);}
  function reset(){scale=1;tx=0;ty=0;apply();}
  root.querySelector('[data-zoom="in"]').addEventListener('click',()=>{scale=Math.min(2.4,scale*1.15);apply()});root.querySelector('[data-zoom="out"]').addEventListener('click',()=>{scale=Math.max(.6,scale/1.15);apply()});root.querySelector('[data-zoom="reset"]').addEventListener('click',reset);search.addEventListener('input',draw);filter.addEventListener('change',draw);svg.addEventListener('pointerdown',e=>{dragging=true;last=[e.clientX,e.clientY];svg.setPointerCapture(e.pointerId)});svg.addEventListener('pointermove',e=>{if(!dragging)return;tx+=e.clientX-last[0];ty+=e.clientY-last[1];last=[e.clientX,e.clientY];apply()});svg.addEventListener('pointerup',()=>dragging=false);svg.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.6,Math.min(2.4,scale*(e.deltaY<0?1.08:.92)));apply()},{passive:false});
  fetch('/math-labs/content.json').then(r=>r.json()).then(items=>{data=items.map((d,i)=>({...d,related:[]})); const by=new Map(data.map(d=>[d.slug,d])); data.forEach(d=>{const same=data.filter(x=>x.group===d.group&&x.slug!==d.slug).slice(0,2);d.related.push(...same.map(x=>x.slug));}); const cross={ 'number-theory':['information-theory','graph-theory'], 'partial-differential-equations':['classical-mechanics','thermodynamics'], 'linear-algebra':['quantum-mechanics','calculus-of-variations'], 'fourier-analysis':['optics','information-theory'], 'dynamical-systems':['classical-mechanics'], 'differential-geometry':['calculus-of-variations','algebraic-topology'], 'statistical-mechanics':['thermodynamics','probability-inference','quantum-mechanics']}; Object.entries(cross).forEach(([a,bs])=>bs.forEach(b=>{if(by.has(a)&&by.has(b)){by.get(a).related.push(b);by.get(b).related.push(a)}})); draw(); const initial=new URLSearchParams(location.search).get('topic'); if(initial&&by.has(initial))select(initial); else select(data[0].slug);}).catch(()=>{status.textContent=ja?'読み込みに失敗しました':'Could not load the graph';});
})();
