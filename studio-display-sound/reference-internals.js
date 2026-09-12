import * as THREE from 'three';
// Photo coordinates are traced from iFixit's 1922 × 1081 front-open photograph.
// The image provides positions and surface appearance, not depth measurements.
// Image and this photo-adapted reconstruction: CC BY-NC-SA 3.0; see ATTRIBUTION.md.
const P=(x,y)=>[(x-76)/1768*6.23-3.115,2.61-(y-28)/1021*3.62];
const materials=[];
const tex=new THREE.TextureLoader().load('./assets/ifixit-studio-display-2022-interior.jpg',()=>window.dispatchEvent(new Event('studio-texture-ready')));
tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
function uvPhoto(g){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++){const px=(p.getX(i)+3.115)/6.23*1768+76;const py=(2.61-p.getY(i))/3.62*1021+28;uv.push(px/1922,1-py/1081)}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g}
function poly(parent,pts,depth,z,category,color='#2b3339'){
 const s=new THREE.Shape();pts.forEach(([x,y],i)=>{const p=P(x,y);i?s.lineTo(...p):s.moveTo(...p)});s.closePath();
 const g=uvPhoto(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1}));
 // Photograph only the outward cap. Reverse faces have no observed surface detail.
 g.clearGroups();let groupStart=0,previous=-1;const normals=g.attributes.normal;for(let i=0;i<normals.count;i+=3){const material=normals.getZ(i)>.99?0:1;if(material!==previous){if(i)g.addGroup(groupStart,i-groupStart,previous);groupStart=i;previous=material}}g.addGroup(groupStart,normals.count-groupStart,previous);
 const front=new THREE.MeshBasicMaterial({map:tex,color:'#ffffff',transparent:true,toneMapped:false});
 const sides=new THREE.MeshStandardMaterial({color,metalness:.18,roughness:.62,transparent:true});materials.push({front,sides,category,color});
 const m=new THREE.Mesh(g,[front,sides]);m.position.z=z;m.userData.category=category;parent.add(m);return m;
}
function rect(parent,x,y,w,h,depth,z,cat,color){return poly(parent,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],depth,z,cat,color)}
function disk(parent,cx,cy,r,depth,z,cat,color){const pts=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}return poly(parent,pts,depth,z,cat,color)}
function wire(parent,pts,width,z){const shape=new THREE.Shape();const a=pts.map(([x,y])=>P(x,y));for(let i=0;i<a.length;i++){const p=a[i];i?shape.lineTo(p[0]-width/2,p[1]):shape.moveTo(p[0]-width/2,p[1])}for(let i=a.length-1;i>=0;i--)shape.lineTo(a[i][0]+width/2,a[i][1]);shape.closePath();const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:'#272b2e',roughness:.72}));m.position.z=z;parent.add(m);return m}
export function referenceInternals(parent){
 const root=new THREE.Group();parent.add(root);const chambers=[],drivers=[],electronics=new THREE.Group(),fans=new THREE.Group(),cables=new THREE.Group();root.add(electronics,fans,cables);
 // Main acoustic chamber outlines, including the asymmetrical upper steps.
 for(const pts of [
 [[89,55],[326,55],[328,154],[418,154],[430,167],[430,481],[418,493],[318,493],[308,503],[308,1017],[96,1020],[87,1000]],
 [[1590,55],[1818,55],[1826,72],[1826,1017],[1607,1017],[1607,504],[1595,493],[1491,493],[1491,168],[1502,155],[1590,155]]
 ]){const g=new THREE.Group();root.add(g);poly(g,pts,.12,-.087,'chambers');chambers.push(g)}
 // Visible lower assemblies are photo matched; only the otherwise hidden rear member is conceptual.
 for(let side=0;side<2;side++){
  const chamber=chambers[side],x=side?1626:198,tx=side?1733:114;
  const woofer=rect(chamber,x,837,87,178,.042,.041,'woofers','#181f26');
  const tweeter=rect(chamber,tx,843,66,164,.025,.049,'tweeters','#aeb7be');
  const masks=[];for(const [mx,my,mw,mh]of[[x-2,835,91,182],[tx-2,841,70,168]]){const pos=P(mx+mw/2,my+mh/2),mask=new THREE.Mesh(new THREE.PlaneGeometry(mw/1768*6.23,mh/1021*3.62),new THREE.MeshBasicMaterial({color:'#101519'}));mask.position.set(pos[0],pos[1],.038);chamber.add(mask);mask.visible=false;masks.push(mask)}
  const pos=P(x+43.5,926),rear=new THREE.Mesh(new THREE.BoxGeometry(.275,.53,.018),new THREE.MeshStandardMaterial({color:'#427d92',transparent:true,opacity:.8,roughness:.6}));rear.position.set(pos[0],pos[1],-.07);chamber.add(rear);rear.visible=false;drivers.push({woofer,tweeter,rear,masks});
 }
 // The two fan covers extend upward into their air ducts, exactly as visible in the reference.
 poly(fans,[[332,43],[655,43],[655,176],[669,192],[773,192],[789,208],[789,482],[777,493],[442,493],[431,481],[431,170],[420,154],[345,154],[332,140]],.105,-.083,'fans');
 poly(fans,[[1258,43],[1588,43],[1588,138],[1577,154],[1500,154],[1488,169],[1488,480],[1477,493],[1134,493],[1123,479],[1123,209],[1136,193],[1244,193],[1258,179]],.105,-.083,'fans');
 disk(fans,639,315,88,.022,.024,'fans');disk(fans,1277,315,87,.022,.024,'fans');
 // Split power supply and lower-right logic-board perimeter.
 poly(electronics,[[324,500],[772,500],[788,515],[788,993],[776,1009],[326,1009],[309,991],[309,520]],.029,-.023,'electronics','#373e40');
 poly(electronics,[[1068,500],[1590,500],[1607,513],[1607,724],[1591,741],[1068,741],[1051,724],[1051,516]],.029,-.023,'electronics','#373e40');
 poly(electronics,[[1074,769],[1584,769],[1601,785],[1601,901],[1584,916],[1520,916],[1513,929],[1513,1009],[1426,1009],[1403,990],[1396,918],[1290,918],[1266,943],[1266,1009],[1080,1009],[1064,992],[1064,783]],.023,-.023,'electronics','#354039');
 // Raised components are traced where their outline is clear; heights remain conservative estimates.
 for(const [x,y,w,h,d]of[[341,541,102,129,.058],[622,541,110,130,.058],[467,685,95,58,.045],[442,747,71,47,.04],[479,793,59,64,.04],[648,721,18,132,.044],[674,721,18,134,.044],[701,721,18,134,.044],[728,721,18,134,.044],[1291,548,104,118,.063],[1400,548,106,118,.063],[1536,567,53,22,.045],[1536,596,53,22,.045],[1536,625,53,22,.045],[1536,654,53,22,.045],[1195,791,52,38,.017],[1280,827,37,37,.015],[1135,854,36,28,.016]])rect(electronics,x,y,w,h,d,.009,'electronics','#192024');
 for(const [x,y,r]of[[389,838,35],[510,902,37],[389,934,33],[397,718,34]])disk(electronics,x,y,r,.065,.008,'electronics','#a67439');
 // Flexible ribbon traces are separate surfaces, with source detail preserved.
 poly(cables,[[940,83],[969,83],[985,96],[1034,96],[1080,125],[1080,251],[1058,287],[1012,307],[1009,337],[1063,346],[1098,371],[1110,395],[1105,433],[1070,455],[1030,468],[1030,493],[1003,493],[1003,448],[1018,432],[1054,423],[1060,409],[1049,395],[1007,389],[978,372],[970,348],[978,309],[999,284],[1028,272],[1039,252],[1039,139],[1026,127],[982,127],[967,115],[940,111]],.016,-.018,'cables','#282c2f');
 poly(cables,[[779,553],[802,546],[1053,546],[1061,575],[820,575],[797,581],[787,604],[787,779],[770,779],[770,584]],.025,-.015,'cables');
 poly(cables,[[859,706],[883,697],[939,697],[942,724],[900,724],[885,737],[883,791],[894,819],[927,833],[1056,833],[1078,852],[1068,878],[1050,867],[922,865],[877,850],[853,822],[851,734]],.023,-.016,'cables');
 // Mounting points and center grounding/shield features use photographic surface detail.
 for(const [x,y,w,h] of [[699,125,55,47],[1161,124,55,46],[885,899,120,106]])rect(cables,x,y,w,h,.021,-.055,'cables','#aeb7bf');
 for(const [x,y] of [[341,80],[640,139],[774,208],[778,474],[445,480],[326,514],[775,514],[326,748],[331,991],[774,987],[1066,516],[1590,515],[1590,724],[1080,726],[1066,786],[1588,786],[1570,899],[1079,990],[1140,208],[1140,475],[1474,477],[1572,79],[1790,762],[128,762]])disk(electronics,x,y,8,.025,.052,'fasteners','#939b9f');
 function update(st){
  const focus=st.selection;electronics.visible=focus!=='isolated';fans.visible=focus!=='isolated';cables.visible=focus!=='isolated';
  materials.forEach(({front,sides,category,color})=>{
   const dim=!['all','isolated'].includes(focus)&&category!==focus&&!(focus==='electronics'&&category==='fasteners');front.opacity=sides.opacity=dim?.24:1;
   front.map=st.photoDetail?tex:null;front.color.set(st.photoDetail?'#ffffff':category==='woofers'?'#356c83':category==='tweeters'?'#b7804d':category==='electronics'?'#49574d':color);front.needsUpdate=front.map!==front.userData.lastMap;front.userData.lastMap=front.map;
   if(focus===category)front.color.set('#a9d5e7');
  });
  electronics.position.z=st.explode*.45;fans.position.z=st.explode*.9;cables.position.z=st.explode*.2;chambers.forEach((g,i)=>{g.position.set((i?1:-1)*st.explode*.30,0,st.explode*1.3)});
  drivers.forEach(d=>{d.masks.forEach(m=>m.visible=st.explode>.015);d.woofer.position.z=.041+st.explode*.3;d.tweeter.position.z=.049+st.explode*.3;d.rear.visible=st.explode>.15;d.rear.position.z=-.07-st.explode*.25});
 }
 return{root,chambers,drivers,electronics,fans,cables,update};
}
