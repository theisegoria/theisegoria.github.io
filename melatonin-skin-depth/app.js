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
  calCons:"Andersen 2016 の絶対バイオアベイラビリティ 2.5 %。"
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
  calCons:"Andersen 2016 absolute bioavailability, 2.5 %."
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
function cVeh(p){return p/100*1e6}
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

function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()}
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
  var c=new Chart(host,Math.max(300,Math.min(430,cw*0.58)),{l:56,r:16,t:24,b:40});
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
  c.txt(c.p.l-8,c.p.t-6,"ng/mL",{ta:"end",fs:9.5,fill:c.fnt});
  c.txt((x0+x1)/2,c.h-4,T.depthAx,{ta:"middle",fs:10});
  var oc=oralTissue();
  if(oc>lo){var oy=c.LY(oc), lbl=T.oral+" "+dz(S.dose)+" mg · "+fmt(oc)+" ng/mL";
    c.push('<line x1="'+x0+'" y1="'+oy.toFixed(1)+'" x2="'+x1+'" y2="'+oy.toFixed(1)+
      '" stroke="'+c.mut+'" stroke-width="2" stroke-dasharray="6 4"/>');
    c.push('<rect x="'+(x0+4)+'" y="'+(oy-17)+'" width="'+(lbl.length*6.1+8)+
      '" height="15" fill="'+c.surf+'" opacity="0.92"/>');
    c.txt(x0+8,oy-6,lbl,{fs:10.5,mono:true,fill:c.ink,fw:500});}
  CURVES.forEach(function(p,i){var col=cssv(SER[i]),d="";
    for(var um=0;um<=4000;um+=8)d+=(um?"L":"M")+c.X(um).toFixed(1)+","+c.LY(cTopUm(um,p)).toFixed(1);
    c.push('<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/>');
    var ye=c.LY(cTopUm(4000,p));
    if(ye<yB-4)c.txt(x1-4,ye-5,PCTS.filter(function(z){return z.v===p})[0].l,
      {ta:"end",fs:10,mono:true,fill:c.ink,fw:500});});
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
    '<li><span class="mel-key dash"></span>'+T.oral+' '+dz(S.dose)+' mg/day, '+T.mean24+'</li>';
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
var rt; addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(render,140);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(render);
all();
})();
