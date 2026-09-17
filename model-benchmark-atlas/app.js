(()=>{
'use strict';
const ja=document.documentElement.lang==='ja',D=window.BENCHMARK_DATA,M=D.models;
const t=(en,jp)=>ja?jp:en;
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
const params=new URLSearchParams(location.search);let key=meta.some(x=>x[0]===params.get('metric'))?params.get('metric'):'index';let effort=D.efforts.indexOf(params.get('effort'));if(effort<0)effort=3;
const select=document.querySelector('#metric'),level=document.querySelector('#effort');
meta.forEach(([k,n])=>{const o=document.createElement('option');o.value=k;o.textContent=n;select.append(o)});select.value=key;
const levels=ja?['Low（低）','Medium（中）','High（高）','Xhigh（特高）','Max（最大）']:['Low','Medium','High','Xhigh','Max'];
levels.forEach((e,i)=>{const o=document.createElement('option');o.value=i;o.textContent=e;level.append(o)});level.value=effort;
const fmt=(k,v)=>k==='cost'?'$'+v.toFixed(2):k==='latency'?v.toFixed(2):k==='tokens'?v+'k':String(v);
const svg=document.querySelector('#main-chart');const ns='http://www.w3.org/2000/svg';
function elt(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;svg.append(e);return e;}
function syncURL(){const p=new URLSearchParams(location.search);p.set('metric',key);p.set('effort',D.efforts[effort]);history.replaceState(null,'','?'+p+location.hash);const a=document.querySelector('#language');a.href=a.dataset.target+'?'+p+location.hash;}
function chart(){
 const w=svg.parentElement.clientWidth,h=300,l=58,r=20,top=25,b=54,vals=M.flatMap(m=>m[key]);
 let min=Math.min(...vals),max=Math.max(...vals),pad=(max-min)*.15||1;min=Math.max(key==='omniscience'?-100:0,min-pad);max+=pad;
 const x=i=>l+12+i*(w-l-r-24)/4,y=v=>h-b-(v-min)*(h-top-b)/(max-min);
 svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-label',meta.find(m=>m[0]===key)[1]+': '+M.map(m=>m.name+' '+m[key].join(', ')).join('; '));
 elt('title',{},meta.find(m=>m[0]===key)[1]);
 for(let i=0;i<4;i++){const v=min+(max-min)*i/3,yy=y(v);elt('line',{x1:l,x2:w-r,y1:yy,y2:yy,stroke:'var(--line)'});elt('text',{x:l-8,y:yy+4,'text-anchor':'end'},v>=100?Math.round(v):Number(v.toFixed(1)));}
 [0,1,2,3,4].filter(i=>w>400||i%2===0).forEach(i=>elt('text',{x:x(i),y:h-b+24,'text-anchor':'middle'},D.efforts[i]));
 elt('text',{x:(l+w-r)/2,y:h-5,'text-anchor':'middle'},t('Reasoning effort · ordinal settings','推論レベル・順序尺度'));
 elt('line',{x1:x(effort),x2:x(effort),y1:top,y2:h-b,stroke:'var(--ink)','stroke-opacity':'.35','stroke-dasharray':'3 4'});
 M.forEach((m,j)=>{const c=['var(--a)','var(--b)','var(--c)'][j];elt('path',{d:m[key].map((v,i)=>(i?'L':'M')+x(i)+','+y(v)).join(' '),fill:'none',stroke:c,'stroke-width':2.5,'stroke-dasharray':['','7 3','2 4'][j]});m[key].forEach((v,i)=>{const mark=j===1?elt('rect',{x:x(i)-4,y:y(v)-4,width:8,height:8,fill:c}):j===2?elt('path',{d:`M ${x(i)} ${y(v)-5} l 5 9 h -10 Z`,fill:c}):elt('circle',{cx:x(i),cy:y(v),r:i===effort?6:4,fill:c});const title=document.createElementNS(ns,'title');title.textContent=`${m.name}, ${levels[i]}: ${fmt(key,v)}`;mark.append(title);});});
}
function render(){
 const item=meta.find(m=>m[0]===key);document.querySelector('#metric-title').textContent=item[1];document.querySelector('#metric-unit').textContent=item[2];document.querySelector('#metric-explanation').textContent=item[3];
 document.querySelector('#snapshot').textContent=t('Snapshot: ','取得日：')+(meta.indexOf(item)<8?D.snapshots.core:D.snapshots.additional);
 document.querySelector('#selected-heading').textContent=levels[effort];
 document.querySelector('#selected-values').innerHTML=M.map((m,i)=>`<tr><th scope="row">${['●','■','▲'][i]} ${m.name}</th><td>${fmt(key,m[key][effort])}</td></tr>`).join('');
 document.querySelector('#all-values').innerHTML=meta.map(([k,n,u])=>`<tr class="${key===k?'table-row-selected':''}"><th scope="row">${n}<br><small>${u}</small></th>${M.map(m=>`<td>${fmt(k,m[k][effort])}</td>`).join('')}</tr>`).join('');
 document.querySelector('#exact-title').textContent=t('All metrics at ','全指標：')+levels[effort];
 document.querySelector('#overview').innerHTML=['index','work','cost','latency'].map(k=>`<section class="stat"><h3>${meta.find(x=>x[0]===k)[1]}${k==='latency'?' (s)':''}</h3>${M.map(m=>`<div><span>${m.name}</span><strong>${fmt(k,m[k][effort])}</strong></div>`).join('')}</section>`).join('');
 document.querySelector('#status').textContent=item[1]+' · '+levels[effort]+'. '+M.map(m=>m.name+' '+fmt(key,m[key][effort])).join('; ');
 chart();syncURL();
}
select.addEventListener('change',()=>{key=select.value;render()});level.addEventListener('change',()=>{effort=Number(level.value);render()});window.addEventListener('hashchange',syncURL);new ResizeObserver(chart).observe(svg.parentElement);render();
document.querySelector('#download').addEventListener('click',()=>{const rows=[['model','effort',...meta.map(m=>m[0])],...M.flatMap(m=>D.efforts.map((e,i)=>[m.name,e,...meta.map(([k])=>m[k][i])]))];const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='model-benchmarks-2026-09.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
})();
