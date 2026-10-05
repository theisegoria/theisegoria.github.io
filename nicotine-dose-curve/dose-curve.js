/* Nicotine dose curve: one-compartment, first-order elimination, instantaneous
   absorption of each dose. Shared by the English and Japanese pages. */
(function(){
"use strict";
var JA=(document.documentElement.lang||"en").slice(0,2)==="ja";
var T=JA?{
  mgday:" mg/日", cig:"紙巻き", vape:"電子たばこ", time:"時刻", diff:"差（紙巻き − 電子）",
  peak:"ピーク", trough:"谷", swing:"振れ幅", night:"夜間は投与なし", window:"投与時間帯 07:00から23:00",
  half:function(h){return "半減期 "+h+" 時間ごとに半分";}, next:"翌日", units:"信号（任意単位）",
  aria:function(m){return "24時間のニコチン信号。紙巻きのピーク "+m.peakS.toFixed(1)+"、電子たばこのピーク "+m.peakV.toFixed(1)+"。";},
  perday:"/日"
}:{
  mgday:" mg/day", cig:"Cigarette", vape:"Vape", time:"Time", diff:"difference (cig − vape)",
  peak:"peak", trough:"trough", swing:"swing", night:"no dosing overnight", window:"dosing window 07:00 to 23:00",
  half:function(h){return "halves every "+h+" h";}, next:"next day", units:"signal (arbitrary units)",
  aria:function(m){return "24-hour nicotine signal. Cigarette peak "+m.peakS.toFixed(1)+", vape peak "+m.peakV.toFixed(1)+".";},
  perday:"/day"
};
var $=function(id){return document.getElementById(id);}, els=["dose","cigs","vapes","ratio","half"];
var cv=$("chart"), ctx=cv.getContext("2d"), tip=$("ndTip"), hover=-1, M=null, G=null;

/* The model itself is unchanged from the original page. */
function model(){var dose=+$("dose").value,cigs=+$("cigs").value,vapes=+$("vapes").value,ratio=+$("ratio").value,half=+$("half").value,k=Math.log(2)/half;
  var start=7,win=16; var times=Array.from({length:241},function(_,i){return 7+i/10;});
  var events=function(n,total){return Array.from({length:n},function(_,i){return {t:start+(win*i/(Math.max(1,n-1))),d:total/n};});};
  var s=events(cigs,dose),v=events(vapes,dose*ratio);
  var c=function(t,e){return e.reduce(function(a,x){return a+(t>=x.t?x.d*Math.exp(-k*(t-x.t)):0);},0);};
  var sv=times.map(function(t){return c(t,s);}),vv=times.map(function(t){return c(t,v);});
  var auc=function(a){return a.reduce(function(z,x){return z+x/10;},0);};
  return {times:times,sv:sv,vv:vv,s:s,v:v,half:half,peakS:Math.max.apply(null,sv),peakV:Math.max.apply(null,vv),aucS:auc(sv),aucV:auc(vv),dose:dose,ratio:ratio,cigs:cigs,vapes:vapes};}

/* colours come from CSS so both themes stay in one place */
var PR=null;
function col(n){if(!PR){PR=document.createElement("i");PR.style.display="none";document.body.appendChild(PR);}
  PR.style.color="var("+n+")";return getComputedStyle(PR).color;}
function rgba(c,a){var m=c.match(/[\d.]+/g);return "rgba("+m[0]+","+m[1]+","+m[2]+","+a+")";}
function nice(max){var raw=max/5,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;
  return (f<1.5?1:f<3?2:f<7?5:10)*p;}
function hhmm(t){var h=Math.floor(t)%24,m=Math.round((t-Math.floor(t))*60);if(m===60){h=(h+1)%24;m=0;}
  return (h<10?"0":"")+h+":"+(m<10?"0":"")+m;}

/* swing over the last full dosing interval before the final dose */
function swing(vals,ev){if(ev.length<3)return null;var t1=ev[ev.length-1].t,t0=ev[ev.length-2].t;
  var i0=Math.ceil((t0-7)*10),i1=Math.ceil((t1-7)*10)-1; if(i1<=i0)return null;
  var hi=-1,lo=1e9,ih=i0,il=i1;for(var i=i0;i<=i1;i++){if(vals[i]>hi){hi=vals[i];ih=i;}if(vals[i]<lo){lo=vals[i];il=i;}}
  return {hi:hi,lo:lo,ih:ih,il:il};}

function draw(){
  var m=model(); M=m;
  var dpr=Math.min(3,window.devicePixelRatio||1), r=cv.getBoundingClientRect(), w=Math.max(280,r.width), h=Math.max(240,r.height);
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
  var narrow=w<560, p={l:narrow?36:48,r:narrow?12:92,t:30,b:38}, iw=w-p.l-p.r, ih=h-p.t-p.b;
  var INK=col("--nd-ink"),MUT=col("--nd-muted"),LINE=col("--nd-line"),GRID=col("--nd-grid"),AMB=col("--nd-amber"),CY=col("--nd-cyan"),NIGHT=col("--nd-night"),PANEL=col("--nd-panel");
  var SANS=getComputedStyle(document.querySelector(".nd")||document.body).fontFamily, MONO="ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.clearRect(0,0,w,h);
  var top=Math.max(m.peakS,m.peakV)*1.12, step=nice(top), ymax=Math.ceil(top/step)*step;
  var X=function(i){return p.l+iw*i/240;}, XT=function(t){return p.l+iw*(t-7)/24;}, Y=function(v){return p.t+ih*(1-v/ymax);};
  G={p:p,iw:iw,ih:ih,X:X,Y:Y,w:w,h:h};
  /* night band */
  ctx.fillStyle=NIGHT; ctx.fillRect(XT(23),p.t,XT(31)-XT(23),ih);
  ctx.fillStyle=MUT; ctx.font="500 11px "+SANS; ctx.textBaseline="top";
  if(XT(31)-XT(23)>110){ctx.textAlign="center";ctx.fillText(T.night,(XT(23)+XT(31))/2,p.t+6);}
  if(!narrow){ctx.textAlign="left";ctx.fillText(T.window,XT(7)+6,p.t+6);}
  /* grid */
  ctx.lineWidth=1; ctx.font="11px "+MONO; ctx.textBaseline="middle"; ctx.textAlign="right";
  for(var v=0;v<=ymax+1e-9;v+=step){var y=Math.round(Y(v))+.5;
    ctx.strokeStyle=v===0?LINE:GRID; ctx.beginPath(); ctx.moveTo(p.l,y); ctx.lineTo(p.l+iw,y); ctx.stroke();
    ctx.fillStyle=MUT; ctx.fillText(step<1?v.toFixed(1):v.toFixed(0),p.l-7,y);}
  ctx.textAlign="left"; ctx.textBaseline="bottom"; ctx.fillStyle=MUT; ctx.font="11px "+SANS; ctx.fillText(T.units,p.l,p.t-10);
  /* time axis */
  ctx.textAlign="center"; ctx.textBaseline="top"; ctx.font="11px "+MONO;
  var dt=narrow?6:2;
  for(var t=7;t<=31;t+=dt){var x=Math.round(XT(t))+.5;
    ctx.strokeStyle=GRID; ctx.beginPath(); ctx.moveTo(x,p.t); ctx.lineTo(x,p.t+ih); ctx.stroke();
    ctx.strokeStyle=LINE; ctx.beginPath(); ctx.moveTo(x,p.t+ih); ctx.lineTo(x,p.t+ih+5); ctx.stroke();
    ctx.fillStyle=MUT; ctx.textAlign=t===7?"left":t===31?"right":"center"; ctx.fillText(hhmm(t),x+(t===7?-2:t===31?2:0),p.t+ih+8);}
  ctx.textAlign="center";
  ctx.font="10px "+SANS; ctx.fillText(T.next+" →",Math.min(XT(24)+40,p.l+iw-30),p.t+ih+22);
  ctx.strokeStyle=LINE; ctx.setLineDash([2,3]); ctx.beginPath(); ctx.moveTo(Math.round(XT(24))+.5,p.t+ih); ctx.lineTo(Math.round(XT(24))+.5,p.t+ih+30); ctx.stroke(); ctx.setLineDash([]);
  /* dose ticks along the baseline */
  [[m.s,AMB,0],[m.v,CY,4]].forEach(function(q){ctx.strokeStyle=rgba(q[1],.7);ctx.lineWidth=1;
    q[0].forEach(function(e){var x=Math.round(XT(e.t))+.5;ctx.beginPath();ctx.moveTo(x,p.t+ih-1-q[2]);ctx.lineTo(x,p.t+ih-4-q[2]);ctx.stroke();});});
  /* areas and lines */
  function series(vals,c){var g=ctx.createLinearGradient(0,p.t,0,p.t+ih);g.addColorStop(0,rgba(c,.26));g.addColorStop(1,rgba(c,0));
    ctx.beginPath();ctx.moveTo(X(0),Y(0));vals.forEach(function(v,i){ctx.lineTo(X(i),Y(v));});ctx.lineTo(X(240),Y(0));ctx.closePath();ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();vals.forEach(function(v,i){i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v));});
    ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=PANEL;ctx.lineWidth=4.5;ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.stroke();}
  series(m.sv,AMB); series(m.vv,CY);
  /* annotations */
  function pill(txt,x,y,c,align){ctx.font="600 11px "+SANS;var tw=ctx.measureText(txt).width+12,hh=18;
    var lx=align==="right"?x-tw:align==="center"?x-tw/2:x; lx=Math.max(p.l+2,Math.min(p.l+iw-tw-2,lx)); var ly=Math.max(p.t+2,Math.min(p.t+ih-hh-2,y-hh/2));
    ctx.fillStyle=PANEL;ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect?ctx.roundRect(lx,ly,tw,hh,9):ctx.rect(lx,ly,tw,hh);ctx.fill();ctx.stroke();
    ctx.fillStyle=INK;ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillText(txt,lx+6,ly+hh/2+.5);return [lx,ly,tw,hh];}
  function dot(i,vals,c){ctx.fillStyle=c;ctx.strokeStyle=PANEL;ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(i),Y(vals[i]),4.5,0,7);ctx.fill();ctx.stroke();}
  var iS=m.sv.indexOf(m.peakS), iV=m.vv.indexOf(m.peakV);
  dot(iS,m.sv,AMB); pill(T.cig+" "+T.peak+" "+m.peakS.toFixed(1),X(iS)-8,Y(m.peakS)-16,AMB,"right");
  if(Math.abs(Y(m.peakV)-Y(m.peakS))>22||Math.abs(X(iV)-X(iS))>160){dot(iV,m.vv,CY);pill(T.vape+" "+T.peak+" "+m.peakV.toFixed(1),X(iV)-8,Y(m.peakV)+18,CY,"right");}
  var sw=swing(m.sv,m.s);
  if(sw&&!narrow){var xb=X(sw.il)+10;
    ctx.strokeStyle=AMB;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X(sw.ih),Y(sw.hi));ctx.lineTo(xb+6,Y(sw.hi));ctx.moveTo(X(sw.il),Y(sw.lo));ctx.lineTo(xb+6,Y(sw.lo));
    ctx.moveTo(xb+3,Y(sw.hi));ctx.lineTo(xb+3,Y(sw.lo));ctx.stroke();
    ctx.fillStyle=AMB;ctx.beginPath();ctx.arc(X(sw.il),Y(sw.lo),3.2,0,7);ctx.fill();
    var sv2=swing(m.vv,m.v), lbl=T.swing+" "+(sw.hi-sw.lo).toFixed(2)+(sv2?"  ·  "+T.vape+" "+(sv2.hi-sv2.lo).toFixed(2):"");
    pill(lbl,X(sw.il)-4,Y(sw.lo)+(Y(sw.lo)>p.t+ih-60?-46:34),AMB,"right");
    ctx.fillStyle=MUT;ctx.font="10px "+SANS;ctx.textAlign="right";ctx.textBaseline="middle";
    ctx.fillText(T.trough,X(sw.il)-6,Y(sw.lo)+12);}
  /* overnight halving, drawn on the cigarette curve */
  var i23=Math.round((23-7)*10)+1, iH=Math.min(240,i23+Math.round(m.half*10));
  if(iH<240&&!narrow){var v23=m.sv[i23], vH=m.sv[iH];
    ctx.strokeStyle=MUT;ctx.setLineDash([3,3]);ctx.lineWidth=1;ctx.beginPath();
    ctx.moveTo(X(i23),Y(v23));ctx.lineTo(X(iH),Y(v23));ctx.lineTo(X(iH),Y(vH));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=MUT;ctx.font="10.5px "+SANS;ctx.textAlign="left";ctx.textBaseline="bottom";ctx.fillText(T.half(m.half.toFixed(1)),X(iH)+6,Y((v23+vH)/2)+4);}
  /* direct labels at the right edge */
  if(!narrow){var ends=[[Y(m.sv[240]),T.cig,AMB],[Y(m.vv[240]),T.vape,CY]].sort(function(a,b){return a[0]-b[0];});
    if(ends[1][0]-ends[0][0]<16){var mid=(ends[0][0]+ends[1][0])/2;ends[0][0]=mid-8;ends[1][0]=mid+8;}
    ctx.font="600 11.5px "+SANS;ctx.textAlign="left";ctx.textBaseline="middle";
    ends.forEach(function(e){ctx.fillStyle=e[2];ctx.fillText(e[1],p.l+iw+8,Math.min(e[0],p.t+ih-6)-10);});}
  /* hover */
  if(hover>=0){var x=X(hover);ctx.strokeStyle=INK;ctx.globalAlpha=.55;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(Math.round(x)+.5,p.t);ctx.lineTo(Math.round(x)+.5,p.t+ih);ctx.stroke();ctx.globalAlpha=1;
    dot(hover,m.sv,AMB);dot(hover,m.vv,CY);}
  /* readouts */
  $("peakS").textContent=m.peakS.toFixed(1);$("peakV").textContent=m.peakV.toFixed(1);$("aucS").textContent=m.aucS.toFixed(0);$("aucV").textContent=m.aucV.toFixed(0);
  $("doseOut").textContent=m.dose+T.mgday;$("cigsOut").textContent=$("cigs").value;$("vapesOut").textContent=$("vapes").value;
  $("ratioOut").textContent=m.ratio.toFixed(2)+"×";$("halfOut").textContent=(+$("half").value).toFixed(1)+" h";$("vapeDoseText").textContent=(m.dose*m.ratio).toFixed(1);
  var lc=$("legCig"),lv=$("legVape"); if(lc)lc.textContent=m.cigs+T.perday; if(lv)lv.textContent=m.vapes+T.perday;
  cv.setAttribute("aria-label",T.aria(m));
  showTip();
}
function showTip(){
  if(!tip)return; if(hover<0||!M||!G){tip.classList.remove("on");return;}
  var t=7+hover/10, s=M.sv[hover], v=M.vv[hover];
  tip.innerHTML='<div class="th">'+hhmm(t)+(t>=24?' <span>'+T.next+'</span>':'')+'</div>'+
    '<div class="tr"><span><i style="background:var(--nd-amber)"></i>'+T.cig+'</span><b>'+s.toFixed(2)+'</b></div>'+
    '<div class="tr"><span><i style="background:var(--nd-cyan)"></i>'+T.vape+'</span><b>'+v.toFixed(2)+'</b></div>'+
    '<div class="tr sub"><span>'+T.diff+'</span><b>'+(s-v>=0?"+":"")+(s-v).toFixed(2)+'</b></div>';
  tip.classList.add("on");
  var x=G.X(hover), tw=tip.offsetWidth||170, lx=x+14; if(lx+tw>G.w-4)lx=x-14-tw;
  tip.style.left=lx+"px"; tip.style.top=Math.max(6,Math.min(G.h-110,G.Y(Math.max(s,v))-30))+"px";
}
function idxAt(e){if(!G)return -1;var r=cv.getBoundingClientRect(),x=e.clientX-r.left;
  var i=Math.round((x-G.p.l)/G.iw*240);return i<0||i>240?-1:i;}
cv.addEventListener("pointermove",function(e){var i=idxAt(e);if(i!==hover){hover=i;draw();}});
cv.addEventListener("pointerleave",function(){hover=-1;draw();});
cv.addEventListener("keydown",function(e){
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){if(hover<0)hover=0;hover=Math.max(0,Math.min(240,hover+(e.key==="ArrowRight"?1:-1)*(e.shiftKey?10:2)));draw();e.preventDefault();}
  else if(e.key==="Escape"){hover=-1;draw();}});
cv.addEventListener("blur",function(){hover=-1;draw();});
els.forEach(function(id){$(id).addEventListener("input",draw);});
var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(draw,100);});
new MutationObserver(function(){draw();}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","style"]});
draw();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
})();
