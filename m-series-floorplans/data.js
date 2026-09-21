/* M-series floorplan data. Coordinates are fractions of each die's width and height,
   in the orientation of the source image. */
(()=>{
const D={}; // dies
const b=(t,r,o)=>Object.assign({t,r},o||{});
// ---------- measured / annotated dies ----------
D.m1={w:11.34,h:10.85,measured:true,basis:'photo',src:'kurnal',blocks:[
 b('phy',[.04,0,.82,.04],{l:'LPDDR4X'}), b('phy',[.955,.04,.04,.6],{l:'LPDDR4X'}),
 b('gpu',[.05,.06,.37,.34],{n:4,c:2}), b('gsh',[.42,.06,.10,.24],{l:'GPU'}), b('gpu',[.52,.06,.18,.34],{n:4,c:2,s:4}),
 b('fab',[.42,.30,.10,.22]),
 b('p',[.02,.29,.26,.12],{n:2,c:2}), b('pl2',[.02,.41,.26,.25],{l:'L2 12 MB'}), b('p',[.02,.66,.26,.13],{n:2,c:2,s:2}),
 b('slc',[.28,.40,.14,.11],{l:'SLC'}), b('slc',[.52,.40,.18,.11],{l:'SLC'}),
 b('ane',[.28,.52,.14,.22],{n:16,c:4}),
 b('e',[.46,.53,.12,.15],{n:4,c:2}), b('el2',[.58,.57,.11,.12],{l:'L2 4 MB'}),
 b('media',[.70,.06,.25,.30],{l:'Media',i:1}), b('disp',[.70,.36,.25,.22],{l:'Display',i:1}), b('sys',[.70,.60,.25,.24],{l:'ISP · AOP',i:1}),
 b('tb',[.01,.80,.28,.19],{l:'TB3 / USB4 ×2',i:1}), b('io',[.29,.88,.23,.11],{l:'I/O PHY',i:1}),
 b('ssd',[.52,.86,.22,.13],{l:'SSD',i:1}), b('sep',[.76,.86,.20,.13],{l:'SEP',i:1})]};
D.m1pro={w:18.95,h:13.36,measured:true,basis:'photo',src:'kurnal',blocks:[
 b('io',[.23,0,.72,.11],{l:'TB4 · display PHYs',i:1}), b('media',[.01,.03,.17,.38],{l:'Media · ProRes',i:1}),
 b('el2',[.19,.17,.06,.13],{l:'L2 4 MB'}), b('e',[.25,.17,.05,.13],{n:2,c:1}),
 b('p',[.31,.14,.31,.14],{n:4,c:4}), b('pl2',[.37,.29,.19,.16],{l:'L2 2×12 MB'}), b('p',[.31,.46,.31,.13],{n:4,c:4,s:4}),
 b('disp',[.64,.12,.33,.31],{l:'Display · ISP',i:1}), b('ane',[.70,.45,.20,.14],{n:16,c:8}),
 b('phy',[0,.43,.09,.56],{l:'LPDDR5'}), b('phy',[.91,.43,.09,.56],{l:'LPDDR5'}),
 b('slc',[.10,.61,.12,.38],{l:'SLC'}), b('slc',[.78,.61,.11,.38],{l:'SLC'}),
 b('gpu',[.23,.61,.22,.38],{n:8,c:2}), b('gsh',[.45,.61,.10,.38],{l:'GPU'}), b('gpu',[.55,.61,.22,.38],{n:8,c:2,s:8})]};
D.m2={w:12.93,h:11.85,measured:true,basis:'photo',src:'kurnal',blocks:[
 b('phy',[.06,0,.93,.05],{l:'LPDDR5'}), b('phy',[.95,.05,.04,.5],{l:'LPDDR5'}), b('phy',[0,.05,.05,.2],{l:''}),
 b('gpu',[.06,.06,.29,.24],{n:4,c:2}), b('gsh',[.35,.06,.17,.19],{l:'GPU'}), b('gpu',[.52,.06,.28,.36],{n:6,c:2,s:4}),
 b('p',[.02,.31,.24,.13],{n:2,c:2}), b('pl2',[.02,.44,.24,.24],{l:'L2 16 MB'}), b('p',[.02,.68,.24,.13],{n:2,c:2,s:2}),
 b('slc',[.26,.27,.26,.23],{l:'SLC'}),
 b('e',[.45,.50,.11,.16],{n:4,c:2}), b('el2',[.56,.52,.08,.10],{l:'L2'}),
 b('ane',[.26,.62,.31,.18],{n:16,c:8}),
 b('tb',[.01,.82,.29,.17],{l:'TB / USB4 ×2',i:1}), b('io',[.31,.88,.24,.11],{l:'I/O PHY',i:1}),
 b('media',[.62,.42,.35,.25],{l:'Media · display',i:1}), b('sys',[.62,.67,.35,.18],{l:'ISP · AOP',i:1}), b('ssd',[.58,.87,.28,.12],{l:'SSD',i:1}), b('sep',[.87,.87,.12,.12],{l:'SEP',i:1})]};
D.m2pro={w:20.77,h:14.19,measured:true,basis:'photo',src:'kurnal',blocks:[
 b('io',[.15,0,.80,.10],{l:'TB4 · display PHYs',i:1}), b('media',[.01,.03,.12,.40],{l:'Media · ProRes',i:1}),
 b('el2',[.14,.22,.06,.10],{l:'L2'}), b('e',[.20,.19,.08,.18],{n:4,c:2}),
 b('p',[.32,.12,.10,.43],{n:4,c:2}), b('pl2',[.42,.23,.14,.23],{l:'L2 2×16 MB'}), b('p',[.56,.12,.09,.43],{n:4,c:2,s:4}),
 b('disp',[.67,.12,.30,.30],{l:'Display · ISP',i:1}), b('ane',[.72,.43,.18,.14],{n:16,c:8}),
 b('phy',[0,.46,.09,.53],{l:'LPDDR5'}), b('phy',[.91,.46,.09,.53],{l:'LPDDR5'}),
 b('slc',[.10,.59,.10,.40],{l:'SLC'}), b('slc',[.80,.59,.10,.40],{l:'SLC'}),
 b('gpu',[.20,.58,.19,.41],{n:10,c:2}), b('gsh',[.39,.58,.22,.41],{l:'GPU'}), b('gpu',[.61,.58,.19,.41],{n:9,c:2,s:10})]};
D.m3={w:13.57,h:11.24,measured:true,basis:'annot',src:'hy',blocks:[
 b('phy',[.06,0,.88,.05],{l:'LPDDR5'}), b('phy',[0,.04,.045,.24],{l:''}), b('phy',[.955,.04,.045,.27],{l:''}),
 b('gpu',[.06,.06,.88,.14],{n:6,c:6,lab:[0,1,4,5,6,7]}), b('gpu',[.06,.20,.27,.11],{n:2,c:2,lab:[2,3]}), b('gsh',[.33,.20,.31,.11],{l:'GPU misc'}), b('gpu',[.64,.20,.30,.11],{n:2,c:2,lab:[8,9]}),
 b('p',[.01,.34,.21,.13],{n:2,c:2}), b('pl2',[.01,.53,.40,.12],{l:'P-core cache'}), b('p',[.10,.67,.21,.13],{n:2,c:2,s:2}),
 b('slc',[.33,.34,.27,.15],{l:'SLC'}),
 b('e',[.48,.53,.14,.22],{n:4,c:2}), b('amx',[.62,.53,.08,.10],{l:'AMX'}), b('el2',[.62,.63,.08,.12],{l:'L2'}),
 b('ane',[.01,.64,.08,.16],{n:16,c:2}), b('disp',[.82,.43,.13,.22],{l:'Display'}),
 b('tb',[.18,.87,.20,.08],{l:'TB ×2'}), b('io',[.40,.93,.19,.06],{l:'I/O'}),
 b('media',[.70,.66,.29,.33],{l:'Media · ISP · SEP',i:1})]};
D.m3pro={w:13.77,h:15.92,measured:true,basis:'annot',src:'hy',blocks:[
 b('phy',[0,.07,.05,.22],{l:''}), b('phy',[0,.65,.05,.25],{l:'LPDDR5'}), b('phy',[.95,.07,.05,.22],{l:''}),
 b('gpu',[.06,.02,.30,.33],{n:6,c:2}), b('gpu',[.06,.35,.24,.08],{n:2,c:2,lab:[6,7]}),
 b('gpu',[.36,.02,.28,.09],{n:2,c:2,lab:[8,9]}), b('gsh',[.36,.11,.28,.23],{l:'GPU misc'}),
 b('gpu',[.64,.02,.30,.33],{n:6,c:2,lab:[10,11,12,13,14,15]}), b('gpu',[.70,.35,.24,.08],{n:2,c:2,lab:[16,17]}),
 b('slc',[.30,.35,.40,.08],{l:'SLC'}),
 b('p',[.59,.46,.21,.12],{n:2,c:2}), b('pl2',[.40,.59,.40,.09],{l:'P-core cache'}), b('p',[.39,.69,.41,.10],{n:4,c:4,s:2}),
 b('e',[.80,.44,.10,.21],{n:6,c:2}), b('amx',[.90,.44,.09,.21],{l:'AMX'}),
 b('ane',[.80,.66,.19,.08],{n:16,c:8}), b('disp',[.06,.60,.30,.12],{l:'Display ×2'}),
 b('media',[.06,.73,.30,.18],{l:'Media · ISP',i:1}), b('tb',[.48,.91,.37,.06],{l:'TB ×4'}), b('io',[.23,.94,.19,.055],{l:'I/O'})]};
D.m3max={w:17,h:17.5,measured:false,basis:'annot',src:'hy',blocks:[
 b('phy',[0,.28,.07,.72],{l:'LPDDR5'}), b('phy',[.93,.28,.07,.72],{l:'LPDDR5'}),
 b('slc',[.085,.44,.085,.56],{l:'SLC'}), b('slc',[.835,.44,.085,.56],{l:'SLC'}),
 b('gpu',[.18,.44,.22,.56],{n:16,c:2}), b('gpu',[.40,.44,.21,.10],{n:4,c:2,lab:[16,17,18,19]}), b('gsh',[.40,.54,.21,.33],{l:'GPU misc'}),
 b('gpu',[.40,.87,.21,.13],{n:4,c:2,lab:[20,21,22,23]}), b('gpu',[.61,.44,.22,.56],{n:16,c:2,s:24}),
 b('p',[.23,.10,.51,.08],{n:8,c:8}), b('pl2',[.23,.20,.50,.05],{l:'P-core cache'}), b('p',[.36,.27,.25,.06],{n:4,c:4,s:8}),
 b('e',[.11,.22,.08,.11],{n:4,c:2}), b('amx',[.19,.22,.04,.11],{l:'AMX'}),
 b('ane',[.01,.14,.09,.14],{n:16,c:2}), b('disp',[.75,.12,.25,.21],{l:'Display ×4'}),
 b('tb',[.56,.01,.30,.07],{l:'TB ×4'}), b('io',[.27,.01,.27,.04],{l:'I/O ×4'}),
 b('media',[.07,.34,.86,.09],{l:'Media engines · fabric',i:1})]};
D.m4={w:12.82,h:13.21,measured:true,basis:'annot',src:'kurnal',blocks:[
 b('phy',[.005,.03,.045,.15],{l:''}), b('phy',[.075,.005,.785,.055],{l:'LPDDR5X ×5'}), b('phy',[.935,.19,.055,.29],{l:'×2'}),
 b('gpu',[.075,.065,.905,.11],{n:6,c:6}), b('gpu',[.075,.18,.295,.11],{n:2,c:2,s:6}), b('gsh',[.37,.18,.255,.11],{l:'GPU L2 2 MB'}), b('gpu',[.625,.18,.30,.11],{n:2,c:2,s:8}),
 b('p',[.02,.30,.235,.155],{n:2,c:2}), b('amx',[.255,.30,.095,.155],{l:'P-AMX'}), b('pl2',[.02,.475,.435,.08],{l:'L2 16 MB'}), b('p',[.12,.56,.235,.155],{n:2,c:2,s:2}),
 b('slc',[.36,.295,.27,.16],{l:'SLC 8 MB'}),
 b('amx',[.62,.465,.08,.06],{l:'E-AMX'}), b('e',[.49,.505,.13,.24],{n:6,c:2}), b('el2',[.62,.53,.08,.12],{l:'L2 4 MB'}),
 b('ane',[.01,.56,.11,.26],{n:16,c:2}),
 b('media',[.70,.43,.23,.20],{l:'Video enc / dec'}), b('isp',[.43,.705,.09,.06],{l:'ISP'}), b('sys',[.52,.76,.30,.10],{l:'ISP · misc',i:1}),
 b('tb',[.01,.85,.39,.145],{l:'Thunderbolt ×4'}), b('ssd',[.405,.85,.095,.14],{l:'SSD'}),
 b('io',[.50,.93,.15,.065],{l:'USB'}), b('io',[.65,.89,.11,.10],{l:'ASDCI'}), b('sep',[.85,.88,.10,.07],{l:'SE'})]};
// ---------- derived dies ----------
function extend(base,f,extra,o){return Object.assign({w:base.w,measured:false,basis:'derived',src:'derived',blocks:base.blocks.map(x=>Object.assign({},x,{r:[x.r[0],x.r[1]*f,x.r[2],x.r[3]*f]})).concat(extra)},o);}
D.m1max=extend(D.m1pro,.59,[
 b('phy',[0,.59,.09,.37],{l:'LPDDR5'}), b('phy',[.91,.59,.09,.37],{l:'LPDDR5'}),
 b('slc',[.10,.59,.12,.37],{l:'SLC'}), b('slc',[.78,.59,.11,.37],{l:'SLC'}),
 b('gpu',[.23,.59,.22,.37],{n:8,c:2,s:16}), b('gsh',[.45,.59,.10,.37],{l:'GPU'}), b('gpu',[.55,.59,.22,.37],{n:8,c:2,s:24}),
 b('uf',[.12,.965,.76,.03],{l:'UltraFusion'})],{h:22.6,base:'m1pro'});
D.m2max=extend(D.m2pro,.60,[
 b('phy',[0,.60,.09,.36],{l:'LPDDR5'}), b('phy',[.91,.60,.09,.36],{l:'LPDDR5'}),
 b('slc',[.10,.60,.10,.36],{l:'SLC'}), b('slc',[.80,.60,.10,.36],{l:'SLC'}),
 b('gpu',[.20,.60,.19,.36],{n:10,c:2,s:19}), b('gsh',[.39,.60,.22,.36],{l:'GPU'}), b('gpu',[.61,.60,.19,.36],{n:9,c:2,s:29}),
 b('uf',[.12,.965,.76,.03],{l:'UltraFusion'})],{h:23.6,base:'m2pro'});
D.m3max.blocks.push(b('uf',[.2,.985,.6,.015],{l:'UltraFusion',i:1}));
D.m4pro={w:15,h:17.5,measured:false,basis:'lineage',src:'lineage',base:'m3pro',blocks:[
 b('phy',[0,.07,.05,.22],{l:'LPDDR5X'}), b('phy',[0,.65,.05,.25],{l:'LPDDR5X'}), b('phy',[.95,.07,.05,.22],{l:'LPDDR5X'}), b('phy',[.95,.65,.05,.25],{l:'LPDDR5X'}),
 b('gpu',[.06,.02,.30,.33],{n:6,c:2}), b('gpu',[.06,.35,.24,.08],{n:2,c:2,s:6}),
 b('gpu',[.36,.02,.28,.13],{n:4,c:4,s:8}), b('gsh',[.36,.15,.28,.19],{l:'GPU L2'}),
 b('gpu',[.64,.02,.30,.33],{n:6,c:2,s:12}), b('gpu',[.70,.35,.24,.08],{n:2,c:2,s:18}),
 b('slc',[.30,.35,.40,.08],{l:'SLC'}),
 b('p',[.39,.46,.41,.10],{n:5,c:5}), b('pl2',[.40,.57,.40,.08],{l:'L2 2 clusters'}), b('p',[.39,.66,.41,.10],{n:5,c:5,s:5}),
 b('e',[.80,.44,.10,.18],{n:4,c:2}), b('amx',[.90,.44,.09,.18],{l:'SME'}),
 b('ane',[.80,.64,.19,.10],{n:16,c:8}), b('disp',[.06,.60,.30,.12],{l:'Display'}),
 b('media',[.06,.73,.30,.18],{l:'Media · ISP'}), b('tb',[.44,.90,.45,.07],{l:'Thunderbolt 5'}), b('io',[.20,.93,.22,.06],{l:'I/O'})]};
D.m4max={w:17,h:17.5,measured:false,basis:'lineage',src:'lineage',base:'m3max',blocks:D.m3max.blocks.filter(x=>x.t!=='uf').map(x=>{
 const y=Object.assign({},x); if(y.t==='tb')y.l='Thunderbolt 5'; if(y.t==='amx')y.l='SME'; if(y.t==='phy')y.l='LPDDR5X'; delete y.i; return y;})};
function fromM4(opts){const m=D.m4; return m.blocks.map(x=>{const y=Object.assign({},x); delete y.i;
 if(y.t==='phy'&&y.l)y.l=y.l.replace('LPDDR5X','LPDDR5X'); if(y.l==='SLC 8 MB')y.l='SLC'; if(y.l==='L2 4 MB')y.l=opts.el2||'L2'; if(y.t==='amx')y.l=y.l.replace('AMX','SME'); if(y.t==='gsh')y.l='GPU L2'; return y;});}
D.m5={w:13,h:13.2,measured:false,basis:'lineage',src:'lineage',base:'m4',blocks:fromM4({el2:'L2 6 MB'})};
// M6: 2 super + 4 performance + 6 efficiency, 12-core GPU, dual 16-core Neural Engine
D.m6={w:13,h:13.6,measured:false,basis:'lineage',src:'lineage',base:'m5',blocks:[
 b('phy',[.005,.03,.045,.15],{l:''}), b('phy',[.075,.005,.785,.055],{l:'LPDDR5X'}), b('phy',[.935,.19,.055,.29],{l:''}),
 b('gpu',[.075,.065,.905,.11],{n:6,c:6}), b('gpu',[.075,.18,.37,.11],{n:3,c:3,s:6}), b('gsh',[.445,.18,.16,.11],{l:'GPU L2'}), b('gpu',[.605,.18,.375,.11],{n:3,c:3,s:9}),
 b('s',[.02,.30,.235,.155],{n:2,c:2}), b('amx',[.255,.30,.095,.155],{l:'SME'}), b('pl2',[.02,.475,.435,.08],{l:'L2'}), b('p',[.12,.56,.235,.155],{n:4,c:2}),
 b('slc',[.36,.295,.27,.16],{l:'SLC'}),
 b('amx',[.62,.465,.08,.06],{l:'SME'}), b('e',[.49,.505,.13,.24],{n:6,c:2}), b('el2',[.62,.53,.08,.12],{l:'L2'}),
 b('ane',[.01,.56,.11,.13],{n:16,c:2}), b('ane',[.01,.70,.11,.13],{n:16,c:2,s:16}),
 b('media',[.70,.43,.23,.20],{l:'Media'}), b('sys',[.43,.72,.39,.13],{l:'ISP · misc'}),
 b('tb',[.01,.85,.39,.145],{l:'Thunderbolt'}), b('ssd',[.405,.85,.095,.14],{l:'SSD'}), b('io',[.50,.93,.26,.065],{l:'USB · I/O'}), b('sep',[.85,.88,.10,.07],{l:'SE'})]};
// M5 Pro / Max: CPU die + GPU die (Fusion Architecture)
D.m5cpu={w:14,h:7.5,measured:false,basis:'lineage',src:'ti',blocks:[
 b('s',[.04,.08,.30,.34],{n:6,c:3}), b('sl2',[.04,.44,.30,.10],{l:'Super-core L2'}),
 b('p',[.37,.08,.44,.30],{n:12,c:6}), b('pl2',[.37,.40,.44,.14],{l:'Performance L2'}), b('amx',[.83,.08,.13,.46],{l:'SME'}),
 b('ane',[.04,.60,.24,.26],{n:16,c:8}), b('media',[.30,.60,.28,.26],{l:'Media engine'}), b('tb',[.60,.60,.36,.26],{l:'Thunderbolt 5 ctrl'}),
 b('d2d',[.04,.90,.92,.08],{l:'Die-to-die link'})]};
function gpuDie(n,h){const half=n/2,cols=half>10?4:2; return {w:14,h,measured:false,basis:'lineage',src:'ti',blocks:[
 b('d2d',[.04,0,.92,.05],{l:'Die-to-die link'}),
 b('phy',[0,.07,.07,.92],{l:'LPDDR5X'}), b('phy',[.93,.07,.07,.92],{l:'LPDDR5X'}),
 b('slc',[.08,.07,.08,.92],{l:'SLC'}), b('slc',[.84,.07,.08,.92],{l:'SLC'}),
 b('gpu',[.17,.07,.30,.92],{n:half,c:cols}), b('gsh',[.47,.07,.06,.92],{l:'GPU'}), b('gpu',[.53,.07,.30,.92],{n:half,c:cols,s:half})]};}
D.m5gpuPro=gpuDie(20,8); D.m5gpuMax=gpuDie(40,13);
window.FP_DIES=D;

// ---------- chips ----------
const one=d=>[{d,x:0,y:0}];
const ultra=d=>{const h=D[d].h;return [{d,x:0,y:0},{d,x:0,y:h+0.5,flip:true}];};
const fusion=g=>[{d:'m5cpu',x:0,y:0},{d:g,x:0,y:D.m5cpu.h+0.35}];
const fusionUltra=()=>{const a=fusion('m5gpuMax');const w=D.m5cpu.w+0.5;return a.concat(a.map(p=>Object.assign({},p,{x:w,mirror:true})));};
window.FP_CHIPS=[
 {id:'M1',gen:1,tier:'Base',date:'2020-11',node:'N5',tr:16,p:4,e:4,gpu:8,ane:16,bus:128,mem:'LPDDR4X-4266',bw:68,bwT:'t',max:16,pk:one('m1')},
 {id:'M1 Pro',gen:1,tier:'Pro',date:'2021-10',node:'N5',tr:33.7,p:8,e:2,gpu:16,ane:16,bus:256,mem:'LPDDR5-6400',bw:200,max:32,pk:one('m1pro')},
 {id:'M1 Max',gen:1,tier:'Max',date:'2021-10',node:'N5',tr:57,p:8,e:2,gpu:32,ane:16,bus:512,mem:'LPDDR5-6400',bw:400,max:64,pk:one('m1max')},
 {id:'M1 Ultra',gen:1,tier:'Ultra',date:'2022-03',node:'N5',tr:114,p:16,e:4,gpu:64,ane:32,bus:1024,mem:'LPDDR5-6400',bw:800,max:128,pk:ultra('m1max'),link:'2.5 TB/s'},
 {id:'M2',gen:2,tier:'Base',date:'2022-06',node:'N5P',tr:20,p:4,e:4,gpu:10,ane:16,bus:128,mem:'LPDDR5-6400',bw:100,max:24,pk:one('m2')},
 {id:'M2 Pro',gen:2,tier:'Pro',date:'2023-01',node:'N5P',tr:40,p:8,e:4,gpu:19,ane:16,bus:256,mem:'LPDDR5-6400',bw:200,max:32,pk:one('m2pro')},
 {id:'M2 Max',gen:2,tier:'Max',date:'2023-01',node:'N5P',tr:67,p:8,e:4,gpu:38,ane:16,bus:512,mem:'LPDDR5-6400',bw:400,max:96,pk:one('m2max')},
 {id:'M2 Ultra',gen:2,tier:'Ultra',date:'2023-06',node:'N5P',tr:134,p:16,e:8,gpu:76,ane:32,bus:1024,mem:'LPDDR5-6400',bw:800,max:192,pk:ultra('m2max'),link:'2.5 TB/s'},
 {id:'M3',gen:3,tier:'Base',date:'2023-10',node:'N3B',tr:25,p:4,e:4,gpu:10,ane:16,bus:128,mem:'LPDDR5-6400',bw:100,max:24,pk:one('m3')},
 {id:'M3 Pro',gen:3,tier:'Pro',date:'2023-10',node:'N3B',tr:37,p:6,e:6,gpu:18,ane:16,bus:192,mem:'LPDDR5-6400',bw:150,max:36,pk:one('m3pro')},
 {id:'M3 Max',gen:3,tier:'Max',date:'2023-10',node:'N3B',tr:92,p:12,e:4,gpu:40,ane:16,bus:512,mem:'LPDDR5-6400',bw:400,max:128,pk:one('m3max')},
 {id:'M3 Ultra',gen:3,tier:'Ultra',date:'2025-03',node:'N3B',tr:184,p:24,e:8,gpu:80,ane:32,bus:1024,mem:'LPDDR5-6400',bw:819,max:512,pk:ultra('m3max'),link:'UltraFusion'},
 {id:'M4',gen:4,tier:'Base',date:'2024-05',node:'N3E',tr:28,p:4,e:6,gpu:10,ane:16,bus:128,mem:'LPDDR5X-7500',bw:120,max:32,pk:one('m4')},
 {id:'M4 Pro',gen:4,tier:'Pro',date:'2024-10',node:'N3E',p:10,e:4,gpu:20,ane:16,bus:256,mem:'LPDDR5X-8533',bw:273,max:64,pk:one('m4pro')},
 {id:'M4 Max',gen:4,tier:'Max',date:'2024-10',node:'N3E',p:12,e:4,gpu:40,ane:16,bus:512,mem:'LPDDR5X-8533',bw:546,max:128,pk:one('m4max')},
 {id:'M5',gen:5,tier:'Base',date:'2025-10',node:'N3P',p:4,e:6,gpu:10,ane:16,bus:128,mem:'LPDDR5X-9600',bw:153,max:32,na:true,pk:one('m5')},
 {id:'M5 Pro',gen:5,tier:'Pro',date:'2026-03',node:'N3P',s:6,p:12,e:0,gpu:20,ane:16,bus:256,mem:'LPDDR5X',bw:307,max:64,na:true,pk:fusion('m5gpuPro'),fusion:true},
 {id:'M5 Max',gen:5,tier:'Max',date:'2026-03',node:'N3P',s:6,p:12,e:0,gpu:40,ane:16,bus:512,mem:'LPDDR5X',bw:614,max:128,na:true,pk:fusion('m5gpuMax'),fusion:true},
 {id:'M5 Ultra',gen:5,tier:'Ultra',date:'2026-08',node:'N3P',s:12,p:24,e:0,gpu:80,ane:32,bus:1024,mem:'LPDDR5X',bw:1200,max:512,na:true,pk:fusionUltra(),fusion:true,link:'4.4 TB/s'},
 {id:'M6',gen:6,tier:'Base',date:'2026-08',node:'N2',s:2,p:4,e:6,gpu:12,ane:32,bus:128,mem:'LPDDR5X',bw:170,max:32,na:true,pk:one('m6')}
];
})();
