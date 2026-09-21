(()=>{
'use strict';
const ja=document.documentElement.lang==='ja',D=window.BENCHMARK_DATA,M=D.models;
const t=(en,jp)=>ja?jp:en;
const NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s);
const meta=[
['index','Intelligence Index',t('Index points ↑','指数ポイント ↑'),t('A weighted summary of ten evaluations. It is a broad comparison, not a guarantee for any individual task.','10種類の評価を重み付けした総合指標です。個別の作業での優位を保証するものではありません。')],
['terminal','Terminal-Bench 4.0',t('Tasks passed (%) ↑','タスク合格率（%）↑'),t('Completing tasks in a terminal with tools and executable checks. Relevant to development workflows, but not a direct game-rendering test.','ツールを使って端末上の課題を解決し、実行可能なテストで確認します。開発作業には関連しますが、ゲーム描画を直接評価するものではありません。')],
['science','SciCode',t('Subproblems passed (%) ↑','小問合格率（%）↑'),t('Scientific Python subproblems, with background information. A passed function is not evidence of a completed research project.','背景情報を与えた科学計算のPython小問です。関数がテストを通っても、研究プロジェクト全体の完遂を意味しません。')],
['work','GDPval-AA v2',t('Elo rating ↑','Eloレーティング ↑'),t('Relative quality of professional deliverables. Human expert reference: 1000. Elo is neither a percentage nor a ratio scale.','実務成果物の品質を相対評価します。専門家の基準値は1000です。Eloは百分率でも比率尺度でもありません。')],
['cost',t('Cost per benchmark task','ベンチマーク1課題の費用'),t('USD / index task ↓','米ドル／指数評価の課題 ↓'),t('Average evaluation workload cost, not the price of an arbitrary user request. More reasoning can raise billed tokens even at unchanged token prices.','評価用の課題にかかった平均費用であり、任意の依頼の料金ではありません。トークン単価が同じでも、推論量が増えると費用は増えます。')],
['tokens',t('Output per benchmark task','1課題あたりの出力'),t('Thousand tokens / task','千トークン／課題'),t('Includes reasoning and answer tokens in the evaluation accounting. Token quantity is a resource measure, not a quality score.','評価の集計では推論と回答のトークンを含みます。トークン量は資源消費の指標であり、品質点ではありません。')],
['latency',t('Time to first answer','回答開始までの時間'),t('Seconds, including thinking ↓','秒・思考時間を含む ↓'),t('Measured delay before the answer begins. It is not completion time, game frame time, or a promise for every prompt.','回答が始まるまでの測定時間です。回答完了までの時間やゲームのフレーム時間ではなく、すべての入力に当てはまる保証でもありません。')],
['speed',t('Output generation speed','出力生成速度'),t('Tokens / second ↑','トークン／秒 ↑'),t('Output throughput after generation begins. A model may stream quickly after a long thinking phase.','出力開始後の生成速度です。長い思考時間の後で、高速に回答を出すこともあります。')],
['omniscience','AA-Omniscience',t('Reliability index (−100 to 100) ↑','信頼性指数（−100〜100）↑'),t('Factual answers with a penalty for hallucination. This index is not ordinary percentage accuracy.','事実に関する回答と、誤った断言へのペナルティを評価します。通常の正答率ではありません。')],
['hle','Humanity’s Last Exam',t('Correct answers (%) ↑','正答率（%）↑'),t('Difficult academic questions across disciplines. Strong exam performance does not by itself establish agentic execution.','幅広い分野の難しい学術問題です。高い正答率だけでは、ツールを使った作業遂行能力は証明されません。')],
['pdf','GDP.pdf',t('All-criteria pass rate (%) ↑','全基準合格率（%）↑'),t('Answers grounded in long professional PDFs. The headline score requires every grading criterion to pass. This is separate from GDPval-AA.','長い実務PDFに基づく回答を評価します。表示値では採点基準をすべて満たす必要があります。GDPval-AAとは別の評価です。')],
['lcr','AA-LCR v1.1',t('Correct answers (%) ↑','正答率（%）↑'),t('Finding and combining information across long contexts. Context-window capacity alone is not a score on this test.','長い文脈から情報を探し、組み合わせます。入力可能な文脈の長さだけで得点は決まりません。')],
['automation','AutomationBench-AA',t('Successful tasks (%) ↑','タスク成功率（%）↑'),t('Business workflows performed through software APIs. Relevant to tool use and state changes, not visual design quality.','ソフトウェアAPIを通じた業務手順の実行です。ツール操作や状態変更に関する評価であり、見た目の品質評価ではありません。')],
['critpt','CritPt',t('Problems solved (%) ↑','問題解決率（%）↑'),t('Research-level physics problems. Useful evidence for scientific reasoning, but not a simulation-engine validation suite.','研究水準の物理問題です。科学的推論の参考になりますが、シミュレーションエンジンの検証一式ではありません。')],
['briefcase','AA-Briefcase',t('Combined Elo rating ↑','統合Eloレーティング ↑'),t('Business deliverables assessed for task success, analysis and presentation. Its Elo scale is separate from GDPval-AA.','実務成果物の課題達成、分析、提示品質を評価します。Eloの尺度はGDPval-AAとは別です。')]
];
const META=Object.fromEntries(meta.map(m=>[m[0],m]));
const COST_KEYS=['cost','tokens','latency','speed'];
const QUALITY_KEYS=meta.map(m=>m[0]).filter(k=>!COST_KEYS.includes(k));
const LOWER_BETTER={cost:1,latency:1};
const NEUTRAL={tokens:1};
const LOG={latency:1};
const COLORS=['var(--mba-astra)','var(--mba-fable)','var(--mba-opus)'];
const SHAPES=['circle','square','triangle'];
const levels=ja?['Low（低）','Medium（中）','High（高）','Xhigh（特高）','Max（最大）']:['Low','Medium','High','Xhigh','Max'];
const short=ja?['低','中','高','特高','最大']:['Low','Medium','High','Xhigh','Max'];
const fmt=(k,v)=>k==='cost'?'$'+v.toFixed(2):k==='latency'?v.toFixed(2):k==='tokens'?v+'k':String(v);
const fmtU=(k,v)=>k==='latency'?fmt(k,v)+t(' s',' 秒'):fmt(k,v);
const delta=(k,a,b)=>{const d=b-a;if(k==='cost'){return (d>=0?'+':'−')+'$'+Math.abs(d).toFixed(2)}if(k==='latency'){return (d>=0?'+':'−')+Math.abs(d).toFixed(2)}const r=Math.round(d*100)/100;return (r>0?'+':r<0?'−':'±')+Math.abs(r)+(k==='tokens'?'k':'')};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- state ---------- */
const params=new URLSearchParams(location.search);
let key=META[params.get('metric')]?params.get('metric'):'index';
let effort=D.efforts.indexOf(params.get('effort'));if(effort<0)effort=3;
let fx='cost',fy=QUALITY_KEYS.includes(key)?key:'index';

/* ---------- svg helpers ---------- */
function el(parent,tag,attrs,text){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!==undefined)e.textContent=text;if(parent)parent.append(e);return e;}
function mark(parent,j,cx,cy,r,extra){
 const c=COLORS[j];let e;
 if(j===0)e=el(parent,'circle',{cx,cy,r,fill:c});
 else if(j===1){const s=r*1.75;e=el(parent,'rect',{x:cx-s/2,y:cy-s/2,width:s,height:s,rx:1,fill:c});}
 else{const s=r*1.25;e=el(parent,'path',{d:`M${cx},${cy-s*1.15}L${cx+s*1.05},${cy+s*.72}L${cx-s*1.05},${cy+s*.72}Z`,fill:c});}
 e.setAttribute('class','mk'+(extra?' '+extra:''));return e;
}
function glyph(j){return `<span class="glyph" aria-hidden="true"><svg viewBox="-7 -7 14 14">${j===0?`<circle r="5.2" fill="${COLORS[0]}"/>`:j===1?`<rect x="-4.6" y="-4.6" width="9.2" height="9.2" rx="1" fill="${COLORS[1]}"/>`:`<path d="M0,-5.8L5.6,4.2L-5.6,4.2Z" fill="${COLORS[2]}"/>`}</svg></span>`;}

/* ---------- scales ---------- */
function niceStep(span,n){const raw=span/n,mag=10**Math.floor(Math.log10(raw)),r=raw/mag;return (r<1.5?1:r<3?2:r<7?5:10)*mag;}
function linearScale(vals,n,opts={}){
 let lo=Math.min(...vals),hi=Math.max(...vals);const span=hi-lo||Math.abs(hi)||1;
 lo-=span*.12;hi+=span*.12;if(Math.min(...vals)>=0&&lo<0)lo=0;
 const step=niceStep(hi-lo,n);lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
 const ticks=[];for(let v=lo;v<=hi+step/2;v+=step)ticks.push(Math.round(v*1e6)/1e6);
 return {lo,hi,ticks,f:v=>(v-lo)/(hi-lo),inv:p=>lo+p*(hi-lo)};
}
function logScale(vals){
 const lo=Math.min(...vals)/1.35,hi=Math.max(...vals)*1.35,L0=Math.log10(lo),L1=Math.log10(hi);
 const ticks=[];for(let e=Math.floor(L0);e<=Math.ceil(L1);e++)for(const m of [1,3])if(m*10**e>=lo&&m*10**e<=hi)ticks.push(m*10**e);
 return {lo,hi,ticks,log:true,f:v=>(Math.log10(v)-L0)/(L1-L0)};
}
const scaleFor=(k,vals,n)=>LOG[k]?logScale(vals):linearScale(vals,n);
const tickLabel=(k,v)=>k==='cost'?'$'+(v%1?v.toFixed(v<1?2:1):v):k==='tokens'?v+'k':k==='latency'?v+(ja?'秒':'s'):(Math.abs(v)>=1000?String(Math.round(v)):String(Math.round(v*100)/100));

/* ---------- controls ---------- */
const select=$('#metric'),seg=$('#effort');
const groups=[[t('Quality','品質'),QUALITY_KEYS],[t('Cost and time','費用と時間'),COST_KEYS]];
groups.forEach(([label,keys])=>{const g=document.createElement('optgroup');g.label=label;keys.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=META[k][1];g.append(o)});select.append(g)});
select.value=key;
seg.innerHTML=D.efforts.map((e,i)=>`<label title="${levels[i]}"><input type="radio" name="effort" value="${i}"${i===effort?' checked':''}><span>${short[i]}</span></label>`).join('');
$('#model-key').innerHTML=M.map((m,j)=>`<li>${glyph(j)}${m.name}</li>`).join('');

/* ---------- main chart ---------- */
const svg=$('#main-chart'),box=svg.parentElement,tip=$('#main-tip');
let mainGeom=null,hoverI=null;
function drawMain(){
 const w=Math.max(280,box.clientWidth),narrow=w<560,h=narrow?300:360;
 const m={l:narrow?44:56,r:narrow?84:128,t:20,b:46};
 const vals=M.flatMap(x=>x[key]),sc=scaleFor(key,vals,narrow?4:5);
 const X=i=>m.l+14+i*(w-m.l-m.r-28)/4,Y=v=>h-m.b-sc.f(v)*(h-m.t-m.b);
 mainGeom={w,h,m,X,Y};
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const item=META[key];
 el(svg,'title',{},item[1]+' · '+item[2]);
 el(svg,'desc',{},M.map(mm=>mm.name+': '+mm[key].map((v,i)=>levels[i]+' '+fmt(key,v)).join(', ')).join('. '));
 const colW=(w-m.l-m.r-28)/4;
 el(svg,'rect',{class:'band',x:X(effort)-colW/2,y:m.t,width:colW,height:h-m.t-m.b});
 sc.ticks.forEach(v=>{const y=Y(v);if(y<m.t-1||y>h-m.b+1)return;el(svg,'line',{class:v===sc.ticks[0]&&!sc.log?'base':'grid',x1:m.l,x2:w-m.r+8,y1:y,y2:y});el(svg,'text',{class:'ax',x:m.l-10,y:y+4,'text-anchor':'end'},tickLabel(key,v));});
 D.efforts.forEach((e,i)=>el(svg,'text',{class:'ax'+(i===effort?' ax-sel':''),x:X(i),y:h-m.b+22,'text-anchor':'middle'},short[i]));
 el(svg,'text',{class:'ax-title',x:m.l,y:h-4},t('Reasoning effort →','推論レベル →')+(sc.log?t('   ·   log scale','　·　対数目盛'):''));
 const gl=el(svg,'g');
 M.forEach((mm,j)=>{el(gl,'path',{class:'series',stroke:COLORS[j],d:mm[key].map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)).join('')});});
 M.forEach((mm,j)=>mm[key].forEach((v,i)=>mark(gl,j,X(i),Y(v),i===effort?6:4.3)));
 // direct labels at line ends, spread apart to avoid collisions
 const ends=M.map((mm,j)=>({j,y:Y(mm[key][4]),y0:Y(mm[key][4])})).sort((a,b)=>a.y-b.y);
 const gap=narrow?17:19;
 for(let k=1;k<ends.length;k++)if(ends[k].y-ends[k-1].y<gap)ends[k].y=ends[k-1].y+gap;
 const over=ends[ends.length-1].y-(h-m.b);if(over>0)ends.forEach(e=>e.y-=over);
 for(let k=ends.length-2;k>=0;k--)if(ends[k+1].y-ends[k].y<gap)ends[k].y=ends[k+1].y-gap;
 const lx=X(4)+12;
 ends.forEach(e=>{
  if(Math.abs(e.y-e.y0)>2)el(svg,'path',{class:'leader',d:`M${X(4)+7},${e.y0}L${lx-3},${e.y}`});
  const tx=el(svg,'text',{x:lx,y:e.y+4.5});
  el(tx,'tspan',{class:'end-name'},M[e.j].name);
  if(!narrow)el(tx,'tspan',{class:'end-val',dx:7},fmt(key,M[e.j][key][4]));
 });
 // crosshair + interaction layer
 el(svg,'line',{class:'cross',id:'cross',x1:0,x2:0,y1:m.t,y2:h-m.b,visibility:'hidden'});
 el(svg,'g',{id:'cross-marks'});
 const hit=el(svg,'rect',{class:'hit',x:m.l,y:m.t-10,width:w-m.l-m.r+20,height:h-m.t-m.b+30});
 hit.addEventListener('pointermove',ev=>{const p=toLocal(ev);showHover(nearestCol(p.x),p);});
 hit.addEventListener('pointerleave',()=>{if(document.activeElement!==svg)hideHover();});
 hit.addEventListener('click',ev=>{const i=nearestCol(toLocal(ev).x);setEffort(i);showHover(i,toLocal(ev));});
 if(hoverI!==null)showHover(hoverI);
}
function toLocal(ev){const r=svg.getBoundingClientRect(),s=mainGeom.w/r.width;return {x:(ev.clientX-r.left)*s,y:(ev.clientY-r.top)*s};}
function nearestCol(x){const {X}=mainGeom;let best=0;for(let i=1;i<5;i++)if(Math.abs(X(i)-x)<Math.abs(X(best)-x))best=i;return best;}
function tipHTML(k,i,title){
 const rows=M.map((mm,j)=>`<li>${glyph(j)}<span>${mm.name}</span><b>${fmtU(k,mm[k][i])}</b>${i>0?`<em>${delta(k,mm[k][i-1],mm[k][i])}</em>`:'<em></em>'}</li>`).join('');
 return `<p class="tip-h">${title}<span>${levels[i]}</span></p><ul>${rows}</ul>${i>0?`<p class="tip-f">${t('Change from ','')}${levels[i-1]}${t('','からの変化')}</p>`:''}`;
}
function showHover(i,p){
 hoverI=i;const {X,Y,m,h,w}=mainGeom;
 const c=svg.querySelector('#cross');c.setAttribute('x1',X(i));c.setAttribute('x2',X(i));c.setAttribute('visibility','visible');
 const g=svg.querySelector('#cross-marks');g.replaceChildren();M.forEach((mm,j)=>mark(g,j,X(i),Y(mm[key][i]),6.5));
 tip.innerHTML=tipHTML(key,i,META[key][1]);tip.hidden=false;
 const r=svg.getBoundingClientRect(),s=r.width/w,bw=box.clientWidth,tw=tip.offsetWidth;
 let left=i>=2?X(i)*s-tw-18:X(i)*s+18;if(left<0)left=X(i)*s+18;if(left+tw>bw)left=Math.max(0,bw-tw);
 const top=bw<560?h*s+2:m.t*s+4;if(bw<560)left=Math.max(0,Math.min(bw-tw,X(i)*s-tw/2));
 tip.style.left=left+'px';tip.style.top=top+'px';
}
function hideHover(){hoverI=null;tip.hidden=true;const c=svg.querySelector('#cross');if(c)c.setAttribute('visibility','hidden');const g=svg.querySelector('#cross-marks');if(g)g.replaceChildren();}
svg.addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Home'||e.key==='End'){e.preventDefault();const i=e.key==='Home'?0:e.key==='End'?4:Math.max(0,Math.min(4,effort+(e.key==='ArrowRight'?1:-1)));setEffort(i);showHover(i);}
 else if(e.key==='Escape')hideHover();
});
svg.addEventListener('focus',()=>showHover(effort));
svg.addEventListener('blur',hideHover);

/* ---------- small multiples ---------- */
const smEls={};let smHover=null;
function buildMultiples(){
 [['#multiples-quality',QUALITY_KEYS],['#multiples-cost',COST_KEYS]].forEach(([sel,keys])=>{
  const host=$(sel);
  keys.forEach(k=>{
   const b=document.createElement('button');b.type='button';b.className='sm';b.dataset.key=k;
   b.innerHTML=`<span class="sm-name">${META[k][1]}</span><span class="sm-unit">${META[k][2]}${LOG[k]?t(' · log',' · 対数'):''}</span><svg aria-hidden="true" focusable="false"></svg><span class="sm-vals"></span>`;
   b.addEventListener('click',()=>{setMetric(k);$('#compare-chart').scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});});
   const s=b.querySelector('svg');
   s.addEventListener('pointermove',ev=>{const r=s.getBoundingClientRect();const x=(ev.clientX-r.left)/r.width;setSmHover(Math.max(0,Math.min(4,Math.round((x*s._w-s._pad)/((s._w-2*s._pad)/4)))));});
   s.addEventListener('pointerleave',()=>setSmHover(null));
   host.append(b);smEls[k]={b,s,vals:b.querySelector('.sm-vals')};
  });
 });
}
function drawMultiple(k){
 const {s}=smEls[k],w=Math.max(120,s.parentElement.clientWidth-20),h=Math.round(Math.min(92,w*.42)),pad=8;
 s._w=w;s._pad=pad;s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.replaceChildren();
 const sc=scaleFor(k,M.flatMap(x=>x[k]),2),X=i=>pad+i*(w-2*pad)/4,Y=v=>h-6-sc.f(v)*(h-12);
 const i0=smHover??effort,colW=(w-2*pad)/4;
 el(s,'rect',{class:'band',x:X(i0)-colW/2,y:0,width:colW,height:h});
 el(s,'line',{class:'grid',x1:0,x2:w,y1:h-.5,y2:h-.5});
 M.forEach((mm,j)=>el(s,'path',{class:'series',stroke:COLORS[j],'stroke-width':1.75,d:mm[k].map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+','+Y(v).toFixed(1)).join('')}));
 M.forEach((mm,j)=>mark(s,j,X(i0),Y(mm[k][i0]),3.2));
}
function fillMultiple(k){
 const i0=smHover??effort,{b,vals}=smEls[k];
 vals.innerHTML=M.map((mm,j)=>`<span>${glyph(j)}${fmt(k,mm[k][i0])}</span>`).join('');
 b.setAttribute('aria-pressed',String(k===key));
 b.setAttribute('aria-label',`${META[k][1]}, ${META[k][2].replace(/[↑↓]/g,'').trim()}. ${levels[i0]}: `+M.map(mm=>mm.name+' '+fmt(k,mm[k][i0])).join(', ')+'. '+t('Show in the main chart','メインの図に表示'));
}
function drawAllMultiples(){meta.forEach(([k])=>{drawMultiple(k);fillMultiple(k);});$('#sm-effort').textContent=levels[smHover??effort];}
function setSmHover(i){if(i===smHover)return;smHover=i;drawAllMultiples();}

/* ---------- cost vs quality frontier ---------- */
const fsvg=$('#frontier'),fbox=fsvg.parentElement,ftip=$('#frontier-tip');
const fySel=$('#frontier-y'),fxSeg=$('#frontier-x');
QUALITY_KEYS.forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=META[k][1];fySel.append(o)});fySel.value=fy;
const XOPTS=[['cost',t('Cost','費用')],['latency',t('First answer','回答開始')],['tokens',t('Output tokens','出力トークン')]];
fxSeg.innerHTML=XOPTS.map(([k,l])=>`<label><input type="radio" name="fx" value="${k}"${k===fx?' checked':''}><span>${l}</span></label>`).join('');
let fGeom=null,fFocus=-1;
function frontierSet(pts){return pts.filter(p=>!pts.some(q=>q!==p&&q.x<=p.x&&q.y>=p.y&&(q.x<p.x||q.y>p.y)));}
function drawFrontier(){
 const w=Math.max(280,fbox.clientWidth),narrow=w<560,h=narrow?340:420;
 const m={l:narrow?44:60,r:narrow?16:28,t:18,b:50};
 const pts=[];M.forEach((mm,j)=>mm[fx].forEach((v,i)=>pts.push({j,i,x:v,y:mm[fy][i]})));
 const sx=LOG[fx]?logScale(pts.map(p=>p.x)):linearScale([0,...pts.map(p=>p.x)],narrow?4:6),sy=linearScale(pts.map(p=>p.y),5);
 const X=v=>m.l+sx.f(v)*(w-m.l-m.r),Y=v=>h-m.b-sy.f(v)*(h-m.t-m.b);
 const front=frontierSet(pts).sort((a,b)=>a.x-b.x);
 pts.forEach(p=>{p.px=X(p.x);p.py=Y(p.y);p.front=front.includes(p);});
 fGeom={w,h,pts,order:[...pts].sort((a,b)=>a.x-b.x||b.y-a.y)};
 fsvg.replaceChildren();fsvg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 el(fsvg,'title',{},META[fy][1]+t(' against ',' と ')+META[fx][1]);
 el(fsvg,'desc',{},pts.map(p=>`${M[p.j].name} ${levels[p.i]}: ${fmt(fx,p.x)}, ${fmt(fy,p.y)}`).join('; '));
 sy.ticks.forEach(v=>{const y=Y(v);el(fsvg,'line',{class:'grid',x1:m.l,x2:w-m.r,y1:y,y2:y});el(fsvg,'text',{class:'ax',x:m.l-10,y:y+4,'text-anchor':'end'},tickLabel(fy,v));});
 sx.ticks.forEach(v=>{const x=X(v);if(x<m.l-1||x>w-m.r+1)return;el(fsvg,'line',{class:'grid',x1:x,x2:x,y1:m.t,y2:h-m.b});el(fsvg,'text',{class:'ax',x,y:h-m.b+20,'text-anchor':'middle'},tickLabel(fx,v));});
 el(fsvg,'text',{class:'ax-title',x:w-m.r,y:h-6,'text-anchor':'end'},META[fx][2].replace(/[↑↓]/g,'').trim()+(LOG[fx]?t(' · log scale',' · 対数目盛'):'')+t('  ← better','  ← 良い'));
 el(fsvg,'text',{class:'ax-title',x:m.l,y:m.t-6},'↑ '+META[fy][1]);
 // frontier step line
 if(front.length>1){let d=`M${front[0].px},${front[0].py}`;for(let k=1;k<front.length;k++)d+=`H${front[k].px}V${front[k].py}`;el(fsvg,'path',{class:'frontier-line',d});}
 M.forEach((mm,j)=>{const own=pts.filter(p=>p.j===j);el(fsvg,'path',{class:'path-thin',stroke:COLORS[j],d:own.map((p,k)=>(k?'L':'M')+p.px.toFixed(1)+','+p.py.toFixed(1)).join('')});});
 pts.filter(p=>p.front).forEach(p=>el(fsvg,'circle',{class:'frontier-ring',cx:p.px,cy:p.py,r:narrow?8:10}));
 pts.forEach(p=>mark(fsvg,p.j,p.px,p.py,p.i===effort?6:4.2));
 // effort tags on the lowest and highest settings, model name at max
 const placed=[];
 const place=(x,y,wd)=>{let yy=y;for(let n=0;n<6;n++){if(!placed.some(r=>Math.abs(r.x-x)<(r.w+wd)/2+4&&Math.abs(r.y-yy)<13))break;yy-=13;}placed.push({x,y:yy,w:wd});return yy;};
 M.forEach((mm,j)=>{
  const hi=pts.find(p=>p.j===j&&p.i===4),lo=pts.find(p=>p.j===j&&p.i===0);
  const nameW=mm.name.length*7.2,anchorEnd=hi.px+nameW+14>w-m.r;
  const nx=anchorEnd?hi.px-10:hi.px+10,ny=place(anchorEnd?hi.px-10-nameW/2:hi.px+10+nameW/2,hi.py-9,nameW);
  el(fsvg,'text',{class:'pt-name',x:nx,y:ny,'text-anchor':anchorEnd?'end':'start'},mm.name);
  if(!narrow){const ly=place(lo.px+8+14,lo.py+17,28);el(fsvg,'text',{class:'pt-label',x:lo.px+8,y:ly},short[0]);}
 });
 el(fsvg,'g',{id:'f-hover'});
 const hit=el(fsvg,'rect',{class:'hit',x:m.l,y:m.t,width:w-m.l-m.r,height:h-m.t-m.b});
 const near=ev=>{const r=fsvg.getBoundingClientRect(),s=w/r.width,x=(ev.clientX-r.left)*s,y=(ev.clientY-r.top)*s;let best=null,bd=40*40;pts.forEach(p=>{const d=(p.px-x)**2+(p.py-y)**2;if(d<bd){bd=d;best=p;}});return best;};
 hit.addEventListener('pointermove',ev=>{const p=near(ev);p?showF(p):hideF();});
 hit.addEventListener('pointerleave',()=>{if(document.activeElement!==fsvg)hideF();});
 hit.addEventListener('click',ev=>{const p=near(ev);if(p){setEffort(p.i);showF(fGeom.pts.find(q=>q.j===p.j&&q.i===p.i));}});
 $('#frontier-summary').textContent=front.length?t('On the frontier: ','フロンティア上：')+front.map(p=>`${M[p.j].name} ${short[p.i]}`).join(', '):'';
}
function showF(p){
 const g=fsvg.querySelector('#f-hover');g.replaceChildren();mark(g,p.j,p.px,p.py,7.5);
 ftip.innerHTML=`<p class="tip-h"><span class="tip-name">${glyph(p.j)}${M[p.j].name}</span><span>${levels[p.i]}</span></p><dl class="tip-dl"><dt>${META[fy][1]}</dt><dd>${fmtU(fy,p.y)}</dd><dt>${META[fx][1]}</dt><dd>${fmtU(fx,p.x)}</dd></dl>${p.front?`<p class="tip-f">${t('On the frontier: nothing plotted is both cheaper and higher on this pair.','フロンティア上：この組み合わせで、より低い費用・時間かつ高い得点の点はありません。')}</p>`:''}`;
 ftip.hidden=false;
 const r=fsvg.getBoundingClientRect(),s=r.width/fGeom.w,bw=fbox.clientWidth,tw=ftip.offsetWidth,th=ftip.offsetHeight;
 let left=p.px*s+16;if(left+tw>bw)left=p.px*s-tw-16;left=Math.max(0,left);
 let top=p.py*s-th-12;if(top<0)top=p.py*s+16;if(bw<560){top=fGeom.h*s+2;left=Math.max(0,Math.min(bw-tw,p.px*s-tw/2));}
 ftip.style.left=left+'px';ftip.style.top=top+'px';
}
function hideF(){ftip.hidden=true;const g=fsvg.querySelector('#f-hover');if(g)g.replaceChildren();}
fsvg.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(e.key))return;e.preventDefault();
 if(e.key==='Escape'){hideF();return;}
 const n=fGeom.order.length;fFocus=(fFocus+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+n)%n;showF(fGeom.order[fFocus]);
});
fsvg.addEventListener('focus',()=>{if(fFocus<0)fFocus=0;showF(fGeom.order[fFocus]);});
fsvg.addEventListener('blur',hideF);
fySel.addEventListener('change',()=>{fy=fySel.value;drawFrontier();});
fxSeg.addEventListener('change',e=>{fx=e.target.value;drawFrontier();});

/* ---------- text panels ---------- */
function render(){
 const item=META[key];
 $('#metric-title').textContent=item[1];$('#metric-unit').textContent=item[2]+(LOG[key]?t(' · plotted on a log scale',' · 対数目盛で表示'):'');$('#metric-explanation').textContent=item[3];
 $('#snapshot').textContent=t('Snapshot: ','取得日：')+(meta.indexOf(item)<8?D.snapshots.core:D.snapshots.additional);
 $('#selected-heading').textContent=levels[effort];
 const col=M.map(mm=>mm[key][effort]),best=NEUTRAL[key]?null:(LOWER_BETTER[key]?Math.min(...col):Math.max(...col));
 $('#selected-values').innerHTML=M.map((mm,j)=>`<tr class="${mm[key][effort]===best?'best':''}"><th scope="row">${glyph(j)}${mm.name}</th><td>${fmt(key,mm[key][effort])}</td></tr>`).join('');
 $('#best-note').textContent=NEUTRAL[key]?t('Token use is a resource measure, so no marker for best.','トークン量は資源の指標のため、最良の印は付けていません。'):t('Dot marks the best value at this setting'+(LOWER_BETTER[key]?' (lower is better).':'.'),'点はこの設定での最良値を示します'+(LOWER_BETTER[key]?'（低いほど良い）。':'。'));
 $('#all-values').innerHTML=meta.map(([k,n,u])=>`<tr class="${key===k?'table-row-selected':''}"><th scope="row">${n}<br><small>${u}</small></th>${M.map(mm=>`<td>${fmt(k,mm[k][effort])}</td>`).join('')}</tr>`).join('');
 $('#exact-title').textContent=t('All metrics at ','全指標：')+levels[effort];
 $('#status').textContent=item[1]+' · '+levels[effort]+'. '+M.map(mm=>mm.name+' '+fmt(key,mm[key][effort])).join('; ');
 seg.querySelectorAll('input').forEach(inp=>inp.checked=Number(inp.value)===effort);
 select.value=key;
 drawMain();drawAllMultiples();drawFrontier();syncURL();
}
function setMetric(k){key=k;if(QUALITY_KEYS.includes(k)&&fy!==k){fy=k;fySel.value=k;}render();}
function setEffort(i){if(i===effort)return;effort=i;render();}
function syncURL(){
 const p=new URLSearchParams(location.search);p.set('metric',key);p.set('effort',D.efforts[effort]);
 history.replaceState(null,'','?'+p+location.hash);
 document.querySelectorAll('a.ig-language[hreflang]').forEach(a=>{const base=a.getAttribute('href').split(/[?#]/)[0];a.setAttribute('href',base+'?'+p);});
}
select.addEventListener('change',()=>setMetric(select.value));
seg.addEventListener('change',e=>setEffort(Number(e.target.value)));
buildMultiples();
let raf=0;new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{drawMain();drawAllMultiples();drawFrontier();});}).observe($('#compare'));
render();
$('#download').addEventListener('click',()=>{const rows=[['model','effort',...meta.map(m=>m[0])],...M.flatMap(m=>D.efforts.map((e,i)=>[m.name,e,...meta.map(([k])=>m[k][i])]))];const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='model-benchmarks-2026-09.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
})();
