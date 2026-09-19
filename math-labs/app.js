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
 const surface=window.MathExperience?.createSurface(host,{domain,xlabel,ylabel,height,equal,label:`${xlabel}; ${ylabel}`,description:`${xlabel}; ${ylabel}`}) || (()=>{throw new Error('MathExperience renderer unavailable');})();
 return surface;
}
const sample=(lo,hi,n,f)=>seq(n+1,i=>{const x=lo+(hi-lo)*i/n;return [x,f(x)];});
const circle=(rx=1,ry=1,angle=0)=>seq(181,i=>{const a=TAU*i/180,x=rx*Math.cos(a),y=ry*Math.sin(a);return [Math.cos(angle)*x-Math.sin(angle)*y,Math.sin(angle)*x+Math.cos(angle)*y];});
function label(host,text){const p=document.createElement('p');p.className='caption';p.textContent=text;host.append(p);}

function diagram(host,name,height=300){
 const surface=window.MathExperience?.createDiagram(host,{name,height,description:name}) || (()=>{throw new Error('MathExperience renderer unavailable');})();
 return surface;
}

async function bloch3d(host,theta,phi){
 if(!host.__bloch){
  host.__bloch={loading:true};
  try{const THREE=await import('/vendor/three/r186/build/three.module.js');const w=Math.max(260,host.clientWidth||640),h=300;const scene=new THREE.Scene();scene.background=new THREE.Color(0x101827);const camera=new THREE.PerspectiveCamera(35,w/h,.1,100);camera.position.set(2.4,1.8,2.8);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(w,h,false);renderer.domElement.className='bloch-canvas';renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive Bloch sphere');host.replaceChildren(renderer.domElement);const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.MeshBasicMaterial({color:0x4f83ff,wireframe:true,transparent:true,opacity:.38}));scene.add(sphere);const axes=new THREE.AxesHelper(1.25);scene.add(axes);const mat=new THREE.MeshStandardMaterial({color:0xffc857,emissive:0x442200});const tip=new THREE.Mesh(new THREE.SphereGeometry(.07,16,10),mat);const line=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xffc857}));scene.add(tip,line);scene.add(new THREE.HemisphereLight(0xffffff,0x334466,2));const update=(t,p)=>{const x=Math.sin(t)*Math.cos(p),y=Math.cos(t),z=Math.sin(t)*Math.sin(p);tip.position.set(x,y,z);line.geometry.setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(x,y,z)]);};host.__bloch.update=update;host.__bloch.renderer=renderer;host.__bloch.camera=camera;host.__bloch.scene=scene;host.__bloch.drag={x:0,y:0,down:false};renderer.domElement.addEventListener('pointerdown',e=>{host.__bloch.drag.down=true;host.__bloch.drag.x=e.clientX;host.__bloch.drag.y=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!host.__bloch.drag.down)return;camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),(e.clientX-host.__bloch.drag.x)*.01);host.__bloch.drag.x=e.clientX;host.__bloch.drag.y=e.clientY;camera.lookAt(0,0,0);renderer.render(scene,camera)});renderer.domElement.addEventListener('pointerup',()=>host.__bloch.drag.down=false);const loop=()=>{if(!document.hidden){renderer.render(scene,camera)}requestAnimationFrame(loop)};loop();}catch(e){host.__bloch={failed:true};host.textContent='3D renderer unavailable; use the equation and controls above.';}}
 if(host.__bloch.update)host.__bloch.update(theta,phi);
}

function render(section){const host=section.querySelector('.plot'),out=section.querySelector('.readout'),id=section.dataset.lab,v={};section.querySelectorAll('input').forEach(e=>{v[e.dataset.key]=Number(e.value);e.previousElementSibling.textContent=e.value;});host.replaceChildren();let result='';const rad=d=>d*Math.PI/180;
 if(['basis','det'].includes(id)){
 const a=v.a,b=v.b||0,c=v.c,d=v.d,det=a*d-b*c,trans=([x,y])=>[a*x+c*y,b*x+d*y];const ch=chart(host,[-3,3,-3,3],'x','y',330,true);
 for(let i=-2;i<=2;i++){ch.line(trans([-2,i]),trans([2,i]),'second');ch.line(trans([i,-2]),trans([i,2]),'second');}
 ch.path([[0,0],[1,0],[1,1],[0,1]].map(trans),'area',true);ch.line([0,0],[a,b]);ch.line([0,0],[c,d]);ch.text(a,b,'b₁');ch.text(c,d,'b₂');
 if(id==='basis'){
 for(const [x,y,kx,ky] of [[a,b,'a','b'],[c,d,'c','d']]){
  const handle=el('circle',{cx:ch.X(x),cy:ch.Y(y),r:11,class:'basis-handle',tabindex:'0',role:'slider','aria-label':`Basis vector ${kx}${ky}`,'aria-valuemin':'-2','aria-valuemax':'2','aria-valuenow':String(x)});ch.g.append(handle);
  const setVector=(nextX,nextY)=>{[[kx,nextX],[ky,nextY]].forEach(([key,value])=>{const input=section.querySelector('[data-key="'+key+'"]');input.value=String(Math.round(Math.max(-2,Math.min(2,value))*10)/10);input.dispatchEvent(new Event('input',{bubbles:true}));});};
  handle.addEventListener('keydown',event=>{const step=event.shiftKey?.1:.1;if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();setVector(x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),y+(event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0));});
  handle.addEventListener('pointerdown',event=>{event.preventDefault();const bounds=ch.s.getBoundingClientRect(),view=ch.s.viewBox.baseVal;const move=e=>{const px=(e.clientX-bounds.left)*view.width/bounds.width,py=(e.clientY-bounds.top)*view.height/bounds.height;const coords=[(px-ch.X(0))/(ch.X(1)-ch.X(0)),(py-ch.Y(0))/(ch.Y(1)-ch.Y(0))];setVector(coords[0],coords[1]);};const end=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',end);document.removeEventListener('pointercancel',end);};document.addEventListener('pointermove',move);document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);});
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
 }else if(id==='modular'){
 const n=v.n,ch=chart(host,[-1,n,-1,1],'residue','phase',260);for(let i=0;i<n;i++){const a=TAU*i/n;ch.dot(i,0,'point',7);ch.text(i,0,String(i));ch.line([i,0],[i+((v.a-v.b)%n+n)%n,0],'second');}result=`${v.a} ≡ ${v.b} (mod ${n}) · ${T('difference','差')} = ${((v.a-v.b)%n+n)%n}`;
 }else if(id==='sieve'){
 const lim=v.limit,ch=chart(host,[1,lim,0,1],'integer','prime');for(let x=2;x<=lim;x++){const prime=Array.from({length:Math.floor(Math.sqrt(x))-1},(_,i)=>i+2).every(d=>x%d);ch.dot(x,prime?1:0,prime?'point':'second',prime?5:3);if(prime)ch.text(x,1,String(x));}result=T('Primes shown: ','表示した素数：')+Array.from({length:lim-1},(_,i)=>i+2).filter(x=>Array.from({length:Math.floor(Math.sqrt(x))-1},(_,i)=>i+2).every(d=>x%d)).length;
 }else if(id==='rsa'){
 const N=v.p*v.q,e=3,pts=seq(N-1,m=>[m,Math.pow(m,e)%N]),ch=chart(host,[0,N,0,N],'message','cipher',280);pts.forEach(p=>ch.dot(...p,'point',3));ch.dot(v.m,Math.pow(v.m,e)%N,'third',7);result=`N = ${N} · ${T('cipher','暗号')} = ${Math.pow(v.m,e)%N}`;
 }else if(id==='shortest'){
 const d=v.shortcut?2:3,w=v.traffic,ch=chart(host,[-.5,2.5,-.5,1.5],'x','y',260,true);const pts=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]];[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5],[0,4],[1,5]].forEach(([a,b],i)=>ch.line(pts[a],pts[b],(v.shortcut&&i===7)||(i===0||i===1)?'third':'second'));pts.forEach((p,i)=>{ch.dot(...p,'point',6);ch.text(...p,String(i));});result=T('Shortest route length: ','最短経路長：')+(v.shortcut?2:3)+T(' · traffic weight ',' · 混雑重み ')+w;
 }else if(id==='spanning'){
 const ch=chart(host,[-.5,2.5,-.5,1.5],'x','y',260,true),pts=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]];[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5],[0,4],[1,5]].forEach(([a,b],i)=>ch.line(pts[a],pts[b],i<5?'third':'second'));pts.forEach((p,i)=>{ch.dot(...p,'point',6);ch.text(...p,String(i));});result=T('Tree edges: ','木の辺：')+5+T(' · candidate edge weight ',' · 候補辺の重み ')+v.w;
 }else if(id==='centrality'){
 const ch=chart(host,[-.5,2.5,-.5,1.5],'x','y',260,true),pts=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]];[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5],[0,4],[1,5]].forEach(([a,b])=>ch.line(pts[a],pts[b],'second'));pts.forEach((p,i)=>{const r=i===1?6+v.hub:4;ch.dot(...p,'point',r);ch.text(...p,String(i));});result=T('Bridge centrality: ','橋の中心性：')+v.bridge+T(' · hub degree: ',' · ハブ次数：')+v.hub;
 }else if(id==='heat'){
 const pts=seq(100,i=>{const x=i/99;return [x,.5+.5*Math.exp(-v.kappa*v.time)*Math.sin(Math.PI*x)]}),ch=chart(host,[0,1,0,1.1],'position','temperature');ch.path(pts);ch.path([[0,0],[1,0]],'second');result=T('Peak temperature: ','最高温度：')+fmt(Math.max(...pts.map(p=>p[1])))+T(' · time ',' · 時間 ')+v.time;
 }else if(id==='wave'){
 const pts=seq(160,i=>{const x=i/159;return [x,Math.sin(Math.PI*x)*Math.cos(v.c*v.time)]}),ch=chart(host,[0,1,-1.2,1.2],'position','displacement');ch.path(pts);result=T('Wave speed: ','波速：')+v.c+T(' · time ',' · 時間 ')+v.time;
 }else if(id==='laplace'){
 const ch=chart(host,[-1,1,-1,1],'x','y',280,true);for(let i=0;i<7;i++){const y=-.75+i*.25,mid=(v.left+v.right)/2;ch.line([-.9,y],[.9,y],'second');ch.line([-.9,y],[0,mid],'third');}result=T('Potential gradient: ','電位勾配：')+fmt((v.right-v.left)/2);
 }else if(id==='entropy'){
 const q=1-v.p,ch=chart(host,[0,1,0,1.1],'probability','entropy');ch.path(sample(0,1,100,x=>{const a=x?x*Math.log2(1/x):0,b=x<1?(1-x)*Math.log2(1/(1-x)):0;return [x,a+b]}));ch.dot(v.p,-(v.p*Math.log2(v.p||1)+q*Math.log2(q||1)),'third',7);result=`H = ${fmt(-(v.p*Math.log2(v.p||1)+q*Math.log2(q||1)))} bits`;
 }else if(id==='channel'){
 const cap=1+v.noise*Math.log2(v.noise||1)+(1-v.noise)*Math.log2((1-v.noise)||1),ch=chart(host,[0,.5,0,1],'noise','capacity');ch.path(sample(0,.5,100,x=>[x,1+x*Math.log2(x||1)+(1-x)*Math.log2((1-x)||1)]));ch.dot(v.noise,cap,'third',7);result=T('Binary symmetric capacity: ','二値対称通信路容量：')+fmt(cap);
 }else if(id==='kl'){
 const q=1-v.p, r=1-v.q, d=v.p*Math.log(v.p/v.q)+(1-v.p)*Math.log((1-v.p)/(1-v.q)),ch=chart(host,[0,1,-1,3],'probability','divergence');ch.path([[0,0],[v.p,d],[1,0]],'area',true);ch.dot(v.p,d,'third',7);result=`D_KL(P||Q) = ${fmt(d)}`;
 }else if(['euler-lagrange','geodesic','least-action'].includes(id)){
 const bend=id==='euler-lagrange'?v.bend:id==='geodesic'?v.arc:v.amplitude,ch=chart(host,[-1,1,-1,1],'x','y',280,true);ch.path([[-1,0],[-.5,bend*.5],[0,bend],[.5,bend*.5],[1,0]],'third');ch.path([[-1,0],[0,0],[1,0]],'second');result=T('Path variation: ','経路変分：')+fmt(bend);
 }else if(id==='projectile'){
 const a=rad(v.angle),g=9.8,pts=seq(80,i=>{const t=i/79*2*v.speed*Math.sin(a)/g;return [v.speed*Math.cos(a)*t,v.speed*Math.sin(a)*t-.5*g*t*t]}),ch=chart(host,[0,35,0,18],'range','height');ch.path(pts);result=T('Range: ','飛距離：')+fmt(pts.at(-1)[0])+T(' · peak height: ',' · 最高点：')+fmt(Math.max(...pts.map(p=>p[1])));
 }else if(id==='oscillator'){
 const z=v.damping/Math.sqrt(4*v.stiffness),ch=chart(host,[0,8,-1.2,1.2],'time','displacement');ch.path(sample(0,8,200,t=>Math.exp(-z*t)*Math.cos(Math.sqrt(v.stiffness)*t)));result=T('Damping ratio: ','減衰比：')+fmt(z);
 }else if(id==='mechanics-orbit'){
 const e=Math.abs(v.speed-1),pts=seq(200,i=>{const a=TAU*i/199;return [(1-e)*Math.cos(a),(1+e)*Math.sin(a)]}),ch=chart(host,[-2,2,-2,2],'x','y',280,true);ch.path(pts);ch.dot(...pts[0],'third',7);result=e<.05?T('Circular orbit','円軌道'):e<1?T('Elliptical orbit','楕円軌道'):T('Escape regime','脱出領域');
 }else if(id==='electric-field'){
 const ch=chart(host,[-2,2,-2,2],'x','y',280,true);for(let x=-1.5;x<=1.5;x+=.5)for(let y=-1.5;y<=1.5;y+=.5){const r1=Math.hypot(x+0.7,y)+.1,r2=Math.hypot(x-0.7,y)+.1,ex=v.q1*(x+0.7)/r1**3+v.q2*(x-0.7)/r2**3,ey=v.q1*y/r1**3+v.q2*y/r2**3,n=Math.hypot(ex,ey)||1;ch.line([x,y],[x+.18*ex/n,y+.18*ey/n],'second');}ch.dot(-.7,0,'third',7);ch.dot(.7,0,'third',7);result=T('Charges: ','電荷：')+`${v.q1}, ${v.q2}`;
 }else if(id==='lorentz'){
 const pts=seq(120,i=>{const t=i/30;return [Math.cos(v.b*t),v.vz*t*.25]}),ch=chart(host,[-1.5,1.5,-.5,2],'x','z',280,true);ch.path(pts);result=T('Cyclotron scale: ','サイクロトロン尺度：')+fmt(v.b);
 }else if(id==='induction'){
 const emf=-v.speed*Math.cos(v.position),ch=chart(host,[-2,2,-1.2,1.2],'position','emf');ch.path(sample(-2,2,100,x=>[x,-v.speed*Math.cos(x)]));ch.dot(v.position,emf,'third',7);result=T('Induced emf: ','誘導起電力：')+fmt(emf);
 }else if(id==='lens'){
 const di=1/(1/v.f-1/v.object),ch=chart(host,[-1,10,-2,2],'axis','height');ch.line([0,0],[10,0],'second');ch.line([-1,0],[0,1],'third');ch.line([0,1],[di,0]);ch.dot(v.object,1,'point',7);result=T('Image distance: ','像距離：')+fmt(di);
 }else if(id==='interference'){
 const ch=chart(host,[0,10,0,1],'screen','intensity');ch.path(sample(0,10,300,x=>[x,.5+.5*Math.cos(2*Math.PI*v.spacing*x/v.wavelength)**2]));result=T('Fringe spacing proxy: ','縞間隔の指標：')+fmt(v.wavelength/v.spacing);
 }else if(id==='polarization'){
 const intensity=v.i0*Math.cos(rad(v.angle))**2,ch=chart(host,[0,180,0,1],'angle','intensity');ch.path(sample(0,180,180,x=>[x,v.i0*Math.cos(rad(x))**2]));ch.dot(v.angle,intensity,'third',7);result=T('Transmitted intensity: ','透過強度：')+fmt(intensity);
 }else if(id==='pv'){
 const ch=chart(host,[1,5,0,5],'volume','pressure');ch.path([[1,v.pressure],[v.volume,v.pressure]],'third');ch.dot(v.volume,v.pressure,'point',7);result=T('Work proxy: ','仕事の指標：')+fmt(v.pressure*(v.volume-1));
 }else if(id==='thermo-entropy'){
 const ratio=v.hot/v.cold,ch=chart(host,[0,1,0,1],'fraction','temperature');ch.path(sample(0,1,100,x=>[x,v.cold+(v.hot-v.cold)*x]));result=T('Temperature ratio: ','温度比：')+fmt(ratio);
 }else if(id==='equation-state'){
 const R=.082057,pres=v.n*v.temperature/(v.volume)*R,ch=chart(host,[0,5,0,500],'volume','pressure');ch.path(sample(.5,5,100,x=>[x,v.n*v.temperature*R/x]));ch.dot(v.volume,pres,'third',7);result=T('Pressure: ','圧力：')+fmt(pres);
 }else if(id==='wavefunction'){
 const ch=chart(host,[0,1,0,4],'position','density');ch.path(sample(0,1,250,x=>[x,2*Math.sin(v.n*Math.PI*x)**2]));result=T('Nodes: ','節の数：')+(v.n-1);
 }else if(id==='uncertainty'){
 const dx=v.width,dp=.5/dx,ch=chart(host,[.1,2,0,3],'Δx','Δp');ch.path(sample(.1,2,100,x=>[x,.5/x]));ch.dot(dx,dp,'third',7);result=`Δx Δp = ${fmt(dx*dp)} ≥ 1/2`;
 }else if(id==='bloch'){
 const theta=rad(v.theta),phi=rad(v.phi);bloch3d(host,theta,phi);result=`|ψ⟩: θ = ${v.theta}°, φ = ${v.phi}°`;
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
