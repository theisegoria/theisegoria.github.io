import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Scene units: 1 unit = 10 cm. Published 2022 dimensions (Apple support 111890): 62.3 cm wide;
// display 36.2 cm high and 3.1 cm deep with the VESA adapter; 47.8 cm high and 16.8 cm deep on the tilt stand.
export const DIM={W:6.23,H:3.62,D:.25,CY:.8,DESK:-2.17,R:.09};
const {W,H,D,CY,DESK,R}=DIM;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
// iFixit 2022 front-open photograph (1922 x 1081): chassis spans x 76-1844, y 28-1049 px.
export const P=(x,y)=>[(x-76)/1768*W-W/2,(CY+H/2)-(y-28)/1021*H];
const PS=W/1768;// units per photo pixel (0.352 mm)

/* ---------- procedural surface maps ---------- */
function cv(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')]}
function normalFrom(hc,strength){const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data;const [c,ctx]=cv(w,h);const out=ctx.createImageData(w,h);const g=(x,y)=>src[(((y+h)%h)*w+((x+w)%w))*4]/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(g(x+1,y)-g(x-1,y))*strength,dy=(g(x,y+1)-g(x,y-1))*strength,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;out.data[i]=(-dx/l*.5+.5)*255;out.data[i+1]=(dy/l*.5+.5)*255;out.data[i+2]=(1/l*.5+.5)*255;out.data[i+3]=255}
 ctx.putImageData(out,0,0);return c}
function tex(c,{srgb=false,repeat=[1,1]}={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
function grain(size=256,blur=1.2,seed=7){const [c,x]=cv(size);let s=seed;const r=()=>(s=(s*16807)%2147483647)/2147483647;const img=x.createImageData(size,size);for(let i=0;i<size*size;i++){const v=128+(r()-.5)*255;img.data[i*4]=img.data[i*4+1]=img.data[i*4+2]=v;img.data[i*4+3]=255}x.putImageData(img,0,0);if(blur){const [c2,x2]=cv(size);x2.filter=`blur(${blur}px)`;for(const dx of[-size,0,size])for(const dy of[-size,0,size])x2.drawImage(c,dx,dy);return c2}return c}
function perforation(px=64,holeR=.3,colors=['#cfd1d2','#151617']){const [h,hx]=cv(px);hx.fillStyle='#fff';hx.fillRect(0,0,px,px);const gr=hx.createRadialGradient(px/2,px/2,px*holeR*.55,px/2,px/2,px*holeR*1.08);gr.addColorStop(0,'#000');gr.addColorStop(1,'#fff');hx.fillStyle=gr;hx.beginPath();hx.arc(px/2,px/2,px*holeR*1.1,0,7);hx.fill();
 const [c,x]=cv(px);x.fillStyle=colors[0];x.fillRect(0,0,px,px);const g2=x.createRadialGradient(px/2,px/2,0,px/2,px/2,px*holeR);g2.addColorStop(0,colors[1]);g2.addColorStop(.78,colors[1]);g2.addColorStop(1,colors[0]);x.fillStyle=g2;x.beginPath();x.arc(px/2,px/2,px*holeR,0,7);x.fill();return {color:c,normal:normalFrom(h,6)}}
function stripes(n=64,a='#c98552',b='#6e3a1c'){const [c,x]=cv(16,256);for(let i=0;i<n;i++){const g=x.createLinearGradient(0,i*256/n,0,(i+1)*256/n);g.addColorStop(0,b);g.addColorStop(.5,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,i*256/n,16,256/n)}return c}
function screenImage(){const [c,x]=cv(512,288);const g=x.createLinearGradient(0,0,512,288);g.addColorStop(0,'#0c1219');g.addColorStop(.55,'#1b2b38');g.addColorStop(1,'#3a5262');x.fillStyle=g;x.fillRect(0,0,512,288);const r=x.createRadialGradient(360,250,10,360,250,330);r.addColorStop(0,'rgba(170,200,214,.32)');r.addColorStop(1,'rgba(170,200,214,0)');x.fillStyle=r;x.fillRect(0,0,512,288);return c}
function blob(){const [c,x]=cv(256);const g=x.createRadialGradient(128,128,8,128,128,128);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);return c}

/* ---------- shapes ---------- */
export function rounded(w,h,r,cx=0,cy=0){const s=new THREE.Shape(),x=cx-w/2,y=cy-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Math.PI/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,Math.PI/2);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,Math.PI/2,Math.PI);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Math.PI,Math.PI*1.5);return s}
function holeOf(shape){const pts=shape.getPoints(16);if(pts.length>1&&pts[0].distanceTo(pts[pts.length-1])<1e-6)pts.pop();return new THREE.Path(pts)}
function extrude(shape,depth,b=.008,seg=3,curve=18){const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.0005,depth-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelOffset:shape.holes.length?0:-b,bevelSegments:seg,curveSegments:curve});g.translate(0,0,b);return g}
// A photo-traced outline with slightly rounded corners (corner radius in photo pixels).
function traced(pts,rad=10){const q=pts.map(([x,y])=>new THREE.Vector2(...P(x,y)));const s=new THREE.Shape();const n=q.length,r=rad*PS;for(let i=0;i<n;i++){const a=q[(i+n-1)%n],b=q[i],c=q[(i+1)%n];const u=a.clone().sub(b),v=c.clone().sub(b);const k=Math.min(r,u.length()/2.2,v.length()/2.2);const p1=b.clone().add(u.normalize().multiplyScalar(k)),p2=b.clone().add(v.normalize().multiplyScalar(k));i?s.lineTo(p1.x,p1.y):s.moveTo(p1.x,p1.y);s.quadraticCurveTo(b.x,b.y,p2.x,p2.y)}s.closePath();return s}
export function obround(w,h){const r=Math.min(w,h)/2-1e-4;return rounded(w,h,r)}
function photoRect(x,y,w,h){const [cx,cy]=P(x+w/2,y+h/2);return {cx,cy,w:w*PS,h:h*PS}}
// Top faces of photo-surfaced parts sample the photograph by world position.
function photoUV(g,ox=0,oy=0){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++){const x=p.getX(i)+ox,y=p.getY(i)+oy;const px=(x+W/2)/W*1768+76,py=((CY+H/2)-y)/H*1021+28;uv.push(px/1922,1-py/1081)}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g}

/* An obround microspeaker: plastic frame, rubber roll surround, aluminium diaphragm, copper voice coil, nickel-plated magnet. Faces +z. */
export function obroundDriver(M,w,h){const g=new THREE.Group(),moving=new THREE.Group();
 const frame=obround(w,h);frame.holes.push(holeOf(obround(w-.05,h-.05)));const fr=new THREE.Mesh(extrude(frame,.03,.004),M.plastic);fr.position.z=-.03;g.add(fr);
 const sur=obround(w-.035,h-.035);sur.holes.push(holeOf(obround(w-.085,h-.085)));const sm=new THREE.Mesh(extrude(sur,.016,.0075,4),M.rubber);sm.position.z=-.012;moving.add(sm);
 const dia=new THREE.Mesh(extrude(obround(w-.08,h-.08),.008,.003),M.cone);dia.position.z=-.004;moving.add(dia);
 const coil=obround(w*.62,h*.74);coil.holes.push(holeOf(obround(w*.62-.016,h*.74-.016)));const cm=new THREE.Mesh(extrude(coil,.045,.002),M.copper);cm.position.z=-.05;moving.add(cm);
 const mag=new THREE.Mesh(extrude(obround(w*.5,h*.64),.05,.006),M.nickel);mag.position.z=-.085;g.add(mag);
 const plate=new THREE.Mesh(extrude(obround(w*.82,h*.88),.012,.003),M.steel);plate.position.z=-.098;g.add(plate);
 g.add(moving);g.userData.moving=moving;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g}

export function makeModels(scene,photoTex){
 /* ---------- materials ---------- */
 const grainN=tex(normalFrom(grain(256,1.1),2.2),{repeat:[6,6]});const fine=tex(normalFrom(grain(256,.6,11),1.2),{repeat:[18,18]});
 const perfA=perforation(64,.3,['#cdd0d1','#121314']);
 const meshA=perforation(32,.34,['#c7c9ca','#101112']);const meshTex=tex(meshA.color,{srgb:true,repeat:[10,25]}),meshN=tex(meshA.normal,{repeat:[10,25]});
 const M={
  alu:new THREE.MeshPhysicalMaterial({color:'#e2e4e5',metalness:1,roughness:.36,normalMap:fine,normalScale:new THREE.Vector2(.06,.06)}),
  aluInner:new THREE.MeshPhysicalMaterial({color:'#c2c5c7',metalness:1,roughness:.4,anisotropy:.5}),
  glass:new THREE.MeshPhysicalMaterial({color:'#050608',metalness:0,roughness:.05,clearcoat:1,clearcoatRoughness:.03,ior:1.52}),
  screen:new THREE.MeshPhysicalMaterial({color:'#000000',emissive:'#ffffff',emissiveMap:tex(screenImage(),{srgb:true}),emissiveIntensity:.85,roughness:.08,envMapIntensity:.35}),
  plastic:new THREE.MeshPhysicalMaterial({color:'#1d1f22',roughness:.6,metalness:0,normalMap:grainN,normalScale:new THREE.Vector2(.16,.16),sheen:.3,sheenColor:'#40464c',sheenRoughness:.8}),
  module:new THREE.MeshPhysicalMaterial({color:'#25272a',roughness:.42,metalness:0,clearcoat:.35,clearcoatRoughness:.3}),
  felt:new THREE.MeshPhysicalMaterial({color:'#101112',roughness:1,sheen:1,sheenColor:'#3b3e42',sheenRoughness:.9}),
  flex:new THREE.MeshPhysicalMaterial({color:'#18191b',roughness:.32,clearcoat:.6,clearcoatRoughness:.25}),
  pcb:new THREE.MeshStandardMaterial({map:photoTex,roughness:.5,metalness:.15}),
  pcbEdge:new THREE.MeshStandardMaterial({color:'#1a1d1c',roughness:.5}),
  steel:new THREE.MeshPhysicalMaterial({color:'#a9adb0',metalness:1,roughness:.28}),
  copper:new THREE.MeshPhysicalMaterial({color:'#ffffff',map:tex(stripes(48),{srgb:true}),metalness:1,roughness:.3}),
  toroid:new THREE.MeshPhysicalMaterial({color:'#ffffff',map:tex(stripes(90),{srgb:true,repeat:[1,1]}),metalness:1,roughness:.3}),
  nickel:new THREE.MeshPhysicalMaterial({color:'#d4d2cd',metalness:1,roughness:.18}),
  rubber:new THREE.MeshPhysicalMaterial({color:'#141516',roughness:.85,sheen:.4,sheenColor:'#2b2d2f'}),
  cone:new THREE.MeshPhysicalMaterial({color:'#bfc2c4',metalness:.6,roughness:.42,normalMap:fine,normalScale:new THREE.Vector2(.15,.15)}),
  tweeter:new THREE.MeshPhysicalMaterial({color:'#ffffff',map:meshTex,normalMap:meshN,metalness:.95,roughness:.38}),
  cap:new THREE.MeshPhysicalMaterial({color:'#1e2a36',roughness:.35,clearcoat:.5}),
  head:new THREE.MeshPhysicalMaterial({color:'#cfc8be',roughness:.62,sheen:.5,sheenColor:'#ffffff'}),
  shadow:new THREE.MeshBasicMaterial({color:'#000',alphaMap:tex(blob()),transparent:true,opacity:.38,depthWrite:false}),
 };
 const catMats=new Map();const cm=(cat,base)=>{const key=cat+'|'+base.uuid;if(!catMats.has(key)){const m=base.clone();m.userData={cat,opacity:1};catMats.set(key,m)}return catMats.get(key)};
 const add=(parent,geo,mat,pos=[0,0,0],cast=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m};

 /* ---------- product: enclosure, glass, stand ---------- */
 const product=new THREE.Group();scene.add(product);
 const wall=.05,rb=.012;const rim=rounded(W-2*rb,H-2*rb,R-rb);rim.holes.push(holeOf(rounded(W-2*wall+2*rb,H-2*wall+2*rb,R-wall+rb)));
 add(product,extrude(rim,D-.004,rb,4,32),M.alu,[0,CY,-D/2+.004]);
 add(product,extrude(rounded(W,H,R),.03,.016,5,32),M.alu,[0,CY,-D/2]);
 // Perforated top and bottom edges: rows of fine holes, as on the published product photographs.
 for(const s of[1,-1]){const len=W-2*R-.03,dep=D*.56;const t=tex(perfA.color,{srgb:true,repeat:[Math.round(len/.017),Math.round(dep/.017)]}),n=tex(perfA.normal,{repeat:[Math.round(len/.017),Math.round(dep/.017)]});const m=new THREE.MeshPhysicalMaterial({color:'#ffffff',map:t,normalMap:n,metalness:.9,roughness:.36});const p=add(product,new THREE.PlaneGeometry(len,dep),m,[0,CY+s*(H/2+.0015),0],false);p.rotation.x=-s*Math.PI/2}
 const panel=new THREE.Group();product.add(panel);
 add(panel,extrude(rounded(W-.045,H-.045,R-.02),.014,.004,3,32),M.glass,[0,CY,D/2-.018],false);
 add(panel,new THREE.PlaneGeometry(5.977,3.362),M.screen,[0,CY,D/2-.0035],false);
 add(panel,new THREE.CircleGeometry(.022,32),new THREE.MeshPhysicalMaterial({color:'#020304',roughness:.1,clearcoat:1}),[0,CY+H/2-.07,D/2-.003],false);
 add(panel,new THREE.CircleGeometry(.009,24),new THREE.MeshPhysicalMaterial({color:'#0b1a2a',metalness:.5,roughness:.05,clearcoat:1}),[0,CY+H/2-.07,D/2-.0025],false);
 // Tilt stand: one bent aluminium plate. Side profile from a filleted centreline; width and gauge are estimates.
 const SW=1.85,T=.065;const A=new THREE.Vector2(-.2,.33),C=new THREE.Vector2(-.92,DESK+T/2),E=new THREE.Vector2(.66,DESK+T/2);
 const dir1=C.clone().sub(A).normalize(),fil=.24;const pts=[];const c1=C.clone().sub(dir1.clone().multiplyScalar(fil)),c2=C.clone().add(new THREE.Vector2(fil,0));
 for(let i=0;i<=12;i++)pts.push(A.clone().lerp(c1,i/12));
 pts.push(...new THREE.QuadraticBezierCurve(c1,C,c2).getPoints(18).slice(1));
 for(let i=1;i<=12;i++)pts.push(c2.clone().lerp(E,i/12));
 const off=k=>pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];const t=b.clone().sub(a).normalize();return p.clone().add(new THREE.Vector2(-t.y,t.x).multiplyScalar(k))});
 const prof=new THREE.Shape([...off(T/2),...off(-T/2).reverse()].map(p=>new THREE.Vector2(-p.x,p.y)));
 const sg=extrude(prof,SW,.022,5,8);sg.translate(0,0,-SW/2);sg.rotateY(Math.PI/2);add(product,sg,M.alu);
 const hinge=add(product,new THREE.CylinderGeometry(.075,.075,SW*.92,40),M.alu,[0,.33,-.2]);hinge.rotation.z=Math.PI/2;
 add(product,new RoundedBoxGeometry(SW*.6,.42,.12,4,.03),M.alu,[0,.4,-D/2-.03]);
 const desk=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShadowMaterial({opacity:.16}));desk.rotation.x=-Math.PI/2;desk.position.y=DESK;desk.receiveShadow=true;scene.add(desk);
 const footShadow=add(product,new THREE.PlaneGeometry(SW+.8,2.2),M.shadow,[0,DESK+.003,-.12],false);footShadow.rotation.x=-Math.PI/2;footShadow.receiveShadow=false;

 /* ---------- interior (2022), fitted to the iFixit photograph ---------- */
 const inside=new THREE.Group();product.add(inside);
 const groups={chambers:new THREE.Group(),fans:new THREE.Group(),electronics:new THREE.Group(),cables:new THREE.Group(),woofers:new THREE.Group(),tweeters:new THREE.Group(),ports:new THREE.Group()};
 Object.values(groups).forEach(g=>inside.add(g));
 const ZB=-D/2+.03;// inner face of the back
 const inner=add(inside,new THREE.PlaneGeometry(W-.08,H-.08),cm('chassis',M.aluInner),[0,CY,ZB+.001],false);
 // Tall side acoustic chambers (outlines traced from the photograph, depth estimated at 15 mm).
 const chamberPts=[[[89,55],[326,55],[328,154],[418,154],[430,167],[430,481],[418,493],[318,493],[308,503],[308,1017],[96,1020],[87,1000]],[[1590,55],[1818,55],[1826,72],[1826,1017],[1607,1017],[1607,504],[1595,493],[1491,493],[1491,168],[1502,155],[1590,155]]];
 const pockets=[[[110,833,76,180],[194,833,95,180]],[[1622,833,95,180],[1729,833,74,180]]];
 const chambers=chamberPts.map((pts,i)=>{const g=new THREE.Group();groups.chambers.add(g);const sh=traced(pts,14);for(const [x,y,w,h] of pockets[i]){const r=photoRect(x,y,w,h);sh.holes.push(holeOf(rounded(r.w,r.h,.012,r.cx,r.cy)))}add(g,extrude(sh,.15,.008,3),cm('chambers',M.plastic),[0,0,ZB]);return g});
 for(const [x,y,w,h,side] of[[346,298,70,112,0],[1500,298,70,112,1],[1709,405,42,330,1],[104,160,8,8,0]].slice(0,3)){const r=photoRect(x,y,w,h);add(chambers[side],new RoundedBoxGeometry(r.w,r.h,.012,3,.01),cm('chambers',M.felt),[r.cx,r.cy,ZB+.155])}
 // Blower housings and impellers.
 const fanPts=[[[332,43],[655,43],[655,176],[669,192],[773,192],[789,208],[789,482],[777,493],[442,493],[431,481],[431,170],[420,154],[345,154],[332,140]],[[1258,43],[1588,43],[1588,138],[1577,154],[1500,154],[1488,169],[1488,480],[1477,493],[1134,493],[1123,479],[1123,209],[1136,193],[1244,193],[1258,179]]];
 const fanCenters=[[639,315,92],[1277,315,92]];
 fanPts.forEach((pts,i)=>{const s=traced(pts,12);const [fx,fy,fr]=fanCenters[i];const [cx,cy]=P(fx,fy);const hole=new THREE.Path();hole.absarc(cx,cy,fr*PS,0,Math.PI*2,true);s.holes.push(hole);add(groups.fans,extrude(s,.14,.01,3,48),cm('fans',M.plastic),[0,0,ZB]);
  const imp=new THREE.Group();imp.position.set(cx,cy,ZB+.02);groups.fans.add(imp);const rr=fr*PS;
  add(imp,new THREE.CylinderGeometry(rr*.42,rr*.42,.03,48).rotateX(Math.PI/2),cm('fans',M.steel),[0,0,.09]);
  add(imp,new THREE.CylinderGeometry(rr*.98,rr*.98,.006,64).rotateX(Math.PI/2),cm('fans',M.plastic),[0,0,.01]);
  const blade=new THREE.BoxGeometry(rr*.34,.006,.08);for(let k=0;k<41;k++){const a=k/41*Math.PI*2;const b=add(imp,blade,cm('fans',M.plastic),[Math.cos(a)*rr*.74,Math.sin(a)*rr*.74,.05]);b.rotation.z=a+.75}
  add(imp,new THREE.RingGeometry(rr*.99,rr*1.06,64),cm('fans',M.felt),[0,0,.121],false)});
 // Boards: perimeters traced; their top surfaces carry the photograph's circuit detail.
 const boardPts=[[[324,500],[772,500],[788,515],[788,993],[776,1009],[326,1009],[309,991],[309,520]],[[1068,500],[1590,500],[1607,513],[1607,724],[1591,741],[1068,741],[1051,724],[1051,516]],[[1074,769],[1584,769],[1601,785],[1601,901],[1584,916],[1520,916],[1513,929],[1513,1009],[1426,1009],[1403,990],[1396,918],[1290,918],[1266,943],[1266,1009],[1080,1009],[1064,992],[1064,783]]];
 const pcbTop=cm('electronics',M.pcb),pcbSide=cm('electronics',M.pcbEdge);
 const photoSolid=(parent,shape,depth,z,top=pcbTop,side=pcbSide,cat='electronics')=>{const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:12});photoUV(g);g.clearGroups();const nz=g.attributes.normal;let start=0,prev=-1;for(let i=0;i<nz.count;i+=3){const m=nz.getZ(i)>.99?0:1;if(m!==prev){if(i)g.addGroup(start,i-start,prev);start=i;prev=m}}g.addGroup(start,nz.count-start,prev);return add(parent,g,[top,side],[0,0,z])};
 boardPts.forEach(pts=>photoSolid(groups.electronics,traced(pts,10),.016,ZB+.05));
 for(const [x,y,w,h,d] of[[341,541,102,129,.06],[622,541,110,130,.06],[467,685,95,58,.045],[442,747,71,47,.04],[479,793,59,64,.04],[1291,548,104,118,.035],[1400,548,106,118,.035],[1536,567,53,22,.04],[1536,596,53,22,.04],[1536,625,53,22,.04],[1536,654,53,22,.04],[1195,791,52,38,.02],[1280,827,37,37,.02],[1135,854,36,28,.02],[860,905,120,100,.03]]){const r=photoRect(x,y,w,h);photoSolid(groups.electronics,rounded(r.w,r.h,.008,r.cx,r.cy),d,ZB+.066,pcbTop,cm('electronics',M.plastic))}
 for(const [x,y,r] of[[383,846,36],[497,909,37]]){const [cx,cy]=P(x,y);const t=add(groups.electronics,new THREE.TorusGeometry(r*PS*.72,r*PS*.32,18,64),cm('electronics',M.toroid),[cx,cy,ZB+.09]);t.scale.z=1.4}
 for(const x of[595,622,648,674,701,728]){const [cx,cy]=P(x+9,788);add(groups.electronics,new THREE.CylinderGeometry(9*PS,9*PS,134*PS,24),cm('electronics',M.cap),[cx,cy,ZB+.066+9*PS])}
 for(const [x,y,r] of[[389,718,33],[717,882,16]]){const [cx,cy]=P(x,y);add(groups.electronics,new THREE.CylinderGeometry(r*PS,r*PS,.05,32).rotateX(Math.PI/2),cm('electronics',M.plastic),[cx,cy,ZB+.091])}
 // Flexible flat cables.
 for(const pts of[[[940,83],[969,83],[985,96],[1034,96],[1080,125],[1080,251],[1058,287],[1012,307],[1009,337],[1063,346],[1098,371],[1110,395],[1105,433],[1070,455],[1030,468],[1030,493],[1003,493],[1003,448],[1018,432],[1054,423],[1060,409],[1049,395],[1007,389],[978,372],[970,348],[978,309],[999,284],[1028,272],[1039,252],[1039,139],[1026,127],[982,127],[967,115],[940,111]],[[779,553],[802,546],[1053,546],[1061,575],[820,575],[797,581],[787,604],[787,779],[770,779],[770,584]],[[859,706],[883,697],[939,697],[942,724],[900,724],[885,737],[883,791],[894,819],[927,833],[1056,833],[1078,852],[1068,878],[1050,867],[922,865],[877,850],[853,822],[851,734]]])add(groups.cables,extrude(traced(pts,4),.006,.002),cm('cables',M.flex),[0,0,ZB+.012]);
 const screwG=new THREE.CylinderGeometry(9*PS,9*PS,.012,24).rotateX(Math.PI/2),slotG=new THREE.BoxGeometry(10*PS,2.4*PS,.004);
 for(const [x,y,z] of[[341,80,.15],[640,139,.14],[774,208,.14],[778,474,.14],[445,480,.14],[326,514,.066],[775,514,.066],[326,748,.066],[331,991,.066],[774,987,.066],[1066,516,.066],[1590,515,.066],[1590,724,.066],[1080,726,.066],[1066,786,.066],[1588,786,.066],[1570,899,.066],[1079,990,.066],[1140,208,.14],[1140,475,.14],[1474,477,.14],[1572,79,.15],[1790,762,.15],[128,762,.15]]){const [cx,cy]=P(x,y);const cat=z>.1?(x<430||x>1490?'chambers':'fans'):'electronics';const par=cat==='chambers'?chambers[x<960?0:1]:groups[cat];add(par,screwG,cm(cat,M.steel),[cx,cy,ZB+z+.006]);const s=add(par,slotG,cm(cat,M.plastic),[cx,cy,ZB+z+.012],false);s.rotation.z=.6}
 // Lower-corner speaker modules. Outlines and positions from the photograph; the opposed layout inside each woofer module is inferred from Apple's force-cancelling description and patent.
 const Mw=Object.fromEntries(Object.entries(M).map(([k,v])=>[k,cm('woofers',v)]));
 const speakers=[];
 for(const side of[0,1]){const wr=photoRect(side?1626:198,837,87,178),tr=photoRect(side?1733:114,843,66,164);
  const wg=new THREE.Group();wg.position.set(wr.cx,wr.cy,ZB+.085);groups.woofers.add(wg);
  const shell=add(wg,new RoundedBoxGeometry(wr.w,wr.h,.15,4,.022),cm('woofers-shell',M.module));
  const ring=obround(wr.w*.46,wr.h*.74);ring.holes.push(holeOf(obround(wr.w*.46-.024,wr.h*.74-.024)));add(wg,extrude(ring,.008,.002),cm('woofers-shell',M.module),[0,0,.075]);
  add(wg,new THREE.ShapeGeometry(obround(wr.w*.46-.02,wr.h*.74-.02),24),cm('woofers-shell',M.felt),[0,0,.0755],false);
  const front=obroundDriver(Mw,wr.w*.84,wr.h*.9),back=obroundDriver(Mw,wr.w*.84,wr.h*.9);front.scale.z=back.scale.z=.55;front.position.z=.05;back.position.z=-.05;back.rotation.y=Math.PI;wg.add(front,back);
  const tg=new THREE.Group();tg.position.set(tr.cx,tr.cy,ZB+.09);groups.tweeters.add(tg);
  add(tg,new RoundedBoxGeometry(tr.w,tr.h,.14,3,.008),cm('tweeters',M.tweeter));add(tg,new RoundedBoxGeometry(tr.w*.62,tr.h*.8,.1,3,.01),cm('tweeters',M.nickel),[0,0,-.03]);
  speakers.push({wg,shell,front,back,tg,wx:wr.cx,tx:tr.cx,bottom:wr.cy-wr.h/2})}
 // Outlet arrows below the modules, through the perforated bottom edge (route inferred, not observed).
 const portMat=cm('ports',new THREE.MeshBasicMaterial({color:'#2f8bab',transparent:true,opacity:.75,depthWrite:false,toneMapped:false}));
 for(const s of speakers)for(const [x,len] of[[s.wx,.32],[s.tx,.24]]){const y0=CY-H/2+.02;const shaft=add(groups.ports,new THREE.CylinderGeometry(.012,.012,len,12),portMat,[x,y0-len/2,0],false);const tip=add(groups.ports,new THREE.ConeGeometry(.04,.09,20),portMat,[x,y0-len-.04,0],false);tip.rotation.x=Math.PI}
 // Optional reference overlay: the photograph itself, registered to the chassis.
 const overlayTex=photoTex.clone();overlayTex.repeat.set(1768/1922,1021/1081);overlayTex.offset.set(76/1922,32/1081);overlayTex.needsUpdate=true;
 const overlay=add(product,new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:overlayTex,transparent:true,opacity:.62,depthWrite:false,toneMapped:false}),[0,CY,D/2-.01],false);overlay.renderOrder=5;

 /* ---------- chapter 2: one opposed pair, enlarged ---------- */
 const force=new THREE.Group();scene.add(force);
 const cut=[new THREE.Plane(V(-1,0,0),0)];const Mc=Object.fromEntries(Object.entries(M).map(([k,v])=>{const m=v.clone();m.clippingPlanes=cut;m.side=THREE.DoubleSide;return [k,m]}));
 const pair=[obroundDriver(Mc,.95,2.1),obroundDriver(Mc,.95,2.1)];pair[0].position.z=.42;pair[1].position.z=-.42;pair[1].rotation.y=Math.PI;force.add(...pair);
 const support=new THREE.MeshPhysicalMaterial({color:'#9aa3a8',metalness:.2,roughness:.25,transmission:.0,transparent:true,opacity:.16,depthWrite:false});
 const sbox=new RoundedBoxGeometry(1.15,2.32,1.25,4,.08);force.add(new THREE.Mesh(sbox,support));force.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15,2.32,1.25)),new THREE.LineBasicMaterial({color:'#6d7780',transparent:true,opacity:.55})));
 for(const y of[1.13,-1.13])for(const x of[-.5,.5]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.2,16).rotateX(Math.PI/2),M.steel);r.position.set(x,y,0);force.add(r)}
 function arrow(color,pos){const g=new THREE.Group(),m=new THREE.MeshBasicMaterial({color,toneMapped:false});const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1,16).rotateX(Math.PI/2).translate(0,0,.5),m);const head=new THREE.Mesh(new THREE.ConeGeometry(.08,.2,24).rotateX(Math.PI/2),m);g.add(shaft,head);g.position.set(...pos);g.userData={shaft,head};force.add(g);return g}
 const arrows=[arrow('#1d6f8c',[.72,0,.62]),arrow('#b0662f',[.72,0,-.62]),arrow('#7b858f',[0,1.32,0])];
 function setArrow(a,f){a.visible=Math.abs(f)>.02;const L=Math.max(.05,Math.abs(f)*.8);a.userData.shaft.scale.z=L;a.userData.head.position.z=L+.08;a.rotation.y=f>=0?0:Math.PI}

 /* ---------- chapter 3: wavefront spacing on the desk plane ---------- */
 const air=new THREE.Group();scene.add(air);const waves=[];
 for(let i=0;i<9;i++){const l=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshBasicMaterial({color:'#1d7896',transparent:true,opacity:.6,toneMapped:false,side:THREE.DoubleSide,depthWrite:false}));l.rotation.x=-Math.PI/2;l.position.y=DESK+.012;air.add(l);waves.push(l)}

 /* ---------- chapter 4: plan view, units of 0.1 m ---------- */
 const spatial=new THREE.Group();scene.add(spatial);
 const bar=new THREE.Mesh(new RoundedBoxGeometry(W,.25,.25,3,.05),M.alu);bar.position.set(0,.13,0);spatial.add(bar);
 const srcMat=new THREE.MeshPhysicalMaterial({color:'#1d6f8c',roughness:.3,clearcoat:.6});const sourcePos=[[-2.4,.3,.22],[2.4,.3,.22]];
 const sources=sourcePos.map(p=>{const s=new THREE.Mesh(new THREE.SphereGeometry(.12,32,16),srcMat);s.position.set(...p);spatial.add(s);return s});
 const head=new THREE.Group();spatial.add(head);const hm=new THREE.Mesh(new THREE.SphereGeometry(.78,48,32),M.head);hm.scale.set(.9,1,1.08);hm.castShadow=true;head.add(hm);
 const nose=new THREE.Mesh(new THREE.SphereGeometry(.14,24,16),M.head);nose.scale.set(.8,1,1.4);nose.position.set(0,.05,-.84);head.add(nose);
 for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.12,24,16),new THREE.MeshPhysicalMaterial({color:'#b0662f',roughness:.4}));e.scale.set(.6,1.2,1);e.position.set(s*.72,0,0);head.add(e)}
 const lines=[];for(let s=0;s<2;s++)for(let e=0;e<2;e++){const g=new THREE.BufferGeometry().setFromPoints([V(...sourcePos[s]),V(e?.72:-.72,.3,7.72)]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:s?'#b0662f':'#1d6f8c',transparent:true,opacity:.9,toneMapped:false}));spatial.add(l);lines.push(l)}
 const grid=new THREE.GridHelper(16,16,0x9fb0b8,0xc9d3d8);grid.position.set(0,-.02,4);grid.material.transparent=true;grid.material.opacity=.55;spatial.add(grid);

 /* ---------- callouts: anchor, label and provenance ---------- */
 const L=(obj,pos,key,when,normal)=>({obj,pos:V(...pos),key,when,normal:normal&&V(...normal)});
 const [wl,wrr]=speakers;
 const callouts=[
  L(product,[-W/2+.2,CY+H/2-.1,D/2],'enclosure',s=>s.stage===0&&!s.cutaway),
  L(product,[.6,CY+.4,D/2],'glass',s=>s.stage===0&&!s.cutaway,[0,0,1]),
  L(product,[1.7,CY+H/2,0],'edges',s=>s.stage===0&&!s.cutaway),
  L(product,[0,DESK+.05,.4],'stand',s=>s.stage===0&&!s.cutaway),
  L(wl.wg,[0,.1,.08],'wooferL',s=>s.stage===0&&s.cutaway&&['all','woofers','isolated'].includes(s.selection)),
  L(wrr.wg,[0,.1,.08],'wooferR',s=>s.stage===0&&s.cutaway&&['all','woofers','isolated'].includes(s.selection)),
  L(wl.tg,[0,.15,.06],'tweeterL',s=>s.stage===0&&s.cutaway&&['all','tweeters','isolated'].includes(s.selection)),
  L(wrr.tg,[0,.15,.06],'tweeterR',s=>s.stage===0&&s.cutaway&&['tweeters','isolated'].includes(s.selection)),
  L(chambers[0],[...P(200,330),ZB+.15],'chamber',s=>s.stage===0&&s.cutaway&&['all','woofers','isolated'].includes(s.selection)),
  L(groups.ports,[wrr.tx,CY-H/2-.3,0],'outlet',s=>s.stage===0&&s.cutaway&&['all','woofers','tweeters','isolated'].includes(s.selection)),
  L(groups.fans,[...P(639,315),ZB+.12],'fan',s=>s.stage===0&&s.cutaway&&['all','fans'].includes(s.selection)),
  L(groups.electronics,[...P(545,620),ZB+.07],'psu',s=>s.stage===0&&s.cutaway&&['electronics'].includes(s.selection)),
  L(groups.electronics,[...P(1330,880),ZB+.07],'logic',s=>s.stage===0&&s.cutaway&&['electronics'].includes(s.selection)),
  L(pair[0],[0,.6,.05],'driverA',s=>s.stage===1),L(pair[1],[0,.6,.05],'driverB',s=>s.stage===1),L(force,[0,1.32,0],'net',s=>s.stage===1),
  L(sources[0],[0,0,0],'srcL',s=>s.stage===3),L(sources[1],[0,0,0],'srcR',s=>s.stage===3),L(head,[0,0,0],'listener',s=>s.stage===3),
 ];

 const keepFor={woofers:['woofers','ports','chambers'],tweeters:['tweeters','ports'],fans:['fans'],electronics:['electronics','cables']};
 let ghosted=false;
 function setOpacity(m,op){const t=op<.999;if(m.transparent!==t){m.transparent=t;m.needsUpdate=true}m.opacity=op;m.depthWrite=!t}
 function update(st){
  const s0=st.stage===0,cut=s0&&st.cutaway,e=s0?st.explode:0,focus=st.selection;
  product.visible=s0||st.stage===2;force.visible=st.stage===1;air.visible=st.stage===2;spatial.visible=st.stage===3;desk.visible=s0||st.stage===2;
  panel.visible=!cut;inside.visible=cut;overlay.visible=cut&&st.photo;
  for(const k of['electronics','fans','cables'])groups[k].visible=focus!=='isolated';
  groups.ports.visible=cut&&!['fans','electronics'].includes(focus);
  const keep=keepFor[focus];ghosted=false;
  for(const m of catMats.values()){const fam=m.userData.cat.split('-')[0];let op=1;if(keep&&fam!=='chassis'&&!keep.includes(fam))op=.1;if(m.userData.cat==='woofers-shell'&&(focus==='woofers'||e>.04))op=Math.min(op,.2);if(fam==='ports')op=Math.min(op,.8);setOpacity(m,op);if(op<.79)ghosted=true}
  // Inspection-only separation along the viewing axis.
  groups.electronics.position.z=e*.5;groups.cables.position.z=e*.25;groups.fans.position.z=e*.85;
  chambers.forEach((g,i)=>g.position.set((i?1:-1)*e*.25,0,e*1.15));
  speakers.forEach((s,i)=>{s.wg.position.z=ZB+.085+e*1.7;s.tg.position.z=ZB+.09+e*1.55;s.front.position.z=.05+e*.12;s.back.position.z=-.05-e*.12;s.wg.position.x=s.wx+(i?1:-1)*e*.25;s.tg.position.x=s.tx+(i?1:-1)*e*.25});
  groups.ports.position.z=e*1.6;
  // Chapter 2: matched or mismatched opposed drive.
  const sine=Math.sin(st.phase*Math.PI*2),k=1-st.mismatch/100;pair[0].userData.moving.position.z=.11*sine;pair[1].userData.moving.position.z=.11*k*sine;
  const fA=sine,fB=-k*sine,net=fA+fB;
  setArrow(arrows[0],fA);setArrow(arrows[1],fB);setArrow(arrows[2],net);
  const wavelength=343/st.frequency*10;waves.forEach((w,i)=>{const rad=(i+st.phase)*wavelength;w.visible=rad>.8&&rad<18;if(w.visible){w.geometry.dispose();w.geometry=new THREE.RingGeometry(rad-.035,rad+.035,128,1,Math.PI,Math.PI)}w.material.opacity=.7*(1-rad/20)});
  head.position.set(st.listener*10,.3,7.72);lines.forEach((l,i)=>{const e2=i%2;const p=l.geometry.attributes.position;p.setXYZ(1,st.listener*10+(e2?.72:-.72),.3,7.72);p.needsUpdate=true;l.geometry.computeBoundingSphere()});
 }
 return {product,force,spatial,air,panel,inside,update,callouts,isGhosted:()=>ghosted,M};
}
