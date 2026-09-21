(()=>{'use strict';
const JA=document.documentElement.lang.startsWith('ja'), T=(e,j)=>JA?j:e;
const CATS={
  p:{n:T("P-cores","Pコア"),v:"--p"}, e:{n:T("E-cores","Eコア"),v:"--e"}, gpu:{n:"GPU",v:"--gpu"}, na:{n:T("Neural Accel.","Neural Accelerator"),v:"--na"},
  ane:{n:"Neural Engine",v:"--ane"}, slc:{n:"SLC",v:"--slc"}, mem:{n:T("Memory","メモリ"),v:"--mem"},
  fab:{n:T("Fabric","ファブリック"),v:"--fab"}, media:{n:T("Media/Display","メディア/表示"),v:"--media"}, io:{n:"I/O",v:"--io"}, sys:{n:T("System","システム"),v:"--sys"}
};
const INFO={
  pcore:{c:"p",t:T("Performance core","高性能コア（Pコア）"),d:T("Apple's widest out-of-order core, which Apple calls the world's fastest CPU core. Four sit in one cluster sharing a large L2.","Appleで最も幅の広いアウト・オブ・オーダーコアであり、Apple自身は世界最速のCPUコアと称している。4基が1つのクラスタを成し、大容量のL2を共有する。"),f:[["t",T("Up to 4.61 GHz","最大4.61 GHz")],["t",T("192 KB L1-I, 128 KB L1-D per core","コアあたりL1命令192 KB、L1データ128 KB")],["a",T("Up to 15% faster multithreaded than M4 (whole CPU)","マルチスレッド性能はM4比で最大15%向上（CPU全体）")],["i",T("A binned 3-P-core variant exists (9-core CPU)","Pコア3基の選別品（9コアCPU）がある")]]},
  pl2:{c:"p",t:T("P-cluster L2 (16 MB)","Pクラスタ L2（16 MB）"),d:T("Shared L2 for the four P-cores. It is large because Apple uses neither a private L2 per core nor a separate CPU L3.","4基のPコアが共有するL2。コアごとの専用L2もCPU用のL3も持たない設計なので、この層が大きい。"),f:[["t",T("16 MB shared by 4 P-cores","Pコア4基で16 MBを共有")],["i",T("Backed by the SLC behind the fabric","その背後にファブリック越しのSLCが控える")]]},
  psme:{c:"p",t:T("P-cluster matrix unit (SME)","Pクラスタの行列演算ユニット（SME）"),d:T("The CPU-side matrix coprocessor, formerly AMX, exposed through Arm SME since M4. The cluster shares one; it is not per core.","CPU側の行列コプロセッサ（旧AMX）であり、M4以降はArm SMEとして公開されている。コアごとではなく、クラスタで1基を共有する。"),f:[["i",T("One shared unit per cluster, as on M4","M4と同じくクラスタごとに1基")],["i",T("Streaming SVE / ZA tile operations","Streaming SVEとZAタイル演算")]]},
  ecore:{c:"e",t:T("Efficiency core","高効率コア（Eコア）"),d:T("Narrow, low-power cores that take background work and most light loads. The six of them carry much of the multithreaded uplift at low power.","バックグラウンド処理や軽い負荷の大半を受け持つ、幅の狭い低消費電力コア。6基あり、低電力でのマルチスレッド性能向上の多くを担う。"),f:[["t",T("Up to 3.05 GHz","最大3.05 GHz")],["t",T("128 KB L1-I, 64 KB L1-D per core","コアあたりL1命令128 KB、L1データ64 KB")],["a",T("6 E-cores in every M5","すべてのM5がEコア6基を持つ")]]},
  el2:{c:"e",t:T("E-cluster L2 (6 MB)","Eクラスタ L2（6 MB）"),d:T("Shared L2 for the six efficiency cores.","6基のEコアが共有するL2。"),f:[["t",T("6 MB shared","6 MBを共有")]]},
  esme:{c:"e",t:T("E-cluster matrix unit","Eクラスタの行列演算ユニット"),d:T("A smaller SME matrix block serving the E-cluster.","Eクラスタに付く小型のSME行列ユニット。"),f:[["i",T("Placement and size inferred from M4","配置と大きさはM4からの推定")]]},
  gcore:{c:"gpu",t:T("GPU core","GPUコア"),d:T("One of ten shader cores. Each now carries its own Neural Accelerator (the pink band), a ray-tracing unit and texture units, fed by on-chip memory that Dynamic Caching allocates as work arrives.","10基あるシェーダコアの1つ。各コアが専用のNeural Accelerator（桃色の帯）、レイトレーシングユニット、テクスチャユニットを持ち、Dynamic Cachingが処理に応じて割り当てるオンチップメモリから供給を受ける。"),f:[["a",T("10 cores (8 on binned parts)","10コア（選別品は8コア）")],["a",T("2nd-generation Dynamic Caching","第2世代Dynamic Caching")],["a",T("Up to 30% faster graphics than M4","グラフィックス性能はM4比で最大30%向上")]]},
  na:{c:"na",t:T("GPU Neural Accelerator","GPU Neural Accelerator"),d:T("A dense matrix-multiply unit inside every GPU core, and the headline change in M5. It takes the matmul-heavy parts of machine learning (LLM prefill, diffusion) that the shader ALUs would run slowly.","各GPUコアに内蔵された密な行列乗算ユニットであり、M5最大の変更点である。シェーダALUでは遅い、行列積中心の機械学習処理（LLMのプリフィル、拡散モデル）を受け持つ。"),f:[["a",T("One per GPU core","GPUコアごとに1基")],["a",T("Over 4× peak GPU AI compute versus M4","GPUのAI演算ピーク性能はM4の4倍超")],["i",T("Reached through the Metal 4 tensor APIs","Metal 4のテンソルAPIから利用する")]]},
  rt:{c:"gpu",t:T("Ray-tracing unit","レイトレーシングユニット"),d:T("Fixed-function BVH traversal and ray/triangle intersection.","BVH探索とレイと三角形の交差判定を行う固定機能回路。"),f:[["a",T("3rd-generation RT engine","第3世代レイトレーシングエンジン")],["a",T("Up to 45% faster in ray-traced apps than M4","レイトレーシング対応アプリでM4比最大45%向上")]]},
  gshared:{c:"gpu",t:T("GPU shared front end and L2","GPU共有部（フロントエンドとL2）"),d:T("Command processing, geometry and tiling, and the GPU's shared L2, common to all ten cores and bridged to the SoC fabric.","コマンド処理、ジオメトリとタイリング、GPU共有L2をまとめた部分で、10コアすべてが共有し、SoCファブリックにつながる。"),f:[["i",T("Placement is schematic","配置は模式的")]]},
  ane:{c:"ane",t:T("Neural Engine (16 cores)","Neural Engine（16コア）"),d:T("Apple's fixed-function NPU for low-power inference (Core ML, on-device Apple Intelligence). On M5 it sits beside the GPU accelerators rather than being replaced by them.","低電力推論（Core ML、端末上のApple Intelligence）のための固定機能NPU。M5ではGPU側のアクセラレータに置き換えられたのではなく、並んで存在する。"),f:[["a",T("16 cores","16コア")],["t",T("About 42 TOPS reported","約42 TOPSと報告されている")]]},
  slc:{c:"slc",t:T("System Level Cache slice","システムレベルキャッシュ（SLC）スライス"),d:T("The last-level cache every agent shares: CPU, GPU, Neural Engine and media. It is sliced so that each slice sits in front of its own memory controller, which cuts DRAM traffic and power.","CPU、GPU、Neural Engine、メディアのすべてが共有する最終段キャッシュ。スライスに分割され、各スライスがそれぞれのメモリコントローラの手前に置かれることで、DRAMへのアクセスと電力を減らす。"),f:[["i",T("Size not disclosed (M4 widely reported at 8 MB)","容量は非公開（M4は8 MBと広く報告されている）")],["i",T("Slice-per-controller layout from M-series lineage","コントローラごとのスライス配置はMシリーズの系譜から")]]},
  mc:{c:"mem",t:T("Memory controller","メモリコントローラ"),d:T("Schedules reads and writes on its LPDDR5X channel and manages refresh and power states.","担当するLPDDR5Xチャネルの読み書きを調停し、リフレッシュと省電力状態を管理する。"),f:[["a","LPDDR5X-9600"],["i",T("One per channel here (schematic)","ここではチャネルごとに1基（模式的）")]]},
  phy:{c:"mem",t:"LPDDR5X PHY",d:T("The analog, mixed-signal interface to the DRAM packages that sit beside the die on the package. It lives on the edge to keep those traces short.","パッケージ上でダイの隣に載るDRAMとのアナログ・ミックスドシグナル接続部。配線を短く保つためダイの縁に置かれる。"),f:[["a",T("128-bit total, 153.6 GB/s","合計128ビット、153.6 GB/s")],["a",T("Up to 32 GB unified memory","ユニファイドメモリ最大32 GB")],["i",T("Drawn as 8 × 16-bit channels, 4 per edge","16ビット×8チャネル、各辺4チャネルとして描画")]]},
  fab:{c:"fab",t:T("SoC fabric","SoCファブリック"),d:T("The on-chip interconnect that carries coherent traffic between the clusters, GPU, Neural Engine, media and the SLC and memory system. It is what makes the memory unified.","CPUクラスタ、GPU、Neural Engine、メディア、SLCとメモリ系の間でコヒーレントな通信を運ぶオンチップ相互接続。メモリを「ユニファイド」にしているのはこの部分である。"),f:[["a",T("Unified memory: CPU, GPU and Neural Engine share one pool","ユニファイドメモリ：CPU、GPU、Neural Engineが1つのプールを共有")],["i",T("Drawn as a spine; physically a mesh or ring","図では背骨状に描いたが、実際はメッシュかリング")]]},
  media:{c:"media",t:T("Media engine","メディアエンジン"),d:T("Hardware video encode and decode, so video never loads the CPU or GPU.","動画のエンコードとデコードを専用回路で行い、CPUやGPUに負荷をかけない。"),f:[["i",T("H.264, HEVC, ProRes and AV1 decode, per M3 and M4","H.264、HEVC、ProRes、AV1デコード（M3・M4に準拠）")]]},
  disp:{c:"media",t:T("Display engine","ディスプレイエンジン"),d:T("Scan-out, compositing and panel timing for the internal display and external displays.","内蔵・外部ディスプレイへの出力、合成、パネルタイミングを担う。"),f:[["a",T("Enhanced display controller (Vision Pro: 10% more pixels, 120 Hz)","強化されたディスプレイコントローラ（Vision Proで画素数10%増、120 Hz）")]]},
  tb:{c:"io",t:T("Thunderbolt / USB4 controller and PHY","Thunderbolt / USB4 コントローラとPHY"),d:T("High-speed I/O at the die edge, tunnelling PCIe, DisplayPort and USB.","ダイの縁にある高速I/Oで、PCIe、DisplayPort、USBをトンネリングする。"),f:[["a",T("Thunderbolt 4 on M5 Macs","M5搭載MacはThunderbolt 4")]]},
  pcie:{c:"io",t:T("PCIe and SSD (NAND) controller","PCIeとSSD（NAND）コントローラ"),d:T("Apple's integrated storage controller drives raw NAND; PCIe lanes serve Wi-Fi, Bluetooth and other peripherals.","Apple内蔵のストレージコントローラがNANDを直接駆動する。PCIeレーンはWi-Fi、Bluetoothなどの周辺機器に使われる。"),f:[["i",T("Integrated storage controller, as on every M-series chip","全Mシリーズと同じく内蔵ストレージコントローラ")]]},
  isp:{c:"sys",t:T("Image signal processor","イメージシグナルプロセッサ"),d:T("The camera pipeline for the FaceTime camera, including Center Stage.","FaceTimeカメラ（センターフレームを含む）の画像処理経路。"),f:[["i",T("Present across the M-series","Mシリーズ共通")]]},
  sep:{c:"sys",t:"Secure Enclave",d:T("An isolated security subsystem with its own core, memory encryption and key storage, behind Touch ID and FileVault keys.","独自のコア、メモリ暗号化、鍵保管を持つ隔離されたセキュリティ系で、Touch IDやFileVaultの鍵を扱う。"),f:[["i",T("Present across the M-series","Mシリーズ共通")]]},
  aop:{c:"sys",t:T("Always-on processor","常時稼働プロセッサ（AOP）"),d:T("A tiny low-power core that stays awake for sensors, “Hey Siri” and wake events while the big clusters sleep.","大きなクラスタが眠っている間も、センサー、「Hey Siri」、復帰イベントのために起きている小さな低電力コア。"),f:[["i",T("Present across the M-series","Mシリーズ共通")]]},
  pmgr:{c:"sys",t:T("Power manager and clocks","電力管理とクロック"),d:T("Dynamic voltage and frequency control, power gating and clock generation for every domain.","全ドメインの電圧・周波数制御、パワーゲーティング、クロック生成を行う。"),f:[["i",T("Placement is schematic","配置は模式的")]]}
};
const B=[];function add(x,y,w,h,key,label,sub){B.push({x,y,w,h,key,label,sub});}
for(let i=0;i<4;i++){const x=300+i*175;
  add(x+2,30,171,46,"phy","LPDDR5X PHY","x16 · ch"+i);add(x+2,82,54,44,"mc","MC","");add(x+60,82,113,44,"slc","SLC","slice "+i);
  add(x+2,724,171,46,"phy","LPDDR5X PHY","x16 · ch"+(i+4));add(x+2,674,54,44,"mc","MC","");add(x+60,674,113,44,"slc","SLC","slice "+(i+4));}
add(30,140,52,150,"tb","TB4","PHY 0");add(30,296,52,150,"tb","TB4","PHY 1");add(30,452,52,150,"tb","TB4","PHY 2");
add(30,30,256,50,"disp","Display engine","int. + ext.");add(30,86,256,48,"disp","Display PHY","");
add(30,608,52,162,"pcie","PCIe","");add(88,674,198,96,"pcie","SSD / NAND ctrl","");
for(let r=0;r<4;r++)for(let c=0;c<4;c++)add(88+c*49.5,140+r*45,46,41,"ane",c==0&&r==0?"ANE":"","");
add(88,322,198,20,"ane","Neural Engine · 16 cores","");
add(88,348,198,78,"media","Media engine","enc / dec · ProRes");
add(88,432,96,64,"isp","ISP","");add(190,432,96,64,"sep","Secure","Enclave");
add(88,502,96,64,"aop","AOP","always-on");add(190,502,96,64,"pmgr","PMGR","DVFS · clk");
add(88,572,198,96,"fab","I/O fabric","");
add(300,138,127,96,"pcore","P0","");add(433,138,127,96,"pcore","P1","");
add(300,240,184,84,"pl2","L2 · 16 MB","shared");add(490,240,70,84,"psme","SME","");
add(300,330,127,96,"pcore","P2","");add(433,330,127,96,"pcore","P3","");
const ew=84.6;for(let r=0;r<2;r++)for(let c=0;c<3;c++)add(300+c*(ew+3.1),436+r*64,ew,60,"ecore","E"+(r*3+c),"");
add(300,564,184,56,"el2","L2 · 6 MB","shared");add(490,564,70,56,"esme","SME","");
add(300,626,260,42,"fab","CPU complex interface","");
add(568,138,34,530,"fab","","");
const gx=610,gw=72,gg=7.5;
function gcore(i,x,y,h){add(x,y,gw,h,"gcore","G"+i,"");add(x+5,y+h*0.52,gw-10,h*0.22,"na","NA","");
  add(x+5,y+h*0.78,(gw-14)/2,h*0.18,"rt","RT","");add(x+9+(gw-14)/2,y+h*0.78,(gw-14)/2,h*0.18,"gcore","TMU","");}
for(let c=0;c<5;c++){gcore(c,gx+c*(gw+gg),138,212);gcore(c+5,gx+c*(gw+gg),456,212);}
add(610,356,390,94,"gshared","GPU front end · L2 · tiling","shared by 10 cores");

const NS="http://www.w3.org/2000/svg",g=document.getElementById("blocks"),svg=document.getElementById("die");
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
B.forEach(b=>{const inf=INFO[b.key],cat=inf.c,col=`var(${CATS[cat].v})`;
  const grp=el("g",{class:"blk","data-key":b.key,"data-cat":cat,tabindex:0,role:"button","aria-label":inf.t});
  grp.appendChild(el("rect",{class:"b",x:b.x,y:b.y,width:b.w,height:b.h,rx:2,fill:col,"fill-opacity":.22,stroke:col}));
  const small=b.w<60||b.h<30;
  if(b.label){const vertical=b.h>b.w*1.8&&b.w<60,cx=b.x+b.w/2,cy=b.y+b.h/2;
    const t=el("text",{x:cx,y:cy+(b.sub&&!small?-3:4),"text-anchor":"middle","font-size":small?10:(b.w>150?13:12),"font-weight":500});
    if(vertical)t.setAttribute("transform",`rotate(-90 ${cx} ${cy})`);t.textContent=b.label;grp.appendChild(t);
    if(b.sub&&!small){const s=el("text",{x:cx,y:cy+12,"text-anchor":"middle","font-size":10,opacity:.65});
      if(vertical)s.setAttribute("transform",`rotate(-90 ${cx} ${cy})`);s.textContent=b.sub;grp.appendChild(s);}}
  grp.addEventListener("click",e=>{e.stopPropagation();select(grp,b.key);});
  grp.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(grp,b.key);}});
  g.appendChild(grp);});
const ft=el("text",{x:585,y:403,"text-anchor":"middle","font-size":11,transform:"rotate(-90 585 403)",fill:"currentColor","pointer-events":"none"});ft.textContent="SoC fabric / NoC";g.appendChild(ft);
[["CPU · P-cluster",300,132],["CPU · E-cluster",300,432],["GPU · 10 cores",610,132]].forEach(([s,x,y])=>{const t=el("text",{x,y,"font-size":10.5,fill:"currentColor",opacity:.6,"letter-spacing":"1"});t.textContent=s.toUpperCase();g.appendChild(t);});
const P=document.getElementById("paths");
function path(pts,label,lx,ly,color){P.appendChild(el("polyline",{points:pts,fill:"none",stroke:color,"stroke-width":2.4,"marker-end":"url(#arr)","stroke-linejoin":"round",style:`color:${color}`}));
  if(!label)return;P.appendChild(el("rect",{x:lx-4,y:ly-11,width:[...label].reduce((w,ch)=>w+(ch.charCodeAt(0)>0x2FFF?10.5:6.6),0)+8,height:15,rx:2,fill:"var(--panel)",opacity:.92}));
  const t=el("text",{x:lx,y:ly,"font-size":10.5,fill:color,"font-weight":500});t.textContent=label;P.appendChild(t);}
path("520,282 585,282 585,104 610,104",T("CPU miss → fabric → SLC","CPUミス → ファブリック → SLC"),430,203,"var(--p)");
path("625,82 625,40",T("SLC miss → PHY → DRAM","SLCミス → PHY → DRAM"),636,56,"var(--slc)");
path("700,450 700,540 604,540 585,540 585,674",T("GPU/NA → SLC","GPU/NA → SLC"),612,532,"var(--na)");
path("286,230 293,230 293,647 566,647",T("ANE / media → fabric","ANE・メディア → ファブリック"),330,642,"var(--ane)");
path("286,388 291,388","",0,0,"var(--media)");
const leg=document.getElementById("legend");let active=null;
Object.entries(CATS).forEach(([k,v])=>{const b=document.createElement("button");b.className="chip";b.type="button";b.id="chip-"+k;b.setAttribute("aria-pressed","false");
  b.innerHTML=`<i style="background:var(${v.v})"></i>${v.n}`;b.onclick=()=>{active=active===k?null:k;highlight();};leg.appendChild(b);});
const tg=document.createElement("button");tg.className="chip toggle";tg.type="button";tg.id="flow";tg.setAttribute("aria-pressed","false");tg.textContent=T("Show data paths","データ経路を表示");
tg.onclick=()=>{const on=svg.classList.toggle("flow");tg.setAttribute("aria-pressed",on);};leg.appendChild(tg);
function highlight(){svg.classList.toggle("dim",!!active);document.querySelectorAll(".blk").forEach(n=>n.classList.toggle("hl",n.dataset.cat===active));
  leg.querySelectorAll(".chip:not(.toggle)").forEach(c=>c.setAttribute("aria-pressed",c.id==="chip-"+active));}
const TAG={a:["a","Apple"],t:["t",T("3rd-party","第三者")],i:["i",T("Inferred","推定")]};
function render(key){const d=INFO[key],c=CATS[d.c];
  document.getElementById("info").innerHTML=`<div class="cat"><i style="background:var(${c.v})"></i>${c.n}</div><h3>${d.t}</h3><p>${d.d}</p><ul class="facts">${d.f.map(([b,x])=>`<li><span class="tag ${TAG[b][0]}">${TAG[b][1]}</span><span>${x}</span></li>`).join("")}</ul><div class="keytags"><span><span class="tag a">Apple</span> ${T("stated by Apple","Appleの公表値")}</span><span><span class="tag t">${TAG.t[1]}</span> ${T("measured or reported","第三者の計測・報告")}</span><span><span class="tag i">${TAG.i[1]}</span> ${T("from M-series lineage","Mシリーズの系譜から推定")}</span></div>`;}
function select(node,key){document.querySelectorAll(".blk.sel").forEach(n=>n.classList.remove("sel"));node.classList.add("sel");render(key);}
select(document.querySelector('.blk[data-key="na"]'),"na");
})();
