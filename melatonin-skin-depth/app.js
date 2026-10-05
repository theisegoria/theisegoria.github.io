/* Melatonin skin-depth model. Bilingual: strings switch on <html lang>. */
(function(){
"use strict";
var JA = (document.documentElement.lang || "en").slice(0,2) === "ja";
var T = JA ? {
  mgday:"mg/日", perday:"mg/日", h:"時間", um:"µm",
  epi:"表皮", pap:"乳頭層", ret:"網状層", hyp:"皮下 / 毛球", foll:"毛包",
  depthAx:"角質層からの深さ", oral:"経口", mean24:"24時間平均",
  physio:"生理的夜間ピーク", target:"目標値", above:"時間/日 目標超過",
  tissue:"組織中メラトニン (ng/mL)", plasma:"血漿中メラトニン (pg/mL)",
  deep:"深さ", dose:"経口用量 (mg/日)", eqdose:"等価経口用量 (mg/日)、対数軸",
  yourdose:"現在の用量", ceiling:"ヒト上限", after:"投与後",
  ir:"即放", srp:"徐放", sel:"（選択中）", cmp:"（比較）",
  direct:"直接的ラジカル捕捉（化学量論）", indirect:"間接的（酵素誘導）",
  ofbase:"ベースラインTACに対する%", risein:"TAC上昇率 (%)",
  floor:"1 %：測定限界", icu:"6 mg・ICU（+75 %）",
  q:function(p,n,d){return "深さ"+d+" µm の"+n+"で外用 "+p+" と等しくなる経口用量";},
  names:["表皮","乳頭層","網状層","毛乳頭"],
  ok:"現在の用量で到達可能", mid:"到達可能だが現用量より高い", no:"ヒトの用量では到達不能",
  sent:function(dz,have,ratio,p,tgt,verdict){
    return dz+" mg/日 では組織中24時間平均は <b>"+have+" ng/mL</b>、これは外用 "+p+
      " がこの深さで到達する濃度（<b>"+tgt+" ng/mL</b>）の <b>"+ratio+" %</b> にあたる。"+verdict;},
  vOk:"この深さでは経口が有利であり、より効率的な投与経路である。",
  vMid:function(n){return "差を埋めるには "+n+" mg/日 が必要で、高用量だが前例がないわけではない。";},
  vNo:"差を埋めることは不可能であり、この深さは外用の領分である。",
  stats:["減衰長 λ","皮膚への流束","吸収率","血漿24時間平均","MT₁ 占有率","MT₂ 占有率"],
  rows:["塗布膜 / 毛包漏斗","角質層リザーバー","生表皮","乳頭層","網状層中部","毛乳頭 / 毛球"],
  subs:["ビヒクル","ビヒクルの約1/30","40 µm","300 µm","1 mm","3 mm"],
  tblDepth:["生表皮表面","100 µm","300 µm","1 mm","2 mm","3 mm","4 mm"],
  legTot:"合計 / TEAC 1（C_max）", legCas:"TEAC 4 カスケード・質量作用項",
  legRec:"MT₁/MT₂ 受容体項", legDash:"破線 = 24時間平均または各成分",
  calLabel:"Circadin 添付文書のAUC、Andersen 比 ×3.90。",
  calCons:"Andersen 2016 の絶対バイオアベイラビリティ 2.5 %。",
  secTop:"外用", secOral:"経口", secMean:"24時間平均",
  cross:"交差", crossAt:function(d){return "交差 "+d+" µm";},
  topWins:"外用が高い", oralWins:"経口が高い",
  noCrossTop:"全深度で外用が上回る", noCrossOral:"全深度で経口が上回る",
  tgt:"目標", layer:"層", ratio:"外用 / 経口",
  L:{sc:"角質層",ve:"生表皮",pd:"乳頭層",cap:"毛細血管ループ",rd:"網状層",seb:"皮脂腺",
     fol:"毛包",sub:"皮下脂肪",bulb:"毛球・毛乳頭",film:"塗布膜",plex:"血管叢",swt:"汗腺"},
  cbar:"組織中メラトニン (ng/mL)", veh:"塗布膜（ビヒクル）",
  secAria:"頭皮の断面図。選択した外用濃度と経口用量による定常状態のメラトニン濃度を重ねて表示。"
} : {
  mgday:"mg/day", perday:"mg/day", h:"h", um:"µm",
  epi:"viable epidermis", pap:"papillary dermis", ret:"reticular dermis",
  hyp:"hypodermis / bulb", foll:"follicle",
  depthAx:"depth below stratum corneum", oral:"oral", mean24:"24-h mean",
  physio:"physiological nocturnal peak", target:"target", above:"h/day above target",
  tissue:"tissue melatonin (ng/mL)", plasma:"plasma melatonin (pg/mL)",
  deep:"deep", dose:"oral dose (mg/day)", eqdose:"equivalent oral dose (mg/day), log scale",
  yourdose:"your dose", ceiling:"human ceiling", after:"after dose",
  ir:"immediate release", srp:"sustained release", sel:"(selected)", cmp:"(comparison)",
  direct:"Direct scavenging (stoichiometric)", indirect:"Indirect (enzyme induction)",
  ofbase:"% of baseline TAC", risein:"% rise in TAC",
  floor:"1 %: assay detection floor", icu:"6 mg, ICU (+75 %)",
  q:function(p,n,d){return "Oral dose needed to match topical "+p+" at "+n+" ("+d+" µm)";},
  names:["the viable epidermis","the papillary dermis","the reticular dermis","the dermal papilla"],
  ok:"Reachable at your dose", mid:"Reachable, above your dose", no:"Beyond any human dose",
  sent:function(dz,have,ratio,p,tgt,verdict){
    return "At "+dz+" mg/day your 24-hour mean tissue level is <b>"+have+
      " ng/mL</b>, which is <b>"+ratio+" %</b> of what topical "+p+
      " delivers at this depth (<b>"+tgt+" ng/mL</b>). "+verdict;},
  vOk:"You are over the line here, so oral is the more efficient route to this target.",
  vMid:function(n){return "Closing the gap means "+n+" mg/day, which is high but not unprecedented.";},
  vNo:"Closing the gap is not possible; this depth belongs to topical delivery.",
  stats:["Decay length λ","Flux into skin","Absorbed fraction","Plasma 24-h mean",
         "MT₁ occupancy","MT₂ occupancy"],
  rows:["Applied film / follicular duct","Stratum corneum reservoir","Viable epidermis",
        "Papillary dermis","Mid reticular dermis","Dermal papilla / bulb"],
  subs:["vehicle","~1/30 of vehicle","40 µm","300 µm","1 mm","3 mm"],
  tblDepth:["Surface of viable epidermis","100 µm","300 µm","1 mm","2 mm","3 mm","4 mm"],
  legTot:"total / TEAC 1 at Cₘₐₓ", legCas:"TEAC 4 cascade · mass-action arm",
  legRec:"MT₁/MT₂ receptor arm", legDash:"dashed = 24-h mean or component",
  calLabel:"Circadin SmPC AUC, ×3.90 the Andersen bioavailability.",
  calCons:"Andersen 2016 absolute bioavailability, 2.5 %.",
  secTop:"Topical", secOral:"Oral", secMean:"24-h mean",
  cross:"crossing", crossAt:function(d){return "crossing "+d+" µm";},
  topWins:"topical higher", oralWins:"oral higher",
  noCrossTop:"topical higher at every depth", noCrossOral:"oral higher at every depth",
  tgt:"target", layer:"layer", ratio:"topical / oral",
  L:{sc:"Stratum corneum",ve:"Viable epidermis",pd:"Papillary dermis",cap:"Capillary loop",
     rd:"Reticular dermis",seb:"Sebaceous gland",fol:"Hair follicle",sub:"Subcutis (fat)",
     bulb:"Bulb and dermal papilla",film:"Applied film",plex:"Vascular plexus",swt:"Sweat gland"},
  cbar:"tissue melatonin (ng/mL)", veh:"applied film (vehicle)",
  secAria:"Scalp cross-section with the modelled steady-state melatonin field for the selected topical strength and oral dose."
};

var MW=232.28, Vd=84, ke=0.7744661235, ka=6.9314718056, CL=ke*Vd, F=0.025;
var TOP_A=115.1813306374, TOP_B=0.5913062033, F_REF=0.0460859816;
var H_VE=80e-4, D0=0.018, AREA=600, APPLIED=1000, CIRC=3.9033, TACBASE=1.5e-3;
var S={dose:8,form:"SR",rel:8,cal:"label",pct:0.10,depth:3000,kp:1,q:3,dmul:1};

function D(){return D0*S.dmul}
function lam(){return Math.sqrt(D()*S.kp/S.q)}
function scale(){return S.cal==="label"?CIRC:1}
function cavg24(d){return F*d*1000/(ke*Vd*24)*scale()}
function cIR(t,d){return (F*d*1000*scale()*ka)/(Vd*(ka-ke))*(Math.exp(-ke*t)-Math.exp(-ka*t));}
function cSR(t,d,Tr){var k0=F*d*1000*scale()/Tr,up=(k0/(ke*Vd))*(1-Math.exp(-ke*Math.min(t,Tr)));
  return t<=Tr?up:up*Math.exp(-ke*(t-Tr));}
function cOral(t){return S.form==="IR"?cIR(t,S.dose):cSR(t,S.dose,S.rel)}
function fAbs(p){return F_REF*Math.pow(p/0.1,TOP_B-1)}
function flux(p){return fAbs(p)*(p/100*APPLIED/1000*1e6)/(AREA*24)}
function cTop(x,p){var L=lam(),J=flux(p),Cp=J*L/D()*1e3;
  return x<=H_VE?Cp+J*(H_VE-x)/D()*1e3:Cp*Math.exp(-(x-H_VE)/L);}
function cTopUm(um,p){return cTop(um*1e-4,p)}
/* Vehicle concentration: p % w/v = p/100 g/mL = p*1e7 ng/mL (0.1 % is 1 mg/mL, 4.3 mM). */
function cVeh(p){return p/100*1e9}
function reqFromC(c){return c/S.kp*ke*Vd*24/(F*1000)/scale()}
function reqAt(um,p){return reqFromC(cTopUm(um,p))}
function oralTissue(){return S.kp*cavg24(S.dose)}
function nM(x){return x/MW*1000}
function occ(c,ki){return c/(c+ki)*100}
function tacDirect(d,teac,peak){var c=peak?(F*d*1000*scale()/Vd):cavg24(d);
  return teac*(c*1e-9/(MW*1e-3))/TACBASE*100;}
function tacIndirect(d){return (0.28*d/(0.15+d)+0.55*d/(900+d))*100}

var PCTS=[{v:0.0033,l:"0.0033 %"},{v:0.01,l:"0.01 %"},{v:0.03,l:"0.03 %"},
          {v:0.10,l:"0.10 %"},{v:2.5,l:"2.5 %"},{v:12.5,l:"12.5 %"}];
var CURVES=[0.0033,0.01,0.10,2.5], SER=["--mel-s1","--mel-s2","--mel-s3","--mel-s4"];
var TBLD=[0,100,300,1000,2000,3000,4000];
function slToDose(v){return Math.round(Math.pow(10,(v/100)*Math.log10(200))*10)/10}
function doseToSl(d){return Math.round(100*Math.log10(d)/Math.log10(200))}

/* Custom properties hold light-dark() pairs; resolve them to the active scheme
   through a probe element so SVG attributes and canvas get plain colours. */
var PROBE=null, CCACHE={};
function cssv(n){
  if(CCACHE[n])return CCACHE[n];
  if(!PROBE){PROBE=document.createElement("span");PROBE.setAttribute("aria-hidden","true");
    PROBE.style.cssText="position:absolute;width:0;height:0;overflow:hidden;visibility:hidden";
    (document.querySelector(".mel")||document.body).appendChild(PROBE);}
  PROBE.style.color="var("+n+")";
  var v=getComputedStyle(PROBE).color; CCACHE[n]=v; return v;}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function fmt(x){if(!isFinite(x))return"–";
  if(x>=1000)return x.toLocaleString(undefined,{maximumFractionDigits:0});
  if(x>=100)return x.toFixed(0); if(x>=10)return x.toFixed(1);
  if(x>=1)return x.toFixed(2); if(x>=0.01)return x.toFixed(3); return x.toExponential(1);}
function dz(x){return x>=10?x.toFixed(0):x.toFixed(1)}
function logTicks(lo,hi){var t=[],e=Math.floor(Math.log10(lo));
  for(;e<=Math.ceil(Math.log10(hi));e++){var v=Math.pow(10,e);
    if(v>=lo*0.999&&v<=hi*1.001)t.push(v);} return t;}
var SUP={"−":"⁻","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴",
         "5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
function supf(v){var e=Math.round(Math.log10(v));
  if(e>=0&&e<=3)return v>=1000?"1,000":String(v);
  return "10"+String(e).replace(/-/g,"−").split("").map(function(c){return SUP[c]||c}).join("");}

function Chart(host,h,pad){
  this.w=Math.max(280,Math.round(host.getBoundingClientRect().width)||720);
  this.h=h; this.p=pad; this.o=[];
  this.ink=cssv("--ig-ink"); this.mut=cssv("--ig-muted"); this.fnt=cssv("--mel-faint");
  this.grid=cssv("--mel-grid"); this.ax=cssv("--mel-axis"); this.surf=cssv("--ig-paper");
  this.acc=cssv("--ig-accent");
}
Chart.prototype.push=function(s){this.o.push(s)};
Chart.prototype.X=function(v){var p=this.p;
  return p.l+(v-this.xd[0])/(this.xd[1]-this.xd[0])*(this.w-p.l-p.r);};
Chart.prototype.LX=function(v){var p=this.p,a=Math.log10(this.xd[0]),b=Math.log10(this.xd[1]);
  return p.l+(Math.log10(v)-a)/(b-a)*(this.w-p.l-p.r);};
Chart.prototype.LY=function(v){var p=this.p,a=Math.log10(this.yd[0]),b=Math.log10(this.yd[1]);
  v=Math.max(v,this.yd[0]*1.0001);
  return this.h-p.b-(Math.log10(v)-a)/(b-a)*(this.h-p.t-p.b);};
Chart.prototype.txt=function(x,y,s,o){o=o||{};
  this.push('<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" fill="'+(o.fill||this.mut)+
    '" font-size="'+(o.fs||10.5)+'" font-family="'+(o.mono?'IBM Plex Mono,monospace':'Inter,sans-serif')+
    '" font-weight="'+(o.fw||400)+'" text-anchor="'+(o.ta||"start")+
    '" dominant-baseline="'+(o.db||"auto")+'">'+esc(s)+'</text>');};
Chart.prototype.done=function(host,tip){
  host.innerHTML='<svg viewBox="0 0 '+this.w+' '+this.h+
    '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="chart">'+this.o.join("")+'</svg>';
  if(tip)host.appendChild(tip);};

function drawDepth(){
  var host=document.getElementById("melDepth"), tip=document.getElementById("melTipDepth");
  var cw=host.getBoundingClientRect().width||720;
  var c=new Chart(host,Math.max(320,Math.min(450,cw*0.6)),{l:56,r:cw<520?44:58,t:34,b:40});
  c.xd=[0,4000]; var lo=1e-4,hi=Math.max(1e3,cTopUm(0,2.5)*3); c.yd=[lo,hi];
  var x0=c.X(0),x1=c.X(4000),yT=c.p.t,yB=c.h-c.p.b;
  [[0,80,T.epi],[80,400,T.pap],[400,2000,T.ret],[2000,4000,T.hyp]].forEach(function(s,i){
    var a=c.X(s[0]),b=c.X(s[1]);
    c.push('<rect x="'+a.toFixed(1)+'" y="'+yT+'" width="'+(b-a).toFixed(1)+'" height="'+(yB-yT)+
      '" fill="'+c.ink+'" opacity="'+(i%2?0.028:0.055)+'"/>');
    if(b-a>52)c.txt((a+b)/2,yB-7,s[2],{ta:"middle",fs:9.5,fill:c.fnt});});
  var fx=c.X(3350),fw=c.X(150)-c.X(0);
  c.push('<path d="M'+(fx-fw*0.9)+','+yT+' L'+(fx-fw*0.32)+','+(yB-42)+' Q'+fx+','+(yB-6)+' '+
    (fx+fw*0.32)+','+(yB-42)+' L'+(fx+fw*0.9)+','+yT+' Z" fill="'+c.ink+'" opacity="0.05"/>');
  c.txt(fx,yT+34,T.foll,{ta:"middle",fs:9,fill:c.fnt});
  logTicks(lo,hi).forEach(function(v){var y=c.LY(v);
    c.push('<line x1="'+x0+'" y1="'+y.toFixed(1)+'" x2="'+x1+'" y2="'+y.toFixed(1)+
      '" stroke="'+c.grid+'" stroke-width="1"/>');
    c.txt(c.p.l-8,y,supf(v),{ta:"end",db:"middle",fs:10,mono:true});});
  [0,1000,2000,3000,4000].forEach(function(v){
    c.txt(c.X(v),yB+16,v===0?"0":(v/1000)+" mm",{ta:"middle",fs:10,mono:true});});
  c.push('<line x1="'+x0+'" y1="'+yB+'" x2="'+x1+'" y2="'+yB+'" stroke="'+c.ax+'" stroke-width="1"/>');
  c.txt(c.p.l-8,c.p.t-14,"ng/mL",{ta:"end",fs:9.5,fill:c.fnt});
  c.txt((x0+x1)/2,c.h-4,T.depthAx,{ta:"middle",fs:10});
  var oc=oralTissue();
  var ends=[];
  CURVES.forEach(function(p,i){var col=cssv(SER[i]),d="";
    for(var um=0;um<=4000;um+=8)d+=(um?"L":"M")+c.X(um).toFixed(1)+","+c.LY(cTopUm(um,p)).toFixed(1);
    c.push('<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/>');
    var ye=c.LY(cTopUm(4000,p));
    if(ye<yB-4)ends.push([ye,PCTS.filter(function(z){return z.v===p})[0].l,col]);});
  ends.sort(function(a,b){return a[0]-b[0]});
  for(var ei=1;ei<ends.length;ei++)if(ends[ei][0]-ends[ei-1][0]<12)ends[ei][0]=ends[ei-1][0]+12;
  ends.forEach(function(e){c.txt(x1+5,e[0],e[1].replace(" %","%"),{db:"middle",fs:10,mono:true,fill:e[2],fw:600});});
  if(oc>lo){var oy=c.LY(oc), lbl=T.oral+" "+dz(S.dose)+" mg · "+fmt(oc)+" ng/mL";
    c.push('<line x1="'+x0+'" y1="'+oy.toFixed(1)+'" x2="'+x1+'" y2="'+oy.toFixed(1)+
      '" stroke="'+c.mut+'" stroke-width="2" stroke-dasharray="6 4"/>');
    c.push('<rect x="'+(x0+4)+'" y="'+(oy-17)+'" width="'+(lbl.length*6.1+8)+
      '" height="15" fill="'+c.surf+'" opacity="0.92"/>');
    c.txt(x0+8,oy-6,lbl,{fs:10.5,mono:true,fill:c.ink,fw:500});}
  /* the selected strength, drawn on top, and where it crosses the oral plateau */
  var selCol=c.acc, cr=crossing(S.pct,oc);
  if(CURVES.indexOf(S.pct)>=0)selCol=cssv(SER[CURVES.indexOf(S.pct)]);
  var dsel=""; for(var um2=0;um2<=4000;um2+=8)dsel+=(um2?"L":"M")+c.X(um2).toFixed(1)+","+c.LY(cTopUm(um2,S.pct)).toFixed(1);
  c.push('<path d="'+dsel+'" fill="none" stroke="'+c.surf+'" stroke-width="6" stroke-linejoin="round" opacity="0.85"/>');
  c.push('<path d="'+dsel+'" fill="none" stroke="'+selCol+'" stroke-width="3.4" stroke-linejoin="round"/>');
  if(cr.um!==null&&oc>lo){var xc=c.X(cr.um),yc=c.LY(oc);
    c.o.splice(1,0,'<rect x="'+x0+'" y="'+yT+'" width="'+(xc-x0).toFixed(1)+'" height="'+(yB-yT)+'" fill="'+selCol+'" opacity="0.06"/>');
    c.push('<line x1="'+xc.toFixed(1)+'" y1="'+(yT+20)+'" x2="'+xc.toFixed(1)+'" y2="'+yB+'" stroke="'+c.ink+'" stroke-width="1" stroke-dasharray="2 3"/>');
    c.push('<circle cx="'+xc.toFixed(1)+'" cy="'+yc.toFixed(1)+'" r="6.5" fill="#ffc94d" stroke="'+c.ink+'" stroke-width="1.5"/>');
    var ctx=T.crossAt(Math.round(cr.um).toLocaleString()), cw2=ctx.length*6.4+14, cl=xc-cw2-10, ct=yc-30;
    if(cl<x0+4)cl=xc+10;
    if(ct<yT+40)ct=yc+12;
    c.push('<rect x="'+cl.toFixed(1)+'" y="'+ct.toFixed(1)+'" width="'+cw2.toFixed(1)+'" height="18" rx="9" fill="#ffc94d"/>');
    c.txt(cl+7,ct+9.5,ctx,{db:"middle",fs:10.5,mono:true,fill:"#2a1d00",fw:600});
    if(xc-x0>90)c.txt(x0+8,yT+34,"\u2190 "+T.topWins,{fs:10,fill:c.ink,fw:500});
    if(x1-xc>90)c.txt(x1-8,yT+34,T.oralWins+" \u2192",{ta:"end",fs:10,fill:c.ink,fw:500});}
  var cx=c.X(S.depth), tv=cTopUm(S.depth,S.pct), ty=c.LY(tv);
  c.push('<line x1="'+cx.toFixed(1)+'" y1="'+yT+'" x2="'+cx.toFixed(1)+'" y2="'+yB+
    '" stroke="'+c.ink+'" stroke-width="1.5"/>');
  c.push('<circle cx="'+cx.toFixed(1)+'" cy="'+ty.toFixed(1)+'" r="5" fill="'+c.ink+
    '" stroke="'+c.surf+'" stroke-width="2"/>');
  c.push('<rect x="'+(cx-27)+'" y="'+(yT+2)+'" width="54" height="16" rx="3" fill="'+c.ink+'"/>');
  c.txt(cx,yT+13,S.depth+" µm",{ta:"middle",fs:9.5,mono:true,fill:c.surf,fw:500});
  c.done(host,tip);
  var svg=host.querySelector("svg"),down=false;
  function move(ev){var r=svg.getBoundingClientRect();
    var px=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left, sx=px/r.width*c.w;
    var um=Math.max(0,Math.min(4000,Math.round((sx-c.p.l)/(c.w-c.p.l-c.p.r)*4000/25)*25));
    S.depth=um; document.getElementById("melDepthR").value=um; all();}
  svg.addEventListener("pointerdown",function(e){down=true;svg.setPointerCapture(e.pointerId);move(e);});
  svg.addEventListener("pointermove",function(e){
    if(down){move(e);return;}
    var r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*c.w;
    var um=(sx-c.p.l)/(c.w-c.p.l-c.p.r)*4000;
    if(um<0||um>4000){tip.classList.remove("on");return;}
    tip.innerHTML='<div class="th">'+Math.round(um)+' µm '+T.deep+'</div>'+
      CURVES.map(function(p,i){return '<div class="tr"><span class="nm"><span class="mel-key" style="background:'+
        cssv(SER[i])+'"></span>'+PCTS.filter(function(z){return z.v===p})[0].l+
        '</span><span class="vl">'+fmt(cTopUm(um,p))+'</span></div>';}).join("")+
      '<div class="tr"><span class="nm"><span class="mel-key dash"></span>'+T.oral+
      '</span><span class="vl">'+fmt(oc)+'</span></div>';
    tip.classList.add("on");
    var lft=(e.clientX-r.left)+14; if(lft>r.width-150)lft=(e.clientX-r.left)-150;
    tip.style.left=lft+"px"; tip.style.top="14px";});
  svg.addEventListener("pointerup",function(){down=false});
  svg.addEventListener("pointerleave",function(){down=false;tip.classList.remove("on")});
  document.getElementById("melLegDepth").innerHTML=
    CURVES.map(function(p,i){return '<li><span class="mel-key" style="background:'+cssv(SER[i])+
      '"></span>'+PCTS.filter(function(z){return z.v===p})[0].l+'</li>';}).join("")+
    '<li><span class="mel-key dash"></span>'+T.oral+' '+dz(S.dose)+' '+T.mgday+', '+T.mean24+'</li>';
}

function drawPk(){
  var host=document.getElementById("melPk"), tip=document.getElementById("melTipPk");
  var cw=host.getBoundingClientRect().width||720;
  var c=new Chart(host,Math.max(250,Math.min(340,cw*0.44)),{l:56,r:16,t:16,b:40});
  c.xd=[0,24]; c.yd=[1,3e4];
  var x0=c.X(0),x1=c.X(24),yB=c.h-c.p.b;
  var pmin=c.LY(60),pmax=c.LY(200);
  c.push('<rect x="'+x0+'" y="'+pmax.toFixed(1)+'" width="'+(x1-x0)+'" height="'+(pmin-pmax).toFixed(1)+
    '" fill="'+cssv("--mel-s4")+'" opacity="0.14"/>');
  c.txt(x0+6,pmax-4,T.physio,{fs:9.5,fill:c.fnt});
  logTicks(1,3e4).forEach(function(v){var y=c.LY(v);
    c.push('<line x1="'+x0+'" y1="'+y.toFixed(1)+'" x2="'+x1+'" y2="'+y.toFixed(1)+
      '" stroke="'+c.grid+'" stroke-width="1"/>');
    c.txt(c.p.l-8,y,supf(v),{ta:"end",db:"middle",fs:10,mono:true});});
  [0,6,12,18,24].forEach(function(v){c.txt(c.X(v),yB+16,v+" "+T.h,{ta:"middle",fs:10,mono:true});});
  c.push('<line x1="'+x0+'" y1="'+yB+'" x2="'+x1+'" y2="'+yB+'" stroke="'+c.ax+'" stroke-width="1"/>');
  c.txt(c.p.l-8,c.p.t-6,"pg/mL",{ta:"end",fs:9.5,fill:c.fnt});
  var need=cTopUm(S.depth,S.pct)/S.kp*1000;
  if(need>1&&need<3e4){var ny=c.LY(need);
    c.push('<line x1="'+x0+'" y1="'+ny.toFixed(1)+'" x2="'+x1+'" y2="'+ny.toFixed(1)+
      '" stroke="'+cssv("--mel-crit")+'" stroke-width="1.5" stroke-dasharray="3 3"/>');
    c.txt(x1-4,ny-6,T.target+" "+fmt(need)+" pg/mL",
      {ta:"end",fs:10,mono:true,fill:cssv("--mel-crit"),fw:500});}
  function path(fn){var d="";for(var t=0;t<=24;t+=0.02)
    d+=(t?"L":"M")+c.X(t).toFixed(1)+","+c.LY(Math.max(fn(t)*1000,1)).toFixed(1);return d;}
  var alt=S.form==="IR"?function(t){return cSR(t,S.dose,S.rel)}:function(t){return cIR(t,S.dose)};
  c.push('<path d="'+path(alt)+'" fill="none" stroke="'+c.mut+
    '" stroke-width="2" stroke-dasharray="5 4" opacity="0.75"/>');
  c.push('<path d="'+path(cOral)+'" fill="none" stroke="'+cssv("--mel-s1")+'" stroke-width="2"/>');
  var hrs=0; for(var t=0;t<=24;t+=0.005){if(cOral(t)*1000>need)hrs+=0.005;}
  c.txt(x0+6,yB-8,hrs.toFixed(1)+" "+T.above,{fs:11,mono:true,fill:c.ink,fw:500});
  c.done(host,tip);
  var svg=host.querySelector("svg");
  svg.addEventListener("pointermove",function(e){
    var r=svg.getBoundingClientRect(),sx=(e.clientX-r.left)/r.width*c.w;
    var t=(sx-c.p.l)/(c.w-c.p.l-c.p.r)*24;
    if(t<0||t>24){tip.classList.remove("on");return;}
    tip.innerHTML='<div class="th">'+t.toFixed(1)+' '+T.h+' '+T.after+'</div>'+
      '<div class="tr"><span class="nm"><span class="mel-key" style="background:'+cssv("--mel-s1")+
      '"></span>'+(S.form==="IR"?T.ir:T.srp+" "+S.rel+T.h)+'</span><span class="vl">'+
      fmt(cOral(t)*1000)+'</span></div>'+
      '<div class="tr"><span class="nm"><span class="mel-key dash"></span>'+
      (S.form==="IR"?T.srp+" "+S.rel+T.h:T.ir)+'</span><span class="vl">'+fmt(alt(t)*1000)+'</span></div>';
    tip.classList.add("on");
    var lft=(e.clientX-r.left)+14; if(lft>r.width-140)lft=(e.clientX-r.left)-140;
    tip.style.left=lft+"px"; tip.style.top="14px";});
  svg.addEventListener("pointerleave",function(){tip.classList.remove("on")});
  document.getElementById("melLegPk").innerHTML=
    '<li><span class="mel-key" style="background:'+cssv("--mel-s1")+'"></span>'+
    (S.form==="IR"?T.ir:T.srp+", "+S.rel+" "+T.h)+' '+T.sel+'</li>'+
    '<li><span class="mel-key dash"></span>'+(S.form==="IR"?T.srp+", "+S.rel+" "+T.h:T.ir)+
    ' '+T.cmp+'</li>';
}

function drawLadder(){
  var host=document.getElementById("melLadder");
  var vals=[reqFromC(cVeh(S.pct)),reqFromC(cVeh(S.pct)/30),reqAt(40,S.pct),
            reqAt(300,S.pct),reqAt(1000,S.pct),reqAt(3000,S.pct)];
  var lw=(host.getBoundingClientRect().width||720)<560?128:210;
  var c=new Chart(host,vals.length*40+52,{l:lw,r:74,t:14,b:38});
  c.xd=[0.5,Math.max(1e5,vals[0]*1.4)];
  var x0=c.LX(c.xd[0]),x1=c.LX(c.xd[1]);
  logTicks(1,c.xd[1]).forEach(function(v){var x=c.LX(v);
    c.push('<line x1="'+x.toFixed(1)+'" y1="'+c.p.t+'" x2="'+x.toFixed(1)+'" y2="'+(c.h-c.p.b)+
      '" stroke="'+c.grid+'" stroke-width="1"/>');
    c.txt(x,c.h-c.p.b+15,supf(v),{ta:"middle",fs:9.5,mono:true});});
  c.txt((x0+x1)/2,c.h-4,T.eqdose,{ta:"middle",fs:10});
  [[S.dose,c.acc,T.yourdose],[200,cssv("--mel-crit"),T.ceiling]].forEach(function(m){
    if(m[0]<c.xd[0]||m[0]>c.xd[1])return; var x=c.LX(m[0]);
    c.push('<line x1="'+x.toFixed(1)+'" y1="'+c.p.t+'" x2="'+x.toFixed(1)+'" y2="'+(c.h-c.p.b)+
      '" stroke="'+m[1]+'" stroke-width="1.5" stroke-dasharray="4 3"/>');
    c.txt(x,c.p.t-3,m[2],{ta:"middle",fs:9,fill:m[1],fw:500});});
  vals.forEach(function(v,i){
    var y=c.p.t+10+i*40,bh=20;
    var col=v<=S.dose?cssv("--mel-good"):(v<=200?cssv("--mel-serious"):cssv("--mel-crit"));
    var xe=c.LX(Math.max(v,c.xd[0]*1.02));
    c.push('<path d="M'+x0+','+y+' H'+(xe-4).toFixed(1)+' a4,4 0 0 1 4,4 v'+(bh-8)+
      ' a4,4 0 0 1 -4,4 H'+x0+' Z" fill="'+col+'"/>');
    c.txt(xe+8,y+bh/2,(v>=10?Math.round(v).toLocaleString():v.toFixed(1))+" mg",
      {db:"middle",fs:11,mono:true,fill:c.ink,fw:500});
    c.txt(c.p.l-12,y+bh/2-4,T.rows[i],{ta:"end",db:"middle",fs:11.5,fill:c.ink});
    c.txt(c.p.l-12,y+bh/2+8,T.subs[i],{ta:"end",db:"middle",fs:9.5,mono:true,fill:c.fnt});});
  c.done(host,null);
}

function drawTac(){
  var host=document.getElementById("melTac");
  var W=Math.max(280,Math.round(host.getBoundingClientRect().width)||720), narrow=W<620;
  var c=new Chart(host,narrow?520:290,{l:52,r:14,t:16,b:40});
  var pw=narrow?W:W/2;
  function panel(ox,oy,ph,title,logY,yd,series,note){
    var l=52,r=16,t=30,b=36,x0=ox+l,x1=ox+pw-r,yT=oy+t,yB=oy+ph-b;
    function X(d){return x0+Math.log10(d)/3*(x1-x0);}
    function Y(v){if(logY){var a=Math.log10(yd[0]),bb=Math.log10(yd[1]);
        return yB-(Math.log10(Math.max(v,yd[0]))-a)/(bb-a)*(yB-yT);}
      return yB-(v-yd[0])/(yd[1]-yd[0])*(yB-yT);}
    c.txt(ox+l,oy+16,title,{fs:11.5,fill:c.ink,fw:600});
    (logY?logTicks(yd[0],yd[1]):[0,20,40,60,80,100]).forEach(function(v){var y=Y(v);
      c.push('<line x1="'+x0+'" y1="'+y.toFixed(1)+'" x2="'+x1+'" y2="'+y.toFixed(1)+
        '" stroke="'+c.grid+'" stroke-width="1"/>');
      c.txt(x0-7,y,logY?supf(v):String(v),{ta:"end",db:"middle",fs:9.5,mono:true});});
    [1,10,100,1000].forEach(function(d){
      c.txt(X(d),yB+15,d>=1000?"1,000":String(d),{ta:"middle",fs:9.5,mono:true});});
    c.push('<line x1="'+x0+'" y1="'+yB+'" x2="'+x1+'" y2="'+yB+'" stroke="'+c.ax+'" stroke-width="1"/>');
    c.txt(x0,yT-8,logY?T.ofbase:T.risein,{fs:9,fill:c.fnt});
    c.txt((x0+x1)/2,oy+ph-4,T.dose,{ta:"middle",fs:9.5});
    series.forEach(function(s){var d="";
      for(var e=0;e<=300;e++){var v=Math.pow(10,e/100);
        d+=(e?"L":"M")+X(v).toFixed(1)+","+Y(s.f(v)).toFixed(1);}
      c.push('<path d="'+d+'" fill="none" stroke="'+s.c+'" stroke-width="2"'+
        (s.dash?' stroke-dasharray="5 4"':"")+'/>');});
    if(note){c.push('<line x1="'+x0+'" y1="'+Y(note.at)+'" x2="'+x1+'" y2="'+Y(note.at)+
        '" stroke="'+cssv("--mel-crit")+'" stroke-width="1" stroke-dasharray="3 3"/>');
      c.txt(x0+4,Y(note.at)-5,note.l,{fs:9.5,fill:cssv("--mel-crit")});}
    var dx=X(Math.max(1,Math.min(1000,S.dose)));
    c.push('<line x1="'+dx.toFixed(1)+'" y1="'+yT+'" x2="'+dx.toFixed(1)+'" y2="'+yB+
      '" stroke="'+c.acc+'" stroke-width="1.5"/>');
    return {X:X,Y:Y,yT:yT,yB:yB};
  }
  panel(0,0,narrow?260:290,T.direct,true,[1e-5,5],[
    {f:function(d){return tacDirect(d,4,true)},c:cssv("--mel-s2")},
    {f:function(d){return tacDirect(d,1,true)},c:cssv("--mel-s1")},
    {f:function(d){return tacDirect(d,1,false)},c:cssv("--mel-s1"),dash:true}
  ],{at:1,l:T.floor});
  var g=panel(narrow?0:pw,narrow?260:0,narrow?260:290,T.indirect,false,[0,100],[
    {f:tacIndirect,c:cssv("--mel-s1")},
    {f:function(d){return 28*d/(0.15+d)},c:cssv("--mel-s3"),dash:true},
    {f:function(d){return 55*d/(900+d)},c:cssv("--mel-s2"),dash:true}
  ],null);
  var ix=g.X(6), iy=g.Y(75);
  c.push('<line x1="'+ix+'" y1="'+g.Y(50)+'" x2="'+ix+'" y2="'+g.Y(100)+'" stroke="'+
    cssv("--mel-crit")+'" stroke-width="1.5"/>');
  c.push('<circle cx="'+ix+'" cy="'+iy+'" r="4.5" fill="'+cssv("--mel-crit")+'" stroke="'+
    c.surf+'" stroke-width="2"/>');
  c.txt(ix+9,iy-2,T.icu,{fs:9.5,fill:c.ink});
  c.done(host,null);
  document.getElementById("melLegTac").innerHTML=
    '<li><span class="mel-key" style="background:'+cssv("--mel-s1")+'"></span>'+T.legTot+'</li>'+
    '<li><span class="mel-key" style="background:'+cssv("--mel-s2")+'"></span>'+T.legCas+'</li>'+
    '<li><span class="mel-key" style="background:'+cssv("--mel-s3")+'"></span>'+T.legRec+'</li>'+
    '<li><span class="mel-key dash"></span>'+T.legDash+'</li>';
}

/* ------------------------------------------------------------------------
   Crossing depth: where the topical gradient meets the oral plateau.
   cTopUm is monotone decreasing in depth, so bisection is exact enough.
   Returns null if one route is higher at every depth (with .side).      */
function crossing(p,oc){
  var a=0,b=4000,fa=cTopUm(a,p)-oc,fb=cTopUm(b,p)-oc;
  if(fa<=0)return {um:null,side:"oral"};
  if(fb>=0)return {um:null,side:"top"};
  for(var i=0;i<50;i++){var m=(a+b)/2,fm=cTopUm(m,p)-oc;if(fm>0)a=m;else b=m;}
  return {um:(a+b)/2,side:null};
}

/* ------------------------------------------------------------------------
   Skin section. A procedurally painted scalp cross-section (cached per size),
   with the concentration field composited on top each time the inputs move.
   Depth is square-root scaled so the 18 µm stratum corneum and 80 µm epidermis
   stay visible next to a 4 mm follicle; the tick labels give true depth.     */
var SEC={view:"split",labels:true,cache:null,key:"",g:null,drag:false};
var UM0=-36, UMS=-20;
function rnd(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function secGeom(W,H){
  var gl=W<520?40:48, top=30, bot=8, y0=top, y1=H-bot;
  return {W:W,H:H,gl:gl,x0:gl,x1:W,y0:y0,y1:y1,
    Y:function(um){return y0+Math.sqrt(Math.max(0,um-UM0)/(4000-UM0))*(y1-y0);},
    U:function(y){var f=Math.max(0,Math.min(1,(y-y0)/(y1-y0)));return UM0+f*f*(4000-UM0);}};
}
function ramp(t){ /* additive glow: black adds nothing, high values bloom to ice white */
  var st=[[0,[0,0,0]],[0.25,[22,40,120]],[0.5,[24,96,190]],[0.75,[40,175,225]],[0.9,[140,228,245]],[1,[235,252,255]]];
  for(var i=1;i<st.length;i++)if(t<=st[i][0]){var a=st[i-1],b=st[i],k=(t-a[0])/(b[0]-a[0]);
    return [0,1,2].map(function(j){return Math.round(a[1][j]+(b[1][j]-a[1][j])*k);});}
  return st[st.length-1][1];
}
var CLO=-2, CHI=3; /* log10 ng/mL range of the colour scale */
function tOf(c){return Math.max(0,Math.min(1,(Math.log10(Math.max(c,1e-9))-CLO)/(CHI-CLO)));}

function paintTissue(W,H,dpr,g){
  var cv=document.createElement("canvas"); cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  var x=cv.getContext("2d"); x.scale(dpr,dpr);
  var R=rnd(7), Y=g.Y, X0=g.x0, X1=g.x1, SW=X1-X0;
  function rr(a,b){return a+(b-a)*R();}
  function dej(px){var s=0.78*Math.sin(px/SW*Math.PI*2*Math.max(9,SW/26))+0.22*Math.sin(px*0.47+1.3);
    return Y(84)-s*(Y(118)-Y(52))*0.5;}
  var yS=Y(UMS), y0=Y(0), yP=Y(400), yR=Y(2000), yB=g.y1;
  function subTop(px){return yR+Math.sin(px*0.045)*5+Math.sin(px*0.013+2)*7;}
  x.save(); x.beginPath(); x.rect(X0,yS-1,SW,yB-yS+1); x.clip();

  /* dermis ground */
  var gd=x.createLinearGradient(0,y0,0,yR);
  gd.addColorStop(0,"#f5d0c8"); gd.addColorStop(0.25,"#efbcb5"); gd.addColorStop(1,"#e3a6a2");
  x.fillStyle=gd; x.fillRect(X0,y0,SW,yR-y0+20);
  /* papillary dermis: loose, fine, randomly oriented fibres */
  x.lineCap="round";
  for(var i=0;i<SW*2.2;i++){var px=rr(X0,X1),py=rr(Y(60),yP),a=rr(0,Math.PI),l=rr(4,11);
    x.strokeStyle=R()<0.5?"rgba(255,236,230,.55)":"rgba(196,118,118,.28)"; x.lineWidth=rr(.4,.9);
    x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+Math.cos(a)*l*.5+rr(-2,2),py+Math.sin(a)*l*.5+rr(-2,2),
      px+Math.cos(a)*l,py+Math.sin(a)*l); x.stroke();}
  /* reticular dermis: thick interwoven collagen bundles */
  var cols=["rgba(244,204,196,.62)","rgba(214,146,140,.5)","rgba(232,176,168,.6)","rgba(200,128,126,.38)"];
  var nb=Math.round(SW*(yR-yP)/70);
  for(i=0;i<nb;i++){px=rr(X0-20,X1);py=rr(yP-4,yR+10);a=rr(-0.32,0.32)+(R()<0.15?rr(-1,1):0);l=rr(16,52);
    var w=rr(1.6,4.8),cx=px+Math.cos(a)*l*.5,cy=py+Math.sin(a)*l*.5+rr(-5,5);
    x.strokeStyle=cols[i%4]; x.lineWidth=w;
    x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(cx,cy,px+Math.cos(a)*l,py+Math.sin(a)*l); x.stroke();
    if(w>3){x.strokeStyle="rgba(255,240,236,.35)"; x.lineWidth=w*.28;
      x.beginPath(); x.moveTo(px,py-w*.22); x.quadraticCurveTo(cx,cy-w*.22,px+Math.cos(a)*l,py+Math.sin(a)*l-w*.22); x.stroke();}}
  /* elastic fibres and fibroblast nuclei */
  for(i=0;i<SW*0.9;i++){px=rr(X0,X1);py=rr(yP,yR);a=rr(-0.6,0.6);l=rr(10,30);
    x.strokeStyle="rgba(150,70,90,.22)"; x.lineWidth=.55;
    x.beginPath(); x.moveTo(px,py); x.bezierCurveTo(px+l*.3,py+rr(-4,4),px+l*.6,py+rr(-4,4),px+l*Math.cos(a),py+l*Math.sin(a)); x.stroke();}
  for(i=0;i<SW*0.7;i++){px=rr(X0,X1);py=rr(Y(60),yR);
    x.fillStyle="rgba(120,60,96,.45)"; x.beginPath(); x.ellipse(px,py,rr(1.2,2),rr(.5,.8),rr(-.3,.3),0,7); x.fill();}

  /* subcutis: fat lobules with fibrous septa */
  x.save(); x.beginPath(); x.moveTo(X0,yB+2);
  for(px=X0;px<=X1+4;px+=4)x.lineTo(px,subTop(px)); x.lineTo(X1+4,yB+2); x.closePath(); x.clip();
  x.fillStyle="#dcae8e"; x.fillRect(X0,yR-30,SW,yB-yR+40);
  var sp=W<520?12:15, rowi=0;
  for(py=yR-20;py<yB+sp;py+=sp*0.86,rowi++){
    for(px=X0-sp+(rowi%2?sp/2:0);px<X1+sp;px+=sp){
      var cxp=px+rr(-2.4,2.4),cyp=py+rr(-2.4,2.4),r=sp*rr(.47,.56),n=9;
      var gg=x.createRadialGradient(cxp-r*.3,cyp-r*.35,r*.1,cxp,cyp,r);
      gg.addColorStop(0,"#fff6cf"); gg.addColorStop(.55,"#f6dc8e"); gg.addColorStop(1,"#e5b86a");
      x.fillStyle=gg; x.beginPath();
      for(var k=0;k<n;k++){var an=k/n*Math.PI*2,rk=r*rr(.86,1.04);
        if(k)x.lineTo(cxp+Math.cos(an)*rk,cyp+Math.sin(an)*rk);else x.moveTo(cxp+Math.cos(an)*rk,cyp+Math.sin(an)*rk);}
      x.closePath(); x.fill(); x.strokeStyle="rgba(176,112,86,.55)"; x.lineWidth=.8; x.stroke();
      x.fillStyle="rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(cxp-r*.35,cyp-r*.4,r*.28,r*.14,-.6,0,7); x.fill();}}
  for(i=0;i<5;i++){var sx=X0+SW*(i+rr(.1,.9))/5; x.strokeStyle="rgba(228,170,150,.9)"; x.lineWidth=rr(2.5,4);
    x.beginPath(); x.moveTo(sx,yR-10);
    x.bezierCurveTo(sx+rr(-40,40),yR+(yB-yR)*.35,sx+rr(-40,40),yR+(yB-yR)*.7,sx+rr(-30,30),yB+4); x.stroke();}
  x.restore();
  /* dermis-subcutis interface shadow */
  x.strokeStyle="rgba(150,80,70,.25)"; x.lineWidth=2; x.beginPath();
  for(px=X0;px<=X1;px+=4){if(px===X0)x.moveTo(px,subTop(px));else x.lineTo(px,subTop(px));} x.stroke();

  /* blood vessels */
  function vessel(pts,w,c1,c2){
    function path(off){x.beginPath();x.moveTo(pts[0][0],pts[0][1]+off);
      for(var j=1;j<pts.length-1;j++){var mx=(pts[j][0]+pts[j+1][0])/2,my=(pts[j][1]+pts[j+1][1])/2;
        x.quadraticCurveTo(pts[j][0],pts[j][1]+off,mx,my+off);}
      x.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]+off);}
    x.lineCap="round"; x.lineJoin="round";
    path(0); x.strokeStyle="rgba(90,20,32,.55)"; x.lineWidth=w+1.6; x.stroke();
    path(0); x.strokeStyle=c1; x.lineWidth=w; x.stroke();
    path(-w*.18); x.strokeStyle=c2; x.lineWidth=Math.max(.6,w*.3); x.stroke();}
  function wavy(yc,amp,seed){var pts=[],q=rnd(seed);for(var px2=X0-10;px2<=X1+20;px2+=28)pts.push([px2,yc+(q()-.5)*amp]);return pts;}
  vessel(wavy(Y(1880),10,3),5.2,"#8e2b48","rgba(220,120,150,.55)");
  vessel(wavy(Y(1960),10,4),3.6,"#cf3a3a","rgba(255,170,160,.7)");
  vessel(wavy(Y(360),5,5),2.6,"#9a3150","rgba(230,130,160,.5)");
  vessel(wavy(Y(395),5,6),2,"#d4453f","rgba(255,175,165,.7)");
  for(i=0;i<4;i++){var vx=X0+SW*(i+.5)/4+rr(-20,20);
    vessel([[vx,Y(1900)],[vx+rr(-12,12),Y(1300)],[vx+rr(-12,12),Y(800)],[vx+rr(-6,6),Y(390)]],1.8,"#c93c3e","rgba(255,170,160,.6)");}
  /* eccrine sweat gland: coil in the deep dermis, duct to the surface */
  var gx=X0+SW*0.52, gy=Y(2150);
  for(i=0;i<16;i++){var a1=rr(0,7),r1=rr(3,10);
    x.strokeStyle="rgba(150,90,80,.6)"; x.lineWidth=4.2; x.beginPath();
    x.ellipse(gx+Math.cos(a1)*r1*1.6,gy+Math.sin(a1)*r1*.8,rr(3,6),rr(2,4),rr(0,3),0,7); x.stroke();
    x.strokeStyle="#efc9b0"; x.lineWidth=2.8; x.stroke();}
  x.strokeStyle="rgba(150,90,80,.55)"; x.lineWidth=3; x.beginPath(); x.moveTo(gx,gy-8);
  x.bezierCurveTo(gx+14,Y(1400),gx-12,Y(700),gx+4,Y(120)); x.stroke();
  x.strokeStyle="#f0cdb6"; x.lineWidth=1.8; x.stroke();

  /* epidermis with rete ridges */
  x.save(); x.beginPath(); x.moveTo(X0,y0-1);
  for(px=X0;px<=X1+3;px+=3)x.lineTo(px,dej(px)); x.lineTo(X1+3,y0-1); x.closePath();
  var ge=x.createLinearGradient(0,y0,0,Y(118)); ge.addColorStop(0,"#efd8bd"); ge.addColorStop(1,"#e2bb98");
  x.fillStyle=ge; x.fill(); x.clip();
  var cs=W<520?4.4:5.4;
  for(py=y0+1;py<Y(125);py+=cs*.9){for(px=X0+(Math.round(py)%2?cs/2:0);px<X1;px+=cs){
    var qx=px+rr(-1,1),qy=py+rr(-1,1);
    x.strokeStyle="rgba(168,118,88,.33)"; x.lineWidth=.6; x.beginPath();
    for(k=0;k<6;k++){an=k/6*Math.PI*2+.3;var rx=qx+Math.cos(an)*cs*.52,ry=qy+Math.sin(an)*cs*.42;
      if(k)x.lineTo(rx,ry);else x.moveTo(rx,ry);} x.closePath(); x.stroke();
    x.fillStyle="rgba(118,76,70,.42)"; x.beginPath(); x.arc(qx,qy,cs*.16,0,7); x.fill();}}
  /* granular layer */
  for(i=0;i<SW*1.6;i++){x.fillStyle="rgba(92,56,60,.5)";x.beginPath();x.arc(rr(X0,X1),y0+rr(.5,3.2),rr(.35,.7),0,7);x.fill();}
  x.restore();
  /* basal layer: columnar cells carrying melanin, traced along the junction */
  for(px=X0;px<X1;px+=2.6){var yy=dej(px),dy=(dej(px+1)-dej(px-1))/2,nx=-dy,ny=1,nl=Math.hypot(nx,ny);nx/=nl;ny/=nl;
    x.strokeStyle="rgba(160,104,70,.5)"; x.lineWidth=2;
    x.beginPath(); x.moveTo(px-nx*.5,yy-ny*.5); x.lineTo(px-nx*3.2,yy-ny*3.2); x.stroke();
    if(R()<.45){x.fillStyle="rgba(78,46,30,.8)";x.beginPath();x.arc(px-nx*rr(1.5,4),yy-ny*rr(1.5,4),.55,0,7);x.fill();}}
  x.strokeStyle="rgba(130,70,60,.45)"; x.lineWidth=.9; x.beginPath();
  for(px=X0;px<=X1;px+=3){if(px===X0)x.moveTo(px,dej(px));else x.lineTo(px,dej(px));} x.stroke();
  /* capillary loops rising into each dermal papilla */
  var per=SW/Math.max(9,SW/26);
  for(px=X0+per*.25;px<X1;px+=per/1){var best=px,bv=1e9;
    for(var t2=-per/2;t2<per/2;t2+=1){if(dej(px+t2)<bv){bv=dej(px+t2);best=px+t2;}}
    var top2=bv+3.2, base=Y(360);
    x.lineCap="round";
    [["rgba(90,20,32,.5)",2.6],["#d64a42",1.5]].forEach(function(st,si){
      x.strokeStyle=si?"#d64a42":st[0]; x.lineWidth=st[1]; x.beginPath();
      x.moveTo(best-1.8,base); x.bezierCurveTo(best-2.4,base-(base-top2)*.5,best-2.2,top2+2,best,top2);
      x.stroke();
      if(si)x.strokeStyle="#9c3352";
      x.beginPath(); x.moveTo(best,top2); x.bezierCurveTo(best+2.2,top2+2,best+2.6,base-(base-top2)*.5,best+2,base); x.stroke();});
    px=best+per*0.0;}
  /* stratum corneum: stacked anucleate lamellae */
  var gsc=x.createLinearGradient(0,yS,0,y0); gsc.addColorStop(0,"#f7ecd6"); gsc.addColorStop(1,"#ead6b4");
  x.fillStyle=gsc; x.fillRect(X0,yS,SW,y0-yS+.5);
  for(i=0;i<7;i++){var ly=yS+(y0-yS)*(i+.5)/7; x.strokeStyle="rgba(190,160,120,.55)"; x.lineWidth=.5; x.beginPath();
    for(px=X0;px<=X1;px+=6){var yy2=ly+Math.sin(px*.07+i*1.7)*.5; if(px===X0)x.moveTo(px,yy2);else x.lineTo(px,yy2);} x.stroke();}
  x.strokeStyle="rgba(255,255,255,.75)"; x.lineWidth=1; x.beginPath(); x.moveTo(X0,yS+.5); x.lineTo(X1,yS+.5); x.stroke();
  x.restore();

  /* hair follicles (drawn last, they pass through every layer) */
  var fols=[X0+SW*0.27,X0+SW*0.78];
  g.fol=[];
  fols.forEach(function(fx,fi){
    var m2,aa,rrr;
    var tilt=SW*0.035, xt=fx-tilt, yt=yS-2, xb=fx+tilt, yb=Y(3220);
    var dx=xb-xt, dyy=yb-yt, L=Math.hypot(dx,dyy), ux=dx/L, uy=dyy/L, nx=-uy, ny=ux;
    var sc=Math.min(1,SW/560)*0.85+0.15;
    function P(t,off){return [xt+dx*t+nx*off,yt+dyy*t+ny*off];}
    function band(w0,w1,fill,stroke,t0,t1){t0=t0||0;t1=t1||1;
      x.beginPath(); var j,pt;
      for(j=0;j<=40;j++){var tt=t0+(t1-t0)*j/40;pt=P(tt,(typeof w0==="function"?w0(tt):w0)*sc);if(j)x.lineTo(pt[0],pt[1]);else x.moveTo(pt[0],pt[1]);}
      for(j=40;j>=0;j--){tt=t0+(t1-t0)*j/40;pt=P(tt,-(typeof w1==="function"?w1(tt):w1)*sc);x.lineTo(pt[0],pt[1]);}
      x.closePath(); x.fillStyle=fill; x.fill(); if(stroke){x.strokeStyle=stroke;x.lineWidth=.8;x.stroke();}}
    var tB=0.9; /* bulb starts */
    function funnel(tt){return tt<0.12?(1-tt/0.12)*9:0;}
    band(function(t){return 19+funnel(t);},function(t){return 19+funnel(t);},"rgba(205,128,120,.85)","rgba(150,80,70,.5)",0,tB);
    band(function(t){return 15+funnel(t);},function(t){return 15+funnel(t);},"#efd3b4","rgba(160,110,80,.55)",0,tB);
    band(function(t){return 9+funnel(t)*.6;},function(t){return 9+funnel(t)*.6;},"#e8bd8f",null,0.04,tB);
    /* sebaceous gland, three lobules on one side, duct into the canal */
    var side=fi?-1:1, tg=(Y(700)-yt)/dyy;
    [[tg-0.012,0],[tg+0.035,4],[tg+0.08,-2]].forEach(function(lb,li){
      var c0=P(lb[0],side*(30+lb[1])*sc), rx=(13-li)*sc*1.15, ry=(17-li*2)*sc*1.15;
      var gl2=x.createRadialGradient(c0[0]-rx*.3,c0[1]-ry*.3,1,c0[0],c0[1],Math.max(rx,ry));
      gl2.addColorStop(0,"#fffbe8"); gl2.addColorStop(.6,"#f6e6b8"); gl2.addColorStop(1,"#dcc088");
      x.fillStyle=gl2; x.beginPath(); x.ellipse(c0[0],c0[1],rx,ry,Math.atan2(uy,ux)-Math.PI/2,0,7); x.fill();
      x.strokeStyle="rgba(170,130,80,.6)"; x.lineWidth=.9; x.stroke();
      for(var m2=0;m2<14;m2++){var aa=rr(0,7),rrr=rr(0,.8);
        x.strokeStyle="rgba(200,165,105,.45)"; x.lineWidth=.5; x.beginPath();
        x.arc(c0[0]+Math.cos(aa)*rx*rrr,c0[1]+Math.sin(aa)*ry*rrr,rr(1.2,2.4)*sc,0,7); x.stroke();}
      if(!li){g.fol.push({k:"seb",x:c0[0],y:c0[1]});}});
    var d0=P(tg-0.03,side*14*sc), d1=P(tg-0.02,side*22*sc);
    x.strokeStyle="#f3e3b8"; x.lineWidth=4*sc; x.beginPath(); x.moveTo(d0[0],d0[1]); x.lineTo(d1[0],d1[1]); x.stroke();
    /* arrector pili muscle: bulge to the papillary dermis, opposite side */
    var b0=P((Y(1150)-yt)/dyy,-side*18*sc), b1=[b0[0]-side*SW*0.12,Y(110)];
    x.strokeStyle="rgba(170,80,74,.75)"; x.lineWidth=4.2*sc; x.beginPath(); x.moveTo(b0[0],b0[1]);
    x.quadraticCurveTo((b0[0]+b1[0])/2-side*6,(b0[1]+b1[1])/2,b1[0],b1[1]); x.stroke();
    x.strokeStyle="rgba(230,140,130,.5)"; x.lineWidth=1.2*sc; x.stroke();
    /* hair bulb: matrix cup around the dermal papilla */
    var bc=P(0.955,0), br=26*sc;
    var gb=x.createRadialGradient(bc[0]-br*.3,bc[1]-br*.3,2,bc[0],bc[1],br*1.1);
    gb.addColorStop(0,"#c99a76"); gb.addColorStop(.7,"#a97050"); gb.addColorStop(1,"#7e4c34");
    x.fillStyle="rgba(205,128,120,.9)"; x.beginPath(); x.ellipse(bc[0],bc[1],br+5*sc,br*1.12+5*sc,Math.atan2(uy,ux)-Math.PI/2,0,7); x.fill();
    x.fillStyle=gb; x.beginPath(); x.ellipse(bc[0],bc[1],br,br*1.12,Math.atan2(uy,ux)-Math.PI/2,0,7); x.fill();
    for(m2=0;m2<60;m2++){aa=rr(0,7);rrr=rr(.35,.95);x.fillStyle="rgba(60,34,20,.55)";
      x.beginPath();x.arc(bc[0]+Math.cos(aa)*br*rrr,bc[1]+Math.sin(aa)*br*1.1*rrr,rr(.4,.9),0,7);x.fill();}
    var dp=P(0.968,0), gp=x.createRadialGradient(dp[0]-3,dp[1]-4,1,dp[0],dp[1],13*sc);
    gp.addColorStop(0,"#f6b7ae"); gp.addColorStop(1,"#d77f7c");
    x.fillStyle=gp; x.beginPath(); x.ellipse(dp[0],dp[1],9*sc,13*sc,Math.atan2(uy,ux)-Math.PI/2,0,7); x.fill();
    x.strokeStyle="#c8383c"; x.lineWidth=1.3; x.beginPath(); x.moveTo(dp[0],dp[1]+14*sc);
    x.bezierCurveTo(dp[0]-5*sc,dp[1]+3*sc,dp[0]+5*sc,dp[1]-4*sc,dp[0],dp[1]-8*sc); x.stroke();
    /* hair shaft with cuticle highlight, continuing above the surface */
    var s0=P(0.93,0), sTop=[xt-ux*(yt-2)/uy*1,2];
    var gs=x.createLinearGradient(s0[0]+nx*7,s0[1]+ny*7,s0[0]-nx*7,s0[1]-ny*7);
    gs.addColorStop(0,"#2c1a10"); gs.addColorStop(.45,"#5b3a24"); gs.addColorStop(.6,"#7a5236"); gs.addColorStop(1,"#24150c");
    x.fillStyle=gs; x.beginPath();
    var hw=6*sc; x.moveTo(s0[0]+nx*hw,s0[1]+ny*hw); x.lineTo(sTop[0]+nx*hw,sTop[1]+ny*hw);
    x.lineTo(sTop[0]-nx*hw,sTop[1]-ny*hw); x.lineTo(s0[0]-nx*hw,s0[1]-ny*hw); x.closePath(); x.fill();
    x.strokeStyle="rgba(255,235,210,.35)"; x.lineWidth=1; x.beginPath();
    x.moveTo(s0[0]-nx*hw*.35,s0[1]-ny*hw*.35); x.lineTo(sTop[0]-nx*hw*.35,sTop[1]-ny*hw*.35); x.stroke();
    g.fol.push({k:"fol",x:P(0.5,0)[0],y:P(0.5,0)[1]},{k:"bulb",x:bc[0],y:bc[1]});
  });

  /* light: soft key from the upper left, gentle vignette, fine grain */
  x.save(); x.beginPath(); x.rect(X0,yS,SW,yB-yS); x.clip();
  var lg=x.createLinearGradient(X0,yS,X1,yB); lg.addColorStop(0,"rgba(255,250,240,.10)"); lg.addColorStop(1,"rgba(40,10,10,.12)");
  x.fillStyle=lg; x.fillRect(X0,yS,SW,yB-yS);
  var vg=x.createRadialGradient(X0+SW/2,(yS+yB)/2,Math.min(SW,yB-yS)*.35,X0+SW/2,(yS+yB)/2,Math.max(SW,yB-yS)*.75);
  vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(30,8,8,.16)");
  x.fillStyle=vg; x.fillRect(X0,yS,SW,yB-yS);
  var nz=document.createElement("canvas"); nz.width=nz.height=96; var nx2=nz.getContext("2d"),id=nx2.createImageData(96,96);
  for(i=0;i<id.data.length;i+=4){var v=Math.round(R()*255);id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=16;}
  nx2.putImageData(id,0,0); x.fillStyle=x.createPattern(nz,"repeat"); x.fillRect(X0,yS,SW,yB-yS);
  x.restore();
  g.dej=dej; g.subTop=subTop; g.per=per;
  return cv;
}

function drawSection(){
  var host=document.getElementById("melSection"); if(!host)return;
  var cv=document.getElementById("melSecCv"), tip=document.getElementById("melTipSec");
  var W=Math.max(300,Math.round(host.getBoundingClientRect().width)||700);
  var H=Math.round(Math.max(420,Math.min(620,W*0.82)));
  var dpr=Math.min(2.5,window.devicePixelRatio||1);
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.height=H+"px";
  var key=W+"x"+H+"@"+dpr;
  if(SEC.key!==key){SEC.g=secGeom(W,H); SEC.cache=paintTissue(W,H,dpr,SEC.g); SEC.key=key;}
  var g=SEC.g, x=cv.getContext("2d"); x.setTransform(dpr,0,0,dpr,0,0);
  var ink=cssv("--ig-ink"), mut=cssv("--ig-muted"), paper=cssv("--ig-paper"), panel=cssv("--ig-panel"), rule=cssv("--ig-rule");
  x.fillStyle=panel; x.fillRect(0,0,W,H);
  x.drawImage(SEC.cache,0,0,W,H);
  var X0=g.x0, X1=g.x1, mid=(X0+X1)/2, oc=oralTissue(), p=S.pct;
  var regs=SEC.view==="split"?[["top",X0,mid],["oral",mid,X1]]:[[SEC.view,X0,X1]];
  var MONO="IBM Plex Mono, ui-monospace, monospace", SANS="Inter, system-ui, sans-serif";
  function cAt(kind,um){
    if(kind==="oral")return um<0?0:oc;
    if(um<UMS)return cVeh(p);
    if(um<0){var a=Math.log10(cVeh(p)/30),b=Math.log10(cTopUm(0,p)),f=(um-UMS)/(0-UMS);return Math.pow(10,a+(b-a)*f);}
    return cTopUm(um,p);}
  /* concentration field */
  regs.forEach(function(r){
    var k=r[0], xa=r[1], xb=r[2];
    if(k==="top"){ /* glossy applied film */
      var yf0=g.Y(UM0), yf1=g.Y(UMS);
      var gf=x.createLinearGradient(0,yf0,0,yf1); gf.addColorStop(0,"rgba(200,240,255,.85)"); gf.addColorStop(1,"rgba(120,200,250,.75)");
      x.fillStyle=gf; x.beginPath();
      x.moveTo(xa,yf1); for(var px=xa;px<=xb;px+=6)x.lineTo(px,yf0+1.2+Math.sin(px*.05)*1.1); x.lineTo(xb,yf1); x.closePath(); x.fill();
      x.strokeStyle="rgba(255,255,255,.95)"; x.lineWidth=1.2; x.beginPath();
      for(px=xa;px<=xb;px+=6){var yy=yf0+1.6+Math.sin(px*.05)*1.1;if(px===xa)x.moveTo(px,yy);else x.lineTo(px,yy);} x.stroke();}
    for(var y=Math.floor(g.Y(k==="top"?UMS:0));y<g.y1;y+=2){
      var c=cAt(k,g.U(y+1)); if(c<Math.pow(10,CLO))continue;
      var t=tOf(c), rgb=ramp(t);
      x.globalCompositeOperation="screen";
      x.fillStyle="rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")"; x.fillRect(xa,y,xb-xa,2);
      x.globalCompositeOperation="source-over";}
    /* molecules: dot density follows the same log scale */
    var R=rnd(k==="top"?11:23), cell=W<520?7:8;
    for(y=g.Y(k==="top"?UMS:0);y<g.y1;y+=cell){var c2=cAt(k,g.U(y+cell/2));if(c2<Math.pow(10,CLO))continue;
      var t2=tOf(c2), pr=0.03+0.85*Math.pow(t2,1.8);
      for(var xx=xa;xx<xb;xx+=cell){var r1=R(),r2=R(),r3=R(); if(r1>pr)continue;
        var dx=xx+r2*cell, dy=y+r3*cell; x.fillStyle="rgba(210,245,255,.22)"; x.beginPath(); x.arc(dx,dy,2.4,0,7); x.fill();
        x.fillStyle="rgba(240,253,255,.92)"; x.beginPath(); x.arc(dx,dy,.95,0,7); x.fill();}}
    /* decade isolines on the topical side */
    if(k==="top"){for(var e=CLO;e<=CHI;e++){var cr=crossing(p,Math.pow(10,e)); if(cr.um===null||cr.um<6)continue;
      var yi=g.Y(cr.um); x.setLineDash([2,4]); x.strokeStyle="rgba(255,255,255,.7)"; x.lineWidth=1;
      x.beginPath(); x.moveTo(xa,yi); x.lineTo(xb,yi); x.stroke(); x.setLineDash([]);
      var lab=e===0?"1":e===1?"10":e===2?"100":e===3?"1,000":supf(Math.pow(10,e));
      x.font="500 9.5px "+MONO; var tw=x.measureText(lab).width;
      x.fillStyle="rgba(10,20,40,.55)"; x.fillRect(xa+4,yi-6.5,tw+8,13);
      x.fillStyle="#e9fbff"; x.textBaseline="middle"; x.fillText(lab,xa+8,yi+.5);}}
  });
  if(SEC.view==="split"){x.fillStyle=paper; x.fillRect(mid-1.5,g.y0,3,g.y1-g.y0);
    x.strokeStyle="rgba(0,0,0,.25)"; x.lineWidth=.6; x.beginPath(); x.moveTo(mid-1.5,g.y0); x.lineTo(mid-1.5,g.y1); x.moveTo(mid+1.5,g.y0); x.lineTo(mid+1.5,g.y1); x.stroke();}

  /* header strip: which half is which */
  x.fillStyle=panel; x.fillRect(0,0,W,g.y0-2);
  x.textBaseline="middle"; x.font="600 10.5px "+SANS;
  var plab=PCTS.filter(function(z){return z.v===p})[0].l;
  function head(xa,xb,kind){var s=kind==="top"?T.secTop.toUpperCase()+"  "+plab:T.secOral.toUpperCase()+"  "+dz(S.dose)+" "+T.mgday;
    x.fillStyle=ink; x.textAlign="left"; x.fillText(s,xa+8,13);
    var sub=kind==="top"?"":T.secMean+" "+fmt(oc)+" ng/mL";
    if(sub&&(xb-xa)>230){x.fillStyle=mut; x.font="400 10px "+MONO; x.textAlign="right"; x.fillText(sub,xb-8,13); x.font="600 10.5px "+SANS;}}
  regs.forEach(function(r){head(r[1],r[2],r[0]);});
  x.textAlign="left";

  /* depth gutter */
  x.fillStyle=panel; x.fillRect(0,g.y0-2,X0,H);
  x.strokeStyle=rule; x.lineWidth=1; x.beginPath(); x.moveTo(X0-.5,g.y0); x.lineTo(X0-.5,g.y1); x.stroke();
  x.font="400 9.5px "+MONO; x.fillStyle=mut; x.textAlign="right";
  var ticks=W<520?[0,80,400,1000,2000,3000,4000]:[0,80,200,400,1000,2000,3000,4000];
  ticks.forEach(function(um){var yy=g.Y(um); x.strokeStyle=mut; x.beginPath(); x.moveTo(X0-5,yy); x.lineTo(X0,yy); x.stroke();
    x.textBaseline=um?"middle":"top"; x.fillText(um>=1000?(um/1000)+" mm":String(um),X0-7,um?yy:yy+1);});
  x.textBaseline="middle";
  x.textBaseline="bottom"; x.fillText("SC",X0-7,g.Y(0)-2); x.textBaseline="middle";
  if(W>=520){x.save(); x.translate(10,(g.y0+g.y1)/2); x.rotate(-Math.PI/2); x.textAlign="center"; x.font="400 9.5px "+SANS;
    x.fillText(T.depthAx+" (µm, √)",0,0); x.restore();}
  else{x.textAlign="left"; x.fillText("µm",4,g.y0-12);}
  x.textAlign="left";

  /* crossing line */
  var cr=crossing(p,oc);
  function pill(txt,px2,py2,bg,fg,align){x.font="600 10.5px "+SANS; var tw=x.measureText(txt).width+12, h=17;
    var lx=align==="right"?px2-tw:align==="center"?px2-tw/2:px2;
    lx=Math.max(X0+2,Math.min(X1-tw-2,lx)); var ly=Math.max(g.y0+1,Math.min(g.y1-h-1,py2-h/2));
    x.fillStyle=bg; x.beginPath(); x.roundRect?x.roundRect(lx,ly,tw,h,8.5):x.rect(lx,ly,tw,h); x.fill();
    x.fillStyle=fg; x.textBaseline="middle"; x.textAlign="left"; x.fillText(txt,lx+6,ly+h/2+.5); return [lx,ly,tw,h];}
  if(cr.um!==null){var yc=g.Y(cr.um);
    x.strokeStyle="#ffc94d"; x.lineWidth=2; x.shadowColor="rgba(0,0,0,.45)"; x.shadowBlur=3;
    x.beginPath(); x.moveTo(X0,yc); x.lineTo(X1,yc); x.stroke(); x.shadowBlur=0;
    var bb=pill(T.crossAt(Math.round(cr.um).toLocaleString()),X0+8,yc,"#ffc94d","#2a1d00","left");
    [["\u2191 "+T.topWins,-10],["\u2193 "+T.oralWins,10]].forEach(function(q){
      x.font="500 10px "+SANS; var tw=x.measureText(q[0]).width+10, lx=bb[0]+bb[2]+6, ly=yc+q[1]-7.5;
      x.fillStyle="rgba(22,16,14,.72)"; x.beginPath(); x.roundRect?x.roundRect(lx,ly,tw,15,3):x.rect(lx,ly,tw,15); x.fill();
      x.fillStyle="#fbf3ea"; x.textBaseline="middle"; x.fillText(q[0],lx+5,ly+8);});}
  else{pill(cr.side==="top"?T.noCrossTop:T.noCrossOral,X0+8,g.y1-14,"#ffc94d","#2a1d00","left");}

  /* labels with leader lines */
  if(SEC.labels){
    var lab=[], small=W<520;
    function callout(txt,ax,ay,lx,ly){lab.push([txt,ax,ay,lx,ly]);}
    var xr=X1-6;
    callout(T.L.sc,xr,(g.Y(UMS)+g.Y(0))/2,xr,g.Y(0)+12);
    callout(T.L.ve,xr,g.Y(40),xr,g.Y(40)+(small?24:28));
    if(!small)callout(T.L.pd,xr,g.Y(260),xr,g.Y(260));
    callout(T.L.rd,xr,g.Y(1200),xr,g.Y(1200));
    callout(T.L.sub,xr,g.Y(2800),xr,g.Y(2700));
    (g.fol||[]).forEach(function(f,i){if(i>2)return;
      if(f.k==="seb")callout(T.L.seb,f.x,f.y,f.x+(small?26:38),f.y-(small?18:26));
      if(f.k==="fol"&&!small)callout(T.L.fol,f.x+14,f.y,f.x+46,f.y+14);
      if(f.k==="bulb")callout(T.L.bulb,f.x,f.y+10,f.x+30,f.y+(small?34:38));});
    if(!small){var cpx=X0+g.per*2.25; callout(T.L.cap,cpx,g.Y(150),cpx+40,g.Y(210)+6);
      callout(T.L.plex,X0+(X1-X0)*0.42,g.Y(1960),X0+(X1-X0)*0.42,g.Y(1960)+22);}
    lab.forEach(function(L){var txt=L[0],ax=L[1],ay=L[2],lx=L[3],ly=L[4];
      x.font="500 "+(small?9.5:10.5)+"px "+SANS; var tw=x.measureText(txt).width+10,h=small?15:16;
      var bx=lx>=X1-12?lx-tw:lx, by=ly-h/2; bx=Math.max(X0+2,Math.min(X1-tw-2,bx)); by=Math.max(g.y0+2,Math.min(g.y1-h-2,by));
      if(Math.abs(ax-(bx+tw/2))>tw/2||Math.abs(ay-(by+h/2))>h/2){
        x.strokeStyle="rgba(20,14,12,.75)"; x.lineWidth=1; x.beginPath(); x.moveTo(ax,ay);
        x.lineTo(Math.max(bx,Math.min(bx+tw,ax)),Math.max(by,Math.min(by+h,ay))); x.stroke();
        x.fillStyle="rgba(20,14,12,.85)"; x.beginPath(); x.arc(ax,ay,1.8,0,7); x.fill();}
      x.fillStyle="rgba(22,16,14,.72)"; x.beginPath(); x.roundRect?x.roundRect(bx,by,tw,h,3):x.rect(bx,by,tw,h); x.fill();
      x.fillStyle="#fbf3ea"; x.textBaseline="middle"; x.textAlign="left"; x.fillText(txt,bx+5,by+h/2+.5);});
  }

  /* target depth marker (draggable) */
  var yt=g.Y(S.depth);
  x.strokeStyle="rgba(10,10,10,.65)"; x.lineWidth=3.5; x.beginPath(); x.moveTo(X0,yt); x.lineTo(X1,yt); x.stroke();
  x.strokeStyle="#ffffff"; x.lineWidth=1.6; x.setLineDash([7,4]); x.beginPath(); x.moveTo(X0,yt); x.lineTo(X1,yt); x.stroke(); x.setLineDash([]);
  x.fillStyle="#fff"; x.strokeStyle="rgba(10,10,10,.7)"; x.lineWidth=1.5;
  x.beginPath(); x.arc(X0+1,yt,6,0,7); x.fill(); x.stroke();
  var tTop=cTopUm(S.depth,p), rat=tTop/oc;
  pill(T.tgt+" "+S.depth+" µm  ·  "+(rat>=1?"×"+fmt(rat)+" "+T.topWins:"×"+fmt(1/rat)+" "+T.oralWins),X1-6,yt+(yt>g.y1-30?-14:14),"#ffffff","#1b1917","right");

  cv.setAttribute("aria-label",T.secAria+" "+(cr.um!==null?T.crossAt(Math.round(cr.um)):""));
  /* colour bar */
  var cb=document.getElementById("melCbar");
  if(cb&&!cb.dataset.done){var stops=[];for(var i=0;i<=10;i++){var rgb=ramp(i/10),bs=[214,160,156];
      stops.push("rgb("+bs.map(function(v,j){return Math.round(255-(255-v)*(255-rgb[j])/255);}).join(",")+") "+(i*10)+"%");}
    var tk="";for(var e2=CLO;e2<=CHI;e2++)tk+='<span style="left:'+((e2-CLO)/(CHI-CLO)*100)+'%">'+supf(Math.pow(10,e2))+'</span>';
    cb.innerHTML='<div class="mel-cbar-bar" style="background:linear-gradient(90deg,'+stops.join(",")+'),#d6a09c"></div><div class="mel-cbar-ticks">'+tk+'</div><div class="mel-cbar-lab">'+T.cbar+'</div>';
    cb.dataset.done="1";}
}
function secBind(){
  var cv=document.getElementById("melSecCv"); if(!cv||cv.dataset.b)return; cv.dataset.b="1";
  var tip=document.getElementById("melTipSec");
  function umAt(e){var r=cv.getBoundingClientRect();return SEC.g?SEC.g.U(e.clientY-r.top):0;}
  function setD(e){var um=Math.max(0,Math.min(4000,Math.round(umAt(e)/25)*25));
    S.depth=um; document.getElementById("melDepthR").value=um; all();}
  cv.addEventListener("pointerdown",function(e){SEC.drag=true;cv.setPointerCapture(e.pointerId);setD(e);e.preventDefault();});
  cv.addEventListener("pointermove",function(e){
    if(SEC.drag){setD(e);}
    var r=cv.getBoundingClientRect(),um=umAt(e),oc=oralTissue();
    if(e.clientX-r.left<SEC.g.x0){tip.classList.remove("on");return;}
    var nm=um<0?T.L.sc:um<80?T.L.ve:um<400?T.L.pd:um<2000?T.L.rd:T.L.sub, ct=um<0?null:cTopUm(um,S.pct);
    tip.innerHTML='<div class="th">'+Math.max(0,Math.round(um))+' µm · '+nm+'</div>'+
      (ct===null?'':'<div class="tr"><span class="nm">'+T.secTop+' '+PCTS.filter(function(z){return z.v===S.pct})[0].l+'</span><span class="vl">'+fmt(ct)+'</span></div>'+
      '<div class="tr"><span class="nm">'+T.secOral+' '+dz(S.dose)+' mg</span><span class="vl">'+fmt(oc)+'</span></div>'+
      '<div class="tr"><span class="nm">'+T.ratio+'</span><span class="vl">'+fmt(ct/oc)+'</span></div>');
    tip.classList.add("on");
    var lft=(e.clientX-r.left)+16; if(lft>r.width-170)lft=(e.clientX-r.left)-176;
    tip.style.left=lft+"px"; tip.style.top=Math.max(8,Math.min(r.height-110,e.clientY-r.top-20))+"px";});
  cv.addEventListener("pointerup",function(){SEC.drag=false;});
  cv.addEventListener("pointerleave",function(){SEC.drag=false;tip.classList.remove("on");});
  cv.addEventListener("keydown",function(e){var st=e.shiftKey?250:25;
    if(e.key==="ArrowUp"||e.key==="ArrowDown"){S.depth=Math.max(0,Math.min(4000,S.depth+(e.key==="ArrowDown"?st:-st)));
      document.getElementById("melDepthR").value=S.depth; all(); e.preventDefault();}});
  [].forEach.call(document.querySelectorAll("[data-view]"),function(b){
    b.addEventListener("click",function(){SEC.view=b.dataset.view;
      [].forEach.call(document.querySelectorAll("[data-view]"),function(o){o.setAttribute("aria-pressed",o===b);});drawSection();});});
  var lb=document.getElementById("melSecLabels");
  if(lb)lb.addEventListener("click",function(){SEC.labels=!SEC.labels;lb.setAttribute("aria-pressed",SEC.labels);drawSection();});
}

function render(){
  var pl=PCTS.filter(function(z){return z.v===S.pct})[0].l;
  var nm=S.depth<80?T.names[0]:S.depth<400?T.names[1]:S.depth<2000?T.names[2]:T.names[3];
  var need=reqAt(S.depth,S.pct), have=oralTissue(), tgt=cTopUm(S.depth,S.pct);
  var ratio=have/tgt*100;
  document.getElementById("melVq").textContent=T.q(pl,nm,S.depth);
  document.getElementById("melVnum").innerHTML=
    (need>=10?Math.round(need).toLocaleString():need.toFixed(1))+' <small>'+T.mgday+'</small>';
  var cls=need<=S.dose?"ok":(need<=200?"mid":"no");
  document.getElementById("melVpill").innerHTML='<span class="mel-pill '+cls+
    '"><span class="dot"></span>'+(cls==="ok"?T.ok:cls==="mid"?T.mid:T.no)+'</span>';
  var verdict=need<=S.dose?T.vOk:need<=200?T.vMid(Math.round(need)):T.vNo;
  document.getElementById("melVsent").innerHTML=
    T.sent(dz(S.dose),fmt(have),(ratio>=100?Math.round(ratio):ratio.toFixed(ratio<10?1:0)),
           pl,fmt(tgt),verdict);
  var m24=nM(have);
  document.getElementById("melStats").innerHTML=[
    [T.stats[0],(lam()*1e4).toFixed(0),"µm"],
    [T.stats[1],flux(S.pct).toFixed(3),"µg/cm²/h"],
    [T.stats[2],(fAbs(S.pct)*100).toFixed(1),"%"],
    [T.stats[3],(cavg24(S.dose)*1000).toFixed(0),"pg/mL"],
    [T.stats[4],occ(m24,0.080).toFixed(0),"%"],
    [T.stats[5],occ(m24,0.380).toFixed(0),"%"]
  ].map(function(r){return '<div class="mel-stat"><dt>'+r[0]+'</dt><dd>'+r[1]+
    '<span>'+r[2]+'</span></dd></div>';}).join("");
  document.getElementById("melTbody").innerHTML=TBLD.map(function(um,i){
    return '<tr'+(Math.abs(um-S.depth)<60?' class="hl"':"")+'><td>'+T.tblDepth[i]+'</td>'+
      [0.0033,0.01,0.10,2.5].map(function(p){var v=reqAt(um,p);
        return '<td>'+(v>=10?Math.round(v).toLocaleString():v.toFixed(1))+'</td>';}).join("")+'</tr>';
  }).join("");
  document.getElementById("melCalHint").textContent=S.cal==="label"?T.calLabel:T.calCons;
  document.getElementById("melRelWrap").style.display=S.form==="SR"?"":"none";
  try{drawSection();}catch(err){if(window.console)console.warn("section:",err);}
  drawDepth(); drawPk(); drawLadder(); drawTac();
}

function labels(){
  document.getElementById("melDoseV").textContent=dz(S.dose)+" "+T.mgday;
  document.getElementById("melRelV").textContent=S.rel+" "+T.h;
  document.getElementById("melDepthV").textContent=S.depth+" µm";
  document.getElementById("melKpV").textContent=S.kp.toFixed(2);
  document.getElementById("melQV").textContent=S.q.toFixed(1)+" /h";
  document.getElementById("melDV").textContent="×"+S.dmul.toFixed(2);
  [].forEach.call(document.querySelectorAll("#melTopChips button"),function(b){
    b.setAttribute("aria-pressed",Number(b.dataset.pct)===S.pct);});
  [].forEach.call(document.querySelectorAll("#melDepthChips button"),function(b){
    b.setAttribute("aria-pressed",Number(b.dataset.um)===S.depth);});
  [].forEach.call(document.querySelectorAll("[data-form]"),function(b){
    b.setAttribute("aria-pressed",b.dataset.form===S.form);});
  [].forEach.call(document.querySelectorAll("[data-cal]"),function(b){
    b.setAttribute("aria-pressed",b.dataset.cal===S.cal);});
}
function all(){labels();render();}

function bind(id,fn){var el=document.getElementById(id);
  if(el)el.addEventListener("input",function(e){fn(e.target.value);all();});}
bind("melDoseR",function(v){S.dose=slToDose(+v)});
bind("melRelR",function(v){S.rel=+v});
bind("melDepthR",function(v){S.depth=+v});
bind("melKpR",function(v){S.kp=Math.pow(10,+v)});
bind("melQR",function(v){S.q=+v});
bind("melDR",function(v){S.dmul=Math.pow(10,+v)});
document.getElementById("melTopChips").addEventListener("click",function(e){
  var b=e.target.closest("button"); if(b){S.pct=Number(b.dataset.pct);all();}});
document.getElementById("melDepthChips").addEventListener("click",function(e){
  var b=e.target.closest("button"); if(b){S.depth=Number(b.dataset.um);
    document.getElementById("melDepthR").value=S.depth; all();}});
[].forEach.call(document.querySelectorAll("[data-form]"),function(b){
  b.addEventListener("click",function(){S.form=b.dataset.form;all();});});
[].forEach.call(document.querySelectorAll("[data-cal]"),function(b){
  b.addEventListener("click",function(){S.cal=b.dataset.cal;all();});});
document.getElementById("melDoseR").value=doseToSl(8);
function safe(fn){return function(){try{fn();}catch(err){if(window.console)console.warn("melatonin model:",err);}};}
var lastW=0, rt;
function onResize(){var m=document.querySelector(".mel-main"),w=m?Math.round(m.getBoundingClientRect().width):0;
  if(w&&w!==lastW){lastW=w;safe(render)();}}
addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(onResize,140);});
if(window.ResizeObserver){var mm=document.querySelector(".mel-main");if(mm)new ResizeObserver(function(){clearTimeout(rt);rt=setTimeout(onResize,60);}).observe(mm);}
/* theme toggle swaps light-dark() tokens: drop resolved colours and redraw */
new MutationObserver(function(){CCACHE={};safe(render)();}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","style"]});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(safe(render));
secBind();
safe(all)();
lastW=Math.round((document.querySelector(".mel-main")||document.body).getBoundingClientRect().width);
})();
