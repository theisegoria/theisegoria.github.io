import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/* A generic wall-mounted reverse-cycle split system in a cut-away room corner.
   Metres, y up. Indoors is x < -0.25 (plaster wall behind the indoor unit),
   the cut external wall runs along z at x = -0.25..0, outdoors is x > 0.
   Proportions follow common 2.5 to 3.5 kW wall units: indoor about 0.86 x 0.29 x 0.22 m,
   outdoor about 0.82 x 0.56 x 0.30 m. No product mesh, logo or trade dress. */

const T=THREE;
const HDRI='/assets/hdri/studio_small_09_1k.hdr';
const WARM='#e8622f',COOL='#2e8fd6',ROOM='#9ba3a8';
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const rnd=(i,k=0)=>{const x=Math.sin(i*12.9898+k*78.233)*43758.5453;return x-Math.floor(x)};

/* ---------- procedural surface textures, drawn once on a canvas */
function canvasTex(w,h,draw,repeat=[1,1],color=true){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;return t}
function normalFrom(w,h,height,strength=2,repeat=[1,1]){return canvasTex(w,h,(g)=>{const img=g.createImageData(w,h);const H=(x,y)=>height(((x%w)+w)%w,((y%h)+h)%h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*strength,dy=(H(x,y+1)-H(x,y-1))*strength,l=Math.hypot(dx,dy,1),i=4*(y*w+x);img.data[i]=(-dx/l*.5+.5)*255;img.data[i+1]=(dy/l*.5+.5)*255;img.data[i+2]=(1/l*.5+.5)*255;img.data[i+3]=255}g.putImageData(img,0,0)},repeat,false)}
const BRICK={w:512,h:512,bw:128,ch:64,m:6};
function brickHeight(x,y){const row=Math.floor(y/BRICK.ch),off=row%2?BRICK.bw/2:0,bx=(x+off)%BRICK.bw,by=y%BRICK.ch;return bx<BRICK.m||by<BRICK.m?0:1-.08*rnd(Math.floor((x+off)/BRICK.bw)+row*17,3)}
function brickMap(rep){return canvasTex(512,512,(g)=>{g.fillStyle='#cbc3b5';g.fillRect(0,0,512,512);for(let row=0;row<8;row++){const off=row%2?-64:0;for(let i=-1;i<5;i++){const x=i*128+off+6,y=row*64+6,k=rnd(i+row*9+40);const l=38+k*14,s=48+rnd(i*3+row)*14;g.fillStyle=`hsl(${14+k*8},${s}%,${l}%)`;g.fillRect(x,y,122,58);for(let n=0;n<70;n++){g.fillStyle=`rgba(${rnd(n,i+row)>.5?'255,230,210':'40,20,10'},${.08+rnd(n+3,row)*.1})`;g.fillRect(x+rnd(n,row*7+i)*120,y+rnd(n*2,i)*56,2,2)}}}},rep)}
function finMaps(rep){const map=canvasTex(256,32,(g)=>{g.fillStyle='#8f969b';g.fillRect(0,0,256,32);for(let x=0;x<256;x+=4){g.fillStyle='#e3e7ea';g.fillRect(x,0,1.6,32);g.fillStyle='#5d6469';g.fillRect(x+2.6,0,1,32)}},rep);const nrm=normalFrom(256,32,(x)=>{const k=x%4;return k<1.6?1:k>2.6?0:.4},3,rep);return {map,nrm}}
function plasterNormal(rep){return normalFrom(256,256,(x,y)=>rnd(x+y*256)*.5+rnd(Math.floor(x/4)+Math.floor(y/4)*97,2)*.5,.7,rep)}
function woodMap(rep){return canvasTex(512,512,(g)=>{for(let p=0;p<8;p++){const y=p*64,k=rnd(p,5);g.fillStyle=`hsl(${28+k*6},${38+k*10}%,${48+k*9}%)`;g.fillRect(0,y,512,64);for(let n=0;n<26;n++){g.strokeStyle=`rgba(80,45,20,${.06+rnd(n,p)*.1})`;g.lineWidth=1+rnd(n+1,p)*1.5;g.beginPath();const yy=y+4+rnd(n,p+9)*56;g.moveTo(0,yy);for(let x=0;x<=512;x+=32)g.lineTo(x,yy+Math.sin(x*.02+n)*2.5);g.stroke()}g.fillStyle='rgba(50,30,15,.45)';g.fillRect(0,y,512,2);const cut=rnd(p,8)*512;g.fillRect(cut,y,2,64)}},rep)}
function paverMap(rep){return canvasTex(512,512,(g)=>{g.fillStyle='#8d8a85';g.fillRect(0,0,512,512);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const k=rnd(i*4+j,11);g.fillStyle=`hsl(35,${4+k*4}%,${62+k*8}%)`;g.fillRect(i*128+3,j*128+3,122,122);for(let n=0;n<160;n++){g.fillStyle=`rgba(0,0,0,${rnd(n,i+j*4)*.07})`;g.fillRect(i*128+3+rnd(n,j)*120,j*128+3+rnd(n*3,i)*120,2,2)}}},rep)}
function tapeMap(){return canvasTex(64,256,(g)=>{g.fillStyle='#ecebe6';g.fillRect(0,0,64,256);g.strokeStyle='rgba(120,120,115,.35)';g.lineWidth=2;for(let y=-64;y<320;y+=24){g.beginPath();g.moveTo(0,y);g.lineTo(64,y+20);g.stroke()}},[1,30])}

export function createSplitScene({host,state,tr,onPart,onLost}){
 const narrow0=host.clientWidth<600;
 const renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,narrow0?2:1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','3D split-system model; use component buttons for explanations and Reset view to restore the camera');renderer.domElement.tabIndex=0;
 const scene=new T.Scene();const pmrem=new T.PMREMGenerator(renderer);
 const sky=new T.Scene();sky.background=new T.Color(0xd9dde0);const env0=pmrem.fromScene(sky,0);scene.environment=env0.texture;scene.environmentIntensity=.9;
 new HDRLoader().load(HDRI,tex=>{tex.mapping=T.EquirectangularReflectionMapping;scene.environment=pmrem.fromEquirectangular(tex).texture;scene.environmentRotation.y=.5;scene.environmentIntensity=.8;tex.dispose();host.dataset.hdri='loaded';dirty=true;wake()},undefined,()=>{host.dataset.hdri='fallback'});
 const sun=new T.DirectionalLight(0xfff8ee,1.55);sun.position.set(2.6,5.2,4.2);sun.target.position.set(-.2,1,0);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-3.4,right:3.4,top:3.4,bottom:-2,near:1,far:14});sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;scene.add(sun,sun.target);
 scene.add(new T.HemisphereLight(0xf2f5f8,0x8b877f,.25));
 const camera=new T.PerspectiveCamera(30,1,.05,60);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=1.2;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.2;controls.zoomSpeed=.65;controls.target.set(-.2,1.2,.1);

 /* ---------- materials */
 const P=o=>new T.MeshPhysicalMaterial(o),S=o=>new T.MeshStandardMaterial(o);
 const plaster=S({color:'#ece9e3',roughness:.93,normalMap:plasterNormal([5,5]),normalScale:new T.Vector2(.35,.35)});
 const plasterCut=S({color:'#f4f2ee',roughness:.95});
 const insulation=S({color:'#e6d39f',roughness:1,normalMap:plasterNormal([3,8]),normalScale:new T.Vector2(1.2,1.2)});
 const stud=S({color:'#c99d66',roughness:.8});
 const cavity=S({color:'#3b3631',roughness:1});
 const brickN=(r)=>normalFrom(512,512,brickHeight,3.5,r);
 const brickC=S({map:brickMap([1.98,3.8]),normalMap:brickN([1.98,3.8]),roughness:.92});
 const brickB=S({map:brickMap([1.2,3.8]),normalMap:brickN([1.2,3.8]),roughness:.92});
 const brickCut=S({color:'#9c5236',roughness:.95});
 const floorWood=P({map:woodMap([1.35,1.2]),roughness:.5,clearcoat:.35,clearcoatRoughness:.35});
 const skirting=S({color:'#f3f1ec',roughness:.6});
 const pavers=S({map:paverMap([1.2,.95]),roughness:.95});
 const concrete=S({color:'#b4b0a8',roughness:.95,normalMap:plasterNormal([2,2]),normalScale:new T.Vector2(.6,.6)});
 const unitWhite=P({color:'#f3f3f0',roughness:.34,clearcoat:.55,clearcoatRoughness:.25});
 const panelWhite=P({color:'#f6f6f3',roughness:.22,clearcoat:.85,clearcoatRoughness:.12});
 const outletDark=S({color:'#2d3236',roughness:.75});
 const vaneMat=S({color:'#6b7277',roughness:.6});
 const displayMat=P({color:'#14181b',roughness:.1,clearcoat:1});
 const ledMat=new T.MeshBasicMaterial({color:'#5fd0c0'});
 const steel=P({color:'#e4e3dd',roughness:.42,metalness:.15,clearcoat:.35,clearcoatRoughness:.3});
 const blackPlastic=S({color:'#1e2124',roughness:.55});
 const bladeMat=S({color:'#2a2e32',roughness:.45,side:T.DoubleSide});
 const galv=S({color:'#a8acaf',metalness:.85,roughness:.42});
 const copper=P({color:'#c97b4f',metalness:1,roughness:.3,clearcoat:.2});
 const brass=P({color:'#c9a24f',metalness:1,roughness:.3});
 const rubber=S({color:'#26292b',roughness:.9});
 const foam=S({color:'#2e3235',roughness:.88});
 const tape=S({map:tapeMap(),roughness:.55});
 const duct=P({color:'#f1f0eb',roughness:.45,clearcoat:.3});
 const hose=S({color:'#9aa1a6',roughness:.7});
 const fi=finMaps([5,1]),fl=finMaps([2.4,1]),fn=finMaps([7,1]);
 const finRear=S({color:'#ffffff',map:fi.map,normalMap:fi.nrm,metalness:.75,roughness:.42,emissive:new T.Color(0)});
 const finSide=S({color:'#ffffff',map:fl.map,normalMap:fl.nrm,metalness:.75,roughness:.42,emissive:new T.Color(0)});
 const finIndoor=S({color:'#ffffff',map:fn.map,normalMap:fn.nrm,metalness:.75,roughness:.42,emissive:new T.Color(0)});
 const compMat=P({color:'#17191b',roughness:.38,metalness:.25,clearcoat:.5});
 const hl={pipes:[foam,tape,duct],compressor:[compMat,brass],indoor:[],outdoor:[]};

 /* ---------- helpers */
 const model=new T.Group();scene.add(model);
 function rbox(w,h,d,r){r=Math.max(0,Math.min(r,Math.min(w,h,d)/2-1e-4));return r>.0005?new RoundedBoxGeometry(w,h,d,3,r):new T.BoxGeometry(w,h,d)}
 function box(parent,[w,h,d],[x,y,z],mat,r=.003){const m=new T.Mesh(rbox(w,h,d,r),mat);m.position.set(x,y,z);parent.add(m);return m}
 function cyl(parent,r,h,[x,y,z],mat,seg=32,r2=r){const m=new T.Mesh(new T.CylinderGeometry(r,r2,h,seg),mat);m.position.set(x,y,z);parent.add(m);return m}
 function tubeAlong(parent,pts,r,mat,seg=8){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'centripetal');const m=new T.Mesh(new T.TubeGeometry(c,Math.ceil(c.getLength()*120)+8,r,seg,false),mat);parent.add(m);return m}
 function inst(parent,geo,mat,list){const m=new T.InstancedMesh(geo,mat,list.length);const o=new T.Object3D();list.forEach((p,i)=>{o.position.set(p[0],p[1],p[2]);o.rotation.set(p[3]||0,p[4]||0,p[5]||0);o.scale.set(p[6]||1,p[7]||1,p[8]||1);o.updateMatrix();m.setMatrixAt(i,o.matrix)});parent.add(m);return m}
 // Extrude a side profile (u = depth z, v = height y) across the width (x).
 function extrudeX(parent,shape,x0,len,mat,opts={}){const g=new T.ExtrudeGeometry(shape,{depth:len,bevelEnabled:!!opts.bevel,bevelThickness:opts.bevel||0,bevelSize:opts.bevel||0,bevelSegments:3,curveSegments:opts.curve||24});const m=new T.Mesh(g,mat);m.rotation.y=-Math.PI/2;m.position.x=x0+len;parent.add(m);return m}
 function stripShape(pts,t){const n=pts.length,out=[],inn=[];for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;const nx=dy/l,ny=-dx/l;out.push([pts[i][0],pts[i][1]]);inn.push([pts[i][0]-nx*t,pts[i][1]-ny*t])}const s=new T.Shape();s.moveTo(...out[0]);for(const p of out.slice(1))s.lineTo(...p);for(const p of inn.reverse())s.lineTo(...p);s.closePath();return s}
 const covers=[],insides=[];

 /* ---------- room corner: plaster wall, cut external wall (plasterboard, studs and batts, cavity, brick), timber floor, paved yard */
 const H=2.6;
 box(model,[1.9,H,.25],[-1.203,H/2,-.425],plaster,.002);
 box(model,[1.9,.012,.25],[-1.203,H+.006,-.425],plasterCut,0);
 box(model,[1.88,.075,.018],[-1.21,.0375,-.291],skirting,.003);
 // cut external wall: layers along x
 const zA=-.55,zB=.62,len=zB-zA,zc=(zA+zB)/2;
 box(model,[.013,H,len],[-.2465,H/2,zc],plasterCut,0);
 box(model,[.09,H,len],[-.1950,H/2,zc],insulation,0);
 for(const z of [-.40,.05,.50])box(model,[.09,H,.045],[-.195,H/2,z],stud,.002);
 box(model,[.04,H,len],[-.130,H/2,zc],cavity,0);
 box(model,[.11,H,len],[-.055,H/2,zc],brickB,.002);
 box(model,[.11,.012,len],[-.055,H+.006,zc],brickCut,0);box(model,[.13,.012,len],[-.19,H+.006,zc],insulation,0);
 box(model,[1.9,H,.25],[.95,H/2,-.425],brickC,.002);box(model,[1.9,.012,.25],[.95,H+.006,-.425],brickCut,0);
 box(model,[1.9,.04,1.2],[-1.2,-.02,.3],floorWood,.003);
 box(model,[1.9,.04,1.2],[.95,-.02,.3],pavers,.003);
 box(model,[.25,.04,1.2],[-.125,-.02,.3],concrete,.002);
 // wall sleeve where the line set passes through
 for(const x of [-.255,.002]){const r=new T.Mesh(new T.TorusGeometry(.05,.008,10,32),duct);r.rotation.y=Math.PI/2;r.position.set(x,2.02,-.20);model.add(r)}

 /* ---------- indoor unit */
 const IW=.86,ix0=-1.70,iy0=1.90,iz0=-.30;
 const indoor=new T.Group();indoor.position.set(0,iy0,iz0);model.add(indoor);
 const sil=new T.Shape();sil.moveTo(0,.035);sil.lineTo(0,.29);sil.lineTo(.13,.29);sil.quadraticCurveTo(.215,.29,.215,.215);sil.lineTo(.212,.115);sil.quadraticCurveTo(.209,.066,.172,.058);sil.lineTo(.078,.014);sil.quadraticCurveTo(.02,0,0,.035);
 extrudeX(indoor,sil,ix0,.012,unitWhite,{bevel:.003});extrudeX(indoor,sil,ix0+IW-.012,.012,unitWhite,{bevel:.003});
 const bodyFull=extrudeX(indoor,sil,ix0+.012,IW-.024,unitWhite);covers.push(bodyFull);
 const back=new T.Shape();back.moveTo(0,.035);back.lineTo(0,.29);back.lineTo(.045,.29);back.lineTo(.045,.07);back.lineTo(.09,.05);back.lineTo(.078,.014);back.quadraticCurveTo(.02,0,0,.035);
 insides.push(extrudeX(indoor,back,ix0+.012,IW-.024,unitWhite));
 const pan=new T.Shape();pan.moveTo(.11,.06);pan.lineTo(.205,.068);pan.lineTo(.205,.092);pan.lineTo(.12,.085);pan.closePath();insides.push(extrudeX(indoor,pan,ix0+.012,IW-.024,unitWhite));
 // front panel: a separate glossy skin with a visible seam
 const fp=[];{const c=new T.CurvePath();c.add(new T.LineCurve(new T.Vector2(.122,.2915),new T.Vector2(.13,.2915)));c.add(new T.QuadraticBezierCurve(new T.Vector2(.13,.2915),new T.Vector2(.2165,.2915),new T.Vector2(.2165,.215)));c.add(new T.LineCurve(new T.Vector2(.2165,.215),new T.Vector2(.2135,.115)));c.add(new T.QuadraticBezierCurve(new T.Vector2(.2135,.115),new T.Vector2(.2105,.068),new T.Vector2(.18,.0605)));for(const p of c.getSpacedPoints(48))fp.push([p.x,p.y])}
 const front=extrudeX(indoor,stripShape(fp,-.006),ix0+.014,IW-.028,panelWhite);covers.push(front);
 // intake grille on top
 const slots=[];for(let i=0;i<46;i++)slots.push([ix0+.05+i*(IW-.1)/45,.2915,.07]);const top=inst(indoor,new T.BoxGeometry(.006,.003,.095),outletDark,slots);covers.push(top);
 // outlet: dark recess, vertical vanes and the motorised louvre
 const ol=new T.Shape();ol.moveTo(.172,.058);ol.lineTo(.078,.014);ol.lineTo(.0789,.0122);ol.lineTo(.1729,.0562);ol.closePath();extrudeX(indoor,ol,ix0+.02,IW-.04,outletDark);
 const vanes=[];for(let i=0;i<15;i++)vanes.push([ix0+.07+i*(IW-.14)/14,.04,.125,0,0,0]);inst(indoor,new T.BoxGeometry(.003,.02,.045),vaneMat,vanes);
 const flapShape=stripShape([[0,0],[.025,-.004],[.05,-.006],[.075,-.003]],.004);
 const flapPivot=new T.Group();flapPivot.position.set(0,.058,.172);indoor.add(flapPivot);const flap=extrudeX(flapPivot,flapShape,ix0+.03,IW-.06,unitWhite);flap.position.z=0;
 box(indoor,[.07,.022,.003],[ix0+IW-.13,.13,.2125],displayMat,.0015);const led=box(indoor,[.004,.004,.002],[ix0+IW-.115,.13,.2145],ledMat,.001);
 // inside: finned coil wrapped over a crossflow fan
 const coilF=box(indoor,[IW-.05,.15,.018],[ix0+IW/2,.165,.18],finIndoor,.002);const coilT=box(indoor,[IW-.05,.12,.018],[ix0+IW/2,.262,.12],finIndoor,.002);coilT.rotation.x=-1.15;insides.push(coilF,coilT);
 for(let i=0;i<6;i++){const u=new T.Mesh(new T.TorusGeometry(.012,.0032,6,14,Math.PI),copper);u.rotation.y=Math.PI/2;u.position.set(ix0+IW-.022,.105+i*.025,.18);indoor.add(u);insides.push(u)}
 const xfan=new T.Group();xfan.position.set(ix0+IW/2,.135,.105);indoor.add(xfan);insides.push(xfan);
 const blades=[];for(let i=0;i<30;i++){const a=i/30*Math.PI*2;blades.push([0,Math.cos(a)*.042,Math.sin(a)*.042,a+.5,0,0])}xfan.add(inst(new T.Group(),new T.BoxGeometry(IW-.08,.0016,.016),bladeMat,blades));
 for(let i=0;i<5;i++){const d=cyl(xfan,.05,.003,[-(IW-.08)/2+i*(IW-.08)/4,0,0],bladeMat,24);d.rotation.z=Math.PI/2}
 const indoorFans=[xfan];

 /* ---------- outdoor unit */
 const OW=.82,OH=.56,OD=.30,ox0=.42,oy0=.10,oz0=-.20;
 const outdoor=new T.Group();outdoor.position.set(ox0,oy0,oz0);model.add(outdoor);
 box(model,[.98,.07,.46],[ox0+OW/2,.035,oz0+OD/2],concrete,.01);
 for(const x of [.09,OW-.09]){box(outdoor,[.07,.035,.38],[x,-.028,OD/2],galv,.004);box(outdoor,[.08,.03,.06],[x,-.06,.02],rubber,.006);box(outdoor,[.08,.03,.06],[x,-.06,OD-.02],rubber,.006)}
 box(outdoor,[OW,.03,OD],[OW/2,.015,OD/2],steel,.004);
 const fx=.30,fy=.29,fr=.205;
 const fl0=new T.Shape();fl0.moveTo(0,0);fl0.lineTo(.585,0);fl0.lineTo(.585,OH);fl0.lineTo(0,OH);fl0.closePath();const hole=new T.Path();hole.absarc(fx,fy,fr,0,Math.PI*2,true);fl0.holes.push(hole);
 const fpL=new T.Mesh(new T.ExtrudeGeometry(fl0,{depth:.012,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:2,curveSegments:64}),steel);fpL.position.set(0,0,OD-.012);outdoor.add(fpL);
 const fpR=box(outdoor,[.235,OH,.012],[.585+.1175+.001,OH/2,OD-.006],steel,.004);covers.push(fpR);
 const louv=[];for(let i=0;i<9;i++)louv.push([.70,.32+i*.022,OD+.002]);covers.push(inst(outdoor,new T.BoxGeometry(.13,.006,.004),blackPlastic,louv));
 const topPanel=box(outdoor,[OW+.012,.014,OD+.014],[OW/2,OH+.007,OD/2],steel,.005);covers.push(topPanel);
 const sideR=box(outdoor,[.012,OH,OD],[OW-.006,OH/2,OD/2],steel,.004);covers.push(sideR);
 const valveCover=box(outdoor,[.014,.2,.13],[OW+.007,.40,OD-.075],steel,.004);covers.push(valveCover);
 // bell mouth, guarded propeller fan, motor
 const bell=new T.Mesh(new T.TorusGeometry(fr,.016,12,64),blackPlastic);bell.position.set(fx,fy,OD-.02);outdoor.add(bell);
 const fanO=new T.Group();fanO.position.set(fx,fy,OD-.06);outdoor.add(fanO);
 const bladeShape=new T.Shape();bladeShape.moveTo(.045,-.02);bladeShape.bezierCurveTo(.09,-.07,.17,-.07,.188,-.01);bladeShape.bezierCurveTo(.195,.04,.15,.085,.09,.075);bladeShape.bezierCurveTo(.06,.06,.045,.03,.045,-.02);
 for(let i=0;i<3;i++){const g=new T.ShapeGeometry(bladeShape,12);const pos=g.attributes.position;for(let k=0;k<pos.count;k++){const x=pos.getX(k),y=pos.getY(k);pos.setZ(k,-y*.45+.004*x)}g.computeVertexNormals();const b=new T.Mesh(g,bladeMat);b.rotation.z=i*Math.PI*2/3;fanO.add(b)}
 cyl(fanO,.05,.05,[0,0,0],bladeMat,32).rotation.x=Math.PI/2;const nose=new T.Mesh(new T.SphereGeometry(.05,24,12,0,Math.PI*2,0,Math.PI/2),bladeMat);nose.rotation.x=Math.PI/2;nose.position.z=.025;fanO.add(nose);
 cyl(outdoor,.06,.07,[fx,fy,OD-.13],blackPlastic,28).rotation.x=Math.PI/2;for(const x of [fx-.03,fx+.03])box(outdoor,[.012,OH-.05,.02],[x,OH/2,OD-.16],galv,.002);
 for(let i=0;i<8;i++){const ring=new T.Mesh(new T.TorusGeometry(.035+i*.024,.0028,6,64),blackPlastic);ring.position.set(fx,fy,OD+.012);outdoor.add(ring)}
 for(let i=0;i<10;i++){const s=box(outdoor,[.004,fr*2,.006],[fx,fy,OD+.012],blackPlastic,.0015);s.rotation.z=i*Math.PI/10}
 // L-shaped finned coil on the back and left side, with wire guards and copper return bends
 const coilR=box(outdoor,[.58,OH-.06,.024],[.30,OH/2,.014],finRear,.002);const coilL=box(outdoor,[.024,OH-.06,OD-.04],[.014,OH/2,OD/2-.006],finSide,.002);
 box(outdoor,[.012,OH-.04,.04],[.595,OH/2,.03],galv,.002);
 for(let i=0;i<9;i++){const u=new T.Mesh(new T.TorusGeometry(.011,.003,6,12,Math.PI),copper);u.rotation.y=Math.PI/2;u.rotation.x=Math.PI/2;u.position.set(.604,.06+i*.055,.012);outdoor.add(u)}
 const gw=[];for(let i=0;i<12;i++)gw.push([.03+i*.05,OH/2,-.004,0,0,0]);for(let j=0;j<6;j++)gw.push([.30,.05+j*.09,-.004,0,0,Math.PI/2,1,.58/(OH-.04)]);inst(outdoor,new T.CylinderGeometry(.0013,.0013,OH-.04,5),galv,gw);
 // compressor compartment: rotary compressor with accumulator, reversing valve, expansion valve
 box(outdoor,[.008,OH-.03,OD-.02],[.586,OH/2,OD/2],galv,.002);
 const comp=new T.Group();comp.position.set(.70,.03,.15);outdoor.add(comp);
 cyl(comp,.068,.2,[0,.13,0],compMat,36);const cd=new T.Mesh(new T.SphereGeometry(.068,32,14,0,Math.PI*2,0,Math.PI/2),compMat);cd.scale.y=.55;cd.position.y=.23;comp.add(cd);
 cyl(comp,.032,.15,[-.07,.15,-.085],compMat,24);for(const x of [-.05,.05])cyl(comp,.012,.02,[x,.01,0],rubber,12);
 tubeAlong(comp,[[-.07,.225,-.085],[-.07,.26,-.085],[-.04,.27,-.04],[-.02,.235,-.02]],.005,copper);
 const rv=cyl(comp,.014,.085,[0,.36,.04],brass,20);rv.rotation.z=Math.PI/2;for(const x of [-.03,0,.03])tubeAlong(comp,[[x,.36,.04],[x,.39,.04],[x*.6,.42,.02]],.004,copper);tubeAlong(comp,[[0,.345,.04],[0,.3,.02],[.02,.24,0]],.0045,copper);
 const eev=cyl(comp,.01,.07,[.075,.30,.09],brass,16);const coilE=cyl(comp,.022,.035,[.075,.335,.09],blackPlastic,20);
 tubeAlong(comp,[[.075,.265,.09],[.075,.22,.1],[.09,.18,.12]],.0035,copper);
 const compParts=[comp];
 // service valves on the right side
 const valves=new T.Group();valves.position.set(OW+.02,0,OD-.08);outdoor.add(valves);
 for(const [y,r] of [[.13,.012],[.21,.009]]){box(valves,[.03,.03,.03],[.0,y,0],brass,.004);const cap=cyl(valves,.011,.02,[.0,y,.025],brass,6);cap.rotation.x=Math.PI/2;const nut=cyl(valves,r+.006,.02,[.025,y,0],brass,6);nut.rotation.z=Math.PI/2}

 /* ---------- line set: indoor trunking, taped bundle through the wall, insulated lines to the valves, drain hose */
 const ductIn=box(model,[.58,.075,.065],[-.55,2.02,-.26],duct,.006);covers.push(ductIn);
 const lineIn1=tubeAlong(model,[[ix0+IW-.02,iy0+.12,-.27],[-.9,2.02,-.262],[-.5,2.02,-.262],[-.25,2.02,-.20]],.019,foam);
 const lineIn2=tubeAlong(model,[[ix0+IW-.02,iy0+.07,-.25],[-.9,2.005,-.248],[-.5,2.005,-.24],[-.25,2.0,-.19]],.014,foam);
 insides.push(lineIn1,lineIn2);
 const bundle=[[-.26,2.02,-.20],[.0,2.02,-.20],[.06,1.98,-.21],[.075,1.8,-.23],[.075,.6,-.235],[.08,.36,-.24],[.16,.27,-.26],[.35,.25,-.265],[1.0,.25,-.265],[1.30,.25,-.25],[1.33,.24,-.15]];
 const lineOut=tubeAlong(model,bundle,.04,tape,12);
 const split1=[[1.33,.24,-.15],[1.35,.23,-.05],[1.35,.23,.02]],split2=[[1.33,.24,-.15],[1.365,.31,-.06],[1.35,.31,.02]];
 const lo1=tubeAlong(model,split1,.02,foam),lo2=tubeAlong(model,split2,.015,foam);
 tubeAlong(model,[[1.35,.23,.02],[1.32,.23,.02],[1.29,.23,.02]],.005,copper);tubeAlong(model,[[1.35,.31,.02],[1.32,.31,.02],[1.29,.31,.02]],.0065,copper);
 tubeAlong(model,[[.06,.40,-.215],[.11,.3,-.18],[.14,.12,-.12],[.17,.03,-.05]],.009,hose);
 const pipeParts=[ductIn,lineOut,lo1,lo2,lineIn1,lineIn2];

 /* ---------- air: streaks for warmed, cooled and drawn-in air */
 const streams=[];const add=(n,kind,fn)=>{for(let i=0;i<n;i++)streams.push({kind,fn,seed:i+streams.length*1.7,ph:rnd(i,kind.length*3+streams.length)})};
 const iOut=(p,t,s,heat)=>{const u=rnd(s,1),j=rnd(s,2)-.5;const x=ix0+.06+u*(IW-.12),y=iy0+.04,z=iz0+.15;if(heat)p.set(x+j*.12*t,y-1.15*t-.15*t*t,z+.25*t+.38*t*t);else p.set(x+j*.18*t,y-.12*t-.5*t*t,z+1.45*t);return heat?[0,-1.3,.6]:[0,-.4,1.4]};
 const iIn=(p,t,s)=>{const u=rnd(s,3);const x=ix0+.07+u*(IW-.14);p.set(x,iy0+.29+.42*(1-t),iz0+.32-.22*t);return [0,-.42,-.22]};
 const oOut=(p,t,s)=>{const a=rnd(s,4)*Math.PI*2,r=.05+rnd(s,5)*.13;const x=ox0+fx+Math.cos(a)*r,y=oy0+fy+Math.sin(a)*r;p.set(x+Math.cos(a)*.28*t,y+Math.sin(a)*.18*t+.08*t,oz0+OD+.03+1.15*t);return [Math.cos(a)*.28,.08,1.15]};
 const oIn=(p,t,s)=>{const side=rnd(s,6)<.6;if(side){const y=oy0+.06+rnd(s,7)*(OH-.12),z=oz0+.04+rnd(s,8)*(OD-.08);p.set(ox0-.6+.6*t,y,z);return [.6,0,0]}const x=ox0+.04+rnd(s,9)*.52;p.set(x,oy0+OH+.38-.6*t,oz0-.055);return [0,-.6,0]};
 add(narrow0?60:84,'iOut',iOut);add(narrow0?24:34,'iIn',iIn);add(narrow0?56:78,'oOut',oOut);add(narrow0?34:48,'oIn',oIn);
 const air=new T.InstancedMesh(new T.SphereGeometry(1,10,8),new T.MeshBasicMaterial({toneMapped:false,transparent:true,opacity:.9,depthWrite:false}),streams.length);air.frustumCulled=false;air.userData.noAO=true;air.instanceMatrix.setUsage(T.DynamicDrawUsage);air.renderOrder=4;scene.add(air);
 const cWarm=new T.Color(WARM),cCool=new T.Color(COOL),cRoom=new T.Color(ROOM),tp=new T.Vector3(),tq=new T.Quaternion(),ts=new T.Vector3(),tm=new T.Matrix4(),up=new T.Vector3(0,0,1),dv=new T.Vector3();
 let airTime=0;
 function placeAir(){const heat=state.mode==='heating';streams.forEach((s,i)=>{const life=s.kind==='iIn'||s.kind==='oIn'?3.2:2.6;const t=((airTime/life+s.ph)%1);const d=s.fn(tp,t,s.seed,heat);dv.set(...d).normalize();tq.setFromUnitVectors(up,dv);const k=Math.sin(Math.PI*t);const r=(s.kind.endsWith('In')?.0065:.0085)*(.55+.45*k);ts.set(r,r,r*(s.kind.endsWith('In')?3.2:4.2));tm.compose(tp,tq,ts);air.setMatrixAt(i,tm);air.setColorAt(i,s.kind==='iOut'?(heat?cWarm:cCool):s.kind==='oOut'?(heat?cCool:cWarm):cRoom)});air.instanceMatrix.needsUpdate=true;if(air.instanceColor)air.instanceColor.needsUpdate=true}

 /* ---------- shadows, AO, post */
 model.traverse(o=>{if(o.isMesh){const m=o.material;const tr=m.transparent;o.castShadow=!tr;o.receiveShadow=true}});
 const rt=new T.WebGLRenderTarget(2,2,{type:T.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,camera));
 const gtao=new GTAOPass(scene,camera,2,2,undefined,{radius:.3,distanceExponent:1.5,thickness:1,scale:1,samples:12,distanceFallOff:1,screenSpaceRadius:false});gtao.blendIntensity=.9;composer.addPass(gtao);composer.addPass(new OutputPass());
 gtao._overrideVisibility=function(){const cache=this._visibilityCache;scene.traverse(o=>{if(!o.visible)return;if(o.isPoints||o.isLine||(o.isMesh&&(o.userData.noAO||o.material.transparent))){o.visible=false;cache.push(o)}})};
 const bg=new T.Color();
 function readTheme(){const dark=document.documentElement.dataset.theme==='dark';bg.set(dark?'#1d1b18':'#e6e5e2');scene.background=bg;host.dataset.theme3d=dark?'dark':'light';dirty=true;wake()}
 new MutationObserver(readTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

 /* ---------- labels with leader lines */
 const overlay=document.createElement('div');overlay.className='scene-labels';host.append(overlay);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.append(svg);
 const A=(x,y,z)=>new T.Vector3(x,y,z);
 const defs=[
  {part:'indoor',a:A(ix0+.3,iy0+.18,iz0+.215),title:'Indoor unit',sub:()=>state.mode==='heating'?'Coil works as the condenser: releases heat':'Coil works as the evaporator: absorbs heat'},
  {part:'outdoor',a:A(ox0+.7,oy0+.42,oz0+OD+.005),title:'Outdoor unit',sub:()=>state.mode==='heating'?'Coil works as the evaporator: absorbs heat':'Coil works as the condenser: releases heat'},
  {part:'pipes',a:A(.075,1.3,-.195),title:'Insulated refrigerant lines',sub:()=>'Refrigerant only; no air passes through'},
  {a:A(-.13,1.25,zB),title:'External wall, cut away',sub:()=>'Plasterboard, insulated frame, cavity, brick',wide:true},
  {part:'compressor',a:A(ox0+OW+.02,oy0+.17,oz0+OD-.08),title:'Service valves',wide:true},
  {part:'compressor',a:A(ox0+.70,oy0+.20,oz0+.15+.07),title:'Compressor',inside:true},
  {part:'compressor',a:A(ox0+.70,oy0+.39,oz0+.19),title:'Reversing valve',inside:true},
  {part:'compressor',a:A(ox0+.775,oy0+.36,oz0+.24),title:'Expansion valve',inside:true,wide:true},
  {part:'indoor',a:A(ix0+.5,iy0+.135,iz0+.13),title:'Crossflow fan',inside:true,wide:true},
  {part:'indoor',a:A(ix0+.62,iy0+.18,iz0+.19),title:'Finned coil',inside:true},
  {region:true,a:A(-1.15,H+.16,-.3),title:'INDOORS'},{region:true,a:A(.95,H+.16,-.3),title:'OUTDOORS'}
 ];
 for(const d of defs){const el=document.createElement(d.part?'button':'span');el.className='scene-label'+(d.region?' region':'');if(d.part){el.type='button';el.tabIndex=-1;el.addEventListener('click',()=>onPart(d.part))}const t=document.createElement('b');t.textContent=d.title;el.append(t);if(d.sub){d.subEl=document.createElement('small');el.append(d.subEl)}overlay.append(el);d.el=el;if(!d.region){d.line=document.createElementNS('http://www.w3.org/2000/svg','path');d.dot=document.createElementNS('http://www.w3.org/2000/svg','circle');d.dot.setAttribute('r','3.2');svg.append(d.line,d.dot)}}
 function syncLabelText(){for(const d of defs)if(d.subEl){const s=d.sub();if(d.subEl.dataset.en!==s){d.subEl.dataset.en=s;d.subEl.textContent=s}}}
 const wp=new T.Vector3();
 function layoutLabels(){const w=host.clientWidth,h=host.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const narrow=w<600;const top=narrow?34:48,bottom=h-8;
  const cols={l:[],r:[]},regions=[];
  for(const d of defs){let on=!(narrow&&d.wide)&&(d.inside?state.cutaway:true)&&!(d.cover&&state.cutaway);if(on){wp.copy(d.a).project(camera);d.px=(wp.x*.5+.5)*w;d.py=(-wp.y*.5+.5)*h;if(wp.z>1||d.px<6||d.px>w-6||d.py<4||d.py>h-4)on=false}
   d.el.hidden=!on;if(d.line)d.line.style.display=d.dot.style.display=on?'':'none';d.el.classList.toggle('active',!!d.part&&d.part===state.part&&!d.region);
   if(!on)continue;if(d.region){regions.push(d);continue}
   d.w=d.el.offsetWidth;d.h=d.el.offsetHeight;(d.px<w/2?cols.l:cols.r).push(d)}
  for(const side of ['l','r']){const c=cols[side].sort((a,b)=>a.py-b.py);let y=top;for(const d of c){d.y=Math.max(y,d.py-d.h/2);y=d.y+d.h+6}let lim=bottom;for(let i=c.length-1;i>=0;i--){const d=c[i];if(d.y+d.h>lim)d.y=lim-d.h;lim=d.y-6}
   for(const d of c){const x=side==='l'?10:w-10-d.w;
    // never let a callout sit on top of the part it names: lift it above (or drop it below) the anchor
    if(x<d.px+20&&x+d.w>d.px-60&&d.y<d.py+16&&d.y+d.h>d.py-16){const up=d.py-18-d.h;d.y=up>=top-10?up:d.py+18}
    d.el.style.transform=`translate(${Math.round(x)}px,${Math.round(d.y)}px)`;const ex=side==='l'?x+d.w:x,ey=d.y+Math.min(d.h/2,14),mx=side==='l'?Math.min(d.px-10,ex+22):Math.max(d.px+10,ex-22);d.line.setAttribute('d',`M${ex} ${ey}H${mx}L${d.px} ${d.py}`);d.dot.setAttribute('cx',d.px);d.dot.setAttribute('cy',d.py);d.x=x}}
  // region tags yield to callouts
  const boxes=[...cols.l,...cols.r];for(const d of regions){const rw=d.el.offsetWidth,rh=d.el.offsetHeight,rx=d.px-rw/2,ry=Math.max(4,d.py-rh/2);const hit=boxes.some(b=>rx<b.x+b.w&&rx+rw>b.x&&ry<b.y+b.h&&ry+rh>b.y);d.el.hidden=hit;d.el.style.transform=`translate(${Math.round(rx)}px,${Math.round(ry)}px)`}}

 /* ---------- camera */
 const views={overview:[[-.12,1.22,.05],.24,.16,6.6],indoor:[[-1.22,1.82,-.15],.22,.08,2.35],outdoor:[[.86,.45,-.02],.36,.18,2.6],pipes:[[-.3,1.15,-.1],.45,.15,5.3],compressor:[[1.0,.38,-.03],.78,.3,1.95]};
 let tween=null;
 function pose([t,az,el,dist]){const w=host.clientWidth,h=host.clientHeight||1,aspect=w/h;const d=dist*(aspect<1.35?Math.min(1.9,1.4/aspect):1);return {t:new T.Vector3(...t),p:new T.Vector3(t[0]+d*Math.cos(el)*Math.sin(az),t[1]+d*Math.sin(el),t[2]+d*Math.cos(el)*Math.cos(az))}}
 let current='overview';
 function go(name,instant){current=name;const to=pose(views[name]);if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){camera.position.copy(to.p);controls.target.copy(to.t);controls.update();tween=null;dirty=true;wake();return}tween={t0:performance.now(),dur:950,fp:camera.position.clone(),ft:controls.target.clone(),...to};wake()}
 controls.addEventListener('start',()=>{tween=null});

 /* ---------- state sync */
 const glowWarm=new T.Color(WARM),glowCool=new T.Color(COOL),glowPick=new T.Color('#f0a040');
 let flapAngle=-.9;
 function sync(){const heat=state.mode==='heating';
  for(const c of covers)c.visible=!state.cutaway;for(const c of insides)c.visible=state.cutaway;
  finIndoor.emissive.copy(heat?glowWarm:glowCool);finIndoor.emissiveIntensity=.22;
  for(const m of [finRear,finSide]){m.emissive.copy(heat?glowCool:glowWarm);m.emissiveIntensity=.16}
  for(const m of hl.pipes){m.emissive.copy(glowPick);m.emissiveIntensity=state.part==='pipes'?.1:0}
  syncLabelText();host.dataset.mode=state.mode;dirty=true;wake()}
 function focus(part){go(views[part]?part:'overview')}
 function reset(){go('overview')}

 /* ---------- loop */
 let raf=0,last=0,visible=true,dirty=true,drawing=false;
 function frame(now){raf=0;if(!visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  if(tween){const k=Math.min(1,(now-tween.t0)/tween.dur),e=ease(k);camera.position.lerpVectors(tween.fp,tween.p,e);controls.target.lerpVectors(tween.ft,tween.t,e);drawing=true;controls.update();drawing=false;if(k>=1)tween=null;dirty=true}
  const targetFlap=state.mode==='heating'?-1.05:-.3;if(Math.abs(flapAngle-targetFlap)>.002){flapAngle+=(targetFlap-flapAngle)*Math.min(1,dt*4);dirty=true}flapPivot.rotation.x=-flapAngle;
  if(state.playing){airTime+=dt;fanO.rotation.z-=dt*9;for(const f of indoorFans)f.rotation.x-=dt*14;dirty=true}
  if(dirty){placeAir();composer.render();layoutLabels();dirty=false;window.__labFrames=(window.__labFrames||0)+1}
  if(state.playing||tween||Math.abs(flapAngle-targetFlap)>.002)raf=requestAnimationFrame(frame)}
 function wake(){if(!raf&&visible&&!document.hidden){last=0;raf=requestAnimationFrame(frame)}}
 controls.addEventListener('change',()=>{if(drawing)return;dirty=true;wake()});
 const ro=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);composer.setSize(w,h);gtao.enabled=w>=600;camera.aspect=w/h;camera.updateProjectionMatrix();if(!tween)go(current,true);dirty=true;wake()});ro.observe(host);
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible){dirty=true;wake()}},{threshold:0}).observe(host);
 document.addEventListener('visibilitychange',wake);window.addEventListener('explainer-languagechange',()=>{dirty=true;wake()});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();onLost?.()});
 renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Home'){e.preventDefault();reset()}});
 readTheme();go('overview',true);sync();
 return {sync,reset,focus};
}
