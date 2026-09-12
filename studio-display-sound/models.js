import * as THREE from 'three';
import {referenceInternals} from './reference-internals.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function rounded(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function plate(parent,w,h,d,r,mat,x=0,y=0,z=0){const g=new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:10});g.translate(0,0,-d/2);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);parent.add(m);return m}
function block(parent,w,h,d,mat,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m}
function cylinder(parent,r,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,40),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);parent.add(m);return m}
function path(parent,points,color,opacity=1){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>V(...p)));const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,toneMapped:false}));parent.add(m);return m}
export function label(parent,text,pos,color='#354d5c',size=.27){const c=document.createElement('canvas');c.width=1024;c.height=100;const ctx=c.getContext('2d');ctx.font='500 44px -apple-system, sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,512,65);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));m.scale.set(size*10.24,size,1);m.position.set(...pos);parent.add(m);return m}
export function makeModels(scene){
 const metal=new THREE.MeshStandardMaterial({color:'#b9bfc5',metalness:.87,roughness:.24});
 const graphite=new THREE.MeshStandardMaterial({color:'#272c30',metalness:.12,roughness:.56});
 const edge=new THREE.MeshStandardMaterial({color:'#0d1318',metalness:.15,roughness:.38});
 const rubber=new THREE.MeshStandardMaterial({color:'#11171c',metalness:.03,roughness:.86});
 const cone=new THREE.MeshStandardMaterial({color:'#343d45',metalness:.23,roughness:.4});
 const blue=new THREE.MeshStandardMaterial({color:'#23647c',metalness:.28,roughness:.32});
 const copper=new THREE.MeshStandardMaterial({color:'#b27143',metalness:.54,roughness:.33});
 const silver=new THREE.MeshStandardMaterial({color:'#ced2d0',metalness:.78,roughness:.32});
 const product=new THREE.Group();scene.add(product);
 plate(product,6.23,3.62,.1,.07,metal,0,.8,-.14);
 // Thin continuous rim and separate glass stack; the cutaway removes only the panel.
 const frameShape=rounded(6.23,3.62,.07);frameShape.holes.push(rounded(6.08,3.47,.035));
 const frame=new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape,{depth:.24,bevelEnabled:false,curveSegments:10}),metal);frame.position.set(0,.8,-.13);product.add(frame);
 const panel=new THREE.Group();product.add(panel);plate(panel,6.11,3.50,.035,.035,edge,0,.8,.15);
 const glass=new THREE.MeshPhysicalMaterial({color:'#102332',metalness:.4,roughness:.2,clearcoat:1,clearcoatRoughness:.07});
 plate(panel,5.95,3.34,.012,.013,glass,0,.8,.177);
 cylinder(panel,.025,.008,new THREE.MeshBasicMaterial({color:'#041016'}),0,2.535,.201);cylinder(panel,.008,.009,blue,.006,2.54,.206);
 const screenWaves=new THREE.Group();panel.add(screenWaves);for(let j=0;j<4;j++){const points=[];for(let i=0;i<180;i++){const x=-2.91+i/179*5.82;points.push([x,.8+Math.sin(x*1.7+j*.58)*(.65+j*.08),.201])}path(screenWaves,points,['#174659','#23667a','#377f92','#5a9fac'][j],.5)}
 const stand=plate(product,.89,1.38,.12,.035,metal,0,-1.36,-.24);stand.rotation.x=-.22;
 const foot=plate(product,2.18,1.47,.055,.045,metal,0,-2.02,.2);foot.rotation.x=Math.PI/2;
 cylinder(product,.34,.35,metal,0,-.64,-.2);
 const reference=referenceInternals(product);const {chambers,drivers}=reference;
 const anatomyLabels=new THREE.Group();product.add(anatomyLabels);label(anatomyLabels,'L',[-2.65,2.83,.1]);label(anatomyLabels,'R',[2.65,2.83,.1]);
 // One enlarged conceptual opposed woofer pair, separated along the common motion axis.
 const force=new THREE.Group();scene.add(force);const cage=plate(force,.62,1.65,.42,.15,edge);cage.rotation.z=-Math.PI/2;
 const moving=[];for(const sign of [-1,1]){const g=new THREE.Group();g.position.z=sign*.5;force.add(g);plate(g,1.67,.64,.045,.14,rubber);const face=plate(g,1.45,.48,.035,.1,blue,0,0,sign*.035);plate(g,1.0,.06,.02,.025,edge,0,0,sign*.064);moving.push(g)}
 const arrows=[new THREE.ArrowHelper(V(0,0,1),V(0,0,.65),.8,0x226b85,.14,.1),new THREE.ArrowHelper(V(0,0,-1),V(0,0,-.65),.8,0xb6713d,.14,.1)];arrows.forEach(a=>force.add(a));
 const forceLabels=new THREE.Group();force.add(forceLabels);label(forceLabels,'A',[0,.7,.57],'#23647c',.27);label(forceLabels,'B',[0,.7,-.57],'#9b5d32',.27);
 // Plane waves are drawn in spatial coordinates; time is deliberately slowed to one visible cycle.
 const air=new THREE.Group();scene.add(air);const waves=[];for(let i=0;i<9;i++){const pts=[];for(let a=0;a<=100;a++){const th=a/100*Math.PI;pts.push([Math.cos(th),-.93,Math.sin(th)])}const l=path(air,pts,'#397b93',.3);waves.push(l)}
 // Plan-view geometry in units of 0.1 m: sources, ears, and all four acoustic paths.
 const spatial=new THREE.Group();scene.add(spatial);block(spatial,6.23,.3,.28,metal,0,.15,0);
 const sourcePos=[[-2.4,.22,.22],[2.4,.22,.22]];for(const p of sourcePos){const s=new THREE.Mesh(new THREE.SphereGeometry(.10,20,12),blue);s.position.set(...p);spatial.add(s)}
 const head=new THREE.Group();spatial.add(head);const hm=new THREE.Mesh(new THREE.SphereGeometry(.78,32,24),new THREE.MeshStandardMaterial({color:'#adb8bd',metalness:.12,roughness:.6}));hm.scale.set(1,.45,1.13);head.add(hm);const nose=new THREE.Mesh(new THREE.ConeGeometry(.12,.27,12),metal);nose.rotation.x=-Math.PI/2;nose.position.z=-.85;head.add(nose);for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.105,16,12),copper);e.position.set(s*.9,0,0);head.add(e)}
 const lines=[];for(let s=0;s<2;s++)for(let e=0;e<2;e++)lines.push(path(spatial,[sourcePos[s],[e? .9:-.9,.22,7.72]],s?'#b27143':'#23647c',.8));
 const grid=new THREE.GridHelper(16,16,0xb7c4cb,0xd5dfe4);grid.position.set(0,-.06,4);spatial.add(grid);
 const spatialLabels=new THREE.Group();spatial.add(spatialLabels);label(spatialLabels,'L',[-2.4,.2,-.6]);label(spatialLabels,'R',[2.4,.2,-.6]);
 function update(st){
  product.visible=st.stage===0||st.stage===2;force.visible=st.stage===1;air.visible=st.stage===2;spatial.visible=st.stage===3;
  panel.visible=!st.cutaway;anatomyLabels.visible=st.cutaway&&st.stage===0;reference.update(st);
  const sine=Math.sin(st.phase*Math.PI*2);moving[0].position.z=-.62-.12*(1-st.mismatch/100)*sine;moving[1].position.z=.62+.12*sine;
  for(let i=0;i<2;i++){const sign=i?-1:1,amp=i?1-st.mismatch/100:1;arrows[i].setDirection(V(0,0,sign*(sine>=0?1:-1)));arrows[i].setLength(Math.max(.001,Math.abs(sine)*amp*.85),.12,.08);arrows[i].visible=Math.abs(sine)*amp>.02;}
  const wavelength=343/st.frequency*10;for(let i=0;i<waves.length;i++){const rad=(i+st.phase)*wavelength;waves[i].scale.set(rad,1,rad);waves[i].visible=rad>1&&rad<18;waves[i].material.opacity=.32*(1-rad/22)}
  head.position.set(st.listener*10,.22,7.72);for(let s=0;s<2;s++)for(let e=0;e<2;e++){const p=lines[s*2+e].geometry.attributes.position;p.setXYZ(1,st.listener*10+(e?.9:-.9),.22,7.72);p.needsUpdate=true;lines[s*2+e].geometry.computeBoundingSphere()}
 }
 return {product,force,spatial,air,panel,update,drivers,chambers};
}
