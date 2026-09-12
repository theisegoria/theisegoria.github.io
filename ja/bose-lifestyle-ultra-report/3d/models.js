import * as T from 'three';

const palette = {metal:0x949590, rubber:0x242525, cone:0x3b3d3c, accent:0x4d9482, copper:0xb9874b};
const material = (color, roughness=.6, metalness=0) => new T.MeshStandardMaterial({color,roughness,metalness});
const v = (x,y,z) => new T.Vector3(x,y,z);
export function mesh(geometry, mat, parent, x=0,y=0,z=0) {
  const item=new T.Mesh(geometry,mat);item.position.set(x,y,z);parent.add(item);return item;
}
function cyl(r,h,mat,parent,x=0,y=0,z=0){return mesh(new T.CylinderGeometry(r,r,h,64),mat,parent,x,y,z);}
function capsuleGeometry(radius,height,extension=.23){
  const g=new T.CylinderGeometry(radius,radius,height,96),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const z=p.getZ(i);if(Math.abs(z)>1e-6)p.setZ(i,z+Math.sign(z)*extension);}
  return g;
}
function roundedRect(width,height,radius){
  const s=new T.Shape(),x=-width/2,y=-height/2,r=radius;
  s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);s.lineTo(x+width,y+height-r);s.quadraticCurveTo(x+width,y+height,x+width-r,y+height);s.lineTo(x+r,y+height);s.quadraticCurveTo(x,y+height,x,y+height-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function slot(w,h,r,depth,mat,parent,x,y,z){return mesh(new T.ExtrudeGeometry(roundedRect(w,h,r),{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:12}),mat,parent,x,y,z);}
function fabricTexture(){
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');ctx.fillStyle='#bcbcbc';ctx.fillRect(0,0,128,128);
  for(let y=-8;y<136;y+=8)for(let x=-8;x<136;x+=8){
    const dx=x+(y%16?4:0);ctx.fillStyle='#898989';ctx.beginPath();ctx.ellipse(dx,y,2.5,3.5,-.6,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#dddddd';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(dx-3,y+1);ctx.lineTo(dx+2,y-3);ctx.stroke();
  }
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(10,6);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
}
function latheShell(isBose,start=0,length=Math.PI*2){
  const pts=isBose?[[.50,.14],[.59,.17],[.605,.20],[.605,1.77],[.60,1.805]]:[[.49,.015],[.60,.052],[.68,.135],[.71,.28],[.71,1.37],[.69,1.49],[.645,1.585],[.575,1.657],[.558,1.67]];
  const curve=new T.CatmullRomCurve3(pts.map(p=>v(p[0],p[1],0)));
  const g=new T.LatheGeometry(curve.getPoints(60).map(p=>new T.Vector2(p.x,p.y)),128,start,length);
  const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setY(i,p.getY(i)/(isBose?1.84:1.68));
  if(isBose){for(let i=0;i<p.count;i++){const z=p.getZ(i);if(Math.abs(z)>1e-6)p.setZ(i,z+Math.sign(z)*.23);}}return g;
}
function mark(group,key){group.traverse(o=>{o.userData.component=key;});}
function driver(radius,parent,pos,orientation=[0,0,0],key='woofer'){
  const group=new T.Group();group.position.set(...pos);group.rotation.set(...orientation);parent.add(group);
  const frame=material(palette.metal,.36,.65), rubber=material(palette.rubber,.85), diaphragm=material(palette.cone,.7,.12);
  const back=cyl(radius*.59,radius*.12,frame,group,0,0,-radius*.46);back.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const strut=mesh(new T.BoxGeometry(radius*.12,radius*.10,radius*.52),frame,group,Math.cos(a)*radius*.73,Math.sin(a)*radius*.73,-radius*.22);strut.rotation.z=a;}
  const magnet=cyl(radius*.66,radius*.48,material(0x333b36,.46,.3),group,0,0,-radius*.76);magnet.rotation.x=Math.PI/2;
  const magnetCap=cyl(radius*.64,radius*.055,material(0x9b9e93,.37,.8),group,0,0,-radius*1.025);magnetCap.rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(radius*.91,radius*.075,12,64),frame,group);
  const moving=new T.Group();group.add(moving);
  mesh(new T.TorusGeometry(radius*.81,radius*.08,14,64),rubber,moving,0,0,.008);
  const pts=[[0,-radius*.24],[radius*.25,-radius*.24],[radius*.48,-radius*.13],[radius*.78,0]];
  const cone=mesh(new T.LatheGeometry(pts.slice().reverse().map(p=>new T.Vector2(...p)),64),diaphragm,moving);cone.rotation.x=Math.PI/2;
  const dome=mesh(new T.SphereGeometry(radius*.29,32,16),rubber,moving,0,0,-radius*.19);dome.scale.z=.44;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const bolt=cyl(radius*.026,.017,material(0x939b92,.3,.8),group,Math.cos(a)*radius*.92,Math.sin(a)*radius*.92,.025);bolt.rotation.x=Math.PI/2;}
  mark(group,key);return {group,moving,base:group.position.clone()};
}
function board(parent,y){
  const g=new T.Group();parent.add(g);g.position.set(0,y,-.27);
  mesh(new T.BoxGeometry(.53,.37,.035),material(0x386a58,.72),g);
  mesh(new T.BoxGeometry(.18,.15,.025),material(0x292d2c,.6),g,0,0,.03);
  for(let i=0;i<7;i++){mesh(new T.BoxGeometry(.015,.08,.01),material(palette.copper,.3,.8),g,-.21+i*.07,-.10,.023);}
  mark(g,'processing');return g;
}
function textTexture(text,color='#cfd2c8'){
  const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font="斜体太字36px Arial";ctx.textAlign='center';ctx.fillText(text,128,43);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
}

export function buildSpeaker(product){
  const bose=product==='bose',root=new T.Group(),shell=new T.Group(),interior=new T.Group(),top=new T.Group();
  root.add(shell,interior,top);
  const fabric=material(0xe6e4da,.93),bump=fabricTexture();fabric.bumpMap=bump;fabric.map=bump;fabric.bumpScale=.009;fabric.side=T.DoubleSide;
  const plastic=material(0x343b37,.55,.06);
  const full=new T.Group(),cut=new T.Group();shell.add(full,cut);cut.visible=false;
  if(bose){mesh(latheShell(true,-Math.PI*.56,Math.PI*1.12),fabric,full);mesh(latheShell(true,Math.PI*.56,Math.PI*.88),plastic,full);mesh(latheShell(true,Math.PI/2,Math.PI),plastic,cut);}else{mesh(latheShell(false),fabric,full);mesh(latheShell(false,Math.PI/2,Math.PI),fabric,cut);}
  const trim=material(0xd4d4cb,.48,.15),height=bose?1.84:1.68;
  const cap=bose?mesh(capsuleGeometry(.588,.035),trim,top,0,height-.025,0):cyl(.558,.026,trim,top,0,height-.026,0);
  const base=bose?mesh(capsuleGeometry(.49,.09),plastic,root,0,.065,0):cyl(.49,.045,material(0x747d71,.9),root,0,.016,0);
  if(bose){const lip=mesh(capsuleGeometry(.555,.07),plastic,shell,0,.13,0);lip.userData.exteriorOnly=true;}
  if(bose){
    const grille=cyl(.38,.006,plastic,top,0,height-.003,.35);
    const holeGeo=new T.CircleGeometry(.0047,6),holeMat=new T.MeshBasicMaterial({color:0x101914,side:T.DoubleSide});
    const positions=[];for(let x=-.35;x<=.35;x+=.018)for(let z=-.35;z<=.35;z+=.018)if(x*x+z*z<.35*.35)positions.push([x,z]);
    const holes=new T.InstancedMesh(holeGeo,holeMat,positions.length),matrix=new T.Matrix4(),q=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0));
    positions.forEach(([x,z],i)=>{matrix.compose(v(x,height+.001,.35+z),q,v(1,1,1));holes.setMatrixAt(i,matrix);});top.add(holes);
    const panel=cyl(.255,.006,plastic,top,0,height-.003,-.4);
    const ring=mesh(new T.TorusGeometry(.257,.004,6,96),trim,top,0,height+.001,-.4);ring.rotation.x=-Math.PI/2;
    for(let i=-1;i<=1;i++)mesh(new T.BoxGeometry(.032,.003,.006),material(0xb7bcb1,.5),top,i*.18,height+.006,-.4);
    mesh(new T.BoxGeometry(.006,.003,.032),material(0xb7bcb1,.5),top,.18,height+.006,-.4);
    const symbols=mesh(new T.PlaneGeometry(.86,.19),new T.MeshBasicMaterial({map:textTexture('ᛒ       ○       ⊘','#a9b1a5'),transparent:true,depthWrite:false}),top,0,height+.003,-.045);symbols.rotation.x=-Math.PI/2;
    const logo=mesh(new T.PlaneGeometry(.30,.075),new T.MeshBasicMaterial({map:textTexture('BOSE'),transparent:true,depthWrite:false}),shell,0,.36,.85);
    logo.userData.exteriorOnly=true;
  }else{
    const touch=cyl(.537,.008,material(0xd9ddd5,.25,.08),top,0,1.645,0);
    for(const x of [-.31,.31])mesh(new T.BoxGeometry(.075,.003,.009),material(0x7f897f,.5),top,x,1.652,0);
    mesh(new T.BoxGeometry(.009,.003,.075),material(0x7f897f,.5),top,.31,1.652,0);
  }
  mark(shell,'enclosure');mark(top,'enclosure');
  const drivers=[];
  if(bose){
    drivers.push(driver(.43,interior,[0,.73,.54],[0,0,0],'woofer'));
    drivers.push(driver(.16,interior,[0,1.37,.59],[0,0,0],'tweeters'));
    drivers.push(driver(.22,interior,[0,1.66,.27],[-Math.PI/2,0,0],'height'));
  }else{
    drivers.push(driver(.565,interior,[0,1.34,0],[-Math.PI/2,0,0],'woofer'));
    // The published cutaway exposes the circular backs; horns turn toward the base.
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const d=driver(.137,interior,[.40*Math.sin(a),.25,.40*Math.cos(a)],[0,0,0],'tweeters');d.group.quaternion.setFromUnitVectors(v(0,0,1),v(-.66*Math.sin(a),-.75,-.66*Math.cos(a)).normalize());
      const horn=mesh(new T.CylinderGeometry(.12,.17,.15,32,1,true),material(0x2c332e,.8),interior,.46*Math.sin(a),.115,.46*Math.cos(a));horn.userData.component='tweeters';drivers.push(d);}
  }
  const dsp=board(interior,bose?.3:1.56);dsp.visible=!bose;
  if(!bose){dsp.rotation.x=-Math.PI/2;dsp.position.z=0;
    const amp=cyl(.53,.045,material(0x365b45,.7),interior,0,.55,0);mark(amp,'processing');
    for(let i=-7;i<=7;i++){const fin=mesh(new T.BoxGeometry(.016,.14,.53),material(0x777b71,.38,.7),interior,i*.047,.48,-.015);mark(fin,'processing');}
    const magnet=drivers[0].group;const boot=cyl(.40,.32,material(0x262e27,.7),magnet,0,0,-.51);boot.rotation.x=Math.PI/2;mark(boot,'woofer');
  }
  const microphone=new T.Group();microphone.position.set(.34,.76,.31);interior.add(microphone);
  const mic=cyl(.047,.032,material(palette.copper,.45,.6),microphone);mic.rotation.x=Math.PI/2;
  for(let i=-1;i<=1;i++)mesh(new T.SphereGeometry(.005,8,6),material(0x16201e),microphone,i*.012,0,.019);
  mark(microphone,'sensing');microphone.visible=!bose;
  const port=new T.Group();root.add(port);
  if(bose){
    const curve=new T.CatmullRomCurve3([v(0,1.55,-.19),v(0,1.62,-.44),v(0,1.45,-.57),v(0,1.03,-.50),v(0,.74,-.57),v(0,.51,-.76)]);
    const duct=mesh(new T.TubeGeometry(curve,48,.15,24,false),material(0x414344,.58,.12),port);duct.scale.x=1.55;
    slot(.61,.235,.08,.018,plastic,port,0,.51,-.843);
    slot(.51,.15,.045,.015,material(0x101813,.99),port,0,.51,-.867);
    mark(port,'port');
  }
  const connectors=new T.Group();shell.add(connectors);
  if(bose){slot(.14,.068,.028,.013,material(0x171f1b,.9),connectors,0,.11,-.746);for(const x of [-.028,.028]){const pin=cyl(.009,.02,material(0xaab1a4,.3,.8),connectors,x,.11,-.763);pin.rotation.x=Math.PI/2;}const aux=cyl(.018,.02,material(0x1b211e,.9),connectors,0,.245,-.827);aux.rotation.x=Math.PI/2;}
  else {const wire=new T.CatmullRomCurve3([v(0,.16,-.65),v(0,.13,-.84),v(.15,.01,-1.0),v(.32,-.012,-1.09)]);mesh(new T.TubeGeometry(wire,24,.024,10,false),material(0xa8aea3,.95),connectors);}
  mark(connectors,'enclosure');
  const allMaterials=new Map();root.traverse(o=>{if(o.material?.emissive&&!allMaterials.has(o.material))allMaterials.set(o.material,o.material.color.clone());});
  const update=(state)=>{
    const open=state.chapter==='inside'||state.chapter==='bass';full.visible=!open;cut.visible=open;
    top.visible=!open||state.explode>0;shell.children.forEach(o=>{if(o.userData.exteriorOnly)o.visible=!open;});
    interior.visible=open;port.visible=bose;
    const separation=state.chapter==='inside'?state.explode/100:0;
    top.position.y=separation*.65;
    drivers.forEach((d,i)=>{d.group.position.copy(d.base);if(!bose&&i>0){d.group.position.x*=1+separation*.7;d.group.position.z*=1+separation*.7;}else{d.group.position.y+=separation*(i===0?.15:.45);d.group.position.z+=bose?separation*.28:0;}
      d.moving.position.z=state.chapter==='bass'&&i===0?Math.sin(state.phase*Math.PI*2)*.04:0;
    });
    dsp.position.x=separation*.6;microphone.position.x=.34+separation*.45;
    fabric.color.set(state.finish==='dark'?0x4d4f50:0xf3f0e9);trim.color.set(state.finish==='dark'?0x303132:0xd4d4ce);plastic.color.set(state.finish==='dark'?0x343536:0xbec1bb);
    root.traverse(o=>{if(o.material?.emissive){const selected=open&&o.userData.component===state.component;o.material.emissive.set(selected?0x195641:0x000000);o.material.emissiveIntensity=selected?.055:0;}});
  };
  return {root,update,drivers,dispose:()=>dispose(root),height};
}

export function dispose(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});});
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());root.removeFromParent();
}

export function contactShadow(parent){
  const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,64,8,64,64,64);g.addColorStop(0,'#27382c66');g.addColorStop(.45,'#27382c26');g.addColorStop(1,'#27382c00');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  const shadow=mesh(new T.PlaneGeometry(2.7,2.7),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}),parent,0,-.025,0);shadow.rotation.x=-Math.PI/2;return shadow;
}

export function buildRoom(geometry,placement,ceiling,product){
  const root=new T.Group(),paths=[],labels=[],markers=[];
  const pale=material(0xdfdfd3,.93),floor=material(0xe4e1d5,.9),wall=material(0xd4d9cf,.95);
  mesh(new T.BoxGeometry(3.6,.035,4.25),floor,root,0,-.045,1.02);
  mesh(new T.BoxGeometry(3.6,ceiling,.035),wall,root,0,ceiling/2,-1.12);
  mesh(new T.BoxGeometry(.025,ceiling,4.25),pale,root,-1.81,ceiling/2,1.02);
  // An open ceiling outline preserves visibility of the ray and model.
  const corners=[[-1.8,ceiling,-1.1],[1.8,ceiling,-1.1],[1.8,ceiling,3.15],[-1.8,ceiling,3.15],[-1.8,ceiling,-1.1]];
  const edge=new T.Line(new T.BufferGeometry().setFromPoints(corners.map(p=>v(...p))),new T.LineBasicMaterial({color:0x969d8e}));root.add(edge);
  const sourceZ=geometry.source[2];
  mesh(new T.BoxGeometry(.65,.045,.58),material(0xa29c87,.78),root,0,.775,sourceZ);
  mesh(new T.BoxGeometry(.05,.74,.05),material(0xa29c87,.78),root,-.23,.37,sourceZ-.16);
  mesh(new T.BoxGeometry(.05,.74,.05),material(0xa29c87,.78),root,.23,.37,sourceZ+.16);
  if(placement==='shelf')mesh(new T.BoxGeometry(.95,.045,.73),material(0xaeaa97,.8),root,0,1.175,sourceZ+.1);
  // Listener marker indicates position, not head-related acoustic filtering.
  const [lx,ly,lz]=geometry.listener;
  mesh(new T.SphereGeometry(.085,24,16),material(0x777f6f,.9),root,lx,ly,lz);
  mesh(new T.CylinderGeometry(.07,.13,.32,24),material(0xadb19f,.9),root,lx,ly-.24,lz);
  const line=(points,color)=>{
    const curve=new T.CurvePath();for(let i=0;i<points.length-1;i++)curve.add(new T.LineCurve3(v(...points[i]),v(...points[i+1])));
    mesh(new T.TubeGeometry(curve,64,.011,8,false),new T.MeshBasicMaterial({color}),root);
    const dot=mesh(new T.SphereGeometry(.035,16,12),new T.MeshBasicMaterial({color}),root);markers.push({dot,curve});paths.push(curve);
  };
  line([geometry.source,geometry.listener],0x39877a);
  line(geometry.blocked?[geometry.source,geometry.obstruction]:[geometry.source,geometry.bounce,geometry.listener],geometry.blocked?0xad6951:0xc58447);
  const bounce=geometry.blocked?geometry.obstruction:geometry.bounce;
  mesh(new T.SphereGeometry(.035,16,12),new T.MeshBasicMaterial({color:0xc58447}),root,...bounce);
  labels.push({text:geometry.blocked?"棚の中断高さ経路":product==='bose'?"天井の反射":"説明的周辺反射",point:v(...bounce).add(v(0,.17,0))});
  labels.push({text:"聴き手",point:v(lx,ly+.23,lz)});
  labels.push({text:`天井 · ${ceiling.toFixed(1)} m`,point:v(.95,ceiling+.10,-.7)});
  const update=(phase)=>{markers.forEach(m=>m.dot.position.copy(m.curve.getPoint(phase)));};
  return {root,update,labels,dispose:()=>dispose(root)};
}
