(()=>{'use strict';
const JA=document.documentElement.lang.startsWith('ja'),T=(e,j)=>JA?j:e;
const D=window.FP_DIES,CH=window.FP_CHIPS,NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const TY={
 s:{c:'--s',n:T('Super core','スーパーコア'),g:'cpu',d:T('Apple\'s highest-performing CPU core class, named from M5 Pro onward. On M5 Pro and M5 Max the six super cores carry single-threaded speed.','M5 Pro以降でAppleが名付けた最上位のCPUコア。M5 ProとM5 Maxでは6基のスーパーコアがシングルスレッド性能を担う。')},
 p:{c:'--p',n:T('Performance core','高性能コア（Pコア）'),g:'cpu',d:T('Wide out-of-order cores built for single-threaded speed. On M5 Pro and later the name moves to a new, more efficient multithreaded core, and the fastest class becomes the super core.','シングルスレッド性能のための幅広いアウト・オブ・オーダーコア。M5 Pro以降ではこの名称がマルチスレッド効率を重視した新しいコアに移り、最速のコアはスーパーコアと呼ばれる。')},
 e:{c:'--e',n:T('Efficiency core','高効率コア（Eコア）'),g:'cpu',d:T('Narrow, low-power cores for background and light work. Pro and Max chips cut them back in favour of more performance cores; M5 Pro and M5 Max drop them entirely.','バックグラウンドや軽い処理のための低消費電力コア。ProとMaxではPコアを増やす代わりに減らされ、M5 ProとM5 Maxでは完全になくなった。')},
 pl2:{c:'--p',n:T('P-cluster L2','Pクラスタ L2'),g:'cpu',sram:1,d:T('Shared L2 for a cluster of performance cores. Apple uses no per-core L2 and no CPU L3, so this block is large and sits in the middle of its cores.','Pコアのクラスタが共有するL2。コアごとのL2もCPU用L3もないため大きく、コアの中央に置かれる。')},
 sl2:{c:'--s',n:T('Super-core L2','スーパーコア L2'),g:'cpu',sram:1,d:T('Shared L2 for the super-core cluster.','スーパーコアのクラスタが共有するL2。')},
 el2:{c:'--e',n:T('E-cluster L2','Eクラスタ L2'),g:'cpu',sram:1,d:T('Shared L2 for the efficiency cores.','Eコアが共有するL2。')},
 amx:{c:'--amx',n:T('Matrix unit (AMX / SME)','行列演算ユニット（AMX / SME）'),g:'cpu',d:T('The CPU-side matrix coprocessor each cluster shares. It was undocumented AMX until M4 exposed it as Arm SME.','各クラスタが共有するCPU側の行列コプロセッサ。M4でArm SMEとして公開されるまでは非公開のAMXだった。')},
 gpu:{c:'--gpu',n:T('GPU core','GPUコア'),g:'gpu',d:T('A shader core. Core counts are the chip\'s published maximum. From M3 each core has hardware ray tracing and Dynamic Caching. From M5 each also carries a Neural Accelerator, shown as the pink band.','シェーダコア。コア数は公表された最大構成である。M3以降は各コアがハードウェアレイトレーシングとDynamic Cachingを持ち、M5以降は桃色の帯で示したNeural Acceleratorも備える。')},
 gsh:{c:'--gpu',n:T('GPU shared logic and L2','GPU共有部とL2'),g:'gpu',sram:1,d:T('Command processing, geometry and the GPU\'s shared L2, shared by every core.','コマンド処理、ジオメトリ、GPU共有L2など、全コアが共有する部分。')},
 slc:{c:'--slc',n:T('System level cache','システムレベルキャッシュ（SLC）'),g:'mem',sram:1,d:T('The last-level cache shared by the CPU, GPU, Neural Engine and media. It is sliced, and each slice sits in front of the memory interface it serves, which is why the SLC always hugs the PHYs.','CPU、GPU、Neural Engine、メディアが共有する最終段キャッシュ。スライスに分かれ、それぞれ担当するメモリ接続の手前に置かれるため、SLCは常にPHYに寄り添う。')},
 phy:{c:'--mem',n:T('Memory interface (PHY)','メモリインターフェース（PHY）'),g:'mem',phy:1,d:T('The link to the DRAM packages that sit beside the die. Its length along the die edge grows with bus width, and that is what forces the Pro and Max dies to be long.','ダイの隣に載るDRAMとの接続部。ダイの縁に沿った長さはバス幅に比例し、ProやMaxのダイが長くなる理由はここにある。')},
 fab:{c:'--fab',n:T('Fabric','ファブリック'),g:'sys',d:T('Interconnect between the clusters and the SLC.','クラスタとSLCをつなぐ相互接続。')},
 ane:{c:'--ane',n:T('Neural Engine','Neural Engine'),g:'ane',d:T('Apple\'s fixed-function NPU, 16 cores per die. Ultras carry two, and M6 has two on a single die.','Appleの固定機能NPUで、ダイあたり16コア。Ultraは2基を持ち、M6は1枚のダイに2基を載せる。')},
 media:{c:'--media',n:T('Media engine','メディアエンジン'),g:'media',d:T('Hardware video encode and decode, including ProRes on Pro and Max. Max chips double it.','ハードウェアによる動画のエンコードとデコード。ProとMaxではProResにも対応し、Maxでは倍になる。')},
 disp:{c:'--media',n:T('Display engine','ディスプレイエンジン'),g:'media',d:T('Scan-out and compositing for the internal and external displays. The count of these blocks is why base chips drive fewer external displays.','内蔵・外部ディスプレイへの出力と合成。このブロックの数が、無印チップの外部ディスプレイ数が少ない理由である。')},
 tb:{c:'--io',n:T('Thunderbolt / USB4','Thunderbolt / USB4'),g:'io',d:T('Controllers and PHYs for the high-speed ports, placed along an edge.','高速ポートのコントローラとPHY。ダイの縁に並ぶ。')},
 io:{c:'--io',n:T('I/O','I/O'),g:'io',d:T('Other external interfaces: USB, PCIe and display links.','その他の外部接続：USB、PCIe、ディスプレイ接続など。')},
 ssd:{c:'--io',n:T('Storage controller','ストレージコントローラ'),g:'io',d:T('Apple\'s integrated NAND controller: the SSD\'s brain lives on the SoC.','Apple内蔵のNANDコントローラ。SSDの頭脳はSoC上にある。')},
 sep:{c:'--sys',n:'Secure Enclave',g:'sys',d:T('Isolated security processor for keys, Touch ID and FileVault.','鍵、Touch ID、FileVaultを扱う隔離されたセキュリティプロセッサ。')},
 isp:{c:'--sys',n:T('Image signal processor','イメージシグナルプロセッサ'),g:'sys',d:T('The camera pipeline.','カメラの画像処理経路。')},
 sys:{c:'--sys',n:T('System blocks','システムブロック'),g:'sys',d:T('ISP, always-on processor, power management and other small blocks. Sources do not separate them.','ISP、常時稼働プロセッサ、電力管理などの小さなブロック。出典では個別に区別されていない。')},
 uf:{c:'--link',n:'UltraFusion',g:'link',d:T('The edge interconnect that joins two Max dies into an Ultra through a silicon bridge. The operating system sees the pair as one chip.','シリコンブリッジを介して2枚のMaxダイをUltraに結合する縁の相互接続。OSからは2枚が1つのチップに見える。')},
 d2d:{c:'--link',n:T('Die-to-die link (Fusion)','ダイ間接続（Fusion）'),g:'link',d:T('The high-bandwidth, low-latency interface that joins the CPU die and the GPU die in M5 Pro and M5 Max.','M5 ProとM5 MaxでCPUダイとGPUダイを結ぶ高帯域・低遅延の接続。')}
};
const GROUPS=[['cpu',T('CPU','CPU'),'--p'],['gpu','GPU','--gpu'],['ane','Neural Engine','--ane'],['mem',T('SLC and memory','SLCとメモリ'),'--slc'],['media',T('Media and display','メディアと表示'),'--media'],['io','I/O','--io'],['sys',T('System','システム'),'--sys'],['link',T('Die links','ダイ間接続'),'--link']];
const PFX={p:'P',s:'S',e:'E',gpu:'G'};
const LJ={'Media engine':'メディアエンジン','Media':'メディア','Super-core L2':'スーパーコア L2','Performance L2':'Pコア L2','Die-to-die link':'ダイ間接続','Thunderbolt 5 ctrl':'Thunderbolt 5 制御','P-core cache':'Pコアキャッシュ','GPU misc':'GPU共有部','GPU L2':'GPU L2','Display':'表示','Display ×2':'表示 ×2','Display ×4':'表示 ×4','Media · ProRes':'メディア · ProRes','Media · display':'メディア · 表示','Display · ISP':'表示 · ISP','Media · ISP':'メディア · ISP','Media · ISP · SEP':'メディア · ISP · SEP','Media engines · fabric':'メディアエンジン · ファブリック','Video enc / dec':'動画エンコード / デコード','ISP · misc':'ISP · その他','L2 2 clusters':'L2（2クラスタ）','TB4 · display PHYs':'TB4 · 表示PHY'};
const LBL=l=>JA&&LJ[l]?LJ[l]:l;
const BASIS={
 photo:[T('Die photo','ダイ写真'),T('Blocks placed from a die photograph. The die size is measured.','ダイ写真からブロックを配置した。ダイ寸法は実測値。')],
 annot:[T('Labelled floorplan','注釈付きフロアプラン'),T('Blocks placed from a published labelled floorplan.','公開された注釈付きフロアプランからブロックを配置した。')],
 derived:[T('Derived die','派生ダイ'),T('The Pro die photograph extended by the second GPU half, memory and SLC. That is how Apple built the Max. Proportions below the Pro section are estimated.','Proのダイ写真を、GPUの後半、メモリ、SLCで下方に延長した。AppleがMaxを作った方法そのものである。Pro部分より下の比率は推定。')],
 lineage:[T('Lineage','系譜からの推定'),T('No public die image yet, so blocks follow the nearest relative\'s layout. Counts are exact; placement is an informed estimate.','公開されたダイ画像がまだないため、最も近い世代のレイアウトに倣って配置した。個数は正確だが、配置は根拠のある推定である。')]
};
const NOTES={
 'M1':T('The template for everything after it: GPU along one edge, performance cluster to one side, SLC in the middle.','以後すべての原型。GPUを一辺に、Pクラスタを片側に、SLCを中央に置く。'),
 'M1 Pro':T('A new die, not a bigger M1. The CPU moves to the centre, the GPU fills the lower half, and memory lines both long edges.','M1の拡大版ではなく新しいダイ。CPUが中央に移り、GPUが下半分を占め、メモリが両長辺に並ぶ。'),
 'M1 Max':T('The M1 Pro die with a second GPU half, memory and SLC added below it. The UltraFusion edge was already on this die, unannounced.','M1 Proのダイの下に、GPUの後半、メモリ、SLCを加えたもの。UltraFusionの縁は、発表前からこのダイに載っていた。'),
 'M1 Ultra':T('Two M1 Max dies, one flipped, joined along their UltraFusion edges at 2.5 TB/s.','2枚のM1 Maxダイの一方を反転させ、UltraFusionの縁どうしを2.5 TB/sで結合したもの。'),
 'M2':T('The M1 recipe on a larger die, with two more GPU cores and a 16 MB performance L2.','M1の構成を大きなダイに載せ、GPUコアを2基増やし、PクラスタのL2を16 MBにした。'),
 'M2 Pro':T('Same shape as M1 Pro, with four efficiency cores instead of two and 19 GPU cores.','M1 Proと同じ形で、Eコアを2基から4基に、GPUを19コアにした。'),
 'M2 Max':T('Again the Pro die extended downward, to 38 GPU cores and 512-bit memory.','再びProのダイを下方に延長し、GPU 38コア、512ビットメモリとした。'),
 'M2 Ultra':T('Two M2 Max dies over UltraFusion.','UltraFusionで結合した2枚のM2 Max。'),
 'M3':T('First 3 nm chip. The layout is recognisably M2, now with ray tracing and Dynamic Caching in every GPU core.','初の3 nmチップ。配置はM2を受け継ぎ、全GPUコアにレイトレーシングとDynamic Cachingが入った。'),
 'M3 Pro':T('Narrower memory (192-bit) and a 6 + 6 CPU. It was the first Pro that was not the top half of the Max.','メモリが192ビットに狭まり、CPUは6＋6。Maxの上半分ではない初めてのProである。'),
 'M3 Max':T('Now its own die: a 40-core GPU flanked by SLC and 512-bit memory, with the CPU along the top.','独立したダイになった。40コアのGPUをSLCと512ビットメモリが挟み、CPUは上辺に並ぶ。'),
 'M3 Ultra':T('Two M3 Max dies over UltraFusion. Where the connector sits on the M3 Max die is not public, so its placement here is inferred.','UltraFusionで結合した2枚のM3 Max。M3 Maxダイ上のコネクタ位置は公開されていないため、ここでの配置は推定である。'),
 'M4':T('The best-documented die in the family: every block here comes from an annotated die photograph.','ファミリーで最も資料の揃ったダイ。ここの全ブロックは注釈付きダイ写真に基づく。'),
 'M4 Pro':T('Ten performance cores in two clusters, 20 GPU cores and Thunderbolt 5. Apple released no die image for the M4 series.','2クラスタ計10基のPコア、GPU 20コア、Thunderbolt 5。AppleはM4シリーズのダイ画像を公開していない。'),
 'M4 Max':T('Arranged like M3 Max. Reported die shots show no UltraFusion edge, and there was no M4 Ultra.','M3 Maxと同様の配置。報じられたダイ写真にはUltraFusionの縁がなく、M4 Ultraも作られなかった。'),
 'M5':T('Apple\'s M4 layout carried forward. Every GPU core gains a Neural Accelerator, and the efficiency L2 grows to 6 MB.','M4のレイアウトを引き継ぎ、全GPUコアにNeural Acceleratorが加わり、EコアのL2は6 MBになった。'),
 'M5 Pro':T('Fusion Architecture: a CPU die and a GPU die. Memory bandwidth doubles from Pro to Max while the CPU die stays the same, so the memory interface must live on the GPU die. That is an inference, drawn that way here.','Fusion Architecture：CPUダイとGPUダイの2枚構成。ProからMaxでCPUダイは同じまま帯域幅が倍になるので、メモリ接続はGPUダイ側にあるはずだ。これは推論であり、図もそのように描いた。'),
 'M5 Max':T('The same CPU die with a GPU die twice the size: 40 cores and 512-bit memory.','同じCPUダイに、2倍の大きさのGPUダイ（40コア、512ビットメモリ）を組み合わせたもの。'),
 'M5 Ultra':T('Two dual-die M5 Max chips over a new UltraFusion at over 4.4 TB/s: four dies, a first for Apple. Which dies carry the bridge is not public.','2つのデュアルダイM5 Maxを4.4 TB/s超の新しいUltraFusionで結合した、Apple初の4ダイ構成。どのダイがブリッジを持つかは公開されていない。'),
 'M6':T('First 2 nm chip: two super cores, four performance, six efficiency, a 12-core GPU and two 16-core Neural Engines on one die.','初の2 nmチップ。スーパーコア2基、Pコア4基、Eコア6基、12コアGPU、16コアNeural Engine 2基を1枚のダイに載せる。')
};
const MISSING={'M4 Ultra':T('No M4 Ultra: M4 Max has no UltraFusion edge.','M4 Ultraはない。M4 MaxにはUltraFusionの縁がない。'),'M6 Pro':T('Not announced','未発表'),'M6 Max':T('Not announced','未発表'),'M6 Ultra':T('Not announced','未発表')};
function el(t,a,p){const e=document.createElementNS(NS,t);if(a)for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
function dieOf(c){return c.pk.map(p=>D[p.d]);}
function basisOf(c){const ds=dieOf(c);const order=['lineage','derived','annot','photo'];let w='photo';ds.forEach(d=>{if(order.indexOf(d.basis)<order.indexOf(w))w=d.basis;});return w;}
function bbox(c){let W=0,H=0;c.pk.forEach(p=>{const d=D[p.d];W=Math.max(W,p.x+d.w);H=Math.max(H,p.y+d.h);});return {W,H};}
/* ---------- renderer ----------
   The die view is drawn to look like a die photograph without using one: every
   texture is procedural. SRAM is a fine regular bit-cell grid broken into banks,
   logic is dense random speckle (standard cells), GPU cores repeat as identical
   tiles, PHYs are rows of I/O cells, and a thin metal sheen, seal ring and pad
   ring finish the die. Colour washes keep the functional groups readable. */
let UID=0;
const LOGIC=['media','disp','sys','io','tb','ssd','isp','sep','fab','amx'];
function inferredBlock(b,d){return !!(b.i||d.basis==='lineage'||(d.basis==='derived'&&b.r[1]>=.59));}
function defsFor(defs,u){
 const pat=(id,w,h,draw,tf)=>{const p=el('pattern',{id:id+u,width:w,height:h,patternUnits:'userSpaceOnUse'},defs);if(tf)p.setAttribute('patternTransform',tf);draw(p);return p;};
 /* bit cells: 2 x 2 cells per 5-unit tile */
 pat('sram',4,4,p=>{[[0.35,0.45],[2.35,0.45],[0.35,2.45],[2.35,2.45]].forEach(q=>el('rect',{x:q[0],y:q[1],width:1.4,height:1.1,fill:'#e4ecff','fill-opacity':.42},p));
  el('path',{d:'M0 1.95H4M0 3.95H4',stroke:'#000','stroke-opacity':.45,'stroke-width':.45},p);});
 /* banks: decoder and sense-amp gutters every 40 units */
 pat('bank',40,40,p=>{el('path',{d:'M0 0.9H40M0.9 0V40',stroke:'#07080a','stroke-opacity':.75,'stroke-width':1.8},p);
  el('path',{d:'M0 2.2H40M2.2 0V40',stroke:'#ffe9b8','stroke-opacity':.18,'stroke-width':.6},p);});
 /* I/O cells for PHYs, vertical and horizontal runs */
 pat('phyv',12,7,p=>{el('rect',{x:.8,y:.8,width:10.4,height:5.4,fill:'#d8b98a','fill-opacity':.18,stroke:'#f2d6a2','stroke-opacity':.35,'stroke-width':.4},p);
  el('rect',{x:4.4,y:2,width:3.2,height:3,fill:'#f4cf7c','fill-opacity':.55},p);});
 pat('phyh',7,12,p=>{el('rect',{x:.8,y:.8,width:5.4,height:10.4,fill:'#d8b98a','fill-opacity':.18,stroke:'#f2d6a2','stroke-opacity':.35,'stroke-width':.4},p);
  el('rect',{x:2,y:4.4,width:3,height:3.2,fill:'#f4cf7c','fill-opacity':.55},p);});
 /* logic: routing tracks over the speckle */
 pat('trk',3,2.4,p=>{el('path',{d:'M0 .3H3',stroke:'#000','stroke-opacity':.32,'stroke-width':.45},p);el('path',{d:'M0 1.5H3',stroke:'#d7e0ff','stroke-opacity':.05,'stroke-width':.4},p);});
 /* standard-cell speckle */
 const f=el('filter',{id:'noise'+u,x:0,y:0,width:'100%',height:'100%',filterUnits:'objectBoundingBox','color-interpolation-filters':'sRGB'},defs);
 el('feTurbulence',{type:'fractalNoise',baseFrequency:'0.55 1.6',numOctaves:2,seed:7,result:'n'},f);
 el('feColorMatrix',{in:'n',type:'matrix',values:'0 0 0 0 .80  0 0 0 0 .78  0 0 0 0 .74  2.6 0 0 0 -1.22'},f);
 const f2=el('filter',{id:'blot'+u,x:0,y:0,width:'100%',height:'100%',filterUnits:'objectBoundingBox','color-interpolation-filters':'sRGB'},defs);
 el('feTurbulence',{type:'fractalNoise',baseFrequency:'0.018',numOctaves:3,seed:3,result:'n'},f2);
 el('feColorMatrix',{in:'n',type:'matrix',values:'0 0 0 0 .62  0 0 0 0 .50  0 0 0 0 .40  1.5 0 0 0 -.60'},f2);
 const f3=el('filter',{id:'blot2'+u,x:0,y:0,width:'100%',height:'100%',filterUnits:'objectBoundingBox','color-interpolation-filters':'sRGB'},defs);
 el('feTurbulence',{type:'fractalNoise',baseFrequency:'0.03',numOctaves:2,seed:11,result:'n'},f3);
 el('feColorMatrix',{in:'n',type:'matrix',values:'0 0 0 0 .30  0 0 0 0 .45  0 0 0 0 .70  1.5 0 0 0 -.62'},f3);
 /* metal-layer sheen and silicon body */
 const lg=el('linearGradient',{id:'sheen'+u,x1:0,y1:0,x2:1,y2:1},defs);
 [[0,'#7aa2ff',.10],[.28,'#ffffff',0],[.46,'#fff3d6',.12],[.54,'#ffffff',.02],[.72,'#ffffff',0],[1,'#c49bff',.12]].forEach(s=>el('stop',{offset:s[0],'stop-color':s[1],'stop-opacity':s[2]},lg));
 const rg=el('radialGradient',{id:'body'+u,cx:.42,cy:.38,r:.85},defs);
 [[0,'#232831'],[.65,'#171a20'],[1,'#0f1115']].forEach(s=>el('stop',{offset:s[0],'stop-color':s[1]},rg));
}
function render(svg,c,o){o=o||{};while(svg.firstChild)svg.removeChild(svg.firstChild);
 const {W,H}=bbox(c),K=o.K||(o.thumb?100:1000)/Math.max(W,H),pad=o.thumb?3:30,bar=(!o.thumb&&dieOf(c).every(d=>d.measured))?34:0;
 const VW=W*K+pad*2,VH=H*K+pad*2+bar;svg.setAttribute('viewBox',`0 0 ${VW.toFixed(1)} ${VH.toFixed(1)}`);
 const u='-'+(++UID);
 const defs=el('defs',null,svg); defsFor(defs,u);
 /* on-screen pixels per viewBox unit, so labels appear only where they can be read */
 let scr=1;if(!o.thumb){const host=svg.parentNode,aw=o.aw||Math.max(240,(host&&host.clientWidth||700)-20);scr=aw/VW;const mh=(o.two?.62:.78)*(window.innerHeight||900);if(!o.aw&&VH*scr>mh)scr=mh/VH;}
 const MINPX=o.thumb?99:7.2;
 const cnt={},blocks=[],dieRects=[],dieCaps=[];
 c.pk.forEach((pl,di)=>{const d=D[pl.d],X=pad+pl.x*K,Y=pad+pl.y*K,w=d.w*K,h=d.h*K;
  const g=el('g',{class:'die-g'},svg);
  if(o.thumb){el('rect',{x:X-1,y:Y-1,width:w+2,height:h+2,rx:2,fill:'var(--sil-edge)'},g);el('rect',{x:X,y:Y,width:w,height:h,rx:1.5,fill:'url(#body'+u+')'},g);}
  else{
   /* scribe, seal ring and pad ring outside the measured die */
   const rg=c.pk.length>1?5:9;
   el('rect',{x:X-rg,y:Y-rg,width:w+rg*2,height:h+rg*2,rx:3,fill:'#0a0b0e',stroke:'#3c434e','stroke-width':1},g);
   el('rect',{x:X-rg+2.5,y:Y-rg+2.5,width:w+rg*2-5,height:h+rg*2-5,rx:2,fill:'none',stroke:'#8d96a3','stroke-opacity':.55,'stroke-width':.8},g);
   el('rect',{x:X-4.6,y:Y-4.6,width:w+9.2,height:h+9.2,rx:1.5,fill:'none',stroke:'#c9a86a','stroke-opacity':.35,'stroke-width':.6},g);
   const pads=el('g',{fill:'#d9b46a','fill-opacity':.55},g);
   for(let x=X+6;x<X+w-4;x+=9){el('rect',{x,y:Y-3.4,width:4.2,height:2.6},pads);el('rect',{x,y:Y+h+.8,width:4.2,height:2.6},pads);}
   for(let y=Y+6;y<Y+h-4;y+=9){el('rect',{x:X-3.4,y,width:2.6,height:4.2},pads);el('rect',{x:X+w+.8,y,width:2.6,height:4.2},pads);}
   el('rect',{x:X,y:Y,width:w,height:h,fill:'url(#body'+u+')'},g);
   el('rect',{x:X,y:Y,width:w,height:h,filter:`url(#blot${u})`,opacity:.30,'pointer-events':'none'},g);
   el('rect',{x:X,y:Y,width:w,height:h,filter:`url(#blot2${u})`,opacity:.30,'pointer-events':'none'},g);
   el('rect',{x:X,y:Y,width:w,height:h,filter:`url(#noise${u})`,opacity:.42,'pointer-events':'none'},g);
   el('rect',{x:X,y:Y,width:w,height:h,fill:`url(#trk${u})`,'pointer-events':'none'},g);
  }
  dieRects.push({X,Y,w,h,d,pl});
  const base={};Object.keys(cnt).forEach(k=>base[k]=cnt[k]);
  d.blocks.forEach(b=>{let [x,y,bw,bh]=b.r;if(pl.flip)y=1-y-bh;if(pl.mirror)x=1-x-bw;
   const bx=X+x*w,by=Y+y*h,BW=bw*w,BH=bh*h,ty=TY[b.t],col=`var(${ty.c})`,inf=inferredBlock(b,d);
   const grp=el('g',{class:'blk'+(inf?' inf':''),'data-g':ty.g},g);
   const rec={b,ty,die:d,chip:c,g:grp,cx:bx+BW/2,cy:by+BH/2,x:bx,y:by,w:BW,h:BH,di,inf};blocks.push(rec);
   const R={x:bx+.6,y:by+.6,width:Math.max(BW-1.2,.5),height:Math.max(BH-1.2,.5)};
   if(o.thumb){el('rect',Object.assign({rx:.8,fill:col,'fill-opacity':b.n?.12:.42,stroke:col,'stroke-opacity':.9,'stroke-width':.5},R),grp);}
   else{
    /* colour wash first, then the silicon texture for the block's kind */
    el('rect',Object.assign({class:'wash',fill:col,'fill-opacity':b.n?.07:(ty.sram?.20:ty.phy?.16:.15)},R),grp);
    if(ty.sram&&!b.n){el('rect',Object.assign({fill:'#0c0e12','fill-opacity':.55},R),grp);
     el('rect',Object.assign({fill:col,'fill-opacity':.16},R),grp);
     el('rect',Object.assign({fill:`url(#sram${u})`,'pointer-events':'none'},R),grp);
     el('rect',Object.assign({fill:`url(#bank${u})`,'pointer-events':'none'},R),grp);}
    else if(ty.phy){el('rect',Object.assign({fill:`url(#${BW<BH?'phyv':'phyh'}${u})`,'pointer-events':'none'},R),grp);}
    else if(!b.n&&LOGIC.includes(b.t)){el('rect',Object.assign({fill:`url(#trk${u})`,'pointer-events':'none'},R),grp);}
    el('rect',Object.assign({class:'bb',rx:1.2,fill:'none',stroke:col,'stroke-opacity':.95,'stroke-width':1.1},R,inf?{'stroke-dasharray':'4 2.5'}:{}),grp);
    const tt=el('title',null,grp);tt.textContent=ty.n+(b.l&&!b.n?' · '+LBL(b.l):'')+(b.n?' · '+b.n:'')+(inf?T(' (placement inferred)','（配置は推定）'):'');
   }
   if(b.n){const cols=b.c||b.n,rows=Math.ceil(b.n/cols),gx=Math.min(BW/cols*.08,4),gy=Math.min(BH/rows*.08,4),cw=(BW-gx*(cols+1))/cols,chh=(BH-gy*(rows+1))/rows;
    for(let i=0;i<b.n;i++){const ci=i%cols,ri=Math.floor(i/cols);let cx=bx+gx+ci*(cw+gx),cy=by+gy+ri*(chh+gy);
     if(o.thumb){el('rect',{x:cx,y:cy,width:cw,height:chh,rx:.6,fill:col,'fill-opacity':.5,stroke:col,'stroke-width':.3},grp);continue;}
     el('rect',{x:cx,y:cy,width:cw,height:chh,rx:1,fill:'#0d1014','fill-opacity':.22,stroke:col,'stroke-width':.9,'stroke-opacity':.95},grp);
     el('rect',{x:cx,y:cy,width:cw,height:chh,rx:1,fill:col,'fill-opacity':.16},grp);
     coreDetail(grp,b.t,cx,cy,cw,chh,col,u,c.na);
     if(PFX[b.t]){const idx=(base[b.t]||0)+(b.lab?b.lab[i]:(b.s||0)+i);const fs=Math.min(12.5/scr,cw/2.5,chh/2.1);
      if(fs*scr>=MINPX){const t=el('text',{x:cx+cw/2,y:cy+chh*(c.na&&b.t==='gpu'?.34:.5)+fs*.35,'text-anchor':'middle','font-size':fs.toFixed(1),class:'lbl'},grp);t.textContent=PFX[b.t]+idx;}}}
    cnt[b.t]=Math.max(cnt[b.t]||0,(base[b.t]||0)+(b.lab?Math.max(...b.lab)+1:(b.s||0)+b.n));}
   else if(!o.thumb&&b.l){const vert=BH>BW*1.6&&BW<70,len=LBL(b.l).length*(JA&&LJ[b.l]?1.7:1),fs=Math.min(14/scr,(vert?BH:BW)/(len*.62+1),(vert?BW:BH)*.55);
    if(fs*scr>=MINPX){const t=el('text',{x:bx+BW/2,y:by+BH/2+fs*.35,'text-anchor':'middle','font-size':fs.toFixed(1),class:'lbl'},grp);if(vert)t.setAttribute('transform',`rotate(-90 ${bx+BW/2} ${by+BH/2})`);t.textContent=LBL(b.l);}}
   if(!o.thumb){grp.setAttribute('tabindex','0');grp.setAttribute('role','button');grp.setAttribute('aria-label',ty.n+(b.l?' · '+b.l:'')+(inf?T(', placement inferred','、配置は推定'):''));}
  });
  if(!o.thumb)el('rect',{x:X,y:Y,width:w,height:h,fill:'url(#sheen'+u+')','pointer-events':'none'},g);
  // die caption
  if(!o.thumb&&c.pk.length>1){const lab=pl.d.startsWith('m5cpu')?T('CPU die','CPUダイ'):pl.d.startsWith('m5gpu')?T('GPU die','GPUダイ'):T('Die ','ダイ')+(di+1);
   const fs=Math.max(11,9.5/scr),tw=lab.length*fs*.62+10,cg=el('g',{class:'diecap','pointer-events':'none'},svg);
   dieCaps.push(()=>{svg.appendChild(cg);});
   el('rect',{x:X+4,y:Y+4,width:tw,height:fs+7,rx:3,fill:'#0b0c0f','fill-opacity':.82,stroke:'#59616d','stroke-width':.8},cg);
   const t=el('text',{x:X+9,y:Y+4+fs*.98,'font-size':fs,class:'cap'},cg);t.textContent=lab;}
 });
 // links between dies
 if(!o.thumb&&c.pk.length>1){const lg=el('g',{class:'links'},svg);
  for(let i=0;i<dieRects.length;i++)for(let j=i+1;j<dieRects.length;j++){const a=dieRects[i],b=dieRects[j];
   const vert=Math.abs(a.X-b.X)<1&&b.Y>a.Y+a.h-1&&b.Y-a.Y-a.h<40,hor=Math.abs(a.Y-b.Y)<1&&b.X>a.X+a.w-1&&b.X-a.X-a.w<40;
   if(vert){const y1=a.Y+a.h,y2=b.Y,x=a.X+a.w*.12,w=a.w*.76;el('rect',{x,y:y1+1,width:w,height:Math.max(y2-y1-2,2),fill:'var(--link)','fill-opacity':.7,rx:1},lg);
    const t=el('text',{x:x+w/2,y:(y1+y2)/2+3.5,'font-size':Math.min(10,Math.max(y2-y1-1,6)),'text-anchor':'middle',fill:'#15181d','font-weight':600},lg);t.textContent=c.fusion?T('Fusion link','Fusion接続'):'UltraFusion '+(c.link||'');}
   if(hor&&a.pl.d===b.pl.d&&a.pl.d.startsWith('m5gpu')){const x1=a.X+a.w,x2=b.X,y=a.Y+a.h*.2,h=a.h*.6;el('rect',{x:x1+1,y,width:Math.max(x2-x1-2,2),height:h,fill:'var(--link)','fill-opacity':.7,rx:1},lg);
    const t=el('text',{x:(x1+x2)/2,y:a.Y+a.h+18,'font-size':11,'text-anchor':'middle',class:'cap'},lg);t.textContent='UltraFusion '+c.link;}}}
 // scale bar
 if(bar){const x=pad,y=pad+H*K+22,L=5*K;el('line',{x1:x,y1:y,x2:x+L,y2:y,stroke:'currentColor','stroke-width':2},svg);[x,x+L].forEach(xx=>el('line',{x1:xx,y1:y-5,x2:xx,y2:y+5,stroke:'currentColor','stroke-width':1.5},svg));
  const t=el('text',{x:x+L+8,y:y+4,'font-size':Math.max(12,10/scr),fill:'currentColor',class:'scale'},svg);t.textContent='5 mm';}
 if(!o.thumb)drawPaths(svg,c,blocks,dieRects);
 dieCaps.forEach(f=>f());
 return {blocks,K};
}
/* inside a core: what a die photo shows at that scale */
function coreDetail(grp,t,x,y,w,h,col,u,na){
 const r=(a)=>el('rect',Object.assign({'pointer-events':'none'},a),grp);
 if(w<5||h<5)return;
 if(t==='gpu'){ /* four ALU quadrants around a register-file strip */
  const m=Math.max(.6,w*.06),sh=h*.16,qh=(h-sh-m*3)/2,qw=(w-m*3)/2;
  [[0,0],[1,0],[0,1],[1,1]].forEach(q=>{const qy=y+m+q[1]*(qh+sh+m);r({x:x+m+q[0]*(qw+m),y:qy,width:qw,height:qh,fill:'#cdd6ff','fill-opacity':.07,stroke:col,'stroke-opacity':.45,'stroke-width':.5});});
  r({x:x+m,y:y+m+qh+m*.5,width:w-2*m,height:sh,fill:`url(#sram${u})`});
  if(na)r({x:x+w*.12,y:y+h*.56,width:w*.76,height:h*.2,rx:.8,fill:'var(--na)','fill-opacity':.75});
 }else if(t==='p'||t==='s'||t==='e'){ /* L1 arrays across the top, logic below */
  const m=Math.max(.5,w*.05);
  r({x:x+m,y:y+m,width:w-2*m,height:h*.28,fill:`url(#sram${u})`});
  r({x:x+m,y:y+m,width:w-2*m,height:h*.28,fill:'none',stroke:'#000','stroke-opacity':.4,'stroke-width':.5});
  r({x:x+m,y:y+h*.72,width:(w-2*m)*.45,height:h*.2,fill:`url(#sram${u})`});
  r({x:x+w*.55,y:y+h*.4,width:w*.38,height:h*.24,fill:'#d8e0ff','fill-opacity':.06,stroke:col,'stroke-opacity':.35,'stroke-width':.45});
  r({x:x+w*.55,y:y+h*.72,width:w*.38,height:h*.2,fill:`url(#sram${u})`,opacity:.8});
 }else if(t==='ane'){r({x:x+w*.15,y:y+h*.15,width:w*.7,height:h*.32,fill:`url(#sram${u})`});}
}
function center(r){return [r.cx,r.cy];}
function nearest(list,p){let best=null,bd=1e9;list.forEach(r=>{const d=Math.hypot(r.cx-p[0],r.cy-p[1]);if(d<bd){bd=d;best=r;}});return best;}
function drawPaths(svg,c,blocks,dies){const g=el('g',{class:'paths'},svg);
 const route=(pts,col)=>{const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');el('path',{d,fill:'none',stroke:'#0b0d10','stroke-width':6,'stroke-linejoin':'round','stroke-linecap':'round',opacity:.55},g);el('path',{d,fill:'none',stroke:col,'stroke-width':3,'stroke-linejoin':'round','stroke-linecap':'round'},g);const e=pts[pts.length-1];el('circle',{cx:e[0],cy:e[1],r:5,fill:col,stroke:'#0b0d10','stroke-width':1.5},g);el('circle',{cx:pts[0][0],cy:pts[0][1],r:3,fill:col},g);};
 const orth=(a,b)=>[a,[b[0],a[1]],b];
 const byDie=di=>blocks.filter(r=>r.di===di);
 dies.forEach((dr,di)=>{const bl=byDie(di);const slcs=bl.filter(r=>r.b.t==='slc'),phys=bl.filter(r=>r.b.t==='phy');
  const srcs=[['p','var(--p)'],['s','var(--s)'],['gpu','var(--na)'],['ane','var(--ane)']];
  srcs.forEach(([t,col],si)=>{const s0=bl.find(r=>r.b.t===t);if(!s0)return;const o=(si-1.5)*7;const s=Object.assign({},s0,{cx:s0.cx+o,cy:s0.cy+o});
   if(slcs.length){const sl=nearest(slcs,center(s));const tg=[sl.cx+o,sl.cy+o];route(orth(center(s),tg),col);}
   else{const d2=bl.find(r=>r.b.t==='d2d');const nx=byDie(di+1);const d2b=nx.find(r=>r.b.t==='d2d');const sl=nx.filter(r=>r.b.t==='slc');
    if(d2&&d2b&&sl.length){const p1=[s.cx,d2.cy],p2=[s.cx,d2b.cy];const t=nearest(sl,p2);route([center(s),p1,p2,[t.cx,p2[1]],center(t)],col);}}});
  slcs.forEach(sl=>{if(!phys.length)return;const ph=nearest(phys,center(sl));const tgt=[ph.cx,ph.cy];
   const hor=ph.w<ph.h;route(hor?[center(sl),[ph.cx,sl.cy]]:[center(sl),[sl.cx,ph.cy]],'var(--slc)');});});
}
/* The renderer is shared with the Apple silicon atlas, which loads this file
   without the floorplan page's controls. */
window.FPR={render,basisOf,BASIS,TY,GROUPS,LBL,chips:CH,inferredBlock};
if(!$('fp-picker'))return;
/* ---------- UI ---------- */
const state={chip:'M5',vs:''};
try{const q=new URLSearchParams(location.search);const a=q.get('chip'),v=q.get('vs');if(a&&CH.find(c=>c.id===a.replace(/-/g,' ')))state.chip=a.replace(/-/g,' ');if(v&&CH.find(c=>c.id===v.replace(/-/g,' ')))state.vs=v.replace(/-/g,' ');}catch(e){}
const chipBy=id=>CH.find(c=>c.id===id);
function syncURL(){try{const q=new URLSearchParams(location.search);q.set('chip',state.chip.replace(/ /g,'-'));if(state.vs)q.set('vs',state.vs.replace(/ /g,'-'));else q.delete('vs');history.replaceState(null,'','?'+q.toString()+location.hash);}catch(e){}}
// picker
const TIERS=['Base','Pro','Max','Ultra'],TN={Base:T('Base','無印'),Pro:'Pro',Max:'Max',Ultra:'Ultra'};
function buildPicker(){const host=$('fp-picker');host.innerHTML='';
 const head=document.createElement('div');head.className='pk-row pk-head';head.innerHTML='<span></span>'+TIERS.map(t=>`<span>${TN[t]}</span>`).join('');host.appendChild(head);
 for(let g=1;g<=6;g++){const row=document.createElement('div');row.className='pk-row';row.innerHTML=`<span class="pk-gen">M${g}</span>`;
  TIERS.forEach(t=>{const id=t==='Base'?`M${g}`:`M${g} ${t}`,c=chipBy(id);
   if(!c){const s=document.createElement('span');s.className='pk-cell pk-none';s.textContent=MISSING[id]||'';s.title=MISSING[id]||'';row.appendChild(s);return;}
   const bt=document.createElement('button');bt.type='button';bt.className='pk-cell';bt.dataset.id=id;bt.setAttribute('aria-pressed',id===state.chip);
   const sv=el('svg',{class:'pk-svg','aria-hidden':'true'});render(sv,c,{thumb:true});bt.appendChild(sv);
   const lb=document.createElement('span');lb.className='pk-name';lb.innerHTML=`${c.id}<i class="dot ${basisOf(c)}" title="${BASIS[basisOf(c)][0]}"></i>`;bt.appendChild(lb);
   bt.onclick=()=>{state.chip=id;update();};row.appendChild(bt);});
  host.appendChild(row);}}
// legend
let active=null;
function buildLegend(){const host=$('fp-legend');host.innerHTML='';GROUPS.forEach(([k,n,v])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.g=k;b.setAttribute('aria-pressed','false');b.innerHTML=`<i style="background:var(${v})"></i>${n}`;b.onclick=()=>{active=active===k?null:k;applyHL();};host.appendChild(b);});
 const f=document.createElement('button');f.type='button';f.className='chip toggle';f.id='fp-flow';f.setAttribute('aria-pressed','false');f.textContent=T('Show data paths','データ経路を表示');
 f.onclick=()=>{const on=f.getAttribute('aria-pressed')!=='true';f.setAttribute('aria-pressed',on);document.querySelectorAll('.fp-stage svg').forEach(s=>s.classList.toggle('flow',on));};host.appendChild(f);}
function applyHL(){document.querySelectorAll('.fp-stage svg').forEach(s=>{s.classList.toggle('dim',!!active);s.querySelectorAll('.blk').forEach(n=>n.classList.toggle('hl',n.dataset.g===active));});
 $('fp-legend').querySelectorAll('.chip:not(.toggle)').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g===active));}
// compare select
function buildCompare(){const s=$('fp-vs');s.innerHTML=`<option value="">${T('Nothing','比較しない')}</option>`+CH.map(c=>`<option value="${c.id}">${c.id}</option>`).join('');s.value=state.vs;s.onchange=()=>{state.vs=s.value;update();};}
function fmtCPU(c){const a=[];if(c.s)a.push(`${c.s} ${T('super','スーパー')}`);a.push(`${c.p} ${T('performance','P')}`);if(c.e)a.push(`${c.e} ${T('efficiency','E')}`);return a.join(' + ');}
function card(c){const bs=basisOf(c),ds=dieOf(c),m=ds.every(d=>d.measured);
 const size=m&&ds.length===1?`${ds[0].w.toFixed(2)} × ${ds[0].h.toFixed(2)} mm · ${(ds[0].w*ds[0].h).toFixed(0)} mm²`:T('Not publicly measured','公開された実測値なし');
 const rows=[[T('Announced','発表'),c.date.replace('-','.')],[T('Process','製造プロセス'),'TSMC '+c.node],[T('Dies','ダイ数'),String(c.pk.length)],[T('Die size','ダイ寸法'),size],
  [T('CPU cores','CPUコア'),fmtCPU(c)],['GPU',`${c.gpu} ${T('cores','コア')}${c.na?T(', Neural Accelerator in each','、各コアにNeural Accelerator'):''}`],['Neural Engine',`${c.ane} ${T('cores','コア')}`],
  [T('Memory','メモリ'),`${c.bus}-bit ${c.mem} · ${c.bw>=1000?(c.bw/1000).toFixed(1)+' TB/s':c.bw+' GB/s'}${c.bwT?T(' (reported)','（報告値）'):''}`],[T('Max memory','最大メモリ'),`${c.max} GB`],[T('Transistors','トランジスタ数'),c.tr?`${c.tr} ${T('billion','億').replace('億','')}${JA?'0億':''}`:T('Not disclosed','非公開')]];
 if(JA&&c.tr)rows[rows.length-1][1]=`${Math.round(c.tr*10)}億`;
 return `<div class="cc-top"><h2>${c.id}</h2><span class="basis ${bs}">${BASIS[bs][0]}</span></div><p class="cc-note">${NOTES[c.id]||''}</p><dl class="cc-dl">${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl><p class="cc-basis">${BASIS[bs][1]}${c.fusion?T(' The split into a CPU die and a GPU die is confirmed by TechInsights\' package analysis.',' CPUダイとGPUダイへの分割は、TechInsightsのパッケージ解析で確認されている。'):''}</p>`;}
function blockInfo(rec){const b=rec.b,inf=b.i||rec.die.basis==='lineage'||(rec.die.basis==='derived'&&b.r[1]>=.59),tag=inf?T('Placement inferred','配置は推定'):T('Placement from source','出典に基づく配置');
 let extra='';if(b.n)extra=`<p class="bi-n">${b.n} ${T('in this block','基（このブロック）')}</p>`;
 return `<div class="bi-cat"><i style="background:var(${rec.ty.c})"></i>${rec.ty.n}${b.l&&!b.n?' · '+LBL(b.l):''}</div><p>${rec.ty.d}</p>${extra}<span class="tag ${inf?'i':'a'}">${tag}</span>`;}
let panes=[];
function capOf(c){const bs=basisOf(c);return `<span class="cap-id">${c.id}</span><span class="basis ${bs}">${BASIS[bs][0]}</span>`;}
function bind(stage,res,c){res.blocks.forEach(rec=>{const sel=()=>{document.querySelectorAll('.blk.sel').forEach(n=>n.classList.remove('sel'));rec.g.classList.add('sel');$('fp-block').innerHTML=blockInfo(rec);$('fp-block').hidden=false;};
 rec.g.addEventListener('click',sel);rec.g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();sel();}});});}
function update(){const a=chipBy(state.chip),b=state.vs?chipBy(state.vs):null;syncURL();
 document.querySelectorAll('.pk-cell[data-id]').forEach(n=>n.setAttribute('aria-pressed',n.dataset.id===state.chip));
 const both=b&&dieOf(a).every(d=>d.measured)&&dieOf(b).every(d=>d.measured);
 let K;if(both){const A=bbox(a),B=bbox(b);K=1000/Math.max(A.W,A.H,B.W,B.H);}
 const pb=$('fp-pane-b');pb.hidden=!b;$('fp-stages').classList.toggle('two',!!b);
 const sa=$('fp-svg-a');const ra=render(sa,a,{K,two:!!b});bind(sa,ra,a);$('fp-cap-a').innerHTML=capOf(a);
 if(b){const sb=$('fp-svg-b');const rb=render(sb,b,{K,two:true});bind(sb,rb,b);$('fp-cap-b').innerHTML=capOf(b);$('fp-scale').textContent=both?T('Both dies drawn to the same millimetre scale.','2つのダイは同じミリメートル尺度で描いている。'):T('Not to a common scale: at least one of these dies has no public measurement.','共通の尺度ではない。少なくとも一方のダイに公開された実測値がない。');}
 else $('fp-scale').textContent='';
 $('fp-card').innerHTML=card(a);$('fp-block').hidden=true;
 const fl=$('fp-flow');if(fl&&fl.getAttribute('aria-pressed')==='true')document.querySelectorAll('.fp-stage svg').forEach(s=>s.classList.add('flow'));
 applyHL();}
buildPicker();buildLegend();buildCompare();update();
let rz=0,lw=0;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{const w=$('fp-stages').clientWidth;if(w!==lw){lw=w;update();}},150);});lw=$('fp-stages').clientWidth;
// family table of evidence
const ev=$('fp-evidence');if(ev){ev.innerHTML=CH.map(c=>{const bs=basisOf(c);return `<tr><td>${c.id}</td><td><span class="basis ${bs}">${BASIS[bs][0]}</span></td><td>${c.gpu}</td><td>${fmtCPU(c)}</td><td class="num">${c.bus}-bit</td></tr>`;}).join('');}
})();
