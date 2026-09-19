'use strict';
(()=>{
const ja=document.documentElement.lang==='ja',T=(en,jp)=>ja?jp:en,TAU=2*Math.PI;
const fmt=x=>Math.abs(x)<1e-10?'0':Math.abs(x)>1e5||Math.abs(x)<.0001?x.toExponential(3):Number(x.toFixed(4)).toString();
const seq=(n,f)=>Array.from({length:n},(_,i)=>f(i));
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs={},text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
function rank2(matrix){if(!matrix.length)return 0;const a=matrix.map(r=>r.slice());let k=0;for(let j=0;j<a[0].length&&k<a.length;j++){let r=a.findIndex((row,i)=>i>=k&&row[j]);if(r<0)continue;[a[k],a[r]]=[a[r],a[k]];for(let i=0;i<a.length;i++)if(i!==k&&a[i][j])for(let q=j;q<a[i].length;q++)a[i][q]^=a[k][q];k++;}return k;}
function homology(v,edges,faces){const d1=seq(v,i=>edges.map(e=>Number(e.includes(i))));const d2=edges.map(e=>faces.map(f=>Number(e.every(i=>f.includes(i)))));const r1=rank2(d1),r2=rank2(d2);return [v-r1,edges.length-r1-r2,faces.length-r2];}
const gcd=(a,b)=>b?gcd(b,a%b):a;
function betaDensity(x,a,b){if((x===0&&a>1)||(x===1&&b>1))return 0;let log=0;for(let k=1;k<a+b;k++)log+=Math.log(k);for(let k=1;k<a;k++)log-=Math.log(k);for(let k=1;k<b;k++)log-=Math.log(k);return Math.exp(log+(a===1?0:(a-1)*Math.log(x))+(b===1?0:(b-1)*Math.log(1-x)));}
function logistic(r,x,n){const out=[x];for(let i=0;i<n;i++){x=r*x*(1-x);out.push(x);}return out;}
function ode(h){let t=0,a=1,b=1;const e=[[0,1]],r=[[0,1]];while(t<2-1e-12){const dt=Math.min(h,2-t),z=-5*dt;a*=1+z;b*=1+z+z*z/2+z**3/6+z**4/24;t+=dt;e.push([t,a]);r.push([t,b]);}return {e,r};}
function interpolation(n,cheb){const xs=seq(n+1,j=>cheb?Math.cos(j*Math.PI/n):-1+2*j/n),ys=xs.map(x=>1/(1+25*x*x)),w=xs.map((x,i)=>1/xs.reduce((a,y,j)=>i===j?a:a*(x-y),1));const f=x=>{let num=0,den=0;for(let i=0;i<=n;i++){if(Math.abs(x-xs[i])<1e-12)return ys[i];const q=w[i]/(x-xs[i]);num+=q*ys[i];den+=q;}return num/den;};return {xs,ys,f};}
window.MathLabs={rank2,homology,betaDensity,logistic,ode,interpolation,gcd};
function chart(host,domain,xlabel,ylabel,height=310,equal=false){
 const w=Math.max(260,equal?Math.min(640,host.clientWidth):host.clientWidth),h=equal?Math.max(height,Math.min(480,w*.8)):height,m={l:64,r:22,t:18,b:45};let [xmin,xmax,ymin,ymax]=domain;
 if(equal){const unit=Math.max((xmax-xmin)/(w-m.l-m.r),(ymax-ymin)/(h-m.t-m.b)),cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;xmin=cx-unit*(w-m.l-m.r)/2;xmax=cx+unit*(w-m.l-m.r)/2;ymin=cy-unit*(h-m.t-m.b)/2;ymax=cy+unit*(h-m.t-m.b)/2;}
 const X=x=>m.l+(x-xmin)/(xmax-xmin)*(w-m.l-m.r),Y=y=>h-m.b-(y-ymin)/(ymax-ymin)*(h-m.t-m.b),s=el('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':`${xlabel}; ${ylabel}`});host.append(s);if(equal){s.style.maxWidth='640px';s.style.margin='0 auto';}
 const uid='clip-'+(++chart.i);const defs=el('defs'),clip=el('clipPath',{id:uid});clip.append(el('rect',{x:m.l,y:m.t,width:w-m.l-m.r,height:h-m.t-m.b}));defs.append(clip);s.append(defs);
 const ticks=w<420?3:5;for(let i=0;i<ticks;i++){let xv=xmin+(xmax-xmin)*i/(ticks-1),yv=ymin+(ymax-ymin)*i/(ticks-1);s.append(el('line',{x1:X(xv),x2:X(xv),y1:m.t,y2:h-m.b,class:'grid'}),el('line',{x1:m.l,x2:w-m.r,y1:Y(yv),y2:Y(yv),class:'grid'}),el('text',{x:X(xv),y:h-m.b+20,'text-anchor':i===0?'start':i===ticks-1?'end':'middle'},Number(xv.toPrecision(3)).toString()),el('text',{x:m.l-8,y:Y(yv)+4,'text-anchor':'end'},Number(yv.toPrecision(3)).toString()));}
 s.append(el('rect',{x:m.l,y:m.t,width:w-m.l-m.r,height:h-m.t-m.b,class:'frame'}),el('text',{x:(w+m.l-m.r)/2,y:h-5,'text-anchor':'middle'},xlabel),el('text',{transform:`translate(13 ${(h-m.b+m.t)/2}) rotate(-90)`,'text-anchor':'middle'},ylabel));
 const g=el('g',{'clip-path':`url(#${uid})`});s.append(g);
 const path=(pts,cls='curve',close=false)=>{const p=el('path',{d:pts.map((v,i)=>(i?'L':'M')+X(v[0]).toFixed(3)+','+Y(v[1]).toFixed(3)).join(' ')+(close?' Z':''),class:cls});g.append(p);return p;};
 const dot=(x,y,cls='point',r=4)=>g.append(el('circle',{cx:X(x),cy:Y(y),r,class:cls}));
 const text=(x,y,label)=>g.append(el('text',{x:X(x)+6,y:Y(y)-7},label));
 return {path,dot,text,s,g,X,Y,line:(a,b,cls='curve')=>path([a,b],cls)};
}chart.i=0;
const sample=(lo,hi,n,f)=>seq(n+1,i=>{const x=lo+(hi-lo)*i/n;return [x,f(x)];});
const circle=(rx=1,ry=1,angle=0)=>seq(181,i=>{const a=TAU*i/180,x=rx*Math.cos(a),y=ry*Math.sin(a);return [Math.cos(angle)*x-Math.sin(angle)*y,Math.sin(angle)*x+Math.cos(angle)*y];});
function label(host,text){const p=document.createElement('p');p.className='caption';p.textContent=text;host.append(p);}

function diagram(host,name,height=300){
 const w=Math.max(260,host.clientWidth),h=height,scale=Math.min((w-55)/3,(h-55)/3),X=x=>w/2+x*scale,Y=y=>h/2-y*scale,s=el('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':name});host.append(s);
 const g=el('g');s.append(g);const path=(pts,cls='curve',close=false)=>{const p=el('path',{d:pts.map((v,i)=>(i?'L':'M')+X(v[0])+','+Y(v[1])).join(' ')+(close?' Z':''),class:cls});g.append(p);return p;};
 return {s,g,X,Y,path,line:(a,b,c='curve')=>path([a,b],c),dot:(x,y,c='point',r=4)=>g.append(el('circle',{cx:X(x),cy:Y(y),r,class:c})),text:(x,y,t)=>g.append(el('text',{x:X(x)+7,y:Y(y)-8},t))};
}

function render(section){const host=section.querySelector('.plot'),out=section.querySelector('.readout'),id=section.dataset.lab,v={};section.querySelectorAll('input').forEach(e=>{v[e.dataset.key]=Number(e.value);e.previousElementSibling.textContent=e.value;});host.replaceChildren();let result='';const rad=d=>d*Math.PI/180;
 if(['basis','det'].includes(id)){
 const a=v.a,b=v.b||0,c=v.c,d=v.d,det=a*d-b*c,trans=([x,y])=>[a*x+c*y,b*x+d*y];const ch=chart(host,[-3,3,-3,3],'x','y',330,true);
 for(let i=-2;i<=2;i++){ch.line(trans([-2,i]),trans([2,i]),'second');ch.line(trans([i,-2]),trans([i,2]),'second');}
 ch.path([[0,0],[1,0],[1,1],[0,1]].map(trans),'area',true);ch.line([0,0],[a,b]);ch.line([0,0],[c,d]);ch.text(a,b,'b₁');ch.text(c,d,'b₂');
 if(id==='basis'){
 for(const [x,y,kx,ky] of [[a,b,'a','b'],[c,d,'c','d']]){
  const handle=el('circle',{cx:ch.X(x),cy:ch.Y(y),r:11,class:'basis-handle','aria-hidden':'true'});ch.g.append(handle);
  handle.addEventListener('pointerdown',event=>{event.preventDefault();const bounds=ch.s.getBoundingClientRect(),view=ch.s.viewBox.baseVal;const move=e=>{const px=(e.clientX-bounds.left)*view.width/bounds.width,py=(e.clientY-bounds.top)*view.height/bounds.height;const coords=[(px-ch.X(0))/(ch.X(1)-ch.X(0)),(py-ch.Y(0))/(ch.Y(1)-ch.Y(0))];[kx,ky].forEach((key,i)=>{const input=section.querySelector('[data-key="'+key+'"]');input.value=String(Math.round(Math.max(-2,Math.min(2,coords[i]))*10)/10);input.dispatchEvent(new Event('input',{bubbles:true}));});};const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);};document.addEventListener('pointermove',move);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);});
 }
 ch.dot(1,1);ch.text(1,1,'v');result=Math.abs(det)<1e-9?T('Singular: no unique coordinate system.','特異：座標系は一意に定まりません。'):T('Coordinates in B: ','基底 B での座標：')+`(${fmt((d-c)/det)}, ${fmt((a-b)/det)})`;}else result=`det A = ${fmt(det)} · ${T('Area','面積')} = ${fmt(Math.abs(det))} · ${T('Rank','階数')} = ${Math.abs(det)>1e-9?2:Math.abs(a)+Math.abs(b)+Math.abs(c)+Math.abs(d)>1e-9?1:0}`;
 }else if(id==='eigen'){
 const q=rad(v.angle),co=Math.cos(q),si=Math.sin(q),pts=seq(v.n+1,n=>{const a=(co+si)*v.l1**n,b=(co-si)*v.l2**n;return [co*a-si*b,si*a+co*b];}),extent=Math.max(2,...pts.flat().map(Math.abs))*1.15,ch=chart(host,[-extent,extent,-extent,extent],'x','y',330,true);ch.line([-extent*co,-extent*si],[extent*co,extent*si],'second');ch.line([extent*si,-extent*co],[-extent*si,extent*co],'second');ch.path(pts);pts.forEach((p,i)=>{ch.dot(...p);if(i===0||i===pts.length-1)ch.text(...p,String(i));});result=T('Final vector: ','最後のベクトル：')+pts.at(-1).map(fmt).join(', ');
 }else if(id==='projection'){
 const a=rad(v.angle),u=[Math.cos(a),Math.sin(a)],dot=2*u[0]+u[1],p=u.map(x=>x*dot),ch=chart(host,[-3,3,-2,3],'x','y',330,true);ch.line(u.map(x=>-4*x),u.map(x=>4*x),'second');ch.line([0,0],[2,1]);ch.line([2,1],p,'third');ch.dot(...p);ch.text(...p,T('projection','射影'));result=T('Squared residual: ','残差の二乗：')+fmt((2-p[0])**2+(1-p[1])**2)+T(' · residual · direction = ',' · 残差と方向の内積 = ')+fmt((2-p[0])*u[0]+(1-p[1])*u[1]);
 }else if(id==='svd'){
 const a=rad(v.angle),b=rad(v.input),s2=v.rank===1?0:v.s2,ch=chart(host,[-3.5,3.5,-3.5,3.5],'x','y',330,true);ch.path(circle(),'second');ch.path(circle(v.s1,s2,a));const pts=seq(9,i=>{let t=TAU*i/8-b,x=v.s1*Math.cos(t),y=s2*Math.sin(t);return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];});pts.forEach((p,i)=>{ch.dot(...p);if(i<8)ch.text(...p,String(i));});result=`σ₁ = ${v.s1} · σ₂ = ${v.s2} · ${T('Approximation error','近似誤差')} = ${v.rank===1?v.s2:0}`;label(host,T('Dashed: input circle. Solid: output. Numbered samples reveal the input rotation.','破線：入力の円。実線：出力。番号付きの標本点で入力の回転がわかります。'));
 }else if(id==='harmonics'){
 const f=x=>{let y=0;for(let k=0;k<v.n;k++)y+=Math.sin((2*k+1)*x)/(2*k+1);return 4*y/Math.PI;},ch=chart(host,[-Math.PI,Math.PI,-1.6,1.6],'x',T('Amplitude','振幅'));ch.path([[-Math.PI,-1],[0,-1],[0,1],[Math.PI,1]],'second');const pts=sample(-Math.PI,Math.PI,800,f);ch.path(pts);result=T('Largest displayed value: ','表示範囲の最大値：')+fmt(Math.max(...pts.map(p=>p[1])))+T(' · value at the jump: 0',' · 跳躍点の値：0');
 }else if(id==='convolution'){
 const ch=chart(host,[-2,2,-.1,1.3],T('Position / displacement','位置／ずれ'),T('Height / overlap','高さ／重なり'));ch.path([[-.5,0],[-.5,1],[.5,1],[.5,0]],'second');ch.path([[v.t-.5,0],[v.t-.5,1],[v.t+.5,1],[v.t+.5,0]]);let l=Math.max(-.5,v.t-.5),r=Math.min(.5,v.t+.5);if(l<r)ch.path([[l,0],[r,0],[r,1],[l,1]],'area',true);ch.path([[-1,0],[0,1],[1,0]],'third');ch.dot(v.t,Math.max(0,1-Math.abs(v.t)));result=T('Overlap integral = ','重なりの積分 = ')+fmt(Math.max(0,1-Math.abs(v.t)));
 }else if(id==='sampling'){
 const alias=Math.abs(((v.f+v.fs/2)%v.fs)-v.fs/2),ch=chart(host,[0,1,-1.3,1.3],T('Time (s)','時間（秒）'),T('Amplitude','振幅'));ch.path(sample(0,1,600,x=>Math.cos(TAU*v.f*x)));ch.path(sample(0,1,600,x=>Math.cos(TAU*alias*x)),'second');for(let n=0;n<=v.fs;n++)ch.dot(n/v.fs,Math.cos(TAU*v.f*n/v.fs));result=T('Folded frequency: ','折り返し周波数：')+fmt(alias)+' Hz';
 }else if(id==='phase'){
 const pts=seq(181,i=>{let t=i/30,f=Math.exp(v.a*t);return [f*(v.x*Math.cos(t)-v.y*Math.sin(t)),f*(v.x*Math.sin(t)+v.y*Math.cos(t))];}),r=Math.max(2,...pts.flat().map(Math.abs))*1.1,ch=chart(host,[-r,r,-r,r],'x','y',330,true);
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){let x=i*r/4,y=j*r/4,dx=v.a*x-y,dy=x+v.a*y,n=Math.hypot(dx,dy);if(n){let ex=x+dx/n*r*.12,ey=y+dy/n*r*.12;ch.line([x,y],[ex,ey],'second');const ux=dx/n,uy=dy/n,head=r*.035;ch.path([[ex-head*ux+head*.5*uy,ey-head*uy-head*.5*ux],[ex,ey],[ex-head*ux-head*.5*uy,ey-head*uy+head*.5*ux]],'second');}}ch.path(pts);ch.dot(v.x,v.y);result=v.a<0?T('Attracting spiral','吸引するらせん'):v.a>0?T('Repelling spiral','反発するらせん'):T('Center: constant radius','中心：半径一定');
 }else if(id==='bifurcation'){
 const ch=chart(host,[-2,2,-4,2.5],'x',T('Velocity','速度'));ch.path(sample(-2,2,150,x=>v.mu-x*x));ch.line([-2,0],[2,0],'second');if(v.mu>=0){let r=Math.sqrt(v.mu);ch.dot(-r,0);ch.dot(r,0);ch.text(r,0,v.mu===0?T('semistable','半安定'):T('attracting','吸引'));if(r>0)ch.text(-r,0,T('repelling','反発'));}for(let x=-1.8;x<=1.8;x+=.4){let sign=Math.sign(v.mu-x*x);ch.text(x,-.4,sign>0?'→':'←');}result=v.mu<0?T('No equilibrium','平衡点なし'):v.mu===0?T('One semistable equilibrium at 0','0に半安定な平衡点'):T('Repelling / attracting: ','反発／吸引：')+`${fmt(-Math.sqrt(v.mu))} / ${fmt(Math.sqrt(v.mu))}`;
 }else if(id==='chaos'){
 const a=logistic(v.r,v.x,60),b=logistic(v.r,v.x+1e-6,60),ch=chart(host,[0,60,0,1],T('Iteration n','反復 n'),'xₙ',280);ch.path(a.map((x,i)=>[i,x]));ch.path(b.map((x,i)=>[i,x]),'second');const bif=chart(host,[2,4,0,1],'r',T('Long-run x','過渡後の x'),240);for(let r=2;r<=4;r+=.006){const xs=logistic(r,.231,240);xs.slice(-30).forEach(x=>bif.dot(r,x,'point',.6));}bif.line([v.r,0],[v.r,1],'second');result=T('Separation after 60 steps: ','60ステップ後の差：')+fmt(Math.abs(a[60]-b[60]));
 }else if(id==='descent'){
 const pts=seq(13,i=>[2*(1-v.eta)**i,1.5*(1-v.eta*v.k)**i]),r=Math.max(3,...pts.flat().map(Math.abs))*1.08,ch=chart(host,[-r,r,-r,r],'x','y',330,true);[1,2,4,8].forEach(c=>ch.path(circle(Math.sqrt(c),Math.sqrt(c/v.k)),'second'));ch.path(pts);pts.forEach(p=>ch.dot(...p));ch.line([2,1.5],[0,0],'third');result=T('Convergence requires 0 < η < ','収束条件：0 < η < ')+fmt(2/v.k)+T(' · after 12 steps, f = ',' · 12ステップ後の f = ')+fmt((pts[12][0]**2+v.k*pts[12][1]**2)/2);
 }else if(id==='constraint'){
 const ch=chart(host,[-3.5,3.5,-3.5,3.5],'x','y',330,true);[.5,1,2,3].forEach(r=>ch.path(circle(r,r),'second'));ch.line([-4,v.b+4],[4,v.b-4]);ch.dot(v.b/2,v.b/2);ch.text(v.b/2,v.b/2,T('optimum','最適点'));result=`(x*, y*) = (${fmt(v.b/2)}, ${fmt(v.b/2)}) · f* = ${fmt(v.b*v.b/2)}`;
 }else if(id==='duality'){
 const ch=chart(host,[-3.2,3.2,-5,9],'b',T('Optimal value','最適値'));ch.path(sample(-3,3,150,x=>x*x/2));ch.path(sample(-3,3,20,x=>v.b*v.b/2+v.b*(x-v.b)),'second');ch.dot(v.b,v.b*v.b/2);result=`λ* = ${fmt(v.b)} · ${T('Dual value','双対値')} = ${fmt(v.lambda*v.b-v.lambda*v.lambda/2)} · ${T('Gap','ギャップ')} = ${fmt((v.b-v.lambda)**2/2)}`;
 }else if(id==='bayes'){
 const a=v.alpha+v.h,b=v.beta+v.t,post=sample(0,1,250,x=>betaDensity(x,a,b)),prior=sample(0,1,250,x=>betaDensity(x,v.alpha,v.beta)),ymax=Math.max(...post.concat(prior).map(p=>p[1]))*1.1,ch=chart(host,[0,1,0,ymax],'p',T('Density','密度'));ch.path(prior,'second');ch.path(post);result=`Beta(${a}, ${b}) · ${T('Posterior mean','事後平均')} = ${fmt(a/(a+b))}`;
 }else if(id==='clt'){
 const sd=Math.sqrt(v.n*v.p*(1-v.p)),pts=[];let prob=(1-v.p)**v.n;for(let k=0;k<=v.n;k++){if(k)prob*=((v.n-k+1)/k)*(v.p/(1-v.p));pts.push([(k-v.n*v.p)/sd,prob*sd]);}const ch=chart(host,[-4.5,4.5,0,Math.max(.45,...pts.map(p=>p[1]))*1.1],'z',T('Density scale','密度尺度'));pts.forEach(([x,y])=>ch.path([[x-.45/sd,0],[x-.45/sd,y],[x+.45/sd,y],[x+.45/sd,0]],'area',true));ch.path(sample(-4.5,4.5,250,x=>Math.exp(-x*x/2)/Math.sqrt(TAU)),'second');result=T('Sum mean / variance: ','和の平均／分散：')+`${fmt(v.n*v.p)} / ${fmt(sd*sd)}`;
 }else if(id==='conditional'){
 const ch=chart(host,[-.1,1.1,-.1,1.1],T('Sample-space x','標本空間 x'),T('Sample-space y','標本空間 y'),320,true);ch.path([[0,0],[1,0],[1,1],[0,1]],'second',true);ch.path([[0,0],[v.b,0],[v.b,v.inside],[0,v.inside]],'area',true);ch.path([[v.b,0],[1,0],[1,v.outside],[v.b,v.outside]],'area',true);ch.line([v.b,0],[v.b,1],'third');ch.text(v.b/2,.85,'B');ch.text((1+v.b)/2,.85,'Bᶜ');const pa=v.b*v.inside+(1-v.b)*v.outside;result=`P(A) = ${fmt(pa)} · P(A ∩ B) = ${fmt(v.b*v.inside)} · P(B | A) = ${pa?fmt(v.b*v.inside/pa):T('undefined','未定義')}`;
 }else if(['compose','orbit'].includes(id)){
 const n=v.n,k=v.k%n,verts=seq(n,i=>[Math.cos(TAU*i/n),Math.sin(TAU*i/n)]);
 if(id==='compose'){
 const wrap=document.createElement('div');wrap.className='symmetry-pair';host.append(wrap);
 for(let j=0;j<2;j++){const panel=document.createElement('div');wrap.append(panel);label(panel,j===0?T('Reflect, then rotate: rᵏ ∘ s','反転してから回転：rᵏ ∘ s'):T('Rotate, then reflect: s ∘ rᵏ','回転してから反転：s ∘ rᵏ'));const ch=diagram(panel,T('Labeled polygon','番号付き多角形'),265);ch.path(verts,'second',true);seq(n,i=>{const target=((j===0?k-i:-i-k)%n+n)%n,p=verts[target];ch.dot(...p);ch.text(...p,String(i));});}
 result=(2*k)%n===0?T('These compositions agree.','この2つの合成は一致します。'):T('These compositions differ.','この2つの合成は異なります。');}
 else{const ch=diagram(host,T('Orbit of vertex zero','頂点0の軌道'));ch.path(verts,'second',true);const orbit=new Set(seq(n/gcd(n,k),j=>j*k%n));verts.forEach((p,i)=>{if(orbit.has(i))ch.dot(...p);else ch.g.append(el('circle',{cx:ch.X(p[0]),cy:ch.Y(p[1]),r:4,fill:'none',stroke:'currentColor'}));ch.text(...p,String(i));});result=T('Orbit of 0: ','0の軌道：')+`{${[...orbit].sort((a,b)=>a-b).join(', ')}} · `+T('Cosets: ','剰余類の数：')+gcd(n,k);}
 }else if(id==='table'){
 const a=v.a%v.n,b=v.b%v.n;let html='<table class="group-table"><caption>'+T('Addition modulo ','法による加法：')+v.n+'</caption><thead><tr><th>+</th>';for(let j=0;j<v.n;j++)html+=`<th scope="col">${j}</th>`;html+='</tr></thead><tbody>';for(let i=0;i<v.n;i++){html+=`<tr><th scope="row">${i}</th>`;for(let j=0;j<v.n;j++)html+=`<td class="${i===a&&j===b?'selected':''}">${(i+j)%v.n}</td>`;html+='</tr>';}host.innerHTML=html+'</tbody></table>';result=`${a} + ${b} ≡ ${(a+b)%v.n} (mod ${v.n}) · `+T('Inverse of ','逆元：')+`${a} → ${(v.n-a)%v.n}`;
 }else if(['complex','filtration','euler'].includes(id)){
 let pts,edges=[],faces=[];
 if(id==='filtration'){pts=seq(8,i=>[Math.cos(TAU*i/8),Math.sin(TAU*i/8)]);for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(Math.hypot(pts[i][0]-pts[j][0],pts[i][1]-pts[j][1])<=v.eps+1e-9)edges.push([i,j]);for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)for(let k=j+1;k<8;k++)if([[i,j],[i,k],[j,k]].every(p=>edges.some(e=>e[0]===p[0]&&e[1]===p[1])))faces.push([i,j,k]);}
 else if(id==='complex'){pts=[[-1,-.7],[1,-.7],[0,1]];edges=[[0,1],[1,2],[0,2]].slice(0,Math.min(3,v.stage));faces=v.stage===4?[[0,1,2]]:[];}
 else if(v.solid){pts=[[-1,-.8],[1,-.8],[0,1],[0,0]];edges=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];}
 else{pts=[[-1,-.7],[1,-.7],[0,1]];edges=[[0,1],[1,2],[0,2]];faces=[[0,1,2]];}
 const ch=diagram(host,T('Simplicial complex','単体複体'),320);faces.forEach(f=>ch.path(f.map(i=>pts[i]),'area',true));edges.forEach(e=>ch.line(pts[e[0]],pts[e[1]]));pts.forEach((p,i)=>{ch.dot(...p);ch.text(...p,String(i));});const b=homology(pts.length,edges,faces);result=`V = ${pts.length} · E = ${edges.length} · F = ${faces.length} · β₀ = ${b[0]} · β₁ = ${b[1]}`+(id==='euler'?` · β₂ = ${b[2]} · χ = ${pts.length-edges.length+faces.length}`:'');
 }else if(id==='ode'){
 const {e,r}=ode(v.h),all=e.concat(r).map(p=>p[1]),lo=Math.min(0,...all),hi=Math.max(1,...all),pad=.08*(hi-lo),ch=chart(host,[0,2,lo-pad,hi+pad],T('Time t','時刻 t'),'y');ch.path(sample(0,2,200,t=>Math.exp(-5*t)),'third');ch.path(e);ch.path(r,'second');e.forEach(p=>ch.dot(...p));label(host,T('Solid: Euler · dashed: RK4 · dotted: exact. The last step is shortened to end at t=2.','実線：オイラー法・破線：RK4・点線：厳密解。最後の刻みを縮めて t=2 に合わせます。'));result=T('Error at t=2 — Euler: ','t=2の誤差 — オイラー：')+fmt(Math.abs(e.at(-1)[1]-Math.exp(-10)))+' · RK4: '+fmt(Math.abs(r.at(-1)[1]-Math.exp(-10)));
 }else if(id==='cancellation'){
 const direct=x=>(Math.sqrt(1+x)-1)/x,stable=x=>1/(Math.sqrt(1+x)+1),ch=chart(host,[1,17,-.05,.85],T('Exponent e','指数 e'),T('Computed value','計算値'));ch.path(sample(1,17,250,e=>direct(10**-e)));ch.path(sample(1,17,250,e=>stable(10**-e)),'second');const x=10**-v.exponent;ch.dot(v.exponent,direct(x));result=T('Direct / stable: ','直接／安定な式：')+`${fmt(direct(x))} / ${fmt(stable(x))} · `+T('Relative difference: ','相対差：')+fmt(Math.abs(direct(x)-stable(x))/stable(x));
 }else if(id==='interpolation'){
 const {xs,ys,f}=interpolation(v.n,v.cheb),pts=sample(-1,1,500,f),min=Math.min(-.1,...pts.map(p=>p[1])),max=Math.max(1.1,...pts.map(p=>p[1])),pad=(max-min)*.07,ch=chart(host,[-1.05,1.05,min-pad,max+pad],'x','y');ch.path(sample(-1,1,500,x=>1/(1+25*x*x)),'second');ch.path(pts);xs.forEach((x,i)=>ch.dot(x,ys[i]));result=T('Sampled maximum error: ','標本上の最大誤差：')+fmt(Math.max(...pts.map(([x,y])=>Math.abs(y-1/(1+25*x*x)))));
 }
 const legends={basis:[['Transformed grid','変換した格子']],det:[['Transformed grid','変換した格子']],eigen:[['Eigenvector directions','固有ベクトルの方向']],projection:[['Projection line','射影する直線'],['Residual','残差']],harmonics:[['Square wave','矩形波']],convolution:[['Fixed pulse','固定パルス'],['Convolution','畳み込み']],sampling:[['Aliased cosine','折り返した余弦波']],chaos:[['Perturbed orbit / selected parameter','摂動した軌道／選択したパラメータ']],descent:[['Level sets','等高線'],['Newton step','ニュートンステップ']],constraint:[['Objective contours','目的関数の等高線']],duality:[['Tangent','接線']],bayes:[['Prior density','事前密度']],clt:[['Standard normal','標準正規分布']],cancellation:[['Stable expression','安定な式']],interpolation:[['True function','元の関数']]};
 if(legends[id]){const legend=document.createElement('div');legend.className='plot-legend';const main=document.createElement('span');main.innerHTML='<i class="legend-solid"></i>'+T(({basis:'Basis vectors',det:'Transformed square',eigen:'Orbit',projection:'Vector',harmonics:'Partial sum',convolution:'Moving pulse',sampling:'Original cosine',chaos:'Original orbit',descent:'Gradient steps',constraint:'Constraint',duality:'Optimal value',bayes:'Posterior',clt:'Standardized binomial',cancellation:'Direct expression',interpolation:'Interpolant'})[id]||'Experiment',({basis:'基底ベクトル',det:'変換した正方形',eigen:'軌道',projection:'ベクトル',harmonics:'部分和',convolution:'動くパルス',sampling:'元の余弦波',chaos:'元の軌道',descent:'勾配ステップ',constraint:'制約',duality:'最適値',bayes:'事後分布',clt:'標準化した二項分布',cancellation:'直接の式',interpolation:'補間多項式'})[id]||'実験');legend.append(main);legends[id].forEach((a,i)=>{const item=document.createElement('span');const mark=document.createElement('i');mark.className=i?'legend-dotted':'legend-dashed';item.append(mark,document.createTextNode(T(...a)));legend.append(item);});host.append(legend);}
 out.textContent=result;
 host.setAttribute('aria-label',section.querySelector('h2').textContent+'. '+result);
}
// Reset is local to one experiment and also clears its shareable parameters.
for(const section of document.querySelectorAll('[data-lab]')){const button=document.createElement('button');button.type='button';button.className='reset-lab';button.textContent=T('Reset experiment','実験をリセット');button.addEventListener('click',()=>{const url=new URL(location.href);section.querySelectorAll('input').forEach(input=>{input.value=input.defaultValue;url.searchParams.delete(section.id+'.'+input.dataset.key);});history.replaceState(null,'',url);render(section);syncLanguages();});section.querySelector('.controls').after(button);}
const params=new URLSearchParams(location.search);
const sections=[...document.querySelectorAll('[data-lab]')];
for(const section of sections){for(const input of section.querySelectorAll('input')){const key=section.id+'.'+input.dataset.key;if(params.has(key)){const x=Number(params.get(key));if(Number.isFinite(x))input.value=String(Math.min(Number(input.max),Math.max(Number(input.min),x)));}input.addEventListener('input',()=>{render(section);const url=new URL(location.href);url.searchParams.set(key,input.value);history.replaceState(null,'',url);syncLanguages();});}render(section);}
function syncLanguages(){document.querySelectorAll('a[hreflang]').forEach(a=>{const u=new URL(a.href);u.search=location.search;u.hash=location.hash;a.href=u.href;});}
syncLanguages();window.addEventListener('hashchange',syncLanguages);
let resizeTimer,lastWidth=document.querySelector('.math-wrap').clientWidth;new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width===lastWidth)return;lastWidth=width;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>sections.forEach(render),80);}).observe(document.querySelector('.math-wrap'));
for(const node of document.querySelectorAll('[data-tex]')){if(window.katex)window.katex.render(node.dataset.tex,node,{displayMode:true,throwOnError:true});}
})();
