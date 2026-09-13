import * as T from 'three';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

// One scene unit is 10 cm. Overall height, base width and depth follow the
// manufacturer's 42.9 × 17.4 × 24.5 cm graphic. Local contours follow photographs.
export function buildArtModel(scene) {
  const root = new T.Group();
  scene.add(root);
  const shell = new T.Group(), backCover = new T.Group(), internals = new T.Group();
  root.add(shell, backCover, internals);
  const satin = new T.MeshPhysicalMaterial({color:0x111315,roughness:.29,metalness:.02,clearcoat:.15});
  const glossy = new T.MeshPhysicalMaterial({color:0x101214,roughness:.21,metalness:.06,clearcoat:.65,clearcoatRoughness:.13});
  const matte = new T.MeshStandardMaterial({color:0x111314,roughness:.46});
  const chrome = new T.MeshStandardMaterial({color:0xd8dcde,metalness:1,roughness:.15});
  const brushed = new T.MeshStandardMaterial({color:0xc3c8cc,metalness:.93,roughness:.31});
  const pink = new T.MeshStandardMaterial({color:0xc8296c,roughness:.37});
  const brass = new T.MeshStandardMaterial({color:0xc79c50,metalness:.8,roughness:.25});
  const blackRubber = new T.MeshStandardMaterial({color:0x101112,roughness:.68});
  const fading = [];
  function add(geo,mat,pos=[0,0,0],parent=root){const mesh=new T.Mesh(geo,mat);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
  function round(w,h,d,r,mat,pos,parent=root){return add(new RoundedBoxGeometry(w,h,d,5,r),mat,pos,parent)}
  function cylinder(rt,rb,h,mat,pos,parent=root,n=72){return add(new T.CylinderGeometry(rt,rb,h,n),mat,pos,parent)}
  function turn(points,mat,pos,parent=root){const curve=new T.SplineCurve(points.map(p=>new T.Vector2(...p)));const sampled=curve.getPoints(160).map(p=>new T.Vector2(Math.max(0,p.x),p.y));return add(new T.LatheGeometry(sampled,96),mat,pos,parent)}
  function beam(a,b,rt,rb,mat,parent=root){const A=new T.Vector3(...a),B=new T.Vector3(...b);const m=cylinder(rt,rb,A.distanceTo(B),mat,A.clone().add(B).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());return m}
  function outline(w,h,topR,bottomR,taper=.95){const top=w/2,bot=w*taper/2,y=h/2;const s=new T.Shape();s.moveTo(-bot+bottomR,-y);s.lineTo(bot-bottomR,-y);s.quadraticCurveTo(bot,-y,bot,-y+bottomR);s.lineTo(top,y-topR);s.quadraticCurveTo(top,y,top-topR,y);s.lineTo(-top+topR,y);s.quadraticCurveTo(-top,y,-top,y-topR);s.lineTo(-bot,-y+bottomR);s.quadraticCurveTo(-bot,-y,-bot+bottomR,-y);return s}
  function extrude(shape,depth,bevel=.012){return new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:4,steps:1,curveSegments:28})}
  function decal(text,color,w,h,size=56,font='Arial'){const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,96);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}))}

  // Sloped plinth: wider at the floor, with a shallow inset top and rubber feet.
  const base=round(1.74,.20,2.45,.095,glossy,[0,.12,0]);
  const p=base.geometry.attributes.position;
  for(let i=0;i<p.count;i++){const f=1-.095*(p.getY(i)/.20+.5);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f)}
  base.geometry.computeVertexNormals();
  round(1.52,.028,2.18,.05,matte,[0,.224,-.018]);
  for(const x of [-.55,.55])for(const z of [-.85,.85])cylinder(.085,.085,.026,blackRubber,[x,.022,z]);
  const art=decal('Art','#cdd0d1',.27,.15,96,'cursive');art.rotation.y=Math.PI/2;art.position.set(.838,.127,.54);root.add(art);

  // Rear spine inclines gently back at the foot. The shell is black, never metal.
  const spine=round(1.12,3.88,.78,.15,glossy,[0,2.24,-.70],shell);
  const sp=spine.geometry.attributes.position;
  for(let i=0;i<sp.count;i++)sp.setZ(i,sp.getZ(i)-.08*(.5-sp.getY(i)/3.88));
  spine.geometry.computeVertexNormals();
  round(1.06,3.79,.10,.048,satin,[0,2.24,-1.105],backCover);
  round(1.03,2.44,.08,.032,matte,[0,1.52,-.244],shell);
  for(let i=0;i<35;i++)round(.98,.015,.022,.004,satin,[0,.35+i*.065,-.194],shell);

  // Deep head and tapered face: generous top corners, tighter lower corners.
  const faceOutline=outline(1.25,1.53,.225,.075,.93);
  const head=add(extrude(faceOutline,1.58,.025),glossy,[0,3.495,-.91],shell);
  const hp=head.geometry.attributes.position;
  for(let i=0;i<hp.count;i++){const y=hp.getY(i);hp.setZ(i,hp.getZ(i)-.07*(y/1.53+.5));}
  head.geometry.computeVertexNormals();
  // Chrome is a narrow ring at the FRONT, rather than the original silver block.
  const rim=outline(1.25,1.53,.225,.075,.93);
  const inner=outline(1.164,1.441,.195,.053,.935);
  rim.holes.push(new T.Path(inner.getPoints(96)));
  add(extrude(rim,.045,.008),chrome,[0,3.495,.658],shell);
  add(extrude(inner,.028,.006),satin,[0,3.495,.661],shell);
  const logo=decal('sodastream','#dbdfe1',.68,.14,78);logo.position.set(0,2.981,.701);shell.add(logo);

  // Bottle receiver and the slim, dark injection tube visible in source photos.
  cylinder(.382,.382,.177,chrome,[0,2.667,.37]);
  cylinder(.333,.35,.040,blackRubber,[0,2.559,.37]);
  cylinder(.029,.026,.65,matte,[0,2.24,.37]);
  cylinder(.041,.022,.050,matte,[0,1.90,.37]);

  // Substantial horizontal pivot, with concentric metal rings and central socket.
  const pivot=new T.Group();pivot.position.set(.64,3.64,-.53);root.add(pivot);
  const hub=cylinder(.194,.194,.32,chrome,[.14,0,0],pivot);hub.rotation.z=Math.PI/2;
  const gasket=cylinder(.218,.218,.045,blackRubber,[-.014,0,0],pivot);gasket.rotation.z=Math.PI/2;
  const disc=cylinder(.153,.153,.014,brushed,[.308,0,0],pivot);disc.rotation.z=Math.PI/2;
  const ring=new T.Mesh(new T.TorusGeometry(.105,.009,10,64),chrome);ring.rotation.y=Math.PI/2;ring.position.set(.319,0,0);pivot.add(ring);
  const socket=cylinder(.036,.036,.015,matte,[.325,0,0],pivot,6);socket.rotation.z=Math.PI/2;
  const lever=new T.Group();pivot.add(lever);
  beam([.18,.02,.09],[.18,.105,.29],.086,.074,glossy,lever);
  beam([.18,.105,.29],[.18,.435,1.22],.121,.098,glossy,lever);
  beam([.18,.435,1.22],[.18,.443,1.243],.110,.110,chrome,lever);

  const bottle=new T.Group();bottle.position.set(0,.372,.37);root.add(bottle);
  const bottleShape=[[0,0],[.21,.012],[.31,.045],[.367,.13],[.400,.30],[.433,.60],[.442,1.08],[.426,1.52],[.378,1.79],[.28,1.99],[.168,2.12],[.147,2.17],[.147,2.21]];
  const plastic=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.075,metalness:0,transmission:0,transparent:true,opacity:.22,depthWrite:false,thickness:.018,ior:1.49,envMapIntensity:.25,clearcoat:.12,clearcoatRoughness:.08});
  turn(bottleShape,plastic,[0,0,0],bottle);
  turn([[0,0],[.23,.0],[.30,.024],[.341,.092],[.381,.215],[.396,.32]],glossy,[0,0,0],bottle);
  // Colourless water with a subtle meniscus. Its outline follows the Fuse bottle.
  const waterMaterial=new T.MeshPhysicalMaterial({color:0xe8f7fa,roughness:.06,metalness:0,transparent:true,opacity:.29,depthWrite:false,side:T.FrontSide});
  turn([[0,.29],[.378,.29],[.410,.55],[.423,1.0],[.405,1.48],[.37,1.70],[0,1.70]],waterMaterial,[0,0,0],bottle);
  const surface=cylinder(.369,.369,.008,new T.MeshPhysicalMaterial({color:0xe1f3f8,transparent:true,opacity:.30,roughness:.06,depthWrite:false}),[0,1.70,0],bottle);
  const fillMark=decal('— FILL —','#59626b',.28,.085,63);fillMark.position.set(0,1.70,.38);bottle.add(fillMark);
  const bottleLogo=decal('sodastream','#303638',.65,.13,78);bottleLogo.position.set(0,1.30,.447);bottle.add(bottleLogo);

  // Rear internals are constrained by the open-back manufacturer reference.
  turn([[0,0],[.23,0],[.284,.07],[.294,.23],[.294,2.38],[.255,2.57],[.17,2.70],[.128,2.76]],brushed,[0,.30,-.73],internals);
  cylinder(.296,.296,2.10,pink,[0,1.46,-.73],internals);
  cylinder(.105,.116,.20,brass,[0,3.145,-.73],internals,32);
  cylinder(.121,.121,.07,brass,[0,3.11,-.73],internals,6);
  for(const x of [-.207,.207])round(.074,.48,.26,.025,pink,[x,3.20,-.77],internals);
  const latchShape=outline(.54,.53,.16,.05,1);const latchHole=outline(.365,.32,.09,.03,1);latchShape.holes.push(new T.Path(latchHole.getPoints(64)));const latch=add(extrude(latchShape,.055,.008),pink,[0,3.52,-.96],internals);latch.rotation.x=.24;
  const cylLabel=decal('CO₂','#fff4f8',.30,.15,85);cylLabel.rotation.y=Math.PI;cylLabel.position.set(0,1.8,-1.034);internals.add(cylLabel);
  // This tube route is explicitly a teaching model, not a claimed internal CAD path.
  const path=new T.CatmullRomCurve3([new T.Vector3(0,3.25,-.73),new T.Vector3(0,3.61,-.51),new T.Vector3(0,3.30,.37),new T.Vector3(0,1.91,.37)]);
  const gasMat=new T.MeshStandardMaterial({color:0x00adc0,emissive:0x007480,emissiveIntensity:.7,roughness:.4});
  internals.add(new T.Mesh(new T.TubeGeometry(path,64,.025,10,false),gasMat));
  const gasPacket=new T.Mesh(new T.SphereGeometry(.045,14,10),gasMat);internals.add(gasPacket);
  shell.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o!==logo)fading.push(o)}});

  // Bubbles are schematic visual cues, never a dissolved-gas measurement.
  const bubbles=new T.InstancedMesh(new T.SphereGeometry(.011,7,5),new T.MeshStandardMaterial({color:0xf4ffff,roughness:.1,metalness:.08}),110);bottle.add(bubbles);
  const dummy=new T.Object3D();
  function update({inside,busy,presses,step,time,pressPhase,reduced}){
    for(const o of fading){if(o.material.transparent!==inside){o.material.transparent=inside;o.material.needsUpdate=true}o.material.opacity=inside?.065:1;o.material.depthWrite=!inside;o.castShadow=!inside;}
    backCover.visible=!inside;internals.visible=inside;
    lever.rotation.x=busy?(reduced?.65:.70*Math.sin(Math.PI*Math.min(1,pressPhase))):0;
    bottle.position.set(step===3?.50:0,.372,step===3?.96:.37);bottle.rotation.x=step===3?.12:0;
    bubbles.visible=(step===2&&(busy||presses>0))||(step===3&&presses>0);
    for(let i=0;i<110;i++){const a=i*2.399963,r=.03+(i%13)/13*.32;const y=.33+((i/110*1.33+(reduced?0:time*(busy?.85:.14)))%1.33);dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);dummy.scale.setScalar(busy?1: .6+(i%5)*.08);dummy.updateMatrix();bubbles.setMatrixAt(i,dummy.matrix)}bubbles.instanceMatrix.needsUpdate=true;
    gasPacket.visible=busy;gasPacket.position.copy(path.getPoint(reduced?.5:Math.min(.999,pressPhase)));
  }
  return {root,update};
}
